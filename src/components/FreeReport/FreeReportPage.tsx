import React, { useState, useEffect } from 'react';
import { Search, Mail, Globe, CheckCircle, ArrowRight, BarChart3, Eye, Target, Zap, Shield, TrendingUp, ExternalLink, AlertTriangle, Award, Users, Info, Clock, Briefcase, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { detectIndustry, detectIndustryFromAI } from '../../utils/industryDetector';

interface FreeReportPageProps {
  onGetStarted: () => void;
}

interface QueryResult {
  promptId: string;
  promptText: string;
  queryType: string;
  isCited: boolean;
  citationContext?: string;
  competitors: { domain: string; context: string; citationCount?: number }[];
}

interface CompetitorSummary {
  domain: string;
  citationCount: number;
  queryTypes: string[];
}

interface CrawledPage {
  url: string;
  title: string;
  wordCount: number;
  headingsCount: number;
  schemaCount: number;
  issues: string[];
}

interface CrawlSummary {
  pagesAnalyzed: number;
  pages: CrawledPage[];
  totalWords: number;
  totalHeadings: number;
  totalSchemas: number;
  avgReadability: number;
  metaDescription: string;
  mainTitle: string;
}

interface ReportData {
  citationRate: number;
  aiVisibilityScore: number;
  totalQueries: number;
  citedQueries: number;
  queryResults: QueryResult[];
  competitorSummary: CompetitorSummary[];
  topCompetitor?: CompetitorSummary;
  recommendations: { priority: 'high' | 'medium' | 'low'; title: string; description: string }[];
  estimatedMissedTraffic: { monthly: number; yearly: number };
  industryCategory: string;
  crawlSummary?: CrawlSummary;
}

// Query types for comprehensive analysis
const QUERY_TYPES = {
  alternatives: { id: 'alternatives', label: 'Alternatives Search', icon: '🔄' },
  best: { id: 'best', label: 'Best Tools', icon: '🏆' },
  howTo: { id: 'howto', label: 'How-To Questions', icon: '❓' },
  comparison: { id: 'comparison', label: 'Comparisons', icon: '⚖️' },
  recommendation: { id: 'recommendation', label: 'Recommendations', icon: '💡' }
};

// Extract keywords from text for industry matching
const extractKeywords = (text: string): Set<string> => {
  if (!text) return new Set();
  // Common words to ignore
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'your', 'our', 'their', 'its', 'this', 'that', 'these', 'those', 'we', 'you', 'they', 'it', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there', 'when', 'where', 'why', 'how', 'what', 'which', 'who', 'whom', 'whose', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'up', 'down', 'out', 'off', 'over', 'any', 'home', 'page', 'welcome', 'website', 'company', 'leading', 'best', 'top', 'premier', 'professional', 'trusted', 'reliable', 'quality', 'excellence']);

  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  // Also extract common industry stems (geo, enviro, tech, etc.)
  const stems = new Set<string>();
  words.forEach(w => {
    if (w.startsWith('geo')) stems.add('geo');
    if (w.startsWith('enviro')) stems.add('enviro');
    if (w.includes('environment')) stems.add('environment');
    if (w.includes('consult')) stems.add('consulting');
    if (w.includes('engineer')) stems.add('engineering');
    if (w.includes('science')) stems.add('science');
    if (w.includes('tech')) stems.add('tech');
    if (w.includes('software')) stems.add('software');
    if (w.includes('health')) stems.add('health');
    if (w.includes('medic')) stems.add('medical');
    if (w.includes('financ')) stems.add('finance');
    if (w.includes('legal')) stems.add('legal');
    if (w.includes('construct')) stems.add('construction');
    if (w.includes('manufact')) stems.add('manufacturing');
    if (w.includes('retail')) stems.add('retail');
    if (w.includes('ecommerce') || w.includes('commerce')) stems.add('ecommerce');
  });

  return new Set([...words, ...stems]);
};

// Check if two sets of keywords have meaningful overlap
const hasIndustryOverlap = (keywords1: Set<string>, keywords2: Set<string>, minOverlap: number = 2): boolean => {
  let overlap = 0;
  for (const word of keywords1) {
    if (keywords2.has(word)) {
      overlap++;
      if (overlap >= minOverlap) return true;
    }
  }
  return false;
};

// Domains that are clearly not real competitors (data aggregators, social media, etc.)
const NON_COMPETITOR_DOMAINS = new Set([
  'linkedin.com', 'facebook.com', 'twitter.com', 'x.com', 'instagram.com',
  'youtube.com', 'wikipedia.org', 'reddit.com', 'medium.com',
  'g2.com', 'capterra.com', 'trustpilot.com', 'glassdoor.com',
  'crunchbase.com', 'zoominfo.com', 'cbinsights.com', 'pitchbook.com',
  'bloomberg.com', 'reuters.com', 'forbes.com', 'techcrunch.com',
  'worldbank.org', 'documents1.worldbank.org', 'rocketreach.co',
  'indonetwork.co.id', 'en.indonetwork.co.id', 'alibaba.com', 'aliexpress.com',
  'amazon.com', 'ebay.com', 'yelp.com', 'yellowpages.com',
  'gov', 'edu' // Government and education TLDs
]);

export default function FreeReportPage({ onGetStarted }: FreeReportPageProps) {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [error, setError] = useState('');
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  // Two-step form flow
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [industry, setIndustry] = useState('');
  const [isDetectingIndustry, setIsDetectingIndustry] = useState(false);
  const [industryDetected, setIndustryDetected] = useState(false);

  // Set SEO metadata on mount
  useEffect(() => {
    // Set page title
    document.title = 'Free AI Visibility Report | LLM Navigator';

    // Set or update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'Get a free AI visibility report showing how your brand appears in ChatGPT, Claude, Perplexity, and Gemini. Discover your AI search visibility in minutes.');

    // Set or update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', 'https://llmsearchinsight.com/free-report');

    // Cleanup on unmount - restore default title
    return () => {
      document.title = 'LLM Navigator';
    };
  }, []);

  // Detect industry from website URL (for Step 1)
  const detectIndustryFromUrl = async (websiteUrl: string) => {
    if (!websiteUrl || isDetectingIndustry) return;

    setIsDetectingIndustry(true);
    setError('');

    try {
      const result = await detectIndustryFromAI(websiteUrl, supabase);

      if (result.detected && result.industry) {
        setIndustry(result.industry);
        setIndustryDetected(true);
      }
    } catch (err) {
      console.error('Industry detection failed:', err);
      // Continue anyway - industry is optional
    } finally {
      setIsDetectingIndustry(false);
    }
  };

  // Handle Step 1 -> Step 2 transition
  const handleContinueToStep2 = async () => {
    if (!website || !website.includes('.')) {
      setError('Please enter a valid website URL');
      return;
    }

    // If industry not detected yet, detect it now
    if (!industry && !isDetectingIndustry) {
      await detectIndustryFromUrl(website);
    }

    setError('');
    setFormStep(2);
  };

  // Handle going back to Step 1
  const handleBackToStep1 = () => {
    setFormStep(1);
  };

  // Auto-detect industry when website changes (debounced)
  useEffect(() => {
    if (industryDetected || formStep !== 1) return;

    const timer = setTimeout(() => {
      if (website && website.includes('.')) {
        detectIndustryFromUrl(website);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [website, industryDetected, formStep]);

  // Industry keywords for content-based detection
  const INDUSTRY_CONTENT_KEYWORDS: Record<string, string[]> = {
    'E-commerce': ['shop', 'store', 'buy', 'sell', 'cart', 'commerce', 'retail', 'product', 'order', 'shipping', 'checkout'],
    'SaaS': ['software', 'platform', 'cloud', 'api', 'saas', 'subscription', 'dashboard', 'integration', 'workflow'],
    'Marketing': ['marketing', 'seo', 'ads', 'campaign', 'content', 'brand', 'agency', 'leads', 'conversion', 'analytics'],
    'Finance': ['finance', 'bank', 'invest', 'payment', 'loan', 'fintech', 'credit', 'tax', 'accounting', 'budget'],
    'Healthcare': ['health', 'medical', 'doctor', 'patient', 'clinic', 'care', 'wellness', 'therapy', 'treatment'],
    'Education': ['learn', 'course', 'student', 'training', 'education', 'tutorial', 'teach', 'curriculum', 'certification'],
    'AI & Automation': ['ai', 'chatbot', 'automation', 'gpt', 'llm', 'machine learning', 'artificial intelligence', 'bot', 'conversational', 'assistant', 'neural', 'nlp'],
    'Technology': ['tech', 'developer', 'code', 'cyber', 'data', 'security', 'cloud', 'infrastructure', 'devops'],
    'Travel': ['travel', 'hotel', 'flight', 'booking', 'vacation', 'trip', 'tour', 'destination', 'resort'],
    'Real Estate': ['real estate', 'property', 'home', 'house', 'rent', 'mortgage', 'listing', 'apartment', 'realtor']
  };

  // Detect industry from crawled content
  const detectIndustryFromContent = (title: string, metaDescription: string, headings: string[]): string => {
    const content = `${title} ${metaDescription} ${headings.join(' ')}`.toLowerCase();

    const scores: Record<string, number> = {};

    for (const [industry, keywords] of Object.entries(INDUSTRY_CONTENT_KEYWORDS)) {
      scores[industry] = keywords.reduce((score, keyword) => {
        const regex = new RegExp(keyword.toLowerCase(), 'gi');
        const matches = content.match(regex);
        return score + (matches ? matches.length : 0);
      }, 0);
    }

    // Find industry with highest score
    const topIndustry = Object.entries(scores)
      .filter(([, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])[0];

    return topIndustry ? topIndustry[0] : 'General Business';
  };

  // Generate prompts for multi-query analysis
  // Uses AI-detected industry and location for more accurate queries
  const generatePrompts = (
    brandName: string,
    websiteUrl: string,
    description?: string,
    detectedIndustry?: string,
    detectedLocation?: string
  ): { id: string; text: string; queryType: string }[] => {
    // Use detected industry if available, otherwise fall back to description
    const industry = detectedIndustry || '';
    const location = detectedLocation && detectedLocation.toLowerCase() !== 'global' ? detectedLocation : '';

    // Build location clause for geo-specific queries
    const locationClause = location ? ` in ${location}` : '';

    // If we have a detected industry, use industry-focused queries
    if (industry) {
      return [
        {
          id: 'alternatives',
          text: `What are the best alternatives to ${brandName} for ${industry.toLowerCase()}${locationClause}? Include specific company websites.`,
          queryType: 'alternatives'
        },
        {
          id: 'topCompanies',
          text: `What are the most well-known ${industry.toLowerCase()} companies${locationClause}? List the top companies with their websites.`,
          queryType: 'topCompanies'
        },
        {
          id: 'competitors',
          text: `Who are the main competitors to ${brandName} in the ${industry.toLowerCase()} industry${locationClause}? List specific companies.`,
          queryType: 'competitors'
        },
        {
          id: 'bestProviders',
          text: `Who are the best ${industry.toLowerCase()} providers${locationClause}? What companies are recommended?`,
          queryType: 'bestProviders'
        },
        {
          id: 'recommendation',
          text: `I need ${industry.toLowerCase()} services${locationClause}. What companies do you recommend and why?`,
          queryType: 'recommendation'
        }
      ];
    }

    // Fallback: Use description-based context if no industry detected
    const contextClause = description ? `, which ${description.toLowerCase()}` : '';

    return [
      {
        id: 'alternatives',
        text: `What are the best alternatives to ${brandName}${contextClause}? Include specific company websites.`,
        queryType: 'alternatives'
      },
      {
        id: 'competitors',
        text: `Who are the main competitors to ${brandName}${contextClause}? List specific companies with their websites.`,
        queryType: 'competitors'
      },
      {
        id: 'whatdoes',
        text: `What does ${brandName} do and who are similar companies in their market?`,
        queryType: 'whatDoes'
      },
      {
        id: 'comparison',
        text: `Compare ${brandName}${contextClause} with their top competitors in the same industry. What are the differences?`,
        queryType: 'comparison'
      },
      {
        id: 'recommendation',
        text: `I'm looking for a company like ${brandName}${contextClause}. What do you recommend?`,
        queryType: 'recommendation'
      }
    ];
  };

  // Generate personalized recommendations based on analysis
  const generateRecommendations = (
    citationRate: number,
    competitorSummary: CompetitorSummary[],
    queryResults: QueryResult[],
    brandName: string
  ): { priority: 'high' | 'medium' | 'low'; title: string; description: string }[] => {
    const recommendations: { priority: 'high' | 'medium' | 'low'; title: string; description: string }[] = [];

    // High priority: Not cited at all
    if (citationRate === 0) {
      recommendations.push({
        priority: 'high',
        title: 'Add FAQ Schema Markup',
        description: `AI assistants heavily favor structured data. Add FAQ schema to your key pages with direct answers to questions like "What does ${brandName} do?" and "How does your service work?"`
      });

      recommendations.push({
        priority: 'high',
        title: 'Create Direct-Answer Content',
        description: 'Structure your content with clear headers that match common questions. Start paragraphs with factual statements AI can easily cite.'
      });
    }

    // Competitors getting more citations
    if (competitorSummary.length > 0) {
      const topComp = competitorSummary[0];
      recommendations.push({
        priority: 'high',
        title: `Outrank ${topComp.domain}`,
        description: `${topComp.domain} was cited ${topComp.citationCount} time(s). Analyze their content structure and create more comprehensive, authoritative content on the same topics.`
      });
    }

    // Low citation rate (some but not all)
    if (citationRate > 0 && citationRate < 60) {
      recommendations.push({
        priority: 'medium',
        title: 'Expand Topic Coverage',
        description: `You're being cited in some query types but not others. Create content that addresses "alternatives to ${brandName}" and comparison-style questions.`
      });
    }

    // Not cited in alternatives queries
    const altResult = queryResults.find(r => r.queryType === 'alternatives');
    if (altResult && !altResult.isCited) {
      recommendations.push({
        priority: 'medium',
        title: 'Create Comparison Content',
        description: 'Publish transparent comparison pages showing how you stack up against competitors. AI loves citing fair, balanced comparisons.'
      });
    }

    // Not cited in "what does" queries
    const whatDoesResult = queryResults.find(r => r.queryType === 'whatDoes');
    if (whatDoesResult && !whatDoesResult.isCited) {
      recommendations.push({
        priority: 'medium',
        title: 'Add Educational Content',
        description: 'Create guides and tutorials about your services and best practices. Use numbered steps and clear headings AI can parse.'
      });
    }

    // General recommendations
    recommendations.push({
      priority: 'low',
      title: 'Publish Fresh Statistics',
      description: 'AI assistants love citing original research and data. Publish industry benchmarks, surveys, or case study results with specific numbers.'
    });

    return recommendations.slice(0, 5); // Limit to top 5
  };

  // Estimate missed traffic based on citation gaps
  const estimateMissedTraffic = (citationRate: number, competitorCount: number): { monthly: number; yearly: number } => {
    // Base estimate: 100 potential visitors per query type if you're not being cited
    // Adjust based on industry and competition
    const baseMonthlyVisitors = 100;
    const missedQueryTypes = 5 - Math.round(citationRate / 20); // Approximate uncited query types
    const competitorPenalty = Math.min(competitorCount * 0.1, 0.5); // Up to 50% more if competitors dominate

    const monthly = Math.round(baseMonthlyVisitors * missedQueryTypes * (1 + competitorPenalty));
    return {
      monthly,
      yearly: monthly * 12
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!email || !website) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    // Normalize URL
    let normalizedUrl = website.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    setIsLoading(true);
    setLoadingStatus('Checking eligibility...');

    // Whitelist for unlimited free reports (admin/testing)
    const unlimitedEmails = ['info@convologix.com'];
    const isUnlimited = unlimitedEmails.includes(email.toLowerCase());

    // Abuse prevention: Check for recent reports with same email or domain
    if (!isUnlimited) {
      try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        // Check if this email has already received a report in the last 24 hours
        const { data: emailCheck, error: emailCheckErr } = await supabase
          .from('free_report_leads')
          .select('id, created_at')
          .eq('email', email.toLowerCase())
          .gte('created_at', twentyFourHoursAgo)
          .limit(1);

        if (emailCheckErr) {
          console.warn('Email rate limit check failed:', emailCheckErr);
        } else if (emailCheck && emailCheck.length > 0) {
          setError('You already received a free report in the last 24 hours. Please try again later or start a free trial for unlimited analyses.');
          setIsLoading(false);
          return;
        }

        // Check if this domain has been analyzed too many times in the last 24 hours (max 3)
        const { data: domainCheck, error: domainCheckErr } = await supabase
          .from('free_report_leads')
          .select('id')
          .eq('website', normalizedUrl)
          .gte('created_at', twentyFourHoursAgo);

        if (domainCheckErr) {
          console.warn('Domain rate limit check failed:', domainCheckErr);
        } else if (domainCheck && domainCheck.length >= 3) {
          setError('This website has already been analyzed multiple times today. Please try again tomorrow or start a free trial.');
          setIsLoading(false);
          return;
        }
      } catch (abuseCheckErr) {
        // If abuse check fails, continue anyway (don't block legitimate users)
        console.warn('Abuse check failed:', abuseCheckErr);
      }
    }

    setLoadingStatus('Crawling website...');

    try {
      // Extract domain for prompt generation
      const domain = normalizedUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
      let brandName = domain.split('.')[0]; // Fallback - will be updated from crawl

      // Step 1: Crawl the website to get content
      let crawlSummary: CrawlSummary | undefined;
      let contentIndustry = detectIndustry(brandName, domain); // Fallback from content (not used if Step 1 detected)
      let metaDescription = ''; // For prompt context

      try {
        const { data: crawlData, error: crawlError } = await supabase.functions.invoke('crawl-website', {
          body: { url: normalizedUrl }
        });

        if (!crawlError && crawlData?.success && crawlData?.data) {
          const crawl = crawlData.data;

          // Use page title as brand name if available (much better than domain extraction)
          if (crawl.title) {
            // Clean up common title patterns like "Company Name | Tagline" or "Company Name - Description"
            const cleanTitle = crawl.title.split(/[|\-–—]/)[0].trim();
            if (cleanTitle.length > 0 && cleanTitle.length < 100) {
              brandName = cleanTitle;
            }
          }

          // Store meta description for potential prompt context
          metaDescription = crawl.metaDescription || '';

          // Extract headings text for industry detection
          const headingsText = crawl.headings?.map((h: { text: string }) => h.text) || [];

          // Detect industry from actual page content (only used as fallback if Step 1 didn't detect)
          contentIndustry = detectIndustryFromContent(
            crawl.title || '',
            metaDescription,
            headingsText
          );

          // Build crawl summary for report
          crawlSummary = {
            pagesAnalyzed: crawl.pagesAnalyzed || 1,
            pages: crawl.pages || [{
              url: normalizedUrl,
              title: crawl.title || domain,
              wordCount: crawl.contentStats?.wordCount || 0,
              headingsCount: crawl.headings?.length || 0,
              schemaCount: crawl.schemaMarkup?.length || 0,
              issues: []
            }],
            totalWords: crawl.aggregatedStats?.totalWords || crawl.contentStats?.wordCount || 0,
            totalHeadings: crawl.aggregatedStats?.totalHeadings || crawl.headings?.length || 0,
            totalSchemas: crawl.aggregatedStats?.totalSchemas || crawl.schemaMarkup?.length || 0,
            avgReadability: crawl.aggregatedStats?.avgReadability || crawl.contentStats?.readabilityScore || 0,
            metaDescription: metaDescription,
            mainTitle: crawl.title || domain
          };

          console.log('Using brand name from page title:', brandName);
          console.log('Detected industry from content (fallback):', contentIndustry);
        }
      } catch (crawlErr) {
        console.warn('Crawl failed, using domain-based detection:', crawlErr);
      }

      // Use industry from Step 1 (already detected before email capture)
      // This saves an API call since we detected industry when user entered the URL
      const detectedIndustry = industry; // From state (Step 1)
      const detectedLocation = ''; // Location detection removed - Step 1 only detects industry

      console.log('Using pre-detected industry from Step 1:', detectedIndustry);

      // Generate prompts using the pre-detected industry
      setLoadingStatus('Preparing analysis...');

      // Generate 5 diverse prompts using discovered industry for better accuracy
      const prompts = generatePrompts(brandName, normalizedUrl, metaDescription, detectedIndustry, detectedLocation);

      setLoadingStatus(`Querying AI providers (5 queries)...`);

      // Call the check-citations edge function with 5 prompts
      const { data, error: fnError } = await supabase.functions.invoke('check-citations', {
        body: {
          prompts: prompts.map(p => ({ id: p.id, text: p.text })),
          website: normalizedUrl,
          brandName: brandName,
          providers: ['perplexity']
        }
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to analyze website');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Analysis failed');
      }

      setLoadingStatus('Analyzing results...');

      // Process results
      const results = data.data.results || [];
      const queryResults: QueryResult[] = results.map((result: any, index: number) => ({
        promptId: prompts[index]?.id || `query-${index}`,
        promptText: prompts[index]?.text || result.prompt,
        queryType: prompts[index]?.queryType || 'unknown',
        isCited: result.isCited || false,
        citationContext: result.citationContext,
        competitors: (result.competitorsCited || []).map((c: any) => ({
          domain: c.domain,
          context: c.context
        }))
      }));

      // Calculate citation rate
      const citedQueries = queryResults.filter(r => r.isCited).length;
      const totalQueries = queryResults.length;
      const citationRate = totalQueries > 0 ? (citedQueries / totalQueries) * 100 : 0;

      // Aggregate competitor data
      const competitorMap = new Map<string, { count: number; queryTypes: Set<string> }>();
      queryResults.forEach(result => {
        result.competitors.forEach(comp => {
          // Skip obvious non-competitors (data aggregators, social media, etc.)
          const domainLower = comp.domain.toLowerCase();
          const isBlocked = Array.from(NON_COMPETITOR_DOMAINS).some(blocked =>
            domainLower === blocked || domainLower.endsWith('.' + blocked)
          );
          if (isBlocked) return;

          // Skip government and education domains
          if (domainLower.endsWith('.gov') || domainLower.endsWith('.edu')) return;

          const existing = competitorMap.get(comp.domain);
          if (existing) {
            existing.count++;
            existing.queryTypes.add(result.queryType);
          } else {
            competitorMap.set(comp.domain, { count: 1, queryTypes: new Set([result.queryType]) });
          }
        });
      });

      // Get top candidates for validation (more than we need, to account for filtering)
      const topCandidates = Array.from(competitorMap.entries())
        .map(([domain, data]) => ({
          domain,
          citationCount: data.count,
          queryTypes: Array.from(data.queryTypes)
        }))
        .sort((a, b) => b.citationCount - a.citationCount)
        .slice(0, 10);

      // Extract keywords from original site for comparison
      const originalKeywords = extractKeywords(`${brandName} ${metaDescription} ${crawlSummary?.mainTitle || ''}`);
      console.log('Original site keywords:', Array.from(originalKeywords));

      // Validate competitors by crawling their homepages (in parallel, with timeout)
      setLoadingStatus('Validating competitors...');
      const validatedCompetitors: CompetitorSummary[] = [];

      // Crawl competitors in parallel with a timeout
      // Logic: Include by default, only exclude if we VERIFY they're in a different industry
      const validationPromises = topCandidates.map(async (candidate) => {
        try {
          const competitorUrl = `https://${candidate.domain}`;
          const { data: crawlData, error: crawlError } = await supabase.functions.invoke('crawl-website', {
            body: { url: competitorUrl }
          });

          if (crawlError || !crawlData?.success || !crawlData?.data) {
            // Can't crawl = can't verify they're irrelevant, so INCLUDE them
            console.log(`Could not crawl ${candidate.domain}, including by default`);
            return { ...candidate, validated: true, reason: 'crawl_failed_include' };
          }

          const compCrawl = crawlData.data;
          const compKeywords = extractKeywords(`${compCrawl.title || ''} ${compCrawl.metaDescription || ''}`);
          console.log(`Competitor ${candidate.domain} keywords:`, Array.from(compKeywords));

          // Check for industry overlap (require only 1 matching keyword)
          const hasOverlap = hasIndustryOverlap(originalKeywords, compKeywords, 1);

          if (hasOverlap) {
            return { ...candidate, validated: true, reason: 'matched' };
          } else {
            // Only exclude if we successfully crawled AND found ZERO overlap
            console.log(`Competitor ${candidate.domain} filtered out - verified different industry`);
            return { ...candidate, validated: false, reason: 'no_overlap' };
          }
        } catch (err) {
          // Error = can't verify, so INCLUDE them
          console.warn(`Error validating competitor ${candidate.domain}, including by default:`, err);
          return { ...candidate, validated: true, reason: 'error_include' };
        }
      });

      // Wait for all validations with a timeout (max 15 seconds total)
      const validationResults = await Promise.race([
        Promise.all(validationPromises),
        new Promise<typeof topCandidates>((resolve) =>
          setTimeout(() => {
            console.log('Competitor validation timeout, using unvalidated list');
            resolve(topCandidates.map(c => ({ ...c, validated: true, reason: 'timeout' })));
          }, 15000)
        )
      ]);

      // Build final competitor list from validated results
      const competitorSummary: CompetitorSummary[] = validationResults
        .filter((c: any) => c.validated)
        .slice(0, 5)
        .map(({ domain, citationCount, queryTypes }) => ({ domain, citationCount, queryTypes }));

      console.log(`Validated ${competitorSummary.length} competitors from ${topCandidates.length} candidates`);

      // Calculate AI visibility score
      let aiVisibilityScore = 20; // Base score
      aiVisibilityScore += citationRate * 0.5; // Up to 50 points for citation rate
      if (competitorSummary.length === 0) {
        aiVisibilityScore += 15; // No competitors cited
      } else if (competitorSummary.length < 3) {
        aiVisibilityScore += 5;
      }
      // Bonus for being cited in key query types
      if (queryResults.find(r => r.queryType === 'alternatives' && r.isCited)) {
        aiVisibilityScore += 10;
      }
      if (queryResults.find(r => r.queryType === 'best' && r.isCited)) {
        aiVisibilityScore += 5;
      }
      aiVisibilityScore = Math.min(100, Math.round(aiVisibilityScore));

      // Generate personalized recommendations
      const recommendations = generateRecommendations(citationRate, competitorSummary, queryResults, brandName);

      // Estimate missed traffic
      const estimatedMissedTraffic = estimateMissedTraffic(citationRate, competitorSummary.length);

      setReportData({
        citationRate: Math.round(citationRate),
        aiVisibilityScore,
        totalQueries,
        citedQueries,
        queryResults,
        competitorSummary,
        topCompetitor: competitorSummary[0],
        recommendations,
        estimatedMissedTraffic,
        industryCategory: industry,
        crawlSummary
      });

      setReportGenerated(true);

      // Save lead to database (fire and forget)
      supabase.from('free_report_leads').insert({
        email: email.toLowerCase(),
        website: normalizedUrl,
        is_cited: citedQueries > 0,
        ai_score: aiVisibilityScore,
        citation_rate: citationRate,
        industry: industry,
        competitor_count: competitorSummary.length
      }).then(({ error }) => {
        if (error) {
          console.error('Failed to save lead:', error.message, error.code);
        } else {
          console.log('Lead saved successfully');
        }
      }).catch((err) => console.error('Lead save exception:', err));

      // Notify admin of new lead (fire and forget)
      supabase.functions.invoke('notify-admin-lead', {
        body: {
          type: 'free_report',
          email: email.toLowerCase(),
          website: normalizedUrl,
          aiScore: aiVisibilityScore,
          citationRate: citationRate,
          industry: industry
        }
      }).catch(() => {});

      // Send email with report (fire and forget)
      supabase.functions.invoke('send-free-report-email', {
        body: {
          email,
          website: normalizedUrl,
          reportData: {
            aiVisibilityScore,
            citationRate: Math.round(citationRate),
            totalQueries,
            citedQueries,
            industryCategory: industry,
            competitorSummary,
            recommendations,
            estimatedMissedTraffic,
            crawlSummary,
            queryResults: queryResults.map(qr => ({
              queryType: QUERY_TYPES[qr.queryType as keyof typeof QUERY_TYPES]?.label || qr.queryType,
              promptText: qr.promptText,
              isCited: qr.isCited,
              competitors: qr.competitors.map(c => ({ domain: c.domain }))
            }))
          }
        }
      }).then((res) => {
        if (res.data?.success) {
          console.log('Report email sent');
        } else {
          console.warn('Email send failed:', res.data?.error || res.error);
        }
      }).catch((err) => console.warn('Email send error:', err));

    } catch (err) {
      console.error('Free report error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 60) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Work';
    return 'Poor';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Search className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-white">LLM Navigator</span>
          </div>
          <button
            onClick={onGetStarted}
            className="text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 py-16">
        {!reportGenerated ? (
          <>
            {/* Pre-report: Lead capture form */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-6">
                <Zap className="w-4 h-4 text-blue-400" />
                <span className="text-blue-300 text-sm font-medium">Free AI Visibility Report</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Is Your Website Visible to<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                  AI Search Engines?
                </span>
              </h1>

              <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
                ChatGPT, Perplexity, and Claude are changing how people find information.
                Find out if your content is being cited — in 30 seconds, for free.
              </p>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className={`flex items-center gap-2 ${formStep === 1 ? 'text-blue-400' : 'text-slate-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  formStep === 1 ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'
                }`}>1</div>
                <span className="text-sm font-medium hidden sm:inline">Your Website</span>
              </div>
              <div className="w-8 h-px bg-slate-600" />
              <div className={`flex items-center gap-2 ${formStep === 2 ? 'text-blue-400' : 'text-slate-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  formStep === 2 ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'
                }`}>2</div>
                <span className="text-sm font-medium hidden sm:inline">Get Your Report</span>
              </div>
            </div>

            {/* Form Card */}
            <div className="max-w-xl mx-auto">
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 shadow-2xl">

                {/* STEP 1: Website, Industry & Email */}
                {formStep === 1 && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Website URL
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                          type="text"
                          value={website}
                          onChange={(e) => {
                            setWebsite(e.target.value);
                            // Reset industry when URL changes
                            if (industryDetected) {
                              setIndustry('');
                              setIndustryDetected(false);
                            }
                          }}
                          placeholder="yourcompany.com"
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    {/* Industry Field */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Industry
                        <span className="text-slate-500 font-normal ml-1">
                          {isDetectingIndustry ? '(detecting...)' : industryDetected ? '(auto-detected)' : ''}
                        </span>
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                          type="text"
                          value={industry}
                          onChange={(e) => {
                            setIndustry(e.target.value);
                            setIndustryDetected(false);
                          }}
                          placeholder="e.g., Environmental Consulting, SaaS Marketing"
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          disabled={isDetectingIndustry}
                        />
                        {isDetectingIndustry && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      {industryDetected && (
                        <p className="mt-1.5 text-xs text-amber-400/70 flex items-center">
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI-suggested — feel free to edit
                        </p>
                      )}
                      {website && website.includes('.') && !isDetectingIndustry && !industry && (
                        <button
                          type="button"
                          onClick={() => detectIndustryFromUrl(website)}
                          className="mt-1.5 text-xs text-amber-400 hover:text-amber-300 flex items-center"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          Detect industry from website
                        </button>
                      )}
                    </div>

                    {/* Email Field */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@company.com"
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                        {error}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleContinueToStep2}
                      disabled={!website || !website.includes('.') || !email || !email.includes('@') || isDetectingIndustry}
                      className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <span>{isDetectingIndustry ? 'Detecting Industry...' : 'Continue'}</span>
                      {!isDetectingIndustry && <ArrowRight className="w-5 h-5" />}
                    </button>
                  </div>
                )}

                {/* STEP 2: Confirmation & Generate */}
                {formStep === 2 && (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Summary of inputs */}
                    <div className="bg-slate-900/50 border border-slate-600 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <button
                          type="button"
                          onClick={handleBackToStep1}
                          className="text-slate-400 hover:text-white text-sm flex items-center gap-1 transition-colors"
                        >
                          <ArrowRight className="w-4 h-4 rotate-180" />
                          Edit
                        </button>
                        <span className="text-xs text-slate-500">Review your details</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-slate-500" />
                          <span className="text-white text-sm">{website}</span>
                        </div>
                        {industry && (
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-amber-400/70" />
                            <span className="text-amber-400 text-sm">{industry}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-300 text-sm">{email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-center text-sm text-slate-400">
                      We'll analyze your website and check if AI assistants are citing your content.
                    </div>

                    {error && (
                      <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>{loadingStatus || 'Analyzing your website...'}</span>
                        </>
                      ) : (
                        <>
                          <span>Generate My Free Report</span>
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                <p className="text-center text-slate-500 text-sm mt-4">
                  No credit card required. Report delivered instantly.
                </p>
              </div>

              {/* How It Works Explainer */}
              <div className="mt-6 bg-slate-900/30 border border-slate-700/50 rounded-xl p-5">
                <div className="flex items-center space-x-2 mb-3">
                  <Info className="w-4 h-4 text-blue-400" />
                  <h4 className="text-white font-medium text-sm">How It Works</h4>
                </div>
                <ol className="space-y-2 text-sm text-slate-400">
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-400 font-medium">1.</span>
                    <span>We crawl your website to analyze content structure, schema markup, and readability</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-400 font-medium">2.</span>
                    <span>We query Perplexity with 5 real prompts about your brand and competitors (ChatGPT, Claude, and Gemini available with an account)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-400 font-medium">3.</span>
                    <span>You get a detailed report with scores, competitors, and personalized recommendations</span>
                  </li>
                </ol>
                <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-center space-x-6 text-xs text-slate-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Takes ~30 seconds</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Mail className="w-3 h-3" />
                    <span>Report emailed to you</span>
                  </div>
                </div>
              </div>
            </div>

            {/* What's included */}
            <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Eye className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">AI Visibility Score</h3>
                <p className="text-slate-400 text-sm">See how well AI assistants can parse and cite your content</p>
              </div>

              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Citation Rate</h3>
                <p className="text-slate-400 text-sm">Percentage of queries where your site gets mentioned</p>
              </div>

              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Top Recommendation</h3>
                <p className="text-slate-400 text-sm">One actionable tip to improve your AI discoverability</p>
              </div>
            </div>

          </>
        ) : (
          <>
            {/* Post-report: Show results */}
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <div className="inline-flex items-center space-x-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-6">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-300 text-sm font-medium">Comprehensive Report Ready</span>
                </div>

                <h1 className="text-3xl font-bold text-white mb-4">
                  Your AI Visibility Report
                </h1>
                <p className="text-slate-400">
                  Results for <span className="text-white font-medium">{website}</span>
                  <span className="ml-2 px-2 py-0.5 bg-slate-700 rounded text-xs">{reportData?.industryCategory}</span>
                </p>
              </div>

              {/* Main Score Cards */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center">
                  <p className="text-slate-400 text-sm mb-2">AI Visibility Score</p>
                  <p className={`text-5xl font-bold ${getScoreColor(reportData?.aiVisibilityScore || 0)}`}>
                    {reportData?.aiVisibilityScore}
                  </p>
                  <p className={`text-sm mt-1 ${getScoreColor(reportData?.aiVisibilityScore || 0)}`}>
                    {getScoreLabel(reportData?.aiVisibilityScore || 0)}
                  </p>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center">
                  <p className="text-slate-400 text-sm mb-2">Citation Rate</p>
                  <p className={`text-5xl font-bold ${(reportData?.citationRate || 0) >= 40 ? 'text-green-500' : (reportData?.citationRate || 0) > 0 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {reportData?.citationRate}%
                  </p>
                  <p className="text-slate-500 text-sm mt-1">
                    {reportData?.citedQueries}/{reportData?.totalQueries} queries
                  </p>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center">
                  <p className="text-slate-400 text-sm mb-2">Competitors Found</p>
                  <p className={`text-5xl font-bold ${(reportData?.competitorSummary?.length || 0) > 3 ? 'text-red-500' : (reportData?.competitorSummary?.length || 0) > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                    {reportData?.competitorSummary?.length || 0}
                  </p>
                  <p className="text-slate-500 text-sm mt-1">
                    Getting AI citations
                  </p>
                </div>
              </div>

              {/* Estimated Impact */}
              {reportData?.estimatedMissedTraffic && reportData.estimatedMissedTraffic.monthly > 0 && (
                <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-xl p-6 mb-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <AlertTriangle className="w-6 h-6 text-orange-400" />
                    <h3 className="text-white font-semibold">Estimated Missed Traffic</h3>
                  </div>
                  <p className="text-slate-300 text-sm mb-3">
                    Based on your citation gaps, you may be missing out on:
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-orange-400">{reportData.estimatedMissedTraffic.monthly}</p>
                      <p className="text-slate-500 text-xs">visitors/month</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-orange-400">{reportData.estimatedMissedTraffic.yearly.toLocaleString()}</p>
                      <p className="text-slate-500 text-xs">visitors/year</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Pages Analyzed */}
              {reportData?.crawlSummary && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
                    <Globe className="w-5 h-5 text-green-400" />
                    <span>Pages Analyzed</span>
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                      {reportData.crawlSummary.pagesAnalyzed} page{reportData.crawlSummary.pagesAnalyzed !== 1 ? 's' : ''}
                    </span>
                  </h3>

                  {/* Site Stats */}
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-white">{reportData.crawlSummary.totalWords.toLocaleString()}</p>
                      <p className="text-slate-500 text-xs">Words</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-white">{reportData.crawlSummary.totalHeadings}</p>
                      <p className="text-slate-500 text-xs">Headings</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                      <p className={`text-lg font-bold ${reportData.crawlSummary.totalSchemas > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {reportData.crawlSummary.totalSchemas}
                      </p>
                      <p className="text-slate-500 text-xs">Schema</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                      <p className={`text-lg font-bold ${reportData.crawlSummary.avgReadability >= 60 ? 'text-green-400' : reportData.crawlSummary.avgReadability >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {Math.round(reportData.crawlSummary.avgReadability)}
                      </p>
                      <p className="text-slate-500 text-xs">Readability</p>
                    </div>
                  </div>

                  {/* Page List */}
                  <div className="space-y-2">
                    {reportData.crawlSummary.pages.slice(0, 5).map((page, index) => (
                      <div key={index} className="flex items-center justify-between bg-slate-900/50 rounded-lg px-4 py-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-300 text-sm font-medium truncate">{page.title || 'Untitled'}</p>
                          <p className="text-slate-500 text-xs truncate">{page.url}</p>
                        </div>
                        <div className="flex items-center space-x-3 ml-4 text-xs text-slate-500">
                          <span>{page.wordCount} words</span>
                          {page.schemaCount > 0 && (
                            <span className="text-green-400">{page.schemaCount} schema</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Query-by-Query Results */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
                <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
                  <Search className="w-5 h-5 text-blue-400" />
                  <span>Query-by-Query Results</span>
                </h3>
                <div className="space-y-3">
                  {reportData?.queryResults?.map((result, index) => (
                    <div key={index} className="bg-slate-900/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-500 uppercase tracking-wide">
                          {QUERY_TYPES[result.queryType as keyof typeof QUERY_TYPES]?.icon} {QUERY_TYPES[result.queryType as keyof typeof QUERY_TYPES]?.label || result.queryType}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${result.isCited ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {result.isCited ? 'CITED' : 'NOT CITED'}
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm italic mb-2">"{result.promptText}"</p>
                      {result.competitors.length > 0 && (
                        <div className="flex items-center space-x-2 text-xs text-slate-500">
                          <Users className="w-3 h-3" />
                          <span>Competitors cited: {result.competitors.slice(0, 3).map(c => c.domain).join(', ')}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-slate-500 text-xs mt-3">Powered by Perplexity AI</p>
              </div>

              {/* Competitor Leaderboard */}
              {reportData?.competitorSummary && reportData.competitorSummary.length > 0 && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
                    <Award className="w-5 h-5 text-yellow-400" />
                    <span>Competitor Citation Leaderboard</span>
                  </h3>
                  <p className="text-slate-400 text-sm mb-4">
                    These competitors are getting cited by AI - they're your biggest threat:
                  </p>
                  <div className="space-y-2">
                    {reportData.competitorSummary.map((comp, index) => (
                      <div key={index} className="flex items-center justify-between bg-slate-900/50 rounded-lg px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-500 text-yellow-900' : index === 1 ? 'bg-gray-300 text-gray-700' : index === 2 ? 'bg-orange-400 text-orange-900' : 'bg-slate-600 text-slate-300'}`}>
                            {index + 1}
                          </span>
                          <span className="text-slate-300 font-medium">{comp.domain}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-slate-400">
                            {comp.citationCount} citation{comp.citationCount !== 1 ? 's' : ''}
                          </span>
                          <a
                            href={`https://${comp.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 hover:text-blue-400 transition-colors"
                            title={`Visit ${comp.domain}`}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Personalized Recommendations */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
                <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
                  <Target className="w-5 h-5 text-indigo-400" />
                  <span>Your Personalized Action Plan</span>
                </h3>
                <div className="space-y-4">
                  {reportData?.recommendations?.map((rec, index) => (
                    <div key={index} className={`border-l-4 pl-4 py-2 ${rec.priority === 'high' ? 'border-red-500' : rec.priority === 'medium' ? 'border-yellow-500' : 'border-blue-500'}`}>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`text-xs uppercase tracking-wide font-bold ${rec.priority === 'high' ? 'text-red-400' : rec.priority === 'medium' ? 'text-yellow-400' : 'text-blue-400'}`}>
                          {rec.priority} priority
                        </span>
                      </div>
                      <h4 className="text-white font-medium mb-1">{rec.title}</h4>
                      <p className="text-slate-400 text-sm">{rec.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upgrade CTA */}
              <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 rounded-xl p-6 text-center">
                <h3 className="text-white font-semibold text-lg mb-2">
                  Want the Full Analysis?
                </h3>
                <p className="text-slate-300 text-sm mb-4">
                  Get detailed citation tracking across 4 AI providers, competitor analysis, and actionable recommendations.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={onGetStarted}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all flex items-center space-x-2"
                  >
                    <span>Start Free Trial</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <span className="text-slate-500 text-sm">No credit card required</span>
                </div>

                <div className="flex items-center justify-center space-x-4 mt-4 text-slate-400 text-xs">
                  <span className="flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>10 analyses/month</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>4 AI providers</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Competitor tracking</span>
                  </span>
                </div>
              </div>

              {/* Share */}
              <div className="mt-8 text-center">
                <p className="text-slate-500 text-sm mb-3">Share your score</p>
                <div className="flex items-center justify-center space-x-3">
                  <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors">
                    Twitter
                  </button>
                  <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors">
                    LinkedIn
                  </button>
                  <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors">
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between text-slate-500 text-sm">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Shield className="w-4 h-4" />
              <span>Your data is secure and never shared</span>
            </div>
            <div className="flex items-center space-x-6">
              <a href="#privacy" className="hover:text-slate-300 transition-colors">Privacy</a>
              <a href="#terms" className="hover:text-slate-300 transition-colors">Terms</a>
              <a href="#pricing" className="hover:text-slate-300 transition-colors">Pricing</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
