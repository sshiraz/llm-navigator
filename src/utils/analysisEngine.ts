// Analysis Engine - Handles both simulated and real analysis
import { Analysis, User } from '../types';
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
    const rateCheck = await CostTracker.checkRateLimit(user.id);
    if (!rateCheck.allowed) {
      const resetTime = rateCheck.resetTime ? new Date(rateCheck.resetTime).toLocaleTimeString() : 'soon';
      throw new Error(`Rate limit exceeded. Try again at ${resetTime}`);
    }

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

  // Generate insights from real crawl data
  private static generateInsightsFromCrawl(crawlData: CrawlData, metrics: Analysis['metrics']): string {
    const insights: string[] = [];
    const { contentStats, blufAnalysis, schemaMarkup, technicalSignals, keywordAnalysis, title, metaDescription } = crawlData;

    // Overall assessment
    const avgScore = Object.values(metrics).reduce((a, b) => a + b, 0) / 5;
    if (avgScore >= 75) {
      insights.push(`Your website shows strong AI search optimization with an average score of ${Math.round(avgScore)}.`);
    } else if (avgScore >= 50) {
      insights.push(`Your website has moderate AI visibility with several areas for improvement.`);
    } else {
      insights.push(`Your website needs significant optimization to be discovered by AI search engines.`);
    }

    // Schema insights
    if (schemaMarkup.length === 0) {
      insights.push(`No structured data (schema.org) was found. This significantly limits AI assistants' ability to understand and cite your content.`);
    } else {
      const types = schemaMarkup.map(s => s.type).join(', ');
      insights.push(`Found ${schemaMarkup.length} schema type(s): ${types}.`);

      if (!schemaMarkup.find(s => s.type === 'FAQPage')) {
        insights.push(`Consider adding FAQPage schema for better AI visibility in Q&A contexts.`);
      }
    }

    // BLUF analysis
    if (blufAnalysis.score < 40) {
      insights.push(`Only ${blufAnalysis.headingsWithDirectAnswers} of ${blufAnalysis.totalHeadings} sections provide direct answers. AI models prefer content that answers questions immediately after headings.`);
    } else if (blufAnalysis.score >= 70) {
      insights.push(`Good direct answer structure - ${blufAnalysis.headingsWithDirectAnswers} sections follow the BLUF (Bottom Line Up Front) pattern that AI models prefer.`);
    }

    // Technical signals
    if (!technicalSignals.hasHttps) {
      insights.push(`Warning: Site is not using HTTPS, which may reduce trust signals for AI systems.`);
    }
    if (!technicalSignals.mobileViewport) {
      insights.push(`No mobile viewport detected. Mobile optimization is important for both user experience and AI crawling.`);
    }
    if (technicalSignals.loadTime > 3000) {
      insights.push(`Page load time (${(technicalSignals.loadTime / 1000).toFixed(1)}s) is above optimal. Faster sites are crawled more efficiently.`);
    }

    // Content insights
    if (contentStats.wordCount < 500) {
      insights.push(`Content length (${contentStats.wordCount} words) may be too short for comprehensive topic coverage.`);
    }
    if (contentStats.readabilityScore < 50) {
      insights.push(`Readability score is low. Consider simplifying language for better AI comprehension.`);
    }

    // Keyword insights
    if (!keywordAnalysis.titleContainsKeyword) {
      insights.push(`Target keywords not found in the page title. This reduces relevance signals for AI search.`);
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

  // Generate specific recommendations from crawl data
  private static generateRecommendationsFromCrawl(crawlData: CrawlData, metrics: Analysis['metrics']): Analysis['recommendations'] {
    const recommendations: Analysis['recommendations'] = [];
    const { contentStats, blufAnalysis, schemaMarkup, technicalSignals, keywordAnalysis, headings, title, metaDescription } = crawlData;

    // Get schema types found
    const schemaTypes = schemaMarkup.map(s => s.type);
    const highValueSchemas = ['FAQPage', 'HowTo', 'Article', 'Product', 'Organization', 'LocalBusiness', 'WebSite'];
    const missingHighValueSchemas = highValueSchemas.filter(s => !schemaTypes.includes(s));

    // Schema recommendations - be specific about what's found and missing
    if (schemaMarkup.length === 0) {
      recommendations.push({
        id: 'schema-1',
        title: 'Add Schema.org Structured Data',
        description: `⚠️ NO SCHEMA FOUND. Your page has zero structured data, making it harder for AI systems to understand your content. Add this JSON-LD to your <head>:\n\n<script type="application/ld+json">\n{"@context":"https://schema.org","@type":"Organization","name":"Your Company","url":"${crawlData.url}"}\n</script>`,
        priority: 'high',
        difficulty: 'medium',
        estimatedTime: '2-4 hours',
        expectedImpact: 25,
      });
    } else {
      // Show what schemas are found and suggest additions
      const foundSchemas = schemaTypes.join(', ');
      if (missingHighValueSchemas.length > 0 && !schemaTypes.includes('FAQPage')) {
        recommendations.push({
          id: 'schema-enhance',
          title: 'Enhance Schema Coverage',
          description: `✓ Found: ${foundSchemas}. Consider adding: ${missingHighValueSchemas.slice(0, 3).join(', ')}. FAQPage schema is particularly valuable for AI search visibility.`,
          priority: 'medium',
          difficulty: 'easy',
          estimatedTime: '1-2 hours',
          expectedImpact: 10,
        });
      }
    }

    // FAQ schema recommendation with specific headings to convert
    const questionHeadings = headings.filter(h =>
      h.text.includes('?') ||
      h.text.toLowerCase().startsWith('how') ||
      h.text.toLowerCase().startsWith('what') ||
      h.text.toLowerCase().startsWith('why') ||
      h.text.toLowerCase().startsWith('when') ||
      h.text.toLowerCase().startsWith('can ')
    );

    if (questionHeadings.length >= 2 && !schemaTypes.includes('FAQPage')) {
      const questionsToConvert = questionHeadings.slice(0, 4).map(h => `• "${h.text}"`).join('\n');
      const sampleQuestion = questionHeadings[0];
      const sampleAnswer = sampleQuestion.followingContent?.substring(0, 100) || 'Your answer here...';

      recommendations.push({
        id: 'schema-faq',
        title: `Convert ${questionHeadings.length} Questions to FAQPage Schema`,
        description: `Found ${questionHeadings.length} question-style headings that should be FAQPage schema:\n\n${questionsToConvert}\n\nAdd this to your page:\n<script type="application/ld+json">\n{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"${sampleQuestion.text}","acceptedAnswer":{"@type":"Answer","text":"${sampleAnswer}..."}}]}\n</script>`,
        priority: 'high',
        difficulty: 'easy',
        estimatedTime: '1-2 hours',
        expectedImpact: 20,
      });
    }

    // BLUF recommendations with specific examples
    if (blufAnalysis.score < 60) {
      const headingsWithoutAnswers = headings.filter(h => !h.hasDirectAnswer).slice(0, 3);
      const examples = headingsWithoutAnswers.map(h => `• "${h.text}" → Add a direct 1-2 sentence answer immediately after`).join('\n');

      recommendations.push({
        id: 'bluf-1',
        title: `Add Direct Answers to ${blufAnalysis.totalHeadings - blufAnalysis.headingsWithDirectAnswers} Sections`,
        description: `BLUF Score: ${blufAnalysis.score}/100. Only ${blufAnalysis.headingsWithDirectAnswers} of ${blufAnalysis.totalHeadings} sections start with a direct answer. AI models extract the first sentence after headings - make it count!\n\nFix these sections:\n${examples}\n\nPattern: [Heading] → [Direct answer in 1-2 sentences] → [Detailed explanation]`,
        priority: 'high',
        difficulty: 'medium',
        estimatedTime: '2-4 hours',
        expectedImpact: 18,
      });
    }

    // Keyword recommendations with actual title shown
    if (!keywordAnalysis.titleContainsKeyword) {
      recommendations.push({
        id: 'keyword-title',
        title: 'Add Target Keywords to Page Title',
        description: `Current title: "${title || 'No title found'}"\n\nYour target keywords are missing from the title. The title tag is a critical signal for AI search. Suggested format:\n"[Primary Keyword] - [Secondary Keyword] | ${title?.split('|')[1]?.trim() || 'Brand Name'}"`,
        priority: 'high',
        difficulty: 'easy',
        estimatedTime: '15 minutes',
        expectedImpact: 15,
      });
    }

    // Meta description with actual content shown
    if (!metaDescription || metaDescription.length < 50) {
      recommendations.push({
        id: 'meta-desc',
        title: 'Add Compelling Meta Description',
        description: `${!metaDescription ? '⚠️ NO META DESCRIPTION FOUND' : `Current: "${metaDescription.substring(0, 80)}..."`}\n\nAdd a 150-160 character meta description that:\n• Includes your target keywords naturally\n• Answers "what will the user learn/get?"\n• Uses active voice and a call-to-action`,
        priority: 'high',
        difficulty: 'easy',
        estimatedTime: '15 minutes',
        expectedImpact: 12,
      });
    } else if (!keywordAnalysis.metaContainsKeyword) {
      recommendations.push({
        id: 'keyword-meta',
        title: 'Optimize Meta Description for Keywords',
        description: `Current: "${metaDescription.substring(0, 100)}..."\n\nYour target keywords aren't in the meta description. Rewrite to naturally include them while maintaining readability.`,
        priority: 'medium',
        difficulty: 'easy',
        estimatedTime: '15 minutes',
        expectedImpact: 8,
      });
    }

    // Technical recommendations with code snippets
    if (!technicalSignals.hasCanonical) {
      recommendations.push({
        id: 'tech-canonical',
        title: 'Add Canonical URL Tag',
        description: `No canonical URL found. Add to your <head>:\n\n<link rel="canonical" href="${crawlData.url}" />\n\nThis prevents duplicate content issues and consolidates ranking signals.`,
        priority: 'medium',
        difficulty: 'easy',
        estimatedTime: '10 minutes',
        expectedImpact: 5,
      });
    }

    if (!technicalSignals.hasOpenGraph) {
      recommendations.push({
        id: 'tech-og',
        title: 'Add Open Graph Meta Tags',
        description: `No Open Graph tags found. Add to your <head>:\n\n<meta property="og:title" content="${title}" />\n<meta property="og:description" content="${metaDescription?.substring(0, 100) || 'Your description'}" />\n<meta property="og:type" content="website" />\n<meta property="og:url" content="${crawlData.url}" />`,
        priority: 'medium',
        difficulty: 'easy',
        estimatedTime: '30 minutes',
        expectedImpact: 8,
      });
    }

    if (!technicalSignals.mobileViewport) {
      recommendations.push({
        id: 'tech-mobile',
        title: 'Add Mobile Viewport Meta Tag',
        description: `⚠️ CRITICAL: No mobile viewport detected. Your site may not render properly on mobile devices.\n\nAdd to <head>:\n<meta name="viewport" content="width=device-width, initial-scale=1">`,
        priority: 'high',
        difficulty: 'easy',
        estimatedTime: '5 minutes',
        expectedImpact: 15,
      });
    }

    // Content recommendations with specifics
    if (contentStats.wordCount < 800) {
      recommendations.push({
        id: 'content-length',
        title: `Expand Content (Currently ${contentStats.wordCount} words)`,
        description: `Your page has ${contentStats.wordCount} words across ${contentStats.paragraphCount} paragraphs. For comprehensive topic coverage that AI models prefer:\n\n• Target: 1,500-2,500 words\n• Add: ${Math.max(0, 1500 - contentStats.wordCount)} more words\n• Include: Examples, case studies, FAQs, and detailed explanations`,
        priority: 'medium',
        difficulty: 'medium',
        estimatedTime: '3-5 hours',
        expectedImpact: 12,
      });
    }

    if (contentStats.readabilityScore < 50) {
      recommendations.push({
        id: 'content-readability',
        title: `Improve Readability (Score: ${contentStats.readabilityScore}/100)`,
        description: `Your content's readability score is ${contentStats.readabilityScore}/100 (aim for 60+).\n\nCurrent avg sentence length: ${contentStats.avgSentenceLength} words (optimal: 15-20)\n\nTo improve:\n• Break long sentences into shorter ones\n• Use simpler words where possible\n• Add more paragraph breaks\n• Use bullet points for lists`,
        priority: 'medium',
        difficulty: 'medium',
        estimatedTime: '2-3 hours',
        expectedImpact: 10,
      });
    }

    // Heading structure recommendations
    const h1Count = headings.filter(h => h.level === 1).length;
    const h2Count = headings.filter(h => h.level === 2).length;

    if (h1Count === 0) {
      recommendations.push({
        id: 'heading-h1',
        title: 'Add H1 Heading',
        description: `⚠️ NO H1 FOUND. Every page needs exactly one H1 tag containing your primary keyword. Add:\n\n<h1>[Your Primary Keyword] - [Compelling Benefit]</h1>`,
        priority: 'high',
        difficulty: 'easy',
        estimatedTime: '10 minutes',
        expectedImpact: 15,
      });
    } else if (h1Count > 1) {
      recommendations.push({
        id: 'heading-h1-multiple',
        title: `Fix Multiple H1 Tags (Found ${h1Count})`,
        description: `Found ${h1Count} H1 tags - there should be exactly one. Multiple H1s confuse search engines and AI about your page's main topic. Keep the most relevant one and convert others to H2.`,
        priority: 'high',
        difficulty: 'easy',
        estimatedTime: '15 minutes',
        expectedImpact: 10,
      });
    }

    if (h2Count < 3 && contentStats.wordCount > 500) {
      recommendations.push({
        id: 'heading-structure',
        title: 'Add More Subheadings (H2s)',
        description: `Only ${h2Count} H2 headings for ${contentStats.wordCount} words. Add H2 subheadings every 200-300 words to:\n• Break up content for easier scanning\n• Help AI understand content structure\n• Target long-tail keywords\n\nSuggested sections: Benefits, How It Works, FAQ, Getting Started`,
        priority: 'medium',
        difficulty: 'easy',
        estimatedTime: '30 minutes',
        expectedImpact: 8,
      });
    }

    // Sort by priority and expected impact
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.expectedImpact - a.expectedImpact;
    });

    // Return top 7 recommendations
    return recommendations.slice(0, 7);
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