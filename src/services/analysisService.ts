import { supabase, handleSupabaseError, handleSupabaseSuccess } from '../lib/supabase';
import { Analysis } from '../types';

export class AnalysisService {
  // Get all analyses for a user
  static async getUserAnalyses(userId: string, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select(`
          *,
          projects (name, website)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return handleSupabaseError(error);
      }

      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  // Get analyses for a specific project
  static async getProjectAnalyses(projectId: string) {
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        return handleSupabaseError(error);
      }

      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  // Create a new analysis
  static async createAnalysis(analysisData: {
    project_id: string;
    user_id: string;
    website: string;
    keywords: string[];
    score: number;
    metrics: any;
    insights: string;
    predicted_rank: number;
    category: string;
    recommendations: any[];
    is_simulated?: boolean;
    cost_info?: any;
  }) {
    try {
      const { data, error } = await supabase
        .from('analyses')
        .insert(analysisData)
        .select()
        .single();

      if (error) {
        return handleSupabaseError(error);
      }

      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  // Get analysis by ID
  static async getAnalysisById(analysisId: string) {
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select(`
          *,
          projects (name, website)
        `)
        .eq('id', analysisId)
        .single();

      if (error) {
        return handleSupabaseError(error);
      }

      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  // Delete an analysis
  static async deleteAnalysis(analysisId: string) {
    try {
      const { error } = await supabase
        .from('analyses')
        .delete()
        .eq('id', analysisId);

      if (error) {
        return handleSupabaseError(error);
      }

      return handleSupabaseSuccess(null);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  // Get competitor analyses for comparison
  static async getCompetitorAnalyses(keywords: string[], excludeUserId?: string) {
    try {
      let query = supabase
        .from('analyses')
        .select('*')
        .contains('keywords', keywords)
        .order('score', { ascending: false })
        .limit(10);

      if (excludeUserId) {
        query = query.neq('user_id', excludeUserId);
      }

      const { data, error } = await query;

      if (error) {
        return handleSupabaseError(error);
      }

      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }
}