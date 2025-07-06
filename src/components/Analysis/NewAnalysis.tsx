import React, { useState, useEffect } from 'react';
import { Globe, Target, Sparkles, ArrowRight, Lightbulb, Zap, AlertCircle } from 'lucide-react';
import AnalysisProgress from './AnalysisProgress';
import UsageLimitsBanner from './UsageLimitsBanner';
import ModelSelector from './ModelSelector';
import { User } from '../../types';
import { AnalysisEngine } from '../../utils/analysisEngine';
import { useUsageMonitoring } from '../../utils/costTracker';

interface NewAnalysisProps {
  onAnalyze: (website: string, keywords: string[]) => void;
  user?: User;
}

export default function NewAnalysis({ onAnalyze, user }: NewAnalysisProps) {
  const [website, setWebsite] = useState('');
  const [keywords, setKeywords] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const { usageLimits, isLoading: limitsLoading } = useUsageMonitoring(
    user?.id || '', 
    user?.subscription || 'free'
  );

  // Check if user is admin or has a paid plan for real analysis
  const isRealAnalysis = user ? (AnalysisEngine.shouldUseRealAnalysis(user) || user.isAdmin === true) : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Store the website and keywords in localStorage for persistence
    try {
      localStorage.setItem('lastAnalysisWebsite', website);
      localStorage.setItem('lastAnalysisKeywords', keywords);
      localStorage.setItem('lastSelectedModel', selectedModel);
    } catch (error) {
      console.error('Error storing analysis parameters:', error);
    }
    
    // Store the website and keywords in localStorage for persistence
    try {
      localStorage.setItem('lastAnalysisWebsite', website);
      localStorage.setItem('lastAnalysisKeywords', keywords);
      localStorage.setItem('lastSelectedModel', selectedModel);
    } catch (error) {
      console.error('Error storing analysis parameters:', error);
    }
    
    if (!website || website.trim().length === 0) {
      setError('Please enter a website URL');
      return;
    }
    
    if (!keywords || keywords.trim().length === 0) {
      setError('Please enter keywords');
      return;
    }

    // Check if user is at usage limits
    if (usageLimits) {
      const usagePercentage = (usageLimits.currentUsage.analyses / usageLimits.monthlyAnalyses) * 100;
      if (usagePercentage >= 100) {
        setError('You have reached your monthly analysis limit. Please upgrade your plan or wait for next billing cycle.');
        return;
      }
    }

    const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    
    setIsAnalyzing(true);
    setCurrentAnalysis({ website: website.trim(), keywords: keywordList, model: selectedModel });
    console.log('Starting analysis for:', website.trim(), keywordList);
  };
  
  // Load last analysis parameters from localStorage
  useEffect(() => {
    try {
      const savedWebsite = localStorage.getItem('lastAnalysisWebsite');
      const savedKeywords = localStorage.getItem('lastAnalysisKeywords');
      
      if (savedWebsite) {
        setWebsite(savedWebsite);
      }
      
      if (savedKeywords) {
        setKeywords(savedKeywords);
      }
      
      const savedModel = localStorage.getItem('lastSelectedModel');
      if (savedModel) {
        setSelectedModel(savedModel);
      }
    } catch (error) {
      console.error('Error loading saved analysis parameters:', error);
    }
  }, []);

  const handleAnalysisComplete = (analysis: any) => {
    setIsAnalyzing(false);
    setCurrentAnalysis(null);
    onAnalyze(analysis.website, analysis.keywords);
  };
  console.log('Current analysis state:', { isAnalyzing, currentAnalysis });

  const handleAnalysisError = (error: string) => {
    setIsAnalyzing(false);
    setCurrentAnalysis(null);
    setError(error);
  };

  const suggestedKeywords = [
    'marketing automation',
    'lead generation', 
    'email marketing',
    'customer acquisition',
    'sales funnel',
    'conversion optimization'
  ];

  const isFormValid = website.length > 0 && keywords.length > 0;
  // Admin users can always analyze regardless of limits
  const canAnalyze = user?.isAdmin === true ? true : (usageLimits ? 
    (usageLimits.currentUsage.analyses < usageLimits.monthlyAnalyses) : 
    true);
    
  // Load last analysis parameters from localStorage
  useEffect(() => {
    try {
      const savedWebsite = localStorage.getItem('lastAnalysisWebsite');
      const savedKeywords = localStorage.getItem('lastAnalysisKeywords');
      
      if (savedWebsite) {
        setWebsite(savedWebsite);
      }
      
      if (savedKeywords) {
        setKeywords(savedKeywords);
      }
    } catch (error) {
      console.error('Error loading saved analysis parameters:', error);
    }
  }, []);

  if (isAnalyzing && currentAnalysis) {
    return (
      <AnalysisProgress
        website={currentAnalysis.website}
        keywords={currentAnalysis.keywords}
        model={currentAnalysis.model}
        user={user!}
        onComplete={handleAnalysisComplete}
        onError={handleAnalysisError}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Analyze Your LLM Discoverability
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Get comprehensive insights into how well your website performs in AI-powered search results 
          and receive actionable recommendations to improve your visibility.
        </p>
      </div>

      {/* Usage Limits Banner */}
      {user && usageLimits && !limitsLoading && (
        <div className="mb-8">
          <UsageLimitsBanner 
            usageLimits={usageLimits}
            onUpgrade={() => {
              // Navigate to pricing page
              window.location.hash = '#pricing';
            }}
          />
        </div>
      )}

      {/* Analysis Type Banner */}
      {user && (
        <div className={`mb-8 rounded-xl border-2 p-6 ${
          isRealAnalysis 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-purple-500 bg-purple-50'
        }`}>
          <div className="flex items-center justify-center space-x-3 mb-3">
            {isRealAnalysis ? (
              <Zap className="w-6 h-6 text-blue-600" />
            ) : (
              <Sparkles className="w-6 h-6 text-purple-600" />
            )}
            <h3 className={`text-lg font-semibold ${
              isRealAnalysis ? 'text-blue-900' : 'text-purple-900'
            }`}>
              {isRealAnalysis ? 'Premium Analysis' : user.subscription === 'trial' ? 'Trial Analysis' : 'Demo Analysis'}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {isRealAnalysis ? (
              <>
                <div className={`flex items-center space-x-2 ${isRealAnalysis ? 'text-blue-800' : 'text-purple-800'}`}>
                  <div className="w-2 h-2 bg-current rounded-full"></div>
                  <span>Real website crawling & content analysis</span>
                </div>
                <div className={`flex items-center space-x-2 ${isRealAnalysis ? 'text-blue-800' : 'text-purple-800'}`}>
                  <div className="w-2 h-2 bg-current rounded-full"></div>
                  <span>AI-powered semantic understanding</span>
                </div>
                <div className={`flex items-center space-x-2 ${isRealAnalysis ? 'text-blue-800' : 'text-purple-800'}`}>
                  <div className="w-2 h-2 bg-current rounded-full"></div>
                  <span>Live competitor benchmarking</span>
                </div>
                <div className={`flex items-center space-x-2 ${isRealAnalysis ? 'text-blue-800' : 'text-purple-800'}`}>
                  <div className="w-2 h-2 bg-current rounded-full"></div>
                  <span>Personalized action plan</span>
                </div>
              </>
            ) : (
              <>
                <div className={`flex items-center space-x-2 ${isRealAnalysis ? 'text-blue-800' : 'text-purple-800'}`}>
                  <div className="w-2 h-2 bg-current rounded-full"></div>
                  <span>Simulated analysis for demonstration</span>
                </div>
                <div className={`flex items-center space-x-2 ${isRealAnalysis ? 'text-blue-800' : 'text-purple-800'}`}>
                  <div className="w-2 h-2 bg-current rounded-full"></div>
                  <span>Sample insights & recommendations</span>
                </div>
                <div className={`flex items-center space-x-2 ${isRealAnalysis ? 'text-blue-800' : 'text-purple-800'}`}>
                  <div className="w-2 h-2 bg-current rounded-full"></div>
                  <span>Full interface preview</span>
                </div>
                <div className={`flex items-center space-x-2 ${isRealAnalysis ? 'text-blue-800' : 'text-purple-800'}`}>
                  <div className="w-2 h-2 bg-current rounded-full"></div>
                  <span>Realistic scoring methodology</span>
                </div>
              </>
            )}
          </div>
          
          {!isRealAnalysis && (
            <div className="mt-4 p-3 bg-white border border-purple-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-purple-600 mt-0.5" />
                <p className="text-sm text-purple-800">
                  <strong>Want real analysis?</strong> Upgrade to any paid plan to get live website crawling, 
                  AI-powered insights, and actionable recommendations based on actual content analysis.
                </p>
              </div>
            </div>
          )}

          {/* Cost Information for Real Analysis */}
          {isRealAnalysis && (
            <div className="mt-4 p-3 bg-white border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <Zap className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Premium Analysis includes:</p>
                  <p>• Real-time website crawling (~$0.03)</p>
                  <p>• AI semantic analysis (~$0.02)</p>
                  <p>• GPT-4 powered insights (~$0.15)</p>
                  <p className="font-medium mt-1">Total cost per analysis: ~$0.20</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Model Selector */}
      {user && (
        <div className="mb-8">
          <ModelSelector 
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            subscription={user.subscription}
            isAdmin={user.isAdmin}
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Website Input */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Website URL</h3>
              <p className="text-sm text-gray-600">Enter the website you want to analyze</p>
            </div>
          </div>
          
          <input
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>

        {/* Keywords Input */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Target Keywords</h3>
              <p className="text-sm text-gray-600">
                Enter keywords you want to rank for (comma-separated)
              </p>
            </div>
          </div>

          <textarea
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="marketing automation, lead generation, email marketing"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            rows={3}
          />

          {/* Keyword Suggestions */}
          <div className="mt-4">
            <div className="flex items-center space-x-2 mb-3">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">Popular keywords:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedKeywords.map((keyword, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    const currentKeywords = keywords ? keywords + ', ' : '';
                    setKeywords(currentKeywords + keyword);
                  }}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
                >
                  {keyword}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Analysis Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">What You'll Get</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <span className="text-blue-800">Overall LLM Navigator Score (0-100)</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <span className="text-blue-800">Detailed metrics breakdown</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <span className="text-blue-800">
                {isRealAnalysis ? 'AI-generated' : 'Sample'} insights
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <span className="text-blue-800">Actionable recommendations</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={!isFormValid || !canAnalyze}
            className={`px-8 py-4 text-white text-lg font-semibold rounded-xl disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center space-x-3 transition-all shadow-lg ${
              isRealAnalysis 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
            }`}
          >
            <span>
              {!canAnalyze 
                ? 'Usage Limit Reached'
                : isRealAnalysis 
                ? 'Start Premium Analysis' 
                : user?.subscription === 'trial' 
                ? `Start Trial Analysis with ${selectedModel.includes('claude') ? 'Claude' : selectedModel.includes('perplexity') ? 'Perplexity' : 'GPT-4'}` 
                : `Start Demo Analysis with ${selectedModel.includes('claude') ? 'Claude' : selectedModel.includes('perplexity') ? 'Perplexity' : 'GPT-4'}`
              }
            </span>
            {canAnalyze && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>

        {!canAnalyze && (
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              You've reached your monthly analysis limit.
            </p>
            <button
              type="button"
              onClick={() => window.location.hash = '#pricing'}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Upgrade your plan to continue analyzing
            </button>
          </div>
        )}
      </form>
    </div>
  );
}