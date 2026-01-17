/*
  # Security Audit Logging System

  Creates a comprehensive audit logging table to track:
  - User authentication events (login, logout, failed attempts)
  - Admin actions (user management, data cleanup)
  - Data access events (exports, deletions)
  - Security events (password changes, 2FA changes)

  This supports compliance requirements (GDPR, SOC2) by maintaining
  an immutable record of security-relevant events.
*/

-- ============================================
-- 1. CREATE AUDIT_LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Who performed the action
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  user_email text,  -- Denormalized for when user is deleted

  -- What happened
  event_type text NOT NULL,
  event_category text NOT NULL,
  description text NOT NULL,

  -- Additional context
  metadata jsonb DEFAULT '{}',

  -- Where it happened from
  ip_address inet,
  user_agent text,

  -- Outcome
  status text NOT NULL DEFAULT 'success',  -- success, failure, warning
  error_message text,

  -- When
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

-- Fast lookups by user
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- Fast lookups by event type
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);

-- Fast lookups by category
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(event_category);

-- Time-based queries (most recent first)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Composite index for admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_category_created ON audit_logs(event_category, created_at DESC);

-- ============================================
-- 3. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Admins can read audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Service role can insert audit logs" ON audit_logs;

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Service role can insert (for edge functions)
CREATE POLICY "Service role can insert audit logs"
  ON audit_logs
  FOR INSERT
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can insert their own events via RPC
-- (We'll use a function for this to ensure proper data)

-- ============================================
-- 4. LOGGING FUNCTION
-- ============================================

-- Function to log an audit event (callable from client or edge function)
CREATE OR REPLACE FUNCTION log_audit_event(
  p_event_type text,
  p_event_category text,
  p_description text,
  p_metadata jsonb DEFAULT '{}',
  p_status text DEFAULT 'success',
  p_error_message text DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_user_email text;
  v_log_id uuid;
BEGIN
  -- Get current user info
  v_user_id := auth.uid();

  IF v_user_id IS NOT NULL THEN
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = v_user_id;
  END IF;

  -- Insert the log entry
  INSERT INTO audit_logs (
    user_id,
    user_email,
    event_type,
    event_category,
    description,
    metadata,
    status,
    error_message,
    ip_address,
    user_agent
  ) VALUES (
    v_user_id,
    v_user_email,
    p_event_type,
    p_event_category,
    p_description,
    p_metadata,
    p_status,
    p_error_message,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION log_audit_event TO authenticated;
GRANT EXECUTE ON FUNCTION log_audit_event TO service_role;

-- ============================================
-- 5. EVENT CATEGORIES AND TYPES
-- ============================================

COMMENT ON TABLE audit_logs IS
'Security audit log for compliance tracking.

Event Categories:
- auth: Authentication events
- admin: Admin actions
- data: Data access/modification
- security: Security settings changes
- billing: Payment/subscription changes

Event Types:
- auth.login: User logged in
- auth.logout: User logged out
- auth.login_failed: Failed login attempt
- auth.signup: New user registration
- auth.password_change: Password changed
- auth.password_reset: Password reset requested
- admin.user_delete: Admin deleted a user
- admin.user_update: Admin updated user settings
- admin.cleanup_data: Admin ran data cleanup
- data.export: User exported their data
- data.delete_account: User deleted their account
- security.2fa_enable: 2FA enabled
- security.2fa_disable: 2FA disabled
- security.api_key_create: API key created
- security.api_key_revoke: API key revoked
- billing.subscription_create: Subscription created
- billing.subscription_cancel: Subscription cancelled
- billing.payment_success: Payment succeeded
- billing.payment_failed: Payment failed';

-- ============================================
-- 6. CLEANUP FUNCTION (OPTIONAL)
-- ============================================

-- Function to clean old audit logs (keep last 2 years for compliance)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  WITH deleted AS (
    DELETE FROM audit_logs
    WHERE created_at < NOW() - INTERVAL '2 years'
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$;

-- Only service role can clean up logs
REVOKE ALL ON FUNCTION cleanup_old_audit_logs() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cleanup_old_audit_logs() TO service_role;
