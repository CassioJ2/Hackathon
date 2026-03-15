# IPC

## Papel do IPC no produto

O IPC e a ponte entre a UI e o processo principal do Electron.

Ele e responsavel por expor:

- login com GitHub
- leitura e escrita de tasks
- sync remoto
- validacao de repo local
- estado de sessao

## Canais principais

- `github:login`
- `github:repos`
- `github:repo-collaborators`
- `repo:pick-local-path`
- `repo:open-tasks-file`
- `repo:validate-local-path`
- `tasks:load`
- `tasks:init`
- `tasks:cache`
- `tasks:pull`
- `tasks:save`
- `session:get`
- `session:clear`

## Eventos principais

- `github:auth-success`
- `github:auth-error`
- `tasks:external-update`
- `tasks:remote-conflict`
- `tasks:local-file-update`
- `tasks:local-file-conflict`

## Regra de implementacao

Toda mudanca de contrato deve manter compatibilidade entre:

- backend Electron
- preload
- renderer
- testes de smoke
