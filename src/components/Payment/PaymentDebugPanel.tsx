import React, { useState, useEffect } from 'react';
import { Bug, X, CheckCircle, AlertCircle, XCircle, Download, Trash2, Eye, EyeOff, Play, RefreshCw } from 'lucide-react';
import { PaymentDebugger } from '../../utils/paymentDebugger';

export default function PaymentDebugPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [systemCheck, setSystemCheck] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'logs' | 'config' | 'test'>('logs');

  useEffect(() => {
    if (isVisible) {
      refreshLogs();
    }
  }, [isVisible]);

  const refreshLogs = () => {
    setLogs(PaymentDebugger.getDebugLogs());
  };

  const runSystemCheck = async () => {
    setIsLoading(true);
    try {
      const results = await PaymentDebugger.runSystemCheck();
      setSystemCheck(results);
    } catch (error) {
      console.error('System check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportLogs = () => {
    const logsData = PaymentDebugger.exportLogs();
    const blob = new Blob([logsData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-debug-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearLogs = () => {
    PaymentDebugger.clearLogs();
    setLogs([]);
  };

  const getStatusIcon = (status: boolean | undefined) => {
    if (status === true) return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    if (status === false) return <XCircle className="w-4 h-4 text-red-500" />;
    return <AlertCircle className="w-4 h-4 text-yellow-500" />;
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warn': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        title="Open Payment Debug Panel"
      >
        <Bug className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <Bug className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Payment Debug Panel</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={runSystemCheck}
              disabled={isLoading}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>Run System Check</span>
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'logs', label: 'Debug Logs' },
            { id: 'config', label: 'Configuration' },
            { id: 'test', label: 'System Test' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Debug Logs Tab */}
          {activeTab === 'logs' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Debug Logs</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={refreshLogs}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                    title="Refresh Logs"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={exportLogs}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                    title="Export Logs"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={clearLogs}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                    title="Clear Logs"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No debug logs yet. Interact with payment features to see logs here.
                  </div>
                ) : (
                  logs.slice(-20).reverse().map((log, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${getLogLevelColor(log.level)}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{log.event}</span>
                        <span className="text-xs opacity-75">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {log.data && (
                        <pre className="text-xs mt-2 overflow-x-auto bg-white bg-opacity-50 p-2 rounded">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Configuration Tab */}
          {activeTab === 'config' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration Status</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Environment Variables</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>VITE_SUPABASE_URL</span>
                      {getStatusIcon(!!import.meta.env.VITE_SUPABASE_URL)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>VITE_SUPABASE_ANON_KEY</span>
                      {getStatusIcon(!!import.meta.env.VITE_SUPABASE_ANON_KEY)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>VITE_STRIPE_PUBLISHABLE_KEY</span>
                      {getStatusIcon(!!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>VITE_STRIPE_STARTER_PRICE_ID</span>
                      {getStatusIcon(!!import.meta.env.VITE_STRIPE_STARTER_PRICE_ID)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>VITE_STRIPE_PROFESSIONAL_PRICE_ID</span>
                      {getStatusIcon(!!import.meta.env.VITE_STRIPE_PROFESSIONAL_PRICE_ID)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>VITE_STRIPE_ENTERPRISE_PRICE_ID</span>
                      {getStatusIcon(!!import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID)}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Runtime Environment</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Mode:</span>
                      <span className="font-mono">{import.meta.env.MODE}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Development:</span>
                      <span className="font-mono">{import.meta.env.DEV ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>URL:</span>
                      <span className="font-mono text-xs">{window.location.origin}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Debug Enabled:</span>
                      <span className="font-mono">{localStorage.getItem('payment_debug') ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* System Test Tab */}
          {activeTab === 'test' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Test Results</h3>
              
              {!systemCheck ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">Run a comprehensive system check to test all payment components.</p>
                  <button
                    onClick={runSystemCheck}
                    disabled={isLoading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    {isLoading ? 'Running Tests...' : 'Run System Check'}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Stripe Configuration */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Stripe Configuration</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Publishable Key</span>
                        {getStatusIcon(systemCheck.stripeConfig?.publishableKeyPresent)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>All Price IDs</span>
                        {getStatusIcon(systemCheck.stripeConfig?.allConfigured)}
                      </div>
                    </div>
                  </div>

                  {/* Edge Functions */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Edge Functions</h4>
                    <div className="space-y-2 text-sm">
                      {systemCheck.edgeFunctions && Object.entries(systemCheck.edgeFunctions).map(([name, status]: [string, any]) => (
                        <div key={name} className="flex items-center justify-between">
                          <span>{name}</span>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(status.available)}
                            <span className="text-xs text-gray-500">
                              {status.status || status.error}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Test */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Payment Intent Test</h4>
                    <div className={`p-3 rounded border ${
                      systemCheck.paymentTest?.success 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                      {systemCheck.paymentTest?.success ? (
                        <div>
                          <div className="font-medium">✅ Payment Intent Created Successfully</div>
                          <div className="text-sm mt-1">
                            Amount: ${systemCheck.paymentTest.data?.amount / 100} {systemCheck.paymentTest.data?.currency?.toUpperCase()}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium">❌ Payment Intent Failed</div>
                          <div className="text-sm mt-1">{systemCheck.paymentTest?.error}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Raw Results */}
                  <details className="bg-gray-50 rounded-lg p-4">
                    <summary className="font-medium text-gray-900 cursor-pointer">Raw Test Results</summary>
                    <pre className="text-xs mt-3 overflow-x-auto bg-white p-3 rounded">
                      {JSON.stringify(systemCheck, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Console Commands */}
        <div className="border-t border-gray-200 bg-gray-900 text-green-400 p-4 font-mono text-sm">
          <h4 className="text-white font-bold mb-2">Console Commands</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div><span className="text-yellow-400">paymentDebug.enable()</span> - Enable debugging</div>
            <div><span className="text-yellow-400">paymentDebug.systemCheck()</span> - Run full system check</div>
            <div><span className="text-yellow-400">paymentDebug.checkStripe()</span> - Check Stripe config</div>
            <div><span className="text-yellow-400">paymentDebug.testPayment()</span> - Test payment intent</div>
            <div><span className="text-yellow-400">paymentDebug.logs()</span> - View all logs</div>
            <div><span className="text-yellow-400">paymentDebug.export()</span> - Export logs as JSON</div>
          </div>
        </div>
      </div>
    </div>
  );
}