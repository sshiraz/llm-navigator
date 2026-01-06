import { supabase, handleSupabaseError, handleSupabaseSuccess } from '../lib/supabase';
import { User } from '../types';
import { FraudPrevention } from '../utils/fraudPrevention';

// Clear user-specific localStorage data to ensure clean state for new users
function clearUserLocalStorage() {
  const keysToRemove = [
    'analyses',
    'projects',
    'currentUser',
    'costTracker',
    'analysisHistory',
    'recentAnalyses',
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
  static async signUp(userData: {
    email: string;
    password: string;
    name: string;
    company?: string;
    website?: string;
    subscription?: string;
    skipTrial?: boolean;
  }) {
    try {
      // Check fraud prevention first
      const fraudCheck = await FraudPrevention.checkTrialEligibility(userData.email);
      
      if (!fraudCheck.isAllowed && !userData.skipTrial) {
        return {
          success: false,
          error: fraudCheck.reason || 'Trial not allowed'
        };
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            company: userData.company,
            website: userData.website
          }
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

      // Create user profile
      const subscription = userData.skipTrial ? (userData.subscription || 'starter') : 'trial';
      const trialEndsAt = userData.skipTrial ? null : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          name: userData.name,
          subscription: subscription as any,
          trial_ends_at: trialEndsAt,
          device_fingerprint: FraudPrevention.generateDeviceFingerprint(),
          ip_address: await FraudPrevention.getUserIP(),
          payment_method_added: userData.skipTrial
        })
        .select()
        .single();

      if (profileError) {
        return handleSupabaseError(profileError);
      }

      // Store fraud check result
      await supabase.from('fraud_checks').insert({
        email: userData.email,
        normalized_email: FraudPrevention.normalizeEmail(userData.email),
        device_fingerprint: FraudPrevention.generateDeviceFingerprint(),
        ip_address: await FraudPrevention.getUserIP(),
        risk_score: fraudCheck.riskScore,
        is_allowed: fraudCheck.isAllowed,
        reason: fraudCheck.reason,
        checks: fraudCheck.checks
      });

      // Clear any cached data from previous users
      clearUserLocalStorage();

      return handleSupabaseSuccess({
        user: authData.user,
        profile: profileData
      });
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
}