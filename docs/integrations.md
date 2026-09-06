# Integrações e APIs

## Fronteiras

Na web, APIs e persistência ficam em `services`, `adapters` ou `repositories`.
Components não fazem `fetch` e não acessam Firebase diretamente.

Em Functions, handlers validam identidade, App Check, permissão e payload antes
de chamar packages. Segredos nunca chegam ao browser. Packages de domínio não
importam SDKs Firebase.

`pnpm check:architecture` verifica essas fronteiras e mantém
`import.meta.env` restrito a `apps/web/src/shared/config/env.ts`.

## Firebase

O repositório contém somente a fundação local:

- Hosting para `apps/web/dist`.
- Functions 2nd gen em Node 24, com os handlers `getActiveLeagues` e
  `getScreenshotOcr`.
- Firestore permanece deny-all; Storage aceita apenas o dono autenticado em
  `screenshots/{uid}/`, com imagens de até 8 MiB e TTL operacional de 24 horas.
- Emulator Suite para Auth, Firestore, Hosting e Storage no project ID
  `demo-poe-crafter`. Os rewrites `/api/leagues` e `/api/screenshot-ocr`
  apontam para os handlers correspondentes.

`pnpm test:emulators` compila a aplicação, serve o Hosting e confirma que
requisições sem autorização recebem 403 no Firestore e no Storage. O fluxo de
OCR autenticado usa fixture de Vision nos testes E2E; Auth/Storage Emulator é
habilitado quando o Firebase CLI local está funcional.

IDs e aliases reais ficam em `.firebaserc`, ignorado. Auth anônimo/Google está
disponível no app web. App Check, coleções e uploads entram com suas próprias
features e testes de rules.

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
email/senha ou outro provider no MVP.

## APIs da GGG

Não integrar nem depender delas. Se RePoE ou poe.ninja mudarem, mantenha schemas
próprios, cache, timeout, retry limitado e fallback explícito.

## Variáveis e segredos

- Tudo com prefixo `VITE_` é público.
- Documente variáveis web em `.env.example`.
- Segredos usam o mecanismo do backend Firebase e nunca entram em `.env` web.
- Não faça commit de `.env.local`, `.firebaserc`, tokens ou service accounts.
