# ADR-0034: Ações de dataset no painel administrativo

- **Status:** Aceita
- **Data:** 2026-09-06
- **Decisão:** oferecer no `/admin` os quatro comandos do ciclo de dataset por
  um service autenticado, mantendo o backend como autoridade de autorização,
  validação e transação.

## Contexto

RF-14B entregou os handlers administrativos, mas operar uma versão exigia
acesso direto aos endpoints. A interface precisa ser útil sem duplicar o
contrato do planner ou expor ações para sessões que ainda não receberam
permissão.

## Decisão

Após o diagnóstico autorizado carregar, `AdminPage` monta `DatasetActions`.
Importação aceita um identificador e JSON de até 20 KB; as outras ações aceitam
somente o identificador. O service envia bearer token pelo `AuthGateway`, valida
respostas versionadas e converte 401/403/409/422 em erros observáveis. Sucesso
recarrega o overview; issues de validação e conflitos preservam a edição local.

## Consequências

- O administrador consegue operar o ciclo sem console externo.
- O cliente não decide se uma versão pode ser publicada e não grava token ou
  dataset em armazenamento local.
- O formulário de JSON é deliberadamente textual; edição estrutural de receitas
  e importadores externos continuam fora deste incremento.
