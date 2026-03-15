const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')

function loadFactoryModule() {
    const filePath = join(__dirname, 'contracts.js')
    const source = readFileSync(filePath, 'utf-8')
        .replace('export function createIpcHandlers', 'function createIpcHandlers')

    const factory = new Function(`${source}\nreturn { createIpcHandlers }`)
    return factory()
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
            getFile: async () => null,
            updateFile: async () => ({ sha: 'sha-1' }),
            parse: () => [],
            stringify: () => '# Tasks\n',
            startPoller: () => {},
            stopPoller: () => {},
            createInitialTasksMarkdown: () => '# Tasks\n'
        })

        assert.deepEqual(
            Object.keys(handlers).sort(),
            [
                'github:login',
                'github:repos',
                'session:clear',
                'session:get',
                'tasks:init',
                'tasks:load',
                'tasks:save'
            ].sort()
        )

        assert.deepEqual(
            Object.keys(IPC_CONTRACT.invoke).sort(),
            [
                'github:login',
                'github:repos',
                'session:clear',
                'session:get',
                'tasks:init',
                'tasks:load',
                'tasks:save'
            ].sort()
        )

        const session = handlers['session:get']()
        assert.equal(session.isAuthenticated, true)
        assert.deepEqual(session.activeRepo, { owner: 'cassio', repo: 'ai-project' })
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

    await run('tasks:init cria tasks.md inicial quando o arquivo nao existe', async () => {
        const { mainWindow } = createMainWindowRecorder()
        const store = createMemoryStore({
            token: 'token-123',
            activeRepo: { owner: 'cassio', repo: 'ai-project' }
        })
        const updates = []

        const handlers = createIpcHandlers({
            env: { GITHUB_CLIENT_ID: 'client-id' },
            mainWindow,
            store,
            startDeviceFlow: async () => ({}),
            pollForToken: async () => 'token',
            getRepos: async () => [],
            getFile: async () => null,
            updateFile: async (...args) => {
                updates.push(args)
                return { sha: 'sha-created' }
            },
            parse: (markdown) => [{ id: 'TASK-001', title: markdown.split('\n')[2], status: 'pending', subtasks: [] }],
            stringify: () => '# Tasks\n',
            startPoller: () => {},
            stopPoller: () => {},
            createInitialTasksMarkdown: () => '# Tasks\n\n- [ ] Setup inicial do projeto\n'
        })

        const result = await handlers['tasks:init'](null, {})

        assert.equal(result.created, true)
        assert.equal(result.sha, 'sha-created')
        assert.equal(store.get('tasksSha'), 'sha-created')
        assert.equal(updates.length, 1)
        assert.equal(updates[0][3], 'tasks.md')
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
        assert.equal(pollerStopped, true)
    })

    await run('tasks:save recarrega estado remoto quando encontra conflito de SHA', async () => {
        const { mainWindow, sent } = createMainWindowRecorder()
        const store = createMemoryStore({
            token: 'token-123',
            activeRepo: { owner: 'cassio', repo: 'ai-project' },
            tasksSha: 'sha-antigo'
        })

        const handlers = createIpcHandlers({
            env: { GITHUB_CLIENT_ID: 'client-id' },
            mainWindow,
            store,
            startDeviceFlow: async () => ({}),
            pollForToken: async () => 'token',
            getRepos: async () => [],
            getFile: async () => ({ sha: 'sha-remoto', content: '# Tasks\n\n- [x] Task remota\n' }),
            updateFile: async () => {
                const error = new Error('sha conflict')
                error.status = 409
                throw error
            },
            parse: () => [{ id: 'TASK-001', title: 'Task remota', status: 'done', subtasks: [] }],
            stringify: () => '# Tasks\n\n- [ ] Task local\n',
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
        assert.equal(sent[0].channel, 'tasks:external-update')
        assert.equal(sent[0].args[0][0].title, 'Task remota')
    })

    await run('tasks:save serializa salvamentos consecutivos e reutiliza o SHA atualizado', async () => {
        const { mainWindow } = createMainWindowRecorder()
        const store = createMemoryStore({
            token: 'token-123',
            activeRepo: { owner: 'cassio', repo: 'ai-project' },
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
            getFile: async () => ({ sha: 'sha-remoto', content: '# Tasks\n' }),
            updateFile: async (_token, _owner, _repo, _path, _content, sha) => {
                seenShas.push(sha)
                await new Promise((resolve) => setTimeout(resolve, 5))

                if (sha === 'sha-inicial') {
                    return { sha: 'sha-1' }
                }

                if (sha === 'sha-1') {
                    return { sha: 'sha-2' }
                }

                throw new Error(`unexpected sha ${sha}`)
            },
            parse: () => [],
            stringify: (tasks) => JSON.stringify(tasks),
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

        assert.deepEqual(seenShas, ['sha-inicial', 'sha-1'])
        assert.equal(results[0].sha, 'sha-1')
        assert.equal(results[1].sha, 'sha-2')
        assert.equal(store.get('tasksSha'), 'sha-2')
    })
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
