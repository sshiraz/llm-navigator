# Security & Scalability Implementation Plan

> Created: 2026-01-07
> Status: Planning
> Goal: Move from 68% security / 44% scalability to 85%+ on both

---

## Phase 1: Critical Security (High Impact, Achievable Now)

### 1.1 Input Sanitization (XSS Prevention)

**Current State:** No sanitization on form inputs. Users can inject scripts.

**Implementation:**
```
src/utils/sanitize.ts              # Create sanitization utility
src/utils/sanitize.test.ts         # Tests for sanitization
```

**Steps:**
1. Create `sanitize.ts` with functions:
   - `sanitizeText(input)` - Strip HTML tags, escape special chars
   - `sanitizeUrl(input)` - Validate URL format, block javascript: protocol
   - `sanitizeEmail(input)` - Validate email format
2. Apply to all form inputs:
   - `AuthPage.tsx` - email, password, name, company, website
   - `NewAnalysis.tsx` - website URL, prompts/keywords
   - `UserDashboard.tsx` - search input, edit form
   - `CreditCardForm.tsx` - billing details
3. Add 20+ tests covering:
   - Script injection attempts
   - SQL injection patterns
   - Unicode bypass attempts
   - Null byte injection

**Files to Modify:**
- `src/components/Auth/AuthPage.tsx`
- `src/components/Analysis/NewAnalysis.tsx`
- `src/components/Admin/UserDashboard.tsx`
- `src/components/Payment/CreditCardForm.tsx`

**Estimated Tests:** 25 new tests

---

### 1.2 Session Timeout

**Current State:** Sessions never expire. User stays logged in indefinitely.

**Implementation:**
```
src/utils/sessionManager.ts        # Session timeout logic
src/utils/sessionManager.test.ts   # Tests
```

**Steps:**
1. Create `sessionManager.ts`:
   - Track last activity timestamp
   - Auto-logout after 30 min inactivity
   - Warning modal at 25 min
   - Extend session on activity
2. Integrate into `App.tsx`:
   - Start activity tracking on login
   - Reset timer on user actions
   - Show warning modal before logout
3. Add tests for:
   - Timeout triggers logout
   - Activity resets timer
   - Warning shows at correct time

**Files to Modify:**
- `src/App.tsx`
- `src/utils/storageManager.ts` (add lastActivity)

**Estimated Tests:** 10 new tests

---

### 1.3 CSRF Protection

**Current State:** No CSRF tokens on form submissions.

**Implementation:**
```
src/utils/csrf.ts                  # CSRF token generation/validation
```

**Steps:**
1. Generate CSRF token on session start
2. Include token in all form submissions
3. Validate token on Supabase Edge Functions
4. Regenerate token after each successful submission

**Files to Modify:**
- `src/services/authService.ts`
- `supabase/functions/_shared/csrf.ts`
- All Edge Functions that accept POST

**Estimated Tests:** 8 new tests

---

## Phase 2: Scalability Foundation

### 2.1 Migrate localStorage to Supabase

**Current State:** Analysis results stored in localStorage. Lost on browser clear.

**Implementation:**

**Steps:**
1. Ensure `analyses` table has all required columns:
   - `citation_results` (jsonb) ✅ Migration exists
   - `overall_citation_rate` (integer) ✅ Migration exists
2. Update `AnalysisService.saveAnalysis()` to always save to Supabase
3. Update `AnalysisService.getAnalysis()` to read from Supabase first
4. Remove localStorage fallback for analysis data
5. Keep localStorage only for:
   - `currentUser` (session cache)
   - `lastAnalysisWebsite` (convenience)

**Files to Modify:**
- `src/services/analysisService.ts`
- `src/components/Analysis/AnalysisProgress.tsx`
- `src/components/Analysis/AnalysisResults.tsx`
- `src/utils/storageManager.ts`

**Estimated Tests:** 15 new tests

---

### 2.2 Background Job Queue for Long Analyses

**Current State:** Long analyses (real crawl + AI queries) block the UI.

**Implementation:**

**Option A: Supabase Realtime + Edge Functions**
1. Start analysis → Edge Function queues job → returns job ID immediately
2. Frontend subscribes to `analysis_jobs` table via Supabase Realtime
3. Edge Function updates job status as it progresses
4. Frontend shows progress based on realtime updates

**Option B: Polling (Simpler)**
1. Start analysis → Edge Function queues job → returns job ID
2. Frontend polls `/job-status/{id}` every 2 seconds
3. When complete, fetch full results

**Steps (Option A - Recommended):**
1. Create `analysis_jobs` table:
   ```sql
   CREATE TABLE analysis_jobs (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES users(id),
     status TEXT, -- 'pending', 'crawling', 'checking_citations', 'complete', 'failed'
     progress INTEGER, -- 0-100
     result JSONB,
     error TEXT,
     created_at TIMESTAMPTZ,
     updated_at TIMESTAMPTZ
   );
   ```
2. Create `start-analysis` Edge Function (non-blocking)
3. Create `process-analysis` Edge Function (does the work)
4. Update `NewAnalysis.tsx` to use job-based flow
5. Update `AnalysisProgress.tsx` to subscribe to realtime

**Files to Create:**
- `supabase/functions/start-analysis/index.ts`
- `supabase/functions/process-analysis/index.ts`
- `supabase/migrations/YYYYMMDD_add_analysis_jobs.sql`

**Files to Modify:**
- `src/components/Analysis/NewAnalysis.tsx`
- `src/components/Analysis/AnalysisProgress.tsx`

**Estimated Tests:** 12 new tests

---

### 2.3 API Response Caching

**Current State:** Every request hits the database. No caching.

**Implementation:**

**Option A: Supabase Edge Function Caching**
- Use `Cache-Control` headers for GET requests
- Cache analysis results for 5 minutes

**Option B: Upstash Redis (Better)**
- Add Upstash Redis for proper caching
- Cache: user profiles (5 min), analysis results (10 min), competitors (1 hour)

**Steps (Option A - Quick Win):**
1. Add caching headers to Edge Functions:
   ```typescript
   return new Response(JSON.stringify(data), {
     headers: {
       ...corsHeaders,
       'Cache-Control': 'public, max-age=300', // 5 min
     }
   });
   ```
2. Implement cache invalidation on writes

**Estimated Tests:** 5 new tests

---

## Phase 3: Admin Security

### 3.1 MFA for Admin Accounts

**Current State:** Admin accounts use password-only authentication.

**Implementation:**

**Steps:**
1. Enable Supabase MFA (TOTP)
2. Require MFA enrollment for `is_admin = true` users
3. Add MFA challenge to admin-only routes
4. Create MFA setup UI in Account settings

**Files to Create:**
- `src/components/Account/MFASetup.tsx`
- `src/components/Account/MFAChallenge.tsx`

**Files to Modify:**
- `src/services/authService.ts`
- `src/App.tsx` (admin route protection)

**Estimated Tests:** 10 new tests

---

### 3.2 Security Event Alerting

**Current State:** No alerts for suspicious activity.

**Implementation:**

**Steps:**
1. Create `security_events` table:
   ```sql
   CREATE TABLE security_events (
     id UUID PRIMARY KEY,
     event_type TEXT, -- 'failed_login', 'suspicious_activity', 'fraud_flag'
     user_id UUID,
     ip_address TEXT,
     details JSONB,
     created_at TIMESTAMPTZ
   );
   ```
2. Log events from:
   - Failed login attempts (3+ in 5 min)
   - Fraud prevention flags
   - Admin actions
3. Create webhook to send alerts (Slack/email)

**Files to Create:**
- `src/services/securityService.ts`
- `supabase/functions/security-alert/index.ts`

**Estimated Tests:** 8 new tests

---

## Phase 4: Performance & Compliance

### 4.1 Load Testing

**Current State:** Never load tested. Unknown capacity.

**Implementation:**

**Steps:**
1. Install k6: `npm install -D k6`
2. Create load test scripts:
   - `scripts/load-test-auth.js` - Login/signup flow
   - `scripts/load-test-analysis.js` - Analysis submission
   - `scripts/load-test-api.js` - Edge Function endpoints
3. Run baseline test: 50 concurrent users
4. Document results and bottlenecks
5. Set performance budget

**Target Metrics:**
- Response time p95 < 500ms
- Error rate < 1%
- 100 concurrent users without degradation

---

### 4.2 GDPR Compliance

**Current State:** No data deletion workflow. No consent tracking.

**Implementation:**

**Steps:**
1. Create "Delete My Data" flow:
   - User requests deletion from Account page
   - Admin reviews request
   - Cascade delete: user → analyses → payments
2. Add consent tracking:
   - Cookie consent banner
   - Marketing opt-in checkbox on signup
3. Create data export feature (download all user data)

**Files to Create:**
- `src/components/Account/DeleteAccount.tsx`
- `src/components/Account/DataExport.tsx`
- `src/components/Legal/CookieConsent.tsx`

---

## Implementation Order

| Phase | Items | New Tests | Priority |
|-------|-------|-----------|----------|
| 1.1 | Input Sanitization | 25 | Critical |
| 1.2 | Session Timeout | 10 | High |
| 2.1 | localStorage → Supabase | 15 | High |
| 1.3 | CSRF Protection | 8 | Medium |
| 2.2 | Background Job Queue | 12 | Medium |
| 2.3 | API Caching | 5 | Medium |
| 3.1 | Admin MFA | 10 | Medium |
| 3.2 | Security Alerting | 8 | Low |
| 4.1 | Load Testing | 0 | Low |
| 4.2 | GDPR Compliance | 5 | Low |

**Total New Tests: ~98**

---

## Success Metrics

After implementation:

| Metric | Before | After |
|--------|--------|-------|
| Security Score | 68% | 88% |
| Scalability Score | 44% | 72% |
| Test Count | 252 | 350 |
| OWASP Top 10 Coverage | 3/10 | 7/10 |

---

## Quick Wins (Can Do Today)

1. **Input Sanitization** - 2-3 hours, high impact
2. **Session Timeout** - 1-2 hours, medium impact
3. **Cache Headers on Edge Functions** - 30 min, low effort

Would you like to start with any of these?
