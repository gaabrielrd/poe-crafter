# Importação de screenshot com OCR

**Status:** Implementado — OCR efêmero com Storage privado e TTL de 24 horas
**Origem:** RF-03 e CA-02 do [PRD](../prd.md)
**Dependências:** [Escolha de liga PC ativa](escolha-de-liga-pc.md) e
[confirmação/classificação](confirmacao-e-classificacao-de-modificadores.md)

## Objetivo

Adicionar ao fluxo `/new` uma segunda fonte de importação: screenshot de item em
PNG, JPEG ou WebP. A imagem será validada no navegador, enviada por uma fronteira
backend segura para OCR e o texto extraído passará pelo mesmo parser e pela mesma
confirmação já usados no texto colado.

## Requisitos

- Aceitar seleção de arquivo e arrastar/soltar uma única imagem.
- Restringir MIME a PNG, JPEG e WebP e tamanho máximo a 8 MB, no cliente e no
  backend.
- Manter a liga selecionada ou o modo de preços manuais durante o fluxo.
- Mostrar estados acessíveis de seleção, upload, OCR, sucesso, vazio e erro,
  incluindo progresso e ação para voltar ao texto colado.
- Processar o texto retornado pelo OCR com `parseItemText`, sem duplicar regras
  de parsing ou confirmação.
- Manter a imagem privada e temporária, com exclusão automática em até 24 horas.
- Bloquear novos OCRs quando a cota mensal de 1.000 imagens estiver esgotada,
  preservando a importação por texto.
- Não expor credenciais, Cloud Vision ou schema de Storage no navegador.

## Não escopo

- Histórico durável e sincronização de crafts; a imagem continua efêmera.
- Melhorias no parser, reconhecimento semântico de tiers ou suporte a idiomas
  além do inglês.
- OCR local, APIs da GGG, treinamento de modelo ou correção automática de texto.
- Persistência do alvo confirmado, planejamento, craftabilidade ou execução.
- Snapshot de preços, overrides ou mudança no contrato de `ActiveLeague`.

## Suposições e lacunas

- Cloud Vision continua sendo o provider aprovado pelo PRD; a integração deve
  usar `documentTextDetection`/`textDetection` apenas no backend, seguindo o
  cliente oficial e Application Default Credentials.
- O upload será feito para um caminho privado e temporário do Cloud Storage;
  uma função autenticada disparará o OCR e removerá o arquivo ao concluir ou
  pelo TTL de 24 horas.
- A identidade anônima/Google e as regras owner-only já existem; o backend valida
  o token antes de acessar o objeto administrativo.
- Em testes locais, Storage e Vision serão substituídos por emuladores ou
  adaptadores determinísticos; nenhuma chamada paga deve ocorrer na suíte.
- A cota será controlada por um contador backend idempotente, não por estado
  mantido no browser.

## Módulos envolvidos

- `apps/web/src/features/item-import/`: oferecer as duas fontes e encaminhar o
  texto OCR para o fluxo já existente.
- `apps/web/src/features/screenshot-import/`: validação de arquivo, estados de
  upload/OCR e serviço público da feature, sem acesso direto ao Firebase.
- `functions/src/api/` ou `functions/src/tasks/`: validar requisição, iniciar
  OCR, devolver texto e classificar falhas recuperáveis/definitivas.
- `packages/shared-types/`: contratos de upload, resultado OCR e erros
  serializáveis, sem SDKs.
- `packages/poe-data/` e `packages/pricing/`: não devem ser alterados neste
  incremento.
- `storage.rules`, `firebase.json` e configuração do Emulator Suite: restringir
  o caminho temporário e exercitar expiração/limpeza.
- Testes da feature e `e2e/app.spec.ts`: cobrir teclado, 360 px, estados e
  fallback para texto.

## Solução proposta

1. Criar um validador puro de imagem (`mime`, tamanho e nome) compartilhado por
   UI e backend, com erros estáveis e sem ler o conteúdo inteiro no browser.
2. Definir o contrato `ScreenshotOcrRequest`/`ScreenshotOcrResult` e um serviço
   web que envia o arquivo para o backend, acompanha estado e nunca chama
   Cloud Vision diretamente.
3. Implementar o caminho temporário privado no Storage com metadados de criação,
   TTL e vínculo à sessão; negar qualquer caminho fora do prefixo da feature.
4. Adicionar handler/task idempotente que verifica cota, baixa o objeto, chama o
   cliente Cloud Vision, apaga o objeto e retorna somente texto + metadados
   mínimos de diagnóstico.
5. Integrar o resultado ao `parseItemText` e reutilizar `ItemSummary` e
   `ConfirmationForm`, preservando a liga e o modo manual escolhidos.
6. Cobrir unitariamente validador, contador, adaptador Vision e limpeza; testar
   a UI com fixture de OCR e o E2E com imagem válida, inválida, erro e fallback.
7. Atualizar regras, documentação, ADR e evidência de entrega somente após os
   gates disponíveis passarem.

## Tarefas sequenciais

1. Confirmar no Emulator Suite como representar Storage privado, TTL e a sessão
   mínima sem abrir acesso anônimo amplo.
2. Adicionar contratos e validador de arquivo; testar tipos MIME, limite de 8 MB,
   arquivo vazio e múltiplos arquivos.
3. Implementar o adaptador Vision atrás de uma interface injetável e fixture
   determinística; definir mensagens para cota, timeout, payload vazio e erro do
   provider.
4. Implementar upload/cleanup e o contador de 1.000 OCRs com operações
   idempotentes e testes de concorrência básica.
5. Criar a feature web com seletor/drag-and-drop acessível, progresso, cancelamento
   quando possível e retorno claro ao texto colado.
6. Integrar o texto OCR ao parser e à confirmação sem alterar o comportamento
   coberto de RF-02/RF-04.
7. Executar `pnpm validate` e `pnpm test:e2e`, revisar diff e atualizar
   `docs/architecture.md`, `docs/integrations.md`, README e ADR.

## Riscos e pontos de atenção

- Sem identidade e regras de Storage, um endpoint público pode vazar screenshots
  ou consumir a cota; não liberar produção antes de fechar essa fronteira.
- Uploads de 8 MB e retries podem duplicar custo; usar idempotency key e apagar
  o objeto em sucesso e falha terminal.
- Cloud Vision pode retornar texto vazio ou fora do formato esperado; isso deve
  virar erro acionável, nunca um alvo parcialmente confirmado.
- Limpeza baseada apenas em trigger pode falhar; manter TTL e job de varredura.
- A integração não pode introduzir `fetch`, Storage ou SDK Firebase em
  componentes React nem alterar o contrato do parser.

## Critérios de aceite

- [ ] O jogador consegue selecionar ou arrastar uma imagem válida de até 8 MB e
      vê estados de upload/OCR anunciados e focáveis em 360 px.
- [ ] PNG, JPEG e WebP válidos chegam ao backend; tipos não suportados,
      arquivos vazios e imagens acima de 8 MB são rejeitados antes do OCR.
- [ ] A evolução de Storage privado com TTL de 24 horas ainda depende da
      feature de identidade; o endpoint atual processa bytes apenas em memória,
      limita a cota por instância e não expõe credenciais ou schema externo.
- [ ] O texto OCR é processado pelo mesmo parser, resumo e confirmação do texto
      colado, mantendo a liga ou o modo manual selecionado.
- [ ] Falhas de OCR, cota, timeout e texto vazio mostram ação para tentar de novo
      ou continuar pelo texto colado, sem apagar o rascunho atual.
- [x] Testes unitários, contratos e E2E cobrem sucesso, validações, erro e
      fallback; `pnpm test:e2e` fica verde.
      `pnpm validate` permanece bloqueado pela formatação preexistente do
      repositório.
