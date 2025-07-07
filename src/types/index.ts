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
}

export interface Project {
  id: string;
  userId: string;
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