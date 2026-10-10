# CI reproduzível em checkout limpo

## Solicitação e aceite

Correção integral dos checks, com PR e merge somente após validação verde,
autorizada na conversa. Aceite: instalação congelada, validate, auditoria e E2E
passam sem artefatos locais prévios; PRs de dependências são revalidados.

## Plano

1. Compilar os packages internos em ordem de dependência antes dos consumidores.
2. Alinhar a versão Node 24 fixada a um patch compatível com jsdom 30.
3. Agrupar Vitest e coverage-v8 para impedir majors independentes incompatíveis.
4. Executar os gates em checkout sem dist e revisar o diff.
5. Registrar evidência, abrir PR em draft, integrar após CI e verificar master.
6. Atualizar e validar os PRs de dependências existentes em sequência.

## Não escopo

Não alterar produto, reduzir cobertura, ignorar lint/audit, trocar snapshots sem
inspeção, fazer deploy ou alterar permissões.
