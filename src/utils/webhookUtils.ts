import { supabase } from '../lib/supabase';
import { PaymentLogger } from './paymentLogger';

// Get Supabase project ID from URL
export const getSupabaseProjectId = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) return null;
  
  try {
    // Extract project ID from URL (e.g., https://jgkdzaoajbzmuuajpndv.supabase.co)
    const matches = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    return matches ? matches[1] : null;
  } catch (error) {
    console.error('Error extracting project ID:', error);
    return null;
  }
};

// Test webhook endpoint
export const testWebhookEndpoint = async () => {
  try {
    PaymentLogger.log('info', 'WebhookUtils', 'Testing webhook endpoint...');
    
    const projectId = getSupabaseProjectId();
    const webhookUrl = projectId 
      ? `https://${projectId}.supabase.co/functions/v1/stripe-webhook`
      : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-webhook`;
      
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'stripe-signature': 'test_signature',
        'x-test-request': 'true'
      },
      body: JSON.stringify({ 
        type: 'payment_intent.succeeded',
        test: true,
        data: {
          object: {
            id: 'pi_test_' + Date.now(),
            amount: 2900,
            currency: 'usd',
            status: 'succeeded',
            metadata: {
              userId: 'test-user',
              plan: 'starter'
            }
          }
        }
      })
    });
    
    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      responseData = await response.text();
    }
    
    const result = {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      data: responseData,
      headers: Object.fromEntries(response.headers.entries())
    };
    
    PaymentLogger.log(
      response.ok ? 'info' : 'error', 
      'WebhookUtils', 
      `Webhook test result: ${response.status} ${response.statusText}`, 
      result
    );
    
    return result;
  } catch (error) {
    PaymentLogger.log('error', 'WebhookUtils', 'Webhook test failed', error);
    return { error: error.message };
  }
};

// Check Edge Functions deployment
export const checkEdgeFunctions = async () => {
  try {
    PaymentLogger.log('info', 'WebhookUtils', 'Checking Edge Functions deployment...');

    const projectId = getSupabaseProjectId();
    const baseUrl = projectId 
      ? `https://${projectId}.supabase.co`
      : import.meta.env.VITE_SUPABASE_URL;
    
    const functions = ['create-payment-intent', 'create-subscription', 'stripe-webhook'];
    const results = await Promise.all(
      functions.map(async (func) => {
        try {
          const response = await fetch(`${baseUrl}/functions/v1/${func}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ test: true })
          });
          
          return {
            name: func,
            status: response.status,
            deployed: response.status !== 404
          };
        } catch (error) {
          return {
            name: func,
            status: 0,
            deployed: false,
            error
          };
        }
      })
    );
    
    results.forEach(result => {
      PaymentLogger.log(
        result.deployed ? 'info' : 'error', 
        'WebhookUtils', 
        `Edge Function ${result.name}: ${result.deployed ? 'Available' : 'NOT DEPLOYED'}`,
        { status: result.status }
      );
    });
    
    return results;
  } catch (error) {
    PaymentLogger.log('error', 'WebhookUtils', 'Failed to check Edge Functions', error);
    return [];
  }
};

// Check database connection
export const checkDatabaseConnection = async () => {
  try {
    PaymentLogger.log('info', 'WebhookUtils', 'Testing database connection...');
    
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      PaymentLogger.log('error', 'WebhookUtils', 'Database connection failed', error);
      return { success: false, error };
    } else {
      PaymentLogger.log('info', 'WebhookUtils', 'Database connection successful', data);
      return { success: true, data };
    }
  } catch (error) {
    PaymentLogger.log('error', 'WebhookUtils', 'Database connection error', error);
    return { success: false, error };
  }
};

// Simulate webhook event
export const simulateWebhook = async (type = 'payment_intent.succeeded') => {
  try {
    PaymentLogger.log('info', 'WebhookUtils', `Simulating ${type} webhook...`);
    
    const mockPaymentIntent = {
      id: 'pi_test_' + Date.now(),
      amount: 2900,
      currency: 'usd',
      status: 'succeeded',
      metadata: {
        userId: 'test-user-id',
        plan: 'starter',
        email: 'test@example.com'
      }
    };
    
    PaymentLogger.trackWebhook(type, true, mockPaymentIntent);
    
    return { success: true, data: mockPaymentIntent };
  } catch (error) {
    PaymentLogger.log('error', 'WebhookUtils', 'Failed to simulate webhook', error);
    return { success: false, error };
  }
};

// Update webhook secret
export const updateWebhookSecret = async (secret: string, isLiveMode = false) => {
  try {
    if (!secret || !secret.startsWith('whsec_')) {
      return { success: false, error: 'Invalid webhook secret format' };
    }
    
    const secretName = isLiveMode ? 'STRIPE_LIVE_WEBHOOK_SECRET' : 'STRIPE_WEBHOOK_SECRET';
    PaymentLogger.log('info', 'WebhookUtils', `Generating command to update ${secretName}`, { isLiveMode });
    
    const command = `npx supabase secrets set ${secretName}=${secret}`;
    
    return { 
      success: true, 
      command,
      message: `Command generated to update ${isLiveMode ? 'live' : 'test'} webhook secret`
    };
  } catch (error) {
    PaymentLogger.log('error', 'WebhookUtils', 'Failed to generate webhook secret command', error);
    return { success: false, error: error.message };
  }
};

// Generate deploy command
export const generateDeployCommand = () => {
  const command = 'npx supabase functions deploy stripe-webhook';
  
  // Get project ID for more specific instructions
  const projectId = getSupabaseProjectId();
  let fullCommand = command;
  
  if (projectId) {
    fullCommand = `npx supabase functions deploy stripe-webhook --project-ref ${projectId}`;
  }
  
  PaymentLogger.log('info', 'WebhookUtils', 'Generated deploy command', { command: fullCommand });
  
  return {
    success: true,
    command: fullCommand,
    message: 'Deploy command generated'
  };
};