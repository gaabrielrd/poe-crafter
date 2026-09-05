# Runtime Node 24 e importação de item por texto

- **Data**: 2026-09-05
- **Branch**: `codex/migrate-pnpm-monorepo`
- **Plano de origem**: `docs/tasks/importacao-de-item-por-texto.md` e ADR 0018

## Objetivo

Alinhar o projeto ao Node disponível no ambiente (`24.14.1`) e entregar a
primeira capacidade funcional: colar um item de PoE 1, interpretar seus campos e
revisar o alvo normalizado antes do planejamento.

## Funcionalidades entregues

- **Política Node 24** — manifesto raiz, `.nvmrc`, CI, Functions, Firebase,
  testes e documentação usam Node 24; `jsdom` foi ajustado para `29.1.x`, que
  aceita Node 24.14.1 sem relaxar `engineStrict`.
- **Importação por texto** — a rota `/new` interpreta um único item em inglês,
  reconhece base, defesas, influências, qualidade, sockets, prefixes/suffixes,
  ranges e modificadores, e mostra o resumo para revisão.

## Critérios de aceite

- [x] `pnpm install --frozen-lockfile` funciona com Node 24.14.1.
- [x] `pnpm check:toolchain` aceita pnpm 11.19.0 e Node 24.14.1.
- [x] Entradas vazias, acima de 20 KB, múltiplas ou sem base são rejeitadas.
- [x] O exemplo `Divine Crown` é normalizado com influências, affixes, ranges e
      modificadores visíveis.
- [x] `/new` é utilizável por teclado a partir de 360 px.
- [x] `pnpm validate` e E2E Chromium passam.

## Arquivos alterados

| Área               | Arquivos principais                                                                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime            | `package.json`, `.nvmrc`, `functions/package.json`, `firebase.json`, `.github/workflows/ci.yml`, `pnpm-lock.yaml`                                                         |
| Contratos e parser | `packages/shared-types/src/index.ts`, `apps/web/src/features/item-import/`                                                                                                |
| Interface e rotas  | `apps/web/src/app/App.tsx`, `apps/web/src/app/routes/index.tsx`, `apps/web/src/features/home/components/HomePage.tsx`, `apps/web/src/shared/ui/textarea.tsx`              |
| Testes             | `apps/web/src/features/item-import/tests/`, `e2e/app.spec.ts`, `e2e/__screenshots__/win32/`, `scripts/check-toolchain.test.mjs`, `scripts/check-firebase-config.test.mjs` |
| Documentação       | `README.md`, `docs/architecture.md`, `docs/building.md`, `docs/integrations.md`, `docs/testing.md`, `docs/decisions/0018-node-24-runtime.md`                              |

## Testes

| Teste                                                             | Tipo                  | Resultado                                        |
| ----------------------------------------------------------------- | --------------------- | ------------------------------------------------ |
| `apps/web/src/features/item-import/tests/parse-item-text.test.ts` | unidade               | 6 casos aprovados                                |
| `apps/web/src/features/item-import/tests/ItemImportPage.test.tsx` | UI                    | 3 casos aprovados                                |
| suíte web Vitest                                                  | unidade               | 19 testes aprovados                              |
| `e2e/app.spec.ts`                                                 | E2E                   | fluxo de importação aprovado                     |
| `e2e/styleguide.spec.ts`                                          | visual/acessibilidade | 7 cenários aprovados após inspeção dos baselines |

Saída real:

```text
pnpm --filter @poe-crafter/web test:coverage
Test Files  4 passed (4)
Tests  19 passed (19)
Statements 93.24% · Branches 84.61% · Functions 93.93% · Lines 94.73%

pnpm test:e2e
10 passed (11.0s)
```

## Validações executadas

| Comando                          | Resultado                         |
| -------------------------------- | --------------------------------- |
| `pnpm install --frozen-lockfile` | Verde em Node 24.14.1             |
| `pnpm check:toolchain`           | Verde: pnpm 11.19.0; Node 24.14.1 |
| `pnpm validate`                  | Verde                             |
| `pnpm test:e2e`                  | Verde: 10/10                      |

## Fora do escopo

OCR, upload, autenticação, persistência, ligas, preços, classificação de
modificadores, validação de craftabilidade e planejamento permanecem para os
próximos incrementos.

## Limitações e pendências conhecidas

- O parser é local e síncrono; a futura API de parsing deverá reutilizar os
  contratos sem acoplar a tela ao backend.
- Linhas não reconhecidas são preservadas para revisão, não validadas como regra
  de crafting.
- A documentação histórica do marco Node 22 permanece preservada e apontada
  para a ADR 0018.

## Como verificar manualmente

1. Execute `pnpm dev`.
2. Abra `/new` ou clique em **Importar item** na home.
3. Cole o exemplo `Divine Crown` do plano da feature e clique em **Interpretar
   item**.
4. Confirme que a base, as influências, os affixes e os modificadores aparecem;
   sem `ItemLevel`, a tela informa que a confirmação está bloqueada.
