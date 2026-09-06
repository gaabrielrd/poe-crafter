# Exclusão de conta e dados

- **Data**: 2026-09-06
- **Branch**: `master`
- **Plano de origem**: `docs/tasks/exclusao-de-conta-e-dados.md`

## Objetivo

Dar ao jogador Google uma forma segura de solicitar a exclusão de sua conta e
dos dados privados, com confirmação imediata do agendamento sem declarar que a
remoção já terminou.

## Funcionalidades entregues

- **Configurações** — a rota `/settings` orienta sessões anônimas a vincular
  Google e, para contas Google, exige `EXCLUIR` e reautenticação antes da ação.
- **Solicitação privada** — o endpoint aceita somente token Google e confirmação
  `DELETE`, revoga tokens e retorna recibo pendente com prazo de 24 horas.
- **Limpeza agendada** — o job a cada 15 minutos remove crafts, screenshots e a
  identidade Firebase na ordem definida, registrando `completed` ou `failed`.
- **Retentativa segura** — solicitações pendentes/em processamento são
  idempotentes; falhas permanecem visíveis e não são apresentadas como sucesso.

## Critérios de aceite

- [x] Sessão anônima não expõe ação destrutiva e recebe orientação para vincular
      Google.
- [x] Conta Google precisa da confirmação literal `EXCLUIR` e da reautenticação.
- [x] Endpoint rejeita método, token, provider e payload inválidos.
- [x] Solicitação retorna confirmação imediata e prazo máximo de 24 horas.
- [x] Job remove dados do UID, registra falhas recuperáveis e mantém idempotência.
- [x] Rota preserva erro/confirmação e o plano passa pelos gates do projeto.

## Arquivos alterados

| Área            | Arquivos principais                                                                                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identidade e UI | `apps/web/src/features/identity/**`, `apps/web/src/features/account-settings/**`, `apps/web/src/app/App.tsx`, `apps/web/src/app/routes/index.tsx`                                |
| Backend         | `functions/src/api/account-deletion.ts`, `functions/src/model/account-deletion.ts`, `functions/src/scheduled/process-account-deletions.ts`, `functions/src/index.ts`             |
| Configuração    | `firebase.json`, `firestore.rules`, `functions/tsconfig*.json`, `package.json`                                                                                                   |
| Testes          | `apps/web/src/features/account-settings/tests/SettingsPage.test.tsx`, `functions/src/account-deletion.test.ts`, `e2e/app.spec.ts`                                                |
| Documentação    | `docs/tasks/exclusao-de-conta-e-dados.md`, `docs/decisions/0031-exclusao-assincrona-de-conta.md`, `docs/architecture.md`, `docs/integrations.md`, `docs/testing.md`, `README.md` |

## Testes

| Teste                      | Tipo             | O que cobre                                                                       |
| -------------------------- | ---------------- | --------------------------------------------------------------------------------- |
| `SettingsPage.test.tsx`    | componente       | Sessão anônima, confirmação `EXCLUIR`, recibo pendente e falha de reautenticação. |
| `account-deletion.test.ts` | Functions/modelo | Prazo de 24 horas, idempotência, ordem de limpeza e falha recuperável.            |
| `e2e/app.spec.ts`          | Playwright       | Orientação anônima, vínculo Google, confirmação e recibo na rota `/settings`.     |

Saída real da validação automatizada:

```text
Test Files  18 passed (18)
Tests  64 passed (64)
Coverage: Statements 89.1%, Branches 81.52%, Functions 90.36%, Lines 91.84%
tests 46 / pass 46 (contratos)
tests 3 / pass 3 (Functions)
```

## Validações executadas

| Comando                                                                                                 | Resultado                                                       |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `pnpm validate`                                                                                         | Verde: checks, lint, testes, typecheck, builds e smoke test.    |
| `pnpm --filter @poe-crafter/web test:unit -- src/features/account-settings/tests/SettingsPage.test.tsx` | 3 testes passaram.                                              |
| `pnpm test:e2e --grep "solicita exclusão"`                                                              | 1 teste passou.                                                 |
| `pnpm test:e2e`                                                                                         | 8 passaram; 6 falharam apenas por snapshots visuais existentes. |
| `pnpm check:docs`                                                                                       | Verde, incluído no `pnpm validate`.                             |

## Fora do escopo

- Exclusão de sessões anônimas sem vínculo Google.
- Email/senha ou outros providers.
- Painel administrativo, auditoria completa e exportação de dados.
- Deploy em projeto Firebase real.

## Limitações e pendências conhecidas

- O job marca falhas para nova tentativa operacional; não há painel de
  administração nesta entrega.
- Os snapshots visuais do repositório apresentam diferença pequena no ambiente
  atual e não foram atualizados sem inspeção visual.
- A conclusão depende do deploy das Functions e do scheduler no ambiente alvo.

## Como verificar manualmente

1. Execute `pnpm dev` com `VITE_AUTH_FIXTURE=true` e abra `/settings`.
2. Confirme que a sessão anônima recebe orientação e não vê o botão destrutivo.
3. Na home, clique **Vincular Google**, abra **Configurações**, escolha
   **Solicitar exclusão**, digite `EXCLUIR` e confirme.
4. Verifique **Exclusão agendada**, o prazo informado e o texto que diferencia
   agendamento de remoção concluída.
