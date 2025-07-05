# 🔗 Add New Stripe Webhook Endpoint

## Step 1: Create New Webhook in Stripe Dashboard

1. **Go to Stripe Dashboard**: [dashboard.stripe.com](https://dashboard.stripe.com)
2. **Make sure you're in Test mode** (toggle in top-left)
3. **Navigate to**: Developers → Webhooks
4. **Click**: "Add endpoint"

## Step 2: Configure the Webhook

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
LLM Navigator - Payment Processing Webhook
```

## Step 3: Get the Webhook Secret

After creating the webhook:
1. **Click on your new webhook** in the list
2. **Scroll down** to "Signing secret" section
3. **Click "Reveal"** to show the secret
4. **Copy the secret** (starts with `whsec_`)

## Step 4: Set the Webhook Secret in Supabase

```bash
# Replace with your actual webhook secret
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## Step 5: Test the Webhook

### Option A: Use Payment Debugger
1. **Open your app** and click the red bug icon (Payment Debugger)
2. **Click "Test Webhook"** button
3. **Should return status 200** (not 401/404)

### Option B: Use Stripe Dashboard
1. **In your webhook settings**, click "Send test webhook"
2. **Select** `payment_intent.succeeded`
3. **Click** "Send test webhook"
4. **Check** that it shows "Success"

## Step 6: Verify Edge Functions are Deployed

```bash
# Check if functions are deployed
npx supabase functions list

# If not deployed, deploy them:
npx supabase functions deploy create-payment-intent
npx supabase functions deploy create-subscription
npx supabase functions deploy stripe-webhook
```

## Step 7: Set All Required Secrets

```bash
# Stripe secret key (from Stripe Dashboard → Developers → API keys)
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# Supabase service role key (already provided)
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impna2R6YW9hamJ6bXV1YWpwbmR2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTUyMzc1OSwiZXhwIjoyMDY3MDk5NzU5fQ.DOYDCrZJrV895yP6Qev4y8cRN1b0PUNK-JMvlwTFCBo

# Webhook secret (from step 3 above)
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## Step 8: Clean Up Old Webhooks (Optional)

If you have multiple webhook endpoints:
1. **Go to** Stripe Dashboard → Developers → Webhooks
2. **Disable or delete** old/unused webhook endpoints
3. **Keep only** the new one you just created

## Troubleshooting

### Webhook Returns 401/403
- ❌ Edge Functions not deployed
- ❌ Missing SUPABASE_SERVICE_ROLE_KEY
- **Fix**: Deploy functions and set service role key

### Webhook Returns 400
- ❌ Wrong webhook secret
- ❌ Missing STRIPE_WEBHOOK_SECRET
- **Fix**: Copy correct secret from Stripe and set it

### Webhook Returns 404
- ❌ Edge Functions not deployed
- ❌ Wrong endpoint URL
- **Fix**: Deploy functions and verify URL

### Payment Succeeds but Plan Doesn't Upgrade
- ❌ Webhook not working
- ❌ Missing metadata in payment intent
- **Fix**: Ensure webhook is working and test with Payment Debugger

## Expected Webhook Flow

1. **User pays** → Stripe processes payment
2. **Stripe sends** `payment_intent.succeeded` to your webhook
3. **Webhook receives** event and verifies signature
4. **Webhook updates** user subscription in Supabase database
5. **User sees** plan upgraded in app

## Test with Real Payment

After setup, test with:
- **Card**: `4242 4242 4242 4242`
- **Expiry**: Any future date
- **CVC**: Any 3 digits
- **ZIP**: Any ZIP code

The webhook should automatically upgrade the user's plan from "free" to "starter" (or whatever plan they purchased).

## Verification Checklist

- [ ] New webhook endpoint created in Stripe
- [ ] Correct events selected (`payment_intent.succeeded` etc.)
- [ ] Webhook secret copied and set in Supabase
- [ ] Edge Functions deployed
- [ ] All environment variables set
- [ ] Test webhook returns 200 status
- [ ] Test payment upgrades plan automatically

Your webhook should now work perfectly! 🎉