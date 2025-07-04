import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise, STRIPE_CONFIG } from '../../lib/stripe';
import CheckoutForm from './CheckoutForm';
import { PaymentService } from '../../services/paymentService';
import { PaymentDebugger } from '../../utils/paymentDebugger';
import { Loader2, CreditCard } from 'lucide-react';

interface StripeCheckoutProps {
  userId: string;
  plan: string;
  email: string;
  onSuccess: (paymentData: any) => void;
  onCancel: () => void;
}

export default function StripeCheckout({ userId, plan, email, onSuccess, onCancel }: StripeCheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    PaymentDebugger.log('StripeCheckout Component Mounted', { userId, plan, email });
    
    const createPaymentIntent = async () => {
      try {
        setLoading(true);
        PaymentDebugger.log('Creating Payment Intent', { userId, plan, email });
        
        const result = await PaymentService.createPaymentIntent(userId, plan, email);
        
        if (result.success && result.data) {
          PaymentDebugger.log('Payment Intent Created', { 
            clientSecretLength: result.data.clientSecret.length,
            amount: result.data.amount 
          });
          setClientSecret(result.data.clientSecret);
        } else {
          PaymentDebugger.log('Payment Intent Creation Failed', { error: result.error }, 'error');
          setError(result.error || 'Failed to initialize payment');
        }
      } catch (err) {
        PaymentDebugger.log('Payment Intent Creation Error', { error: err.message }, 'error');
        setError('Failed to initialize payment');
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [userId, plan, email]);

  // Monitor Stripe instance when it's available
  useEffect(() => {
    if (stripePromise) {
      stripePromise.then(stripe => {
        if (stripe) {
          PaymentDebugger.log('Stripe Instance Loaded', { 
            stripeVersion: stripe._apiVersion || 'unknown' 
          });
          PaymentDebugger.monitorStripeEvents(stripe);
        }
      });
    }
  }, []);

  if (loading) {
    PaymentDebugger.log('Showing Loading State');
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl border border-gray-200 p-8">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Initializing Payment
          </h3>
          <p className="text-gray-600">
            Setting up secure payment processing...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    PaymentDebugger.log('Showing Error State', { error });
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl border border-gray-200 p-8">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Payment Setup Failed
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!clientSecret || !stripePromise) {
    PaymentDebugger.log('Missing Required Data', { 
      hasClientSecret: !!clientSecret, 
      hasStripePromise: !!stripePromise 
    }, 'error');
    
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl border border-gray-200 p-8">
        <div className="text-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-6 h-6 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Payment Not Available
          </h3>
          <p className="text-gray-600 mb-4">
            Stripe is not configured. Please contact support.
          </p>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const options = {
    ...STRIPE_CONFIG,
    clientSecret,
  };

  PaymentDebugger.log('Rendering Stripe Elements', { 
    hasClientSecret: !!clientSecret,
    hasStripePromise: !!stripePromise 
  });

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm
        plan={plan}
        onSuccess={(paymentData) => {
          PaymentDebugger.log('Checkout Success', paymentData);
          onSuccess(paymentData);
        }}
        onCancel={() => {
          PaymentDebugger.log('Checkout Cancelled');
          onCancel();
        }}
      />
    </Elements>
  );
}