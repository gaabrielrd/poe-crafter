# ADR-0033: Ciclo transacional de datasets administrativos

- **Status:** Aceita
- **Data:** 2026-09-06
- **Decisão:** manter versões de dataset imutáveis em `ops/datasets`, validar
  pelo package `@poe-crafter/planner` e alterar o ponteiro ativo somente em uma
  transação administrativa autorizada.

## Contexto

O planner precisava de uma fonte versionada sem permitir que um payload parcial
ou uma publicação concorrente quebrasse o planejamento. O diagnóstico RF-14A já
definia a fronteira segura de UID Google autorizado.

## Decisão

`manageAdminDataset` aceita `import`, `validate`, `publish` e `reactivate` após
`authenticateAdmin`. A validação produz issues com caminhos estáveis. O import é
idempotente para o mesmo conteúdo e conflita quando o identificador já aponta
para outro conteúdo. Publicação/reativação lê o alvo, o ponteiro atual e a
versão anterior dentro de uma transação; grava o novo estado ativo, aposenta o
anterior e cria uma auditoria append-only sem copiar o dataset.

As coleções `ops/datasets`, `ops/activeDataset` e `ops/auditEvents` permanecem
deny-all para o cliente. A UI de ações será construída em RF-14C.

## Consequências

- Falhas de schema são persistidas sem alterar o ativo.
- Repetições seguras não sobrescrevem conteúdo publicado.
- Auditoria permite rastrear ator, ação, versão, resultado e quantidade de
  issues sem expor receitas.
- A importação de providers externos e o agendamento de jobs continuam fora do
  escopo deste incremento.
