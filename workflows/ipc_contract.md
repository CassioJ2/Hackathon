# IPC Contract - CodeSprnt

Esta e a referencia do contrato entre frontend e backend Electron.

## Como consumir no renderer

```js
const contract = window.electron.getContract()
console.log(contract.invoke['tasks:save'])
```

Tambem existe acesso direto por:

```js
window.electron.contract
```

## Canais invoke

### `github:login`

- Entrada: nenhuma
- Retorno: `{ userCode, verificationUri, expiresIn }`
- Erros: `Missing GITHUB_CLIENT_ID`

### `github:repos`

- Entrada: nenhuma
- Retorno: `Array<{ id, name, fullName, owner, private, updatedAt }>`
- Erros: `Not authenticated`

### `tasks:load`

- Entrada: `{ owner, repo }`
- Retorno: `Array<Task>`
- Erros: `Not authenticated`

### `tasks:init`

- Entrada: `{ repo?, commitMessage? }`
- Retorno: `{ created, sha, tasks }`
- Erros: `Not authenticated`, `No active repo selected`

### `tasks:save`

- Entrada: `{ tasks, commitMessage? }`
- Retorno: `{ success, sha }`
- Erros:
- `Not authenticated`
- `No active repo selected`
- `tasks.md changed on GitHub before saving. Latest version was reloaded.`

### `session:get`

- Entrada: nenhuma
- Retorno: `{ isAuthenticated, activeRepo }`

### `session:clear`

- Entrada: nenhuma
- Retorno: `{ success: true }`

### `ipc:contract`

- Entrada: nenhuma
- Retorno: contrato IPC completo

## Eventos emitidos pelo backend

### `github:auth-success`

- Payload: nenhum

### `github:auth-error`

- Payload: `message`

### `tasks:external-update`

- Payload: `tasks`

## Modelos

```js
Task = {
  id: string,
  title: string,
  status: 'pending' | 'in_progress' | 'done',
  subtasks: Subtask[]
}

Subtask = {
  id: string,
  title: string,
  status: 'pending' | 'in_progress' | 'done'
}
```
