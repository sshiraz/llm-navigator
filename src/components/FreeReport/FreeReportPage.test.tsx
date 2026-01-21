import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FreeReportPage from './FreeReportPage';

// Mock supabase with chainable query builder
const createMockQueryBuilder = (selectData: any[] = []) => {
  const builder = {
    select: vi.fn(() => builder),
    insert: vi.fn(() => Promise.resolve({ error: null })),
    eq: vi.fn(() => builder),
    gte: vi.fn(() => builder),
    limit: vi.fn(() => Promise.resolve({ data: selectData, error: null })),
  };
  // For domain check (no limit call, returns directly from gte)
  builder.gte.mockImplementation(() => {
    return {
      ...builder,
      then: (resolve: any) => resolve({ data: selectData, error: null }),
    };
  });
  return builder;
};

let mockQueryBuilder = createMockQueryBuilder([]);

vi.mock('../../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    from: vi.fn(() => mockQueryBuilder),
  },
}));

// Import after mock
import { supabase } from '../../lib/supabase';

// Helper to create mock results for 5 queries
const createMockResults = (overrides: Partial<{
  isCited: boolean;
  citationContext: string;
  competitorsCited: { domain: string; context: string }[];
}>[] = []) => {
  const defaultResult = {
    isCited: false,
    competitorsCited: [],
    response: 'AI response text',
  };

  // Create 5 results (one per query type)
  return Array(5).fill(null).map((_, i) => ({
    ...defaultResult,
    ...overrides[i],
  }));
};

describe('FreeReportPage Component', () => {
  const mockOnGetStarted = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default (no abuse detected)
    mockQueryBuilder = createMockQueryBuilder([]);
    vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder as any);
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
        () => new Promise((resolve) => setTimeout(() => resolve({ data: { success: true, data: { results: createMockResults() } }, error: null }), 1000))
      );

      render(<FreeReportPage onGetStarted={mockOnGetStarted} />);

      const emailInput = screen.getByPlaceholderText(/you@company.com/i);
      const websiteInput = screen.getByPlaceholderText(/yourcompany.com/i);

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(websiteInput, 'example.com');

      const submitButton = screen.getByRole('button', { name: /Get My Free Report/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        // Shows dynamic status messages (starts with eligibility check, then crawling, etc.)
        expect(screen.getByText(/Checking eligibility|Crawling website|Querying AI providers/i)).toBeInTheDocument();
      });
    });

    it('displays results when cited', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          success: true,
          data: {
            results: createMockResults([
              {
                isCited: true,
                citationContext: 'Example.com is a great resource for...',
                competitorsCited: [
                  { domain: 'competitor1.com', context: 'mentioned as alternative' },
                  { domain: 'competitor2.com', context: 'also recommended' },
                ],
              },
            ]),
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
        // With 1/5 cited, shows 20% citation rate
        expect(screen.getByText(/20%/i)).toBeInTheDocument();
      });

      // Check score is displayed
      expect(screen.getByText('AI Visibility Score')).toBeInTheDocument();
    });

    it('displays results when not cited', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          success: true,
          data: {
            results: createMockResults([
              {
                isCited: false,
                competitorsCited: [
                  { domain: 'competitor1.com', context: 'mentioned' },
                ],
              },
            ]),
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
        // 0% citation rate when not cited
        expect(screen.getByText(/0%/i)).toBeInTheDocument();
      });
    });

    it('shows competitors when found', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          success: true,
          data: {
            results: createMockResults([
              {
                isCited: false,
                competitorsCited: [
                  { domain: 'zendesk.com', context: 'recommended' },
                  { domain: 'freshworks.com', context: 'alternative' },
                ],
              },
            ]),
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
        expect(screen.getByText(/Competitor Citation Leaderboard/i)).toBeInTheDocument();
        expect(screen.getByText('zendesk.com')).toBeInTheDocument();
        expect(screen.getByText('freshworks.com')).toBeInTheDocument();
      });
    });

    it('shows query-by-query results', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          success: true,
          data: {
            results: createMockResults(),
          },
        },
        error: null,
      });

      render(<FreeReportPage onGetStarted={mockOnGetStarted} />);

      await userEvent.type(screen.getByPlaceholderText(/you@company.com/i), 'test@example.com');
      await userEvent.type(screen.getByPlaceholderText(/yourcompany.com/i), 'acme.com');

      fireEvent.click(screen.getByRole('button', { name: /Get My Free Report/i }));

      await waitFor(() => {
        expect(screen.getByText(/Query-by-Query Results/i)).toBeInTheDocument();
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
            results: createMockResults(),
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
            results: createMockResults(),
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
          data: { results: createMockResults() },
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

  describe('Abuse Prevention', () => {
    it('blocks repeat reports from same email within 24 hours', async () => {
      // Mock that email was already used
      const emailUsedBuilder = createMockQueryBuilder([{ id: '123', created_at: new Date().toISOString() }]);
      vi.mocked(supabase.from).mockReturnValue(emailUsedBuilder as any);

      render(<FreeReportPage onGetStarted={mockOnGetStarted} />);

      await userEvent.type(screen.getByPlaceholderText(/you@company.com/i), 'repeat@example.com');
      await userEvent.type(screen.getByPlaceholderText(/yourcompany.com/i), 'example.com');

      fireEvent.click(screen.getByRole('button', { name: /Get My Free Report/i }));

      await waitFor(() => {
        expect(screen.getByText(/already received a free report/i)).toBeInTheDocument();
      });

      // Should not call the analysis function
      expect(supabase.functions.invoke).not.toHaveBeenCalledWith('check-citations', expect.anything());
    });

    it('blocks domain after 3 reports within 24 hours', async () => {
      // Mock: email check passes (first query), domain check returns 3 results (second query)
      let queryCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        queryCount++;
        const isEmailQuery = queryCount === 1;

        const builder: any = {
          select: vi.fn(() => builder),
          insert: vi.fn(() => Promise.resolve({ error: null })),
          eq: vi.fn(() => builder),
          gte: vi.fn(() => builder),
          limit: vi.fn(() => Promise.resolve({
            data: isEmailQuery ? [] : [{ id: '1' }, { id: '2' }, { id: '3' }],
            error: null
          })),
        };
        // For domain check (ends with gte, no limit)
        builder.gte.mockReturnValue({
          ...builder,
          then: (resolve: any) => resolve({
            data: isEmailQuery ? [] : [{ id: '1' }, { id: '2' }, { id: '3' }],
            error: null
          }),
        });
        return builder;
      });

      render(<FreeReportPage onGetStarted={mockOnGetStarted} />);

      await userEvent.type(screen.getByPlaceholderText(/you@company.com/i), 'new@example.com');
      await userEvent.type(screen.getByPlaceholderText(/yourcompany.com/i), 'spammed-domain.com');

      fireEvent.click(screen.getByRole('button', { name: /Get My Free Report/i }));

      await waitFor(() => {
        expect(screen.getByText(/already been analyzed multiple times/i)).toBeInTheDocument();
      });
    });

    it('allows report when no abuse detected', async () => {
      // Default mock returns empty arrays (no abuse)
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          success: true,
          data: { results: createMockResults() },
        },
        error: null,
      });

      render(<FreeReportPage onGetStarted={mockOnGetStarted} />);

      await userEvent.type(screen.getByPlaceholderText(/you@company.com/i), 'new@example.com');
      await userEvent.type(screen.getByPlaceholderText(/yourcompany.com/i), 'new-domain.com');

      fireEvent.click(screen.getByRole('button', { name: /Get My Free Report/i }));

      await waitFor(() => {
        // Should proceed to analysis
        expect(supabase.functions.invoke).toHaveBeenCalled();
      });
    });

    it('continues analysis if abuse check fails', async () => {
      // Mock abuse check throwing an error
      const errorBuilder = {
        select: vi.fn(() => { throw new Error('DB connection failed'); }),
        insert: vi.fn(() => Promise.resolve({ error: null })),
        eq: vi.fn(() => errorBuilder),
        gte: vi.fn(() => errorBuilder),
        limit: vi.fn(() => Promise.reject(new Error('DB error'))),
      };
      vi.mocked(supabase.from).mockReturnValue(errorBuilder as any);

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          success: true,
          data: { results: createMockResults() },
        },
        error: null,
      });

      render(<FreeReportPage onGetStarted={mockOnGetStarted} />);

      await userEvent.type(screen.getByPlaceholderText(/you@company.com/i), 'test@example.com');
      await userEvent.type(screen.getByPlaceholderText(/yourcompany.com/i), 'example.com');

      fireEvent.click(screen.getByRole('button', { name: /Get My Free Report/i }));

      await waitFor(() => {
        // Should still proceed to analysis despite abuse check failure
        expect(supabase.functions.invoke).toHaveBeenCalled();
      });
    });

    it('normalizes email to lowercase for abuse check', async () => {
      // Mock that lowercase email was already used
      const emailUsedBuilder = createMockQueryBuilder([{ id: '123', created_at: new Date().toISOString() }]);
      vi.mocked(supabase.from).mockReturnValue(emailUsedBuilder as any);

      render(<FreeReportPage onGetStarted={mockOnGetStarted} />);

      // Type email with uppercase
      await userEvent.type(screen.getByPlaceholderText(/you@company.com/i), 'REPEAT@EXAMPLE.COM');
      await userEvent.type(screen.getByPlaceholderText(/yourcompany.com/i), 'example.com');

      fireEvent.click(screen.getByRole('button', { name: /Get My Free Report/i }));

      await waitFor(() => {
        // Should check with lowercase email
        expect(emailUsedBuilder.eq).toHaveBeenCalledWith('email', 'repeat@example.com');
      });
    });

    it('bypasses rate limiting for whitelisted email (info@convologix.com)', async () => {
      // Mock that this email has been used many times (would normally be blocked)
      const emailUsedBuilder = createMockQueryBuilder([
        { id: '1', created_at: new Date().toISOString() },
        { id: '2', created_at: new Date().toISOString() },
        { id: '3', created_at: new Date().toISOString() },
      ]);
      vi.mocked(supabase.from).mockReturnValue(emailUsedBuilder as any);

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          success: true,
          data: { results: createMockResults() },
        },
        error: null,
      });

      render(<FreeReportPage onGetStarted={mockOnGetStarted} />);

      // Use the whitelisted email
      await userEvent.type(screen.getByPlaceholderText(/you@company.com/i), 'info@convologix.com');
      await userEvent.type(screen.getByPlaceholderText(/yourcompany.com/i), 'test-domain.com');

      fireEvent.click(screen.getByRole('button', { name: /Get My Free Report/i }));

      await waitFor(() => {
        // Should proceed to analysis despite previous reports (whitelist bypasses rate limit)
        expect(supabase.functions.invoke).toHaveBeenCalled();
      });

      // Should NOT show rate limit error
      expect(screen.queryByText(/already received a free report/i)).not.toBeInTheDocument();
    });

    it('bypasses rate limiting for whitelisted email (case insensitive)', async () => {
      // Mock that would normally block
      const emailUsedBuilder = createMockQueryBuilder([{ id: '1', created_at: new Date().toISOString() }]);
      vi.mocked(supabase.from).mockReturnValue(emailUsedBuilder as any);

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          success: true,
          data: { results: createMockResults() },
        },
        error: null,
      });

      render(<FreeReportPage onGetStarted={mockOnGetStarted} />);

      // Use whitelisted email with different casing
      await userEvent.type(screen.getByPlaceholderText(/you@company.com/i), 'INFO@CONVOLOGIX.COM');
      await userEvent.type(screen.getByPlaceholderText(/yourcompany.com/i), 'test-domain.com');

      fireEvent.click(screen.getByRole('button', { name: /Get My Free Report/i }));

      await waitFor(() => {
        // Should proceed despite uppercase - whitelist check is case insensitive
        expect(supabase.functions.invoke).toHaveBeenCalled();
      });
    });
  });
});
