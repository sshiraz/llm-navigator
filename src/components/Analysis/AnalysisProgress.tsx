import React, { useState, useEffect } from 'react';
import { Clock, Zap, CheckCircle, AlertCircle, Sparkles, DollarSign } from 'lucide-react';
import { User, Analysis, AnalysisProvider } from '../../types';
import { AnalysisEngine } from '../../utils/analysisEngine';
import { AnalysisService } from '../../services/analysisService';

interface AnalysisProgressProps {
  website: string;
  prompts: { id: string; text: string }[];
  brandName?: string;
  providers: AnalysisProvider[];
  user: User;
  onComplete: (analysis: Analysis) => void;
  onError?: (error: string) => void;
}

export default function AnalysisProgress({
  website,
  prompts,
  brandName,
  providers,
  user,
  onComplete,
  onError
}: AnalysisProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin or has a paid plan for real analysis
  const isRealAnalysis = AnalysisEngine.shouldUseRealAnalysis(user) || user.isAdmin === true;

  // Calculate cost based on prompts × providers
  const queryCost = prompts.length * providers.length * 0.02;

  const steps = isRealAnalysis ? [
    { id: 1, name: 'Crawling Website', description: 'Analyzing your content structure', duration: 3000, cost: 0.03 },
    { id: 2, name: 'Checking Citations', description: `Querying ${providers.length} AI provider${providers.length > 1 ? 's' : ''}`, duration: 8000, cost: queryCost },
    { id: 3, name: 'Analyzing Competitors', description: 'Identifying who IS getting cited', duration: 3000, cost: 0.01 },
    { id: 4, name: 'Generating Insights', description: 'Creating AEO recommendations', duration: 2000, cost: 0.05 }
  ] : [
    { id: 1, name: 'Analyzing Content', description: 'Processing website structure', duration: 800, cost: 0 },
    { id: 2, name: 'Simulating Citations', description: 'Generating sample results', duration: 1000, cost: 0 },
    { id: 3, name: 'Creating Report', description: 'Building recommendations', duration: 600, cost: 0 }
  ];

  useEffect(() => {
    // Clear any cached analysis data before starting a new analysis
    localStorage.removeItem('currentAnalysis');
    console.log('Cleared cached analysis - starting fresh');

    // Calculate estimated cost
    const totalCost = steps.reduce((sum, step) => sum + step.cost, 0);
    setEstimatedCost(totalCost);

    // Log analysis parameters
    console.log(`AEO Analysis: ${prompts.length} prompts × ${providers.length} providers`);

    let stepIndex = 0;
    let totalProgress = 0;

    const runStep = () => {
      if (stepIndex >= steps.length) {
        setIsComplete(true);
        // Trigger actual analysis
        AnalysisEngine.analyzeAEO(website, prompts, brandName, user, providers)
          .then(async (result) => {
            console.log('=== AEO ANALYSIS COMPLETE ===');
            console.log('Citation Rate:', result.overallCitationRate, '%');
            console.log('isSimulated:', result.isSimulated);
            console.log('Recommendations count:', result.recommendations?.length);

            // Convert AEO analysis to regular Analysis format for compatibility
            const analysisResult: Analysis = {
              id: result.id,
              projectId: result.projectId || 'default',
              userId: result.userId,
              website: result.website,
              keywords: result.prompts.map(p => p.text), // Store prompts as keywords for backwards compat
              score: Math.round(result.overallCitationRate),
              metrics: {
                contentClarity: result.contentAnalysis.blufScore,
                semanticRichness: result.contentAnalysis.contentDepth,
                structuredData: result.contentAnalysis.schemaScore,
                naturalLanguage: result.contentAnalysis.readabilityScore,
                keywordRelevance: result.overallCitationRate
              },
              insights: `Your website was cited in ${Math.round(result.overallCitationRate)}% of AI responses. ` +
                `${result.citationResults.filter(r => r.isCited).length} out of ${result.citationResults.length} queries mentioned your site.`,
              predictedRank: result.overallCitationRate > 50 ? 1 : result.overallCitationRate > 25 ? 2 : 3,
              category: 'Answer Engine Optimization',
              recommendations: result.recommendations.map(r => ({
                id: r.id,
                title: r.title,
                description: r.description,
                priority: r.priority,
                difficulty: r.difficulty,
                estimatedTime: r.estimatedTime,
                expectedImpact: parseInt(r.expectedImpact) || 10
              })),
              createdAt: result.createdAt,
              isSimulated: result.isSimulated,
              crawlData: result.crawlData,
              costInfo: {
                totalCost: result.costInfo.totalCost,
                breakdown: {
                  crawling: result.costInfo.breakdown.crawling,
                  embeddings: 0,
                  insights: result.costInfo.breakdown.citationChecks,
                  total: result.costInfo.breakdown.total
                },
                tokensUsed: {
                  input: 0,
                  output: 0,
                  embeddings: 0
                }
              }
            };

            // Save analysis to Supabase (with localStorage fallback)
            try {
              const saveResult = await AnalysisService.saveAnalysis(analysisResult);
              if (saveResult.success) {
                console.log('Analysis saved to Supabase');
              } else {
                console.warn('Failed to save to Supabase, using localStorage fallback:', saveResult.error);
              }
            } catch (err) {
              console.error('Error saving analysis:', err);
            }
            onComplete(analysisResult);
          })
          .catch((error) => {
            console.error('Analysis failed:', error);
            setError(error.message || 'Analysis failed. Please try again.');
            if (onError) {
              onError(error.message || 'Analysis failed. Please try again.');
            }
          });
        return;
      }

      setCurrentStep(stepIndex);
      const step = steps[stepIndex];
      const stepDuration = step.duration;
      const stepProgressIncrement = 100 / steps.length;

      let stepProgress = 0;
      const interval = setInterval(() => {
        stepProgress += 2;
        const currentStepProgress = (stepProgress / 100) * stepProgressIncrement;
        setProgress(totalProgress + currentStepProgress);

        if (stepProgress >= 100) {
          clearInterval(interval);
          totalProgress += stepProgressIncrement;
          stepIndex++;
          setTimeout(runStep, 200);
        }
      }, stepDuration / 50);
    };

    runStep();
  }, [website, prompts, brandName, providers, user]);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-red-900 mb-3">Analysis Failed</h3>
          <p className="text-red-800 mb-6">{error}</p>
          <button
            onClick={() => window.location.hash = 'new-analysis'}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          {isRealAnalysis ? (
            <Zap className="w-8 h-8 text-blue-600" />
          ) : (
            <Sparkles className="w-8 h-8 text-purple-600" />
          )}
          <h2 className="text-2xl font-bold text-gray-900">
            {isRealAnalysis ? 'Checking AI Citations' : 'Demo Analysis'}
          </h2>
        </div>

        <p className="text-gray-600 mb-2">
          Analyzing <strong>{website}</strong>
          {brandName && <> (brand: <strong>{brandName}</strong>)</>}
        </p>

        <p className="text-gray-500 text-sm mb-4">
          {prompts.length} prompt{prompts.length > 1 ? 's' : ''} × {providers.length} AI provider{providers.length > 1 ? 's' : ''}
        </p>

        {isRealAnalysis ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-center space-x-2 text-blue-800">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">
                Live Citation Tracking
              </span>
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">
                Est. cost: ${estimatedCost.toFixed(2)}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-center space-x-2 text-purple-800">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">
                Simulated Results for Demo
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${
              isRealAnalysis ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-purple-500 to-purple-600'
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep || isComplete;

          return (
            <div
              key={step.id}
              className={`flex items-center space-x-4 p-4 rounded-lg border-2 transition-all ${
                isActive
                  ? isRealAnalysis
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-purple-500 bg-purple-50'
                  : isCompleted
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isActive
                  ? isRealAnalysis
                    ? 'bg-blue-600 text-white'
                    : 'bg-purple-600 text-white'
                  : isCompleted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-300 text-gray-600'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : isActive ? (
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                ) : (
                  <span className="text-sm font-bold">{step.id}</span>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className={`font-semibold ${
                    isActive
                      ? isRealAnalysis ? 'text-blue-900' : 'text-purple-900'
                      : isCompleted
                        ? 'text-emerald-900'
                        : 'text-gray-700'
                  }`}>
                    {step.name}
                  </h3>

                  {isRealAnalysis && step.cost > 0 && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      ${step.cost.toFixed(2)}
                    </span>
                  )}
                </div>

                <p className={`text-sm ${
                  isActive
                    ? isRealAnalysis ? 'text-blue-700' : 'text-purple-700'
                    : isCompleted
                      ? 'text-emerald-700'
                      : 'text-gray-500'
                }`}>
                  {step.description}
                </p>
              </div>

              {isActive && (
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${
                    isRealAnalysis ? 'border-blue-600' : 'border-purple-600'
                  }`}></div>
                  <Clock className={`w-4 h-4 ${
                    isRealAnalysis ? 'text-blue-600' : 'text-purple-600'
                  }`} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Prompts Being Checked */}
      <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">
          Prompts Being Checked
        </h3>
        <div className="space-y-2">
          {prompts.map((prompt, index) => (
            <div key={prompt.id} className="flex items-start space-x-2 text-sm">
              <span className="text-gray-400 w-5">{index + 1}.</span>
              <span className="text-gray-700">{prompt.text}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            Checking against: {' '}
            {providers.map((p, i) => (
              <span key={p}>
                <strong>{p === 'openai' ? 'ChatGPT' : p === 'anthropic' ? 'Claude' : 'Perplexity'}</strong>
                {i < providers.length - 1 ? ', ' : ''}
              </span>
            ))}
          </p>
        </div>
      </div>

      {/* Analysis Type Info */}
      {!isRealAnalysis && (
        <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-sm text-purple-800">
            <strong>Demo Mode:</strong> These are simulated results to preview the interface.
            Upgrade to a paid plan to check real AI citations.
          </p>
        </div>
      )}
    </div>
  );
}
