# 🚀 PowerShell Deployment Guide for Edge Functions

## 🎯 Windows PowerShell Instructions

Since your environment variables are perfectly configured, you just need to deploy the Edge Functions using PowerShell.

## 📋 Step-by-Step PowerShell Commands

### Step 1: Install Supabase CLI

Open **PowerShell as Administrator** and run:

```powershell
# Option 1: Using npm (recommended)
npm install -g supabase

# Option 2: Using Chocolatey (if you have it)
choco install supabase

# Option 3: Using Scoop (if you have it)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Step 2: Verify Installation

```powershell
# Check if Supabase CLI is installed
supabase --version

# Should show something like: supabase 1.x.x
```

### Step 3: Login to Supabase

```powershell
# Login to your Supabase account
supabase login
```

This will open your browser for authentication. Complete the login process.

### Step 4: Navigate to Your Project

```powershell
# Navigate to your project directory
# Replace with your actual project path
cd "C:\path\to\your\llm-navigator-project"

# Or if you're in the project folder already:
pwd  # Check current directory
```

### Step 5: Link to Your Supabase Project

```powershell
# Link to your existing Supabase project
supabase link --project-ref jgkdzaoajbzmuuajpndv
```

### Step 6: Set Environment Variables for Edge Functions

```powershell
# Set Stripe secret key (get from Stripe Dashboard)
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# Set Supabase service role key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impna2R6YW9hamJ6bXV1YWpwbmR2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTUyMzc1OSwiZXhwIjoyMDY3MDk5NzU5fQ.DOYDCrZJrV895yP6Qev4y8cRN1b0PUNK-JMvlwTFCBo
```

### Step 7: Deploy Edge Functions

```powershell
# Deploy all three Edge Functions one by one
supabase functions deploy create-payment-intent
supabase functions deploy create-subscription
supabase functions deploy stripe-webhook
```

### Step 8: Verify Deployment

```powershell
# Check if functions are deployed
supabase functions list

# Check environment variables are set
supabase secrets list
```

## 🔗 Step 9: Set Up Stripe Webhook

### In Stripe Dashboard:
1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Make sure you're in **Test mode**
3. Go to **Developers** → **Webhooks**
4. Click **"Add endpoint"**
5. **Endpoint URL**: `https://jgkdzaoajbzmuuajpndv.supabase.co/functions/v1/stripe-webhook`
6. **Select events**:
   - `payment_intent.succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
7. **Copy the webhook secret** (starts with `whsec_`)

### Back in PowerShell:
```powershell
# Set the webhook secret
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## ✅ Step 10: Test Your Deployment

### Test Edge Function:
```powershell
# Test if your payment intent function works
curl -X POST 'https://jgkdzaoajbzmuuajpndv.supabase.co/functions/v1/create-payment-intent' `
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impna2R6YW9hamJ6bXV1YWpwbmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjM3NTksImV4cCI6MjA2NzA5OTc1OX0.DZfwDHZE67gmEuka2HMt-LI0WaG_0kKVROCktiuJN04' `
  -H 'Content-Type: application/json' `
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

## 🎯 What You Need from Stripe

**Get your Stripe Secret Key:**
1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Make sure you're in **Test mode** (toggle in top-left)
3. Go to **Developers** → **API keys**
4. Copy your **Secret key** (starts with `sk_test_`)
5. Use it in the `STRIPE_SECRET_KEY` command above

## 🚨 PowerShell Troubleshooting

### If npm command fails:
```powershell
# Check if Node.js is installed
node --version
npm --version

# If not installed, download from: https://nodejs.org
```

### If curl command fails:
```powershell
# Use Invoke-RestMethod instead of curl
$headers = @{
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impna2R6YW9hamJ6bXV1YWpwbmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjM3NTksImV4cCI6MjA2NzA5OTc1OX0.DZfwDHZE67gmEuka2HMt-LI0WaG_0kKVROCktiuJN04'
    'Content-Type' = 'application/json'
}

$body = @{
    amount = 2900
    currency = "usd"
    metadata = @{
        userId = "test-user"
        plan = "starter"
        email = "test@example.com"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri 'https://jgkdzaoajbzmuuajpndv.supabase.co/functions/v1/create-payment-intent' -Method POST -Headers $headers -Body $body
```

### If execution policy blocks scripts:
```powershell
# Check current execution policy
Get-ExecutionPolicy

# If it's Restricted, temporarily allow scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# After deployment, you can revert if needed
Set-ExecutionPolicy -ExecutionPolicy Restricted -Scope CurrentUser
```

## 🎉 Success Checklist

After running all commands, you should have:
- ✅ Supabase CLI installed
- ✅ Logged into Supabase
- ✅ Project linked
- ✅ Environment variables set
- ✅ All 3 Edge Functions deployed
- ✅ Stripe webhook configured
- ✅ Test payment working

## 🚀 Test Real Payments in Your App

1. **Go to your app**
2. **Click "Pricing"** in the sidebar
3. **Click "Start Free Trial"** or **"Skip Trial - Buy Now"**
4. **Use test card**: `4242 4242 4242 4242`
5. **Any future expiry date**
6. **Any 3-digit CVC**
7. **Any ZIP code**

## 🎯 Alternative: Use Demo Mode

If you can't deploy Edge Functions right now, your app is **fully functional** in demo mode:
- ✅ Unlimited analyses
- ✅ PDF reports
- ✅ All features work
- ❌ Only real payments won't work

## 🆘 Need Help?

**Common PowerShell Issues:**
1. **"supabase not recognized"** → Restart PowerShell after installing
2. **"Execution policy"** → Use the Set-ExecutionPolicy commands above
3. **"npm not found"** → Install Node.js from nodejs.org
4. **"Access denied"** → Run PowerShell as Administrator

**Still stuck?** Your app works perfectly in demo mode while you figure out deployment!

## 🎉 After Deployment: 100% Complete!

Once deployed, your LLM Navigator will have:
- ✅ Real payment processing
- ✅ Stripe integration
- ✅ Production-ready functionality
- ✅ Full subscription management

Your app will be **completely ready for real users**! 🚀