import React, { useState, useEffect } from 'react';
import { History, TrendingUp, TrendingDown, Minus, Calendar, Globe, MessageSquare, ChevronRight, Filter, RefreshCw } from 'lucide-react';
import { Analysis, User } from '../../types';
import { AnalysisService } from '../../services/analysisService';

interface AnalysisHistoryProps {
  user: User;
  onViewAnalysis: (analysis: Analysis) => void;
}

export default function AnalysisHistory({ user, onViewAnalysis }: AnalysisHistoryProps) {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterWebsite, setFilterWebsite] = useState<string>('all');
  const [uniqueWebsites, setUniqueWebsites] = useState<string[]>([]);

  useEffect(() => {
    loadAnalyses();
  }, [user.id]);

  const loadAnalyses = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await AnalysisService.getUserAnalyses(user.id, 100);
      if (result.success && result.data) {
        setAnalyses(result.data);
        // Extract unique websites
        const websites = [...new Set(result.data.map(a => a.website))];
        setUniqueWebsites(websites);
      } else {
        setError(result.error || 'Failed to load analyses');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load analyses');
    } finally {
      setLoading(false);
    }
  };

  const filteredAnalyses = filterWebsite === 'all'
    ? analyses
    : analyses.filter(a => a.website === filterWebsite);

  // Group analyses by website for trend calculation
  const getWebsiteTrend = (website: string): { trend: 'up' | 'down' | 'stable'; change: number } => {
    const websiteAnalyses = analyses
      .filter(a => a.website === website)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (websiteAnalyses.length < 2) {
      return { trend: 'stable', change: 0 };
    }

    const latest = websiteAnalyses[0].score;
    const previous = websiteAnalyses[1].score;
    const change = latest - previous;

    if (change > 5) return { trend: 'up', change };
    if (change < -5) return { trend: 'down', change };
    return { trend: 'stable', change };
  };

  // Calculate overall stats
  const stats = {
    totalAnalyses: analyses.length,
    avgCitationRate: analyses.length > 0
      ? Math.round(analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length)
      : 0,
    websitesTracked: uniqueWebsites.length,
    latestAnalysis: analyses.length > 0 ? analyses[0] : null
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 50) return 'text-emerald-600';
    if (score >= 25) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 50) return 'bg-emerald-100';
    if (score >= 25) return 'bg-amber-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3 text-gray-500">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Loading analysis history...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <History className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Analysis History</h1>
        </div>
        <p className="text-gray-600">Track your AI citation performance over time</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-sm text-gray-500 mb-1">Total Analyses</div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalAnalyses}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-sm text-gray-500 mb-1">Avg Citation Rate</div>
          <div className={`text-3xl font-bold ${getScoreColor(stats.avgCitationRate)}`}>
            {stats.avgCitationRate}%
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-sm text-gray-500 mb-1">Websites Tracked</div>
          <div className="text-3xl font-bold text-gray-900">{stats.websitesTracked}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-sm text-gray-500 mb-1">Last Analysis</div>
          <div className="text-lg font-medium text-gray-900">
            {stats.latestAnalysis
              ? new Date(stats.latestAnalysis.createdAt).toLocaleDateString()
              : 'Never'}
          </div>
        </div>
      </div>

      {/* Trend Summary by Website */}
      {uniqueWebsites.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Website Trends</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uniqueWebsites.slice(0, 6).map(website => {
              const trend = getWebsiteTrend(website);
              const latestAnalysis = analyses.find(a => a.website === website);

              return (
                <div
                  key={website}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setFilterWebsite(website)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{website}</div>
                    <div className="text-sm text-gray-500">
                      {latestAnalysis?.score || 0}% citation rate
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {trend.trend === 'up' && (
                      <div className="flex items-center text-emerald-600">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm ml-1">+{trend.change}</span>
                      </div>
                    )}
                    {trend.trend === 'down' && (
                      <div className="flex items-center text-red-600">
                        <TrendingDown className="w-4 h-4" />
                        <span className="text-sm ml-1">{trend.change}</span>
                      </div>
                    )}
                    {trend.trend === 'stable' && (
                      <div className="flex items-center text-gray-400">
                        <Minus className="w-4 h-4" />
                        <span className="text-sm ml-1">0</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterWebsite}
            onChange={(e) => setFilterWebsite(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Websites</option>
            {uniqueWebsites.map(website => (
              <option key={website} value={website}>{website}</option>
            ))}
          </select>
        </div>
        <button
          onClick={loadAnalyses}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Analysis List */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {filteredAnalyses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No analyses yet</h3>
          <p className="text-gray-500 mb-4">
            Run your first analysis to start tracking your AI citation performance.
          </p>
          <button
            onClick={() => window.location.hash = 'new-analysis'}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            New Analysis
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredAnalyses.map((analysis) => {
              const isAEO = analysis.category === 'Answer Engine Optimization';

              return (
                <div
                  key={analysis.id}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onViewAnalysis(analysis)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <Globe className="w-5 h-5 text-gray-400" />
                        <span className="font-medium text-gray-900">{analysis.website}</span>
                        {analysis.isSimulated && (
                          <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                            Demo
                          </span>
                        )}
                        {isAEO && (
                          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                            AEO
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(analysis.createdAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>
                            {isAEO
                              ? `${analysis.keywords.length} queries`
                              : `${analysis.keywords.length} keywords`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Citation Rate</div>
                        <div className={`text-2xl font-bold ${getScoreColor(analysis.score)}`}>
                          {analysis.score}%
                        </div>
                      </div>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getScoreBg(analysis.score)}`}>
                        <span className={`text-lg font-bold ${getScoreColor(analysis.score)}`}>
                          {analysis.score >= 50 ? 'A' : analysis.score >= 25 ? 'B' : 'C'}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
