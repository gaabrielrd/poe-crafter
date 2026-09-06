# Explicação de estratégia

**Status:** Implementado em 2026-09-06
**Origem:** RF-08 e CA-05 do [PRD](../prd.md)
**Dependências:** [geração e comparação de estratégias](geracao-e-comparacao-de-estrategias.md)

## Contexto

O planner já exibe cartões com métricas comparáveis, mas o jogador ainda não
consegue abrir uma estratégia para entender a base inicial, o estado esperado e
o que fazer em cada passo. RF-08 exige uma leitura executável, incluindo retry,
restart, probabilidade, tentativas e custo.

## Objetivo

Adicionar uma explicação detalhada por estratégia, sem alterar o resultado do
planner nem iniciar a execução do craft.

## Requisitos

- Vincular cada estratégia à base inicial, item level, influências e versões de
  dados/preços já produzidas pelo planner.
- Mostrar passos ordenados com operação, recurso, estado esperado, probabilidade,
  tentativas, custo, instrução de retry e instrução de restart.
- Permitir abrir e fechar os detalhes por teclado e preservar as métricas do
  resumo.
- Manter a indicação de dataset/snapshot e deixar claro que os controles de
  execução ainda não existem.
- Cobrir sucesso, conteúdo detalhado e acessibilidade com testes de componente
  e E2E.

## Não escopo

- Registrar tentativas ou moedas (RF-09).
- Alterar passos, recalcular métricas ou executar operações no jogo.
- Resumo estimado versus real (RF-10) ou recálculo (RF-11).
- Novas receitas ou atualização do dataset starter.

## Suposições

- A estratégia é imutável durante a explicação; abrir detalhes não cria estado
  persistido.
- O estado esperado é texto versionado pela receita e não uma inferência da UI.
- `<details>/<summary>` fornece foco, teclado e expansão sem componente novo.

## Tarefas sequenciais

1. Estender o contrato de passo/estratégia com estado esperado e resumo do alvo.
2. Atualizar as receitas starter e testes do package.
3. Renderizar detalhes acessíveis em cada cartão de estratégia.
4. Atualizar testes de componente e E2E.
5. Atualizar arquitetura/ADR/docs, executar `pnpm validate` e E2E e registrar a
   entrega.

## Riscos

- **Promessa de execução:** copy deve diferenciar instrução de registro real.
- **Dados escondidos:** detalhes precisam ser alcançáveis por teclado e ter
  rótulo explícito.
- **Divergência de métricas:** reutilizar os valores imutáveis do `PlannerResult`.

## Critérios de aceite

- [x] Cada estratégia abre uma explicação com base, item level, propriedades,
      passos ordenados, estado esperado, sucesso, retry, restart, probabilidade,
      tentativas e custo.
- [x] A explicação mantém vínculo com versões de dados/preços e não afirma que
      registrou ou executou o craft.
- [x] A abertura/fechamento funciona por teclado e não altera o resultado.
- [x] Testes focados, `pnpm validate`, E2E, documentação e ADR passam.
