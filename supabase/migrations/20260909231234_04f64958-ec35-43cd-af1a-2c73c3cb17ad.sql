CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  phone TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE TABLE public.stokvels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  name TEXT NOT NULL,
  monthly_contribution INTEGER NOT NULL DEFAULT 200,
  meeting_day INTEGER NOT NULL DEFAULT 25,
  admin_phone TEXT NOT NULL DEFAULT '',
  tier TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stokvels TO authenticated;
GRANT ALL ON public.stokvels TO service_role;
ALTER TABLE public.stokvels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own stokvels" ON public.stokvels FOR ALL TO authenticated USING (admin_id = auth.uid()) WITH CHECK (admin_id = auth.uid());

CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stokvel_id UUID NOT NULL REFERENCES public.stokvels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX members_stokvel_idx ON public.members(stokvel_id, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.members TO authenticated;
GRANT ALL ON public.members TO service_role;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own members" ON public.members FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stokvels s WHERE s.id = members.stokvel_id AND s.admin_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.stokvels s WHERE s.id = members.stokvel_id AND s.admin_id = auth.uid()));

CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stokvel_id UUID NOT NULL REFERENCES public.stokvels(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (member_id, year, month)
);
CREATE INDEX payments_stokvel_year_idx ON public.payments(stokvel_id, year);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own payments" ON public.payments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stokvels s WHERE s.id = payments.stokvel_id AND s.admin_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.stokvels s WHERE s.id = payments.stokvel_id AND s.admin_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();