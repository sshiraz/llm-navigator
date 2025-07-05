import React from 'react';
import { ArrowLeft, ExternalLink, Plus, Users, Target, Calendar, TrendingUp } from 'lucide-react';
import { Project } from '../../types';
import { mockAnalyses } from '../../utils/mockData';

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
}

export default function ProjectDetail({ project, onBack }: ProjectDetailProps) {
  const projectAnalyses = mockAnalyses.filter(analysis => analysis.projectId === project.id);
  const latestScore = projectAnalyses.length > 0 ? projectAnalyses[0].score : 0;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => {
            window.location.hash = 'dashboard';
          }}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-gray-600">{project.website}</span>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </div>
            {project.description && (
              <p className="text-gray-600 mt-2">{project.description}</p>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              New Analysis
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Edit Project
            </button>
          </div>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Latest Score</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{latestScore}/100</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <Target className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium text-gray-600">Keywords</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{project.keywords.length}</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-medium text-gray-600">Competitors</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{project.competitors.length}</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <Calendar className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-gray-600">Analyses</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{projectAnalyses.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Keywords */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Target Keywords</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm">Edit</button>
          </div>
          
          <div className="space-y-2">
            {project.keywords.map((keyword, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-900">{keyword}</span>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-4 p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 transition-colors">
            <Plus className="w-4 h-4 mx-auto" />
          </button>
        </div>

        {/* Competitors */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Competitors</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm">Add</button>
          </div>
          
          <div className="space-y-3">
            {project.competitors.map((competitor) => (
              <div key={competitor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{competitor.name}</div>
                  <div className="text-sm text-gray-500">{competitor.website}</div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>
          
          <button className="w-full mt-4 p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 transition-colors">
            <Plus className="w-4 h-4 mx-auto" />
          </button>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          
          <div className="space-y-3">
            {projectAnalyses.slice(0, 3).map((analysis) => (
              <div key={analysis.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">Analysis completed</span>
                  <span className="text-xs text-gray-500">
                    {new Date(analysis.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Score: <span className="font-medium">{analysis.score}/100</span>
                </div>
              </div>
            ))}
          </div>
          
          {projectAnalyses.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">No analyses yet</div>
              <button className="text-blue-600 hover:text-blue-700 text-sm">
                Run your first analysis
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}