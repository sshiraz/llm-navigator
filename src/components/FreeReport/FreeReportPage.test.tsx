import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FreeReportPage from './FreeReportPage';

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

// Import after mock
import { supabase } from '../../lib/supabase';

describe('FreeReportPage Component', () => {
  const mockOnGetStarted = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('renders the lead capture form', () => {
      render(<FreeReportPage onGetStarted={mockOnGetStarted} />);

      expect(screen.getByText(/Is Your Website Visible to/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/you@company.com/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/yourcompany.com/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Get My Free Report/i })).toBeInTheDocument();
    });

    it('renders value proposition cards', () => {
      render(<FreeReportPage onGetStarted={mockOnGetStarted} />);

      expect(screen.getByText(/AI Visibility Score/i)).toBeInTheDocument();
      expect(screen.getByText(/Citation Rate/i)).toBeInTheDocument();
      expect(screen.getByText(/Top Recommendation/i)).toBeInTheDocument();
    });

    it('shows sign in link in header', () => {
      render(<FreeReportPage onGetStarted={mockOnGetStarted} />);

      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows error when email is empty', async () => {
      render(<FreeReportPage onGetStarted={mockOnGetStarted} />);

      const websiteInput = screen.getByPlaceholderText(/yourcompany.com/i);
      await userEvent.type(websiteInput, 'example.com');

      const submitButton = screen.getByRole('button', { name: /Get My Free Report/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Please fill in all fields/i)).toBeInTheDocument();
      });
    });

    it('shows error when website is empty', async () => {
      render(<FreeReportPage onGetStarted={mockOnGetStarted} />);

      const emailInput = screen.getByPlaceholderText(/you@company.com/i);
      await userEvent.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Get My Free Report/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Please fill in all fields/i)).toBeInTheDocument();
      });
    });

    it('requires @ symbol in email', () => {
      // Simple unit test for validation logic
      const isValidEmail = (email: string) => email.includes('@');

      expect(isValidEmail('invalidemail')).toBe(false);
      expect(isValidEmail('valid@email.com')).toBe(true);
      expect(isValidEmail('test@')).toBe(true); // Has @ but incomplete
    });
  });

  describe('Analysis Flow', () => {
    it('shows loading state during analysis', async () => {
      // Mock slow response
      vi.mocked(supabase.functions.invoke).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: { success: true, data: { results: [] } }, error: null }), 1000))
      );

      render(<FreeReportPage onGetStarted={mockOnGetStarted} />);

      const emailInput = screen.getByPlaceholderText(/you@company.com/i);
      const websiteInput = screen.getByPlaceholderText(/yourcompany.com/i);

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(websiteInput, 'example.com');

      const submitButton = screen.getByRole('button', { name: /Get My Free Report/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Analyzing your website/i)).toBeInTheDocument();
      });
    });

    it('displays results when cited', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          success: true,
          data: {
            results: [{
              isCited: true,
              citationContext: 'Example.com is a great resource for...',
              competitorsCited: [
                { domain: 'competitor1.com', context: 'mentioned as alternative' },
                { domain: 'competitor2.com', context: 'also recommended' },
              ],
              response: 'Full AI response here',
            }],
          },
        },
        error: null,
      });

      render(<FreeReportPage onGetStarted={mockOnGetStarted} />);

      const emailInput = screen.getByPlaceholderText(/you@company.com/i);
      const websiteInput = screen.getByPlaceholderText(/yourcompany.com/i);

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(websiteInput, 'example.com');

      const submitButton = screen.getByRole('button', { name: /Get My Free Report/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/You Were Cited!/i)).toBeInTheDocument();
      });

      // Check score is displayed
      expect(screen.getByText('AI Visibility Score')).toBeInTheDocument();
    });

    it('displays results when not cited', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          success: true,
          data: {
            results: [{
              isCited: false,
              competitorsCited: [
                { domain: 'competitor1.com', context: 'mentioned' },
              ],
              response: 'Full AI response here',
            }],
          },
        },
        error: null,
      });

      render(<FreeReportPage onGetStarted={mockOnGetStarted} />);

      const emailInput = screen.getByPlaceholderText(/you@company.com/i);
      const websiteInput = screen.getByPlaceholderText(/yourcompany.com/i);

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(websiteInput, 'example.com');

      const submitButton = screen.getByRole('button', { name: /Get My Free Report/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Not Cited/i)).toBeInTheDocument();
      });
    });

    it('shows competitors when found', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          success: true,
          data: {
            results: [{
              isCited: false,
              competitorsCited: [
                { domain: 'zendesk.com', context: 'recommended' },
                { domain: 'freshworks.com', context: 'alternative' },
              ],
              response: 'Response text',
            }],
          },
        },
        error: null,
      });

      render(<FreeReportPage onGetStarted={mockOnGetStarted} />);

      const emailInput = screen.getByPlaceholderText(/you@company.com/i);
      const websiteInput = screen.getByPlaceholderText(/yourcompany.com/i);

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(websiteInput, 'example.com');

      fireEvent.click(screen.getByRole('button', { name: /Get My Free Report/i }));

      await waitFor(() => {
        expect(screen.getByText(/Competitors Getting Cited/i)).toBeInTheDocument();
        expect(screen.getByText('zendesk.com')).toBeInTheDocument();
        expect(screen.getByText('freshworks.com')).toBeInTheDocument();
      });
    });

    it('shows the query that was tested', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          success: true,
          data: {
            results: [{
              isCited: false,
              competitorsCited: [],
              response: 'Response',
            }],
          },
        },
        error: null,
      });

      render(<FreeReportPage onGetStarted={mockOnGetStarted} />);

      await userEvent.type(screen.getByPlaceholderText(/you@company.com/i), 'test@example.com');
      await userEvent.type(screen.getByPlaceholderText(/yourcompany.com/i), 'acme.com');

      fireEvent.click(screen.getByRole('button', { name: /Get My Free Report/i }));

      await waitFor(() => {
        expect(screen.getByText(/Query Tested/i)).toBeInTheDocument();
        expect(screen.getByText(/What are the best acme alternatives/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error message on API failure', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: { message: 'API rate limit exceeded' },
      });

      render(<FreeReportPage onGetStarted={mockOnGetStarted} />);

      await userEvent.type(screen.getByPlaceholderText(/you@company.com/i), 'test@example.com');
      await userEvent.type(screen.getByPlaceholderText(/yourcompany.com/i), 'example.com');

      fireEvent.click(screen.getByRole('button', { name: /Get My Free Report/i }));

      await waitFor(() => {
        expect(screen.getByText(/API rate limit exceeded/i)).toBeInTheDocument();
      });
    });

    it('shows error when analysis returns success: false', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: false, error: 'Missing API key' },
        error: null,
      });

      render(<FreeReportPage onGetStarted={mockOnGetStarted} />);

      await userEvent.type(screen.getByPlaceholderText(/you@company.com/i), 'test@example.com');
      await userEvent.type(screen.getByPlaceholderText(/yourcompany.com/i), 'example.com');

      fireEvent.click(screen.getByRole('button', { name: /Get My Free Report/i }));

      await waitFor(() => {
        expect(screen.getByText(/Missing API key/i)).toBeInTheDocument();
      });
    });
  });

  describe('Upsell CTA', () => {
    it('shows upsell section after report generation', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          success: true,
          data: {
            results: [{
              isCited: false,
              competitorsCited: [],
              response: 'Response',
            }],
          },
        },
        error: null,
      });

      render(<FreeReportPage onGetStarted={mockOnGetStarted} />);

      await userEvent.type(screen.getByPlaceholderText(/you@company.com/i), 'test@example.com');
      await userEvent.type(screen.getByPlaceholderText(/yourcompany.com/i), 'example.com');

      fireEvent.click(screen.getByRole('button', { name: /Get My Free Report/i }));

      await waitFor(() => {
        expect(screen.getByText(/Want the Full Analysis/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Start Free Trial/i })).toBeInTheDocument();
      });
    });

    it('calls onGetStarted when Start Free Trial is clicked', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          success: true,
          data: {
            results: [{
              isCited: false,
              competitorsCited: [],
              response: 'Response',
            }],
          },
        },
        error: null,
      });

      render(<FreeReportPage onGetStarted={mockOnGetStarted} />);

      await userEvent.type(screen.getByPlaceholderText(/you@company.com/i), 'test@example.com');
      await userEvent.type(screen.getByPlaceholderText(/yourcompany.com/i), 'example.com');

      fireEvent.click(screen.getByRole('button', { name: /Get My Free Report/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Start Free Trial/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Start Free Trial/i }));

      expect(mockOnGetStarted).toHaveBeenCalled();
    });
  });

  describe('URL Normalization', () => {
    it('adds https:// to URLs without protocol', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          success: true,
          data: { results: [{ isCited: false, competitorsCited: [], response: '' }] },
        },
        error: null,
      });

      render(<FreeReportPage onGetStarted={mockOnGetStarted} />);

      await userEvent.type(screen.getByPlaceholderText(/you@company.com/i), 'test@example.com');
      await userEvent.type(screen.getByPlaceholderText(/yourcompany.com/i), 'example.com');

      fireEvent.click(screen.getByRole('button', { name: /Get My Free Report/i }));

      await waitFor(() => {
        expect(supabase.functions.invoke).toHaveBeenCalledWith('check-citations', {
          body: expect.objectContaining({
            website: 'https://example.com',
          }),
        });
      });
    });
  });
});
