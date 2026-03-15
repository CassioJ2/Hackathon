import { watch } from 'node:fs'
import { getFileSha, getFile } from '../github/client'
import { parse } from '../parser/index'
import store from '../store'
import { readRepoTasksMarkdown, writeRepoTasksMarkdown } from '../tasks/local-repo'

const POLL_INTERVAL_MS = 30_000
let pollerTimer = null
let localWatcher = null
let localWatcherDebounce = null
let lastObservedLocalMarkdown = null
const REMOTE_REMOVED_SENTINEL = '__REMOTE_TASKS_REMOVED__'

function repoKey({ owner, repo }) {
    return `${owner}/${repo}`
}

function getTasksBranch(activeRepo) {
    return activeRepo?.tasksBranch || 'tasks'
}

export function syncLocalWatcherSnapshot(markdown) {
    lastObservedLocalMarkdown = markdown ?? null
}

async function handleLocalFileChange(mainWindow) {
    try {
        const activeRepo = store.get('activeRepo')

        if (!activeRepo?.localPath) {
            syncLocalWatcherSnapshot(null)
            return
        }

        const { owner, repo } = activeRepo
        const markdown = await readRepoTasksMarkdown(activeRepo.localPath)

        if ((markdown ?? null) === lastObservedLocalMarkdown) {
            return
        }

        lastObservedLocalMarkdown = markdown ?? null

        const dirtyRepos = store.get('dirtyRepos') || {}
        const hasLocalChanges = !!dirtyRepos[repoKey(activeRepo)]
        const tasks = markdown ? parse(markdown) : []

        if (hasLocalChanges) {
            mainWindow.webContents.send('tasks:local-file-conflict', tasks)
            return
        }

        await writeLocalTasksMarkdown(owner, repo, markdown || '# Tasks\n')
        mainWindow.webContents.send('tasks:local-file-update', tasks)
    } catch (err) {
        console.error('[poller] Local file watcher error:', err.message)
    }
}

function startLocalWatcher(mainWindow) {
    const activeRepo = store.get('activeRepo')

    if (!activeRepo?.localPath) {
        syncLocalWatcherSnapshot(null)
        return
    }

    try {
        localWatcher = watch(activeRepo.localPath, (_eventType, filename) => {
            if (filename && filename !== 'tasks.md') {
                return
            }

            clearTimeout(localWatcherDebounce)
            localWatcherDebounce = setTimeout(() => {
                handleLocalFileChange(mainWindow)
            }, 150)
        })
    } catch (err) {
        console.error('[poller] Failed to watch local repo:', err.message)
    }
}

/**
 * Inicia o polling do tasks.md no repo ativo.
 * Se o SHA mudar, dispara o evento tasks:external-update para o renderer.
 * @param {BrowserWindow} mainWindow
 */
export function startPoller(mainWindow) {
    stopPoller()
    startLocalWatcher(mainWindow)

    pollerTimer = setInterval(async () => {
        try {
            const token = store.get('token')
            const activeRepo = store.get('activeRepo')

            if (!token || !activeRepo) {
                return
            }

            const { owner, repo } = activeRepo
            const currentSha = await getFileSha(token, owner, repo, 'tasks.md', {
                ref: getTasksBranch(activeRepo)
            })
            const cachedSha = store.get('tasksSha')
            const pendingRemoteSha = store.get('pendingRemoteSha')

            if (currentSha === cachedSha) {
                if (pendingRemoteSha) {
                    store.set('pendingRemoteSha', null)
                }
                return
            }

            if (!currentSha) {
                if (pendingRemoteSha === REMOTE_REMOVED_SENTINEL) {
                    return
                }

                console.log('[poller] tasks.md was removed externally and is pending pull')
                store.set('pendingRemoteSha', REMOTE_REMOVED_SENTINEL)
                mainWindow.webContents.send('tasks:cloud-pending', {
                    sha: null,
                    tasks: [],
                    removed: true
                })
                return
            }

            if (currentSha === pendingRemoteSha) {
                return
            }

            console.log('[poller] External change detected, pending remote pull...')

            const file = await getFile(token, owner, repo, 'tasks.md', {
                ref: getTasksBranch(activeRepo)
            })
            if (!file) {
                if (pendingRemoteSha === REMOTE_REMOVED_SENTINEL) {
                    return
                }

                store.set('pendingRemoteSha', REMOTE_REMOVED_SENTINEL)
                mainWindow.webContents.send('tasks:cloud-pending', {
                    sha: null,
                    tasks: [],
                    removed: true
                })
                return
            }

            const tasks = parse(file.content)
            store.set('pendingRemoteSha', currentSha)
            mainWindow.webContents.send('tasks:cloud-pending', {
                sha: currentSha,
                tasks,
                removed: false
            })
        } catch (err) {
            console.error('[poller] Error:', err.message)
        }
    }, POLL_INTERVAL_MS)

    console.log(`[poller] Started (interval: ${POLL_INTERVAL_MS / 1000}s)`)
}

export function stopPoller() {
    if (pollerTimer) {
        clearInterval(pollerTimer)
        pollerTimer = null
        console.log('[poller] Stopped')
    }

    if (localWatcher) {
        localWatcher.close()
        localWatcher = null
    }

    if (localWatcherDebounce) {
        clearTimeout(localWatcherDebounce)
        localWatcherDebounce = null
    }
}
