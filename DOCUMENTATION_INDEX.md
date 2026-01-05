# Documentation Index

> Last updated: 2026-01-03
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
| `STRIPE_SETUP.md` | Initial Stripe configuration | First-time Stripe setup |
| `STRIPE_WEBHOOK_SETUP.md` | Webhook configuration | Setting up webhooks |
| `LIVE_STRIPE_SETUP.md` | Going live with payments | Before production launch |
| `STRIPE_LIVE_MODE_CHECKLIST.md` | Pre-launch payment checklist | Before accepting real payments |
| `PCI_COMPLIANCE_GUIDE.md` | PCI compliance requirements | Compliance review |
| `LIVE_MODE_SECURITY_CHECKLIST.md` | Security checklist for live mode | Before going live |

### Potentially Redundant (Review for Consolidation)
- `STRIPE_SETUP_COMPLETE.md` - May duplicate STRIPE_SETUP.md
- `STRIPE_LIVE_DEPLOYMENT.md` - May duplicate LIVE_STRIPE_SETUP.md
- `PAYMENT_DEPLOYMENT_GUIDE.md` - May duplicate other payment docs

---

## Webhooks

| File | Purpose | When to Use |
|------|---------|-------------|
| `WEBHOOK_TESTING_GUIDE.md` | Testing webhooks | Webhook development |
| `LIVE_WEBHOOK_SETUP.md` | Production webhook setup | Going live |

### Potentially Redundant (Review for Consolidation)
- `LIVE_WEBHOOK_SETUP_GUIDE.md` - Duplicates LIVE_WEBHOOK_SETUP.md?
- `WEBHOOK_TROUBLESHOOTING.md` - Consider merging with below
- `WEBHOOK_DEPLOYMENT_TROUBLESHOOTING.md` - Consider merging
- `WEBHOOK_FIX_GUIDE.md` - Historical fix documentation
- `WEBHOOK_FIX_STEPS.md` - Historical fix documentation
- `WEBHOOK_DEPLOYMENT_FIX.md` - Historical fix documentation
- `AUTOMATIC_WEBHOOK_FIX.md` - Historical fix documentation

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
| `APP_TESTING_GUIDE.md` | End-to-end testing guide | Testing features |

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

## Recommended Cleanup

The following files could be consolidated to reduce documentation sprawl:

### Webhook Fixes (8 files → 1 file)
Merge into single `WEBHOOK_TROUBLESHOOTING.md`:
- AUTOMATIC_WEBHOOK_FIX.md
- WEBHOOK_DEPLOYMENT_FIX.md
- WEBHOOK_DEPLOYMENT_TROUBLESHOOTING.md
- WEBHOOK_FIX_GUIDE.md
- WEBHOOK_FIX_STEPS.md
- WEBHOOK_TROUBLESHOOTING.md

### Stripe Setup (6 files → 2 files)
Merge into `STRIPE_SETUP.md` (test) and `STRIPE_LIVE_SETUP.md` (production):
- STRIPE_SETUP.md
- STRIPE_SETUP_COMPLETE.md
- STRIPE_LIVE_DEPLOYMENT.md
- LIVE_STRIPE_SETUP.md
- PAYMENT_DEPLOYMENT_GUIDE.md

### Webhook Setup (3 files → 1 file)
Merge into `WEBHOOK_SETUP.md`:
- LIVE_WEBHOOK_SETUP.md
- LIVE_WEBHOOK_SETUP_GUIDE.md
- STRIPE_WEBHOOK_SETUP.md

---

## File Count Summary

- **Primary docs:** 4 files
- **Setup & deployment:** 4 files
- **Stripe & payments:** 9 files (could be 2-3)
- **Webhooks:** 9 files (could be 2)
- **Troubleshooting:** 5 files
- **Testing:** 1 file
- **Reference:** 3 files
- **docs/ directory:** 3 files

**Total:** 38 markdown files (could be ~15 after consolidation)
