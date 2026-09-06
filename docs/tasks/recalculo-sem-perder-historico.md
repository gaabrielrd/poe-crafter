# Recalcular sem apagar o histórico

**Status:** Implementado em 2026-09-06  
**PRD:** RF-11  
**Dependências:** [geração e comparação de estratégias](geracao-e-comparacao-de-estrategias.md), [execução append-only local](execucao-append-only-local.md), [resumo estimado versus real](resumo-estimado-versus-real.md)

## Contexto

O planner já publica estratégias locais com versões de dataset e snapshot de
preços, e a execução registra eventos append-only na página. Porém, um novo
planejamento ainda substituiria o resultado em memória e não haveria uma
fronteira explícita entre o plano antigo e o novo. RF-11 exige preservar o
plano, o snapshot e os gastos anteriores ao solicitar novos dados ou preços.

## Objetivo

Criar versões imutáveis do resultado de planejamento e permitir que o jogador
escolha continuar a versão anterior ou iniciar a nova, sem perder execuções e
resumos já registrados.

## Escopo

- Criar um contrato puro de versão de plano no package `planner`.
- Associar cada estado de execução a uma versão de plano.
- Manter versões e execuções locais na tela de planejamento.
- Expor uma ação explícita de recálculo e uma confirmação com as duas escolhas.
- Permitir alternar entre versões preservadas e visualizar seus snapshots,
  estratégias e histórico de execução.
- Cobrir o comportamento com testes de package, componente e fluxo E2E quando
  aplicável.
- Atualizar arquitetura, ADR, testes e registro de entrega.

## Não escopo

- Persistir versões, planos ou eventos no Firestore.
- Consultar poe.ninja, RePoE ou novos providers.
- Mesclar eventos entre versões ou transferir automaticamente um craft em
  andamento para outra estratégia.
- Recalcular de forma automática ao editar preferências.
- Criar novas receitas ou ampliar a legalidade do crafting-engine.

## Suposições

- O dataset starter atual é a fonte usada tanto pela primeira geração quanto
  pelo recálculo.
- O recálculo captura uma cópia normalizada do pedido e do resultado; objetos de
  uma versão publicada não são mutados.
- O identificador de versão é criado localmente e monotônico dentro da tela.
- A execução anterior continua disponível mesmo quando outra versão é ativada.

## Proposta de solução

1. Adicionar `PlannerPlanVersion` e uma fábrica pura no package `planner`, com
   identificador, número, timestamp, pedido, versões de dados/preços e
   estratégias publicadas.
2. Acrescentar `planVersionId` ao estado de execução e exigir que o componente
   receba a versão para criar eventos e resumos vinculados ao snapshot correto.
3. Refatorar `StrategyPlanning` para manter uma coleção de versões e um mapa de
   execuções por versão/estratégia. A geração inicial cria a versão 1; o botão
   de recálculo cria uma nova versão sem substituir a anterior.
4. Mostrar a nova versão em estado pendente e exigir a escolha **Continuar
   versão anterior** ou **Iniciar nova versão**. Um seletor permite voltar a uma
   versão preservada depois da escolha.
5. Atualizar testes e documentação, mantendo a saída inicial compatível com o
   fluxo atual.

## Tarefas sequenciais

- [x] Auditar RF-11 e delimitar o incremento local.
- [x] Criar contrato e testes de `PlannerPlanVersion`.
- [x] Vincular execução e resumo à versão do plano.
- [x] Implementar recálculo, escolha explícita e alternância de versões na UI.
- [x] Atualizar testes unitários, de componente e E2E.
- [x] Rodar validações, revisar o diff e registrar a entrega.

## Riscos

- Manter execuções em um mapa incorreto pode misturar estratégias com o mesmo
  id em versões diferentes; a chave deve sempre incluir a versão.
- A troca de versão pode desmontar o componente e perder estado se a execução
  não for controlada pelo pai.
- Um recálculo local não representa ainda um snapshot remoto autoritativo; a
  interface deve deixar essa limitação visível.

## Critérios de aceite

- [x] Cada geração publicada possui um identificador e número de versão, pedido
      e snapshot imutáveis.
- [x] Recálculo não remove nem altera a versão anterior, seus eventos ou custos.
- [x] O jogador escolhe explicitamente continuar a versão anterior ou iniciar a
      nova.
- [x] Alternar versões mostra o histórico e o resumo correspondentes à versão
      selecionada.
- [x] Preços e dados continuam identificados e nenhuma integração externa nova
      é introduzida.
- [x] Testes e `pnpm validate` ficam verdes, e a entrega é registrada em
      `docs/entregas`.
