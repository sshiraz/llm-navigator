/**
 * Analysis Helpers - Shared utility methods for analysis
 */
import { Analysis, User } from '../../types';
import type { CrawlData } from '../../types/crawl';

// Timing constants
export const SIMULATION_DELAY = 2000;
export const REAL_ANALYSIS_DELAY = 3000;

// Check if user should get real analysis
export function shouldUseRealAnalysis(user: User): boolean {
  return ['starter', 'professional', 'enterprise'].includes(user.subscription) ||
         user.isAdmin === true ||
         user.email === 'demo@example.com';
}

// Calculate overall score from metrics
export function calculateOverallScore(metrics: Analysis['metrics']): number {
  return Math.round(
    (metrics.contentClarity + metrics.semanticRichness + metrics.structuredData +
     metrics.naturalLanguage + metrics.keywordRelevance) / 5
  );
}

// Calculate predicted rank based on score
export function calculatePredictedRank(score: number): number {
  if (score >= 85) return 1;
  if (score >= 75) return 2;
  if (score >= 65) return 3;
  if (score >= 55) return 5;
  if (score >= 45) return 7;
  return 10;
}

// Get category from score
export function getCategoryFromScore(score: number): string {
  if (score >= 85) return 'Featured Answer';
  if (score >= 70) return 'Top Result';
  if (score >= 55) return 'Visible';
  return 'Buried';
}

// Generate simulated insights for trial users
export function generateSimulatedInsights(website: string, score: number): string {
  if (score >= 70) {
    return `This demo shows how we'd analyze ${website}. Your estimated score of ${score} suggests good AI visibility potential. Upgrade to get real data from your actual website, including specific issues and fixes.`;
  } else if (score >= 50) {
    return `This demo shows how we'd analyze ${website}. Your estimated score of ${score} suggests room for improvement. Upgrade to see exactly what's holding your site back and get step-by-step fixes.`;
  } else {
    return `This demo shows how we'd analyze ${website}. Your estimated score of ${score} suggests your site needs work to show up in AI answers. Upgrade to get a detailed roadmap for improvement.`;
  }
}

// Generate simulated recommendations for trial users
export function generateSimulatedRecommendations(metrics: Analysis['metrics']): Analysis['recommendations'] {
  const allRecommendations: Analysis['recommendations'] = [
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

  return allRecommendations.slice(0, 2 + Math.floor(Math.random() * 2));
}

// Calculate real metrics from crawl data
export function calculateRealMetrics(crawlData: CrawlData): Analysis['metrics'] {
  const { contentStats, blufAnalysis, schemaMarkup, keywordAnalysis, headings } = crawlData;

  // Content Clarity
  const headingStructureScore = Math.min(100, headings.length * 10);
  const contentClarity = Math.round(
    contentStats.readabilityScore * 0.4 +
    blufAnalysis.score * 0.3 +
    headingStructureScore * 0.3
  );

  // Semantic Richness
  const pagesAnalyzed = crawlData.pagesAnalyzed || 1;
  const avgWordsPerPage = contentStats.wordCount / pagesAnalyzed;
  const avgWordScore = avgWordsPerPage < 300 ? (avgWordsPerPage / 300) * 40 :
                       avgWordsPerPage < 800 ? 40 + ((avgWordsPerPage - 300) / 500) * 30 :
                       avgWordsPerPage < 1500 ? 70 + ((avgWordsPerPage - 800) / 700) * 20 :
                       90;

  const headingVariety = new Set(headings.map(h => h.level)).size;
  const headingDepthScore = Math.min(25, headingVariety * 5 + Math.min(10, headings.length / pagesAnalyzed));
  const avgParagraphsPerPage = contentStats.paragraphCount / pagesAnalyzed;
  const paragraphDepthScore = Math.min(25, avgParagraphsPerPage * 2);
  const semanticRichness = Math.round(
    Math.min(100, avgWordScore * 0.5 + headingDepthScore + paragraphDepthScore)
  );

  // Structured Data
  const highValueSchemas = ['FAQPage', 'HowTo', 'Article', 'Product', 'Organization', 'LocalBusiness'];
  const schemaTypes = schemaMarkup.map(s => s.type);
  const highValueCount = schemaTypes.filter(t => highValueSchemas.includes(t)).length;
  const structuredData = Math.min(100, Math.round(
    schemaMarkup.length * 15 + highValueCount * 20
  ));

  // Natural Language
  const sentenceLengthScore = Math.max(0, 100 - Math.abs(contentStats.avgSentenceLength - 17) * 5);
  const naturalLanguage = Math.round(
    contentStats.readabilityScore * 0.6 +
    sentenceLengthScore * 0.4
  );

  // Keyword Relevance
  let keywordScore = 0;
  if (keywordAnalysis.titleContainsKeyword) keywordScore += 35;
  if (keywordAnalysis.h1ContainsKeyword) keywordScore += 25;
  if (keywordAnalysis.metaContainsKeyword) keywordScore += 20;
  const densityScore = keywordAnalysis.keywordDensity >= 1 && keywordAnalysis.keywordDensity <= 3 ? 20 :
                       keywordAnalysis.keywordDensity > 0 ? 10 : 0;
  const keywordRelevance = Math.min(100, keywordScore + densityScore);

  return {
    contentClarity: Math.max(0, Math.min(100, contentClarity)),
    semanticRichness: Math.max(0, Math.min(100, semanticRichness)),
    structuredData: Math.max(0, Math.min(100, structuredData)),
    naturalLanguage: Math.max(0, Math.min(100, naturalLanguage)),
    keywordRelevance: Math.max(0, Math.min(100, keywordRelevance)),
  };
}

// Generate insights from crawl data
export function generateInsightsFromCrawl(crawlData: CrawlData, metrics: Analysis['metrics']): string {
  const insights: string[] = [];
  const { contentStats, blufAnalysis, schemaMarkup, technicalSignals, keywordAnalysis } = crawlData;

  const avgScore = Object.values(metrics).reduce((a, b) => a + b, 0) / 5;
  if (avgScore >= 75) {
    insights.push(`Good news! Your website is well-prepared for AI search. AI assistants can understand your business and are likely to recommend you.`);
  } else if (avgScore >= 50) {
    insights.push(`Your website has a decent foundation, but there's room to improve. With a few changes, AI assistants will be more likely to recommend you.`);
  } else {
    insights.push(`Your website needs work before AI assistants will confidently recommend you. The good news: the fixes are straightforward.`);
  }

  if (schemaMarkup.length === 0) {
    insights.push(`Important: AI has no way to verify your business. Adding schema markup (like a digital business card) would help AI trust and recommend you.`);
  } else {
    const types = schemaMarkup.map(s => s.type).join(', ');
    insights.push(`Good: AI can identify you as a ${types.toLowerCase().replace('page', '')}.`);
  }

  if (blufAnalysis.score < 40) {
    insights.push(`Your content buries the main points. AI reads the first sentence after each heading - make sure it contains your answer, not just an introduction.`);
  } else if (blufAnalysis.score >= 70) {
    insights.push(`Nice work! Your content puts answers first, which is exactly what AI looks for when deciding what to quote.`);
  }

  if (!technicalSignals.mobileViewport) {
    insights.push(`Your site isn't optimized for phones. Since most people use AI on mobile, this could hurt your visibility.`);
  }

  if (contentStats.wordCount < 500) {
    insights.push(`Your content is quite short (${contentStats.wordCount} words). AI prefers thorough information it can trust and cite.`);
  }

  if (!keywordAnalysis.titleContainsKeyword) {
    insights.push(`Your target keywords aren't in your page title. AI uses the title to understand what your page is about.`);
  }

  return insights.join(' ');
}

// Generate issues list from crawl data
export function generateIssuesFromCrawl(crawlData: CrawlData): { type: 'error' | 'warning' | 'info'; message: string }[] {
  const issues: { type: 'error' | 'warning' | 'info'; message: string }[] = [];
  const { contentStats, blufAnalysis, schemaMarkup, technicalSignals, keywordAnalysis, headings, title, metaDescription } = crawlData;

  // Critical errors
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

  // Warnings
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

  // Info
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
