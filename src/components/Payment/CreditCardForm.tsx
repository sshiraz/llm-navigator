import React, { useState } from 'react';
import { CreditCard, Calendar, Lock, User, CheckCircle } from 'lucide-react';
import { PaymentLogger } from '../../utils/paymentLogger';

interface CreditCardFormProps {
  plan: string;
  amount: number;
  onSuccess: (paymentData: any) => void;
  onCancel: () => void;
}

export default function CreditCardForm({ plan, amount, onSuccess, onCancel }: CreditCardFormProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Add space after every 4 digits
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    // Limit to 19 characters (16 digits + 3 spaces)
    return formatted.substring(0, 19);
  };

  const formatExpiry = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Format as MM/YY
    if (digits.length > 2) {
      return `${digits.substring(0, 2)}/${digits.substring(2, 4)}`;
    }
    return digits;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate card number (should be 16 digits)
    const cardDigits = cardNumber.replace(/\D/g, '');
    if (!cardDigits) {
      newErrors.cardNumber = 'Card number is required';
    } else if (cardDigits.length !== 16) {
      newErrors.cardNumber = 'Card number must be 16 digits';
    }

    // Validate name
    if (!cardName.trim()) {
      newErrors.cardName = 'Name is required';
    }

    // Validate expiry (should be MM/YY format)
    const expiryDigits = expiry.replace(/\D/g, '');
    if (!expiryDigits) {
      newErrors.expiry = 'Expiry date is required';
    } else if (expiryDigits.length !== 4) {
      newErrors.expiry = 'Expiry date must be in MM/YY format';
    } else {
      const month = parseInt(expiryDigits.substring(0, 2), 10);
      if (month < 1 || month > 12) {
        newErrors.expiry = 'Invalid month';
      }
    }

    // Validate CVC (should be 3 or 4 digits)
    if (!cvc) {
      newErrors.cvc = 'CVC is required';
    } else if (cvc.length < 3 || cvc.length > 4) {
      newErrors.cvc = 'CVC must be 3 or 4 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);
    PaymentLogger.trackPaymentFlow('Processing credit card payment', { plan });

    // Simulate payment processing
    setTimeout(() => {
      // For demo purposes, check if using test card number
      const isTestCard = cardNumber.replace(/\D/g, '') === '4242424242424242';
      
      if (isTestCard) {
        setIsSuccess(true);
        
        // Generate a unique payment ID
        const paymentId = `pi_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        // Log successful payment
        PaymentLogger.trackPaymentFlow('Payment successful', { 
          paymentId,
          plan,
          amount,
          last4: '4242'
        });
        
        // Wait a moment to show success state before calling onSuccess
        setTimeout(() => {
          onSuccess({
            paymentId,
            plan,
            amount,
            last4: '4242'
          });
        }, 1500);
      } else {
        setErrors({
          cardNumber: 'Payment failed. Please use test card 4242 4242 4242 4242'
        });
        setIsProcessing(false);
        
        PaymentLogger.trackPaymentFlow('Payment failed', { 
          error: 'Invalid test card',
          cardNumberLength: cardNumber.length
        });
      }
    }, 2000);
  };

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
        <p className="text-gray-600 mb-6">
          Your payment has been processed successfully. Your subscription has been updated to the {plan} plan.
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
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Enter Payment Details
        </h2>
        <p className="text-gray-600">
          {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - ${(amount / 100).toFixed(2)}/month
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Card Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Card Number
          </label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="4242 4242 4242 4242"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.cardNumber ? 'border-red-300' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.cardNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Use test card: 4242 4242 4242 4242
          </p>
        </div>

        {/* Card Name */}
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

        {/* Expiry and CVC */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.expiry ? 'border-red-300' : 'border-gray-300'
                }`}
                maxLength={5}
              />
            </div>
            {errors.expiry && (
              <p className="mt-1 text-sm text-red-600">{errors.expiry}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CVC
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
                placeholder="123"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.cvc ? 'border-red-300' : 'border-gray-300'
                }`}
                maxLength={4}
              />
            </div>
            {errors.cvc && (
              <p className="mt-1 text-sm text-red-600">{errors.cvc}</p>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
          <div className="flex items-start space-x-3">
            <Lock className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-green-900 mb-1">
                Secure Test Environment
              </h4>
              <p className="text-sm text-green-800">
                This is a test environment. Use card number 4242 4242 4242 4242 with any future expiry date and any 3-digit CVC.
              </p>
            </div>
          </div>
        </div>

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
        <div className="mt-4 text-xs text-gray-500 text-center">
          By completing this payment, you agree to our Terms of Service and Privacy Policy. 
          Your subscription will automatically renew monthly until cancelled.
        </div>
      </form>
    </div>
  );
}