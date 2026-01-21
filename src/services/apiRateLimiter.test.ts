import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Tests for API rate limiting logic
 *
 * The actual rate limiter is in supabase/functions/api/index.ts
 * This tests the rate limiting logic patterns used in the API.
 */

// Recreate the rate limiting logic from the API for testing
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const RATE_LIMIT = { perMinute: 10 };
const MONTHLY_LIMIT = 400;
const MAX_PROMPTS_PER_REQUEST = 10;

function createRateLimiter() {
  const rateLimitMap = new Map<string, RateLimitEntry>();

  return {
    check(userId: string): { allowed: boolean; retryAfter?: number } {
      const now = Date.now();
      const windowMs = 60 * 1000; // 1 minute

      const userLimit = rateLimitMap.get(userId);

      if (!userLimit || userLimit.resetAt < now) {
        rateLimitMap.set(userId, { count: 1, resetAt: now + windowMs });
        return { allowed: true };
      }

      if (userLimit.count >= RATE_LIMIT.perMinute) {
        const retryAfter = Math.ceil((userLimit.resetAt - now) / 1000);
        return { allowed: false, retryAfter };
      }

      userLimit.count++;
      return { allowed: true };
    },

    reset() {
      rateLimitMap.clear();
    },

    getEntry(userId: string): RateLimitEntry | undefined {
      return rateLimitMap.get(userId);
    }
  };
}

function validatePrompts(prompts: string[] | undefined): { valid: boolean; error?: string } {
  if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
    return { valid: false, error: 'prompts array is required and must not be empty' };
  }

  if (prompts.length > MAX_PROMPTS_PER_REQUEST) {
    return { valid: false, error: `Maximum ${MAX_PROMPTS_PER_REQUEST} prompts allowed per request` };
  }

  return { valid: true };
}

function checkMonthlyLimit(monthlyUsage: number): { allowed: boolean; error?: string } {
  if (monthlyUsage >= MONTHLY_LIMIT) {
    return { allowed: false, error: `Monthly analysis limit reached (${MONTHLY_LIMIT}/month)` };
  }
  return { allowed: true };
}

describe('API Rate Limiting', () => {
  describe('Per-minute Rate Limiter', () => {
    let rateLimiter: ReturnType<typeof createRateLimiter>;

    beforeEach(() => {
      rateLimiter = createRateLimiter();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('allows first request', () => {
      const result = rateLimiter.check('user-1');
      expect(result.allowed).toBe(true);
      expect(result.retryAfter).toBeUndefined();
    });

    it('allows up to 10 requests per minute', () => {
      const userId = 'user-2';

      for (let i = 0; i < 10; i++) {
        const result = rateLimiter.check(userId);
        expect(result.allowed).toBe(true);
      }

      // 11th request should be blocked
      const result = rateLimiter.check(userId);
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('returns retry-after seconds when rate limited', () => {
      const userId = 'user-3';

      // Use up all requests
      for (let i = 0; i < 10; i++) {
        rateLimiter.check(userId);
      }

      // Advance time by 30 seconds
      vi.advanceTimersByTime(30 * 1000);

      const result = rateLimiter.check(userId);
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeLessThanOrEqual(30);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('resets rate limit after 1 minute window', () => {
      const userId = 'user-4';

      // Use up all requests
      for (let i = 0; i < 10; i++) {
        rateLimiter.check(userId);
      }

      // Should be blocked
      expect(rateLimiter.check(userId).allowed).toBe(false);

      // Advance time by 61 seconds (past the window)
      vi.advanceTimersByTime(61 * 1000);

      // Should be allowed again
      const result = rateLimiter.check(userId);
      expect(result.allowed).toBe(true);
    });

    it('tracks rate limits per user independently', () => {
      const user1 = 'user-5';
      const user2 = 'user-6';

      // User 1 uses up all requests
      for (let i = 0; i < 10; i++) {
        rateLimiter.check(user1);
      }

      // User 1 blocked
      expect(rateLimiter.check(user1).allowed).toBe(false);

      // User 2 should still be allowed
      expect(rateLimiter.check(user2).allowed).toBe(true);
    });

    it('increments count correctly', () => {
      const userId = 'user-7';

      rateLimiter.check(userId);
      expect(rateLimiter.getEntry(userId)?.count).toBe(1);

      rateLimiter.check(userId);
      expect(rateLimiter.getEntry(userId)?.count).toBe(2);

      rateLimiter.check(userId);
      expect(rateLimiter.getEntry(userId)?.count).toBe(3);
    });
  });

  describe('Monthly Usage Limit', () => {
    it('allows requests under monthly limit', () => {
      expect(checkMonthlyLimit(0).allowed).toBe(true);
      expect(checkMonthlyLimit(100).allowed).toBe(true);
      expect(checkMonthlyLimit(399).allowed).toBe(true);
    });

    it('blocks requests at monthly limit', () => {
      const result = checkMonthlyLimit(400);
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('Monthly analysis limit reached');
    });

    it('blocks requests over monthly limit', () => {
      expect(checkMonthlyLimit(401).allowed).toBe(false);
      expect(checkMonthlyLimit(500).allowed).toBe(false);
    });
  });

  describe('Prompts Validation', () => {
    it('rejects undefined prompts', () => {
      const result = validatePrompts(undefined);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('prompts array is required');
    });

    it('rejects empty prompts array', () => {
      const result = validatePrompts([]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must not be empty');
    });

    it('rejects non-array prompts', () => {
      const result = validatePrompts('not an array' as any);
      expect(result.valid).toBe(false);
    });

    it('allows 1 to 10 prompts', () => {
      expect(validatePrompts(['prompt1']).valid).toBe(true);
      expect(validatePrompts(['p1', 'p2', 'p3', 'p4', 'p5']).valid).toBe(true);
      expect(validatePrompts(Array(10).fill('prompt')).valid).toBe(true);
    });

    it('rejects more than 10 prompts', () => {
      const result = validatePrompts(Array(11).fill('prompt'));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Maximum 10 prompts');
    });

    it('rejects large number of prompts', () => {
      expect(validatePrompts(Array(50).fill('prompt')).valid).toBe(false);
      expect(validatePrompts(Array(100).fill('prompt')).valid).toBe(false);
    });
  });

  describe('Rate Limit Constants', () => {
    it('has correct per-minute limit', () => {
      expect(RATE_LIMIT.perMinute).toBe(10);
    });

    it('has correct monthly limit', () => {
      expect(MONTHLY_LIMIT).toBe(400);
    });

    it('has correct max prompts per request', () => {
      expect(MAX_PROMPTS_PER_REQUEST).toBe(10);
    });
  });
});
