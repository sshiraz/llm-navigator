import React, { useState } from 'react';
import { CreditCard, Lock, ArrowRight } from 'lucide-react';
import { formatAmount, STRIPE_PLANS } from '../../utils/stripeUtils';
import { isLiveMode } from '../../utils/liveMode';
import LiveModeIndicator from '../UI/LiveModeIndicator';
import SecurePaymentNotice from '../UI/SecurePaymentNotice';
import PlanFeatures from '../UI/PlanFeatures';
import { supabase } from '../../lib/supabase';

interface StripeRedirectCheckoutProps {
  plan: string;
  onCancel: () => void;
}

export default function StripeRedirectCheckout({ plan, onCancel }: StripeRedirectCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const planConfig = STRIPE_PLANS[plan as keyof typeof STRIPE_PLANS];
  const planPrice = planConfig ? formatAmount(planConfig.amount) : '$0';
  const SUPABASE_FUNCTIONS_URL = 'https://jgkdzaoajbzmuuajpndv.functions.supabase.co';

  const handleCheckout = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Get Supabase access token and user data
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      const userId = session?.user?.id || '';
      const email = session?.user?.email || '';
      
      if (!accessToken || !userId || !email) {
        setError('Please log in to continue');
        setIsLoading(false);
        return;
      }

      const priceId = STRIPE_PLANS[plan as keyof typeof STRIPE_PLANS]?.priceId;
      
      console.log('Creating Stripe Checkout session for:', { userId, email, plan, priceId });

      // Create Stripe Checkout session
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ 
          userId, 
          email, 
          plan, 
          priceId,
          successUrl: `${window.location.origin}/#auth?checkout=success`,
          cancelUrl: `${window.location.origin}/#auth?checkout=cancel`
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Checkout session creation failed:', errorData);
        setError('Failed to create checkout session');
        setIsLoading(false);
        return;
      }

      const { sessionUrl } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = sessionUrl;
      
    } catch (error) {
      console.error('Checkout error:', error);
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl border border-gray-200 p-8">
      <div className="text-center mb-8">
        {isLiveMode && <LiveModeIndicator variant="warning" className="mb-6" />}
        
        <div className="flex items-center justify-center space-x-3 mb-4">
          <CreditCard className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            Complete Your Purchase
          </h2>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="text-2xl font-bold text-blue-900 mb-2">
            {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - {planPrice}/month
          </div>
          <p className="text-blue-800 text-sm">
            Secure payment processing by Stripe
          </p>
        </div>
      </div>

      {/* Plan Features */}
      <div className="mb-8">
        <PlanFeatures plan={plan} />
      </div>

      {/* Security Notice */}
      <div className="mb-8">
        <SecurePaymentNotice />
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-red-800 font-medium">Payment Error</span>
          </div>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
        
        <button
          onClick={handleCheckout}
          disabled={isLoading}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Creating checkout...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Pay Securely with Stripe</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Terms */}
      <div className="mt-6 text-xs text-gray-500 text-center">
        <p>
          By completing this purchase, you agree to our{' '}
          <a href="#terms" onClick={(e) => {e.preventDefault(); window.location.hash = '#terms';}} className="text-blue-600 hover:text-blue-700">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#privacy" onClick={(e) => {e.preventDefault(); window.location.hash = '#privacy';}} className="text-blue-600 hover:text-blue-700">
            Privacy Policy
          </a>.
        </p>
        <p className="mt-1">
          Secure payment processing provided by Stripe. Your card details are never stored on our servers.
        </p>
      </div>
    </div>
  );
}