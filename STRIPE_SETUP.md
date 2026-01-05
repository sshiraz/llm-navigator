# Stripe Integration Setup Guide

## 🔑 Step 1: Create Products and Prices in Stripe

### 1. Access Stripe Dashboard
- Go to [dashboard.stripe.com](https://dashboard.stripe.com)
- Make sure you're in **Test mode** (toggle in top-left)

### 2. Create Products
Navigate to **Products** in the left sidebar, then click **"Add product"** for each plan:

#### Starter Plan
- **Name**: LLM Navigator - Starter Plan
- **Description**: Perfect for small businesses getting started with AI search optimization
- **Pricing Model**: Recurring
- **Price**: $29.00 USD
- **Billing Period**: Monthly
- **Copy the Price ID** (starts with `price_`) - you'll need this!

#### Professional Plan  
- **Name**: LLM Navigator - Professional Plan
- **Description**: For agencies and serious marketers
- **Pricing Model**: Recurring
- **Price**: $99.00 USD
- **Billing Period**: Monthly
- **Copy the Price ID** (starts with `price_`) - you'll need this!

#### Enterprise Plan
- **Name**: LLM Navigator - Enterprise Plan
- **Description**: For large organizations and teams
- **Pricing Model**: Recurring
- **Price**: $299.00 USD
- **Billing Period**: Monthly
- **Copy the Price ID** (starts with `price_`) - you'll need this!

### 3. Update Your Environment Variables

Add these to your `.env` file:

```bash
# Existing Stripe keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here

# New: Stripe Price IDs
VITE_STRIPE_STARTER_PRICE_ID=price_your_starter_price_id
VITE_STRIPE_PROFESSIONAL_PRICE_ID=price_your_professional_price_id  
VITE_STRIPE_ENTERPRISE_PRICE_ID=price_your_enterprise_price_id

# Webhook endpoint secret (we'll set this up next)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## 🎯 Step 2: Set Up Webhooks (Important!)

Webhooks ensure your app knows when payments succeed or fail.

### 1. Create Webhook Endpoint
- In Stripe Dashboard, go to **Developers → Webhooks**
- Click **"Add endpoint"**
- **Endpoint URL**: `https://your-supabase-project.supabase.co/functions/v1/stripe-webhook`
- **Events to send**:
  - `payment_intent.succeeded`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`

### 2. Get Webhook Secret
- After creating the webhook, click on it
- In the **Signing secret** section, click **"Reveal"**
- Copy the webhook secret (starts with `whsec_`)
- Add it to your `.env` file as `STRIPE_WEBHOOK_SECRET`

## 🚀 Step 3: Test Your Integration

### Test Cards (Use these in Test Mode):
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

Use any future expiry date, any 3-digit CVC, and any ZIP code.

## 🔒 Step 4: Security Checklist

- ✅ Never commit `.env` files to Git
- ✅ Use test keys for development
- ✅ Webhook endpoint is secured
- ✅ Price IDs are correctly configured
- ✅ Test payments work end-to-end

## 📋 Quick Reference

Your Stripe integration includes:
- ✅ Payment processing for one-time purchases
- ✅ Subscription management
- ✅ Webhook handling for payment events
- ✅ Fraud prevention integration
- ✅ Trial and direct purchase options
- ✅ Secure checkout forms
- ✅ Database integration for payment tracking

## 🆘 Troubleshooting

**Common Issues:**
1. **"No such price"** → Check your Price IDs are correct
2. **Webhook not working** → Verify the endpoint URL and secret
3. **Payment fails** → Check you're using test cards in test mode
4. **CORS errors** → Ensure your domain is added to Stripe settings

**Need Help?**
- Check Stripe logs in Dashboard → Developers → Logs
- Test webhooks in Dashboard → Developers → Webhooks → [Your webhook] → Test