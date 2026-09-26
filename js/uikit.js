/* Atlas IQ · uikit: puntero de casino para TODA la aplicacion + tooltips propios (sustituyen al `title` de Windows).
 *  - Puntero: sprites pixel-art generados en un canvas y aplicados como `cursor: url(...)`. Se reescriben las hojas de estilo para
 *    que grab/pointer/not-allowed... usen la version de casino. Solo en dispositivos con raton (pointer:fine).
 *  - Tooltips: cualquier elemento con `data-tt="Titulo\nDescripcion"` (o `data-th="<html>"`, o el viejo `title`) muestra una tarjeta
 *    pixel-art que sigue al puntero. `A.ttAttr(titulo, descripcion)` devuelve el atributo ya escapado para plantillas. */
(() => {
  "use strict";
  const A = window.AIQ = window.AIQ || {};
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  A.esc = A.esc || esc;
  A.ttAttr = (t, d) => `data-tt="${esc(d ? t + "\n" + d : t)}"`;

  /* ------------------------------------------------------------------ puntero de casino */
  const PAL = { w: "#fff3cf", g: "#f8b449", r: "#ff5a4d", b: "#69c7ff", k: "#191325" };
  const CELL = 2;
  const ARROW = [
    "w..........", "ww.........", "www........", "wwww.......", "wwwww......", "wwwwww.....", "wwwwwww....", "wwwwwwww...", "wwwwwwwww..", "wwwwwwwwww.",
    "wwwwww.....", "ww.ww......", "w..www.....", "....ww.....", ".....ww....", ".....ww....",
  ];
  const HAND = [
    "....ww.......", "...wwww......", "...wwww......", "...wwww......", "...wwww......", "...wwwwwwww..", "...wwwwkwwkw.", ".wwwwwwkwwkww", "wwwwwwwwwwwww", "wwwwwwwwwwwww",
    ".wwwwwwwwwwww", ".wwwwwwwwwww.", "..wwwwwwwwww.", "..wwwwwwwww..", "...wwwwwwww..", "...wwwwwwww..",
  ];
  const GRAB = [
    "...w.w.w.....", "..wwwwwwww...", "..wwwwwwwwww.", ".wwwwwwwwwwww", "wwwwwwwwwwwww", "wwwwwwwwwwwww", ".wwwwwwwwwwww", ".wwwwwwwwwww.", "..wwwwwwwwww.", "...wwwwwwww..", "...wwwwwwww..",
  ];
  const FIST = [
    ".............", "..w.w.w.w....", ".wwwwwwwwww..", ".wwwwwwwwwww.", ".wwwwwwwwwww.", ".wwwwwwwwwww.", "..wwwwwwwww..", "...wwwwwww...", "...wwwwwww...",
  ];
  const IBEAM = ["wwwww", "..w..", "..w..", "..w..", "..w..", "..w..", "..w..", "..w..", "..w..", "..w..", "..w..", "wwwww"];
  const HOURGLASS = [
    "wwwwwwwww", ".w.....w.", ".wgggggw.", "..wgggw..", "...wgw...", "....w....", "...w.w...", "..w.g.w..", ".w.ggg.w.", "wwwwwwwww",
  ];
  const grid = (w, h) => Array.from({ length: h }, () => Array(w).fill("."));
  const rows = g => g.map(r => r.join(""));
  function ring(g, cx, cy, r0, r1, c) { for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) { const d = Math.hypot(x - cx, y - cy); if (d >= r0 && d <= r1) g[y][x] = c; } }
  function noEntry() { const g = grid(15, 15); ring(g, 7, 7, 5.2, 7, "r"); for (let i = 2; i <= 12; i++) { g[i][i] = "r"; g[i][i + 1 > 14 ? 14 : i + 1] = "r"; } return rows(g); }
  function cross() { const g = grid(15, 15); for (let i = 0; i < 15; i++) if (i < 5 || i > 9) { g[7][i] = "w"; g[i][7] = "w"; } g[7][7] = "g"; return rows(g); }
  function zoom(plus) { const g = grid(15, 15); ring(g, 5, 5, 3.6, 5.2, "w"); for (let i = 9; i <= 13; i++) { g[i][i] = "g"; g[i][i + 1 > 14 ? 14 : i + 1] = "g"; } for (let x = 3; x <= 7; x++) g[5][x] = "b"; if (plus) for (let y = 3; y <= 7; y++) g[y][5] = "b"; return rows(g); }
  function help() { const a = ARROW.map(r => r.padEnd(17, ".").split("")), q = ["..gggg.", ".gg..gg", ".....gg", "....gg.", "...gg..", "...gg..", ".......", "...gg.."]; q.forEach((r, y) => r.split("").forEach((c, x) => { if (c !== ".") a[y][x + 10] = c; })); return a.map(r => r.join("")); }
  /* nombre -> [filas, hotspot x, hotspot y] en celdas (sin contar el contorno) */
  const SPR = {
    def: [ARROW, 0, 0], ptr: [HAND, 4, 0], txt: [IBEAM, 2, 5], grab: [GRAB, 6, 5], grabbing: [FIST, 6, 4], no: [noEntry(), 7, 7], wait: [HOURGLASS, 4, 4],
    cross: [cross(), 7, 7], zin: [zoom(true), 5, 5], zout: [zoom(false), 5, 5], help: [help(), 0, 0],
  };
  function sprite(name) {
    const [src, hx, hy] = SPR[name], H = src.length, W = Math.max(...src.map(r => r.length)), gw = W + 2, gh = H + 2, g = grid(gw, gh);
    src.forEach((r, y) => r.split("").forEach((c, x) => { if (c !== ".") g[y + 1][x + 1] = c; }));
    const out = g.map(r => r.slice());
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) if (g[y][x] === ".") { const n = (g[y - 1] || [])[x] || ".", s = (g[y + 1] || [])[x] || ".", e = g[y][x + 1] || ".", w = g[y][x - 1] || "."; if (n !== "." || s !== "." || e !== "." || w !== ".") out[y][x] = "k"; }
    const cv = document.createElement("canvas"); cv.width = gw * CELL; cv.height = gh * CELL; const c = cv.getContext("2d");
    out.forEach((r, y) => r.forEach((ch, x) => { if (ch !== ".") { c.fillStyle = PAL[ch]; c.fillRect(x * CELL, y * CELL, CELL, CELL); } }));
    return `url("${cv.toDataURL("image/png")}") ${(hx + 1) * CELL} ${(hy + 1) * CELL}`;
  }
  const KEY = { auto: "def", default: "def", pointer: "ptr", text: "txt", grab: "grab", grabbing: "grabbing", "not-allowed": "no", wait: "wait", progress: "wait", help: "help", crosshair: "cross", "zoom-in": "zin", "zoom-out": "zout", move: "grab", "all-scroll": "grab" };
  A.cursor = { on: false, available: false, set() {} };

  function initCursor() {
    let fine = false, off = false;
    try { fine = matchMedia("(pointer:fine)").matches && matchMedia("(hover:hover)").matches; } catch (e) { /* sin matchMedia */ }
    if (!fine) return;
    const root = document.documentElement, fb = { def: "default", ptr: "pointer", txt: "text", grab: "grab", grabbing: "grabbing", no: "not-allowed", wait: "wait", cross: "crosshair", zin: "zoom-in", zout: "zoom-out", help: "help" };
    const sp = {}; Object.keys(SPR).forEach(k => { sp[k] = `${sprite(k)}, ${fb[k]}`; });
    A.cursor.available = true;
    A.cursor.set = on => { A.cursor.on = !!on; Object.keys(SPR).forEach(k => root.style.setProperty("--c-" + k, on ? sp[k] : fb[k])); };
    A.cursor.set(true);
    const st = document.createElement("style"); st.id = "gcurCss";
    st.textContent = `html.gcur { cursor: var(--c-def); }
:where(html.gcur) :where(a[href], button, summary, select, label[for], [role=button], [role=switch], input[type=button], input[type=submit], input[type=checkbox], input[type=radio], input[type=range], input[type=color], input[type=file]) { cursor: var(--c-ptr); }
:where(html.gcur) :where(input:not([type]), input[type=text], input[type=search], input[type=email], input[type=number], input[type=password], input[type=url], textarea) { cursor: var(--c-txt); }
:where(html.gcur) :where(:disabled, [aria-disabled=true]) { cursor: var(--c-no); }`;
    document.head.appendChild(st);
    /* las hojas propias declaran cursor: pointer/grab/...: se reescriben para que usen la version de casino */
    const fix = rules => {
      for (const r of rules) {
        if (r.cssRules && r.cssRules.length) fix(r.cssRules);
        if (!r.style || !r.style.cursor) continue;
        const k = KEY[r.style.cursor.trim()]; if (k) r.style.setProperty("cursor", `var(--c-${k})`);
      }
    };
    const sweep = () => { for (const sh of document.styleSheets) { try { if (sh.ownerNode && sh.ownerNode.id === "gcurCss") continue; fix(sh.cssRules); } catch (e) { /* hoja externa */ } } };
    sweep(); window.addEventListener("load", sweep); setTimeout(sweep, 1200);
    root.classList.add("gcur");
    /* destello pixel-art al pulsar (no sobre el mapa: ahi ya esta la mira) */
    document.addEventListener("pointerdown", e => {
      if (!A.cursor.on || e.pointerType !== "mouse" || e.button !== 0 || (e.target && e.target.tagName === "CANVAS")) return;
      const b = document.createElement("div"); b.className = "gc-burst"; b.style.left = e.clientX + "px"; b.style.top = e.clientY + "px";
      for (let i = 0; i < 6; i++) { const p = document.createElement("i"), a = (i / 6) * Math.PI * 2 + Math.random() * 0.5; p.style.setProperty("--dx", Math.cos(a) * 18 + "px"); p.style.setProperty("--dy", Math.sin(a) * 18 + "px"); p.className = i % 2 ? "g" : ""; b.appendChild(p); }
      document.body.appendChild(b); setTimeout(() => b.remove(), 520);
    }, true);
  }

  /* ------------------------------------------------------------------ tooltips */
  let tipsOn = true, tip, cur = null, timer = 0, shown = false, mx = 0, my = 0, lastHide = 0;
  const find = t => {
    for (let e = t; e && e.nodeType === 1 && e !== document.documentElement; e = e.parentElement) {
      if (e.hasAttribute("data-th") || e.hasAttribute("data-tt") || e.hasAttribute("data-tip") || e.hasAttribute("data-tf")) return e;
      const ti = e.getAttribute("title"); if (ti) { e.setAttribute("data-tt", ti.indexOf(String.fromCharCode(10)) < 0 ? ti.replace(" — ", String.fromCharCode(10)) : ti); e.removeAttribute("title"); return e; }
    }
    return null;
  };
  const html = el => {
    const h = el.getAttribute("data-th"); if (h) return h;
    const k = el.getAttribute("data-tip"); if (k && !el.hasAttribute("data-tt")) return `<b>${esc(A.t ? A.t(k) : k)}${el.dataset.key ? `<span class="tt-k">${esc(el.dataset.key)}</span>` : ""}</b>`;
    let raw = el.getAttribute("data-tt"); const f = el.getAttribute("data-tf");
    if (raw == null && f && A.tips[f]) { try { raw = A.tips[f](el); } catch (e) { raw = ""; } }     // tips por funcion: se calculan al pasar el puntero (idioma y numeros al dia)
    const [t, ...r] = String(raw || "").split("\n"); if (!t) return "";
    return `<b>${esc(t)}</b>${r.length ? `<span>${esc(r.join("\n"))}</span>` : ""}`;
  };
  function place() {
    const r = tip.getBoundingClientRect(); let x = mx + 16, y = my + 22;
    if (x + r.width > innerWidth - 8) x = Math.max(8, mx - r.width - 14);
    if (y + r.height > innerHeight - 8) y = Math.max(8, my - r.height - 14);
    tip.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
  }
  function hide() { clearTimeout(timer); if (shown) { shown = false; lastHide = Date.now(); tip.classList.remove("on"); } }
  function show() {
    if (!tipsOn || !cur || !cur.isConnected) return; const h = html(cur); if (!h) return;
    tip.innerHTML = h; shown = true; tip.classList.add("on"); place();
  }
  function arm(el) {
    hide(); cur = el; if (!el) return;
    timer = setTimeout(show, Date.now() - lastHide < 350 ? 0 : 340);
  }
  A.tips = A.tips || {};
  A.tt = { enable: on => { tipsOn = !!on; if (!tipsOn) hide(); }, hide, refresh: () => { if (cur && shown) show(); } };

  function initTips() {
    tip = document.createElement("div"); tip.id = "tt"; tip.className = "tt"; tip.setAttribute("role", "tooltip"); document.body.appendChild(tip);
    document.addEventListener("pointerover", e => { if (e.pointerType === "touch") return; const el = find(e.target); if (el !== cur) arm(el); }, true);
    /* los controles desactivados no lanzan eventos: se buscan a mano (p. ej. "logro bloqueado" en una baraja) */
    let lastDis = 0;
    const disabledAt = () => { for (const d of document.querySelectorAll(":disabled[data-tt], :disabled[data-th], :disabled[data-tip]")) { const r = d.getBoundingClientRect(); if (mx >= r.left && mx <= r.right && my >= r.top && my <= r.bottom) return d; } return null; };
    document.addEventListener("pointermove", e => {
      if (e.pointerType === "touch") return; mx = e.clientX; my = e.clientY; if (shown) place();
      const now = performance.now(); if (now - lastDis < 60) return; lastDis = now;
      const d = disabledAt(); if (d) { if (d !== cur) arm(d); } else if (cur && cur.disabled) arm(null);
    }, { capture: true, passive: true });
    ["pointerdown", "wheel", "keydown", "blur", "scroll"].forEach(k => window.addEventListener(k, hide, true));
    document.addEventListener("pointerout", e => { if (!e.relatedTarget) { hide(); cur = null; } }, true);
    setInterval(() => { if (cur && !cur.isConnected) { hide(); cur = null; } }, 400);
  }

  const boot = () => { initCursor(); initTips(); };
  if (document.body) boot(); else document.addEventListener("DOMContentLoaded", boot);
})();
