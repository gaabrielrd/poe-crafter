# Build e entrega

## Build local

```bash
pnpm build
```

O comando verifica tipos, compila `functions` e packages, gera
`apps/web/dist` com Vite e executa um smoke HTTP sobre o artefato.

## Instalação reproduzível

```bash
pnpm install --frozen-lockfile
```

O monorepo usa um `pnpm-lock.yaml`. Node 22.22.2 e pnpm 11.19.0 ficam alinhados
entre `.nvmrc`, `packageManager`, engines e CI. `pnpm-workspace.yaml` permite
scripts de build somente para `re2` e `protobufjs`, transitivos do Firebase CLI.

## Variáveis de ambiente

Variáveis web começam com `VITE_` e são públicas. A leitura ocorre apenas em
`apps/web/src/shared/config/env.ts`. Passe valores no build sem registrar
segredos no repositório.

## Integração contínua

`.github/workflows/ci.yml` possui três jobs em Node 22:

- Validate: instalação congelada e `pnpm validate`.
- Auditoria: `pnpm audit --audit-level=high`.
- E2E: Chromium e `pnpm test:e2e`.

## Firebase Hosting

`firebase.json` aponta Hosting para `apps/web/dist` e reescreve rotas da SPA para
`index.html`. Este marco não autoriza deploy nem fixa project IDs. Antes do
primeiro deploy, crie plano próprio para ambientes, App Check, regras e rollback.

## Smoke e E2E

`pnpm smoke:build` verifica `index.html` e todos os assets referenciados por HTTP.
Ele não executa JavaScript. `pnpm test:e2e` complementa o smoke em navegador real
e usa porta efêmera.
