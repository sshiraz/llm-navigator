import React, { useState, useEffect } from 'react';
import { Webhook, RefreshCw, CheckCircle, AlertTriangle, X, Zap, Key, Copy, Code } from 'lucide-react';
import { PaymentLogger } from '../../utils/paymentLogger';
import { getSupabaseProjectId } from '../../utils/webhookUtils';
import { isCurrentUserAdmin } from '../../utils/userUtils';

export default function WebhookDeployer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [webhookContent, setWebhookContent] = useState('');
  const [deployUrl, setDeployUrl] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    // Check if user is admin
    setIsAdmin(isCurrentUserAdmin());
    
    if (isOpen) {
      // Get project ID
      const id = getSupabaseProjectId();
      setProjectId(id);
      
      // Generate deploy URL
      if (id) {
        setDeployUrl(`https://supabase.com/dashboard/project/${id}/functions`);
      }
      
      // Load webhook content
      fetch('/supabase/functions/stripe-webhook/index.ts')
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to load webhook content: ${response.status}`);
          }
          return response.text();
        })
        .then(content => {
          setWebhookContent(content);
        })
        .catch(error => {
          console.error('Error loading webhook content:', error);
          setWebhookContent(`// Error loading webhook content: ${error.message}\n\n// Please copy the webhook code from the project files`);
        });
    }
  }, [isOpen]);
  
  const copyWebhookContent = () => {
    navigator.clipboard.writeText(webhookContent);
    PaymentLogger.log('info', 'WebhookDeployer', 'Copied webhook content to clipboard');
    alert('Webhook content copied to clipboard!');
  };
  
  const openDeployPage = () => {
    if (deployUrl) {
      window.open(deployUrl, '_blank');
      PaymentLogger.log('info', 'WebhookDeployer', 'Opened Supabase deploy page', { deployUrl });
    }
  };
  
  // If not admin, don't render the component
  if (!isAdmin) {
    return null;
  }
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-52 right-4 bg-green-600 text-white rounded-lg px-4 py-2 flex items-center space-x-2 shadow-lg hover:bg-green-700 transition-colors z-40"
      >
        <Code className="w-5 h-5" />
        <span>Deploy Webhook</span>
      </button>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-green-50">
          <div className="flex items-center space-x-3">
            <Code className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">Webhook Deployer</h2>
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Manual Deployment Instructions</h3>
            <p className="text-sm text-blue-800 mb-2">
              Since we can't deploy Edge Functions directly from the browser, follow these steps:
            </p>
            <ol className="list-decimal pl-5 text-sm text-blue-800 space-y-2">
              <li>Copy the webhook code below</li>
              <li>Go to the Supabase Dashboard Functions page</li>
              <li>Create or edit the stripe-webhook function</li>
              <li>Paste the code and deploy</li>
            </ol>
          </div>
          
          {/* Project Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Project Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Project ID</div>
                <div className="font-medium text-gray-900">{projectId || 'Unknown'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Webhook Function</div>
                <div className="font-medium text-gray-900">stripe-webhook</div>
              </div>
            </div>
          </div>
          
          {/* Webhook Code */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Webhook Code</h3>
              <button
                onClick={copyWebhookContent}
                className="flex items-center space-x-2 px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Code</span>
              </button>
            </div>
            <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm overflow-x-auto max-h-96 overflow-y-auto">
              <pre>{webhookContent || 'Loading webhook code...'}</pre>
            </div>
          </div>
          
          {/* Deploy Button */}
          <div className="flex justify-center">
            <button
              onClick={openDeployPage}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Zap className="w-5 h-5" />
              <span>Open Supabase Dashboard</span>
            </button>
          </div>
          
          {/* Deployment Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-900 mb-2">After Deployment</h3>
            <p className="text-sm text-yellow-800 mb-2">
              After deploying the webhook, make sure to set these secrets:
            </p>
            <div className="space-y-2">
              <div className="bg-gray-900 text-green-400 rounded p-2 font-mono text-xs">
                npx supabase secrets set STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
              </div>
              <div className="bg-gray-900 text-green-400 rounded p-2 font-mono text-xs">
                npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
              </div>
              <div className="bg-gray-900 text-green-400 rounded p-2 font-mono text-xs">
                npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Follow these steps to deploy your webhook
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