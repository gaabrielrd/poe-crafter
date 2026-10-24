# Patch compatível de Express 4 e qs

Objetivo autorizado: remover o alerta de qs dos caminhos Express 4 e
body-parser 1 sem majors, novos overrides ou redução de gates.

## Plano

1. Inspecionar principal, branches e PRs; manter PRs do bot intactos.
2. Confirmar manifests no npm: Express 4.22.3 e body-parser 1.20.8
   usam qs ~6.16.0; consumidores existentes permitem esses patches.
3. Regenerar o lock e conservar somente os caminhos necessários.
4. Rodar instalação congelada, validate, E2E e auditoria antes/depois.
5. Revisar o diff, registrar evidências e publicar draft independente.
6. Integrar somente com todos os checks aplicáveis verdes no SHA final.

## Aceite e riscos

Manifests diretos, permissões e política de auditoria permanecem iguais.
A contagem usa pnpm antes e depois; não é comparável ao npm do Shortener.
Alertas altos remanescentes bloqueiam merge. Atualizações adiadas dos PRs
12/13 não são necessárias para corrigir qs e permanecem fora deste patch.

## Retomada autorizada em 15/10/2026

1. Confirmar os SHAs de PR18, principal e checkout e medir auditoria atual.
2. Verificar release e manifesto oficial do Firebase CLI 15.34.0, que remove
   proxy-agent; atualizar somente o caminho compatível do CLI no lock.
3. Conferir remoção de basic-ftp/get-uri e permanência de chokidar/braces.
4. Repetir instalação congelada, validate, E2E e auditoria antes/depois.
5. Registrar resultados e publicar na mesma branch/PR18; nenhum PR duplicado.
6. Integrar somente com todos os checks aplicáveis verdes no SHA publicado.

Manifests diretos, overrides, allowBuilds, permissões e limites de teste ficam
fora do escopo. A atualização do CLI deve caber em ^15.29.0. O patch de qs já
publicado deve permanecer na árvore. Nenhuma feature ou interface será alterada.

## Retomada autorizada em 24/10/2026

1. Confirmar retirada de GHSA-vfj7-8cjw-p6xm em 23/10 e reexecutar a CI
   completa nos SHAs publicados, sem duplicar execuções ativas.
2. Medir os novos alertas surgidos: Vite, body-parser, undici, zod,
   fast-uri e ip-address. Conferir versões corrigidas e faixas dos consumidores.
3. Atualizar somente resoluções compatíveis necessárias nos locks. Manter
   manifests diretos, Firebase CLI 15.34.0, overrides, políticas e testes.
4. Validar instalação congelada, auditoria, validate e E2E completos.
5. Publicar no PR18 existente e conferir todos os checks no SHA final.
6. Fazer merge apenas com todos verdes e acompanhar o CI da principal.

A retirada de braces não elimina os novos advisories. Não forçar majors nem
reduzir a idade mínima de releases para liberar a integração. Atualizações
de interface, Writer, templates DevEdTech e automações ficam fora do escopo.

O caminho de Zod 3 usado por shadcn exige atualizar seu consumidor para
shadcn 4.22.0, ainda dentro de ^4.21.0, que declara Zod ^4.2.0. Não substituir
Zod 3 por 4 sob um consumidor que declare apenas a major 3.
