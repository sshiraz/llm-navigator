import React from 'react';
import { Check, Star, Zap, Crown } from 'lucide-react';
import TrialSignup from '../Auth/TrialSignup';
import StripeRedirectCheckout from './StripeRedirectCheckout';

interface PricingTiersProps {
  currentPlan: string;
  onUpgrade: (plan: string) => void;
}

export default function PricingTiers({ currentPlan, onUpgrade }: PricingTiersProps) {
  const [selectedPlan, setSelectedPlan] = React.useState<string | null>(null);
  const [showTrialSignup, setShowTrialSignup] = React.useState(false);
  const [skipTrial, setSkipTrial] = React.useState(false);
  const [showStripeCheckout, setShowStripeCheckout] = React.useState(false);

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '$29',
      period: '/month',
      description: 'Perfect for small businesses getting started with AI search optimization',
      icon: Star,
      features: [
        '10 AI analyses per month',
        'Basic competitor insights',
        'Standard optimization recommendations',
        'Email support',
        'Standard reporting'
      ],
      popular: false,
      buttonText: 'Start Free Trial'
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '$99',
      period: '/month',
      description: 'Advanced features for businesses serious about AI search visibility',
      icon: Zap,
      features: [
        '50 AI analyses per month',
        'Advanced competitor strategy',
        'Advanced optimization recommendations',
        'Email support',
        'Advanced reporting & analytics',
        'Detailed performance metrics',
        'Limited historical data retention (3 months)'
      ],
      popular: true,
      buttonText: 'Upgrade to Pro'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '$299',
      period: '/month',
      description: 'Complete solution for large organizations with custom needs',
      icon: Crown,
      features: [
        'Unlimited AI analyses',
        'Advanced competitor strategy',
        'White-label reporting & custom branding',
        'Priority email support',
        'Premium performance metrics',
        'Unlimited projects',
        'Unlimited users',
        'Unlimited historical data retention',
        'Access to all AI models including Claude 3 Opus'
      ],
      popular: false,
      buttonText: 'Start Free Trial'
    }
  ];

  const handlePlanSelect = (planId: string, skipTrialOption = false) => {
    if (planId === currentPlan) return;
    
    console.log(`Selected plan: ${planId}, skip trial: ${skipTrialOption}`);
    setSelectedPlan(planId);
    setSkipTrial(skipTrialOption);
    
    // For other plans, show trial signup or checkout
    if (skipTrialOption) {
      setShowStripeCheckout(true);
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

  const handleStripeCheckoutSuccess = () => {
    setShowStripeCheckout(false);
    if (selectedPlan) {
      onUpgrade(selectedPlan);
    }
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

  if (showStripeCheckout && selectedPlan) {
    return (
      <StripeRedirectCheckout
        plan={selectedPlan}
        onCancel={() => setShowStripeCheckout(false)}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your AI Optimization Plan
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Unlock the power of AI-driven SEO optimization with plans designed to scale with your business needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {plans.map((plan) => {
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
                
                {!isCurrentPlan && plan.id !== 'enterprise' && (
                <button
                  onClick={() => handlePlanSelect(plan.id, true)}
                  className="w-full py-2 px-6 rounded-xl font-medium text-sm transition-all duration-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Skip Trial - Buy Now
                </button>
                )}
                
                {!isCurrentPlan && plan.id === 'enterprise' && (
                <button
                  onClick={() => handlePlanSelect(plan.id, true)}
                  className="w-full py-2 px-6 rounded-xl font-medium text-sm transition-all duration-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Skip Trial - Buy Now
                </button>
                )}
              </div>
            </div>
          );
        })}
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
            window.location.hash = '#contact';
            window.location.reload();
          }}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          Contact Our Sales Team
        </button>
      </div>
    </div>
  );
};