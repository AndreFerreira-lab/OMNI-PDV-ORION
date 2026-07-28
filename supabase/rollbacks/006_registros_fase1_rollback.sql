-- Rollback da migração 006_registros_fase1.sql.
-- ATENÇÃO: este rollback remove definitivamente todos os dados das tabelas da fase 1.
-- Execute somente após backup e confirmação de que os cadastros podem ser descartados.

BEGIN;

DROP TABLE IF EXISTS public.tabela_preco_itens;
DROP TABLE IF EXISTS public.tabelas_preco;
DROP TABLE IF EXISTS public.formas_pagamento;
DROP TABLE IF EXISTS public.fornecedores;
DROP TABLE IF EXISTS public.filiais;
DROP TABLE IF EXISTS public.empresas;

-- Remove primeiro as relações para não violar as chaves estrangeiras.
DELETE FROM public.usuario_permissoes
WHERE permissao_id IN (
  SELECT id
  FROM public.permissoes
  WHERE codigo IN ('registros.criar', 'registros.editar', 'registros.excluir')
);

DELETE FROM public.perfil_permissoes
WHERE permissao_id IN (
  SELECT id
  FROM public.permissoes
  WHERE codigo IN ('registros.criar', 'registros.editar', 'registros.excluir')
);

DELETE FROM public.permissoes
WHERE codigo IN ('registros.criar', 'registros.editar', 'registros.excluir');

COMMIT;
