// Analysis Engine - Handles both simulated and real analysis
import { Analysis, User, AEOAnalysis, Prompt, CitationResult, AEORecommendation, CompetitorCitation } from '../types';
import type { AnalysisProvider } from '../types';
import { CostTracker } from './costTracker';
import type { CrawlData, CrawlResult } from '../types/crawl';
import { supabase } from '../lib/supabase';

// Model configuration
interface ModelConfig {
  provider: AnalysisProvider;
  name: string;
  inputCost: number;
  outputCost: number;
  embeddingCost: number;
  capabilities: {
    webCrawling: boolean;
    structuredOutput: boolean;
    semanticAnalysis: boolean;
  };
}

export class AnalysisEngine {
  private static readonly SIMULATION_DELAY = 2000; // 2 seconds for realistic feel
  private static readonly REAL_ANALYSIS_DELAY = 3000; // 3 seconds initial delay (actual crawl takes additional time)
  
  // Available models configuration
  private static readonly MODELS: Record<string, ModelConfig> = {
    'gpt-4': {
      provider: 'openai',
      name: 'GPT-4',
      inputCost: 0.03,
      outputCost: 0.06,
      embeddingCost: 0.0001,
      capabilities: {
        webCrawling: true,
        structuredOutput: true,
        semanticAnalysis: true
      }
    },
    'gpt-4-professional': {
      provider: 'openai',
      name: 'GPT-4 Professional',
      inputCost: 0.04,
      outputCost: 0.08,
      embeddingCost: 0.0001,
      capabilities: {
        webCrawling: true,
        structuredOutput: true,
        semanticAnalysis: true
      }
    },
    'claude-3-opus': {
      provider: 'anthropic',
      name: 'Claude 3 Opus',
      inputCost: 0.015,
      outputCost: 0.075,
      embeddingCost: 0.0001, // Using OpenAI embeddings with Claude
      capabilities: {
        webCrawling: true,
        structuredOutput: true,
        semanticAnalysis: true
      }
    },
    'claude-3-sonnet': {
      provider: 'anthropic',
      name: 'Claude 3 Sonnet',
      inputCost: 0.003,
      outputCost: 0.015,
      embeddingCost: 0.0001, // Using OpenAI embeddings with Claude
      capabilities: {
        webCrawling: true,
        structuredOutput: true,
        semanticAnalysis: true
      }
    },
    'claude-3-haiku': {
      provider: 'anthropic',
      name: 'Claude 3 Haiku',
      inputCost: 0.00025,
      outputCost: 0.00125,
      embeddingCost: 0.0001, // Using OpenAI embeddings with Claude
      capabilities: {
        webCrawling: true,
        structuredOutput: true,
        semanticAnalysis: true
      }
    },
    'perplexity-online': {
      provider: 'perplexity',
      name: 'Perplexity Online',
      inputCost: 0.002,
      outputCost: 0.01,
      embeddingCost: 0.0001, // Using OpenAI embeddings with Perplexity
      capabilities: {
        webCrawling: true,
        structuredOutput: false,
        semanticAnalysis: true
      }
    },
    'perplexity-offline': {
      provider: 'perplexity',
      name: 'Perplexity Offline',
      inputCost: 0.001,
      outputCost: 0.005,
      embeddingCost: 0.0001, // Using OpenAI embeddings with Perplexity
      capabilities: {
        webCrawling: false,
        structuredOutput: false,
        semanticAnalysis: true
      }
    }
  };
  
  // Default model to use
  private static readonly DEFAULT_MODEL = 'gpt-4-professional';

  // Check if user should get real analysis
  static shouldUseRealAnalysis(user: User): boolean {
    // Admin users, paid plans, and demo users get real analysis
    return ['starter', 'professional', 'enterprise'].includes(user.subscription) || 
           user.isAdmin === true || 
           user.email === 'demo@example.com';
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
    if (!this.MODELS[modelKey]) {
      console.warn(`Model ${modelKey} not found, using default model ${this.DEFAULT_MODEL}`);
      modelKey = this.DEFAULT_MODEL;
    }
    
    const selectedModel = this.MODELS[modelKey];
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
      // Update usage record with error
      console.error('Analysis failed:', error);
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
        return await this.performRealAEOAnalysis(website, prompts, brandName, user, providers, analysisId);
      } else {
        return await this.performSimulatedAEOAnalysis(website, prompts, brandName, user, providers, analysisId);
      }
    } catch (error) {
      console.error('AEO Analysis failed:', error);
      throw error;
    }
  }

  // Real AEO analysis - actually queries AI providers
  private static async performRealAEOAnalysis(
    website: string,
    prompts: { id: string; text: string }[],
    brandName: string | undefined,
    user: User,
    providers: AnalysisProvider[],
    analysisId: string
  ): Promise<AEOAnalysis> {
    console.log('Performing real AEO analysis...');

    // Step 1: Crawl website for content analysis
    let crawlData: CrawlData | undefined;
    try {
      crawlData = await this.crawlWebsite(website, [], this.MODELS['gpt-4']);
    } catch (error) {
      console.warn('Crawl failed, continuing without crawl data:', error);
    }

    // Step 2: Call check-citations edge function
    const citationResults: CitationResult[] = [];
    let totalCost = 0.03; // Base crawl cost

    try {
      const { data, error } = await supabase.functions.invoke('check-citations', {
        body: {
          prompts: prompts.map(p => ({ id: p.id, text: p.text })),
          website,
          brandName,
          providers: providers.filter(p => p !== 'local')
        }
      });

      if (error) {
        throw new Error(`Citation check failed: ${error.message}`);
      }

      if (data.success && data.data.results) {
        citationResults.push(...data.data.results);
        totalCost += data.data.summary.totalCost;
      }
    } catch (error) {
      console.error('Citation check failed:', error);
      throw error;
    }

    // Step 3: Calculate citation rate
    const citedCount = citationResults.filter(r => r.isCited).length;
    const overallCitationRate = citationResults.length > 0
      ? (citedCount / citationResults.length) * 100
      : 0;

    // Step 4: Generate content analysis scores
    const contentAnalysis = crawlData ? {
      blufScore: crawlData.blufAnalysis.score,
      schemaScore: Math.min(100, crawlData.schemaMarkup.length * 20),
      readabilityScore: crawlData.contentStats.readabilityScore,
      contentDepth: Math.min(100, Math.round(crawlData.contentStats.wordCount / 30))
    } : {
      blufScore: 50,
      schemaScore: 30,
      readabilityScore: 60,
      contentDepth: 40
    };

    // Step 5: Generate AEO recommendations
    const recommendations = this.generateAEORecommendations(
      citationResults,
      contentAnalysis,
      crawlData,
      prompts
    );

    return {
      id: analysisId,
      userId: user.id,
      website,
      brandName,
      prompts: prompts.map(p => ({ id: p.id, text: p.text })),
      citationResults,
      overallCitationRate,
      providersUsed: providers.filter(p => p !== 'local'),
      contentAnalysis,
      crawlData: crawlData ? {
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
        issues: [],
        pagesAnalyzed: crawlData.pagesAnalyzed,
        pages: crawlData.pages
      } : undefined,
      recommendations,
      createdAt: new Date().toISOString(),
      isSimulated: false,
      costInfo: {
        totalCost,
        breakdown: {
          crawling: 0.03,
          citationChecks: totalCost - 0.03,
          total: totalCost
        }
      }
    };
  }

  // Simulated AEO analysis for trial/demo users
  private static async performSimulatedAEOAnalysis(
    website: string,
    prompts: { id: string; text: string }[],
    brandName: string | undefined,
    user: User,
    providers: AnalysisProvider[],
    analysisId: string
  ): Promise<AEOAnalysis> {
    console.log('Performing simulated AEO analysis...');

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate simulated citation results
    const citationResults: CitationResult[] = [];
    const activeProviders = providers.filter(p => p !== 'local');

    // Simulated competitor domains
    const competitorDomains = [
      'hubspot.com', 'mailchimp.com', 'salesforce.com', 'zendesk.com',
      'intercom.com', 'drift.com', 'freshworks.com', 'zoho.com'
    ];

    for (const prompt of prompts) {
      for (const provider of activeProviders) {
        // ~40% chance of being cited in simulated mode
        const isCited = Math.random() < 0.4;

        // Generate 2-4 competitor citations
        const numCompetitors = 2 + Math.floor(Math.random() * 3);
        const competitorsCited: CompetitorCitation[] = [];
        const shuffledCompetitors = [...competitorDomains].sort(() => Math.random() - 0.5);

        for (let i = 0; i < numCompetitors; i++) {
          competitorsCited.push({
            domain: shuffledCompetitors[i],
            context: `${shuffledCompetitors[i]} was mentioned as a leading solution...`,
            position: i + 1
          });
        }

        citationResults.push({
          promptId: prompt.id,
          prompt: prompt.text,
          provider,
          modelUsed: provider === 'openai' ? 'gpt-4o' : provider === 'anthropic' ? 'claude-3-haiku' : 'sonar',
          response: `[Simulated ${provider} response for demo purposes. This is sample content showing how the AI might respond to "${prompt.text}"]`,
          isCited,
          citationContext: isCited ? `...${brandName || website} offers excellent solutions for this...` : undefined,
          competitorsCited,
          timestamp: new Date().toISOString(),
          tokensUsed: 500 + Math.floor(Math.random() * 500),
          cost: 0.02
        });
      }
    }

    const citedCount = citationResults.filter(r => r.isCited).length;
    const overallCitationRate = (citedCount / citationResults.length) * 100;

    // Simulated content analysis
    const contentAnalysis = {
      blufScore: 40 + Math.floor(Math.random() * 30),
      schemaScore: 20 + Math.floor(Math.random() * 40),
      readabilityScore: 50 + Math.floor(Math.random() * 30),
      contentDepth: 35 + Math.floor(Math.random() * 35)
    };

    // Generate recommendations
    const recommendations = this.generateAEORecommendations(
      citationResults,
      contentAnalysis,
      undefined,
      prompts
    );

    return {
      id: analysisId,
      userId: user.id,
      website,
      brandName,
      prompts: prompts.map(p => ({ id: p.id, text: p.text })),
      citationResults,
      overallCitationRate,
      providersUsed: activeProviders,
      contentAnalysis,
      recommendations,
      createdAt: new Date().toISOString(),
      isSimulated: true,
      costInfo: {
        totalCost: 0,
        breakdown: {
          crawling: 0,
          citationChecks: 0,
          total: 0
        }
      }
    };
  }

  // Generate AEO-specific recommendations
  private static generateAEORecommendations(
    citationResults: CitationResult[],
    contentAnalysis: AEOAnalysis['contentAnalysis'],
    crawlData: CrawlData | undefined,
    prompts: { id: string; text: string }[]
  ): AEORecommendation[] {
    const recommendations: AEORecommendation[] = [];

    const citedCount = citationResults.filter(r => r.isCited).length;
    const citationRate = citationResults.length > 0 ? (citedCount / citationResults.length) * 100 : 0;

    // Find which prompts weren't cited
    const uncitedPrompts = prompts.filter(p =>
      !citationResults.some(r => r.promptId === p.id && r.isCited)
    );

    // Find top competitors
    const competitorCounts: Record<string, number> = {};
    citationResults.forEach(r => {
      r.competitorsCited.forEach(c => {
        competitorCounts[c.domain] = (competitorCounts[c.domain] || 0) + 1;
      });
    });
    const topCompetitors = Object.entries(competitorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([domain]) => domain);

    // Recommendation 1: If low citation rate
    if (citationRate < 30) {
      recommendations.push({
        id: 'aeo-1',
        title: 'Increase Your AI Visibility',
        description: `You were cited in only ${Math.round(citationRate)}% of queries. To improve:\n\n` +
          `1. Create content that directly answers the questions in your prompts\n` +
          `2. Use clear, factual language that AI can quote\n` +
          `3. Add schema markup to help AI verify your expertise`,
        priority: 'high',
        difficulty: 'medium',
        estimatedTime: '2-4 hours',
        expectedImpact: 'Could increase citation rate by 20-40%',
        relatedPrompts: uncitedPrompts.slice(0, 3).map(p => p.id)
      });
    }

    // Recommendation 2: Schema if low
    if (contentAnalysis.schemaScore < 40) {
      recommendations.push({
        id: 'aeo-2',
        title: 'Add Structured Data for AI Recognition',
        description: `AI assistants use schema.org markup to verify information. Add:\n\n` +
          `• Organization schema (who you are)\n` +
          `• FAQPage schema (for Q&A content)\n` +
          `• Product/Service schema (what you offer)\n\n` +
          `This helps AI trust and cite your content.`,
        priority: 'high',
        difficulty: 'medium',
        estimatedTime: '1-2 hours',
        expectedImpact: 'Increase AI trust score by ~25%',
        relatedPrompts: []
      });
    }

    // Recommendation 3: BLUF if low
    if (contentAnalysis.blufScore < 50) {
      recommendations.push({
        id: 'aeo-3',
        title: 'Put Answers First (BLUF Format)',
        description: `AI extracts the first 1-2 sentences after headings. Currently, many of your sections bury the main point.\n\n` +
          `For each section:\n` +
          `• Start with a direct answer or key fact\n` +
          `• Then provide supporting details\n` +
          `• Use "In short," or "The answer is" to signal conclusions`,
        priority: 'high',
        difficulty: 'easy',
        estimatedTime: '1-2 hours',
        expectedImpact: 'Improve citation rate by 15-25%',
        relatedPrompts: []
      });
    }

    // Recommendation 4: Analyze top competitors
    if (topCompetitors.length > 0) {
      recommendations.push({
        id: 'aeo-4',
        title: 'Study What Competitors Are Doing Right',
        description: `These sites were frequently cited instead of you:\n\n` +
          topCompetitors.map((c, i) => `${i + 1}. ${c}`).join('\n') +
          `\n\nAnalyze their content to see:\n` +
          `• How they structure answers\n` +
          `• What schema markup they use\n` +
          `• How they establish expertise`,
        priority: 'medium',
        difficulty: 'easy',
        estimatedTime: '1 hour',
        expectedImpact: 'Learn citation-winning strategies',
        relatedPrompts: []
      });
    }

    // Recommendation 5: Create targeted content
    if (uncitedPrompts.length > 0) {
      const promptExamples = uncitedPrompts.slice(0, 2).map(p => `"${p.text}"`).join(' and ');
      recommendations.push({
        id: 'aeo-5',
        title: 'Create Content for Uncited Prompts',
        description: `You weren't cited for prompts like ${promptExamples}.\n\n` +
          `Create dedicated pages or sections that directly answer these questions:\n` +
          `• Use the question as a heading\n` +
          `• Provide a clear, authoritative answer\n` +
          `• Include supporting data and examples`,
        priority: 'high',
        difficulty: 'medium',
        estimatedTime: '2-3 hours per prompt',
        expectedImpact: 'Target specific citation opportunities',
        relatedPrompts: uncitedPrompts.map(p => p.id)
      });
    }

    // Recommendation 6: Readability if low
    if (contentAnalysis.readabilityScore < 50) {
      recommendations.push({
        id: 'aeo-6',
        title: 'Simplify Your Writing for AI',
        description: `Complex writing makes it harder for AI to extract and cite your content.\n\n` +
          `Improve readability by:\n` +
          `• Using shorter sentences (15-20 words)\n` +
          `• Replacing jargon with common terms\n` +
          `• Breaking up long paragraphs\n` +
          `• Using bullet points for lists`,
        priority: 'medium',
        difficulty: 'easy',
        estimatedTime: '1-2 hours',
        expectedImpact: 'Improve citation accuracy by 10-15%',
        relatedPrompts: []
      });
    }

    return recommendations.slice(0, 6);
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
    await new Promise(resolve => setTimeout(resolve, this.SIMULATION_DELAY));

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
      insights: this.generateSimulatedInsights(website, overallScore),
      predictedRank: this.calculatePredictedRank(overallScore),
      category: this.getCategoryFromScore(overallScore),
      recommendations: this.generateSimulatedRecommendations(metrics),
      createdAt: new Date().toISOString(),
      isSimulated: true, // Flag to indicate this is simulated data
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
    model: ModelConfig
  ): Promise<Analysis> {
    console.log(`Performing real analysis for ${website} using ${model.name} (${model.provider})`);
    // Show longer loading time for real analysis
    await new Promise(resolve => setTimeout(resolve, this.REAL_ANALYSIS_DELAY));

    try {
      // Step 1: Crawl website content (real API call)
      const crawlData = await this.crawlWebsite(website, keywords, model);

      // Step 2: Calculate metrics from real crawl data
      const metrics = this.calculateRealMetrics(crawlData);
      const overallScore = this.calculateOverallScore(metrics);

      // Step 3: Generate insights from real data
      const insights = this.generateInsightsFromCrawl(crawlData, metrics);

      // Step 4: Generate issues list from crawl data
      const issues = this.generateIssuesFromCrawl(crawlData);

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
        predictedRank: this.calculatePredictedRank(overallScore),
        category: this.getCategoryFromScore(overallScore),
        recommendations: this.generateRecommendationsFromCrawl(crawlData, metrics),
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
  private static async crawlWebsite(website: string, keywords: string[], model: ModelConfig): Promise<CrawlData> {
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

  // Calculate real metrics from crawl data
  private static calculateRealMetrics(crawlData: CrawlData): Analysis['metrics'] {
    const { contentStats, blufAnalysis, schemaMarkup, technicalSignals, keywordAnalysis, headings } = crawlData;

    // Debug logging to see what data we're working with
    console.log('=== METRICS CALCULATION DEBUG ===');
    console.log('contentStats:', contentStats);
    console.log('blufAnalysis:', blufAnalysis);
    console.log('schemaMarkup:', schemaMarkup);
    console.log('keywordAnalysis:', keywordAnalysis);
    console.log('headings count:', headings?.length);

    // Content Clarity: Based on readability + BLUF score + heading structure
    const headingStructureScore = Math.min(100, headings.length * 10); // Up to 10 headings = 100
    const contentClarity = Math.round(
      contentStats.readabilityScore * 0.4 +
      blufAnalysis.score * 0.3 +
      headingStructureScore * 0.3
    );

    // Semantic Richness: Based on content depth, variety, and structure per page
    const pagesAnalyzed = crawlData.pagesAnalyzed || 1;
    const avgWordsPerPage = contentStats.wordCount / pagesAnalyzed;

    // Score based on average words per page (ideal: 500-1500 per page)
    const avgWordScore = avgWordsPerPage < 300 ? (avgWordsPerPage / 300) * 40 :
                         avgWordsPerPage < 800 ? 40 + ((avgWordsPerPage - 300) / 500) * 30 :
                         avgWordsPerPage < 1500 ? 70 + ((avgWordsPerPage - 800) / 700) * 20 :
                         90;

    // Heading structure score (good variety of h1-h6)
    const headingVariety = new Set(headings.map(h => h.level)).size;
    const headingDepthScore = Math.min(25, headingVariety * 5 + Math.min(10, headings.length / pagesAnalyzed));

    // Paragraph depth score
    const avgParagraphsPerPage = contentStats.paragraphCount / pagesAnalyzed;
    const paragraphDepthScore = Math.min(25, avgParagraphsPerPage * 2);

    const semanticRichness = Math.round(
      Math.min(100, avgWordScore * 0.5 + headingDepthScore + paragraphDepthScore)
    );

    // Structured Data: Based on schema.org presence
    // Different schema types have different weights for AI visibility
    const highValueSchemas = ['FAQPage', 'HowTo', 'Article', 'Product', 'Organization', 'LocalBusiness'];
    const schemaTypes = schemaMarkup.map(s => s.type);
    const highValueCount = schemaTypes.filter(t => highValueSchemas.includes(t)).length;
    const structuredData = Math.min(100, Math.round(
      schemaMarkup.length * 15 + // Base points per schema
      highValueCount * 20 // Bonus for high-value schemas
    ));

    // Natural Language: Based on sentence structure and readability
    // Optimal sentence length is around 15-20 words
    const sentenceLengthScore = Math.max(0, 100 - Math.abs(contentStats.avgSentenceLength - 17) * 5);
    const naturalLanguage = Math.round(
      contentStats.readabilityScore * 0.6 +
      sentenceLengthScore * 0.4
    );

    // Keyword Relevance: Based on keyword placement and density
    let keywordScore = 0;
    if (keywordAnalysis.titleContainsKeyword) keywordScore += 35;
    if (keywordAnalysis.h1ContainsKeyword) keywordScore += 25;
    if (keywordAnalysis.metaContainsKeyword) keywordScore += 20;
    // Optimal keyword density is 1-3%
    const densityScore = keywordAnalysis.keywordDensity >= 1 && keywordAnalysis.keywordDensity <= 3 ? 20 :
                         keywordAnalysis.keywordDensity > 0 ? 10 : 0;
    const keywordRelevance = Math.min(100, keywordScore + densityScore);

    const finalMetrics = {
      contentClarity: Math.max(0, Math.min(100, contentClarity)),
      semanticRichness: Math.max(0, Math.min(100, semanticRichness)),
      structuredData: Math.max(0, Math.min(100, structuredData)),
      naturalLanguage: Math.max(0, Math.min(100, naturalLanguage)),
      keywordRelevance: Math.max(0, Math.min(100, keywordRelevance)),
    };

    console.log('=== CALCULATED METRICS ===');
    console.log('finalMetrics:', finalMetrics);
    console.log('Average score:', Object.values(finalMetrics).reduce((a, b) => a + b, 0) / 5);

    return finalMetrics;
  }

  // Generate insights from real crawl data - in plain business language
  private static generateInsightsFromCrawl(crawlData: CrawlData, metrics: Analysis['metrics']): string {
    const insights: string[] = [];
    const { contentStats, blufAnalysis, schemaMarkup, technicalSignals, keywordAnalysis, title, metaDescription } = crawlData;

    // Overall assessment in plain language
    const avgScore = Object.values(metrics).reduce((a, b) => a + b, 0) / 5;
    if (avgScore >= 75) {
      insights.push(`Good news! Your website is well-prepared for AI search. AI assistants can understand your business and are likely to recommend you.`);
    } else if (avgScore >= 50) {
      insights.push(`Your website has a decent foundation, but there's room to improve. With a few changes, AI assistants will be more likely to recommend you.`);
    } else {
      insights.push(`Your website needs work before AI assistants will confidently recommend you. The good news: the fixes are straightforward.`);
    }

    // Schema insights in plain language
    if (schemaMarkup.length === 0) {
      insights.push(`Important: AI has no way to verify your business. Adding schema markup (like a digital business card) would help AI trust and recommend you.`);
    } else {
      const types = schemaMarkup.map(s => s.type).join(', ');
      insights.push(`Good: AI can identify you as a ${types.toLowerCase().replace('page', '')}.`);
    }

    // BLUF analysis in plain language
    if (blufAnalysis.score < 40) {
      insights.push(`Your content buries the main points. AI reads the first sentence after each heading - make sure it contains your answer, not just an introduction.`);
    } else if (blufAnalysis.score >= 70) {
      insights.push(`Nice work! Your content puts answers first, which is exactly what AI looks for when deciding what to quote.`);
    }

    // Technical signals in plain language
    if (!technicalSignals.mobileViewport) {
      insights.push(`Your site isn't optimized for phones. Since most people use AI on mobile, this could hurt your visibility.`);
    }

    // Content insights in plain language
    if (contentStats.wordCount < 500) {
      insights.push(`Your content is quite short (${contentStats.wordCount} words). AI prefers thorough information it can trust and cite.`);
    }

    // Keyword insights in plain language
    if (!keywordAnalysis.titleContainsKeyword) {
      insights.push(`Your target keywords aren't in your page title. AI uses the title to understand what your page is about.`);
    }

    return insights.join(' ');
  }

  // Generate issues list from crawl data for the page analysis section
  private static generateIssuesFromCrawl(crawlData: CrawlData): { type: 'error' | 'warning' | 'info'; message: string }[] {
    const issues: { type: 'error' | 'warning' | 'info'; message: string }[] = [];
    const { contentStats, blufAnalysis, schemaMarkup, technicalSignals, keywordAnalysis, headings, title, metaDescription } = crawlData;

    // Critical errors (red)
    if (!title || title.length < 10) {
      issues.push({ type: 'error', message: 'Missing or very short page title' });
    }
    if (!metaDescription) {
      issues.push({ type: 'error', message: 'No meta description found' });
    }
    if (schemaMarkup.length === 0) {
      issues.push({ type: 'error', message: 'No structured data (schema.org) found' });
    }
    if (!technicalSignals.hasHttps) {
      issues.push({ type: 'error', message: 'Site not using HTTPS' });
    }
    if (!technicalSignals.mobileViewport) {
      issues.push({ type: 'error', message: 'No mobile viewport meta tag' });
    }
    if (headings.filter(h => h.level === 1).length === 0) {
      issues.push({ type: 'error', message: 'No H1 heading found' });
    }
    if (headings.filter(h => h.level === 1).length > 1) {
      issues.push({ type: 'error', message: `Multiple H1 tags found (${headings.filter(h => h.level === 1).length})` });
    }
    if (!keywordAnalysis.titleContainsKeyword) {
      issues.push({ type: 'error', message: 'Target keywords not in page title' });
    }

    // Warnings (yellow)
    if (metaDescription && metaDescription.length < 120) {
      issues.push({ type: 'warning', message: `Meta description too short (${metaDescription.length} chars, aim for 150-160)` });
    }
    if (contentStats.wordCount < 500) {
      issues.push({ type: 'warning', message: `Low word count (${contentStats.wordCount} words)` });
    }
    if (contentStats.readabilityScore < 50) {
      issues.push({ type: 'warning', message: `Poor readability score (${contentStats.readabilityScore}/100)` });
    }
    if (blufAnalysis.score < 50) {
      issues.push({ type: 'warning', message: `Low BLUF score - ${blufAnalysis.totalHeadings - blufAnalysis.headingsWithDirectAnswers} sections lack direct answers` });
    }
    if (!technicalSignals.hasCanonical) {
      issues.push({ type: 'warning', message: 'No canonical URL tag' });
    }
    if (!technicalSignals.hasOpenGraph) {
      issues.push({ type: 'warning', message: 'No Open Graph meta tags' });
    }
    if (!keywordAnalysis.metaContainsKeyword) {
      issues.push({ type: 'warning', message: 'Target keywords not in meta description' });
    }
    if (!keywordAnalysis.h1ContainsKeyword) {
      issues.push({ type: 'warning', message: 'Target keywords not in H1 heading' });
    }
    if (headings.filter(h => h.level === 2).length < 2) {
      issues.push({ type: 'warning', message: 'Few H2 subheadings (add more structure)' });
    }

    // Info (blue) - things that are okay or could be improved
    if (technicalSignals.loadTime > 3000) {
      issues.push({ type: 'info', message: `Slow load time (${(technicalSignals.loadTime / 1000).toFixed(1)}s)` });
    }
    if (schemaMarkup.length > 0 && !schemaMarkup.find(s => s.type === 'FAQPage')) {
      issues.push({ type: 'info', message: 'Consider adding FAQPage schema' });
    }
    if (keywordAnalysis.keywordDensity < 1) {
      issues.push({ type: 'info', message: `Low keyword density (${keywordAnalysis.keywordDensity.toFixed(1)}%)` });
    }
    if (keywordAnalysis.keywordDensity > 3) {
      issues.push({ type: 'info', message: `High keyword density (${keywordAnalysis.keywordDensity.toFixed(1)}%) - may seem spammy` });
    }

    return issues;
  }

  // Generate specific recommendations from crawl data - in plain business language
  private static generateRecommendationsFromCrawl(crawlData: CrawlData, metrics: Analysis['metrics']): Analysis['recommendations'] {
    const recommendations: Analysis['recommendations'] = [];
    const { contentStats, blufAnalysis, schemaMarkup, technicalSignals, keywordAnalysis, headings, title, metaDescription } = crawlData;

    // Get schema types found
    const schemaTypes = schemaMarkup.map(s => s.type);

    // 1. TRUST SIGNALS - Help AI verify who you are
    if (schemaMarkup.length === 0) {
      recommendations.push({
        id: 'schema-1',
        title: 'Help AI Know Who You Are',
        description: `Right now, AI has no way to verify your business exists. Think of schema markup as your business ID card for AI.\n\nWhat to do: Ask your web developer to add "Organization schema" to your website. This tells AI your business name, website, and what you do.\n\nIf you use WordPress, install the "Yoast SEO" or "Rank Math" plugin - they add this automatically.`,
        priority: 'high',
        difficulty: 'medium',
        estimatedTime: '1 hour',
        expectedImpact: 25,
      });
    }

    // 2. FAQ SCHEMA - Big opportunity if they have question headings
    const questionHeadings = headings.filter(h =>
      h.text.includes('?') ||
      h.text.toLowerCase().startsWith('how') ||
      h.text.toLowerCase().startsWith('what') ||
      h.text.toLowerCase().startsWith('why') ||
      h.text.toLowerCase().startsWith('when') ||
      h.text.toLowerCase().startsWith('can ')
    );

    if (questionHeadings.length >= 2 && !schemaTypes.includes('FAQPage')) {
      const questionExamples = questionHeadings.slice(0, 3).map(h => `"${h.text}"`).join(', ');
      recommendations.push({
        id: 'schema-faq',
        title: 'Turn Your FAQs Into AI-Ready Content',
        description: `Great news! You have ${questionHeadings.length} questions on your site (like ${questionExamples}). These are exactly what people ask AI assistants.\n\nWhat to do: Add "FAQ schema" to mark these as official Q&As. This makes AI much more likely to use YOUR answers when people ask these questions.\n\nMost website builders (Squarespace, Wix, WordPress) have FAQ blocks that do this automatically.`,
        priority: 'high',
        difficulty: 'easy',
        estimatedTime: '30 minutes',
        expectedImpact: 20,
      });
    }

    // 3. DIRECT ANSWERS - Put the answer first
    if (blufAnalysis.score < 60) {
      const sectionsNeedingWork = blufAnalysis.totalHeadings - blufAnalysis.headingsWithDirectAnswers;
      recommendations.push({
        id: 'bluf-1',
        title: 'Put Your Answers First (Not Last)',
        description: `${sectionsNeedingWork} of your ${blufAnalysis.totalHeadings} sections bury the main point. AI reads the first sentence after each heading - if the answer isn't there, it moves on.\n\nWhat to do: For each section, put a 1-2 sentence answer right after the heading, THEN explain the details.\n\nBefore: "There are many factors to consider when choosing..."\nAfter: "The best choice is X because Y. Here's why..."`,
        priority: 'high',
        difficulty: 'medium',
        estimatedTime: '2 hours',
        expectedImpact: 18,
      });
    }

    // 4. KEYWORDS IN TITLE
    if (!keywordAnalysis.titleContainsKeyword) {
      recommendations.push({
        id: 'keyword-title',
        title: 'Add Your Main Topic to the Page Title',
        description: `Your page title is: "${title || '(no title found)'}"\n\nThe problem: Your target keywords aren't in the title. This is like naming your bakery "Bob's Place" instead of "Bob's Bakery" - AI won't know what you do.\n\nWhat to do: Rewrite your title to include your main keyword. Keep it under 60 characters.\n\nExample: "[What You Do] - [Benefit] | [Your Brand]"`,
        priority: 'high',
        difficulty: 'easy',
        estimatedTime: '10 minutes',
        expectedImpact: 15,
      });
    }

    // 5. META DESCRIPTION
    if (!metaDescription || metaDescription.length < 50) {
      recommendations.push({
        id: 'meta-desc',
        title: 'Write a Summary AI Can Use',
        description: `${!metaDescription ? 'Your page has no meta description.' : 'Your meta description is too short.'} This is the "elevator pitch" that tells AI what your page is about.\n\nWhat to do: Write a 150-160 character description that:\n• Says exactly what visitors will learn or get\n• Includes your main keyword naturally\n• Sounds like something a human would say\n\nExample: "Learn how to [solve problem] with our [solution]. [Benefit] for [who it's for]."`,
        priority: 'high',
        difficulty: 'easy',
        estimatedTime: '10 minutes',
        expectedImpact: 12,
      });
    } else if (!keywordAnalysis.metaContainsKeyword) {
      recommendations.push({
        id: 'keyword-meta',
        title: 'Include Your Keywords in the Description',
        description: `Your current description: "${metaDescription.substring(0, 80)}..."\n\nThe problem: Your target keywords aren't in this description. AI uses this to understand what your page is about.\n\nWhat to do: Rewrite to naturally include your main keywords. Don't stuff them in awkwardly - make it read naturally.`,
        priority: 'medium',
        difficulty: 'easy',
        estimatedTime: '10 minutes',
        expectedImpact: 8,
      });
    }

    // 6. MOBILE FRIENDLY
    if (!technicalSignals.mobileViewport) {
      recommendations.push({
        id: 'tech-mobile',
        title: 'Make Your Site Work on Phones',
        description: `Your site isn't set up for mobile devices. This is a big problem - most people use AI assistants on their phones, and AI won't recommend sites that don't work on mobile.\n\nWhat to do: If you have a web developer, ask them to add "mobile viewport meta tag." If you use a website builder, check your mobile preview settings.\n\nThis is usually a 5-minute fix that makes a big difference.`,
        priority: 'high',
        difficulty: 'easy',
        estimatedTime: '10 minutes',
        expectedImpact: 15,
      });
    }

    // 7. THIN CONTENT
    if (contentStats.wordCount < 800) {
      const wordsNeeded = Math.max(0, 1000 - contentStats.wordCount);
      recommendations.push({
        id: 'content-length',
        title: 'Add More Helpful Information',
        description: `Your page has ${contentStats.wordCount} words. AI prefers thorough content (1,000+ words) because it can give better answers.\n\nWhat to do: Add ${wordsNeeded}+ more words by answering questions your customers commonly ask:\n• What problem does this solve?\n• How does it work?\n• Who is it best for?\n• What makes you different?\n• What are common mistakes to avoid?`,
        priority: 'medium',
        difficulty: 'medium',
        estimatedTime: '2-3 hours',
        expectedImpact: 12,
      });
    }

    // 8. HARD TO READ
    if (contentStats.readabilityScore < 50) {
      recommendations.push({
        id: 'content-readability',
        title: 'Simplify Your Writing',
        description: `Your content is harder to read than it should be (readability score: ${contentStats.readabilityScore}/100). If AI struggles to understand your writing, it won't quote you.\n\nWhat to do:\n• Break long sentences into shorter ones (aim for 15-20 words)\n• Replace jargon with everyday words\n• Use bullet points for lists\n• Add paragraph breaks more often\n\nTip: Read your content out loud. If you run out of breath, the sentence is too long.`,
        priority: 'medium',
        difficulty: 'medium',
        estimatedTime: '1-2 hours',
        expectedImpact: 10,
      });
    }

    // 9. MISSING H1
    const h1Count = headings.filter(h => h.level === 1).length;
    const h2Count = headings.filter(h => h.level === 2).length;

    if (h1Count === 0) {
      recommendations.push({
        id: 'heading-h1',
        title: 'Add a Main Headline',
        description: `Your page is missing a main headline (H1). This is like a book without a title - AI doesn't know what the page is about.\n\nWhat to do: Add one H1 heading at the top of your page that clearly states what the page is about. Include your main keyword.\n\nExample: "The Complete Guide to [Your Topic]" or "[Your Service] for [Your Audience]"`,
        priority: 'high',
        difficulty: 'easy',
        estimatedTime: '5 minutes',
        expectedImpact: 15,
      });
    } else if (h1Count > 1) {
      recommendations.push({
        id: 'heading-h1-multiple',
        title: 'Use Only One Main Headline',
        description: `Your page has ${h1Count} main headlines (H1s). This confuses AI about what your page is really about - it's like a book with multiple titles.\n\nWhat to do: Keep the most important H1 and change the others to H2 subheadings. There should be exactly one H1 per page.`,
        priority: 'high',
        difficulty: 'easy',
        estimatedTime: '10 minutes',
        expectedImpact: 10,
      });
    }

    // 10. FEW SUBHEADINGS
    if (h2Count < 3 && contentStats.wordCount > 500) {
      recommendations.push({
        id: 'heading-structure',
        title: 'Break Up Your Content with Subheadings',
        description: `You have ${contentStats.wordCount} words but only ${h2Count} subheadings. This makes your content hard to scan and harder for AI to understand.\n\nWhat to do: Add a subheading (H2) every 200-300 words. Good subheadings:\n• Tell readers what the next section covers\n• Can be understood without reading everything else\n• Often work as questions people might ask`,
        priority: 'medium',
        difficulty: 'easy',
        estimatedTime: '20 minutes',
        expectedImpact: 8,
      });
    }

    // 11. OPEN GRAPH (lower priority)
    if (!technicalSignals.hasOpenGraph && recommendations.length < 6) {
      recommendations.push({
        id: 'tech-og',
        title: 'Improve How Your Links Look When Shared',
        description: `When someone shares your link, it shows a generic preview. Open Graph tags control how your page looks when shared on social media or in chat apps.\n\nWhat to do: Most website builders have a "Social sharing" or "SEO" section where you can set a title, description, and image for link previews. This takes 5 minutes and makes your links look more professional.`,
        priority: 'medium',
        difficulty: 'easy',
        estimatedTime: '15 minutes',
        expectedImpact: 5,
      });
    }

    // Sort by priority and expected impact
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.expectedImpact - a.expectedImpact;
    });

    // Return top 6 recommendations
    return recommendations.slice(0, 6);
  }

  private static calculateOverallScore(metrics: any): number {
    return Math.round(
      (metrics.contentClarity + metrics.semanticRichness + metrics.structuredData + 
       metrics.naturalLanguage + metrics.keywordRelevance) / 5
    );
  }

  // Shared utility methods - plain language for business owners
  private static generateSimulatedInsights(website: string, score: number): string {
    if (score >= 70) {
      return `This demo shows how we'd analyze ${website}. Your estimated score of ${score} suggests good AI visibility potential. Upgrade to get real data from your actual website, including specific issues and fixes.`;
    } else if (score >= 50) {
      return `This demo shows how we'd analyze ${website}. Your estimated score of ${score} suggests room for improvement. Upgrade to see exactly what's holding your site back and get step-by-step fixes.`;
    } else {
      return `This demo shows how we'd analyze ${website}. Your estimated score of ${score} suggests your site needs work to show up in AI answers. Upgrade to get a detailed roadmap for improvement.`;
    }
  }

  private static generateSimulatedRecommendations(metrics: any): any[] {
    const allRecommendations = [
      {
        id: '1',
        title: 'Help AI Verify Your Business',
        description: 'Add schema markup so AI assistants can confirm your business exists and what you do. This is like giving AI your business card.',
        priority: 'high',
        difficulty: 'medium',
        estimatedTime: '1 hour',
        expectedImpact: 12
      },
      {
        id: '2',
        title: 'Put Your Answers First',
        description: 'AI reads the first sentence after each heading. Make sure your main point is there, not buried in the middle of a paragraph.',
        priority: 'medium',
        difficulty: 'easy',
        estimatedTime: '2 hours',
        expectedImpact: 8
      },
      {
        id: '3',
        title: 'Answer Questions People Actually Ask',
        description: 'Add an FAQ section with real questions your customers ask. These are the same questions people ask AI assistants.',
        priority: 'medium',
        difficulty: 'easy',
        estimatedTime: '1 hour',
        expectedImpact: 10
      }
    ];

    // Return 2-3 recommendations based on lowest scoring metrics
    return allRecommendations.slice(0, 2 + Math.floor(Math.random() * 2));
  }

  private static calculatePredictedRank(score: number): number {
    if (score >= 85) return 1;
    if (score >= 75) return 2;
    if (score >= 65) return 3;
    if (score >= 55) return 5;
    if (score >= 45) return 7;
    return 10;
  }

  private static getCategoryFromScore(score: number): string {
    if (score >= 85) return 'Featured Answer';
    if (score >= 70) return 'Top Result';
    if (score >= 55) return 'Visible';
    return 'Buried';
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
    const budgets = {
      starter: 10 * this.costs.total,      // 10 analyses
      professional: 50 * this.costs.total, // 50 analyses
      enterprise: 400 * this.costs.total   // 400 analyses
    };
    
    return budgets[plan as keyof typeof budgets] || 0;
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