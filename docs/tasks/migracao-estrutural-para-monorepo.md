# Migração estrutural para o monorepo do produto

## Estado

- **Tipo:** plano de implementação
- **Situação:** pronto para aprovação e execução
- **Marco:** primeiro marco técnico anterior às funcionalidades do produto
- **Origem:** `docs/prd.md` e seção "Primeiro marco de implementação" de
  `docs/architecture.md`

## Contexto

O repositório já contém uma SPA pequena e validada, criada a partir do template:
React, TypeScript, Vite, React Router, Vitest, Playwright, CSS Modules e o kit
`@vitru/styleguide`. A aplicação possui as rotas `/`, `/styleguide` e curinga,
uma feature `home`, configuração centralizada de ambiente, verificadores locais,
hooks, CI e documentação.

O produto aprovado exige outra base: monorepo pnpm, aplicação em `apps/web`,
backend Firebase e packages TypeScript determinísticos. A interface usará
Tailwind e shadcn/ui. Essa troca precisa acontecer antes da importação de itens
ou das regras de crafting para que nenhuma funcionalidade nova seja construída
sobre uma estrutura transitória.

Este plano trata a migração como uma mudança estrutural, não como oportunidade
para começar o produto. O comportamento observável atual será mantido enquanto
toolchain, caminhos, estilo e fronteiras são substituídos.

## Objetivo

Converter a base atual em um monorepo pnpm funcional e validado, mover a SPA para
`apps/web`, estabelecer os primeiros limites de backend e packages e substituir
o sistema visual por Tailwind e shadcn/ui, sem implementar importação, contas,
planejamento ou mecânicas de crafting.

Ao final, uma instalação limpa deve conseguir desenvolver, testar e gerar o
bundle de todos os workspaces por meio de um único comando de validação na raiz.

## Resultado esperado

```text
poe-crafter/
├── apps/
│   └── web/
│       ├── public/
│       ├── src/
│       │   ├── app/
│       │   ├── features/
│       │   │   └── home/
│       │   ├── shared/
│       │   │   ├── config/
│       │   │   ├── lib/
│       │   │   └── ui/
│       │   ├── styles/
│       │   └── test/
│       ├── components.json
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       └── vitest.config.ts
├── functions/
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── packages/
│   ├── shared-types/
│   │   ├── src/index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── poe-data/
│       ├── src/index.ts
│       ├── package.json
│       └── tsconfig.json
├── e2e/
├── scripts/
├── docs/
├── firebase.json
├── firestore.indexes.json
├── firestore.rules
├── storage.rules
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── package.json
```

`crafting-engine`, `planner`, `simulator` e `pricing` continuam descritos na
arquitetura-alvo, mas não recebem pastas vazias neste marco. Eles serão criados
quando a primeira funcionalidade que realmente os utiliza for planejada. Essa
decisão evita APIs fictícias e mantém o princípio de não adicionar abstrações
sem necessidade demonstrada.

## Requisitos

### Toolchain e workspace

- A raiz deve ser um workspace privado, sem código executável de aplicação.
- O gerenciador deve ser exclusivamente pnpm, com `packageManager` fixado em
  `pnpm@11.19.0`, a versão já disponível no ambiente de desenvolvimento.
- `pnpm-workspace.yaml` deve incluir `apps/*`, `functions` e `packages/*`.
- Dependências locais devem usar `workspace:*`; resolução silenciosa pelo
  registry não é permitida para packages internos.
- O workspace deve rejeitar ciclos entre packages.
- O projeto deve usar Node 22 em desenvolvimento, CI e Functions. A versão
  mínima exata deve satisfazer os engines das dependências resolvidas no lockfile
  e ficar sincronizada entre `.nvmrc`, `engines`, CI e documentação.
- Deve existir somente `pnpm-lock.yaml`; `package-lock.json` será removido apenas
  depois que a instalação pnpm reproduzível estiver comprovada.
- A raiz deve orquestrar os comandos com filtros e execução recursiva do pnpm.
  Turborepo, Nx ou outro orquestrador ficam fora deste marco.

### Aplicação web

- Todo o código, assets e configurações específicas do Vite devem sair da raiz e
  entrar em `apps/web`.
- As rotas `/`, `/styleguide` e `*` devem continuar com o mesmo papel e com seus
  testes de navegação e fallback.
- A feature `home`, o tratamento de erro de rota e a leitura centralizada de
  `import.meta.env` devem manter o comportamento observável.
- `apps/web` deve continuar importando `react-router`, nunca
  `react-router-dom`.
- A curinga deve permanecer como última rota.
- Testes unitários devem continuar colocalizados e cobrir os quatro estados
  aplicáveis às telas que carregam dados. Neste marco, a home não passa a buscar
  dados artificialmente apenas para criar esses estados.
- O alias `@/` deve apontar para `apps/web/src` em Vite, TypeScript, Vitest e
  `components.json`.

### Sistema visual

- `@vitru/styleguide` e CSS Modules devem ser removidos depois que as telas atuais
  estiverem equivalentes em Tailwind e shadcn/ui; os dois sistemas não podem
  permanecer como padrões concorrentes.
- Tailwind deve ser integrado pelo plugin oficial para Vite e por um arquivo
  global da aplicação.
- O shadcn/ui deve ser configurado dentro de `apps/web`, com componentes em
  `src/shared/ui` e utilitários neutros em `src/shared/lib`.
- Não será criado `packages/ui`: ainda existe apenas um consumidor de interface.
- O preset adotado deve usar primitives Radix, ícones Lucide, `baseColor`
  neutral e variáveis CSS, registrados em `components.json`.
- Somente componentes usados pela home, pelos fallbacks e pela rota
  `/styleguide` devem ser adicionados. Não instalar o catálogo inteiro.
- Cores, raio, tipografia, espaçamento semântico e motion devem ser definidos por
  tokens no tema global; componentes não devem introduzir hex/RGB próprios nem
  classes arbitrárias que dupliquem tokens.
- TheMix deve continuar auto-hospedada para títulos. Archivo deve continuar
  auto-hospedada, substituindo a cópia antes transitivamente fornecida pelo kit
  antigo; nenhuma fonte será carregada por CDN.
- A migração deve preservar contraste, navegação por teclado, foco visível,
  redução de movimento e responsividade a partir de 360 px.
- A rota `/styleguide` deve demonstrar tokens e somente os componentes realmente
  instalados, além de continuar coberta por teste visual e de acessibilidade
  básica.

### Backend e infraestrutura Firebase

- `functions` deve ser um workspace TypeScript privado, compatível com Cloud
  Functions 2nd gen em Node 22.
- Neste marco, `functions/src/index.ts` não deve publicar endpoints, triggers ou
  jobs fictícios. O workspace precisa apenas compilar e estabelecer o limite.
- O SDK de Functions/Admin só será instalado quando o primeiro handler real for
  planejado; a migração não deve adicionar dependências sem uso.
- `firebase.json` deve preparar Hosting para `apps/web/dist`, Emulator Suite e
  os caminhos de regras/índices, sem depender de projeto de produção.
- Firestore e Storage devem começar em negação por padrão. Nenhuma coleção ou
  caminho de upload de produto será liberado neste marco.
- IDs de projetos Firebase não devem ser fixados no repositório. O README deve
  explicar como cada colaborador associa aliases locais de desenvolvimento,
  staging e produção sem commitar credenciais.
- App Check, Auth, Vision, filas e serviços externos são apenas documentados;
  não são configurados nem simulados antes de existir uma operação consumidora.

### Packages iniciais

- `@poe-crafter/shared-types` deve aceitar somente contratos serializáveis e não
  depender de React, Firebase, Node ou providers externos.
- `@poe-crafter/poe-data` deve ser reservado para adaptação e normalização do
  RePoE, podendo depender de `shared-types`, mas não de web ou Functions.
- Os dois packages devem nascer privados, compiláveis, testáveis e com uma API
  pública em `src/index.ts`, mas sem tipos de negócio inventados apenas para
  preencher o arquivo.
- Cada package deve declarar diretamente as dependências que usa; o hoisting do
  workspace não pode mascarar dependências ausentes.
- Nenhum package pode importar `apps/web`, `functions` ou internals de outro
  package.

### Qualidade, automação e documentação

- A raiz deve expor um único `pnpm validate` que cubra skills, arquitetura,
  documentação, styleguide, formato, lint, tipos, testes, cobertura e builds.
- Os limites de cobertura atuais não podem ser reduzidos para acomodar a
  migração.
- Playwright deve continuar sendo um gate explícito separado, executando contra
  o bundle de `apps/web` em porta efêmera e publicando evidências apenas na falha.
- O CI deve instalar a versão de pnpm declarada, usar lockfile congelado e rodar
  validação, auditoria e E2E em Node 22.
- `check:architecture` deve conhecer as fronteiras entre workspaces e continuar
  verificando as regras internas da aplicação web.
- `generate:feature` deve gerar features em `apps/web/src/features` e manter o
  padrão de API pública.
- `check:styleguide` deve deixar de validar o pacote Vitru e passar a validar o
  tema Tailwind, `components.json`, a rota `/styleguide`, os aliases e os
  guardrails de tokens/ícones.
- `sync:skills`, verificações de docs/commit, smoke do bundle e hooks devem ser
  adaptados para pnpm e permanecer operacionais.
- O setup e o atualizador do antigo template devem ser aposentados após a
  migração ficar verde: `setup`, `update:template`, `.template-state.json` e o
  código usado exclusivamente por eles não representam o ciclo de vida deste
  produto. O histórico permanece no Git.
- ADRs existentes não serão apagados. Decisões superadas devem ser marcadas como
  substituídas e apontar para os novos ADRs.
- README, `AGENTS.md`, arquitetura, styleguide, desenvolvimento, build, testes,
  integrações e guia de agentes devem descrever os caminhos e comandos reais.

## Suposições e decisões fechadas

- A migração começa do estado atual do repositório, incluindo a remoção já feita
  da feature demonstrativa `notes`; ela não deve ser restaurada.
- O comportamento a preservar é o da home, do styleguide, dos erros de rota e da
  rota desconhecida, não a identidade interna do antigo kit visual.
- Todos os workspaces permanecem privados durante o MVP; publicação em registry e
  versionamento independente de packages não são necessários.
- TypeScript continua em modo estrito. Packages de domínio produzem `dist` e
  declarações; a aplicação Vite consome suas APIs públicas por `workspace:*`.
- O root usa o pnpm recursivo, em ordem topológica, suficiente para o tamanho
  atual. Cache remoto e execução distribuída não justificam um orquestrador.
- Configurações de lint, formato, Playwright e verificadores de repositório ficam
  na raiz; Vite, Vitest e TypeScript específicos ficam com cada workspace.
- O E2E continua na raiz porque valida fluxos entre bundle, rotas e futura
  emulação Firebase, não detalhes internos de um único package.
- A criação do esqueleto Firebase não autoriza deploy nem criação de projetos.
- O primeiro trabalho funcional posterior será planejado separadamente; este
  marco não antecipa seu modelo de dados ou suas APIs.

## Não escopo

- Importar ou interpretar texto e screenshots de itens.
- Criar autenticação anônima, login Google, conta ou histórico.
- Integrar RePoE, poe.ninja, Cloud Vision ou qualquer API da GGG.
- Implementar engine, planner, simulator, pricing ou lógica de crafting.
- Definir coleções Firestore, índices de produto, Storage para screenshots ou
  regras de autorização de funcionalidades ainda inexistentes.
- Criar Functions, task queues, agendamentos, App Check ou painel administrativo.
- Fazer deploy, criar projetos Firebase ou configurar segredos.
- Adicionar gerenciamento global de estado, i18n, PWA, analytics ou IA.
- Redesenhar a experiência de produto além do necessário para migrar o shell e o
  styleguide ao novo sistema visual.
- Criar pacote compartilhado de UI, design system distribuível ou catálogo amplo
  de componentes shadcn.
- Introduzir Turborepo, Nx, Changesets ou publicação de packages.
- Reduzir cobertura, desabilitar hooks ou usar `--no-verify`.

## Arquitetura da solução

### Dependências permitidas neste marco

```text
apps/web ───────────────> @poe-crafter/shared-types
functions ──────────────> @poe-crafter/shared-types
functions ──────────────> @poe-crafter/poe-data
@poe-crafter/poe-data ──> @poe-crafter/shared-types
```

As setas representam permissões, não dependências obrigatórias. Enquanto um
workspace não usar o contrato do outro, ele não deve declará-lo só para ocupar o
grafo. O sentido inverso é proibido e ciclos falham na validação.

### Responsabilidade das configurações

| Local        | Responsabilidade                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| Raiz         | Workspace, lockfile, scripts agregadores, lint, formato, Playwright, CI, Firebase e verificadores globais |
| `apps/web`   | Runtime React, Vite, Vitest/jsdom, aliases, Tailwind, shadcn e bundle da SPA                              |
| `functions`  | Build TypeScript do backend e, no futuro, handlers Firebase                                               |
| `packages/*` | Build e testes puros dos módulos reutilizáveis                                                            |

### Estratégia de scripts

Os nomes públicos da raiz permanecem simples e estáveis:

| Comando              | Resultado esperado                                                           |
| -------------------- | ---------------------------------------------------------------------------- |
| `pnpm dev`           | Inicia somente `@poe-crafter/web`                                            |
| `pnpm dev:emulators` | Inicia os emuladores configurados, sem projeto real                          |
| `pnpm build`         | Compila workspaces em ordem topológica e gera `apps/web/dist`                |
| `pnpm test`          | Executa testes e cobertura dos workspaces com testes                         |
| `pnpm test:e2e`      | Serve o bundle web e executa o fluxo Chromium                                |
| `pnpm lint`          | Verifica arquivos da raiz e workspaces                                       |
| `pnpm typecheck`     | Verifica todos os workspaces sem emitir                                      |
| `pnpm validate`      | Executa todos os gates locais obrigatórios, exceto instalação do browser E2E |

Scripts internos podem usar `pnpm --filter` e `pnpm -r --if-present`, mas os
desenvolvedores não devem precisar conhecer a topologia para os fluxos comuns.

## Plano de implementação sequencial

Cada incremento deve terminar com seus testes focados e com o melhor gate global
disponível naquele ponto. Nenhum incremento começa se o anterior deixa a branch
em estado irrecuperável.

### Incremento 1 — Congelar a linha de base

- [ ] Registrar os resultados atuais de `npm run validate` e `npm run test:e2e`.
- [ ] Capturar screenshots desktop e 360 px da home, `/styleguide`, erro de rota
      e rota desconhecida para comparação, sem transformar pixels em requisito.
- [ ] Listar os testes e scripts existentes que dependem de caminhos na raiz.
- [ ] Confirmar que as alterações já presentes no worktree pertencem ao estado
      inicial e não serão descartadas pela movimentação.
- [ ] Criar um teste de contrato temporário que falhe se `/`, `/styleguide` ou o
      fallback curinga desaparecerem durante a migração.

**Gate:** linha de base documentada e testes atuais verdes antes de mover arquivos.

### Incremento 2 — Criar o workspace pnpm

- [ ] Adicionar `pnpm-workspace.yaml` com os três grupos de workspace.
- [ ] Transformar o `package.json` raiz em manifesto privado e agregador.
- [ ] Fixar pnpm, alinhar a política Node 22 e atualizar `.npmrc`/configuração do
      pnpm para lockfile compartilhado, protocolo workspace e rejeição de ciclos.
- [ ] Criar `apps/web/package.json` e transferir dependências do runtime web e
      ferramentas específicas da aplicação.
- [ ] Gerar `pnpm-lock.yaml` a partir de uma instalação limpa.
- [ ] Verificar que cada import externo pertence ao manifesto do workspace que o
      utiliza.
- [ ] Só então remover `package-lock.json` e referências a npm nos scripts ativos.

**Gate:** `pnpm install --frozen-lockfile` funciona em checkout limpo e um teste
detecta pnpm/Node diferentes dos declarados.

### Incremento 3 — Mover a SPA para `apps/web`

- [ ] Mover `src`, `public`, `index.html` e configurações Vite/Vitest/TypeScript
      específicas para `apps/web`, preservando histórico com movimentos simples.
- [ ] Atualizar aliases, includes, saída de cobertura, caminhos de assets e
      descoberta de testes.
- [ ] Adaptar Playwright e o smoke do bundle para `apps/web/dist`.
- [ ] Adaptar `generate:feature` e seus testes para o novo diretório canônico.
- [ ] Atualizar os verificadores de arquitetura para localizar a aplicação em
      `apps/web/src` sem relaxar nenhuma regra existente.
- [ ] Executar testes unitários, build, smoke e E2E das três rotas preservadas.

**Gate:** a SPA movida apresenta o mesmo conteúdo e os mesmos estados de
navegação antes de qualquer troca visual.

### Incremento 4 — Migrar o sistema visual

- [ ] Adicionar Tailwind pelo plugin Vite e configurar shadcn/ui em
      `apps/web/components.json` com os aliases definidos neste plano.
- [ ] Criar o tema global e mapear para variáveis semânticas os tokens atuais que
      ainda representam a identidade desejada.
- [ ] Garantir o carregamento local de TheMix e Archivo sem CDN.
- [ ] Adicionar somente os componentes shadcn necessários para home, page header,
      conteúdo, alerts/fallbacks e demonstração do styleguide.
- [ ] Migrar home, layout, fallbacks e `/styleguide` por uma fatia de tela de cada
      vez, cobrindo estados observáveis antes de remover o componente antigo.
- [ ] Remover imports de `@vitru/styleguide`, CSS Modules e arquivos `.module.css`
      quando a última tela estiver migrada.
- [ ] Remover a dependência Vitru e verificar que não existem imports residuais.
- [ ] Reescrever `check:styleguide` e testes para as novas regras.
- [ ] Atualizar snapshots visuais somente após inspecionar desktop e 360 px e
      registrar que as diferenças são intencionais.
- [ ] Testar teclado, foco, contraste, reduced motion e semântica das rotas.

**Gate:** nenhum sistema visual legado permanece, `/styleguide` funciona e E2E
visual/acessível passa nos viewports suportados.

### Incremento 5 — Estabelecer backend e packages iniciais

- [ ] Criar os workspaces privados `functions`, `shared-types` e `poe-data` com
      TypeScript estrito, APIs públicas vazias e builds reproduzíveis.
- [ ] Não adicionar SDKs ou exports de negócio até existir uso real.
- [ ] Acrescentar fixtures ao `check:architecture` que provem imports permitidos,
      proibidos, internals e ciclos entre workspaces.
- [ ] Adicionar `firebase.json`, regras Firestore/Storage deny-all e índices
      vazios válidos, com Hosting apontando para `apps/web/dist`.
- [ ] Configurar somente os emuladores necessários para validar Hosting, regras e
      o limite de Functions sem credenciais reais.
- [ ] Criar testes objetivos das regras deny-all e da ausência de endpoints
      publicados, escolhendo teste no Emulator Suite quando isso não tornar o
      `validate` dependente de rede.
- [ ] Documentar aliases de projetos e ambiente local sem commitar `.firebaserc`
      pessoal, chaves ou project IDs.

**Gate:** todos os workspaces compilam, violações de fronteira falham e os
emuladores sobem com configuração versionada e segura por padrão.

### Incremento 6 — Migrar automação e aposentar o template

- [ ] Converter scripts ativos, Husky, exemplos de comandos e mensagens de erro
      de npm para pnpm.
- [ ] Manter e adaptar `sync:skills`, checks de arquitetura/docs/styleguide/
      toolchain/commit, gerador de feature e smoke do bundle.
- [ ] Remover `setup`, `update:template`, `.template-state.json` e bibliotecas/
      testes usados exclusivamente pelo ciclo de template.
- [ ] Remover ou reescrever documentação que trate o repositório como template
      atualizável, preservando ADRs como histórico.
- [ ] Atualizar o CI para pnpm, lockfile congelado e Node 22 nos jobs de validate,
      audit e E2E.
- [ ] Atualizar Dependabot para o workspace pnpm e confirmar que cobre manifestos
      sob `apps`, `functions` e `packages`.
- [ ] Garantir que instalação limpa execute `prepare`/sync de skills sem recursão
      nem depender de artefatos gerados no Git.

**Gate:** nenhuma automação ativa chama npm ou caminhos antigos, e o CI reproduz
os mesmos comandos documentados localmente.

### Incremento 7 — Realinhar documentação e regras dos agentes

- [ ] Criar ADR para monorepo pnpm e Node 22, incluindo a decisão de não usar
      orquestrador adicional.
- [ ] Criar ADR para Tailwind/shadcn e marcar ADRs do CSS Modules/Vitru como
      substituídos sem apagá-los.
- [ ] Criar ADR para o esqueleto Firebase seguro e os packages iniciais.
- [ ] Atualizar `AGENTS.md` somente depois que caminhos, comandos, fronteiras e
      sistema visual reais estiverem implementados e validados.
- [ ] Atualizar README, arquitetura, desenvolvimento, build, testes, styleguide,
      integrações, agentes, contribuição e templates do GitHub.
- [ ] Atualizar `docs/tasks/README.md` apenas se o modelo de planos precisar
      refletir incrementos com gates.
- [ ] Executar `check:docs` e busca por comandos/caminhos obsoletos.

**Gate:** código, scripts, CI, `AGENTS.md` e documentação descrevem uma única
arquitetura e um único gerenciador.

### Incremento 8 — Validação final e entrega

- [ ] Remover `node_modules`, outputs e caches em uma cópia/checkout descartável,
      executar instalação congelada e provar reprodutibilidade.
- [ ] Executar `pnpm validate` na raiz até ficar verde.
- [ ] Executar `pnpm test:e2e` em Chromium e validar os screenshots desktop e
      mobile da home, styleguide e fallbacks.
- [ ] Subir o Emulator Suite localmente e verificar Hosting, regras deny-all e
      ausência de acesso a projetos reais.
- [ ] Revisar o diff para movimentos acidentais, arquivos gerados, segredos,
      dependências não usadas e expansão de escopo.
- [ ] Atualizar a documentação final se a implementação exigir desvio justificado
      deste plano.
- [ ] Registrar evidências reais em `docs/entregas`, incluindo versões de Node e
      pnpm, contagens de testes, cobertura, E2E e emuladores.

**Gate:** definição de concluído do projeto atendida e nenhuma feature de produto
implementada por acidente.

## Estratégia de migração e reversão

- A migração deve ocorrer em um branch próprio e em commits por incremento para
  permitir reversão seletiva.
- Movimentos de arquivos devem ser separados de refactors sempre que possível;
  isso preserva revisão e histórico.
- Até o gate do incremento 2, npm continua sendo a linha de base. Após a
  instalação pnpm congelada passar, pnpm vira a única fonte da verdade e não se
  mantém lockfile duplo.
- Até o gate do incremento 3, o sistema visual antigo continua intacto dentro de
  `apps/web`. A remoção do Vitru só acontece depois da equivalência funcional.
- Em falha antes de um gate, reverte-se somente o commit do incremento. Não se
  criam camadas de compatibilidade permanentes entre npm/pnpm ou Vitru/shadcn.
- Firebase permanece local e deny-all durante todo o marco; portanto a reversão
  não exige migração de dados ou rollback de produção.

## Estratégia de testes

| Camada                   | Cobertura exigida                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Contratos do repositório | Toolchain, workspace, imports internos, ciclos, docs, skills e styleguide                                                |
| Web unitário             | App, rotas, fallback, env e componentes migrados pelo comportamento observável                                           |
| Web visual/acessível     | Home, `/styleguide`, erro e 404 em desktop e 360 px; teclado e reduced motion                                            |
| Packages                 | Build/typecheck e testes puros somente quando houver comportamento; não criar testes artificiais para entrypoints vazios |
| Firebase                 | Config válida, Hosting local e regras Firestore/Storage deny-all                                                         |
| Bundle                   | Build de todos os workspaces e smoke sobre `apps/web/dist`                                                               |
| E2E                      | Carregamento da home, styleguide e rota desconhecida no Chromium                                                         |
| Instalação               | `pnpm install --frozen-lockfile` em checkout sem `node_modules`                                                          |

Os limites atuais de cobertura são piso. Arquivos puramente declarativos ou
entrypoints vazios devem ser excluídos por justificativa explícita, não cobertos
com asserts sem valor.

## Riscos e mitigação

| Risco                                                  | Impacto                                     | Mitigação                                                                                |
| ------------------------------------------------------ | ------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Misturar movimentos e redesign                         | Regressões difíceis de localizar            | Mover a SPA e validar antes de trocar o sistema visual                                   |
| Lockfiles npm e pnpm divergirem                        | Builds não reproduzíveis                    | Janela curta de transição; remover o lockfile npm somente após instalação congelada pnpm |
| Dependências hoisted mascararem manifestos incompletos | Package funciona localmente e falha isolado | pnpm estrito, imports por `workspace:*` e teste por workspace                            |
| Criar packages vazios demais                           | Arquitetura especulativa                    | Criar apenas `shared-types` e `poe-data`; demais entram com seu primeiro consumidor      |
| shadcn virar segundo design system genérico            | Duplicação e inconsistência                 | Migração por tela, componentes app-local, remoção total do Vitru no mesmo marco          |
| Perder fontes ou identidade visual                     | Regressão visual e de layout                | Auto-hospedar TheMix/Archivo, mapear tokens e comparar viewports                         |
| Remover tooling do template cedo demais                | Perda de gates úteis                        | Classificar scripts por responsabilidade e remover só os exclusivos de setup/update      |
| CI usar runtime diferente de Functions                 | Falha tardia de deploy                      | Unificar Node 22 em engines, `.nvmrc`, CI, docs e runtime Firebase                       |
| Esqueleto Firebase acessar produção                    | Custo ou alteração de dados                 | Sem project IDs, emuladores e regras deny-all; nenhum deploy neste marco                 |
| Validação global ficar lenta                           | Iteração ruim                               | Comandos focados por workspace durante desenvolvimento; um gate completo na conclusão    |
| Alterações pré-existentes serem sobrescritas           | Perda de trabalho                           | Inventário inicial, branch dedicado e revisão de cada movimento                          |

## Critérios de aceite

- [ ] Um clone limpo instala com a versão declarada por
      `pnpm install --frozen-lockfile` e não possui `package-lock.json`.
- [ ] `pnpm-workspace.yaml` reconhece `apps/web`, `functions`,
      `packages/shared-types` e `packages/poe-data`.
- [ ] `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm typecheck` e `pnpm validate`
      funcionam a partir da raiz.
- [ ] O código executável da SPA vive em `apps/web`; a raiz não mantém cópia de
      `src`, `public`, `index.html` ou configurações web concorrentes.
- [ ] `/`, `/styleguide`, o tratamento de erro e a rota `*` continuam cobertos e
      funcionando em bundle real.
- [ ] O alias `@/` e os imports públicos entre features funcionam no editor,
      build, testes e E2E.
- [ ] Não existem imports de `@vitru/styleguide`, arquivos `.module.css` nem
      dependência do kit antigo.
- [ ] Tailwind e shadcn/ui estão configurados em `apps/web`, sem `packages/ui`,
      e somente componentes usados foram adicionados.
- [ ] TheMix e Archivo carregam localmente, sem requisição de fonte externa.
- [ ] Home, styleguide e fallbacks são utilizáveis por teclado e a partir de
      360 px, com contraste e foco compatíveis com WCAG 2.2 AA.
- [ ] `functions` compila em Node 22 sem publicar funções fictícias.
- [ ] Firestore e Storage negam acesso por padrão e a configuração local não
      contém IDs, credenciais ou segredos de produção.
- [ ] Os packages iniciais não dependem de React/Firebase e não contêm contratos
      ou regras de crafting especulativos.
- [ ] Violações de fronteira, imports de internals e ciclos entre workspaces
      falham em testes do verificador arquitetural.
- [ ] O gerador de features, sync de skills, hooks, smoke e verificadores usam os
      novos caminhos e pnpm.
- [ ] Setup/update do template foram removidos sem eliminar verificadores úteis.
- [ ] CI, Dependabot, README, `AGENTS.md`, ADRs e documentação concordam com o
      estado implementado.
- [ ] A cobertura não foi reduzida, o E2E Chromium passa e `pnpm validate` fica
      verde.
- [ ] O diff final não contém segredo, output gerado, feature de produto ou
      dependência sem uso.
- [ ] A entrega possui evidência real em `docs/entregas`.

## Dependências novas previstas

As versões exatas devem ser resolvidas e fixadas no lockfile durante a
implementação, respeitando Node 22.

| Dependência                                            | Local          | Justificativa                                                           |
| ------------------------------------------------------ | -------------- | ----------------------------------------------------------------------- |
| `pnpm`                                                 | raiz/toolchain | Gerenciar o monorepo aprovado e ligar packages locais estritamente      |
| `tailwindcss` e `@tailwindcss/vite`                    | `apps/web`     | Sistema de utilitários e integração oficial com Vite                    |
| CLI/runtime mínimo do shadcn/ui                        | `apps/web`     | Gerar componentes possuídos pelo projeto e manter aliases consistentes  |
| Primitives Radix exigidas pelos componentes escolhidos | `apps/web`     | Semântica e comportamento acessível dos componentes efetivamente usados |
| `class-variance-authority`, `clsx` e `tailwind-merge`  | `apps/web`     | Variantes e composição segura das classes dos componentes shadcn        |
| pacote auto-hospedado do Archivo                       | `apps/web`     | Preservar a tipografia sem depender do Vitru ou de CDN                  |
| Firebase CLI                                           | raiz/dev       | Configurar e executar Hosting e Emulator Suite localmente               |

O SDK Firebase web, `firebase-admin`, `firebase-functions`, testes de rules e
integrações externas só entram quando houver um comportamento real que os
consuma, salvo se o teste deny-all exigir a biblioteca oficial de rules e a
necessidade for registrada no ADR.

## Referências técnicas oficiais

- [pnpm workspaces](https://pnpm.io/workspaces): arquivo raiz do workspace,
  protocolo `workspace:` e detecção de ciclos.
- [shadcn/ui em monorepos](https://ui.shadcn.com/docs/monorepo): aliases,
  `components.json` e resolução dos componentes pelo CLI.
- [Tailwind com Vite](https://tailwindcss.com/docs/installation/using-vite):
  integração pelo plugin oficial.
- [Runtimes de Cloud Functions](https://firebase.google.com/docs/functions/manage-functions):
  suporte e configuração do runtime Node.

## Pronto para implementação quando

- este plano estiver aprovado;
- o worktree inicial tiver sido inventariado sem descartar alterações existentes;
- a migração for executada com a skill `implement-feature`, um incremento por vez;
- mudanças de comportamento receberem testes pela skill `generate-tests`;
- o diff passar por `review-changes` antes da entrega;
- documentação, `AGENTS.md` e evidências forem atualizadas apenas após o estado
  real ficar verde.
