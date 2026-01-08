import { describe, it, expect } from 'vitest';
import { Analysis, CitationResult } from '../../types';

/**
 * Tests for competitor data consistency between:
 * - Performance Snapshot (MetricsBreakdown component)
 * - Competitor Strategy page (CompetitorStrategy component)
 *
 * Both should extract competitors from analysis.citationResults
 */

// Helper function that mirrors AnalysisResults.extractCompetitorsAsAnalyses
function extractCompetitorsAsAnalyses(analysis: Analysis): Analysis[] {
  if (!analysis.citationResults || analysis.citationResults.length === 0) {
    return [];
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
          contexts: comp.context ? [comp.context] : []
        });
      }
    });
  });

  const totalQueries = analysis.citationResults.length;

  return Array.from(competitorMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([domain, data], index) => {
      const citationRate = Math.round((data.count / totalQueries) * 100);
      const baseScore = Math.min(95, 60 + citationRate);

      return {
        id: `competitor-${index}`,
        projectId: analysis.projectId,
        userId: analysis.userId,
        website: domain,
        keywords: data.contexts.slice(0, 2),
        score: Math.round(baseScore),
        metrics: {
          contentClarity: Math.round(baseScore),
          semanticRichness: Math.round(baseScore),
          structuredData: Math.round(baseScore),
          naturalLanguage: Math.round(baseScore),
          keywordRelevance: Math.round(baseScore)
        },
        insights: `Cited ${data.count} time${data.count > 1 ? 's' : ''} by AI assistants`,
        predictedRank: index + 1,
        category: analysis.category,
        recommendations: [],
        createdAt: analysis.createdAt,
        isSimulated: analysis.isSimulated
      } as Analysis;
    });
}

// Helper function that mirrors CompetitorStrategy.extractCompetitorData
function extractCompetitorData(analysis: Analysis): {
  competitors: { domain: string; citationCount: number; contexts: string[] }[];
  totalQueries: number;
  userCitationCount: number;
} {
  const isAEO = analysis.category === 'Answer Engine Optimization';

  if (!isAEO) {
    return { competitors: [], totalQueries: 0, userCitationCount: 0 };
  }

  if (analysis.citationResults && analysis.citationResults.length > 0) {
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
            contexts: comp.context ? [comp.context] : []
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
        contexts: data.contexts
      }))
      .sort((a, b) => b.citationCount - a.citationCount);

    return { competitors, totalQueries, userCitationCount };
  }

  return { competitors: [], totalQueries: 0, userCitationCount: 0 };
}

// Mock citation results for testing
const mockCitationResults: CitationResult[] = [
  {
    promptId: '1',
    prompt: 'What are the best chatbot providers?',
    provider: 'perplexity',
    response: 'Top providers include xsoneconsultants.com and toimi.pro...',
    isCited: false,
    citationContext: null,
    competitorsCited: [
      { domain: 'xsoneconsultants.com', context: 'Enterprise chatbot solutions', position: 1 },
      { domain: 'toimi.pro', context: 'AI chatbot platform', position: 2 }
    ]
  },
  {
    promptId: '2',
    prompt: 'How do I implement AI chatbots?',
    provider: 'chatgpt',
    response: 'Consider using aifactorysystems.com or xsoneconsultants.com...',
    isCited: false,
    citationContext: null,
    competitorsCited: [
      { domain: 'aifactorysystems.com', context: 'AI implementation services', position: 1 },
      { domain: 'xsoneconsultants.com', context: 'Chatbot consulting', position: 2 }
    ]
  },
  {
    promptId: '3',
    prompt: 'Best conversational AI solutions?',
    provider: 'claude',
    response: 'Leading solutions from hummingagent.ai...',
    isCited: true,
    citationContext: 'Your site offers conversational AI',
    competitorsCited: [
      { domain: 'hummingagent.ai', context: 'Conversational AI platform', position: 1 },
      { domain: 'xsoneconsultants.com', context: 'AI consulting', position: 2 }
    ]
  }
];

const mockAnalysis: Analysis = {
  id: 'test-analysis-1',
  projectId: 'default',
  userId: 'test-user',
  website: 'www.convologix.com',
  keywords: ['chatbot providers', 'AI chatbots', 'conversational AI'],
  score: 33,
  metrics: {
    contentClarity: 33,
    semanticRichness: 100,
    structuredData: 20,
    naturalLanguage: 18,
    keywordRelevance: 0
  },
  insights: 'Test analysis insights',
  predictedRank: 5,
  category: 'Answer Engine Optimization',
  recommendations: [],
  createdAt: new Date().toISOString(),
  isSimulated: true,
  citationResults: mockCitationResults,
  overallCitationRate: 33
};

describe('Competitor Data Extraction', () => {
  describe('extractCompetitorsAsAnalyses (Performance Snapshot)', () => {
    it('should return empty array when no citation results', () => {
      const analysisWithoutCitations = { ...mockAnalysis, citationResults: undefined };
      const result = extractCompetitorsAsAnalyses(analysisWithoutCitations);
      expect(result).toEqual([]);
    });

    it('should return empty array when citation results is empty', () => {
      const analysisWithEmptyCitations = { ...mockAnalysis, citationResults: [] };
      const result = extractCompetitorsAsAnalyses(analysisWithEmptyCitations);
      expect(result).toEqual([]);
    });

    it('should extract competitors from citation results', () => {
      const result = extractCompetitorsAsAnalyses(mockAnalysis);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should sort competitors by citation count (descending)', () => {
      const result = extractCompetitorsAsAnalyses(mockAnalysis);

      // xsoneconsultants.com appears 3 times, should be first
      expect(result[0].website).toBe('xsoneconsultants.com');
    });

    it('should count citations correctly', () => {
      const result = extractCompetitorsAsAnalyses(mockAnalysis);

      // xsoneconsultants.com appears in all 3 citation results
      const xsone = result.find(r => r.website === 'xsoneconsultants.com');
      expect(xsone?.insights).toBe('Cited 3 times by AI assistants');
    });

    it('should limit to top 10 competitors', () => {
      // Create analysis with many competitors
      const manyCompetitors: CitationResult[] = Array.from({ length: 20 }, (_, i) => ({
        promptId: `${i}`,
        prompt: `Test prompt ${i}`,
        provider: 'perplexity' as const,
        response: 'Test response',
        isCited: false,
        citationContext: null,
        competitorsCited: [
          { domain: `competitor${i}.com`, context: 'Test context', position: 1 }
        ]
      }));

      const analysisWithMany = { ...mockAnalysis, citationResults: manyCompetitors };
      const result = extractCompetitorsAsAnalyses(analysisWithMany);

      expect(result.length).toBeLessThanOrEqual(10);
    });

    it('should return Analysis objects with correct structure', () => {
      const result = extractCompetitorsAsAnalyses(mockAnalysis);
      const first = result[0];

      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('website');
      expect(first).toHaveProperty('score');
      expect(first).toHaveProperty('metrics');
      expect(first.metrics).toHaveProperty('contentClarity');
      expect(first.metrics).toHaveProperty('semanticRichness');
      expect(first.metrics).toHaveProperty('structuredData');
      expect(first.metrics).toHaveProperty('naturalLanguage');
      expect(first.metrics).toHaveProperty('keywordRelevance');
    });

    it('should preserve context information in keywords', () => {
      const result = extractCompetitorsAsAnalyses(mockAnalysis);
      const xsone = result.find(r => r.website === 'xsoneconsultants.com');

      // Should have contexts as keywords
      expect(xsone?.keywords.length).toBeGreaterThan(0);
    });
  });

  describe('extractCompetitorData (Competitor Strategy)', () => {
    it('should return empty data for non-AEO analysis', () => {
      const nonAEOAnalysis = { ...mockAnalysis, category: 'SEO Analysis' };
      const result = extractCompetitorData(nonAEOAnalysis);

      expect(result.competitors).toEqual([]);
      expect(result.totalQueries).toBe(0);
    });

    it('should return empty data when no citation results', () => {
      const analysisWithoutCitations = { ...mockAnalysis, citationResults: undefined };
      const result = extractCompetitorData(analysisWithoutCitations);

      expect(result.competitors).toEqual([]);
    });

    it('should extract competitors from citation results', () => {
      const result = extractCompetitorData(mockAnalysis);
      expect(result.competitors.length).toBeGreaterThan(0);
    });

    it('should sort competitors by citation count (descending)', () => {
      const result = extractCompetitorData(mockAnalysis);

      // xsoneconsultants.com appears 3 times, should be first
      expect(result.competitors[0].domain).toBe('xsoneconsultants.com');
      expect(result.competitors[0].citationCount).toBe(3);
    });

    it('should calculate total queries correctly', () => {
      const result = extractCompetitorData(mockAnalysis);
      expect(result.totalQueries).toBe(3);
    });

    it('should calculate user citation count correctly', () => {
      const result = extractCompetitorData(mockAnalysis);
      // Only 1 citation result has isCited: true
      expect(result.userCitationCount).toBe(1);
    });

    it('should collect unique contexts per competitor', () => {
      const result = extractCompetitorData(mockAnalysis);
      const xsone = result.competitors.find(c => c.domain === 'xsoneconsultants.com');

      // xsoneconsultants.com has 3 different contexts
      expect(xsone?.contexts.length).toBe(3);
    });
  });

  describe('Data Consistency Between Components', () => {
    it('should extract the same competitor domains from both functions', () => {
      const performanceSnapshot = extractCompetitorsAsAnalyses(mockAnalysis);
      const competitorStrategy = extractCompetitorData(mockAnalysis);

      const snapshotDomains = performanceSnapshot.map(a => a.website).sort();
      const strategyDomains = competitorStrategy.competitors.map(c => c.domain).sort();

      expect(snapshotDomains).toEqual(strategyDomains);
    });

    it('should have the same competitor ranking order', () => {
      const performanceSnapshot = extractCompetitorsAsAnalyses(mockAnalysis);
      const competitorStrategy = extractCompetitorData(mockAnalysis);

      // Both should have xsoneconsultants.com first (3 citations)
      expect(performanceSnapshot[0].website).toBe(competitorStrategy.competitors[0].domain);
      expect(performanceSnapshot[0].website).toBe('xsoneconsultants.com');
    });

    it('should have consistent citation counts', () => {
      const performanceSnapshot = extractCompetitorsAsAnalyses(mockAnalysis);
      const competitorStrategy = extractCompetitorData(mockAnalysis);

      // Verify top competitor has same citation count
      const snapshotFirst = performanceSnapshot[0];
      const strategyFirst = competitorStrategy.competitors[0];

      // Extract count from insights string "Cited X time(s) by AI assistants"
      const countMatch = snapshotFirst.insights.match(/Cited (\d+)/);
      const snapshotCount = countMatch ? parseInt(countMatch[1]) : 0;

      expect(snapshotCount).toBe(strategyFirst.citationCount);
    });

    it('should both return empty when no citation data', () => {
      const emptyAnalysis = { ...mockAnalysis, citationResults: [] };

      const performanceSnapshot = extractCompetitorsAsAnalyses(emptyAnalysis);
      const competitorStrategy = extractCompetitorData(emptyAnalysis);

      expect(performanceSnapshot).toEqual([]);
      expect(competitorStrategy.competitors).toEqual([]);
    });

    it('should handle analysis with single competitor', () => {
      const singleCompetitorResults: CitationResult[] = [{
        promptId: '1',
        prompt: 'Test prompt',
        provider: 'perplexity',
        response: 'Test response',
        isCited: false,
        citationContext: null,
        competitorsCited: [
          { domain: 'single-competitor.com', context: 'Only competitor', position: 1 }
        ]
      }];

      const analysisWithSingle = { ...mockAnalysis, citationResults: singleCompetitorResults };

      const performanceSnapshot = extractCompetitorsAsAnalyses(analysisWithSingle);
      const competitorStrategy = extractCompetitorData(analysisWithSingle);

      expect(performanceSnapshot.length).toBe(1);
      expect(competitorStrategy.competitors.length).toBe(1);
      expect(performanceSnapshot[0].website).toBe('single-competitor.com');
      expect(competitorStrategy.competitors[0].domain).toBe('single-competitor.com');
    });

    it('should deduplicate competitors appearing in multiple results', () => {
      const result = extractCompetitorData(mockAnalysis);

      // xsoneconsultants.com appears in all 3 results but should only be listed once
      const xsoneCount = result.competitors.filter(c => c.domain === 'xsoneconsultants.com').length;
      expect(xsoneCount).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle competitors with empty context', () => {
      const noContextResults: CitationResult[] = [{
        promptId: '1',
        prompt: 'Test prompt',
        provider: 'perplexity',
        response: 'Test response',
        isCited: false,
        citationContext: null,
        competitorsCited: [
          { domain: 'no-context.com', context: '', position: 1 }
        ]
      }];

      const analysisNoContext = { ...mockAnalysis, citationResults: noContextResults };

      const performanceSnapshot = extractCompetitorsAsAnalyses(analysisNoContext);
      const competitorStrategy = extractCompetitorData(analysisNoContext);

      expect(performanceSnapshot.length).toBe(1);
      expect(competitorStrategy.competitors.length).toBe(1);
    });

    it('should handle citation results with no competitors', () => {
      const noCompetitorsResults: CitationResult[] = [{
        promptId: '1',
        prompt: 'Test prompt',
        provider: 'perplexity',
        response: 'Test response',
        isCited: true,
        citationContext: 'Your site was cited',
        competitorsCited: []
      }];

      const analysisNoCompetitors = { ...mockAnalysis, citationResults: noCompetitorsResults };

      const performanceSnapshot = extractCompetitorsAsAnalyses(analysisNoCompetitors);
      const competitorStrategy = extractCompetitorData(analysisNoCompetitors);

      expect(performanceSnapshot).toEqual([]);
      expect(competitorStrategy.competitors).toEqual([]);
      expect(competitorStrategy.userCitationCount).toBe(1);
    });

    it('should handle mixed cited/not-cited results', () => {
      const result = extractCompetitorData(mockAnalysis);

      // mockAnalysis has 3 results, 1 cited
      expect(result.totalQueries).toBe(3);
      expect(result.userCitationCount).toBe(1);
    });
  });
});
