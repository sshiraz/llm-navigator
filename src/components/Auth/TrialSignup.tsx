import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, CreditCard, Mail, User, CheckCircle, XCircle, Gift, Zap } from 'lucide-react';
import { FraudPrevention } from '../../utils/fraudPrevention';
import CreditCardForm from '../Payment/CreditCardForm';
import { isLiveMode } from '../../utils/liveMode';
import { getPlanAmount } from '../../utils/stripeUtils';
import LiveModeIndicator from '../UI/LiveModeIndicator';
import { PaymentLogger } from '../../utils/paymentLogger';

interface TrialSignupProps {
  selectedPlan: string;
  skipTrial?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TrialSignup({ selectedPlan, skipTrial = false, onSuccess, onCancel }: TrialSignupProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    website: ''
  });
  const [fraudCheck, setFraudCheck] = useState<FraudPreventionCheck | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [requiresPayment, setRequiresPayment] = useState(skipTrial);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [userId, setUserId] = useState<string>('');

  const planPrices = {
    starter: 29,
    professional: 99,
    enterprise: 299
  };

  const planPrice = planPrices[selectedPlan as keyof typeof planPrices] || 0;

  const handleEmailBlur = async () => {
    if (!formData.email || skipTrial) return;
    
    setIsChecking(true);
    try {
      const check = await FraudPrevention.checkTrialEligibility(formData.email);
      setFraudCheck(check);
      setRequiresPayment(skipTrial || FraudPrevention.requiresPaymentMethod(check.riskScore));
      
      if (!check.isAllowed) {
        setShowAlternatives(true);
      }
    } catch (error) {
      console.error('Fraud check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (skipTrial) {
      // Go directly to checkout for skip trial
      setShowCheckout(true);
      return;
    }
    
    if (fraudCheck && !fraudCheck.isAllowed) {
      return; // Prevent submission if fraud check failed
    }
    
    setIsProcessing(true);
    
    // Simulate trial account creation
    setTimeout(() => {
      console.log('Creating trial account:', { 
        ...formData,
        id: Date.now().toString(), // Generate a temporary ID
        plan: selectedPlan, 
        skipTrial,
        requiresPayment 
      });
      
      // Store user data in localStorage
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setUserId(userId);
      
      const userData: UserType = {
        id: userId,
        email: formData.email,
        name: formData.name,
        subscription: skipTrial ? selectedPlan : 'trial',
        trialEndsAt: skipTrial ? undefined : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
      };
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
      setIsProcessing(false);
      onSuccess();
    }, 2000);
  };

  const handleCheckoutSuccess = (paymentData: any) => {
    console.log('Payment successful:', paymentData);
    
    onSuccess();
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore < 25) return 'text-emerald-600';
    if (riskScore < 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Show checkout form for skip trial
  if (showCheckout) {
    return (
      <CreditCardForm
        plan={selectedPlan}
        amount={planPrice * 100} // Convert to cents
        onSuccess={(paymentData) => handleCheckoutSuccess(paymentData)}
        onCancel={() => setShowCheckout(false)}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl border border-gray-200 p-8">
      <div className="text-center mb-8">
        {isLiveMode && <LiveModeIndicator variant="warning" className="mb-6" />}
      
        <div className="flex items-center justify-center space-x-3 mb-4">
          {skipTrial ? (
            <CreditCard className="w-8 h-8 text-emerald-600" />
          ) : (
            <Gift className="w-8 h-8 text-blue-600" />
          )}
          <h2 className="text-2xl font-bold text-gray-900">
            {skipTrial ? `Purchase ${selectedPlan} Plan` : `Start Your ${selectedPlan} Trial`}
          </h2>
        </div>
        
        {skipTrial ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Zap className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-emerald-900">Direct Purchase - ${planPrice}/month</span>
            </div>
            <p className="text-emerald-800 text-sm">
              Immediate access, no trial restrictions, billing starts today
            </p>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Gift className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">14-Day Free Trial</span>
            </div>
            <p className="text-blue-800 text-sm">
              {requiresPayment ? 'Payment method required for verification' : 'No credit card required'}
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              onBlur={handleEmailBlur}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="john@company.com"
            />
            
            {isChecking && (
              <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Verifying eligibility...</span>
              </div>
            )}
            
            {fraudCheck && !skipTrial && (
              <div className="mt-2">
                {fraudCheck.isAllowed ? (
                  <div className="flex items-center space-x-2 text-sm text-emerald-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Email verified - trial approved</span>
                  </div>
                ) : (
                  <div className="flex items-start space-x-2 text-sm text-red-600">
                    <XCircle className="w-4 h-4 mt-0.5" />
                    <span>{fraudCheck.reason}</span>
                  </div>
                )}
                
                {/* Risk Score Display (for demo purposes) */}
                <div className="mt-1 text-xs text-gray-500">
                  Risk Score: <span className={getRiskColor(fraudCheck.riskScore)}>
                    {fraudCheck.riskScore}/100
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Acme Corp"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://acme.com"
            />
          </div>
        </div>

        {/* Security Notice */}
        {!skipTrial && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  Trial Protection Active
                </h4>
                <p className="text-sm text-blue-800">
                  We use advanced fraud detection to ensure fair trial access. 
                  One trial per person/organization every 90 days.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Alternative Options */}
        {showAlternatives && !skipTrial && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Alternative Options:
            </h4>
            <div className="space-y-2">
              {FraudPrevention.getAlternativeOptions().map((option, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2"></div>
                  <span className="text-sm text-gray-700">{option}</span>
                </div>
              ))}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCheckout(true);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Or skip trial and purchase directly →
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isProcessing || (!skipTrial && fraudCheck && !fraudCheck.isAllowed)}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <span>
                {skipTrial 
                  ? 'Continue to Checkout'
                  : requiresPayment 
                  ? 'Add Payment & Start Trial' 
                  : 'Start Free Trial'
                }
              </span>
            )}
          </button>
        </div>
      </form>

      {/* Terms */}
      <div className="mt-6 text-xs text-gray-500 text-center space-y-1">
        <p>
          By {skipTrial ? 'purchasing' : 'starting your trial'}, you agree to our <a href="#terms" onClick={(e) => {e.preventDefault(); window.location.hash = '#terms';}} className="text-blue-600 hover:text-blue-700">Terms of Service</a> and <a href="#privacy" onClick={(e) => {e.preventDefault(); window.location.hash = '#privacy';}} className="text-blue-600 hover:text-blue-700">Privacy Policy</a>.
        </p>
        {!skipTrial && ' Cancel anytime during your 14-day trial period.'}
      </div>
    </div>
  );
}