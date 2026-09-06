# Testes

Teste resultados observáveis e contratos arquiteturais. Não teste detalhes
internos apenas para aumentar cobertura.

## Camadas

| Camada                   | Local                                    | Responsabilidade                                                     |
| ------------------------ | ---------------------------------------- | -------------------------------------------------------------------- |
| Unidade/componente web   | `apps/web/src/**/tests`                  | Rotas, componentes, estado e configuração pelo comportamento         |
| Contratos do repositório | `scripts/*.test.mjs`                     | Arquitetura, docs, toolchain, Firebase, styleguide, gerador e bundle |
| Packages                 | `packages/*/src/**/tests`                | Regras puras quando houver comportamento                             |
| Functions                | `functions/src/**/*.test.ts`             | Payloads, idempotência e ordem do job de exclusão de conta           |
| E2E                      | `e2e`                                    | Bundle, navegação, responsividade e contrato visual no Chromium      |
| Engine                   | `packages/crafting-engine/src/*.test.ts` | Contrato determinístico de craftabilidade sem browser ou Firebase    |

## Comandos

```bash
pnpm test:unit
```

Vitest web sem cobertura, indicado para iteração.

```bash
pnpm test
```

Cobertura web e contratos Node.

```bash
pnpm test:e2e
```

Build, preview em porta efêmera e fluxos Chromium.

```bash
pnpm test:emulators
```

Build, Hosting local e requisições não autenticadas que precisam receber 403
do Firestore e do Storage. Requer Java 21 ou mais recente.

```bash
pnpm validate
```

Para executar somente o package de domínio:

```bash
pnpm --filter @poe-crafter/crafting-engine test
```

Para executar somente o planner determinístico:

```bash
pnpm --filter @poe-crafter/planner test
```

Os testes de `planning-configuration` cobrem a normalização determinística do
`PlanningRequest`, a validação de exclusões e overrides e o fluxo observável
do formulário em `apps/web/src/features/planning-configuration/tests`.
`packages/planner/src/index.test.ts` cobre filtragem, métricas, ranking,
deduplicação, limite de quatro estratégias, fases assíncronas e o contexto
explicativo versionado dos passos.
`packages/planner/src/execution.test.ts` cobre o contrato append-only de
execução, incluindo retry, restart, sucesso final, custos e validações.
`apps/web/src/features/strategy-planning/tests/StrategyExecution.test.tsx`
cobre o registro observável de eventos, o histórico, a conclusão e erros de
recursos na tela, além do resumo terminal e de preços indisponíveis. O Vite
alinha React e React DOM no runtime hoisted do workspace para que os testes não
carreguem duas instâncias quando o pnpm combina hardlinks e symlinks.
`StrategyPlanning.test.tsx` também cobre a criação de uma nova versão, a escolha
explícita entre continuar a anterior ou iniciar a nova e a recuperação do
histórico da versão anterior.
`SettingsPage.test.tsx` cobre a orientação de sessão anônima, a confirmação
literal `EXCLUIR`, o recibo de exclusão pendente e a falha de reautenticação sem
perder a confirmação. `functions/src/account-deletion.test.ts` cobre o prazo
de 24 horas, idempotência, ordem de limpeza e falhas recuperáveis.
`AdminPage.test.tsx` cobre ausência de dados para sessão anônima, 403 sem
diagnóstico e renderização do resumo autorizado. `functions/src/admin-overview.test.ts`
cobre lista privada de administradores, normalização de documentos ausentes,
contadores de fila e limite/ordenação de falhas.
`packages/planner/src/index.test.ts` cobre issues determinísticos da validação
de datasets. `functions/src/dataset-lifecycle.test.ts` cobre identificadores
seguros, payloads, transições importado/validado/ativo/retirado/falho e o
contrato de auditoria sem payload do dataset.
`admin-dataset.test.ts` cobre o contrato e o service autenticado das quatro
ações; `AdminPage.test.tsx` cobre importação, refresh após sucesso e issues
recuperáveis no formulário administrativo.
`support-access.test.ts` cobre IDs, justificativas, normalização e auditoria sem
conteúdo privado; `admin-support.test.ts` cobre o contrato, bearer e mapeamento
de erros do service; `AdminPage.test.tsx` também cobre acesso auditado,
resultado formatado e falha recuperável sem manter o resultado anterior.
`cost-protection.test.ts` cobre thresholds, prioridade OCR, idempotência e
defaults do ledger; `screenshot-cost.test.ts` confirma que o OCR bloqueado não
chama Vision; `cost-guard.test.ts` cobre o contrato HTTP e o bloqueio recuperável
do planejamento; `StrategyPlanning.test.tsx` confirma que um job negado não
publica estratégias. `packages/planner/src/index.test.ts` também cobre o
deadline de cinco minutos, issue `job-timeout`, ausência de estratégias e fases
finais sem versão parcial.
`e2e/app.spec.ts` também cobre o fluxo crítico de `/new` em 360 px por teclado,
foco visível, anúncios de estado e ausência de overflow horizontal.

Gate completo, exceto instalação/execução do navegador.

## Cobertura

O Vitest aplica os pisos atuais:

- statements: 85%;
- lines: 85%;
- branches: 75%;
- functions: 90%.

Não reduza limites para acomodar uma mudança. Entry points declarativos e os
componentes shadcn possuídos pelo projeto podem ser excluídos quando não contêm
regra própria; o fluxo que os consome continua testado.

## Interface e acessibilidade

- Prefira queries por papel, nome e label.
- Cubra sucesso e falhas recuperáveis.
- Para telas assíncronas, cubra carregando, vazio, erro, sucesso e permissão.
- Teste navegação por teclado, foco, reduced motion e overflow em 360 px.
- Atualize screenshot somente após inspeção da diferença.
- Evidências Playwright são mantidas apenas na falha.

## Firebase

O marco estrutural verifica configuração válida; Firestore libera somente
`crafts/{craftId}` ao próprio UID e mantém deny-all nos demais caminhos. Storage
libera somente `screenshots/{uid}/` ao próprio UID; `accountDeletionRequests`
é acessível apenas pelo Admin SDK. `pnpm
test:emulators` inicia Auth, Hosting, Firestore e Storage no project ID
`demo-poe-crafter` quando o Firebase CLI local está funcional. Nunca use
credenciais reais na suíte.

## Reprodutibilidade

O CI instala com `pnpm install --frozen-lockfile` em Node 24. Um teste que passa
apenas com dependência hoisted ou arquivo local não declarado é inválido.
