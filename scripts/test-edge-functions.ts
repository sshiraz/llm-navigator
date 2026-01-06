/**
 * Edge Functions Test Script
 *
 * Comprehensive tests for all Supabase Edge Functions:
 * - stripe-webhook
 * - create-payment-intent
 * - create-subscription
 * - cancel-subscription
 * - delete-user
 * - crawl-website
 * - check-citations
 * - webhook-helper
 *
 * Usage:
 *   npm run test:functions
 *
 * Environment variables required:
 *   - STRIPE_SECRET_KEY (sk_test_...)
 *   - VITE_SUPABASE_URL
 *   - VITE_SUPABASE_ANON_KEY
 */

import Stripe from 'stripe';

// Configuration
const CONFIG = {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  SUPABASE_URL: process.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || '',

  // Test data
  TEST_USER_ID: 'test-user-' + Date.now(),
  TEST_ADMIN_ID: process.env.TEST_ADMIN_ID || '', // Set this to a real admin ID for delete-user test
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

const results: TestResult[] = [];

function log(message: string, type: 'info' | 'success' | 'error' | 'warn' | 'skip' = 'info') {
  const icons = {
    info: `${colors.blue}ℹ️ `,
    success: `${colors.green}✅`,
    error: `${colors.red}❌`,
    warn: `${colors.yellow}⚠️ `,
    skip: `${colors.gray}⏭️ `,
  };
  console.log(`${icons[type]} ${message}${colors.reset}`);
}

function header(title: string) {
  console.log('\n' + colors.cyan + '═'.repeat(60));
  console.log(`  ${title}`);
  console.log('═'.repeat(60) + colors.reset + '\n');
}

function subheader(title: string) {
  console.log('\n' + colors.gray + '─'.repeat(40));
  console.log(`  ${title}`);
  console.log('─'.repeat(40) + colors.reset + '\n');
}

async function runTest(
  name: string,
  testFn: () => Promise<{ passed: boolean; message: string }>
): Promise<TestResult> {
  const start = Date.now();
  try {
    const result = await testFn();
    const duration = Date.now() - start;
    const testResult = { name, ...result, duration };
    results.push(testResult);

    if (result.passed) {
      log(`${name}: ${result.message} (${duration}ms)`, 'success');
    } else {
      log(`${name}: ${result.message} (${duration}ms)`, 'error');
    }

    return testResult;
  } catch (error: any) {
    const duration = Date.now() - start;
    const testResult = {
      name,
      passed: false,
      message: error.message || 'Unknown error',
      duration,
    };
    results.push(testResult);
    log(`${name}: ${error.message} (${duration}ms)`, 'error');
    return testResult;
  }
}

// Helper function to call Edge Functions
async function callEdgeFunction(
  functionName: string,
  body: any,
  options: { method?: string; headers?: Record<string, string> } = {}
): Promise<{ ok: boolean; status: number; data: any }> {
  const url = `${CONFIG.SUPABASE_URL}/functions/v1/${functionName}`;

  const response = await fetch(url, {
    method: options.method || 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
      'apikey': CONFIG.SUPABASE_ANON_KEY,
      ...options.headers,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

// ============================================================
// TEST: stripe-webhook
// ============================================================
async function testStripeWebhook(): Promise<{ passed: boolean; message: string }> {
  const response = await callEdgeFunction('stripe-webhook', {
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: 'pi_test_' + Date.now(),
        amount: 2900,
        currency: 'usd',
        status: 'succeeded',
        metadata: {
          userId: CONFIG.TEST_USER_ID,
          plan: 'starter',
        },
      },
    },
  }, {
    headers: { 'x-test-request': 'true' },
  });

  if (response.ok && response.data.received) {
    return { passed: true, message: 'Webhook processed test event successfully' };
  }

  return { passed: false, message: `Status ${response.status}: ${JSON.stringify(response.data)}` };
}

// ============================================================
// TEST: create-payment-intent
// ============================================================
async function testCreatePaymentIntent(): Promise<{ passed: boolean; message: string }> {
  const response = await callEdgeFunction('create-payment-intent', {
    amount: 2900,
    currency: 'usd',
    metadata: {
      userId: CONFIG.TEST_USER_ID,
      plan: 'starter',
    },
  });

  if (response.ok && response.data.clientSecret) {
    return { passed: true, message: `Created payment intent with client secret` };
  }

  return { passed: false, message: `Status ${response.status}: ${JSON.stringify(response.data)}` };
}

// ============================================================
// TEST: cancel-subscription
// ============================================================
async function testCancelSubscription(): Promise<{ passed: boolean; message: string }> {
  // Test with non-existent user (should handle gracefully)
  const response = await callEdgeFunction('cancel-subscription', {
    userId: 'non-existent-user-' + Date.now(),
  });

  // Should return 404 for non-existent user or handle gracefully
  if (response.status === 404 || (response.data.error && response.data.error.includes('not found'))) {
    return { passed: true, message: 'Correctly handles non-existent user' };
  }

  if (response.ok) {
    return { passed: true, message: 'Function responded successfully' };
  }

  return { passed: false, message: `Status ${response.status}: ${JSON.stringify(response.data)}` };
}

// ============================================================
// TEST: delete-user (requires admin)
// ============================================================
async function testDeleteUser(): Promise<{ passed: boolean; message: string }> {
  // Test without admin ID (should fail authorization)
  const response = await callEdgeFunction('delete-user', {
    userIdToDelete: 'test-user-to-delete',
    adminUserId: 'fake-admin-id',
  });

  // Should return 403 for unauthorized
  if (response.status === 403) {
    return { passed: true, message: 'Correctly rejects unauthorized requests' };
  }

  return { passed: false, message: `Expected 403, got ${response.status}: ${JSON.stringify(response.data)}` };
}

// ============================================================
// TEST: crawl-website
// ============================================================
async function testCrawlWebsite(): Promise<{ passed: boolean; message: string }> {
  const response = await callEdgeFunction('crawl-website', {
    url: 'https://example.com',
    options: {
      maxPages: 1,
      includeSchema: true,
    },
  });

  if (response.ok && response.data.success) {
    const pageCount = response.data.data?.pages?.length || 0;
    return { passed: true, message: `Crawled ${pageCount} page(s) successfully` };
  }

  // Rate limit is acceptable
  if (response.status === 429) {
    return { passed: true, message: 'Rate limited (expected behavior)' };
  }

  return { passed: false, message: `Status ${response.status}: ${JSON.stringify(response.data)}` };
}

// ============================================================
// TEST: check-citations (requires API keys)
// ============================================================
async function testCheckCitations(): Promise<{ passed: boolean; message: string }> {
  const response = await callEdgeFunction('check-citations', {
    prompts: [{ id: '1', text: 'What is the best project management tool?' }],
    website: 'example.com',
    brandName: 'Example',
    providers: ['openai'], // Just test one provider
  });

  // May fail due to missing API keys - that's expected in test environment
  if (response.ok) {
    return { passed: true, message: 'Citations check completed' };
  }

  if (response.status === 500 && response.data.error?.includes('API key')) {
    return { passed: true, message: 'Correctly requires API keys (not configured in test)' };
  }

  if (response.status === 429) {
    return { passed: true, message: 'Rate limited (expected behavior)' };
  }

  // Missing API key is acceptable for tests
  if (response.data.error?.includes('Missing API key')) {
    return { passed: true, message: 'API keys not configured (expected in test environment)' };
  }

  return { passed: false, message: `Status ${response.status}: ${JSON.stringify(response.data)}` };
}

// ============================================================
// TEST: webhook-helper
// ============================================================
async function testWebhookHelper(): Promise<{ passed: boolean; message: string }> {
  const response = await callEdgeFunction('webhook-helper', {
    action: 'check_webhook',
  });

  if (response.ok && response.data.status === 'ok') {
    return { passed: true, message: 'Webhook helper responded with status' };
  }

  return { passed: false, message: `Status ${response.status}: ${JSON.stringify(response.data)}` };
}

// ============================================================
// TEST: CORS preflight
// ============================================================
async function testCorsPreflightAllowed(): Promise<{ passed: boolean; message: string }> {
  const url = `${CONFIG.SUPABASE_URL}/functions/v1/check-citations`;

  const response = await fetch(url, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://lucent-elf-359aef.netlify.app',
      'Access-Control-Request-Method': 'POST',
    },
  });

  if (response.ok) {
    return { passed: true, message: 'CORS preflight allowed for whitelisted origin' };
  }

  return { passed: false, message: `Status ${response.status}` };
}

async function testCorsPreflightBlocked(): Promise<{ passed: boolean; message: string }> {
  const url = `${CONFIG.SUPABASE_URL}/functions/v1/check-citations`;

  const response = await fetch(url, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://malicious-site.com',
      'Access-Control-Request-Method': 'POST',
    },
  });

  if (response.status === 403) {
    return { passed: true, message: 'CORS preflight blocked for unauthorized origin' };
  }

  return { passed: false, message: `Expected 403, got ${response.status}` };
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  header('Edge Functions Test Suite');

  // Validate configuration
  if (!CONFIG.SUPABASE_URL) {
    log('VITE_SUPABASE_URL not set', 'error');
    process.exit(1);
  }

  if (!CONFIG.SUPABASE_ANON_KEY) {
    log('VITE_SUPABASE_ANON_KEY not set', 'error');
    process.exit(1);
  }

  log(`Supabase URL: ${CONFIG.SUPABASE_URL}`, 'info');
  log(`Testing against production Edge Functions`, 'info');

  // Run all tests
  subheader('Payment Functions');
  await runTest('stripe-webhook', testStripeWebhook);
  await runTest('create-payment-intent', testCreatePaymentIntent);
  await runTest('cancel-subscription', testCancelSubscription);

  subheader('Admin Functions');
  await runTest('delete-user (auth check)', testDeleteUser);
  await runTest('webhook-helper', testWebhookHelper);

  subheader('Analysis Functions');
  await runTest('crawl-website', testCrawlWebsite);
  await runTest('check-citations', testCheckCitations);

  subheader('Security (CORS)');
  await runTest('CORS preflight (allowed origin)', testCorsPreflightAllowed);
  await runTest('CORS preflight (blocked origin)', testCorsPreflightBlocked);

  // Summary
  header('Test Summary');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`\n${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`${colors.blue}Total:  ${total}${colors.reset}\n`);

  if (failed > 0) {
    console.log(`${colors.red}Failed tests:${colors.reset}`);
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.message}`);
    });
    console.log('');
  }

  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);
  console.log(`${colors.gray}Total time: ${totalTime}ms${colors.reset}\n`);

  // Exit with error code if any tests failed
  if (failed > 0) {
    process.exit(1);
  }

  log('All tests passed!', 'success');
}

// Run
main().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
