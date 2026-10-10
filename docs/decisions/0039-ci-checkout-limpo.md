# ADR 0039: toolchain e builds reproduzíveis

## Status

Aceita em 2026-10-10. Substitui a versão patch fixada na
[ADR 0018](0018-node-24-runtime.md); mantém Node 24 e pnpm 11.19.0.

## Contexto

Os exports públicos dos packages apontam para `dist`, ignorado pelo Git.
Lint tipado, typecheck, testes web e Vite precisam desses arquivos; executar
os consumidores antes do build falha em checkout limpo. jsdom 30 também exige
Node 24.15.0 ou mais recente na linha 24.

## Decisão

- Fixar Node 24.19.0 em `.nvmrc` e no piso de engines, mantendo `engineStrict`.
- Compilar os packages em ordem topológica antes dos consumidores locais.
- Construir o grafo completo da web no E2E, sem depender do job Validate.
- Atualizar Vitest e coverage-v8 em conjunto pelo Dependabot.
- Preservar lint, auditoria, cobertura e snapshots como gates obrigatórios.

## Consequências

Os comandos podem repetir builds rápidos dos packages para priorizar correção
em execução isolada. Não há novo orquestrador, mudança de major do runtime,
permissão ou deploy. As evidências históricas continuam descrevendo suas versões.
