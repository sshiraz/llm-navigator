// Payment Debugging Utilities
export class PaymentDebugger {
  private static readonly DEBUG_KEY = 'llm_navigator_payment_debug';
  private static isEnabled = import.meta.env.DEV || localStorage.getItem('payment_debug') === 'true';

  // Enable/disable debugging
  static enableDebug() {
    localStorage.setItem('payment_debug', 'true');
    this.isEnabled = true;
    console.log('🔧 Payment debugging enabled');
  }

  static disableDebug() {
    localStorage.removeItem('payment_debug');
    this.isEnabled = false;
    console.log('🔧 Payment debugging disabled');
  }

  // Log payment events with detailed context
  static log(event: string, data?: any, level: 'info' | 'warn' | 'error' = 'info') {
    if (!this.isEnabled) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      event,
      data,
      level,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Console logging with colors
    const colors = {
      info: '#3b82f6',
      warn: '#f59e0b',
      error: '#ef4444'
    };

    console.group(`%c💳 Payment Debug: ${event}`, `color: ${colors[level]}; font-weight: bold;`);
    console.log('Timestamp:', timestamp);
    if (data) {
      console.log('Data:', data);
    }
    console.groupEnd();

    // Store in localStorage for debugging
    this.storeDebugLog(logEntry);
  }

  // Store debug logs
  private static storeDebugLog(entry: any) {
    try {
      const logs = JSON.parse(localStorage.getItem(this.DEBUG_KEY) || '[]');
      logs.push(entry);
      
      // Keep only last 100 entries
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      localStorage.setItem(this.DEBUG_KEY, JSON.stringify(logs));
    } catch (error) {
      console.warn('Failed to store debug log:', error);
    }
  }

  // Get all debug logs
  static getDebugLogs(): any[] {
    try {
      return JSON.parse(localStorage.getItem(this.DEBUG_KEY) || '[]');
    } catch {
      return [];
    }
  }

  // Clear debug logs
  static clearLogs() {
    localStorage.removeItem(this.DEBUG_KEY);
    console.log('🧹 Payment debug logs cleared');
  }

  // Export logs for support
  static exportLogs(): string {
    const logs = this.getDebugLogs();
    return JSON.stringify(logs, null, 2);
  }

  // Check Stripe configuration
  static checkStripeConfig() {
    const config = {
      publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
      starterPriceId: import.meta.env.VITE_STRIPE_STARTER_PRICE_ID,
      professionalPriceId: import.meta.env.VITE_STRIPE_PROFESSIONAL_PRICE_ID,
      enterprisePriceId: import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID
    };

    this.log('Stripe Configuration Check', {
      publishableKeyPresent: !!config.publishableKey,
      publishableKeyPrefix: config.publishableKey?.substring(0, 7),
      starterPriceIdPresent: !!config.starterPriceId,
      professionalPriceIdPresent: !!config.professionalPriceId,
      enterprisePriceIdPresent: !!config.enterprisePriceId,
      allConfigured: Object.values(config).every(Boolean)
    });

    return config;
  }

  // Check Supabase Edge Functions
  static async checkEdgeFunctions() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      this.log('Edge Functions Check Failed', { error: 'Missing Supabase credentials' }, 'error');
      return false;
    }

    const functions = [
      'create-payment-intent',
      'create-subscription',
      'stripe-webhook'
    ];

    const results = {};

    for (const functionName of functions) {
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ test: true })
        });

        results[functionName] = {
          status: response.status,
          statusText: response.statusText,
          available: response.status !== 404
        };
      } catch (error) {
        results[functionName] = {
          error: error.message,
          available: false
        };
      }
    }

    this.log('Edge Functions Check', results);
    return results;
  }

  // Test payment intent creation
  static async testPaymentIntent(amount = 2900, plan = 'starter') {
    try {
      this.log('Testing Payment Intent Creation', { amount, plan });

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !anonKey) {
        throw new Error('Missing Supabase configuration');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          currency: 'usd',
          metadata: {
            userId: 'test-user',
            plan,
            email: 'test@example.com'
          }
        })
      });

      const data = await response.json();

      if (response.ok) {
        this.log('Payment Intent Test Success', {
          clientSecret: data.clientSecret?.substring(0, 20) + '...',
          amount: data.amount,
          currency: data.currency
        });
        return { success: true, data };
      } else {
        this.log('Payment Intent Test Failed', { 
          error: data.error, 
          status: response.status,
          statusText: response.statusText 
        }, 'error');
        return { success: false, error: data.error || `HTTP ${response.status}: ${response.statusText}` };
      }
    } catch (error) {
      this.log('Payment Intent Test Error', { error: error.message }, 'error');
      return { success: false, error: error.message };
    }
  }

  // Monitor Stripe events
  static monitorStripeEvents(stripe: any) {
    if (!stripe || !this.isEnabled) return;

    // Override Stripe methods to add logging
    const originalConfirmPayment = stripe.confirmPayment;
    stripe.confirmPayment = async (...args: any[]) => {
      this.log('Stripe confirmPayment called', { args: args.length });
      try {
        const result = await originalConfirmPayment.apply(stripe, args);
        this.log('Stripe confirmPayment result', {
          success: !result.error,
          error: result.error?.message,
          errorType: result.error?.type,
          errorCode: result.error?.code,
          paymentIntent: result.paymentIntent?.id,
          paymentIntentStatus: result.paymentIntent?.status
        });
        return result;
      } catch (error) {
        this.log('Stripe confirmPayment error', { error: error.message }, 'error');
        throw error;
      }
    };
  }

  // Comprehensive system check
  static async runSystemCheck() {
    this.log('Starting System Check');
    
    const results = {
      timestamp: new Date().toISOString(),
      stripeConfig: this.checkStripeConfig(),
      edgeFunctions: await this.checkEdgeFunctions(),
      paymentTest: await this.testPaymentIntent(),
      environment: {
        isDev: import.meta.env.DEV,
        mode: import.meta.env.MODE,
        url: window.location.href,
        userAgent: navigator.userAgent
      }
    };

    this.log('System Check Complete', results);
    return results;
  }

  // Debug panel for development
  static createDebugPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.id = 'payment-debug-panel';
    panel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 300px;
      max-height: 400px;
      background: white;
      border: 2px solid #3b82f6;
      border-radius: 8px;
      padding: 16px;
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
      overflow-y: auto;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;

    const header = document.createElement('div');
    header.style.cssText = 'font-weight: bold; margin-bottom: 8px; color: #3b82f6;';
    header.textContent = '💳 Payment Debug Panel';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = 'float: right; background: none; border: none; font-size: 16px; cursor: pointer;';
    closeBtn.onclick = () => panel.remove();

    const content = document.createElement('div');
    content.id = 'debug-content';

    header.appendChild(closeBtn);
    panel.appendChild(header);
    panel.appendChild(content);

    this.updateDebugPanel(content);

    // Update every 2 seconds
    setInterval(() => this.updateDebugPanel(content), 2000);

    return panel;
  }

  private static updateDebugPanel(content: HTMLElement) {
    const logs = this.getDebugLogs().slice(-5); // Last 5 logs
    content.innerHTML = logs.map(log => `
      <div style="margin-bottom: 8px; padding: 4px; background: ${
        log.level === 'error' ? '#fef2f2' : log.level === 'warn' ? '#fffbeb' : '#f0f9ff'
      }; border-radius: 4px;">
        <div style="font-weight: bold; color: ${
          log.level === 'error' ? '#dc2626' : log.level === 'warn' ? '#d97706' : '#2563eb'
        };">
          ${log.event}
        </div>
        <div style="color: #6b7280; font-size: 10px;">
          ${new Date(log.timestamp).toLocaleTimeString()}
        </div>
      </div>
    `).join('');
  }

  // Show debug panel
  static showDebugPanel() {
    if (document.getElementById('payment-debug-panel')) return;
    document.body.appendChild(this.createDebugPanel());
  }

  // Hide debug panel
  static hideDebugPanel() {
    const panel = document.getElementById('payment-debug-panel');
    if (panel) panel.remove();
  }
}

// Global debug functions for console access
if (typeof window !== 'undefined') {
  (window as any).paymentDebug = {
    enable: () => PaymentDebugger.enableDebug(),
    disable: () => PaymentDebugger.disableDebug(),
    logs: () => PaymentDebugger.getDebugLogs(),
    clear: () => PaymentDebugger.clearLogs(),
    export: () => PaymentDebugger.exportLogs(),
    checkStripe: () => PaymentDebugger.checkStripeConfig(),
    checkFunctions: () => PaymentDebugger.checkEdgeFunctions(),
    testPayment: (amount?: number, plan?: string) => PaymentDebugger.testPaymentIntent(amount, plan),
    systemCheck: () => PaymentDebugger.runSystemCheck(),
    showPanel: () => PaymentDebugger.showDebugPanel(),
    hidePanel: () => PaymentDebugger.hideDebugPanel()
  };
}