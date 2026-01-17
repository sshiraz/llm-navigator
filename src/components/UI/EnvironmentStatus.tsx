import React from 'react';
import { Shield, CreditCard, Database, AlertTriangle, CheckCircle, Server } from 'lucide-react';

interface EnvironmentStatusProps {
  showDetails?: boolean;
  className?: string;
}

const EnvironmentStatus: React.FC<EnvironmentStatusProps> = ({ showDetails = false, className = '' }) => {
  // Check environment variables
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  const isDev = import.meta.env.DEV;

  // Determine Stripe mode
  const isStripeConfigured = stripeKey.length > 0;
  const isStripeLive = stripeKey.startsWith('pk_live_');
  const isStripeTest = stripeKey.startsWith('pk_test_');

  // Determine Supabase status
  const isSupabaseConfigured = supabaseUrl.length > 0 && supabaseKey.length > 0;

  // Status items
  const statusItems = [
    {
      label: 'Environment',
      value: isDev ? 'Development' : 'Production',
      icon: Server,
      status: 'neutral' as const,
    },
    {
      label: 'Stripe',
      value: !isStripeConfigured
        ? 'Not Configured'
        : isStripeLive
          ? 'Live Mode'
          : isStripeTest
            ? 'Test Mode'
            : 'Invalid Key',
      icon: CreditCard,
      status: !isStripeConfigured
        ? 'error' as const
        : isStripeLive
          ? 'live' as const
          : 'test' as const,
    },
    {
      label: 'Database',
      value: isSupabaseConfigured ? 'Connected' : 'Not Configured',
      icon: Database,
      status: isSupabaseConfigured ? 'success' as const : 'error' as const,
    },
  ];

  const getStatusColor = (status: 'success' | 'error' | 'test' | 'live' | 'neutral') => {
    switch (status) {
      case 'success': return 'text-green-400 bg-green-900/30';
      case 'error': return 'text-red-400 bg-red-900/30';
      case 'test': return 'text-yellow-400 bg-yellow-900/30';
      case 'live': return 'text-blue-400 bg-blue-900/30';
      case 'neutral': return 'text-slate-400 bg-slate-700';
    }
  };

  const getStatusIcon = (status: 'success' | 'error' | 'test' | 'live' | 'neutral') => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      case 'test': return <Shield className="w-4 h-4" />;
      case 'live': return <CheckCircle className="w-4 h-4" />;
      case 'neutral': return null;
    }
  };

  // Warnings
  const warnings: string[] = [];
  if (!isStripeConfigured) {
    warnings.push('Stripe is not configured. Payments will not work.');
  } else if (isStripeLive && isDev) {
    warnings.push('Warning: Using LIVE Stripe keys in development mode.');
  }
  if (!isSupabaseConfigured) {
    warnings.push('Supabase is not configured. Data will not persist.');
  }

  return (
    <div className={`bg-slate-800/50 border border-slate-700 rounded-lg shadow-sm ${className}`}>
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-300">Admin Environment Status</span>
        </div>
        {isStripeLive && (
          <span className="px-2 py-0.5 text-xs font-semibold bg-blue-900/30 text-blue-400 rounded-full">
            LIVE PAYMENTS
          </span>
        )}
        {isStripeTest && (
          <span className="px-2 py-0.5 text-xs font-semibold bg-yellow-900/30 text-yellow-400 rounded-full">
            TEST MODE
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="grid grid-cols-3 gap-4">
          {statusItems.map((item) => (
            <div key={item.label} className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${getStatusColor(item.status)}`}>
                <item.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{item.label}</p>
                <div className="flex items-center space-x-1">
                  <p className="text-sm font-medium text-white">{item.value}</p>
                  {getStatusIcon(item.status)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {showDetails && warnings.length > 0 && (
          <div className="mt-4 p-3 bg-amber-900/30 border border-amber-700 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5" />
              <div className="text-sm text-amber-300">
                {warnings.map((warning, index) => (
                  <p key={index}>{warning}</p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnvironmentStatus;
