/**
 * Model Configuration - AI provider settings and capabilities
 */
import type { AnalysisProvider } from '../../types';

export interface ModelConfig {
  provider: AnalysisProvider;
  name: string;
  inputCost: number;
  outputCost: number;
  embeddingCost: number;
  capabilities: {
    webCrawling: boolean;
    structuredOutput: boolean;
    semanticAnalysis: boolean;
  };
}

export const MODELS: Record<string, ModelConfig> = {
  'gpt-4': {
    provider: 'openai',
    name: 'GPT-4',
    inputCost: 0.03,
    outputCost: 0.06,
    embeddingCost: 0.0001,
    capabilities: {
      webCrawling: true,
      structuredOutput: true,
      semanticAnalysis: true
    }
  },
  'gpt-4-professional': {
    provider: 'openai',
    name: 'GPT-4 Professional',
    inputCost: 0.04,
    outputCost: 0.08,
    embeddingCost: 0.0001,
    capabilities: {
      webCrawling: true,
      structuredOutput: true,
      semanticAnalysis: true
    }
  },
  'claude-3-opus': {
    provider: 'anthropic',
    name: 'Claude 3 Opus',
    inputCost: 0.015,
    outputCost: 0.075,
    embeddingCost: 0.0001,
    capabilities: {
      webCrawling: true,
      structuredOutput: true,
      semanticAnalysis: true
    }
  },
  'claude-3-sonnet': {
    provider: 'anthropic',
    name: 'Claude 3 Sonnet',
    inputCost: 0.003,
    outputCost: 0.015,
    embeddingCost: 0.0001,
    capabilities: {
      webCrawling: true,
      structuredOutput: true,
      semanticAnalysis: true
    }
  },
  'claude-3-haiku': {
    provider: 'anthropic',
    name: 'Claude 3 Haiku',
    inputCost: 0.00025,
    outputCost: 0.00125,
    embeddingCost: 0.0001,
    capabilities: {
      webCrawling: true,
      structuredOutput: true,
      semanticAnalysis: true
    }
  },
  'perplexity-online': {
    provider: 'perplexity',
    name: 'Perplexity Online',
    inputCost: 0.002,
    outputCost: 0.01,
    embeddingCost: 0.0001,
    capabilities: {
      webCrawling: true,
      structuredOutput: false,
      semanticAnalysis: true
    }
  },
  'perplexity-offline': {
    provider: 'perplexity',
    name: 'Perplexity Offline',
    inputCost: 0.001,
    outputCost: 0.005,
    embeddingCost: 0.0001,
    capabilities: {
      webCrawling: false,
      structuredOutput: false,
      semanticAnalysis: true
    }
  }
};

export const DEFAULT_MODEL = 'gpt-4-professional';

export function getModel(modelKey: string): ModelConfig {
  if (!MODELS[modelKey]) {
    console.warn(`Model ${modelKey} not found, using default model ${DEFAULT_MODEL}`);
    return MODELS[DEFAULT_MODEL];
  }
  return MODELS[modelKey];
}
