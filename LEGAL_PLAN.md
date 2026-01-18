# Legal Documentation Plan

> Last updated: 2026-01-18

## Current Status: Production Ready

All essential legal documents are in place for a SaaS with payment processing.

---

## Implemented Documents

| Document | Route | Last Updated | Status |
|----------|-------|--------------|--------|
| Terms of Service | `#terms` | 2026-01-16 | Complete |
| Privacy Policy | `#privacy` | 2026-01-16 | Complete |
| Cookie Consent | Banner component | 2026-01-16 | Complete |
| Data Processing Agreement | `#dpa` | 2026-01-16 | Complete |

### Terms of Service Coverage
- [x] Agreement to terms
- [x] Account registration
- [x] Subscription plans
- [x] Free trial terms
- [x] Payment processing (Stripe)
- [x] Automatic renewal
- [x] 30-day refund policy
- [x] Acceptable use
- [x] Intellectual property
- [x] User content license
- [x] Disclaimer of warranties
- [x] Limitation of liability
- [x] Indemnification
- [x] Termination
- [x] Governing law (California)
- [x] Dispute resolution (JAMS arbitration)

### Privacy Policy Coverage
- [x] Data collection (personal & automatic)
- [x] How data is used
- [x] Third-party sharing
- [x] Data security
- [x] GDPR rights (EU)
  - [x] Right to access
  - [x] Right to data portability
  - [x] Right to deletion
  - [x] Right to rectification
- [x] CCPA compliance (California)
- [x] Cookie policy
- [x] Data retention periods
- [x] Children's privacy (16+)
- [x] International data transfers
- [x] Contact information

### Cookie Consent
- [x] Accept/Decline options
- [x] localStorage persistence
- [x] Banner display with delay
- [x] Consent helper functions

### Data Processing Agreement (DPA)
- [x] Enterprise/B2B data processing terms
- [x] Sub-processor disclosure
- [x] Security measures

---

## Future Considerations

### Priority: Nice to Have

| Document | Purpose | When to Add |
|----------|---------|-------------|
| **Acceptable Use Policy** | Detailed prohibited uses (scraping, abuse) | If abuse becomes an issue |
| **SLA (Service Level Agreement)** | Uptime guarantees, support response times | When offering Enterprise tier with SLA |
| **Refund Policy** (standalone) | Dedicated page for refund terms | If support requests increase |
| **Security Page** | Public security practices, certifications | When pursuing enterprise sales |
| **API Terms of Use** | Terms specific to API access | When API feature launches |

### Priority: If Expanding Internationally

| Document | Purpose | When to Add |
|----------|---------|-------------|
| **LGPD Notice** | Brazil data protection | If targeting Brazil |
| **PIPL Notice** | China data protection | If targeting China |
| **UK GDPR Addendum** | Post-Brexit UK compliance | If significant UK users |

### Priority: If Adding Features

| Document | Purpose | When to Add |
|----------|---------|-------------|
| **Affiliate Terms** | If adding affiliate/referral program | With affiliate feature |
| **Partner Agreement** | If adding reseller/agency partnerships | With partner program |
| **White-label License** | If offering white-label solution | With white-label feature |

---

## Compliance Checklist

### Payment Processing
- [x] Stripe handles PCI compliance
- [x] No credit card numbers stored locally
- [x] Payment terms in ToS
- [x] Refund policy documented

### User Data
- [x] Data export feature (Account page)
- [x] Account deletion feature (Account page)
- [x] Audit logging for sensitive actions
- [x] Data retention policy documented

### Security
- [x] 2FA available
- [x] Session management
- [x] Input sanitization
- [x] CORS protection on edge functions

### Marketing
- [x] Cookie consent before analytics
- [x] Unsubscribe option in emails (via Supabase Auth)
- [x] No selling of personal data (stated in Privacy Policy)

---

## Contact for Legal Inquiries

Email: info@convologix.com

---

## Notes

- Legal documents should be reviewed annually or when significant features change
- Consider legal counsel review before major product launches
- Keep "Last Updated" dates current when modifying documents
