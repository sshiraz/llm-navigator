import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccountPage from './AccountPage';
import { User } from '../../types';

// Must define mocks before vi.mock calls
const mockFunctionsInvoke = vi.fn();
const mockStorageUpload = vi.fn();
const mockStorageGetPublicUrl = vi.fn();
const mockFrom = vi.fn();

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: {}, error: null }),
        }),
      }),
    }),
    functions: {
      invoke: (name: string, options: any) => mockFunctionsInvoke(name, options),
    },
    storage: {
      from: () => ({
        upload: mockStorageUpload,
        getPublicUrl: mockStorageGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://test.com/logo.png' } }),
      }),
    },
  },
}));

// Mock AuthService
vi.mock('../../services/authService', () => ({
  AuthService: {
    signOut: vi.fn().mockResolvedValue({ success: true }),
    changePassword: vi.fn().mockResolvedValue({ success: true }),
  },
}));

// Mock ApiKeyService
vi.mock('../../services/apiKeyService', () => ({
  ApiKeyService: {
    listApiKeys: vi.fn().mockResolvedValue({ success: true, keys: [] }),
    createApiKey: vi.fn().mockResolvedValue({ success: true, key: 'llm_sk_test123' }),
    revokeApiKey: vi.fn().mockResolvedValue({ success: true }),
  },
}));

describe('AccountPage GDPR Features', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    subscription: 'professional',
    createdAt: '2024-01-01T00:00:00.000Z',
    isAdmin: false,
    paymentMethodAdded: true,
  };

  const mockOnBack = vi.fn();
  const mockOnUpdateProfile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Reset Supabase mocks
    mockFunctionsInvoke.mockResolvedValue({
      data: { success: true },
      error: null,
    });
  });

  describe('Account Security & Privacy Section', () => {
    it('should display Account Security & Privacy heading', () => {
      render(
        <AccountPage
          user={mockUser}
          onBack={mockOnBack}
          onUpdateProfile={mockOnUpdateProfile}
        />
      );

      expect(screen.getByText('Account Security & Privacy')).toBeInTheDocument();
    });

    it('should display Change Password button', () => {
      render(
        <AccountPage
          user={mockUser}
          onBack={mockOnBack}
          onUpdateProfile={mockOnUpdateProfile}
        />
      );

      expect(screen.getByText('Change Password')).toBeInTheDocument();
    });
  });

  describe('Data Export Feature', () => {
    it('should display Export Your Data section', () => {
      render(
        <AccountPage
          user={mockUser}
          onBack={mockOnBack}
          onUpdateProfile={mockOnUpdateProfile}
        />
      );

      expect(screen.getByText('Export Your Data')).toBeInTheDocument();
      expect(screen.getByText(/Download a copy of all your data/i)).toBeInTheDocument();
    });

    it('should display Download My Data button', () => {
      render(
        <AccountPage
          user={mockUser}
          onBack={mockOnBack}
          onUpdateProfile={mockOnUpdateProfile}
        />
      );

      expect(screen.getByText('Download My Data')).toBeInTheDocument();
    });
  });

  describe('Account Deletion Feature', () => {
    it('should display Delete Account section', () => {
      render(
        <AccountPage
          user={mockUser}
          onBack={mockOnBack}
          onUpdateProfile={mockOnUpdateProfile}
        />
      );

      expect(screen.getByText('Delete Account')).toBeInTheDocument();
      expect(screen.getByText(/Permanently delete your account/i)).toBeInTheDocument();
    });

    it('should display Delete My Account button', () => {
      render(
        <AccountPage
          user={mockUser}
          onBack={mockOnBack}
          onUpdateProfile={mockOnUpdateProfile}
        />
      );

      expect(screen.getByText('Delete My Account')).toBeInTheDocument();
    });

    it('should open delete confirmation modal when button is clicked', async () => {
      render(
        <AccountPage
          user={mockUser}
          onBack={mockOnBack}
          onUpdateProfile={mockOnUpdateProfile}
        />
      );

      const deleteButton = screen.getByText('Delete My Account');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/This action is permanent and cannot be undone/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Type DELETE to confirm')).toBeInTheDocument();
      });
    });

    it('should list what gets deleted in the modal', async () => {
      render(
        <AccountPage
          user={mockUser}
          onBack={mockOnBack}
          onUpdateProfile={mockOnUpdateProfile}
        />
      );

      fireEvent.click(screen.getByText('Delete My Account'));

      await waitFor(() => {
        expect(screen.getByText(/Your profile and account information/i)).toBeInTheDocument();
        expect(screen.getByText(/All analyses and reports/i)).toBeInTheDocument();
        expect(screen.getByText(/All projects and history/i)).toBeInTheDocument();
        expect(screen.getByText(/API keys and usage data/i)).toBeInTheDocument();
      });
    });

    it('should require typing DELETE to enable confirmation', async () => {
      const user = userEvent.setup();

      render(
        <AccountPage
          user={mockUser}
          onBack={mockOnBack}
          onUpdateProfile={mockOnUpdateProfile}
        />
      );

      fireEvent.click(screen.getByText('Delete My Account'));

      await waitFor(() => {
        const confirmButton = screen.getAllByText('Delete My Account')[1]; // Modal button
        expect(confirmButton).toBeDisabled();
      });

      // Type DELETE
      const input = screen.getByPlaceholderText('Type DELETE to confirm');
      await user.type(input, 'DELETE');

      await waitFor(() => {
        const confirmButton = screen.getAllByText('Delete My Account')[1];
        expect(confirmButton).not.toBeDisabled();
      });
    });

    it('should close modal when Cancel is clicked', async () => {
      render(
        <AccountPage
          user={mockUser}
          onBack={mockOnBack}
          onUpdateProfile={mockOnUpdateProfile}
        />
      );

      fireEvent.click(screen.getByText('Delete My Account'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type DELETE to confirm')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Type DELETE to confirm')).not.toBeInTheDocument();
      });
    });

    it('should call delete-account function when confirmed', async () => {
      const user = userEvent.setup();

      mockFunctionsInvoke.mockResolvedValue({
        data: { success: true, message: 'Account deleted' },
        error: null,
      });

      render(
        <AccountPage
          user={mockUser}
          onBack={mockOnBack}
          onUpdateProfile={mockOnUpdateProfile}
        />
      );

      fireEvent.click(screen.getByText('Delete My Account'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type DELETE to confirm')).toBeInTheDocument();
      });

      // Type DELETE
      const input = screen.getByPlaceholderText('Type DELETE to confirm');
      await user.type(input, 'DELETE');

      // Click confirm
      const confirmButton = screen.getAllByText('Delete My Account')[1];
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockFunctionsInvoke).toHaveBeenCalledWith('delete-account', {
          body: { userId: 'user-123' },
        });
      });
    });

    it('should show error message when deletion fails', async () => {
      const user = userEvent.setup();

      mockFunctionsInvoke.mockResolvedValue({
        data: { success: false, error: 'Deletion failed' },
        error: null,
      });

      render(
        <AccountPage
          user={mockUser}
          onBack={mockOnBack}
          onUpdateProfile={mockOnUpdateProfile}
        />
      );

      fireEvent.click(screen.getByText('Delete My Account'));

      const input = screen.getByPlaceholderText('Type DELETE to confirm');
      await user.type(input, 'DELETE');

      const confirmButton = screen.getAllByText('Delete My Account')[1];
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/Deletion failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Account Created Display', () => {
    it('should display account creation label', () => {
      render(
        <AccountPage
          user={mockUser}
          onBack={mockOnBack}
          onUpdateProfile={mockOnUpdateProfile}
        />
      );

      expect(screen.getByText('Account Created')).toBeInTheDocument();
    });
  });
});

describe('AccountPage GDPR Features - Admin Restrictions', () => {
  const adminUser: User = {
    id: 'admin-123',
    email: 'admin@example.com',
    name: 'Admin User',
    subscription: 'enterprise',
    createdAt: '2024-01-01T00:00:00.000Z',
    isAdmin: true,
    paymentMethodAdded: false,
  };

  const mockOnBack = vi.fn();
  const mockOnUpdateProfile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should still show data export for admins', () => {
    render(
      <AccountPage
        user={adminUser}
        onBack={mockOnBack}
        onUpdateProfile={mockOnUpdateProfile}
      />
    );

    expect(screen.getByText('Export Your Data')).toBeInTheDocument();
    expect(screen.getByText('Download My Data')).toBeInTheDocument();
  });

  it('should still show delete account for admins', () => {
    render(
      <AccountPage
        user={adminUser}
        onBack={mockOnBack}
        onUpdateProfile={mockOnUpdateProfile}
      />
    );

    expect(screen.getByText('Delete Account')).toBeInTheDocument();
    expect(screen.getByText('Delete My Account')).toBeInTheDocument();
  });
});
