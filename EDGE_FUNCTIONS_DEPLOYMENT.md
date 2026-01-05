# 🚀 Edge Functions Deployment Guide

## 🎯 What Are Edge Functions?

Edge Functions are serverless functions that run on Supabase's edge network. For LLM Navigator, they handle:

- **Payment Intent Creation** - Creates Stripe payment intents
- **Subscription Management** - Handles recurring subscriptions  
- **Webhook Processing** - Processes Stripe payment events

## 🚨 Why Can't We Deploy from Browser?

Edge Functions require:
- File system access to read function code
- Authentication with Supabase CLI
- Deployment permissions to your Supabase project
- Environment variable management

These operations can only be done from a terminal/command line environment.

## 📋 Step-by-Step Deployment Process

### Step 1: Install Supabase CLI

**On Windows:**
```bash
# Using npm (recommended)
npm install -g supabase

# Or using Chocolatey
choco install supabase

# Or using Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**On macOS:**
```bash
# Using npm (recommended)
npm install -g supabase

# Or using Homebrew
brew install supabase/tap/supabase
```

**On Linux:**
```bash
# Using npm (recommended)
npm install -g supabase

# Or download binary
curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar -xz
sudo mv supabase /usr/local/bin/
```

### Step 2: Login to Supabase

```bash
# Login to your Supabase account
supabase login
```

This will open a browser window for authentication.

### Step 3: Link to Your Project

```bash
# Navigate to your project directory
cd path/to/your/llm-navigator-project

# Link to your Supabase project
supabase link --project-ref jgkdzaoajbzmuuajpndv
```

### Step 4: Set Environment Variables

```bash
# Set Stripe secret key (get from Stripe Dashboard)
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# Set Supabase service role key (from your Supabase dashboard)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impna2R6YW9hamJ6bXV1YWpwbmR2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTUyMzc1OSwiZXhwIjoyMDY3MDk5NzU5fQ.DOYDCrZJrV895yP6Qev4y8cRN1b0PUNK-JMvlwTFCBo
```

### Step 5: Deploy Edge Functions

```bash
# Deploy all three Edge Functions
supabase functions deploy create-payment-intent
supabase functions deploy create-subscription  
supabase functions deploy stripe-webhook
```

### Step 6: Set Up Stripe Webhook

1. **Go to Stripe Dashboard** → Developers → Webhooks
2. **Click "Add endpoint"**
3. **Endpoint URL**: `https://jgkdzaoajbzmuuajpndv.supabase.co/functions/v1/stripe-webhook`
4. **Select events**:
   - `payment_intent.succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. **Copy webhook secret** and run:

```bash
# Set webhook secret
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## ✅ Verification Commands

```bash
# Check if functions are deployed
supabase functions list

# Check environment variables
supabase secrets list

# Test a function
curl -X POST 'https://jgkdzaoajbzmuuajpndv.supabase.co/functions/v1/create-payment-intent' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impna2R6YW9hamJ6bXV1YWpwbmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjM3NTksImV4cCI6MjA2NzA5OTc1OX0.DZfwDHZE67gmEuka2HMt-LI0WaG_0kKVROCktiuJN04' \
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

## 🎮 Alternative: Use Your App Without Edge Functions

**Good news!** Your app is fully functional without Edge Functions:

1. **✅ All features work** - Analysis, reports, PDF generation
2. **✅ User accounts** - Sign up, login, profiles  
3. **✅ Demo mode** - Unlimited analyses for testing
4. **✅ Full UI** - Complete user experience

The only limitation is that **real payment processing** won't work until Edge Functions are deployed.

## 🚀 Quick Start Without Deployment

1. Go to your app
2. Click "Sign In" → "Start your free trial"  
3. Create an account
4. Run unlimited demo analyses
5. Test all features

## 🆘 Need Help?

If you're not comfortable with command line:

1. **Use demo mode** - Your app works perfectly for testing
2. **Ask a developer** - Have someone with CLI access deploy for you
3. **Use GitHub Codespaces** - Deploy from a cloud environment
4. **Contact support** - Supabase support can help with deployment

## 📱 What Happens After Deployment?

Once Edge Functions are deployed:
- ✅ Real payment processing works
- ✅ Stripe integration is complete  
- ✅ Webhooks process payment events
- ✅ Users can purchase subscriptions
- ✅ Trial-to-paid conversions work

Your app will be **100% production-ready**! 🎉