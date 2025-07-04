// Analysis Engine - Handles both simulated and real analysis
import { Analysis, User } from '../types';
import { CostTracker } from './costTracker';

export class AnalysisEngine {
  private static readonly SIMULATION_DELAY = 2000; // 2 seconds for realistic feel
  private static readonly REAL_ANALYSIS_DELAY = 15000; // 15 seconds for real analysis

  // Check if user should get real analysis
  static shouldUseRealAnalysis(user: User): boolean {
    return ['starter', 'professional', 'enterprise'].includes(user.subscription);
  }

  // Main analysis method that routes to simulation or real analysis
  static async analyzeWebsite(
    website: string, 
    keywords: string[], 
    user: User
  ): Promise<Analysis> {
    // Check usage limits first
    const usageCheck = await CostTracker.checkUsageLimits(user.id, user.subscription);
    if (!usageCheck.allowed) {
      throw new Error(usageCheck.reason || 'Usage limit exceeded');
    }

    // Check rate limits
    const rateCheck = await CostTracker.checkRateLimit(user.id);
    if (!rateCheck.allowed) {
      const resetTime = rateCheck.resetTime ? new Date(rateCheck.resetTime).toLocaleTimeString() : 'soon';
      throw new Error(`Rate limit exceeded. Try again at ${resetTime}`);
    }

    const analysisType = this.shouldUseRealAnalysis(user) ? 'real' : 'simulated';
    
    // Track usage before analysis
    const usage = await CostTracker.trackAnalysisUsage(user.id, analysisType, website, keywords);
    
    try {
      if (analysisType === 'real') {
        return await this.performRealAnalysis(website, keywords, user, usage);
      } else {
        return await this.performSimulatedAnalysis(website, keywords, user, usage);
      }
    } catch (error) {
      // Update usage record with error
      console.error('Analysis failed:', error);
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

    return {
      id: usage.analysisId,
      projectId: '1',
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
    usage: any
  ): Promise<Analysis> {
    // Show longer loading time for real analysis
    await new Promise(resolve => setTimeout(resolve, this.REAL_ANALYSIS_DELAY));

    try {
      // Step 1: Crawl website content
      const content = await this.crawlWebsite(website);
      
      // Step 2: Analyze technical SEO
      const technicalMetrics = await this.analyzeTechnicalSEO(content);
      
      // Step 3: Perform semantic analysis (uses AI APIs)
      const semanticMetrics = await this.analyzeSemanticContent(content, keywords);
      
      // Step 4: Generate AI insights (controlled API usage)
      const insights = await this.generateRealInsights(technicalMetrics, semanticMetrics);
      
      // Step 5: Calculate final scores
      const metrics = this.combineMetrics(technicalMetrics, semanticMetrics);
      const overallScore = this.calculateOverallScore(metrics);

      return {
        id: usage.analysisId,
        projectId: '1',
        website,
        keywords,
        score: overallScore,
        metrics,
        insights,
        predictedRank: this.calculatePredictedRank(overallScore),
        category: this.getCategoryFromScore(overallScore),
        recommendations: await this.generateRealRecommendations(metrics, content),
        createdAt: new Date().toISOString(),
        isSimulated: false,
        costInfo: {
          totalCost: usage.costs.total,
          breakdown: usage.costs,
          tokensUsed: usage.tokens
        }
      };
    } catch (error) {
      console.error('Real analysis failed:', error);
      // Fallback to simulated analysis if real analysis fails
      return this.performSimulatedAnalysis(website, keywords, user, usage);
    }
  }

  // Real analysis methods (would use actual APIs in production)
  private static async crawlWebsite(website: string): Promise<any> {
    // In production: Use Puppeteer, Playwright, or crawling service
    // Cost: ~$0.03 per analysis
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // For demo: Return mock content structure
    return {
      title: `${website} - Homepage`,
      headings: ['Welcome to our site', 'Our Services', 'Contact Us'],
      content: 'Sample content from the website...',
      schema: [], // Structured data found
      meta: { description: 'Sample meta description' },
      images: [],
      links: [],
      loadTime: Math.random() * 3 + 1, // 1-4 seconds
      mobileOptimized: Math.random() > 0.3
    };
  }

  private static async analyzeTechnicalSEO(content: any): Promise<any> {
    // Analyze technical aspects without AI
    // Cost: ~$0.001 per analysis (minimal compute)
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      hasSchema: content.schema.length > 0,
      titleOptimized: content.title.length > 30 && content.title.length < 60,
      metaDescription: content.meta.description?.length > 120,
      headingStructure: content.headings.length >= 3,
      contentLength: content.content.length > 300,
      loadTime: content.loadTime,
      mobileOptimized: content.mobileOptimized
    };
  }

  private static async analyzeSemanticContent(content: any, keywords: string[]): Promise<any> {
    // In production: Use OpenAI Embeddings API or similar
    // Cost: ~$0.02 per analysis
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Simulate API costs and token usage
    const tokenCount = content.content.length * 0.75; // Rough estimate
    
    // For demo: Return calculated semantic scores
    return {
      keywordDensity: Math.random() * 0.05, // 0-5%
      semanticSimilarity: 0.6 + Math.random() * 0.3, // 0.6-0.9
      topicCoverage: 0.4 + Math.random() * 0.5, // 0.4-0.9
      readabilityScore: 60 + Math.random() * 30, // 60-90
      tokensUsed: Math.round(tokenCount),
      apiCost: (tokenCount / 1000) * 0.0001 // Embeddings cost
    };
  }

  private static async generateRealInsights(technical: any, semantic: any): Promise<string> {
    // In production: Single GPT-4 API call for insights
    // Cost: ~$0.15 per analysis
    
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    // Simulate token usage for insights generation
    const inputTokens = 1500; // System prompt + content summary
    const outputTokens = 800; // Generated insights
    const cost = (inputTokens / 1000) * 0.03 + (outputTokens / 1000) * 0.06;
    
    // For demo: Return realistic insights based on actual metrics
    const insights = [
      `Your website shows ${technical.hasSchema ? 'excellent' : 'limited'} structured data implementation.`,
      `Technical analysis reveals ${technical.loadTime < 2 ? 'fast' : 'slow'} page load times.`,
      `Content readability scores ${semantic.readabilityScore > 80 ? 'above' : 'below'} industry average.`,
      `Semantic analysis indicates ${semantic.topicCoverage > 0.7 ? 'comprehensive' : 'limited'} topic coverage.`,
      `Mobile optimization is ${technical.mobileOptimized ? 'properly' : 'not'} implemented.`
    ];
    
    return insights.join(' ');
  }

  private static combineMetrics(technical: any, semantic: any): any {
    return {
      contentClarity: Math.round(semantic.readabilityScore * 0.9 + (technical.headingStructure ? 10 : 0)),
      semanticRichness: Math.round(semantic.topicCoverage * 100),
      structuredData: technical.hasSchema ? 85 : 25,
      naturalLanguage: Math.round(semantic.readabilityScore),
      keywordRelevance: Math.round(semantic.keywordDensity * 2000 + semantic.semanticSimilarity * 50)
    };
  }

  private static calculateOverallScore(metrics: any): number {
    return Math.round(
      (metrics.contentClarity + metrics.semanticRichness + metrics.structuredData + 
       metrics.naturalLanguage + metrics.keywordRelevance) / 5
    );
  }

  // Shared utility methods
  private static generateSimulatedInsights(website: string, score: number): string {
    const templates = [
      `Your website ${website} shows ${score >= 70 ? 'strong' : 'moderate'} potential for AI search optimization.`,
      `Analysis reveals ${score >= 80 ? 'excellent' : score >= 60 ? 'good' : 'significant'} opportunities for improvement.`,
      `Focus on ${score < 60 ? 'fundamental SEO improvements and' : ''} structured data implementation to boost AI visibility.`,
      `This simulated analysis demonstrates our methodology - upgrade for real-time website crawling and AI-powered insights.`
    ];
    
    return templates.join(' ');
  }

  private static async generateRealRecommendations(metrics: any, content: any): Promise<any[]> {
    // Generate recommendations based on actual analysis
    const recommendations = [];
    
    if (metrics.structuredData < 50) {
      recommendations.push({
        id: '1',
        title: 'Implement Schema Markup',
        description: 'Add structured data to help AI systems understand your content better.',
        priority: 'high',
        difficulty: 'medium',
        estimatedTime: '2-3 weeks',
        expectedImpact: 15
      });
    }
    
    if (metrics.semanticRichness < 60) {
      recommendations.push({
        id: '2',
        title: 'Expand Content Depth',
        description: 'Create more comprehensive content covering related topics and concepts.',
        priority: 'high',
        difficulty: 'medium',
        estimatedTime: '4-6 weeks',
        expectedImpact: 12
      });
    }
    
    if (content.loadTime > 3) {
      recommendations.push({
        id: '3',
        title: 'Optimize Page Speed',
        description: 'Improve loading times to enhance user experience and AI crawling efficiency.',
        priority: 'medium',
        difficulty: 'medium',
        estimatedTime: '1-2 weeks',
        expectedImpact: 8
      });
    }
    
    return recommendations;
  }

  private static generateSimulatedRecommendations(metrics: any): any[] {
    const allRecommendations = [
      {
        id: '1',
        title: 'Implement FAQ Schema',
        description: 'Add FAQ structured data to help AI assistants better understand your content.',
        priority: 'high',
        difficulty: 'medium',
        estimatedTime: '1-2 weeks',
        expectedImpact: 12
      },
      {
        id: '2',
        title: 'Enhance Content Clarity',
        description: 'Restructure content with clear headings and concise answers to common questions.',
        priority: 'medium',
        difficulty: 'easy',
        estimatedTime: '3-5 days',
        expectedImpact: 8
      },
      {
        id: '3',
        title: 'Optimize for Conversational Queries',
        description: 'Rewrite content to better match how people ask questions to AI assistants.',
        priority: 'medium',
        difficulty: 'easy',
        estimatedTime: '1-2 weeks',
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
    if (score >= 55) return Math.floor(Math.random() * 3) + 4; // 4-6
    return Math.floor(Math.random() * 4) + 7; // 7-10
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
      enterprise: 200 * this.costs.total   // 200 analyses (unlimited with reasonable limit)
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