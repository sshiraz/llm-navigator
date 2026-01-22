# Sales & Marketing Plan: LLM Navigator

> Last updated: 2026-01-17
> Target: SMBs needing AI search visibility
> Budget assumption: Bootstrap/lean ($500-2000/month to start)

---

## Executive Summary

**Goal:** Acquire first 100 paying customers in 90 days

**Strategy:** Lead with a high-value free analysis that delivers *personalized, actionable insights* — not generic reports. Convert via email nurture and retargeting.

**Primary Channels:**
1. Google Ads (high intent) — 40% of budget
2. LinkedIn Ads (B2B targeting) — 30% of budget
3. Facebook/Instagram (retargeting only) — 20% of budget
4. Content/SEO (organic) — 10% of budget + time

**Why NOT lead with Facebook Ads:**
Facebook is great for B2C and retargeting, but cold B2B acquisition is expensive and low-intent. Start with Google (people searching for solutions) and use Facebook for retargeting warm leads.

---

## Part 1: The Free Analysis Funnel

### Current Problem

Generic free reports don't convert because:
- Users get surface-level info they could find themselves
- No "aha moment" — nothing surprising or valuable
- No urgency to upgrade

### The Solution: Personalized AI Visibility Audit

Instead of generic pointers, deliver a **custom report that feels like $500 of consulting for free**.

#### What to Include in Free Analysis

| Section | What It Shows | Why It's Valuable |
|---------|---------------|-------------------|
| **AI Citation Status** | "ChatGPT mentioned you 2/5 times for '[keyword]'" | Concrete, specific data |
| **Exact Quote** | The actual AI response mentioning (or not mentioning) them | Proof, not claims |
| **Competitor Snapshot** | "These 3 competitors ARE being cited instead of you" | Creates urgency/FOMO |
| **Citation Gap Score** | "You're missing from 73% of relevant AI queries" | Quantified problem |
| **#1 Quick Win** | "Add FAQ schema to your pricing page" | Actionable, specific |
| **Revenue Impact** | "Estimated missed traffic: 340 visits/month" | Ties to money |

#### The "Aha Moment"

The report should make them think:
> "Holy shit, my competitor is getting recommended by ChatGPT and I'm not. I'm losing business RIGHT NOW."

Not:
> "Here are 10 generic tips to improve your AI visibility."

### Technical Implementation

You already have the free report at `#free-report`. Enhance it:

```typescript
// Current: Single generic prompt
const prompt = `What are the best ${brandName} alternatives?`;

// Better: Multiple targeted prompts based on industry detection
const prompts = [
  `Best ${industry} software for small businesses`,
  `${brandName} vs competitors comparison`,
  `Top ${industry} tools in 2026`,
  `Is ${brandName} worth it?`,
  `${brandName} alternatives and competitors`
];
```

#### Industry Detection

Auto-detect industry from domain to personalize prompts:

```typescript
async function detectIndustry(domain: string): Promise<string> {
  // Option 1: Use your crawl-website function to analyze content
  // Option 2: Simple keyword matching from meta description
  // Option 3: Ask user during signup (adds friction but more accurate)
}
```

#### Competitor Discovery

Show WHO is beating them:

```typescript
// Extract competitors mentioned in AI responses
const competitorsMentioned = extractCompetitors(aiResponse);

// Display: "While you weren't mentioned, these competitors were:"
// - Competitor A (mentioned 4/5 times)
// - Competitor B (mentioned 3/5 times)
// - Competitor C (mentioned 2/5 times)
```

---

## Part 2: Channel Strategy

### Channel 1: Google Ads (40% of budget)

**Why:** Highest intent. People searching "AI search optimization" or "ChatGPT SEO" are actively looking for solutions.

#### Campaign Structure

| Campaign | Keywords | Landing Page | CPA Target |
|----------|----------|--------------|------------|
| Brand Awareness | "AEO tools", "AI search optimization" | Free analysis | $15-25 |
| Problem Aware | "ChatGPT not showing my business" | Free analysis | $10-20 |
| Competitor | "Profound alternative", "Otterly alternative" | Comparison page | $20-30 |
| Local | "local business AI visibility" | Free analysis | $10-15 |

#### Sample Ad Copy

**Headline:** Is ChatGPT Recommending Your Competitors?
**Description:** Free AI Visibility Audit. See exactly what AI says about your business in 60 seconds. No credit card required.
**CTA:** Get Free Analysis

**Headline:** Your Competitors Are in ChatGPT. Are You?
**Description:** 60% of searches now go to AI. Find out if you're being recommended — or ignored. Free instant analysis.
**CTA:** Check My Visibility

### Channel 2: LinkedIn Ads (30% of budget)

**Why:** Best B2B targeting. Can target by job title, company size, industry.

#### Targeting

| Audience | Job Titles | Company Size |
|----------|------------|--------------|
| Marketers | Marketing Manager, Digital Marketing, SEO | 10-200 employees |
| Founders | Founder, CEO, Owner | 1-50 employees |
| Agencies | Agency Owner, Account Manager | 2-50 employees |

#### Ad Format

**Best performing:** Single image ads with clear value prop
**Second best:** Carousel showing the analysis process

#### Sample Ad

**Image:** Screenshot of your analysis dashboard showing "Citation Score: 23%"
**Headline:** Your Business Might Be Invisible to AI Search
**Body:** ChatGPT, Perplexity, and Claude now influence 60% of buying decisions. We analyzed 10,000 businesses — most aren't being recommended. Get your free AI Visibility Score in 60 seconds.
**CTA:** Get Free Analysis

### Channel 3: Facebook/Instagram (20% of budget)

**Strategy:** Retargeting ONLY. Don't do cold acquisition on Facebook.

#### Retargeting Audiences

| Audience | Definition | Ad Message |
|----------|------------|------------|
| Visited, didn't analyze | Hit landing page, no conversion | "Still curious? Your free analysis is waiting" |
| Analyzed, didn't signup | Completed free analysis | "You're missing 73% of AI citations. Here's how to fix it." |
| Signed up, didn't pay | Created account, no payment | "Your trial is waiting. Start tracking for $29/mo" |
| Churned users | Cancelled in last 90 days | "We've added 3 new AI engines. Come back and see." |

#### Why Not Cold Facebook Ads?

- B2B targeting is weak (no job title targeting like LinkedIn)
- Low intent (people scrolling, not searching)
- High CPMs for business audiences
- Works better for B2C, e-commerce, local

**Exception:** If targeting local businesses (restaurants, salons, etc.), Facebook can work because owners are on Facebook personally.

### Channel 4: Content/SEO (10% budget + time)

**Long-term play.** Takes 3-6 months but compounds.

#### Content Strategy

| Content Type | Topic Examples | Goal |
|--------------|----------------|------|
| **Blog posts** | "How to get mentioned by ChatGPT" | Organic traffic |
| **Comparison pages** | "LLM Navigator vs Profound" | Capture competitor searches |
| **Tool roundups** | "Best AEO tools for small business" | Get featured, build links |
| **Case studies** | "How [Customer] increased AI citations 340%" | Social proof, conversions |

#### Quick Win: Create Comparison Pages

For each competitor, create a page:
- `/compare/profound` — "LLM Navigator vs Profound: SMB-Friendly Alternative"
- `/compare/otterly` — "LLM Navigator vs Otterly: Privacy-First AEO"
- `/compare/rank-prompt` — "LLM Navigator vs Rank Prompt: Feature Comparison"

These rank for "[competitor] alternative" searches.

---

## Part 3: The Funnel

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWARENESS                                │
│   Google Ads → LinkedIn Ads → Content/SEO → Social              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      FREE ANALYSIS (Lead Magnet)                │
│   - Enter email + website URL                                   │
│   - Get personalized AI visibility report                       │
│   - See competitors being cited instead                         │
│   - Receive "Quick Win" recommendation                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      EMAIL NURTURE (5-email sequence)           │
│   Day 0: Your report + quick win reminder                       │
│   Day 2: "Your competitors are pulling ahead" (urgency)         │
│   Day 5: Case study / social proof                              │
│   Day 8: Feature highlight + trial CTA                          │
│   Day 12: Final offer (discount or extended trial)              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      RETARGETING (Facebook/Instagram)           │
│   - Remind non-converters                                       │
│   - Show testimonials                                           │
│   - Limited-time offers                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      TRIAL → PAID CONVERSION                    │
│   - 14-day trial with full features                             │
│   - In-app prompts showing value                                │
│   - Email: "Your trial ends in 3 days"                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 4: Email Nurture Sequence

### Email 1: Immediate (After Free Analysis)

**Subject:** Your AI Visibility Report for [domain.com]

**Body:**
```
Hey [Name],

Your AI Visibility Report is ready.

Here's what we found for [domain.com]:

📊 AI Citation Score: [X]%
🔍 Checked: ChatGPT, Perplexity, Claude
⚠️ Competitors cited instead: [Competitor 1], [Competitor 2]

YOUR #1 QUICK WIN:
[Specific, actionable recommendation based on their site]

Want to track this automatically and get alerts when competitors
get mentioned? Start your free trial:

[Start Free Trial Button]

— The LLM Navigator Team

P.S. We checked 5 AI queries. Paid plans check 50+ and track daily.
```

### Email 2: Day 2 (Urgency)

**Subject:** [Competitor] was just cited by ChatGPT. You weren't.

**Body:**
```
Hey [Name],

Quick update on AI search for your industry:

We ran another check this morning. Here's what AI assistants are
telling people who ask about [their industry]:

✅ [Competitor 1] — Mentioned in 4/5 responses
✅ [Competitor 2] — Mentioned in 3/5 responses
❌ [Their domain] — Mentioned in 0/5 responses

Every day you're not tracking this, potential customers are being
sent to your competitors.

[See What You're Missing Button]

— LLM Navigator Team
```

### Email 3: Day 5 (Social Proof)

**Subject:** How [Similar Business] increased AI citations 340%

**Body:**
```
Hey [Name],

Quick case study I thought you'd find interesting:

[Similar Business Type] was in the same spot as you — invisible
to AI search. After using LLM Navigator for 6 weeks:

• AI citation rate: 12% → 53%
• Organic traffic from AI: +340%
• Time spent: 2 hours/week

Here's exactly what they did:
[Link to case study]

Ready to see similar results?

[Start Free Trial Button]
```

### Email 4: Day 8 (Feature Highlight)

**Subject:** The feature our users love most

**Body:**
```
Hey [Name],

One thing I didn't mention in your free report:

LLM Navigator doesn't just show you WHERE you're missing —
it shows you HOW to fix it.

Our "Quick Wins" feature analyzes your site and gives you
specific, prioritized recommendations:

✓ "Add FAQ schema to your /pricing page"
✓ "Your about page is missing structured data"
✓ "Competitors are using these keywords you're not"

Each recommendation includes exact instructions and
expected impact.

[See Your Quick Wins Button]

— LLM Navigator Team
```

### Email 5: Day 12 (Final Offer)

**Subject:** Last chance: 20% off your first 3 months

**Body:**
```
Hey [Name],

I noticed you grabbed your free AI Visibility Report but
haven't started your trial yet.

Totally get it — another tool, another subscription.

But here's the thing: AI search isn't slowing down. Every
week you wait, your competitors are getting further ahead.

So here's a one-time offer:

→ 20% off your first 3 months
→ Use code: AIREADY
→ Expires in 48 hours

[Claim Your Discount Button]

After that, this offer is gone and you'll pay full price.

No pressure — but if AI visibility matters to your business,
now's the time.

— LLM Navigator Team
```

---

## Part 5: Metrics & Goals

### 90-Day Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Free analyses completed | 1,000 | ~$1-3 cost per lead |
| Email subscribers | 800 | 80% of analyzers |
| Trial signups | 200 | 25% of subscribers |
| Paid conversions | 100 | 50% trial-to-paid |
| MRR | $2,900+ | 100 × $29 average |

### Key Conversion Rates to Track

| Stage | Target Rate | If Below, Fix |
|-------|-------------|---------------|
| Landing → Analysis | 30%+ | Simplify form, improve copy |
| Analysis → Email signup | 80%+ | Make report more valuable |
| Email → Trial | 25%+ | Improve nurture sequence |
| Trial → Paid | 50%+ | Improve onboarding, show value |

### Cost Targets

| Metric | Target |
|--------|--------|
| Cost per lead (free analysis) | < $3 |
| Cost per trial | < $15 |
| Cost per paying customer | < $50 |
| LTV:CAC ratio | > 3:1 |

---

## Part 6: Budget Allocation (Month 1)

Assuming $1,500/month starting budget:

| Channel | Budget | Expected Leads | Cost/Lead |
|---------|--------|----------------|-----------|
| Google Ads | $600 | 200-300 | $2-3 |
| LinkedIn Ads | $450 | 100-150 | $3-4.50 |
| Facebook Retargeting | $300 | 50-100 | $3-6 |
| Content/Tools | $150 | Long-term | N/A |
| **Total** | **$1,500** | **350-550** | **$2.70-4.30** |

---

## Part 7: Quick Start Checklist

### Week 1: Foundation

- [ ] Enhance free analysis with personalized insights
- [ ] Set up email nurture sequence (5 emails)
- [ ] Create Google Ads account and first campaign
- [ ] Install Facebook Pixel for retargeting
- [ ] Set up conversion tracking

### Week 2: Launch Paid

- [ ] Launch Google Ads (start with $20/day)
- [ ] Launch LinkedIn Ads (start with $15/day)
- [ ] Monitor and optimize daily
- [ ] A/B test ad copy

### Week 3: Optimize

- [ ] Review conversion rates at each stage
- [ ] Kill underperforming ads
- [ ] Double down on winners
- [ ] Launch Facebook retargeting

### Week 4: Scale

- [ ] Increase budget on winning campaigns
- [ ] Add new keyword targets
- [ ] Create first comparison landing page
- [ ] Gather testimonials from early users

---

## Part 8: Facebook Ads Deep Dive

Since you asked specifically about Facebook:

### When Facebook Works for B2B SaaS

✅ **Good for:**
- Retargeting website visitors
- Lookalike audiences from email list
- Local business targeting
- Brand awareness (cheap impressions)

❌ **Bad for:**
- Cold B2B acquisition
- High-ticket enterprise sales
- Niche professional targeting

### Facebook Ad Setup (Retargeting Only)

#### Step 1: Install Pixel

Add to your site (in `index.html` or via GTM):

```html
<!-- Facebook Pixel -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', 'YOUR_PIXEL_ID');
fbq('track', 'PageView');
</script>
```

#### Step 2: Create Custom Audiences

In Facebook Ads Manager → Audiences → Create Audience → Custom Audience:

| Audience Name | Definition |
|---------------|------------|
| All Visitors (30d) | Anyone who visited in last 30 days |
| Free Analysis Started | Visited /free-report |
| Free Analysis Completed | Triggered 'analysis_complete' event |
| Trial Signups | Triggered 'signup' event |
| Didn't Convert | Visited but no signup in 14 days |

#### Step 3: Create Retargeting Campaign

**Campaign Objective:** Conversions
**Audience:** "Didn't Convert" custom audience
**Placement:** Facebook Feed, Instagram Feed (uncheck others)
**Budget:** $10/day to start

**Ad Creative:**

Image: Your dashboard showing competitor citations
Text: "You checked your AI visibility. Your competitors are ahead. Ready to fix it?"
Headline: "Start Your Free Trial"
CTA: Sign Up

---

## Appendix: Landing Page Copy Framework

### Headline Options (A/B test these)

1. "Is AI Recommending Your Competitors Instead of You?"
2. "Find Out What ChatGPT Says About Your Business"
3. "Your Competitors Are in AI Search. Are You?"
4. "60% of Searches Now Go to AI. Are You Visible?"

### Value Proposition Structure

```
[Headline: Problem/Question]

[Subhead: What they'll get]
Get your free AI Visibility Report in 60 seconds.
See exactly what ChatGPT, Claude, Perplexity, and Gemini say about your business.

[Social Proof]
Join 500+ businesses tracking their AI visibility

[Form: Just email + URL]
[Button: Get Free Analysis]

[Trust Elements]
✓ No credit card required
✓ Results in 60 seconds
✓ GDPR compliant — we never sell your data
```

---

## Summary

1. **Don't start with Facebook** — use it for retargeting only
2. **Lead with Google Ads** — highest intent, best ROI
3. **Make free analysis incredible** — personalized, specific, valuable
4. **Nurture via email** — 5-email sequence over 12 days
5. **Track everything** — know your cost per lead, trial, customer
6. **Start small, scale winners** — $1,500/month is enough to start

**Your unfair advantage:** You're not VC-funded, so you don't need 10x growth. You need 100 happy customers paying $29-99/month. That's achievable with $1,500/month in ads and a great product.
