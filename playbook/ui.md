# UI

## Selecao de repositorio

A tela deve:

- listar repositorios do GitHub
- permitir vincular clone local
- validar se a pasta corresponde ao repo escolhido
- carregar o repo com branch `tasks`

## Header

O header do board deve indicar:

- repo ativo
- modo local
- branch de tasks
- arquivos gerenciados na branch `tasks`

## Backlog

O backlog deve:

- mostrar somente tasks com `status: "backlog"`
- permitir filtros
- permitir enviar task para o board

## Board

O board deve:

- mostrar tasks com status de execucao
- suportar drag and drop
- permitir mover task de volta para backlog

## Conflitos

Ao detectar concorrencia, a UI deve oferecer:

- manter local
- carregar remoto
- mesclar
