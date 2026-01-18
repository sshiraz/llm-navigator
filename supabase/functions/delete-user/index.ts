import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightWithValidation, validateOrigin } from "../_shared/cors.ts";
import { verifyAdminFromJwt } from "../_shared/apiAuth.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  const preflightResponse = handleCorsPreflightWithValidation(req);
  if (preflightResponse) return preflightResponse;

  // Validate origin
  const originError = validateOrigin(req);
  if (originError) return originError;

  console.log("🗑️ Delete User - Starting...");

  try {
    // SECURITY: Verify admin identity from JWT token, not from request body
    const authResult = await verifyAdminFromJwt(req);
    if (!authResult.success) {
      console.error("❌ SECURITY: Admin authentication failed:", authResult.error);
      return new Response(
        JSON.stringify({ error: authResult.error }),
        { status: authResult.status || 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminUserId = authResult.userId!;
    console.log("✅ Admin verified from JWT:", authResult.email);

    const { userIdToDelete } = await req.json();

    console.log("📋 Request data:", { userIdToDelete, adminUserId });

    if (!userIdToDelete) {
      return new Response(
        JSON.stringify({ error: "Missing userIdToDelete" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Missing environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Get the user to delete
    // Query only columns that definitely exist - stripe info is in payments table
    const { data: userToDelete, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('id', userIdToDelete)
      .single();

    if (userError || !userToDelete) {
      console.error("❌ User to delete not found:", userError);
      return new Response(
        JSON.stringify({ error: "User not found", details: userError?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin (column may not exist, so we handle gracefully)
    const { data: adminCheck } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', userIdToDelete)
      .single();

    if (adminCheck?.is_admin) {
      console.error("❌ Cannot delete admin account:", userToDelete.email);
      return new Response(
        JSON.stringify({ error: "Cannot delete admin accounts" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Stripe subscription ID from payments table if exists
    const { data: paymentData } = await supabaseAdmin
      .from('payments')
      .select('stripe_subscription_id')
      .eq('user_id', userIdToDelete)
      .not('stripe_subscription_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log("🗑️ Deleting user:", userToDelete.email);

    // Cancel Stripe subscription if exists
    const stripeSubscriptionId = paymentData?.stripe_subscription_id;
    if (stripeSubscriptionId) {
      console.log("💳 Cancelling Stripe subscription:", stripeSubscriptionId);

      const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (stripeSecretKey) {
        try {
          const response = await fetch(
            `https://api.stripe.com/v1/subscriptions/${stripeSubscriptionId}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${stripeSecretKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            }
          );

          if (response.ok) {
            console.log("✅ Stripe subscription cancelled");
          } else {
            const errorData = await response.json();
            // Don't fail the whole operation if subscription is already cancelled or doesn't exist
            if (errorData.error?.code === 'resource_missing') {
              console.log("ℹ️ Stripe subscription already cancelled or doesn't exist");
            } else {
              console.warn("⚠️ Failed to cancel Stripe subscription:", errorData.error?.message);
            }
          }
        } catch (stripeError) {
          console.warn("⚠️ Error calling Stripe API:", stripeError);
          // Continue with deletion even if Stripe call fails
        }
      } else {
        console.warn("⚠️ STRIPE_SECRET_KEY not set, skipping subscription cancellation");
      }
    } else {
      console.log("ℹ️ No Stripe subscription to cancel");
    }

    // Delete related data first (due to foreign key constraints)
    // Delete analyses
    const { error: analysesError } = await supabaseAdmin
      .from('analyses')
      .delete()
      .eq('user_id', userIdToDelete);

    if (analysesError) {
      console.warn("⚠️ Error deleting analyses:", analysesError);
    }

    // Delete projects (this will cascade to competitors)
    const { error: projectsError } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('user_id', userIdToDelete);

    if (projectsError) {
      console.warn("⚠️ Error deleting projects:", projectsError);
    }

    // Delete payments
    const { error: paymentsError } = await supabaseAdmin
      .from('payments')
      .delete()
      .eq('user_id', userIdToDelete);

    if (paymentsError) {
      console.warn("⚠️ Error deleting payments:", paymentsError);
    }

    // Delete API keys
    const { error: apiKeysError } = await supabaseAdmin
      .from('api_keys')
      .delete()
      .eq('user_id', userIdToDelete);

    if (apiKeysError) {
      console.warn("⚠️ Error deleting API keys:", apiKeysError);
    }

    // Delete from users table
    const { error: deleteUserError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userIdToDelete);

    if (deleteUserError) {
      console.error("❌ Error deleting from users table:", deleteUserError);
      return new Response(
        JSON.stringify({ error: "Failed to delete user profile", details: deleteUserError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete from Supabase Auth
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete);

    if (authDeleteError) {
      console.error("❌ Error deleting from auth:", authDeleteError);
      // User is already deleted from users table, so we should still return success
      // but log the auth deletion failure
      return new Response(
        JSON.stringify({
          success: true,
          warning: "User profile deleted but auth deletion failed",
          message: `Successfully deleted user ${userToDelete.email} from database. Auth cleanup may be needed.`
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ User fully deleted:", userToDelete.email);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully deleted user ${userToDelete.email}`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Delete user error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
