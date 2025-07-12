/*
  # Add subscription fields to users table

  1. Changes
    - Add subscription_id (text) to users table
    - Add subscription_status (text) to users table
    - Add plan (text) to users table for explicit plan tracking
*/

-- Add subscription_id column to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'subscription_id'
  ) THEN
    ALTER TABLE users ADD COLUMN subscription_id text;
  END IF;
END $$;

-- Add subscription_status column to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE users ADD COLUMN subscription_status text DEFAULT 'free';
  END IF;
END $$;

-- Add plan column to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'plan'
  ) THEN
    ALTER TABLE users ADD COLUMN plan text DEFAULT 'free';
  END IF;
END $$;

-- Create indexes for subscription fields
CREATE INDEX IF NOT EXISTS idx_users_subscription_id ON users(subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan); 