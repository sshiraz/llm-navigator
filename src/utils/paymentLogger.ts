// Payment Processing Logger and Debugger
export class PaymentLogger {
  private static readonly MAX_LOGS = 1000; // Limit number of logs to prevent memory issues
  private static logs: Array<{
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    component: string;
    message: string;
    data?: any;
  }> = [];

  // Check if we're in live mode
  private static isLiveMode() {
    return import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_live_');
  }

  static log(level: 'info' | 'warn' | 'error', component: string, message: string, data?: any) {
    // Add live mode indicator to message if in live mode
    const liveMessage = this.isLiveMode() ? `[LIVE] ${message}` : message;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      message: liveMessage,
      data: data ? JSON.stringify(data, null, 2) : undefined
    };
    
    // Add to beginning of array for most recent first
    this.logs.unshift(logEntry);
    
    // Trim logs if they exceed the maximum
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(0, this.MAX_LOGS);
    }
    
    // Also log to console with appropriate level
    const consoleMessage = `[${component}] ${liveMessage}`;
    switch (level) {
      case 'info':
        console.log(consoleMessage, data);
        break;
      case 'warn':
        console.warn(consoleMessage, data);
        break;
      case 'error':
        console.error(consoleMessage, data);
        break;
    }
    
    // Store in localStorage for persistence
    try {
      localStorage.setItem('payment_logs', JSON.stringify(this.logs));
    } catch (e) {
      // If localStorage fails (e.g., quota exceeded), log to console but don't crash
      console.warn('Failed to store payment logs in localStorage', e);
    }
  }

  static getLogs() {
    return this.logs;
  }

  static getLogsFromStorage() {
    try {
      const stored = localStorage.getItem('payment_logs') || '[]';
      const parsedLogs = JSON.parse(stored);
      return Array.isArray(parsedLogs) ? parsedLogs : [];
    } catch {
      return [];
    }
  }

  static clearLogs() {
    this.logs = [];
    localStorage.removeItem('payment_logs');
  }

  static exportLogs() {
    const allLogs = [...this.getLogsFromStorage(), ...this.logs];
    const logText = allLogs.map(log => 
      `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.component}] ${log.message}${log.data ? '\n' + log.data : ''}`
    ).join('\n\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-logs-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Track payment flow steps
  static trackPaymentFlow(step: string, data?: any) {
    this.log('info', 'PaymentFlow', `Step: ${step}`, data);
    
    // Add extra warning if in live mode
    if (this.isLiveMode()) {
      this.log('warn', 'PaymentFlow', '🔴 LIVE MODE - Real payments are being processed', {
        step,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Generate a comprehensive payment debug report
  static generateDebugReport() {
    const allLogs = [...this.getLogsFromStorage(), ...this.logs];
    
    // Create comprehensive log export
    const exportData = {
      exportDate: new Date().toISOString(),
      totalLogs: allLogs.length,
      environment: {
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing',
        supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
        stripeKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? 
          (this.isLiveMode() ? 'LIVE MODE' : 'TEST MODE') : 'Missing',
        starterPriceId: import.meta.env.VITE_STRIPE_STARTER_PRICE_ID ? 'Set' : 'Missing',
        professionalPriceId: import.meta.env.VITE_STRIPE_PROFESSIONAL_PRICE_ID ? 'Set' : 'Missing',
        enterprisePriceId: import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID ? 'Set' : 'Missing'
      },
      webhookStatus: this.getWebhookStatus(allLogs),
      paymentStatus: this.getPaymentStatus(allLogs),
      logs: allLogs
    };
    
    return exportData;
  }
  
  // Extract webhook status from logs
  private static getWebhookStatus(logs: any[]) {
    const webhookLogs = logs.filter(log => 
      log.component === 'Webhook' || 
      log.component === 'WebhookDebugger' ||
      (log.component === 'Debug' && log.message.includes('webhook'))
    );
    
    const latestStatus = webhookLogs.length > 0 ? webhookLogs[0] : null;
    
    return {
      lastTested: latestStatus ? latestStatus.timestamp : null,
      success: latestStatus ? !latestStatus.level.includes('error') : false,
      details: latestStatus ? latestStatus.data : null
    };
  }
  
  // Extract payment status from logs
  private static getPaymentStatus(logs: any[]) {
    const paymentLogs = logs.filter(log => 
      log.component === 'PaymentFlow' || 
      log.component === 'PaymentService'
    );
    
    const successLog = paymentLogs.find(log => 
      log.message.includes('Payment succeeded') || 
      log.message.includes('success')
    );
    
    const errorLog = paymentLogs.find(log => 
      log.level === 'error' && 
      (log.message.includes('payment') || log.message.includes('Payment'))
    );
    
    return {
      hasSuccessfulPayment: !!successLog,
      hasPaymentError: !!errorLog,
      lastPaymentTimestamp: successLog ? successLog.timestamp : null,
      lastErrorTimestamp: errorLog ? errorLog.timestamp : null,
      lastPaymentDetails: successLog ? successLog.data : null,
      lastErrorDetails: errorLog ? errorLog.data : null
    };
  }

  // Track webhook events
  static trackWebhook(event: string, success: boolean, data?: any) {
    const liveIndicator = this.isLiveMode() ? '🔴 LIVE MODE - ' : '';
    this.log(
      success ? 'info' : 'error', 
      'Webhook', 
      `${liveIndicator}Event: ${event} - ${success ? 'Success' : 'Failed'}`, 
      data
    );
  }

  // Track database updates
  static trackDatabaseUpdate(table: string, operation: string, success: boolean, data?: any) {
    this.log(success ? 'info' : 'error', 'Database', `${operation} on ${table} - ${success ? 'Success' : 'Failed'}`, data);
  }

  // Track Stripe events
  static trackStripeEvent(event: string, data?: any) {
    const liveIndicator = this.isLiveMode() ? '🔴 LIVE MODE - ' : '';
    this.log('info', 'Stripe', `${liveIndicator}Event: ${event}`, data);
  }

  // Track Edge Function calls
  static trackEdgeFunction(functionName: string, success: boolean, data?: any) {
    this.log(success ? 'info' : 'error', 'EdgeFunction', `${functionName} - ${success ? 'Success' : 'Failed'}`, data);
  }
}