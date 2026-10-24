# Patch compatível de Express 4 e qs

## Objetivo e escopo

Atualizar somente Express 4.22.2 para 4.22.3 e body-parser 1.20.6 para
1.20.8, eliminando qs 6.15.3 e usando 6.16.0. Manifests diretos,
Express 5, permissões, overrides e gates permanecem iguais.

## Evidência de compatibilidade

Registro oficial consultado em 13/10/2026:

- [Express 4.22.3](https://registry.npmjs.org/express/4.22.3):
  qs ~6.16.0, body-parser ~1.20.5 e path-to-regexp ~0.1.13.
- [body-parser 1.20.8](https://registry.npmjs.org/body-parser/1.20.8): qs ~6.16.0.
- Firebase CLI 15.29.0 permite express ^4.16.4 e body-parser ^1.19.0.
- exegesis 4.3.0 permite body-parser ^1.18.3.
- path-to-regexp já estava em 0.1.13 e permanece nessa versão.

## Auditoria

pnpm 11.19.0, mesma ferramenta antes e depois: 2 altos/13 moderados
para 2 altos/11 moderados. Removidos GHSA-x5fp-wj9c-mxmx e
GHSA-4mjr-xmp4-gh2g de qs. Não comparar essa contagem com npm.

Permanecem basic-ftp (GHSA-c475-qrg2-pj4r), braces
(GHSA-vfj7-8cjw-p6xm) e os 11 advisories moderados restantes.
Não há merge enquanto a auditoria continuar vermelha.

## Validação e revisão

Instalação congelada passou na toolchain Node 24.19.0/pnpm 11.19.0.
Validate e E2E completos foram iniciados; os resultados finais serão
registrados no PR, distinguindo execução local e CI no SHA publicado.
Diff restrito ao lock, plano e evidência. Sem alterações de produto ou segredos.

## PRs existentes

PR15 contém este patch junto de 11 atualizações de desenvolvimento e
possui falhas de CI. O draft estreito permite revisar a correção sem
alterar a branch do bot. PR16/17 permanecem intactos. PR12/13 seguem
adiados conforme o registro no PR11; nenhum PR fechado foi reaberto.

## Retomada de 15/10/2026: remoção da cadeia FTP

Plano: `docs/tasks/2026-10-13-patch-express4-qs.md`, retomada autorizada
no PR18 e na mesma branch `codex/patch-express4-qs`.

O lock passa de Firebase CLI 15.29.0 para 15.34.0, dentro da faixa
^15.29.0 já declarada. A [release oficial 15.34.0](https://github.com/firebase/firebase-tools/releases/tag/v15.34.0)
remove proxy-agent, universal-analytics e @apphosting/common. O
[manifesto publicado](https://registry.npmjs.org/firebase-tools/15.34.0)
confirma essas remoções e mantém chokidar ^3.6.0, Express ^4.16.4 e
body-parser ^1.19.0. O runtime declarado aceita Node 24.

A revisão semântica do lock confirmou todos os specifiers, versões diretas
exceto o CLI e overrides preservados. As resoluções transitivas do CLI foram
atualizadas dentro das faixas suportadas; o peer compartilhado de yaml passou
de 2.9.0 para 2.9.1. Express 4.22.3, body-parser 1.20.8 e qs 6.16.0 permanecem.
Não há proxy-agent, pac-proxy-agent, get-uri ou basic-ftp em nenhuma entrada
do lock. Chokidar 3.6.0 e braces 3.0.3 continuam presentes.

Auditoria comparada com pnpm 11.19.0 nesta execução:

| Estado                 | Altos | Moderados | Total de advisories |
| ---------------------- | ----- | --------- | ------------------- |
| PR18 antes da retomada | 2     | 11        | 13                  |
| CLI 15.34.0            | 1     | 4         | 5                   |

Removidos basic-ftp (GHSA-c475-qrg2-pj4r), stream-json (3 advisories),
csv-parse, morgan, fast-uri e hono. Restam braces
(GHSA-vfj7-8cjw-p6xm, alto), uuid, @opentelemetry/core e ip-address
(2 advisories moderados). O npm ainda publica braces latest 3.0.3;
nenhum override ou upgrade incompatível foi usado.

Validação local, Node 24.19.0/pnpm 11.19.0:

- Instalação congelada: passou.
- `pnpm validate`: passou; 106 testes web, 53 contratos e 18 Functions,
  com cobertura, lint, tipos, arquitetura, documentação, build e smoke.
- `pnpm test:e2e`: 16 testes passaram.
- Auditoria: falha mantida por 1 alto e 4 moderados.

Arquivos alterados neste incremento: lock, plano e este registro. Nenhum
teste próprio foi acrescentado, pois não há mudança de comportamento do
produto; as suítes existentes verificam a atualização do ferramental.
Resultados do CI no SHA publicado ficam registrados no PR18. O critério
de remoção da cadeia FTP foi atendido; auditoria e merge seguem bloqueados.

## Retomada de 24/10/2026: novos advisories e retirada de braces

[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
foi retirado em 23/10 por não ser explorável na prática. A reexecução completa
no SHA 5741b6d passou Validate/E2E, mas encontrou novos advisories: 7 altos,
16 moderados e 3 baixos. A retirada não foi tratada como aprovação automática.

Foram aplicadas resoluções corrigidas dentro dos ranges existentes:

| Dependência | Versão corrigida adotada                               |
| ----------- | ------------------------------------------------------ |
| Vite        | 8.2.4, dentro de ^8.2.2                                |
| shadcn      | 4.22.0, dentro de ^4.21.0                              |
| body-parser | 1.20.9 e 2.4.0, preservando as majors dos consumidores |
| undici      | 6.29.1, 7.30.1 e 8.12.3, conforme cada consumidor      |
| zod         | 4.6.7, via consumidores que suportam a major 4         |
| fast-uri    | 3.1.9                                                  |
| ip-address  | 10.7.4                                                 |

O [manifesto de shadcn 4.22.0](https://registry.npmjs.org/shadcn/4.22.0)
declara Zod ^4.2.0. Atualizar esse consumidor removeu Zod 3 sem impor uma
major incompatível a shadcn 4.21.0. Foram conferidos também os manifests
publicados de body-parser e undici e os ranges de Express, jsdom e dotenvx.
As versões corrigidas já tinham mais de 24 horas de publicação.

Firebase CLI permanece em 15.34.0. Specifiers diretos, overrides gRPC,
allowBuilds, políticas, permissões e limites de testes foram preservados.
A cadeia proxy-agent/pac-proxy-agent/get-uri/basic-ftp continua ausente.

Auditoria local com pnpm 11.19.0: 26 advisories para 2 moderados, sem altos,
críticos ou baixos. Restam uuid 9.0.1 e @opentelemetry/core 1.30.1; nenhum
aviso foi suprimido. O comando de auditoria mantém audit-level=high no CI.

Instalação congelada e `pnpm validate` passaram em Node 24.19.0, incluindo
106 testes web com cobertura, 53 contratos, 18 Functions, lint, tipos, build
e smoke HTTP. O resultado final do E2E e do CI publicado é registrado no PR18.
Merge só é permitido após todos os checks aplicáveis verdes no SHA final,
seguido de verificação da principal. Não houve alteração de comportamento
do produto nem teste novo que apenas espelhe o lock.
