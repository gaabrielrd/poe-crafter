# Sessão anônima e login Google

- **Data**: 2026-09-06
- **Branch**: `master`
- **Plano de origem**: `docs/tasks/sessao-anonima-e-login-google.md`

## Objetivo

Permitir que qualquer visitante comece um craft com uma sessão anônima estável e
vincule essa mesma identidade somente ao Google, sem bloquear `/new`.

## Funcionalidades entregues

- **Sessão automática** — provider raiz observa o Auth e cria sessão anônima.
- **Vínculo Google** — única ação de identidade, preservando o UID atual.
- **Estados acessíveis** — loading, anônimo, Google conectado e erro recuperável
  com mensagens para popup, conflito e rede.
- **Storage privado preparado** — `screenshots/{uid}/` owner-only, imagens até
  8 MiB; demais caminhos permanecem negados.
- **Fixture E2E** — fluxo determinístico sem conta Google real.

## Critérios de aceite

- [x] Sessão anônima inicia automaticamente e `/new` continua utilizável.
- [x] Apenas o provider Google é exposto pelo adaptador.
- [x] Vínculo mantém UID e confirma estado Google.
- [x] Erros recuperáveis não afirmam sucesso nem removem a sessão.
- [x] Storage restringe acesso ao próprio UID e ao prefixo de screenshots.
- [x] Testes unitários, contratos, E2E e `pnpm validate` passam.

## Arquivos alterados

| Área                                               | Mudança                                                          |
| -------------------------------------------------- | ---------------------------------------------------------------- |
| `apps/web/src/features/identity/`                  | Modelo, adaptador Firebase/fixture, provider, hook, UI e testes. |
| `apps/web/src/app/` e `apps/web/src/main.tsx`      | Provider global e painel de conta no shell.                      |
| `apps/web/src/shared/config/` e `.env.example`     | Configuração pública Firebase tipada.                            |
| `storage.rules` e `scripts/check-firebase-config*` | Regras owner-only e contrato estrutural.                         |
| `e2e/` e `playwright.config.ts`                    | Fixture de Auth e snapshots atualizados.                         |
| `docs/`                                            | ADR, arquitetura, integrações, plano concluído e esta evidência. |

## Testes

| Teste                                    | Tipo     | O que cobre                                                          |
| ---------------------------------------- | -------- | -------------------------------------------------------------------- |
| `IdentityProvider.test.tsx`              | unidade  | Sessão anônima, vínculo preservando UID, fixture e erros acionáveis. |
| `scripts/check-firebase-config.test.mjs` | contrato | Storage privado por UID, limite de 8 MiB e deny-all fora do prefixo. |
| `e2e/app.spec.ts`                        | E2E      | Estado anônimo, promoção Google simulada, navegação e layout 360 px. |

Saída real:

```text
Test Files  11 passed (11)
Tests  40 passed (40)
Statements 90.4% | Branches 85.58% | Functions 91.4% | Lines 93.17%
12 passed (16.4s) [Playwright E2E]
42 passed [scripts/*.test.mjs]
```

## Validações executadas

| Comando                | Resultado                                        |
| ---------------------- | ------------------------------------------------ |
| `pnpm validate`        | Verde                                            |
| `pnpm lint`            | Verde                                            |
| `pnpm test:e2e:update` | Verde; 12 snapshots regenerados intencionalmente |

Saída real do gate:

```text
Toolchain OK: pnpm 11.19.0; Node 24.14.1.
Verificação arquitetural OK.
Validação da documentação OK.
Verificação do styleguide OK.
Configuração Firebase estrutural OK: emuladores e regras privadas.
All matched files use Prettier code style!
Scope: 5 of 6 workspace projects ... Done
Smoke test do bundle web OK.
```

## Fora do escopo

Email/senha, outros providers, exclusão de conta, histórico Firestore, upload
real de screenshot, TTL, App Check, compartilhamento público e planejamento.

## Limitações e pendências conhecidas

- Produção exige preencher `VITE_FIREBASE_*` com a configuração pública do
  projeto; nenhum ID pessoal foi versionado.
- O E2E usa fixture; validação com Google real deve ocorrer em ambiente manual.
- Upload e limpeza de screenshots serão implementados no incremento de
  persistência.

## Como verificar manualmente

1. Copie `.env.example` para `apps/web/.env.local` e preencha os cinco valores
   públicos Firebase.
2. Execute `pnpm dev` e abra `/` ou `/new`.
3. Confirme “Sessão anônima” e use “Vincular Google”.
4. No retorno, confirme “Google conectado” e o mesmo craft/UID lógico.
