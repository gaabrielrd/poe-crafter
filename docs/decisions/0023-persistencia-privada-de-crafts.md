# 0023 — Persistência privada de crafts por UID

## Contexto

O alvo confirmado existia somente no estado da tela, embora a sessão Firebase já
começasse anônima e pudesse ser vinculada ao Google. O planner precisa de um
craft retomável sem transformar o navegador em autoridade nem expor dados entre
identidades.

## Decisão

Persistir o alvo confirmado em `crafts/{craftId}` com `ownerUid`,
`schemaVersion`, liga/modo, estado confirmado, classificações e timestamps. A
web acessa Firestore somente por um repositório da feature; Rules permitem
criar, ler, atualizar e excluir apenas o próprio UID e impedem trocar o
`ownerUid` ou a versão do documento. O histórico consulta apenas o owner e
ordena por `updatedAt`, com limite inicial de 50 registros.

O vínculo anônimo → Google não copia documentos: o UID preservado pelo
`linkWithPopup` mantém o mesmo `craftId`. Conflitos de credencial continuam
sendo erro recuperável da identidade. Fixtures em memória cobrem o fluxo sem
credenciais pessoais; o Firestore Emulator é a validação de integração quando o
CLI local estiver funcional.

## Consequências

- O jogador pode salvar, listar e retomar crafts privados em `/history` e
  `/craft/:craftId`.
- Screenshots e texto OCR bruto continuam fora do Firestore; o upload mantém o
  TTL independente.
- A consulta ordenada exige o índice composto `ownerUid + updatedAt`.
- Exclusão de conta, eventos/gastos, planner, compartilhamento e migrações entre
  UIDs permanecem fora deste incremento.
