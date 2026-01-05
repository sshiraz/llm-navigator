# LLM Navigator - Project Context

> This file provides context for AI assistants working on this codebase.
> Read this FIRST before making any changes.

## What This Project Is

LLM Navigator is a SaaS platform for **Answer Engine Optimization (AEO)** - helping websites get cited by AI assistants like ChatGPT, Claude, and Perplexity.

**Core Value Proposition:** Enter natural language prompts, check if your website gets cited by AI assistants, see who your competitors are, and get recommendations to improve.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL + Auth) |
| Backend | Supabase Edge Functions (Deno) |
| Payments | Stripe |
| Deployment | Netlify |

## Subscription Plans

| Plan | Price | Analyses/Month | Features |
|------|-------|----------------|----------|
| Trial | Free | Unlimited (simulated) | 14 days, simulated data only |
| Starter | $29/mo | 10 | Real AI queries, email support |
| Professional | $99/mo | 50 | + Competitor strategy, priority support |
| Enterprise | $299/mo | 400 | + White-label, all AI models |

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
│  cancel-subscription/    - Cancel Stripe subscription            │
│  check-citations/        - Query AI providers for citations      │
│  crawl-website/          - Real website crawling                 │
│  create-payment-intent/  - Create Stripe payment intent          │
│  create-subscription/    - Create Stripe subscription            │
│  stripe-webhook/         - Handle Stripe webhook events          │
│  webhook-helper/         - Webhook utilities                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SUPABASE DATABASE                            │
│  users, projects, analyses, api_usage, payments, payment_logs    │
└─────────────────────────────────────────────────────────────────┘
```

## Key Files You Need to Know

### Analysis Flow (Core Feature)
```
src/components/Analysis/NewAnalysis.tsx      → User input (prompts + website)
src/components/Analysis/AnalysisProgress.tsx → Loading/progress UI
src/components/Analysis/AnalysisResults.tsx  → Citation results display
src/utils/analysisEngine.ts                  → MAIN LOGIC - routes to real/simulated
supabase/functions/crawl-website/index.ts    → Real website crawling (Deno)
supabase/functions/check-citations/index.ts  → Queries AI providers for citations
```

### Payment Flow
```
src/components/Subscription/PricingTiers.tsx → Plan selection + checkout
src/components/Payment/CreditCardForm.tsx    → Stripe Elements payment form
src/components/Account/AccountPage.tsx       → Subscription management + cancellation
src/utils/stripeUtils.ts                     → Stripe API calls
supabase/functions/create-subscription/      → Creates Stripe subscription
supabase/functions/cancel-subscription/      → Cancels subscription at period end
supabase/functions/stripe-webhook/           → Handles payment events
```

### User Management
```
src/components/Auth/AuthPage.tsx             → Login/signup
src/components/Account/AccountPage.tsx       → Profile + subscription management
src/components/Admin/UserDashboard.tsx       → Admin user management
```

### Data Storage
```
src/lib/supabase.ts          → Supabase client initialization
src/services/*Service.ts     → Database CRUD operations
src/utils/costTracker.ts     → Plan limits and usage tracking
```

## Critical Patterns & Conventions

### 1. Real vs Simulated Analysis
```typescript
// In analysisEngine.ts
if (user.subscription in ['starter', 'professional', 'enterprise'] || user.isAdmin) {
  // REAL analysis - calls edge functions, queries actual AI providers
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
- User type includes subscription management fields:
  ```typescript
  interface User {
    subscription: 'free' | 'trial' | 'starter' | 'professional' | 'enterprise';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    cancelAtPeriodEnd?: boolean;
    subscriptionEndsAt?: string;
  }
  ```

### 4. Service Layer Pattern
```typescript
// Services handle Supabase operations
// Utils handle business logic
// Components handle UI only

// GOOD: Service calls Supabase
AnalysisService.createAnalysis(data)

// GOOD: Util handles business logic
AnalysisEngine.analyzeWebsite(url, prompts, user)

// BAD: Component directly calls Supabase
supabase.from('analyses').insert(...)  // Don't do this in components
```

## Current Features (Working)

### Core AEO Features
- ✅ Prompt-based citation checking (enter prompts, see if you're cited)
- ✅ Real AI queries to Perplexity, OpenAI, Anthropic (paid users)
- ✅ Simulated analysis for trial users
- ✅ Website crawling with content analysis
- ✅ Schema.org detection
- ✅ BLUF (Bottom Line Up Front) scoring
- ✅ Competitor citation analysis
- ✅ AEO recommendations

### Subscription & Payments
- ✅ Stripe checkout (test and live mode)
- ✅ Subscription creation and management
- ✅ Cancel subscription at period end
- ✅ Webhook handling for payment events
- ✅ Usage tracking and plan limits
- ✅ PCI-DSS compliant (Stripe Elements)

### User Management
- ✅ User authentication (Supabase Auth)
- ✅ Profile management
- ✅ Admin dashboard with user management
- ✅ Delete user functionality

### UI/UX
- ✅ Responsive design
- ✅ Live mode indicator
- ✅ Analysis history
- ✅ Export to PDF

## What NOT To Do

### ❌ Don't Duplicate Code
Before creating a new utility function, check:
- `src/utils/` - Does a similar function exist?
- `src/services/` - Is there already a service for this entity?

### ❌ Don't Add Random Dependencies
Check `package.json` before adding new packages.

### ❌ Don't Mix Concerns
- Components: UI rendering only
- Services: Database operations only
- Utils: Business logic only

### ❌ Don't Ignore the Simulated/Real Split
Trial users get simulated data. Paid users get real data. This is intentional for cost control.

### ❌ Don't Hardcode Secrets
- Use `import.meta.env.VITE_*` for frontend variables
- Use Supabase secrets for edge functions

### ❌ Don't Skip Error Handling in Edge Functions
Edge functions should always return proper JSON errors, never throw unhandled.

## Environment Variables

### Frontend (.env)
```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...  # Legacy JWT format
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
VITE_STRIPE_STARTER_PRICE_ID=price_xxx
VITE_STRIPE_PROFESSIONAL_PRICE_ID=price_xxx
VITE_STRIPE_ENTERPRISE_PRICE_ID=price_xxx
```

### Supabase Edge Function Secrets
```bash
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
OPENAI_API_KEY=xxx          # For citation checking
ANTHROPIC_API_KEY=xxx       # For citation checking
PERPLEXITY_API_KEY=xxx      # For citation checking
```

## Deployment

### Frontend
- **Platform:** Netlify (auto-deploys from main branch)
- **Build:** `npm run build`

### Edge Functions
```bash
npx supabase functions deploy cancel-subscription
npx supabase functions deploy check-citations
npx supabase functions deploy crawl-website
npx supabase functions deploy create-payment-intent
npx supabase functions deploy create-subscription
npx supabase functions deploy stripe-webhook
```

## Testing

### Build Check
```bash
npm run build  # Must pass with no errors
```

### Payment Flow Test
```bash
npm run test:payment
```

### Test Cards (Stripe Test Mode)
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

## Questions to Ask Before Making Changes

1. Does this feature already exist somewhere?
2. What files will this change affect?
3. Does this follow the service/util/component pattern?
4. Will this work for both trial (simulated) and paid (real) users?
5. Have I updated the types if adding new data structures?
