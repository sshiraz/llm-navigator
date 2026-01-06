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

    // Initialize Supabase client
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