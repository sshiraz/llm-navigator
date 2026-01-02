# LLM Navigator - System Architecture

## System Overview

LLM Navigator is a web application that helps websites optimize for AI search engines (ChatGPT, Claude, Perplexity, etc.).

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              USERS                                          │
│                    (Website owners, SEO professionals)                      │
└─────────────────────────────────┬──────────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                         NETLIFY (CDN + Hosting)                             │
│                              dist/index.html                                │
└─────────────────────────────────┬──────────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                          REACT APPLICATION                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Landing   │  │   Auth      │  │  Dashboard  │  │  Analysis   │        │
│  │    Page     │  │   Pages     │  │             │  │   Flow      │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                    SERVICES LAYER                                │       │
│  │  analysisService │ authService │ paymentService │ projectService │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                      UTILS LAYER                                 │       │
│  │  analysisEngine │ costTracker │ fraudPrevention │ stripeUtils    │       │
│  └─────────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────┬──────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
┌───────────────────────────────┐  ┌───────────────────────────────┐
│     SUPABASE EDGE FUNCTIONS   │  │      SUPABASE DATABASE        │
│  ┌─────────────────────────┐  │  │                               │
│  │    crawl-website        │  │  │  users                        │
│  │  (Real website crawling)│  │  │  projects                     │
│  └─────────────────────────┘  │  │  analyses                     │
│  ┌─────────────────────────┐  │  │  competitors                  │
│  │  create-subscription    │  │  │  api_usage                    │
│  │  (Stripe subscription)  │  │  │  fraud_checks                 │
│  └─────────────────────────┘  │  │                               │
│  ┌─────────────────────────┐  │  └───────────────────────────────┘
│  │    stripe-webhook       │  │
│  │  (Payment events)       │  │
│  └─────────────────────────┘  │
└───────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────┐
│          STRIPE API           │
│  (Payment processing)         │
└───────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Analysis Flow (Core Feature)

```
User enters URL + Keywords
         │
         ▼
┌─────────────────────────┐
│   NewAnalysis.tsx       │  User fills form
│   (Component)           │
└───────────┬─────────────┘
            │ handleSubmit()
            ▼
┌─────────────────────────┐
│  AnalysisProgress.tsx   │  Shows loading steps
│  (Component)            │
└───────────┬─────────────┘
            │ calls
            ▼
┌─────────────────────────┐
│  AnalysisEngine         │  Routes based on user subscription
│  (src/utils/)           │
└───────────┬─────────────┘
            │
    ┌───────┴───────┐
    │               │
    ▼               ▼
┌─────────┐   ┌─────────────────┐
│SIMULATED│   │      REAL       │
│(Trial)  │   │  (Paid users)   │
└────┬────┘   └───────┬─────────┘
     │                │
     │                ▼
     │        ┌─────────────────┐
     │        │  crawl-website  │  Edge Function
     │        │  (Supabase)     │  Fetches & parses HTML
     │        └───────┬─────────┘
     │                │
     │                ▼
     │        ┌─────────────────┐
     │        │ calculateReal   │  Metrics from actual data
     │        │ Metrics()       │
     │        └───────┬─────────┘
     │                │
     ▼                ▼
┌─────────────────────────┐
│     Analysis Object     │
│  {score, metrics,       │
│   insights, recs}       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  AnalysisResults.tsx    │  Displays results
│  (Component)            │
└─────────────────────────┘
```

### 2. Payment/Subscription Flow

```
User clicks "Start Trial" or "Subscribe"
         │
         ▼
┌─────────────────────────┐
│   PricingTiers.tsx      │  Plan selection
│   (Component)           │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   TrialSignup.tsx       │  Fraud check + trial creation
│   (Component)           │
└───────────┬─────────────┘
            │ For paid plans:
            ▼
┌─────────────────────────┐
│   CreditCardForm.tsx    │  Stripe Elements
│   (Component)           │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   stripeUtils.ts        │  Creates payment intent
│   (Utils)               │
└───────────┬─────────────┘
            │ POST
            ▼
┌─────────────────────────┐
│  create-subscription    │  Edge Function
│  (Supabase)             │  Creates Stripe subscription
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│     Stripe API          │
│                         │
└───────────┬─────────────┘
            │ Webhook
            ▼
┌─────────────────────────┐
│   stripe-webhook        │  Edge Function
│   (Supabase)            │  Updates user subscription in DB
└─────────────────────────┘
```

---

## Module Responsibilities

### Frontend Components (`src/components/`)

| Directory | Responsibility |
|-----------|---------------|
| `Analysis/` | Website analysis input, progress, results display |
| `Auth/` | Login, signup, trial signup, logout |
| `Dashboard/` | Main dashboard, project cards, recent analyses |
| `Payment/` | Stripe credit card forms, payment status |
| `Subscription/` | Pricing tiers, checkout flow |
| `Admin/` | Admin-only dashboards (users, usage) |
| `Landing/` | Marketing landing page |
| `Layout/` | Header, sidebar, navigation |
| `UI/` | Reusable UI components |
| `Debug/` | Development/debugging tools (not for production) |

### Services Layer (`src/services/`)

| Service | Responsibility | Database Tables |
|---------|---------------|-----------------|
| `analysisService.ts` | CRUD for analyses | `analyses` |
| `authService.ts` | User authentication, profile | `users` |
| `paymentService.ts` | Subscription management | `users` (subscription field) |
| `projectService.ts` | CRUD for projects | `projects`, `competitors` |
| `usageService.ts` | API usage tracking | `api_usage` |

### Utils Layer (`src/utils/`)

| Utility | Responsibility |
|---------|---------------|
| `analysisEngine.ts` | **Core logic**: Routes real vs simulated, calculates metrics |
| `costTracker.ts` | Tracks API costs, enforces usage limits |
| `fraudPrevention.ts` | Detects trial abuse (email similarity, device fingerprint) |
| `stripeUtils.ts` | Stripe API interactions |
| `planConfig.ts` | Subscription plan definitions (limits, prices) |
| `pdfGenerator.ts` | Generates PDF reports from analysis |
| `authUtils.ts` | Authentication helpers |
| `adminUtils.ts` | Admin permission checks |

### Edge Functions (`supabase/functions/`)

| Function | Trigger | Responsibility |
|----------|---------|---------------|
| `crawl-website` | HTTP POST | Fetches URL, parses HTML, extracts SEO data |
| `create-subscription` | HTTP POST | Creates Stripe customer + subscription |
| `stripe-webhook` | Stripe webhook | Handles payment events, updates DB |
| `webhook-helper` | HTTP POST | Webhook debugging/helpers |

---

## Database Schema

```sql
-- Users (managed by Supabase Auth + custom fields)
users (
  id UUID PRIMARY KEY,
  email TEXT,
  name TEXT,
  subscription TEXT, -- 'free' | 'trial' | 'starter' | 'professional' | 'enterprise'
  trial_ends_at TIMESTAMP,
  device_fingerprint TEXT,
  ip_address TEXT,
  created_at TIMESTAMP
)

-- Projects (websites being analyzed)
projects (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users,
  name TEXT,
  website TEXT,
  keywords TEXT[],
  created_at TIMESTAMP
)

-- Analyses (results of website scans)
analyses (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects,
  user_id UUID REFERENCES users,
  website TEXT,
  keywords TEXT[],
  score INTEGER,
  metrics JSONB,      -- {contentClarity, semanticRichness, structuredData, naturalLanguage, keywordRelevance}
  insights TEXT,
  recommendations JSONB,
  is_simulated BOOLEAN,
  cost_info JSONB,
  created_at TIMESTAMP
)

-- API Usage (cost tracking)
api_usage (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users,
  analysis_id UUID,
  costs JSONB,        -- {crawling, embeddings, insights, total}
  tokens JSONB,
  provider TEXT,
  created_at TIMESTAMP
)

-- Fraud Checks (trial abuse prevention)
fraud_checks (
  id UUID PRIMARY KEY,
  email TEXT,
  normalized_email TEXT,
  device_fingerprint TEXT,
  ip_address TEXT,
  risk_score INTEGER,
  is_allowed BOOLEAN,
  created_at TIMESTAMP
)
```

---

## Key Design Decisions

### 1. Simulated vs Real Analysis
**Why:** Real analysis costs money (API calls). Trial users get convincing simulated data to experience the product without incurring costs.

**How:** `AnalysisEngine.shouldUseRealAnalysis(user)` checks subscription status.

### 2. Edge Functions for Server-Side Logic
**Why:**
- CORS restrictions prevent client-side web crawling
- Keeps API keys secure
- Supabase Edge Functions are cost-effective

### 3. localStorage for Analysis Results
**Current State:** Results stored in localStorage for quick iteration.
**Future:** Should migrate to Supabase for persistence across devices.

### 4. Hash-Based Routing
**Why:** Simple single-page app routing without server configuration.
**How:** `App.tsx` reads `window.location.hash` to determine which component to render.

---

## Security Considerations

1. **Row Level Security (RLS):** All Supabase tables should have RLS policies
2. **API Keys:** Never expose in client code; use edge functions
3. **Fraud Prevention:** Device fingerprinting + email normalization for trial abuse
4. **Stripe Webhooks:** Verify signatures before processing

---

## Performance Considerations

1. **Analysis Caching:** Consider caching crawl results for repeated analyses
2. **Bundle Size:** Current bundle is ~974KB, consider code splitting
3. **Edge Function Cold Starts:** First request may be slow

---

## Future Architecture Considerations

1. **LLM Citation Checking:** Query Perplexity/ChatGPT APIs to check if site is cited
2. **Background Jobs:** For scheduled re-analysis of sites
3. **Real-time Updates:** WebSocket for live analysis progress
4. **Multi-tenant:** Organization/team support
