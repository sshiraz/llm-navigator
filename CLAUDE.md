# LLM Navigator - Project Context

> This file provides context for AI assistants working on this codebase.
> Read this FIRST before making any changes.

## What This Project Is

LLM Navigator is a SaaS platform that analyzes websites for **AI search discoverability** - how well content is optimized to be cited by AI assistants like ChatGPT, Claude, and Perplexity.

**Core Value Proposition:** Help websites get discovered when users ask AI assistants questions.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL + Auth) |
| Backend | Supabase Edge Functions (Deno) |
| Payments | Stripe |
| Deployment | Netlify |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│  App.tsx → Routes to components based on URL hash                │
│  Components organized by feature (Analysis/, Payment/, etc.)     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SERVICES LAYER                               │
│  src/services/*Service.ts - Database operations via Supabase     │
│  src/utils/*.ts - Business logic, calculations, helpers          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SUPABASE EDGE FUNCTIONS                        │
│  supabase/functions/crawl-website/ - Real website crawling       │
│  supabase/functions/stripe-webhook/ - Payment webhooks           │
│  supabase/functions/create-subscription/ - Subscription creation │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SUPABASE DATABASE                            │
│  users, projects, analyses, api_usage, fraud_checks              │
└─────────────────────────────────────────────────────────────────┘
```

## Key Files You Need to Know

### Analysis Flow (Core Feature)
```
src/components/Analysis/NewAnalysis.tsx    → User input form
src/components/Analysis/AnalysisProgress.tsx → Loading/progress UI
src/utils/analysisEngine.ts                → MAIN LOGIC - routes to real/simulated analysis
supabase/functions/crawl-website/index.ts  → Real website crawling (Deno)
src/types/crawl.ts                         → Types for crawl results
```

### Payment Flow
```
src/components/Subscription/PricingTiers.tsx → Plan selection
src/utils/stripeUtils.ts                     → Stripe API calls
supabase/functions/create-subscription/      → Creates Stripe subscription
supabase/functions/stripe-webhook/           → Handles payment events
src/services/paymentService.ts               → Payment database operations
```

### Data Storage
```
src/lib/supabase.ts          → Supabase client initialization
src/services/*Service.ts     → Database CRUD operations
localStorage                 → Currently used for analysis results (migration needed)
```

## Critical Patterns & Conventions

### 1. Real vs Simulated Analysis
```typescript
// In analysisEngine.ts
if (user.subscription in ['starter', 'professional', 'enterprise'] || user.isAdmin) {
  // REAL analysis - calls edge function, returns actual data
} else {
  // SIMULATED analysis - returns plausible fake data for trial users
}
```

### 2. Edge Function Structure
All edge functions follow this pattern:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  // ... handle request
});
```

### 3. Type Definitions
- All types in `src/types/index.ts` and `src/types/crawl.ts`
- Database types in `src/types/database.ts`
- Always add new types to appropriate file, don't create new type files without reason

### 4. Service Layer Pattern
```typescript
// Services handle Supabase operations
// Utils handle business logic
// Components handle UI only

// GOOD: Service calls Supabase
AnalysisService.createAnalysis(data)

// GOOD: Util handles business logic
AnalysisEngine.analyzeWebsite(url, keywords, user)

// BAD: Component directly calls Supabase
supabase.from('analyses').insert(...)  // Don't do this in components
```

## What NOT To Do

### ❌ Don't Duplicate Code
Before creating a new utility function, check:
- `src/utils/` - Does a similar function exist?
- `src/services/` - Is there already a service for this entity?

### ❌ Don't Add Random Dependencies
Check `package.json` before adding new packages. We likely already have what you need.

### ❌ Don't Mix Concerns
- Components: UI rendering only
- Services: Database operations only
- Utils: Business logic only

### ❌ Don't Ignore the Simulated/Real Split
Trial users get simulated data. Paid users get real data. This is intentional for cost control.

### ❌ Don't Hardcode Supabase URLs
Always use: `import.meta.env.VITE_SUPABASE_URL`

### ❌ Don't Skip Error Handling in Edge Functions
Edge functions should always return proper JSON errors, never throw unhandled.

## Current State & Known Issues

### Working
- ✅ Real website crawling via edge function
- ✅ Schema.org detection
- ✅ BLUF (Bottom Line Up Front) analysis
- ✅ Simulated analysis for trial users
- ✅ Stripe integration (test mode)

### Needs Work
- ⚠️ Analysis results stored in localStorage (should migrate to Supabase)
- ⚠️ LLM citation checking not yet implemented (future feature)
- ⚠️ Competitor comparison uses mock data

### Technical Debt
- Multiple payment-related debug components in `src/components/Debug/`
- Some services have Supabase methods that aren't actively used

## Testing a Change

1. **Build check:** `npm run build` - Must pass with no errors
2. **Type check:** Build will catch type errors
3. **Manual test:** Run `npm run dev` and test the affected feature

## Environment Variables

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

## Deployment

- **Frontend:** Netlify (auto-deploys from main branch)
- **Edge Functions:** `npx supabase functions deploy <function-name>`

## Questions to Ask Before Making Changes

1. Does this feature already exist somewhere?
2. What files will this change affect?
3. Does this follow the service/util/component pattern?
4. Will this work for both trial (simulated) and paid (real) users?
5. Have I updated the types if adding new data structures?
