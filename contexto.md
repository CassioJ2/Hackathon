# AI-Native Project Manager
## Hackathon Context

Projeto desenvolvido em hackathon com tempo limitado. MVP funcional que demonstra gerenciamento de projetos nativo para IA, priorizando clareza do conceito e demo sobre completude de features.

---

## Project Overview

Ferramenta de gerenciamento de projetos (estilo Jira/ClickUp) **para equipes pequenas que desenvolvem com IA**, onde a fonte da verdade das tasks é um arquivo de texto versionado no GitHub.

O problema das ferramentas tradicionais: exigem atualização manual. Quando a IA gera código, as tasks ficam desatualizadas porque o sistema não sabe o que foi implementado.

A solução:

> **Tasks como código, versionadas no GitHub, editáveis pela UI e pela IA diretamente.**

---

## Core Concept

O backlog é um arquivo `tasks.md` que vive dentro do repositório do projeto no GitHub.

```md
# Sprint 1

- [ ] Implementar login
  - [ ] Criar endpoint de login
  - [ ] Adicionar hash de senha

- [x] Setup inicial do projeto
```

O app lê e escreve esse arquivo via **GitHub API**. O GitHub é o backend, o servidor de sync e o sistema de controle de conflitos — sem infraestrutura customizada.

**Colaboração entre o time:**
- Dev A move tarefa para Done → app commita o `tasks.md` via GitHub API
- Dev B abre o app → app busca o estado atual do arquivo no GitHub → UI sincronizada
- Conflitos de edição simultânea → resolvidos pelo próprio GitHub (merge, PRs)

**Integração com IA:**
- Ferramentas como Cursor e Windsurf têm acesso ao repositório
- A IA edita o `tasks.md` diretamente como qualquer outro arquivo do projeto
- O app detecta a mudança e sincroniza a UI automaticamente

---

## Key Features (Hackathon Scope)

### 1. Conexão com GitHub

- Usuário conecta sua conta GitHub (OAuth)
- Seleciona um repositório (UX similar ao GitHub Desktop)
- App lê o `tasks.md` do repo ou cria um se não existir

### 2. Visual Task Interface

Renderiza o `tasks.md` como:

- Kanban board (To Do / In Progress / Done)
- Backlog list
- Task tree com subtasks

Usuários podem:
- Mover tarefas entre colunas
- Criar e editar tarefas
- Criar subtarefas

### 3. Bidirectional Sync

```
UI → GitHub API → tasks.md no repo
tasks.md no repo → GitHub API → UI
```

- Ação na UI → app commita o `tasks.md` atualizado via GitHub API
- Mudança no repo (por outro dev ou pela IA) → app detecta e re-renderiza a UI

### 4. AI-Native por Design

A IA edita o `tasks.md` como qualquer arquivo do projeto. O app consome o resultado. Sem MCP, sem endpoint especial, sem configuração extra — funciona com qualquer ferramenta de AI coding.

---

## Architecture

```
[App Desktop — Electron]
        ↕ lê/escreve via GitHub API
[tasks.md no repositório GitHub]
        ↕ editado diretamente
[AI (Cursor, Windsurf, etc.)]
```

### Frontend (dentro do Electron)

**Stack: React + Vite**

- Kanban board
- Backlog list
- OAuth GitHub login

### Parser Layer

Módulo interno que converte `tasks.md` ↔ estrutura de dados.

```json
{
  "tasks": [
    {
      "id": "TASK-001",
      "title": "Implementar login",
      "status": "pending",
      "subtasks": [
        { "id": "TASK-001-1", "title": "Criar endpoint", "status": "pending" },
        { "id": "TASK-001-2", "title": "Hash de senha", "status": "done" }
      ]
    }
  ]
}
```

### GitHub API Layer

- Autenticação via OAuth
- Leitura: `GET /repos/{owner}/{repo}/contents/tasks.md`
- Escrita: `PUT /repos/{owner}/{repo}/contents/tasks.md` (cria commit automaticamente)
- Polling para detectar mudanças externas (intervalo configurável, ex: 30s)

---

## File Structure

```
src/
  parser/        ← converte markdown ↔ JSON
  github/        ← GitHub API client (auth, read, write)
  ui/            ← React components (kanban, backlog, login)
  main/          ← Electron main process

workflows/       ← documentação de workflows para IA

.env.example     ← GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
```

---

## Hackathon Goals

**Critérios de sucesso:**
- [ ] Usuário conecta GitHub e seleciona repositório
- [ ] App gera kanban a partir do `tasks.md` do repo
- [ ] Mover tarefa no kanban reflete no `tasks.md` via commit automático
- [ ] Outro usuário (ou a IA) edita o `tasks.md` e a UI atualiza
- [ ] Demo funciona como `.exe` sem instalação de dependências

---

## Demo Scenario

1. Usuário abre o executável e conecta sua conta GitHub
2. Seleciona o repositório do projeto
3. App lê o `tasks.md` e gera kanban visual
4. Usuário move tarefa para "Done" → app cria commit no GitHub automaticamente
5. IA edita `tasks.md` adicionando subtarefa → app detecta e atualiza kanban
6. Segundo usuário abre o app → vê estado sincronizado do time

---

## Constraints

- Tempo de desenvolvimento limitado
- Sem servidor customizado (GitHub é o backend)
- Sem banco de dados
- Evitar over-engineering
- Foco em valor de demonstração

---

## Future Vision (Post Hackathon)

- Análise de commits para inferir tasks concluídas automaticamente
- Workflows multi-agente (múltiplas IAs colaborando no mesmo backlog)
- Geração de backlog por IA a partir do README
- Notificações de mudanças em tempo real (GitHub Webhooks)
- Plugin para VS Code