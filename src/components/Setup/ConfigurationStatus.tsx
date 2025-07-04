import React, { useState } from 'react';
import { CheckCircle, AlertCircle, ExternalLink, Database, CreditCard, Zap, Settings } from 'lucide-react';
import { validateStripeConfig } from '../../lib/stripe';

export default function ConfigurationStatus() {
  const [showEnvVars, setShowEnvVars] = useState(false);

  // Check current environment variables
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const stripeStarterPrice = import.meta.env.VITE_STRIPE_STARTER_PRICE_ID;
  const stripeProfessionalPrice = import.meta.env.VITE_STRIPE_PROFESSIONAL_PRICE_ID;
  const stripeEnterprisePrice = import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID;

  const stripeConfig = validateStripeConfig();

  const configItems = [
    {
      name: 'Supabase URL',
      value: supabaseUrl,
      status: supabaseUrl ? 'configured' : 'missing',
      required: true
    },
    {
      name: 'Supabase Anon Key',
      value: supabaseKey,
      status: supabaseKey ? 'configured' : 'missing',
      required: true
    },
    {
      name: 'Stripe Publishable Key',
      value: stripePublishableKey,
      status: stripePublishableKey ? 'configured' : 'missing',
      required: true
    },
    {
      name: 'Starter Plan Price ID',
      value: stripeStarterPrice,
      status: stripeStarterPrice ? 'configured' : 'missing',
      required: true
    },
    {
      name: 'Professional Plan Price ID',
      value: stripeProfessionalPrice,
      status: stripeProfessionalPrice ? 'configured' : 'missing',
      required: true
    },
    {
      name: 'Enterprise Plan Price ID',
      value: stripeEnterprisePrice,
      status: stripeEnterprisePrice ? 'configured' : 'missing',
      required: true
    }
  ];

  const configuredCount = configItems.filter(item => item.status === 'configured').length;
  const totalCount = configItems.length;
  const isFullyConfigured = configuredCount === totalCount;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Configuration Status Check
        </h1>
        <p className="text-lg text-gray-600">
          Let's see what's already configured and what might be missing
        </p>
      </div>

      {/* Overall Status */}
      <div className={`rounded-xl border-2 p-6 mb-8 ${
        isFullyConfigured 
          ? 'border-emerald-500 bg-emerald-50' 
          : 'border-yellow-500 bg-yellow-50'
      }`}>
        <div className="flex items-center space-x-3 mb-4">
          {isFullyConfigured ? (
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          ) : (
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          )}
          <div>
            <h2 className="text-xl font-semibold">
              {isFullyConfigured ? 'Fully Configured! 🎉' : 'Partial Configuration'}
            </h2>
            <p className="text-sm">
              {configuredCount} of {totalCount} items configured
            </p>
          </div>
        </div>
        
        <div className="w-full bg-white rounded-full h-3 mb-4">
          <div 
            className={`h-3 rounded-full transition-all ${
              isFullyConfigured ? 'bg-emerald-500' : 'bg-yellow-500'
            }`}
            style={{ width: `${(configuredCount / totalCount) * 100}%` }}
          ></div>
        </div>
        
        {isFullyConfigured ? (
          <p className="text-emerald-800">
            All environment variables are configured! Your app should be fully functional.
          </p>
        ) : (
          <p className="text-yellow-800">
            Some environment variables are missing. Check the details below.
          </p>
        )}
      </div>

      {/* Configuration Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Environment Variables</h3>
          <button
            onClick={() => setShowEnvVars(!showEnvVars)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showEnvVars ? 'Hide Values' : 'Show Values'}
          </button>
        </div>
        
        <div className="space-y-3">
          {configItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {item.status === 'configured' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-medium text-gray-900">{item.name}</span>
              </div>
              
              <div className="text-right">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  item.status === 'configured' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {item.status === 'configured' ? 'Configured' : 'Missing'}
                </span>
                
                {showEnvVars && item.value && (
                  <div className="text-xs text-gray-500 mt-1 font-mono">
                    {item.value.length > 20 ? `${item.value.substring(0, 20)}...` : item.value}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stripe Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Stripe Integration Status</h3>
        
        {stripeConfig.isValid ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="font-medium text-emerald-900">Stripe is fully configured!</span>
            </div>
            <p className="text-emerald-800 text-sm mt-2">
              All Stripe keys and Price IDs are present. Payment processing should work.
            </p>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-900">Stripe configuration incomplete</span>
            </div>
            <div className="text-red-800 text-sm space-y-1">
              {stripeConfig.issues.map((issue, index) => (
                <div key={index}>• {issue}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Next Steps */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Next Steps</h3>
        
        {isFullyConfigured ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-blue-800">✅ Environment variables configured</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-blue-800">🚀 Deploy Edge Functions for payment processing</span>
            </div>
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-blue-500" />
              <span className="text-blue-800">🔗 Set up Stripe webhook endpoint</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-blue-800 mb-3">To complete your setup:</p>
            <div className="space-y-2 text-sm text-blue-800">
              {configItems
                .filter(item => item.status === 'missing')
                .map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span>Add {item.name} to your .env file</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Current App Status */}
      <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current App Status</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-emerald-50 rounded-lg">
            <Database className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <div className="font-medium text-emerald-900">Database</div>
            <div className="text-sm text-emerald-700">
              {supabaseUrl && supabaseKey ? 'Connected' : 'Not Connected'}
            </div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <CreditCard className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="font-medium text-blue-900">Payments</div>
            <div className="text-sm text-blue-700">
              {stripeConfig.isValid ? 'Configured' : 'Needs Setup'}
            </div>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <Zap className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <div className="font-medium text-yellow-900">Functions</div>
            <div className="text-sm text-yellow-700">Need Deployment</div>
          </div>
        </div>
      </div>
    </div>
  );
}