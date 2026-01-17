import React from 'react';
import { TrendingUp, Target, AlertTriangle, CheckCircle, ArrowRight, Award, Users, Zap, Globe, Bot } from 'lucide-react';
import { Analysis, CitationResult, CompetitorCitation } from '../../types';

interface CompetitorStrategyProps {
  analysis: Analysis;
}

// Extract competitor data from AEO analysis
function extractCompetitorData(analysis: Analysis): {
  competitors: { domain: string; citationCount: number; contexts: string[] }[];
  totalQueries: number;
  userCitationCount: number;
} {
  const isAEO = analysis.category === 'Answer Engine Optimization';

  if (!isAEO) {
    return { competitors: [], totalQueries: 0, userCitationCount: 0 };
  }

  // Use real citationResults if available
  if (analysis.citationResults && analysis.citationResults.length > 0) {
    const competitorMap = new Map<string, { count: number; contexts: string[] }>();

    // Extract competitors from each citation result
    analysis.citationResults.forEach(result => {
      result.competitorsCited.forEach(comp => {
        const existing = competitorMap.get(comp.domain);
        if (existing) {
          existing.count++;
          if (comp.context && !existing.contexts.includes(comp.context)) {
            existing.contexts.push(comp.context);
          }
        } else {
          competitorMap.set(comp.domain, {
            count: 1,
            contexts: comp.context ? [comp.context] : []
          });
        }
      });
    });

    const totalQueries = analysis.citationResults.length;
    const userCitationCount = analysis.citationResults.filter(r => r.isCited).length;

    const competitors = Array.from(competitorMap.entries())
      .map(([domain, data]) => ({
        domain,
        citationCount: data.count,
        contexts: data.contexts
      }))
      .sort((a, b) => b.citationCount - a.citationCount);

    return { competitors, totalQueries, userCitationCount };
  }

  // Fallback: Try to parse from insights (legacy behavior)
  const competitorMap = new Map<string, { count: number; contexts: string[] }>();

  try {
    const insightsMatch = analysis.insights.match(/Competitors cited: ([\w., ]+)/);
    if (insightsMatch) {
      const domains = insightsMatch[1].split(',').map(d => d.trim());
      domains.forEach(domain => {
        if (domain && domain.includes('.')) {
          competitorMap.set(domain, { count: 1, contexts: ['Cited in AI response'] });
        }
      });
    }
  } catch {
    // Ignore parsing errors
  }

  const totalQueries = analysis.keywords.length || 1;
  const userCitationCount = Math.round((analysis.score / 100) * totalQueries);

  const competitors = Array.from(competitorMap.entries())
    .map(([domain, data]) => ({
      domain,
      citationCount: data.count,
      contexts: data.contexts
    }))
    .sort((a, b) => b.citationCount - a.citationCount);

  return { competitors, totalQueries, userCitationCount };
}

export default function CompetitorStrategy({ analysis }: CompetitorStrategyProps) {
  const isAEO = analysis.category === 'Answer Engine Optimization';

  // Extract competitor data from citation results (real or simulated)
  const extractedData = extractCompetitorData(analysis);

  // Use citation data from analysis
  const citationRate = analysis.overallCitationRate || 0;
  const totalQueries = extractedData.totalQueries;
  const userCitationCount = extractedData.userCitationCount;

  const getAEOOpportunities = () => {
    if (!isAEO) {
      return [
        {
          title: 'Switch to AEO Analysis',
          description: 'Run an AEO analysis to see which competitors are being cited by AI assistants.',
          impact: 'High',
          effort: 'Low',
          action: 'Run New Analysis'
        }
      ];
    }

    return [
      {
        title: 'Target High-Intent Prompts',
        description: 'Focus on prompts where competitors are weak. Create content that directly answers user questions.',
        impact: 'High',
        effort: 'Medium',
        action: 'Identify weak competitor prompts'
      },
      {
        title: 'Build Authoritative Content',
        description: 'Create comprehensive guides that AI models prefer to cite. Include statistics, examples, and clear structure.',
        impact: 'High',
        effort: 'High',
        action: 'Create pillar content'
      },
      {
        title: 'Optimize for Direct Answers',
        description: 'Structure content with BLUF (Bottom Line Up Front) to increase citation likelihood.',
        impact: 'Medium',
        effort: 'Low',
        action: 'Restructure key pages'
      },
      {
        title: 'Add Schema Markup',
        description: 'Implement FAQ, HowTo, and Organization schema to help AI understand your content.',
        impact: 'Medium',
        effort: 'Medium',
        action: 'Implement schema'
      }
    ];
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High': return 'text-emerald-400 bg-emerald-900/50';
      case 'Medium': return 'text-yellow-400 bg-yellow-900/50';
      case 'Low': return 'text-slate-400 bg-slate-700';
      default: return 'text-slate-400 bg-slate-700';
    }
  };

  const opportunities = getAEOOpportunities();

  // If no citation data available (neither real nor simulated), show a prompt to run analysis
  const hasCitationData = analysis.citationResults && analysis.citationResults.length > 0;
  if (!isAEO || !hasCitationData) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Competitor Strategy</h1>
          <p className="text-lg text-slate-400">
            See who's getting cited by AI assistants
          </p>
        </div>

        <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Citation Data Available</h2>
          <p className="text-slate-300 mb-6">
            Run an AI Visibility analysis to see which competitors are being cited by AI assistants like ChatGPT, Claude, and Perplexity.
          </p>
          <button
            onClick={() => window.location.hash = 'new-analysis'}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Run AI Visibility Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-4">AI Citation Competitor Analysis</h1>
        <p className="text-lg text-slate-400">
          See who AI assistants are citing for your target queries
        </p>
      </div>

      {/* Simulated Data Notice */}
      {analysis.isSimulated && (
        <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-4">
          <div className="flex items-center justify-center gap-2 text-purple-300">
            <Zap className="w-5 h-5" />
            <span className="font-medium">Demo Mode</span>
            <span className="text-purple-400">— These are simulated results. Upgrade to see real competitor data.</span>
          </div>
        </div>
      )}

      {/* Your Citation Performance */}
      <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-700 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Your Citation Performance</h2>
            <p className="text-slate-400">{analysis.website}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-blue-400">{citationRate}%</div>
            <div className="text-sm text-slate-400">Citation Rate</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="bg-slate-800 rounded-lg p-4 text-center">
            <Bot className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{totalQueries}</div>
            <div className="text-xs text-slate-400">Queries Tested</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 text-center">
            <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{userCitationCount}</div>
            <div className="text-xs text-slate-400">Times Cited</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 text-center">
            <Users className="w-6 h-6 text-orange-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {extractedData.competitors.length}
            </div>
            <div className="text-xs text-slate-400">Competitors Tracked</div>
          </div>
        </div>
      </div>

      {/* Competitor Rankings */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Award className="w-6 h-6 text-yellow-400" />
          <h2 className="text-xl font-semibold text-white">
            {isAEO ? "Competitor Performance" : "Competitor Rankings"}
          </h2>
        </div>

        {extractedData.competitors.length > 0 ? (
          <div className="space-y-3">
            {extractedData.competitors.map((competitor, index) => (
              <div
                key={competitor.domain}
                className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-500' : index === 2 ? 'bg-orange-500' : 'bg-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-slate-500" />
                      <span className="font-medium text-white">{competitor.domain}</span>
                    </div>
                    <div className="text-sm text-slate-400">
                      {competitor.contexts[0]}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">{competitor.citationCount}</div>
                  <div className="text-xs text-slate-400">citations</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p>No competitor data available.</p>
            <p className="text-sm mt-1">Run an analysis to see competitor comparisons.</p>
          </div>
        )}
      </div>

      {/* Strategic Opportunities */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Target className="w-6 h-6 text-emerald-400" />
          <h2 className="text-xl font-semibold text-white">Strategic Opportunities</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {opportunities.map((opportunity, index) => (
            <div key={index} className="border border-slate-600 rounded-lg p-4 bg-slate-900/50">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-white">{opportunity.title}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(opportunity.impact)}`}>
                  {opportunity.impact} Impact
                </span>
              </div>
              <p className="text-sm text-slate-400 mb-3">{opportunity.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Effort: {opportunity.effort}</span>
                <button className="text-sm text-blue-400 hover:text-blue-300 flex items-center space-x-1">
                  <span>{opportunity.action}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 30-Day Action Plan */}
      <div className="bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-700 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Zap className="w-6 h-6 text-emerald-400" />
          <h2 className="text-xl font-semibold text-emerald-300">30-Day AEO Action Plan</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 rounded-lg p-4 border border-emerald-700">
            <h3 className="font-semibold text-white mb-3">Week 1-2: Quick Wins</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start space-x-2">
                <ArrowRight className="w-3 h-3 mt-1 text-emerald-400 flex-shrink-0" />
                <span>Add FAQ schema to top pages</span>
              </li>
              <li className="flex items-start space-x-2">
                <ArrowRight className="w-3 h-3 mt-1 text-emerald-400 flex-shrink-0" />
                <span>Restructure content with direct answers first</span>
              </li>
              <li className="flex items-start space-x-2">
                <ArrowRight className="w-3 h-3 mt-1 text-emerald-400 flex-shrink-0" />
                <span>Re-run AEO analysis to measure baseline</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-800 rounded-lg p-4 border border-emerald-700">
            <h3 className="font-semibold text-white mb-3">Week 3-4: Content Strategy</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start space-x-2">
                <ArrowRight className="w-3 h-3 mt-1 text-emerald-400 flex-shrink-0" />
                <span>Create content targeting competitor weak spots</span>
              </li>
              <li className="flex items-start space-x-2">
                <ArrowRight className="w-3 h-3 mt-1 text-emerald-400 flex-shrink-0" />
                <span>Build comprehensive guides with statistics</span>
              </li>
              <li className="flex items-start space-x-2">
                <ArrowRight className="w-3 h-3 mt-1 text-emerald-400 flex-shrink-0" />
                <span>Add expert quotes and citations</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-800 rounded-lg p-4 border border-emerald-700">
            <h3 className="font-semibold text-white mb-3">Ongoing: Monitor & Optimize</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start space-x-2">
                <ArrowRight className="w-3 h-3 mt-1 text-emerald-400 flex-shrink-0" />
                <span>Weekly AEO analysis on key prompts</span>
              </li>
              <li className="flex items-start space-x-2">
                <ArrowRight className="w-3 h-3 mt-1 text-emerald-400 flex-shrink-0" />
                <span>Track citation rate improvements</span>
              </li>
              <li className="flex items-start space-x-2">
                <ArrowRight className="w-3 h-3 mt-1 text-emerald-400 flex-shrink-0" />
                <span>Expand to new query categories</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-6">
        <h3 className="font-semibold text-blue-300 mb-3">Pro Tips for Beating Competitors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-200">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" />
            <span>AI models prefer content that directly answers questions in the first paragraph</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" />
            <span>Include specific numbers, statistics, and dates to build authority</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" />
            <span>Structure content with clear headings that match user questions</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" />
            <span>Update content regularly - AI models notice freshness</span>
          </div>
        </div>
      </div>
    </div>
  );
}
