# 0028 — Execução append-only local

## Contexto

O planner já publicava estratégias explicadas, mas ainda não havia uma forma
observável de registrar tentativas e gastos sem perder a ordem dos eventos.
Persistir diretamente em Firestore antes de fechar o contrato tornaria difícil
testar retry, restart, validações e futura reconciliação.

## Decisão

O package `planner` expõe um contrato puro e versionado de execução local.
`createExecutionState` inicia uma sessão para uma estratégia e
`appendExecutionEvent` devolve um novo estado, sem alterar o estado ou os
eventos anteriores. Cada evento recebe id determinístico, sequência, passo,
resultado, timestamp fornecido pelo chamador, recursos e custo em chaos.

`success` avança o passo, `retry` mantém o passo, `restart` volta ao primeiro
passo e `skipped` só é aceito quando a receita marca o passo como pulável. O
componente web registra os eventos no estado da página e informa que ainda não
há sincronização com Firestore.

## Consequências

- O histórico de uma sessão é auditável e não destrutivo desde o primeiro
  registro.
- A mesma transição pode ser usada por UI, testes e futuro serviço de
  persistência sem depender de React ou Firebase.
- Recursos inválidos e outcomes proibidos retornam erros estruturados sem
  descartar a edição local.
- A sessão é efêmera até RF-09 ganhar persistência; fechar ou recarregar a
  página perde os eventos locais.
- Resumo estimado versus real (RF-10) e reconciliação (RF-11) continuam
  separados deste contrato.
