/*
 * Geolite - envoltorio Electron. Sirve la carpeta del juego por un servidor
 * HTTP local (no file://) para que Service Worker, fetch relativo y rutas
 * funcionen exactamente igual que en el navegador.
 */
const { app, BrowserWindow, ipcMain } = require("electron");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

/* Steamworks: steam_appid.txt trae 480 (Spacewar, el App ID publico de
 * pruebas de Valve) para poder desarrollar sin tener aun un App ID propio;
 * hay que cambiarlo por el real antes de publicar. Si Steam no esta abierto
 * (o no hay steam_api64.dll junto al ejecutable en un build empaquetado),
 * el init falla y el juego sigue funcionando normal, solo sin logros. */
let steamClient = null;
try {
  steamClient = require("steamworks.js").init();
  require("steamworks.js").electronEnableSteamOverlay();
  console.log("Steamworks conectado:", steamClient.localplayer.getName());
} catch (e) {
  console.warn("Steamworks no disponible (¿Steam esta abierto?):", e.message);
}
ipcMain.handle("steam:available", () => !!steamClient);
ipcMain.handle("steam:unlock", (e, id) => {
  if (!steamClient || typeof id !== "string") return false;
  try { return steamClient.achievement.activate(id); } catch (err) { console.warn("steam:unlock", id, err.message); return false; }
});

/* Las imagenes generadas (WebP) no pintan aunque devtools confirme que estan
 * cargadas (complete=true, naturalWidth=1024, opacity="1") - falla el pintado
 * final, no la carga. Investigado a fondo: NO es la GPU (chrome://gpu: RTX
 * 3080 bien acelerada; probados y descartados disableHardwareAcceleration(),
 * disable-gpu-compositing, disable-features=CanvasOopRasterization y
 * disable-gpu-rasterization - ninguno arreglo las imagenes y algunos dejaban
 * el juego renqueante). El patron real: los iconos pequenos (src fijo desde
 * el HTML) SI pintan; las ilustraciones grandes (src asignado por JS despues
 * de cargar, ver js/art.js) NO. Eso apunta a un bug de repintado tras
 * asignacion asincrona de src, no a la GPU - se arregla en JS (ver
 * js/art.js), asi que aqui solo se deja disable-gpu-sandbox (framerate
 * normal, confirmado). */
app.commandLine.appendSwitch("disable-gpu-sandbox");

const ROOT = __dirname;
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon", ".woff2": "font/woff2", ".mp3": "audio/mpeg", ".wasm": "application/wasm", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml" };

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split("?")[0]);
      let filePath = path.join(ROOT, urlPath === "/" ? "index.html" : urlPath);
      if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end("Not found"); return; }
        res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
        res.end(data);
      });
    });
    server.listen(0, "127.0.0.1", () => resolve(server.address().port));
  });
}

async function createWindow() {
  const port = await startServer();
  console.log("Servidor local en el puerto", port);
  const win = new BrowserWindow({
    width: 1280, height: 800, minWidth: 960, minHeight: 600, useContentSize: true,
    autoHideMenuBar: true, backgroundColor: "#0b2a44", fullscreen: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, preload: path.join(ROOT, "preload.js") },
  });
  win.webContents.on("did-finish-load", () => {
    console.log("Ventana cargada OK");
    win.webContents.executeJavaScript("innerWidth + 'x' + innerHeight").then(s => console.log("Tamano de contenido:", s));
  });
  win.webContents.on("did-fail-load", (e, code, desc) => console.error("Fallo al cargar:", code, desc));
  win.webContents.on("console-message", (e, level, message, line, sourceId) => console.log("[renderer]", level, message, sourceId + ":" + line));
  win.webContents.on("render-process-gone", (e, details) => console.error("Renderer crash:", details));
  win.loadURL(`http://127.0.0.1:${port}/index.html`);
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
