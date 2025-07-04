import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.warn('Stripe publishable key not found. Payment features will be disabled.');
}

// Initialize Stripe
export const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

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
  clientSecret: '', // Will be set dynamically
};

// Plan configurations - Updated to use environment variables
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
  
  if (!import.meta.env.VITE_STRIPE_STARTER_PRICE_ID) {
    issues.push('Missing VITE_STRIPE_STARTER_PRICE_ID');
  }
  
  if (!import.meta.env.VITE_STRIPE_PROFESSIONAL_PRICE_ID) {
    issues.push('Missing VITE_STRIPE_PROFESSIONAL_PRICE_ID');
  }
  
  if (!import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID) {
    issues.push('Missing VITE_STRIPE_ENTERPRISE_PRICE_ID');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};