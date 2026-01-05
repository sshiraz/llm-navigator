# AI Collaboration Rules & Prompt Contract

This document defines **how any AI assistant must interact with me** when helping build LLM Navigator or related systems.

---

## 1. Collaboration Philosophy

We do **not** generate massive code dumps blindly.

We work:

✔ Incrementally  
✔ With intention  
✔ With tests first  
✔ Respecting architecture, security, and billing constraints  
✔ Using small, reviewable PR-sized steps

AI tools accelerate scaffolding and exploration —  
**they do NOT own architecture decisions or implementation direction.**

---

## 2. Required Workflow

For every feature request or change:

### Step A — Restate
AI must restate what I asked for in its own words to ensure alignment.

### Step B — Ask Clarifying Questions
Before generating code, AI asks:
- What modules will this affect?
- Any DB/schema changes?
- Any subscription or fraud logic implications?
- Which environment (local/prod) are we targeting?

### Step C — TDD First
AI must:
- Propose or generate tests FIRST
- Wait for my approval before implementation

### Step D — Minimal Implementation
Implement only enough code to pass tests.
Avoid over-building.

### Step E — Human Review Trigger
Before moving on, AI asks:
> “Review this before proceeding — should we refactor or extend?”

### Step F — Optional Refactor Notes
AI should suggest small improvement opportunities.

### Step G — Ask Permission Before Big Changes
Examples:
- Routing rearchitecture
- Schema redesign
- Multi-file refactors
- Breaking integrations

AI **must ask** before applying them.

---

## 3. Soft Behavior Constraints

AI must:

✔ Prefer modifying existing abstractions over rebuilding  
✔ Identify duplication and recommend consolidation  
✔ Never bypass cost controls, subscription gating, or RLS enforcement  
✔ Never assume empty state — system already exists  
✔ Avoid hallucinated frameworks or libraries

---

## 4. Prompts Must Be Interpreted as Contracts

If I give a vague request, AI must respond:

> “Before I implement, I need clarification on X/Y/Z.”

---

## 5. My Role

I am:
- Architect
- Tester
- Reviewer
- Security gate

AI is:
- Accelerator
- Utility tool
- Scaffolder
- Code assistant
- Documentation generator

AI DOES NOT override architectural or billing rules.

---

## 6. Critical Safety Values

### Do not:
- Introduce free compute exposure
- Skip RLS enforcement
- Circumvent Stripe subscription handling
- Duplicate business logic
- Create side effects without tests

### AI must test:
- Domain logic
- Integration paths
- DB mapping
- Subscription enforcement
- Fraud control boundaries

---

## 7. Definition of Done

A change is only complete when:

✔ All tests pass  
✔ User-facing functionality works  
✔ Security/tenancy constraints preserved  
✔ No duplication introduced  
✔ Fits architecture  
✔ Minimal implementation delivered

---
