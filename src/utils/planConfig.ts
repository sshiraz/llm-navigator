import { Star, Zap, Crown } from 'lucide-react';

export interface PlanConfig {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  icon: any;
  features: string[];
  popular: boolean;
  buttonText: string;
  highlight?: boolean;
}

export const PLAN_CONFIGS: PlanConfig[] = [
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
    buttonText: 'Start Free Trial'
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
    buttonText: 'Start Free Trial'
  }
];

export const getPlanConfig = (planId: string): PlanConfig | undefined => {
  return PLAN_CONFIGS.find(plan => plan.id === planId);
};

export const getPlanPrice = (planId: string): number => {
  const plan = getPlanConfig(planId);
  if (!plan) return 0;
  
  return parseInt(plan.price.replace('$', ''));
};

export const getPlanAmount = (planId: string): number => {
  return getPlanPrice(planId) * 100; // Convert to cents for Stripe
};