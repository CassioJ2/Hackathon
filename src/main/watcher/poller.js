import { getFileSha, getFile } from '../github/client'
import { parse } from '../parser/index'
import store from '../store'

const POLL_INTERVAL_MS = 30_000
let pollerTimer = null

/**
 * Inicia o polling do tasks.md no repo ativo.
 * Se o SHA mudar, dispara o evento tasks:external-update para o renderer.
 * @param {BrowserWindow} mainWindow
 */
export function startPoller(mainWindow) {
    stopPoller()

    pollerTimer = setInterval(async () => {
        try {
            const token = store.get('token')
            const activeRepo = store.get('activeRepo')

            if (!token || !activeRepo) {
                return
            }

            const { owner, repo } = activeRepo
            const currentSha = await getFileSha(token, owner, repo, 'tasks.md')
            const cachedSha = store.get('tasksSha')

            if (currentSha === cachedSha) {
                return
            }

            if (!currentSha) {
                console.log('[poller] tasks.md was removed externally')
                store.set('tasksSha', null)
                mainWindow.webContents.send('tasks:external-update', [])
                return
            }

            console.log('[poller] External change detected, fetching new tasks...')

            const file = await getFile(token, owner, repo, 'tasks.md')
            if (!file) {
                store.set('tasksSha', null)
                mainWindow.webContents.send('tasks:external-update', [])
                return
            }

            const tasks = parse(file.content)
            store.set('tasksSha', currentSha)
            mainWindow.webContents.send('tasks:external-update', tasks)
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
}
