import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, Target, BarChart3 } from 'lucide-react';
import ScoreCard from './ScoreCard';
import RecentAnalyses from './RecentAnalyses';
import { Analysis, User } from '../../types';
import { AnalysisService } from '../../services/analysisService';

interface DashboardProps {
  onNewAnalysis: () => void;
}

export default function Dashboard({ onNewAnalysis }: DashboardProps) {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
  }, []);

  useEffect(() => {
    // Load analyses from Supabase when user is available
    async function loadData() {
      if (!currentUser) {
        setAnalyses([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Load analyses
        const migrated = await AnalysisService.migrateFromLocalStorage(currentUser.id);
        if (migrated > 0) {
          console.log(`Migrated ${migrated} analyses to Supabase`);
        }

        const analysesResult = await AnalysisService.getUserAnalyses(currentUser.id);
        if (analysesResult.success && analysesResult.data) {
          setAnalyses(analysesResult.data);
          console.log(`Loaded ${analysesResult.data.length} analyses from Supabase`);
        } else {
          setAnalyses([]);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to localStorage for analyses
        const localAnalyses = AnalysisService.getFromLocalStorage(currentUser.id);
        setAnalyses(localAnalyses);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [currentUser]);
  
  const totalAnalyses = analyses.length;
  const avgScore = analyses.length > 0 
    ? Math.round(analyses.reduce((acc, analysis) => acc + analysis.score, 0) / analyses.length) 
    : 0;
  const bestScore = analyses.length > 0 
    ? Math.max(...analyses.map(a => a.score)) 
    : 0;
    
  const handleDeleteAnalysis = async (analysisId: string) => {
    try {
      // Optimistically update UI
      setAnalyses(analyses.filter(a => a.id !== analysisId));

      // Delete from Supabase
      const result = await AnalysisService.deleteAnalysis(analysisId);
      if (!result.success) {
        console.error('Failed to delete from Supabase:', result.error);
        // Revert on failure
        if (currentUser) {
          const freshData = await AnalysisService.getUserAnalyses(currentUser.id);
          if (freshData.data) {
            setAnalyses(freshData.data);
          }
        }
        alert('Failed to delete analysis. Please try again.');
      }
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

      {/* Recent Analyses */}
      <RecentAnalyses 
        analyses={analyses} 
        onDelete={handleDeleteAnalysis} 
      />
    </div>
  );
}