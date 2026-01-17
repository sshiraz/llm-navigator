/*
  # Security Fixes - Data Protection

  1. Fix fraud_checks RLS leak
     - Remove permissive SELECT policy (was exposing all users' IPs/emails)
     - Keep INSERT for signup process
     - Only service role can read fraud data

  2. Data retention cleanup function
     - Auto-delete fraud_checks older than 90 days
     - Nullify ip_address/device_fingerprint from users after 30 days
     - Can be called manually or via cron job
*/

-- ============================================
-- 1. FIX FRAUD_CHECKS RLS LEAK
-- ============================================

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Allow fraud check reading for verification" ON fraud_checks;

-- Drop existing restrictive policy if it exists (idempotent)
DROP POLICY IF EXISTS "Only service role can read fraud checks" ON fraud_checks;

-- Create a restrictive policy - only service role can read
-- (No client-side SELECT needed - fraud checks are server-side only)
CREATE POLICY "Only service role can read fraud checks"
  ON fraud_checks
  FOR SELECT
  TO service_role
  USING (true);

-- ============================================
-- 2. DATA RETENTION CLEANUP FUNCTION
-- ============================================

-- Function to clean up sensitive data
CREATE OR REPLACE FUNCTION cleanup_sensitive_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_fraud_checks integer;
  cleaned_users integer;
  result jsonb;
BEGIN
  -- Delete fraud_checks older than 90 days
  WITH deleted AS (
    DELETE FROM fraud_checks
    WHERE created_at < NOW() - INTERVAL '90 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_fraud_checks FROM deleted;

  -- Nullify ip_address and device_fingerprint from users older than 30 days
  -- (Keep for recent users for fraud detection during trial period)
  WITH updated AS (
    UPDATE users
    SET
      ip_address = NULL,
      device_fingerprint = NULL
    WHERE
      created_at < NOW() - INTERVAL '30 days'
      AND (ip_address IS NOT NULL OR device_fingerprint IS NOT NULL)
    RETURNING id
  )
  SELECT COUNT(*) INTO cleaned_users FROM updated;

  -- Build result
  result := jsonb_build_object(
    'deleted_fraud_checks', deleted_fraud_checks,
    'cleaned_users', cleaned_users,
    'executed_at', NOW()
  );

  RETURN result;
END;
$$;

-- Grant execute to service role only
REVOKE ALL ON FUNCTION cleanup_sensitive_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cleanup_sensitive_data() TO service_role;

-- ============================================
-- 3. ADD COMMENT FOR DOCUMENTATION
-- ============================================

COMMENT ON FUNCTION cleanup_sensitive_data() IS
'Removes sensitive PII data after retention period:
- Deletes fraud_checks older than 90 days
- Nullifies ip_address/device_fingerprint from users after 30 days
Run periodically via cron or manually from admin dashboard.';

COMMENT ON TABLE fraud_checks IS
'Fraud detection data for trial abuse prevention.
Data is auto-deleted after 90 days via cleanup_sensitive_data().
RLS: INSERT allowed for signup, SELECT restricted to service_role only.';
