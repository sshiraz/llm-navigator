import React, { useState, useEffect } from 'react';
import { Clock, Zap, CheckCircle, AlertCircle, Sparkles, DollarSign } from 'lucide-react';
import { User } from '../../types';
import { AnalysisEngine } from '../../utils/analysisEngine'; 

interface AnalysisProgressProps {
  website: string;
  keywords: string[];
  user: User;
  onComplete: (analysis: any) => void;
  onError?: (error: string) => void;
}

export default function AnalysisProgress({ website, keywords, user, onComplete, onError }: AnalysisProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const isRealAnalysis = AnalysisEngine.shouldUseRealAnalysis(user);

  const steps = isRealAnalysis ? [
    { id: 1, name: 'Crawling Website', description: 'Extracting content and structure', duration: 3000, cost: 0.03 },
    { id: 2, name: 'Technical Analysis', description: 'Analyzing SEO and technical factors', duration: 2000, cost: 0.001 },
    { id: 3, name: 'Semantic Processing', description: 'AI-powered content understanding', duration: 4000, cost: 0.02 },
    { id: 4, name: 'Competitor Comparison', description: 'Benchmarking against industry leaders', duration: 3000, cost: 0.05 },
    { id: 5, name: 'Generating Insights', description: 'Creating personalized recommendations', duration: 3000, cost: 0.15 }
  ] : [
    { id: 1, name: 'Analyzing Content', description: 'Processing website structure and content', duration: 800, cost: 0 },
    { id: 2, name: 'Calculating Scores', description: 'Evaluating LLM optimization metrics', duration: 600, cost: 0 },
    { id: 3, name: 'Generating Report', description: 'Creating insights and recommendations', duration: 600, cost: 0.001 }
  ];

  useEffect(() => {
    // Calculate estimated cost
    const totalCost = steps.reduce((sum, step) => sum + step.cost, 0);
    setEstimatedCost(totalCost);

    let stepIndex = 0;
    let totalProgress = 0;

    const runStep = () => {
      if (stepIndex >= steps.length) {
        setIsComplete(true);
        // Trigger actual analysis
        AnalysisEngine.analyzeWebsite(website, keywords, user)
          .then((result) => {
            // Store the analysis in localStorage for persistence
            try {
              localStorage.setItem('currentAnalysis', JSON.stringify(result));
            } catch (err) {
              console.error('Error storing analysis in localStorage:', err);
            }
            onComplete(result);
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
  }, [website, keywords, user]);

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
            {isRealAnalysis ? 'Deep Analysis in Progress' : 'Quick Analysis in Progress'}
          </h2>
        </div>
        
        <p className="text-gray-600 mb-2">
          Analyzing <strong>{website}</strong> for keywords: <strong>{keywords.join(', ')}</strong>
        </p>
        
        {isRealAnalysis ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-center space-x-2 text-blue-800">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">
                Premium Analysis: Using real AI-powered content analysis
              </span>
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">
                Est. cost: ${estimatedCost.toFixed(3)}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-center space-x-2 text-purple-800">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">
                {user.subscription === 'trial' ? 'Trial Analysis' : 'Demo Analysis'}: Simulated results for demonstration
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
          const isPending = index > currentStep;

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
                    {isActive && (
                      <span className="ml-2 text-sm font-normal">
                        {isRealAnalysis ? '(Live Analysis)' : '(Simulated)'}
                      </span>
                    )}
                  </h3>
                  
                  {isRealAnalysis && step.cost > 0 && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      ${step.cost.toFixed(3)}
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

      {/* Analysis Type Info */}
      <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">
          {isRealAnalysis ? 'Premium Analysis Features' : 'Trial Analysis Features'}
        </h3>
        
        {isRealAnalysis ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
              <span>Real website crawling and content extraction</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
              <span>AI-powered semantic analysis</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
              <span>Live competitor benchmarking</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
              <span>Personalized recommendations</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
              <span>Simulated analysis for demonstration</span>
            </div>
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
              <span>Sample insights and recommendations</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
              <span>Full interface preview</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
              <span>Realistic scoring methodology</span>
            </div>
          </div>
        )}
        
        {!isRealAnalysis && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Upgrade to get real analysis:</strong> Live website crawling, AI-powered insights, 
              and actionable recommendations based on actual content analysis.
            </p>
          </div>
        )}

        {/* Cost Breakdown for Real Analysis */}
        {isRealAnalysis && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="text-sm font-medium text-green-900 mb-2">Cost Breakdown:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-green-800">
              <div>• Website crawling: $0.03</div>
              <div>• Semantic analysis: $0.02</div>
              <div>• AI insights: $0.15</div>
              <div>• Technical analysis: $0.001</div>
              <div className="col-span-2 font-medium border-t border-green-200 pt-1 mt-1">
                Total estimated cost: ${estimatedCost.toFixed(3)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}