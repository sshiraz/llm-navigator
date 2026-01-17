import { supabase } from '../lib/supabase';

/**
 * Audit Log Event Categories
 */
export type AuditCategory = 'auth' | 'admin' | 'data' | 'security' | 'billing';

/**
 * Audit Log Event Types
 */
export type AuditEventType =
  // Authentication events
  | 'auth.login'
  | 'auth.logout'
  | 'auth.login_failed'
  | 'auth.signup'
  | 'auth.password_change'
  | 'auth.password_reset'
  // Admin events
  | 'admin.user_delete'
  | 'admin.user_update'
  | 'admin.cleanup_data'
  | 'admin.view_users'
  // Data events
  | 'data.export'
  | 'data.delete_account'
  | 'data.analysis_create'
  // Security events
  | 'security.2fa_enable'
  | 'security.2fa_disable'
  | 'security.api_key_create'
  | 'security.api_key_revoke'
  // Billing events
  | 'billing.subscription_create'
  | 'billing.subscription_cancel'
  | 'billing.payment_success'
  | 'billing.payment_failed';

/**
 * Audit Log Entry
 */
export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  user_email: string | null;
  event_type: string;
  event_category: string;
  description: string;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  status: 'success' | 'failure' | 'warning';
  error_message: string | null;
  created_at: string;
}

/**
 * Audit Log Service
 *
 * Provides methods to log and retrieve security audit events.
 * Used for compliance tracking (GDPR, SOC2) and security monitoring.
 */
export class AuditLogService {
  /**
   * Log an audit event
   */
  static async log(
    eventType: AuditEventType,
    description: string,
    options: {
      metadata?: Record<string, unknown>;
      status?: 'success' | 'failure' | 'warning';
      errorMessage?: string;
    } = {}
  ): Promise<{ success: boolean; logId?: string; error?: string }> {
    try {
      const category = eventType.split('.')[0] as AuditCategory;
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null;

      const { data, error } = await supabase.rpc('log_audit_event', {
        p_event_type: eventType,
        p_event_category: category,
        p_description: description,
        p_metadata: options.metadata || {},
        p_status: options.status || 'success',
        p_error_message: options.errorMessage || null,
        p_ip_address: null, // IP is captured server-side
        p_user_agent: userAgent,
      });

      if (error) {
        console.error('Failed to log audit event:', error);
        return { success: false, error: error.message };
      }

      return { success: true, logId: data };
    } catch (error) {
      console.error('Audit log error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get audit logs (admin only)
   */
  static async getLogs(options: {
    limit?: number;
    offset?: number;
    category?: AuditCategory;
    eventType?: AuditEventType;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<{
    success: boolean;
    logs?: AuditLogEntry[];
    total?: number;
    error?: string;
  }> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (options.category) {
        query = query.eq('event_category', options.category);
      }
      if (options.eventType) {
        query = query.eq('event_type', options.eventType);
      }
      if (options.userId) {
        query = query.eq('user_id', options.userId);
      }
      if (options.startDate) {
        query = query.gte('created_at', options.startDate.toISOString());
      }
      if (options.endDate) {
        query = query.lte('created_at', options.endDate.toISOString());
      }

      // Pagination
      const limit = options.limit || 50;
      const offset = options.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Failed to get audit logs:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        logs: data as AuditLogEntry[],
        total: count || 0,
      };
    } catch (error) {
      console.error('Get audit logs error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get recent activity for a specific user
   */
  static async getUserActivity(
    userId: string,
    limit = 20
  ): Promise<{ success: boolean; logs?: AuditLogEntry[]; error?: string }> {
    return this.getLogs({ userId, limit });
  }

  /**
   * Get login history for a user
   */
  static async getLoginHistory(
    userId: string,
    limit = 10
  ): Promise<{ success: boolean; logs?: AuditLogEntry[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .in('event_type', ['auth.login', 'auth.login_failed', 'auth.logout'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, logs: data as AuditLogEntry[] };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get security events summary (for admin dashboard)
   */
  static async getSecuritySummary(days = 7): Promise<{
    success: boolean;
    summary?: {
      totalLogins: number;
      failedLogins: number;
      newSignups: number;
      dataExports: number;
      accountDeletions: number;
      adminActions: number;
    };
    error?: string;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('audit_logs')
        .select('event_type')
        .gte('created_at', startDate.toISOString());

      if (error) {
        return { success: false, error: error.message };
      }

      const logs = data || [];

      const summary = {
        totalLogins: logs.filter(l => l.event_type === 'auth.login').length,
        failedLogins: logs.filter(l => l.event_type === 'auth.login_failed').length,
        newSignups: logs.filter(l => l.event_type === 'auth.signup').length,
        dataExports: logs.filter(l => l.event_type === 'data.export').length,
        accountDeletions: logs.filter(l => l.event_type === 'data.delete_account').length,
        adminActions: logs.filter(l => l.event_type.startsWith('admin.')).length,
      };

      return { success: true, summary };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================
  // Convenience methods for common events
  // ============================================

  static async logLogin(): Promise<void> {
    await this.log('auth.login', 'User logged in');
  }

  static async logLogout(): Promise<void> {
    await this.log('auth.logout', 'User logged out');
  }

  static async logLoginFailed(email: string, reason: string): Promise<void> {
    await this.log('auth.login_failed', `Login failed for ${email}: ${reason}`, {
      status: 'failure',
      metadata: { email, reason },
    });
  }

  static async logSignup(email: string): Promise<void> {
    await this.log('auth.signup', `New user registered: ${email}`, {
      metadata: { email },
    });
  }

  static async logPasswordChange(): Promise<void> {
    await this.log('auth.password_change', 'Password changed');
  }

  static async logDataExport(): Promise<void> {
    await this.log('data.export', 'User exported their data');
  }

  static async logAccountDeletion(): Promise<void> {
    await this.log('data.delete_account', 'User deleted their account');
  }

  static async logApiKeyCreate(keyPrefix: string): Promise<void> {
    await this.log('security.api_key_create', `API key created: ${keyPrefix}***`, {
      metadata: { keyPrefix },
    });
  }

  static async logApiKeyRevoke(keyPrefix: string): Promise<void> {
    await this.log('security.api_key_revoke', `API key revoked: ${keyPrefix}***`, {
      metadata: { keyPrefix },
    });
  }

  static async log2FAEnabled(): Promise<void> {
    await this.log('security.2fa_enable', 'Two-factor authentication enabled');
  }

  static async log2FADisabled(): Promise<void> {
    await this.log('security.2fa_disable', 'Two-factor authentication disabled');
  }

  static async logAdminUserDelete(deletedEmail: string): Promise<void> {
    await this.log('admin.user_delete', `Admin deleted user: ${deletedEmail}`, {
      metadata: { deletedEmail },
    });
  }

  static async logAdminCleanup(result: Record<string, unknown>): Promise<void> {
    await this.log('admin.cleanup_data', 'Admin ran data cleanup', {
      metadata: result,
    });
  }
}
