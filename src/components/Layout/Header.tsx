import React from 'react';
import { Bell, Settings, User, Clock, Gift } from 'lucide-react';
import { User as UserType } from '../../types';
import { getTrialStatus } from '../../utils/mockData';

interface HeaderProps {
  user: UserType;
}

export default function Header({ user }: HeaderProps) {
  const trialStatus = getTrialStatus(user);

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user.name.split(' ')[0]}</h2>
          <p className="text-gray-600">Optimize your content for AI-powered search</p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Trial Status Banner */}
          {trialStatus && trialStatus.isActive && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <Gift className="w-4 h-4 text-blue-600" />
              {trialStatus.daysRemaining > 0 ? (
                <span className="text-sm font-medium text-blue-900">
                  {trialStatus.daysRemaining === 1 ? '1 day' : `${trialStatus.daysRemaining} days`} left in trial
                </span>
              ) : (
                <span className="text-sm font-medium text-blue-900">
                  Trial ends today
                </span>
              )}
            </div>
          )}

          {trialStatus && !trialStatus.isActive && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-900">
                Trial expired - Upgrade now
              </span>
            </div>
          )}

          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
              {user.name.charAt(0)}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">
                {user.subscription === 'trial' ? 'Trial' : user.subscription} plan
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}