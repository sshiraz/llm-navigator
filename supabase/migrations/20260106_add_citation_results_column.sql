/*
  # Add citation_results column to analyses table

  The citation_results field contains detailed AI response data including:
  - Which AI providers cited the website
  - Context snippets from AI responses
  - Competitor citations

  This enables the Citation Results and Competitor Strategy features
  to persist across user sessions.
*/

-- Add citation_results column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'analyses' AND column_name = 'citation_results'
  ) THEN
    ALTER TABLE analyses ADD COLUMN citation_results jsonb;
  END IF;
END $$;

-- Add overall_citation_rate column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'analyses' AND column_name = 'overall_citation_rate'
  ) THEN
    ALTER TABLE analyses ADD COLUMN overall_citation_rate integer;
  END IF;
END $$;

-- Add index for queries that filter by citation rate
CREATE INDEX IF NOT EXISTS idx_analyses_citation_rate
  ON analyses(overall_citation_rate DESC);
