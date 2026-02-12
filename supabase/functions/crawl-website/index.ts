import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser, Element } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";
import { withRateLimit, RATE_LIMITS } from "../_shared/rateLimiter.ts";
import { getCorsHeaders, handleCorsPreflightWithValidation, validateOrigin } from "../_shared/cors.ts";

// Configuration
const MAX_PAGES = 6; // Max pages to crawl (homepage + 5 subpages)
const CRAWL_TIMEOUT = 8000; // 8 seconds per page
const IMPORTANT_PATHS = ['/blog', '/services', '/about', '/contact', '/pricing', '/features', '/products', '/faq', '/help'];
const SPA_DETECTION_THRESHOLD = 100; // Word count below this suggests SPA
const JINA_READER_BASE_URL = 'https://r.jina.ai/';

// AI Crawlers to check in robots.txt
const AI_CRAWLERS = [
  // Search/Citation Crawlers (Important for AI visibility)
  { name: 'OAI-SearchBot', description: 'ChatGPT Search', isSearchCrawler: true },
  { name: 'PerplexityBot', description: 'Perplexity Search', isSearchCrawler: true },
  { name: 'ChatGPT-User', description: 'ChatGPT Browsing', isSearchCrawler: true },
  { name: 'Applebot-Extended', description: 'Apple Intelligence', isSearchCrawler: true },
  // Training Crawlers (Optional to block)
  { name: 'GPTBot', description: 'OpenAI Training', isSearchCrawler: false },
  { name: 'ClaudeBot', description: 'Claude Training', isSearchCrawler: false },
  { name: 'Claude-Web', description: 'Claude Web', isSearchCrawler: false },
  { name: 'anthropic-ai', description: 'Anthropic AI', isSearchCrawler: false },
  { name: 'Google-Extended', description: 'Gemini Training', isSearchCrawler: false },
  { name: 'Googlebot-Extended', description: 'Google AI Features', isSearchCrawler: false },
  { name: 'Meta-ExternalAgent', description: 'Meta AI Training', isSearchCrawler: false },
  { name: 'Meta-ExternalFetcher', description: 'Meta AI Fetcher', isSearchCrawler: false },
  { name: 'FacebookBot', description: 'Meta/Facebook AI', isSearchCrawler: false },
  { name: 'cohere-ai', description: 'Cohere AI', isSearchCrawler: false },
  { name: 'Bytespider', description: 'ByteDance/TikTok AI', isSearchCrawler: false },
  { name: 'CCBot', description: 'Common Crawl (AI Training)', isSearchCrawler: false },
  { name: 'Amazonbot', description: 'Amazon AI', isSearchCrawler: false },
];

// Types for AI readiness analysis
type AICrawlerStatus = 'allowed' | 'blocked' | 'not_specified';

interface AICrawlerRule {
  crawler: string;
  description: string;
  status: AICrawlerStatus;
  isSearchCrawler: boolean;
}

interface RobotsTxtAnalysis {
  exists: boolean;
  fetchError?: string;
  crawlers: AICrawlerRule[];
  hasBlockedSearchCrawlers: boolean;
  hasBlockedTrainingCrawlers: boolean;
}

interface AIPlatformRecommendation {
  platform: string;
  url: string;
  description: string;
  applicable: boolean;
  reason: string;
}

interface AIReadinessAnalysis {
  robotsTxt: RobotsTxtAnalysis;
  platformRecommendations: AIPlatformRecommendation[];
  isEcommerce: boolean;
  overallStatus: 'good' | 'warning' | 'critical';
  issues: string[];
}

interface Heading {
  level: number;
  text: string;
  hasDirectAnswer: boolean;
  followingContent: string;
}

interface SchemaMarkup {
  type: string;
  properties: Record<string, unknown>;
}

interface PageData {
  url: string;
  title: string;
  metaDescription: string;
  headings: Heading[];
  schemaMarkup: SchemaMarkup[];
  contentStats: {
    wordCount: number;
    paragraphCount: number;
    avgSentenceLength: number;
    readabilityScore: number;
  };
  technicalSignals: {
    hasCanonical: boolean;
    hasOpenGraph: boolean;
    hasTwitterCard: boolean;
    loadTime: number;
    mobileViewport: boolean;
    hasHttps: boolean;
  };
  blufAnalysis: {
    score: number;
    directAnswers: { heading: string; answer: string }[];
    totalHeadings: number;
    headingsWithDirectAnswers: number;
  };
  keywordAnalysis: {
    titleContainsKeyword: boolean;
    h1ContainsKeyword: boolean;
    metaContainsKeyword: boolean;
    keywordDensity: number;
    keywordOccurrences: number;
  };
}

interface SPADetectionInfo {
  detected: boolean;
  usedJinaFallback: boolean;
  originalWordCount?: number;
}

interface CrawlResult {
  success: boolean;
  data?: PageData & {
    // Multi-page data
    pagesAnalyzed: number;
    pages: {
      url: string;
      title: string;
      wordCount: number;
      headingsCount: number;
      schemaCount: number;
      issues: string[];
    }[];
    aggregatedStats: {
      totalWords: number;
      totalHeadings: number;
      totalSchemas: number;
      avgReadability: number;
      pagesWithSchema: number;
      pagesWithMeta: number;
    };
    // SPA detection info
    spaDetection?: SPADetectionInfo;
  };
  error?: string;
}

// Detect if a page is likely a JavaScript SPA (low initial content)
function isLikelySPA(wordCount: number, headingsCount: number, hasReactRoot: boolean): boolean {
  // Signs of SPA: very low word count, no headings, has React/Vue root element
  if (hasReactRoot && wordCount < SPA_DETECTION_THRESHOLD) return true;
  if (wordCount < 50 && headingsCount === 0) return true;
  return false;
}

// Check if HTML contains SPA framework root elements
function hasSPAFrameworkRoot(html: string): boolean {
  const spaPatterns = [
    /<div\s+id=["']root["']/i,        // React
    /<div\s+id=["']app["']/i,         // Vue
    /<div\s+id=["']__next["']/i,      // Next.js
    /<div\s+id=["']__nuxt["']/i,      // Nuxt.js
    /ng-app|ng-controller/i,           // Angular
    /<script[^>]*type=["']module["']/i // Modern SPA bundler
  ];
  return spaPatterns.some(pattern => pattern.test(html));
}

// Fetch rendered content via Jina Reader API (for SPAs)
// Returns markdown format which is more reliable to parse than HTML
async function fetchRenderedContent(url: string): Promise<{ html: string; text: string } | null> {
  try {
    console.log(`Fetching rendered content via Jina Reader for: ${url}`);

    // Use default format (markdown) - more reliable than HTML for parsing
    const response = await fetch(`${JINA_READER_BASE_URL}${url}`, {
      headers: {
        'Accept': 'text/plain',
      },
      signal: AbortSignal.timeout(15000), // 15 second timeout for JS rendering
    });

    if (!response.ok) {
      console.log(`Jina Reader failed: ${response.status}`);
      return null;
    }

    const content = await response.text();
    console.log(`Jina Reader returned ${content.length} characters`);

    // Always treat as text/markdown - more reliable parsing
    return { html: '', text: content };
  } catch (error) {
    console.log('Jina Reader error:', error);
    return null;
  }
}

// Helper to get following content lines after a heading
function getFollowingLinesContent(allLines: string[], startIndex: number): string {
  const followingLines: string[] = [];
  let charCount = 0;
  const maxChars = 200;

  for (let i = startIndex + 1; i < allLines.length && charCount < maxChars; i++) {
    const line = allLines[i].trim();
    // Stop at next heading (ATX or setext underline)
    if (line.match(/^#{1,6}\s/) || line.match(/^[-=]{3,}$/)) break;
    if (line.length > 0) {
      followingLines.push(line);
      charCount += line.length;
    }
  }

  return followingLines.join(' ').substring(0, 200);
}

// Parse content from Jina Reader text response (markdown-like)
function parseJinaTextContent(text: string): {
  headings: Heading[];
  wordCount: number;
  paragraphCount: number;
} {
  // Skip Jina metadata header (Title:, URL Source:, Markdown Content:)
  let cleanText = text;
  const markdownContentMatch = text.match(/Markdown Content:\s*\n([\s\S]*)/i);
  if (markdownContentMatch) {
    cleanText = markdownContentMatch[1];
  }

  const allLines = cleanText.split('\n');
  const lines = allLines.filter(line => line.trim());
  const headings: Heading[] = [];
  let paragraphCount = 0;

  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i];
    const trimmedLine = line.trim();

    // Detect ATX-style headings (# Heading)
    const atxMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
    if (atxMatch) {
      const level = atxMatch[1].length;
      const headingText = atxMatch[2].trim();
      const followingContent = getFollowingLinesContent(allLines, i);

      headings.push({
        level,
        text: headingText,
        hasDirectAnswer: isDirectAnswer(followingContent),
        followingContent,
      });
      continue;
    }

    // Detect setext-style headings (Heading\n======= or Heading\n-------)
    if (i + 1 < allLines.length && trimmedLine.length > 0) {
      const nextLine = allLines[i + 1].trim();
      // H1: ====== (at least 3 equals)
      if (nextLine.match(/^={3,}$/)) {
        const followingContent = getFollowingLinesContent(allLines, i + 1);
        headings.push({
          level: 1,
          text: trimmedLine,
          hasDirectAnswer: isDirectAnswer(followingContent),
          followingContent,
        });
        continue;
      }
      // H2: ------ (at least 3 dashes)
      if (nextLine.match(/^-{3,}$/)) {
        const followingContent = getFollowingLinesContent(allLines, i + 1);
        headings.push({
          level: 2,
          text: trimmedLine,
          hasDirectAnswer: isDirectAnswer(followingContent),
          followingContent,
        });
        continue;
      }
    }

    // Count paragraphs (lines with substantial content)
    if (trimmedLine.length > 50 && !trimmedLine.match(/^[-=]{3,}$/)) {
      paragraphCount++;
    }
  }

  const words = cleanText.split(/\s+/).filter(w => w.length > 0);

  return {
    headings,
    wordCount: words.length,
    paragraphCount,
  };
}

// Calculate Flesch-Kincaid readability score
function calculateReadability(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.trim().length > 0);
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0);

  if (sentences.length === 0 || words.length === 0) return 50;

  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Flesch Reading Ease formula
  const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);

  // Normalize to 0-100 scale
  return Math.max(0, Math.min(100, score));
}

// Count syllables in a word (approximation)
function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;

  const vowels = 'aeiouy';
  let count = 0;
  let prevWasVowel = false;

  for (const char of word) {
    const isVowel = vowels.includes(char);
    if (isVowel && !prevWasVowel) count++;
    prevWasVowel = isVowel;
  }

  // Handle silent e
  if (word.endsWith('e')) count--;

  return Math.max(1, count);
}

// Check if text starts with a direct answer pattern
function isDirectAnswer(text: string): boolean {
  if (!text || text.trim().length < 20) return false;

  const trimmed = text.trim();

  // Patterns that indicate a direct answer
  const directPatterns = [
    /^[A-Z][^.!?]*\s+(is|are|was|were|means|refers to|describes|involves)\s+/i,
    /^(The|A|An)\s+\w+\s+(is|are|means|involves)/i,
    /^(Yes|No|Generally|Typically|Usually|Often|Sometimes),?\s+/i,
    /^(To|In order to)\s+\w+,?\s+/i,
    /^\d+[\s\w]*:/,  // Numbered list
    /^(First|Second|Third|Finally|Lastly),?\s+/i,
  ];

  for (const pattern of directPatterns) {
    if (pattern.test(trimmed)) return true;
  }

  // Check if first sentence is concise (under 150 chars) - good for BLUF
  const firstSentence = trimmed.split(/[.!?]/)[0];
  if (firstSentence && firstSentence.length < 150 && firstSentence.length > 30) {
    return true;
  }

  return false;
}

// Extract text content following a heading
function getFollowingContent(heading: Element, doc: Document): string {
  let content = '';
  let sibling = heading.nextElementSibling;
  let charCount = 0;
  const maxChars = 500;

  while (sibling && charCount < maxChars) {
    const tagName = sibling.tagName?.toLowerCase();

    // Stop at next heading
    if (tagName && /^h[1-6]$/.test(tagName)) break;

    // Get text content from paragraphs, lists, etc.
    if (['p', 'ul', 'ol', 'div', 'span', 'li'].includes(tagName || '')) {
      const text = sibling.textContent?.trim() || '';
      content += text + ' ';
      charCount += text.length;
    }

    sibling = sibling.nextElementSibling;
  }

  return content.trim();
}

// Parse JSON-LD schema markup
function extractSchemaMarkup(doc: Document): SchemaMarkup[] {
  const schemas: SchemaMarkup[] = [];
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');

  scripts.forEach((script) => {
    try {
      const content = script.textContent;
      if (!content) return;

      const json = JSON.parse(content);

      // Handle single schema or array
      const items = Array.isArray(json) ? json : [json];

      for (const item of items) {
        if (item['@type']) {
          schemas.push({
            type: item['@type'],
            properties: item,
          });
        }

        // Handle @graph format
        if (item['@graph'] && Array.isArray(item['@graph'])) {
          for (const graphItem of item['@graph']) {
            if (graphItem['@type']) {
              schemas.push({
                type: graphItem['@type'],
                properties: graphItem,
              });
            }
          }
        }
      }
    } catch {
      // Invalid JSON, skip
    }
  });

  return schemas;
}

// Extract internal links from a page
function extractInternalLinks(doc: Document, baseUrl: URL): string[] {
  const links: Set<string> = new Set();
  const anchors = doc.querySelectorAll('a[href]');

  anchors.forEach((anchor) => {
    const href = anchor.getAttribute('href');
    if (!href) return;

    try {
      // Resolve relative URLs
      const linkUrl = new URL(href, baseUrl.origin);

      // Only include same-domain links
      if (linkUrl.hostname !== baseUrl.hostname) return;

      // Skip non-HTML resources
      const path = linkUrl.pathname.toLowerCase();
      if (path.match(/\.(pdf|jpg|jpeg|png|gif|svg|css|js|xml|json|zip|mp3|mp4|webp)$/)) return;

      // Skip anchors and query strings for cleaner URLs
      linkUrl.hash = '';
      linkUrl.search = '';

      // Normalize trailing slash
      const normalizedPath = linkUrl.pathname.replace(/\/$/, '') || '/';
      linkUrl.pathname = normalizedPath;

      links.add(linkUrl.toString());
    } catch {
      // Invalid URL, skip
    }
  });

  return Array.from(links);
}

// Prioritize important pages
function prioritizeLinks(links: string[], baseUrl: URL): string[] {
  const prioritized: string[] = [];
  const others: string[] = [];

  for (const link of links) {
    try {
      const url = new URL(link);
      const path = url.pathname.toLowerCase();

      // Check if it's an important path
      const isImportant = IMPORTANT_PATHS.some(p =>
        path === p || path.startsWith(p + '/') || path.startsWith(p + '-')
      );

      if (isImportant) {
        prioritized.push(link);
      } else if (path !== '/' && path.split('/').length <= 3) {
        // Include shallow pages but not deeply nested ones
        others.push(link);
      }
    } catch {
      // Skip invalid URLs
    }
  }

  // Return prioritized first, then others, limited to MAX_PAGES - 1 (excluding homepage)
  return [...prioritized, ...others].slice(0, MAX_PAGES - 1);
}

// Analyze keyword presence
function analyzeKeywords(
  bodyText: string,
  title: string,
  metaDescription: string,
  h1Text: string,
  keywords: string[]
): PageData['keywordAnalysis'] {
  const lowerBody = bodyText.toLowerCase();
  const lowerTitle = title.toLowerCase();
  const lowerMeta = metaDescription.toLowerCase();
  const lowerH1 = h1Text.toLowerCase();

  let totalOccurrences = 0;
  let titleMatch = false;
  let h1Match = false;
  let metaMatch = false;

  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase().trim();
    if (!lowerKeyword) continue;

    if (lowerTitle.includes(lowerKeyword)) titleMatch = true;
    if (lowerH1.includes(lowerKeyword)) h1Match = true;
    if (lowerMeta.includes(lowerKeyword)) metaMatch = true;

    // Count occurrences in body
    const regex = new RegExp(lowerKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = lowerBody.match(regex);
    if (matches) totalOccurrences += matches.length;
  }

  const wordCount = bodyText.split(/\s+/).length;
  const density = wordCount > 0 ? (totalOccurrences / wordCount) * 100 : 0;

  return {
    titleContainsKeyword: titleMatch,
    h1ContainsKeyword: h1Match,
    metaContainsKeyword: metaMatch,
    keywordDensity: Math.round(density * 100) / 100,
    keywordOccurrences: totalOccurrences,
  };
}

// Parse page data from an already-parsed document
function parsePageData(doc: Document, url: string, keywords: string[], loadTime: number): PageData {
  const targetUrl = new URL(url);

  // Extract title
  const titleEl = doc.querySelector('title');
  const title = titleEl?.textContent?.trim() || '';

  // Extract meta description
  const metaDescEl = doc.querySelector('meta[name="description"]');
  const metaDescription = metaDescEl?.getAttribute('content')?.trim() || '';

  // Extract headings with BLUF analysis
  const headings: Heading[] = [];
  const headingEls = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

  headingEls.forEach((el) => {
    const element = el as Element;
    const level = parseInt(element.tagName.charAt(1));
    const text = element.textContent?.trim() || '';
    const followingContent = getFollowingContent(element, doc);

    headings.push({
      level,
      text,
      hasDirectAnswer: isDirectAnswer(followingContent),
      followingContent: followingContent.substring(0, 200),
    });
  });

  // Get H1 text for keyword analysis
  const h1El = doc.querySelector('h1');
  const h1Text = h1El?.textContent?.trim() || '';

  // Extract schema markup
  const schemaMarkup = extractSchemaMarkup(doc);

  // Get body text for analysis
  const bodyEl = doc.querySelector('body');
  const bodyText = bodyEl?.textContent?.replace(/\s+/g, ' ').trim() || '';

  // Calculate content stats
  const words = bodyText.split(/\s+/).filter(w => w.length > 0);
  const sentences = bodyText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = doc.querySelectorAll('p');

  const contentStats = {
    wordCount: words.length,
    paragraphCount: paragraphs.length,
    avgSentenceLength: sentences.length > 0 ? Math.round(words.length / sentences.length) : 0,
    readabilityScore: Math.round(calculateReadability(bodyText)),
  };

  // Technical signals
  const technicalSignals = {
    hasCanonical: !!doc.querySelector('link[rel="canonical"]'),
    hasOpenGraph: !!doc.querySelector('meta[property^="og:"]'),
    hasTwitterCard: !!doc.querySelector('meta[name^="twitter:"]'),
    loadTime,
    mobileViewport: !!doc.querySelector('meta[name="viewport"]'),
    hasHttps: targetUrl.protocol === 'https:',
  };

  // BLUF Analysis
  const headingsWithAnswers = headings.filter(h => h.hasDirectAnswer);
  const directAnswers = headingsWithAnswers.map(h => ({
    heading: h.text,
    answer: h.followingContent,
  }));

  const blufScore = headings.length > 0
    ? Math.round((headingsWithAnswers.length / headings.length) * 100)
    : 0;

  const blufAnalysis = {
    score: blufScore,
    directAnswers,
    totalHeadings: headings.length,
    headingsWithDirectAnswers: headingsWithAnswers.length,
  };

  // Keyword analysis
  const keywordAnalysis = analyzeKeywords(
    bodyText,
    title,
    metaDescription,
    h1Text,
    keywords
  );

  return {
    url,
    title,
    metaDescription,
    headings,
    schemaMarkup,
    contentStats,
    technicalSignals,
    blufAnalysis,
    keywordAnalysis,
  };
}

// Crawl a single page
async function crawlPage(url: string, keywords: string[]): Promise<PageData | null> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CRAWL_TIMEOUT);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LLMNavigator/1.0; +https://llmnavigator.com/bot)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }

    const html = await response.text();
    const loadTime = Date.now() - startTime;

    // Parse HTML
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) return null;

    const targetUrl = new URL(url);

    // Extract title
    const titleEl = doc.querySelector('title');
    const title = titleEl?.textContent?.trim() || '';

    // Extract meta description
    const metaDescEl = doc.querySelector('meta[name="description"]');
    const metaDescription = metaDescEl?.getAttribute('content')?.trim() || '';

    // Extract headings with BLUF analysis
    const headings: Heading[] = [];
    const headingEls = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

    headingEls.forEach((el) => {
      const element = el as Element;
      const level = parseInt(element.tagName.charAt(1));
      const text = element.textContent?.trim() || '';
      const followingContent = getFollowingContent(element, doc);

      headings.push({
        level,
        text,
        hasDirectAnswer: isDirectAnswer(followingContent),
        followingContent: followingContent.substring(0, 200),
      });
    });

    // Get H1 text for keyword analysis
    const h1El = doc.querySelector('h1');
    const h1Text = h1El?.textContent?.trim() || '';

    // Extract schema markup
    const schemaMarkup = extractSchemaMarkup(doc);

    // Get body text for analysis
    const bodyEl = doc.querySelector('body');
    const bodyText = bodyEl?.textContent?.replace(/\s+/g, ' ').trim() || '';

    // Calculate content stats
    const words = bodyText.split(/\s+/).filter(w => w.length > 0);
    const sentences = bodyText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = doc.querySelectorAll('p');

    const contentStats = {
      wordCount: words.length,
      paragraphCount: paragraphs.length,
      avgSentenceLength: sentences.length > 0 ? Math.round(words.length / sentences.length) : 0,
      readabilityScore: Math.round(calculateReadability(bodyText)),
    };

    // Technical signals
    const technicalSignals = {
      hasCanonical: !!doc.querySelector('link[rel="canonical"]'),
      hasOpenGraph: !!doc.querySelector('meta[property^="og:"]'),
      hasTwitterCard: !!doc.querySelector('meta[name^="twitter:"]'),
      loadTime,
      mobileViewport: !!doc.querySelector('meta[name="viewport"]'),
      hasHttps: targetUrl.protocol === 'https:',
    };

    // BLUF Analysis
    const headingsWithAnswers = headings.filter(h => h.hasDirectAnswer);
    const directAnswers = headingsWithAnswers.map(h => ({
      heading: h.text,
      answer: h.followingContent,
    }));

    const blufScore = headings.length > 0
      ? Math.round((headingsWithAnswers.length / headings.length) * 100)
      : 0;

    const blufAnalysis = {
      score: blufScore,
      directAnswers,
      totalHeadings: headings.length,
      headingsWithDirectAnswers: headingsWithAnswers.length,
    };

    // Keyword analysis
    const keywordAnalysis = analyzeKeywords(
      bodyText,
      title,
      metaDescription,
      h1Text,
      keywords
    );

    return {
      url,
      title,
      metaDescription,
      headings,
      schemaMarkup,
      contentStats,
      technicalSignals,
      blufAnalysis,
      keywordAnalysis,
    };
  } catch (error) {
    console.log(`Error crawling ${url}:`, error);
    return null;
  }
}

// Fetch and parse robots.txt for AI crawlers
async function analyzeRobotsTxt(baseUrl: URL): Promise<RobotsTxtAnalysis> {
  const robotsUrl = `${baseUrl.origin}/robots.txt`;

  try {
    const response = await fetch(robotsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LLMNavigator/1.0)',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return {
        exists: false,
        fetchError: `HTTP ${response.status}`,
        crawlers: AI_CRAWLERS.map(c => ({
          crawler: c.name,
          description: c.description,
          status: 'not_specified' as AICrawlerStatus,
          isSearchCrawler: c.isSearchCrawler,
        })),
        hasBlockedSearchCrawlers: false,
        hasBlockedTrainingCrawlers: false,
      };
    }

    const content = await response.text();
    const crawlerRules: AICrawlerRule[] = [];

    // Parse robots.txt for each AI crawler
    for (const crawler of AI_CRAWLERS) {
      const status = parseRobotsTxtForCrawler(content, crawler.name);
      crawlerRules.push({
        crawler: crawler.name,
        description: crawler.description,
        status,
        isSearchCrawler: crawler.isSearchCrawler,
      });
    }

    const hasBlockedSearchCrawlers = crawlerRules.some(
      r => r.isSearchCrawler && r.status === 'blocked'
    );
    const hasBlockedTrainingCrawlers = crawlerRules.some(
      r => !r.isSearchCrawler && r.status === 'blocked'
    );

    return {
      exists: true,
      crawlers: crawlerRules,
      hasBlockedSearchCrawlers,
      hasBlockedTrainingCrawlers,
    };
  } catch (error) {
    console.log('Error fetching robots.txt:', error);
    return {
      exists: false,
      fetchError: error instanceof Error ? error.message : 'Unknown error',
      crawlers: AI_CRAWLERS.map(c => ({
        crawler: c.name,
        description: c.description,
        status: 'not_specified' as AICrawlerStatus,
        isSearchCrawler: c.isSearchCrawler,
      })),
      hasBlockedSearchCrawlers: false,
      hasBlockedTrainingCrawlers: false,
    };
  }
}

// Parse robots.txt content for a specific crawler
function parseRobotsTxtForCrawler(content: string, crawlerName: string): AICrawlerStatus {
  const lines = content.toLowerCase().split('\n');
  const crawlerLower = crawlerName.toLowerCase();

  let inCrawlerSection = false;
  let inWildcardSection = false;
  let crawlerDisallow = false;
  let crawlerAllow = false;
  let wildcardDisallow = false;
  let wildcardAllow = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (trimmed.startsWith('#') || trimmed === '') continue;

    // Check for user-agent directive
    if (trimmed.startsWith('user-agent:')) {
      const agent = trimmed.replace('user-agent:', '').trim();
      inCrawlerSection = agent === crawlerLower;
      inWildcardSection = agent === '*';
      continue;
    }

    // Check for disallow/allow directives
    if (trimmed.startsWith('disallow:')) {
      const path = trimmed.replace('disallow:', '').trim();
      if (path === '/' || path === '') {
        if (inCrawlerSection) crawlerDisallow = true;
        if (inWildcardSection) wildcardDisallow = true;
      }
    }

    if (trimmed.startsWith('allow:')) {
      const path = trimmed.replace('allow:', '').trim();
      if (path === '/') {
        if (inCrawlerSection) crawlerAllow = true;
        if (inWildcardSection) wildcardAllow = true;
      }
    }
  }

  // Specific crawler rules take precedence
  if (crawlerDisallow && !crawlerAllow) return 'blocked';
  if (crawlerAllow) return 'allowed';

  // Fall back to wildcard rules
  if (wildcardDisallow && !wildcardAllow) return 'blocked';
  if (wildcardAllow) return 'allowed';

  return 'not_specified';
}

// Check if site has Product schema (e-commerce indicator)
function hasProductSchema(schemas: SchemaMarkup[]): boolean {
  const ecommerceTypes = ['Product', 'Offer', 'AggregateOffer', 'ItemList', 'ShoppingCart'];
  return schemas.some(s =>
    ecommerceTypes.includes(s.type) ||
    (Array.isArray(s.type) && s.type.some(t => ecommerceTypes.includes(t)))
  );
}

// Generate AI platform registration recommendations
function generatePlatformRecommendations(
  isEcommerce: boolean,
  robotsTxt: RobotsTxtAnalysis
): AIPlatformRecommendation[] {
  const recommendations: AIPlatformRecommendation[] = [];

  // ChatGPT Merchant Portal - for e-commerce sites
  recommendations.push({
    platform: 'ChatGPT Merchant Portal',
    url: 'https://chatgpt.com/merchants',
    description: 'Submit your products to appear in ChatGPT shopping results with Instant Checkout',
    applicable: isEcommerce,
    reason: isEcommerce
      ? 'Product schema detected - submit your catalog for ChatGPT Shopping'
      : 'Not applicable - no e-commerce schema detected',
  });

  // Bing Webmaster Tools - for all sites (helps with ChatGPT browsing & Copilot)
  recommendations.push({
    platform: 'Bing Webmaster Tools',
    url: 'https://www.bing.com/webmasters',
    description: 'Improves visibility in ChatGPT browsing mode and Microsoft Copilot',
    applicable: true,
    reason: 'Recommended for all sites - Bing powers ChatGPT web browsing',
  });

  // Google Search Console - for all sites (helps with Gemini)
  recommendations.push({
    platform: 'Google Search Console',
    url: 'https://search.google.com/search-console',
    description: 'Improves visibility in Google Gemini responses',
    applicable: true,
    reason: 'Recommended for all sites - Google powers Gemini search',
  });

  return recommendations;
}

// Generate AI readiness analysis
function analyzeAIReadiness(
  robotsTxt: RobotsTxtAnalysis,
  schemas: SchemaMarkup[]
): AIReadinessAnalysis {
  const isEcommerce = hasProductSchema(schemas);
  const platformRecommendations = generatePlatformRecommendations(isEcommerce, robotsTxt);

  const issues: string[] = [];
  let overallStatus: 'good' | 'warning' | 'critical' = 'good';

  // Check for blocked search crawlers (critical)
  if (robotsTxt.hasBlockedSearchCrawlers) {
    issues.push('AI search crawlers are blocked in robots.txt - your site may be invisible to ChatGPT Search and Perplexity');
    overallStatus = 'critical';
  }

  // Check if robots.txt doesn't exist (warning)
  if (!robotsTxt.exists) {
    issues.push('No robots.txt found - consider adding one to explicitly allow AI crawlers');
    if (overallStatus !== 'critical') overallStatus = 'warning';
  }

  // Check if OAI-SearchBot specifically is blocked
  const oaiSearchBot = robotsTxt.crawlers.find(c => c.crawler === 'OAI-SearchBot');
  if (oaiSearchBot?.status === 'blocked') {
    issues.push('OAI-SearchBot is blocked - your site will not appear in ChatGPT Search results');
    overallStatus = 'critical';
  }

  // Check if PerplexityBot is blocked
  const perplexityBot = robotsTxt.crawlers.find(c => c.crawler === 'PerplexityBot');
  if (perplexityBot?.status === 'blocked') {
    issues.push('PerplexityBot is blocked - your site will not be cited by Perplexity');
    overallStatus = 'critical';
  }

  // E-commerce specific recommendation
  if (isEcommerce) {
    issues.push('E-commerce site detected - consider submitting to ChatGPT Merchant Portal');
    if (overallStatus === 'good') overallStatus = 'warning';
  }

  return {
    robotsTxt,
    platformRecommendations,
    isEcommerce,
    overallStatus,
    issues,
  };
}

// Get issues for a page
function getPageIssues(page: PageData): string[] {
  const issues: string[] = [];

  if (!page.title || page.title.length < 10) issues.push('Missing/short title');
  if (!page.metaDescription) issues.push('No meta description');
  if (page.schemaMarkup.length === 0) issues.push('No schema markup');
  if (page.headings.filter(h => h.level === 1).length === 0) issues.push('No H1');
  if (page.headings.filter(h => h.level === 1).length > 1) issues.push('Multiple H1s');
  if (page.contentStats.wordCount < 300) issues.push('Low word count');
  if (page.blufAnalysis.score < 30) issues.push('Poor BLUF score');

  return issues;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  const preflightResponse = handleCorsPreflightWithValidation(req);
  if (preflightResponse) return preflightResponse;

  // Validate origin
  const originError = validateOrigin(req);
  if (originError) return originError;

  // Apply rate limiting (standard endpoint)
  const rateLimit = withRateLimit(req, corsHeaders, RATE_LIMITS.standard);
  if (!rateLimit.allowed) {
    console.log('Rate limit exceeded for crawl-website');
    return rateLimit.response!;
  }

  try {
    const { url, keywords = [] } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "URL is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Validate URL
    let targetUrl: URL;
    try {
      targetUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid URL format" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`Starting multi-page crawl for ${targetUrl.origin}`);

    // Normalize the homepage URL
    const homepageUrl = targetUrl.origin + '/';
    console.log(`Homepage URL: ${homepageUrl}`);

    // Step 1: Fetch the homepage HTML once
    let homepageHtml: string;
    const homepageStartTime = Date.now();
    try {
      const response = await fetch(homepageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LLMNavigator/1.0; +https://llmnavigator.com/bot)',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      homepageHtml = await response.text();
      console.log(`Fetched homepage in ${Date.now() - homepageStartTime}ms, ${homepageHtml.length} chars`);
    } catch (error) {
      console.error('Failed to fetch homepage:', error);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch the homepage" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Parse homepage HTML
    let homepageDoc = new DOMParser().parseFromString(homepageHtml, "text/html");
    if (!homepageDoc) {
      return new Response(
        JSON.stringify({ success: false, error: "Failed to parse homepage HTML" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Step 2: Extract page data from homepage
    let homepage = parsePageData(homepageDoc, homepageUrl, keywords, Date.now() - homepageStartTime);

    // Step 2.1: Check if this is likely an SPA with minimal server-rendered content
    const hasSPARoot = hasSPAFrameworkRoot(homepageHtml);
    const isLikelySPASite = isLikelySPA(
      homepage.contentStats.wordCount,
      homepage.headings.length,
      hasSPARoot
    );

    let usedJinaFallback = false;

    if (isLikelySPASite) {
      console.log(`Detected likely SPA (${homepage.contentStats.wordCount} words, ${homepage.headings.length} headings, SPA root: ${hasSPARoot}). Trying Jina Reader...`);

      const renderedContent = await fetchRenderedContent(homepageUrl);

      if (renderedContent && renderedContent.text) {
        // Got text/markdown content, parse manually
        const parsedContent = parseJinaTextContent(renderedContent.text);
        console.log(`Jina Reader text: ${parsedContent.wordCount} words, ${parsedContent.headings.length} headings`);

        // Preserve schema from original HTML (static schema in index.html)
        // Jina markdown doesn't include <script> tags, so we keep the original
        const originalSchema = homepage.schemaMarkup;
        console.log(`Preserving ${originalSchema.length} schema(s) from original HTML`);

        // Update homepage with rendered content data
        homepage.contentStats.wordCount = parsedContent.wordCount;
        homepage.contentStats.paragraphCount = parsedContent.paragraphCount;
        homepage.headings = parsedContent.headings;
        homepage.schemaMarkup = originalSchema; // Keep original schema

          // Recalculate BLUF analysis
          const headingsWithAnswers = parsedContent.headings.filter(h => h.hasDirectAnswer);
          homepage.blufAnalysis = {
            score: parsedContent.headings.length > 0
              ? Math.round((headingsWithAnswers.length / parsedContent.headings.length) * 100)
              : 0,
            directAnswers: headingsWithAnswers.map(h => ({
              heading: h.text,
              answer: h.followingContent,
            })),
            totalHeadings: parsedContent.headings.length,
            headingsWithDirectAnswers: headingsWithAnswers.length,
          };

          // Recalculate readability
          homepage.contentStats.readabilityScore = Math.round(calculateReadability(renderedContent.text));

          usedJinaFallback = true;
      }

      if (!usedJinaFallback) {
        console.log('Jina Reader fallback failed, using original sparse content');
      }
    }

    // Step 2.5: Analyze robots.txt for AI crawlers (in parallel with other work)
    console.log('Analyzing robots.txt for AI crawlers...');
    const robotsTxtPromise = analyzeRobotsTxt(targetUrl);

    // Step 3: Extract and prioritize internal links
    const allLinks = extractInternalLinks(homepageDoc, targetUrl);
    console.log(`Found ${allLinks.length} internal links on homepage`);

    // Filter out homepage and prioritize important pages
    const homepageVariants = [
      homepageUrl,
      targetUrl.origin,
      targetUrl.origin + '/',
      homepageUrl.replace(/\/$/, ''),
    ];
    const filteredLinks = allLinks.filter(l => !homepageVariants.includes(l));
    const prioritizedLinks = prioritizeLinks(filteredLinks, targetUrl);

    console.log(`Prioritized ${prioritizedLinks.length} links for crawling: ${prioritizedLinks.join(', ')}`);

    // Step 3: Crawl additional pages in parallel
    const additionalPages: PageData[] = [];
    const crawlPromises = prioritizedLinks.map(link => crawlPage(link, keywords));
    const results = await Promise.allSettled(crawlPromises);

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        additionalPages.push(result.value);
      }
    }

    // Step 4: Combine all pages
    const allPages = [homepage, ...additionalPages];
    console.log(`Successfully crawled ${allPages.length} pages`);

    // Step 5: Calculate aggregated stats
    const aggregatedStats = {
      totalWords: allPages.reduce((sum, p) => sum + p.contentStats.wordCount, 0),
      totalHeadings: allPages.reduce((sum, p) => sum + p.headings.length, 0),
      totalSchemas: allPages.reduce((sum, p) => sum + p.schemaMarkup.length, 0),
      avgReadability: Math.round(
        allPages.reduce((sum, p) => sum + p.contentStats.readabilityScore, 0) / allPages.length
      ),
      pagesWithSchema: allPages.filter(p => p.schemaMarkup.length > 0).length,
      pagesWithMeta: allPages.filter(p => p.metaDescription.length > 0).length,
    };

    // Step 6: Aggregate schema markups from all pages (deduplicated by type)
    const allSchemas: SchemaMarkup[] = [];
    const seenTypes = new Set<string>();
    for (const page of allPages) {
      for (const schema of page.schemaMarkup) {
        if (!seenTypes.has(schema.type)) {
          seenTypes.add(schema.type);
          allSchemas.push(schema);
        }
      }
    }

    // Step 7: Combine headings from all pages
    const allHeadings = allPages.flatMap(p => p.headings);

    // Step 8: Recalculate BLUF score across all pages
    const totalHeadingsCount = allHeadings.length;
    const totalHeadingsWithAnswers = allHeadings.filter(h => h.hasDirectAnswer).length;
    const overallBlufScore = totalHeadingsCount > 0
      ? Math.round((totalHeadingsWithAnswers / totalHeadingsCount) * 100)
      : 0;

    // Step 9: Aggregate keyword analysis
    const aggregatedKeywords = {
      titleContainsKeyword: allPages.some(p => p.keywordAnalysis.titleContainsKeyword),
      h1ContainsKeyword: allPages.some(p => p.keywordAnalysis.h1ContainsKeyword),
      metaContainsKeyword: allPages.some(p => p.keywordAnalysis.metaContainsKeyword),
      keywordDensity: Math.round(
        (allPages.reduce((sum, p) => sum + p.keywordAnalysis.keywordDensity, 0) / allPages.length) * 100
      ) / 100,
      keywordOccurrences: allPages.reduce((sum, p) => sum + p.keywordAnalysis.keywordOccurrences, 0),
    };

    // Build pages summary
    const pagesSummary = allPages.map(p => ({
      url: p.url,
      title: p.title || 'Untitled',
      wordCount: p.contentStats.wordCount,
      headingsCount: p.headings.length,
      schemaCount: p.schemaMarkup.length,
      issues: getPageIssues(p),
    }));

    // Step 10: Analyze AI readiness (robots.txt + platform recommendations)
    const robotsTxtAnalysis = await robotsTxtPromise;
    const aiReadiness = analyzeAIReadiness(robotsTxtAnalysis, allSchemas);
    console.log(`AI Readiness: ${aiReadiness.overallStatus}, issues: ${aiReadiness.issues.length}`);

    // Build final result (using homepage as base but with aggregated data)
    const result: CrawlResult = {
      success: true,
      data: {
        // Base data from homepage
        url: homepage.url,
        title: homepage.title,
        metaDescription: homepage.metaDescription,
        // Aggregated headings
        headings: allHeadings.slice(0, 50), // Limit to first 50
        // Aggregated schemas
        schemaMarkup: allSchemas,
        // Aggregated content stats
        contentStats: {
          wordCount: aggregatedStats.totalWords,
          paragraphCount: allPages.reduce((sum, p) => sum + p.contentStats.paragraphCount, 0),
          avgSentenceLength: Math.round(
            allPages.reduce((sum, p) => sum + p.contentStats.avgSentenceLength, 0) / allPages.length
          ),
          readabilityScore: aggregatedStats.avgReadability,
        },
        // Use homepage technical signals
        technicalSignals: homepage.technicalSignals,
        // Aggregated BLUF analysis
        blufAnalysis: {
          score: overallBlufScore,
          directAnswers: allPages.flatMap(p => p.blufAnalysis.directAnswers).slice(0, 10),
          totalHeadings: totalHeadingsCount,
          headingsWithDirectAnswers: totalHeadingsWithAnswers,
        },
        // Aggregated keyword analysis
        keywordAnalysis: aggregatedKeywords,
        // Multi-page specific data
        pagesAnalyzed: allPages.length,
        pages: pagesSummary,
        aggregatedStats,
        // AI Readiness analysis
        aiReadiness,
        // SPA detection info
        spaDetection: isLikelySPASite ? {
          detected: true,
          usedJinaFallback,
          originalWordCount: hasSPARoot ? homepage.contentStats.wordCount : undefined,
        } : undefined,
      },
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error('Crawl error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
