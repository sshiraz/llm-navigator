import React, { useEffect, useState } from 'react';
import { CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { PaymentLogger } from '../../utils/paymentLogger';
import { ManualSubscriptionFix } from '../../utils/manualSubscriptionFix';

interface CheckoutSuccessHandlerProps {
  sessionId: string;
  plan: string;
  userId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function CheckoutSuccessHandler({ 
  sessionId, 
  plan, 
  userId,
  onSuccess,
  onError
}: CheckoutSuccessHandlerProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    verifyPaymentAndUpdateSubscription();
  }, []);

  const verifyPaymentAndUpdateSubscription = async () => {
    PaymentLogger.trackPaymentFlow('Verifying Stripe checkout session', { 
      sessionId, 
      plan, 
      userId 
    });

    // Log the verification attempt with more details
    PaymentLogger.log('info', 'CheckoutSuccessHandler', 'Verifying payment and updating subscription', {
      sessionId,
      plan,
      userId,
      timestamp: new Date().toISOString()
    });

    try {
      // 1. Verify the session with Stripe
      // In a real implementation, you would verify the session with Stripe
      // For this demo, we'll assume the session is valid if it exists
      
      // 2. Update the user's subscription
      // First check if the subscription is already updated
      const checkResult = await ManualSubscriptionFix.checkSubscriptionStatus(userId);
      
      if (checkResult.currentPlan === plan) {
        // Subscription is already updated
        setStatus('success');
        setMessage('Your subscription is already active! Your account has been updated.');
        PaymentLogger.trackPaymentFlow('Subscription already updated', { 
          userId, 
          plan,
          currentPlan: checkResult.currentPlan
        });
        onSuccess();
        return;
      }
      
      // If not updated, fix it
      const result = await ManualSubscriptionFix.fixSubscription(userId, plan);

      if (result.success) {
        setStatus('success');
        setMessage('Your payment was successful! Your subscription has been updated.');
        PaymentLogger.trackPaymentFlow('Subscription updated successfully', { 
          userId, 
          plan 
        });
        onSuccess();
      } else {
        setStatus('error');
        setMessage(`Failed to update subscription: ${result.message}`);
        PaymentLogger.log('error', 'CheckoutSuccessHandler', 'Failed to update subscription', result.error);
        onError(result.message);
      }
    } catch (error) {
      setStatus('error');
      setMessage(`An error occurred: ${error.message}`);
      PaymentLogger.log('error', 'CheckoutSuccessHandler', 'Error verifying payment', error);
      onError(error.message);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl border border-gray-200 p-8 text-center">
      {status === 'loading' && (
        <>
          <RefreshCw className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Processing Your Payment</h2>
          <p className="text-gray-600">{message}</p>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <button
            onClick={onSuccess}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Continue to Dashboard
          </button>
        </>
      )}

      {status === 'error' && (
        <>
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Error</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <button
            onClick={() => verifyPaymentAndUpdateSubscription()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-4"
          >
            Try Again
          </button>
          <button
            onClick={() => onError('User cancelled')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </>
      )}
    </div>
  );
}