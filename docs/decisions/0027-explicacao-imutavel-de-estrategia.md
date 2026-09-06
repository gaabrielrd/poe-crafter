# 0027 — Explicação imutável de estratégia

## Contexto

O planner já retornava métricas e uma lista de passos, mas a interface mostrava
somente o resumo. O jogador precisava entender a base, o estado esperado e como
tratar retry/restart antes de decidir se a estratégia seria executada.

## Decisão

Cada `PlannerStrategy` passa a carregar um resumo do alvo e cada passo carrega
`expectedState`, `retry` e `restart` junto das métricas calculadas. A web usa
`details/summary` para abrir a explicação por teclado sem criar estado persistido
ou alterar o resultado.

A explicação é somente leitura: informa explicitamente que nenhuma tentativa,
moeda ou operação foi registrada/executada. O vínculo com `gameDataVersion` e
`priceSnapshotId` permanece visível no resumo.

## Consequências

- O jogador pode interpretar um caminho completo antes da futura tela de
  execução.
- O contrato de estratégia continua serializável e pronto para backend.
- Retry/restart são instruções do plano, não ações automáticas; RF-09 continua
  separado.
- Qualquer mudança de estado esperado precisa vir da receita versionada, não de
  texto improvisado no componente.
