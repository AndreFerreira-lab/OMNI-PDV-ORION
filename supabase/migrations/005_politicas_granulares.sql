-- Separa políticas por ação para respeitar criar, editar e excluir individualmente.

DROP POLICY IF EXISTS "Permissão para gerenciar perfis" ON public.perfis_acesso;
CREATE POLICY "Permissão para criar perfis"
  ON public.perfis_acesso FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR public.has_permission('perfis.criar'));
CREATE POLICY "Permissão para editar perfis"
  ON public.perfis_acesso FOR UPDATE TO authenticated
  USING (public.is_admin() OR public.has_permission('perfis.editar'))
  WITH CHECK (public.is_admin() OR public.has_permission('perfis.editar'));
CREATE POLICY "Permissão para excluir perfis"
  ON public.perfis_acesso FOR DELETE TO authenticated
  USING (
    NOT sistema
    AND (public.is_admin() OR public.has_permission('perfis.excluir'))
  );

DROP POLICY IF EXISTS "Administradores gerenciam unidades" ON public.unidades_organizacionais;
CREATE POLICY "Permissão para criar unidades"
  ON public.unidades_organizacionais FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR public.has_permission('unidades.criar'));
CREATE POLICY "Permissão para editar unidades"
  ON public.unidades_organizacionais FOR UPDATE TO authenticated
  USING (public.is_admin() OR public.has_permission('unidades.editar'))
  WITH CHECK (public.is_admin() OR public.has_permission('unidades.editar'));
CREATE POLICY "Permissão para excluir unidades"
  ON public.unidades_organizacionais FOR DELETE TO authenticated
  USING (public.is_admin() OR public.has_permission('unidades.excluir'));
