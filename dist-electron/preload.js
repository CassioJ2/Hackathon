let electron = require("electron");
//#region electron/preload.ts
var electronAPI = {
	platform: process.platform,
	readFile: (filePath) => electron.ipcRenderer.invoke("fs:readFile", filePath),
	saveFile: (filePath, content) => electron.ipcRenderer.invoke("fs:saveFile", filePath, content),
	onUpdateAvailable: (cb) => {
		electron.ipcRenderer.on("update:available", (_event, version) => cb(version));
		return () => electron.ipcRenderer.removeAllListeners("update:available");
	}
};
electron.contextBridge.exposeInMainWorld("electron", electronAPI);
//#endregion
