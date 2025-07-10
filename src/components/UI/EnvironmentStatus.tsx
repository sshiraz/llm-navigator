import React from 'react';

interface EnvironmentStatusProps {
  showDetails?: boolean;
  className?: string;
}

// Dummy implementation for now; will expand if needed
const EnvironmentStatus: React.FC<EnvironmentStatusProps> = ({ showDetails = false, className = '' }) => {
  return (
    <div className={`bg-white border rounded-lg p-4 shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Environment Configuration</h3>
      <div className="text-sm text-gray-700">This panel is only visible to admin users. Here you can display environment variable status, live/demo mode, and setup tips.</div>
      {showDetails && <div className="mt-2 text-xs text-gray-500">(Details would go here...)</div>}
    </div>
  );
};

export default EnvironmentStatus; 