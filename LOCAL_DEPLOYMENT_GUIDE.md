# 🚀 Complete Local Deployment Guide for LLM Navigator

## 📋 Overview

This guide will help you download your Bolt project and deploy it locally with full Stripe payment processing capabilities.

## 🎯 Step 1: Download Your Project from Bolt

### Option A: Download as ZIP
1. **In Bolt interface**, look for a **Download** or **Export** button
2. **Download the ZIP file** containing all your project files
3. **Extract the ZIP** to a folder on your computer (e.g., `llm-navigator`)

### Option B: Copy Files Manually
If no download option is available:
1. **Create a new folder** on your computer: `llm-navigator`
2. **Copy each file** from Bolt to your local folder
3. **Maintain the same folder structure** as shown in Bolt

## 🛠️ Step 2: Set Up Local Development Environment

### 1. Install Node.js
- Download and install Node.js from [nodejs.org](https://nodejs.org)
- Choose the LTS version (recommended)
- Verify installation: `node --version` and `npm --version`

### 2. Open Terminal/Command Prompt
- **Windows**: Press `Win + R`, type `cmd`, press Enter
- **Mac**: Press `Cmd + Space`, type `terminal`, press Enter
- **Linux**: Press `Ctrl + Alt + T`

### 3. Navigate to Your Project
```bash
# Change to your project directory
cd path/to/llm-navigator

# Example on Windows:
cd C:\Users\YourName\Downloads\llm-navigator

# Example on Mac/Linux:
cd ~/Downloads/llm-navigator
```

### 4. Install Dependencies
```bash
# Install all project dependencies
npm install
```

## 🔧 Step 3: Set Up Environment Variables

### 1. Create .env File
```bash
# Create environment file
touch .env
```

### 2. Add Your Configuration
Open `.env` in a text editor and add:

```bash
# Supabase Configuration (you already have these)
VITE_SUPABASE_URL=https://jgkdzaoajbzmuuajpndv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impna2R6YW9hamJ6bXV1YWpwbmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjM3NTksImV4cCI6MjA2NzA5OTc1OX0.DZfwDHZE67gmEuka2HMt-LI0WaG_0kKVROCktiuJN04
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impna2R6YW9hamJ6bXV1YWpwbmR2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTUyMzc1OSwiZXhwIjoyMDY3MDk5NzU5fQ.DOYDCrZJrV895yP6Qev4y8cRN1b0PUNK-JMvlwTFCBo

# Stripe Configuration (you need to add these)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# Stripe Price IDs (you'll get these after creating products)
VITE_STRIPE_STARTER_PRICE_ID=price_your_starter_price_id
VITE_STRIPE_PROFESSIONAL_PRICE_ID=price_your_professional_price_id
VITE_STRIPE_ENTERPRISE_PRICE_ID=price_your_enterprise_price_id

# Stripe Webhook Secret (you'll get this after setting up webhooks)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## 🏃‍♂️ Step 4: Test Local Development

### 1. Start Development Server
```bash
# Start the local development server
npm run dev
```

### 2. Open in Browser
- Your app should open automatically at `http://localhost:5173`
- If not, manually open that URL in your browser

### 3. Verify Everything Works
- ✅ App loads without errors
- ✅ You can navigate between pages
- ✅ Database connection works (if you see real data)

## ⚡ Step 5: Install and Set Up Supabase CLI

### 1. Install Supabase CLI
```bash
# Install globally
npm install -g supabase
```

### 2. Login to Supabase
```bash
# Login to your Supabase account
supabase login
```

### 3. Link to Your Project
```bash
# Link to your existing project
supabase link --project-ref jgkdzaoajbzmuuajpndv
```

## 🎯 Step 6: Set Up Stripe Integration

### 1. Get Stripe Keys
1. **Go to** [dashboard.stripe.com](https://dashboard.stripe.com)
2. **Make sure** you're in **Test mode** (toggle in top-left)
3. **Go to** Developers → API keys
4. **Copy** your Publishable key and Secret key
5. **Add them** to your `.env` file

### 2. Create Stripe Products
1. **Go to** Products in Stripe Dashboard
2. **Click** "Add product" for each plan:

#### Starter Plan
- **Name**: LLM Navigator - Starter Plan
- **Price**: $29.00 USD Monthly
- **Copy the Price ID** (starts with `price_`)

#### Professional Plan
- **Name**: LLM Navigator - Professional Plan
- **Price**: $99.00 USD Monthly
- **Copy the Price ID**

#### Enterprise Plan
- **Name**: LLM Navigator - Enterprise Plan
- **Price**: $299.00 USD Monthly
- **Copy the Price ID**

### 3. Update .env with Price IDs
Add the Price IDs you just copied to your `.env` file.

## 🚀 Step 7: Deploy Edge Functions

### 1. Set Environment Variables for Edge Functions
```bash
# Set Stripe secret key
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# Set Supabase service role key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impna2R6YW9hamJ6bXV1YWpwbmR2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTUyMzc1OSwiZXhwIjoyMDY3MDk5NzU5fQ.DOYDCrZJrV895yP6Qev4y8cRN1b0PUNK-JMvlwTFCBo
```

### 2. Deploy Edge Functions
```bash
# Deploy all Edge Functions
supabase functions deploy create-payment-intent
supabase functions deploy create-subscription
supabase functions deploy stripe-webhook
```

## 🔗 Step 8: Set Up Stripe Webhooks

### 1. Create Webhook Endpoint
1. **Go to** Stripe Dashboard → Developers → Webhooks
2. **Click** "Add endpoint"
3. **Endpoint URL**: `https://jgkdzaoajbzmuuajpndv.supabase.co/functions/v1/stripe-webhook`
4. **Select events**:
   - `payment_intent.succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

### 2. Get Webhook Secret
1. **Click** on your newly created webhook
2. **In** "Signing secret" section, click "Reveal"
3. **Copy** the secret (starts with `whsec_`)

### 3. Set Webhook Secret
```bash
# Set webhook secret in Supabase
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## ✅ Step 9: Test Everything

### 1. Test Local App
```bash
# Make sure your dev server is running
npm run dev
```

### 2. Test Payments
1. **Go to** pricing page in your app
2. **Try to** purchase a plan
3. **Use test card**: `4242 4242 4242 4242`
4. **Any future** expiry date, any CVC, any ZIP

### 3. Verify Edge Functions
```bash
# Test payment intent creation
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

## 🌐 Step 10: Deploy to Production (Optional)

### Option A: Deploy to Netlify
1. **Push** your code to GitHub
2. **Connect** GitHub repo to Netlify
3. **Set** build command: `npm run build`
4. **Set** publish directory: `dist`
5. **Add** environment variables in Netlify dashboard

### Option B: Deploy to Vercel
1. **Push** your code to GitHub
2. **Connect** GitHub repo to Vercel
3. **Add** environment variables in Vercel dashboard

## 🎉 Success Checklist

- [ ] Project downloaded and running locally
- [ ] Dependencies installed successfully
- [ ] Environment variables configured
- [ ] Supabase CLI installed and linked
- [ ] Stripe products created with Price IDs
- [ ] Edge Functions deployed
- [ ] Webhook endpoint configured
- [ ] Test payment completed successfully
- [ ] All features working locally

## 🆘 Troubleshooting

### Common Issues:

**"npm install" fails:**
- Make sure Node.js is installed
- Try deleting `node_modules` and running `npm install` again

**Edge Functions deployment fails:**
- Make sure you're logged into Supabase CLI
- Verify project is linked correctly
- Check that all environment variables are set

**Payments not working:**
- Verify all Stripe keys are correct
- Check that webhook endpoint is receiving events
- Use test cards in test mode

**App won't start:**
- Check for syntax errors in console
- Verify all environment variables are set
- Make sure port 5173 is not in use

## 🎯 Next Steps

Once everything is working locally:
1. **Test thoroughly** with different payment scenarios
2. **Switch to live mode** in Stripe when ready for production
3. **Deploy to production** hosting platform
4. **Set up monitoring** for payments and errors

You now have a fully functional LLM Navigator with complete payment processing! 🚀