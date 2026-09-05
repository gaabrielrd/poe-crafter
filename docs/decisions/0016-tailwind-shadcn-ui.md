# ADR 0016: Tailwind CSS e shadcn/ui locais ao app web

## Status

Aceita em 2026-09-05. Substitui as ADRs 0005 e 0011 a 0014.

## Contexto

O produto deixou de ser um template Vitru e precisa de um sistema visual que
possa evoluir com a identidade do planejador de crafting, sem depender de um
pacote de componentes externo nem manter dois sistemas de estilo concorrentes.

## Decisão

- Usar Tailwind CSS pelo plugin oficial do Vite.
- Manter tokens semânticos, fontes e estilos globais em
  `apps/web/src/styles/globals.css`.
- Possuir os componentes shadcn/ui usados pelo produto em
  `apps/web/src/shared/ui` e os utilitários neutros em `shared/lib`.
- Não criar `packages/ui` enquanto existir apenas um consumidor visual.
- Usar somente `lucide-react` para ícones.
- Autohospedar TheMix e Archivo; nenhuma fonte depende de CDN.
- Manter `/styleguide` como referência viva para tokens, componentes e estados.
- Proibir CSS Modules, imports de `@vitru/styleguide` e cores literais em
  componentes por meio de `pnpm check:styleguide`.

## Consequências

- A aplicação controla seus componentes e sua identidade visual.
- A troca remove o acoplamento com o pacote Vitru e o CSS legado.
- Tokens globais continuam sendo a fonte de verdade; componentes não definem
  uma paleta paralela.
- Extrair um pacote visual no futuro exigirá mais de um consumidor real e uma
  nova decisão arquitetural.
