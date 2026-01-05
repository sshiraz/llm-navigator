import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withRateLimit, RATE_LIMITS } from "../_shared/rateLimiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Types
interface CompetitorCitation {
  domain: string;
  url?: string;
  context: string;
  position: number;
}

interface CitationResult {
  promptId: string;
  prompt: string;
  provider: 'openai' | 'anthropic' | 'perplexity';
  modelUsed: string;
  response: string;
  isCited: boolean;
  citationContext?: string;
  competitorsCited: CompetitorCitation[];
  timestamp: string;
  tokensUsed: number;
  cost: number;
}

interface CheckCitationsRequest {
  prompts: { id: string; text: string }[];
  website: string;
  brandName?: string;
  providers: ('openai' | 'anthropic' | 'perplexity')[];
}

// Cost per 1K tokens (approximate)
const COSTS = {
  openai: { input: 0.01, output: 0.03 },      // GPT-4o
  anthropic: { input: 0.003, output: 0.015 }, // Claude 3 Haiku (cost-effective)
  perplexity: { input: 0.001, output: 0.001 } // Perplexity Sonar
};

// Extract domain from URL
function extractDomain(url: string): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^www\./, '').split('/')[0];
  }
}

// Check if response mentions the target site or brand
function checkCitation(
  response: string,
  website: string,
  brandName?: string
): { isCited: boolean; context?: string } {
  const lowerResponse = response.toLowerCase();
  const domain = extractDomain(website).toLowerCase();

  // Check for domain mention
  if (lowerResponse.includes(domain)) {
    const index = lowerResponse.indexOf(domain);
    const start = Math.max(0, index - 100);
    const end = Math.min(response.length, index + domain.length + 100);
    return {
      isCited: true,
      context: response.substring(start, end).trim()
    };
  }

  // Check for brand name mention
  if (brandName) {
    const lowerBrand = brandName.toLowerCase();
    if (lowerResponse.includes(lowerBrand)) {
      const index = lowerResponse.indexOf(lowerBrand);
      const start = Math.max(0, index - 100);
      const end = Math.min(response.length, index + lowerBrand.length + 100);
      return {
        isCited: true,
        context: response.substring(start, end).trim()
      };
    }
  }

  return { isCited: false };
}

// Extract competitor domains/URLs from response
function extractCompetitors(
  response: string,
  userDomain: string,
  sources?: { url: string; title?: string }[]
): CompetitorCitation[] {
  const competitors: CompetitorCitation[] = [];
  const userDomainLower = userDomain.toLowerCase();

  // If we have explicit sources (Perplexity), use those
  if (sources && sources.length > 0) {
    sources.forEach((source, index) => {
      const domain = extractDomain(source.url);
      if (domain.toLowerCase() !== userDomainLower) {
        competitors.push({
          domain,
          url: source.url,
          context: source.title || `Source ${index + 1}`,
          position: index + 1
        });
      }
    });
    return competitors;
  }

  // Otherwise, try to extract URLs from response text
  const urlRegex = /https?:\/\/[^\s<>"']+/gi;
  const urls = response.match(urlRegex) || [];

  urls.forEach((url, index) => {
    try {
      const domain = extractDomain(url);
      if (domain.toLowerCase() !== userDomainLower &&
          !competitors.some(c => c.domain === domain)) {
        // Find context around the URL
        const urlIndex = response.indexOf(url);
        const start = Math.max(0, urlIndex - 50);
        const end = Math.min(response.length, urlIndex + url.length + 50);

        competitors.push({
          domain,
          url,
          context: response.substring(start, end).trim(),
          position: index + 1
        });
      }
    } catch {
      // Invalid URL, skip
    }
  });

  // Also look for common domain patterns mentioned without full URLs
  const domainPatterns = response.match(/\b[a-zA-Z0-9][-a-zA-Z0-9]*\.(com|org|net|io|co|ai)\b/gi) || [];
  domainPatterns.forEach((domain, index) => {
    const cleanDomain = domain.toLowerCase();
    if (cleanDomain !== userDomainLower &&
        !competitors.some(c => c.domain.toLowerCase() === cleanDomain)) {
      const domainIndex = response.toLowerCase().indexOf(cleanDomain);
      const start = Math.max(0, domainIndex - 50);
      const end = Math.min(response.length, domainIndex + cleanDomain.length + 50);

      competitors.push({
        domain: cleanDomain,
        context: response.substring(start, end).trim(),
        position: competitors.length + 1
      });
    }
  });

  return competitors.slice(0, 10); // Limit to top 10
}

// Query OpenAI
async function queryOpenAI(
  prompt: string,
  apiKey: string
): Promise<{ response: string; tokensUsed: number; model: string }> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Provide informative, factual answers. When relevant, mention specific websites, companies, or resources that could help the user.'
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return {
    response: data.choices[0]?.message?.content || '',
    tokensUsed: data.usage?.total_tokens || 0,
    model: data.model || 'gpt-4o'
  };
}

// Query Anthropic
async function queryAnthropic(
  prompt: string,
  apiKey: string
): Promise<{ response: string; tokensUsed: number; model: string }> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      system: 'You are a helpful assistant. Provide informative, factual answers. When relevant, mention specific websites, companies, or resources that could help the user.',
      messages: [
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const inputTokens = data.usage?.input_tokens || 0;
  const outputTokens = data.usage?.output_tokens || 0;

  return {
    response: data.content[0]?.text || '',
    tokensUsed: inputTokens + outputTokens,
    model: data.model || 'claude-3-haiku-20240307'
  };
}

// Query Perplexity
async function queryPerplexity(
  prompt: string,
  apiKey: string
): Promise<{ response: string; tokensUsed: number; model: string; sources?: { url: string; title?: string }[] }> {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.7,
      return_citations: true
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Perplexity API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  // Perplexity returns citations in a specific format
  const sources = data.citations?.map((citation: string, index: number) => ({
    url: citation,
    title: `Source ${index + 1}`
  })) || [];

  return {
    response: data.choices[0]?.message?.content || '',
    tokensUsed: data.usage?.total_tokens || 0,
    model: data.model || 'sonar',
    sources
  };
}

// Calculate cost
function calculateCost(
  provider: 'openai' | 'anthropic' | 'perplexity',
  tokensUsed: number
): number {
  const costs = COSTS[provider];
  // Rough estimate: assume 40% input, 60% output tokens
  const inputTokens = tokensUsed * 0.4;
  const outputTokens = tokensUsed * 0.6;

  const cost = (inputTokens / 1000 * costs.input) + (outputTokens / 1000 * costs.output);
  return Math.round(cost * 10000) / 10000; // Round to 4 decimal places
}

// Process a single prompt with a single provider
async function processPrompt(
  promptId: string,
  promptText: string,
  provider: 'openai' | 'anthropic' | 'perplexity',
  website: string,
  brandName: string | undefined,
  apiKeys: Record<string, string>
): Promise<CitationResult> {
  const timestamp = new Date().toISOString();
  const userDomain = extractDomain(website);

  try {
    let result: { response: string; tokensUsed: number; model: string; sources?: { url: string; title?: string }[] };

    switch (provider) {
      case 'openai':
        result = await queryOpenAI(promptText, apiKeys.openai);
        break;
      case 'anthropic':
        result = await queryAnthropic(promptText, apiKeys.anthropic);
        break;
      case 'perplexity':
        result = await queryPerplexity(promptText, apiKeys.perplexity);
        break;
    }

    const citation = checkCitation(result.response, website, brandName);
    const competitors = extractCompetitors(result.response, userDomain, result.sources);
    const cost = calculateCost(provider, result.tokensUsed);

    return {
      promptId,
      prompt: promptText,
      provider,
      modelUsed: result.model,
      response: result.response,
      isCited: citation.isCited,
      citationContext: citation.context,
      competitorsCited: competitors,
      timestamp,
      tokensUsed: result.tokensUsed,
      cost
    };
  } catch (error) {
    console.error(`Error querying ${provider} for prompt "${promptText}":`, error);

    // Return error result
    return {
      promptId,
      prompt: promptText,
      provider,
      modelUsed: 'error',
      response: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      isCited: false,
      competitorsCited: [],
      timestamp,
      tokensUsed: 0,
      cost: 0
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Apply rate limiting (expensive endpoint - AI queries)
  const rateLimit = withRateLimit(req, corsHeaders, RATE_LIMITS.expensive);
  if (!rateLimit.allowed) {
    console.log('Rate limit exceeded for check-citations');
    return rateLimit.response!;
  }

  try {
    const body: CheckCitationsRequest = await req.json();
    const { prompts, website, brandName, providers } = body;

    // Validate input
    if (!prompts || prompts.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "At least one prompt is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (prompts.length > 10) {
      return new Response(
        JSON.stringify({ success: false, error: "Maximum 10 prompts allowed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!website) {
      return new Response(
        JSON.stringify({ success: false, error: "Website URL is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!providers || providers.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "At least one provider is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get API keys from environment
    const apiKeys = {
      openai: Deno.env.get('OPENAI_API_KEY') || '',
      anthropic: Deno.env.get('ANTHROPIC_API_KEY') || '',
      perplexity: Deno.env.get('PERPLEXITY_API_KEY') || ''
    };

    // Validate we have keys for requested providers
    for (const provider of providers) {
      if (!apiKeys[provider]) {
        return new Response(
          JSON.stringify({ success: false, error: `Missing API key for ${provider}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }
    }

    console.log(`Processing ${prompts.length} prompts across ${providers.length} providers`);

    // Process all prompt × provider combinations
    const results: CitationResult[] = [];
    const tasks: Promise<CitationResult>[] = [];

    for (const prompt of prompts) {
      for (const provider of providers) {
        tasks.push(
          processPrompt(
            prompt.id,
            prompt.text,
            provider,
            website,
            brandName,
            apiKeys
          )
        );
      }
    }

    // Execute all in parallel (with some concurrency control)
    const batchSize = 5;
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
    }

    // Calculate totals
    const totalCost = results.reduce((sum, r) => sum + r.cost, 0);
    const totalTokens = results.reduce((sum, r) => sum + r.tokensUsed, 0);
    const citedCount = results.filter(r => r.isCited).length;

    console.log(`Completed: ${citedCount}/${results.length} cited, total cost: $${totalCost.toFixed(4)}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          results,
          summary: {
            totalPrompts: prompts.length,
            totalQueries: results.length,
            citedCount,
            citationRate: results.length > 0 ? (citedCount / results.length) * 100 : 0,
            totalCost: Math.round(totalCost * 10000) / 10000,
            totalTokens
          }
        }
      }),
      { headers: { ...corsHeaders, ...rateLimit.headers, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error('Check citations error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
