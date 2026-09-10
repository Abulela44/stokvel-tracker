CREATE POLICY "stokvel files read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'stokvel-files' AND EXISTS (
  SELECT 1 FROM public.stokvels s WHERE s.admin_id = auth.uid() AND s.id::text = (storage.foldername(name))[1]
));
CREATE POLICY "stokvel files insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'stokvel-files' AND EXISTS (
  SELECT 1 FROM public.stokvels s WHERE s.admin_id = auth.uid() AND s.id::text = (storage.foldername(name))[1]
));
CREATE POLICY "stokvel files update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'stokvel-files' AND EXISTS (
  SELECT 1 FROM public.stokvels s WHERE s.admin_id = auth.uid() AND s.id::text = (storage.foldername(name))[1]
));
CREATE POLICY "stokvel files delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'stokvel-files' AND EXISTS (
  SELECT 1 FROM public.stokvels s WHERE s.admin_id = auth.uid() AND s.id::text = (storage.foldername(name))[1]
));