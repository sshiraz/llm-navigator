import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.warn('Stripe publishable key not found. Payment features will be disabled.');
}

// Initialize Stripe only if we have a valid key
export const stripePromise = stripePublishableKey && !stripePublishableKey.includes('your_') 
  ? loadStripe(stripePublishableKey) 
  : null;

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

// Plan configurations - Check for valid Price IDs
export const STRIPE_PLANS = {
  starter: {
    priceId: import.meta.env.VITE_STRIPE_STARTER_PRICE_ID || '',
    amount: 2900, // $29.00 in cents
    currency: 'usd',
    interval: 'month',
  },
  professional: {
    priceId: import.meta.env.VITE_STRIPE_PROFESSIONAL_PRICE_ID || '',
    amount: 9900, // $99.00 in cents
    currency: 'usd',
    interval: 'month',
  },
  enterprise: {
    priceId: import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID || '',
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

// Check if a value is a placeholder
const isPlaceholder = (value: string | undefined): boolean => {
  if (!value) return true;
  return value.includes('your_') || value.includes('placeholder') || value.includes('test_key');
};

// Validate Stripe configuration
export const validateStripeConfig = () => {
  const issues = [];
  
  if (!stripePublishableKey || isPlaceholder(stripePublishableKey)) {
    issues.push('Missing or invalid VITE_STRIPE_PUBLISHABLE_KEY');
  }
  
  if (!STRIPE_PLANS.starter.priceId || isPlaceholder(STRIPE_PLANS.starter.priceId)) {
    issues.push('Missing or invalid VITE_STRIPE_STARTER_PRICE_ID');
  }
  
  if (!STRIPE_PLANS.professional.priceId || isPlaceholder(STRIPE_PLANS.professional.priceId)) {
    issues.push('Missing or invalid VITE_STRIPE_PROFESSIONAL_PRICE_ID');
  }
  
  if (!STRIPE_PLANS.enterprise.priceId || isPlaceholder(STRIPE_PLANS.enterprise.priceId)) {
    issues.push('Missing or invalid VITE_STRIPE_ENTERPRISE_PRICE_ID');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

// Get setup instructions
export const getStripeSetupInstructions = () => {
  return {
    title: "Stripe Configuration Required",
    steps: [
      "1. Go to dashboard.stripe.com and sign in",
      "2. Make sure you're in Test mode (toggle in top-left)",
      "3. Go to Developers → API keys",
      "4. Copy your Publishable key (starts with pk_test_)",
      "5. Go to Products and create three products:",
      "   - Starter Plan: $29/month",
      "   - Professional Plan: $99/month", 
      "   - Enterprise Plan: $299/month",
      "6. Copy each Price ID (starts with price_)",
      "7. Add all keys to your .env file:",
      "   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...",
      "   VITE_STRIPE_STARTER_PRICE_ID=price_...",
      "   VITE_STRIPE_PROFESSIONAL_PRICE_ID=price_...",
      "   VITE_STRIPE_ENTERPRISE_PRICE_ID=price_..."
    ]
  };
};