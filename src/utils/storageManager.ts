/**
 * StorageManager - Centralized localStorage abstraction layer
 *
 * Benefits:
 * - Single source of truth for storage operations
 * - Consistent error handling
 * - Type safety for stored data
 * - Easy migration path to other storage solutions
 * - Centralized cache invalidation
 */

import { User, Analysis } from '../types';

// Storage keys as constants to prevent typos
const STORAGE_KEYS = {
  CURRENT_USER: 'currentUser',
  CURRENT_ANALYSIS: 'currentAnalysis',
  ANALYSES: 'analyses',
  USERS: 'users',
  PAYMENT_LOGS: 'payment_logs',
} as const;

type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

export class StorageManager {
  // ============================================
  // Generic helpers
  // ============================================

  private static getItem<T>(key: StorageKey, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`StorageManager: Error reading ${key}:`, error);
      return defaultValue;
    }
  }

  private static setItem<T>(key: StorageKey, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`StorageManager: Error writing ${key}:`, error);
      return false;
    }
  }

  private static removeItem(key: StorageKey): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`StorageManager: Error removing ${key}:`, error);
      return false;
    }
  }

  // ============================================
  // User management
  // ============================================

  static getCurrentUser(): User | null {
    return this.getItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  }

  static setCurrentUser(user: User): boolean {
    return this.setItem(STORAGE_KEYS.CURRENT_USER, user);
  }

  static updateCurrentUser(updates: Partial<User>): boolean {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;

    const updatedUser = { ...currentUser, ...updates };
    return this.setCurrentUser(updatedUser);
  }

  static clearCurrentUser(): boolean {
    return this.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  // Legacy users list (for mock data compatibility)
  static getUsers(): User[] {
    return this.getItem<User[]>(STORAGE_KEYS.USERS, []);
  }

  static setUsers(users: User[]): boolean {
    return this.setItem(STORAGE_KEYS.USERS, users);
  }

  static updateUserInList(userId: string, updates: Partial<User>): boolean {
    const users = this.getUsers();
    const updatedUsers = users.map(u =>
      u.id === userId ? { ...u, ...updates } : u
    );
    return this.setUsers(updatedUsers);
  }

  // ============================================
  // Analysis management
  // ============================================

  static getCurrentAnalysis(): Analysis | null {
    return this.getItem<Analysis | null>(STORAGE_KEYS.CURRENT_ANALYSIS, null);
  }

  static setCurrentAnalysis(analysis: Analysis): boolean {
    return this.setItem(STORAGE_KEYS.CURRENT_ANALYSIS, analysis);
  }

  static clearCurrentAnalysis(): boolean {
    return this.removeItem(STORAGE_KEYS.CURRENT_ANALYSIS);
  }

  // Analysis cache (backup for Supabase)
  static getAnalyses(): Analysis[] {
    return this.getItem<Analysis[]>(STORAGE_KEYS.ANALYSES, []);
  }

  static getAnalysesForUser(userId: string): Analysis[] {
    const analyses = this.getAnalyses();
    return analyses.filter(a => a.userId === userId);
  }

  static setAnalyses(analyses: Analysis[]): boolean {
    return this.setItem(STORAGE_KEYS.ANALYSES, analyses);
  }

  static addAnalysis(analysis: Analysis): boolean {
    const existing = this.getAnalyses();
    // Remove any existing with same ID, add new one at the start
    const filtered = existing.filter(a => a.id !== analysis.id);
    const updated = [analysis, ...filtered];

    // Also set as current analysis
    this.setCurrentAnalysis(analysis);

    return this.setAnalyses(updated);
  }

  static removeAnalysis(analysisId: string): boolean {
    const existing = this.getAnalyses();
    const updated = existing.filter(a => a.id !== analysisId);
    return this.setAnalyses(updated);
  }

  // ============================================
  // Payment logs
  // ============================================

  static getPaymentLogs(): any[] {
    return this.getItem<any[]>(STORAGE_KEYS.PAYMENT_LOGS, []);
  }

  static setPaymentLogs(logs: any[]): boolean {
    return this.setItem(STORAGE_KEYS.PAYMENT_LOGS, logs);
  }

  static clearPaymentLogs(): boolean {
    return this.removeItem(STORAGE_KEYS.PAYMENT_LOGS);
  }

  // ============================================
  // Bulk operations
  // ============================================

  /**
   * Clear all app-related storage (for logout)
   */
  static clearAll(): void {
    this.clearCurrentUser();
    this.clearCurrentAnalysis();
    this.removeItem(STORAGE_KEYS.ANALYSES);
    this.clearPaymentLogs();
  }

  /**
   * Clear session data but keep cached analyses
   */
  static clearSession(): void {
    this.clearCurrentUser();
    this.clearCurrentAnalysis();
  }

  // ============================================
  // Storage info
  // ============================================

  /**
   * Get approximate storage usage in bytes
   */
  static getStorageSize(): number {
    let total = 0;
    for (const key of Object.values(STORAGE_KEYS)) {
      const item = localStorage.getItem(key);
      if (item) {
        total += item.length * 2; // UTF-16 encoding
      }
    }
    return total;
  }

  /**
   * Check if storage is available
   */
  static isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
}

// Export storage keys for reference
export { STORAGE_KEYS };
