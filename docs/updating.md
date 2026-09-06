# Atualização de toolchain e dependências

O PoE Crafting Planner não recebe mais migrações de um template. Git preserva o
histórico anterior, mas `setup`, `update:template` e `.template-state.json` foram
aposentados no marco do monorepo.

## Atualizar dependências

1. Crie uma branch.
2. Leia changelogs de majors e integrações críticas.
3. Atualize o manifesto do workspace consumidor.
4. Gere o lockfile com pnpm.
5. Revise novos scripts transitivos antes de alterar `allowBuilds`.
6. Rode `pnpm validate` e `pnpm test:e2e`.
7. Atualize ADRs e documentação quando o comportamento ou a arquitetura mudar.

Dependências internas usam `workspace:*` e não são publicadas no MVP.

Packages de domínio devem permanecer independentes da web. Ao alterar o
`crafting-engine`, atualize seus testes puros e o consumidor web somente pela
API pública (`@poe-crafter/crafting-engine`); não importe arquivos internos do
package nem mova regras para componentes.

## Atualizar Node ou pnpm

Altere em conjunto:

- `.nvmrc`;
- `engines` da raiz e de Functions;
- `packageManager`;
- runtime em `firebase.json`;
- workflow de CI;
- `pnpm-lock.yaml`;
- README e documentação de build.

Cloud Functions limita runtimes suportados. Não amplie a faixa local sem
confirmar compatibilidade do backend e das dependências resolvidas.

## Atualizar Tailwind ou shadcn/ui

Mantenha `components.json`, aliases e tokens globais coerentes. Componentes
shadcn pertencem ao repositório: revise o diff gerado em vez de substituí-los às
cegas. Confirme `/styleguide`, desktop, 360 px, teclado e reduced motion.

## Atualizar Firebase CLI

Execute a atualização no manifesto raiz. Se surgirem scripts de build
transitivos, não os aprove automaticamente: identifique o pacote, a origem e a
necessidade. Emuladores devem continuar usando `demo-poe-crafter` e regras
deny-all fora dos prefixos owner-only explicitamente autorizados por uma feature.
