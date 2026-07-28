---
tags:
  - riscos
  - débitos-técnicos
status: acompanhar
ultima_revisao: 2026-07-28
---

# Limitações e débitos técnicos

## Prioridade alta

1. **Configuração Supabase no código:** URL e chave anônima estão diretamente em `src/lib/supabase.ts`, em vez de `import.meta.env`.
2. **Venda não transacional:** cabeçalho, itens e estoque são alterados em operações separadas.
3. **Exclusão de venda:** não devolve estoque.
4. **Exclusão de produto:** apaga itens históricos por `ON DELETE CASCADE`.
5. **Estoque negativo:** a RPC não valida saldo.
6. **Isolamento empresarial:** Empresas e Filiais foram criadas, mas produtos, clientes e vendas ainda não são separados por esses vínculos.

## Prioridade média

1. Análise de crédito é simulada e não persiste dados.
2. O cabeçalho utiliza o nome da tabela `usuarios`, mas ainda não apresenta o cargo.
3. Diversos botões do topo e menu do usuário são apenas visuais.
4. Telas de Negócios, Atividades, Análise de Pedidos e Consultas estão em construção.
5. Erros de banco nem sempre são apresentados ao usuário nos CRUDs.
6. Não há testes automatizados.
7. Status de vendas são textos livres; mudanças afetam cálculos do dashboard.
8. Criação de usuários pela Administração exige fluxo seguro de convite e ainda usa o cadastro público existente.
9. Tabelas de preço possuem estrutura de itens, mas a interface desta fase gerencia somente o cabeçalho.
10. Formas de pagamento e tabelas de preço ainda não estão aplicadas ao fluxo de Vendas.

## Prioridade baixa

1. README do repositório contém apenas o título.
2. Há artefatos de build versionados em `dist`.
3. Alguns dados visuais são derivados por posição/ID e não representam campos reais.
4. Há estilos extensos centralizados em `src/index.css` e estilos inline.

## Regra

Não corrigir silenciosamente um débito durante mudança não relacionada. Se a correção for necessária, registrar escopo, impacto, migração e testes em [[09 - Registro de alterações]].
