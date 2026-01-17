import React, { useState } from 'react';
import { HelpCircle, TrendingUp, TrendingDown, ArrowUpRight, X, ExternalLink, Minus } from 'lucide-react';
import { Analysis } from '../../types';

interface MetricsBreakdownProps {
  analysis: Analysis;
  competitors?: Analysis[];
  previousAnalysis?: Analysis | null;
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
    description: 'Brand Clarity',
    tooltip: 'Can AI quickly understand who you are and what you do? This measures how clearly your business is described, how consistent your messaging is, and whether you answer questions directly.'
  },
  {
    key: 'semanticRichness',
    label: 'Depth',
    description: 'Content Depth',
    tooltip: 'Is your content thorough enough to be trusted? AI prefers comprehensive information. This measures word count, topic coverage, and whether you explain things fully rather than superficially.'
  },
  {
    key: 'structuredData',
    label: 'Trust',
    description: 'Trust Signals',
    tooltip: 'Can AI verify your business exists? Schema markup (like Organization, FAQ, Product) helps AI confirm who you are. Without it, AI may not feel confident recommending you.'
  },
  {
    key: 'naturalLanguage',
    label: 'Quotable',
    description: 'Quotability',
    tooltip: 'Can AI safely quote your content? Clear, well-written sentences that are easy to read make it more likely AI will use your exact words in its answers.'
  },
  {
    key: 'keywordRelevance',
    label: 'Match',
    description: 'Topic Match',
    tooltip: 'Does your content match what people search for? This measures whether your target keywords appear in the right places (title, headings, content) so AI knows you\'re relevant.'
  }
];

export default function MetricsBreakdown({ analysis, competitors = [], previousAnalysis }: MetricsBreakdownProps) {
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);
  const [selectedInsights, setSelectedInsights] = useState<Analysis | null>(null);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-emerald-900/30';
    if (score >= 60) return 'bg-yellow-900/30';
    return 'bg-red-900/30';
  };

  // Calculate trend between current and previous score
  const getTrend = (current: number, previous: number | undefined): { change: number; direction: 'up' | 'down' | 'same' } => {
    if (previous === undefined) return { change: 0, direction: 'same' };
    const change = Math.round(current) - Math.round(previous);
    if (change > 0) return { change, direction: 'up' };
    if (change < 0) return { change: Math.abs(change), direction: 'down' };
    return { change: 0, direction: 'same' };
  };

  // Render trend indicator
  const renderTrend = (current: number, previous: number | undefined) => {
    const { change, direction } = getTrend(current, previous);
    if (direction === 'same' || change === 0) {
      return previousAnalysis ? (
        <span className="flex items-center text-gray-400 text-xs ml-1" title="No change from previous">
          <Minus className="w-3 h-3" />
        </span>
      ) : null;
    }
    if (direction === 'up') {
      return (
        <span className="flex items-center text-emerald-600 text-xs ml-1" title={`+${change} from previous`}>
          <TrendingUp className="w-3 h-3" />
          <span className="ml-0.5">+{change}</span>
        </span>
      );
    }
    return (
      <span className="flex items-center text-red-600 text-xs ml-1" title={`-${change} from previous`}>
        <TrendingDown className="w-3 h-3" />
        <span className="ml-0.5">-{change}</span>
      </span>
    );
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

    // Brand Clarity insights
    if (analysisItem.metrics.contentClarity >= 80) {
      insights.push("✅ Brand Clarity: AI can easily understand what your business does. Your content is well-organized with clear headings and direct answers.");
    } else if (analysisItem.metrics.contentClarity >= 60) {
      insights.push("⚠️ Brand Clarity: Your message is coming through, but could be clearer. Try putting your main point at the start of each section, not buried in paragraphs.");
    } else {
      insights.push("❌ Brand Clarity: AI may struggle to understand your business. Add a clear one-sentence description on every page explaining exactly what you offer.");
    }

    // Content Depth insights
    if (analysisItem.metrics.semanticRichness >= 80) {
      insights.push("✅ Content Depth: Your content is thorough and comprehensive. AI has enough information to confidently recommend you.");
    } else if (analysisItem.metrics.semanticRichness >= 60) {
      insights.push("⚠️ Content Depth: You have a good start, but your pages could use more detail. Consider adding examples, FAQs, or step-by-step explanations.");
    } else {
      insights.push("❌ Content Depth: Your pages are too thin. AI prefers detailed content (800+ words per page) that fully answers visitor questions.");
    }

    // Trust Signals insights
    if (analysisItem.metrics.structuredData >= 80) {
      insights.push("✅ Trust Signals: Great job with schema markup! AI can verify your business information and feels confident recommending you.");
    } else if (analysisItem.metrics.structuredData >= 60) {
      insights.push("⚠️ Trust Signals: You have some schema markup, but adding more (FAQ, Product, LocalBusiness) would help AI trust you more.");
    } else {
      insights.push("❌ Trust Signals: No schema markup found. This is like having no ID card - AI can't verify who you are. Add Organization schema at minimum.");
    }

    // Quotability insights
    if (analysisItem.metrics.naturalLanguage >= 80) {
      insights.push("✅ Quotability: Your writing is clear and easy to read. AI can confidently quote your content in its answers.");
    } else if (analysisItem.metrics.naturalLanguage >= 60) {
      insights.push("⚠️ Quotability: Your writing is okay, but some sentences are too long or complex. Shorter sentences (15-20 words) get quoted more.");
    } else {
      insights.push("❌ Quotability: Your content is hard to read. Simplify your language - if a sentence needs to be read twice, it's too complicated.");
    }

    // Topic Match insights
    if (analysisItem.metrics.keywordRelevance >= 80) {
      insights.push("✅ Topic Match: Your content clearly matches what people search for. Your keywords are in all the right places.");
    } else if (analysisItem.metrics.keywordRelevance >= 60) {
      insights.push("⚠️ Topic Match: You're on topic, but your main keywords should appear in your page title, H1 heading, and first paragraph.");
    } else {
      insights.push("❌ Topic Match: Your target keywords are missing from important places. Add them to your title, main heading, and meta description.");
    }

    return insights;
  };

  return (
    <>
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-700 bg-slate-800 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Performance Snapshot</span>
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">PRO</span>
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                {previousAnalysis ? (
                  <>Compare your latest analysis with competitors. <span className="text-emerald-400">Score trends show changes from your previous analysis.</span></>
                ) : (
                  <>Compare your latest analysis with competitors. Click 'View Insights' to see actionable recommendations.</>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">
                  {analysis.category === 'Answer Engine Optimization' ? 'Website & Queries' : 'Website & Keywords'}
                </th>
                <th className="px-4 py-4 text-center text-sm font-medium text-slate-300">
                  Overall
                </th>
                {metricsInfo.map((metric) => (
                  <th
                    key={metric.key}
                    className="px-4 py-4 text-center text-sm font-medium text-slate-300 relative"
                    onMouseEnter={() => setHoveredMetric(metric.key)}
                    onMouseLeave={() => setHoveredMetric(null)}
                  >
                    <div className="flex items-center justify-center space-x-1 cursor-help">
                      <span>{metric.label}</span>
                      <HelpCircle className="w-3 h-3 text-slate-500" />
                    </div>

                    {/* Tooltip */}
                    {hoveredMetric === metric.key && (
                      <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-lg border border-slate-700">
                        <div className="font-medium mb-1">{metric.description}</div>
                        <div className="text-slate-400">{metric.tooltip}</div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
                      </div>
                    )}
                  </th>
                ))}
                <th className="px-6 py-4 text-center text-sm font-medium text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-800/30 divide-y divide-slate-700">
              {allAnalyses.map((analysisItem) => {
                const isUser = isUserSite(analysisItem.website);

                return (
                  <tr
                    key={analysisItem.id}
                    className={`${isUser ? 'bg-blue-900/20 border-l-4 border-l-blue-500' : 'hover:bg-slate-700/50'} transition-colors`}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-white">
                            {analysisItem.website}
                          </span>
                          {isUser && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900/30 text-blue-400">
                              (You)
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-blue-400">
                          {analysisItem.category === 'Answer Engine Optimization' ? 'Query' : 'Keywords'}: {analysisItem.keywords.join(', ')}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <div className={`inline-flex items-center justify-center w-12 h-8 rounded text-sm font-bold ${getScoreBackground(analysisItem.score)} ${getScoreColor(analysisItem.score)}`}>
                          {analysisItem.score}
                        </div>
                        {isUser && renderTrend(analysisItem.score, previousAnalysis?.score)}
                      </div>
                    </td>

                    {metricsInfo.map((metric) => {
                      const score = analysisItem.metrics[metric.key];
                      const roundedScore = Math.round(score);
                      const previousScore = isUser && previousAnalysis ? previousAnalysis.metrics[metric.key] : undefined;
                      return (
                        <td key={metric.key} className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center">
                            <div className={`inline-flex items-center justify-center w-12 h-8 rounded text-sm font-bold ${getScoreBackground(roundedScore)} ${getScoreColor(roundedScore)}`}>
                              {roundedScore}
                            </div>
                            {isUser && renderTrend(score, previousScore)}
                          </div>
                        </td>
                      );
                    })}
                    
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleViewInsights(analysisItem)}
                          className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                        >
                          <TrendingUp className="w-3 h-3" />
                          <span>View Insights</span>
                        </button>
                        <button
                          onClick={() => handleReAnalyze(analysisItem)}
                          className="flex items-center space-x-1 px-3 py-1 border border-slate-600 text-slate-300 text-xs rounded hover:bg-slate-700 transition-colors"
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
        <div className="px-6 py-4 bg-slate-800 border-t border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-white">Add Competitor Analysis</h4>
              <p className="text-xs text-slate-400">Compare against industry leaders</p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="www.competitor.com"
                className="px-3 py-1 text-sm bg-slate-900 border border-slate-600 text-white placeholder-slate-500 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div>
                <h2 className="text-xl font-bold text-white">Detailed Analysis Insights</h2>
                <p className="text-slate-400 mt-1">{selectedInsights.website}</p>
              </div>
              <button
                onClick={() => setSelectedInsights(null)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
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
                    <div className="text-sm text-slate-400">Overall Score</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-slate-400 mb-2">{selectedInsights.category === 'Answer Engine Optimization' ? 'Query' : 'Keywords'}: {selectedInsights.keywords.join(', ')}</div>
                    <div className="text-sm text-slate-400">AI Confidence: <span className={selectedInsights.score >= 75 ? 'text-emerald-400 font-medium' : selectedInsights.score >= 50 ? 'text-amber-400 font-medium' : 'text-red-400 font-medium'}>{selectedInsights.score >= 75 ? 'High' : selectedInsights.score >= 50 ? 'Medium' : 'Low'}</span></div>
                  </div>
                </div>
              </div>

              {/* Metrics Breakdown */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Metrics Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {metricsInfo.map((metric) => {
                    const score = selectedInsights.metrics[metric.key];
                    return (
                      <div key={metric.key} className="p-4 border border-slate-700 rounded-lg bg-slate-800/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">{metric.description}</span>
                          <span className={`text-lg font-bold ${getScoreColor(score)}`}>
                            {score}/100
                          </span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${score}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">{metric.tooltip}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Insights */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">AI-Generated Insights</h3>
                <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-4">
                  <p className="text-slate-300">{selectedInsights.insights}</p>
                </div>
              </div>

              {/* Detailed Insights */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Detailed Analysis</h3>
                <div className="space-y-3">
                  {generateDetailedInsights(selectedInsights).map((insight, index) => (
                    <div key={index} className="p-3 bg-slate-700/50 rounded-lg">
                      <p className="text-sm text-slate-300">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Page Analysis - Shows crawl data */}
              {selectedInsights.crawlData && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Site Crawl Results
                    {selectedInsights.crawlData.pagesAnalyzed && selectedInsights.crawlData.pagesAnalyzed > 1 && (
                      <span className="ml-2 text-sm font-normal text-blue-400">
                        ({selectedInsights.crawlData.pagesAnalyzed} pages analyzed)
                      </span>
                    )}
                  </h3>

                  {/* Pages Analyzed - Multi-page crawl */}
                  {selectedInsights.crawlData.pages && selectedInsights.crawlData.pages.length > 1 && (
                    <div className="mb-4">
                      <span className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                        Pages Analyzed ({selectedInsights.crawlData.pages.length})
                      </span>
                      <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-800">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-slate-400">Page</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-slate-400">Words</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-slate-400">Headings</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-slate-400">Schema</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-slate-400">Issues</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700">
                            {selectedInsights.crawlData.pages.map((page, idx) => (
                              <tr key={idx} className={idx === 0 ? 'bg-blue-900/20' : 'hover:bg-slate-700/50'}>
                                <td className="px-3 py-2">
                                  <div className="flex items-center gap-2">
                                    {idx === 0 && (
                                      <span className="px-1.5 py-0.5 bg-blue-900/30 text-blue-400 text-xs rounded">Home</span>
                                    )}
                                    <span className="text-white truncate max-w-[200px]" title={page.url}>
                                      {page.title || new URL(page.url).pathname}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-center text-slate-400">{page.wordCount}</td>
                                <td className="px-3 py-2 text-center text-slate-400">{page.headingsCount}</td>
                                <td className="px-3 py-2 text-center">
                                  <span className={`px-1.5 py-0.5 rounded text-xs ${page.schemaCount > 0 ? 'bg-green-900/30 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                                    {page.schemaCount}
                                  </span>
                                </td>
                                <td className="px-3 py-2">
                                  {page.issues.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {page.issues.slice(0, 2).map((issue, i) => (
                                        <span key={i} className="px-1.5 py-0.5 bg-red-900/30 text-red-400 text-xs rounded truncate max-w-[100px]" title={issue}>
                                          {issue}
                                        </span>
                                      ))}
                                      {page.issues.length > 2 && (
                                        <span className="px-1.5 py-0.5 bg-slate-700 text-slate-400 text-xs rounded">
                                          +{page.issues.length - 2}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-green-400 text-xs">No issues</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Page Info */}
                  <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs font-medium text-slate-400 uppercase">Homepage URL</span>
                        <p className="text-sm text-white truncate">{selectedInsights.crawlData.url}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-slate-400 uppercase">Load Time</span>
                        <p className="text-sm text-white">{(selectedInsights.crawlData.technicalSignals.loadTime / 1000).toFixed(2)}s</p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-xs font-medium text-slate-400 uppercase">Homepage Title</span>
                        <p className="text-sm text-white">{selectedInsights.crawlData.title || 'No title found'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-xs font-medium text-slate-400 uppercase">Meta Description</span>
                        <p className="text-sm text-white">{selectedInsights.crawlData.metaDescription || 'No meta description found'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Content Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-white">{selectedInsights.crawlData.contentStats.wordCount.toLocaleString()}</div>
                      <div className="text-xs text-slate-400">Total Words</div>
                    </div>
                    <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-white">{selectedInsights.crawlData.headings.length}</div>
                      <div className="text-xs text-slate-400">Total Headings</div>
                    </div>
                    <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-white">{selectedInsights.crawlData.schemaTypes.length}</div>
                      <div className="text-xs text-slate-400">Schema Types</div>
                    </div>
                    <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-white">{selectedInsights.crawlData.contentStats.readabilityScore}</div>
                      <div className="text-xs text-slate-400">Avg Readability</div>
                    </div>
                  </div>

                  {/* Schema Types Found */}
                  {selectedInsights.crawlData.schemaTypes.length > 0 && (
                    <div className="mb-4">
                      <span className="text-xs font-medium text-slate-400 uppercase">Schema Types Found</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedInsights.crawlData.schemaTypes.map((schema, idx) => (
                          <span key={idx} className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded-full">
                            {schema}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Technical Signals */}
                  <div className="mb-4">
                    <span className="text-xs font-medium text-slate-400 uppercase">Technical Signals</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${selectedInsights.crawlData.technicalSignals.hasHttps ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                        {selectedInsights.crawlData.technicalSignals.hasHttps ? '' : ''} HTTPS
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${selectedInsights.crawlData.technicalSignals.hasCanonical ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                        {selectedInsights.crawlData.technicalSignals.hasCanonical ? '' : ''} Canonical
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${selectedInsights.crawlData.technicalSignals.mobileViewport ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                        {selectedInsights.crawlData.technicalSignals.mobileViewport ? '' : ''} Mobile Viewport
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${selectedInsights.crawlData.technicalSignals.hasOpenGraph ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                        {selectedInsights.crawlData.technicalSignals.hasOpenGraph ? '' : ''} Open Graph
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${selectedInsights.crawlData.technicalSignals.hasTwitterCard ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                        {selectedInsights.crawlData.technicalSignals.hasTwitterCard ? '' : ''} Twitter Card
                      </span>
                    </div>
                  </div>

                  {/* Issues Found */}
                  {selectedInsights.crawlData.issues && selectedInsights.crawlData.issues.length > 0 && (
                    <div className="mb-4">
                      <span className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                        Issues Found ({selectedInsights.crawlData.issues.length})
                      </span>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedInsights.crawlData.issues.map((issue, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center gap-2 p-2 rounded text-sm ${
                              issue.type === 'error' ? 'bg-red-900/30 text-red-300 border border-red-700' :
                              issue.type === 'warning' ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700' :
                              'bg-blue-900/30 text-blue-300 border border-blue-700'
                            }`}
                          >
                            <span className="font-medium">
                              {issue.type === 'error' ? '!' : issue.type === 'warning' ? '!' : 'i'}
                            </span>
                            <span>{issue.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Headings Found */}
                  {selectedInsights.crawlData.headings.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                        Headings Found ({selectedInsights.crawlData.headings.length})
                      </span>
                      <div className="bg-slate-700/50 border border-slate-600 rounded-lg max-h-48 overflow-y-auto">
                        {selectedInsights.crawlData.headings.slice(0, 15).map((heading, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 border-b border-slate-600 last:border-b-0 text-sm">
                            <span className={`px-2 py-0.5 rounded text-xs font-mono ${
                              heading.level === 1 ? 'bg-purple-900/30 text-purple-400' :
                              heading.level === 2 ? 'bg-blue-900/30 text-blue-400' :
                              'bg-slate-700 text-slate-400'
                            }`}>
                              H{heading.level}
                            </span>
                            <span className="text-slate-300 truncate flex-1">{heading.text}</span>
                            {heading.hasDirectAnswer ? (
                              <span className="text-green-400 text-xs">BLUF</span>
                            ) : (
                              <span className="text-slate-500 text-xs">No direct answer</span>
                            )}
                          </div>
                        ))}
                        {selectedInsights.crawlData.headings.length > 15 && (
                          <div className="p-2 text-center text-xs text-slate-500">
                            +{selectedInsights.crawlData.headings.length - 15} more headings
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Recommendations */}
              {selectedInsights.recommendations && selectedInsights.recommendations.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Actionable Recommendations</h3>
                  <div className="space-y-4">
                    {selectedInsights.recommendations.map((rec, index) => (
                      <div key={index} className="border border-slate-700 rounded-lg p-4 hover:border-blue-600 transition-colors bg-slate-800/30">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-white text-base">{rec.title}</h4>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                            rec.priority === 'high' ? 'bg-red-900/30 text-red-400' :
                            rec.priority === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                            'bg-emerald-900/30 text-emerald-400'
                          }`}>
                            {rec.priority} priority
                          </span>
                        </div>
                        {/* Render description with proper formatting for code blocks and line breaks */}
                        <div className="text-sm text-slate-300 mb-3 whitespace-pre-wrap font-mono bg-slate-900/50 p-3 rounded border border-slate-700 text-xs leading-relaxed">
                          {rec.description}
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-slate-500 pt-2 border-t border-slate-700">
                          <span className="flex items-center">
                            <span className="w-2 h-2 rounded-full bg-blue-400 mr-1"></span>
                            Difficulty: {rec.difficulty}
                          </span>
                          <span className="flex items-center">
                            <span className="w-2 h-2 rounded-full bg-purple-400 mr-1"></span>
                            Time: {rec.estimatedTime}
                          </span>
                          <span className="flex items-center">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1"></span>
                            Impact: +{rec.expectedImpact} points
                          </span>
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
                    // Handle URLs with or without protocol
                    let url = selectedInsights.website;
                    if (!url.startsWith('http://') && !url.startsWith('https://')) {
                      url = `https://${url}`;
                    }
                    window.open(url, '_blank');
                  }}
                  className="flex items-center space-x-2 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
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