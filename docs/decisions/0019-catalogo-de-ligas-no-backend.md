# ADR 0019: catálogo de ligas atrás do backend

## Status

Aceita em 2026-09-05.

## Contexto

O fluxo `/new` precisa de uma liga PC ativa para contextualizar preços, mas o
provider externo pode mudar schema, disponibilidade e limites. A web não deve
conhecer esse schema nem chamar o provider diretamente.

## Decisão

- Normalizar o catálogo em `packages/pricing`, expondo apenas `ActiveLeague`.
- Publicar `getActiveLeagues` em Functions e encaminhar `/api/leagues` pelo
  Hosting.
- Filtrar no backend ligas que não sejam PC, estejam inativas ou expiradas.
- Manter fallback explícito para preços manuais quando o catálogo falhar ou
  estiver vazio.
- Não adicionar autenticação, persistência, snapshots ou integração com APIs da
  GGG neste incremento.

## Consequências

- O browser recebe um contrato estável e não depende do provider diretamente.
- O endpoint pode receber cache, timeout e snapshots futuros sem alterar a UI.
- O modo manual permite continuar o fluxo sem inventar custos automáticos.
- O primeiro handler real revoga a descrição de API vazia do esqueleto Firebase;
  autenticação e regras de dados continuam fora do escopo.
