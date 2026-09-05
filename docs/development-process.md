# Processo de desenvolvimento

## Fluxo obrigatório

1. Leia `README.md`, `docs/architecture.md`, este arquivo e os documentos
   específicos da mudança.
2. Confirme objetivo, critérios de aceite e não escopo.
3. Inspecione código e testes existentes; prefira o grafo do codebase-memory.
4. Para mudança multi-arquivo, crie e aprove um plano em `docs/tasks`.
5. Implemente um incremento por vez e mantenha o escopo.
6. Adicione ou atualize testes do comportamento observável.
7. Execute testes focados durante o trabalho.
8. Rode `pnpm validate` até ficar verde.
9. Em interface, rode também `pnpm test:e2e` e inspecione desktop e 360 px.
10. Revise o diff por escopo, arquitetura, segurança, acessibilidade e código
    morto.
11. Atualize documentação, ADRs e `AGENTS.md` quando as regras mudarem.
12. Registre a evidência real em `docs/entregas`.

## Incrementos

Um incremento deve ser pequeno, testável e reversível. Movimentos de arquivo
ficam separados de mudança de comportamento sempre que isso melhora a revisão.
Não mantenha duas arquiteturas ou duas fontes da verdade como estado final.

## Branches e commits

- Use branches com prefixo `codex/` para trabalho do Codex.
- Primeira linha do commit: `tipo: descrição`, até 72 caracteres, sem ponto
  final.
- Corrija a causa de qualquer falha dos hooks antes do commit.
- Não faça commit de outputs, caches, `.env`, `.firebaserc` ou segredos.

## Dependências

Explique a necessidade antes de adicionar. Declare no workspace consumidor e
use `workspace:*` para packages internos. Builds transitivos só entram em
`allowBuilds` depois de revisão explícita.

## Definição de concluído

Uma tarefa está concluída somente quando:

- critérios de aceite estão atendidos;
- comportamento alterado possui testes;
- `pnpm validate` está verde;
- E2E aplicável está verde;
- diff foi revisado sem achados bloqueadores/importantes;
- documentação e ADRs refletem o código;
- regras persistentes dos agentes estão atuais;
- evidência foi registrada em `docs/entregas`;
- limitações e pendências conhecidas foram declaradas.
