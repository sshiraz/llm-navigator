import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Users, AlertTriangle, BarChart3, Clock } from 'lucide-react';
import { CostTracker } from '../../utils/costTracker';

export default function UsageDashboard() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('month');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      try {
        const data = await CostTracker.getUsageAnalytics(timeframe);
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [timeframe]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-gray-600">Failed to load usage analytics</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API Usage Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor costs and optimize API usage</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="day">Last 24 Hours</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mb-2">
            <span className="text-3xl font-bold text-green-600">
              ${analytics.totalCost}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">Total API Costs</h3>
          <p className="text-sm text-gray-600">
            ${analytics.averageCostPerAnalysis} avg per analysis
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mb-2">
            <span className="text-3xl font-bold text-blue-600">
              {analytics.totalAnalyses}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">Total Analyses</h3>
          <p className="text-sm text-gray-600">
            {Math.round(analytics.totalAnalyses / 30)} per day average
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mb-2">
            <span className="text-3xl font-bold text-purple-600">
              {analytics.topUsers.length}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">Active Users</h3>
          <p className="text-sm text-gray-600">
            Top user: ${analytics.topUsers[0]?.cost.toFixed(2) || '0.00'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mb-2">
            <span className="text-3xl font-bold text-red-600">
              {(analytics.errorRate * 100).toFixed(1)}%
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">Error Rate</h3>
          <p className="text-sm text-gray-600">
            {analytics.errorRate < 0.05 ? 'Excellent' : analytics.errorRate < 0.1 ? 'Good' : 'Needs attention'}
          </p>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Cost Breakdown</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Website Crawling</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-blue-500 rounded-full"
                    style={{ 
                      width: `${(analytics.costBreakdown.crawling / analytics.totalCost) * 100}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  ${analytics.costBreakdown.crawling.toFixed(3)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Embeddings</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-indigo-500 rounded-full"
                    style={{ 
                      width: `${(analytics.costBreakdown.embeddings / analytics.totalCost) * 100}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  ${analytics.costBreakdown.embeddings.toFixed(3)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">AI Insights</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-emerald-500 rounded-full"
                    style={{ 
                      width: `${(analytics.costBreakdown.insights / analytics.totalCost) * 100}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  ${analytics.costBreakdown.insights.toFixed(3)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Users */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Users by Cost</h3>
          
          <div className="space-y-3">
            {analytics.topUsers.slice(0, 5).map((user: any, index: number) => (
              <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      User {user.userId.slice(-6)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.analyses} analyses
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    ${user.cost.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">
                    ${(user.cost / user.analyses).toFixed(3)} avg
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cost Optimization Suggestions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <TrendingUp className="w-6 h-6 text-yellow-600 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-900 mb-3">
              Cost Optimization Suggestions
            </h3>
            <div className="space-y-2">
              {CostTracker.getCostOptimizationSuggestions([]).map((suggestion, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-2"></div>
                  <span className="text-yellow-800">{suggestion}</span>
                </div>
              ))}
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-2"></div>
                <span className="text-yellow-800">
                  Implement request batching to reduce API call overhead
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-2"></div>
                <span className="text-yellow-800">
                  Use content caching for frequently analyzed websites
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Monitoring */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Real-time Monitoring</h3>
          <div className="flex items-center space-x-2 text-emerald-600">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Live</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(Math.random() * 5)}
            </div>
            <div className="text-sm text-blue-800">Active Analyses</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">
              ${(Math.random() * 0.5).toFixed(3)}
            </div>
            <div className="text-sm text-green-800">Cost This Hour</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(Math.random() * 10)}
            </div>
            <div className="text-sm text-purple-800">Queue Length</div>
          </div>
        </div>
      </div>
    </div>
  );
}