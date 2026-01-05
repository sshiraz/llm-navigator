# 🚀 Deployment Guide for LLM Navigator

## 📋 Prerequisites

Before deploying, ensure you have:
- ✅ Supabase account and project created
- ✅ Stripe account with test/live keys
- ✅ Price IDs from your Stripe products
- ✅ Environment variables configured

## 🗄️ Step 1: Deploy Database Schema

The database schema is already created in your Supabase project via the migrations. If you need to run them manually:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run the migration files in order:
   - `20250703064027_weathered_glitter.sql`
   - `20250703230338_tender_violet.sql`

## ⚡ Step 2: Deploy Supabase Edge Functions

Edge Functions handle payment processing and webhooks. Deploy them using the Supabase CLI:

### Install Supabase CLI (if not already installed)
```bash
npm install -g supabase
```

### Login to Supabase
```bash
supabase login
```

### Link to your project
```bash
supabase link --project-ref YOUR_PROJECT_ID
```

### Deploy all Edge Functions
```bash
supabase functions deploy create-payment-intent
supabase functions deploy create-subscription  
supabase functions deploy stripe-webhook
```

### Set Environment Variables for Edge Functions
```bash
# Set your Stripe secret key
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# Set your Stripe webhook secret (get this after creating webhook)
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Set Supabase service role key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🎯 Step 3: Configure Stripe Webhooks

1. **Go to Stripe Dashboard → Developers → Webhooks**
2. **Click "Add endpoint"**
3. **Set endpoint URL**: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/stripe-webhook`
4. **Select events**:
   - `payment_intent.succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. **Copy the webhook secret** and add it to your environment variables

## 🔧 Step 4: Update Environment Variables

Make sure your `.env` file has all required variables:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key

# Stripe Price IDs (from your Stripe Dashboard)
VITE_STRIPE_STARTER_PRICE_ID=price_1RgwZiCjH1LpHt8CBPejppR9
VITE_STRIPE_PROFESSIONAL_PRICE_ID=price_1RgwYQCjH1LpHt8CPrKsgwLr
VITE_STRIPE_ENTERPRISE_PRICE_ID=price_1ReVLmCjH1LpHt8C8tqU5e96

# Stripe Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## 🧪 Step 5: Test Your Integration

### Test Edge Functions
```bash
# Test payment intent creation
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

### Test Stripe Integration
1. Use test card: `4242 4242 4242 4242`
2. Any future expiry date
3. Any 3-digit CVC
4. Any ZIP code

## 🌐 Step 6: Deploy Frontend

### Option A: Deploy to Netlify
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard

### Option B: Deploy to Vercel
1. Connect your GitHub repository to Vercel
2. Vercel will auto-detect Vite configuration
3. Add environment variables in Vercel dashboard

### Option C: Deploy to Supabase (Static Hosting)
```bash
# Build your project
npm run build

# Deploy to Supabase
supabase hosting deploy
```

## ✅ Step 7: Verification Checklist

- [ ] Database schema deployed
- [ ] Edge Functions deployed and working
- [ ] Stripe webhook configured and receiving events
- [ ] Environment variables set correctly
- [ ] Test payments working
- [ ] Frontend deployed and accessible
- [ ] SSL certificate active
- [ ] Domain configured (if using custom domain)

## 🔍 Troubleshooting

### Common Issues:

**Edge Functions not working:**
- Check function logs: `supabase functions logs stripe-webhook`
- Verify environment variables: `supabase secrets list`

**Stripe webhook failing:**
- Check webhook logs in Stripe Dashboard
- Verify endpoint URL is correct
- Ensure webhook secret is set correctly

**Payment processing errors:**
- Check Stripe logs in Dashboard → Developers → Logs
- Verify Price IDs are correct
- Ensure you're using test cards in test mode

**Database connection issues:**
- Verify Supabase URL and keys
- Check RLS policies are correctly set
- Ensure migrations have run successfully

## 🆘 Need Help?

1. **Check logs**: Supabase Dashboard → Logs
2. **Test endpoints**: Use Postman or curl to test Edge Functions
3. **Stripe Dashboard**: Check payment and webhook logs
4. **Supabase Support**: Use the support chat in your dashboard

## 🎉 You're Ready!

Once all steps are complete, your LLM Navigator application will be fully deployed with:
- ✅ Real-time database
- ✅ User authentication
- ✅ Payment processing
- ✅ Webhook handling
- ✅ Production-ready hosting

Your users can now sign up, purchase plans, and use all features of LLM Navigator!