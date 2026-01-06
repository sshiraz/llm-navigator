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
└── delete-user/    # Admin deletion

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

### Adding a New Feature
1. Check if similar code exists in `src/utils/` or `src/services/`
2. Create types first in `src/types/index.ts`
3. Implement service layer if DB operations needed
4. Build UI component last
5. Run `npm run build` to verify no errors

### Fixing a Bug
1. Read the relevant file(s) first
2. Check for related tests in `*.test.ts` files
3. Fix the issue
4. Run tests: `npm run test:run`
5. Verify build: `npm run build`

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
