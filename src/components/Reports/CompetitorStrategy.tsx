import React from 'react';
import { TrendingUp, Target, Zap, AlertTriangle, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { Analysis } from '../../types';

interface CompetitorStrategyProps {
  userAnalysis: Analysis;
  competitorAnalyses: Analysis[];
  onBack?: () => void;
}

export default function CompetitorStrategy({ userAnalysis, competitorAnalyses, onBack }: CompetitorStrategyProps) {
  const topCompetitor = competitorAnalyses.reduce((prev, current) => 
    (prev.score > current.score) ? prev : current
  );

  const getGapAnalysis = () => {
    const gaps = [];
    const userMetrics = userAnalysis.metrics;
    const topMetrics = topCompetitor.metrics;

    Object.keys(userMetrics).forEach(key => {
      const metricKey = key as keyof typeof userMetrics;
      const gap = topMetrics[metricKey] - userMetrics[metricKey];
      if (gap > 5) {
        gaps.push({
          metric: metricKey,
          gap,
          priority: gap > 15 ? 'high' : gap > 10 ? 'medium' : 'low'
        });
      }
    });

    return gaps.sort((a, b) => b.gap - a.gap);
  };

  const getOpportunities = () => {
    return [
      {
        title: 'Content Gap Opportunity',
        description: `${topCompetitor.website} covers topics you're missing. Target their weak semantic areas.`,
        impact: 'High',
        effort: 'Medium',
        timeframe: '2-4 weeks'
      },
      {
        title: 'Structured Data Advantage',
        description: 'Implement schema markup faster than competitors to gain AI preference.',
        impact: 'High',
        effort: 'Low',
        timeframe: '1-2 weeks'
      },
      {
        title: 'Natural Language Optimization',
        description: 'Optimize for conversational queries where competitors are weak.',
        impact: 'Medium',
        effort: 'Medium',
        timeframe: '3-4 weeks'
      }
    ];
  };

  const gaps = getGapAnalysis();
  const opportunities = getOpportunities();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High': return 'text-emerald-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="mb-4">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        )}
      </div>
      
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Competitor Strategy Report</h1>
        <p className="text-lg text-gray-600">
          Actionable insights to outrank your competition in AI-powered search
        </p>
      </div>

      {/* Competitive Landscape */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Competitive Landscape</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[userAnalysis, ...competitorAnalyses].map((analysis, index) => {
            const isUser = analysis.id === userAnalysis.id;
            const rank = index + 1;
            
            return (
              <div 
                key={analysis.id}
                className={`p-4 rounded-lg border-2 ${
                  isUser ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">
                    {analysis.website}
                    {isUser && <span className="text-blue-600 text-sm ml-2">(You)</span>}
                  </span>
                  <span className="text-2xl font-bold text-gray-900">#{rank}</span>
                </div>
                
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {analysis.score}
                  <span className="text-sm text-gray-500">/100</span>
                </div>
                
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Clarity:</span>
                    <span className="font-medium">{analysis.metrics.contentClarity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Structure:</span>
                    <span className="font-medium">{analysis.metrics.structuredData}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Relevance:</span>
                    <span className="font-medium">{analysis.metrics.keywordRelevance}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gap Analysis */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <AlertTriangle className="w-6 h-6 text-yellow-600" />
          <h2 className="text-xl font-semibold text-gray-900">Performance Gaps</h2>
        </div>
        
        <div className="space-y-4">
          {gaps.map((gap, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 capitalize">
                  {gap.metric.replace(/([A-Z])/g, ' $1').trim()}
                </h3>
                <p className="text-sm text-gray-600">
                  You're {gap.gap} points behind {topCompetitor.website}
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(gap.priority)}`}>
                  {gap.priority} priority
                </span>
                <span className="text-lg font-bold text-red-600">-{gap.gap}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strategic Opportunities */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Target className="w-6 h-6 text-emerald-600" />
          <h2 className="text-xl font-semibold text-gray-900">Strategic Opportunities</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((opportunity, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">{opportunity.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{opportunity.description}</p>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Impact:</span>
                  <span className={`font-medium ${getImpactColor(opportunity.impact)}`}>
                    {opportunity.impact}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Effort:</span>
                  <span className="font-medium text-gray-900">{opportunity.effort}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Timeframe:</span>
                  <span className="font-medium text-gray-900">{opportunity.timeframe}</span>
                </div>
              </div>
              
              <button className="w-full mt-4 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                View Strategy
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Action Plan */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <CheckCircle className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-blue-900">30-Day Action Plan</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-3">Week 1-2: Quick Wins</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <ArrowRight className="w-3 h-3 mt-1 text-blue-600" />
                <span>Implement basic schema markup</span>
              </li>
              <li className="flex items-start space-x-2">
                <ArrowRight className="w-3 h-3 mt-1 text-blue-600" />
                <span>Optimize page titles for AI queries</span>
              </li>
              <li className="flex items-start space-x-2">
                <ArrowRight className="w-3 h-3 mt-1 text-blue-600" />
                <span>Add FAQ sections to key pages</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-3">Week 3-4: Content Strategy</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <ArrowRight className="w-3 h-3 mt-1 text-blue-600" />
                <span>Create competitor gap content</span>
              </li>
              <li className="flex items-start space-x-2">
                <ArrowRight className="w-3 h-3 mt-1 text-blue-600" />
                <span>Enhance semantic keyword usage</span>
              </li>
              <li className="flex items-start space-x-2">
                <ArrowRight className="w-3 h-3 mt-1 text-blue-600" />
                <span>Improve content clarity scores</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-3">Ongoing: Monitor & Optimize</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <ArrowRight className="w-3 h-3 mt-1 text-blue-600" />
                <span>Weekly competitor analysis</span>
              </li>
              <li className="flex items-start space-x-2">
                <ArrowRight className="w-3 h-3 mt-1 text-blue-600" />
                <span>Track ranking improvements</span>
              </li>
              <li className="flex items-start space-x-2">
                <ArrowRight className="w-3 h-3 mt-1 text-blue-600" />
                <span>Adjust strategy based on results</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}