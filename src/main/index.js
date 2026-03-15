import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { setDefaultResultOrder } from 'dns'
import { join } from 'path'
import { loadEnvFile } from './config/env'
import { registerIpcHandlers } from './ipc/handlers'
import { getStoredAppVersion, resetPersistedSessionState, setStoredAppVersion } from './store'
import { clearLocalTasksCache } from './tasks/cache'
import { stopPoller } from './watcher/poller'

const isDev = process.env.NODE_ENV === 'development'
let mainWindow = null

setDefaultResultOrder('ipv4first')
console.log('[net] DNS default result order set to ipv4first')

const envPath = loadEnvFile()

if (envPath) {
    console.log(`[env] Loaded environment from ${envPath}`)
} else {
    console.warn('[env] No .env file found in expected locations')
}

function createWindow() {
    const window = new BrowserWindow({
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

    window.on('ready-to-show', () => {
        window.show()
    })

    window.on('closed', () => {
        if (mainWindow === window) {
            mainWindow = null
        }
    })

    window.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    if (!isDev) {
        window.webContents.on('before-input-event', (event, input) => {
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
        window.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        window.loadFile(join(__dirname, '../renderer/index.html'))
    }

    return window
}

const hasSingleInstanceLock = app.requestSingleInstanceLock()

if (!hasSingleInstanceLock) {
    app.quit()
} else {
    app.on('second-instance', () => {
        if (!mainWindow) {
            return
        }

        if (mainWindow.isMinimized()) {
            mainWindow.restore()
        }

        if (!mainWindow.isVisible()) {
            mainWindow.show()
        }

        mainWindow.focus()
    })
}

app.whenReady().then(() => {
    app.setAppUserModelId('com.codesprint.app')

    const currentVersion = app.getVersion()
    const storedVersion = getStoredAppVersion()

    if (storedVersion && storedVersion !== currentVersion) {
        console.log(`[app] Version changed from ${storedVersion} to ${currentVersion}. Clearing persisted session and cache.`)
        resetPersistedSessionState()
        clearLocalTasksCache().catch((error) => {
            console.error('[app] Failed to clear local tasks cache after update:', error.message)
        })
    }

    if (storedVersion !== currentVersion) {
        setStoredAppVersion(currentVersion)
    }

    mainWindow = createWindow()
    registerIpcHandlers(ipcMain, mainWindow)

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) {
            mainWindow = createWindow()
        }
    })
})

app.on('before-quit', () => {
    stopPoller()
})

app.on('window-all-closed', () => {
    stopPoller()
    if (process.platform !== 'darwin') {
        app.exit(0)
    }
})
