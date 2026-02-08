# Branch Analysis & Explainer Log

> This document tracks significant changes, their reasoning, and test results.
> Archive: `BRANCH_ANALYSIS_2025-09_to_2026-01.md` (Sep 2025 - Jan 2026)

---

## 2026-02-08: Fix Competitor Leaderboard External Links

**Changes:** Made the external link icons in the Competitor Citation Leaderboard clickable

### Problem

The `ExternalLink` icons next to competitor domains in the Competitor Citation Leaderboard were purely decorative - clicking them did nothing. Users expected to be able to click through to view the competitor websites.

### Solution

Wrapped the `ExternalLink` icon in an anchor tag that opens the competitor's website:

```tsx
<a
  href={`https://${comp.domain}`}
  target="_blank"
  rel="noopener noreferrer"
  className="text-slate-500 hover:text-blue-400 transition-colors"
  title={`Visit ${comp.domain}`}
>
  <ExternalLink className="w-4 h-4" />
</a>
```

### Files Changed

| File | Change |
|------|--------|
| `src/components/FreeReport/FreeReportPage.tsx` | Wrap ExternalLink icon in anchor tag |

### Testing Performed

- **Test Suite:** 754 passed, 0 failed (754 total)
- **Build:** Passed

---

## 2026-02-08: Consolidate Industry Detection into Shared Utility

**Commit:** `ee4d0c8` - Consolidate industry detection into shared utility

**Changes:** Refactored duplicated industry detection code from FreeReportPage and NewAnalysis into a shared utility in `industryDetector.ts`

### Problem

The AI-powered industry detection logic was duplicated in two components:
- `FreeReportPage.tsx` (lines 173-238) - `detectIndustryFromUrl()`
- `NewAnalysis.tsx` (lines 107-159) - `detectIndustry()`

Both had identical:
1. Same prompt: `"What industry or business sector does ${brandName} (${url}) operate in?..."`
2. Same response parsing logic (removes `**`, `*`, `[1][2]` citations, common prefixes)
3. Same validation (length > 2 and < 100)

This duplication made maintenance error-prone and violated DRY principles.

### Solution

Added two shared functions to `src/utils/industryDetector.ts`:

```typescript
// Pure function to parse and clean AI responses
export function parseIndustryResponse(responseText: string): string | null

// Async function for full AI-powered detection
export async function detectIndustryFromAI(
  websiteUrl: string,
  supabaseClient: {...}
): Promise<IndustryDetectionResult>
```

**Parsing logic handles:**
- Markdown bold (`**text**`) and italic (`*text*`)
- Citation references (`[1]`, `[2][3]`, `[42]`)
- Common prefixes ("Industry:", "The industry is", "Based on", etc.)
- Trailing punctuation and quotes
- Length validation (3-99 characters)

### Files Changed

| File | Change |
|------|--------|
| `src/utils/industryDetector.ts` | Added `parseIndustryResponse()` and `detectIndustryFromAI()` |
| `src/components/FreeReport/FreeReportPage.tsx` | Simplified to use `detectIndustryFromAI()` (67 → 19 lines) |
| `src/components/Analysis/NewAnalysis.tsx` | Simplified to use `detectIndustryFromAI()` (54 → 17 lines) |
| `src/utils/industryResponseParser.test.ts` | Updated to import from shared utility |

### Code Reduction

| Component | Before | After |
|-----------|--------|-------|
| FreeReportPage.tsx | 67 lines | 19 lines |
| NewAnalysis.tsx | 54 lines | 17 lines |
| **Total** | 121 lines | 36 lines |

### Testing Performed

- **Test Suite:** 754 passed, 0 failed (754 total)
- **Build:** Passed
- Industry parser unit tests (41 tests) now test the shared utility directly

---

## 2026-02-07: Free Report - Two-Phase Form Flow

**Commit:** `9fdabde` - Improve free report accuracy: AI industry detection + citation fix

**Changes:** Added two-step form flow to free report page for better UX and industry confirmation

### Problem

The free report page collected website URL and email simultaneously, then detected industry during the analysis phase. This meant:
1. Users couldn't review/edit the detected industry before analysis
2. Industry detection happened after email capture (too late for user input)
3. Extra API call during analysis phase

### Solution: Two-Step Form

**Step 1: Website & Industry**
```
┌─────────────────────────────────────────┐
│  [●] Your Website  ─────  [○] Get Report│
├─────────────────────────────────────────┤
│  Website URL                            │
│  [yourcompany.com                    ]  │
│                                         │
│  Industry (auto-detected)               │
│  [Environmental Consulting          ]  │
│  ✨ AI-suggested — feel free to edit    │
│                                         │
│         [Continue →]                    │
└─────────────────────────────────────────┘
```

- User enters website URL
- Industry auto-detects after 1.5s debounce
- User can edit before proceeding

**Step 2: Email & Generate**
```
┌─────────────────────────────────────────┐
│  ← Back         yourcompany.com         │
│                 Environmental Consulting │
├─────────────────────────────────────────┤
│  Email                                  │
│  [you@company.com                    ]  │
│  We'll send a copy to this email        │
│                                         │
│      [Get My Free Report →]             │
└─────────────────────────────────────────┘
```

### Benefits

1. **Better UX** - Users confirm industry before committing email
2. **Saves API call** - Industry detection happens once in Step 1, not during analysis
3. **User control** - Editable industry field catches AI mistakes
4. **Consistent** - Matches the paid analysis flow

### Files Changed

| File | Change |
|------|--------|
| `src/components/FreeReport/FreeReportPage.tsx` | Two-step form, early industry detection |

---

## 2026-02-07: Paid Analysis - Two-Phase Industry Detection Flow

**Commit:** `1d2ff89` - Add two-phase industry detection flow for paid analysis tiers

**Changes:** Added AI-powered industry detection to paid analysis tiers with a two-step form flow

### Problem

Paid users had to manually write prompts without guidance on what industry-specific queries to use. The free report had industry detection, but paid analysis didn't benefit from it.

### Solution: Two-Phase Form Flow

For paid users (starter, professional, enterprise), the analysis form is now split into two steps:

#### Step 1: Website & Industry
```
┌─────────────────────────────────────────┐
│  Step 1         Step 2                  │
│  [●]──────────────[○]                   │
│  Website & Industry   Prompts & Analysis│
├─────────────────────────────────────────┤
│  Your Website                           │
│  [www.example.com                    ]  │
│                                         │
│  Industry                               │
│  [Environmental Consulting          ]  │
│  ✨ AI-suggested based on your website  │
│                                         │
│         [Continue →]                    │
└─────────────────────────────────────────┘
```

- User enters website URL
- After 1.5 second debounce, industry auto-detects via Perplexity
- User can edit or override the detected industry
- "Continue" button proceeds to Step 2

#### Step 2: Prompts & Analysis
```
┌─────────────────────────────────────────┐
│  ← Back    www.example.com              │
│            Environmental Consulting     │
├─────────────────────────────────────────┤
│  Brand Name (optional)                  │
│  [                                   ]  │
│                                         │
│  Search Prompts                         │
│  Example prompts (industry-specific):   │
│  • "What are the best environmental..." │
│  • "Top providers in environmental..."  │
│                                         │
│  AI Providers to Check                  │
│  [✓] Perplexity  [✓] ChatGPT           │
│                                         │
│      [Run AI Visibility Analysis →]     │
└─────────────────────────────────────────┘
```

- Summary bar shows website + industry with "Back" button
- Prompt suggestions dynamically update based on detected industry
- User completes analysis as normal

### Technical Implementation

**State additions:**
```typescript
const [formStep, setFormStep] = useState<1 | 2>(1);
const [industry, setIndustry] = useState('');
const [isDetectingIndustry, setIsDetectingIndustry] = useState(false);
const [industryDetected, setIndustryDetected] = useState(false);
```

**Industry detection:** Reuses `check-citations` edge function with a discovery prompt:
```typescript
const discoveryPrompt = `What industry or business sector does ${brandName} (${websiteUrl}) operate in? Answer with just the industry name in 3-5 words.`;
```

**Response parsing fix:** The initial implementation had wrong response path:
- Wrong: `data?.results?.[0]?.responses?.perplexity?.response`
- Correct: `data?.data?.results?.[0]?.response`

### Files Changed

| File | Change |
|------|--------|
| `src/components/Analysis/NewAnalysis.tsx` | Two-phase form, industry detection, dynamic prompts |

### UX Notes

- Trial/demo users see the original single-step flow (unchanged)
- Step indicator shows progress (1 → 2) for paid users
- Auto-detection only triggers for paid users (via `isRealAnalysis` check)
- Industry field is always editable - AI suggestion is just a starting point

---

## 2026-02-07: Free Report - Industry Detection & Citation Accuracy

**Commit:** `9fdabde` - Improve free report accuracy: AI industry detection + citation fix

**Changes:** Major improvements to free report accuracy - AI-powered industry detection, location-aware queries, and fixed citation false positives

### Problem

The free report was producing poor results:
1. **Wrong industry detection** - geo.co.id (environmental consulting) was detected as "AI & Automation"
2. **Wrong competitors** - Showing Zapier, n8n, YouTube instead of actual environmental services companies
3. **100% citation rate** - False positives from Perplexity echoing the brand name

### Solution: Two-Phase Analysis

#### Phase 1: Hidden Industry Discovery Query
Before running visible queries, we now ask Perplexity:
```
What industry or business sector does [brand] ([url]) operate in?
Also identify their geographic location if apparent.
```

This returns the actual industry (e.g., "geomatics and environmental technology") and location (e.g., "Indonesia").

#### Phase 2: Industry-Specific Prompts
Using the detected industry + location, we generate targeted queries:
- "What are the best alternatives to [brand] for [industry] in [location]?"
- "What are the most well-known [industry] companies in [location]?"
- "Who are the best [industry] providers in [location]?"

### Citation Detection Fix

**Problem:** When asking "alternatives to Geo Enviro Omega", Perplexity reads geo.co.id to understand the company and includes it in sources. This is NOT a recommendation - it's research.

**Solution:** Differentiate query types:

| Query Type | Example | Citation Check |
|------------|---------|----------------|
| Brand-specific | "alternatives to X", "competitors of X" | Always `false` (self-citation filtered) |
| Generic industry | "best X companies in Y" | Check if domain in sources (true citation) |

### Competitor Validation

Added validation step that:
1. Filters out non-competitor domains (g2.com, cbinsights.com, linkedin.com, etc.)
2. Crawls potential competitors' homepages
3. Extracts keywords and checks for industry overlap
4. Only includes competitors in same industry

### Files Changed

| File | Change |
|------|--------|
| `src/components/FreeReport/FreeReportPage.tsx` | Industry discovery query, industry-specific prompts, competitor validation |
| `supabase/functions/check-citations/index.ts` | Citation detection by query type (brand-specific vs generic) |

### Results

**Before:**
- Industry: "AI & Automation" ❌
- Competitors: Zapier, n8n, YouTube ❌
- Citation rate: 100% (false positive) ❌

**After:**
- Industry: "geomatics and environmental technology" ✓
- Competitors: karvak.co.id, elioplus.com, geosyndo.co.id ✓
- Citation rate: 60% (3/5 - accurate) ✓

### Edge Function Deployment

```bash
npx supabase functions deploy check-citations
```

---

## 2026-02-03: Product Roadmap - Agent Readiness Feature

**Commit:** `f6da37d` - Add Agent Readiness Check to product roadmap

**Changes:** Added "Agent Readiness Check" as top priority feature in product roadmap

### Context

Based on analysis of emerging AI search trends (r/AISearchOptimizers), the industry is shifting:

- AI moving from **Answering → Recommending → Executing**
- Agentic commerce requires machine-readable transactional data
- Citation tracking alone is no longer sufficient differentiation

### Current Gap

LLM Navigator currently answers: **"Can AI mention you?"** (citation tracking)

But doesn't answer: **"Can AI transact with you?"** (agent readiness)

### Roadmap Addition

Added to ROADMAP.md as **#1 Upcoming Feature** and PRODUCT_ENGINEERING_ROADMAP.md as **Phase 6**:

**Agent Readiness Check scope:**
- Product feed / API availability detection
- Real-time pricing & inventory data exposure
- Commerce structured data validation (offers, availability, shipping)
- Machine-readable policies (returns, warranties)
- API endpoint discoverability
- Data freshness signals
- New: Agent Readiness Score (0-100)

### Strategic Rationale

| Current | Future |
|---------|--------|
| Citation tracking | + Agent readiness |
| "Are you mentioned?" | + "Can AI buy from you?" |
| Content optimization | + Data architecture |
| AEO/GEO competitor | Agentic commerce leader |

This differentiates from pure SEO/AEO tools and positions for the agentic commerce wave.

### Files Changed

| File | Change |
|------|--------|
| `ROADMAP.md` | Add Agent Readiness as #1 priority, renumber existing items |
| `PRODUCT_ENGINEERING_ROADMAP.md` | Add Phase 6 for Agent Readiness |

---

## 2026-02-03: Fix Free Report Leads Not Saving to Database

**Commit:** `fed4e45` - Fix free report leads not saving to database

**Changes:** Fixed silent database insert failures and added error logging

### Problem

Free report leads were not being saved to the database, but admin email notifications were still being sent. This caused a disconnect where admins received "New Free Report Lead" emails but the leads didn't appear in the admin dashboard.

**Root cause:** The production `free_report_leads` table was missing columns that the code tried to insert:
- `citation_rate`
- `industry`
- `competitor_count`

The table was created with a minimal schema, and the full migration was never applied to production.

**Why it went undetected:** The insert code used `.catch(() => {})` which silently swallowed all errors.

### Solution

**1. Fixed production database schema:**
```sql
ALTER TABLE free_report_leads
ADD COLUMN IF NOT EXISTS citation_rate numeric,
ADD COLUMN IF NOT EXISTS industry text,
ADD COLUMN IF NOT EXISTS competitor_count integer DEFAULT 0;
```

**2. Added error logging to prevent silent failures:**
```typescript
// Before (silent failure)
supabase.from('free_report_leads').insert({...})
  .then(() => console.log('Lead saved'))
  .catch(() => {});

// After (logs actual errors)
supabase.from('free_report_leads').insert({...})
  .then(({ error }) => {
    if (error) {
      console.error('Failed to save lead:', error.message, error.code);
    } else {
      console.log('Lead saved successfully');
    }
  }).catch((err) => console.error('Lead save exception:', err));
```

### Files Changed

| File | Change |
|------|--------|
| `src/components/FreeReport/FreeReportPage.tsx` | Add error logging for lead insert |

### Lessons Learned

- Never use empty `.catch(() => {})` - always log errors
- Email notifications should ideally only fire after database insert succeeds
- Verify migrations are applied to production after creating them

---

## 2026-02-01: Homepage "Painkiller" Copy Rewrite

**Commit:** `5f573bd` - Rewrite homepage copy to be pain-focused ("painkiller" style)

**Changes:** Rewrote landing page copy to focus on pain/urgency rather than aspirational benefits

### Problem

The homepage copy was "vitamin" style - nice-to-have benefits that don't create urgency:
- "Be Visible in AI-Generated Answers" (aspirational)
- "Everything You Need to Win AI Search" (feature-focused)
- "Who Is This For?" (generic personas)

This approach doesn't communicate the immediate cost of inaction.

### Solution

Rewrote key sections to be "painkiller" style - emphasizing the pain of the problem:

**Hero Section:**
- Badge: "Answer Engine Optimization" → "Your competitors are getting cited. Are you?" (red warning)
- Headline: "Be Visible in AI-Generated Answers" → "Your Website Is Invisible to AI Search"
- Added pain example box showing lost customer scenario

**"Who Is This For?" Section:**
- Changed to "Is This Happening to You?"
- Each persona now shows their pain as a quote (e.g., "Why do AI assistants recommend our competitors but never mention us?")
- Icons changed from blue/green to red (warning tone)

**Features Section:**
- "Everything You Need to Win AI Search" → "Stop Losing Customers to AI Blindspots"

**AI Visibility Score Section:**
- "AI Visibility Score" → "Your AI Visibility Score: How Bad Is It?"
- Added color-coded score tiers (Invisible/At Risk/Visible)
- "Most sites don't know they're invisible until it's too late"

**"Introducing AEO" Section:**
- "Introducing Answer Engine Optimization" → "Your SEO Tools Can't Fix This"
- Leads with problem: "Traditional SEO tools have no idea how AI sees your site"

**Final CTA Section:**
- "Ready to Be Found in AI Answers?" → "How Many Customers Did You Lose Today?"
- Button changed from blue → red/orange gradient
- Added urgency: "This is happening right now. Not next year. Today."

**Product Definition (bottom of hero):**
- Added clear descriptor: "LLM Navigator is an AI visibility analysis tool that shows how websites appear in AI-generated answers."
- Styled subtly (`text-sm text-slate-500`) to inform without competing with main messaging

### Avoided Claims

Removed "only platform" language - not defensible since other AEO tools exist.

### Files Changed

| File | Change |
|------|--------|
| `src/components/Landing/LandingPage.tsx` | Painkiller copy rewrite across 6 sections + product definition |

---

## 2026-01-31: Blog System Implementation

**Commit:** `45dc967` - Add markdown-based blog system with SEO-friendly URLs

**Changes:** Added markdown-based blog with SEO-friendly URLs at `/blog` and `/blog/:slug`

### Features

1. **Blog Index Page** (`/blog`)
   - Lists all posts sorted by date (newest first)
   - Post cards with title, date, description
   - CTA section for free report
   - Matches site's dark slate theme

2. **Individual Post Pages** (`/blog/:slug`)
   - Full markdown rendering with tables, lists, code blocks
   - SEO meta tags (title, description, canonical URL)
   - Back to blog link + CTA at bottom

3. **Markdown Content Management**
   - Posts stored in `src/content/blog/*.md`
   - YAML frontmatter for metadata (title, date, description)
   - Loaded at build time via Vite's `import.meta.glob`
   - Git-tracked, no database needed

### Technical Implementation

- **Markdown parsing:** Custom frontmatter parser (no external dependency)
- **Rendering:** `react-markdown` + `remark-gfm` for GitHub Flavored Markdown
- **Styling:** `@tailwindcss/typography` plugin with `prose-invert` for dark theme
- **Routing:** Path-based routes added to existing custom router in App.tsx

### Files Created

| File | Purpose |
|------|---------|
| `src/components/Blog/blogIndex.ts` | Load and parse markdown posts |
| `src/components/Blog/BlogPage.tsx` | Blog listing page |
| `src/components/Blog/BlogPostPage.tsx` | Individual post page |
| `src/content/blog/what-is-aeo.md` | Post: What is AEO? |
| `src/content/blog/ai-citation-rate-explained.md` | Post: Citation Rate Explained |
| `src/content/blog/why-seo-needs-aeo.md` | Post: Why SEO Needs AEO |

### Files Modified

| File | Change |
|------|--------|
| `src/App.tsx` | Add `/blog` and `/blog/:slug` routes |
| `src/components/Landing/LandingPage.tsx` | Add Blog link to nav and footer |
| `tailwind.config.js` | Add typography plugin |
| `package.json` | Add react-markdown, remark-gfm, @tailwindcss/typography |

### Adding New Posts

Create a new `.md` file in `src/content/blog/`:

```markdown
---
title: "Your Post Title"
date: "2026-01-31"
description: "Brief description for SEO and listing page."
---

# Your Content Here

Markdown content with **bold**, lists, tables, etc.
```

The post will automatically appear in the blog listing.

---

## 2026-01-23: Fix Free Report Copy - Provider Accuracy

**Commit:** `3b17310` - Fix free report copy: ChatGPT -> Perplexity with upsell

**Changes:** Fixed misleading copy that claimed free report queries ChatGPT when it actually queries Perplexity

### Problem

The free report "How it works" section stated:
> "We query ChatGPT with 5 real prompts about your industry to check if you get cited"

But the actual code only queries Perplexity (`providers: ['perplexity']`). This was inaccurate and could mislead users.

### Solution

Updated the copy to:
1. Accurately state that Perplexity is queried
2. Mention that other providers (ChatGPT, Claude, Gemini) are available with an account

**Before:**
```
We query ChatGPT with 5 real prompts about your industry to check if you get cited
```

**After:**
```
We query Perplexity with 5 real prompts about your industry (ChatGPT, Claude, and Gemini available with an account)
```

### Why Perplexity for Free Report?

| Provider | Returns URLs? | Competitor Detection | Cost |
|----------|---------------|---------------------|------|
| Perplexity | ✅ Yes (citations) | ✅ Works | $0.003/1K tokens |
| OpenAI/ChatGPT | ❌ No (names only) | ❌ Broken | $0.015/1K tokens |

Perplexity returns actual source URLs via `return_citations: true`, enabling competitor extraction. ChatGPT only mentions company names without links.

### Files Changed

| File | Change |
|------|--------|
| `src/components/FreeReport/FreeReportPage.tsx` | Fix provider copy + add upsell |

### Testing Performed

```
npm run test:run
Test Files  23 passed (23)
     Tests  708 passed (708)
```

---

## 2026-01-21: Remove Internal References from User-Facing UI

**Commit:** `36093d2` - Remove test/live mode references from user-facing UI

**Changes:** Removed test/live mode references and fixed product branding inconsistency

### Problem

1. **Internal terminology exposed to users:** FAQ and API docs mentioned "Test Mode" and "Live Mode" - internal Stripe concepts users don't need to know
2. **Payment form showed scary warnings:** LiveModeIndicator banner displayed "LIVE MODE ACTIVE - Real credit cards will be charged" to paying customers
3. **Inconsistent branding:** Landing page still used old name "LLM Search Insight" instead of "LLM Navigator"

### Solution

**1. Removed test/live mode from FAQ:**
- `PricingTiers.tsx`: Removed FAQ item "How do Test Mode and Live Mode work?"
- `ApiDocs.tsx`: Removed entire "Test vs Live Mode" section

**2. Cleaned up payment form:**
- `CreditCardForm.tsx`: Removed LiveModeIndicator banner (top warning)
- `CreditCardForm.tsx`: Removed "Use a real credit card - LIVE MODE ACTIVE" text
- Removed unused `LiveModeIndicator` import

**3. Fixed branding:**
- `LandingPage.tsx`: Replaced all 6 instances of "LLM Search Insight" with "LLM Navigator"

### Files Changed

| File | Change |
|------|--------|
| `src/components/Subscription/PricingTiers.tsx` | Remove test/live FAQ item |
| `src/components/Docs/ApiDocs.tsx` | Remove test/live mode section |
| `src/components/Payment/CreditCardForm.tsx` | Remove LiveModeIndicator and text |
| `src/components/Landing/LandingPage.tsx` | Rename to "LLM Navigator" (6 places) |

### What Was Kept

- Internal logging (console warnings for developers)
- Admin debug tools (PaymentDebugger, WebhookDebugger)
- Documentation MD files (developer reference)

### Testing Performed

```
npm run test:run
Test Files  23 passed (23)
     Tests  708 passed (708)
```

---

## 2026-01-21: Fix Supabase Security Issues

**Commit:** `6d3a605` - Fix Supabase security issues: RLS and search_path vulnerabilities

**Changes:** Fixed 12 security warnings from Supabase dashboard (1 critical, 11 warnings)

### Problem

Supabase security advisor flagged:
1. **CRITICAL:** `webhook_events` table has RLS disabled - anyone with anon key could read/write
2. **WARNING:** 6 functions have mutable `search_path` - potential for search path injection attacks

### Solution

Created migration `20260121_fix_security_issues.sql` that:

**1. Enables RLS on `webhook_events`:**
```sql
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only access webhook_events" ...
```

**2. Locks down function search paths:**
```sql
CREATE OR REPLACE FUNCTION ... SET search_path = ''
```

Forces all table references to use fully-qualified names (`public.users` not `users`), preventing attackers from injecting malicious schemas.

### Functions Fixed

| Function | Purpose |
|----------|---------|
| `update_updated_at_column` | Trigger for auto-updating timestamps |
| `cleanup_sensitive_data` | GDPR data retention cleanup |
| `log_audit_event` | Security audit logging |
| `cleanup_old_audit_logs` | Audit log retention |
| `handle_new_user` | Auth trigger for new signups |
| `handle_admin_enterprise` | Admin user setup |

### Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/20260121_fix_security_issues.sql` | NEW - Security fixes migration |

### Testing Performed

```
npm run test:run
Test Files  23 passed (23)
     Tests  708 passed (708)
```

### Deployment Required

```bash
npx supabase db push
```

### Security Impact

- **Before:** `webhook_events` exposed to any client with anon key
- **After:** Only service_role can access webhook data
- **Before:** Functions vulnerable to search path injection
- **After:** All functions use locked search_path, must use `public.` prefix

---

## 2026-01-21: Lead & Signup Tracking System

**Commit:** `9632c12` - Add Lead & Signup Tracking docs and update test counts

**Changes:** Added admin dashboards for free report leads and account signups with email notifications

### Problem

Admins had no visibility into:
1. Who was using the free report feature (potential leads)
2. New user signups and their subscription status
3. Real-time alerts when new leads/signups occurred

### Solution

Built a comprehensive tracking system with three components:

**1. LeadsDashboard (`src/components/Admin/LeadsDashboard.tsx`)**
- Table showing all free report leads: email, website, AI score, citation rate, industry, competitors, date
- Search by email or website
- Filter by citation status and industry
- Sort by any column
- Summary stats: Total Leads, Cited count, Avg AI Score, Top Industry, This Week
- CSV export for CRM import

**2. SignupsDashboard (`src/components/Admin/SignupsDashboard.tsx`)**
- Table showing all user signups: name, email, plan, trial status, payment method, date
- Search by name or email
- Filter by plan type and payment status
- Sort by any column
- Summary stats: Total Users, Paid count, Active Trials, Payment Added, This Week
- CSV export

**3. SignupAnalytics (`src/components/Admin/SignupAnalytics.tsx`)**
- Pure CSS bar chart (no external library)
- Timeframe selector: 7d / 30d / 90d
- Shows leads and signups trend over time
- Aggregates by day (7d) or week (30d/90d)

**4. Email Notifications (`supabase/functions/notify-admin-lead/`)**
- Instant email to info@convologix.com on new lead or signup
- Beautiful HTML email template with key details
- Fire-and-forget pattern (doesn't block main flow)

### Files Changed

| File | Change |
|------|--------|
| `src/components/Admin/LeadsDashboard.tsx` | NEW - Admin leads dashboard |
| `src/components/Admin/SignupsDashboard.tsx` | NEW - Admin signups dashboard |
| `src/components/Admin/SignupAnalytics.tsx` | NEW - CSS-based trend chart |
| `supabase/functions/notify-admin-lead/index.ts` | NEW - Email notification edge function |
| `src/App.tsx` | Add routes for #admin-leads and #admin-signups |
| `src/components/Layout/Sidebar.tsx` | Add admin menu items |
| `src/components/FreeReport/FreeReportPage.tsx` | Call notify-admin-lead after saving lead |
| `src/services/authService.ts` | Call notify-admin-lead after signup |
| `src/types/index.ts` | Add FreeReportLead interface |

### Testing Performed

```
npm run test:run
Test Files  23 passed (23)
     Tests  708 passed (708)
```

**New Test Files:**
- `src/components/Admin/LeadsDashboard.test.tsx` (35 tests)
- `src/components/Admin/SignupsDashboard.test.tsx` (35 tests)
- `src/components/Admin/SignupAnalytics.test.tsx` (28 tests)
- Added 4 notification tests to `src/services/authService.test.ts`

### Deployment

```bash
# Edge function deployed
npx supabase functions deploy notify-admin-lead
```

### Admin Navigation

Admin users now see in sidebar:
- User Management (existing)
- Free Report Leads (new)
- Account Signups (new)

---

## 2026-01-21: AI Platform Readiness Feature

**Commit:** `ff07e58` - Add AI Platform Readiness feature

**Changes:** Added robots.txt AI crawler analysis and platform registration recommendations

### Problem

Users had no way to know:
1. Whether their website's robots.txt is blocking important AI crawlers
2. Which AI platform registrations could improve their visibility
3. The difference between search crawlers (important) and training crawlers (optional to block)

### Solution

Added a new "AI Platform Readiness" section to analysis results that shows:

**1. robots.txt AI Crawler Status**
- Fetches and parses the website's robots.txt
- Checks rules for 17 different AI crawlers
- Separates into Search Crawlers (important for visibility) and Training Crawlers (optional to block)
- Status: "Allowed", "Blocked", or "Not specified" (defaults to allowed)

**2. Platform Registrations**
- ChatGPT Merchant Portal (for e-commerce sites with Product schema)
- Bing Webmaster Tools (powers ChatGPT web browsing)
- Google Search Console (powers Gemini search)

**3. Overall Status**
- "Good" - No search crawlers blocked
- "Warning" - Some training crawlers blocked (optional)
- "Critical" - Search crawlers blocked (bad for visibility)

### AI Crawlers Checked

| Category | Crawlers |
|----------|----------|
| Search | OAI-SearchBot, PerplexityBot, ChatGPT-User, Applebot-Extended |
| Training | GPTBot, ClaudeBot, Claude-Web, anthropic-ai, Google-Extended, Googlebot-Extended, Meta-ExternalAgent, Meta-ExternalFetcher, FacebookBot, cohere-ai, Bytespider, CCBot, Diffbot |

### E-commerce Detection

Detects e-commerce sites by looking for Product schema markup. If found, recommends ChatGPT Merchant Portal registration.

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/crawl-website/index.ts` | Added `analyzeRobotsTxt()`, `analyzeAIReadiness()`, AI_CRAWLERS array |
| `supabase/functions/_shared/cors.ts` | Added localhost:5174 to allowed origins |
| `src/types/crawl.ts` | Added AIReadinessAnalysis, RobotsTxtAnalysis, AICrawlerRule types |
| `src/types/index.ts` | Added aiReadiness to Analysis.crawlData |
| `src/components/Analysis/AIReadinessSection.tsx` | New component for displaying results |
| `src/components/Analysis/AnalysisResults.tsx` | Import and render AIReadinessSection |
| `src/utils/analysisEngine.ts` | Pass through aiReadiness in crawlData mapping |
| `src/utils/analysis/aeoAnalysis.ts` | Pass through aiReadiness in crawlData mapping |
| `src/components/Analysis/NewAnalysis.tsx` | Fixed default providers to include all 4 |

### Testing Performed

```
npm run build → Passes
Test Files  20 passed (20)
     Tests  608 passed (608)
```

### Manual Testing

Tested on convologix.com:
- robots.txt has no AI crawler rules → All show "Not specified" → Status: Good
- No Product schema → ChatGPT Merchant Portal shows "Not applicable"
- Bing/Google recommendations show as applicable

### Deployment Required

```bash
npx supabase functions deploy crawl-website
npx supabase functions deploy check-citations  # For CORS fix
```

---

## 2026-01-21: Homepage Conversion Improvements

**Commit:** `128b5cd` - Improve homepage conversion with concrete example and outcomes

**Changes:** Added concrete example, emotional pain language, and free report outcome clarity

### Problem

The homepage copy was conceptually correct but abstract. Three gaps identified:
1. No concrete example to make the problem tangible
2. Language was accurate but not emotionally compelling
3. Users didn't know what they'd get from the free report

### Solution

**1. Added Concrete Example (after hero):**
```
When someone asks an AI assistant:
"What's the best project management tool for startups?"

AI returns 5 recommended tools with links.

If your brand isn't mentioned, customers never see you — even if you rank #1 on Google.
```

**2. Updated Emotional Pain Language:**
- Old: "If your brand isn't cited by AI assistants, you effectively don't exist in AI search results."
- New: "If AI doesn't mention your brand, **customers never see you** — even if your SEO is perfect."

**3. Added Free Report Outcomes (below CTA):**
- ✓ Where your site is cited
- ✓ Where competitors appear instead
- ✓ What pages AI actually reads
- ✓ Exactly what to fix first

### Files Changed

| File | Change |
|------|--------|
| `src/components/Landing/LandingPage.tsx` | Added example box, emotional copy, report outcomes |

### Testing Performed

```
npm run build → Passes
Test Files  20 passed (20)
     Tests  608 passed (608)
```

### Notes

- Example uses "an AI assistant" (generic) not "ChatGPT" since free report queries Perplexity
- Added "with links" to reflect Perplexity's citation behavior accurately

---

## 2026-01-21: Homepage AEO-Optimized Copy Rewrite

**Commit:** `7f55ac3` - Rewrite homepage with AEO-optimized copy

**Changes:** Complete rewrite of landing page copy to be AEO-optimized and better differentiate from SEO tools

### Problem

The original homepage copy:
1. Used generic "Dominate AI Search" messaging that didn't differentiate from SEO tools
2. Positioned the product as similar to existing SEO tools
3. Didn't clearly explain WHY traditional SEO doesn't work for AI search
4. Had "Start Free Trial" as primary CTA instead of the free report

### Solution

Complete rewrite of `LandingPage.tsx` with AEO-focused messaging:

**New Sections Added:**
| Section | Purpose |
|---------|---------|
| "The Search Landscape Has Fundamentally Changed" | Explains shift from links to AI answers |
| "Why Traditional SEO Is No Longer Enough" | Differentiates AEO from SEO |
| "Introducing Answer Engine Optimization (AEO)" | Positions as new category |
| "How AI Search Engines Decide What to Cite" | Educational content |
| "AI Visibility Score" | Explains scoring methodology |
| "Who Is This For?" | Target audience clarity |

**Key Copy Changes:**
| Element | Old | New |
|---------|-----|-----|
| Headline | "Dominate AI Search Before Your Competitors" | "Be Visible in AI-Generated Answers" |
| Brand Name | "LLM Navigator" | "LLM Search Insight" |
| Primary CTA | "Start Free Trial" | "Get Free Report" |
| Value Prop | Generic AI optimization | "AI search doesn't rank pages — it generates answers" |
| Positioning | AI-powered SEO tool | "Not an SEO tool. An AI visibility platform." |

**Messaging Highlights:**
- "They do not rank pages. They generate answers."
- "A page can rank #1 on Google — and still never appear in AI answers."
- "If your brand isn't cited by AI assistants, you effectively don't exist in AI search results."

### Files Changed

| File | Change |
|------|--------|
| `src/components/Landing/LandingPage.tsx` | Complete rewrite with new copy structure |

### Testing Performed

```
npm run build → Passes
Test Files  20 passed (20)
     Tests  608 passed (608)
```

### Notes

- Brand name updated from "LLM Navigator" to "LLM Search Insight" in landing page
- Free report is now the primary CTA (highlighted box in hero)
- Added new icons: Eye, LineChart, Briefcase, Building2, UserCircle

---

## 2026-01-21: Rate Limiting Test Coverage

**Commit:** `d8976c7` - Add rate limiting test coverage (608 tests)

**Changes:** Added comprehensive test coverage for API rate limiting and free report whitelist bypass

### Problem

Rate limiting logic for both the API and free report feature had no dedicated test coverage:
1. API rate limiting (per-minute, monthly limits, prompts validation) was untested
2. Free report whitelist bypass for `info@convologix.com` was untested

### Solution

**1. Created `src/services/apiRateLimiter.test.ts` (18 tests):**

| Test Suite | Tests |
|------------|-------|
| Per-minute Rate Limiter | First request allowed, 10/min limit, 11th blocked, retry-after header, window reset, per-user tracking, count increments |
| Monthly Usage Limit | Under limit (0, 100, 399) allowed, at limit (400) blocked, over limit blocked |
| Prompts Validation | Undefined/empty/non-array rejected, 1-10 allowed, >10 rejected |
| Rate Limit Constants | Verifies 10/min, 400/month, 10 prompts/request |

**2. Added whitelist bypass tests to `FreeReportPage.test.tsx`:**

```typescript
it('bypasses rate limiting for whitelisted email (info@convologix.com)')
it('bypasses rate limiting for whitelisted email (case insensitive)')
```

### Rate Limiting Logic Tested

| Limit Type | Value | Location |
|------------|-------|----------|
| Per-minute API calls | 10 requests/user | `supabase/functions/api/index.ts` |
| Monthly analyses | 400/month | Enterprise plan |
| Prompts per request | 10 max | API validation |
| Free report per email | 1/24 hours | `FreeReportPage.tsx` |
| Free report per website | 3/24 hours | `FreeReportPage.tsx` |
| Admin whitelist | Unlimited | `info@convologix.com` |

### Files Changed

| File | Change |
|------|--------|
| `src/services/apiRateLimiter.test.ts` | New test file (18 tests) |
| `src/components/FreeReport/FreeReportPage.test.tsx` | Added whitelist bypass tests |
| `TESTING.md` | Updated test count (608), added rate limiting sections |
| `DOCUMENTATION_INDEX.md` | Updated test count |
| `docs/CODE_INVENTORY.md` | Added new test file |

### Testing Performed

```
npm run test:run
Test Files  20 passed (20)
     Tests  608 passed (608)
```

---

## 2026-01-19: Free Report Rate Limiting Fix

**Changes:** Fixed rate limiting for free reports; added admin whitelist; created missing database table

### Problem

Rate limiting for free reports was not working. The `free_report_leads` table had no migration, so it either didn't exist or had no RLS policies allowing anonymous access.

### Solution

**1. Added admin whitelist:**
```typescript
const unlimitedEmails = ['info@convologix.com'];
const isUnlimited = unlimitedEmails.includes(email.toLowerCase());
```

**2. Fixed error handling:**
- Database query errors were being silently ignored
- Now logs errors to console for debugging
- Rate limiting only blocks if query succeeds AND finds records

**3. Created migration for `free_report_leads` table:**
- Columns: id, email, website, is_cited, ai_score, citation_rate, industry, competitor_count, created_at
- Indexes on (email, created_at) and (website, created_at) for efficient queries
- RLS policies: anonymous users can INSERT and SELECT

### Rate Limiting Rules

| Check | Limit | Bypass |
|-------|-------|--------|
| Same email | 1 per 24 hours | Whitelisted emails |
| Same website | 3 per 24 hours | Whitelisted emails |

### Files Changed

| File | Change |
|------|--------|
| `src/components/FreeReport/FreeReportPage.tsx` | Whitelist + error handling |
| `supabase/migrations/20260119_create_free_report_leads.sql` | New table |
| `src/types/database.ts` | TypeScript types |

### Testing Performed

```
npm run build → Passes
Test Files  19 passed (19)
     Tests  588 passed (588)
```

### Deployment Required

```bash
npx supabase db push
```

---

## 2026-01-19: Email Report White Theme + Competitors Card

**Changes:** Email report switched to white background for printing; added "Competitors Found" score card

### Problem

1. Email reports had dark background - difficult to print
2. Email was missing the "Competitors Found" count card that the web report shows

### Solution

**White Theme for Email:**
- Body background: `#0f172a` → `#f8fafc` (light gray)
- Main card: `#1e293b` → `#ffffff` (white)
- Score cards: `#0f172a` → `#f1f5f9` (light gray)
- Text colors: inverted for readability on light background
- Borders: `#334155` → `#e2e8f0` (light gray)
- Alert boxes: dark gradients → light backgrounds (`#fef2f2`)

**Added Competitors Found Card:**
- Now shows 3 score cards matching web report: AI Visibility Score, Citation Rate, Competitors Found
- Color-coded: green (0), yellow (1-3), red (>3 competitors)

**Note:** Web app (`FreeReportPage.tsx`) remains dark - only email template changed.

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/send-free-report-email/index.ts` | White theme + competitors card |

### Testing Performed

```
npm run build → Passes
Test Files  19 passed (19)
     Tests  588 passed (588)
```

### Deployment Required

```bash
npx supabase functions deploy send-free-report-email
```

---

## 2026-01-19: Free Report Competitor Analysis + 4 AI Providers

**Changes:** Free report now shows competitor data; updated all marketing copy to reference 4 AI providers

### Problem

Free reports showed "Competitors Found: 0" even when competitors were being cited. The main app analysis showed competitors correctly.

### Root Cause

- **Free Report** used `providers: ['openai']`
- **Main App** used `providers: ['perplexity', 'openai', 'anthropic']`

OpenAI mentions companies by **name** (e.g., "Zapier", "HubSpot") without URLs. The competitor extraction only looks for URLs/domains, so it found nothing.

Perplexity uses `return_citations: true` which returns **actual source URLs** that get extracted as competitors.

### Solution

Changed free report to use Perplexity instead of OpenAI:

```typescript
// Before
providers: ['openai']

// After
providers: ['perplexity']
```

**Bonus:** Perplexity is ~4x cheaper than OpenAI ($0.003 vs $0.015 per 1K input tokens).

### Additional Changes

Updated all marketing copy to reference 4 AI providers (added Gemini):

| File | Text Updated |
|------|--------------|
| `LandingPage.tsx` | Hero text + Multi-Provider Testing section |
| `FreeReportPage.tsx` | Meta description, "Powered by" text, CTA copy |
| `ContactPage.tsx` | FAQ section |
| `PricingTiers.tsx` | FAQ section |
| `CompetitorStrategy.tsx` | No data message |

### Testing Performed

```
npm run build → Passes
Test Files  19 passed (19)
     Tests  588 passed (588)
```

---

## 2026-01-19: Rename App to LLM Navigator

**Commit:** `Rename app from LLM Search Insight to LLM Navigator`

### Context

The app was previously branded as "LLM Search Insight" but LinkedIn posts and marketing materials refer to it as "LLM Navigator". Renamed the product to align with existing marketing while keeping the domain `llmsearchinsight.com` (good for SEO keywords).

### Branding Strategy

| Element | Value |
|---------|-------|
| **Product Name** | LLM Navigator |
| **Domain** | llmsearchinsight.com |
| **Tagline** | Answer Engine Optimization |
| **Entity Statement** | "LLM Navigator is an AI search visibility platform created by Convologix." |

### Changes

Renamed "LLM Search Insight" to "LLM Navigator" in:

| File | Location |
|------|----------|
| `src/components/Landing/LandingPage.tsx` | Header logo, footer copyright, entity statement |
| `src/components/Layout/Sidebar.tsx` | Dashboard sidebar logo |
| `src/components/FreeReport/FreeReportPage.tsx` | Page title, header logo |
| `supabase/functions/send-free-report-email/index.ts` | Email header, footer, "from" field |

**Already had correct name:**
- `index.html` (page title was already "LLM Navigator")
- Legal pages (Privacy, Terms, DPA)

### Testing Performed

```
npm run test:run

Test Files  19 passed (19)
     Tests  588 passed (588)
  Duration  16.63s
```

Build: Passes

### Deployment Note

After committing, deploy the email edge function:
```bash
npx supabase functions deploy send-free-report-email
```

---

## 2026-01-19: Fix Privacy and Terms Page Readability

**Commit:** `Fix Privacy and Terms pages text readability`

### Context

The Privacy Policy and Terms of Service pages had unreadable text. The `prose-invert` Tailwind Typography class wasn't working correctly, resulting in dark text on a light/transparent background.

### Problem

- Text appeared as dark gray on a semi-transparent background
- The `prose-invert` class relies on Tailwind's typography plugin configuration
- Semi-transparent `bg-slate-800/50` wasn't providing enough contrast

### Solution

Replaced the `prose` approach with explicit Tailwind utility classes:

1. **Solid background**: Changed `bg-slate-800/50` to `bg-slate-800` for consistent dark background
2. **Explicit text colors**:
   - Body text: `text-slate-200` (light gray, high contrast)
   - Headings (h2): `text-white` + `text-2xl font-bold`
   - Subheadings (h3): `text-slate-100` + `text-xl font-semibold`
   - Emphasized text: `text-white font-semibold`
   - Links: `text-indigo-400 hover:text-indigo-300`
3. **Structured layout**: Wrapped sections in `<section>` tags with `space-y-6`
4. **List styling**: Added `list-disc list-inside space-y-2 ml-4`

### Files Changed

| File | Change |
|------|--------|
| `src/components/Legal/TermsOfService.tsx` | Replace prose with explicit Tailwind classes |
| `src/components/Legal/PrivacyPolicy.tsx` | Replace prose with explicit Tailwind classes |

### Testing Performed

```
npm run test:run

Test Files  19 passed (19)
     Tests  588 passed (588)
  Duration  16.46s
```

Build: Passes

### Result

Both pages now have:
- High contrast text (light gray on dark slate background)
- Clear visual hierarchy (white headings, gray body text)
- Consistent styling with the rest of the app's dark theme

---

## 2026-01-19: Remove Static SEO HTML, Add Asset Pass-through Rules

**Commit:** `Remove static free-report HTML, add asset pass-through rules`

### Context

The `force = true` on the Netlify SPA redirect was breaking the app by redirecting asset requests (`/assets/*.js`, `/assets/*.css`) to `index.html`, causing MIME type errors.

### Problem

Console errors showed:
- "Failed to load module script: Expected JavaScript but got text/html"
- "Refused to apply style: MIME type text/html is not supported"

### Solution

1. **Added pass-through rules** for static assets before the catch-all redirect:
   ```toml
   [[redirects]]
     from = "/assets/*"
     to = "/assets/:splat"
     status = 200
   ```

2. **Removed static HTML** at `public/free-report/index.html` since it was never being served anyway (due to `force = true`)

3. **Updated tests** to reflect new configuration

### Files Changed

| File | Change |
|------|--------|
| `netlify.toml` | Add pass-through rules for /assets/*, /sitemap.xml, /robots.txt |
| `public/free-report/` | Deleted (static HTML no longer needed) |
| `src/utils/staticPages.test.ts` | Remove HTML tests, add asset pass-through tests |
| `ARCHITECTURE.md` | Update public/ folder structure and Netlify docs |

### Testing Performed

```
npm run test:run

Test Files  19 passed (19)
     Tests  588 passed (588)
  Duration  16.46s
```

Build: Passes

---

## 2026-01-18: Fix Stripe Customer Name and Payment Method Storage

**Commit:** `Fix Stripe customer name and payment method storage for recurring billing`

### Context

After testing live payments, two issues were identified in the Stripe dashboard:
1. Customer name from the card form wasn't being saved to the Stripe Customer
2. Payment methods weren't being saved for future recurring charges (column showed empty)

### Root Cause

1. **Name issue:** The edge function created Stripe Customers with only email, ignoring the cardholder name entered in the payment form
2. **Payment method issue:** PaymentIntent was created without `setup_future_usage`, so the card wasn't saved to the customer for future billing

### Changes & Reasoning

#### 1. PaymentService (`src/services/paymentService.ts`)

Added optional `customerName` parameter to `createPaymentIntent()`:

```typescript
static async createPaymentIntent(
  userId: string,
  plan: string,
  email: string,
  customerName?: string  // NEW
): Promise<...>
```

Passes `customerName` in metadata to edge function.

#### 2. CreditCardForm (`src/components/Payment/CreditCardForm.tsx`)

Now passes `cardName` (cardholder name) to PaymentService:

```typescript
const result = await PaymentService.createPaymentIntent(
  userId,
  plan,
  userEmail,
  cardName // Pass cardholder name for Stripe customer
);
```

#### 3. Edge Function (`supabase/functions/create-payment-intent/index.ts`)

Two fixes:

**A. Customer name handling:**
- Extract `customerName` from metadata
- Pass name when creating new customer: `name: customerName || undefined`
- Update existing customer's name if different

**B. Save payment method for recurring:**
```typescript
const paymentIntent = await stripe.paymentIntents.create({
  // ...existing params
  setup_future_usage: 'off_session', // NEW - saves card for future charges
});
```

### Files Changed

| File | Change |
|------|--------|
| `src/services/paymentService.ts` | Add `customerName` parameter |
| `src/components/Payment/CreditCardForm.tsx` | Pass `cardName` to service |
| `supabase/functions/create-payment-intent/index.ts` | Save customer name + payment method |

### Testing Performed

```
npm run test:run && npm run build

Test Files  18 passed (18)
     Tests  577 passed (577)
  Duration  16.73s
```

Build: Passes

### Deployment

- Edge function deployed: `npx supabase functions deploy create-payment-intent`
- Frontend: Push triggers Netlify deploy

### Result

Future payments will show in Stripe dashboard:
- Customer name (from card form)
- Email address
- Saved payment method (for recurring billing)

---

## 2026-01-18: Fix 403 Error on Payment Record Insert

**Commit:** `Remove redundant frontend payment INSERT - webhook handles it`

### Context

After a successful payment, the console showed:
```
[Database] [LIVE] INSERT payment record on payments - Failed
Failed to load resource: the server responded with a status of 403 ()
[Database] [LIVE] INSERT payment record on payments - Success
```

The payment succeeded, but there was a 403 error followed by success. Investigation revealed the frontend was trying to INSERT into `payments` table, which was blocked by RLS.

### Root Cause

The `payments` table RLS policies only allow:
- **SELECT** for authenticated users (read own payments)
- **ALL** for service_role only

There was **no INSERT policy for authenticated users**. The frontend INSERT failed (403), but the Stripe webhook (using service_role) succeeded - creating duplicate attempts.

### Solution

Removed the redundant frontend INSERT from `handlePaymentSuccess()`. The Stripe webhook already handles payment recording with proper service_role credentials.

**Before:**
```
Frontend: UPDATE users (subscription) ✓
Frontend: INSERT payments ✗ (403 - no RLS policy)
Webhook:  INSERT payments ✓ (service_role)
```

**After:**
```
Frontend: UPDATE users (subscription) ✓
Webhook:  INSERT payments ✓ (service_role)
```

### Why This Approach

Two options were considered:
1. Add INSERT policy for authenticated users
2. Remove frontend INSERT (let webhook handle it)

**Chose option 2** because:
- Single source of truth (webhook only)
- No duplicate insert attempts
- Service role is more secure for payment records
- Webhook is the canonical source for Stripe events

### Files Changed

| File | Change |
|------|--------|
| `src/services/paymentService.ts` | Remove INSERT into `payments` from `handlePaymentSuccess()` |

### Testing Performed

```
npm run test:run && npm run build

Test Files  18 passed (18)
     Tests  577 passed (577)
  Duration  16.38s
```

Build: Passes

### Data Flow Clarification

| Data | Table | Updated By | Persists Across Logins |
|------|-------|------------|------------------------|
| Subscription level | `users` | Frontend | Yes |
| Payment history | `payments` | Webhook | Yes |

The subscription is stored in `users` table and fetched fresh on every login via `AuthService.getCurrentSession()`.

---

## 2026-01-18: Add SEO Files (sitemap.xml, robots.txt)

**Commit:** `Add sitemap.xml and robots.txt for SEO`

### Context

Adding standard SEO files to improve search engine discoverability for the public-facing pages.

### Files Added

| File | Purpose |
|------|---------|
| `public/sitemap.xml` | Lists public pages for search engine crawlers |
| `public/robots.txt` | Allows all crawlers, references sitemap |

### Sitemap Contents

| URL | Priority |
|-----|----------|
| `/` (landing) | 1.0 |
| `/free-report` | 0.9 |
| `/pricing` | 0.9 |
| `/login` | default |
| `/signup` | default |
| `/privacy` | default |
| `/terms` | default |

### Testing Performed

```
npm run test:run

Test Files  18 passed (18)
     Tests  577 passed (577)
  Duration  16.48s
```

Build: Static files in `public/` are served as-is by Netlify.

---

## 2026-01-18: Fix Email CTA Link to Use Custom Domain

**Commit:** `Fix free report email CTA to use llmsearchinsight.com`

### Context

The free report email "Start Free Trial" button was linking to the old Netlify subdomain (`lucent-elf-359aef.netlify.app`) instead of the custom domain (`llmsearchinsight.com`).

### Changes

| File | Change |
|------|--------|
| `supabase/functions/send-free-report-email/index.ts` | Update CTA href to `https://llmsearchinsight.com/#auth` |
| `README.md` | Update deployment URL to custom domain |
| `ARCHITECTURE.md` | Update deployment URL to custom domain |

### Deployment Required

```bash
npx supabase functions deploy send-free-report-email
```

### Testing Performed

```
npm run test:run

Test Files  18 passed (18)
     Tests  577 passed (577)
  Duration  16.63s
```

---

## 2026-01-19: Fix /free-report Route and Update AI Models

**Commit:** `Fix /free-report to show React form, update AI models to latest versions`

### Context

Multiple issues were discovered and fixed in this session:
1. The `/free-report` page was showing static HTML instead of the React form
2. AI models in check-citations were outdated (Gemini 1.5 and Claude 3 Haiku were retired)
3. The `handleHashChange` function was overriding path-based routes
4. Netlify was serving static files even without explicit redirects

### Problem 1: Static HTML Blocking React Form

Even after removing the explicit redirect, Netlify was serving `public/free-report/index.html` because it physically existed at `dist/free-report/index.html`. The SPA redirect didn't take precedence over static files.

### Problem 2: handleHashChange Overriding Path Routes

When visiting `/free-report`, the `handleHashChange` function ran and set `activeSection` to `'landing'` because there was no hash, overriding the initial path-based detection.

### Solution

1. **Added `force = true` to SPA redirect** - Forces SPA to handle all routes even when static files exist:
   ```toml
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
     force = true
   ```
2. **Fixed handleHashChange** - Now checks pathname before defaulting to 'landing'
3. **Updated static HTML** - Added Gemini mention for SEO crawlers
4. **Updated AI models** - See separate entry below

### Why `force = true`?

By default, Netlify serves static files if they exist, even with SPA redirects configured. The `force = true` flag tells Netlify to apply the redirect rule regardless of whether a matching static file exists. This is critical for SPAs where you want React Router (or hash-based routing) to handle all paths.

### Files Changed

| File | Change |
|------|--------|
| `netlify.toml` | Add `force = true` to SPA catch-all redirect |
| `src/App.tsx` | Fix handleHashChange to respect path-based routes |
| `public/free-report/index.html` | Add Gemini to all mentions |
| `src/utils/staticPages.test.ts` | Update test expectations |

### Testing Performed

```
npm run test:run

Test Files  19 passed (19)
     Tests  606 passed (606)
  Duration  17.36s
```

Build: Passes

### User Flow After Deploy

```
/free-report → Netlify forces SPA → React FreeReportPage → Form works
```

### Note on Static HTML

The static HTML at `public/free-report/index.html` is still useful for:
- SEO crawlers that don't execute JavaScript
- Social media previews (Open Graph tags)
- Search engine indexing

With `force = true`, users always get the React app, while crawlers that fetch the raw HTML still see SEO-optimized content.

---

## 2026-01-19: Update AI Models to Latest Versions

**Commit:** `Update AI models to latest versions (GPT-5.2, Claude Haiku 4.5, Sonar Pro, Gemini 2.5)`

### Context

The check-citations edge function was using outdated AI models, some of which have been retired and were returning errors. Updated all providers to their current flagship models.

### Problem

| Provider | Old Model | Status |
|----------|-----------|--------|
| OpenAI | `gpt-4o` | 2 generations behind |
| Anthropic | `claude-3-haiku-20240307` | **RETIRED** July 2025 |
| Perplexity | `sonar` | Working but basic |
| Gemini | `gemini-1.5-flash` | **RETIRED** April 2025 (404 errors) |

### Solution

Updated all models to current versions:

| Provider | New Model | Benefit |
|----------|-----------|---------|
| OpenAI | `gpt-5.2` | Matches what ChatGPT users actually query |
| Anthropic | `claude-haiku-4-5-20251016` | Latest Haiku, not retired |
| Perplexity | `sonar-pro` | Better retrieval and reasoning |
| Gemini | `gemini-2.5-flash` | Actually works (1.5 was retired) |

### Cost Impact

Updated cost estimates in the COSTS object:
- OpenAI: $0.015/$0.06 per 1K tokens (was $0.01/$0.03)
- Anthropic: $0.001/$0.005 per 1K tokens (was $0.003/$0.015)
- Perplexity: $0.003/$0.015 per 1K tokens (was $0.001/$0.001)
- Gemini: $0.00025/$0.001 per 1K tokens (similar)

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/check-citations/index.ts` | Update all 4 model versions + cost estimates |

### Testing Performed

```
npm run test:run

Test Files  19 passed (19)
     Tests  606 passed (606)
  Duration  16.53s
```

### Deployment Required

```bash
npx supabase functions deploy check-citations
```

---

## 2026-01-18: Convert /free-report to Real SEO Route

**Commit:** `Convert #free-report hash route to real /free-report path for SEO`

### Context

The free report section was only accessible via hash URL (`/#free-report`), which search engines cannot index. Converted to a real path-based route (`/free-report`) that Google can crawl and index.

### Problem

- Hash-based URLs (`/#free-report`) are not indexable by search engines
- The free report feature had no SEO presence
- Potential organic traffic was being missed

### Solution

1. **Path-based routing**: Updated App.tsx to detect `/free-report` pathname and render FreeReportPage
2. **SEO metadata**: Added useEffect in FreeReportPage to set title, meta description, and canonical URL
3. **Link updates**: Changed all `/#free-report` links to `/free-report` in LandingPage and static HTML
4. **Legacy redirect**: Added client-side redirect from `#free-report` to `/free-report` for old links
5. **Static fallback**: Kept static HTML page for non-JS crawlers

### Architecture

```
/free-report (browser request)
      ↓
Netlify serves → static HTML (for crawlers)
      ↓
React hydrates → FreeReportPage component
      ↓
SEO metadata set via useEffect
```

Old links handled gracefully:
```
/#free-report → window.location.replace('/free-report')
```

### Files Changed

| File | Change |
|------|--------|
| `src/App.tsx` | Add pathname detection for /free-report, add #free-report redirect |
| `src/components/FreeReport/FreeReportPage.tsx` | Add SEO metadata useEffect |
| `src/components/Landing/LandingPage.tsx` | Update links to /free-report |
| `public/free-report/index.html` | Update CTA link to /free-report |
| `src/utils/staticPages.test.ts` | Update test expectations |

### SEO Features

| Feature | Implementation |
|---------|---------------|
| Title | `document.title = 'Free AI Visibility Report \| LLM Search Insight'` |
| Meta description | Set via DOM manipulation in useEffect |
| Canonical URL | `https://llmsearchinsight.com/free-report` |
| Static fallback | `public/free-report/index.html` for non-JS crawlers |

### Testing Performed

```
npm run test:run

Test Files  19 passed (19)
     Tests  606 passed (606)
  Duration  16.53s
```

### Verification After Deploy

```
[ ] Visit /free-report → React component renders
[ ] curl -I https://llmsearchinsight.com/free-report → HTTP 200
[ ] View source shows static HTML (for SEO crawlers)
[ ] Click CTA buttons on landing page → navigates to /free-report
[ ] Visit /#free-report → redirects to /free-report
[ ] Google Search Console can fetch the page
```

---

## 2026-01-18: Add Static SEO Landing Page for /free-report

**Commit:** `Add static /free-report landing page for SEO indexing`

### Context

Created initial static HTML landing page at `/free-report` that Google can crawl and index. This provides a fallback for non-JS crawlers.

### Problem

- Hash-based URLs (`/#free-report`) are not indexable by search engines
- The free report feature had no SEO presence
- Potential organic traffic was being missed

### Solution

Created a static HTML page served directly by Netlify (before SPA catch-all), containing:
- SEO meta tags (title, description, canonical URL)
- Open Graph and Twitter Card tags
- H1 heading and feature list
- CTA button linking to `/#free-report`
- No JavaScript required to render content

### Architecture

```
/free-report (browser request)
      ↓
Netlify checks redirects in order:
  1. /free-report → /free-report/index.html (200) ✓ MATCH
  2. /* → /index.html (200) ← skipped
      ↓
Static HTML served (indexable by Google)
      ↓
User clicks CTA → /#free-report
      ↓
SPA loads and handles hash route
```

### Files Changed

| File | Change |
|------|--------|
| `public/free-report/index.html` | NEW - Static SEO landing page |
| `netlify.toml` | Add redirect rule before SPA catch-all |
| `src/utils/staticPages.test.ts` | NEW - Unit tests for static pages |
| `ARCHITECTURE.md` | Document public/ folder structure |

### SEO Features

| Feature | Implementation |
|---------|---------------|
| Title | `<title>Free AI Visibility Report \| LLM Search Insight</title>` |
| Meta description | AI-generated answers, ChatGPT, Claude, Perplexity |
| Canonical URL | `https://llmsearchinsight.com/free-report` |
| Open Graph | og:title, og:description, og:type, og:url |
| Twitter Card | twitter:card, twitter:title, twitter:description |
| Mobile | Viewport meta tag, responsive CSS |

### Testing Performed

```
npm run test:run

Test Files  19 passed (19)
     Tests  606 passed (606)
  Duration  16.58s
```

New tests added: 29 tests in `staticPages.test.ts` covering:
- File existence
- SEO meta tags
- Content requirements
- Technical requirements
- Navigation links
- Sitemap validation
- robots.txt validation
- Netlify redirect ordering

### Verification After Deploy

```
[ ] curl -I https://llmsearchinsight.com/free-report → HTTP 200
[ ] View source shows real HTML (not SPA shell)
[ ] CTA button navigates to /#free-report
[ ] Google Search Console can fetch the page
```

---

## 2026-01-18: Update Free Report Form Label

**Commit:** `Change "Work Email" to "Email" on free report page`

### Context

The free report form label said "Work Email" which may discourage users with personal email addresses. Changed to simply "Email" to be more inclusive.

### Files Changed

| File | Change |
|------|--------|
| `src/components/FreeReport/FreeReportPage.tsx` | Change label from "Work Email" to "Email" |

---

## Template for Future Entries

```markdown
## YYYY-MM-DD: Commit title

**Commit:** `Full commit message`

### Context
Why was this change needed? What problem did it solve?

### Changes & Reasoning
For each significant change:
- What was the problem?
- What solution was chosen?
- Why this approach over alternatives?

### Files Changed
| File | Change Type | Reason |
|------|-------------|--------|

### Testing Performed
What tests were run to verify the changes?

### Related Issues
Links to issues, bugs, feature requests
```
