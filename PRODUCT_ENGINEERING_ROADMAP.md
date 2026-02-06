# LLM Navigator Engineering Blueprint
> Last updated: 2026-02-03
>
> This defines **how the system is structured, what constraints exist, and how development must evolve.**

---

## 1. System Purpose

A SaaS product that analyzes websites for **AI search discoverability**, generating:

- Scoring
- Insights
- Recommendation frameworks
- Competitor benchmarks
- Subscription monetization

---

## 2. Verified Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router v7
- Lucide icons

### Backend
- Bolt Database (Supabase-style Postgres + Edge runtime)
    - PostgreSQL
    - Edge Functions
    - Auth
    - Row Level Security (RLS)

### AI Layer
- Multi-Model abstraction:
    - GPT-4 (OpenAI)
    - Claude 3.5 (Anthropic)
    - Perplexity
    - Google Gemini (added 2026-01-17)

### Payment System
- Stripe Checkout + Subscription Webhooks

### Reporting
- jspdf + html2canvas

---

---

## 3. Existing Core Features

✔ Website crawling + AI scoring
✔ Multi-tier subscription gating (Starter, Professional, Enterprise)
✔ Competitor tracking with citation analysis
✔ Usage cost tracking (~$0.20/run)
✔ Admin dashboard
✔ Real-time progress feedback
✔ 4 AI providers (OpenAI, Anthropic, Perplexity, Gemini)
✔ GDPR/CCPA compliance (data export, deletion, cookie consent)
✔ Two-factor authentication (TOTP)
✔ Security audit logging
✔ Free Report lead generation page
✔ Live Stripe payments
✔ Hard paywall for expired trials

---

---

## 4. Architectural Principles

### 4.1 Layering

UI Layer  
→ API Layer (Edge Functions)  
→ Service Layer (domain logic)  
→ Data Layer (Postgres through Bolt adapters)

No domain logic in controllers.  
No DB logic in UI.

---

### 4.2 RLS Enforcement

All queries filtered by user/organization IDs.  
No bypass permitted.

---

### 4.3 Billing Integrity

All compute / analysis:
- gated by Stripe subscription state
- tallied in `api_usage`
- trial users see simulated data only (no real API costs)

Do not build anything that enables:
- infinite free trial
- untracked analysis
- bypassing usage metering

> **Note:** Complex fraud prevention was removed (2026-01-09) because trial users only see simulated data. The cost of trial abuse is zero.

---

---

## 5. Refactor-Over-Rewrite Policy

We DO NOT rewrite the system.

Instead:
- Extend interfaces
- Improve modules
- Add tests around existing flows
- Incrementally modernize

---

---

## 6. Incremental Roadmap (Phases)

### Phase 1 — Credibility UI Layer
- methodology views
- interpretation scoring
- standardized recommendation objects

### Phase 2 — Historical Value & Retention
- tracking trends
- before/after deltas
- competitor deltas

### Phase 3 — AI Simulation Layer
- prompt bank
- simulation scoring
- persistence
- transparency messaging

### Phase 4 — Competitor Intelligence + Agency Tools
- org model
- multi-tenant workspaces
- white-label free report **landing page** (lead-gen-as-a-service)
  - Agencies get their own branded `/free-report` page to capture leads
  - Custom branding (logo, colors, company name)
  - Custom email "from" address for lead delivery
  - Leads go to agency's email/CRM, not ours
  - Optional: custom domain support (audit.agencydomain.com)
  - Optional: webhook integration to agency CRM
  - Implementation: URL params (Phase 1) → DB config (Phase 2) → custom domains (Phase 3)
  - Pricing: add-on to Professional ($99/mo) or included in Enterprise/Agency tier
  - Note: Different from existing white-label PDF reports (which are already built)

### Phase 5 — Automation / Alerts
- scheduled re-analysis
- email signals

### Phase 6 — Agent Readiness / Agentic Commerce (NEW)
> *Added 2026-02-03 — AI shifting from Answering → Recommending → Executing*

- product feed / API detection
- real-time pricing & inventory checks
- commerce structured data validation (offers, availability, shipping)
- machine-readable policy detection
- API endpoint discoverability
- data freshness signals
- Agent Readiness Score (0-100)

**Rationale:** Citation tracking answers "can AI mention you?" — Agent Readiness answers "can AI transact with you?" This differentiates from pure AEO/GEO tools.

Every phase runs under TDD and incremental deployment.

---

---

## 7. Required Development Behaviors

### MUST:
- Write tests before code
- Enforce subscription checks
- Respect fraud rules
- Ask before structural changes
- Reuse domain functions where possible
- Avoid duplication

### SHOULD:
- propose small refactors
- modularize shared logic
- use JetBrains AI for code cleanup
- use Claude for scaffolding with review

---

---

## 8. TDD Scope

Test suites must cover:

- Domain scoring logic
- Recommendation mapping
- Simulation parsing
- DB persistence behavior
- Stripe subscription enforcement
- Edge Function behavior
- Security (input sanitization, auth)
- GDPR compliance (data export, deletion)

**Current coverage:** 588 tests across 19 files

---

---

## 9. Deployment Safety Conditions

A feature qualifies for deployment when:

✔ Passing tests  
✔ Subscription gates hold  
✔ No free abuse vectors introduced  
✔ DB schema validated  
✔ Stripe sync intact  
✔ Admin UI unaffected

---

---

## 10. Cross-Tool Workflow Expectations

### JetBrains AI Assistant:
- Code review
- Fixing logic issues
- Refactoring suggestions
- Type inference
- Inline development

### Claude Code / Cursor:
- Boilerplate generation
- Service scaffolding
- Test skeleton drafts
- Higher-context bulk changes  
  (always reviewed by JetBrains)

---

---

# 11. Human Review Questions

Before merging ANY code:

- Does it duplicate logic?
- Does it leak security or RLS?
- Does it affect billing flows?
- Does it increase compute cost?
- Do tests capture meaningful behavior?

If unclear → pause development and notify me.

---
