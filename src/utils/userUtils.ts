import { User } from '../types';

/**
 * Centralized user utility functions to avoid code duplication
 */

/**
 * Check if a user is an admin
 */
export const isUserAdmin = (user: User | null | undefined): boolean => {
  if (!user) return false;
  
  return user.isAdmin === true || 
         user.email === 'demo@example.com' ||
         user.email?.toLowerCase() === 'info@convologix.com';
};

/**
 * Check if the current user from localStorage is an admin
 */
export const isCurrentUserAdmin = (): boolean => {
  try {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return false;
    
    const user = JSON.parse(userStr) as User;
    return isUserAdmin(user);
  } catch (error) {
    console.error('Error checking current user admin status:', error);
    return false;
  }
};

/**
 * Get current user from localStorage
 */
export const getCurrentUser = (): User | null => {
  try {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return null;
    
    return JSON.parse(userStr) as User;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Update current user in localStorage
 */
export const updateCurrentUser = (updates: Partial<User>): boolean => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;
    
    const updatedUser = { ...currentUser, ...updates };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    return true;
  } catch (error) {
    console.error('Error updating current user:', error);
    return false;
  }
};

/**
 * Clear user data from localStorage
 */
export const clearUserData = (): void => {
  try {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentAnalysis');
    localStorage.removeItem('lastAnalysisWebsite');
    localStorage.removeItem('lastAnalysisKeywords');
    localStorage.removeItem('lastSelectedModel');
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
};

/**
 * Check if user can bypass usage limits
 */
export const canBypassUsageLimits = (user: User | null): boolean => {
  if (!user) return false;
  
  return isUserAdmin(user) || ['starter', 'professional', 'enterprise'].includes(user.subscription);
};

/**
 * Check if user should get real analysis
 */
export const shouldUseRealAnalysis = (user: User | null): boolean => {
  if (!user) return false;

  return isUserAdmin(user) || ['starter', 'professional', 'enterprise'].includes(user.subscription);
};

/**
 * Check if user's trial has expired
 */
export const isTrialExpired = (user: User | null): boolean => {
  if (!user) return false;
  if (user.subscription !== 'trial') return false;
  if (!user.trialEndsAt) return false;

  const trialEnd = new Date(user.trialEndsAt);
  const now = new Date();

  return now > trialEnd;
};

/**
 * Check if user has an active subscription (paid or valid trial)
 */
export const hasActiveSubscription = (user: User | null): boolean => {
  if (!user) return false;

  // Admins always have access
  if (isUserAdmin(user)) return true;

  // Paid plans always have access
  if (['starter', 'professional', 'enterprise'].includes(user.subscription)) {
    return true;
  }

  // Trial users - check if trial is still active
  if (user.subscription === 'trial') {
    return !isTrialExpired(user);
  }

  // Free users don't have active subscription
  return false;
};

/**
 * Check if user can run new analyses
 * Returns { canRun: boolean, reason?: string }
 */
export const canRunAnalysis = (user: User | null): { canRun: boolean; reason?: string } => {
  if (!user) {
    return { canRun: false, reason: 'Please log in to run analyses.' };
  }

  // Admins can always run
  if (isUserAdmin(user)) {
    return { canRun: true };
  }

  // Paid plans can run
  if (['starter', 'professional', 'enterprise'].includes(user.subscription)) {
    return { canRun: true };
  }

  // Trial users - check expiration
  if (user.subscription === 'trial') {
    if (isTrialExpired(user)) {
      return {
        canRun: false,
        reason: 'Your trial has expired. Please upgrade to continue running analyses.'
      };
    }
    return { canRun: true };
  }

  // Free users cannot run analyses
  return {
    canRun: false,
    reason: 'Please upgrade to a paid plan to run analyses.'
  };
};

/**
 * Get subscription badge component
 */
export const getSubscriptionBadge = (subscription: string) => {
  const badgeClasses = {
    starter: 'bg-blue-100 text-blue-800',
    professional: 'bg-purple-100 text-purple-800', 
    enterprise: 'bg-indigo-100 text-indigo-800',
    trial: 'bg-yellow-100 text-yellow-800',
    free: 'bg-gray-100 text-gray-800'
  };
  
  const badgeClass = badgeClasses[subscription as keyof typeof badgeClasses] || badgeClasses.free;
  const label = subscription === 'trial' ? 'Trial' : subscription.charAt(0).toUpperCase() + subscription.slice(1);
  
  return `<span class="px-2 py-1 ${badgeClass} rounded-full text-xs font-medium">${label}</span>`;
};