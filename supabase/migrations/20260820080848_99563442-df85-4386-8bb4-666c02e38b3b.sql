ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS mirror_urls text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.tutor_messages ADD COLUMN IF NOT EXISTS model text;