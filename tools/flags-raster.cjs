/*
 * Geolite - banderas rasterizadas para la Enciclopedia: assets/flags/r/<pais>.webp (168 px de alto, ~8 KB) a partir de los SVG de assets/flags.
 * Los SVG grandes (escudos con miles de trazos) se rasterizan en el hilo principal cada vez que se pintan: una pagina de continente con
 * 40 banderas daba un tiron. Con estas, el navegador las decodifica fuera del hilo principal.
 *   npx electron tools/flags-raster.cjs        (rehacer cuando cambie data/flags.js o un SVG)
 */
const { app, BrowserWindow } = require("electron");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.join(__dirname, ".."), SRC = path.join(ROOT, "assets", "flags"), OUT = path.join(SRC, "r");
app.commandLine.appendSwitch("force-device-scale-factor", "1");
app.whenReady().then(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const files = fs.readdirSync(SRC).filter(f => f.endsWith(".svg"));
  const win = new BrowserWindow({ show: false, webPreferences: { offscreen: true } });
  await win.loadURL("about:blank");
  let n = 0;
  for (const f of files) {
    const svg = fs.readFileSync(path.join(SRC, f), "utf8");
    const url = "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
    const b64 = await win.webContents.executeJavaScript(`(async () => {
      const im = new Image(); im.src = ${JSON.stringify(url)}; await im.decode();
      const r = (im.naturalWidth || 3) / (im.naturalHeight || 2), H = 168, W = Math.max(84, Math.min(420, Math.round(H * r)));
      const c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
      x.imageSmoothingQuality = "high"; x.drawImage(im, 0, 0, W, H);
      return c.toDataURL("image/webp", 0.9).split(",")[1];
    })()`);
    fs.writeFileSync(path.join(OUT, f.replace(/\.svg$/, ".webp")), Buffer.from(b64, "base64")); n++;
  }
  console.log(`${n} banderas en ${OUT}`);
  app.exit(0);
});
