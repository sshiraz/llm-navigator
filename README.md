# LLM Navigator

Answer Engine Optimization (AEO) platform that helps websites get cited by AI assistants like ChatGPT, Claude, Perplexity, and Gemini.

## Features

### Core AEO
- **Citation Checking** - Enter natural language prompts, see if your website gets cited by AI
- **Competitor Analysis** - See which competitors are getting cited and why
- **Content Analysis** - Website crawling with Schema.org detection, BLUF scoring, and SEO analysis
- **AI Provider Selection** - Query Perplexity, OpenAI, Anthropic, and Gemini
- **Actionable Recommendations** - Get specific suggestions to improve your AI visibility

### Subscription & Payments
- **Stripe Integration** - Test and live mode checkout with subscription management
- **Plan-based Limits** - Usage tracking with plan-specific analysis limits
- **Self-service Cancellation** - Cancel subscriptions from account page

### Admin Features
- **User Management** - View, edit, and delete users from admin dashboard
- **Environment Indicators** - Clear test/live mode status display

### Security
- **CORS Protection** - Origin-based request validation (whitelisted domains only)
- **Webhook Verification** - Stripe signature validation
- **Fraud Prevention** - Email normalization, device fingerprinting, risk scoring

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Payments:** Stripe
- **Deployment:** Netlify (https://llmsearchinsight.com)

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Stripe account

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd llm-navigator

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your keys

# Start development server
npm run dev
```

### Environment Variables

```bash
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
VITE_STRIPE_STARTER_PRICE_ID=price_xxx
VITE_STRIPE_PROFESSIONAL_PRICE_ID=price_xxx
VITE_STRIPE_ENTERPRISE_PRICE_ID=price_xxx

# For payment testing
STRIPE_SECRET_KEY=sk_test_xxx
```

## Plans

| Plan | Price | Analyses/Month |
|------|-------|----------------|
| Trial | Free | Unlimited (simulated data) |
| Starter | $29/mo | 10 |
| Professional | $99/mo | 50 |
| Enterprise | $299/mo | 400 |

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build
```

## Testing

```bash
# Run all unit tests (watch mode)
npm run test

# Run unit tests once
npm run test:run

# Run with coverage
npm run test:coverage

# Test Stripe payment flow
npm run test:payment

# Test all Edge Functions
npm run test:functions
```

See [TESTING.md](./TESTING.md) for comprehensive test documentation.

## Deployment

### Frontend (Netlify)

1. Connect GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard

### Edge Functions (Supabase)

```bash
# Deploy all functions
npx supabase functions deploy cancel-subscription
npx supabase functions deploy check-citations
npx supabase functions deploy crawl-website
npx supabase functions deploy create-payment-intent
npx supabase functions deploy create-subscription
npx supabase functions deploy delete-user
npx supabase functions deploy stripe-webhook
npx supabase functions deploy webhook-helper
```

### Supabase Secrets

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
supabase secrets set OPENAI_API_KEY=xxx
supabase secrets set ANTHROPIC_API_KEY=xxx
supabase secrets set PERPLEXITY_API_KEY=xxx
```

## Stripe Webhook Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy webhook secret to Supabase secrets

## Project Structure

```
src/
├── components/
│   ├── Analysis/      # AEO analysis UI
│   ├── Auth/          # Login/signup
│   ├── Account/       # User settings
│   ├── Admin/         # Admin dashboard
│   ├── Payment/       # Stripe checkout
│   └── Subscription/  # Pricing pages
├── services/          # Supabase operations
├── utils/             # Business logic
├── types/             # TypeScript types
└── lib/               # Supabase client

supabase/
└── functions/
    ├── _shared/              # Shared utilities (CORS)
    ├── cancel-subscription/  # Cancel Stripe subscription
    ├── check-citations/      # Query AI providers
    ├── crawl-website/        # Website content analysis
    ├── create-payment-intent/# Stripe payment intent
    ├── create-subscription/  # Create Stripe subscription
    ├── delete-user/          # Admin user deletion
    ├── stripe-webhook/       # Stripe webhook handler
    └── webhook-helper/       # Webhook utilities
```

## AI Assistants

See [CLAUDE.md](./CLAUDE.md) for detailed context when working with AI assistants on this codebase.

## License

Proprietary - All rights reserved
