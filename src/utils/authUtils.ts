// Auth utilities for checking user roles and permissions

// All logic previously using localStorage for user info has been removed.
// Use Supabase Auth and user context/hooks for user state and roles.

/**
 * Check if a user has a specific permission
 * @param permission The permission to check
 * @returns boolean indicating if the user has the permission
 */
export const hasPermission = (permission: string): boolean => {
  // For now, only admins have special permissions
  return false; // No longer checking localStorage for admin status
};

/**
 * Clear all user data from localStorage
 */
export const clearUserData = (): void => {
  try {
    // Remove user data
    // localStorage.removeItem('currentUser'); // No longer needed
    // Also clear any analysis-related data
    localStorage.removeItem('currentAnalysis');
    localStorage.removeItem('lastAnalysisWebsite');
    localStorage.removeItem('lastAnalysisKeywords');
    localStorage.removeItem('lastSelectedProjectId');
    localStorage.removeItem('lastSelectedModel');
    localStorage.removeItem('analyses');
    localStorage.removeItem('projects');
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
};