-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to company-logos folder
CREATE POLICY "Users can upload company logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assets' AND
  (storage.foldername(name))[1] = 'company-logos'
);

-- Allow public read access to company logos
CREATE POLICY "Public read access for company logos"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'assets' AND
  (storage.foldername(name))[1] = 'company-logos'
);

-- Allow users to update their own logos
CREATE POLICY "Users can update their own logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'assets' AND
  (storage.foldername(name))[1] = 'company-logos'
);

-- Allow users to delete their own logos
CREATE POLICY "Users can delete their own logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'assets' AND
  (storage.foldername(name))[1] = 'company-logos'
);
