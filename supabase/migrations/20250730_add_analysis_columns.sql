/*
  # Add model and crawl_data columns to analyses table

  1. Changes
    - Add model column to track which AI model was used
    - Add crawl_data column for storing page crawl results
    - Make project_id optional (not all analyses need a project)
    - Add index on user_id + created_at for faster dashboard queries

  2. Notes
    - crawl_data stores the full page analysis including headings, schema, issues
    - This enables the "Page Crawl Results" feature in the UI
*/

-- Add model column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'analyses' AND column_name = 'model'
  ) THEN
    ALTER TABLE analyses ADD COLUMN model text;
  END IF;
END $$;

-- Add crawl_data column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'analyses' AND column_name = 'crawl_data'
  ) THEN
    ALTER TABLE analyses ADD COLUMN crawl_data jsonb;
  END IF;
END $$;

-- Make project_id nullable (not all analyses need a project)
ALTER TABLE analyses ALTER COLUMN project_id DROP NOT NULL;

-- Add composite index for dashboard queries (user's recent analyses)
CREATE INDEX IF NOT EXISTS idx_analyses_user_created
  ON analyses(user_id, created_at DESC);

-- Add index on website for finding existing analyses
CREATE INDEX IF NOT EXISTS idx_analyses_website
  ON analyses(website);
