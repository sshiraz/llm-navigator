import React, { useRef, useState } from 'react';
import { ArrowLeft, ExternalLink, Clock, Zap, AlertCircle, CheckCircle, Download, FileText, Trash2, X } from 'lucide-react';
import { Analysis } from '../../types';
import MetricsBreakdown from './MetricsBreakdown';
import { mockAnalyses } from '../../utils/mockData';
import { generatePDFReport } from '../../utils/pdfGenerator';

interface AnalysisResultsProps {
  analysis: Analysis;
  onBack: () => void;
}

export default function AnalysisResults({ analysis, onBack }: AnalysisResultsProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'hard': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'easy': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownloadPDF = async () => {
    if (reportRef.current) {
      await generatePDFReport(reportRef.current, analysis);
    }
  };

  const handleViewInsights = (analysisId: string) => {
    const targetAnalysis = mockAnalyses.find(a => a.id === analysisId);
    if (targetAnalysis) {
      // Create a detailed insights modal or navigate to detailed view
      const insightsWindow = window.open('', '_blank', 'width=800,height=600');
      if (insightsWindow) {
        insightsWindow.document.write(`
          <html>
            <head>
              <title>Detailed Insights - ${targetAnalysis.website}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
                .header { border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; }
                .metric { background: #f8fafc; padding: 10px; margin: 10px 0; border-radius: 8px; }
                .score { font-size: 24px; font-weight: bold; color: #3b82f6; }
                .recommendations { margin-top: 20px; }
                .rec-item { background: #fff; border: 1px solid #e5e7eb; padding: 15px; margin: 10px 0; border-radius: 8px; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Detailed Analysis Insights</h1>
                <h2>${targetAnalysis.website}</h2>
                <p><strong>Keywords:</strong> ${targetAnalysis.keywords.join(', ')}</p>
                <p><strong>Overall Score:</strong> <span class="score">${targetAnalysis.score}/100</span></p>
              </div>
              
              <div class="metrics">
                <h3>Metrics Breakdown</h3>
                <div class="metric">
                  <strong>Content Clarity:</strong> ${targetAnalysis.metrics.contentClarity}/100
                  <p>How clear and well-structured your content is for AI understanding.</p>
                </div>
                <div class="metric">
                  <strong>Semantic Richness:</strong> ${targetAnalysis.metrics.semanticRichness}/100
                  <p>The depth and breadth of semantic relationships in your content.</p>
                </div>
                <div class="metric">
                  <strong>Structured Data:</strong> ${targetAnalysis.metrics.structuredData}/100
                  <p>Implementation of schema markup and structured data formats.</p>
                </div>
                <div class="metric">
                  <strong>Natural Language:</strong> ${targetAnalysis.metrics.naturalLanguage}/100
                  <p>How naturally your content reads and aligns with conversational queries.</p>
                </div>
                <div class="metric">
                  <strong>Keyword Relevance:</strong> ${targetAnalysis.metrics.keywordRelevance}/100
                  <p>How well your content matches target keywords and search intent.</p>
                </div>
              </div>
              
              <div class="insights">
                <h3>AI-Generated Insights</h3>
                <p>${targetAnalysis.insights}</p>
              </div>
              
              <div class="recommendations">
                <h3>Recommendations</h3>
                ${targetAnalysis.recommendations.map(rec => `
                  <div class="rec-item">
                    <h4>${rec.title}</h4>
                    <p>${rec.description}</p>
                    <p><strong>Priority:</strong> ${rec.priority} | <strong>Difficulty:</strong> ${rec.difficulty} | <strong>Expected Impact:</strong> +${rec.expectedImpact} points</p>
                    <p><strong>Estimated Time:</strong> ${rec.estimatedTime}</p>
                  </div>
                `).join('')}
              </div>
            </body>
          </html>
        `);
        insightsWindow.document.close();
      }
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    // Get stored analyses from localStorage
    try {
      const storedAnalyses = JSON.parse(localStorage.getItem('analyses') || '[]');
      // Filter out the current analysis
      const updatedAnalyses = storedAnalyses.filter((a: Analysis) => a.id !== analysis.id);
      // Save back to localStorage
      localStorage.setItem('analyses', JSON.stringify(updatedAnalyses));
      
      // Navigate back to dashboard or new analysis
      window.location.hash = 'dashboard';
    } catch (error) {
      console.error('Error deleting analysis:', error);
      alert('Failed to delete analysis. Please try again.');
    }
  };

  // Get competitor analyses for comparison
  const competitorAnalyses = mockAnalyses.filter(a => a.id !== analysis.id);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Analysis</span>
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">LLM Analysis Report</h1>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Website:</span>
                <span className="font-medium text-gray-900">{analysis.website}</span>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Keywords:</span>
                <span className="font-medium text-gray-900">{analysis.keywords.join(', ')}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-sm text-gray-500">Generated on</div>
              <div className="text-sm font-medium text-gray-900">
                {new Date(analysis.createdAt).toLocaleDateString()}
              </div>
            </div>
            
            <button
              onClick={handleDownloadPDF}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            
            <button
              onClick={handleDelete}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Analysis</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Content - This will be captured for PDF */}
      <div ref={reportRef} className="space-y-8">
        {/* Overall Score */}
        <div className={`rounded-xl border-2 p-8 ${getScoreBackground(analysis.score)}`}>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Overall LLM Navigator Score</h2>
            <div className={`text-6xl font-bold mb-4 ${getScoreColor(analysis.score)}`}>
              {analysis.score}
              <span className="text-2xl text-gray-500">/100</span>
            </div>
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">Predicted Rank</div>
                <div className="text-2xl font-bold text-blue-600">#{analysis.predictedRank}</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">Category</div>
                <div className="text-xl font-medium text-indigo-600">{analysis.category}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Metrics Breakdown */}
        <div className="mb-8">
          <MetricsBreakdown 
            analysis={analysis} 
            competitors={competitorAnalyses} 
            onViewInsights={handleViewInsights}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* AI Insights */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">AI-Generated Insights</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed">{analysis.insights}</p>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Actionable Recommendations</h3>
              
              <div className="space-y-4">
                {analysis.recommendations.map((recommendation) => (
                  <div key={recommendation.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-lg font-medium text-gray-900">
                        {recommendation.title}
                      </h4>
                      <div className="flex space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(recommendation.priority)}`}>
                          {recommendation.priority} priority
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{recommendation.description}</p>
                    
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Time: {recommendation.estimatedTime}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded ${getDifficultyColor(recommendation.difficulty)}`}>
                          {recommendation.difficulty}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-emerald-500" />
                        <span className="text-emerald-600 font-medium">
                          +{recommendation.expectedImpact} points
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Content Quality</span>
                  <span className="font-semibold text-gray-900">
                    {analysis.metrics.contentClarity >= 80 ? 'Excellent' : 
                     analysis.metrics.contentClarity >= 60 ? 'Good' : 'Needs Work'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Technical Setup</span>
                  <span className="font-semibold text-gray-900">
                    {analysis.metrics.structuredData >= 80 ? 'Excellent' : 
                     analysis.metrics.structuredData >= 60 ? 'Good' : 'Needs Work'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Keyword Alignment</span>
                  <span className="font-semibold text-gray-900">
                    {analysis.metrics.keywordRelevance >= 80 ? 'Excellent' : 
                     analysis.metrics.keywordRelevance >= 60 ? 'Good' : 'Needs Work'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">AI Readiness</span>
                  <span className="font-semibold text-gray-900">
                    {analysis.score >= 80 ? 'High' : 
                     analysis.score >= 60 ? 'Medium' : 'Low'}
                  </span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">Next Steps</h3>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                  <span className="text-blue-800">
                    Focus on high-priority recommendations first
                  </span>
                </div>
                
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                  <span className="text-blue-800">
                    Re-analyze after implementing changes
                  </span>
                </div>
                
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                  <span className="text-blue-800">
                    Track competitor improvements
                  </span>
                </div>
              </div>
            </div>

            {/* Report Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Actions</h3>
              
              <div className="space-y-3">
                <button
                  onClick={handleDownloadPDF}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>Download PDF Report</span>
                </button>
                
                <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <ExternalLink className="w-4 h-4" />
                  <span>Share Report</span>
                </button>
                
                <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Zap className="w-4 h-4" />
                  <span>Schedule Re-analysis</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Delete Analysis</h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
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
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={confirmDelete}
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