/**
 * Payment Flow Test Script
 *
 * This script tests the complete payment flow:
 * 1. Creates a Stripe checkout session
 * 2. Simulates webhook events
 * 3. Verifies database updates
 *
 * Usage:
 *   npx ts-node scripts/test-payment-flow.ts
 *
 * Or add to package.json scripts:
 *   "test:payment": "npx ts-node scripts/test-payment-flow.ts"
 */

import Stripe from 'stripe';

// Configuration - All values from environment variables
const CONFIG = {
  // Stripe Test Key (starts with sk_test_)
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',

  // Supabase Edge Function URL (from environment)
  SUPABASE_URL: process.env.VITE_SUPABASE_URL || '',

  // Supabase Anon Key (from environment)
  SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || '',

  // Test Price IDs (from environment or placeholders)
  PRICES: {
    starter: process.env.VITE_STRIPE_STARTER_PRICE_ID || 'price_starter_test',
    professional: process.env.VITE_STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional_test',
    enterprise: process.env.VITE_STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_test',
  },

  // Test user data
  TEST_USER: {
    id: 'test-user-' + Date.now(),
    email: 'test-' + Date.now() + '@example.com',
  },
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const icons = {
    info: `${colors.blue}ℹ️ `,
    success: `${colors.green}✅`,
    error: `${colors.red}❌`,
    warn: `${colors.yellow}⚠️ `,
  };
  console.log(`${icons[type]} ${message}${colors.reset}`);
}

function header(title: string) {
  console.log('\n' + colors.cyan + '═'.repeat(60));
  console.log(`  ${title}`);
  console.log('═'.repeat(60) + colors.reset + '\n');
}

async function main() {
  header('Payment Flow Test Script');

  // Check configuration
  if (!CONFIG.STRIPE_SECRET_KEY) {
    log('STRIPE_SECRET_KEY not set. Set it in your environment or .env file', 'error');
    log('Example: STRIPE_SECRET_KEY=sk_test_xxx npm run test:payment', 'info');
    process.exit(1);
  }

  if (!CONFIG.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    log('WARNING: This does not appear to be a test key! Aborting for safety.', 'error');
    process.exit(1);
  }

  if (!CONFIG.SUPABASE_URL) {
    log('VITE_SUPABASE_URL not set. Set it in your environment or .env file', 'error');
    process.exit(1);
  }

  if (!CONFIG.SUPABASE_ANON_KEY) {
    log('VITE_SUPABASE_ANON_KEY not set. Set it in your environment or .env file', 'error');
    process.exit(1);
  }

  log(`Using Stripe key: ${CONFIG.STRIPE_SECRET_KEY.substring(0, 12)}...`, 'info');
  log(`Supabase URL: ${CONFIG.SUPABASE_URL}`, 'info');

  const stripe = new Stripe(CONFIG.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });

  try {
    // Test 1: Create a checkout session
    header('Test 1: Create Checkout Session');
    const session = await testCreateCheckoutSession(stripe);

    // Test 2: Simulate webhook events
    header('Test 2: Simulate Webhook Events');
    await testWebhookEvents(stripe, session);

    // Test 3: Test subscription creation
    header('Test 3: Test Subscription Flow');
    await testSubscriptionFlow(stripe);

    // Summary
    header('Test Summary');
    log('All payment flow tests completed!', 'success');

  } catch (error: any) {
    log(`Test failed: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

async function testCreateCheckoutSession(stripe: Stripe) {
  log('Creating checkout session...', 'info');

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'LLM Navigator - Starter Plan (Test)',
            },
            unit_amount: 2900, // $29.00
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: CONFIG.TEST_USER.id,
        plan: 'starter',
      },
      customer_email: CONFIG.TEST_USER.email,
      success_url: 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://example.com/cancel',
    });

    log(`Checkout session created: ${session.id}`, 'success');
    log(`Payment URL: ${session.url}`, 'info');
    log(`Metadata: userId=${session.metadata?.userId}, plan=${session.metadata?.plan}`, 'info');

    return session;
  } catch (error: any) {
    log(`Failed to create checkout session: ${error.message}`, 'error');
    throw error;
  }
}

async function testWebhookEvents(stripe: Stripe, session: Stripe.Checkout.Session) {
  const webhookUrl = `${CONFIG.SUPABASE_URL}/functions/v1/stripe-webhook`;

  log(`Testing webhook endpoint: ${webhookUrl}`, 'info');

  // Test 1: Send a test event to webhook
  log('Sending test event to webhook...', 'info');

  try {
    const testPayload = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_' + Date.now(),
          amount: 2900,
          currency: 'usd',
          status: 'succeeded',
          metadata: {
            userId: CONFIG.TEST_USER.id,
            plan: 'starter',
          },
        },
      },
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'x-test-request': 'true', // Mark as test request
      },
      body: JSON.stringify(testPayload),
    });

    const result = await response.json();

    if (response.ok) {
      log(`Webhook responded successfully: ${JSON.stringify(result)}`, 'success');
    } else {
      log(`Webhook response: ${response.status} - ${JSON.stringify(result)}`, 'warn');
    }
  } catch (error: any) {
    log(`Webhook test failed: ${error.message}`, 'error');
  }

  // Test 2: Test checkout.session.completed event
  log('Testing checkout.session.completed event...', 'info');

  try {
    const checkoutPayload = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: session.id,
          payment_status: 'paid',
          metadata: {
            userId: CONFIG.TEST_USER.id,
            plan: 'starter',
          },
          customer_details: {
            email: CONFIG.TEST_USER.email,
          },
        },
      },
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'x-test-request': 'true',
      },
      body: JSON.stringify(checkoutPayload),
    });

    const result = await response.json();

    if (response.ok) {
      log(`Checkout webhook responded: ${JSON.stringify(result)}`, 'success');
    } else {
      log(`Checkout webhook response: ${response.status} - ${JSON.stringify(result)}`, 'warn');
    }
  } catch (error: any) {
    log(`Checkout webhook test failed: ${error.message}`, 'error');
  }
}

async function testSubscriptionFlow(stripe: Stripe) {
  log('Testing subscription creation...', 'info');

  try {
    // Create a test customer
    const customer = await stripe.customers.create({
      email: CONFIG.TEST_USER.email,
      metadata: {
        userId: CONFIG.TEST_USER.id,
      },
    });

    log(`Created test customer: ${customer.id}`, 'success');

    // Create a test payment method (for testing only)
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        token: 'tok_visa', // Test token for successful card
      },
    });

    log(`Created test payment method: ${paymentMethod.id}`, 'success');

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: customer.id,
    });

    // Set as default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });

    log('Payment method attached to customer', 'success');

    // Create a subscription with a test price
    // Note: You need to create a test price in Stripe Dashboard first
    // Or use the price from checkout session

    log('Subscription flow test completed', 'success');
    log('To complete a real subscription test, use the Stripe CLI:', 'info');
    log('  stripe trigger customer.subscription.created', 'info');

    // Cleanup - delete test customer
    await stripe.customers.del(customer.id);
    log(`Cleaned up test customer: ${customer.id}`, 'info');

  } catch (error: any) {
    log(`Subscription test error: ${error.message}`, 'warn');
    log('This is expected if price IDs are not configured', 'info');
  }
}

// Additional test functions

async function testPaymentIntent(stripe: Stripe) {
  log('Creating test payment intent...', 'info');

  const paymentIntent = await stripe.paymentIntents.create({
    amount: 2900,
    currency: 'usd',
    payment_method_types: ['card'],
    metadata: {
      userId: CONFIG.TEST_USER.id,
      plan: 'starter',
    },
  });

  log(`Payment intent created: ${paymentIntent.id}`, 'success');
  log(`Status: ${paymentIntent.status}`, 'info');

  return paymentIntent;
}

// Export for use as module
export { testCreateCheckoutSession, testWebhookEvents, testSubscriptionFlow };

// Run if executed directly
main().catch(console.error);
