# ADR-001: Implement Real Website Crawling via Edge Function

**Date:** 2024-12-30
**Status:** Accepted
**Deciders:** Product team

## Context

The original implementation of LLM Navigator used **simulated/mock data** for all website analyses, including paid users. This created several problems:

1. **No real value delivery** - Paid users received random scores, not actual analysis
2. **Recommendations were generic** - "Implement Schema Markup" instead of specific, actionable guidance
3. **Credibility issue** - Users would quickly realize the tool wasn't analyzing their actual site
4. **No differentiation** - Nothing to justify paid tiers over free

The Reddit community feedback (r/AskMarketing) confirmed that SEO professionals are skeptical of "AI fluff" tools and want **real, actionable data**.

## Decision

Implement real website crawling via a Supabase Edge Function that:

1. **Actually fetches** the target URL
2. **Parses HTML** to extract real data
3. **Calculates metrics** based on actual content
4. **Generates specific recommendations** tied to findings

### Architecture

```
Frontend → AnalysisEngine → crawl-website Edge Function → Real Website
                                      ↓
                               Parse HTML, extract:
                               - Title, meta, headings
                               - Schema.org markup
                               - BLUF patterns
                               - Keyword placement
                                      ↓
                               Return CrawlData
                                      ↓
                          Calculate real metrics
                          Generate specific recs
```

### Why Edge Function (not client-side)?

1. **CORS** - Browsers block cross-origin fetches to arbitrary websites
2. **Security** - Keeps any future API keys server-side
3. **Cost control** - Can add rate limiting at the server level
4. **Reliability** - Server-side fetch is more reliable than client

### Why Deno (Supabase Edge Functions)?

1. **Already using Supabase** - No new infrastructure
2. **deno-dom** - Good HTML parsing library available
3. **Cost** - Edge functions are cheap/free at low volume
4. **Deployment** - Simple `supabase functions deploy`

## Alternatives Considered

### 1. Client-side crawling via proxy
**Rejected** - Adds complexity, still has CORS issues, exposes proxy to abuse

### 2. Third-party crawling service (ScrapingBee, etc.)
**Rejected for now** - Adds cost and dependency. Can reconsider if we need JavaScript rendering.

### 3. Full Puppeteer/Playwright setup
**Rejected for now** - Overkill for basic HTML parsing. Current approach handles static HTML well. Can add later for JS-heavy sites.

## Consequences

### Positive
- Paid users now receive **real, actionable data**
- Recommendations cite **specific findings** from their site
- Metrics reflect **actual content quality**
- Clear value differentiation between free (simulated) and paid (real)

### Negative
- Edge function adds ~1-3 seconds to analysis time
- Some sites may block the crawler (user-agent detection)
- JavaScript-rendered content won't be captured (static HTML only)

### Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Site blocks crawler | Return partial data, add retry logic |
| Slow/timeout sites | 10-second timeout, graceful degradation |
| Edge function costs | Monitor usage, add caching if needed |
| JS-rendered sites | Document limitation, consider Puppeteer later |

## Implementation Details

### Files Created/Modified
- **NEW:** `supabase/functions/crawl-website/index.ts`
- **NEW:** `src/types/crawl.ts`
- **MODIFIED:** `src/utils/analysisEngine.ts`

### Key Metrics Calculated (from real data)
| Metric | Based On |
|--------|----------|
| Content Clarity | Readability score + BLUF score + heading structure |
| Structured Data | Actual schema.org markup found |
| Semantic Richness | Word count + paragraph depth |
| Natural Language | Sentence length patterns |
| Keyword Relevance | Keyword placement in title/H1/meta |

### Recommendation Examples (now specific)
- Before: "Implement Schema Markup"
- After: "Found 3 question-style headings. Convert these to FAQPage schema for better AI visibility."

## Validation

Tested against `www.convologix.com`:
- Successfully fetched 111KB HTML in ~1.2 seconds
- Detected WebSite schema
- Identified missing meta description
- Generated specific recommendations based on findings

## Related Decisions

- Future: ADR-XXX - LLM Citation Checking (query Perplexity/ChatGPT to see if site is cited)
- Future: ADR-XXX - JavaScript rendering support (Puppeteer)

---

*Template based on [Michael Nygard's ADR format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)*
