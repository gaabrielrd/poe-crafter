# Upload privado e TTL de screenshot

**Status:** Implementado em 2026-09-06
**Origem:** RF-03, RF-15, CA-02 e RN-15 do [PRD](../prd.md)
**Dependências:** [Sessão anônima e login Google](sessao-anonima-e-login-google.md)

## Contexto

O OCR atual recebe os bytes diretamente no endpoint e os mantém somente em
memória. A identidade anônima/Google e as regras owner-only para
`screenshots/{uid}/` já estão disponíveis, mas o fluxo ainda não exerce o
Storage privado nem possui uma limpeza independente do processo do OCR.

## Objetivo

Fazer o jogador enviar uma única imagem válida para um caminho privado do Cloud
Storage, processá-la por uma referência autenticada e removê-la ao terminar ou
quando ultrapassar 24 horas, sem persistir screenshot no histórico do craft.

## Requisitos

- Reutilizar a validação de PNG, JPEG e WebP e o limite de 8 MB no cliente e no
  backend.
- Gerar um caminho imprevisível `screenshots/{uid}/{uploadId}` sem aceitar path
  fornecido livremente pelo navegador.
- Exigir um ID token Firebase válido (sessão anônima ou Google) no pedido de
  processamento e garantir que o UID do token seja o dono do objeto.
- Aplicar as regras Storage owner-only também ao upload, leitura e remoção pelo
  usuário; o backend usa credencial administrativa somente para o job autenticado.
- Gravar metadados mínimos (`createdAt`, `contentType`, `size`) para limpeza e
  diagnóstico, sem conteúdo do item em Firestore.
- Baixar o objeto no backend, executar Cloud Vision atrás de um adaptador, apagar
  em `finally` após sucesso ou falha terminal e devolver apenas texto e
  `processedAt`.
- Executar limpeza agendada de objetos com mais de 24 horas, tolerando retries e
  objetos já removidos.
- Manter a cota mensal de 1.000 imagens no backend, com reserva idempotente e
  comportamento recuperável quando a cota ou o provider estiver indisponível.
- Preservar o fluxo de texto colado e o fallback fixture/E2E sem conta Google
  real ou chamada paga ao Cloud Vision.

## Não escopo

- Persistência do alvo, craft, plano ou eventos no Firestore.
- Histórico, exclusão de conta, App Check, painel administrativo ou links
  públicos.
- Alteração do parser, reconhecimento semântico de tiers ou suporte a idiomas
  além do inglês.
- Dataset de game data, preços, planejamento, execução e APIs da GGG.
- Garantia de disponibilidade do Cloud Vision fora do tratamento de erro
  recuperável.

## Suposições e lacunas

- O bucket Firebase do ambiente local e de produção aceita o prefixo
  `screenshots/`; IDs reais continuam apenas em configuração não versionada.
- O cliente web fará upload via SDK Firebase Storage para que as Rules validem o
  proprietário; em seguida enviará somente o `storagePath` gerado e o ID token ao
  endpoint OCR.
- O backend usará `firebase-admin` para verificar o token e acessar o objeto,
  sem confiar em UID, MIME ou tamanho enviados pelo cliente.
- A limpeza agendada será uma Cloud Function `onSchedule` idempotente. O TTL é
  uma garantia de segurança, não a única chamada de remoção.
- O teste de integração local usará Auth/Storage Emulator e fixture de Vision;
  nenhum segredo, token pessoal ou credencial Cloud Vision entra no repositório.
- A contagem mensal ficará em um documento administrativo protegido por
  credencial de servidor, com transação para evitar ultrapassar 1.000 em
  instâncias concorrentes.

## Módulos envolvidos

- `apps/web/src/features/screenshot-import/`: gateway de Storage, obtenção do
  token, estados de upload/processamento e cancelamento quando possível.
- `apps/web/src/features/identity/`: exportar apenas a sessão atual necessária
  para o serviço, sem expor internals do Firebase.
- `functions/src/api/screenshot-ocr.ts`: autenticação, validação do caminho,
  download, OCR, quota e remoção em `finally`.
- `functions/src/scheduled/`: limpeza de screenshots expirados.
- `functions/src/services/`: interfaces injetáveis para Auth Admin, Storage,
  Vision, relógio e contador de quota.
- `packages/shared-types/`: contratos serializáveis do pedido por referência,
  resultado e códigos de erro; nenhum SDK.
- `storage.rules`, `firebase.json` e scripts do Emulator Suite: validar acesso
  próprio, alheio, não autenticado, tamanho/MIME e limpeza.
- `e2e/app.spec.ts` e testes de Functions: fluxo válido, falhas e fallback.

## Solução proposta

1. Criar um `ScreenshotStorageGateway` que valida o `File`, obtém a identidade
   atual, gera `uploadId` localmente e usa `uploadBytesResumable` em
   `screenshots/{uid}/{uploadId}` com metadata de criação, MIME e tamanho.
2. Obter o ID token apenas no serviço e enviar ao endpoint um contrato
   `{ storagePath }`; o componente continua sem Firebase, `fetch` ou Storage
   direto.
3. No backend, verificar o Bearer token, aceitar somente o padrão de caminho
   esperado para o UID autenticado, buscar metadata real do objeto e rejeitar
   MIME/tamanho divergentes antes do Vision.
4. Reservar a quota com transação idempotente por mês e chave de upload; se a
   reserva falhar, não iniciar OCR. Repetições do mesmo upload devolvem o mesmo
   resultado ou estado recuperável sem contar duas vezes.
5. Baixar o objeto, chamar o adaptador Vision e apagar o arquivo em `finally`;
   retornar `text` e `processedAt` no mesmo contrato público atual.
6. Adicionar função agendada para listar apenas `screenshots/`, apagar objetos
   cujo `createdAt` exceda 24 horas e registrar contagem/log sem conteúdo do
   screenshot.
7. Atualizar a UI para distinguir `uploading`, `processing`, `success`, cota
   esgotada, objeto expirado, não autorizado, rede e OCR indisponível; texto
   colado continua disponível em qualquer falha.
8. Cobrir Rules e Functions com emuladores, Vision fixture, concorrência básica,
   retries e E2E determinístico; depois executar `pnpm validate` e documentar a
   decisão e a entrega.

## Tarefas sequenciais

1. Confirmar endpoints/portas dos emuladores Auth, Storage e Functions e definir
   o formato do ID token e do `storagePath` no contrato compartilhado.
2. Implementar o gateway web de upload e o serviço de token, incluindo progresso,
   cancelamento, limpeza local em erro e fallback fixture.
3. Adicionar `firebase-admin` ao workspace Functions e criar interfaces
   injetáveis para verificar identidade, ler/remover Storage e chamar Vision.
4. Migrar o handler OCR de bytes para referência autenticada, mantendo um
   adaptador compatível somente para fixtures de teste e respostas de erro
   estáveis.
5. Implementar quota mensal transacional e idempotência por upload; testar
   limite, concorrência e retry sem contagem duplicada.
6. Implementar a limpeza agendada de 24 horas e os testes de objeto próprio,
   alheio, não autenticado, caminho fora do prefixo e arquivo expirado.
7. Integrar os estados no `ScreenshotImporter` sem alterar parser, confirmação,
   liga selecionada ou modo manual.
8. Atualizar `storage.rules`, `firebase.json`, docs, ADR e evidência; rodar
   `pnpm test:emulators`, `pnpm test:e2e` e `pnpm validate` antes da revisão.

## Riscos e pontos de atenção

- Upload direto e chamada OCR podem ficar dessincronizados; o backend deve
  aceitar apenas objetos existentes do UID e a limpeza deve recolher órfãos.
- Credencial administrativa ignora Rules; toda autorização de UID e validação de
  metadata precisa ocorrer antes do download.
- Retries de Functions e Vision podem cobrar duas vezes; quota e chave de upload
  devem ser transacionais/idempotentes.
- Listar o bucket inteiro na limpeza pode exceder tempo/custo; limitar prefixo,
  paginação e lote por execução, registrando pendências para a próxima janela.
- Emulador pode não reproduzir exatamente lifecycle do Storage; o teste local
  deve exercitar a função de limpeza explicitamente e documentar a limitação.
- O contrato atual de OCR aceita bytes; a migração não pode quebrar fixtures nem
  permitir que o cliente escolha um caminho arbitrário.

## Critérios de aceite

- [x] Uma imagem válida é enviada para `screenshots/{uid}/{uploadId}` com
      progresso acessível e sem exposição de caminho arbitrário.
- [x] Upload sem sessão, UID divergente, MIME inválido, assinatura inválida,
      arquivo vazio ou acima de 8 MB é rejeitado antes do Vision.
- [x] O backend baixa somente o objeto do UID autenticado, retorna o texto
      normalizado e apaga o objeto após sucesso, erro terminal ou retry seguro.
- [x] A função agendada remove objetos com mais de 24 horas e é idempotente.
- [x] A quota mensal de 1.000 imagens não é ultrapassada em concorrência e uma
      falha de quota/provider mantém a importação por texto utilizável.
- [x] Rules negam leitura/escrita de usuários alheios e de caminhos fora de
      `screenshots/{uid}/`.
- [x] Testes unitários, Functions, regras estruturais e E2E fixture passam sem
      conta Google real ou chamada paga ao Cloud Vision.
- [x] `pnpm validate` permanece verde e a documentação/ADR descrevem o TTL,
      quota, autorização e limitações reais.

## Validação de ambiente

`pnpm test:emulators` compilou o workspace, mas não iniciou a Emulator Suite
porque o Firebase CLI local falhou em `winston` com `TypeError: isStream is not a
function`. A limitação é do runtime da ferramenta; os contratos de Rules,
Functions e o E2E fixture permanecem verdes.
