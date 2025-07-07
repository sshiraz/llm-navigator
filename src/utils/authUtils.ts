// Auth utilities for checking user roles and permissions

/**
 * Check if the current user is an admin
 * @returns boolean indicating if the current user is an admin
 */
export const isAdminUser = (): boolean => {
  try {
    // Get current user from localStorage
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return false;
    
    const user = JSON.parse(userStr);
    
    // Check if user is admin or has admin email
    return user.isAdmin === true || user.email === 'info@convologix.com';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Get the current user ID from localStorage
 * @returns string | null - The current user ID or null if not found
 */
export const getCurrentUserId = (): string | null => {
  try {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return null;
    
    const user = JSON.parse(userStr);
    return user.id || null;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
};

/**
 * Check if a user has a specific permission
 * @param permission The permission to check
 * @returns boolean indicating if the user has the permission
 */
export const hasPermission = (permission: string): boolean => {
  // For now, only admins have special permissions
  return isAdminUser();
};