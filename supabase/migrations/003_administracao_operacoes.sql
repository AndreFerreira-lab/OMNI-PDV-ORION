ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios u
    JOIN public.usuario_perfis up ON up.usuario_id = u.id
    JOIN public.perfis_acesso pa ON pa.id = up.perfil_id
    WHERE u.id = auth.uid()
      AND u.ativo
      AND pa.slug = 'admin'
      AND pa.ativo
  );
$$;

CREATE OR REPLACE FUNCTION public.has_permission(permission_code TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.ativo
  ) AND (
    public.is_admin()
    OR COALESCE(
      (
        SELECT upm.permitido
        FROM public.usuario_permissoes upm
        JOIN public.permissoes p ON p.id = upm.permissao_id
        WHERE upm.usuario_id = auth.uid()
          AND p.codigo = permission_code
        LIMIT 1
      ),
      EXISTS (
        SELECT 1
        FROM public.usuario_perfis up
        JOIN public.perfis_acesso pa ON pa.id = up.perfil_id AND pa.ativo
        JOIN public.perfil_permissoes pp ON pp.perfil_id = pa.id
        JOIN public.permissoes p ON p.id = pp.permissao_id
        WHERE up.usuario_id = auth.uid()
          AND p.codigo = permission_code
      )
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.salvar_permissoes_perfil(
  target_perfil_id BIGINT,
  permission_ids BIGINT[]
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_slug TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem editar perfis';
  END IF;

  SELECT slug INTO target_slug
  FROM public.perfis_acesso
  WHERE id = target_perfil_id;

  IF target_slug = 'admin' THEN
    RAISE EXCEPTION 'O perfil Administrador mantém acesso total';
  END IF;

  DELETE FROM public.perfil_permissoes WHERE perfil_id = target_perfil_id;

  INSERT INTO public.perfil_permissoes (perfil_id, permissao_id)
  SELECT target_perfil_id, p.id
  FROM public.permissoes p
  WHERE p.id = ANY(COALESCE(permission_ids, ARRAY[]::BIGINT[]));
END;
$$;

CREATE OR REPLACE FUNCTION public.salvar_acesso_usuario(
  target_usuario_id UUID,
  profile_ids BIGINT[],
  primary_profile_id BIGINT,
  permission_overrides JSONB DEFAULT '[]'::JSONB
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  override_item JSONB;
  admin_profile_id BIGINT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem editar usuários';
  END IF;

  IF primary_profile_id IS NULL
    OR NOT (primary_profile_id = ANY(COALESCE(profile_ids, ARRAY[]::BIGINT[]))) THEN
    RAISE EXCEPTION 'O perfil principal deve estar entre os perfis selecionados';
  END IF;

  SELECT id INTO admin_profile_id FROM public.perfis_acesso WHERE slug = 'admin';

  IF target_usuario_id = auth.uid()
    AND NOT (admin_profile_id = ANY(COALESCE(profile_ids, ARRAY[]::BIGINT[]))) THEN
    RAISE EXCEPTION 'Você não pode remover seu próprio acesso administrativo';
  END IF;

  DELETE FROM public.usuario_perfis WHERE usuario_id = target_usuario_id;

  INSERT INTO public.usuario_perfis (usuario_id, perfil_id, principal)
  SELECT target_usuario_id, p.id, p.id = primary_profile_id
  FROM public.perfis_acesso p
  WHERE p.id = ANY(COALESCE(profile_ids, ARRAY[]::BIGINT[]))
    AND p.ativo;

  DELETE FROM public.usuario_permissoes WHERE usuario_id = target_usuario_id;

  FOR override_item IN SELECT value FROM jsonb_array_elements(COALESCE(permission_overrides, '[]'::JSONB))
  LOOP
    INSERT INTO public.usuario_permissoes (usuario_id, permissao_id, permitido)
    VALUES (
      target_usuario_id,
      (override_item ->> 'permissao_id')::BIGINT,
      (override_item ->> 'permitido')::BOOLEAN
    )
    ON CONFLICT (usuario_id, permissao_id)
    DO UPDATE SET permitido = EXCLUDED.permitido, updated_at = NOW();
  END LOOP;

  UPDATE public.usuarios u
  SET perfil_acesso = p.slug
  FROM public.perfis_acesso p
  WHERE u.id = target_usuario_id
    AND p.id = primary_profile_id;
END;
$$;

REVOKE ALL ON FUNCTION public.salvar_permissoes_perfil(BIGINT, BIGINT[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.salvar_acesso_usuario(UUID, BIGINT[], BIGINT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.salvar_permissoes_perfil(BIGINT, BIGINT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.salvar_acesso_usuario(UUID, BIGINT[], BIGINT, JSONB) TO authenticated;
