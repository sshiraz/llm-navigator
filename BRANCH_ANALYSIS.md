# Branch Analysis

> Historical record of commit changes and the reasoning behind implementation decisions.
> This document explains *why* code was implemented a certain way, not just *what* changed.

---

## 2026-01-12: Admin accounts auto-enterprise (no billing)

**Commit:** `pending` - Auto-assign enterprise to admin accounts, hide billing UI

### Context

Admin accounts should receive automatic enterprise access without being billed:
1. When a user is made admin, they should get enterprise plan automatically
2. Admin accounts shouldn't show billing-related UI (payment method, billing cycle, etc.)
3. Stripe webhooks shouldn't modify admin subscription status

### Changes & Reasoning

#### 1. Database trigger for auto-enterprise assignment

**SQL Migration:**

```sql
-- Trigger function to auto-assign enterprise when is_admin = true
CREATE OR REPLACE FUNCTION handle_admin_enterprise()
RETURNS TRIGGER AS $$
BEGIN
  -- If is_admin changed to true, set enterprise subscription
  IF NEW.is_admin = true AND (OLD.is_admin IS NULL OR OLD.is_admin = false) THEN
    NEW.subscription = 'enterprise';
    NEW.payment_method_added = true;
  END IF;
  -- Prevent admins from being downgraded from enterprise
  IF NEW.is_admin = true AND NEW.subscription != 'enterprise' THEN
    NEW.subscription = 'enterprise';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists, then create
DROP TRIGGER IF EXISTS on_admin_enterprise ON users;
CREATE TRIGGER on_admin_enterprise
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION handle_admin_enterprise();
```

**Why trigger:** Ensures enterprise status is always enforced at database level, even if code changes or API is called directly. Single source of truth.

**Why prevent downgrade:** Even if Stripe webhook tries to change admin subscription, the trigger forces it back to enterprise.

#### 2. Hide billing UI for admin accounts

**File:** `src/components/Account/AccountPage.tsx`

```typescript
const isAdmin = user.isAdmin === true;

// Hide Payment Method, Billing Cycle, Next Billing Date for admins
{!isAdmin && <PaymentMethodSection />}

// Show "Admin Account (No billing)" badge instead
{isAdmin && <AdminAccountBadge />}

// Hide "Upgrade Plan" and "Cancel Subscription" buttons for admins
{!isAdmin && user.subscription !== 'enterprise' && <UpgradeButton />}
{!isAdmin && isPaidPlan && <CancelButton />}
```

**Why hide:** Admins have automatic enterprise - showing payment UI would be confusing and potentially lead to unnecessary Stripe subscriptions.

#### 3. Skip admin users in Stripe webhooks

**File:** `supabase/functions/stripe-webhook/index.ts`

```typescript
// In handleSubscriptionChange, handleCheckoutSessionCompleted, handleSubscriptionCancellation
const { data: userData } = await supabase
  .from('users')
  .select('is_admin')
  .eq('id', userId)
  .maybeSingle();

if (userData?.is_admin) {
  console.log("👑 User is admin - skipping subscription change");
  return;
}
```

**Why check in webhook:** Even if an admin somehow goes through Stripe checkout, the webhook shouldn't modify their subscription. Defense in depth with the database trigger.

### Files Changed

| File | Change |
|------|--------|
| `src/components/Account/AccountPage.tsx` | Hide billing UI for admins, show "Admin Account" badge |
| `supabase/functions/stripe-webhook/index.ts` | Skip admin users in subscription handlers |

### Database Migration Required

Run in Supabase SQL Editor:

```sql
CREATE OR REPLACE FUNCTION handle_admin_enterprise()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_admin = true AND (OLD.is_admin IS NULL OR OLD.is_admin = false) THEN
    NEW.subscription = 'enterprise';
    NEW.payment_method_added = true;
  END IF;
  IF NEW.is_admin = true AND NEW.subscription != 'enterprise' THEN
    NEW.subscription = 'enterprise';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_admin_enterprise ON users;
CREATE TRIGGER on_admin_enterprise
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION handle_admin_enterprise();
```

---

## 2026-01-12: Subscription management improvements

**Commit:** `pending` - Cancel Stripe subscription on user deletion, display next billing date

### Context

Three gaps were identified in subscription management:
1. Admin deleting a user didn't cancel their Stripe subscription (orphaned subscriptions)
2. Users couldn't see when their next billing date would be
3. `PaymentService.cancelSubscription()` was missing required `userId` parameter

### Changes & Reasoning

#### 1. Cancel Stripe subscription when admin deletes user

**File:** `supabase/functions/delete-user/index.ts`

```typescript
// Fetch stripe_subscription_id before deletion
const { data: userToDelete } = await supabaseAdmin
  .from('users')
  .select('id, email, is_admin, stripe_subscription_id, stripe_customer_id')
  .eq('id', userIdToDelete)
  .single();

// Cancel subscription via Stripe API
if (userToDelete.stripe_subscription_id) {
  await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${stripeSecretKey}` }
  });
}
```

**Why DELETE not update:** Using DELETE immediately cancels the subscription. Using `cancel_at_period_end: true` would leave it active until period end, but the user is being deleted now.

**Why graceful error handling:** If subscription is already cancelled or doesn't exist (`resource_missing`), continue with user deletion. Don't fail the whole operation.

**Also added:** Delete `api_keys` for the user (was missing).

#### 2. Display next billing date in Account Settings

**Files:**
- `src/types/index.ts` - Added `currentPeriodEnd` field
- `supabase/functions/stripe-webhook/index.ts` - Store `current_period_end` on subscription events
- `src/App.tsx` - Load `currentPeriodEnd` from profile
- `src/components/Account/AccountPage.tsx` - Display in Subscription Details

```typescript
// In stripe-webhook handleSubscriptionChange()
const currentPeriodEnd = subscription.current_period_end
  ? new Date(subscription.current_period_end * 1000).toISOString()
  : null;

await supabase.from('users').update({
  current_period_end: currentPeriodEnd,
  // ...
});
```

**Why store in database:** Could fetch from Stripe API on-demand, but adds latency. Better to cache it and update via webhooks.

**Why only show for active subscriptions:** Hidden when `cancelAtPeriodEnd` is true because the subscription won't renew.

#### 3. Fix PaymentService.cancelSubscription signature

**File:** `src/services/paymentService.ts`

```typescript
// Before (broken - missing userId)
static async cancelSubscription(subscriptionId: string)

// After (fixed)
static async cancelSubscription(userId: string, subscriptionId?: string)
```

**Why:** The `cancel-subscription` edge function requires `userId` in the request body. The old signature would fail with "Missing userId" error.

### Deletion Order

When admin deletes a user, operations happen in this order:
1. Cancel Stripe subscription (if exists)
2. Delete analyses
3. Delete projects
4. Delete payments
5. Delete API keys
6. Delete from users table
7. Delete from Supabase Auth

**Why this order:** Stripe cancellation first prevents any new charges. Database tables deleted before users table due to foreign key constraints.

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/delete-user/index.ts` | Add Stripe cancellation, delete api_keys |
| `supabase/functions/stripe-webhook/index.ts` | Store `current_period_end` on subscription events |
| `src/types/index.ts` | Add `currentPeriodEnd` field to User |
| `src/App.tsx` | Load `currentPeriodEnd` from profile |
| `src/components/Account/AccountPage.tsx` | Display "Next Billing Date" |
| `src/services/paymentService.ts` | Fix `cancelSubscription` to require `userId` |
| `src/services/paymentService.test.ts` | Update tests for new signature |

### Database Migration Required

Add `current_period_end` column to users table:

```sql
ALTER TABLE users ADD COLUMN current_period_end timestamptz;
```

---

## 2026-01-12: Enable live Stripe payments

**Commit:** `pending` - Enable live payments with production Stripe keys

### Context

The application was running in test mode with Stripe test keys (`pk_test_`, `sk_test_`). This commit switches to production mode to process real payments.

### Prerequisites Completed (Stripe Dashboard)

1. **Live products created** with correct pricing:
   - Starter: $29/month (`price_1RgwZiCjH1LpHt8CBPejppR9`)
   - Professional: $99/month (`price_1RgwYQCjH1LpHt8CPrKsgwLr`)
   - Enterprise: $299/month (`price_1ReVLmCjH1LpHt8C8tqU5e96`)

2. **Webhook endpoint configured**:
   - URL: `https://jgkdzaoajbzmuuajpndv.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.payment_failed`, `payment_intent.succeeded`

### Changes & Reasoning

#### 1. Netlify environment variables updated

| Variable | Change |
|----------|--------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` → `pk_live_...` |
| `VITE_STRIPE_STARTER_PRICE_ID` | Test price → Live price |
| `VITE_STRIPE_PROFESSIONAL_PRICE_ID` | Test price → Live price |
| `VITE_STRIPE_ENTERPRISE_PRICE_ID` | Test price → Live price |

**Why environment variables:** Keeps secrets out of code, allows different values per environment.

#### 2. Supabase secrets updated

```bash
npx supabase secrets set STRIPE_SECRET_KEY=sk_live_...
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

**Why separate webhook secret:** Stripe uses this to sign webhook payloads. Our `stripe-webhook` edge function verifies signatures to prevent spoofed webhooks.

#### 3. Safety flag changed (`isLiveMode = true`)

```typescript
// src/utils/liveMode.ts
export const isLiveMode = true;

// src/utils/stripeUtils.ts
export const isLiveMode = true;
```

**Why hardcoded flag:** Defense in depth. Even if someone accidentally deploys with live keys, this flag must also be `true` for certain live-mode behaviors (UI warnings, disabling test features).

**Why two files:** Historical reasons - both are imported in different places. Could be consolidated but works fine as-is.

#### 4. Edge functions redeployed

All payment-related edge functions redeployed to pick up new secrets:
- `stripe-webhook`
- `create-subscription`
- `create-payment-intent`
- `cancel-subscription`

### Live Mode Detection

The system has multiple layers of live mode detection:

| Layer | Detection Method |
|-------|------------------|
| Frontend | `isLiveMode` flag + `pk_live_` prefix check |
| Edge functions | `sk_live_` prefix on `STRIPE_SECRET_KEY` |
| Database | `live_mode` boolean on `payment_logs` table |

### Rollback Plan

To revert to test mode:
1. Change `isLiveMode` back to `false` in both files
2. Update Netlify env vars to `pk_test_` keys and test price IDs
3. Update Supabase secrets to `sk_test_` key
4. Redeploy edge functions

### Files Changed

| File | Change |
|------|--------|
| `src/utils/liveMode.ts` | `isLiveMode = false` → `isLiveMode = true` |
| `src/utils/stripeUtils.ts` | `isLiveMode = false` → `isLiveMode = true` |

### External Configuration

| Service | Setting |
|---------|---------|
| Netlify | 4 environment variables updated |
| Supabase | 2 secrets set via CLI |
| Stripe | Webhook endpoint + 6 events configured |

---

## 2026-01-10: Expired confirmation link error handling

**Commit:** `99e095c` - Handle expired/reused email confirmation links gracefully

### Context

When a user clicked an email confirmation link a second time (after it was already used), they were silently redirected to the dashboard with no feedback. This was confusing - users expected either a success message or an error explaining the link was invalid.

### Problem

Supabase Auth returns error information in the URL hash when a confirmation link fails:
```
#error=otp_expired&error_description=Email+link+is+invalid+or+has+expired
```

The app only checked for successful confirmations (`access_token` in hash) but ignored error cases.

### Solution

1. **App.tsx:** Added error detection before success detection in hash change handler
2. **AuthPage.tsx:** Added amber warning banner to display the error with dismiss button

### Changes & Reasoning

#### 1. Error detection in App.tsx

```typescript
// Check for email confirmation errors (expired/already used links)
if (fullHash.includes('error=')) {
  const hashParams = new URLSearchParams(fullHash.replace('#', ''));
  const errorCode = hashParams.get('error');
  const errorDesc = hashParams.get('error_description');

  if (errorCode === 'otp_expired' || errorCode === 'access_denied') {
    setConfirmationLinkError('This confirmation link has expired or already been used.');
  } else if (errorDesc) {
    setConfirmationLinkError(decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
  }
  window.location.hash = '#auth';
  return;
}
```

**Why check error BEFORE success:** Order matters. If we checked success first and found no `access_token`, we'd never reach the error handling.

**Why decode error_description:** Supabase URL-encodes spaces as `+`, which looks ugly in UI.

#### 2. Amber warning banner (not red error)

Used amber/yellow styling instead of red because:
- It's not a system error (user did nothing wrong)
- It's informational - link worked once, just can't be reused
- Less alarming than a red error banner

#### 3. Dismiss button

Added `onLinkErrorAcknowledged` callback so users can dismiss the banner without it persisting.

### Error Types Handled

| Error Code | Message Shown |
|------------|---------------|
| `otp_expired` | "This confirmation link has expired or already been used." |
| `access_denied` | "This confirmation link has expired or already been used." |
| Other (with description) | Shows Supabase's error_description |
| Other (no description) | "This link is no longer valid." |

### Files Changed

| File | Change |
|------|--------|
| `src/App.tsx` | Added `confirmationLinkError` state, error detection in hash handler |
| `src/components/Auth/AuthPage.tsx` | Added error banner UI, new props for error handling |

---

## 2026-01-09: Custom domain setup - llmsearchinsight.com

**Commit:** `2c4e20f` - Add custom domain to CORS whitelist

### Context

Setting up custom domain `llmsearchinsight.com` to replace the default Netlify URL (`lucent-elf-359aef.netlify.app`). This requires updating CORS configuration in edge functions to allow requests from the new domain.

### Changes & Reasoning

#### 1. Update CORS whitelist (`supabase/functions/_shared/cors.ts`)

Added new domain origins:
```typescript
const ALLOWED_ORIGINS = [
  // Production
  'https://lucent-elf-359aef.netlify.app',
  'https://llmsearchinsight.com',      // New primary domain
  'https://www.llmsearchinsight.com',  // www redirect
  // Development
  'http://localhost:5173',
  // ...
];
```

**Why both www and non-www:** Even though we redirect www → non-www, some requests might originate from either. Better to whitelist both than have CORS errors.

**Why keep Netlify URL:** Keeps the original URL working during transition and as a fallback.

### Manual Steps Required

After code deployment:

1. **Netlify:** Add custom domain in dashboard
2. **Name.com DNS:**
   - A record: `@` → `75.2.60.5`
   - CNAME: `www` → `llmsearchinsight.com`
3. **Supabase Auth:** Update Site URL and Redirect URLs
4. **Deploy edge functions:** `npx supabase functions deploy --all`

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/_shared/cors.ts` | Added llmsearchinsight.com to whitelist |

---

## 2026-01-09: Pricing page cleanup and tier differentiation

**Commit:** `4a6a3c7` - Clean up pricing page features to be accurate and differentiated

### Context

The pricing page had vague marketing terms ("Advanced reporting & analytics", "Standard optimization recommendations") and referenced features that don't exist (projects, users, team collaboration). Cleaned up to be honest and show clear value progression.

### Changes & Reasoning

#### 1. Removed non-existent features

**Removed:**
- "3 projects maximum" / "Unlimited projects" / "Unlimited projects & users" - Projects feature was abandoned
- "Team collaboration features" - Not implemented
- "Custom integrations" - Not implemented
- "Dedicated account manager" - Not offering this
- "Advanced analytics dashboard" - Vague, not a distinct feature

**Why:** Pricing page should only list features that actually exist.

#### 2. Replaced vague terms with specific features

| Before | After |
|--------|-------|
| Standard optimization recommendations | AEO recommendations |
| Basic competitor insights | 1 competitor per analysis |
| Advanced competitor strategy | 3 competitors per analysis |
| Advanced reporting & analytics | (removed - not distinct) |

**Why:** Specific, measurable features are more honest and help users understand what they're getting.

#### 3. Added competitor limits as differentiator

```
Starter:      1 competitor per analysis
Professional: 3 competitors per analysis
Enterprise:   Unlimited competitors per analysis
```

**Why:** Creates clear upgrade path - agencies tracking multiple competitors need higher tiers.

#### 4. Standardized feature lists

All tiers now show the same core features in the same order:
1. AI analyses per month (volume)
2. Website crawling & schema detection
3. AI citation tracking
4. Competitors per analysis (differentiated)
5. AEO recommendations
6. Analysis history
7. Support level (Email vs Priority email)
8. PDF reports (basic vs Branded)

**Why:** Makes comparison easier, shows what's common vs different.

#### 5. Added "coming soon" features for Enterprise

- Visual trend charts (coming soon)
- Scheduled analyses (coming soon)

**Why:** Justifies higher price point while being transparent about current state.

### Files Changed

| File | Change |
|------|--------|
| `src/utils/planConfig.ts` | Updated all feature arrays |

### Final Tier Structure

| Feature | Starter $29 | Professional $99 | Enterprise $299 |
|---------|-------------|------------------|-----------------|
| Analyses/month | 10 | 50 | 400 |
| Competitors | 1 | 3 | Unlimited |
| Support | Email | Priority email | Priority email |
| Reports | PDF | Branded PDF | Branded PDF |
| API access | No | No | Yes |
| Coming soon | - | - | Trend charts, Scheduled |

---

## 2026-01-09: Add API Access for Enterprise users

**Commit:** `7eefb4e` - REST API for programmatic access to analysis features

### Context

Enterprise users needed programmatic access to run analyses and retrieve history via REST API. This was a listed feature on the pricing page but wasn't implemented.

**Scope:** POST `/api/analyze` (run analysis), GET `/api/analyses` (list history), GET `/api/analyses/:id` (get single)

### Changes & Reasoning

#### 1. API key storage (`supabase/migrations/20260113_create_api_keys.sql`)

**Security decision:** Never store plaintext API keys. Only store SHA-256 hash.

```sql
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  key_hash text NOT NULL,           -- SHA-256 hash only
  key_prefix text NOT NULL,         -- First 8 chars for display (llm_sk_...)
  name text DEFAULT 'Default',
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  revoked_at timestamptz,           -- NULL = active, set = revoked
  CONSTRAINT unique_key_hash UNIQUE (key_hash)
);
```

**Why `revoked_at` instead of delete:** Allows instant revocation while preserving audit history.

#### 2. Shared API auth helper (`supabase/functions/_shared/apiAuth.ts`)

**Problem:** Need to validate API keys in edge functions and verify Enterprise subscription.

**Solution:** Reusable validation function that:
1. Extracts Bearer token from Authorization header
2. Hashes the token (SHA-256 via Web Crypto API)
3. Looks up hash in api_keys table (where revoked_at IS NULL)
4. Joins to users table, verifies subscription = 'enterprise'
5. Updates last_used_at timestamp
6. Returns user info or error

```typescript
export async function validateApiKey(req: Request): Promise<{
  success: boolean;
  user?: { id: string; email: string; subscription: string };
  error?: string;
  status?: number;
}>
```

**Why separate file:** Reusable across any API-authenticated endpoint.

#### 3. API edge function (`supabase/functions/api/index.ts`)

**Architecture:** Single edge function with route handling, not separate functions per endpoint.

**Endpoints:**
- `POST /api/analyze` - Validates body, calls crawl-website + check-citations, saves to DB
- `GET /api/analyses` - Lists analyses with pagination (limit, offset)
- `GET /api/analyses/:id` - Returns single analysis

**Rate limiting:**
- In-memory Map for simplicity (resets on cold start, acceptable for MVP)
- 10 requests/minute per user
- 400 analyses/month (checked against DB)

```typescript
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
```

**Why in-memory:** Redis would be overkill. Edge function cold starts are rare enough that the occasional reset is acceptable.

#### 4. Frontend API key service (`src/services/apiKeyService.ts`)

**Methods:**
- `createApiKey()` - Generates key client-side, sends hash to server
- `listApiKeys()` - Returns keys with prefix only (never full key)
- `revokeApiKey()` - Sets revoked_at timestamp

**Key format:** `llm_sk_{32 random alphanumeric chars}`

```typescript
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(32)))
  .map(b => chars[b % chars.length]).join('');
return `llm_sk_${randomPart}`;
```

**Why client-side generation:** Plaintext key is shown once and never transmitted again. Only hash goes to server.

#### 5. API Keys UI in AccountPage (`src/components/Account/AccountPage.tsx`)

**Design decisions:**
- Only visible for Enterprise users
- List shows prefix + name + last used date
- Create button opens modal with one-time key display
- Copy button for easy clipboard access
- Revoke with confirmation

**Modal flow:**
1. User clicks "Create API Key"
2. Key generated client-side, hash sent to server
3. Modal shows full key once: "Save this key - it won't be shown again"
4. Copy button copies to clipboard
5. Close modal - key display gone forever

#### 6. API documentation page (`src/components/Docs/ApiDocs.tsx`)

**Contents:**
- Authentication section (Bearer token format)
- Rate limits (400/month, 10/minute)
- All three endpoints with request/response examples
- Error codes table (400, 401, 403, 404, 429, 500)
- Copy-to-clipboard for curl examples

**Route:** `#api-docs` (linked from Account page)

### Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/20260113_create_api_keys.sql` | New - API keys table |
| `supabase/functions/_shared/apiAuth.ts` | New - Shared auth helper |
| `supabase/functions/api/index.ts` | New - API edge function |
| `src/services/apiKeyService.ts` | New - Frontend key management |
| `src/components/Docs/ApiDocs.tsx` | New - Documentation page |
| `src/types/index.ts` | Added ApiKey interface |
| `src/types/database.ts` | Added api_keys table type |
| `src/components/Account/AccountPage.tsx` | API Keys section + modal |
| `src/App.tsx` | Added api-docs route |

### Plan Availability

| Plan | API Access |
|------|------------|
| Trial | No |
| Starter | No |
| Professional | No |
| Enterprise | Yes |

---

## 2026-01-09: Add branded reports with company logo upload

**Commit:** `4b66251` - Add company logo upload for branded PDF reports

### Context

Professional and Enterprise users can now upload a company logo that appears on their PDF report exports. This "branded reports" feature was on the roadmap and is a differentiator for paid plans.

### Changes & Reasoning

#### 1. Add `company_logo_url` field to users table (`supabase/migrations/20260111_add_company_logo.sql`)

**Why:** Need to persist the logo URL in the user's profile so it's available whenever they export a PDF.

```sql
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS company_logo_url TEXT;
```

#### 2. Create Supabase Storage bucket (`supabase/migrations/20260112_create_storage_bucket.sql`)

**Problem:** Need somewhere to store uploaded logo files. Can't use "public" as bucket name (reserved).

**Solution:** Created `assets` bucket with RLS policies:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true);

-- Policies restrict uploads to company-logos/ folder
-- Public read access so logos render in PDFs
```

**Why public bucket:** Logos need to be accessible without authentication for PDF generation. The policies restrict uploads to authenticated users only.

#### 3. File upload handler (`src/components/Account/AccountPage.tsx`)

**Problem:** User wanted to browse and upload local files, not paste a URL.

**Solution:** Added file input with validation:
- Accept only images (`image/*`)
- Max 2MB file size
- Upload to `assets/company-logos/{userId}-logo-{timestamp}.{ext}`
- Get public URL after upload

```typescript
const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  // Validate type and size
  const { error } = await supabase.storage
    .from('assets')
    .upload(filePath, file, { upsert: true });
  // Get public URL and save to form
};
```

**Why upsert:** Allows replacing existing logo without delete + upload.

#### 4. Upload UI with preview (`src/components/Account/AccountPage.tsx`)

**Design choices:**
- Drag-and-drop style dashed border (familiar pattern)
- Shows upload spinner during upload
- Preview of uploaded logo with trash button to remove
- Only visible for Professional/Enterprise users

#### 5. Pass logo to PDF generator (`src/utils/pdfGenerator.ts`)

**Changes:**
- Added `logoUrl` parameter to `generatePDFReport()`
- Load image as base64 (required for jsPDF)
- Position in header area (top-right, max 40mm x 15mm)

```typescript
const loadImageAsBase64 = async (url: string): Promise<string | null> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
};
```

**Why base64:** jsPDF `addImage()` requires base64 data, not URLs.

#### 6. Update types and field mappers

- Added `companyLogoUrl?: string` to User interface
- Added `company_logo_url` to database types
- Added mapping in `fieldMappers.ts`

### Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/20260111_add_company_logo.sql` | New - DB column |
| `supabase/migrations/20260112_create_storage_bucket.sql` | New - Storage setup |
| `src/types/index.ts` | Added companyLogoUrl to User |
| `src/types/database.ts` | Added company_logo_url |
| `src/utils/fieldMappers.ts` | Added field mapping |
| `src/utils/pdfGenerator.ts` | Added logo support |
| `src/components/Account/AccountPage.tsx` | File upload UI |
| `src/components/Analysis/AnalysisResults.tsx` | Pass logoUrl prop |
| `src/App.tsx` | Pass user's logo to AnalysisResults |

### Plan Availability

| Plan | Company Logo |
|------|--------------|
| Trial | No |
| Starter | No |
| Professional | Yes |
| Enterprise | Yes |

---

## 2026-01-09: Simplify signup flow - remove fraud prevention

**Commit:** `34df0e4` - Remove fraud prevention, use DB trigger for profile creation

### Context

The signup flow had grown complex with fraud prevention checks (device fingerprinting, IP tracking, disposable email blocking) and edge functions for profile creation. This complexity wasn't justified because:

1. **Trial users only see simulated data** - no real API costs if someone creates multiple trials
2. **Edge functions add latency** - HTTP calls during signup slow it down
3. **Database triggers are more reliable** - atomic with auth user creation

### Changes & Reasoning

#### 1. Create database trigger (`supabase/migrations/20260110_simplify_signup_trigger.sql`)

**Solution:** Auto-create profile when auth user is created:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, subscription, trial_ends_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    'trial',
    NOW() + INTERVAL '14 days'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Why SECURITY DEFINER:** Trigger needs to bypass RLS to insert into users table.

**Why trigger over edge function:**
- Atomic - profile created in same transaction as auth user
- No HTTP latency
- No failure scenarios where auth exists but profile doesn't

#### 2. Simplify authService.ts

**Removed:**
- FraudPrevention import and calls
- Edge function calls (create-user-profile, cleanup-auth-user)
- fraud_checks insert

**Kept:**
- Pre-check for existing email (good UX)
- Email confirmation flow
- resendConfirmationEmail()

#### 3. Clean up AuthPage.tsx

**Removed:**
- FraudPrevention import
- fraudCheckResult state
- handleEmailBlur (was checking email on blur)
- Fraud check result display

#### 4. Delete unused files

| Deleted | Reason |
|---------|--------|
| `src/utils/fraudPrevention.ts` | No longer used |
| `supabase/functions/create-user-profile/` | Replaced by trigger |
| `supabase/functions/cleanup-auth-user/` | Not needed |

### Result

- ~400 fewer lines of code
- Faster signup (no edge function HTTP calls)
- More reliable (trigger is atomic)
- Simpler to maintain

---

## 2026-01-09: Implement email verification for new user signups

**Commit:** `874ae98` - Add email verification with edge function for profile creation

### Context

Users could sign up and immediately log in without verifying their email address. This is a security issue—anyone could sign up with any email, including emails they don't own. Email verification ensures users own the email they're registering with.

Additionally, enabling Supabase's built-in email confirmation revealed a fundamental architecture issue: when email confirmation is enabled, `signUp()` returns a `user` but **NOT** a `session`. This means `auth.uid()` is NULL during signup, and any RLS policies that rely on `auth.uid() = id` will block the profile insert.

### Changes & Reasoning

#### 1. Add Email Redirect URL to signUp (`src/services/authService.ts`)

**Problem:** Supabase needs to know where to redirect users after they click the confirmation link in their email.

**Solution:** Added `emailRedirectTo` option to signUp call:
```typescript
options: {
  emailRedirectTo: `${window.location.origin}/#email-confirmed`
}
```

**Why hash-based URL:** The app uses hash routing (`#dashboard`, `#auth`, etc.). Using `/#email-confirmed` lets `App.tsx` detect the confirmation and show a success message.

#### 2. Create `create-user-profile` Edge Function (`supabase/functions/create-user-profile/index.ts`)

**Problem:** When email confirmation is enabled, there's no session during signup. RLS policies that check `auth.uid() = id` block the profile INSERT because `auth.uid()` is NULL.

**Why this happens:**
1. User clicks "Start Free Trial"
2. `supabase.auth.signUp()` creates auth user, sends confirmation email
3. Supabase returns `user` but NOT `session` (email not confirmed yet)
4. Attempt to INSERT into `users` table fails: RLS policy checks `auth.uid() = id`, but `auth.uid()` is NULL

**Solution:** Created Edge Function that uses service role key to bypass RLS:
```typescript
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Upsert user profile (handles orphaned records)
const { data: profileData, error: profileError } = await supabaseAdmin
  .from('users')
  .upsert({
    id: userId,
    email: email,
    name: name || 'New User',
    subscription: subscription || 'trial',
    trial_ends_at: trialEndsAt,
    // ...
  }, {
    onConflict: 'email',
    ignoreDuplicates: false
  })
```

**Why UPSERT not INSERT:** Orphaned records can exist from previous failed signups (user deleted from auth but profile remains). UPSERT with `onConflict: 'email'` updates existing records instead of throwing duplicate key errors.

**Why Edge Function over RLS policy changes:** Edge functions with service role key provide clean separation. Modifying RLS to allow anonymous inserts would be a security risk.

#### 3. Handle Orphaned Auth User Cleanup (`src/services/authService.ts`)

**Problem:** If profile creation fails after auth user is created, we're left with an orphaned auth user (auth record exists, but no profile).

**Solution:** Added cleanup on profile failure:
```typescript
if (!profileResponse.ok || !profileResult.success) {
  // Profile creation failed - clean up the orphaned auth user
  await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cleanup-auth-user`, {
    method: 'POST',
    body: JSON.stringify({ userId: authData.user.id })
  });
  return { success: false, error: profileResult.error || 'Failed to create user profile' };
}
```

#### 4. Make fraud_checks Insert Non-Fatal (`src/services/authService.ts`)

**Problem:** After successful profile creation, the `fraud_checks` insert could throw an error. This error was being caught by the outer catch block, returning an error even though the auth user and profile were successfully created.

**Solution:** Wrapped fraud_checks in try/catch to make it non-fatal:
```typescript
// Store fraud check result (non-fatal if it fails)
try {
  await supabase.from('fraud_checks').insert({ /* ... */ });
} catch (fraudCheckError) {
  console.warn('Failed to store fraud check result (non-fatal):', fraudCheckError);
}
```

**Why non-fatal:** The fraud check is analytics/logging data. The core signup (auth + profile) succeeded. We shouldn't fail the entire signup because of optional logging.

#### 5. Add "Check Your Email" UI (`src/components/Auth/AuthPage.tsx`)

**Problem:** After signup, users need to know they should check their email for the confirmation link.

**Solution:** Added new UI state when `requiresEmailConfirmation` is true:
- Mail icon
- "Check Your Email" heading
- Email address displayed
- Instructions to click the link
- "Back to Sign In" button
- "Resend Confirmation Email" button

#### 6. Detect Email Confirmation Callback (`src/App.tsx`)

**Problem:** When users click the confirmation link, they're redirected back to the app. We need to detect this and show a success message.

**Solution:** Check for confirmation indicators in hash:
```typescript
if (fullHash.includes('email-confirmed') ||
    (fullHash.includes('access_token') && fullHash.includes('type=signup'))) {
  setEmailJustConfirmed(true);
  window.location.hash = '#auth';
}
```

**Why two checks:** Supabase may redirect with `#access_token=xxx&type=signup` OR we can explicitly redirect to `#email-confirmed` in our emailRedirectTo URL.

#### 7. Show Email Confirmed Banner (`src/components/Auth/AuthPage.tsx`)

**Problem:** Users need visual confirmation that their email was verified.

**Solution:** When `emailJustConfirmed` prop is true, show green success banner:
```typescript
{emailJustConfirmed && (
  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
    <CheckCircle className="w-5 h-5" />
    <span>Email confirmed! You can now sign in.</span>
  </div>
)}
```

#### 8. Add Resend Confirmation Email (`src/services/authService.ts`)

**Problem:** Confirmation emails can get lost or expire. Users need a way to request a new one.

**Solution:** Added `resendConfirmationEmail()` method:
```typescript
static async resendConfirmationEmail(email: string) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email,
    options: {
      emailRedirectTo: `${window.location.origin}/#email-confirmed`
    }
  });
  // ...
}
```

#### 9. Clear Stale localStorage on App Load (`src/App.tsx`)

**Problem:** Mock users from localStorage were appearing in the admin dashboard, mixed with real Supabase users. This caused confusion and data inconsistency.

**Solution:** Clear the `users` localStorage key on app load:
```typescript
useEffect(() => {
  // Clear stale 'users' localStorage key - Supabase is the source of truth
  localStorage.removeItem('users');
  // ...
}, []);
```

**Why this happened:** Early development used localStorage for mock data. When Supabase was added, the mock data wasn't cleaned up, causing both data sources to be mixed.

#### 10. Add Pre-Check for Existing Email (`src/services/authService.ts`)

**Problem:** Users were getting cryptic errors when signing up with an already-registered email.

**Solution:** Check if email exists before attempting signup:
```typescript
try {
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', userData.email)
    .maybeSingle();

  if (existingUser) {
    return {
      success: false,
      error: 'This email is already registered. Please sign in instead.'
    };
  }
} catch (preCheckError) {
  // RLS may block this check - continue with signup
}
```

**Why try/catch:** RLS may block the query if the user isn't authenticated. We handle this gracefully and let the normal signup flow catch duplicates.

### Files Changed

| File | Change Type | Reason |
|------|-------------|--------|
| `src/services/authService.ts` | Modified | Add emailRedirectTo, edge function call, pre-check, resend method |
| `src/components/Auth/AuthPage.tsx` | Modified | Add "Check Email" UI, success banner, resend button |
| `src/App.tsx` | Modified | Detect confirmation callback, clear stale localStorage |
| `supabase/functions/create-user-profile/index.ts` | New | Bypass RLS for profile creation |
| `supabase/functions/cleanup-auth-user/index.ts` | New | Clean up orphaned auth users |
| `src/services/authService.test.ts` | Modified | Add mocks for edge function, 4 new email verification tests |
| `src/components/Auth/AuthPage.test.tsx` | Modified | Add 4 new email confirmation UI tests |
| `CLAUDE.md` | Modified | Document new edge function and email verification flow |
| `BRANCH_ANALYSIS.md` | Modified | Add detailed explainer entry |

### User Flow After Implementation

```
1. User enters email/password → clicks "Start Free Trial"
2. Auth user created → Profile created via Edge Function
3. "Check Your Email" screen shown (cannot log in yet)
4. User checks email → clicks confirmation link
5. Redirected to app → "Email confirmed!" banner shown
6. User signs in with password → Dashboard loads
```

### Testing Performed

```
npm run test:run && npm run build
```

**Automated Tests Added (8 new tests):**

*authService.test.ts:*
- `should return requiresEmailConfirmation when no session is returned`
- `should call edge function for profile creation`
- `should successfully resend confirmation email`
- `should handle resend error`

*AuthPage.test.tsx:*
- `should show email confirmed banner when emailJustConfirmed prop is true`
- `should not show email confirmed banner when emailJustConfirmed is false`
- `should show Check Your Email screen after signup requiring confirmation`
- `should have Back to Sign In button on email confirmation screen`

**Manual Testing:**
- **Signup with new email:** Shows "Check Your Email" screen ✓
- **Confirmation email received:** Link works, redirects to app ✓
- **Email confirmed banner:** Shows after clicking confirmation link ✓
- **Sign in after confirmation:** Works correctly ✓
- **Sign in before confirmation:** Shows "Email not confirmed" error ✓
- **Resend confirmation:** Sends new email ✓

**Results:**
- **Test Suite:** ✅ 375 passed, 0 failed
- **Build:** ✓ Passed

### Lessons Learned

1. **Email confirmation changes the auth flow fundamentally** - No session means no `auth.uid()`, which breaks RLS policies that assume a logged-in user.

2. **Use Edge Functions for operations that need service role** - Profile creation during signup is a perfect use case. The Edge Function cleanly bypasses RLS without weakening security.

3. **UPSERT handles orphaned records gracefully** - Instead of complex cleanup logic, UPSERT with `onConflict` handles duplicate key scenarios automatically.

4. **Make secondary operations non-fatal** - Core functionality (auth + profile) shouldn't fail because of optional logging (fraud_checks).

5. **Clear stale localStorage aggressively** - When migrating from localStorage to database, proactively clear old data to avoid data source conflicts.

### Supabase Dashboard Configuration (Manual)

For email verification to work, these settings must be configured in Supabase Dashboard:

1. **Authentication → Email Templates:** Enable "Confirm email" toggle
2. **Authentication → URL Configuration:** Add redirect URLs:
   - `https://your-domain.netlify.app/#email-confirmed`
   - `http://localhost:5173/#email-confirmed` (for development)

---

## 2026-01-09: Simplify signup flow - Remove fraud prevention, use database trigger

**Commit:** `34df0e4` - Simplify signup: replace edge functions with DB trigger, remove fraud prevention

### Context

After implementing email verification with edge functions (`create-user-profile`, `cleanup-auth-user`), a review of the architecture raised questions:

1. **Is bypassing RLS via edge functions necessary?**
2. **What value does fraud prevention add?**

The answer: **Neither is necessary.** Trial users only see simulated data (no real API costs), so fraud prevention adds complexity without real value. And database triggers provide a simpler, more reliable way to auto-create profiles than edge functions.

### Changes & Reasoning

#### 1. Replace Edge Functions with Database Trigger

**Problem:** Edge functions add latency, require deployment, and are another moving part that can fail.

**Solution:** Created database trigger that fires on `auth.users` INSERT:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, subscription, trial_ends_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    'trial',
    NOW() + INTERVAL '14 days'
  )
  ON CONFLICT (email) DO UPDATE SET
    id = EXCLUDED.id,
    name = EXCLUDED.name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Why SECURITY DEFINER:** The trigger runs with the function owner's privileges, bypassing RLS cleanly without needing external API calls.

**Why this is better:**
- Atomic with auth user creation (no HTTP calls)
- No edge function deployment needed
- Faster (no network latency)
- More reliable (database transactions)

#### 2. Remove Fraud Prevention

**Problem:** Fraud prevention (~200 lines) added complexity for trial abuse prevention. But trial users only see simulated data—no real API costs incurred.

**Removed:**
- `src/utils/fraudPrevention.ts` (229 lines)
- Email normalization, device fingerprinting, IP tracking
- Risk scoring, disposable email blocking
- `fraud_checks` database table references

**Why removed:** The "cost" of trial abuse is zero. Real API calls (OpenAI, Anthropic, Perplexity) only happen for paid users. Simulated data is generated locally.

#### 3. Simplify AuthService.signUp()

**Before:** ~150 lines with fraud checks, edge function calls, cleanup logic
**After:** ~70 lines—just auth signup, profile created automatically by trigger

```typescript
// Simplified signUp - profile auto-created by database trigger
static async signUp(userData: {
  email: string;
  password: string;
  name: string;
  company?: string;
  website?: string;
}) {
  // Pre-check for existing email...
  // Call supabase.auth.signUp()
  // Return result (trigger handles profile)
}
```

#### 4. Clean Up AuthPage.tsx and TrialSignup.tsx

**Removed:**
- FraudPrevention import
- `fraudCheck` state and `handleEmailBlur`
- Fraud check result display (approved/denied messages)
- Risk score display

**Kept:**
- Email verification flow (Check Your Email screen)
- All form validation
- Email confirmation banner

### Files Changed

| File | Change Type | Reason |
|------|-------------|--------|
| `supabase/migrations/20260110_simplify_signup_trigger.sql` | New | Database trigger for auto profile creation |
| `src/services/authService.ts` | Modified | Remove fraud prevention, edge function calls |
| `src/components/Auth/AuthPage.tsx` | Modified | Remove fraud check UI |
| `src/components/Auth/TrialSignup.tsx` | Modified | Remove fraud prevention logic |
| `src/services/authService.test.ts` | Modified | Update tests for simplified flow |
| `src/components/Auth/AuthPage.test.tsx` | Modified | Remove FraudPrevention mock |
| `src/types/index.ts` | Modified | Remove FraudPreventionCheck interface |
| `src/types/database.ts` | Modified | Remove FraudChecks type, fraud_checks table |
| `src/utils/fieldMappers.ts` | Modified | Remove fraudCheck mapping |
| `src/utils/fraudPrevention.ts` | Deleted | No longer needed |
| `supabase/functions/create-user-profile/` | Deleted | Replaced by trigger |
| `supabase/functions/cleanup-auth-user/` | Deleted | Not needed with trigger |

### Results

- **~400 lines of code removed**
- **Faster signup** (no HTTP calls to edge functions)
- **More reliable** (atomic database transaction)
- **Simpler to maintain** (fewer moving parts)

**Tests:** ✅ 374 passed, 0 failed
**Build:** ✓ Passed

### Key Insight

**Don't add fraud prevention for things that have no real cost.** Trial abuse prevention made sense if trials used real API credits. Since trials only see simulated data, the complexity wasn't justified. Always ask: "What's the actual cost of the thing I'm preventing?"

---

## 2026-01-07: Add historical score tracking for trend comparison

**Commit:** `2d197fa` - Add historical score tracking to show improvement trends

### Context

User feedback: "How do I know if I am improving if my business is not showing in the results but perhaps the ranking is increasing?" The analysis results show scores for Clarity, Depth, Trust, Quotable, and Match, but users couldn't see if these scores were improving over time. Even with a 0% citation rate, users wanted to know if their optimization efforts were moving scores in the right direction.

### Changes & Reasoning

#### 1. Add Historical Analysis Methods (`src/services/analysisService.ts`)

**Problem:** No way to retrieve previous analyses for the same website to compare scores.

**Solution:** Added two new methods:

| Method | Purpose |
|--------|---------|
| `getPreviousAnalysisForWebsite(userId, website, currentAnalysisId?)` | Gets the most recent previous analysis for trend comparison |
| `getWebsiteAnalysisHistory(userId, website, limit)` | Gets all analyses for a website (for future charts/graphs) |

**Why separate from `getExistingAnalysis`?** The existing method only returns one result and is used for duplicate detection. The new methods:
- `getPreviousAnalysisForWebsite` explicitly excludes the current analysis
- Returns the second-most-recent analysis for accurate comparison
- Handles edge cases (first analysis = no previous)

**Implementation detail:**
```typescript
// If we have currentAnalysisId, exclude it and return first result
// Otherwise, skip first (current) and return second (previous)
if (currentAnalysisId) {
  query = query.neq('id', currentAnalysisId);
}
```

#### 2. Update MetricsBreakdown Component (`src/components/Analysis/MetricsBreakdown.tsx`)

**Problem:** Scores displayed as static numbers with no historical context.

**Solution:** Added trend indicators next to each score:

| Trend | Display | Meaning |
|-------|---------|---------|
| Improvement | ↑ +5 (green) | Score increased from previous |
| Decline | ↓ -3 (red) | Score decreased from previous |
| No change | – (gray) | Score unchanged |
| First analysis | (nothing) | No previous analysis to compare |

**UI changes:**
- Added `previousAnalysis` prop to component interface
- Created `getTrend()` helper to calculate change direction and amount
- Created `renderTrend()` helper to display trend icons with tooltips
- Updated header text to mention trends when previous analysis exists
- Trends shown for: Overall score, Clarity, Depth, Trust, Quotable, Match

**Why only show trends for user's site?** Competitor data is extracted from citation results (different each analysis), so trends wouldn't be meaningful.

#### 3. Fetch Previous Analysis in AnalysisResults (`src/components/Analysis/AnalysisResults.tsx`)

**Problem:** MetricsBreakdown didn't have access to previous analysis data.

**Solution:** Added `useEffect` to fetch previous analysis on component mount:

```typescript
useEffect(() => {
  const fetchPreviousAnalysis = async () => {
    if (analysis.userId && analysis.website) {
      const previous = await AnalysisService.getPreviousAnalysisForWebsite(
        analysis.userId,
        analysis.website,
        analysis.id
      );
      setPreviousAnalysis(previous);
    }
  };
  fetchPreviousAnalysis();
}, [analysis.id, analysis.userId, analysis.website]);
```

**Why useEffect?** The previous analysis fetch is async and shouldn't block initial render. The component shows scores immediately, then adds trend indicators once previous analysis loads.

#### 4. Update Test Mocks (`src/test/navigation.test.tsx`)

**Problem:** Tests failed because mock didn't include new `AnalysisService` methods.

**Solution:** Added mocks for new methods:
```typescript
getPreviousAnalysisForWebsite: vi.fn().mockResolvedValue(null),
getWebsiteAnalysisHistory: vi.fn().mockResolvedValue([]),
deleteAnalysis: vi.fn().mockResolvedValue({ success: true }),
```

### Files Changed

| File | Change Type | Reason |
|------|-------------|--------|
| `src/services/analysisService.ts` | Modified | Add getPreviousAnalysisForWebsite, getWebsiteAnalysisHistory |
| `src/components/Analysis/MetricsBreakdown.tsx` | Modified | Add trend indicators, previousAnalysis prop |
| `src/components/Analysis/AnalysisResults.tsx` | Modified | Fetch and pass previous analysis |
| `src/test/navigation.test.tsx` | Modified | Add mocks for new service methods |
| `ARCHITECTURE.md` | Modified | Document new service capabilities |

### User Flow

```
1. User runs first analysis → Scores shown, no trends (first analysis)
2. User implements recommendations → Makes website changes
3. User runs second analysis → Scores shown WITH trends (↑/↓/–)
4. User sees: "Clarity: 45 ↑+12" → Knows improvements are working
5. Even with 0% citation rate, user can track progress
```

### Testing Performed

```
npm run test:run && npm run build
```

- **Test Suite:** ✅ 367 passed, 0 failed
- **Build:** ✓ Passed

### Future Enhancements

- Add score history chart/graph visualization
- Show trends in Analysis History list view
- Email notifications when scores improve significantly

---

## 2026-01-07: Implement input sanitization for XSS and SQL injection prevention

**Commit:** `a11167b` - Add comprehensive input sanitization utilities and tests

### Context

Security audit revealed that form inputs were not being sanitized, leaving the application vulnerable to XSS (Cross-Site Scripting) and SQL injection attacks. The SECURITY_SCALABILITY_CHECKLIST.md showed only 68% security coverage, with input sanitization marked as ❌.

### Changes & Reasoning

#### 1. Create Sanitization Utility (`src/utils/sanitize.ts`)

**Problem:** No centralized input sanitization. Form data (names, emails, URLs, passwords) passed directly to services.

**Solution:** Created 13 sanitization functions covering all input types:

| Function | Purpose |
|----------|---------|
| `escapeHtml()` | Escape HTML entities (`<`, `>`, `&`, `"`, `'`, etc.) |
| `stripHtmlTags()` | Remove all HTML tags and event handlers |
| `sanitizeText()` | For names/descriptions - strips HTML, normalizes unicode, removes null bytes |
| `sanitizeUrl()` | Validate URLs, block dangerous protocols (javascript:, vbscript:, data:, file:, about:) |
| `sanitizeEmail()` | Validate email format, lowercase, strip HTML |
| `sanitizeSearchQuery()` | Detect and remove SQL injection patterns |
| `sanitizePassword()` | Minimal sanitization - remove control chars, preserve special chars |
| `sanitizeArray()` | Sanitize string arrays |
| `sanitizeFormData()` | Field-specific sanitization with config |
| `isSafeInput()` | Check if input contains injection attempts |

**Key security features:**
- **XSS Prevention:** Escapes HTML entities, removes script tags, blocks event handlers
- **SQL Injection:** Detects SELECT, INSERT, UPDATE, DELETE, DROP, UNION, ALTER, CREATE, TRUNCATE
- **Protocol Blocking:** Blocks `javascript:`, `vbscript:`, `data:`, `file:`, `about:`
- **Unicode Normalization:** Prevents homograph attacks (ｓｃｒｉｐｔ → script)
- **Null Byte Removal:** Prevents filter bypass via `\x00`

**Why not use a library?** We considered DOMPurify but:
1. We need sanitization at form submit, not DOM render time
2. Our patterns are simpler (no rich text editing)
3. Custom functions allow field-specific handling (URL vs email vs text)

#### 2. Comprehensive Test Suite (`src/utils/sanitize.test.ts`)

**Problem:** Security code without tests is dangerous - regressions could reintroduce vulnerabilities.

**Solution:** Created 115 tests covering:
- All 13 functions with edge cases
- 11 XSS attack vectors
- 9 SQL injection patterns
- Unicode bypass attempts
- Null byte injection
- 8 dangerous protocol handlers

**Key test pattern:**
```typescript
it('blocks XSS vector', () => {
  const sanitized = sanitizeText('<script>alert("XSS")</script>');
  expect(sanitized).not.toContain('<script');
  expect(isSafeInput('<script>alert("XSS")</script>')).toBe(false);
});
```

**Bug found during testing:** Global regex flags (`/gi`) caused `lastIndex` state issues. Fixed by resetting `lastIndex = 0` before each test in `isSafeInput()`.

#### 3. Apply Sanitization to Form Components

| Component | Fields Sanitized |
|-----------|------------------|
| `AuthPage.tsx` | email, password, name, company, website |
| `NewAnalysis.tsx` | website URL, prompts (search queries), brand name |
| `UserDashboard.tsx` | search filter, edit form (name, email), password reset |

**Pattern used:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Sanitize all inputs before processing
  const sanitizedEmail = sanitizeEmail(formData.email);
  const sanitizedPassword = sanitizePassword(formData.password);

  if (!sanitizedEmail) {
    setError('Please enter a valid email address');
    return;
  }

  // Use sanitized values for API calls
  await AuthService.signIn(sanitizedEmail, sanitizedPassword);
};
```

#### 4. Update Security Checklist

Updated `SECURITY_SCALABILITY_CHECKLIST.md`:
- Security score: 68% → 76%
- Marked as ✅: URL input validation, XSS prevention, SQL injection prevention
- Documented implementation details and test counts

### Files Changed

| File | Change Type | Reason |
|------|-------------|--------|
| `src/utils/sanitize.ts` | Created | 13 sanitization functions |
| `src/utils/sanitize.test.ts` | Created | 115 security tests |
| `src/components/Auth/AuthPage.tsx` | Modified | Sanitize login/signup form |
| `src/components/Analysis/NewAnalysis.tsx` | Modified | Sanitize analysis form |
| `src/components/Admin/UserDashboard.tsx` | Modified | Sanitize admin forms |
| `SECURITY_SCALABILITY_CHECKLIST.md` | Modified | Update score and status |
| `TESTING.md` | Modified | Document new tests, update count to 367 |
| `ARCHITECTURE.md` | Modified | Add sanitize.ts to key files |
| `DOCUMENTATION_INDEX.md` | Modified | Update test count |

### Testing Performed

```
npm run test:run && npm run build
```

- **Test Suite:** ✅ 367 passed, 0 failed (367 total)
- **Build:** ✓ Passed
- Manual verification: Tested XSS payloads in forms, confirmed sanitization works

### Security Improvements

| Metric | Before | After |
|--------|--------|-------|
| Security Score | 68% (17/25) | 76% (19/25) |
| XSS Prevention | ❌ | ✅ |
| SQL Injection Prevention | ❌ | ✅ |
| URL Validation | ⚠️ Basic | ✅ Comprehensive |
| Sanitization Tests | 0 | 115 |

### Remaining Security Items

- CSRF protection (❌)
- MFA for admin accounts (❌)
- Session timeout (❌)
- Security event alerting (❌)

---

## 2026-01-07: Fix competitor data mismatch and add comparison tests

**Commit:** `1416c9d` - Fix competitor data mismatch between Performance Snapshot and Competitor Strategy

### Context

User reported that the **Performance Snapshot** (in analysis results) showed different competitors than the **Competitor Strategy** page. Performance Snapshot showed hubspot.com, mailchimp.com, etc., while Competitor Strategy showed xsoneconsultants.com, toimi.pro, etc. Both should display the same data from `analysis.citationResults`.

### Changes & Reasoning

#### 1. Fix AnalysisResults.tsx to Use Real Citation Data

**Problem:** `AnalysisResults.tsx` line 155 was:
```javascript
const competitorAnalyses = mockAnalyses.filter(a => a.id !== analysis.id);
```
This pulled from hardcoded `mockAnalyses` (hubspot, mailchimp, etc.) instead of the actual citation results.

**Solution:** Created `extractCompetitorsAsAnalyses()` function that:
- Extracts competitors from `analysis.citationResults`
- Counts citation frequency per competitor
- Generates `Analysis[]` format for `MetricsBreakdown` component
- Sorts by citation count (most cited first)
- Limits to top 10 competitors

**Why this matters:** Both Performance Snapshot and Competitor Strategy now use the same data source (`analysis.citationResults`), ensuring consistent competitor display.

#### 2. Remove Unused mockAnalyses Import

**Problem:** After the fix, `mockAnalyses` import was no longer needed.

**Solution:** Removed `import { mockAnalyses } from '../../utils/mockData';` and the unused `onViewInsights` prop.

#### 3. Add Comprehensive Competitor Comparison Tests

**Problem:** No tests existed to verify that Performance Snapshot and Competitor Strategy show consistent data.

**Solution:** Created `competitorComparison.test.ts` with 24 tests covering:
- `extractCompetitorsAsAnalyses` (7 tests) - Performance Snapshot data extraction
- `extractCompetitorData` (7 tests) - Competitor Strategy data extraction
- Data Consistency (6 tests) - Both functions return same domains, same order, same counts
- Edge Cases (4 tests) - Empty contexts, no competitors, mixed results

**Key test:**
```typescript
it('should extract the same competitor domains from both functions', () => {
  const performanceSnapshot = extractCompetitorsAsAnalyses(mockAnalysis);
  const competitorStrategy = extractCompetitorData(mockAnalysis);

  const snapshotDomains = performanceSnapshot.map(a => a.website).sort();
  const strategyDomains = competitorStrategy.competitors.map(c => c.domain).sort();

  expect(snapshotDomains).toEqual(strategyDomains);
});
```

**Why this matters:** Tests ensure future changes can't break data consistency between these views.

### Files Changed

| File | Change Type | Reason |
|------|-------------|--------|
| `src/components/Analysis/AnalysisResults.tsx` | Modified | Use citationResults instead of mockAnalyses |
| `src/components/Analysis/competitorComparison.test.ts` | Created | 24 tests for data consistency |
| `TESTING.md` | Modified | Document new test file, update count to 252 |
| `DOCUMENTATION_INDEX.md` | Modified | Update test count |
| `ARCHITECTURE.md` | Modified | Update test count |

### Testing Performed

```
npm run test:run && npm run build
```

- **Test Suite:** ✅ 252 passed, 0 failed (252 total)
- **Build:** ✓ Passed
- Manual verification: Both Performance Snapshot and Competitor Strategy now show same competitors

### Lessons Learned

1. **Mock data vs real data should never mix** - Using `mockAnalyses` alongside `analysis.citationResults` caused UI inconsistency.
2. **Test data consistency between views** - When two UI components show the same data, add tests to verify they stay in sync.
3. **Extract and test the extraction logic** - Moving competitor extraction to testable functions caught the bug immediately.

---

## 2026-01-07: Code maintainability improvements and test suite fixes

**Commit:** `5847a27` - Update documentation for code maintainability improvements

### Context

The codebase had several maintainability issues: `analysisEngine.ts` was 1,273 lines, payment logic was scattered across 4 files, localStorage access was inconsistent, and `database.ts` had 13 untyped `any` parameters. Additionally, the test suite had 40 failing tests due to missing mocks, preventing reliable CI/CD.

### Changes & Reasoning

#### 1. Split analysisEngine.ts into Modules (1,273 → 357 lines)

**Problem:** `analysisEngine.ts` was a monolithic 1,273-line file containing model configs, helper functions, AEO analysis logic, and recommendation generation - violating single responsibility principle.

**Solution:** Extracted into focused modules:
- `src/utils/analysis/modelConfig.ts` - AI model configurations (GPT-4, Claude, etc.)
- `src/utils/analysis/analysisHelpers.ts` - Score calculations, category mapping, simulated data generation
- `src/utils/analysis/aeoAnalysis.ts` - Real and simulated AEO analysis orchestration
- `src/utils/analysis/recommendations.ts` - Recommendation generation from crawl data
- `src/utils/analysis/index.ts` - Clean re-exports

**Why this matters:** Smaller, focused files are easier to test, review, and maintain. Each module now has a single responsibility.

#### 2. Consolidate Payment Utilities (4 → 3 files)

**Problem:** Payment logic was scattered across `paymentUtils.ts`, `paymentService.ts`, `stripeUtils.ts`, and `paymentLogger.ts` with duplicate functions.

**Solution:**
- Moved `fixSubscription()`, `checkSubscriptionStatus()`, `getLatestPayment()` from `paymentUtils.ts` into `PaymentService` class
- Removed duplicate `createPaymentIntent` from `stripeUtils.ts`
- Deleted `paymentUtils.ts` entirely
- Updated `SubscriptionFixTool.tsx` and `CreditCardForm.tsx` to use `PaymentService`

**Why this matters:** Single source of truth for payment operations. Easier to maintain and test.

#### 3. Create StorageManager Abstraction

**Problem:** Direct `localStorage.getItem()`/`setItem()` calls were scattered throughout the codebase with inconsistent error handling and key names.

**Solution:** Created `src/utils/storageManager.ts` with:
- Centralized storage keys as constants
- Type-safe getters/setters for User, Analysis, and collections
- Consistent JSON parse/stringify with error handling
- Helper methods: `clearSession()`, `clearAll()`, `getStorageSize()`

**Why this matters:** Single point of control for all localStorage operations. Easy to migrate to different storage (IndexedDB, etc.) later.

#### 4. Fix 13 'any' Types in database.ts

**Problem:** `database.ts` had 13 parameters typed as `any`, losing TypeScript's safety benefits.

**Solution:** Added proper types from `src/types/database.ts`:
- `DbUser`, `DbAnalysis`, `DbPayment` for database row types
- `DbUserInsert`, `DbAnalysisInsert` for insert operations
- Explicit return types on all functions

**Why this matters:** Type safety catches bugs at compile time instead of runtime.

#### 5. Add Comprehensive Test Coverage

**Problem:** No tests existed for payment service, analysis helpers, or storage manager.

**Solution:** Created three new test files:
- `paymentService.test.ts` - 19 tests for payment operations
- `analysisHelpers.test.ts` - 39 tests for score calculations, category mapping
- `storageManager.test.ts` - 20 tests for localStorage abstraction

**Why this matters:** Tests document expected behavior and prevent regressions.

#### 6. Fix All Failing Tests (40 → 0 failures)

**Problem:** Test suite had 40 failing tests across 4 files due to missing mocks:
- `UserDashboard.test.tsx` - 26 failures (no Supabase mock)
- `navigation.test.tsx` - 6 failures (AuthService not mocked)
- `AuthPage.test.tsx` - 2 failures (AuthService not mocked)
- `analysisEngine.test.ts` - 6 failures (referenced moved functions)

**Solution:**

**UserDashboard.test.tsx:**
- Added Supabase mock using `vi.hoisted()` for mutable test data
- Mock returns `mockSupabaseData.users` which can be modified per-test
- Reset mock data in `beforeEach` to prevent test pollution

**navigation.test.tsx:**
- Added `AuthService.getCurrentSession` mock that reads from localStorage
- Returns proper session/profile structure when user exists in localStorage
- Fixed test assertion looking for wrong text ("Check Your AI Citations" → "Analyze Your AI Visibility")

**AuthPage.test.tsx:**
- Added `AuthService` mock with `signIn` and `signUp` methods
- Added 100ms delay to allow loading state ("Signing In...") to be visible
- Mock returns different responses based on email input

**analysisEngine.test.ts:**
- Updated imports to use `performSimulatedAEOAnalysis` from new module location
- Fixed 6 tests that were calling moved functions

#### 7. Update CLAUDE.md with Test Requirements

**Problem:** No documented requirement to run tests before commits.

**Solution:** Added to CLAUDE.md:
- "Before Every Commit" section requiring `npm run test:run && npm run build`
- **All tests must pass (0 failures) before merge**
- Template for documenting test results in BRANCH_ANALYSIS.md
- "Pre-Commit Checklist (Ready to Merge)" section

**Why this matters:** Prevents broken code from being merged. Creates audit trail of test health.

### Files Changed

| File | Change Type | Reason |
|------|-------------|--------|
| `src/utils/analysis/modelConfig.ts` | Created | Extract model configs from analysisEngine |
| `src/utils/analysis/analysisHelpers.ts` | Created | Extract helper functions |
| `src/utils/analysis/aeoAnalysis.ts` | Created | Extract AEO analysis logic |
| `src/utils/analysis/recommendations.ts` | Created | Extract recommendation generation |
| `src/utils/analysis/index.ts` | Created | Module exports |
| `src/utils/analysisEngine.ts` | Modified | Reduced from 1,273 to 357 lines |
| `src/utils/storageManager.ts` | Created | localStorage abstraction |
| `src/services/paymentService.ts` | Modified | Added fix/check subscription methods |
| `src/utils/stripeUtils.ts` | Modified | Removed duplicate functions |
| `src/utils/paymentUtils.ts` | Deleted | Consolidated into paymentService |
| `src/types/database.ts` | Modified | Fixed 13 'any' types |
| `src/components/Debug/SubscriptionFixTool.tsx` | Modified | Use PaymentService |
| `src/components/Payment/CreditCardForm.tsx` | Modified | Use PaymentService |
| `src/services/paymentService.test.ts` | Created | 19 tests for payment service |
| `src/utils/analysis/analysisHelpers.test.ts` | Created | 39 tests for helpers |
| `src/utils/storageManager.test.ts` | Created | 20 tests for storage |
| `src/utils/analysisEngine.test.ts` | Modified | Fix imports for moved functions |
| `src/components/Admin/UserDashboard.test.tsx` | Modified | Add Supabase mock |
| `src/test/navigation.test.tsx` | Modified | Add AuthService mock |
| `src/components/Auth/AuthPage.test.tsx` | Modified | Add AuthService mock |
| `CLAUDE.md` | Modified | Add test requirements |

### Testing Performed

- **Test Suite:** ✅ 228 passed, 0 failed (228 total)
- **Build:** ✓ Passed
- Verified all new test files run correctly
- Confirmed mocks properly isolate tests from external dependencies
- Verified analysisEngine still works after modularization

### Lessons Learned

1. **Use `vi.hoisted()` for mutable mock data** - Allows changing mock return values per-test without complex mock reset logic.
2. **Mock at the service layer, not Supabase** - Mocking `AuthService.getCurrentSession()` is cleaner than mocking raw Supabase calls.
3. **Loading states need delays in tests** - Async mocks resolve instantly; add small delays (100ms) to test loading UI.
4. **Modularization enables testing** - Extracting `analysisHelpers.ts` made it trivial to add 39 focused unit tests.
5. **Document test requirements** - Explicit "0 failures required" rule prevents accumulating broken tests.

---

## 2026-01-06: Remove Projects feature and add Citation Results UI

**Commit:** `972e9bb` - Remove Projects feature and add Citation Results UI

### Context

The app had two issues: (1) an abandoned Projects feature that was broken and redundant with Analysis History, and (2) citation data from the backend wasn't being displayed properly in the UI - the Citation Results page showed real competitors but the Competitor Strategy page showed mock data.

### Changes & Reasoning

#### 1. Remove Projects Feature

**Problem:** Projects feature was abandoned - edit buttons didn't work, used mock data, and was redundant with Analysis History.

**Solution:** Deleted `ProjectDetail.tsx`, `ProjectCard.tsx`, `projectService.ts`. Removed from `App.tsx`, `Dashboard.tsx`, `Sidebar.tsx`.

**Why this matters:** Dead code confuses users and developers. Better to remove entirely than maintain broken features.

#### 2. Create CitationResultsDetail Component

**Problem:** The backend returns detailed `citationResults` (per-prompt, per-provider AI responses), but the UI only showed aggregate numbers.

**Solution:** Created `CitationResultsDetail.tsx` with:
- Summary header with overall citation rate
- Provider breakdown (ChatGPT/Claude/Perplexity percentages)
- Expandable accordion for each prompt
- Citation context when cited
- Competitor list when not cited

**Why this matters:** Users need to see exactly what AI said about their site to understand why they're cited or not.

#### 3. Fix CompetitorStrategy to Use Real Data

**Problem:** `CompetitorStrategy.tsx` received `mockAnalyses` from `App.tsx` and displayed fake competitors (hubspot, mailchimp) even when real citation data existed.

**Solution:**
- Changed `hasCompetitorAnalyses` logic to only use passed data when NO real `citationResults` exist
- Extract competitors from `analysis.citationResults.competitorsCited`
- Removed mock data passing from `App.tsx`

**Critical fix:** The component now checks `analysis.citationResults` first before falling back.

#### 4. Add Demo Mode Indicator

**Problem:** Users couldn't distinguish between real and simulated data, leading to confusion.

**Solution:** Added purple "Demo Mode" banner in CompetitorStrategy when `analysis.isSimulated === true`.

**Why this matters:** Trial users get simulated data (intentional for cost control). They need to know this isn't real data.

#### 5. Preserve citationResults in Type Conversion

**Problem:** `AnalysisProgress.tsx` converts `AEOAnalysis` to `Analysis` for compatibility, but wasn't preserving `citationResults` and `overallCitationRate`.

**Solution:** Added these fields to the conversion in `AnalysisProgress.tsx` and to the `Analysis` type in `types/index.ts`.

#### 6. Rename Button Text

**Problem:** "Check My Citations" was too narrow - the analysis does more (crawling, competitor analysis, recommendations).

**Solution:** Changed to "Run AI Visibility Analysis" and header to "Analyze Your AI Visibility".

#### 7. Add Analysis Engine Tests

**Problem:** No automated tests for real vs simulated analysis flows.

**Solution:** Created `analysisEngine.test.ts` with 16 tests covering:
- `shouldUseRealAnalysis` for different subscription types
- Simulated AEO analysis structure
- CitationResult data consistency
- Competitor extraction logic

**Test data:** Uses www.convologix.com with chatbot-related prompts.

### Files Changed

| File | Change Type | Reason |
|------|-------------|--------|
| `src/components/Projects/ProjectDetail.tsx` | Deleted | Abandoned feature |
| `src/components/Dashboard/ProjectCard.tsx` | Deleted | Abandoned feature |
| `src/services/projectService.ts` | Deleted | Abandoned feature |
| `src/App.tsx` | Modified | Remove Projects, fix competitor-strategy route |
| `src/components/Dashboard/Dashboard.tsx` | Modified | Remove Projects section |
| `src/components/Layout/Sidebar.tsx` | Modified | Remove Projects nav item |
| `src/components/Analysis/CitationResultsDetail.tsx` | Created | New citation detail UI |
| `src/components/Analysis/AnalysisResults.tsx` | Modified | Integrate CitationResultsDetail |
| `src/components/Analysis/AnalysisProgress.tsx` | Modified | Preserve citationResults |
| `src/components/Analysis/NewAnalysis.tsx` | Modified | Rename button/header text |
| `src/components/Reports/CompetitorStrategy.tsx` | Modified | Use real data, add Demo banner |
| `src/types/index.ts` | Modified | Add citationResults to Analysis |
| `src/utils/analysisEngine.test.ts` | Created | 16 tests for real vs simulated |

### Testing Performed

- Run simulated analysis → CitationResults shows simulated competitors ✓
- Run real analysis (as admin) → CitationResults shows real competitors ✓
- CompetitorStrategy matches CitationResults data ✓
- Demo Mode banner shows for trial users ✓
- All 16 new tests pass ✓
- Build verification ✓

### Lessons Learned

1. **Mock data should be clearly labeled** - Users assumed mock data was real, leading to confusion.
2. **Data should flow from one source** - Having `mockAnalyses` passed separately from `analysis.citationResults` caused data mismatch.
3. **Dead features should be removed** - Broken Projects feature was confusing users. Better to delete than maintain.
4. **Test real vs simulated paths** - Different subscription tiers get different data flows; both need testing.

---

## 2026-01-06: Fix authentication and subscription persistence

**Commit:** `21b7a11` - Fix authentication and subscription persistence

### Context

Users reported that after subscribing to a paid plan (e.g., enterprise), logging out and back in would reset their subscription to "trial". Investigation revealed the codebase had inconsistent data persistence - some flows updated only localStorage while others updated the database, causing state desync.

### Changes & Reasoning

#### 1. AuthPage.tsx - Replace localStorage Auth with Supabase Auth

**Problem:** AuthPage had a hardcoded admin backdoor using localStorage. Login/signup bypassed Supabase Auth entirely for some flows.

**Solution:** Complete rewrite to use `AuthService.signIn()` and `AuthService.signUp()` for all authentication. Added `profileToUser()` helper to convert snake_case database fields to camelCase TypeScript properties.

**Why this matters:** Authentication must go through Supabase Auth to maintain proper sessions. localStorage-only auth meant sessions weren't tracked server-side.

#### 2. App.tsx - Load User from Supabase Session on Startup

**Problem:** `App.tsx` loaded user data from localStorage only. If localStorage had stale data (e.g., old subscription), user saw wrong subscription until page refresh after re-login.

**Solution:** On app load, call `AuthService.getCurrentSession()` to get fresh user data from Supabase, then cache to localStorage.

**Pattern established:** Database → localStorage (not localStorage → hope it's correct)

#### 3. App.tsx - Fix Logout to Clear Supabase Session

**Problem:** `handleLogout()` only cleared localStorage. Supabase session remained active, causing auto-login on next visit.

**Solution:** Added `AuthService.signOut()` call before clearing localStorage.

#### 4. PricingTiers.tsx - Update Database on Payment Success

**Problem:** `handleCheckoutSuccess()` only called `onUpgrade()` which updated localStorage. Database never updated with new subscription.

**Solution:** Added `PaymentService.handlePaymentSuccess()` call to update Supabase database FIRST, then sync localStorage via `onUpgrade()`.

**This was the root cause** of subscriptions not persisting.

#### 5. StripeRedirectCheckout.tsx - Add Database Update

**Problem:** Similar issue - payment success only updated localStorage.

**Solution:** Added `PaymentService.handlePaymentSuccess()` call.

#### 6. authService.ts - Add changePassword Method

**Problem:** No way for users to change password.

**Solution:** Added `changePassword()` method using `supabase.auth.updateUser()`.

#### 7. AccountPage.tsx - Add Change Password Modal

**Problem:** No UI for password change.

**Solution:** Added modal with password/confirm fields and validation.

#### 8. paymentService.ts - Fix Import Path

**Problem:** Build error: `Could not resolve '../lib/stripe'`

**Solution:** Changed import to `'../utils/stripeUtils'` (correct location).

#### 9. CLAUDE.md - Document Data Persistence Pattern

**Problem:** No documentation explaining the database vs localStorage pattern, leading to inconsistent implementations.

**Solution:** Added "User Data: Database vs localStorage" section documenting the correct flow:
- Login → Database → localStorage
- Payment → Database FIRST → localStorage
- Page Load → Check Supabase session → Refresh localStorage

### Files Changed

| File | Change Type | Reason |
|------|-------------|--------|
| `src/components/Auth/AuthPage.tsx` | Rewritten | Use Supabase Auth, not localStorage |
| `src/App.tsx` | Modified | Load from Supabase session, fix logout |
| `src/components/Subscription/PricingTiers.tsx` | Modified | Update DB on payment success |
| `src/components/Subscription/StripeRedirectCheckout.tsx` | Modified | Update DB on payment success |
| `src/services/authService.ts` | Modified | Add changePassword method |
| `src/components/Account/AccountPage.tsx` | Modified | Add change password modal |
| `src/services/paymentService.ts` | Modified | Fix import path |
| `CLAUDE.md` | Modified | Document data persistence pattern |

### Testing Performed

- Login → Subscribe to enterprise → Logout → Login → Verify still enterprise ✓
- Change password → Logout → Login with new password ✓
- Build verification ✓

### Lessons Learned

**Database is source of truth, localStorage is cache.** Every write operation must update database first, then sync localStorage. Reading should prefer database (via session) and use localStorage as fallback/cache.

### Related Issues

- Subscription persistence bug
- Auto-login after logout bug
- Missing change password feature

---

## 2026-01-06: Expand BRANCH_ANALYSIS.md with 10 more commits and fix dates

**Commit:** `1aa788e` - Expand BRANCH_ANALYSIS.md with 10 more commits and fix dates

### Context

Continuing to backfill BRANCH_ANALYSIS.md with historical commit documentation. During this process, discovered that all dates had been incorrectly assumed rather than pulled from actual git history.

### Changes & Reasoning

#### 1. Add 10 More Historical Commits

**Problem:** Only 11 commits were documented. More history needed to be captured.

**Solution:** Added entries for 10 additional commits:
- 5 commits from Jan 1-2, 2026 (multi-page crawling, metrics, algorithm pivot)
- 5 commits from Sep 18, 2025 (pricing page, code cleanup, bug fixes)

#### 2. Fix All Incorrect Dates

**Problem:** Dates were assumed/invented rather than taken from git history. For example, commits from September 2025 were incorrectly dated as December 2025.

**Solution:** Ran `git log --format="%h %ad %s" --date=short` to get actual dates and corrected all 21 entries.

**Key finding:** There's a 3.5-month gap between Sep 18, 2025 and Jan 1, 2026 with no commits. This wasn't obvious from the assumed sequential dates.

**Lesson:** Always verify dates from git history. Don't assume sequential development.

### Files Changed

| File | Change Type | Reason |
|------|-------------|--------|
| `BRANCH_ANALYSIS.md` | Modified | Add 10 commits, fix all dates |

### Testing Performed

- Verified dates match `git log` output

### Related Issues

- Documentation accuracy: Dates must come from source of truth (git)

---

## 2026-01-06: Add historical commit documentation to BRANCH_ANALYSIS.md

**Commit:** `f79d51e` - Add historical commit documentation to BRANCH_ANALYSIS.md

### Context

BRANCH_ANALYSIS.md was created to document the reasoning behind commits. The initial entry only covered the most recent commit. To make this file useful as a historical reference, we needed to backfill documentation for previous significant commits.

### Changes & Reasoning

#### 1. Backfill 9 Historical Commits

**Problem:** Only 1 commit was documented. The reasoning behind earlier decisions was still only in git commit messages (brief) or lost entirely.

**Solution:** Added detailed entries for 9 commits spanning 2025-12-31 to 2026-01-04:

| Commit | Summary |
|--------|---------|
| `7572a09` | SEO → AEO terminology pivot (keyword → query) |
| `6b22714` | Analysis history feature, ARCHITECTURE.md, ROADMAP.md |
| `76eb7e3` | Security checklist, master feature list, HSTS header |
| `4f82d2b` | Navigation bug fixes, 13 flow tests |
| `f83d2bd` | Payment upgrade flow fix, admin user deletion |
| `b19dc00` | Security fixes, PCI cleanup, enterprise tier limits |
| `21e098c` | Cancel subscription feature (+ accidental doc deletion) |
| `8f3047b` | Rate limiting, restore accidentally deleted docs |
| `9d41c1c` | CORS restriction for Edge Functions |

#### 2. Document Lessons Learned

**Key insight captured:** The doc deletion/restoration incident (commits 21e098c → 8f3047b) is now documented with the lesson: "Don't delete files without understanding why they exist."

This is exactly the kind of institutional knowledge that gets lost without documentation like this.

#### 3. Add Rule to CLAUDE.md

**Problem:** The lesson from the doc deletion incident needed to be codified as a rule.

**Solution:** Added to CLAUDE.md:
- **Don't section:** "Delete or modify files without understanding their purpose"
- **Pre-Change Checklist:** "Do I understand why this file/code exists?"

Both reference BRANCH_ANALYSIS.md as the place to check for historical context.

### Files Changed

| File | Change Type | Reason |
|------|-------------|--------|
| `BRANCH_ANALYSIS.md` | Modified | Add 9 historical commit entries |
| `CLAUDE.md` | Modified | Add rule about understanding file history |

### Testing Performed

- No code changes, documentation only

### Related Issues

- Documentation: Preserve decision-making context for future developers

---

## 2026-01-06: Documentation consolidation and CLAUDE.md rewrite

**Commit:** `04fee45` - Documentation consolidation and CLAUDE.md rewrite

### Context

Following the previous commit's documentation cleanup (deleting 12 redundant files), this commit focuses on improving the quality and structure of the remaining documentation, particularly CLAUDE.md which serves as the primary instruction file for AI assistants.

### Changes & Reasoning

#### 1. CLAUDE.md Rewrite

**Problem:** The original CLAUDE.md was 314 lines and didn't follow best practices outlined in [Claude's blog post on CLAUDE.md files](https://claude.com/blog/using-claude-md-files). It was verbose and lacked clear workflows.

**Solution:** Rewrote to 143 lines with:
- Concise project overview (what, not how)
- Standard workflows for common tasks (adding features, fixing bugs, etc.)
- References to external docs instead of duplicating content
- Added Collaboration Rules section (merged from AI_COLLABORATION_RULES.md)

**Why this structure:** The blog recommends keeping CLAUDE.md focused on "what the AI needs to know" rather than comprehensive documentation. Detailed docs belong in separate files that can be referenced.

#### 2. AI_COLLABORATION_RULES.md Merge & Delete

**Problem:** AI_COLLABORATION_RULES.md existed as a separate file but wasn't being loaded by Claude Code (only CLAUDE.md is auto-loaded). The rules were useful but effectively invisible.

**Solution:** Merged the key rules into CLAUDE.md under "Collaboration Rules" section, then deleted the standalone file.

**Rules preserved:**
- Work incrementally
- Clarify before implementing (modules affected, DB changes, billing logic)
- Ask permission before routing/schema/refactor changes
- Never bypass RLS, subscription gating, Stripe handling, cost controls

#### 3. ARCHITECTURE.md Expansion

**Problem:** The project structure section was incomplete—missing many component folders and services.

**Solution:** Updated to include all 18 component directories and all 5 service files with descriptions.

**Why this matters:** AI assistants use ARCHITECTURE.md to understand codebase structure. Incomplete information leads to unnecessary exploration or missed context.

#### 4. BRANCH_ANALYSIS.md Creation

**Problem:** Git history shows *what* changed but not *why*. Design decisions, tradeoffs, and reasoning are lost.

**Solution:** Created this file to document the reasoning behind significant commits.

**Format:** Each entry includes Context, Changes & Reasoning, Files Changed, Testing Performed, and Related Issues.

#### 5. DOCUMENTATION_INDEX.md Updates

**Problem:** Missing entries (README.md, MASTER_FEATURE_LIST.md) and outdated file counts.

**Solution:** Added missing entries to Primary Documentation, updated deleted files list (now 13), corrected total file count to 26.

#### 6. MASTER_FEATURE_LIST.md Updates

**Problem:** Missing recent changes from this session in the changelog, and BRANCH_ANALYSIS.md not listed.

**Solution:** Added BRANCH_ANALYSIS.md to Developer Docs, added 5 changelog entries, updated progress to 72%.

### Files Changed

| File | Change Type | Reason |
|------|-------------|--------|
| `CLAUDE.md` | Rewritten | Follow best practices, add workflows |
| `AI_COLLABORATION_RULES.md` | Deleted | Merged into CLAUDE.md |
| `BRANCH_ANALYSIS.md` | Created | Document commit reasoning |
| `ARCHITECTURE.md` | Updated | Add missing components/services |
| `DOCUMENTATION_INDEX.md` | Updated | Add missing entries, fix counts |
| `MASTER_FEATURE_LIST.md` | Updated | Add changelog, update progress |

### Testing Performed

```bash
npm run build  # Verify no build errors (docs only, no code changes)
```

### Related Issues

- Documentation quality improvement
- AI assistant context optimization

---

## 2026-01-06: Add user deletion, test suite, and documentation cleanup

**Commit:** `8dd75fb` - Add user deletion, test suite, and documentation cleanup

### Context

During a session focused on security hardening and test coverage, several issues were identified:

1. **Admin user deletion only removed from localStorage** - When admins deleted users from the dashboard, the data persisted in Supabase
2. **No test coverage for Edge Functions** - Only payment flow tests existed
3. **Documentation sprawl** - 39 markdown files with significant duplication
4. **Data leakage between users** - When a user signed out and another signed in, cached data from the previous user could appear

### Changes & Reasoning

#### 1. Delete User Edge Function (`supabase/functions/delete-user/`)

**Problem:** The admin UserDashboard component was only calling `localStorage.removeItem()` when deleting users. The user data remained in Supabase.

**Solution:** Created a new Edge Function that:
- Verifies the requesting user is an admin (prevents unauthorized deletion)
- Prevents deletion of admin accounts (safety measure)
- Performs cascade deletion in correct order:
  1. `analyses` table (foreign key to users)
  2. `projects` table (foreign key to users)
  3. `payments` table (foreign key to users)
  4. `users` table
  5. Supabase Auth user

**Why cascade order matters:** Foreign key constraints require child records to be deleted before parent records. Deleting in wrong order causes constraint violations.

**Why Edge Function instead of client-side:**
- Requires `SUPABASE_SERVICE_ROLE_KEY` for auth.admin.deleteUser()
- Service role key must never be exposed to client
- Server-side validation of admin status is more secure

#### 2. localStorage Cleanup (`src/services/authService.ts`)

**Problem:** When User A signs out and User B signs in, User B could see User A's cached projects/analyses from localStorage.

**Solution:** Added `clearUserLocalStorage()` function that removes:
- `analyses`
- `projects`
- `currentUser`
- `costTracker`
- `analysisHistory`
- `recentAnalyses`

Called on: `signUp`, `signIn`, and `signOut`

**Why on signIn (not just signOut):** Users might close browser without signing out. Clearing on signIn ensures clean state regardless of how previous session ended.

#### 3. Dashboard Real Data (`src/components/Dashboard/Dashboard.tsx`)

**Problem:** Dashboard was using hardcoded `mockProjects` array instead of fetching real user projects.

**Solution:**
- Removed mock data import
- Added `projects` state and `ProjectService` import
- Fetch projects from `ProjectService.getUserProjects(currentUser.id)` on mount

**Why this was missed:** The mock data was likely placeholder from initial development that was never replaced when ProjectService was implemented.

#### 4. Edge Function Test Suite (`scripts/test-edge-functions.ts`)

**Problem:** No automated tests for Edge Functions. Only way to verify they worked was manual testing.

**Solution:** Created comprehensive test script covering:
- Payment functions: stripe-webhook, create-payment-intent, cancel-subscription
- Admin functions: delete-user, webhook-helper
- Analysis functions: crawl-website, check-citations
- Security: CORS preflight (allowed + blocked origins)

**Test philosophy:**
- Tests verify functions respond correctly, not that they perform full operations
- For delete-user: test that unauthorized requests get 403 (not actually deleting users)
- For check-citations: accept "missing API key" as valid response in test environment
- CORS tests verify origin whitelist is enforced

#### 5. Documentation Consolidation

**Problem:** 39 markdown files with significant overlap:
- 8 webhook fix/troubleshooting docs (all historical, no longer needed)
- 6 Stripe setup docs (duplicated content)

**Solution:**
- Merged webhook setup content into `STRIPE_SETUP.md`
- Deleted 12 redundant files
- Updated `DOCUMENTATION_INDEX.md` to reflect cleanup

**Files deleted:**
- `AUTOMATIC_WEBHOOK_FIX.md` - Historical fix, issue resolved
- `WEBHOOK_DEPLOYMENT_FIX.md` - Historical fix
- `WEBHOOK_DEPLOYMENT_TROUBLESHOOTING.md` - Historical fix
- `WEBHOOK_FIX_GUIDE.md` - Historical fix
- `WEBHOOK_FIX_STEPS.md` - Historical fix
- `WEBHOOK_TROUBLESHOOTING.md` - Historical fix
- `LIVE_WEBHOOK_SETUP_GUIDE.md` - Duplicate of LIVE_WEBHOOK_SETUP.md
- `STRIPE_WEBHOOK_SETUP.md` - Merged into STRIPE_SETUP.md
- `STRIPE_SETUP_COMPLETE.md` - Duplicate of STRIPE_SETUP.md
- `STRIPE_LIVE_DEPLOYMENT.md` - Duplicate content
- `LIVE_STRIPE_SETUP.md` - Duplicate content
- `PAYMENT_DEPLOYMENT_GUIDE.md` - Duplicate of Edge Function docs

**Why keep historical record here instead of in deleted files:** Git history preserves the file content. This document explains the *reasoning*, which git doesn't capture.

#### 6. "Back to Home" Navigation Fix

**Problem:** "Back to Home" buttons in PricingTiers, PrivacyPolicy, TermsOfService, and ContactPage navigated to `#landing` or empty hash, not the dashboard.

**Solution:** Changed all to navigate to `#dashboard`

**Also fixed:** Removed unnecessary `window.location.reload()` calls. Hash-based navigation doesn't require full page reload.

### Files Changed

| File | Change Type | Reason |
|------|-------------|--------|
| `supabase/functions/delete-user/index.ts` | New | Admin user deletion |
| `scripts/test-edge-functions.ts` | New | Edge Function tests |
| `TESTING.md` | New | Test documentation |
| `src/services/authService.ts` | Modified | localStorage cleanup |
| `src/components/Dashboard/Dashboard.tsx` | Modified | Real project data |
| `src/components/Admin/UserDashboard.tsx` | Modified | Call delete-user API |
| `src/components/*/` (4 files) | Modified | Back to Home → dashboard |
| `*.md` (8 files) | Modified | Documentation updates |
| `*.md` (12 files) | Deleted | Redundant docs |

### Testing Performed

```bash
npm run test:functions  # 9/9 passed
npm run build           # No errors
```

### Related Issues

- User deletion was only client-side (security/data integrity issue)
- No Edge Function test coverage (DevOps gap)
- Documentation sprawl making it hard to find correct information

---

## 2026-01-06: Implement CORS restriction for Edge Functions

**Commit:** `9d41c1c` - Implement CORS restriction for Edge Functions

### Context

Edge Functions were accepting requests from any origin, creating a security vulnerability. An attacker could create a malicious website that calls our Edge Functions directly, potentially abusing our API keys or manipulating user data.

### Changes & Reasoning

#### 1. Shared CORS Utility (`supabase/functions/_shared/cors.ts`)

**Problem:** Each Edge Function had its own CORS headers with `Access-Control-Allow-Origin: *`, allowing any website to make requests.

**Solution:** Created a shared CORS utility with:
- Explicit origin whitelist: `lucent-elf-359aef.netlify.app`, `localhost:5173`, `localhost:3000`
- `validateOrigin()` function that checks request origin against whitelist
- `getCorsHeaders()` function that returns appropriate headers based on origin
- Rejects requests from non-whitelisted origins with 403

**Why whitelist over wildcard:**
- Prevents CSRF attacks from malicious sites
- Limits API abuse to authorized frontends only
- Required for security compliance

#### 2. All Edge Functions Updated

**Problem:** 7 Edge Functions needed consistent CORS handling.

**Solution:** Updated each function to:
1. Import shared CORS utility
2. Validate origin on every request
3. Return 403 for unauthorized origins
4. Use origin-specific headers (not wildcard)

**Exception:** `stripe-webhook` doesn't validate origin (Stripe calls it directly, not from a browser).

#### 3. Fixed Duplicate Variable Declaration

**Problem:** `stripe-webhook/index.ts` had duplicate `liveWebhookSecret` declaration causing TypeScript error.

**Solution:** Removed duplicate declaration.

### Files Changed

| File | Change Type | Reason |
|------|-------------|--------|
| `supabase/functions/_shared/cors.ts` | New | Shared CORS validation |
| `supabase/functions/check-citations/index.ts` | Modified | Use shared CORS |
| `supabase/functions/crawl-website/index.ts` | Modified | Use shared CORS |
| `supabase/functions/cancel-subscription/index.ts` | Modified | Use shared CORS |
| `supabase/functions/create-subscription/index.ts` | Modified | Use shared CORS |
| `supabase/functions/create-payment-intent/index.ts` | Modified | Use shared CORS |
| `supabase/functions/webhook-helper/index.ts` | Modified | Use shared CORS |
| `supabase/functions/stripe-webhook/index.ts` | Modified | Fix duplicate variable |
| `SECURITY_SCALABILITY_CHECKLIST.md` | Modified | Mark CORS as complete |

### Testing Performed

- Manual testing of Edge Functions from allowed origins
- Verified 403 returned for requests from non-whitelisted origins
- Build verification

### Related Issues

- Security: CORS misconfiguration vulnerability
- SECURITY_SCALABILITY_CHECKLIST.md updated to 17/25 (68%)

---

## 2026-01-05: Implement rate limiting and restore documentation

**Commit:** `8f3047b` - Implement rate limiting and restore documentation

### Context

This commit has two distinct parts:
1. **Rate limiting implementation** - New feature to prevent API abuse
2. **Documentation restoration** - Reverting an overly aggressive documentation deletion from a previous commit

### Changes & Reasoning

#### 1. Rate Limiter Utility (`supabase/functions/_shared/rateLimiter.ts`)

**Problem:** No protection against API abuse. A malicious user could hammer Edge Functions with unlimited requests.

**Solution:** Created in-memory rate limiter with:
- Configurable limits per function
- Sliding window algorithm
- Returns 429 Too Many Requests when exceeded

**Limitation:** In-memory storage resets on function cold start. Noted as a scalability item for future Redis implementation.

#### 2. Cost Tracker Enhancements (`src/utils/costTracker.ts`)

**Problem:** Cost tracking existed but wasn't comprehensive.

**Solution:** Added detailed cost breakdown by operation type (crawl, API calls, etc.)

#### 3. Documentation Restoration (35 files)

**Problem:** Previous commit (21e098c) deleted 35 documentation files as part of "consolidation." The deletion was done without fully understanding the purpose of each file.

**Solution:** Restored all deleted documentation files including:
- Setup guides (SETUP_CHECKLIST.md, LOCAL_DEPLOYMENT_GUIDE.md)
- Security docs (PCI_COMPLIANCE_GUIDE.md, LIVE_MODE_SECURITY_CHECKLIST.md)
- Stripe docs (STRIPE_SETUP.md, STRIPE_LIVE_MODE_CHECKLIST.md)
- Architecture docs (ARCHITECTURE.md, MASTER_FEATURE_LIST.md)
- Troubleshooting guides (various webhook and Node.js fixes)

**Lesson learned:** Don't delete files without understanding why they exist. The proper cleanup was done later (2026-01-05) after carefully analyzing each file's purpose and consolidating where appropriate.

### Files Changed

| File | Change Type | Reason |
|------|-------------|--------|
| `supabase/functions/_shared/rateLimiter.ts` | New | Rate limiting |
| `src/utils/costTracker.ts` | Modified | Enhanced cost tracking |
| `src/utils/analysisEngine.ts` | Modified | Integrate rate limiting |
| `*.md` (35 files) | Restored | Undo aggressive deletion |

### Testing Performed

- Rate limiter unit tests
- Manual verification of restored docs

### Related Issues

- Scalability: Rate limiting needed for production
- Documentation: Overly aggressive cleanup reversed

---

## 2026-01-05: Add cancel subscription feature and consolidate documentation

**Commit:** `21e098c` / `4e15bd2` - Add cancel subscription feature

### Context

Users had no way to cancel their subscription from within the app. They would need to contact support or go directly to Stripe's customer portal. This created friction and potential chargeback issues.

### Changes & Reasoning

#### 1. Cancel Subscription UI (`src/components/Account/AccountPage.tsx`)

**Problem:** No self-service cancellation option.

**Solution:** Added to Account settings:
- "Cancel Subscription" button (only shows for active subscribers)
- Confirmation modal explaining what happens
- Shows subscription end date after cancellation
- Updates UI state immediately

**UX decision:** Cancel at period end (not immediately) so users keep access until billing cycle ends. This is friendlier and reduces refund requests.

#### 2. Cancel Subscription Edge Function (`supabase/functions/cancel-subscription/index.ts`)

**Problem:** Need server-side Stripe API call for security.

**Solution:** New Edge Function that:
1. Validates user authentication
2. Retrieves user's Stripe subscription ID from database
3. Calls Stripe API to cancel at period end
4. Updates database with cancellation status
5. Returns new subscription end date

**Why Edge Function:** Stripe secret key must never be exposed to client.

#### 3. Webhook Handler Update (`supabase/functions/stripe-webhook/index.ts`)

**Problem:** When subscription actually ends (at period end), user should revert to trial status.

**Solution:** Handle `customer.subscription.deleted` event:
- Set user's subscription to 'trial'
- Clear Stripe-related fields
- User can re-subscribe later if desired

#### 4. User Type Updates (`src/types/index.ts`)

**Problem:** Need to track subscription management fields.

**Solution:** Added to User type:
- `stripeSubscriptionId`: For API calls
- `cancelAtPeriodEnd`: Boolean flag
- `subscriptionEndsAt`: Date when access ends

#### 5. Documentation Deletion (Mistake - Later Reverted)

**What happened:** This commit deleted 35 documentation files as "consolidation" without fully understanding the purpose of each file.

**Result:** Restored in commit 8f3047b the next day.

**Lesson:** This is why BRANCH_ANALYSIS.md exists—to document *why* files exist so future cleanup efforts don't accidentally delete important docs. The proper cleanup was done on 2026-01-05 after carefully reviewing each file.

### Files Changed

| File | Change Type | Reason |
|------|-------------|--------|
| `src/components/Account/AccountPage.tsx` | Modified | Cancel UI |
| `supabase/functions/cancel-subscription/index.ts` | New | Cancel API |
| `supabase/functions/stripe-webhook/index.ts` | Modified | Handle subscription end |
| `src/types/index.ts` | Modified | New subscription fields |
| `README.md` | New | Project overview |
| `CLAUDE.md` | Modified | Update architecture |

### Testing Performed

- Manual test of full cancellation flow
- Verified webhook handling with Stripe CLI
- Confirmed database updates

### Related Issues

- User retention: Self-service cancellation reduces support burden
- Compliance: Users must be able to cancel easily

---

## 2026-01-04: Security fixes, plan limits update, and UX improvements

**Commit:** `b19dc00` - Security fixes, plan limits update, and UX improvements

### Context

Pre-launch security audit identified several issues: hardcoded secrets in debug components, unused variables that could indicate PCI compliance issues, and overly generous enterprise tier limits that would be unprofitable.

### Changes & Reasoning

#### 1. Remove Hardcoded Supabase Secrets

**Problem:** Debug components and test scripts had hardcoded Supabase URLs and keys. Even though these were in gitignored files or debug-only components, it's bad practice.

**Files affected:**
- `debug-payment.js`
- `scripts/test-payment-flow.ts`
- `src/components/Debug/AutomaticWebhookFixer.tsx`
- `src/components/Debug/WebhookDeployer.tsx`
- `src/components/Debug/WebhookManager.tsx`

**Solution:** Replace hardcoded values with environment variable references. Test scripts now fail fast if env vars not set.

#### 2. Clean Up Unused Card Variables (PCI Compliance)

**Problem:** `CreditCardForm.tsx` had unused state variables like `cardNumber`, `expiry`, `cvc`. Even though we use Stripe Elements (so we never touch actual card data), having these variables could raise questions during PCI compliance review.

**Solution:** Remove all unused card-related state variables. The component now only uses Stripe Elements refs.

**Why this matters:** PCI SAQ-A (our compliance level) requires we never handle card data. Having variables that suggest we might was a red flag.

#### 3. Reduce Enterprise Tier Limits

**Problem:** Enterprise tier had 1,000 analyses/month with $600 budget. At our API costs, this would be unprofitable.

**Solution:**
- Analyses: 1,000 → 400/month
- Budget: $600 → $250/month

**Why 400:** Based on actual API costs (~$0.50-0.75 per real analysis), 400 analyses at $99/month is sustainable.

#### 4. UX Improvements

**"Back to Home" button:** Added to pricing page for users who navigate there but decide not to upgrade.

**Trial FAQ clarification:** Updated to clearly explain that trial analyses use simulated data, while paid plans get real AI queries.

**Trial notice:** Added note in the trial status banner about simulated data.

### Files Changed

| File | Change Type | Reason |
|------|-------------|--------|
| `debug-payment.js` | Modified | Remove hardcoded secrets |
| `scripts/test-payment-flow.ts` | Modified | Require env vars |
| `src/components/Debug/*.tsx` (3 files) | Modified | Remove hardcoded secrets |
| `src/components/Payment/CreditCardForm.tsx` | Modified | Remove unused card vars |
| `src/components/Subscription/PricingTiers.tsx` | Modified | Back to Home, trial FAQ |
| `src/utils/costTracker.ts` | Modified | New enterprise limits |
| `src/utils/planConfig.ts` | Modified | New enterprise limits |

### Testing Performed

- Verified debug components still work with env vars
- Verified payment flow unaffected by CreditCardForm cleanup
- Build verification

### Related Issues

- Security: Hardcoded secrets removed
- PCI Compliance: Unused card variables removed
- Profitability: Enterprise tier pricing adjusted

---

## 2026-01-04: Fix payment upgrade flow and add admin user management

**Commit:** `f83d2bd` - Fix payment upgrade flow and add admin user management

### Context

After implementing Stripe payments, testing revealed that successful payments weren't updating the user's subscription status in the UI. Users would pay but still see "trial" status until they refreshed.

### Changes & Reasoning

#### 1. Fix handleUpgrade Function (`src/App.tsx`)

**Problem:** After successful Stripe checkout, `handleUpgrade()` was called but only updated the database—not the React state or localStorage. User had to refresh to see their new subscription.

**Solution:** Updated `handleUpgrade()` to:
1. Update database (existing)
2. Update React state (`setCurrentUser`)
3. Update localStorage
4. UI reflects new subscription immediately

#### 2. Admin User Deletion (`src/components/Admin/UserDashboard.tsx`)

**Problem:** Admins needed ability to delete users (for testing, GDPR requests, etc.)

**Solution:** Added delete button to UserDashboard with:
- Confirmation prompt
- Removes from localStorage (Note: Full database deletion added later in delete-user Edge Function)

**Limitation:** This was client-side only. Proper cascade deletion via Edge Function was added later.

#### 3. Fix Default Subscription for New Signups

**Problem:** New users were defaulting to 'enterprise' subscription instead of 'trial'.

**Solution:** Changed default in `AuthPage.tsx` from 'enterprise' to 'trial'.

**Why this happened:** Likely a testing artifact that got committed.

#### 4. Increase Plan Budget Limits (`src/utils/costTracker.ts`)

**Problem:** Budget limits were too low for the analysis counts promised:
- Starter: $2 budget for 10 analyses (not enough)
- Professional: $10 for 50 analyses (not enough)
- Enterprise: $200 for 1000 analyses (not enough)

**Solution:** Increased budgets to match realistic API costs:
- Starter: $2 → $6
- Professional: $10 → $35
- Enterprise: $200 → $600

#### 5. Payment Test Script (`scripts/test-payment-flow.ts`)

**Problem:** No automated way to test payment flows.

**Solution:** Created test script that:
- Tests Stripe checkout session creation
- Tests webhook handling
- Tests subscription status updates
- Added npm scripts: `test:payment`, `stripe:listen`

### Files Changed

| File | Change Type | Reason |
|------|-------------|--------|
| `src/App.tsx` | Modified | Fix handleUpgrade state/localStorage |
| `src/components/Admin/UserDashboard.tsx` | Modified | Add delete user |
| `src/components/Auth/AuthPage.tsx` | Modified | Default to trial |
| `src/utils/costTracker.ts` | Modified | Increase budgets |
| `scripts/test-payment-flow.ts` | New | Payment tests |
| `package.json` | Modified | Add test scripts |

### Testing Performed

- Manual payment flow test
- Verified state updates after checkout
- Test script runs successfully

### Related Issues

- Payment flow UX: Users see subscription immediately after paying
- Admin tools: Basic user management

---

## 2026-01-03: Fix navigation flow bugs and add flow tests

**Commit:** `4f82d2b` - Fix navigation flow bugs and add flow tests

### Context

Users reported that clicking "View Last Analysis" multiple times didn't work—the first click worked but subsequent clicks did nothing. Investigation revealed multiple navigation bugs related to hash/state synchronization.

### Changes & Reasoning

#### 1. Fix "View Last Analysis" Repeated Clicks

**Problem:** Sidebar navigation updated React state but not `window.location.hash`. When user clicked a second time, hash was already correct so no navigation happened.

**Solution:** Sidebar now updates both:
1. React state (for component rendering)
2. `window.location.hash` (for browser history)

**Root cause:** Hash and state were getting out of sync.

#### 2. Fix Unreachable Code in App.tsx

**Problem:** `handleHashChange()` was placed after the `return` statement in a useEffect, so it never ran on initial page load.

**Solution:** Moved to run before return statement.

**Impact:** Initial page load now respects the URL hash (e.g., linking directly to `#history` works).

#### 3. Fix localStorage Persistence

**Problem:** `currentAnalysis` was being cleared from localStorage after loading into state, breaking "View Last Analysis" on subsequent clicks.

**Solution:** Don't clear localStorage after loading—keep it as the persistent store.

#### 4. EnvironmentStatus Component Enhancement

**Problem:** Admin debugging was difficult—no easy way to see environment configuration.

**Solution:** Enhanced EnvironmentStatus to show:
- Environment (Dev/Prod)
- Stripe mode (Test/Live)
- Database connection status
- Warnings for misconfigurations (e.g., live Stripe in dev)

#### 5. Navigation Flow Tests (13 tests)

**Problem:** Navigation bugs were caught by users, not tests.

**Solution:** Created `src/test/navigation.test.tsx` covering:
- Hash/state synchronization
- "View Last Analysis" repeated navigation (the actual bug)
- Sidebar navigation updates hash
- localStorage persistence

### Files Changed

| File | Change Type | Reason |
|------|-------------|--------|
| `src/App.tsx` | Modified | Fix unreachable code |
| `src/components/Analysis/NewAnalysis.tsx` | Modified | Navigation fixes |
| `src/components/Layout/Sidebar.tsx` | Modified | Update hash on nav |
| `src/components/UI/EnvironmentStatus.tsx` | Modified | Admin debugging |
| `src/test/navigation.test.tsx` | New | 13 navigation tests |

### Testing Performed

- All 13 new navigation tests pass
- Manual verification of repeated "View Last Analysis" clicks
- Build verification

### Related Issues

- UX bug: "View Last Analysis" not working on repeated clicks
- Testing gap: Navigation had no test coverage

---

## 2026-01-03: Add security checklist, master feature list, and update documentation

**Commit:** `76eb7e3` - Add security checklist, master feature list, and update documentation

### Context

Preparing for launch required a comprehensive security audit and feature inventory. No single document tracked all features or security status.

### Changes & Reasoning

#### 1. HSTS Header (`netlify.toml`)

**Problem:** Site was accessible over HTTPS but didn't enforce it via HSTS header.

**Solution:** Added `Strict-Transport-Security: max-age=31536000; includeSubDomains` to netlify.toml.

**Why HSTS:** Prevents downgrade attacks and ensures browsers always use HTTPS.

#### 2. Security & Scalability Checklist (`SECURITY_SCALABILITY_CHECKLIST.md`)

**Problem:** No systematic tracking of security measures.

**Solution:** Created checklist covering:
- Authentication (5 items)
- Authorization (4 items)
- Data protection (5 items)
- API security (6 items)
- Scalability (18 items)

**Initial status:** 15/25 security items complete, 8/18 scalability items complete.

#### 3. Master Feature List (`MASTER_FEATURE_LIST.md`)

**Problem:** Features were scattered across multiple docs with no single source of truth.

**Solution:** Created comprehensive list with:
- 112 features across 9 categories
- Status tracking (Complete/Partial/Pending)
- Notes explaining current state

**Categories:** Core Features, Security, Scalability, Testing, Documentation, DevOps, Payments, UX, Admin

#### 4. Documentation Index (`DOCUMENTATION_INDEX.md`)

**Problem:** 38 markdown files with no organization guide.

**Solution:** Created index organizing docs by purpose:
- Primary documentation
- Setup & deployment
- Stripe & payments
- Troubleshooting
- Testing

#### 5. Remove Duplicate Architecture Doc

**Problem:** `docs/ARCHITECTURE.md` duplicated root `ARCHITECTURE.md`.

**Solution:** Deleted `docs/ARCHITECTURE.md` (338 lines of duplicate content).

### Files Changed

| File | Change Type | Reason |
|------|-------------|--------|
| `netlify.toml` | Modified | Add HSTS header |
| `SECURITY_SCALABILITY_CHECKLIST.md` | New | Security tracking |
| `MASTER_FEATURE_LIST.md` | New | Feature inventory |
| `DOCUMENTATION_INDEX.md` | New | Doc organization |
| `CLAUDE.md` | Modified | Add pre-change checklist |
| `docs/ARCHITECTURE.md` | Deleted | Duplicate |

### Testing Performed

- HSTS header verified in browser dev tools
- Build verification

### Related Issues

- Launch prep: Security audit required
- Documentation: Need single source of truth for features

---

## 2026-01-03: Add analysis history feature and project documentation

**Commit:** `6b22714` - Add analysis history feature and project documentation

### Context

Users could run analyses but had no way to view past results. Each new analysis replaced the previous one with no history tracking.

### Changes & Reasoning

#### 1. Analysis History Component (`src/components/History/AnalysisHistory.tsx`)

**Problem:** No way to view past analyses.

**Solution:** Created AnalysisHistory component with:
- List of all past analyses
- Stats overview (total count, average citation rate)
- Trend indicators (up/down/stable per website)
- Filter by website
- Click to view full analysis details

**Data source:** Reads from localStorage `analyses` array (later migrated to Supabase).

#### 2. Sidebar Navigation Update

**Problem:** No way to access history page.

**Solution:** Added "History" link to Sidebar component.

#### 3. Route Wiring (`src/App.tsx`)

**Problem:** Hash route for `#history` not handled.

**Solution:** Added case for `#history` → render AnalysisHistory component.

#### 4. Architecture Documentation (`ARCHITECTURE.md`)

**Problem:** No documentation of system architecture for new developers.

**Solution:** Created ARCHITECTURE.md covering:
- Tech stack overview
- Project structure
- Data flow diagram
- Key design decisions

#### 5. Roadmap Documentation (`ROADMAP.md`)

**Problem:** No tracking of completed vs planned features.

**Solution:** Created ROADMAP.md with:
- Completed features list
- Upcoming features prioritized
- Future considerations

### Files Changed

| File | Change Type | Reason |
|------|-------------|--------|
| `src/components/History/AnalysisHistory.tsx` | New | History feature |
| `src/components/Layout/Sidebar.tsx` | Modified | Add History link |
| `src/App.tsx` | Modified | Add history route |
| `ARCHITECTURE.md` | New | System documentation |
| `ROADMAP.md` | New | Feature tracking |

### Testing Performed

- Manual testing of history page
- Verify trend calculations
- Build verification

### Related Issues

- Feature request: Users want to compare analyses over time
- Documentation: Onboarding new developers

---

## 2026-01-02: Change keyword term to query

**Commit:** `7572a09` - Change keyword term to query

### Context

The product pivoted from traditional SEO (keyword-based) to AEO (Answer Engine Optimization). The terminology needed to reflect this change—users don't search with "keywords" in AI assistants, they ask questions (queries/prompts).

### Changes & Reasoning

#### 1. Terminology Update

**Problem:** UI still used "keyword" terminology from SEO paradigm:
- "Keywords analyzed"
- "Keyword performance"
- "Target keywords"

**Solution:** Changed to "query" terminology:
- "Queries analyzed"
- "Query performance"
- "Target queries"

**Why this matters:** AEO is about optimizing for how people ask questions to AI assistants, not traditional keyword matching. The terminology should reflect the product's actual value proposition.

#### 2. Files Updated

- `AnalysisResults.tsx` - Main results display
- `MetricsBreakdown.tsx` - Metrics labels
- `CompetitorTable.tsx` - Competitor comparison

### Files Changed

| File | Change Type | Reason |
|------|-------------|--------|
| `src/components/Analysis/AnalysisResults.tsx` | Modified | keyword → query |
| `src/components/Analysis/MetricsBreakdown.tsx` | Modified | keyword → query |
| `src/components/Dashboard/CompetitorTable.tsx` | Modified | keyword → query |

### Testing Performed

- Visual verification of UI text
- Build verification

### Related Issues

- Product pivot: SEO → AEO
- Branding consistency

---

## 2026-01-02: Update algorithm to use questions instead of keywords

**Commit:** `ffce1f6` - Update algorithm to use questions instead of keywords

### Context

The core product pivot from SEO to AEO required fundamental changes to how analysis works. Traditional SEO checks for keyword presence; AEO checks if AI assistants cite a website when asked questions. This commit implements the new prompt-based analysis system.

### Changes & Reasoning

#### 1. New Analysis Input Model (`src/components/Analysis/NewAnalysis.tsx`)

**Problem:** Users entered "keywords" which made sense for SEO but not for AEO.

**Solution:** Changed input model:
- **Before:** Enter keywords like "best coffee maker"
- **After:** Enter questions/prompts like "What's the best coffee maker for home use?"

Users now enter the actual questions they want their website to appear for in AI responses.

#### 2. Check Citations Edge Function (`supabase/functions/check-citations/index.ts`)

**Problem:** Need to query actual AI providers to check if a website gets cited.

**Solution:** Created new Edge Function that:
- Takes a list of prompts and target website
- Queries multiple AI providers (OpenAI, Anthropic, Perplexity)
- Checks if responses mention/cite the target website
- Returns citation status per prompt per provider

**Why Edge Function:** API keys for AI providers must be server-side.

#### 3. Analysis Engine Updates (`src/utils/analysisEngine.ts`)

**Problem:** Engine was built for keyword analysis, not prompt-based citation checking.

**Solution:** Major refactor:
- New `analyzeAEO()` function for prompt-based analysis
- Integration with check-citations Edge Function
- Maintains simulated mode for trial users (returns plausible fake data)
- Real mode for paid users (actual API calls)

#### 4. Type System Updates (`src/types/index.ts`)

**Problem:** Types reflected keyword-based model.

**Solution:** Added new types:
- `PromptResult` - Citation result per prompt
- `ProviderResult` - Result from specific AI provider
- `AEOAnalysis` - Full analysis structure

#### 5. Progress UI Updates (`src/components/Analysis/AnalysisProgress.tsx`)

**Problem:** Progress indicators showed keyword-based steps.

**Solution:** Updated to show AEO-relevant steps:
- "Querying AI providers..."
- "Checking citations..."
- "Analyzing responses..."

### Files Changed

| File | Change Type | Reason |
|------|-------------|--------|
| `src/components/Analysis/NewAnalysis.tsx` | Modified | Questions input |
| `supabase/functions/check-citations/index.ts` | New | Query AI providers |
| `src/utils/analysisEngine.ts` | Modified | AEO analysis logic |
| `src/types/index.ts` | Modified | New AEO types |
| `src/components/Analysis/AnalysisProgress.tsx` | Modified | New progress steps |
| `src/components/Analysis/AnalysisResults.tsx` | Modified | Display citations |
| `src/utils/costTracker.ts` | Modified | Track AI API costs |

### Testing Performed

- Manual testing with real prompts
- Verified simulated mode returns plausible data
- Build verification

### Related Issues

- Product pivot: SEO → AEO core implementation
- This is the foundational commit for the new product direction

---

## 2026-01-02: Adjust highest tier limits

**Commit:** `7253d16` - Adjust highest tier limits

### Context

Enterprise tier originally had "unlimited" analyses, which is financially unsustainable when each analysis costs real money (AI API calls).

### Changes & Reasoning

#### 1. Remove "Unlimited" from Enterprise Tier

**Problem:** "Unlimited" analyses at a fixed price is a liability. One power user could bankrupt the service.

**Solution:** Changed enterprise tier from "unlimited" to 1,000 analyses/month.

**Why 1,000:** High enough to feel generous, low enough to be profitable at the price point.

#### 2. Files Updated

- `costTracker.ts` - Limit enforcement
- `planConfig.ts` - Plan definitions
- `analysisEngine.ts` - Limit checks
- `AccountPage.tsx` - Display limits
- `PlanFeatures.tsx` - Marketing copy

### Files Changed

| File | Change Type | Reason |
|------|-------------|--------|
| `src/utils/costTracker.ts` | Modified | Add 1000 limit |
| `src/utils/planConfig.ts` | Modified | Update tier definition |
| `src/utils/analysisEngine.ts` | Modified | Enforce limit |
| `src/components/Account/AccountPage.tsx` | Modified | Show limit |
| `src/components/UI/PlanFeatures.tsx` | Modified | Update copy |

### Testing Performed

- Verified limit displays correctly
- Build verification

### Related Issues

- Business sustainability: Cannot offer unlimited at fixed price

---

## 2026-01-02: Update metrics, resolve npm issues, create test suite

**Commit:** `1aa3dcd` - Update metrics, resolve npm issues, create test suite

### Context

Multiple issues needed addressing: metrics didn't align with industry standards (Jason Wade's AEO ebook), npm had dependency issues, and there was no test coverage for UI components or auth flows.

### Changes & Reasoning

#### 1. Update Metrics per Jason Wade Ebook

**Problem:** Original metrics were invented without industry reference.

**Solution:** Aligned metrics with Jason Wade's AEO ebook recommendations:
- Citation rate calculation
- Content structure scoring
- Schema.org presence weighting

**Why this matters:** Using industry-standard metrics makes the product more credible and results more actionable.

#### 2. Create Comprehensive Test Suite

**Problem:** No automated tests. Bugs were caught in production.

**Solution:** Created test files:
- `authService.test.ts` - 562 lines, auth flow tests
- `AuthPage.test.tsx` - 344 lines, login/logout UI tests
- `AnalysisForm.test.tsx` - 350 lines, form validation tests
- `UserDashboard.test.tsx` - 594 lines, admin panel tests

Added Vitest configuration (`vitest.config.ts`) and test setup (`src/test/setup.ts`).

#### 3. Resolve npm Issues

**Problem:** Dependency conflicts causing build failures.

**Solution:** Updated `package.json` and regenerated `package-lock.json` with compatible versions.

#### 4. Add Project Documentation

**Problem:** No documentation for AI assistants or developers.

**Solution:** Created:
- `CLAUDE.md` - AI assistant instructions
- `AI_COLLABORATION_RULES.md` - Collaboration guidelines
- `PRODUCT_ENGINEERING_ROADMAP.md` - Engineering phases
- `docs/ARCHITECTURE.md` - System design
- `docs/CODE_INVENTORY.md` - Code organization
- `docs/decisions/` - Architecture Decision Records (ADRs)

### Files Changed

| File | Change Type | Reason |
|------|-------------|--------|
| `src/services/authService.test.ts` | New | Auth tests |
| `src/components/Auth/AuthPage.test.tsx` | New | Login UI tests |
| `src/components/Analysis/AnalysisForm.test.tsx` | New | Form tests |
| `src/components/Admin/UserDashboard.test.tsx` | New | Admin tests |
| `vitest.config.ts` | New | Test config |
| `src/test/setup.ts` | New | Test setup |
| `CLAUDE.md` | New | AI instructions |
| `AI_COLLABORATION_RULES.md` | New | Collab rules |
| `docs/*.md` | New | Documentation |
| `package.json` | Modified | Fix deps |

### Testing Performed

- All new tests pass
- npm install succeeds
- Build verification

### Related Issues

- Testing: First test coverage for the project
- Documentation: Onboarding for AI assistants and developers

---

## 2026-01-01: Add multi-page crawling and Supabase storage

**Commit:** `fe28888` - Add multi-page crawling and Supabase storage

### Context

The crawler only analyzed a single page. Real websites have multiple pages, and analysis results were only stored in localStorage (lost on browser clear).

### Changes & Reasoning

#### 1. Multi-Page Crawling (`supabase/functions/crawl-website/index.ts`)

**Problem:** Single-page crawling misses most of a website's content.

**Solution:** Created comprehensive crawl-website Edge Function:
- Crawls homepage + linked pages (configurable depth)
- Respects robots.txt
- Rate limits to avoid overwhelming target servers
- Extracts: title, meta description, headings, paragraphs, schema.org, Open Graph
- Returns structured analysis per page

**Why Edge Function:** Server-side crawling avoids CORS issues and can handle sites that block client-side requests.

#### 2. Supabase Storage (`src/services/analysisService.ts`)

**Problem:** localStorage is unreliable—cleared on browser reset, not synced across devices.

**Solution:** Added Supabase storage:
- `saveAnalysis()` - Save to Supabase with localStorage fallback
- `getAnalyses()` - Fetch user's analyses from Supabase
- `getAnalysisById()` - Fetch specific analysis

**Fallback:** If Supabase fails, still saves to localStorage. Syncs when connection restored.

#### 3. Database Migration

**Problem:** Needed new columns for enhanced analysis data.

**Solution:** Created migration `20250730_add_analysis_columns.sql`:
- `crawl_data` - Raw crawl results (JSONB)
- `page_count` - Number of pages crawled
- `schema_detected` - Boolean for schema.org presence

#### 4. New Types (`src/types/crawl.ts`)

**Problem:** No types for crawl results.

**Solution:** Created comprehensive types:
- `CrawlResult` - Full crawl response
- `PageData` - Per-page extracted data
- `SchemaOrgData` - Structured data findings

#### 5. Enhanced Metrics Display (`src/components/Analysis/MetricsBreakdown.tsx`)

**Problem:** UI couldn't display multi-page results.

**Solution:** Updated MetricsBreakdown to show:
- Per-page scores
- Aggregate metrics across all pages
- Schema.org detection results

### Files Changed

| File | Change Type | Reason |
|------|-------------|--------|
| `supabase/functions/crawl-website/index.ts` | New | Multi-page crawler |
| `src/services/analysisService.ts` | Modified | Supabase storage |
| `src/types/crawl.ts` | New | Crawl types |
| `src/types/database.ts` | Modified | New columns |
| `src/components/Analysis/MetricsBreakdown.tsx` | Modified | Multi-page display |
| `migrations/20250730_add_analysis_columns.sql` | New | DB schema |

### Testing Performed

- Manual crawling of various websites
- Verified Supabase storage and retrieval
- Tested localStorage fallback
- Build verification

### Related Issues

- Feature: Multi-page analysis requested by users
- Reliability: Data persistence beyond localStorage

---

## 2025-09-18: Fix live mode issue and ensure test mode

**Commit:** `b3f4f3f` - Fix live mode issue and ensure test mode

### Context

Stripe was accidentally configured in live mode during development, risking real charges to test cards.

### Changes & Reasoning

#### 1. Fix Live Mode Detection (`src/utils/liveMode.ts`)

**Problem:** `isLiveMode()` function was returning true when it should return false.

**Solution:** Fixed logic to correctly detect environment:
- Development → always test mode
- Production → check for live keys

#### 2. Ensure Test Keys in Development (`src/utils/stripeUtils.ts`)

**Problem:** Code was using `pk_live_*` keys in development.

**Solution:** Added explicit check:
```typescript
const key = import.meta.env.DEV
  ? import.meta.env.VITE_STRIPE_TEST_KEY
  : import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
```

#### 3. CreditCardForm Safety (`src/components/Payment/CreditCardForm.tsx`)

**Problem:** Form would submit to live Stripe in development.

**Solution:** Added development mode warning and double-check before submission.

### Files Changed

| File | Change Type | Reason |
|------|-------------|--------|
| `src/utils/liveMode.ts` | Modified | Fix detection logic |
| `src/utils/stripeUtils.ts` | Modified | Force test keys in dev |
| `src/components/Payment/CreditCardForm.tsx` | Modified | Add safety checks |

### Testing Performed

- Verified test mode in development
- Confirmed no live API calls in dev environment
- Build verification

### Related Issues

- Critical: Prevent accidental live charges during development

---

## 2025-09-18: Fix missing handleCheckoutCancel function

**Commit:** `7228860` - Fix missing handleCheckoutCancel function

### Context

After adding the pricing page, clicking "Cancel" during checkout caused a crash because the handler function was missing.

### Changes & Reasoning

#### 1. Add Missing Handler (`src/components/Subscription/PricingTiers.tsx`)

**Problem:** `handleCheckoutCancel` was referenced in JSX but never defined. Clicking cancel threw "handleCheckoutCancel is not a function".

**Solution:** Added the missing function:
```typescript
const handleCheckoutCancel = () => {
  setShowCheckout(false);
  setSelectedPlan(null);
};
```

**Why this was missed:** Likely copy-paste error or incomplete refactor from PricingPage to PricingTiers.

### Files Changed

| File | Change Type | Reason |
|------|-------------|--------|
| `src/components/Subscription/PricingTiers.tsx` | Modified | Add missing handler |

### Testing Performed

- Verified cancel button works
- Build verification

### Related Issues

- Bug: Checkout cancel button crashed the app

---

## 2025-09-18: Fix blank screen when clicking skip trial

**Commit:** `7c36bd8` - Fix blank screen when clicking skip trial

### Context

Users who clicked "Skip Trial" during signup saw a blank screen instead of being navigated to the dashboard.

### Changes & Reasoning

#### 1. Fix Navigation in TrialSignup (`src/components/Auth/TrialSignup.tsx`)

**Problem:** "Skip Trial" button called a function that didn't properly update state or navigate.

**Solution:** Fixed the skip trial flow:
- Properly set user state
- Navigate to dashboard using hash routing
- Clean up any intermediate state

#### 2. Remove Unused Import (`src/components/Subscription/PricingTiers.tsx`)

**Problem:** Unused import causing linter warning.

**Solution:** Removed unused import.

### Files Changed

| File | Change Type | Reason |
|------|-------------|--------|
| `src/components/Auth/TrialSignup.tsx` | Modified | Fix skip trial navigation |
| `src/components/Subscription/PricingTiers.tsx` | Modified | Remove unused import |

### Testing Performed

- Verified skip trial navigates to dashboard
- No blank screen
- Build verification

### Related Issues

- Bug: Blank screen on skip trial (broken user flow)

---

## 2025-09-18: Fix duplicate isAdmin declaration

**Commit:** `2a2cdb3` - Fix duplicate isAdmin declaration

### Context

TypeScript build was failing due to duplicate variable declaration.

### Changes & Reasoning

#### 1. Remove Duplicate Declaration (`src/App.tsx`)

**Problem:** `isAdmin` was declared twice in the same scope, causing TypeScript error:
```
error TS2451: Cannot redeclare block-scoped variable 'isAdmin'
```

**Solution:** Removed the duplicate declaration (2 lines).

**Why this happened:** Likely a merge conflict resolution that kept both versions, or copy-paste error during refactoring.

### Files Changed

| File | Change Type | Reason |
|------|-------------|--------|
| `src/App.tsx` | Modified | Remove duplicate variable |

### Testing Performed

- Build now succeeds
- TypeScript compilation passes

### Related Issues

- Build failure: Duplicate declaration error

---

## 2025-09-18: Clean up code redundancies and consolidate duplicate functionality

**Commit:** `d6ddf81` - Clean up code redundancies and consolidate duplicate functionality

### Context

Codebase had accumulated significant duplication and dead code. Multiple files implemented the same functionality, making maintenance difficult and increasing bug risk.

### Changes & Reasoning

#### 1. Create Consolidated Utility Files

**Problem:** Same logic scattered across multiple files.

**Solution:** Created focused utility files:
- `src/utils/paymentUtils.ts` - All payment-related helpers (131 lines)
- `src/utils/planConfig.ts` - Plan definitions and limits (93 lines)
- `src/utils/userUtils.ts` - User-related utilities (115 lines)

#### 2. Remove Duplicate/Dead Code

**Problem:** Multiple implementations of same functionality.

**Files removed or gutted:**
- `src/utils/manualSubscriptionFix.ts` - 213 lines deleted (one-time fix, no longer needed)
- `src/utils/stripeCheckoutService.ts` - 123 lines deleted (duplicated stripeUtils.ts)
- `src/lib/stripe.ts` - 3 lines removed (unused)

**Files simplified:**
- `src/utils/adminUtils.ts` - 151 → ~20 lines (moved to userUtils)
- `src/utils/authUtils.ts` - 72 → ~15 lines (moved to userUtils)
- `src/components/Pricing/PricingPage.tsx` - 409 → ~30 lines (uses PricingTiers now)

#### 3. Standardize Debug Components

**Problem:** 8 debug components each had their own Supabase initialization.

**Solution:** Updated all to use shared Supabase client from `src/lib/supabase.ts`:
- AutomaticWebhookFixer.tsx
- PaymentDebugger.tsx
- SubscriptionFixTool.tsx
- WebhookDebugger.tsx
- WebhookDeployer.tsx
- WebhookHelper.tsx
- WebhookManager.tsx
- WebhookSecretUpdater.tsx

#### 4. Consolidate PricingTiers

**Problem:** PricingPage and PricingTiers had overlapping functionality.

**Solution:** Made PricingPage a thin wrapper around PricingTiers. All logic lives in PricingTiers.

### Files Changed

| File | Change Type | Reason |
|------|-------------|--------|
| `src/utils/paymentUtils.ts` | New | Consolidated payment helpers |
| `src/utils/planConfig.ts` | New | Plan definitions |
| `src/utils/userUtils.ts` | New | User utilities |
| `src/utils/manualSubscriptionFix.ts` | Deleted | Dead code |
| `src/utils/stripeCheckoutService.ts` | Deleted | Duplicate |
| `src/utils/adminUtils.ts` | Modified | Simplified |
| `src/utils/authUtils.ts` | Modified | Simplified |
| `src/components/Pricing/PricingPage.tsx` | Modified | Now wrapper |
| `src/components/Debug/*.tsx` (8 files) | Modified | Use shared client |

### Testing Performed

- All existing functionality still works
- Build verification
- Manual testing of payment flows

### Related Issues

- Tech debt: Codebase was becoming unmaintainable
- Net reduction: 625 lines removed

---

## 2025-09-18: Add and integrate pricing page

**Commit:** `4a2a61e` - Add and integrate pricing page

### Context

The app needed a dedicated pricing page that users could access from the landing page to compare plans before signing up.

### Changes & Reasoning

#### 1. Create PricingPage Component (`src/components/Pricing/PricingPage.tsx`)

**Problem:** No standalone page for viewing pricing outside the checkout flow.

**Solution:** Created comprehensive PricingPage with:
- Three tier cards (Starter, Professional, Enterprise)
- Feature comparison
- "Get Started" buttons that navigate to signup
- FAQ section
- Professional styling matching landing page

**407 lines:** Includes all plan details, features, and styling.

#### 2. Add Route (`src/App.tsx`)

**Problem:** No route for pricing page.

**Solution:** Added hash route `#pricing` → PricingPage component.

#### 3. Link from Landing Page (`src/components/Landing/LandingPage.tsx`)

**Problem:** No way to navigate to pricing from landing.

**Solution:** Added "View Pricing" button in hero section and navigation.

### Files Changed

| File | Change Type | Reason |
|------|-------------|--------|
| `src/components/Pricing/PricingPage.tsx` | New | Pricing display |
| `src/App.tsx` | Modified | Add route |
| `src/components/Landing/LandingPage.tsx` | Modified | Add links |

### Testing Performed

- Verified pricing page displays correctly
- Navigation works from landing
- Responsive on mobile
- Build verification

### Related Issues

- Feature: Users want to see pricing before creating account

---

## Template for Future Entries

```markdown
## YYYY-MM-DD: Commit title

**Commit:** `Full commit message`

### Context
Why was this change needed? What problem did it solve?

### Changes & Reasoning
For each significant change:
- What was the problem?
- What solution was chosen?
- Why this approach over alternatives?

### Files Changed
| File | Change Type | Reason |
|------|-------------|--------|

### Testing Performed
What tests were run to verify the changes?

### Related Issues
Links to issues, bugs, or feature requests
```
