# LLM Navigator Architecture

> Last updated: 2026-01-07

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Backend | Supabase Edge Functions (Deno) |
| Payments | Stripe (test + live mode) |
| Deployment | Netlify (https://lucent-elf-359aef.netlify.app) |

## Project Structure

```
llm-navigator/
├── src/
│   ├── components/
│   │   ├── Account/         # User profile, subscription management
│   │   ├── Admin/           # Admin dashboard, user management
│   │   ├── Analysis/        # NewAnalysis, AnalysisProgress, AnalysisResults
│   │   ├── Auth/            # Login/signup pages
│   │   ├── Contact/         # Contact page
│   │   ├── Dashboard/       # Main dashboard, project cards, score cards
│   │   ├── Database/        # Database utilities
│   │   ├── Debug/           # Payment debugger, test tools
│   │   ├── History/         # Analysis history
│   │   ├── Landing/         # Landing page
│   │   ├── Layout/          # Header, Sidebar
│   │   ├── Legal/           # Privacy policy, terms of service
│   │   ├── Payment/         # Credit card form, checkout
│   │   ├── Pricing/         # Pricing display
│   │   ├── Reports/         # PDF export, reports
│   │   ├── Subscription/    # PricingTiers, plan selection
│   │   └── UI/              # Shared UI components
│   │
│   ├── services/
│   │   ├── analysisService.ts  # Analysis CRUD
│   │   ├── authService.ts      # Auth operations + localStorage cleanup
│   │   ├── paymentService.ts   # Payment records (consolidated)
│   │   └── usageService.ts     # API usage tracking
│   │
│   ├── utils/
│   │   ├── analysisEngine.ts   # Core AEO orchestration
│   │   ├── analysis/           # Modularized analysis logic
│   │   │   ├── index.ts        # Re-exports all analysis modules
│   │   │   ├── aeoAnalysis.ts  # Simulated AEO analysis
│   │   │   ├── analysisHelpers.ts # Citation/URL helpers
│   │   │   ├── modelConfig.ts  # AI model configurations
│   │   │   └── recommendations.ts # Recommendation generation
│   │   ├── sanitize.ts         # Input sanitization (XSS, SQL injection prevention)
│   │   ├── storageManager.ts   # localStorage abstraction
│   │   ├── costTracker.ts      # Usage limits & costs
│   │   ├── stripeUtils.ts      # Stripe API helpers
│   │   └── fraudPrevention.ts  # Trial abuse prevention
│   │
│   ├── types/               # TypeScript interfaces
│   └── lib/
│       └── supabase.ts      # Supabase client
│
├── supabase/
│   └── functions/
│       ├── _shared/            # Shared utilities (CORS)
│       ├── cancel-subscription/# Cancel Stripe subscription
│       ├── check-citations/    # Queries AI providers
│       ├── crawl-website/      # Crawls & analyzes websites
│       ├── create-payment-intent/
│       ├── create-subscription/
│       ├── delete-user/        # Admin user deletion
│       ├── stripe-webhook/     # Payment webhooks
│       └── webhook-helper/     # Webhook utilities
│
├── scripts/
│   ├── test-payment-flow.ts    # Payment integration tests
│   └── test-edge-functions.ts  # Edge function tests
```

## Data Flow

```
User Input (prompts, website)
       ↓
NewAnalysis.tsx (UI form)
       ↓
AnalysisProgress.tsx (loading UI)
       ↓
AnalysisEngine.analyzeAEO()
       ↓
   ┌───┴───┐
   ↓       ↓
Real    Simulated
(paid)  (trial/free)
   ↓       ↓
Edge Functions → Fake data
   ↓
┌──┴──┐
↓     ↓
crawl-website    check-citations
(content analysis)  (AI queries)
       ↓
AnalysisService.saveAnalysis()
       ↓
Supabase DB + localStorage backup
       ↓
AnalysisResults.tsx (display)
```

## Key Design Decisions

### 1. Real vs Simulated Analysis
- Paid users → actual API calls to AI providers
- Trial/free users → realistic fake data (saves costs)
- Controlled by `AnalysisEngine.shouldUseRealAnalysis(user)`

### 2. Edge Functions
- Server-side API keys (secure, not exposed to client)
- No CORS issues
- Scales automatically with Supabase

### 3. localStorage Fallback
- If Supabase fails, data still saved locally
- Automatic sync when connection restored
- Better UX during network issues

### 4. Hash-based Routing
- Uses `window.location.hash` for navigation
- Simple implementation, no router library needed
- Supports browser back/forward buttons

## Key Files

### Core Logic
| File | Purpose |
|------|---------|
| `src/utils/analysisEngine.ts` | Core analysis orchestration |
| `src/utils/analysis/` | Modularized analysis logic (aeoAnalysis, helpers, recommendations) |
| `src/utils/sanitize.ts` | Input sanitization (XSS, SQL injection, URL validation) |
| `src/utils/storageManager.ts` | localStorage abstraction layer |
| `src/utils/costTracker.ts` | Usage limits, cost calculations |
| `src/utils/stripeUtils.ts` | Stripe checkout and subscription helpers |
| `src/utils/fraudPrevention.ts` | Trial abuse detection (email, fingerprint, IP) |

### Services
| File | Purpose |
|------|---------|
| `src/services/analysisService.ts` | Analysis CRUD + localStorage migration + historical trends |
| `src/services/authService.ts` | Auth operations + localStorage cleanup |
| `src/services/paymentService.ts` | Payment record management (consolidated) |
| `src/services/usageService.ts` | API usage tracking |

### Edge Functions
| File | Purpose |
|------|---------|
| `supabase/functions/_shared/cors.ts` | CORS origin whitelist |
| `supabase/functions/check-citations/index.ts` | Queries AI providers |
| `supabase/functions/crawl-website/index.ts` | Website content analysis |
| `supabase/functions/stripe-webhook/index.ts` | Payment event handling |
| `supabase/functions/delete-user/index.ts` | Admin user deletion (cascade) |

### Types & Config
| File | Purpose |
|------|---------|
| `src/types/index.ts` | Main TypeScript interfaces |
| `src/types/crawl.ts` | Crawl result types |
| `src/lib/supabase.ts` | Supabase client initialization |

## Environment Variables

### Frontend (.env)
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

### Edge Functions (Supabase Secrets)
```
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
PERPLEXITY_API_KEY=pplx-xxx
```

## Security

### CORS
- Origin whitelist in `supabase/functions/_shared/cors.ts`
- Allowed origins: Netlify production, localhost:5173, localhost:3000
- All Edge Functions validate origin (except stripe-webhook)

### Authentication
- Supabase Auth with JWT tokens
- Admin role via `is_admin` flag in users table
- Row Level Security (RLS) on all tables

### Stripe
- Webhook signature verification
- API keys stored as Supabase secrets (never in frontend)
- PCI compliant via Stripe Elements

## Testing

**All tests must pass (0 failures) before code is ready to merge.**

```bash
npm run test           # Unit tests (Vitest) - watch mode
npm run test:run       # Unit tests once (367 tests)
npm run test:functions # Edge Function tests
npm run test:payment   # Payment flow tests
```

See [TESTING.md](./TESTING.md) for full documentation.

## Deployment

- **Frontend**: Netlify (auto-deploys from main branch)
- **Edge Functions**: `npx supabase functions deploy <function-name>`
- **Database**: Managed by Supabase
