# Configuração versionada de planejamento

- **Data**: 2026-09-06
- **Branch**: `master`
- **Plano de origem**: `docs/tasks/configuracao-versionada-de-planejamento.md`

## Objetivo

Permitir que um alvo aceito pelo engine receba preferências explícitas para o
futuro planner, sem apresentar estratégia, custo atual ou job antes de esses
contratos existirem.

## Funcionalidades entregues

- **Request versionado** — cria `PlanningRequest` schema `1` com objetivo,
  mecânicas excluídas e overrides opcionais em chaos.
- **Validação determinística** — rejeita objetivo inválido, duplicatas,
  recursos vazios, preços vazios/negativos/não finitos e a exclusão de todas as
  mecânicas aplicáveis.
- **Configuração na importação** — mostra o formulário somente para resultados
  `accepted`, com resumo de “pedido preparado” e callback transitória; nenhum
  job, estratégia ou gravação Firestore é iniciado.

## Critérios de aceite

- [x] Alvos `accepted` exibem a configuração; `rejected` e `unsupported` não
      exibem a preparação.
- [x] O objetivo é escolhido entre as quatro opções válidas.
- [x] Exclusões são editáveis e a última mecânica aplicável produz
      `no_search_space` sem callback.
- [x] Overrides inválidos mostram mensagens acionáveis e campos associados.
- [x] O request schema `1` tem arrays ordenados e permanece transitório.
- [x] Testes, validação completa, E2E, documentação e ADR estão verdes.

## Arquivos alterados

| Arquivo                                                                             | Mudança                                               |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `apps/web/src/features/planning-configuration/model/planning.ts`                    | Contrato e validação pura do request.                 |
| `apps/web/src/features/planning-configuration/components/PlanningConfiguration.tsx` | Formulário acessível e estados de preparação/erro.    |
| `apps/web/src/features/planning-configuration/tests/*`                              | Testes de modelo e comportamento observável.          |
| `apps/web/src/features/item-import/components/ItemImportPage.tsx`                   | Composição condicionada ao status `accepted`.         |
| `e2e/app.spec.ts`                                                                   | Fluxo E2E de configuração após craftabilidade aceita. |
| `docs/tasks/configuracao-versionada-de-planejamento.md`                             | Plano marcado como implementado.                      |
| `docs/decisions/0025-configuracao-versionada-de-planejamento.md`                    | Decisão arquitetural do contrato transitório.         |

## Testes

| Teste                                             | Tipo       | Resultado                                                  |
| ------------------------------------------------- | ---------- | ---------------------------------------------------------- |
| `planning.test.ts`                                | unidade    | Contrato, ordenação, duplicatas, preços e espaço de busca. |
| `PlanningConfiguration.test.tsx`                  | componente | Preparação, callback, erro e remoção de override.          |
| `pnpm --filter @poe-crafter/crafting-engine test` | package    | 5 testes aprovados.                                        |
| `pnpm test:contracts`                             | contratos  | 46 testes aprovados.                                       |

## Validações executadas

| Comando             | Resultado                                                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `pnpm validate`     | Verde; 15 arquivos/55 testes web, cobertura 89,33% statements, 81,61% branches, 91,04% functions e 92,43% lines. |
| `pnpm test:e2e`     | Verde; 13 testes Chromium aprovados.                                                                             |
| `pnpm lint`         | Verde.                                                                                                           |
| `pnpm check:docs`   | Verde.                                                                                                           |
| `pnpm format:check` | Verde.                                                                                                           |
| `git diff --check`  | Verde.                                                                                                           |

## Fora do escopo

Planner, ranking, simulação, explicação, snapshots de preços, providers,
Firestore para requests, jobs, filas, inventário, orçamento e execução de
crafts permanecem fora desta entrega.

## Limitações e pendências conhecidas

O catálogo de mecânicas é explícito e inicial; ainda não calcula quais são
aplicáveis a cada base. Overrides não representam preço atual. O próximo
incremento deve definir o contrato de busca/estratégia (RF-07) consumindo este
request e o resultado versionado do engine.

## Como verificar manualmente

1. Execute `pnpm dev` e abra `/new`.
2. Importe um item compatível e confirme o alvo até o resultado `accepted`.
3. Escolha um objetivo, adicione um override opcional e clique em
   **Preparar pedido**.
4. Confirme o status “Pedido preparado” e a mensagem de que nenhum job ou
   estratégia foi iniciado.
