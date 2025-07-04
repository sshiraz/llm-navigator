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
        alert('Payment processing is not configured. Please set up Stripe integration first.');
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
        <div className="max-w-2xl mx-auto mb-8">
          <StripeStatus />
        </div>
        
        {/* Trial Banner */}
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = currentPlan === plan.id;
          const isPopular = plan.popular;
          const hasTrial = plan.trial;

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
                disabled={isCurrent || (!stripeConfig.isValid && plan.id !== 'free')}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all text-sm mb-3 ${
                  isCurrent
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : !stripeConfig.isValid && plan.id !== 'free'
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
                  : !stripeConfig.isValid && plan.id !== 'free'
                  ? 'Setup Required'
                  : plan.id === 'free' 
                  ? 'Get Started Free'
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
                  Stripe setup required
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Configuration Help */}
      {!stripeConfig.isValid && (
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Complete Your Stripe Setup
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Missing Configuration:</h4>
              <ul className="space-y-1 text-sm text-blue-800">
                {stripeConfig.issues.map((issue, index) => (
                  <li key={index}>• {issue}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Next Steps:</h4>
              <ol className="space-y-1 text-sm text-blue-800">
                <li>1. Create products in your Stripe dashboard</li>
                <li>2. Copy the Price IDs to your .env file</li>
                <li>3. Set up webhook endpoints</li>
                <li>4. Test with Stripe test cards</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Trial vs Direct Purchase Comparison */}
      <div className="mt-12 bg-white rounded-xl border border-gray-200 p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Trial vs Direct Purchase</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="text-center p-6 bg-blue-50 rounded-xl border border-blue-200">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Gift className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="text-lg font-semibold text-blue-900 mb-3">14-Day Free Trial</h4>
            <ul className="text-sm text-blue-800 space-y-2 text-left">
              <li>• Full access to all plan features</li>
              <li>• No credit card required initially</li>
              <li>• Advanced fraud protection</li>
              <li>• One trial per person/organization</li>
              <li>• 90-day cooldown between trials</li>
              <li>• Automatic conversion after trial</li>
            </ul>
          </div>
          
          <div className="text-center p-6 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-6 h-6 text-emerald-600" />
            </div>
            <h4 className="text-lg font-semibold text-emerald-900 mb-3">Direct Purchase</h4>
            <ul className="text-sm text-emerald-800 space-y-2 text-left">
              <li>• Immediate full access</li>
              <li>• Credit card required upfront</li>
              <li>• No trial restrictions</li>
              <li>• Perfect for returning customers</li>
              <li>• Bypass fraud protection checks</li>
              <li>• Start billing immediately</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Trial Details */}
      <div className="mt-12 bg-white rounded-xl border border-gray-200 p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">How the Free Trial Works</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Sign Up</h4>
            <p className="text-gray-600 text-sm">
              Choose any paid plan and start your 14-day trial. Advanced fraud protection ensures fair access.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-indigo-600 font-bold">2</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Full Access</h4>
            <p className="text-gray-600 text-sm">
              Use all features of your chosen plan for 14 days. Run analyses, compare competitors, generate reports.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-emerald-600 font-bold">3</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Gentle Reminders</h4>
            <p className="text-gray-600 text-sm">
              We'll send friendly email reminders at day 7, 12, and 14 so you never lose track.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-yellow-600 font-bold">4</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Choose Your Path</h4>
            <p className="text-gray-600 text-sm">
              Upgrade to continue with full features, downgrade to free, or pause your account.
            </p>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-white border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h5 className="font-medium text-blue-900 mb-1">Skip Trial Restrictions</h5>
              <p className="text-blue-800 text-sm">
                Use the "Skip Trial - Buy Now" button to bypass all trial restrictions and fraud protection checks. 
                Perfect for returning customers or those who prefer immediate access with upfront payment.
              </p>
            </div>
          </div>
        </div>
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
          Questions about our pricing or trial? We're here to help.
        </p>
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
          <span>✓ Cancel anytime during trial</span>
          <span>✓ 99.9% uptime SLA</span>
          <span>✓ SOC 2 compliant</span>
        </div>
      </div>
    </div>
  );
}