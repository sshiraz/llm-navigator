# 🧪 Webhook Testing Guide

## 🔍 Testing Your Webhook

This guide will help you test your webhook to ensure it's working correctly in both test and live modes.

## 🧪 Test Mode Testing

### Method 1: Use the Payment Debugger
1. Open your application
2. Click the red bug icon to open the Payment Debugger
3. Click "Test Webhook" button
4. Check the response status:
   - **200**: Webhook is working correctly
   - **400 with signature verification error**: Webhook is deployed but signature verification failed (expected for test requests)
   - **401/403**: Authentication failed - check SUPABASE_SERVICE_ROLE_KEY
   - **404**: Webhook not found - check if function is deployed

### Method 2: Use Stripe Dashboard
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks) (in TEST mode)
2. Click on your webhook endpoint
3. Click "Send test webhook"
4. Select `payment_intent.succeeded`
5. Click "Send test webhook"
6. Check if it shows "Success" (200 status)

### Method 3: Use curl Command
```bash
curl -X POST 'https://jgkdzaoajbzmuuajpndv.supabase.co/functions/v1/stripe-webhook' \
  -H 'Content-Type: application/json' \
  -H 'x-test-request: true' \
  -d '{"type":"payment_intent.succeeded","data":{"object":{"id":"pi_test","amount":2900,"currency":"usd","status":"succeeded","metadata":{"userId":"test-user","plan":"starter"}}}}'
```

## 🔴 Live Mode Testing

### Method 1: Use Stripe Dashboard (Recommended)
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks) (in LIVE mode)
2. Click on your live webhook endpoint
3. Click "Send test webhook"
4. Select `payment_intent.succeeded`
5. Click "Send test webhook"
6. Check if it shows "Success" (200 status)

### Method 2: Make a Small Test Purchase
1. Use your own credit card to make a small purchase (e.g., $1)
2. Check Stripe Dashboard → Events to see if the webhook was received
3. Verify the subscription was updated in your database

## 🔍 Verifying Webhook Functionality

### Check Webhook Logs
1. In Stripe Dashboard, go to Developers → Webhooks
2. Click on your webhook endpoint
3. Click on "Recent deliveries"
4. Check the status of recent webhook deliveries

### Check Payment Logs
1. Open the Payment Debugger in your application
2. Look for logs related to webhook events
3. Check for any errors or warnings

### Check Database Updates
1. After a successful payment, check if the user's subscription was updated
2. Verify that payment records were created in the database

## 🚨 Troubleshooting Common Issues

### 401/403 Errors
- **Issue**: Authentication failed
- **Fix**: Check if SUPABASE_SERVICE_ROLE_KEY is set correctly
```bash
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impna2R6YW9hamJ6bXV1YWpwbmR2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTUyMzc1OSwiZXhwIjoyMDY3MDk5NzU5fQ.DOYDCrZJrV895yP6Qev4y8cRN1b0PUNK-JMvlwTFCBo
```

### 404 Errors
- **Issue**: Webhook function not deployed
- **Fix**: Deploy the webhook function
```bash
npx supabase functions deploy stripe-webhook
```

### 400 Errors (Signature Verification Failed)
- **Issue**: Webhook secret mismatch
- **Fix**: Set the correct webhook secret
```bash
# For test mode
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_test_webhook_secret

# For live mode
npx supabase secrets set STRIPE_LIVE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
```

### Payment Succeeded but Subscription Not Updated
- **Issue**: Webhook received but database update failed
- **Fix**: Check webhook logs and database permissions

## 🔄 Testing After Changes

Always test your webhook after:
1. Deploying changes to the webhook function
2. Updating webhook secrets
3. Changing database schema
4. Switching between test and live modes

By following this guide, you can ensure your webhook is working correctly and reliably processing payments.