# LLM Navigator Architecture

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Backend | Supabase Edge Functions (Deno) |
| Payments | Stripe |
| Deployment | Netlify |

## Project Structure

```
llm-navigator/
├── src/
│   ├── components/          # React UI components
│   │   ├── Analysis/        # NewAnalysis, AnalysisProgress, AnalysisResults
│   │   ├── History/         # AnalysisHistory
│   │   ├── Layout/          # Header, Sidebar
│   │   ├── Dashboard/       # Main dashboard
│   │   ├── Auth/            # Login/signup
│   │   ├── Subscription/    # Pricing, payments
│   │   └── ...
│   ├── services/            # Supabase CRUD operations
│   │   ├── analysisService.ts
│   │   ├── authService.ts
│   │   └── paymentService.ts
│   ├── utils/               # Business logic
│   │   ├── analysisEngine.ts   # Core AEO logic (real vs simulated)
│   │   ├── costTracker.ts      # Usage limits & costs
│   │   └── ...
│   ├── types/               # TypeScript interfaces
│   └── lib/
│       └── supabase.ts      # Supabase client
│
├── supabase/
│   └── functions/           # Edge functions (Deno runtime)
│       ├── crawl-website/   # Crawls & analyzes websites
│       ├── check-citations/ # Queries AI providers
│       └── stripe-webhook/  # Payment webhooks
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

| File | Purpose |
|------|---------|
| `src/utils/analysisEngine.ts` | Core analysis logic, routes real vs simulated |
| `src/services/analysisService.ts` | Database CRUD for analyses |
| `src/utils/costTracker.ts` | Usage limits, cost calculations |
| `src/types/index.ts` | All TypeScript interfaces |
| `supabase/functions/check-citations/index.ts` | Queries AI providers |
| `supabase/functions/crawl-website/index.ts` | Website content analysis |

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

## Deployment

- **Frontend**: Netlify (auto-deploys from main branch)
- **Edge Functions**: `npx supabase functions deploy <function-name>`
- **Database**: Managed by Supabase
