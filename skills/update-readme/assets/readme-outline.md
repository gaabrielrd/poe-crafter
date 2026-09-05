# nome-do-projeto

Uma frase dizendo o que é, para quem e com qual stack.

## Objetivo

O que o projeto resolve, em duas ou três frases. Sem marketing.

## Quando usar

Indicado para:

- Caso de uso 1
- Caso de uso 2

## Quando NÃO usar

- Cenário fora do escopo 1
- Cenário fora do escopo 2

## Pré-requisitos

- Node.js 22 (a versão está em `.nvmrc`; com `nvm`, rode `nvm use`)
- pnpm 11.19.0 (a versão exata declarada em `packageManager`)
- git

## Instalação

```bash
pnpm install --frozen-lockfile
```

## Execução

```bash
pnpm dev
```

O Vite mostra no terminal o endereço local (algo como `http://localhost:5173`).

## Validação

Antes de considerar qualquer alteração pronta, rode:

```bash
pnpm validate
```

Uma frase dizendo o que esse comando executa, em sequência.

## Verificação automática

| Onde                | O que roda                              |
| ------------------- | --------------------------------------- |
| `pre-commit`        | `lint-staged` nos arquivos alterados    |
| `commit-msg`        | Convenção da mensagem de commit         |
| `pre-push`          | `typecheck` e `test:unit`               |
| CI (GitHub Actions) | `validate`, auditoria e E2E no Chromium |

## Comandos

| Comando         | O que faz                          |
| --------------- | ---------------------------------- |
| `pnpm dev`      | Sobe o servidor de desenvolvimento |
| `pnpm build`    | Gera a versão de produção          |
| `pnpm test`     | Roda a suíte de testes             |
| `pnpm validate` | Roda todos os portões de qualidade |

## Estrutura resumida

```
apps/web/src/     # aplicação React organizada por app, features e shared
functions/src/    # limite inicial do backend Firebase
packages/         # tipos e dados compartilháveis entre runtimes
docs/             # documentação e decisões
```

Detalhes em [docs/architecture.md](docs/architecture.md).

## Como usar agentes

As regras que os agentes devem seguir ficam em dois arquivos na raiz:

- `AGENTS.md` — regras gerais válidas para qualquer agente
- `CLAUDE.md` — instruções específicas para o Claude Code

Veja [docs/agents.md](docs/agents.md) para a lista de skills.

## Como criar uma feature

1. Peça ao agente um plano: "Use a skill plan-feature para planejar...".
2. Revise o plano.
3. Peça a implementação: "Use a skill implement-feature...".
4. Rode `pnpm validate`.
5. Peça a evidência da entrega: "Use a skill document-delivery...".

## Como registrar uma decisão

Decisões relevantes viram um ADR em `docs/decisions/`.

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha os valores. Diga o que é
público e onde a leitura fica concentrada.

## Limitações conhecidas

- Limitação real 1
- Limitação real 2
