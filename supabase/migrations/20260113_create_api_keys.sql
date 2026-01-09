-- Create api_keys table for Enterprise API access
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  key_hash text NOT NULL,           -- SHA-256 hash (never store plaintext)
  key_prefix text NOT NULL,         -- First 12 chars for display (llm_sk_a1b2...)
  name text DEFAULT 'Default',      -- User-friendly name
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  revoked_at timestamptz,           -- NULL = active, set = revoked

  CONSTRAINT unique_key_hash UNIQUE (key_hash)
);

-- Index for fast key lookups (only active keys)
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash) WHERE revoked_at IS NULL;

-- Index for listing user's keys
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Users can view their own API keys
CREATE POLICY "Users can view own API keys"
  ON api_keys FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can create their own API keys
CREATE POLICY "Users can create own API keys"
  ON api_keys FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own API keys (for revocation)
CREATE POLICY "Users can update own API keys"
  ON api_keys FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Users can delete their own API keys
CREATE POLICY "Users can delete own API keys"
  ON api_keys FOR DELETE TO authenticated
  USING (user_id = auth.uid());
