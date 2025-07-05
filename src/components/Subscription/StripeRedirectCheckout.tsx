import React, { useState, useEffect } from 'react';
import { CreditCard, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { PaymentLogger } from '../../utils/paymentLogger';

interface StripeRedirectCheckoutProps {
  plan: string;
  onCancel: () => void;
}

export default function StripeRedirectCheckout({ plan, onCancel }: StripeRedirectCheckoutProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    createCheckoutSession();
  }, []);

  const createCheckoutSession = async () => {
    setIsLoading(true);
    setError(null);
    PaymentLogger.trackPaymentFlow('Creating Stripe redirect checkout session', { plan });

    try {
      // Instead of directly calling Stripe API, use our Edge Function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          amount: plan === 'starter' ? 2900 : plan === 'professional' ? 9900 : 29900,
          currency: 'usd',
          metadata: {
            userId: 'temp_user_id', // This would be the actual user ID in a real implementation
            plan: plan,
            email: 'demo@example.com'
          },
          redirect: {
            success_url: `${window.location.origin}?session_id=demo_session_id&plan=${plan}`,
            cancel_url: window.location.origin
          }
        })
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to create payment session';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If we can't parse the error, use the default message
        }
        throw new Error(errorMessage);
      }

      const session = await response.json();
      
      PaymentLogger.trackPaymentFlow('Checkout session created', { 
        sessionId: session.clientSecret || 'demo_session',
        amount: session.amount,
        currency: session.currency
      });
      
      // For demo purposes, simulate a checkout URL
      setSessionId('demo_session_id');
      setCheckoutUrl(`${window.location.origin}?demo_checkout=true&plan=${plan}`);
      
      // In a real implementation with Stripe Checkout, we would use:
      // setSessionId(session.id);
      // setCheckoutUrl(session.url);
    } catch (error) {
      PaymentLogger.log('error', 'StripeRedirectCheckout', 'Failed to create checkout session', error);
      setError(error.message || 'Failed to create checkout session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedirect = () => {
    if (checkoutUrl) {
      PaymentLogger.trackPaymentFlow('Redirecting to Stripe checkout', { url: checkoutUrl });
      
      // For demo purposes, simulate a successful payment
      setTimeout(() => {
        // Update the URL with success parameters
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
        
        window.location.href = `${window.location.origin}?session_id=${uniqueSessionId}&plan=${plan}&user_id=${userId}`;
      }, 1000);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl border border-gray-200 p-8">
      <div className="text-center mb-6">
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
                Try Again
              </button>
            </div>
          </div>
        </div>
      ) : checkoutUrl ? (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-900 mb-2">Checkout Ready</h3>
                <p className="text-green-800 text-sm">
                  Your secure checkout session has been created. Click the button below to proceed to payment.
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={handleRedirect}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <CreditCard className="w-5 h-5" />
              <span>Proceed to Checkout</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Something went wrong. Please try again.</p>
          <button
            onClick={createCheckoutSession}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}