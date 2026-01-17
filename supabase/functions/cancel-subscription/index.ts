import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { getCorsHeaders, handleCorsPreflightWithValidation, validateOrigin } from "../_shared/cors.ts";
import { verifyUserFromJwt } from "../_shared/apiAuth.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  const preflightResponse = handleCorsPreflightWithValidation(req);
  if (preflightResponse) return preflightResponse;

  // Validate origin
  const originError = validateOrigin(req);
  if (originError) return originError;

  console.log("🔄 Cancel Subscription - Starting...");

  try {
    // SECURITY: Verify user identity from JWT token, not from request body
    const authResult = await verifyUserFromJwt(req);
    if (!authResult.success) {
      console.error("❌ SECURITY: Authentication failed:", authResult.error);
      return new Response(
        JSON.stringify({ error: authResult.error }),
        { status: authResult.status || 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // User can only cancel their own subscription
    const userId = authResult.userId!;
    console.log("✅ Authenticated user:", authResult.email);

    // subscriptionId is optional - can be provided for specific subscription
    const { subscriptionId } = await req.json().catch(() => ({}));

    console.log("📋 Request data:", { userId, subscriptionId });

    // Get environment variables
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Missing environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Get user from database to find their Stripe subscription
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error("❌ User not found:", userError);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("👤 User found:", {
      id: user.id,
      subscription: user.subscription,
      stripeSubscriptionId: user.stripe_subscription_id
    });

    // Use provided subscriptionId or get from user record
    const stripeSubscriptionId = subscriptionId || user.stripe_subscription_id;

    if (!stripeSubscriptionId) {
      // If no Stripe subscription ID, just update the user record to cancel immediately
      console.log("⚠️ No Stripe subscription ID found, cancelling locally");

      const { error: updateError } = await supabase
        .from('users')
        .update({
          subscription: 'trial',
          cancel_at_period_end: false,
          subscription_ends_at: null,
          stripe_subscription_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error("❌ Error updating user:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to cancel subscription" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Subscription cancelled immediately",
          cancelAtPeriodEnd: false,
          subscriptionEndsAt: null
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cancel the Stripe subscription at period end
    console.log("🔄 Cancelling Stripe subscription:", stripeSubscriptionId);

    try {
      const subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      console.log("✅ Stripe subscription updated:", {
        id: subscription.id,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        current_period_end: subscription.current_period_end
      });

      // Calculate the end date
      const subscriptionEndsAt = new Date(subscription.current_period_end * 1000).toISOString();

      // Update user record
      const { error: updateError } = await supabase
        .from('users')
        .update({
          cancel_at_period_end: true,
          subscription_ends_at: subscriptionEndsAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error("❌ Error updating user:", updateError);
        // Don't fail - the Stripe cancellation succeeded
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Subscription will cancel at end of billing period",
          cancelAtPeriodEnd: true,
          subscriptionEndsAt: subscriptionEndsAt
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (stripeError) {
      console.error("❌ Stripe error:", stripeError);

      // If subscription not found in Stripe, cancel locally
      if (stripeError.code === 'resource_missing') {
        console.log("⚠️ Subscription not found in Stripe, cancelling locally");

        const { error: updateError } = await supabase
          .from('users')
          .update({
            subscription: 'trial',
            cancel_at_period_end: false,
            subscription_ends_at: null,
            stripe_subscription_id: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (updateError) {
          console.error("❌ Error updating user:", updateError);
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: "Subscription cancelled",
            cancelAtPeriodEnd: false,
            subscriptionEndsAt: null
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to cancel subscription", details: stripeError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("❌ Cancel subscription error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
