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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Navigation Header */}
      <nav className="relative z-10 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-6">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Search className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-xl font-bold text-white">LLM Navigator</h1>
            <p className="text-xs text-blue-200">Answer Engine Optimization</p>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => {
              window.location.hash = '#contact';
              window.location.reload();
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all border border-white/20"
          >
            <Mail className="w-4 h-4" />
            <span>Contact Us</span>
          </button>
          
          <button 
            onClick={handleSignIn}
            className="flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all border border-white/20"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-32">
          <div className="text-center">
            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Dominate AI Search
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Before Your Competitors
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-4xl mx-auto leading-relaxed">
              One of the first platforms to optimize your content for AI-powered search engines like ChatGPT, Claude, and Gemini. 
              Get discovered when customers ask AI assistants about your industry.
            </p>

            {/* CTA Button */}
            <div className="flex justify-center mb-12">
              <button 
                onClick={onGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-2xl flex items-center space-x-2"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center space-x-8 text-blue-200">
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
      <div className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              The Search Landscape Has Changed Forever
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              While you've been optimizing for Google, your customers have moved to AI assistants. 
              When they ask "What's the best marketing automation tool?", are you in the answer?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Search is Growing 300%</h3>
              <p className="text-gray-600">
                Millions of users now get answers from ChatGPT, Claude, and other AI assistants instead of traditional search engines.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Your Content is Invisible</h3>
              <p className="text-gray-600">
                Traditional SEO doesn't work for AI search. Your perfectly optimized content might never be mentioned by AI assistants.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Competitors Are Winning</h3>
              <p className="text-gray-600">
                Early adopters are already optimizing for AI search and capturing customers you don't even know you're losing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Solution Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Introducing Answer Engine Optimization (AEO)
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              LLM Navigator is one of the first platforms designed specifically to optimize your content for AI-powered search engines. 
              Get discovered, get mentioned, get customers.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h3>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Analyze Your Content</h4>
                    <p className="text-gray-600">We scan your website and score it across 5 key metrics that AI models use to understand and rank content.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Compare with Competitors</h4>
                    <p className="text-gray-600">See exactly how you stack up against competitors and identify the gaps that are costing you AI search visibility.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Get Actionable Recommendations</h4>
                    <p className="text-gray-600">Receive specific, prioritized recommendations to improve your LLM Navigator Score and AI search rankings.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Track Your Progress</h4>
                    <p className="text-gray-600">Monitor your improvements and see how your optimizations impact your AI search visibility over time.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <div className="text-center mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Your LLM Navigator Score</h4>
                <div className="text-5xl font-bold text-blue-600 mb-2">73<span className="text-2xl text-gray-400">/100</span></div>
                <p className="text-gray-600">Above average - room for improvement</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Content Clarity</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full">
                      <div className="w-16 h-2 bg-emerald-500 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium">80</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Semantic Richness</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full">
                      <div className="w-14 h-2 bg-yellow-500 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium">70</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Structured Data</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full">
                      <div className="w-10 h-2 bg-red-500 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium">50</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Natural Language</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full">
                      <div className="w-18 h-2 bg-emerald-500 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium">90</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Keyword Relevance</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full">
                      <div className="w-15 h-2 bg-yellow-500 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium">75</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={onGetStarted}
                className="w-full mt-6 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Everything You Need to Win AI Search
            </h2>
            <p className="text-xl text-gray-600">
              Comprehensive tools to analyze, optimize, and dominate AI-powered search results
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <BarChart3 className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">LLM Navigator Score</h3>
              <p className="text-gray-600">
                Get a comprehensive 0-100 score that predicts how well your content will perform in AI search results.
              </p>
            </div>

            <div className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <Users className="w-12 h-12 text-indigo-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Competitor Analysis</h3>
              <p className="text-gray-600">
                Compare your performance against competitors and discover the strategies they're using to win AI search.
              </p>
            </div>

            <div className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <Target className="w-12 h-12 text-emerald-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Actionable Recommendations</h3>
              <p className="text-gray-600">
                Get specific, prioritized recommendations to improve your AI search visibility and outrank competitors.
              </p>
            </div>

            <div className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <TrendingUp className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Progress Tracking</h3>
              <p className="text-gray-600">
                Monitor your improvements over time and see how your optimizations impact your AI search visibility.
              </p>
            </div>

            <div className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <Shield className="w-12 h-12 text-red-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Professional Reports</h3>
              <p className="text-gray-600">
                Generate branded PDF reports you can share with clients, stakeholders, or your team.
              </p>
            </div>

            <div className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <Search className="w-12 h-12 text-yellow-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Detailed Metrics</h3>
              <p className="text-gray-600">
                Deep dive into 5 core metrics that determine your success in AI-powered search engines.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-20 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Dominate AI Search?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join the early adopters who are already winning customers through AI-powered search engines.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <button 
              onClick={onGetStarted}
              className="px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-lg flex items-center space-x-2 mb-4 sm:mb-0"
            >
              <span>Start Your Free Trial</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <button 
              onClick={() => {
                window.location.hash = '#contact';
                window.location.reload();
              }}
              className="px-8 py-4 bg-transparent border-2 border-white text-white text-lg font-semibold rounded-xl hover:bg-white/10 transition-colors shadow-lg flex items-center space-x-2"
            >
              <Mail className="w-5 h-5" />
              <span>Email Us</span>
            </button>
            
            <div className="text-blue-100 text-sm">
              <div>✓ 14-day free trial</div>
              <div>✓ No credit card required</div>
            </div>
          </div>
          
          {/* Footer Links */}
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <div className="text-blue-200 text-sm space-x-6">
              <a 
                href="#privacy"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.hash = '#privacy';
                  window.location.reload();
                }}
                className="hover:text-white transition-colors"
              >
                Privacy Policy
              </a>
              <a 
                href="#terms"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.hash = '#terms';
                  window.location.reload();
                }}
                className="hover:text-white transition-colors"
              >
                Terms of Service
              </a>
              <a 
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.hash = '#contact';
                  window.location.reload();
                }}
                className="hover:text-white transition-colors"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}