import React from 'react';
import { User, Clock, Gift } from 'lucide-react';
import { User as UserType } from '../../types';
import { getTrialStatus } from '../../utils/mockData';

interface HeaderProps {
  user: UserType;
}

export default function Header({ user }: HeaderProps) {
  const trialStatus = getTrialStatus(user);

  return (
    <header className="bg-slate-900 border-b border-slate-700 px-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Welcome back, {user.name.split(' ')[0]}</h2>
          <p className="text-slate-400">Optimize your content for AI-powered search</p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Trial Status Banner */}
          {trialStatus && trialStatus.isActive && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-blue-900/50 border border-blue-700 rounded-lg">
              <Gift className="w-4 h-4 text-blue-400" />
              {trialStatus.daysRemaining > 0 ? (
                <span className="text-sm font-medium text-blue-200">
                  {trialStatus.daysRemaining === 1 ? '1 day' : `${trialStatus.daysRemaining} days`} left in trial
                </span>
              ) : (
                <span className="text-sm font-medium text-blue-200">
                  Trial ends today
                </span>
              )}
            </div>
          )}

          {trialStatus && !trialStatus.isActive && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-yellow-900/50 border border-yellow-700 rounded-lg">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-200">
                Trial expired - Upgrade now
              </span>
            </div>
          )}

          <div
            className="flex items-center space-x-3 cursor-pointer hover:bg-slate-800 rounded-lg p-2 transition-colors"
            onClick={() => window.location.hash = '#account'}
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
              {user.name.charAt(0)}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-slate-400">
                {user.subscription === 'trial' ? 'Trial' : user.subscription} plan
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}