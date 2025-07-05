// Payment Processing Logger and Debugger
export class PaymentLogger {
  private static logs: Array<{
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    component: string;
    message: string;
    data?: any;
  }> = [];

  static log(level: 'info' | 'warn' | 'error', component: string, message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      data: data ? JSON.stringify(data, null, 2) : undefined
    };
    
    this.logs.push(logEntry);
    
    // Also log to console with appropriate level
    const consoleMessage = `[${component}] ${message}`;
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
    localStorage.setItem('payment_logs', JSON.stringify(this.logs));
  }

  static getLogs() {
    return this.logs;
  }

  static getLogsFromStorage() {
    try {
      const stored = localStorage.getItem('payment_logs');
      return stored ? JSON.parse(stored) : [];
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
  }

  // Track webhook events
  static trackWebhook(event: string, success: boolean, data?: any) {
    this.log(success ? 'info' : 'error', 'Webhook', `Event: ${event} - ${success ? 'Success' : 'Failed'}`, data);
  }

  // Track database updates
  static trackDatabaseUpdate(table: string, operation: string, success: boolean, data?: any) {
    this.log(success ? 'info' : 'error', 'Database', `${operation} on ${table} - ${success ? 'Success' : 'Failed'}`, data);
  }
}