import React from 'react';
import { Search, LogIn, Mail, BookOpen, Calendar, ArrowRight } from 'lucide-react';
import { BLOG_POSTS } from './blogIndex';

export default function BlogPage() {
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
          <a href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold text-white">LLM Navigator</h1>
              <p className="text-xs text-slate-400">Answer Engine Optimization</p>
            </div>
          </a>

          {/* Navigation Buttons */}
          <div className="flex items-center space-x-3">
            <a
              href="/free-report"
              className="hidden sm:flex items-center space-x-2 px-4 py-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span>Free Report</span>
            </a>

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
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-6">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span className="text-blue-300 text-sm font-medium">LLM Navigator Blog</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            AI Visibility Insights
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Learn about Answer Engine Optimization, AI citations, and how to make your brand visible in AI-generated answers.
          </p>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="space-y-6">
          {BLOG_POSTS.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No blog posts yet. Check back soon!</p>
            </div>
          ) : (
            BLOG_POSTS.map((post) => (
              <a
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-slate-600 hover:bg-slate-800/70 transition-all group"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                      {post.title}
                    </h2>
                    {post.description && (
                      <p className="text-slate-400 mb-3">{post.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-slate-500">
                      {post.date && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(post.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center text-blue-400 group-hover:text-blue-300 transition-colors">
                    <span className="text-sm font-medium mr-1">Read more</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div className="border-t border-slate-800 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to improve your AI visibility?
          </h2>
          <p className="text-slate-400 mb-6">
            Get a free report showing how AI assistants currently see your brand.
          </p>
          <a
            href="/free-report"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <span>Get Free Report</span>
            <ArrowRight className="w-4 h-4" />
          </a>
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
              <a href="/" className="hover:text-white transition-colors">
                Home
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
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
