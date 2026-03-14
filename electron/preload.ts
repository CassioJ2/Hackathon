import { contextBridge, ipcRenderer } from "electron";

export type ElectronAPI = typeof electronAPI;

const electronAPI = {
  // informações do sistema
  platform: process.platform,

  // renderer → main (aguarda resposta)
  readFile: (filePath: string) => ipcRenderer.invoke("fs:readFile", filePath),

  saveFile: (filePath: string, content: string) =>
    ipcRenderer.invoke("fs:saveFile", filePath, content),

  // main → renderer (eventos push)
  onUpdateAvailable: (cb: (version: string) => void) => {
    ipcRenderer.on("update:available", (_event, version) => cb(version));
    return () => ipcRenderer.removeAllListeners("update:available");
  },
};

contextBridge.exposeInMainWorld("electron", electronAPI);
