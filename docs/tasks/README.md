# Tarefas e planejamento

Esta pasta guarda o planejamento de funcionalidades e tarefas. Cada arquivo descreve uma demanda antes de ela virar código: o que será feito, por quê e como saber que ficou pronta.

Isso ajuda você e os agentes a manterem o foco e o escopo controlado.

## Como usar

- Crie um arquivo por funcionalidade ou tarefa (ex.: `cadastro-de-clientes.md`).
- Preencha o modelo abaixo antes de começar a implementação.
- Atualize o arquivo se o entendimento mudar durante o trabalho.

## Modelo de arquivo de tarefa

```markdown
# Título da tarefa

## Contexto

Por que isso é necessário e para quem.

## Objetivo

O que se quer alcançar, em uma ou duas frases.

## Escopo

O que faz parte desta tarefa.

## Não escopo

O que fica de fora (para não crescer sem controle).

## Critérios de aceite

- [ ] Condição objetiva 1
- [ ] Condição objetiva 2

## Tarefas

- [ ] Passo 1
- [ ] Passo 2

## Riscos

Dúvidas, dependências ou pontos que podem dar problema.
```

## Retomada do MVP — 2026-10-12

Este índice mantém o modelo e os planos históricos acima. O planejamento de
retomada complementa esses incrementos e descreve o que falta para entregar o
[PRD aprovado](../prd.md). Não altera decisões aprovadas nem comprova
funcionalidades pela simples existência de um documento.

### Leitura e ordem recomendadas

Comece pelo [diagnóstico, bloqueios e rastreabilidade](retomada-00-diagnostico-e-gates.md).
As 50 tarefas RET (3 de preparação + 47 das fases) têm IDs estáveis, status,
pré-requisitos, módulos, entregáveis, critérios, testes/gates e riscos.
Preserve IDs em refinamentos; subdivisões podem usar sufixo e manter o ID pai.
Só marque uma tarefa concluída com evidência e gates aplicáveis no mesmo SHA.

| Ordem | Fase/arquivo                                                                                             | IDs                   | Marco de saída                            |
| ----- | -------------------------------------------------------------------------------------------------------- | --------------------- | ----------------------------------------- |
| 0     | [Diagnóstico e gates](retomada-00-diagnostico-e-gates.md)                                                | RET-00-01 a RET-00-03 | Base identificada, bloqueios explicitados |
| 1     | [Fase 1 — Primeiro craft real validado](retomada-01-primeiro-craft-real.md)                              | RET-01-01 a RET-01-10 | M1 — Primeiro craft real validado         |
| 2     | [Fase 2 — Cobertura completa do MVP e planejamento](retomada-02-cobertura-e-planejamento.md)             | RET-02-01 a RET-02-10 | M2 — Núcleo cobre todo MVP                |
| 3     | [Fase 3 — Preços, jobs e retomada durável](retomada-03-precos-jobs-e-persistencia.md)                    | RET-03-01 a RET-03-08 | M3 — Jobs/planos/eventos retomáveis       |
| 4     | [Fase 4 — Importação e experiência completa](retomada-04-importacao-e-experiencia.md)                    | RET-04-01 a RET-04-06 | M4 — Jornada completa inglês/acessível    |
| 5     | [Fase 5 — Operação, segurança e limites de custo](retomada-05-operacao-seguranca-e-custos.md)            | RET-05-01 a RET-05-07 | M5 — Operação segura e limitada           |
| 6     | [Fase 6 — Qualidade final, deploy autorizado e piloto privado](retomada-06-qualidade-piloto-e-deploy.md) | RET-06-01 a RET-06-06 | M6 — Release autorizado e piloto privado  |

M1 é uma prova técnica local/emulada com dados reais versionados; não é um MVP
reduzido nem autorização para abrir piloto. M2 completa as sete famílias aprovadas.
Preços (RET-03-01/RET-03-02) podem avançar após os dados da Fase 1; a integração
backend/persistência pode ser exercitada com M1 enquanto M2 cresce. As demais
fases seguem as dependências explícitas; testes e observabilidade acompanham
cada incremento, não ficam adiados ao final. Resolver RET-00-02 pode ocorrer
em trabalho separado desde o diagnóstico, sem modificar este PR documental.

Não há prazo prometido. A passagem entre marcos depende das provas de aceite.
Para o piloto, todos M1–M5 e RET-06-01 a RET-06-05 são obrigatórios: auditoria
verde, regras revisadas/testadas, autorização de publicação separada e deploy
aprovado. RET-06-06 mede os critérios de sucesso antes de considerar o público.

### Convenção de status

- **Feito:** somente a fatia comprovada pela evidência indicada; não equivale ao RF inteiro.
- **Parcial:** implementação reutilizável existe, mas faltam integração ou provas do MVP.
- **Pendente:** implementação/evidência ainda necessária.
- **Bloqueado:** impedimento explícito; registrar causa, responsável e condição de desbloqueio.

O diagnóstico diferencia resultados de código/CI de observações do ambiente
implantado. Planos antigos continuam com seu status original e suas limitações,
sem fechar tarefas retroativamente.

### Índice histórico preservado

Os documentos abaixo registram o contexto do incremento original. RF-14A/B/C
históricos são subdivisões de RF-14; não são novos requisitos do PRD. O estado
integrado atual e as lacunas estão no diagnóstico da retomada.

- [CI reproduzível em checkout limpo](2026-10-10-ci-reprodutivel.md)
- [Ações administrativas de dataset](acoes-administrativas-de-dataset.md)
- [Ciclo administrativo de dataset](ciclo-administrativo-de-dataset.md)
- [Configuração versionada de planejamento](configuracao-versionada-de-planejamento.md)
- [Confirmação e classificação de modificadores](confirmacao-e-classificacao-de-modificadores.md)
- [Contrato e validação determinística de craftabilidade](contrato-e-validacao-de-craftabilidade.md)
- [E2E do fluxo crítico por teclado](e2e-do-fluxo-critico-por-teclado.md)
- [Escolha de liga PC ativa](escolha-de-liga-pc.md)
- [Evolução de segurança, arquitetura e confiabilidade do template](evolucao-do-template.md)
- [Exclusão de conta e dados](exclusao-de-conta-e-dados.md)
- [Execução append-only local](execucao-append-only-local.md)
- [Explicação de estratégia](explicacao-de-estrategia.md)
- [Geração e comparação de estratégias](geracao-e-comparacao-de-estrategias.md)
- [Importação de item por texto](importacao-de-item-por-texto.md)
- [Importação de screenshot com OCR](importacao-de-screenshot-com-ocr.md)
- [Migração estrutural para o monorepo do produto](migracao-estrutural-para-monorepo.md)
- [Painel administrativo e diagnóstico operacional](painel-administrativo-e-diagnostico.md)
- [Persistência privada e histórico de crafts](persistencia-privada-e-historico-de-crafts.md)
- [Proteção de custo operacional](protecao-de-custo-operacional.md)
- [Recalcular sem apagar o histórico](recalculo-sem-perder-historico.md)
- [Resumo estimado versus real](resumo-estimado-versus-real.md)
- [Sessão anônima e login Google](sessao-anonima-e-login-google.md)
- [Suporte administrativo auditado](suporte-administrativo-auditado.md)
- [Timeout de job de planejamento](timeout-de-job-de-planejamento.md)
- [Upload privado e TTL de screenshot](upload-privado-e-ttl-de-screenshot.md)
