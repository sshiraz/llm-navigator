import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';

// Use vi.hoisted to create mocks that are available when vi.mock is hoisted
const {
  mockSignUp,
  mockSignInWithPassword,
  mockSignOut,
  mockGetSession,
  mockOnAuthStateChange,
  mockResend,
  mockFrom
} = vi.hoisted(() => ({
  mockSignUp: vi.fn(),
  mockSignInWithPassword: vi.fn(),
  mockSignOut: vi.fn(),
  mockGetSession: vi.fn(),
  mockOnAuthStateChange: vi.fn(() => ({
    data: { subscription: { unsubscribe: vi.fn() } },
  })),
  mockResend: vi.fn(),
  mockFrom: vi.fn(),
}));

// Mock the supabase module
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: mockSignUp,
      signInWithPassword: mockSignInWithPassword,
      signOut: mockSignOut,
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      resend: mockResend,
    },
    from: mockFrom,
  },
  handleSupabaseError: (error: any) => ({
    success: false,
    error: error.message || 'An unexpected error occurred',
  }),
  handleSupabaseSuccess: (data: any) => ({
    success: true,
    data,
  }),
}));

// Import after mocking
import { AuthService } from './authService';

// Track created users for cleanup
const createdTestUsers: string[] = [];

// Mock user data
const mockExistingUser = {
  id: 'existing-user-123',
  email: 'existing@test.com',
  name: 'Existing User',
  subscription: 'trial' as const,
  createdAt: new Date().toISOString(),
};

const mockUserProfile = {
  id: mockExistingUser.id,
  email: mockExistingUser.email,
  name: mockExistingUser.name,
  subscription: mockExistingUser.subscription,
  created_at: mockExistingUser.createdAt,
  trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  is_admin: false,
};

// Helper functions for setting up mocks
const resetMocks = () => {
  mockSignUp.mockReset();
  mockSignInWithPassword.mockReset();
  mockSignOut.mockReset();
  mockGetSession.mockReset();
  mockResend.mockReset();
  mockFrom.mockReset();
  createdTestUsers.length = 0;
};

const setupSuccessfulSignUp = (userData: { email: string; id: string }) => {
  createdTestUsers.push(userData.id);

  mockSignUp.mockResolvedValue({
    data: {
      user: { id: userData.id, email: userData.email },
      session: { access_token: 'test-token' },
    },
    error: null,
  });

  // Mock pre-check for existing user - return null (no existing user)
  // Profile is created by database trigger, not by the service
  mockFrom.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    }),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  });
};

const setupSuccessfulSignIn = () => {
  mockSignInWithPassword.mockResolvedValue({
    data: {
      user: { id: mockExistingUser.id, email: mockExistingUser.email },
      session: { access_token: 'test-token' },
    },
    error: null,
  });

  mockFrom.mockReturnValue({
    insert: vi.fn(),
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockUserProfile,
          error: null,
        }),
      }),
    }),
    update: vi.fn(),
    delete: vi.fn(),
  });
};

const setupFailedSignIn = () => {
  mockSignInWithPassword.mockResolvedValue({
    data: { user: null, session: null },
    error: { message: 'Invalid login credentials' },
  });
};

const setupSuccessfulSignOut = () => {
  mockSignOut.mockResolvedValue({
    error: null,
  });
};

const setupActiveSession = () => {
  mockGetSession.mockResolvedValue({
    data: {
      session: {
        user: { id: mockExistingUser.id, email: mockExistingUser.email },
        access_token: 'test-token',
      },
    },
    error: null,
  });

  mockFrom.mockReturnValue({
    insert: vi.fn(),
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockUserProfile,
          error: null,
        }),
      }),
    }),
    update: vi.fn(),
    delete: vi.fn(),
  });
};

const setupNoSession = () => {
  mockGetSession.mockResolvedValue({
    data: { session: null },
    error: null,
  });
};

describe('AuthService', () => {
  beforeEach(() => {
    resetMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Clean up all created test users after all tests
  afterAll(() => {
    console.log(`Test cleanup: ${createdTestUsers.length} test user(s) would be deleted`);
    // In a real scenario with actual Supabase, you would delete users here:
    // createdTestUsers.forEach(async (userId) => {
    //   await supabase.auth.admin.deleteUser(userId);
    //   await supabase.from('users').delete().eq('id', userId);
    // });
    resetMocks();
  });

  describe('signUp', () => {
    it('should successfully sign up a new user', async () => {
      const newUserData = {
        email: 'newuser@test.com',
        password: 'securePassword123',
        name: 'New User',
      };

      setupSuccessfulSignUp({
        email: newUserData.email,
        id: 'new-user-id-123',
      });

      const result = await AuthService.signUp(newUserData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(mockSignUp).toHaveBeenCalledWith({
        email: newUserData.email,
        password: newUserData.password,
        options: {
          data: {
            name: newUserData.name,
            company: undefined,
            website: undefined,
          },
          emailRedirectTo: expect.stringContaining('#email-confirmed'),
        },
      });
    });

    it('should handle sign up with company and website', async () => {
      const newUserData = {
        email: 'business@test.com',
        password: 'securePassword123',
        name: 'Business User',
        company: 'Test Company',
        website: 'https://test.com',
      };

      setupSuccessfulSignUp({
        email: newUserData.email,
        id: 'business-user-id-123',
      });

      const result = await AuthService.signUp(newUserData);

      expect(result.success).toBe(true);
      expect(mockSignUp).toHaveBeenCalledWith({
        email: newUserData.email,
        password: newUserData.password,
        options: {
          data: {
            name: newUserData.name,
            company: newUserData.company,
            website: newUserData.website,
          },
          emailRedirectTo: expect.stringContaining('#email-confirmed'),
        },
      });
    });

    it('should fail sign up when auth fails', async () => {
      const newUserData = {
        email: 'fail@test.com',
        password: 'short',
        name: 'Fail User',
      };

      // Mock pre-check: no existing user
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'No rows found' },
            }),
          }),
        }),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      });

      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Password should be at least 6 characters' },
      });

      const result = await AuthService.signUp(newUserData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Password should be at least 6 characters');
    });

    it('should handle duplicate email sign up', async () => {
      const existingUserData = {
        email: mockExistingUser.email,
        password: 'securePassword123',
        name: 'Duplicate User',
      };

      // Mock pre-check: user already exists in users table
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'existing-id', email: existingUserData.email },
              error: null,
            }),
          }),
        }),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      });

      const result = await AuthService.signUp(existingUserData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('This email is already registered. Please sign in instead.');
    });

    it('should return requiresEmailConfirmation when no session is returned', async () => {
      const newUserData = {
        email: 'needsconfirm@test.com',
        password: 'securePassword123',
        name: 'Needs Confirmation User',
      };

      // Mock pre-check: no existing user
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      });

      // Mock signUp returning user but NO session (email confirmation required)
      // Profile is created by database trigger automatically
      mockSignUp.mockResolvedValue({
        data: {
          user: { id: 'confirm-user-id', email: newUserData.email },
          session: null, // No session = email confirmation required
        },
        error: null,
      });

      const result = await AuthService.signUp(newUserData);

      expect(result.success).toBe(true);
      expect(result.data.requiresEmailConfirmation).toBe(true);
      expect(result.data.email).toBe(newUserData.email);
    });
  });

  describe('resendConfirmationEmail', () => {
    beforeEach(() => {
      resetMocks();
    });

    it('should successfully resend confirmation email', async () => {
      mockResend.mockResolvedValue({ error: null });

      const result = await AuthService.resendConfirmationEmail('test@example.com');

      expect(result.success).toBe(true);
      expect(mockResend).toHaveBeenCalledWith({
        type: 'signup',
        email: 'test@example.com',
        options: {
          emailRedirectTo: expect.stringContaining('#email-confirmed'),
        },
      });
    });

    it('should handle resend error', async () => {
      mockResend.mockResolvedValue({
        error: { message: 'Rate limit exceeded' }
      });

      const result = await AuthService.resendConfirmationEmail('test@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Rate limit exceeded');
    });
  });

  describe('signIn', () => {
    it('should successfully sign in an existing user', async () => {
      setupSuccessfulSignIn();

      const result = await AuthService.signIn(mockExistingUser.email, 'correctPassword');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.user).toBeDefined();
      expect(result.data.profile).toBeDefined();
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: mockExistingUser.email,
        password: 'correctPassword',
      });
    });

    it('should fail sign in with wrong password', async () => {
      setupFailedSignIn();

      const result = await AuthService.signIn(mockExistingUser.email, 'wrongPassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid login credentials');
    });

    it('should fail sign in for non-existing user', async () => {
      setupFailedSignIn();

      const result = await AuthService.signIn('nonexistent@test.com', 'anyPassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid login credentials');
    });

    it('should fail sign in with empty email', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'You must provide either an email or phone number' },
      });

      const result = await AuthService.signIn('', 'somePassword');

      expect(result.success).toBe(false);
      expect(result.error).toContain('email');
    });

    it('should fail sign in with empty password', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      const result = await AuthService.signIn(mockExistingUser.email, '');

      expect(result.success).toBe(false);
    });
  });

  describe('signOut', () => {
    it('should successfully sign out a logged in user', async () => {
      setupSuccessfulSignOut();

      const result = await AuthService.signOut();

      expect(result.success).toBe(true);
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should handle sign out errors gracefully', async () => {
      mockSignOut.mockResolvedValue({
        error: { message: 'Network error' },
      });

      const result = await AuthService.signOut();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('getCurrentSession', () => {
    it('should return user data when session exists', async () => {
      setupActiveSession();

      const result = await AuthService.getCurrentSession();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.user).toBeDefined();
      expect(result.data.profile).toBeDefined();
    });

    it('should return null when no session exists', async () => {
      setupNoSession();

      const result = await AuthService.getCurrentSession();

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should handle session fetch errors', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' },
      });

      const result = await AuthService.getCurrentSession();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Session expired');
    });
  });

  describe('updateProfile', () => {
    it('should successfully update user profile', async () => {
      const userId = mockExistingUser.id;
      const updates = { name: 'Updated Name' };

      mockFrom.mockReturnValue({
        insert: vi.fn(),
        select: vi.fn(),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { ...mockUserProfile, ...updates },
                error: null,
              }),
            }),
          }),
        }),
        delete: vi.fn(),
      });

      const result = await AuthService.updateProfile(userId, updates);

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Updated Name');
    });

    it('should handle profile update errors', async () => {
      const userId = mockExistingUser.id;
      const updates = { name: 'Updated Name' };

      mockFrom.mockReturnValue({
        insert: vi.fn(),
        select: vi.fn(),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'User not found' },
              }),
            }),
          }),
        }),
        delete: vi.fn(),
      });

      const result = await AuthService.updateProfile(userId, updates);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });
  });

  describe('onAuthStateChange', () => {
    it('should set up auth state listener', () => {
      const callback = vi.fn();

      AuthService.onAuthStateChange(callback);

      expect(mockOnAuthStateChange).toHaveBeenCalledWith(callback);
    });
  });
});

describe('Auth Flow Integration', () => {
  beforeEach(() => {
    resetMocks();
  });

  afterAll(() => {
    // Final cleanup of any test users
    console.log(`Final cleanup: ${createdTestUsers.length} test user(s) tracked for cleanup`);
    resetMocks();
  });

  it('should handle complete sign up -> sign in -> sign out flow', async () => {
    // Step 1: Sign up
    const newUserEmail = 'flowtest@test.com';
    const newUserId = 'flow-test-user-id';

    setupSuccessfulSignUp({
      email: newUserEmail,
      id: newUserId,
    });

    const signUpResult = await AuthService.signUp({
      email: newUserEmail,
      password: 'securePassword123',
      name: 'Flow Test User',
    });

    expect(signUpResult.success).toBe(true);

    // Step 2: Sign in
    mockSignInWithPassword.mockResolvedValue({
      data: {
        user: { id: newUserId, email: newUserEmail },
        session: { access_token: 'test-token' },
      },
      error: null,
    });

    mockFrom.mockReturnValue({
      insert: vi.fn(),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { ...mockUserProfile, id: newUserId, email: newUserEmail },
            error: null,
          }),
        }),
      }),
      update: vi.fn(),
      delete: vi.fn(),
    });

    const signInResult = await AuthService.signIn(newUserEmail, 'securePassword123');

    expect(signInResult.success).toBe(true);

    // Step 3: Sign out
    setupSuccessfulSignOut();

    const signOutResult = await AuthService.signOut();

    expect(signOutResult.success).toBe(true);
  });

  it('should have no active session after sign out', async () => {
    // Sign out
    setupSuccessfulSignOut();
    await AuthService.signOut();

    // Verify session is cleared
    setupNoSession();
    const sessionResult = await AuthService.getCurrentSession();

    expect(sessionResult.success).toBe(true);
    expect(sessionResult.data).toBeNull();
  });
});
