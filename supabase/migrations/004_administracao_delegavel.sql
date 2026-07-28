-- Permite delegar a gestão sem exigir o perfil Administrador.

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
  IF NOT (public.has_permission('perfis.editar') OR public.is_admin()) THEN
    RAISE EXCEPTION 'Permissão negada para editar perfis';
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
  IF NOT (public.has_permission('usuarios.editar') OR public.is_admin()) THEN
    RAISE EXCEPTION 'Permissão negada para editar usuários';
  END IF;

  IF primary_profile_id IS NULL
    OR NOT (primary_profile_id = ANY(COALESCE(profile_ids, ARRAY[]::BIGINT[]))) THEN
    RAISE EXCEPTION 'O perfil principal deve estar entre os perfis selecionados';
  END IF;

  SELECT id INTO admin_profile_id FROM public.perfis_acesso WHERE slug = 'admin';
  IF target_usuario_id = auth.uid()
    AND NOT (admin_profile_id = ANY(COALESCE(profile_ids, ARRAY[]::BIGINT[])))
    AND public.is_admin() THEN
    RAISE EXCEPTION 'Você não pode remover seu próprio acesso administrativo';
  END IF;

  DELETE FROM public.usuario_perfis WHERE usuario_id = target_usuario_id;
  INSERT INTO public.usuario_perfis (usuario_id, perfil_id, principal)
  SELECT target_usuario_id, p.id, p.id = primary_profile_id
  FROM public.perfis_acesso p
  WHERE p.id = ANY(COALESCE(profile_ids, ARRAY[]::BIGINT[]))
    AND p.ativo;

  DELETE FROM public.usuario_permissoes WHERE usuario_id = target_usuario_id;
  FOR override_item IN
    SELECT value FROM jsonb_array_elements(COALESCE(permission_overrides, '[]'::JSONB))
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

DROP POLICY IF EXISTS "Administradores gerenciam perfis" ON public.perfis_acesso;
CREATE POLICY "Permissão para gerenciar perfis"
  ON public.perfis_acesso FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR public.has_permission('perfis.criar')
    OR public.has_permission('perfis.editar')
    OR public.has_permission('perfis.excluir')
  )
  WITH CHECK (
    public.is_admin()
    OR public.has_permission('perfis.criar')
    OR public.has_permission('perfis.editar')
  );

DROP POLICY IF EXISTS "Administradores gerenciam permissões de perfis" ON public.perfil_permissoes;
CREATE POLICY "Permissão para gerenciar permissões de perfis"
  ON public.perfil_permissoes FOR ALL TO authenticated
  USING (public.is_admin() OR public.has_permission('perfis.editar'))
  WITH CHECK (public.is_admin() OR public.has_permission('perfis.editar'));

DROP POLICY IF EXISTS "Administradores gerenciam perfis de usuários" ON public.usuario_perfis;
CREATE POLICY "Permissão para gerenciar perfis de usuários"
  ON public.usuario_perfis FOR ALL TO authenticated
  USING (public.is_admin() OR public.has_permission('usuarios.editar'))
  WITH CHECK (public.is_admin() OR public.has_permission('usuarios.editar'));

DROP POLICY IF EXISTS "Administradores gerenciam exceções" ON public.usuario_permissoes;
CREATE POLICY "Permissão para gerenciar exceções"
  ON public.usuario_permissoes FOR ALL TO authenticated
  USING (public.is_admin() OR public.has_permission('usuarios.editar'))
  WITH CHECK (public.is_admin() OR public.has_permission('usuarios.editar'));
