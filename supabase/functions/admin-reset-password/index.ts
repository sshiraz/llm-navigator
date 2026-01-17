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

  console.log("🔑 Admin Reset Password - Starting...");

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

    const { targetUserId, newPassword } = await req.json();

    console.log("📋 Request data:", { targetUserId, adminUserId, passwordLength: newPassword?.length });

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: "Missing targetUserId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!newPassword || newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
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

    // Get the target user
    const { data: targetUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, is_admin')
      .eq('id', targetUserId)
      .single();

    if (userError || !targetUser) {
      console.error("❌ Target user not found:", userError);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent resetting password for admin accounts
    if (targetUser.is_admin) {
      console.error("❌ Cannot reset password for admin account:", targetUser.email);
      return new Response(
        JSON.stringify({ error: "Cannot reset password for admin accounts" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("🔑 Resetting password for user:", targetUser.email);

    // Update the user's password using Supabase Admin API
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUserId,
      { password: newPassword }
    );

    if (updateError) {
      console.error("❌ Error resetting password:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to reset password", details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Password reset successful for:", targetUser.email);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully reset password for ${targetUser.email}`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Admin reset password error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
