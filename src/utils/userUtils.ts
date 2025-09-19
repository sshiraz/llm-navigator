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