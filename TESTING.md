# Testing Guide

> Last updated: 2026-01-21

This document provides an overview of all automated tests in the LLM Navigator project.

## Test Requirements

**All tests must pass (0 failures) before code is ready to merge.**

```bash
# Run this before every commit
npm run test:run && npm run build
```

Current test count: **708 tests** (23 test files)

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
| `signUp` | New user registration, validation errors, duplicate emails, email confirmation required |
| `signIn` | Successful login, wrong password, non-existent user |
| `signOut` | Logout, error handling |
| `getCurrentSession` | Active session retrieval, no session |
| `updateProfile` | Profile updates, error handling |
| `onAuthStateChange` | Auth state listener setup |
| `resendConfirmationEmail` | Resend confirmation email, error handling |
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
| Email Confirmation Flow | Email confirmed banner, Check Your Email screen, Back to Sign In button |
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
| **Admin Authentication - Delete User** | Session token authentication, error handling for missing session, request body validation, API error handling |
| **Admin Authentication - Reset Password** | Session token authentication, password validation, API error handling, modal close on success |

**Security Coverage:**
- Verifies JWT session token is used instead of anon key for admin operations
- Tests error handling when no active session exists
- Validates proper request body format for edge functions

#### LeadsDashboard (Admin)
**File:** `src/components/Admin/LeadsDashboard.test.tsx`

Tests the free report leads dashboard for admin users (35 tests).

| Test Suite | Coverage |
|------------|----------|
| Admin Access | Admin-only access, non-admin rejection, logged-out rejection |
| Lead List Display | Lead emails, websites, AI scores, cited badges, count display |
| Search Functionality | Filter by email, filter by website, no results |
| Filter Functionality | Citation status filter, industry filter, dropdown options |
| Summary Stats | Total Leads, Cited, Avg AI Score, Top Industry, This Week |
| Action Buttons | Refresh, Export CSV, Back to Dashboard |
| Table Sorting | Sortable columns (Email, Website, AI Score, Date) |
| Clear Filters | Show/hide clear button, reset filters |
| CSV Export | Export triggers download |
| Refresh Functionality | Reload leads on click |

#### SignupsDashboard (Admin)
**File:** `src/components/Admin/SignupsDashboard.test.tsx`

Tests the account signups dashboard for admin users (35 tests).

| Test Suite | Coverage |
|------------|----------|
| Admin Access | Admin-only access, non-admin rejection, logged-out rejection |
| User List Display | User names, emails, subscription badges, payment status, count |
| Search Functionality | Filter by name, filter by email, no results |
| Filter Functionality | Plan filter, payment status filter, dropdown options |
| Summary Stats | Total Users, Paid, Active Trials, Payment Added, This Week |
| Action Buttons | Refresh, Export CSV, Back to Dashboard |
| Table Sorting | Sortable columns (Name, Email, Plan, Signed Up) |
| Clear Filters | Show/hide clear button, reset filters |
| CSV Export | Export triggers download |
| Refresh Functionality | Reload users on click |
| Trial Status Display | Trial status column, days remaining |

#### SignupAnalytics
**File:** `src/components/Admin/SignupAnalytics.test.tsx`

Tests the signup/lead trend chart component (28 tests).

| Test Suite | Coverage |
|------------|----------|
| Rendering | Default title, custom title, chart icon |
| Timeframe Selector | Dropdown present, default 30d, 7d/30d/90d options, change selection |
| Legend Display | Leads legend, signups legend, both legends, correct totals |
| Empty State | No data message, hidden when data exists |
| Chart Bars | Date labels, daily view for 7d |
| Data Aggregation | Weekly for 30d, weekly for 90d |
| Leads Only Mode | Shows only leads legend, correct count |
| Signups Only Mode | Shows only signups legend, correct count |
| Combined Mode | Both legends, both counts |
| Time Period Filtering | Updates on timeframe change |

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

### Analysis Engine
**File:** `src/utils/analysisEngine.test.ts`

Tests the AnalysisEngine for real vs simulated analysis flows.

| Test Suite | Coverage |
|------------|----------|
| `shouldUseRealAnalysis` | Trial users (false), free users (false), starter/pro/enterprise (true), admin users (true) |
| `Simulated AEO Analysis` | citationResults structure, simulated competitor domains, zero cost, citation rate calculation |
| `CitationResult Data Consistency` | Required fields, competitorsCited structure |
| `Analysis to AEOAnalysis Conversion` | citationResults preservation |
| `extractCompetitorData helper` | Competitor extraction, empty results handling, competitor deduplication |

**Test Data:** Uses www.convologix.com (AI chatbot services) with relevant prompts:
- "What are the best customer service chatbot providers?"
- "How do I implement AI chatbots for my business?"
- "Which companies offer conversational AI solutions?"

### Analysis Helpers
**File:** `src/utils/analysis/analysisHelpers.test.ts`

Tests the modularized analysis helper functions (39 tests).

| Test Suite | Coverage |
|------------|----------|
| `calculateOverallCitationRate` | Zero results, all cited, partial citation, empty arrays |
| `extractDomain` | Standard URLs, www prefix, subdomains, paths, edge cases |
| `normalizeWebsiteUrl` | Scheme handling, path normalization |
| `generateCitationResultsForPrompts` | Citation generation, provider simulation, competitor extraction |
| `determineCompetitorContext` | Context determination based on prompt type |

### Storage Manager
**File:** `src/utils/storageManager.test.ts`

Tests the StorageManager localStorage abstraction (20 tests).

| Test Suite | Coverage |
|------------|----------|
| `getCurrentUser` | Parse from localStorage, null handling, invalid JSON |
| `setCurrentUser` / `clearCurrentUser` | Store and clear operations |
| `getCurrentAnalysis` / `setCurrentAnalysis` | Analysis storage operations |
| `getLastAnalysisWebsite` | Last website retrieval |
| `clearAllAnalysisData` | Bulk clear operations |

### User Utilities
**File:** `src/utils/userUtils.test.ts`

Tests the user utility functions for admin checks, subscriptions, and trial expiration (46 tests).

| Test Suite | Coverage |
|------------|----------|
| `isUserAdmin` | Null/undefined handling, isAdmin flag, admin email detection, regular user |
| `isCurrentUserAdmin` | localStorage checks, admin/non-admin detection, invalid JSON handling |
| `getCurrentUser` | localStorage retrieval, null handling, JSON parsing |
| `updateCurrentUser` | Partial updates, missing user handling |
| `clearUserData` | Clear all user-related localStorage items |
| `canBypassUsageLimits` | Admin bypass, paid plan bypass, trial/free restrictions |
| `shouldUseRealAnalysis` | Admin users, paid subscriptions, trial/free users |
| `isTrialExpired` | Null user, non-trial subscriptions, active trial, expired trial |
| `hasActiveSubscription` | Admin access, paid plans, active trial, expired trial, free users |
| `canRunAnalysis` | Login requirements, admin access, paid plans, trial expiration, free restrictions |
| `getSubscriptionBadge` | Badge HTML generation for all subscription types |

**Business Logic Coverage:**
- Trial expiration detection with date comparison
- Subscription status validation for paywall enforcement
- Admin privilege checking for bypass scenarios

### Input Sanitization
**File:** `src/utils/sanitize.test.ts`

Tests the sanitization utilities for XSS/SQL injection prevention (115 tests).

| Test Suite | Coverage |
|------------|----------|
| `escapeHtml` | HTML entity escaping, special characters, null handling |
| `stripHtmlTags` | Tag removal, event handlers, dangerous protocols |
| `sanitizeText` | HTML stripping, null bytes, unicode normalization |
| `sanitizeUrl` | Protocol validation, dangerous protocol blocking, URL format |
| `sanitizeEmail` | Email validation, HTML stripping, lowercase normalization |
| `sanitizeSearchQuery` | SQL injection pattern removal, whitespace normalization |
| `sanitizePassword` | Control character removal, special char preservation |
| `sanitizeArray` | Array sanitization, empty filtering |
| `sanitizeFormData` | Field-specific sanitization, config options |
| `escapeRegex` | Regex special character escaping |
| `isSafeInput` | HTML tag detection, event handler detection, SQL pattern detection |
| **Security Attack Vectors** | XSS Prevention (11 vectors), SQL Injection (9 vectors), Unicode Bypass, Null Byte Injection, Protocol Handler Attacks (8 protocols) |

**Security Coverage:**
- Blocks `javascript:`, `vbscript:`, `data:`, `file:`, `about:` protocols
- Detects SQL keywords: SELECT, INSERT, UPDATE, DELETE, DROP, UNION, ALTER, CREATE, TRUNCATE
- Normalizes unicode to prevent homograph attacks
- Removes null bytes from all inputs

### Payment Service
**File:** `src/services/paymentService.test.ts`

Tests the PaymentService for Stripe integration (19 tests).

| Test Suite | Coverage |
|------------|----------|
| `recordPayment` | Success/failure recording, Supabase calls |
| `getPaymentsByUser` | User payment retrieval, error handling |
| `handleCheckoutSuccess` | Checkout completion, user update |
| `handleCheckoutCancel` | Checkout cancellation handling |
| `createPaymentIntent` | Payment intent creation |
| `getSubscriptionStatus` | Subscription status retrieval |

### API Rate Limiting
**File:** `src/services/apiRateLimiter.test.ts`

Tests the API rate limiting logic patterns (18 tests).

| Test Suite | Coverage |
|------------|----------|
| `Per-minute Rate Limiter` | First request allowed, 10 requests/min limit, 11th blocked, retry-after header, window reset after 60s, per-user tracking, count increments |
| `Monthly Usage Limit` | Under limit allowed, at limit blocked (400), over limit blocked |
| `Prompts Validation` | Undefined rejected, empty array rejected, non-array rejected, 1-10 allowed, >10 rejected |
| `Rate Limit Constants` | Correct per-minute (10), monthly (400), max prompts (10) |

**Rate Limiting Rules:**
- Per-minute: 10 requests per user per minute (sliding window)
- Monthly: 400 analyses per month (Enterprise plan)
- Per-request: Maximum 10 prompts per API call

### Free Report Page
**File:** `src/components/FreeReport/FreeReportPage.test.tsx`

Tests the free report form, rate limiting, and whitelist bypass (23 tests).

| Test Suite | Coverage |
|------------|----------|
| Form Rendering | Email/website inputs, submit button, loading state |
| Form Validation | Required fields, invalid inputs |
| Rate Limiting | Database checks, email/website limits |
| Whitelist Bypass | `info@convologix.com` bypasses rate limits, case-insensitive matching |
| Report Generation | API calls, result display |

**Security Coverage:**
- Rate limiting: 1 report per email per 24 hours, 3 reports per website per 24 hours
- Admin whitelist: Unlimited reports for `info@convologix.com`
- Database-backed rate limiting via `free_report_leads` table

### Audit Log Service
**File:** `src/services/auditLogService.test.ts`

Tests the AuditLogService for security audit logging (28 tests).

| Test Suite | Coverage |
|------------|----------|
| `log` | Event logging with metadata, status, error messages, category extraction |
| `getLogs` | Fetching logs with filtering, pagination, error handling |
| `getLoginHistory` | User login history retrieval |
| `getSecuritySummary` | Admin dashboard security metrics |
| **Convenience Methods** | `logLogin`, `logLogout`, `logLoginFailed`, `logSignup`, `logPasswordChange`, `logDataExport`, `logAccountDeletion`, `log2FAEnabled`, `log2FADisabled`, `logApiKeyCreate`, `logApiKeyRevoke`, `logAdminUserDelete`, `logAdminCleanup` |

**Security/Compliance Coverage:**
- Authentication events (login, logout, failed attempts, signup)
- Security events (2FA enable/disable, API key management)
- Data events (export, account deletion)
- Admin events (user management, cleanup operations)

### Competitor Comparison
**File:** `src/components/Analysis/competitorComparison.test.ts`

Tests data consistency between Performance Snapshot and Competitor Strategy (24 tests).

| Test Suite | Coverage |
|------------|----------|
| `extractCompetitorsAsAnalyses` | Empty states, competitor extraction, sorting, citation counts |
| `extractCompetitorData` | Non-AEO handling, competitor extraction, query counts |
| `Data Consistency` | Same domains, same ranking, same citation counts |
| `Edge Cases` | Empty context, no competitors, mixed cited/not-cited |

**Purpose:** Ensures both UI components (Performance Snapshot in analysis results, Competitor Strategy page) display the same competitor data extracted from `analysis.citationResults`.

### GDPR & Privacy Components

#### Cookie Consent
**File:** `src/components/Legal/CookieConsent.test.tsx`

Tests the cookie consent banner and helper functions (9 tests).

| Test Suite | Coverage |
|------------|----------|
| Initial Display | Timer delay, stored consent (accept/decline) |
| Consent Storage | localStorage accept/decline storage |
| `hasCookieConsent` | Returns true/false based on stored consent, handles invalid JSON |
| `resetCookieConsent` | Removes consent from localStorage |

#### Privacy Policy
**File:** `src/components/Legal/PrivacyPolicy.test.tsx`

Tests the privacy policy page with GDPR sections (14 tests).

| Test Suite | Coverage |
|------------|----------|
| Header Section | Title, date, back button navigation |
| GDPR Rights Section | Data export explanation, account deletion, CCPA section |
| Cookies Section | Consent options (accept/decline) |
| Data Retention Section | Retention policies display |
| Quick Links Section | Export, delete, terms links |
| Dark Theme | Correct styling classes |

#### Account Page GDPR Features
**File:** `src/components/Account/AccountPage.gdpr.test.tsx`

Tests data export and account deletion features (17 tests).

| Test Suite | Coverage |
|------------|----------|
| Account Security & Privacy | Section heading, change password button |
| Data Export | Export section display, download button |
| Account Deletion | Delete button, modal open/close, DELETE confirmation, edge function call, error handling |
| Account Created | Display of account creation date |
| Admin Restrictions | Export/delete visibility for admins |

**GDPR Compliance Features Tested:**
- Right to data portability (data export as JSON)
- Right to be forgotten (account deletion with confirmation)
- Cookie consent mechanism

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
| UI Components | AuthPage, AnalysisForm, UserDashboard, FreeReportPage | - |
| Navigation | navigation.test.tsx | - |
| Analysis Engine | analysisEngine.test.ts, analysisHelpers.test.ts | - |
| Competitor Comparison | competitorComparison.test.ts | - |
| Storage | storageManager.test.ts | - |
| User Utilities | userUtils.test.ts (46 tests) | - |
| Input Sanitization | sanitize.test.ts (115 tests) | - |
| Payment/Stripe | paymentService.test.ts | test-payment-flow.ts |
| **API Rate Limiting** | apiRateLimiter.test.ts (18 tests) | - |
| **Free Report Rate Limiting** | FreeReportPage.test.tsx (23 tests) | - |
| Audit Logging | auditLogService.test.ts (28 tests) | - |
| GDPR/Privacy | CookieConsent, PrivacyPolicy, AccountPage.gdpr | - |
| Edge Functions | - | test-edge-functions.ts |
| CORS Security | - | test-edge-functions.ts |
| Admin Authentication | UserDashboard.test.tsx (delete/reset password) | - |
| **Admin Leads Dashboard** | LeadsDashboard.test.tsx (35 tests) | - |
| **Admin Signups Dashboard** | SignupsDashboard.test.tsx (35 tests) | - |
| **Signup Analytics** | SignupAnalytics.test.tsx (28 tests) | - |
| **Admin Notifications** | authService.test.ts (4 notification tests) | - |

**Total: 708 tests across 23 test files**

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
