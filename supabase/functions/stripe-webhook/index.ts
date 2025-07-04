import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()
  
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return new Response('Webhook signature verification failed', { status: 400 })
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentSuccess(paymentIntent)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionChange(subscription)
        break

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCancellation(deletedSubscription)
        break

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice
        await handlePaymentFailure(failedInvoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response('Webhook handled successfully', { status: 200 })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return new Response('Webhook handler error', { status: 500 })
  }
})

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const userId = paymentIntent.metadata.userId
  const plan = paymentIntent.metadata.plan

  if (userId && plan) {
    // Update user subscription
    await supabase
      .from('users')
      .update({
        subscription: plan,
        payment_method_added: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    // Log payment
    await supabase.from('payments').insert({
      user_id: userId,
      stripe_payment_intent_id: paymentIntent.id,
      plan: plan,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'succeeded',
    })
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId
  const plan = subscription.metadata.plan

  if (userId) {
    const subscriptionStatus = subscription.status === 'active' ? plan : 'free'
    
    await supabase
      .from('users')
      .update({
        subscription: subscriptionStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
  }
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId

  if (userId) {
    await supabase
      .from('users')
      .update({
        subscription: 'free',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
  }
}

async function handlePaymentFailure(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  
  // Get customer to find user
  const customer = await stripe.customers.retrieve(customerId)
  const userId = (customer as Stripe.Customer).metadata?.userId

  if (userId) {
    // Optionally downgrade user or send notification
    console.log(`Payment failed for user ${userId}`)
  }
}