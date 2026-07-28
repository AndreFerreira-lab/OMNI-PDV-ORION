-- Administração, perfis e permissões customizáveis.
-- Usuários existentes recebem o perfil Administrador para preservar o acesso.

CREATE TABLE IF NOT EXISTS public.perfis_acesso (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT,
  sistema BOOLEAN NOT NULL DEFAULT FALSE,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.permissoes (
  id BIGSERIAL PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  modulo TEXT NOT NULL,
  acao TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.perfil_permissoes (
  perfil_id BIGINT NOT NULL REFERENCES public.perfis_acesso(id) ON DELETE CASCADE,
  permissao_id BIGINT NOT NULL REFERENCES public.permissoes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (perfil_id, permissao_id)
);

CREATE TABLE IF NOT EXISTS public.usuario_perfis (
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  perfil_id BIGINT NOT NULL REFERENCES public.perfis_acesso(id) ON DELETE CASCADE,
  principal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (usuario_id, perfil_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS usuario_perfil_principal_idx
  ON public.usuario_perfis(usuario_id)
  WHERE principal;

CREATE TABLE IF NOT EXISTS public.usuario_permissoes (
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  permissao_id BIGINT NOT NULL REFERENCES public.permissoes(id) ON DELETE CASCADE,
  permitido BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (usuario_id, permissao_id)
);

CREATE TABLE IF NOT EXISTS public.unidades_organizacionais (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  parent_id BIGINT REFERENCES public.unidades_organizacionais(id) ON DELETE RESTRICT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unidades_nome_parent_unique UNIQUE NULLS NOT DISTINCT (nome, parent_id)
);

CREATE TABLE IF NOT EXISTS public.usuario_unidades (
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  unidade_id BIGINT NOT NULL REFERENCES public.unidades_organizacionais(id) ON DELETE CASCADE,
  responsavel BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (usuario_id, unidade_id)
);

INSERT INTO public.perfis_acesso (nome, slug, descricao, sistema)
VALUES
  ('Administrador', 'admin', 'Acesso total ao sistema e à gestão de permissões.', TRUE),
  ('Vendedor', 'vendedor', 'Acesso operacional padrão para vendas e atendimento.', TRUE)
ON CONFLICT (slug) DO UPDATE
SET nome = EXCLUDED.nome,
    descricao = EXCLUDED.descricao,
    sistema = TRUE,
    ativo = TRUE;

INSERT INTO public.permissoes (codigo, modulo, acao, nome, descricao, ordem)
VALUES
  ('home.visualizar', 'Página Inicial', 'visualizar', 'Visualizar página inicial', NULL, 10),
  ('dashboard.visualizar', 'Dashboard', 'visualizar', 'Visualizar dashboard', NULL, 20),
  ('analise_credito.visualizar', 'Análise de Crédito', 'visualizar', 'Visualizar análises de crédito', NULL, 30),
  ('analise_credito.criar', 'Análise de Crédito', 'criar', 'Criar análises de crédito', NULL, 31),
  ('negocios.visualizar', 'Negócios', 'visualizar', 'Visualizar negócios', NULL, 40),
  ('atividades.visualizar', 'Atividades', 'visualizar', 'Visualizar atividades', NULL, 50),
  ('catalogo.visualizar', 'Catálogo', 'visualizar', 'Visualizar produtos e categorias', NULL, 60),
  ('catalogo.criar', 'Catálogo', 'criar', 'Criar produtos e categorias', NULL, 61),
  ('catalogo.editar', 'Catálogo', 'editar', 'Editar produtos e categorias', NULL, 62),
  ('catalogo.excluir', 'Catálogo', 'excluir', 'Excluir produtos e categorias', NULL, 63),
  ('clientes.visualizar', 'Clientes', 'visualizar', 'Visualizar clientes', NULL, 70),
  ('clientes.criar', 'Clientes', 'criar', 'Criar clientes', NULL, 71),
  ('clientes.editar', 'Clientes', 'editar', 'Editar clientes', NULL, 72),
  ('clientes.excluir', 'Clientes', 'excluir', 'Excluir clientes', NULL, 73),
  ('vendas.visualizar', 'Vendas', 'visualizar', 'Visualizar vendas', NULL, 80),
  ('vendas.criar', 'Vendas', 'criar', 'Criar vendas e orçamentos', NULL, 81),
  ('vendas.editar', 'Vendas', 'editar', 'Editar vendas e orçamentos', NULL, 82),
  ('vendas.excluir', 'Vendas', 'excluir', 'Excluir vendas e orçamentos', NULL, 83),
  ('analise_pedidos.visualizar', 'Análise de Pedidos', 'visualizar', 'Visualizar análise de pedidos', NULL, 90),
  ('consultas.visualizar', 'Consultas', 'visualizar', 'Visualizar consultas', NULL, 100),
  ('registros.visualizar', 'Registros', 'visualizar', 'Visualizar registros', NULL, 110),
  ('registros.administrar', 'Registros', 'administrar', 'Administrar cadastros gerais', NULL, 111),
  ('administracao.visualizar', 'Administração', 'visualizar', 'Visualizar administração', NULL, 120),
  ('administracao.administrar', 'Administração', 'administrar', 'Administrar configurações e acessos', NULL, 121),
  ('usuarios.visualizar', 'Usuários', 'visualizar', 'Visualizar usuários', NULL, 130),
  ('usuarios.criar', 'Usuários', 'criar', 'Criar e convidar usuários', NULL, 131),
  ('usuarios.editar', 'Usuários', 'editar', 'Editar usuários, perfis e exceções', NULL, 132),
  ('usuarios.excluir', 'Usuários', 'excluir', 'Remover acessos de usuários', NULL, 133),
  ('perfis.visualizar', 'Perfis de Acesso', 'visualizar', 'Visualizar perfis e permissões', NULL, 140),
  ('perfis.criar', 'Perfis de Acesso', 'criar', 'Criar perfis de acesso', NULL, 141),
  ('perfis.editar', 'Perfis de Acesso', 'editar', 'Editar perfis e suas permissões', NULL, 142),
  ('perfis.excluir', 'Perfis de Acesso', 'excluir', 'Excluir perfis não sistêmicos', NULL, 143),
  ('unidades.visualizar', 'Unidades Organizacionais', 'visualizar', 'Visualizar unidades organizacionais', NULL, 150),
  ('unidades.criar', 'Unidades Organizacionais', 'criar', 'Criar unidades organizacionais', NULL, 151),
  ('unidades.editar', 'Unidades Organizacionais', 'editar', 'Editar unidades e membros', NULL, 152),
  ('unidades.excluir', 'Unidades Organizacionais', 'excluir', 'Excluir unidades organizacionais', NULL, 153)
ON CONFLICT (codigo) DO UPDATE
SET modulo = EXCLUDED.modulo,
    acao = EXCLUDED.acao,
    nome = EXCLUDED.nome,
    descricao = EXCLUDED.descricao,
    ordem = EXCLUDED.ordem;

-- Administrador sempre recebe o catálogo completo.
INSERT INTO public.perfil_permissoes (perfil_id, permissao_id)
SELECT pa.id, p.id
FROM public.perfis_acesso pa
CROSS JOIN public.permissoes p
WHERE pa.slug = 'admin'
ON CONFLICT DO NOTHING;

-- Vendedor recebe um conjunto operacional inicial, customizável pela Administração.
INSERT INTO public.perfil_permissoes (perfil_id, permissao_id)
SELECT pa.id, p.id
FROM public.perfis_acesso pa
JOIN public.permissoes p ON p.codigo = ANY (ARRAY[
  'home.visualizar',
  'dashboard.visualizar',
  'catalogo.visualizar',
  'clientes.visualizar',
  'clientes.criar',
  'clientes.editar',
  'vendas.visualizar',
  'vendas.criar',
  'vendas.editar',
  'analise_credito.visualizar'
])
WHERE pa.slug = 'vendedor'
ON CONFLICT DO NOTHING;

-- Preserva acesso: todos os usuários existentes se tornam administradores iniciais.
INSERT INTO public.usuario_perfis (usuario_id, perfil_id, principal)
SELECT u.id, pa.id, TRUE
FROM public.usuarios u
CROSS JOIN public.perfis_acesso pa
WHERE pa.slug = 'admin'
ON CONFLICT (usuario_id, perfil_id) DO UPDATE SET principal = TRUE;

UPDATE public.usuarios SET perfil_acesso = 'admin';

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuario_perfis up
    JOIN public.perfis_acesso pa ON pa.id = up.perfil_id
    WHERE up.usuario_id = auth.uid()
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
  SELECT
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
    );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_permission(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_permissions()
RETURNS TABLE (codigo TEXT)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.codigo
  FROM public.permissoes p
  WHERE public.has_permission(p.codigo)
  ORDER BY p.ordem, p.codigo;
$$;

REVOKE ALL ON FUNCTION public.get_my_permissions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_permissions() TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  vendedor_id BIGINT;
BEGIN
  INSERT INTO public.usuarios (id, email, nome, perfil_acesso)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'nome', split_part(COALESCE(NEW.email, ''), '@', 1)),
    'vendedor'
  )
  ON CONFLICT (id) DO NOTHING;

  SELECT id INTO vendedor_id FROM public.perfis_acesso WHERE slug = 'vendedor';
  INSERT INTO public.usuario_perfis (usuario_id, perfil_id, principal)
  VALUES (NEW.id, vendedor_id, TRUE)
  ON CONFLICT (usuario_id, perfil_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.perfis_acesso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfil_permissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario_perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario_permissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidades_organizacionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario_unidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados visualizam catálogo de permissões"
  ON public.permissoes FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Administradores gerenciam permissões"
  ON public.permissoes FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Autenticados visualizam perfis"
  ON public.perfis_acesso FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Administradores gerenciam perfis"
  ON public.perfis_acesso FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Autenticados visualizam permissões de perfis"
  ON public.perfil_permissoes FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Administradores gerenciam permissões de perfis"
  ON public.perfil_permissoes FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Usuário visualiza próprios perfis"
  ON public.usuario_perfis FOR SELECT TO authenticated
  USING (usuario_id = auth.uid() OR public.is_admin());
CREATE POLICY "Administradores gerenciam perfis de usuários"
  ON public.usuario_perfis FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Usuário visualiza próprias exceções"
  ON public.usuario_permissoes FOR SELECT TO authenticated
  USING (usuario_id = auth.uid() OR public.is_admin());
CREATE POLICY "Administradores gerenciam exceções"
  ON public.usuario_permissoes FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Autenticados visualizam unidades"
  ON public.unidades_organizacionais FOR SELECT TO authenticated
  USING (public.has_permission('unidades.visualizar') OR public.is_admin());
CREATE POLICY "Administradores gerenciam unidades"
  ON public.unidades_organizacionais FOR ALL TO authenticated
  USING (public.has_permission('unidades.editar') OR public.is_admin())
  WITH CHECK (public.has_permission('unidades.criar') OR public.has_permission('unidades.editar') OR public.is_admin());

CREATE POLICY "Usuário visualiza próprias unidades"
  ON public.usuario_unidades FOR SELECT TO authenticated
  USING (usuario_id = auth.uid() OR public.is_admin());
CREATE POLICY "Administradores gerenciam membros de unidades"
  ON public.usuario_unidades FOR ALL TO authenticated
  USING (public.has_permission('unidades.editar') OR public.is_admin())
  WITH CHECK (public.has_permission('unidades.editar') OR public.is_admin());

-- Permite ao administrador listar e editar perfis de usuários.
DROP POLICY IF EXISTS "Usuários podem ver seus próprios perfis" ON public.usuarios;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios perfis" ON public.usuarios;
DROP POLICY IF EXISTS "Todos podem criar perfis" ON public.usuarios;
CREATE POLICY "Usuários criam apenas o próprio perfil"
  ON public.usuarios FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR public.is_admin());
CREATE POLICY "Usuários visualizam perfil próprio ou administração visualiza todos"
  ON public.usuarios FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_permission('usuarios.visualizar') OR public.is_admin());
CREATE POLICY "Usuários atualizam perfil próprio ou administração atualiza todos"
  ON public.usuarios FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_permission('usuarios.editar') OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.has_permission('usuarios.editar') OR public.is_admin());

-- Substitui políticas públicas por permissões configuráveis.
DROP POLICY IF EXISTS "Todos podem ler categorias" ON public.categorias;
DROP POLICY IF EXISTS "Todos podem inserir categorias" ON public.categorias;
DROP POLICY IF EXISTS "Todos podem atualizar categorias" ON public.categorias;
DROP POLICY IF EXISTS "Todos podem deletar categorias" ON public.categorias;
CREATE POLICY "Permissão para visualizar categorias" ON public.categorias FOR SELECT TO authenticated USING (public.has_permission('catalogo.visualizar'));
CREATE POLICY "Permissão para criar categorias" ON public.categorias FOR INSERT TO authenticated WITH CHECK (public.has_permission('catalogo.criar'));
CREATE POLICY "Permissão para editar categorias" ON public.categorias FOR UPDATE TO authenticated USING (public.has_permission('catalogo.editar')) WITH CHECK (public.has_permission('catalogo.editar'));
CREATE POLICY "Permissão para excluir categorias" ON public.categorias FOR DELETE TO authenticated USING (public.has_permission('catalogo.excluir'));

DROP POLICY IF EXISTS "Todos podem ler produtos" ON public.produtos;
DROP POLICY IF EXISTS "Todos podem inserir produtos" ON public.produtos;
DROP POLICY IF EXISTS "Todos podem atualizar produtos" ON public.produtos;
DROP POLICY IF EXISTS "Todos podem deletar produtos" ON public.produtos;
CREATE POLICY "Permissão para visualizar produtos" ON public.produtos FOR SELECT TO authenticated USING (public.has_permission('catalogo.visualizar') OR public.has_permission('vendas.visualizar'));
CREATE POLICY "Permissão para criar produtos" ON public.produtos FOR INSERT TO authenticated WITH CHECK (public.has_permission('catalogo.criar'));
CREATE POLICY "Permissão para editar produtos" ON public.produtos FOR UPDATE TO authenticated USING (public.has_permission('catalogo.editar')) WITH CHECK (public.has_permission('catalogo.editar'));
CREATE POLICY "Permissão para excluir produtos" ON public.produtos FOR DELETE TO authenticated USING (public.has_permission('catalogo.excluir'));

DROP POLICY IF EXISTS "Todos podem ler clientes" ON public.clientes;
DROP POLICY IF EXISTS "Todos podem inserir clientes" ON public.clientes;
DROP POLICY IF EXISTS "Todos podem atualizar clientes" ON public.clientes;
DROP POLICY IF EXISTS "Todos podem deletar clientes" ON public.clientes;
CREATE POLICY "Permissão para visualizar clientes" ON public.clientes FOR SELECT TO authenticated USING (
  public.has_permission('clientes.visualizar')
  OR public.has_permission('vendas.visualizar')
  OR public.has_permission('analise_credito.visualizar')
);
CREATE POLICY "Permissão para criar clientes" ON public.clientes FOR INSERT TO authenticated WITH CHECK (
  public.has_permission('clientes.criar') OR public.has_permission('vendas.criar')
);
CREATE POLICY "Permissão para editar clientes" ON public.clientes FOR UPDATE TO authenticated USING (public.has_permission('clientes.editar')) WITH CHECK (public.has_permission('clientes.editar'));
CREATE POLICY "Permissão para excluir clientes" ON public.clientes FOR DELETE TO authenticated USING (public.has_permission('clientes.excluir'));

DROP POLICY IF EXISTS "Todos podem ler vendas" ON public.vendas;
DROP POLICY IF EXISTS "Todos podem inserir vendas" ON public.vendas;
DROP POLICY IF EXISTS "Todos podem atualizar vendas" ON public.vendas;
DROP POLICY IF EXISTS "Todos podem deletar vendas" ON public.vendas;
CREATE POLICY "Permissão para visualizar vendas" ON public.vendas FOR SELECT TO authenticated USING (
  public.has_permission('vendas.visualizar')
  OR public.has_permission('dashboard.visualizar')
  OR public.has_permission('analise_credito.visualizar')
);
CREATE POLICY "Permissão para criar vendas" ON public.vendas FOR INSERT TO authenticated WITH CHECK (public.has_permission('vendas.criar'));
CREATE POLICY "Permissão para editar vendas" ON public.vendas FOR UPDATE TO authenticated USING (public.has_permission('vendas.editar')) WITH CHECK (public.has_permission('vendas.editar'));
CREATE POLICY "Permissão para excluir vendas" ON public.vendas FOR DELETE TO authenticated USING (public.has_permission('vendas.excluir'));

DROP POLICY IF EXISTS "Todos podem ler itens_venda" ON public.itens_venda;
DROP POLICY IF EXISTS "Todos podem inserir itens_venda" ON public.itens_venda;
DROP POLICY IF EXISTS "Todos podem deletar itens_venda" ON public.itens_venda;
CREATE POLICY "Permissão para visualizar itens" ON public.itens_venda FOR SELECT TO authenticated USING (
  public.has_permission('vendas.visualizar')
  OR public.has_permission('dashboard.visualizar')
  OR public.has_permission('analise_credito.visualizar')
);
CREATE POLICY "Permissão para criar itens" ON public.itens_venda FOR INSERT TO authenticated WITH CHECK (
  public.has_permission('vendas.criar') OR public.has_permission('vendas.editar')
);
CREATE POLICY "Permissão para excluir itens" ON public.itens_venda FOR DELETE TO authenticated USING (
  public.has_permission('vendas.editar') OR public.has_permission('vendas.excluir')
);

CREATE OR REPLACE FUNCTION public.diminuir_estoque(pid BIGINT, qtd INTEGER)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.has_permission('vendas.criar')
    OR public.has_permission('vendas.editar')
    OR public.is_admin()
  ) THEN
    RAISE EXCEPTION 'Permissão negada para alterar estoque';
  END IF;
  UPDATE public.produtos SET estoque = estoque - qtd WHERE id = pid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.diminuir_estoque(BIGINT, INTEGER) TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.perfis_acesso,
  public.permissoes,
  public.perfil_permissoes,
  public.usuario_perfis,
  public.usuario_permissoes,
  public.unidades_organizacionais,
  public.usuario_unidades
TO authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
