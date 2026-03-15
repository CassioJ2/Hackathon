import { syncLocalWatcherSnapshot } from '../watcher/poller'

function getClientId(env) {
    const embeddedClientId =
        typeof __EMBEDDED_GITHUB_CLIENT_ID__ !== 'undefined'
            ? __EMBEDDED_GITHUB_CLIENT_ID__
            : ''
    const clientId = env.GITHUB_CLIENT_ID?.trim() || embeddedClientId?.trim()

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
    const activeRepo = normalizeActiveRepo(fallbackRepo || store.get('activeRepo'))

    if (!activeRepo) {
        throw new Error('No active repo selected')
    }

    return activeRepo
}

function isShaConflict(error) {
    return error?.status === 409 || error?.status === 422
}

function repoKey({ owner, repo }) {
    return `${owner}/${repo}`
}

function getTasksBranch(activeRepo) {
    return activeRepo?.tasksBranch || 'tasks'
}

function normalizeActiveRepo(activeRepo) {
    if (!activeRepo) {
        return activeRepo
    }

    return {
        ...activeRepo,
        tasksBranch: getTasksBranch(activeRepo)
    }
}

function getRepoDirty(store, activeRepo) {
    const dirtyRepos = store.get('dirtyRepos') || {}
    return !!dirtyRepos[repoKey(activeRepo)]
}

function setRepoDirty(store, activeRepo, dirty) {
    const dirtyRepos = { ...(store.get('dirtyRepos') || {}) }
    dirtyRepos[repoKey(activeRepo)] = dirty
    store.set('dirtyRepos', dirtyRepos)
}

const REMOTE_TASK_FILES = [
    'playbook/README.md',
    'playbook/product.md',
    'playbook/architecture.md',
    'playbook/data-model.md',
    'playbook/sync.md',
    'playbook/ui.md',
    'playbook/playbooks.md',
    'playbook/ipc.md',
    'playbook/parser.md',
    'playbook/mcp.md'
]

async function syncManagedFilesToRemote({
    token,
    owner,
    repo,
    branch,
    getFile,
    updateFile,
    readRepoContextFile,
    localPath,
    remoteFileShas = {}
}) {
    const nextRemoteFileShas = { ...remoteFileShas }

    for (const fileName of REMOTE_TASK_FILES) {
        const content = await readRepoContextFile(localPath, fileName)

        if (!content) {
            continue
        }

        let fileSha = nextRemoteFileShas[fileName] || null

        if (fileSha) {
            const remoteFile = await getFile(token, owner, repo, fileName, {
                ref: branch
            })

            if (remoteFile?.content === content) {
                nextRemoteFileShas[fileName] = remoteFile.sha
                continue
            }

            fileSha = remoteFile?.sha || fileSha
        }

        try {
            const result = await updateFile(
                token,
                owner,
                repo,
                fileName,
                content,
                fileSha,
                `chore: update ${fileName}`,
                { branch }
            )

            nextRemoteFileShas[fileName] = result.sha
        } catch (error) {
            if (!isShaConflict(error)) {
                throw error
            }

            const remoteFile = await getFile(token, owner, repo, fileName, {
                ref: branch
            })

            if (remoteFile?.content === content) {
                nextRemoteFileShas[fileName] = remoteFile.sha
                continue
            }

            const retryResult = await updateFile(
                token,
                owner,
                repo,
                fileName,
                content,
                remoteFile?.sha || null,
                `chore: update ${fileName}`,
                { branch }
            )

            nextRemoteFileShas[fileName] = retryResult.sha
        }
    }

    return nextRemoteFileShas
}

async function loadRemoteManagedFileShas({
    token,
    owner,
    repo,
    branch,
    getFile,
    writeRepoContextFile,
    localPath,
    localContextFiles = {}
}) {
    const remoteFileShas = {}

    for (const fileName of REMOTE_TASK_FILES) {
        const remoteContextFile = await getFile(token, owner, repo, fileName, {
            ref: branch
        })

        remoteFileShas[fileName] = remoteContextFile?.sha || null

        if (remoteContextFile && !localContextFiles[fileName]) {
            await writeRepoContextFile(localPath, fileName, remoteContextFile.content)
        }
    }

    return remoteFileShas
}

export function createIpcHandlers({
    env,
    mainWindow,
    store,
    startDeviceFlow,
    pollForToken,
    getRepos,
    getRepoCollaborators,
    getFile,
    updateFile,
    ensureBranch = async () => ({ created: false }),
    parse,
    stringify,
    readLocalTasksMarkdown = async () => null,
    writeLocalTasksMarkdown = async () => {},
    readRepoTasksMarkdown = async () => null,
    writeRepoTasksMarkdown = async () => {},
    readRepoContextFile = async () => null,
    writeRepoContextFile = async () => {},
    readRepoAiContextFiles = async () => ({}),
    createPlaybookFiles = () => ({}),
    pickLocalRepoPath = async () => null,
    openTasksFile = async () => ({ success: false }),
    validateLocalRepoPath = async () => ({ valid: true }),
    ensureRepoAiContextFiles = async () => ({ created: [] }),
    startPoller,
    stopPoller,
    createInitialTasksMarkdown
}) {
    const saveQueues = new Map()
    const inFlightSaves = new Map()

    function enqueueRepoSave(repoKey, operation) {
        const inFlight = inFlightSaves.get(repoKey)
        if (inFlight) {
            return inFlight
        }

        const previous = saveQueues.get(repoKey) || Promise.resolve()
        const next = previous.catch(() => {}).then(operation)
        const tracked = next.finally(() => {
            if (inFlightSaves.get(repoKey) === tracked) {
                inFlightSaves.delete(repoKey)
            }

            if (saveQueues.get(repoKey) === next) {
                saveQueues.delete(repoKey)
            }
        })

        saveQueues.set(repoKey, next)
        inFlightSaves.set(repoKey, tracked)

        return tracked
    }

    return {
        'github:login': async () => {
            const clientId = getClientId(env)
            console.log('[ipc] github:login invoked')
            const deviceData = await startDeviceFlow(clientId)

            pollForToken(clientId, deviceData.device_code, deviceData.interval)
                .then((token) => {
                    store.set('token', token)
                    mainWindow.webContents.send('github:auth-success')
                    startPoller(mainWindow)
                })
                .catch((err) => {
                    console.error('[ipc] github:login async auth error:', err)
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

        'github:repo-collaborators': async (_, payload = {}) => {
            const token = requireAuth(store)
            const activeRepo = requireActiveRepo(store, payload.repo)
            const { owner, repo } = activeRepo

            return getRepoCollaborators(token, owner, repo)
        },

        'repo:pick-local-path': async () => {
            return pickLocalRepoPath()
        },

        'repo:open-tasks-file': async () => {
            const activeRepo = requireActiveRepo(store)
            return openTasksFile(activeRepo)
        },

        'repo:validate-local-path': async (_, { owner, repo, localPath }) => {
            return validateLocalRepoPath(localPath, owner, repo)
        },

        'tasks:load': async (_, { owner, repo, localPath }) => {
            const token = requireAuth(store)
            const activeRepo = normalizeActiveRepo({
                owner,
                repo,
                localPath: localPath || null,
                tasksBranch: 'tasks'
            })

            store.set('activeRepo', activeRepo)
            store.set('pendingRemoteSha', null)
            await ensureRepoAiContextFiles(activeRepo.localPath, activeRepo)
            startPoller(mainWindow)

            const localContextFiles = activeRepo.localPath
                ? await readRepoAiContextFiles(activeRepo.localPath)
                : createPlaybookFiles(activeRepo)

            const repoMarkdown = await readRepoTasksMarkdown(activeRepo.localPath)
            if (repoMarkdown) {
                syncLocalWatcherSnapshot(repoMarkdown)
                const existingDirty = getRepoDirty(store, activeRepo)
                let remoteFile = null
                try {
                    remoteFile = await getFile(token, owner, repo, 'tasks.md', {
                        ref: getTasksBranch(activeRepo)
                    })
                    store.set('tasksSha', remoteFile?.sha || null)
                    store.set('pendingRemoteSha', null)
                    store.set('remoteFileShas', {
                        ...(store.get('remoteFileShas') || {}),
                        'tasks.md': remoteFile?.sha || null
                    })
                    const managedFileShas = await loadRemoteManagedFileShas({
                        token,
                        owner,
                        repo,
                        branch: getTasksBranch(activeRepo),
                        getFile,
                        writeRepoContextFile,
                        localPath: activeRepo.localPath,
                        localContextFiles
                    })
                    store.set('remoteFileShas', {
                        ...(store.get('remoteFileShas') || {}),
                        'tasks.md': remoteFile?.sha || null,
                        ...managedFileShas
                    })
                    setRepoDirty(
                        store,
                        activeRepo,
                        !remoteFile || remoteFile.content !== repoMarkdown
                    )
                } catch {
                    store.set('tasksSha', null)
                    store.set('pendingRemoteSha', null)
                    setRepoDirty(store, activeRepo, existingDirty)
                }

                return parse(repoMarkdown)
            }

            const localMarkdown = await readLocalTasksMarkdown(owner, repo)
            if (localMarkdown) {
                const existingDirty = getRepoDirty(store, activeRepo)
                let remoteFile = null
                try {
                    remoteFile = await getFile(token, owner, repo, 'tasks.md', {
                        ref: getTasksBranch(activeRepo)
                    })
                    store.set('tasksSha', remoteFile?.sha || null)
                    store.set('pendingRemoteSha', null)
                    store.set('remoteFileShas', {
                        ...(store.get('remoteFileShas') || {}),
                        'tasks.md': remoteFile?.sha || null
                    })
                    const managedFileShas = await loadRemoteManagedFileShas({
                        token,
                        owner,
                        repo,
                        branch: getTasksBranch(activeRepo),
                        getFile,
                        writeRepoContextFile,
                        localPath: activeRepo.localPath,
                        localContextFiles
                    })
                    store.set('remoteFileShas', {
                        ...(store.get('remoteFileShas') || {}),
                        'tasks.md': remoteFile?.sha || null,
                        ...managedFileShas
                    })
                    setRepoDirty(
                        store,
                        activeRepo,
                        !remoteFile || remoteFile.content !== localMarkdown
                    )
                } catch {
                    store.set('tasksSha', null)
                    store.set('pendingRemoteSha', null)
                    setRepoDirty(store, activeRepo, existingDirty)
                }

                return parse(localMarkdown)
            }

            const file = await getFile(token, owner, repo, 'tasks.md', {
                ref: getTasksBranch(activeRepo)
            })

            if (!file) {
                store.set('tasksSha', null)
                store.set('pendingRemoteSha', null)
                store.set('remoteFileShas', store.get('remoteFileShas') || {})
                setRepoDirty(store, activeRepo, false)
                return []
            }

            store.set('tasksSha', file.sha)
            store.set('pendingRemoteSha', null)
            const remoteFileShas = { ...(store.get('remoteFileShas') || {}), 'tasks.md': file.sha }
            Object.assign(
                remoteFileShas,
                await loadRemoteManagedFileShas({
                    token,
                    owner,
                    repo,
                    branch: getTasksBranch(activeRepo),
                    getFile,
                    writeRepoContextFile,
                    localPath: activeRepo.localPath,
                    localContextFiles
                })
            )
            store.set('remoteFileShas', remoteFileShas)
            syncLocalWatcherSnapshot(file.content)
            await writeLocalTasksMarkdown(owner, repo, file.content)
            await writeRepoTasksMarkdown(activeRepo.localPath, file.content)
            setRepoDirty(store, activeRepo, false)
            return parse(file.content)
        },

        'tasks:init': async (_, payload = {}) => {
            const token = requireAuth(store)
            const activeRepo = requireActiveRepo(store, payload.repo)
            const { owner, repo } = activeRepo

            store.set('activeRepo', activeRepo)
            store.set('pendingRemoteSha', null)
            await ensureRepoAiContextFiles(activeRepo.localPath, activeRepo)
            startPoller(mainWindow)

            const localMarkdown = await readLocalTasksMarkdown(owner, repo)
            if (localMarkdown && !payload.force) {
                return {
                    created: false,
                    sha: store.get('tasksSha'),
                    tasks: parse(localMarkdown)
                }
            }

            const markdown = createInitialTasksMarkdown()
            syncLocalWatcherSnapshot(markdown)
            await writeLocalTasksMarkdown(owner, repo, markdown)
            await writeRepoTasksMarkdown(activeRepo.localPath, markdown)
            setRepoDirty(store, activeRepo, true)
            return {
                created: true,
                sha: store.get('tasksSha'),
                tasks: parse(markdown)
            }
        },

        'tasks:cache': async (_, { tasks, dirty = true }) => {
            const activeRepo = requireActiveRepo(store)
            const { owner, repo } = activeRepo
            const markdown = stringify(tasks)

            syncLocalWatcherSnapshot(markdown)
            await writeLocalTasksMarkdown(owner, repo, markdown)
            await writeRepoTasksMarkdown(activeRepo.localPath, markdown)
            setRepoDirty(store, activeRepo, dirty)

            return { success: true }
        },

        'tasks:pull': async () => {
            const token = requireAuth(store)
            const activeRepo = requireActiveRepo(store)
            const { owner, repo } = activeRepo

            const file = await getFile(token, owner, repo, 'tasks.md', {
                ref: getTasksBranch(activeRepo)
            })
            const remoteFileShas = { ...(store.get('remoteFileShas') || {}), 'tasks.md': file?.sha || null }

            const remoteTasks = file ? parse(file.content) : []

            if (!file) {
                store.set('tasksSha', null)
                store.set('pendingRemoteSha', null)
                if (getRepoDirty(store, activeRepo)) {
                    return { mode: 'conflict', tasks: [], sha: null }
                }

                syncLocalWatcherSnapshot('# Tasks\n')
                await writeLocalTasksMarkdown(owner, repo, '# Tasks\n')
                await writeRepoTasksMarkdown(activeRepo.localPath, '# Tasks\n')
                setRepoDirty(store, activeRepo, false)
                return { mode: 'applied', tasks: [], sha: null }
            }

            store.set('tasksSha', file.sha)
            store.set('pendingRemoteSha', null)
            Object.assign(
                remoteFileShas,
                await loadRemoteManagedFileShas({
                    token,
                    owner,
                    repo,
                    branch: getTasksBranch(activeRepo),
                    getFile,
                    writeRepoContextFile,
                    localPath: activeRepo.localPath
                })
            )
            store.set('remoteFileShas', remoteFileShas)

            if (getRepoDirty(store, activeRepo)) {
                return { mode: 'conflict', tasks: remoteTasks, sha: file.sha }
            }

            syncLocalWatcherSnapshot(file.content)
            await writeLocalTasksMarkdown(owner, repo, file.content)
            await writeRepoTasksMarkdown(activeRepo.localPath, file.content)
            setRepoDirty(store, activeRepo, false)

            return { mode: 'applied', tasks: remoteTasks, sha: file.sha }
        },

        'tasks:save': async (_, { tasks, commitMessage }) => {
            const token = requireAuth(store)
            const activeRepo = requireActiveRepo(store)
            const { owner, repo } = activeRepo
            const repoKey = `${owner}/${repo}`
            const localMarkdown = stringify(tasks)

            await ensureBranch(token, owner, repo, getTasksBranch(activeRepo))

            syncLocalWatcherSnapshot(localMarkdown)
            await writeLocalTasksMarkdown(owner, repo, localMarkdown)
            await writeRepoTasksMarkdown(activeRepo.localPath, localMarkdown)
            setRepoDirty(store, activeRepo, true)

            return enqueueRepoSave(repoKey, async () => {
                const sha = store.get('tasksSha')
                const message = commitMessage || 'chore: update tasks'

                try {
                    const result = await updateFile(
                        token,
                        owner,
                        repo,
                        'tasks.md',
                        localMarkdown,
                        sha,
                        message,
                        { branch: getTasksBranch(activeRepo) }
                    )
                    store.set('tasksSha', result.sha)
                    store.set('pendingRemoteSha', null)
                    const syncedFileShas = await syncManagedFilesToRemote({
                        token,
                        owner,
                        repo,
                        branch: getTasksBranch(activeRepo),
                        getFile,
                        updateFile,
                        readRepoContextFile,
                        localPath: activeRepo.localPath,
                        remoteFileShas: {
                            ...(store.get('remoteFileShas') || {}),
                            'tasks.md': result.sha
                        }
                    })
                    store.set('remoteFileShas', {
                        ...syncedFileShas,
                        'tasks.md': result.sha
                    })
                    setRepoDirty(store, activeRepo, false)

                    return {
                        success: true,
                        sha: result.sha,
                        tasks
                    }
                } catch (error) {
                    if (!isShaConflict(error)) {
                        throw error
                    }

                    const latestFile = await getFile(token, owner, repo, 'tasks.md', {
                        ref: getTasksBranch(activeRepo)
                    })

                    if (latestFile) {
                        store.set('tasksSha', latestFile.sha)
                        store.set('pendingRemoteSha', latestFile.sha)
                        store.set('remoteFileShas', {
                            ...(store.get('remoteFileShas') || {}),
                            'tasks.md': latestFile.sha
                        })
                        const latestTasks = parse(latestFile.content)

                        if (latestFile.content === localMarkdown) {
                            syncLocalWatcherSnapshot(latestFile.content)
                            await writeLocalTasksMarkdown(owner, repo, latestFile.content)
                            await writeRepoTasksMarkdown(activeRepo.localPath, latestFile.content)
                            setRepoDirty(store, activeRepo, false)
                            return {
                                success: true,
                                sha: latestFile.sha,
                                tasks: latestTasks
                            }
                        }

                        return {
                            success: false,
                            mode: 'conflict',
                            sha: latestFile.sha,
                            tasks: latestTasks
                        }
                    }

                    store.set('tasksSha', null)
                    store.set('pendingRemoteSha', null)
                    return {
                        success: false,
                        mode: 'conflict',
                        sha: null,
                        tasks: []
                    }
                }
            })
        },

        'session:get': () => {
            const activeRepo = store.get('activeRepo')
            return {
                isAuthenticated: !!store.get('token'),
                activeRepo: normalizeActiveRepo(activeRepo),
                tasksDirty: activeRepo ? getRepoDirty(store, activeRepo) : false
            }
        },

        'session:clear': () => {
            store.set('token', null)
            store.set('activeRepo', null)
            store.set('tasksSha', null)
            store.set('pendingRemoteSha', null)
            store.set('remoteFileShas', {})
            store.set('dirtyRepos', {})
            stopPoller()

            return { success: true }
        }
    }
}
