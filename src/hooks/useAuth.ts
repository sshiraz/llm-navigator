import { useState, useEffect } from 'react';
import { AuthService } from '../services/authService';
import { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const result = await AuthService.getCurrentSession();
        if (result.success && result.data) {
          setUser(result.data.profile);
        }
      } catch (err) {
        setError('Failed to load session');
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = AuthService.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const result = await AuthService.getCurrentSession();
        if (result.success && result.data) {
          setUser(result.data.profile);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await AuthService.signIn(email, password);
      if (result.success) {
        setUser(result.data.profile);
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const error = 'Failed to sign in';
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (userData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await AuthService.signUp(userData);
      if (result.success) {
        setUser(result.data.profile);
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const error = 'Failed to sign up';
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    
    try {
      await AuthService.signOut();
      setUser(null);
    } catch (err) {
      setError('Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return { success: false, error: 'No user logged in' };
    
    try {
      const result = await AuthService.updateProfile(user.id, updates);
      if (result.success) {
        setUser({ ...user, ...result.data });
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      return { success: false, error: 'Failed to update profile' };
    }
  };

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    updateProfile
  };
};