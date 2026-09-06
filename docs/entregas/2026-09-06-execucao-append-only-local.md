# Execução append-only local

- **Data**: 2026-09-06
- **Branch**: `master`
- **Plano de origem**: `docs/tasks/execucao-append-only-local.md`

## Objetivo

Permitir que o jogador inicie uma estratégia publicada, registre recursos e o
resultado de cada tentativa e acompanhe o passo atual sem apagar o histórico.

## Funcionalidades entregues

- **Sessão local de execução** — inicia uma estratégia e mostra o passo atual,
  total acumulado e o aviso de que os dados ainda não sincronizam com
  Firestore.
- **Eventos append-only** — registra `success`, `retry` e `restart` com id,
  sequência, timestamp, recurso e custo; `skipped` só é aceito por uma receita
  que o permita.
- **Validação recuperável** — valores de recurso inválidos ou outcomes
  proibidos preservam a edição e exibem erro acessível.
- **Histórico visível** — cada evento permanece na ordem registrada e o sucesso
  final conclui a sessão sem remover tentativas anteriores.

## Critérios de aceite

- [x] Iniciar uma estratégia mostra o passo atual e permite registrar recursos e
      `success`, `retry` ou `restart`.
- [x] Cada registro cria evento imutável com sequência, resultado e custo; o
      total acumulado nunca diminui.
- [x] Retry mantém o passo, restart volta ao início e sucesso final conclui o
      craft sem apagar histórico.
- [x] Outcome `skipped` só aparece quando o passo permitir explicitamente.
- [x] Falhas de validação preservam a edição local e explicam o campo.
- [x] Testes, `pnpm validate`, E2E, documentação e ADR passam.

## Arquivos alterados

| Arquivo                                                                    | Mudança                                                    |
| -------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `packages/planner/src/execution.ts`                                        | Estado versionado, eventos e transições puras append-only. |
| `packages/planner/src/execution.test.ts`                                   | Testes de retry, restart, sucesso, custos e validações.    |
| `packages/planner/src/index.ts`                                            | Exporta o contrato de execução e marca passos puláveis.    |
| `apps/web/src/features/strategy-planning/components/StrategyExecution.tsx` | UI local de execução e histórico acessível.                |
| `apps/web/src/features/strategy-planning/tests/StrategyExecution.test.tsx` | Testes de registro, conclusão e erro de recurso.           |
| `apps/web/src/features/strategy-planning/`                                 | Integra execução aos cartões de estratégia.                |
| `e2e/app.spec.ts`                                                          | Fluxo Chromium de retry e sucesso final.                   |
| `docs/decisions/0028-execucao-append-only-local.md`                        | Decisão do contrato efêmero e imutável.                    |

## Testes

| Teste                                                                      | Tipo         | Resultado                                         |
| -------------------------------------------------------------------------- | ------------ | ------------------------------------------------- |
| `packages/planner/src/execution.test.ts`                                   | unidade      | 2 testes aprovados.                               |
| `packages/planner/src/index.test.ts`                                       | unidade      | 4 testes aprovados.                               |
| `apps/web/src/features/strategy-planning/tests/StrategyExecution.test.tsx` | componente   | Registro, custo, conclusão e validação aprovados. |
| suíte web                                                                  | unidade      | 17 arquivos, 59 testes aprovados.                 |
| `e2e/app.spec.ts`                                                          | E2E Chromium | 13 testes aprovados.                              |

## Validações executadas

| Comando             | Resultado                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| `pnpm validate`     | Verde; 17 arquivos/59 testes web, 89,83% statements, 81,98% branches, 91,40% functions e 92,84% lines. |
| `pnpm test:e2e`     | Verde; 13 testes Chromium aprovados.                                                                   |
| `pnpm check:docs`   | Verde.                                                                                                 |
| `pnpm format:check` | Verde.                                                                                                 |
| `git diff --check`  | Verde.                                                                                                 |

## Fora do escopo

Persistência Firestore, sincronização, reconciliação offline, resumo RF-10,
recálculo RF-11, novas receitas, preços e automação do cliente do jogo.

## Limitações e pendências conhecidas

Os eventos existem apenas no estado da página e são perdidos ao recarregar. O
dataset starter não permite `skipped`, embora o contrato já valide a permissão
por passo. O próximo incremento deve calcular o resumo estimado versus real
antes de adicionar persistência durável.

## Como verificar manualmente

1. Em `/new`, valide um item suportado, prepare o pedido e gere estratégias.
2. No cartão **Bancada de vida**, clique em **Iniciar execução local**.
3. Informe `Orb` e `2`, registre **retry** e depois **sucesso**.
4. Confirme que o retry manteve o passo, o sucesso final mostrou **Craft
   concluído**, o custo acumulado é `2.0 chaos` e os dois eventos continuam no
   histórico.
