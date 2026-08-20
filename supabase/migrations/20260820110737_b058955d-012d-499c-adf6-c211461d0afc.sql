-- Ensure raw file links stay private: never grant them to public API roles.
REVOKE SELECT (source_url, mirror_urls) ON public.documents FROM anon, authenticated;

-- Re-affirm the safe, public-facing columns only.
GRANT SELECT (
  id, level, track, subject, section, term, exam_slot,
  title_ar, title_fr, subtitle_ar, subtitle_fr,
  video_url, sort_order, created_at, updated_at
) ON public.documents TO anon, authenticated;

-- Replace the blanket public read policy with an explicit, documented one.
DROP POLICY IF EXISTS "documents public read" ON public.documents;
CREATE POLICY "documents public read (safe columns only)"
  ON public.documents FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT ALL ON public.documents TO service_role;