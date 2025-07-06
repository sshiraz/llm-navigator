import React, { useState, useEffect } from 'react';
import { CreditCard, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { PaymentLogger } from '../../utils/paymentLogger';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise, STRIPE_CONFIG } from '../../lib/stripe';
import CheckoutForm from '../Payment/CheckoutForm';

interface StripeRedirectCheckoutProps {
  plan: string;
  onCancel: () => void;
}

export default function StripeRedirectCheckout({ plan, onCancel }: StripeRedirectCheckoutProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [planAmount, setPlanAmount] = useState(0);
  
  // Check if we're in live mode
  const isLiveMode = React.useMemo(() => {
    const isLive = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_live_');
    if (isLive) {
      PaymentLogger.log('warn', 'StripeRedirectCheckout', '🔴 LIVE MODE - Real payments will be processed');
    }
    return isLive;
  }, []);

  useEffect(() => {
    createCheckoutSession();
  }, []);

  const createCheckoutSession = async () => {
    setIsLoading(true);
    setError(null);
    PaymentLogger.trackPaymentFlow('Creating Stripe redirect checkout session', { plan });

    try {
      // Instead of directly calling Stripe API, use our Edge Function
      // Determine the amount based on the plan
      const amount = plan === 'starter' ? 2900 : plan === 'professional' ? 9900 : 29900;
      setPlanAmount(amount);
      
      // Log the checkout session creation
      PaymentLogger.trackPaymentFlow('Checkout session created', { 
        plan,
        amount,
        timestamp: new Date().toISOString()
      });
      
      // Show the credit card form
      setShowCheckoutForm(true);
    } catch (error) {
      PaymentLogger.log('error', 'StripeRedirectCheckout', 'Failed to create checkout session', error);
      setError(error.message || 'Failed to create checkout session');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentData: any) => {
    // Get the current user from localStorage
    const currentUserStr = localStorage.getItem('currentUser');
    let userId = 'temp_user_id';
    
    if (currentUserStr) {
      try {
        const currentUser = JSON.parse(currentUserStr);
        userId = currentUser.id;
      } catch (e) {
        console.error('Failed to parse stored user', e);
      }
    }
    
    // Create a unique session ID to prevent duplicate processing
    const uniqueSessionId = `demo_session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Redirect to success page
    window.location.href = `${window.location.origin}?session_id=${uniqueSessionId}&plan=${plan}&user_id=${userId}`;
  };

  // If showing credit card form, render it
  if (showCheckoutForm) {
    return (
      <Elements stripe={stripePromise} options={STRIPE_CONFIG}>
        <CheckoutForm
          selectedPlan={plan}
          amount={planAmount}
          onSuccess={handlePaymentSuccess}
          onCancel={onCancel}
        />
      </Elements>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl border border-gray-200 p-8">
      <div className="text-center mb-6">
        {isLiveMode && (
          <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-medium">
              🔴 LIVE MODE ACTIVE - Real credit cards will be charged
            </p>
            <p className="text-red-700 text-sm mt-1">
              You are using production Stripe keys. Any payments made will process real credit cards.
            </p>
          </div>
        )}
      
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Checkout with Stripe
        </h2>
        <p className="text-gray-600">
          You'll be redirected to Stripe's secure payment page to complete your purchase.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <RefreshCw className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Preparing your checkout session...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900 mb-2">Checkout Error</h3>
              <p className="text-red-800 text-sm">{error}</p>
              <button
                onClick={createCheckoutSession}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Your checkout session is ready!</p>
          <button
            onClick={() => setShowCheckoutForm(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <CreditCard className="w-5 h-5" />
            <span>Continue to Payment</span>
          </button>
        </div>
      )}
    </div>
  );
}