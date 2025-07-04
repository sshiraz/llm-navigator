import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log('Webhook received:', req.method, req.url)
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables with validation
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    console.log('Environment check:', {
      hasStripeKey: !!stripeSecretKey,
      hasWebhookSecret: !!webhookSecret,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    })

    if (!stripeSecretKey) {
      console.error('Missing STRIPE_SECRET_KEY')
      return new Response('Missing Stripe secret key', { status: 500, headers: corsHeaders })
    }

    if (!webhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET')
      return new Response('Missing webhook secret', { status: 500, headers: corsHeaders })
    }

    if (!supabaseUrl) {
      console.error('Missing SUPABASE_URL')
      return new Response('Missing Supabase URL', { status: 500, headers: corsHeaders })
    }

    if (!supabaseServiceKey) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
      return new Response('Missing Supabase service key', { status: 500, headers: corsHeaders })
    }

    const signature = req.headers.get('stripe-signature')
    const body = await req.text()
    
    console.log('Request details:', {
      hasSignature: !!signature,
      bodyLength: body.length,
      contentType: req.headers.get('content-type')
    })

    if (!signature) {
      console.error('No stripe signature found')
      return new Response('No stripe signature', { status: 400, headers: corsHeaders })
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log('Webhook event verified:', event.type, event.id)
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
      return new Response(`Webhook signature verification failed: ${err.message}`, { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    // Initialize Supabase with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('Processing event:', event.type)

    // Process the event
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent
          console.log('Processing payment success:', paymentIntent.id)
          await handlePaymentSuccess(paymentIntent, supabase)
          break

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          const subscription = event.data.object as Stripe.Subscription
          console.log('Processing subscription change:', subscription.id)
          await handleSubscriptionChange(subscription, supabase)
          break

        case 'customer.subscription.deleted':
          const deletedSubscription = event.data.object as Stripe.Subscription
          console.log('Processing subscription cancellation:', deletedSubscription.id)
          await handleSubscriptionCancellation(deletedSubscription, supabase)
          break

        case 'invoice.payment_failed':
          const failedInvoice = event.data.object as Stripe.Invoice
          console.log('Processing payment failure:', failedInvoice.id)
          await handlePaymentFailure(failedInvoice, supabase)
          break

        default:
          console.log(`Unhandled event type: ${event.type}`)
      }

      console.log('Webhook processed successfully')
      return new Response(JSON.stringify({ received: true, eventType: event.type }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } catch (error) {
      console.error('Webhook handler error:', error)
      return new Response(`Webhook handler error: ${error.message}`, { 
        status: 500, 
        headers: corsHeaders 
      })
    }
  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(`Webhook processing error: ${error.message}`, { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  console.log('Processing payment success for:', paymentIntent.id)
  
  const userId = paymentIntent.metadata.userId
  const plan = paymentIntent.metadata.plan
  const email = paymentIntent.metadata.email

  console.log('Payment metadata:', { userId, plan, email })

  if (!userId || !plan) {
    console.error('Missing userId or plan in payment intent metadata')
    throw new Error('Missing required metadata')
  }

  try {
    // Update user subscription
    const { data: userData, error: userError } = await supabase
      .from('users')
      .update({
        subscription: plan,
        payment_method_added: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()

    if (userError) {
      console.error('Error updating user subscription:', userError)
      throw userError
    }

    console.log('Successfully updated user:', userData)

    // Log payment
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        stripe_payment_intent_id: paymentIntent.id,
        plan: plan,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: 'succeeded',
      })
      .select()

    if (paymentError) {
      console.error('Error logging payment:', paymentError)
      // Don't throw here as the main subscription update succeeded
    } else {
      console.log('Payment logged successfully:', paymentData)
    }

    console.log('Payment success handled successfully')
  } catch (error) {
    console.error('Error in handlePaymentSuccess:', error)
    throw error
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription, supabase: any) {
  console.log('Processing subscription change:', subscription.id)
  
  const userId = subscription.metadata.userId
  const plan = subscription.metadata.plan

  if (!userId) {
    console.error('Missing userId in subscription metadata')
    return
  }

  try {
    const subscriptionStatus = subscription.status === 'active' ? plan : 'free'
    
    const { data, error } = await supabase
      .from('users')
      .update({
        subscription: subscriptionStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()

    if (error) {
      console.error('Error updating subscription:', error)
      throw error
    }

    console.log(`Successfully updated user ${userId} subscription to ${subscriptionStatus}:`, data)
  } catch (error) {
    console.error('Error in handleSubscriptionChange:', error)
    throw error
  }
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription, supabase: any) {
  console.log('Processing subscription cancellation:', subscription.id)
  
  const userId = subscription.metadata.userId

  if (!userId) {
    console.error('Missing userId in subscription metadata')
    return
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        subscription: 'free',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()

    if (error) {
      console.error('Error cancelling subscription:', error)
      throw error
    }

    console.log(`Successfully cancelled subscription for user ${userId}:`, data)
  } catch (error) {
    console.error('Error in handleSubscriptionCancellation:', error)
    throw error
  }
}

async function handlePaymentFailure(invoice: Stripe.Invoice, supabase: any) {
  console.log('Processing payment failure:', invoice.id)
  
  const customerId = invoice.customer as string
  
  // In a real implementation, you might want to:
  // 1. Get customer details from Stripe
  // 2. Find the user in your database
  // 3. Send notification or downgrade account
  
  console.log(`Payment failed for customer ${customerId}`)
}