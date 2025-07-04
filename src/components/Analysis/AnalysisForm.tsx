import React, { useState } from 'react';
import { Globe, Target, Sparkles, ArrowRight } from 'lucide-react';
import { KeywordSuggestion } from '../../types';
import { mockKeywordSuggestions } from '../../utils/mockData';

interface AnalysisFormProps {
  onAnalyze: (website: string, keywords: string[]) => void;
}

export default function AnalysisForm({ onAnalyze }: AnalysisFormProps) {
  const [website, setWebsite] = useState('');
  const [keywords, setKeywords] = useState('');
  const [industryDescription, setIndustryDescription] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateSuggestions = async () => {
    if (!industryDescription.trim()) return;
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setShowSuggestions(true);
      setIsLoading(false);
    }, 1500);
  };

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords(prev => 
      prev.includes(keyword) 
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const keywordList = keywords ? keywords.split(',').map(k => k.trim()) : selectedKeywords;
    if (website && keywordList.length > 0) {
      onAnalyze(website, keywordList);
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty >= 80) return 'bg-red-100 text-red-800';
    if (difficulty >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-emerald-100 text-emerald-800';
  };

  const getOpportunityColor = (opportunity: number) => {
    if (opportunity >= 80) return 'bg-emerald-100 text-emerald-800';
    if (opportunity >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

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

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Website Input */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Website URL</h3>
              <p className="text-sm text-gray-600">Enter the website you want to analyze</p>
            </div>
          </div>
          
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Keywords Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Target Keywords</h3>
              <p className="text-sm text-gray-600">
                Enter keywords manually or use AI to generate suggestions
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manual Keywords (comma-separated)
              </label>
              <textarea
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="marketing automation, lead generation, email marketing"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe Your Industry/Topic for AI Suggestions
              </label>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={industryDescription}
                  onChange={(e) => setIndustryDescription(e.target.value)}
                  placeholder="B2B SaaS marketing platform for small businesses"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleGenerateSuggestions}
                  disabled={!industryDescription.trim() || isLoading}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isLoading ? 'Generating...' : 'Generate'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Keyword Suggestions */}
        {showSuggestions && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              AI-Generated Keyword Suggestions
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Select the keywords you want to target in your analysis
            </p>
            
            <div className="grid gap-3">
              {mockKeywordSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedKeywords.includes(suggestion.keyword)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleKeyword(suggestion.keyword)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-gray-900">
                          {suggestion.keyword}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {suggestion.intent}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 text-xs rounded ${getDifficultyColor(suggestion.difficulty)}`}>
                        Difficulty: {suggestion.difficulty}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded ${getOpportunityColor(suggestion.opportunity)}`}>
                        Opportunity: {suggestion.opportunity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {selectedKeywords.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Selected keywords: <strong>{selectedKeywords.join(', ')}</strong>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={!website || (!keywords && selectedKeywords.length === 0)}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center space-x-3 transition-all"
          >
            <span>Start LLM Analysis</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}