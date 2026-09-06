# ADR 0030 — Versionamento local de planos durante o recálculo

- **Status:** Aceita
- **Data:** 2026-09-06
- **Contexto:** RF-11 precisa aceitar novos dados ou preferências sem apagar
  plano, snapshot, eventos ou gastos já registrados.

## Decisão

Cada resultado bem-sucedido do planner vira um `PlannerPlanVersion` com
identificador local, número monotônico, pedido copiado, timestamp e as versões
de game data e preço observadas. A execução recebe o `planVersionId` e a tela
mantém estados por combinação de versão e estratégia.

Um recálculo publica uma nova versão ao lado da anterior e pausa a troca até o
jogador escolher entre continuar a versão anterior ou iniciar a nova. A
alternância posterior entre versões reutiliza os eventos da versão escolhida;
nenhum evento é mesclado ou reescrito.

## Consequências

- Planos e snapshots anteriores permanecem auditáveis durante a sessão.
- Estratégias com ids iguais em versões diferentes não compartilham execução.
- O contrato é puro e testável sem Firebase.
- A coleção de versões ainda é efêmera e será persistida somente quando o
  backend de planos/jobs for implementado.

## Fora desta decisão

Não há consulta a provider, atualização automática, persistência Firestore,
reconciliação de craft em andamento ou transferência de gastos para a nova
versão.
