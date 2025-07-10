import type { AnalysisProvider } from './index';

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
          project_id: string;
          user_id: string;
          website: string;
          keywords: string[];
          score: number;
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
          recommendations: any[];
          is_simulated: boolean;
          cost_info?: {
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
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          website: string;
          keywords: string[];
          score: number;
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
          recommendations: any[];
          is_simulated?: boolean;
          cost_info?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          website?: string;
          keywords?: string[];
          score?: number;
          metrics?: any;
          insights?: string;
          predicted_rank?: number;
          category?: string;
          recommendations?: any[];
          is_simulated?: boolean;
          cost_info?: any;
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
          costs: any;
          tokens: any;
          provider: AnalysisProvider;
          success: boolean;
          error_code?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          analysis_id?: string;
          costs?: any;
          tokens?: any;
          provider?: AnalysisProvider;
          success?: boolean;
          error_code?: string;
        };
      };
      fraud_checks: {
        Row: {
          id: string;
          email: string;
          normalized_email: string;
          device_fingerprint: string;
          ip_address: string;
          risk_score: number;
          is_allowed: boolean;
          reason?: string;
          checks: {
            emailSimilarity: boolean;
            deviceFingerprint: boolean;
            ipAddress: boolean;
            browserPattern: boolean;
            timePattern: boolean;
          };
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          normalized_email: string;
          device_fingerprint: string;
          ip_address: string;
          risk_score: number;
          is_allowed: boolean;
          reason?: string;
          checks: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          normalized_email?: string;
          device_fingerprint?: string;
          ip_address?: string;
          risk_score?: number;
          is_allowed?: boolean;
          reason?: string;
          checks?: any;
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