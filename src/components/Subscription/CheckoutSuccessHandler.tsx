import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

interface CheckoutSuccessHandlerProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CheckoutSuccessHandler({ onSuccess, onCancel }: CheckoutSuccessHandlerProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'cancel'>('loading');

  useEffect(() => {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const checkoutStatus = urlParams.get('checkout');
    
    if (checkoutStatus === 'success') {
      setStatus('success');
      setTimeout(() => {
        onSuccess();
      }, 2000); // Show success message for 2 seconds before redirecting
    } else if (checkoutStatus === 'cancel') {
      setStatus('cancel');
    } else {
      // Default to loading if no status is found
      setStatus('loading');
    }
  }, [onSuccess]);

  if (status === 'loading') {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing...</h2>
        <p className="text-gray-600">Please wait while we process your payment.</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
        <p className="text-gray-600 mb-6">
          Thank you for your purchase. Your subscription has been activated and you now have access to all premium features.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm">
            Redirecting you to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (status === 'cancel') {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-10 h-10 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h2>
        <p className="text-gray-600 mb-6">
          Your payment was cancelled. No charges have been made to your account.
        </p>
        <button
          onClick={onCancel}
          className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Pricing</span>
        </button>
      </div>
    );
  }

  return null;
}