
-- 1) Lock down table grants
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.profiles FROM anon, authenticated;
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.user_roles FROM anon, authenticated;
REVOKE SELECT ON public.user_roles FROM anon;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- 2) Defense-in-depth: restrictive policies blocking writes on user_roles via API
DROP POLICY IF EXISTS "user_roles deny insert" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles deny update" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles deny delete" ON public.user_roles;

CREATE POLICY "user_roles deny insert"
  ON public.user_roles AS RESTRICTIVE
  FOR INSERT TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "user_roles deny update"
  ON public.user_roles AS RESTRICTIVE
  FOR UPDATE TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "user_roles deny delete"
  ON public.user_roles AS RESTRICTIVE
  FOR DELETE TO anon, authenticated
  USING (false);

-- 3) Restrict SECURITY DEFINER functions: revoke EXECUTE from anon/authenticated/PUBLIC
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bootstrap_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.bootstrap_admin() TO service_role;
