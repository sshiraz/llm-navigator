# 🚀 Install Node.js for Windows PowerShell

## 🎯 Why You Need Node.js

The `npm` command (Node Package Manager) comes with Node.js. You need it to install the Supabase CLI.

## 📋 Step 1: Download Node.js

1. **Go to** [nodejs.org](https://nodejs.org)
2. **Download** the **LTS version** (recommended for most users)
3. **Choose** the Windows Installer (.msi) - 64-bit

## 📦 Step 2: Install Node.js

1. **Run the downloaded .msi file**
2. **Click "Next"** through the installer
3. **Accept the license agreement**
4. **Keep default installation path** (usually `C:\Program Files\nodejs\`)
5. **Make sure** "Add to PATH" is checked ✅
6. **Click "Install"**
7. **Click "Finish"**

## ✅ Step 3: Verify Installation

**Open a NEW PowerShell window** (important - close old ones) and run:

```powershell
# Check Node.js version
node --version
# Should show: v18.x.x or v20.x.x

# Check npm version  
npm --version
# Should show: 9.x.x or 10.x.x
```

## 🚀 Step 4: Now Install Supabase CLI

```powershell
# Now this should work!
npm install -g supabase

# Verify Supabase CLI installation
supabase --version
```

## 🎯 Step 5: Continue with Edge Functions Deployment

Now you can follow the PowerShell deployment guide:

```powershell
# 1. Login to Supabase
supabase login

# 2. Navigate to your project (replace with your actual path)
cd "C:\path\to\your\llm-navigator-project"

# 3. Link to your project
supabase link --project-ref jgkdzaoajbzmuuajpndv

# 4. Set environment variables (you need your Stripe secret key)
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impna2R6YW9hamJ6bXV1YWpwbmR2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTUyMzc1OSwiZXhwIjoyMDY3MDk5NzU5fQ.DOYDCrZJrV895yP6Qev4y8cRN1b0PUNK-JMvlwTFCBo

# 5. Deploy Edge Functions
supabase functions deploy create-payment-intent
supabase functions deploy create-subscription
supabase functions deploy stripe-webhook
```

## 🔑 What You Still Need

**Get your Stripe Secret Key:**
1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Make sure you're in **Test mode** (toggle in top-left)
3. Go to **Developers** → **API keys**
4. Copy your **Secret key** (starts with `sk_test_`)

## 🚨 Troubleshooting

**If commands still don't work after installing Node.js:**
1. **Close ALL PowerShell windows**
2. **Open a NEW PowerShell window**
3. **Try the commands again**

**If you get permission errors:**
1. **Right-click PowerShell**
2. **Select "Run as Administrator"**
3. **Try the commands again**

## 🎮 Alternative: Test Your App Right Now!

While you're installing Node.js, **your app is fully functional** in demo mode:

1. **Go to your app**
2. **Click "Sign In"** → **"Start your free trial"**
3. **Create an account**
4. **Run unlimited analyses**
5. **Generate PDF reports**
6. **Test all features**

Everything works except real payment processing!

## 🎉 After Node.js Installation

Once Node.js is installed, you'll be able to:
- ✅ Install Supabase CLI
- ✅ Deploy Edge Functions
- ✅ Enable real payment processing
- ✅ Have a 100% production-ready app

## 📞 Need Help?

**Common Issues:**
- **"Command not found"** → Restart PowerShell after installing Node.js
- **"Permission denied"** → Run PowerShell as Administrator
- **"Path not found"** → Make sure "Add to PATH" was checked during installation

Your app is amazing and works perfectly in demo mode while you set this up! 🌟