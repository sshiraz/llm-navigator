import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { isLiveMode } from '../../utils/liveMode';

interface LiveModeIndicatorProps {
  variant?: 'banner' | 'inline' | 'badge' | 'warning';
  className?: string;
}

export default function LiveModeIndicator({ variant = 'banner', className = '' }: LiveModeIndicatorProps) {
  if (!isLiveMode) return null;
  
  switch (variant) {
    case 'banner':
      return (
        <div className={`fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-1 z-50 ${className}`}>
          <strong>🔴 LIVE MODE</strong> - Real credit cards will be charged
        </div>
      );

    case 'inline':
      return (
        <div className={`bg-red-900/30 text-red-400 px-3 py-1 rounded-full text-sm font-medium inline-flex items-center ${className}`}>
          <span className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></span>
          LIVE MODE
        </div>
      );

    case 'badge':
      return (
        <span className={`ml-2 px-2 py-0.5 bg-red-900/30 text-red-400 text-xs rounded-full ${className}`}>
          LIVE MODE
        </span>
      );

    case 'warning':
      return (
        <div className={`bg-red-900/30 border-2 border-red-700 rounded-lg p-4 ${className}`}>
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-300 font-medium">
                🔴 LIVE MODE ACTIVE - Real credit cards will be charged
              </p>
              <p className="text-red-400 text-sm mt-1">
                You are using production Stripe keys. Any payments made will process real credit cards.
              </p>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}