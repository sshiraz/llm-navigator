import { supabase } from '../lib/supabase';
import { STRIPE_PLANS } from '../lib/stripe';

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
    try {
      const planConfig = STRIPE_PLANS[plan as keyof typeof STRIPE_PLANS];
      if (!planConfig) {
        return { success: false, error: 'Invalid plan selected' };
      }

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
        console.error('Payment intent creation failed:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
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
    try {
      // Update user subscription in database
      const { error } = await supabase
        .from('users')
        .update({
          subscription: plan,
          payment_method_added: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Failed to update user subscription:', error);
        return { success: false, error: 'Failed to update subscription' };
      }

      // Log the payment
      await supabase.from('payments').insert({
        user_id: userId,
        stripe_payment_intent_id: paymentIntentId,
        plan,
        amount: STRIPE_PLANS[plan as keyof typeof STRIPE_PLANS].amount,
        currency: 'usd',
        status: 'succeeded'
      });

      return { success: true };
    } catch (error) {
      console.error('Payment success handling error:', error);
      return { success: false, error: 'Failed to process payment success' };
    }
  }
}