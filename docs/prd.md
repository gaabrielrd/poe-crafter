# PRD — PoE Crafting Planner

**Status:** Aprovado
**Última atualização:** 2026-09-05

## 1. Visão do produto

### Problema

Jogadores intermediários de Path of Exile 1 conhecem moedas, bases e mecânicas
isoladas, mas não conseguem transformar um item desejado em uma sequência de
crafting completa. Hoje precisam combinar conhecimento espalhado, calcular
probabilidades, prever falhas e consultar preços antes de decidir como executar
o craft.

### Proposta de valor

O PoE Crafting Planner recebe um item-alvo, valida o que pode ser produzido e
entrega estratégias executáveis. Cada estratégia apresenta a base inicial, os
passos, os estados esperados, as probabilidades, os retries, os restarts e o
custo estimado. Durante a execução, o jogador registra tentativas e gastos para
comparar o resultado real com a estimativa.

### Objetivo da primeira versão

Permitir que um jogador importe um item não único do cliente inglês de PoE 1,
selecione os modificadores desejados, receba ao menos uma estratégia integralmente
validada e conclua o craft registrando o caminho e o custo reais.

## 2. Usuários

### Usuário principal

Jogador intermediário de Path of Exile 1 que reconhece as moedas e operações
básicas do jogo, mas precisa de ajuda para escolher e ordenar uma estratégia de
crafting com riscos e custos compreensíveis.

### Usuários secundários

- Jogadores avançados que desejam comparar custo esperado, variância e risco de
  restart entre estratégias válidas.
- Administradores responsáveis por publicar dados do jogo, acompanhar preços e
  operar a fila de planejamento.

### Usuários não atendidos nesta versão

- Jogadores de Path of Exile 2.
- Usuários de console que dependam da economia específica do console.
- Pessoas que importem itens em idiomas diferentes do inglês.
- Usuários que esperem automação dentro do cliente do jogo.

## 3. Jornada principal

1. O jogador abre a aplicação e inicia anonimamente ou entra com Google.
2. Escolhe uma liga PC ativa disponibilizada pela fonte de preços.
3. Cola o texto de um item ou envia uma imagem PNG, JPEG ou WebP.
4. Confirma ou corrige o tipo de base, o nível, a raridade, as propriedades
   especiais e os modificadores interpretados.
5. Classifica cada modificador como `Required`, `Optional` ou `Ignore`.
6. Exclui mecânicas que não pretende usar, escolhe `Recommended`, `Cheapest`,
   `Safest` ou `Premium` e solicita o planejamento.
7. Acompanha o job e recebe de uma a quatro estratégias distintas que passaram
   pela validação determinística.
8. Escolhe uma estratégia e executa os passos, registrando tentativas, resultado
   e moedas gastas.
9. Quando necessário, registra retry ou restart sem apagar o gasto anterior.
10. Conclui o craft e compara custo estimado, custo real, tentativas e caminho
    executado.
11. Se a sessão estiver vinculada ao Google, retorna ao craft pelo histórico.

## 4. Escopo da primeira versão

| Capacidade                  | Benefício para o usuário                     | Limites                                                                                              |
| --------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Importação de item          | Evita redigitar o alvo                       | Texto de até 20 KB ou uma imagem PNG/JPEG/WebP de até 8 MB; cliente inglês; um item por importação   |
| Confirmação do alvo         | Impede que um erro do parser vire estratégia | Toda importação deve ser confirmada; campos interpretados podem ser corrigidos antes do planejamento |
| Definição de requisitos     | Separa o indispensável do desejável          | Cada modificador importado recebe exatamente um estado: `Required`, `Optional` ou `Ignore`           |
| Validação de craftabilidade | Evita orientar operações ilegais             | Itens não únicos; mecânicas sem módulo determinístico e testes aparecem como não suportadas          |
| Planejamento                | Entrega uma sequência executável             | Até quatro estratégias distintas; nenhuma estratégia aproximada ou parcialmente validada             |
| Cobertura de crafting       | Atende o conjunto principal de PoE 1         | Currency, bench/meta-crafts, Essences, Fossils/Resonators, Harvest, Eldritch e influence crafting    |
| Preços                      | Converte o plano em custo esperado           | poe.ninja, atualização diária e override manual; sem GGG; custo pode ficar indisponível              |
| Execução do craft           | Registra o que realmente ocorreu             | Confirmação manual de tentativas, resultado e moedas; sem verificação automática a cada passo        |
| Persistência e histórico    | Permite interromper e retomar                | Sessão anônima por até 30 dias de inatividade; histórico durável após vínculo com Google             |
| Administração               | Mantém dados e jobs operáveis                | Acesso somente a contas Google autorizadas manualmente                                               |

## 5. Requisitos funcionais

### RF-01 — Escolher a liga

- **Quem:** jogador.
- **Interface/gatilho:** início de um novo craft.
- **Entrada:** uma liga PC ativa presente no catálogo obtido da fonte de preços.
- **Comportamento:** a aplicação associa o craft à liga escolhida e ao snapshot de
  preços usado no planejamento.
- **Saída:** liga visível durante importação, planejamento, execução e resumo.
- **Exceções:** sem catálogo válido, a aplicação impede preços automáticos e
  permite continuar somente com preços manuais.

### RF-02 — Importar item por texto

- **Quem:** jogador.
- **Interface/gatilho:** colar o texto copiado do cliente inglês.
- **Entrada:** texto de um item, com no máximo 20 KB.
- **Comportamento:** o parser separa base, nível, raridade, implícitos, explícitos,
  influências, propriedades especiais e tiers identificáveis.
- **Saída:** alvo normalizado apresentado para confirmação.
- **Exceções:** texto vazio, acima do limite, com mais de um item ou sem base
  identificável é rejeitado com indicação do que corrigir; item level ausente é
  solicitado ao jogador.

### RF-03 — Importar item por screenshot

- **Quem:** jogador.
- **Interface/gatilho:** selecionar ou arrastar uma imagem.
- **Entrada:** um PNG, JPEG ou WebP de até 8 MB contendo um item.
- **Comportamento:** a imagem é armazenada temporariamente, enviada ao Cloud
  Vision, convertida em texto e processada pelo mesmo parser do RF-02.
- **Saída:** alvo normalizado apresentado para confirmação e correção.
- **Exceções:** tipo, tamanho ou conteúdo inválido é rejeitado; após 1.000 imagens
  processadas no mês, a opção é desativada e a importação por texto permanece
  disponível; a imagem é excluída em até 24 horas.

### RF-04 — Confirmar e classificar modificadores

- **Quem:** jogador.
- **Interface/gatilho:** confirmação posterior à importação.
- **Entrada:** campos interpretados e a classificação `Required`, `Optional` ou
  `Ignore` para cada modificador.
- **Comportamento:** a aplicação valida campos obrigatórios e converte as escolhas
  em restrições do alvo.
- **Saída:** alvo confirmado e pronto para validação de craftabilidade.
- **Exceções:** campo obrigatório inválido, tier incompatível ou modificador não
  resolvido mantém o avanço bloqueado e identifica o campo.

### RF-05 — Configurar o planejamento

- **Quem:** jogador.
- **Interface/gatilho:** etapa final do novo craft.
- **Entrada:** objetivo `Recommended`, `Cheapest`, `Safest` ou `Premium`, mecânicas
  excluídas e overrides opcionais de preço.
- **Comportamento:** a aplicação monta um pedido versionado sem considerar o
  inventário do jogador nem um orçamento máximo.
- **Saída:** resumo das preferências e ação para gerar o plano.
- **Exceções:** excluir todas as mecânicas aplicáveis bloqueia o pedido e explica
  por que não existe espaço de busca.

### RF-06 — Validar a craftabilidade

- **Quem:** jogador.
- **Interface/gatilho:** solicitação de planejamento.
- **Entrada:** alvo confirmado, liga, mecânicas permitidas e versão ativa dos dados.
- **Comportamento:** o crafting engine verifica base, item level, affix limits,
  grupos de modificadores, influências, propriedades especiais e operações
  disponíveis.
- **Saída:** alvo aceito ou lista de conflitos e recursos ainda não suportados.
- **Exceções:** alvo impossível ou dependente de uma mecânica não validada não
  gera plano; o jogador pode voltar e editar as escolhas.

### RF-07 — Gerar e comparar estratégias

- **Quem:** jogador.
- **Interface/gatilho:** alvo considerado craftável.
- **Entrada:** pedido validado, dataset e snapshot de preços.
- **Comportamento:** um job assíncrono pesquisa caminhos, resolve loops e
  checkpoints, simula os melhores candidatos e ranqueia resultados.
- **Saída:** de uma a quatro estratégias distintas entre `Recommended`,
  `Cheapest`, `Safest` e `Premium`, com métricas comparáveis.
- **Exceções:** alternativas inviáveis ou equivalentes são omitidas; se nenhum
  caminho integralmente validado for encontrado, o job falha sem apresentar
  passos aproximados.

### RF-08 — Explicar uma estratégia

- **Quem:** jogador.
- **Interface/gatilho:** abrir uma estratégia.
- **Entrada:** plano validado.
- **Comportamento:** a aplicação apresenta base inicial, item level, propriedades,
  passos ordenados, estado esperado, sucesso, retry, restart, probabilidade,
  tentativas esperadas e custo.
- **Saída:** plano executável em linguagem voltada ao jogador.
- **Exceções:** métricas de preço ausentes aparecem como indisponíveis, sem ocultar
  as operações ou probabilidades calculáveis.

### RF-09 — Acompanhar a execução

- **Quem:** jogador.
- **Interface/gatilho:** iniciar uma estratégia.
- **Entrada:** tentativas, moedas gastas e resultado `success`, `retry`, `restart`
  ou `skipped` quando permitido pelo plano.
- **Comportamento:** a aplicação acrescenta eventos de execução imutáveis e avança
  o estado visível sem duplicar passos de loop.
- **Saída:** passo atual, histórico de tentativas e custo real acumulado.
- **Exceções:** retry ou restart nunca apaga gastos; falha de conexão mantém a
  edição na página e informa que ainda não foi persistida.

### RF-10 — Concluir e resumir o craft

- **Quem:** jogador.
- **Interface/gatilho:** atingir o estado terminal de sucesso.
- **Entrada:** histórico da execução.
- **Comportamento:** a aplicação soma valores normalizados no momento de cada
  entrada e compara execução e plano.
- **Saída:** custo estimado, custo real, diferença, tentativas por passo e caminho
  completo.
- **Exceções:** campos sem preço mantêm a indicação de indisponível em vez de serem
  tratados como zero.

### RF-11 — Recalcular sem apagar o histórico

- **Quem:** jogador.
- **Interface/gatilho:** solicitar novos dados ou preços para um craft existente.
- **Entrada:** craft e preferências atualizadas.
- **Comportamento:** a aplicação cria uma nova versão do plano e mantém plano,
  snapshot e gastos anteriores.
- **Saída:** escolha explícita entre continuar a versão anterior ou iniciar a nova.
- **Exceções:** a nova versão não altera eventos já registrados.

### RF-12 — Persistir, vincular e listar crafts

- **Quem:** jogador anônimo ou autenticado.
- **Interface/gatilho:** criação, alteração, login Google e abertura do histórico.
- **Entrada:** sessão Firebase anônima ou identidade Google.
- **Comportamento:** crafts anônimos são persistidos e vinculados à conta quando o
  login Google ocorre; contas autenticadas recebem uma lista privada de crafts.
- **Saída:** craft retomável e histórico ordenado pela última atualização.
- **Exceções:** conflito de vínculo não mistura dados entre identidades e exige
  nova autenticação.

### RF-13 — Excluir conta e dados

- **Quem:** jogador autenticado.
- **Interface/gatilho:** confirmação da exclusão nas configurações.
- **Entrada:** reautenticação Google e confirmação destrutiva.
- **Comportamento:** a aplicação revoga o acesso e agenda a exclusão dos crafts e
  dados pessoais.
- **Saída:** confirmação imediata da solicitação e conclusão em até 24 horas.
- **Exceções:** falha mantém a solicitação visível e permite tentar novamente sem
  afirmar que os dados já foram apagados.

### RF-14 — Operar dados e planejamento

- **Quem:** administrador autorizado.
- **Interface/gatilho:** painel administrativo.
- **Entrada:** ações de importar, validar, publicar ou reativar dataset; consultar
  snapshots, filas e falhas.
- **Comportamento:** toda ação privilegiada é validada no servidor e auditada.
- **Saída:** liga ativa, versão ativa, última importação, snapshot atual, idade do
  snapshot, fila, jobs com falha e resultado de rollback.
- **Exceções:** usuário comum recebe estado sem permissão; conteúdo de craft só é
  aberto em suporte autorizado e gera evento de auditoria.

### RF-15 — Controlar o custo operacional

- **Quem:** sistema e administrador.
- **Interface/gatilho:** consumo mensal aproximando-se de US$10.
- **Entrada:** métricas de consumo e cotas dos provedores.
- **Comportamento:** a aplicação desativa novos OCRs primeiro e, se a projeção
  continuar acima da meta, pausa novos jobs de planejamento.
- **Saída:** histórico permanece acessível e novas ações explicam a indisponibilidade.
- **Exceções:** não existe promessa de continuidade de operações pagas depois que
  o limite operacional é atingido.

## 6. Regras de negócio

- **RN-01:** o crafting engine determinístico é a única autoridade sobre a
  legalidade e os resultados possíveis de uma operação.
- **RN-02:** IA não participa do MVP; uma futura integração não poderá substituir
  a validação determinística.
- **RN-03:** nenhum plano é exibido se algum passo, transição, retry ou restart não
  tiver sido validado pelo engine.
- **RN-04:** cada plano permanece vinculado à liga, à versão de game data e ao
  snapshot de preços usados na geração.
- **RN-05:** uma atualização de dados ou preços não modifica silenciosamente um
  plano existente.
- **RN-06:** cada evento de gasto conserva as moedas informadas e o valor em chaos
  calculado naquele momento; taxas futuras não recalculam o histórico.
- **RN-07:** estratégias equivalentes ou inviáveis são omitidas, mesmo que isso
  produza menos de quatro opções.
- **RN-08:** retries e restarts acrescentam eventos; nunca removem tentativas ou
  gastos anteriores.
- **RN-09:** uma mecânica recém-lançada permanece não suportada até possuir módulo
  determinístico e fixtures de regressão.
- **RN-10:** o dataset ativo só muda após normalização, validação, indexação e
  testes; rollback reativa uma versão imutável anterior.
- **RN-11:** o planejador usa o cache normalizado da aplicação e nunca consulta
  poe.ninja durante um job.
- **RN-12:** se a atualização diária falhar, o último snapshot válido continua em
  uso e seu horário exato fica visível; sem snapshot, o custo automático é
  indisponível.
- **RN-13:** crafts anônimos sem atividade por 30 dias são excluídos; crafts
  vinculados ao Google permanecem até a exclusão da conta.
- **RN-14:** administradores são contas Google incluídas manualmente; nenhum
  usuário se promove sozinho.
- **RN-15:** o conteúdo de um craft é privado; acesso administrativo exige um caso
  de suporte autorizado e um registro de auditoria.
- **RN-16:** o sistema não garante que um craft probabilístico termine no número
  esperado de tentativas nem dentro do custo esperado.

## 7. Dados e arquivos

| Dado/arquivo             | Formato                          | Origem                       | Obrigatório                                  | Armazenamento e prazo                                                   | Alteração/exclusão                                             | Sensível                                  |
| ------------------------ | -------------------------------- | ---------------------------- | -------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------- |
| Texto do item            | Texto PoE 1 em inglês, até 20 KB | Clipboard do jogador         | Uma fonte de importação                      | Processamento no backend; normalizado no craft                          | Corrigível antes do planejamento; segue retenção do craft      | Conteúdo privado do usuário               |
| Screenshot               | PNG/JPEG/WebP, até 8 MB          | Upload do jogador            | Uma fonte de importação                      | Cloud Storage por no máximo 24 horas                                    | Excluído automaticamente                                       | Sim; acesso restrito ao dono e ao serviço |
| Item-alvo                | JSON normalizado e versionado    | Parser mais confirmação      | Sim                                          | Firestore; segue retenção do craft                                      | Nova confirmação cria revisão                                  | Conteúdo privado do usuário               |
| Craft e versões do plano | Documentos e subcoleções         | Planner                      | Sim                                          | Firestore; 30 dias sem atividade para anônimos ou até exclusão da conta | Plano publicado é imutável; recálculo cria versão              | Conteúdo privado do usuário               |
| Eventos de execução      | Documentos append-only           | Jogador                      | Durante a execução                           | Firestore; segue retenção do craft                                      | Não são sobrescritos por retry, restart ou recálculo           | Conteúdo privado do usuário               |
| Dataset de game data     | JSON comprimido e manifesto      | RePoE via adaptador          | Sim                                          | Cloud Storage; versões referenciadas são preservadas                    | Publicação imutável e ativação atômica                         | Não                                       |
| Metadados do dataset     | Documentos versionados           | Pipeline de importação       | Sim                                          | Firestore enquanto a versão puder ser usada ou sofrer rollback          | Apenas operação administrativa                                 | Não                                       |
| Snapshot de preços       | JSON normalizado em chaos        | poe.ninja ou override manual | Não para regras; sim para custo automático   | Snapshot imutável preservado enquanto referenciado                      | Não altera planos históricos                                   | Não                                       |
| Planning job             | Documento de estado              | Backend                      | Sim para busca assíncrona                    | Firestore; associado ao craft                                           | Handlers idempotentes atualizam somente a progressão permitida | Não contém segredo                        |
| Identidade               | UID e dados mínimos do Google    | Firebase Authentication      | Não para iniciar; sim para histórico durável | Firebase Auth e referência no Firestore até exclusão                    | Exclusão autônoma em até 24 horas                              | Sim                                       |
| Auditoria de suporte     | Metadados de ator, ação e craft  | Painel administrativo        | Quando houver acesso privilegiado            | Armazenada com o craft e segue sua retenção                             | Append-only                                                    | Sim; não copia o conteúdo do craft        |

## 8. Integrações e dependências

| Integração/dependência                | Finalidade                                                | Comportamento em falha                                                  |
| ------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------- |
| Firebase Authentication               | Sessão anônima e login Google                             | Preservar a sessão atual, explicar a falha e não misturar identidades   |
| Cloud Firestore                       | Crafts, passos, versões, preços e jobs                    | Manter edição ainda não enviada na página e não confirmar persistência  |
| Cloud Storage                         | Screenshots e datasets imutáveis                          | Impedir a operação dependente e manter recursos já publicados           |
| Cloud Functions 2nd gen e task queues | Parsing, planejamento, simulação, importação e manutenção | Classificar falha como recuperável ou definitiva; handlers idempotentes |
| Firebase App Check                    | Reduzir abuso de operações caras                          | Bloquear chamadas protegidas em produção e mostrar erro recuperável     |
| RePoE                                 | Matéria-prima de game data                                | Manter a versão ativa anterior; nunca ativar importação parcial         |
| poe.ninja                             | Preços e catálogo de ligas PC disponíveis                 | Manter último snapshot e horário visível; permitir preços manuais       |
| Cloud Vision                          | Extrair texto de screenshots                              | Manter importação por texto; não ultrapassar 1.000 imagens mensais      |
| APIs da GGG                           | Nenhuma                                                   | Não integrar nem depender delas no MVP                                  |

## 9. Interface e estados

| Tela ou componente        | Carregando                                                                   | Vazio                                             | Sucesso                                           | Erro                                                           | Sem permissão                       | Navegação por teclado                                 |
| ------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------- |
| Início / novo craft       | Carregar ligas e sessão com indicador                                        | Explicar como importar o primeiro item            | Abrir wizard com liga selecionada                 | Permitir continuar com preços manuais quando o catálogo falhar | Não se aplica                       | Ordem: liga, texto/upload, continuar                  |
| Confirmação do item       | Exibir progresso do parser/OCR                                               | Solicitar nova fonte válida                       | Mostrar todos os campos e modificadores editáveis | Identificar campo, formato ou limite que falhou                | Somente o dono acessa o draft       | Campos e classificações acessíveis sem arrastar       |
| Preferências              | Não se aplica                                                                | Explicar por que não há mecânica aplicável        | Mostrar objetivo, exclusões e preços              | Bloquear combinação sem espaço de busca                        | Somente o dono altera               | Grupos, checkboxes e ação final em ordem lógica       |
| Progresso do planner      | Mostrar estado `queued`, `validating`, `searching`, `simulating` ou `saving` | Não se aplica                                     | Navegar para comparação                           | Exibir causa, retry quando permitido e retorno à edição        | Somente o dono acompanha            | Atualizações anunciadas sem roubar foco               |
| Comparação de estratégias | Carregar planos com esqueleto                                                | Explicar que nenhum caminho válido foi encontrado | Comparar custo, P90, passos e risco               | Preservar job e permitir retorno                               | Somente o dono acessa               | Seleção e detalhes totalmente operáveis por teclado   |
| Execução                  | Carregar plano e histórico                                                   | Não se aplica                                     | Destacar passo atual e totais                     | Manter edição local e indicar não sincronizado                 | Somente o dono altera               | Ações de resultado têm foco visível e rótulo completo |
| Resumo                    | Carregar agregados                                                           | Não se aplica                                     | Exibir estimado versus real                       | Identificar métricas indisponíveis                             | Somente o dono acessa               | Conteúdo segue hierarquia de títulos e leitura linear |
| Histórico                 | Carregar crafts da conta                                                     | Orientar a criar ou vincular o primeiro craft     | Listar por atualização                            | Permitir tentar novamente                                      | Exige Google                        | Linhas e ações acessíveis por teclado                 |
| Conta                     | Carregar identidade                                                          | Não se aplica                                     | Vincular Google ou solicitar exclusão             | Não afirmar vínculo/exclusão antes da confirmação              | Exige Google para exclusão de conta | Confirmação destrutiva com foco controlado            |
| Administração             | Carregar diagnósticos                                                        | Mostrar ausência real de jobs/falhas              | Exibir versões, preços, fila e ações              | Preservar versão ativa em qualquer falha                       | Estado 403 sem dados operacionais   | Tabelas, filtros e diálogos acessíveis por teclado    |

## 10. Plataformas e distribuição

- **Dispositivos e navegadores:** web responsiva a partir de 360 px; duas versões
  mais recentes de Chrome, Edge, Firefox e Safari; Chrome e Safari móveis.
- **Forma de entrega:** SPA no Firebase Hosting, com APIs e jobs no Firebase;
  ambientes separados para desenvolvimento, staging e produção.
- **Instalação e atualização:** acesso pelo navegador; sem instalação, PWA ou
  atualização manual no MVP.
- **Uso sem conexão:** não suportado; a interface informa a perda de conexão e
  mantém alterações não enviadas apenas enquanto a página permanecer aberta.

## 11. Restrições e requisitos de qualidade

- **Acessibilidade da interface:** conformidade WCAG 2.2 nível AA em todas as
  variações responsivas; operação por teclado, foco visível, nomes acessíveis,
  mensagens de estado anunciadas e informação nunca transmitida apenas por cor.
- **Idiomas:** interface, texto importado e screenshot somente em inglês.
- **Desempenho:** 90% dos jobs de planejamento terminam em até 60 segundos; aos
  cinco minutos o job encerra com erro recuperável. No percentil 75 de mobile e
  desktop, LCP deve ser no máximo 2,5 s, INP no máximo 200 ms e CLS no máximo 0,1.
- **Privacidade e acesso:** crafts privados; screenshots por até 24 horas; acesso
  administrativo ao conteúdo somente com suporte autorizado e auditado.
- **Portabilidade:** engine, planner, simulator, pricing e poe-data não dependem
  de handlers Firebase e podem ser executados e testados como packages TypeScript.
- **Responsividade visual:** criação e comparação priorizam desktop; a execução
  continua integralmente utilizável a partir de 360 px.
- **Custo operacional:** meta de no máximo US$10 por mês durante o piloto, com
  degradação das operações caras na ordem definida pelo RF-15.
- **Prazo:** não existe data fixa; cada marco depende dos seus testes e critérios
  de correção.

## 12. Critérios de sucesso

| Indicador               | Meta                                   | Como medir                                | Quando avaliar                     |
| ----------------------- | -------------------------------------- | ----------------------------------------- | ---------------------------------- |
| Participantes do piloto | 20 jogadores distintos                 | Contas participantes do piloto            | Antes do lançamento público        |
| Crafts concluídos       | Pelo menos 50                          | Crafts que atingiram o estado `completed` | Antes do lançamento público        |
| Utilidade percebida     | Pelo menos 80% de avaliações positivas | Pergunta objetiva ao concluir o craft     | Ao atingir 50 crafts               |
| Legalidade dos passos   | Zero passo ilegal confirmado           | Triagem de relatos e reprodução no engine | Durante todo o piloto              |
| Latência do planner     | 90% em até 60 segundos                 | Métricas entre `queued` e estado terminal | Semanalmente no piloto             |
| Orçamento operacional   | Até US$10 por mês                      | Billing e métricas dos provedores         | Diariamente e no fechamento mensal |

## 13. Critérios de aceite

- **CA-01:** Dado um texto válido do cliente inglês com até 20 KB, quando o
  jogador o importa, então todos os campos reconhecidos são mostrados para
  confirmação antes do planejamento.
- **CA-02:** Dada uma imagem PNG, JPEG ou WebP válida com até 8 MB e cota
  disponível, quando o jogador a envia, então o texto extraído passa pelo mesmo
  parser e a imagem é excluída em até 24 horas.
- **CA-03:** Dado um modificador importado, quando o jogador configura o alvo,
  então deve escolher exatamente `Required`, `Optional` ou `Ignore`.
- **CA-04:** Dado um alvo impossível ou dependente de mecânica não validada,
  quando o planejamento é solicitado, então nenhum plano é exibido e os motivos
  são apresentados para correção.
- **CA-05:** Dado um alvo suportado, quando o job termina, então toda estratégia
  exibida contém apenas transições validadas e informa passos, sucesso, retry,
  restart, probabilidades, tentativas e custo disponível.
- **CA-06:** Dadas estratégias equivalentes ou inviáveis, quando os resultados
  são comparados, então elas são omitidas e a interface pode mostrar menos de
  quatro opções.
- **CA-07:** Dado um snapshot diário válido, quando o plano é salvo, então liga,
  horário e identificador do snapshot permanecem vinculados à versão do plano.
- **CA-08:** Dada uma falha do poe.ninja, quando existe snapshot anterior, então
  o planner o utiliza e mostra seu horário; sem snapshot, o custo fica
  indisponível e aceita override manual.
- **CA-09:** Dado um retry ou restart, quando o jogador registra o resultado,
  então tentativas e gastos anteriores continuam no histórico.
- **CA-10:** Dado um craft iniciado, quando o jogador solicita recálculo, então
  uma nova versão é criada sem modificar a versão nem os eventos anteriores.
- **CA-11:** Dado um craft anônimo, quando o jogador vincula sua sessão ao Google,
  então o craft aparece no histórico privado da conta sem duplicação.
- **CA-12:** Dada uma conta autenticada, quando a exclusão é confirmada após
  reautenticação, então o acesso é revogado e os dados são apagados em até 24
  horas.
- **CA-13:** Dado um usuário não administrador, quando abre a rota administrativa,
  então nenhum diagnóstico ou conteúdo operacional é retornado.
- **CA-14:** Dada uma conta administrativa autorizada, quando acessa conteúdo de
  um craft para suporte, então a autorização é exigida e um evento de auditoria
  é criado.
- **CA-15:** Dado consumo próximo de US$10 no mês, quando a proteção de custo é
  acionada, então novos OCRs são bloqueados antes dos jobs e o histórico continua
  acessível.
- **CA-16:** Dado um job ainda não terminal, quando alcança cinco minutos, então
  termina com erro recuperável e não deixa um plano parcialmente publicado.
- **CA-17:** Dadas as versões de navegador suportadas e largura de 360 px, quando
  o fluxo crítico é executado por teclado, então todas as ações permanecem
  alcançáveis, com foco visível e feedback anunciado.

## 14. Não escopo

- Path of Exile 2, ligas históricas e economia específica de consoles.
- Importação de texto ou screenshots em idioma diferente do inglês.
- Itens únicos como alvo de estratégia.
- Automação do cliente do jogo, compra automática ou acesso a APIs da GGG.
- Garantia de sucesso dentro do número ou custo esperados.
- Busca de rares arbitrários e parcialmente craftados como ponto inicial no trade.
- Inventário pessoal e orçamento máximo como restrições do planejador.
- IA ativa, funcionamento offline e instalação como PWA.
- Login por email, senha ou link mágico.
- Links públicos, compartilhamento privado e estratégias comunitárias.
- Exportação do plano como Markdown ou imagem.
- Importação direta de uma listagem de trade.
- Definição de alvo somente por modificadores digitados, sem item importado.
- Suporte a mecânica recém-lançada antes de módulo e fixtures determinísticos.

## 15. Decisões e motivos

| Decisão                | Escolha                                  | Motivo                                           | Alternativa descartada                           |
| ---------------------- | ---------------------------------------- | ------------------------------------------------ | ------------------------------------------------ |
| Escopo inicial         | MVP amplo para itens não únicos          | Entregar a proposta completa aprovada            | Corte vertical restrito a Alteration/Regal/bench |
| Autoridade de crafting | Engine determinístico                    | Impedir operações inventadas ou ilegais          | IA como autoridade de regras                     |
| Estratégias            | Até quatro opções distintas              | Comparar custo, variância e risco sem duplicação | Sempre mostrar quatro ou apenas uma              |
| Arquitetura            | Monorepo pnpm com Firebase e packages    | Separar domínio, UI, jobs e integrações          | Permanecer como SPA local do template            |
| Interface              | Tailwind e shadcn/ui na arquitetura-alvo | Escolha aprovada para o produto                  | Manter o kit visual atual após a migração        |
| Entrada                | Texto e screenshot em inglês             | Cobrir os dois fluxos desejados com confirmação  | Texto somente ou todos os idiomas                |
| OCR                    | Cloud Vision com 1.000 imagens/mês       | Manter custo previsível no piloto                | OCR local ou uso sem limite                      |
| IA                     | Fora do MVP                              | Preservar orçamento e determinismo               | IA heurística paga durante o piloto              |
| Preços                 | poe.ninja diário e override manual       | GGG indisponível para o projeto                  | APIs da GGG ou atualização a cada 15 minutos     |
| Game data              | RePoE normalizado e versionado           | Isolar a fonte externa do contrato do engine     | Dataset manual ou apenas fontes da GGG           |
| Autenticação           | Anônimo e Google                         | Começo imediato com histórico opcional           | Login obrigatório ou email/senha                 |
| Compartilhamento       | Planos privados                          | Reduzir exposição e escopo                       | Links públicos no MVP                            |
| Uso offline            | Não suportado                            | Backend e dados versionados são necessários      | Execução offline ou PWA                          |
| Orçamento              | Até US$10/mês no piloto                  | Limite definido pelo responsável pelo produto    | US$100 ou mais sem degradação                    |
| Lançamento             | Piloto privado antes do público          | Medir utilidade e legalidade em uso real         | Beta público imediato                            |

## 16. Decisões em aberto

Nenhuma.
