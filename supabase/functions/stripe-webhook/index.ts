import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const signature = req.headers.get('stripe-signature')
    const body = await req.text()
    
    if (!signature) {
      console.error('No stripe signature found')
      return new Response('No stripe signature', { status: 400, headers: corsHeaders })
    }

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables')
      return new Response('Server configuration error', { status: 500, headers: corsHeaders })
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })

    // Initialize Supabase with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log('Webhook event received:', event.type)
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
      return new Response('Webhook signature verification failed', { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    // Process the event
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent
          await handlePaymentSuccess(paymentIntent, supabase)
          break

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          const subscription = event.data.object as Stripe.Subscription
          await handleSubscriptionChange(subscription, supabase)
          break

        case 'customer.subscription.deleted':
          const deletedSubscription = event.data.object as Stripe.Subscription
          await handleSubscriptionCancellation(deletedSubscription, supabase)
          break

        case 'invoice.payment_failed':
          const failedInvoice = event.data.object as Stripe.Invoice
          await handlePaymentFailure(failedInvoice, supabase)
          break

        default:
          console.log(`Unhandled event type: ${event.type}`)
      }

      return new Response('Webhook handled successfully', { 
        status: 200, 
        headers: corsHeaders 
      })
    } catch (error) {
      console.error('Webhook handler error:', error)
      return new Response('Webhook handler error', { 
        status: 500, 
        headers: corsHeaders 
      })
    }
  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response('Webhook processing error', { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  console.log('Processing payment success:', paymentIntent.id)
  
  const userId = paymentIntent.metadata.userId
  const plan = paymentIntent.metadata.plan
  const email = paymentIntent.metadata.email

  if (!userId || !plan) {
    console.error('Missing userId or plan in payment intent metadata')
    return
  }

  try {
    // Update user subscription
    const { error: userError } = await supabase
      .from('users')
      .update({
        subscription: plan,
        payment_method_added: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (userError) {
      console.error('Error updating user subscription:', userError)
      throw userError
    }

    console.log(`Successfully updated user ${userId} to ${plan} plan`)

    // Log payment
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        stripe_payment_intent_id: paymentIntent.id,
        plan: plan,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: 'succeeded',
      })

    if (paymentError) {
      console.error('Error logging payment:', paymentError)
      // Don't throw here as the main subscription update succeeded
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
    
    const { error } = await supabase
      .from('users')
      .update({
        subscription: subscriptionStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      console.error('Error updating subscription:', error)
      throw error
    }

    console.log(`Successfully updated user ${userId} subscription to ${subscriptionStatus}`)
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
    const { error } = await supabase
      .from('users')
      .update({
        subscription: 'free',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      console.error('Error cancelling subscription:', error)
      throw error
    }

    console.log(`Successfully cancelled subscription for user ${userId}`)
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