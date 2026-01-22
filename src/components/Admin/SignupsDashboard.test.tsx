import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Use vi.hoisted to create mutable mock data that can be changed per test
const { mockSupabaseData } = vi.hoisted(() => ({
  mockSupabaseData: {
    users: [
      {
        id: 'user-1',
        email: 'john@example.com',
        name: 'John Doe',
        subscription: 'trial',
        payment_method_added: false,
        is_admin: false,
        created_at: '2024-01-15T10:00:00Z',
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'user-2',
        email: 'jane@example.com',
        name: 'Jane Smith',
        subscription: 'starter',
        payment_method_added: true,
        is_admin: false,
        created_at: '2024-01-10T10:00:00Z',
        trial_ends_at: null
      },
      {
        id: 'user-3',
        email: 'bob@example.com',
        name: 'Bob Wilson',
        subscription: 'professional',
        payment_method_added: true,
        is_admin: false,
        created_at: '2024-01-05T10:00:00Z',
        trial_ends_at: null
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
          data: table === 'users' ? mockSupabaseData.users : [],
          error: null
        }))
      })
    })),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null })
    }
  }
}));

import SignupsDashboard from './SignupsDashboard';

describe('SignupsDashboard Component', () => {
  const mockAdminUser = {
    id: 'admin-user',
    email: 'admin@test.com',
    name: 'Admin User',
    isAdmin: true,
    subscription: 'enterprise',
    createdAt: new Date().toISOString()
  };

  const initialMockUsers = [
    {
      id: 'user-1',
      email: 'john@example.com',
      name: 'John Doe',
      subscription: 'trial',
      payment_method_added: false,
      is_admin: false,
      created_at: '2024-01-15T10:00:00Z',
      trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'user-2',
      email: 'jane@example.com',
      name: 'Jane Smith',
      subscription: 'starter',
      payment_method_added: true,
      is_admin: false,
      created_at: '2024-01-10T10:00:00Z',
      trial_ends_at: null
    },
    {
      id: 'user-3',
      email: 'bob@example.com',
      name: 'Bob Wilson',
      subscription: 'professional',
      payment_method_added: true,
      is_admin: false,
      created_at: '2024-01-05T10:00:00Z',
      trial_ends_at: null
    }
  ];

  const originalLocation = window.location;

  beforeEach(() => {
    mockSupabaseData.users = [...initialMockUsers];

    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, hash: '#admin-signups' },
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
    it('should render signups dashboard for admin users', async () => {
      render(<SignupsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Account Signups')).toBeInTheDocument();
      });
    });

    it('should show access denied for non-admin users', async () => {
      localStorage.setItem('currentUser', JSON.stringify({
        ...mockAdminUser,
        isAdmin: false
      }));

      render(<SignupsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });
    });

    it('should show access denied when not logged in', async () => {
      localStorage.removeItem('currentUser');

      render(<SignupsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });
    });
  });

  describe('User List Display', () => {
    it('should display users in the table', async () => {
      render(<SignupsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
      });
    });

    it('should display user emails', async () => {
      render(<SignupsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('jane@example.com')).toBeInTheDocument();
        expect(screen.getByText('bob@example.com')).toBeInTheDocument();
      });
    });

    it('should display subscription badges', async () => {
      render(<SignupsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Trial')).toBeInTheDocument();
        expect(screen.getByText('Starter')).toBeInTheDocument();
        expect(screen.getByText('Professional')).toBeInTheDocument();
      });
    });

    it('should display user count', async () => {
      render(<SignupsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('3 users found')).toBeInTheDocument();
      });
    });

    it('should show "No users found" when list is empty', async () => {
      mockSupabaseData.users = [];

      render(<SignupsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument();
      });
    });

    it('should display payment status badges', async () => {
      render(<SignupsDashboard />);

      await waitFor(() => {
        // John has no payment, Jane and Bob have payment
        const yesElements = screen.getAllByText('Yes');
        const noElements = screen.getAllByText('No');
        expect(yesElements.length).toBe(2);
        expect(noElements.length).toBe(1);
      });
    });
  });

  describe('Search Functionality', () => {
    it('should have search input field', async () => {
      render(<SignupsDashboard />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search by name or email...')).toBeInTheDocument();
      });
    });

    it('should filter users by name when searching', async () => {
      const user = userEvent.setup();
      render(<SignupsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by name or email...');
      await user.type(searchInput, 'Jane');

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
        expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument();
      });
    });

    it('should filter users by email when searching', async () => {
      const user = userEvent.setup();
      render(<SignupsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by name or email...');
      await user.type(searchInput, 'bob@');

      await waitFor(() => {
        expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });
    });

    it('should show "No users found" for non-matching search', async () => {
      const user = userEvent.setup();
      render(<SignupsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by name or email...');
      await user.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument();
      });
    });
  });

  describe('Filter Functionality', () => {
    it('should have plan filter dropdown', async () => {
      render(<SignupsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('All Plans')).toBeInTheDocument();
      });
    });

    it('should have payment status filter dropdown', async () => {
      render(<SignupsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('All Payment Status')).toBeInTheDocument();
      });
    });

    it('should have filter dropdown options', async () => {
      render(<SignupsDashboard />);

      await waitFor(() => {
        // Plan options
        expect(screen.getByText('Free')).toBeInTheDocument();
        expect(screen.getByText('Starter')).toBeInTheDocument();
        // Payment options
        expect(screen.getByText('Has Payment Method')).toBeInTheDocument();
        expect(screen.getByText('No Payment Method')).toBeInTheDocument();
      });
    });
  });

  describe('Summary Stats', () => {
    it('should display total users count', async () => {
      render(<SignupsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Users')).toBeInTheDocument();
      });
    });

    it('should display paid users label', async () => {
      render(<SignupsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Paid')).toBeInTheDocument();
      });
    });

    it('should display active trials label', async () => {
      render(<SignupsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Active Trials')).toBeInTheDocument();
      });
    });

    it('should display payment added label', async () => {
      render(<SignupsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Payment Added')).toBeInTheDocument();
      });
    });

    it('should display this week label', async () => {
      render(<SignupsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('This Week')).toBeInTheDocument();
      });
    });
  });

  describe('Action Buttons', () => {
    it('should have Refresh button', async () => {
      render(<SignupsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });
    });

    it('should have Export CSV button', async () => {
      render(<SignupsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Export CSV')).toBeInTheDocument();
      });
    });

    it('should have Back to Dashboard button', async () => {
      render(<SignupsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('Table Sorting', () => {
    it('should have sortable Name column', async () => {
      render(<SignupsDashboard />);

      await waitFor(() => {
        const nameHeader = screen.getByText('Name').closest('th');
        expect(nameHeader).toHaveClass('cursor-pointer');
      });
    });

    it('should have sortable Email column', async () => {
      render(<SignupsDashboard />);

      await waitFor(() => {
        const emailHeader = screen.getByText('Email').closest('th');
        expect(emailHeader).toHaveClass('cursor-pointer');
      });
    });

    it('should have sortable Plan column', async () => {
      render(<SignupsDashboard />);

      await waitFor(() => {
        const planHeader = screen.getByText('Plan').closest('th');
        expect(planHeader).toHaveClass('cursor-pointer');
      });
    });

    it('should have sortable Signed Up column', async () => {
      render(<SignupsDashboard />);

      await waitFor(() => {
        const signedUpHeader = screen.getByText('Signed Up').closest('th');
        expect(signedUpHeader).toHaveClass('cursor-pointer');
      });
    });

    it('should sort by name when clicking Name header', async () => {
      const user = userEvent.setup();
      render(<SignupsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const nameHeader = screen.getByText('Name').closest('th');
      await user.click(nameHeader!);

      await waitFor(() => {
        expect(nameHeader).toHaveTextContent('↑');
      });
    });
  });

  describe('Clear Filters', () => {
    it('should show Clear filters button when filters applied and no results', async () => {
      const user = userEvent.setup();
      render(<SignupsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by name or email...');
      await user.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText('Clear filters')).toBeInTheDocument();
      });
    });

    it('should clear filters when clicking Clear filters', async () => {
      const user = userEvent.setup();
      render(<SignupsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by name or email...');
      await user.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Clear filters'));

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('3 users found')).toBeInTheDocument();
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

      render(<SignupsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Export CSV')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Export CSV'));

      expect(mockCreateObjectURL).toHaveBeenCalled();
    });
  });

  describe('Refresh Functionality', () => {
    it('should reload users when clicking Refresh', async () => {
      const user = userEvent.setup();

      render(<SignupsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('3 users found')).toBeInTheDocument();
      });

      // Add a new user to mock data
      mockSupabaseData.users = [...mockSupabaseData.users, {
        id: 'user-4',
        email: 'new@example.com',
        name: 'New User',
        subscription: 'trial',
        payment_method_added: false,
        is_admin: false,
        created_at: new Date().toISOString(),
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      }];

      await user.click(screen.getByText('Refresh'));

      await waitFor(() => {
        expect(screen.getByText('New User')).toBeInTheDocument();
        expect(screen.getByText('4 users found')).toBeInTheDocument();
      });
    });
  });

  describe('Trial Status Display', () => {
    it('should display trial status column', async () => {
      render(<SignupsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Trial Status')).toBeInTheDocument();
      });
    });

    it('should show trial user with days remaining', async () => {
      render(<SignupsDashboard />);

      await waitFor(() => {
        // John has active trial with days remaining
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });
});
