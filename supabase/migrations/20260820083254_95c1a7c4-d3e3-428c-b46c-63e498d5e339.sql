DROP POLICY IF EXISTS "settings public read" ON public.site_settings;
CREATE POLICY "settings public read" ON public.site_settings FOR SELECT TO anon, authenticated
USING (key = ANY (ARRAY['countdown_seconds','banner','upload_form_url']));