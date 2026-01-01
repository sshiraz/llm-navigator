import { supabase, handleSupabaseError, handleSupabaseSuccess } from '../lib/supabase';
import { Analysis } from '../types';

// Convert database row to Analysis type
function rowToAnalysis(row: any): Analysis {
  return {
    id: row.id,
    projectId: row.project_id || '1',
    userId: row.user_id,
    website: row.website,
    keywords: row.keywords,
    score: row.score,
    model: row.model,
    metrics: row.metrics,
    insights: row.insights,
    predictedRank: row.predicted_rank,
    category: row.category,
    recommendations: row.recommendations || [],
    createdAt: row.created_at,
    isSimulated: row.is_simulated,
    costInfo: row.cost_info,
    crawlData: row.crawl_data,
  };
}

// Convert Analysis type to database insert format
function analysisToRow(analysis: Analysis): any {
  return {
    id: analysis.id,
    user_id: analysis.userId,
    project_id: analysis.projectId !== '1' ? analysis.projectId : null,
    website: analysis.website,
    keywords: analysis.keywords,
    score: analysis.score,
    model: analysis.model,
    metrics: analysis.metrics,
    insights: analysis.insights,
    predicted_rank: analysis.predictedRank,
    category: analysis.category,
    recommendations: analysis.recommendations,
    is_simulated: analysis.isSimulated,
    cost_info: analysis.costInfo,
    crawl_data: analysis.crawlData,
  };
}

export class AnalysisService {
  // Save a new analysis to Supabase (with localStorage fallback)
  static async saveAnalysis(analysis: Analysis): Promise<{ success: boolean; error?: string; data?: Analysis }> {
    try {
      const row = analysisToRow(analysis);

      const { data, error } = await supabase
        .from('analyses')
        .upsert(row, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error('Error saving analysis to Supabase:', error);
        // Fallback to localStorage
        this.saveToLocalStorage(analysis);
        return { success: false, error: error.message };
      }

      console.log('Analysis saved to Supabase:', analysis.id);
      // Also save to localStorage as backup
      this.saveToLocalStorage(analysis);
      return { success: true, data: rowToAnalysis(data) };
    } catch (err: any) {
      console.error('Exception saving analysis:', err);
      // Fallback to localStorage
      this.saveToLocalStorage(analysis);
      return { success: false, error: err.message };
    }
  }

  // Get all analyses for a user (with localStorage fallback)
  static async getUserAnalyses(userId: string, limit = 50): Promise<{ success: boolean; data?: Analysis[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching analyses from Supabase:', error);
        // Fallback to localStorage
        const localData = this.getFromLocalStorage(userId);
        return { success: true, data: localData };
      }

      if (!data || data.length === 0) {
        // Check localStorage for any cached analyses
        const localAnalyses = this.getFromLocalStorage(userId);
        if (localAnalyses.length > 0) {
          console.log('No analyses in Supabase, using localStorage');
          return { success: true, data: localAnalyses };
        }
        return { success: true, data: [] };
      }

      console.log(`Fetched ${data.length} analyses from Supabase`);
      return { success: true, data: data.map(rowToAnalysis) };
    } catch (err: any) {
      console.error('Exception fetching analyses:', err);
      return { success: true, data: this.getFromLocalStorage(userId) };
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

      return handleSupabaseSuccess(data?.map(rowToAnalysis) || []);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  // Create a new analysis (legacy method - use saveAnalysis instead)
  static async createAnalysis(analysisData: {
    project_id?: string;
    user_id: string;
    website: string;
    keywords: string[];
    score: number;
    model?: string;
    metrics: any;
    insights: string;
    predicted_rank: number;
    category: string;
    recommendations: any[];
    is_simulated?: boolean;
    cost_info?: any;
    crawl_data?: any;
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

      return handleSupabaseSuccess(rowToAnalysis(data));
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  // Get analysis by ID
  static async getAnalysisById(analysisId: string): Promise<{ success: boolean; data?: Analysis; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (error) {
        console.error('Error fetching analysis:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: rowToAnalysis(data) };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Delete an analysis
  static async deleteAnalysis(analysisId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('analyses')
        .delete()
        .eq('id', analysisId);

      if (error) {
        console.error('Error deleting analysis:', error);
        return { success: false, error: error.message };
      }

      // Also remove from localStorage
      this.removeFromLocalStorage(analysisId);
      console.log('Analysis deleted:', analysisId);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
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

      return handleSupabaseSuccess(data?.map(rowToAnalysis) || []);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  // Check if an analysis exists for a website (to avoid duplicates)
  static async getExistingAnalysis(userId: string, website: string): Promise<Analysis | null> {
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', userId)
        .eq('website', website)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error checking existing analysis:', error);
        return null;
      }

      return data && data.length > 0 ? rowToAnalysis(data[0]) : null;
    } catch (err: any) {
      console.error('Exception checking existing analysis:', err);
      return null;
    }
  }

  // LocalStorage fallback methods
  static saveToLocalStorage(analysis: Analysis): void {
    try {
      const existing = JSON.parse(localStorage.getItem('analyses') || '[]');
      const filtered = existing.filter((a: Analysis) => a.id !== analysis.id);
      const updated = [analysis, ...filtered];
      localStorage.setItem('analyses', JSON.stringify(updated));
      localStorage.setItem('currentAnalysis', JSON.stringify(analysis));
    } catch (err) {
      console.error('Error saving to localStorage:', err);
    }
  }

  static getFromLocalStorage(userId: string): Analysis[] {
    try {
      const stored = JSON.parse(localStorage.getItem('analyses') || '[]');
      return stored.filter((a: Analysis) => a.userId === userId);
    } catch (err) {
      console.error('Error reading from localStorage:', err);
      return [];
    }
  }

  static removeFromLocalStorage(analysisId: string): void {
    try {
      const existing = JSON.parse(localStorage.getItem('analyses') || '[]');
      const updated = existing.filter((a: Analysis) => a.id !== analysisId);
      localStorage.setItem('analyses', JSON.stringify(updated));
    } catch (err) {
      console.error('Error removing from localStorage:', err);
    }
  }

  // Migrate localStorage analyses to Supabase (one-time migration)
  static async migrateFromLocalStorage(userId: string): Promise<number> {
    try {
      const localAnalyses = this.getFromLocalStorage(userId);
      if (localAnalyses.length === 0) {
        return 0;
      }

      console.log(`Attempting to migrate ${localAnalyses.length} analyses from localStorage`);
      let migrated = 0;

      for (const analysis of localAnalyses) {
        // Check if already exists in Supabase
        const { data: existing } = await supabase
          .from('analyses')
          .select('id')
          .eq('id', analysis.id)
          .single();

        if (!existing) {
          const result = await this.saveAnalysis(analysis);
          if (result.success) {
            migrated++;
          }
        }
      }

      console.log(`Migrated ${migrated} analyses from localStorage to Supabase`);
      return migrated;
    } catch (err) {
      console.error('Error migrating analyses:', err);
      return 0;
    }
  }

  // Clear localStorage after successful migration
  static clearLocalStorage(): void {
    try {
      localStorage.removeItem('analyses');
      localStorage.removeItem('currentAnalysis');
      console.log('Cleared analyses from localStorage');
    } catch (err) {
      console.error('Error clearing localStorage:', err);
    }
  }
}
