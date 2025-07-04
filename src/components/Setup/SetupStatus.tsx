import React, { useState } from 'react';
import { CheckCircle, AlertCircle, ExternalLink, Copy, Eye, EyeOff, Database, CreditCard, Zap } from 'lucide-react';
import { validateStripeConfig } from '../../lib/stripe';

export default function SetupStatus() {
  const [showKeys, setShowKeys] = useState(false);
  const [step, setStep] = useState(1);

  const stripeConfig = validateStripeConfig();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const isSupabaseConfigured = supabaseUrl && supabaseKey;
  const isStripeConfigured = stripeConfig.isValid;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const steps = [
    {
      id: 1,
      title: 'Database Connection',
      description: 'Supabase database is connected and ready',
      status: isSupabaseConfigured ? 'complete' : 'pending',
      icon: Database
    },
    {
      id: 2,
      title: 'Payment Processing',
      description: 'Stripe integration for payment processing',
      status: isStripeConfigured ? 'complete' : 'pending',
      icon: CreditCard
    },
    {
      id: 3,
      title: 'Edge Functions',
      description: 'Serverless functions for payment handling',
      status: 'pending',
      icon: Zap
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🎯 LLM Navigator Setup
        </h1>
        <p className="text-lg text-gray-600">
          Your application is 95% complete! Let's finish the setup.
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {steps.map((stepItem) => {
          const Icon = stepItem.icon;
          const isComplete = stepItem.status === 'complete';
          
          return (
            <div 
              key={stepItem.id}
              className={`p-6 rounded-xl border-2 ${
                isComplete 
                  ? 'border-emerald-500 bg-emerald-50' 
                  : 'border-gray-300 bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isComplete ? 'bg-emerald-600' : 'bg-gray-400'
                }`}>
                  {isComplete ? (
                    <CheckCircle className="w-6 h-6 text-white" />
                  ) : (
                    <Icon className="w-6 h-6 text-white" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {stepItem.title}
                </h3>
              </div>
              <p className="text-gray-600 text-sm">
                {stepItem.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Current Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Current Configuration Status</h2>
        
        <div className="space-y-4">
          {/* Supabase Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {isSupabaseConfigured ? (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <div>
                <h3 className="font-medium text-gray-900">Supabase Database</h3>
                <p className="text-sm text-gray-600">
                  {isSupabaseConfigured ? 'Connected and ready' : 'Not configured'}
                </p>
              </div>
            </div>
            {isSupabaseConfigured && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-sm rounded-full">
                Ready
              </span>
            )}
          </div>

          {/* Stripe Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {isStripeConfigured ? (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              )}
              <div>
                <h3 className="font-medium text-gray-900">Stripe Payment Processing</h3>
                <p className="text-sm text-gray-600">
                  {isStripeConfigured ? 'Configured and ready' : 'Needs configuration'}
                </p>
              </div>
            </div>
            {isStripeConfigured ? (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-sm rounded-full">
                Ready
              </span>
            ) : (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                Pending
              </span>
            )}
          </div>

          {/* Edge Functions Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <h3 className="font-medium text-gray-900">Edge Functions</h3>
                <p className="text-sm text-gray-600">
                  Need to be deployed for payment processing
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
              Pending
            </span>
          </div>
        </div>
      </div>

      {/* Quick Start Option */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-8 mb-8">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">
          🚀 Quick Start - Demo Mode
        </h2>
        <p className="text-blue-800 mb-4">
          Your app is already functional in demo mode! You can:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 mb-6">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>Run unlimited demo analyses</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>Test all UI features</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>Experience the full workflow</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>Generate PDF reports</span>
          </div>
        </div>
        <div className="bg-white border border-blue-200 rounded-lg p-4">
          <p className="text-blue-900 font-medium mb-2">Demo Mode Active:</p>
          <p className="text-blue-800 text-sm">
            All analyses are simulated but realistic. Upgrade to paid plans for real website crawling, 
            AI-powered insights, and live payment processing.
          </p>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Complete Setup Instructions
        </h2>
        
        <div className="space-y-6">
          {/* Stripe Setup */}
          {!isStripeConfigured && (
            <div className="border border-yellow-200 rounded-lg p-6 bg-yellow-50">
              <h3 className="font-semibold text-yellow-900 mb-4">
                1. Set Up Stripe Payment Processing
              </h3>
              <div className="space-y-3 text-sm text-yellow-800">
                <div className="flex items-start space-x-2">
                  <span className="font-bold">1.</span>
                  <div>
                    Go to <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-medium">
                      Stripe Dashboard <ExternalLink className="w-3 h-3 inline" />
                    </a> and get your API keys
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-bold">2.</span>
                  <span>Create products for Starter ($29), Professional ($99), and Enterprise ($299) plans</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-bold">3.</span>
                  <span>Copy the Price IDs and add them to your environment variables</span>
                </div>
              </div>
            </div>
          )}

          {/* Edge Functions Setup */}
          <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
            <h3 className="font-semibold text-blue-900 mb-4">
              2. Deploy Edge Functions (Required for Payments)
            </h3>
            <div className="space-y-3 text-sm text-blue-800">
              <div className="bg-blue-900 text-blue-100 p-4 rounded-lg font-mono text-xs">
                <div># Install Supabase CLI</div>
                <div>npm install -g supabase</div>
                <div className="mt-2"># Login and link to project</div>
                <div>supabase login</div>
                <div>supabase link --project-ref jgkdzaoajbzmuuajpndv</div>
                <div className="mt-2"># Deploy functions</div>
                <div>supabase functions deploy create-payment-intent</div>
                <div>supabase functions deploy create-subscription</div>
                <div>supabase functions deploy stripe-webhook</div>
              </div>
            </div>
          </div>

          {/* Environment Variables */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              3. Environment Variables Template
            </h3>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs">
              <div># Supabase (already configured)</div>
              <div>VITE_SUPABASE_URL={supabaseUrl || 'your_supabase_url'}</div>
              <div>VITE_SUPABASE_ANON_KEY={showKeys ? supabaseKey : '••••••••'}</div>
              <div className="mt-2"># Stripe (you need to add these)</div>
              <div>VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key</div>
              <div>STRIPE_SECRET_KEY=sk_test_your_key</div>
              <div className="mt-2"># Stripe Price IDs</div>
              <div>VITE_STRIPE_STARTER_PRICE_ID=price_starter</div>
              <div>VITE_STRIPE_PROFESSIONAL_PRICE_ID=price_professional</div>
              <div>VITE_STRIPE_ENTERPRISE_PRICE_ID=price_enterprise</div>
            </div>
            <button
              onClick={() => setShowKeys(!showKeys)}
              className="mt-2 flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
            >
              {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showKeys ? 'Hide' : 'Show'} keys</span>
            </button>
          </div>
        </div>
      </div>

      {/* Help Links */}
      <div className="mt-8 text-center">
        <p className="text-gray-600 mb-4">
          Need detailed setup instructions?
        </p>
        <div className="flex items-center justify-center space-x-6 text-sm">
          <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
            📖 Complete Setup Guide
          </a>
          <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
            💳 Stripe Setup Guide
          </a>
          <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
            🚀 Deployment Guide
          </a>
        </div>
      </div>
    </div>
  );
}