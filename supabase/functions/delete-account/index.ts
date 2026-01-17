import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Delete Account Edge Function
 *
 * Allows authenticated users to delete their own account and all associated data.
 * Implements GDPR "right to be forgotten".
 *
 * Data deleted:
 * - User profile (users table)
 * - All analyses
 * - All projects
 * - All payments
 * - All API keys
 * - Stripe subscription (cancelled)
 * - Auth account
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("🗑️ Delete Account - Self-service deletion starting...");

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing userId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // First verify the user is authenticated and requesting to delete their OWN account
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // CRITICAL: Verify user is deleting their OWN account
    if (user.id !== userId) {
      console.error("❌ User attempted to delete another user's account");
      return new Response(
        JSON.stringify({ success: false, error: "You can only delete your own account" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ User verified, deleting account:", user.email);

    // Create admin client for deletion operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Get user data for Stripe cleanup
    const { data: userData, error: profileError } = await supabaseAdmin
      .from('users')
      .select('stripe_subscription_id, stripe_customer_id, is_admin')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.warn("⚠️ Could not fetch user profile:", profileError);
    }

    // Prevent admin self-deletion (admins should be demoted first)
    if (userData?.is_admin) {
      return new Response(
        JSON.stringify({ success: false, error: "Admin accounts cannot self-delete. Please contact support." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cancel Stripe subscription if exists
    if (userData?.stripe_subscription_id) {
      console.log("💳 Cancelling Stripe subscription:", userData.stripe_subscription_id);

      const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (stripeSecretKey) {
        try {
          const response = await fetch(
            `https://api.stripe.com/v1/subscriptions/${userData.stripe_subscription_id}`,
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
            if (errorData.error?.code === 'resource_missing') {
              console.log("ℹ️ Stripe subscription already cancelled");
            } else {
              console.warn("⚠️ Failed to cancel Stripe subscription:", errorData.error?.message);
            }
          }
        } catch (stripeError) {
          console.warn("⚠️ Error calling Stripe API:", stripeError);
        }
      }
    }

    // Delete all user data (order matters due to foreign key constraints)
    const tables = [
      'fraud_checks',
      'api_usage',
      'api_keys',
      'analyses',
      'projects',
      'payments',
    ];

    for (const table of tables) {
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.warn(`⚠️ Error deleting from ${table}:`, error.message);
      } else {
        console.log(`✅ Deleted from ${table}`);
      }
    }

    // Delete user profile
    const { error: deleteUserError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteUserError) {
      console.error("❌ Error deleting user profile:", deleteUserError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to delete user profile" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete from Supabase Auth
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error("❌ Error deleting auth account:", authDeleteError);
      // Profile already deleted, return partial success
      return new Response(
        JSON.stringify({
          success: true,
          warning: "Profile deleted but auth cleanup pending",
          message: "Your account data has been deleted."
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Account fully deleted:", user.email);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Your account and all associated data have been permanently deleted."
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Delete account error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
