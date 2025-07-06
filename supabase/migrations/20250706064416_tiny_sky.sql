/*
  # Add model support for multiple AI providers

  1. Changes
    - Update analysis_provider enum to include 'perplexity'
    - Add model_name column to analyses table
    - Add model_name column to api_usage table
*/

-- Update analysis_provider enum to include 'perplexity'
ALTER TYPE analysis_provider ADD VALUE IF NOT EXISTS 'perplexity';

-- Add model_name column to analyses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'analyses' AND column_name = 'model_name'
  ) THEN
    ALTER TABLE analyses ADD COLUMN model_name text;
  END IF;
END $$;

-- Add model_name column to api_usage table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_usage' AND column_name = 'model_name'
  ) THEN
    ALTER TABLE api_usage ADD COLUMN model_name text;
  END IF;
END $$;

-- Add index for model_name on analyses table
CREATE INDEX IF NOT EXISTS idx_analyses_model_name ON analyses(model_name);

-- Add index for model_name on api_usage table
CREATE INDEX IF NOT EXISTS idx_api_usage_model_name ON api_usage(model_name);

-- Update cost_info schema in analyses table to include model information
COMMENT ON COLUMN analyses.cost_info IS 'JSON object containing cost information including model details';

-- Update tokens schema in api_usage table to include model-specific token counts
COMMENT ON COLUMN api_usage.tokens IS 'JSON object containing token usage information for different models';