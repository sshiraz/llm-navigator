import React, { useState } from 'react';
import { HelpCircle, TrendingUp, ArrowUpRight, X, ExternalLink } from 'lucide-react';
import { Analysis } from '../../types';

interface MetricsBreakdownProps {
  analysis: Analysis;
  competitors?: Analysis[];
}

interface MetricInfo {
  key: keyof Analysis['metrics'];
  label: string;
  description: string;
  tooltip: string;
}

const metricsInfo: MetricInfo[] = [
  {
    key: 'contentClarity',
    label: 'Clarity',
    description: 'Content Clarity',
    tooltip: 'How clear and well-structured your content is for AI understanding. Measures readability, logical flow, and answer-focused formatting that helps LLMs extract key information.'
  },
  {
    key: 'semanticRichness',
    label: 'Richness',
    description: 'Semantic Richness',
    tooltip: 'The depth and breadth of semantic relationships in your content. Evaluates topic coverage, related concepts, and contextual connections that improve AI comprehension.'
  },
  {
    key: 'structuredData',
    label: 'Structure',
    description: 'Structured Data',
    tooltip: 'Implementation of schema markup and structured data formats. Helps AI systems understand your content hierarchy, relationships, and key data points more effectively.'
  },
  {
    key: 'naturalLanguage',
    label: 'Language',
    description: 'Natural Language',
    tooltip: 'How naturally your content reads and aligns with conversational queries. Measures question-answer format optimization and natural language patterns.'
  },
  {
    key: 'keywordRelevance',
    label: 'Relevance',
    description: 'Keyword Relevance',
    tooltip: 'How well your content matches target keywords and search intent. Evaluates semantic keyword usage and topical authority for your target terms.'
  }
];

export default function MetricsBreakdown({ analysis, competitors = [] }: MetricsBreakdownProps) {
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);
  const [selectedInsights, setSelectedInsights] = useState<Analysis | null>(null);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-emerald-50';
    if (score >= 60) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  const allAnalyses = [analysis, ...competitors];
  const isUserSite = (website: string) => website === analysis.website;

  const handleViewInsights = (analysisItem: Analysis) => {
    setSelectedInsights(analysisItem);
  };

  const handleReAnalyze = (analysisItem: Analysis) => {
    // Simulate re-analysis
    alert(`Re-analyzing ${analysisItem.website}... This would trigger a new analysis with the same keywords: ${analysisItem.keywords.join(', ')}`);
  };

  const generateDetailedInsights = (analysisItem: Analysis) => {
    const insights = [];
    
    // Content Clarity insights
    if (analysisItem.metrics.contentClarity >= 80) {
      insights.push("✅ Excellent content structure with clear headings and logical flow that AI models can easily parse and understand.");
    } else if (analysisItem.metrics.contentClarity >= 60) {
      insights.push("⚠️ Good content clarity but could benefit from better heading structure and more concise answer formats.");
    } else {
      insights.push("❌ Content clarity needs improvement. Consider restructuring with clear H1-H6 hierarchy and FAQ-style formatting.");
    }

    // Semantic Richness insights
    if (analysisItem.metrics.semanticRichness >= 80) {
      insights.push("✅ Rich semantic content with comprehensive topic coverage and strong contextual relationships.");
    } else if (analysisItem.metrics.semanticRichness >= 60) {
      insights.push("⚠️ Moderate semantic richness. Expand content to cover related topics and concepts more thoroughly.");
    } else {
      insights.push("❌ Limited semantic depth. Add more comprehensive content covering related topics, synonyms, and contextual information.");
    }

    // Structured Data insights
    if (analysisItem.metrics.structuredData >= 80) {
      insights.push("✅ Excellent structured data implementation with comprehensive schema markup helping AI understand content context.");
    } else if (analysisItem.metrics.structuredData >= 60) {
      insights.push("⚠️ Basic structured data present but could be expanded with more schema types (FAQ, HowTo, Product, etc.).");
    } else {
      insights.push("❌ Missing or minimal structured data. Implement schema markup for Organization, FAQ, Product, and other relevant types.");
    }

    // Natural Language insights
    if (analysisItem.metrics.naturalLanguage >= 80) {
      insights.push("✅ Content reads naturally and aligns well with conversational AI queries and voice search patterns.");
    } else if (analysisItem.metrics.naturalLanguage >= 60) {
      insights.push("⚠️ Generally natural language but could be optimized for more conversational query patterns.");
    } else {
      insights.push("❌ Content feels too formal or technical. Rewrite in a more conversational tone that matches how people ask AI assistants questions.");
    }

    // Keyword Relevance insights
    if (analysisItem.metrics.keywordRelevance >= 80) {
      insights.push("✅ Strong keyword relevance with natural integration and good semantic keyword usage throughout content.");
    } else if (analysisItem.metrics.keywordRelevance >= 60) {
      insights.push("⚠️ Decent keyword usage but could improve semantic variations and long-tail keyword coverage.");
    } else {
      insights.push("❌ Weak keyword relevance. Better integrate target keywords naturally and add semantic variations and related terms.");
    }

    return insights;
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-900 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Performance Snapshot</span>
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">PRO</span>
              </h3>
              <p className="text-gray-300 text-sm mt-1">
                Compare your latest analysis with competitors. Click 'View Insights' to see actionable recommendations.
              </p>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                  Website & Keywords
                </th>
                <th className="px-4 py-4 text-center text-sm font-medium text-gray-700">
                  Overall
                </th>
                {metricsInfo.map((metric) => (
                  <th 
                    key={metric.key}
                    className="px-4 py-4 text-center text-sm font-medium text-gray-700 relative"
                    onMouseEnter={() => setHoveredMetric(metric.key)}
                    onMouseLeave={() => setHoveredMetric(null)}
                  >
                    <div className="flex items-center justify-center space-x-1 cursor-help">
                      <span>{metric.label}</span>
                      <HelpCircle className="w-3 h-3 text-gray-400" />
                    </div>
                    
                    {/* Tooltip */}
                    {hoveredMetric === metric.key && (
                      <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                        <div className="font-medium mb-1">{metric.description}</div>
                        <div className="text-gray-300">{metric.tooltip}</div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    )}
                  </th>
                ))}
                <th className="px-6 py-4 text-center text-sm font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allAnalyses.map((analysisItem) => {
                const isUser = isUserSite(analysisItem.website);
                
                return (
                  <tr 
                    key={analysisItem.id} 
                    className={`${isUser ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'} transition-colors`}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {analysisItem.website}
                          </span>
                          {isUser && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              (You)
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-blue-600">
                          Keywords: {analysisItem.keywords.join(', ')}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-4 py-4 text-center">
                      <div className={`inline-flex items-center justify-center w-12 h-8 rounded text-sm font-bold ${getScoreBackground(analysisItem.score)} ${getScoreColor(analysisItem.score)}`}>
                        {analysisItem.score}
                      </div>
                    </td>
                    
                    {metricsInfo.map((metric) => {
                      const score = analysisItem.metrics[metric.key];
                      return (
                        <td key={metric.key} className="px-4 py-4 text-center">
                          <div className={`inline-flex items-center justify-center w-12 h-8 rounded text-sm font-bold ${getScoreBackground(score)} ${getScoreColor(score)}`}>
                            {score}
                          </div>
                        </td>
                      );
                    })}
                    
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button 
                          onClick={() => handleViewInsights(analysisItem)}
                          className="flex items-center space-x-1 px-3 py-1 bg-gray-900 text-white text-xs rounded hover:bg-gray-800 transition-colors"
                        >
                          <TrendingUp className="w-3 h-3" />
                          <span>View Insights</span>
                        </button>
                        <button 
                          onClick={() => handleReAnalyze(analysisItem)}
                          className="flex items-center space-x-1 px-3 py-1 border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50 transition-colors"
                        >
                          <ArrowUpRight className="w-3 h-3" />
                          <span>Re-analyze</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Add Competitor Section */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Add Competitor Analysis</h4>
              <p className="text-xs text-gray-600">Compare against industry leaders</p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="www.competitor.com"
                className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                Add Competitor
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Insights Modal */}
      {selectedInsights && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Detailed Analysis Insights</h2>
                <p className="text-gray-600 mt-1">{selectedInsights.website}</p>
              </div>
              <button
                onClick={() => setSelectedInsights(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Overview */}
              <div className="mb-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${getScoreColor(selectedInsights.score)}`}>
                      {selectedInsights.score}
                    </div>
                    <div className="text-sm text-gray-500">Overall Score</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-2">Keywords: {selectedInsights.keywords.join(', ')}</div>
                    <div className="text-sm text-gray-600">Predicted Rank: #{selectedInsights.predictedRank}</div>
                  </div>
                </div>
              </div>

              {/* Metrics Breakdown */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Metrics Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {metricsInfo.map((metric) => {
                    const score = selectedInsights.metrics[metric.key];
                    return (
                      <div key={metric.key} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{metric.description}</span>
                          <span className={`text-lg font-bold ${getScoreColor(score)}`}>
                            {score}/100
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${score}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">{metric.tooltip}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Insights */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Generated Insights</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-gray-700">{selectedInsights.insights}</p>
                </div>
              </div>

              {/* Detailed Insights */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Analysis</h3>
                <div className="space-y-3">
                  {generateDetailedInsights(selectedInsights).map((insight, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              {selectedInsights.recommendations && selectedInsights.recommendations.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
                  <div className="space-y-3">
                    {selectedInsights.recommendations.map((rec, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{rec.title}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                            rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {rec.priority} priority
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Difficulty: {rec.difficulty}</span>
                          <span>Time: {rec.estimatedTime}</span>
                          <span>Impact: +{rec.expectedImpact} points</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleReAnalyze(selectedInsights)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Re-analyze Website</span>
                </button>
                <button
                  onClick={() => {
                    const url = `https://${selectedInsights.website}`;
                    window.open(url, '_blank');
                  }}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Visit Website</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}