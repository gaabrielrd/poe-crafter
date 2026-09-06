# Escolha de liga PC ativa

**Status:** Implementado
**Origem:** RF-01 do [PRD](../prd.md)
**Dependência:** [Confirmação e classificação de modificadores](confirmacao-e-classificacao-de-modificadores.md)

## Objetivo

Adicionar ao fluxo `/new` a escolha explícita de uma liga PC ativa antes da
importação do item. O craft deve carregar o identificador da liga escolhida para
as etapas seguintes; quando o catálogo de preços não estiver disponível, o
jogador poderá continuar em modo de preços manuais, com essa limitação visível.

## Requisitos

- Carregar um catálogo normalizado de ligas PC ativas por uma fronteira de
  serviço, sem chamar poe.ninja diretamente em componentes React.
- Exibir estados de carregamento, catálogo vazio, erro e sucesso.
- Permitir selecionar exatamente uma liga antes de avançar para a importação.
- Mostrar nome e identificador da liga selecionada durante o fluxo `/new`.
- Oferecer `Continuar sem preços automáticos` quando o catálogo falhar ou ficar
  vazio, deixando explícito que custos automáticos não estarão disponíveis.
- Manter a escolha local na feature; não adicionar login, Firestore, Storage ou
  localStorage nesta etapa.
- Normalizar a resposta externa para um contrato próprio, sem expor schema do
  provider ao restante da aplicação.
- Cobrir teclado, foco visível, 360 px e mensagens anunciadas, usando tokens e
  primitives de `apps/web/src/shared/ui`.

## Não escopo

- Histórico, login Google ou sessão anônima persistida.
- Snapshot diário de preços, overrides de custo ou jobs de atualização.
- Seleção de ligas históricas, ligas de console ou Path of Exile 2.
- Integração com APIs da GGG.
- Planejamento, craftabilidade, OCR, upload ou execução do craft.
- Cache durável, preferências salvas ou sincronização entre abas.

## Suposições e lacunas

- O catálogo será obtido de um endpoint de backend que encapsula o provider de
  preços; a URL e o formato exato do provider serão verificados durante a
  implementação, sem acoplar a UI a eles.
- O contrato mínimo próprio será `id`, `name` e `platform: 'pc'`; o backend
  filtra somente ligas ativas de PC antes de responder.
- Nenhuma liga será selecionada automaticamente. A ação de continuar fica
  bloqueada até uma escolha válida ou até o jogador optar pelo modo manual.
- A seleção não será persistida ainda; sair de `/new` reinicia a escolha.
- Em desenvolvimento, o endpoint será exercitado pelo Emulator Suite e testes
  usarão fixture determinística; nenhuma chamada de produção será necessária
  para a suíte local.
- Não há decisão de produto pendente; a principal verificação técnica é o
  contrato atual do catálogo do provider.

## Módulos envolvidos

- `apps/web/src/features/item-import/`: incorporar a etapa de liga antes da
  confirmação e manter o contexto selecionado no fluxo atual.
- `apps/web/src/features/league-selection/`: modelo, estados e componente de
  catálogo, se a separação evitar aumentar a responsabilidade de item-import.
- `apps/web/src/shared/ui/`: reutilizar `Select`, `Alert`, `Button` e estados
  existentes; criar primitive somente se faltar um estado necessário.
- `packages/shared-types/src/index.ts`: contrato serializável `ActiveLeague`.
- `packages/pricing/`: primeiro consumidor real para adaptar e validar o
  catálogo externo, sem implementar preços ou snapshots completos.
- `functions/src/api/`: endpoint fino, com validação de entrada e chamada ao
  adaptador de pricing.
- `firebase.json`, regras e testes de contrato: preservar Emulator Suite e
  deny-all para dados que ainda não fazem parte desta feature.
- `e2e/app.spec.ts` e testes próximos das features: fluxo de sucesso e fallback
  manual.

## Solução proposta

1. Definir `ActiveLeague` e o estado de catálogo (`loading`, `success`, `empty`,
   `error`) em contratos/modelos próprios.
2. Criar um adaptador de pricing que receba a resposta do provider, filtre PC e
   ligas ativas, valide campos obrigatórios e devolva somente o contrato local.
3. Expor um endpoint backend fino para o catálogo; o handler não contém regra
   de crafting e não passa schema externo para a web.
4. Adicionar a etapa de seleção em `/new`, com select sem valor padrão, resumo da
   liga escolhida e alternativa manual quando o catálogo falhar.
5. Passar a escolha para a etapa de confirmação existente sem persistência e sem
   alterar o parser de item.
6. Testar o adaptador com fixtures, o endpoint com contrato local, a UI com
   todos os estados e o fluxo E2E por teclado.

## Tarefas sequenciais

1. Verificar o contrato atual do provider e registrar a fixture mínima de liga
   PC ativa, liga inativa e liga de console.
2. Adicionar `ActiveLeague` aos tipos compartilhados e implementar o adaptador
   determinístico em `packages/pricing`.
3. Criar o endpoint de catálogo em Functions e testes de payload, erro do
   provider e filtragem de plataforma/status.
4. Criar o serviço web da feature, sem `fetch` no componente, e integrar os
   estados de carregamento, vazio, erro e sucesso.
5. Inserir a seleção no `/new`, bloquear avanço sem escolha e implementar o modo
   de preços manuais com aviso persistente apenas durante a sessão da página.
6. Adicionar testes unitários, UI e E2E para seleção válida, falha do catálogo,
   catálogo vazio, modo manual e viewport de 360 px.
7. Atualizar arquitetura, integrações e README; executar `pnpm validate` e
   `pnpm test:e2e`; registrar a entrega somente quando o gate completo estiver
   verde.

## Riscos e pontos de atenção

- O provider pode mudar nomes, status ou plataforma; o adaptador deve rejeitar
  payload inválido sem deixar dados externos chegarem à UI.
- Expor o provider direto no browser criaria acoplamento e dificultaria cache e
  limites futuros; toda chamada deve passar pelo endpoint/service.
- O modo manual não pode parecer uma liga selecionada nem habilitar custos
  automáticos por engano.
- A nova etapa pode quebrar o E2E existente que entra diretamente em `/new`;
  fixtures e helpers devem representar a escolha de liga explicitamente.
- O primeiro handler Functions foi ativado sem autenticação ou App Check; essas
  proteções entram quando houver dados privados e sessão persistida.

## Critérios de aceite

- [x] Ao abrir `/new`, o jogador vê carregamento e depois um catálogo somente de
      ligas PC ativas, sem seleção automática.
- [x] O jogador não avança para importar o item sem selecionar uma liga válida ou
      escolher o modo manual.
- [x] A liga selecionada exibe nome e identificador no restante do fluxo.
- [x] Catálogo vazio ou erro do provider mostram motivo acionável e permitem
      continuar somente com preços manuais.
- [x] Payload externo inválido não aparece na interface e produz erro tratado no
      serviço/endpoint.
- [x] O fluxo funciona por teclado em 360 px, com foco visível e estados
      anunciados, sem dependência de APIs da GGG.
- [x] Testes do adaptador, endpoint, UI e E2E passam; `pnpm test:e2e` fica verde.
      `pnpm validate` permanece bloqueado somente pela formatação preexistente
      em 107 arquivos fora deste incremento.
