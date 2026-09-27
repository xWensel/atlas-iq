/*
 * Geolite - envoltorio Electron. Sirve la carpeta del juego por un servidor
 * HTTP local (no file://) para que Service Worker, fetch relativo y rutas
 * funcionen exactamente igual que en el navegador.
 */
const { app, BrowserWindow } = require("electron");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

/* Algunos equipos no pintan bien WebP/canvas con aceleracion por GPU en
 * Electron (el texto e iconos SVG salen, las imagenes generadas no). Probado
 * y descartado: app.disableHardwareAcceleration() "arregla" las imagenes pero
 * deja el juego a ~2 FPS (software rendering completo) - inaceptable para un
 * juego. En su lugar, solo se quita el sandbox del proceso de GPU (mucho mas
 * barato) para ver si el problema era el sandbox y no la GPU en si. */
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
    webPreferences: { contextIsolation: true, nodeIntegration: false },
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
