# Painel administrativo e diagnóstico operacional

**Status:** Implementado em 2026-09-06  
**PRD:** RF-14A / CA-13 (primeiro incremento de RF-14)  
**Dependências:** [exclusão de conta e dados](exclusao-de-conta-e-dados.md), [catálogo de ligas](../decisions/0019-catalogo-de-ligas-no-backend.md)

## Contexto

O PRD exige que operações privilegiadas sejam autorizadas no servidor e que
usuários comuns não recebam diagnóstico operacional. O projeto já possui
Functions, contagem de OCR e contratos de ligas, mas ainda não possui uma
fronteira de administrador nem uma tela que mostre o estado agregado de dados,
preços, fila e falhas.

Este incremento entrega a base segura e somente leitura. A importação,
validação e publicação/reativação de datasets foram entregues em incrementos
próprios. O acesso de suporte a crafts agora está disponível no incremento
[Suporte administrativo auditado](suporte-administrativo-auditado.md).

## Objetivo

Permitir que uma conta Google explicitamente autorizada veja o diagnóstico
operacional agregado em `/admin`, enquanto qualquer outra identidade recebe
403 sem dados operacionais. O navegador nunca decide quem é administrador.

## Requisitos

- Autorização deve ser decidida no backend por UID Google configurado em
  `POE_ADMIN_UIDS`; ausência de configuração significa nenhum administrador.
- O endpoint deve exigir `GET`, bearer token válido, provider `google.com` e UID
  autorizado, retornando 401/403 sem payload operacional nos demais casos.
- O diagnóstico deve ser um contrato versionado e serializável contendo:
  `generatedAt`, dataset ativo, snapshot de preços, liga ativa, contagem de jobs
  pendentes/em execução/com falha e uma lista limitada de falhas recentes.
- Documentos ausentes ou coleções vazias devem aparecer como estado `null`/zero,
  nunca como erro falso ou dado inventado.
- `/admin` deve cobrir carregando, ausência de permissão, erro recuperável e
  sucesso; a tela não exibe diagnóstico quando a API responde 403.
- O contrato público da feature deve esconder `fetch`, Firebase e o formato dos
  documentos administrativos.
- A coleção/documentos de operação permanecem deny-all para o cliente; somente
  o Admin SDK lê o estado agregado.

## Não escopo

- Importar, normalizar, validar, publicar ou reativar datasets.
- Rollback de versões ou mutações administrativas.
- Editar ou excluir crafts; o acesso de suporte auditado é especificado no
  incremento dedicado.
- Implementar RF-15; a proteção de custo está documentada em
  [Proteção de custo operacional](protecao-de-custo-operacional.md).
- Alterar o fluxo de jogador, histórico ou exclusão de conta.

## Suposições

- `POE_ADMIN_UIDS` é uma variável privada do ambiente das Functions, separada de
  qualquer variável `VITE_`.
- O estado agregado inicial vive em `ops/activeDataset`, `ops/priceSnapshot`,
  `ops/leagueCatalog` e `ops/jobs`; documentos ausentes são válidos no marco
  estrutural.
- Jobs registram `status` (`queued`, `running`, `succeeded` ou `failed`) e,
  quando falham, `errorMessage`, `updatedAt` e `type`.
- O modo fixture será coberto por loaders injetáveis nos testes; não transforma
  toda conta fixture em administradora no runtime.

## Proposta de solução

1. Criar um modelo puro `admin-operations` com o contrato do diagnóstico,
   parser de `POE_ADMIN_UIDS`, validação de status e normalização de dados
   incompletos.
2. Criar `getAdminOverview` em Functions. O handler verifica método, token,
   provider e UID, lê apenas os documentos `ops/*` pelo Admin SDK e limita a
   lista de falhas. Respostas 401/403 nunca incluem o diagnóstico.
3. Adicionar o rewrite `/api/admin/overview` e manter regras Firestore deny-all
   para `ops/*`.
4. Criar a feature web `admin-operations` com serviço autenticado, página
   `/admin`, estados acessíveis e tabela/resumo somente leitura.
5. Adicionar testes puros do modelo/autoridade, testes de componente para 403 e
   sucesso, e E2E para garantir que uma sessão não autorizada não vê dados.
6. Atualizar arquitetura, integrações, testing, README, ADR e registro da
   entrega.

## Tarefas sequenciais

- [x] Definir contrato puro, parser de administradores e normalização.
- [x] Implementar endpoint protegido e leitura agregada do Admin SDK.
- [x] Adicionar rewrite, documentação de configuração e fronteira de regras.
- [x] Implementar serviço, rota e painel `/admin` somente leitura.
- [x] Adicionar testes unitários, contrato e E2E de permissão.
- [x] Validar, revisar e registrar a entrega.

## Riscos

- Uma variável de administrador exposta no bundle web permitiria falsificação;
  ela deve existir apenas no ambiente das Functions.
- Retornar qualquer documento antes da checagem do UID vazaria diagnóstico;
  todas as leituras precisam ocorrer depois da autorização.
- Esquemas operacionais podem evoluir; o contrato de resposta deve filtrar e
  normalizar campos desconhecidos.
- Consultas sem índices podem falhar em produção; manter consultas simples,
  limitadas e documentar os índices necessários antes de adicionar filtros.

## Critérios de aceite

- [x] Usuário anônimo ou Google não autorizado recebe estado sem permissão e
      nenhum diagnóstico operacional.
- [x] Admin Google configurado recebe um diagnóstico agregado versionado, mesmo
      quando documentos ou jobs ainda não existem.
- [x] Método, bearer token, provider e UID são validados exclusivamente no
      servidor, com respostas 401/403 adequadas.
- [x] A rota `/admin` cobre carregando, 403, erro recuperável e sucesso sem
      acessar Firebase diretamente no componente.
- [x] `ops/*` continua inacessível pelas regras do cliente.
- [x] Testes, `pnpm validate`, documentação e entrega registram o comportamento
      real.
