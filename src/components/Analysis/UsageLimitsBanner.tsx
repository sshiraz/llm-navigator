import React from 'react';
import { AlertTriangle, Zap, TrendingUp, Clock, Gift } from 'lucide-react';
import { UsageLimits } from '../../utils/costTracker';

interface UsageLimitsBannerProps {
  usageLimits: UsageLimits;
  onUpgrade?: () => void;
}

export default function UsageLimitsBanner({ usageLimits, onUpgrade }: UsageLimitsBannerProps) {
  const usagePercentage = (usageLimits.currentUsage.analyses / usageLimits.monthlyAnalyses) * 100;
  const costPercentage = (usageLimits.currentUsage.cost / usageLimits.monthlyBudget) * 100;

  // Check if user is admin from localStorage
  const [isAdmin, setIsAdmin] = React.useState(false);
  
  React.useEffect(() => {
    try {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        setIsAdmin(user.isAdmin === true);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  }, []);
  
  // For demo accounts (free/trial) or admin users, show unlimited status
  const isUnlimited = usageLimits.plan === 'free' || usageLimits.plan === 'trial' || isAdmin;
  const isNearLimit = !isUnlimited && (usagePercentage > 80 || costPercentage > 80);
  const isAtLimit = !isUnlimited && (usagePercentage >= 100 || costPercentage >= 100);
  
  const resetDate = new Date(usageLimits.resetDate);
  const daysUntilReset = Math.ceil((resetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const getBannerColor = () => {
    if (isUnlimited) return 'bg-emerald-900/30 border-emerald-700';
    if (isAtLimit) return 'bg-red-900/30 border-red-700';
    if (isNearLimit) return 'bg-yellow-900/30 border-yellow-700';
    return 'bg-blue-900/30 border-blue-700';
  };

  const getIconColor = () => {
    if (isUnlimited) return 'text-emerald-400';
    if (isAtLimit) return 'text-red-400';
    if (isNearLimit) return 'text-yellow-400';
    return 'text-blue-400';
  };

  const getTextColor = () => {
    if (isUnlimited) return 'text-emerald-300';
    if (isAtLimit) return 'text-red-300';
    if (isNearLimit) return 'text-yellow-300';
    return 'text-blue-300';
  };

  if (isUnlimited) {
    return (
      <div className={`rounded-xl border-2 p-6 ${getBannerColor()}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-emerald-900/50 rounded-xl flex items-center justify-center">
              <Gift className={`w-6 h-6 ${getIconColor()}`} />
            </div>

            <div className="flex-1">
              <h3 className={`text-lg font-semibold ${getTextColor()} mb-2`}>
                {isAdmin ? '🔑 Admin Unlimited Access' : '🎉 Unlimited Demo Access'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Analyses Usage */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={getTextColor()}>Analyses Used</span>
                    <span className={`font-medium ${getTextColor()}`}>
                      {usageLimits.currentUsage.analyses} / ∞
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="h-2 bg-emerald-500 rounded-full w-1/4"></div>
                  </div>
                </div>

                {/* Cost Usage */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={getTextColor()}>Demo Budget</span>
                    <span className={`font-medium ${getTextColor()}`}>
                      ${usageLimits.currentUsage.cost.toFixed(2)} / ∞
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="h-2 bg-emerald-500 rounded-full w-1/4"></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Zap className={`w-4 h-4 ${getIconColor()}`} />
                  <span className={getTextColor()}>
                    Unlimited analyses for demo
                  </span>
                </div>

                {usageLimits.currentUsage.tokens > 0 && (
                  <div className={`${getTextColor()}`}>
                    {usageLimits.currentUsage.tokens.toLocaleString()} tokens used
                  </div>
                )}
              </div>
            </div>
          </div>

          {onUpgrade && (
            <button
              onClick={onUpgrade}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium transition-colors hover:bg-emerald-700"
            >
              Upgrade for More
            </button>
          )}
        </div>

        <div className="mt-4 p-3 bg-slate-800 border border-emerald-700 rounded-lg">
          <p className="text-sm text-emerald-300">
            <strong>Demo Mode:</strong> Experience unlimited analyses to test our platform.
            Upgrade to any paid plan for advanced features like real-time crawling, competitor intelligence, and team collaboration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border-2 p-6 ${getBannerColor()}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isAtLimit ? 'bg-red-900/50' : isNearLimit ? 'bg-yellow-900/50' : 'bg-blue-900/50'
          }`}>
            {isAtLimit ? (
              <AlertTriangle className={`w-6 h-6 ${getIconColor()}`} />
            ) : isNearLimit ? (
              <TrendingUp className={`w-6 h-6 ${getIconColor()}`} />
            ) : (
              <Zap className={`w-6 h-6 ${getIconColor()}`} />
            )}
          </div>

          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${getTextColor()} mb-2`}>
              {isAtLimit
                ? 'Usage Limit Reached'
                : isNearLimit
                ? 'Approaching Usage Limit'
                : `${usageLimits.plan} Plan Usage`
              }
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Analyses Usage */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className={getTextColor()}>Analyses Used</span>
                  <span className={`font-medium ${getTextColor()}`}>
                    {usageLimits.currentUsage.analyses} / {usageLimits.monthlyAnalyses}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Cost Usage */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className={getTextColor()}>API Budget Used</span>
                  <span className={`font-medium ${getTextColor()}`}>
                    ${usageLimits.currentUsage.cost.toFixed(2)} / ${usageLimits.monthlyBudget.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(costPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <Clock className={`w-4 h-4 ${getIconColor()}`} />
                <span className={getTextColor()}>
                  Resets in {daysUntilReset} day{daysUntilReset !== 1 ? 's' : ''}
                </span>
              </div>

              {usageLimits.currentUsage.tokens > 0 && (
                <div className={getTextColor()}>
                  {usageLimits.currentUsage.tokens.toLocaleString()} tokens used
                </div>
              )}
            </div>
          </div>
        </div>

        {(isNearLimit || isAtLimit) && onUpgrade && (
          <button
            onClick={onUpgrade}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isAtLimit
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-yellow-600 text-white hover:bg-yellow-700'
            }`}
          >
            {isAtLimit ? 'Upgrade Now' : 'Upgrade Plan'}
          </button>
        )}
      </div>

      {isAtLimit && (
        <div className="mt-4 p-3 bg-slate-800 border border-red-700 rounded-lg">
          <p className="text-sm text-red-300">
            <strong>Analysis blocked:</strong> You've reached your monthly limit.
            Upgrade your plan to continue analyzing websites or wait for your limits to reset.
          </p>
        </div>
      )}
    </div>
  );
}