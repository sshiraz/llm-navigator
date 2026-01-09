-- Migration: Add company logo URL field for branded PDF reports
-- Users on Professional and Enterprise plans can add their company logo

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS company_logo_url TEXT;

-- Add comment explaining the field
COMMENT ON COLUMN public.users.company_logo_url IS 'URL to company logo for branded PDF reports (Professional/Enterprise plans)';
