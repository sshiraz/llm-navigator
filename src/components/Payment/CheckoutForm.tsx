import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Shield, Lock, CreditCard, CheckCircle } from 'lucide-react';
import { formatAmount, STRIPE_PLANS } from '../../lib/stripe';
import { PaymentDebugger } from '../../utils/paymentDebugger';
import PaymentErrorHandler from './PaymentErrorHandler';

interface CheckoutFormProps {
  plan: string;
  onSuccess: (paymentData: any) => void;
  onCancel: () => void;
}

export default function CheckoutForm({ plan, onSuccess, onCancel }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showErrorHandler, setShowErrorHandler] = useState(false);

  const planConfig = STRIPE_PLANS[plan as keyof typeof STRIPE_PLANS];
  const planPrice = planConfig ? formatAmount(planConfig.amount) : '$0';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    PaymentDebugger.log('Checkout Form Submitted', { plan, planPrice });

    if (!stripe || !elements) {
      const errorMsg = `Stripe not ready: stripe=${!!stripe}, elements=${!!elements}`;
      PaymentDebugger.log('Stripe Not Ready', { stripe: !!stripe, elements: !!elements }, 'error');
      setError(errorMsg);
      setShowErrorHandler(true);
      return;
    }

    setIsLoading(true);
    setError('');
    setShowErrorHandler(false);

    try {
      PaymentDebugger.log('Submitting Payment Elements');
      const { error: submitError } = await elements.submit();
      
      if (submitError) {
        PaymentDebugger.log('Elements Submit Error', { 
          error: submitError.message,
          type: submitError.type,
          code: submitError.code 
        }, 'error');
        setError(submitError.message || 'Payment validation failed');
        setShowErrorHandler(true);
        setIsLoading(false);
        return;
      }

      PaymentDebugger.log('Confirming Payment');
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        PaymentDebugger.log('Payment Confirmation Error', { 
          error: confirmError.message,
          type: confirmError.type,
          code: confirmError.code,
          decline_code: confirmError.decline_code,
          payment_intent: confirmError.payment_intent?.id
        }, 'error');
        
        let userFriendlyError = confirmError.message || 'Payment failed';
        
        // Provide more specific error messages
        if (confirmError.type === 'card_error') {
          if (confirmError.code === 'card_declined') {
            userFriendlyError = 'Your card was declined. Please try a different payment method.';
          } else if (confirmError.code === 'insufficient_funds') {
            userFriendlyError = 'Insufficient funds. Please try a different payment method.';
          } else if (confirmError.code === 'expired_card') {
            userFriendlyError = 'Your card has expired. Please use a different payment method.';
          }
        } else if (confirmError.type === 'validation_error') {
          userFriendlyError = 'Please check your payment information and try again.';
        }
        
        setError(userFriendlyError);
        setShowErrorHandler(true);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        PaymentDebugger.log('Payment Succeeded', { 
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          status: paymentIntent.status 
        });
        
        // Payment successful
        onSuccess({
          paymentIntentId: paymentIntent.id,
          plan,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        });
      } else {
        PaymentDebugger.log('Unexpected Payment Status', { 
          status: paymentIntent?.status,
          paymentIntentId: paymentIntent?.id 
        }, 'warn');
        
        setError(`Payment status: ${paymentIntent?.status || 'unknown'}. Please contact support.`);
        setShowErrorHandler(true);
      }
    } catch (err: any) {
      PaymentDebugger.log('Payment Processing Error', { 
        error: err.message,
        stack: err.stack,
        name: err.name
      }, 'error');
      
      let userFriendlyError = 'An unexpected error occurred during payment processing.';
      
      if (err.message?.includes('network') || err.message?.includes('fetch')) {
        userFriendlyError = 'Network error. Please check your connection and try again.';
      } else if (err.message?.includes('timeout')) {
        userFriendlyError = 'Payment processing timed out. Please try again.';
      }
      
      setError(userFriendlyError);
      setShowErrorHandler(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setShowErrorHandler(false);
    setError('');
    PaymentDebugger.log('Payment Retry Initiated');
  };

  if (showErrorHandler) {
    return (
      <PaymentErrorHandler
        error={error}
        onRetry={handleRetry}
        onCancel={onCancel}
        context={{
          plan,
          planPrice,
          hasStripe: !!stripe,
          hasElements: !!elements,
          timestamp: new Date().toISOString()
        }}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
        <div className="text-center">
          <CreditCard className="w-8 h-8 mx-auto mb-2" />
          <h2 className="text-xl font-bold mb-1">Complete Payment</h2>
          <p className="text-blue-100">
            {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - {planPrice}/month
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        {/* Payment Element */}
        <div className="mb-6">
          <PaymentElement 
            options={{
              layout: 'tabs',
            }}
            onReady={() => {
              PaymentDebugger.log('Payment Element Ready');
            }}
            onChange={(event) => {
              PaymentDebugger.log('Payment Element Changed', { 
                complete: event.complete,
                empty: event.empty,
                error: event.error?.message 
              });
              
              // Clear any previous errors when user starts typing
              if (error && event.complete) {
                setError('');
              }
            }}
            onLoadError={(error) => {
              PaymentDebugger.log('Payment Element Load Error', { error: error.message }, 'error');
              setError('Failed to load payment form. Please refresh and try again.');
              setShowErrorHandler(true);
            }}
          />
        </div>

        {/* Error Message */}
        {error && !showErrorHandler && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Security Notice */}
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-green-900 mb-1">
                Secure Payment
              </h4>
              <p className="text-sm text-green-800">
                Your payment is secured by Stripe's industry-leading encryption. 
                We never store your card details.
              </p>
            </div>
          </div>
        </div>

        {/* Plan Features */}
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">What's included:</h4>
          <div className="space-y-2 text-sm">
            {plan === 'starter' && (
              <>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>10 analyses per month</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>3 projects</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Real website crawling</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Email support</span>
                </div>
              </>
            )}
            {plan === 'professional' && (
              <>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>50 analyses per month</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Unlimited projects</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Competitor strategy reports</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Priority support</span>
                </div>
              </>
            )}
            {plan === 'enterprise' && (
              <>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Unlimited analyses</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>White-label reports</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>API access</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Dedicated support</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => {
              PaymentDebugger.log('Checkout Cancelled by User');
              onCancel();
            }}
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