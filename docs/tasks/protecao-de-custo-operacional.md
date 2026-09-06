# Proteção de custo operacional

**Status:** Implementado em 2026-09-06  
**PRD:** RF-15 / CA-15  
**Dependências:** [importação de screenshot com OCR](importacao-de-screenshot-com-ocr.md), [geração e comparação de estratégias](geracao-e-comparacao-de-estrategias.md)

## Contexto

O OCR já possui uma cota mensal de 1.000 imagens, mas não há uma proteção
unificada para o orçamento operacional de US$10/mês. O planner desta etapa é
local, porém o fluxo precisa exercitar a mesma fronteira antes de iniciar um
job para que a futura fila persistida não possa contorná-la.

## Objetivo

Registrar reservas idempotentes de operações pagas em um ledger mensal privado,
bloquear novos OCRs quando o consumo projetado se aproximar do limite e
bloquear novos jobs de planejamento somente quando o orçamento restante também
for insuficiente. O histórico e as telas já concluídas continuam acessíveis.

## Requisitos

- Manter um ledger `ops/operationalUsage-{YYYY-MM}` com custo estimado, reservas
  idempotentes por `requestId`, contagem por operação e horário da atualização.
- Ler orçamento e custos unitários somente em Functions, com defaults de US$10,
  OCR US$0,01 e planejamento US$0,10; permitir override por ambiente sem
  expor valores secretos ao bundle.
- Bloquear OCR a partir de 80% do orçamento projetado e planejamento a partir
  de 100%; uma reserva repetida deve devolver o mesmo resultado sem cobrar duas
  vezes.
- Expor `POST /api/operations/cost-guard` para reservar planejamento com bearer
  Firebase válido; rejeições devem informar operação bloqueada e limite, sem
  revelar documentos de Firestore.
- Integrar o gate ao OCR antes do provider e ao botão de gerar estratégias;
  fixture/local sem API continua determinístico, mas produção não inicia o job
  quando o backend nega a reserva.
- Exibir erro recuperável e manter histórico/resultado já existente quando uma
  nova operação for bloqueada.

## Não escopo

- Integração direta com Billing, Cloud Monitoring ou preço real por chamada.
- Alteração da cota de 1.000 imagens, dos dados históricos ou do planner puro.
- Cancelamento ou cobrança retroativa de reservas já confirmadas.
- Bloqueio de leitura, histórico privado, suporte administrativo ou ações de
  dataset.

## Suposições

- O custo unitário configurável é uma estimativa operacional conservadora até a
  integração de métricas reais.
- A prioridade de degradação é OCR antes de planejamento, conforme RF-15.
- `requestId` do upload e um identificador estável do job impedem duplicação em
  retries; o caller deve reutilizá-los.

## Proposta de solução

1. Criar modelo puro de operações, thresholds, configuração e resposta do gate.
2. Criar `FirestoreOperationalBudget` com transação mensal e ledger privado.
3. Adicionar `checkCostGuard` em Functions, rewrite e service web autenticado.
4. Reservar OCR no handler antes de chamar Vision e reservar planejamento antes
   de `runPlannerJob`, preservando o bypass fixture/local já usado nos testes.
5. Cobrir modelo, transação fake, mapeamento HTTP, OCR bloqueado e estados da
   tela de planejamento.
6. Atualizar arquitetura, integrações, README, ADR, task e entrega após
   `pnpm validate`.

## Tarefas sequenciais

- [x] Definir contrato puro, defaults e thresholds de degradação.
- [x] Implementar ledger transacional e endpoint de reserva.
- [x] Integrar OCR e planejamento ao gate sem duplicar reservas.
- [x] Cobrir bloqueio, idempotência, erros e recuperação na interface.
- [x] Atualizar documentação e registrar evidência.
- [x] Executar `pnpm validate`, revisar diff e procurar segredos ou dados de
      uso expostos ao cliente.

## Riscos

- Um ledger sem chave idempotente cobraria retries duplicados; toda reserva deve
  usar transação e `requestId`.
- Colocar o orçamento em `import.meta.env` permitiria adulteração; somente o
  backend decide.
- Bloquear planejamento antes de OCR violaria a ordem do PRD; thresholds devem
  ser testados explicitamente.
- O planner local não possui job persistido; a integração deve falhar fechada
  apenas quando houver API configurada e manter o fixture determinístico.

## Critérios de aceite

- [x] Em consumo projetado de pelo menos US$8, uma nova reserva de OCR é
      negada antes do provider e a importação por texto continua disponível.
- [x] Reservas repetidas do mesmo `requestId` não aumentam custo nem contagem.
- [x] Enquanto OCR estiver bloqueado, planejamento permanece permitido até o
      orçamento atingir US$10; depois novas reservas de ambos são negadas.
- [x] Usuário vê mensagem recuperável, sem perder histórico ou resultado
      anterior, e o planner não inicia quando o gate responde bloqueado.
- [x] Testes, documentação e `pnpm validate` ficam verdes.
