import React from 'react';
import { CheckCircle } from 'lucide-react';

interface PlanFeaturesProps {
  plan: string;
  className?: string;
}

export default function PlanFeatures({ plan, className = '' }: PlanFeaturesProps) {
  return (
    <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
      <h4 className="font-medium text-gray-900 mb-3">What's included:</h4>
      <div className="space-y-2 text-sm">
        {plan === 'starter' && (
          <>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>10 analyses per month</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>3 projects</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Real website crawling</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Email support</span>
            </div>
          </>
        )}
        {plan === 'professional' && (
          <>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>50 analyses per month</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Unlimited projects</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Competitor strategy reports</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Priority support</span>
            </div>
          </>
        )}
        {plan === 'enterprise' && (
          <>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>1,000 analyses per month</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>White-label reports & custom branding</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Premium performance metrics</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Priority email support</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Unlimited historical data retention</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Access to all AI models</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}