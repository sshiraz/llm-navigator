import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

describe('Static Pages', () => {
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

    it('should have SPA catch-all redirect with force=true', () => {
      const config = readFileSync(netlifyPath, 'utf-8');
      expect(config).toContain('from = "/*"');
      expect(config).toContain('to = "/index.html"');
      expect(config).toContain('force = true');
    });

    it('should have pass-through rule for assets', () => {
      const config = readFileSync(netlifyPath, 'utf-8');
      expect(config).toContain('from = "/assets/*"');
      expect(config).toContain('to = "/assets/:splat"');
    });

    it('should NOT have separate /free-report redirect (SPA handles it)', () => {
      const config = readFileSync(netlifyPath, 'utf-8');
      expect(config).not.toContain('to = "/free-report/index.html"');
    });
  });
});
