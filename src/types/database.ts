import type { AnalysisProvider, Recommendation } from './index';

// Reusable type definitions for database schema
type AnalysisMetrics = {
  contentClarity: number;
  semanticRichness: number;
  structuredData: number;
  naturalLanguage: number;
  keywordRelevance: number;
};

type CostInfo = {
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

type CrawlDataType = {
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
};

type ApiCosts = {
  crawling: number;
  embeddings: number;
  insights: number;
  total: number;
};

type ApiTokens = {
  input: number;
  output: number;
  embeddings: number;
};

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          avatar_url?: string;
          subscription: 'free' | 'trial' | 'starter' | 'professional' | 'enterprise';
          trial_ends_at?: string;
          device_fingerprint?: string;
          ip_address?: string;
          payment_method_added?: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          avatar_url?: string;
          subscription?: 'free' | 'trial' | 'starter' | 'professional' | 'enterprise';
          trial_ends_at?: string;
          device_fingerprint?: string;
          ip_address?: string;
          payment_method_added?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          avatar_url?: string;
          subscription?: 'free' | 'trial' | 'starter' | 'professional' | 'enterprise';
          trial_ends_at?: string;
          device_fingerprint?: string;
          ip_address?: string;
          payment_method_added?: boolean;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          website: string;
          description?: string;
          keywords: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          website: string;
          description?: string;
          keywords: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          website?: string;
          description?: string;
          keywords?: string[];
          updated_at?: string;
        };
      };
      competitors: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          website: string;
          added_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          website: string;
          added_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          website?: string;
        };
      };
      analyses: {
        Row: {
          id: string;
          project_id?: string;
          user_id: string;
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
          predicted_rank: number;
          category: string;
          recommendations: Recommendation[];
          is_simulated: boolean;
          cost_info?: CostInfo;
          crawl_data?: CrawlDataType;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id?: string;
          user_id: string;
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
          predicted_rank: number;
          category: string;
          recommendations: Recommendation[];
          is_simulated?: boolean;
          cost_info?: CostInfo;
          crawl_data?: CrawlDataType;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          website?: string;
          keywords?: string[];
          score?: number;
          model?: string;
          metrics?: AnalysisMetrics;
          insights?: string;
          predicted_rank?: number;
          category?: string;
          recommendations?: Recommendation[];
          is_simulated?: boolean;
          cost_info?: CostInfo;
          crawl_data?: CrawlDataType;
        };
      };
      api_usage: {
        Row: {
          id: string;
          user_id: string;
          analysis_id: string;
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
          error_code?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          analysis_id: string;
          timestamp?: string;
          costs: ApiCosts;
          tokens: ApiTokens;
          provider: AnalysisProvider;
          success: boolean;
          error_code?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          analysis_id?: string;
          costs?: ApiCosts;
          tokens?: ApiTokens;
          provider?: AnalysisProvider;
          success?: boolean;
          error_code?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      subscription_type: 'free' | 'trial' | 'starter' | 'professional' | 'enterprise';
      analysis_provider: AnalysisProvider;
    };
  };
}