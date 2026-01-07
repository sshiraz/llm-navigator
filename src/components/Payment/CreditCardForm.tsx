import React, { useState } from 'react';
import { CreditCard, User, CheckCircle } from 'lucide-react';
import { PaymentLogger } from '../../utils/paymentLogger';
import { Elements } from '@stripe/react-stripe-js';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { STRIPE_CONFIG, stripePromise } from '../../utils/stripeUtils';
import { PaymentService } from '../../services/paymentService';
import { isLiveMode } from '../../utils/liveMode';
import LiveModeIndicator from '../UI/LiveModeIndicator';
import SecurePaymentNotice from '../UI/SecurePaymentNotice';

interface CreditCardFormProps {
  plan: string;
  amount: number;
  onSuccess: (paymentData: any) => void;
  onCancel: () => void;
}

function CreditCardFormContent({ plan, amount, onSuccess, onCancel }: CreditCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardName, setCardName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [cardError, setCardError] = useState('');

  // Log if we're in live mode
  React.useEffect(() => {
    if (isLiveMode) {
      PaymentLogger.log('warn', 'CreditCardForm', '🔴 LIVE MODE - Real payments will be processed', { plan, amount });
    }
  }, [plan, amount]);

  const validateForm = async () => {
    const newErrors: Record<string, string> = {};

    // Validate name
    if (!cardName.trim()) {
      newErrors.cardName = 'Name is required';
    }

    // Check if Stripe is loaded
    if (!stripe || !elements) {
      newErrors.stripe = 'Payment system is not ready. Please try again.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!await validateForm()) {
      return;
    }

    setIsProcessing(true);
    setCardError('');
    PaymentLogger.trackPaymentFlow('Processing credit card payment', { plan, amount });

    try {
      if (!stripe || !elements) {
        throw new Error('Stripe not initialized');
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Create payment method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: cardName,
        },
      });

      if (error) {
        throw error;
      }

      // For demo purposes, simulate a successful payment
      PaymentLogger.trackPaymentFlow('Payment method created', { 
        paymentMethodId: paymentMethod.id,
        last4: paymentMethod.card?.last4,
        brand: paymentMethod.card?.brand
      });
      
      // For live mode, we should create a real payment intent on the server
      if (isLiveMode) {
        try {
          // Create payment intent using PaymentService
          const result = await PaymentService.createPaymentIntent(
            'current-user', // In a real app, get this from auth
            plan,
            cardName // Using name as email for demo
          );

          if (!result.success) {
            throw new Error(result.error || 'Failed to create payment intent');
          }
          
          const { clientSecret } = result.data;
          
          // Confirm the payment with the client secret
          const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
            clientSecret,
            {
              payment_method: {
                card: cardElement,
                billing_details: {
                  name: cardName,
                }
              }
            }
          );
          
          if (confirmError) {
            throw confirmError;
          }
          
          if (paymentIntent.status === 'succeeded') {
            // Show success state
            setIsSuccess(true);
            
            // Wait a moment to show success state before calling onSuccess
            setTimeout(() => {
              onSuccess({
                paymentId: paymentIntent.id,
                paymentMethodId: paymentMethod.id,
                plan,
                amount,
                last4: paymentMethod.card?.last4 || '4242',
                brand: paymentMethod.card?.brand || 'visa'
              });
            }, 1500);
            return;
          }
        } catch (err: any) {
          const errorMessage = err.message || 'Payment failed. Please try again.';
          setCardError(errorMessage);
          PaymentLogger.trackPaymentFlow('Live payment failed', { error: errorMessage });
          setIsProcessing(false);
          return;
        }
      }

      // Show success state
      setIsSuccess(true);

      // Generate a unique payment ID for demo
      const paymentId = `pi_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Wait a moment to show success state before calling onSuccess
      setTimeout(() => {
        onSuccess({
          paymentId,
          paymentMethodId: paymentMethod.id,
          plan,
          amount,
          last4: paymentMethod.card?.last4 || '4242',
          brand: paymentMethod.card?.brand || 'visa'
        });
      }, 1500);
    } catch (err: any) {
      const errorMessage = err.message || 'Payment failed. Please try again.';
      setCardError(errorMessage);
      PaymentLogger.trackPaymentFlow('Payment failed', { error: errorMessage });
      setIsProcessing(false);
    }
  };

  const CARD_ELEMENT_OPTIONS = {
    style: {
      base: {
        color: '#1f2937',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#9ca3af'
        }
      },
      invalid: {
        color: '#ef4444',
        iconColor: '#ef4444'
      }
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl border border-gray-200 p-8 text-center">
        {isLiveMode && <LiveModeIndicator variant="warning" className="mb-6" />}
        
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
        <p className="text-gray-600 mb-6">
          Your payment has been processed successfully. Your subscription has been updated to the {plan} plan.
        </p>
        <p className="text-sm text-gray-500 mb-4">
          You'll receive a confirmation email shortly with your receipt and subscription details.
        </p>
        <div className="flex justify-center">
          <button
            onClick={() => onSuccess({ plan })}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl border border-gray-200 p-8">
      <div className="text-center mb-6">
        {isLiveMode && <LiveModeIndicator variant="warning" className="mb-6" />}
        
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Enter Payment Details
        </h2>
        <p className="text-gray-600">
          {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - ${(amount / 100).toFixed(2)}/month
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Secure payment processing by Stripe
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Card Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name on Card
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="John Doe"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.cardName ? 'border-red-300' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.cardName && (
            <p className="mt-1 text-sm text-red-600">{errors.cardName}</p>
          )}
        </div>

        {/* Card Details */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Card Details
          </label>
          <div className="border border-gray-300 rounded-lg p-4 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </div>
          {cardError && (
            <p className="mt-1 text-sm text-red-600">{cardError}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {isLiveMode 
              ? 'Use a real credit card - LIVE MODE ACTIVE' 
              : 'Use test card: 4242 4242 4242 4242 with any future expiry date and any CVC'
            }
          </p>
        </div>

        {/* Security Notice */}
        <SecurePaymentNotice className="mt-4" />

        {/* Action Buttons */}
        <div className="flex space-x-4 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isProcessing}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              `Pay $${(amount / 100).toFixed(2)}`
            )}
          </button>
        </div>

        {/* Terms */}
        <div className="mt-4 text-xs text-gray-500 text-center space-y-1">
          <p>
            By completing this payment, you agree to our <a href="#terms" onClick={(e) => {e.preventDefault(); window.location.hash = '#terms';}} className="text-blue-600 hover:text-blue-700">Terms of Service</a> and <a href="#privacy" onClick={(e) => {e.preventDefault(); window.location.hash = '#privacy';}} className="text-blue-600 hover:text-blue-700">Privacy Policy</a>.
          </p>
          Your subscription will automatically renew monthly until cancelled.
        </div>
      </form>
    </div>
  );
}

export default function CreditCardForm(props: CreditCardFormProps) {
  return (
    <Elements stripe={stripePromise} options={STRIPE_CONFIG}>
      <CreditCardFormContent {...props} />
    </Elements>
  );
}