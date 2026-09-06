# ADR-0037: timeout de job de planejamento

**Status:** Aceito  
**Data:** 2026-09-06

## Contexto

O planner publica fases assíncronas e a UI cria uma versão somente após sucesso,
mas uma execução futura remota pode ficar presa em `searching` ou `simulating`.
O PRD exige encerramento recuperável aos cinco minutos e proíbe publicar
resultado parcial.

## Decisão

`runPlannerJob` usa deadline padrão de `300000` ms, com `now()` opcional para
testes. Entre cada fase e antes de gerar estratégias, se o deadline foi
atingido, publica `failed` com issue `job-timeout`, array de estratégias vazio e
contadores zerados. `createPlannerPlanVersion` já rejeita qualquer resultado que
não seja sucesso, mantendo a proteção também na camada de domínio.

## Consequência

O planner local não interrompe código síncrono já em execução; a checagem entre
fases estabelece o contrato e a futura fila/handler remoto deverá aplicar o
mesmo deadline com cancelamento de infraestrutura. A UI mostra erro recuperável
e preserva versões e eventos anteriores.
