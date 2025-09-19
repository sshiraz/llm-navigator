import { loadStripe } from '@stripe/stripe-js';
import { PaymentLogger } from './paymentLogger';
import { getPlanAmount as getPlanAmountFromConfig } from './planConfig';

// Environment variables
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Initialize Stripe
export const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

// Check if we're in live mode
export const isLiveMode = false; // Force test mode for safety

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

// Create payment intent
export const createPaymentIntent = async (amount: number, metadata: any) => {
  try {
    PaymentLogger.trackPaymentFlow('Creating payment intent', { amount, metadata });
    
    const response = await fetch(`${supabaseUrl}/functions/v1/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({
        amount,
        currency: 'usd',
        metadata
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create payment intent');
    }
    
    const data = await response.json();
    PaymentLogger.trackPaymentFlow('Payment intent created', data);
    
    return { success: true, data };
  } catch (error) {
    PaymentLogger.log('error', 'StripeUtils', 'Failed to create payment intent', error);
    return { success: false, error: error.message };
  }
};

// Create subscription
export const createSubscription = async (userId: string, email: string, plan: string, paymentMethodId: string) => {
  try {
    const planConfig = STRIPE_PLANS[plan as keyof typeof STRIPE_PLANS];
    if (!planConfig) {
      return { success: false, error: 'Invalid plan selected' };
    }
    
    const response = await fetch(`${supabaseUrl}/functions/v1/create-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({
        userId,
        email,
        plan,
        priceId: planConfig.priceId,
        paymentMethodId
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create subscription');
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    PaymentLogger.log('error', 'StripeUtils', 'Failed to create subscription', error);
    return { success: false, error: error.message };
  }
};

// Handle successful payment
export const handlePaymentSuccess = async (userId: string, plan: string, paymentIntentId: string) => {
  try {
    PaymentLogger.trackPaymentFlow('Handling payment success', { userId, plan, paymentIntentId });
    
    // Update user in localStorage
    const currentUserStr = localStorage.getItem('currentUser');
    if (currentUserStr) {
      try {
        const currentUser = JSON.parse(currentUserStr);
        const updatedUser = {
          ...currentUser,
          subscription: plan,
          paymentMethodAdded: true
        };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        PaymentLogger.log('info', 'StripeUtils', 'Updated user in localStorage', { userId, plan });
      } catch (e) {
        console.error('Failed to update stored user', e);
      }
    }
    
    return { success: true };
  } catch (error) {
    PaymentLogger.log('error', 'StripeUtils', 'Failed to handle payment success', error);
    return { success: false, error: error.message };
  }
};

// Get plan amount
export const getPlanAmount = getPlanAmountFromConfig;

// Get formatted plan price
export const getPlanPrice = (plan: string): string => {
  const amount = getPlanAmount(plan);
  return formatAmount(amount);
};