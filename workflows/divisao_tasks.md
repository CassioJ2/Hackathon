# Divisão de Tasks — Hackathon

> Stack: Electron + React/Vite (UI) | GitHub API (backend/sync) | Parser de Markdown

---

## 🤝 Contrato Compartilhado (Fazer Primeiro — Juntos)

- [x] Estrutura final do `tasks.md` (formato definido no parser)
- [x] Estrutura do JSON interno (`id`, `title`, `status`, `subtasks`)
- [x] Nomes dos eventos IPC (definidos em `ipc/handlers.js`)
- [ ] Definir quais colunas do Kanban existem (alinhar com frontend)

---

## 🖥️ Backend — Cassio

### Fase 1 — Fundação

- [x] Scaffolding do projeto Electron
  - [x] Configurar `main.js` (processo principal)
  - [x] Configurar Vite para o renderer (UI)
  - [ ] Verificar comunicação IPC básica entre main e renderer (pendente teste com .env)
- [x] Setup do GitHub OAuth (Device Flow)
  - [x] Criar GitHub App (no github.com/settings/apps)
  - [x] Guardar `GITHUB_CLIENT_ID` no `.env.example`
  - [x] Implementar fluxo de login OAuth via Device Flow

### Fase 2 — GitHub API Client

- [x] Módulo `src/main/github/client.js`
  - [x] `getFile(token, owner, repo, path)` — lê o `tasks.md` e retorna conteúdo + SHA
  - [x] `updateFile(...)` — commita nova versão do arquivo
  - [x] `getRepos(token)` — lista repositórios do usuário autenticado
- [x] Polling de mudanças externas (`src/main/watcher/poller.js`)
  - [x] A cada 30s, busca o SHA atual do `tasks.md` no GitHub
  - [x] Se SHA diferente do cached, dispara evento IPC `tasks:external-update`

### Fase 3 — Parser

- [x] Módulo `src/main/parser/index.js`
  - [x] `parse(markdown)` → converte `tasks.md` em array de tasks (JSON)
  - [x] `stringify(tasks)` → converte array de tasks de volta para `tasks.md`
  - [ ] Testes manuais do parser

### Fase 4 — IPC Bridge

- [x] Módulo `src/main/ipc/handlers.js` + `src/preload/index.js`
  - [x] `github:login` → inicia Device Flow OAuth
  - [x] `github:repos` → retorna lista de repos
  - [x] `tasks:load` → lê e parseia o `tasks.md` do repo selecionado
  - [x] `tasks:save` → recebe tasks atualizadas, serializa e commita no GitHub
  - [x] `session:get` → retorna estado de autenticação atual

### Fase 5 — Empacotamento

- [ ] Configurar `electron-builder` para gerar `.exe` (Windows) e `.dmg` (Mac)
- [ ] Testar executável em máquina sem Node instalado

---

## 🎨 Frontend

### Fase 1 — Fundação

- [x] Setup do React + Vite dentro do Electron renderer
- [x] Configurar bridge IPC no renderer (`window.electron` via `contextBridge`)
- [ ] Definir paleta de cores, tipografia e design tokens no CSS global

### Fase 2 — Telas de Autenticação e Seleção

- [ ] Tela de Login
  - [ ] Exibir `user_code` e link `verification_uri` para o usuário autorizar
  - [ ] Estado de loading durante polling do token
  - [ ] Redirecionar para seleção de repo após `github:auth-success`
- [ ] Tela de Seleção de Repositório
  - [ ] Listar repositórios (via IPC `github:repos`)
  - [ ] Campo de busca/filtro
  - [ ] Botão de confirmar seleção → chama `tasks:load`

### Fase 3 — Kanban Board

- [ ] Componente `KanbanBoard`
  - [ ] 3 colunas: To Do / In Progress / Done
  - [ ] Cards de task com título e subtasks
  - [ ] Drag and drop entre colunas (`@dnd-kit/core` ou similar)
  - [ ] Ao soltar card, disparar `tasks:save` via IPC
- [ ] Componente `TaskCard`
  - [ ] Exibir título, subtasks e contagem de progresso (`2/3`)

### Fase 4 — Criação e Edição de Tasks

- [ ] Modal de criação de task (título + subtasks + salvar)
- [ ] Edição inline de título ao clicar

### Fase 5 — Status de Sync

- [ ] Indicador de sync no header (`✓ Sincronizado` / `⟳ Sincronizando...`)
- [ ] Toast notification quando `tasks:external-update` chegar

---

## 🔗 Pontos de Integração

| Evento IPC | Quem dispara | Quem recebe |
|---|---|---|
| `github:login` | Frontend | Backend |
| `github:repos` | Frontend | Backend |
| `tasks:load` | Frontend | Backend |
| `tasks:save` | Frontend | Backend |
| `session:get` | Frontend | Backend |
| `tasks:external-update` | Backend (polling) | Frontend |
| `github:auth-success` | Backend (OAuth) | Frontend |
| `github:auth-error` | Backend (OAuth) | Frontend |

---

## ✅ Critério de Done

1. Login com GitHub funciona (Device Flow)
2. Seleção de repositório funciona
3. `tasks.md` é lido e exibido como Kanban
4. Mover task no Kanban cria um commit no GitHub
5. Edição externa no `tasks.md` atualiza o Kanban automaticamente
6. Entregável funciona como `.exe` sem Node instalado
