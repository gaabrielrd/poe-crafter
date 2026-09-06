# Ciclo administrativo de dataset

**Status:** Implementado em 2026-09-06  
**PRD:** RF-14B / RN-10 / CA-13  
**Dependências:** [painel administrativo e diagnóstico](painel-administrativo-e-diagnostico.md), [contrato do planner](../decisions/0026-contrato-de-estrategias-e-job-local.md)

## Contexto

O painel administrativo já valida a autorização no backend e mostra estado
agregado, mas ainda não existe um ciclo seguro para receber, validar, publicar
ou reativar versões do dataset. O planner já possui um contrato tipado e um
dataset starter, porém não há validação reutilizável nem armazenamento
versionado em `ops/*`.

Este incremento fecha a autoridade de servidor do ciclo de dataset. A tela de
ações administrativas será integrada no incremento seguinte; nenhum jogador
ou cliente comum poderá chamar os handlers novos sem a mesma autorização de
RF-14A.

## Objetivo

Disponibilizar uma API administrativa idempotente para importar uma versão,
validá-la contra o contrato do planner, publicá-la como ativa e reativar uma
versão previamente validada, sempre preservando versões imutáveis e registrando
um evento de auditoria append-only.

## Requisitos

- Reutilizar o package `@poe-crafter/planner` como autoridade de validação do
  dataset; não duplicar regras de steps no handler.
- Aceitar somente versões identificadas por caracteres seguros e datasets JSON
  serializáveis com `schemaVersion`, `gameDataVersion`, `priceSnapshotId` e
  receitas válidas.
- `import` grava uma versão `imported` sem alterar a versão ativa.
- `validate` grava `validated` quando todos os recipes/steps são válidos; em
  falha grava `failed` com issues estáveis e não muda a versão ativa.
- `publish` e `reactivate` só aceitam versões `validated`, atualizam o ponteiro
  ativo em transação e marcam a versão anterior como `retired`.
- Nenhuma versão publicada deve ser sobrescrita: mudanças geram outro ID de
  versão; apenas metadados de estado e auditoria podem evoluir.
- Cada ação autorizada registra ator, ação, versão, horário e resultado em
  `ops/auditEvents`; falhas de autorização não criam evento operacional.
- Usuário anônimo, provider diferente de Google ou UID ausente em
  `POE_ADMIN_UIDS` recebem 401/403 sem leitura ou escrita em `ops/*`.

## Não escopo

- Interface web dos formulários/botões de ação; será RF-14C.
- Importação automática de RePoE, poe.ninja, Cloud Vision ou Storage.
- Rollback por botão separado, suporte a conteúdo privado de crafts e auditoria
  de suporte (CA-14).
- Proteção de custo e bloqueio de OCR/jobs (RF-15).
- Persistência de jobs de planejamento; o dataset apenas se torna fonte
  versionada para os próximos jobs.

## Suposições

- O identificador de versão é fornecido pelo operador e representa um artefato
  imutável; o servidor rejeita path traversal e sobrescrita de conteúdo.
- O Firestore Admin SDK é a única autoridade para `ops/datasets`,
  `ops/activeDataset` e `ops/auditEvents`; as rules do cliente continuam
  deny-all.
- Uma versão `failed` pode ser importada novamente apenas com outro ID, para
  manter o histórico de falhas sem alterar o documento anterior.
- `reactivate` é a mesma transação de publicação, mas exige uma versão existente
  `validated`/`retired` e registra ação distinta.

## Proposta de solução

1. Expor `validatePlannerDataset` no package planner, com issues determinísticos
   para schema, metadata, recipes e steps.
2. Criar o modelo puro de lifecycle em Functions para validar payloads,
   transições permitidas e contrato de auditoria.
3. Centralizar autenticação administrativa e reutilizá-la no overview e no
   endpoint `/api/admin/datasets`.
4. Implementar handlers POST com ações `import`, `validate`, `publish` e
   `reactivate`, usando transação para ponteiro ativo, estado anterior e evento
   append-only.
5. Adicionar rewrite/configuração, testes do planner e modelo, e atualizar
   documentação/ADR/entrega sem expor UIDs reais.

## Tarefas sequenciais

- [x] Expor e testar a validação de `PlannerDataset`.
- [x] Criar modelo puro de estados, payloads e auditoria.
- [x] Centralizar a autorização de handlers administrativos.
- [x] Implementar importação/validação/publicação/reativação transacionais.
- [x] Adicionar rewrite, regras/documentação e testes de contrato.
- [x] Validar, revisar e registrar a entrega.

## Riscos

- Publicar sem transação pode apontar para uma versão parcialmente gravada;
  ponteiro, estado anterior e auditoria devem usar a mesma transação.
- Aceitar campos desconhecidos ou steps incompletos pode quebrar o planner;
  a validação deve rejeitar o contrato inteiro antes de publicar.
- Repetições de `import` não podem sobrescrever uma versão existente com outro
  conteúdo; comparar o payload ou rejeitar conflito.
- Auditoria com conteúdo do dataset pode vazar dados; guardar somente metadata,
  ator, ação, versão e resultado.

## Critérios de aceite

- [x] Dataset inválido retorna issues determinísticos e não altera o ativo.
- [x] `import` cria versão `imported` e é idempotente para o mesmo conteúdo.
- [x] `validate` transiciona para `validated` ou `failed` sem apagar a versão.
- [x] `publish`/`reactivate` atualizam ativo e versão anterior atomicamente.
- [x] Toda ação autorizada gera auditoria append-only; 401/403 não leem `ops/*`.
- [x] Versões e ponteiros são serializáveis, versionados e compatíveis com o
      diagnóstico RF-14A.
- [x] Testes e `pnpm validate` ficam verdes, com documentação atualizada.
