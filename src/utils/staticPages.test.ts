import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

describe('Static Pages', () => {
  describe('free-report landing page', () => {
    const pagePath = resolve(__dirname, '../../public/free-report/index.html');

    it('should exist at public/free-report/index.html', () => {
      expect(existsSync(pagePath)).toBe(true);
    });

    describe('SEO requirements', () => {
      let html: string;

      beforeAll(() => {
        html = readFileSync(pagePath, 'utf-8');
      });

      it('should have correct title tag', () => {
        expect(html).toContain('<title>Free AI Visibility Report | LLM Search Insight</title>');
      });

      it('should have meta description', () => {
        expect(html).toContain('<meta name="description"');
        expect(html).toContain('ChatGPT, Claude, Perplexity, Gemini');
      });

      it('should have canonical URL', () => {
        expect(html).toContain('<link rel="canonical" href="https://llmsearchinsight.com/free-report"');
      });

      it('should have Open Graph tags', () => {
        expect(html).toContain('<meta property="og:title"');
        expect(html).toContain('<meta property="og:description"');
        expect(html).toContain('<meta property="og:type" content="website"');
        expect(html).toContain('<meta property="og:url" content="https://llmsearchinsight.com/free-report"');
      });

      it('should have Twitter Card tags', () => {
        expect(html).toContain('<meta name="twitter:card"');
        expect(html).toContain('<meta name="twitter:title"');
        expect(html).toContain('<meta name="twitter:description"');
      });
    });

    describe('content requirements', () => {
      let html: string;

      beforeAll(() => {
        html = readFileSync(pagePath, 'utf-8');
      });

      it('should have H1 heading', () => {
        expect(html).toContain('<h1>');
        expect(html).toContain('Free AI Visibility Report');
      });

      it('should have feature list', () => {
        expect(html).toContain('AI citation analysis');
        expect(html).toContain('Brand mention detection');
        expect(html).toContain('Competitor visibility');
      });

      it('should have CTA button linking to /free-report', () => {
        expect(html).toContain('href="/free-report"');
        expect(html).toContain('Generate Free Report');
      });

      it('should have no credit card note', () => {
        expect(html).toContain('No credit card required');
      });
    });

    describe('technical requirements', () => {
      let html: string;

      beforeAll(() => {
        html = readFileSync(pagePath, 'utf-8');
      });

      it('should be valid HTML5', () => {
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('<html lang="en">');
      });

      it('should have viewport meta tag for mobile', () => {
        expect(html).toContain('<meta name="viewport"');
        expect(html).toContain('width=device-width');
      });

      it('should have UTF-8 charset', () => {
        expect(html).toContain('<meta charset="UTF-8">');
      });

      it('should include inline styles (no external CSS dependency)', () => {
        expect(html).toContain('<style>');
        expect(html).toContain('</style>');
      });

      it('should not require JavaScript to render content', () => {
        // Page should not have script tags that load content
        expect(html).not.toContain('<script src=');
        expect(html).not.toContain('document.write');
      });
    });

    describe('navigation links', () => {
      let html: string;

      beforeAll(() => {
        html = readFileSync(pagePath, 'utf-8');
      });

      it('should have link to home', () => {
        expect(html).toContain('href="/"');
      });

      it('should have link to pricing', () => {
        expect(html).toContain('href="/pricing"');
      });

      it('should have link to privacy policy', () => {
        expect(html).toContain('href="/privacy"');
      });

      it('should have link to terms', () => {
        expect(html).toContain('href="/terms"');
      });
    });
  });

  describe('sitemap.xml', () => {
    const sitemapPath = resolve(__dirname, '../../public/sitemap.xml');

    it('should exist', () => {
      expect(existsSync(sitemapPath)).toBe(true);
    });

    it('should include /free-report URL', () => {
      const sitemap = readFileSync(sitemapPath, 'utf-8');
      expect(sitemap).toContain('https://llmsearchinsight.com/free-report');
    });

    it('should NOT include hash URLs (fragments are not indexable)', () => {
      const sitemap = readFileSync(sitemapPath, 'utf-8');
      expect(sitemap).not.toContain('/#');
    });

    it('should include all public pages', () => {
      const sitemap = readFileSync(sitemapPath, 'utf-8');
      expect(sitemap).toContain('https://llmsearchinsight.com/</loc>');
      expect(sitemap).toContain('https://llmsearchinsight.com/pricing');
      expect(sitemap).toContain('https://llmsearchinsight.com/privacy');
      expect(sitemap).toContain('https://llmsearchinsight.com/terms');
    });
  });

  describe('robots.txt', () => {
    const robotsPath = resolve(__dirname, '../../public/robots.txt');

    it('should exist', () => {
      expect(existsSync(robotsPath)).toBe(true);
    });

    it('should allow all crawlers', () => {
      const robots = readFileSync(robotsPath, 'utf-8');
      expect(robots).toContain('User-agent: *');
      expect(robots).toContain('Allow: /');
    });

    it('should reference sitemap', () => {
      const robots = readFileSync(robotsPath, 'utf-8');
      expect(robots).toContain('Sitemap: https://llmsearchinsight.com/sitemap.xml');
    });
  });

  describe('netlify.toml redirect configuration', () => {
    const netlifyPath = resolve(__dirname, '../../netlify.toml');

    it('should exist', () => {
      expect(existsSync(netlifyPath)).toBe(true);
    });

    it('should have SPA catch-all redirect', () => {
      const config = readFileSync(netlifyPath, 'utf-8');
      expect(config).toContain('from = "/*"');
      expect(config).toContain('to = "/index.html"');
    });

    it('should NOT have separate /free-report redirect (SPA handles it)', () => {
      const config = readFileSync(netlifyPath, 'utf-8');
      // /free-report should be handled by the SPA, not a static redirect
      expect(config).not.toContain('to = "/free-report/index.html"');
    });
  });
});
