ALTER TABLE public.tutor_prompts ADD COLUMN IF NOT EXISTS track text NOT NULL DEFAULT '';
ALTER TABLE public.tutor_prompts DROP CONSTRAINT IF EXISTS tutor_prompts_pkey;
ALTER TABLE public.tutor_prompts ADD PRIMARY KEY (level, subject, track);
ALTER TABLE public.tutor_documents ADD COLUMN IF NOT EXISTS track text;