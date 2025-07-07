import React, { useState, useEffect } from 'react';
import { Bug, Download, Trash2, RefreshCw, AlertTriangle, CheckCircle, Clock, Database, Webhook, CreditCard, Zap, X } from 'lucide-react';
import { PaymentLogger } from '../../utils/paymentLogger';
import { checkDatabaseConnection, checkEdgeFunctions, testWebhookEndpoint, simulateWebhook, getSupabaseProjectId } from '../../utils/webhookUtils';
import StripeStatus from '../Payment/StripeStatus';
import { isLiveMode } from '../../utils/liveMode';
import { isAdminUser } from '../../utils/authUtils';

export default function PaymentDebugger() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const [webhookStatus, setWebhookStatus] = useState<any>(null);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Disable certain features in live mode
  const disableInLiveMode = isLiveMode;

  useEffect(() => {
    // Check if user is admin
    setIsAdmin(isAdminUser());
    
    // Get project ID when component mounts
    setProjectId(getSupabaseProjectId());
    
    loadLogs();
    // Auto-check webhook status when debugger opens
    if (isOpen) {
      setTimeout(() => {
        testWebhookEndpoint();
        checkEdgeFunctions();
      }, 1000);
    }
    const interval = setInterval(loadLogs, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, [isOpen]);

  // If not admin, don't render the component
  if (!isAdmin) {
    return null;
  }

  const loadLogs = () => {
    const allLogs = [...PaymentLogger.getLogsFromStorage(), ...PaymentLogger.getLogs()];
    setLogs(allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };

  const filteredLogs = logs.filter(log => filter === 'all' || log.level === filter);

  const testWebhookEndpoint = async () => {
    setIsTestingWebhook(true);
    PaymentLogger.log('info', 'Debug', 'Testing webhook endpoint...');
    try {
      const result = await testWebhookEndpoint();
      setWebhookStatus(result);
    } catch (error) {
      setWebhookStatus({ error: error.message });
    } finally {
      setIsTestingWebhook(false);
      loadLogs();
    }
  };

  const exportLogs = () => {
    try {
      const exportData = PaymentLogger.generateDebugReport();
      const allLogs = exportData.logs;
      
      // Create formatted text version
      const logText = allLogs.map(log => {
        const timestamp = new Date(log.timestamp).toLocaleString();
        const header = `[${timestamp}] [${log.level.toUpperCase()}] [${log.component}]`;
        const message = log.message;
        const data = log.data ? `\nData: ${log.data}` : '';
        return `${header} ${message}${data}`;
      }).join('\n\n');
      
      const fullExport = `PAYMENT DEBUGGER EXPORT
Generated: ${new Date().toLocaleString()}
Total Logs: ${allLogs.length}

ENVIRONMENT STATUS:
- Supabase URL: ${exportData.environment.supabaseUrl}
- Supabase Key: ${exportData.environment.supabaseKey}
- Stripe Key: ${exportData.environment.stripeKey}
- Starter Price ID: ${exportData.environment.starterPriceId}
- Professional Price ID: ${exportData.environment.professionalPriceId}
- Enterprise Price ID: ${exportData.environment.enterprisePriceId}

WEBHOOK STATUS:
${webhookStatus ? JSON.stringify(webhookStatus, null, 2) : 'Not tested'}

LOGS:
${logText}

JSON DATA:
${JSON.stringify(exportData, null, 2)}`;
      
      // Create and download file
      const blob = new Blob([fullExport], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payment-debugger-logs-${new Date().toISOString().split('T')[0]}.txt`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      PaymentLogger.log('info', 'Debug', 'Logs exported successfully', { 
        filename: link.download,
        logCount: allLogs.length 
      });
      
    } catch (error) {
      PaymentLogger.log('error', 'Debug', 'Export failed', error);
      alert('Export failed: ' + error.message);
    }
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
      case 'EdgeFunction': return <Zap className="w-4 h-4" />;
      default: return <Bug className="w-4 h-4" />;
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          loadLogs();
        }}
        className="fixed bottom-4 right-20 w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors z-30"
        title="Open Payment Debugger"
      >
        <Bug className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full h-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b border-gray-200 ${isLiveMode ? 'bg-red-100' : 'bg-red-50'} flex-shrink-0`}>
          <div className="flex items-center space-x-3">
            <Bug className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-bold text-gray-900">
              Payment Debugger
              {isLiveMode && (
                <span className="ml-2 px-2 py-0.5 bg-red-200 text-red-800 text-xs rounded-full">LIVE MODE</span>
              )}
            </h2>
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
              {logs.length} logs
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Controls */}
        <div className={`p-4 border-b border-gray-200 ${isLiveMode ? 'bg-red-50' : 'bg-gray-50'} flex-shrink-0`}>
          {isLiveMode && (
            <div className="mb-4 bg-red-100 border border-red-300 rounded-lg p-3 text-red-800 font-medium">
              ⚠️ LIVE MODE ACTIVE - Real payments are being processed with production Stripe keys
            </div>
          )}
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Logs</option>
                <option value="info">Info Only</option>
                <option value="warn">Warnings Only</option>
                <option value="error">Errors Only</option>
              </select>
              
              <button
                onClick={loadLogs}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={exportLogs}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              
              <button
                onClick={() => {
                  PaymentLogger.clearLogs();
                  loadLogs();
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Test Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={testWebhookEndpoint}
              disabled={isTestingWebhook || isLiveMode}
              className={`flex items-center space-x-2 px-4 py-2 cursor-pointer ${
                isLiveMode ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'
              } text-white rounded-lg text-sm disabled:bg-gray-400 transition-colors`}
              title={isLiveMode ? 'Testing webhooks in live mode is disabled' : 'Test webhook endpoint'}
            >
              <Webhook className="w-4 h-4" />
              <span>
                {isTestingWebhook ? 'Testing...' : isLiveMode ? 'Test Disabled (LIVE)' : 'Test Webhook'}
              </span>
            </button>
            
            <button
              onClick={checkDatabaseConnection}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
            >
              <Database className="w-4 h-4" />
              <span>Test Database</span>
            </button>
            
            <button
              onClick={checkEdgeFunctions}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 transition-colors"
            >
              <Zap className="w-4 h-4" />
              <span>Check Edge Functions</span>
            </button>
            
            <button
              onClick={simulateWebhook} 
              disabled={disableInLiveMode}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              title={isLiveMode ? 'Simulating webhooks in live mode is disabled' : 'Simulate webhook event'}
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isLiveMode ? 'Simulate Disabled (LIVE)' : 'Simulate Webhook'}</span>
            </button>

            {webhookStatus && (
              <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
                webhookStatus.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                Webhook: {webhookStatus.ok ? `✅ OK (${webhookStatus.status})` : `❌ Error ${webhookStatus.status}`}
              </div>
            )}
          </div>
        </div>

        {/* Logs - MUCH LARGER NOW */}
        <div className={`flex-1 overflow-y-auto p-6 ${isLiveMode ? 'bg-red-50/30' : 'bg-gray-50'}`} style={{ minHeight: '500px' }}>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Bug className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No logs found</h3>
              <p>Start a payment or click the test buttons to see debugging information.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-xl border-l-4 shadow-sm bg-white ${
                    log.level === 'error' ? 'border-red-500' : 
                    log.level === 'warn' ? 'border-yellow-500' : 
                    'border-green-500' 
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getLogIcon(log.level)}
                      {getComponentIcon(log.component)}
                      <span className="font-semibold text-gray-900 text-lg">{log.component}</span>
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      {log.message.includes('LIVE') && (
                        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                          LIVE MODE
                        </span>
                      )}
                    </div>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                      log.level === 'error' ? 'bg-red-100 text-red-800' :
                      log.level === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {log.level.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-gray-800 mb-3 font-medium text-base leading-relaxed">{log.message}</p>
                  
                  {log.data && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 font-medium mb-2 select-none">
                        📋 View Technical Details
                      </summary>
                      <div className="mt-3 p-4 bg-gray-900 text-green-400 rounded-lg text-sm overflow-x-auto border">
                        <pre className="whitespace-pre-wrap font-mono leading-relaxed">
                          {log.data}
                        </pre>
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Troubleshooting Guide - Fixed at bottom */}
        <div className={`p-6 border-t border-gray-200 ${isLiveMode ? 'bg-red-50' : 'bg-yellow-50'} flex-shrink-0`}>
          <h3 className="font-bold text-yellow-900 mb-3 text-lg">🚨 Payment Not Upgrading Plan?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-yellow-900 mb-2">Quick Diagnosis:</h4>
              <div className="text-sm text-yellow-800 space-y-1">
                <div><strong>1. Check Edge Functions:</strong> Click "Check Edge Functions" to see if they're deployed</div>
                <div><strong>2. Test Webhook:</strong> Click "Test Webhook" to verify the endpoint responds</div>
                <div><strong>3. Check Stripe Dashboard:</strong> Go to Stripe → Developers → Webhooks → Events</div>
                <div><strong>4. Manual Fix:</strong> If payment succeeded, manually update in Supabase dashboard</div>
              </div>
            </div>
            
            <div>
              <h4 className={`font-semibold ${isLiveMode ? 'text-red-900' : 'text-yellow-900'} mb-2`}>Quick Fix Commands:</h4>
              <div className={`${isLiveMode ? 'bg-red-100 border border-red-200' : 'bg-yellow-100 border border-yellow-200'} rounded-lg p-3`}>
                <div className={`font-mono text-xs ${isLiveMode ? 'text-red-800' : 'text-yellow-800'} space-y-1`}>
                  <div>npx supabase functions deploy stripe-webhook</div>
                  <div>npx supabase secrets set STRIPE_SECRET_KEY=sk_test_your_key</div>
                  <div>npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Environment Status - Fixed at bottom */}
        <div className={`p-4 border-t border-gray-200 ${isLiveMode ? 'bg-red-50' : 'bg-blue-50'} flex-shrink-0`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Environment Status:</h4>
              <div className="space-y-1">
                <div><strong>Supabase URL:</strong> {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</div>
                <div><strong>Supabase Key:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</div>
                <div>
                  <strong>Stripe Key:</strong> {
                    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY 
                      ? isLiveMode 
                        ? '🔴 LIVE MODE' 
                        : '✅ Test Mode' 
                      : '❌ Missing'
                  }
                </div>
                <div>
                  <strong>Stripe Prices:</strong> {
                    import.meta.env.VITE_STRIPE_STARTER_PRICE_ID &&
                    import.meta.env.VITE_STRIPE_PROFESSIONAL_PRICE_ID &&
                    import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID
                      ? '✅ Set'
                      : '❌ Missing'
                  }
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Log Summary:</h4>
              <div className="space-y-1">
                <div className="text-red-600"><strong>Errors:</strong> {logs.filter(l => l.level === 'error').length}</div>
                <div className="text-yellow-600"><strong>Warnings:</strong> {logs.filter(l => l.level === 'warn').length}</div>
                <div className="text-green-600"><strong>Info:</strong> {logs.filter(l => l.level === 'info').length}</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Components:</h4>
              <div className="space-y-1">
                <StripeStatus />
                {Array.from(new Set(logs.map(l => l.component))).slice(0, 4).map(component => (
                  <div key={component}>
                    <strong>{component}:</strong> {logs.filter(l => l.component === component).length} logs
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}