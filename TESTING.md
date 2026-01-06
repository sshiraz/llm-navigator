# Testing Guide

This document provides an overview of all automated tests in the LLM Navigator project.

## Quick Reference

| Command | Description | Type |
|---------|-------------|------|
| `npm run test` | Run all Vitest unit/component tests | Unit |
| `npm run test:run` | Run tests once (no watch mode) | Unit |
| `npm run test:coverage` | Run tests with coverage report | Unit |
| `npm run test:payment` | Test Stripe payment flow | Integration |
| `npm run test:functions` | Test all Supabase Edge Functions | Integration |

---

## Unit & Component Tests (Vitest)

Located in `src/` alongside source files. Run with `npm run test`.

### Authentication

**File:** `src/services/authService.test.ts`

Tests the AuthService class for user authentication flows.

| Test Suite | Coverage |
|------------|----------|
| `signUp` | New user registration, validation errors, duplicate emails |
| `signIn` | Successful login, wrong password, non-existent user |
| `signOut` | Logout, error handling |
| `getCurrentSession` | Active session retrieval, no session |
| `updateProfile` | Profile updates, error handling |
| `onAuthStateChange` | Auth state listener setup |
| `Auth Flow Integration` | Complete sign up → sign in → sign out flow |

### Components

#### AuthPage
**File:** `src/components/Auth/AuthPage.test.tsx`

| Test Suite | Coverage |
|------------|----------|
| Login Mode | Form rendering, input fields, Sign In button, Forgot Password |
| Signup Mode | Name/company/website fields, Terms of Service, trial info |
| Mode Toggle | Switching between login/signup, form field clearing |
| Form Validation | Required attributes, input types |
| Loading State | Spinner during submission |

#### AnalysisForm
**File:** `src/components/Analysis/AnalysisForm.test.tsx`

| Test Suite | Coverage |
|------------|----------|
| Rendering | Form title, URL section, keywords section |
| Website URL Input | Input acceptance, type/required attributes |
| Keywords Textarea | Multiline input, label display |
| Industry Description | Input acceptance, label display |
| Generate Suggestions | Button states, loading state, suggestion display |
| Keyword Selection | Selecting/deselecting keywords, multiple selections |

#### UserDashboard (Admin)
**File:** `src/components/Admin/UserDashboard.test.tsx`

| Test Suite | Coverage |
|------------|----------|
| Admin Access | Admin-only access, non-admin rejection, logged-out rejection |
| User List Display | User names, emails, subscription badges, counts |
| Search Functionality | Filter by name, filter by email, no results |
| Plan Filter | Filter by trial/starter/professional |
| Summary Stats | Total users, paid subscriptions, payment methods |
| Action Buttons | Refresh, Export CSV, Back to Dashboard, Edit |
| Edit User Modal | Open/close modal, form fields, Save/Cancel |
| Table Sorting | Sortable columns (Name, Email, Subscription, Created) |
| New User Registration | Display new users, update counts, Refresh button |

### Navigation
**File:** `src/test/navigation.test.tsx`

| Test Suite | Coverage |
|------------|----------|
| Hash Synchronization | Sidebar navigation updates hash, browser navigation |
| View Last Analysis | Button visibility, navigation, repeated navigation fix |
| Protected Routes | Auth page for unauthenticated, dashboard for authenticated |
| Public Routes | Auth page accessibility |
| Sidebar Navigation | Section switching |
| LocalStorage Persistence | Analysis persistence, parameter loading |

---

## Integration Tests (Scripts)

### Payment Flow Tests
**File:** `scripts/test-payment-flow.ts`
**Command:** `npm run test:payment`

Tests the complete Stripe payment integration.

| Test | Description |
|------|-------------|
| Create Checkout Session | Creates a Stripe checkout session with test data |
| Webhook Events | Sends test events to stripe-webhook Edge Function |
| Subscription Flow | Creates test customer, payment method, cleanup |

**Requirements:**
- `STRIPE_SECRET_KEY` (must be `sk_test_*`)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Edge Functions Tests
**File:** `scripts/test-edge-functions.ts`
**Command:** `npm run test:functions`

Comprehensive tests for all deployed Supabase Edge Functions.

| Function | Test Description |
|----------|------------------|
| `stripe-webhook` | Process test webhook event |
| `create-payment-intent` | Create payment intent with metadata |
| `cancel-subscription` | Handle non-existent user gracefully |
| `delete-user` | Reject unauthorized admin requests (403) |
| `webhook-helper` | Check webhook status response |
| `crawl-website` | Crawl example.com with options |
| `check-citations` | Citation check (handles missing API keys) |
| CORS (allowed) | Preflight request from whitelisted origin |
| CORS (blocked) | Preflight request from unauthorized origin (403) |

**Requirements:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## Running Tests

### All Unit Tests
```bash
npm run test           # Watch mode
npm run test:run       # Run once
npm run test:coverage  # With coverage
```

### Specific Test File
```bash
npx vitest src/services/authService.test.ts
npx vitest src/components/Auth/AuthPage.test.tsx
```

### Integration Tests
```bash
# Load env vars and run
set -a && . ./.env && set +a && npm run test:payment
set -a && . ./.env && set +a && npm run test:functions
```

---

## Test Coverage Summary

| Area | Unit Tests | Integration Tests |
|------|------------|-------------------|
| Authentication | authService.test.ts | - |
| UI Components | AuthPage, AnalysisForm, UserDashboard | - |
| Navigation | navigation.test.tsx | - |
| Payment/Stripe | - | test-payment-flow.ts |
| Edge Functions | - | test-edge-functions.ts |
| CORS Security | - | test-edge-functions.ts |

---

## Adding New Tests

### Unit/Component Tests
1. Create `*.test.ts` or `*.test.tsx` file alongside source
2. Use Vitest (`describe`, `it`, `expect`)
3. Mock external dependencies (Supabase, APIs)
4. Run with `npm run test`

### Integration Tests
1. Add to `scripts/` directory
2. Add npm script to `package.json`
3. Document environment requirements
4. Handle errors gracefully

---

## CI/CD Considerations

For automated pipelines:
```bash
# Unit tests (fast, no external deps)
npm run test:run

# Integration tests (require env vars and network)
npm run test:functions  # After deploying Edge Functions
npm run test:payment    # After Stripe configuration
```
