# Sessão anônima e login Google

**Status:** Implementado em 2026-09-06
**Origem:** RF-12, CA-11 e RN-14 do [PRD](../prd.md)
**Dependências:** [Importação de screenshot com OCR](importacao-de-screenshot-com-ocr.md)

## Objetivo

Adicionar uma sessão Firebase anônima iniciada automaticamente e permitir que o
jogador a vincule somente a uma conta Google. A sessão deve preparar a fronteira
de identidade para persistência privada e Storage protegido sem tornar login
obrigatório para começar um craft.

## Requisitos

- Criar sessão anônima no primeiro carregamento quando não existir usuário.
- Exibir estado de carregamento, anônimo, Google vinculado e erro recuperável.
- Oferecer uma única ação de vínculo/login Google usando o provider oficial.
- Preservar o UID e o craft local durante a vinculação, sem duplicar identidade.
- Tratar cancelamento, popup bloqueado, conflito de credencial e perda de rede
  sem afirmar que o vínculo ocorreu.
- Manter credenciais e SDK Firebase atrás de serviços/adaptadores; componentes
  React recebem apenas estado e ações públicas.
- Configurar o Emulator Suite Auth para testes e manter produção sem IDs ou
  credenciais pessoais versionados.
- Preparar regras de Storage para que apenas o dono autenticado acesse o prefixo
  temporário do próprio screenshot; todo o restante continua deny-all.

## Não escopo

- Email/senha, GitHub, Discord ou qualquer provider além do Google.
- Exclusão de conta, reautenticação destrutiva ou painel administrativo.
- Histórico completo, sincronização de crafts no Firestore ou migração de dados
  já existentes; isso será o incremento de persistência após a identidade.
- Planejamento, craftabilidade, preços, OCR adicional ou APIs da GGG.
- Compartilhamento público, links de craft ou múltiplas contas simultâneas.

## Suposições e lacunas

- O fluxo anônimo será `signInAnonymously` e o vínculo usará `linkWithPopup` ou
  `linkWithRedirect`, nunca um novo `signIn` que abandone a sessão atual.
- O ambiente já dispõe de configuração pública Firebase suficiente para Auth;
  chaves pessoais continuam em `.env.local`/`.firebaserc` ignorados.
- Testes de navegador poderão usar o Auth Emulator; o E2E não dependerá de uma
  conta Google real nem de popup externo.
- Em caso de conflito, a sessão anônima permanece intacta e a UI orienta o
  jogador a autenticar novamente antes de qualquer merge explícito.
- As regras de Storage serão preparadas para o prefixo `screenshots/{uid}/`;
  limpeza/TTL de 24 horas será implementada junto do upload protegido.

## Módulos envolvidos

- `apps/web/src/features/identity/`: estado da sessão, ações de login e UI de
  conta, com uma única API pública.
- `apps/web/src/shared/config/env.ts`: somente variáveis públicas Firebase
  tipadas, sem leitura de `import.meta.env` em outros módulos.
- `functions/src/`: validação de contexto autenticado quando endpoints privados
  passarem a existir; nenhum segredo chega ao browser.
- `storage.rules`, `firebase.json` e Emulator Suite: prefixo privado por UID e
  testes de leitura/escrita anônima, própria e alheia.
- `apps/web/src/app/App.tsx` e navegação: disponibilizar estado de identidade
  sem bloquear `/new`.
- Testes de feature, regras e `e2e/app.spec.ts`.

## Solução proposta

1. Adicionar o SDK Firebase Web somente ao workspace web e criar um adaptador de
   Auth com inicialização única e provider Google explícito.
2. Modelar `IdentityState` (`loading`, `anonymous`, `google`, `error`) e ações
   `ensureAnonymousSession`/`linkGoogle`, normalizando erros do SDK.
3. Inicializar a sessão no provider raiz, manter o estado reativo com
   `onAuthStateChanged` e permitir que `/new` continue utilizável enquanto o
   estado carrega.
4. Atualizar Storage Rules para o prefixo privado por UID, sem abrir Firestore ou
   outros caminhos, e cobrir os casos no emulador.
5. Criar UI compacta de conta com foco acessível, confirmação clara de sucesso e
   fallback sem perda do craft anônimo.
6. Adicionar testes unitários do adaptador/estado, rules tests e E2E com Auth
   Emulator; nenhum teste deve abrir Google real.
7. Atualizar arquitetura, integrações, README, ADR e evidência da entrega após
   `pnpm validate` verde.

## Tarefas sequenciais

1. Confirmar variáveis públicas Firebase, configuração do Auth Emulator e
   comportamento de popup/redirect suportado pelo navegador alvo.
2. Instalar/configurar o SDK web e implementar o adaptador de identidade com
   inicialização idempotente.
3. Criar máquina de estados e testes para sessão anônima, usuário Google,
   cancelamento, conflito e falha de rede.
4. Integrar o provider de identidade ao App sem bloquear o wizard `/new`.
5. Restringir `storage.rules` por UID e adicionar testes de acesso próprio,
   alheio, não autenticado e caminhos fora do prefixo.
6. Adicionar E2E determinístico usando o emulador, incluindo reload e preservação
   do craft durante o vínculo simulado.
7. Rodar `pnpm validate`, revisar diff e documentar as decisões e limitações.

## Riscos e pontos de atenção

- Usar `signInWithPopup` em vez de vincular a sessão pode criar UID novo e perder
  o craft anônimo; o adaptador deve expor somente a operação de vínculo.
- Popup bloqueado ou redirect interrompido não pode deixar a UI em estado de
  sucesso falso nem descartar o estado local.
- Regras permissivas de Storage expõem screenshots; o teste de acesso alheio é
  obrigatório antes de liberar o prefixo.
- O Auth Emulator e produção podem divergir em persistência; validar reload e
  limpeza sem depender de dados reais.
- Não adicionar listeners ou inicializações Firebase em componentes de tela.

## Critérios de aceite

- [x] Um visitante inicia sessão anônima automaticamente e `/new` continua
      utilizável durante e depois do carregamento.
- [x] A única opção de identidade é vincular/login Google; email/senha e outros
      providers não aparecem nem são aceitos pelo adaptador.
- [x] Vínculo concluído mantém o UID/craft e mostra estado Google confirmado.
- [x] Cancelamento, popup bloqueado, conflito e rede exibem erro acionável sem
      afirmar sucesso ou apagar o craft.
- [x] Storage permite somente o dono autenticado em `screenshots/{uid}/` e
      mantém todos os demais caminhos negados no emulador.
- [x] Testes unitários, Storage rules estruturais e E2E passam sem conta Google real;
      `pnpm validate` fica verde no ambiente de validação.
