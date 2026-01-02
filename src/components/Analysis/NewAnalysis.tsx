import React, { useState, useEffect } from 'react';
import { Globe, MessageSquare, Sparkles, ArrowRight, Lightbulb, Zap, AlertCircle, Plus, X, Building2, CheckCircle } from 'lucide-react';
import AnalysisProgress from './AnalysisProgress';
import UsageLimitsBanner from './UsageLimitsBanner';
import { User, Analysis, AnalysisProvider } from '../../types';
import { AnalysisEngine } from '../../utils/analysisEngine';
import { useUsageMonitoring } from '../../utils/costTracker';

// Generate a unique ID for prompts
const generateId = () => Math.random().toString(36).substring(2, 9);

// Define a local type for analysis state
interface AnalysisState {
  website: string;
  prompts: { id: string; text: string }[];
  brandName?: string;
  providers: AnalysisProvider[];
}

interface NewAnalysisProps {
  onAnalyze: (analysis: Analysis) => void;
  user?: User;
}

export default function NewAnalysis({ onAnalyze, user }: NewAnalysisProps) {
  const [website, setWebsite] = useState('');
  const [prompts, setPrompts] = useState<{ id: string; text: string }[]>([
    { id: generateId(), text: '' }
  ]);
  const [brandName, setBrandName] = useState('');
  const [selectedProviders, setSelectedProviders] = useState<AnalysisProvider[]>(['perplexity', 'openai', 'anthropic']);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { usageLimits, isLoading: limitsLoading } = useUsageMonitoring(
    user?.id || '',
    user?.subscription || 'free'
  );

  // Check if user is admin or has a paid plan for real analysis
  const isRealAnalysis = user ? (AnalysisEngine.shouldUseRealAnalysis(user) || user.isAdmin === true) : false;

  // Get max prompts based on plan
  const getMaxPrompts = () => {
    if (!user) return 3;
    switch (user.subscription) {
      case 'enterprise': return 10;
      case 'professional': return 10;
      case 'starter': return 5;
      default: return 3;
    }
  };

  const maxPrompts = getMaxPrompts();

  const addPrompt = () => {
    if (prompts.length < maxPrompts) {
      setPrompts([...prompts, { id: generateId(), text: '' }]);
    }
  };

  const removePrompt = (id: string) => {
    if (prompts.length > 1) {
      setPrompts(prompts.filter(p => p.id !== id));
    }
  };

  const updatePrompt = (id: string, text: string) => {
    setPrompts(prompts.map(p => p.id === id ? { ...p, text } : p));
  };

  const toggleProvider = (provider: AnalysisProvider) => {
    if (selectedProviders.includes(provider)) {
      if (selectedProviders.length > 1) {
        setSelectedProviders(selectedProviders.filter(p => p !== provider));
      }
    } else {
      setSelectedProviders([...selectedProviders, provider]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Store parameters in localStorage for persistence
    try {
      localStorage.setItem('lastAnalysisWebsite', website);
      localStorage.setItem('lastAnalysisPrompts', JSON.stringify(prompts));
      localStorage.setItem('lastAnalysisBrandName', brandName);
      localStorage.setItem('lastAnalysisProviders', JSON.stringify(selectedProviders));
    } catch (error) {
      console.error('Error storing analysis parameters:', error);
    }

    if (!website || website.trim().length === 0) {
      setError('Please enter a website URL');
      return;
    }

    const validPrompts = prompts.filter(p => p.text.trim().length > 0);
    if (validPrompts.length === 0) {
      setError('Please enter at least one prompt');
      return;
    }

    if (selectedProviders.length === 0) {
      setError('Please select at least one AI provider');
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

    setIsAnalyzing(true);
    setCurrentAnalysis({
      website: website.trim(),
      prompts: validPrompts,
      brandName: brandName.trim() || undefined,
      providers: selectedProviders
    });
    console.log('Starting AEO analysis for:', website.trim(), validPrompts);
  };

  // Load last analysis parameters from localStorage
  useEffect(() => {
    try {
      const savedWebsite = localStorage.getItem('lastAnalysisWebsite');
      const savedPrompts = localStorage.getItem('lastAnalysisPrompts');
      const savedBrandName = localStorage.getItem('lastAnalysisBrandName');
      const savedProviders = localStorage.getItem('lastAnalysisProviders');

      if (savedWebsite) {
        setWebsite(savedWebsite);
      }

      if (savedPrompts) {
        const parsed = JSON.parse(savedPrompts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPrompts(parsed);
        }
      }

      if (savedBrandName) {
        setBrandName(savedBrandName);
      }

      if (savedProviders) {
        const parsed = JSON.parse(savedProviders);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedProviders(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading saved analysis parameters:', error);
    }
  }, []);

  const handleAnalysisComplete = (analysis: Analysis) => {
    setIsAnalyzing(false);
    setCurrentAnalysis(null);
    onAnalyze(analysis);
  };

  const handleAnalysisError = (error: string) => {
    setIsAnalyzing(false);
    setCurrentAnalysis(null);
    setError(error);
  };

  const suggestedPrompts = [
    'What are the best marketing automation tools?',
    'How do I improve my website SEO?',
    'What is the best CRM for small businesses?',
    'Where can I learn web development?',
    'What are the top project management tools?'
  ];

  const validPromptCount = prompts.filter(p => p.text.trim().length > 0).length;
  const isFormValid = website.length > 0 && validPromptCount > 0 && selectedProviders.length > 0;

  // Admin users can always analyze regardless of limits
  const canAnalyze = user?.isAdmin === true ? true : (usageLimits ?
    (usageLimits.currentUsage.analyses < usageLimits.monthlyAnalyses) :
    true);

  // Calculate estimated cost
  const estimatedCost = validPromptCount * selectedProviders.length * 0.02; // ~$0.02 per query

  if (isAnalyzing && currentAnalysis) {
    return (
      <AnalysisProgress
        website={currentAnalysis.website}
        prompts={currentAnalysis.prompts}
        brandName={currentAnalysis.brandName}
        providers={currentAnalysis.providers}
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
          Check Your AI Citations
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Enter prompts that your potential customers might ask AI assistants.
          We'll check if you're getting cited by ChatGPT, Claude, and Perplexity.
        </p>
      </div>

      {/* Usage Limits Banner */}
      {user && usageLimits && !limitsLoading && (
        <div className="mb-8">
          <UsageLimitsBanner
            usageLimits={usageLimits}
            onUpgrade={() => {
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
              {isRealAnalysis ? 'Live Citation Tracking' : user.subscription === 'trial' ? 'Trial Mode' : 'Demo Mode'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {isRealAnalysis ? (
              <>
                <div className="flex items-center space-x-2 text-blue-800">
                  <div className="w-2 h-2 bg-current rounded-full"></div>
                  <span>Real-time AI model queries</span>
                </div>
                <div className="flex items-center space-x-2 text-blue-800">
                  <div className="w-2 h-2 bg-current rounded-full"></div>
                  <span>Actual citation detection</span>
                </div>
                <div className="flex items-center space-x-2 text-blue-800">
                  <div className="w-2 h-2 bg-current rounded-full"></div>
                  <span>Competitor visibility analysis</span>
                </div>
                <div className="flex items-center space-x-2 text-blue-800">
                  <div className="w-2 h-2 bg-current rounded-full"></div>
                  <span>Actionable AEO recommendations</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2 text-purple-800">
                  <div className="w-2 h-2 bg-current rounded-full"></div>
                  <span>Simulated citation results</span>
                </div>
                <div className="flex items-center space-x-2 text-purple-800">
                  <div className="w-2 h-2 bg-current rounded-full"></div>
                  <span>Sample competitor data</span>
                </div>
                <div className="flex items-center space-x-2 text-purple-800">
                  <div className="w-2 h-2 bg-current rounded-full"></div>
                  <span>Full interface preview</span>
                </div>
                <div className="flex items-center space-x-2 text-purple-800">
                  <div className="w-2 h-2 bg-current rounded-full"></div>
                  <span>Example recommendations</span>
                </div>
              </>
            )}
          </div>

          {!isRealAnalysis && (
            <div className="mt-4 p-3 bg-white border border-purple-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-purple-600 mt-0.5" />
                <p className="text-sm text-purple-800">
                  <strong>Want real citations?</strong> Upgrade to any paid plan to query actual AI models
                  and see if your website is being recommended to users.
                </p>
              </div>
            </div>
          )}
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
              <h3 className="text-lg font-semibold text-gray-900">Your Website</h3>
              <p className="text-sm text-gray-600">The website you want to track citations for</p>
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

        {/* Brand Name Input (Optional) */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Brand Name <span className="text-gray-400 font-normal">(optional)</span></h3>
              <p className="text-sm text-gray-600">We'll also check for mentions of your brand name</p>
            </div>
          </div>

          <input
            type="text"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="Your Company Name"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>

        {/* Prompts Input */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Search Prompts</h3>
              <p className="text-sm text-gray-600">
                Enter questions your customers might ask AI assistants ({prompts.length}/{maxPrompts})
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {prompts.map((prompt, index) => (
              <div key={prompt.id} className="flex items-center space-x-2">
                <span className="text-gray-400 text-sm w-6">{index + 1}.</span>
                <input
                  type="text"
                  value={prompt.text}
                  onChange={(e) => updatePrompt(prompt.id, e.target.value)}
                  placeholder="e.g., What are the best marketing automation tools?"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                {prompts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePrompt(prompt.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {prompts.length < maxPrompts && (
            <button
              type="button"
              onClick={addPrompt}
              className="mt-3 flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Add another prompt</span>
            </button>
          )}

          {/* Prompt Suggestions */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-2 mb-3">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">Example prompts:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    const emptyPrompt = prompts.find(p => p.text.trim() === '');
                    if (emptyPrompt) {
                      updatePrompt(emptyPrompt.id, suggestion);
                    } else if (prompts.length < maxPrompts) {
                      setPrompts([...prompts, { id: generateId(), text: suggestion }]);
                    }
                  }}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Provider Selection */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Providers to Check</h3>
          <p className="text-sm text-gray-600 mb-4">
            Select which AI assistants to query for citations
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'perplexity' as AnalysisProvider, name: 'Perplexity', description: 'Best for citations - returns source URLs', color: 'blue' },
              { id: 'openai' as AnalysisProvider, name: 'ChatGPT', description: 'Brand mention detection', color: 'green' },
              { id: 'anthropic' as AnalysisProvider, name: 'Claude', description: 'Brand mention detection', color: 'purple' }
            ].map((provider) => (
              <button
                key={provider.id}
                type="button"
                onClick={() => toggleProvider(provider.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedProviders.includes(provider.id)
                    ? `border-${provider.color}-500 bg-${provider.color}-50`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">{provider.name}</span>
                  {selectedProviders.includes(provider.id) && (
                    <CheckCircle className={`w-5 h-5 text-${provider.color}-600`} />
                  )}
                </div>
                <p className="text-sm text-gray-600">{provider.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Cost Estimate */}
        {isRealAnalysis && validPromptCount > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Estimated Cost</p>
                <p className="text-sm text-gray-600">
                  {validPromptCount} prompt{validPromptCount > 1 ? 's' : ''} × {selectedProviders.length} provider{selectedProviders.length > 1 ? 's' : ''} = {validPromptCount * selectedProviders.length} queries
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">${estimatedCost.toFixed(2)}</p>
                <p className="text-sm text-gray-500">~$0.02 per query</p>
              </div>
            </div>
          </div>
        )}

        {/* What You'll Get */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">What You'll Get</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <span className="text-blue-800">Citation rate across AI providers</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <span className="text-blue-800">Which competitors ARE getting cited</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <span className="text-blue-800">Content analysis of your website</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <span className="text-blue-800">AEO recommendations to improve visibility</span>
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
                  ? 'Check My Citations'
                  : 'Try Demo Analysis'
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
              Upgrade your plan to continue
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
