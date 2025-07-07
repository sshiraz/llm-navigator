import React from 'react';
import { isLiveMode } from '../../utils/liveMode';

export default function LiveModeBanner() {
  if (!isLiveMode) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-1 z-50">
      <strong>🔴 LIVE MODE</strong> - Real credit cards will be charged
    </div>
  );
}