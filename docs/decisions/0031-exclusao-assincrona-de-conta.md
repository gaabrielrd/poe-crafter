# ADR-0031: Exclusão assíncrona de conta com autoridade no backend

- **Status:** Aceita
- **Data:** 2026-09-06
- **Decisão:** solicitar exclusão somente após reautenticação Google e confirmação
  explícita; revogar o acesso imediatamente e concluir a limpeza por job
  idempotente em até 24 horas.

## Contexto

A aplicação começa com uma sessão anônima, mas o histórico durável pertence à
identidade Google vinculada. A exclusão precisa cobrir crafts, screenshots
temporários e a identidade Firebase sem depender de uma operação destrutiva
direta do navegador ou afirmar sucesso antes de a limpeza terminar.

## Decisão

`/settings` exige a palavra `EXCLUIR` e chama `reauthenticateWithPopup` antes de
enviar `DELETE` ao endpoint autenticado `/api/account-deletion`. O handler aceita
somente bearer tokens cujo provider seja `google.com`, revoga refresh tokens e
grava `accountDeletionRequests/{uid}` com `pending`, `requestedAt` e
`scheduledFor` 24 horas à frente. Solicitações `pending` ou `processing` são
idempotentes.

Um job `onSchedule` executa a cada 15 minutos. Depois do prazo, marca o registro
como `processing`, remove crafts do UID em lotes, remove `screenshots/{uid}/`,
exclui o usuário Auth e marca `completed`. Qualquer erro marca `failed` com
mensagem e horário, mantendo a solicitação observável para uma nova tentativa
operacional. A coleção não é liberada nas regras do cliente; somente o Admin
SDK acessa o registro.

## Consequências

- O usuário recebe confirmação imediata do agendamento, não da exclusão já
  concluída.
- O backend controla autorização, ordem e prazo, evitando apagar dados de outro
  UID ou criar concorrência a partir do navegador.
- A exclusão de contas anônimas e providers diferentes de Google fica fora do
  escopo.
- O job exige monitoramento operacional para reprocessar registros `failed`.
