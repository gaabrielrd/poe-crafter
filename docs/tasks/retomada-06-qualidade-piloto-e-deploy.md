# Fase 6 — Qualidade final, deploy autorizado e piloto privado

**Status:** Planejado; nenhuma implementação realizada nesta entrega.  
**Ordem:** 6 de 6; ver [índice](README.md) e [diagnóstico/rastreabilidade](retomada-00-diagnostico-e-gates.md).

## Objetivo

Validar o MVP inteiro, preparar ambientes e runbooks, obter autorização específica para publicações e conduzir o piloto privado antes de considerar lançamento público.

## Gate da fase

M6 exige M1–M5, todos os RF/CA rastreados, auditoria verde, revisão de regras e aprovação explícita de deploy. A saída do piloto exige 20 jogadores, ao menos 50 crafts concluídos, 80% de avaliações positivas, zero passo ilegal confirmado, 90% dos jobs em 60 s e custo operacional até US$10/mês.

## Regras de execução

As dependências de cada tarefa são pré-requisitos de aceite, não apenas sugestões.
A ordem abaixo é recomendada. “Parcial” significa que existe uma fatia de código
reutilizável; não significa que esta tarefa de fechamento está concluída.
Cada incremento futuro precisa plano aprovado, testes observáveis, gates do
[processo](../development-process.md), diff revisado e evidência com SHA em
`docs/entregas`. Nenhuma tarefa autoriza deploy ou mudança de regras implantadas.

## RET-06-01 — Executar matriz completa de aceite

- **Status:** Pendente.
- **Objetivo:** Comprovar os 17 critérios e todas as famílias no mesmo artefato candidato.
- **Pré-requisitos/dependências:** RET-02-10, RET-03-08, RET-04-06, RET-05-07.
- **Módulos-alvo:** suites web/domínio/Functions; e2e; docs/entregas.
- **Entregáveis:** Matriz RF/CA→teste→resultado→SHA com faults e checklist de riscos.
- **Critérios de aceite:** Nenhum CA fica coberto só por plano escrito; não reutilizar resultados de outro SHA; instalação congelada/validate/audit/E2E verdes; nenhum limite/skip relaxado para passar.
- **Testes/gates:** pnpm install --frozen-lockfile; pnpm validate; pnpm audit --audit-level=high; pnpm test:emulators; pnpm test:e2e.
- **Riscos/mitigação:** Baseline CI verde em dois jobs não equivale a release verde; auditoria continua obrigatória.
- **Rastreabilidade:** RF-01 a RF-15; CA-01 a CA-17.

## RET-06-02 — Medir desempenho e navegadores suportados

- **Status:** Pendente.
- **Objetivo:** Validar comportamento e latência em corpus representativo e matriz aprovada.
- **Pré-requisitos/dependências:** RET-06-01.
- **Módulos-alvo:** planner workers; web bundle; e2e; performance/telemetria.
- **Entregáveis:** Resultados para duas versões recentes Chrome/Edge/Firefox/Safari e Chrome/Safari móveis; métricas p75 e latência do job.
- **Critérios de aceite:** 90% jobs ≤60 s; erro recuperável aos 5 min; p75 LCP ≤2,5 s, INP ≤200 ms, CLS ≤0,1; viewport ≥360 px. Registrar carga/corpus/amostra; não usar fixture trivial como prova de produção.
- **Testes/gates:** Benchmarks de engine/planner, carga limitada, Web Vitals e exploração por teclado/reader; QA de visual baselines inspecionadas.
- **Riscos/mitigação:** Executáveis Safari/dispositivos podem exigir ambiente externo; registrar cobertura ausente como bloqueio.
- **Rastreabilidade:** PRD §10/§11; CA-16/CA-17.

## RET-06-03 — Preparar ambientes e runbook de publicação

- **Status:** Pendente.
- **Objetivo:** Preparar um plano revisável para desenvolvimento/staging/produção separados, com rollback e configuração mínima.
- **Pré-requisitos/dependências:** RET-06-02, RET-00-03.
- **Módulos-alvo:** docs de operação; Firebase Hosting/Functions/Auth/Firestore/Storage/App Check.
- **Entregáveis:** Inventário de projetos/serviços/providers/região, variáveis sem valores secretos, quotas e sequência de deploy por componente.
- **Critérios de aceite:** ID real somente em configuração ignorada; produção sem fixture/demo; domínio externo e Hosting confirmados antes de usar; snapshot de regras vigentes e rollback documentados; custo projetado cabe no orçamento.
- **Testes/gates:** Checklist de configuração, dry-run suportado sem mutação e verificação de artefato/rewrites; smoke definido para staging.
- **Riscos/mitigação:** Não criar credenciais, alterar permissões ou ativar cobrança durante este planejamento.
- **Rastreabilidade:** PRD §8/§10; RF-14/RF-15; CA-13/CA-15.

## RET-06-04 — Aprovar separadamente publicação de regras

- **Status:** Pendente.
- **Objetivo:** Obter revisão e autorização concreta para substituir regras implantadas após testes.
- **Pré-requisitos/dependências:** RET-06-03, RET-05-02.
- **Módulos-alvo:** regras propostas; relatório de emuladores; plano operacional.
- **Entregáveis:** Diff de rules/schema/índices, evidência negativa/positiva, projeto alvo e plano de reversão aprovados.
- **Critérios de aceite:** Responsável autoriza projeto/escopo exatos; nunca prolongar regra global por data/test mode; sem autorização não há publicação de rules.
- **Testes/gates:** Revisão do pacote e comparação read-only entre repository rules e deployed rules no momento da aprovação.
- **Riscos/mitigação:** Autorização para docs/PR não autoriza rules; estado implantado pode mudar depois do diagnóstico.
- **Rastreabilidade:** RF-12/RF-14/RF-15; CA-11/CA-13/CA-14/CA-15.

## RET-06-05 — Publicar staging e produção do piloto

- **Status:** Pendente.
- **Objetivo:** Solicitar autorização específica de deploy e executar release controlado somente após gates.
- **Pré-requisitos/dependências:** RET-06-04.
- **Módulos-alvo:** Firebase Hosting; Functions/tasks/scheduled; rules; configuração de ambiente.
- **Entregáveis:** SHA candidato aprovado, registro por componente/ambiente, smoke em staging e piloto privado, rollback testado.
- **Critérios de aceite:** Autorizações para regras e deploy registradas; smoke comprova Auth/OCR/TTL/queue/retomada/preços/degradação; não tornar público; conferir regras efetivas e hash do bundle publicado.
- **Testes/gates:** CI no SHA, smoke autorizado com dados sintéticos limitados, verificação de negar outros UIDs e rollback.
- **Riscos/mitigação:** Deploy e publicação de regras são ações futuras; ausência de domínio não impede planejar Hosting, mas impede afirmar URL pronta.
- **Rastreabilidade:** PRD §10; RF-13/RF-14/RF-15; CA-02/CA-12/CA-13/CA-15/CA-16.

## RET-06-06 — Conduzir piloto e decidir próximo release

- **Status:** Pendente.
- **Objetivo:** Avaliar utilidade e correção com o piloto privado aprovado, sem prometer prazo.
- **Pré-requisitos/dependências:** RET-06-05.
- **Módulos-alvo:** fluxo de conclusão; coleta privada de feedback; operação; docs/entregas.
- **Entregáveis:** Plano de recrutamento/consentimento, pergunta objetiva de satisfação e relatório de 20 jogadores/50 crafts.
- **Critérios de aceite:** ≥80% avaliações positivas; zero passo ilegal confirmado; 90% jobs ≤60 s; custo ≤US$10/mês; incidente ilegal pausa caminho afetado e gera regressão; lançamento público exige decisão/autorização própria.
- **Testes/gates:** Reprodução de relatos no engine, métricas diárias de custo e semanais de latência; revisão ao atingir 50 crafts.
- **Riscos/mitigação:** Não enviar convites sem autorização de mensagens; amostra e instrumentos devem preservar privacidade.
- **Rastreabilidade:** PRD §12; RF-10/RF-14/RF-15; CA-05/CA-15/CA-16.
