import jsPDF from 'jspdf';
import { Analysis } from '../types';

// Helper to convert score to confidence level
const getAIConfidence = (score: number): string => {
  if (score >= 75) return 'High';
  if (score >= 50) return 'Medium';
  return 'Low';
};

// Generate detailed insights based on metrics (same as MetricsBreakdown)
const generateDetailedInsights = (analysis: Analysis): string[] => {
  const insights: string[] = [];

  // Brand Clarity insights
  if (analysis.metrics.contentClarity >= 80) {
    insights.push("[OK] Brand Clarity: AI can easily understand what your business does. Your content is well-organized with clear headings and direct answers.");
  } else if (analysis.metrics.contentClarity >= 60) {
    insights.push("[!] Brand Clarity: Your message is coming through, but could be clearer. Try putting your main point at the start of each section.");
  } else {
    insights.push("[X] Brand Clarity: AI may struggle to understand your business. Add a clear one-sentence description on every page explaining what you offer.");
  }

  // Content Depth insights
  if (analysis.metrics.semanticRichness >= 80) {
    insights.push("[OK] Content Depth: Your content is thorough and comprehensive. AI has enough information to confidently recommend you.");
  } else if (analysis.metrics.semanticRichness >= 60) {
    insights.push("[!] Content Depth: You have a good start, but your pages could use more detail. Consider adding examples, FAQs, or step-by-step explanations.");
  } else {
    insights.push("[X] Content Depth: Your pages are too thin. AI prefers detailed content (800+ words per page) that fully answers visitor questions.");
  }

  // Trust Signals insights
  if (analysis.metrics.structuredData >= 80) {
    insights.push("[OK] Trust Signals: Great job with schema markup! AI can verify your business information and feels confident recommending you.");
  } else if (analysis.metrics.structuredData >= 60) {
    insights.push("[!] Trust Signals: You have some schema markup, but adding more (FAQ, Product, LocalBusiness) would help AI trust you more.");
  } else {
    insights.push("[X] Trust Signals: No schema markup found. This is like having no ID card - AI can't verify who you are. Add Organization schema at minimum.");
  }

  // Quotability insights
  if (analysis.metrics.naturalLanguage >= 80) {
    insights.push("[OK] Quotability: Your writing is clear and easy to read. AI can confidently quote your content in its answers.");
  } else if (analysis.metrics.naturalLanguage >= 60) {
    insights.push("[!] Quotability: Your writing is okay, but some sentences are too long or complex. Shorter sentences (15-20 words) get quoted more.");
  } else {
    insights.push("[X] Quotability: Your content is hard to read. Simplify your language - if a sentence needs to be read twice, it's too complicated.");
  }

  // Topic Match insights
  if (analysis.metrics.keywordRelevance >= 80) {
    insights.push("[OK] Topic Match: Your content clearly matches what people search for. Your keywords are in all the right places.");
  } else if (analysis.metrics.keywordRelevance >= 60) {
    insights.push("[!] Topic Match: You're on topic, but your main keywords should appear in your page title, H1 heading, and first paragraph.");
  } else {
    insights.push("[X] Topic Match: Your target keywords are missing from important places. Add them to your title, main heading, and meta description.");
  }

  return insights;
};

export const generatePDFReport = async (element: HTMLElement, analysis: Analysis) => {
  try {
    // Show loading state
    const loadingDiv = document.createElement('div');
    loadingDiv.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;">
        <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
          <div style="margin-bottom: 10px;">Generating PDF Report...</div>
          <div style="width: 200px; height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden;">
            <div style="width: 100%; height: 100%; background: #3b82f6; animation: loading 2s infinite;"></div>
          </div>
        </div>
      </div>
      <style>
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      </style>
    `;
    document.body.appendChild(loadingDiv);

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Helper to check if we need a new page
    const checkNewPage = (yPos: number, neededSpace: number): number => {
      if (yPos + neededSpace > pageHeight - margin) {
        pdf.addPage();
        return 30;
      }
      return yPos;
    };

    // ========== PAGE 1: Title & Overview ==========
    pdf.setFontSize(24);
    pdf.setTextColor(31, 41, 55);
    pdf.text('LLM Navigator Analysis Report', margin, 30);

    pdf.setFontSize(12);
    pdf.setTextColor(75, 85, 99);
    pdf.text(`Website: ${analysis.website}`, margin, 45);

    const keywordsText = `Keywords: ${analysis.keywords.join(', ')}`;
    const splitKeywords = pdf.splitTextToSize(keywordsText, contentWidth);
    pdf.text(splitKeywords, margin, 55);

    const keywordsEndY = 55 + (splitKeywords.length - 1) * 5;
    pdf.text(`Generated: ${new Date(analysis.createdAt).toLocaleDateString()}`, margin, keywordsEndY + 10);

    // Overall score
    pdf.setFontSize(48);
    const scoreColor = analysis.score >= 80 ? [16, 185, 129] : analysis.score >= 60 ? [245, 158, 11] : [239, 68, 68];
    pdf.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    pdf.text(`${analysis.score}/100`, margin, keywordsEndY + 45);

    pdf.setFontSize(14);
    pdf.setTextColor(75, 85, 99);
    pdf.text('Overall AI Visibility Score', margin, keywordsEndY + 55);

    // AI Confidence Level
    const confidenceLevel = getAIConfidence(analysis.score);
    pdf.setFontSize(12);
    pdf.setTextColor(31, 41, 55);
    pdf.text('AI Confidence Level:', margin, keywordsEndY + 70);
    const confidenceColor = confidenceLevel === 'High' ? [16, 185, 129] : confidenceLevel === 'Medium' ? [245, 158, 11] : [239, 68, 68];
    pdf.setTextColor(confidenceColor[0], confidenceColor[1], confidenceColor[2]);
    pdf.text(confidenceLevel, margin + 50, keywordsEndY + 70);

    // Metrics breakdown
    pdf.setFontSize(16);
    pdf.setTextColor(31, 41, 55);
    pdf.text('Metrics Breakdown:', margin, keywordsEndY + 90);

    const metricsData = [
      { label: 'Brand Clarity', score: analysis.metrics.contentClarity, desc: 'Can AI understand who you are?' },
      { label: 'Content Depth', score: analysis.metrics.semanticRichness, desc: 'Is your content thorough enough?' },
      { label: 'Trust Signals', score: analysis.metrics.structuredData, desc: 'Can AI verify your business?' },
      { label: 'Quotability', score: analysis.metrics.naturalLanguage, desc: 'Can AI quote your content?' },
      { label: 'Topic Match', score: analysis.metrics.keywordRelevance, desc: 'Does content match searches?' }
    ];

    pdf.setFontSize(11);
    metricsData.forEach((metric, index) => {
      const y = keywordsEndY + 105 + (index * 12);
      pdf.setTextColor(31, 41, 55);
      pdf.text(`${metric.label}:`, margin + 5, y);

      const metricColor = metric.score >= 80 ? [16, 185, 129] : metric.score >= 60 ? [245, 158, 11] : [239, 68, 68];
      pdf.setTextColor(metricColor[0], metricColor[1], metricColor[2]);
      pdf.text(`${metric.score}/100`, margin + 55, y);

      pdf.setFontSize(9);
      pdf.setTextColor(107, 114, 128);
      pdf.text(metric.desc, margin + 80, y);
      pdf.setFontSize(11);
    });

    // ========== PAGE 2: Detailed Analysis ==========
    pdf.addPage();
    let yPos = 30;

    pdf.setFontSize(16);
    pdf.setTextColor(31, 41, 55);
    pdf.text('Detailed Analysis', margin, yPos);
    yPos += 15;

    const detailedInsights = generateDetailedInsights(analysis);
    pdf.setFontSize(10);
    detailedInsights.forEach((insight) => {
      const splitInsight = pdf.splitTextToSize(insight, contentWidth - 10);
      const insightHeight = splitInsight.length * 5 + 8;

      yPos = checkNewPage(yPos, insightHeight);

      // Color based on status
      if (insight.startsWith('[OK]')) {
        pdf.setTextColor(16, 185, 129);
      } else if (insight.startsWith('[!]')) {
        pdf.setTextColor(245, 158, 11);
      } else {
        pdf.setTextColor(239, 68, 68);
      }

      pdf.text(splitInsight, margin + 5, yPos);
      yPos += insightHeight;
    });

    // AI-Generated Insights
    yPos = checkNewPage(yPos, 40);
    yPos += 10;
    pdf.setFontSize(16);
    pdf.setTextColor(31, 41, 55);
    pdf.text('Summary:', margin, yPos);
    yPos += 10;

    pdf.setFontSize(10);
    pdf.setTextColor(75, 85, 99);
    const splitInsights = pdf.splitTextToSize(analysis.insights, contentWidth - 10);
    const insightsHeight = splitInsights.length * 5;
    yPos = checkNewPage(yPos, insightsHeight + 10);
    pdf.text(splitInsights, margin + 5, yPos);
    yPos += insightsHeight + 15;

    // ========== CRAWL DATA SECTION ==========
    if (analysis.crawlData) {
      yPos = checkNewPage(yPos, 50);

      pdf.setFontSize(16);
      pdf.setTextColor(31, 41, 55);
      const crawlTitle = analysis.crawlData.pagesAnalyzed && analysis.crawlData.pagesAnalyzed > 1
        ? `Site Crawl Results (${analysis.crawlData.pagesAnalyzed} pages analyzed)`
        : 'Site Crawl Results';
      pdf.text(crawlTitle, margin, yPos);
      yPos += 15;

      // Page info
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128);
      pdf.text('HOMEPAGE INFO', margin, yPos);
      yPos += 8;

      pdf.setFontSize(10);
      pdf.setTextColor(31, 41, 55);
      pdf.text(`Title: ${analysis.crawlData.title || 'No title found'}`, margin + 5, yPos);
      yPos += 6;

      const metaDesc = analysis.crawlData.metaDescription || 'No meta description found';
      const splitMeta = pdf.splitTextToSize(`Meta: ${metaDesc}`, contentWidth - 10);
      pdf.text(splitMeta, margin + 5, yPos);
      yPos += splitMeta.length * 5 + 5;

      pdf.text(`Load Time: ${(analysis.crawlData.technicalSignals.loadTime / 1000).toFixed(2)}s`, margin + 5, yPos);
      yPos += 12;

      // Content Stats
      yPos = checkNewPage(yPos, 30);
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128);
      pdf.text('CONTENT STATISTICS', margin, yPos);
      yPos += 8;

      pdf.setTextColor(31, 41, 55);
      const stats = [
        `Words: ${analysis.crawlData.contentStats.wordCount.toLocaleString()}`,
        `Headings: ${analysis.crawlData.headings.length}`,
        `Schema Types: ${analysis.crawlData.schemaTypes.length}`,
        `Readability: ${analysis.crawlData.contentStats.readabilityScore}`
      ];
      pdf.text(stats.join('   |   '), margin + 5, yPos);
      yPos += 12;

      // Schema Types
      if (analysis.crawlData.schemaTypes.length > 0) {
        yPos = checkNewPage(yPos, 20);
        pdf.setFontSize(10);
        pdf.setTextColor(107, 114, 128);
        pdf.text('SCHEMA TYPES FOUND', margin, yPos);
        yPos += 8;

        pdf.setTextColor(16, 185, 129);
        pdf.text(analysis.crawlData.schemaTypes.join(', '), margin + 5, yPos);
        yPos += 12;
      }

      // Technical Signals
      yPos = checkNewPage(yPos, 25);
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128);
      pdf.text('TECHNICAL SIGNALS', margin, yPos);
      yPos += 8;

      const signals = analysis.crawlData.technicalSignals;
      const signalItems = [
        { label: 'HTTPS', value: signals.hasHttps },
        { label: 'Canonical', value: signals.hasCanonical },
        { label: 'Mobile Viewport', value: signals.mobileViewport },
        { label: 'Open Graph', value: signals.hasOpenGraph },
        { label: 'Twitter Card', value: signals.hasTwitterCard }
      ];

      pdf.setFontSize(9);
      let signalX = margin + 5;
      signalItems.forEach((signal) => {
        pdf.setTextColor(signal.value ? 16 : 239, signal.value ? 185 : 68, signal.value ? 129 : 68);
        const text = `${signal.value ? '[OK]' : '[X]'} ${signal.label}`;
        pdf.text(text, signalX, yPos);
        signalX += 35;
      });
      yPos += 12;

      // Issues Found
      if (analysis.crawlData.issues && analysis.crawlData.issues.length > 0) {
        yPos = checkNewPage(yPos, 30);
        pdf.setFontSize(10);
        pdf.setTextColor(107, 114, 128);
        pdf.text(`ISSUES FOUND (${analysis.crawlData.issues.length})`, margin, yPos);
        yPos += 8;

        pdf.setFontSize(9);
        analysis.crawlData.issues.slice(0, 10).forEach((issue) => {
          yPos = checkNewPage(yPos, 8);
          const color = issue.type === 'error' ? [239, 68, 68] : issue.type === 'warning' ? [245, 158, 11] : [59, 130, 246];
          pdf.setTextColor(color[0], color[1], color[2]);
          const icon = issue.type === 'error' ? '[X]' : issue.type === 'warning' ? '[!]' : '[i]';
          const issueText = pdf.splitTextToSize(`${icon} ${issue.message}`, contentWidth - 10);
          pdf.text(issueText, margin + 5, yPos);
          yPos += issueText.length * 4 + 3;
        });
        yPos += 5;
      }

      // Headings Found (sample)
      if (analysis.crawlData.headings.length > 0) {
        yPos = checkNewPage(yPos, 40);
        pdf.setFontSize(10);
        pdf.setTextColor(107, 114, 128);
        pdf.text(`HEADINGS SAMPLE (showing ${Math.min(10, analysis.crawlData.headings.length)} of ${analysis.crawlData.headings.length})`, margin, yPos);
        yPos += 8;

        pdf.setFontSize(9);
        analysis.crawlData.headings.slice(0, 10).forEach((heading) => {
          yPos = checkNewPage(yPos, 8);
          pdf.setTextColor(107, 114, 128);
          pdf.text(`H${heading.level}`, margin + 5, yPos);
          pdf.setTextColor(31, 41, 55);
          const headingText = heading.text.length > 60 ? heading.text.substring(0, 60) + '...' : heading.text;
          pdf.text(headingText, margin + 15, yPos);
          if (heading.hasDirectAnswer) {
            pdf.setTextColor(16, 185, 129);
            pdf.text('[BLUF]', margin + contentWidth - 15, yPos);
          }
          yPos += 6;
        });
        yPos += 10;
      }

      // Multi-page crawl summary
      if (analysis.crawlData.pages && analysis.crawlData.pages.length > 1) {
        pdf.addPage();
        yPos = 30;

        pdf.setFontSize(16);
        pdf.setTextColor(31, 41, 55);
        pdf.text(`Pages Analyzed (${analysis.crawlData.pages.length})`, margin, yPos);
        yPos += 15;

        // Table header
        pdf.setFontSize(9);
        pdf.setTextColor(107, 114, 128);
        pdf.text('Page', margin, yPos);
        pdf.text('Words', margin + 90, yPos);
        pdf.text('Headings', margin + 115, yPos);
        pdf.text('Schema', margin + 140, yPos);
        yPos += 8;

        pdf.setDrawColor(229, 231, 235);
        pdf.line(margin, yPos - 3, pageWidth - margin, yPos - 3);

        pdf.setFontSize(9);
        analysis.crawlData.pages.forEach((page, idx) => {
          yPos = checkNewPage(yPos, 10);

          pdf.setTextColor(31, 41, 55);
          const pageTitle = page.title || new URL(page.url).pathname;
          const truncatedTitle = pageTitle.length > 40 ? pageTitle.substring(0, 40) + '...' : pageTitle;
          pdf.text(truncatedTitle, margin, yPos);

          pdf.setTextColor(75, 85, 99);
          pdf.text(page.wordCount.toString(), margin + 90, yPos);
          pdf.text(page.headingsCount.toString(), margin + 115, yPos);

          const schemaColor = page.schemaCount > 0 ? [16, 185, 129] : [107, 114, 128];
          pdf.setTextColor(schemaColor[0], schemaColor[1], schemaColor[2]);
          pdf.text(page.schemaCount.toString(), margin + 140, yPos);

          yPos += 8;
        });
      }
    }

    // ========== RECOMMENDATIONS PAGE ==========
    if (analysis.recommendations.length > 0) {
      pdf.addPage();
      yPos = 30;

      pdf.setFontSize(16);
      pdf.setTextColor(31, 41, 55);
      pdf.text('Actionable Recommendations', margin, yPos);
      yPos += 15;

      analysis.recommendations.forEach((rec, index) => {
        const titleText = `${index + 1}. ${rec.title}`;
        const splitTitle = pdf.splitTextToSize(titleText, contentWidth - 5);
        const splitDesc = pdf.splitTextToSize(rec.description, contentWidth - 10);
        const priorityText = `Priority: ${rec.priority.toUpperCase()} | Difficulty: ${rec.difficulty} | Time: ${rec.estimatedTime} | Impact: +${rec.expectedImpact} pts`;

        const titleHeight = splitTitle.length * 6;
        const descHeight = splitDesc.length * 4;
        const totalHeight = titleHeight + descHeight + 20;

        yPos = checkNewPage(yPos, totalHeight);

        // Title
        pdf.setFontSize(12);
        pdf.setTextColor(31, 41, 55);
        pdf.text(splitTitle, margin, yPos);
        yPos += titleHeight + 2;

        // Priority badge
        pdf.setFontSize(8);
        const priorityColor = rec.priority === 'high' ? [239, 68, 68] : rec.priority === 'medium' ? [245, 158, 11] : [16, 185, 129];
        pdf.setTextColor(priorityColor[0], priorityColor[1], priorityColor[2]);
        pdf.text(priorityText, margin + 5, yPos);
        yPos += 8;

        // Description
        pdf.setFontSize(9);
        pdf.setTextColor(75, 85, 99);
        pdf.text(splitDesc, margin + 5, yPos);
        yPos += descHeight + 12;
      });
    }

    // Remove loading state
    document.body.removeChild(loadingDiv);

    // Save the PDF
    const fileName = `llm-analysis-${analysis.website.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('Error generating PDF:', error);

    // Remove loading state if it exists
    const loadingDiv = document.querySelector('[style*="position: fixed"]');
    if (loadingDiv) {
      document.body.removeChild(loadingDiv);
    }

    // Show error message
    alert('Error generating PDF report. Please try again.');
  }
};
