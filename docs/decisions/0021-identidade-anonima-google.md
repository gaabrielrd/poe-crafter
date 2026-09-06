# 0021 — Sessão anônima vinculada somente ao Google

## Contexto

O fluxo de importação precisa começar sem cadastro, mas o craft deve ganhar uma
identidade estável antes da persistência. Um login separado poderia trocar o
UID e abandonar dados locais.

## Decisão

O app web inicia `signInAnonymously` no provider raiz e expõe somente
`linkWithPopup` com `GoogleAuthProvider`. O adaptador de Auth é a única fronteira
com o SDK Firebase; componentes recebem apenas estado e ações. A UI mantém a
sessão anônima quando popup, rede ou credencial entram em erro.

O Storage reserva `screenshots/{uid}/` para leitura, criação, atualização e
remoção pelo próprio UID, com limite de 8 MiB e content type de imagem. Todos os
demais caminhos continuam negados.

## Consequências

- O UID é preservado durante a promoção para Google.
- E2E usa fixture determinística e não abre uma conta Google real.
- Configuração pública Firebase vive em `VITE_FIREBASE_*`; segredos continuam
  fora do browser.
- Upload e expiração dos screenshots ficam para o incremento de persistência.
