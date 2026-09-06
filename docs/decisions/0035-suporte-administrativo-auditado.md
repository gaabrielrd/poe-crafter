# ADR-0035: suporte administrativo auditado

**Status:** Aceito  
**Data:** 2026-09-06

## Contexto

As regras do Firestore deixam `crafts/{craftId}` privado ao proprietário. O
suporte operacional precisa investigar um caso sem transformar a coleção em
dados públicos nem permitir que o navegador escolha quem pode ler. O PRD exige
autorização administrativa e auditoria para cada acesso.

## Decisão

Adicionar o endpoint `POST /api/admin/support/craft`, protegido pelo mesmo
bearer Google e `POE_ADMIN_UIDS` usados pelo painel administrativo. O payload
aceita apenas um ID seguro e uma justificativa de até 500 caracteres. Depois da
autorização, uma transação lê o documento pelo Admin SDK, valida e normaliza o
contrato e cria um documento append-only em `ops/supportAuditEvents` antes de
responder.

O evento registra somente `actorUid`, `action`, `craftId`, `reason`, versão do
schema e `createdAt`; não inclui alvo, mods, preços, screenshots ou qualquer
outro conteúdo privado. A interface `/admin` mantém formulário, justificativa e
resultado somente em memória e limpa o resultado ao iniciar novo pedido.

## Alternativas rejeitadas

- Liberar leitura direta no Firestore: quebraria a fronteira privada e não
  garantiria auditoria.
- Auditar depois da resposta: permitiria acessos sem evento em caso de falha.
- Listar crafts para o suporte: ampliaria enumeração e exposição desnecessária;
  o operador deve informar o ID recebido no caso.
