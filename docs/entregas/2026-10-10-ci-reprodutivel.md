# Correções do CI em checkout limpo

- **Data**: 2026-10-10
- **Branch**: `codex/fix-clean-workspace-ci`
- **Plano**: [CI reproduzível](../tasks/2026-10-10-ci-reprodutivel.md)
- **Estado**: PR em revisão; integração bloqueada pela auditoria de dependências.

## Objetivo e alterações

Restaurar validação reproduzível sem outputs locais, sem enfraquecer lint,
cobertura, auditoria ou screenshots. Os packages agora são compilados antes dos
consumidores e o E2E constrói a árvore de dependências da web.

Node 24.19.0, engine estrito e pnpm 11.19.0 ficam alinhados. As atualizações
propostas nos PRs 5–10 são consolidadas, incluindo Vitest e coverage-v8 juntos.
O lockfile também recebe patches transitivos de segurança compatíveis.

Os testes usam a entrada tipada jest-dom/vitest, configuração Firebase demo
explícita e relógio controlado para a exclusão de conta. Nenhuma assertion foi
removida e não houve alteração de comportamento do produto.

## Evidência comprovada

O [run 38060305474](https://github.com/gaabrielrd/poe-crafter/actions/runs/38060305474)
validou o commit `36910ad48927ff896f031401058c8fc9554d9e4d` em checkout limpo:

- instalação congelada e toolchain: passaram;
- Validate: passou, incluindo lint, tipos, cobertura, contratos, Functions,
  build e smoke HTTP;
- web: 23 arquivos, 106 testes passaram;
- contratos: 53 passaram; Functions: 18 passaram;
- cobertura: statements 88,33%, branches 81,74%, functions 91,37%, lines 91,34%;
- E2E: 10 passaram, 6 testes visuais foram pulados pela regra preexistente de
  ausência de baseline Linux; nenhum skip ou limite visual foi alterado;
- auditoria: falhou com 3 altas, 13 moderadas e 1 baixa, sem críticas. A primeira
  auditoria local tinha 19 altas e 1 crítica.

O Chromium local retornou um ZIP inválido; por isso a evidência de navegador
acima vem do CI remoto. A publicação inicial usou o conector GitHub enquanto a
compilação nativa opcional de re2 continuava localmente; não representa aprovação
por hooks de um commit local.

## Transporte Firestore

O Firebase fixa gRPC em uma linha vulnerável. O override é restrito à aresta
`@firebase/firestore` → `@grpc/grpc-js` 1.13.6; não troca o transporte de outros
consumidores. `scripts/firestore-transport.test.mjs` verifica o SDK real com
BatchGetDocuments e Commit num servidor loopback e projeto demo. O mesmo teste
passou na versão anterior como baseline. Ele faz parte de `test:contracts` e
será repetido pelo CI a cada revisão, inclusive na atualização do override.

## Bloqueios preservados

A auditoria continua obrigatória. `braces` 3.0.4, apontado como correção pelo
registry, ainda retorna 404. `get-uri` 6.0.5 restringe `basic-ftp` à linha 5,
enquanto a correção indicada está em 6.2.1; não foi imposto um major fora dessa
faixa sem prova de compatibilidade. O PR permanece draft enquanto houver
qualquer check obrigatório vermelho.

Os PRs substituídos permanecem abertos até a correção estar validada e integrada.
Não houve merge, deploy, alteração de permissões ou de regras Firebase.
