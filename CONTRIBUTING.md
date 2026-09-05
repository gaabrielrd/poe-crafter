# Contribuindo

## Fluxo de trabalho

1. Crie uma branch com prefixo `codex/` para trabalho assistido.
2. Confirme requisito, critérios de aceite e não escopo.
3. Planeje mudanças multi-arquivo em `docs/tasks`.
4. Implemente um incremento por vez com testes observáveis.
5. Rode:

```bash
pnpm validate
```

6. Para interface, rode também:

```bash
pnpm test:e2e
```

7. Revise o diff, atualize docs/ADRs e registre a entrega.

## Commits

Use `tipo: descrição`, até 72 caracteres e sem ponto final. Tipos comuns:
`feat`, `fix`, `docs`, `test`, `refactor` e `chore`. Não contorne hooks.

## Arquitetura

Respeite as APIs públicas de features e workspaces descritas em
[docs/architecture.md](docs/architecture.md). APIs, Firebase e armazenamento
ficam atrás de services/adapters/repositories.

## Dependências

Declare a dependência no workspace consumidor e explique a necessidade.
Dependências internas usam `workspace:*`. Um novo script transitivo exige revisão
antes de entrar em `allowBuilds`.

## Interface

Leia [docs/styleguide.md](docs/styleguide.md). Use Tailwind, tokens semânticos,
componentes locais shadcn/ui e Lucide. Mantenha `/styleguide`, teclado, foco,
reduced motion e largura de 360 px.

## Definição de concluído

A contribuição está pronta quando os critérios foram atendidos, testes e E2E
aplicável passam, `pnpm validate` está verde, o diff não expõe segredo e a
documentação/evidência foram atualizadas.
