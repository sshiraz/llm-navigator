export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  subscription: 'free' | 'trial' | 'starter' | 'professional' | 'enterprise';
  trialEndsAt?: string;
  createdAt: string;
  isAdmin?: boolean;
  deviceFingerprint?: string;
  ipAddress?: string;
  paymentMethodAdded?: boolean;
  // Subscription management
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  cancelAtPeriodEnd?: boolean;
  subscriptionEndsAt?: string;
}

export interface Project {
  id: string;
  name: string;
  website: string;
  description?: string;
  keywords: string[];
  competitors: Competitor[];
  createdAt: string;
  updatedAt: string;
}

export interface Competitor {
  id: string;
  name: string;
  website: string;
  addedAt: string;
}

export interface Analysis {
  id: string;
  projectId: string;
  userId: string;
  website: string;
  keywords: string[];
  score: number;
  model?: string;
  metrics: {
    contentClarity: number;
    semanticRichness: number;
    structuredData: number;
    naturalLanguage: number;
    keywordRelevance: number;
  };
  insights: string;
  predictedRank: number;
  category: string;
  recommendations: Recommendation[];
  createdAt: string;
  isSimulated?: boolean; // Flag to indicate simulated vs real analysis
  modelVariantId?: string; // Reference to the model variant used
  costInfo?: {
    totalCost: number;
    breakdown: {
      crawling: number;
      embeddings: number;
      insights: number;
      total: number;
    };
    tokensUsed: {
      input: number;
      output: number;
      embeddings: number;
    };
  };
  // Crawl data for displaying page details
  crawlData?: {
    url: string;
    title: string;
    metaDescription: string;
    headings: { level: number; text: string; hasDirectAnswer: boolean }[];
    schemaTypes: string[];
    contentStats: {
      wordCount: number;
      paragraphCount: number;
      avgSentenceLength: number;
      readabilityScore: number;
    };
    technicalSignals: {
      hasCanonical: boolean;
      hasOpenGraph: boolean;
      hasTwitterCard: boolean;
      mobileViewport: boolean;
      hasHttps: boolean;
      loadTime: number;
    };
    issues: { type: 'error' | 'warning' | 'info'; message: string }[];
    // Multi-page crawl data
    pagesAnalyzed?: number;
    pages?: {
      url: string;
      title: string;
      wordCount: number;
      headingsCount: number;
      schemaCount: number;
      issues: string[];
    }[];
  };
  // AEO citation results (for Answer Engine Optimization analyses)
  citationResults?: CitationResult[];
  overallCitationRate?: number;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
  expectedImpact: number;
}

export interface KeywordSuggestion {
  keyword: string;
  intent: 'informational' | 'commercial' | 'navigational' | 'transactional';
  difficulty: number;
  opportunity: number;
}

export interface TrialStatus {
  isActive: boolean;
  daysRemaining: number;
  plan: string;
  features: string[];
  limitations: string[];
}

export interface FraudPreventionCheck {
  isAllowed: boolean;
  reason?: string;
  riskScore: number;
  checks: {
    emailSimilarity: boolean;
    deviceFingerprint: boolean;
    ipAddress: boolean;
    browserPattern: boolean;
    timePattern: boolean;
  };
}

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
    model?: number;
    embeddings: number;
  };
  provider: 'openai' | 'anthropic' | 'perplexity' | 'local'; 
  modelVariantId?: string; // Reference to the model variant used
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

export type AnalysisProvider = 'openai' | 'anthropic' | 'perplexity' | 'local';

// ============================================
// AEO (Answer Engine Optimization) Types
// ============================================

export interface Prompt {
  id: string;
  text: string;  // e.g., "best restaurants in San Jose"
  category?: 'informational' | 'commercial' | 'navigational' | 'transactional';
}

export interface CompetitorCitation {
  domain: string;
  url?: string;
  context: string;  // The text mentioning this competitor
  position: number; // Order in response (1st, 2nd, etc.)
}

export interface CitationResult {
  promptId: string;
  prompt: string;
  provider: AnalysisProvider;
  modelUsed: string;
  response: string;
  isCited: boolean;
  citationContext?: string;  // The exact text mentioning user's site
  competitorsCited: CompetitorCitation[];
  timestamp: string;
  tokensUsed: number;
  cost: number;
}

export interface AEORecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
  expectedImpact: string;  // e.g., "Increase citation rate by ~15%"
  relatedPrompts: string[];  // Which prompts this would help with
}

export interface AEOAnalysis {
  id: string;
  userId: string;
  projectId?: string;
  website: string;
  brandName?: string;
  prompts: Prompt[];
  citationResults: CitationResult[];
  overallCitationRate: number;  // Percentage of prompts where user was cited
  providersUsed: AnalysisProvider[];
  // Content analysis from crawl
  contentAnalysis: {
    blufScore: number;
    schemaScore: number;
    readabilityScore: number;
    contentDepth: number;
  };
  // Keep existing crawl data for WHY analysis
  crawlData?: Analysis['crawlData'];
  recommendations: AEORecommendation[];
  createdAt: string;
  isSimulated: boolean;
  costInfo: {
    totalCost: number;
    breakdown: {
      crawling: number;
      citationChecks: number;
      total: number;
    };
  };
}