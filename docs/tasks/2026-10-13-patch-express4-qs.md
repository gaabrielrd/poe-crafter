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
