# 0025 — Configuração versionada de planejamento

## Contexto

O `crafting-engine` já separa entradas aceitas, rejeitadas e não suportadas,
mas o fluxo ainda não tinha um contrato explícito para as preferências que o
futuro planner deverá consumir. Misturar essa coleta com a geração de
estratégias criaria uma promessa de resultado antes de existirem planner,
simulação e snapshots de preço.

## Decisão

Criar a feature `planning-configuration` com o `PlanningRequest` schema `1`.
O request contém um objetivo (`recommended`, `cheapest`, `safest` ou `premium`),
as mecânicas excluídas de um catálogo inicial versionado e overrides manuais em
chaos. O modelo puro valida duplicatas, valores inválidos e a regra de manter
ao menos uma mecânica aplicável; seus arrays são ordenados antes da publicação.

A interface aparece somente após `accepted` do engine e entrega o request por
callback transitória. Esta fatia não inicia job, não consulta providers, não
gera estratégia e não persiste o pedido no Firestore.

## Consequências

- O planner futuro recebe uma entrada serializável e estável, sem inferir
  preferências a partir do estado visual.
- Overrides registram intenção manual, mas não são snapshots nem preços atuais.
- O catálogo inicial pode ser ampliado somente com nova versão/contrato e
  testes; ele não afirma que todas as mecânicas são aplicáveis a toda base.
- Persistência, custos, ranking, simulação e execução continuam em incrementos
  independentes.
