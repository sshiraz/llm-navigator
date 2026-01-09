import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper function to handle Supabase errors with user-friendly messages
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);

  // Map common database/auth errors to user-friendly messages
  let userMessage = error.message || 'An unexpected error occurred';

  if (error.message?.includes('users_email_key') || error.message?.includes('duplicate key')) {
    userMessage = 'This email is already registered. Please sign in instead.';
  } else if (error.message?.includes('Invalid login credentials')) {
    userMessage = 'Invalid email or password. Please try again.';
  } else if (error.message?.includes('Email not confirmed')) {
    userMessage = 'Please check your email and click the confirmation link before signing in.';
  } else if (error.message?.includes('User already registered')) {
    userMessage = 'This email is already registered. Please sign in instead.';
  }

  return {
    success: false,
    error: userMessage
  };
};

// Helper function for successful responses
export const handleSupabaseSuccess = (data: any) => {
  return {
    success: true,
    data
  };
};