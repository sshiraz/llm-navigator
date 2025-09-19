import React, { useState } from 'react';
import { Check, Star, Zap, Crown, ArrowRight, Gift, CreditCard } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise, STRIPE_CONFIG, getPlanPrice } from '../../utils/stripeUtils';
import CreditCardForm from '../Payment/CreditCardForm';
import { isLiveMode } from '../../utils/liveMode';
import LiveModeIndicator from '../UI/LiveModeIndicator';

interface PricingPageProps {
  currentPlan?: string;
  onUpgrade?: (plan: string) => void;
}

export default function PricingPage({ currentPlan = 'free', onUpgrade }: PricingPageProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutType, setCheckoutType] = useState<'trial' | 'direct'>('trial');

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
        '3 projects maximum',
        'Real website crawling',
        'Basic competitor insights',
        'Standard optimization recommendations',
        'Email support',
        'PDF reports'
      ],
      popular: false,
      buttonText: 'Start Free Trial',
      highlight: false
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '$99',
      period: '/month',
      description: 'Advanced features for agencies and serious marketers',
      icon: Zap,
      features: [
        '50 AI analyses per month',
        'Unlimited projects',
        'Advanced competitor strategy',
        'Multiple AI models (GPT-4, Claude)',
        'Priority support',
        'Advanced reporting & analytics',
        'White-label PDF reports',
        'Team collaboration features'
      ],
      popular: true,
      buttonText: 'Start Free Trial',
      highlight: true
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
        'Unlimited projects & users',
        'All AI models (GPT-4, Claude 3 Opus, Perplexity)',
        'Custom branding & white-labeling',
        'Priority email & phone support',
        'Advanced analytics dashboard',
        'API access',
        'Custom integrations',
        'Dedicated account manager'
      ],
      popular: false,
      buttonText: 'Start Free Trial',
      highlight: false
    }
  ];

  const handlePlanSelect = (planId: string, type: 'trial' | 'direct' = 'trial') => {
    if (planId === currentPlan) return;
    
    setSelectedPlan(planId);
    setCheckoutType(type);
    setShowCheckout(true);
  };

  const handleCheckoutSuccess = (paymentData: any) => {
    setShowCheckout(false);
    
    // Update user subscription in localStorage
    try {
      const currentUserStr = localStorage.getItem('currentUser');
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        const updatedUser = {
          ...currentUser,
          subscription: selectedPlan,
          paymentMethodAdded: true
        };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error updating user in localStorage:', error);
    }
    
    if (onUpgrade && selectedPlan) {
      onUpgrade(selectedPlan);
    }
    
    // Redirect to dashboard
    window.location.hash = '#dashboard';
  };

  const handleCheckoutCancel = () => {
    setShowCheckout(false);
    setSelectedPlan(null);
  };

  // If showing checkout, render the payment form
  if (showCheckout && selectedPlan) {
    const planConfig = plans.find(p => p.id === selectedPlan);
    const amount = selectedPlan === 'starter' ? 2900 : selectedPlan === 'professional' ? 9900 : 29900;

    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {checkoutType === 'trial' ? 'Start Your Free Trial' : 'Complete Your Purchase'}
            </h1>
            <p className="text-lg text-gray-600">
              {planConfig?.name} Plan - {planConfig?.price}/month
            </p>
          </div>

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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          {isLiveMode && <LiveModeIndicator variant="warning" className="mb-8 mx-auto max-w-3xl" />}
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Choose Your AI Optimization Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Unlock the power of AI-driven content optimization with plans designed to scale with your business needs
          </p>
          
          {/* Trial Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <Gift className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">14-Day Free Trial</h3>
            </div>
            <p className="text-blue-800">
              Try any plan free for 14 days. No credit card required. Cancel anytime.
            </p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => {
            const IconComponent = plan.icon;
            const isCurrentPlan = currentPlan === plan.id;
            const isPopular = plan.popular;

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-xl border-2 transition-all duration-300 hover:shadow-2xl ${
                  isPopular
                    ? 'border-indigo-500 scale-105 ring-4 ring-indigo-100'
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
                  {/* Plan Header */}
                  <div className="text-center mb-8">
                    <div className={`flex items-center justify-center w-16 h-16 rounded-xl mx-auto mb-4 ${
                      isPopular 
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
                        : 'bg-gradient-to-br from-gray-600 to-gray-700'
                    }`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {plan.name}
                    </h3>

                    <div className="mb-4">
                      <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600 text-lg">{plan.period}</span>
                    </div>

                    <p className="text-gray-600 leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={() => handlePlanSelect(plan.id, 'trial')}
                      disabled={isCurrentPlan}
                      className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${
                        isCurrentPlan
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : isPopular
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                          : 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                      }`}
                    >
                      {isCurrentPlan ? 'Current Plan' : (
                        <div className="flex items-center justify-center space-x-2">
                          <Gift className="w-5 h-5" />
                          <span>{plan.buttonText}</span>
                        </div>
                      )}
                    </button>
                    
                    {!isCurrentPlan && (
                      <button
                        onClick={() => handlePlanSelect(plan.id, 'direct')}
                        className="w-full py-3 px-6 rounded-xl font-medium text-sm transition-all duration-300 bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <CreditCard className="w-4 h-4" />
                          <span>Skip Trial - Buy Now</span>
                        </div>
                      </button>
                    )}
                  </div>
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
                AEO is the practice of optimizing your content to appear in AI-powered search results from ChatGPT, Claude, Gemini, and other AI assistants. It's the next evolution of SEO for the AI age.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                How does the free trial work?
              </h3>
              <p className="text-gray-600">
                Our 14-day free trial gives you full access to all features with no credit card required. You can run unlimited analyses and test all features before deciding on a subscription.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Can I change plans later?
              </h3>
              <p className="text-gray-600">
                Absolutely! You can upgrade or downgrade your plan at any time. Upgrades take effect immediately, while downgrades apply at the end of your current billing cycle.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Do you offer refunds?
              </h3>
              <p className="text-gray-600">
                Yes, we offer a 30-day money-back guarantee if you're not satisfied with our service. Simply contact support within 30 days for a full refund.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                What AI models do you support?
              </h3>
              <p className="text-gray-600">
                We support GPT-4, Claude 3 (Haiku, Sonnet, Opus), and Perplexity models. Higher-tier plans get access to more advanced models for better analysis quality.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Is my data secure?
              </h3>
              <p className="text-gray-600">
                Yes, we use enterprise-grade security with encrypted data storage, secure API connections, and strict privacy controls. We never share your data with third parties.
              </p>
            </div>
          </div>
        </div>

        {/* Enterprise CTA */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Need a Custom Solution?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Our enterprise team can create custom implementations, provide dedicated support, and integrate with your existing workflows.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <button 
              onClick={() => {
                window.location.hash = '#contact';
              }}
              className="px-8 py-4 bg-white text-indigo-600 text-lg font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-lg"
            >
              Contact Sales Team
            </button>
            <div className="text-indigo-100 text-sm">
              <div>✓ Custom pricing available</div>
              <div>✓ Dedicated support included</div>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">No Setup Fees</h3>
              <p className="text-gray-600 text-sm">Get started immediately with no hidden costs or setup fees</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Secure Payments</h3>
              <p className="text-gray-600 text-sm">All payments processed securely through Stripe</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <ArrowRight className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Cancel Anytime</h3>
              <p className="text-gray-600 text-sm">No long-term contracts. Cancel your subscription anytime</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}