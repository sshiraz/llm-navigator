import { describe, it, expect } from 'vitest';
import { parseIndustryResponse } from './industryDetector';

/**
 * Unit tests for industry response parsing logic.
 *
 * Tests the parseIndustryResponse function from industryDetector.ts which
 * cleans AI responses (from Perplexity) to extract industry names.
 */

describe('Industry Response Parser', () => {
  describe('Basic Parsing', () => {
    it('returns clean industry name from simple response', () => {
      expect(parseIndustryResponse('Technology Services')).toBe('Technology Services');
    });

    it('takes only the first line of multi-line response', () => {
      expect(parseIndustryResponse('Technology Services\nThis is additional context')).toBe('Technology Services');
    });

    it('returns null for empty response', () => {
      expect(parseIndustryResponse('')).toBeNull();
    });

    it('returns null for very short industry (< 3 chars)', () => {
      expect(parseIndustryResponse('IT')).toBeNull();
    });

    it('returns null for very long industry (> 100 chars)', () => {
      const longIndustry = 'A'.repeat(101);
      expect(parseIndustryResponse(longIndustry)).toBeNull();
    });
  });

  describe('Markdown Cleaning', () => {
    it('removes bold markdown (**)', () => {
      expect(parseIndustryResponse('**Environmental Consulting**')).toBe('Environmental Consulting');
    });

    it('removes single asterisks (*)', () => {
      expect(parseIndustryResponse('*Technology Services*')).toBe('Technology Services');
    });

    it('removes mixed markdown formatting', () => {
      expect(parseIndustryResponse('**This is** *formatted* text')).toBe('This is formatted text');
    });

    it('handles markdown at start and end only', () => {
      expect(parseIndustryResponse('**SaaS Platform**')).toBe('SaaS Platform');
    });
  });

  describe('Citation Reference Cleaning', () => {
    it('removes single citation reference', () => {
      expect(parseIndustryResponse('Technology Services[1]')).toBe('Technology Services');
    });

    it('removes multiple citation references', () => {
      expect(parseIndustryResponse('Technology Services[1][2][3]')).toBe('Technology Services');
    });

    it('removes citation references in the middle of text', () => {
      expect(parseIndustryResponse('Tech[1] Services[2]')).toBe('Tech Services');
    });

    it('handles high citation numbers', () => {
      expect(parseIndustryResponse('Environmental Consulting[42]')).toBe('Environmental Consulting');
    });
  });

  describe('Combined Markdown and Citations', () => {
    it('removes both markdown and citations', () => {
      expect(parseIndustryResponse('**Geomatics Services**[1][2][3]')).toBe('Geomatics Services');
    });

    it('handles complex formatting', () => {
      expect(parseIndustryResponse('**Environmental**[1] *Consulting*[2]')).toBe('Environmental Consulting');
    });

    it('handles the real-world case from user bug report', () => {
      // This was the actual format causing issues
      expect(parseIndustryResponse('**Private prisons and corrections**[1][2]')).toBe('Private prisons and corrections');
    });
  });

  describe('Common Prefix Removal', () => {
    it('removes "Industry:" prefix', () => {
      expect(parseIndustryResponse('Industry: Technology Services')).toBe('Technology Services');
    });

    it('removes "The industry is" prefix', () => {
      expect(parseIndustryResponse('The industry is Environmental Consulting')).toBe('Environmental Consulting');
    });

    it('removes "This is a" prefix', () => {
      expect(parseIndustryResponse('This is a SaaS platform')).toBe('SaaS platform');
    });

    it('removes "They operate in" prefix', () => {
      expect(parseIndustryResponse('They operate in healthcare sector')).toBe('healthcare sector');
    });

    it('removes "Based on" prefix', () => {
      expect(parseIndustryResponse('Based on the website, Healthcare Services')).toBe('the website, Healthcare Services');
    });

    it('removes "The company operates in" prefix', () => {
      expect(parseIndustryResponse('The company operates in Financial Technology')).toBe('Financial Technology');
    });

    it('handles case-insensitive prefix matching', () => {
      expect(parseIndustryResponse('THE INDUSTRY IS Technology')).toBe('Technology');
    });
  });

  describe('Punctuation Cleaning', () => {
    it('removes trailing period', () => {
      expect(parseIndustryResponse('Technology Services.')).toBe('Technology Services');
    });

    it('removes trailing comma', () => {
      expect(parseIndustryResponse('Technology Services,')).toBe('Technology Services');
    });

    it('removes trailing semicolon', () => {
      expect(parseIndustryResponse('Technology Services;')).toBe('Technology Services');
    });

    it('removes trailing colon', () => {
      expect(parseIndustryResponse('Technology Services:')).toBe('Technology Services');
    });

    it('removes multiple trailing punctuation', () => {
      expect(parseIndustryResponse('Technology Services...')).toBe('Technology Services');
    });
  });

  describe('Quote Cleaning', () => {
    it('removes surrounding double quotes', () => {
      expect(parseIndustryResponse('"Technology Services"')).toBe('Technology Services');
    });

    it('removes surrounding single quotes', () => {
      expect(parseIndustryResponse("'Technology Services'")).toBe('Technology Services');
    });

    it('handles mismatched quotes (start only)', () => {
      expect(parseIndustryResponse('"Technology Services')).toBe('Technology Services');
    });

    it('handles mismatched quotes (end only)', () => {
      expect(parseIndustryResponse('Technology Services"')).toBe('Technology Services');
    });
  });

  describe('Whitespace Handling', () => {
    it('trims leading whitespace', () => {
      expect(parseIndustryResponse('   Technology Services')).toBe('Technology Services');
    });

    it('trims trailing whitespace', () => {
      expect(parseIndustryResponse('Technology Services   ')).toBe('Technology Services');
    });

    it('trims both leading and trailing whitespace', () => {
      expect(parseIndustryResponse('   Technology Services   ')).toBe('Technology Services');
    });

    it('preserves internal spaces', () => {
      expect(parseIndustryResponse('Financial Technology Services')).toBe('Financial Technology Services');
    });
  });

  describe('Real-World Examples', () => {
    it('parses Perplexity response for geomatics company', () => {
      expect(parseIndustryResponse('**Geomatics and environmental technology**[1][2][3]'))
        .toBe('Geomatics and environmental technology');
    });

    it('parses response with "based on" prefix', () => {
      expect(parseIndustryResponse('Based on Environmental Consulting'))
        .toBe('Environmental Consulting');
    });

    it('parses clean response without formatting', () => {
      expect(parseIndustryResponse('SaaS Marketing Platform'))
        .toBe('SaaS Marketing Platform');
    });

    it('parses response with all formatting issues', () => {
      // Industry: **E-commerce**[1][2].
      expect(parseIndustryResponse('Industry: **E-commerce**[1][2].'))
        .toBe('E-commerce');
    });

    it('parses response that starts with the industry is', () => {
      expect(parseIndustryResponse('The industry is **Healthcare Technology**[1]'))
        .toBe('Healthcare Technology');
    });
  });
});
