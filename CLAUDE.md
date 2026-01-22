# LLM Navigator

AEO (Answer Engine Optimization) SaaS platform - helps websites get cited by AI assistants (ChatGPT, Claude, Perplexity).

## Tech Stack

React 18 + TypeScript + Vite | Tailwind CSS | Supabase (PostgreSQL + Edge Functions) | Stripe | Netlify

## Project Structure

```
src/
├── components/     # React UI (by feature: Analysis/, Payment/, Admin/)
├── services/       # Supabase CRUD operations (*Service.ts)
├── utils/          # Business logic (analysisEngine.ts, costTracker.ts)
├── types/          # TypeScript interfaces
└── lib/            # Supabase client

supabase/functions/ # Edge Functions (Deno)
├── _shared/        # CORS utilities
├── check-citations/# Query AI providers
├── crawl-website/  # Website analysis
├── stripe-webhook/ # Payment events
├── delete-user/    # Admin deletion
├── delete-account/ # User self-deletion (GDPR)
├── cleanup-data/   # Admin data retention cleanup
├── cleanup-auth-user/ # Cleanup orphaned auth users on signup failure
├── create-user-profile/ # Create profile bypassing RLS (for email confirmation flow)
└── send-free-report-email/ # Send free report via Resend

scripts/            # Test scripts
```

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production

# Testing
npm run test             # Unit tests (watch)
npm run test:functions   # Edge Function tests
npm run test:payment     # Stripe flow tests

# Deployment
npx supabase functions deploy <function-name>
```

## Collaboration Rules

**Work incrementally** - Small, reviewable changes. No massive code dumps.

**Before implementing, clarify:**
- What modules will this affect?
- Any DB/schema changes?
- Any subscription or billing logic implications?

**Ask permission before:**
- Routing/navigation changes
- Database schema changes
- Multi-file refactors
- Breaking existing integrations

**Never bypass:**
- Row Level Security (RLS)
- Subscription gating (trial vs paid)
- Stripe payment handling
- Cost controls (real vs simulated)

## Standard Workflows

### Before Every Commit
**REQUIRED:** Run the full test suite and document results in BRANCH_ANALYSIS.md.

```bash
npm run test:run && npm run build
```

**⚠️ ALL TESTS MUST PASS (0 failures) before a commit is ready to merge.**

If tests fail:
1. Fix the failing tests or the code causing failures
2. Re-run until you get 0 failures
3. Only then document results and commit

Include in the "Testing Performed" section of your BRANCH_ANALYSIS.md entry:
```markdown
### Testing Performed

- **Test Suite:** ✅ X passed, 0 failed (X total)
- **Build:** ✓ Passed
- [List any manual testing performed]
```

Example:
```markdown
### Testing Performed

- **Test Suite:** ✅ 228 passed, 0 failed (228 total)
- **Build:** ✓ Passed
- Verified payment flow works with test card
- Checked analysis results render correctly
```

### Adding a New Feature
1. Check if similar code exists in `src/utils/` or `src/services/`
2. Create types first in `src/types/index.ts`
3. Implement service layer if DB operations needed
4. Build UI component last
5. Run `npm run test:run && npm run build` to verify no errors
6. Document in BRANCH_ANALYSIS.md with test results

### Fixing a Bug
1. Read the relevant file(s) first
2. Check for related tests in `*.test.ts` files
3. Fix the issue
4. Run tests: `npm run test:run`
5. Verify build: `npm run build`
6. Document in BRANCH_ANALYSIS.md with test results

### Adding an Edge Function
1. Create folder in `supabase/functions/<name>/`
2. Import CORS from `../_shared/cors.ts`
3. Follow pattern: preflight → origin validation → handle request
4. Deploy: `npx supabase functions deploy <name>`
5. Add test to `scripts/test-edge-functions.ts`

### Modifying Payments
1. Use Stripe test mode (`sk_test_*`, `pk_test_*`)
2. Test with card: `4242 4242 4242 4242`
3. Check webhook handling in `stripe-webhook/index.ts`
4. Run: `npm run test:payment`

### Test vs Live Mode (Auto-Detection)
The app auto-detects Test or Live mode based on the Stripe key prefix:

| Environment | Key Prefix | Mode | Real Charges? |
|-------------|-----------|------|---------------|
| Localhost | `pk_test_*` | Test | No |
| Production | `pk_live_*` | Live | Yes |

**How it works:**
```typescript
// src/utils/liveMode.ts
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
export const isLiveMode = stripeKey.startsWith('pk_live_');
```

**Setup:**
- Local `.env`: `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...`
- Netlify env vars: `VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...`

The UI shows:
- **Test Mode**: Yellow badge, no payment warnings
- **Live Mode**: Red warnings, "LIVE MODE ACTIVE" indicators

**Where to show indicators:**
- ✅ Admin dashboard (EnvironmentStatus component)
- ✅ Admin user management page
- ❌ Customer-facing pages (pricing, checkout) - don't show warnings to customers

### GDPR & Privacy Compliance

The app implements key GDPR and CCPA requirements:

| Feature | Location | Description |
|---------|----------|-------------|
| Cookie Consent | `CookieConsent.tsx` | Banner on first visit, stores preference in localStorage |
| Data Export | Account Settings | Download all user data as JSON (profile, analyses, projects) |
| Account Deletion | Account Settings | Self-service deletion with "DELETE" confirmation |
| Data Retention | `cleanup_sensitive_data()` | Auto-delete fraud data after 90 days, nullify IPs after 30 days |
| Data Processing Agreement | `#dpa` route | DPA page for B2B/Enterprise customers |

**Key files:**
- `src/components/Legal/CookieConsent.tsx` - Cookie consent banner
- `src/components/Legal/PrivacyPolicy.tsx` - Updated with GDPR rights
- `src/components/Legal/DataProcessingAgreement.tsx` - DPA for B2B customers
- `src/components/Account/AccountPage.tsx` - Export & delete features
- `supabase/functions/delete-account/` - User self-deletion edge function
- `supabase/functions/cleanup-data/` - Admin data cleanup edge function
- `supabase/migrations/20260116_security_fixes.sql` - RLS fixes + cleanup function

### Security Features

| Feature | Location | Description |
|---------|----------|-------------|
| Two-Factor Auth | `TwoFactorSetup.tsx` | TOTP-based 2FA via Supabase MFA |
| Audit Logging | `auditLogService.ts` | Track auth, admin, security events |
| Input Sanitization | `sanitize.ts` | XSS/SQL injection prevention |

**Key files:**
- `src/components/Account/TwoFactorSetup.tsx` - 2FA setup UI (QR code, verification)
- `src/services/auditLogService.ts` - Audit logging service (28 tests)
- `supabase/migrations/20260117_audit_logs.sql` - Audit logs table + RLS
- `src/utils/sanitize.ts` - Input sanitization utilities (115 tests)

**Audit events tracked:**
- `auth.login`, `auth.logout`, `auth.login_failed`, `auth.signup`
- `security.2fa_enable`, `security.2fa_disable`
- `data.export`, `data.delete_account`
- `admin.user_delete`, `admin.cleanup_data`

**Edge functions:**
- `delete-account` - Users delete their own account (verifies ownership)
- `cleanup-data` - Admin-only, triggers `cleanup_sensitive_data()` RPC
- `delete-user` - Admin deletes other users (different from self-deletion)

**Test coverage:**
- `src/components/Legal/CookieConsent.test.tsx` - Cookie consent banner tests
- `src/components/Legal/PrivacyPolicy.test.tsx` - Privacy policy GDPR sections
- `src/components/Account/AccountPage.gdpr.test.tsx` - Data export & account deletion

## Key Patterns

### Service/Util/Component Separation
```typescript
// Services → Supabase operations
AnalysisService.createAnalysis(data)

// Utils → Business logic
AnalysisEngine.analyzeWebsite(url, prompts, user)

// Components → UI only (never call Supabase directly)
```

### Real vs Simulated Analysis
```typescript
// Paid users → real API calls to AI providers
// Trial users → simulated data (cost control)
// Controlled by: AnalysisEngine.shouldUseRealAnalysis(user)
```

### Citation Checking (AEO Core Feature)
**Backend is COMPLETE** - queries ChatGPT, Claude, Perplexity, and Gemini to check if websites get cited.

```typescript
// Entry point: AnalysisEngine.analyzeAEO()
// Edge function: supabase/functions/check-citations/index.ts
// Types: CitationResult, AEOAnalysis, CompetitorCitation (in src/types/index.ts)

// Flow:
// 1. User enters prompts (questions) + website + brand name
// 2. Edge function queries AI providers with each prompt
// 3. Checks if response mentions user's website/brand
// 4. Returns: isCited, citationContext, competitorsCited
// 5. Calculates overall citation rate
```

**What exists:**
- `check-citations` edge function - fully working, queries 4 AI providers (OpenAI, Anthropic, Perplexity, Gemini)
- `analyzeAEO()` in analysisEngine.ts - orchestrates real/simulated flows
- Types defined: `CitationResult`, `AEOAnalysis`, `CompetitorCitation`
- UI shows summary stats (citation rate %) in AnalysisResults

**What's missing (UI/UX):**
- Detailed results page showing each prompt's AI response
- Citation context viewer (what exactly AI said about the site)
- Historical trends (citation rate over time)
- Per-provider breakdown in results

### AI Platform Readiness Analysis
Analyzes website's robots.txt for AI crawler rules and recommends platform registrations.

```typescript
// Entry point: crawl-website edge function
// Types: AIReadinessAnalysis, RobotsTxtAnalysis, AICrawlerRule (in src/types/crawl.ts)
// Component: AIReadinessSection.tsx

// Flow:
// 1. Crawl function fetches robots.txt from target website
// 2. Parses rules for 17 AI crawlers (search + training)
// 3. Detects e-commerce via Product schema
// 4. Generates platform recommendations
// 5. Returns overall status: good/warning/critical
```

**Crawlers checked:**
- Search (important): OAI-SearchBot, PerplexityBot, ChatGPT-User, Applebot-Extended
- Training (optional): GPTBot, ClaudeBot, Claude-Web, anthropic-ai, Google-Extended, etc.

**Platform recommendations:**
- ChatGPT Merchant Portal (e-commerce only)
- Bing Webmaster Tools (powers ChatGPT browsing)
- Google Search Console (powers Gemini)

**Key files:**
- `supabase/functions/crawl-website/index.ts` - `analyzeAIReadiness()` function
- `src/types/crawl.ts` - AIReadinessAnalysis types
- `src/components/Analysis/AIReadinessSection.tsx` - Display component

### User Data: Database vs localStorage
```typescript
// Supabase = Source of truth (subscriptions, profiles, auth)
// localStorage = Cache for performance (avoid API calls on page refresh)

// CORRECT: Update database FIRST, then sync localStorage
const result = await PaymentService.handlePaymentSuccess(userId, plan, paymentId);
localStorage.setItem('currentUser', JSON.stringify(updatedUser));

// WRONG: Only updating localStorage (data lost on re-login)
localStorage.setItem('currentUser', JSON.stringify(updatedUser)); // Don't do this alone!
```

**Flow:**
- Login/Signup → AuthService.signIn/signUp → Database updated → localStorage cached
- Payment/Upgrade → PaymentService.handlePaymentSuccess() → Database updated → localStorage synced
- Page Load → AuthService.getCurrentSession() → Supabase session checked → localStorage refreshed
- Logout → AuthService.signOut() → Supabase session cleared → localStorage cleared

### Email Verification Flow
New users must verify their email before logging in:

```
1. User signs up → AuthService.signUp() with emailRedirectTo
2. Supabase creates auth user but returns NO session (email unconfirmed)
3. create-user-profile edge function creates profile (bypasses RLS)
4. AuthPage shows "Check Your Email" screen
5. User clicks link in email → Redirects to /#email-confirmed
6. App.tsx detects hash → Shows "Email confirmed!" banner
7. User can now log in
```

**Why edge function for profile creation?**
When email confirmation is enabled, Supabase's `signUp()` returns NO session. Without a session, `auth.uid()` is NULL, so RLS policies block direct inserts to the `users` table. The `create-user-profile` edge function uses the service role key to bypass RLS.

**Key files:**
- `authService.ts` - signUp calls `create-user-profile` edge function, returns `requiresEmailConfirmation`
- `AuthPage.tsx` - Shows confirmation screen, resend email button, success banner
- `App.tsx` - Detects `#email-confirmed` hash, passes props to AuthPage
- `supabase/functions/create-user-profile/` - Creates profile with service role (bypasses RLS)

**Edge functions for auth flow:**
- `create-user-profile` - Creates profile when no session exists (email confirmation enabled)
- `cleanup-auth-user` - Deletes orphaned auth user if profile creation fails

**Handling orphaned records:**
Profile creation uses `upsert` with `onConflict: 'email'` to handle orphaned records from failed signups. If an email exists in `users` table but auth user was deleted, the upsert updates the record with the new auth user ID.

**Key files:**
- `AuthPage.tsx` - Uses AuthService for Supabase Auth (not localStorage)
- `App.tsx` - Loads user from Supabase session on startup, handles checkout success
- `PricingTiers.tsx` / `StripeRedirectCheckout.tsx` - Call PaymentService on payment success
- `authService.ts` - signIn, signUp, signOut, getCurrentSession, changePassword
- `paymentService.ts` - handlePaymentSuccess updates subscription in DB

### Edge Function CORS Pattern
```typescript
import { getCorsHeaders, handleCorsPreflightWithValidation, validateOrigin } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const preflightResponse = handleCorsPreflightWithValidation(req);
  if (preflightResponse) return preflightResponse;
  const originError = validateOrigin(req);
  if (originError) return originError;
  // ... handle request
});
```

**Exception:** `stripe-webhook` skips origin validation - uses Stripe signature verification instead.

### Free Report (Lead Generation)

A free AI visibility report that serves as the primary lead generation tool.

**What users get (no signup required):**
- Real website crawl (title, meta, headings, schema detection)
- 5 real LLM queries against OpenAI (alternatives, best tools, how-to, comparisons, recommendations)
- Industry auto-detection from crawled content
- AI Visibility Score + Citation Rate
- Competitor intelligence (who's getting cited instead)
- Personalized action plan based on gaps
- Estimated missed traffic
- Professional email report via Resend

**Cost:** ~$0.07/report (5 OpenAI API calls)

**Abuse Prevention:**
| Check | Limit | Window |
|-------|-------|--------|
| Same email | 1 report | 24 hours |
| Same domain | 3 reports | 24 hours |

**Key files:**
- `src/components/FreeReport/FreeReportPage.tsx` - Main component with crawl + multi-query analysis
- `src/utils/industryDetector.ts` - Industry detection from domain/content keywords
- `supabase/functions/send-free-report-email/index.ts` - Email via Resend API
- Table: `free_report_leads` - Stores leads + abuse prevention checks

**Flow:**
```
1. User enters email + website
2. Abuse check → Query free_report_leads for recent entries
3. Crawl website → Extract title, meta, headings, schema
4. Detect industry → Score content against keyword lists
5. Generate 5 prompts → Based on brand name + industry
6. Query OpenAI → check-citations edge function
7. Calculate scores → Citation rate, AI visibility, missed traffic
8. Display results → Show comprehensive report
9. Save lead → Insert to free_report_leads (async)
10. Send email → send-free-report-email edge function (async)
```

**Rate Limiting:**
- 1 report per email per 24 hours
- 3 reports per website per 24 hours
- Whitelist bypass: `info@convologix.com` (unlimited)

**RLS:** Migration `20260119_create_free_report_leads.sql` creates table with policies for anonymous INSERT and SELECT.

## Don't

- **Delete or modify files without understanding their purpose** - Check [BRANCH_ANALYSIS.md](./BRANCH_ANALYSIS.md) for history. If unclear, ask before changing.
- **Duplicate code** - Check `src/utils/` and `src/services/` first
- **Mix concerns** - Components render UI, services talk to DB, utils hold logic
- **Skip the real/simulated split** - Trial = simulated, paid = real
- **Hardcode secrets** - Use `import.meta.env.VITE_*` or Supabase secrets
- **Throw unhandled errors in Edge Functions** - Always return JSON errors

## Key Files

| Purpose | File |
|---------|------|
| Analysis logic | `src/utils/analysisEngine.ts` |
| Plan limits | `src/utils/costTracker.ts` |
| Payment handling | `supabase/functions/stripe-webhook/index.ts` |
| CORS config | `supabase/functions/_shared/cors.ts` |
| Types | `src/types/index.ts` |
| Cookie consent | `src/components/Legal/CookieConsent.tsx` |
| Privacy policy | `src/components/Legal/PrivacyPolicy.tsx` |
| Account deletion | `supabase/functions/delete-account/index.ts` |
| Data cleanup | `supabase/functions/cleanup-data/index.ts` |
| Free report | `src/components/FreeReport/FreeReportPage.tsx` |
| Industry detector | `src/utils/industryDetector.ts` |
| Report email | `supabase/functions/send-free-report-email/index.ts` |

## Related Docs

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed system design
- [TESTING.md](./TESTING.md) - Complete test documentation
- [STRIPE_SETUP.md](./STRIPE_SETUP.md) - Payment configuration
- [BRANCH_ANALYSIS.md](./BRANCH_ANALYSIS.md) - Commit reasoning history

## Pre-Change Checklist

- [ ] Do I understand why this file/code exists? (Check BRANCH_ANALYSIS.md if unsure)
- [ ] Does this feature already exist?
- [ ] What files will this affect?
- [ ] Does it follow service/util/component pattern?
- [ ] Works for both trial and paid users?
- [ ] Types updated if new data structures?
- [ ] Tests pass? (`npm run test:run && npm run build`)

## Pre-Commit Checklist (Ready to Merge)

- [ ] Run full test suite: `npm run test:run`
- [ ] **All tests pass (0 failures)** ← Required for merge
- [ ] Run build: `npm run build`
- [ ] Add entry to BRANCH_ANALYSIS.md with:
  - [ ] Context explaining the change
  - [ ] Reasoning for implementation decisions
  - [ ] Files changed table
  - [ ] Test results showing ✅ 0 failures
