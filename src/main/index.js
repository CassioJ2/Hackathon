import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { setDefaultResultOrder } from 'dns'
import { join } from 'path'
import { loadEnvFile } from './config/env'
import { registerIpcHandlers } from './ipc/handlers'
import { stopPoller } from './watcher/poller'

const isDev = process.env.NODE_ENV === 'development'

setDefaultResultOrder('ipv4first')
console.log('[net] DNS default result order set to ipv4first')

const envPath = loadEnvFile()

if (envPath) {
    console.log(`[env] Loaded environment from ${envPath}`)
} else {
    console.warn('[env] No .env file found in expected locations')
}

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        show: false,
        icon: join(__dirname, '../../build/icon.png'),
        autoHideMenuBar: true,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false,
            contextIsolation: true,
            devTools: isDev
        }
    })

    mainWindow.on('ready-to-show', () => {
        mainWindow.show()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    if (!isDev) {
        mainWindow.webContents.on('before-input-event', (event, input) => {
            const isReload = (input.control || input.meta) && input.key.toLowerCase() === 'r'
            const isDevShortcut =
                input.key === 'F12' ||
                ((input.control || input.meta) && input.shift && input.key.toLowerCase() === 'i')

            if (isReload || isDevShortcut) {
                event.preventDefault()
            }
        })
    }

    if (isDev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }

    return mainWindow
}

app.whenReady().then(() => {
    app.setAppUserModelId('com.codesprnt.app')

    const mainWindow = createWindow()
    registerIpcHandlers(ipcMain, mainWindow)

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    stopPoller()
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
