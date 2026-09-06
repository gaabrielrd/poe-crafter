# Geração e comparação de estratégias

- **Data**: 2026-09-06
- **Branch**: `master`
- **Plano de origem**: `docs/tasks/geracao-e-comparacao-de-estrategias.md`

## Objetivo

Entregar o primeiro contrato de planejamento que transforma um alvo aceito e um
pedido versionado em estratégias completas, comparáveis e reproduzíveis, sem
publicar passos parciais nem iniciar a execução do craft.

## Funcionalidades entregues

- **Planner puro** — filtra receitas por mecânica, nível e afixos requeridos,
  calcula métricas e ordena até quatro estratégias.
- **Job assíncrono local** — anuncia `queued`, `validating`, `searching`,
  `simulating` e terminal `succeeded`/`failed`.
- **Dataset versionado** — cada resultado carrega versão de game data e snapshot
  de preços do starter; overrides manuais substituem o custo da receita.
- **Integração web** — mostra carregamento, comparação e falha explícita apenas
  depois de `PlanningRequest` preparado e craftabilidade `accepted`.

## Critérios de aceite

- [x] Estratégias completas elegíveis são publicadas em quantidade limitada a
      quatro.
- [x] Alvos não aceitos e receitas incompletas nunca publicam passos.
- [x] Filtros, métricas, deduplicação e ranking são determinísticos.
- [x] Cada estratégia mantém versões de dados/preços e métricas comparáveis.
- [x] A interface cobre sucesso/erro e não inicia execução ou persiste job.

## Arquivos alterados

| Arquivo                                                                   | Mudança                                                      |
| ------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `packages/planner/src/index.ts`                                           | Contrato, dataset starter, busca, métricas e job assíncrono. |
| `packages/planner/src/index.test.ts`                                      | Testes de filtros, ranking, limite, deduplicação e fases.    |
| `apps/web/src/features/strategy-planning/components/StrategyPlanning.tsx` | Estados do job e cartões comparáveis.                        |
| `apps/web/src/features/item-import/components/ItemImportPage.tsx`         | Integração após pedido preparado.                            |
| `e2e/app.spec.ts`                                                         | Fluxo de geração de estratégias no navegador.                |
| `docs/decisions/0026-contrato-de-estrategias-e-job-local.md`              | ADR do contrato e do starter local.                          |

## Testes

| Teste                                      | Resultado                         |
| ------------------------------------------ | --------------------------------- |
| `pnpm --filter @poe-crafter/planner test`  | 4 testes aprovados.               |
| `pnpm --filter @poe-crafter/web test:unit` | 16 arquivos, 57 testes aprovados. |

## Validações executadas

| `pnpm validate` | Verde; 16 arquivos/57 testes web, cobertura 89,69% statements, 81,72% branches, 91,38% functions e 92,69% lines. |
| `pnpm test:e2e` | Verde; 13 testes Chromium aprovados. |
| `pnpm --filter @poe-crafter/planner test` | Verde; 4 testes aprovados. |
| `pnpm check:docs` / `pnpm format:check` / `git diff --check` | Verdes. |

## Fora do escopo

Dataset completo do jogo, RePoE, poe.ninja, Functions, filas persistidas,
explicação detalhada, execução, resumo, recálculo, inventário e controle de
custo operacional.

## Limitações e pendências conhecidas

O dataset starter cobre somente receitas explícitas para os códigos de afixo
usados nos fixtures atuais. Seus custos são dados versionados de demonstração,
não cotação atual. O próximo incremento deve ampliar game data/preços e mover o
job para uma fronteira persistida antes de prometer cobertura completa.

## Como verificar manualmente

1. Execute `pnpm dev` e abra `/new`.
2. Importe um item com `Prefix: IncreasedLife9`, confirme e valide a
   craftabilidade.
3. Prepare o pedido e clique em **Gerar estratégias**.
4. Observe as fases e os cartões de Bancada, Fóssil e Essência, com custos,
   P90, tentativas, probabilidade e risco.
