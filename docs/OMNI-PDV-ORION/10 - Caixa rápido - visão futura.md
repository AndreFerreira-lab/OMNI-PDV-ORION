---
tags:
  - caixa
  - pdv
  - vendas
  - planejamento
status: planejado
ultima_revisao: 2026-07-28
---

# Caixa rápido — visão atual e futura

## Escopo autorizado para a primeira versão

A primeira versão deve oferecer um fluxo simples de venda de balcão, reutilizando as estruturas e regras atuais:

- rota protegida `/caixa`;
- acesso pela sidebar com a permissão `vendas.criar`;
- busca e seleção de produtos;
- carrinho com quantidade, desconto e total;
- cliente opcional;
- seleção de uma forma de pagamento ativa;
- finalização com status `finalizada`;
- baixa de estoque pelo fluxo existente de `criarVenda`;
- nenhuma tabela, coluna, relação ou política RLS nova.

Esta versão não substitui a tela `/vendas`. As duas telas compartilham os mesmos dados, mas atendem fluxos diferentes: `/caixa` prioriza agilidade e `/vendas` mantém o gerenciamento completo.

## Versão completa futura — não implementada

A evolução completa do módulo deverá ser planejada como uma entrega independente, com backup, migrações reversíveis e validação de permissões antes da implantação.

### Operação do caixa

- cadastro de caixas e terminais;
- abertura e fechamento por operador;
- valor inicial de troco;
- suprimentos e sangrias;
- conferência por forma de pagamento;
- apuração de diferenças;
- bloqueio de venda sem sessão aberta, quando configurado.

### Venda e recebimento

- múltiplas formas de pagamento na mesma venda;
- cálculo de troco;
- leitura de código de barras;
- atalhos de teclado e operação otimizada para tela sensível ao toque;
- suspensão e retomada de venda;
- cancelamento, estorno e devolução com permissões independentes;
- impressão de comprovante e futura integração fiscal.

### Segurança, auditoria e continuidade

- permissões específicas para abrir, fechar, sangrar, suprir, cancelar, estornar e consultar;
- registro do operador, terminal, horários e justificativas;
- histórico imutável de movimentos;
- estratégia de recuperação de falhas e prevenção de venda duplicada;
- avaliação de operação offline e sincronização futura.

### Relatórios

- movimento por caixa, sessão e operador;
- vendas por período e forma de pagamento;
- valores de abertura, fechamento e divergências;
- cancelamentos, estornos, sangrias e suprimentos;
- exportação estruturada em PDF e planilha.

## Modelo de dados previsto

Os nomes abaixo são conceituais e ainda não existem no banco:

- `caixas`;
- `sessoes_caixa`;
- `movimentos_caixa`;
- `venda_pagamentos`;
- `vendas_suspensas`;
- `documentos_comprovantes`;
- `auditoria_caixa`.

Antes de criar essas tabelas, revisar o modelo atual de `vendas`, `itens_venda`, estoque, empresas, filiais, usuários e formas de pagamento. Todas as novas relações deverão começar opcionais quando isso preservar compatibilidade.

## Riscos conhecidos

- O fluxo atual de `criarVenda` executa cabeçalho, itens e baixa de estoque em etapas separadas, sem uma transação única.
- A versão completa exigirá uma função transacional no banco para evitar vendas parciais.
- Cancelamentos e devoluções precisarão de regras explícitas para recomposição de estoque e auditoria.
- Integrações fiscais e periféricos dependem de requisitos, equipamentos e legislação ainda não definidos.

## Critérios para iniciar a versão completa

1. Aprovação explícita do escopo.
2. Backup validado do código e do banco.
3. Desenho e revisão das tabelas, relações, RLS e rollback.
4. Definição dos equipamentos e requisitos fiscais.
5. Protótipo aprovado do fluxo do operador.
6. Testes de concorrência, estoque, permissões e recuperação de falhas.

