# Instruções do projeto

## Leia primeiro

1. README.md
2. docs/architecture.md
3. docs/development-process.md
4. docs/testing.md
5. docs/styleguide.md antes de alterar interface

## Processo obrigatório

1. Confirme solicitação, critérios de aceite e não escopo.
2. Inspecione arquivos e testes existentes; prefira o grafo do codebase-memory.
3. Planeje mudanças multi-arquivo em `docs/tasks`.
4. Implemente um incremento por vez sem expandir o escopo.
5. Adicione ou atualize testes do comportamento alterado.
6. Execute `pnpm validate`.
7. Execute `pnpm test:e2e` para mudanças de interface ou fluxo web.
8. Revise o diff final.
9. Atualize documentação e ADRs afetados.
10. Registre a evidência em `docs/entregas`.

## Arquitetura

- Mantenha código executável dentro de um workspace.
- Organize capacidades web em `apps/web/src/features`.
- Não importe internals de outra feature ou package.
- Use `index.ts` e exports do package como interfaces públicas.
- Mantenha `apps/web/src/shared` neutro em relação ao domínio.
- Mantenha regras determinísticas em packages, sem React ou Firebase.
- Mantenha handlers Firebase finos e sem regra de crafting.
- Não adicione abstrações ou packages sem consumidor real.
- Use `workspace:*` para dependências internas.

## Estilo e interface

- Siga `docs/styleguide.md`.
- Use Tailwind e os tokens de `apps/web/src/styles/globals.css`.
- Não escreva cor literal nem replique token em componente.
- Use componentes shadcn/ui existentes em `apps/web/src/shared/ui`.
- Adicione um componente shadcn somente quando uma tela real exigir.
- Use somente ícones de `lucide-react`.
- Use TheMix nos títulos e Archivo no texto; não use CDN de fontes.
- Cubra carregando, vazio, erro, sucesso e permissão em telas assíncronas.
- Preserve teclado, foco visível, reduced motion, WCAG 2.2 AA e 360 px.
- Mantenha `/styleguide` funcionando e atualizada.

## Escopo

- Não expanda o escopo além do solicitado.
- Implemente uma funcionalidade por vez.
- Não antecipe modelo, API ou package de capacidade futura.

## Dependências

- Explique a necessidade antes de adicionar dependência.
- Declare a dependência no workspace consumidor.
- Revise scripts transitivos antes de alterar `allowBuilds`.
- Não adicione orquestrador de monorepo sem necessidade demonstrada e ADR.

## Segurança

- Nunca faça commit de segredos, `.env.local`, `.firebaserc` ou service account.
- Use `demo-poe-crafter` no Emulator Suite.
- Mantenha o Firestore deny-all fora de `crafts/{craftId}`; nessa coleção só o próprio UID autenticado pode operar e `ownerUid` não pode mudar. O Storage só pode liberar `screenshots/{uid}/{fileName}` para o próprio UID autenticado, com limite de 8 MiB e tipo `image/*`; os demais caminhos seguem deny-all.
- Não acesse projeto Firebase real sem autorização explícita.

## Armazenamento e APIs

- Mantenha HTTP, Firebase e armazenamento em services/adapters/repositories.
- Leia `import.meta.env` somente em `apps/web/src/shared/config/env.ts`.
- Valide dados externos antes de entrar no domínio.
- Não use APIs da GGG.

## Rotas

- Importe de `react-router`, nunca de `react-router-dom`.
- Acrescente rotas em `apps/web/src/app/routes`.
- Mantenha a rota `'*'` por último.
- Não envolva `<Outlet />` em ErrorBoundary; use `errorElement`.

## Commits

- Use `tipo: descrição`, até 72 caracteres e sem ponto final.
- Corrija a causa de falhas dos hooks antes do commit.

## Testes

- Teste resultado observável, não detalhe interno.
- Coloque testes web na feature em `tests`.
- Não reduza os limites de cobertura.
- Atualize screenshots somente após inspecionar a diferença.
- Use emuladores e project ID demo em testes Firebase.

## Documentação

- Registre decisão relevante em documentação ou ADR.
- Marque ADR superada e aponte a substituta; não apague o histórico.
- Atualize este arquivo quando uma regra for criada, alterada ou revogada.
- Registre toda entrega implementada em `docs/entregas`.

## Conclusão

Uma tarefa só termina quando a definição de concluído em
`docs/development-process.md` estiver satisfeita.
