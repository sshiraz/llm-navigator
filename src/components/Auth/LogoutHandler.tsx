import React, { useEffect } from 'react';
import { LogOut } from 'lucide-react';

interface LogoutHandlerProps {
  onLogout: () => void;
}

export default function LogoutHandler({ onLogout }: LogoutHandlerProps) {
  useEffect(() => {
    // Perform logout immediately when component mounts
    console.log('LogoutHandler: Performing logout');
    onLogout();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <LogOut className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Logging Out</h2>
        <p className="text-gray-600 mb-6">
          You are being signed out of your account...
        </p>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}