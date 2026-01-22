import { supabase, handleSupabaseError, handleSupabaseSuccess } from '../lib/supabase';
import { User } from '../types';
import { AuditLogService } from './auditLogService';

// Clear user-specific localStorage data to ensure clean state for new users
function clearUserLocalStorage() {
  const keysToRemove = [
    'analyses',
    'projects',
    'currentUser',
    'costTracker',
    'analysisHistory',
    'recentAnalyses',
    'users', // Clear mock users list - Supabase is source of truth
  ];

  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`Failed to remove localStorage key: ${key}`, e);
    }
  });

  console.log('Cleared user-specific localStorage data');
}

export class AuthService {
  // Sign up with email and password
  // Profile is automatically created by database trigger on auth.users insert
  static async signUp(userData: {
    email: string;
    password: string;
    name: string;
    company?: string;
    website?: string;
  }) {
    try {
      // Check if email already exists in users table (catch orphaned records)
      // Note: This may fail due to RLS if user isn't authenticated, so we handle errors gracefully
      try {
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id, email')
          .eq('email', userData.email)
          .maybeSingle();

        if (!checkError && existingUser) {
          console.log('Email already exists in users table:', existingUser.email);
          return {
            success: false,
            error: 'This email is already registered. Please sign in instead.'
          };
        }
      } catch (preCheckError) {
        // Pre-check failed (likely RLS), continue with normal signup flow
        console.log('Pre-check skipped, continuing with signup');
      }

      // Create auth user with email redirect for confirmation
      // Database trigger (handle_new_user) automatically creates the profile
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            company: userData.company,
            website: userData.website
          },
          emailRedirectTo: `${window.location.origin}/#email-confirmed`
        }
      });

      if (authError) {
        return handleSupabaseError(authError);
      }

      if (!authData.user) {
        return {
          success: false,
          error: 'Failed to create user account'
        };
      }

      // Check if email confirmation is required
      // When email confirmation is enabled, Supabase returns user but NOT session
      const requiresEmailConfirmation = authData.user && !authData.session;

      // Clear any cached data from previous users
      clearUserLocalStorage();

      // Return with email confirmation status
      // Profile was auto-created by database trigger
      // Log successful signup
      AuditLogService.logSignup(userData.email).catch(() => {});

      // Notify admin of new signup (fire and forget)
      supabase.functions.invoke('notify-admin-lead', {
        body: {
          type: 'signup',
          email: userData.email,
          name: userData.name
        }
      }).catch(() => {});

      return handleSupabaseSuccess({
        user: authData.user,
        profile: {
          id: authData.user.id,
          email: userData.email,
          name: userData.name,
          subscription: 'trial'
        },
        requiresEmailConfirmation,
        email: userData.email
      });
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  // Resend confirmation email
  static async resendConfirmationEmail(email: string) {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/#email-confirmed`
        }
      });

      if (error) {
        return handleSupabaseError(error);
      }

      return handleSupabaseSuccess({ sent: true });
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  // Sign in with email and password
  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Log failed login attempt
        AuditLogService.logLoginFailed(email, error.message).catch(() => {});
        return handleSupabaseError(error);
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        return handleSupabaseError(profileError);
      }

      // Clear any cached data from previous users
      clearUserLocalStorage();

      // Log successful login
      AuditLogService.logLogin().catch(() => {});

      return handleSupabaseSuccess({
        user: data.user,
        profile
      });
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  // Sign out
  static async signOut() {
    try {
      // Log logout before signing out (while we still have the session)
      AuditLogService.logLogout().catch(() => {});

      const { error } = await supabase.auth.signOut();

      if (error) {
        return handleSupabaseError(error);
      }

      // Clear user-specific localStorage data on sign out
      clearUserLocalStorage();

      return handleSupabaseSuccess(null);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  // Get current session
  static async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        return handleSupabaseError(error);
      }

      if (!session) {
        return handleSupabaseSuccess(null);
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        return handleSupabaseError(profileError);
      }

      return handleSupabaseSuccess({
        user: session.user,
        profile
      });
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  // Update user profile
  static async updateProfile(userId: string, updates: Partial<User>) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return handleSupabaseError(error);
      }

      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  // Change password
  static async changePassword(newPassword: string) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return handleSupabaseError(error);
      }

      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }
}