import React from 'react';
import { Search, TrendingUp, Target, Zap, CheckCircle, ArrowRight, BarChart3, Users, Shield, LogIn, Mail } from 'lucide-react';

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
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-8">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-blue-300 text-sm font-medium">Answer Engine Optimization</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Dominate AI Search
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                Before Your Competitors
              </span>
            </h1>

            <p className="text-xl text-slate-400 mb-8 max-w-3xl mx-auto leading-relaxed">
              Optimize your content for AI-powered search engines like ChatGPT, Claude, and Perplexity.
              Get discovered when customers ask AI assistants about your industry.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button
                onClick={onGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-lg font-semibold rounded-xl transition-all shadow-2xl flex items-center space-x-2"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => { window.location.href = '/free-report'; }}
                className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white text-lg font-semibold rounded-xl transition-all border border-slate-600 flex items-center space-x-2"
              >
                <span>Get Free Report</span>
              </button>
            </div>

            {/* Social Proof */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Section */}
      <div className="py-20 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              The Search Landscape Has Changed Forever
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              While you've been optimizing for Google, your customers have moved to AI assistants.
              When they ask "What's the best marketing automation tool?", are you in the answer?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="w-16 h-16 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">AI Search is Growing 300%</h3>
              <p className="text-slate-400">
                Millions of users now get answers from ChatGPT, Claude, and other AI assistants instead of traditional search.
              </p>
            </div>

            <div className="text-center p-6 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="w-16 h-16 bg-yellow-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Your Content is Invisible</h3>
              <p className="text-slate-400">
                Traditional SEO doesn't work for AI search. Your perfectly optimized content might never be mentioned.
              </p>
            </div>

            <div className="text-center p-6 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="w-16 h-16 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Competitors Are Winning</h3>
              <p className="text-slate-400">
                Early adopters are already optimizing for AI search and capturing customers you don't know you're losing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Solution Section */}
      <div className="py-20 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Introducing Answer Engine Optimization
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              One of the first platforms designed specifically to optimize your content for AI-powered search engines.
              Get discovered, get mentioned, get customers.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">How It Works</h3>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Analyze Your Content</h4>
                    <p className="text-slate-400">We scan your website and check if AI assistants are citing you when users ask relevant questions.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Discover Competitors</h4>
                    <p className="text-slate-400">See exactly who IS getting cited by AI assistants for queries in your industry.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Get Recommendations</h4>
                    <p className="text-slate-400">Receive specific, actionable recommendations to improve your AI search visibility.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">4</div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Track Progress</h4>
                    <p className="text-slate-400">Monitor your citation rate over time and see how optimizations impact your visibility.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
              <div className="text-center mb-6">
                <h4 className="text-lg font-semibold text-slate-300 mb-2">AI Visibility Score</h4>
                <div className="text-5xl font-bold text-blue-400 mb-2">73<span className="text-2xl text-slate-500">/100</span></div>
                <p className="text-slate-400">Above average - room for improvement</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Content Clarity</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-2 bg-slate-700 rounded-full">
                      <div className="w-16 h-2 bg-emerald-500 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium text-slate-300">80</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Schema Markup</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-2 bg-slate-700 rounded-full">
                      <div className="w-14 h-2 bg-yellow-500 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium text-slate-300">70</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Structured Data</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-2 bg-slate-700 rounded-full">
                      <div className="w-10 h-2 bg-red-500 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium text-slate-300">50</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Citation Rate</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-2 bg-slate-700 rounded-full">
                      <div className="w-[72px] h-2 bg-emerald-500 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium text-slate-300">90</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onGetStarted}
                className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-lg transition-colors"
              >
                Analyze My Website
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Everything You Need to Win AI Search
            </h2>
            <p className="text-xl text-slate-400">
              Comprehensive tools to analyze, optimize, and dominate AI-powered search results
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl hover:border-slate-600 transition-colors">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">AI Visibility Score</h3>
              <p className="text-slate-400 text-sm">
                Get a comprehensive score predicting how well your content performs in AI search results.
              </p>
            </div>

            <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl hover:border-slate-600 transition-colors">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Competitor Analysis</h3>
              <p className="text-slate-400 text-sm">
                See who's getting cited by AI assistants and learn from their strategies.
              </p>
            </div>

            <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl hover:border-slate-600 transition-colors">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Actionable Insights</h3>
              <p className="text-slate-400 text-sm">
                Get specific recommendations to improve your AI search visibility.
              </p>
            </div>

            <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl hover:border-slate-600 transition-colors">
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Progress Tracking</h3>
              <p className="text-slate-400 text-sm">
                Monitor improvements and see how optimizations impact your visibility over time.
              </p>
            </div>

            <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl hover:border-slate-600 transition-colors">
              <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Branded Reports</h3>
              <p className="text-slate-400 text-sm">
                Generate PDF reports with your logo to share with clients or stakeholders.
              </p>
            </div>

            <div className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl hover:border-slate-600 transition-colors">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Multi-Provider Testing</h3>
              <p className="text-slate-400 text-sm">
                Test against ChatGPT, Claude, and Perplexity to ensure broad AI visibility.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Dominate AI Search?
          </h2>
          <p className="text-xl text-slate-400 mb-8">
            Join the early adopters who are already winning customers through AI-powered search engines.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <button
              onClick={onGetStarted}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-lg font-semibold rounded-xl transition-all shadow-lg flex items-center space-x-2"
            >
              <span>Start Your Free Trial</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => { window.location.hash = '#contact'; }}
              className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white text-lg font-semibold rounded-xl transition-all border border-slate-600 flex items-center space-x-2"
            >
              <Mail className="w-5 h-5" />
              <span>Contact Us</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-6 text-slate-400 text-sm">
            <span>✓ 14-day free trial</span>
            <span>✓ No credit card required</span>
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
              <p className="text-slate-500 text-xs">LLM Navigator is an AI search visibility platform created by Convologix.</p>
            </div>

            <div className="flex items-center space-x-6 text-slate-400 text-sm">
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
