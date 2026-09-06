# Configuração versionada de planejamento

**Status:** Implementado em 2026-09-06
**Origem:** RF-05 e CA-04 do [PRD](../prd.md)
**Dependências:** [contrato e validação determinística de craftabilidade](contrato-e-validacao-de-craftabilidade.md), [persistência privada e histórico de crafts](persistencia-privada-e-historico-de-crafts.md)

## Contexto

O alvo confirmado já pode ser validado pelo `crafting-engine`, mas a interface
ainda não coleta as preferências que devem orientar o futuro planner. RF-05
precisa produzir um pedido versionado com objetivo, mecânicas excluídas e
overrides opcionais, sem considerar inventário ou orçamento máximo.

O planner, a simulação, os snapshots de preços e a execução ainda não existem.
Portanto, esta entrega deve publicar apenas o contrato e a revisão do pedido;
nenhum job ou estratégia pode ser apresentado como resultado.

## Objetivo

Permitir que o jogador configure e revise um pedido de planejamento depois de um
alvo aceito pelo engine, bloqueando a submissão quando todas as mecânicas
aplicáveis forem excluídas e mantendo uma representação serializável para o
próximo incremento.

## Escopo

- Criar a feature `planning-configuration` com API pública e modelo puro.
- Definir `PlanningRequest` versionado com:
  - objetivo `recommended`, `cheapest`, `safest` ou `premium`;
  - mecânicas excluídas de um catálogo determinístico inicial;
  - overrides opcionais de preço em chaos por recurso identificado.
- Validar objetivo, duplicatas, recursos vazios, valores finitos/não negativos
  e a regra de pelo menos uma mecânica aplicável restante.
- Renderizar a configuração somente depois de o alvo ser aceito pelo engine,
  com resumo, edição e estado de erro acionável.
- Expor uma ação `Preparar pedido` que devolve o request versionado para o fluxo
  local; não iniciar job, gerar estratégia ou persistir o request no Firestore.
- Cobrir o modelo e o fluxo observável com testes unitários, componente e E2E.
- Atualizar arquitetura, ADR, documentação de testes e registro de entrega.

## Não escopo

- RF-07: busca, comparação, ranking ou geração de estratégias.
- RF-08: explicação de passos, probabilidades, tentativas e custos calculados.
- Snapshots de poe.ninja, catálogo de moedas ou consulta a providers.
- Firestore, schema de `CraftRecord`, jobs, Functions, filas ou execução.
- Inventário do jogador, orçamento máximo, compra de itens ou APIs da GGG.
- Cálculo de mecânicas aplicáveis por dados completos do jogo; o catálogo inicial
  será explícito e versionado.

## Contrato proposto

```ts
type PlanningObjective = 'recommended' | 'cheapest' | 'safest' | 'premium';
type PlanningMechanic = 'essence' | 'fossil' | 'harvest' | 'bench' | 'metacraft';

interface PriceOverride {
  resource: string;
  chaos: number;
}

interface PlanningRequest {
  schemaVersion: 1;
  objective: PlanningObjective;
  excludedMechanics: PlanningMechanic[];
  priceOverrides: PriceOverride[];
}
```

- `excludedMechanics` e `priceOverrides` são ordenados de forma estável antes
  da publicação do request.
- O catálogo aplicável inicial contém as cinco mecânicas do contrato; a
  exclusão de todas produz erro `no_search_space`.
- Overrides não substituem snapshot nem afirmam preço atual; apenas registram
  uma preferência manual para o futuro planner.
- O request permanece transitório nesta entrega e deve ser consumido por uma
  callback pública, sem gravação em `crafts/{craftId}`.

## Suposições

- O primeiro consumidor é `ItemImportPage`, depois do estado `accepted` do
  engine; o histórico continua abrindo o mesmo fluxo de retomada.
- O catálogo fixo é uma limitação explícita, não uma afirmação de que todas as
  mecânicas são legais para todas as bases.
- Um recurso de override é identificado por texto não vazio e tem valor em chaos
  finito maior ou igual a zero.
- A tela usa `Select`, `Input`, `Button` e `Alert` existentes, sem dependência
  visual nova ou CSS Module.

## Módulos envolvidos

- `apps/web/src/features/planning-configuration/`: modelo, componente, testes e
  exportação pública.
- `apps/web/src/features/item-import/`: composição após a validação aceita e
  reset ao editar o alvo.
- `docs/architecture.md`, `docs/testing.md`, `docs/decisions/` e `README.md`.

## Tarefas sequenciais

1. Definir constantes, tipos, validação e serialização determinística do request.
2. Criar a feature web e o formulário acessível para objetivo, exclusões e
   overrides.
3. Integrar a feature ao estado aceito do `ItemImportPage`, sem permitir
   preparação para resultados rejeitados/não suportados.
4. Adicionar testes unitários para request válido, duplicatas, valores inválidos
   e espaço de busca vazio.
5. Adicionar teste de componente para edição, resumo e callback; adicionar E2E
   para validar alvo, configurar e preparar request.
6. Atualizar arquitetura, ADR, docs e critérios do plano.
7. Executar `pnpm validate`, `pnpm test:e2e`, revisar o diff e registrar a
   entrega em `docs/entregas`.

## Riscos

- **Confusão com planner pronto:** usar copy explícita de “pedido preparado” e
  não mostrar estratégia ou custo calculado.
- **Catálogo incompleto:** versionar e exibir que as mecânicas são o conjunto
  inicial suportado pela configuração.
- **Request instável:** ordenar arrays e testar o JSON resultante.
- **Escopo de persistência:** manter callback transitória até existir schema de
  plano e versão de craft.

## Critérios de aceite

- [x] Um alvo `accepted` exibe a configuração; estados `rejected` e
      `unsupported` não exibem ação de preparação.
- [x] O jogador consegue escolher exatamente um objetivo válido.
- [x] Exclusões podem ser alteradas, não duplicam valores e bloquear a última
      mecânica aplicável mostra `no_search_space` sem callback.
- [x] Overrides vazios, negativos ou não finitos são rejeitados com campo e
      mensagem acionáveis.
- [x] A ação produz `PlanningRequest` schema `1`, com arrays ordenados e sem
      iniciar job, gerar estratégia ou gravar Firestore.
- [x] Testes, `pnpm validate`, E2E, documentação e ADR passam.
