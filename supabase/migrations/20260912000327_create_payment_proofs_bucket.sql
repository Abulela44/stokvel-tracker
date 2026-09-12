/*
# Create payment-proofs public storage bucket

1. Storage
- Create a new public storage bucket called `payment-proofs`.
- Public read access so proof files can be viewed via public URLs.
- Authenticated users can upload/update/delete only within their own stokvel folder.
2. Security
- RLS policies on storage.objects scoped to the `payment-proofs` bucket.
- SELECT: anyone can read (public bucket) — needed so public URLs work.
- INSERT: authenticated users can upload only to a path starting with their stokvel ID.
- UPDATE/DELETE: same stokvel ownership check.
- The stokvel ownership check uses: EXISTS (SELECT 1 FROM public.stokvels s WHERE s.admin_id = auth.uid() AND s.id::text = (storage.foldername(name))[1]).
3. Notes
- The bucket is public so that getPublicUrl returns a URL that works without signed URL overhead.
- Upload paths follow the pattern: {stokvel_id}/proofs/{timestamp}-{filename}.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "payment proofs read" ON storage.objects;
CREATE POLICY "payment proofs read" ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'payment-proofs');

DROP POLICY IF EXISTS "payment proofs insert" ON storage.objects;
CREATE POLICY "payment proofs insert" ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND EXISTS (
    SELECT 1 FROM public.stokvels s
    WHERE s.admin_id = auth.uid()
    AND s.id::text = (storage.foldername(name))[1]
  )
);

DROP POLICY IF EXISTS "payment proofs update" ON storage.objects;
CREATE POLICY "payment proofs update" ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND EXISTS (
    SELECT 1 FROM public.stokvels s
    WHERE s.admin_id = auth.uid()
    AND s.id::text = (storage.foldername(name))[1]
  )
);

DROP POLICY IF EXISTS "payment proofs delete" ON storage.objects;
CREATE POLICY "payment proofs delete" ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND EXISTS (
    SELECT 1 FROM public.stokvels s
    WHERE s.admin_id = auth.uid()
    AND s.id::text = (storage.foldername(name))[1]
  )
);