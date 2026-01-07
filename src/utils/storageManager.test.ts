import { describe, it, expect, beforeEach } from 'vitest';
import { StorageManager } from './storageManager';
import type { User, Analysis } from '../types';

// Mock user data
const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  subscription: 'trial',
  createdAt: new Date().toISOString(),
};

// Mock analysis data
const mockAnalysis: Analysis = {
  id: 'analysis-123',
  projectId: 'project-1',
  userId: 'user-123',
  website: 'https://example.com',
  keywords: ['test', 'example'],
  score: 75,
  metrics: {
    contentClarity: 80,
    semanticRichness: 70,
    structuredData: 75,
    naturalLanguage: 80,
    keywordRelevance: 70,
  },
  insights: 'Test insights',
  predictedRank: 2,
  category: 'Top Result',
  recommendations: [],
  createdAt: new Date().toISOString(),
  isSimulated: false,
};

describe('StorageManager', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('User Management', () => {
    it('should store and retrieve current user', () => {
      StorageManager.setCurrentUser(mockUser);
      const retrieved = StorageManager.getCurrentUser();

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(mockUser.id);
      expect(retrieved?.email).toBe(mockUser.email);
    });

    it('should return null when no user stored', () => {
      const retrieved = StorageManager.getCurrentUser();
      expect(retrieved).toBeNull();
    });

    it('should update current user properties', () => {
      StorageManager.setCurrentUser(mockUser);
      StorageManager.updateCurrentUser({ subscription: 'professional' });

      const retrieved = StorageManager.getCurrentUser();
      expect(retrieved?.subscription).toBe('professional');
      expect(retrieved?.email).toBe(mockUser.email); // Other properties preserved
    });

    it('should not update if no user exists', () => {
      StorageManager.updateCurrentUser({ subscription: 'professional' });
      const retrieved = StorageManager.getCurrentUser();
      expect(retrieved).toBeNull();
    });

    it('should clear current user', () => {
      StorageManager.setCurrentUser(mockUser);
      StorageManager.clearCurrentUser();

      const retrieved = StorageManager.getCurrentUser();
      expect(retrieved).toBeNull();
    });
  });

  describe('Analysis Management', () => {
    it('should store and retrieve current analysis', () => {
      StorageManager.setCurrentAnalysis(mockAnalysis);
      const retrieved = StorageManager.getCurrentAnalysis();

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(mockAnalysis.id);
      expect(retrieved?.score).toBe(mockAnalysis.score);
    });

    it('should return null when no analysis stored', () => {
      const retrieved = StorageManager.getCurrentAnalysis();
      expect(retrieved).toBeNull();
    });

    it('should clear current analysis', () => {
      StorageManager.setCurrentAnalysis(mockAnalysis);
      StorageManager.clearCurrentAnalysis();

      const retrieved = StorageManager.getCurrentAnalysis();
      expect(retrieved).toBeNull();
    });
  });

  describe('Analyses Collection', () => {
    it('should add analysis to collection', () => {
      StorageManager.addAnalysis(mockAnalysis);
      const analyses = StorageManager.getAnalyses();

      expect(analyses.length).toBe(1);
      expect(analyses[0].id).toBe(mockAnalysis.id);
    });

    it('should not add duplicate analyses', () => {
      StorageManager.addAnalysis(mockAnalysis);
      StorageManager.addAnalysis(mockAnalysis);

      const analyses = StorageManager.getAnalyses();
      expect(analyses.length).toBe(1);
    });

    it('should add different analyses', () => {
      const secondAnalysis = { ...mockAnalysis, id: 'analysis-456' };

      StorageManager.addAnalysis(mockAnalysis);
      StorageManager.addAnalysis(secondAnalysis);

      const analyses = StorageManager.getAnalyses();
      expect(analyses.length).toBe(2);
    });

    it('should remove analysis by id', () => {
      StorageManager.addAnalysis(mockAnalysis);
      StorageManager.removeAnalysis(mockAnalysis.id);

      const analyses = StorageManager.getAnalyses();
      expect(analyses.length).toBe(0);
    });

    it('should get analyses for specific user', () => {
      const userAnalysis = mockAnalysis;
      const otherUserAnalysis = { ...mockAnalysis, id: 'analysis-456', userId: 'other-user' };

      StorageManager.addAnalysis(userAnalysis);
      StorageManager.addAnalysis(otherUserAnalysis);

      const userAnalyses = StorageManager.getAnalysesForUser('user-123');
      expect(userAnalyses.length).toBe(1);
      expect(userAnalyses[0].userId).toBe('user-123');
    });

    it('should set analyses collection directly', () => {
      const analyses = [mockAnalysis, { ...mockAnalysis, id: 'analysis-456' }];
      StorageManager.setAnalyses(analyses);

      const retrieved = StorageManager.getAnalyses();
      expect(retrieved.length).toBe(2);
    });
  });

  describe('Session Management', () => {
    it('should clear session data (user and analysis)', () => {
      StorageManager.setCurrentUser(mockUser);
      StorageManager.setCurrentAnalysis(mockAnalysis);

      StorageManager.clearSession();

      expect(StorageManager.getCurrentUser()).toBeNull();
      expect(StorageManager.getCurrentAnalysis()).toBeNull();
    });

    it('should clear all storage data', () => {
      StorageManager.setCurrentUser(mockUser);
      StorageManager.setCurrentAnalysis(mockAnalysis);
      StorageManager.addAnalysis(mockAnalysis);

      StorageManager.clearAll();

      expect(StorageManager.getCurrentUser()).toBeNull();
      expect(StorageManager.getCurrentAnalysis()).toBeNull();
      expect(StorageManager.getAnalyses().length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', () => {
      // Manually set invalid JSON
      localStorage.setItem('currentUser', 'not-valid-json');

      // Should return null instead of throwing
      const retrieved = StorageManager.getCurrentUser();
      expect(retrieved).toBeNull();
    });

    it('should handle missing data gracefully', () => {
      // All getters should return safe defaults
      expect(StorageManager.getCurrentUser()).toBeNull();
      expect(StorageManager.getCurrentAnalysis()).toBeNull();
      expect(StorageManager.getAnalyses()).toEqual([]);
    });
  });

  describe('Data Persistence', () => {
    it('should persist data between StorageManager calls', () => {
      StorageManager.setCurrentUser(mockUser);

      // Simulate accessing storage again (would be new instance in real app)
      const retrieved = StorageManager.getCurrentUser();

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(mockUser.id);
    });

    it('should maintain data integrity for complex objects', () => {
      const complexAnalysis: Analysis = {
        ...mockAnalysis,
        recommendations: [
          {
            id: 'rec-1',
            title: 'Test Recommendation',
            description: 'Test description',
            priority: 'high',
            difficulty: 'medium',
            estimatedTime: '1 hour',
            expectedImpact: 10,
          },
        ],
        crawlData: {
          url: 'https://example.com',
          title: 'Example',
          metaDescription: 'Description',
          headings: [{ level: 1, text: 'Heading', hasDirectAnswer: true }],
          schemaTypes: ['Organization'],
          contentStats: {
            wordCount: 1000,
            paragraphCount: 10,
            avgSentenceLength: 15,
            readabilityScore: 70,
          },
          technicalSignals: {
            hasCanonical: true,
            hasOpenGraph: true,
            hasTwitterCard: true,
            mobileViewport: true,
            hasHttps: true,
            loadTime: 1000,
          },
          issues: [],
        },
      };

      StorageManager.setCurrentAnalysis(complexAnalysis);
      const retrieved = StorageManager.getCurrentAnalysis();

      expect(retrieved?.recommendations?.length).toBe(1);
      expect(retrieved?.crawlData?.title).toBe('Example');
    });
  });
});
