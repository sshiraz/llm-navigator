# Branch Analysis & Explainer Log

> This document tracks significant changes, their reasoning, and test results.
> Archive: `BRANCH_ANALYSIS_2025-09_to_2026-01.md` (Sep 2025 - Jan 2026)

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
