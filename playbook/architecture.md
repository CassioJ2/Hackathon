# Arquitetura

## Main process

Responsabilidades:

- autenticacao com GitHub
- chamadas a API do GitHub
- persistencia local
- watchers
- IPC entre Electron main e renderer

Pastas relevantes:

- `src/main/github/`
- `src/main/ipc/`
- `src/main/tasks/`
- `src/main/parser/`
- `src/main/watcher/`

## Renderer

Responsabilidades:

- interface visual
- backlog
- board
- modal de task
- feedback de conflito e sync

Pastas relevantes:

- `src/renderer/pages/`
- `src/renderer/components/`

## Arquivos mais importantes para implementacao

### Backend

- `src/main/ipc/contracts.js`
- `src/main/ipc/handlers.js`
- `src/main/github/client.js`
- `src/main/tasks/local-repo.js`
- `src/main/watcher/poller.js`
- `src/main/parser/index.js`

### Frontend

- `src/renderer/pages/KanbanPage.jsx`
- `src/renderer/pages/RepoSelectPage.jsx`
- `src/renderer/components/TaskModal.jsx`
- `src/renderer/components/TaskCard.jsx`

## Regra arquitetural

Se uma mudanca estrutural for proposta, ela deve preservar:

- edicao de `tasks.md` com o app aberto
- sync com GitHub
- backlog e board no mesmo modelo
- branch `tasks`
- atribuicao por colaboradores do GitHub
