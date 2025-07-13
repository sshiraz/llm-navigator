import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Lock, CreditCard } from 'lucide-react';
import { PaymentLogger } from '../../utils/paymentLogger'; 
import { formatAmount, STRIPE_PLANS } from '../../utils/stripeUtils';
import { isLiveMode } from '../../utils/liveMode';
import LiveModeIndicator from '../UI/LiveModeIndicator';
import SecurePaymentNotice from '../UI/SecurePaymentNotice';
import PlanFeatures from '../UI/PlanFeatures';
import { supabase } from '../../lib/supabase';

interface CheckoutFormProps {
  plan: string;
  userId: string;
  email: string;
  onSuccess: (paymentData: any) => void;
  onCancel: () => void;
}

export default function CheckoutForm({ plan, userId, email, onSuccess, onCancel }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const planConfig = STRIPE_PLANS[plan as keyof typeof STRIPE_PLANS];
  const planPrice = planConfig ? formatAmount(planConfig.amount) : '$0';
  const SUPABASE_FUNCTIONS_URL = 'https://jgkdzaoajbzmuuajpndv.functions.supabase.co';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    PaymentLogger.trackPaymentFlow('Checkout form submitted', { plan });
    if (!stripe || !elements) {
      PaymentLogger.log('error', 'CheckoutForm', 'Stripe not initialized');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        PaymentLogger.log('error', 'CheckoutForm', 'Form submission error', submitError);
        setError(submitError.message || 'Payment failed');
        setIsLoading(false);
        return;
      }
      // Get Supabase access token
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        setError('Authentication required');
        setIsLoading(false);
        return;
      }
      // Step 1: Get SetupIntent from backend
      console.log('Sending to create-subscription:', { userId, email, plan, priceId: planConfig.priceId });
      const setupRes = await fetch(`${SUPABASE_FUNCTIONS_URL}/create-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ userId, email, plan, priceId: planConfig.priceId })
      });
      let setupData;
      try {
        setupData = await setupRes.json();
      } catch (e) {
        setupData = { error: 'Non-JSON error', text: await setupRes.text() };
      }
      if (!setupRes.ok) {
        console.error('Create subscription error:', setupData);
        setError(setupData.error || 'Failed to create subscription');
        setIsLoading(false);
        return;
      } else {
        console.log('Create subscription success:', setupData);
      }
      // Step 2: Confirm the SetupIntent with PaymentElement
      const { error: confirmError } = await stripe.confirmSetup({
        elements,
        clientSecret: setupData.clientSecret,
        confirmParams: {
          return_url: window.location.origin + '/dashboard',
        },
      });
      if (confirmError) {
        PaymentLogger.log('error', 'CheckoutForm', 'Setup confirmation failed', confirmError);
        setError(confirmError.message || 'Payment setup failed');
        setIsLoading(false);
        return;
      }
      // Step 3: Create subscription after successful setup
      console.log('Sending to create-subscription-after-setup:', {
        customerId: setupData.customerId,
        priceId: planConfig.priceId,
        userId,
        plan
      });
      const subscriptionRes = await fetch(`${SUPABASE_FUNCTIONS_URL}/create-subscription-after-setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          customerId: setupData.customerId,
          priceId: planConfig.priceId,
          userId,
          plan
        })
      });
      let subscriptionData;
      try {
        subscriptionData = await subscriptionRes.json();
      } catch (e) {
        subscriptionData = { error: 'Non-JSON error', text: await subscriptionRes.text() };
      }
      if (!subscriptionRes.ok) {
        console.error('Create subscription after setup error:', subscriptionData);
        setError(subscriptionData.error || 'Failed to create subscription');
        setIsLoading(false);
        return;
      } else {
        console.log('Create subscription after setup success:', subscriptionData);
      }
      // Success!
      onSuccess(subscriptionData.subscription);
    } catch (err) {
      PaymentLogger.log('error', 'CheckoutForm', 'Unexpected payment error', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className={`${isLiveMode ? 'bg-gradient-to-r from-red-600 to-red-700' : 'bg-gradient-to-r from-blue-600 to-indigo-600'} text-white p-6`}>
        <div className="text-center">
          {isLiveMode && 
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 mb-3">
              <p className="text-white font-bold">🔴 LIVE MODE - REAL PAYMENT</p>
            </div>
          }
          <CreditCard className="w-8 h-8 mx-auto mb-2" />
          <h2 className="text-xl font-bold mb-1">Complete Payment</h2>
          <p className="text-blue-100">
            {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - {planPrice}/month
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        {isLiveMode && 
          <div className="mb-4 bg-red-50 border-2 border-red-300 rounded-lg p-3">
            <p className="text-red-800 font-medium text-sm">
              ⚠️ LIVE MODE: Your card will be charged ${planPrice}/month
            </p>
          </div>
        }
      
        {/* Payment Element */}
        <div className="mb-6">
          <PaymentElement 
            options={{
              layout: 'tabs',
            }}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Security Notice */}
        <SecurePaymentNotice className="mb-6" />

        {/* Plan Features */}
        <PlanFeatures plan={plan} className="mb-6" />

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={!stripe || isLoading}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Pay {planPrice}/month</span>
              </>
            )}
          </button>
        </div>

        {/* Terms */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          By completing this payment, you agree to our Terms of Service and Privacy Policy. 
          Your subscription will automatically renew monthly until cancelled.
        </div>
      </form>
    </div>
  );
} 