# 🚀 Going Live with Stripe Payments

This guide will walk you through the process of transitioning from Stripe's test mode to live mode for processing real credit card payments.

## 1. Complete Stripe Account Verification

Before you can accept live payments, you need to complete Stripe's verification process:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Complete the "Activate your account" steps:
   - Business details
   - Bank account information
   - Identity verification
   - Business representative information

## 2. Create Live Products and Prices

1. Switch to **Live mode** in your Stripe Dashboard (toggle in top-left)
2. Go to **Products** and recreate your pricing plans:

   ### Starter Plan
   - **Name**: LLM Navigator - Starter Plan
   - **Price**: $29.00 USD Monthly
   - **Copy the Price ID** (starts with `price_`)

   ### Professional Plan
   - **Name**: LLM Navigator - Professional Plan
   - **Price**: $99.00 USD Monthly
   - **Copy the Price ID**

   ### Enterprise Plan
   - **Name**: LLM Navigator - Enterprise Plan
   - **Price**: $299.00 USD Monthly
   - **Copy the Price ID**

## 3. Update Environment Variables

Replace your test keys and price IDs with live ones in your `.env` file:

```
# Stripe Live Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_SECRET_KEY=sk_live_your_live_secret_key

# Stripe Live Price IDs
VITE_STRIPE_STARTER_PRICE_ID=price_your_live_starter_price_id
VITE_STRIPE_PROFESSIONAL_PRICE_ID=price_your_live_professional_price_id
VITE_STRIPE_ENTERPRISE_PRICE_ID=price_your_live_enterprise_price_id
```

## 4. Set Up Live Webhook Endpoint

1. In **Live mode**, go to **Developers → Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL**: `https://jgkdzaoajbzmuuajpndv.supabase.co/functions/v1/stripe-webhook`
4. **Events to send**:
   - `payment_intent.succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. **Copy the webhook secret** (starts with `whsec_`)
6. Update your environment variable:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
   ```

## 5. Deploy Edge Functions with Live Secrets

```bash
# Set your live Stripe secret key
npx supabase secrets set STRIPE_SECRET_KEY=sk_live_your_live_secret_key

# Set your live webhook secret
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret

# Redeploy all Edge Functions
npx supabase functions deploy create-payment-intent
npx supabase functions deploy create-subscription
npx supabase functions deploy stripe-webhook
```

## 6. PCI Compliance Considerations

When processing real credit cards, you must comply with Payment Card Industry Data Security Standard (PCI DSS):

1. **Use Stripe Elements**: Your app already uses Stripe Elements, which helps with PCI compliance by ensuring card data never touches your servers.

2. **Secure Your Environment**:
   - Use HTTPS everywhere
   - Keep your Stripe keys secure
   - Regularly update dependencies
   - Implement proper access controls

3. **Complete Stripe's PCI Self-Assessment Questionnaire**:
   - For most integrations using Stripe Elements, you'll need to complete SAQ A
   - This is available in your Stripe Dashboard under "Compliance"

## 7. Test Live Mode with a Real Card

Before full launch:

1. Make a small test purchase with a real card
2. Verify the payment appears in your Stripe Dashboard
3. Confirm the webhook updates the user's subscription
4. Check that the funds arrive in your bank account (may take 2-7 days)

## 8. Implement Proper Error Handling

Ensure your application gracefully handles payment failures:

1. Display clear error messages to users
2. Implement retry mechanisms
3. Set up monitoring and alerts for failed payments

## 9. Set Up Refund Process

Establish a clear process for handling refund requests:

1. Create a refund policy
2. Implement a refund interface in your admin dashboard
3. Test the refund process

## 10. Compliance and Legal Requirements

Ensure you have:

1. **Privacy Policy**: Update to include payment processing details
2. **Terms of Service**: Include subscription terms, cancellation policy
3. **Refund Policy**: Clearly state your refund terms
4. **Tax Compliance**: Configure tax settings in Stripe

## Important Stripe Dashboard Settings

Before going live, review these settings:

1. **Emails**: Configure customer emails for receipts, failed payments
2. **Branding**: Update your brand settings for receipts and customer portal
3. **Customer Portal**: Configure what customers can manage themselves
4. **Billing**: Set up dunning management for failed payments
5. **Tax**: Configure tax rates if applicable

## Going Live Checklist

- [ ] Stripe account fully verified
- [ ] Live products and prices created
- [ ] Live API keys and price IDs in environment variables
- [ ] Live webhook endpoint configured
- [ ] Edge Functions deployed with live secrets
- [ ] PCI compliance measures implemented
- [ ] Legal documents updated
- [ ] Test purchase completed successfully
- [ ] Monitoring set up for payment failures

Your application is already well-structured for handling real payments. By following these steps, you'll be able to transition from test mode to processing real credit cards safely and effectively.