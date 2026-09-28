/*
 * Geolite - envoltorio Electron. Sirve la carpeta del juego por un servidor
 * HTTP local (no file://) para que Service Worker, fetch relativo y rutas
 * funcionen exactamente igual que en el navegador.
 */
const { app, BrowserWindow, ipcMain, screen } = require("electron");
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

/* Modo de ventana: "window" (con bordes, tamano normal), "border" (sin
 * bordes, ocupa todo el monitor sin salir del modo ventana - alt-tab
 * instantaneo) y "full" (pantalla completa exclusiva del SO). El frame
 * nativo no se puede cambiar en caliente, asi que pasar de/hacia "border"
 * recrea la ventana; alternar entre "window" y "full" solo llama a
 * setFullScreen porque ambas usan frame. El modo elegido se recuerda entre
 * sesiones en un fichero junto al perfil de la app. */
const MODE_FILE = path.join(app.getPath("userData"), "winmode.json");
function loadMode() { try { const m = JSON.parse(fs.readFileSync(MODE_FILE, "utf8")).mode; return ["window", "border", "full"].includes(m) ? m : "full"; } catch (e) { return "full"; } }
function saveMode(m) { try { fs.writeFileSync(MODE_FILE, JSON.stringify({ mode: m })); } catch (e) { /* sin permisos de escritura: se pierde al reiniciar */ } }
let currentMode = loadMode();
let win = null;
const hasFrame = m => m !== "border";

function wireWindow(w) {
  w.webContents.on("did-finish-load", () => {
    console.log("Ventana cargada OK");
    w.webContents.executeJavaScript("innerWidth + 'x' + innerHeight").then(s => console.log("Tamano de contenido:", s));
  });
  w.webContents.on("did-fail-load", (e, code, desc) => console.error("Fallo al cargar:", code, desc));
  w.webContents.on("console-message", (e, level, message, line, sourceId) => console.log("[renderer]", level, message, sourceId + ":" + line));
  w.webContents.on("render-process-gone", (e, details) => console.error("Renderer crash:", details));
  const notify = () => w.webContents.send("win:mode-changed", currentMode);
  w.on("enter-full-screen", notify); w.on("leave-full-screen", notify);
}

function buildWindow(mode, url) {
  const frame = hasFrame(mode);
  const opts = {
    minWidth: 960, minHeight: 600, useContentSize: true, autoHideMenuBar: true,
    backgroundColor: "#0b2a44", frame, show: false, icon: path.join(ROOT, "assets", "desktop", "icon.ico"),
    webPreferences: { contextIsolation: true, nodeIntegration: false, preload: path.join(ROOT, "preload.js") },
  };
  if (mode === "border") {
    const b = screen.getPrimaryDisplay().bounds; Object.assign(opts, b, { resizable: true, fullscreen: false });
  } else {
    opts.width = 1280; opts.height = 800; opts.fullscreen = mode === "full";
  }
  const w = new BrowserWindow(opts);
  if (mode !== "border") w.center();
  w.once("ready-to-show", () => w.show());
  wireWindow(w);
  w.loadURL(url);
  return w;
}

function setWindowMode(mode) {
  if (!["window", "border", "full"].includes(mode) || !win) return;
  if (mode === currentMode) return;
  const url = win.webContents.getURL();
  if (hasFrame(mode) === hasFrame(currentMode)) {
    currentMode = mode; saveMode(mode);
    if (mode === "full") win.setFullScreen(true);
    else { win.setFullScreen(false); win.setSize(1280, 800); win.center(); }
    win.webContents.send("win:mode-changed", currentMode);
    return;
  }
  currentMode = mode; saveMode(mode);
  const old = win;
  win = buildWindow(mode, url);
  old.close();
}
ipcMain.on("win:getMode", (e) => { e.returnValue = currentMode; });
ipcMain.on("win:setMode", (e, mode) => setWindowMode(mode));

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
const PORT = 47815;
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon", ".woff2": "font/woff2", ".mp3": "audio/mpeg", ".wasm": "application/wasm", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml" };

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split("?")[0]);
      let filePath = path.join(ROOT, urlPath === "/" ? "index.html" : urlPath);
      if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end("Not found"); return; }
        res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream", "Cache-Control": "no-cache" });   // siempre la ultima version de los archivos
        res.end(data);
      });
    });
    /* puerto FIJO: el guardado (localStorage) va por origen y el puerto forma parte de el; con un puerto
       aleatorio cada arranque empezaria sin partidas, perfil ni Enciclopedia. Solo si esta ocupado se prueba el siguiente */
    let port = PORT;
    server.on("error", err => { if (err.code === "EADDRINUSE" && port < PORT + 20) server.listen(++port, "127.0.0.1"); else throw err; });
    server.on("listening", () => resolve(server.address().port));
    server.listen(port, "127.0.0.1");
  });
}

async function createWindow() {
  const port = await startServer();
  console.log("Servidor local en el puerto", port);
  win = buildWindow(currentMode, `http://127.0.0.1:${port}/index.html`);
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
