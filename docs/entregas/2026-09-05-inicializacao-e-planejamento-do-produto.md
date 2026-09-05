# Inicialização e planejamento do PoE Crafting Planner

- **Data**: 2026-09-05
- **Branch**: `master`
- **Plano de origem**: plano aprovado na conversa com a skill `plan-app`

## Objetivo

Inicializar o template como PoE Crafting Planner e transformar a especificação
fornecida em decisões de produto verificáveis, sem iniciar a implementação das
features do aplicativo.

## Funcionalidades entregues

- **Projeto inicializado** — dependências instaladas, identidade do template
  alterada para PoE Crafting Planner, backlog herdado reiniciado e demonstração
  de notas removida.
- **Composição inicial consistente** — a página e os testes deixaram de depender
  da demonstração removida.
- **PRD aprovado** — problema, usuários, jornada, escopo, requisitos, regras,
  dados, integrações, estados, qualidade, aceite e não escopo foram consolidados.
- **Arquitetura-alvo documentada** — monorepo pnpm, aplicação web, Firebase,
  packages determinísticos, pipelines, privacidade e marco de migração foram
  descritos sem declarar a migração como já implementada.

## Critérios de aceite

- [x] O projeto usa o nome técnico `poe-crafter` e o nome visível PoE Crafting
      Planner.
- [x] A feature demonstrativa foi removida sem imports ou testes quebrados.
- [x] O PRD não contém decisões obrigatórias em aberto.
- [x] A arquitetura preserva as regras atuais e separa explicitamente a
      arquitetura-alvo ainda não implementada.
- [x] O teste E2E da composição inicial passa no Chromium.
- [x] `npm run validate` passa integralmente.

## Arquivos alterados

| Arquivo                                          | Mudança                                                                                     |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `.template-state.json`                           | Registra os nomes técnico e visível do projeto.                                             |
| `package.json`                                   | Atualiza nome e descrição.                                                                  |
| `README.md` e `index.html`                       | Atualizam a identificação visível.                                                          |
| `src/app/App.tsx`                                | Remove a composição da demonstração e identifica o produto.                                 |
| `src/features/home/components/HomePage.tsx`      | Remove a referência residual à feature de notas.                                            |
| `src/features/notes/`                            | Remove a demonstração do template.                                                          |
| `src/app/tests/App.test.tsx` e `e2e/app.spec.ts` | Verificam a composição inicial sem a demonstração.                                          |
| `scripts/setup.test.mjs`                         | Torna os testes do setup independentes da presença da demonstração no projeto inicializado. |
| `tasks.md`                                       | Remove o backlog herdado do template.                                                       |
| `docs/prd.md`                                    | Registra o plano de produto aprovado.                                                       |
| `docs/architecture.md`                           | Corrige referências removidas e documenta a arquitetura-alvo.                               |

## Testes

| Teste                        | Tipo       | O que cobre                                                       |
| ---------------------------- | ---------- | ----------------------------------------------------------------- |
| `src/app/tests/App.test.tsx` | Componente | Identidade, página inicial, rotas e estados de erro.              |
| `scripts/setup.test.mjs`     | Black-box  | Personalização, remoção da demonstração, idempotência e rollback. |
| `e2e/app.spec.ts`            | E2E        | Página inicial e rota de fallback no Chromium.                    |

Saída das suítes:

```text
Vitest: 2 arquivos aprovados, 10 testes aprovados.
Node test runner: 47 testes aprovados, 0 falhas.
Cobertura: 94,73% statements; 77,77% branches; 100% functions; 94,28% lines.
Playwright Chromium: 1 teste aprovado.
```

## Validações executadas

| Comando                                     | Resultado                                                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `npm run validate`                          | Verde: skills, arquitetura, documentação, styleguide, formato, lint, testes, typecheck, bundle e smoke test. |
| Playwright de `e2e/app.spec.ts` no Chromium | Verde: 1 teste aprovado.                                                                                     |
| `git diff --check`                          | Verde: nenhum erro de whitespace.                                                                            |

```text
All matched files use Prettier code style!
Test Files  2 passed (2)
Tests  10 passed (10)
tests 47
pass 47
fail 0
vite v8.2.2: 1873 modules transformed
Smoke test do bundle OK.
```

## Fora do escopo

- Migrar o repositório para pnpm, Tailwind, shadcn/ui ou Firebase.
- Implementar parser, crafting engine, planner, preços ou autenticação.
- Criar o plano técnico detalhado do primeiro marco.
- Criar commit, publicar ou implantar a aplicação.

## Limitações e pendências conhecidas

- A arquitetura aprovada é um alvo; o código ainda usa a estrutura e as regras do
  template atual.
- O Node global 24.14.1 não satisfaz `jsdom@30.0.1`; a validação desta entrega usou
  Node 24.19.0 com npm 10.6.0.
- O próximo marco precisa atualizar `AGENTS.md`, ADRs e comandos junto com a
  migração, para que documentação e estrutura real permaneçam alinhadas.

## Como verificar manualmente

1. Rode `npm run dev` com uma versão de Node compatível com as dependências.
2. Abra a página inicial e confirme o título PoE Crafting Planner e a lista de
   comandos, sem o exemplo de notas.
3. Abra uma rota inexistente e confirme a tela de página não encontrada.
4. Leia `docs/prd.md` e a seção `Decisões do produto` de
   `docs/architecture.md`; confirme que o primeiro marco é uma migração ainda não
   implementada.
