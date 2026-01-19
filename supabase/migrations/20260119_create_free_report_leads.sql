-- Create free_report_leads table for storing free report requests and rate limiting
CREATE TABLE IF NOT EXISTS free_report_leads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text NOT NULL,
  website text NOT NULL,
  is_cited boolean DEFAULT false,
  ai_score integer,
  citation_rate numeric,
  industry text,
  competitor_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_free_report_leads_email_created
  ON free_report_leads(email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_free_report_leads_website_created
  ON free_report_leads(website, created_at DESC);

-- Enable RLS
ALTER TABLE free_report_leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert (save leads)
CREATE POLICY "Anyone can insert free report leads"
  ON free_report_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anonymous users to select for rate limiting checks
CREATE POLICY "Anyone can select free report leads for rate limiting"
  ON free_report_leads FOR SELECT
  TO anon, authenticated
  USING (true);

-- Comment
COMMENT ON TABLE free_report_leads IS 'Stores free report leads for marketing and rate limiting';
