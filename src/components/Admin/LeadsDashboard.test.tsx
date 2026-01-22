import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Use vi.hoisted to create mutable mock data that can be changed per test
const { mockSupabaseData } = vi.hoisted(() => ({
  mockSupabaseData: {
    leads: [
      {
        id: 'lead-1',
        email: 'john@example.com',
        website: 'example.com',
        is_cited: true,
        ai_score: 75,
        citation_rate: 45,
        industry: 'Technology',
        competitor_count: 2,
        created_at: '2024-01-15T10:00:00Z'
      },
      {
        id: 'lead-2',
        email: 'jane@test.com',
        website: 'testsite.org',
        is_cited: false,
        ai_score: 35,
        citation_rate: 10,
        industry: 'Healthcare',
        competitor_count: 5,
        created_at: '2024-01-10T10:00:00Z'
      },
      {
        id: 'lead-3',
        email: 'bob@startup.io',
        website: 'startup.io',
        is_cited: true,
        ai_score: 90,
        citation_rate: 80,
        industry: 'Technology',
        competitor_count: 0,
        created_at: '2024-01-05T10:00:00Z'
      }
    ]
  }
}));

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockImplementation((table: string) => ({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockImplementation(() => Promise.resolve({
          data: table === 'free_report_leads' ? mockSupabaseData.leads : [],
          error: null
        }))
      })
    })),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null })
    }
  }
}));

import LeadsDashboard from './LeadsDashboard';

describe('LeadsDashboard Component', () => {
  const mockAdminUser = {
    id: 'admin-user',
    email: 'admin@test.com',
    name: 'Admin User',
    isAdmin: true,
    subscription: 'enterprise',
    createdAt: new Date().toISOString()
  };

  const initialMockLeads = [
    {
      id: 'lead-1',
      email: 'john@example.com',
      website: 'example.com',
      is_cited: true,
      ai_score: 75,
      citation_rate: 45,
      industry: 'Technology',
      competitor_count: 2,
      created_at: '2024-01-15T10:00:00Z'
    },
    {
      id: 'lead-2',
      email: 'jane@test.com',
      website: 'testsite.org',
      is_cited: false,
      ai_score: 35,
      citation_rate: 10,
      industry: 'Healthcare',
      competitor_count: 5,
      created_at: '2024-01-10T10:00:00Z'
    },
    {
      id: 'lead-3',
      email: 'bob@startup.io',
      website: 'startup.io',
      is_cited: true,
      ai_score: 90,
      citation_rate: 80,
      industry: 'Technology',
      competitor_count: 0,
      created_at: '2024-01-05T10:00:00Z'
    }
  ];

  const originalLocation = window.location;

  beforeEach(() => {
    mockSupabaseData.leads = [...initialMockLeads];

    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, hash: '#admin-leads' },
      writable: true,
      configurable: true
    });

    localStorage.clear();
    localStorage.setItem('currentUser', JSON.stringify(mockAdminUser));
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true
    });
  });

  describe('Admin Access', () => {
    it('should render leads dashboard for admin users', async () => {
      render(<LeadsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Free Report Leads')).toBeInTheDocument();
      });
    });

    it('should show access denied for non-admin users', async () => {
      localStorage.setItem('currentUser', JSON.stringify({
        ...mockAdminUser,
        isAdmin: false
      }));

      render(<LeadsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });
    });

    it('should show access denied when not logged in', async () => {
      localStorage.removeItem('currentUser');

      render(<LeadsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });
    });
  });

  describe('Lead List Display', () => {
    it('should display leads in the table', async () => {
      render(<LeadsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('jane@test.com')).toBeInTheDocument();
        expect(screen.getByText('bob@startup.io')).toBeInTheDocument();
      });
    });

    it('should display websites as links', async () => {
      render(<LeadsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('example.com')).toBeInTheDocument();
        expect(screen.getByText('testsite.org')).toBeInTheDocument();
        expect(screen.getByText('startup.io')).toBeInTheDocument();
      });
    });

    it('should display AI scores with color coding', async () => {
      render(<LeadsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('75')).toBeInTheDocument();
        expect(screen.getByText('35')).toBeInTheDocument();
        expect(screen.getByText('90')).toBeInTheDocument();
      });
    });

    it('should display lead count', async () => {
      render(<LeadsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('3 leads found')).toBeInTheDocument();
      });
    });

    it('should show "No leads found" when list is empty', async () => {
      mockSupabaseData.leads = [];

      render(<LeadsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('No leads found')).toBeInTheDocument();
      });
    });

    it('should display cited/not-cited badges', async () => {
      render(<LeadsDashboard />);

      await waitFor(() => {
        const yesElements = screen.getAllByText('Yes');
        const noElements = screen.getAllByText('No');
        expect(yesElements.length).toBe(2); // john and bob are cited
        expect(noElements.length).toBe(1); // jane is not cited
      });
    });
  });

  describe('Search Functionality', () => {
    it('should have search input field', async () => {
      render(<LeadsDashboard />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search by email or website...')).toBeInTheDocument();
      });
    });

    it('should filter leads by email when searching', async () => {
      const user = userEvent.setup();
      render(<LeadsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by email or website...');
      await user.type(searchInput, 'jane');

      await waitFor(() => {
        expect(screen.getByText('jane@test.com')).toBeInTheDocument();
        expect(screen.queryByText('john@example.com')).not.toBeInTheDocument();
        expect(screen.queryByText('bob@startup.io')).not.toBeInTheDocument();
      });
    });

    it('should filter leads by website when searching', async () => {
      const user = userEvent.setup();
      render(<LeadsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by email or website...');
      await user.type(searchInput, 'startup');

      await waitFor(() => {
        expect(screen.getByText('bob@startup.io')).toBeInTheDocument();
        expect(screen.queryByText('john@example.com')).not.toBeInTheDocument();
      });
    });

    it('should show "No leads found" for non-matching search', async () => {
      const user = userEvent.setup();
      render(<LeadsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by email or website...');
      await user.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText('No leads found')).toBeInTheDocument();
      });
    });
  });

  describe('Filter Functionality', () => {
    it('should have citation status filter dropdown', async () => {
      render(<LeadsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('All Citation Status')).toBeInTheDocument();
      });
    });

    it('should have industry filter dropdown', async () => {
      render(<LeadsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('All Industries')).toBeInTheDocument();
      });
    });

    it('should have filter dropdown options', async () => {
      render(<LeadsDashboard />);

      await waitFor(() => {
        // Citation filter options exist (Not Cited is unique to the filter dropdown)
        expect(screen.getByText('Not Cited')).toBeInTheDocument();
      });
    });
  });

  describe('Summary Stats', () => {
    it('should display total leads label', async () => {
      render(<LeadsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Leads')).toBeInTheDocument();
      });
    });

    it('should display cited label in stats', async () => {
      render(<LeadsDashboard />);

      await waitFor(() => {
        // The stat card label (not the filter option)
        const citedLabels = screen.getAllByText('Cited');
        expect(citedLabels.length).toBeGreaterThan(0);
      });
    });

    it('should display avg AI score label', async () => {
      render(<LeadsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Avg AI Score')).toBeInTheDocument();
      });
    });

    it('should display top industry label', async () => {
      render(<LeadsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Top Industry')).toBeInTheDocument();
      });
    });

    it('should display this week label', async () => {
      render(<LeadsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('This Week')).toBeInTheDocument();
      });
    });
  });

  describe('Action Buttons', () => {
    it('should have Refresh button', async () => {
      render(<LeadsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });
    });

    it('should have Export CSV button', async () => {
      render(<LeadsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Export CSV')).toBeInTheDocument();
      });
    });

    it('should have Back to Dashboard button', async () => {
      render(<LeadsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('Table Sorting', () => {
    it('should have sortable Email column', async () => {
      render(<LeadsDashboard />);

      await waitFor(() => {
        const emailHeader = screen.getByText('Email').closest('th');
        expect(emailHeader).toHaveClass('cursor-pointer');
      });
    });

    it('should have sortable Website column', async () => {
      render(<LeadsDashboard />);

      await waitFor(() => {
        const websiteHeader = screen.getByText('Website').closest('th');
        expect(websiteHeader).toHaveClass('cursor-pointer');
      });
    });

    it('should have sortable AI Score column', async () => {
      render(<LeadsDashboard />);

      await waitFor(() => {
        const scoreHeader = screen.getByText('AI Score').closest('th');
        expect(scoreHeader).toHaveClass('cursor-pointer');
      });
    });

    it('should have sortable Date column', async () => {
      render(<LeadsDashboard />);

      await waitFor(() => {
        const dateHeader = screen.getByText('Date').closest('th');
        expect(dateHeader).toHaveClass('cursor-pointer');
      });
    });

    it('should sort by email when clicking Email header', async () => {
      const user = userEvent.setup();
      render(<LeadsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
      });

      const emailHeader = screen.getByText('Email').closest('th');
      await user.click(emailHeader!);

      await waitFor(() => {
        // Check that sorting indicator appears
        expect(emailHeader).toHaveTextContent('↑');
      });
    });
  });

  describe('Clear Filters', () => {
    it('should show Clear filters button when filters applied and no results', async () => {
      const user = userEvent.setup();
      render(<LeadsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by email or website...');
      await user.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText('Clear filters')).toBeInTheDocument();
      });
    });

    it('should clear filters when clicking Clear filters', async () => {
      const user = userEvent.setup();
      render(<LeadsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by email or website...');
      await user.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText('No leads found')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Clear filters'));

      await waitFor(() => {
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('3 leads found')).toBeInTheDocument();
      });
    });
  });

  describe('CSV Export', () => {
    it('should have Export CSV button that triggers download', async () => {
      const user = userEvent.setup();

      // Mock URL.createObjectURL
      const mockCreateObjectURL = vi.fn(() => 'blob:test');
      global.URL.createObjectURL = mockCreateObjectURL;

      // Store original createElement
      const originalCreateElement = document.createElement.bind(document);
      const mockClick = vi.fn();

      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        const element = originalCreateElement(tagName);
        if (tagName === 'a') {
          element.click = mockClick;
        }
        return element;
      });

      render(<LeadsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Export CSV')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Export CSV'));

      expect(mockCreateObjectURL).toHaveBeenCalled();
    });
  });

  describe('Refresh Functionality', () => {
    it('should reload leads when clicking Refresh', async () => {
      const user = userEvent.setup();
      const { supabase } = await import('../../lib/supabase');

      render(<LeadsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('3 leads found')).toBeInTheDocument();
      });

      // Add a new lead to mock data
      mockSupabaseData.leads = [...mockSupabaseData.leads, {
        id: 'lead-4',
        email: 'new@example.com',
        website: 'newsite.com',
        is_cited: false,
        ai_score: 50,
        citation_rate: 25,
        industry: 'Finance',
        competitor_count: 1,
        created_at: new Date().toISOString()
      }];

      await user.click(screen.getByText('Refresh'));

      await waitFor(() => {
        expect(screen.getByText('new@example.com')).toBeInTheDocument();
        expect(screen.getByText('4 leads found')).toBeInTheDocument();
      });
    });
  });
});
