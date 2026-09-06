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
- Functions 2nd gen em Node 24, com o handler `getActiveLeagues`.
- Firestore e Storage deny-all.
- Emulator Suite para Auth, Firestore, Hosting e Storage no project ID
  `demo-poe-crafter`. O rewrite `/api/leagues` aponta para `getActiveLeagues`.

`pnpm test:emulators` compila a aplicação, serve o Hosting e confirma que
requisições anônimas recebem 403 no Firestore e no Storage.

IDs e aliases reais ficam em `.firebaserc`, ignorado. Auth anônimo/Google,
App Check, coleções e uploads entram com suas features e testes de rules.

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

## Cloud Vision

Será usado apenas no backend para OCR, com limite de 1.000 imagens/mês. O texto
extraído usa o mesmo parser da entrada colada e exige confirmação. Quando a cota
fecha, texto continua disponível.

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
