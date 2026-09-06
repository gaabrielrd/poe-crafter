# ADR-0038: E2E do fluxo crítico por teclado em 360 px

**Status:** Aceito  
**Data:** 2026-09-06

## Contexto

CA-17 exige que o caminho crítico permaneça operável em viewport estreita,
usando teclado, foco visível e feedback anunciado. O smoke existente cobria
somente a home em 360 px e o fluxo de `/new` era validado predominantemente
com cliques.

## Decisão

Adicionar ao projeto Chromium um cenário Playwright em 360x760 com reduced
motion que seleciona a liga, preenche o item e aciona interpretação,
classificação, confirmação, validação e preparação por `focus` e `Enter`/teclas
de seleção. O cenário verifica `:focus-visible`, `role=status`/`role=alert` e
ausência de overflow horizontal. O servidor continua fixture local e o gate
`pnpm validate` não baixa browsers.

## Consequência

O teste cobre a rota crítica sem prometer matriz completa de browsers; Chrome,
Edge, Firefox e Safari continuam a política de suporte descrita no PRD e podem
ser adicionados quando o ambiente fornecer esses executáveis.
