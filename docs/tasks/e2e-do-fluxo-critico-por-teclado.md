# E2E do fluxo crítico por teclado

**Status:** Implementado em 2026-09-06  
**PRD:** CA-17  
**Dependências:** [geração e comparação de estratégias](geracao-e-comparacao-de-estrategias.md), [timeout de job de planejamento](timeout-de-job-de-planejamento.md)

## Contexto

O E2E já cobre importação, planejamento e execução em Chromium, além de um
smoke de largura 360 px na home. Ainda falta provar que o fluxo crítico de
`/new` permanece alcançável sem mouse em uma viewport estreita, com foco visível
e estados assíncronos anunciados.

## Objetivo

Adicionar um cenário determinístico de Chromium que percorra seleção de liga,
importação, confirmação, validação e preparação do planejamento por teclado em
360 px, validando ausência de overflow, foco e mensagens `status`/`alert`.

## Requisitos

- Usar apenas fixtures locais já configuradas pelo Playwright; nenhuma rede ou
  conta real.
- Operar controles acionáveis com `focus` + `Enter`/teclas de seleção, sem
  `click` do mouse no fluxo novo.
- Verificar `:focus-visible`/foco do elemento após cada ação relevante e que a
  ordem não cria scroll horizontal acima da viewport.
- Confirmar que estados de sucesso e falha são anunciados por `role=status` ou
  `role=alert`, sem depender apenas de cor ou screenshot.
- Manter o projeto Chromium existente; versões de browser continuam política
  do ambiente e não serão baixadas implicitamente pelo `pnpm validate`.

## Não escopo

- Reescrever componentes já acessíveis ou criar uma suíte completa de leitores
  de tela.
- Instalar Safari/Firefox/Edge no CI ou alterar snapshots existentes sem
  diferença visual comprovada.
- Cobrir todos os caminhos de erro do produto em E2E; testes de componente já
  cobrem esses estados.

## Proposta de solução

1. Criar teste E2E em viewport 360x760 com `reducedMotion: reduce`.
2. Roteá-lo por `/new`, usando `getByRole`/`getByLabel`, `focus`, `press` e
   `fill` para manter a intenção de teclado explícita.
3. Verificar foco visível, status de confirmação/validação/preparação, ausência
   de overflow e retorno ao estado operável.
4. Atualizar docs, ADR e entrega após `pnpm test:e2e` e `pnpm validate`.

## Critérios de aceite

- [x] O fluxo crítico em 360 px termina com pedido preparado usando teclado.
- [x] Foco permanece em controles visíveis e nomes acessíveis são encontrados.
- [x] Não há overflow horizontal e estados assíncronos são anunciados.
- [x] `pnpm test:e2e` e `pnpm validate` ficam verdes.
