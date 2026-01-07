/**
 * Analysis module exports
 */

// Model configuration
export { MODELS, DEFAULT_MODEL, getModel } from './modelConfig';
export type { ModelConfig } from './modelConfig';

// Analysis helpers
export {
  SIMULATION_DELAY,
  REAL_ANALYSIS_DELAY,
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

// AEO Analysis
export {
  generateAEORecommendations,
  performRealAEOAnalysis,
  performSimulatedAEOAnalysis,
} from './aeoAnalysis';

// Recommendations
export { generateRecommendationsFromCrawl } from './recommendations';
