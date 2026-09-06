# Upload privado e TTL de screenshot

- **Data**: 2026-09-06
- **Branch**: `master`
- **Plano de origem**: `docs/tasks/upload-privado-e-ttl-de-screenshot.md`

## Objetivo

Fechar o fluxo de screenshot com Storage privado, OCR autenticado e limpeza
automática, sem persistir imagens no histórico do craft.

## Funcionalidades entregues

- **Upload privado** — o web app gera `screenshots/{uid}/{uploadId}`, envia
  metadata e nunca aceita caminho escolhido livremente.
- **OCR autenticado** — Functions verifica o ID token, confere UID, MIME,
  tamanho e assinatura antes de baixar o objeto.
- **Limpeza garantida** — o objeto é removido em `finally` e há função agendada
  para remover órfãos com mais de 24 horas.
- **Quota idempotente** — contador mensal transacional em Firestore por mês e
  `requestId`, limitado a 1.000 imagens.
- **Fallback seguro** — fixture E2E e importação por texto continuam disponíveis
  sem conta Google real ou Cloud Vision pago.

## Critérios de aceite

- [x] Upload privado por UID com progresso acessível.
- [x] Autorização, MIME, tamanho e assinatura validados antes do Vision.
- [x] Remoção em sucesso/falha e limpeza agendada de 24 horas.
- [x] Quota mensal e retry idempotente preparados no backend.
- [x] Rules continuam negando usuários e caminhos fora do escopo.
- [x] Web, Functions, contratos e E2E fixture passam sem credenciais reais.

## Arquivos alterados

| Área                                             | Mudança                                                       |
| ------------------------------------------------ | ------------------------------------------------------------- |
| `apps/web/src/features/screenshot-import/`       | Gateway Storage, contrato por referência, progresso e testes. |
| `apps/web/src/features/identity/`                | Token e usuário atual expostos pela API pública da feature.   |
| `functions/src/api/screenshot-ocr.ts`            | Handler autenticado, metadata, assinatura, OCR e cleanup.     |
| `functions/src/services/`                        | Firebase Admin e quota transacional.                          |
| `functions/src/scheduled/`                       | Limpeza agendada de screenshots expirados.                    |
| `packages/shared-types/`                         | `ScreenshotOcrRequest`.                                       |
| `storage.rules`, `package.json`, `firebase.json` | Regras/dependências/configuração de execução.                 |
| `docs/`                                          | ADR, arquitetura, integrações, plano concluído e evidência.   |

## Testes

| Teste                                                                  | Tipo               | Resultado                                   |
| ---------------------------------------------------------------------- | ------------------ | ------------------------------------------- |
| `apps/web/src/features/screenshot-import/tests/screenshot-ocr.test.ts` | unidade            | Contrato JSON, token, upload e erros.       |
| `scripts/screenshot-ocr.test.mjs`                                      | Functions/contrato | UID, assinatura, remoção, quota e TTL.      |
| `e2e/app.spec.ts`                                                      | E2E                | Fixture OCR, identidade e layout em 360 px. |

Saída real:

```text
Test Files  11 passed (11)
Tests  42 passed (42)
Statements 90.66% | Branches 84.5% | Functions 91.48% | Lines 94.1%
45 passed [scripts/*.test.mjs]
12 passed [Playwright E2E]
```

## Validações executadas

| Comando                                      | Resultado                                                                                |
| -------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `pnpm validate`                              | Verde                                                                                    |
| `pnpm --filter @poe-crafter/functions build` | Verde                                                                                    |
| `pnpm test:e2e`                              | Verde, 12/12                                                                             |
| `pnpm test:emulators`                        | Bloqueado pelo Firebase CLI local (`winston`: `isStream is not a function`) após o build |

## Fora do escopo

Histórico Firestore, persistência de crafts, App Check, exclusão de conta,
planner, preços, execução do craft e deploy no projeto Firebase real.

## Limitações e pendências conhecidas

- A Emulator Suite precisa de uma correção/atualização do Firebase CLI local
  para validar o caminho autenticado de ponta a ponta.
- O E2E usa fixture; a conta Google e o Cloud Vision reais não são acionados na
  suíte automatizada.
- O documento de quota armazena chaves de request para idempotência; retenção e
  compactação dessa lista devem ser revisadas antes de uso em alta escala.
- `apps/web/.env.local` foi criado localmente com a configuração pública enviada
  e permanece ignorado pelo Git.

## Como verificar manualmente

1. Confirme os valores `VITE_FIREBASE_*` em `apps/web/.env.local`.
2. Configure `VITE_API_URL` apontando para Functions/Hosting e execute `pnpm dev`.
3. Abra `/new`, selecione uma imagem válida e observe upload/processamento.
4. Verifique no Storage que o caminho contém apenas o UID atual e que o objeto
   é removido após o OCR.
