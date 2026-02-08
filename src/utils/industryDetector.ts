/**
 * Industry detection utilities
 *
 * Provides both keyword-based and AI-powered industry detection:
 * - detectIndustry(): Fast keyword matching from brand/domain
 * - detectIndustryFromAI(): AI-powered detection via Perplexity
 * - parseIndustryResponse(): Cleans AI responses (removes markdown, citations, etc.)
 */

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  'E-commerce': ['shop', 'store', 'buy', 'sell', 'cart', 'commerce', 'retail', 'market', 'ecommerce'],
  'SaaS': ['app', 'software', 'tool', 'platform', 'cloud', 'api', 'saas', 'crm', 'erp'],
  'Marketing': ['marketing', 'seo', 'ads', 'social', 'content', 'brand', 'agency', 'media', 'growth'],
  'Finance': ['finance', 'bank', 'invest', 'money', 'loan', 'pay', 'fintech', 'credit', 'tax', 'account'],
  'Healthcare': ['health', 'medical', 'doctor', 'clinic', 'care', 'wellness', 'pharma', 'therapy', 'dental'],
  'Education': ['learn', 'course', 'edu', 'school', 'academy', 'training', 'tutor', 'teach'],
  'AI & Automation': ['ai', 'bot', 'chat', 'automat', 'gpt', 'llm', 'machine', 'neural', 'intellig', 'convo', 'voice', 'assist'],
  'Technology': ['tech', 'dev', 'code', 'cyber', 'data', 'ml', 'crypto', 'block', 'web3'],
  'Travel': ['travel', 'hotel', 'flight', 'trip', 'tour', 'booking', 'vacation', 'hospit'],
  'Real Estate': ['realty', 'estate', 'property', 'home', 'house', 'rent', 'mortgage']
};

export const DEFAULT_INDUSTRY = 'General Business';

/**
 * Detects industry from brand name and domain
 * @param brandName - The brand/company name extracted from domain
 * @param domain - The full domain name
 * @returns The detected industry category or 'General Business' if no match
 */
export function detectIndustry(brandName: string, domain: string): string {
  const lowerBrand = brandName.toLowerCase();
  const lowerDomain = domain.toLowerCase();

  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (keywords.some(kw => lowerBrand.includes(kw) || lowerDomain.includes(kw))) {
      return industry;
    }
  }

  return DEFAULT_INDUSTRY;
}

/**
 * Get all supported industries
 */
export function getSupportedIndustries(): string[] {
  return [...Object.keys(INDUSTRY_KEYWORDS), DEFAULT_INDUSTRY];
}

/**
 * Parses and cleans an AI response to extract the industry name.
 * Removes markdown formatting, citation references, common prefixes, and punctuation.
 *
 * @param responseText - Raw response text from AI (e.g., Perplexity)
 * @returns Cleaned industry name or null if invalid
 */
export function parseIndustryResponse(responseText: string): string | null {
  if (!responseText) return null;

  // Extract industry from response (first line, clean up)
  let detectedIndustry = responseText.split('\n')[0]
    // Remove common prefixes
    .replace(/^(industry:|the industry is|this is a|they operate in|based on|the company operates in)/i, '')
    // Remove markdown formatting
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    // Remove citation references like [1], [2][3], etc.
    .replace(/\[\d+\]/g, '')
    // Remove trailing punctuation and whitespace
    .trim()
    .replace(/[.,;:]+$/, '')
    // Remove quotes
    .replace(/^["']|["']$/g, '');

  // Validate length (too short or too long is likely invalid)
  if (detectedIndustry && detectedIndustry.length > 2 && detectedIndustry.length < 100) {
    return detectedIndustry;
  }

  return null;
}

/**
 * Result from AI-powered industry detection
 */
export interface IndustryDetectionResult {
  industry: string | null;
  detected: boolean;
  error?: string;
}

/**
 * Detects industry using AI (Perplexity) by querying what sector the website operates in.
 *
 * @param websiteUrl - The website URL to analyze
 * @param supabaseClient - Supabase client instance with functions.invoke capability
 * @returns Detection result with industry name and success status
 */
export async function detectIndustryFromAI(
  websiteUrl: string,
  supabaseClient: { functions: { invoke: (name: string, options: any) => Promise<{ data: any; error: any }> } }
): Promise<IndustryDetectionResult> {
  if (!websiteUrl) {
    return { industry: null, detected: false, error: 'No website URL provided' };
  }

  try {
    // Normalize URL
    let normalizedUrl = websiteUrl.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    // Extract brand name from URL
    const urlObj = new URL(normalizedUrl);
    const domain = urlObj.hostname.replace('www.', '');
    const brandName = domain.split('.')[0];

    const discoveryPrompt = `What industry or business sector does ${brandName} (${normalizedUrl}) operate in? Answer with just the industry name in 3-5 words.`;

    const { data, error: fnError } = await supabaseClient.functions.invoke('check-citations', {
      body: {
        prompts: [{ id: 'discovery', text: discoveryPrompt }],
        website: normalizedUrl,
        brandName: brandName,
        providers: ['perplexity']
      }
    });

    if (fnError) {
      console.error('[detectIndustryFromAI] Error:', fnError);
      return { industry: null, detected: false, error: fnError.message };
    }

    // Response structure: { success, data: { results: [{ response, ... }] } }
    const responseText = data?.data?.results?.[0]?.response;
    console.log('[detectIndustryFromAI] Response:', responseText);

    if (responseText) {
      const industry = parseIndustryResponse(responseText);
      console.log('[detectIndustryFromAI] Detected:', industry);

      if (industry) {
        return { industry, detected: true };
      }
    }

    return { industry: null, detected: false };
  } catch (err) {
    console.error('[detectIndustryFromAI] Failed:', err);
    return { industry: null, detected: false, error: String(err) };
  }
}
