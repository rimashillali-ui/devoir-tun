-- Fonctions d'administration sans clé secrète (utilisables depuis n'importe quel hébergeur)

CREATE OR REPLACE FUNCTION public.has_any_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
$$;

CREATE OR REPLACE FUNCTION public.admin_list_admins()
RETURNS TABLE (user_id uuid, email text, created_at timestamptz)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  RETURN QUERY
    SELECT ur.user_id, p.email, ur.created_at
    FROM public.user_roles ur
    LEFT JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.role = 'admin'
    ORDER BY ur.created_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_promote_by_email(_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  SELECT id INTO target FROM public.profiles WHERE lower(email) = lower(_email) LIMIT 1;
  IF target IS NULL THEN
    RAISE EXCEPTION 'Utilisateur introuvable (doit avoir un compte)';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (target, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_revoke_admin(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'Vous ne pouvez pas vous révoquer vous-même';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'admin';
  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.has_any_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_admins() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_promote_by_email(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_revoke_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bootstrap_admin() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_any_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_admins() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_promote_by_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_admin() TO authenticated;