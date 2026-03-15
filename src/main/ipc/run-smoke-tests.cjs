const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')

function loadFactoryModule() {
    const filePath = join(__dirname, 'contracts.js')
    const source = readFileSync(filePath, 'utf-8')
        .replace(/import\s+\{\s*syncLocalWatcherSnapshot\s*\}\s+from\s+'\.\.\/watcher\/poller'\s*\r?\n\r?\n/, '')
        .replace('export function createIpcHandlers', 'function createIpcHandlers')

    const factory = new Function('syncLocalWatcherSnapshot', `${source}\nreturn { createIpcHandlers }`)
    return factory(() => {})
}

function loadSpecModule() {
    const filePath = join(__dirname, 'spec.js')
    const source = readFileSync(filePath, 'utf-8')
        .replace('export const IPC_CONTRACT =', 'const IPC_CONTRACT =')

    const factory = new Function(`${source}\nreturn { IPC_CONTRACT }`)
    return factory()
}

function createMemoryStore(initialState = {}) {
    const state = {
        token: null,
        activeRepo: null,
        tasksSha: null,
        dirtyRepos: {},
        ...initialState
    }

    return {
        get(key) {
            return state[key]
        },
        set(key, value) {
            state[key] = value
        },
        snapshot() {
            return { ...state }
        }
    }
}

function createMainWindowRecorder() {
    const sent = []

    return {
        sent,
        mainWindow: {
            webContents: {
                send(channel, ...args) {
                    sent.push({ channel, args })
                }
            }
        }
    }
}

async function run(name, fn) {
    try {
        await fn()
        console.log(`PASS ${name}`)
    } catch (error) {
        console.error(`FAIL ${name}`)
        throw error
    }
}

const { createIpcHandlers } = loadFactoryModule()
const { IPC_CONTRACT } = loadSpecModule()

async function main() {
    await run('registra handlers esperados e responde session:get', async () => {
        const { mainWindow } = createMainWindowRecorder()
        const store = createMemoryStore({
            token: 'abc',
            activeRepo: { owner: 'cassio', repo: 'ai-project' }
        })

        const handlers = createIpcHandlers({
            env: { GITHUB_CLIENT_ID: 'client-id' },
            mainWindow,
            store,
            startDeviceFlow: async () => ({}),
            pollForToken: async () => 'token',
            getRepos: async () => [],
            getRepoCollaborators: async () => [],
            getFile: async () => null,
            updateFile: async () => ({ sha: 'sha-1' }),
            parse: () => [],
            stringify: () => '# Tasks\n',
            pickLocalRepoPath: async () => 'D:\\Projeto\\AI-Project',
            startPoller: () => {},
            stopPoller: () => {},
            createInitialTasksMarkdown: () => '# Tasks\n'
        })

        assert.deepEqual(
            Object.keys(handlers).sort(),
            [
                'github:login',
                'github:repo-collaborators',
                'github:repos',
                'repo:open-tasks-file',
                'repo:pick-local-path',
                'repo:validate-local-path',
                'session:clear',
                'session:get',
                'tasks:cache',
                'tasks:init',
                'tasks:load',
                'tasks:pull',
                'tasks:save'
            ].sort()
        )

        assert.deepEqual(
            Object.keys(IPC_CONTRACT.invoke).sort(),
            [
                'github:login',
                'github:repo-collaborators',
                'github:repos',
                'repo:open-tasks-file',
                'repo:pick-local-path',
                'repo:validate-local-path',
                'session:clear',
                'session:get',
                'tasks:cache',
                'tasks:init',
                'tasks:load',
                'tasks:pull',
                'tasks:save'
            ].sort()
        )

        const session = handlers['session:get']()
        assert.equal(session.isAuthenticated, true)
        assert.deepEqual(session.activeRepo, { owner: 'cassio', repo: 'ai-project', tasksBranch: 'tasks' })
    })

    await run('repo:pick-local-path retorna a pasta selecionada', async () => {
        const { mainWindow } = createMainWindowRecorder()
        const store = createMemoryStore()

        const handlers = createIpcHandlers({
            env: { GITHUB_CLIENT_ID: 'client-id' },
            mainWindow,
            store,
            startDeviceFlow: async () => ({}),
            pollForToken: async () => 'token',
            getRepos: async () => [],
            getRepoCollaborators: async () => [],
            getFile: async () => null,
            updateFile: async () => ({ sha: 'sha-1' }),
            parse: () => [],
            stringify: () => '# Tasks\n',
            pickLocalRepoPath: async () => 'D:\\Projeto\\AI-Project',
            startPoller: () => {},
            stopPoller: () => {},
            createInitialTasksMarkdown: () => '# Tasks\n'
        })

        const result = await handlers['repo:pick-local-path']()
        assert.equal(result, 'D:\\Projeto\\AI-Project')
    })

    await run('repo:open-tasks-file abre o tasks.md do repo local vinculado', async () => {
        const { mainWindow } = createMainWindowRecorder()
        const store = createMemoryStore({
            activeRepo: { owner: 'cassio', repo: 'ai-project', localPath: 'D:\\Projeto\\AI-Project' }
        })

        const handlers = createIpcHandlers({
            env: { GITHUB_CLIENT_ID: 'client-id' },
            mainWindow,
            store,
            startDeviceFlow: async () => ({}),
            pollForToken: async () => 'token',
            getRepos: async () => [],
            getRepoCollaborators: async () => [],
            getFile: async () => null,
            updateFile: async () => ({ sha: 'sha-1' }),
            parse: () => [],
            stringify: () => '# Tasks\n',
            openTasksFile: async (activeRepo) => ({ success: !!activeRepo.localPath }),
            startPoller: () => {},
            stopPoller: () => {},
            createInitialTasksMarkdown: () => '# Tasks\n'
        })

        const result = await handlers['repo:open-tasks-file']()
        assert.equal(result.success, true)
    })

    await run('repo:validate-local-path valida a pasta selecionada contra owner/repo', async () => {
        const { mainWindow } = createMainWindowRecorder()
        const store = createMemoryStore()

        const handlers = createIpcHandlers({
            env: { GITHUB_CLIENT_ID: 'client-id' },
            mainWindow,
            store,
            startDeviceFlow: async () => ({}),
            pollForToken: async () => 'token',
            getRepos: async () => [],
            getRepoCollaborators: async () => [],
            getFile: async () => null,
            updateFile: async () => ({ sha: 'sha-1' }),
            parse: () => [],
            stringify: () => '# Tasks\n',
            validateLocalRepoPath: async (localPath, owner, repo) => ({
                valid: true,
                reason: null,
                remoteUrl: `${localPath}:${owner}/${repo}`,
                detectedRepo: { owner, repo }
            }),
            startPoller: () => {},
            stopPoller: () => {},
            createInitialTasksMarkdown: () => '# Tasks\n'
        })

        const result = await handlers['repo:validate-local-path'](null, {
            owner: 'cassio',
            repo: 'ai-project',
            localPath: 'D:\\Projeto\\AI-Project'
        })

        assert.equal(result.valid, true)
        assert.deepEqual(result.detectedRepo, { owner: 'cassio', repo: 'ai-project' })
    })

    await run('github:login publica evento de sucesso apos receber token', async () => {
        const { mainWindow, sent } = createMainWindowRecorder()
        const store = createMemoryStore()

        const handlers = createIpcHandlers({
            env: { GITHUB_CLIENT_ID: 'client-id' },
            mainWindow,
            store,
            startDeviceFlow: async () => ({
                device_code: 'device-code',
                user_code: 'USER-123',
                verification_uri: 'https://github.com/login/device',
                expires_in: 900,
                interval: 1
            }),
            pollForToken: async () => 'token-123',
            getRepos: async () => [],
            getRepoCollaborators: async () => [],
            getFile: async () => null,
            updateFile: async () => ({ sha: 'sha-1' }),
            parse: () => [],
            stringify: () => '# Tasks\n',
            startPoller: () => {},
            stopPoller: () => {},
            createInitialTasksMarkdown: () => '# Tasks\n'
        })

        const result = await handlers['github:login']()
        await Promise.resolve()

        assert.equal(result.userCode, 'USER-123')
        assert.equal(store.get('token'), 'token-123')
        assert.equal(sent[0].channel, 'github:auth-success')
    })

    await run('tasks:init cria tasks.md inicial no cache local e no repo real quando informado', async () => {
        const { mainWindow } = createMainWindowRecorder()
        const store = createMemoryStore({
            token: 'token-123',
            activeRepo: { owner: 'cassio', repo: 'ai-project' }
        })
        const writes = []
        const repoWrites = []

        const handlers = createIpcHandlers({
            env: { GITHUB_CLIENT_ID: 'client-id' },
            mainWindow,
            store,
            startDeviceFlow: async () => ({}),
            pollForToken: async () => 'token',
            getRepos: async () => [],
            getRepoCollaborators: async () => [],
            getFile: async () => null,
            updateFile: async () => ({ sha: 'sha-created' }),
            parse: (markdown) => [{ id: 'TASK-001', title: markdown.split('\n')[2], status: 'pending', subtasks: [] }],
            stringify: () => '# Tasks\n',
            writeLocalTasksMarkdown: async (...args) => {
                writes.push(args)
            },
            writeRepoTasksMarkdown: async (...args) => {
                repoWrites.push(args)
            },
            startPoller: () => {},
            stopPoller: () => {},
            createInitialTasksMarkdown: () => '# Tasks\n\n- [ ] Setup inicial do projeto\n'
        })

        const result = await handlers['tasks:init'](null, {
            repo: {
                owner: 'cassio',
                repo: 'ai-project',
                localPath: 'D:\\Projeto\\AI-Project'
            }
        })

        assert.equal(result.created, true)
        assert.equal(result.sha, null)
        assert.equal(writes.length, 1)
        assert.equal(writes[0][0], 'cassio')
        assert.equal(writes[0][1], 'ai-project')
        assert.equal(repoWrites.length, 1)
        assert.equal(repoWrites[0][0], 'D:\\Projeto\\AI-Project')
        assert.deepEqual(store.get('activeRepo'), {
            owner: 'cassio',
            repo: 'ai-project',
            localPath: 'D:\\Projeto\\AI-Project',
            tasksBranch: 'tasks'
        })
    })

    await run('tasks:load prefere o tasks.md do repositorio local real e preserva SHA remoto quando disponivel', async () => {
        const { mainWindow } = createMainWindowRecorder()
        const store = createMemoryStore({ token: 'token-123' })
        const ensuredBranches = []
        const ensuredContexts = []
        const refs = []

        const handlers = createIpcHandlers({
            env: { GITHUB_CLIENT_ID: 'client-id' },
            mainWindow,
            store,
            startDeviceFlow: async () => ({}),
            pollForToken: async () => 'token',
            getRepos: async () => [],
            getRepoCollaborators: async () => [],
            getFile: async (_token, _owner, _repo, _path, options = {}) => {
                refs.push(options.ref)
                return { sha: 'sha-remoto', content: '# Tasks\n\n- [ ] Remoto\n' }
            },
            updateFile: async () => ({ sha: 'sha-1' }),
            ensureBranch: async (_token, owner, repo, branch) => {
                ensuredBranches.push(`${owner}/${repo}:${branch}`)
                return { created: false, branch }
            },
            parse: (markdown) => [{ id: 'TASK-001', title: markdown.includes('Repo local') ? 'Repo local' : markdown.includes('Local') ? 'Local' : 'Remoto', status: 'pending', subtasks: [] }],
            stringify: () => '# Tasks\n',
            readRepoTasksMarkdown: async () => '# Tasks\n\n- [ ] Repo local\n',
            readLocalTasksMarkdown: async () => '# Tasks\n\n- [ ] Local\n',
            ensureRepoAiContextFiles: async (localPath, repoInfo) => {
                ensuredContexts.push({ localPath, repoInfo })
                return { created: ['playbook/README.md', 'playbook/product.md'] }
            },
            startPoller: () => {},
            stopPoller: () => {},
            createInitialTasksMarkdown: () => '# Tasks\n'
        })

        const result = await handlers['tasks:load'](null, {
            owner: 'cassio',
            repo: 'ai-project',
            localPath: 'D:\\Projeto\\AI-Project'
        })

        assert.equal(result[0].title, 'Repo local')
        assert.equal(store.get('tasksSha'), 'sha-remoto')
        assert.deepEqual(ensuredBranches, ['cassio/ai-project:tasks'])
        assert.equal(refs[0], 'tasks')
        assert.equal(ensuredContexts[0].localPath, 'D:\\Projeto\\AI-Project')
        assert.deepEqual(store.get('activeRepo'), {
            owner: 'cassio',
            repo: 'ai-project',
            localPath: 'D:\\Projeto\\AI-Project',
            tasksBranch: 'tasks'
        })
    })

    await run('tasks:init com force recria tasks.md local mesmo quando ja existe', async () => {
        const { mainWindow } = createMainWindowRecorder()
        const store = createMemoryStore({
            token: 'token-123',
            activeRepo: { owner: 'cassio', repo: 'ai-project', localPath: 'D:\\Projeto\\AI-Project' }
        })
        const writes = []
        const repoWrites = []

        const handlers = createIpcHandlers({
            env: { GITHUB_CLIENT_ID: 'client-id' },
            mainWindow,
            store,
            startDeviceFlow: async () => ({}),
            pollForToken: async () => 'token',
            getRepos: async () => [],
            getRepoCollaborators: async () => [],
            getFile: async () => ({ sha: 'sha-existente', content: '# Tasks\n' }),
            updateFile: async () => ({ sha: 'sha-reset' }),
            parse: (markdown) => [{ id: 'TASK-001', title: markdown.split('\n')[2], status: 'pending', subtasks: [] }],
            stringify: () => '# Tasks\n',
            writeLocalTasksMarkdown: async (...args) => {
                writes.push(args)
            },
            writeRepoTasksMarkdown: async (...args) => {
                repoWrites.push(args)
            },
            startPoller: () => {},
            stopPoller: () => {},
            createInitialTasksMarkdown: () => '# Tasks\n\n- [ ] Setup inicial do projeto\n'
        })

        const result = await handlers['tasks:init'](null, { force: true })

        assert.equal(result.created, true)
        assert.equal(result.sha, null)
        assert.equal(writes.length, 1)
        assert.equal(writes[0][0], 'cassio')
        assert.equal(writes[0][1], 'ai-project')
        assert.equal(repoWrites[0][0], 'D:\\Projeto\\AI-Project')
    })

    await run('tasks:cache salva o estado local do repo ativo no cache e no repo real', async () => {
        const { mainWindow } = createMainWindowRecorder()
        const store = createMemoryStore({
            activeRepo: { owner: 'cassio', repo: 'ai-project', localPath: 'D:\\Projeto\\AI-Project' }
        })
        const writes = []
        const repoWrites = []

        const handlers = createIpcHandlers({
            env: { GITHUB_CLIENT_ID: 'client-id' },
            mainWindow,
            store,
            startDeviceFlow: async () => ({}),
            pollForToken: async () => 'token',
            getRepos: async () => [],
            getRepoCollaborators: async () => [],
            getFile: async () => null,
            updateFile: async () => ({ sha: 'sha-1' }),
            parse: () => [],
            stringify: (tasks) => JSON.stringify(tasks),
            writeLocalTasksMarkdown: async (...args) => {
                writes.push(args)
            },
            writeRepoTasksMarkdown: async (...args) => {
                repoWrites.push(args)
            },
            startPoller: () => {},
            stopPoller: () => {},
            createInitialTasksMarkdown: () => '# Tasks\n'
        })

        const result = await handlers['tasks:cache'](null, { tasks: [{ id: 'TASK-001' }] })

        assert.equal(result.success, true)
        assert.equal(writes[0][0], 'cassio')
        assert.equal(writes[0][1], 'ai-project')
        assert.equal(writes[0][2], '[{"id":"TASK-001"}]')
        assert.equal(repoWrites[0][0], 'D:\\Projeto\\AI-Project')
        assert.equal(repoWrites[0][1], '[{"id":"TASK-001"}]')
    })

    await run('tasks:pull aplica remoto automaticamente quando nao ha mudancas locais', async () => {
        const { mainWindow } = createMainWindowRecorder()
        const store = createMemoryStore({
            token: 'token-123',
            activeRepo: { owner: 'cassio', repo: 'ai-project', localPath: 'D:\\Projeto\\AI-Project', tasksBranch: 'tasks' }
        })
        const writes = []
        const repoWrites = []

        const handlers = createIpcHandlers({
            env: { GITHUB_CLIENT_ID: 'client-id' },
            mainWindow,
            store,
            startDeviceFlow: async () => ({}),
            pollForToken: async () => 'token',
            getRepos: async () => [],
            getRepoCollaborators: async () => [],
            getFile: async () => ({ sha: 'sha-remoto', content: '# Tasks\n\n- [ ] Remota\n' }),
            updateFile: async () => ({ sha: 'sha-1' }),
            ensureBranch: async () => ({ created: false, branch: 'tasks' }),
            parse: () => [{ id: 'TASK-001', title: 'Remota', status: 'pending', subtasks: [] }],
            stringify: () => '# Tasks\n',
            writeLocalTasksMarkdown: async (...args) => {
                writes.push(args)
            },
            writeRepoTasksMarkdown: async (...args) => {
                repoWrites.push(args)
            },
            startPoller: () => {},
            stopPoller: () => {},
            createInitialTasksMarkdown: () => '# Tasks\n'
        })

        const result = await handlers['tasks:pull']()

        assert.equal(result.mode, 'applied')
        assert.equal(result.sha, 'sha-remoto')
        assert.equal(writes[0][2], '# Tasks\n\n- [ ] Remota\n')
        assert.equal(repoWrites[0][1], '# Tasks\n\n- [ ] Remota\n')
    })

    await run('tasks:pull retorna conflito quando ha mudancas locais pendentes', async () => {
        const { mainWindow } = createMainWindowRecorder()
        const store = createMemoryStore({
            token: 'token-123',
            activeRepo: { owner: 'cassio', repo: 'ai-project', localPath: 'D:\\Projeto\\AI-Project', tasksBranch: 'tasks' },
            dirtyRepos: { 'cassio/ai-project': true }
        })

        const handlers = createIpcHandlers({
            env: { GITHUB_CLIENT_ID: 'client-id' },
            mainWindow,
            store,
            startDeviceFlow: async () => ({}),
            pollForToken: async () => 'token',
            getRepos: async () => [],
            getRepoCollaborators: async () => [],
            getFile: async () => ({ sha: 'sha-remoto', content: '# Tasks\n\n- [ ] Remota\n' }),
            updateFile: async () => ({ sha: 'sha-1' }),
            ensureBranch: async () => ({ created: false, branch: 'tasks' }),
            parse: () => [{ id: 'TASK-001', title: 'Remota', status: 'pending', subtasks: [] }],
            stringify: () => '# Tasks\n',
            startPoller: () => {},
            stopPoller: () => {},
            createInitialTasksMarkdown: () => '# Tasks\n'
        })

        const result = await handlers['tasks:pull']()

        assert.equal(result.mode, 'conflict')
        assert.equal(result.tasks[0].title, 'Remota')
    })

    await run('session:clear limpa sessao e para o poller', async () => {
        const { mainWindow } = createMainWindowRecorder()
        const store = createMemoryStore({
            token: 'token-123',
            activeRepo: { owner: 'cassio', repo: 'ai-project' },
            tasksSha: 'sha-123'
        })
        let pollerStopped = false

        const handlers = createIpcHandlers({
            env: { GITHUB_CLIENT_ID: 'client-id' },
            mainWindow,
            store,
            startDeviceFlow: async () => ({}),
            pollForToken: async () => 'token',
            getRepos: async () => [],
            getRepoCollaborators: async () => [],
            getFile: async () => null,
            updateFile: async () => ({ sha: 'sha-1' }),
            parse: () => [],
            stringify: () => '# Tasks\n',
            startPoller: () => {},
            stopPoller: () => {
                pollerStopped = true
            },
            createInitialTasksMarkdown: () => '# Tasks\n'
        })

        const result = handlers['session:clear']()

        assert.equal(result.success, true)
        assert.equal(store.get('token'), null)
        assert.equal(store.get('activeRepo'), null)
        assert.equal(store.get('tasksSha'), null)
        assert.deepEqual(store.get('dirtyRepos'), {})
        assert.equal(pollerStopped, true)
    })

    await run('tasks:save recarrega estado remoto quando encontra conflito de SHA', async () => {
        const { mainWindow, sent } = createMainWindowRecorder()
        const store = createMemoryStore({
            token: 'token-123',
            activeRepo: { owner: 'cassio', repo: 'ai-project', localPath: 'D:\\Projeto\\AI-Project' },
            tasksSha: 'sha-antigo'
        })
        const writes = []
        const repoWrites = []

        const handlers = createIpcHandlers({
            env: { GITHUB_CLIENT_ID: 'client-id' },
            mainWindow,
            store,
            startDeviceFlow: async () => ({}),
            pollForToken: async () => 'token',
            getRepos: async () => [],
            getRepoCollaborators: async () => [],
            getFile: async () => ({ sha: 'sha-remoto', content: '# Tasks\n\n- [x] Task remota\n' }),
            updateFile: async () => {
                const error = new Error('sha conflict')
                error.status = 409
                throw error
            },
            parse: () => [{ id: 'TASK-001', title: 'Task remota', status: 'done', subtasks: [] }],
            stringify: () => '# Tasks\n\n- [ ] Task local\n',
            writeLocalTasksMarkdown: async (...args) => {
                writes.push(args)
            },
            writeRepoTasksMarkdown: async (...args) => {
                repoWrites.push(args)
            },
            startPoller: () => {},
            stopPoller: () => {},
            createInitialTasksMarkdown: () => '# Tasks\n'
        })

        await assert.rejects(
            () => handlers['tasks:save'](null, { tasks: [], commitMessage: 'test' }),
            /changed on GitHub before saving/
        )

        assert.equal(store.get('tasksSha'), 'sha-remoto')
        assert.equal(sent.length, 1)
        assert.equal(sent[0].channel, 'tasks:remote-conflict')
        assert.equal(sent[0].args[0][0].title, 'Task remota')
        assert.equal(writes.length, 1)
        assert.equal(repoWrites.length, 1)
    })

    await run('tasks:save serializa salvamentos consecutivos e reutiliza o SHA atualizado', async () => {
        const { mainWindow } = createMainWindowRecorder()
        const store = createMemoryStore({
            token: 'token-123',
            activeRepo: { owner: 'cassio', repo: 'ai-project', localPath: 'D:\\Projeto\\AI-Project' },
            tasksSha: 'sha-inicial'
        })
        const seenShas = []

        const handlers = createIpcHandlers({
            env: { GITHUB_CLIENT_ID: 'client-id' },
            mainWindow,
            store,
            startDeviceFlow: async () => ({}),
            pollForToken: async () => 'token',
            getRepos: async () => [],
            getRepoCollaborators: async () => [],
            getFile: async () => ({ sha: 'sha-remoto-final', content: '# Tasks\n' }),
            updateFile: async (_token, _owner, _repo, _path, _content, sha) => {
                seenShas.push(sha)
                await new Promise((resolve) => setTimeout(resolve, 5))

                if (sha === 'sha-inicial') {
                    return { sha: 'sha-1' }
                }

                if (sha === 'sha-remoto-final') {
                    return { sha: 'sha-2' }
                }

                throw new Error(`unexpected sha ${sha}`)
            },
            parse: () => [],
            stringify: (tasks) => JSON.stringify(tasks),
            writeRepoTasksMarkdown: async () => {},
            startPoller: () => {},
            stopPoller: () => {},
            createInitialTasksMarkdown: () => '# Tasks\n'
        })

        const firstSave = handlers['tasks:save'](null, {
            tasks: [{ id: 'TASK-001', title: 'Primeira', status: 'pending', subtasks: [] }]
        })
        const secondSave = handlers['tasks:save'](null, {
            tasks: [{ id: 'TASK-001', title: 'Segunda', status: 'done', subtasks: [] }]
        })

        const results = await Promise.all([firstSave, secondSave])

        assert.deepEqual(seenShas, ['sha-inicial', 'sha-remoto-final'])
        assert.equal(results[0].sha, 'sha-remoto-final')
        assert.equal(results[1].sha, 'sha-remoto-final')
        assert.equal(store.get('tasksSha'), 'sha-remoto-final')
    })

    await run('tasks:save atualiza cache local com a versao remota final', async () => {
        const { mainWindow } = createMainWindowRecorder()
        const store = createMemoryStore({
            token: 'token-123',
            activeRepo: { owner: 'cassio', repo: 'ai-project', localPath: 'D:\\Projeto\\AI-Project' },
            tasksSha: 'sha-inicial'
        })
        const writes = []
        const repoWrites = []

        const handlers = createIpcHandlers({
            env: { GITHUB_CLIENT_ID: 'client-id' },
            mainWindow,
            store,
            startDeviceFlow: async () => ({}),
            pollForToken: async () => 'token',
            getRepos: async () => [],
            getRepoCollaborators: async () => [],
            getFile: async () => ({ sha: 'sha-remoto-final', content: '# Tasks\n\n- [x] Remota final\n' }),
            updateFile: async () => ({ sha: 'sha-atualizada' }),
            parse: () => [{ id: 'TASK-001', title: 'Remota final', status: 'done', subtasks: [] }],
            stringify: () => '# Tasks\n\n- [ ] Local\n',
            writeLocalTasksMarkdown: async (...args) => {
                writes.push(args)
            },
            writeRepoTasksMarkdown: async (...args) => {
                repoWrites.push(args)
            },
            startPoller: () => {},
            stopPoller: () => {},
            createInitialTasksMarkdown: () => '# Tasks\n'
        })

        const result = await handlers['tasks:save'](null, { tasks: [], commitMessage: 'test' })

        assert.equal(result.sha, 'sha-remoto-final')
        assert.equal(result.tasks[0].title, 'Remota final')
        assert.equal(writes.length, 2)
        assert.equal(writes[1][2], '# Tasks\n\n- [x] Remota final\n')
        assert.equal(repoWrites.length, 2)
        assert.equal(repoWrites[1][1], '# Tasks\n\n- [x] Remota final\n')
    })

    await run('github:repo-collaborators usa o repo ativo da sessao', async () => {
        const { mainWindow } = createMainWindowRecorder()
        const store = createMemoryStore({
            token: 'token-123',
            activeRepo: { owner: 'cassio', repo: 'ai-project' }
        })

        const handlers = createIpcHandlers({
            env: { GITHUB_CLIENT_ID: 'client-id' },
            mainWindow,
            store,
            startDeviceFlow: async () => ({}),
            pollForToken: async () => 'token',
            getRepos: async () => [],
            getRepoCollaborators: async (_token, owner, repo) => [{ id: 1, login: `${owner}/${repo}` }],
            getFile: async () => null,
            updateFile: async () => ({ sha: 'sha-1' }),
            parse: () => [],
            stringify: () => '# Tasks\n',
            startPoller: () => {},
            stopPoller: () => {},
            createInitialTasksMarkdown: () => '# Tasks\n'
        })

        const result = await handlers['github:repo-collaborators']()

        assert.deepEqual(result, [{ id: 1, login: 'cassio/ai-project' }])
    })
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
