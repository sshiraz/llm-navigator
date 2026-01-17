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
    if (score >= 80) return 'text-emerald-400 bg-emerald-900/50';
    if (score >= 60) return 'text-yellow-400 bg-yellow-900/50';
    return 'text-red-400 bg-red-900/50';
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 75) return { color: 'bg-emerald-900/50 text-emerald-400', label: 'High', description: 'Likely to be cited' };
    if (score >= 50) return { color: 'bg-amber-900/50 text-amber-400', label: 'Medium', description: 'May be cited' };
    return { color: 'bg-red-900/50 text-red-400', label: 'Low', description: 'Unlikely to be cited' };
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
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-white">Recent Analyses</h3>
        <p className="text-sm text-slate-400 mt-1">Latest LLM optimization scores</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Website
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                LLM Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                AI Confidence
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Keywords
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {analyses.map((analysis) => {
              const confidence = getConfidenceBadge(analysis.score);

              return (
                <tr key={analysis.id} className="hover:bg-slate-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-white">
                        {analysis.website}
                      </span>
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(analysis.score)}`}>
                      {analysis.score}/100
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${confidence.color}`}>
                        {confidence.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {analysis.keywords.slice(0, 2).map((keyword, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded"
                        >
                          {keyword}
                        </span>
                      ))}
                      {analysis.keywords.length > 2 && (
                        <span className="text-xs text-slate-500">
                          +{analysis.keywords.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
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
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl max-w-md w-full p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Delete Analysis</h3>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="p-1 hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <p className="text-slate-300 mb-6">
              Are you sure you want to delete this analysis? This action cannot be undone.
            </p>

            <div className="flex space-x-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
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