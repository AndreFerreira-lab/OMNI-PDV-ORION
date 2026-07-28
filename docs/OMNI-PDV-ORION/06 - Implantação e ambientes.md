---
tags:
  - vercel
  - deploy
  - ambientes
status: atual
ultima_revisao: 2026-07-28
---

# Implantação e ambientes

## Produção

- URL: https://omni-pdv-orion.vercel.app/
- Projeto Vercel: `omni-pdv-orion`
- Time: `AuraSmoke`
- Repositório: `AndreFerreira-lab/OMNI-PDV-ORION`
- Branch de produção: `main`

## Configuração Vercel

| Campo | Valor |
|---|---|
| Framework | Vite |
| Root Directory | `./` |
| Install Command | `npm install` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

Variáveis necessárias:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Aplicar em Production e Preview.

## Redirects do Supabase Auth

Em **Authentication > URL Configuration > Redirect URLs**, permitir:

- Local: `http://127.0.0.1:5173/redefinir-senha`
- Produção: `https://omni-pdv-orion.vercel.app/redefinir-senha`

Esses endereços são necessários para que o link enviado por **Esqueci minha senha** retorne ao sistema. Se o servidor local for aberto por outro host ou porta, o endereço correspondente também deve ser cadastrado.

## SPA

`vercel.json` reescreve qualquer caminho para `/index.html`. Isso permite abrir diretamente rotas como `/dashboard` sem erro 404. Não remover sem configurar alternativa equivalente.

## Desenvolvimento local

```text
npm install
npm run dev
```

Servidor padrão: porta 5173.

## Validação antes do deploy

1. `npm run build`.
2. Confirmar que `dist/index.html` foi gerado.
3. Validar login.
4. Validar solicitação e conclusão da recuperação de senha.
5. Abrir uma rota interna diretamente.
6. Executar um CRUD seguro em Preview quando a mudança tocar dados.
7. Conferir erros de console e rede.

## Processo recomendado

1. Alterar em branch.
2. Atualizar documentação e migrações.
3. Compilar localmente.
4. Publicar PR.
5. Validar Preview.
6. Fazer merge em `main`.
7. Confirmar deploy de produção.
