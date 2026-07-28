---
tags:
  - arquitetura
  - frontend
  - supabase
status: atual
ultima_revisao: 2026-07-28
---

# Visão geral e arquitetura

## Objetivo

O OMNI PDV ORION é uma aplicação web de ponto de venda e gestão comercial. A versão atual cobre autenticação, painel, catálogo, clientes, vendas e análise de crédito.

## Componentes

| Camada | Tecnologia | Responsabilidade |
|---|---|---|
| Interface | React 19 + TypeScript | Telas, formulários, navegação e estado local |
| Build | Vite 5 | Desenvolvimento e geração do diretório `dist` |
| Rotas | React Router | Rotas públicas e protegidas |
| Gráficos | Recharts | Visualizações do dashboard |
| Dados | Supabase JS | CRUD, autenticação e chamadas RPC |
| Banco | PostgreSQL/Supabase | Persistência, relações, RLS e função de estoque |
| Hospedagem | Vercel | Build e entrega da SPA |

## Estrutura principal

- `src/App.tsx`: definição de todas as rotas.
- `src/components/Layout.tsx`: menu lateral, topo, usuário e logout.
- `src/components/ProtectedRoute.tsx`: bloqueio de rotas sem sessão.
- `src/lib/AuthContext.tsx`: sessão e eventos de autenticação.
- `src/lib/supabase.ts`: cliente Supabase.
- `src/lib/db.ts`: acesso centralizado aos dados e regras de persistência.
- `src/lib/types.ts`: contratos TypeScript das entidades.
- `src/pages/`: telas do sistema.
- `supabase/migrations/001_schema.sql`: esquema inicial do banco.
- `supabase/seed.sql`: dados iniciais de demonstração.
- `vercel.json`: fallback de todas as rotas para `index.html`.

## Fluxo geral

1. O usuário acessa `/`.
2. O Supabase Auth valida email e senha.
3. `AuthContext` mantém a sessão.
4. `ProtectedRoute` libera o `Layout`.
5. As telas chamam funções de `src/lib/db.ts`.
6. O cliente Supabase acessa tabelas/RPC conforme as políticas RLS.

## Convenções obrigatórias

- Novas consultas devem ficar em `src/lib/db.ts`, não espalhadas nas telas.
- Novas entidades devem ter tipo em `src/lib/types.ts`.
- Alterações de banco devem ser versionadas em nova migração SQL.
- Rotas privadas devem permanecer dentro de `ProtectedRoute`.
- O build de produção deve continuar gerando `dist`.
- O fallback SPA em `vercel.json` deve ser preservado.

Veja também [[03 - Banco de dados Supabase]] e [[04 - Regras de negócio e fluxos críticos]].
