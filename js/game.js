/* Atlas IQ - logica del juego, campañas y pantallas. */
(function (A) {
  const $ = id => document.getElementById(id);
  const KEY = "atlasiq.v2";

  /* ------------------------------------------------------------ estado y persistencia */
  const S = {
    mode: "classic", campId: null, camp: null, level: 0, qs: [], qi: 0, levelScore: 0, runTotal: 0, runMax: 0, completed: 0, streak: 0,
    phase: "title", limit: 10, t0: 0, pausedAcc: 0, pauseAt: 0, paused: false, lastTick: -1, tense: false, startLevel: 0, prog: {},
  };
  const prog = id => (S.prog[id] = S.prog[id] || { unlocked: 1, best: 0, bestIq: 0 });
  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) || "{}");
      A.lang = d.lang || ((navigator.language || "es").toLowerCase().startsWith("es") ? "es" : "en");
      A.audio.sfxOn = d.sfx !== false; A.audio.musicOn = d.music !== false;
      S.prog = d.prog || {}; S.mode = d.mode || "classic"; S.campId = d.campId || null;
    } catch (e) { A.lang = "es"; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ lang: A.lang, sfx: A.audio.sfxOn, music: A.audio.musicOn, prog: S.prog, mode: S.mode, campId: S.campId })); } catch (e) { /* sin almacenamiento */ }
  }

  const lv = () => S.camp.levels[S.level];
  const q = () => S.qs[S.qi];
  const pad2 = n => String(n).padStart(2, "0");
  const fmtKm = d => (d < 10 ? d.toFixed(1) : A.fmt(d)) + " km";

  /* ------------------------------------------------------------ arranque */
  load();
  const world = A.geo.buildWorld();
  const map = new A.MapView($("map"), world, onPick);
  map.animateTo(map.home(), 0);

  /* ------------------------------------------------------------ utilidades de interfaz */
  function odo(el, to, ms = 650) {
    const from = +el.dataset.v || 0; el.dataset.v = to; cancelAnimationFrame(el._raf);
    if (from === to) { el.textContent = A.fmt(to); return; }
    const t0 = performance.now();
    (function step(now) {
      const k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      el.textContent = A.fmt(from + (to - from) * e);
      if (k < 1) el._raf = requestAnimationFrame(step);
    })(t0);
  }
  /* cuenta hacia un valor y, si se pide, hace sonar el "contador" */
  function countUp(el, to, { ms = 800, delay = 0, tick = false, dec = 0 } = {}) {
    el.textContent = dec ? (0).toFixed(dec) : "0";
    setTimeout(() => {
      const t0 = performance.now(); let last = -1;
      (function step(now) {
        const k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3);
        el.textContent = dec ? (to * e).toFixed(dec) : A.fmt(to * e);
        const bin = Math.floor(k * 14);
        if (tick && bin !== last && k < 1) { last = bin; A.sfx.count(k); }
        if (k < 1) requestAnimationFrame(step); else if (tick) A.sfx.countEnd();
      })(t0);
    }, delay);
  }
  function dialog(html, cls) {
    const d = $("dlg"); d.className = cls; d.innerHTML = html;
    $("layer").classList.remove("hidden");
    requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add("in")));
    const b = d.querySelector("[data-primary]"); if (b) setTimeout(() => b.focus({ preventScroll: true }), 60);
  }
  function closeDialog() { $("layer").classList.add("hidden"); $("dlg").classList.remove("in"); }

  /* ------------------------------------------------------------ HUD */
  function applyLang() {
    document.documentElement.lang = A.lang;
    document.querySelectorAll("[data-i]").forEach(el => (el.textContent = A.t(el.dataset.i)));
    document.querySelectorAll("[data-tip]").forEach(el => (el.title = A.t(el.dataset.tip)));
    $("langBtn").textContent = A.lang.toUpperCase();
    $("sndBtn").classList.toggle("off", !A.audio.sfxOn); $("musBtn").classList.toggle("off", !A.audio.musicOn);
    if (S.camp) updateHud();
    if (S.phase === "asking") setPrompt();
  }
  function levelTitle(L) { return A.tx(L.name) + (L.diff ? " · " + A.t("diff." + L.diff) : ""); }
  function updateHud() {
    const L = lv();
    $("lvlText").textContent = A.t("lvl", { n: S.level + 1, m: S.camp.levels.length, name: levelTitle(L) });
    odo($("scLevel"), S.levelScore); odo($("scTotal"), S.runTotal + S.levelScore);
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
    $("timeFill").style.transform = `scaleX(${f})`; $("plate").classList.toggle("hurry", f < 0.3 && left > 0);
    $("timeTxt").textContent = Math.max(0, left).toFixed(1);
  }
  function setStreak() {
    const c = $("streakChip");
    if (S.streak >= 2) { c.textContent = A.t("streak", { n: S.streak }); c.classList.remove("hidden", "pop"); void c.offsetWidth; c.classList.add("pop"); }
    else c.classList.add("hidden");
  }
  function chrome(on) { for (const id of ["ledger", "note"]) $(id).classList.toggle("hidden", !on); }

  /* ------------------------------------------------------------ menu principal */
  function showTitle() {
    S.phase = "title"; S.camp = null; map.setPick(false); map.clearMarks(); map.setHome({ lat: 0, lon: 0, zoom: 1 });
    $("plate").classList.add("hidden"); $("pauseBtn").classList.add("hidden"); $("veil").classList.add("hidden"); $("intro").classList.add("hidden");
    chrome(false); $("factText").textContent = ""; A.music.mode(0); map.startDrift();
    renderMenu();
  }
  function renderMenu() {
    const camps = A.CAMPAIGNS.filter(c => c.mode === S.mode);
    if (!camps.find(c => c.id === S.campId)) { S.campId = camps[0].id; S.startLevel = 0; }
    const cur = camps.find(c => c.id === S.campId), pr = prog(cur.id);
    S.startLevel = Math.min(S.startLevel, pr.unlocked - 1);
    const list = camps.map((c, i) => {
      const p = prog(c.id);
      return `<button class="camp${c.id === S.campId ? " sel" : ""}" data-id="${c.id}" style="animation-delay:${i * 45}ms">
        <span class="camp-t">${A.tx(c.title)}</span><span class="camp-d">${A.tx(c.blurb)}</span>
        <span class="camp-m">${A.t("camp.levels", { n: c.levels.length })} · ${p.best ? A.t("camp.best", { s: A.fmt(p.best) }) : A.t("camp.new")}</span></button>`;
    }).join("");
    let picker = "";
    if (pr.unlocked > 1) {
      for (let i = 0; i < cur.levels.length; i++) picker += `<button class="lv${i === S.startLevel ? " sel" : ""}" data-lv="${i}" ${i >= pr.unlocked ? "disabled" : ""}>${i + 1}</button>`;
      picker = `<div class="picker"><span>${A.t("title.from")}</span><div>${picker}</div></div>`;
    }
    dialog(`<div class="menu-in">
      <svg class="menu-rose"><use href="#rose"/></svg>
      <h1>Atlas<em>IQ</em></h1>
      <p class="tagline">${A.t("title.tag")}</p>
      <p class="lede">${A.t("title.p")}</p>
      <div class="tabs"><button class="tab${S.mode === "classic" ? " sel" : ""}" data-mode="classic">${A.t("mode.classic")}</button><button class="tab${S.mode === "extended" ? " sel" : ""}" data-mode="extended">${A.t("mode.extended")}</button></div>
      <p class="mode-d">${A.t("mode." + S.mode + ".d")}${S.mode === "classic" && A.t("mode.classic.note") ? `<small>${A.t("mode.classic.note")}</small>` : ""}</p>
      <div class="camps">${list}</div>${picker}
      <button class="btn primary big" id="goBtn" data-primary>${A.t("btn.start")} →</button>
      <p class="menu-foot">Atlas IQ · v${A.VERSION}</p>
    </div>`, "menu");
    $("goBtn").onclick = () => newRun();
    document.querySelectorAll(".tab").forEach(b => (b.onclick = () => { S.mode = b.dataset.mode; S.startLevel = 0; save(); renderMenu(); }));
    document.querySelectorAll(".camp").forEach(b => (b.onclick = () => { S.campId = b.dataset.id; S.startLevel = 0; save(); renderMenu(); }));
    document.querySelectorAll(".lv").forEach(b => (b.onclick = () => { S.startLevel = +b.dataset.lv; renderMenu(); }));
  }

  /* ------------------------------------------------------------ partida */
  function newRun() {
    S.camp = A.CAMPAIGNS.find(c => c.id === S.campId);
    S.runTotal = 0; S.runMax = 0; S.completed = 0; save();
    map.setHome(S.camp.home);
    A.audio.unlock(); A.sfx.start(); A.music.mode(1);
    startLevel_(S.startLevel);
  }
  function startLevel_(idx) {
    S.level = idx; S.qs = lv().questions(); S.qi = 0; S.levelScore = 0; S.streak = 0; S.phase = "intro";
    closeDialog(); $("plate").classList.add("hidden"); $("pauseBtn").classList.add("hidden"); $("streakChip").classList.add("hidden");
    chrome(true); $("factText").textContent = ""; updateHud();
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
    S.phase = "asking"; S.paused = false; S.tense = false; S.limit = lv().seconds; S.t0 = performance.now(); S.pausedAcc = 0; S.lastTick = -1;
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
    const bonus = S.camp.mode === "extended" && S.streak >= 2 ? Math.round((sc.dist + sc.time) * 0.05 * (Math.min(S.streak, 6) - 1)) : 0;
    const total = sc.dist + sc.time + bonus;
    S.levelScore += total; S.runMax += L.maxPerQ;

    const label = o.clue ? A.tx(o.answer) : A.tx(o.name);
    map.setMarks({
      guess: guess ? [guess.lon, guess.lat] : null, answer: ans, highlight: isC ? o.key : null, label, labelAt,
      dist: guess && km > 0 ? fmtKm(km) : "", pop: total ? "+" + A.fmt(total) : null,
    });
    map.fitPoints(guess ? [...span, [guess.lon, guess.lat]] : span, padForDialog(), 1100);

    // resultado: titulo y sonido segun cercania
    const tier = !guess ? 5 : isC && km === 0 ? 4 : ratio >= 0.96 ? 4 : ratio >= 0.75 ? 3 : ratio >= 0.4 ? 2 : ratio >= 0.05 ? 1 : 0;
    const title = !guess ? A.t("res.timeout") : isC && km === 0 ? A.t("res.inside") : A.t(["res.t5", "res.t4", "res.t3", "res.t2", "res.t1"][tier]);
    setTimeout(() => A.sfx.reveal(tier), 480);
    if (S.streak >= 2) setTimeout(() => { A.sfx.streak(S.streak); setStreak(); }, 1500); else setStreak();

    const last = S.qi === S.qs.length - 1;
    const place = o.answer ? A.tx(o.answer) : A.tx(o.name) + (A.tx(o.sub) ? ", " + A.tx(o.sub) : "");
    const from = !guess ? "" : isC ? A.t("res.border", { name: A.tx(o.name) }) : o.clue ? "" : A.t("res.from", { name: place });
    dialog(`<div class="sheet ticket">
      <div class="tk-head"><span>${A.t("ask.no", { n: pad2(S.qi + 1), m: pad2(S.qs.length) })}</span><span class="tag">${A.t("kind." + (o.clue ? "clue" : L.kind))}</span></div>
      <div class="tk-title">${title}</div>
      ${guess && !(isC && km === 0) ? `<div class="tk-km"><b id="kmNum">0</b><span>km</span></div>` : ""}
      <div class="tk-from">${[from, guess ? A.t("res.clicked", { t: (S.limit - left).toFixed(1) }) : ""].filter(Boolean).join(" · ")}</div>
      ${o.clue ? `<div class="tk-answer"><span>${A.t("res.was")}</span>${A.tx(o.answer)}</div>` : ""}
      <div class="tk-perf"></div>
      <dl class="tk-rows">
        <div><dt>${A.t("res.dist")}</dt><i></i><dd>+${A.fmt(sc.dist)}</dd></div>
        <div><dt>${A.t("res.speed")}</dt><i></i><dd>+${A.fmt(sc.time)}</dd></div>
        ${bonus ? `<div class="bonus"><dt>${A.t("res.streak")} ×${S.streak}</dt><i></i><dd>+${A.fmt(bonus)}</dd></div>` : ""}
      </dl>
      <div class="tk-total"><span>${A.t("res.total")}</span><b id="totNum">0</b></div>
      <button class="btn primary" id="nextBtn" data-primary>${last ? A.t("btn.finish") : A.t("btn.next")} <kbd>↵</kbd></button>
    </div>`, "side");
    requestAnimationFrame(() => { const sh = document.querySelector("#dlg .sheet"), pf = sh && sh.querySelector(".tk-perf"); if (pf) sh.style.setProperty("--n", pf.offsetTop + 1 + "px"); });
    if (guess && !(isC && km === 0)) countUp($("kmNum"), km, { ms: 900, delay: 560, dec: km < 10 ? 1 : 0 });
    countUp($("totNum"), total, { ms: 900, delay: 700, tick: total > 0 });
    $("nextBtn").onclick = () => { last ? finishLevel() : (S.qi++, nextQuestion()); };

    $("factText").textContent = o.clue ? `${A.t("res.was")}: ${A.tx(o.answer)}${A.tx(o.fact) ? " — " + A.tx(o.fact) : ""}` : A.tx(o.fact);
    $("plate").classList.remove("hurry");
    updateHud();
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
      dialog(`<div class="sheet card shake">
        <div class="stamp ok"><div>${A.t("stamp.ok")}<b>${pad2(S.level + 1)}</b></div></div>
        <h2>${A.tx(L.name)}</h2>
        <p>${A.t("lc.p", { s: A.fmt(S.levelScore), a: A.fmt(L.advance) })}</p>
        <div class="stats"><div><b>${A.fmt(S.runTotal)}</b><span>${A.t("score.total")}</span></div><div><b>${iq}</b><span>IQ</span></div></div>
        <button class="btn primary big" id="nlBtn" data-primary>${A.t("btn.nextLevel")} →</button></div>`, "center");
      $("nlBtn").onclick = () => startLevel_(S.level + 1);
    } else { A.sfx.stamp(); setTimeout(A.sfx.fail, 380); endScreen(false, iq); }
  }

  function endScreen(win, iq) {
    const L = lv(), tier = A.iqTier(iq), tierName = A.t("tier." + tier);
    const shown = win ? S.runTotal : S.runTotal + S.levelScore;
    if (win) { A.sfx.stamp(); setTimeout(A.sfx.victory, 380); }
    dialog(`<div class="sheet card shake">
      <div class="stamp ${win ? "win" : ""}"><div>${win ? A.t("stamp.win") : A.t("stamp.no")}<b>${win ? "★" : pad2(S.level + 1)}</b></div></div>
      <h2>${win ? A.tx(S.camp.title) : A.tx(L.name)}</h2>
      <p>${win ? A.t("win.p", { s: A.fmt(shown) }) : A.t("lf.p", { a: A.fmt(L.advance), s: A.fmt(S.levelScore) })}</p>
      <div class="idcard"><svg><use href="#rose"/></svg><span>${A.t("iq.label")}</span><b>${iq}</b><em>${tierName}</em></div>
      <div class="buttons">
        ${win ? "" : `<button class="btn primary" id="retryBtn" data-primary>${A.t("btn.retry")}</button>`}
        <button class="btn ${win ? "primary" : "ghost"}" id="newBtn" ${win ? "data-primary" : ""}>${A.t("btn.newGame")}</button>
        <button class="btn ghost" id="badgeBtn">${A.t("btn.badge")}</button>
      </div></div>`, "center");
    if (!win) $("retryBtn").onclick = () => startLevel_(S.level);
    $("newBtn").onclick = () => { S.startLevel = 0; showTitle(); };
    $("badgeBtn").onclick = () => {
      const cv = A.makeBadge(iq, tierName, `${A.tx(S.camp.title)} · ${A.fmt(shown)} ${A.t("pts")} · ${S.completed}/${S.camp.levels.length}`);
      const a = document.createElement("a"); a.download = `atlas-iq-${iq}.png`; a.href = cv.toDataURL("image/png"); a.click();
    };
  }

  /* ------------------------------------------------------------ pausa y reloj */
  function togglePause() {
    if (S.phase !== "asking") return;
    S.paused = !S.paused; A.sfx.pause(); A.music.muffle(S.paused);
    if (S.paused) {
      S.pauseAt = performance.now(); map.setPick(false);
      $("veil").classList.remove("hidden");
      $("veil").innerHTML = `<div><h2>${A.t("pause.h")}</h2><p>${A.t("pause.p")}</p><button class="btn primary" id="resBtn" data-primary>${A.t("btn.resume")}</button></div>`;
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
  $("langBtn").onclick = () => {
    A.lang = A.lang === "es" ? "en" : "es"; save(); applyLang();
    if (S.phase === "title") renderMenu();
    else if (S.phase === "asking" || S.phase === "reveal") { setPrompt(); if (S.phase === "reveal") { const o = q(); $("factText").textContent = o.clue ? `${A.t("res.was")}: ${A.tx(o.answer)}` : A.tx(o.fact); } }
    if (S.camp) updateHud();
  };
  $("sndBtn").onclick = () => { A.audio.sfxOn = !A.audio.sfxOn; save(); applyLang(); A.sfx.ui(); };
  $("musBtn").onclick = () => { A.audio.setMusic(!A.audio.musicOn); if (A.audio.musicOn) A.audio.unlock(); save(); applyLang(); };
  function toggleFs() {
    if (document.fullscreenElement) document.exitFullscreen();
    else (document.documentElement.requestFullscreen || (() => {})).call(document.documentElement);
  }
  $("fsBtn").onclick = toggleFs;
  document.addEventListener("fullscreenchange", () => $("fsBtn").classList.toggle("on", !!document.fullscreenElement));

  /* sonido de interfaz + desbloqueo del audio en el primer gesto */
  document.addEventListener("pointerdown", e => {
    A.audio.unlock();
    if (e.target.closest && e.target.closest(".btn, #dock button, .camp, .tab, .lv")) A.sfx.ui();
  }, true);

  addEventListener("keydown", e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    A.audio.unlock();
    const k = e.key.toLowerCase();
    if (k === "f") toggleFs();
    else if (k === "m") $("sndBtn").click();
    else if (k === "n") $("musBtn").click();
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

  applyLang();
  const boot = () => showTitle();
  if (document.fonts && document.fonts.load) Promise.race([Promise.all([document.fonts.load("800 40px Fraunces"), document.fonts.load("500 12px 'DM Mono'"), document.fonts.load("500 16px 'Bricolage Grotesque'")]), new Promise(r => setTimeout(r, 1200))]).then(boot, boot);
  else boot();

  A._debug = { S, map, world, reveal, startLevel_, showTitle };
})(window.AIQ);
