function getClientId(env) {
    const clientId = env.GITHUB_CLIENT_ID?.trim()

    if (!clientId) {
        throw new Error('Missing GITHUB_CLIENT_ID. Configure it before starting GitHub login.')
    }

    return clientId
}

function requireAuth(store) {
    const token = store.get('token')

    if (!token) {
        throw new Error('Not authenticated')
    }

    return token
}

function requireActiveRepo(store, fallbackRepo) {
    const activeRepo = fallbackRepo || store.get('activeRepo')

    if (!activeRepo) {
        throw new Error('No active repo selected')
    }

    return activeRepo
}

function isShaConflict(error) {
    return error?.status === 409 || error?.status === 422
}

export function createIpcHandlers({
    env,
    mainWindow,
    store,
    startDeviceFlow,
    pollForToken,
    getRepos,
    getFile,
    updateFile,
    parse,
    stringify,
    startPoller,
    stopPoller,
    createInitialTasksMarkdown
}) {
    return {
        'github:login': async () => {
            const clientId = getClientId(env)
            const deviceData = await startDeviceFlow(clientId)

            pollForToken(clientId, deviceData.device_code, deviceData.interval)
                .then((token) => {
                    store.set('token', token)
                    mainWindow.webContents.send('github:auth-success')
                    startPoller(mainWindow)
                })
                .catch((err) => {
                    mainWindow.webContents.send('github:auth-error', err.message)
                })

            return {
                userCode: deviceData.user_code,
                verificationUri: deviceData.verification_uri,
                expiresIn: deviceData.expires_in
            }
        },

        'github:repos': async () => {
            const token = requireAuth(store)
            return getRepos(token)
        },

        'tasks:load': async (_, { owner, repo }) => {
            const token = requireAuth(store)

            store.set('activeRepo', { owner, repo })
            startPoller(mainWindow)

            const file = await getFile(token, owner, repo, 'tasks.md')

            if (!file) {
                store.set('tasksSha', null)
                return []
            }

            store.set('tasksSha', file.sha)
            return parse(file.content)
        },

        'tasks:init': async (_, payload = {}) => {
            const token = requireAuth(store)
            const activeRepo = requireActiveRepo(store, payload.repo)
            const { owner, repo } = activeRepo
            const existingFile = await getFile(token, owner, repo, 'tasks.md')

            store.set('activeRepo', { owner, repo })
            startPoller(mainWindow)

            if (existingFile) {
                store.set('tasksSha', existingFile.sha)
                return {
                    created: false,
                    sha: existingFile.sha,
                    tasks: parse(existingFile.content)
                }
            }

            const markdown = createInitialTasksMarkdown()
            const result = await updateFile(
                token,
                owner,
                repo,
                'tasks.md',
                markdown,
                null,
                payload.commitMessage || 'chore: initialize tasks'
            )

            store.set('tasksSha', result.sha)

            return {
                created: true,
                sha: result.sha,
                tasks: parse(markdown)
            }
        },

        'tasks:save': async (_, { tasks, commitMessage }) => {
            const token = requireAuth(store)
            const activeRepo = requireActiveRepo(store)
            const { owner, repo } = activeRepo
            const sha = store.get('tasksSha')
            const markdown = stringify(tasks)
            const message = commitMessage || 'chore: update tasks'

            try {
                const result = await updateFile(token, owner, repo, 'tasks.md', markdown, sha, message)
                store.set('tasksSha', result.sha)

                return { success: true, sha: result.sha }
            } catch (error) {
                if (!isShaConflict(error)) {
                    throw error
                }

                const latestFile = await getFile(token, owner, repo, 'tasks.md')

                if (latestFile) {
                    store.set('tasksSha', latestFile.sha)
                    mainWindow.webContents.send('tasks:external-update', parse(latestFile.content))
                } else {
                    store.set('tasksSha', null)
                    mainWindow.webContents.send('tasks:external-update', [])
                }

                throw new Error('tasks.md changed on GitHub before saving. Latest version was reloaded.')
            }
        },

        'session:get': () => {
            return {
                isAuthenticated: !!store.get('token'),
                activeRepo: store.get('activeRepo')
            }
        },

        'session:clear': () => {
            store.set('token', null)
            store.set('activeRepo', null)
            store.set('tasksSha', null)
            stopPoller()

            return { success: true }
        }
    }
}
