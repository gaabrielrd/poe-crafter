# Contrato e validação determinística de craftabilidade

- **Data**: 2026-09-06
- **Branch**: `master`
- **Plano de origem**: `docs/tasks/contrato-e-validacao-de-craftabilidade.md`

## Objetivo

Entregar a primeira autoridade determinística para dizer se um alvo confirmado
está aceito, rejeitado ou fora do conjunto suportado, preparando o planner sem
prometer legalidade para mecânicas ainda não implementadas.

## Funcionalidades entregues

- **`crafting-engine`** — novo package TypeScript puro com contrato versionado,
  `evaluateCraftability`, conflitos estáveis e limites estruturais iniciais.
- **Validação no fluxo web** — depois de confirmar o item, o jogador pode
  validar a craftabilidade e ver o status, versão do engine e razões acionáveis;
  o resultado não altera o craft salvo.
- **Estados não suportados** — influências ou mecânicas fora do conjunto atual
  aparecem como `unsupported`, sem gerar plano.

## Critérios de aceite

- [x] Resultado determinístico e serializável com `accepted`, `rejected` ou
      `unsupported`.
- [x] Conflitos com códigos e caminhos estáveis para campos inválidos, linhas
      não reconhecidas, classificações ausentes e limites de affix.
- [x] Package sem dependência de React, Firebase, rede, relógio ou providers.
- [x] UI exibe sucesso e motivos de rejeição/não suporte sem persistir o
      resultado calculado.
- [x] Testes unitários, contratos, E2E, build e `pnpm validate` verdes.

## Arquivos alterados

| Arquivo                                                                                            | Mudança                                               |
| -------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `packages/crafting-engine/**`                                                                      | Novo contrato, engine, testes e build do package.     |
| `apps/web/src/features/item-import/components/ItemImportPage.tsx`                                  | Ação e painel de validação no fluxo confirmado.       |
| `apps/web/src/features/item-import/tests/ItemImportPage.test.tsx`                                  | Teste do resultado aceito e da versão do engine.      |
| `e2e/app.spec.ts`                                                                                  | Fluxo Chromium confirmado → validar craftabilidade.   |
| `scripts/check-architecture.mjs`                                                                   | Permissão explícita entre web, engine e shared-types. |
| `apps/web/package.json`, `pnpm-lock.yaml`                                                          | Dependência workspace do engine.                      |
| `docs/architecture.md`, `docs/integrations.md`, `docs/testing.md`, `docs/updating.md`, `README.md` | Fronteiras, comandos e evolução atualizados.          |
| `docs/decisions/0024-contrato-de-craftabilidade.md`                                                | ADR do contrato e do status `unsupported`.            |
| `docs/tasks/contrato-e-validacao-de-craftabilidade.md`                                             | Plano marcado como implementado.                      |

## Testes

| Teste                                                             | Tipo         | O que cobre                                                                   |
| ----------------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------- |
| `packages/crafting-engine/src/index.test.ts`                      | package      | Divine Crown, entrada válida, conflitos, limites, não suporte e determinismo. |
| `apps/web/src/features/item-import/tests/ItemImportPage.test.tsx` | componente   | Ação de validação e apresentação do resultado aceito.                         |
| `scripts/*.test.mjs`                                              | contratos    | Fronteiras arquiteturais, docs, Firebase, toolchain e smoke do bundle.        |
| `e2e/app.spec.ts`                                                 | E2E Chromium | Confirmação e validação no navegador.                                         |

Saídas observadas:

```text
crafting-engine: 5 passed
web coverage: 13 test files, 49 tests passed
contracts: 46 passed
E2E Chromium: 13 passed
```

## Validações executadas

| Comando                                           | Resultado         |
| ------------------------------------------------- | ----------------- |
| `pnpm validate`                                   | Verde             |
| `pnpm test:e2e`                                   | Verde — 13 passed |
| `pnpm --filter @poe-crafter/crafting-engine test` | Verde — 5 passed  |
| `pnpm check:architecture`                         | Verde             |
| `pnpm check:docs`                                 | Verde             |
| `pnpm format:check`                               | Verde             |
| `git diff --check`                                | Verde             |

O `pnpm validate` registrou cobertura web de 88,15% de statements, 81,04% de
branches, 90,05% de functions e 91,77% de lines; typecheck, builds dos
workspaces e smoke do bundle também passaram.

## Fora do escopo

Planner, geração/comparação de estratégias, simulação, preços, game data,
execução, persistência do resultado de validação, configuração completa do
RF-05 e cobertura integral das regras de Path of Exile.

## Limitações e pendências conhecidas

O engine cobre somente a primeira camada estrutural definida no contrato. Novas
influências, operações e regras precisam de módulos versionados antes de serem
aceitas. O próximo incremento pode consumir o resultado aceito para iniciar a
configuração de objetivo, ainda sem gerar estratégia final.

## Como verificar manualmente

1. Abra `/new`, selecione uma liga PC e importe um item com `ItemLevel` e pelo
   menos um modificador.
2. Classifique todos os modificadores e clique em **Confirmar alvo**.
3. Clique em **Validar craftabilidade**.
4. O painel deve mostrar `Alvo aceito pelas regras suportadas`, a versão
   `0.1.0` e zero conflitos; linhas desconhecidas ou mecânicas não suportadas
   devem exibir os motivos correspondentes.
