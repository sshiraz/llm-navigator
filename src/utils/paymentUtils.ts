import { supabase } from '../lib/supabase';
import { PaymentLogger } from './paymentLogger';
import { isLiveMode } from './liveMode';

// Check subscription status
export const checkSubscriptionStatus = async (userId: string) => {
  try {
    PaymentLogger.log('info', 'PaymentUtils', `Checking subscription status for user ${userId}`);
    
    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError) {
      PaymentLogger.log('error', 'PaymentUtils', `Error fetching user ${userId}`, userError);
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
    
    if (hasPayment) {
      PaymentLogger.log('info', 'PaymentUtils', `User ${userId} has payments`, {
        latestPayment: payments[0],
        currentPlan
      });
    }
    
    // If there's a successful payment but subscription is still free/trial
    const needsFix = hasPayment && (currentPlan === 'free' || currentPlan === 'trial');
    
    PaymentLogger.log('info', 'PaymentUtils', `Subscription status for user ${userId}`, {
      needsFix,
      currentPlan,
      hasPayment
    });
    
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
};

// Get latest payment
export const getLatestPayment = async (userId: string) => {
  try {
    PaymentLogger.log('info', 'PaymentUtils', `Getting latest payment for user ${userId}`);
    
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error || !data || data.length === 0) {
      PaymentLogger.log('info', 'PaymentUtils', `No payments found for user ${userId}`, error);
      return null;
    }
    
    PaymentLogger.log('info', 'PaymentUtils', `Found latest payment for user ${userId}`, data[0]);
    return data[0];
  } catch (error) {
    console.error('Error getting latest payment:', error);
    PaymentLogger.log('error', 'PaymentUtils', `Error getting latest payment for user ${userId}`, error);
    return null;
  }
};

// Fix subscription
export const fixSubscription = async (userId: string, plan: string = 'starter') => {
  PaymentLogger.log('info', 'PaymentUtils', `Attempting manual subscription fix for user ${userId} to plan ${plan}`, { 
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
      PaymentLogger.log('error', 'PaymentUtils', `User not found: ${userId}`, userError);
      return {
        success: false,
        message: `User with ID ${userId} not found`,
        error: userError
      };
    }

    // Log the current user state
    PaymentLogger.log('info', 'PaymentUtils', `Current user state:`, {
      id: user.id,
      email: user.email,
      currentSubscription: user.subscription,
      paymentMethodAdded: user.payment_method_added
    });
    
    // Check if subscription already matches the requested plan
    if (user.subscription === plan && user.payment_method_added === true) {
      PaymentLogger.log('info', 'PaymentUtils', `User ${userId} already has ${plan} plan, no update needed`);
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
      PaymentLogger.log('error', 'PaymentUtils', 'Failed to update subscription', error);
      return {
        success: false,
        message: 'Failed to update subscription',
        error
      };
    }
    
    PaymentLogger.log('info', 'PaymentUtils', `Successfully updated subscription for user ${userId} to ${plan}`, data);

    // Also log a payment record to keep track of manual fixes
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
      
      PaymentLogger.log('info', 'PaymentUtils', 'Creating payment record', paymentData);
      
      const { error: paymentError } = await supabase
        .from('payments')
        .insert(paymentData);
        
      if (paymentError) {
        PaymentLogger.log('warn', 'PaymentUtils', 'Failed to log payment record, but subscription was updated', paymentError);
      }
    } catch (paymentError) {
      PaymentLogger.log('warn', 'PaymentUtils', 'Error logging payment record', paymentError);
    }
    
    // Update user in localStorage if available
    try {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const currentUser = JSON.parse(userStr);
        if (currentUser.id === userId) {
          const updatedUser = {
            ...currentUser,
            subscription: plan,
            paymentMethodAdded: true
          };
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          PaymentLogger.log('info', 'PaymentUtils', 'Updated user in localStorage', { userId, plan });
        }
      }
    } catch (e) {
      console.error('Error updating localStorage:', e);
    }
    
    return {
      success: true,
      message: `Subscription successfully updated to ${plan}`
    };
  } catch (error) {
    PaymentLogger.log('error', 'PaymentUtils', 'Unexpected error during manual fix', error);
    return {
      success: false,
      message: 'An unexpected error occurred',
      error
    };
  }
};