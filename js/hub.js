/*
 * Atlas IQ - pantalla principal (v0.6): elige modo (Aventura, Clasico, Competitivo, Extendido), Enciclopedia y Perfil.
 * Se apoya en A.core (lo publica game.js).
 */
window.AIQ = window.AIQ || {};
(function (A) {
  const T = A.T, $ = id => document.getElementById(id), C = () => A.core;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ICO = { adventure: "m_adv", classic: "m_classic", compete: "m_compete", extended: "m_ext", profile: "m_prof" };
  const BOOK = () => A.icon("m_codex");
  const tools = () => `<div class="menu-tools">
      <button class="menu-gear" id="menuCodex" aria-label="${A.t("tip.codex")}" data-tip="tip.codex" data-key="C">${A.icon("m_codex")}</button>
      <button class="menu-gear" id="menuSkin" aria-label="${A.t("tip.skin")}" data-tip="tip.skin">${A.icon("u_skin")}</button>
      <button class="menu-gear txt" id="menuLang" aria-label="${A.t("tip.lang")}" data-tip="tip.lang">${A.lang.toUpperCase()}</button>
      <button class="menu-gear" id="menuFs" aria-label="${A.t("tip.fs")}" data-tip="tip.fs" data-key="F">${A.icon("u_fs")}</button>
      <button class="menu-gear" id="menuGear" aria-label="${A.t("tip.set")}" data-tip="tip.set">${A.icon("u_set")}</button></div>`;
  const wireTools = () => {
    const c = C();
    $("menuGear").onclick = () => c.openSettings(!c.S.settingsOpen); $("menuCodex").onclick = () => A.codex.open();
    $("menuSkin").onclick = c.cycleSkin; $("menuLang").onclick = e => c.openLangPop(e.currentTarget); $("menuFs").onclick = c.toggleFs;
  };
  const top = (back) => `<div class="menu-top">${back ? `<button class="hub-back" id="hubBack">${A.icon("u_back", "sm")}${T("Menú", "Menu")}</button>` : `<svg class="menu-rose"><use href="#rose"/></svg>`}${tools()}</div>`;
  const shell = (inner, back) => `<div class="menu-in hub">${top(back)}${inner}<p class="menu-foot">Atlas IQ · v${A.VERSION}</p></div>`;

  /* ------------------------------------------------------------------ pantalla principal */
  function home() {
    const c = C(), P = A.profile.get(), adv = P.adv, today = A.rank.boards.daily(), done = P.daily[today];
    const saved = A.adv.hasSave();
    const card = (id, cls, title, desc, meta, badge) => `<button class="cut mode-card ${cls}" data-mode="${id}">${cls === "hero" ? `<i class="marq"></i><span class="mc-art">${A.pic("hub_hero", "", "act_0")}</span>` : ""}<span class="mc-ic">${A.icon(ICO[id])}</span><span class="mc-body"><span class="mc-t">${title}${badge ? `<em>${badge}</em>` : ""}</span><span class="mc-d">${desc}</span><span class="mc-m">${meta}</span></span><span class="mc-ar">${A.icon("u_next", "sm")}</span></button>`;
    c.dialog(shell(`
      <h1>Atlas<em>IQ</em></h1><p class="tagline">${A.t("title.tag")}</p>
      <div class="modes">
        ${card("adventure", "hero", T("Aventura", "Adventure"), T("Roguelike: cada partida es distinta. Reliquias, tienda de doblones, herramientas y jefes.", "Roguelike: every run is different. Relics, a doubloon shop, tools and bosses."), saved ? T("▶ Expedición en curso", "▶ Expedition in progress") : adv.bestScore ? T("Récord ", "Best ") + A.fmt(adv.bestScore) : T("Nueva", "New"), T("Modo principal", "Main mode"))}
        ${card("classic", "", T("Clásico", "Classic"), T("Las preguntas y la puntuación exactas del juego original: seis partidas.", "The original game's exact questions and scoring: six campaigns."), T("Pulido y sin trampas", "Untouched"))}
        ${card("compete", "", T("Competitivo", "Competitive"), T("Reto diario con la misma semilla para todos y clasificaciones.", "A daily challenge with a shared seed, plus leaderboards."), done ? T("Hoy: ", "Today: ") + A.fmt(done.score) : T("Reto de hoy pendiente", "Today's challenge is waiting"))}
        ${card("extended", "", T("Extendido", "Extended"), T("Vuelta al mundo Atlas, Historia y pistas: contenido nuevo con fichas × mult.", "Atlas World Tour, History & Clues: new content with chips × mult."), "")}
      </div>
      <div class="hub-row">
        <button class="cut cx-strip" id="codexBtn" type="button"><span class="cx-strip-ic">${BOOK()}</span><span class="cx-strip-t"><b>${A.t("codex.title")}</b><i>${T("Se desbloquea acertando a menos de 100 km", "Unlocked by landing within 100 km")}</i></span><span class="cx-strip-n">${A.codexStats().u}<em>/${A.codexStats().t}</em></span></button>
        <button class="cut cx-strip prof" id="profBtn" type="button"><span class="cx-strip-ic">${A.icon("m_prof")}</span><span class="cx-strip-t"><b>${T("Perfil", "Profile")}</b><i>${A.ach.count()}/${A.ach.total()} ${T("logros", "achievements")}</i></span></button>
      </div>`, false), "menu");
    wireTools(); $("codexBtn").onclick = () => A.codex.open(); $("profBtn").onclick = () => screen("profile");
    document.querySelectorAll(".mode-card").forEach(b => (b.onclick = () => { A.sfx.card(); screen(b.dataset.mode); }));
  }

  /* ------------------------------------------------------------------ Clasico / Extendido: lista de campanas */
  function campaigns(mode) {
    const c = C(), S = c.S; S.mode = mode; const camps = A.CAMPAIGNS.filter(x => x.mode === mode);
    if (!camps.find(x => x.id === S.campId)) { S.campId = camps[0].id; S.startLevel = 0; }
    const cur = camps.find(x => x.id === S.campId), pr = c.prog(cur.id); S.startLevel = Math.min(S.startLevel, pr.unlocked - 1);
    const list = camps.map((x, i) => {
      const p = c.prog(x.id), ticks = x.levels.map((_, k) => `<i class="${p.best && k < p.unlocked ? "on" : ""}"></i>`).join(""), md = A.profile.get().medals[x.id];
      return `<button class="cut camp${x.id === S.campId ? " sel" : ""}" data-id="${x.id}" style="animation-delay:${i * 45}ms"><canvas class="camp-thumb" aria-hidden="true"></canvas>
        <span class="camp-body"><span class="camp-t">${A.tx(x.title)}${md ? ` ${A.icon("medal_" + md, "sm")}` : ""}</span><span class="camp-d">${A.tx(x.blurb)}</span>
        <span class="camp-m"><span class="camp-p">${ticks}</span><span>${p.best ? A.t("camp.best", { s: A.fmt(p.best) }) : A.t("camp.new")}</span></span></span></button>`;
    }).join("");
    let picker = "";
    if (pr.unlocked > 1) { for (let i = 0; i < cur.levels.length; i++) picker += `<button class="lv${i === S.startLevel ? " sel" : ""}" data-lv="${i}" ${i >= pr.unlocked ? "disabled" : ""}>${i + 1}</button>`; picker = `<div class="picker"><span>${A.t("title.from")}</span><div class="lrail">${picker}</div></div>`; }
    c.dialog(shell(`<h2 class="hub-h">${mode === "classic" ? T("Clásico", "Classic") : T("Extendido", "Extended")}</h2>
      <p class="mode-d">${A.t("mode." + mode + ".d")}${mode === "classic" && A.t("mode.classic.note") ? `<small>${A.t("mode.classic.note")}</small>` : ""}</p>
      <div class="camps">${list}</div>${picker}
      <button class="cut go" id="goBtn" data-primary><span class="go-dial"><svg><use href="#rose"/></svg></span><span class="go-txt"><b>${A.t("go.label")}</b><i>${A.t("go.sub", { n: S.startLevel + 1, name: A.tx(cur.title) })}</i></span><span class="go-ar">→</span></button>`, true), "menu");
    wireTools(); $("hubBack").onclick = () => screen("home");
    document.querySelectorAll(".camp").forEach(b => (b.onclick = () => { S.campId = b.dataset.id; S.startLevel = 0; c.save(); campaigns(mode); }));
    document.querySelectorAll(".lv").forEach(b => (b.onclick = () => { S.startLevel = +b.dataset.lv; campaigns(mode); }));
    $("goBtn").onclick = () => { A.sfx.depart(); S.ranked = null; c.newRun(); };
    requestAnimationFrame(() => document.querySelectorAll(".camp").forEach((b, i) => c.map.drawThumb(b.querySelector("canvas"), camps[i].home)));
    const go = $("goBtn");
    go.addEventListener("pointermove", e => { const r = go.querySelector(".go-dial").getBoundingClientRect(); go.style.setProperty("--rot", (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI + 90 + "deg"); });
    go.addEventListener("pointerleave", () => go.style.setProperty("--rot", "0deg"));
  }

  /* ------------------------------------------------------------------ Aventura */
  let advSel = { deck: "explorer", asc: 0 };
  function adventure() {
    const c = C(), P = A.profile.get(), adv = P.adv, D = A.ADV.DECKS, saved = A.adv.hasSave();
    let runInfo = ""; if (saved) { try { const r = JSON.parse(localStorage.getItem("atlasiq.run.v1")); runInfo = `${T("Acto", "Act")} ${r.act + 1} · ${T("Ronda", "Round")} ${r.round + 1} · ◉ ${r.coins} · ♥ ${r.lives} · ${A.fmt(r.score)} ${T("pts", "pts")}`; } catch (e) { /* sin datos */ } }
    const decks = Object.keys(D).map(id => { const d = D[id], locked = d.unlock && !P.ach[d.unlock], lockTxt = locked ? (A.ACH.find(a => a.id === d.unlock) || { name: T("?", "?") }).name : ""; return `<button class="deck${advSel.deck === id ? " sel" : ""}${locked ? " lock" : ""}" data-deck="${id}" ${locked ? "disabled" : ""}><span class="dk-ic">${locked ? A.icon("lock") : A.icon(d.ico)}</span><b>${A.tx(d.n)}</b><i>${locked ? T("Logro: ", "Achievement: ") + A.tx(lockTxt) : A.tx(d.d)}</i></button>`; }).join("");
    let asc = ""; for (let i = 0; i <= 5; i++) asc += `<button class="asc${advSel.asc === i ? " sel" : ""}" data-asc="${i}" ${i > adv.asc ? "disabled" : ""}>${i}</button>`;
    const ascTxt = [T("Estándar", "Standard"), T("Objetivos +10 %, −1 s", "Targets +10%, −1 s"), T("+20 %, −2 s", "+20%, −2 s"), T("+30 %, −3 s, una provisión menos", "+30%, −3 s, one fewer provision"), T("+40 %, −4 s, jefes dobles", "+40%, −4 s, double bosses"), T("+50 %, −5 s. Solo para leyendas", "+50%, −5 s. Legends only")][advSel.asc];
    c.dialog(shell(`<h2 class="hub-h">${T("Aventura", "Adventure")}</h2>
      <p class="mode-d">${T("Eres un aventurero con un mapa a medio hacer. Cada ronda te pide una puntuación; entre rondas gastas doblones en reliquias y herramientas. Cada acto acaba con un jefe.", "You're an adventurer with a half-drawn map. Each round asks for a score; between rounds you spend doubloons on relics and tools. Every act ends with a boss.")}</p>
      ${saved ? `<div class="cut resume"><span class="tag">${T("Expedición en curso", "Expedition in progress")}</span><b>${runInfo}</b><div><button class="btn-ink" id="contBtn" data-primary><span>${T("Continuar", "Continue")}</span><span class="ar">${A.icon("u_next", "sm")}</span></button><button class="btn-line" id="abandonBtn">${T("Abandonar", "Abandon")}</button></div></div>` : ""}
      <h4 class="hub-sub">${T("Baraja inicial", "Starting deck")}</h4><div class="decks">${decks}</div>
      <h4 class="hub-sub">${T("Ascensión", "Ascension")} <em>${ascTxt}</em></h4><div class="ascs">${asc}</div>
      <div class="adv-stats"><span>${T("Récord", "Best")} <b>${A.fmt(adv.bestScore)}</b></span><span>${T("Mejor ronda", "Best round")} <b>${adv.bestRound}</b></span><span>${T("Victorias", "Wins")} <b>${adv.wins}</b></span><span>${T("Expediciones", "Runs")} <b>${adv.runs}</b></span></div>
      <button class="cut go" id="goBtn" ${saved ? "" : "data-primary"}><span class="go-dial"><svg><use href="#rose"/></svg></span><span class="go-txt"><b>${T("Nueva expedición", "New expedition")}</b><i>${A.tx(D[advSel.deck].n)} · ${T("Ascensión", "Ascension")} ${advSel.asc}</i></span><span class="go-ar">→</span></button>`, true), "menu");
    wireTools(); $("hubBack").onclick = () => screen("home");
    document.querySelectorAll(".deck").forEach(b => (b.onclick = () => { advSel.deck = b.dataset.deck; A.sfx.card(); adventure(); }));
    document.querySelectorAll(".asc").forEach(b => (b.onclick = () => { advSel.asc = +b.dataset.asc; A.sfx.ui(); adventure(); }));
    if (saved) { $("contBtn").onclick = () => { A.sfx.depart(); enterRun(() => A.adv.resume()); }; $("abandonBtn").onclick = () => { A.adv.abandon(); A.sfx.deny(); adventure(); }; }
    $("goBtn").onclick = () => { A.sfx.depart(); if (saved) A.adv.abandon(); enterRun(() => A.adv.begin({ deck: advSel.deck, asc: advSel.asc })); };
  }
  function enterRun(fn) { const c = C(); c.S.ranked = null; c.prepareRun(); fn(); }

  /* ------------------------------------------------------------------ Competitivo */
  let board = null;
  const CLASSIC_BOARDS = () => A.CAMPAIGNS.filter(x => x.mode === "classic").map(x => ({ id: "classic-" + x.id, title: T("Clásico · ", "Classic · ") + A.tx(x.title), camp: x.id }));
  function compete() {
    const c = C(), P = A.profile.get(), day = A.rank.boards.daily(), done = P.daily[day];
    const boards = [{ id: day, title: T("Reto diario", "Daily challenge") }, { id: "adv-all", title: T("Aventura · histórico", "Adventure · all time") }, ...CLASSIC_BOARDS()];
    if (!board || !boards.find(b => b.id === board)) board = day;
    const dstr = String(A.rank.ymd()).replace(/(\d{4})(\d\d)(\d\d)/, "$3/$2/$1");
    c.dialog(shell(`<h2 class="hub-h">${T("Competitivo", "Competitive")}</h2>
      <p class="mode-d">${T("Tus puntos se comparan con los de los demás. Todos juegan el mismo reto diario.", "Your points are compared with everyone else's. Everyone plays the same daily challenge.")}</p>
      <label class="nick"><span>${T("Tu nombre en la clasificación", "Your leaderboard name")}</span><input id="nickIn" maxlength="16" value="${esc(P.name)}" placeholder="${T("Aventurero", "Adventurer")}"></label>
      <div class="cut daily"><span class="tag">${T("Reto diario", "Daily challenge")} · ${dstr}</span><b>${T("Aventura con semilla común", "Adventure with a shared seed")}</b>
        <i>${T("Baraja Explorador, Ascensión 1. Un intento puntúa; después puedes practicar.", "Explorer deck, Ascension 1. One attempt counts; then you can practise.")}</i>
        <div>${done ? `<span class="daily-done">${T("Hoy: ", "Today: ")} <b>${A.fmt(done.score)}</b></span><button class="btn-line" id="dailyGo">${T("Practicar (no puntúa)", "Practise (unranked)")}</button>` : `<button class="btn-ink" id="dailyGo" data-primary><span>${T("Jugar el reto de hoy", "Play today's challenge")}</span><span class="ar">${A.icon("u_next", "sm")}</span></button>`}</div></div>
      <div class="cut daily"><span class="tag">${T("Clásico clasificado", "Ranked Classic")}</span><b>${T("Una campaña original de principio a fin", "An original campaign start to finish")}</b>
        <div class="rk-camps">${A.CAMPAIGNS.filter(x => x.mode === "classic").map(x => `<button class="btn-line" data-rk="${x.id}">${A.tx(x.title)}</button>`).join("")}</div></div>
      <h4 class="hub-sub">${T("Clasificación", "Leaderboard")}</h4>
      <select id="boardSel" class="board-sel">${boards.map(b => `<option value="${b.id}" ${b.id === board ? "selected" : ""}>${b.title}</option>`).join("")}</select>
      <div class="lb" id="lb"><p class="lb-load">…</p></div>`, true), "menu");
    wireTools(); $("hubBack").onclick = () => screen("home");
    $("nickIn").onchange = e => A.profile.setName(e.target.value);
    $("boardSel").onchange = e => { board = e.target.value; loadBoard(); };
    $("dailyGo").onclick = () => { A.profile.setName($("nickIn").value); A.sfx.depart(); enterRun(() => A.adv.begin({ deck: "explorer", asc: 1, seed: day, ranked: !done, board: day })); };
    document.querySelectorAll("[data-rk]").forEach(b => (b.onclick = () => { A.profile.setName($("nickIn").value); A.sfx.depart(); const S = c.S; S.mode = "classic"; S.campId = b.dataset.rk; S.startLevel = 0; S.ranked = b.dataset.rk; c.newRun(); }));
    loadBoard();
  }
  async function loadBoard() {
    const el = $("lb"); if (!el) return; el.innerHTML = `<p class="lb-load">…</p>`; const my = A.profile.get().id, b = board;
    const { global, rows } = await A.rank.top(b, 20); if (b !== board || !$("lb")) return;
    el.innerHTML = `<p class="lb-src">${global ? A.icon("globe", "sm") + T("Clasificación global", "Global leaderboard") : T("Clasificación local (este equipo)", "Local leaderboard (this device)")}</p>` +
      (rows.length ? `<ol>${rows.map((r, i) => `<li class="${r.id === my ? "me" : ""}"><span class="lb-n">${i + 1}</span><span class="lb-name">${esc(r.name || "—")}</span><b>${A.fmt(r.score)}</b></li>`).join("")}</ol>` : `<p class="lb-empty">${T("Aún no hay puntuaciones. ¡Sé el primero!", "No scores yet. Be the first!")}</p>`);
  }

  /* ------------------------------------------------------------------ Perfil y logros */
  function profile() {
    const c = C(), P = A.profile.get(), s = P.stats, avg = s.questions - s.timeouts > 0 ? Math.round(s.km / (s.questions - s.timeouts)) : 0, st = A.codexStats();
    const cell = (l, v) => `<div><span>${l}</span><b>${v}</b></div>`;
    const ach = A.ACH.map(a => { const got = P.ach[a.id]; return `<div class="ach${got ? " got" : ""}" title="${got || !a.secret ? A.tx(a.desc) : "?"}"><span class="ach-i">${got || !a.secret ? A.badge(a.id) : A.icon("lock")}</span><b>${got || !a.secret ? A.tx(a.name) : "???"}</b><i>${got || !a.secret ? A.tx(a.desc) : T("Logro secreto", "Secret achievement")}</i></div>`; }).join("");
    c.dialog(shell(`<h2 class="hub-h">${T("Perfil", "Profile")}</h2>
      <div class="prof-grid">${cell(T("Preguntas", "Questions"), A.fmt(s.questions))}${cell(T("Dianas", "Bullseyes"), A.fmt(s.bulls))}${cell(T("Error medio", "Avg. error"), A.fmt(avg) + " km")}${cell(T("Mejor racha", "Best streak"), s.bestStreak)}${cell(T("Enciclopedia", "Encyclopedia"), st.u + "/" + st.t)}${cell(T("Récord aventura", "Adventure best"), A.fmt(P.adv.bestScore))}</div>
      <h4 class="hub-sub">${T("Logros", "Achievements")} ${A.ach.count()}/${A.ach.total()}</h4><div class="ach-grid">${ach}</div>`, true), "menu");
    wireTools(); $("hubBack").onclick = () => screen("home");
  }

  function screen(id) {
    C().S.hub = id; C().S.mode = id === "extended" ? "extended" : C().S.mode;
    ({ home, classic: () => campaigns("classic"), extended: () => campaigns("extended"), adventure, compete, profile }[id] || home)();
    C().refreshSkinBits && C().refreshSkinBits();
  }
  A.hub = { render: id => screen(id || "home"), screen };
})(window.AIQ);
