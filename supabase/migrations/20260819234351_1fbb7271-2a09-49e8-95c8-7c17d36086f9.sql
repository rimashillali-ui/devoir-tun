CREATE TABLE public.tutor_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL,
  subject text,
  title text NOT NULL,
  file_name text,
  content text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutor_documents TO authenticated;
GRANT ALL ON public.tutor_documents TO service_role;

ALTER TABLE public.tutor_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read enabled tutor documents"
ON public.tutor_documents FOR SELECT TO authenticated
USING (enabled OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert tutor documents"
ON public.tutor_documents FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tutor documents"
ON public.tutor_documents FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete tutor documents"
ON public.tutor_documents FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_tutor_documents_level ON public.tutor_documents (level, enabled);

CREATE TRIGGER update_tutor_documents_updated_at
BEFORE UPDATE ON public.tutor_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();