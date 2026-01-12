import { PaymentLogger } from './paymentLogger';

// Check if we're in live mode
// LIVE MODE ENABLED - Real payments will be processed
export const isLiveMode = true;

// Log live mode status on initialization
if (isLiveMode) {
  console.warn('%c 🔴 LIVE MODE ACTIVE - REAL PAYMENTS WILL BE PROCESSED ', 
    'background: #f44336; color: white; font-size: 14px; font-weight: bold; padding: 4px;');
  
  PaymentLogger.log('warn', 'LiveMode', '🔴 LIVE MODE ACTIVE - Using production Stripe keys');
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