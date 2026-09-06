# Entrega: ações administrativas de dataset

- **Data**: 2026-09-06
- **Branch**: `master`
- **Plano de origem**: `docs/tasks/acoes-administrativas-de-dataset.md`

## Objetivo

Permitir que administradores Google autorizados operem as versões de dataset
pela rota `/admin`, usando o backend RF-14B sem duplicar suas regras.

## Funcionalidades entregues

- Formulário de importação com versão, JSON, limite de 20 KB e parsing local.
- Controles para validar, publicar e reativar uma versão.
- Estados de envio, sucesso, erro, issues de validação e atualização do
  diagnóstico após sucesso.
- Contrato e service autenticado com mapeamento de erros HTTP.

## Critérios de aceite

- [x] Ações aparecem apenas depois do diagnóstico de sessão Google autorizado.
- [x] JSON inválido é rejeitado antes da chamada HTTP.
- [x] O service envia bearer, ação, versão e dataset somente quando aplicável.
- [x] Respostas aceitas atualizam o overview; falhas preservam a edição.
- [x] Testes e `pnpm validate` ficam verdes.

## Testes

| Teste                   | Tipo       | O que cobre                             |
| ----------------------- | ---------- | --------------------------------------- |
| `admin-dataset.test.ts` | unidade    | Contrato, bearer, payload e erros 422   |
| `AdminPage.test.tsx`    | componente | Importação, refresh, permissão e issues |

## Validações executadas

`pnpm validate` passou após a implementação, incluindo cobertura web, contratos,
testes Functions, lint, typecheck, builds e smoke test.

## Fora do escopo

Editor visual de receitas, importadores RePoE/poe.ninja, suporte a crafts e
controle de custo RF-15.
