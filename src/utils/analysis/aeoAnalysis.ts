/**
 * AEO Analysis - AI Engine Optimization specific analysis logic
 */
import { User, AEOAnalysis, CitationResult, AEORecommendation, CompetitorCitation } from '../../types';
import type { AnalysisProvider } from '../../types';
import type { CrawlData } from '../../types/crawl';
import { supabase } from '../../lib/supabase';
import { MODELS } from './modelConfig';

// Simulated competitor domains for demo mode
const SIMULATED_COMPETITORS = [
  'hubspot.com', 'mailchimp.com', 'salesforce.com', 'zendesk.com',
  'intercom.com', 'drift.com', 'freshworks.com', 'zoho.com'
];

// Generate AEO-specific recommendations
export function generateAEORecommendations(
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

// Real AEO analysis - actually queries AI providers
export async function performRealAEOAnalysis(
  website: string,
  prompts: { id: string; text: string }[],
  brandName: string | undefined,
  user: User,
  providers: AnalysisProvider[],
  analysisId: string,
  crawlWebsite: (website: string, keywords: string[], model: any) => Promise<CrawlData>
): Promise<AEOAnalysis> {
  console.log('Performing real AEO analysis...');

  // Step 1: Crawl website for content analysis
  let crawlData: CrawlData | undefined;
  try {
    crawlData = await crawlWebsite(website, [], MODELS['gpt-4']);
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
  const recommendations = generateAEORecommendations(
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
export async function performSimulatedAEOAnalysis(
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

  for (const prompt of prompts) {
    for (const provider of activeProviders) {
      // ~40% chance of being cited in simulated mode
      const isCited = Math.random() < 0.4;

      // Generate 2-4 competitor citations
      const numCompetitors = 2 + Math.floor(Math.random() * 3);
      const competitorsCited: CompetitorCitation[] = [];
      const shuffledCompetitors = [...SIMULATED_COMPETITORS].sort(() => Math.random() - 0.5);

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
  const recommendations = generateAEORecommendations(
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
