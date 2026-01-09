import React, { useState } from 'react';
import { ArrowLeft, Key, Copy, CheckCircle, Code, Terminal, Book } from 'lucide-react';

export default function ApiDocs() {
  const [copiedExample, setCopiedExample] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedExample(id);
    setTimeout(() => setCopiedExample(null), 2000);
  };

  const baseUrl = 'https://jgkdzaoajbzmuuajpndv.supabase.co/functions/v1/api';

  const examples = {
    analyze: `curl -X POST ${baseUrl}/analyze \\
  -H "Authorization: Bearer llm_sk_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com",
    "prompts": ["best project management software", "top PM tools 2024"],
    "brandName": "Example Corp",
    "providers": ["perplexity", "openai", "anthropic"]
  }'`,
    listAnalyses: `curl ${baseUrl}/analyses \\
  -H "Authorization: Bearer llm_sk_your_api_key"`,
    getAnalysis: `curl ${baseUrl}/analyses/api-1234567890-abc123 \\
  -H "Authorization: Bearer llm_sk_your_api_key"`,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={() => window.location.hash = '#account'}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Account</span>
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Book className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">API Documentation</h1>
              <p className="text-gray-600">Programmatic access to LLM Navigator</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Authentication */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Key className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">Authentication</h2>
          </div>

          <p className="text-gray-600 mb-4">
            All API requests require authentication via Bearer token. Include your API key in the
            Authorization header:
          </p>

          <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-100">
            Authorization: Bearer llm_sk_your_api_key
          </div>

          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> API access is available for Enterprise plan users only.
              Generate your API key in{' '}
              <a href="#account" className="text-indigo-600 hover:underline">
                Account Settings
              </a>.
            </p>
          </div>
        </section>

        {/* Rate Limits */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Rate Limits</h2>

          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Monthly analyses</span>
              <span className="font-medium text-gray-900">400 requests/month</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Rate limit</span>
              <span className="font-medium text-gray-900">10 requests/minute</span>
            </div>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            Rate limit headers are included in all responses:
            <code className="ml-2 text-xs bg-gray-100 px-1 py-0.5 rounded">X-RateLimit-Remaining</code>
          </p>
        </section>

        {/* Endpoints */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Terminal className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">Endpoints</h2>
          </div>

          {/* POST /analyze */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-3">
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded">POST</span>
              <code className="text-lg font-mono">/api/analyze</code>
            </div>

            <p className="text-gray-600 mb-4">
              Run an AEO analysis on a website. Crawls the website and checks if it's cited by AI providers.
            </p>

            <h4 className="font-medium text-gray-900 mb-2">Request Body</h4>
            <div className="bg-gray-50 rounded-lg p-4 mb-4 overflow-x-auto">
              <pre className="text-sm text-gray-800">{`{
  "url": "https://example.com",      // Required: Website to analyze
  "prompts": [                       // Required: 1-10 search queries to test
    "best project management software",
    "top PM tools 2024"
  ],
  "brandName": "Example Corp",       // Optional: Brand name to look for
  "providers": [                     // Optional: AI providers to query
    "perplexity",                    // Default: all three
    "openai",
    "anthropic"
  ]
}`}</pre>
            </div>

            <h4 className="font-medium text-gray-900 mb-2">Example</h4>
            <div className="relative">
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-100 overflow-x-auto">
                <pre>{examples.analyze}</pre>
              </div>
              <button
                onClick={() => copyToClipboard(examples.analyze, 'analyze')}
                className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white"
              >
                {copiedExample === 'analyze' ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            <h4 className="font-medium text-gray-900 mt-4 mb-2">Response</h4>
            <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-gray-800">{`{
  "success": true,
  "data": {
    "id": "api-1234567890-abc123",
    "url": "https://example.com",
    "overallCitationRate": 33.3,
    "citationResults": [
      {
        "prompt": "best project management software",
        "provider": "perplexity",
        "isCited": true,
        "citationContext": "...Example Corp is mentioned as...",
        "competitorsCited": [
          { "domain": "asana.com", "position": 1 }
        ]
      }
    ],
    "crawlData": {
      "title": "Example Corp - Project Management",
      "pagesAnalyzed": 6,
      "schemaTypes": ["Organization", "WebPage"]
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}`}</pre>
            </div>
          </div>

          {/* GET /analyses */}
          <div className="mb-8 pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-2 mb-3">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">GET</span>
              <code className="text-lg font-mono">/api/analyses</code>
            </div>

            <p className="text-gray-600 mb-4">
              List your past analyses with pagination.
            </p>

            <h4 className="font-medium text-gray-900 mb-2">Query Parameters</h4>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="space-y-2 text-sm">
                <div><code className="text-indigo-600">limit</code> - Number of results (default: 20, max: 100)</div>
                <div><code className="text-indigo-600">offset</code> - Skip first N results (default: 0)</div>
              </div>
            </div>

            <h4 className="font-medium text-gray-900 mb-2">Example</h4>
            <div className="relative">
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-100 overflow-x-auto">
                <pre>{examples.listAnalyses}</pre>
              </div>
              <button
                onClick={() => copyToClipboard(examples.listAnalyses, 'list')}
                className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white"
              >
                {copiedExample === 'list' ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* GET /analyses/:id */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-2 mb-3">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">GET</span>
              <code className="text-lg font-mono">/api/analyses/:id</code>
            </div>

            <p className="text-gray-600 mb-4">
              Get a specific analysis by ID.
            </p>

            <h4 className="font-medium text-gray-900 mb-2">Example</h4>
            <div className="relative">
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-100 overflow-x-auto">
                <pre>{examples.getAnalysis}</pre>
              </div>
              <button
                onClick={() => copyToClipboard(examples.getAnalysis, 'get')}
                className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white"
              >
                {copiedExample === 'get' ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Error Codes */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Error Codes</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-gray-900">Status</th>
                  <th className="text-left py-2 font-medium text-gray-900">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-2"><code className="text-red-600">400</code></td>
                  <td className="py-2 text-gray-600">Bad Request - Invalid parameters</td>
                </tr>
                <tr>
                  <td className="py-2"><code className="text-red-600">401</code></td>
                  <td className="py-2 text-gray-600">Unauthorized - Invalid or missing API key</td>
                </tr>
                <tr>
                  <td className="py-2"><code className="text-red-600">403</code></td>
                  <td className="py-2 text-gray-600">Forbidden - Enterprise plan required</td>
                </tr>
                <tr>
                  <td className="py-2"><code className="text-red-600">404</code></td>
                  <td className="py-2 text-gray-600">Not Found - Resource doesn't exist</td>
                </tr>
                <tr>
                  <td className="py-2"><code className="text-red-600">429</code></td>
                  <td className="py-2 text-gray-600">Too Many Requests - Rate limit exceeded</td>
                </tr>
                <tr>
                  <td className="py-2"><code className="text-red-600">500</code></td>
                  <td className="py-2 text-gray-600">Internal Server Error</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Error Response Format</h4>
            <pre className="text-sm text-gray-800">{`{
  "success": false,
  "error": "Error message describing what went wrong"
}`}</pre>
          </div>
        </section>

        {/* Support */}
        <section className="bg-indigo-50 border border-indigo-100 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-indigo-900 mb-2">Need Help?</h2>
          <p className="text-indigo-800">
            Contact our support team at{' '}
            <a href="mailto:support@llmnavigator.com" className="underline">
              support@llmnavigator.com
            </a>{' '}
            for API assistance.
          </p>
        </section>
      </div>
    </div>
  );
}
