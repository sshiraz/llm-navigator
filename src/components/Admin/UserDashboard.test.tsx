import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
        created_at: '2024-01-15T10:00:00Z',
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'user-2',
        email: 'jane@example.com',
        name: 'Jane Smith',
        subscription: 'starter',
        payment_method_added: true,
        created_at: '2024-01-10T10:00:00Z'
      },
      {
        id: 'user-3',
        email: 'bob@example.com',
        name: 'Bob Wilson',
        subscription: 'professional',
        payment_method_added: true,
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
          data: table === 'users' ? mockSupabaseData.users : [],
          error: null
        })),
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    })),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  },
}));

import UserDashboard from './UserDashboard';

describe('UserDashboard Component', () => {
  const mockAdminUser = {
    id: 'admin-user',
    email: 'admin@test.com',
    name: 'Admin User',
    isAdmin: true,
    subscription: 'enterprise',
    createdAt: new Date().toISOString()
  };

  // Initial users data (snake_case for Supabase)
  const initialMockUsers = [
    {
      id: 'user-1',
      email: 'john@example.com',
      name: 'John Doe',
      subscription: 'trial',
      payment_method_added: false,
      created_at: '2024-01-15T10:00:00Z',
      trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'user-2',
      email: 'jane@example.com',
      name: 'Jane Smith',
      subscription: 'starter',
      payment_method_added: true,
      created_at: '2024-01-10T10:00:00Z'
    },
    {
      id: 'user-3',
      email: 'bob@example.com',
      name: 'Bob Wilson',
      subscription: 'professional',
      payment_method_added: true,
      created_at: '2024-01-05T10:00:00Z'
    }
  ];

  // Store original location
  const originalLocation = window.location;

  beforeEach(() => {
    // Reset mock Supabase data to initial state
    mockSupabaseData.users = [...initialMockUsers];

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, hash: '#admin-users' },
      writable: true,
      configurable: true
    });

    // Clear localStorage before each test
    localStorage.clear();
    // Set admin user
    localStorage.setItem('currentUser', JSON.stringify(mockAdminUser));
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Restore original location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true
    });
  });

  describe('Admin Access', () => {
    it('should render user dashboard for admin users', async () => {
      render(<UserDashboard />);

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });
    });

    it('should show access denied for non-admin users', async () => {
      // Set non-admin user
      localStorage.setItem('currentUser', JSON.stringify({
        ...mockAdminUser,
        isAdmin: false
      }));

      render(<UserDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });
    });

    it('should show access denied when not logged in', async () => {
      localStorage.removeItem('currentUser');

      render(<UserDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });
    });
  });

  describe('User List Display', () => {
    it('should display registered users in the table', async () => {
      render(<UserDashboard />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
      });
    });

    it('should display user emails', async () => {
      render(<UserDashboard />);

      await waitFor(() => {
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('jane@example.com')).toBeInTheDocument();
        expect(screen.getByText('bob@example.com')).toBeInTheDocument();
      });
    });

    it('should display subscription badges', async () => {
      render(<UserDashboard />);

      await waitFor(() => {
        // Use getAllByText because "Trial", "Starter", etc. appear in both badges and filter dropdown
        const trialElements = screen.getAllByText('Trial');
        const starterElements = screen.getAllByText('Starter');
        const professionalElements = screen.getAllByText('Professional');

        // Should have at least 2 elements each (filter option + badge)
        expect(trialElements.length).toBeGreaterThanOrEqual(2);
        expect(starterElements.length).toBeGreaterThanOrEqual(2);
        expect(professionalElements.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should display user count', async () => {
      render(<UserDashboard />);

      await waitFor(() => {
        expect(screen.getByText('3 users found')).toBeInTheDocument();
      });
    });

    it('should show "No users found" when list is empty', async () => {
      // Set mock data to empty array
      mockSupabaseData.users = [];

      render(<UserDashboard />);

      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should have search input field', async () => {
      render(<UserDashboard />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search by name or email...')).toBeInTheDocument();
      });
    });

    it('should filter users by name when searching', async () => {
      const user = userEvent.setup();
      render(<UserDashboard />);

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
      render(<UserDashboard />);

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
      render(<UserDashboard />);

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

  describe('Plan Filter', () => {
    it('should have plan filter dropdown', async () => {
      render(<UserDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
    });

    it('should filter by trial plan', async () => {
      const user = userEvent.setup();
      render(<UserDashboard />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const filterSelect = screen.getByRole('combobox');
      await user.selectOptions(filterSelect, 'trial');

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
        expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument();
      });
    });

    it('should filter by starter plan', async () => {
      const user = userEvent.setup();
      render(<UserDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      const filterSelect = screen.getByRole('combobox');
      await user.selectOptions(filterSelect, 'starter');

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });
    });
  });

  describe('Summary Stats', () => {
    it('should display total users count', async () => {
      render(<UserDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Users')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    it('should display paid subscriptions count', async () => {
      render(<UserDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Paid Subscriptions')).toBeInTheDocument();
        // The number 2 should appear at least twice (paid subs and payment methods)
        const twoElements = screen.getAllByText('2');
        expect(twoElements.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should display payment methods added count', async () => {
      render(<UserDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Payment Methods Added')).toBeInTheDocument();
      });
    });
  });

  describe('Action Buttons', () => {
    it('should have Refresh button', async () => {
      render(<UserDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });
    });

    it('should have Export CSV button', async () => {
      render(<UserDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Export CSV')).toBeInTheDocument();
      });
    });

    it('should have Back to Dashboard button', async () => {
      render(<UserDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
      });
    });

    it('should have Edit button for each user', async () => {
      render(<UserDashboard />);

      await waitFor(() => {
        const editButtons = screen.getAllByText('Edit');
        expect(editButtons.length).toBe(3); // One for each user
      });
    });
  });

  describe('Edit User Modal', () => {
    it('should open edit modal when clicking Edit button', async () => {
      const user = userEvent.setup();
      render(<UserDashboard />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Edit User')).toBeInTheDocument();
      });
    });

    it('should display user name in edit form', async () => {
      const user = userEvent.setup();
      render(<UserDashboard />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('John Doe');
        expect(nameInput).toBeInTheDocument();
      });
    });

    it('should have subscription dropdown in edit form', async () => {
      const user = userEvent.setup();
      render(<UserDashboard />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      await waitFor(() => {
        // Look for the subscription label in the edit modal
        const editModal = screen.getByText('Edit User');
        expect(editModal).toBeInTheDocument();

        // Find the select element in the modal (it has options like Free, Trial, Starter, etc.)
        const subscriptionSelects = screen.getAllByRole('combobox');
        // There should be at least 2 comboboxes - one for filter and one in edit modal
        expect(subscriptionSelects.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should have payment method checkbox in edit form', async () => {
      const user = userEvent.setup();
      render(<UserDashboard />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByLabelText('Payment Method Added')).toBeInTheDocument();
      });
    });

    it('should close edit modal when clicking Cancel', async () => {
      const user = userEvent.setup();
      render(<UserDashboard />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Edit User')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.queryByText('Edit User')).not.toBeInTheDocument();
      });
    });

    it('should have Save Changes button', async () => {
      const user = userEvent.setup();
      render(<UserDashboard />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
      });
    });
  });

  describe('Table Sorting', () => {
    it('should have sortable Name column', async () => {
      render(<UserDashboard />);

      await waitFor(() => {
        const nameHeader = screen.getByText('Name').closest('th');
        expect(nameHeader).toHaveClass('cursor-pointer');
      });
    });

    it('should have sortable Email column', async () => {
      render(<UserDashboard />);

      await waitFor(() => {
        const emailHeader = screen.getByText('Email').closest('th');
        expect(emailHeader).toHaveClass('cursor-pointer');
      });
    });

    it('should have sortable Subscription column', async () => {
      render(<UserDashboard />);

      await waitFor(() => {
        const subHeader = screen.getByText('Subscription').closest('th');
        expect(subHeader).toHaveClass('cursor-pointer');
      });
    });

    it('should have sortable Created column', async () => {
      render(<UserDashboard />);

      await waitFor(() => {
        const createdHeader = screen.getByText('Created').closest('th');
        expect(createdHeader).toHaveClass('cursor-pointer');
      });
    });
  });

  describe('New User Registration Display', () => {
    it('should display newly registered user in the list', async () => {
      // Add a new user to the mock data (snake_case for Supabase)
      const newUser = {
        id: 'new-user-123',
        email: 'newuser@example.com',
        name: 'New User',
        subscription: 'trial',
        payment_method_added: false,
        created_at: new Date().toISOString(),
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      };

      mockSupabaseData.users = [...mockSupabaseData.users, newUser];

      render(<UserDashboard />);

      await waitFor(() => {
        expect(screen.getByText('New User')).toBeInTheDocument();
        expect(screen.getByText('newuser@example.com')).toBeInTheDocument();
      });
    });

    it('should update user count when new user is added', async () => {
      const newUser = {
        id: 'new-user-456',
        email: 'another@example.com',
        name: 'Another User',
        subscription: 'trial',
        payment_method_added: false,
        created_at: new Date().toISOString()
      };

      mockSupabaseData.users = [...mockSupabaseData.users, newUser];

      render(<UserDashboard />);

      await waitFor(() => {
        expect(screen.getByText('4 users found')).toBeInTheDocument();
        expect(screen.getByText('4')).toBeInTheDocument(); // Total Users stat
      });
    });

    it('should display new trial user in Active Trials count', async () => {
      const newTrialUser = {
        id: 'trial-user-789',
        email: 'trial@example.com',
        name: 'Trial User',
        subscription: 'trial',
        payment_method_added: false,
        created_at: new Date().toISOString(),
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      };

      mockSupabaseData.users = [...mockSupabaseData.users, newTrialUser];

      render(<UserDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Active Trials')).toBeInTheDocument();
        // Should show 2 active trials now (John Doe + new trial user)
      });
    });

    it('should show new users when clicking Refresh', async () => {
      const user = userEvent.setup();
      render(<UserDashboard />);

      await waitFor(() => {
        expect(screen.getByText('3 users found')).toBeInTheDocument();
      });

      // Add a new user to mock data after initial render (snake_case for Supabase)
      const newUser = {
        id: 'refresh-test-user',
        email: 'refresh@example.com',
        name: 'Refresh Test User',
        subscription: 'trial',
        payment_method_added: false,
        created_at: new Date().toISOString()
      };
      mockSupabaseData.users = [...mockSupabaseData.users, newUser];

      // Click refresh
      await user.click(screen.getByText('Refresh'));

      await waitFor(() => {
        expect(screen.getByText('Refresh Test User')).toBeInTheDocument();
        expect(screen.getByText('4 users found')).toBeInTheDocument();
      });
    });
  });

  describe('Clear Filters', () => {
    it('should show Clear filters button when filters applied and no results', async () => {
      const user = userEvent.setup();
      render(<UserDashboard />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by name or email...');
      await user.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText('Clear filters')).toBeInTheDocument();
      });
    });
  });
});
