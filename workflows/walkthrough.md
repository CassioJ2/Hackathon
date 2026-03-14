# Walkthrough — Backend Electron (CodeSprnt)

> Sessão de desenvolvimento: 14/03/2026
> Repositório: https://github.com/CassioJ2/Hackathon

---

## O que foi feito

### Conceito e Planejamento

Antes do código, o conceito do produto passou por várias iterações:

- **Problema original:** ferramentas de task management tradicionais não entendem o que a IA implementou
- **Solução definida:** app Electron que usa o próprio GitHub como backend — o `tasks.md` dentro do repositório é a fonte da verdade
- **Autenticação:** GitHub Device Flow (mais simples para app desktop, sem necessidade de URI scheme customizado)
- **Colaboração:** conflitos de merge resolvidos pelo próprio Git — o GitHub é o servidor de sync

---

### Arquitetura Implementada

```
[App Electron]
    ↕ Device Flow OAuth
[GitHub API]
    ↕ lê/escreve tasks.md
[Repositório GitHub]
    ↕ edição direta pela IA
[Cursor / Windsurf / etc.]
```

---

### Arquivos Criados

#### Configuração

| Arquivo | Descrição |
|---|---|
| `package.json` | Dependências: `electron`, `electron-vite`, `react`, `electron-store`, `electron-builder` |
| `electron.vite.config.js` | Configuração do Vite para main, preload e renderer |
| `src/renderer/index.html` | Entry point HTML do renderer |
| `.env.example` | Template com `GITHUB_CLIENT_ID` |
| `.gitignore` | Ignora `node_modules/`, `.env`, `dist/`, `out/` |

#### Backend (processo principal)

| Arquivo | Responsabilidade |
|---|---|
| `src/main/index.js` | Entry point do Electron — cria janela e registra IPC handlers |
| `src/main/store.js` | Persistência com `electron-store` (token, repo ativo, SHA cacheado) |
| `src/main/github/auth.js` | Device Flow OAuth — `startDeviceFlow()` e `pollForToken()` |
| `src/main/github/client.js` | GitHub API — `getRepos()`, `getFile()`, `updateFile()`, `getFileSha()` |
| `src/main/parser/index.js` | Converte `tasks.md` ↔ JSON com IDs automáticos e suporte a `pending`, `in_progress`, `done` |
| `src/main/watcher/poller.js` | Polling de 30s — detecta mudança de SHA e emite `tasks:external-update` |
| `src/main/ipc/handlers.js` | Todos os handlers IPC registrados |

#### IPC Bridge

| Arquivo | Responsabilidade |
|---|---|
| `src/preload/index.js` | Expõe `window.electron.invoke()` e `window.electron.on()` via `contextBridge` |

#### Renderer (placeholder para o frontend)

| Arquivo | Descrição |
|---|---|
| `src/renderer/main.jsx` | Entry point React |
| `src/renderer/App.jsx` | Componente placeholder |
| `src/renderer/index.css` | CSS base (reset + dark background) |

---

### Eventos IPC Disponíveis

```js
// Frontend chama → Backend responde
await window.electron.invoke('github:login')
// → retorna { userCode, verificationUri, expiresIn }
// → emite 'github:auth-success' quando autorizado

await window.electron.invoke('github:repos')
// → retorna lista de repos do usuário

await window.electron.invoke('tasks:load', { owner, repo })
// → retorna array de tasks parseadas do tasks.md

await window.electron.invoke('tasks:save', { tasks, commitMessage })
// → commita tasks.md no GitHub, retorna novo SHA

await window.electron.invoke('session:get')
// → retorna { isAuthenticated, activeRepo }

// Backend emite → Frontend escuta
window.electron.on('tasks:external-update', (tasks) => { ... })
window.electron.on('github:auth-success', () => { ... })
window.electron.on('github:auth-error', (msg) => { ... })
```

---

### Formato do tasks.md gerado pelo parser

```md
# Tasks

- [ ] Implementar login
  - [ ] Criar endpoint de login
  - [x] Adicionar hash de senha
- [/] Setup inicial
- [x] Criar repositório
```

Checkbox mapping: `[ ]` = pending | `[/]` = in_progress | `[x]` = done

---

### Como rodar

```bash
# 1. Clonar o repo
git clone https://github.com/CassioJ2/Hackathon.git
cd Hackathon

# 2. Instalar dependências
npm install

# 3. Criar .env com o Client ID do GitHub App
echo "GITHUB_CLIENT_ID=seu_client_id" > .env

# 4. Rodar em dev
npm run dev
```

---

### Pendente

- [ ] Frontend completo (telas de login, seleção de repo, kanban)
- [ ] Testes manuais integrados com `.env` real
- [ ] Build do `.exe` (`npm run dist`)
