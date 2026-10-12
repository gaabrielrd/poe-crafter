# Fase 3 — Preços, jobs e retomada durável

**Status:** Planejado; nenhuma implementação realizada nesta entrega.  
**Ordem:** 3 de 6; ver [índice](README.md) e [diagnóstico/rastreabilidade](retomada-00-diagnostico-e-gates.md).

## Objetivo

Fazer o backend capturar dados e preços imutáveis, executar jobs idempotentes e preservar planos e execução após reload. Os contratos não dependem de componentes React nem de schemas externos.

## Gate da fase

M3 exige RET-03-01 a RET-03-08 em emuladores: geração e recálculo duráveis, reenvio sem duplicação, retomada após refresh e custo histórico fixo. O gate pode ser exercitado primeiro com o caminho M1; a cobertura completa de M2 continua obrigatória para o piloto.

## Regras de execução

As dependências de cada tarefa são pré-requisitos de aceite, não apenas sugestões.
A ordem abaixo é recomendada. “Parcial” significa que existe uma fatia de código
reutilizável; não significa que esta tarefa de fechamento está concluída.
Cada incremento futuro precisa plano aprovado, testes observáveis, gates do
[processo](../development-process.md), diff revisado e evidência com SHA em
`docs/entregas`. Nenhuma tarefa autoriza deploy ou mudança de regras implantadas.

## RET-03-01 — Normalizar recursos e preços em chaos

- **Status:** Parcial.
- **Objetivo:** Evoluir do catálogo de ligas para preços por recurso sem chamar provider durante busca.
- **Pré-requisitos/dependências:** RET-01-03.
- **Módulos-alvo:** packages/pricing; shared-types; functions/services.
- **Entregáveis:** Adaptador poe.ninja, IDs estáveis, câmbio, data/origem e validação de override manual.
- **Critérios de aceite:** Verificar endpoint/termos atuais na implementação; liga PC explícita; recurso desconhecido/sem preço é null/indisponível, nunca zero; override possui proveniência.
- **Testes/gates:** Payload válido/alterado, liga divergente, câmbio ausente, valor negativo/NaN e aliases ambíguos.
- **Riscos/mitigação:** Não afirmar cotação externa atual nem custo de operação sem verificação.
- **Rastreabilidade:** RF-01/RF-05/RF-08; CA-07/CA-08.

## RET-03-02 — Publicar snapshots diários imutáveis

- **Status:** Pendente.
- **Objetivo:** Capturar uma cotação diária validada antes de trocar o ponteiro ativo.
- **Pré-requisitos/dependências:** RET-03-01.
- **Módulos-alvo:** functions/scheduled; pricing; Storage/Firestore (a planejar).
- **Entregáveis:** Job idempotente, manifesto/checksum, retenção de snapshots referenciados e último snapshot válido.
- **Critérios de aceite:** Falha preserva último snapshot e horário visível; sem snapshot, regras e overrides funcionam com automático indisponível; não há update silencioso em plano antigo.
- **Testes/gates:** Provider indisponível/parcial, retry, duas execuções concorrentes e referência histórica preservada.
- **Riscos/mitigação:** Liga encerrada e recurso ausente precisam de política explícita sem criar preços fictícios.
- **Rastreabilidade:** RF-01/RF-11/RF-14; RN-04/RN-05/RN-11/RN-12; CA-07/CA-08/CA-10.

## RET-03-03 — Definir schemas duráveis e migração

- **Status:** Parcial.
- **Objetivo:** Evoluir CraftRecord confirmed-only para revisão do alvo, pedidos, jobs, planos, execução e resumo.
- **Pré-requisitos/dependências:** RET-01-08, RET-03-02.
- **Módulos-alvo:** shared-types; features/craft-persistence; functions; firestore.rules (mudança futura).
- **Entregáveis:** Schemas versionados, modelo de propriedade/autoria, migração de registros v1 e desenho de índices/limites.
- **Critérios de aceite:** Planos guardam liga/engine/game data/snapshot/request; subcoleções e dados calculados têm autoridade de backend; custos e eventos publicados não são editáveis pelo cliente.
- **Testes/gates:** Roundtrip, migração v1, documento grande, schema desconhecido, invariantes de imutabilidade e construção/leitura/escrita dos caminhos com SDK real no emulador.
- **Riscos/mitigação:** Não salvar todos os eventos em um único documento; regras atuais não autorizam as futuras subcoleções.
- **Rastreabilidade:** RF-09/RF-10/RF-11/RF-12; RN-04/RN-05/RN-06/RN-08; CA-09/CA-10/CA-11.

## RET-03-04 — Capturar o dataset ativo no backend

- **Status:** Pendente.
- **Objetivo:** Conectar ops/activeDataset a game data validado real e capturar versão no início do job.
- **Pré-requisitos/dependências:** RET-03-03, RET-01-03.
- **Módulos-alvo:** functions/services; poe-data; planner; admin-datasets.
- **Entregáveis:** Resolver/carregador server-side, checksum/manifesto e registro das versões capturadas.
- **Critérios de aceite:** Ativação concorrente não muda job em curso; rollback só afeta jobs novos; falta/corrupção impede resultado sem fallback starter; separar game data de preço embutido em PlannerDataset.
- **Testes/gates:** Troca do ponteiro durante job, snapshot divergente, checksum errado e cache por versão.
- **Riscos/mitigação:** Validação atual de recipes só verifica shape; não prova legalidade nem substitui engine.
- **Rastreabilidade:** RF-06/RF-07/RF-14; RN-04/RN-05/RN-10; CA-05/CA-07/CA-10.

## RET-03-05 — Executar jobs idempotentes em fila

- **Status:** Pendente.
- **Objetivo:** Mover runPlannerJob da tela para worker autenticado com processamento limitado e persistido.
- **Pré-requisitos/dependências:** RET-03-04.
- **Módulos-alvo:** functions/api; functions/tasks (primeiro consumidor); planner; cost guard.
- **Entregáveis:** Endpoint, fila/task handler, requestId estável, estados queued/validating/searching/simulating/saving/terminal e controle de lease.
- **Critérios de aceite:** Dono autorizado; gate de custo no servidor antes de enfileirar; deadline cinco minutos inclusive busca bloqueante; retry/crash não publica plano duplicado; timeout nunca deixa parcial.
- **Testes/gates:** Redelivery, crash entre compute/save, lease expirado, job duplo, timeout e worker tardio; emuladores/adaptadores de fila.
- **Riscos/mitigação:** Timeout entre Promise.resolve atual não interrompe cálculo síncrono; job remoto precisa limite real de trabalho.
- **Rastreabilidade:** RF-07/RF-15; CA-05/CA-15/CA-16.

## RET-03-06 — Salvar planos e eventos com autoridade

- **Status:** Pendente.
- **Objetivo:** Publicar o plano só após validação final e acrescentar execução de modo idempotente.
- **Pré-requisitos/dependências:** RET-03-05.
- **Módulos-alvo:** functions; craft-persistence; strategy-planning repositories; domínio de execução.
- **Entregáveis:** Transações de publicação, append de eventos, revision/sequence, agregados e confirmação de salvamento.
- **Critérios de aceite:** IDs de evento evitam gasto duplicado; cliente não altera preço/probabilidade/versionamento calculado; moedas originais e taxa de chaos do momento preservadas; null não vira zero.
- **Testes/gates:** Concorrência de abas, retry, replay, falha de commit, evento inválido e mudança posterior do câmbio.
- **Riscos/mitigação:** Agregado/cache não é fonte da verdade; manter reconstrução por eventos.
- **Rastreabilidade:** RF-09/RF-10/RF-11/RF-12; RN-03/RN-06/RN-08; CA-05/CA-09/CA-10.

## RET-03-07 — Retomar e recalcular sem perda

- **Status:** Parcial.
- **Objetivo:** Substituir planos/eventos efêmeros por leitura durável e recálculo com nova versão.
- **Pré-requisitos/dependências:** RET-03-06.
- **Módulos-alvo:** craft-persistence; strategy-planning; identity.
- **Entregáveis:** Repositórios públicos, retomada após refresh e escolha entre versão antiga/nova, histórico por updatedAt.
- **Critérios de aceite:** Refresh preserva job/plano/eventos/resumo; vínculo Google preserva UID sem duplicação; novo plano não altera anteriores; falha mantém edição na página marcada não persistida.
- **Testes/gates:** E2E com emulador: gerar, registrar retry/restart, reload, vincular, recalcular, continuar versão anterior; concorrência de seleção.
- **Riscos/mitigação:** Fixture Map em memória não prova reload durável; não prometer modo offline.
- **Rastreabilidade:** RF-09/RF-10/RF-11/RF-12; CA-09/CA-10/CA-11.

## RET-03-08 — Verificar integração durável M3

- **Status:** Pendente.
- **Objetivo:** Provar cadeia completo do M1 com backend/dados/preços duráveis e faults.
- **Pré-requisitos/dependências:** RET-03-07.
- **Módulos-alvo:** Emulator Suite; e2e; docs/entregas.
- **Entregáveis:** Relatório M3, fixtures de provider/fila e contratos de emulador.
- **Critérios de aceite:** Sem Vision pago nem Firebase real na suíte; publicação atômica e retomada demonstradas; índice/query e isolamento funcionam com registros reais do emulador.
- **Testes/gates:** pnpm validate; pnpm test:emulators; pnpm test:e2e; falhas de provider, rede e worker.
- **Riscos/mitigação:** Recursos de fila/scheduler não emulados precisam de adaptador/teste de contrato e smoke futuro em staging autorizado.
- **Rastreabilidade:** RF-01/RF-07/RF-09/RF-10/RF-11/RF-12; CA-07/CA-08/CA-09/CA-10/CA-11/CA-16.
