# ADR-0032: Autorização administrativa no backend

- **Status:** Aceita
- **Data:** 2026-09-06
- **Decisão:** autorizar o diagnóstico operacional por UID Google configurado em
  `POE_ADMIN_UIDS`, antes de qualquer leitura de `ops/*`.

## Contexto

RF-14 exige que usuários comuns não recebam diagnóstico ou conteúdo operacional.
Uma flag no navegador seria falsificável e uma regra Firestore para o cliente
exporia documentos de operação. O primeiro incremento de RF-14 precisa entregar
uma fronteira segura mesmo antes de existirem ações de publicação de dataset.

## Decisão

`getAdminOverview` valida método, bearer token, provider `google.com` e UID
contra uma lista privada separada por vírgula em `POE_ADMIN_UIDS`. A leitura de
`ops/leagueCatalog`, `ops/activeDataset`, `ops/priceSnapshot` e `ops/jobs` só
acontece depois dessa autorização. A resposta usa schema versionado, normaliza
documentos ausentes e limita a dez falhas recentes.

A web acessa o handler por um serviço da feature `admin-operations`. A rota
`/admin` mostra estados de carregamento, permissão, erro e sucesso; componentes
não acessam Firebase nem `fetch` diretamente. `ops/*` permanece protegido pelo
deny-all das regras Firestore.

## Consequências

- A ausência de `POE_ADMIN_UIDS` nega todos os acessos, evitando uma abertura
  acidental durante o deploy.
- O diagnóstico inicial continua somente leitura; o ciclo de dataset possui
  contrato separado, transacional e sem conteúdo na auditoria. Interface de
  operações, rollback explícito e suporte auditado continuam decisões futuras.
- O painel pode mostrar estado vazio sem inventar dataset, preços ou jobs.
- A operação precisa configurar e rotacionar a lista de UIDs no ambiente das
  Functions, sem colocá-la em variáveis `VITE_`.
