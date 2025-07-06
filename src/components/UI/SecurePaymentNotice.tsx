import React from 'react';
import { Shield, Lock } from 'lucide-react';
import { isLiveMode } from '../../utils/liveMode';

interface SecurePaymentNoticeProps {
  className?: string;
}

export default function SecurePaymentNotice({ className = '' }: SecurePaymentNoticeProps) {
  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-medium text-green-900 mb-1">
            Secure Payment
          </h4>
          <p className="text-sm text-green-800 mb-1">
            Your payment information is processed securely by Stripe. We never store your card details.
          </p>
          {isLiveMode && (
            <p className="text-sm text-green-800 font-medium">
              Your payment is processed securely through Stripe's PCI-compliant payment system.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}