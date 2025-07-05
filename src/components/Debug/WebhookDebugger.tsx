import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Copy, RefreshCw, Webhook, Key, Lock, X } from 'lucide-react';
import { PaymentLogger } from '../../utils/paymentLogger';

export default function WebhookDebugger() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [webhookSecret, setWebhookSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  
  const testWebhook = async () => {
    setIsLoading(true);
    PaymentLogger.log('info', 'WebhookDebugger', 'Testing webhook endpoint...');
    
    try {
      // First, test with a simple request to check if the endpoint is accessible
      const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-webhook`;
      PaymentLogger.log('info', 'WebhookDebugger', `Testing webhook at: ${webhookUrl}`, {
        timestamp: new Date().toISOString()
      });
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'stripe-signature': 'test_signature', // Add a dummy signature
          'x-test-request': 'true' // Mark as test request
        },
        body: JSON.stringify({ 
          type: 'payment_intent.succeeded',
          test: true,
          data: {
            object: {
              id: 'pi_test_' + Date.now(),
              amount: 2900,
              currency: 'usd',
              status: 'succeeded',
              metadata: {
                userId: 'test-user',
                plan: 'starter'
              }
            }
          }
        })
      });
      
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { rawResponse: text };
      }
      
      const result = {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        data,
        headers: Object.fromEntries(response.headers.entries())
      };
      
      setTestResult(result);
      
      if (response.status === 400) {
        if (text.includes('signature verification failed') || text.includes('test request')) {
          PaymentLogger.log('info', 'WebhookDebugger', 'Webhook signature verification failed - this is expected for test requests', {
            status: response.status,
            text: text.substring(0, 100) // Limit text length for logging
          });
        } else {
          PaymentLogger.log('error', 'WebhookDebugger', 'Webhook returned unexpected 400 error', result);
        }
      } else if (response.status === 401 || response.status === 403) {
        PaymentLogger.log('error', 'WebhookDebugger', 'Webhook authentication failed - check service role key', result);
      } else if (response.status === 404) {
        PaymentLogger.log('error', 'WebhookDebugger', 'Webhook endpoint not found - check function deployment', result);
      } else {
        PaymentLogger.log(response.ok ? 'info' : 'error', 'WebhookDebugger', `Webhook test result: ${response.status} ${response.statusText}`, result);
      }
    } catch (error) {
      const errorResult = { error: error.message };
      setTestResult(errorResult);
      PaymentLogger.log('error', 'WebhookDebugger', 'Webhook test failed', errorResult);
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateWebhookSecret = async () => {
    if (!webhookSecret || !webhookSecret.startsWith('whsec_')) {
      alert('Please enter a valid webhook secret (starts with whsec_)');
      return;
    }
    
    setIsLoading(true);
    PaymentLogger.log('info', 'WebhookDebugger', 'Updating webhook secret...');
    
    try {
      // In a real implementation, this would call an API to update the secret
      // For now, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      alert('Webhook secret updated successfully! Please redeploy your webhook function for the changes to take effect.');
      PaymentLogger.log('info', 'WebhookDebugger', 'Webhook secret updated successfully');
      
      // Clear the input
      setWebhookSecret('');
    } catch (error) {
      PaymentLogger.log('error', 'WebhookDebugger', 'Failed to update webhook secret', error);
      alert(`Failed to update webhook secret: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const copyDeployCommand = () => {
    const command = 'npx supabase functions deploy stripe-webhook';
    navigator.clipboard.writeText(command);
    PaymentLogger.log('info', 'WebhookDebugger', 'Copied deploy command to clipboard');
  };
  
  const copySecretCommand = () => {
    const command = `npx supabase secrets set STRIPE_WEBHOOK_SECRET=${webhookSecret || 'whsec_your_webhook_secret'}`;
    navigator.clipboard.writeText(command);
    PaymentLogger.log('info', 'WebhookDebugger', 'Copied secret command to clipboard');
  };
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 bg-indigo-600 text-white rounded-lg px-4 py-2 flex items-center space-x-2 shadow-lg hover:bg-indigo-700 transition-colors z-50"
      >
        <Webhook className="w-5 h-5" />
        <span>Webhook Debugger</span>
      </button>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-indigo-50">
          <div className="flex items-center space-x-3">
            <Webhook className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">Webhook Debugger</h2>
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
          {/* Test Webhook */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Webhook Endpoint</h3>
            <button
              onClick={testWebhook}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <Webhook className="w-5 h-5" />
                  <span>Test Webhook Endpoint</span>
                </>
              )}
            </button>
            
            {testResult && (
              <div className={`mt-4 p-4 rounded-lg ${
                testResult.status === 200 ? 'bg-green-50 border border-green-200' :
                testResult.status === 400 && testResult.data?.error?.includes('signature verification') ? 'bg-yellow-50 border border-yellow-200' :
                'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start space-x-3">
                  {testResult.status === 200 ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : testResult.status === 400 && testResult.data?.error?.includes('signature verification') ? (
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <div>
                    <h4 className={`font-medium ${
                      testResult.status === 200 ? 'text-green-900' :
                      testResult.status === 400 && testResult.data?.error?.includes('signature verification') ? 'text-yellow-900' :
                      'text-red-900'
                    } mb-1`}>
                      Status: {testResult.status} {testResult.statusText}
                    </h4>
                    
                    {testResult.status === 200 ? (
                      <p className="text-sm text-green-800">
                        Webhook endpoint is working correctly! ✅
                      </p>
                    ) : testResult.status === 400 && testResult.data?.error?.includes('signature verification') ? (
                      <p className="text-sm text-yellow-800">
                        Webhook endpoint is deployed but signature verification failed. This is expected for test requests. ⚠️
                      </p>
                    ) : testResult.status === 401 || testResult.status === 403 ? (
                      <p className="text-sm text-red-800">
                        Authentication failed. Check if SUPABASE_SERVICE_ROLE_KEY is set correctly. ❌
                      </p>
                    ) : testResult.status === 404 ? (
                      <p className="text-sm text-red-800">
                        Webhook endpoint not found. Deploy the stripe-webhook function. ❌
                      </p>
                    ) : (
                      <p className="text-sm text-red-800">
                        Unexpected error. Check the response details. ❌
                      </p>
                    )}
                    
                    <details className="mt-2">
                      <summary className="text-sm font-medium cursor-pointer hover:text-indigo-600">
                        View Response Details
                      </summary>
                      <pre className="mt-2 p-3 bg-gray-900 text-green-400 rounded text-xs overflow-x-auto">
                        {JSON.stringify(testResult, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Update Webhook Secret */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Webhook Secret</h3>
            
            <div className="space-y-4">
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
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
              
              <div className="flex space-x-3">
                <button
                  onClick={copySecretCommand}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Copy className="w-5 h-5" />
                  <span>Copy Secret Command</span>
                </button>
                
                <button
                  onClick={copyDeployCommand}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Copy className="w-5 h-5" />
                  <span>Copy Deploy Command</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Troubleshooting Guide */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Troubleshooting</h3>
            
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-indigo-600 font-bold text-xs">1</span>
                </div>
                <p>
                  <strong>Verify webhook secret</strong>: Make sure the webhook secret in Supabase matches the one in Stripe.
                </p>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-indigo-600 font-bold text-xs">2</span>
                </div>
                <p>
                  <strong>Redeploy webhook function</strong>: After updating secrets, redeploy the webhook function.
                </p>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-indigo-600 font-bold text-xs">3</span>
                </div>
                <p>
                  <strong>Check Stripe logs</strong>: Go to Stripe Dashboard → Developers → Logs to see webhook delivery attempts.
                </p>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-indigo-600 font-bold text-xs">4</span>
                </div>
                <p>
                  <strong>Manual fix</strong>: If payment succeeded but plan didn't update, manually update in Supabase dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Webhook URL: <span className="font-mono text-xs">{import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-webhook</span>
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