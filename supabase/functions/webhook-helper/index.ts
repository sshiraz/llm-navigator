import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightWithValidation, validateOrigin } from "../_shared/cors.ts";

// Helper to verify admin from JWT token
async function verifyAdmin(req: Request, supabase: any): Promise<{ isAdmin: boolean; userId?: string; error?: string }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { isAdmin: false, error: "Missing or invalid Authorization header" };
  }

  const token = authHeader.replace("Bearer ", "");

  // Create a client with the user's token to verify their identity
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    return { isAdmin: false, error: "Missing Supabase configuration" };
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { data: { user }, error: authError } = await userClient.auth.getUser();

  if (authError || !user) {
    return { isAdmin: false, error: "Invalid or expired token" };
  }

  // Check if user is admin using service role client
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (userError || !userData?.is_admin) {
    return { isAdmin: false, userId: user.id, error: "User is not an admin" };
  }

  return { isAdmin: true, userId: user.id };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  const preflightResponse = handleCorsPreflightWithValidation(req);
  if (preflightResponse) return preflightResponse;

  // Validate origin
  const originError = validateOrigin(req);
  if (originError) return originError;

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          error: "Missing Supabase configuration",
          message: "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request data
    const { action, userId, plan } = await req.json();

    if (action === "check_webhook") {
      // Return environment status
      return new Response(
        JSON.stringify({
          status: "ok",
          environment: {
            supabaseUrl: supabaseUrl ? "Set" : "Missing",
            supabaseServiceKey: supabaseServiceKey ? "Set" : "Missing",
            stripeSecretKey: Deno.env.get("STRIPE_SECRET_KEY") ? "Set" : "Missing",
            webhookSecret: Deno.env.get("STRIPE_WEBHOOK_SECRET") ? "Set" : "Missing",
          }
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        }
      );
    } else if (action === "fix_subscription" && userId && plan) {
      // SECURITY: Require admin authentication for subscription modifications
      const adminCheck = await verifyAdmin(req, supabase);
      if (!adminCheck.isAdmin) {
        console.error(`❌ SECURITY: Unauthorized fix_subscription attempt: ${adminCheck.error}`);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Unauthorized",
            message: adminCheck.error || "Admin authentication required"
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 403
          }
        );
      }

      console.log(`✅ Admin ${adminCheck.userId} authorized to fix subscription for user ${userId}`);

      // Manually update user subscription
      const { data, error } = await supabase
        .from('users')
        .update({
          subscription: plan,
          payment_method_added: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select();

      if (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: error.message
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400
          }
        );
      }

      // Log the payment in payments table
      const paymentData = {
        user_id: userId,
        stripe_payment_intent_id: `manual_fix_${Date.now()}`,
        plan,
        amount: plan === 'starter' ? 2900 : plan === 'professional' ? 9900 : 29900,
        currency: 'usd',
        status: 'succeeded',
        created_at: new Date().toISOString()
      };

      await supabase.from('payments').insert(paymentData);

      // Log the admin action in audit logs
      try {
        await supabase.from('audit_logs').insert({
          user_id: adminCheck.userId,
          event_type: 'admin.fix_subscription',
          event_category: 'admin',
          description: `Admin fixed subscription for user ${userId} to ${plan}`,
          metadata: { targetUserId: userId, plan },
          status: 'success'
        });
      } catch (auditError) {
        console.warn("⚠️ Failed to log audit event:", auditError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Subscription successfully updated to ${plan}`,
          data
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        error: "Invalid action",
        message: "Supported actions: check_webhook, fix_subscription" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});