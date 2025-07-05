import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

// Improved CORS headers with stripe-signature
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature, x-webhook-signature, x-stripe-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("🔥 WEBHOOK RECEIVED - Starting processing...");
  
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
    // Also check for x-stripe-signature as some integrations use this
    const altSignature = req.headers.get("x-stripe-signature");
    const finalSignature = signature || altSignature;
    const body = await req.text();
    
    console.log("📝 Request details:", {
      hasSignature: !!finalSignature,
      bodyLength: body ? body.length : 0,
      method: req.method,
      signaturePreview: finalSignature ? finalSignature.substring(0, 10) + "..." : "none"
    });
    
    if (!finalSignature) {
      console.warn("⚠️ No stripe signature found in headers - this is expected for test requests");
      // Continue processing for test requests, but log a warning
    }

    // Get environment variables
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    // If we're missing the Supabase URL, try to get it from the request URL
    let derivedSupabaseUrl = supabaseUrl;
    if (!derivedSupabaseUrl) {
      const requestUrl = new URL(req.url);
      derivedSupabaseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
      console.log("🔍 Derived Supabase URL from request:", derivedSupabaseUrl);
    }

    console.log("🔑 Environment check:", {
      hasStripeKey: !!stripeSecretKey,
      hasWebhookSecret: !!webhookSecret,
      hasSupabaseUrl: !!derivedSupabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      stripeKeyPrefix: stripeSecretKey ? stripeSecretKey.substring(0, 7) + "..." : "none",
      webhookSecretPrefix: webhookSecret ? webhookSecret.substring(0, 7) + "..." : "none"
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

    if (!webhookSecret) {
      console.error("❌ Missing STRIPE_WEBHOOK_SECRET environment variable");
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
      event = stripe.webhooks.constructEvent(body, finalSignature || "", webhookSecret);
      console.log("✅ Webhook signature verified successfully!");
      console.log("📋 Event details:", {
        type: event.type,
        id: event.id,
        created: new Date(event.created * 1000).toISOString(),
        livemode: event.livemode
      });
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", {
        error: err.message,
        signatureReceived: finalSignature ? finalSignature.substring(0, 10) + "..." : "none",
        webhookSecretUsed: webhookSecret ? webhookSecret.substring(0, 7) + "..." : "none",
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
      
      switch (event.type) {
        case "checkout.session.completed":
          console.log("🛒 Processing checkout.session.completed");
          const session = event.data.object as Stripe.Checkout.Session;
          console.log("🛒 Checkout Session details:", {
            id: session.id,
            payment_status: session.payment_status,
            customer: session.customer,
            metadata: session.metadata
          });
          await handleCheckoutSessionCompleted(session, supabase);
          break;

        case "payment_intent.succeeded":
          console.log("💰 Processing payment_intent.succeeded");
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log("💳 Payment Intent details:", {
            id: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            metadata: paymentIntent.metadata
          });
          await handlePaymentSuccess(paymentIntent, supabase);
          break;

        case "customer.subscription.created":
        case "customer.subscription.updated":
          console.log(`📋 Processing ${event.type}`);
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionChange(subscription, supabase);
          break;

        case "customer.subscription.deleted":
          console.log("🗑️ Processing subscription deletion");
          const deletedSubscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionCancellation(deletedSubscription, supabase);
          break;

        case "invoice.payment_failed":
          console.log("❌ Processing payment failure");
          const failedInvoice = event.data.object as Stripe.Invoice;
          await handlePaymentFailure(failedInvoice, supabase);
          break;

        default:
          console.log(`ℹ️ Unhandled event type: ${event.type}`);
      }

      console.log("✅ Webhook processed successfully");
      return new Response(
        JSON.stringify({ 
          received: true, 
          eventType: event.type,
          eventId: event.id 
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
  
  const userId = session.metadata?.userId || session.client_reference_id;
  const plan = session.metadata?.plan;
  const email = session.customer_details?.email;
  
  console.log("🛒 Checkout session metadata:", {
    userId,
    plan,
    email,
    sessionId: session.id,
    paymentStatus: session.payment_status
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
    // Update user subscription
    console.log("💾 Updating user subscription from checkout session...");
    const { data: updatedUser, error: userError } = await supabase
      .from("users")
      .update({
        subscription: plan,
        payment_method_added: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select();

    if (userError) {
      console.error("❌ Error updating user from checkout session:", userError);
      throw userError;
    }

    console.log("✅ Successfully updated user from checkout session:", updatedUser);
  } catch (error) {
    console.error("💥 Error in handleCheckoutSessionCompleted:", error);
    throw error;
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  console.log("🎯 Starting handlePaymentSuccess");
  
  // Log payment intent details but sanitize sensitive information
  const sanitizedPaymentIntent = {
    id: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    status: paymentIntent.status,
    metadata: paymentIntent.metadata,
    created: paymentIntent.created,
    customer: paymentIntent.customer
  };
  
  console.log("💰 Payment Intent Details:", JSON.stringify(sanitizedPaymentIntent, null, 2));
  
  const userId = paymentIntent.metadata.userId;
  const plan = paymentIntent.metadata.plan;
  const email = paymentIntent.metadata.email;
  const amount = paymentIntent.amount;

  console.log("📊 Extracted metadata:", {
    userId,
    plan,
    email,
    amount,
    amountInDollars: amount / 100
  });

  if (!userId || !plan) {
    console.error("❌ Missing userId or plan in payment intent metadata");
    console.error("Available metadata keys:", Object.keys(paymentIntent.metadata));
    throw new Error("Missing required metadata: userId or plan");
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
      .from("payments")
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
      .from("users")
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
      .from("users")
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
          amount: amount,
          currency: paymentIntent.currency,
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

async function handleSubscriptionChange(subscription: Stripe.Subscription, supabase: any) {
  console.log("📋 Processing subscription change:", subscription.id);
  console.log("📋 Subscription status:", subscription.status);
  console.log("📋 Subscription metadata:", subscription.metadata);
  
  const userId = subscription.metadata.userId;
  const plan = subscription.metadata.plan;

  if (!userId) {
    console.error("❌ Missing userId in subscription metadata");
    throw new Error("Missing userId in subscription metadata");
  }

  try {
    // Determine the plan based on subscription status
    let subscriptionStatus = "free";
    if (subscription.status === "active" || subscription.status === "trialing") {
      subscriptionStatus = plan || "starter"; // Default to starter if plan not specified
    }
    
    console.log(`📋 Setting subscription status to: ${subscriptionStatus}`);
    
    const { error } = await supabase
      .from("users")
      .update({
        subscription: subscriptionStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("❌ Error updating subscription:", error);
      throw error;
    }

    console.log(`✅ Successfully updated user ${userId} subscription to ${subscriptionStatus}`);
  } catch (error) {
    console.error("💥 Error in handleSubscriptionChange:", error);
    throw error;
  }
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription, supabase: any) {
  console.log("🗑️ Processing subscription cancellation:", subscription.id);
  
  const userId = subscription.metadata.userId;

  if (!userId) {
    console.error("❌ Missing userId in subscription metadata");
    throw new Error("Missing userId in subscription metadata");
  }

  try {
    const { error } = await supabase
      .from("users")
      .update({
        subscription: "free",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("❌ Error cancelling subscription:", error);
      throw error;
    }

    console.log(`✅ Successfully cancelled subscription for user ${userId}`);
  } catch (error) {
    console.error("💥 Error in handleSubscriptionCancellation:", error);
    throw error;
  }
}

async function handlePaymentFailure(invoice: Stripe.Invoice, supabase: any) {
  console.log("❌ Processing payment failure:", invoice.id);
  console.log("❌ Invoice details:", {
    id: invoice.id,
    customer: invoice.customer,
    status: invoice.status,
    amount_due: invoice.amount_due,
    currency: invoice.currency
  });
  
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
    
    // Log the payment failure
    await supabase.from("payments").insert({
      user_id: userId,
      stripe_payment_intent_id: invoice.payment_intent as string,
      stripe_subscription_id: invoice.subscription as string,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: "failed",
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