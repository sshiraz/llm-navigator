import { supabase } from '../lib/supabase';
import { STRIPE_PLANS } from '../lib/stripe';
import { PaymentDebugger } from '../utils/paymentDebugger';

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
    PaymentDebugger.log('Creating Payment Intent', { userId, plan, email });
    
    try {
      const planConfig = STRIPE_PLANS[plan as keyof typeof STRIPE_PLANS];
      if (!planConfig) {
        const error = 'Invalid plan selected';
        PaymentDebugger.log('Payment Intent Creation Failed', { error, plan }, 'error');
        return { success: false, error };
      }

      PaymentDebugger.log('Plan Configuration Found', { 
        plan, 
        amount: planConfig.amount, 
        priceId: planConfig.priceId 
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
        PaymentDebugger.log('Supabase Function Error', { 
          error: error.message, 
          details: error 
        }, 'error');
        return { success: false, error: error.message };
      }

      PaymentDebugger.log('Payment Intent Created Successfully', { 
        clientSecretLength: data.clientSecret?.length,
        amount: data.amount,
        currency: data.currency
      });

      return { success: true, data };
    } catch (error) {
      PaymentDebugger.log('Payment Service Error', { 
        error: error.message, 
        stack: error.stack 
      }, 'error');
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
    PaymentDebugger.log('Creating Subscription', { userId, plan, email, paymentMethodId });
    
    try {
      const planConfig = STRIPE_PLANS[plan as keyof typeof STRIPE_PLANS];
      if (!planConfig) {
        const error = 'Invalid plan selected';
        PaymentDebugger.log('Subscription Creation Failed', { error, plan }, 'error');
        return { success: false, error };
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
        PaymentDebugger.log('Subscription Creation Error', { 
          error: error.message, 
          details: error 
        }, 'error');
        return { success: false, error: error.message };
      }

      PaymentDebugger.log('Subscription Created Successfully', { 
        subscriptionId: data.subscription.id,
        status: data.subscription.status
      });

      return { success: true, data };
    } catch (error) {
      PaymentDebugger.log('Subscription Service Error', { 
        error: error.message, 
        stack: error.stack 
      }, 'error');
      return { success: false, error: 'Failed to create subscription' };
    }
  }

  // Get customer subscriptions
  static async getCustomerSubscriptions(
    userId: string
  ): Promise<{ success: boolean; data?: Subscription[]; error?: string }> {
    PaymentDebugger.log('Fetching Customer Subscriptions', { userId });
    
    try {
      const { data, error } = await supabase.functions.invoke('get-subscriptions', {
        body: { userId }
      });

      if (error) {
        PaymentDebugger.log('Failed to Get Subscriptions', { 
          error: error.message, 
          details: error 
        }, 'error');
        return { success: false, error: error.message };
      }

      PaymentDebugger.log('Subscriptions Retrieved', { 
        count: data.subscriptions?.length || 0 
      });

      return { success: true, data: data.subscriptions || [] };
    } catch (error) {
      PaymentDebugger.log('Subscription Fetch Error', { 
        error: error.message, 
        stack: error.stack 
      }, 'error');
      return { success: false, error: 'Failed to fetch subscriptions' };
    }
  }

  // Cancel subscription
  static async cancelSubscription(
    subscriptionId: string
  ): Promise<{ success: boolean; error?: string }> {
    PaymentDebugger.log('Cancelling Subscription', { subscriptionId });
    
    try {
      const { error } = await supabase.functions.invoke('cancel-subscription', {
        body: { subscriptionId }
      });

      if (error) {
        PaymentDebugger.log('Subscription Cancellation Failed', { 
          error: error.message, 
          subscriptionId 
        }, 'error');
        return { success: false, error: error.message };
      }

      PaymentDebugger.log('Subscription Cancelled Successfully', { subscriptionId });
      return { success: true };
    } catch (error) {
      PaymentDebugger.log('Subscription Cancellation Error', { 
        error: error.message, 
        stack: error.stack 
      }, 'error');
      return { success: false, error: 'Failed to cancel subscription' };
    }
  }

  // Update payment method
  static async updatePaymentMethod(
    subscriptionId: string,
    paymentMethodId: string
  ): Promise<{ success: boolean; error?: string }> {
    PaymentDebugger.log('Updating Payment Method', { subscriptionId, paymentMethodId });
    
    try {
      const { error } = await supabase.functions.invoke('update-payment-method', {
        body: { subscriptionId, paymentMethodId }
      });

      if (error) {
        PaymentDebugger.log('Payment Method Update Failed', { 
          error: error.message, 
          subscriptionId 
        }, 'error');
        return { success: false, error: error.message };
      }

      PaymentDebugger.log('Payment Method Updated Successfully', { subscriptionId });
      return { success: true };
    } catch (error) {
      PaymentDebugger.log('Payment Method Update Error', { 
        error: error.message, 
        stack: error.stack 
      }, 'error');
      return { success: false, error: 'Failed to update payment method' };
    }
  }

  // Handle successful payment
  static async handlePaymentSuccess(
    userId: string,
    plan: string,
    paymentIntentId: string
  ): Promise<{ success: boolean; error?: string }> {
    PaymentDebugger.log('Handling Payment Success', { userId, plan, paymentIntentId });
    
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
        PaymentDebugger.log('Failed to Update User Subscription', { 
          error: error.message, 
          userId, 
          plan 
        }, 'error');
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

      PaymentDebugger.log('Payment Success Handled', { userId, plan, paymentIntentId });
      return { success: true };
    } catch (error) {
      PaymentDebugger.log('Payment Success Handling Error', { 
        error: error.message, 
        stack: error.stack 
      }, 'error');
      return { success: false, error: 'Failed to process payment success' };
    }
  }
}