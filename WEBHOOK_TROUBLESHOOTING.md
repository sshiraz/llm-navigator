# 🔍 Webhook Troubleshooting Guide

## Current Status
- ✅ Payment succeeded in Stripe ($29.00)
- ❌ Webhook failing with 401/403 errors
- ❌ Subscription not upgraded

## Step 1: Check Edge Function Deployment

```bash
# Navigate to your project directory
cd "C:\Users\sshir\Projects\LLM_Navigator\project-bolt-sb1-vxro3gng\project"

# Check if functions are deployed
npx supabase functions list
```

**Expected output:**
```
┌─────────────────────┬─────────────────────┬─────────────┬──────────────────────┐
│ NAME                │ SLUG                │ VERSION     │ CREATED AT           │
├─────────────────────┼─────────────────────┼─────────────┼──────────────────────┤
│ create-payment-intent│ create-payment-intent│ v1         │ 2024-01-04T12:00:00Z │
│ create-subscription │ create-subscription │ v1         │ 2024-01-04T12:00:00Z │
│ stripe-webhook      │ stripe-webhook      │ v1         │ 2024-01-04T12:00:00Z │
└─────────────────────┴─────────────────────┴─────────────┴──────────────────────┘
```

## Step 2: Check Environment Variables

```bash
# Check if secrets are set
npx supabase secrets list
```

**Expected output:**
```
┌─────────────────────────────┬─────────────────────┐
│ NAME                        │ DIGEST              │
├─────────────────────────────┼─────────────────────┤
│ STRIPE_SECRET_KEY          │ sha256:abc123...    │
│ SUPABASE_SERVICE_ROLE_KEY  │ sha256:def456...    │
│ STRIPE_WEBHOOK_SECRET      │ sha256:ghi789...    │
└─────────────────────────────┴─────────────────────┘
```

## Step 3: Deploy/Redeploy Functions

If functions are missing or outdated:

```bash
# Deploy all functions
npx supabase functions deploy create-payment-intent
npx supabase functions deploy create-subscription
npx supabase functions deploy stripe-webhook
```

## Step 4: Set Missing Environment Variables

If any secrets are missing:

```bash
# Get your Stripe secret key from dashboard.stripe.com
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_your_actual_stripe_secret_key

# Set Supabase service role key
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impna2R6YW9hamJ6bXV1YWpwbmR2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTUyMzc1OSwiZXhwIjoyMDY3MDk5NzU5fQ.DOYDCrZJrV895yP6Qev4y8cRN1b0PUNK-JMvlwTFCBo

# Get webhook secret from Stripe Dashboard → Developers → Webhooks → [Your webhook] → Signing secret
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## Step 5: Test Webhook Endpoint

```bash
# Test if the endpoint responds
curl -X POST 'https://jgkdzaoajbzmuuajpndv.supabase.co/functions/v1/stripe-webhook' \
  -H 'Content-Type: application/json' \
  -d '{"test": "data"}'
```

**Expected response:** Should NOT be 401/403

## Step 6: Check Stripe Webhook Configuration

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)
2. Click on your webhook endpoint
3. Verify:
   - **Endpoint URL**: `https://jgkdzaoajbzmuuajpndv.supabase.co/functions/v1/stripe-webhook`
   - **Events**: `payment_intent.succeeded` is selected
   - **Status**: Should be "Enabled"

## Step 7: Manual Database Fix (Immediate Solution)

Since your payment succeeded, let's manually update your subscription:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/jgkdzaoajbzmuuajpndv)
2. Click **Table Editor** in the left sidebar
3. Click on **users** table
4. Find your user record (search by email if needed)
5. Click the **Edit** button (pencil icon) on your row
6. Update these fields:
   - `subscription`: Change from `trial` to `starter`
   - `payment_method_added`: Change to `true`
7. Click **Save**

## Step 8: Test in Stripe Dashboard

1. Go to your webhook in Stripe Dashboard
2. Click **"Send test webhook"**
3. Select `payment_intent.succeeded`
4. Click **"Send test webhook"**
5. Check if it shows "Success" or an error

## Common Issues & Solutions

### Issue: "Function not found" (404)
**Solution:** Functions not deployed
```bash
npx supabase functions deploy stripe-webhook
```

### Issue: "Unauthorized" (401)
**Solution:** Missing or wrong service role key
```bash
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impna2R6YW9hamJ6bXV1YWpwbmR2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTUyMzc1OSwiZXhwIjoyMDY3MDk5NzU5fQ.DOYDCrZJrV895yP6Qev4y8cRN1b0PUNK-JMvlwTFCBo
```

### Issue: "Webhook signature verification failed" (400)
**Solution:** Wrong webhook secret
```bash
# Get the correct secret from Stripe Dashboard
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_correct_secret
```

### Issue: Free Plan Limitations
**Note:** Supabase free plan includes:
- ✅ Edge Functions (up to 500,000 invocations/month)
- ✅ Database operations
- ✅ Authentication
- ✅ Real-time subscriptions

The free plan should NOT cause webhook issues.

## Quick Fix Summary

1. **Immediate fix**: Manually update your subscription in Supabase dashboard
2. **Long-term fix**: Deploy webhook function and set environment variables
3. **Test**: Use Stripe's test webhook feature

After the manual fix, refresh your app at https://llmsearchinsight.com and you should see "Starter Plan" activated! 🎉