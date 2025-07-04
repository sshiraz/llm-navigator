import React from 'react';
import { ExternalLink, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Analysis } from '../../types';

interface CompetitorTableProps {
  analyses: Analysis[];
}

export default function CompetitorTable({ analyses }: CompetitorTableProps) {
  const sortedAnalyses = [...analyses].sort((a, b) => b.score - a.score);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { color: 'bg-yellow-100 text-yellow-800', label: 'Featured' };
    if (rank <= 3) return { color: 'bg-emerald-100 text-emerald-800', label: 'Top Result' };
    if (rank <= 5) return { color: 'bg-blue-100 text-blue-800', label: 'Visible' };
    return { color: 'bg-gray-100 text-gray-800', label: 'Buried' };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Competitor Performance</h3>
        <p className="text-sm text-gray-600 mt-1">Latest analysis scores and rankings</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Website
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                LLM Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Predicted Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Updated
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedAnalyses.map((analysis, index) => {
              const badge = getRankBadge(analysis.predictedRank);
              const isUserSite = analysis.website === 'techstart.com';
              
              return (
                <tr key={analysis.id} className={isUserSite ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {analysis.website}
                          </span>
                          {isUserSite && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Your Site
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          Keywords: {analysis.keywords.join(', ')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-2xl font-bold ${getScoreColor(analysis.score)}`}>
                        {analysis.score}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">/100</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-lg font-semibold text-gray-900">
                        #{analysis.predictedRank}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(analysis.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="text-blue-600 hover:text-blue-800 flex items-center space-x-1">
                      <span>View Report</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}