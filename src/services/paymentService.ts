import { supabase } from '../lib/supabase';
import { STRIPE_PLANS } from '../utils/stripeUtils';
import { PaymentLogger } from '../utils/paymentLogger';
import { isLiveMode } from '../utils/liveMode';
import { StorageManager } from '../utils/storageManager';

export interface PaymentIntent {
  clientSecret: string;
  amount: number;
  currency: string;
  metadata: {
    userId: string;
    plan: string;
    email: string;
  };
}

export interface Subscription {
  id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  plan: {
    id: string;
    amount: number;
    currency: string;
    interval: string;
  };
}

export class PaymentService {
  // Create payment intent for one-time payment
  static async createPaymentIntent(
    userId: string,
    plan: string,
    email: string
  ): Promise<{ success: boolean; data?: PaymentIntent; error?: string }> {
    PaymentLogger.trackPaymentFlow('Creating payment intent', { userId, plan, email });
    
    try {
      const planConfig = STRIPE_PLANS[plan as keyof typeof STRIPE_PLANS];
      if (!planConfig) {
        PaymentLogger.log('error', 'PaymentService', 'Invalid plan selected', { plan });
        return { success: false, error: 'Invalid plan selected' };
      }

      PaymentLogger.trackPaymentFlow('Calling Supabase Edge Function', { 
        function: 'create-payment-intent',
        amount: planConfig.amount,
        currency: planConfig.currency
      });

      // Call Supabase Edge Function to create payment intent
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: planConfig.amount,
          currency: planConfig.currency,
          metadata: {
            userId,
            plan,
            email,
            type: 'one_time_payment'
          }
        }
      });

      if (error) {
        PaymentLogger.log('error', 'PaymentService', 'Payment intent creation failed', error);
        console.error('Payment intent creation failed:', error);
        return { success: false, error: error.message };
      }

      PaymentLogger.trackPaymentFlow('Payment intent created successfully', data);
      return { success: true, data };
    } catch (error) {
      PaymentLogger.log('error', 'PaymentService', 'Payment service error', error);
      console.error('Payment service error:', error);
      return { success: false, error: 'Failed to create payment intent' };
    }
  }

  // Create subscription
  static async createSubscription(
    userId: string,
    plan: string,
    email: string,
    paymentMethodId: string
  ): Promise<{ success: boolean; data?: Subscription; error?: string }> {
    try {
      const planConfig = STRIPE_PLANS[plan as keyof typeof STRIPE_PLANS];
      if (!planConfig) {
        return { success: false, error: 'Invalid plan selected' };
      }

      // Call Supabase Edge Function to create subscription
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          userId,
          email,
          plan,
          priceId: planConfig.priceId,
          paymentMethodId
        }
      });

      if (error) {
        console.error('Subscription creation failed:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Subscription service error:', error);
      return { success: false, error: 'Failed to create subscription' };
    }
  }

  // Get customer subscriptions
  static async getCustomerSubscriptions(
    userId: string
  ): Promise<{ success: boolean; data?: Subscription[]; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('get-subscriptions', {
        body: { userId }
      });

      if (error) {
        console.error('Failed to get subscriptions:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data.subscriptions || [] };
    } catch (error) {
      console.error('Subscription fetch error:', error);
      return { success: false, error: 'Failed to fetch subscriptions' };
    }
  }

  // Cancel subscription
  static async cancelSubscription(
    subscriptionId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.functions.invoke('cancel-subscription', {
        body: { subscriptionId }
      });

      if (error) {
        console.error('Subscription cancellation failed:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Subscription cancellation error:', error);
      return { success: false, error: 'Failed to cancel subscription' };
    }
  }

  // Update payment method
  static async updatePaymentMethod(
    subscriptionId: string,
    paymentMethodId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.functions.invoke('update-payment-method', {
        body: { subscriptionId, paymentMethodId }
      });

      if (error) {
        console.error('Payment method update failed:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Payment method update error:', error);
      return { success: false, error: 'Failed to update payment method' };
    }
  }

  // Handle successful payment
  static async handlePaymentSuccess(
    userId: string,
    plan: string,
    paymentIntentId: string
  ): Promise<{ success: boolean; error?: string }> {
    PaymentLogger.trackPaymentFlow('Handling payment success manually', { userId, plan, paymentIntentId });
    
    try {
      // Update user subscription in database
      PaymentLogger.trackDatabaseUpdate('users', 'UPDATE subscription', false, { 
        userId, 
        plan,
        payment_method_added: true,
        updated_at: new Date().toISOString()
      });
      
      const { error } = await supabase
        .from('users')
        .update({
          subscription: plan,
          payment_method_added: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        PaymentLogger.trackDatabaseUpdate('users', 'UPDATE subscription', false, error);
        console.error('Failed to update user subscription:', error);
        return { success: false, error: 'Failed to update subscription' };
      }

      PaymentLogger.trackDatabaseUpdate('users', 'UPDATE subscription', true, { userId, plan });

      // Log the payment
      const paymentData = {
        user_id: userId,
        stripe_payment_intent_id: paymentIntentId,
        plan,
        amount: STRIPE_PLANS[plan as keyof typeof STRIPE_PLANS]?.amount || 0,
        currency: 'usd',
        status: 'succeeded',
        created_at: new Date().toISOString()
      };
      
      PaymentLogger.trackDatabaseUpdate('payments', 'INSERT payment record', false, paymentData);
      
      await supabase.from('payments').insert(paymentData);

      PaymentLogger.trackDatabaseUpdate('payments', 'INSERT payment record', true, { userId, paymentIntentId });
      PaymentLogger.trackPaymentFlow('Payment success handled completely', { userId, plan });
      
      return { success: true };
    } catch (error) {
      PaymentLogger.log('error', 'PaymentService', 'Payment success handling error', error);
      console.error('Payment success handling error:', error);
      return { success: false, error: 'Failed to process payment success' };
    }
  }

  // Manually fix subscription after webhook failure
  static async fixSubscription(userId: string, plan: string = 'starter'): Promise<{
    success: boolean;
    message: string;
    error?: any;
  }> {
    PaymentLogger.log('info', 'PaymentService', `Attempting manual subscription fix for user ${userId} to plan ${plan}`, {
      userId,
      plan,
      timestamp: new Date().toISOString(),
      isLiveMode
    });

    try {
      // First check if user exists
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) {
        PaymentLogger.log('error', 'PaymentService', `User not found: ${userId}`, userError);
        return {
          success: false,
          message: `User with ID ${userId} not found`,
          error: userError
        };
      }

      PaymentLogger.log('info', 'PaymentService', `Current user state:`, {
        id: user.id,
        email: user.email,
        currentSubscription: user.subscription,
        paymentMethodAdded: user.payment_method_added
      });

      // Check if subscription already matches the requested plan
      if (user.subscription === plan && user.payment_method_added === true) {
        PaymentLogger.log('info', 'PaymentService', `User ${userId} already has ${plan} plan, no update needed`);
        return {
          success: true,
          message: `Subscription already set to ${plan}`
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
        PaymentLogger.log('error', 'PaymentService', 'Failed to update subscription', error);
        return {
          success: false,
          message: 'Failed to update subscription',
          error
        };
      }

      PaymentLogger.log('info', 'PaymentService', `Successfully updated subscription for user ${userId} to ${plan}`, data);

      // Log a payment record for manual fixes
      try {
        const paymentData = {
          user_id: userId,
          stripe_payment_intent_id: `manual_fix_${Date.now()}`,
          plan: plan,
          amount: plan === 'starter' ? 2900 : plan === 'professional' ? 9900 : 29900,
          currency: 'usd',
          status: 'succeeded',
          created_at: new Date().toISOString(),
          live_mode: isLiveMode
        };

        const { error: paymentError } = await supabase
          .from('payments')
          .insert(paymentData);

        if (paymentError) {
          PaymentLogger.log('warn', 'PaymentService', 'Failed to log payment record, but subscription was updated', paymentError);
        }
      } catch (paymentError) {
        PaymentLogger.log('warn', 'PaymentService', 'Error logging payment record', paymentError);
      }

      // Update user in storage if available
      const currentUser = StorageManager.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        StorageManager.updateCurrentUser({
          subscription: plan as any,
          paymentMethodAdded: true
        });
        PaymentLogger.log('info', 'PaymentService', 'Updated user in storage', { userId, plan });
      }

      return {
        success: true,
        message: `Subscription successfully updated to ${plan}`
      };
    } catch (error) {
      PaymentLogger.log('error', 'PaymentService', 'Unexpected error during manual fix', error);
      return {
        success: false,
        message: 'An unexpected error occurred',
        error
      };
    }
  }

  // Check if subscription needs fixing
  static async checkSubscriptionStatus(userId: string): Promise<{
    needsFix: boolean;
    currentPlan: string;
    hasPayment: boolean;
  }> {
    try {
      PaymentLogger.log('info', 'PaymentService', `Checking subscription status for user ${userId}`);

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) {
        PaymentLogger.log('error', 'PaymentService', `Error fetching user ${userId}`, userError);
        return { needsFix: false, currentPlan: 'unknown', hasPayment: false };
      }

      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'succeeded')
        .order('created_at', { ascending: false })
        .limit(1);

      const hasPayment = !paymentsError && payments && payments.length > 0;
      const currentPlan = user.subscription;

      if (hasPayment) {
        PaymentLogger.log('info', 'PaymentService', `User ${userId} has payments`, {
          latestPayment: payments[0],
          currentPlan
        });
      }

      const needsFix = hasPayment && (currentPlan === 'free' || currentPlan === 'trial');

      PaymentLogger.log('info', 'PaymentService', `Subscription status for user ${userId}`, {
        needsFix,
        currentPlan,
        hasPayment
      });

      return { needsFix, currentPlan, hasPayment };
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return { needsFix: false, currentPlan: 'unknown', hasPayment: false };
    }
  }

  // Get latest payment for a user
  static async getLatestPayment(userId: string): Promise<any | null> {
    try {
      PaymentLogger.log('info', 'PaymentService', `Getting latest payment for user ${userId}`);

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) {
        PaymentLogger.log('info', 'PaymentService', `No payments found for user ${userId}`, error);
        return null;
      }

      PaymentLogger.log('info', 'PaymentService', `Found latest payment for user ${userId}`, data[0]);
      return data[0];
    } catch (error) {
      console.error('Error getting latest payment:', error);
      PaymentLogger.log('error', 'PaymentService', `Error getting latest payment for user ${userId}`, error);
      return null;
    }
  }
}