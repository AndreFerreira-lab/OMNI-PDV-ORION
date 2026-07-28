---
tags:
  - regras-de-negócio
  - fluxos
  - estoque
status: atual
ultima_revisao: 2026-07-28
---

# Regras de negócio e fluxos críticos

## Criação de venda

1. A tela exige pelo menos um item, exceto no fluxo específico de gerar pedido.
2. O total é calculado por `preço × quantidade × (1 - desconto/100)`.
3. O cabeçalho é inserido em `vendas`.
4. Os itens recebem o ID da venda e são inseridos em `itens_venda`.
5. Para cada item, a RPC `diminuir_estoque` baixa a quantidade.

Preservar a ordem. Alterações parciais podem criar venda sem itens ou estoque inconsistente.

## Edição de venda

1. O estoque dos itens antigos é devolvido usando quantidade negativa.
2. Os itens antigos são excluídos.
3. O cabeçalho da venda é atualizado.
4. Os novos itens são inseridos.
5. O estoque dos novos itens é baixado.

Hoje esse fluxo não é uma transação atômica. Qualquer melhoria deve preferir uma RPC transacional no banco.

## Exclusão de venda

- Excluir `vendas` remove `itens_venda` em cascata.
- O fluxo atual não devolve estoque antes da exclusão.
- Não mudar ou reutilizar esse comportamento sem decidir explicitamente a regra de estoque.

## Produtos e categorias

- Produto pode existir sem categoria.
- Excluir categoria mantém o produto e limpa a referência.
- Excluir produto remove itens históricos relacionados por cascata.
- Preço e estoque são convertidos de valores de formulário antes do envio.

## Clientes

- Apenas nome é exigido pela interface e pelo banco.
- Excluir cliente mantém vendas antigas, definindo `cliente_id` como nulo.
- Email não é único no esquema atual.

## Dashboard

- Indicadores são calculados no cliente a partir das consultas existentes.
- Os status `pedido` e `orcamento` determinam agrupamentos.
- Mudanças de nomenclatura de status afetam dashboard e histórico de vendas.

## Análise de crédito

- Score e recomendações são simulações locais.
- Não há tabela de análises.
- Não há persistência do formulário.
- Antes de tornar o recurso real, definir fonte de dados, auditoria, permissões e histórico de decisões.

## Invariantes a preservar

- Uma linha de venda deve referenciar venda e produto válidos.
- Exclusão de venda deve remover suas linhas.
- Exclusão de cliente não deve apagar vendas.
- Exclusão de categoria não deve apagar produtos.
- Rotas internas exigem usuário autenticado.
- Navegação direta em produção deve funcionar pelo fallback SPA.
- Clientes, produtos e categorias continuam sendo as mesmas entidades utilizadas por Vendas, Dashboard e Catálogo.
- A primeira fase de Empresas e Filiais não deve filtrar nem isolar dados existentes.
- Formas de pagamento e tabelas de preço novas não alteram automaticamente o cálculo ou salvamento de vendas nesta fase.

## Registros — fase 1

- Excluir uma empresa não exclui filiais, fornecedores, formas ou tabelas; apenas limpa o vínculo opcional.
- Excluir uma filial não exclui fornecedores ou tabelas de preço; apenas limpa o vínculo opcional.
- Excluir uma tabela de preço remove seus itens.
- Produto vinculado a item de tabela de preço não pode ser excluído enquanto o vínculo existir.
- Tabelas de preço cadastradas ainda não mudam os preços usados em Vendas.
- Formas de pagamento cadastradas ainda não substituem o texto livre usado em Vendas.
