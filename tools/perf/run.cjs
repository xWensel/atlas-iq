/*
 * Geolite - medidor de fluidez (v0.17.1). Abre el juego en un Electron sin ventana (offscreen, sin frenar temporizadores), recorre los pasos de
 * un escenario y cuenta, en cada uno, los fotogramas perdidos del requestAnimationFrame (el mapa de fondo los delata), los LoAF (fotogramas
 * largos con el script culpable) y, si se pide, las funciones que mas CPU gastan. No se publica: tools/ no va ni a la web ni a Steam.
 *
 *   node_modules/electron/dist/electron.exe tools/perf/run.cjs tools/perf/menus.json [--root <carpeta>] [--throttle 4] [--prof] [--out res.json]
 *
 *   --root      carpeta del juego a servir (por defecto, este repo). Para comparar: un `git worktree` de origin/main y la carpeta de trabajo.
 *   --throttle  CPU N veces mas lenta (4 ~ un portatil modesto). --prof: perfil de CPU por paso. --out: resultados en JSON.
 * Escenario: { w, h, settle, steps: [{ name, pre?, preWait?, js, ms, moves?: [[x,y]...], wheel?: {x,y,dy,n} }] } (js: cuerpo de una funcion async).
 * Cada ejecucion usa un perfil de Electron nuevo: asi se ven tambien los costes de la primera vez (compilar shaders, cargar fuentes).
 */
const { app, BrowserWindow } = require("electron");
const http = require("node:http"), fs = require("node:fs"), path = require("node:path"), os = require("node:os");
const argv = process.argv.slice(2), opt = k => { const i = argv.indexOf(k); return i < 0 ? null : argv[i + 1]; };
const cfgPath = argv.find(a => a.endsWith(".json") && argv[argv.indexOf(a) - 1] !== "--out");
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
const ROOT = path.resolve(opt("--root") || cfg.root || path.join(__dirname, "..", ".."));
const THROTTLE = +(opt("--throttle") || cfg.throttle || 1), PROF = argv.includes("--prof"), OUT = opt("--out");
app.setPath("userData", fs.mkdtempSync(path.join(os.tmpdir(), "geolite-perf-")));
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".ico": "image/x-icon", ".webmanifest": "application/manifest+json" };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html";
  fs.readFile(path.join(ROOT, p), (err, buf) => {
    if (err) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "Content-Type": MIME[path.extname(p).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-cache" }); res.end(buf);
  });
});
const wait = ms => new Promise(r => setTimeout(r, ms));

/* grabadora dentro de la pagina: intervalos entre fotogramas y fotogramas largos (LoAF) */
const REC = `(() => {
  const R = window.__perf = { on: false, f: [], lo: [] };
  R.start = () => { R.f = []; R.lo = []; R.on = true; const id = R.id = (R.id || 0) + 1; let last = 0; const tick = t => { if (!R.on || R.id !== id) return; if (last) R.f.push(t - last); last = t; requestAnimationFrame(tick); }; requestAnimationFrame(tick); };   // id: el bucle del paso anterior no se cuela en este
  try { new PerformanceObserver(l => { if (R.on) for (const e of l.getEntries()) R.lo.push({ d: Math.round(e.duration), s: [...(e.scripts || [])].sort((a, b) => b.duration - a.duration).slice(0, 2).map(s => Math.round(s.duration) + "ms " + (s.sourceFunctionName || s.invokerType) + "@" + (s.sourceURL || "").split("/").pop()).join(" | ") }); }).observe({ type: "long-animation-frame" }); } catch (e) { /* sin LoAF */ }
  R.stop = () => { R.on = false; const f = R.f.slice(1); return { n: f.length, dropped: f.reduce((a, x) => a + Math.max(0, Math.round(x / 16.67) - 1), 0), max: Math.round(Math.max(0, ...f)), worst: f.map(Math.round).sort((a, b) => b - a).slice(0, 5), loaf: R.lo.sort((a, b) => b.d - a.d).slice(0, 4) }; };
})(); 1`;

function topSelf(p, n = 10) {
  const dt = {}, self = new Map();
  for (let i = 0; i < p.samples.length; i++) dt[p.samples[i]] = (dt[p.samples[i]] || 0) + (p.timeDeltas[i + 1] || 0);
  for (const nd of p.nodes) { const cf = nd.callFrame, k = `${cf.functionName || "(anon)"} ${cf.url.split("/").pop()}:${cf.lineNumber + 1}`; self.set(k, (self.get(k) || 0) + (dt[nd.id] || 0) / 1000); }
  return [...self].filter(([k]) => !/^\((idle|program)\)/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${v.toFixed(1).padStart(7)} ms  ${k}`);
}

app.whenReady().then(async () => {
  await new Promise(r => srv.listen(0, "127.0.0.1", r));
  const win = new BrowserWindow({ width: cfg.w || 1920, height: cfg.h || 1080, show: false, useContentSize: true, webPreferences: { offscreen: true, backgroundThrottling: false } });
  win.webContents.setFrameRate(60);
  win.webContents.on("console-message", e => { if (e.level === "error") console.log("[pagina]", e.message); });
  await win.loadURL(`http://127.0.0.1:${srv.address().port}/index.html${cfg.query || "?skipboot"}`);
  await win.webContents.executeJavaScript(`new Promise(r => { const t = () => (window.AIQ && AIQ.core && document.querySelector("#dlg .hh") ? r(1) : setTimeout(t, 100)); t(); })`);
  await wait(cfg.settle || 2500);
  await win.webContents.executeJavaScript(REC);
  const dbg = win.webContents.debugger; dbg.attach("1.3");
  if (THROTTLE > 1) await dbg.sendCommand("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
  if (PROF) { await dbg.sendCommand("Profiler.enable"); await dbg.sendCommand("Profiler.setSamplingInterval", { interval: 200 }); }
  console.log(`Geolite ${ROOT}  ${cfg.w || 1920}x${cfg.h || 1080}  CPU x${THROTTLE}\n${"paso".padEnd(30)}perdidos  max`);
  const out = [];
  for (const st of cfg.steps) {
    if (st.pre) { await win.webContents.executeJavaScript(`(async () => { ${st.pre} })()`); await wait(st.preWait || 800); }
    if (PROF) await dbg.sendCommand("Profiler.start");
    await win.webContents.executeJavaScript("__perf.start()");
    const t0 = Date.now(); let ret = null;
    try { ret = await win.webContents.executeJavaScript(`(async () => { ${st.js || ""} })()`); } catch (e) { ret = "ERROR " + e.message; }
    for (const [x, y] of st.moves || []) { win.webContents.sendInputEvent({ type: "mouseMove", x, y }); await wait(16); }
    if (st.wheel) for (let i = 0; i < st.wheel.n; i++) { win.webContents.sendInputEvent({ type: "mouseWheel", x: st.wheel.x, y: st.wheel.y, deltaX: 0, deltaY: st.wheel.dy }); await wait(33); }
    await wait(Math.max(0, (st.ms || 2000) - (Date.now() - t0)));
    const s = await win.webContents.executeJavaScript("__perf.stop()");
    console.log(`${st.name.padEnd(30)}${String(s.dropped).padStart(8)}  ${s.max} ms${typeof ret === "string" && ret.startsWith("ERROR") ? "  " + ret : ""}`);
    s.loaf.filter(l => l.d > 50 && l.s).forEach(l => console.log(`    LoAF ${l.d} ms  ${l.s}`));
    if (PROF) { const { profile } = await dbg.sendCommand("Profiler.stop"); topSelf(profile).forEach(l => console.log("    " + l)); }
    out.push({ name: st.name, ...s, ret });
  }
  if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  app.exit(0);
});
