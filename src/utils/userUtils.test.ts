import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isUserAdmin,
  isCurrentUserAdmin,
  getCurrentUser,
  updateCurrentUser,
  clearUserData,
  canBypassUsageLimits,
  shouldUseRealAnalysis,
  isTrialExpired,
  hasActiveSubscription,
  canRunAnalysis,
  getSubscriptionBadge
} from './userUtils';
import { User } from '../types';

describe('userUtils', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  const createMockUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    subscription: 'trial',
    createdAt: new Date().toISOString(),
    ...overrides
  });

  describe('isUserAdmin', () => {
    it('should return false for null user', () => {
      expect(isUserAdmin(null)).toBe(false);
    });

    it('should return false for undefined user', () => {
      expect(isUserAdmin(undefined)).toBe(false);
    });

    it('should return true for user with isAdmin flag', () => {
      const user = createMockUser({ isAdmin: true });
      expect(isUserAdmin(user)).toBe(true);
    });

    it('should return true for demo@example.com', () => {
      const user = createMockUser({ email: 'demo@example.com' });
      expect(isUserAdmin(user)).toBe(true);
    });

    it('should return true for info@convologix.com (case insensitive)', () => {
      const user = createMockUser({ email: 'INFO@CONVOLOGIX.COM' });
      expect(isUserAdmin(user)).toBe(true);
    });

    it('should return false for regular user', () => {
      const user = createMockUser({ email: 'regular@example.com', isAdmin: false });
      expect(isUserAdmin(user)).toBe(false);
    });
  });

  describe('isCurrentUserAdmin', () => {
    it('should return false when no user in localStorage', () => {
      expect(isCurrentUserAdmin()).toBe(false);
    });

    it('should return true for admin user in localStorage', () => {
      const adminUser = createMockUser({ isAdmin: true });
      localStorage.setItem('currentUser', JSON.stringify(adminUser));
      expect(isCurrentUserAdmin()).toBe(true);
    });

    it('should return false for non-admin user in localStorage', () => {
      const regularUser = createMockUser({ isAdmin: false });
      localStorage.setItem('currentUser', JSON.stringify(regularUser));
      expect(isCurrentUserAdmin()).toBe(false);
    });

    it('should return false for invalid JSON in localStorage', () => {
      localStorage.setItem('currentUser', 'invalid json');
      expect(isCurrentUserAdmin()).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('should return null when no user in localStorage', () => {
      expect(getCurrentUser()).toBeNull();
    });

    it('should return user when present in localStorage', () => {
      const user = createMockUser();
      localStorage.setItem('currentUser', JSON.stringify(user));
      const result = getCurrentUser();
      expect(result).toEqual(user);
    });

    it('should return null for invalid JSON', () => {
      localStorage.setItem('currentUser', 'not valid json');
      expect(getCurrentUser()).toBeNull();
    });
  });

  describe('updateCurrentUser', () => {
    it('should return false when no user exists', () => {
      expect(updateCurrentUser({ name: 'New Name' })).toBe(false);
    });

    it('should update user in localStorage', () => {
      const user = createMockUser();
      localStorage.setItem('currentUser', JSON.stringify(user));

      const result = updateCurrentUser({ name: 'Updated Name' });

      expect(result).toBe(true);
      const updatedUser = JSON.parse(localStorage.getItem('currentUser')!);
      expect(updatedUser.name).toBe('Updated Name');
      expect(updatedUser.email).toBe(user.email); // Other fields preserved
    });
  });

  describe('clearUserData', () => {
    it('should clear all user-related localStorage items', () => {
      localStorage.setItem('currentUser', 'user data');
      localStorage.setItem('currentAnalysis', 'analysis data');
      localStorage.setItem('lastAnalysisWebsite', 'website');
      localStorage.setItem('lastAnalysisKeywords', 'keywords');
      localStorage.setItem('lastSelectedModel', 'model');

      clearUserData();

      expect(localStorage.getItem('currentUser')).toBeNull();
      expect(localStorage.getItem('currentAnalysis')).toBeNull();
      expect(localStorage.getItem('lastAnalysisWebsite')).toBeNull();
      expect(localStorage.getItem('lastAnalysisKeywords')).toBeNull();
      expect(localStorage.getItem('lastSelectedModel')).toBeNull();
    });
  });

  describe('canBypassUsageLimits', () => {
    it('should return false for null user', () => {
      expect(canBypassUsageLimits(null)).toBe(false);
    });

    it('should return true for admin user', () => {
      const admin = createMockUser({ isAdmin: true });
      expect(canBypassUsageLimits(admin)).toBe(true);
    });

    it('should return true for starter subscription', () => {
      const user = createMockUser({ subscription: 'starter' });
      expect(canBypassUsageLimits(user)).toBe(true);
    });

    it('should return true for professional subscription', () => {
      const user = createMockUser({ subscription: 'professional' });
      expect(canBypassUsageLimits(user)).toBe(true);
    });

    it('should return true for enterprise subscription', () => {
      const user = createMockUser({ subscription: 'enterprise' });
      expect(canBypassUsageLimits(user)).toBe(true);
    });

    it('should return false for trial subscription', () => {
      const user = createMockUser({ subscription: 'trial', isAdmin: false });
      expect(canBypassUsageLimits(user)).toBe(false);
    });

    it('should return false for free subscription', () => {
      const user = createMockUser({ subscription: 'free', isAdmin: false });
      expect(canBypassUsageLimits(user)).toBe(false);
    });
  });

  describe('shouldUseRealAnalysis', () => {
    it('should return false for null user', () => {
      expect(shouldUseRealAnalysis(null)).toBe(false);
    });

    it('should return true for admin user', () => {
      const admin = createMockUser({ isAdmin: true });
      expect(shouldUseRealAnalysis(admin)).toBe(true);
    });

    it('should return true for paid subscriptions', () => {
      expect(shouldUseRealAnalysis(createMockUser({ subscription: 'starter' }))).toBe(true);
      expect(shouldUseRealAnalysis(createMockUser({ subscription: 'professional' }))).toBe(true);
      expect(shouldUseRealAnalysis(createMockUser({ subscription: 'enterprise' }))).toBe(true);
    });

    it('should return false for trial users', () => {
      const user = createMockUser({ subscription: 'trial', isAdmin: false });
      expect(shouldUseRealAnalysis(user)).toBe(false);
    });
  });

  describe('isTrialExpired', () => {
    it('should return false for null user', () => {
      expect(isTrialExpired(null)).toBe(false);
    });

    it('should return false for non-trial subscription', () => {
      const user = createMockUser({ subscription: 'starter' });
      expect(isTrialExpired(user)).toBe(false);
    });

    it('should return false for trial user without trialEndsAt', () => {
      const user = createMockUser({ subscription: 'trial', trialEndsAt: undefined });
      expect(isTrialExpired(user)).toBe(false);
    });

    it('should return false for active trial (future end date)', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days in future

      vi.setSystemTime(new Date('2024-01-15'));
      const user = createMockUser({
        subscription: 'trial',
        trialEndsAt: new Date('2024-01-22').toISOString()
      });

      expect(isTrialExpired(user)).toBe(false);
    });

    it('should return true for expired trial (past end date)', () => {
      vi.setSystemTime(new Date('2024-01-20'));
      const user = createMockUser({
        subscription: 'trial',
        trialEndsAt: new Date('2024-01-15').toISOString()
      });

      expect(isTrialExpired(user)).toBe(true);
    });

    it('should return true for trial that expired today', () => {
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
      const user = createMockUser({
        subscription: 'trial',
        trialEndsAt: new Date('2024-01-15T00:00:00Z').toISOString()
      });

      expect(isTrialExpired(user)).toBe(true);
    });
  });

  describe('hasActiveSubscription', () => {
    it('should return false for null user', () => {
      expect(hasActiveSubscription(null)).toBe(false);
    });

    it('should return true for admin user', () => {
      const admin = createMockUser({ isAdmin: true, subscription: 'free' });
      expect(hasActiveSubscription(admin)).toBe(true);
    });

    it('should return true for paid subscriptions', () => {
      expect(hasActiveSubscription(createMockUser({ subscription: 'starter' }))).toBe(true);
      expect(hasActiveSubscription(createMockUser({ subscription: 'professional' }))).toBe(true);
      expect(hasActiveSubscription(createMockUser({ subscription: 'enterprise' }))).toBe(true);
    });

    it('should return true for active trial', () => {
      vi.setSystemTime(new Date('2024-01-15'));
      const user = createMockUser({
        subscription: 'trial',
        trialEndsAt: new Date('2024-01-22').toISOString()
      });

      expect(hasActiveSubscription(user)).toBe(true);
    });

    it('should return false for expired trial', () => {
      vi.setSystemTime(new Date('2024-01-25'));
      const user = createMockUser({
        subscription: 'trial',
        trialEndsAt: new Date('2024-01-22').toISOString(),
        isAdmin: false
      });

      expect(hasActiveSubscription(user)).toBe(false);
    });

    it('should return false for free user', () => {
      const user = createMockUser({ subscription: 'free', isAdmin: false });
      expect(hasActiveSubscription(user)).toBe(false);
    });
  });

  describe('canRunAnalysis', () => {
    it('should return canRun: false with reason for null user', () => {
      const result = canRunAnalysis(null);
      expect(result.canRun).toBe(false);
      expect(result.reason).toBe('Please log in to run analyses.');
    });

    it('should return canRun: true for admin user', () => {
      const admin = createMockUser({ isAdmin: true });
      const result = canRunAnalysis(admin);
      expect(result.canRun).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should return canRun: true for paid subscriptions', () => {
      const starter = createMockUser({ subscription: 'starter' });
      const professional = createMockUser({ subscription: 'professional' });
      const enterprise = createMockUser({ subscription: 'enterprise' });

      expect(canRunAnalysis(starter)).toEqual({ canRun: true });
      expect(canRunAnalysis(professional)).toEqual({ canRun: true });
      expect(canRunAnalysis(enterprise)).toEqual({ canRun: true });
    });

    it('should return canRun: true for active trial', () => {
      vi.setSystemTime(new Date('2024-01-15'));
      const user = createMockUser({
        subscription: 'trial',
        trialEndsAt: new Date('2024-01-22').toISOString()
      });

      const result = canRunAnalysis(user);
      expect(result.canRun).toBe(true);
    });

    it('should return canRun: false with reason for expired trial', () => {
      vi.setSystemTime(new Date('2024-01-25'));
      const user = createMockUser({
        subscription: 'trial',
        trialEndsAt: new Date('2024-01-22').toISOString(),
        isAdmin: false
      });

      const result = canRunAnalysis(user);
      expect(result.canRun).toBe(false);
      expect(result.reason).toBe('Your trial has expired. Please upgrade to continue running analyses.');
    });

    it('should return canRun: false with reason for free user', () => {
      const user = createMockUser({ subscription: 'free', isAdmin: false });

      const result = canRunAnalysis(user);
      expect(result.canRun).toBe(false);
      expect(result.reason).toBe('Please upgrade to a paid plan to run analyses.');
    });
  });

  describe('getSubscriptionBadge', () => {
    it('should return badge HTML for starter', () => {
      const badge = getSubscriptionBadge('starter');
      expect(badge).toContain('bg-blue-100');
      expect(badge).toContain('text-blue-800');
      expect(badge).toContain('Starter');
    });

    it('should return badge HTML for professional', () => {
      const badge = getSubscriptionBadge('professional');
      expect(badge).toContain('bg-purple-100');
      expect(badge).toContain('text-purple-800');
      expect(badge).toContain('Professional');
    });

    it('should return badge HTML for enterprise', () => {
      const badge = getSubscriptionBadge('enterprise');
      expect(badge).toContain('bg-indigo-100');
      expect(badge).toContain('text-indigo-800');
      expect(badge).toContain('Enterprise');
    });

    it('should return badge HTML for trial', () => {
      const badge = getSubscriptionBadge('trial');
      expect(badge).toContain('bg-yellow-100');
      expect(badge).toContain('text-yellow-800');
      expect(badge).toContain('Trial');
    });

    it('should return badge HTML for free/unknown', () => {
      const badge = getSubscriptionBadge('free');
      expect(badge).toContain('bg-gray-100');
      expect(badge).toContain('text-gray-800');
      expect(badge).toContain('Free');
    });
  });
});
