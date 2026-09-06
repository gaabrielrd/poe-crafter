# Suporte administrativo auditado

**Status:** Implementado em 2026-09-06  
**PRD:** RF-14 / CA-14 / RN-15  
**Dependências:** [ações administrativas de dataset](acoes-administrativas-de-dataset.md), [persistência privada de crafts](persistencia-privada-e-historico-de-crafts.md)

## Contexto

O painel administrativo já restringe diagnóstico e ciclo de dataset a contas
Google autorizadas, mas ainda não existe um caminho para investigar um craft
privado. O cliente lê apenas crafts do próprio UID pelas regras Firestore; o
suporte precisa de uma fronteira de backend que autorize, registre o caso e só
então devolva o conteúdo solicitado.

## Objetivo

Permitir que um administrador autorizado informe um `craftId` e uma justificativa
de suporte, receba o craft privado uma única vez pela API e deixe um evento
append-only com ator, craft, ação, justificativa limitada e horário.

## Requisitos

- Exigir POST, bearer Firebase, provider `google.com` e UID em `POE_ADMIN_UIDS`
  antes de ler `crafts/*` ou escrever auditoria.
- Aceitar apenas IDs seguros e justificativa não vazia de até 500 caracteres;
  rejeitar payload inválido sem consultar Firestore.
- Ler o craft pelo Admin SDK e normalizar um contrato versionado antes de
  responder; documento inexistente retorna 404 sem criar auditoria de sucesso.
- Para acesso autorizado a craft existente, gravar evento em
  `ops/supportAuditEvents` na mesma transação lógica do acesso, sem copiar o
  conteúdo do craft para a auditoria.
- Exibir no `/admin` um formulário de suporte com estado de envio, erro, vazio,
  resultado e conteúdo formatado como texto; a UI nunca acessa Firestore direto.
- Não persistir craft, justificativa ou token no `localStorage`; limpar o
  resultado quando um novo pedido começar.

## Não escopo

- Editar, excluir, compartilhar ou alterar o craft do jogador.
- Busca por owner, listagem de todos os crafts ou exportação para arquivo.
- Auditoria de login, dataset ou custo; esses eventos pertencem a outros fluxos.
- Acesso para contas Google não autorizadas ou para suporte automatizado.

## Suposições

- O administrador informa o ID recebido do jogador; não haverá índice de busca
  nem exposição de lista de IDs.
- A justificativa é metadado operacional e não deve conter segredo; o limite e a
  mensagem da UI reduzem o risco, mas o backend continua validando.
- O contrato de craft existente é serializável e pode ser retornado como objeto
  somente após validação mínima de identidade, schema, título, alvo e timestamps.

## Proposta de solução

1. Criar modelo puro de payload, evento de auditoria e contrato de craft de
   suporte, com validação de IDs/justificativa e normalização segura.
2. Criar `requestAdminCraftSupport` em Functions usando `authenticateAdmin`,
   uma transação para leitura do craft e criação do evento, e rewrite Firebase.
3. Criar service/model web para o endpoint e uma seção `SupportAccess` na
   `AdminPage`, visível somente no diagnóstico autorizado.
4. Adicionar testes Functions/web para 401/403, payload inválido, 404,
   sucesso auditado, falhas recuperáveis e limpeza do formulário.
5. Atualizar arquitetura, integrações, regras de privacidade, ADR e entrega.

## Tarefas sequenciais

- [x] Definir contratos puros de suporte, validação e auditoria.
- [x] Implementar handler protegido, transação de leitura/auditoria e rewrite.
- [x] Implementar service e formulário acessível no `/admin`.
- [x] Adicionar testes de segurança, contrato e estados da tela.
- [x] Atualizar documentação e registrar a entrega.
- [x] Executar `pnpm validate`, revisar diff e procurar vazamento de conteúdo.

## Riscos

- Registrar o conteúdo do craft no evento quebraria privacidade; auditoria deve
  conter somente metadados e justificativa limitada.
- Auditar depois da resposta permite acessos sem rastreio; a gravação deve
  acontecer antes do retorno de sucesso.
- IDs arbitrários podem virar enumeração; exigir formato seguro e não oferecer
  listagem reduz a superfície.
- JSON de craft renderizado como HTML pode executar conteúdo inesperado; usar
  texto/JSON.stringify e nunca `dangerouslySetInnerHTML`.

## Critérios de aceite

- [x] Não administrador recebe 401/403 sem leitura de `crafts/*` e sem evento.
- [x] Payload inválido é rejeitado antes do Firestore.
- [x] Craft existente é retornado somente após autorização e evento append-only.
- [x] Craft inexistente retorna 404 sem auditoria de acesso bem-sucedido.
- [x] UI de suporte só aparece para diagnóstico autorizado e cobre loading,
      vazio, erro e sucesso.
- [x] Justificativa/resultado não persistem no navegador e novo pedido limpa o
      conteúdo anterior.
- [x] Testes, documentação e `pnpm validate` ficam verdes.
