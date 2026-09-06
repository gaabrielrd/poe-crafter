# 0024 — Contrato determinístico de craftabilidade

## Contexto

O alvo confirmado já pode ser salvo e retomado, mas o planner não pode assumir
que toda entrada importada é legal ou suportada. A confirmação valida edição e
parsing; ela não é autoridade sobre regras de crafting.

## Decisão

Criar `@poe-crafter/crafting-engine` como package puro, versionado e
independente de React, Firebase, rede, relógio e providers. A função pública
`evaluateCraftability` recebe o alvo confirmado, a liga e eventuais mecânicas
solicitadas e devolve `accepted`, `rejected` ou `unsupported`.

Conflitos carregam código e caminho estáveis. Regras estruturais que o engine
conhece produzem `rejected`; influências e mecânicas fora do conjunto
implementado produzem `unsupported`. O resultado é transitório no navegador e
não altera o craft persistido.

## Consequências

- O futuro planner recebe um contrato explícito e não precisa inferir se a
  entrada foi validada.
- A primeira versão cobre apenas campos básicos, classificações, linhas não
  reconhecidas, limites de prefix/suffix e influências/mecânicas conhecidas.
- Novas regras devem ampliar o engine com versão e testes determinísticos antes
  de serem aceitas pela interface.
- O status `unsupported` evita prometer estratégias para mecânicas ainda sem
  módulo de legalidade.
- O planner, a simulação, custos e execução continuam em incrementos separados.
