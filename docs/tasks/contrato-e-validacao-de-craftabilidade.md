# Contrato e validação determinística de craftabilidade

**Status:** Implementado em 2026-09-06
**Origem:** RF-06, CA-04, RN-01 e RN-09 do [PRD](../prd.md)
**Dependências:** [persistência privada e histórico de crafts](persistencia-privada-e-historico-de-crafts.md), [confirmação e classificação de modificadores](confirmacao-e-classificacao-de-modificadores.md)

## Contexto

O produto já importa um item por texto ou screenshot, permite revisar e
classificar os modificadores, seleciona a liga e salva o alvo confirmado como
um craft privado. O planner, a simulação e os preços ainda não existem. Antes
de gerar qualquer estratégia, precisamos de uma autoridade determinística que
separe o que o sistema consegue validar do que ainda não suporta.

O contrato atual de entrada é `ConfirmedItemTarget`: um
`NormalizedItemTarget` acompanhado de classificações `required`, `optional` ou
`ignore`. A confirmação já bloqueia campos básicos ausentes e linhas não
reconhecidas, mas ainda não produz um resultado versionado de craftabilidade
que o futuro planner possa consumir.

## Objetivo

Definir e implementar a primeira fatia do `crafting-engine`: uma API pura,
serializável e versionada que receba um alvo confirmado e devolva um resultado
determinístico com estado `accepted`, `rejected` ou `unsupported`, incluindo
conflitos estáveis e o caminho do campo que precisa de atenção.

Esta entrega deve tornar explícito o limite de conhecimento do produto. Um
alvo fora das regras implementadas não pode ser apresentado como craftável nem
produzir um plano silenciosamente.

## Escopo

- Criar o pacote `packages/crafting-engine` com TypeScript puro e exportação
  pública em `src/index.ts`.
- Definir tipos serializáveis para `CraftabilityRequest`,
  `CraftabilityResult`, `CraftabilityConflict` e códigos de conflito; incluir
  `schemaVersion`, `engineVersion`, liga e o alvo confirmado.
- Validar, no primeiro conjunto de regras suportado:
  - nome da base e item level inteiro maior que zero;
  - classificações válidas para todos os modificadores presentes;
  - texto não vazio e ausência de linhas não reconhecidas;
  - limites estruturais de prefixos e sufixos;
  - influências conhecidas pelo contrato atual;
  - recursos ou mecânicas explicitamente marcados como não suportados.
- Garantir ordem estável dos conflitos, códigos determinísticos e resultado
  reproduzível para a mesma entrada, sem rede, relógio, aleatoriedade ou
  dependência de Firebase.
- Integrar a validação ao fluxo de um craft salvo/retomado, exibindo sucesso,
  conflitos e estado não suportado sem alterar o documento persistido.
- Cobrir o contrato, as regras mínimas e o fluxo observável na aplicação.
- Atualizar arquitetura, documentação de integração e uma ADR sobre a fronteira
  entre confirmação, `crafting-engine` e planner.

## Não escopo

- Gerar, ranquear ou comparar estratégias de craft.
- Simular moeda, probabilidade, custo, preço, lucro ou tempo.
- Implementar toda a legalidade de Path of Exile, todos os mod groups,
  bench-crafts, influências, metacrafts, fractures, essências ou harvest.
- Configurar a tela completa de objetivo do RF-05; a configuração de objetivo e
  mecânicas permitidas fica para um incremento posterior.
- Alterar schema, Rules, índices, Storage ou o modelo de persistência do
  Firestore.
- Criar Cloud Functions, jobs, chamadas à GGG ou provider de preços.
- Executar crafts, gravar eventos append-only ou publicar planos imutáveis.

## Contrato proposto

O contrato deve permanecer independente das telas e do SDK Firebase. A forma
exata pode evoluir durante a implementação, mas precisa preservar estes
campos e semântica:

```ts
type CraftabilityStatus = 'accepted' | 'rejected' | 'unsupported';

interface CraftabilityRequest {
  schemaVersion: 1;
  league: string | null;
  target: ConfirmedItemTarget;
  allowedMechanics?: string[];
}

interface CraftabilityConflict {
  code:
    | 'missing_base'
    | 'invalid_item_level'
    | 'unclassified_modifier'
    | 'empty_modifier'
    | 'unparsed_line'
    | 'prefix_limit_exceeded'
    | 'suffix_limit_exceeded'
    | 'unknown_influence'
    | 'unsupported_mechanic';
  path: string;
  message: string;
}

interface CraftabilityResult {
  schemaVersion: 1;
  engineVersion: string;
  status: CraftabilityStatus;
  conflicts: CraftabilityConflict[];
}
```

- `accepted` só pode ser usado quando não houver conflito.
- `rejected` representa dados inválidos ou inconsistentes dentro do contrato
  conhecido.
- `unsupported` representa uma mecânica ou recurso que o engine reconhece como
  fora do conjunto implementado; não deve ser convertido em rejeição genérica.
- `path` usa caminhos estáveis, por exemplo `target.item.itemLevel`,
  `target.classifications.prefix-0` e `target.item.unparsedLines[0]`.
- Mensagens são voltadas à interface, mas os testes e consumidores devem
  depender dos códigos e caminhos, não do texto traduzido.
- `engineVersion` é uma constante do pacote nesta primeira versão, sem leitura
  de ambiente ou data corrente.

## Suposições e lacunas a confirmar na implementação

- `NormalizedItemTarget` continua sendo a fonte dos modificadores reconhecidos;
  o engine não fará parsing de texto cru.
- O limite estrutural inicial será o limite conhecido pelo item confirmado,
  sem alegar que ele cobre todas as regras de bases especiais do jogo.
- Influências e mecânicas desconhecidas devem produzir `unsupported`, nunca ser
  inferidas ou aceitas por omissão.
- O `league` pode ser nulo no modo manual já existente; a ausência de liga não
  invalida a estrutura, mas deve permanecer no request para a futura camada de
  regras de dados.
- A tela deve comunicar “validado pelo conjunto suportado” em vez de “legal em
  qualquer situação do jogo”.

## Módulos envolvidos

- `packages/crafting-engine/src/`: tipos, regras puras, ordenação de conflitos
  e API pública.
- `packages/shared-types/` ou equivalente: somente se algum tipo neutro precisar
  ser promovido; não importar código interno de `apps/web` para o pacote.
- `apps/web/src/features/craft-persistence/`: ponto de integração para um craft
  salvo e retomado, mantendo o Firestore atrás do serviço existente.
- `apps/web/src/features/item-import/`: apenas adaptador do
  `ConfirmedItemTarget`, se necessário; a confirmação continua responsável por
  validar edição, não por decidir craftabilidade.
- `apps/web/src/app/`: somente composição da mensagem/estado caso a integração
  exija um componente de tela já existente.
- `packages/*/package.json`, `pnpm-workspace.yaml` e regras de arquitetura:
  registrar o novo pacote e suas fronteiras sem criar dependência em React,
  Firebase ou planner.
- `docs/architecture.md`, `docs/integrations.md`, `docs/testing.md` e
  `docs/decisions/`: registrar a decisão e o contrato publicado.

## Solução mínima

1. Implementar primeiro os tipos e a função pura `evaluateCraftability`.
2. Aplicar regras em ordem fixa e ordenar os conflitos por `path` e `code`.
3. Expor somente a API pública do pacote; testes não devem importar arquivos
   internos por caminho profundo.
4. Adaptar o craft carregado para um request e renderizar o resultado com os
   componentes de estado existentes, incluindo link para revisão quando houver
   conflito.
5. Manter o resultado calculado transitório nesta entrega; nenhum resultado de
   validação será salvo no Firestore até existir um contrato de versão do plano.

## Tarefas sequenciais

1. Confirmar o shape final de `ConfirmedItemTarget`, influências e limites
   estruturais disponíveis no código atual; registrar lacunas sem inventar
   regras de jogo.
2. Criar `packages/crafting-engine`, seus tipos públicos, versão do engine e
   função de avaliação sem imports de UI, Firebase, providers ou relógio.
3. Implementar as regras mínimas e os códigos de conflito definidos acima, com
   ordenação e serialização determinísticas.
4. Adicionar testes unitários para o exemplo de Divine Crown, entrada válida,
   base/item level ausentes, modificador sem classificação, linha não
   reconhecida, excesso de prefixos/sufixos, influência desconhecida, mecânica
   não suportada e repetição byte a byte do resultado.
5. Integrar a avaliação ao craft persistido/retomado e cobrir carregando,
   sucesso, conflitos e estado não suportado sem alterar o registro salvo.
6. Adicionar teste E2E do caminho confirmado → validar → exibir motivo, usando
   fixture determinística e sem depender do Firebase real.
7. Atualizar arquitetura, ADR, documentação de testes e notas de evolução;
   registrar a entrega somente depois da implementação e da validação.
8. Executar `pnpm validate`, `pnpm test:e2e`, revisar o diff e confirmar que o
   pacote não cria dependências proibidas.

## Riscos e mitigação

- **Falsa promessa de legalidade:** limitar o vocabulário a regras realmente
  implementadas e usar `unsupported` para lacunas.
- **Contrato instável:** versionar request/resultado e testar códigos/caminhos,
  não mensagens literais.
- **Acoplamento com a aplicação:** manter o engine puro e adaptar tipos somente
  na fronteira pública das features.
- **Futuro planner depender de dados insuficientes:** incluir liga, alvo,
  classificações e versão desde já, mas deixar custos e operações para contratos
  posteriores.
- **Regressão na retomada de crafts:** validar sem gravar e cobrir o caminho E2E
  com o mesmo documento salvo.

## Critérios de aceite

- [x] Existe um pacote `crafting-engine` compilável, versionado e sem imports de
      React, Firebase, rede, relógio ou aleatoriedade.
- [x] A mesma entrada produz o mesmo JSON, status, códigos, caminhos e ordem de
      conflitos em execuções repetidas.
- [x] Um alvo confirmado válido retorna `accepted` sem conflitos e com
      `engineVersion` explícita.
- [x] Base/item level inválidos, classificações ausentes, texto vazio, linha não
      reconhecida ou limites estruturais excedidos retornam `rejected` com
      razões acionáveis.
- [x] Influência ou mecânica fora do conjunto suportado retorna `unsupported`,
      sem gerar plano ou resultado aceito.
- [x] A UI mostra os três estados, permite voltar à revisão e não altera o
      craft persistido durante a validação.
- [x] Testes unitários, contratos, E2E, build e `pnpm validate` passam; nenhuma
      regra existente de autenticação, persistência ou histórico é relaxada.
- [x] Arquitetura, ADR e documentação de testes descrevem o contrato e deixam
      explícito que o planner completo continua sendo próximo incremento.
