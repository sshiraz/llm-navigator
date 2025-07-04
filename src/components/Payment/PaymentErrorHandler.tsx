import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, Bug, Copy, ExternalLink } from 'lucide-react';
import { PaymentDebugger } from '../../utils/paymentDebugger';

interface PaymentErrorHandlerProps {
  error: string;
  onRetry: () => void;
  onCancel: () => void;
  context?: any;
}

export default function PaymentErrorHandler({ error, onRetry, onCancel, context }: PaymentErrorHandlerProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const handleShowDebugInfo = async () => {
    const info = {
      error,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      stripeConfig: PaymentDebugger.checkStripeConfig(),
      logs: PaymentDebugger.getDebugLogs().slice(-5)
    };
    setDebugInfo(info);
    setShowDetails(true);
  };

  const copyDebugInfo = () => {
    if (debugInfo) {
      navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
    }
  };

  const getErrorSuggestion = (error: string) => {
    if (error.includes('network') || error.includes('fetch')) {
      return {
        title: 'Network Connection Issue',
        suggestion: 'Check your internet connection and try again.',
        action: 'Retry Payment'
      };
    }
    
    if (error.includes('stripe') || error.includes('payment')) {
      return {
        title: 'Payment Processing Error',
        suggestion: 'There may be an issue with the payment processor. Please try again or contact support.',
        action: 'Retry Payment'
      };
    }
    
    if (error.includes('edge function') || error.includes('supabase')) {
      return {
        title: 'Server Configuration Issue',
        suggestion: 'The payment system may not be fully configured. Please contact support.',
        action: 'Contact Support'
      };
    }
    
    return {
      title: 'Unexpected Error',
      suggestion: 'An unexpected error occurred. Please try again or contact support if the issue persists.',
      action: 'Retry Payment'
    };
  };

  const errorInfo = getErrorSuggestion(error);

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl border border-gray-200 p-6">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {errorInfo.title}
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          {errorInfo.suggestion}
        </p>
        
        {/* Error Message */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-800 text-sm font-mono">{error}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={onRetry}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>{errorInfo.action}</span>
        </button>
        
        <button
          onClick={onCancel}
          className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        
        <button
          onClick={handleShowDebugInfo}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
        >
          <Bug className="w-4 h-4" />
          <span>Show Debug Information</span>
        </button>
      </div>

      {/* Debug Information Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900">Debug Information</h4>
              <div className="flex space-x-2">
                <button
                  onClick={copyDebugInfo}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                  title="Copy to Clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-x-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600 mb-2">
                Share this information with support for faster troubleshooting.
              </p>
              <a
                href="mailto:support@llmnavigator.com?subject=Payment Error&body=Please see attached debug information"
                className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Contact Support</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}