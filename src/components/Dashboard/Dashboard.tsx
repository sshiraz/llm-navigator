import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, Target, BarChart3, X } from 'lucide-react';
import ProjectCard from './ProjectCard';
import ScoreCard from './ScoreCard';
import RecentAnalyses from './RecentAnalyses';
import { Project, Analysis, User } from '../../types';

interface DashboardProps {
  onProjectSelect: (project: Project) => void;
  onNewAnalysis: () => void;
}

export default function Dashboard({ onProjectSelect, onNewAnalysis }: DashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // Get current user from localStorage
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  useEffect(() => {
    // Load current user from localStorage
    try {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        setCurrentUser(JSON.parse(userStr));
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
    
    // Load projects from localStorage
    try {
      const storedProjects = JSON.parse(localStorage.getItem('projects') || '[]');
      
      // Filter projects to only show those belonging to the current user
      if (currentUser) {
        const userProjects = storedProjects.filter((project: Project) => 
          project.userId === currentUser.id
        );
        setProjects(userProjects);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error('Error loading projects from localStorage:', error);
      setProjects([]);
    }
    
    // Load analyses from localStorage
    try {
      const storedAnalyses = JSON.parse(localStorage.getItem('analyses') || '[]');
      
      // Filter analyses to only show those belonging to the current user
      if (currentUser) {
        const userAnalyses = storedAnalyses.filter((analysis: Analysis) => 
          analysis.userId === currentUser.id
        );
        setAnalyses(userAnalyses);
      } else {
        setAnalyses([]);
      }
    } catch (error) {
      console.error('Error loading analyses from localStorage:', error);
      setAnalyses([]);
    }
  }, [currentUser]);
  
  const handleDeleteProject = (projectId: string) => {
    setShowDeleteConfirm(projectId);
  };
  
  const confirmDeleteProject = (projectId: string) => {
    try {
      // Get stored projects from localStorage
      const storedProjects = JSON.parse(localStorage.getItem('projects') || '[]');
      
      // Filter out the project to delete
      const updatedProjects = storedProjects.filter((p: Project) => p.id !== projectId);
      
      // Update state
      setProjects(projects.filter(p => p.id !== projectId));
      
      // Save to localStorage
      localStorage.setItem('projects', JSON.stringify(updatedProjects));
      
      // Close confirmation dialog
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
      setShowDeleteConfirm(null);
    }
  };
  
  const totalAnalyses = analyses.length;
  const avgScore = analyses.length > 0 
    ? Math.round(analyses.reduce((acc, analysis) => acc + analysis.score, 0) / analyses.length) 
    : 0;
  const bestScore = analyses.length > 0 
    ? Math.max(...analyses.map(a => a.score)) 
    : 0;
    
  const handleDeleteAnalysis = (analysisId: string) => {
    try {
      const existingAnalyses = JSON.parse(localStorage.getItem('analyses') || '[]');
      const updatedAnalyses = existingAnalyses.filter((a: Analysis) => a.id !== analysisId);
      // Update state
      setAnalyses(analyses.filter(a => a.id !== analysisId));
      // Save to localStorage
      localStorage.setItem('analyses', JSON.stringify(updatedAnalyses));
    } catch (error) {
      console.error('Error deleting analysis:', error);
      alert('Failed to delete analysis. Please try again.');
    }
  };

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
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={onProjectSelect}
              onDelete={() => handleDeleteProject(project.id)}
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
      <RecentAnalyses 
        analyses={analyses} 
        onDelete={handleDeleteAnalysis} 
      />
      
      {/* Delete Project Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Delete Project</h3>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this project? This action cannot be undone.
            </p>
            
            <div className="flex space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={() => confirmDeleteProject(showDeleteConfirm)}
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