import React from 'react';
import { CheckCircle, AlertCircle, CreditCard, ExternalLink } from 'lucide-react';
import { validateStripeConfig } from '../../lib/stripe';
import { PaymentLogger } from '../../utils/paymentLogger';

export default function StripeStatus() {
  const config = validateStripeConfig();
  const isLiveMode = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_live_');
  
  // Log Stripe configuration status
  React.useEffect(() => {
    PaymentLogger.log(
      'info', 
      'StripeStatus', 
      `Stripe configuration ${config.isValid ? 'valid' : 'invalid'}`, 
      { 
        isLiveMode,
        issues: config.issues,
        hasPublishableKey: !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
        hasPriceIds: {
          starter: !!import.meta.env.VITE_STRIPE_STARTER_PRICE_ID,
          professional: !!import.meta.env.VITE_STRIPE_PROFESSIONAL_PRICE_ID,
          enterprise: !!import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID
        }
      }
    );
  }, [config.isValid, isLiveMode]);

  if (config.isValid) {
    return (
      <div className={`${isLiveMode ? 'bg-red-50 border border-red-200' : 'bg-emerald-50 border border-emerald-200'} rounded-lg p-4`}>
        <div className="flex items-start space-x-3">
          <CheckCircle className={`w-5 h-5 ${isLiveMode ? 'text-red-600' : 'text-emerald-600'} mt-0.5`} />
          <div>
            <h4 className={`text-sm font-medium ${isLiveMode ? 'text-red-900' : 'text-emerald-900'} mb-1`}>
              {isLiveMode ? '🔴 LIVE MODE - Production Stripe Keys Active' : 'Stripe Integration Active (Test Mode)'}
            </h4>
            <div className="space-y-1 text-sm text-yellow-800 mb-3 max-h-32 overflow-y-auto">
              {isLiveMode 
                ? 'Payment processing is configured with LIVE keys. Real credit cards will be charged.' 
                : 'Payment processing is configured in TEST mode. Use test cards for payments.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-yellow-900 mb-2">
            Stripe Configuration Incomplete
          </h4>
          <div className="space-y-1 text-sm text-yellow-800 mb-3">
            {config.issues.map((issue, index) => (
              <div key={index}>• {issue}</div>
            ))}
          </div>
          <div className="flex items-center space-x-3">
            <a
              href="https://dashboard.stripe.com/test/products"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-sm text-yellow-700 hover:text-yellow-800 font-medium"
            >
              <CreditCard className="w-4 h-4" />
              <span>Create Products in Stripe</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}