# Importação de screenshot com OCR

- **Data**: 2026-09-06
- **Branch**: `master`
- **Plano de origem**: `docs/tasks/importacao-de-screenshot-com-ocr.md`

## Objetivo

Permitir que o jogador envie um screenshot do item em `/new` e receba o texto
extraído para o mesmo parser e confirmação usados na importação colada.

## Funcionalidades entregues

- **Validação de screenshot** — seleção ou arrastar/soltar de PNG, JPEG e WebP
  até 8 MB, com validação duplicada no backend.
- **OCR backend** — endpoint `/api/screenshot-ocr` com Cloud Vision, fixture
  local e resposta normalizada; OCR real exige `POE_OCR_ENABLED=true`.
- **Integração com o fluxo** — texto extraído alimenta `parseItemText`, resumo e
  confirmação sem perder liga ou modo manual.
- **Proteção de formato e qualidade** — assinaturas de imagem verificadas,
  mensagens acessíveis e formatação global sincronizada nas skills.

## Critérios de aceite

- [x] Arquivos PNG, JPEG e WebP válidos de até 8 MB são aceitos.
- [x] Tipos, arquivos vazios, conteúdo incompatível e tamanhos acima do limite
      são rejeitados com mensagem acionável.
- [x] O OCR é chamado somente no backend e retorna texto para o parser existente.
- [x] O fluxo de sucesso e os estados de erro são utilizáveis em 360 px.
- [x] `pnpm validate` passa após a correção de formatação e sincronização das
      skills.

## Arquivos alterados

| Área                   | Arquivos principais                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| Web                    | `apps/web/src/features/screenshot-import/`, `apps/web/src/features/item-import/components/ItemImportPage.tsx` |
| Backend                | `functions/src/api/screenshot-ocr.ts`, `functions/src/index.ts`, `functions/package.json`                     |
| Contratos/configuração | `packages/shared-types/src/index.ts`, `firebase.json`, `pnpm-lock.yaml`                                       |
| Testes                 | `apps/web/src/features/screenshot-import/tests/`, `scripts/screenshot-ocr.test.mjs`, `e2e/app.spec.ts`        |
| Documentação           | `README.md`, `docs/architecture.md`, `docs/integrations.md`, ADR 0020, plano RF-03                            |

## Testes

| Teste                | Tipo       | Resultado                        |
| -------------------- | ---------- | -------------------------------- |
| Suíte web Vitest     | unidade/UI | 10 arquivos, 36 testes aprovados |
| `scripts/*.test.mjs` | contratos  | 41 testes aprovados              |
| `pnpm test:e2e`      | E2E        | 11 testes aprovados              |

Saída real:

```text
Test Files  10 passed (10)
Tests  36 passed (36)
Statements 90.38% · Branches 86.36% · Functions 92.59% · Lines 93.39%

ℹ tests 41
ℹ pass 41

11 passed (14.1s)
```

## Validações executadas

| Comando                                    | Resultado                      |
| ------------------------------------------ | ------------------------------ |
| `pnpm install --frozen-lockfile --offline` | Verde; lockfile atualizado     |
| `pnpm check:architecture`                  | Verde                          |
| `pnpm check:docs`                          | Verde                          |
| `pnpm check:styleguide`                    | Verde                          |
| `pnpm check:firebase`                      | Verde                          |
| `pnpm lint`                                | Verde                          |
| `pnpm build`                               | Verde; smoke test do bundle OK |
| `pnpm validate`                            | Verde                          |

## Fora do escopo

Storage privado, TTL de 24 horas, autenticação/App Check e contador de cota
durável em Firestore.

## Limitações e pendências conhecidas

O endpoint processa bytes em memória e a cota é por instância de Functions. O
OCR fica desabilitado por padrão sem `POE_OCR_ENABLED=true`; a fixture é somente
para desenvolvimento e testes. A próxima feature deve fechar identidade,
Storage privado, limpeza e quota durável antes do tráfego de produção.

## Como verificar manualmente

1. Execute `pnpm dev` e abra `/new`.
2. Selecione a liga PC (ou modo manual) e escolha uma imagem PNG/JPEG/WebP de até
   8 MB.
3. Em desenvolvimento, a fixture extrai um item `Divine Crown`; confirme que o
   resumo aparece e segue para a confirmação existente.
