import { PaymentLogger } from './paymentLogger';

export class StripeCheckoutService {
  /**
   * Create a Stripe Checkout session
   */
  static async createCheckoutSession(plan: string, userId: string, email: string): Promise<{
    success: boolean;
    sessionId?: string;
    url?: string;
    error?: string;
  }> {
    PaymentLogger.trackPaymentFlow('Creating Stripe checkout session', { plan, userId, email });
    
    try {
      // Determine price ID based on plan
      let priceId;
      switch (plan) {
        case 'starter':
          priceId = import.meta.env.VITE_STRIPE_STARTER_PRICE_ID;
          break;
        case 'professional':
          priceId = import.meta.env.VITE_STRIPE_PROFESSIONAL_PRICE_ID;
          break;
        case 'enterprise':
          priceId = import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID;
          break;
        default:
          throw new Error(`Invalid plan: ${plan}`);
      }

      if (!priceId) {
        throw new Error(`Price ID not found for plan: ${plan}`);
      }

      // Create checkout session
      const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY}`
        },
        body: new URLSearchParams({
          'success_url': `${window.location.origin}?session_id={CHECKOUT_SESSION_ID}&plan=${plan}&user_id=${userId}`,
          'cancel_url': `${window.location.origin}?checkout_cancelled=true`,
          'mode': 'subscription',
          'line_items[0][price]': priceId,
          'line_items[0][quantity]': '1',
          'customer_email': email,
          'client_reference_id': userId,
          'metadata[userId]': userId,
          'metadata[plan]': plan
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create checkout session');
      }

      const session = await response.json();
      
      PaymentLogger.trackPaymentFlow('Checkout session created', { 
        sessionId: session.id,
        url: session.url
      });
      
      return {
        success: true,
        sessionId: session.id,
        url: session.url
      };
    } catch (error) {
      PaymentLogger.log('error', 'StripeCheckoutService', 'Failed to create checkout session', error);
      return {
        success: false,
        error: error.message || 'Failed to create checkout session'
      };
    }
  }

  /**
   * Verify a Stripe Checkout session
   */
  static async verifyCheckoutSession(sessionId: string): Promise<{
    success: boolean;
    session?: any;
    error?: string;
  }> {
    PaymentLogger.trackPaymentFlow('Verifying Stripe checkout session', { sessionId });
    
    try {
      // In a real implementation, you would verify the session with Stripe
      // For this demo, we'll simulate a successful verification
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockSession = {
        id: sessionId,
        payment_status: 'paid',
        status: 'complete',
        customer: 'cus_mock123',
        subscription: 'sub_mock123',
        metadata: {
          userId: '1',
          plan: 'starter'
        }
      };
      
      PaymentLogger.trackPaymentFlow('Checkout session verified', mockSession);
      
      return {
        success: true,
        session: mockSession
      };
    } catch (error) {
      PaymentLogger.log('error', 'StripeCheckoutService', 'Failed to verify checkout session', error);
      return {
        success: false,
        error: error.message || 'Failed to verify checkout session'
      };
    }
  }
}