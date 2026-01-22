/*
  # Fix Supabase Security Issues

  Addresses 12 security warnings from Supabase dashboard:

  1. CRITICAL: Enable RLS on webhook_events table
  2. WARNING: Fix mutable search_path on 6 functions

  These fixes prevent:
  - Unauthorized access to webhook data
  - Search path injection attacks on functions
*/

-- ============================================
-- 1. ENABLE RLS ON WEBHOOK_EVENTS TABLE
-- ============================================

-- Enable RLS (will error if table doesn't exist, which is fine)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhook_events' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY';

    -- Drop existing policies if any
    DROP POLICY IF EXISTS "Service role only access webhook_events" ON public.webhook_events;

    -- Create restrictive policy - only service_role can access
    -- (Webhook events are internal, never accessed by clients)
    CREATE POLICY "Service role only access webhook_events"
      ON public.webhook_events
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);

    RAISE NOTICE 'RLS enabled on webhook_events table';
  ELSE
    RAISE NOTICE 'webhook_events table does not exist, skipping';
  END IF;
END $$;

-- ============================================
-- 2. FIX FUNCTION SEARCH PATHS
-- ============================================

-- Fix update_updated_at_column (trigger function)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix cleanup_sensitive_data
CREATE OR REPLACE FUNCTION public.cleanup_sensitive_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  deleted_fraud_checks integer;
  cleaned_users integer;
  result jsonb;
BEGIN
  -- Delete fraud_checks older than 90 days
  WITH deleted AS (
    DELETE FROM public.fraud_checks
    WHERE created_at < NOW() - INTERVAL '90 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_fraud_checks FROM deleted;

  -- Nullify ip_address and device_fingerprint from users older than 30 days
  WITH updated AS (
    UPDATE public.users
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

-- Fix log_audit_event
CREATE OR REPLACE FUNCTION public.log_audit_event(
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
SET search_path = ''
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
  INSERT INTO public.audit_logs (
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

-- Fix cleanup_old_audit_logs
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  deleted_count integer;
BEGIN
  WITH deleted AS (
    DELETE FROM public.audit_logs
    WHERE created_at < NOW() - INTERVAL '2 years'
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$;

-- Fix handle_new_user (if exists - may have been created in dashboard)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user' AND pronamespace = 'public'::regnamespace) THEN
    EXECUTE 'ALTER FUNCTION public.handle_new_user() SET search_path = ''''';
    RAISE NOTICE 'Fixed search_path for handle_new_user';
  ELSE
    RAISE NOTICE 'handle_new_user function does not exist, skipping';
  END IF;
END $$;

-- Fix handle_admin_enterprise (if exists - may have been created in dashboard)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_admin_enterprise' AND pronamespace = 'public'::regnamespace) THEN
    EXECUTE 'ALTER FUNCTION public.handle_admin_enterprise() SET search_path = ''''';
    RAISE NOTICE 'Fixed search_path for handle_admin_enterprise';
  ELSE
    RAISE NOTICE 'handle_admin_enterprise function does not exist, skipping';
  END IF;
END $$;

-- ============================================
-- 3. VERIFY PERMISSIONS ARE PRESERVED
-- ============================================

-- Ensure cleanup_sensitive_data is still service_role only
REVOKE ALL ON FUNCTION public.cleanup_sensitive_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_sensitive_data() TO service_role;

-- Ensure log_audit_event is accessible
GRANT EXECUTE ON FUNCTION public.log_audit_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_audit_event TO service_role;

-- Ensure cleanup_old_audit_logs is service_role only
REVOKE ALL ON FUNCTION public.cleanup_old_audit_logs() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_old_audit_logs() TO service_role;

-- ============================================
-- 4. DOCUMENTATION
-- ============================================

COMMENT ON FUNCTION public.update_updated_at_column() IS
'Trigger function to auto-update updated_at timestamp.
Security: INVOKER, search_path locked.';

COMMENT ON FUNCTION public.cleanup_sensitive_data() IS
'Removes sensitive PII data after retention period.
Security: DEFINER (service_role only), search_path locked.';

COMMENT ON FUNCTION public.log_audit_event IS
'Logs security audit events for compliance.
Security: DEFINER (authenticated + service_role), search_path locked.';

COMMENT ON FUNCTION public.cleanup_old_audit_logs() IS
'Removes audit logs older than 2 years.
Security: DEFINER (service_role only), search_path locked.';
