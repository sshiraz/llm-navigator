import React from 'react';
import type { AnalysisProvider } from '../types';

// API Cost Tracking and Usage Monitoring
export interface ApiUsage {
  userId: string;
  analysisId: string;
  timestamp: string;
  costs: {
    crawling: number;
    embeddings: number;
    insights: number;
    total: number;
  };
  tokens: {
    input: number;
    output: number;
    embeddings: number;
  };
  provider: AnalysisProvider;
  success: boolean;
  errorCode?: string;
}

export interface UsageLimits {
  plan: string;
  monthlyAnalyses: number;
  monthlyBudget: number;
  currentUsage: {
    analyses: number;
    cost: number;
    tokens: number;
  };
  resetDate: string;
}

export class CostTracker {
  private static readonly API_COSTS = {
    // OpenAI API costs (per 1K tokens)
    gpt4_input: 0.03,
    gpt4_output: 0.06,
    gpt35_input: 0.0015,
    gpt35_output: 0.002,
    embeddings: 0.0001,
    
    // Anthropic API costs (per 1K tokens)
    claude3_opus_input: 0.015,
    claude3_opus_output: 0.075,
    claude3_sonnet_input: 0.003,
    claude3_sonnet_output: 0.015,
    claude3_haiku_input: 0.00025,
    claude3_haiku_output: 0.00125,
    
    // Perplexity API costs (per 1K tokens)
    perplexity_online_input: 0.002,
    perplexity_online_output: 0.01,
    perplexity_offline_input: 0.001,
    perplexity_offline_output: 0.005,
    
    // Third-party service costs
    crawling_per_page: 0.001,
    proxy_per_request: 0.0005,
    
    // Estimated costs per analysis
    analysis_base: 0.20,
    competitor_analysis: 0.05,
    pdf_generation: 0.001
  };

  private static readonly PLAN_LIMITS = {
    free: { analyses: 999999, budget: 999999 }, // Unlimited for demo
    trial: { analyses: 999999, budget: 999999 }, // Unlimited for demo
    starter: { analyses: 10, budget: 2.00 },
    professional: { analyses: 50, budget: 10.00 },
    enterprise: { analyses: 1000, budget: 200.00 }
  };

  // Track API usage for an analysis
  static async trackAnalysisUsage(
    userId: string,
    analysisType: string,
    website: string,
    keywords: string[]
  ): Promise<ApiUsage> {
    console.log('CostTracker.trackAnalysisUsage called with:', { userId, analysisType, website });
    const analysisId = `analysis_${Date.now()}`;
    const timestamp = new Date().toISOString();

    if (analysisType === 'simulated') {
      return {
        userId,
        analysisId,
        timestamp,
        costs: { crawling: 0, embeddings: 0, insights: 0, total: 0.001 },
        tokens: { input: 0, output: 0, embeddings: 0 },
        provider: 'local',
        success: true
      };
    }

    // Calculate real analysis costs
    const estimatedTokens = this.estimateTokenUsage(website, keywords);
    const costs = this.calculateCosts(estimatedTokens);

    console.log('Generated usage data:', { analysisId, costs });
    const usage: ApiUsage = {
      userId,
      analysisId,
      timestamp,
      costs,
      tokens: estimatedTokens,
      provider: 'openai',
      success: true
    };

    console.log('Storing usage data in localStorage');
    // Store usage in database (simulated)
    await this.storeUsage(usage);
    
    return usage;
  }

  // Estimate token usage for an analysis
  private static estimateTokenUsage(website: string, keywords: string[]) {
    // Rough estimates based on typical analysis
    console.log('Estimating token usage for:', website);
    const contentTokens = 2000; // Average webpage content
    const keywordTokens = keywords.join(' ').length * 1.3; // ~1.3 tokens per character
    const systemPromptTokens = 500; // Analysis prompt
    
    return {
      input: Math.round(contentTokens + keywordTokens + systemPromptTokens),
      output: Math.round(800), // Typical insights response
      embeddings: Math.round(contentTokens * 0.75) // Embeddings for semantic analysis
    };
  }

  // Calculate costs based on token usage
  private static calculateCosts(tokens: { input: number; output: number; embeddings: number }) {
    console.log('Calculating costs for tokens:', tokens);
    const crawling = 0.03; // Fixed crawling cost
    const embeddings = (tokens.embeddings / 1000) * this.API_COSTS.embeddings;
    const insights = (tokens.input / 1000) * this.API_COSTS.gpt4_input + 
                    (tokens.output / 1000) * this.API_COSTS.gpt4_output;
    
    return {
      crawling,
      embeddings: Math.round(embeddings * 1000) / 1000,
      insights: Math.round(insights * 1000) / 1000,
      total: Math.round((crawling + embeddings + insights) * 1000) / 1000
    };
  }

  // Check if user can perform analysis within limits
  static async checkUsageLimits(userId: string, userPlan: string): Promise<{
    allowed: boolean;
    reason?: string;
    currentUsage: UsageLimits;
  }> {
    console.log('Checking usage limits for:', userId, userPlan);
    const limits = this.PLAN_LIMITS[userPlan as keyof typeof this.PLAN_LIMITS];
    if (!limits) {
      // Check if user is admin from localStorage
      try {
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.isAdmin === true) {
            // Admin users have unlimited access
            return {
              allowed: true,
              currentUsage: this.getDefaultUsage('enterprise')
            };
          }
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
      
      return {
        allowed: false,
        reason: 'Invalid plan',
        currentUsage: this.getDefaultUsage(userPlan)
      };
    }

    const currentUsage = await this.getCurrentUsage(userId);
    
    console.log('Current usage:', currentUsage, 'Limits:', limits);
    
    // Check if user is admin from localStorage
    let isAdmin = false;
    try {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        isAdmin = user.isAdmin === true;
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
    
    // For demo accounts (free/trial) or admin users, always allow unlimited usage
    if (userPlan === 'free' || userPlan === 'trial' || isAdmin || userId === 'demo-user-123') {
      return {
        allowed: true,
        currentUsage: this.formatUsageLimits(userPlan, currentUsage)
      };
    }
    
    // Check analysis count limit for paid plans
    if (currentUsage.analyses >= limits.analyses) {
      return {
        allowed: false,
        reason: `Monthly analysis limit reached (${limits.analyses}). Upgrade your plan or wait for next billing cycle.`,
        currentUsage: this.formatUsageLimits(userPlan, currentUsage)
      };
    }

    // Check budget limit for paid plans
    const estimatedCost = this.API_COSTS.analysis_base;
    if (currentUsage.cost + estimatedCost > limits.budget) {
      return {
        allowed: false,
        reason: `Monthly budget limit would be exceeded ($${limits.budget}). Upgrade your plan for higher limits.`,
        currentUsage: this.formatUsageLimits(userPlan, currentUsage)
      };
    }

    return {
      allowed: true,
      currentUsage: this.formatUsageLimits(userPlan, currentUsage)
    };
  }

  // Get current month usage for user
  private static async getCurrentUsage(userId: string): Promise<{
    analyses: number;
    cost: number;
    tokens: number;
  }> {
    console.log('Getting current usage for user:', userId);
    // In production, query database for current month usage
    // For demo, return minimal usage to show unlimited capability
    const mockUsage = {
      analyses: Math.floor(Math.random() * 3), // 0-2 analyses used (low for demo)
      cost: Math.round(Math.random() * 0.5 * 100) / 100, // $0.00-$0.50 used
      tokens: Math.floor(Math.random() * 5000) // 0-5k tokens used
    };

    console.log('Generated mock usage data for user:', userId);
    return mockUsage;
  }

  // Format usage limits for display
  private static formatUsageLimits(plan: string, usage: any): UsageLimits {
    console.log('Formatting usage limits for plan:', plan);
    const limits = this.PLAN_LIMITS[plan as keyof typeof this.PLAN_LIMITS];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
    nextMonth.setHours(0, 0, 0, 0);

    return {
      plan,
      monthlyAnalyses: limits?.analyses || 0,
      monthlyBudget: limits?.budget || 0,
      currentUsage: usage,
      resetDate: nextMonth.toISOString()
    };
  }

  private static getDefaultUsage(plan: string): UsageLimits {
    return this.formatUsageLimits(plan, { analyses: 0, cost: 0, tokens: 0 });
  }

  // Store usage in database (simulated)
  private static async storeUsage(usage: ApiUsage): Promise<void> {
    console.log('Storing API usage in localStorage');
    // In production: Store in database
    console.log('Storing API usage:', usage);
    
    // Simulate database storage
    const existingUsage = JSON.parse(localStorage.getItem('api_usage') || '[]');
    existingUsage.push(usage);
    localStorage.setItem('api_usage', JSON.stringify(existingUsage));
  }

  // Get usage analytics for admin dashboard
  static async getUsageAnalytics(timeframe: 'day' | 'week' | 'month' = 'month'): Promise<{
    totalCost: number;
    totalAnalyses: number;
    averageCostPerAnalysis: number;
    topUsers: Array<{ userId: string; cost: number; analyses: number }>;
    costBreakdown: { crawling: number; embeddings: number; insights: number };
    errorRate: number;
  }> {
    console.log('Getting usage analytics for timeframe:', timeframe);
    // In production: Query database for analytics
    const usage = JSON.parse(localStorage.getItem('api_usage') || '[]') as ApiUsage[];
    
    const totalCost = usage.reduce((sum, u) => sum + u.costs.total, 0);
    const totalAnalyses = usage.length;
    const successfulAnalyses = usage.filter(u => u.success).length;
    
    return {
      totalCost: Math.round(totalCost * 100) / 100,
      totalAnalyses,
      averageCostPerAnalysis: totalAnalyses > 0 ? Math.round((totalCost / totalAnalyses) * 100) / 100 : 0,
      topUsers: this.getTopUsers(usage),
      costBreakdown: this.getCostBreakdown(usage),
      errorRate: totalAnalyses > 0 ? Math.round(((totalAnalyses - successfulAnalyses) / totalAnalyses) * 100) / 100 : 0
    };
  }

  private static getTopUsers(usage: ApiUsage[]) {
    console.log('Calculating top users from usage data');
    const userStats = usage.reduce((acc, u) => {
      if (!acc[u.userId]) {
        acc[u.userId] = { cost: 0, analyses: 0 };
      }
      acc[u.userId].cost += u.costs.total;
      acc[u.userId].analyses += 1;
      return acc;
    }, {} as Record<string, { cost: number; analyses: number }>);

    return Object.entries(userStats)
      .map(([userId, stats]) => ({ userId, ...stats }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);
  }

  private static getCostBreakdown(usage: ApiUsage[]) {
    console.log('Calculating cost breakdown from usage data');
    return usage.reduce(
      (acc, u) => ({
        crawling: acc.crawling + u.costs.crawling,
        embeddings: acc.embeddings + u.costs.embeddings,
        insights: acc.insights + u.costs.insights
      }),
      { crawling: 0, embeddings: 0, insights: 0 }
    );
  }

  // Rate limiting to prevent abuse
  static async checkRateLimit(userId: string): Promise<{
    allowed: boolean;
    resetTime?: number;
    remaining?: number;
  }> {
    console.log('Checking rate limit for user:', userId);
    // For demo accounts, always allow unlimited rate
    return {
      allowed: true,
      remaining: 999
    };
  }

  // Cost optimization suggestions
  static getCostOptimizationSuggestions(usage: ApiUsage[]): string[] {
    console.log('Generating cost optimization suggestions');
    const suggestions = [];
    const totalCost = usage.reduce((sum, u) => sum + u.costs.total, 0);
    const avgCost = totalCost / usage.length;

    if (avgCost > 0.25) {
      suggestions.push('Consider caching analysis results for similar websites to reduce API costs');
    }

    const errorRate = usage.filter(u => !u.success).length / usage.length;
    if (errorRate > 0.1) {
      suggestions.push('High error rate detected - implement better error handling to avoid wasted API calls');
    }

    const embeddingsCost = usage.reduce((sum, u) => sum + u.costs.embeddings, 0);
    if (embeddingsCost > totalCost * 0.3) {
      suggestions.push('Embeddings costs are high - consider batch processing or content summarization');
    }

    return suggestions;
  }
}

// Usage monitoring hook for React components
export const useUsageMonitoring = (userId: string, userPlan: string) => {
  const [usageLimits, setUsageLimits] = React.useState<UsageLimits | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const checkLimits = async () => {
      try {
        const result = await CostTracker.checkUsageLimits(userId, userPlan);
        setUsageLimits(result.currentUsage);
      } catch (error) {
        console.error('Failed to check usage limits:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkLimits();
  }, [userId, userPlan]);

  return { usageLimits, isLoading };
};