import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateApiKey, createErrorResponse, createSuccessResponse } from "../_shared/apiAuth.ts";

// Simple in-memory rate limiter for API
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = { perMinute: 10 };

function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute

  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || userLimit.resetAt < now) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (userLimit.count >= RATE_LIMIT.perMinute) {
    const retryAfter = Math.ceil((userLimit.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  userLimit.count++;
  return { allowed: true };
}

serve(async (req) => {
  const url = new URL(req.url);
  // Handle path - edge functions are mounted at /functions/v1/api
  // So /functions/v1/api/analyze comes in as /api/analyze or just /analyze
  const path = url.pathname.replace(/^\/api/, '').replace(/^\//, '');

  console.log(`📡 API Request: ${req.method} ${path}`);

  // Handle CORS preflight (for testing in browser)
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
    });
  }

  // Validate API key for all requests
  const authResult = await validateApiKey(req);
  if (!authResult.success) {
    console.log(`❌ Auth failed: ${authResult.error}`);
    return createErrorResponse(authResult.error!, authResult.status || 401);
  }

  const user = authResult.user!;
  console.log(`✅ Authenticated user: ${user.email}`);

  // Check rate limit
  const rateLimit = checkRateLimit(user.id);
  if (!rateLimit.allowed) {
    return createErrorResponse(
      `Rate limit exceeded. Try again in ${rateLimit.retryAfter} seconds.`,
      429,
      { 'Retry-After': String(rateLimit.retryAfter) }
    );
  }

  // Route handling
  try {
    // POST /api/analyze
    if (req.method === 'POST' && (path === 'analyze' || path === '')) {
      return await handleAnalyze(req, user);
    }

    // GET /api/analyses
    if (req.method === 'GET' && path === 'analyses') {
      return await handleListAnalyses(req, user);
    }

    // GET /api/analyses/:id
    if (req.method === 'GET' && path.startsWith('analyses/')) {
      const analysisId = path.replace('analyses/', '');
      return await handleGetAnalysis(analysisId, user);
    }

    // 404 for unknown routes
    return createErrorResponse('Not found', 404);

  } catch (error) {
    console.error('❌ API Error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
});

/**
 * POST /api/analyze
 * Run an AEO analysis on a website
 */
async function handleAnalyze(
  req: Request,
  user: { id: string; email: string; subscription: string }
): Promise<Response> {
  // Parse request body
  let body: {
    url: string;
    prompts: string[];
    brandName?: string;
    providers?: ('openai' | 'anthropic' | 'perplexity')[];
  };

  try {
    body = await req.json();
  } catch {
    return createErrorResponse('Invalid JSON body', 400);
  }

  // Validate required fields
  if (!body.url) {
    return createErrorResponse('url is required', 400);
  }

  if (!body.prompts || !Array.isArray(body.prompts) || body.prompts.length === 0) {
    return createErrorResponse('prompts array is required and must not be empty', 400);
  }

  if (body.prompts.length > 10) {
    return createErrorResponse('Maximum 10 prompts allowed per request', 400);
  }

  // Default providers if not specified
  const providers = body.providers || ['perplexity', 'openai', 'anthropic'];

  // Validate providers
  const validProviders = ['openai', 'anthropic', 'perplexity'];
  for (const p of providers) {
    if (!validProviders.includes(p)) {
      return createErrorResponse(`Invalid provider: ${p}. Valid options: ${validProviders.join(', ')}`, 400);
    }
  }

  console.log(`🔍 Starting analysis for ${body.url} with ${body.prompts.length} prompts`);

  // Get Supabase admin client
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Check monthly usage limit (400 for Enterprise)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: monthlyUsage } = await supabaseAdmin
    .from('analyses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', startOfMonth.toISOString());

  if ((monthlyUsage || 0) >= 400) {
    return createErrorResponse('Monthly analysis limit reached (400/month)', 429);
  }

  // Call crawl-website edge function
  console.log('📄 Crawling website...');
  const crawlResponse = await fetch(`${supabaseUrl}/functions/v1/crawl-website`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({
      url: body.url,
      keywords: body.prompts.slice(0, 3), // Use first 3 prompts as keywords for crawl
    }),
  });

  if (!crawlResponse.ok) {
    const crawlError = await crawlResponse.text();
    console.error('Crawl failed:', crawlError);
    return createErrorResponse(`Failed to crawl website: ${crawlResponse.status}`, 502);
  }

  const crawlData = await crawlResponse.json();
  console.log('✅ Crawl complete');

  // Call check-citations edge function
  console.log('🔎 Checking citations...');
  const citationResponse = await fetch(`${supabaseUrl}/functions/v1/check-citations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({
      prompts: body.prompts.map((text, i) => ({ id: `prompt-${i}`, text })),
      website: body.url,
      brandName: body.brandName,
      providers,
    }),
  });

  if (!citationResponse.ok) {
    const citationError = await citationResponse.text();
    console.error('Citation check failed:', citationError);
    return createErrorResponse(`Failed to check citations: ${citationResponse.status}`, 502);
  }

  const citationData = await citationResponse.json();
  console.log('✅ Citation check complete');

  // Calculate overall citation rate
  const citationResults = citationData.data?.results || [];
  const citedCount = citationResults.filter((r: { isCited: boolean }) => r.isCited).length;
  const overallCitationRate = citationResults.length > 0
    ? Math.round((citedCount / citationResults.length) * 100 * 10) / 10
    : 0;

  // Generate analysis ID
  const analysisId = `api-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  // Save analysis to database
  const analysisRecord = {
    id: analysisId,
    user_id: user.id,
    website: body.url,
    keywords: body.prompts,
    score: overallCitationRate,
    metrics: {
      contentClarity: crawlData.data?.blufAnalysis?.score || 0,
      semanticRichness: 0,
      structuredData: crawlData.data?.schemaMarkup?.length > 0 ? 80 : 20,
      naturalLanguage: crawlData.data?.contentStats?.readabilityScore || 0,
      keywordRelevance: 0,
    },
    insights: `API analysis for ${body.url}. Citation rate: ${overallCitationRate}%`,
    predicted_rank: overallCitationRate > 50 ? 1 : overallCitationRate > 25 ? 2 : 3,
    category: 'aeo',
    recommendations: [],
    is_simulated: false,
    crawl_data: crawlData.data,
    created_at: new Date().toISOString(),
  };

  const { error: saveError } = await supabaseAdmin
    .from('analyses')
    .insert(analysisRecord);

  if (saveError) {
    console.error('Failed to save analysis:', saveError);
    // Continue anyway - we have the data
  }

  console.log(`✅ Analysis complete: ${analysisId}`);

  return createSuccessResponse({
    id: analysisId,
    url: body.url,
    prompts: body.prompts,
    brandName: body.brandName,
    providers,
    overallCitationRate,
    citationResults: citationResults.map((r: {
      promptId: string;
      prompt: string;
      provider: string;
      modelUsed: string;
      response: string;
      isCited: boolean;
      citationContext?: string;
      competitorsCited: { domain: string; url?: string; context: string; position: number }[];
      tokensUsed: number;
      cost: number;
    }) => ({
      promptId: r.promptId,
      prompt: r.prompt,
      provider: r.provider,
      model: r.modelUsed,
      isCited: r.isCited,
      citationContext: r.citationContext,
      competitorsCited: r.competitorsCited,
      response: r.response.substring(0, 500) + (r.response.length > 500 ? '...' : ''),
    })),
    crawlData: {
      title: crawlData.data?.title,
      metaDescription: crawlData.data?.metaDescription,
      pagesAnalyzed: crawlData.data?.pagesAnalyzed || 1,
      schemaTypes: crawlData.data?.schemaMarkup?.map((s: { type: string }) => s.type) || [],
      blufScore: crawlData.data?.blufAnalysis?.score,
    },
    createdAt: new Date().toISOString(),
  });
}

/**
 * GET /api/analyses
 * List user's past analyses
 */
async function handleListAnalyses(
  req: Request,
  user: { id: string; email: string; subscription: string }
): Promise<Response> {
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Get analyses with count
  const { data, error, count } = await supabaseAdmin
    .from('analyses')
    .select('id, website, keywords, score, created_at, is_simulated', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Failed to list analyses:', error);
    return createErrorResponse('Failed to retrieve analyses', 500);
  }

  return createSuccessResponse({
    analyses: (data || []).map(a => ({
      id: a.id,
      url: a.website,
      prompts: a.keywords,
      citationRate: a.score,
      createdAt: a.created_at,
      isSimulated: a.is_simulated,
    })),
    total: count || 0,
    limit,
    offset,
  });
}

/**
 * GET /api/analyses/:id
 * Get a specific analysis by ID
 */
async function handleGetAnalysis(
  analysisId: string,
  user: { id: string; email: string; subscription: string }
): Promise<Response> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data, error } = await supabaseAdmin
    .from('analyses')
    .select('*')
    .eq('id', analysisId)
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    return createErrorResponse('Analysis not found', 404);
  }

  return createSuccessResponse({
    id: data.id,
    url: data.website,
    prompts: data.keywords,
    citationRate: data.score,
    metrics: data.metrics,
    insights: data.insights,
    recommendations: data.recommendations,
    crawlData: data.crawl_data,
    isSimulated: data.is_simulated,
    createdAt: data.created_at,
  });
}
