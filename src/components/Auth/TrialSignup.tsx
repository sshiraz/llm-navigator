import React, { useState } from 'react';
import { CreditCard, Gift, Zap } from 'lucide-react';
import CreditCardForm from '../Payment/CreditCardForm';
import { isLiveMode } from '../../utils/liveMode';
import LiveModeIndicator from '../UI/LiveModeIndicator';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const planPrices = {
    starter: 29,
    professional: 99,
    enterprise: 299
  };

  const planPrice = planPrices[selectedPlan as keyof typeof planPrices] || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsProcessing(true);

    if (skipTrial) {
      // Go directly to checkout for skip trial
      setShowCheckout(true);
      setIsProcessing(false);
      return;
    }

    // Simulate trial account creation
    setTimeout(() => {
      console.log('Creating trial account:', {
        ...formData,
        plan: selectedPlan,
        skipTrial: false
      });

      // Store user data in localStorage
      const newUserId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const userData = {
        id: newUserId,
        email: formData.email,
        name: formData.name,
        subscription: 'trial',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
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
              No credit card required
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="john@company.com"
            />
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
            disabled={isProcessing}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <span>
                {skipTrial ? 'Continue to Checkout' : 'Start Free Trial'}
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