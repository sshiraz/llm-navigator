/**
 * Detects industry category from brand name and domain
 * Used by free report to generate industry-specific prompts and recommendations
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
