import React from 'react';
import { CheckCircle, AlertCircle, CreditCard, ExternalLink, Copy } from 'lucide-react';
import { validateStripeConfig, getStripeSetupInstructions } from '../../lib/stripe';

export default function StripeStatus() {
  const config = validateStripeConfig();
  const setupInstructions = getStripeSetupInstructions();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const envTemplate = `# Add these to your .env file:
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key
VITE_STRIPE_STARTER_PRICE_ID=price_your_actual_starter_price_id
VITE_STRIPE_PROFESSIONAL_PRICE_ID=price_your_actual_professional_price_id
VITE_STRIPE_ENTERPRISE_PRICE_ID=price_your_actual_enterprise_price_id`;

  if (config.isValid) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-emerald-900 mb-1">
              Stripe Integration Active
            </h4>
            <p className="text-sm text-emerald-800">
              Payment processing is configured and ready to accept payments.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-lg font-medium text-yellow-900 mb-3">
            Stripe Configuration Required
          </h4>
          
          <div className="space-y-1 text-sm text-yellow-800 mb-4">
            <p className="font-medium">Missing or invalid configuration:</p>
            {config.issues.map((issue, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="w-1 h-1 bg-yellow-600 rounded-full"></span>
                <span>{issue}</span>
              </div>
            ))}
          </div>

          <div className="bg-white border border-yellow-200 rounded-lg p-4 mb-4">
            <h5 className="font-medium text-yellow-900 mb-3">Setup Instructions:</h5>
            <ol className="space-y-1 text-sm text-yellow-800">
              {setupInstructions.steps.map((step, index) => (
                <li key={index} className="leading-relaxed">{step}</li>
              ))}
            </ol>
          </div>

          <div className="bg-gray-900 text-green-400 p-4 rounded-lg mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">Environment Variables Template:</span>
              <button
                onClick={() => copyToClipboard(envTemplate)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title="Copy to clipboard"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <pre className="text-xs overflow-x-auto">{envTemplate}</pre>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href="https://dashboard.stripe.com/test/products"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              <span>Open Stripe Dashboard</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            
            <a
              href="https://docs.stripe.com/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-yellow-700 hover:text-yellow-800 text-sm"
            >
              <span>View Stripe Documentation</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}