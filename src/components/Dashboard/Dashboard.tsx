import React from 'react';
import { Plus, TrendingUp, Target, BarChart3 } from 'lucide-react';
import ProjectCard from './ProjectCard';
import ScoreCard from './ScoreCard';
import RecentAnalyses from './RecentAnalyses';
import { mockProjects, mockAnalyses } from '../../utils/mockData';
import { Project } from '../../types';

interface DashboardProps {
  onProjectSelect: (project: Project) => void;
  onNewAnalysis: () => void;
}

export default function Dashboard({ onProjectSelect, onNewAnalysis }: DashboardProps) {
  const totalAnalyses = mockAnalyses.length;
  const avgScore = Math.round(mockAnalyses.reduce((acc, analysis) => acc + analysis.score, 0) / mockAnalyses.length);
  const bestScore = Math.max(...mockAnalyses.map(a => a.score));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor your LLM optimization progress</p>
        </div>
        <button 
          onClick={onNewAnalysis}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>New Analysis</span>
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ScoreCard
          title="Average LLM Score"
          score={avgScore}
          description="Overall performance across all analyses"
          icon={BarChart3}
          color="blue"
        />
        <ScoreCard
          title="Best Score"
          score={bestScore}
          description="Your highest performing analysis"
          icon={TrendingUp}
          color="emerald"
        />
        <ScoreCard
          title="Total Analyses"
          score={totalAnalyses}
          description="Analyses completed this month"
          icon={Target}
          color="indigo"
        />
      </div>

      {/* Projects Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Your Projects</h2>
          <button className="text-blue-600 hover:text-blue-700 font-medium">View All</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={onProjectSelect}
            />
          ))}
          
          {/* Add Project Card */}
          <div 
            onClick={onNewAnalysis}
            className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-gray-400 transition-colors cursor-pointer group"
          >
            <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gray-300 transition-colors">
              <Plus className="w-6 h-6 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start New Analysis</h3>
            <p className="text-gray-600 text-sm">Analyze a website's LLM optimization</p>
          </div>
        </div>
      </div>

      {/* Recent Analyses */}
      <RecentAnalyses analyses={mockAnalyses} />
    </div>
  );
}