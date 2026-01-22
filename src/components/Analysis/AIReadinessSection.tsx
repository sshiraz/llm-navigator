import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, ExternalLink, Bot, Shield, ShoppingCart } from 'lucide-react';
import { AIReadinessAnalysis } from '../../types/crawl';

interface AIReadinessSectionProps {
  aiReadiness: AIReadinessAnalysis;
}

export default function AIReadinessSection({ aiReadiness }: AIReadinessSectionProps) {
  const getStatusColor = (status: 'good' | 'warning' | 'critical') => {
    switch (status) {
      case 'good': return 'bg-emerald-900/30 border-emerald-700 text-emerald-400';
      case 'warning': return 'bg-yellow-900/30 border-yellow-700 text-yellow-400';
      case 'critical': return 'bg-red-900/30 border-red-700 text-red-400';
    }
  };

  const getStatusIcon = (status: 'good' | 'warning' | 'critical') => {
    switch (status) {
      case 'good': return <CheckCircle className="w-6 h-6 text-emerald-400" />;
      case 'warning': return <AlertTriangle className="w-6 h-6 text-yellow-400" />;
      case 'critical': return <XCircle className="w-6 h-6 text-red-400" />;
    }
  };

  const getCrawlerStatusIcon = (status: 'allowed' | 'blocked' | 'not_specified') => {
    switch (status) {
      case 'allowed': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'blocked': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'not_specified': return <AlertTriangle className="w-4 h-4 text-slate-400" />;
    }
  };

  const getCrawlerStatusText = (status: 'allowed' | 'blocked' | 'not_specified') => {
    switch (status) {
      case 'allowed': return 'Allowed';
      case 'blocked': return 'Blocked';
      case 'not_specified': return 'Not specified';
    }
  };

  const getCrawlerStatusColor = (status: 'allowed' | 'blocked' | 'not_specified') => {
    switch (status) {
      case 'allowed': return 'text-emerald-400';
      case 'blocked': return 'text-red-400';
      case 'not_specified': return 'text-slate-400';
    }
  };

  // Separate search crawlers from training crawlers
  const searchCrawlers = aiReadiness.robotsTxt.crawlers.filter(c => c.isSearchCrawler);
  const trainingCrawlers = aiReadiness.robotsTxt.crawlers.filter(c => !c.isSearchCrawler);

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Bot className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">AI Platform Readiness</h3>
        </div>
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(aiReadiness.overallStatus)}`}>
          {getStatusIcon(aiReadiness.overallStatus)}
          <span className="font-medium capitalize">{aiReadiness.overallStatus}</span>
        </div>
      </div>

      {/* Issues Alert */}
      {aiReadiness.issues.length > 0 && (
        <div className={`mb-6 p-4 rounded-lg border ${
          aiReadiness.overallStatus === 'critical' ? 'bg-red-900/20 border-red-700' :
          aiReadiness.overallStatus === 'warning' ? 'bg-yellow-900/20 border-yellow-700' :
          'bg-blue-900/20 border-blue-700'
        }`}>
          <h4 className="font-medium text-white mb-2">
            {aiReadiness.overallStatus === 'critical' ? 'Critical Issues Found' :
             aiReadiness.overallStatus === 'warning' ? 'Recommendations' : 'Notes'}
          </h4>
          <ul className="space-y-1">
            {aiReadiness.issues.map((issue, index) => (
              <li key={index} className="flex items-start space-x-2 text-sm">
                <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                  aiReadiness.overallStatus === 'critical' ? 'text-red-400' :
                  aiReadiness.overallStatus === 'warning' ? 'text-yellow-400' : 'text-blue-400'
                }`} />
                <span className="text-slate-300">{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* robots.txt Analysis */}
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="w-5 h-5 text-indigo-400" />
            <h4 className="font-semibold text-white">robots.txt AI Crawler Status</h4>
          </div>

          {!aiReadiness.robotsTxt.exists ? (
            <div className="text-sm text-yellow-400 mb-4">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              No robots.txt found - crawlers default to allowed
            </div>
          ) : null}

          {/* Search Crawlers - Most Important */}
          <div className="mb-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Search Crawlers (Important for visibility)</p>
            <div className="space-y-2">
              {searchCrawlers.map((crawler) => (
                <div key={crawler.crawler} className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
                  <div className="flex items-center space-x-2">
                    {getCrawlerStatusIcon(crawler.status)}
                    <div>
                      <span className="text-sm font-medium text-white">{crawler.crawler}</span>
                      <span className="text-xs text-slate-500 ml-2">({crawler.description})</span>
                    </div>
                  </div>
                  <span className={`text-xs font-medium ${getCrawlerStatusColor(crawler.status)}`}>
                    {getCrawlerStatusText(crawler.status)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Training Crawlers */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Training Crawlers (Optional to block)</p>
            <div className="space-y-2">
              {trainingCrawlers.map((crawler) => (
                <div key={crawler.crawler} className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
                  <div className="flex items-center space-x-2">
                    {getCrawlerStatusIcon(crawler.status)}
                    <div>
                      <span className="text-sm font-medium text-white">{crawler.crawler}</span>
                      <span className="text-xs text-slate-500 ml-2">({crawler.description})</span>
                    </div>
                  </div>
                  <span className={`text-xs font-medium ${getCrawlerStatusColor(crawler.status)}`}>
                    {getCrawlerStatusText(crawler.status)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Platform Recommendations */}
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center space-x-2 mb-4">
            <ShoppingCart className="w-5 h-5 text-purple-400" />
            <h4 className="font-semibold text-white">Platform Registrations</h4>
          </div>

          {aiReadiness.isEcommerce && (
            <div className="mb-4 p-2 bg-purple-900/20 border border-purple-700 rounded text-sm text-purple-300">
              <ShoppingCart className="w-4 h-4 inline mr-1" />
              E-commerce site detected
            </div>
          )}

          <div className="space-y-3">
            {aiReadiness.platformRecommendations.map((rec) => (
              <div
                key={rec.platform}
                className={`p-3 rounded-lg border ${
                  rec.applicable
                    ? 'bg-blue-900/20 border-blue-700'
                    : 'bg-slate-800/30 border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className={`font-medium ${rec.applicable ? 'text-white' : 'text-slate-400'}`}>
                    {rec.platform}
                  </span>
                  {rec.applicable && (
                    <a
                      href={rec.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300"
                    >
                      <span>Register</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-1">{rec.description}</p>
                <p className={`text-xs ${rec.applicable ? 'text-blue-300' : 'text-slate-500'}`}>
                  {rec.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
