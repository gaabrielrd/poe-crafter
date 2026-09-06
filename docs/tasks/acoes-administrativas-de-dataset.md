# Ações administrativas de dataset

**Status:** Implementado em 2026-09-06  
**PRD:** RF-14C / RF-14 / RN-10 / CA-13  
**Dependências:** [ciclo administrativo de dataset](ciclo-administrativo-de-dataset.md), [painel administrativo e diagnóstico](painel-administrativo-e-diagnostico.md)

## Contexto

O backend já expõe o ciclo autorizado de dataset em
`POST /api/admin/datasets`, mas `/admin` ainda mostra apenas o diagnóstico
operacional. Um administrador autorizado precisa executar as ações sem usar o
console do Firebase e sem que a interface possa contornar a autorização do
servidor.

## Objetivo

Adicionar ao painel administrativo um fluxo explícito para importar, validar,
publicar e reativar versões do dataset, exibindo o resultado da operação e
atualizando o diagnóstico após uma alteração aceita.

## Requisitos

- Mostrar os controles somente depois que a sessão Google carregar o painel;
  sessão anônima, erro de permissão e erro de diagnóstico não exibem conteúdo
  operacional nem ações.
- Importar exige identificador de versão e JSON; o cliente rejeita JSON vazio
  ou inválido antes da chamada e envia o objeto parseado ao backend.
- Validar, publicar e reativar exigem identificador de versão; a disponibilidade
  final da ação continua sendo autoridade do backend.
- Exibir estados de envio, sucesso, erro recuperável e issues retornadas pela
  validação, sem afirmar sucesso antes da resposta persistida.
- Após ação aceita, recarregar o diagnóstico para mostrar o dataset ativo; não
  guardar dataset ou token em `localStorage`.
- Reutilizar `AuthGateway`, primitives de `shared/ui` e tokens Tailwind;
  chamadas HTTP permanecem em service da feature.

## Não escopo

- Importação automática de RePoE, Storage, Cloud Vision ou poe.ninja.
- Edição visual de receitas, steps ou schema do dataset.
- Suporte a conteúdo privado de crafts, auditoria de suporte ou controle de
  custo operacional (RF-15).
- Alterações no contrato ou nas transações do backend RF-14B.

## Suposições

- O operador consegue produzir JSON compatível com o contrato do planner; a
  validação detalhada e a publicação continuam no backend.
- O formulário pode usar texto livre para a versão porque a API protege contra
  identificadores inseguros e conflitos de conteúdo.
- A página permanece acessível apenas pela rota `/admin` e pela identidade
  Google já existente; não será criado um segundo mecanismo de login.

## Proposta de solução

1. Criar um contrato/validador de resposta e um service para as quatro ações,
   convertendo respostas 400/409/422/503 em erros exibíveis.
2. Extrair uma seção `DatasetActions` da `AdminPage`, com formulário de import
   JSON e ações de ciclo para uma versão informada.
3. Injetar `manageDataset`/`loadOverview` como dependências opcionais para
   testar estados observáveis sem Firebase real.
4. Recarregar o overview após sucesso, manter o formulário em caso de falha e
   renderizar issues com seus caminhos.
5. Atualizar testes, documentação, ADR/entrega e a descrição de limitações.

## Tarefas sequenciais

- [x] Definir contrato de resposta e service autenticado das ações.
- [x] Implementar formulário de importação e controles de validação/publicação/
      reativação.
- [x] Cobrir permissão, carregamento, JSON inválido, sucesso, issues e erro.
- [x] Atualizar documentação e registrar a entrega.
- [x] Executar `pnpm validate`, revisar o diff e verificar ausência de segredos.

## Riscos

- Um JSON grande pode degradar a página; limitar o textarea ao mesmo teto de
  20 KB usado para entradas textuais e informar o limite.
- Um sucesso de import/validate não altera o ativo; a UI deve mostrar o status
  retornado em vez de assumir `active`.
- Uma ação concorrente pode retornar conflito; o erro deve permanecer
  recuperável e incentivar nova leitura do diagnóstico.
- Renderizar issues sem escapar conteúdo pode expor texto inesperado; React
  deve renderizar strings como texto, nunca HTML.

## Critérios de aceite

- [x] Administrador Google autorizado vê controles de ciclo; sessão sem
      permissão não vê formulário nem resultado operacional.
- [x] Importação envia JSON parseado e rejeita entrada inválida sem `fetch`.
- [x] Validação, publicação e reativação enviam a ação correta e a versão.
- [x] Envio mostra estado ocupado e bloqueia duplicação até a resposta.
- [x] Resposta aceita mostra ação/status e atualiza o overview.
- [x] Issues 422, conflitos e falhas de rede aparecem sem perder a versão ou o
      JSON digitado.
- [x] Testes e `pnpm validate` ficam verdes, sem alterar o contrato RF-14B.
