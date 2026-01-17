import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PrivacyPolicy from './PrivacyPolicy';

describe('PrivacyPolicy Component', () => {
  beforeEach(() => {
    // Mock window.location.hash
    Object.defineProperty(window, 'location', {
      value: { hash: '' },
      writable: true,
    });
  });

  describe('Header Section', () => {
    it('should render the Privacy Policy title', () => {
      render(<PrivacyPolicy />);

      expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    });

    it('should display the last updated date', () => {
      render(<PrivacyPolicy />);

      expect(screen.getByText(/Last Updated: January 16, 2026/i)).toBeInTheDocument();
    });

    it('should have a back button', () => {
      render(<PrivacyPolicy />);

      expect(screen.getByText('Back to Home')).toBeInTheDocument();
    });

    it('should navigate back when back button is clicked', () => {
      render(<PrivacyPolicy />);

      const backButton = screen.getByText('Back to Home');
      fireEvent.click(backButton);

      expect(window.location.hash).toBe('dashboard');
    });
  });

  describe('GDPR Rights Section', () => {
    it('should display the GDPR rights heading', () => {
      render(<PrivacyPolicy />);

      expect(screen.getByText('6. Your Rights (GDPR & CCPA)')).toBeInTheDocument();
    });

    it('should explain data export feature', () => {
      render(<PrivacyPolicy />);

      expect(screen.getByText('6.1 Right to Access & Data Portability')).toBeInTheDocument();
      expect(screen.getByText(/Download My Data/i)).toBeInTheDocument();
    });

    it('should explain account deletion feature', () => {
      render(<PrivacyPolicy />);

      expect(screen.getByText('6.2 Right to Deletion (Right to be Forgotten)')).toBeInTheDocument();
      expect(screen.getByText(/Delete My Account/i)).toBeInTheDocument();
    });

    it('should list what gets deleted on account deletion', () => {
      render(<PrivacyPolicy />);

      expect(screen.getByText(/Delete your profile and account information/i)).toBeInTheDocument();
      expect(screen.getByText(/Delete all your analyses and reports/i)).toBeInTheDocument();
      expect(screen.getByText(/Cancel any active subscriptions/i)).toBeInTheDocument();
    });

    it('should include CCPA section for California residents', () => {
      render(<PrivacyPolicy />);

      expect(screen.getByText('6.4 California Residents (CCPA)')).toBeInTheDocument();
      // Use getAllByText since text appears in multiple places
      const elements = screen.getAllByText(/We do not sell your personal information/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe('Cookies Section', () => {
    it('should explain cookie consent options', () => {
      render(<PrivacyPolicy />);

      expect(screen.getByText('7. Cookies and Consent')).toBeInTheDocument();
      expect(screen.getByText(/cookie consent banner/i)).toBeInTheDocument();
    });

    it('should describe accept and decline options', () => {
      render(<PrivacyPolicy />);

      expect(screen.getByText(/Accept:/i)).toBeInTheDocument();
      expect(screen.getByText(/Decline:/i)).toBeInTheDocument();
    });
  });

  describe('Data Retention Section', () => {
    it('should display data retention policies', () => {
      render(<PrivacyPolicy />);

      expect(screen.getByText('8. Data Retention')).toBeInTheDocument();
    });

    it('should explain fraud data retention periods', () => {
      render(<PrivacyPolicy />);

      expect(screen.getByText(/IP addresses and device fingerprints are automatically deleted after 30 days/i)).toBeInTheDocument();
      expect(screen.getByText(/Fraud check records:/i)).toBeInTheDocument();
    });
  });

  describe('Quick Links Section', () => {
    it('should display quick links to manage privacy', () => {
      render(<PrivacyPolicy />);

      expect(screen.getByText('Manage Your Privacy')).toBeInTheDocument();
    });

    it('should have link to export data', () => {
      render(<PrivacyPolicy />);

      const exportLink = screen.getByText('Export Your Data');
      expect(exportLink).toHaveAttribute('href', '#account');
    });

    it('should have link to delete account', () => {
      render(<PrivacyPolicy />);

      const deleteLink = screen.getByText('Delete Your Account');
      expect(deleteLink).toHaveAttribute('href', '#account');
    });

    it('should have link to terms of service', () => {
      render(<PrivacyPolicy />);

      const termsLink = screen.getByText('Terms of Service');
      expect(termsLink).toHaveAttribute('href', '#terms');
    });
  });

  describe('Dark Theme Styling', () => {
    it('should use dark theme container', () => {
      const { container } = render(<PrivacyPolicy />);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.className).toContain('bg-slate-900');
    });
  });
});
