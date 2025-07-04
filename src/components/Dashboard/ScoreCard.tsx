import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface ScoreCardProps {
  title: string;
  score: number;
  description: string;
  icon: LucideIcon;
  color: 'blue' | 'emerald' | 'indigo';
}

export default function ScoreCard({ title, score, description, icon: Icon, color }: ScoreCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    indigo: 'bg-indigo-50 text-indigo-600'
  };

  const scoreColorClasses = {
    blue: 'text-blue-600',
    emerald: 'text-emerald-600',
    indigo: 'text-indigo-600'
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      <div className="mb-2">
        <span className={`text-3xl font-bold ${scoreColorClasses[color]}`}>
          {score}
        </span>
      </div>
      
      <h3 className="text-sm font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}