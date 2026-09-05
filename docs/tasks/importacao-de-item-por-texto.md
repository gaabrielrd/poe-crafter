# Importação de item por texto

## Contexto

O marco estrutural está concluído, mas a aplicação ainda não recebe um item
alvo. O primeiro fluxo funcional deve aceitar o texto copiado do cliente inglês
de Path of Exile 1 e apresentar uma representação normalizada para confirmação.
O contrato inicial usa o formato de exportação fornecido pelo produto, incluindo
linhas de defesa, influências, prefixes/suffixes com ranges, qualidade, sockets,
nível requerido, implícitos e explícitos.

## Objetivo

Permitir colar um único item não único de PoE 1, validar os limites de entrada e
exibir os campos reconhecidos de forma estruturada antes de qualquer
planejamento.

## Escopo

- Criar a feature `item-import` com API pública e parser determinístico puro.
- Adicionar a rota `/new` e uma tela acessível de importação por texto.
- Aceitar texto em inglês de até 20 KB e detectar múltiplos itens.
- Normalizar base, nível do item, raridade, defesas, influências, estado
  `Crafted`, prefixes, suffixes, qualidade, sockets, nível requerido,
  implícitos e explícitos.
- Preservar ranges/tags dos affixes e linhas não interpretadas para revisão.
- Mostrar erros acionáveis para texto vazio, limite excedido, múltiplos itens,
  base ausente e item level ausente.
- Adicionar testes unitários do parser, testes de UI e um fluxo E2E da rota.

## Não escopo

- Screenshot, OCR, Cloud Vision ou upload.
- Login Google, sessão anônima, Firestore ou persistência.
- Seleção de liga, preços, classificação de modificadores ou crafting engine.
- Validação semântica de legalidade, tiers ou regras de crafting.
- Integração com APIs da GGG, RePoE ou poe.ninja.

## Suposições

- O texto é o formato em inglês exemplificado pelo usuário e usa linhas
  separadas por `\\n` ou `\\r\\n`.
- `New Item` identifica o início de um item; uma segunda ocorrência torna a
  entrada inválida nesta primeira versão.
- O nome da base é a primeira linha não vazia após `New Item` que não seja um
  cabeçalho conhecido.
- O parser não inventa valores: campos desconhecidos ficam em
  `unparsedLines` para confirmação futura.
- A ausência de item level bloqueia a confirmação e orienta o usuário a corrigir
  a importação; não haverá inferência a partir do nível requerido.

## Solução proposta

1. Definir contratos serializáveis em `@poe-crafter/shared-types` para o alvo
   normalizado, affixes e erros de importação.
2. Implementar o parser em `apps/web/src/features/item-import/model`, sem
   dependência de React ou Firebase, com validações de tamanho e estrutura.
3. Criar a tela `/new` usando `Textarea`, `Button` e `Alert` locais, cobrindo
   vazio, carregamento síncrono, erro e sucesso; renderizar o resumo em ordem
   de leitura e permitir voltar ao texto.
4. Adicionar uma fixture baseada no item `Divine Crown` fornecido, testes de
   sucesso e falha e o cenário E2E de importação.
5. Atualizar a navegação/home apenas para apontar para o início do fluxo, sem
   antecipar as etapas de planejamento.

## Tarefas sequenciais

1. Adicionar os tipos compartilhados e a fixture do exemplo.
2. Implementar validação e parsing determinístico, com testes de comportamento.
3. Adicionar `Textarea` se necessário e construir a tela `/new`.
4. Registrar a rota e o ponto de entrada na navegação.
5. Adicionar testes de UI/E2E e executar os gates focados.
6. Atualizar documentação e registrar a evidência após `pnpm validate`.

## Riscos

- Variações futuras do texto exportado podem introduzir cabeçalhos ou formatos
  de affix não reconhecidos; linhas desconhecidas devem permanecer visíveis.
- O formato não contém um marcador universal para todos os limites de item;
  detecção de múltiplos itens ficará restrita a ocorrências de `New Item`.
- A rota é local e síncrona neste incremento; a futura API de parsing deverá
  reutilizar os mesmos contratos sem acoplar a UI ao backend.

## Critérios de aceite

- [ ] Texto vazio, maior que 20 KB, múltiplos itens ou sem base é rejeitado com
      mensagem específica.
- [ ] O exemplo `Divine Crown` gera um alvo com os campos principais,
      influências, affixes, tags/ranges e modificadores visíveis.
- [ ] Item level ausente impede a confirmação e orienta a correção.
- [ ] `/new` funciona por teclado a partir de 360 px e apresenta estados de
      erro e sucesso sem usar cores literais ou componentes fora do styleguide.
- [ ] Testes unitários, UI, E2E e `pnpm validate` permanecem verdes.
