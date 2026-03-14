import { contextBridge, ipcRenderer } from 'electron'

/**
 * Expõe uma API segura para o renderer via window.electron.
 * O renderer nunca acessa o ipcRenderer diretamente.
 */
contextBridge.exposeInMainWorld('electron', {
    /**
     * Chama um handler IPC no processo principal e aguarda a resposta.
     * @param {string} channel
     * @param {...any} args
     * @returns {Promise<any>}
     */
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),

    /**
     * Escuta eventos enviados pelo processo principal.
     * @param {string} channel
     * @param {Function} callback
     * @returns {Function} unsubscribe — chame para remover o listener
     */
    on: (channel, callback) => {
        const handler = (_event, ...args) => callback(...args)
        ipcRenderer.on(channel, handler)
        return () => ipcRenderer.removeListener(channel, handler)
    }
})
