import { supabase } from '../lib/supabase';
import { PaymentLogger } from './paymentLogger';

export class ManualSubscriptionFix {
  /**
   * Manually update a user's subscription after a successful payment
   * Use this when the webhook fails but the payment succeeded
   */
  static async fixSubscription(userId: string, plan: string = 'starter'): Promise<{
    success: boolean;
    message: string;
    error?: any;
  }> {
    PaymentLogger.log('info', 'ManualFix', `Attempting manual subscription fix for user ${userId} to plan ${plan}`);
    
    try {
      // First check if user exists
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userError) {
        PaymentLogger.log('error', 'ManualFix', `User not found: ${userId}`, userError);
        return {
          success: false,
          message: 'User not found',
          error: userError
        };
      }
      
      // Update user subscription
      const { data, error } = await supabase
        .from('users')
        .update({
          subscription: plan,
          payment_method_added: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select();
      
      if (error) {
        PaymentLogger.log('error', 'ManualFix', 'Failed to update subscription', error);
        return {
          success: false,
          message: 'Failed to update subscription',
          error
        };
      }
      
      PaymentLogger.log('info', 'ManualFix', `Successfully updated subscription for user ${userId} to ${plan}`, data);
      
      return {
        success: true,
        message: `Subscription successfully updated to ${plan}`
      };
    } catch (error) {
      PaymentLogger.log('error', 'ManualFix', 'Unexpected error during manual fix', error);
      return {
        success: false,
        message: 'An unexpected error occurred',
        error
      };
    }
  }
  
  /**
   * Check if a user's subscription needs fixing
   * (payment succeeded but subscription not updated)
   */
  static async checkSubscriptionStatus(userId: string): Promise<{
    needsFix: boolean;
    currentPlan: string;
    hasPayment: boolean;
  }> {
    try {
      // Get user details
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userError) {
        return {
          needsFix: false,
          currentPlan: 'unknown',
          hasPayment: false
        };
      }
      
      // Check if there are payments but subscription is still free/trial
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'succeeded')
        .order('created_at', { ascending: false })
        .limit(1);
      
      const hasPayment = !paymentsError && payments && payments.length > 0;
      const currentPlan = user.subscription;
      
      // If there's a successful payment but subscription is still free/trial
      const needsFix = hasPayment && (currentPlan === 'free' || currentPlan === 'trial');
      
      return {
        needsFix,
        currentPlan,
        hasPayment
      };
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return {
        needsFix: false,
        currentPlan: 'unknown',
        hasPayment: false
      };
    }
  }
  
  /**
   * Get the latest payment for a user
   */
  static async getLatestPayment(userId: string) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error || !data || data.length === 0) {
        return null;
      }
      
      return data[0];
    } catch (error) {
      console.error('Error getting latest payment:', error);
      return null;
    }
  }
}