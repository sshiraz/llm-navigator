/*
  # Add Live Mode Support for Webhooks

  1. Changes
    - Add live_mode column to payments table
    - Add webhook_event_id column to payments table for idempotency
    - Add additional logging for live mode payments
*/

-- Add live_mode column to payments table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'live_mode'
  ) THEN
    ALTER TABLE payments ADD COLUMN live_mode boolean DEFAULT false;
  END IF;
END $$;

-- Add webhook_event_id column to payments table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'webhook_event_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN webhook_event_id text;
  END IF;
END $$;

-- Create index on webhook_event_id for idempotency checks
CREATE INDEX IF NOT EXISTS idx_payments_webhook_event_id ON payments(webhook_event_id);

-- Create payment_logs table for detailed payment logging
CREATE TABLE IF NOT EXISTS payment_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type text NOT NULL,
  event_id text,
  payment_intent_id text,
  subscription_id text,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  amount integer,
  currency text,
  status text NOT NULL,
  live_mode boolean DEFAULT false,
  metadata jsonb,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create index on payment_logs
CREATE INDEX IF NOT EXISTS idx_payment_logs_event_id ON payment_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_payment_intent_id ON payment_logs(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_user_id ON payment_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at DESC);

-- Enable RLS on payment_logs
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_logs
CREATE POLICY "Users can read own payment logs"
  ON payment_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage payment logs"
  ON payment_logs
  FOR ALL
  TO service_role
  USING (true);