# ADR-0036: proteção de custo operacional

**Status:** Aceito  
**Data:** 2026-09-06

## Contexto

O piloto tem meta de US$10/mês e duas operações potencialmente pagas: OCR e
jobs de planejamento. A cota de 1.000 OCRs não expressa o orçamento e o
planner atual é local, mas sua futura execução remota precisa de uma fronteira
que não possa ser ignorada pelo navegador.

## Decisão

Manter um ledger mensal privado no Firestore e reservar cada operação em uma
transação idempotente por `operation:requestId`. O orçamento e custos unitários
são lidos somente nas Functions, com defaults de US$10, US$0,01 por OCR e
US$0,10 por planejamento. OCR é degradado primeiro em 80% do orçamento; jobs
de planejamento são degradados no limite total.

O OCR chama o serviço antes do Cloud Vision. O planner chama
`POST /api/operations/cost-guard` antes de iniciar; em fixture/local sem API o
job continua determinístico. Bloqueios são erros recuperáveis e não removem
histórico nem versões já publicadas.

## Alternativas rejeitadas

- Confiar em uma variável `VITE_*`: o usuário poderia adulterar o limite.
- Usar somente a cota fixa de OCR: não protege planejamento nem permite custos
  unitários ajustáveis.
- Bloquear todas as operações no primeiro alerta: viola a ordem de degradação
  do RF-15, que prioriza pausar OCR antes de jobs.
