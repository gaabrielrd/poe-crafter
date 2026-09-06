# Testes

Teste resultados observáveis e contratos arquiteturais. Não teste detalhes
internos apenas para aumentar cobertura.

## Camadas

| Camada                   | Local                     | Responsabilidade                                                     |
| ------------------------ | ------------------------- | -------------------------------------------------------------------- |
| Unidade/componente web   | `apps/web/src/**/tests`   | Rotas, componentes, estado e configuração pelo comportamento         |
| Contratos do repositório | `scripts/*.test.mjs`      | Arquitetura, docs, toolchain, Firebase, styleguide, gerador e bundle |
| Packages                 | `packages/*/src/**/tests` | Regras puras quando houver comportamento                             |
| Functions                | `functions/src/**/tests`  | Validação e handlers quando forem implementados                      |
| E2E                      | `e2e`                     | Bundle, navegação, responsividade e contrato visual no Chromium      |

## Comandos

```bash
pnpm test:unit
```

Vitest web sem cobertura, indicado para iteração.

```bash
pnpm test
```

Cobertura web e contratos Node.

```bash
pnpm test:e2e
```

Build, preview em porta efêmera e fluxos Chromium.

```bash
pnpm test:emulators
```

Build, Hosting local e requisições não autenticadas que precisam receber 403
do Firestore e do Storage. Requer Java 21 ou mais recente.

```bash
pnpm validate
```

Gate completo, exceto instalação/execução do navegador.

## Cobertura

O Vitest aplica os pisos atuais:

- statements: 85%;
- lines: 85%;
- branches: 75%;
- functions: 90%.

Não reduza limites para acomodar uma mudança. Entry points declarativos e os
componentes shadcn possuídos pelo projeto podem ser excluídos quando não contêm
regra própria; o fluxo que os consome continua testado.

## Interface e acessibilidade

- Prefira queries por papel, nome e label.
- Cubra sucesso e falhas recuperáveis.
- Para telas assíncronas, cubra carregando, vazio, erro, sucesso e permissão.
- Teste navegação por teclado, foco, reduced motion e overflow em 360 px.
- Atualize screenshot somente após inspeção da diferença.
- Evidências Playwright são mantidas apenas na falha.

## Firebase

O marco estrutural verifica configuração válida; Firestore continua deny-all e
Storage libera somente `screenshots/{uid}/` ao próprio UID. `pnpm
test:emulators` inicia Auth, Hosting, Firestore e Storage no project ID
`demo-poe-crafter` quando o Firebase CLI local está funcional. Nunca use
credenciais reais na suíte.

## Reprodutibilidade

O CI instala com `pnpm install --frozen-lockfile` em Node 24. Um teste que passa
apenas com dependência hoisted ou arquivo local não declarado é inválido.
