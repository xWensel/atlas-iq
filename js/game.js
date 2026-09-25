/* Atlas IQ v0.3 - logica del juego, campañas y pantallas. */
(function (A) {
  const $ = id => document.getElementById(id);
  const KEY = "atlasiq.v2";

  /* ------------------------------------------------------------ estado y persistencia */
  const S = {
    mode: "classic", campId: null, camp: null, level: 0, qs: [], qi: 0, levelScore: 0, runTotal: 0, runMax: 0, completed: 0, streak: 0,
    phase: "title", limit: 10, t0: 0, pausedAcc: 0, pauseAt: 0, paused: false, lastTick: -1, tense: false, startLevel: 0, prog: {},
    quality: "auto", settingsOpen: false, lastTimeStr: "", intro: true, reduce: false, fsGate: true, booting: true, skin: "expedicion",
  };
  const prog = id => (S.prog[id] = S.prog[id] || { unlocked: 1, best: 0, bestIq: 0 });
  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) || "{}");
      A.lang = d.lang && A.STR[d.lang] ? d.lang : A.detectLang();
      S.intro = d.intro !== false; S.reduce = !!d.reduce; S.fsGate = d.fsGate !== false; S.skin = A.SKINS[d.skin] ? d.skin : "expedicion";
      A.audio.sfxOn = d.sfx !== false; A.audio.musicOn = d.music !== false;
      if (d.vol) Object.assign(A.audio.vol, d.vol);
      S.prog = d.prog || {}; S.mode = d.mode || "classic"; S.campId = d.campId || null; S.quality = d.quality || "auto";
    } catch (e) { A.lang = A.detectLang(); }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ lang: A.lang, sfx: A.audio.sfxOn, music: A.audio.musicOn, vol: A.audio.vol, prog: S.prog, mode: S.mode, campId: S.campId, quality: S.quality, intro: S.intro, reduce: S.reduce, fsGate: S.fsGate, skin: S.skin })); } catch (e) { /* sin almacenamiento */ }
  }

  const lv = () => S.camp.levels[S.level];
  const q = () => S.qs[S.qi];
  const pad2 = n => String(n).padStart(2, "0");
  const fmtKm = d => (d < 10 ? d.toFixed(1) : A.fmt(d)) + " km";

  /* ------------------------------------------------------------ arranque */
  load();
  const world = A.geo.buildWorld();
  const map = A.createMap($("map"), world, onPick);
  A.codex.init(world, map);
  map.quality = S.quality; map.resize(true); map.fxOn = !S.reduce; A.applySkin(S.skin, map);
  document.documentElement.classList.toggle("reduce-motion", S.reduce);
  map.animateTo(map.home(), 0);

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
    const d = $("dlg"); d.className = cls; d.innerHTML = html;
    document.body.classList.toggle("vd-on", cls === "verdict");
    $("layer").classList.remove("hidden");
    requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add("in")));
    const b = d.querySelector("[data-primary]"); if (b) setTimeout(() => b.focus({ preventScroll: true }), 60);
  }
  function closeDialog() { $("layer").classList.add("hidden"); $("dlg").classList.remove("in"); document.body.classList.remove("vd-on"); }
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
  function updateHud() {
    const L = lv();
    $("lvlText").textContent = A.t("lvl", { n: S.level + 1, m: S.camp.levels.length, name: levelTitle(L) });
    odoSet($("scLevel"), S.levelScore, { ms: 900 });
    $("scTotal").textContent = A.fmt(S.runTotal + S.levelScore);
    $("scNeed").textContent = L.advance > 1 ? A.fmt(L.advance) : "—";
    $("scBar").style.width = Math.min(100, (S.levelScore / Math.max(1, L.advance)) * 100) + "%";
    $("scBar").classList.toggle("done", S.levelScore >= L.advance);
    $("scMark").style.display = L.advance > 1 ? "" : "none";
    const pips = $("pips"); pips.innerHTML = "";
    for (let i = 0; i < S.qs.length; i++) {
      const p = document.createElement("i");
      p.className = i < S.qi || (i === S.qi && S.phase === "reveal") ? "done" : i === S.qi && S.phase === "asking" ? "cur" : "";
      pips.appendChild(p);
    }
    $("askNo").textContent = A.t("ask.no", { n: pad2(Math.min(S.qi + 1, S.qs.length)), m: pad2(S.qs.length) });
  }
  function setPrompt() {
    const o = q(); if (!o) return;
    $("askKind").textContent = A.t("kind." + (o.clue ? "clue" : lv().kind));
    $("askName").textContent = A.tx(o.name); $("askSub").textContent = A.tx(o.sub);
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
    for (const f of document.querySelectorAll(".fader")) {
      const k = f.dataset.k, v = Math.round(A.audio.vol[k] * 100), inp = f.querySelector("input");
      inp.value = v; inp.style.setProperty("--p", v + "%"); f.querySelector("output").textContent = v;
      const sw = f.querySelector(".sw");
      if (sw) { const on = k === "music" ? A.audio.musicOn : A.audio.sfxOn; sw.setAttribute("aria-checked", on); f.classList.toggle("off", !on); }
    }
    segSet(document.querySelector('[data-seg="gfx"]'), S.quality); refreshLangUIs();
    const sm = document.querySelector('.sw[data-sw="motion"]'), si = document.querySelector('.sw[data-sw="intro"]');
    if (sm) sm.setAttribute("aria-checked", S.reduce); if (si) si.setAttribute("aria-checked", S.intro);
  }
  function openSettings(on) {
    S.settingsOpen = on; const sh = $("setSh");
    sh.classList.toggle("hidden", !on); sh.classList.toggle("on-menu", S.phase === "title");
    $("setBtn").setAttribute("aria-expanded", on);
    if (on) { syncSettings(); A.sfx.ui(); }
  }
  let blipT = 0;
  for (const f of document.querySelectorAll(".fader")) {
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
  function toggleSwitch(k) {
    if (k === "music") { A.audio.setMusic(!A.audio.musicOn); if (A.audio.musicOn) A.audio.unlock(); A.sfx.flip(A.audio.musicOn); }
    else { const willOn = !A.audio.sfxOn; if (!willOn) A.sfx.flip(false); A.audio.sfxOn = willOn; if (willOn) A.sfx.flip(true); }
    save(); syncSettings();
  }
  /* ---- idioma: cuadricula en ajustes, popover en el menu y chips en la entrada ---- */
  function langChips(host, onPick) {
    host.innerHTML = "";
    A.LANGS.forEach(L => {
      const b = document.createElement("button"); b.type = "button"; b.dataset.l = L.code; b.textContent = L.name; b.lang = L.code;
      b.className = L.code === A.lang ? "on" : ""; b.onclick = e => { e.stopPropagation(); onPick(L.code); }; host.appendChild(b);
    });
  }
  function refreshLangUIs() { if ($("skinGrid")) skinChips($("skinGrid")); for (const id of ["gateLangs", "langGrid", "langPopGrid"]) { const h = $(id); if (h) [...h.children].forEach(b => b.classList.toggle("on", b.dataset.l === A.lang)); } }
  function setLang(code) {
    if (code === A.lang || !A.STR[code]) return;
    A.lang = code; save(); A.sfx.ui(); applyLang(); refreshLangUIs();
    if (S.phase === "title" && !S.booting) renderMenu();
    else if (S.phase === "reveal") { const o = q(); $("factText").textContent = o.clue ? `${A.t("res.was")}: ${A.tx(o.answer)}` : A.tx(o.fact); }
    if (S.camp) updateHud();
    A.codex.refresh();
  }
  /* ---- skins ---- */
  function skinChips(host) {
    host.innerHTML = "";
    A.SKIN_ORDER.forEach(id => {
      const sk = A.SKINS[id], b = document.createElement("button"); b.type = "button"; b.dataset.skin = id; b.className = "skin-btn" + (id === S.skin ? " on" : "");
      b.innerHTML = `<span class="sk-sw">${sk.swatch.map(c => `<i style="background:${c}"></i>`).join("")}</span><span>${A.tx(sk.name)}</span>`;
      b.onclick = e => { e.stopPropagation(); setSkin(id); }; host.appendChild(b);
    });
  }
  function setSkin(id) {
    if (id === S.skin || !A.SKINS[id]) return;
    S.skin = id; save(); A.applySkin(id, map); A.sfx.card();
    const f = $("skinFlash"); f.classList.remove("go"); void f.offsetWidth; f.classList.add("go");
    if (S.phase === "title" && !S.booting) renderMenu(); else if (S.camp) { updateHud(); if (S.phase === "asking") setPrompt(); }
    refreshSkinUI();
  }
  function refreshSkinUI() { const h = $("skinGrid"); if (h) [...h.children].forEach(b => b.classList.toggle("on", b.dataset.skin === S.skin)); }
  const cycleSkin = () => setSkin(A.SKIN_ORDER[(A.SKIN_ORDER.indexOf(S.skin) + 1) % A.SKIN_ORDER.length]);
  skinChips($("skinGrid"));
  langChips($("langGrid"), setLang); langChips($("langPopGrid"), code => { setLang(code); $("langPop").classList.add("hidden"); });
  function openLangPop(anchor) {
    const pop = $("langPop"); if (!pop.classList.contains("hidden")) { pop.classList.add("hidden"); return; }
    pop.classList.remove("hidden"); refreshLangUIs();
    const r = anchor.getBoundingClientRect(), w = pop.offsetWidth;
    pop.style.left = Math.max(12, Math.min(innerWidth - w - 12, r.right - w)) + "px"; pop.style.top = r.bottom + 10 + "px";
  }
  document.addEventListener("pointerdown", e => { if (!e.target.closest("#langPop, #menuLang")) $("langPop").classList.add("hidden"); }, true);
  function applyMotion() { document.documentElement.classList.toggle("reduce-motion", S.reduce); map.fxOn = !S.reduce; }
  for (const sw of document.querySelectorAll(".sw[data-sw='motion'], .sw[data-sw='intro']")) {
    sw.addEventListener("click", () => { if (sw.dataset.sw === "motion") { S.reduce = !S.reduce; applyMotion(); } else S.intro = !S.intro; A.sfx.flip(true); save(); syncSettings(); });
  }
  $("setFs").onclick = () => { toggleFs(); A.sfx.ui(); };
  document.querySelector('[data-seg="gfx"]').addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b || b.dataset.v === S.quality) return;
    S.quality = b.dataset.v; save(); A.sfx.ui(); map.setQuality(S.quality); syncSettings();
  });
  $("setBtn").onclick = () => openSettings(!S.settingsOpen);
  $("setClose").onclick = () => openSettings(false);
  document.addEventListener("pointerdown", e => { if (S.settingsOpen && !e.target.closest("#setSh, #setBtn, .menu-gear, #langPop")) openSettings(false); }, true);

  /* ------------------------------------------------------------ tooltips propios */
  let tipT = 0;
  document.addEventListener("mouseover", e => {
    const el = e.target.closest && e.target.closest("[data-tip]"), tip = $("tip");
    clearTimeout(tipT);
    if (!el) { tip.classList.add("hidden"); return; }
    tipT = setTimeout(() => {
      tip.innerHTML = `<span>${A.t(el.dataset.tip)}</span>${el.dataset.key ? `<kbd>${el.dataset.key}</kbd>` : ""}`;
      tip.classList.remove("hidden");
      const r = el.getBoundingClientRect(), w = tip.offsetWidth;
      tip.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + "px";
      tip.style.top = (r.top > 60 ? r.top - tip.offsetHeight - 10 : r.bottom + 10) + "px";
    }, 320);
  });
  document.addEventListener("pointerdown", () => { clearTimeout(tipT); $("tip").classList.add("hidden"); }, true);
  /* sonido suave al pasar por controles */
  let lastHover = null;
  document.addEventListener("mouseover", e => {
    const el = e.target.closest && e.target.closest(".go, .camp, .btn-ink, .btn-line, .lv:not(:disabled), #dock button, #rail button, .seg button, .menu-gear, .cx-strip");
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
  function showTitle() {
    S.phase = "title"; S.camp = null; map.setPick(false); map.clearMarks(); map.setHome({ lat: 0, lon: 0, zoom: 1 });
    $("plate").classList.add("hidden"); $("pauseBtn").classList.add("hidden"); $("veil").classList.add("hidden"); $("intro").classList.add("hidden");
    chrome(false); $("factText").textContent = ""; A.music.mode(0); map.startDrift(); openSettings(false);
    renderMenu();
  }
  function renderMenu() {
    const camps = A.CAMPAIGNS.filter(c => c.mode === S.mode);
    if (!camps.find(c => c.id === S.campId)) { S.campId = camps[0].id; S.startLevel = 0; }
    const cur = camps.find(c => c.id === S.campId), pr = prog(cur.id);
    S.startLevel = Math.min(S.startLevel, pr.unlocked - 1);
    const list = camps.map((c, i) => {
      const p = prog(c.id), ticks = c.levels.map((_, k) => `<i class="${p.best && k < p.unlocked ? "on" : ""}"></i>`).join("");
      return `<button class="cut camp${c.id === S.campId ? " sel" : ""}" data-id="${c.id}" style="animation-delay:${i * 45}ms">
        <canvas class="camp-thumb" aria-hidden="true"></canvas>
        <span class="camp-body"><span class="camp-t">${A.tx(c.title)}</span><span class="camp-d">${A.tx(c.blurb)}</span>
        <span class="camp-m"><span class="camp-p">${ticks}</span><span>${p.best ? A.t("camp.best", { s: A.fmt(p.best) }) : A.t("camp.new")}</span></span></span></button>`;
    }).join("");
    let picker = "";
    if (pr.unlocked > 1) {
      for (let i = 0; i < cur.levels.length; i++) picker += `<button class="lv${i === S.startLevel ? " sel" : ""}" data-lv="${i}" ${i >= pr.unlocked ? "disabled" : ""}>${i + 1}</button>`;
      picker = `<div class="picker"><span>${A.t("title.from")}</span><div class="lrail">${picker}</div></div>`;
    }
    dialog(`<div class="menu-in">
      <div class="menu-top"><svg class="menu-rose"><use href="#rose"/></svg>
        <div class="menu-tools">
          <button class="menu-gear" id="menuCodex" aria-label="${A.t("tip.codex")}" data-tip="tip.codex" data-key="C"><svg viewBox="0 0 24 24"><path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3zM5 17a3 3 0 013-3h11"/></svg></button>
          <button class="menu-gear" id="menuSkin" aria-label="${A.t("tip.skin")}" data-tip="tip.skin"><svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 100 18c1.4 0 2-.9 2-1.8 0-1.3-1-1.7-1-2.7 0-1 .8-1.5 2-1.5h2.5A3.5 3.5 0 0021 11.5C21 6.8 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.1"/><circle cx="10" cy="7" r="1.1"/><circle cx="14.5" cy="7" r="1.1"/></svg></button>
          <button class="menu-gear txt" id="menuLang" aria-label="${A.t("tip.lang")}" data-tip="tip.lang">${A.lang.toUpperCase()}</button>
          <button class="menu-gear" id="menuFs" aria-label="${A.t("tip.fs")}" data-tip="tip.fs" data-key="F"><svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>
          <button class="menu-gear" id="menuGear" aria-label="${A.t("tip.set")}" data-tip="tip.set"><svg viewBox="0 0 24 24"><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></svg></button>
        </div></div>
      <h1>Atlas<em>IQ</em></h1>
      <p class="tagline">${A.t("title.tag")}</p>
      <p class="lede">${A.t("title.p")}</p>
      <div class="seg" data-seg="mode"><button data-v="classic">${A.t("mode.classic")}</button><button data-v="extended">${A.t("mode.extended")}</button><i></i></div>
      <p class="mode-d">${A.t("mode." + S.mode + ".d")}${S.mode === "classic" && A.t("mode.classic.note") ? `<small>${A.t("mode.classic.note")}</small>` : ""}</p>
      <div class="camps">${list}</div>${picker}
      <button class="cut cx-strip" id="codexBtn" type="button"><span class="cx-strip-ic"><svg viewBox="0 0 24 24"><path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3zM5 17a3 3 0 013-3h11"/></svg></span><span class="cx-strip-t"><b>${A.t("codex.title")}</b><i>${A.t("codex.teaser")}</i></span><span class="cx-strip-n">${A.codexStats().u}<em>/${A.codexStats().t}</em></span></button>
      <button class="cut go" id="goBtn" data-primary>
        <span class="go-dial"><svg><use href="#rose"/></svg></span>
        <span class="go-txt"><b>${A.t("go.label")}</b><i>${A.t("go.sub", { n: S.startLevel + 1, name: A.tx(cur.title) })}</i></span>
        <span class="go-ar">→</span></button>
      <p class="menu-foot">Atlas IQ · v${A.VERSION}</p>
    </div>`, "menu");
    segSet(document.querySelector('.menu-in [data-seg="mode"]'), S.mode);
    document.querySelector('.menu-in [data-seg="mode"]').addEventListener("click", e => { const b = e.target.closest("button"); if (!b || b.dataset.v === S.mode) return; S.mode = b.dataset.v; S.startLevel = 0; save(); renderMenu(); });
    document.querySelectorAll(".camp").forEach(b => (b.onclick = () => { S.campId = b.dataset.id; S.startLevel = 0; save(); renderMenu(); }));
    document.querySelectorAll(".lv").forEach(b => (b.onclick = () => { S.startLevel = +b.dataset.lv; renderMenu(); }));
    $("goBtn").onclick = () => { A.sfx.depart(); newRun(); };
    $("menuGear").onclick = () => openSettings(!S.settingsOpen); $("codexBtn").onclick = $("menuCodex").onclick = () => A.codex.open();
    $("menuSkin").onclick = cycleSkin; $("menuLang").onclick = e => openLangPop(e.currentTarget); $("menuFs").onclick = toggleFs;
    requestAnimationFrame(() => document.querySelectorAll(".camp").forEach((b, i) => map.drawThumb(b.querySelector("canvas"), camps[i].home)));
    // la brujula del boton sigue al cursor
    const go = $("goBtn");
    go.addEventListener("pointermove", e => {
      const r = go.querySelector(".go-dial").getBoundingClientRect();
      go.style.setProperty("--rot", (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI + 90 + "deg");
    });
    go.addEventListener("pointerleave", () => go.style.setProperty("--rot", "0deg"));
  }

  /* ------------------------------------------------------------ partida */
  function newRun() {
    S.camp = A.CAMPAIGNS.find(c => c.id === S.campId);
    S.runTotal = 0; S.runMax = 0; S.completed = 0; save();
    map.setHome(S.camp.home); openSettings(false);
    A.audio.unlock(); A.music.mode(1);
    startLevel_(S.startLevel);
  }
  function startLevel_(idx) {
    S.level = idx; S.qs = lv().questions(); S.qi = 0; S.levelScore = 0; S.streak = 0; S.phase = "intro";
    closeDialog(); $("plate").classList.add("hidden"); $("pauseBtn").classList.add("hidden"); $("streakChip").classList.add("hidden");
    chrome(true); $("factText").textContent = ""; odoNow($("scLevel"), 0); updateHud();
    showIntro(nextQuestion);
  }
  function showIntro(cb) {
    const L = lv(), el = $("intro");
    el.className = "";
    el.innerHTML = `<div class="intro-in"><div class="intro-num">${pad2(S.level + 1)}</div><div class="intro-body">
      <span class="tag">${L.bonus ? A.t("intro.bonus") : A.t("kind." + L.kind)}</span><h2>${A.tx(L.name)}</h2>
      <p>${A.t("intro.q", { n: S.qs.length })} · ${A.t("intro.t", { s: L.seconds })}${L.advance > 1 ? " · " + A.t("intro.goal", { a: A.fmt(L.advance) }) : ""}</p></div></div>`;
    A.sfx.intro(); map.animateTo(map.home(), 1100);
    let done = false;
    const end = () => { if (done) return; done = true; el.onclick = null; el.classList.add("out"); setTimeout(() => { el.classList.add("hidden"); cb(); }, 430); };
    S.skipIntro = end; el.onclick = end; setTimeout(end, 2600);
  }
  function nextQuestion() {
    S.phase = "asking"; S.paused = false; S.tense = false; S.limit = lv().seconds; S.t0 = performance.now(); S.pausedAcc = 0; S.lastTick = -1; S.lastTimeStr = "";
    map.clearMarks(); map.animateTo(map.home(), 800); map.setPick(true); A.music.mode(1);
    closeDialog(); setPrompt(); setTimer(S.limit);
    $("plate").classList.remove("hidden", "hurry"); $("pauseBtn").classList.remove("hidden"); $("factText").textContent = "";
    updateHud();
  }
  function onPick(lon, lat) {
    if (S.phase !== "asking" || S.paused) return;
    A.sfx.tap();
    reveal({ lon, lat }, Math.max(0, S.limit - (performance.now() - S.t0 - S.pausedAcc) / 1000));
  }
  const padForDialog = () => (window.innerWidth > 900 ? { l: 60, r: 410, t: 170, b: 130 } : { l: 30, r: 30, t: 240, b: 410 });

  function reveal(guess, left) {
    S.phase = "reveal"; map.setPick(false); S.tense = false; A.music.mode(1);
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
    const sc = guess ? L.score(o, km, left) : { dist: 0, time: 0, distMax: 1, timeMax: 1 };
    const ratio = sc.dist / sc.distMax;
    S.streak = guess && ratio >= 0.6 ? S.streak + 1 : 0;
    /* FICHAS x MULT (solo modo Extendido; el Clasico mantiene la puntuacion exacta del original) */
    const chips = sc.dist + sc.time;
    const mult = S.camp.mode === "extended" && S.streak >= 2 ? Math.min(2, 1 + 0.2 * (S.streak - 1)) : 1;
    const total = Math.round(chips * mult), bonus = total - chips;
    S.levelScore += total; S.runMax += L.maxPerQ;

    const label = o.clue ? A.tx(o.answer) : A.tx(o.name);
    map.setMarks({
      guess: guess ? [guess.lon, guess.lat] : null, answer: ans, highlight: isC ? o.key : null, label, labelAt,
      dist: guess && km > 0 ? fmtKm(km) : "", pop: total ? "+" + A.fmt(total) : null,
    });
    map.fitPoints(guess ? [...span, [guess.lon, guess.lat]] : span, padForDialog(), 1100);

    const tier = !guess ? 5 : isC && km === 0 ? 4 : ratio >= 0.96 ? 4 : ratio >= 0.75 ? 3 : ratio >= 0.4 ? 2 : ratio >= 0.05 ? 1 : 0;
    const title = !guess ? A.t("res.timeout") : isC && km === 0 ? A.t("res.inside") : A.t(["res.t5", "res.t4", "res.t3", "res.t2", "res.t1"][tier]);
    setTimeout(() => A.sfx.reveal(tier), 480);
    if (guess) A.codexUnlock(o, tier);
    if (S.streak >= 2) setTimeout(() => { A.sfx.streak(S.streak); setStreak(); if (mult > 1 && !S.reduce) { const ap = $("app"); ap.classList.remove("shake"); void ap.offsetWidth; ap.classList.add("shake"); } }, 1500); else setStreak();

    const last = S.qi === S.qs.length - 1;
    const place = o.answer ? A.tx(o.answer) : A.tx(o.name) + (A.tx(o.sub) ? ", " + A.tx(o.sub) : "");
    const from = !guess ? "" : isC ? A.t("res.border", { name: A.tx(o.name) }) : o.clue ? "" : A.t("res.from", { name: place });
    const showKm = guess && !(isC && km === 0);
    dialog(`<div class="sheet ticket">
      <div class="tk-band"><span>${A.t("ask.no", { n: pad2(S.qi + 1), m: pad2(S.qs.length) })}</span><span class="tag">${A.t("kind." + (o.clue ? "clue" : L.kind))}</span></div>
      <div class="tk-title">${title}</div>
      ${showKm ? `<div class="tk-km"><span class="odo" id="kmNum"></span><span>km</span></div>` : ""}
      <div class="tk-from">${[from, guess ? A.t("res.clicked", { t: (S.limit - left).toFixed(1) }) : ""].filter(Boolean).join(" · ")}</div>
      ${o.clue ? `<div class="tk-answer"><span>${A.t("res.was")}</span>${A.tx(o.answer)}</div>` : ""}
      <div class="tk-perf"></div>
      <dl class="tk-rows">
        <div style="--i:0"><dt>${A.t("res.dist")}</dt><i></i><dd>+${A.fmt(sc.dist)}</dd></div>
        <div style="--i:1"><dt>${A.t("res.speed")}</dt><i></i><dd>+${A.fmt(sc.time)}</dd></div>
      </dl>
      ${mult > 1 ? `<div class="tk-mult"><div class="c"><span>${A.t("res.chips")}</span><b>${A.fmt(chips)}</b></div><i>×</i><div class="m"><span>${A.t("res.mult")} · ${A.t("res.streak")} ${S.streak}</span><b>${mult.toFixed(1)}</b></div></div>` : ""}
      <div class="tk-total"><span>${A.t("res.total")}</span><span class="odo" id="totNum"></span></div>
      <button class="btn-ink" id="nextBtn" data-primary><span>${last ? A.t("btn.finish") : A.t("btn.next")}</span><span class="ar">→</span> <kbd>↵</kbd></button>
    </div>`, "side");
    requestAnimationFrame(() => { const sh = document.querySelector("#dlg .sheet"), pf = sh && sh.querySelector(".tk-perf"); if (pf) sh.style.setProperty("--n", pf.offsetTop + 1 + "px"); });
    if (showKm) { const kmEl = $("kmNum"); odoNow(kmEl, 0); requestAnimationFrame(() => odoSet(kmEl, Math.round(km), { ms: 1100, delay: 560 })); }
    const totEl = $("totNum"); odoNow(totEl, 0); requestAnimationFrame(() => odoSet(totEl, total, { ms: 1100, delay: 700, tick: total > 0 }));
    $("nextBtn").onclick = () => { last ? finishLevel() : (S.qi++, nextQuestion()); };

    $("factText").textContent = o.clue ? `${A.t("res.was")}: ${A.tx(o.answer)}${A.tx(o.fact) ? " — " + A.tx(o.fact) : ""}` : A.tx(o.fact);
    $("plate").classList.remove("hurry");
    updateHud();
  }

  /* ------------------------------------------------------------ veredictos */
  function verdict({ kind, level, title, text, stats, stamp, stampSub, iq, tierName, buttons }) {
    const idc = iq != null ? `<div class="idcard"><svg><use href="#rose"/></svg><span>${A.t("iq.label")}</span><span class="odo" id="iqNum"></span><em>${tierName}</em></div>` : "";
    dialog(`<div class="vd">
      <div class="v-main">
        <span class="tag">${A.t("v.level", { n: pad2(level) })}</span>
        <h2>${title}</h2><p>${text}</p>
        <div class="v-stats">${stats.map((s, i) => `<div><span>${s[0]}</span><span class="odo" id="vs${i}"></span></div>`).join("")}</div>
        <div class="v-actions">${buttons.map(b => `<button class="${b.cls}" id="${b.id}" ${b.primary ? "data-primary" : ""}><span>${b.label}</span>${b.arrow ? '<span class="ar">→</span>' : ""}</button>`).join("")}</div>
      </div>
      <div class="v-side"><div class="stamp ${kind}"><div>${stamp}<b>${stampSub}</b></div></div>${idc}</div>
    </div>`, "verdict");
    stats.forEach((s, i) => { const el = $("vs" + i); odoNow(el, 0); requestAnimationFrame(() => odoSet(el, s[1], { ms: 1300, delay: 700 + i * 120, tick: i === 0 && s[1] > 0 })); });
    if (iq != null) { const el = $("iqNum"); odoNow(el, 0); requestAnimationFrame(() => odoSet(el, iq, { ms: 1400, delay: 1000 })); }
    buttons.forEach(b => ($(b.id).onclick = b.onclick));
  }

  function finishLevel() {
    const L = lv(), pass = S.levelScore >= L.advance, p = prog(S.camp.id);
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
    if (win) { A.sfx.stamp(); setTimeout(A.sfx.victory, 380); }
    const btns = [];
    if (!win) btns.push({ id: "retryBtn", cls: "btn-ink", label: A.t("btn.retry"), arrow: true, primary: true, onclick: () => startLevel_(S.level) });
    btns.push({ id: "newBtn", cls: win ? "btn-ink" : "btn-line", label: A.t("btn.newGame"), primary: win, onclick: () => { S.startLevel = 0; showTitle(); } });
    btns.push({ id: "shareBtn", cls: "btn-line", label: A.t("share"), onclick: async () => {
      const text = A.t("share.text", { iq, tier: tierName, s: A.fmt(shown) }), url = location.href.split("#")[0];
      try {
        if (navigator.share) await navigator.share({ title: "Atlas IQ", text, url });
        else { await navigator.clipboard.writeText(text + " " + url); const sp = $("shareBtn").querySelector("span"); sp.textContent = A.t("share.copied"); setTimeout(() => (sp.textContent = A.t("share")), 1600); }
      } catch (e) { /* cancelado */ }
    } });
    btns.push({ id: "badgeBtn", cls: "btn-line", label: A.t("btn.badge"), onclick: () => {
      const cv = A.makeBadge(iq, tierName, `${A.tx(S.camp.title)} · ${A.fmt(shown)} ${A.t("pts")} · ${S.completed}/${S.camp.levels.length}`);
      const a = document.createElement("a"); a.download = `atlas-iq-${iq}.png`; a.href = cv.toDataURL("image/png"); a.click();
    } });
    verdict({
      kind: win ? "win" : "", level: S.level + 1, title: win ? A.t("v.win") : A.t("v.no"),
      text: win ? A.t("win.p", { s: A.fmt(shown) }) : A.t("lf.p", { a: A.fmt(L.advance), s: A.fmt(S.levelScore) }),
      stats: win ? [[A.t("v.total"), shown]] : [[A.t("v.points"), S.levelScore], [A.t("v.goal"), L.advance]],
      stamp: win ? A.t("stamp.win") : A.t("stamp.no"), stampSub: win ? "★" : pad2(S.level + 1), iq, tierName, buttons: btns,
    });
  }

  /* ------------------------------------------------------------ pausa y reloj */
  function togglePause() {
    if (S.phase !== "asking") return;
    S.paused = !S.paused; A.sfx.pause(); A.music.muffle(S.paused);
    if (S.paused) {
      S.pauseAt = performance.now(); map.setPick(false);
      $("veil").classList.remove("hidden");
      $("veil").innerHTML = `<div><h2>${A.t("pause.h")}</h2><p>${A.t("pause.p")}</p><button class="btn-ink" id="resBtn" data-primary><span>${A.t("btn.resume")}</span><span class="ar">→</span></button></div>`;
      $("resBtn").onclick = togglePause; $("resBtn").focus();
    } else { S.pausedAcc += performance.now() - S.pauseAt; map.setPick(true); $("veil").classList.add("hidden"); }
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
    if (document.fullscreenElement) document.exitFullscreen();
    else (document.documentElement.requestFullscreen || (() => {})).call(document.documentElement);
  }
  $("fsBtn").onclick = toggleFs;
  document.addEventListener("fullscreenchange", () => $("fsBtn").classList.toggle("on", !!document.fullscreenElement));

  document.addEventListener("pointerdown", e => {
    A.audio.unlock(!S.booting);
    if (e.target.closest && e.target.closest(".go, .camp, .btn-ink, .btn-line, .lv, #dock button, #rail button, .seg button, .menu-gear")) A.sfx.ui();
  }, true);

  addEventListener("keydown", e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target && e.target.tagName === "INPUT") { if (e.key === "Escape") openSettings(false); return; }
    A.audio.unlock(!S.booting);
    if (S.booting) return;
    const k = e.key.toLowerCase();
    if (k === "escape") openSettings(false);
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
      const b = document.querySelector("#layer:not(.hidden) [data-primary]") || document.querySelector("#veil:not(.hidden) [data-primary]");
      if (b && document.activeElement !== b) { e.preventDefault(); b.click(); }
    }
  });

  /* ------------------------------------------------------------ entrada + intro del estudio */
  function requestFs() { const el = document.documentElement; try { (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el); } catch (e) { /* denegado */ } }
  function buildStudioBits() {
    const ticks = document.querySelector(".d-ticks");
    if (!ticks.children.length) for (let i = 0; i < 36; i++) {
      const a = (i * 10 * Math.PI) / 180, r1 = 66, r2 = i % 3 === 0 ? 75 : 70, l = document.createElementNS("http://www.w3.org/2000/svg", "line");
      l.setAttribute("x1", Math.sin(a) * r1); l.setAttribute("y1", -Math.cos(a) * r1); l.setAttribute("x2", Math.sin(a) * r2); l.setAttribute("y2", -Math.cos(a) * r2); ticks.appendChild(l);
    }
    const sp = $("stSparks"); sp.innerHTML = ""; const cols = ["#f7b4ff", "#ffd98a", "#ffffff", "#d9a8ff"];
    for (let i = 0; i < 34; i++) {
      const el = document.createElement("i"), ang = Math.random() * Math.PI * 2, dist = 120 + Math.random() * Math.min(innerWidth, innerHeight) * 0.45;
      el.style.setProperty("--x", Math.cos(ang) * dist + "px"); el.style.setProperty("--y", Math.sin(ang) * dist * 0.75 + "px");
      el.style.setProperty("--s", 5 + Math.random() * 9 + "px"); el.style.setProperty("--c", cols[i % cols.length]); el.style.setProperty("--d", 1.35 + Math.random() * 0.6 + "s"); sp.appendChild(el);
    }
  }
  function playStudio(done) {
    const st = $("studio"); st.classList.remove("hidden"); $("stLogo").innerHTML = ""; A.buildLogo($("stLogo"), { animated: true }); buildStudioBits();
    A.sfx.vault(); st.classList.add("shake");
    let ended = false;
    const end = fast => { if (ended) return; ended = true; st.classList.add("leave"); setTimeout(done, fast ? 320 : 540); };
    const timer = A._holdStudio ? 0 : setTimeout(() => end(false), S.reduce ? 1800 : 4700);
    const skip = () => { clearTimeout(timer); end(true); };
    st.addEventListener("pointerdown", skip, { once: true });
    addEventListener("keydown", function k(e) { if (["Enter", " ", "Escape"].includes(e.key)) { skip(); removeEventListener("keydown", k); } });
  }
  function finishBoot() {
    S.booting = false; const boot = $("boot"); boot.classList.add("out"); setTimeout(() => boot.classList.add("hidden"), 850);
    A.audio.unlock(true); showTitle();
  }
  function runBoot() {
    const boot = $("boot"), gate = $("gate"); boot.classList.remove("hidden"); A.buildLogo($("gateLogo"));
    langChips($("gateLangs"), setLang);
    const fsBtn = $("gateFs"); fsBtn.setAttribute("aria-checked", S.fsGate);
    fsBtn.onclick = e => { e.stopPropagation(); S.fsGate = !S.fsGate; fsBtn.setAttribute("aria-checked", S.fsGate); save(); };
    let entered = false;
    const enter = () => {
      if (entered) return; entered = true; A.audio.unlock(false); if (S.fsGate) requestFs();
      gate.classList.add("hidden"); if (S.intro) playStudio(finishBoot); else finishBoot();
    };
    gate.addEventListener("pointerdown", e => { if (e.target.closest(".gate-opts")) return; enter(); });
    addEventListener("keydown", function k(e) { if (entered) { removeEventListener("keydown", k); return; } if (e.key === "Enter" || e.key === " ") { e.preventDefault(); enter(); } });
    (A._debug = A._debug || {}).enterBoot = enter;
  }

  applyLang(); syncSettings();
  const start = () => { if (/[?&]skipboot/.test(location.search)) { S.booting = false; showTitle(); } else runBoot(); };
  if (document.fonts && document.fonts.load) Promise.race([Promise.all([document.fonts.load("800 40px Fraunces"), document.fonts.load("500 12px 'DM Mono'"), document.fonts.load("500 16px 'Bricolage Grotesque'")]), new Promise(r => setTimeout(r, 1200))]).then(start, start);
  else start();

  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register("sw.js").catch(() => {});

  A._debug = Object.assign(A._debug || {}, { S, map, world, reveal, startLevel_, showTitle, odoSet, setLang, finishBoot, playStudio });
})(window.AIQ);
