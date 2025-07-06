/*
  # Add GPT-4 Professional Model

  1. Changes
    - Add model_variants table to track different AI model variants
    - Add initial model variants including GPT-4 Professional
    - Update analyses table to reference model variants
*/

-- Create model_variants table if it doesn't exist
CREATE TABLE IF NOT EXISTS model_variants (
  id text PRIMARY KEY,
  name text NOT NULL,
  provider text NOT NULL,
  tier text NOT NULL,
  input_cost numeric NOT NULL,
  output_cost numeric NOT NULL,
  embedding_cost numeric NOT NULL,
  capabilities jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on model_variants
ALTER TABLE model_variants ENABLE ROW LEVEL SECURITY;

-- Create policy for reading model variants
CREATE POLICY "Anyone can read model variants"
  ON model_variants
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Insert initial model variants
INSERT INTO model_variants (id, name, provider, tier, input_cost, output_cost, embedding_cost, capabilities)
VALUES
  ('gpt-4', 'GPT-4', 'openai', 'starter', 0.03, 0.06, 0.0001, '{"webCrawling": true, "structuredOutput": true, "semanticAnalysis": true}'),
  ('gpt-4-professional', 'GPT-4 Professional', 'openai', 'professional', 0.04, 0.08, 0.0001, '{"webCrawling": true, "structuredOutput": true, "semanticAnalysis": true, "enhancedRecommendations": true}'),
  ('claude-3-haiku', 'Claude 3 Haiku', 'anthropic', 'starter', 0.00025, 0.00125, 0.0001, '{"webCrawling": true, "structuredOutput": true, "semanticAnalysis": true}'),
  ('claude-3-sonnet', 'Claude 3 Sonnet', 'anthropic', 'professional', 0.003, 0.015, 0.0001, '{"webCrawling": true, "structuredOutput": true, "semanticAnalysis": true}'),
  ('claude-3-opus', 'Claude 3 Opus', 'anthropic', 'enterprise', 0.015, 0.075, 0.0001, '{"webCrawling": true, "structuredOutput": true, "semanticAnalysis": true}'),
  ('perplexity-online', 'Perplexity Online', 'perplexity', 'professional', 0.002, 0.01, 0.0001, '{"webCrawling": true, "structuredOutput": false, "semanticAnalysis": true}'),
  ('perplexity-offline', 'Perplexity Offline', 'perplexity', 'starter', 0.001, 0.005, 0.0001, '{"webCrawling": false, "structuredOutput": false, "semanticAnalysis": true}')
ON CONFLICT (id) DO UPDATE
SET 
  name = EXCLUDED.name,
  provider = EXCLUDED.provider,
  tier = EXCLUDED.tier,
  input_cost = EXCLUDED.input_cost,
  output_cost = EXCLUDED.output_cost,
  embedding_cost = EXCLUDED.embedding_cost,
  capabilities = EXCLUDED.capabilities;

-- Add model_variant_id column to analyses table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'analyses' AND column_name = 'model_variant_id'
  ) THEN
    ALTER TABLE analyses ADD COLUMN model_variant_id text REFERENCES model_variants(id);
  END IF;
END $$;

-- Add model_variant_id column to api_usage table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_usage' AND column_name = 'model_variant_id'
  ) THEN
    ALTER TABLE api_usage ADD COLUMN model_variant_id text REFERENCES model_variants(id);
  END IF;
END $$;

-- Create indexes for model_variant_id
CREATE INDEX IF NOT EXISTS idx_analyses_model_variant_id ON analyses(model_variant_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_model_variant_id ON api_usage(model_variant_id);