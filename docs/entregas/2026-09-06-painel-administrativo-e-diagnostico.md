# Painel administrativo e diagnóstico operacional

- **Data**: 2026-09-06
- **Branch**: `master`
- **Plano de origem**: `docs/tasks/painel-administrativo-e-diagnostico.md`

## Objetivo

Criar a fronteira segura de RF-14 para que somente UIDs Google configurados no
backend consultem diagnóstico operacional, sem vazar dados para jogadores
comuns.

## Funcionalidades entregues

- **Autorização administrativa** — `getAdminOverview` valida bearer token,
  provider Google e `POE_ADMIN_UIDS` antes de ler qualquer documento.
- **Diagnóstico versionado** — o contrato agrega liga, dataset, snapshot de
  preços, contadores de fila e até dez falhas recentes, aceitando estado vazio.
- **Painel `/admin`** — a web apresenta carregamento, permissão negada, erro
  recuperável, sucesso e retentativa sem acessar Firebase no componente.
- **Proteção operacional** — documentos `ops/*` continuam protegidos pelas
  regras deny-all; a configuração privada fica em `functions/.env.example`.

## Critérios de aceite

- [x] Usuário anônimo ou Google não autorizado não recebe diagnóstico.
- [x] Admin Google configurado recebe contrato agregado versionado.
- [x] Método, bearer token, provider e UID são validados no servidor.
- [x] `/admin` cobre carregamento, 403, erro e sucesso.
- [x] `ops/*` permanece inacessível pelo cliente.
- [x] Testes, validação e documentação registram o comportamento real.

## Arquivos alterados

| Área         | Arquivos principais                                                                                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend      | `functions/src/model/admin-operations.ts`, `functions/src/api/admin-overview.ts`, `functions/src/admin-overview.test.ts`, `functions/src/index.ts`                                                |
| Web          | `apps/web/src/features/admin-operations/**`, `apps/web/src/app/App.tsx`, `apps/web/src/app/routes/index.tsx`                                                                                      |
| Configuração | `firebase.json`, `functions/.env.example`                                                                                                                                                         |
| Testes       | `apps/web/src/features/admin-operations/tests/**`, `e2e/app.spec.ts`                                                                                                                              |
| Documentação | `docs/tasks/painel-administrativo-e-diagnostico.md`, `docs/decisions/0032-fronteira-administrativa-no-backend.md`, `docs/architecture.md`, `docs/integrations.md`, `docs/testing.md`, `README.md` |

## Testes

| Teste                    | Tipo                 | O que cobre                                                                                         |
| ------------------------ | -------------------- | --------------------------------------------------------------------------------------------------- |
| `admin-overview.test.ts` | Functions/modelo     | Lista privada de administradores, autorização por provider, normalização, filas e limite de falhas. |
| `AdminPage.test.tsx`     | componente           | Sessão anônima, 403 sem dados, sucesso e retentativa após erro.                                     |
| `admin-overview.test.ts` | serviço/contrato web | Schema inválido, bearer token, respostas 401/403/503 e corpo inválido.                              |
| `e2e/app.spec.ts`        | Playwright           | Sessão Google sem permissão não vê diagnóstico operacional.                                         |

Saída real das suítes:

```text
Test Files  20 passed (20)
Tests  81 passed (81)
Coverage: Statements 89.11%, Branches 81.68%, Functions 90.8%, Lines 92.37%
tests 46 / pass 46 (contratos)
tests 6 / pass 6 (Functions)
1 passed (E2E do diagnóstico sem permissão)
```

## Validações executadas

| Comando                                          | Resultado                                                                                                                            |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm validate`                                  | Verde: toolchain, workspace, skills, arquitetura, docs, styleguide, Firebase, formato, lint, testes, typecheck, builds e smoke test. |
| `pnpm check:docs`                                | Verde.                                                                                                                               |
| `pnpm check:architecture`                        | Verde.                                                                                                                               |
| `pnpm check:firebase`                            | Verde.                                                                                                                               |
| `pnpm test:e2e --grep "diagnóstico operacional"` | 1 teste passou.                                                                                                                      |

## Fora do escopo

- Importar, validar, publicar, reativar ou fazer rollback de datasets.
- Acesso administrativo a conteúdo privado de crafts e auditoria de suporte.
- Bloqueio de OCR/jobs por orçamento (RF-15).
- Deploy em projeto Firebase real.

## Limitações e pendências conhecidas

- Os documentos `ops/*` ainda precisam ser escritos por pipelines de dataset,
  preços e jobs que serão implementados nos próximos incrementos.
- A autorização depende da configuração real de `POE_ADMIN_UIDS` no ambiente
  das Functions; vazio, o painel nega todos os acessos.
- Snapshots visuais históricos do E2E continuam com pequenas diferenças de
  baseline; o teste específico da permissão passou sem atualizar imagens.

## Como verificar manualmente

1. Copie `functions/.env.example` para o ambiente das Functions e preencha
   `POE_ADMIN_UIDS` com um UID Google de teste.
2. Execute `pnpm dev` com `VITE_AUTH_FIXTURE=true` e abra `/admin`.
3. Sem autorização, confirme **Sem permissão** e ausência de dados operacionais.
4. Com um backend configurado e documentos `ops/*`, confirme que liga, dataset,
   snapshot, fila e falhas aparecem no resumo somente após o 200 autorizado.
