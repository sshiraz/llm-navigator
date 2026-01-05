# 🚀 Live Mode Webhook Setup Guide

## 🔑 Step 1: Create a New Webhook in Stripe Dashboard

1. **Go to Stripe Dashboard**: [dashboard.stripe.com](https://dashboard.stripe.com)
2. **Make sure you're in LIVE mode** (toggle in top-left)
3. **Navigate to**: Developers → Webhooks
4. **Click**: "Add endpoint"

## 🎯 Step 2: Configure the Live Webhook

### Endpoint URL
```
https://jgkdzaoajbzmuuajpndv.supabase.co/functions/v1/stripe-webhook
```

### Events to Send
Select these specific events:
- ✅ `payment_intent.succeeded`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_failed`

### Description (Optional)
```
LLM Navigator - LIVE Payment Processing Webhook
```

## 🔐 Step 3: Get the Live Webhook Secret

After creating the webhook:
1. **Click on your new webhook** in the list
2. **Scroll down** to "Signing secret" section
3. **Click "Reveal"** to show the secret
4. **Copy the secret** (starts with `whsec_`)

## ⚡ Step 4: Set the Live Webhook Secret in Supabase

```bash
# Set the LIVE webhook secret (different from test mode)
npx supabase secrets set STRIPE_LIVE_WEBHOOK_SECRET=whsec_your_live_webhook_secret_here
```

## 🔄 Step 5: Redeploy the Webhook Function

```bash
# Redeploy the webhook function with live mode support
npx supabase functions deploy stripe-webhook
```

## ✅ Step 6: Test the Live Webhook

### Option A: Use Stripe Dashboard
1. **In your webhook settings**, click "Send test webhook"
2. **Select** `payment_intent.succeeded`
3. **Click** "Send test webhook"
4. **Check** that it shows "Success"

### Option B: Make a Small Test Purchase
1. **Use a real card** to make a small test purchase (e.g., $1)
2. **Check** Stripe Dashboard → Events to see if the webhook was received
3. **Verify** the subscription was updated in your database

## 🔍 Verify Live Mode Configuration

```bash
# Check if all secrets are set correctly
npx supabase secrets list
```

You should see both `STRIPE_WEBHOOK_SECRET` (for test mode) and `STRIPE_LIVE_WEBHOOK_SECRET` (for live mode).

## 🚨 Important Security Considerations

1. **PCI Compliance**: Ensure your application meets PCI DSS requirements
2. **Error Handling**: Implement robust error handling for live payments
3. **Logging**: Set up comprehensive logging for all payment events
4. **Monitoring**: Monitor webhook deliveries in Stripe Dashboard
5. **Refund Process**: Have a clear process for handling refunds
6. **Customer Support**: Be prepared to handle payment inquiries

## 🔄 Switching Between Test and Live Mode

Your application now supports both test and live mode:

- **Test Mode**: Uses `STRIPE_WEBHOOK_SECRET` for webhook verification
- **Live Mode**: Uses `STRIPE_LIVE_WEBHOOK_SECRET` for webhook verification

The webhook automatically detects which mode is being used based on the request headers from Stripe.

## 🎯 Verifying Live Mode is Working

1. **Check Stripe Dashboard**: Events should show successful webhook deliveries
2. **Check Payment Logs**: Use the Payment Debugger to view detailed logs
3. **Test a Real Payment**: Process a small real payment to verify everything works

## 🚨 Troubleshooting Live Mode Issues

If you encounter issues with live mode:

1. **Check Webhook Logs**: In Stripe Dashboard → Developers → Webhooks
2. **Verify Secrets**: Make sure `STRIPE_LIVE_WEBHOOK_SECRET` is set correctly
3. **Check Edge Function Logs**: In Supabase Dashboard → Edge Functions
4. **Test Webhook Manually**: Use the "Send test webhook" feature in Stripe

Your webhook is now ready to process real payments in live mode! 🎉