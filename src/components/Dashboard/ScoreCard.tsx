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
    blue: 'bg-blue-900/50 text-blue-400',
    emerald: 'bg-emerald-900/50 text-emerald-400',
    indigo: 'bg-indigo-900/50 text-indigo-400'
  };

  const scoreColorClasses = {
    blue: 'text-blue-400',
    emerald: 'text-emerald-400',
    indigo: 'text-indigo-400'
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
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

      <h3 className="text-sm font-medium text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-400">{description}</p>
    </div>
  );
}