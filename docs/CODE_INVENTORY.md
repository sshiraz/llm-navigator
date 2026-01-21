# LLM Navigator - Code Inventory

> **Purpose:** Track all code files, their responsibilities, and dependencies.
> **Update this file** when adding new files or significantly changing existing ones.

---

## Quick Reference: Where to Find Things

| I want to... | Look in... |
|--------------|------------|
| Change analysis logic | `src/utils/analysisEngine.ts` |
| Change how metrics are calculated | `src/utils/analysisEngine.ts` → `calculateRealMetrics()` |
| Add a new recommendation type | `src/utils/analysisEngine.ts` → `generateRecommendationsFromCrawl()` |
| Change what data is crawled | `supabase/functions/crawl-website/index.ts` |
| Modify subscription plans | `src/utils/planConfig.ts` |
| Change pricing UI | `src/components/Subscription/PricingTiers.tsx` |
| Add a new API endpoint | `supabase/functions/` (create new folder) |
| Add a new database table | Supabase Dashboard + `src/types/database.ts` |
| Add authentication logic | `src/hooks/useAuth.ts` or `src/services/authService.ts` |

---

## File Inventory

### Entry Points

| File | Purpose | Key Exports |
|------|---------|-------------|
| `src/main.tsx` | App entry point, renders React | - |
| `src/App.tsx` | Main app component, routing, global state | `App` |
| `index.html` | HTML shell | - |

### Types (`src/types/`)

| File | Purpose | Key Types |
|------|---------|-----------|
| `index.ts` | Core domain types | `User`, `Project`, `Analysis`, `Recommendation`, `ApiUsage` |
| `crawl.ts` | Crawl result types | `CrawlData`, `CrawlResult`, `CrawlHeading`, `SchemaMarkup` |
| `database.ts` | Supabase-generated types | `Database` |

### Utils (`src/utils/`) - Business Logic

| File | Purpose | Key Functions | Dependencies |
|------|---------|---------------|--------------|
| `analysisEngine.ts` | **CORE**: Analysis orchestration | `analyzeWebsite()`, `calculateRealMetrics()`, `generateRecommendationsFromCrawl()` | `costTracker`, `crawl.ts` types |
| `costTracker.ts` | API cost tracking, usage limits | `trackAnalysisUsage()`, `checkUsageLimits()`, `checkRateLimit()` | - |
| `fraudPrevention.ts` | Trial abuse detection | `checkTrialEligibility()`, `normalizeEmail()`, `getDeviceFingerprint()` | - |
| `stripeUtils.ts` | Stripe API helpers | `createPaymentIntent()`, `createSubscription()` | Supabase URL |
| `planConfig.ts` | Subscription plan definitions | `PLANS`, `getPlanLimits()` | - |
| `pdfGenerator.ts` | PDF report generation | `generatePDF()` | `jspdf`, `html2canvas` |
| `authUtils.ts` | Auth state helpers | `getCurrentUser()`, `isAuthenticated()` | - |
| `adminUtils.ts` | Admin checks | `isAdmin()` | - |
| `envConfig.ts` | Environment validation | `validateEnv()`, `getEnvConfig()` | - |
| `paymentLogger.ts` | Payment debugging logs | `logPaymentEvent()` | - |
| `paymentUtils.ts` | Payment helpers | Various helpers | - |
| `webhookUtils.ts` | Webhook helpers | `testWebhook()` | - |
| `userUtils.ts` | User helpers | `formatUserName()` | - |
| `fieldMappers.ts` | Database field mapping | Field transformation | - |
| `mockData.ts` | Mock data for development | `mockAnalysis`, `mockUser` | - |
| `liveMode.ts` | Live/test mode detection | `isLiveMode()` | - |

### Services (`src/services/`) - Database Operations

| File | Purpose | Key Methods | Database Tables |
|------|---------|-------------|-----------------|
| `analysisService.ts` | Analysis CRUD | `createAnalysis()`, `getUserAnalyses()`, `getProjectAnalyses()` | `analyses` |
| `authService.ts` | User auth operations | `signIn()`, `signUp()`, `signOut()`, `updateProfile()` | `users` |
| `paymentService.ts` | Payment operations | `updateSubscription()`, `getSubscriptionStatus()` | `users` |
| `projectService.ts` | Project CRUD | `createProject()`, `getProjects()`, `addCompetitor()` | `projects`, `competitors` |
| `usageService.ts` | Usage tracking | `trackUsage()`, `getUsageStats()` | `api_usage` |
| `apiRateLimiter.test.ts` | **Test file** | Rate limiting tests (per-minute, monthly, prompts validation) | - |

### Hooks (`src/hooks/`)

| File | Purpose | Hook |
|------|---------|------|
| `useAuth.ts` | Authentication state management | `useAuth()` |

### Lib (`src/lib/`)

| File | Purpose | Exports |
|------|---------|---------|
| `supabase.ts` | Supabase client initialization | `supabase` client instance |

---

## Components (`src/components/`)

### Analysis Components

| File | Purpose | Used By | Uses |
|------|---------|---------|------|
| `NewAnalysis.tsx` | Analysis input form | `App.tsx` | `AnalysisProgress`, `ModelSelector` |
| `AnalysisProgress.tsx` | Loading/progress display | `NewAnalysis.tsx` | `AnalysisEngine` |
| `AnalysisResults.tsx` | Results display | `App.tsx` | `MetricsBreakdown` |
| `MetricsBreakdown.tsx` | Detailed metrics view | `AnalysisResults.tsx` | - |
| `ModelSelector.tsx` | AI model selection dropdown | `NewAnalysis.tsx` | - |
| `AnalysisForm.tsx` | Reusable form component | `NewAnalysis.tsx` | - |
| `UsageLimitsBanner.tsx` | Usage limit warnings | `Dashboard.tsx` | - |

### Auth Components

| File | Purpose | Used By |
|------|---------|---------|
| `AuthPage.tsx` | Login/signup page | `App.tsx` |
| `TrialSignup.tsx` | Trial registration flow | `PricingTiers.tsx` |
| `CheckoutForm.tsx` | Payment during auth | `AuthPage.tsx` |
| `LogoutHandler.tsx` | Logout logic | `Header.tsx` |

### Payment Components

| File | Purpose | Used By |
|------|---------|---------|
| `CreditCardForm.tsx` | Stripe Elements credit card | `TrialSignup.tsx`, `CheckoutForm.tsx` |
| `StripeCheckout.tsx` | Stripe checkout wrapper | Various |
| `CheckoutForm.tsx` | Payment form | `PricingTiers.tsx` |
| `StripeStatus.tsx` | Payment status display | Various |

### Subscription Components

| File | Purpose | Used By |
|------|---------|---------|
| `PricingTiers.tsx` | **Main pricing page** | `App.tsx` |
| `StripeRedirectCheckout.tsx` | Redirect checkout flow | `PricingTiers.tsx` |
| `CheckoutSuccessHandler.tsx` | Post-checkout handling | `App.tsx` |

### Dashboard Components

| File | Purpose | Used By |
|------|---------|---------|
| `Dashboard.tsx` | **Main dashboard** | `App.tsx` |
| `ScoreCard.tsx` | Score display widget | `Dashboard.tsx` |
| `RecentAnalyses.tsx` | Analysis history list | `Dashboard.tsx` |
| `ProjectCard.tsx` | Project summary card | `Dashboard.tsx` |
| `CompetitorTable.tsx` | Competitor comparison | `ProjectDetail.tsx` |

### Admin Components

| File | Purpose | Access |
|------|---------|--------|
| `UserDashboard.tsx` | User management | Admin only |
| `UsageDashboard.tsx` | API usage analytics | Admin only |

### Layout Components

| File | Purpose |
|------|---------|
| `Header.tsx` | Top navigation bar |
| `Sidebar.tsx` | Side navigation |

### UI Components

| File | Purpose |
|------|---------|
| `EnvironmentStatus.tsx` | Test/live mode indicator |
| `LiveModeBanner.tsx` | Live mode warning |
| `LiveModeIndicator.tsx` | Small live mode badge |
| `PlanFeatures.tsx` | Plan feature list |
| `SecurePaymentNotice.tsx` | Payment security badge |

### Other Components

| Directory | Files | Purpose |
|-----------|-------|---------|
| `Landing/` | `LandingPage.tsx` | Marketing homepage |
| `Contact/` | `ContactPage.tsx` | Contact form |
| `Account/` | `AccountPage.tsx` | User settings |
| `Legal/` | `PrivacyPolicy.tsx`, `TermsOfService.tsx` | Legal pages |
| `Projects/` | `ProjectDetail.tsx` | Project view |
| `Database/` | `DatabaseSetup.tsx` | DB setup wizard |
| `Debug/` | Various | Development tools |
| `Pricing/` | `PricingPage.tsx` | Pricing page |
| `Reports/` | Report components | Report generation |

---

## Edge Functions (`supabase/functions/`)

| Function | Trigger | Input | Output | Purpose |
|----------|---------|-------|--------|---------|
| `crawl-website` | HTTP POST | `{url, keywords}` | `CrawlResult` | Real website crawling, HTML parsing, SEO extraction |
| `create-subscription` | HTTP POST | `{userId, email, plan, priceId, paymentMethodId}` | Subscription details | Creates Stripe subscription |
| `stripe-webhook` | Stripe webhook | Stripe event | - | Processes payment events, updates DB |
| `webhook-helper` | HTTP POST | Various | Debug info | Webhook debugging |

---

## Dependency Graph (Key Relationships)

```
App.tsx
├── components/Analysis/NewAnalysis.tsx
│   ├── components/Analysis/AnalysisProgress.tsx
│   │   └── utils/analysisEngine.ts ← CORE LOGIC
│   │       ├── utils/costTracker.ts
│   │       └── [calls] supabase/functions/crawl-website
│   └── components/Analysis/ModelSelector.tsx
├── components/Analysis/AnalysisResults.tsx
│   └── components/Analysis/MetricsBreakdown.tsx
├── components/Subscription/PricingTiers.tsx
│   ├── components/Auth/TrialSignup.tsx
│   │   └── utils/fraudPrevention.ts
│   └── components/Payment/CreditCardForm.tsx
│       └── utils/stripeUtils.ts
│           └── [calls] supabase/functions/create-subscription
├── components/Dashboard/Dashboard.tsx
│   ├── services/analysisService.ts
│   └── services/projectService.ts
└── lib/supabase.ts (used by all services)
```

---

## Adding New Code: Checklist

### Adding a new utility function
- [ ] Check if similar function exists in `src/utils/`
- [ ] Add to existing file if related, or create new file
- [ ] Export from the file
- [ ] Update this inventory

### Adding a new component
- [ ] Place in appropriate directory under `src/components/`
- [ ] Follow existing patterns (props interface, etc.)
- [ ] Update this inventory

### Adding a new edge function
- [ ] Create folder in `supabase/functions/`
- [ ] Follow CORS pattern from existing functions
- [ ] Add to this inventory
- [ ] Deploy with `npx supabase functions deploy <name>`

### Adding a new database table
- [ ] Create in Supabase Dashboard
- [ ] Add RLS policies
- [ ] Update `src/types/database.ts`
- [ ] Create service in `src/services/`
- [ ] Update this inventory

---

## Technical Debt Tracker

| Item | Location | Priority | Notes |
|------|----------|----------|-------|
| localStorage → Supabase migration | `analysisEngine.ts`, `App.tsx` | High | Analysis results should persist to DB |
| Remove unused Debug components | `src/components/Debug/` | Low | Clean up after payment testing complete |
| Bundle size optimization | Build output | Medium | Consider code splitting |
| Unused service methods | Various services | Low | Some Supabase methods aren't called |

---

*Last updated: 2026-01-21*
