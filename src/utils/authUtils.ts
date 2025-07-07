// Auth utilities for checking user roles and permissions

/**
 * Check if the current user is an admin
 * @returns boolean indicating if the current user is an admin
 */
export const isAdminUser = (): boolean => {
  try {
    // Get current user from localStorage
    console.log('authUtils: Checking if user is admin');
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      console.log('authUtils: No current user found');
      return false;
    }
    
    const user = JSON.parse(userStr);
    
    // Check if user is admin or has admin email
    const isAdmin = user.isAdmin === true || (user.email && user.email.toLowerCase() === 'info@convologix.com');
    console.log('authUtils: User admin status:', isAdmin);
    return isAdmin;
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
    if (!userStr) {
      console.log('authUtils: No current user found when getting ID');
      return null;
    }
    
    const user = JSON.parse(userStr);
    const userId = user.id || null;
    console.log('authUtils: Current user ID:', userId);
    return userId;
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

/**
 * Clear all user data from localStorage
 */
export const clearUserData = (): void => {
  try {
    console.log('authUtils: Clearing user data');
    
    // Save users array before clearing
    let usersArray = [];
    try {
      const usersStr = localStorage.getItem('users');
      if (usersStr) {
        usersArray = JSON.parse(usersStr);
      }
    } catch (e) {
      console.error('Error saving users array before clearing', e);
    }
    
    // Remove user data
    localStorage.removeItem('currentUser'); 
    // Don't remove users to preserve demo accounts
    // localStorage.removeItem('users');
    
    // Also clear any analysis-related data
    localStorage.removeItem('currentAnalysis');
    localStorage.removeItem('lastAnalysisWebsite');
    localStorage.removeItem('lastAnalysisKeywords');
    localStorage.removeItem('lastSelectedProjectId');
    localStorage.removeItem('lastSelectedModel');
    localStorage.removeItem('analyses');
    localStorage.removeItem('projects');
    localStorage.removeItem('payment_logs');
    
    console.log('User data cleared successfully');
    
    // Restore users array if it was cleared
    if (!localStorage.getItem('users') && usersArray.length > 0) {
      console.log('authUtils: Restoring users array after clearing');
      localStorage.setItem('users', JSON.stringify(usersArray));
    }
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
};