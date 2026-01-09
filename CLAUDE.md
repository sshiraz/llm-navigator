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
├── cleanup-auth-user/ # Cleanup orphaned auth users on signup failure
└── create-user-profile/ # Create profile bypassing RLS (for email confirmation flow)

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
**Backend is COMPLETE** - queries ChatGPT, Claude, and Perplexity to check if websites get cited.

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
- `check-citations` edge function - fully working, queries 3 AI providers
- `analyzeAEO()` in analysisEngine.ts - orchestrates real/simulated flows
- Types defined: `CitationResult`, `AEOAnalysis`, `CompetitorCitation`
- UI shows summary stats (citation rate %) in AnalysisResults

**What's missing (UI/UX):**
- Detailed results page showing each prompt's AI response
- Citation context viewer (what exactly AI said about the site)
- Historical trends (citation rate over time)
- Per-provider breakdown in results

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
