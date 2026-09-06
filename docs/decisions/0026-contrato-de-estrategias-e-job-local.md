# 0026 — Contrato de estratégias e job local

## Contexto

O fluxo já produzia um alvo aceito e um pedido de preferências, mas ainda não
havia uma forma verificável de publicar candidatos. Mostrar passos inventados ou
parciais violaria a regra de que todo plano precisa passar pelo engine.

## Decisão

Criar `@poe-crafter/planner` como package puro. O planner recebe o pedido, o
alvo, o status de craftabilidade e um dataset versionado de receitas completas.
Uma receita só é elegível quando seus requisitos de nível/afixos/mecânicas são
atendidos e todos os passos têm `validation: accepted`, custo válido,
probabilidade válida e tentativas esperadas positivas.

O package calcula custo esperado, P90, tentativas, probabilidade e risco,
remove assinaturas equivalentes, ordena por objetivo e limita a quatro
estratégias. `runPlannerJob` publica as fases `queued`, `validating`,
`searching`, `simulating` e o terminal `succeeded`/`failed`.

A primeira integração usa um dataset starter local e explícito. A interface
deixa claro que ele não é cobertura completa do jogo e não inicia execução nem
persiste job. Functions, snapshots reais, RePoE e expansão de receitas serão
incrementos posteriores, sem mudar o contrato público.

## Consequências

- O sistema não apresenta estratégias quando a craftabilidade não é `accepted`
  ou quando não existe uma receita integralmente validada.
- Resultados são comparáveis e reproduzíveis, mas os custos do starter não são
  uma cotação atual do poe.ninja.
- O job local pode ser substituído por uma fila persistida sem alterar a forma
  como a UI anuncia fases e consome `PlannerResult`.
- O dataset precisa crescer com módulos determinísticos, fixtures e versões;
  nenhuma mecânica nova entra por heurística.
