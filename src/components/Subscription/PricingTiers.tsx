import React from 'react';
import { Check, Gift, CreditCard, ArrowRight, ArrowLeft, Home } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise, STRIPE_CONFIG } from '../../utils/stripeUtils';
import TrialSignup from '../Auth/TrialSignup';
import CreditCardForm from '../Payment/CreditCardForm';
import { isLiveMode } from '../../utils/liveMode';
import { PLAN_CONFIGS, getPlanAmount } from '../../utils/planConfig';
import LiveModeIndicator from '../UI/LiveModeIndicator';

interface PricingTiersProps {
  currentPlan: string;
  onUpgrade: (plan: string) => void;
}

export default function PricingTiers({ currentPlan, onUpgrade }: PricingTiersProps) {
  const [selectedPlan, setSelectedPlan] = React.useState<string | null>(null);
  const [showTrialSignup, setShowTrialSignup] = React.useState(false);
  const [skipTrial, setSkipTrial] = React.useState(false);
  const [showCheckout, setShowCheckout] = React.useState(false);
  const [planAmount, setPlanAmount] = React.useState(0);

  const handlePlanSelect = (planId: string, skipTrialOption = false) => {
    if (planId === currentPlan) return;
    
    // Log the plan selection
    console.log(`Selected plan: ${planId}, skip trial: ${skipTrialOption}`);
    setSelectedPlan(planId);
    setSkipTrial(skipTrialOption);
    
    if (skipTrialOption) {
      // Set the plan amount based on the selected plan
      setPlanAmount(getPlanAmount(planId));
      setShowCheckout(true);
    } else {
      setShowTrialSignup(true);
    }
  };

  const handleTrialSuccess = () => {
    setShowTrialSignup(false);
    if (selectedPlan) {
      onUpgrade(selectedPlan);
    }
  };

  const handleCheckoutSuccess = () => {
    setShowCheckout(false);
    if (selectedPlan) {
      onUpgrade(selectedPlan);
    }
  };

  const handleCheckoutCancel = () => {
    setShowCheckout(false);
    setSelectedPlan(null);
    setPlanAmount(0);
  };

  // If showing trial signup or checkout, render those components
  if (showTrialSignup && selectedPlan) {
    return (
      <TrialSignup
        selectedPlan={selectedPlan}
        skipTrial={skipTrial}
        onSuccess={handleTrialSuccess}
        onCancel={() => setShowTrialSignup(false)}
      />
    );
  }

  if (showCheckout && selectedPlan) {
    const amount = getPlanAmount(selectedPlan);

    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Elements stripe={stripePromise} options={STRIPE_CONFIG}>
            <CreditCardForm
              plan={selectedPlan}
              amount={amount}
              onSuccess={handleCheckoutSuccess}
              onCancel={handleCheckoutCancel}
            />
          </Elements>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back to Home Button */}
      <div className="mb-8">
        <button
          onClick={() => window.location.hash = 'landing'}
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
      </div>

      <div className="text-center mb-12">
        {isLiveMode && <LiveModeIndicator variant="warning" className="mb-8 mx-auto max-w-3xl" />}

        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your AI Optimization Plan
        </h1>
        
        {/* Trial Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <Gift className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">14-Day Free Trial</h3>
          </div>
          <p className="text-blue-800">
            Try any plan free for 14 days. No credit card required. Cancel anytime.
          </p>
          <p className="text-blue-600 text-sm mt-2">
            Note: Trial uses simulated data. Paid plans include real AI citation tracking.
          </p>
        </div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Unlock the power of AI-driven SEO optimization with plans designed to scale with your business needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {PLAN_CONFIGS.map((plan) => {
          const IconComponent = plan.icon;
          const isCurrentPlan = currentPlan === plan.id;
          const isPopular = plan.popular;

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-xl border-2 transition-all duration-300 hover:shadow-2xl ${
                isPopular
                  ? 'border-indigo-500 scale-105'
                  : isCurrentPlan
                  ? 'border-green-500'
                  : 'border-gray-200 hover:border-indigo-300'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              {isCurrentPlan && (
                <div className="absolute -top-4 right-4">
                  <span className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    Current Plan
                  </span>
                </div>
              )}

              <div className="p-8">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl mx-auto mb-6">
                  <IconComponent className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
                  {plan.name}
                </h3>

                <div className="text-center mb-6">
                  <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600 text-lg">{plan.period}</span>
                </div>

                <p className="text-gray-600 text-center mb-8 leading-relaxed">
                  {plan.description}
                </p>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePlanSelect(plan.id)}
                  disabled={isCurrentPlan}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 mb-2 ${
                    isCurrentPlan
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : isPopular
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                      : 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                  }`}
                >
                  {isCurrentPlan ? 'Current Plan' : plan.buttonText}
                </button>
                
                {!isCurrentPlan && (
                  <button
                    onClick={() => handlePlanSelect(plan.id, true)}
                    disabled={isCurrentPlan}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Skip Trial - Buy Now
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Frequently Asked Questions
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              What is Answer Engine Optimization (AEO)?
            </h3>
            <p className="text-gray-600">
              AEO is the practice of optimizing your content to appear in AI-powered search results from ChatGPT, Claude, Gemini, and other AI assistants.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              How does the free trial work?
            </h3>
            <p className="text-gray-600">
              Our 14-day free trial lets you explore all features with no credit card required. Trial analyses use simulated data to demonstrate the platform. Upgrade to a paid plan for real AI citation tracking with live queries to ChatGPT, Claude, and Perplexity.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Can I change plans later?
            </h3>
            <p className="text-gray-600">
              Absolutely! You can upgrade or downgrade your plan at any time.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Do you offer refunds?
            </h3>
            <p className="text-gray-600">
              Yes, we offer a 30-day money-back guarantee if you're not satisfied with our service.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Need Additional Support?
        </h3>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Our team is available to help with custom implementations, training, and specialized support needs.
        </p>
        <button 
          onClick={() => {
            window.location.hash = 'contact';
          }}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          Contact Our Sales Team
        </button>
      </div>
    </div>
  );
}