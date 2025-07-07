import React, { useState } from 'react';
import { Webhook, RefreshCw, CheckCircle, AlertTriangle, X, Zap, Key, Copy, UserCheck } from 'lucide-react';
import { PaymentLogger } from '../../utils/paymentLogger';
import { isAdminUser } from '../../utils/authUtils';

export default function WebhookHelper() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'checking' | 'fixing' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);
  const [userId, setUserId] = useState('');
  const [plan, setPlan] = useState('starter');
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check if user is admin when component mounts
  useState(() => {
    setIsAdmin(isAdminUser());
  });
  
  const checkWebhookStatus = async () => {
    setStatus('checking');
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-helper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ action: 'check_webhook' })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
        setStatus('success');
        PaymentLogger.log('info', 'WebhookHelper', 'Webhook status checked successfully', data);
      } else {
        setResult(data);
        setStatus('error');
        PaymentLogger.log('error', 'WebhookHelper', 'Failed to check webhook status', data);
      }
    } catch (error) {
      setStatus('error');
      setResult({ error: error.message });
      PaymentLogger.log('error', 'WebhookHelper', 'Error checking webhook status', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fixSubscription = async () => {
    if (!userId) {
      alert('Please enter a user ID');
      return;
    }
    
    setStatus('fixing');
    setIsLoading(true);
    setResult(null);
    
    try {
      // Get current user from localStorage
      const currentUserStr = localStorage.getItem('currentUser');
      let currentUserId = userId;
      
      if (currentUserStr && !userId) {
        try {
          const currentUser = JSON.parse(currentUserStr);
          currentUserId = currentUser.id;
          setUserId(currentUserId);
        } catch (e) {
          console.error('Failed to parse stored user', e);
        }
      }
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-helper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ 
          action: 'fix_subscription',
          userId: currentUserId,
          plan
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
        setStatus('success');
        PaymentLogger.log('info', 'WebhookHelper', 'Subscription fixed successfully', data);
        
        // Update user in localStorage
        if (currentUserStr) {
          try {
            const currentUser = JSON.parse(currentUserStr);
            if (currentUser.id === currentUserId) {
              const updatedUser = {
                ...currentUser,
                subscription: plan,
                paymentMethodAdded: true
              };
              localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            }
          } catch (e) {
            console.error('Failed to update stored user', e);
          }
        }
      } else {
        setResult(data);
        setStatus('error');
        PaymentLogger.log('error', 'WebhookHelper', 'Failed to fix subscription', data);
      }
    } catch (error) {
      setStatus('error');
      setResult({ error: error.message });
      PaymentLogger.log('error', 'WebhookHelper', 'Error fixing subscription', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const deployCommands = [
    {
      name: 'Deploy webhook-helper function',
      command: 'npx supabase functions deploy webhook-helper'
    },
    {
      name: 'Set Stripe secret key',
      command: 'npx supabase secrets set STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key'
    },
    {
      name: 'Set webhook secret',
      command: 'npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret'
    },
    {
      name: 'Deploy stripe-webhook function',
      command: 'npx supabase functions deploy stripe-webhook'
    }
  ];
  
  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
    PaymentLogger.log('info', 'WebhookHelper', 'Copied command to clipboard', { command });
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
          setResult(null);
          
          // Try to get current user ID from localStorage
          try {
            const currentUserStr = localStorage.getItem('currentUser');
            if (currentUserStr) {
              const currentUser = JSON.parse(currentUserStr);
              setUserId(currentUser.id);
            }
          } catch (e) {
            console.error('Failed to get current user', e);
          }
        }}
        className="fixed bottom-36 right-4 bg-purple-600 text-white rounded-lg px-4 py-2 flex items-center space-x-2 shadow-lg hover:bg-purple-700 transition-colors z-40"
      >
        <Webhook className="w-5 h-5" />
        <span>Webhook Helper</span>
      </button>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-purple-50">
          <div className="flex items-center space-x-3">
            <Webhook className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">Webhook Helper</h2>
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
          
          {status === 'fixing' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                <div>
                  <h3 className="font-medium text-blue-900">Fixing Subscription</h3>
                  <p className="text-sm text-blue-800">
                    Updating user subscription to {plan}...
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {status === 'success' && result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-900">Operation Successful</h3>
                  <p className="text-sm text-green-800">
                    {result.message || 'The operation completed successfully.'}
                  </p>
                  
                  {result.environment && (
                    <div className="mt-2 space-y-1 text-sm">
                      <p className="font-medium text-green-900">Environment Status:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>Supabase URL:</div>
                        <div>{result.environment.supabaseUrl}</div>
                        <div>Service Key:</div>
                        <div>{result.environment.supabaseServiceKey}</div>
                        <div>Stripe Secret:</div>
                        <div>{result.environment.stripeSecretKey}</div>
                        <div>Webhook Secret:</div>
                        <div>{result.environment.webhookSecret}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {status === 'error' && result && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-900">Error</h3>
                  <p className="text-sm text-red-800">
                    {result.error || 'An unexpected error occurred.'}
                  </p>
                  {result.message && (
                    <p className="text-sm text-red-800 mt-1">{result.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Check Webhook Status */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Check Webhook Status</h3>
            <button
              onClick={checkWebhookStatus}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
            >
              {isLoading && status === 'checking' ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <Webhook className="w-5 h-5" />
                  <span>Check Webhook Status</span>
                </>
              )}
            </button>
          </div>
          
          {/* Fix Subscription */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Fix Subscription</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User ID
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="User ID"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty to use current user ID
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan
                </label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="starter">Starter ($29/month)</option>
                  <option value="professional">Professional ($99/month)</option>
                  <option value="enterprise">Enterprise ($299/month)</option>
                </select>
              </div>
              
              <button
                onClick={fixSubscription}
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
              >
                {isLoading && status === 'fixing' ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Fixing...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-5 h-5" />
                    <span>Fix Subscription</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Deployment Instructions */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Deployment Commands</h3>
            
            <div className="space-y-3">
              {deployCommands.map((cmd, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{cmd.name}</h4>
                  </div>
                  
                  <div className="flex items-center space-x-2 bg-gray-900 text-green-400 rounded p-3 font-mono text-sm">
                    <div className="flex-1 overflow-x-auto">{cmd.command}</div>
                    <button
                      onClick={() => copyCommand(cmd.command)}
                      className="p-1 hover:bg-gray-700 rounded transition-colors"
                      title="Copy command"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Run these commands in your terminal to deploy the webhook
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