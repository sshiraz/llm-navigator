import React, { useState } from 'react';
import { Key, Lock, Copy, RefreshCw, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { PaymentLogger } from '../../utils/paymentLogger';

export default function WebhookSecretUpdater() {
  const [isOpen, setIsOpen] = useState(false);
  const [webhookSecret, setWebhookSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const updateSecret = async () => {
    if (!webhookSecret || !webhookSecret.startsWith('whsec_')) {
      alert('Please enter a valid webhook secret (starts with whsec_)');
      return;
    }
    
    setIsLoading(true);
    setResult(null);
    
    try {
      // Generate the command to update the secret
      const command = `npx supabase secrets set STRIPE_WEBHOOK_SECRET=${webhookSecret}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(command);
      
      // Show success message
      setResult({
        success: true,
        message: 'Command copied to clipboard! Paste and run it in your terminal.',
        command
      });
      
      PaymentLogger.log('info', 'WebhookSecretUpdater', 'Webhook secret command generated', { command });
    } catch (error) {
      setResult({
        success: false,
        message: `Failed to copy command: ${error.message}`,
        error
      });
      
      PaymentLogger.log('error', 'WebhookSecretUpdater', 'Failed to generate webhook secret command', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const generateDeployCommand = () => {
    const command = 'npx supabase functions deploy stripe-webhook';
    navigator.clipboard.writeText(command);
    
    setResult({
      success: true,
      message: 'Deploy command copied to clipboard! Run this after updating the secret.',
      command
    });
    
    PaymentLogger.log('info', 'WebhookSecretUpdater', 'Deploy command generated', { command });
  };
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-56 bg-purple-600 text-white rounded-lg px-4 py-2 flex items-center space-x-2 shadow-lg hover:bg-purple-700 transition-colors z-40"
      >
        <Key className="w-5 h-5" />
        <span>Update Webhook Secret</span>
      </button>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-purple-50">
          <div className="flex items-center space-x-3">
            <Key className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">Update Webhook Secret</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-900 mb-1">Important</h3>
                <p className="text-sm text-yellow-800">
                  After updating the webhook secret, you must redeploy the webhook function for the changes to take effect.
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stripe Webhook Secret
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder="whsec_your_webhook_secret"
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showSecret ? <Lock className="w-5 h-5" /> : <Key className="w-5 h-5" />}
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Get this from Stripe Dashboard → Developers → Webhooks → [Your webhook] → Signing secret
            </p>
          </div>
          
          {/* Result */}
          {result && (
            <div className={`p-4 rounded-lg border ${
              result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start space-x-3">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div>
                  <h4 className={`font-medium ${result.success ? 'text-green-900' : 'text-red-900'} mb-1`}>
                    {result.success ? 'Success!' : 'Error'}
                  </h4>
                  <p className={`text-sm ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.message}
                  </p>
                  
                  {result.command && (
                    <div className="mt-3 p-3 bg-gray-900 text-green-400 rounded text-sm font-mono overflow-x-auto">
                      {result.command}
                    </div>
                  )}
                  
                  {result.error && (
                    <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-x-auto">
                      {JSON.stringify(result.error, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex space-x-3">
            <button
              onClick={updateSecret}
              disabled={isLoading || !webhookSecret}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>Copy Secret Command</span>
                </>
              )}
            </button>
            
            <button
              onClick={generateDeployCommand}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Copy className="w-5 h-5" />
              <span>Copy Deploy Command</span>
            </button>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Run these commands in your terminal
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}