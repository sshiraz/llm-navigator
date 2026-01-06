# Documentation Index

> Last updated: 2026-01-05
> This index organizes all documentation files in the LLM Navigator project.

---

## Primary Documentation (Read These First)

| File | Purpose | Status |
|------|---------|--------|
| `CLAUDE.md` | AI assistant instructions, patterns, pre-change checklist | Current |
| `ARCHITECTURE.md` | Tech stack, project structure, data flow | Current |
| `ROADMAP.md` | Completed features and upcoming roadmap | Current |
| `SECURITY_SCALABILITY_CHECKLIST.md` | Security/scalability status and action items | Current |

---

## Setup & Deployment

| File | Purpose | When to Use |
|------|---------|-------------|
| `SETUP_CHECKLIST.md` | Complete setup guide for new deployments | First-time setup |
| `DEPLOYMENT_GUIDE.md` | General deployment instructions | Deploying changes |
| `LOCAL_DEPLOYMENT_GUIDE.md` | Running locally | Local development |
| `EDGE_FUNCTIONS_DEPLOYMENT.md` | Deploying Supabase functions | After function changes |

---

## Stripe & Payments

| File | Purpose | When to Use |
|------|---------|-------------|
| `STRIPE_SETUP.md` | **Complete Stripe setup** (products, webhooks, secrets) | First-time setup |
| `STRIPE_LIVE_MODE_CHECKLIST.md` | Pre-launch payment checklist | Before accepting real payments |
| `LIVE_MODE_SECURITY_CHECKLIST.md` | Security checklist for live mode | Before going live |
| `PCI_COMPLIANCE_GUIDE.md` | PCI compliance requirements | Compliance review |

---

## Webhooks

| File | Purpose | When to Use |
|------|---------|-------------|
| `WEBHOOK_TESTING_GUIDE.md` | Testing webhooks | Webhook development |
| `LIVE_WEBHOOK_SETUP.md` | Production webhook setup | Going live |

> **Note:** Webhook setup is now included in `STRIPE_SETUP.md`. Historical fix docs have been removed.

---

## Troubleshooting & Fixes

| File | Purpose | When to Use |
|------|---------|-------------|
| `SUPABASE_CLI_FIX.md` | Supabase CLI issues | CLI problems |
| `NODEJS_INSTALLATION_GUIDE.md` | Node.js setup | Environment issues |
| `NODEJS_PATH_FIX.md` | Node.js path issues | Path problems |
| `POWERSHELL_DEPLOYMENT_GUIDE.md` | Windows/PowerShell specific | Windows deployment |
| `MANUAL_SUBSCRIPTION_UPDATE.md` | Manual DB updates | Emergency fixes |

---

## Testing

| File | Purpose | When to Use |
|------|---------|-------------|
| `TESTING.md` | **Comprehensive test documentation** | Primary test reference |
| `APP_TESTING_GUIDE.md` | End-to-end manual testing guide | Manual QA testing |

### Test Commands
```bash
npm run test           # Unit tests (watch)
npm run test:run       # Unit tests (once)
npm run test:functions # Edge Function tests
npm run test:payment   # Payment flow tests
```

---

## Reference

| File | Purpose |
|------|---------|
| `MODEL_COMPARISON.md` | AI model comparison |
| `AI_COLLABORATION_RULES.md` | AI assistant behavior rules |
| `PRODUCT_ENGINEERING_ROADMAP.md` | Engineering phases and principles |

---

## In `docs/` Directory

| File | Purpose |
|------|---------|
| `docs/CODE_INVENTORY.md` | Code organization reference |
| `docs/decisions/001-real-website-crawling.md` | ADR: Website crawling decision |
| `docs/decisions/000-template.md` | Template for new ADRs |

---

## Cleanup Completed (2026-01-05)

The following redundant files were removed:

**Deleted (12 files):**
- ~~AUTOMATIC_WEBHOOK_FIX.md~~ (historical)
- ~~WEBHOOK_DEPLOYMENT_FIX.md~~ (historical)
- ~~WEBHOOK_DEPLOYMENT_TROUBLESHOOTING.md~~ (historical)
- ~~WEBHOOK_FIX_GUIDE.md~~ (historical)
- ~~WEBHOOK_FIX_STEPS.md~~ (historical)
- ~~WEBHOOK_TROUBLESHOOTING.md~~ (historical)
- ~~LIVE_WEBHOOK_SETUP_GUIDE.md~~ (duplicate)
- ~~STRIPE_WEBHOOK_SETUP.md~~ (merged into STRIPE_SETUP.md)
- ~~STRIPE_SETUP_COMPLETE.md~~ (duplicate)
- ~~STRIPE_LIVE_DEPLOYMENT.md~~ (duplicate)
- ~~LIVE_STRIPE_SETUP.md~~ (duplicate)
- ~~PAYMENT_DEPLOYMENT_GUIDE.md~~ (duplicate)

---

## File Count Summary

- **Primary docs:** 4 files
- **Setup & deployment:** 4 files
- **Stripe & payments:** 4 files
- **Webhooks:** 2 files
- **Troubleshooting:** 5 files
- **Testing:** 2 files
- **Reference:** 3 files
- **docs/ directory:** 3 files

**Total:** 27 markdown files (down from 39)
