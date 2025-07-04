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

  console.log('🔥 WEBHOOK RECEIVED - Starting processing...')
  
  try {
    const signature = req.headers.get('stripe-signature')
    const body = await req.text()
    
    console.log('📝 Request details:', {
      hasSignature: !!signature,
      bodyLength: body.length,
      method: req.method
    })
    
    if (!signature) {
      console.error('❌ No stripe signature found')
      return new Response('No stripe signature', { status: 400, headers: corsHeaders })
    }

    // Get environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    console.log('🔑 Environment check:', {
      hasStripeKey: !!stripeSecretKey,
      hasWebhookSecret: !!webhookSecret,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    })

    if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing required environment variables')
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
      console.log('✅ Webhook signature verified successfully')
      console.log('📋 Event details:', {
        type: event.type,
        id: event.id,
        created: new Date(event.created * 1000).toISOString()
      })
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message)
      return new Response('Webhook signature verification failed', { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    // Process the event
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          console.log('💰 Processing payment_intent.succeeded')
          const paymentIntent = event.data.object as Stripe.PaymentIntent
          console.log('💳 Payment Intent details:', {
            id: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            metadata: paymentIntent.metadata
          })
          await handlePaymentSuccess(paymentIntent, supabase)
          break

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          console.log(`📋 Processing ${event.type}`)
          const subscription = event.data.object as Stripe.Subscription
          await handleSubscriptionChange(subscription, supabase)
          break

        case 'customer.subscription.deleted':
          console.log('🗑️ Processing subscription deletion')
          const deletedSubscription = event.data.object as Stripe.Subscription
          await handleSubscriptionCancellation(deletedSubscription, supabase)
          break

        case 'invoice.payment_failed':
          console.log('❌ Processing payment failure')
          const failedInvoice = event.data.object as Stripe.Invoice
          await handlePaymentFailure(failedInvoice, supabase)
          break

        default:
          console.log(`ℹ️ Unhandled event type: ${event.type}`)
      }

      console.log('✅ Webhook processed successfully')
      return new Response('Webhook handled successfully', { 
        status: 200, 
        headers: corsHeaders 
      })
    } catch (error) {
      console.error('❌ Webhook handler error:', error)
      return new Response('Webhook handler error', { 
        status: 500, 
        headers: corsHeaders 
      })
    }
  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    return new Response('Webhook processing error', { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  console.log('🎯 Starting handlePaymentSuccess')
  console.log('💰 Payment Intent Full Details:', JSON.stringify(paymentIntent, null, 2))
  
  const userId = paymentIntent.metadata.userId
  const plan = paymentIntent.metadata.plan
  const email = paymentIntent.metadata.email
  const amount = paymentIntent.amount

  console.log('📊 Extracted metadata:', {
    userId,
    plan,
    email,
    amount,
    amountInDollars: amount / 100
  })

  if (!userId || !plan) {
    console.error('❌ Missing userId or plan in payment intent metadata')
    console.error('Available metadata keys:', Object.keys(paymentIntent.metadata))
    return
  }

  // Determine plan based on amount if plan is not set correctly
  let finalPlan = plan
  if (amount === 2900) { // $29.00
    finalPlan = 'starter'
    console.log('💡 Amount is $29.00 - setting plan to starter')
  } else if (amount === 9900) { // $99.00
    finalPlan = 'professional'
    console.log('💡 Amount is $99.00 - setting plan to professional')
  } else if (amount === 29900) { // $299.00
    finalPlan = 'enterprise'
    console.log('💡 Amount is $299.00 - setting plan to enterprise')
  }

  console.log(`🎯 Final plan determined: ${finalPlan}`)

  try {
    // First, let's check if the user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching user:', fetchError)
      throw fetchError
    }

    console.log('👤 Found user:', {
      id: existingUser.id,
      email: existingUser.email,
      currentSubscription: existingUser.subscription,
      paymentMethodAdded: existingUser.payment_method_added
    })

    // Update user subscription
    const { data: updatedUser, error: userError } = await supabase
      .from('users')
      .update({
        subscription: finalPlan,
        payment_method_added: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()

    if (userError) {
      console.error('❌ Error updating user subscription:', userError)
      throw userError
    }

    console.log('✅ Successfully updated user:', updatedUser)

    // Log payment
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        stripe_payment_intent_id: paymentIntent.id,
        plan: finalPlan,
        amount: amount,
        currency: paymentIntent.currency,
        status: 'succeeded',
      })
      .select()

    if (paymentError) {
      console.error('❌ Error logging payment:', paymentError)
      // Don't throw here as the main subscription update succeeded
    } else {
      console.log('✅ Payment logged successfully:', paymentRecord)
    }

    console.log('🎉 Payment success handled completely!')
  } catch (error) {
    console.error('💥 Error in handlePaymentSuccess:', error)
    throw error
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription, supabase: any) {
  console.log('📋 Processing subscription change:', subscription.id)
  
  const userId = subscription.metadata.userId
  const plan = subscription.metadata.plan

  if (!userId) {
    console.error('❌ Missing userId in subscription metadata')
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
      console.error('❌ Error updating subscription:', error)
      throw error
    }

    console.log(`✅ Successfully updated user ${userId} subscription to ${subscriptionStatus}`)
  } catch (error) {
    console.error('💥 Error in handleSubscriptionChange:', error)
    throw error
  }
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription, supabase: any) {
  console.log('🗑️ Processing subscription cancellation:', subscription.id)
  
  const userId = subscription.metadata.userId

  if (!userId) {
    console.error('❌ Missing userId in subscription metadata')
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
      console.error('❌ Error cancelling subscription:', error)
      throw error
    }

    console.log(`✅ Successfully cancelled subscription for user ${userId}`)
  } catch (error) {
    console.error('💥 Error in handleSubscriptionCancellation:', error)
    throw error
  }
}

async function handlePaymentFailure(invoice: Stripe.Invoice, supabase: any) {
  console.log('❌ Processing payment failure:', invoice.id)
  
  const customerId = invoice.customer as string
  
  // In a real implementation, you might want to:
  // 1. Get customer details from Stripe
  // 2. Find the user in your database
  // 3. Send notification or downgrade account
  
  console.log(`💸 Payment failed for customer ${customerId}`)
}