# Fase 2 — Cobertura completa do MVP e planejamento

**Status:** Planejado; nenhuma implementação realizada nesta entrega.  
**Ordem:** 2 de 6; ver [índice](README.md) e [diagnóstico/rastreabilidade](retomada-00-diagnostico-e-gates.md).

## Objetivo

Expandir o núcleo real para todas as famílias aprovadas: Currency, bench/meta-crafts, Essences, Fossils/Resonators, Harvest, Eldritch e influence crafting. Nenhuma família é encerrada apenas por uma receita de demonstração.

## Gate da fase

M2 exige RET-02-01 a RET-02-10: matriz de operações do MVP com evidência por regra e interação, busca que satisfaça todo o alvo e métricas reproduzíveis. Toda lacuna permanece visível e bloqueia a alegação de MVP completo.

## Regras de execução

As dependências de cada tarefa são pré-requisitos de aceite, não apenas sugestões.
A ordem abaixo é recomendada. “Parcial” significa que existe uma fatia de código
reutilizável; não significa que esta tarefa de fechamento está concluída.
Cada incremento futuro precisa plano aprovado, testes observáveis, gates do
[processo](../development-process.md), diff revisado e evidência com SHA em
`docs/entregas`. Nenhuma tarefa autoriza deploy ou mudança de regras implantadas.

## RET-02-01 — Detalhar a matriz de cobertura do MVP

- **Status:** Pendente.
- **Objetivo:** Enumerar operações, bases, propriedades e interações de cada família para a revisão de jogo suportada.
- **Pré-requisitos/dependências:** RET-01-10.
- **Módulos-alvo:** packages/poe-data; packages/crafting-engine; docs/tasks.
- **Entregáveis:** Matriz operação × restrição × fixture × estado, com todos os mecanismos aprovados e lacunas explícitas.
- **Critérios de aceite:** Currency, bench/meta, Essences, Fossils/Resonators, Harvest, Eldritch e influence têm itens rastreáveis; o manifesto não pode declarar família completa por um exemplo.
- **Testes/gates:** Revisão de cobertura contra fontes da revisão fixada; cada linha precisa apontar fixture positiva e negativa.
- **Riscos/mitigação:** Escopo técnico da revisão precisa ser preciso; isso não reabre a decisão de MVP amplo.
- **Rastreabilidade:** RF-06/RF-07; RN-09; CA-04/CA-05.

## RET-02-02 — Completar Currency e bench/meta-crafts

- **Status:** Parcial.
- **Objetivo:** Expandir além das operações do M1 e modelar pré-condições, bloqueios e consumo de bancada/metacrafts.
- **Pré-requisitos/dependências:** RET-02-01.
- **Módulos-alvo:** crafting-engine; poe-data; fixtures de domínio.
- **Entregáveis:** Operações e casos de composição previstos na matriz; especificação de checkpoints e resets.
- **Critérios de aceite:** Restrições de raridade, affixes e propriedades especiais aplicáveis verificadas; efeito de metacraft sobre cada operação suportada possui teste próprio.
- **Testes/gates:** Golden fixtures, grupos/slots, operações com proteção e sequência que invalida uma operação seguinte.
- **Riscos/mitigação:** Não generalizar efeito de metacraft entre famílias por semelhança.
- **Rastreabilidade:** RF-06/RF-07/RF-08; RN-01/RN-03; CA-04/CA-05.

## RET-02-03 — Completar Essences

- **Status:** Pendente.
- **Objetivo:** Modelar modificador garantido e pool restante segundo base, essência e revisão.
- **Pré-requisitos/dependências:** RET-02-02.
- **Módulos-alvo:** crafting-engine; poe-data; simulator.
- **Entregáveis:** Catálogo normalizado de essências/tier/restrições e operadores determinísticos.
- **Critérios de aceite:** Mod garantido e pesos não vêm das constantes starter; combinações incompatíveis falham; alvo completo é verificado.
- **Testes/gates:** Fixtures por classe/tier e comparação analítica de pool reduzido; interações da matriz.
- **Riscos/mitigação:** Nome comercial ou texto não basta para identificar uma essência.
- **Rastreabilidade:** RF-06/RF-07; CA-04/CA-05.

## RET-02-04 — Completar Fossils e Resonators

- **Status:** Pendente.
- **Objetivo:** Representar combinação, slots, modificações de pesos e recursos consumidos.
- **Pré-requisitos/dependências:** RET-02-03.
- **Módulos-alvo:** crafting-engine; poe-data; simulator; pricing (IDs de recursos).
- **Entregáveis:** Operador de combinação e catálogo de fósseis/ressonadores versionado.
- **Critérios de aceite:** Só combinações legais produzem distribuição; todos os recursos gastos estão no plano; pool condicionado aos bloqueios/tags reais.
- **Testes/gates:** Combinações válidas/duplicadas/incompatíveis, massa normalizada e custo de cada recurso com snapshot fixture.
- **Riscos/mitigação:** Composição de pesos pode criar pool vazio; deve ser falha explícita.
- **Rastreabilidade:** RF-06/RF-07; CA-04/CA-05.

## RET-02-05 — Completar Harvest

- **Status:** Pendente.
- **Objetivo:** Modelar operações disponíveis na revisão fixada sem prometer preservação de affixes que a regra não garante.
- **Pré-requisitos/dependências:** RET-02-04.
- **Módulos-alvo:** crafting-engine; poe-data; simulator.
- **Entregáveis:** Operações e custos de recursos por identificação estável, com restrições de estado.
- **Critérios de aceite:** Cada reforge/ação da matriz tem resultados e perdas explícitos; não reutiliza o texto starter sobre conservar os melhores affixes.
- **Testes/gates:** Replay positivo/negativo, efeitos de metacrafts e restrições de propriedades especiais da matriz.
- **Riscos/mitigação:** Mecânicas/nomes históricos não podem ser tratados como disponíveis na revisão escolhida.
- **Rastreabilidade:** RF-06/RF-07; CA-04/CA-05.

## RET-02-06 — Completar Eldritch

- **Status:** Pendente.
- **Objetivo:** Modelar implícitos, tiers, dominância e operações específicas previstas na matriz.
- **Pré-requisitos/dependências:** RET-02-05.
- **Módulos-alvo:** crafting-engine; poe-data; shared-types.
- **Entregáveis:** Estado semântico de influências Eldritch e operadores com requisitos.
- **Critérios de aceite:** Influências incompatíveis e bases sem elegibilidade são rejeitadas; estado de dominância e efeitos não são inferidos da string do alvo.
- **Testes/gates:** Fixtures de tiers/dominância, affixes protegidos, base inválida e sequências mistas.
- **Riscos/mitigação:** Contrato atual reconhece somente duas influências e não demonstra essas regras.
- **Rastreabilidade:** RF-06/RF-07; CA-04/CA-05.

## RET-02-07 — Completar influence crafting

- **Status:** Pendente.
- **Objetivo:** Ampliar influências e operações do MVP com pools e incompatibilidades reais.
- **Pré-requisitos/dependências:** RET-02-06.
- **Módulos-alvo:** crafting-engine; poe-data; shared-types; item-import.
- **Entregáveis:** Contratos e migração compatível; operações de influência da matriz e fixtures.
- **Critérios de aceite:** Não perde dados de crafts antigos; combinações legais e ilegais, grupos e propriedades especiais são verificadas; nenhuma influência desconhecida é aceita.
- **Testes/gates:** Migração de schema, fixtures de influência dupla/incompatível e interação com outras famílias.
- **Riscos/mitigação:** Atualizar enum sem regras daria falsa cobertura; suporte exige módulo e regressão.
- **Rastreabilidade:** RF-06/RF-07; CA-04/CA-05.

## RET-02-08 — Calibrar distribuições, loops e métricas

- **Status:** Pendente.
- **Objetivo:** Calcular distribuição de tentativas, custos, risco e P90 para caminhos com checkpoints/retry/restart.
- **Pré-requisitos/dependências:** RET-02-07, RET-01-07.
- **Módulos-alvo:** simulator; planner; crafting-engine.
- **Entregáveis:** Métodos exatos onde viáveis, simulação por seed, limites de erro e relatório de convergência.
- **Critérios de aceite:** P90 deriva da distribuição, não da soma aproximada atual; custos ausentes permanecem indisponíveis; loops sem absorção ou sem chance de sucesso não são plano executável.
- **Testes/gates:** Casos analíticos geométricos/absorventes, dependência entre etapas, seeds, convergência e benchmark.
- **Riscos/mitigação:** Não prometer garantia de tentativas/custo; teto de trabalho e precisão devem ser medidos.
- **Rastreabilidade:** RF-07/RF-08; RN-16; CA-05.

## RET-02-09 — Buscar e ranquear estratégias completas

- **Status:** Parcial.
- **Objetivo:** Trocar filtro de cinco receitas por busca limitada e reproduzível no espaço legal, cobrindo todos os Required e valorizando Optional.
- **Pré-requisitos/dependências:** RET-02-08.
- **Módulos-alvo:** planner; crafting-engine; simulator; planning-configuration.
- **Entregáveis:** Busca com checkpoints, deduplicação por equivalência relevante, ranking dos quatro objetivos e limites de recursos/deadline.
- **Critérios de aceite:** De uma a quatro opções distintas; zero caminhos inventados; exclusions validadas pelo engine; empate estável; ranking Premium tem semântica justificada, não a fórmula placeholder atual.
- **Testes/gates:** Alvos múltiplos, exclusões, equivalência de estados/operações, ausência de custo e teste adversarial de explosão da busca.
- **Riscos/mitigação:** Definir pesos do ranking é proposta técnica documentada; não alterar objetivos aprovados.
- **Rastreabilidade:** RF-05/RF-07/RF-08; RN-03/RN-07; CA-04/CA-05/CA-06/CA-16.

## RET-02-10 — Fechar cobertura e regressão do núcleo

- **Status:** Pendente.
- **Objetivo:** Reproduzir a matriz completa e confirmar que aumento de cobertura não diminuiu legalidade.
- **Pré-requisitos/dependências:** RET-02-09.
- **Módulos-alvo:** fixtures de domínio; scripts; docs/entregas.
- **Entregáveis:** Corpus versionado de alvos/base/planos e relatório M2 com casos suportados/impossíveis/não suportados.
- **Critérios de aceite:** Todas as linhas da matriz de MVP têm evidência; planos publicados passam por replay final; unsupported permanece explícito para mecânica recém-lançada ainda sem módulo.
- **Testes/gates:** Gates de packages, contratos arquiteturais, property tests pertinentes e pnpm validate.
- **Riscos/mitigação:** Se faltar família aprovada, M2 não está concluído; não redefinir o MVP para fechar o gate.
- **Rastreabilidade:** RF-06/RF-07/RF-08; RN-01/RN-03/RN-09; CA-04/CA-05/CA-06.
