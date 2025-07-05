import React, { useState } from 'react';
import { ExternalLink, ArrowUpRight, Trash2, X } from 'lucide-react';
import { Analysis } from '../../types';

interface RecentAnalysesProps {
  analyses: Analysis[];
  onDelete?: (analysisId: string) => void;
}

export default function RecentAnalyses({ analyses, onDelete }: RecentAnalysesProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { color: 'bg-yellow-100 text-yellow-800', label: 'Featured' };
    if (rank <= 3) return { color: 'bg-emerald-100 text-emerald-800', label: 'Top Result' };
    if (rank <= 5) return { color: 'bg-blue-100 text-blue-800', label: 'Visible' };
    return { color: 'bg-gray-100 text-gray-800', label: 'Buried' };
  };

  const handleDelete = (analysisId: string) => {
    setDeleteConfirm(analysisId);
  };

  const confirmDelete = (analysisId: string) => {
    if (onDelete) {
      onDelete(analysisId);
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Analyses</h3>
        <p className="text-sm text-gray-600 mt-1">Latest LLM optimization scores</p>
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
                Keywords
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {analyses.map((analysis) => {
              const badge = getRankBadge(analysis.predictedRank);
              
              return (
                <tr key={analysis.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {analysis.website}
                      </span>
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(analysis.score)}`}>
                      {analysis.score}/100
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-semibold text-gray-900">
                        #{analysis.predictedRank}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {analysis.keywords.slice(0, 2).map((keyword, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {keyword}
                        </span>
                      ))}
                      {analysis.keywords.length > 2 && (
                        <span className="text-xs text-gray-500">
                          +{analysis.keywords.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(analysis.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-3">
                      <a 
                        href={`#analysis-results`}
                        onClick={() => {
                          // Store the current analysis in localStorage to view it
                          // Store the current analysis in localStorage to view it
                          localStorage.setItem('currentAnalysis', JSON.stringify(analysis));
                        }}
                        className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 text-sm"
                      >
                        <span>View</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                      
                      <button 
                        onClick={() => handleDelete(analysis.id)}
                        className="text-red-600 hover:text-red-800 flex items-center space-x-1 text-sm"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Delete Analysis</h3>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this analysis? This action cannot be undone.
            </p>
            
            <div className="flex space-x-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={() => confirmDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}