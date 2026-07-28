-- Registros - fase 1.
-- Adiciona somente tabelas novas e relações opcionais, sem alterar estruturas existentes.

CREATE TABLE IF NOT EXISTS public.empresas (
  id BIGSERIAL PRIMARY KEY,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj TEXT,
  inscricao_estadual TEXT,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT empresas_razao_social_not_blank CHECK (BTRIM(razao_social) <> ''),
  CONSTRAINT empresas_cnpj_not_blank CHECK (cnpj IS NULL OR BTRIM(cnpj) <> '')
);

CREATE UNIQUE INDEX IF NOT EXISTS empresas_cnpj_unique_idx
  ON public.empresas(cnpj)
  WHERE cnpj IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.filiais (
  id BIGSERIAL PRIMARY KEY,
  empresa_id BIGINT REFERENCES public.empresas(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  codigo TEXT,
  cnpj TEXT,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT filiais_nome_not_blank CHECK (BTRIM(nome) <> ''),
  CONSTRAINT filiais_codigo_not_blank CHECK (codigo IS NULL OR BTRIM(codigo) <> ''),
  CONSTRAINT filiais_cnpj_not_blank CHECK (cnpj IS NULL OR BTRIM(cnpj) <> '')
);

CREATE INDEX IF NOT EXISTS filiais_empresa_id_idx ON public.filiais(empresa_id);
CREATE UNIQUE INDEX IF NOT EXISTS filiais_cnpj_unique_idx
  ON public.filiais(cnpj)
  WHERE cnpj IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.fornecedores (
  id BIGSERIAL PRIMARY KEY,
  empresa_id BIGINT REFERENCES public.empresas(id) ON DELETE SET NULL,
  filial_id BIGINT REFERENCES public.filiais(id) ON DELETE SET NULL,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  documento TEXT,
  contato TEXT,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fornecedores_razao_social_not_blank CHECK (BTRIM(razao_social) <> ''),
  CONSTRAINT fornecedores_documento_not_blank CHECK (documento IS NULL OR BTRIM(documento) <> '')
);

CREATE INDEX IF NOT EXISTS fornecedores_empresa_id_idx ON public.fornecedores(empresa_id);
CREATE INDEX IF NOT EXISTS fornecedores_filial_id_idx ON public.fornecedores(filial_id);
CREATE UNIQUE INDEX IF NOT EXISTS fornecedores_documento_unique_idx
  ON public.fornecedores(documento)
  WHERE documento IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.formas_pagamento (
  id BIGSERIAL PRIMARY KEY,
  empresa_id BIGINT REFERENCES public.empresas(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT,
  prazo_dias INTEGER NOT NULL DEFAULT 0,
  taxa_percentual NUMERIC(7,4) NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT formas_pagamento_nome_not_blank CHECK (BTRIM(nome) <> ''),
  CONSTRAINT formas_pagamento_prazo_nonnegative CHECK (prazo_dias >= 0),
  CONSTRAINT formas_pagamento_taxa_nonnegative CHECK (taxa_percentual >= 0)
);

CREATE INDEX IF NOT EXISTS formas_pagamento_empresa_id_idx
  ON public.formas_pagamento(empresa_id);

CREATE TABLE IF NOT EXISTS public.tabelas_preco (
  id BIGSERIAL PRIMARY KEY,
  empresa_id BIGINT REFERENCES public.empresas(id) ON DELETE SET NULL,
  filial_id BIGINT REFERENCES public.filiais(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  data_inicio DATE,
  data_fim DATE,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tabelas_preco_nome_not_blank CHECK (BTRIM(nome) <> ''),
  CONSTRAINT tabelas_preco_periodo_valido CHECK (
    data_inicio IS NULL OR data_fim IS NULL OR data_fim >= data_inicio
  )
);

CREATE INDEX IF NOT EXISTS tabelas_preco_empresa_id_idx ON public.tabelas_preco(empresa_id);
CREATE INDEX IF NOT EXISTS tabelas_preco_filial_id_idx ON public.tabelas_preco(filial_id);

CREATE TABLE IF NOT EXISTS public.tabela_preco_itens (
  id BIGSERIAL PRIMARY KEY,
  tabela_preco_id BIGINT NOT NULL
    REFERENCES public.tabelas_preco(id) ON DELETE CASCADE,
  produto_id BIGINT NOT NULL
    REFERENCES public.produtos(id) ON DELETE RESTRICT,
  preco NUMERIC(10,2) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tabela_preco_itens_preco_nonnegative CHECK (preco >= 0),
  CONSTRAINT tabela_preco_itens_tabela_produto_unique UNIQUE (tabela_preco_id, produto_id)
);

CREATE INDEX IF NOT EXISTS tabela_preco_itens_produto_id_idx
  ON public.tabela_preco_itens(produto_id);

INSERT INTO public.permissoes (codigo, modulo, acao, nome, descricao, ordem)
VALUES
  ('registros.criar', 'Registros', 'criar', 'Criar registros', 'Criar cadastros gerais do sistema.', 111),
  ('registros.editar', 'Registros', 'editar', 'Editar registros', 'Editar cadastros gerais do sistema.', 112),
  ('registros.excluir', 'Registros', 'excluir', 'Excluir registros', 'Excluir cadastros gerais do sistema.', 113)
ON CONFLICT (codigo) DO UPDATE
SET modulo = EXCLUDED.modulo,
    acao = EXCLUDED.acao,
    nome = EXCLUDED.nome,
    descricao = EXCLUDED.descricao,
    ordem = EXCLUDED.ordem;

-- Mantém o administrador com acesso integral às novas ações.
INSERT INTO public.perfil_permissoes (perfil_id, permissao_id)
SELECT pa.id, p.id
FROM public.perfis_acesso pa
JOIN public.permissoes p ON p.codigo = ANY (ARRAY[
  'registros.criar',
  'registros.editar',
  'registros.excluir'
])
WHERE pa.slug = 'admin'
ON CONFLICT DO NOTHING;

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formas_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tabelas_preco ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tabela_preco_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permissao para visualizar empresas"
  ON public.empresas FOR SELECT TO authenticated
  USING (public.is_admin() OR public.has_permission('registros.visualizar'));
CREATE POLICY "Permissao para criar empresas"
  ON public.empresas FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR public.has_permission('registros.criar'));
CREATE POLICY "Permissao para editar empresas"
  ON public.empresas FOR UPDATE TO authenticated
  USING (public.is_admin() OR public.has_permission('registros.editar'))
  WITH CHECK (public.is_admin() OR public.has_permission('registros.editar'));
CREATE POLICY "Permissao para excluir empresas"
  ON public.empresas FOR DELETE TO authenticated
  USING (public.is_admin() OR public.has_permission('registros.excluir'));

CREATE POLICY "Permissao para visualizar filiais"
  ON public.filiais FOR SELECT TO authenticated
  USING (public.is_admin() OR public.has_permission('registros.visualizar'));
CREATE POLICY "Permissao para criar filiais"
  ON public.filiais FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR public.has_permission('registros.criar'));
CREATE POLICY "Permissao para editar filiais"
  ON public.filiais FOR UPDATE TO authenticated
  USING (public.is_admin() OR public.has_permission('registros.editar'))
  WITH CHECK (public.is_admin() OR public.has_permission('registros.editar'));
CREATE POLICY "Permissao para excluir filiais"
  ON public.filiais FOR DELETE TO authenticated
  USING (public.is_admin() OR public.has_permission('registros.excluir'));

CREATE POLICY "Permissao para visualizar fornecedores"
  ON public.fornecedores FOR SELECT TO authenticated
  USING (public.is_admin() OR public.has_permission('registros.visualizar'));
CREATE POLICY "Permissao para criar fornecedores"
  ON public.fornecedores FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR public.has_permission('registros.criar'));
CREATE POLICY "Permissao para editar fornecedores"
  ON public.fornecedores FOR UPDATE TO authenticated
  USING (public.is_admin() OR public.has_permission('registros.editar'))
  WITH CHECK (public.is_admin() OR public.has_permission('registros.editar'));
CREATE POLICY "Permissao para excluir fornecedores"
  ON public.fornecedores FOR DELETE TO authenticated
  USING (public.is_admin() OR public.has_permission('registros.excluir'));

CREATE POLICY "Permissao para visualizar formas de pagamento"
  ON public.formas_pagamento FOR SELECT TO authenticated
  USING (public.is_admin() OR public.has_permission('registros.visualizar'));
CREATE POLICY "Permissao para criar formas de pagamento"
  ON public.formas_pagamento FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR public.has_permission('registros.criar'));
CREATE POLICY "Permissao para editar formas de pagamento"
  ON public.formas_pagamento FOR UPDATE TO authenticated
  USING (public.is_admin() OR public.has_permission('registros.editar'))
  WITH CHECK (public.is_admin() OR public.has_permission('registros.editar'));
CREATE POLICY "Permissao para excluir formas de pagamento"
  ON public.formas_pagamento FOR DELETE TO authenticated
  USING (public.is_admin() OR public.has_permission('registros.excluir'));

CREATE POLICY "Permissao para visualizar tabelas de preco"
  ON public.tabelas_preco FOR SELECT TO authenticated
  USING (public.is_admin() OR public.has_permission('registros.visualizar'));
CREATE POLICY "Permissao para criar tabelas de preco"
  ON public.tabelas_preco FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR public.has_permission('registros.criar'));
CREATE POLICY "Permissao para editar tabelas de preco"
  ON public.tabelas_preco FOR UPDATE TO authenticated
  USING (public.is_admin() OR public.has_permission('registros.editar'))
  WITH CHECK (public.is_admin() OR public.has_permission('registros.editar'));
CREATE POLICY "Permissao para excluir tabelas de preco"
  ON public.tabelas_preco FOR DELETE TO authenticated
  USING (public.is_admin() OR public.has_permission('registros.excluir'));

CREATE POLICY "Permissao para visualizar itens de tabela de preco"
  ON public.tabela_preco_itens FOR SELECT TO authenticated
  USING (public.is_admin() OR public.has_permission('registros.visualizar'));
CREATE POLICY "Permissao para criar itens de tabela de preco"
  ON public.tabela_preco_itens FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR public.has_permission('registros.criar'));
CREATE POLICY "Permissao para editar itens de tabela de preco"
  ON public.tabela_preco_itens FOR UPDATE TO authenticated
  USING (public.is_admin() OR public.has_permission('registros.editar'))
  WITH CHECK (public.is_admin() OR public.has_permission('registros.editar'));
CREATE POLICY "Permissao para excluir itens de tabela de preco"
  ON public.tabela_preco_itens FOR DELETE TO authenticated
  USING (public.is_admin() OR public.has_permission('registros.excluir'));

GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.empresas,
  public.filiais,
  public.fornecedores,
  public.formas_pagamento,
  public.tabelas_preco,
  public.tabela_preco_itens
TO authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
