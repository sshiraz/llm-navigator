import { loadStripe } from '@stripe/stripe-js';
import { PaymentLogger } from './paymentLogger';
import { getPlanAmount as getPlanAmountFromConfig } from './planConfig';

// Environment variables
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Initialize Stripe
export const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

// Check if we're in live mode
// LIVE MODE ENABLED - Real payments will be processed
export const isLiveMode = true;

// Log a warning if using live keys
if (stripePublishableKey?.startsWith('pk_live_')) {
  console.warn('⚠️ LIVE MODE ACTIVE - Using production Stripe keys. Real credit cards will be charged.');
  PaymentLogger.log('warn', 'StripeUtils', '🔴 LIVE KEYS DETECTED - Forcing test mode for safety');
}

// Stripe configuration
export const STRIPE_CONFIG = {
  appearance: {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#2563eb',
      colorBackground: '#ffffff',
      colorText: '#1f2937',
      colorDanger: '#ef4444',
      fontFamily: 'system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
  },
  locale: 'en',
};

// Plan configurations
export const STRIPE_PLANS = {
  starter: {
    priceId: import.meta.env.VITE_STRIPE_STARTER_PRICE_ID || 'price_starter_monthly',
    amount: 2900, // $29.00 in cents
    currency: 'usd',
    interval: 'month',
  },
  professional: {
    priceId: import.meta.env.VITE_STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional_monthly',
    amount: 9900, // $99.00 in cents
    currency: 'usd',
    interval: 'month',
  },
  enterprise: {
    priceId: import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_monthly',
    amount: 29900, // $299.00 in cents
    currency: 'usd',
    interval: 'month',
  },
};

// Helper function to format amount
export const formatAmount = (amount: number, currency = 'usd') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

// Validate Stripe configuration
export const validateStripeConfig = () => {
  const issues = [];
  
  if (!stripePublishableKey) {
    issues.push('Missing VITE_STRIPE_PUBLISHABLE_KEY');
  }
  
  if (!import.meta.env.VITE_STRIPE_STARTER_PRICE_ID && stripePublishableKey) {
    issues.push('Missing VITE_STRIPE_STARTER_PRICE_ID');
  }
  
  if (!import.meta.env.VITE_STRIPE_PROFESSIONAL_PRICE_ID && stripePublishableKey) {
    issues.push('Missing VITE_STRIPE_PROFESSIONAL_PRICE_ID');
  }
  
  if (!import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID && stripePublishableKey) {
    issues.push('Missing VITE_STRIPE_ENTERPRISE_PRICE_ID');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

// Get plan amount
export const getPlanAmount = getPlanAmountFromConfig;

// Get formatted plan price
export const getPlanPrice = (plan: string): string => {
  const amount = getPlanAmount(plan);
  return formatAmount(amount);
};