/*
  # Add payments table for Stripe integration

  1. New Tables
    - `payments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `stripe_payment_intent_id` (text, unique)
      - `stripe_subscription_id` (text, nullable)
      - `plan` (text)
      - `amount` (integer, amount in cents)
      - `currency` (text)
      - `status` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `payments` table
    - Add policy for users to read their own payments
*/

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_intent_id text UNIQUE,
  stripe_subscription_id text,
  plan text NOT NULL,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage payments"
  ON payments
  FOR ALL
  TO service_role
  USING (true);