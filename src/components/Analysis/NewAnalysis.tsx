import React, { useState, useEffect } from 'react';
import { Globe, MessageSquare, Sparkles, ArrowRight, Lightbulb, Zap, AlertCircle, Plus, X, Building2, CheckCircle, History, Lock, Briefcase } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AnalysisProgress from './AnalysisProgress';
import UsageLimitsBanner from './UsageLimitsBanner';
import { User, Analysis, AnalysisProvider } from '../../types';
import { AnalysisEngine } from '../../utils/analysisEngine';
import { useUsageMonitoring } from '../../utils/costTracker';
import { sanitizeUrl, sanitizeText, sanitizeSearchQuery } from '../../utils/sanitize';
import { canRunAnalysis, isTrialExpired } from '../../utils/userUtils';
import { detectIndustryFromAI } from '../../utils/industryDetector';

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
  const [selectedProviders, setSelectedProviders] = useState<AnalysisProvider[]>(['perplexity', 'openai', 'anthropic', 'gemini']);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasLastAnalysis, setHasLastAnalysis] = useState(false);
  const [industry, setIndustry] = useState('');
  const [isDetectingIndustry, setIsDetectingIndustry] = useState(false);
  const [industryDetected, setIndustryDetected] = useState(false);
  const [formStep, setFormStep] = useState<1 | 2>(1); // Step 1: Website + Industry, Step 2: Prompts + Providers

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

  // Handle continuing to step 2
  const handleContinueToStep2 = () => {
    if (!website || !website.includes('.')) {
      setError('Please enter a valid website URL');
      return;
    }
    setError(null);
    setFormStep(2);
  };

  // Handle going back to step 1
  const handleBackToStep1 = () => {
    setFormStep(1);
  };

  // Detect industry from website using AI
  const detectIndustry = async (websiteUrl: string) => {
    if (!websiteUrl || isDetectingIndustry) return;

    setIsDetectingIndustry(true);
    try {
      const result = await detectIndustryFromAI(websiteUrl, supabase);

      if (result.detected && result.industry) {
        setIndustry(result.industry);
        setIndustryDetected(true);
      }
    } catch (error) {
      console.error('Industry detection failed:', error);
    } finally {
      setIsDetectingIndustry(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Sanitize all inputs before processing
    const sanitizedWebsite = sanitizeUrl(website);
    const sanitizedBrandName = sanitizeText(brandName);
    const sanitizedPrompts = prompts
      .map(p => ({ id: p.id, text: sanitizeSearchQuery(p.text) }))
      .filter(p => p.text.length > 0);

    // Store parameters in localStorage for persistence
    try {
      localStorage.setItem('lastAnalysisWebsite', website);
      localStorage.setItem('lastAnalysisPrompts', JSON.stringify(prompts));
      localStorage.setItem('lastAnalysisBrandName', brandName);
      localStorage.setItem('lastAnalysisProviders', JSON.stringify(selectedProviders));
    } catch (error) {
      console.error('Error storing analysis parameters:', error);
    }

    if (!sanitizedWebsite) {
      setError('Please enter a valid website URL');
      return;
    }

    if (sanitizedPrompts.length === 0) {
      setError('Please enter at least one valid prompt');
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
      website: sanitizedWebsite,
      prompts: sanitizedPrompts,
      brandName: sanitizedBrandName || undefined,
      providers: selectedProviders
    });
    console.log('Starting AEO analysis for:', sanitizedWebsite, sanitizedPrompts);
  };

  // Function to check if there's a last analysis available
  const checkForLastAnalysis = () => {
    try {
      const lastAnalysis = localStorage.getItem('currentAnalysis');
      setHasLastAnalysis(!!lastAnalysis);
    } catch (error) {
      console.error('Error checking for last analysis:', error);
      setHasLastAnalysis(false);
    }
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

      // Check if there's a last analysis to view
      checkForLastAnalysis();
    } catch (error) {
      console.error('Error loading saved analysis parameters:', error);
    }
  }, []);

  // Re-check for last analysis when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForLastAnalysis();
      }
    };

    // Check on focus as well (for single-page navigation)
    const handleFocus = () => {
      checkForLastAnalysis();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Detect industry when website URL changes (debounced)
  useEffect(() => {
    // Only auto-detect if we haven't already detected and user is on a paid plan
    if (industryDetected || !isRealAnalysis) return;

    const timer = setTimeout(() => {
      if (website && website.includes('.')) {
        detectIndustry(website);
      }
    }, 1500); // 1.5 second debounce

    return () => clearTimeout(timer);
  }, [website, industryDetected, isRealAnalysis]);

  const handleAnalysisComplete = (analysis: Analysis) => {
    setIsAnalyzing(false);
    setCurrentAnalysis(null);
    setHasLastAnalysis(true); // Analysis is now available to view
    onAnalyze(analysis);
  };

  const handleAnalysisError = (error: string) => {
    setIsAnalyzing(false);
    setCurrentAnalysis(null);
    setError(error);
  };

  // Generate industry-specific prompt suggestions
  const getIndustryPrompts = (): string[] => {
    if (!industry) {
      return [
        'What are the best marketing automation tools?',
        'How do I improve my website SEO?',
        'What is the best CRM for small businesses?',
        'Where can I learn web development?',
        'What are the top project management tools?'
      ];
    }

    const industryLower = industry.toLowerCase();
    return [
      `What are the best ${industryLower} companies?`,
      `Who are the top providers in ${industryLower}?`,
      `What should I look for in a ${industryLower} service?`,
      `Best ${industryLower} tools for small businesses`,
      `How do I choose a ${industryLower} vendor?`
    ];
  };

  const suggestedPrompts = getIndustryPrompts();

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

  // Check if user can run analyses (trial expiration check)
  const analysisAccess = canRunAnalysis(user || null);

  // Show paywall if trial expired or no access
  if (!analysisAccess.canRun) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">
            {isTrialExpired(user || null) ? 'Your Trial Has Expired' : 'Upgrade Required'}
          </h1>
          <p className="text-slate-400 mb-6">
            {analysisAccess.reason}
          </p>

          {/* Show what they're missing */}
          <div className="bg-slate-900/50 rounded-xl p-6 mb-8 text-left">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
              With a paid plan, you get:
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center text-slate-300">
                <CheckCircle className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                <span>Real AI citation checking across ChatGPT, Claude, Gemini & Perplexity</span>
              </li>
              <li className="flex items-center text-slate-300">
                <CheckCircle className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                <span>Detailed competitor analysis</span>
              </li>
              <li className="flex items-center text-slate-300">
                <CheckCircle className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                <span>Actionable recommendations to improve visibility</span>
              </li>
              <li className="flex items-center text-slate-300">
                <CheckCircle className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                <span>Priority support</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.hash = 'pricing'}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-blue-500/25"
            >
              View Pricing Plans
            </button>
            {(hasLastAnalysis || localStorage.getItem('currentAnalysis')) && (
              <button
                onClick={() => window.location.hash = 'analysis-results'}
                className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors"
              >
                View Past Results
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">
          Analyze Your AI Visibility
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          {formStep === 1
            ? "First, let's identify your website and industry."
            : "Now, enter the prompts your customers might ask AI assistants."
          }
        </p>

        {/* Step indicator for paid users */}
        {isRealAnalysis && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className={`flex items-center gap-2 ${formStep === 1 ? 'text-blue-400' : 'text-slate-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                formStep === 1 ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'
              }`}>1</div>
              <span className="text-sm font-medium">Website & Industry</span>
            </div>
            <div className="w-8 h-px bg-slate-600" />
            <div className={`flex items-center gap-2 ${formStep === 2 ? 'text-blue-400' : 'text-slate-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                formStep === 2 ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'
              }`}>2</div>
              <span className="text-sm font-medium">Prompts & Analysis</span>
            </div>
          </div>
        )}

        {(hasLastAnalysis || localStorage.getItem('currentAnalysis')) && (
          <button
            onClick={() => window.location.hash = 'analysis-results'}
            className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
          >
            <History className="w-4 h-4" />
            <span>View Last Analysis</span>
          </button>
        )}
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
            ? 'border-blue-600 bg-blue-900/30'
            : 'border-purple-600 bg-purple-900/30'
        }`}>
          <div className="flex items-center justify-center space-x-3 mb-3">
            {isRealAnalysis ? (
              <Zap className="w-6 h-6 text-blue-400" />
            ) : (
              <Sparkles className="w-6 h-6 text-purple-400" />
            )}
            <h3 className={`text-lg font-semibold ${
              isRealAnalysis ? 'text-blue-300' : 'text-purple-300'
            }`}>
              {isRealAnalysis ? 'Live Citation Tracking' : user.subscription === 'trial' ? 'Trial Mode' : 'Demo Mode'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {isRealAnalysis ? (
              <>
                <div className="flex items-center space-x-2 text-blue-300">
                  <div className="w-2 h-2 bg-current rounded-full"></div>
                  <span>Real-time AI model queries</span>
                </div>
                <div className="flex items-center space-x-2 text-blue-300">
                  <div className="w-2 h-2 bg-current rounded-full"></div>
                  <span>Actual citation detection</span>
                </div>
                <div className="flex items-center space-x-2 text-blue-300">
                  <div className="w-2 h-2 bg-current rounded-full"></div>
                  <span>Competitor visibility analysis</span>
                </div>
                <div className="flex items-center space-x-2 text-blue-300">
                  <div className="w-2 h-2 bg-current rounded-full"></div>
                  <span>Actionable AEO recommendations</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2 text-purple-300">
                  <div className="w-2 h-2 bg-current rounded-full"></div>
                  <span>Simulated citation results</span>
                </div>
                <div className="flex items-center space-x-2 text-purple-300">
                  <div className="w-2 h-2 bg-current rounded-full"></div>
                  <span>Sample competitor data</span>
                </div>
                <div className="flex items-center space-x-2 text-purple-300">
                  <div className="w-2 h-2 bg-current rounded-full"></div>
                  <span>Full interface preview</span>
                </div>
                <div className="flex items-center space-x-2 text-purple-300">
                  <div className="w-2 h-2 bg-current rounded-full"></div>
                  <span>Example recommendations</span>
                </div>
              </>
            )}
          </div>

          {!isRealAnalysis && (
            <div className="mt-4 p-3 bg-slate-800 border border-purple-700 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-purple-400 mt-0.5" />
                <p className="text-sm text-purple-300">
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
        <div className="mb-6 bg-red-900/30 border border-red-700 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* STEP 1: Website & Industry (for paid users) or all fields for trial */}
        {(formStep === 1 || !isRealAnalysis) && (
          <>
            {/* Website Input */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-900/50 rounded-xl flex items-center justify-center">
                  <Globe className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Your Website</h3>
                  <p className="text-sm text-slate-400">The website you want to track citations for</p>
                </div>
              </div>

              <input
                type="text"
                value={website}
                onChange={(e) => {
                  setWebsite(e.target.value);
                  // Reset industry detection when URL changes
                  if (industryDetected) {
                    setIndustry('');
                    setIndustryDetected(false);
                  }
                }}
                placeholder="https://example.com"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Industry Input (Auto-detected, editable) - Only for paid users in Step 1 */}
            {isRealAnalysis && (
              <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-amber-900/50 rounded-xl flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Industry
                    </h3>
                    <p className="text-sm text-slate-400">
                      {isDetectingIndustry
                        ? 'Detecting industry from your website...'
                        : industryDetected
                          ? 'Auto-detected from your website - feel free to edit'
                          : 'Enter your website above to auto-detect, or type manually'}
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => {
                      setIndustry(e.target.value);
                      setIndustryDetected(false); // Mark as user-edited
                    }}
                    placeholder="e.g., Environmental Consulting, SaaS Marketing Tools"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    disabled={isDetectingIndustry}
                  />
                  {isDetectingIndustry && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {industryDetected && (
                  <p className="mt-2 text-xs text-amber-400/70 flex items-center">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI-suggested based on your website content
                  </p>
                )}

                {website && website.includes('.') && !isDetectingIndustry && !industry && (
                  <button
                    type="button"
                    onClick={() => detectIndustry(website)}
                    className="mt-2 text-sm text-amber-400 hover:text-amber-300 flex items-center"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Detect industry from website
                  </button>
                )}
              </div>
            )}

            {/* Continue Button for Step 1 (paid users only) */}
            {isRealAnalysis && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleContinueToStep2}
                  disabled={!website || !website.includes('.') || isDetectingIndustry}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-lg font-semibold rounded-xl disabled:from-gray-500 disabled:to-gray-500 disabled:cursor-not-allowed flex items-center space-x-3 transition-all shadow-lg"
                >
                  <span>{isDetectingIndustry ? 'Detecting Industry...' : 'Continue'}</span>
                  {!isDetectingIndustry && <ArrowRight className="w-5 h-5" />}
                </button>
              </div>
            )}
          </>
        )}

        {/* STEP 2: Brand, Prompts, Providers (for paid users) OR shown alongside Step 1 for trial */}
        {(formStep === 2 || !isRealAnalysis) && (
          <>
            {/* Back button and summary for Step 2 */}
            {isRealAnalysis && formStep === 2 && (
              <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleBackToStep1}
                    className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    <span>Back</span>
                  </button>
                  <div className="text-right">
                    <p className="text-white font-medium">{website}</p>
                    {industry && <p className="text-sm text-amber-400">{industry}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Brand Name Input (Optional) */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-purple-900/50 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Brand Name <span className="text-slate-500 font-normal">(optional)</span></h3>
                  <p className="text-sm text-slate-400">We'll also check for mentions of your brand name</p>
                </div>
              </div>

              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Your Company Name"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
          </>
        )}

        {/* Prompts Input - Show in Step 2 for paid, or always for trial */}
        {(formStep === 2 || !isRealAnalysis) && (
          <>
        {/* Prompts Input */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-emerald-900/50 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Search Prompts</h3>
              <p className="text-sm text-slate-400">
                Enter questions your customers might ask AI assistants ({prompts.length}/{maxPrompts})
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {prompts.map((prompt, index) => (
              <div key={prompt.id} className="flex items-center space-x-2">
                <span className="text-slate-500 text-sm w-6">{index + 1}.</span>
                <input
                  type="text"
                  value={prompt.text}
                  onChange={(e) => updatePrompt(prompt.id, e.target.value)}
                  placeholder="e.g., What are the best marketing automation tools?"
                  className="flex-1 px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                {prompts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePrompt(prompt.id)}
                    className="p-2 text-slate-500 hover:text-red-400 transition-colors"
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
              className="mt-3 flex items-center space-x-2 text-blue-400 hover:text-blue-300 font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Add another prompt</span>
            </button>
          )}

          {/* Prompt Suggestions */}
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="flex items-center space-x-2 mb-3">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-slate-300">Example prompts:</span>
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
                  className="px-3 py-1 bg-slate-700 text-slate-300 text-sm rounded-md hover:bg-slate-600 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Provider Selection */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-2">AI Providers to Check</h3>
          <p className="text-sm text-slate-400 mb-4">
            Select which AI assistants to query for citations
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { id: 'perplexity' as AnalysisProvider, name: 'Perplexity', description: 'Best for citations - returns source URLs', color: 'blue' },
              { id: 'openai' as AnalysisProvider, name: 'ChatGPT', description: 'Brand mention detection', color: 'green' },
              { id: 'anthropic' as AnalysisProvider, name: 'Claude', description: 'Brand mention detection', color: 'purple' },
              { id: 'gemini' as AnalysisProvider, name: 'Gemini', description: 'Google AI - brand mention detection', color: 'amber' }
            ].map((provider) => (
              <button
                key={provider.id}
                type="button"
                onClick={() => toggleProvider(provider.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedProviders.includes(provider.id)
                    ? `border-${provider.color}-500 bg-${provider.color}-900/30`
                    : 'border-slate-600 hover:border-slate-500 bg-slate-900/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-white">{provider.name}</span>
                  {selectedProviders.includes(provider.id) && (
                    <CheckCircle className={`w-5 h-5 text-${provider.color}-400`} />
                  )}
                </div>
                <p className="text-sm text-slate-400">{provider.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Cost Estimate */}
        {isRealAnalysis && validPromptCount > 0 && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Estimated Cost</p>
                <p className="text-sm text-slate-400">
                  {validPromptCount} prompt{validPromptCount > 1 ? 's' : ''} × {selectedProviders.length} provider{selectedProviders.length > 1 ? 's' : ''} = {validPromptCount * selectedProviders.length} queries
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">${estimatedCost.toFixed(2)}</p>
                <p className="text-sm text-slate-500">~$0.02 per query</p>
              </div>
            </div>
          </div>
        )}

        {/* What You'll Get */}
        <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-300 mb-3">What You'll Get</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
              <span className="text-blue-200">Citation rate across AI providers</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
              <span className="text-blue-200">Which competitors ARE getting cited</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
              <span className="text-blue-200">Content analysis of your website</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
              <span className="text-blue-200">AEO recommendations to improve visibility</span>
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
                  ? 'Run AI Visibility Analysis'
                  : 'Try Demo Analysis'
              }
            </span>
            {canAnalyze && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>

        {!canAnalyze && (
          <div className="text-center">
            <p className="text-slate-400 mb-2">
              You've reached your monthly analysis limit.
            </p>
            <button
              type="button"
              onClick={() => window.location.hash = '#pricing'}
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Upgrade your plan to continue
            </button>
          </div>
        )}
          </>
        )}
      </form>
    </div>
  );
}
