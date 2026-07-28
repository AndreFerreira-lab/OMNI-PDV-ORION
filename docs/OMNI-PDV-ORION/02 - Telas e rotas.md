---
tags:
  - telas
  - rotas
  - interface
status: atual
ultima_revisao: 2026-07-28
---

# Telas e rotas

## Rotas

| Rota | Tela | Estado | Dados principais |
|---|---|---|---|
| `/` | Login | Funcional | Supabase Auth |
| `/redefinir-senha` | Redefinição de senha | Funcional | Supabase Auth |
| `/home` | Página inicial | Funcional | Ações rápidas estáticas |
| `/dashboard` | Dashboard | Funcional | vendas, produtos, clientes |
| `/analise-credito` | Análise de crédito | Parcial | clientes e vendas; análise não persistida |
| `/negocios` | Negócios | Em construção | Nenhum |
| `/atividades` | Atividades | Em construção | Nenhum |
| `/catalogo` | Catálogo | Funcional | produtos, categorias e clientes |
| `/clientes` | Clientes | Funcional | clientes |
| `/vendas` | Vendas | Funcional | vendas, itens, produtos e clientes |
| `/caixa` | Caixa Rápido | Funcional | vendas, itens, produtos, clientes e formas de pagamento |
| `/analise-pedidos` | Análise de pedidos | Em construção | Nenhum |
| `/consultas` | Consultas | Em construção | Nenhum |
| `/registros` | Registros | Funcional | empresas, filiais, fornecedores, formas e tabelas de preço |
| `/administracao` | Administração | Funcional | usuários, perfis, permissões e unidades |

Exceto `/` e `/redefinir-senha`, todas as rotas estão protegidas por sessão.

## Login

- Alterna entre login e cadastro.
- Login usa `signInWithPassword`.
- Cadastro usa `signUp`; a confirmação de email está temporariamente desativada no Supabase.
- Usuário autenticado é redirecionado para `/dashboard`.
- O formulário possui validação de campos obrigatórios, envio por Enter e estado de carregamento.
- A senha pode ser exibida ou ocultada pelo usuário.
- A opção **Esqueci minha senha** solicita um email de recuperação pelo Supabase Auth.
- O link recebido direciona para `/redefinir-senha`, onde o usuário define e confirma uma nova senha.
- A nova senha exige no mínimo 8 caracteres; após a alteração, a sessão é encerrada e o usuário retorna ao login.
- O visual segue a identidade escura Orion, utilizando o logotipo e a imagem de rede do projeto.
- Em telas menores, o painel institucional é ocultado e o formulário ocupa toda a largura.

## Layout global

- Menu lateral expansível com todas as rotas.
- Barra superior com atalhos visuais ainda sem comportamento.
- Menu do usuário exibe opções majoritariamente visuais.
- Logout chama `supabase.auth.signOut()` e retorna para `/`.
- Nome e avatar utilizam o campo `nome` da tabela `usuarios`; o email permanece como identificação secundária.

## Página inicial

- Apresenta saudação e atalhos de navegação.
- Não persiste dados.
- Alterações nos destinos precisam continuar coerentes com `src/App.tsx`.

## Dashboard

- Carrega vendas, produtos e clientes em paralelo.
- Separa vendas com status `pedido` e `orcamento`.
- Calcula totais e quantidades no frontend.
- Exibe gráficos e indicadores derivados dos dados atuais.
- O seletor de período existe na interface; validar qualquer alteração nos filtros antes de assumir persistência.

## Catálogo

- Lista produtos com categoria.
- Permite busca, filtro de estoque, categoria e preço.
- Cria, edita e exclui produtos.
- Permite criar categorias.
- Exibe clientes em fluxo auxiliar e seleção de cliente.
- Campos persistidos de produto: nome, descrição, preço, estoque, categoria e URL de imagem.

## Clientes

- Lista, busca e pagina clientes em blocos de 10.
- Permite criar, editar e excluir.
- Possui abas `clientes` e `prospects`; validar se `prospects` continua apenas visual antes de alterar.
- Campos persistidos: nome, telefone, email e endereço.
- Alguns indicadores visuais são derivados por posição, não por colunas do banco.

## Vendas

- Possui histórico e formulário de novo/edição.
- Carrega produtos, clientes e vendas.
- Permite criar cliente durante o pedido.
- Calcula total de itens, descontos e total geral no frontend.
- Salva cabeçalho em `vendas` e linhas em `itens_venda`.
- Baixa estoque por RPC após inserir os itens.
- Na edição, devolve estoque antigo, troca os itens e baixa o estoque novo.
- Visualização reutiliza o mesmo formulário em modo somente leitura.
- Exclusão remove a venda e seus itens em cascata.

## Caixa Rápido

- A primeira versão reutiliza o cadastro de produtos, clientes, formas de pagamento e o fluxo atual de criação de vendas.
- O acesso exige a permissão `vendas.criar`.
- Permite buscar produtos, controlar quantidade e desconto, selecionar cliente opcional e forma de pagamento.
- A quantidade não pode ultrapassar o estoque exibido e produtos sem estoque não podem ser adicionados.
- A venda é finalizada com status `finalizada` e baixa o estoque pelo mesmo serviço usado em Vendas.
- O preço unitário salvo nos itens já considera o desconto informado, mantendo a soma dos itens coerente com o total da venda.
- Não cria tabelas, relações nem políticas RLS.
- A arquitetura completa planejada está em [[10 - Caixa rápido - visão futura]].

## Análise de crédito

- Usa clientes e histórico de vendas.
- Score, inadimplência, risco e recomendação são gerados por funções locais determinísticas.
- O botão de salvar apenas mostra confirmação; a análise não é persistida.
- Não tratar os valores atuais como dados financeiros reais.

## Administração

- Possui abas de Perfis e Permissões, Usuários e Unidades Organizacionais.
- Perfis agrupam permissões por módulo e ação.
- O perfil Administrador mantém acesso total permanente.
- Usuários podem receber vários perfis, com um perfil principal.
- Exceções individuais podem permitir ou negar uma ação, substituindo os perfis.
- Usuários podem ser ativados ou desativados.
- Unidades organizacionais aceitam hierarquia entre unidade superior e unidades filhas.
- Rotas e itens do menu são filtrados conforme as permissões efetivas.
- Operações no banco também são protegidas por RLS.

## Registros — fase 1

- Centralizar cadastros de Empresas, Filiais, Clientes, Fornecedores, Produtos, Categorias, Formas de pagamento e Tabelas de preço.
- Usuários permanecem exclusivamente em Administração.
- Clientes, Produtos e Categorias reutilizam as telas, dados e rotas atuais.
- As rotas `/clientes` e `/catalogo` serão preservadas para não quebrar integrações.
- Empresas, Filiais, Fornecedores, Formas de pagamento e Tabelas de preço usam tabelas próprias.
- A tela possui visão geral, busca, estados vazio/erro/carregamento e CRUD condicionado às permissões.
- A aba ativa é sincronizada pela URL, por exemplo `/registros?aba=empresas`.
- Na primeira fase, relações novas são opcionais e nenhuma coluna existente foi modificada ou excluída.
- Tabelas de preço já possuem estrutura relacional para itens; a gestão dos itens por produto permanece para uma próxima etapa.

## Telas em construção

Negócios, Atividades, Análise de Pedidos e Consultas exibem apenas um título e a mensagem de construção. Ao implementá-las, atualizar este documento, [[03 - Banco de dados Supabase]] e os fluxos correspondentes.
