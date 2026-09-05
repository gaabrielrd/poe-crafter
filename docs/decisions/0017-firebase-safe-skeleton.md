# ADR 0017: esqueleto Firebase seguro por padrão

## Status

Aceita em 2026-09-05.

## Contexto

O PRD prevê autenticação Google, persistência, regras e Functions, mas este
marco estrutural ainda não implementa comportamento de produto. Introduzir SDKs
ou handlers fictícios criaria contratos especulativos e risco de acesso
acidental a um projeto real.

## Decisão

- Preparar Hosting para servir `apps/web/dist`.
- Manter `functions` como workspace TypeScript em Node 24, com API pública vazia
  e sem endpoints, triggers ou SDK Firebase neste marco.
- Versionar regras Firestore e Storage que negam todas as operações.
- Versionar índices vazios válidos e portas do Emulator Suite.
- Iniciar Auth, Firestore, Hosting e Storage no desenvolvimento; o emulador de
  Functions entra no comando quando existir o primeiro handler e seu SDK.
- Usar explicitamente o projeto fictício `demo-poe-crafter` nos comandos locais;
  não versionar `.firebaserc`, credenciais ou IDs reais.
- Manter `shared-types` e `poe-data` com APIs públicas vazias até o primeiro caso
  de uso concreto.

## Consequências

- Hosting e regras podem ser exercitados localmente sem tocar produção.
- Uma função real exigirá SDK, teste observável e revisão das regras no mesmo
  incremento.
- A configuração estrutural é verificada por `pnpm check:firebase`.
- Não existe login, persistência ou integração econômica apenas por causa deste
  esqueleto.
