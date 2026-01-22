// Types for website crawl results from edge function

// AI Crawler status in robots.txt
export type AICrawlerStatus = 'allowed' | 'blocked' | 'not_specified';

export interface AICrawlerRule {
  crawler: string;
  description: string;
  status: AICrawlerStatus;
  isSearchCrawler: boolean; // true = search/citation, false = training
}

export interface RobotsTxtAnalysis {
  exists: boolean;
  fetchError?: string;
  crawlers: AICrawlerRule[];
  hasBlockedSearchCrawlers: boolean; // true = bad for AEO visibility
  hasBlockedTrainingCrawlers: boolean;
  rawContent?: string;
}

// AI Platform registration recommendations
export interface AIPlatformRecommendation {
  platform: string;
  url: string;
  description: string;
  applicable: boolean; // true if site should register
  reason: string;
}

export interface AIReadinessAnalysis {
  robotsTxt: RobotsTxtAnalysis;
  platformRecommendations: AIPlatformRecommendation[];
  isEcommerce: boolean;
  overallStatus: 'good' | 'warning' | 'critical';
  issues: string[];
}

export interface CrawlHeading {
  level: number;
  text: string;
  hasDirectAnswer: boolean;
  followingContent: string;
}

export interface SchemaMarkup {
  type: string;
  properties: Record<string, unknown>;
}

export interface ContentStats {
  wordCount: number;
  paragraphCount: number;
  avgSentenceLength: number;
  readabilityScore: number;
}

export interface TechnicalSignals {
  hasCanonical: boolean;
  hasOpenGraph: boolean;
  hasTwitterCard: boolean;
  loadTime: number;
  mobileViewport: boolean;
  hasHttps: boolean;
}

export interface BlufAnalysis {
  score: number;
  directAnswers: { heading: string; answer: string }[];
  totalHeadings: number;
  headingsWithDirectAnswers: number;
}

export interface KeywordAnalysis {
  titleContainsKeyword: boolean;
  h1ContainsKeyword: boolean;
  metaContainsKeyword: boolean;
  keywordDensity: number;
  keywordOccurrences: number;
}

// Per-page summary for multi-page crawl
export interface PageSummary {
  url: string;
  title: string;
  wordCount: number;
  headingsCount: number;
  schemaCount: number;
  issues: string[];
}

// Aggregated stats across all pages
export interface AggregatedStats {
  totalWords: number;
  totalHeadings: number;
  totalSchemas: number;
  avgReadability: number;
  pagesWithSchema: number;
  pagesWithMeta: number;
}

export interface CrawlData {
  url: string;
  title: string;
  metaDescription: string;
  headings: CrawlHeading[];
  schemaMarkup: SchemaMarkup[];
  contentStats: ContentStats;
  technicalSignals: TechnicalSignals;
  blufAnalysis: BlufAnalysis;
  keywordAnalysis: KeywordAnalysis;
  // Multi-page crawl data
  pagesAnalyzed?: number;
  pages?: PageSummary[];
  aggregatedStats?: AggregatedStats;
  // AI Readiness analysis
  aiReadiness?: AIReadinessAnalysis;
}

export interface CrawlResult {
  success: boolean;
  data?: CrawlData;
  error?: string;
}
