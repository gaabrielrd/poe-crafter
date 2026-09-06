# Resumo estimado versus real

- **Data**: 2026-09-06
- **Branch**: `master`
- **Plano de origem**: `docs/tasks/resumo-estimado-versus-real.md`

## Objetivo

Depois do sucesso terminal, mostrar ao jogador como o custo e as tentativas
reais se comparam à estratégia publicada, sem transformar preço desconhecido em
zero.

## Funcionalidades entregues

- **Resumo terminal** — custo estimado, custo real, diferença, tentativas por
  passo e caminho completo aparecem após a conclusão.
- **Preço indisponível explícito** — recursos com `chaos: null` mantêm o total
  conhecido separado e exibem `Indisponível` para custo real e diferença.
- **Projeção pura** — `summarizeExecution` deriva o resumo sem mutar eventos ou
  alterar a sessão append-only.
- **Runtime de testes estável** — Vite alinha React e React DOM ao runtime
  hoisted do workspace pnpm, evitando instâncias duplicadas em Vitest.

## Critérios de aceite

- [x] Estado terminal mostra custo estimado, custo real, diferença calculável,
      tentativas por passo e caminho completo.
- [x] O custo real soma somente valores normalizados conhecidos e sinaliza
      preço indisponível sem usar zero.
- [x] Retry e restart aparecem no caminho e contam para o passo correto sem
      apagar eventos anteriores.
- [x] Resumo não aparece antes do sucesso terminal e não altera a execução.
- [x] Testes unitários, web, E2E, `pnpm validate`, documentação e ADR passam.

## Arquivos alterados

| Arquivo                                                                    | Mudança                                                            |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `packages/planner/src/execution.ts`                                        | Tipos de preço opcional e `summarizeExecution`.                    |
| `packages/planner/src/execution.test.ts`                                   | Teste de resumo, tentativas, caminho e preço indisponível.         |
| `packages/planner/src/index.ts`                                            | Exporta o resumo público.                                          |
| `apps/web/src/features/strategy-planning/components/StrategyExecution.tsx` | Renderiza o resumo terminal e permite registrar recurso sem preço. |
| `apps/web/src/features/strategy-planning/tests/StrategyExecution.test.tsx` | Testes de comparação e indisponibilidade.                          |
| `apps/web/vite.config.ts`                                                  | Alinha React/React DOM no runtime hoisted do workspace.            |
| `e2e/app.spec.ts`                                                          | Verifica resumo e custo real no fluxo Chromium.                    |
| `docs/decisions/0029-resumo-estimado-versus-real.md`                       | ADR do contrato derivado.                                          |

## Testes

| Teste                                                                      | Tipo         | Resultado                         |
| -------------------------------------------------------------------------- | ------------ | --------------------------------- |
| `packages/planner/src/execution.test.ts`                                   | unidade      | 3 testes aprovados.               |
| `packages/planner/src/index.test.ts`                                       | unidade      | 4 testes aprovados.               |
| `apps/web/src/features/strategy-planning/tests/StrategyExecution.test.tsx` | componente   | 3 testes aprovados.               |
| suíte web                                                                  | unidade      | 17 arquivos, 60 testes aprovados. |
| `e2e/app.spec.ts`                                                          | E2E Chromium | 13 testes aprovados.              |

## Validações executadas

| Comando                                        | Resultado                                                                                          |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `pnpm --filter @poe-crafter/planner test`      | 7 testes aprovados.                                                                                |
| `pnpm --filter @poe-crafter/web test:coverage` | Verde; 17 arquivos/60 testes, 89,87% statements, 82,22% branches, 91,47% functions e 92,87% lines. |
| `pnpm test:e2e`                                | Verde; 13 testes Chromium aprovados.                                                               |
| `pnpm check:docs`                              | Verde.                                                                                             |
| `pnpm format:check`                            | Verde.                                                                                             |
| `git diff --check`                             | Verde.                                                                                             |
| `pnpm validate`                                | Verde após a implementação final; cobertura registrada acima.                                      |

## Fora do escopo

Persistência Firestore, recálculo RF-11, reconciliação entre versões, preços
remotos, novas receitas e automação do cliente do jogo.

## Limitações e pendências conhecidas

O resumo é efêmero e depende dos preços fornecidos no momento de cada registro.
O dataset starter continua limitado às receitas iniciais; a persistência e a
criação de uma nova versão do plano ficam para RF-11.

## Como verificar manualmente

1. Em `/new`, confirme um alvo de vida e gere a estratégia **Bancada de vida**.
2. Inicie a execução, registre `Orb` com `2` chaos como retry e depois sucesso.
3. Confirme **Craft concluído**, custo estimado `4.0`, custo real `2.0`,
   diferença `-2.0`, tentativas e o caminho com os dois eventos.
4. Repita usando um recurso sem valor em chaos e confirme que o custo real e a
   diferença aparecem como **Indisponível**, sem apagar o valor conhecido.
