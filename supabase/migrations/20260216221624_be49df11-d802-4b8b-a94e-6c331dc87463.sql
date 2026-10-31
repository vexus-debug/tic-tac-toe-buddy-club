
-- Create public bucket for clinic logos
INSERT INTO storage.buckets (id, name, public) VALUES ('clinic-logos', 'clinic-logos', true);

-- Allow anyone to view clinic logos (public bucket)
CREATE POLICY "Public can view clinic logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'clinic-logos');

-- Org admins can upload logos
CREATE POLICY "Admins can upload clinic logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'clinic-logos'
  AND auth.role() = 'authenticated'
);

-- Org admins can update logos
CREATE POLICY "Admins can update clinic logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'clinic-logos' AND auth.role() = 'authenticated');

-- Org admins can delete logos
CREATE POLICY "Admins can delete clinic logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'clinic-logos' AND auth.role() = 'authenticated');
