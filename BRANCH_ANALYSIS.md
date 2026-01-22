# Branch Analysis & Explainer Log

> This document tracks significant changes, their reasoning, and test results.
> Archive: `BRANCH_ANALYSIS_2025-09_to_2026-01.md` (Sep 2025 - Jan 2026)

---

## 2026-01-21: Homepage Conversion Improvements

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
