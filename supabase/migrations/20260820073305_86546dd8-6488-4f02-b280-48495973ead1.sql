CREATE TABLE public.tutor_prompts (
  level text PRIMARY KEY,
  prompt text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tutor_prompts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutor_prompts TO authenticated;
GRANT ALL ON public.tutor_prompts TO service_role;
ALTER TABLE public.tutor_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tutor_prompts public read" ON public.tutor_prompts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "tutor_prompts admin write" ON public.tutor_prompts FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.tutor_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  level text NOT NULL,
  title text NOT NULL DEFAULT 'Nouvelle discussion',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutor_conversations TO authenticated;
GRANT ALL ON public.tutor_conversations TO service_role;
ALTER TABLE public.tutor_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversations own" ON public.tutor_conversations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX tutor_conversations_user_idx ON public.tutor_conversations (user_id, updated_at DESC);

CREATE TABLE public.tutor_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.tutor_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL,
  content text NOT NULL DEFAULT '',
  image_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutor_messages TO authenticated;
GRANT ALL ON public.tutor_messages TO service_role;
ALTER TABLE public.tutor_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages own" ON public.tutor_messages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX tutor_messages_conv_idx ON public.tutor_messages (conversation_id, created_at);

INSERT INTO public.tutor_prompts (level, prompt) VALUES
('9eme', 'L''élève est en 9ème année de base : utilise des bases simples, un vocabulaire accessible et des exemples concrets.'),
('1sec', 'L''élève est en 1ère année secondaire : consolide les bases du collège et introduit progressivement le raisonnement scientifique.'),
('2sc', 'L''élève est en 2ème année secondaire : insiste sur la rigueur des démonstrations et les méthodes de résolution.'),
('3eme', 'L''élève est en 3ème année secondaire : prépare le terrain du Bac avec des exercices structurés et de la méthodologie.'),
('bac', 'L''élève prépare le Baccalauréat : exige la rigueur scientifique et la méthodologie de l''examen national.');