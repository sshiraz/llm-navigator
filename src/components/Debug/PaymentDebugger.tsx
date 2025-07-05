import React, { useState, useEffect } from 'react';
import { Bug, Download, Trash2, RefreshCw, AlertTriangle, CheckCircle, Clock, Database, Webhook, CreditCard } from 'lucide-react';
import { PaymentLogger } from '../../utils/paymentLogger';
import { supabase } from '../../lib/supabase';

export default function PaymentDebugger() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const [webhookStatus, setWebhookStatus] = useState<any>(null);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const loadLogs = () => {
    const allLogs = [...PaymentLogger.getLogsFromStorage(), ...PaymentLogger.getLogs()];
    setLogs(allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };

  const filteredLogs = logs.filter(log => filter === 'all' || log.level === filter);

  const testWebhookEndpoint = async () => {
    setIsTestingWebhook(true);
    PaymentLogger.log('info', 'Debug', 'Testing webhook endpoint...');
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ test: 'debug-test' })
      });

      const result = {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      };

      setWebhookStatus(result);
      PaymentLogger.log(response.ok ? 'info' : 'error', 'Debug', 'Webhook test result', result);
    } catch (error) {
      const errorResult = { error: error.message };
      setWebhookStatus(errorResult);
      PaymentLogger.log('error', 'Debug', 'Webhook test failed', errorResult);
    } finally {
      setIsTestingWebhook(false);
      loadLogs();
    }
  };

  const checkDatabaseConnection = async () => {
    PaymentLogger.log('info', 'Debug', 'Testing database connection...');
    
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      
      if (error) {
        PaymentLogger.log('error', 'Debug', 'Database connection failed', error);
      } else {
        PaymentLogger.log('info', 'Debug', 'Database connection successful', data);
      }
    } catch (error) {
      PaymentLogger.log('error', 'Debug', 'Database connection error', error);
    }
    
    loadLogs();
  };

  const checkEdgeFunctions = async () => {
    PaymentLogger.log('info', 'Debug', 'Checking Edge Functions deployment...');
    
    const functions = [
      'create-payment-intent',
      'create-subscription', 
      'stripe-webhook'
    ];
    
    for (const func of functions) {
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${func}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ test: true })
        });
        
        PaymentLogger.log(
          response.status === 404 ? 'error' : 'info', 
          'Debug', 
          `Edge Function ${func}: ${response.status === 404 ? 'NOT DEPLOYED' : 'Available'}`,
          { status: response.status, statusText: response.statusText }
        );
      } catch (error) {
        PaymentLogger.log('error', 'Debug', `Edge Function ${func}: Error`, error);
      }
    }
    
    loadLogs();
  };

  const simulateWebhook = async () => {
    PaymentLogger.log('info', 'Debug', 'Simulating successful payment webhook...');
    
    const mockPaymentIntent = {
      id: 'pi_test_debug',
      amount: 2900,
      currency: 'usd',
      status: 'succeeded',
      metadata: {
        userId: 'test-user-id',
        plan: 'starter',
        email: 'test@example.com'
      }
    };
    
    PaymentLogger.trackWebhook('payment_intent.succeeded', true, mockPaymentIntent);
    loadLogs();
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warn': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getComponentIcon = (component: string) => {
    switch (component) {
      case 'Database': return <Database className="w-4 h-4" />;
      case 'Webhook': return <Webhook className="w-4 h-4" />;
      case 'PaymentFlow': return <CreditCard className="w-4 h-4" />;
      default: return <Bug className="w-4 h-4" />;
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors z-50"
        title="Open Payment Debugger"
      >
        <Bug className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-red-50">
          <div className="flex items-center space-x-3">
            <Bug className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-bold text-gray-900">Payment Debugger</h2>
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
              {logs.length} logs
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="all">All Logs</option>
                <option value="info">Info</option>
                <option value="warn">Warnings</option>
                <option value="error">Errors</option>
              </select>
              
              <button
                onClick={loadLogs}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={PaymentLogger.exportLogs}
                className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                <Download className="w-3 h-3" />
                <span>Export</span>
              </button>
              
              <button
                onClick={() => {
                  PaymentLogger.clearLogs();
                  loadLogs();
                }}
                className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Test Controls */}
          <div className="flex items-center space-x-3">
            <button
              onClick={testWebhookEndpoint}
              disabled={isTestingWebhook}
              className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:bg-gray-400"
            >
              <Webhook className="w-3 h-3" />
              <span>{isTestingWebhook ? 'Testing...' : 'Test Webhook'}</span>
            </button>
            
            <button
              onClick={checkDatabaseConnection}
              className="flex items-center space-x-1 px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
            >
              <Database className="w-3 h-3" />
              <span>Test Database</span>
            </button>
            
            <button
              onClick={checkEdgeFunctions}
              className="flex items-center space-x-1 px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
            >
              <Zap className="w-3 h-3" />
              <span>Check Edge Functions</span>
            </button>
            
            <button
              onClick={simulateWebhook}
              className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              <CheckCircle className="w-3 h-3" />
              <span>Simulate Webhook</span>
            </button>

            {webhookStatus && (
              <div className={`px-3 py-1 rounded text-sm ${
                webhookStatus.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                Webhook: {webhookStatus.ok ? 'OK' : `Error ${webhookStatus.status}`}
              </div>
            )}
          </div>
        </div>

        {/* Logs */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No logs found. Start a payment to see debugging information.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-l-4 ${
                    log.level === 'error' ? 'border-red-500 bg-red-50' :
                    log.level === 'warn' ? 'border-yellow-500 bg-yellow-50' :
                    'border-green-500 bg-green-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getLogIcon(log.level)}
                      {getComponentIcon(log.component)}
                      <span className="font-medium text-gray-900">{log.component}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      log.level === 'error' ? 'bg-red-100 text-red-800' :
                      log.level === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {log.level.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-2">{log.message}</p>
                  
                  {log.data && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                        View Data
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                        {log.data}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Troubleshooting Guide */}
        <div className="p-4 border-t border-gray-200 bg-yellow-50">
          <h3 className="font-medium text-yellow-900 mb-2">🚨 Payment Not Upgrading Plan?</h3>
          <div className="text-sm text-yellow-800 space-y-1">
            <div><strong>1. Check Edge Functions:</strong> Click "Check Edge Functions" to see if they're deployed</div>
            <div><strong>2. Test Webhook:</strong> Click "Test Webhook" to verify the endpoint responds</div>
            <div><strong>3. Check Stripe Dashboard:</strong> Go to Stripe → Developers → Webhooks → Events to see if webhooks are being sent</div>
            <div><strong>4. Manual Fix:</strong> If payment succeeded but plan didn't upgrade, manually update in Supabase dashboard</div>
          </div>
          
          <div className="mt-3 p-3 bg-white border border-yellow-200 rounded">
            <strong className="text-yellow-900">Quick Fix Commands:</strong>
            <div className="font-mono text-xs text-yellow-800 mt-1">
              <div>npx supabase functions deploy stripe-webhook</div>
              <div>npx supabase secrets set STRIPE_SECRET_KEY=sk_test_your_key</div>
              <div>npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret</div>
            </div>
          </div>
        </div>

        {/* Environment Status */}
        <div className="p-4 border-t border-gray-200 bg-blue-50">
          <h3 className="font-medium text-blue-900 mb-2">Environment Status</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Supabase URL:</strong> {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</div>
            <div><strong>Stripe Key:</strong> {import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing'}</div>
          </div>
        </div>

        {/* Quick Diagnostics */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <h3 className="font-medium text-gray-900 mb-2">Quick Diagnostics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Environment:</strong>
              <div className="text-gray-600">
                Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? '✅' : '❌'}
              </div>
              <div className="text-gray-600">
                Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅' : '❌'}
              </div>
              <div className="text-gray-600">
                Stripe Key: {import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? '✅' : '❌'}
              </div>
            </div>
            
            <div>
              <strong>Recent Errors:</strong>
              <div className="text-red-600">
                {logs.filter(l => l.level === 'error').length} errors
              </div>
              <div className="text-yellow-600">
                {logs.filter(l => l.level === 'warn').length} warnings
              </div>
            </div>
            
            <div>
              <strong>Components:</strong>
              {Array.from(new Set(logs.map(l => l.component))).map(component => (
                <div key={component} className="text-gray-600">
                  {component}: {logs.filter(l => l.component === component).length} logs
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}