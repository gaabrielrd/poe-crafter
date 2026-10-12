# Fase 1 — Primeiro craft real validado

**Status:** Planejado; nenhuma implementação realizada nesta entrega.  
**Ordem:** 1 de 6; ver [índice](README.md) e [diagnóstico/rastreabilidade](retomada-00-diagnostico-e-gates.md).

## Objetivo

Substituir a prova de interface por um caminho de crafting reproduzível, com dados reais versionados e todas as transições verificadas. M1 é um marco técnico local/emulado, não uma liberação do piloto nem redução do MVP.

## Gate da fase

M1 exige RET-01-01 a RET-01-10 aceitas: item importado e confirmado, alvo integral satisfeito, base inicial explícita, operações/retry/restart legalmente verificadas, probabilidade derivada, custo manual com origem visível e execução até resumo. O artefato e o relatório devem reproduzir o mesmo resultado com versões e seed fixos.

## Regras de execução

As dependências de cada tarefa são pré-requisitos de aceite, não apenas sugestões.
A ordem abaixo é recomendada. “Parcial” significa que existe uma fatia de código
reutilizável; não significa que esta tarefa de fechamento está concluída.
Cada incremento futuro precisa plano aprovado, testes observáveis, gates do
[processo](../development-process.md), diff revisado e evidência com SHA em
`docs/entregas`. Nenhuma tarefa autoriza deploy ou mudança de regras implantadas.

## RET-01-01 — Verificar origem, versão e licenças

- **Status:** Pendente.
- **Objetivo:** Fixar uma revisão RePoE apropriada ao PoE 1 que será suportado e verificar direitos de uso/redistribuição.
- **Pré-requisitos/dependências:** RET-00-01.
- **Módulos-alvo:** packages/poe-data; docs/decisions.
- **Entregáveis:** Manifesto de origem, revisão upstream, patch do jogo, URLs, licenças/atribuições e relatório de cobertura.
- **Critérios de aceite:** Nenhum dado é tratado como atual sem identificar a revisão; licença ausente ou redistribuição incerta bloqueia a publicação do artefato.
- **Testes/gates:** Revisão das fontes originais e licenças na implementação; fixture da revisão escolhida. Não usar API da GGG.
- **Riscos/mitigação:** Upstream e licença podem mudar; a leitura atual dessas fontes é uma tarefa futura, não uma afirmação deste plano.
- **Rastreabilidade:** RF-06, RF-14; RN-09/RN-10; CA-04/CA-05.

## RET-01-02 — Definir contratos consumidos pelo engine

- **Status:** Pendente.
- **Objetivo:** Separar texto de exibição de identidade semântica de base, mod, tier, grupo, tags, pesos e restrições.
- **Pré-requisitos/dependências:** RET-01-01.
- **Módulos-alvo:** packages/shared-types; packages/poe-data; packages/crafting-engine.
- **Entregáveis:** Schemas próprios versionados, manifesto de capacidades e índices de lookup com primeiro consumidor real.
- **Critérios de aceite:** IDs estáveis e referências resolvidas; campos ausentes não viram valores permissivos; schema externo não escapa do adaptador.
- **Testes/gates:** Fixtures válidas/inválidas, referências quebradas, igualdade de serialização e ausência de SDK/provider no domínio.
- **Riscos/mitigação:** O schema atual limitado às influências Eldritch não representa todo o MVP; migração deve ser explícita.
- **Rastreabilidade:** RF-02, RF-04, RF-06; CA-01/CA-03/CA-04.

## RET-01-03 — Adaptar e gerar game data imutável

- **Status:** Pendente.
- **Objetivo:** Produzir um artefato real utilizável em teste e aplicação sem depender de download durante a busca.
- **Pré-requisitos/dependências:** RET-01-02.
- **Módulos-alvo:** packages/poe-data; functions (futuro pipeline); Storage (artefatos futuros).
- **Entregáveis:** Pipeline baixar/adaptar/validar/indexar/testar, JSON comprimido, checksum e manifesto; carregador do artefato.
- **Critérios de aceite:** Mesma revisão gera resultado reproduzível; importação parcial falha sem substituir versão anterior; nenhum preço fica embutido como regra.
- **Testes/gates:** Golden fixtures, checksum, input corrompido, fonte indisponível e teste de consumidor do artefato.
- **Riscos/mitigação:** Volume do dataset; não caberá no textarea administrativo de 20 KB nem deve ser copiado integralmente para documentos Firestore.
- **Rastreabilidade:** RF-06, RF-14; RN-04/RN-10; CA-04/CA-05.

## RET-01-04 — Resolver semanticamente o item do marco

- **Status:** Parcial.
- **Objetivo:** Reaproveitar importação/confirmação e resolver o exemplo real por IDs, tiers e base do dataset.
- **Pré-requisitos/dependências:** RET-01-03.
- **Módulos-alvo:** features/item-import; packages/poe-data; packages/shared-types.
- **Entregáveis:** Fixture de item inglês não único e adaptador do alvo confirmado; documentação das ambiguidades.
- **Critérios de aceite:** O jogador confirma todos os campos; todas as restrições Required são explícitas e Optional/Ignore preservadas; mod não resolvido bloqueia o marco.
- **Testes/gates:** Parser/normalizador com valores-limite, tier ambíguo, item level ausente e base desconhecida.
- **Riscos/mitigação:** Um código sugerido pelo parser não prova que o mod é compatível com a base.
- **Rastreabilidade:** RF-02/RF-04/RF-06; CA-01/CA-03/CA-04.

## RET-01-05 — Modelar estados e legalidade reais

- **Status:** Parcial.
- **Objetivo:** Evoluir a validação estrutural para estado inicial, predicados de alvo e transições verificáveis.
- **Pré-requisitos/dependências:** RET-01-04.
- **Módulos-alvo:** packages/crafting-engine.
- **Entregáveis:** API pura de validação de estado/operação/transição, capacidades e issues estáveis com engineVersion.
- **Critérios de aceite:** Rejeita itens únicos e verifica base, item level, raridade, limites/grupos, influências e propriedades especiais relevantes; unknown/unsupported não é accepted; o alvo importado não é confundido com a base inicial.
- **Testes/gates:** Estados legais/ilegais, grupo mutuamente exclusivo, base especial, input imutável e resultados reproduzíveis.
- **Riscos/mitigação:** Confiar no status de entrada ou em validation: accepted do dataset permitiria passos ilegais.
- **Rastreabilidade:** RF-06; RN-01/RN-03/RN-09; CA-04/CA-05.

## RET-01-06 — Implementar operações para um caminho real

- **Status:** Pendente.
- **Objetivo:** Escolher um alvo e um conjunto mínimo de operações verificáveis para chegar a ele a partir de uma base explícita.
- **Pré-requisitos/dependências:** RET-01-05.
- **Módulos-alvo:** packages/crafting-engine; packages/poe-data.
- **Entregáveis:** Operações currency/bench necessárias ao exemplo, distribuição de resultados e grafo de sucesso/retry/restart.
- **Critérios de aceite:** Cada aresta tem pré-condição, consumo, resultado possível e checkpoint; o terminal atende todo Required, não apenas um affix da receita.
- **Testes/gates:** Fixtures positivas e negativas de cada operação e replay completo do caminho.
- **Riscos/mitigação:** O recorte do exemplo não autoriza eliminar as demais famílias do MVP.
- **Rastreabilidade:** RF-06/RF-08; RN-01/RN-03; CA-04/CA-05.

## RET-01-07 — Criar o primeiro consumidor de simulação

- **Status:** Pendente.
- **Objetivo:** Derivar probabilidade e tentativas dos resultados e pesos reais do engine.
- **Pré-requisitos/dependências:** RET-01-06.
- **Módulos-alvo:** packages/simulator (a criar quando consumido); packages/planner.
- **Entregáveis:** Contrato de distribuição, avaliação exata de caso pequeno e execução reproduzível por seed quando necessária.
- **Critérios de aceite:** Nenhuma probabilidade do starter é reutilizada como evidência real; caso p=1 e caso estocástico têm referência verificável; p=0 não gera divisão inválida.
- **Testes/gates:** Comparação com solução analítica pequena, massa total 1, seeds repetidas e limites de tolerância declarados.
- **Riscos/mitigação:** Precisão e custo de simulação devem ser medidos; tolerâncias ainda são proposta técnica.
- **Rastreabilidade:** RF-07/RF-08; CA-05.

## RET-01-08 — Gerar candidato e validar o plano inteiro

- **Status:** Parcial.
- **Objetivo:** Conectar planner ao engine e ao simulator para o exemplo, preservando configuração já existente.
- **Pré-requisitos/dependências:** RET-01-07.
- **Módulos-alvo:** packages/planner; packages/crafting-engine; packages/simulator.
- **Entregáveis:** Candidato integral com base inicial, estados, operações, loops e prova de validação final.
- **Critérios de aceite:** Cada passo e retry/restart volta ao engine; Todas as restrições Required satisfeitas no terminal; falha omite o plano inteiro; métricas e custo manual têm origem/versionamento.
- **Testes/gates:** Teste que adultera validation/step, alvo com dois Required, exclusões e caminho impossível.
- **Riscos/mitigação:** Filtro de receitas por subset de affixes não prova satisfação do alvo; não migrar essa lógica sem reavaliá-la.
- **Rastreabilidade:** RF-05/RF-07/RF-08; RN-03/RN-07; CA-04/CA-05/CA-06.

## RET-01-09 — Conectar a jornada local ao artefato real

- **Status:** Parcial.
- **Objetivo:** Usar o plano real no fluxo existente de importação, confirmação e execução, ainda sem alegar durabilidade.
- **Pré-requisitos/dependências:** RET-01-08.
- **Módulos-alvo:** features/item-import; planning-configuration; strategy-planning.
- **Entregáveis:** Composição por services/adapters públicos, explicação real, preço manual identificado e resumo local.
- **Critérios de aceite:** STARTER_PLANNER_DATASET fica somente como fixture identificada; o modo real não retorna ao starter silenciosamente; tentativas e gastos reais são registrados manualmente até sucesso.
- **Testes/gates:** Fluxo E2E determinístico do exemplo e falha de dataset; teclado/360 px e resumo com preço indisponível.
- **Riscos/mitigação:** A UI atual usa português e estado efêmero; isso permanece dívida rastreada em F3/F4.
- **Rastreabilidade:** RF-02/RF-04/RF-05/RF-08/RF-09/RF-10; CA-01/CA-03/CA-05/CA-09.

## RET-01-10 — Comprovar o primeiro craft real validado

- **Status:** Pendente.
- **Objetivo:** Fechar M1 com evidência reproduzível e revisão de legalidade do exemplo.
- **Pré-requisitos/dependências:** RET-01-09.
- **Módulos-alvo:** docs/entregas; fixtures de domínio; e2e.
- **Entregáveis:** Relatório com item/base inicial, fonte/revisão/licença, checksums, versões, seed, métricas, custo manual e caminho executado.
- **Critérios de aceite:** Revisor reproduz todos os estados e terminal; gasto não é apagado por retry/restart; gates aplicáveis passam. Registro manual no app não afirma automação ou verificação automática do jogo.
- **Testes/gates:** pnpm validate; pnpm test:e2e; replay do plano e revisão do craft frente à fonte de regra documentada.
- **Riscos/mitigação:** Se a auditoria global continuar vermelha, M1 pode ter evidência técnica, mas não autoriza piloto ou merge de implementação sem os gates exigidos.
- **Rastreabilidade:** RF-06/RF-07/RF-08/RF-09/RF-10; CA-04/CA-05/CA-09.
