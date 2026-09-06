# Integrações e APIs

## Fronteiras

Na web, APIs e persistência ficam em `services`, `adapters` ou `repositories`.
Components não fazem `fetch` e não acessam Firebase diretamente.

Em Functions, handlers validam identidade, App Check, permissão e payload antes
de chamar packages. Segredos nunca chegam ao browser. Packages de domínio não
importam SDKs Firebase.

`pnpm check:architecture` verifica essas fronteiras e mantém
`import.meta.env` restrito a `apps/web/src/shared/config/env.ts`.

## Crafting engine

`@poe-crafter/crafting-engine` é um package puro e local. A web envia o alvo
confirmado, a liga e as mecânicas explicitamente solicitadas para
`evaluateCraftability`; o resultado é transitório nesta etapa e não é gravado
no Firestore. O package não acessa Firebase, rede, relógio ou providers. Um
resultado `unsupported` é obrigatório quando a entrada menciona uma mecânica
fora do conjunto implementado.

O package `@poe-crafter/planner` também é puro. `runPlannerJob` publica fases
determinísticas e encerra em `failed/job-timeout` após cinco minutos, sem
persistir versão parcial; a fila remota futura deverá preservar esse contrato.

## Firebase

O repositório contém somente a fundação local:

- Hosting para `apps/web/dist`.
- Functions 2nd gen em Node 24, com os handlers `getActiveLeagues`,
  `getScreenshotOcr`, `requestAccountDeletion`, `getAdminOverview`,
  `manageAdminDataset`, `requestAdminCraftSupport` e `reserveOperationalCost`.
- Firestore aceita somente o dono autenticado em `crafts/{craftId}` e mantém
  deny-all nos demais caminhos; Storage aceita apenas o dono autenticado em
  `screenshots/{uid}/`, com imagens de até 8 MiB e TTL operacional de 24 horas.
- Emulator Suite para Auth, Firestore, Hosting e Storage no project ID
  `demo-poe-crafter`. Os rewrites `/api/leagues`, `/api/screenshot-ocr`,
  `/api/account-deletion` e `/api/admin/overview` apontam para os handlers
  correspondentes; `/api/admin/datasets` recebe as ações administrativas de
  ciclo de dataset e `/api/admin/support/craft` fornece acesso de suporte
  auditado a um craft informado pelo administrador; `/api/operations/cost-guard`
  reserva planejamento dentro do orçamento operacional.

`pnpm test:emulators` compila a aplicação, serve o Hosting e confirma que
requisições sem autorização recebem 403 no Firestore e no Storage. O fluxo de
OCR autenticado usa fixture de Vision nos testes E2E; Auth/Storage Emulator é
habilitado quando o Firebase CLI local está funcional.

IDs e aliases reais ficam em `.firebaserc`, ignorado. Auth anônimo/Google está
disponível no app web. A coleção `crafts` guarda somente o alvo confirmado,
liga/modo, estado e timestamps; não guarda screenshot, texto OCR bruto, eventos
ou gastos. App Check e outras coleções entram com suas próprias features e
testes de rules.

## RePoE

Será a única matéria-prima de game data do MVP. O adaptador viverá em
`packages/poe-data`, validará schemas próprios e publicará versões imutáveis. Uma
falha nunca substitui a versão ativa.

## poe.ninja

O endpoint de ligas consulta poe.ninja somente no backend, normaliza o catálogo
e devolve ligas PC ativas com `fetchedAt`. Um futuro job diário publicará
snapshots imutáveis normalizados em chaos; o planner lerá snapshots e não
chamará o provider durante a busca. Falha preservará o último snapshot e seu
horário.

Functions aceita `POE_LEAGUES_URL` como override de ambiente para testes ou
provedores compatíveis; em produção, o padrão é
`https://poe.ninja/poe1/api/economy/leagues`, o endpoint público de ligas do PoE 1.

O OCR exige `POE_OCR_ENABLED=true` no backend; `POE_OCR_FIXTURE_TEXT` existe
somente para testes locais e emuladores.

## Cloud Vision

É usado apenas no backend para OCR, com limite de 1.000 imagens/mês. O texto
extraído usa o mesmo parser da entrada colada e exige confirmação. O endpoint
processa objetos temporários no Storage privado, remove o objeto após o OCR e
mantém uma limpeza agendada para TTL de 24 horas. Quando a cota fecha, texto
continua disponível.

## Google Identity

A sessão começa anônima e pode ser vinculada somente ao Google. Não haverá
email/senha ou outro provider no MVP. A solicitação de exclusão em
`/api/account-deletion` exige bearer token de uma sessão Google, confirmação
literal `DELETE` e responde com um recibo pendente de 24 horas. O Admin SDK
revoga tokens no recebimento; o job agendado remove crafts, screenshots e a
identidade Firebase, atualizando falhas no documento privado
`accountDeletionRequests/{uid}`. O cliente não lê nem grava essa coleção.

O painel administrativo usa `functions/.env` (modelo em
`functions/.env.example`) com `POE_ADMIN_UIDS`, uma lista privada de UIDs Google
separados por vírgula. Essa variável nunca usa o prefixo `VITE_` e não é enviada
ao navegador; vazia, ela nega o acesso a todas as contas.

O endpoint `/api/admin/overview` lê somente `ops/leagueCatalog`,
`ops/activeDataset`, `ops/priceSnapshot` e os jobs de `ops/jobs` após a
autorização. A resposta limita falhas recentes e normaliza documentos ausentes;
qualquer identidade não autorizada recebe 403 sem diagnóstico.

O endpoint POST `/api/admin/datasets` reutiliza a mesma autorização e aceita
`import`, `validate`, `publish` e `reactivate`. Versões são gravadas em
`ops/datasets/{version}`; o ponteiro `ops/activeDataset` só muda em uma
transação que também aposenta a versão anterior e cria um evento sem conteúdo
do dataset em `ops/auditEvents`. Importações repetidas com o mesmo conteúdo são
idempotentes; outro conteúdo para o mesmo identificador retorna conflito.
Em `/admin`, o operador fornece a versão e, para `import`, o JSON; respostas
422 exibem os caminhos das issues sem apagar o formulário, enquanto uma ação
aceita recarrega o diagnóstico.

O endpoint POST `/api/admin/support/craft` exige a mesma autorização Google do
diagnóstico e recebe `craftId` e uma justificativa de até 500 caracteres. A
leitura de `crafts/{craftId}` e a criação do evento em
`ops/supportAuditEvents` acontecem na mesma transação; o evento guarda somente
UID do ator, ID do craft, ação, justificativa e horário. O craft normalizado é
devolvido em contrato versionado e nunca é persistido pelo navegador.

`/api/operations/cost-guard` exige bearer Firebase e recebe `operation` e
`requestId`. O backend mantém `ops/operationalUsage-{YYYY-MM}` em uma transação
idempotente, com custos unitários configuráveis apenas nas Functions
(`POE_MONTHLY_BUDGET_USD`, `POE_OCR_COST_USD` e `POE_PLANNING_COST_USD`). OCR é
pausado em 80% do orçamento projetado; planejamento é pausado no limite total.

## APIs da GGG

Não integrar nem depender delas. Se RePoE ou poe.ninja mudarem, mantenha schemas
próprios, cache, timeout, retry limitado e fallback explícito.

## Variáveis e segredos

- Tudo com prefixo `VITE_` é público.
- Documente variáveis web em `.env.example`.
- Segredos usam o mecanismo do backend Firebase e nunca entram em `.env` web.
- Não faça commit de `.env.local`, `.firebaserc`, tokens ou service accounts.
