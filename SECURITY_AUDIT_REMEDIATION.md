# Security Audit Remediation Plan

> Last updated: 2026-01-17
> Status: IN PROGRESS

---

## Executive Summary

Security audit performed on 2026-01-17 identified vulnerabilities across Edge Functions, frontend components, and authentication flows.

| Severity | Count | Fixed |
|----------|-------|-------|
| 🔴 Critical | 1 | ✅ |
| 🟠 High | 6 | 5/6 ⚠️ |
| 🟡 Medium | 5 | ❌ |
| 🟢 Low | 5 | ❌ |

---

## 🔴 CRITICAL - Immediate Action Required

### 1. Stripe Webhook Test Bypass
**File:** `supabase/functions/stripe-webhook/index.ts:76-91, 221-239`
**Status:** ✅ Fixed (2026-01-17)

**The Problem:**
```typescript
if (req.headers.get("x-test-request") === "true") {
  console.log("Test request detected, proceeding without signature verification");
}
```

**Exploit:**
```bash
curl -X POST https://xxx.supabase.co/functions/v1/stripe-webhook \
  -H "x-test-request: true" \
  -H "Content-Type: application/json" \
  -d '{"type":"checkout.session.completed","data":{"object":{"metadata":{"userId":"ANY-USER-ID","plan":"enterprise"}}}}'
```

**Impact:** Any attacker can grant themselves (or any user) enterprise subscription for free.

**Fix:** Remove test bypass entirely, or gate behind secure environment variable that is NEVER set in production:
```typescript
const ALLOW_TEST_BYPASS = Deno.env.get("ALLOW_WEBHOOK_TEST_BYPASS") === "true" &&
                          Deno.env.get("ENVIRONMENT") === "development";
```

---

## 🟠 HIGH Severity

### 2. Webhook Helper - No Authentication
**File:** `supabase/functions/webhook-helper/index.ts:57-105`
**Status:** ✅ Fixed (2026-01-17)

**The Problem:** The `fix_subscription` action allows modifying any user's subscription without ANY authentication. Only validates CORS origin.

**Exploit:**
```bash
curl -X POST https://xxx.supabase.co/functions/v1/webhook-helper \
  -H "Origin: http://localhost:5173" \
  -H "Content-Type: application/json" \
  -d '{"action":"fix_subscription","userId":"any-user-id","plan":"enterprise"}'
```

**Fix Applied:** Added `verifyAdmin()` function that:
1. Extracts JWT token from Authorization header
2. Verifies token with Supabase Auth
3. Checks `is_admin` flag in users table
4. Logs all admin actions to audit_logs table

---

### 3. Cancel Subscription - IDOR (Insecure Direct Object Reference)
**File:** `supabase/functions/cancel-subscription/index.ts:20-21, 50-54`
**Status:** ✅ Fixed (2026-01-17)

**The Problem:** Accepts `userId` from request body without verifying the caller is the actual user or an admin.

**Fix Applied:** Uses `verifyUserFromJwt()` to extract user ID from authenticated JWT. Users can only cancel their own subscription.

---

### 4. Create Subscription - No Auth Verification
**File:** `supabase/functions/create-subscription/index.ts:18-64`
**Status:** ✅ Fixed (2026-01-17)

**The Problem:** Accepts `userId`, `email`, `plan`, `priceId`, `paymentMethodId` without verifying caller is authorized.

**Fix Applied:** Uses `verifyUserFromJwt()` to extract user ID and email from authenticated JWT. Cannot create subscriptions for other users.

---

### 5. Admin Reset Password - Self-Reported Admin ID
**File:** `supabase/functions/admin-reset-password/index.ts:19, 62-82`
**Status:** ✅ Fixed (2026-01-17)

**The Problem:** Admin verification relies on self-reported `adminUserId` from request body, not from authenticated session.

**Fix Applied:** Uses `verifyAdminFromJwt()` to verify admin identity from JWT token. Admin ID is extracted from verified token, not request body.

---

### 6. Delete User - Self-Reported Admin ID
**File:** `supabase/functions/delete-user/index.ts:19, 54-75`
**Status:** ✅ Fixed (2026-01-17)

**The Problem:** Same as admin-reset-password - relies on self-reported `adminUserId`.

**Fix Applied:** Uses `verifyAdminFromJwt()` to verify admin identity from JWT token. Admin ID is extracted from verified token, not request body.

---

### 7. Sensitive Data in LocalStorage
**Files:**
- `src/components/Auth/AuthPage.tsx:109`
- `src/components/Auth/TrialSignup.tsx:64`
- `src/utils/userUtils.ts:23, 39, 58`
**Status:** ⚠️ Accepted Risk (2026-01-17)

**The Problem:** User objects with email, subscription status, Stripe subscription ID, and admin status stored in localStorage - accessible to any XSS attack.

**Risk Acceptance Rationale:**
- App has comprehensive XSS protection via `sanitize.ts` (115 tests)
- No passwords or payment card data stored
- `is_admin` flag is verified server-side via RLS
- Would require significant refactoring to change

---

## 🟡 MEDIUM Severity

### 8. CORS - Overly Permissive Subdomain Matching
**File:** `supabase/functions/_shared/cors.ts:21-24`
**Status:** ❌ Not Fixed

**The Problem:**
```typescript
return ALLOWED_ORIGINS.some(allowed =>
  origin === allowed || origin.endsWith('.netlify.app')
);
```

**Fix:** Only allow specific Netlify subdomain (`lucent-elf-359aef.netlify.app`).

---

### 9. Create Payment Intent - Missing Amount Validation
**File:** `supabase/functions/create-payment-intent/index.ts:17-33`
**Status:** ❌ Not Fixed

**The Problem:** Accepts `amount`, `currency`, `metadata` directly from user without validation.

**Fix:** Validate amount matches expected plan prices.

---

### 10. Potential Open Redirect
**File:** `src/components/Analysis/MetricsBreakdown.tsx:673-678`
**Status:** ❌ Not Fixed

**The Problem:**
```typescript
window.open(url, '_blank');  // url from analysis results, not validated
```

**Fix:** Use `sanitizeUrl()` before `window.open()`.

---

### 11. Delete Account Uses Permissive CORS
**File:** `supabase/functions/delete-account/index.ts:4-7`
**Status:** ❌ Not Fixed

**The Problem:** Uses `Access-Control-Allow-Origin: *` instead of shared CORS utility.

**Fix:** Use shared CORS utility with origin validation.

---

### 12. Payment Logs in LocalStorage
**File:** `src/utils/paymentLogger.ts:53`
**Status:** ❌ Not Fixed

**The Problem:** Payment debugging logs stored in localStorage.

**Fix:** Disable in production or use server-side logging.

---

## 🟢 LOW Severity

### 13. Missing Sanitization in Account Profile Update
**File:** `src/components/Account/AccountPage.tsx:378-412`
**Status:** ❌ Not Fixed

**Fix:** Apply `sanitizeText()` for name, `sanitizeUrl()` for logo URL.

---

### 14. Missing Sanitization in Payment Form
**File:** `src/components/Payment/CreditCardForm.tsx:35-50`
**Status:** ❌ Not Fixed

**Fix:** Apply `sanitizeText()` to card name field.

---

### 15. URL Parameter Encoding
**File:** `src/components/Subscription/StripeRedirectCheckout.tsx:95`
**Status:** ❌ Not Fixed

**Fix:** Use `encodeURIComponent()` for URL parameters.

---

### 16. Defense-in-Depth: Sanitize Keywords in getCompetitorAnalyses
**File:** `src/services/analysisService.ts:214`
**Status:** ❌ Not Fixed

**Fix:** Add `sanitizeSearchQuery()` to keywords array (already safe via parameterization, but good hygiene).

---

### 17. Defense-in-Depth: Sanitize Emails in Audit Logs
**File:** `src/services/auditLogService.ts:271-280`
**Status:** ❌ Not Fixed

**Fix:** Sanitize email before interpolating into description string.

---

## Remediation Priority

### Phase 1: Critical (Today)
1. ✅ Remove test bypass in stripe-webhook (2026-01-17)
2. ✅ Add authentication to webhook-helper fix_subscription (2026-01-17)

### Phase 2: High (This Week)
3. ✅ Fix admin functions to use JWT, not request body (2026-01-17)
4. ✅ Add authorization to cancel-subscription (2026-01-17)
5. ✅ Add authorization to create-subscription (2026-01-17)
6. ⚠️ localStorage data storage - Accepted Risk (2026-01-17)

### Phase 3: Medium (Next Sprint)
7. ❌ Restrict CORS to exact subdomain
8. ❌ Add amount validation to payment intent
9. ❌ Fix open redirect in MetricsBreakdown
10. ❌ Standardize CORS in delete-account
11. ❌ Disable payment logging in production

### Phase 4: Low (Backlog)
12. ❌ Add sanitization to AccountPage profile
13. ❌ Add sanitization to CreditCardForm
14. ❌ URL encode parameters in StripeRedirectCheckout
15. ❌ Defense-in-depth sanitization improvements

---

## SQL Injection Assessment

**Status: ✅ SAFE**

No SQL injection vulnerabilities found. The codebase properly uses:
- Supabase query builder (auto-parameterized)
- Sanitization at UI layer via `sanitize.ts`
- URL validation in edge functions

---

## How to Update This Document

When fixing a vulnerability:
1. Change status from ❌ to ✅
2. Add date fixed in parentheses
3. Update the summary table counts
4. If deploying edge function changes, run: `npx supabase functions deploy <function-name>`
