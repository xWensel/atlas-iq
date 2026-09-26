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
      <button class="menu-gear txt" id="menuLang" aria-label="${A.t("tip.lang")}" data-tip="tip.lang">${A.lang.toUpperCase()}</button>
      <button class="menu-gear" id="menuFs" aria-label="${A.t("tip.fs")}" data-tip="tip.fs" data-key="F">${A.icon("u_fs")}</button>
      <button class="menu-gear" id="menuGear" aria-label="${A.t("tip.set")}" data-tip="tip.set">${A.icon("u_set")}</button></div>`;
  const wireTools = () => {
    const c = C();
    $("menuGear").onclick = () => c.openSettings(!c.S.settingsOpen); $("menuCodex").onclick = () => A.codex.open();
    $("menuLang").onclick = e => c.openLangPop(e.currentTarget); $("menuFs").onclick = c.toggleFs;
  };
  const top = (back) => `<div class="menu-top">${back ? `<button class="hub-back" id="hubBack">${A.icon("u_back", "sm")}${T("Menú", "Menu")}</button>` : `<svg class="menu-rose"><use href="#rose"/></svg>`}${tools()}</div>`;
  const shell = (inner, back) => `<div class="menu-in hub">${top(back)}${inner}<p class="menu-foot">Atlas IQ · v${A.VERSION}</p></div>`;

  /* ------------------------------------------------------------------ pantalla principal */
  function home() {
    const c = C(), P = A.profile.get(), adv = P.adv, today = A.rank.boards.daily(), done = P.daily[today], saved = A.adv.hasSave(), sm = saved && A.adv.summary();
    /* cada modo es una carta de la baraja real: A (aventura), K (clasico), Q (competitivo), J (extendido) */
    const mc = (id, rank, suit, art, title, desc, meta, badge) => `<button class="mcard${id === "adventure" ? " hero" : ""}" data-mode="${id}" data-suit="${suit === "s_pin" || suit === "s_compass" ? "red" : "blk"}">
      ${id === "adventure" ? '<i class="marq"></i>' : ""}<span class="ix tl"><b>${rank}</b>${A.icon(suit)}</span><span class="ix br"><b>${rank}</b>${A.icon(suit)}</span>
      ${badge ? `<span class="mc-ribbon">${badge}</span>` : ""}<span class="mc-win">${A.pic(art)}</span><b class="mc-name">${title}</b><span class="mc-desc">${desc}</span><span class="mc-stat">${meta}</span></button>`;
    c.dialog(`<div class="hh">
      <div class="hh-top"><img class="hh-logo" src="assets/gen/logo.webp" alt="Atlas IQ" onerror="this.outerHTML='<h1>Atlas<em>IQ</em></h1>'">${tools()}</div>
      <p class="hh-tag">${A.t("title.tag")}</p>
      <div class="hh-cards">
        ${mc("classic", "K", "s_palm", "card_classic", T("Clásico", "Classic"), T("Las preguntas y la puntuación exactas del juego original: seis partidas.", "The original game's exact questions and scoring: six campaigns."), T("Pulido y sin trampas", "Untouched"))}
        ${mc("adventure", "A", "s_peak", "card_adv", T("Aventura", "Adventure"), T("Roguelike: el crupier cambia las reglas. Mapa a oscuras, del revés, letras que tiemblan… y perks para vencerlo.", "Roguelike: the dealer changes the rules. Dark maps, upside-down worlds, shaky letters… and perks to beat him."), saved ? T("▶ Partida guardada", "▶ Saved run") : adv.bestScore ? T("Récord ", "Best ") + A.fmt(adv.bestScore) : T("Nueva", "New"), T("Modo principal", "Main mode"))}
        ${mc("compete", "Q", "s_compass", "card_compete", T("Competitivo", "Competitive"), T("Reto diario con la misma semilla para todos y clasificaciones.", "A daily challenge with a shared seed, plus leaderboards."), done ? T("Hoy: ", "Today: ") + A.fmt(done.score) : T("Reto de hoy pendiente", "Today's challenge is waiting"))}
        ${mc("extended", "J", "s_pin", "card_ext", T("Extendido", "Extended"), T("Vuelta al mundo Atlas, Historia y pistas: contenido nuevo con fichas × mult.", "Atlas World Tour, History & Clues: new content with chips × mult."), T("Contenido nuevo", "New content"))}
      </div>
      <div class="hh-bottom">
      ${saved && sm ? `<div class="hh-resume"><span class="hr-ic">${A.icon("chip_r")}</span><span class="hr-t"><b>${T("Tienes una expedición guardada", "You have a saved expedition")}</b><i>${T("Acto", "Act")} ${sm.act} · ${T("Ronda", "Round")} ${sm.round} · ${sm.coins} ${T("doblones", "doubloons")} · ${A.fmt(sm.score)} ${T("pts", "pts")}</i></span><button class="btn-ink" id="homeCont" data-primary><span>${T("Continuar", "Continue")}</span><span class="ar">${A.icon("u_next", "sm")}</span></button><button class="btn-line" id="homeNew">${T("Nueva partida", "New run")}</button></div>` : ""}
        <button class="chipbtn big" id="codexBtn" type="button">${A.icon("m_codex", "sm")}<span>${A.t("codex.title")}</span><em>${A.codexStats().u}/${A.codexStats().t}</em></button>
        <button class="chipbtn big" id="profBtn" type="button">${A.icon("m_prof", "sm")}<span>${T("Perfil", "Profile")}</span><em>${A.ach.count()}/${A.ach.total()}</em></button>
        <span class="hh-ver">Atlas IQ · v${A.VERSION}</span>
      </div></div>`, "home");
    wireTools(); $("codexBtn").onclick = () => A.codex.open(); $("profBtn").onclick = () => screen("profile");
    document.querySelectorAll(".mcard").forEach(b => (b.onclick = () => { A.sfx.card(); screen(b.dataset.mode); }));
    if ($("homeCont")) { $("homeCont").onclick = () => { A.sfx.depart(); enterRun(() => A.adv.resume()); }; $("homeNew").onclick = () => { A.sfx.card(); screen("adventure"); }; }
  }

  /* ------------------------------------------------------------------ marco comun de las sub-pantallas (a pantalla completa, sobre el mapa) */
  const scr = (title, inner, cls = "") => `<div class="scr ${cls}"><header class="scr-head"><button class="hub-back" id="hubBack">${A.icon("u_back", "sm")}${T("Menú", "Menu")}</button><h2>${title}</h2>${tools()}</header><div class="scr-body">${inner}</div></div>`;
  const startBtn = (id, big, small, primary) => `<button class="startbtn" id="${id}" ${primary ? "data-primary" : ""}><span class="sb-ic">${A.icon("chip_r")}</span><span class="sb-t"><b>${big}</b><i>${small}</i></span><span class="sb-ar">${A.icon("u_next", "sm")}</span></button>`;

  /* ------------------------------------------------------------------ Clasico / Extendido: campanas */
  function campaigns(mode) {
    const c = C(), S = c.S; S.mode = mode; const camps = A.CAMPAIGNS.filter(x => x.mode === mode);
    if (!camps.find(x => x.id === S.campId)) { S.campId = camps[0].id; S.startLevel = 0; }
    const cur = camps.find(x => x.id === S.campId), pr = c.prog(cur.id); S.startLevel = Math.min(S.startLevel, pr.unlocked - 1);
    const list = camps.map((x, i) => {
      const p = c.prog(x.id), ticks = x.levels.map((_, k) => `<i class="${p.best && k < p.unlocked ? "on" : ""}"></i>`).join(""), md = A.profile.get().medals[x.id];
      return `<button class="camp${x.id === S.campId ? " sel" : ""}" data-id="${x.id}" style="animation-delay:${i * 60}ms"><canvas class="camp-thumb" aria-hidden="true"></canvas>
        <span class="camp-body"><span class="camp-t">${A.tx(x.title)}${md ? ` ${A.icon("medal_" + md, "sm")}` : ""}</span><span class="camp-d">${A.tx(x.blurb)}</span>
        <span class="camp-m"><span class="camp-p">${ticks}</span><span>${p.best ? A.t("camp.best", { s: A.fmt(p.best) }) : A.t("camp.new")}</span></span></span></button>`;
    }).join("");
    let picker = "";
    if (pr.unlocked > 1) { for (let i = 0; i < cur.levels.length; i++) picker += `<button class="lv${i === S.startLevel ? " sel" : ""}" data-lv="${i}" ${i >= pr.unlocked ? "disabled" : ""}>${i + 1}</button>`; picker = `<div class="picker"><span>${A.t("title.from")}</span><div class="lrail">${picker}</div></div>`; }
    c.dialog(scr(mode === "classic" ? T("Clásico", "Classic") : T("Extendido", "Extended"), `
      <p class="mode-d">${A.t("mode." + mode + ".d")}${mode === "classic" && A.t("mode.classic.note") ? `<small>${A.t("mode.classic.note")}</small>` : ""}</p>
      <div class="camps">${list}</div>
      <div class="camp-foot">${picker}${startBtn("goBtn", A.t("go.label"), A.t("go.sub", { n: S.startLevel + 1, name: A.tx(cur.title) }), true)}</div>`, "s-camps"), "tablewrap");
    wireTools(); $("hubBack").onclick = () => screen("home");
    document.querySelectorAll(".camp").forEach(b => (b.onclick = () => { S.campId = b.dataset.id; S.startLevel = 0; c.save(); campaigns(mode); }));
    document.querySelectorAll(".lv").forEach(b => (b.onclick = () => { S.startLevel = +b.dataset.lv; campaigns(mode); }));
    $("goBtn").onclick = () => { A.sfx.depart(); S.ranked = null; c.newRun(); };
    requestAnimationFrame(() => document.querySelectorAll(".camp").forEach((b, i) => c.map.drawThumb(b.querySelector("canvas"), camps[i].home)));
  }

  /* ------------------------------------------------------------------ Aventura */
  let advSel = { deck: "explorer", asc: 0 };
  const TOPIC_ICON = { capital: "t_capital", landmark: "t_landmark", city: "t_city", country: "t_country", history: "t_battle", nature: "t_nature", clue: "t_curio", mixed: "slot" };
  const DECK_CARD = { explorer: ["A", "s_compass"], historian: ["K", "s_peak"], navigator: ["Q", "s_palm"], blind: ["J", "s_pin"] };
  const STAKE_CHIP = ["blank_small", "blank_teal", "blank_gold", "blank_big", "blank_boss", "blank_boss"];
  function adventure() {
    const c = C(), P = A.profile.get(), adv = P.adv, D = A.ADV.DECKS, saved = A.adv.hasSave(), TN = A.ADV.TOPIC_NAMES, R = A.RELICS;
    let runInfo = ""; if (saved) { try { const r = JSON.parse(localStorage.getItem("atlasiq.run.v2")); runInfo = `${T("Acto", "Act")} ${r.act + 1} · ${T("Ronda", "Round")} ${r.round + 1} · ${r.coins} ${T("doblones", "doubloons")} · ${A.fmt(r.score)} ${T("pts", "pts")}`; } catch (e) { /* sin datos */ } }
    const decks = Object.keys(D).map(id => {
      const d = D[id], locked = d.unlock && !P.ach[d.unlock], lockTxt = locked ? (A.ACH.find(a => a.id === d.unlock) || { name: T("?", "?") }).name : "", [rk, su] = DECK_CARD[id];
      const kit = [...d.tools.map(t => `<span class="kt" ${A.kitTip("tool", t)}>${A.icon(A.ADV.TOOLS[t].ico, "kit")}</span>`), ...d.perks.map(p => `<span class="kt" ${A.kitTip("perk", p)}>${A.icon(p, "kit")}</span>`)].join("");
      return `<button class="dcard${advSel.deck === id ? " sel" : ""}${locked ? " lock" : ""}" data-deck="${id}" ${locked ? "disabled" : ""} data-suit="${su === "s_pin" || su === "s_compass" ? "red" : "blk"}"><span class="ix tl"><b>${rk}</b>${A.icon(su)}</span><span class="ix br"><b>${rk}</b>${A.icon(su)}</span>
        <span class="dc-art felt">${locked ? A.icon("lock") : A.icon(d.ico)}</span><b class="dc-n">${A.tx(d.n)}</b><span class="dc-d">${locked ? T("Logro: ", "Achievement: ") + A.tx(lockTxt) : A.tx(d.d)}</span><span class="dc-kit">${locked ? "" : kit}<em>${d.coins} ${T("doblones", "doubloons")} · ${d.lives} ♥</em></span></button>`;
    }).join("");
    const ASC_TXT = [T("Estándar", "Standard"), T("Objetivos +10 %, −1 s", "Targets +10%, −1 s"), T("+20 %, −2 s", "+20%, −2 s"), T("+30 %, −3 s, una provisión menos", "+30%, −3 s, one fewer provision"), T("+40 %, −4 s, jefes dobles", "+40%, −4 s, double bosses"), T("+50 %, −5 s. Solo para leyendas", "+50%, −5 s. Legends only")];
    let stakes = ""; for (let i = 0; i <= 5; i++) stakes += `<button class="stake${advSel.asc === i ? " sel" : ""}" data-asc="${i}" ${i > adv.asc ? "disabled" : ""} ${A.ttAttr(T("Ascensión", "Ascension") + " " + i, i > adv.asc ? A.tip6("Bloqueada: supera la ascensión anterior para desbloquearla.|Locked: beat the previous ascension to unlock it.|Verrouillée : réussis l'ascension précédente pour la débloquer.|Bloqueada: vença a ascensão anterior para desbloqueá-la.|Gesperrt: schließe die vorige Stufe ab, um sie freizuschalten.|Bloccata: supera l'ascensione precedente per sbloccarla.") : ASC_TXT[i])}>${A.icon(STAKE_CHIP[i])}<b>${i}</b></button>`;
    const ascTxt = [T("Estándar", "Standard"), T("Objetivos +10 %, −1 s", "Targets +10%, −1 s"), T("+20 %, −2 s", "+20%, −2 s"), T("+30 %, −3 s, una provisión menos", "+30%, −3 s, one fewer provision"), T("+40 %, −4 s, jefes dobles", "+40%, −4 s, double bosses"), T("+50 %, −5 s. Solo para leyendas", "+50%, −5 s. Legends only")][advSel.asc];
    const road = A.ADV.ROUNDS.map((r, i) => `<span class="rm-node${r.boss ? " boss" : ""}" ${A.roundTip(i)}><span class="rm-ic">${A.icon(r.boss ? "skull" : TOPIC_ICON[r.topic])}</span><em>${i + 1}</em></span>`).join("");
    c.dialog(scr(T("Aventura", "Adventure"), `<div class="adv-setup">
      <section class="as-main">
        ${saved ? `<div class="resume"><span class="tag">${T("Partida guardada", "Saved run")}</span><b>${runInfo}</b><div><button class="btn-ink" id="contBtn" data-primary><span>${T("Continuar", "Continue")}</span><span class="ar">${A.icon("u_next", "sm")}</span></button><button class="btn-line danger" id="abandonBtn">${T("Descartar partida", "Discard run")}</button></div></div>` : ""}
        <h4 class="hub-sub">${T("Baraja inicial", "Starting deck")}</h4><div class="deckrow">${decks}</div>
        <h4 class="hub-sub">${T("Ruta de la expedición", "Expedition route")} <em>${T("12 rondas en 3 actos, cada una de un tema distinto; el jefe cierra el acto", "12 rounds in 3 acts, each on a different topic; a boss closes the act")}</em></h4><div class="roadmap">${road}</div>
      </section>
      <aside class="as-side">
        <h4 class="hub-sub">${T("Ascensión", "Ascension")}</h4><div class="stakes">${stakes}</div><p class="as-asc">${ascTxt}</p>
        <div class="adv-stats"><span>${T("Récord", "Best")} <b>${A.fmt(adv.bestScore)}</b></span><span>${T("Mejor ronda", "Best round")} <b>${adv.bestRound}</b></span><span>${T("Victorias", "Wins")} <b>${adv.wins}</b></span><span>${T("Expediciones", "Runs")} <b>${adv.runs}</b></span></div>
        <p class="as-relics">${A.icon("cards", "sm")}${A.RELIC_IDS.length} ${T("reliquias por descubrir", "relics to discover")}</p>
        ${startBtn("goBtn", T("Nueva expedición", "New expedition"), A.tx(D[advSel.deck].n) + " · " + T("Ascensión", "Ascension") + " " + advSel.asc, !saved)}
      </aside></div>`, "s-adv"), "tablewrap");
    wireTools(); $("hubBack").onclick = () => screen("home");
    document.querySelectorAll(".dcard").forEach(b => (b.onclick = () => { advSel.deck = b.dataset.deck; A.sfx.card(); adventure(); }));
    document.querySelectorAll(".stake").forEach(b => (b.onclick = () => { advSel.asc = +b.dataset.asc; A.sfx.ui(); adventure(); }));
    const confirm2 = (btn, msg, act) => { let armed = false, tm = 0; const html = btn.innerHTML; btn.addEventListener("click", e => { if (armed) { clearTimeout(tm); return act(); } e.stopImmediatePropagation(); armed = true; btn.classList.add("armed"); (btn.querySelector("b") || btn).textContent = msg; A.sfx.deny(); tm = setTimeout(() => { armed = false; btn.classList.remove("armed"); btn.innerHTML = html; }, 4000); }, true); };
    if (saved) {
      $("contBtn").onclick = () => { A.sfx.depart(); enterRun(() => A.adv.resume()); };
      $("abandonBtn").onclick = () => { A.adv.abandon(); A.sfx.deny(); adventure(); };
      confirm2($("abandonBtn"), T("¿Seguro? Pulsa otra vez", "Sure? Press again"), () => {});
    }
    $("goBtn").onclick = () => { A.sfx.depart(); if (saved) A.adv.abandon(); enterRun(() => A.adv.begin({ deck: advSel.deck, asc: advSel.asc })); };
    if (saved) confirm2($("goBtn"), T("Esto borra tu partida guardada. Pulsa otra vez", "This deletes your saved run. Press again"), () => {});
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
    c.dialog(scr(T("Competitivo", "Competitive"), `<div class="cp-grid">
      <section class="cp-main">
        <p class="mode-d">${T("Tus puntos se comparan con los de los demás. Todos juegan el mismo reto diario.", "Your points are compared with everyone else's. Everyone plays the same daily challenge.")}</p>
        <label class="nick"><span>${T("Tu nombre en la clasificación", "Your leaderboard name")}</span><input id="nickIn" maxlength="16" value="${esc(P.name)}" placeholder="${T("Aventurero", "Adventurer")}"></label>
        <div class="daily"><div class="dy-art">${A.pic("card_compete")}</div><div class="dy-body"><span class="tag">${T("Reto diario", "Daily challenge")} · ${dstr}</span><b>${T("Aventura con semilla común", "Adventure with a shared seed")}</b>
          <i>${T("Baraja Explorador, Ascensión 1. Un intento puntúa; después puedes practicar.", "Explorer deck, Ascension 1. One attempt counts; then you can practise.")}</i>
          <div>${done ? `<span class="daily-done">${T("Hoy: ", "Today: ")} <b>${A.fmt(done.score)}</b></span><button class="btn-line" id="dailyGo">${T("Practicar (no puntúa)", "Practise (unranked)")}</button>` : startBtn("dailyGo", T("Jugar el reto de hoy", "Play today's challenge"), T("Todos, la misma semilla", "Everyone, the same seed"), true)}</div></div></div>
        <div class="daily rk"><div class="dy-body"><span class="tag">${T("Clásico clasificado", "Ranked Classic")}</span><b>${T("Una campaña original de principio a fin", "An original campaign start to finish")}</b>
          <div class="rk-camps">${A.CAMPAIGNS.filter(x => x.mode === "classic").map(x => `<button class="chipbtn" data-rk="${x.id}">${A.tx(x.title)}</button>`).join("")}</div></div></div>
      </section>
      <aside class="cp-board"><h4 class="hub-sub">${T("Clasificación", "Leaderboard")}</h4>
        <select id="boardSel" class="board-sel">${boards.map(b => `<option value="${b.id}" ${b.id === board ? "selected" : ""}>${b.title}</option>`).join("")}</select>
        <div class="lb" id="lb"><p class="lb-load">…</p></div></aside></div>`, "s-comp"), "tablewrap");
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
      (rows.length ? `<ol>${rows.map((r, i) => `<li class="${r.id === my ? "me" : ""}"><span class="lb-n">${i < 3 ? A.icon("medal_" + ["gold", "silver", "bronze"][i], "sm") : i + 1}</span><span class="lb-name">${esc(r.name || "—")}</span><b>${A.fmt(r.score)}</b></li>`).join("")}</ol>` : `<p class="lb-empty">${T("Aún no hay puntuaciones. ¡Sé el primero!", "No scores yet. Be the first!")}</p>`);
  }

  /* ------------------------------------------------------------------ Perfil y logros */
  function profile() {
    const c = C(), P = A.profile.get(), s = P.stats, avg = s.questions - s.timeouts > 0 ? Math.round(s.km / (s.questions - s.timeouts)) : 0, st = A.codexStats();
    const CELL_TIP = {
      a_pin: A.tip6("Lugares que has respondido en total.|Places you've answered in total.|Lieux auxquels tu as répondu.|Lugares que você respondeu no total.|Orte, die du insgesamt beantwortet hast.|Luoghi a cui hai risposto in totale."),
      a_target: A.tip6("Respuestas casi perfectas, clavadas sobre el lugar.|Near-perfect answers, right on the spot.|Réponses quasi parfaites, en plein sur le lieu.|Respostas quase perfeitas, bem em cima do lugar.|Fast perfekte Antworten, direkt auf dem Ort.|Risposte quasi perfette, proprio sul luogo."),
      a_lens: A.tip6("Distancia media entre tu pin y el lugar real.|Average distance between your pin and the real place.|Distance moyenne entre ton épingle et le vrai lieu.|Distância média entre seu pino e o lugar real.|Durchschnittliche Entfernung zwischen deinem Pin und dem echten Ort.|Distanza media tra il tuo pin e il luogo reale."),
      a_flame: A.tip6("Más aciertos seguidos que has logrado.|Longest run of correct answers in a row.|Plus longue série de bonnes réponses.|Maior sequência de acertos seguidos.|Längste Serie richtiger Antworten.|Serie più lunga di risposte giuste."),
      m_codex: A.tip6("Lugares descubiertos en la enciclopedia.|Places discovered in the encyclopedia.|Lieux découverts dans l'encyclopédie.|Lugares descobertos na enciclopédia.|In der Enzyklopädie entdeckte Orte.|Luoghi scoperti nell'enciclopedia."),
      crown: A.tip6("Tu mejor puntuación en una expedición.|Your best score in an expedition.|Ton meilleur score en expédition.|Sua melhor pontuação em uma expedição.|Deine beste Punktzahl in einer Expedition.|Il tuo miglior punteggio in una spedizione."),
    };
    const cell = (l, v, ico) => `<div class="pf-cell" ${A.ttAttr(l, CELL_TIP[ico] || "")}>${A.icon(ico)}<span>${l}</span><b>${v}</b></div>`;
    const ach = A.ACH.map(a => { const got = P.ach[a.id]; return `<div class="ach${got ? " got" : ""}" ${got || !a.secret ? A.ttAttr(A.tx(a.name), A.tx(a.desc) + (got ? "" : "\n" + A.tip6("Aún sin conseguir.|Not unlocked yet.|Pas encore obtenu.|Ainda não conquistado.|Noch nicht erreicht.|Non ancora ottenuto."))) : A.ttAttr("???", A.tip6("Logro secreto: juega para descubrirlo.|Secret achievement: play to discover it.|Succès secret : joue pour le découvrir.|Conquista secreta: jogue para descobri-la.|Geheimer Erfolg: spiele, um ihn zu entdecken.|Obiettivo segreto: gioca per scoprirlo."))}><span class="ach-i">${got || !a.secret ? A.badge(a.id) : A.icon("lock")}</span><b>${got || !a.secret ? A.tx(a.name) : "???"}</b><i>${got || !a.secret ? A.tx(a.desc) : T("Logro secreto", "Secret achievement")}</i></div>`; }).join("");
    c.dialog(scr(T("Perfil", "Profile"), `
      <div class="pf-grid">${cell(T("Preguntas", "Questions"), A.fmt(s.questions), "a_pin")}${cell(T("Dianas", "Bullseyes"), A.fmt(s.bulls), "a_target")}${cell(T("Error medio", "Avg. error"), A.fmt(avg) + " km", "a_lens")}${cell(T("Mejor racha", "Best streak"), s.bestStreak, "a_flame")}${cell(T("Enciclopedia", "Encyclopedia"), st.u + "/" + st.t, "m_codex")}${cell(T("Récord aventura", "Adventure best"), A.fmt(P.adv.bestScore), "crown")}</div>
      <h4 class="hub-sub">${T("Logros", "Achievements")} ${A.ach.count()}/${A.ach.total()}</h4><div class="ach-grid">${ach}</div>`, "s-prof"), "tablewrap");
    wireTools(); $("hubBack").onclick = () => screen("home");
  }

  function screen(id) {
    C().S.hub = id; C().S.mode = id === "extended" ? "extended" : C().S.mode;
    ({ home, classic: () => campaigns("classic"), extended: () => campaigns("extended"), adventure, compete, profile }[id] || home)();
    C().refreshSkinBits && C().refreshSkinBits();
  }
  A.hub = { render: id => screen(id || "home"), screen };
})(window.AIQ);
