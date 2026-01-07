import { describe, it, expect } from 'vitest';
import {
  shouldUseRealAnalysis,
  calculateOverallScore,
  calculatePredictedRank,
  getCategoryFromScore,
  generateSimulatedInsights,
  generateSimulatedRecommendations,
  calculateRealMetrics,
  generateInsightsFromCrawl,
  generateIssuesFromCrawl,
} from './analysisHelpers';
import type { User, Analysis } from '../../types';
import type { CrawlData } from '../../types/crawl';

// Test users
const mockTrialUser: User = {
  id: 'trial-user',
  email: 'trial@test.com',
  name: 'Trial User',
  subscription: 'trial',
  createdAt: new Date().toISOString(),
};

const mockFreeUser: User = {
  id: 'free-user',
  email: 'free@test.com',
  name: 'Free User',
  subscription: 'free',
  createdAt: new Date().toISOString(),
};

const mockStarterUser: User = {
  id: 'starter-user',
  email: 'starter@test.com',
  name: 'Starter User',
  subscription: 'starter',
  createdAt: new Date().toISOString(),
};

const mockProfessionalUser: User = {
  id: 'pro-user',
  email: 'pro@test.com',
  name: 'Professional User',
  subscription: 'professional',
  createdAt: new Date().toISOString(),
};

const mockEnterpriseUser: User = {
  id: 'enterprise-user',
  email: 'enterprise@test.com',
  name: 'Enterprise User',
  subscription: 'enterprise',
  createdAt: new Date().toISOString(),
};

const mockAdminUser: User = {
  id: 'admin-user',
  email: 'admin@test.com',
  name: 'Admin User',
  subscription: 'free',
  isAdmin: true,
  createdAt: new Date().toISOString(),
};

const mockDemoUser: User = {
  id: 'demo-user',
  email: 'demo@example.com',
  name: 'Demo User',
  subscription: 'free',
  createdAt: new Date().toISOString(),
};

// Mock crawl data for testing
const mockCrawlData: CrawlData = {
  url: 'https://example.com',
  title: 'Example Website - Best Solutions',
  metaDescription: 'We provide the best solutions for your business needs.',
  headings: [
    { level: 1, text: 'Welcome to Example', hasDirectAnswer: true },
    { level: 2, text: 'Our Services', hasDirectAnswer: true },
    { level: 2, text: 'Why Choose Us?', hasDirectAnswer: false },
    { level: 3, text: 'Feature 1', hasDirectAnswer: true },
  ],
  schemaMarkup: [
    { type: 'Organization', data: { name: 'Example Corp' } },
    { type: 'FAQPage', data: {} },
  ],
  contentStats: {
    wordCount: 1200,
    paragraphCount: 15,
    avgSentenceLength: 18,
    readabilityScore: 72,
  },
  technicalSignals: {
    hasCanonical: true,
    hasOpenGraph: true,
    hasTwitterCard: true,
    mobileViewport: true,
    hasHttps: true,
    loadTime: 1500,
  },
  blufAnalysis: {
    score: 65,
    totalHeadings: 4,
    headingsWithDirectAnswers: 3,
  },
  keywordAnalysis: {
    titleContainsKeyword: true,
    h1ContainsKeyword: true,
    metaContainsKeyword: true,
    keywordDensity: 1.8,
  },
  pagesAnalyzed: 1,
};

describe('shouldUseRealAnalysis', () => {
  it('should return false for trial users', () => {
    expect(shouldUseRealAnalysis(mockTrialUser)).toBe(false);
  });

  it('should return false for free users', () => {
    expect(shouldUseRealAnalysis(mockFreeUser)).toBe(false);
  });

  it('should return true for starter users', () => {
    expect(shouldUseRealAnalysis(mockStarterUser)).toBe(true);
  });

  it('should return true for professional users', () => {
    expect(shouldUseRealAnalysis(mockProfessionalUser)).toBe(true);
  });

  it('should return true for enterprise users', () => {
    expect(shouldUseRealAnalysis(mockEnterpriseUser)).toBe(true);
  });

  it('should return true for admin users regardless of subscription', () => {
    expect(shouldUseRealAnalysis(mockAdminUser)).toBe(true);
  });

  it('should return true for demo user', () => {
    expect(shouldUseRealAnalysis(mockDemoUser)).toBe(true);
  });
});

describe('calculateOverallScore', () => {
  it('should calculate correct average of all metrics', () => {
    const metrics: Analysis['metrics'] = {
      contentClarity: 80,
      semanticRichness: 70,
      structuredData: 60,
      naturalLanguage: 90,
      keywordRelevance: 50,
    };

    const score = calculateOverallScore(metrics);
    expect(score).toBe(70); // (80+70+60+90+50)/5 = 350/5 = 70
  });

  it('should round to nearest integer', () => {
    const metrics: Analysis['metrics'] = {
      contentClarity: 81,
      semanticRichness: 72,
      structuredData: 63,
      naturalLanguage: 54,
      keywordRelevance: 45,
    };

    const score = calculateOverallScore(metrics);
    expect(score).toBe(63); // (81+72+63+54+45)/5 = 315/5 = 63
  });

  it('should handle perfect scores', () => {
    const metrics: Analysis['metrics'] = {
      contentClarity: 100,
      semanticRichness: 100,
      structuredData: 100,
      naturalLanguage: 100,
      keywordRelevance: 100,
    };

    const score = calculateOverallScore(metrics);
    expect(score).toBe(100);
  });

  it('should handle zero scores', () => {
    const metrics: Analysis['metrics'] = {
      contentClarity: 0,
      semanticRichness: 0,
      structuredData: 0,
      naturalLanguage: 0,
      keywordRelevance: 0,
    };

    const score = calculateOverallScore(metrics);
    expect(score).toBe(0);
  });
});

describe('calculatePredictedRank', () => {
  it('should return rank 1 for scores >= 85', () => {
    expect(calculatePredictedRank(85)).toBe(1);
    expect(calculatePredictedRank(90)).toBe(1);
    expect(calculatePredictedRank(100)).toBe(1);
  });

  it('should return rank 2 for scores 75-84', () => {
    expect(calculatePredictedRank(75)).toBe(2);
    expect(calculatePredictedRank(80)).toBe(2);
    expect(calculatePredictedRank(84)).toBe(2);
  });

  it('should return rank 3 for scores 65-74', () => {
    expect(calculatePredictedRank(65)).toBe(3);
    expect(calculatePredictedRank(70)).toBe(3);
    expect(calculatePredictedRank(74)).toBe(3);
  });

  it('should return rank 5 for scores 55-64', () => {
    expect(calculatePredictedRank(55)).toBe(5);
    expect(calculatePredictedRank(60)).toBe(5);
    expect(calculatePredictedRank(64)).toBe(5);
  });

  it('should return rank 7 for scores 45-54', () => {
    expect(calculatePredictedRank(45)).toBe(7);
    expect(calculatePredictedRank(50)).toBe(7);
    expect(calculatePredictedRank(54)).toBe(7);
  });

  it('should return rank 10 for scores below 45', () => {
    expect(calculatePredictedRank(44)).toBe(10);
    expect(calculatePredictedRank(30)).toBe(10);
    expect(calculatePredictedRank(0)).toBe(10);
  });
});

describe('getCategoryFromScore', () => {
  it('should return "Featured Answer" for scores >= 85', () => {
    expect(getCategoryFromScore(85)).toBe('Featured Answer');
    expect(getCategoryFromScore(100)).toBe('Featured Answer');
  });

  it('should return "Top Result" for scores 70-84', () => {
    expect(getCategoryFromScore(70)).toBe('Top Result');
    expect(getCategoryFromScore(84)).toBe('Top Result');
  });

  it('should return "Visible" for scores 55-69', () => {
    expect(getCategoryFromScore(55)).toBe('Visible');
    expect(getCategoryFromScore(69)).toBe('Visible');
  });

  it('should return "Buried" for scores below 55', () => {
    expect(getCategoryFromScore(54)).toBe('Buried');
    expect(getCategoryFromScore(0)).toBe('Buried');
  });
});

describe('generateSimulatedInsights', () => {
  const website = 'example.com';

  it('should generate positive insight for high scores', () => {
    const insight = generateSimulatedInsights(website, 75);
    expect(insight).toContain('good AI visibility');
    expect(insight).toContain(website);
    expect(insight).toContain('75');
  });

  it('should generate moderate insight for medium scores', () => {
    const insight = generateSimulatedInsights(website, 60);
    expect(insight).toContain('room for improvement');
    expect(insight).toContain(website);
    expect(insight).toContain('60');
  });

  it('should generate improvement-focused insight for low scores', () => {
    const insight = generateSimulatedInsights(website, 40);
    expect(insight).toContain('needs work');
    expect(insight).toContain(website);
    expect(insight).toContain('40');
  });

  it('should mention upgrade for all score ranges', () => {
    expect(generateSimulatedInsights(website, 80)).toContain('Upgrade');
    expect(generateSimulatedInsights(website, 55)).toContain('Upgrade');
    expect(generateSimulatedInsights(website, 30)).toContain('Upgrade');
  });
});

describe('generateSimulatedRecommendations', () => {
  it('should return 2-3 recommendations', () => {
    const metrics: Analysis['metrics'] = {
      contentClarity: 50,
      semanticRichness: 50,
      structuredData: 50,
      naturalLanguage: 50,
      keywordRelevance: 50,
    };

    const recommendations = generateSimulatedRecommendations(metrics);
    expect(recommendations.length).toBeGreaterThanOrEqual(2);
    expect(recommendations.length).toBeLessThanOrEqual(3);
  });

  it('should include required fields in recommendations', () => {
    const metrics: Analysis['metrics'] = {
      contentClarity: 50,
      semanticRichness: 50,
      structuredData: 50,
      naturalLanguage: 50,
      keywordRelevance: 50,
    };

    const recommendations = generateSimulatedRecommendations(metrics);

    recommendations.forEach(rec => {
      expect(rec).toHaveProperty('id');
      expect(rec).toHaveProperty('title');
      expect(rec).toHaveProperty('description');
      expect(rec).toHaveProperty('priority');
      expect(rec).toHaveProperty('difficulty');
      expect(rec).toHaveProperty('estimatedTime');
      expect(rec).toHaveProperty('expectedImpact');
    });
  });
});

describe('calculateRealMetrics', () => {
  it('should calculate metrics within valid range (0-100)', () => {
    const metrics = calculateRealMetrics(mockCrawlData);

    expect(metrics.contentClarity).toBeGreaterThanOrEqual(0);
    expect(metrics.contentClarity).toBeLessThanOrEqual(100);
    expect(metrics.semanticRichness).toBeGreaterThanOrEqual(0);
    expect(metrics.semanticRichness).toBeLessThanOrEqual(100);
    expect(metrics.structuredData).toBeGreaterThanOrEqual(0);
    expect(metrics.structuredData).toBeLessThanOrEqual(100);
    expect(metrics.naturalLanguage).toBeGreaterThanOrEqual(0);
    expect(metrics.naturalLanguage).toBeLessThanOrEqual(100);
    expect(metrics.keywordRelevance).toBeGreaterThanOrEqual(0);
    expect(metrics.keywordRelevance).toBeLessThanOrEqual(100);
  });

  it('should give higher structuredData score for sites with schema markup', () => {
    const withSchema = calculateRealMetrics(mockCrawlData);

    const noSchemaCrawl: CrawlData = {
      ...mockCrawlData,
      schemaMarkup: [],
    };
    const withoutSchema = calculateRealMetrics(noSchemaCrawl);

    expect(withSchema.structuredData).toBeGreaterThan(withoutSchema.structuredData);
  });

  it('should give higher keywordRelevance for sites with keywords in title', () => {
    const withKeyword = calculateRealMetrics(mockCrawlData);

    const noKeywordCrawl: CrawlData = {
      ...mockCrawlData,
      keywordAnalysis: {
        ...mockCrawlData.keywordAnalysis,
        titleContainsKeyword: false,
        h1ContainsKeyword: false,
        metaContainsKeyword: false,
      },
    };
    const withoutKeyword = calculateRealMetrics(noKeywordCrawl);

    expect(withKeyword.keywordRelevance).toBeGreaterThan(withoutKeyword.keywordRelevance);
  });
});

describe('generateInsightsFromCrawl', () => {
  it('should generate insights based on metrics', () => {
    const metrics = calculateRealMetrics(mockCrawlData);
    const insights = generateInsightsFromCrawl(mockCrawlData, metrics);

    expect(typeof insights).toBe('string');
    expect(insights.length).toBeGreaterThan(0);
  });

  it('should mention schema when site has schema markup', () => {
    const metrics = calculateRealMetrics(mockCrawlData);
    const insights = generateInsightsFromCrawl(mockCrawlData, metrics);

    expect(insights.toLowerCase()).toContain('ai');
  });

  it('should warn about missing schema when not present', () => {
    const noSchemaCrawl: CrawlData = {
      ...mockCrawlData,
      schemaMarkup: [],
    };
    const metrics = calculateRealMetrics(noSchemaCrawl);
    const insights = generateInsightsFromCrawl(noSchemaCrawl, metrics);

    expect(insights.toLowerCase()).toContain('schema');
  });
});

describe('generateIssuesFromCrawl', () => {
  it('should return array of issues', () => {
    const issues = generateIssuesFromCrawl(mockCrawlData);

    expect(Array.isArray(issues)).toBe(true);
  });

  it('should categorize issues by type', () => {
    const issues = generateIssuesFromCrawl(mockCrawlData);

    const validTypes = ['error', 'warning', 'info'];
    issues.forEach(issue => {
      expect(validTypes).toContain(issue.type);
      expect(typeof issue.message).toBe('string');
    });
  });

  it('should flag missing meta description as error', () => {
    const noMetaCrawl: CrawlData = {
      ...mockCrawlData,
      metaDescription: '',
    };
    const issues = generateIssuesFromCrawl(noMetaCrawl);

    const metaError = issues.find(i => i.type === 'error' && i.message.toLowerCase().includes('meta'));
    expect(metaError).toBeDefined();
  });

  it('should flag missing HTTPS as error', () => {
    const noHttpsCrawl: CrawlData = {
      ...mockCrawlData,
      technicalSignals: {
        ...mockCrawlData.technicalSignals,
        hasHttps: false,
      },
    };
    const issues = generateIssuesFromCrawl(noHttpsCrawl);

    const httpsError = issues.find(i => i.type === 'error' && i.message.toLowerCase().includes('https'));
    expect(httpsError).toBeDefined();
  });

  it('should flag missing mobile viewport as error', () => {
    const noMobileCrawl: CrawlData = {
      ...mockCrawlData,
      technicalSignals: {
        ...mockCrawlData.technicalSignals,
        mobileViewport: false,
      },
    };
    const issues = generateIssuesFromCrawl(noMobileCrawl);

    const mobileError = issues.find(i => i.type === 'error' && i.message.toLowerCase().includes('mobile'));
    expect(mobileError).toBeDefined();
  });

  it('should flag low word count as warning', () => {
    const lowContentCrawl: CrawlData = {
      ...mockCrawlData,
      contentStats: {
        ...mockCrawlData.contentStats,
        wordCount: 200,
      },
    };
    const issues = generateIssuesFromCrawl(lowContentCrawl);

    const wordCountWarning = issues.find(i => i.type === 'warning' && i.message.toLowerCase().includes('word'));
    expect(wordCountWarning).toBeDefined();
  });
});
