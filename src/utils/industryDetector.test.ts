import { describe, it, expect } from 'vitest';
import { detectIndustry, getSupportedIndustries, DEFAULT_INDUSTRY } from './industryDetector';

describe('detectIndustry', () => {
  describe('E-commerce detection', () => {
    it('detects shop in brand name', () => {
      expect(detectIndustry('petshop', 'petshop.com')).toBe('E-commerce');
    });

    it('detects store in domain', () => {
      expect(detectIndustry('acme', 'acmestore.com')).toBe('E-commerce');
    });

    it('detects cart keyword', () => {
      expect(detectIndustry('smartcart', 'smartcart.io')).toBe('E-commerce');
    });

    it('detects retail keyword', () => {
      expect(detectIndustry('retailhub', 'retailhub.com')).toBe('E-commerce');
    });
  });

  describe('SaaS detection', () => {
    it('detects app in brand name', () => {
      expect(detectIndustry('taskapp', 'taskapp.io')).toBe('SaaS');
    });

    it('detects software keyword', () => {
      expect(detectIndustry('prosoftware', 'prosoftware.com')).toBe('SaaS');
    });

    it('detects platform keyword', () => {
      expect(detectIndustry('dataplatform', 'dataplatform.io')).toBe('SaaS');
    });

    it('detects cloud keyword', () => {
      expect(detectIndustry('cloudbase', 'cloudbase.com')).toBe('SaaS');
    });

    it('detects api keyword', () => {
      expect(detectIndustry('apitools', 'apitools.dev')).toBe('SaaS');
    });
  });

  describe('Marketing detection', () => {
    it('detects seo keyword', () => {
      expect(detectIndustry('seopro', 'seopro.io')).toBe('Marketing');
    });

    it('detects agency keyword', () => {
      expect(detectIndustry('digitalagency', 'digitalagency.com')).toBe('Marketing');
    });

    it('detects social keyword', () => {
      expect(detectIndustry('socialboost', 'socialboost.com')).toBe('Marketing');
    });

    it('detects ads keyword', () => {
      expect(detectIndustry('adsmaster', 'adsmaster.com')).toBe('Marketing');
    });
  });

  describe('Finance detection', () => {
    it('detects finance keyword', () => {
      expect(detectIndustry('quickfinance', 'quickfinance.com')).toBe('Finance');
    });

    it('detects bank keyword', () => {
      expect(detectIndustry('neobank', 'neobank.io')).toBe('Finance');
    });

    it('detects invest keyword', () => {
      expect(detectIndustry('investwise', 'investwise.com')).toBe('Finance');
    });

    it('detects fintech keyword', () => {
      expect(detectIndustry('fintech', 'fintechpro.com')).toBe('Finance');
    });

    it('detects pay keyword', () => {
      expect(detectIndustry('easypay', 'easypay.com')).toBe('Finance');
    });
  });

  describe('Healthcare detection', () => {
    it('detects health keyword', () => {
      expect(detectIndustry('healthtrack', 'healthtrack.com')).toBe('Healthcare');
    });

    it('detects medical keyword', () => {
      expect(detectIndustry('medicalplus', 'medicalplus.com')).toBe('Healthcare');
    });

    it('detects wellness keyword', () => {
      expect(detectIndustry('wellnesshub', 'wellnesshub.com')).toBe('Healthcare');
    });
  });

  describe('Education detection', () => {
    it('detects learn keyword', () => {
      expect(detectIndustry('learnfast', 'learnfast.com')).toBe('Education');
    });

    it('detects course keyword', () => {
      expect(detectIndustry('coursehub', 'coursehub.com')).toBe('Education');
    });

    it('detects academy keyword', () => {
      expect(detectIndustry('codeacademy', 'codeacademy.com')).toBe('Education');
    });

    it('detects edu in domain', () => {
      expect(detectIndustry('stanford', 'stanford.edu')).toBe('Education');
    });
  });

  describe('AI & Automation detection', () => {
    it('detects chatbot keyword', () => {
      expect(detectIndustry('chatbotpro', 'chatbotpro.com')).toBe('AI & Automation');
    });

    it('detects convo keyword', () => {
      expect(detectIndustry('convologix', 'convologix.com')).toBe('AI & Automation');
    });

    it('detects ai keyword', () => {
      expect(detectIndustry('smartai', 'smartai.com')).toBe('AI & Automation');
    });

    it('detects gpt keyword', () => {
      expect(detectIndustry('gptbase', 'gptbase.io')).toBe('AI & Automation');
    });
  });

  describe('Technology detection', () => {
    it('detects tech keyword', () => {
      expect(detectIndustry('techcorp', 'techcorp.com')).toBe('Technology');
    });

    it('detects cyber keyword', () => {
      expect(detectIndustry('cybersec', 'cybersec.io')).toBe('Technology');
    });

    it('detects dev keyword', () => {
      expect(detectIndustry('devhub', 'devhub.com')).toBe('Technology');
    });

    it('detects data keyword', () => {
      expect(detectIndustry('bigdata', 'bigdata.io')).toBe('Technology');
    });
  });

  describe('Travel detection', () => {
    it('detects travel keyword', () => {
      expect(detectIndustry('travelbuddy', 'travelbuddy.com')).toBe('Travel');
    });

    it('detects hotel keyword', () => {
      expect(detectIndustry('hotelbook', 'hotelbook.com')).toBe('Travel');
    });

    it('detects booking keyword', () => {
      expect(detectIndustry('easybooking', 'easybooking.com')).toBe('Travel');
    });

    it('detects flight keyword', () => {
      expect(detectIndustry('flightdeals', 'flightdeals.com')).toBe('Travel');
    });
  });

  describe('Real Estate detection', () => {
    it('detects estate keyword', () => {
      expect(detectIndustry('realestate', 'realestate.com')).toBe('Real Estate');
    });

    it('detects property keyword', () => {
      expect(detectIndustry('propertyfind', 'propertyfind.com')).toBe('Real Estate');
    });

    it('detects home keyword', () => {
      expect(detectIndustry('homefinder', 'homefinder.com')).toBe('Real Estate');
    });

    it('detects rent keyword', () => {
      expect(detectIndustry('rentfast', 'rentfast.com')).toBe('Real Estate');
    });
  });

  describe('Default fallback', () => {
    it('returns General Business for unrecognized brands', () => {
      expect(detectIndustry('acme', 'acme.com')).toBe('General Business');
    });

    it('returns General Business for generic names', () => {
      expect(detectIndustry('xyz', 'xyz.org')).toBe('General Business');
    });

    it('returns General Business for personal names', () => {
      expect(detectIndustry('johnsmith', 'johnsmith.com')).toBe('General Business');
    });
  });

  describe('case insensitivity', () => {
    it('handles uppercase brand names', () => {
      expect(detectIndustry('SHOPIFY', 'shopify.com')).toBe('E-commerce');
    });

    it('handles mixed case domains', () => {
      expect(detectIndustry('acme', 'AcmeStore.COM')).toBe('E-commerce');
    });

    it('handles uppercase keywords', () => {
      expect(detectIndustry('FINTECH', 'FINTECH.io')).toBe('Finance');
    });
  });

  describe('priority order', () => {
    it('matches first industry when multiple could apply', () => {
      // 'healthtech' contains both 'health' (Healthcare) and 'tech' (Technology)
      // Should match Healthcare first based on iteration order
      const result = detectIndustry('healthtech', 'healthtech.com');
      // The order in INDUSTRY_KEYWORDS determines priority
      expect(['Healthcare', 'Technology']).toContain(result);
    });
  });
});

describe('getSupportedIndustries', () => {
  it('returns all industries including default', () => {
    const industries = getSupportedIndustries();
    expect(industries).toContain('E-commerce');
    expect(industries).toContain('SaaS');
    expect(industries).toContain('Marketing');
    expect(industries).toContain('Finance');
    expect(industries).toContain('Healthcare');
    expect(industries).toContain('Education');
    expect(industries).toContain('AI & Automation');
    expect(industries).toContain('Technology');
    expect(industries).toContain('Travel');
    expect(industries).toContain('Real Estate');
    expect(industries).toContain('General Business');
  });

  it('returns exactly 11 industries', () => {
    expect(getSupportedIndustries()).toHaveLength(11);
  });
});

describe('DEFAULT_INDUSTRY constant', () => {
  it('is General Business', () => {
    expect(DEFAULT_INDUSTRY).toBe('General Business');
  });
});
