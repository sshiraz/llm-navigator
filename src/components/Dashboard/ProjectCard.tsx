import React from 'react';
import { ExternalLink, Calendar, Target, Users } from 'lucide-react';
import { Project } from '../../types';

interface ProjectCardProps {
  project: Project;
  onSelect: (project: Project) => void;
}

export default function ProjectCard({ project, onSelect }: ProjectCardProps) {
  return (
    <div 
      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group"
      onClick={() => onSelect(project)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {project.name}
          </h3>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-sm text-gray-500">{project.website}</span>
            <ExternalLink className="w-3 h-3 text-gray-400" />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
          <span className="text-xs text-gray-500">Active</span>
        </div>
      </div>

      {project.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
      )}

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Target className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-xs text-gray-500">Keywords</p>
          <p className="text-sm font-semibold text-gray-900">{project.keywords.length}</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Users className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-xs text-gray-500">Competitors</p>
          <p className="text-sm font-semibold text-gray-900">{project.competitors.length}</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Calendar className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-xs text-gray-500">Updated</p>
          <p className="text-sm font-semibold text-gray-900">
            {new Date(project.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {project.keywords.slice(0, 2).map((keyword, index) => (
          <span 
            key={index}
            className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md"
          >
            {keyword}
          </span>
        ))}
        {project.keywords.length > 2 && (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
            +{project.keywords.length - 2} more
          </span>
        )}
      </div>
    </div>
  );
}