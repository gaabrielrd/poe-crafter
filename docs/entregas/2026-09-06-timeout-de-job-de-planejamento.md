# Entrega: timeout de job de planejamento

**Data:** 2026-09-06  
**Plano:** [timeout de job de planejamento](../tasks/timeout-de-job-de-planejamento.md)  
**PRD:** RF-07 / CA-16

## Funcionalidades

- `runPlannerJob` aplica deadline padrão de cinco minutos, com relógio injetável.
- Timeout retorna contrato versionado `failed` com issue `job-timeout`, sem
  estratégias ou contadores de resultado.
- A tela só publica `PlannerPlanVersion` para sucesso; timeout preserva versões
  anteriores e permite nova tentativa.

## Testes e validações

- `packages/planner/src/index.test.ts`: deadline, fases finais e ausência de
  plano parcial.
- `StrategyPlanning.test.tsx`: falha recuperável e preservação da tela.
- `pnpm validate`: aprovado (testes, cobertura, contratos, typecheck, build,
  smoke, arquitetura, documentação e regras Firebase).

## Limites

O planner local verifica o deadline entre fases; cancelamento de processamento
síncrono e timeout de fila persistida ficam para a futura implementação remota.
