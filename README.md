# PoE Crafting Planner

Aplicação web para planejar crafts de itens não únicos do Path of Exile 1, construída como monorepo pnpm com React, TypeScript, Vite, Tailwind, shadcn/ui e uma fundação Firebase.

## Objetivo

Transformar um item-alvo em estratégias de crafting legalmente executáveis,
comparando probabilidade e custo e acompanhando a execução. O produto completo
está definido em [docs/prd.md](docs/prd.md); o estado atual entrega a fundação
técnica anterior à primeira feature de importação.

## Quando usar

Indicado para:

- Desenvolver a aplicação web responsiva do planejador.
- Implementar packages determinísticos de game data, regras, simulação e preços.
- Desenvolver e testar APIs e jobs Firebase no Emulator Suite.
- Planejar e validar uma feature por vez com os gates do repositório.

## Quando NÃO usar

- Para automatizar o cliente do jogo ou executar crafts.
- Para acessar APIs da GGG; elas estão fora do MVP.
- Para planejar itens únicos ou conteúdo de Path of Exile 2.
- Para tratar estimativas probabilísticas como garantia de resultado.
- Para conectar ambiente local diretamente a dados de produção.

## Pré-requisitos

- Node.js 22.22.2 (use a versão de `.nvmrc`).
- pnpm 11.19.0 (use a versão exata de `packageManager`).
- Git.
- Java 21 para os emuladores Firestore e Storage.

## Instalação

```bash
pnpm install --frozen-lockfile
```

O pnpm executa builds transitivos somente para `re2` e `protobufjs`, dependências
do Firebase CLI revisadas e declaradas em `pnpm-workspace.yaml`.

## Execução

Aplicação web:

```bash
pnpm dev
```

Emuladores Firebase, sem projeto real:

```bash
pnpm dev:emulators
```

O Vite informa o endereço da web no terminal. A Emulator UI usa
`http://127.0.0.1:4000`.

## Validação

Antes de considerar qualquer alteração pronta, rode:

```bash
pnpm validate
```

O comando verifica toolchain e workspaces, skills, fronteiras arquiteturais,
documentação, Tailwind/shadcn, configuração Firebase, formato, lint, testes,
cobertura, tipos, builds TypeScript, bundle Vite e smoke HTTP.

O navegador é um gate separado:

```bash
pnpm test:e2e
```

## Verificação automática

| Onde         | O que roda                                      |
| ------------ | ----------------------------------------------- |
| `pre-commit` | `lint-staged` nos arquivos alterados            |
| `commit-msg` | Convenção `tipo: descrição`                     |
| `pre-push`   | `typecheck` e testes unitários web              |
| CI           | `validate`, auditoria e E2E Chromium em Node 22 |

O workflow está em `.github/workflows/ci.yml`. Instalações no CI usam
`pnpm install --frozen-lockfile` e o lockfile único da raiz.

## Comandos

| Comando                                         | O que faz                                                     |
| ----------------------------------------------- | ------------------------------------------------------------- |
| `pnpm dev`                                      | Iniciar a aplicação web com Vite                              |
| `pnpm dev:emulators`                            | Iniciar o Emulator Suite no projeto demo                      |
| `pnpm build`                                    | Verificar tipos, compilar workspaces, gerar e testar o bundle |
| `pnpm lint`                                     | Verificar TypeScript e scripts com ESLint                     |
| `pnpm format`                                   | Formatar o repositório com Prettier                           |
| `pnpm typecheck`                                | Verificar tipos de E2E e workspaces                           |
| `pnpm test`                                     | Executar cobertura web e testes de contratos do repositório   |
| `pnpm test:unit`                                | Executar os testes Vitest sem cobertura                       |
| `pnpm test:e2e`                                 | Executar os fluxos críticos no Chromium                       |
| `pnpm test:e2e:update`                          | Atualizar screenshots após inspeção visual                    |
| `pnpm check:architecture`                       | Verificar features e dependências entre workspaces            |
| `pnpm check:styleguide`                         | Verificar Tailwind, shadcn, tokens, fontes e ícones           |
| `pnpm check:firebase`                           | Verificar emuladores, Node 22 e regras deny-all               |
| `pnpm generate:feature -- --name="item-import"` | Gerar a estrutura Tailwind de uma feature web                 |
| `pnpm sync:skills`                              | Sincronizar skills canônicas para os agentes                  |
| `pnpm validate`                                 | Executar todos os gates locais obrigatórios                   |

## Estrutura resumida

```text
apps/web/                 # SPA React, rotas, features e sistema visual
functions/                # limite TypeScript para Functions 2nd gen
packages/shared-types/    # contratos serializáveis e neutros
packages/poe-data/        # futuro adaptador e normalização do RePoE
e2e/                      # testes do bundle em navegador real
scripts/                  # verificadores e geradores do repositório
docs/                     # produto, arquitetura, processo, ADRs e entregas
firebase.json             # Hosting, Functions, regras e emuladores
pnpm-workspace.yaml       # workspaces e política de builds transitivos
```

Detalhes e dependências permitidas ficam em
[docs/architecture.md](docs/architecture.md).

## Styleguide

Tailwind fornece as utilidades e os componentes shadcn/ui pertencem ao próprio
workspace web, em `apps/web/src/shared/ui`. Tokens semânticos e fontes locais
ficam em `apps/web/src/styles/globals.css`.

Rode `pnpm dev` e abra `/styleguide` para inspecionar a referência viva. Leia
[docs/styleguide.md](docs/styleguide.md) antes de alterar interface.

## Como usar agentes

- `AGENTS.md` contém regras obrigatórias para qualquer agente.
- `CLAUDE.md` aponta a ordem de leitura para Claude Code.
- [docs/agents.md](docs/agents.md) explica quando usar cada skill.

As skills canônicas vivem em `skills/`; `.agents/skills` e `.claude/skills` são
cópias geradas por `pnpm sync:skills`.

## Como criar uma feature

1. Confirme o requisito em `docs/prd.md`.
2. Use `plan-feature` e salve o plano em `docs/tasks`.
3. Aprove o plano antes de implementar.
4. Execute um incremento com `implement-feature`.
5. Gere a base web, se necessária:

```bash
pnpm generate:feature -- --name="minha-feature"
```

6. Adicione testes observáveis, rode `pnpm validate`, revise o diff e registre a
   evidência em `docs/entregas`.

## Como registrar uma decisão

Decisões arquiteturais entram em `docs/decisions` como ADR. Não apague decisões
superadas; marque-as como substituídas e aponte a nova fonte.

## Variáveis de ambiente

Copie `.env.example` para `apps/web/.env.local` quando a primeira integração web
for adicionada. Variáveis `VITE_` são públicas e sua leitura deve permanecer em
`apps/web/src/shared/config/env.ts`.

Aliases e IDs Firebase pessoais ficam em `.firebaserc`, ignorado pelo Git. Use o
project ID `demo-poe-crafter` para os emuladores.

## Limitações conhecidas

- A fundação ainda não importa itens, autentica jogadores nem gera planos.
- `functions`, `shared-types` e `poe-data` não expõem comportamento de produto.
- Firestore e Storage negam toda leitura e escrita até regras de uma feature real
  serem planejadas e testadas.
- Não existe deploy configurado ou autorizado neste marco.
