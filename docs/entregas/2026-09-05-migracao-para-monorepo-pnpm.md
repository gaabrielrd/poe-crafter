# Migração estrutural para monorepo pnpm

- **Data**: 2026-09-05
- **Branch**: `codex/migrate-pnpm-monorepo`
- **Checkpoint publicado**: `bb78417`
- **Plano de origem**:
  [`docs/tasks/migracao-estrutural-para-monorepo.md`](../tasks/migracao-estrutural-para-monorepo.md)

## Objetivo

Transformar a aplicação inicial em uma fundação executável para o PoE Crafting
Planner: monorepo pnpm, web em workspace próprio, sistema visual local e limites
seguros para packages e Firebase, sem implementar features de crafting antes de
seus planos específicos.

## Funcionalidades entregues

- **Workspace reproduzível** — a raiz coordena web, Functions e dois packages
  por pnpm 11.19.0 e Node 22.22.2, com lockfile único e ciclos proibidos.
- **Aplicação web migrada** — `/`, `/styleguide`, fallback de erro e 404 vivem em
  `apps/web`, com aliases consistentes em editor, testes e bundle.
- **Sistema visual próprio** — Tailwind CSS, componentes shadcn/ui locais,
  TheMix/Archivo autohospedadas, ícones Lucide e tokens semânticos substituem
  Vitru e CSS Modules.
- **Fundação Firebase segura** — Hosting local, worktree de Functions vazio,
  Emulator Suite e regras Firestore/Storage deny-all usam somente o projeto
  fictício `demo-poe-crafter`.
- **Qualidade do monorepo** — arquitetura, docs, toolchain, styleguide,
  configuração Firebase, gerador, hooks, CI, build e smoke foram adaptados.
- **Operação documentada** — README, AGENTS, guias, skills e ADRs descrevem os
  mesmos comandos, limites e decisões atuais.

## Critérios de aceite

- [x] Instalação limpa com `pnpm install --frozen-lockfile` e sem lockfile npm.
- [x] Cinco projetos são reconhecidos pela raiz e todos os workspaces compilam.
- [x] A SPA vive somente em `apps/web` e as três rotas observáveis funcionam.
- [x] Não existem imports Vitru nem CSS Modules no runtime.
- [x] Tailwind/shadcn, tokens, fontes locais e `/styleguide` estão validados.
- [x] Home, styleguide e 404 foram inspecionados em desktop e 360 px.
- [x] Functions não publica handler fictício; regras negam acesso por padrão.
- [x] Scripts, hooks, CI, Dependabot, documentação e skills usam pnpm.
- [x] `pnpm validate`, E2E Chromium e teste dos emuladores ficaram verdes.
- [x] A revisão final não encontrou segredo, output gerado ou feature de produto
      fora do escopo.

## Arquivos alterados

| Área                                                | Mudança                                                              |
| --------------------------------------------------- | -------------------------------------------------------------------- |
| `apps/web`                                          | SPA Vite/React, tema Tailwind, componentes locais, testes e fontes.  |
| `functions`                                         | Workspace TypeScript Node 22 com API pública vazia.                  |
| `packages/shared-types` e `packages/poe-data`       | Limites compartilhados vazios e compiláveis.                         |
| `firebase.json`, `firestore.rules`, `storage.rules` | Hosting, emuladores e acesso negado por padrão.                      |
| `scripts` e `package.json`                          | Gates, gerador, smoke, verificação dos emuladores e comandos pnpm.   |
| `.github` e `.husky`                                | CI, Dependabot e hooks alinhados ao monorepo.                        |
| `docs`, `README.md`, `AGENTS.md` e `skills`         | Produto, arquitetura, processo, decisões e instruções atuais.        |
| `e2e`                                               | Nove fluxos Chromium e seis baselines visuais Windows inspecionadas. |

## Testes

| Teste                                          | Tipo               | O que cobre                                                                       |
| ---------------------------------------------- | ------------------ | --------------------------------------------------------------------------------- |
| `apps/web/src/app/tests/App.test.tsx`          | unidade/componente | Home, layout, 404 e `errorElement`.                                               |
| `apps/web/src/shared/config/tests/env.test.ts` | unidade            | Leitura e validação centralizada do ambiente web.                                 |
| `scripts/*.test.mjs`                           | contrato           | 38 casos de arquitetura, toolchain, docs, Firebase, styleguide, gerador e bundle. |
| `e2e/app.spec.ts`                              | E2E                | Fluxo principal, fallback, teclado e overflow em 360 px.                          |
| `e2e/styleguide.spec.ts`                       | E2E visual         | Tokens, fontes e seis screenshots desktop/mobile.                                 |
| `scripts/verify-emulators.mjs`                 | integração local   | Hosting 200 e Firestore/Storage 403 no projeto demo.                              |

Saída das suítes:

```text
Vitest: 2 arquivos, 10 testes aprovados.
Contratos Node: 38 testes aprovados.
Playwright Chromium: 9 testes aprovados.
Emuladores: Hosting 200; Firestore 403; Storage 403.
```

## Validações executadas

| Comando                                         | Resultado real                                                |
| ----------------------------------------------- | ------------------------------------------------------------- |
| `pnpm install --frozen-lockfile` em cópia limpa | Verde; 1.076 pacotes instalados e cópia descartável removida. |
| `pnpm peers check`                              | Verde; nenhuma incompatibilidade de peer.                     |
| `pnpm audit --audit-level=high`                 | Verde; nenhuma vulnerabilidade alta ou crítica.               |
| `pnpm validate`                                 | Verde no Node 22.22.2 e pnpm 11.19.0.                         |
| `pnpm test:e2e`                                 | Verde; 9/9 no Chromium, incluindo seis comparações visuais.   |
| `pnpm test:emulators`                           | Verde no projeto demo; Hosting e regras exercitados.          |
| Hook `pre-commit`                               | Verde com ESLint/Prettier sobre os arquivos preparados.       |
| Hook `pre-push`                                 | Verde com typecheck dos workspaces e 10 testes web.           |

```text
Cobertura web: 95,34% statements; 80% branches; 100% functions; 95% lines.
Build web: 1.914 módulos; JS 330,57 kB; CSS 23,94 kB; smoke do bundle OK.
```

## Revisão final

- O downgrade de ESLint 10 para a linha 9 removeu o override que escondia um
  peer incompatível de `eslint-plugin-jsx-a11y`.
- `lint-staged` 16.3.4 preserva os hooks nesta máquina com Git 2.28; a linha 17
  exige Git 2.32 ou mais recente.
- `dev:emulators` não inicia Functions enquanto não existir handler e SDK.
- O cache local do pnpm e logs de emulador estão ignorados e não entram no diff.

## Fora do escopo

- Importação de item, parser, simulador, motor determinístico e estratégias.
- Login Google, Firestore liberado, uploads, OCR e App Check.
- Integração RePoE, poe.ninja, Cloud Vision ou qualquer API da GGG.
- Deploy ou configuração de um projeto Firebase real.

## Limitações e pendências conhecidas

- A linha de base anterior não possuía o conjunto completo de screenshots
  desktop/mobile previsto no plano. A equivalência funcional foi protegida por
  testes de rota e a única baseline Vitru existente, de macOS, foi removida após
  a inspeção das seis novas referências.
- `firebase-tools` 15.29.0 traz cinco advisories moderados transitivos (`uuid`,
  `@opentelemetry/core`, `qs` e `stream-json`). O gate alto/crítico passa; não
  foram impostos overrides incompatíveis sobre dependências do CLI.
- As baselines pixel a pixel geradas nesta entrega são de Windows. Em outra
  plataforma, o contrato determinístico de tokens/fontes roda e a comparação
  visual é pulada até existir baseline inspecionada para aquele sistema.
- A execução remota do workflow depende do GitHub após o push; a configuração
  local equivalente foi validada integralmente.

## Como verificar manualmente

1. Use Node 22.22.2 e execute `pnpm install --frozen-lockfile`.
2. Execute `pnpm validate` e espere todos os gates verdes.
3. Execute `pnpm test:e2e` e espere 9 testes Chromium aprovados.
4. Com Java 21 ou mais recente, execute `pnpm test:emulators` e confirme
   Hosting 200, Firestore 403 e Storage 403.
5. Execute `pnpm dev`, abra `/`, `/styleguide` e uma rota inexistente e confira
   desktop e 360 px.
