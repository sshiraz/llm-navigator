import React from 'react';
import { CheckCircle, AlertCircle, CreditCard, ExternalLink } from 'lucide-react';
import { validateStripeConfig } from '../../lib/stripe';

export default function StripeStatus() {
  const config = validateStripeConfig();

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