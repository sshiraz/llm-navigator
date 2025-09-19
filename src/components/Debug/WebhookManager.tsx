import React, { useState, useEffect } from 'react';
import { Webhook, RefreshCw, CheckCircle, AlertTriangle, X, Zap, Key, Copy, Code, Terminal } from 'lucide-react';
import { PaymentLogger } from '../../utils/paymentLogger';
import { isLiveMode } from '../../utils/liveMode';
import { isCurrentUserAdmin } from '../../utils/userUtils';
import LiveModeIndicator from '../UI/LiveModeIndicator';

export default function WebhookManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [webhookSecret, setWebhookSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [deployCommands, setDeployCommands] = useState<string[]>([]);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [commandsCopied, setCommandsCopied] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    // Check if user is admin
    setIsAdmin(isCurrentUserAdmin());
    
    if (isOpen) {
      // Generate the webhook URL
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (supabaseUrl) {
        setWebhookUrl(`${supabaseUrl}/functions/v1/stripe-webhook`);
      }
      
      // Generate deploy commands
      generateDeployCommands();
    }
  }, [isOpen]);
  
  const generateDeployCommands = () => {
    const commands = [
      '# 1. Set Stripe secret key',
      'npx supabase secrets set STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key',
      '',
      '# 2. Set Supabase service role key',
      'npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impna2R6YW9hamJ6bXV1YWpwbmR2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTUyMzc1OSwiZXhwIjoyMDY3MDk5NzU5fQ.DOYDCrZJrV895yP6Qev4y8cRN1b0PUNK-JMvlwTFCBo',
      '',
      '# 3. Set webhook secret',
      'npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret',
      '',
      '# 4. Deploy webhook function',
      'npx supabase functions deploy stripe-webhook'
    ];
    
    if (isLiveMode) {
      commands.splice(6, 0, '# For live mode, also set this:',
        'npx supabase secrets set STRIPE_LIVE_WEBHOOK_SECRET=whsec_your_live_webhook_secret');
    }
    
    setDeployCommands(commands);
  };
  
  const updateWebhookSecret = () => {
    if (!webhookSecret || !webhookSecret.startsWith('whsec_')) {
      alert('Please enter a valid webhook secret (starts with whsec_)');
      return;
    }
    
    setIsLoading(true);
    
    // Generate updated commands with the actual webhook secret
    const secretCommand = isLiveMode 
      ? `npx supabase secrets set STRIPE_LIVE_WEBHOOK_SECRET=${webhookSecret}`
      : `npx supabase secrets set STRIPE_WEBHOOK_SECRET=${webhookSecret}`;
    
    const updatedCommands = [...deployCommands];
    const secretIndex = updatedCommands.findIndex(cmd => 
      cmd.includes('STRIPE_WEBHOOK_SECRET') || cmd.includes('STRIPE_LIVE_WEBHOOK_SECRET'));
    
    if (secretIndex !== -1) {
      updatedCommands[secretIndex] = secretCommand;
    }
    
    setDeployCommands(updatedCommands);
    
    // Log the action
    PaymentLogger.log('info', 'WebhookManager', `Generated webhook secret command for ${isLiveMode ? 'LIVE' : 'TEST'} mode`, {
      secretCommand,
      isLiveMode
    });
    
    setTimeout(() => {
      setIsLoading(false);
      setStatus('success');
      
      // Reset status after a few seconds
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    }, 1000);
  };
  
  const copyCommands = () => {
    const commandsText = deployCommands.join('\n');
    navigator.clipboard.writeText(commandsText);
    setCommandsCopied(true);
    
    PaymentLogger.log('info', 'WebhookManager', 'Copied deploy commands to clipboard');
    
    // Reset copied state after a few seconds
    setTimeout(() => {
      setCommandsCopied(false);
    }, 3000);
  };

  // If not admin, don't render the component
  if (!isAdmin) {
    return null;
  }
  
  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    alert('Webhook URL copied to clipboard!');
  };
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-36 right-4 bg-purple-600 text-white rounded-lg px-4 py-2 flex items-center space-x-2 shadow-lg hover:bg-purple-700 transition-colors z-40"
      >
        <Webhook className="w-5 h-5" />
        <span>Webhook Manager</span>
      </button>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-purple-50">
          <div className="flex items-center space-x-3">
            <Webhook className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">
              Webhook Manager
              {isLiveMode && <LiveModeIndicator variant="badge" />}
            </h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {isLiveMode && <LiveModeIndicator variant="warning" className="mb-6" />}
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">About Webhook Deployment</h3>
            <p className="text-sm text-blue-800 mb-2">
              Webhooks need to be deployed using the Supabase CLI from a terminal. This tool generates the commands you need to run.
            </p>
            <p className="text-sm text-blue-800">
              After deployment, Stripe will send payment events to your webhook endpoint, which will update user subscriptions automatically.
            </p>
          </div>
          
          {/* Webhook URL */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Webhook URL</h3>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-100 p-3 rounded-lg font-mono text-sm overflow-x-auto">
                {webhookUrl || 'Loading...'}
              </div>
              <button
                onClick={copyWebhookUrl}
                className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                title="Copy webhook URL"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Use this URL when setting up your webhook in the Stripe Dashboard.
            </p>
          </div>
          
          {/* Webhook Secret */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Webhook Secret</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isLiveMode ? 'Live Mode Webhook Secret' : 'Test Mode Webhook Secret'}
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
                    <Key className="w-5 h-5" />
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Get this from Stripe Dashboard → Developers → Webhooks → [Your webhook] → Signing secret
                </p>
              </div>
              
              <button
                onClick={updateWebhookSecret}
                disabled={isLoading || !webhookSecret}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-5 h-5" />
                    <span>Update Secret</span>
                  </>
                )}
              </button>
              
              {status === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900 mb-1">Secret Updated</h4>
                      <p className="text-sm text-green-800">
                        The webhook secret has been updated in the commands below. Copy and run them in your terminal.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Deploy Commands */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Deployment Commands</h3>
            <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <pre className="whitespace-pre-wrap">
                {deployCommands.join('\n')}
              </pre>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={copyCommands}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                {commandsCopied ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span>Copy Commands</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Stripe Dashboard Link */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
            <h3 className="font-semibold text-purple-900 mb-3 flex items-center space-x-2">
              <Terminal className="w-5 h-5" />
              <span>Quick Setup in Stripe Dashboard</span>
            </h3>
            <p className="text-sm text-purple-800 mb-4">
              After running the commands above, you need to set up the webhook in Stripe:
            </p>
            <ol className="space-y-2 text-sm text-purple-800 list-decimal pl-5">
              <li>Go to Stripe Dashboard → Developers → Webhooks</li>
              <li>Click "Add endpoint"</li>
              <li>Enter your webhook URL (copied from above)</li>
              <li>Select events: <code>payment_intent.succeeded</code>, <code>customer.subscription.created</code>, <code>customer.subscription.updated</code>, <code>customer.subscription.deleted</code>, <code>invoice.payment_failed</code></li>
              <li>Copy the webhook secret and update it here</li>
              <li>Run the deployment commands</li>
            </ol>
            <div className="mt-4">
              <a
                href="https://dashboard.stripe.com/test/webhooks"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <span>Open Stripe Dashboard</span>
                <Zap className="w-4 h-4" />
              </a>
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