# Entrega: ciclo administrativo de dataset

- **Data**: 2026-09-06
- **Branch**: `master`
- **Plano de origem**: `docs/tasks/ciclo-administrativo-de-dataset.md`

## Funcionalidades

- Validação reutilizável de `PlannerDataset` com issues determinísticos.
- Endpoint administrativo `/api/admin/datasets` para importar, validar,
  publicar e reativar versões.
- Versões imutáveis, importação idempotente, ponteiro ativo transacional e
  auditoria append-only sem conteúdo do dataset.
- Autorização compartilhada com o diagnóstico RF-14A: bearer Firebase, provider
  Google e UID em `POE_ADMIN_UIDS` antes de acessar `ops/*`.

## Testes e validações

- `packages/planner/src/index.test.ts`: validação de contrato e caminhos.
- `functions/src/dataset-lifecycle.test.ts`: payloads, segurança de versão,
  transições e auditoria.
- Typecheck/build do planner e Functions executados com sucesso.
- Testes Node dos handlers/modelos de Functions: 11 testes aprovados.
- `pnpm validate`: verde.

Saída observável do gate:

```text
20 arquivos web / 81 testes aprovados
Cobertura: statements 89.11%, branches 81.68%, functions 90.8%, lines 92.37%
46 testes de contratos aprovados
11 testes das Functions aprovados
Typecheck e build de todos os workspaces aprovados
Smoke test do bundle web aprovado
```

Também foram executados `node scripts/check-architecture.mjs`,
`node scripts/check-docs.mjs`, `node scripts/check-firebase-config.mjs` e o
lint completo, todos verdes.

## Limites

A tela administrativa de ações e integrações de importação externa permanecem
no incremento RF-14C.
