import React, { useState } from 'react';
import { Check, Zap, Crown, Building2, Mail, Users, FileText, Gift, CreditCard, AlertCircle } from 'lucide-react';
import TrialSignup from '../Auth/TrialSignup';
import StripeStatus from '../Payment/StripeStatus';
import { validateStripeConfig } from '../../lib/stripe';

interface PricingTiersProps {
  currentPlan: string;
  onUpgrade: (plan: string) => void;
}

export default function PricingTiers({ currentPlan, onUpgrade }: PricingTiersProps) {
  const [showTrialSignup, setShowTrialSignup] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [skipTrial, setSkipTrial] = useState(false);

  const stripeConfig = validateStripeConfig();

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      icon: Gift,
      iconColor: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      description: 'Perfect for trying out LLM Navigator',
      features: [
        'Unlimited demo analyses',
        '1 project maximum',
        'Basic AEO scoring',
        'Standard PDF reports',
        'Community support'
      ],
      limitations: [
        'Simulated analysis only',
        'No real-time crawling',
        'Limited insights'
      ]
    },
    {
      id: 'starter',
      name: 'Starter',
      price: 29,
      icon: Zap,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: 'Perfect for small businesses getting started',
      features: [
        '10 analyses per month',
        '3 projects',
        '5 competitors per project',
        'Real website crawling',
        'Advanced AEO scoring',
        'Competitor comparison',
        'Standard PDF reports',
        'Email support (48h response)',
        'Historical data (3 months)'
      ],
      trial: true
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 99,
      icon: Crown,
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      description: 'For agencies and serious marketers',
      features: [
        '50 analyses per month',
        'Unlimited projects',
        'Unlimited competitors',
        'Real website crawling',
        'Advanced AEO scoring',
        'Competitor strategy reports',
        'Product mention intelligence',
        'Branded PDF reports',
        'Priority email support (24h response)',
        'Historical data (12 months)',
        'Team collaboration (up to 5 users)'
      ],
      popular: true,
      trial: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 299,
      icon: Building2,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      description: 'For large organizations and teams',
      features: [
        'Unlimited analyses',
        'Unlimited projects & competitors',
        'Real website crawling',
        'Advanced competitor strategy reports',
        'White-label PDF reports',
        'Team collaboration tools',
        'Dedicated email support (4h response)',
        'Phone support',
        'Custom training sessions',
        'Advanced analytics dashboard',
        'Unlimited historical data',
        'API access',
        'Custom integrations'
      ],
      trial: true
    }
  ];

  const handlePlanSelect = (planId: string, skipTrialOption = false) => {
    if (planId === 'free') {
      onUpgrade(planId);
    } else {
      if (!stripeConfig.isValid) {
        // Show configuration error
        alert('Payment processing is not configured. Please set up Stripe integration first. Check the configuration status above for detailed instructions.');
        return;
      }
      setSelectedPlan(planId);
      setSkipTrial(skipTrialOption);
      setShowTrialSignup(true);
    }
  };

  const handleTrialSuccess = () => {
    setShowTrialSignup(false);
    onUpgrade(selectedPlan);
  };

  if (showTrialSignup) {
    return (
      <TrialSignup
        selectedPlan={selectedPlan}
        skipTrial={skipTrial}
        onSuccess={handleTrialSuccess}
        onCancel={() => setShowTrialSignup(false)}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Choose Your LLM Navigator Plan
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
          Unlock the full potential of Answer Engine Optimization with plans designed for every need.
        </p>
        
        {/* Stripe Status */}
        <div className="max-w-4xl mx-auto mb-8">
          <StripeStatus />
        </div>
        
        {/* Demo Mode Banner */}
        {!stripeConfig.isValid && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-4xl mx-auto mb-8">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <Gift className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-blue-900">Demo Mode Active</h2>
            </div>
            <p className="text-blue-800 mb-2">
              Your app is fully functional in demo mode! All features work except real payment processing.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 mt-4">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Unlimited demo analyses</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>All UI features functional</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>PDF report generation</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Complete user experience</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Trial Banner - only show if Stripe is configured */}
        {stripeConfig.isValid && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-6 max-w-4xl mx-auto mb-8">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <Gift className="w-6 h-6" />
              <h2 className="text-xl font-bold">14-Day Free Trial Available</h2>
            </div>
            <p className="text-blue-100 mb-2">
              Try any paid plan free for 14 days. Advanced fraud protection ensures fair access.
            </p>
            <p className="text-blue-200 text-sm">
              One trial per person/organization every 90 days • No credit card required*
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = currentPlan === plan.id;
          const isPopular = plan.popular;
          const hasTrial = plan.trial && stripeConfig.isValid;

          return (
            <div 
              key={plan.id}
              className={`relative rounded-2xl border-2 p-6 ${plan.borderColor} ${plan.bgColor} ${
                isPopular ? 'ring-2 ring-indigo-500 ring-offset-2 scale-105' : ''
              } transition-all duration-200 hover:shadow-lg`}
            >
              {isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              {hasTrial && !isCurrent && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    14-Day Trial
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <div className={`w-12 h-12 ${plan.bgColor} rounded-xl flex items-center justify-center mx-auto mb-4 border-2 ${plan.borderColor}`}>
                  <Icon className={`w-6 h-6 ${plan.iconColor}`} />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-600">/month</span>
                </div>

                {hasTrial && !isCurrent && (
                  <div className="text-xs text-emerald-600 font-medium mb-2">
                    Then ${plan.price}/month
                  </div>
                )}
              </div>

              <div className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </div>
                ))}
                
                {plan.limitations && plan.limitations.map((limitation, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-4 h-4 mt-0.5 flex-shrink-0">
                      <div className="w-2 h-2 bg-gray-300 rounded-full mt-1 mx-auto"></div>
                    </div>
                    <span className="text-gray-500 text-sm">{limitation}</span>
                  </div>
                ))}
              </div>

              {/* Primary CTA Button */}
              <button
                onClick={() => handlePlanSelect(plan.id, false)}
                disabled={isCurrent}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all text-sm mb-3 ${
                  isCurrent
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : isPopular
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg'
                    : plan.id === 'free'
                    ? 'bg-gray-600 text-white hover:bg-gray-700'
                    : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {isCurrent 
                  ? 'Current Plan' 
                  : plan.id === 'free' 
                  ? 'Get Started Free'
                  : !stripeConfig.isValid
                  ? 'Demo Mode Only'
                  : hasTrial 
                  ? 'Start Free Trial' 
                  : 'Upgrade Now'
                }
              </button>

              {/* Skip Trial Button for paid plans */}
              {hasTrial && !isCurrent && stripeConfig.isValid && (
                <button
                  onClick={() => handlePlanSelect(plan.id, true)}
                  className="w-full py-2 px-4 text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded-lg font-medium transition-all text-sm flex items-center justify-center space-x-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Skip Trial - Buy Now</span>
                </button>
              )}

              {/* Configuration Warning */}
              {!stripeConfig.isValid && plan.id !== 'free' && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  <AlertCircle className="w-3 h-3 inline mr-1" />
                  Stripe setup required for payments
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Feature Highlights */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Expert Support</h3>
          <p className="text-gray-600 text-sm">
            Get help from our AEO experts with response times from 48h to 4h based on your plan
          </p>
        </div>
        
        <div className="text-center">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Competitor Intelligence</h3>
          <p className="text-gray-600 text-sm">
            Deep insights into competitor tactics and opportunities to outrank them in AI search
          </p>
        </div>
        
        <div className="text-center">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Professional Reports</h3>
          <p className="text-gray-600 text-sm">
            Branded PDF reports you can share with clients, stakeholders, and your team
          </p>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-600 mb-4">
          {stripeConfig.isValid 
            ? "Questions about our pricing or trial? We're here to help."
            : "Your app is fully functional in demo mode. Set up Stripe to enable real payment processing."
          }
        </p>
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
          <span>✓ {stripeConfig.isValid ? 'Cancel anytime during trial' : 'Unlimited demo access'}</span>
          <span>✓ 99.9% uptime SLA</span>
          <span>✓ SOC 2 compliant</span>
        </div>
      </div>
    </div>
  );
}