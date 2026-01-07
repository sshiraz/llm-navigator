/**
 * Recommendations - Generate actionable recommendations from crawl data
 */
import type { Analysis } from '../../types';
import type { CrawlData } from '../../types/crawl';

// Generate specific recommendations from crawl data - in plain business language
export function generateRecommendationsFromCrawl(
  crawlData: CrawlData,
  metrics: Analysis['metrics']
): Analysis['recommendations'] {
  const recommendations: Analysis['recommendations'] = [];
  const { contentStats, blufAnalysis, schemaMarkup, technicalSignals, keywordAnalysis, headings, title, metaDescription } = crawlData;

  // Get schema types found
  const schemaTypes = schemaMarkup.map(s => s.type);

  // 1. TRUST SIGNALS - Help AI verify who you are
  if (schemaMarkup.length === 0) {
    recommendations.push({
      id: 'schema-1',
      title: 'Help AI Know Who You Are',
      description: `Right now, AI has no way to verify your business exists. Think of schema markup as your business ID card for AI.\n\nWhat to do: Ask your web developer to add "Organization schema" to your website. This tells AI your business name, website, and what you do.\n\nIf you use WordPress, install the "Yoast SEO" or "Rank Math" plugin - they add this automatically.`,
      priority: 'high',
      difficulty: 'medium',
      estimatedTime: '1 hour',
      expectedImpact: 25,
    });
  }

  // 2. FAQ SCHEMA - Big opportunity if they have question headings
  const questionHeadings = headings.filter(h =>
    h.text.includes('?') ||
    h.text.toLowerCase().startsWith('how') ||
    h.text.toLowerCase().startsWith('what') ||
    h.text.toLowerCase().startsWith('why') ||
    h.text.toLowerCase().startsWith('when') ||
    h.text.toLowerCase().startsWith('can ')
  );

  if (questionHeadings.length >= 2 && !schemaTypes.includes('FAQPage')) {
    const questionExamples = questionHeadings.slice(0, 3).map(h => `"${h.text}"`).join(', ');
    recommendations.push({
      id: 'schema-faq',
      title: 'Turn Your FAQs Into AI-Ready Content',
      description: `Great news! You have ${questionHeadings.length} questions on your site (like ${questionExamples}). These are exactly what people ask AI assistants.\n\nWhat to do: Add "FAQ schema" to mark these as official Q&As. This makes AI much more likely to use YOUR answers when people ask these questions.\n\nMost website builders (Squarespace, Wix, WordPress) have FAQ blocks that do this automatically.`,
      priority: 'high',
      difficulty: 'easy',
      estimatedTime: '30 minutes',
      expectedImpact: 20,
    });
  }

  // 3. DIRECT ANSWERS - Put the answer first
  if (blufAnalysis.score < 60) {
    const sectionsNeedingWork = blufAnalysis.totalHeadings - blufAnalysis.headingsWithDirectAnswers;
    recommendations.push({
      id: 'bluf-1',
      title: 'Put Your Answers First (Not Last)',
      description: `${sectionsNeedingWork} of your ${blufAnalysis.totalHeadings} sections bury the main point. AI reads the first sentence after each heading - if the answer isn't there, it moves on.\n\nWhat to do: For each section, put a 1-2 sentence answer right after the heading, THEN explain the details.\n\nBefore: "There are many factors to consider when choosing..."\nAfter: "The best choice is X because Y. Here's why..."`,
      priority: 'high',
      difficulty: 'medium',
      estimatedTime: '2 hours',
      expectedImpact: 18,
    });
  }

  // 4. KEYWORDS IN TITLE
  if (!keywordAnalysis.titleContainsKeyword) {
    recommendations.push({
      id: 'keyword-title',
      title: 'Add Your Main Topic to the Page Title',
      description: `Your page title is: "${title || '(no title found)'}"\n\nThe problem: Your target keywords aren't in the title. This is like naming your bakery "Bob's Place" instead of "Bob's Bakery" - AI won't know what you do.\n\nWhat to do: Rewrite your title to include your main keyword. Keep it under 60 characters.\n\nExample: "[What You Do] - [Benefit] | [Your Brand]"`,
      priority: 'high',
      difficulty: 'easy',
      estimatedTime: '10 minutes',
      expectedImpact: 15,
    });
  }

  // 5. META DESCRIPTION
  if (!metaDescription || metaDescription.length < 50) {
    recommendations.push({
      id: 'meta-desc',
      title: 'Write a Summary AI Can Use',
      description: `${!metaDescription ? 'Your page has no meta description.' : 'Your meta description is too short.'} This is the "elevator pitch" that tells AI what your page is about.\n\nWhat to do: Write a 150-160 character description that:\n• Says exactly what visitors will learn or get\n• Includes your main keyword naturally\n• Sounds like something a human would say\n\nExample: "Learn how to [solve problem] with our [solution]. [Benefit] for [who it's for]."`,
      priority: 'high',
      difficulty: 'easy',
      estimatedTime: '10 minutes',
      expectedImpact: 12,
    });
  } else if (!keywordAnalysis.metaContainsKeyword) {
    recommendations.push({
      id: 'keyword-meta',
      title: 'Include Your Keywords in the Description',
      description: `Your current description: "${metaDescription.substring(0, 80)}..."\n\nThe problem: Your target keywords aren't in this description. AI uses this to understand what your page is about.\n\nWhat to do: Rewrite to naturally include your main keywords. Don't stuff them in awkwardly - make it read naturally.`,
      priority: 'medium',
      difficulty: 'easy',
      estimatedTime: '10 minutes',
      expectedImpact: 8,
    });
  }

  // 6. MOBILE FRIENDLY
  if (!technicalSignals.mobileViewport) {
    recommendations.push({
      id: 'tech-mobile',
      title: 'Make Your Site Work on Phones',
      description: `Your site isn't set up for mobile devices. This is a big problem - most people use AI assistants on their phones, and AI won't recommend sites that don't work on mobile.\n\nWhat to do: If you have a web developer, ask them to add "mobile viewport meta tag." If you use a website builder, check your mobile preview settings.\n\nThis is usually a 5-minute fix that makes a big difference.`,
      priority: 'high',
      difficulty: 'easy',
      estimatedTime: '10 minutes',
      expectedImpact: 15,
    });
  }

  // 7. THIN CONTENT
  if (contentStats.wordCount < 800) {
    const wordsNeeded = Math.max(0, 1000 - contentStats.wordCount);
    recommendations.push({
      id: 'content-length',
      title: 'Add More Helpful Information',
      description: `Your page has ${contentStats.wordCount} words. AI prefers thorough content (1,000+ words) because it can give better answers.\n\nWhat to do: Add ${wordsNeeded}+ more words by answering questions your customers commonly ask:\n• What problem does this solve?\n• How does it work?\n• Who is it best for?\n• What makes you different?\n• What are common mistakes to avoid?`,
      priority: 'medium',
      difficulty: 'medium',
      estimatedTime: '2-3 hours',
      expectedImpact: 12,
    });
  }

  // 8. HARD TO READ
  if (contentStats.readabilityScore < 50) {
    recommendations.push({
      id: 'content-readability',
      title: 'Simplify Your Writing',
      description: `Your content is harder to read than it should be (readability score: ${contentStats.readabilityScore}/100). If AI struggles to understand your writing, it won't quote you.\n\nWhat to do:\n• Break long sentences into shorter ones (aim for 15-20 words)\n• Replace jargon with everyday words\n• Use bullet points for lists\n• Add paragraph breaks more often\n\nTip: Read your content out loud. If you run out of breath, the sentence is too long.`,
      priority: 'medium',
      difficulty: 'medium',
      estimatedTime: '1-2 hours',
      expectedImpact: 10,
    });
  }

  // 9. MISSING H1
  const h1Count = headings.filter(h => h.level === 1).length;
  const h2Count = headings.filter(h => h.level === 2).length;

  if (h1Count === 0) {
    recommendations.push({
      id: 'heading-h1',
      title: 'Add a Main Headline',
      description: `Your page is missing a main headline (H1). This is like a book without a title - AI doesn't know what the page is about.\n\nWhat to do: Add one H1 heading at the top of your page that clearly states what the page is about. Include your main keyword.\n\nExample: "The Complete Guide to [Your Topic]" or "[Your Service] for [Your Audience]"`,
      priority: 'high',
      difficulty: 'easy',
      estimatedTime: '5 minutes',
      expectedImpact: 15,
    });
  } else if (h1Count > 1) {
    recommendations.push({
      id: 'heading-h1-multiple',
      title: 'Use Only One Main Headline',
      description: `Your page has ${h1Count} main headlines (H1s). This confuses AI about what your page is really about - it's like a book with multiple titles.\n\nWhat to do: Keep the most important H1 and change the others to H2 subheadings. There should be exactly one H1 per page.`,
      priority: 'high',
      difficulty: 'easy',
      estimatedTime: '10 minutes',
      expectedImpact: 10,
    });
  }

  // 10. FEW SUBHEADINGS
  if (h2Count < 3 && contentStats.wordCount > 500) {
    recommendations.push({
      id: 'heading-structure',
      title: 'Break Up Your Content with Subheadings',
      description: `You have ${contentStats.wordCount} words but only ${h2Count} subheadings. This makes your content hard to scan and harder for AI to understand.\n\nWhat to do: Add a subheading (H2) every 200-300 words. Good subheadings:\n• Tell readers what the next section covers\n• Can be understood without reading everything else\n• Often work as questions people might ask`,
      priority: 'medium',
      difficulty: 'easy',
      estimatedTime: '20 minutes',
      expectedImpact: 8,
    });
  }

  // 11. OPEN GRAPH (lower priority)
  if (!technicalSignals.hasOpenGraph && recommendations.length < 6) {
    recommendations.push({
      id: 'tech-og',
      title: 'Improve How Your Links Look When Shared',
      description: `When someone shares your link, it shows a generic preview. Open Graph tags control how your page looks when shared on social media or in chat apps.\n\nWhat to do: Most website builders have a "Social sharing" or "SEO" section where you can set a title, description, and image for link previews. This takes 5 minutes and makes your links look more professional.`,
      priority: 'medium',
      difficulty: 'easy',
      estimatedTime: '15 minutes',
      expectedImpact: 5,
    });
  }

  // Sort by priority and expected impact
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.expectedImpact - a.expectedImpact;
  });

  // Return top 6 recommendations
  return recommendations.slice(0, 6);
}
