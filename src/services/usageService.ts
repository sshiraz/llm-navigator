import { supabase, handleSupabaseError, handleSupabaseSuccess } from '../lib/supabase';

export class UsageService {
  // Track API usage
  static async trackUsage(usageData: {
    user_id: string;
    analysis_id: string;
    costs: any;
    tokens: any;
    provider: 'openai' | 'anthropic' | 'local';
    success: boolean;
    error_code?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('api_usage')
        .insert(usageData)
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

  // Get user usage statistics
  static async getUserUsage(userId: string, timeframe = '30 days') {
    try {
      const { data, error } = await supabase
        .from('api_usage')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false });

      if (error) {
        return handleSupabaseError(error);
      }

      // Calculate usage statistics
      const totalCost = data.reduce((sum, usage) => sum + (usage.costs?.total || 0), 0);
      const totalAnalyses = data.length;
      const totalTokens = data.reduce((sum, usage) => 
        sum + (usage.tokens?.input || 0) + (usage.tokens?.output || 0) + (usage.tokens?.embeddings || 0), 0
      );

      return handleSupabaseSuccess({
        usage: data,
        statistics: {
          totalCost,
          totalAnalyses,
          totalTokens,
          averageCostPerAnalysis: totalAnalyses > 0 ? totalCost / totalAnalyses : 0
        }
      });
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  // Get usage analytics for admin dashboard
  static async getUsageAnalytics(timeframe = '30 days') {
    try {
      const { data, error } = await supabase
        .from('api_usage')
        .select(`
          *,
          users (subscription)
        `)
        .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false });

      if (error) {
        return handleSupabaseError(error);
      }

      // Calculate analytics
      const totalCost = data.reduce((sum, usage) => sum + (usage.costs?.total || 0), 0);
      const totalAnalyses = data.length;
      const successfulAnalyses = data.filter(usage => usage.success).length;
      const errorRate = totalAnalyses > 0 ? (totalAnalyses - successfulAnalyses) / totalAnalyses : 0;

      // Top users by cost
      const userCosts = data.reduce((acc, usage) => {
        if (!acc[usage.user_id]) {
          acc[usage.user_id] = { cost: 0, analyses: 0 };
        }
        acc[usage.user_id].cost += usage.costs?.total || 0;
        acc[usage.user_id].analyses += 1;
        return acc;
      }, {} as Record<string, { cost: number; analyses: number }>);

      const topUsers = Object.entries(userCosts)
        .map(([userId, stats]) => ({ userId, ...stats }))
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 10);

      // Cost breakdown
      const costBreakdown = data.reduce(
        (acc, usage) => ({
          crawling: acc.crawling + (usage.costs?.crawling || 0),
          embeddings: acc.embeddings + (usage.costs?.embeddings || 0),
          insights: acc.insights + (usage.costs?.insights || 0)
        }),
        { crawling: 0, embeddings: 0, insights: 0 }
      );

      return handleSupabaseSuccess({
        totalCost,
        totalAnalyses,
        averageCostPerAnalysis: totalAnalyses > 0 ? totalCost / totalAnalyses : 0,
        errorRate,
        topUsers,
        costBreakdown
      });
    } catch (error) {
      return handleSupabaseError(error);
    }
  }
}