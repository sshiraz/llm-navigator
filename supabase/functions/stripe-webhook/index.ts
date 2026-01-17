import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { v4 as uuidv4 } from "https://esm.sh/uuid@11.0.0";

// CORS headers for Stripe webhook
// Note: Stripe webhooks come from Stripe's servers without origin header,
// so we don't restrict origin for this endpoint - only Stripe can call it with valid signatures
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature, x-webhook-signature, x-stripe-signature, webhook-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// SECURITY: Test mode bypass is DISABLED by default
// Only enable in development environments with explicit env var
const ALLOW_TEST_BYPASS = Deno.env.get("ALLOW_WEBHOOK_TEST_BYPASS") === "true" &&
                          Deno.env.get("ENVIRONMENT") === "development";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("🔥 WEBHOOK RECEIVED - Starting processing...");

  // Check if this is a live mode webhook
  let isLiveMode = req.headers.get("stripe-mode") === "live" || 
                   req.headers.get("x-stripe-mode") === "live";
  
  if (isLiveMode) {
    console.log("🔴 LIVE MODE WEBHOOK - Processing real payment");
  }
  
  // Log request details but sanitize sensitive information
  const sanitizedHeaders = Object.fromEntries(
    Array.from(req.headers.entries()).map(([key, value]) => {
      // Mask sensitive values but show part of them for debugging
      if (key.toLowerCase() === "authorization" || key.toLowerCase() === "stripe-signature") {
        return [key, value.substring(0, 10) + "..."];
      }
      return [key, value];
    })
  );
  
  console.log("📋 Request method:", req.method);
  console.log("📋 Request headers:", sanitizedHeaders);
  
  try {
    const signature = req.headers.get("stripe-signature");
    // Check all possible signature header variations
    const altSignature = req.headers.get("x-stripe-signature");
    const webhookSignature = req.headers.get("webhook-signature");
    const xWebhookSignature = req.headers.get("x-webhook-signature");
    const finalSignature = signature || altSignature || webhookSignature || xWebhookSignature;
    const body = await req.text();
    
    // Check if we're in live mode
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    // Update isLiveMode if the key starts with sk_live_
    isLiveMode = isLiveMode || stripeSecretKey.startsWith('sk_live_');
    
    // Use the appropriate webhook secret based on mode
    const testWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const liveWebhookSecret = Deno.env.get("STRIPE_LIVE_WEBHOOK_SECRET");
    const webhookSecret = (isLiveMode && liveWebhookSecret) ? liveWebhookSecret : testWebhookSecret;
    
    console.log("📝 Request details:", {
      hasSignature: !!finalSignature,
      bodyLength: body ? body.length : 0,
      method: req.method,
      signaturePreview: finalSignature ? finalSignature.substring(0, 10) + "..." : "none",
      mode: isLiveMode ? "LIVE" : "TEST"
    });
    
    if (!finalSignature) {
      console.warn("⚠️ No stripe signature found in headers");
      // SECURITY: Reject all requests without valid Stripe signature
      // Test bypass only allowed in development with explicit env vars
      if (ALLOW_TEST_BYPASS) {
        console.log("🧪 [DEV ONLY] Test bypass enabled - proceeding without signature");
      } else {
        console.error("❌ SECURITY: Rejecting request without valid Stripe signature");
        return new Response(
          JSON.stringify({
            error: "No stripe signature found in headers",
            message: "Valid Stripe webhook signature is required. Test bypass is disabled in production."
          }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); 

    console.log(`🔑 Mode: ${isLiveMode ? '🔴 LIVE MODE' : '🟢 TEST MODE'}`);

    // Use the appropriate webhook secret (liveWebhookSecret already defined above)
    const finalWebhookSecret = (isLiveMode && liveWebhookSecret) ? liveWebhookSecret : webhookSecret;
    
    // If we're missing the Supabase URL, try to get it from the request URL
    let derivedSupabaseUrl = supabaseUrl;
    if (!derivedSupabaseUrl) {
      try {
        const requestUrl = new URL(req.url);
        derivedSupabaseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
        console.log("🔍 Derived Supabase URL from request:", derivedSupabaseUrl);
      } catch (error) {
        console.error("❌ Failed to derive Supabase URL from request:", error);
      }
    }

    console.log("🔑 Environment check:", {
      hasStripeKey: !!stripeSecretKey,
      hasWebhookSecret: !!finalWebhookSecret,
      hasSupabaseUrl: !!derivedSupabaseUrl, 
      hasServiceKey: !!supabaseServiceKey,
      stripeKeyPrefix: stripeSecretKey ? stripeSecretKey.substring(0, 7) + "..." : "none",
      webhookSecretPrefix: webhookSecret ? webhookSecret.substring(0, 7) + "..." : "none",
      mode: isLiveMode ? "LIVE" : "TEST"
    });

    if (!stripeSecretKey) {
      console.error("❌ Missing STRIPE_SECRET_KEY environment variable");
      return new Response(
        JSON.stringify({ error: "Missing Stripe secret key" }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    if (!finalWebhookSecret) {
      console.error(`❌ Missing ${isLiveMode ? 'STRIPE_LIVE_WEBHOOK_SECRET' : 'STRIPE_WEBHOOK_SECRET'} environment variable`);
      return new Response(
        JSON.stringify({ error: "Missing webhook secret" }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    if (!derivedSupabaseUrl || !supabaseServiceKey) {
      console.error("❌ Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Missing Supabase configuration" }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Initialize Supabase with service role key
    const supabase = createClient(derivedSupabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false, 
        persistSession: false,
        detectSessionInUrl: false
      }
    });

    let event: Stripe.Event;

    try {
      console.log("🔐 Attempting to verify webhook signature...");

      try {
        if (ALLOW_TEST_BYPASS && !isLiveMode && !finalSignature) {
          // SECURITY: Only in development with explicit env vars AND no signature provided
          try {
            const jsonBody = JSON.parse(body);
            console.log("🧪 [DEV ONLY] Creating mock event for testing");
            event = {
              type: jsonBody.type || "test_event",
              id: "test_" + Date.now(),
              created: Math.floor(Date.now() / 1000),
              data: {
                object: jsonBody.data?.object || {
                  id: "test_pi_" + Date.now(),
                  metadata: {
                    userId: jsonBody.data?.object?.metadata?.userId || "test-user",
                    plan: jsonBody.data?.object?.metadata?.plan || "starter"
                  },
                  amount: 2900,
                  currency: "usd",
                  status: "succeeded"
                }
              },
              livemode: false
            } as Stripe.Event;

            console.log("✅ [DEV ONLY] Created mock event:", {
              type: event.type,
              id: event.id
            });
          } catch (jsonError) {
            console.error("❌ Failed to parse test request body:", jsonError);
            throw new Error("Invalid test request format");
          }
        } else {
          // PRODUCTION: Always verify the signature
          event = stripe.webhooks.constructEvent(body, finalSignature || "", finalWebhookSecret);
          console.log("✅ Webhook signature verified successfully!");
          console.log("📋 Event details:", {
            type: event.type,
            id: event.id,
            created: new Date(event.created * 1000).toISOString(),
            livemode: event.livemode
          });
        }
      } catch (signatureError) {
        // SECURITY: In production, always reject invalid signatures
        if (ALLOW_TEST_BYPASS && !isLiveMode) {
          try {
            const jsonBody = JSON.parse(body);
            console.log("🧪 [DEV ONLY] Signature verification failed, using test bypass");
            event = {
              type: jsonBody.type || "test_event",
              id: "test_" + Date.now(),
              created: Math.floor(Date.now() / 1000),
              data: { object: jsonBody },
              livemode: false
            } as Stripe.Event;
          } catch (jsonError) {
            throw signatureError;
          }
        } else {
          throw signatureError; // Re-throw in production
        }
      }
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", {
        error: err.message,
        signatureReceived: finalSignature ? finalSignature.substring(0, 10) + "..." : "none",
        webhookSecretUsed: finalWebhookSecret ? finalWebhookSecret.substring(0, 7) + "..." : "none",
        bodyLength: body.length
      });
      return new Response(
        JSON.stringify({ 
          error: "Webhook signature verification failed",
          details: err.message 
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Process the event
    try {
      console.log(`🎯 Processing event: ${event.type}`);
      
      // Log if we're in live mode
      if (event.livemode) {
        console.log("🔴 LIVE MODE EVENT - Processing real payment");
      }

      // SECURITY: Only allow test events in development mode with explicit bypass
      if (event.type === "test_event" && ALLOW_TEST_BYPASS && !isLiveMode) {
        console.log("🧪 [DEV ONLY] Test event processed successfully");
        return new Response(
          JSON.stringify({
            received: true,
            message: "[DEV ONLY] Test event processed successfully",
            eventType: event.type,
            eventId: event.id
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      switch (event.type) {
        case "checkout.session.completed":
          console.log("🛒 Processing checkout.session.completed");
          const session = event.data.object as Stripe.Checkout.Session;
          console.log("🛒 Checkout Session details:", {
            id: session.id,
            payment_status: session.payment_status,
            customer: session.customer || "none",
            metadata: session.metadata || {},
            liveMode: isLiveMode || event.livemode
          });
          await handleCheckoutSessionCompleted(session, supabase);
          break;

        case "payment_intent.succeeded":
          console.log("💰 Processing payment_intent.succeeded");
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log("💳 Payment Intent details:", {
            id: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency || "usd",
            status: paymentIntent.status,
            metadata: paymentIntent.metadata || {},
            liveMode: isLiveMode || event.livemode
          });
          await handlePaymentSuccess(paymentIntent, supabase);
          break;

        case "customer.subscription.created":
        case "customer.subscription.updated":
          console.log(`📋 Processing ${event.type}`);
          const subscription = event.data.object as Stripe.Subscription;
          console.log("📋 Subscription details:", {
            id: subscription.id,
            status: subscription.status,
            metadata: subscription.metadata || {},
            liveMode: isLiveMode || event.livemode
          });
          await handleSubscriptionChange(subscription, supabase);
          break;

        case "customer.subscription.deleted":
          console.log("🗑️ Processing subscription deletion");
          const deletedSubscription = event.data.object as Stripe.Subscription;
          console.log("🗑️ Subscription deletion details:", {
            id: deletedSubscription.id,
            status: deletedSubscription.status,
            metadata: deletedSubscription.metadata || {},
            liveMode: isLiveMode || event.livemode
          });
          await handleSubscriptionCancellation(deletedSubscription, supabase);
          break;

        case "invoice.payment_failed":
          console.log("❌ Processing payment failure");
          const failedInvoice = event.data.object as Stripe.Invoice;
          console.log("❌ Failed invoice details:", {
            id: failedInvoice.id,
            amount_due: failedInvoice.amount_due,
            status: failedInvoice.status,
            liveMode: isLiveMode || event.livemode
          });
          await handlePaymentFailure(failedInvoice, supabase);
          break;

        default:
          console.log(`ℹ️ Unhandled event type: ${event.type}`);
      }

      console.log("✅ Webhook processed successfully");
      return new Response(
        JSON.stringify({ 
          received: true, 
          eventType: event.type || "unknown",
          eventId: event.id || "unknown",
          liveMode: isLiveMode || event.livemode || false
        }), 
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      console.error("❌ Webhook handler error:", {
        error: error.message,
        stack: error.stack,
        eventType: event?.type,
        eventId: event?.id
      });
      return new Response(
        JSON.stringify({ 
          error: "Webhook handler error",
          details: error.message 
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
  } catch (error) {
    console.error("❌ Webhook processing error:", {
      error: error.message,
      stack: error.stack
    });
    return new Response(
      JSON.stringify({ 
        error: "Webhook processing error",
        details: error.message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
    );
  }
});

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, supabase: any) {
  console.log("🛒 Starting handleCheckoutSessionCompleted");

  // Check if this is a live mode session
  const isLiveMode = session.livemode === true;
  if (isLiveMode) {
    console.log("🔴 LIVE MODE SESSION - Processing real payment");
  }
  
  const userId = session.metadata?.userId || session.client_reference_id;
  const plan = session.metadata?.plan;
  const email = session.customer_details?.email;
  
  console.log("🛒 Checkout session metadata:", {
    userId,
    plan,
    email,
    sessionId: session.id || "unknown",
    paymentStatus: session.payment_status || "unknown",
    liveMode: isLiveMode
  });

  if (!userId || !plan) {
    console.error("❌ Missing userId or plan in checkout session metadata");
    throw new Error("Missing required metadata: userId or plan");
  }

  if (session.payment_status !== "paid") {
    console.log("⏳ Payment not yet completed, skipping user update");
    return;
  }

  try {
    // Check if user is an admin - admins have automatic enterprise and shouldn't be modified by Stripe webhooks
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle();

    if (userData?.is_admin) {
      console.log("👑 User is admin - skipping checkout update (admin accounts have automatic enterprise)");
      return;
    }

    // Update user subscription and store Stripe IDs
    console.log("💾 Updating user subscription from checkout session...");
    const { data: updatedUser, error: userError } = await supabase
      .from('users')
      .update({
        subscription: plan,
        payment_method_added: true,
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        cancel_at_period_end: false,
        subscription_ends_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select();

    if (userError) {
      console.error("❌ Error updating user from checkout session:", userError);
      throw userError;
    }

    // Log the payment in payment_logs table
    try {
      await supabase.from('payment_logs').insert({
        event_type: 'checkout.session.completed',
        event_id: session.id,
        payment_intent_id: session.payment_intent,
        subscription_id: session.subscription,
        user_id: userId,
        amount: session.amount_total,
        currency: session.currency,
        status: session.payment_status,
        live_mode: isLiveMode,
        metadata: session.metadata
      });
    } catch (logError) {
      console.warn("⚠️ Failed to log payment event:", logError);
    }

    console.log("✅ Successfully updated user from checkout session:", updatedUser);
  } catch (error) {
    console.error("💥 Error in handleCheckoutSessionCompleted:", error);
    throw error;
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  console.log("🎯 Starting handlePaymentSuccess");
  console.log("🔍 Payment Intent ID:", paymentIntent?.id || "unknown");

  // Check if this is a live mode payment
  const isLiveMode = paymentIntent.livemode === true;
  if (isLiveMode) {
    console.log("🔴 LIVE MODE PAYMENT - Processing real payment");
  }
  
  // Log payment intent details but sanitize sensitive information
  const sanitizedPaymentIntent = {
    id: paymentIntent?.id || "unknown",
    amount: paymentIntent?.amount || 0,
    currency: paymentIntent?.currency || "usd",
    status: paymentIntent?.status || "unknown", 
    metadata: paymentIntent?.metadata || {},
    created: paymentIntent?.created || Math.floor(Date.now() / 1000),
    customer: paymentIntent?.customer || null,
    liveMode: isLiveMode
  };
  
  console.log("💰 Payment Intent Details:", JSON.stringify(sanitizedPaymentIntent, null, 2));
  
  const userId = paymentIntent?.metadata?.userId;
  const plan = paymentIntent?.metadata?.plan;
  const email = paymentIntent?.metadata?.email;
  const amount = paymentIntent?.amount || 0;

  console.log("📊 Extracted metadata:", {
    userId,
    plan,
    email,
    amount: amount || 0,
    amountInDollars: amount ? amount / 100 : 0,
    liveMode: isLiveMode
  });

  if (!userId || !plan) {
    console.error("❌ Missing userId or plan in payment intent metadata:", paymentIntent.metadata);

    // Try to extract from client_reference_id if available
    const clientReferenceId = paymentIntent?.client_reference_id;
    if (clientReferenceId) {
      console.log("🔍 Found client_reference_id, using as userId:", clientReferenceId);
      // Use a variable that won't conflict with the const declaration
      const extractedUserId = clientReferenceId;
      
      // If we still don't have a plan, default to starter
      const extractedPlan = plan || "starter";
      
      // Continue with these extracted values
      return handlePaymentSuccessWithExtractedData(extractedUserId, extractedPlan, amount, paymentIntent?.currency || "usd", supabase);
    } else {
      console.error("Available metadata keys:", Object.keys(paymentIntent?.metadata || {}));
      return new Response(
        JSON.stringify({ 
          error: "Missing required metadata",
          details: "userId and plan are required in payment intent metadata"
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
  }

  // Determine plan based on amount if plan is not set correctly
  let finalPlan = plan;
  if (amount === 2900) { // $29.00
    finalPlan = "starter";
    console.log("💡 Amount is $29.00 - setting plan to starter");
  } else if (amount === 9900) { // $99.00
    finalPlan = "professional";
    console.log("💡 Amount is $99.00 - setting plan to professional");
  } else if (amount === 29900) { // $299.00
    finalPlan = "enterprise";
    console.log("💡 Amount is $299.00 - setting plan to enterprise");
  }

  console.log(`🎯 Final plan determined: ${finalPlan}`);

  try {
    // First, check if this payment has already been processed
    console.log("🔍 Checking if payment has already been processed...");
    const { data: existingPayment, error: paymentCheckError } = await supabase
      .from('payments')
      .select("id, status")
      .eq("stripe_payment_intent_id", paymentIntent.id)
      .maybeSingle();
    
    if (paymentCheckError) {
      console.warn("⚠️ Error checking existing payment:", paymentCheckError);
      // Continue processing as this is non-fatal
    } else if (existingPayment) {
      console.log("⚠️ Payment already processed:", existingPayment);
      // Still continue to ensure user subscription is updated
    }
    
    // Check if user exists
    console.log("🔍 Looking up user in database...");
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select("id, email, subscription, payment_method_added")
      .eq("id", userId)
      .maybeSingle();
    
    if (fetchError) {
      console.error("❌ Error fetching user:", fetchError);
      // Continue anyway - we'll try to update based on userId
    } else if (existingUser) {
      console.log("👤 Found user:", {
        id: existingUser.id,
        email: existingUser.email,
        currentSubscription: existingUser.subscription,
        paymentMethodAdded: existingUser.payment_method_added
      });
    } else {
      console.warn("⚠️ User not found in database:", userId);
      // Continue anyway - the update will fail if user doesn't exist
    }

    // Update user subscription
    console.log("💾 Updating user subscription in database...");
    const { data: updatedUser, error: userError } = await supabase
      .from('users')
      .update({
        subscription: finalPlan,
        payment_method_added: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select();

    if (userError && userError.code === "PGRST116") {
      console.error("❌ User not found during update:", userError);
      throw new Error(`User with ID ${userId} not found`);
    } else if (userError) {
      console.error("❌ Error updating user subscription:", userError);
      throw userError;
    }

    console.log("✅ Successfully updated user:", updatedUser);

    // Log payment
    console.log("📝 Logging payment record...");
    const { data: paymentRecord, error: paymentError } = await supabase
      .from("payments")
      .upsert(
        {
          user_id: userId,
          stripe_payment_intent_id: paymentIntent.id,
          plan: finalPlan,
          amount,
          currency: paymentIntent.currency,
          status: "succeeded",
          created_at: new Date().toISOString(),
          live_mode: isLiveMode,
          webhook_event_id: uuidv4() // Generate a unique ID for idempotency
        },
        { 
          onConflict: "stripe_payment_intent_id",
          ignoreDuplicates: false // Update if exists
        }
      )
      .select();

    if (paymentError) {
      console.error("❌ Error logging payment:", paymentError);
      // Don't throw here as the main subscription update succeeded
    } else {
      console.log("✅ Payment logged successfully:", paymentRecord);
    }

    // Log the payment in payment_logs table
    try {
      await supabase.from('payment_logs').insert({
        event_type: 'payment_intent.succeeded',
        event_id: uuidv4(),
        payment_intent_id: paymentIntent.id,
        user_id: userId,
        amount: amount,
        currency: paymentIntent.currency,
        status: "succeeded",
        live_mode: isLiveMode,
        metadata: paymentIntent.metadata
      });
    } catch (logError) {
      console.warn("⚠️ Failed to log payment event:", logError);
    }

    console.log("🎉 Payment success handled completely!");
  } catch (error) {
    console.error("💥 Error in handlePaymentSuccess:", {
      error: error.message,
      stack: error.stack,
      userId,
      plan: finalPlan
    });
    throw error;
  }
}

// Helper function to handle payment success with extracted data
async function handlePaymentSuccessWithExtractedData(
  userId: string,
  plan: string,
  amount: number,
  currency: string,
  supabase: any
) {
  console.log("🎯 Starting handlePaymentSuccessWithExtractedData");
  console.log("📊 Using extracted data:", { userId, plan, amount });

  try {
    // Update user subscription
    console.log("💾 Updating user subscription in database...");
    const { data: updatedUser, error: userError } = await supabase
      .from('users')
      .update({
        subscription: plan,
        payment_method_added: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select();

    if (userError) {
      console.error("❌ Error updating user subscription:", userError);
      throw userError;
    }

    console.log("✅ Successfully updated user:", updatedUser);

    // Log payment with generated ID
    console.log("📝 Logging payment record...");
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payments')
      .upsert(
        {
          user_id: userId,
          stripe_payment_intent_id: `manual_${Date.now()}`,
          plan: plan,
          amount: amount,
          currency: currency,
          status: "succeeded",
          created_at: new Date().toISOString()
        },
        { 
          onConflict: "stripe_payment_intent_id",
          ignoreDuplicates: false // Update if exists
        }
      )
      .select();

    if (paymentError) {
      console.error("❌ Error logging payment:", paymentError);
      // Don't throw here as the main subscription update succeeded
    } else {
      console.log("✅ Payment logged successfully:", paymentRecord);
    }

    console.log("🎉 Payment success handled completely!");
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Payment processed and subscription updated",
        userId,
        plan
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("💥 Error in handlePaymentSuccessWithExtractedData:", {
      error: error.message,
      stack: error.stack,
      userId,
      plan
    });
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to process payment",
        details: error.message
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription, supabase: any) {
  console.log("📋 Processing subscription change:", subscription.id);
  console.log("📋 Subscription status:", subscription.status);
  console.log("📋 Subscription metadata:", subscription.metadata || {});

  // Check if this is a live mode subscription
  const isLiveMode = subscription.livemode === true;
  if (isLiveMode) {
    console.log("🔴 LIVE MODE SUBSCRIPTION - Processing real subscription");
  }

  const userId = subscription.metadata.userId;
  const plan = subscription.metadata.plan;

  if (!userId) {
    console.error("❌ Missing userId in subscription metadata");
    throw new Error("Missing userId in subscription metadata");
  }

  try {
    // Check if user is an admin - admins have automatic enterprise and shouldn't be modified by Stripe webhooks
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle();

    if (userData?.is_admin) {
      console.log("👑 User is admin - skipping subscription change (admin accounts have automatic enterprise)");
      return;
    }

    // Determine the plan based on subscription status
    let subscriptionStatus = 'free';
    if (subscription.status === 'active' || subscription.status === 'trialing') {
      subscriptionStatus = plan || 'starter'; // Default to starter if plan not specified
    }

    console.log(`📋 Setting subscription status to: ${subscriptionStatus}`);

    // Calculate next billing date from current_period_end
    const currentPeriodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null;

    console.log(`📋 Next billing date: ${currentPeriodEnd}`);

    const { error } = await supabase
      .from('users')
      .update({
        subscription: subscriptionStatus,
        current_period_end: currentPeriodEnd,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("❌ Error updating subscription:", error);
      throw error;
    }
    
    // Log the subscription change in payment_logs table
    try {
      await supabase.from('payment_logs').insert({
        event_type: 'customer.subscription.updated',
        event_id: uuidv4(),
        subscription_id: subscription.id,
        user_id: userId,
        status: subscription.status,
        live_mode: isLiveMode,
        metadata: subscription.metadata
      });
    } catch (logError) {
      console.warn("⚠️ Failed to log subscription event:", logError);
    }

    console.log(`✅ Successfully updated user ${userId} subscription to ${subscriptionStatus}`);
  } catch (error) {
    console.error("💥 Error in handleSubscriptionChange:", error);
    throw error;
  }
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription, supabase: any) {
  console.log("🗑️ Processing subscription cancellation:", subscription.id);

  // Check if this is a live mode subscription
  const isLiveMode = subscription.livemode === true;
  if (isLiveMode) {
    console.log("🔴 LIVE MODE SUBSCRIPTION CANCELLATION - Processing real cancellation");
  }

  const userId = subscription.metadata.userId;

  if (!userId) {
    console.error("❌ Missing userId in subscription metadata");
    throw new Error("Missing userId in subscription metadata");
  }

  try {
    // Check if user is an admin - admins have automatic enterprise and shouldn't be modified by Stripe webhooks
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle();

    if (userData?.is_admin) {
      console.log("👑 User is admin - skipping cancellation (admin accounts have automatic enterprise)");
      return;
    }

    // Revert to 'trial' instead of 'free' - trial gives simulated data access
    const { error } = await supabase
      .from('users')
      .update({
        subscription: 'trial',
        cancel_at_period_end: false,
        subscription_ends_at: null,
        stripe_subscription_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("❌ Error cancelling subscription:", error);
      throw error;
    }

    // Log the subscription cancellation in payment_logs table
    try {
      await supabase.from('payment_logs').insert({
        event_type: 'customer.subscription.deleted',
        event_id: uuidv4(),
        subscription_id: subscription.id,
        user_id: userId,
        status: 'cancelled',
        live_mode: isLiveMode,
        metadata: subscription.metadata
      });
    } catch (logError) {
      console.warn("⚠️ Failed to log subscription cancellation:", logError);
    }

    console.log(`✅ Successfully cancelled subscription for user ${userId}, reverted to trial`);
  } catch (error) {
    console.error("💥 Error in handleSubscriptionCancellation:", error);
    throw error;
  }
}

async function handlePaymentFailure(invoice: Stripe.Invoice, supabase: any) {
  console.log("❌ Processing payment failure:", invoice.id);
  console.log("❌ Invoice details:", {
    id: invoice.id || "unknown",
    customer: invoice.customer || "unknown",
    status: invoice.status || "unknown",
    amount_due: invoice.amount_due || 0,
    currency: invoice.currency || "usd",
    liveMode: invoice.livemode || false
  });
  
  // Check if this is a live mode invoice
  const isLiveMode = invoice.livemode === true;
  if (isLiveMode) {
    console.log("🔴 LIVE MODE PAYMENT FAILURE - Processing real payment failure");
  }
  
  const customerId = invoice.customer as string;
  
  try {
    // Get customer details from Stripe to find the user
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });
    
    const customer = await stripe.customers.retrieve(customerId);
    
    if (customer.deleted) {
      console.log("❌ Customer has been deleted");
      return;
    }
    
    // Find user by customer metadata
    const userId = customer.metadata.userId;
    
    if (!userId) {
      console.error("❌ No userId in customer metadata");
      return;
    }
    
    console.log(`❌ Payment failed for user ${userId}`);
    
    // Log the payment failure in payments table
    await supabase.from('payments').insert({
      user_id: userId,
      stripe_payment_intent_id: invoice.payment_intent ? String(invoice.payment_intent) : null,
      stripe_subscription_id: invoice.subscription ? String(invoice.subscription) : null,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: 'failed',
      created_at: new Date().toISOString(),
      live_mode: isLiveMode,
      webhook_event_id: uuidv4() // Generate a unique ID for idempotency
    });
    
    // Log the payment failure in payment_logs table
    await supabase.from('payment_logs').insert({
      event_type: 'invoice.payment_failed',
      event_id: uuidv4(),
      payment_intent_id: invoice.payment_intent ? String(invoice.payment_intent) : null,
      subscription_id: invoice.subscription ? String(invoice.subscription) : null,
      user_id: userId,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: 'failed',
      live_mode: isLiveMode,
      error_message: 'Payment failed',
      metadata: { customerId }
    });
    
    // Note: In a production app, you might want to:
    // 1. Send a notification to the user
    // 2. Downgrade their account after multiple failures
    // 3. Add a warning banner in the UI
  } catch (error) {
    console.error("❌ Error handling payment failure:", error);
  }
  
  console.log(`💸 Payment failed for customer ${customerId}`);
}