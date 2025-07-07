import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, Target, BarChart3, X, Edit } from 'lucide-react';
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
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    website: '',
    description: '',
    keywords: ''
  });
  
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
  
  const handleCreateProject = () => {
    if (!currentUser) return;
    if (!newProject.name || !newProject.website) {
      alert('Project name and website are required');
      return;
    }
    
    try {
      // Create a new project
      const projectId = `project_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const keywords = newProject.keywords.split(',').map(k => k.trim()).filter(k => k);
      
      const newProjectData: Project = {
        id: projectId,
        userId: currentUser.id,
        name: newProject.name,
        website: newProject.website,
        description: newProject.description,
        keywords: keywords,
        competitors: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Get stored projects from localStorage
      const storedProjects = JSON.parse(localStorage.getItem('projects') || '[]');
      
      // Add new project
      storedProjects.push(newProjectData);
      
      // Update state
      setProjects([...projects, newProjectData]);
      
      // Save to localStorage
      localStorage.setItem('projects', JSON.stringify(storedProjects));
      
      // Reset form and close modal
      setNewProject({
        name: '',
        website: '',
        description: '',
        keywords: ''
      });
      setShowCreateProject(false);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
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
          <button 
            onClick={() => setShowCreateProject(true)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
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
      
      {/* Create Project Modal */}
      {showCreateProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Create New Project</h3>
              <button
                onClick={() => setShowCreateProject(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="My Website"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website URL *
                </label>
                <input
                  type="text"
                  value={newProject.website}
                  onChange={(e) => setNewProject({...newProject, website: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of your project"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={newProject.keywords}
                  onChange={(e) => setNewProject({...newProject, keywords: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="seo, marketing, analytics"
                />
              </div>
            </div>
            
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setShowCreateProject(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={handleCreateProject}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}