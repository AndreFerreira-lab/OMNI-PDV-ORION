---
tags:
  - autenticação
  - segurança
  - rls
status: atual
ultima_revisao: 2026-07-28
---

# Autenticação e segurança

## Autenticação atual

- Provedor: Supabase Auth por email e senha.
- Cadastro: `signUp`.
- Login: `signInWithPassword`.
- Solicitação de recuperação: `resetPasswordForEmail`.
- Redefinição de senha: `updateUser`.
- Sessão inicial: `getSession`.
- Atualização de sessão: `onAuthStateChange`.
- Logout: `signOut`.
- Rotas privadas: `ProtectedRoute`.

## Recuperação de senha

1. Na tela de login, o usuário informa o email em **Esqueci minha senha**.
2. O frontend chama `resetPasswordForEmail` com redirecionamento para `/redefinir-senha`.
3. O Supabase envia o link de recuperação para o email informado.
4. A rota pública `/redefinir-senha` valida a sessão de recuperação por `getSession` e pelo evento `PASSWORD_RECOVERY`.
5. O usuário informa uma nova senha com no mínimo 8 caracteres e sua confirmação.
6. O frontend chama `updateUser`; após o sucesso, encerra a sessão e retorna ao login.

O Supabase Auth deve permitir os redirects exatos dos ambientes local e de produção descritos em [[06 - Implantação e ambientes]]. Sem essa configuração, o email pode ser enviado, mas o link não concluirá o fluxo no endereço correto.

## Dados do usuário

O cabeçalho usa o email da sessão para nome, inicial e identificação. A Administração utiliza `usuarios` para nome, cargo, status, perfis e exceções.

## Permissões efetivas

1. Usuário inativo recebe nenhuma permissão.
2. Perfil Administrador recebe acesso total.
3. Uma exceção individual tem prioridade sobre os perfis.
4. Sem exceção, as permissões de todos os perfis do usuário são combinadas.
5. Rotas, menu e RLS consultam os mesmos códigos.

Novos usuários recebem o perfil Vendedor. Os usuários existentes na implantação inicial foram promovidos a Administrador para preservar o acesso.

## Chaves e variáveis

Variáveis esperadas:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

A chave anônima/publishable pode existir no frontend, mas nunca usar `service_role` no navegador. O cliente atual contém valores diretamente no código; a migração para `import.meta.env` está registrada como débito técnico.

## RLS

Categorias, produtos, clientes, vendas e itens exigem permissões específicas. As tabelas de Registros usam as ações `registros.visualizar`, `registros.criar`, `registros.editar` e `registros.excluir`. As tabelas administrativas aceitam escrita conforme permissões administrativas. Empresas e Filiais existem, mas o isolamento empresarial dos dados antigos ainda não foi ativado.

## Regras obrigatórias

- Nunca registrar senhas, tokens ou chaves privadas.
- Nunca enviar `service_role` para Vercel como variável `VITE_*`.
- Não desabilitar RLS para resolver erro da interface.
- Toda nova tabela exposta ao frontend deve ter RLS e políticas explícitas.
- Mudanças de autenticação devem validar login, cadastro, recuperação de senha, restauração de sessão, logout e acesso direto a rota protegida.
