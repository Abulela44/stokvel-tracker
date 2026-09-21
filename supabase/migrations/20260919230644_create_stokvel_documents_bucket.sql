/*
# Create stokvel-documents private storage bucket and update documents table

1. Storage
- Create a new PRIVATE storage bucket called `stokvel-documents`.
- Private bucket: no public read access. Files are only accessible via signed URLs.
- RLS policies on storage.objects scoped to the `stokvel-documents` bucket:
  - SELECT: authenticated users who are the admin of the stokvel that owns the folder.
  - INSERT: authenticated users who are the admin of the stokvel matching the upload path prefix.
  - UPDATE/DELETE: same stokvel ownership check.
- Upload paths follow: {stokvel_id}/documents/{timestamp}-{filename}

2. Documents table changes
- Add `file_size` column (bigint, nullable) — stores file size in bytes.
- Add `category` column (text, not null, default 'other') — stores document category.
- Add `storage_path` column (text, nullable) — stores the storage path (replaces file_path going forward, but file_path is kept for backwards compatibility).
- Add `uploaded_by_user_id` column (uuid, nullable, default auth.uid()) — links to the uploading user.

3. Security
- Storage RLS: only the stokvel admin (matching admin_id = auth.uid()) can read/write/delete files in their stokvel's folder.
- Documents table RLS: SELECT/INSERT/UPDATE/DELETE scoped to stokvel admin ownership.
- Signed URLs (10-minute expiry) are the only way to access file content.
*/

-- Create private storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('stokvel-documents', 'stokvel-documents', false, 15728640)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for stokvel-documents bucket
DROP POLICY IF EXISTS "stokvel docs read" ON storage.objects;
CREATE POLICY "stokvel docs read" ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'stokvel-documents'
  AND EXISTS (
    SELECT 1 FROM public.stokvels s
    WHERE s.admin_id = auth.uid()
    AND s.id::text = (storage.foldername(name))[1]
  )
);

DROP POLICY IF EXISTS "stokvel docs insert" ON storage.objects;
CREATE POLICY "stokvel docs insert" ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'stokvel-documents'
  AND EXISTS (
    SELECT 1 FROM public.stokvels s
    WHERE s.admin_id = auth.uid()
    AND s.id::text = (storage.foldername(name))[1]
  )
);

DROP POLICY IF EXISTS "stokvel docs update" ON storage.objects;
CREATE POLICY "stokvel docs update" ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'stokvel-documents'
  AND EXISTS (
    SELECT 1 FROM public.stokvels s
    WHERE s.admin_id = auth.uid()
    AND s.id::text = (storage.foldername(name))[1]
  )
);

DROP POLICY IF EXISTS "stokvel docs delete" ON storage.objects;
CREATE POLICY "stokvel docs delete" ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'stokvel-documents'
  AND EXISTS (
    SELECT 1 FROM public.stokvels s
    WHERE s.admin_id = auth.uid()
    AND s.id::text = (storage.foldername(name))[1]
  )
);

-- Add new columns to documents table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'file_size') THEN
    ALTER TABLE public.documents ADD COLUMN file_size bigint;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'category') THEN
    ALTER TABLE public.documents ADD COLUMN category text NOT NULL DEFAULT 'other';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'storage_path') THEN
    ALTER TABLE public.documents ADD COLUMN storage_path text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'uploaded_by_user_id') THEN
    ALTER TABLE public.documents ADD COLUMN uploaded_by_user_id uuid DEFAULT auth.uid();
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS documents_stokvel_id_idx ON public.documents (stokvel_id);
CREATE INDEX IF NOT EXISTS documents_created_at_idx ON public.documents (created_at DESC);

-- Ensure RLS is enabled (it should already be, but just in case)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Refresh documents RLS policies (drop and recreate for safety)
DROP POLICY IF EXISTS "select_own_documents" ON public.documents;
CREATE POLICY "select_own_documents" ON public.documents FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.stokvels s
    WHERE s.id = documents.stokvel_id
    AND s.admin_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "insert_own_documents" ON public.documents;
CREATE POLICY "insert_own_documents" ON public.documents FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stokvels s
    WHERE s.id = documents.stokvel_id
    AND s.admin_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "update_own_documents" ON public.documents;
CREATE POLICY "update_own_documents" ON public.documents FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.stokvels s
    WHERE s.id = documents.stokvel_id
    AND s.admin_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stokvels s
    WHERE s.id = documents.stokvel_id
    AND s.admin_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "delete_own_documents" ON public.documents;
CREATE POLICY "delete_own_documents" ON public.documents FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.stokvels s
    WHERE s.id = documents.stokvel_id
    AND s.admin_id = auth.uid()
  )
);
