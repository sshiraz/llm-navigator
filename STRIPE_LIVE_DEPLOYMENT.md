# 🚀 Deploying Stripe Live Mode

This guide provides step-by-step instructions for deploying your application with Stripe in live mode to process real credit card payments.

## Prerequisites

Before proceeding, ensure you have:

- ✅ Completed Stripe account verification
- ✅ Created live products and prices in Stripe
- ✅ Set up your bank account for payouts
- ✅ Updated your legal documents (privacy policy, terms of service)

## Step 1: Update Environment Variables

Create a new `.env.production` file with your live Stripe keys:

```bash
# Supabase Configuration (same as development)
VITE_SUPABASE_URL=https://jgkdzaoajbzmuuajpndv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impna2R6YW9hamJ6bXV1YWpwbmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjM3NTksImV4cCI6MjA2NzA5OTc1OX0.DZfwDHZE67gmEuka2HMt-LI0WaG_0kKVROCktiuJN04
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impna2R6YW9hamJ6bXV1YWpwbmR2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTUyMzc1OSwiZXhwIjoyMDY3MDk5NzU5fQ.DOYDCrZJrV895yP6Qev4y8cRN1b0PUNK-JMvlwTFCBo

# Stripe LIVE Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_SECRET_KEY=sk_live_your_live_secret_key

# Stripe LIVE Price IDs
VITE_STRIPE_STARTER_PRICE_ID=price_live_your_starter_price_id
VITE_STRIPE_PROFESSIONAL_PRICE_ID=price_live_your_professional_price_id
VITE_STRIPE_ENTERPRISE_PRICE_ID=price_live_your_enterprise_price_id

# Stripe LIVE Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
```

## Step 2: Set Up Live Webhook Endpoint

1. In Stripe Dashboard (Live Mode), go to **Developers → Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL**: `https://jgkdzaoajbzmuuajpndv.supabase.co/functions/v1/stripe-webhook`
4. **Events to send**:
   - `payment_intent.succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copy the webhook secret (starts with `whsec_`)

## Step 3: Deploy Edge Functions with Live Configuration

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

## Step 4: Build for Production

```bash
# Build with production environment variables
npm run build
```

## Step 5: Deploy to Your Hosting Provider

### Option A: Deploy to Netlify

```bash
# Install Netlify CLI if not already installed
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize Netlify site
netlify init

# Deploy to Netlify
netlify deploy --prod
```

### Option B: Deploy to Vercel

```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to Vercel
vercel --prod
```

### Option C: Deploy to Supabase Hosting

```bash
# Deploy to Supabase Hosting
supabase hosting deploy
```

## Step 6: Verify Live Deployment

1. Visit your deployed site
2. Create a test account
3. Make a small test purchase with a real card
4. Verify the payment appears in your Stripe Dashboard
5. Confirm the subscription is updated in your database

## Step 7: Set Up Monitoring

1. Configure Stripe webhooks to notify you of failures
2. Set up monitoring for your Edge Functions
3. Create alerts for payment failures

## Step 8: Test Refund Process

1. Process a small test payment
2. Issue a refund through Stripe Dashboard
3. Verify the refund is processed correctly

## Important Security Considerations

1. **Environment Variables**: Never expose your Stripe secret key or webhook secret
2. **HTTPS**: Ensure all communication uses HTTPS
3. **Access Control**: Limit who can access payment data
4. **Logging**: Don't log sensitive payment information
5. **Error Handling**: Implement proper error handling for payment failures

## Troubleshooting

### Webhook Issues
- Check webhook logs in Stripe Dashboard
- Verify webhook secret is set correctly
- Ensure Edge Functions are deployed

### Payment Processing Issues
- Check Stripe Dashboard for payment errors
- Verify price IDs are correct
- Test with different cards

### Subscription Issues
- Check webhook events for subscription updates
- Verify database updates after subscription changes
- Test subscription cancellation and updates

## Going Forward

- Monitor your Stripe Dashboard regularly
- Keep your Stripe SDK and dependencies updated
- Stay informed about Stripe API changes
- Regularly review your security practices

By following these steps, you'll have a production-ready application that can process real credit card payments through Stripe.