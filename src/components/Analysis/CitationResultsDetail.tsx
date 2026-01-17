import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, XCircle, MessageSquare, Users, ExternalLink } from 'lucide-react';
import { CitationResult, CompetitorCitation } from '../../types';

interface CitationResultsDetailProps {
  citationResults: CitationResult[];
  overallCitationRate: number;
}

export default function CitationResultsDetail({ citationResults, overallCitationRate }: CitationResultsDetailProps) {
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set());

  // Group results by prompt
  const resultsByPrompt = citationResults.reduce((acc, result) => {
    if (!acc[result.promptId]) {
      acc[result.promptId] = {
        prompt: result.prompt,
        results: []
      };
    }
    acc[result.promptId].results.push(result);
    return acc;
  }, {} as Record<string, { prompt: string; results: CitationResult[] }>);

  // Calculate stats by provider
  const statsByProvider = citationResults.reduce((acc, result) => {
    if (!acc[result.provider]) {
      acc[result.provider] = { total: 0, cited: 0 };
    }
    acc[result.provider].total++;
    if (result.isCited) {
      acc[result.provider].cited++;
    }
    return acc;
  }, {} as Record<string, { total: number; cited: number }>);

  // Get all competitors across all results
  const allCompetitors = citationResults.flatMap(r => r.competitorsCited);
  const competitorCounts = allCompetitors.reduce((acc, comp) => {
    acc[comp.domain] = (acc[comp.domain] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topCompetitors = Object.entries(competitorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const togglePrompt = (promptId: string) => {
    const newExpanded = new Set(expandedPrompts);
    if (newExpanded.has(promptId)) {
      newExpanded.delete(promptId);
    } else {
      newExpanded.add(promptId);
    }
    setExpandedPrompts(newExpanded);
  };

  const getProviderLabel = (provider: string) => {
    switch (provider) {
      case 'openai': return 'ChatGPT';
      case 'anthropic': return 'Claude';
      case 'perplexity': return 'Perplexity';
      default: return provider;
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'openai': return 'bg-green-900/30 text-green-400';
      case 'anthropic': return 'bg-orange-900/30 text-orange-400';
      case 'perplexity': return 'bg-blue-900/30 text-blue-400';
      default: return 'bg-slate-700 text-slate-300';
    }
  };

  const citedCount = citationResults.filter(r => r.isCited).length;
  const totalQueries = citationResults.length;

  if (citationResults.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-8 text-center border border-slate-700">
        <MessageSquare className="w-12 h-12 text-slate-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">No Citation Data</h3>
        <p className="text-slate-400">Run an analysis with AI providers to see citation results.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-xl p-6 border border-blue-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Citation Results</h3>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-400">{Math.round(overallCitationRate)}%</div>
            <div className="text-sm text-slate-400">Overall Citation Rate</div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-slate-300">
            Your site was cited in <span className="font-semibold text-white">{citedCount}</span> of <span className="font-semibold text-white">{totalQueries}</span> AI responses
          </span>
        </div>

        {/* Provider Breakdown */}
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(statsByProvider).map(([provider, stats]) => {
            const rate = stats.total > 0 ? Math.round((stats.cited / stats.total) * 100) : 0;
            return (
              <div key={provider} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProviderColor(provider)}`}>
                    {getProviderLabel(provider)}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-white">{rate}%</span>
                  <span className="text-sm text-slate-400">({stats.cited}/{stats.total})</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Competitors */}
      {topCompetitors.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-slate-400" />
            <h4 className="font-semibold text-white">Top Competitors Cited</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {topCompetitors.map(([domain, count]) => (
              <span
                key={domain}
                className="px-3 py-1 bg-slate-700 rounded-full text-sm text-slate-300"
              >
                {domain} <span className="text-slate-500">({count}x)</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Per-Prompt Results */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700 bg-slate-800">
          <h4 className="font-semibold text-white">Results by Prompt</h4>
          <p className="text-sm text-slate-400">Click to expand and see AI responses</p>
        </div>

        <div className="divide-y divide-slate-700">
          {Object.entries(resultsByPrompt).map(([promptId, { prompt, results }]) => {
            const isExpanded = expandedPrompts.has(promptId);
            const citedInPrompt = results.filter(r => r.isCited).length;
            const totalInPrompt = results.length;

            return (
              <div key={promptId}>
                {/* Prompt Header */}
                <button
                  onClick={() => togglePrompt(promptId)}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-slate-500 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
                    )}
                    <span className="text-white truncate">{prompt}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    {citedInPrompt > 0 ? (
                      <span className="flex items-center gap-1 text-green-400 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        {citedInPrompt}/{totalInPrompt}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-400 text-sm">
                        <XCircle className="w-4 h-4" />
                        Not cited
                      </span>
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3">
                    {results.map((result, idx) => (
                      <div
                        key={idx}
                        className={`rounded-lg p-4 ${
                          result.isCited ? 'bg-green-900/20 border border-green-700' : 'bg-slate-700/50 border border-slate-600'
                        }`}
                      >
                        {/* Provider Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProviderColor(result.provider)}`}>
                              {getProviderLabel(result.provider)}
                            </span>
                            <span className="text-xs text-slate-500">{result.modelUsed}</span>
                          </div>
                          {result.isCited ? (
                            <span className="flex items-center gap-1 text-green-400 text-sm font-medium">
                              <CheckCircle className="w-4 h-4" />
                              CITED
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-400 text-sm font-medium">
                              <XCircle className="w-4 h-4" />
                              NOT CITED
                            </span>
                          )}
                        </div>

                        {/* Citation Context */}
                        {result.isCited && result.citationContext && (
                          <div className="mb-3">
                            <div className="text-xs font-medium text-slate-400 mb-1">Citation Context:</div>
                            <div className="bg-slate-800 rounded p-3 text-sm text-slate-300 border-l-4 border-green-500">
                              "...{result.citationContext}..."
                            </div>
                          </div>
                        )}

                        {/* Full Response (truncated) */}
                        {result.response && (
                          <div className="mb-3">
                            <div className="text-xs font-medium text-slate-400 mb-1">AI Response:</div>
                            <div className="bg-slate-800 rounded p-3 text-sm text-slate-400 max-h-32 overflow-y-auto">
                              {result.response.length > 500
                                ? result.response.substring(0, 500) + '...'
                                : result.response
                              }
                            </div>
                          </div>
                        )}

                        {/* Competitors Cited */}
                        {!result.isCited && result.competitorsCited.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-slate-400 mb-2">Competitors Mentioned:</div>
                            <div className="flex flex-wrap gap-2">
                              {result.competitorsCited.slice(0, 5).map((comp, compIdx) => (
                                <span
                                  key={compIdx}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-slate-800 rounded text-xs text-slate-300 border border-slate-600"
                                >
                                  {comp.domain}
                                  {comp.url && (
                                    <ExternalLink className="w-3 h-3 text-slate-500" />
                                  )}
                                </span>
                              ))}
                              {result.competitorsCited.length > 5 && (
                                <span className="text-xs text-slate-500">
                                  +{result.competitorsCited.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Cost Info */}
                        <div className="mt-3 pt-3 border-t border-slate-600 flex items-center justify-between text-xs text-slate-500">
                          <span>{result.tokensUsed.toLocaleString()} tokens</span>
                          <span>${result.cost.toFixed(4)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
