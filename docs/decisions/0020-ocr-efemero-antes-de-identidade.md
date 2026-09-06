# ADR 0020: OCR efêmero antes de identidade e Storage privado

## Status

Aceita em 2026-09-06.

## Contexto

O fluxo de screenshot precisa validar e extrair texto sem colocar Cloud Vision
ou dados de imagem em componentes web. O projeto ainda não possui autenticação
nem regras de Storage para vincular um upload ao dono de um craft.

## Decisão

- Receber a imagem no endpoint backend, validar MIME e limite de 8 MB e processar
  os bytes somente em memória.
- Usar o cliente oficial do Cloud Vision atrás de uma função injetável, com
  fixture por ambiente para testes locais.
- Expor apenas texto extraído e `processedAt`; nunca retornar a imagem ou
  credenciais ao browser.
- Manter o endpoint desabilitado por padrão até `POE_OCR_ENABLED=true` ou uma
  fixture explícita ser configurada.
- Adiar Storage privado, TTL de 24 horas, App Check e contador durável para o
  incremento de identidade/regras.

## Consequências

- O incremento é testável sem chamadas pagas e não abre regras de Storage.
- A cota atual é por instância de Functions e não substitui um contador durável
  de produção.
- A próxima evolução deve adicionar identidade, Storage privado e limpeza antes
  de liberar o endpoint para tráfego não confiável.
