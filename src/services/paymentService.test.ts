import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to create mocks that are available when vi.mock is hoisted
const { mockFrom, mockFunctionsInvoke } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockFunctionsInvoke: vi.fn(),
}));

// Mock the supabase module
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    functions: {
      invoke: mockFunctionsInvoke,
    },
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

// Mock payment logger
vi.mock('../utils/paymentLogger', () => ({
  PaymentLogger: {
    log: vi.fn(),
    trackPaymentFlow: vi.fn(),
    trackDatabaseUpdate: vi.fn(),
  },
}));

// Mock live mode
vi.mock('../utils/liveMode', () => ({
  isLiveMode: false,
}));

// Mock storage manager
vi.mock('../utils/storageManager', () => ({
  StorageManager: {
    getCurrentUser: vi.fn().mockReturnValue(null),
    updateCurrentUser: vi.fn(),
  },
}));

// Import after mocking
import { PaymentService } from './paymentService';

// Helper to reset mocks
const resetMocks = () => {
  mockFrom.mockReset();
  mockFunctionsInvoke.mockReset();
};

// Mock user data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  subscription: 'trial',
  payment_method_added: false,
};

describe('PaymentService', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('createPaymentIntent', () => {
    it('should successfully create a payment intent for valid plan', async () => {
      mockFunctionsInvoke.mockResolvedValue({
        data: {
          clientSecret: 'pi_test_secret',
          amount: 2900,
          currency: 'usd',
        },
        error: null,
      });

      const result = await PaymentService.createPaymentIntent(
        'user-123',
        'starter',
        'test@example.com'
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(mockFunctionsInvoke).toHaveBeenCalledWith('create-payment-intent', {
        body: expect.objectContaining({
          amount: 2900,
          currency: 'usd',
        }),
      });
    });

    it('should fail for invalid plan', async () => {
      const result = await PaymentService.createPaymentIntent(
        'user-123',
        'invalid-plan',
        'test@example.com'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid plan selected');
    });

    it('should handle API errors', async () => {
      mockFunctionsInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Network error' },
      });

      const result = await PaymentService.createPaymentIntent(
        'user-123',
        'starter',
        'test@example.com'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('createSubscription', () => {
    it('should successfully create a subscription', async () => {
      mockFunctionsInvoke.mockResolvedValue({
        data: {
          id: 'sub_123',
          status: 'active',
        },
        error: null,
      });

      const result = await PaymentService.createSubscription(
        'user-123',
        'professional',
        'test@example.com',
        'pm_123'
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(mockFunctionsInvoke).toHaveBeenCalledWith('create-subscription', {
        body: expect.objectContaining({
          userId: 'user-123',
          plan: 'professional',
          email: 'test@example.com',
          paymentMethodId: 'pm_123',
        }),
      });
    });

    it('should fail for invalid plan', async () => {
      const result = await PaymentService.createSubscription(
        'user-123',
        'invalid',
        'test@example.com',
        'pm_123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid plan selected');
    });
  });

  describe('handlePaymentSuccess', () => {
    it('should update user subscription on payment success', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      mockFrom.mockReturnValue({
        update: mockUpdate,
        insert: vi.fn().mockResolvedValue({ error: null }),
      });

      const result = await PaymentService.handlePaymentSuccess(
        'user-123',
        'starter',
        'pi_123'
      );

      expect(result.success).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('users');
    });

    it('should handle update errors', async () => {
      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
        }),
      });

      const result = await PaymentService.handlePaymentSuccess(
        'user-123',
        'starter',
        'pi_123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update subscription');
    });
  });

  describe('fixSubscription', () => {
    it('should successfully fix subscription for existing user', async () => {
      // Mock user lookup
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { ...mockUser, subscription: 'trial' },
            error: null,
          }),
        }),
      });

      // Mock update
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [{ ...mockUser, subscription: 'starter' }],
            error: null,
          }),
        }),
      });

      // Mock insert for payment record
      const mockInsert = vi.fn().mockResolvedValue({ error: null });

      mockFrom.mockReturnValue({
        select: mockSelect,
        update: mockUpdate,
        insert: mockInsert,
      });

      const result = await PaymentService.fixSubscription('user-123', 'starter');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Subscription successfully updated to starter');
    });

    it('should return success if subscription already matches', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { ...mockUser, subscription: 'starter', payment_method_added: true },
              error: null,
            }),
          }),
        }),
      });

      const result = await PaymentService.fixSubscription('user-123', 'starter');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Subscription already set to starter');
    });

    it('should fail if user not found', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'User not found' },
            }),
          }),
        }),
      });

      const result = await PaymentService.fixSubscription('nonexistent-user', 'starter');

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('checkSubscriptionStatus', () => {
    it('should detect subscription needing fix', async () => {
      // Mock user with trial subscription
      const mockUserSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { ...mockUser, subscription: 'trial' },
            error: null,
          }),
        }),
      });

      // Mock payments showing successful payment
      const mockPaymentsSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [{ id: 'payment-1', status: 'succeeded', plan: 'starter' }],
                error: null,
              }),
            }),
          }),
        }),
      });

      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return { select: mockUserSelect };
        }
        if (table === 'payments') {
          return { select: mockPaymentsSelect };
        }
        return {};
      });

      const result = await PaymentService.checkSubscriptionStatus('user-123');

      expect(result.needsFix).toBe(true);
      expect(result.currentPlan).toBe('trial');
      expect(result.hasPayment).toBe(true);
    });

    it('should return no fix needed for paid user', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...mockUser, subscription: 'starter' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'payments') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({
                      data: [{ id: 'payment-1', status: 'succeeded' }],
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await PaymentService.checkSubscriptionStatus('user-123');

      expect(result.needsFix).toBe(false);
      expect(result.currentPlan).toBe('starter');
    });
  });

  describe('getLatestPayment', () => {
    it('should return latest payment for user', async () => {
      const mockPayment = {
        id: 'payment-1',
        user_id: 'user-123',
        plan: 'starter',
        amount: 2900,
        status: 'succeeded',
        created_at: new Date().toISOString(),
      };

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [mockPayment],
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await PaymentService.getLatestPayment('user-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('payment-1');
      expect(result.plan).toBe('starter');
    });

    it('should return null if no payments found', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await PaymentService.getLatestPayment('user-123');

      expect(result).toBeNull();
    });
  });

  describe('cancelSubscription', () => {
    it('should successfully cancel subscription', async () => {
      mockFunctionsInvoke.mockResolvedValue({
        error: null,
      });

      const result = await PaymentService.cancelSubscription('user_123', 'sub_123');

      expect(result.success).toBe(true);
      expect(mockFunctionsInvoke).toHaveBeenCalledWith('cancel-subscription', {
        body: { userId: 'user_123', subscriptionId: 'sub_123' },
      });
    });

    it('should handle cancellation errors', async () => {
      mockFunctionsInvoke.mockResolvedValue({
        error: { message: 'Subscription not found' },
      });

      const result = await PaymentService.cancelSubscription('user_123', 'sub_123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Subscription not found');
    });
  });
});

describe('PaymentService Plan Configurations', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('should use correct amount for starter plan', async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: {}, error: null });

    await PaymentService.createPaymentIntent('user-123', 'starter', 'test@example.com');

    expect(mockFunctionsInvoke).toHaveBeenCalledWith(
      'create-payment-intent',
      expect.objectContaining({
        body: expect.objectContaining({ amount: 2900 }),
      })
    );
  });

  it('should use correct amount for professional plan', async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: {}, error: null });

    await PaymentService.createPaymentIntent('user-123', 'professional', 'test@example.com');

    expect(mockFunctionsInvoke).toHaveBeenCalledWith(
      'create-payment-intent',
      expect.objectContaining({
        body: expect.objectContaining({ amount: 9900 }),
      })
    );
  });

  it('should use correct amount for enterprise plan', async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: {}, error: null });

    await PaymentService.createPaymentIntent('user-123', 'enterprise', 'test@example.com');

    expect(mockFunctionsInvoke).toHaveBeenCalledWith(
      'create-payment-intent',
      expect.objectContaining({
        body: expect.objectContaining({ amount: 29900 }),
      })
    );
  });
});
