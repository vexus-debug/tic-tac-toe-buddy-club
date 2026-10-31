CREATE POLICY "staff read scan images" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'scan-images');
CREATE POLICY "staff upload scan images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'scan-images');
CREATE POLICY "staff update scan images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'scan-images');
CREATE POLICY "staff delete scan images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'scan-images');