# Confirmação e classificação de modificadores

**Status:** Implementado — gate global pendente por formatação preexistente
**Origem:** RF-04 e CA-03 do [PRD](../prd.md)
**Dependência:** [Importação de item por texto](importacao-de-item-por-texto.md)

## Objetivo

Evoluir o fluxo `/new` para que o jogador revise o alvo normalizado, corrija os
campos essenciais e escolha exatamente `Required`, `Optional` ou `Ignore` para
cada modificador antes de deixar o item pronto para a próxima etapa. O
incremento permanece local no navegador; ele não cria plano, não valida
craftabilidade e não persiste o craft.

## Requisitos

- Reutilizar o resultado de `parseItemText` sem alterar as regras já cobertas do
  parser.
- Apresentar os campos reconhecidos em uma etapa explícita de confirmação.
- Permitir corrigir pelo menos nome da base, item level, raridade, propriedades
  numéricas, sockets e propriedades especiais que existam no contrato do item.
- Listar implícitos, explícitos, prefixes e suffixes com origem, texto e uma
  classificação obrigatória.
- Exigir exatamente uma classificação por modificador: `Required`, `Optional` ou
  `Ignore`; não escolher uma opção por inferência silenciosa.
- Manter linhas não interpretadas visíveis e bloquear a confirmação enquanto
  houver campo obrigatório ausente ou modificador não resolvido.
- Permitir corrigir o item level ausente detectado pelo parser antes da
  confirmação.
- Produzir um alvo confirmado serializável para a próxima feature, preservando
  os dados originais, as correções e as classificações.
- Manter estado somente na feature e no navegador durante este incremento; não
  adicionar Firebase, API, localStorage ou gerenciador global de estado.
- Ser utilizável por teclado, com foco visível, mensagens associadas aos campos,
  largura mínima de 360 px e tokens do styleguide.

## Não escopo

- Screenshot, OCR, Cloud Vision ou upload.
- Escolha de liga, login Google, sessão anônima, Firestore, Storage ou histórico.
- Validação semântica de tiers, grupos, influências ou legalidade de crafting.
- Criação dos packages `crafting-engine`, `planner`, `simulator`, `pricing` ou
  `poe-data`.
- Geração, comparação ou execução de planos.
- Persistência do rascunho ao recarregar a página.
- Inferir a classificação a partir de tags, tiers, prefixos ou suffixes.

## Suposições e lacunas

- A classificação não terá valor padrão; cada select começa em uma opção vazia e
  a confirmação fica bloqueada até todas as escolhas serem feitas. Isso evita
  transformar uma decisão do jogador em regra implícita.
- Os IDs dos modificadores serão determinísticos dentro do alvo (origem e
  posição), para que re-renderizações não percam escolhas. Eles não são um ID
  global nem uma prova de identidade do mod no jogo.
- A correção de texto de um modificador que perder os metadados reconhecidos será
  marcada como não resolvida e exigirá nova importação antes de confirmar. A
  feature não tentará adivinhar código ou tier.
- “Campo obrigatório inválido” neste incremento significa ausência ou formato
  estrutural inválido (por exemplo, base vazia ou item level não numérico). A
  validação de compatibilidade com o jogo pertence ao `crafting-engine`.
- Não há decisões de produto pendentes; estas suposições apenas delimitam a
  primeira implementação técnica de RF-04.

## Módulos envolvidos

- `apps/web/src/features/item-import/components/ItemImportPage.tsx`: composição
  das etapas de importação, confirmação e resultado confirmado.
- `apps/web/src/features/item-import/model/`: modelo de modificador, IDs
  determinísticos, edição e validação pura do alvo confirmado.
- `apps/web/src/features/item-import/tests/`: testes unitários e de UI do fluxo.
- `apps/web/src/shared/ui/select.tsx` e `index.ts`: primitive acessível de
  seleção, sem nova dependência.
- `apps/web/src/app/routes/index.tsx`: permanece em `/new`; nenhuma rota nova é
  necessária.
- `e2e/app.spec.ts` ou novo spec da feature: fluxo observável no Chromium.
- `packages/shared-types/src/index.ts`: somente se o contrato serializável
  confirmado não puder permanecer no modelo público da feature; evitar alterar o
  package sem consumidor real.

## Solução proposta

1. Derivar uma lista única de modificadores a partir de implícitos, explícitos,
   prefixes e suffixes, mantendo a origem e o índice de cada entrada. Expor um
   tipo de classificação e um alvo confirmado pela API pública da feature.
2. Implementar funções puras para aplicar correções, verificar campos
   obrigatórios, detectar linhas não resolvidas e confirmar somente quando todos
   os modificadores têm classificação válida.
3. Adicionar um `Select` compartilhado baseado no elemento HTML nativo, com
   label, descrição e estado inválido compatíveis com o styleguide.
4. Transformar `/new` em um fluxo local de duas etapas: importação/parsing e
   confirmação. A etapa de confirmação mostra os campos editáveis, os
   modificadores agrupados e os erros acionáveis; o resultado confirmado exibe
   um resumo e indica que está pronto para validação de craftabilidade.
5. Manter o botão de confirmação desabilitado apenas quando a validação puder ser
   explicada pelos campos visíveis; anunciar o primeiro erro no envio e levar o
   foco ao campo correspondente.
6. Cobrir o contrato com testes de modelo, UI e E2E, sem reduzir os limites de
   cobertura existentes.

## Tarefas sequenciais

1. Mapear o contrato atual do parser e criar os tipos/modelos locais de
   modificador, classificação, edição e alvo confirmado.
2. Implementar IDs determinísticos, aplicação de correções e validador puro,
   incluindo item level ausente, base vazia, texto editado não resolvido e
   classificações incompletas.
3. Criar e exportar o primitive `Select`, atualizando o styleguide se o
   componente precisar de uma demonstração nova.
4. Refatorar `ItemImportPage` para manter as etapas e o estado de confirmação,
   com todos os estados de erro e sucesso acessíveis.
5. Adicionar testes unitários para as funções puras e testes de UI para edição,
   bloqueio, classificação e confirmação do exemplo `Divine Crown`.
6. Adicionar ou atualizar o teste E2E do fluxo `/new` em viewport de desktop e
   validar teclado/foco na largura mínima suportada.
7. Atualizar `docs/architecture.md`, a documentação da feature e um registro em
   `docs/entregas` após a implementação; executar `pnpm validate` e
   `pnpm test:e2e`.

## Riscos e pontos de atenção

- O mesmo texto pode aparecer em mais de um modificador; os testes devem usar a
  origem e a posição, nunca o texto como chave.
- A edição de campos pode deixar o parser original e o alvo confirmado
  diferentes; o resumo deve deixar claro o que foi corrigido.
- Linhas desconhecidas não podem desaparecer para fazer o fluxo avançar.
- Um select nativo precisa manter contraste, foco e nome acessível em todos os
  navegadores suportados.
- Alterar `NormalizedItemTarget` sem consumidor compartilhado criaria contrato
  prematuro; preferir modelo público da feature até existir o engine.
- O gate completo pode continuar revelando dívida de formatação ou limitações de
  bindings nativos do ambiente Windows; registrar o resultado real, sem mascarar
  a falha.

## Critérios de aceite

- [x] Após uma importação válida, `/new` apresenta uma etapa de confirmação com
      todos os campos reconhecidos e cada modificador agrupado por origem.
- [x] Base, item level e demais campos definidos como editáveis aceitam correção;
      item level ausente pode ser informado manualmente.
- [x] Cada modificador exige exatamente `Required`, `Optional` ou `Ignore`, sem
      valor padrão implícito; escolhas incompletas bloqueiam a confirmação.
- [x] Base vazia, item level inválido, texto editado sem metadados ou linha não
      resolvida impedem o avanço e identificam o campo/linha.
- [x] O alvo confirmado preserva dados importados, correções e classificações,
      e é exibido como pronto para validação de craftabilidade — sem afirmar que
      já foi validado pelo engine.
- [x] O fluxo funciona por teclado a partir de 360 px, com foco visível e
      mensagens anunciadas, sem cores literais ou dependências novas.
- [x] Testes de modelo, UI e E2E cobrem sucesso e falhas; `pnpm test:e2e` ficou
      verde. `pnpm validate` permanece pendente apenas pela formatação global de
      arquivos preexistentes fora deste incremento (`prettier --check .`).
