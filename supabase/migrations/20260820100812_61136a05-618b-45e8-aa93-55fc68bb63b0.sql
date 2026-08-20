-- documents : masquer les liens internes aux comptes connectés (déjà masqués à anon)
REVOKE SELECT ON public.documents FROM authenticated;
GRANT SELECT (id, level, track, subject, section, term, exam_slot, title_ar, title_fr, subtitle_ar, subtitle_fr, video_url, sort_order, created_at) ON public.documents TO authenticated;

-- quiz_questions : réponses réservées aux comptes connectés
DROP POLICY IF EXISTS quiz_questions_read_all ON public.quiz_questions;
CREATE POLICY quiz_questions_read_authenticated ON public.quiz_questions
  FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.quiz_questions FROM anon;
GRANT SELECT ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;