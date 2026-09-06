# Persistência privada e histórico de crafts

- **Data**: 2026-09-06
- **Branch**: `master`
- **Plano de origem**: `docs/tasks/persistencia-privada-e-historico-de-crafts.md`

## Objetivo

Permitir que o jogador salve o alvo confirmado, veja seu histórico privado e
retome o mesmo craft depois, mantendo o isolamento por UID anônimo ou Google.

## Funcionalidades entregues

- **Craft privado** — alvo confirmado, classificações, liga/modo e timestamps
  são salvos em `crafts/{craftId}`; screenshot e OCR bruto não são persistidos.
- **Histórico** — `/history` lista até 50 crafts do UID atual, ordenados por
  `updatedAt`, com estados de carregamento, vazio, erro e permissão.
- **Retomada** — `/craft/:craftId` restaura o alvo e permite atualizar o mesmo
  documento.
- **Rules owner-only** — Firestore impede leitura de terceiros e alteração de
  `ownerUid`/versão; os caminhos restantes continuam deny-all.
- **Fixture determinística** — E2E e testes web cobrem o fluxo sem credenciais
  pessoais ou acesso ao projeto Firebase real.

## Critérios de aceite

- [x] Salvar explícito após confirmação e atualizar o mesmo `craftId`.
- [x] Listar apenas crafts do UID atual em ordem de atualização.
- [x] Retomar alvo, liga/modo e classificações.
- [x] Aplicar Rules owner-only e índice `ownerUid + updatedAt`.
- [x] Preservar o UID no fluxo anônimo → Google, sem duplicação client-side.
- [x] Rejeitar schema/payload inválido na fronteira.
- [x] Cobrir sucesso, vazio, erro, permissão, layout 360 px e E2E fixture.

## Arquivos alterados

| Área                                        | Mudança                                                                     |
| ------------------------------------------- | --------------------------------------------------------------------------- |
| `apps/web/src/features/craft-persistence/`  | Contrato, validação, repositórios, histórico e retomada.                    |
| `apps/web/src/features/item-import/`        | Hidratação do alvo e salvamento/atualização explícitos.                     |
| `apps/web/src/app/routes/`, `App.tsx`       | Rotas `/history`, `/craft/:craftId` e navegação.                            |
| `firestore.rules`, `firestore.indexes.json` | Isolamento por UID e índice de histórico.                                   |
| `scripts/check-firebase-config*`            | Contrato estrutural para Firestore owner-only.                              |
| `docs/`                                     | Arquitetura, integrações, ADR, plano concluído e evidência.                 |
| `e2e/`                                      | Fluxo de criação, listagem, retomada e snapshots atualizados após inspeção. |

## Testes

| Teste                                          | Tipo     | O que cobre                                           |
| ---------------------------------------------- | -------- | ----------------------------------------------------- |
| `craft-persistence/tests/craft.test.ts`        | unidade  | Validação, schema, CRUD fixture e isolamento por UID. |
| `craft-persistence/tests/HistoryPage.test.tsx` | UI       | Histórico vazio, sucesso e erro recuperável.          |
| `item-import/tests/ItemImportPage.test.tsx`    | UI       | Salvar e atualizar o mesmo craft.                     |
| `scripts/check-firebase-config.test.mjs`       | contrato | Firestore owner-only e fallback deny-all.             |
| `e2e/app.spec.ts`                              | E2E      | Criar, retomar e listar craft no fixture.             |

Saída real:

```text
Test Files  13 passed (13)
Tests  48 passed (48)
Statements 87.94% | Branches 82.12% | Functions 90.47% | Lines 91.43%
46 passed [scripts/*.test.mjs]
13 passed [Playwright Chromium]
```

## Validações executadas

| Comando             | Resultado    |
| ------------------- | ------------ |
| `pnpm validate`     | Verde        |
| `pnpm test:e2e`     | Verde, 13/13 |
| `pnpm check:docs`   | Verde        |
| `pnpm format:check` | Verde        |

O `pnpm validate` final também concluiu typecheck, builds, smoke do bundle,
lint, styleguide, arquitetura e contratos Firebase.

## Fora do escopo

Planner, crafting-engine, eventos/gastos, exclusão de conta, App Check,
compartilhamento, migração entre UIDs e deploy no projeto Firebase real.

## Limitações e pendências conhecidas

- O Firestore Emulator não foi repetido neste incremento; a execução anterior
  permaneceu bloqueada pelo Firebase CLI local (`winston`: `isStream is not a
function`).
- A lista tem limite inicial de 50 documentos e não possui paginação.
- A validação de Rules em ambiente real depende de habilitar Auth/Firestore no
  projeto Firebase e configurar o provider Google no console.

## Como verificar manualmente

1. Execute a aplicação com `VITE_AUTH_FIXTURE=true` ou com Firebase configurado.
2. Abra `/new`, selecione uma liga, importe o exemplo `Divine Crown`, classifique
   os modificadores e confirme o alvo.
3. Clique em **Salvar craft**, abra o histórico e entre no craft salvo.
4. Altere um campo, confirme novamente e observe que o mesmo link/craft é
   atualizado.
