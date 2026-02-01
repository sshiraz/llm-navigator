import React from 'react';
import { Search, TrendingUp, Target, Zap, CheckCircle, ArrowRight, BarChart3, Users, Shield, LogIn, Mail, FileText, Eye, LineChart, Briefcase, Building2, UserCircle } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const handleSignIn = () => {
    window.location.hash = '#auth';
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation Header */}
      <nav className="relative z-10 border-b border-slate-700/50">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold text-white">LLM Navigator</h1>
              <p className="text-xs text-slate-400">Answer Engine Optimization</p>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center space-x-3">
            <a
              href="/blog"
              className="hidden sm:flex items-center space-x-2 px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              <span>Blog</span>
            </a>

            <button
              onClick={() => {
                window.location.href = '/free-report';
              }}
              className="hidden sm:flex items-center space-x-2 px-4 py-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span>Free Report</span>
            </button>

            <button
              onClick={() => {
                window.location.hash = '#pricing';
              }}
              className="flex items-center space-x-2 px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              <span>Pricing</span>
            </button>

            <button
              onClick={() => {
                window.location.hash = '#contact';
              }}
              className="hidden sm:flex items-center space-x-2 px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span>Contact</span>
            </button>

            <button
              onClick={handleSignIn}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all border border-slate-600"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
          <div className="text-center">
            {/* Urgency Badge */}
            <div className="inline-flex items-center space-x-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2 mb-8">
              <Zap className="w-4 h-4 text-red-400" />
              <span className="text-red-300 text-sm font-medium">Your competitors are getting cited. Are you?</span>
            </div>

            {/* Pain-Focused Headline */}
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Your Website Is Invisible
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
                to AI Search
              </span>
            </h1>

            <p className="text-xl text-slate-300 mb-4 max-w-3xl mx-auto leading-relaxed">
              Right now, potential customers are asking ChatGPT and Perplexity for recommendations in your industry.
            </p>

            <p className="text-2xl text-white font-semibold mb-4 max-w-3xl mx-auto">
              AI is answering — but it's not mentioning you.
            </p>

            <p className="text-lg text-slate-400 mb-8 max-w-3xl mx-auto">
              Every day you wait, your competitors capture customers who never even knew you existed.
            </p>

            {/* Pain Example Box */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 max-w-2xl mx-auto mb-8">
              <p className="text-slate-400 text-sm mb-3">A potential customer just asked ChatGPT:</p>
              <p className="text-white text-lg font-medium mb-4 italic">"What's the best {'{your product category}'} for {'{their use case}'}?"</p>
              <p className="text-slate-300 mb-3">ChatGPT listed 5 companies. <span className="text-red-400 font-bold">You weren't one of them.</span></p>
              <p className="text-slate-400 text-sm">
                That customer just bought from your competitor — and they'll never know you existed.
              </p>
            </div>

            {/* Free Report CTA Box */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 max-w-2xl mx-auto mb-8">
              <h3 className="text-xl font-semibold text-white mb-2">Free AI Visibility Report</h3>
              <p className="text-slate-400 mb-4">
                Find out if your website is being cited by AI search engines — in under 30 seconds.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
                <button
                  onClick={() => { window.location.href = '/free-report'; }}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-lg font-semibold rounded-xl transition-all shadow-2xl flex items-center space-x-2"
                >
                  <span>Get Free Report</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  onClick={onGetStarted}
                  className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white text-lg font-semibold rounded-xl transition-all border border-slate-600 flex items-center space-x-2"
                >
                  <span>Start Free Trial</span>
                </button>
              </div>

              {/* What You Get */}
              <div className="grid grid-cols-2 gap-2 text-sm text-slate-400">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Where your site is cited</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Where competitors appear instead</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>What pages AI actually reads</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Exactly what to fix first</span>
                </div>
              </div>
            </div>

            {/* Social Proof */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span>Works with ChatGPT, Claude, Perplexity, and Gemini</span>
              </div>
            </div>

            {/* Product Definition */}
            <p className="mt-8 text-sm text-slate-500">
              LLM Navigator is an AI visibility analysis tool that shows how websites appear in AI-generated answers.
            </p>
          </div>
        </div>
      </div>

      {/* Search Landscape Changed Section */}
      <div className="py-20 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              The Search Landscape Has Fundamentally Changed
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              People no longer search the web — <span className="text-blue-400">they ask AI</span>.
            </p>
            <p className="text-lg text-slate-400 mb-8">
              Instead of clicking websites, users now receive:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="text-center p-6 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Summarized Answers</h3>
            </div>

            <div className="text-center p-6 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Recommended Tools</h3>
            </div>

            <div className="text-center p-6 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Cited Sources</h3>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xl text-red-400 font-medium bg-red-500/10 border border-red-500/20 rounded-xl p-6">
              If AI doesn't mention your brand, <span className="text-white">customers never see you</span> — even if your SEO is perfect.
            </p>
          </div>
        </div>
      </div>

      {/* Why Traditional SEO Is Not Enough */}
      <div className="py-20 border-t border-slate-800 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Why Traditional SEO Is No Longer Enough
            </h2>
            <p className="text-lg text-slate-400 mb-4">
              Traditional SEO was built for ranking web pages in Google.
            </p>
            <p className="text-xl text-slate-300 mb-8">
              AI search engines work differently.
            </p>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8 max-w-xl mx-auto">
              <p className="text-slate-400 mb-2">They do not rank pages.</p>
              <p className="text-2xl font-bold text-blue-400">They generate answers.</p>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-center text-slate-300 mb-6">AI assistants choose what to cite based on:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <span className="text-white">Clear topical authority</span>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <span className="text-white">Structured content</span>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <span className="text-white">Factual clarity</span>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <span className="text-white">Answer-ready formatting</span>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 lg:col-span-1 md:col-span-2 lg:mx-0 md:mx-auto md:w-1/2 lg:w-full">
                <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <span className="text-white">Strong entity signals</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-lg text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              A page can rank #1 on Google — and still never appear in AI answers.
            </p>
          </div>
        </div>
      </div>

      {/* Introducing AEO Section */}
      <div className="py-20 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Your SEO Tools Can't Fix This
            </h2>
            <p className="text-lg text-slate-400 mb-4">
              Traditional SEO tools measure Google rankings. They have no idea how AI sees your site.
            </p>
            <p className="text-xl text-red-400 font-medium mb-8">
              That's why you need Answer Engine Optimization (AEO).
            </p>
            <p className="text-lg text-slate-300 mb-4">
              LLM Navigator measures your AI visibility across:
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="text-center p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <p className="text-white font-semibold">ChatGPT</p>
            </div>
            <div className="text-center p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <p className="text-white font-semibold">Claude</p>
            </div>
            <div className="text-center p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <p className="text-white font-semibold">Perplexity</p>
            </div>
            <div className="text-center p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <p className="text-white font-semibold">Gemini</p>
            </div>
          </div>
        </div>
      </div>

      {/* How AI Decides What to Cite */}
      <div className="py-20 border-t border-slate-800 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              How AI Search Engines Decide What to Cite
            </h2>
            <p className="text-lg text-slate-400 mb-8">
              When generating answers, AI systems prefer content that:
            </p>
          </div>

          <div className="space-y-4 mb-12">
            <div className="flex items-start space-x-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
              <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span className="text-slate-300">Clearly defines topics and entities</span>
            </div>
            <div className="flex items-start space-x-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
              <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span className="text-slate-300">Answers questions directly</span>
            </div>
            <div className="flex items-start space-x-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
              <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span className="text-slate-300">Uses structured headings and summaries</span>
            </div>
            <div className="flex items-start space-x-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
              <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span className="text-slate-300">Includes schema and metadata</span>
            </div>
            <div className="flex items-start space-x-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
              <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span className="text-slate-300">Presents authoritative, extractable information</span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-lg text-slate-300 bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
              LLM Navigator analyzes your site using these same principles — revealing exactly <span className="text-blue-400 font-semibold">why AI engines do or do not reference your content</span>.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-20 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              How It Works
            </h2>
          </div>

          <div className="space-y-8">
            <div className="flex items-start space-x-6">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">1</div>
              <div>
                <h4 className="text-xl font-semibold text-white mb-2">Analyze Your Website</h4>
                <p className="text-slate-400">We crawl your site to evaluate structure, clarity, schema markup, and AI readability.</p>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">2</div>
              <div>
                <h4 className="text-xl font-semibold text-white mb-2">Test Across AI Search Engines</h4>
                <p className="text-slate-400">We query ChatGPT, Claude, Perplexity, and Gemini using real prompts customers ask in your industry.</p>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">3</div>
              <div>
                <h4 className="text-xl font-semibold text-white mb-2">Discover Visibility Gaps</h4>
                <p className="text-slate-400">See where competitors are being cited — and where your brand is missing entirely.</p>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">4</div>
              <div>
                <h4 className="text-xl font-semibold text-white mb-2">Get Actionable Recommendations</h4>
                <p className="text-slate-400">Receive clear, prioritized recommendations to improve your AI search visibility.</p>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">5</div>
              <div>
                <h4 className="text-xl font-semibold text-white mb-2">Track Progress Over Time</h4>
                <p className="text-slate-400">Monitor citation frequency and visibility improvements as your site evolves.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Visibility Score Section */}
      <div className="py-20 border-t border-slate-800 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Your AI Visibility Score: How Bad Is It?
            </h2>
            <p className="text-lg text-slate-400 mb-8">
              Most websites score below 40. Find out where you stand:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            <div className="flex items-center space-x-3 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
              <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <span className="text-white">Citation frequency</span>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
              <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <span className="text-white">Topical authority strength</span>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
              <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <span className="text-white">Structured data readiness</span>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
              <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <span className="text-white">Content extractability</span>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 md:col-span-2 md:w-1/2 md:mx-auto">
              <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <span className="text-white">AI answer alignment</span>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 max-w-md mx-auto">
            <div className="text-center">
              <p className="text-slate-400 mb-4">What's your score?</p>
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-400">0-40</div>
                  <p className="text-xs text-slate-500">Invisible</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400">41-70</div>
                  <p className="text-xs text-slate-500">At Risk</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-400">71-100</div>
                  <p className="text-xs text-slate-500">Visible</p>
                </div>
              </div>
              <p className="text-slate-300">Most sites don't know they're invisible until it's too late.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Stop Losing Customers to AI Blindspots
            </h2>
            <p className="text-lg text-slate-400">
              See exactly where you're invisible — and how to fix it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl hover:border-slate-600 transition-colors">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">AI Visibility Scoring</h3>
              <p className="text-slate-400 text-sm">
                Measure how discoverable your website is across major AI platforms.
              </p>
            </div>

            <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl hover:border-slate-600 transition-colors">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Citation Tracking</h3>
              <p className="text-slate-400 text-sm">
                See which pages AI assistants reference — and which they ignore.
              </p>
            </div>

            <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl hover:border-slate-600 transition-colors">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Competitor Analysis</h3>
              <p className="text-slate-400 text-sm">
                Identify competitors being cited instead of you.
              </p>
            </div>

            <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl hover:border-slate-600 transition-colors">
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Actionable Insights</h3>
              <p className="text-slate-400 text-sm">
                Step-by-step guidance to improve AI discoverability.
              </p>
            </div>

            <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl hover:border-slate-600 transition-colors">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-4">
                <LineChart className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Progress Monitoring</h3>
              <p className="text-slate-400 text-sm">
                Track improvements as you optimize your content.
              </p>
            </div>

            <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl hover:border-slate-600 transition-colors">
              <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Branded Reports</h3>
              <p className="text-slate-400 text-sm">
                Generate professional AI visibility reports for stakeholders or clients.
              </p>
            </div>

            <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl hover:border-slate-600 transition-colors md:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Multi-Provider Testing</h3>
              <p className="text-slate-400 text-sm">
                Test visibility across multiple AI engines with consistent prompts.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Who Is This For Section */}
      <div className="py-20 border-t border-slate-800 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Is This Happening to You?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="w-16 h-16 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <UserCircle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Founders & Startups</h3>
              <p className="text-slate-400">
                "Why do AI assistants recommend our competitors but never mention us?"
              </p>
            </div>

            <div className="text-center p-6 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="w-16 h-16 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Marketing Teams</h3>
              <p className="text-slate-400">
                "Our SEO is great but traffic is dropping. Where are our customers going?"
              </p>
            </div>

            <div className="text-center p-6 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="w-16 h-16 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Agencies & Consultants</h3>
              <p className="text-slate-400">
                "My clients ask about AI search and I have no idea how to help them."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="py-20 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            How Many Customers Did You Lose Today?
          </h2>
          <p className="text-xl text-slate-400 mb-4">
            Every question asked to AI is a customer who skipped Google entirely.
          </p>
          <p className="text-lg text-slate-300 mb-4">
            If AI didn't mention you, that customer is already gone.
          </p>
          <p className="text-lg text-red-400 font-semibold mb-8">
            This is happening right now. Not next year. Today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <button
              onClick={() => { window.location.href = '/free-report'; }}
              className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white text-lg font-semibold rounded-xl transition-all shadow-lg flex items-center space-x-2"
            >
              <span>Find Out If You're Being Cited</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col items-center gap-2 text-slate-400 text-sm">
            <span>Takes 30 seconds. No credit card.</span>
            <span>Stop guessing. Start knowing.</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col items-center md:items-start space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Search className="w-4 h-4 text-white" />
                </div>
                <span className="text-slate-400 text-sm">© 2025 LLM Navigator</span>
              </div>
              <p className="text-slate-500 text-xs">LLM Navigator is an AI visibility platform created by Convologix.</p>
            </div>

            <div className="flex items-center space-x-6 text-slate-400 text-sm">
              <a href="/blog" className="hover:text-white transition-colors">
                Blog
              </a>
              <a href="#pricing" onClick={(e) => { e.preventDefault(); window.location.hash = '#pricing'; }} className="hover:text-white transition-colors">
                Pricing
              </a>
              <a href="#privacy" onClick={(e) => { e.preventDefault(); window.location.hash = '#privacy'; }} className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#terms" onClick={(e) => { e.preventDefault(); window.location.hash = '#terms'; }} className="hover:text-white transition-colors">
                Terms
              </a>
              <a href="#contact" onClick={(e) => { e.preventDefault(); window.location.hash = '#contact'; }} className="hover:text-white transition-colors">
                Contact
              </a>
              <a href="#api-docs" onClick={(e) => { e.preventDefault(); window.location.hash = '#api-docs'; }} className="hover:text-white transition-colors">
                API
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
