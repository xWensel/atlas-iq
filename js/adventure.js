/*
 * Atlas IQ - AVENTURA (v0.6): el modo roguelike.
 * Eres un aventurero que descifra lugares con ayuda de herramientas y reliquias. Cada ronda pide una puntuacion objetivo (que sube),
 * entre rondas hay campamento (tienda con doblones), cada acto termina con un jefe que te pone una condicion en contra.
 * Todo sale de una semilla: partidas aleatorias, y el Reto diario comparte semilla para clasificar.
 * Necesita A.core (lo publica game.js).
 */
window.AIQ = window.AIQ || {};
(function (A) {
  const T = A.T, L = A.L, $ = id => document.getElementById(id), C = () => A.core;
  const RUNKEY = "atlasiq.run.v1";
  const ic = (id, cls) => A.icon(id, cls), CN = () => A.icon("coin", "cn");
  /* palos geograficos: chincheta (rojo) y rosa de los vientos (rojo) / cumbre y palmera (oscuros). El numero de la carta es su precio. */
  const SUIT = { steady: "s_compass", eagle: "s_compass", mapper: "s_compass", flash: "s_compass", finisher: "s_compass", crown: "s_compass", luck: "s_compass", blindperk: "s_compass", scholar: "s_compass",
    purse: "s_pin", hoard: "s_pin", banker: "s_pin", heart: "s_pin", anchor: "s_pin", marco: "s_peak", columbus: "s_peak", battuta: "s_peak", cook: "s_peak", tour: "s_peak", boots: "s_palm", glass: "s_palm", omen: "s_palm", gale: "s_palm" };
  const suitCol = s => (s === "s_pin" || s === "s_compass" || s === "heart" ? "red" : "blk");
  const ixs = (rank, suit) => `<span class="ix tl"><b>${rank}</b>${A.icon(suit)}</span><span class="ix br"><b>${rank}</b>${A.icon(suit)}</span>`;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const R_NAMES = ["Común", "Poco común", "Rara"], R_EN = ["Common", "Uncommon", "Rare"];
  const ACTS = [
    { n: L("Acto I", "Act I"), t: L("Las rutas conocidas", "The known roads"), f: L("El gremio de cartógrafos te encarga tus primeras rutas.", "The Cartographers' Guild hands you your first routes.") },
    { n: L("Acto II", "Act II"), t: L("Más allá del mapa", "Beyond the map"), f: L("Las fronteras se difuminan y los nombres se vuelven raros.", "Borders blur and the names get strange.") },
    { n: L("Acto III", "Act III"), t: L("Terra Incognita", "Terra Incognita"), f: L("Nadie ha vuelto de aquí con un mapa completo.", "No one has come back from here with a complete map.") },
  ];
  const actInfo = act => ACTS[act] || { n: L("Acto " + ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][act] || act + 1, "Act " + (["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][act] || act + 1)), t: L("Leyenda", "Legend"), f: L("Ya no hay guía: solo tu pulso.", "There is no guide now: only your aim.") };

  /* ------------------------------------------------------------------ herramientas (activas, cargas por ronda) */
  const TOOLS = {
    sonar: { ico: "sonar", uses: 2, cost: 5, r: 1, n: L("Sonar", "Sonar"), d: L("Toca un punto del mapa: te dice a cuántos km está el objetivo (±6 %) y dibuja el anillo. Con 3 sondas, triangulas.", "Tap a point: tells you how far the target is (±6%) and draws the ring. Three probes triangulate."), kind: "probe" },
    compass: { ico: "compass", uses: 3, cost: 4, r: 0, n: L("Brújula", "Compass"), d: L("Toca un punto: una flecha señala el rumbo (8 direcciones) hacia el objetivo.", "Tap a point: an arrow shows the heading (8 directions) to the target."), kind: "probe" },
    passport: { ico: "passport", uses: 1, cost: 5, r: 1, n: L("Pasaporte", "Passport"), d: L("Revela el país del lugar (o el continente, si es un país).", "Reveals the place's country (or the continent for a country)."), kind: "instant" },
    journal: { ico: "journal", uses: 1, cost: 4, r: 0, n: L("Cuaderno", "Field journal"), d: L("Lee la nota de campo del lugar antes de responder.", "Read the place's field note before answering."), kind: "instant" },
    hourglass: { ico: "hourglass", uses: 2, cost: 4, r: 0, n: L("Reloj de arena", "Hourglass"), d: L("+6 segundos en la pregunta actual.", "+6 seconds on the current question."), kind: "instant" },
  };

  /* ------------------------------------------------------------------ reliquias (pasivas) */
  const CONT = { af: L("África", "Africa"), na: L("Norteamérica", "North America"), sa: L("Sudamérica", "South America"), as: L("Asia", "Asia"), eu: L("Europa", "Europe"), oc: L("Oceanía", "Oceania") };
  const region = (id, ico, es, en, conts, r, cost) => ({ r, cost, ico, n: L(es, en), d: { get es() { return A.tf("×1,5 al multiplicador en {c}.", "×1.5 multiplier in {c}.", { c: conts.map(c => A.tx(CONT[c])).join(A.T(" y ", " & ")) }); }, get en() { return this.es; } }, post: c => (conts.includes(c.cont) ? (c.xmult *= 1.5, "×1.5") : null) });
  const PERKS = {
    steady: { r: 0, cost: 4, ico: "steady", n: L("Pulso firme", "Steady hand"), d: L("La distancia perdona un 25 % más.", "Distance scoring is 25% more forgiving."), q: c => { c.scale *= 1.25; } },
    boots: { r: 0, cost: 4, ico: "boots", n: L("Botas ligeras", "Light boots"), d: L("+3 s por pregunta.", "+3 s per question."), round: c => { c.seconds += 3; } },
    purse: { r: 0, cost: 4, ico: "purse", n: L("Faltriquera", "Purse"), d: L("+1 doblón por cada acierto bueno (750+ de distancia).", "+1 doubloon per good hit (750+ distance)."), post: c => (c.dist >= 750 ? (c.coins += 1, "+1") : null) },
    gale: { r: 0, cost: 5, ico: "gale", n: L("Viento de cola", "Tailwind"), d: L("Las rachas suben el multiplicador más deprisa (+0,35 por acierto en vez de +0,2).", "Streaks raise the multiplier faster (+0.35 per hit instead of +0.2)."), q: c => { c.streakStep = 0.35; } },
    anchor: { r: 0, cost: 4, ico: "anchor", n: L("Ancla", "Anchor"), d: L("+200 fichas en la primera pregunta de cada ronda.", "+200 chips on the first question of each round."), post: (c, run) => (run.qi === 0 ? (c.chips += 200, "+200") : null) },
    eagle: { r: 1, cost: 6, ico: "eagle", n: L("Ojo de halcón", "Hawk eye"), d: L("+150 fichas en cada diana.", "+150 chips on every bullseye."), post: c => (c.dist >= 960 ? (c.chips += 150, "+150") : null) },
    mapper: { r: 1, cost: 6, ico: "mapper", n: L("Cartógrafo", "Cartographer"), d: L("+0,1 de mult. por cada 10 tarjetas de la Enciclopedia (máx. +1,0). ¡Colecciona!", "+0.1 mult per 10 Encyclopedia cards (max +1.0). Collect!"), post: c => { const m = Math.min(1, Math.floor(A.codexStats().u / 10) * 0.1); if (m > 0) { c.mult += m; return "+" + m.toFixed(1); } return null; } },
    marco: region("marco", "marco", "Marco Polo", "Marco Polo", ["as"], 1, 6),
    columbus: region("columbus", "columbus", "Colón", "Columbus", ["na", "sa"], 1, 6),
    battuta: region("battuta", "battuta", "Ibn Battuta", "Ibn Battuta", ["af"], 1, 6),
    cook: region("cook", "cook", "Capitán Cook", "Captain Cook", ["oc"], 1, 6),
    tour: region("tour", "tour", "Gran Tour", "Grand Tour", ["eu"], 1, 6),
    flash: { r: 1, cost: 6, ico: "flash", n: L("Relámpago", "Lightning"), d: L("Las fichas por velocidad se duplican.", "Speed chips are doubled."), post: c => { const b = c.time; c.chips += b; return b ? "+" + b : null; } },
    hoard: { r: 1, cost: 5, ico: "hoard", n: L("Tesorero", "Treasurer"), d: L("+3 doblones al superar una ronda.", "+3 doubloons when you clear a round."), clear: c => { c.coins += 3; return "+3"; } },
    finisher: { r: 1, cost: 6, ico: "finisher", n: L("Broche de oro", "Grand finale"), d: L("×1,5 en la última pregunta de cada ronda.", "×1.5 on the last question of each round."), post: (c, run) => (run.qi === run.qn - 1 ? (c.xmult *= 1.5, "×1.5") : null) },
    scholar: { r: 1, cost: 6, ico: "scholar", n: L("Erudito", "Scholar"), d: L("×1,3 en batallas, sucesos y pistas.", "×1.3 on battles, events and clues."), post: c => (["battle", "event", "clue"].includes(c.kind) ? (c.xmult *= 1.3, "×1.3") : null) },
    banker: { r: 2, cost: 8, ico: "banker", n: L("Banquero", "Banker"), d: L("El interés (1 doblón por cada 5) llega hasta +6 en vez de +3.", "Interest (1 doubloon per 5) caps at +6 instead of +3."), interest: 6 },
    glass: { r: 2, cost: 8, ico: "glass", n: L("Catalejo", "Spyglass"), d: L("+1 carga en todas tus herramientas.", "+1 charge on all your tools."), toolBonus: 1 },
    luck: { r: 2, cost: 9, ico: "luck", n: L("Amuleto", "Lucky charm"), d: L("Una vez por ronda, un fallo (menos de 400 de distancia) cuenta como 700.", "Once per round, a miss (under 400 distance) counts as 700."), q: (c, run) => { c.luck = !run.luckUsed; } },
    blindperk: { r: 2, cost: 9, ico: "blindperk", n: L("Ciego valiente", "Brave blind"), d: L("+1,0 de mult. en las preguntas en las que no uses herramientas.", "+1.0 mult on questions where you use no tools."), post: (c, run) => (run.qTools === 0 ? (c.mult += 1, "+1.0") : null) },
    heart: { r: 2, cost: 8, ico: "heartperk", n: L("Corazón de explorador", "Explorer's heart"), d: L("+1 provisión máxima y la recuperas al comprarlo.", "+1 max provision, restored on purchase."), buy: run => { run.maxLives++; run.lives++; } },
    crown: { r: 2, cost: 10, ico: "crown", n: L("Corona", "Crown"), d: L("+0,5 de mult. fijo.", "+0.5 flat mult."), post: c => { c.mult += 0.5; return "+0.5"; } },
    omen: { r: 2, cost: 9, ico: "omen", n: L("Augurio", "Omen"), d: L("Los efectos de los jefes se reducen a la mitad.", "Boss effects are halved."), omen: true },
  };
  const BOSSES = {
    wind: { ico: "wind", art: "boss_wind", n: L("Vendaval", "Gale"), d: L("El viento desvía tu pin. Apunta compensando la flecha.", "The wind pushes your pin. Aim to compensate for the arrow.") },
    clock: { ico: "storm", art: "boss_storm", n: L("Tormenta", "Storm"), d: L("Solo dispones del 55 % del tiempo.", "You only get 55% of the time.") },
    strict: { ico: "strict", art: "boss_strict", n: L("Rigor", "Rigor"), d: L("La distancia castiga mucho más.", "Distance is punished far more.") },
    silence: { ico: "silence", art: "boss_silence", n: L("Silencio", "Silence"), d: L("Tus herramientas no funcionan.", "Your tools don't work.") },
    fog: { ico: "fog", art: "boss_fog", n: L("Niebla", "Fog"), d: L("Las fronteras desaparecen del mapa.", "Borders vanish from the map.") },
  };
  const DECKS = {
    explorer: { ico: "deck_explorer", n: L("Explorador", "Explorer"), d: L("Un Sonar y 4 doblones. La baraja para aprender.", "A Sonar and 4 doubloons. The deck for learning."), tools: ["sonar"], perks: [], coins: 4, lives: 3, unlock: null },
    historian: { ico: "deck_historian", n: L("Historiador", "Historian"), d: L("Cuaderno + Erudito. Brillas con batallas y pistas.", "Field journal + Scholar. You shine on battles and clues."), tools: ["journal"], perks: ["scholar"], coins: 3, lives: 3, unlock: "adv_act1" },
    navigator: { ico: "deck_navigator", n: L("Navegante", "Navigator"), d: L("Brújula + Capitán Cook. Islas, mares y rumbos.", "Compass + Captain Cook. Islands, seas and headings."), tools: ["compass", "compass"], perks: ["cook"], coins: 3, lives: 3, unlock: "adv_boss" },
    blind: { ico: "deck_blind", n: L("Aventurero ciego", "Blind adventurer"), d: L("Sin herramientas, con Ciego valiente y 4 provisiones.", "No tools, with Brave blind and 4 provisions."), tools: [], perks: ["blindperk"], coins: 6, lives: 4, unlock: "adv_win" },
  };
  A.ADV = { TOOLS, PERKS, BOSSES, DECKS };

  /* ------------------------------------------------------------------ banco de preguntas por dificultad */
  let POOL = null;
  function pool() {
    if (POOL) return POOL; POOL = [[], [], [], [], []]; const seen = new Set();
    for (const camp of A.CAMPAIGNS) {
      if (!camp.levels[0] || !camp.levels[0].all) continue;
      for (const L of camp.levels) for (const q of L.all()) {
        const id = q.cid && q.cid[0]; if (!id || seen.has(id)) continue; seen.add(id);
        POOL[clamp(L.tier || 0, 0, 4)].push({ ...q, kind: q.clue ? "clue" : L.kind });
      }
    }
    return POOL;
  }
  const continentOf = o => A.continent(o.lat, o.lon);

  /* ------------------------------------------------------------------ partida (run) */
  let run = null;
  A.adv = {
    get run() { return run; },
    hasSave() { try { return !!localStorage.getItem(RUNKEY); } catch (e) { return false; } },
  };
  const persist = () => { try { if (run) localStorage.setItem(RUNKEY, JSON.stringify(run)); else localStorage.removeItem(RUNKEY); } catch (e) { /* sin almacenamiento */ } };

  const ascFx = a => ({ target: 1 + 0.1 * a, secs: -a, lives: a >= 3 ? -1 : 0, price: 1 + 0.1 * a, boss2: a >= 4 });
  const roundNo = () => run.act * 4 + run.round;                              // 0..; el 4.o de cada acto es el jefe
  const isBoss = () => run.round === 3;
  const target = () => Math.round((2000 * Math.pow(1.24, roundNo()) * (isBoss() ? 1.25 : 1) * ascFx(run.asc).target) / 50) * 50;
  const price = c => Math.round(c * ascFx(run.asc).price);
  const owned = id => run.perks.includes(id);
  const perkList = () => run.perks.map(id => PERKS[id]);
  const bossFor = act => { const rr = A.rng(run.seed + ":boss"), order = rr.shuffle(Object.keys(BOSSES)); const a = [order[act % order.length]]; if (ascFx(run.asc).boss2 && act >= 1) a.push(order[(act + 2) % order.length]); return a; };
  const omen = () => perkList().some(p => p.omen);

  A.adv.begin = function ({ deck = "explorer", asc = 0, seed, ranked = false, board = null } = {}) {
    const d = DECKS[deck] || DECKS.explorer;
    run = {
      v: 1, seed: seed || "run-" + Math.random().toString(36).slice(2, 10), deck, asc, ranked, board,
      act: 0, round: 0, attempt: 0, coins: d.coins, lives: d.lives + ascFx(asc).lives, maxLives: d.lives + ascFx(asc).lives + (ascFx(asc).lives < 0 ? 1 : 0),
      perks: d.perks.slice(), tools: {}, score: 0, cleared: 0, used: [], rerolls: 0, shopN: 0, phase: "round", qi: 0, qn: 5, qTools: 0, rTools: 0, luckUsed: false, livesLostAct: 0, stats: { bulls: 0, best: 0, coinsEarned: 0 }, t0: Date.now(),
    };
    run.maxLives = Math.max(run.lives, d.lives + Math.min(0, ascFx(asc).lives));
    d.tools.forEach(t => addTool(t));
    persist(); A.ach.emit("adv", { kind: "start" }); A.profile.get().adv.runs++; A.profile.save();
    startRound();
  };
  A.adv.resume = function () {
    try { run = JSON.parse(localStorage.getItem(RUNKEY)); } catch (e) { run = null; }
    if (!run) return false;
    if (run.phase === "shop" || run.phase === "chest") openShop(run.phase === "chest"); else startRound();
    return true;
  };
  A.adv.abandon = () => { run = null; persist(); };
  A.adv.active = () => !!run;

  function toolMax(id) { const t = run.tools[id]; return t ? t.max + (perkList().reduce((n, p) => n + (p.toolBonus || 0), 0)) : 0; }
  function addTool(id) { const t = run.tools[id]; if (t) t.max++; else run.tools[id] = { max: TOOLS[id].uses, left: TOOLS[id].uses }; }
  function refillTools() { for (const id in run.tools) run.tools[id].left = toolMax(id); }

  /* ---------------- ronda ---------------- */
  function pickQuestions(n) {
    const P = pool(), rr = A.rng(`${run.seed}:q:${roundNo()}:${run.attempt}`), r = roundNo();
    const out = [], used = new Set(run.used);
    for (let i = 0; i < n; i++) {
      const centre = clamp(r / 2.6 + (isBoss() ? 0.6 : 0), 0, 4), tier = clamp(Math.round(centre + (rr() - 0.5) * 2.2), 0, 4);
      let cand = P[tier].filter(q => !used.has(q.cid[0]) && !out.includes(q));
      if (cand.length < 3) cand = P.flat().filter(q => !used.has(q.cid[0]) && !out.includes(q));
      const q = rr.pick(cand); out.push(q); used.add(q.cid[0]);
    }
    return out;
  }
  function roundLevel() {
    const r = roundNo(), boss = isBoss(), bosses = boss ? (A.adv._force || bossFor(run.act)) : [], halve = omen() ? 0.5 : 1;
    const ctx = { seconds: clamp(Math.round(24 - 1.1 * r + ascFx(run.asc).secs), 9, 26) };
    perkList().forEach(p => p.round && p.round(ctx));
    if (bosses.includes("clock")) ctx.seconds = Math.max(6, Math.round(ctx.seconds * (1 - 0.45 * halve)));
    run.boss = bosses; run.wind = null;
    if (bosses.includes("wind")) { const wr = A.rng(`${run.seed}:wind:${r}:${run.attempt}`); run.wind = { brg: Math.round(wr() * 360), km: Math.round((160 + 40 * run.act) * halve) }; }
    const qs = pickQuestions(run.qn).map(q => ({ ...q }));
    const info = actInfo(run.act);
    return {
      name: `${A.tx(info.n)} · ${boss ? A.T("Jefe", "Boss") : A.tf("Ronda {n}/3", "Round {n}/3", { n: run.round + 1 })}`, kind: "adventure", boss: !!boss,
      seconds: ctx.seconds, advance: target(), maxPerQ: 1400, bonus: false, plainName: true, questions: () => qs,
      score: (q, km, left) => A.adv.score(q, km, left, true).sc,
    };
  }
  function startRound() {
    run.phase = "round"; run.qi = 0; run.luckUsed = false; run.rTools = 0; refillTools();
    const L = roundLevel(), S = C().S;
    S.run = run; S.camp = { id: "adv", mode: "adventure", title: { es: "Aventura", en: "Adventure" }, home: { lat: 20, lon: 10, zoom: 1 }, levels: [L] };
    S.runTotal = run.score; S.runMax = 0; C().map.setHome(S.camp.home); C().map.setStyle(mapStyleFor(run.boss));
    persist(); A.ach.emit("adv", { kind: "round", act: run.act }); C().startLevel(0);
    if (L.boss) setTimeout(() => A.sfx.boss(), 200);
  }
  function mapStyleFor(bosses) {
    const base = A.MAPSTYLES[A.skin] || A.MAPSTYLES.casino;
    if (bosses && bosses.includes("fog")) return { ...base, line: [base.line[0], base.line[1], base.line[2], 0], lineW: 0 };
    return base;
  }
  A.adv.introHtml = L => {
    const info = actInfo(run.act), b = run.boss || [];
    const debuffs = b.map(id => `<div class="adv-debuff"><span>${ic(BOSSES[id].ico)}</span><div><b>${A.tx(BOSSES[id].n)}</b><i>${A.tx(BOSSES[id].d)}</i>${id === "wind" && run.wind ? `<em>${A.T("Viento hacia", "Wind toward")} ${dirName(run.wind.brg)} · ${run.wind.km} km</em>` : ""}</div></div>`).join("");
    return `<div class="intro-in adv"><div class="intro-num blind">${A.blind(L.boss ? "boss" : run.round === 0 ? "small" : "big", L.boss ? BOSSES[b[0]].ico : run.round === 0 ? "s_pin" : "s_compass")}</div><div class="intro-body">
      <span class="tag">${A.tx(info.n)} · ${A.tx(info.t)}</span><h2>${L.boss ? A.T("Jefe del acto", "Act boss") : A.T("Ronda", "Round") + " " + (run.round + 1)}</h2>
      <p>${A.tx(info.f)}</p><p class="adv-goal">${A.T("Objetivo", "Target")} <b>${A.fmt(L.advance)}</b> · ${run.qn} ${A.T("lugares", "places")} · ${L.seconds} s</p>${debuffs}</div>
      <div class="intro-art">${A.pic(b.length ? BOSSES[b[0]].art : "act_" + Math.min(run.act, 3))}</div></div>`;
  };
  const DIRS8 = [["N", "N"], ["NE", "NE"], ["E", "E"], ["SE", "SE"], ["S", "S"], ["SW", "SO"], ["W", "O"], ["NW", "NO"]];
  const dirName = brg => { const d = DIRS8[Math.round((((brg % 360) + 360) % 360) / 45) % 8]; return A.lang === "es" ? d[1] : d[0]; };

  /* ---------------- puntuacion de una pregunta ---------------- */
  A.adv.score = function (o, km, left, noSide) {
    const L = C().S.camp.levels[0], limit = C().S.limit || L.seconds, halve = omen() ? 0.5 : 1, boss = run.boss || [];
    const r = roundNo(), c = {
      o, km, left, limit, kind: o.kind || (o.clue ? "clue" : "place"), cont: continentOf(o), coins: 0, lines: [], xmult: 1, mult: 1, streakStep: 0.2, luck: false,
      scale: clamp(1100 * Math.pow(0.93, r), 260, 1100) * (o.t === "c" ? 0.7 : 1),
    };
    if (boss.includes("strict")) c.scale *= 1 - 0.45 * halve;
    perkList().forEach(p => p.q && p.q(c, run));
    let dist = km == null ? 0 : Math.round(1000 * Math.exp(-km / c.scale));
    if (c.luck && km != null && dist < 400) { dist = 700; c.lines.push(["luck", A.tx(PERKS.luck.n), "→ 700"]); if (!noSide) run.luckUsed = true; }
    const time = km == null ? 0 : Math.round(400 * Math.max(0, left / limit) * (0.3 + 0.7 * dist / 1000));
    c.dist = dist; c.time = time; c.chips = dist + time;
    const ratio = dist / 1000, streak = km != null && ratio >= 0.6 ? C().S.streak + 1 : 0;
    c.streak = streak; c.mult = 1 + (streak >= 2 ? Math.min(1.5, c.streakStep * (streak - 1)) : 0);
    if (km != null) perkList().forEach((p, i) => { if (!p.post) return; const t = p.post(c, run); if (t) c.lines.push([p.ico, A.tx(p.n), t]); });
    c.total = km == null ? 0 : Math.round(c.chips * c.mult * c.xmult);
    c.coinsBase = km == null ? 0 : dist >= 960 ? 2 : dist >= 750 ? 1 : 0;
    c.coins += c.coinsBase;
    c.sc = { dist, time, distMax: 1000, timeMax: 400 };
    return c;
  };
  /* llamado por game.js tras cada pregunta con el resultado de score() */
  A.adv.afterQuestion = function (res) {
    run.coins += res.coins; run.stats.coinsEarned += res.coins; if (res.dist >= 960) run.stats.bulls++; run.stats.best = Math.max(run.stats.best, res.total);
    run.qi++; run.qTools = 0; persist(); A.ach.emit("adv", { kind: "hold", coins: run.coins, perks: run.perks.length });
  };
  A.adv.onQuestion = function () { run.qTools = 0; run.probes = []; run.tool = null; const t = C().S; t.tool = null; run.qDone = false; renderBars(); };
  /* el viento desvia el clic */
  A.adv.adjust = function (lon, lat) {
    if (!run || !run.wind) return { lon, lat };
    const D = Math.PI / 180, d = run.wind.km / 6371, la = lat * D, lo = lon * D, b = run.wind.brg * D;
    const la2 = Math.asin(Math.sin(la) * Math.cos(d) + Math.cos(la) * Math.sin(d) * Math.cos(b));
    const lo2 = lo + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(la), Math.cos(d) - Math.sin(la) * Math.sin(la2));
    return { lon: ((lo2 / D + 540) % 360) - 180, lat: clamp(la2 / D, -85, 85) };
  };

  /* ---------------- herramientas ---------------- */
  A.adv.useTool = function (id) {
    const S = C().S; if (!run || S.phase !== "asking" || S.paused) return;
    const t = run.tools[id], def = TOOLS[id]; if (!t) return;
    if ((run.boss || []).includes("silence")) { A.sfx.deny(); note(A.T("El Silencio anula tus herramientas.", "Silence cancels your tools.")); return; }
    if (t.left <= 0) { A.sfx.deny(); return; }
    if (def.kind === "probe") {
      S.tool = S.tool === id ? null : id; A.sfx.flip(!!S.tool); C().map.setPick(true);
      note(S.tool ? (id === "sonar" ? A.T("Toca el mapa para lanzar una sonda…", "Tap the map to send a probe…") : A.T("Toca el mapa para orientar la brújula…", "Tap the map to aim the compass…")) : "");
      renderBars(); return;
    }
    t.left--; run.qTools++; run.rTools++; A.sfx.buy();
    const o = C().S.qs[S.qi];
    if (id === "hourglass") { S.limit += 6; note(A.T("+6 segundos", "+6 seconds")); }
    else if (id === "journal") { const txt = o.clue ? A.tf("Empieza por «{l}» y está en {c}.", "Starts with “{l}” and lies in {c}.", { l: A.tx(o.answer).trim()[0], c: continentName(o) }) : (A.tx(o.fact) || A.T("Sin notas para este lugar.", "No notes for this place.")); note(txt, "journal"); }
    else if (id === "passport") {
      const e = o.cid && A.codex.entry(o.cid[0]);
      if (o.t === "c") note(A.T("Continente: ", "Continent: ") + continentName(o), "passport");
      else if (e && e.country && C().world.byName[e.country]) { C().map.setMarks({ highlight: e.country }); note(A.lang === "es" && A.codex.entry("c:" + e.country) && A.codex.entry("c:" + e.country).name.es || e.country, "passport"); }
      else note(A.T("Continente: ", "Continent: ") + continentName(o), "passport");
    }
    persist(); renderBars();
  };
  const continentName = o => A.tx(CONT[continentOf(o)] || T("el mar", "the sea"));
  const note = (txt, icon) => { const el = $("factText"); el.textContent = txt || ""; if (txt && icon) el.insertAdjacentHTML("afterbegin", A.icon(icon, "sm")); };
  A.adv.probe = function (lon, lat) {
    const S = C().S, id = S.tool, t = run.tools[id]; if (!t || t.left <= 0) { S.tool = null; renderBars(); return; }
    const o = S.qs[S.qi]; t.left--; run.qTools++; run.rTools++; S.tool = null;
    let km;
    if (o.t === "c") km = A.geo.distToFeature(lon, lat, C().world.byName[o.key]); else km = A.geo.haversine(lat, lon, o.lat, o.lon);
    const list = (run.probes = run.probes || []), P = { lon, lat };
    if (id === "sonar") {
      const fz = (A.rng(run.seed + ":sn:" + roundNo() + ":" + S.qi + ":" + list.length)() - 0.5) * 0.12, shown = km * (1 + fz);
      P.km = Math.max(0, shown); P.label = km === 0 && o.t === "c" ? A.T("¡Dentro del país!", "Inside the country!") : "≈ " + A.fmt(Math.round(shown / (shown > 500 ? 50 : 10)) * (shown > 500 ? 50 : 10)) + " km";
      if (km === 0 && o.t === "c") P.km = 0;
      A.sfx.sonar(clamp(1 - km / 8000, 0, 1));
    } else {
      const brg = bearing(lat, lon, o.t === "c" ? centre(o) : [o.lat, o.lon]), snap = Math.round(brg / 45) * 45;
      P.bearing = snap; P.label = dirName(snap); A.sfx.sonar(0.8);
    }
    list.push(P); C().map.setProbes(list); persist(); note(""); renderBars();
  };
  function centre(o) { const f = C().world.byName[o.key], big = f.polys.reduce((a, b) => ((b.bbox[2] - b.bbox[0]) * (b.bbox[3] - b.bbox[1]) > (a.bbox[2] - a.bbox[0]) * (a.bbox[3] - a.bbox[1]) ? b : a)); return [(big.bbox[1] + big.bbox[3]) / 2, (big.bbox[0] + big.bbox[2]) / 2]; }
  function bearing(la1, lo1, p2) { const D = Math.PI / 180, la2 = p2[0] * D, dl = (p2[1] - lo1) * D, y = Math.sin(dl) * Math.cos(la2), x = Math.cos(la1 * D) * Math.sin(la2) - Math.sin(la1 * D) * Math.cos(la2) * Math.cos(dl); return (Math.atan2(y, x) / D + 360) % 360; }

  /* ---------------- barras de estado (durante la partida) ---------------- */
  function ensureBars() {
    let el = $("advBar"); if (el) return;
    el = document.createElement("div"); el.id = "advBar"; el.className = "adv-bar hidden"; $("app").appendChild(el);
    const tb = document.createElement("div"); tb.id = "toolBar"; tb.className = "tool-bar hidden"; $("app").appendChild(tb);
  }
  function hearts() { let h = ""; for (let i = 0; i < run.maxLives; i++) h += `<i class="hp ${i < run.lives ? "on" : ""}">${ic("heart")}</i>`; return h; }
  function renderBars() {
    ensureBars(); const bar = $("advBar"), tb = $("toolBar");
    if (!run || !C().S.camp || C().S.camp.mode !== "adventure" || ["title", "levelEnd", "shop"].includes(C().S.phase)) { bar.classList.add("hidden"); tb.classList.add("hidden"); return; }
    const info = actInfo(run.act), silenced = (run.boss || []).includes("silence");
    bar.classList.remove("hidden");
    bar.innerHTML = `<div class="ab-top"><span class="ab-act">${A.tx(info.n)}</span><span class="ab-coins" id="abCoins">${CN()}<b>${run.coins}</b></span><span class="ab-hearts">${hearts()}</span></div>
      <div class="ab-perks">${run.perks.map(id => `<span class="ab-perk" title="${A.tx(PERKS[id].n)} — ${A.tx(PERKS[id].d)}">${ic(PERKS[id].ico)}</span>`).join("")}</div>
      ${(run.boss || []).length ? `<div class="ab-boss">${run.boss.map(b => `${ic(BOSSES[b].ico)}${A.tx(BOSSES[b].n)}`).join("")}</div>` : ""}
      ${run.wind ? `<div class="ab-wind"><svg viewBox="-12 -12 24 24" style="transform:rotate(${run.wind.brg}deg)"><path d="M0 -9 L6 4 L0 1 L-6 4 Z"/></svg><span>${dirName(run.wind.brg)} · ${run.wind.km} km</span></div>` : ""}`;
    const ids = Object.keys(run.tools);
    tb.classList.toggle("hidden", !ids.length || C().S.phase !== "asking");
    tb.innerHTML = ids.map((id, i) => { const t = run.tools[id], on = C().S.tool === id, off = t.left <= 0 || silenced; return `<button class="tool pc-hand${on ? " on" : ""}${off ? " off" : ""}" data-tool="${id}" style="--r:${((i - (ids.length - 1) / 2) * 6).toFixed(1)}deg" title="${A.tx(TOOLS[id].n)} — ${A.tx(TOOLS[id].d)}"><span class="ix tl"><b>A</b>${A.icon("s_palm")}</span><span class="tl-ico felt">${ic(TOOLS[id].ico)}</span><b>${A.tx(TOOLS[id].n)}</b><span class="tl-pips">${Array.from({ length: toolMax(id) }, (_, k) => `<i class="${k < t.left ? "on" : ""}"></i>`).join("")}</span><kbd>${i + 1}</kbd></button>`; }).join("");
    tb.querySelectorAll(".tool").forEach(b => (b.onclick = () => A.adv.useTool(b.dataset.tool)));
  }
  A.adv.refresh = renderBars;
  A.adv.hideBars = () => { const a = $("advBar"), b = $("toolBar"); if (a) a.classList.add("hidden"); if (b) b.classList.add("hidden"); };
  A.adv.hudTitle = () => { const L = C().S.camp.levels[0]; return `${A.tx(L.name)} · ${A.T("Objetivo", "Target")} ${A.fmt(L.advance)}`; };
  A.adv.toolKey = n => { const ids = run ? Object.keys(run.tools) : []; if (ids[n]) A.adv.useTool(ids[n]); };
  A.adv.cancelTool = () => { const S = C().S; if (S.tool) { S.tool = null; note(""); renderBars(); } };

  /* ---------------- fin de ronda ---------------- */
  A.adv.roundEnd = function () {
    const S = C().S, L = S.camp.levels[0], pass = S.levelScore >= L.advance, boss = isBoss();
    S.phase = "levelEnd"; A.adv.hideBars(); C().map.setStyle(mapStyleFor(null));
    if (pass) {
      run.score += S.levelScore; run.cleared++; S.runTotal = run.score;
      const cx = { coins: 3 + (boss ? 4 : 0) }, lines = [[A.T("Ronda superada", "Round cleared"), "+" + cx.coins]];
      const cap = perkList().some(p => p.interest) ? 6 : 3, interest = Math.min(cap, Math.floor(run.coins / 5));
      if (interest) { cx.coins += interest; lines.push([A.T("Interés (1 por cada 5)", "Interest (1 per 5)"), "+" + interest]); }
      perkList().forEach(p => { if (p.clear) { const cc = { coins: 0 }, t = p.clear(cc); if (cc.coins) { cx.coins += cc.coins; lines.push([p.ico + " " + A.tx(p.n), t]); } } });
      run.coins += cx.coins; run.stats.coinsEarned += cx.coins;
      A.ach.emit("adv", { kind: "clear", tools: run.rTools }); if (boss) { A.ach.emit("adv", { kind: "boss" }); A.profile.get().adv.boss++; }
      A.sfx.stamp(); setTimeout(A.sfx.clear, 300);
      const actDone = boss, winAct = actDone ? run.act + 1 : 0;
      if (actDone) { const flawless = run.livesLostAct === 0; A.ach.emit("adv", { kind: "act", act: winAct, flawless, asc: run.asc }); run.livesLostAct = 0; A.profile.get().adv.bestAct = Math.max(A.profile.get().adv.bestAct || 0, winAct); }
      A.profile.get().adv.bestRound = Math.max(A.profile.get().adv.bestRound, roundNo() + 1);
      persist(); A.profile.save();
      C().verdict({
        kind: "ok", level: roundNo() + 1, title: boss ? A.T("¡Jefe derrotado!", "Boss defeated!") : A.T("Ronda superada", "Round cleared"),
        text: `${A.fmt(S.levelScore)} / ${A.fmt(L.advance)} — ${lines.map(l => l[0] + " " + l[1]).join(" · ")}`,
        stats: [[A.T("Puntos de la ronda", "Round points"), S.levelScore], [A.T("Total de la expedición", "Expedition total"), run.score], [A.T("Doblones", "Doubloons"), run.coins]],
        stamp: A.T("SUPERADA", "CLEARED"), stampSub: String(roundNo() + 1).padStart(2, "0"), art: boss ? "chest" : null,
        buttons: [{ id: "nlBtn", cls: "btn-ink", label: boss ? A.T("Abrir el cofre del jefe", "Open the boss chest") : A.T("Al campamento", "To camp"), arrow: true, primary: true, onclick: () => { if (actDone && run.act + 1 === 3 && !run.won) return winScreen(); nextStep(boss); } }],
      });
    } else {
      run.lives--; run.livesLostAct++; run.attempt++; persist();
      A.sfx.stamp(); setTimeout(A.sfx.lose, 300);
      if (run.lives <= 0) return endRun(false);
      C().verdict({
        kind: "", level: roundNo() + 1, title: A.T("No llegaste al objetivo", "Target missed"), text: A.tf("Te quedaste en {s} de {a}. Pierdes una provisión: te quedan {n}.", "You scored {s} of {a}. You lose a provision: {n} left.", { s: A.fmt(S.levelScore), a: A.fmt(L.advance), n: run.lives }),
        stats: [[A.T("Puntos de la ronda", "Round points"), S.levelScore], [A.T("Objetivo", "Target"), L.advance]], stamp: A.T("FALLIDA", "FAILED"), stampSub: String(run.lives), art: "lose",
        buttons: [{ id: "rtBtn", cls: "btn-ink", label: A.T("Reintentar con lugares nuevos", "Retry with new places"), arrow: true, primary: true, onclick: () => openShop(false) }, { id: "abBtn", cls: "btn-line", label: A.T("Abandonar", "Abandon"), onclick: () => endRun(false) }],
      });
    }
  };
  function nextStep(boss) {
    if (boss) { run.act++; run.round = 0; run.attempt = 0; openShop(true); }
    else { run.round++; run.attempt = 0; openShop(false); }
  }
  function winScreen() {
    run.won = true; run.act++; run.round = 0; run.attempt = 0; persist(); A.sfx.victory();
    A.profile.get().adv.wins++; A.profile.save();
    C().verdict({
      kind: "win", level: 12, title: A.T("¡Terra Incognita conquistada!", "Terra Incognita conquered!"),
      text: A.T("Has completado los tres actos. Puedes cobrar tu gloria ahora o seguir hacia la Leyenda: rondas infinitas cada vez más duras, con el mismo marcador.", "You've completed all three acts. Cash out your glory now, or push on into Legend: endless, ever-harder rounds on the same scoreboard."),
      stats: [[A.T("Total de la expedición", "Expedition total"), run.score], [A.T("Doblones", "Doubloons"), run.coins]], stamp: A.T("VICTORIA", "VICTORY"), stampSub: A.icon("u_star", "st"), art: "win",
      buttons: [{ id: "legBtn", cls: "btn-ink", label: A.T("Seguir a la Leyenda", "Push into Legend"), arrow: true, primary: true, onclick: () => openShop(true) }, { id: "endBtn", cls: "btn-line", label: A.T("Cobrar y terminar", "Cash out"), onclick: () => endRun(true) }],
    });
  }

  /* ---------------- tienda / campamento ---------------- */
  function offers(chest) {
    const rr = A.rng(`${run.seed}:shop:${roundNo()}:${run.shopN}`), all = Object.keys(PERKS).filter(id => !owned(id) && !(PERKS[id].buy && false));
    const w = id => [60, 30 + run.act * 4, 10 + run.act * 5][PERKS[id].r], out = [];
    const bag = all.slice();
    const draw = () => { const tot = bag.reduce((n, id) => n + w(id), 0); let x = rr() * tot; for (let i = 0; i < bag.length; i++) { x -= w(bag[i]); if (x <= 0) return bag.splice(i, 1)[0]; } return bag.pop(); };
    for (let i = 0; i < (chest ? 3 : 3) && bag.length; i++) out.push({ k: "perk", id: draw() });
    if (chest) return out;
    const tk = rr.shuffle(Object.keys(TOOLS)).slice(0, 2); tk.forEach(id => out.push({ k: "tool", id }));
    return out;
  }
  function openShop(chest) {
    const S = C().S; S.phase = "shop"; A.adv.hideBars(); run.phase = chest ? "chest" : "shop"; if (!run.stock || run.stockKey !== `${roundNo()}:${run.shopN}:${chest}`) { run.stock = offers(chest); run.stockKey = `${roundNo()}:${run.shopN}:${chest}`; run.bought = []; } persist();
    renderShop(chest);
  }
  const routeHtml = () => { let h = ""; const cur = roundNo(); for (let i = Math.max(0, cur - 3); i < Math.max(0, cur - 3) + 12; i++) h += `<i class="${i < cur ? "done" : i === cur ? "cur" : ""}${i % 4 === 3 ? " boss" : ""}">${i % 4 === 3 ? ic("skull") : ""}</i>`; return h; };
  function renderShop(chest) {
    const cost = c => (chest ? 0 : price(c)), slots = 5;
    const cards = run.stock.map((s, i) => {
      const bought = run.bought.includes(i);
      if (s.k === "perk") { const p = PERKS[s.id], c = cost(p.cost); const su = SUIT[s.id] || "s_compass"; return `<div class="offer pc r${p.r}${bought ? " sold" : ""}" data-i="${i}" data-suit="${suitCol(su)}">${ixs(p.cost, su)}<span class="of-r">${A.tx(A.T(R_NAMES[p.r], R_EN[p.r]))}</span><div class="of-ico felt">${ic(p.ico)}</div><b>${A.tx(p.n)}</b><p>${A.tx(p.d)}</p><button class="buy" ${bought ? "disabled" : ""}>${bought ? A.T("Comprado", "Owned") : chest ? A.T("Elegir gratis", "Take for free") : CN() + c}</button></div>`; }
      const t = TOOLS[s.id], c = cost(t.cost), have = run.tools[s.id]; return `<div class="offer pc otool r${t.r}${bought ? " sold" : ""}" data-i="${i}" data-suit="blk">${ixs("A", "s_palm")}<span class="of-r">${A.T("Herramienta", "Tool")}</span><div class="of-ico felt">${ic(t.ico)}</div><b>${A.tx(t.n)}${have ? ` <em>+1 ${A.T("carga", "charge")}</em>` : ""}</b><p>${A.tx(t.d)}</p><button class="buy" ${bought ? "disabled" : ""}>${bought ? A.T("Comprado", "Owned") : CN() + c}</button></div>`;
    }).join("");
    const life = chest ? "" : `<div class="offer pc life${run.lives >= run.maxLives ? " sold" : ""}" data-suit="red">${ixs("♥", "heart")}<span class="of-r">${A.T("Provisión", "Provision")}</span><div class="of-ico felt">${ic("heart")}</div><b>+1 ${A.T("provisión", "provision")}</b><p>${A.tf("Recupera una provisión (máx. {n}).", "Restore a provision (max {n}).", { n: run.maxLives })}</p><button class="buy" ${run.lives >= run.maxLives ? "disabled" : ""}>${CN()}${price(6)}</button></div>`;
    const inv = `<div class="inv"><div class="inv-col"><h4>${A.T("Reliquias", "Relics")} ${run.perks.length}/${slots}</h4><div class="inv-row">${run.perks.map(id => `<button class="inv-perk" data-sell="${id}" title="${A.tx(PERKS[id].n)} — ${A.tx(PERKS[id].d)}">${ic(PERKS[id].ico)}${chest ? "" : `<em>${A.T("vender", "sell")} ${Math.floor(PERKS[id].cost / 2)}</em>`}</button>`).join("") || `<i class="empty">${A.T("Vacío", "Empty")}</i>`}</div></div>
      <div class="inv-col"><h4>${A.T("Herramientas", "Tools")}</h4><div class="inv-row">${Object.keys(run.tools).map(id => `<span class="inv-tool" title="${A.tx(TOOLS[id].n)}">${ic(TOOLS[id].ico)}<b>${toolMax(id)}</b></span>`).join("") || `<i class="empty">${A.T("Ninguna", "None")}</i>`}</div></div>
      <div class="inv-col"><h4>${A.T("Provisiones", "Provisions")}</h4><div class="inv-row hearts">${hearts()}</div></div></div>`;
    const info = actInfo(run.act);
    C().dialog(`<div class="shop"><header><div class="shop-art">${A.pic(chest ? "chest" : "camp")}</div><span class="tag">${A.tx(info.n)} · ${A.tx(info.t)}</span><h2>${chest ? A.T("Cofre del jefe", "Boss chest") : A.T("Campamento", "Camp")}</h2>
      <div class="shop-top"><span class="coins" id="shopCoins">${CN()}${run.coins}</span><div class="route">${routeHtml()}</div></div></header>
      ${chest ? `<p class="shop-note">${A.T("Elige UNA reliquia gratis.", "Pick ONE relic for free.")}</p>` : ""}
      <div class="offers">${cards}${life}</div>${inv}
      <footer>${chest ? "" : `<button class="btn-line" id="rerollBtn">${A.T("Cambiar ofertas", "Reroll")} ${CN()}${2 + run.rerolls}</button>`}<button class="btn-ink" id="goRound" data-primary><span>${chest ? A.T("Continuar sin elegir", "Continue without picking") : A.T("Siguiente ronda", "Next round")}</span><span class="ar">${A.icon("u_next", "sm")}</span></button></footer></div>`, "verdict");
    document.querySelectorAll(".offer").forEach(el => {
      const btn = el.querySelector(".buy"); if (!btn) return; btn.onclick = () => buy(el, chest);
    });
    document.querySelectorAll(".inv-perk").forEach(b => (b.onclick = () => { if (chest) return; sell(b.dataset.sell); }));
    if ($("rerollBtn")) $("rerollBtn").onclick = () => { const c = 2 + run.rerolls; if (run.coins < c) { A.sfx.deny(); shake($("rerollBtn")); return; } run.coins -= c; run.rerolls++; run.shopN++; run.stock = offers(false); run.stockKey = `${roundNo()}:${run.shopN}:false`; run.bought = []; A.sfx.reroll(); persist(); renderShop(chest); };
    $("goRound").onclick = () => { run.rerolls = 0; run.stock = null; persist(); chest ? openShop(false) : startRound(); };
    A.ach.emit("adv", { kind: "hold", coins: run.coins, perks: run.perks.length });
  }
  const shake = el => { el.classList.remove("no"); void el.offsetWidth; el.classList.add("no"); };
  function buy(el, chest) {
    const i = +el.dataset.i, life = el.classList.contains("life");
    if (life) { const c = price(6); if (run.coins < c || run.lives >= run.maxLives) { A.sfx.deny(); shake(el); return; } run.coins -= c; run.lives++; A.sfx.buy(); persist(); return renderShop(chest); }
    const s = run.stock[i]; if (!s || run.bought.includes(i)) return;
    if (s.k === "perk") {
      const p = PERKS[s.id], c = chest ? 0 : price(p.cost);
      if (run.perks.length >= 5) { A.sfx.deny(); shake(el); flash(A.T("Mochila llena: vende una reliquia.", "Pack full: sell a relic.")); return; }
      if (run.coins < c) { A.sfx.deny(); shake(el); return; }
      run.coins -= c; run.perks.push(s.id); if (p.buy) p.buy(run);
    } else {
      const t = TOOLS[s.id], c = price(t.cost);
      if (!run.tools[s.id] && Object.keys(run.tools).length >= 4) { A.sfx.deny(); shake(el); flash(A.T("Solo 4 herramientas distintas.", "Only 4 different tools.")); return; }
      if (run.coins < c) { A.sfx.deny(); shake(el); return; }
      run.coins -= c; addTool(s.id);
    }
    run.bought.push(i); A.sfx.buy(); persist();
    if (chest) { run.stock = null; run.bought = []; persist(); return startRoundAfterChest(); }
    renderShop(chest);
  }
  function startRoundAfterChest() { openShop(false); }
  function sell(id) { const k = run.perks.indexOf(id); if (k < 0) return; run.perks.splice(k, 1); run.coins += Math.floor(PERKS[id].cost / 2); A.sfx.sell(); persist(); renderShop(false); }
  function flash(t) { const n = document.querySelector(".shop-note") || document.querySelector(".shop header"); if (!n) return; const m = document.createElement("p"); m.className = "shop-flash"; m.textContent = t; n.after(m); setTimeout(() => m.remove(), 2200); }

  /* ---------------- fin de la expedicion ---------------- */
  function endRun(win) {
    const P = A.profile.get(), bonus = run.cleared * 1000 + run.coins * 20 + (run.won ? 2500 : 0), final = run.score + bonus, wasRanked = run.ranked, board = run.board;
    const summary = { score: final, round: roundNo() + (win ? 0 : 0), acts: run.act, cleared: run.cleared, deck: run.deck, asc: run.asc, perks: run.perks.slice() };
    P.adv.bestScore = Math.max(P.adv.bestScore, final); P.adv.coins += run.stats.coinsEarned;
    if (win && run.won) P.adv.asc = Math.max(P.adv.asc, Math.min(5, run.asc + 1));
    A.profile.save();
    const rec = A.profile.record("adv-all", final);
    A.rank.submit("adv-all", { score: final, extra: { deck: run.deck, asc: run.asc, r: run.cleared } });
    if (wasRanked && board) { P.daily[board] = { score: final, ts: Date.now() }; A.profile.save(); A.rank.submit(board, { score: final, extra: { deck: run.deck, r: run.cleared } }); A.ach.emit("daily", {}); }
    const r = run; run = null; persist(); C().S.run = null;
    A.sfx.stamp(); setTimeout(win ? A.sfx.victory : A.sfx.lose, 300);
    C().verdict({
      kind: win ? "win" : "", level: r.cleared, title: win ? A.T("Expedición cobrada", "Expedition cashed out") : A.T("Fin de la expedición", "Expedition over"),
      text: A.tf("Superaste {r} rondas y llegaste al {act}. Puntos: {p} + bonus {b}.", "You cleared {r} rounds and reached {act}. Points: {p} + bonus {b}.", { r: r.cleared, act: A.tx(actInfo(r.act).n), p: A.fmt(r.score), b: A.fmt(bonus) }) + (rec ? A.T(" ¡Nuevo récord personal!", " New personal best!") : ""),
      stats: [[A.T("Puntuación final", "Final score"), final], [A.T("Rondas superadas", "Rounds cleared"), r.cleared], [A.T("Doblones ganados", "Doubloons earned"), r.stats.coinsEarned]],
      stamp: win ? A.T("GLORIA", "GLORY") : A.T("FIN", "END"), stampSub: win ? A.icon("u_star", "st") : A.icon("u_close", "st"), art: win ? "win" : "lose",
      buttons: [{ id: "nrBtn", cls: "btn-ink", label: A.T("Otra expedición", "Another expedition"), arrow: true, primary: true, onclick: () => C().showHub("adventure") }, { id: "hubBtn", cls: "btn-line", label: A.T("Menú", "Menu"), onclick: () => C().showHub() }],
    });
    C().map.setStyle(mapStyleFor(null)); A.adv.hideBars();
  }
  A.adv.endRun = endRun; A.adv.startRound = startRound; A.adv.openShop = openShop;
})(window.AIQ);
