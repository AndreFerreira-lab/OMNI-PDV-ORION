---
tags:
  - checklist
  - manutenção
status: obrigatório
ultima_revisao: 2026-07-28
---

# Checklist obrigatório de alteração

## Antes de alterar

- [ ] Ler [[00 - Início]].
- [ ] Ler o documento da tela, fluxo ou camada afetada.
- [ ] Identificar arquivos, rotas, tabelas, relações e funções impactadas.
- [ ] Consultar [[08 - Limitações e débitos técnicos]].
- [ ] Confirmar se a mudança exige migração de banco.
- [ ] Preservar dados existentes e políticas RLS.

## Durante

- [ ] Centralizar acesso a dados em `src/lib/db.ts`.
- [ ] Atualizar tipos em `src/lib/types.ts`.
- [ ] Criar nova migração para mudanças de esquema.
- [ ] Manter regras relacionadas de estoque, cascata e autenticação.
- [ ] Não inserir segredo no código.
- [ ] Não transformar recurso simulado em real sem persistência e regra documentada.

## Validar

- [ ] Executar `npm run build`.
- [ ] Testar a tela alterada e seus estados vazio, carregando, sucesso e erro.
- [ ] Testar rotas protegidas se autenticação/navegação mudou.
- [ ] Testar relações e exclusões se banco mudou.
- [ ] Testar criação, edição e exclusão se CRUD mudou.
- [ ] Testar ajuste de estoque se vendas/produtos mudaram.
- [ ] Validar Preview da Vercel quando houver impacto visual ou de ambiente.

## Finalizar

- [ ] Atualizar o documento funcional/técnico afetado.
- [ ] Registrar a mudança em [[09 - Registro de alterações]].
- [ ] Informar riscos, migrações e validações no PR.
- [ ] Confirmar produção após merge.

## Matriz rápida de impacto

| Mudança | Consultar também |
|---|---|
| Login, sessão ou usuário | [[05 - Autenticação e segurança]], `AuthContext`, `ProtectedRoute`, `Layout` |
| Nova tela ou rota | [[02 - Telas e rotas]], `App.tsx`, `Layout.tsx`, `vercel.json` |
| Produto/categoria | [[03 - Banco de dados Supabase]], [[04 - Regras de negócio e fluxos críticos]], Catálogo, Vendas |
| Cliente | Clientes, Vendas, Análise de Crédito, Dashboard |
| Venda/estoque | Vendas, Dashboard, RPC `diminuir_estoque`, quatro tabelas relacionadas |
| Banco/RLS | Migrações, tipos, `db.ts`, [[05 - Autenticação e segurança]] |
| Deploy | [[06 - Implantação e ambientes]], Vercel e variáveis |
