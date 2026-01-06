import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightWithValidation, validateOrigin } from "../_shared/cors.ts";

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
    const { userIdToDelete, adminUserId } = await req.json();

    console.log("📋 Request data:", { userIdToDelete, adminUserId });

    if (!userIdToDelete) {
      return new Response(
        JSON.stringify({ error: "Missing userIdToDelete" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!adminUserId) {
      return new Response(
        JSON.stringify({ error: "Missing adminUserId" }),
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

    // Verify the requesting user is an admin
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('users')
      .select('id, email, is_admin')
      .eq('id', adminUserId)
      .single();

    if (adminError || !adminUser) {
      console.error("❌ Admin user not found:", adminError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Admin not found" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!adminUser.is_admin) {
      console.error("❌ User is not an admin:", adminUser.email);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Not an admin" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Admin verified:", adminUser.email);

    // Get the user to delete
    const { data: userToDelete, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, is_admin')
      .eq('id', userIdToDelete)
      .single();

    if (userError || !userToDelete) {
      console.error("❌ User to delete not found:", userError);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent deleting admin accounts
    if (userToDelete.is_admin) {
      console.error("❌ Cannot delete admin account:", userToDelete.email);
      return new Response(
        JSON.stringify({ error: "Cannot delete admin accounts" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("🗑️ Deleting user:", userToDelete.email);

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
