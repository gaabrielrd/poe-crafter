# Arquitetura

Este documento descreve a estrutura implementada do PoE Crafting Planner e as
fronteiras aprovadas para sua evolução. O [PRD](prd.md) define o produto; este
arquivo define onde cada responsabilidade deve viver.

## Princípios

- Organizar capacidades por feature e regras reutilizáveis por package.
- Manter React, Firebase e integrações externas fora do domínio determinístico.
- Expor uma API pública por feature/package e impedir imports de internals.
- Criar módulos somente quando existir um consumidor real.
- Tratar dados de providers como entrada não confiável, atrás de adaptadores.
- Preservar planos, datasets e snapshots publicados como artefatos imutáveis.
- Desenvolver contra emuladores e negar acesso a dados por padrão; exceções
  explícitas devem ser owner-only e limitadas ao prefixo da feature.

## Estrutura atual

```text
poe-crafter/
├── apps/
│   └── web/
│       ├── public/
│       ├── src/
│       │   ├── app/          # layout, rotas, fallbacks e styleguide
│       │   ├── features/     # capacidades da experiência web
│       │   ├── shared/       # config, utilitários e UI neutra
│       │   ├── styles/       # Tailwind, tokens e fontes
│       │   └── test/         # setup e render compartilhado
│       ├── components.json
│       ├── vite.config.ts
│       └── vitest.config.ts
├── functions/
│   └── src/index.ts          # limite do backend e handlers HTTP
├── packages/
│   ├── shared-types/         # contratos serializáveis
│   ├── crafting-engine/      # validação determinística de craftabilidade
│   ├── planner/              # busca, métricas e ranking determinísticos
│   ├── poe-data/             # futuro adaptador RePoE
│   └── pricing/              # catálogo e adaptadores de preços
├── e2e/
├── scripts/
├── docs/
├── firebase.json
├── firestore.rules
├── storage.rules
└── pnpm-workspace.yaml
```

O workspace usa pnpm e um lockfile compartilhado. A raiz contém orquestração,
qualidade, E2E e configuração Firebase; código executável pertence a um
workspace.

## Workspaces e dependências

Dependências internas usam `workspace:*`. As permissões atuais são:

```text
apps/web ───────────────> @poe-crafter/shared-types
apps/web ───────────────> @poe-crafter/crafting-engine
apps/web ───────────────> @poe-crafter/planner
functions ──────────────> @poe-crafter/shared-types
functions ──────────────> @poe-crafter/pricing
functions ──────────────> @poe-crafter/poe-data
@poe-crafter/poe-data ──> @poe-crafter/shared-types
@poe-crafter/pricing ───> @poe-crafter/shared-types
@poe-crafter/crafting-engine ─> @poe-crafter/shared-types
@poe-crafter/planner ────────> @poe-crafter/shared-types
```

Uma seta é permissão, não obrigação. O manifesto só declara a dependência quando
o código a usa. O sentido inverso, ciclos e imports de subpaths internos falham
em `pnpm check:architecture`.

`simulator` permanece planejado para seu primeiro consumidor. O package
`crafting-engine` já possui a primeira fatia de validação estrutural,
sem alegar cobertura completa da legalidade do jogo. O package `pricing` já
possui o adaptador mínimo usado pelo catálogo de ligas; não existem contratos
fictícios para os demais módulos. O package `planner` possui o primeiro
contrato de busca e comparação sobre um dataset starter explícito.

## Aplicação web

`apps/web` usa React, TypeScript, Vite, React Router, Tailwind e componentes
shadcn/ui possuídos pelo projeto.

### Features

Uma feature típica segue:

```text
features/minha-feature/
├── components/   # apresentação e composição do fluxo
├── model/        # estado e validação próprios da experiência
├── services/     # APIs e orquestração de infraestrutura
├── adapters/     # tradução de contratos externos
├── repositories/ # persistência
├── tests/        # comportamento observável
└── index.ts      # única interface pública
```

Regras:

1. Uma feature não importa arquivos internos de outra.
2. `shared` não depende de features nem contém conceitos de crafting.
3. Componentes não chamam `fetch`, Firebase ou armazenamento diretamente.
4. `fetch` e armazenamento ficam em `services`, `adapters` ou `repositories`.
5. `import.meta.env` só é lido em `shared/config/env.ts`.
6. Estado assíncrono de tela cobre carregando, vazio, erro, sucesso e, quando
   aplicável, sem permissão.
7. Não existe gerenciador global de estado aprovado.

`planning-configuration` coleta objetivo, mecânicas excluídas e overrides
manuais em um `PlanningRequest` schema `1`. A feature é composta por
`item-import` somente depois de o `crafting-engine` retornar `accepted` e
publica o pedido por callback transitória; não inicia jobs, grava Firestore,
calcula estratégias ou consulta preços.

`strategy-planning` consome esse callback e executa o contrato puro do package
`planner`. A implementação local publica as fases do job e usa um dataset
starter versionado; os detalhes usam os textos versionados das receitas e não
substituem o futuro job persistido em Functions. Depois de publicada, cada
estratégia também pode abrir uma sessão local append-only: transições puras
registram tentativa, retry, restart e custo sem mutar eventos anteriores. A
sessão pode ser encapsulada em uma versão local imutável; um recálculo cria
outra versão, vincula novas execuções ao seu `planVersionId` e deixa o jogador
escolher qual continuar. As versões ainda são efêmeras e só serão persistidas
em uma fatia posterior.

`runPlannerJob` aplica deadline padrão de cinco minutos entre fases. Um timeout
publica somente `failed` com issue `job-timeout`; a camada web cria versão apenas
para resultados `succeeded`, portanto nenhum plano parcial substitui o histórico.

## Decisões do produto

O limite do sistema é uma SPA responsiva para PoE 1, apoiada por Firebase para
identidade, persistência, arquivos temporários e jobs assíncronos. A autoridade
de regras permanece nos packages de domínio; a interface apenas coleta dados,
apresenta estados e registra decisões do jogador.

Capacidades do PRD e seus responsáveis:

- importação e confirmação de item: features web + `shared-types`;
- dados de jogo: `poe-data` (RePoE adaptado para schema próprio);
- legalidade, transições e validação: `crafting-engine`;
- busca, comparação e simulação: `planner` + `simulator`;
- custos: `pricing` com snapshots imutáveis do poe.ninja;
- identidade, histórico, jobs e operações: Firebase Functions, Firestore e
  Storage.

O fluxo de dados aprovado é item colado ou imagem → parsing → alvo normalizado
→ confirmação/classificação → planejamento determinístico → plano imutável com
snapshots → execução append-only → resumo estimado versus real. O navegador não
é autoridade para custos, probabilidades ou versões de dados.

As integrações externas são RePoE, poe.ninja e Cloud Vision dentro dos limites
do PRD; APIs da GGG e automação do cliente ficam fora do sistema. A sessão pode
começar anônima e ser vinculada somente ao Google. Crafts permanecem privados,
sem links públicos no MVP, e o orçamento operacional máximo é US$10/mês.

O produto é inglês-only, deve atender WCAG 2.2 AA e suportar largura mínima de
360 px. Não há PWA, modo offline ou promessa de custo garantido. Decisões em
aberto: Nenhuma.

### Rotas

Rotas ficam em `apps/web/src/app/routes` e importam de `react-router`, nunca de
`react-router-dom`. A árvore exportada pode ser montada com memory router nos
testes.

Estado atual:

- `/`: home estrutural.
- `/new`: importação de item por texto, com parser local e resumo do alvo
  normalizado, precedida pela escolha da liga PC ou do modo manual.
- `/history`: histórico privado de crafts do UID atual, ordenado pela última
  atualização.
- `/craft/:craftId`: retomada e atualização do alvo confirmado salvo.
- `/settings`: identidade Google e solicitação de exclusão dos dados da conta.
- `/admin`: diagnóstico operacional somente leitura para UIDs Google autorizados
  no backend.
- `/styleguide`: contrato visual vivo.
- `*`: página não encontrada, sempre por último.
- `errorElement`: fallback de carregamento/renderização sem tela branca.

Rota de produto planejada: `/craft/:craftId/summary`. A importação, publicação,
reativação e rollback de datasets ainda exigem seus próprios incrementos.

### Sistema visual

O tema vive em `apps/web/src/styles/globals.css`:

- Tailwind é integrado por `@tailwindcss/vite`.
- `components.json` aponta shadcn para `src/shared/ui` e utilitários para
  `src/shared/lib`.
- Primitives usam Radix e ícones usam `lucide-react`.
- Cor, tipografia, raio e movimento usam tokens semânticos.
- TheMix e Archivo são auto-hospedadas; não há CDN.
- Não existem CSS Modules nem dependência de `@vitru/styleguide`.
- Não existe `packages/ui` enquanto apenas a web consumir componentes.

A rota `/styleguide` demonstra apenas os tokens e componentes instalados. As
regras detalhadas ficam em [styleguide.md](styleguide.md).

## Backend Firebase

`functions` é um workspace TypeScript privado, preparado para Cloud Functions
2nd gen em Node 24. Os handlers `getActiveLeagues`, `getScreenshotOcr` e
`requestAccountDeletion` e `getAdminOverview` expõem contratos normalizados em
`/api/leagues`, `/api/screenshot-ocr`, `/api/account-deletion` e
`/api/admin/overview`; as chamadas a providers permanecem exclusivamente no
backend.

Futuras responsabilidades:

- `functions/src/api`: autenticação, App Check, autorização e validação de
  payload antes de chamar packages.
- `functions/src/tasks`: jobs idempotentes de parsing, planejamento e simulação.
- `functions/src/scheduled`: importações e manutenção programadas, incluindo
  a limpeza de exclusões de conta.

Handlers não contêm regra de crafting e não publicam resultado parcial. Segredos
existem apenas no backend.

`firebase.json` configura Hosting, Functions, Firestore, Storage e Emulator
Suite. O desenvolvimento usa `demo-poe-crafter`; `.firebaserc` pessoal é ignorado
e nenhum project ID real é versionado. Firestore mantém deny-all fora de
`crafts/{craftId}` e permite somente o dono autenticado, sem troca de
`ownerUid`; as coleções `accountDeletionRequests` e `ops/*` também são deny-all
para o cliente e só o Admin SDK cria, atualiza ou lê esses documentos; Storage
aceita somente o dono autenticado em `screenshots/{uid}/`, com limpeza agendada
após 24 horas.

O endpoint de diagnóstico administrativo valida o bearer token, o provider
`google.com` e o UID contra `POE_ADMIN_UIDS` antes de qualquer leitura em
`ops/`. A resposta é um contrato de schema versionado com liga, dataset,
snapshot de preços, contadores de fila e no máximo dez falhas recentes. A rota
web mantém somente estados de carregamento, permissão, erro e sucesso; ela nunca
exibe dados antes da autorização do servidor.

O mesmo limite é reutilizado pelo ciclo de dataset em
`/api/admin/datasets`. O package `planner` é a autoridade de schema; o backend
persiste versões imutáveis em `ops/datasets/{version}` e registra apenas
metadados em `ops/auditEvents`. Publicação e reativação usam uma transação para
atualizar `ops/activeDataset`, marcar a versão anterior como `retired` e
ativar a versão validada. A rota `/admin` expõe os formulários somente depois
que o diagnóstico autorizado carregou; chamadas HTTP continuam no service da
feature e o cliente não acessa nenhuma coleção `ops/*`.

O suporte administrativo segue a mesma fronteira: `requestAdminCraftSupport`
valida o bearer e a justificativa antes de ler `crafts/{craftId}`. Uma transação
normaliza o craft e cria o evento append-only em `ops/supportAuditEvents` antes
da resposta; o evento não contém alvo, mods, preços ou qualquer conteúdo do
craft. A seção de suporte do `/admin` só é renderizada após diagnóstico
autorizado e mantém o resultado apenas em memória.

A proteção de custo mantém o ledger mensal privado
`ops/operationalUsage-{YYYY-MM}`. `FirestoreOperationalBudget` reserva uma
operação em transação usando uma chave `operation:requestId`; o endpoint
`reserveOperationalCost` expõe apenas a decisão normalizada. O OCR consulta o
ledger antes do Cloud Vision e o planner consulta o gate antes de iniciar o job;
o cliente não recebe o orçamento de ambiente nem acessa o documento `ops/*`.

O fluxo de exclusão exige um usuário Google, reautenticação recente e a
confirmação literal `DELETE` no endpoint privado. A solicitação fica pendente
por 24 horas, revoga tokens imediatamente e é processada pelo job a cada 15
minutos na ordem crafts, screenshots e identidade Firebase. Cada etapa atualiza
o registro para que falhas permaneçam visíveis e possam ser tentadas novamente;
nenhuma resposta de sucesso afirma que a remoção já terminou.

## Packages de domínio

### `shared-types`

Contratos serializáveis compartilhados, incluindo `NormalizedItemTarget` e seus
afixos normalizados. Não depende de React, Firebase, Node, providers externos ou
outro package interno.

### `poe-data`

Adaptará e normalizará RePoE para schemas próprios. Pode depender de
`shared-types`; não pode expor o schema externo como contrato público.

### `crafting-engine`

Autoridade determinística sobre a entrada confirmada e, futuramente, estados,
operações e transições. A API atual expõe `evaluateCraftability`, com resultado
versionado `accepted`, `rejected` ou `unsupported`, conflitos com códigos e
caminhos estáveis e regras estruturais mínimas. Não depende de planner,
simulator, Firebase, React ou providers; a UI apenas adapta o resultado.

### `planner`

Package puro que filtra receitas completas, calcula custo esperado/P90,
tentativas, probabilidade e risco, remove equivalências e ranqueia até quatro
estratégias por objetivo. O contrato vincula `gameDataVersion` e
`priceSnapshotId`; a versão atual usa somente um dataset starter explícito e
não persiste jobs nem consulta providers.

### `simulator` (planejado)

Medirá distribuições e métricas de candidatos. Não decide se uma operação é
legal.

### `planner` (planejado)

Buscará e comparará estratégias usando engine, simulator, game data e snapshots
de preços. Todo candidato volta ao engine antes de ser publicado.

### `pricing`

Normaliza o catálogo de ligas retornado pelo provider e evoluirá para snapshots
e overrides manuais em chaos, sem ser fonte de regras de crafting.

## Fluxo de produto aprovado

```text
Texto ou screenshot
  -> API de parsing
  -> alvo normalizado
  -> confirmação do jogador
  -> crafting-engine
  -> CraftSession + PlanningJob
  -> fila de planejamento
  -> busca e simulação
  -> validação final pelo engine
  -> plano imutável + snapshots
  -> execução append-only
  -> resumo estimado versus real
```

O screenshot é processado de forma efêmera pelo endpoint de OCR neste marco,
sem persistência no navegador. A identidade anônima/Google e as regras privadas
de `screenshots/{uid}/` já formam a fronteira; o upload e a limpeza de 24 horas
ficam atrás de serviços autenticados. Cloud Vision produzirá texto não confiável, processado
pelo mesmo parser do texto colado e sempre confirmado pelo jogador. Após 1.000
OCRs no mês, o produto mantém somente texto.

## Game data e preços

O pipeline RePoE deve baixar, adaptar, validar, indexar, testar e publicar uma
versão imutável antes de trocar atomicamente o ponteiro ativo. Rollback reativa
uma versão; não altera planos existentes.

O job diário de preços publica snapshot imutável do poe.ninja. O planner nunca
consulta o provider durante uma busca. Falha mantém o último snapshot com
horário visível; sem snapshot, regras funcionam e o custo automático fica
indisponível.

APIs da GGG não fazem parte do sistema.

## Estado e consistência

- Firestore guarda estado durável; Storage guarda uploads temporários e
  artefatos versionados.
- Estado transitório de formulário/navegação pertence à feature ou à URL.
- Planos, datasets e snapshots publicados são imutáveis.
- Execução é append-only; retries e restarts acrescentam eventos.
- Recalcular cria outra versão e preserva a anterior.
- O navegador só altera campos do usuário; custos, probabilidades e versões
  calculadas são autoritativos no backend.

## Acesso e operação

- A sessão começa anônima e pode ser vinculada somente ao Google.
- Crafts são privados e não têm links públicos no MVP.
- Sessões anônimas inativas são excluídas após 30 dias.
- A exclusão de uma conta Google exige reautenticação e confirmação destrutiva;
  o pedido é confirmado imediatamente e termina em até 24 horas.
- Administradores são UIDs Google autorizados manualmente.
- Conteúdo aberto para suporte exige autorização e auditoria.
- Ao se aproximar de US$10/mês, novos OCRs e depois novos jobs são bloqueados;
  leitura do histórico continua disponível.

## Build e distribuição

- A SPA gera `apps/web/dist` e será publicada pelo Firebase Hosting.
- Functions, regras e Hosting usam projetos separados de desenvolvimento,
  staging e produção.
- Packages TypeScript geram `dist` e declarações, testáveis sem Firebase.
- O produto não é PWA e não promete uso offline.
- Suporte: duas versões recentes de Chrome, Edge, Firefox e Safari; Chrome e
  Safari móveis; largura mínima de 360 px.

## Qualidade

`pnpm validate` é o gate local único. Ele verifica toolchain, workspace, skills,
arquitetura, docs, styleguide, Firebase, formato, lint, cobertura, tipos, builds e
smoke HTTP. `pnpm test:e2e` valida o bundle separadamente no Chromium.

Metas do produto:

- Todo plano passa pelo engine; abrangência não supera legalidade.
- 90% dos jobs terminam em até 60 segundos e falham recuperavelmente aos cinco
  minutos.
- Interface WCAG 2.2 AA.
- No percentil 75: LCP até 2,5 s, INP até 200 ms e CLS até 0,1.
- Custo operacional do piloto até US$10/mês.

## Evolução incremental

O marco estrutural, a importação de item por texto, a confirmação/classificação
de modificadores (RF-04), a escolha de liga PC com fallback manual (RF-01), o
OCR efêmero, a sessão anônima com vínculo Google (RF-12), a persistência
privada com histórico, o contrato inicial de craftabilidade (RF-06) e a
configuração versionada de planejamento (RF-05), o primeiro contrato local de
geração/comparação de estratégias (RF-07) e a explicação imutável de estratégia
(RF-08) e a execução append-only local (RF-09) estão implementados localmente.
O resumo terminal estimado versus real (RF-10) e o recálculo versionado sem
perda do histórico (RF-11) também são derivados localmente. Cada versão
preserva seu dataset, snapshot de preços, estratégias e eventos de execução.
O dataset completo, a simulação
probabilística avançada, os preços reais e os jobs persistidos continuam fora do
escopo até os próximos incrementos.
Toda decisão relevante gera ou atualiza ADR em `docs/decisions`.
