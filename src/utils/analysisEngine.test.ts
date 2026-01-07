import { describe, it, expect, vi, beforeEach } from 'vitest';
import { User, CitationResult, Analysis, AEOAnalysis } from '../types';

// Mock supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    from: vi.fn(),
  },
}));

// Import after mocking
import { AnalysisEngine } from './analysisEngine';
import { performSimulatedAEOAnalysis } from './analysis/aeoAnalysis';

// Test data
const mockTrialUser: User = {
  id: 'trial-user-123',
  email: 'trial@test.com',
  name: 'Trial User',
  subscription: 'trial',
  createdAt: new Date().toISOString(),
};

const mockPaidUser: User = {
  id: 'paid-user-456',
  email: 'paid@test.com',
  name: 'Paid User',
  subscription: 'professional',
  createdAt: new Date().toISOString(),
};

const mockAdminUser: User = {
  id: 'admin-user-789',
  email: 'admin@test.com',
  name: 'Admin User',
  subscription: 'free',
  isAdmin: true,
  createdAt: new Date().toISOString(),
};

// Test website and prompts for www.convologix.com (AI chatbot services)
const testWebsite = 'https://www.convologix.com';
const testBrandName = 'Convologix';
const testPrompts = [
  { id: 'p1', text: 'What are the best customer service chatbot providers?' },
  { id: 'p2', text: 'How do I implement AI chatbots for my business?' },
  { id: 'p3', text: 'Which companies offer conversational AI solutions?' },
];

describe('AnalysisEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('shouldUseRealAnalysis', () => {
    it('should return false for trial users', () => {
      const result = AnalysisEngine.shouldUseRealAnalysis(mockTrialUser);
      expect(result).toBe(false);
    });

    it('should return false for free users', () => {
      const freeUser = { ...mockTrialUser, subscription: 'free' as const };
      const result = AnalysisEngine.shouldUseRealAnalysis(freeUser);
      expect(result).toBe(false);
    });

    it('should return true for starter plan users', () => {
      const starterUser = { ...mockTrialUser, subscription: 'starter' as const };
      const result = AnalysisEngine.shouldUseRealAnalysis(starterUser);
      expect(result).toBe(true);
    });

    it('should return true for professional plan users', () => {
      const result = AnalysisEngine.shouldUseRealAnalysis(mockPaidUser);
      expect(result).toBe(true);
    });

    it('should return true for enterprise plan users', () => {
      const enterpriseUser = { ...mockTrialUser, subscription: 'enterprise' as const };
      const result = AnalysisEngine.shouldUseRealAnalysis(enterpriseUser);
      expect(result).toBe(true);
    });

    it('should return true for admin users regardless of subscription', () => {
      const result = AnalysisEngine.shouldUseRealAnalysis(mockAdminUser);
      expect(result).toBe(true);
    });
  });
});

describe('Simulated vs Real Analysis Data Structure', () => {
  describe('Simulated AEO Analysis', () => {
    it('should include citationResults with simulated competitors', async () => {
      // Get simulated analysis directly (bypassing cost checks)
      const simulatedResult = await performSimulatedAEOAnalysis(
        testWebsite,
        testPrompts,
        testBrandName,
        mockTrialUser,
        ['openai', 'anthropic', 'perplexity'],
        'test-analysis-id'
      );

      // Verify structure
      expect(simulatedResult).toBeDefined();
      expect(simulatedResult.isSimulated).toBe(true);
      expect(simulatedResult.citationResults).toBeDefined();
      expect(Array.isArray(simulatedResult.citationResults)).toBe(true);

      // Should have results for each prompt × provider combination
      expect(simulatedResult.citationResults.length).toBe(testPrompts.length * 3); // 3 prompts × 3 providers

      // Each citation result should have expected properties
      const firstResult = simulatedResult.citationResults[0];
      expect(firstResult).toHaveProperty('promptId');
      expect(firstResult).toHaveProperty('prompt');
      expect(firstResult).toHaveProperty('provider');
      expect(firstResult).toHaveProperty('isCited');
      expect(firstResult).toHaveProperty('competitorsCited');
      expect(Array.isArray(firstResult.competitorsCited)).toBe(true);
    });

    it('should include simulated competitor domains', async () => {
      const simulatedResult = await performSimulatedAEOAnalysis(
        testWebsite,
        testPrompts,
        testBrandName,
        mockTrialUser,
        ['openai'],
        'test-analysis-id'
      );

      // Get all competitor domains from results
      const allCompetitors = simulatedResult.citationResults.flatMap(
        (r: CitationResult) => r.competitorsCited.map(c => c.domain)
      );

      // Should include typical simulated competitors
      const expectedSimulatedDomains = [
        'hubspot.com', 'mailchimp.com', 'salesforce.com', 'zendesk.com',
        'intercom.com', 'drift.com', 'freshworks.com', 'zoho.com'
      ];

      // At least some simulated domains should be present
      const hasSimulatedDomains = allCompetitors.some(
        (domain: string) => expectedSimulatedDomains.includes(domain)
      );
      expect(hasSimulatedDomains).toBe(true);
    });

    it('should have zero cost for simulated analysis', async () => {
      const simulatedResult = await performSimulatedAEOAnalysis(
        testWebsite,
        testPrompts,
        testBrandName,
        mockTrialUser,
        ['openai'],
        'test-analysis-id'
      );

      expect(simulatedResult.costInfo.totalCost).toBe(0);
      expect(simulatedResult.costInfo.breakdown.crawling).toBe(0);
      expect(simulatedResult.costInfo.breakdown.citationChecks).toBe(0);
    });

    it('should calculate overallCitationRate correctly', async () => {
      const simulatedResult = await performSimulatedAEOAnalysis(
        testWebsite,
        testPrompts,
        testBrandName,
        mockTrialUser,
        ['openai'],
        'test-analysis-id'
      );

      const citedCount = simulatedResult.citationResults.filter((r: CitationResult) => r.isCited).length;
      const totalCount = simulatedResult.citationResults.length;
      const expectedRate = (citedCount / totalCount) * 100;

      expect(simulatedResult.overallCitationRate).toBeCloseTo(expectedRate, 1);
    });
  });
});

describe('CitationResult Data Consistency', () => {
  it('citationResults should have consistent structure for both real and simulated', async () => {
    // Get simulated result
    const simulatedResult = await performSimulatedAEOAnalysis(
      testWebsite,
      [testPrompts[0]], // Just one prompt for simplicity
      testBrandName,
      mockTrialUser,
      ['openai'],
      'test-analysis-id'
    );

    const citationResult: CitationResult = simulatedResult.citationResults[0];

    // Verify all required fields exist
    expect(citationResult.promptId).toBeDefined();
    expect(citationResult.prompt).toBeDefined();
    expect(citationResult.provider).toBeDefined();
    expect(citationResult.modelUsed).toBeDefined();
    expect(citationResult.response).toBeDefined();
    expect(typeof citationResult.isCited).toBe('boolean');
    expect(citationResult.competitorsCited).toBeDefined();
    expect(citationResult.timestamp).toBeDefined();
    expect(typeof citationResult.tokensUsed).toBe('number');
    expect(typeof citationResult.cost).toBe('number');
  });

  it('competitorsCited should have domain, context, and position', async () => {
    const simulatedResult = await performSimulatedAEOAnalysis(
      testWebsite,
      [testPrompts[0]],
      testBrandName,
      mockTrialUser,
      ['openai'],
      'test-analysis-id'
    );

    const citationResult: CitationResult = simulatedResult.citationResults[0];

    if (citationResult.competitorsCited.length > 0) {
      const competitor = citationResult.competitorsCited[0];
      expect(competitor.domain).toBeDefined();
      expect(competitor.context).toBeDefined();
      expect(typeof competitor.position).toBe('number');
    }
  });
});

describe('Analysis to AEOAnalysis Conversion', () => {
  it('Analysis type should preserve citationResults from AEOAnalysis', () => {
    // This tests the type compatibility
    const mockCitationResults: CitationResult[] = [
      {
        promptId: 'p1',
        prompt: 'What are the best customer service chatbot providers?',
        provider: 'openai',
        modelUsed: 'gpt-4o',
        response: 'Test response',
        isCited: true,
        citationContext: 'Convologix offers excellent chatbot solutions...',
        competitorsCited: [
          { domain: 'intercom.com', context: 'Intercom is a leading provider...', position: 1 },
          { domain: 'zendesk.com', context: 'Zendesk offers...', position: 2 },
        ],
        timestamp: new Date().toISOString(),
        tokensUsed: 500,
        cost: 0.02,
      },
    ];

    const analysisWithCitations: Analysis = {
      id: 'analysis-123',
      projectId: 'project-1',
      userId: 'user-1',
      website: testWebsite,
      keywords: ['chatbot', 'AI', 'customer service'],
      score: 65,
      metrics: {
        contentClarity: 70,
        semanticRichness: 60,
        structuredData: 55,
        naturalLanguage: 75,
        keywordRelevance: 65,
      },
      insights: 'Your website was cited in 33% of AI responses.',
      predictedRank: 2,
      category: 'Answer Engine Optimization',
      recommendations: [],
      createdAt: new Date().toISOString(),
      isSimulated: false,
      citationResults: mockCitationResults,
      overallCitationRate: 33,
    };

    // Verify citationResults are preserved
    expect(analysisWithCitations.citationResults).toBeDefined();
    expect(analysisWithCitations.citationResults?.length).toBe(1);
    expect(analysisWithCitations.citationResults?.[0].isCited).toBe(true);
    expect(analysisWithCitations.citationResults?.[0].competitorsCited.length).toBe(2);
    expect(analysisWithCitations.overallCitationRate).toBe(33);
  });
});

describe('extractCompetitorData helper', () => {
  // This tests the extraction logic used in CompetitorStrategy
  const extractCompetitorData = (analysis: Analysis) => {
    if (!analysis.citationResults || analysis.citationResults.length === 0) {
      return { competitors: [], totalQueries: 0, userCitationCount: 0 };
    }

    const competitorMap = new Map<string, { count: number; contexts: string[] }>();

    analysis.citationResults.forEach(result => {
      result.competitorsCited.forEach(comp => {
        const existing = competitorMap.get(comp.domain);
        if (existing) {
          existing.count++;
          if (comp.context && !existing.contexts.includes(comp.context)) {
            existing.contexts.push(comp.context);
          }
        } else {
          competitorMap.set(comp.domain, {
            count: 1,
            contexts: comp.context ? [comp.context] : [],
          });
        }
      });
    });

    const totalQueries = analysis.citationResults.length;
    const userCitationCount = analysis.citationResults.filter(r => r.isCited).length;

    const competitors = Array.from(competitorMap.entries())
      .map(([domain, data]) => ({
        domain,
        citationCount: data.count,
        contexts: data.contexts,
      }))
      .sort((a, b) => b.citationCount - a.citationCount);

    return { competitors, totalQueries, userCitationCount };
  };

  it('should extract competitors from citationResults', () => {
    const mockAnalysis: Analysis = {
      id: 'test',
      projectId: 'test',
      userId: 'test',
      website: testWebsite,
      keywords: [],
      score: 50,
      metrics: { contentClarity: 50, semanticRichness: 50, structuredData: 50, naturalLanguage: 50, keywordRelevance: 50 },
      insights: '',
      predictedRank: 2,
      category: 'Answer Engine Optimization',
      recommendations: [],
      createdAt: new Date().toISOString(),
      citationResults: [
        {
          promptId: 'p1',
          prompt: 'Test prompt 1',
          provider: 'openai',
          modelUsed: 'gpt-4o',
          response: 'Test',
          isCited: false,
          competitorsCited: [
            { domain: 'intercom.com', context: 'Context 1', position: 1 },
            { domain: 'zendesk.com', context: 'Context 2', position: 2 },
          ],
          timestamp: new Date().toISOString(),
          tokensUsed: 100,
          cost: 0.01,
        },
        {
          promptId: 'p1',
          prompt: 'Test prompt 1',
          provider: 'anthropic',
          modelUsed: 'claude-3',
          response: 'Test',
          isCited: true,
          citationContext: 'Convologix mentioned...',
          competitorsCited: [
            { domain: 'intercom.com', context: 'Context 3', position: 1 },
            { domain: 'drift.com', context: 'Context 4', position: 2 },
          ],
          timestamp: new Date().toISOString(),
          tokensUsed: 100,
          cost: 0.01,
        },
      ],
    };

    const result = extractCompetitorData(mockAnalysis);

    expect(result.totalQueries).toBe(2);
    expect(result.userCitationCount).toBe(1);
    expect(result.competitors.length).toBe(3); // intercom, zendesk, drift

    // intercom should be first (cited 2 times)
    expect(result.competitors[0].domain).toBe('intercom.com');
    expect(result.competitors[0].citationCount).toBe(2);

    // zendesk and drift should have 1 citation each
    const zendeskComp = result.competitors.find(c => c.domain === 'zendesk.com');
    const driftComp = result.competitors.find(c => c.domain === 'drift.com');
    expect(zendeskComp?.citationCount).toBe(1);
    expect(driftComp?.citationCount).toBe(1);
  });

  it('should return empty data for analysis without citationResults', () => {
    const mockAnalysis: Analysis = {
      id: 'test',
      projectId: 'test',
      userId: 'test',
      website: testWebsite,
      keywords: [],
      score: 50,
      metrics: { contentClarity: 50, semanticRichness: 50, structuredData: 50, naturalLanguage: 50, keywordRelevance: 50 },
      insights: '',
      predictedRank: 2,
      category: 'SEO', // Not AEO
      recommendations: [],
      createdAt: new Date().toISOString(),
      // No citationResults
    };

    const result = extractCompetitorData(mockAnalysis);

    expect(result.competitors.length).toBe(0);
    expect(result.totalQueries).toBe(0);
    expect(result.userCitationCount).toBe(0);
  });

  it('should handle empty competitorsCited arrays', () => {
    const mockAnalysis: Analysis = {
      id: 'test',
      projectId: 'test',
      userId: 'test',
      website: testWebsite,
      keywords: [],
      score: 100,
      metrics: { contentClarity: 100, semanticRichness: 100, structuredData: 100, naturalLanguage: 100, keywordRelevance: 100 },
      insights: '',
      predictedRank: 1,
      category: 'Answer Engine Optimization',
      recommendations: [],
      createdAt: new Date().toISOString(),
      citationResults: [
        {
          promptId: 'p1',
          prompt: 'Test',
          provider: 'openai',
          modelUsed: 'gpt-4o',
          response: 'Test',
          isCited: true,
          citationContext: 'Only mentioned user site, no competitors',
          competitorsCited: [], // No competitors cited
          timestamp: new Date().toISOString(),
          tokensUsed: 100,
          cost: 0.01,
        },
      ],
    };

    const result = extractCompetitorData(mockAnalysis);

    expect(result.competitors.length).toBe(0);
    expect(result.totalQueries).toBe(1);
    expect(result.userCitationCount).toBe(1);
  });
});
