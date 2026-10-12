# Fase 4 — Importação e experiência completa

**Status:** Planejado; nenhuma implementação realizada nesta entrega.  
**Ordem:** 4 de 6; ver [índice](README.md) e [diagnóstico/rastreabilidade](retomada-00-diagnostico-e-gates.md).

## Objetivo

Conectar a interface existente ao domínio e à persistência reais, fechar parser/OCR e preservar escolhas do jogador. A documentação é em português; a interface final permanece somente em inglês conforme o PRD.

## Gate da fase

M4 exige RET-04-01 a RET-04-06: jornada texto e imagem até conclusão e recálculo, com falhas recuperáveis, estados de permissão, navegador/teclado/360 px e nenhuma informação enganosa sobre salvamento ou disponibilidade.

## Regras de execução

As dependências de cada tarefa são pré-requisitos de aceite, não apenas sugestões.
A ordem abaixo é recomendada. “Parcial” significa que existe uma fatia de código
reutilizável; não significa que esta tarefa de fechamento está concluída.
Cada incremento futuro precisa plano aprovado, testes observáveis, gates do
[processo](../development-process.md), diff revisado e evidência com SHA em
`docs/entregas`. Nenhuma tarefa autoriza deploy ou mudança de regras implantadas.

## RET-04-01 — Completar parser e confirmação semântica

- **Status:** Parcial.
- **Objetivo:** Ampliar o parser além dos exemplos existentes e validar entrada no servidor pelo mesmo contrato.
- **Pré-requisitos/dependências:** RET-02-07, RET-03-03.
- **Módulos-alvo:** features/item-import; functions/api (parsing futuro); poe-data.
- **Entregáveis:** Corpus de itens ingleses não únicos, revisão corrigível e resolução por gameDataVersion.
- **Critérios de aceite:** Limite 20 KB, item único, base identificável, item level solicitado quando ausente; implicit/explicit/influência/propriedade/tier reconhecível exibidos; linha desconhecida não desaparece; Required/Optional/Ignore únicos.
- **Testes/gates:** Fixtures de classes/propriedades do MVP, texto vazio/múltiplo/limite, correção que perde metadados e tier incompatível.
- **Riscos/mitigação:** Não aceitar unique ou idioma diferente silenciosamente; correção humana não dispensa legalidade.
- **Rastreabilidade:** RF-02/RF-04/RF-06; CA-01/CA-03/CA-04.

## RET-04-02 — Validar OCR, Storage e limpeza ponta a ponta

- **Status:** Parcial.
- **Objetivo:** Reaproveitar gateways/handlers e demonstrar suas garantias com integração, não apenas fixtures de UI.
- **Pré-requisitos/dependências:** RET-04-01.
- **Módulos-alvo:** screenshot-import; identity; functions/api/screenshot-ocr; cleanup-screenshots; quota.
- **Entregáveis:** Fluxo autenticado upload→Vision adapter→parser→confirmação, limites e limpeza independente.
- **Critérios de aceite:** PNG/JPEG/WebP ≤8 MB; assinatura/MIME/tamanho reais verificados; caminho do UID; cota transacional de 1.000 OCR/mês; limpeza em até 24 h inclusive órfãos/erro; texto disponível quando OCR bloqueado.
- **Testes/gates:** Auth/Storage Emulator, quota concorrente, redelivery, falha de remoção, objeto expirado; Vision fixture sem chamada paga.
- **Riscos/mitigação:** O emulador não prova cobrança/Scheduler real; smoke de serviço exige staging e autorização própria.
- **Rastreabilidade:** RF-03/RF-15; CA-02/CA-15.

## RET-04-03 — Conectar preferências e progresso ao job real

- **Status:** Parcial.
- **Objetivo:** Usar catálogo de capacidades e job persistido sem executar planner autoritativo no browser.
- **Pré-requisitos/dependências:** RET-04-02, RET-03-08, RET-02-09.
- **Módulos-alvo:** planning-configuration; strategy-planning services; rotas.
- **Entregáveis:** Formulário/revisão versionados, progresso saving e retry recuperável vinculado ao job.
- **Critérios de aceite:** Liga ou modo manual explícitos; excluir todas as mecânicas aplicáveis bloqueia pedido; sem inventário/orçamento do jogador; refresh reabre job; status não anuncia resultado antes de salvar.
- **Testes/gates:** Componentes e E2E com timeout, job negado, exclusão de última mecânica, erro de rede e recuperação.
- **Riscos/mitigação:** Retries devem reutilizar requestId quando representam a mesma solicitação, sem dupla reserva/custo.
- **Rastreabilidade:** RF-01/RF-05/RF-07; CA-04/CA-08/CA-16/CA-17.

## RET-04-04 — Entregar comparação e explicação reais

- **Status:** Parcial.
- **Objetivo:** Apresentar de uma a quatro alternativas com métricas e estados verificáveis.
- **Pré-requisitos/dependências:** RET-04-03.
- **Módulos-alvo:** strategy-planning; pricing adapters; rotas.
- **Entregáveis:** Comparação de custo esperado/P90/risco/Optional, base inicial e explicação de cada ramo/checkpoint.
- **Critérios de aceite:** Versões, liga e horário de preço visíveis; custo ausente é indisponível; passos/retry/restart vêm do plano validado; zero alternativas mostra falha útil; não exibe receita parcial.
- **Testes/gates:** Casos menos de quatro, empate, sem preço, snapshot antigo e navegação por teclado.
- **Riscos/mitigação:** Frases versionadas de fixture não substituem representação real dos estados.
- **Rastreabilidade:** RF-07/RF-08; CA-05/CA-06/CA-07/CA-08/CA-17.

## RET-04-05 — Fechar execução, resumo e recálculo

- **Status:** Parcial.
- **Objetivo:** Consumir eventos persistidos e dar controle explícito sobre resultado e versão.
- **Pré-requisitos/dependências:** RET-04-04.
- **Módulos-alvo:** strategy-planning; craft-persistence; /craft/:craftId/summary.
- **Entregáveis:** Passo atual, recursos gastos, retry/restart/skipped permitido, resumo terminal e rota retomável.
- **Critérios de aceite:** Gastos anteriores intactos; confirma persistência só após resposta; snapshot histórico preservado; recálculo exige escolha; terminal real corresponde ao plano e não apenas ao índice da lista.
- **Testes/gates:** Registro repetido, perda de conexão, reload no meio, troca de versão e resumo parcialmente sem preço.
- **Riscos/mitigação:** Manter edição não enviada na página; não adicionar offline/PWA ou automação do cliente.
- **Rastreabilidade:** RF-09/RF-10/RF-11/RF-12; CA-09/CA-10/CA-11/CA-17.

## RET-04-06 — Aplicar idioma e acessibilidade do MVP

- **Status:** Parcial.
- **Objetivo:** Fechar interface somente em inglês, responsiva e WCAG 2.2 AA em todas as jornadas.
- **Pré-requisitos/dependências:** RET-04-05.
- **Módulos-alvo:** features web; shared/ui; rotas; e2e; docs/styleguide.
- **Entregáveis:** Inventário de copy/estados, teclado/leitor de tela/foco/contraste e revisão em desktop e 360 px.
- **Critérios de aceite:** Não traduzir documentação PT-BR; nenhuma copy portuguesa fica no produto; estados loading/empty/error/success/permission acessíveis; sem overflow e informação não depende de cor.
- **Testes/gates:** E2E Chromium + inspeção visual/teclado/reader, reduced motion e contraste; matriz de browsers completa na F6.
- **Riscos/mitigação:** Teste E2E de um fluxo não prova conformidade de todo produto; tokens/styleguide continuam autoridade visual.
- **Rastreabilidade:** PRD §10/§11; CA-17.
