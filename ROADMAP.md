# LLM Navigator Roadmap

> Last updated: 2026-02-03

## Completed Features

### AEO (Answer Engine Optimization)
- [x] Prompt-based citation checking (replaces keywords)
- [x] Real API queries to Perplexity, OpenAI, Anthropic, **Google Gemini**
- [x] Competitor citation tracking (who IS getting cited)
- [x] AEO-specific recommendations
- [x] Brand name detection
- [x] Provider selection (choose which AI to query)
- [x] Citation Results Detail UI (per-prompt AI responses, expandable accordion)
- [x] Competitor Strategy with real data (uses citationResults, not mock)
- [x] Demo Mode indicator (clear banner for simulated vs real data)

### History & Tracking
- [x] Analysis history page
- [x] Filter by website
- [x] Website trends (up/down/stable)
- [x] Stats overview (total analyses, avg citation rate)

### Infrastructure
- [x] check-citations edge function
- [x] Supabase storage for analyses
- [x] Cost tracking for citation checks
- [x] Analysis engine tests (16 tests for real vs simulated flows)
- [x] Live Stripe payments (production mode)
- [x] Hard paywall for expired trials

### Security & Compliance
- [x] Two-factor authentication (TOTP)
- [x] GDPR compliance (data export, account deletion)
- [x] Cookie consent banner
- [x] Security audit logging
- [x] Input sanitization (XSS, SQL injection prevention)

### Lead Generation
- [x] Free Report page with real AI analysis
- [x] Email capture and upsell flow
- [x] Abuse prevention (rate limiting, honeypot)

---

## Upcoming Features (Priority Order)

### 1. Agent Readiness Check (Agentic Commerce)
> *Added 2026-02-03 — Based on emerging AI search trends*

AI is evolving from **Answering → Recommending → Executing**. Sites need to be machine-readable for transactional agents, not just citation-worthy.

**What to check:**
- [ ] Product feed / API availability (JSON-LD, product feeds)
- [ ] Real-time pricing & inventory data exposure
- [ ] Structured data for commerce (offers, availability, shipping)
- [ ] Machine-readable policies (returns, warranties)
- [ ] API endpoints for agent integration
- [ ] Data freshness signals (lastModified, update frequency)

**Why this matters:**
- Citation tracking = "can AI mention you?"
- Agent readiness = "can AI transact with you?"
- Differentiates from pure SEO/AEO tools into commerce readiness

**Scoring additions:**
- Agent Readiness Score (0-100)
- Commerce data completeness
- API discoverability
- Real-time data capability

---

### 2. Scheduled Monitoring & Alerts
- Auto-run analyses weekly/monthly
- Email alerts when citation rate changes significantly
- Alert when you START getting cited (celebration!)
- Alert when you STOP getting cited (problem!)

### 3. Visual Trend Charts
- Line graph showing citation rate over time
- Compare multiple websites on same chart
- Export charts for reports

### 4. More AI Providers
- [x] ~~Google Gemini~~ (Added 2026-01-17)
- [ ] Microsoft Bing Chat / Copilot
- [ ] Meta AI
- [ ] Other emerging AI assistants

### 5. Enhanced Competitor Intelligence
- Track specific competitors over time
- See what content gets THEM cited
- Gap analysis (what they have that you don't)

### 6. Content Recommendations Engine
- AI-generated content suggestions
- Specific phrases/answers to add
- Schema markup generator

---

## Future Considerations

- [x] ~~API access for enterprise customers~~ (Added 2026-01-09)
- [x] ~~White-label/branded reports~~ (Added 2026-01-09 - company logo on PDF exports)
- [ ] Team collaboration features
- [ ] Integration with CMS platforms (WordPress, etc.)
- [ ] Chrome extension for quick checks
- [ ] OAuth providers (Google, GitHub login)
