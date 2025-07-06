import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Shield, Lock, CreditCard, CheckCircle } from 'lucide-react';
import { formatAmount, STRIPE_PLANS } from '../../lib/stripe';
import { PaymentLogger } from '../../utils/paymentLogger';

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

  const planConfig = STRIPE_PLANS[plan as keyof typeof STRIPE_PLANS];
  const planPrice = planConfig ? formatAmount(planConfig.amount) : '$0';

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

      PaymentLogger.trackPaymentFlow('Confirming payment with Stripe', { plan });

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        PaymentLogger.log('error', 'CheckoutForm', 'Payment confirmation error', confirmError);
        setError(confirmError.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        PaymentLogger.trackPaymentFlow('Payment succeeded in Stripe', {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          plan
        });
        
        // Payment successful
        onSuccess({
          paymentIntentId: paymentIntent.id,
          plan,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        });
      }
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
          />
        </div>

        {/* Error Message */}
        {error && (
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
                  <span>White-label reports & custom branding</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Premium performance metrics</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Priority email support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Unlimited historical data retention</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Access to all AI models</span>
                </div>
              </>
            )}
          </div>
        </div>

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