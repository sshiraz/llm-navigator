import React, { useState } from 'react';
import { UserCheck, AlertTriangle, CheckCircle, RefreshCw, X, Search, CreditCard } from 'lucide-react';
import { ManualSubscriptionFix } from '../../utils/manualSubscriptionFix';
import { PaymentLogger } from '../../utils/paymentLogger';

export default function SubscriptionFixTool() {
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [plan, setPlan] = useState('starter');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [checkResult, setCheckResult] = useState<any>(null);
  const [latestPayment, setLatestPayment] = useState<any>(null);
  
  const checkSubscription = async () => {
    if (!userId) {
      alert('Please enter a user ID');
      return;
    }
    
    setIsLoading(true);
    setCheckResult(null);
    setLatestPayment(null);
    
    try {
      const status = await ManualSubscriptionFix.checkSubscriptionStatus(userId);
      setCheckResult(status);
      
      // If there's a payment, get the details
      if (status.hasPayment) {
        const payment = await ManualSubscriptionFix.getLatestPayment(userId);
        setLatestPayment(payment);
        
        // Set the plan based on the payment
        if (payment && payment.plan) {
          setPlan(payment.plan);
        }
      }
      
      PaymentLogger.log('info', 'SubscriptionFixTool', 'Checked subscription status', { userId, status });
    } catch (error) {
      PaymentLogger.log('error', 'SubscriptionFixTool', 'Failed to check subscription', error);
      alert(`Error checking subscription: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fixSubscription = async () => {
    if (!userId) {
      alert('Please enter a user ID');
      return;
    }
    
    setIsLoading(true);
    setResult(null);
    
    try {
      const result = await ManualSubscriptionFix.fixSubscription(userId, plan);
      setResult(result);
      
      if (result.success) {
        // Refresh the check result
        const status = await ManualSubscriptionFix.checkSubscriptionStatus(userId);
        setCheckResult(status);
      }
      
      PaymentLogger.log(result.success ? 'info' : 'error', 'SubscriptionFixTool', 
        result.success ? 'Fixed subscription successfully' : 'Failed to fix subscription', 
        { userId, plan, result }
      );
    } catch (error) {
      PaymentLogger.log('error', 'SubscriptionFixTool', 'Error fixing subscription', error);
      alert(`Error fixing subscription: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-20 bg-emerald-600 text-white rounded-lg px-4 py-2 flex items-center space-x-2 shadow-lg hover:bg-emerald-700 transition-colors z-50"
      >
        <UserCheck className="w-5 h-5" />
        <span>Fix Subscription</span>
      </button>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-emerald-50">
          <div className="flex items-center space-x-3">
            <UserCheck className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-bold text-gray-900">Subscription Fix Tool</h2>
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">About This Tool</h3>
            <p className="text-sm text-blue-800">
              This tool helps fix subscription issues when a payment succeeded in Stripe but the webhook failed to update the user's subscription in the database.
            </p>
          </div>
          
          {/* User ID Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User ID
            </label>
            <div className="flex space-x-3">
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="User ID from database"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                onClick={checkSubscription}
                disabled={isLoading || !userId}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center space-x-2"
              >
                {isLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                <span>Check</span>
              </button>
            </div>
          </div>
          
          {/* Check Result */}
          {checkResult && (
            <div className={`p-4 rounded-lg border ${
              checkResult.needsFix 
                ? 'bg-yellow-50 border-yellow-200' 
                : checkResult.hasPayment 
                ? 'bg-green-50 border-green-200' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-start space-x-3">
                {checkResult.needsFix ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                ) : checkResult.hasPayment ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-gray-600 mt-0.5" />
                )}
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    {checkResult.needsFix 
                      ? 'Subscription Needs Fixing' 
                      : checkResult.hasPayment 
                      ? 'Subscription Status OK' 
                      : 'No Payments Found'}
                  </h4>
                  <div className="text-sm space-y-1">
                    <p className={checkResult.needsFix ? 'text-yellow-800' : 'text-gray-600'}>
                      Current Plan: <strong>{checkResult.currentPlan}</strong>
                    </p>
                    <p className={checkResult.hasPayment ? 'text-green-800' : 'text-gray-600'}>
                      Has Payments: <strong>{checkResult.hasPayment ? 'Yes' : 'No'}</strong>
                    </p>
                    {checkResult.needsFix && (
                      <p className="text-yellow-800 font-medium">
                        This user has a successful payment but their subscription hasn't been updated.
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Latest Payment */}
              {latestPayment && (
                <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <CreditCard className="w-4 h-4 text-gray-600" />
                    <h5 className="font-medium text-gray-900">Latest Payment</h5>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-600">Amount:</div>
                    <div className="font-medium">${(latestPayment.amount / 100).toFixed(2)} {latestPayment.currency.toUpperCase()}</div>
                    
                    <div className="text-gray-600">Plan:</div>
                    <div className="font-medium">{latestPayment.plan}</div>
                    
                    <div className="text-gray-600">Status:</div>
                    <div className="font-medium">{latestPayment.status}</div>
                    
                    <div className="text-gray-600">Date:</div>
                    <div className="font-medium">{new Date(latestPayment.created_at).toLocaleString()}</div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Plan Selection */}
          {checkResult && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan to Set
              </label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="starter">Starter ($29/month)</option>
                <option value="professional">Professional ($99/month)</option>
                <option value="enterprise">Enterprise ($299/month)</option>
              </select>
            </div>
          )}
          
          {/* Fix Button */}
          {checkResult && (
            <button
              onClick={fixSubscription}
              disabled={isLoading || !checkResult.hasPayment}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 ${
                checkResult.needsFix
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-5 h-5" />
                  <span>{checkResult.needsFix ? 'Fix Subscription Now' : 'Update Subscription'}</span>
                </>
              )}
            </button>
          )}
          
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
                  {result.error && (
                    <details className="mt-2">
                      <summary className="text-sm font-medium cursor-pointer">View Error Details</summary>
                      <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-x-auto">
                        {JSON.stringify(result.error, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              This tool directly updates the database. Use with caution.
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