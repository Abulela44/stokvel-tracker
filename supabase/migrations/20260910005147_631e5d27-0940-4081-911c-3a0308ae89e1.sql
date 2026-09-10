CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stokvel_id uuid NOT NULL REFERENCES public.stokvels(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  attachment_path text,
  author_name text NOT NULL DEFAULT 'Admin',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own announcements" ON public.announcements FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.stokvels s WHERE s.id = announcements.stokvel_id AND s.admin_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.stokvels s WHERE s.id = announcements.stokvel_id AND s.admin_id = auth.uid()));

CREATE TABLE public.announcement_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  stokvel_id uuid NOT NULL REFERENCES public.stokvels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (announcement_id, user_id, emoji)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcement_reactions TO authenticated;
GRANT ALL ON public.announcement_reactions TO service_role;
ALTER TABLE public.announcement_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reactions" ON public.announcement_reactions FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.stokvels s WHERE s.id = announcement_reactions.stokvel_id AND s.admin_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.stokvels s WHERE s.id = announcement_reactions.stokvel_id AND s.admin_id = auth.uid()));

CREATE TABLE public.payment_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stokvel_id uuid NOT NULL REFERENCES public.stokvels(id) ON DELETE CASCADE,
  member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  file_path text NOT NULL,
  file_type text NOT NULL DEFAULT '',
  amount integer,
  description text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_proofs TO authenticated;
GRANT ALL ON public.payment_proofs TO service_role;
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own proofs" ON public.payment_proofs FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.stokvels s WHERE s.id = payment_proofs.stokvel_id AND s.admin_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.stokvels s WHERE s.id = payment_proofs.stokvel_id AND s.admin_id = auth.uid()));

CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stokvel_id uuid NOT NULL REFERENCES public.stokvels(id) ON DELETE CASCADE,
  name text NOT NULL,
  doc_type text NOT NULL DEFAULT 'other',
  file_path text NOT NULL,
  file_type text NOT NULL DEFAULT '',
  uploaded_by text NOT NULL DEFAULT 'Admin',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own documents" ON public.documents FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.stokvels s WHERE s.id = documents.stokvel_id AND s.admin_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.stokvels s WHERE s.id = documents.stokvel_id AND s.admin_id = auth.uid()));

CREATE TABLE public.activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stokvel_id uuid NOT NULL REFERENCES public.stokvels(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity TO authenticated;
GRANT ALL ON public.activity TO service_role;
ALTER TABLE public.activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own activity" ON public.activity FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.stokvels s WHERE s.id = activity.stokvel_id AND s.admin_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.stokvels s WHERE s.id = activity.stokvel_id AND s.admin_id = auth.uid()));

CREATE INDEX announcements_stokvel_idx ON public.announcements(stokvel_id, created_at DESC);
CREATE INDEX reactions_ann_idx ON public.announcement_reactions(announcement_id);
CREATE INDEX proofs_stokvel_idx ON public.payment_proofs(stokvel_id, created_at DESC);
CREATE INDEX documents_stokvel_idx ON public.documents(stokvel_id, created_at DESC);
CREATE INDEX activity_stokvel_idx ON public.activity(stokvel_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER announcements_updated_at BEFORE UPDATE ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER proofs_updated_at BEFORE UPDATE ON public.payment_proofs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();