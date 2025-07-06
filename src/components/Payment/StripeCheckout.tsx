import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { STRIPE_CONFIG } from '../../lib/stripe';
import CheckoutForm from '../Payment/CheckoutForm';
import { PaymentService } from '../../services/paymentService';
import { Loader2, CreditCard } from 'lucide-react';

interface StripeCheckoutProps {
  userId: string;
  plan: string;
  email: string;
  onSuccess: (paymentData: any) => void;
  onCancel: () => void;
}

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export default function StripeCheckout({ userId, plan, email, onSuccess, onCancel }: StripeCheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
          setError('Stripe is not configured. Please check your environment variables.');
          setLoading(false);
          return;
        }
        
        setLoading(true);
        
        // For demo purposes, simulate a successful API call
        setTimeout(() => {
          // Generate a fake client secret for demo
          const fakeClientSecret = `pi_${Date.now()}_secret_${Math.random().toString(36).substring(2, 15)}`;
          setClientSecret(fakeClientSecret);
          setLoading(false);
        }, 1500);
        
        // In a real implementation, you would call your API:
        /*
        const result = await PaymentService.createPaymentIntent(userId, plan, email);
        if (result.success && result.data) {
          setClientSecret(result.data.clientSecret);
          setLoading(false);
        } else {
          setError(result.error || 'Failed to initialize payment');
          setLoading(false);
        }
        */
      } catch (err) {
        setError('Failed to initialize payment');
        setLoading(false);
      } finally {
        // Loading state is handled in the setTimeout or API call
      }
    };

    createPaymentIntent();
  }, [userId, plan, email]);

  if (loading) {
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

  if (!clientSecret) {
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
    ...STRIPE_CONFIG
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm
        plan={plan}
        amount={0} // Not needed for Stripe Elements
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
}