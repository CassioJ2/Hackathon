# Divisao de Tasks - Hackathon

> Stack: Electron + React/Vite (UI) | GitHub API (backend/sync) | Parser de Markdown

---

## Contrato Compartilhado

- [x] Estrutura final do `tasks.md` (formato definido no parser)
- [x] Estrutura do JSON interno (`id`, `title`, `status`, `subtasks`)
- [x] Nomes dos eventos IPC (definidos em `ipc/handlers.js`)
- [ ] Definir quais colunas do Kanban existem (alinhar com frontend)

---

## Backend - Cassio

### Fase 1 - Fundacao

- [x] Scaffolding do projeto Electron
  - [x] Configurar `main.js` (processo principal)
  - [x] Configurar Vite para o renderer (UI)
  - [x] Verificar comunicacao IPC basica entre main e renderer
- [x] Setup do GitHub OAuth (Device Flow)
  - [x] Criar GitHub App (no github.com/settings/apps)
  - [x] Guardar `GITHUB_CLIENT_ID` no `.env.example`
  - [x] Implementar fluxo de login OAuth via Device Flow

### Fase 2 - GitHub API Client

- [x] Modulo `src/main/github/client.js`
  - [x] `getFile(token, owner, repo, path)` - le o `tasks.md` e retorna conteudo + SHA
  - [x] `updateFile(...)` - commita nova versao do arquivo
  - [x] `getRepos(token)` - lista repositorios do usuario autenticado
  - [x] Melhorar tratamento de erro retornado pela API do GitHub
  - [x] Detectar conflitos de atualizacao por SHA e recarregar o estado remoto
- [x] Polling de mudancas externas (`src/main/watcher/poller.js`)
  - [x] A cada 30s, busca o SHA atual do `tasks.md` no GitHub
  - [x] Se SHA diferente do cached, dispara evento IPC `tasks:external-update`
  - [x] Se `tasks.md` for removido externamente, limpa o estado local

### Fase 3 - Parser

- [x] Modulo `src/main/parser/index.js`
  - [x] `parse(markdown)` -> converte `tasks.md` em array de tasks (JSON)
  - [x] `stringify(tasks)` -> converte array de tasks de volta para `tasks.md`
  - [x] Testes automatizados do parser
  - [ ] Testes manuais do parser

### Fase 4 - IPC Bridge

- [x] Modulo `src/main/ipc/handlers.js` + `src/preload/index.js`
  - [x] `github:login` -> inicia Device Flow OAuth
  - [x] `github:repos` -> retorna lista de repos
  - [x] `tasks:load` -> le e parseia o `tasks.md` do repo selecionado
  - [x] `tasks:init` -> cria `tasks.md` inicial quando o repositorio ainda nao tiver backlog
  - [x] `tasks:save` -> recebe tasks atualizadas, serializa e commita no GitHub
  - [x] `session:get` -> retorna estado de autenticacao atual
  - [x] `session:clear` -> limpa sessao local e para o polling
  - [x] Smoke tests da camada IPC
  - [x] Recarregar `tasks.md` remoto automaticamente em conflito de salvamento

### Fase 5 - Empacotamento

- [x] Configurar `electron-builder` para gerar `.exe` (Windows)
- [x] Gerar e validar localmente o instalador Windows (`npm run dist`)
- [ ] Configurar `electron-builder` para gerar `.dmg` (Mac)
- [ ] Testar executavel em maquina sem Node instalado

---

## Frontend

### Fase 1 - Fundacao

- [x] Setup do React + Vite dentro do Electron renderer
- [x] Configurar bridge IPC no renderer (`window.electron` via `contextBridge`)
- [ ] Definir paleta de cores, tipografia e design tokens no CSS global

### Fase 2 - Telas de Autenticacao e Selecao

- [ ] Tela de Login
  - [ ] Exibir `user_code` e link `verification_uri` para o usuario autorizar
  - [ ] Estado de loading durante polling do token
  - [ ] Redirecionar para selecao de repo apos `github:auth-success`
- [ ] Tela de Selecao de Repositorio
  - [ ] Listar repositorios (via IPC `github:repos`)
  - [ ] Campo de busca/filtro
  - [ ] Botao de confirmar selecao -> chama `tasks:load`

### Fase 3 - Kanban Board

- [ ] Componente `KanbanBoard`
  - [ ] 3 colunas: To Do / In Progress / Done
  - [ ] Cards de task com titulo e subtasks
  - [ ] Drag and drop entre colunas (`@dnd-kit/core` ou similar)
  - [ ] Ao soltar card, disparar `tasks:save` via IPC
- [ ] Componente `TaskCard`
  - [ ] Exibir titulo, subtasks e contagem de progresso (`2/3`)

### Fase 4 - Criacao e Edicao de Tasks

- [ ] Modal de criacao de task (titulo + subtasks + salvar)
- [ ] Edicao inline de titulo ao clicar

### Fase 5 - Status de Sync

- [ ] Indicador de sync no header (`Sincronizado` / `Sincronizando...`)
- [ ] Toast notification quando `tasks:external-update` chegar

---

## Pontos de Integracao

| Evento IPC | Quem dispara | Quem recebe |
|---|---|---|
| `github:login` | Frontend | Backend |
| `github:repos` | Frontend | Backend |
| `tasks:load` | Frontend | Backend |
| `tasks:init` | Frontend | Backend |
| `tasks:save` | Frontend | Backend |
| `session:get` | Frontend | Backend |
| `session:clear` | Frontend | Backend |
| `tasks:external-update` | Backend (polling) | Frontend |
| `github:auth-success` | Backend (OAuth) | Frontend |
| `github:auth-error` | Backend (OAuth) | Frontend |

---

## Criterio de Done

1. Login com GitHub funciona (Device Flow)
2. Selecao de repositorio funciona
3. `tasks.md` e lido e exibido como Kanban
4. Mover task no Kanban cria um commit no GitHub
5. Edicao externa no `tasks.md` atualiza o Kanban automaticamente
6. Entregavel funciona como `.exe` sem Node instalado
