/* Geolite v0.6 - logica del juego, campañas y pantallas. */
(function (A) {
  const $ = id => document.getElementById(id);
  const KEY = "atlasiq.v2";

  /* ------------------------------------------------------------ estado y persistencia */
  const S = {
    mode: "classic", campId: null, camp: null, level: 0, qs: [], qi: 0, levelScore: 0, runTotal: 0, runMax: 0, completed: 0, streak: 0,
    phase: "title", limit: 10, t0: 0, pausedAcc: 0, pauseAt: 0, paused: false, lastTick: -1, tense: false, startLevel: 0, prog: {},
    quality: "auto", settingsOpen: false, lastTimeStr: "", intro: true, reduce: false, booting: true, skin: "casino",
    hub: "home", ranked: null, run: null, tool: null, hits: 0,
    cursor: true, tips: true, songToast: true, setTab: "general",
    panSens: 100, zoomSens: 100, units: "km", contrast: false, colorblind: "off", qSize: "n", shake: true,
  };
  const prog = id => (S.prog[id] = S.prog[id] || { unlocked: 1, best: 0, bestIq: 0 });
  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) || "{}");
      A.lang = d.lang && A.STR[d.lang] ? d.lang : A.detectLang();
      S.intro = d.intro !== false; S.reduce = !!d.reduce; S.cursor = d.cursor !== false; S.tips = d.tips !== false; S.tour = d.tour !== false; S.songToast = d.songToast !== false; S.setTab = d.setTab || "general"; S.skin = "casino";
      A.audio.sfxOn = d.sfx !== false; A.audio.musicOn = d.music !== false;
      if (d.vol) Object.assign(A.audio.vol, d.vol);
      S.prog = d.prog || {}; S.mode = d.mode || "classic"; S.campId = d.campId || null; S.quality = d.quality || "auto";
      S.panSens = d.panSens || 100; S.zoomSens = d.zoomSens || 100; S.units = d.units === "mi" ? "mi" : "km";
      S.contrast = !!d.contrast; S.colorblind = ["protan", "deutan", "tritan"].includes(d.colorblind) ? d.colorblind : "off"; S.qSize = ["l", "xl"].includes(d.qSize) ? d.qSize : "n";
      S.shake = d.shake !== false; A.haptic.on = S.shake;
    } catch (e) { A.lang = A.detectLang(); }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ lang: A.lang, sfx: A.audio.sfxOn, music: A.audio.musicOn, vol: A.audio.vol, prog: S.prog, mode: S.mode, campId: S.campId, quality: S.quality, intro: S.intro, reduce: S.reduce, skin: S.skin, cursor: S.cursor, tips: S.tips, tour: S.tour, songToast: S.songToast, setTab: S.setTab, panSens: S.panSens, zoomSens: S.zoomSens, units: S.units, contrast: S.contrast, colorblind: S.colorblind, qSize: S.qSize, shake: S.shake })); } catch (e) { /* sin almacenamiento */ }
  }

  const lv = () => S.camp.levels[S.level];
  const q = () => S.qs[S.qi];
  const pad2 = n => String(n).padStart(2, "0");
  /* distancia mostrada al jugador: respeta S.units. Publica en A porque hub.js y adventure.js tambien muestran distancias. */
  A.fmtDist = km => {
    const mi = S.units === "mi", v = mi ? km / 1.609344 : km;
    return (v < 10 ? v.toFixed(1) : A.fmt(v)) + " " + (mi ? "mi" : "km");
  };
  const fmtKm = A.fmtDist;

  /* ------------------------------------------------------------ arranque */
  load(); A.wiki.loadShort(A.lang);
  const world = A.geo.buildWorld();
  { const col = $("leftCol"), pl = document.querySelector(".plate-sh"); if (col && pl) col.appendChild(pl); }        // columna izquierda: placa, marcador de partida y logros (el mapa queda libre)
  const map = A.createMap($("map"), world, onPick);
  A.codex.init(world, map); A.pointer.init(map);
  map.quality = S.quality; map.resize(true); map.fxOn = !S.reduce; A.applySkin(S.skin, map);
  document.documentElement.classList.toggle("reduce-motion", S.reduce);
  applySens(); applyVisualFX(); applyQSize(); applyShake();
  map.animateTo(map.home(), 0);
  A.cursor.set(S.cursor); A.tt.enable(S.tips);

  /* ------------------------------------------------------------ odometro mecanico */
  const DIGITS = [..."0123456789"].map(d => `<i>${d}</i>`).join("");
  function odoBuild(el, shape, oldDigits) {
    el.innerHTML = ""; el._cols = [];
    let di = 0;
    [...shape].forEach((ch, i) => {
      if (ch === "0") {
        const dg = document.createElement("span"); dg.className = "dg";
        const col = document.createElement("span"); col.className = "col"; col.style.setProperty("--i", el._cols.length); col.innerHTML = DIGITS;
        col.style.setProperty("--d", oldDigits ? oldDigits[di] || 0 : 0); dg.appendChild(col); el.appendChild(dg); el._cols.push(col); di++;
      } else { const sp = document.createElement("span"); sp.className = "sep"; sp.textContent = ch; el.appendChild(sp); }
    });
    el._shape = shape;
  }
  /* rueda las cifras hasta `value`. opts: ms, delay, tick (sonido de maquinita), instant */
  function odoSet(el, value, { ms = 1000, delay = 0, tick = false, instant = false } = {}) {
    const str = A.fmt(value), shape = str.replace(/\d/g, "0"), digits = (str.match(/\d/g) || []).map(Number);
    if (el._shape !== shape) {
      const prev = el._cols ? el._cols.map(c => +c.style.getPropertyValue("--d") || 0) : null;
      const aligned = prev ? Array(Math.max(0, digits.length - prev.length)).fill(0).concat(prev).slice(-digits.length) : null;
      el.style.setProperty("--t", "0s"); odoBuild(el, shape, aligned); void el.offsetWidth;
    }
    el.style.setProperty("--t", instant ? "0s" : ms + "ms"); el.style.setProperty("--dl", instant ? "0ms" : delay + "ms");
    el._cols.forEach((c, i) => c.style.setProperty("--d", digits[i]));
    if (tick && !instant && value > 0) rollSound(ms, delay);
  }
  function rollSound(ms, delay) {
    const n = 12;
    for (let i = 0; i < n; i++) setTimeout(() => A.sfx.count(i / (n - 1)), delay + (ms * 0.85 * i) / n);
    setTimeout(A.sfx.countEnd, delay + ms * 0.9);
  }
  const odoNow = (el, v) => odoSet(el, v, { instant: true });

  /* ------------------------------------------------------------ utilidades de interfaz */
  function dialog(html, cls) {
    /* escritorio: el ticket de la respuesta sale del propio marcador (js/marcador.js); cualquier otra pantalla lo recoge al instante */
    if (cls === "side" && A.marcador.docked()) {
      $("layer").classList.add("hidden"); $("dlg").classList.remove("in"); document.body.classList.remove("vd-on");
      if (A.dealer && A.dealer.homeTease) A.dealer.homeTease(false);
      return A.marcador.show(html);
    }
    A.marcador.close(true);
    const d = $("dlg"); d.className = cls; d.innerHTML = html;
    document.body.classList.toggle("vd-on", cls === "verdict" || cls === "tablewrap"); document.body.classList.toggle("tk-on", cls === "side");
    if (A.dealer && A.dealer.homeTease) A.dealer.homeTease(cls === "home");   // el crupier asoma de vez en cuando SOLO en la pantalla de inicio
    $("layer").classList.remove("hidden");
    requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add("in")));
    const b = d.querySelector("[data-primary]"); if (b) setTimeout(() => b.focus({ preventScroll: true }), 60);
  }
  function closeDialog() { A.marcador.close(); $("layer").classList.add("hidden"); $("dlg").classList.remove("in"); document.body.classList.remove("vd-on", "tk-on"); }   // el ticket del marcador se arranca y cae
  /* control segmentado con indicador deslizante */
  function segSet(seg, value) {
    const btns = [...seg.querySelectorAll("button")], idx = Math.max(0, btns.findIndex(b => b.dataset.v === value));
    btns.forEach((b, i) => b.classList.toggle("on", i === idx)); seg.style.setProperty("--idx", idx);
  }
  const chrome = on => { for (const id of ["ledgerSh", "noteSh", "dockSh", "railSh"]) $(id).classList.toggle("hidden", !on); };

  /* ------------------------------------------------------------ HUD */
  function applyLang() {
    document.documentElement.lang = A.lang;
    document.querySelectorAll("[data-i]").forEach(el => (el.textContent = A.t(el.dataset.i)));
    if (S.camp) updateHud();
    if (S.phase === "asking") setPrompt();
    syncSettings();
  }
  function levelTitle(L) { return A.tx(L.name) + (L.diff ? " · " + A.t("diff." + L.diff) : ""); }
  /* cash (solo al revelar): las cifras ruedan al compas del TOTAL del ticket y la barra arranca a la vez (el resto del cobro, en js/marcador.js) */
  function updateHud(cash) {
    const L = lv(), inf = S.run && A.adv.isInfinite && A.adv.isInfinite();
    $("lvlText").textContent = S.run ? A.adv.hudTitle() : A.t("lvl", { n: S.level + 1, m: S.camp.levels.length, name: levelTitle(L) });
    if (S.run) A.adv.refresh();
    odoSet($("scLevel"), S.levelScore, cash ? { ms: cash.ms, delay: cash.delay } : { ms: 900 });
    $("scTotal").textContent = A.fmt(S.runTotal + S.levelScore);
    $("scNeed").textContent = L.advance > 1 ? A.fmt(L.advance) : "—";
    $("scBar").style.transition = cash ? `width ${cash.gauge}ms cubic-bezier(.2, .8, .2, 1) ${cash.delay}ms` : "";
    $("scBar").style.width = Math.min(100, (S.levelScore / Math.max(1, L.advance)) * 100) + "%";
    $("scBar").classList.toggle("done", L.advance > 1 && S.levelScore >= L.advance);
    $("scMark").style.display = L.advance > 1 ? "" : "none";
    const pips = $("pips"); pips.innerHTML = "";
    if (!inf) for (let i = 0; i < S.qs.length; i++) {
      const p = document.createElement("i");
      p.className = i < S.qi || (i === S.qi && S.phase === "reveal") ? "done" : i === S.qi && S.phase === "asking" ? "cur" : "";
      pips.appendChild(p);
    }
    $("askNo").textContent = inf ? A.t("ask.inf", { n: pad2(S.qi + 1) }) : A.t("ask.no", { n: pad2(Math.min(S.qi + 1, S.qs.length)), m: pad2(S.qs.length) });
  }
  function setPrompt() {
    const o = q(); if (!o) return;
    $("askKind").textContent = A.t("kind." + (o.clue ? "clue" : o.kind || lv().kind));
    if (o.clue && o.answer && !(o.sub && (o.sub.en || o.sub.es))) o.sub = A.blankObj(o.answer);        // descripcion: debajo, la casilla de cada letra
    const flagRound = lv().kind === "flag" || !!(S.run && o.t === "c" && A.adv.isFlagRound && A.adv.isFlagRound());
    const portrait = !flagRound && !!o.img;
    $("askName").classList.toggle("ask-flag-wrap", flagRound);
    $("askName").classList.toggle("ask-person-wrap", portrait);
    if (flagRound && A.adv.renderFlag) { A.adv.renderFlag(o); }
    else if (portrait) {                                                   // Personajes: retrato (Wikimedia Commons, como las banderas) + nombre
      const el = $("askName"), img = document.createElement("img"), nm = document.createElement("b");
      img.className = "ask-portrait"; img.alt = ""; img.draggable = false;
      img.src = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(o.img)}?width=240`;
      img.onerror = () => img.remove();
      nm.textContent = A.tx(o.name); el.replaceChildren(img, nm);
      A.renderBlanks($("askSub"), A.tx(o.sub));
    }
    else { $("askName").textContent = A.tx(o.name); A.renderBlanks($("askSub"), A.tx(o.sub)); if (S.run && A.adv.decorate) A.adv.decorate(o); }
    $("plate").classList.toggle("clue", !!o.clue);
  }
  function setTimer(left) {
    const f = Math.max(0, left / S.limit);
    $("timeFill").style.transform = `scaleX(${f})`;
    const str = Math.max(0, left).toFixed(1);
    if (str !== S.lastTimeStr) { S.lastTimeStr = str; $("timeTxt").textContent = str; $("plate").classList.toggle("hurry", f < 0.3 && left > 0); }
  }
  function setStreak() {
    const c = $("streakChip");
    if (S.streak >= 2) { c.textContent = A.t("streak", { n: S.streak }); c.classList.remove("hidden", "pop"); void c.offsetWidth; c.classList.add("pop"); }
    else c.classList.add("hidden");
  }

  /* ------------------------------------------------------------ ajustes */
  function syncSettings() {
    for (const f of document.querySelectorAll(".fader[data-k]")) {
      const k = f.dataset.k, v = Math.round(A.audio.vol[k] * 100), inp = f.querySelector("input");
      inp.value = v; inp.style.setProperty("--p", v + "%"); f.querySelector("output").textContent = v;
      const sw = f.querySelector(".sw");
      if (sw) { const on = k === "music" ? A.audio.musicOn : A.audio.sfxOn; sw.setAttribute("aria-checked", on); f.classList.toggle("off", !on); }
    }
    for (const f of document.querySelectorAll(".fader[data-range]")) {
      const k = f.dataset.range, v = S[k === "pan" ? "panSens" : "zoomSens"], inp = f.querySelector("input");
      inp.value = v; inp.style.setProperty("--p", ((v - inp.min) / (inp.max - inp.min)) * 100 + "%"); f.querySelector("output").textContent = v + "%";
    }
    segSet(document.querySelector('[data-seg="gfx"]'), S.quality);
    segSet(document.querySelector('[data-seg="units"]'), S.units);
    segSet(document.querySelector('[data-seg="cb"]'), S.colorblind);
    segSet(document.querySelector('[data-seg="qsize"]'), S.qSize);
    refreshLangUIs(); if (A.syncWin) A.syncWin();
    const st = { motion: S.reduce, intro: S.intro, cursor: S.cursor, tips: S.tips, tour: S.tour, songs: S.songToast, contrast: S.contrast, shake: S.shake };
    for (const k in st) { const el = document.querySelector('.sw[data-sw="' + k + '"]'); if (el) el.setAttribute("aria-checked", !!st[k]); }
    const sg = document.querySelector('.sw[data-sw="songs"]'); if (sg) sg.closest(".row-sw").classList.toggle("off", !A.audio.musicOn);
    $("rowCursor").classList.toggle("hidden", !A.cursor.available);
    setTab(S.setTab, true); if (A.jukebox) A.jukebox.sync();
    const rs = $("resetSet"); if (rs && !rs.classList.contains("armed")) rs.textContent = A.t("set.reset"); $("resetSetNote").textContent = A.t("set.reset.d");
    const ra = $("resetAll"); if (ra && !ra.classList.contains("armed")) ra.textContent = A.T("Reiniciar TODO desde cero (desarrollo)", "Reset EVERYTHING from scratch (dev)");
    if ($("resetAllNote")) $("resetAllNote").textContent = A.T("Borra partida guardada, perfil, logros, barajas y ascensiones desbloqueadas, récords, Enciclopedia, tutorial y ajustes. Solo para desarrollo.", "Deletes the saved run, profile, achievements, unlocked decks and ascensions, records, Encyclopedia, tutorial and settings. Dev only.");
    const rc = $("resetCodex"); if (rc && !rc.classList.contains("armed")) rc.textContent = A.T("Restablecer Enciclopedia", "Reset Encyclopedia");
    $("resetCodexNote").textContent = A.T("Borra todas las tarjetas desbloqueadas. Tu perfil, logros y récords no cambian.", "Deletes every unlocked card. Your profile, achievements and records stay.");
  }
  /* restablecer la Enciclopedia: hay que pulsar dos veces (la primera arma el boton) */
  { const rc = $("resetCodex"); let tm = 0;
    rc.onclick = () => {
      if (!rc.classList.contains("armed")) { rc.classList.add("armed"); rc.textContent = A.T("¿Seguro? Pulsa otra vez para borrar", "Sure? Press again to delete"); A.sfx.ui(); clearTimeout(tm); tm = setTimeout(() => { rc.classList.remove("armed"); syncSettings(); }, 4000); return; }
      clearTimeout(tm); rc.classList.remove("armed"); A.codex.reset(); A.sfx.card(); rc.textContent = A.T("Enciclopedia restablecida", "Encyclopedia reset"); setTimeout(syncSettings, 2200);
    }; }
  /* reinicio total (desarrollo): pulsar dos veces; borra TODO lo que guarda el juego en este navegador y recarga */
  { const ra = $("resetAll"); let tm = 0;
    ra.onclick = () => {
      if (!ra.classList.contains("armed")) { ra.classList.add("armed"); ra.textContent = A.T("¿Seguro? Se borra TODO. Pulsa otra vez", "Sure? EVERYTHING is deleted. Press again"); A.sfx.deny(); clearTimeout(tm); tm = setTimeout(() => { ra.classList.remove("armed"); syncSettings(); }, 4500); return; }
      clearTimeout(tm);
      try { A.adv.abandon && A.adv.abandon(); } catch (e) { /* sin partida */ }
      try { Object.keys(localStorage).filter(k => /^atlasiq\./.test(k)).forEach(k => localStorage.removeItem(k)); sessionStorage.clear(); } catch (e) { /* sin almacenamiento */ }
      try { indexedDB.deleteDatabase("atlasiq-codex"); } catch (e) { /* sin IndexedDB */ }
      try { navigator.serviceWorker && navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())); caches && caches.keys().then(ks => ks.forEach(k => caches.delete(k))); } catch (e) { /* sin SW */ }
      ra.textContent = A.T("Reiniciado. Recargando…", "Reset. Reloading…"); setTimeout(() => location.reload(), 500);
    }; }
  function openSettings(on) {
    S.settingsOpen = on; const sh = $("setSh"), sv = $("setVeil");
    sh.classList.toggle("hidden", !on);
    if (sv) sv.classList.toggle("hidden", !on);
    $("setBtn").setAttribute("aria-expanded", on);
    if (A.dealer && A.dealer.homeTease) {
      if (on) { S._dealerWasHome = A.dealer.onHome; A.dealer.homeTease(false); }
      else if (S._dealerWasHome) A.dealer.homeTease(true);
    }
    if (on) { if (A.jukebox) A.jukebox.hide(); syncSettings(); A.sfx.ui(); const v = $("setVer"); if (v) v.textContent = A.VERSION; }
  }
  let blipT = 0;
  for (const f of document.querySelectorAll(".fader[data-k]")) {
    const k = f.dataset.k, inp = f.querySelector("input");
    inp.addEventListener("input", () => {
      const v = +inp.value / 100; A.audio.unlock(); A.audio.setVol(k, v);
      inp.style.setProperty("--p", inp.value + "%"); f.querySelector("output").textContent = inp.value;
      const now = performance.now(); if (now - blipT > 90) { blipT = now; (k === "music" ? A.sfx.blip : A.sfx.blip)(v); }
    });
    inp.addEventListener("change", save);
    const sw = f.querySelector(".sw");
    if (sw) sw.addEventListener("click", () => { toggleSwitch(k); });
  }
  for (const f of document.querySelectorAll(".fader[data-range]")) {
    const k = f.dataset.range === "pan" ? "panSens" : "zoomSens", inp = f.querySelector("input");
    inp.addEventListener("input", () => {
      S[k] = +inp.value; applySens();
      inp.style.setProperty("--p", ((inp.value - inp.min) / (inp.max - inp.min)) * 100 + "%"); f.querySelector("output").textContent = inp.value + "%";
    });
    inp.addEventListener("change", save);
  }
  function toggleSwitch(k) {
    if (k === "music") { A.audio.setMusic(!A.audio.musicOn); if (A.audio.musicOn) A.audio.unlock(); else if (A.jukebox) A.jukebox.hide(); A.sfx.flip(A.audio.musicOn); }
    else { const willOn = !A.audio.sfxOn; if (!willOn) A.sfx.flip(false); A.audio.sfxOn = willOn; if (willOn) A.sfx.flip(true); }
    save(); syncSettings();
  }
  /* ---- idioma: cuadricula en ajustes, popover en el menu y chips en la entrada ---- */
  function langChips(host, onPick) {
    host.innerHTML = "";
    A.LANGS.forEach(L => {
      const b = document.createElement("button"); b.type = "button"; b.dataset.l = L.code; b.lang = L.code;
      b.innerHTML = `${A.icon("flag_" + L.code, "lang-flag")}<span>${L.name}</span>`;
      b.className = L.code === A.lang ? "on" : ""; b.onclick = e => { e.stopPropagation(); onPick(L.code); }; host.appendChild(b);
    });
  }
  function refreshLangUIs() { for (const id of ["gateLangs", "langGrid", "langPopGrid"]) { const h = $(id); if (h) [...h.children].forEach(b => b.classList.toggle("on", b.dataset.l === A.lang)); } }
  function setLang(code) {
    if (code === A.lang || !A.STR[code]) return;
    A.lang = code; save(); A.sfx.ui(); A.wiki.loadShort(A.wlang()); applyLang(); refreshLangUIs();
    if (S.phase === "title" && !S.booting) renderMenu();
    else if (S.phase === "reveal") { const o = q(); $("factText").textContent = o.clue ? `${A.t("res.was")}: ${A.tx(o.answer)}` : A.tx(o.fact); }
    if (S.camp) updateHud();
    A.codex.refresh();
  }
  langChips($("langGrid"), setLang); langChips($("langPopGrid"), code => { setLang(code); $("langPop").classList.add("hidden"); });
  function openLangPop(anchor) {
    const pop = $("langPop"); if (!pop.classList.contains("hidden")) { pop.classList.add("hidden"); return; }
    pop.classList.remove("hidden"); refreshLangUIs();
    const r = anchor.getBoundingClientRect(), w = pop.offsetWidth;
    pop.style.left = Math.max(12, Math.min(innerWidth - w - 12, r.right - w)) + "px"; pop.style.top = r.bottom + 10 + "px";
  }
  document.addEventListener("pointerdown", e => { if (!e.target.closest("#langPop, #menuLang")) $("langPop").classList.add("hidden"); }, true);
  function applyMotion() { document.documentElement.classList.toggle("reduce-motion", S.reduce); map.fxOn = !S.reduce; }
  function applySens() { A.mapSens.pan = S.panSens / 100; A.mapSens.zoom = S.zoomSens / 100; }
  /* Vibracion = no: html.no-shake quita en CSS todos los temblores de pantalla (rachas, rabieta y golpes del crupier; ver uikit.css),
     jpShake no arranca y el movil no vibra. Los retos que tiemblan (Terremoto, letras...) son el propio reto y siguen */
  function applyShake() { document.documentElement.classList.toggle("no-shake", !S.shake); A.haptic.on = S.shake; }
  /* daltonismo (filtro SVG, ver index.html #cbDefs) + alto contraste: se combinan en un solo filter CSS */
  function applyVisualFX() {
    const cb = S.colorblind !== "off" ? `url(#cbFix_${S.colorblind})` : "";
    const hc = S.contrast ? "contrast(1.18) saturate(1.15)" : "";
    document.body.style.filter = [cb, hc].filter(Boolean).join(" ");
    document.documentElement.classList.toggle("hi-contrast", S.contrast);
  }
  function applyQSize() { document.documentElement.style.setProperty("--ask-scale", S.qSize === "xl" ? 1.3 : S.qSize === "l" ? 1.15 : 1); }
  const TOG = {
    motion: () => { S.reduce = !S.reduce; applyMotion(); }, intro: () => { S.intro = !S.intro; },
    cursor: () => { S.cursor = !S.cursor; A.cursor.set(S.cursor); }, tips: () => { S.tips = !S.tips; A.tt.enable(S.tips); }, tour: () => { S.tour = !S.tour; if (S.tour && A.tour) A.tour.reset(); },
    songs: () => { S.songToast = !S.songToast; if (!S.songToast && A.jukebox) A.jukebox.hide(); },
    contrast: () => { S.contrast = !S.contrast; applyVisualFX(); },
    shake: () => { S.shake = !S.shake; applyShake(); if (S.shake) { jpShake(1); A.haptic([40]); } },   // al encenderla, un temblor flojo de muestra
  };
  for (const sw of document.querySelectorAll(".sw[data-sw]")) if (TOG[sw.dataset.sw]) sw.addEventListener("click", () => { TOG[sw.dataset.sw](); A.sfx.flip(true); save(); syncSettings(); });
  /* pestanas de Ajustes */
  function setTab(t, silent) {
    S.setTab = t; segSet(document.querySelector('[data-seg="settab"]'), t);
    document.querySelectorAll(".set-pane").forEach(p => p.classList.toggle("hidden", p.dataset.pane !== t));
    if (!silent) { save(); A.sfx.ui(); }
  }
  document.querySelector('[data-seg="settab"]').addEventListener("click", e => { const b = e.target.closest("button"); if (b && b.dataset.v !== S.setTab) { setTab(b.dataset.v); if (A.jukebox) A.jukebox.sync(); } });
  /* restablecer ajustes: doble pulsacion */
  { const rs = $("resetSet"); let tm = 0;
    rs.onclick = () => {
      if (!rs.classList.contains("armed")) { rs.classList.add("armed"); rs.textContent = A.t("set.reset.ask"); A.sfx.ui(); clearTimeout(tm); tm = setTimeout(() => { rs.classList.remove("armed"); syncSettings(); }, 4000); return; }
      clearTimeout(tm); rs.classList.remove("armed");
      A.audio.setVol("master", 0.85); A.audio.setVol("music", 0.7); A.audio.setVol("sfx", 0.9); A.audio.sfxOn = true; A.audio.setMusic(true); A.audio.unlock();
      S.quality = "auto"; map.setQuality("auto"); S.reduce = false; applyMotion(); S.intro = true; S.cursor = true; S.tips = true; S.tour = true; if (A.tour) A.tour.reset(); S.songToast = true; S.shake = true; applyShake(); A.cursor.set(true); A.tt.enable(true);
      S.panSens = 100; S.zoomSens = 100; applySens(); S.units = "km"; S.contrast = false; S.colorblind = "off"; applyVisualFX(); S.qSize = "n"; applyQSize();
      save(); A.sfx.card(); syncSettings(); rs.textContent = A.t("set.reset.done"); setTimeout(syncSettings, 2200);
    }; }
  /* modo de pantalla: Ventana / Pantalla completa (y "Sin bordes" si el cliente de escritorio lo ofrece: window.geoliteHost) */
  { const seg = document.querySelector('[data-seg="win"]'), host = window.geoliteHost;
    if (host && host.setWindowMode) { const b = document.createElement("button"); b.dataset.v = "border"; b.dataset.i = "win.border"; seg.insertBefore(b, seg.querySelector("i")); seg.classList.add("s3"); }
    const cur = () => (host && host.windowMode ? host.windowMode() : document.fullscreenElement ? "full" : "window");
    seg.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return; const v = b.dataset.v; A.sfx.ui();
      if (host && host.setWindowMode) host.setWindowMode(v);
      else if (v === "full" && !document.fullscreenElement) toggleFs(); else if (v === "window" && document.fullscreenElement) toggleFs();
      setTimeout(() => segSet(seg, cur()), 120);
    });
    document.addEventListener("fullscreenchange", () => segSet(seg, cur()));
    A.syncWin = () => segSet(seg, cur());
    if (host && host.onWindowModeChange) host.onWindowModeChange(() => { segSet(seg, cur()); $("fsBtn").classList.toggle("on", cur() === "full"); }); }
  document.querySelector('[data-seg="gfx"]').addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b || b.dataset.v === S.quality) return;
    S.quality = b.dataset.v; save(); A.sfx.ui(); map.setQuality(S.quality); syncSettings();
  });
  document.querySelector('[data-seg="units"]').addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b || b.dataset.v === S.units) return;
    S.units = b.dataset.v; save(); A.sfx.ui(); syncSettings(); if (S.camp) updateHud();
  });
  document.querySelector('[data-seg="cb"]').addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b || b.dataset.v === S.colorblind) return;
    S.colorblind = b.dataset.v; save(); A.sfx.ui(); applyVisualFX(); syncSettings();
  });
  document.querySelector('[data-seg="qsize"]').addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b || b.dataset.v === S.qSize) return;
    S.qSize = b.dataset.v; save(); A.sfx.ui(); applyQSize(); syncSettings();
  });
  $("setBtn").onclick = () => openSettings(!S.settingsOpen);
  $("setClose").onclick = () => openSettings(false);
  document.addEventListener("pointerdown", e => { if (S.settingsOpen && !e.target.closest("#setSh, #setBtn, .menu-gear, #langPop")) openSettings(false); }, true);

  /* los tooltips (data-tt / data-tip / title) los pinta js/uikit.js */
  /* sonido suave al pasar por controles */
  let lastHover = null;
  document.addEventListener("mouseover", e => {
    const el = e.target.closest && e.target.closest(".go, .camp, .btn-ink, .btn-line, .lv:not(:disabled), #dock button, #rail button, .seg button, .menu-gear, .cx-strip, .mode-card, .deck:not(:disabled), .asc:not(:disabled), .tool, .buy:not(:disabled), .hub-back, .inv-perk");
    if (el && el !== lastHover) A.sfx.hover(); lastHover = el;
  });

  /* ------------------------------------------------------------ movimiento de camara -> sonido */
  let zsT = 0;
  map.onMotion = (zv, pan) => { const now = performance.now(); if (now - zsT < 33) return; zsT = now; A.sfx.zoomVel(zv, pan); };

  /* ------------------------------------------------------------ carril de zoom */
  let zT = 0;
  map.onView = () => {
    const now = performance.now(); if (now - zT < 90) return; zT = now;
    const z = Math.log(Math.max(1, map.zoomLevel())) / Math.log(120);
    $("zoomFill").style.setProperty("--z", Math.round(Math.min(1, z) * 94) + "%");
  };

  /* ------------------------------------------------------------ menu principal */
  function showTitle(screen) {
    document.body.classList.add("title-on"); S.phase = "title"; S.camp = null; S.run = null; S.tool = null; S.ranked = null; A.adv.hideBars(); map.setStyle(A.MAPSTYLES[S.skin] || A.MAPSTYLES.casino); map.setPick(false); map.clearMarks(); map.setHome({ lat: 0, lon: 0, zoom: 1 });
    $("plate").classList.add("hidden"); $("pauseBtn").classList.add("hidden"); $("veil").classList.add("hidden"); $("intro").classList.add("hidden");
    chrome(false); $("factText").textContent = ""; A.music.mode(0); map.startDrift(); openSettings(false);
    renderMenu(screen);
  }
  function renderMenu(screen) { A.hub.screen(screen || S.hub || "home"); }
  /* altura ocupada por el pie de pagina: las cartas de herramienta se colocan justo encima */
  /* escala de la interfaz: en pantallas grandes todo el HUD y los menus crecen (k = 1 en 1280x720, hasta 1,85) para aprovechar el espacio */
  const uiK = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--k")) || 1;
  const setK = () => { const w = innerWidth, h = innerHeight, k = (w < 900 || h < 520) ? 1 : Math.max(1, Math.min(1.85, Math.min(w / 1280, h / 720))); document.documentElement.style.setProperty("--k", k.toFixed(3)); };
  /* ajuste fino: si una pantalla escalada (inicio, campamento, veredicto...) no cabe en la ventana, se baja SU k hasta que quepa entera (nunca hay que desplazarse: esto es un juego de escritorio) */
  const FIT = ".hh, .scr, .table, .vd";
  const fitK = () => {
    const d = $("dlg"), el = d && d.querySelector(":scope > " + FIT.split(", ").join(", :scope > ")); if (!el) { if (d && A.squeeze) A.squeeze(d); return; }
    const base = uiK(); el.style.removeProperty("--k");
    if (el.classList.contains("scrolls")) { if (A.squeeze) A.squeeze(el); return; }                    // pantalla con desplazamiento (solo el Perfil): a tamano completo
    const over = () => {
      const b = el.querySelector(".scr-body");
      if (b) { const ch = b.clientHeight, sh = b.scrollHeight; return sh > ch * 1.015 ? ch / sh : 1; }
      const ch = d.clientHeight, sh = el.getBoundingClientRect().height;                                 // sin .scr-body: el propio bloque (min-height:100%) puede salirse del dialogo, no de si mismo
      let r = sh > ch * 1.015 ? ch / sh : 1;
      if (innerWidth < 900 || innerHeight < 520) return r;                                               // movil: ahi si se desplaza (encoger lo dejaria ilegible)
      /* bloque de alto fijo (Campamento: height 100%): el contenido se sale por abajo. Se mide la maqueta (offsetTop/Height), no scrollHeight,
         que tambien cuenta las cartas mientras entran animadas desde abajo y encogia la pantalla sin motivo */
      const top0 = el.offsetTop, need = Math.max(0, ...[...el.children].map(c => (c.offsetParent === el ? c.offsetTop : c.offsetTop - top0) + c.offsetHeight)) + (parseFloat(getComputedStyle(el).paddingBottom) || 0);
      if (need > el.clientHeight + 1) r = Math.min(r, el.clientHeight / need);
      el.querySelectorAll(".offer.pc").forEach(c => { const room = c.parentElement.clientHeight; if (c.scrollHeight > c.clientHeight + 2 && c.offsetHeight >= room * 0.8) r = Math.min(r, Math.max(0.9, c.clientHeight / c.scrollHeight)); });   // cartas aplastadas por falta de sitio que recortan su boton
      return r;
    };
    let k = base;
    /* primero se quitan las lineas "de 3 letras" (A.squeeze), luego se mide */
    for (let i = 0; i < 8; i++) { if (A.squeeze) A.squeeze(el); const r = over(); if (r >= 1) break; k = Math.max(0.55, k * r * 0.985); el.style.setProperty("--k", k.toFixed(3)); if (k <= 0.55) break; }
  };
  let fitT = 0; const fitSoon = () => { clearTimeout(fitT); fitT = setTimeout(() => { requestAnimationFrame(fitK); }, 60); };
  setK(); A.uiK = uiK; A.fitK = fitK;
  addEventListener("resize", () => { setK(); fitSoon(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitSoon);
  if (window.MutationObserver && $("dlg")) { new MutationObserver(m => { if (m.some(x => x.addedNodes.length)) { fitSoon(); setTimeout(fitK, 260); setTimeout(fitK, 700); } }).observe($("dlg"), { childList: true }); }
  /* las cartas (retratos, iconos) pueden tardar en cargar en la primera visita: si llegan tarde, el ajuste ya hecho se queda corto y el panel desborda */
  if ($("dlg")) $("dlg").addEventListener("load", e => { if (e.target.tagName === "IMG") { fitSoon(); setTimeout(fitK, 300); } }, true);
  { const upd = () => { const r = $("note").getBoundingClientRect(); document.documentElement.style.setProperty("--note-top", (r.height ? Math.round(innerHeight - r.top) : 16) + "px"); };
    if (window.ResizeObserver) new ResizeObserver(upd).observe($("note")); addEventListener("resize", upd); }

  /* ------------------------------------------------------------ partida */
  function prepareRun() { S.run = null; S.tool = null; openSettings(false); A.audio.unlock(); A.music.mode(1); A.profile.get().stats.plays++; A.profile.save(); }
  function newRun() {
    S.camp = A.CAMPAIGNS.find(c => c.id === S.campId);
    S.runTotal = 0; S.runMax = 0; S.completed = 0; S.clean = S.startLevel === 0; save(); prepareRun();   // clean: desde el nivel 1 y sin fallar ninguno (logro Sin red)
    map.setHome(S.camp.home);
    startLevel_(S.startLevel);
  }
  function startLevel_(idx) {
    document.body.classList.remove("title-on"); S.level = idx; S.qs = lv().questions(); S.qi = 0; S.levelScore = 0; S.streak = 0; S.hits = 0; S.phase = "intro";
    closeDialog(); $("plate").classList.add("hidden"); $("pauseBtn").classList.add("hidden"); $("streakChip").classList.add("hidden");
    chrome(true); $("factText").textContent = ""; odoNow($("scLevel"), 0); updateHud();
    showIntro(nextQuestion);
  }
  function showIntro(cb) {
    const L = lv(), el = $("intro");
    el.className = "";
    if (S.run) el.innerHTML = A.adv.introHtml(L); else
    el.innerHTML = `<div class="intro-in"><div class="intro-num">${pad2(S.level + 1)}</div><div class="intro-body">
      <span class="tag">${L.bonus ? A.t("intro.bonus") : A.t("kind." + L.kind)}</span><h2>${A.tx(L.name)}</h2>
      <p>${A.t("intro.q", { n: S.qs.length })} · ${A.t("intro.t", { s: L.seconds })}${L.advance > 1 ? " · " + A.t("intro.goal", { a: A.fmt(L.advance) }) : ""}</p></div></div>`;
    A.sfx.intro(); map.animateTo(map.home(), 1100);
    let done = false, ms = S.run ? (L.boss ? 4200 : 3300) : 2600, talking = false, timeUp = false;
    /* la intro no se cierra sola mientras el crupier habla: espera a su ultima frase y a su segundo de mas, aunque vaya con retraso
       (antes un tope de 11 s le cortaba a media frase). Un clic o una tecla la saltan igual. */
    if (S.run && A.adv.introReady) { const need = A.adv.introReady(L, () => { talking = false; if (timeUp) end(); }) || 0; talking = need > 0; ms = Math.max(ms, 1200 + need); }
    const end = () => { if (done) return; done = true; el.onclick = null; if (S.run && A.adv.introEnd) A.adv.introEnd(); el.classList.add("out"); setTimeout(() => { el.classList.add("hidden"); cb(); }, 430); };
    S.skipIntro = end; el.onclick = end; setTimeout(() => { timeUp = true; if (!talking) end(); }, ms); setTimeout(end, ms + 15000);   // red de seguridad: nunca se queda colgada
  }
  function nextQuestion() {
    S.phase = "asking"; S.paused = false; S.tense = false; S.limit = lv().seconds; S.t0 = performance.now(); S.pausedAcc = 0; S.lastTick = -1; S.lastTimeStr = "";
    map.clearMarks(); map.animateTo(map.home(), 800); map.setPick(true); A.music.mode(1);
    closeDialog(); setPrompt(); setTimer(S.limit);
    $("plate").classList.remove("hidden", "hurry"); $("pauseBtn").classList.remove("hidden"); $("factText").textContent = "";
    if (S.run) A.adv.onQuestion();
    updateHud();
  }
  /* efectos del clic: pin que cae, ondas y chispas donde pulsas */
  let lastPtr = { x: innerWidth / 2, y: innerHeight / 2 };
  document.addEventListener("pointerdown", e => { lastPtr = { x: e.clientX, y: e.clientY }; }, true);
  function pingFx(x, y, kind) {
    if (S.reduce) return; const el = document.createElement("div"); el.className = "ping " + (kind || "");
    el.style.left = x + "px"; el.style.top = y + "px";
    let h = "<i></i><i></i><i></i>"; for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2 + Math.random() * 0.4, d = 34 + Math.random() * 46; h += `<u style="--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d}px;--r:${Math.random() * 360}deg"></u>`; }
    el.innerHTML = h; $("app").appendChild(el); setTimeout(() => el.remove(), 900);
  }
  /* la pantalla entera tiembla con cada jackpot de la Enciclopedia, de menos a mas: 1 flojo (<=300 km), 2 mas (<=150), 3 bastante mas (<=75).
     Nunca sale igual: cada temblor toma una direccion al azar (a mas de ~60 grados de la anterior), abre su propia elipse, gira hacia
     un lado u otro y rebota como un muelle que se apaga, con fuerza, ritmo y duracion un pelin distintos. Se apaga con Vibracion = no
     o con "reducir movimiento" */
  const SHAKE = [
    { a: 3, r: 0, ms: 300, k: 4, ease: "ease-out" },
    { a: 6.5, r: 0.15, ms: 420, k: 6, ease: "ease-out" },
    { a: 13, r: 0.45, ms: 640, k: 8, ease: "cubic-bezier(.36, .07, .19, .97)" },
  ];
  let jpAnim = null, jpAng = Math.random() * Math.PI * 2;
  function jpShake(n) {
    if (!S.shake || S.reduce || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const P = SHAKE[n - 1], rnd = (a, b) => a + Math.random() * (b - a);
    jpAng += rnd(1.1, 5.2);
    const k = P.k + (Math.random() < 0.5 ? 0 : 1), turn = Math.random() < 0.5 ? -1 : 1, oval = rnd(0.25, 0.55), frames = [{ transform: "none", offset: 0, easing: P.ease }];
    for (let i = 0; i < k; i++) {
      const f = Math.pow(1 - i / k, 1.35) * rnd(0.82, 1.12), s = i % 2 ? -1 : 1, along = s * P.a * f, side = P.a * f * oval * rnd(-1, 1);
      const x = along * Math.cos(jpAng) - side * Math.sin(jpAng), y = along * Math.sin(jpAng) + side * Math.cos(jpAng);
      frames.push({ transform: `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${(s * turn * P.r * f).toFixed(3)}deg)`, offset: (i + 0.6 + rnd(-0.2, 0.2)) / (k + 0.6), easing: P.ease });
    }
    frames.push({ transform: "none", offset: 1 });
    if (jpAnim) jpAnim.cancel();
    jpAnim = document.documentElement.animate(frames, { duration: P.ms * rnd(0.92, 1.1) });
  }
  function coinFx(n) {
    if (S.reduce || !n) return; const to = $("abCoins") && $("abCoins").getBoundingClientRect(); if (!to) return;
    for (let k = 0; k < Math.min(n, 8); k++) setTimeout(() => {
      const c = document.createElement("div"); c.className = "coin-fly"; c.innerHTML = A.icon("coin"); c.style.left = lastPtr.x + "px"; c.style.top = lastPtr.y + "px";
      c.style.setProperty("--dx", to.left + to.width / 2 - lastPtr.x + "px"); c.style.setProperty("--dy", to.top + to.height / 2 - lastPtr.y + "px"); $("app").appendChild(c);
      setTimeout(() => { c.remove(); A.sfx.coin(k / 6); }, 720);
    }, 900 + k * 90);
  }
  function onPick(lon, lat) {
    if (S.phase !== "asking" || S.paused) return;
    if (S.run && S.tool) { pingFx(lastPtr.x, lastPtr.y, "probe"); A.adv.probe(lon, lat); return; }
    if (S.run && !(A.pointer && A.pointer.effective && A.pointer.effective())) ({ lon, lat } = A.adv.adjust(lon, lat));   // con puntero propio, el viento ya lo ha movido
    pingFx(lastPtr.x, lastPtr.y); A.sfx.tap(); A.sfx.pin(S.streak);
    reveal({ lon, lat }, Math.max(0, S.limit - (performance.now() - S.t0 - S.pausedAcc) / 1000));
  }
  const padForDialog = () => { return window.innerWidth > 900 ? { l: 60, r: 410, t: 170, b: 130 } : { l: 30, r: 30, t: 240, b: 410 }; };

  function reveal(guess, left) {
    S.phase = "reveal"; map.setPick(false); S.tense = false; A.music.mode(1); if (S.run) A.chal.reveal();
    const o = q(), L = lv(), isC = o.t === "c";
    let km = null, ans = null, span = [], labelAt = null;
    if (isC) {
      const f = world.byName[o.key];
      const big = f.polys.reduce((a, b) => ((b.bbox[2] - b.bbox[0]) * (b.bbox[3] - b.bbox[1]) > (a.bbox[2] - a.bbox[0]) * (a.bbox[3] - a.bbox[1]) ? b : a));
      span = [[big.bbox[0], big.bbox[1]], [big.bbox[2], big.bbox[3]]]; labelAt = [(big.bbox[0] + big.bbox[2]) / 2, (big.bbox[1] + big.bbox[3]) / 2];
      if (guess) km = A.geo.distToFeature(guess.lon, guess.lat, f);
    } else {
      ans = [o.lon, o.lat]; span = [ans];
      if (guess) km = A.geo.haversine(guess.lat, guess.lon, o.lat, o.lon);
    }
    let sc, chips, mult, total, adv = null;
    if (S.run) {                                                   // Aventura: reliquias, jefes y fichas x mult
      adv = A.adv.score(o, guess ? km : null, left, false); sc = adv.sc; S.streak = adv.streak; chips = adv.chips; mult = adv.mult * adv.xmult; total = adv.total;
      A.adv.afterQuestion(adv);
    } else {
      sc = guess ? L.score(o, km, left) : { dist: 0, time: 0, distMax: 1, timeMax: 1 };
      S.streak = guess && sc.dist / sc.distMax >= 0.6 ? S.streak + 1 : 0;
      /* el Clasico mantiene la puntuacion exacta del original */
      chips = sc.dist + sc.time;
      mult = 1;
      total = Math.round(chips * mult);
    }
    const ratio = sc.dist / sc.distMax;
    if (guess && ratio >= 0.75) S.hits++;
    S.levelScore += total; S.runMax += L.maxPerQ;
    A.profile.question({ km: guess ? km : null, inside: !!(guess && isC && km === 0), ratio, streak: S.streak, left, limit: S.limit, timeout: !guess });

    const label = o.clue ? A.tx(o.answer) : A.tx(o.name);
    map.setMarks({
      guess: guess ? [guess.lon, guess.lat] : null, answer: ans, highlight: isC ? o.key : null, label, labelAt,
      dist: guess && km > 0 ? fmtKm(km) : "", pop: total ? "+" + A.fmt(total) : null,
    });
    map.fitPoints(guess ? [...span, [guess.lon, guess.lat]] : span, padForDialog(), 1100);

    const tier = !guess ? 5 : isC && km === 0 ? 4 : ratio >= 0.96 ? 4 : ratio >= 0.75 ? 3 : ratio >= 0.4 ? 2 : ratio >= 0.05 ? 1 : 0;
    const title = !guess ? A.t("res.timeout") : isC && km === 0 ? A.t("res.inside") : A.t(["res.t5", "res.t4", "res.t3", "res.t2", "res.t1"][tier]);
    setTimeout(() => A.sfx.reveal(tier), 480);
    const cxr = guess ? A.codexUnlock(o, km) : { added: [], level: 0 };
    /* Enciclopedia: 1, 2 o 3 jackpots segun el nivel, en cuanto el total termina de rodar. Con cada uno tiembla la pantalla (mas cuanto
       mas cerca) y vibra el movil, y las casillas del ticket se encienden al mismo ritmo. Si ya has pasado a la siguiente pregunta, no empiezan */
    const JP_AT = 1850, JP_MS = Math.round(A.audio.jpGap * 1000), jpTok = S.jpTok = (S.jpTok || 0) + 1, jpAt = i => JP_AT + i * JP_MS + "ms";
    if (cxr.level) setTimeout(() => {
      if (S.jpTok !== jpTok || S.phase !== "reveal") return;
      A.sfx.jackpot(cxr.level); A.haptic.jackpot(cxr.level);
      for (let k = 1; k <= cxr.level; k++) setTimeout(() => jpShake(k), (k - 1) * JP_MS);
    }, JP_AT);
    if (adv && adv.coins) coinFx(adv.coins);
    if (S.streak >= 2) setTimeout(() => { A.sfx.streak(S.streak); setStreak(); if (mult > 1 && !S.reduce && S.shake) { const ap = $("app"); ap.classList.remove("shake"); void ap.offsetWidth; ap.classList.add("shake"); } }, 1500); else setStreak();

    const last = S.qi === S.qs.length - 1 || (S.run && A.adv.infDone && A.adv.infDone());
    const place = o.answer ? A.tx(o.answer) : A.tx(o.name) + (A.tx(o.sub) ? ", " + A.tx(o.sub) : "");
    const from = !guess ? "" : isC ? A.t("res.border", { name: A.tx(o.name) }) : o.clue ? "" : A.t("res.from", { name: place });
    const showKm = guess && !(isC && km === 0);
    dialog(`<div class="sheet ticket">
      <div class="tk-band"><span>${S.run && A.adv.isInfinite && A.adv.isInfinite() ? A.t("ask.inf", { n: pad2(S.qi + 1) }) : A.t("ask.no", { n: pad2(S.qi + 1), m: pad2(S.qs.length) })}</span><span class="tag">${A.t("kind." + (o.clue ? "clue" : o.kind || L.kind))}</span></div>
      <div class="tk-title">${title}</div>
      ${showKm ? `<div class="tk-km"><span class="odo" id="kmNum"></span><span>${S.units === "mi" ? "mi" : "km"}</span></div>` : ""}
      <div class="tk-from">${[from, guess ? A.t("res.clicked", { t: (S.limit - left).toFixed(1) }) : ""].filter(Boolean).join(" · ")}</div>
      ${o.clue ? `<div class="tk-answer"><span>${A.t("res.was")}</span>${A.tx(o.answer)}</div>` : ""}
      <div class="tk-perf"></div>
      <dl class="tk-rows">
        <div style="--i:0"><dt>${A.t("res.dist")}</dt><i></i><dd>+${A.fmt(sc.dist)}</dd></div>
        <div style="--i:1"><dt>${A.t("res.speed")}</dt><i></i><dd>+${A.fmt(sc.time)}</dd></div>
      </dl>
      ${adv && adv.lines.length ? `<div class="tk-perks">${adv.lines.map(l => `<div><span>${A.icon(l[0])}</span><i>${l[1]}</i><b>${l[2]}</b></div>`).join("")}</div>` : ""}
      ${mult > 1 ? `<div class="tk-mult"><div class="c"><span>${A.t("res.chips")}</span><b>${A.fmt(chips)}</b></div><div class="m"><span>${A.t("res.streak")} ${S.streak}</span><b>×${mult.toFixed(1)}</b></div></div>` : ""}
      <div class="tk-total"><span>${A.t("res.total")}</span><span class="odo" id="totNum"></span></div>
      ${adv && adv.coins ? `<div class="tk-coins">${A.icon("coin", "cn")}+${adv.coins} ${A.T("doblones", "doubloons")}</div>` : ""}
      ${guess ? `<div class="tk-cx l${cxr.level}" data-tt="${A.t("codex.title")}
${A.T("Enciclopedia: a menos de 300 km desbloqueas el lugar, a menos de 150 km su historia y a menos de 75 km su dato clave.", "Encyclopedia: within 300 km you unlock the place, within 150 km its history and within 75 km its key fact.")}"><span>${A.t("codex.title")}</span><i>${[0, 1, 2].map(i => `<u style="--jd:${jpAt(i)}"></u>`).join("")}</i><b style="--jd:${jpAt(Math.max(0, cxr.level - 1))}">${cxr.added.length ? "+" + cxr.added.length : cxr.level ? "" : "&gt;300 km"}</b></div>` : ""}
      <button class="btn-ink" id="nextBtn" data-primary><span>${last ? A.t("btn.finish") : A.t("btn.next")}</span><span class="ar">${A.icon("u_next", "sm")}</span> <kbd>${A.icon("u_enter", "sm")}</kbd></button>
    </div>`, "side");
    requestAnimationFrame(() => { const sh = document.querySelector("#dlg .sheet"), pf = sh && sh.querySelector(".tk-perf"); if (pf) sh.style.setProperty("--n", pf.offsetTop + 1 + "px"); });
    if (showKm) { const kmEl = $("kmNum"); odoNow(kmEl, 0); requestAnimationFrame(() => odoSet(kmEl, Math.round(S.units === "mi" ? km / 1.609344 : km), { ms: 1100, delay: 560 })); }
    const totEl = $("totNum"); odoNow(totEl, 0); requestAnimationFrame(() => odoSet(totEl, total, { ms: 1100, delay: 700, tick: total > 0 }));
    $("nextBtn").onclick = () => { last ? finishLevel() : (S.qi++, nextQuestion()); };

    $("factText").textContent = o.clue ? `${A.t("res.was")}: ${A.tx(o.answer)}${A.tx(o.fact) ? " — " + A.tx(o.fact) : ""}` : A.tx(o.fact) || A.factOf(o);
    $("plate").classList.remove("hurry");
    /* el cobro: los puntos del ticket suben al marcador al compas de su TOTAL (700 + 1100 ms); la barra llega en 450 ms y, si cruza la meta
       o un escalon de botin, lo celebra (js/marcador.js) */
    const cash = { from: S.levelScore - total, to: S.levelScore, total, delay: 700, ms: 1100, gauge: 450 };
    updateHud(cash);
    A.marcador.cashIn({ ...cash, advance: L.advance, runTotal: S.runTotal, lootOn: !!(S.run && S.camp.mode === "adventure" && !(A.adv.isInfinite && A.adv.isInfinite())) });
  }

  /* ------------------------------------------------------------ veredictos */
  function verdict({ kind, level, tag, title, text, stats, stamp, stampSub, iq, tier, tierName, buttons, art, lines }) {
    const idc = iq != null ? `<div class="idcard">${tier != null ? A.icon("iq_" + tier) : `<img class="ic" src="assets/icons/logo_mark.png" alt="">`}<span>${A.t("iq.label")}</span><span class="odo" id="iqNum"></span><em>${tierName}</em></div>` : "";
    const chip = kind === "" ? "chip_r" : art === "chest" ? "chip_p" : kind === "win" ? "chip_b" : "chip_g";
    const medal = `<div class="v-medal ${kind}">
        <i class="v-medal-glow"></i>${art === "chest" ? `<i class="v-medal-crown">${A.icon("crown")}</i>` : ""}
        <i class="v-medal-chip">${A.icon(chip)}</i>
      </div>`;
    dialog(`<div class="vd">
      <div class="v-main">
        <span class="tag">${tag || A.t("v.level", { n: pad2(level) })}</span>
        <h2>${title}</h2><p>${text}</p>${lines && lines.length ? `<ul class="v-lines">${lines.map((l, i) => `<li style="animation-delay:${0.5 + i * 0.12}s"><span>${l[0]}</span><i></i><b>${l[1]}</b></li>`).join("")}</ul>` : ""}
        <div class="v-stats">${stats.map((s, i) => `<div><span>${s[0]}</span><span class="odo" id="vs${i}"></span></div>`).join("")}</div>
        <div class="v-actions">${buttons.map(b => `<button class="${b.cls}" id="${b.id}" ${b.primary ? "data-primary" : ""}><span>${b.label}</span>${b.arrow ? `<span class="ar">${A.icon("u_next", "sm")}</span>` : ""}</button>`).join("")}</div>
      </div>
      <div class="v-side">${medal}<div class="v-dealer" id="vdDealer"></div>${idc}</div>
    </div>`, "verdict");
    stats.forEach((s, i) => { const el = $("vs" + i); odoNow(el, 0); requestAnimationFrame(() => odoSet(el, s[1], { ms: 1300, delay: 700 + i * 120, tick: i === 0 && s[1] > 0 })); });
    if (iq != null) { const el = $("iqNum"); odoNow(el, 0); requestAnimationFrame(() => odoSet(el, iq, { ms: 1400, delay: 1000 })); }
    buttons.forEach(b => ($(b.id).onclick = b.onclick));
    if (A.dealer && A.dealer.on) A.dealer.anchor($("vdDealer"));                // el crupier habla dentro del veredicto, sin tapar botones
  }

  function finishLevel() {
    if (S.run) { map.clearMarks(); map.animateTo(map.home(), 900); map.setPick(false); $("plate").classList.add("hidden"); $("pauseBtn").classList.add("hidden"); $("factText").textContent = ""; $("streakChip").classList.add("hidden"); return A.adv.roundEnd(); }
    const levelPerfect = S.qs.length >= 5 && S.hits === S.qs.length;
    if (levelPerfect) { A.profile.get().stats.perfectRounds++; A.profile.save(); }
    A.ach.emit("level", { perfect: levelPerfect });
    const L = lv(), pass = S.levelScore >= L.advance, p = prog(S.camp.id); if (!pass) S.clean = false;
    map.clearMarks(); map.animateTo(map.home(), 900); map.setPick(false);
    $("plate").classList.add("hidden"); $("pauseBtn").classList.add("hidden"); $("factText").textContent = ""; $("streakChip").classList.add("hidden");
    S.phase = "levelEnd";
    if (pass) { S.runTotal += S.levelScore; S.completed++; p.unlocked = Math.max(p.unlocked, Math.min(S.camp.levels.length, S.level + 2)); }
    const shown = pass ? S.runTotal : S.runTotal + S.levelScore;
    const iq = A.computeIQ(shown / Math.max(1, S.runMax), S.completed, S.camp.levels.length);
    p.best = Math.max(p.best, shown); p.bestIq = Math.max(p.bestIq, iq); save();
    if (pass && S.level === S.camp.levels.length - 1) return endScreen(true, iq);
    if (pass) {
      A.sfx.stamp(); setTimeout(A.sfx.win, 380);
      verdict({
        kind: "ok", level: S.level + 1, title: A.t("v.ok"), text: `${A.tx(L.name)} — ${A.t("lc.p", { s: A.fmt(S.levelScore), a: A.fmt(L.advance) })}`,
        stats: [[A.t("v.points"), S.levelScore], [A.t("v.total"), S.runTotal], [A.t("v.iq"), iq]], stamp: A.t("stamp.ok"), stampSub: pad2(S.level + 1),
        buttons: [{ id: "nlBtn", cls: "btn-ink", label: A.t("btn.nextLevel"), arrow: true, primary: true, onclick: () => startLevel_(S.level + 1) }],
      });
    } else { A.sfx.stamp(); setTimeout(A.sfx.fail, 380); endScreen(false, iq); }
  }

  function endScreen(win, iq) {
    const L = lv(), tier = A.iqTier(iq), tierName = A.t("tier." + tier);
    const shown = win ? S.runTotal : S.runTotal + S.levelScore;
    if (S.camp.mode === "classic") {
      if (win) { A.profile.record("classic:" + S.camp.id + ":win", 1); const r = shown / Math.max(1, S.runMax); A.profile.medal(S.camp.id, r >= 0.85 ? "gold" : r >= 0.7 ? "silver" : "bronze"); A.ach.emit("classic", { win: true, clean: !!S.clean }); }
      if (S.ranked) A.rank.submit("classic-" + S.camp.id, { score: shown, extra: { win, lv: S.level + 1 } });
    }
    if (win) { A.sfx.stamp(); setTimeout(A.sfx.victory, 380); }
    const btns = [];
    if (!win) btns.push({ id: "retryBtn", cls: "btn-ink", label: A.t("btn.retry"), arrow: true, primary: true, onclick: () => startLevel_(S.level) });
    btns.push({ id: "newBtn", cls: win ? "btn-ink" : "btn-line", label: A.t("btn.newGame"), primary: win, onclick: () => { S.startLevel = 0; showTitle(); } });
    btns.push({ id: "shareBtn", cls: "btn-line", label: A.t("share"), onclick: async () => {
      const text = A.t("share.text", { iq, tier: tierName, s: A.fmt(shown) }), url = location.href.split("#")[0];
      try {
        if (navigator.share) await navigator.share({ title: "Geolite", text, url });
        else { await navigator.clipboard.writeText(text + " " + url); const sp = $("shareBtn").querySelector("span"); sp.textContent = A.t("share.copied"); setTimeout(() => (sp.textContent = A.t("share")), 1600); }
      } catch (e) { /* cancelado */ }
    } });
    btns.push({ id: "badgeBtn", cls: "btn-line", label: A.t("btn.badge"), onclick: async () => {
      const cv = await A.makeBadge(iq, tierName, `${A.tx(S.camp.title)} · ${A.fmt(shown)} ${A.t("pts")} · ${S.completed}/${S.camp.levels.length}`);
      const a = document.createElement("a"); a.download = `geolite-${iq}.png`; a.href = cv.toDataURL("image/png"); a.click();
    } });
    verdict({
      kind: win ? "win" : "", level: S.level + 1, title: win ? A.t("v.win") : A.t("v.no"),
      text: win ? A.t("win.p", { s: A.fmt(shown) }) : A.t("lf.p", { a: A.fmt(L.advance), s: A.fmt(S.levelScore) }),
      stats: win ? [[A.t("v.total"), shown]] : [[A.t("v.points"), S.levelScore], [A.t("v.goal"), L.advance]],
      stamp: win ? A.t("stamp.win") : A.t("stamp.no"), stampSub: win ? A.icon("u_star", "st") : pad2(S.level + 1), iq, tier, tierName, buttons: btns,
    });
  }

  /* ------------------------------------------------------------ pausa y reloj */
  /* menu de la partida (pausa): reanudar, guardar y salir, o empezar otra. Se abre desde el boton de pausa, con P/Esc o desde el Campamento */
  function closeVeil() { $("veil").classList.add("hidden"); $("veil").innerHTML = ""; }
  function veilMenu(onResume) {
    const adv = !!S.run || A.adv.active(), daily = adv && A.adv.isDaily(), v = $("veil"); v.classList.remove("hidden");
    /* intento del Reto diario: se guarda en su propia ranura y vuelve a su pantalla; no se "empieza otra", se termina aqui (cuenta lo que lleva) */
    const newLbl = daily ? A.pick6("Terminar el intento aquí|End the attempt here|Terminer l'essai ici|Encerrar a tentativa aqui|Versuch hier beenden|Chiudi qui il tentativo||在此结束本次尝试|여기서 도전 끝내기|ここで挑戦を終える|Закончить попытку здесь|Zakończ podejście tutaj") : A.T("Empezar una partida nueva", "Start a new run");
    v.innerHTML = `<div class="pv"><h2>${A.t("pause.h")}</h2>
      <p>${daily ? A.pick6("Tu intento se guarda solo. Puedes salir y continuarlo desde el Reto diario.|Your attempt saves itself. You can leave and pick it up again from the Daily challenge.|Ton essai s'enregistre tout seul. Tu peux partir et le reprendre depuis le Défi du jour.|Sua tentativa é salva sozinha. Você pode sair e continuá-la no Desafio diário.|Dein Versuch speichert sich selbst. Du kannst gehen und ihn in der Tagesherausforderung fortsetzen.|Il tuo tentativo si salva da solo. Puoi uscire e riprenderlo dalla Sfida giornaliera.||你的尝试会自动保存。可以离开，稍后在每日挑战中继续。|도전은 자동으로 저장됩니다. 나갔다가 일일 도전에서 이어서 할 수 있어요.|挑戦は自動で保存されます。抜けても、デイリーチャレンジから続きができます。|Попытка сохраняется сама. Можно выйти и продолжить её в Испытании дня.|Podejście zapisuje się samo. Możesz wyjść i dokończyć je w Wyzwaniu dnia.")
        : adv ? A.T("Tu expedición se guarda sola. Puedes salir y continuarla desde Aventura.", "Your expedition saves itself. You can leave and pick it up again from Adventure.") : A.t("pause.p")}</p>
      <div class="pv-btns"><button class="btn-ink" id="resBtn" data-primary><span>${A.t("btn.resume")}</span><span class="ar">${A.icon("u_next", "sm")}</span></button>
      ${adv ? `<button class="btn-line" id="saveExitBtn">${A.T("Guardar y salir al menú", "Save and exit to menu")}</button><button class="btn-line danger" id="newRunBtn">${newLbl}</button>`
            : `<button class="btn-line" id="exitBtn">${A.T("Salir al menú", "Exit to menu")}</button>`}</div></div>`;
    $("resBtn").onclick = onResume; $("resBtn").focus();
    const leave = to => { closeVeil(); S.paused = false; A.music.muffle(false); if (adv) A.adv.leave(); showTitle(to); };
    if (adv) {
      const home = daily ? "daily" : "adventure";
      $("saveExitBtn").onclick = () => { A.sfx.ui(); leave(home); };
      let armed = false, tm = 0; const nb = $("newRunBtn");
      nb.onclick = () => {
        if (!armed) { armed = true; nb.classList.add("armed"); nb.textContent = daily ? A.pick6("¿Seguro? El intento se cierra con los puntos que llevas. Pulsa otra vez|Sure? The attempt closes with the points you have. Press again|Sûr ? L'essai se clôt avec tes points actuels. Appuie encore|Certeza? A tentativa fecha com os pontos que você tem. Aperte de novo|Sicher? Der Versuch endet mit deinen jetzigen Punkten. Nochmal drücken|Sicuro? Il tentativo si chiude con i punti che hai. Premi ancora|¿Seguro? El intento se cierra con los puntos que llevas. Presiona otra vez|确定吗？本次尝试将以当前分数结束。再按一次|정말요? 지금 점수로 도전이 끝나요. 한 번 더 누르세요|本当に？今の点数で挑戦が終わります。もう一度押して|Точно? Попытка закроется с нынешними очками. Нажми ещё раз|Na pewno? Podejście zamknie się z obecnymi punktami. Naciśnij jeszcze raz") : A.T("¿Seguro? Se pierde esta partida. Pulsa otra vez", "Sure? This run is lost. Press again"); A.sfx.deny(); tm = setTimeout(() => { armed = false; nb.classList.remove("armed"); nb.textContent = newLbl; }, 4000); return; }
        clearTimeout(tm); A.adv.abandon(); A.sfx.deny(); leave(home);
      };
    } else $("exitBtn").onclick = () => { A.sfx.ui(); leave(); };
  }
  function togglePause() {
    if (S.phase !== "asking") return;
    S.paused = !S.paused; A.sfx.pause(); A.music.muffle(S.paused);
    if (S.paused) { S.pauseAt = performance.now(); map.setPick(false); veilMenu(togglePause); }
    else { S.pausedAcc += performance.now() - S.pauseAt; map.setPick(true); closeVeil(); }
  }
  function runMenu() {
    if (S.booting || !(S.run || S.camp || A.adv.active()) || S.phase === "title" || S.phase === "intro") return;
    if (S.phase === "asking") return togglePause();
    if (!$("veil").classList.contains("hidden")) return closeVeil();
    A.sfx.pause(); veilMenu(closeVeil);
  }
  (function clock() {
    if (S.phase === "asking" && !S.paused) {
      const left = S.limit - (performance.now() - S.t0 - S.pausedAcc) / 1000;
      setTimer(left);
      const c = Math.ceil(left);
      if (left > 0 && c <= 3 && c !== S.lastTick) { S.lastTick = c; A.sfx.tick(c); }
      if (left > 0 && left <= 3.2 && !S.tense) { S.tense = true; A.music.mode(2); }
      if (left <= 0) reveal(null, 0);
    }
    requestAnimationFrame(clock);
  })();

  /* ------------------------------------------------------------ controles */
  $("zoomIn").onclick = () => map.zoomBy(1.6);
  $("zoomOut").onclick = () => map.zoomBy(1 / 1.6);
  $("zoomHome").onclick = () => map.animateTo(S.camp ? map.home() : { ...map.home(), s: map.minS }, 600);
  $("pauseBtn").onclick = togglePause;
  function toggleFs() {
    const host = window.geoliteHost;
    if (host && host.setWindowMode) { host.setWindowMode(host.windowMode() === "full" ? "window" : "full"); return; }
    if (document.fullscreenElement) document.exitFullscreen();
    else (document.documentElement.requestFullscreen || (() => {})).call(document.documentElement);
  }
  $("fsBtn").onclick = toggleFs;
  document.addEventListener("fullscreenchange", () => $("fsBtn").classList.toggle("on", !!document.fullscreenElement));

  document.addEventListener("pointerdown", e => {
    A.audio.unlock(!S.booting);
    if (e.target.closest && e.target.closest(".go, .camp, .btn-ink, .btn-line, .lv, #dock button, #rail button, .seg button, .menu-gear, .hub-back, .asc, .tool")) A.sfx.ui();
    /* menu principal: pulsar el fondo (nada activable) tambien suena, para que cada toque se sienta reconocido */
    else if (S.phase === "title" && !(e.target.closest && e.target.closest("button, a, input, select, textarea, label, [role=button]"))) A.sfx.felt();
  }, true);

  addEventListener("keydown", e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target && e.target.tagName === "INPUT") { if (e.key === "Escape") openSettings(false); return; }
    A.audio.unlock(!S.booting);
    if (S.booting) return;
    const k = e.key.toLowerCase();
    if (k === "escape") { if (S.settingsOpen) openSettings(false); else if (S.run && S.tool) A.adv.cancelTool(); else if (S.phase === "title" && S.hub !== "home") A.hub.screen("home"); else runMenu(); }
    else if (S.run && S.phase === "asking" && /^[1-4]$/.test(k)) A.adv.toolKey(+k - 1);
    else if (k === "f") toggleFs();
    else if (k === "c" && S.phase === "title") (A.codex.isOpen() ? A.codex.close() : A.codex.open());
    else if (k === "m") toggleSwitch("sfx");
    else if (k === "n") toggleSwitch("music");
    else if (k === "p") togglePause();
    else if (k === "+" || k === "=") map.zoomBy(1.6);
    else if (k === "-") map.zoomBy(1 / 1.6);
    else if (k === "0") $("zoomHome").click();
    else if (k === "enter" || (k === " " && document.activeElement === document.body)) {
      if (S.phase === "intro" && S.skipIntro) { e.preventDefault(); S.skipIntro(); return; }
      const b = document.querySelector("#layer:not(.hidden) [data-primary]") || document.querySelector("#veil:not(.hidden) [data-primary]") || A.marcador.primary();
      if (b && document.activeElement !== b) { e.preventDefault(); b.click(); }
    }
  });

  /* ------------------------------------------------------------ entrada + intro del estudio */
  function requestFs() { const el = document.documentElement; try { (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el); } catch (e) { /* denegado */ } }
  function playStudio(done) {
    const st = $("studio"); st.classList.remove("hidden"); $("stLogo").innerHTML = ""; A.buildLogo($("stLogo"), { animated: true }); $("stLogo").classList.remove("has-png");
    A.sfx.studio();
    let ended = false;
    const end = () => { if (ended) return; ended = true; st.classList.add("leave"); setTimeout(done, 540); };
    if (!A._holdStudio) setTimeout(end, S.reduce ? 1500 : 3500);   /* animacion obligatoria: no se puede saltar */
  }
  function finishBoot() {
    S.booting = false; const boot = $("boot"); boot.classList.add("out"); setTimeout(() => boot.classList.add("hidden"), 850);
    A.audio.unlock(true); showTitle();
  }
  function runBoot() {
    const boot = $("boot"), gate = $("gate"); boot.classList.remove("hidden");
    const showGate = () => { $("studio").classList.add("hidden"); gate.classList.remove("hidden"); };
    let entered = false;
    const enter = () => {
      if (entered) return; entered = true; A.audio.unlock(false); requestFs();
      gate.classList.add("hidden"); finishBoot();
    };
    gate.addEventListener("pointerdown", enter);
    addEventListener("keydown", function k(e) { if (entered) { removeEventListener("keydown", k); return; } if (e.key === "Enter" || e.key === " ") { e.preventDefault(); enter(); } });
    (A._debug = A._debug || {}).enterBoot = enter;
    if (S.intro) playStudio(showGate); else showGate();
  }

  A.core = { S, map, world, dialog, closeDialog, verdict, prog, save, toggleFs, openSettings, openLangPop, runMenu, refreshPrompt: () => { setPrompt(); }, newRun, prepareRun, startLevel: startLevel_, showHub: showTitle, odoSet };

  applyLang(); syncSettings();
  const start = () => {
    { const sp = $("splash"); if (sp) { sp.classList.add("out"); setTimeout(() => sp.remove(), 500); } }   // pantalla de carga fuera en cualquier caso
    if (/[?&]skipboot/.test(location.search)) { S.booting = false; showTitle(); } else runBoot();
  };
  if (document.fonts && document.fonts.load) Promise.race([Promise.all([document.fonts.load("400 20px 'Jersey 15'"), document.fonts.load("400 12px Silkscreen"), document.fonts.load("700 12px Silkscreen")]), new Promise(r => setTimeout(r, 1200))]).then(start, start);
  else start();

  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register("sw.js").catch(() => {});

  A._debug = Object.assign(A._debug || {}, { S, map, world, reveal, startLevel_, showTitle, odoSet, setLang, finishBoot, playStudio });
})(window.AIQ);
