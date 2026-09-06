# Explicação de estratégia

- **Data**: 2026-09-06
- **Branch**: `master`
- **Plano de origem**: `docs/tasks/explicacao-de-estrategia.md`

## Objetivo

Permitir que o jogador abra uma estratégia e entenda o alvo inicial, o estado
esperado e todos os passos, sem confundir explicação com execução.

## Funcionalidades entregues

- **Contexto do alvo** — base inicial, item level e influências permanecem
  vinculados à estratégia.
- **Passos explicados** — cada passo mostra operação, estado esperado, sucesso,
  tentativas, custo, retry e restart.
- **Acessibilidade e segurança de escopo** — `details/summary` funciona por
  teclado e a tela declara que nenhuma moeda ou tentativa foi registrada.

## Critérios de aceite

- [x] Estratégias abrem detalhes completos com métricas e instruções.
- [x] Versões de game data/snapshot continuam visíveis.
- [x] Abrir/fechar não muda o resultado nem inicia execução.
- [x] Testes focados, validação completa, E2E, documentação e ADR passam.

## Arquivos alterados

| Arquivo                                                                   | Mudança                                                   |
| ------------------------------------------------------------------------- | --------------------------------------------------------- |
| `packages/planner/src/index.ts`                                           | Estado esperado por passo e resumo do alvo na estratégia. |
| `packages/planner/src/index.test.ts`                                      | Verificação do contexto e estado esperado.                |
| `apps/web/src/features/strategy-planning/components/StrategyPlanning.tsx` | Detalhes acessíveis por estratégia.                       |
| `apps/web/src/features/strategy-planning/tests/StrategyPlanning.test.tsx` | Testes da explicação aberta.                              |
| `e2e/app.spec.ts`                                                         | Verificação da abertura no navegador.                     |
| `docs/decisions/0027-explicacao-imutavel-de-estrategia.md`                | ADR da explicação somente leitura.                        |

## Testes

| Teste                                      | Resultado                         |
| ------------------------------------------ | --------------------------------- |
| `pnpm --filter @poe-crafter/planner test`  | 4 testes aprovados.               |
| `pnpm --filter @poe-crafter/web test:unit` | 16 arquivos, 57 testes aprovados. |

## Validações executadas

| Comando                                                      | Resultado                                                                                                        |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `pnpm validate`                                              | Verde; 16 arquivos/57 testes web, cobertura 89,71% statements, 81,61% branches, 91,42% functions e 92,70% lines. |
| `pnpm test:e2e`                                              | Verde; 13 testes Chromium aprovados.                                                                             |
| `pnpm check:docs` / `pnpm format:check` / `git diff --check` | Verdes.                                                                                                          |

## Fora do escopo

Registro de tentativas, moedas, retry/restart, execução do jogo, resumo real e
recálculo.

## Limitações e pendências conhecidas

As explicações seguem o dataset starter e ainda não cobrem todas as receitas de
PoE. O próximo trabalho deve ampliar o dataset e implementar RF-09 com eventos
append-only.

## Como verificar manualmente

1. Gere uma estratégia em `/new` para um alvo suportado.
2. Abra **Ver explicação dos passos** em um cartão.
3. Navegue até o resumo com Tab e use Enter/Espaço para expandir.
4. Confirme que base, estado esperado, retry, restart e métricas aparecem e
   que nenhuma execução é iniciada.
