# ADR 0015: monorepo pnpm com Node 22

## Status

Aceita em 2026-09-05.

## Contexto

O produto precisa separar a aplicação web, o limite de Functions e pacotes que
serão compartilhados entre runtimes. O repositório anterior era uma aplicação
única gerenciada por npm e ainda carregava automações de atualização de
template.

## Decisão

Adotar um monorepo nativo do pnpm, sem orquestrador adicional:

- pnpm 11.19.0 fixado em `packageManager`;
- Node 22.22.2 fixado em `.nvmrc` e aceito pelo intervalo
  `>=22.22.2 <23`;
- `apps/web`, `functions`, `packages/shared-types` e `packages/poe-data` como
  workspaces;
- lockfile compartilhado, referências locais pelo protocolo `workspace:` e
  ciclos entre workspaces proibidos;
- builds de dependências nativas permitidos somente para `protobufjs` e `re2`,
  exigidos pelo Firebase CLI;
- scripts da raiz como interface única para desenvolvimento e validação.

O verificador de toolchain rejeita pnpm diferente do declarado e Node diferente
da versão de `.nvmrc`. O ciclo de setup/update do template deixa de existir.

## Consequências

- Cada runtime declara suas próprias dependências.
- `pnpm install --frozen-lockfile` reproduz a árvore validada.
- O repositório ganha limites verificáveis sem introduzir Turborepo ou Nx.
- Atualizar Node ou pnpm exige alterar manifesto, lockfile, CI e documentação no
  mesmo incremento.
