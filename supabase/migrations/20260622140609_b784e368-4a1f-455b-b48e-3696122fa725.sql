
-- Revoke execute on internal definer functions from public
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.bootstrap_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_admin() TO authenticated;

-- Tighten contact insert: require non-empty fields and limit length
DROP POLICY IF EXISTS "contact insert public" ON public.contact_messages;
CREATE POLICY "contact insert public" ON public.contact_messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(coalesce(name,'')) BETWEEN 1 AND 200
    AND length(coalesce(email,'')) BETWEEN 3 AND 200
    AND length(coalesce(message,'')) BETWEEN 1 AND 5000
    AND read = false
  );
