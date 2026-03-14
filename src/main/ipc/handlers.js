import { startDeviceFlow, pollForToken } from '../github/auth'
import { getRepos, getFile, updateFile } from '../github/client'
import { parse, stringify } from '../parser/index'
import { startPoller } from '../watcher/poller'
import store from '../store'

const CLIENT_ID = process.env.GITHUB_CLIENT_ID

/**
 * Registra todos os handlers IPC do processo principal.
 * @param {Electron.IpcMain} ipcMain
 * @param {BrowserWindow} mainWindow
 */
export function registerIpcHandlers(ipcMain, mainWindow) {

    /**
     * Inicia GitHub Device Flow.
     * Retorna { user_code, verification_uri } para o renderer exibir ao usuário.
     * Resolve com o token quando o usuário autorizar.
     */
    ipcMain.handle('github:login', async () => {
        const deviceData = await startDeviceFlow(CLIENT_ID)

        // Inicia polling em background (não bloqueia o renderer)
        pollForToken(CLIENT_ID, deviceData.device_code, deviceData.interval)
            .then((token) => {
                store.set('token', token)
                mainWindow.webContents.send('github:auth-success')
                startPoller(mainWindow)
            })
            .catch((err) => {
                mainWindow.webContents.send('github:auth-error', err.message)
            })

        // Retorna imediatamente com os dados para o usuário ver o código
        return {
            userCode: deviceData.user_code,
            verificationUri: deviceData.verification_uri,
            expiresIn: deviceData.expires_in
        }
    })

    /**
     * Retorna lista de repositórios do usuário autenticado.
     */
    ipcMain.handle('github:repos', async () => {
        const token = store.get('token')
        if (!token) throw new Error('Not authenticated')
        return getRepos(token)
    })

    /**
     * Lê o tasks.md do repo selecionado e retorna as tasks parseadas.
     * Se não existir, retorna array vazio.
     */
    ipcMain.handle('tasks:load', async (_, { owner, repo }) => {
        const token = store.get('token')
        if (!token) throw new Error('Not authenticated')

        store.set('activeRepo', { owner, repo })

        const file = await getFile(token, owner, repo, 'tasks.md')

        if (!file) {
            store.set('tasksSha', null)
            return []
        }

        store.set('tasksSha', file.sha)
        startPoller(mainWindow)

        return parse(file.content)
    })

    /**
     * Recebe tasks atualizadas, converte para markdown e commita no GitHub.
     */
    ipcMain.handle('tasks:save', async (_, { tasks, commitMessage }) => {
        const token = store.get('token')
        const activeRepo = store.get('activeRepo')
        if (!token) throw new Error('Not authenticated')
        if (!activeRepo) throw new Error('No active repo selected')

        const { owner, repo } = activeRepo
        const sha = store.get('tasksSha')
        const markdown = stringify(tasks)
        const message = commitMessage || 'chore: update tasks'

        const result = await updateFile(token, owner, repo, 'tasks.md', markdown, sha, message)
        store.set('tasksSha', result.sha)

        return { success: true, sha: result.sha }
    })

    /**
     * Retorna estado atual da sessão (autenticado? repo ativo?).
     */
    ipcMain.handle('session:get', () => {
        return {
            isAuthenticated: !!store.get('token'),
            activeRepo: store.get('activeRepo')
        }
    })
}
