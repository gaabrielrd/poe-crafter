# Recalcular sem apagar o histórico

- **Data**: 2026-09-06
- **Branch**: `master`
- **Plano de origem**: `docs/tasks/recalculo-sem-perder-historico.md`

## Objetivo

Permitir que o jogador recalcule estratégias de um craft sem substituir a
versão anterior, preservando eventos, custos e snapshots durante a sessão.

## Funcionalidades entregues

- **Versões locais de plano** — cada resultado bem-sucedido recebe identificador,
  número, pedido copiado, timestamp e versões de game data e preço.
- **Execução vinculada à versão** — estados e resumos carregam `planVersionId`;
  estratégias com o mesmo id em versões diferentes não compartilham eventos.
- **Recálculo com escolha explícita** — o jogador pode continuar a versão
  anterior ou iniciar a nova, e pode alternar depois entre versões preservadas.
- **Histórico preservado** — ao retornar à versão anterior, o histórico e o
  resumo da execução continuam disponíveis sem mesclagem ou reescrita.

## Critérios de aceite

- [x] Cada geração publicada possui identificador, número, pedido e snapshot.
- [x] O recálculo não altera plano, eventos ou custos da versão anterior.
- [x] A interface exige a escolha entre continuar a versão anterior e iniciar a
      nova.
- [x] A alternância recupera o histórico e o resumo da versão selecionada.
- [x] Nenhuma integração externa ou dependência nova foi adicionada.
- [x] `pnpm validate` e o E2E aplicável passaram.

## Arquivos alterados

| Arquivo                                                                    | Mudança                                                                |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `packages/planner/src/index.ts`                                            | Contrato `PlannerPlanVersion` e fábrica com cópia do resultado/pedido. |
| `packages/planner/src/execution.ts`                                        | `planVersionId` em estados e resumos de execução.                      |
| `packages/planner/src/index.test.ts`                                       | Teste de snapshot isolado da origem.                                   |
| `packages/planner/src/execution.test.ts`                                   | Teste de vínculo da execução à versão.                                 |
| `apps/web/src/features/strategy-planning/components/StrategyPlanning.tsx`  | Coleção de versões, recálculo, escolha e seletor de versão.            |
| `apps/web/src/features/strategy-planning/components/StrategyExecution.tsx` | Execução controlada pelo pai e associada à versão.                     |
| `apps/web/src/features/strategy-planning/tests/StrategyPlanning.test.tsx`  | Teste de recálculo e recuperação do histórico anterior.                |
| `apps/web/src/features/strategy-planning/index.ts`                         | Exportação do contrato de props.                                       |
| `e2e/app.spec.ts`                                                          | Fluxo Chromium de recálculo e continuidade da versão anterior.         |
| `docs/tasks/recalculo-sem-perder-historico.md`                             | Plano e critérios concluídos.                                          |
| `docs/decisions/0030-versionamento-local-de-planos.md`                     | ADR do versionamento local.                                            |
| `docs/architecture.md`, `docs/testing.md`, `README.md`                     | Arquitetura, testes e estado atual atualizados.                        |

## Testes

| Teste                                                                     | Tipo       | O que cobre                                                     |
| ------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------- |
| `packages/planner/src/index.test.ts`                                      | package    | Cópia do snapshot e isolamento do pedido original.              |
| `packages/planner/src/execution.test.ts`                                  | package    | Vínculo do estado/resumo à versão.                              |
| `apps/web/src/features/strategy-planning/tests/StrategyPlanning.test.tsx` | componente | Nova versão, escolha explícita e retorno ao histórico anterior. |
| `pnpm --filter @poe-crafter/web test:coverage`                            | web        | 17 arquivos, 61 testes.                                         |
| `pnpm test:e2e`                                                           | E2E        | 13 testes Chromium, incluindo RF-11.                            |

Saída observada:

```text
@poe-crafter/planner: 8 passed
web: Test Files 17 passed; Tests 61 passed
pnpm test:e2e: 13 passed (14.6s)
```

## Validações executadas

| Comando             | Resultado                              |
| ------------------- | -------------------------------------- |
| `pnpm validate`     | Verde                                  |
| `pnpm check:docs`   | Verde dentro do validate               |
| `pnpm format:check` | Verde dentro do validate               |
| `pnpm lint`         | Verde dentro do validate               |
| `pnpm typecheck`    | Verde dentro do validate               |
| `pnpm build`        | Verde dentro do validate               |
| `git diff --check`  | Sem erros observados durante a revisão |

Saída relevante do gate:

```text
Coverage summary: Statements 90.19%; Branches 82.75%; Functions 91.45%; Lines 93.02%
Smoke test do bundle web OK.
```

## Fora do escopo

- Persistência de versões, planos ou eventos no Firestore.
- Consulta a poe.ninja, RePoE ou outros providers.
- Jobs persistidos, novas receitas e reconciliação automática entre versões.
- Transferência automática de gastos ou eventos para a nova versão.

## Limitações e pendências conhecidas

As versões vivem somente enquanto a tela está aberta e usam o dataset starter
versionado. A persistência remota de planos/jobs e snapshots autoritativos
continua pendente para os incrementos de backend do PRD.

## Como verificar manualmente

1. Abra `/new`, importe um item aceito, valide a craftabilidade, prepare o
   pedido e gere estratégias.
2. Registre pelo menos uma tentativa na primeira estratégia e conclua o passo.
3. Clique em **Recalcular estratégia**.
4. Escolha **Iniciar nova versão** e depois selecione **Versão 1** no campo
   **Versão ativa**.
5. Resultado esperado: o snapshot da versão é exibido e o histórico/resumo da
   execução anterior continua intacto; nenhuma tentativa é transferida para a
   versão nova.
