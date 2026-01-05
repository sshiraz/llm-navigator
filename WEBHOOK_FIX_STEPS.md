# 🚨 Fix Webhook Issues - Step by Step Guide

## The Problem
Your payment succeeded in Stripe, but your subscription didn't update from "free" to "starter". This is because the webhook isn't working correctly.

## Step 1: Run the SQL Migration to Fix Your Current Subscription

First, let's manually fix your subscription since your payment already succeeded:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/jgkdzaoajbzmuuajpndv
2. Click on **SQL Editor** in the left sidebar
3. Create a new query
4. Paste and run this SQL:

```sql
-- Update users with successful payments but still on free/trial plan
UPDATE users
SET 
  subscription = 'starter',
  payment_method_added = true,
  updated_at = now()
WHERE id IN (
  SELECT DISTINCT u.id
  FROM users u
  JOIN payments p ON u.id = p.user_id
  WHERE p.status = 'succeeded'
  AND (u.subscription = 'free' OR u.subscription = 'trial')
);
```

## Step 2: Verify Your Webhook Secret

The webhook is failing because the webhook secret might be incorrect. Let's update it:

1. Go to Stripe Dashboard: https://dashboard.stripe.com/test/webhooks
2. Click on your webhook endpoint
3. In the **Signing secret** section, click **Reveal**
4. Copy the webhook secret (starts with `whsec_`)
5. Run this command in your terminal:

```bash
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## Step 3: Redeploy the Webhook Function

After updating the secret, redeploy the webhook function:

```bash
npx supabase functions deploy stripe-webhook
```

## Step 4: Test the Webhook

1. In Stripe Dashboard, go to your webhook endpoint
2. Click **Send test webhook**
3. Select `payment_intent.succeeded`
4. Click **Send test webhook**
5. Check if it shows "Success" (200 status)

## Step 5: Verify Your Subscription

1. Go back to your app
2. Refresh the page
3. You should now see "Starter Plan" in your account

## Troubleshooting

If you're still having issues:

1. Use the **Payment Debugger** in your app (red bug icon)
2. Click **Test Webhook** to check if it's accessible
3. Click **Check Edge Functions** to verify deployment
4. Use the **Fix Subscription** tool to manually update your plan

## For Future Payments

After fixing the webhook, future payments should automatically update subscriptions without any manual intervention.

## Need More Help?

Use the **Webhook Debugger** in your app to:
1. Test the webhook endpoint
2. Update the webhook secret
3. Get deployment commands

Your payment was successful - we just need to make sure the webhook works for future payments! 🎉