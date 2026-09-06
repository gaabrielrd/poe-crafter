# Entrega: suporte administrativo auditado

**Data:** 2026-09-06  
**Plano:** [suporte administrativo auditado](../tasks/suporte-administrativo-auditado.md)  
**PRD:** RF-14 / CA-14 / RN-15

## Funcionalidades

- Endpoint `POST /api/admin/support/craft` com autenticação Google e
  autorização por `POE_ADMIN_UIDS`.
- Validação de ID e justificativa limitada a 500 caracteres antes do acesso ao
  Firestore.
- Leitura normalizada de craft e auditoria append-only transacional em
  `ops/supportAuditEvents`, sem conteúdo privado no evento.
- Formulário acessível no `/admin`, com carregando, validação, erro, sucesso e
  limpeza do resultado em novo pedido; nenhum dado é salvo no navegador.

## Testes e validações

- `support-access.test.ts`: contratos, IDs, justificativa, normalização e
  exclusão de conteúdo da auditoria.
- `admin-support.test.ts`: bearer, contrato de resposta e mapeamento de erros.
- `AdminPage.test.tsx`: autorização, sucesso, conteúdo formatado e falha
  recuperável.
- `pnpm validate`: aprovado (testes web, cobertura, contratos, Functions,
  arquitetura, documentação, regras Firebase, typecheck, build e smoke).

## Segurança e limites

O acesso continua restrito a administradores Google autorizados. Não há edição,
listagem, exportação ou compartilhamento de crafts; custo, timeout de jobs e
fluxo E2E permanecem nos próximos incrementos do PRD.
