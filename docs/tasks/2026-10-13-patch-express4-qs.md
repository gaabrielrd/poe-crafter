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
