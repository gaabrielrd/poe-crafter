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
- Desenvolver contra emuladores e negar acesso a dados por padrão.

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
functions ──────────────> @poe-crafter/shared-types
functions ──────────────> @poe-crafter/pricing
functions ──────────────> @poe-crafter/poe-data
@poe-crafter/poe-data ──> @poe-crafter/shared-types
@poe-crafter/pricing ───> @poe-crafter/shared-types
```

Uma seta é permissão, não obrigação. O manifesto só declara a dependência quando
o código a usa. O sentido inverso, ciclos e imports de subpaths internos falham
em `pnpm check:architecture`.

`crafting-engine`, `planner` e `simulator` permanecem na arquitetura aprovada,
mas serão criados com seu primeiro consumidor. O package `pricing` já possui o
adaptador mínimo usado pelo catálogo de ligas; não existem contratos fictícios
para os demais módulos.

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
- `/styleguide`: contrato visual vivo.
- `*`: página não encontrada, sempre por último.
- `errorElement`: fallback de carregamento/renderização sem tela branca.

Rotas de produto planejadas: `/new`, `/craft/:craftId`,
`/craft/:craftId/summary`, `/history`, `/settings` e `/admin`. Elas só entram com
suas respectivas features.

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
2nd gen em Node 24. Os handlers `getActiveLeagues` e `getScreenshotOcr`
expõem contratos normalizados em `/api/leagues` e `/api/screenshot-ocr`; as
chamadas a providers permanecem exclusivamente no backend.

Futuras responsabilidades:

- `functions/src/api`: autenticação, App Check, autorização e validação de
  payload antes de chamar packages.
- `functions/src/tasks`: jobs idempotentes de parsing, planejamento e simulação.
- `functions/src/scheduled`: importações e manutenção programadas.

Handlers não contêm regra de crafting e não publicam resultado parcial. Segredos
existem apenas no backend.

`firebase.json` configura Hosting, Functions, Firestore, Storage e Emulator
Suite. O desenvolvimento usa `demo-poe-crafter`; `.firebaserc` pessoal é ignorado
e nenhum project ID real é versionado. Firestore e Storage começam deny-all.

## Packages de domínio

### `shared-types`

Contratos serializáveis compartilhados, incluindo `NormalizedItemTarget` e seus
afixos normalizados. Não depende de React, Firebase, Node, providers externos ou
outro package interno.

### `poe-data`

Adaptará e normalizará RePoE para schemas próprios. Pode depender de
`shared-types`; não pode expor o schema externo como contrato público.

### `crafting-engine` (planejado)

Autoridade determinística sobre estados, operações e transições. Não dependerá
de planner, simulator, Firebase ou providers.

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
sem persistência no navegador. A evolução para Storage privado com TTL de 24
horas depende da feature de identidade/regras. Cloud Vision produzirá texto não
confiável, processado pelo mesmo parser do texto colado e sempre confirmado pelo
jogador. Após 1.000 OCRs no mês, o produto mantém somente texto.

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
- Exclusão de conta Google termina em até 24 horas.
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
de modificadores (RF-04) e a escolha de liga PC com fallback manual (RF-01)
estão implementados localmente. A próxima capacidade deve começar por um plano
específico para screenshot/OCR (RF-03), antes de planner ou autenticação. Toda decisão
relevante gera ou atualiza ADR em `docs/decisions`.
