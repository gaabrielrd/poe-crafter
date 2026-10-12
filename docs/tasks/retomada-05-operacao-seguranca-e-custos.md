# Fase 5 — Operação, segurança e limites de custo

**Status:** Planejado; nenhuma implementação realizada nesta entrega.  
**Ordem:** 5 de 6; ver [índice](README.md) e [diagnóstico/rastreabilidade](retomada-00-diagnostico-e-gates.md).

## Objetivo

Integrar o ciclo administrativo existente ao game data real e aos jobs; verificar isolamento, App Check, retenção e orçamento operacional. Planejar mudanças de infraestrutura sem presumir autorização para implantá-las.

## Gate da fase

M5 exige RET-05-01 a RET-05-07, RET-00-02 resolvida e testes negativos de acesso. Nenhuma chamada paga ou publicação de regras/serviços ocorre nesta entrega de planejamento.

## Regras de execução

As dependências de cada tarefa são pré-requisitos de aceite, não apenas sugestões.
A ordem abaixo é recomendada. “Parcial” significa que existe uma fatia de código
reutilizável; não significa que esta tarefa de fechamento está concluída.
Cada incremento futuro precisa plano aprovado, testes observáveis, gates do
[processo](../development-process.md), diff revisado e evidência com SHA em
`docs/entregas`. Nenhuma tarefa autoriza deploy ou mudança de regras implantadas.

## RET-05-01 — Integrar importação/ativação administrativa real

- **Status:** Parcial.
- **Objetivo:** Evoluir ciclo JSON starter para pipeline de artefato de game data completo sem duplicar autoridade.
- **Pré-requisitos/dependências:** RET-03-04, RET-02-10.
- **Módulos-alvo:** admin-operations; functions/api/admin-datasets; poe-data; Storage.
- **Entregáveis:** Importar→normalizar→validar→indexar→testar→publicar/reativar, diagnóstico e auditoria; migração do registro legado.
- **Critérios de aceite:** Ponteiro só muda depois dos gates de engine/dados; publicação transacional, versões referenciadas preservadas; rollback afeta jobs novos; tamanho acima de 20 KB tem caminho backend/Storage adequado.
- **Testes/gates:** Schema inválido, artefato grande, concorrência, fonte falha, rollback e job que conserva versão antiga.
- **Riscos/mitigação:** O schema PlannerDataset atual mistura receita e priceSnapshotId; separar responsabilidades exige ADR técnica, não trocar fonte aprovada.
- **Rastreabilidade:** RF-14; RN-10; CA-13.

## RET-05-02 — Revisar regras, autorização e App Check

- **Status:** Parcial.
- **Objetivo:** Revisar acesso dos schemas novos e proteger endpoints caros sem estender test mode.
- **Pré-requisitos/dependências:** RET-00-03, RET-03-08.
- **Módulos-alvo:** functions/api; firestore.rules; storage.rules; Emulator Suite.
- **Entregáveis:** Matriz ator×ação×recurso, regras propostas, validação de bearer/App Check e payload/rate limits server-side.
- **Critérios de aceite:** Owner-only, ownerUid fixo, deny-all externo; usuário não escreve métricas/versões calculadas nem atualiza/apaga eventos; admin exige Google UID configurado; tokens revogados/deletados são negados; App Check produção bloqueia inválido.
- **Testes/gates:** Emuladores: dono/outro UID/anônimo sem Auth/admin não listado, campos extras, subcoleções, overwrite/delete; contratos App Check e replay.
- **Riscos/mitigação:** Admin SDK ignora rules; a autorização deve ocorrer antes de qualquer acesso. Publicação das regras depende de RET-06-05.
- **Rastreabilidade:** RF-12/RF-14/RF-15; RN-14/RN-15; CA-11/CA-13/CA-14/CA-15.

## RET-05-03 — Fechar retenção e exclusão de dados

- **Status:** Parcial.
- **Objetivo:** Adaptar exclusão às subcoleções/artefatos novos e limpar sessões anônimas inativas.
- **Pré-requisitos/dependências:** RET-05-02.
- **Módulos-alvo:** process-account-deletions; cleanup-screenshots; functions/scheduled; craft-persistence.
- **Entregáveis:** Jobs paginados/idempotentes, política de referências compartilhadas e retry de falha/stuck processing.
- **Critérios de aceite:** Anônimo expira após 30 dias sem atividade; Google até exclusão; acesso revogado de imediato e limpeza até 24 h; remove planos/eventos/jobs do UID sem apagar datasets/snapshots de outros; screenshots ≤24 h.
- **Testes/gates:** Relógio controlado, lote grande, crash/retry, failed→retry, processing preso e subcoleções órfãs.
- **Riscos/mitigação:** Job atual seleciona apenas pending e apaga crafts sem subcoleções; não considerar RF-13 operacionalmente completo por esse código.
- **Rastreabilidade:** RF-03/RF-12/RF-13; RN-13; CA-02/CA-11/CA-12.

## RET-05-04 — Calibrar orçamento com métricas reais

- **Status:** Parcial.
- **Objetivo:** Conectar estimativas do ledger aos custos reais e projeção, preservando prioridade OCR→jobs.
- **Pré-requisitos/dependências:** RET-03-05, RET-04-02.
- **Módulos-alvo:** operational-budget; ocr-quota; functions; admin overview; integrações Billing/Monitoring.
- **Entregáveis:** Inventário de serviços/quotas/preços verificados na implementação, projeção conservadora, alertas e circuit breaker server-side.
- **Critérios de aceite:** Meta US$10/mês mantém limites de compute, leituras/escritas, Storage, tráfego, filas, agendamentos e Vision; reserva idempotente antes do trabalho; histórico continua; falha da medição não libera consumo ilimitado.
- **Testes/gates:** Concorrência e rollover mensal, retry/reserva duplicada, Billing atrasado, limite OCR 1.000 e gate de histórico.
- **Riscos/mitigação:** Alertas Billing não são teto de gasto; tarifas/franquias não verificadas aqui. Definir margem com dados medidos, sem prometer custo externo.
- **Rastreabilidade:** RF-15; CA-15.

## RET-05-05 — Operar filas, preços e falhas observáveis

- **Status:** Parcial.
- **Objetivo:** Substituir diagnóstico de shape por leitura operacional confiável dos serviços reais.
- **Pré-requisitos/dependências:** RET-05-01, RET-05-04.
- **Módulos-alvo:** admin-operations; admin-overview; functions/tasks; logs/metrics.
- **Entregáveis:** Correlação craft/job/versão sem conteúdo sensível, métricas de latência/timeout/queue/idade de snapshot e runbooks.
- **Critérios de aceite:** Falha de import preserva ativo; fila expirada e worker falho visíveis; dashboards diferenciam fixture/dado ausente/falha; logs não guardam texto item/imagem/token.
- **Testes/gates:** Payloads parciais, falha de serviços, limite de falhas recentes e inspeção de logs com conteúdo malicioso.
- **Riscos/mitigação:** Observabilidade pode aumentar custo/exposição; limitar cardinalidade, retenção e acesso.
- **Rastreabilidade:** RF-14/RF-15; CA-13/CA-15/CA-16.

## RET-05-06 — Revalidar suporte administrativo auditado

- **Status:** Parcial.
- **Objetivo:** Aplicar autorização de caso de suporte e leitura das novas versões/eventos sem acesso amplo.
- **Pré-requisitos/dependências:** RET-05-03, RET-05-05.
- **Módulos-alvo:** admin-support; functions/api/admin-support; suporte autorizado.
- **Entregáveis:** Contrato de caso autorizado, auditoria antes da resposta e visualização temporária do craft.
- **Critérios de aceite:** Justificativa/allowlist sozinhas não demonstram consentimento do caso; registrar como autorização é obtida/verificada; sem listagem geral, edição ou conteúdo na auditoria; retenção segue craft.
- **Testes/gates:** Sem caso, não admin, 404, sucesso auditado, falha de auditoria impede resposta e exclusão limpa referências pessoais.
- **Riscos/mitigação:** Escolher mecanismo verificável do caso é decisão técnica pendente; requisito de autorização já está aprovado.
- **Rastreabilidade:** RF-14; RN-15; CA-13/CA-14.

## RET-05-07 — Comprovar operação segura e limitada M5

- **Status:** Pendente.
- **Objetivo:** Revisar invariantes de privacidade e limites sob falha antes de pedir staging/deploy.
- **Pré-requisitos/dependências:** RET-05-06, RET-00-02.
- **Módulos-alvo:** Emulator Suite; contratos; docs/entregas.
- **Entregáveis:** Relatório da matriz de acesso, exclusão/TTL, circuit breaker e runbooks de rollback.
- **Critérios de aceite:** Sem achado bloqueador de acesso; métricas e quotas testadas; auditoria de dependências verde; alterações propostas de regras/infra identificadas para aprovação separada.
- **Testes/gates:** pnpm validate; pnpm test:emulators; testes de endpoints/custo e revisão de segurança do diff.
- **Riscos/mitigação:** Não confundir teste estrutural de rules com enforcement no emulador ou ambiente implantado.
- **Rastreabilidade:** RF-13/RF-14/RF-15; CA-12/CA-13/CA-14/CA-15/CA-16.
