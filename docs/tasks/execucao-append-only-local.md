# Execução append-only local

**Status:** Implementado em 2026-09-06
**Origem:** RF-09 e CA-09 do [PRD](../prd.md)
**Dependências:** [explicação de estratégia](explicacao-de-estrategia.md), [persistência privada e histórico](persistencia-privada-e-historico-de-crafts.md)

## Contexto

O jogador já pode explicar uma estratégia, mas ainda não consegue registrar o
que aconteceu. RF-09 precisa preservar cada tentativa, retry, restart e gasto,
sem duplicar ou apagar eventos anteriores.

## Objetivo

Adicionar um modelo append-only e uma experiência local de execução que permita
iniciar uma estratégia, informar recursos gastos e avançar o passo visível com
resultados `success`, `retry`, `restart` e `skipped` quando permitido.

## Requisitos

- Criar `ExecutionState` versionado e funções puras para iniciar sessão e
  acrescentar eventos imutáveis.
- Validar valores de moedas finitos/não negativos, estratégia ativa e outcome
  permitido pelo passo.
- Avançar sucesso ao próximo passo, manter retry no passo atual, voltar ao
  início em restart e concluir somente no último sucesso.
- Preservar sequência, id, timestamp fornecido pelo chamador e custo chaos de
  cada evento; nunca editar eventos anteriores.
- Renderizar execução após uma estratégia publicada, com estado atual, formulário
  de gasto, ações de resultado, histórico e total acumulado.
- Informar claramente que esta fatia mantém a edição local e ainda não
  sincroniza com Firestore.

## Não escopo

- Persistência Firestore, reconciliação offline, retries de rede ou Functions.
- Exclusão/edição de eventos já registrados.
- Resumo RF-10, recálculo RF-11 ou automação do cliente do jogo.
- Novas receitas, preços ou mudanças no planner.

## Suposições

- Um evento recebe `recordedAt` do serviço/UI; o modelo não consulta relógio.
- Um restart retorna ao primeiro passo da estratégia, preservando todos os
  eventos e gastos anteriores.
- O dataset starter não marca passos como `skippable`; a UI só exibirá Skip quando
  a receita futura fornecer essa permissão.

## Tarefas sequenciais

1. Definir tipos, validação e transições puras de execução.
2. Adicionar testes para sucesso, retry, restart, skip proibido, custos e estado
   terminal.
3. Criar componente acessível de execução local e histórico append-only.
4. Integrar ao cartão de estratégia e atualizar E2E.
5. Atualizar arquitetura, ADR, docs e entrega; executar todos os gates.

## Riscos

- **Perda de gasto:** toda transição deve copiar o array de eventos e somar custo
  somente ao novo evento.
- **Loop duplicado:** sequência e índice atual devem ser derivados do estado
  anterior, nunca de contagem visual.
- **Promessa de sincronização:** copy deve declarar que a sessão ainda é local.

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
