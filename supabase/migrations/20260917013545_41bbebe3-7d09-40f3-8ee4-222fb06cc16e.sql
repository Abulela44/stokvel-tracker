CREATE TABLE public.admin_verifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  id_document_path text NOT NULL,
  id_document_type text NOT NULL DEFAULT '',
  proof_of_account_path text NOT NULL,
  proof_of_account_type text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  review_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.admin_verifications TO authenticated;
GRANT ALL ON public.admin_verifications TO service_role;

ALTER TABLE public.admin_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own verification read" ON public.admin_verifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "own verification insert" ON public.admin_verifications
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE TRIGGER admin_verifications_updated_at
  BEFORE UPDATE ON public.admin_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "own user folder read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'stokvel-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "own user folder insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'stokvel-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "own user folder delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'stokvel-files' AND (storage.foldername(name))[1] = auth.uid()::text);