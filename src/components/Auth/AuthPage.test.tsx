import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthPage from './AuthPage';

// Helper to create a delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock AuthService
vi.mock('../../services/authService', () => ({
  AuthService: {
    signIn: vi.fn().mockImplementation(async (email: string, password: string) => {
      // Add a small delay to allow loading state to be visible
      await new Promise(resolve => setTimeout(resolve, 100));

      // Simulate different responses based on email
      if (email === 'notfound@example.com') {
        return {
          success: false,
          error: 'No account found with this email address',
        };
      }
      if (email === 'demo@example.com' || email === 'existing@test.com') {
        return {
          success: true,
          data: {
            id: 'demo-user-id',
            email: email,
            name: 'Demo User',
            subscription: 'trial',
          },
        };
      }
      return {
        success: false,
        error: 'Invalid credentials',
      };
    }),
    signUp: vi.fn().mockImplementation(async () => {
      // Add a small delay to allow loading state to be visible
      await new Promise(resolve => setTimeout(resolve, 100));
      return {
        success: true,
        data: {
          id: 'new-user-id',
          email: 'test@example.com',
          name: 'Test User',
          subscription: 'trial',
        },
      };
    }),
  },
}));

describe('AuthPage Component', () => {
  const mockOnLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Login Mode (Default)', () => {
    it('should render login form by default', () => {
      render(<AuthPage onLogin={mockOnLogin} />);

      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByText('Sign in to your LLM Navigator account')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('john@company.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    });

    it('should have email input field that accepts input', async () => {
      const user = userEvent.setup();
      render(<AuthPage onLogin={mockOnLogin} />);

      const emailInput = screen.getByPlaceholderText('john@company.com');
      await user.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('should have password input field that accepts input', async () => {
      const user = userEvent.setup();
      render(<AuthPage onLogin={mockOnLogin} />);

      const passwordInput = screen.getByPlaceholderText('Enter your password');
      await user.type(passwordInput, 'mySecurePassword');

      expect(passwordInput).toHaveValue('mySecurePassword');
    });

    it('should have password field with type="password"', () => {
      render(<AuthPage onLogin={mockOnLogin} />);

      const passwordInput = screen.getByPlaceholderText('Enter your password');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should have a Sign In button', () => {
      render(<AuthPage onLogin={mockOnLogin} />);

      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should have Forgot Password button in login mode', () => {
      render(<AuthPage onLogin={mockOnLogin} />);

      expect(screen.getByText('Forgot your password?')).toBeInTheDocument();
    });

    it('should have toggle to signup mode', () => {
      render(<AuthPage onLogin={mockOnLogin} />);

      expect(screen.getByText("Don't have an account? Start your free trial")).toBeInTheDocument();
    });

    it('should NOT show name field in login mode', () => {
      render(<AuthPage onLogin={mockOnLogin} />);

      expect(screen.queryByPlaceholderText('John Doe')).not.toBeInTheDocument();
    });

    it('should NOT show company field in login mode', () => {
      render(<AuthPage onLogin={mockOnLogin} />);

      expect(screen.queryByPlaceholderText('Acme Corp')).not.toBeInTheDocument();
    });

    it('should NOT show website field in login mode', () => {
      render(<AuthPage onLogin={mockOnLogin} />);

      expect(screen.queryByPlaceholderText('https://acme.com')).not.toBeInTheDocument();
    });

    it('should show error when logging in with non-existent email', async () => {
      const user = userEvent.setup();
      render(<AuthPage onLogin={mockOnLogin} />);

      await user.type(screen.getByPlaceholderText('john@company.com'), 'notfound@example.com');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText('No account found with this email address')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Signup Mode', () => {
    it('should switch to signup mode when toggle clicked', async () => {
      const user = userEvent.setup();
      render(<AuthPage onLogin={mockOnLogin} />);

      await user.click(screen.getByText("Don't have an account? Start your free trial"));

      expect(screen.getByText('Start Your Free Trial')).toBeInTheDocument();
      expect(screen.getByText('Join thousands optimizing for AI search')).toBeInTheDocument();
    });

    it('should show name field in signup mode', async () => {
      const user = userEvent.setup();
      render(<AuthPage onLogin={mockOnLogin} />);

      await user.click(screen.getByText("Don't have an account? Start your free trial"));

      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    });

    it('should show company field in signup mode', async () => {
      const user = userEvent.setup();
      render(<AuthPage onLogin={mockOnLogin} />);

      await user.click(screen.getByText("Don't have an account? Start your free trial"));

      expect(screen.getByPlaceholderText('Acme Corp')).toBeInTheDocument();
    });

    it('should show website field in signup mode', async () => {
      const user = userEvent.setup();
      render(<AuthPage onLogin={mockOnLogin} />);

      await user.click(screen.getByText("Don't have an account? Start your free trial"));

      expect(screen.getByPlaceholderText('https://acme.com')).toBeInTheDocument();
    });

    it('should have name input that accepts input', async () => {
      const user = userEvent.setup();
      render(<AuthPage onLogin={mockOnLogin} />);

      await user.click(screen.getByText("Don't have an account? Start your free trial"));
      const nameInput = screen.getByPlaceholderText('John Doe');
      await user.type(nameInput, 'Jane Smith');

      expect(nameInput).toHaveValue('Jane Smith');
    });

    it('should have company input that accepts input', async () => {
      const user = userEvent.setup();
      render(<AuthPage onLogin={mockOnLogin} />);

      await user.click(screen.getByText("Don't have an account? Start your free trial"));
      const companyInput = screen.getByPlaceholderText('Acme Corp');
      await user.type(companyInput, 'Test Company Inc');

      expect(companyInput).toHaveValue('Test Company Inc');
    });

    it('should have website input that accepts input', async () => {
      const user = userEvent.setup();
      render(<AuthPage onLogin={mockOnLogin} />);

      await user.click(screen.getByText("Don't have an account? Start your free trial"));
      const websiteInput = screen.getByPlaceholderText('https://acme.com');
      await user.type(websiteInput, 'https://mysite.com');

      expect(websiteInput).toHaveValue('https://mysite.com');
    });

    it('should show password placeholder as "Create a password" in signup mode', async () => {
      const user = userEvent.setup();
      render(<AuthPage onLogin={mockOnLogin} />);

      await user.click(screen.getByText("Don't have an account? Start your free trial"));

      expect(screen.getByPlaceholderText('Create a password')).toBeInTheDocument();
    });

    it('should show Start Free Trial button in signup mode', async () => {
      const user = userEvent.setup();
      render(<AuthPage onLogin={mockOnLogin} />);

      await user.click(screen.getByText("Don't have an account? Start your free trial"));

      expect(screen.getByRole('button', { name: /start free trial/i })).toBeInTheDocument();
    });

    it('should show Terms of Service link in signup mode', async () => {
      const user = userEvent.setup();
      render(<AuthPage onLogin={mockOnLogin} />);

      await user.click(screen.getByText("Don't have an account? Start your free trial"));

      expect(screen.getByText('Terms of Service')).toBeInTheDocument();
    });

    it('should show Privacy Policy link in signup mode', async () => {
      const user = userEvent.setup();
      render(<AuthPage onLogin={mockOnLogin} />);

      await user.click(screen.getByText("Don't have an account? Start your free trial"));

      expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    });

    it('should show trial info text in signup mode', async () => {
      const user = userEvent.setup();
      render(<AuthPage onLogin={mockOnLogin} />);

      await user.click(screen.getByText("Don't have an account? Start your free trial"));

      expect(screen.getByText(/14-day free trial/)).toBeInTheDocument();
      expect(screen.getByText(/No credit card required/)).toBeInTheDocument();
    });

    it('should NOT show Forgot Password button in signup mode', async () => {
      const user = userEvent.setup();
      render(<AuthPage onLogin={mockOnLogin} />);

      await user.click(screen.getByText("Don't have an account? Start your free trial"));

      expect(screen.queryByText('Forgot your password?')).not.toBeInTheDocument();
    });

    it('should have toggle to login mode', async () => {
      const user = userEvent.setup();
      render(<AuthPage onLogin={mockOnLogin} />);

      await user.click(screen.getByText("Don't have an account? Start your free trial"));

      expect(screen.getByText('Already have an account? Sign in')).toBeInTheDocument();
    });
  });

  describe('Mode Toggle', () => {
    it('should toggle between login and signup modes', async () => {
      const user = userEvent.setup();
      render(<AuthPage onLogin={mockOnLogin} />);

      // Start in login mode
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();

      // Switch to signup
      await user.click(screen.getByText("Don't have an account? Start your free trial"));
      expect(screen.getByText('Start Your Free Trial')).toBeInTheDocument();

      // Switch back to login
      await user.click(screen.getByText('Already have an account? Sign in'));
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    });

    it('should clear form fields when toggling modes', async () => {
      const user = userEvent.setup();
      render(<AuthPage onLogin={mockOnLogin} />);

      // Type in login mode
      const emailInput = screen.getByPlaceholderText('john@company.com');
      await user.type(emailInput, 'test@example.com');
      expect(emailInput).toHaveValue('test@example.com');

      // Toggle to signup
      await user.click(screen.getByText("Don't have an account? Start your free trial"));

      // Email should be cleared
      const newEmailInput = screen.getByPlaceholderText('john@company.com');
      expect(newEmailInput).toHaveValue('');
    });
  });

  describe('Form Validation', () => {
    it('should have required attribute on email field', () => {
      render(<AuthPage onLogin={mockOnLogin} />);

      const emailInput = screen.getByPlaceholderText('john@company.com');
      expect(emailInput).toHaveAttribute('required');
    });

    it('should have required attribute on password field', () => {
      render(<AuthPage onLogin={mockOnLogin} />);

      const passwordInput = screen.getByPlaceholderText('Enter your password');
      expect(passwordInput).toHaveAttribute('required');
    });

    it('should have required attribute on name field in signup mode', async () => {
      const user = userEvent.setup();
      render(<AuthPage onLogin={mockOnLogin} />);

      await user.click(screen.getByText("Don't have an account? Start your free trial"));

      const nameInput = screen.getByPlaceholderText('John Doe');
      expect(nameInput).toHaveAttribute('required');
    });

    it('should have type="email" on email field', () => {
      render(<AuthPage onLogin={mockOnLogin} />);

      const emailInput = screen.getByPlaceholderText('john@company.com');
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should have type="url" on website field', async () => {
      const user = userEvent.setup();
      render(<AuthPage onLogin={mockOnLogin} />);

      await user.click(screen.getByText("Don't have an account? Start your free trial"));

      const websiteInput = screen.getByPlaceholderText('https://acme.com');
      expect(websiteInput).toHaveAttribute('type', 'url');
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when submitting', async () => {
      const user = userEvent.setup();
      localStorage.setItem('users', JSON.stringify([{
        email: 'existing@test.com',
        password: 'password123',
        name: 'Test User'
      }]));

      render(<AuthPage onLogin={mockOnLogin} />);

      await user.type(screen.getByPlaceholderText('john@company.com'), 'existing@test.com');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      expect(screen.getByText('Signing In...')).toBeInTheDocument();
    });
  });

  describe('Email Confirmation Flow', () => {
    it('should show email confirmed banner when emailJustConfirmed prop is true', () => {
      const mockOnConfirmationAcknowledged = vi.fn();
      render(
        <AuthPage
          onLogin={mockOnLogin}
          emailJustConfirmed={true}
          onConfirmationAcknowledged={mockOnConfirmationAcknowledged}
        />
      );

      expect(screen.getByText(/email confirmed/i)).toBeInTheDocument();
      expect(screen.getByText(/you can now sign in/i)).toBeInTheDocument();
    });

    it('should not show email confirmed banner when emailJustConfirmed is false', () => {
      render(<AuthPage onLogin={mockOnLogin} emailJustConfirmed={false} />);

      expect(screen.queryByText(/email confirmed/i)).not.toBeInTheDocument();
    });

    it('should show Check Your Email screen after signup requiring confirmation', async () => {
      // Override the signUp mock to return requiresEmailConfirmation
      const { AuthService } = await import('../../services/authService');
      vi.mocked(AuthService.signUp).mockResolvedValueOnce({
        success: true,
        data: {
          requiresEmailConfirmation: true,
          email: 'newuser@example.com',
        },
      });

      const user = userEvent.setup();
      render(<AuthPage onLogin={mockOnLogin} />);

      // Switch to signup mode
      await user.click(screen.getByText("Don't have an account? Start your free trial"));

      // Fill out the form
      await user.type(screen.getByPlaceholderText('John Doe'), 'New User');
      await user.type(screen.getByPlaceholderText('john@company.com'), 'newuser@example.com');
      await user.type(screen.getByPlaceholderText('Create a password'), 'password123');

      // Submit the form
      await user.click(screen.getByRole('button', { name: /start free trial/i }));

      // Wait for the "Check Your Email" screen
      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });

      expect(screen.getByText('newuser@example.com')).toBeInTheDocument();
    });

    it('should have Back to Sign In button on email confirmation screen', async () => {
      // Override the signUp mock to return requiresEmailConfirmation
      const { AuthService } = await import('../../services/authService');
      vi.mocked(AuthService.signUp).mockResolvedValueOnce({
        success: true,
        data: {
          requiresEmailConfirmation: true,
          email: 'backtest@example.com',
        },
      });

      const user = userEvent.setup();
      render(<AuthPage onLogin={mockOnLogin} />);

      // Switch to signup mode
      await user.click(screen.getByText("Don't have an account? Start your free trial"));

      // Fill and submit form
      await user.type(screen.getByPlaceholderText('John Doe'), 'Test User');
      await user.type(screen.getByPlaceholderText('john@company.com'), 'backtest@example.com');
      await user.type(screen.getByPlaceholderText('Create a password'), 'password123');
      await user.click(screen.getByRole('button', { name: /start free trial/i }));

      // Wait for email confirmation screen
      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });

      // Click back to sign in
      const backButton = screen.getByRole('button', { name: /back to sign in/i });
      expect(backButton).toBeInTheDocument();

      await user.click(backButton);

      // Should return to login form
      await waitFor(() => {
        expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      });
    });
  });
});
