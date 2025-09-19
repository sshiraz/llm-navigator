// Re-export from userUtils to maintain backward compatibility
export { 
  isCurrentUserAdmin as isAdminUser,
  getCurrentUser,
  clearUserData 
} from './userUtils';

/**
 * Get the current user ID from localStorage
 */
export const getCurrentUserId = (): string | null => {
  const user = getCurrentUser();
  return user?.id || null;
};

/**
 * Check if a user has a specific permission
 */
export const hasPermission = (permission: string): boolean => {
  return isCurrentUserAdmin();
};