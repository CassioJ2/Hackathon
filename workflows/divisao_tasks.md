# Divisão de Tasks — Hackathon

> Stack: Electron + React/Vite (UI) | GitHub API (backend/sync) | Parser de Markdown

---

## 🤝 Contrato Compartilhado (Fazer Primeiro — Juntos)

Antes de qualquer coisa, os dois precisam alinhar:

- [ ] Estrutura final do `tasks.md` (formato exato de checkboxes, subtasks, sprints)
- [ ] Estrutura do JSON interno (campos obrigatórios: `id`, `title`, `status`, `subtasks`)
- [ ] Nomes dos eventos IPC (ex: `tasks:load`, `tasks:update`, `github:auth`)
- [ ] Definir quais colunas do Kanban existem (ex: `To Do`, `In Progress`, `Done`)

---

## 🖥️ Backend — Cassio

### Fase 1 — Fundação

- [ ] Scaffolding do projeto Electron
  - [ ] Configurar `main.js` (processo principal)
  - [ ] Configurar Vite para o renderer (UI)
  - [ ] Verificar comunicação IPC básica entre main e renderer
- [ ] Setup do GitHub OAuth
  - [ ] Criar GitHub App (no github.com/settings/apps)
  - [ ] Guardar `GITHUB_CLIENT_ID` e `GITHUB_CLIENT_SECRET` no `.env`
  - [ ] Implementar fluxo de login OAuth (abrir browser → capturar callback → guardar token)

### Fase 2 — GitHub API Client

- [ ] Módulo `src/github/client.js`
  - [ ] `getFile(repo, path)` — lê o `tasks.md` e retorna conteúdo + SHA
  - [ ] `updateFile(repo, path, content, sha)` — commita nova versão do arquivo
  - [ ] `listRepos()` — lista repositórios do usuário autenticado
- [ ] Polling de mudanças externas
  - [ ] A cada 30s, busca o SHA atual do `tasks.md` no GitHub
  - [ ] Se SHA diferente do cached, dispara evento IPC `tasks:external-update` para o renderer

### Fase 3 — Parser

- [ ] Módulo `src/parser/index.js`
  - [ ] `parse(markdown)` → converte `tasks.md` em array de tasks (JSON)
  - [ ] `stringify(tasks)` → converte array de tasks de volta para `tasks.md`
  - [ ] Testes unitários básicos do parser (pelo menos 3 casos)

### Fase 4 — IPC Bridge

- [ ] Expor via `ipcMain` os handlers que o frontend vai chamar:
  - [ ] `github:login` → inicia OAuth
  - [ ] `github:repos` → retorna lista de repos
  - [ ] `tasks:load` → lê e parseia o `tasks.md` do repo selecionado
  - [ ] `tasks:save` → recebe tasks atualizadas, serializa e commita no GitHub

### Fase 5 — Empacotamento

- [ ] Configurar `electron-builder` para gerar `.exe` (Windows) e `.dmg` (Mac)
- [ ] Testar executável em máquina sem Node instalado

---

## 🎨 Frontend — [Nome do colega]

### Fase 1 — Fundação

- [ ] Setup do React + Vite dentro do Electron renderer
- [ ] Configurar bridge IPC no renderer (`window.electron` via `contextBridge`)
- [ ] Definir paleta de cores, tipografia e design tokens no CSS global

### Fase 2 — Telas de Autenticação e Seleção

- [ ] Tela de Login
  - [ ] Botão "Conectar com GitHub"
  - [ ] Estado de loading durante OAuth
  - [ ] Redirecionar para seleção de repo após login
- [ ] Tela de Seleção de Repositório
  - [ ] Listar repositórios do usuário (via IPC `github:repos`)
  - [ ] Campo de busca/filtro
  - [ ] Botão de confirmar seleção

### Fase 3 — Kanban Board

- [ ] Componente `KanbanBoard`
  - [ ] 3 colunas: To Do / In Progress / Done
  - [ ] Cards de task com título e subtasks
  - [ ] Drag and drop entre colunas (`@dnd-kit/core` ou similar)
  - [ ] Ao soltar card, disparar `tasks:save` via IPC com o estado atualizado
- [ ] Componente `TaskCard`
  - [ ] Exibir título, subtasks e contagem de progresso
  - [ ] Indicador visual de subtasks concluídas (ex: `2/3`)

### Fase 4 — Criação e Edição de Tasks

- [ ] Modal de criação de task
  - [ ] Campo de título
  - [ ] Opção de adicionar subtasks
  - [ ] Botão salvar → dispara `tasks:save`
- [ ] Edição inline de título ao clicar

### Fase 5 — Status de Sync

- [ ] Indicador de sync no header (similar ao GitHub Desktop)
  - [ ] `✓ Sincronizado` / `⟳ Sincronizando...` / `⚠ Conflito detectado`
- [ ] Toast notification quando mudança externa for detectada (`tasks:external-update`)

---

## 🔗 Pontos de Integração (revisar juntos)

| Evento IPC | Quem dispara | Quem recebe |
|---|---|---|
| `github:login` | Frontend | Backend |
| `github:repos` | Frontend | Backend |
| `tasks:load` | Frontend | Backend |
| `tasks:save` | Frontend | Backend |
| `tasks:external-update` | Backend (polling) | Frontend |
| `github:auth-success` | Backend (OAuth callback) | Frontend |

---

## ✅ Critério de Done

O produto está pronto quando:

1. Login com GitHub funciona
2. Seleção de repositório funciona
3. `tasks.md` é lido e exibido como Kanban
4. Mover task no Kanban cria um commit no GitHub
5. Edição externa no `tasks.md` atualiza o Kanban automaticamente
6. Entregável funciona como `.exe` sem Node instalado
