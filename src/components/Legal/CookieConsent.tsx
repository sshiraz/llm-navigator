import React, { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'llm_navigator_cookie_consent';

interface CookieConsentProps {
  onAccept?: () => void;
  onDecline?: () => void;
}

export default function CookieConsent({ onAccept, onDecline }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      accepted: true,
      timestamp: new Date().toISOString(),
    }));
    setIsVisible(false);
    onAccept?.();
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      accepted: false,
      timestamp: new Date().toISOString(),
    }));
    setIsVisible(false);
    onDecline?.();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-slate-900 border-t border-slate-700 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <Cookie className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-300">
            <p className="mb-1">
              We use cookies to improve your experience and analyze site usage.
            </p>
            <p className="text-slate-400">
              By clicking "Accept", you consent to our use of cookies.{' '}
              <a
                href="#privacy"
                className="text-indigo-400 hover:text-indigo-300 underline"
              >
                Learn more
              </a>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <button
            onClick={handleDecline}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-500 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper to check if user has consented to cookies
export function hasCookieConsent(): boolean {
  try {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (consent) {
      const parsed = JSON.parse(consent);
      return parsed.accepted === true;
    }
  } catch {
    // Ignore parse errors
  }
  return false;
}

// Helper to reset cookie consent (for testing)
export function resetCookieConsent(): void {
  localStorage.removeItem(COOKIE_CONSENT_KEY);
}
