# Timeout de job de planejamento

**Status:** Implementado em 2026-09-06  
**PRD:** RF-07 / CA-16  
**Dependências:** [geração e comparação de estratégias](geracao-e-comparacao-de-estrategias.md), [proteção de custo operacional](protecao-de-custo-operacional.md)

## Contexto

O planner atual publica fases localmente e só cria uma versão depois de receber
um resultado `succeeded`. Ainda não há deadline explícito para um job que fique
em fase intermediária. Em uma futura execução remota, isso poderia deixar jobs
presos e sugerir que um plano parcial é utilizável.

## Objetivo

Definir um limite padrão de cinco minutos para `runPlannerJob`. Ao atingir o
deadline, o job termina em `failed` com issue recuperável de timeout, sem
estratégias e sem permitir que uma atualização tardia publique uma versão.

## Requisitos

- Expor timeout padrão de 300.000 ms no package `planner`, sem depender de
  Firebase, React ou relógio global não injetável.
- Permitir `now()` injetável nos testes e verificar o deadline entre fases e
  antes da geração final; a fase publicada depois do limite deve ser `failed`.
- Retornar contrato completo versionado com `strategies: []`, `omitted` zerado e
  issue code `job-timeout` com mensagem acionável.
- A tela deve mostrar erro recuperável, não criar `PlannerPlanVersion` e manter
  versões/histórico anteriores intactos.
- Um novo clique pode tentar novamente depois do timeout e o gate de custo
  continua sendo consultado antes de iniciar uma nova tentativa.

## Não escopo

- Cancelamento forçado de código síncrono ou de requests externos ainda locais.
- Persistência de jobs, filas, Cloud Tasks ou recuperação após reinício.
- Alterar fórmulas do planner, número de estratégias ou histórico de execução.

## Proposta de solução

1. Acrescentar `PLANNER_JOB_TIMEOUT_MS`, `job-timeout` e opções `timeoutMs/now`
   ao contrato puro do planner.
2. Interromper a progressão de fases quando o relógio ultrapassar o deadline e
   publicar um resultado de falha sem passos.
3. Manter a guarda de publicação da UI: somente resultados `succeeded` criam uma
   versão; falhas exibem alerta e deixam versões existentes selecionáveis.
4. Cobrir timeout com relógio fake, ausência de versão parcial, retry e estados
   observáveis; atualizar docs, ADR e entrega.

## Tarefas sequenciais

- [x] Alterar contrato e implementação do job com deadline injetável.
- [x] Integrar mensagem de timeout e retry na tela.
- [x] Adicionar testes de package e componente.
- [x] Atualizar documentação e registrar evidência.
- [x] Executar `pnpm validate`, revisar diff e confirmar que nenhum plano
      parcial é publicado.

## Critérios de aceite

- [x] Job que ultrapassa 300.000 ms termina como `failed` com `job-timeout`.
- [x] Resultado de timeout não contém estratégias e não cria nova versão.
- [x] Versão/histórico anterior continua acessível e nova tentativa é possível.
- [x] Testes, documentação e `pnpm validate` ficam verdes.
