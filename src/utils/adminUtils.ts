// Admin utilities for consistent admin user logic across the codebase

import { User } from '../types';

/**
 * Check if a user is an admin
 * @param user The user object to check
 * @returns boolean indicating if the user is an admin
 */
export const isUserAdmin = (user: User | null | undefined): boolean => {
  if (!user) {
    return false;
  }
  
  // Check if user has admin flag set to true
  if (user.isAdmin === true) {
    return true;
  }
  
  // Check if user is demo user (give demo user admin privileges)
  if (user.email === 'demo@example.com') {
    return true;
  }
  
  // Check if user has admin email (fallback for hardcoded admin)
  if (user.email && user.email.toLowerCase() === 'info@convologix.com') {
    return true;
  }
  
  return false;
};

/**
 * Check if the current user from localStorage is an admin
 * @returns boolean indicating if the current user is an admin
 */
export const isCurrentUserAdmin = (): boolean => {
  try {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      return false;
    }
    
    const user = JSON.parse(userStr) as User;
    return isUserAdmin(user);
  } catch (error) {
    console.error('Error checking current user admin status:', error);
    return false;
  }
};

/**
 * Check if a user can bypass usage limits (admin or paid plans)
 * @param user The user object to check
 * @returns boolean indicating if the user can bypass limits
 */
export const canBypassUsageLimits = (user: User | null): boolean => {
  if (!user) {
    return false;
  }
  
  // Admin users can always bypass limits
  if (isUserAdmin(user)) {
    return true;
  }
  
  // Paid plan users can bypass limits
  return ['starter', 'professional', 'enterprise'].includes(user.subscription);
};

/**
 * Check if a user should get real analysis (admin or paid plans)
 * @param user The user object to check
 * @returns boolean indicating if the user should get real analysis
 */
export const shouldUseRealAnalysis = (user: User | null): boolean => {
  if (!user) {
    return false;
  }
  
  // Admin users always get real analysis
  if (isUserAdmin(user)) {
    return true;
  }
  
  // Paid plan users get real analysis
  return ['starter', 'professional', 'enterprise'].includes(user.subscription);
};

/**
 * Check if a user has unlimited access (admin or demo plans)
 * @param user The user object to check
 * @returns boolean indicating if the user has unlimited access
 */
export const hasUnlimitedAccess = (user: User | null): boolean => {
  if (!user) {
    return false;
  }
  
  // Admin users have unlimited access
  if (isUserAdmin(user)) {
    return true;
  }
  
  // Demo plans have unlimited access
  return ['free', 'trial'].includes(user.subscription);
};

/**
 * Get admin status display text
 * @param user The user object
 * @returns string indicating admin status
 */
export const getAdminStatusText = (user: User | null): string => {
  if (!user) {
    return 'No User';
  }
  
  if (isUserAdmin(user)) {
    return '🔑 Admin';
  }
  
  return user.subscription.charAt(0).toUpperCase() + user.subscription.slice(1);
};

/**
 * Check if a user can access admin features
 * @param user The user object to check
 * @returns boolean indicating if the user can access admin features
 */
export const canAccessAdminFeatures = (user: User | null): boolean => {
  return isUserAdmin(user);
};

/**
 * Check if a user can perform admin actions
 * @param user The user object to check
 * @param action The specific admin action
 * @returns boolean indicating if the user can perform the action
 */
export const canPerformAdminAction = (user: User | null, action: string): boolean => {
  if (!isUserAdmin(user)) {
    return false;
  }
  
  // Add specific action checks here if needed in the future
  // For now, all admins can perform all admin actions
  return true;
}; 