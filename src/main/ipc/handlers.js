import { dialog, shell } from 'electron'
import { startDeviceFlow, pollForToken } from '../github/auth'
import { getRepos, getFile, updateFile, getRepoCollaborators } from '../github/client'
import { parse, stringify } from '../parser/index'
import store from '../store'
import { createInitialTasksMarkdown } from '../tasks/template'
import { readLocalTasksMarkdown, writeLocalTasksMarkdown } from '../tasks/cache'
import { getTasksPath, readRepoTasksMarkdown, writeRepoTasksMarkdown, validateLocalRepoPath } from '../tasks/local-repo'
import { startPoller, stopPoller } from '../watcher/poller'
import { createIpcHandlers } from './contracts'
import { IPC_CONTRACT } from './spec'

/**
 * Registra todos os handlers IPC do processo principal.
 * @param {Electron.IpcMain} ipcMain
 * @param {BrowserWindow} mainWindow
 */
export function registerIpcHandlers(ipcMain, mainWindow) {
    const handlers = createIpcHandlers({
        env: process.env,
        mainWindow,
        store,
        startDeviceFlow,
        pollForToken,
        getRepos,
        getRepoCollaborators,
        getFile,
        updateFile,
        parse,
        stringify,
        readLocalTasksMarkdown,
        writeLocalTasksMarkdown,
        readRepoTasksMarkdown,
        writeRepoTasksMarkdown,
        validateLocalRepoPath,
        openTasksFile: async (activeRepo) => {
            if (!activeRepo?.localPath) {
                throw new Error('No local repo linked. Link a local folder before opening tasks.md.')
            }

            const openResult = await shell.openPath(getTasksPath(activeRepo.localPath))

            if (openResult) {
                throw new Error(openResult)
            }

            return { success: true }
        },
        pickLocalRepoPath: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
                properties: ['openDirectory']
            })

            if (result.canceled || !result.filePaths?.length) {
                return null
            }

            return result.filePaths[0]
        },
        startPoller,
        stopPoller,
        createInitialTasksMarkdown
    })

    ipcMain.handle('ipc:contract', () => IPC_CONTRACT)

    for (const [channel, handler] of Object.entries(handlers)) {
        ipcMain.handle(channel, handler)
    }
}
