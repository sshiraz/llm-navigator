import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
    const { amount, currency, metadata } = await req.json();

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Extract user info from metadata
    const userEmail = metadata?.email || null;
    const userId = metadata?.userId || null;
    const customerName = metadata?.customerName || null;

    // Create or retrieve Stripe Customer to avoid "Guest" status
    let customerId: string | undefined;

    if (userEmail) {
      // Check if customer already exists
      const existingCustomers = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        // Use existing customer
        customerId = existingCustomers.data[0].id;
        console.log("Found existing Stripe customer:", customerId);

        // Update customer name if provided and different
        if (customerName && existingCustomers.data[0].name !== customerName) {
          await stripe.customers.update(customerId, { name: customerName });
          console.log("Updated customer name to:", customerName);
        }
      } else {
        // Create new customer with name and email
        const newCustomer = await stripe.customers.create({
          email: userEmail,
          name: customerName || undefined,
          metadata: {
            userId: userId || 'unknown',
          },
        });
        customerId = newCustomer.id;
        console.log("Created new Stripe customer:", customerId, "with name:", customerName);
      }
    }

    // Create payment intent attached to the customer
    // setup_future_usage saves the payment method for recurring charges
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
      customer: customerId,
      receipt_email: userEmail,
      setup_future_usage: 'off_session', // Save payment method for future subscription renewals
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});