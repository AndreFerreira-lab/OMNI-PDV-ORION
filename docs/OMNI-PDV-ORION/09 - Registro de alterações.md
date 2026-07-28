---
tags:
  - changelog
  - histórico
status: contínuo
ultima_revisao: 2026-07-28
---

# Registro de alterações

## 2026-07-28 — Registros fase 1

- Criada a central de cadastros para Empresas, Filiais, Fornecedores, Formas de pagamento e Tabelas de preço.
- Clientes, Produtos e Categorias foram centralizados por atalhos, preservando as telas e rotas existentes.
- Usuários permaneceram exclusivamente em Administração.
- Sidebar transformada em menu expansível com oito cadastros.
- Criadas seis tabelas novas com relações opcionais, índices, constraints e RLS.
- Nenhuma coluna ou tabela anterior foi alterada ou excluída.
- Aplicada a migração `006_registros_fase1.sql`; criado rollback separado e destrutivo somente para os dados novos.
- Criado backup ZIP validado e bundle Git completo antes da migração.
- Validados build com 691 módulos, navegação por abas, leitura, criação, edição e exclusão com usuário administrador.
- Registro temporário de teste removido após a validação.
- Gestão de itens das tabelas de preço permanece para a próxima etapa.
- Branch `codex/admin-permissions` enviada ao GitHub e Preview criado na Vercel.
- Preview ficou `READY`, sem erros de build ou runtime; produção permaneceu inalterada.

## 2026-07-28 — Recuperação de senha

- Adicionada a opção **Esqueci minha senha** na tela de login.
- Implementado o envio do email de recuperação pelo Supabase Auth.
- Criada a rota pública `/redefinir-senha` para definição e confirmação da nova senha.
- A nova senha exige no mínimo 8 caracteres; após a alteração, a sessão é encerrada.
- Documentados os redirects obrigatórios do Supabase Auth para ambiente local e produção.
- Arquivos afetados: `src/pages/Login.tsx`, `src/pages/RedefinirSenha.tsx`, `src/App.tsx`, `src/index.css` e documentação relacionada.
- Banco e migrações: sem alterações.
- Configuração externa pendente de validação: redirects do Supabase Auth.

## 2026-07-28 — Atualização visual do Login

- Reformulada a tela de Login conforme a identidade escura do OMNI PDV ORION.
- Reutilizados o logotipo e a imagem de rede existentes no projeto.
- Adicionados layout responsivo, contraste adequado, estados de foco e carregamento.
- Adicionada opção de mostrar/ocultar senha e validação de campos obrigatórios.
- Preservados Supabase Auth, cadastro, restauração de sessão e redirecionamento.
- Arquivos alterados: `src/pages/Login.tsx` e `src/index.css`.
- Banco, permissões e rotas: sem alterações.

## 2026-07-28 — Administração e permissões customizáveis

- Criadas telas funcionais de perfis, usuários, exceções e unidades organizacionais.
- Criadas 36 permissões por módulo e ação.
- Implementados múltiplos perfis e perfil principal por usuário.
- Implementadas exceções individuais com opções herdar, permitir e negar.
- Protegidos rotas, menu e operações Supabase com o mesmo catálogo.
- Substituídas políticas públicas de negócio por RLS baseada em permissões.
- Preservado o usuário existente como administrador.
- Criadas migrações `002_administracao_permissoes.sql`, `003_administracao_operacoes.sql`, `004_administracao_delegavel.sql` e `005_politicas_granulares.sql`.
- Separadas políticas de criar, editar e excluir para permitir delegação granular.
- Validado `npm run build` com 689 módulos.

## 2026-07-28 — Base documental

- Criado o cofre Obsidian do OMNI PDV ORION.
- Documentadas arquitetura, rotas, telas, banco, relações, fluxos, segurança e implantação.
- Registrado o estado funcional e os débitos técnicos conhecidos.
- Criado checklist obrigatório para futuras mudanças.

## Modelo para novos registros

### AAAA-MM-DD — Título

- Objetivo:
- Arquivos alterados:
- Telas/rotas afetadas:
- Tabelas/funções afetadas:
- Migração:
- Riscos:
- Validações executadas:
- URL do PR/deploy:
