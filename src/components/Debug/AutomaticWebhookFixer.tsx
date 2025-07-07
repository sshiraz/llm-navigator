import React, { useState, useEffect } from 'react';
import { Webhook, RefreshCw, CheckCircle, AlertTriangle, X, Zap, Key, Copy } from 'lucide-react';
import { PaymentLogger } from '../../utils/paymentLogger';
import { isAdminUser } from '../../utils/authUtils';
import { supabase } from '../../lib/supabase';

export default function AutomaticWebhookFixer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'checking' | 'fixing' | 'success' | 'error'>('idle');
  const [issues, setIssues] = useState<string[]>([]);
  const [fixSteps, setFixSteps] = useState<Array<{
    id: string;
    name: string;
    command: string;
    status: 'pending' | 'running' | 'success' | 'error';
    result?: any;
  }>>([]);
  
  // Check if user is admin
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    setIsAdmin(isAdminUser());
  }, []);
  
  useEffect(() => {
    if (isOpen && status === 'idle') {
      checkWebhookStatus();
    }
  }, [isOpen]);
  
  const checkWebhookStatus = async () => {
    setStatus('checking');
    setIsLoading(true);
    setIssues([]);
    
    PaymentLogger.log('info', 'WebhookFixer', 'Checking webhook status...');
    
    try {
      // 1. Check if webhook endpoint is accessible
      const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-webhook`;
      PaymentLogger.log('info', 'WebhookFixer', `Testing webhook at: ${webhookUrl}`, {
        timestamp: new Date().toISOString()
      });
      
      const webhookResponse = await fetch(webhookUrl, {
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
      
      // 2. Check if Edge Functions are deployed
      const edgeFunctions = ['create-payment-intent', 'create-subscription', 'stripe-webhook'];
      const edgeFunctionResults = await Promise.all(
        edgeFunctions.map(async (func) => {
          try {
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${func}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
              },
              body: JSON.stringify({ test: true })
            });
            
            return {
              name: func,
              status: response.status,
              deployed: response.status !== 404
            };
          } catch (error) {
            return {
              name: func,
              status: 0,
              deployed: false,
              error
            };
          }
        })
      );
      
      // 3. Analyze results and identify issues
      const newIssues: string[] = [];
      
      // Check webhook response
      if (webhookResponse.status === 404) {
        newIssues.push('Webhook function is not deployed - deploy it with "supabase functions deploy stripe-webhook"');
      } else if (webhookResponse.status === 401 || webhookResponse.status === 403) {
        newIssues.push('Webhook authentication failed - SUPABASE_SERVICE_ROLE_KEY may be incorrect or missing');
      } else if (webhookResponse.status === 400) {
        // 400 is expected for signature verification failure
        const responseText = await webhookResponse.text();
        if (responseText.includes('signature verification failed') || responseText.includes('test request')) {
          // This is actually good - it means the webhook is deployed and checking signatures
          PaymentLogger.log('info', 'WebhookFixer', 'Webhook signature verification is working', {
            status: webhookResponse.status,
            text: responseText.substring(0, 100) // Limit text length for logging
          });
        } else {
          newIssues.push(`Webhook returned unexpected 400 error: ${responseText.substring(0, 100)}`);
        }
      } else if (webhookResponse.status !== 200) {
        let responseText = '';
        try {
          responseText = await webhookResponse.text();
        } catch (e) {
          // Ignore error if we can't get the response text
        }
        newIssues.push(`Webhook returned unexpected status: ${webhookResponse.status} - ${responseText.substring(0, 100)}`);
      }
      
      // Check Edge Functions deployment
      const missingFunctions = edgeFunctionResults
        .filter(func => !func.deployed)
        .map(func => func.name);
      
      if (missingFunctions.length > 0) {
        newIssues.push(`Missing Edge Functions: ${missingFunctions.join(', ')}`);
      }
      
      // Generate fix steps based on issues
      const steps = [];
      
      if (missingFunctions.includes('stripe-webhook')) {
        steps.push({
          id: 'deploy-webhook',
          name: 'Deploy Webhook Function',
          command: 'npx supabase functions deploy stripe-webhook',
          status: 'pending'
        });
      }
      
      if (webhookResponse.status === 401 || webhookResponse.status === 403) {
        steps.push({
          id: 'set-service-key',
          name: 'Set Service Role Key',
          command: `npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impna2R6YW9hamJ6bXV1YWpwbmR2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTUyMzc1OSwiZXhwIjoyMDY3MDk5NzU5fQ.DOYDCrZJrV895yP6Qev4y8cRN1b0PUNK-JMvlwTFCBo`,
          status: 'pending'
        });
      }
      
      // Always suggest setting webhook secret as it's a common issue
      steps.push({
        id: 'set-webhook-secret',
        name: 'Set Webhook Secret',
        command: 'npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret',
        status: 'pending'
      });
      
      // Always suggest setting Stripe secret key
      steps.push({
        id: 'set-stripe-key',
        name: 'Set Stripe Secret Key',
        command: 'npx supabase secrets set STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key',
        status: 'pending'
      });
      
      // Always suggest redeploying webhook after setting secrets
      steps.push({
        id: 'redeploy-webhook',
        name: 'Redeploy Webhook Function',
        command: 'npx supabase functions deploy stripe-webhook',
        status: 'pending'
      });
      
      setIssues(newIssues);
      setFixSteps(steps);
      
      if (newIssues.length === 0) {
        setStatus('success');
        PaymentLogger.log('info', 'WebhookFixer', 'No webhook issues found');
      } else {
        setStatus('error');
        PaymentLogger.log('warn', 'WebhookFixer', 'Webhook issues found', { issues: newIssues });
      }
    } catch (error) {
      setStatus('error');
      setIssues(['Failed to check webhook status: ' + error.message]);
      PaymentLogger.log('error', 'WebhookFixer', 'Failed to check webhook status', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
    PaymentLogger.log('info', 'WebhookFixer', 'Copied command to clipboard', { command });
  };
  
  const runAllCommands = () => {
    // In a browser environment, we can't actually run these commands
    // So we'll just copy them to the clipboard as a single script
    const commands = fixSteps.map(step => step.command).join('\n');
    navigator.clipboard.writeText(commands);
    
    PaymentLogger.log('info', 'WebhookFixer', 'Copied all commands to clipboard', { commands });
    
    alert('All commands copied to clipboard! Paste and run them in your terminal.');
  };
  
  // If not admin, don't render the component
  if (!isAdmin) {
    return null;
  }
  
  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          // Reset state when opening
          setStatus('idle');
          setIssues([]);
          setFixSteps([]);
        }}
        className="fixed bottom-20 right-4 bg-blue-600 text-white rounded-lg px-4 py-2 flex items-center space-x-2 shadow-lg hover:bg-blue-700 transition-colors z-40"
      >
        <Webhook className="w-5 h-5" />
        <span>Fix Webhook</span>
      </button>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center space-x-3">
            <Webhook className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Automatic Webhook Fixer</h2>
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
          {/* Status */}
          {status === 'checking' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                <div>
                  <h3 className="font-medium text-blue-900">Checking Webhook Status</h3>
                  <p className="text-sm text-blue-800">
                    Testing webhook endpoint and checking for common issues...
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-900">Webhook Looks Good!</h3>
                  <p className="text-sm text-green-800">
                    No issues detected with your webhook configuration. If you're still having problems,
                    try the manual fix steps below.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {status === 'error' && issues.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-900">Webhook Issues Detected</h3>
                  <ul className="mt-2 space-y-1 text-sm text-yellow-800">
                    {issues.map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* Fix Steps */}
          {fixSteps.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Fix Steps</h3>
              
              <div className="space-y-3">
                {fixSteps.map((step) => (
                  <div key={step.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {step.status === 'running' && <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />}
                        {step.status === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {step.status === 'error' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                        {step.status === 'pending' && <div className="w-4 h-4" />}
                        <h4 className="font-medium text-gray-900">{step.name}</h4>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 bg-gray-900 text-green-400 rounded p-3 font-mono text-sm">
                      <div className="flex-1 overflow-x-auto">{step.command}</div>
                      <button
                        onClick={() => copyCommand(step.command)}
                        className="p-1 hover:bg-gray-700 rounded transition-colors"
                        title="Copy command"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {step.result && (
                      <div className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                        <pre>{JSON.stringify(step.result, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={runAllCommands}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Copy className="w-5 h-5" />
                  <span>Copy All Commands</span>
                </button>
                
                <button
                  onClick={checkWebhookStatus}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 transition-colors"
                >
                  <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Recheck Status</span>
                </button>
              </div>
            </div>
          )}
          
          {/* Manual Fix Instructions */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Manual Fix Options</h3>
            
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
                  <Key className="w-4 h-4 text-gray-600" />
                  <span>Update Webhook Secret</span>
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Get your webhook secret from Stripe Dashboard → Developers → Webhooks → [Your webhook] → Signing secret
                </p>
                <div className="bg-gray-900 text-green-400 rounded p-3 font-mono text-sm">
                  npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
                </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-gray-600" />
                  <span>Redeploy Webhook Function</span>
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  After updating secrets, redeploy the webhook function for changes to take effect
                </p>
                <div className="bg-gray-900 text-green-400 rounded p-3 font-mono text-sm">
                  npx supabase functions deploy stripe-webhook
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Run these commands in your terminal to fix webhook issues
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