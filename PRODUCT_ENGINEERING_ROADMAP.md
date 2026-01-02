# LLM Navigator Engineering Blueprint
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
    - GPT-4
    - Claude 3.5
    - Perplexity

### Payment System
- Stripe Checkout + Subscription Webhooks

### Reporting
- jspdf + html2canvas

---

---

## 3. Existing Core Features

✔ Website crawling + AI scoring  
✔ Multi-tier subscription gating  
✔ Competitor tracking  
✔ Usage cost tracking (~$0.20/run)  
✔ Admin dashboard  
✔ Fraud prevention engine:
- device fingerprint
- IP / velocity heuristics

✔ Real-time progress feedback

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

### 4.3 Billing & Fraud Integrity

All compute / analysis:
- gated by Stripe subscription state
- tallied in `api_usage`
- subject to fraud checks

Do not build anything that enables:
- infinite free trial
- untracked analysis
- bypassing usage metering

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
- white-label reports

### Phase 5 — Automation / Alerts
- scheduled re-analysis
- email signals

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
- Fraud engine thresholds
- Edge Function behavior

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
