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
