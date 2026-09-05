# Contexto do projeto para Claude Code

Leia e siga `AGENTS.md`.

Depois leia, quando relevante:

1. `docs/architecture.md`
2. `docs/development-process.md`
3. `docs/testing.md`
4. `docs/styleguide.md` antes de alterar interface
5. ADRs relacionados em `docs/decisions`

As skills ficam em `.claude/skills` e são sincronizadas a partir de `skills`.

Para trabalho multi-arquivo: planeje, implemente um incremento por vez, adicione
testes observáveis, execute `pnpm validate`, revise o diff e registre a entrega.

Não expanda escopo, não adicione dependências sem justificativa, não acesse
produção e não exponha segredos. Em interface, use Tailwind, tokens semânticos,
componentes locais shadcn/ui e ícones Lucide; mantenha `/styleguide` funcional.
