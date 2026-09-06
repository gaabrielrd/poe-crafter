# Geração e comparação de estratégias

**Status:** Implementado em 2026-09-06
**Origem:** RF-07, CA-05 e CA-06 do [PRD](../prd.md)
**Dependências:** [configuração versionada de planejamento](configuracao-versionada-de-planejamento.md), [contrato e validação determinística de craftabilidade](contrato-e-validacao-de-craftabilidade.md)

## Contexto

O produto já confirma o alvo, valida a craftabilidade suportada e produz um
`PlanningRequest` schema `1`, mas ainda não existe uma resposta de planejamento.
RF-07 exige um job assíncrono que pesquise candidatos completos, simule métricas,
elimine alternativas inviáveis/equivalentes e publique de uma a quatro
estratégias comparáveis.

O dataset completo de RePoE, snapshots reais de poe.ninja e a execução em
Functions ainda serão incrementos próprios. Esta fatia cria o contrato puro do
planner e um dataset inicial determinístico, pequeno e explícito, para que o
fluxo entregue estratégias somente quando houver uma receita integralmente
validada.

## Objetivo

Gerar e comparar estratégias completas a partir de um alvo `accepted` e de um
pedido versionado, exibindo estados assíncronos, métricas calculadas de forma
determinística e falha explícita quando não houver caminho válido.

## Requisitos

- Criar o package puro `@poe-crafter/planner`, sem React, Firebase, rede,
  relógio ou providers.
- Versionar o contrato do dataset, do job e da estratégia, vinculando cada
  resultado a `gameDataVersion` e `priceSnapshotId`.
- Aceitar somente craftabilidade `accepted`; nenhum candidato parcial ou não
  validado pode chegar à saída.
- Filtrar receitas por mecânicas excluídas, nível mínimo e códigos de afixos
  requeridos classificados pelo jogador.
- Calcular custo esperado, custo P90, tentativas esperadas, probabilidade de
  sucesso e um risco comparável a partir dos passos completos.
- Remover estratégias equivalentes, ordenar conforme o objetivo e limitar a
  saída a quatro estratégias distintas.
- Expor estados `queued`, `validating`, `searching`, `simulating`, `succeeded`
  e `failed` por uma função assíncrona determinística.
- Integrar a tela após `PlanningRequest` preparado, cobrindo carregamento,
  sucesso e erro sem iniciar execução do craft.
- Cobrir contrato, ranking, deduplicação, falhas e fluxo observável com testes.

## Não escopo

- Dataset completo de PoE/RePoE, importação/ativação administrativa ou todas as
  receitas de currency, bench, meta-craft, Essences, Fossils, Harvest, Eldritch
  e influence crafting.
- Consulta ao poe.ninja, atualização diária ou cálculo de preços fora do
  dataset inicial e dos overrides manuais já aceitos.
- Persistência de `PlanningJob`, Cloud Functions, filas, retry de infraestrutura
  ou limites operacionais do RF-15.
- Explicação detalhada de cada passo (RF-08), execução (RF-09), resumo (RF-10)
  ou recálculo (RF-11).
- Alterar a autoridade do `crafting-engine` ou apresentar estratégias quando o
  resultado for `rejected` ou `unsupported`.

## Suposições

- A primeira execução do job é local e assíncrona, com as mesmas fases públicas
  que o futuro handler de Functions deverá persistir.
- O dataset inicial é um artefato explicitamente versionado no package planner;
  ele serve apenas para demonstrar o contrato e não afirma cobertura completa do
  jogo.
- Uma receita é completa quando todos os seus passos possuem `validation:
accepted`, custo finito não negativo, probabilidade entre zero e um e
  tentativas esperadas maiores que zero.
- Overrides manuais alteram o custo dos recursos correspondentes; na ausência
  de override, o custo declarado pela receita é usado como dado do snapshot
  inicial.

## Proposta de solução

1. Criar `packages/planner` com tipos serializáveis, filtro de elegibilidade,
   cálculo de métricas, deduplicação e ranking estável por objetivo.
2. Publicar um dataset inicial com receitas determinísticas para alguns códigos
   de afixos do fixture atual, sempre com `gameDataVersion` e `priceSnapshotId`.
3. Criar a feature web `strategy-planning` para executar o job local, anunciar
   a fase atual e apresentar até quatro cartões de estratégia comparáveis.
4. Conectar `ItemImportPage` ao callback de configuração, limpando resultados
   quando o alvo ou o pedido mudar.
5. Atualizar E2E, arquitetura, ADR, README, testes e registro de entrega.

## Tarefas sequenciais

1. Definir o contrato do planner, receitas, métricas e códigos de falha.
2. Implementar filtro, simulação determinística, deduplicação e ranking.
3. Adicionar testes do package para sucesso, filtros, equivalência, limite de
   quatro e ausência de caminho válido.
4. Criar a feature web de job/resultados com estados acessíveis e botão de
   geração.
5. Integrar a feature ao fluxo aceito de importação/configuração.
6. Adicionar testes de componente e E2E do fluxo completo.
7. Atualizar arquitetura, ADR, README, docs de testes e critérios deste plano.
8. Executar `pnpm validate`, `pnpm test:e2e`, revisar o diff e registrar a
   entrega em `docs/entregas`.

## Riscos

- **Promessa de cobertura:** copy e documentação devem identificar o dataset
  inicial; receitas ausentes falham sem inventar passos.
- **Métrica enganosa:** manter fórmulas determinísticas e não chamar estimativa
  de garantia de sucesso.
- **Ranking instável:** ordenar todos os empates por id e testar a saída JSON.
- **Transição futura para backend:** manter o job puro e os estados públicos
  independentes da implementação local atual.
- **Escopo crescente:** não adicionar execução, persistência ou providers neste
  incremento.

## Critérios de aceite

- [x] Um alvo `accepted` com receita elegível produz de uma a quatro estratégias
      completas; `rejected`/`unsupported` e receitas incompletas nunca produzem
      passos.
- [x] O job expõe as fases assíncronas e termina em `succeeded` ou `failed` de
      forma determinística.
- [x] Mecânicas excluídas, nível e afixos requeridos filtram candidatos antes do
      ranking.
- [x] Estratégias equivalentes são omitidas e a saída não ultrapassa quatro,
      com ordenação estável por objetivo.
- [x] Cada estratégia vincula versões de game data/preços e informa custo
      esperado, P90, tentativas, probabilidade e risco.
- [x] O fluxo web mostra carregamento, sucesso e erro, sem iniciar execução ou
      persistir job.
- [x] Testes focados, `pnpm validate`, E2E, documentação e ADR passam.
