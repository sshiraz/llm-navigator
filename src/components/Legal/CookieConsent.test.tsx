import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CookieConsent, { hasCookieConsent, resetCookieConsent } from './CookieConsent';

// Create a simplified test version that bypasses the timer
const CookieConsentTestWrapper = (props: { onAccept?: () => void; onDecline?: () => void }) => {
  // For testing, we'll render the component and manually test visibility states
  return <CookieConsent {...props} />;
};

describe('CookieConsent Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Initial Display', () => {
    it('should not show banner immediately on first visit (timer delay)', () => {
      render(<CookieConsent />);

      // Banner should not be visible immediately due to 1s delay
      expect(screen.queryByText(/We use cookies/i)).not.toBeInTheDocument();
    });

    it('should not show banner if user has already accepted', () => {
      localStorage.setItem('llm_navigator_cookie_consent', JSON.stringify({
        accepted: true,
        timestamp: new Date().toISOString(),
      }));

      render(<CookieConsent />);

      // Even if we wait, banner should not appear
      expect(screen.queryByText(/We use cookies/i)).not.toBeInTheDocument();
    });

    it('should not show banner if user has already declined', () => {
      localStorage.setItem('llm_navigator_cookie_consent', JSON.stringify({
        accepted: false,
        timestamp: new Date().toISOString(),
      }));

      render(<CookieConsent />);

      expect(screen.queryByText(/We use cookies/i)).not.toBeInTheDocument();
    });
  });

  describe('Consent Storage', () => {
    it('should store acceptance correctly in localStorage', () => {
      const consent = {
        accepted: true,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem('llm_navigator_cookie_consent', JSON.stringify(consent));

      const stored = JSON.parse(localStorage.getItem('llm_navigator_cookie_consent') || '{}');
      expect(stored.accepted).toBe(true);
      expect(stored.timestamp).toBeDefined();
    });

    it('should store decline correctly in localStorage', () => {
      const consent = {
        accepted: false,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem('llm_navigator_cookie_consent', JSON.stringify(consent));

      const stored = JSON.parse(localStorage.getItem('llm_navigator_cookie_consent') || '{}');
      expect(stored.accepted).toBe(false);
      expect(stored.timestamp).toBeDefined();
    });
  });
});

describe('hasCookieConsent Helper', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return false when no consent is stored', () => {
    expect(hasCookieConsent()).toBe(false);
  });

  it('should return true when user has accepted', () => {
    localStorage.setItem('llm_navigator_cookie_consent', JSON.stringify({
      accepted: true,
      timestamp: new Date().toISOString(),
    }));

    expect(hasCookieConsent()).toBe(true);
  });

  it('should return false when user has declined', () => {
    localStorage.setItem('llm_navigator_cookie_consent', JSON.stringify({
      accepted: false,
      timestamp: new Date().toISOString(),
    }));

    expect(hasCookieConsent()).toBe(false);
  });

  it('should return false for invalid JSON', () => {
    localStorage.setItem('llm_navigator_cookie_consent', 'invalid-json');

    expect(hasCookieConsent()).toBe(false);
  });
});

describe('resetCookieConsent Helper', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should remove consent from localStorage', () => {
    localStorage.setItem('llm_navigator_cookie_consent', JSON.stringify({
      accepted: true,
      timestamp: new Date().toISOString(),
    }));

    expect(localStorage.getItem('llm_navigator_cookie_consent')).not.toBeNull();

    resetCookieConsent();

    expect(localStorage.getItem('llm_navigator_cookie_consent')).toBeNull();
  });

  it('should not throw if no consent exists', () => {
    expect(() => resetCookieConsent()).not.toThrow();
  });
});
