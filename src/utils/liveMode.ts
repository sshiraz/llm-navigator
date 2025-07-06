import { PaymentLogger } from './paymentLogger';

// Check if we're in live mode
export const isLiveMode = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_live_');

// Log live mode status on initialization
if (isLiveMode) {
  console.warn('%c 🔴 LIVE MODE ACTIVE - REAL PAYMENTS WILL BE PROCESSED ', 
    'background: #f44336; color: white; font-size: 14px; font-weight: bold; padding: 4px;');
  
  PaymentLogger.log('warn', 'LiveMode', '🔴 LIVE MODE ACTIVE - Using production Stripe keys');
}

// Get live mode banner component
export const LiveModeBanner = () => {
  if (!isLiveMode) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-1 z-50">
      <strong>🔴 LIVE MODE</strong> - Real credit cards will be charged
    </div>
  );
};

// Get live mode warning for components
export const getLiveModeWarning = (component: string) => {
  if (!isLiveMode) return null;
  
  PaymentLogger.log('warn', component, '🔴 LIVE MODE - Real payments will be processed');
  
  return (
    <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-6">
      <p className="text-red-800 font-medium">
        🔴 LIVE MODE ACTIVE - Real credit cards will be charged
      </p>
      <p className="text-red-700 text-sm mt-1">
        You are using production Stripe keys. Any payments made will process real credit cards.
      </p>
    </div>
  );
};

// Add live mode class to elements
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