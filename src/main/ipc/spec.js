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
        'github:repo-collaborators': {
            description: 'Lista colaboradores do repositorio ativo ou informado.',
            args: [{ repo: '{ owner, repo } (optional)' }],
            returns: 'Array<{ id, login, name, avatarUrl, profileUrl }>',
            errors: ['Not authenticated', 'No active repo selected']
        },
        'repo:pick-local-path': {
            description: 'Abre o seletor de pasta para vincular o repositorio local clonado.',
            args: [],
            returns: 'string | null',
            errors: []
        },
        'repo:open-tasks-file': {
            description: 'Abre o tasks.md do repositorio local vinculado no editor padrao do sistema.',
            args: [],
            returns: '{ success: boolean }',
            errors: ['No active repo selected', 'No local repo linked. Link a local folder before opening tasks.md.']
        },
        'repo:validate-local-path': {
            description: 'Valida se a pasta escolhida parece ser o clone local do repositorio selecionado.',
            args: [{ owner: 'string', repo: 'string', localPath: 'string' }],
            returns: '{ valid: boolean, reason: string | null, remoteUrl: string | null, detectedRepo: { owner, repo } | null }',
            errors: []
        },
        'tasks:load': {
            description: 'Carrega o tasks.md do repositorio selecionado.',
            args: [{ owner: 'string', repo: 'string', localPath: 'string (optional)' }],
            returns: 'Array<Task>',
            errors: ['Not authenticated']
        },
        'tasks:init': {
            description: 'Cria ou recria um tasks.md inicial no cache local do repositorio ativo.',
            args: [{ repo: '{ owner, repo } (optional)', commitMessage: 'string (optional)', force: 'boolean (optional)' }],
            returns: {
                created: 'boolean',
                sha: 'string | null',
                tasks: 'Array<Task>'
            },
            errors: ['No active repo selected']
        },
        'tasks:cache': {
            description: 'Salva o estado atual das tasks apenas no cache local.',
            args: [{ tasks: 'Array<Task>', dirty: 'boolean (optional)' }],
            returns: {
                success: 'boolean'
            },
            errors: ['No active repo selected']
        },
        'tasks:save': {
            description: 'Envia o cache local para o GitHub e atualiza o cache com a versao remota final.',
            args: [{ tasks: 'Array<Task>', commitMessage: 'string (optional)' }],
            returns: {
                success: 'boolean',
                sha: 'string',
                tasks: 'Array<Task>'
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
                activeRepo: '{ owner, repo, localPath? } | null',
                tasksDirty: 'boolean'
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
        },
        'tasks:remote-conflict': {
            description: 'Emitido quando existe atualizacao remota, mas ha mudancas locais pendentes.',
            payload: ['tasks: Array<Task>']
        },
        'tasks:local-file-update': {
            description: 'Emitido quando o tasks.md local muda externamente e a UI deve recarregar.',
            payload: ['tasks: Array<Task>']
        },
        'tasks:local-file-conflict': {
            description: 'Emitido quando o tasks.md local muda externamente, mas ha mudancas locais pendentes.',
            payload: ['tasks: Array<Task>']
        }
    },
    models: {
        Task: {
            id: 'string',
            title: 'string',
            status: '"backlog" | "pending" | "in_progress" | "done"',
            assignee: 'string (optional)',
            subtasks: 'Array<Subtask>'
        },
        Subtask: {
            id: 'string',
            title: 'string',
            status: '"pending" | "in_progress" | "done"'
        }
    }
}
