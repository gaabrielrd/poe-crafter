# Retomada — Diagnóstico, decisões e rastreabilidade

**Data da análise:** 2026-10-12  
**Base verificada:** `master`, `241c6b0580d3d3a519fc590b454648567a2ac0bb`  
**Status do planejamento:** proposta documentada para revisão; implementação futura não autorizada por esta entrega.

## Objetivo e fontes

Retomar o produto preservando integralmente o [PRD aprovado](../prd.md), seus
RF-01 a RF-15, CA-01 a CA-17 e regras de negócio. O marco inicial prova um craft
real; o piloto continua dependente de todo o MVP amplo aprovado, não de um
recorte permanente de moedas.

Foram lidos [AGENTS.md](../../AGENTS.md), [README](../../README.md),
[arquitetura](../architecture.md), [processo](../development-process.md),
[testes](../testing.md), [styleguide](../styleguide.md), [integrações](../integrations.md),
os 26 documentos históricos de `docs/tasks` (incluindo o índice), os contratos
e os módulos centrais citados abaixo. As skills canônicas ficam em
`skills/`; `.agents/skills` é cópia gerada, não aparece na árvore versionada
inspecionada. Foram consultadas plan-feature e prepare-pull-request; não se usa
document-delivery para declarar funcionalidades entregues por este planejamento.

A análise inicial foi somente leitura. Esta entrega altera apenas documentos
em `docs/tasks`; não executa código de produto, não muda configurações,
permissões, regras implantadas, infraestrutura, cobrança ou deploy. A gravação
dos documentos e o PR draft estão autorizados. Implementação e publicações de
serviços/regras são trabalhos futuros com seus próprios gates.

## Inventário atual: o que existe e o que falta

“Feito” abaixo identifica uma fatia encontrada no código/CI, não aprovação
integral do RF nem prova de funcionamento em produção. “Parcial” indica uma
base reutilizável; “pendente” exige implementação ou evidência nova. Os status
históricos não foram reescritos.

| Capacidade                                  | Estado observado                       | Evidência e limite                                                                                                                                                                                                                                | Continuação                                |
| ------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Monorepo, fronteiras e CI reproduzível      | Feito no repositório                   | [ADR 0039](../decisions/0039-ci-checkout-limpo.md); Validate e Chromium passam no SHA base; auditoria falha                                                                                                                                       | RET-00-02, RET-06-01                       |
| Importação/confirmar/classificar            | Parcial no MVP                         | Parser e confirmação locais; cobertura semântica completa de bases, tiers e influências não comprovada                                                                                                                                            | RET-01-04, RET-04-01                       |
| Auth anônimo/Google, alvo/histórico privado | Feito na fatia de alvo; parcial no MVP | [CraftRecord](../../apps/web/src/features/craft-persistence/model/craft.ts) tem apenas status confirmed; [repositório](../../apps/web/src/features/craft-persistence/services/craft-repository.ts) salva alvo/liga/timestamps, sem planos/eventos | RET-03-03, RET-03-07                       |
| OCR/upload/cota/limpeza                     | Parcial operacionalmente               | Handler e gateways existem; contratos/fixtures não demonstram Vision/Storage/Scheduler implantados nem TTL real                                                                                                                                   | RET-04-02                                  |
| Game data                                   | Pendente                               | [poe-data](../../packages/poe-data/src/index.ts) contém apenas export vazio                                                                                                                                                                       | RET-01-01 a RET-01-03                      |
| Crafting engine                             | Parcial                                | [evaluateCraftability](../../packages/crafting-engine/src/index.ts) valida estrutura, classificação e duas influências; não há transições reais, mod groups/pools completos                                                                       | RET-01-05, Fase 2                          |
| Planner/simulação                           | Parcial/Pendente                       | [planner](../../packages/planner/src/index.ts) filtra 5 receitas; valida shape e flag accepted; probabilidades fixas e fórmula P90 aproximada. Não existe package simulator                                                                       | RET-01-07, RET-01-08, RET-02-08, RET-02-09 |
| Execução/resumo/recálculo                   | Feito localmente; parcial no MVP       | [StrategyPlanning](../../apps/web/src/features/strategy-planning/components/StrategyPlanning.tsx) guarda versões/eventos em useState e usa STARTER_PLANNER_DATASET; reload perde esse estado                                                      | RET-03-06, RET-03-07, RET-04-05            |
| Preços e snapshots                          | Parcial/Pendente                       | [pricing](../../packages/pricing/src/index.ts) normaliza ligas; sem catálogo completo de recursos/snapshots diários reais                                                                                                                         | RET-03-01, RET-03-02                       |
| Jobs remotos                                | Pendente                               | [exports Functions](../../functions/src/index.ts) não incluem worker de planejamento; deadline local só é verificado entre fases                                                                                                                  | RET-03-05                                  |
| Administração                               | Parcial no MVP                         | Diagnóstico, import/validate/publish/reactivate e suporte auditado existem; [ciclo](../../functions/src/api/admin-datasets.ts) valida PlannerDataset starter; planner web não lê ativo administrativo                                             | RET-03-04, RET-05-01, RET-05-06            |
| Controle de custo                           | Parcial                                | Ledger e gate por estimativa existem; não demonstram Billing real nem todas as despesas; proteção no cliente não é fronteira suficiente                                                                                                           | RET-05-04                                  |
| Exclusão/retenção                           | Parcial                                | Job Google existe; [agendamento](../../functions/src/scheduled/process-account-deletions.ts) seleciona pending e apaga docs crafts; subcoleções futuras, failed/stuck e anônimos 30 dias precisam ser tratados                                    | RET-05-03                                  |
| Idioma/acessibilidade                       | Parcial                                | UI atual contém português; PRD exige inglês-only. E2E Chromium/360 px é uma fatia, não matriz completa/WCAG                                                                                                                                       | RET-04-06, RET-06-02                       |
| Deploy/piloto                               | Pendente/bloqueado                     | Regras efetivas e implantação precisam ser verificados/autorizados separadamente                                                                                                                                                                  | RET-00-03, RET-06-03 a RET-06-06           |

## Bloqueios e tarefas de preparação

### RET-00-01 — Consolidar diagnóstico de retomada

- **Status:** Feito nesta análise documental, somente para o inventário acima.
- **Objetivo:** confirmar base, docs e lacunas sem editar produto.
- **Pré-requisitos/dependências:** nenhum; acesso read-only ao repositório.
- **Módulos-alvo:** docs, packages centrais, features import/persistência/planning e Functions.
- **Entregável:** inventário com fontes e planejamento rastreável.
- **Aceite:** SHA confirmado; limitações diferenciadas de entregas locais;
  todos os RF/CA mapeados, histórico preservado, sem tarefa futura marcada feita.
- **Teste/gate:** leitura de árvore/código/docs/CI, revisão de links/IDs/dependências.
- **Risco:** documentação histórica descreve o momento de cada fatia, podendo
  afirmar “implementado” sem representar o estado integrado ou implantado.
- **PRD:** RF-01 a RF-15; CA-01 a CA-17 como inventário, não como aceites cumpridos.

### RET-00-02 — Resolver auditoria sem enfraquecer gates

- **Status:** Pendente; bloqueio conhecido de integração de implementação/piloto.
- **Objetivo:** eliminar vulnerabilidades altas e validar compatibilidade dos consumidores.
- **Pré-requisitos/dependências:** RET-00-01.
- **Módulos-alvo:** dependências/lockfile e toolchain em incremento separado futuro.
- **Entregável:** diagnóstico de cadeias transitivas, patches disponíveis
  verificados no registry e PR próprio com testes.
- **Aceite:** auditoria verde no lockfile instalado; validate/Chromium permanecem
  verdes; nenhum ignore, redução de severidade, skip ou override major forçado
  sem evidência de compatibilidade.
- **Teste/gate:** instalação congelada em checkout limpo; `pnpm validate`,
  `pnpm audit --audit-level=high` e `pnpm test:e2e`; testar os consumidores
  afetados, inclusive Firebase CLI/transporte quando aplicável.
- **Risco:** a correção anunciada pode não estar disponível ou quebrar a faixa
  requerida; revalidar antes de escolher patch/upgrade.
- **PRD:** requisito de qualidade/segurança operacional; gate de todos os CA.

No [run CI de master 38062569727](https://github.com/gaabrielrd/poe-crafter/actions/runs/38062569727),
no SHA base, Validate e E2E passaram; auditoria falhou com **2 altas e 13 moderadas**.
O log identifica `basic-ftp` via `firebase-tools → proxy-agent → pac-proxy-agent → get-uri`
e `braces` via `firebase-tools → chokidar` e consumidores shadcn/micromatch.
Esse resultado remoto foi conferido nesta análise; não é uma auditoria local nova.
A [entrega anterior de CI](../entregas/2026-10-10-ci-reprodutivel.md)
registrou problemas de disponibilidade de braces e da faixa basic-ftp/get-uri.
Essas condições devem ser consultadas novamente na implementação, não assumidas
imutáveis. O PR #11 já foi incorporado em master; os documentos históricos
permanecem como relato de seu momento.

### RET-00-03 — Diagnosticar infraestrutura e preparar revisão de regras

- **Status:** Bloqueado para uso do cliente no ambiente consultado; revisão pendente.
- **Objetivo:** separar regras versionadas das regras efetivamente publicadas
  e definir o pacote seguro de revisão/testes/autorização.
- **Pré-requisitos/dependências:** RET-00-01; acesso read-only ao ambiente
  escolhido autorizado pelo responsável na tarefa específica.
- **Módulos-alvo:** Firestore/Storage/Auth/App Check/Hosting/Functions;
  regras e configuração versionadas como referência.
- **Entregável:** inventário datado de serviços, regras efetivas, projeto alvo
  e diferenças para o repositório, sem valores de credenciais.
- **Aceite:** regras propostas testadas por matriz de acesso; publicações e
  deploy só após aprovação de pacote concreto. **Nunca prolongar test mode.**
- **Teste/gate:** read-only atual do console + Emulator Suite demo para regras
  propostas; diff e plano de rollback para RET-06-04.
- **Risco:** registro no console não comprova implantação de app/APIs nem
  conformidade das regras de produção com o arquivo Git.
- **PRD:** RF-12/RF-14/RF-15; CA-11/CA-13/CA-14/CA-15.

**Evidência externa fornecida na delegação:** consulta somente leitura do
console Firebase em 2026-10-12 às 11:39 UTC encontrou regra global
`request.time < timestamp.date(2026, 10, 6)` expirada, negando o cliente.
O [firestore.rules do repositório](../../firestore.rules) é owner-only em
`crafts/{craftId}`, sem essa expiração; não há prova de que esteja implantado.
Web app registrado; Hosting/App Hosting mostravam Get Started sem implantação
listada; domínio externo não confirmado. Essas observações não foram novamente
consultadas neste executor e devem ser revalidadas em RET-00-03; não se conclui
que todos os ambientes possíveis estejam sem deploy. Nenhuma regra foi alterada.

### Ponto adicional de integração a verificar

O handler administrativo usa `collection('ops/datasets')` e
`collection('ops/auditEvents')`. A forma desses caminhos e de
`ops/jobs` precisa ser conferida com a alternância coleção/documento do SDK
real na migração RET-03-03/RET-05-01. Testes de modelos puros não demonstram
que essas chamadas persistem no Firestore; o gate exige SDK + emulador, sem
tratar o prefixo lógico `ops/*` como garantia de layout válido.

## Decisões aprovadas e propostas técnicas

O PRD não tem decisões de produto em aberto. Permanecem aprovados PoE 1,
itens não únicos/importados em inglês, todo o MVP amplo, domínio determinístico,
Firebase, RePoE, poe.ninja diário/manual, Cloud Vision 1.000/mês, anônimo/Google,
crafts privados, piloto privado e US$10/mês. Sem IA ativa, GGG, offline/PWA,
inventário ou orçamento pessoal, compra/automação do cliente ou compartilhamento.

| ID de proposta | Questão técnica realmente pendente                       | Proposta de trabalho e momento de resolver                                                                                             |
| -------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| PROP-01        | Revisão upstream, licença e atualização compatível       | Fixar e verificar em RET-01-01; manifestar revisão/atribuição/checksum; fonte RePoE já aprovada                                        |
| PROP-02        | Alvo/base/operações do primeiro exemplo real             | Escolher fixture pequena verificável em RET-01-04/RET-01-06; não usar isso como corte do escopo final                                  |
| PROP-03        | Precisão, orçamento de busca e semântica dos rankings    | Medir e documentar seed/tolerância/limites e pesos em RET-01-07/RET-02-08/RET-02-09; objetivos aprovados mantidos                      |
| PROP-04        | Layout durável, schema migration e fronteiras de escrita | Comparar subcoleções/artefatos em RET-03-03; backend autoritativo e eventos imutáveis são requisitos fixos                             |
| PROP-05        | Tamanho de artefato e ligação do dataset ativo           | Separar game data, receita e preços em RET-03-04/RET-05-01; Storage para artefato, metadata transacional; ADR antes de mudar contratos |
| PROP-06        | Região, recursos e valores operacionais atuais           | Verificar disponibilidade/tarifas/quotas e projeção em RET-05-04/RET-06-03; não prometer preços ou teto automático de Billing          |
| PROP-07        | Prova de autorização do caso de suporte                  | Definir mecanismo verificável em RET-05-06; allowlist e justificativa não dispensam autorização exigida pelo PRD                       |
| PROP-08        | Estratégia de validação de browsers/ambientes            | Resolver executáveis/dispositivos em RET-06-02 e projetos separados em RET-06-03; não reduzir plataformas aprovadas                    |

Propostas não são decisões aceitas nem solicitação de implementação nesta entrega.
Decisões técnicas relevantes devem gerar ADR futura; não substituir silenciosamente
ADRs históricas. Responsável/estimativa podem ser atribuídos ao iniciar cada tarefa;
não há calendário prometido, coerente com o PRD.

## Rastreabilidade de requisitos

IDs detalhados estão nos [arquivos das fases](README.md). Toda implementação
futura deve acrescentar o link do teste/relatório e SHA na coluna de evidência
de seu próprio registro de entrega. A tabela abaixo é plano de cobertura,
não prova de aceite.

| RF                                     | Tarefas principais                                     | CA diretamente relacionado |
| -------------------------------------- | ------------------------------------------------------ | -------------------------- |
| RF-01 — Liga                           | RET-03-01, RET-03-02, RET-04-03, RET-04-04             | CA-07, CA-08               |
| RF-02 — Texto                          | RET-01-04, RET-04-01                                   | CA-01                      |
| RF-03 — Screenshot                     | RET-04-02, RET-05-03                                   | CA-02                      |
| RF-04 — Confirmação/classificação      | RET-01-04, RET-04-01                                   | CA-03                      |
| RF-05 — Preferências                   | RET-01-08, RET-02-09, RET-04-03                        | CA-04                      |
| RF-06 — Craftabilidade                 | RET-01-05, RET-01-06, RET-02-01 a RET-02-07, RET-02-10 | CA-04, CA-05               |
| RF-07 — Estratégias/job                | RET-01-07, RET-01-08, RET-02-08, RET-02-09, RET-03-05  | CA-05, CA-06, CA-16        |
| RF-08 — Explicação                     | RET-01-09, RET-04-04                                   | CA-05, CA-08               |
| RF-09 — Execução                       | RET-03-06, RET-03-07, RET-04-05                        | CA-09                      |
| RF-10 — Resumo                         | RET-01-10, RET-03-06, RET-04-05, RET-06-06             | CA-09                      |
| RF-11 — Recálculo                      | RET-03-02, RET-03-07, RET-04-05                        | CA-10                      |
| RF-12 — Persistência/vínculo/histórico | RET-03-03, RET-03-07, RET-05-02, RET-05-03             | CA-11                      |
| RF-13 — Exclusão                       | RET-05-03                                              | CA-12                      |
| RF-14 — Administração/suporte          | RET-03-04, RET-05-01, RET-05-05, RET-05-06             | CA-13, CA-14               |
| RF-15 — Custos                         | RET-03-05, RET-04-02, RET-05-04                        | CA-15                      |

| CA    | Gate/tarefas de prova final                | Tipo de evidência esperado                           |
| ----- | ------------------------------------------ | ---------------------------------------------------- |
| CA-01 | RET-04-01, RET-06-01                       | Texto real→campos para confirmar, limites/erros      |
| CA-02 | RET-04-02, RET-05-03, RET-06-05            | Storage/OCR/parser + exclusão ≤24 h                  |
| CA-03 | RET-04-01, RET-06-01                       | Classificação obrigatória única para todo mod        |
| CA-04 | RET-01-05, RET-02-10, RET-04-03            | Engine rejeita impossível/unsupported sem plano      |
| CA-05 | RET-01-10, RET-02-10, RET-03-08, RET-04-04 | Replay legal de todas as arestas e alvo completo     |
| CA-06 | RET-02-09, RET-04-04                       | Equivalentes/inviáveis omitidos, máximo quatro       |
| CA-07 | RET-03-02, RET-03-08, RET-04-04            | Liga/horário/snapshot presos ao plano                |
| CA-08 | RET-03-02, RET-04-04                       | Falha de provider, antigo/manual/indisponível        |
| CA-09 | RET-03-06, RET-03-08, RET-04-05            | Retry/restart/reload preservam gastos                |
| CA-10 | RET-03-07, RET-03-08, RET-04-05            | Nova versão, antiga/eventos imutáveis                |
| CA-11 | RET-03-07, RET-05-02                       | UID/vínculo/retomada privados sem duplicação         |
| CA-12 | RET-05-03, RET-06-05                       | Revogação + exclusão completa ≤24 h                  |
| CA-13 | RET-05-01, RET-05-02, RET-05-05            | Não admin sem diagnóstico/conteúdo                   |
| CA-14 | RET-05-06, RET-05-07                       | Caso autorizado e auditoria antes da resposta        |
| CA-15 | RET-05-04, RET-05-07, RET-06-05            | OCR pausa antes de jobs; leitura continua            |
| CA-16 | RET-03-05, RET-03-08, RET-06-02            | Deadline de 5 min, sem parcial nem publicação tardia |
| CA-17 | RET-04-06, RET-06-02                       | Teclado/feedback/foco/360 px na matriz aprovada      |

## Validação desta documentação

A entrega deve validar links locais contra a árvore Git, IDs únicos,
dependências existentes/sem ciclos, campos obrigatórios das tarefas, referências
RF/CA válidas e cobertura de RF-01–15/CA-01–17. Usar o verificador
`scripts/check-docs.mjs` do repositório e Prettier nos documentos alterados
quando disponíveis. Revisar diff e confirmar SHA/PR remoto somente com
`docs/tasks/*.md`.

Este executor não conseguiu clonar: proxy local recusou conexão. A análise e a
publicação usam o conector GitHub autorizado, sem criar credenciais.
Não foi executado `pnpm validate` completo local: não há checkout/dependências
instalados nem toolchain patch fixado (Node local 24.21.0 versus 24.19.0 do repo).
CI do PR deve registrar resultado novo; CI base é apenas evidência anterior.
Testes de código novos são desnecessários para esta mudança só documental.
Não declarar produto entregue nem registrar entrega implementada em
`docs/entregas` por publicar este planejamento.

### Resultado dos checks executados nesta entrega

- Prettier 3.9.6, mesma versão do lockfile: os oito arquivos alterados passaram
  em `--check`, com a configuração original do repositório.
- Validador local do plano: 50 IDs únicos, 66 dependências existentes, nenhum
  ciclo, campos completos e RF-01–15/CA-01–17 rastreados.
- `scripts/check-docs.mjs --root inspection`: “Validação da documentação OK.”
  Executado em espelho dos documentos lidos/alterados; existência dos demais
  destinos conferida pela árvore Git do SHA base. Não equivale a validate
  completo de um checkout integral.
- Os verificadores auxiliares, fontes de inspeção e ferramenta de formatação
  ficam apenas no workspace da análise; o commit contém somente os oito
  documentos em `docs/tasks`.
