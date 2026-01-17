import { PaymentLogger } from './paymentLogger';

// Auto-detect live mode based on Stripe key
// pk_live_ = production, pk_test_ = test mode
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
export const isLiveMode = stripeKey.startsWith('pk_live_');

// Log live mode status on initialization
if (isLiveMode) {
  console.warn('%c 🔴 LIVE MODE ACTIVE - REAL PAYMENTS WILL BE PROCESSED ',
    'background: #f44336; color: white; font-size: 14px; font-weight: bold; padding: 4px;');

  PaymentLogger.log('warn', 'LiveMode', '🔴 LIVE MODE ACTIVE - Using production Stripe keys');
} else {
  console.info('%c 🧪 TEST MODE - Using Stripe test keys ',
    'background: #4CAF50; color: white; font-size: 14px; font-weight: bold; padding: 4px;');
}

// Get live mode class to elements
export const getLiveModeClass = (baseClass: string) => {
  if (!isLiveMode) return baseClass;
  
  // For gradients, replace blue with red
  if (baseClass.includes('from-blue-600')) {
    return baseClass.replace('from-blue-600', 'from-red-600').replace('to-indigo-600', 'to-red-700');
  }
  
  // For solid colors
  if (baseClass.includes('bg-blue-600')) {
    return baseClass.replace('bg-blue-600', 'bg-red-600').replace('hover:bg-blue-700', 'hover:bg-red-700');
  }
  
  return baseClass;
};

// Disable features in live mode
export const shouldDisableInLiveMode = (feature: string) => {
  if (!isLiveMode) return false;
  
  // List of features to disable in live mode
  const disabledFeatures = [
    'test-webhook',
    'simulate-webhook',
    'test-payment'
  ];
  
  return disabledFeatures.includes(feature);
};