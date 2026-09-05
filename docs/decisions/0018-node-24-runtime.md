# ADR 0018: runtime Node 24

## Status

Aceita em 2026-09-05.

## Contexto

O ambiente de desenvolvimento disponível para o projeto usa Node.js 24.14.1.
Manter a política em Node 22 impede a instalação reproduzível neste ambiente e
faz o CI validar uma versão diferente da usada no trabalho diário.

## Decisão

Alinhar o runtime do projeto para Node.js 24:

- Node 24.14.1 fixado em `.nvmrc` e aceito pelo intervalo `>=24.14.1 <25` no
  manifesto raiz;
- o workspace `functions` declara Node `24` e o Firebase usa o runtime
  `nodejs24`;
- CI, documentação e testes de toolchain usam a mesma versão local;
- pnpm continua fixado em `11.19.0`.

O runtime `nodejs24` é suportado pelo Cloud Run functions. O Firebase permanece
sem handlers publicados neste marco, portanto a decisão não autoriza deploy.

## Consequências

- `pnpm install --frozen-lockfile` e `pnpm check:toolchain` passam no ambiente
  Node 24.14.1;
- builds locais, CI e Functions deixam de alternar entre majors diferentes;
- a decisão anterior de Node 22 permanece no histórico, mas não é mais a
  política ativa;
- atualizar o runtime novamente exigirá alterar manifesto, `.nvmrc`, CI,
  configuração Firebase, testes e documentação no mesmo incremento.
