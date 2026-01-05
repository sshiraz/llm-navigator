# 🚨 Fix Webhook Authentication Issue

## The Problem
Your payment succeeded but the webhook is failing with a 401 error, so your subscription isn't being updated.

## Quick Fix Steps

### Step 1: Check if Edge Functions are Deployed
```bash
# Check if functions exist
npx supabase functions list

# If not deployed, deploy them:
npx supabase functions deploy create-payment-intent
npx supabase functions deploy create-subscription  
npx supabase functions deploy stripe-webhook
```

### Step 2: Verify Environment Variables
```bash
# Check if secrets are set
npx supabase secrets list

# If missing, set them:
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impna2R6YW9hamJ6bXV1YWpwbmR2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTUyMzc1OSwiZXhwIjoyMDY3MDk5NzU5fQ.DOYDCrZJrV895yP6Qev4y8cRN1b0PUNK-JMvlwTFCBo
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Step 3: Update Webhook Endpoint in Stripe
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint
3. Make sure the URL is: `https://jgkdzaoajbzmuuajpndv.supabase.co/functions/v1/stripe-webhook`
4. Make sure these events are selected:
   - `payment_intent.succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

### Step 4: Test the Webhook
In Stripe Dashboard:
1. Go to your webhook endpoint
2. Click "Send test webhook"
3. Select `payment_intent.succeeded`
4. Click "Send test webhook"

### Step 5: Manual Fix (If webhook still fails)
Since your payment succeeded, I can help you manually update your subscription:

1. Go to your Supabase Dashboard
2. Navigate to Table Editor → users
3. Find your user record
4. Update the `subscription` field from `trial` to `starter`
5. Set `payment_method_added` to `true`

## Why This Happened
The webhook endpoint needs:
1. ✅ Edge Functions deployed
2. ✅ Proper authentication (service role key)
3. ✅ Webhook secret for verification
4. ✅ Correct endpoint URL in Stripe

## Quick Test
After fixing, you can test with this curl command:
```bash
curl -X POST 'https://jgkdzaoajbzmuuajpndv.supabase.co/functions/v1/stripe-webhook' \
  -H 'stripe-signature: test' \
  -d '{"type":"test"}'
```

If you get a response (not 401), the endpoint is working!