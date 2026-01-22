import React, { useState, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { FreeReportLead, User } from '../../types';

interface SignupAnalyticsProps {
  leads: FreeReportLead[];
  users: User[];
  title?: string;
}

export default function SignupAnalytics({ leads, users, title = 'Signup Trends' }: SignupAnalyticsProps) {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');

  const dailyStats = useMemo(() => {
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const now = new Date();
    const result: { date: string; dateLabel: string; leads: number; signups: number }[] = [];

    // Initialize all days
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const dateLabel = timeframe === '7d'
        ? date.toLocaleDateString('en-US', { weekday: 'short' })
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      result.push({
        date: dateKey,
        dateLabel,
        leads: 0,
        signups: 0
      });
    }

    // Count leads per day
    leads.forEach(lead => {
      const dateKey = new Date(lead.created_at).toISOString().split('T')[0];
      const dayData = result.find(d => d.date === dateKey);
      if (dayData) {
        dayData.leads++;
      }
    });

    // Count signups per day
    users.forEach(user => {
      if (user.createdAt) {
        const dateKey = new Date(user.createdAt).toISOString().split('T')[0];
        const dayData = result.find(d => d.date === dateKey);
        if (dayData) {
          dayData.signups++;
        }
      }
    });

    return result;
  }, [leads, users, timeframe]);

  const maxValue = useMemo(() => {
    return Math.max(
      ...dailyStats.map(d => Math.max(d.leads, d.signups)),
      1 // Prevent division by zero
    );
  }, [dailyStats]);

  const totals = useMemo(() => {
    return dailyStats.reduce(
      (acc, d) => ({
        leads: acc.leads + d.leads,
        signups: acc.signups + d.signups
      }),
      { leads: 0, signups: 0 }
    );
  }, [dailyStats]);

  // For 30d and 90d, show weekly aggregates instead of daily
  const displayStats = useMemo(() => {
    if (timeframe === '7d') {
      return dailyStats;
    }

    // Aggregate by week for longer timeframes
    const weeklyStats: typeof dailyStats = [];
    const weeksCount = timeframe === '30d' ? 4 : 12;

    for (let i = 0; i < weeksCount; i++) {
      const startIdx = i * 7;
      const endIdx = Math.min(startIdx + 7, dailyStats.length);
      const weekData = dailyStats.slice(startIdx, endIdx);

      if (weekData.length > 0) {
        const firstDate = new Date(weekData[0].date);
        weeklyStats.push({
          date: weekData[0].date,
          dateLabel: firstDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          leads: weekData.reduce((sum, d) => sum + d.leads, 0),
          signups: weekData.reduce((sum, d) => sum + d.signups, 0)
        });
      }
    }

    return weeklyStats;
  }, [dailyStats, timeframe]);

  const displayMaxValue = useMemo(() => {
    return Math.max(
      ...displayStats.map(d => Math.max(d.leads, d.signups)),
      1
    );
  }, [displayStats]);

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-6 h-6 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>

        <div className="flex items-center space-x-4">
          {/* Totals */}
          <div className="flex items-center space-x-4 text-sm">
            {leads.length > 0 && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-slate-400">Leads: <span className="text-white font-medium">{totals.leads}</span></span>
              </div>
            )}
            {users.length > 0 && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-slate-400">Signups: <span className="text-white font-medium">{totals.signups}</span></span>
              </div>
            )}
          </div>

          {/* Timeframe selector */}
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as typeof timeframe)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-1">
        {displayStats.map((stat) => (
          <div key={stat.date} className="flex items-center space-x-3 group">
            <span className="text-xs text-slate-500 w-16 text-right shrink-0">
              {stat.dateLabel}
            </span>

            <div className="flex-1 flex items-center space-x-2 h-6">
              {/* Leads bar */}
              {leads.length > 0 && (
                <div className="flex-1 h-full flex items-center">
                  <div
                    className="h-4 bg-blue-500/80 rounded-sm transition-all duration-300 group-hover:bg-blue-400"
                    style={{
                      width: displayMaxValue > 0 ? `${(stat.leads / displayMaxValue) * 100}%` : '0%',
                      minWidth: stat.leads > 0 ? '4px' : '0'
                    }}
                  />
                </div>
              )}

              {/* Signups bar */}
              {users.length > 0 && (
                <div className="flex-1 h-full flex items-center">
                  <div
                    className="h-4 bg-green-500/80 rounded-sm transition-all duration-300 group-hover:bg-green-400"
                    style={{
                      width: displayMaxValue > 0 ? `${(stat.signups / displayMaxValue) * 100}%` : '0%',
                      minWidth: stat.signups > 0 ? '4px' : '0'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Values */}
            <div className="flex items-center space-x-2 w-20 shrink-0">
              {leads.length > 0 && (
                <span className="text-xs text-blue-400 w-8 text-right">{stat.leads > 0 ? stat.leads : '-'}</span>
              )}
              {users.length > 0 && (
                <span className="text-xs text-green-400 w-8 text-right">{stat.signups > 0 ? stat.signups : '-'}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {displayStats.every(d => d.leads === 0 && d.signups === 0) && (
        <div className="text-center py-8 text-slate-500">
          No data for this time period
        </div>
      )}
    </div>
  );
}
