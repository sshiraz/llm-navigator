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
      'Website crawling & schema detection',
      'AI citation tracking',
      '1 competitor per analysis',
      'AEO recommendations',
      'Analysis history',
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
      'Website crawling & schema detection',
      'AI citation tracking',
      '3 competitors per analysis',
      'AEO recommendations',
      'Analysis history',
      'Priority email support',
      'Branded PDF reports'
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
      '400 AI analyses per month',
      'Website crawling & schema detection',
      'AI citation tracking',
      'Unlimited competitors per analysis',
      'AEO recommendations',
      'Analysis history',
      'Priority email support',
      'Branded PDF reports',
      'API access',
      'Visual trend charts (coming soon)',
      'Scheduled analyses (coming soon)'
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