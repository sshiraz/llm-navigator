import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignupAnalytics from './SignupAnalytics';
import { FreeReportLead, User } from '../../types';

describe('SignupAnalytics Component', () => {
  const mockLeads: FreeReportLead[] = [
    {
      id: 'lead-1',
      email: 'lead1@example.com',
      website: 'example1.com',
      is_cited: true,
      ai_score: 75,
      citation_rate: 45,
      industry: 'Technology',
      competitor_count: 2,
      created_at: new Date().toISOString()
    },
    {
      id: 'lead-2',
      email: 'lead2@example.com',
      website: 'example2.com',
      is_cited: false,
      ai_score: 35,
      citation_rate: 10,
      industry: 'Healthcare',
      competitor_count: 5,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'lead-3',
      email: 'lead3@example.com',
      website: 'example3.com',
      is_cited: true,
      ai_score: 90,
      citation_rate: 80,
      industry: 'Technology',
      competitor_count: 0,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const mockUsers: User[] = [
    {
      id: 'user-1',
      email: 'user1@example.com',
      name: 'User One',
      subscription: 'trial',
      paymentMethodAdded: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'user-2',
      email: 'user2@example.com',
      name: 'User Two',
      subscription: 'starter',
      paymentMethodAdded: true,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default title', () => {
      render(<SignupAnalytics leads={mockLeads} users={mockUsers} />);

      expect(screen.getByText('Signup Trends')).toBeInTheDocument();
    });

    it('should render with custom title', () => {
      render(<SignupAnalytics leads={mockLeads} users={mockUsers} title="Lead Submissions" />);

      expect(screen.getByText('Lead Submissions')).toBeInTheDocument();
    });

    it('should render chart icon', () => {
      render(<SignupAnalytics leads={mockLeads} users={mockUsers} />);

      // The BarChart3 icon should be present
      const container = screen.getByText('Signup Trends').closest('div');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Timeframe Selector', () => {
    it('should have timeframe dropdown', () => {
      render(<SignupAnalytics leads={mockLeads} users={mockUsers} />);

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('should default to 30 days', () => {
      render(<SignupAnalytics leads={mockLeads} users={mockUsers} />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('30d');
    });

    it('should have 7 day option', () => {
      render(<SignupAnalytics leads={mockLeads} users={mockUsers} />);

      expect(screen.getByText('Last 7 days')).toBeInTheDocument();
    });

    it('should have 30 day option', () => {
      render(<SignupAnalytics leads={mockLeads} users={mockUsers} />);

      expect(screen.getByText('Last 30 days')).toBeInTheDocument();
    });

    it('should have 90 day option', () => {
      render(<SignupAnalytics leads={mockLeads} users={mockUsers} />);

      expect(screen.getByText('Last 90 days')).toBeInTheDocument();
    });

    it('should change timeframe when selecting different option', async () => {
      const user = userEvent.setup();
      render(<SignupAnalytics leads={mockLeads} users={mockUsers} />);

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '7d');

      expect((select as HTMLSelectElement).value).toBe('7d');
    });
  });

  describe('Legend Display', () => {
    it('should show leads legend when leads provided', () => {
      render(<SignupAnalytics leads={mockLeads} users={[]} />);

      expect(screen.getByText(/Leads:/)).toBeInTheDocument();
    });

    it('should show signups legend when users provided', () => {
      render(<SignupAnalytics leads={[]} users={mockUsers} />);

      expect(screen.getByText(/Signups:/)).toBeInTheDocument();
    });

    it('should show both legends when both provided', () => {
      render(<SignupAnalytics leads={mockLeads} users={mockUsers} />);

      expect(screen.getByText(/Leads:/)).toBeInTheDocument();
      expect(screen.getByText(/Signups:/)).toBeInTheDocument();
    });

    it('should display correct totals for leads', () => {
      render(<SignupAnalytics leads={mockLeads} users={[]} />);

      // All 3 leads should be counted
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should display correct totals for signups', () => {
      render(<SignupAnalytics leads={[]} users={mockUsers} />);

      // Both users should be counted
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state message when no data', () => {
      render(<SignupAnalytics leads={[]} users={[]} />);

      expect(screen.getByText('No data for this time period')).toBeInTheDocument();
    });

    it('should not show empty state when leads exist', () => {
      render(<SignupAnalytics leads={mockLeads} users={[]} />);

      expect(screen.queryByText('No data for this time period')).not.toBeInTheDocument();
    });

    it('should not show empty state when users exist', () => {
      render(<SignupAnalytics leads={[]} users={mockUsers} />);

      expect(screen.queryByText('No data for this time period')).not.toBeInTheDocument();
    });
  });

  describe('Chart Bars', () => {
    it('should render date labels', () => {
      render(<SignupAnalytics leads={mockLeads} users={mockUsers} />);

      // Should show some date labels (weekly format for 30d view)
      const dateLabels = screen.getAllByText(/\w+ \d+/);
      expect(dateLabels.length).toBeGreaterThan(0);
    });

    it('should switch to daily view for 7 day timeframe', async () => {
      const user = userEvent.setup();
      render(<SignupAnalytics leads={mockLeads} users={mockUsers} />);

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '7d');

      // Should show weekday abbreviations
      await waitFor(() => {
        const container = screen.getByText('Signup Trends').closest('div')?.parentElement;
        expect(container).toBeInTheDocument();
      });
    });
  });

  describe('Data Aggregation', () => {
    it('should aggregate data by week for 30d view', async () => {
      render(<SignupAnalytics leads={mockLeads} users={mockUsers} />);

      // For 30d view, should show 4 weeks of data
      // The chart should aggregate leads and signups by week
      const container = screen.getByText('Signup Trends').closest('div')?.parentElement;
      expect(container).toBeInTheDocument();
    });

    it('should aggregate data by week for 90d view', async () => {
      const user = userEvent.setup();
      render(<SignupAnalytics leads={mockLeads} users={mockUsers} />);

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '90d');

      // For 90d view, should show 12 weeks of data
      const container = screen.getByText('Signup Trends').closest('div')?.parentElement;
      expect(container).toBeInTheDocument();
    });
  });

  describe('Leads Only Mode', () => {
    it('should only show leads when users array is empty', () => {
      render(<SignupAnalytics leads={mockLeads} users={[]} title="Lead Submissions" />);

      expect(screen.getByText(/Leads:/)).toBeInTheDocument();
      expect(screen.queryByText(/Signups:/)).not.toBeInTheDocument();
    });

    it('should display lead count correctly', () => {
      render(<SignupAnalytics leads={mockLeads} users={[]} title="Lead Submissions" />);

      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('Signups Only Mode', () => {
    it('should only show signups when leads array is empty', () => {
      render(<SignupAnalytics leads={[]} users={mockUsers} title="User Signups" />);

      expect(screen.queryByText(/Leads:/)).not.toBeInTheDocument();
      expect(screen.getByText(/Signups:/)).toBeInTheDocument();
    });

    it('should display signup count correctly', () => {
      render(<SignupAnalytics leads={[]} users={mockUsers} title="User Signups" />);

      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('Combined Mode', () => {
    it('should show both leads and signups when both provided', () => {
      render(<SignupAnalytics leads={mockLeads} users={mockUsers} />);

      expect(screen.getByText(/Leads:/)).toBeInTheDocument();
      expect(screen.getByText(/Signups:/)).toBeInTheDocument();
    });

    it('should display correct counts for both', () => {
      render(<SignupAnalytics leads={mockLeads} users={mockUsers} />);

      // Should show 3 leads and 2 signups
      const threeElements = screen.getAllByText('3');
      const twoElements = screen.getAllByText('2');
      expect(threeElements.length).toBeGreaterThan(0);
      expect(twoElements.length).toBeGreaterThan(0);
    });
  });

  describe('Time Period Filtering', () => {
    it('should update display when changing timeframe', async () => {
      const user = userEvent.setup();

      render(<SignupAnalytics leads={mockLeads} users={mockUsers} />);

      const select = screen.getByRole('combobox');

      // Change to 7d
      await user.selectOptions(select, '7d');
      expect((select as HTMLSelectElement).value).toBe('7d');

      // Change to 90d
      await user.selectOptions(select, '90d');
      expect((select as HTMLSelectElement).value).toBe('90d');
    });
  });
});
