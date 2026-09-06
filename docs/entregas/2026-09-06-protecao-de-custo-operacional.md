# Entrega: proteção de custo operacional

**Data:** 2026-09-06  
**Plano:** [proteção de custo operacional](../tasks/protecao-de-custo-operacional.md)  
**PRD:** RF-15 / CA-15

## Funcionalidades

- Ledger mensal `ops/operationalUsage-{YYYY-MM}` com reserva transacional e
  idempotência por operação/requestId.
- Gate `POST /api/operations/cost-guard` com bearer Firebase e custos
  configuráveis somente no backend.
- OCR bloqueado em 80% do orçamento projetado antes do provider; planejamento
  bloqueado no limite total.
- Estados recuperáveis na geração de estratégias, preservando versões e
  histórico existentes; fixture/local sem API continua determinístico.

## Testes e validações

- `cost-protection.test.ts`: thresholds, prioridade OCR, idempotência e defaults.
- `screenshot-cost.test.ts`: OCR bloqueado não chama Cloud Vision.
- `cost-guard.test.ts`: contrato, bearer e bloqueio HTTP.
- `StrategyPlanning.test.tsx`: job negado não publica estratégias.
- `pnpm validate`: aprovado (testes, cobertura, contratos, typecheck, build,
  smoke, arquitetura, documentação e regras Firebase).

## Limites

Os custos são estimativas configuráveis; Billing/Cloud Monitoring e preços reais
por chamada continuam fora deste incremento. A cota fixa de 1.000 OCRs permanece
como proteção complementar.
