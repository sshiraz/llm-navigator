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
      case 'success': return 'text-green-600 bg-green-50';
      case 'error': return 'text-red-600 bg-red-50';
      case 'test': return 'text-yellow-600 bg-yellow-50';
      case 'live': return 'text-blue-600 bg-blue-50';
      case 'neutral': return 'text-gray-600 bg-gray-50';
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
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Admin Environment Status</span>
        </div>
        {isStripeLive && (
          <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
            LIVE PAYMENTS
          </span>
        )}
        {isStripeTest && (
          <span className="px-2 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-700 rounded-full">
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
                <p className="text-xs text-gray-500">{item.label}</p>
                <div className="flex items-center space-x-1">
                  <p className="text-sm font-medium text-gray-900">{item.value}</p>
                  {getStatusIcon(item.status)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {showDetails && warnings.length > 0 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
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
