/*
  # Initial Schema for LLM Navigator

  1. New Tables
    - `users` - User accounts and subscription information
    - `projects` - User projects for tracking websites
    - `competitors` - Competitor websites for each project
    - `analyses` - Website analysis results and metrics
    - `api_usage` - API cost tracking and usage monitoring
    - `fraud_checks` - Trial fraud prevention data

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Add policies for public signup and fraud checking

  3. Indexes
    - Add performance indexes for common queries
    - Add unique constraints where needed
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE subscription_type AS ENUM ('free', 'trial', 'starter', 'professional', 'enterprise');
CREATE TYPE analysis_provider AS ENUM ('openai', 'anthropic', 'local');

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  avatar_url text,
  subscription subscription_type DEFAULT 'free',
  trial_ends_at timestamptz,
  device_fingerprint text,
  ip_address text,
  payment_method_added boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  website text NOT NULL,
  description text,
  keywords text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Competitors table
CREATE TABLE IF NOT EXISTS competitors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  website text NOT NULL,
  added_at timestamptz DEFAULT now()
);

-- Analyses table
CREATE TABLE IF NOT EXISTS analyses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  website text NOT NULL,
  keywords text[] NOT NULL,
  score integer NOT NULL CHECK (score >= 0 AND score <= 100),
  metrics jsonb NOT NULL,
  insights text NOT NULL,
  predicted_rank integer NOT NULL CHECK (predicted_rank > 0),
  category text NOT NULL,
  recommendations jsonb DEFAULT '[]',
  is_simulated boolean DEFAULT true,
  cost_info jsonb,
  created_at timestamptz DEFAULT now()
);

-- API Usage table
CREATE TABLE IF NOT EXISTS api_usage (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  analysis_id uuid REFERENCES analyses(id) ON DELETE CASCADE,
  timestamp timestamptz DEFAULT now(),
  costs jsonb NOT NULL,
  tokens jsonb NOT NULL,
  provider analysis_provider NOT NULL,
  success boolean DEFAULT true,
  error_code text
);

-- Fraud Checks table
CREATE TABLE IF NOT EXISTS fraud_checks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text NOT NULL,
  normalized_email text NOT NULL,
  device_fingerprint text NOT NULL,
  ip_address text NOT NULL,
  risk_score integer NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  is_allowed boolean NOT NULL,
  reason text,
  checks jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription ON users(subscription);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_competitors_project_id ON competitors(project_id);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_project_id ON analyses(project_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_timestamp ON api_usage(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_fraud_checks_email ON fraud_checks(normalized_email);
CREATE INDEX IF NOT EXISTS idx_fraud_checks_device ON fraud_checks(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_fraud_checks_ip ON fraud_checks(ip_address);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_checks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for projects table
CREATE POLICY "Users can read own projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for competitors table
CREATE POLICY "Users can read competitors for own projects"
  ON competitors
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create competitors for own projects"
  ON competitors
  FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update competitors for own projects"
  ON competitors
  FOR UPDATE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete competitors for own projects"
  ON competitors
  FOR DELETE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for analyses table
CREATE POLICY "Users can read own analyses"
  ON analyses
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own analyses"
  ON analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for api_usage table
CREATE POLICY "Users can read own API usage"
  ON api_usage
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own API usage records"
  ON api_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for fraud_checks table (more permissive for signup process)
CREATE POLICY "Allow fraud check creation"
  ON fraud_checks
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow fraud check reading for verification"
  ON fraud_checks
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();