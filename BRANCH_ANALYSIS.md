# Branch Analysis & Explainer Log

> This document tracks significant changes, their reasoning, and test results.
> Archive: `BRANCH_ANALYSIS_2025-09_to_2026-01.md` (Sep 2025 - Jan 2026)

---

## 2026-01-18: Fix Stripe Customer Name and Payment Method Storage

**Commit:** `Fix Stripe customer name and payment method storage for recurring billing`

### Context

After testing live payments, two issues were identified in the Stripe dashboard:
1. Customer name from the card form wasn't being saved to the Stripe Customer
2. Payment methods weren't being saved for future recurring charges (column showed empty)

### Root Cause

1. **Name issue:** The edge function created Stripe Customers with only email, ignoring the cardholder name entered in the payment form
2. **Payment method issue:** PaymentIntent was created without `setup_future_usage`, so the card wasn't saved to the customer for future billing

### Changes & Reasoning

#### 1. PaymentService (`src/services/paymentService.ts`)

Added optional `customerName` parameter to `createPaymentIntent()`:

```typescript
static async createPaymentIntent(
  userId: string,
  plan: string,
  email: string,
  customerName?: string  // NEW
): Promise<...>
```

Passes `customerName` in metadata to edge function.

#### 2. CreditCardForm (`src/components/Payment/CreditCardForm.tsx`)

Now passes `cardName` (cardholder name) to PaymentService:

```typescript
const result = await PaymentService.createPaymentIntent(
  userId,
  plan,
  userEmail,
  cardName // Pass cardholder name for Stripe customer
);
```

#### 3. Edge Function (`supabase/functions/create-payment-intent/index.ts`)

Two fixes:

**A. Customer name handling:**
- Extract `customerName` from metadata
- Pass name when creating new customer: `name: customerName || undefined`
- Update existing customer's name if different

**B. Save payment method for recurring:**
```typescript
const paymentIntent = await stripe.paymentIntents.create({
  // ...existing params
  setup_future_usage: 'off_session', // NEW - saves card for future charges
});
```

### Files Changed

| File | Change |
|------|--------|
| `src/services/paymentService.ts` | Add `customerName` parameter |
| `src/components/Payment/CreditCardForm.tsx` | Pass `cardName` to service |
| `supabase/functions/create-payment-intent/index.ts` | Save customer name + payment method |

### Testing Performed

```
npm run test:run && npm run build

Test Files  18 passed (18)
     Tests  577 passed (577)
  Duration  16.73s
```

Build: Passes

### Deployment

- Edge function deployed: `npx supabase functions deploy create-payment-intent`
- Frontend: Push triggers Netlify deploy

### Result

Future payments will show in Stripe dashboard:
- Customer name (from card form)
- Email address
- Saved payment method (for recurring billing)

---

## 2026-01-18: Fix 403 Error on Payment Record Insert

**Commit:** `Remove redundant frontend payment INSERT - webhook handles it`

### Context

After a successful payment, the console showed:
```
[Database] [LIVE] INSERT payment record on payments - Failed
Failed to load resource: the server responded with a status of 403 ()
[Database] [LIVE] INSERT payment record on payments - Success
```

The payment succeeded, but there was a 403 error followed by success. Investigation revealed the frontend was trying to INSERT into `payments` table, which was blocked by RLS.

### Root Cause

The `payments` table RLS policies only allow:
- **SELECT** for authenticated users (read own payments)
- **ALL** for service_role only

There was **no INSERT policy for authenticated users**. The frontend INSERT failed (403), but the Stripe webhook (using service_role) succeeded - creating duplicate attempts.

### Solution

Removed the redundant frontend INSERT from `handlePaymentSuccess()`. The Stripe webhook already handles payment recording with proper service_role credentials.

**Before:**
```
Frontend: UPDATE users (subscription) ✓
Frontend: INSERT payments ✗ (403 - no RLS policy)
Webhook:  INSERT payments ✓ (service_role)
```

**After:**
```
Frontend: UPDATE users (subscription) ✓
Webhook:  INSERT payments ✓ (service_role)
```

### Why This Approach

Two options were considered:
1. Add INSERT policy for authenticated users
2. Remove frontend INSERT (let webhook handle it)

**Chose option 2** because:
- Single source of truth (webhook only)
- No duplicate insert attempts
- Service role is more secure for payment records
- Webhook is the canonical source for Stripe events

### Files Changed

| File | Change |
|------|--------|
| `src/services/paymentService.ts` | Remove INSERT into `payments` from `handlePaymentSuccess()` |

### Testing Performed

```
npm run test:run && npm run build

Test Files  18 passed (18)
     Tests  577 passed (577)
  Duration  16.38s
```

Build: Passes

### Data Flow Clarification

| Data | Table | Updated By | Persists Across Logins |
|------|-------|------------|------------------------|
| Subscription level | `users` | Frontend | Yes |
| Payment history | `payments` | Webhook | Yes |

The subscription is stored in `users` table and fetched fresh on every login via `AuthService.getCurrentSession()`.

---

## 2026-01-18: Add SEO Files (sitemap.xml, robots.txt)

**Commit:** `Add sitemap.xml and robots.txt for SEO`

### Context

Adding standard SEO files to improve search engine discoverability for the public-facing pages.

### Files Added

| File | Purpose |
|------|---------|
| `public/sitemap.xml` | Lists public pages for search engine crawlers |
| `public/robots.txt` | Allows all crawlers, references sitemap |

### Sitemap Contents

| URL | Priority |
|-----|----------|
| `/` (landing) | 1.0 |
| `/free-report` | 0.9 |
| `/pricing` | 0.9 |
| `/login` | default |
| `/signup` | default |
| `/privacy` | default |
| `/terms` | default |

### Testing Performed

```
npm run test:run

Test Files  18 passed (18)
     Tests  577 passed (577)
  Duration  16.48s
```

Build: Static files in `public/` are served as-is by Netlify.

---

## 2026-01-18: Fix Email CTA Link to Use Custom Domain

**Commit:** `Fix free report email CTA to use llmsearchinsight.com`

### Context

The free report email "Start Free Trial" button was linking to the old Netlify subdomain (`lucent-elf-359aef.netlify.app`) instead of the custom domain (`llmsearchinsight.com`).

### Changes

| File | Change |
|------|--------|
| `supabase/functions/send-free-report-email/index.ts` | Update CTA href to `https://llmsearchinsight.com/#auth` |
| `README.md` | Update deployment URL to custom domain |
| `ARCHITECTURE.md` | Update deployment URL to custom domain |

### Deployment Required

```bash
npx supabase functions deploy send-free-report-email
```

### Testing Performed

```
npm run test:run

Test Files  18 passed (18)
     Tests  577 passed (577)
  Duration  16.63s
```

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
Links to issues, bugs, feature requests
```
