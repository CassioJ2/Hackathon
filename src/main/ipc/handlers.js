import { startDeviceFlow, pollForToken } from '../github/auth'
import { getRepos, getFile, updateFile } from '../github/client'
import { parse, stringify } from '../parser/index'
import store from '../store'
import { createInitialTasksMarkdown } from '../tasks/template'
import { startPoller, stopPoller } from '../watcher/poller'
import { createIpcHandlers } from './contracts'

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
        getFile,
        updateFile,
        parse,
        stringify,
        startPoller,
        stopPoller,
        createInitialTasksMarkdown
    })

    for (const [channel, handler] of Object.entries(handlers)) {
        ipcMain.handle(channel, handler)
    }
}
