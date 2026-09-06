# Persistência privada e histórico de crafts

**Status:** Implementado em 2026-09-06
**Origem:** RF-12, CA-11 e RN-14 do [PRD](../prd.md)
**Dependências:** [Sessão anônima e login Google](sessao-anonima-e-login-google.md), [confirmação e classificação de modificadores](confirmacao-e-classificacao-de-modificadores.md)

## Contexto

O jogador já consegue selecionar a liga, importar texto ou screenshot, revisar
o alvo e confirmar a classificação dos modificadores. A sessão Firebase começa
anônima e pode ser vinculada ao Google, mas o alvo confirmado ainda desaparece
quando a tela é recarregada ou abandonada. A arquitetura define persistência
privada como o próximo incremento antes do planner.

## Objetivo

Persistir o alvo confirmado como um craft privado do UID atual, permitir retomá-lo
pela rota de histórico e manter o mesmo documento quando a sessão anônima for
vinculada ao Google, sem duplicar ou expor dados de outra identidade.

## Escopo

- Criar, atualizar e ler um documento de craft em `crafts/{craftId}`.
- Salvar somente dados serializáveis do alvo confirmado (incluindo classificações), liga/mode de preços,
  estado e timestamps; screenshots e bytes OCR nunca entram no Firestore.
- Adicionar repositório/serviço de persistência atrás da fronteira da feature,
  com adaptador Firebase e fixture determinística para testes.
- Salvar explicitamente após a confirmação e atualizar o mesmo craft quando ele
  for retomado e confirmado novamente; não fazer autosave a cada tecla.
- Criar a rota `/history`, com estados carregando, vazio, erro, sem permissão e
  sucesso, ordenada por `updatedAt` decrescente.
- Criar a rota `/craft/:craftId` para abrir o alvo salvo, permitir revisão e
  retornar ao histórico sem perder a seleção de liga ou o modo manual.
- Aplicar Rules owner-only para `crafts`, impedindo troca do `ownerUid` e acesso
  a documentos de outra identidade.
- Manter o vínculo anônimo → Google por UID: o `linkWithPopup` existente deve
  preservar o documento, sem migração ou cópia client-side.
- Cobrir regras, serialização, repositório, fluxo web e E2E fixture.

## Não escopo

- Planner, crafting-engine, simulação, preços ou execução do craft.
- Persistência de histórico de eventos, gastos, planos ou snapshots de preço.
- Exclusão de conta/dados, reautenticação, painel administrativo ou suporte.
- Compartilhamento, links públicos, busca textual ou paginação além de um limite
  inicial seguro para a tela de histórico.
- Migração de crafts entre UIDs, merge de contas ou login por outro provider.
- Upload, retenção ou leitura de screenshot; o OCR continua efêmero e com TTL.
- Acesso ao projeto Firebase real ou deploy de Functions/Hosting.

## Requisitos e contrato de dados

O repositório deve expor uma interface pública semelhante a:

```ts
interface CraftRecord {
  id: string;
  ownerUid: string;
  schemaVersion: 1;
  title: string;
  league: ActiveLeague | null;
  manualPricing: boolean;
  status: 'confirmed';
  target: ConfirmedItemTarget;
  createdAt: string;
  updatedAt: string;
}
```

- `ownerUid` vem da sessão atual e não é aceito como autoridade do formulário.
- O título inicial deriva de `target.baseName`; edição de título fica fora deste
  incremento para evitar criar uma segunda fonte de verdade.
- Timestamps são convertidos do `Timestamp` do Firebase para ISO na fronteira;
  nenhum SDK Firebase entra em `shared-types` ou no modelo de domínio.
- O documento deve rejeitar payload ausente, versão desconhecida, target sem
  `item.baseName`, classificações inválidas ou `updatedAt` inválido antes de
  entrar na UI.
- A lista deve limitar a primeira leitura (por exemplo, 50 documentos) e deixar
  explícito no serviço se houver mais resultados, sem prometer paginação ainda.

## Suposições

- Firestore será acessado pelo SDK web em um serviço da feature; as Rules serão
  a autoridade de isolamento para leitura e escrita do usuário.
- O UID permanece estável ao vincular uma sessão anônima ao Google, portanto não
  será necessário copiar documentos no fluxo normal.
- O fixture de autenticação terá um UID estável e um repositório em memória para
  testes unitários/E2E; nenhuma credencial pessoal será versionada.
- O documento pode ser criado apenas depois que `confirmItemDraft` produzir um
  alvo sem issues; texto parcial continua somente no estado da tela.
- O erro de conflito do Google continua sendo tratado pela feature de identidade
  e não deve gerar uma segunda tentativa de persistência automática.

## Módulos envolvidos

- `apps/web/src/features/craft-persistence/`: contrato, serialização,
  repositório Firebase, fixture e componentes/serviços públicos.
- `apps/web/src/features/item-import/`: integração do alvo confirmado com o
  salvamento e carregamento de um draft existente, usando apenas a API pública.
- `apps/web/src/app/routes/`: rotas `/history` e `/craft/:craftId`, mantendo `*`
  por último.
- `apps/web/src/features/identity/`: obter o usuário atual, sem expor internals
  do Firebase para componentes.
- `firestore.rules` e `firestore.indexes.json`: isolamento por `ownerUid` e
  índice para `updatedAt` descendente, se o emulador exigir.
- `scripts/` e `e2e/`: contratos estruturais, fixture Firestore e fluxo de
  criação, retomada, atualização e isolamento.
- `docs/architecture.md`, `docs/integrations.md`, ADR e `docs/entregas/` após a
  implementação.

## Solução proposta

1. Definir `CraftRecord` e funções puras de serialização/desserialização que
   removam `Timestamp`, `DocumentReference` e campos desconhecidos do limite da
   aplicação.
2. Implementar `CraftRepository` com `create`, `get`, `listRecent` e `update`,
   recebendo o UID autenticado por serviço e usando `serverTimestamp()` apenas
   no adaptador Firebase. O adaptador fixture deve reproduzir not-found,
   permission-denied e ordering.
3. Adicionar Rules para permitir create/read/update/delete somente quando
   `request.auth.uid == request.resource.data.ownerUid` (ou o recurso existente
   no update/delete), proibindo alterar `ownerUid`, `schemaVersion` e campos fora
   do contrato; todos os outros caminhos continuam deny-all.
4. Após `confirmItemDraft`, apresentar ação explícita `Salvar craft`; no sucesso,
   mostrar o identificador/horário atualizado e manter o alvo confirmado em tela.
   Ao abrir um craft existente, hidratar o `ItemDraft` pela API pública e salvar
   alterações no mesmo documento.
5. Criar `HistoryPage` e `CraftPage` com loading, vazio, erro recuperável,
   permission-denied e sucesso. O histórico deve exibir base, liga/modo e última
   atualização, com ação de retomar.
6. Exercitar o vínculo anônimo→Google no E2E fixture verificando que o UID e o
   `craftId` permanecem iguais; um erro de conta conflitante não deve duplicar o
   registro.
7. Atualizar arquitetura, integrações, ADR e registro de entrega; executar
   `pnpm validate` e `pnpm test:e2e`.

## Tarefas sequenciais

1. Mapear `ItemDraft`, `NormalizedItemTarget`, `ActiveLeague` e o contrato de
   identidade atual; definir `CraftRecord`, limites do payload e `schemaVersion`.
2. Implementar testes puros de serialização, validação e normalização de
   timestamps, incluindo payload inválido e versão desconhecida.
3. Implementar a interface do repositório, fixture em memória e adaptador
   Firestore atrás da API pública da nova feature.
4. Escrever Rules owner-only e o teste estrutural; adicionar índice somente se
   a consulta ordenada exigir.
5. Integrar o salvamento explícito à confirmação do item e a hidratação do
   `ItemDraft` na retomada, sem alterar o parser ou o fluxo de OCR.
6. Criar `/history` e `/craft/:craftId`, cobrindo estados assíncronos, teclado,
   foco visível e largura de 360 px.
7. Adicionar testes unitários, de UI, contrato Firestore e E2E de criação,
   listagem, retomada, atualização, usuário alheio e vínculo Google.
8. Atualizar docs/ADR/entrega, revisar o diff e executar `pnpm validate` e
   `pnpm test:e2e`; registrar eventual limitação do Emulator Suite.

## Riscos e pontos de atenção

- Escrever o UID vindo do formulário ou aceitar update sem comparar o recurso
  existente permitiria transferência de ownership; Rules e serviço devem testar
  ambos os lados.
- `serverTimestamp()` é pendente até a próxima leitura; a UI deve exibir estado
  de salvamento sem depender de um timestamp local como verdade.
- O objeto salvo pode crescer com novos campos do parser; `schemaVersion` e
  validação explícita devem impedir que uma mudança silenciosa quebre retomadas.
- A sessão anônima pode ser apagada pelo Firebase antes do vínculo; o erro deve
  ser recuperável e não afirmar que o craft foi salvo.
- Listar por `updatedAt` exige índice e limite; não carregar a coleção inteira
  nem expor documentos sem UID.
- Os testes com Firestore Emulator podem continuar bloqueados pelo erro conhecido
  do Firebase CLI (`winston`/`isStream`); manter contratos e fixture verdes e
  registrar a limitação real.

## Critérios de aceite

- [x] Após confirmar um alvo válido, o jogador salva explicitamente um craft e
      recebe confirmação sem persistir screenshot ou texto OCR bruto.
- [x] Reabrir `/history` lista somente crafts do UID atual, em `updatedAt`
      decrescente, com estados carregando, vazio, erro e permissão.
- [x] Abrir `/craft/:craftId` restaura o alvo, a liga/modo e as classificações;
      confirmar novamente atualiza o mesmo `craftId`.
- [x] Rules permitem apenas o próprio usuário autenticado e impedem alteração
      de `ownerUid`, acesso alheio e escrita fora de `crafts/{craftId}`.
- [x] O vínculo anônimo→Google preserva o UID e o `craftId`, sem duplicação; um
      conflito de credencial mantém o histórico intacto e apresenta erro
      recuperável.
- [x] Payloads inválidos ou versões desconhecidas são rejeitados na fronteira,
      sem quebrar a tela de importação manual.
- [x] Testes unitários, UI, contratos/Rules e E2E fixture cobrem sucesso e
      falhas; `pnpm validate` e `pnpm test:e2e` ficam verdes, salvo limitação
      ambiental documentada.
- [x] Arquitetura, integrações, ADR e `docs/entregas` descrevem o contrato, as
      Rules, a privacidade e as limitações reais.

## Validação de ambiente

`pnpm validate` e `pnpm test:e2e` ficaram verdes. A suíte de Emulator Suite não
foi repetida neste incremento; a execução anterior permanece bloqueada pelo
erro do Firebase CLI local em `winston` (`TypeError: isStream is not a function`).
