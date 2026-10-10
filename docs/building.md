# Build e entrega

## Build local

```bash
pnpm build
```

O comando compila primeiro os packages internos em ordem de dependência,
verifica tipos, compila `functions` e packages, gera
`apps/web/dist` com Vite e executa um smoke HTTP sobre o artefato.

## Instalação reproduzível

```bash
pnpm install --frozen-lockfile
```

O monorepo usa um `pnpm-lock.yaml`. Node 24.19.0 e pnpm 11.19.0 ficam alinhados
entre `.nvmrc`, `packageManager`, engines e CI. `pnpm-workspace.yaml` permite
scripts de build somente para `@firebase/util`, `re2` e `protobufjs`,
transitivos do Firebase SDK e CLI.

## Variáveis de ambiente

Variáveis web começam com `VITE_` e são públicas. A leitura ocorre apenas em
`apps/web/src/shared/config/env.ts`. Passe valores no build sem registrar
segredos no repositório.

## Integração contínua

`.github/workflows/ci.yml` possui três jobs em Node 24:

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

## Packages internos

`pnpm build:packages` gera os exports `dist` antes de lint, typecheck e testes
web. O E2E usa o filtro `@poe-crafter/web...` com build recursivo para incluir
as dependências internas mesmo em checkout limpo. Para um build web isolado,
use:

```bash
pnpm --filter @poe-crafter/web... -r build
```

Vitest e `@vitest/coverage-v8` devem ser atualizados juntos, inclusive em majors;
o grupo específico do Dependabot mantém esse contrato de peer dependency.

## Transporte Firestore

O override de `@grpc/grpc-js` aplica-se somente ao consumidor
`@firebase/firestore`, que fixa uma linha vulnerável. O contrato
`scripts/firestore-transport.test.mjs` exercita o SDK real contra um servidor
gRPC loopback no projeto demo, incluindo leitura e commit da transação.
