import React, { useState } from 'react';
import { Search, Mail, Globe, CheckCircle, ArrowRight, BarChart3, Eye, Target, Zap, Shield, TrendingUp, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FreeReportPageProps {
  onGetStarted: () => void;
}

export default function FreeReportPage({ onGetStarted }: FreeReportPageProps) {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportData, setReportData] = useState<{
    citationRate: number;
    aiVisibilityScore: number;
    isCited: boolean;
    citationContext?: string;
    competitors: { domain: string; context: string }[];
    prompt: string;
    aiResponse: string;
    recommendation: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!email || !website) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    // Normalize URL
    let normalizedUrl = website.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    setIsLoading(true);

    try {
      // Extract domain for prompt generation
      const domain = normalizedUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
      const brandName = domain.split('.')[0];

      // Generate a relevant prompt based on the domain
      const prompt = `What are the best ${brandName} alternatives and competitors? Include specific recommendations with websites.`;

      // Call the check-citations edge function with 1 prompt, 1 provider (OpenAI GPT-4o)
      const { data, error: fnError } = await supabase.functions.invoke('check-citations', {
        body: {
          prompts: [{ id: 'free-report-1', text: prompt }],
          website: normalizedUrl,
          brandName: brandName,
          providers: ['openai']
        }
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to analyze website');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Analysis failed');
      }

      const result = data.data.results[0];
      const isCited = result?.isCited || false;
      const competitors = result?.competitorsCited || [];

      // Calculate AI visibility score based on citation and competitors
      let aiVisibilityScore = 30; // Base score
      if (isCited) {
        aiVisibilityScore += 40; // Big boost for being cited
      }
      if (competitors.length === 0) {
        aiVisibilityScore += 15; // Good if no competitors cited
      } else if (competitors.length < 3) {
        aiVisibilityScore += 5;
      }
      // Cap at 100
      aiVisibilityScore = Math.min(100, aiVisibilityScore);

      // Generate recommendation based on results
      let recommendation = '';
      if (!isCited && competitors.length > 0) {
        recommendation = `Your competitors (${competitors.slice(0, 2).map(c => c.domain).join(', ')}) are being cited by AI. Add structured FAQ schema and direct answers to compete.`;
      } else if (!isCited) {
        recommendation = 'Add structured data markup (FAQ, HowTo schema) and include direct, factual answers in your content headers.';
      } else if (competitors.length > 3) {
        recommendation = 'You\'re being cited, but so are many competitors. Differentiate with unique data, case studies, and expert quotes.';
      } else {
        recommendation = 'Great visibility! Maintain by regularly updating content and adding fresh insights AI can reference.';
      }

      setReportData({
        citationRate: isCited ? 100 : 0, // Single query, so it's binary
        aiVisibilityScore,
        isCited,
        citationContext: result?.citationContext,
        competitors: competitors.slice(0, 5),
        prompt,
        aiResponse: result?.response || '',
        recommendation
      });

      setReportGenerated(true);

      // Save lead to database (fire and forget)
      supabase.from('free_report_leads').insert({
        email,
        website: normalizedUrl,
        is_cited: isCited,
        ai_score: aiVisibilityScore
      }).then(() => console.log('Lead saved')).catch(() => {});

    } catch (err) {
      console.error('Free report error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 60) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Work';
    return 'Poor';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Search className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-white">LLM Search Insight</span>
          </div>
          <button
            onClick={onGetStarted}
            className="text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 py-16">
        {!reportGenerated ? (
          <>
            {/* Pre-report: Lead capture form */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-6">
                <Zap className="w-4 h-4 text-blue-400" />
                <span className="text-blue-300 text-sm font-medium">Free AI Visibility Report</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Is Your Website Visible to<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                  AI Search Engines?
                </span>
              </h1>

              <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
                ChatGPT, Perplexity, and Claude are changing how people find information.
                Find out if your content is being cited — in 30 seconds, for free.
              </p>
            </div>

            {/* Form Card */}
            <div className="max-w-xl mx-auto">
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 shadow-2xl">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Work Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Website URL
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="text"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="yourcompany.com"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Analyzing your website...</span>
                      </>
                    ) : (
                      <>
                        <span>Get My Free Report</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>

                <p className="text-center text-slate-500 text-sm mt-4">
                  No credit card required. Report delivered instantly.
                </p>
              </div>
            </div>

            {/* What's included */}
            <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Eye className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">AI Visibility Score</h3>
                <p className="text-slate-400 text-sm">See how well AI assistants can parse and cite your content</p>
              </div>

              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Citation Rate</h3>
                <p className="text-slate-400 text-sm">Percentage of queries where your site gets mentioned</p>
              </div>

              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Top Recommendation</h3>
                <p className="text-slate-400 text-sm">One actionable tip to improve your AI discoverability</p>
              </div>
            </div>

          </>
        ) : (
          <>
            {/* Post-report: Show results */}
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <div className="inline-flex items-center space-x-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-6">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-300 text-sm font-medium">Report Ready</span>
                </div>

                <h1 className="text-3xl font-bold text-white mb-4">
                  Your AI Visibility Report
                </h1>
                <p className="text-slate-400">
                  Results for <span className="text-white font-medium">{website}</span>
                </p>
              </div>

              {/* Citation Result - Main Finding */}
              <div className={`rounded-xl p-6 mb-6 border ${reportData?.isCited ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                <div className="flex items-center space-x-3 mb-3">
                  {reportData?.isCited ? (
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                      <span className="text-red-400 text-xl font-bold">!</span>
                    </div>
                  )}
                  <div>
                    <h3 className={`text-xl font-bold ${reportData?.isCited ? 'text-green-400' : 'text-red-400'}`}>
                      {reportData?.isCited ? 'You Were Cited!' : 'Not Cited'}
                    </h3>
                    <p className="text-slate-400 text-sm">
                      {reportData?.isCited
                        ? 'AI mentioned your website in its response'
                        : 'AI did not mention your website in this query'}
                    </p>
                  </div>
                </div>
                {reportData?.citationContext && (
                  <div className="bg-slate-900/50 rounded-lg p-3 mt-3">
                    <p className="text-slate-300 text-sm italic">"{reportData.citationContext}"</p>
                  </div>
                )}
              </div>

              {/* Score Cards */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center">
                  <p className="text-slate-400 text-sm mb-2">AI Visibility Score</p>
                  <p className={`text-5xl font-bold ${getScoreColor(reportData?.aiVisibilityScore || 0)}`}>
                    {reportData?.aiVisibilityScore}
                  </p>
                  <p className={`text-sm mt-1 ${getScoreColor(reportData?.aiVisibilityScore || 0)}`}>
                    {getScoreLabel(reportData?.aiVisibilityScore || 0)}
                  </p>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center">
                  <p className="text-slate-400 text-sm mb-2">Competitors Cited</p>
                  <p className={`text-5xl font-bold ${(reportData?.competitors?.length || 0) > 3 ? 'text-red-500' : (reportData?.competitors?.length || 0) > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                    {reportData?.competitors?.length || 0}
                  </p>
                  <p className="text-slate-500 text-sm mt-1">
                    {(reportData?.competitors?.length || 0) === 0 ? 'Great!' : 'In this query'}
                  </p>
                </div>
              </div>

              {/* Competitors Found */}
              {reportData?.competitors && reportData.competitors.length > 0 && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
                    <Eye className="w-5 h-5 text-yellow-400" />
                    <span>Competitors Getting Cited</span>
                  </h3>
                  <div className="space-y-2">
                    {reportData.competitors.map((comp, index) => (
                      <div key={index} className="flex items-center justify-between bg-slate-900/50 rounded-lg px-4 py-2">
                        <span className="text-slate-300 font-medium">{comp.domain}</span>
                        <ExternalLink className="w-4 h-4 text-slate-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* The Query We Tested */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
                <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
                  <Search className="w-5 h-5 text-blue-400" />
                  <span>Query Tested</span>
                </h3>
                <p className="text-slate-300 bg-slate-900/50 rounded-lg px-4 py-3 italic">
                  "{reportData?.prompt}"
                </p>
                <p className="text-slate-500 text-xs mt-2">Powered by ChatGPT (GPT-4o)</p>
              </div>

              {/* Recommendation */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
                <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
                  <Target className="w-5 h-5 text-indigo-400" />
                  <span>Your #1 Recommendation</span>
                </h3>
                <p className="text-slate-300">{reportData?.recommendation}</p>
              </div>

              {/* Upgrade CTA */}
              <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 rounded-xl p-6 text-center">
                <h3 className="text-white font-semibold text-lg mb-2">
                  Want the Full Analysis?
                </h3>
                <p className="text-slate-300 text-sm mb-4">
                  Get detailed citation tracking across 3 AI providers, competitor analysis, and actionable recommendations.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={onGetStarted}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all flex items-center space-x-2"
                  >
                    <span>Start Free Trial</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <span className="text-slate-500 text-sm">No credit card required</span>
                </div>

                <div className="flex items-center justify-center space-x-4 mt-4 text-slate-400 text-xs">
                  <span className="flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>10 analyses/month</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>3 AI providers</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Competitor tracking</span>
                  </span>
                </div>
              </div>

              {/* Share */}
              <div className="mt-8 text-center">
                <p className="text-slate-500 text-sm mb-3">Share your score</p>
                <div className="flex items-center justify-center space-x-3">
                  <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors">
                    Twitter
                  </button>
                  <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors">
                    LinkedIn
                  </button>
                  <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors">
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between text-slate-500 text-sm">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Shield className="w-4 h-4" />
              <span>Your data is secure and never shared</span>
            </div>
            <div className="flex items-center space-x-6">
              <a href="#privacy" className="hover:text-slate-300 transition-colors">Privacy</a>
              <a href="#terms" className="hover:text-slate-300 transition-colors">Terms</a>
              <a href="#pricing" className="hover:text-slate-300 transition-colors">Pricing</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
