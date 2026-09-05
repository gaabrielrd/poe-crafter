# Styleguide

A referência viva está em `/styleguide`. Tailwind fornece as utilidades e os
componentes shadcn/ui ficam sob controle do projeto em
`apps/web/src/shared/ui`.

## Direção visual

A interface representa uma bancada de crafting escura, precisa e silenciosa.
Hierarquia, legibilidade e estado operacional têm prioridade sobre decoração.
Use uma única cor de destaque dourada e superfícies calmas.

## Tokens

Cor, fonte, raio e motion vivem em
`apps/web/src/styles/globals.css`. Componentes usam nomes semânticos como
`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`,
`bg-primary` e `text-destructive`.

- Não escreva hex, RGB, HSL ou OKLCH em componente.
- Não duplique um token com classe arbitrária.
- Altere identidade visual no tema global.
- Use TheMix apenas em títulos, peso 700.
- Use Archivo no texto e Cascadia/Consolas para dados monoespaçados.

## Componentes

- Use primeiro os componentes em `shared/ui`.
- Adicione um componente shadcn somente quando uma tela real o exigir.
- Mantenha `components.json` com aliases `@/shared/ui` e `@/shared/lib`.
- Não crie `packages/ui` antes de existir um segundo consumidor.
- Campos de formulário devem usar primitives locais de input/select/textarea
  quando forem adicionadas.
- Cards só existem quando o agrupamento ou a interação precisa de uma superfície.

## Ícones

Use somente `lucide-react`. O ícone deve melhorar reconhecimento ou estado e
receber `aria-hidden="true"` quando o texto adjacente já fornece o nome.

## Layout e conteúdo

- Comece pela área de trabalho e por linguagem operacional.
- Evite mosaico de cards, gradientes decorativos e texto promocional.
- Preserve largura mínima de 360 px sem rolagem horizontal.
- Use no máximo duas famílias tipográficas e um destaque dominante.
- Títulos dizem o que a área é; texto de apoio explica escopo ou próxima ação.

## Estados e acessibilidade

- Toda tela assíncrona cobre carregando, vazio, erro, sucesso e permissão quando
  aplicável.
- Mantenha contraste WCAG 2.2 AA, foco visível e alvos de toque adequados.
- Elementos interativos devem funcionar por teclado.
- Motion orienta entrada, foco ou affordance e respeita
  `prefers-reduced-motion`.
- Não confirme sucesso antes da persistência terminar.

## Verificação

```bash
pnpm check:styleguide
```

O verificador exige Tailwind, shadcn, tokens, fontes, componentes mínimos e
Lucide; também rejeita CSS Modules e o kit Vitru legado.

```bash
pnpm test:e2e
```

O E2E verifica os tokens computados, fontes locais, responsividade e aparência
da página quando existe baseline para a plataforma.
