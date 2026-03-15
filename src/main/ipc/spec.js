export const IPC_CONTRACT = {
    version: '1.0.0',
    invoke: {
        'github:login': {
            description: 'Inicia o GitHub Device Flow e retorna os dados para autorizacao.',
            args: [],
            returns: {
                userCode: 'string',
                verificationUri: 'string',
                expiresIn: 'number'
            },
            errors: ['Missing GITHUB_CLIENT_ID']
        },
        'github:repos': {
            description: 'Lista os repositorios da conta autenticada.',
            args: [],
            returns: 'Array<{ id, name, fullName, owner, private, updatedAt }>',
            errors: ['Not authenticated']
        },
        'tasks:load': {
            description: 'Carrega o tasks.md do repositorio selecionado.',
            args: [{ owner: 'string', repo: 'string' }],
            returns: 'Array<Task>',
            errors: ['Not authenticated']
        },
        'tasks:init': {
            description: 'Cria um tasks.md inicial quando o repositorio ainda nao possui backlog.',
            args: [{ repo: '{ owner, repo } (optional)', commitMessage: 'string (optional)' }],
            returns: {
                created: 'boolean',
                sha: 'string',
                tasks: 'Array<Task>'
            },
            errors: ['Not authenticated', 'No active repo selected']
        },
        'tasks:save': {
            description: 'Salva o estado atual das tasks no GitHub.',
            args: [{ tasks: 'Array<Task>', commitMessage: 'string (optional)' }],
            returns: {
                success: 'boolean',
                sha: 'string'
            },
            errors: [
                'Not authenticated',
                'No active repo selected',
                'tasks.md changed on GitHub before saving. Latest version was reloaded.'
            ]
        },
        'session:get': {
            description: 'Retorna o estado atual da sessao local.',
            args: [],
            returns: {
                isAuthenticated: 'boolean',
                activeRepo: '{ owner, repo } | null'
            },
            errors: []
        },
        'session:clear': {
            description: 'Limpa token, repo ativo e cache local de sincronizacao.',
            args: [],
            returns: {
                success: 'boolean'
            },
            errors: []
        }
    },
    events: {
        'github:auth-success': {
            description: 'Emitido quando o Device Flow retorna um token valido.',
            payload: []
        },
        'github:auth-error': {
            description: 'Emitido quando o Device Flow falha.',
            payload: ['message: string']
        },
        'tasks:external-update': {
            description: 'Emitido quando o tasks.md muda externamente e a UI deve recarregar.',
            payload: ['tasks: Array<Task>']
        }
    },
    models: {
        Task: {
            id: 'string',
            title: 'string',
            status: '"pending" | "in_progress" | "done"',
            subtasks: 'Array<Subtask>'
        },
        Subtask: {
            id: 'string',
            title: 'string',
            status: '"pending" | "in_progress" | "done"'
        }
    }
}
