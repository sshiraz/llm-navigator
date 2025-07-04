import React, { useState, useEffect } from 'react';
import { Bug, X, CheckCircle, AlertCircle, XCircle, Download, Trash2, Eye, EyeOff } from 'lucide-react';
import { PaymentDebugger } from '../../utils/paymentDebugger';

export default function PaymentDebugPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [stripeConfig, setStripeConfig] = useState<any>(null);
  const [edgeFunctions, setEdgeFunctions] = useState<any>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isVisible) {
      refreshLogs();
      checkConfiguration();
    }
  }, [isVisible]);

  const refreshLogs = () => {
    setLogs(PaymentDebugger.getDebugLogs());
  };

  const checkConfiguration = () => {
    const config = PaymentDebugger.checkStripeConfig();
    setStripeConfig(config);
  };

  const checkEdgeFunctions = async () => {
    setIsLoading(true);
    try {
      const results = await PaymentDebugger.checkEdgeFunctions();
      setEdgeFunctions(results);
    } catch (error) {
      console.error('Failed to check edge functions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testPaymentIntent = async () => {
    setIsLoading(true);
    try {
      const result = await PaymentDebugger.testPaymentIntent();
      setTestResults(result);
    } catch (error) {
      console.error('Failed to test payment intent:', error);
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
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <Bug className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Payment Debug Panel</h2>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Configuration Status */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration Status</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Stripe Configuration</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Publishable Key</span>
                    {getStatusIcon(stripeConfig?.publishableKeyPresent)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Starter Price ID</span>
                    {getStatusIcon(stripeConfig?.starterPriceIdPresent)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Professional Price ID</span>
                    {getStatusIcon(stripeConfig?.professionalPriceIdPresent)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Enterprise Price ID</span>
                    {getStatusIcon(stripeConfig?.enterprisePriceIdPresent)}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Edge Functions</h4>
                {edgeFunctions ? (
                  <div className="space-y-2 text-sm">
                    {Object.entries(edgeFunctions).map(([name, status]: [string, any]) => (
                      <div key={name} className="flex items-center justify-between">
                        <span>{name}</span>
                        {getStatusIcon(status.available)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={checkEdgeFunctions}
                    disabled={isLoading}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    {isLoading ? 'Checking...' : 'Check Edge Functions'}
                  </button>
                )}
              </div>
            </div>

            {/* Test Payment Intent */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Payment Intent Test</h4>
                <button
                  onClick={testPaymentIntent}
                  disabled={isLoading}
                  className="py-1 px-3 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                  {isLoading ? 'Testing...' : 'Test Payment'}
                </button>
              </div>
              
              {testResults && (
                <div className={`p-3 rounded border ${
                  testResults.success 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  {testResults.success ? (
                    <div>
                      <div className="font-medium">✅ Payment Intent Created Successfully</div>
                      <div className="text-sm mt-1">
                        Amount: ${testResults.data.amount / 100} {testResults.data.currency.toUpperCase()}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium">❌ Payment Intent Failed</div>
                      <div className="text-sm mt-1">{testResults.error}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Debug Logs */}
          <div className="mb-6">
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

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No debug logs yet. Interact with payment features to see logs here.
                </div>
              ) : (
                logs.slice(-10).reverse().map((log, index) => (
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
                      <pre className="text-xs mt-2 overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Console Commands */}
          <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm">
            <h4 className="text-white font-bold mb-2">Console Commands</h4>
            <div className="space-y-1">
              <div><span className="text-yellow-400">paymentDebug.enable()</span> - Enable debugging</div>
              <div><span className="text-yellow-400">paymentDebug.checkStripe()</span> - Check Stripe config</div>
              <div><span className="text-yellow-400">paymentDebug.checkFunctions()</span> - Check Edge Functions</div>
              <div><span className="text-yellow-400">paymentDebug.testPayment()</span> - Test payment intent</div>
              <div><span className="text-yellow-400">paymentDebug.logs()</span> - View all logs</div>
              <div><span className="text-yellow-400">paymentDebug.export()</span> - Export logs as JSON</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}