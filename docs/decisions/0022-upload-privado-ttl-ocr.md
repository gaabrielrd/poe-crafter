# 0022 — OCR por upload privado com TTL

## Contexto

O endpoint de OCR recebia bytes diretamente e não tinha garantia de limpeza
fora do processo da requisição. A sessão anônima/Google e as Storage Rules por
UID permitem fechar a fronteira sem persistir o screenshot no craft.

## Decisão

O navegador envia a imagem validada para `screenshots/{uid}/{uploadId}` usando o
SDK Storage e envia ao backend apenas o caminho, um `requestId` e o ID token.
Functions verifica o token, confere o prefixo e os metadados reais, baixa o
objeto, chama o adaptador Cloud Vision e remove o arquivo em `finally`.

Uma função agendada remove órfãos com mais de 24 horas. A quota mensal é
reservada por transação Firestore e chave idempotente; o contador não depende do
estado do browser. Fixtures substituem Auth/Storage/Vision nos testes.

## Consequências

- Screenshots não ficam no histórico nem são acessíveis por outro UID.
- Falhas de OCR, rede ou quota preservam o fallback de texto colado.
- O backend passa a exigir configuração/credencial administrativa no ambiente
  de Functions; nenhum segredo é enviado ao app web.
- A persistência de crafts e o histórico continuam sendo um incremento separado.
