# Resumo estimado versus real

**Status:** Implementado em 2026-09-06
**Origem:** RF-10 e CA-09 do [PRD](../prd.md)
**Dependências:** [execução append-only local](execucao-append-only-local.md), [geração e comparação de estratégias](geracao-e-comparacao-de-estrategias.md)

## Contexto

O jogador já consegue registrar uma execução local e ver o custo acumulado,
mas o estado terminal ainda não explica como o resultado real se compara ao
plano escolhido. RF-10 precisa transformar o histórico append-only em um
resumo auditável, sem apagar eventos nem inventar preço para recurso sem valor
conhecido.

## Objetivo

Ao atingir sucesso terminal, mostrar custo estimado, custo real, diferença,
tentativas por passo e o caminho completo de eventos. O cálculo deve ser puro,
versionado e reutilizável pela UI e por uma futura persistência.

## Requisitos

- Criar um `ExecutionSummary` derivado de uma estratégia e de seu estado
  terminal, sem mutar a sessão.
- Comparar o custo estimado do plano com o custo real normalizado dos eventos.
- Expor `unavailable` quando qualquer recurso real não tiver preço em chaos, sem
  tratá-lo como zero; manter o total conhecido separadamente.
- Contar tentativas por passo, incluindo retry e restart, e preservar a ordem
  completa do caminho registrado.
- Renderizar o resumo apenas no estado terminal, com custo estimado, real,
  diferença quando calculável, tentativas e caminho.
- Manter a execução local e informar que o resumo ainda não é persistido.

## Não escopo

- Persistência Firestore, recálculo RF-11 ou reconciliação entre versões.
- Alteração de preços do planner, novas receitas ou simulação probabilística.
- Edição/exclusão de eventos existentes ou automação do cliente do jogo.
- Pesquisa de satisfação ou coleta de avaliação pós-craft.

## Suposições

- O custo estimado continua sendo `strategy.expectedCostChaos` da versão
  publicada, enquanto o real vem somente dos eventos registrados.
- Um recurso sem preço é representado no contrato como `chaos: null`; eventos
  com preço conhecido continuam somando normalmente.
- Tentativas por passo contam cada evento `success`, `retry`, `restart` ou
  `skipped` associado ao passo, inclusive eventos antes de um restart.
- O resumo só aparece após `status: completed`; sessões ativas continuam com o
  histórico e custo acumulado já existentes.

## Proposta de solução

Adicionar ao package `planner` a função pura `summarizeExecution`, com schema
versionado, totais conhecidos e `unavailable` explícito. A feature
`strategy-planning` renderiza um componente de resumo no cartão terminal e
mantém a explicação dos eventos como caminho somente leitura. O contrato não
conhece React, Firebase ou relógio.

## Tarefas sequenciais

1. Ajustar o contrato de recurso para distinguir preço conhecido de preço
   indisponível sem quebrar eventos existentes.
2. Implementar `ExecutionSummary` e testes de custo, diferença, tentativas,
   caminho e indisponibilidade.
3. Renderizar o resumo terminal e cobrir sucesso e preço indisponível na web.
4. Atualizar o fluxo E2E para verificar o resumo ao concluir uma estratégia.
5. Atualizar arquitetura, ADR, README, testes e entrega; executar todos os
   gates.

## Riscos

- **Custo incorreto:** somar somente valores conhecidos e nunca converter
  `null` em zero.
- **Contagem duplicada:** derivar tentativas do array append-only, não do índice
  atual, que pode voltar ao início em restart.
- **Comparação enganosa:** não exibir diferença como zero quando o real estiver
  indisponível.
- **Escopo persistente:** manter o resumo derivado e local até RF-11/RF-12
  definirem sincronização e versionamento durável.

## Critérios de aceite

- [x] Estado terminal mostra custo estimado, custo real, diferença calculável,
      tentativas por passo e caminho completo.
- [x] O custo real soma somente valores normalizados conhecidos e sinaliza
      preço indisponível sem usar zero.
- [x] Retry e restart aparecem no caminho e contam para o passo correto sem
      apagar eventos anteriores.
- [x] Resumo não aparece antes do sucesso terminal e não altera a execução.
- [x] Testes unitários, web, E2E, `pnpm validate`, documentação e ADR passam.
