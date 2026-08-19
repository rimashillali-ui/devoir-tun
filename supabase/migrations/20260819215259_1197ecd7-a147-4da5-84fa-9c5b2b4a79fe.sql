-- 1. Remove self-service admin bootstrap (privilege escalation surface)
DROP FUNCTION IF EXISTS public.bootstrap_admin();
DROP FUNCTION IF EXISTS public.has_any_admin();

-- 2. Lock down SECURITY DEFINER functions: no anonymous execution
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_list_admins() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_promote_by_email(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_revoke_admin(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;

-- keep only what the app needs, for signed-in users
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_admins() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_promote_by_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke_admin(uuid) TO authenticated;

-- 3. Explicit, admin-only RLS policies on storage objects for the export bucket
DROP POLICY IF EXISTS "db_export_admin_select" ON storage.objects;
DROP POLICY IF EXISTS "db_export_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "db_export_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "db_export_admin_delete" ON storage.objects;

CREATE POLICY "db_export_admin_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'database_export_08_07_26' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "db_export_admin_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'database_export_08_07_26' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "db_export_admin_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'database_export_08_07_26' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'database_export_08_07_26' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "db_export_admin_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'database_export_08_07_26' AND public.has_role(auth.uid(), 'admin'));