# 🎯 Complete Stripe Setup Instructions

## 🚨 IMPORTANT: Deploy Edge Functions First!

Before your Stripe integration will work, you MUST deploy the Supabase Edge Functions. Here's the complete process:

## 📋 Step 1: Install Supabase CLI

```bash
# Install Supabase CLI globally
npm install -g supabase

# Login to your Supabase account
supabase login

# Link to your project (replace with your project ID)
supabase link --project-ref YOUR_PROJECT_ID
```

## ⚡ Step 2: Deploy Edge Functions

```bash
# Deploy all three Edge Functions
supabase functions deploy create-payment-intent
supabase functions deploy create-subscription
supabase functions deploy stripe-webhook
```

## 🔐 Step 3: Set Environment Variables for Edge Functions

```bash
# Set your Stripe secret key
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# Set Supabase service role key (from your Supabase dashboard)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Webhook secret will be set after creating the webhook endpoint
```

## 🎯 Step 4: Create Stripe Products & Get Price IDs

### 1. Go to Stripe Dashboard
- Visit [dashboard.stripe.com](https://dashboard.stripe.com)
- Make sure you're in **Test mode**

### 2. Create Products
Go to **Products** → **Add product** for each plan:

#### Starter Plan
- **Name**: LLM Navigator - Starter Plan  
- **Price**: $29.00 USD Monthly
- **Copy the Price ID**: `price_xxxxxxxxx`

#### Professional Plan
- **Name**: LLM Navigator - Professional Plan
- **Price**: $99.00 USD Monthly  
- **Copy the Price ID**: `price_xxxxxxxxx`

#### Enterprise Plan
- **Name**: LLM Navigator - Enterprise Plan
- **Price**: $299.00 USD Monthly
- **Copy the Price ID**: `price_xxxxxxxxx`

### 3. Update Your .env File
```bash
# Add the Price IDs you just copied
VITE_STRIPE_STARTER_PRICE_ID=price_your_starter_price_id
VITE_STRIPE_PROFESSIONAL_PRICE_ID=price_your_professional_price_id
VITE_STRIPE_ENTERPRISE_PRICE_ID=price_your_enterprise_price_id
```

## 🔗 Step 5: Set Up Webhook Endpoint

### 1. Create Webhook
- Go to **Developers** → **Webhooks** → **Add endpoint**
- **Endpoint URL**: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/stripe-webhook`
- **Events to send**:
  - `payment_intent.succeeded`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`

### 2. Get Webhook Secret
- Click on your newly created webhook
- In **Signing secret** section, click **Reveal**
- Copy the secret (starts with `whsec_`)

### 3. Set Webhook Secret
```bash
# Set the webhook secret in Supabase
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## ✅ Step 6: Test Everything

### 1. Test Edge Functions
```bash
# Test if your payment intent function works
curl -X POST 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/create-payment-intent' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "amount": 2900,
    "currency": "usd", 
    "metadata": {
      "userId": "test-user",
      "plan": "starter",
      "email": "test@example.com"
    }
  }'
```

### 2. Test Payments in Your App
- Use test card: `4242 4242 4242 4242`
- Any future expiry date
- Any 3-digit CVC
- Any ZIP code

## 🎉 Final Checklist

- [ ] Supabase CLI installed and logged in
- [ ] Edge Functions deployed successfully
- [ ] Stripe secret keys set in Supabase
- [ ] Stripe products created with Price IDs
- [ ] Price IDs added to .env file
- [ ] Webhook endpoint created and configured
- [ ] Webhook secret set in Supabase
- [ ] Test payment completed successfully

## 🔧 Your Complete .env File Should Look Like:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe Configuration  
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key

# Stripe Price IDs
VITE_STRIPE_STARTER_PRICE_ID=price_1RgwZiCjH1LpHt8CBPejppR9
VITE_STRIPE_PROFESSIONAL_PRICE_ID=price_1RgwYQCjH1LpHt8CPrKsgwLr
VITE_STRIPE_ENTERPRISE_PRICE_ID=price_1ReVLmCjH1LpHt8C8tqU5e96

# Stripe Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## 🚨 Important Notes:

1. **Edge Functions are required** - Without them, payments won't work
2. **Use Test Mode** - Always test in Stripe test mode first
3. **Webhook is critical** - Without it, your app won't know when payments succeed
4. **Environment variables** - Make sure all variables are set correctly

Once you complete these steps, your Stripe integration will be fully functional! 🎉