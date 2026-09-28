/*
 * Geolite - preload de Electron. Expone `window.geoliteHost` a la pagina sin
 * activar nodeIntegration (contextIsolation se queda en true por seguridad;
 * steamworks.js solo se usa en el proceso principal, aqui solo se reenvia
 * por IPC).
 */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("geoliteHost", {
  steamAvailable: () => ipcRenderer.invoke("steam:available"),
  steamUnlock: (id) => ipcRenderer.invoke("steam:unlock", id),
  /* sincrono a proposito: el renderer lo usa para pintar el selector de
   * pantalla al instante, igual que document.fullscreenElement. */
  windowMode: () => ipcRenderer.sendSync("win:getMode"),
  setWindowMode: (mode) => ipcRenderer.send("win:setMode", mode),
  onWindowModeChange: (cb) => ipcRenderer.on("win:mode-changed", (e, mode) => cb(mode)),
});
