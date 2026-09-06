# 0029 — Resumo estimado versus real

## Contexto

RF-09 já preservava eventos append-only, mas o estado terminal mostrava apenas
o total conhecido da sessão. Faltava comparar esse resultado com o custo
estimado da estratégia e explicar tentativas e caminho completo.

## Decisão

O package `planner` deriva um `ExecutionSummary` somente quando o estado está
`completed` e pertence à estratégia informada. O resumo mantém o custo
estimado da estratégia, o custo real conhecido, a diferença e uma indicação
explícita de indisponibilidade quando algum recurso tem `chaos: null`. Valores
conhecidos continuam visíveis separadamente e nunca são substituídos por zero.

Tentativas por passo e caminho são derivados do array imutável de eventos;
`retry`, `restart`, `success` e `skipped` permanecem na ordem original. A web
renderiza o resumo somente após o sucesso terminal e mantém a sessão local, sem
criar ou editar eventos.

## Consequências

- O jogador consegue avaliar o resultado real contra a previsão do plano.
- Recursos sem preço não produzem uma diferença enganosa, mas seus valores
  conhecidos continuam auditáveis.
- O resumo é uma projeção pura e pode ser reutilizado no futuro resumo
  persistido ou em RF-11 sem acoplar a UI ao armazenamento.
- A sessão e o resumo ainda são perdidos ao recarregar a página; sincronização e
  versionamento durável permanecem pendentes.
- O Vite fixa React e React DOM no mesmo runtime hoisted do workspace para
  evitar duas instâncias quando o pnpm usa hardlinks e symlinks.
