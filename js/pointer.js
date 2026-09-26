/*
 * Atlas IQ - PUNTERO (v0.10). El puntero es la HERRAMIENTA del jugador: un retículo de pixel art que reacciona al mapa (mar / tierra), a la
 * herramienta activa (sonar, brújula) y a las reliquias: linterna (haz de luz), lupa (fronteras verdaderas), coordenadas, guías, mira telescópica...
 * Todo va en DOM/canvas pequeño; las capas de retos (js/challenges.js) leen su posicion en --px / --py.
 */
window.AIQ = window.AIQ || {};
(function (A) {
  const $ = id => document.getElementById(id);
  const P = A.pointer = { st: { tool: null, fx: {}, noCountry: false, windFn: null, distFn: null }, x: -99, y: -99, rx: -99, ry: -99, m: null, on: false, press: 0 };
  let sx = 0, sy = 0, jx = 0, jy = 0, tj = 0, lastNow = 0, hotCol = null, hotAt = 0, hotKm = 1e9;
  let map = null, root, cv, c, tag, mag, mctx, guideX, guideY, ghost, raf = 0, mask = null, lastLL = null, lastLand = null, lastTick = 0, lastHov = 0, lastName = "", pulse = 0;

  /* mascara de tierra (equirrectangular, 720x360) para saber si el puntero esta sobre mar o tierra sin coste */
  function buildMask() {
    if (mask || !map || !map.world) return;
    const w = 720, h = 360, cn = document.createElement("canvas"); cn.width = w; cn.height = h; const g = cn.getContext("2d", { willReadFrequently: true });
    g.fillStyle = "#000"; g.fillRect(0, 0, w, h); g.fillStyle = "#fff";
    for (const f of map.world.features) for (const poly of f.polys) for (const sh of [0, -360, 360]) {
      g.beginPath(); for (const ring of poly.rings) { ring.forEach(([lo, la], i) => { const x = (lo + sh + 180) * 2, y = (90 - la) * 2; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); } g.fill("evenodd");
    }
    const d = g.getImageData(0, 0, w, h).data; mask = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) mask[i] = d[i * 4] > 127 ? 1 : 0;
  }
  const landAt = (lon, lat) => { if (!mask) return false; const x = Math.floor((((lon + 180) % 360) + 360) % 360 * 2), y = Math.floor(clampN((90 - lat) * 2, 0, 359)); return mask[y * 720 + Math.min(719, x)] === 1; };
  const clampN = (v, a, b) => Math.max(a, Math.min(b, v));

  /* nombres de pais traducidos (clave: nombre Natural Earth en ingles) */
  let CN = null;
  const countryName = f => { if (!CN) { CN = {}; (A.PLACES || []).forEach(r => { if (r[1] === "country") CN[r[0].slice(2)] = r[6]; }); } const n = CN[f.name]; return n ? A.tx(n) : f.name; };
  const countryAt = (lon, lat) => { for (const f of map.world.features) { const b = f.polys; let near = false; for (const p of b) if (lon >= p.bbox[0] - 1 && lon <= p.bbox[2] + 1 && lat >= p.bbox[1] - 1 && lat <= p.bbox[3] + 1) { near = true; break; } if (near && A.geo.inFeature(lon, lat, f)) return f; } return null; };

  /* ---------------------------------------------------------------- dibujo del reticulo (64x64, pixel a pixel) */
  const INK = "#191325", GOLD = "#f8b449", GOLD2 = "#ffe08a", TEAL = "#5fd6b8", RED = "#fe5f55", WHITE = "#fff7e6", CYAN = "#7fe3ff";
  const px = (x, y, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), 1, 1); };
  function circle(cx, cy, r, col) { let x = r, y = 0, e = 1 - r; while (x >= y) { for (const [a, b] of [[x, y], [y, x], [-x, y], [-y, x], [x, -y], [y, -x], [-x, -y], [-y, -x]]) px(cx + a, cy + b, col); y++; if (e < 0) e += 2 * y + 1; else { x--; e += 2 * (y - x) + 1; } } }
  function arc(cx, cy, r, a0, a1, col) { for (let a = a0; a < a1; a += 0.04) px(cx + Math.cos(a) * r, cy + Math.sin(a) * r, col); }
  function draw(now) {
    const t = now / 1000, st = P.st, land = lastLand, tool = st.tool, cx = 32, cy = 32;
    c.clearRect(0, 0, 64, 64);
    const R = 19 - (P.press > 0 ? 3 * Math.min(1, P.press / 100) : 0) + (tool ? Math.sin(t * 6) * 0.6 : 0);
    const ring = hotCol || (tool === "sonar" || tool === "compass" ? CYAN : land ? GOLD : TEAL);
    circle(cx, cy, Math.round(R) + 1, INK); circle(cx, cy, Math.round(R) - 2, INK);                     // borde oscuro
    circle(cx, cy, Math.round(R), ring); circle(cx, cy, Math.round(R) - 1, ring);
    for (let k = 0; k < 3; k++) { const a0 = t * 0.9 + (k * Math.PI * 2) / 3; arc(cx, cy, Math.round(R), a0, a0 + 0.5, WHITE); arc(cx, cy, Math.round(R) - 1, a0, a0 + 0.5, WHITE); }   // segmentos que giran
    for (let k = 0; k < 4; k++) {                                                                        // muescas cardinales
      const a = (k * Math.PI) / 2, dx = Math.cos(a), dy = Math.sin(a);
      for (let d = -7; d <= 1; d++) { px(cx + dx * (R + d) + dy, cy + dy * (R + d) + dx, INK); px(cx + dx * (R + d) - dy, cy + dy * (R + d) - dx, INK); }
      for (let d = -6; d <= 0; d++) px(cx + dx * (R + d), cy + dy * (R + d), ring);
    }
    if (tool === "sonar") { const p = (t * 1.2) % 1, rr = 4 + p * (R - 6); circle(cx, cy, Math.round(rr), `rgba(127,227,255,${(1 - p).toFixed(2)})`); }
    if (tool === "compass") { const a = t * 1.4; for (let d = 3; d < 13; d++) { px(cx + Math.cos(a) * d, cy + Math.sin(a) * d, d > 9 ? RED : WHITE); } px(cx, cy - 15, WHITE); }
    // esquinas de "mira" y brazo de radar
    { const B = Math.round(R) + 5 + (P.press > 0 ? -2 : 0), open = tool ? 3 : 0;
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) for (let k = 0; k < 6; k++) {
        px(cx + sx * (B - open) - sx * k, cy + sy * (B - open), INK); px(cx + sx * (B - open), cy + sy * (B - open) - sy * k, INK);
        px(cx + sx * (B - open) - sx * k, cy + sy * (B - open) + sy * 0, ring); px(cx + sx * (B - open), cy + sy * (B - open) - sy * k, ring);
      } }
    if (!tool) { const a = t * 2.4; for (let d = 4; d < Math.round(R) - 2; d++) px(cx + Math.cos(a) * d, cy + Math.sin(a) * d, `rgba(255,224,138,${(0.55 * d / R).toFixed(2)})`); }
    // chincheta central
    const pin = [[0, -2], [-1, -1], [0, -1], [1, -1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [0, 2]];
    for (const [a, b] of pin) for (const [oa, ob] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) px(cx + a + oa, cy + b + ob, INK);
    for (const [a, b] of pin) px(cx + a, cy + b, RED); px(cx - 1, cy - 1, WHITE); px(cx, cy - 1, "#ffb0a8");
    if (P.press > 0) { const k = 1 - P.press / 100; circle(cx, cy, Math.round(R + 2 + k * 8), `rgba(255,247,230,${(1 - k).toFixed(2)})`); }
  }

  /* ---------------------------------------------------------------- bucle */
  function frame(now) {
    raf = requestAnimationFrame(frame); if (!P.on) return;
    if (P.press > 0) P.press = Math.max(0, P.press - 16);
    eff(now); apply(now); draw(now);
    const fx = P.st.fx || {};
    // lat/lon bajo el puntero (a ~30 Hz) -> tierra/mar, coordenadas, pais
    if (now - lastHov > 33) {
      lastHov = now; const ll = map.screenToLonLat(P.x, P.y); lastLL = ll; const l = landAt(ll[0], ll[1]);
      if (fx.thermo && P.st.distFn) { const km = P.st.distFn(ll[0], ll[1]); if (km != null) { const col = hotColor(km); if (col !== hotCol && now - hotAt > 260) { hotCol = col; hotAt = now; } } } else hotCol = null;
      if (lastLand !== null && l !== lastLand && now - lastTick > 120) { lastTick = now; A.sfx.ptrEdge && A.sfx.ptrEdge(l); }
      lastLand = l;
      let txt = "";
      if (fx.coords) txt += `${Math.abs(ll[1]).toFixed(1)}°${ll[1] >= 0 ? "N" : "S"} ${Math.abs(ll[0]).toFixed(1)}°${ll[0] >= 0 ? "E" : "W"}`;
      if (fx.country && !P.st.noCountry && l) { const f = countryAt(ll[0], ll[1]); const nm = f ? countryName(f) : ""; if (nm) txt += (txt ? "\n" : "") + nm; }
      if (txt !== lastName) { lastName = txt; tag.textContent = txt; tag.classList.toggle("on", !!txt); }
    }
    // linea de guias
    if (fx.guides) { guideX.style.transform = `translateX(${P.x}px)`; guideY.style.transform = `translateY(${P.y}px)`; }
    // mira telescopica
    if (fx.mag && mag.classList.contains("on")) {
      const f = map.cv.width / map.W, S = 168, z = 2.4, sw = (S / z) * f; mctx.imageSmoothingEnabled = false;
      mctx.drawImage(map.cv, P.x * f - sw / 2, P.y * f - sw / 2, sw, sw, 0, 0, S, S);
      mctx.strokeStyle = "rgba(25,19,37,.9)"; mctx.lineWidth = 3; mctx.beginPath(); mctx.moveTo(S / 2 - 9, S / 2); mctx.lineTo(S / 2 + 9, S / 2); mctx.moveTo(S / 2, S / 2 - 9); mctx.lineTo(S / 2, S / 2 + 9); mctx.stroke();
      mctx.strokeStyle = "#f8b449"; mctx.lineWidth = 1.2; mctx.stroke();
      const mx = P.x + 84 + S > innerWidth ? P.x - 84 - S : P.x + 84, my = Math.max(8, P.y - 84 - S / 2);
      mag.style.transform = `translate(${mx}px,${my}px)`;
    }
    // fantasma del viento: donde caera realmente el pin
    if (fx.windPreview && P.st.windFn) { const o = P.st.windFn(P.x, P.y); if (o) { ghost.style.transform = `translate(${o[0] - 9}px,${o[1] - 9}px)`; ghost.classList.add("on"); } else ghost.classList.remove("on"); } else ghost.classList.remove("on");
  }

  function show(on) {
    if (on === P.on) return; P.on = on; root.classList.toggle("on", on); document.body.classList.toggle("ptr-on", on);
    const fx = P.st.fx || {}; mag.classList.toggle("on", on && !!fx.mag); guideX.classList.toggle("on", on && !!fx.guides); guideY.classList.toggle("on", on && !!fx.guides);
    if (!on) { const app = $("app"); if (app) { /* deja la ultima posicion */ } if (map) map.setLens && map.setLens(null); }
  }
  /* posicion EFECTIVA del puntero: la del raton mas los retos (temblor, retraso, invertido, mareo). El clic usa esta misma posicion. */
  function eff(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - (lastNow || now)) / 1000)); lastNow = now;
    let x = P.rx, y = P.ry; const m = P.m, W = map.W, H = map.H;
    if (m && m.cmirror) { x = W - x; if (m.cmirror.both) y = H - y; }
    if (m && m.lag) { const a = 1 - Math.exp(-dt * 1000 / Math.max(1, m.lag.tau)); sx += (x - sx) * a; sy += (y - sy) * a; x = sx; y = sy; } else { sx = x; sy = y; }
    if (m && m.dizzy) { const t = now / 1000; x += Math.cos(t * 3.4) * m.dizzy.r; y += Math.sin(t * 3.4) * m.dizzy.r; }
    if (m && m.tremble) { if (now - tj > 45) { tj = now; jx = (Math.random() - 0.5) * 2 * m.tremble.px; jy = (Math.random() - 0.5) * 2 * m.tremble.px; } x += jx; y += jy; }
    P.x = clampN(x, 0, W); P.y = clampN(y, 0, H);
  }
  function apply(now) {
    const x = P.x, y = P.y, fx = P.st.fx || {}, m = P.m; root.style.transform = `translate(${x}px,${y}px)`;
    if (A.chal && A.chal.pointer) A.chal.pointer(x, y);
    if (map && A.chal) { const r = A.chal.lensRadius ? A.chal.lensRadius() : 0; map.setLens(r > 0 ? { x, y, r } : null); }
    let a = 1;
    if (m) {
      if (m.blink && !fx.noBlink) a = (((now / 1000) / m.blink.period) % 1) < m.blink.duty ? 1 : 0;
      if (m.ghost) { const cyc = m.ghost.every + m.ghost.off; if ((now / 1000) % cyc > m.ghost.every) a = 0; }
    }
    if (a === 0 && fx.beacon) a = 0.28;
    cv.style.opacity = a; tag.style.opacity = a;
    cv.style.filter = m && m.cblur ? `blur(${m.cblur.px}px) drop-shadow(0 3px 0 rgba(0,0,0,.45))` : "";
  }
  P.mods = () => { P.m = A.chal && A.chal.ptrMods ? A.chal.ptrMods() : null; };
  P.effective = () => (P.on ? [P.x, P.y] : null);
  /* termometro: azul (lejos) -> rojo (cerca), por franjas */
  const HOT = [[6000, "#3b6bff"], [3000, "#35a7ff"], [1500, "#3fe0c8"], [700, "#7be04a"], [350, "#f2e03a"], [150, "#ffa53a"], [0, "#ff3b3b"]];
  const hotColor = km => { for (const [k, c] of HOT) if (km >= k) return c; return HOT[HOT.length - 1][1]; };

  P.init = m => {
    if (!m.screenToLonLat) return;                                   // respaldo 2D sin WebGL: se queda el cursor normal
    map = m; map.hideReticle = true; buildMask();
    root = document.createElement("div"); root.id = "ptr";
    root.innerHTML = `<canvas class="ptr-cv" width="64" height="64"></canvas><div class="ptr-tag"></div><i class="ptr-ghost"></i>`;
    mag = document.createElement("canvas"); mag.id = "ptrMag"; mag.width = mag.height = 168;
    guideX = document.createElement("i"); guideX.className = "ptr-gx"; guideY = document.createElement("i"); guideY.className = "ptr-gy";
    const app = $("app"); app.append(guideX, guideY, mag, root);
    cv = root.querySelector(".ptr-cv"); c = cv.getContext("2d"); tag = root.querySelector(".ptr-tag"); ghost = root.querySelector(".ptr-ghost"); mctx = mag.getContext("2d");
    window.addEventListener("pointermove", e => {
      if (e.pointerType === "touch") { if (map.pickEnabled && e.target === map.cv) { const r = map.cv.getBoundingClientRect(); P.rx = e.clientX - r.left; P.ry = e.clientY - r.top; P.x = P.rx; P.y = P.ry; if (A.chal && A.chal.pointer) A.chal.pointer(P.x, P.y); } return show(false); }   // en tactil solo se mueven las capas (linterna, lupa)
      const ok = map.pickEnabled && e.target === map.cv; if (!ok) return show(false);
      const r = map.cv.getBoundingClientRect(); P.rx = e.clientX - r.left; P.ry = e.clientY - r.top; if (!P.on) { sx = P.rx; sy = P.ry; } show(true); const t = performance.now(); eff(t); apply(t);
    }, { passive: true });
    window.addEventListener("pointerdown", e => { if (P.on && e.target === map.cv) P.press = 100; }, true);
    document.addEventListener("pointerleave", () => show(false));
    new MutationObserver(() => { if (!map.pickEnabled) show(false); }).observe(map.cv, { attributes: true, attributeFilter: ["class"] });
    raf = requestAnimationFrame(frame);
  };
  /* estado desde la Aventura: herramienta activa, efectos de reliquias, pregunta de paises... */
  P.set = o => {
    Object.assign(P.st, o); const fx = P.st.fx || {};
    if (mag) { mag.classList.toggle("on", P.on && !!fx.mag); guideX.classList.toggle("on", P.on && !!fx.guides); guideY.classList.toggle("on", P.on && !!fx.guides); tag.classList.toggle("on", !!lastName); }
  };
})(window.AIQ);
