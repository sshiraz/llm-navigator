# 🚀 Manual Subscription Update Guide

## Quick Fix: Update Your Subscription Manually

Since your payment succeeded but the webhook failed, let's manually update your subscription in the database.

## Step-by-Step Instructions

### 1. Access Supabase Dashboard
- Go to: https://supabase.com/dashboard/project/jgkdzaoajbzmuuajpndv
- Log in with your Supabase account

### 2. Navigate to Table Editor
- Click **"Table Editor"** in the left sidebar
- Click on the **"users"** table

### 3. Find Your User Record
- Look for your user record (you can search by email)
- You should see columns like: `id`, `email`, `name`, `subscription`, etc.

### 4. Edit Your User Record
- Click the **Edit** button (pencil icon) on your row
- Update these fields:
  - **subscription**: Change from `trial` to `starter`
  - **payment_method_added**: Change to `true`
- Click **Save**

### 5. Verify the Update
- Your row should now show:
  - `subscription`: `starter`
  - `payment_method_added`: `true`

### 6. Test Your App
- Go to your deployed app: https://llmsearchinsight.com
- Refresh the page (Ctrl+F5 or Cmd+Shift+R)
- You should now see "Starter Plan" in your account

## What This Does

This manual update:
- ✅ Activates your Starter plan features
- ✅ Removes trial limitations
- ✅ Enables real website analysis
- ✅ Unlocks all Starter plan benefits

## Visual Guide

```
Before:
subscription: "trial"
payment_method_added: false

After:
subscription: "starter"  ← Change this
payment_method_added: true  ← Change this
```

## Alternative: SQL Query Method

If you prefer, you can also run this SQL query in the SQL Editor:

```sql
-- Replace 'your-email@example.com' with your actual email
UPDATE users 
SET 
  subscription = 'starter',
  payment_method_added = true,
  updated_at = now()
WHERE email = 'your-email@example.com';
```

## After Manual Fix

Once you've manually updated your subscription:

1. **Your app will work immediately** with Starter plan features
2. **Future payments will work automatically** once we fix the webhook
3. **You can run real analyses** instead of demo ones

## Next Steps

After the manual fix:
1. Test your Starter plan features
2. We'll fix the webhook for future payments
3. Everything should work perfectly! 🎉

---

**Need help?** If you can't find your user record or have trouble editing, let me know and I can provide more specific guidance.