# Trabalhando com agentes

Regras permanentes ficam em `AGENTS.md`; `CLAUDE.md` aponta a ordem de leitura.
Use prompts para o objetivo da tarefa e skills para o processo.

## Skills disponíveis

- **plan-app** — fechar escopo de produto e escrever o PRD.
- **plan-feature** — transformar uma solicitação em plano verificável.
- **implement-feature** — executar plano aprovado por incrementos.
- **generate-tests** — cobrir comportamento observável alterado.
- **frontend-skill** — orientar composição e qualidade de interface.
- **review-changes** — revisar escopo, arquitetura, segurança e testes.
- **update-documentation** — realinhar docs e ADRs ao código.
- **update-readme** — manter a entrada do projeto fiel ao repositório.
- **update-agents** — alterar regras persistentes após validação.
- **document-delivery** — registrar evidências reais da entrega.
- **prepare-pull-request** — preparar commits e descrição do PR.
- **save-legacy-project** — diagnosticar legado e planejar reestruturação.

As fontes vivem em `skills`. Cópias em `.agents/skills` e `.claude/skills` são
geradas por:

```bash
pnpm sync:skills
```

## Fluxo recomendado

1. Confira `docs/prd.md` e arquitetura.
2. Para produto indefinido, use `plan-app`.
3. Para mudança multi-arquivo, use `plan-feature` e salve em `docs/tasks`.
4. Aprove o plano.
5. Use `implement-feature` um incremento por vez.
6. Use `generate-tests` quando o comportamento mudar.
7. Rode `pnpm validate` e E2E aplicável.
8. Use `review-changes`.
9. Atualize docs, README e agentes conforme o impacto.
10. Use `document-delivery` somente depois do gate verde.

## Exemplos

> Use a skill plan-feature para planejar a importação de item por texto conforme
> RF-02. Salve em docs/tasks e não implemente ainda.

> O plano está aprovado. Use implement-feature e gere testes observáveis. Mantenha
> pnpm validate verde e registre a entrega.

> Use review-changes para revisar o diff desta branch antes do commit.

## Limites de autonomia

O agente não expande escopo, não adiciona dependência sem justificar, não acessa
produção e não registra segredo. Mudança de arquitetura exige plano e ADR. Em
dúvida sobre uma ação externa ou irreversível, solicita direção.
