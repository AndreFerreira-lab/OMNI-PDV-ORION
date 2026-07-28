---
tags:
  - omni-pdv-orion
  - documentação
  - índice
status: atual
ultima_revisao: 2026-07-28
---

# OMNI PDV ORION

Esta é a fonte de verdade funcional e técnica do sistema. Antes de alterar código, banco, telas, rotas ou implantação, consulte o documento relacionado e siga [[07 - Checklist obrigatório de alteração]].

## Mapa da documentação

- [[01 - Visão geral e arquitetura]]
- [[02 - Telas e rotas]]
- [[03 - Banco de dados Supabase]]
- [[04 - Regras de negócio e fluxos críticos]]
- [[05 - Autenticação e segurança]]
- [[06 - Implantação e ambientes]]
- [[07 - Checklist obrigatório de alteração]]
- [[08 - Limitações e débitos técnicos]]
- [[09 - Registro de alterações]]

## Estado atual

- Produção: https://omni-pdv-orion.vercel.app/
- Repositório: https://github.com/AndreFerreira-lab/OMNI-PDV-ORION
- Frontend: React + TypeScript + Vite
- Backend: Supabase (Auth + PostgreSQL + API)
- Hospedagem: Vercel
- Banco conectado: projeto Supabase `dzwjdmmijqgudfldzmfl`

## Regra de manutenção

Toda mudança funcional deve atualizar, no mesmo trabalho:

1. o código;
2. a migração do banco, quando aplicável;
3. o documento afetado neste cofre;
4. [[09 - Registro de alterações]];
5. a validação indicada no checklist.
