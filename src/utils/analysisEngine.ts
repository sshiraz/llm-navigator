// Analysis Engine - Handles both simulated and real analysis
import { Analysis, User, AEOAnalysis } from '../types';
import type { AnalysisProvider } from '../types';
import { CostTracker } from './costTracker';
import type { CrawlData, CrawlResult } from '../types/crawl';
import { supabase } from '../lib/supabase';

// Import from analysis modules
import {
  MODELS,
  DEFAULT_MODEL,
  SIMULATION_DELAY,
  REAL_ANALYSIS_DELAY,
  shouldUseRealAnalysis,
  calculateOverallScore,
  calculatePredictedRank,
  getCategoryFromScore,
  generateSimulatedInsights,
  generateSimulatedRecommendations,
  calculateRealMetrics,
  generateInsightsFromCrawl,
  generateIssuesFromCrawl,
  performRealAEOAnalysis,
  performSimulatedAEOAnalysis,
} from './analysis';
import { generateRecommendationsFromCrawl } from './analysis/recommendations';

export class AnalysisEngine {
  // Check if user should get real analysis
  static shouldUseRealAnalysis(user: User): boolean {
    return shouldUseRealAnalysis(user);
  }

  // Main analysis method that routes to simulation or real analysis
  static async analyzeWebsite(
    website: string,
    keywords: string[],
    user: User,
    modelKey: string = 'gpt-4'
  ): Promise<Analysis> {
    console.log('AnalysisEngine.analyzeWebsite called with:', { website, keywords, user });

    // Check usage limits first
    const usageCheck = await CostTracker.checkUsageLimits(user.id, user.subscription);
    if (!usageCheck.allowed) {
      // Allow admin users to bypass rate limits
      if (user.isAdmin === true) {
        console.log('Admin user bypassing rate limits');
      } else {
        throw new Error(usageCheck.resetTime ? `Rate limit exceeded. Try again at ${new Date(usageCheck.resetTime).toLocaleTimeString()}` : 'Rate limit exceeded');
      }
    }

    // Check rate limits
    const rateCheck = await CostTracker.checkRateLimit(user.id, user.subscription);
    if (!rateCheck.allowed) {
      if (user.isAdmin === true) {
        console.log('Admin user bypassing rate limits');
      } else {
        throw new Error(rateCheck.reason || 'Rate limit exceeded. Please try again later.');
      }
    }

    // Record this request for rate limiting
    CostTracker.recordRequest(user.id);

    // Determine if we should use real analysis
    const useRealAnalysis = this.shouldUseRealAnalysis(user);
    const analysisType = useRealAnalysis ? 'real' : 'simulated';

    // Validate the model key exists, otherwise use default
    if (!MODELS[modelKey]) {
      console.warn(`Model ${modelKey} not found, using default model ${DEFAULT_MODEL}`);
      modelKey = DEFAULT_MODEL;
    }

    const selectedModel = MODELS[modelKey];
    console.log(`Selected model for analysis: ${selectedModel.name} (${selectedModel.provider})`);

    // Track usage before analysis
    console.log('Tracking analysis usage for:', { userId: user.id, analysisType, website });
    const usage = await CostTracker.trackAnalysisUsage(
      user.id,
      analysisType,
      website,
      keywords,
      selectedModel.provider
    );

    try {
      if (analysisType === 'real') {
        return await this.performRealAnalysis(website, keywords, user, usage, selectedModel);
      } else {
        return await this.performSimulatedAnalysis(website, keywords, user, usage);
      }
    } catch (error) {
      console.error('Analysis failed in analyzeWebsite:', error);
      throw error;
    }
  }

  // AEO Analysis - Check AI citations for prompts
  static async analyzeAEO(
    website: string,
    prompts: { id: string; text: string }[],
    brandName: string | undefined,
    user: User,
    providers: AnalysisProvider[]
  ): Promise<AEOAnalysis> {
    console.log('AnalysisEngine.analyzeAEO called with:', { website, prompts, brandName, providers });

    // Check usage limits first
    const usageCheck = await CostTracker.checkUsageLimits(user.id, user.subscription);
    if (!usageCheck.allowed && user.isAdmin !== true) {
      throw new Error(usageCheck.reason || 'Usage limit exceeded');
    }

    // Check rate limits
    const rateCheck = await CostTracker.checkRateLimit(user.id, user.subscription);
    if (!rateCheck.allowed && user.isAdmin !== true) {
      throw new Error(rateCheck.reason || 'Rate limit exceeded. Please try again later.');
    }

    // Record this request for rate limiting
    CostTracker.recordRequest(user.id);

    // Determine if we should use real analysis
    const useRealAnalysis = this.shouldUseRealAnalysis(user);
    const analysisId = `aeo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      if (useRealAnalysis) {
        return await performRealAEOAnalysis(
          website, prompts, brandName, user, providers, analysisId,
          this.crawlWebsite.bind(this)
        );
      } else {
        return await performSimulatedAEOAnalysis(
          website, prompts, brandName, user, providers, analysisId
        );
      }
    } catch (error) {
      console.error('AEO Analysis failed:', error);
      throw error;
    }
  }

  // Simulated analysis for trial/free users
  private static async performSimulatedAnalysis(
    website: string,
    keywords: string[],
    user: User,
    usage: any
  ): Promise<Analysis> {
    console.log('Performing simulated analysis for:', website);
    // Show realistic loading time
    await new Promise(resolve => setTimeout(resolve, SIMULATION_DELAY));

    // Generate realistic but simulated scores
    const baseScore = 45 + Math.random() * 35; // 45-80 range
    const variance = 10; // ±10 points variance between metrics

    const metrics = {
      contentClarity: Math.max(20, Math.min(95, baseScore + (Math.random() - 0.5) * variance)),
      semanticRichness: Math.max(20, Math.min(95, baseScore + (Math.random() - 0.5) * variance)),
      structuredData: Math.max(15, Math.min(90, baseScore + (Math.random() - 0.5) * variance)),
      naturalLanguage: Math.max(25, Math.min(95, baseScore + (Math.random() - 0.5) * variance)),
      keywordRelevance: Math.max(30, Math.min(95, baseScore + (Math.random() - 0.5) * variance))
    };

    const overallScore = Math.round(
      (metrics.contentClarity + metrics.semanticRichness + metrics.structuredData +
       metrics.naturalLanguage + metrics.keywordRelevance) / 5
    );

    console.log('Simulated analysis complete with score:', overallScore);
    return {
      id: usage.analysisId,
      projectId: '1',
      userId: user.id,
      website,
      keywords,
      score: overallScore,
      metrics: {
        contentClarity: Math.round(metrics.contentClarity),
        semanticRichness: Math.round(metrics.semanticRichness),
        structuredData: Math.round(metrics.structuredData),
        naturalLanguage: Math.round(metrics.naturalLanguage),
        keywordRelevance: Math.round(metrics.keywordRelevance)
      },
      insights: generateSimulatedInsights(website, overallScore),
      predictedRank: calculatePredictedRank(overallScore),
      category: getCategoryFromScore(overallScore),
      recommendations: generateSimulatedRecommendations(metrics),
      createdAt: new Date().toISOString(),
      isSimulated: true,
      costInfo: {
        totalCost: usage.costs.total,
        breakdown: usage.costs,
        tokensUsed: usage.tokens
      }
    };
  }

  // Real analysis for paid users
  private static async performRealAnalysis(
    website: string,
    keywords: string[],
    user: User,
    usage: any,
    model: typeof MODELS[string]
  ): Promise<Analysis> {
    console.log(`Performing real analysis for ${website} using ${model.name} (${model.provider})`);
    // Show longer loading time for real analysis
    await new Promise(resolve => setTimeout(resolve, REAL_ANALYSIS_DELAY));

    try {
      // Step 1: Crawl website content (real API call)
      const crawlData = await this.crawlWebsite(website, keywords, model);

      // Step 2: Calculate metrics from real crawl data
      const metrics = calculateRealMetrics(crawlData);
      const overallScore = calculateOverallScore(metrics);

      // Step 3: Generate insights from real data
      const insights = generateInsightsFromCrawl(crawlData, metrics);

      // Step 4: Generate issues list from crawl data
      const issues = generateIssuesFromCrawl(crawlData);

      console.log('Real analysis complete with score:', overallScore);
      return {
        id: usage.analysisId,
        projectId: '1',
        userId: user.id,
        website,
        keywords,
        score: overallScore,
        metrics,
        insights,
        predictedRank: calculatePredictedRank(overallScore),
        category: getCategoryFromScore(overallScore),
        recommendations: generateRecommendationsFromCrawl(crawlData, metrics),
        createdAt: new Date().toISOString(),
        isSimulated: false,
        costInfo: {
          totalCost: usage.costs.total,
          breakdown: usage.costs,
          tokensUsed: usage.tokens
        },
        // Include crawl data for page details display
        crawlData: {
          url: crawlData.url,
          title: crawlData.title,
          metaDescription: crawlData.metaDescription,
          headings: crawlData.headings.map(h => ({
            level: h.level,
            text: h.text,
            hasDirectAnswer: h.hasDirectAnswer
          })),
          schemaTypes: crawlData.schemaMarkup.map(s => s.type),
          contentStats: crawlData.contentStats,
          technicalSignals: crawlData.technicalSignals,
          issues,
          // Multi-page crawl data
          pagesAnalyzed: crawlData.pagesAnalyzed,
          pages: crawlData.pages
        }
      };
    } catch (error) {
      console.error('Real analysis failed, falling back to simulation:', error);
      // Fallback to simulated analysis if real analysis fails
      return this.performSimulatedAnalysis(website, keywords, user, usage);
    }
  }

  // Real website crawling via edge function
  private static async crawlWebsite(
    website: string,
    keywords: string[],
    model: typeof MODELS[string]
  ): Promise<CrawlData> {
    console.log(`Crawling website ${website} with ${model.name}`);

    try {
      // Use Supabase client's functions.invoke for proper authentication
      const { data, error } = await supabase.functions.invoke('crawl-website', {
        body: { url: website, keywords },
      });

      if (error) {
        throw new Error(`Crawl failed: ${error.message}`);
      }

      const result: CrawlResult = data;

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Crawl returned no data');
      }

      console.log('Crawl successful:', {
        title: result.data.title,
        headingsCount: result.data.headings.length,
        schemaCount: result.data.schemaMarkup.length,
        blufScore: result.data.blufAnalysis.score,
      });

      return result.data;
    } catch (error) {
      console.error('Crawl error:', error);
      throw error;
    }
  }
}

// Cost tracking for real analysis
export class AnalysisCostTracker {
  private static costs = {
    crawling: 0.03,
    technicalAnalysis: 0.001,
    semanticAnalysis: 0.02,
    insightsGeneration: 0.15,
    total: 0.201
  };

  static getCostPerAnalysis(): number {
    return this.costs.total;
  }

  static getMonthlyBudget(plan: string): number {
    const budgets: Record<string, number> = {
      starter: 10 * this.costs.total,      // 10 analyses
      professional: 50 * this.costs.total, // 50 analyses
      enterprise: 400 * this.costs.total   // 400 analyses
    };

    return budgets[plan] || 0;
  }

  static estimateTokens(website: string, keywords: string[]): {
    input: number;
    output: number;
    embeddings: number;
  } {
    // Estimate based on typical content
    const baseContentTokens = 2000;
    const keywordTokens = keywords.join(' ').length * 1.3;
    const systemPromptTokens = 500;

    return {
      input: Math.round(baseContentTokens + keywordTokens + systemPromptTokens),
      output: 800,
      embeddings: Math.round(baseContentTokens * 0.75)
    };
  }
}
