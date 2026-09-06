# Exclusão de conta e dados

**Status:** Implementado em 2026-09-06  
**PRD:** RF-13 / CA-12  
**Dependências:** [sessão anônima e login Google](sessao-anonima-e-login-google.md), [persistência privada e histórico de crafts](persistencia-privada-e-historico-de-crafts.md)

## Contexto

O produto permite começar anonimamente e vincular a sessão somente ao Google,
mas ainda não oferece uma forma segura de excluir a conta autenticada e seus
dados. A exclusão precisa exigir uma confirmação destrutiva, reautenticação
Google e processamento assíncrono, sem prometer que os dados já desapareceram
antes da limpeza terminar.

## Objetivo

Permitir que uma conta Google solicite a exclusão de seus crafts, screenshots,
documentos de operação e identidade, recebendo confirmação imediata de que a
solicitação foi agendada para conclusão em até 24 horas.

## Escopo

- Adicionar reautenticação Google na fronteira `AuthGateway`.
- Criar a rota `/settings` com estado de conta, confirmação destrutiva e estados
  de processamento/erro/sucesso.
- Criar endpoint autenticado `requestAccountDeletion` em Functions.
- Aceitar somente tokens cujo provider seja `google.com` e payload explícito
  `DELETE`.
- Revogar refresh tokens e registrar uma solicitação idempotente com prazo de
  24 horas.
- Criar job agendado que remove crafts, screenshots e a conta Firebase, mantendo
  o registro operacional de status.
- Cobrir o modelo/serviço, UI fixture, contrato do backend e fluxo E2E.
- Atualizar regras de rota, arquitetura, integrações, ADR e entrega.

## Não escopo

- Exclusão da conta anônima sem vínculo Google.
- Email/senha ou qualquer provider adicional.
- Recuperação de dados depois da confirmação.
- Painel administrativo, auditoria operacional completa e exportação de dados.
- Alterar a retenção de screenshots fora do prefixo do UID ou a privacidade de
  crafts durante a janela de exclusão.

## Suposições

- O token recém-reatenticado é suficiente para a API registrar a solicitação;
  o servidor continua sendo a autoridade para autorização.
- Uma solicitação `pending` ou `processing` é idempotente e devolve o mesmo
  horário agendado.
- A execução agendada ocorre em intervalos menores que 24 horas; falhas ficam
  visíveis no documento para nova tentativa operacional.
- A conta só pode ser excluída após o servidor apagar crafts e screenshots do
  mesmo UID.

## Proposta de solução

1. Expandir `AuthGateway` com `reauthenticateGoogle` e
   `requestAccountDeletion`, incluindo implementações Firebase, fixture e
   configuração ausente.
2. Criar `account-settings` e a rota `/settings`; exigir a palavra `EXCLUIR`,
   reautenticar e só então chamar a API. O sucesso mostra `requestedAt` e
   `scheduledFor`; falhas mantêm o formulário e permitem tentar novamente.
3. Criar o endpoint HTTP privado e o contrato de solicitação com status
   `pending`, `processing`, `completed` e `failed`. O endpoint valida método,
   bearer token, provider Google e payload antes de usar Admin SDK.
4. Criar o trigger agendado idempotente para apagar `crafts` do UID,
   `screenshots/{uid}/` e o usuário Auth, registrando o resultado.
5. Adicionar testes observáveis e atualizar documentação sem expor segredos ou
   liberar acesso cliente à coleção de solicitações.

## Tarefas sequenciais

- [x] Auditar RF-13, AuthGateway, rotas e fronteiras Firebase.
- [x] Criar contrato e serviço de solicitação de exclusão.
- [x] Implementar reautenticação e rota de configurações.
- [x] Implementar endpoint e job agendado de limpeza.
- [x] Atualizar testes unitários, contratos e E2E.
- [x] Validar, revisar e registrar a entrega.

## Riscos

- Excluir Auth antes de apagar os dados pode deixar conteúdo órfão; a ordem do
  job precisa ser explícita e idempotente.
- Reautenticação popup pode falhar por bloqueio, rede ou credencial recente;
  nenhuma falha pode esconder a ação de tentar novamente.
- A API não pode aceitar um token anônimo nem confiar somente no estado visual do
  navegador.
- Uma solicitação duplicada não deve criar dois prazos ou duas exclusões
  concorrentes.

## Critérios de aceite

- [x] Usuário anônimo não consegue solicitar exclusão e recebe orientação para
      vincular Google.
- [x] Usuário Google precisa digitar `EXCLUIR` e concluir reautenticação antes
      da chamada destrutiva.
- [x] O servidor rejeita método, payload, token ausente/inválido e provider que
      não seja Google.
- [x] O sucesso retorna confirmação imediata com prazo de até 24 horas e não
      afirma que os dados já foram apagados.
- [x] O job remove crafts, screenshots e identidade do mesmo UID, registra falha
      recuperável e é idempotente.
- [x] A rota mantém erro e confirmação visíveis, passa por testes e `pnpm
validate`.
