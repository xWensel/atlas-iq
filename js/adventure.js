/*
 * Atlas IQ - AVENTURA (v0.9): el modo roguelike.
 * Eres un aventurero que descifra lugares. Cada RONDA es un tema concreto con un banco enorme de lugares (100+ por tema) y una
 * puntuacion objetivo que sube; entre rondas hay campamento (3 cartas y rolear), y cada acto acaba con un jefe.
 * Todo sale de una semilla: partidas aleatorias, y el Reto diario comparte semilla para clasificar. Necesita A.core (game.js) y A.RELICS.
 */
window.AIQ = window.AIQ || {};
(function (A) {
  const T = A.T, L = A.L, $ = id => document.getElementById(id), C = () => A.core;
  const RUNKEY = "atlasiq.run.v2";
  const ic = (id, cls) => A.icon(id, cls), CN = () => A.icon("coin", "cn");
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const L6 = s => { const [es, en, fr, pt, de, it] = s.split("|"); return { es, en, fr, pt, de, it }; };
  const suitRed = s => s === "s_pin" || s === "s_compass" || s === "heart";
  const ixs = (rank, suit) => `<span class="ix tl"><b>${rank}</b>${ic(suit)}</span><span class="ix br"><b>${rank}</b>${ic(suit)}</span>`;
  const R_NAMES = [L6("Común|Common|Commune|Comum|Gewöhnlich|Comune"), L6("Poco común|Uncommon|Peu commune|Incomum|Ungewöhnlich|Non comune"), L6("Rara|Rare|Rare|Rara|Selten|Rara"), L6("Legendaria|Legendary|Légendaire|Lendária|Legendär|Leggendaria")];

  /* ------------------------------------------------------------------ actos */
  const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  const ACTS = [
    { n: L("Acto I", "Act I"), t: L("Las rutas conocidas", "The known roads"), f: L("El gremio de cartógrafos te encarga tus primeras rutas.", "The Cartographers' Guild hands you your first routes.") },
    { n: L("Acto II", "Act II"), t: L("Más allá del mapa", "Beyond the map"), f: L("Las fronteras se difuminan y los nombres se vuelven raros.", "Borders blur and the names get strange.") },
    { n: L("Acto III", "Act III"), t: L("Terra Incognita", "Terra Incognita"), f: L("Nadie ha vuelto de aquí con un mapa completo.", "No one has come back from here with a complete map.") },
  ];
  const actInfo = act => ACTS[act] || { n: L("Acto " + (ROMAN[act] || act + 1), "Act " + (ROMAN[act] || act + 1)), t: L("Leyenda", "Legend"), f: L("Ya no hay guía: solo tu pulso.", "There is no guide now: only your aim.") };

  /* ------------------------------------------------------------------ temas de ronda (cada uno con un banco enorme) */
  const TOPIC_NAMES = {
    capital: [L6("Capitales del mundo (fáciles)|World capitals (easy)|Capitales du monde (faciles)|Capitais do mundo (fáceis)|Hauptstädte der Welt (leicht)|Capitali del mondo (facili)"), L6("Capitales del mundo (difíciles)|World capitals (hard)|Capitales du monde (difficiles)|Capitais do mundo (difíceis)|Hauptstädte der Welt (schwer)|Capitali del mondo (difficili)")],
    landmark: [L6("Monumentos y lugares famosos|Landmarks and famous places|Monuments et lieux célèbres|Monumentos e lugares famosos|Wahrzeichen und berühmte Orte|Monumenti e luoghi famosi"), L6("Maravillas del mundo (difíciles)|World wonders (hard)|Merveilles du monde (difficiles)|Maravilhas do mundo (difíceis)|Weltwunder (schwer)|Meraviglie del mondo (difficili)"), L6("Tesoros escondidos|Hidden treasures|Trésors cachés|Tesouros escondidos|Verborgene Schätze|Tesori nascosti")],
    city: [L6("Grandes ciudades|Big cities|Grandes villes|Grandes cidades|Große Städte|Grandi città"), L6("Ciudades importantes|Important cities|Villes importantes|Cidades importantes|Wichtige Städte|Città importanti"), L6("Ciudades difíciles|Hard cities|Villes difficiles|Cidades difíceis|Schwere Städte|Città difficili")],
    country: [L6("Países (haz clic dentro)|Countries (click inside)|Pays (clique dedans)|Países (clique dentro)|Länder (klicke hinein)|Paesi (clicca dentro)"), L6("Países difíciles|Hard countries|Pays difficiles|Países difíceis|Schwere Länder|Paesi difficili")],
    history: [L6("Batallas y sucesos famosos|Famous battles and events|Batailles et événements célèbres|Batalhas e acontecimentos famosos|Berühmte Schlachten und Ereignisse|Battaglie ed eventi famosi"), L6("Historia (difícil)|History (hard)|Histoire (difficile)|História (difícil)|Geschichte (schwer)|Storia (difficile)")],
    nature: [L6("Maravillas de la naturaleza|Natural wonders|Merveilles de la nature|Maravilhas da natureza|Naturwunder|Meraviglie della natura"), L6("Mares y montañas|Seas and mountains|Mers et montagnes|Mares e montanhas|Meere und Berge|Mari e montagne")],
    clue: [L6("Apodos y pistas|Nicknames and clues|Surnoms et indices|Apelidos e pistas|Spitznamen und Hinweise|Soprannomi e indizi")],
    mixed: [L6("¡Jackpot! De todo un poco|Jackpot! A bit of everything|Jackpot ! Un peu de tout|Jackpot! Um pouco de tudo|Jackpot! Von allem etwas|Jackpot! Un po' di tutto")],
  };
  const KIND_FACTOR = { capital: 1, city: 1, landmark: 0.9, nature: 1.5, battle: 0.9, event: 0.9, country: 0.7, clue: 1, water: 1.6, strait: 1.4 };
  /* 12 rondas: 3 actos de 4 (la 4.a es el jefe). Empieza facil y va cambiando de tema y subiendo el nivel. */
  const ROUNDS = [
    { topic: "capital", tier: 0 }, { topic: "landmark", tier: 0 }, { topic: "city", tier: 0 }, { topic: "country", tier: 0, boss: true },
    { topic: "capital", tier: 1 }, { topic: "history", tier: 0 }, { topic: "nature", tier: 0 }, { topic: "city", tier: 1, boss: true },
    { topic: "city", tier: 2 }, { topic: "landmark", tier: 1 }, { topic: "history", tier: 1 }, { topic: "mixed", tier: 1, boss: true },
  ];
  const roundDefOf = r => (r < ROUNDS.length ? ROUNDS[r] : (() => { const b = ROUNDS[4 + ((r - 4) % 8)]; return { ...b, tier: Math.min(2, b.tier + 1), boss: (r % 4) === 3 }; })());

  /* ------------------------------------------------------------------ banco de preguntas por tema y nivel */
  let POOLS = null;
  const kindOfHistory = t => (/^(battle|siege|fall of|.*\bwar\b|bombing|attack|normandy|gallipoli|dunkirk|tet )/i.test(t) ? "battle" : "event");
  const kindOfNature = t => (/\b(sea|ocean|gulf|bay)\b/i.test(t) ? "water" : /\b(strait|channel|canal|cape|drake|bosporus|bosphorus)\b/i.test(t) ? "strait" : "nature");
  function placeQ(row) {
    const [id, kind, tier, lat, lon, qc, names, fame] = row, cn = qc && A.PCOUNTRY && A.PCOUNTRY[qc], en = names.en;
    if (kind === "country") { const key = id.slice(2); if (!C().world.byName[key]) return null; return { t: "c", key, name: names, sub: { es: "", en: "" }, clue: false, answer: null, fact: {}, cid: [id], kind: "country", topic: "country", tier, fame: fame || 0 }; }
    if (lat == null) return null;
    const k = kind === "history" ? kindOfHistory(en) : kind === "nature" ? kindOfNature(en) : kind;
    return { t: "p", lat, lon, name: names, sub: cn || { es: "", en: "" }, clue: false, answer: null, fact: {}, cid: [id], kind: k, topic: kind, tier, fame: fame || 0 };
  }
  function pools() {
    if (POOLS) return POOLS; POOLS = {};
    const add = (topic, tier, q) => { const key = topic + "|" + tier; (POOLS[key] = POOLS[key] || []).push(q); };
    const seen = new Set();
    (A.PLACES || []).forEach(row => { const q = placeQ(row); if (q && !seen.has(q.cid[0])) { seen.add(q.cid[0]); add(q.topic, q.tier, q); } });
    // apodos (pistas) y respaldo con las preguntas antiguas si aun no existe el banco nuevo
    for (const camp of A.CAMPAIGNS) {
      if (!camp.levels[0] || !camp.levels[0].all) continue;
      for (const Lv of camp.levels) for (const q of Lv.all()) {
        const id = q.cid && q.cid[0]; if (!id || seen.has(id)) continue;
        const kind = q.clue ? "clue" : Lv.kind, topic = { capital: "capital", city: "city", landmark: "landmark", country: "country", place: "landmark", nature: "nature", water: "nature", strait: "nature", battle: "history", event: "history", clue: "clue" }[kind];
        if (!topic) continue;
        if (topic !== "clue" && (A.PLACES || []).length > 200) continue;               // con el banco nuevo, solo aportan las pistas
        seen.add(id); add(topic, clamp(Lv.tier || 0, 0, 2), { ...q, kind, topic, tier: clamp(Lv.tier || 0, 0, 2) });
      }
    }
    return POOLS;
  }
  const ROUND_POOL = 80;                                             // lugares distintos por ronda: de ahi salen las preguntas de cada ronda
  const CAP = { 1: 99, 2: 12, 3: 12, 4: 99, 5: 99, 6: 10, 7: 12, 8: 8, 9: 8, 10: 8, 11: 10, 12: 6 };   // maximo de lugares del mismo pais por ronda (ronda 1..12)
  const ROUND_KIND = ["capital", "landmark", "city", "country", "capital", "history", "nature", "city", "city", "landmark", "history", "mixed"];
  const byDiff = (a, b) => (a.tier - b.tier) || ((a.fame || 0) - (b.fame || 0));   // de mas facil a mas dificil dentro de un tipo
  const nk = t => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const nameKeys = q => [nk(q.name && q.name.en), nk(q.name && q.name.es)].filter(Boolean);
  /* Reparto de lugares entre las 12 rondas: cada lugar cae en UNA sola ronda (sin repetidos), la primera ronda de cada tema se queda con lo mas conocido,
     las siguientes con muestras repartidas del resto por dificultad, y el Jackpot con una mezcla de lo que sobra. Un maximo de lugares por pais mantiene variedad. */
  let ASSIGN = null;
  function assign() {
    if (ASSIGN) return ASSIGN;
    const P = pools(), out = Array.from({ length: 12 }, () => []), usedName = new Set(), left = [];
    const kindList = k => [].concat(...[0, 1, 2].map(t => P[k + "|" + t] || [])).sort(byDiff);
    const ctry = q => (q.t === "c" ? q.cid[0] : (q.sub && q.sub.en) || "");
    const spread = arr => { const n = arr.length, first = new Set(); if (n <= ROUND_POOL) return arr; for (let i = 0; i < ROUND_POOL; i++) first.add(Math.floor(i * n / ROUND_POOL)); return arr.filter((_, j) => first.has(j)).concat(arr.filter((_, j) => !first.has(j))); };   // primero un muestreo uniforme, luego el resto (de reserva)
    const pick = (cands, rnd) => {                                                                   // coge hasta 80 respetando el tope por pais y sin repetir nombres
      const cnt = {}, got = [], cap = CAP[rnd + 1];
      for (const q of cands) {
        if (got.length >= ROUND_POOL) break; const nm = nameKeys(q), c = ctry(q);
        if (nm.some(k => usedName.has(k)) || (c && (cnt[c] || 0) >= cap)) continue;
        nm.forEach(k => usedName.add(k)); if (c) cnt[c] = (cnt[c] || 0) + 1; got.push(q);
      }
      return got;
    };
    for (const kind of ["capital", "landmark", "city", "country", "history", "nature"]) {
      const rounds = ROUND_KIND.map((k, i) => (k === kind ? i : -1)).filter(i => i >= 0);
      let rest = kindList(kind);
      rounds.forEach((r, idx) => {
        let cands;
        if (idx === 0) cands = rest;                                                                   // la primera ronda: lo mas facil
        else { const per = Math.ceil(rest.length / (rounds.length - idx)); cands = spread(rest.slice(0, per)); }   // las demas: muestra repartida del tramo siguiente
        const got = pick(cands, r).sort(byDiff); out[r] = got;
        const taken = new Set(got.map(q => q.cid[0])); rest = rest.filter(q => !taken.has(q.cid[0]));
      });
      rest.forEach(q => left.push(q));
    }
    const groups = {}; left.filter(q => !nameKeys(q).some(k => usedName.has(k))).sort(byDiff).forEach(q => (groups[q.topic] = groups[q.topic] || []).push(q));
    const lists = Object.values(groups).map(spread), mixed = [];                                   // el Jackpot reparte a partes iguales entre temas
    for (let i = 0; mixed.length < ROUND_POOL * 3 && lists.some(l => i < l.length); i++) lists.forEach(l => { if (i < l.length) mixed.push(l[i]); });
    out[11] = pick(mixed, 11);
    return (ASSIGN = out);
  }
  /* carrete de una ronda (0-11); la Leyenda (12+) repite las rondas 5-12 */
  const poolFor = r => assign()[r < 12 ? r : 4 + ((r - 4) % 8)];
  const CONT = { af: L("África", "Africa"), na: L("Norteamérica", "North America"), sa: L("Sudamérica", "South America"), as: L("Asia", "Asia"), eu: L("Europa", "Europe"), oc: L("Oceanía", "Oceania") };
  const centre = o => { const f = C().world.byName[o.key], big = f.polys.reduce((a, b) => ((b.bbox[2] - b.bbox[0]) * (b.bbox[3] - b.bbox[1]) > (a.bbox[2] - a.bbox[0]) * (a.bbox[3] - a.bbox[1]) ? b : a)); return [(big.bbox[1] + big.bbox[3]) / 2, (big.bbox[0] + big.bbox[2]) / 2]; };
  const latlon = o => (o.t === "c" ? centre(o) : [o.lat, o.lon]);
  const continentOf = o => { const [la, lo] = latlon(o); return A.continent(la, lo); };

  /* ------------------------------------------------------------------ herramientas (activas, cargas por ronda) */
  const TOOLS = {
    sonar: { ico: "sonar", uses: 2, cost: 5, r: 1, n: L("Sonar", "Sonar"), d: L("Toca un punto del mapa: te dice a cuántos km está el objetivo (±6 %) y dibuja el anillo. Con tres sondas, triangulas.", "Tap a point: tells you how far the target is (±6%) and draws the ring. Three probes triangulate."), kind: "probe" },
    compass: { ico: "compass", uses: 3, cost: 4, r: 0, n: L("Brújula", "Compass"), d: L("Toca un punto: una flecha señala el rumbo (8 direcciones) hacia el objetivo.", "Tap a point: an arrow shows the heading (8 directions) to the target."), kind: "probe" },
    passport: { ico: "passport", uses: 1, cost: 5, r: 1, n: L("Pasaporte", "Passport"), d: L("Revela el país del lugar (o el continente, si es un país).", "Reveals the place's country (or the continent for a country)."), kind: "instant" },
    journal: { ico: "journal", uses: 1, cost: 4, r: 0, n: L("Cuaderno", "Field journal"), d: L("Lee la nota de campo del lugar antes de responder.", "Read the place's field note before answering."), kind: "instant" },
    hourglass: { ico: "hourglass", uses: 2, cost: 4, r: 0, n: L("Reloj de arena", "Hourglass"), d: L("+6 segundos en la pregunta actual.", "+6 seconds on the current question."), kind: "instant" },
    astrolabe: { ico: "astrolabe", uses: 1, cost: 6, r: 1, n: L("Astrolabio", "Astrolabe"), d: L("Endereza el mapa: sirve contra el Mundo del revés en esta pregunta.", "Turns the map upright: beats the Upside-down world for this question."), kind: "instant" },
    interruptor: { ico: "interruptor", uses: 1, cost: 8, r: 2, n: L("Interruptor", "Master switch"), d: L("Apaga todos los retos durante esta pregunta.", "Switches every challenge off for this question."), kind: "instant" },
    swapcard: { ico: "swapcard", uses: 1, cost: 6, r: 1, n: L("Carta de cambio", "Swap card"), d: L("Cambia esta pregunta por otro lugar de la ronda.", "Swaps this question for another place from the round."), kind: "instant" },
  };
  const BOSSES = {};                                                 // los jefes ahora son combinaciones de retos (js/challenges.js)
  const DECKS = {
    explorer: { ico: "deck_explorer", n: L("Explorador", "Explorer"), d: L("Un Sonar y 4 doblones. La baraja para aprender.", "A Sonar and 4 doubloons. The deck for learning."), tools: ["sonar"], perks: [], coins: 4, lives: 3, unlock: null },
    historian: { ico: "deck_historian", n: L("Historiador", "Historian"), d: L("Cuaderno + Diccionario. Las letras borradas no te frenan.", "Field journal + Dictionary. Faded letters won't stop you."), tools: ["journal"], perks: ["dictionary"], coins: 3, lives: 3, unlock: "adv_act1" },
    navigator: { ico: "deck_navigator", n: L("Navegante", "Navigator"), d: L("Dos brújulas y la Brújula de 16 rumbos. Nunca te pierdes.", "Two compasses and the 16-point compass. You never get lost."), tools: ["compass", "compass"], perks: ["compass16"], coins: 3, lives: 3, unlock: "adv_boss" },
    blind: { ico: "deck_blind", n: L("Aventurero ciego", "Blind adventurer"), d: L("Sin herramientas, con la Linterna de minero y 4 provisiones.", "No tools, with the Miner's lamp and 4 provisions."), tools: [], perks: ["miner"], coins: 6, lives: 4, unlock: "adv_win" },
  };
  A.ADV = { TOOLS, PERKS: A.RELICS, BOSSES, DECKS, ROUNDS, TOPIC_NAMES, roundDefOf, chalFor: r => chalFor(r) };

  /* ------------------------------------------------------------------ partida (run) */
  let run = null;
  A.adv = { get run() { return run; }, hasSave() { try { return !!localStorage.getItem(RUNKEY); } catch (e) { return false; } } };
  A.adv.poolStats = () => Object.fromEntries(Object.entries(pools()).map(([k, v]) => [k, v.length]));
  A.adv.roundPlaces = r => poolFor(r);
  A.adv.roundPool = r => poolFor(r).length;
  const persist = () => { try { if (run) localStorage.setItem(RUNKEY, JSON.stringify(run)); else localStorage.removeItem(RUNKEY); } catch (e) { /* sin almacenamiento */ } };

  const ascFx = a => ({ target: 1 + 0.1 * a, secs: -a, lives: a >= 3 ? -1 : 0, price: 1 + 0.1 * a, boss2: a >= 4 });
  const roundNo = () => run.act * 4 + run.round;
  const rdef = () => roundDefOf(roundNo());
  const isBoss = () => run.round === 3;
  const perkList = () => {                                           // el Comodin cartografo copia la reliquia de su derecha
    const R = A.RELICS, out = [];
    run.perks.forEach((id, i) => { const p = R[id]; if (!p) return; out.push(p); if (p.copy && run.perks[i + 1] && R[run.perks[i + 1]] && !R[run.perks[i + 1]].copy) out.push({ ...R[run.perks[i + 1]], copyOf: true }); });
    return out;
  };
  const has = flag => perkList().some(p => p[flag]);
  const sumFlag = flag => perkList().reduce((n, p) => n + (p[flag] || 0), 0);
  const owned = id => run.perks.includes(id);
  const target = () => { const t = { seconds: 0, target: 1 }; perkList().forEach(p => p.round && p.round(t, run)); const r = roundNo(), base = 7000 * Math.min(0.95, 0.3 + 0.05 * r) * (isBoss() ? 1.08 : 1) * ascFx(run.asc).target; return Math.round((base * t.target) / 50) * 50; };
  const shopCtx = () => { const x = { price: 0, freeReroll: 0, slots: 3 }; perkList().forEach(p => p.shop && p.shop(x, run)); return x; };
  const price = c => Math.max(1, Math.round(c * ascFx(run.asc).price) + shopCtx().price);
  const sellValue = id => Math.floor(A.RELICS[id].cost * (has("sellAll") ? 1 : 0.5));
  const gain = n => Math.round(n * (sumFlag("coinX") || 1));
  /* retos de la ronda r tras aplicar perks (Llave maestra, Talisman, inmunidades) */
  const chalFor = r => {
    const plan = A.chal.plan(run.seed + ((run.salt && run.salt[r]) ? ":" + run.salt[r] : ""), r, run.asc), boss = r % 4 === 3;
    let list = A.adv._force ? A.adv._force.map(id => ({ id, lv: 2 })) : plan.list.slice();
    const bribed = (run.bribed && run.bribed[r]) || []; if (bribed.length) list = list.filter(c => !bribed.includes(c.id));   // sobornados en el Campamento
    const skip = sumFlag("skipFirst"); if (skip) list = list.slice(skip);
    if (boss) { let ign = sumFlag("ignoreBoss"); list = list.filter(() => (ign > 0 ? (ign--, false) : true)); }
    list = list.filter(c => !perkList().some(p => (p.immune || []).includes(c.id)));
    return { list, combo: plan.combo, boss };
  };
  const omen = () => has("omen");

  A.adv.begin = function ({ deck = "explorer", asc = 0, seed, ranked = false, board = null } = {}) {
    const d = DECKS[deck] || DECKS.explorer;
    run = {
      v: 2, seed: seed || "run-" + Math.random().toString(36).slice(2, 10), deck, asc, ranked, board,
      act: 0, round: 0, attempt: 0, coins: d.coins, lives: d.lives + ascFx(asc).lives, maxLives: d.lives + ascFx(asc).lives,
      perks: d.perks.slice(), tools: {}, score: 0, cleared: 0, used: [], rerolls: 0, freeUsed: 0, shopN: 0, phase: "round", qi: 0, qn: 5, qTools: 0, rTools: 0, luckUsed: false, guardUsed: false,
      livesLostAct: 0, shieldAct: -1, leftSum: 0, roundScore: 0, rGood: 0, qTotal: 0, stats: { bulls: 0, best: 0, coinsEarned: 0 }, t0: Date.now(),
    };
    d.tools.forEach(t => addTool(t));
    persist(); A.ach.emit("adv", { kind: "start" }); A.profile.get().adv.runs++; A.profile.save();
    startRound();
  };
  A.adv.resume = function () {
    try { run = JSON.parse(localStorage.getItem(RUNKEY)); } catch (e) { run = null; }
    if (!run) return false;
    if (run.phase === "shop" || run.phase === "chest") openShop(run.phase === "chest");
    else if (run.phase === "verdict") afterVerdict(!!run.vBoss);                            // la ronda ya estaba superada y cobrada: seguimos al campamento
    else if (run.phase === "win") openShop(true);                                             // ya habias ganado: sigues hacia la Leyenda
    else if (run.phase === "retry") openShop(false);                                        // ronda fallida: vuelves al campamento para reintentar
    else if (run.phase === "round" && run.qi > 0 && run.qi < run.qn && run.curQ) { run.used = run.used.filter(id => !run.curQ.includes(id)); startRound(true); }   // sigue en la misma pregunta con las mismas preguntas
    else startRound();
    return true;
  };
  A.adv.abandon = () => { run = null; persist(); };
  A.adv.save = () => persist();
  A.adv.leave = () => { if (run) persist(); clearTimers(); A.chal.end(); A.dealer.enable(false); run = null; };
  A.adv.summary = () => { try { const r = run || JSON.parse(localStorage.getItem(RUNKEY)); return r ? { act: r.act + 1, round: r.round + 1, coins: r.coins, score: r.score, lives: r.lives } : null; } catch (e) { return null; } };
  A.adv.active = () => !!run;

  function toolMax(id) { const t = run.tools[id]; if (!t) return 0; const plus = perkList().reduce((n, p) => n + (p.toolBonus || 0) + ((p.toolPlus && p.toolPlus[id]) || 0), 0); return t.max + plus; }
  function addTool(id) { const t = run.tools[id]; if (t) t.max++; else run.tools[id] = { max: TOOLS[id].uses, left: TOOLS[id].uses }; }
  function refillTools() { for (const id in run.tools) run.tools[id].left = toolMax(id); }

  /* ---------------- ronda ---------------- */
  function pickQuestions(n) {
    const def = rdef(), list = poolFor(roundNo()), rr = A.rng(`${run.seed}:q:${roundNo()}:${run.attempt}`), used = new Set(run.used);
    let cand = list.filter(q => !used.has(q.cid[0]));
    if (cand.length < n) { run.used = []; cand = list.slice(); }
    const out = rr.shuffle(cand).slice(0, n);
    run.curQ = out.map(q => q.cid[0]); run.used = run.used.concat(run.curQ);
    return out.map(q => ({ ...q }));
  }
  function roundLevel() {
    const r = roundNo(), boss = isBoss(), def = rdef(), cf = chalFor(r), halve = boss && omen() ? 0.5 : 1;
    const ctx = { seconds: clamp(Math.round(26 - 1.0 * r + ascFx(run.asc).secs), 10, 28), target: 1 };
    perkList().forEach(p => p.round && p.round(ctx, run));
    ctx.seconds = Math.max(6, ctx.seconds);
    run.chal = cf.list; run.chalName = cf.combo ? cf.combo.n : null; run.chalHalve = halve;
    const rules = cf.list.map(c => (c.id === "storm" ? "clock" : c.id)).filter(id => ["wind", "clock", "silence"].includes(id));
    if (rules.includes("clock")) ctx.seconds = Math.max(6, Math.round(ctx.seconds * (1 - 0.45 * halve)));
    run.boss = rules; run.wind = null;
    if (rules.includes("wind")) { const wr = A.rng(`${run.seed}:wind:${r}:${run.attempt}`); run.wind = { brg: Math.round(wr() * 360), km: Math.round((160 + 40 * run.act) * halve) }; }
    const qs = pickQuestions(run.qn), info = actInfo(run.act), tn = TOPIC_NAMES[def.topic][Math.min(def.tier, TOPIC_NAMES[def.topic].length - 1)];
    run.topic = def.topic; run.tier = def.tier;
    return {
      name: `${A.tx(info.n)} · ${boss ? A.T("Jefe", "Boss") : A.tf("Ronda {n}/3", "Round {n}/3", { n: run.round + 1 })}`, topicName: tn, topic: def.topic, kind: "adventure", boss: !!boss,
      seconds: ctx.seconds, advance: target(), maxPerQ: 1400, bonus: false, plainName: true, questions: () => qs,
      score: (q, km, left) => A.adv.score(q, km, left, true).sc,
    };
  }
  function startRound(keep) {
    run.phase = "round";
    if (!keep) { run.qi = 0; run.luckUsed = false; run.guardUsed = false; run.rTools = 0; run.leftSum = 0; run.roundScore = 0; run.rGood = 0; run.streak = 0; refillTools(); }
    const Lv = roundLevel(), S = C().S;
    S.run = run; S.camp = { id: "adv", mode: "adventure", title: { es: "Aventura", en: "Adventure" }, home: { lat: 20, lon: 10, zoom: 1 }, levels: [Lv] };
    S.runTotal = run.score; S.runMax = 0; C().map.setHome(S.camp.home); C().map.setStyle(mapStyleFor());
    A.dealer.enable(true); A.chal.begin(run.chal, A.chal.fx(perkList()), { seed: run.seed, round: roundNo(), halve: run.chalHalve });
    persist(); A.ach.emit("adv", { kind: "round", act: run.act }); C().startLevel(0);
    if (keep) { S.qi = run.qi; S.levelScore = run.roundScore; S.streak = run.streak || 0; S.hits = run.rGood; C().updateHud && C().updateHud(); }
    if (Lv.boss) setTimeout(() => A.sfx.boss(), 200);
  }
  function mapStyleFor() { return A.MAPSTYLES[A.skin] || A.MAPSTYLES.casino; }
  const DIRS16 = [["N", "N"], ["NNE", "NNE"], ["NE", "NE"], ["ENE", "ENE"], ["E", "E"], ["ESE", "ESE"], ["SE", "SE"], ["SSE", "SSE"], ["S", "S"], ["SSW", "SSO"], ["SW", "SO"], ["WSW", "OSO"], ["W", "O"], ["WNW", "ONO"], ["NW", "NO"], ["NNW", "NNO"]];
  const dirName = brg => { const idx = Math.round((((brg % 360) + 360) % 360) / 22.5) % 16, d = has("compass16") ? DIRS16[idx] : DIRS16[Math.round(idx / 2) % 8 * 2]; return A.lang === "es" ? d[1] : d[0]; };
  A.adv.introHtml = Lv => {
    const info = actInfo(run.act), def = rdef(), list = run.chal || [];
    const chips = list.map(c => { const d = A.CHAL[c.id]; return `<div class="adv-debuff k-${d.kind}"><span>${ic(d.ico)}</span><div><b>${A.tx(d.n)} <i class="ch-lv">${"●".repeat(c.lv || 1)}</i></b><i>${A.tx(d.d)}</i>${c.id === "wind" && run.wind ? `<em>${A.T("Viento hacia", "Wind toward")} ${dirName(run.wind.brg)} · ${run.wind.km} km</em>` : ""}</div></div>`; }).join("");
    const kind = Lv.boss ? "boss" : run.round === 0 ? "small" : "big", inner = Lv.boss ? "skull" : run.round === 0 ? "s_pin" : "s_compass";
    return `<div class="intro-in adv${Lv.boss ? " is-boss" : ""}"><div class="intro-left"><div class="intro-num blind">${A.blind(kind, inner)}</div><div class="intro-body">
      <span class="tag">${A.tx(info.n)} · ${A.tx(info.t)}</span><h2>${A.tx(Lv.topicName)}</h2>
      ${Lv.boss && run.chalName ? `<p class="boss-combo">${A.tx(run.chalName)}</p>` : ""}
      <p class="intro-sub">${Lv.boss ? A.T("Jefe del acto", "Act boss") : A.T("Ronda", "Round") + " " + (run.round + 1)} · ${A.tx(info.f)}</p>
      <p class="adv-goal">${A.T("Objetivo", "Target")} <b>${A.fmt(Lv.advance)}</b> · ${run.qn} ${A.T("lugares", "places")} · ${Lv.seconds} s</p>
      ${list.length ? `<h4 class="adv-chal-h">${A.T("El crupier toca la mesa", "The dealer touches the table")}</h4>` : ""}${chips}</div></div>
      <div class="intro-art">${A.pic("topic_" + (def.topic === "mixed" ? "mixed" : def.topic))}<div class="intro-dealer" id="introDealer"></div></div></div>`;
  };
  /* el crupier habla en la intro: saludo o reparto + una frase por reto (y protesta si ya llevas el perk que lo anula) */
  A.adv.introReady = Lv => {
    const host = $("introDealer"); if (!host || !run) return 0; const D = A.dealer, list = run.chal || [];
    D.enable(true); D.dock(host); const seq = [];
    const first = run.act === 0 && run.round === 0 && !run.qTotal;
    seq.push(Lv.boss ? { line: D.line("boss"), mood: "boss" } : !list.length ? { line: D.line(first ? "hello" : "calm"), mood: "sly" } : { line: D.line("deal"), mood: "sly" });
    list.slice(0, Lv.boss ? 3 : 2).forEach(c => { const ln = D.line(c.id); if (ln) seq.push({ line: ln, mood: "sly" }); });
    const counters = list.some(c => (A.CHAL[c.id].counters || []).some(id => owned(id)));
    if (counters) seq.push({ line: D.line("counter"), mood: "angry" });
    D.sequence(seq); return seq.reduce((n, it) => n + A.tx(it.line).length * 40 + 900, 0);
  };
  A.adv.introEnd = () => { A.dealer.dock(null); A.dealer.hide(); };

  /* ---------------- puntuacion de una pregunta ---------------- */
  A.adv.score = function (o, km, left, noSide) {
    const Lv = C().S.camp.levels[0], limit = C().S.limit || Lv.seconds, halve = omen() ? 0.5 : 1, boss = run.boss || [], S = C().S;
    const r = roundNo(), c = {
      o, km, left, limit, kind: o.kind || (o.clue ? "clue" : "place"), topic: o.topic || "mixed", cont: continentOf(o), coins: 0, lines: [], xmult: 1, mult: 1, streakStep: 0.2, luck: false,
      scale: clamp(1500 * Math.pow(0.94, r), 300, 1500) * (KIND_FACTOR[o.kind] || 1),
    };
    perkList().forEach(p => p.q && p.q(c, run));
    if (km != null) perkList().forEach(p => p.km && p.km(c, run));
    let dist = km == null ? 0 : Math.round(1000 * Math.exp(-c.km / c.scale));
    if (c.luck && km != null && dist < 400) { dist = 700; c.lines.push(["luck", A.tx(A.RELICS.luck.n), "→ 700"]); if (!noSide) run.luckUsed = true; }
    const time = km == null ? 0 : Math.round(400 * Math.max(0, left / limit) * (0.3 + 0.7 * dist / 1000));
    c.dist = dist; c.time = time; c.chips = dist + time;
    const ratio = dist / 1000; let streak = km != null && ratio >= 0.6 ? S.streak + 1 : 0;
    if (km != null && ratio < 0.6 && S.streak > 0 && has("guard") && !run.guardUsed) { streak = S.streak; if (!noSide) run.guardUsed = true; c.lines.push(["streakguard", A.tx(A.RELICS.streakguard.n), "✓"]); }
    c.streak = streak; c.mult = 1 + (streak >= 2 ? Math.min(1.5, c.streakStep * (streak - 1)) : 0);
    c.qi = run.qi;
    if (km != null) perkList().forEach(p => { if (!p.post) return; const tx = p.post(c, run); if (tx) c.lines.push([p.ico, A.tx(p.n), tx]); });
    c.total = km == null ? 0 : Math.round(c.chips * c.mult * c.xmult);
    c.coinsBase = km == null ? 0 : dist >= 960 ? 2 : dist >= 750 ? 1 : 0;
    c.coins += c.coinsBase; c.coins = gain(c.coins);
    c.sc = { dist, time, distMax: 1000, timeMax: 400 };
    return c;
  };
  let reactT = 0;                                                     // reaccion pendiente del crupier a la ultima respuesta
  A.adv.afterQuestion = function (res) {
    clearTimers();
    run.coins += res.coins; run.stats.coinsEarned += res.coins; if (res.dist >= 960) run.stats.bulls++; run.stats.best = Math.max(run.stats.best, res.total);
    if (res.dist >= 750) run.rGood++; run.leftSum += Math.max(0, res.left || 0); run.roundScore += res.total; run.qTotal++;
    if (res.dist >= 750 && has("recycle")) { const id = Object.keys(run.tools).find(k => run.tools[k].left < toolMax(k)); if (id) run.tools[id].left++; }
    run.streak = res.streak || 0; run.qi++; run.qTools = 0; persist(); A.ach.emit("adv", { kind: "hold", coins: run.coins, perks: run.perks.length });
    const kind = res.km == null ? "timeout" : res.dist >= 960 ? "bull" : res.dist < 400 ? "miss" : res.streak >= 3 ? "streak" : res.dist >= 750 ? "good" : null;
    clearTimeout(reactT); if (kind) reactT = setTimeout(() => A.dealer.react(kind), 1300);
  };

  /* ---------------- pistas gratis de reliquias ---------------- */
  let timers = [];
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
  const hemisphere = o => { const [la, lo] = latlon(o); return A.T(la >= 0 ? "Hemisferio norte" : "Hemisferio sur", la >= 0 ? "Northern hemisphere" : "Southern hemisphere") + " · " + A.T(lo >= 0 ? "este" : "oeste", lo >= 0 ? "east" : "west"); };
  const initialHint = o => { const nm = A.tx(o.name).trim(); return A.tf("Empieza por «{l}»", "Starts with “{l}”", { l: nm[0] || "?" }); };
  let NE_BY_EN = null;                                               // nombre ingles (Wikipedia/Wikidata) -> nombre del mapa (Natural Earth)
  const neOf = nameEn => {
    const W = C().world.byName; if (!nameEn) return null; if (W[nameEn]) return nameEn;
    if (!NE_BY_EN) { NE_BY_EN = {}; (A.PLACES || []).forEach(r => { if (r[1] === "country") NE_BY_EN[r[6].en] = r[0].slice(2); }); }
    const ne = NE_BY_EN[nameEn] || (A.CODEX_COUNTRY || {})[nameEn]; return ne && W[ne] ? ne : null;
  };
  function revealCountry(o) {
    if (o.t === "c") { noteH(A.T("Continente: ", "Continent: ") + continentName(o), "passport"); return; }
    const ne = neOf(o.sub && o.sub.en);
    if (ne && C().world.byName[ne]) { C().map.setMarks({ highlight: ne }); noteH(A.tx(o.sub), "passport"); }
    else noteH(A.T("Continente: ", "Continent: ") + continentName(o), "passport");
  }
  const hints = [];
  const noteH = (txt, icon) => { hints.push(txt); const el = $("factText"); el.textContent = hints.join("  ·  "); if (icon) el.insertAdjacentHTML("afterbegin", A.icon(icon, "sm")); };
  A.adv.onQuestion = function () {
    clearTimers(); hints.length = 0; run.qTools = 0; run.probes = []; run.tool = null; run.windOff = false; const S = C().S; S.tool = null; renderBars();
    const o = S.qs[S.qi]; if (!o) return;
    const fx = A.chal.fx(perkList()); A.chal.question(o, run.qi);
    A.pointer.set({ tool: null, fx, noCountry: o.t === "c", windFn: run.wind ? windGhost : null, distFn: (lon, lat) => { const oo = C().S.qs[C().S.qi]; if (!oo) return null; return oo.t === "c" ? A.geo.distToFeature(lon, lat, C().world.byName[oo.key]) : A.geo.haversine(lat, lon, oo.lat, oo.lon); } });
    const api = {
      fact: o2 => { const txt = A.tx(o2.fact) || (A.factOf && A.factOf(o2)) || ""; if (txt) noteH(txt, "journal"); },
      note: noteH, continent: o2 => continentName(o2), hemisphere, initial: initialHint, country: revealCountry, addTime: s => { S.limit += s; },
      later: (sec, fn) => { const left = S.limit - (performance.now() - S.t0 - S.pausedAcc) / 1000, delay = (left - sec) * 1000; if (delay > 0) timers.push(setTimeout(() => { if (S.phase === "asking" && !S.paused) fn(); }, delay)); },
    };
    perkList().forEach(p => p.open && p.open(api, o, run));
  };
  const windGhost = (px, py) => { const m = C().map; if (!run || !run.wind || run.windOff) return null; const [lon, lat] = m.screenToLonLat(px, py), a = A.adv.adjust(lon, lat), p = m.lonLatToScreen(a.lon, a.lat); return [p[0] - px, p[1] - py]; };
  A.adv.decorate = o => A.chal.decorate(o);
  /* el viento desvia el clic */
  A.adv.adjust = function (lon, lat) {
    if (!run || !run.wind || run.windOff) return { lon, lat };
    const D = Math.PI / 180, d = run.wind.km / 6371, la = lat * D, lo = lon * D, b = run.wind.brg * D;
    const la2 = Math.asin(Math.sin(la) * Math.cos(d) + Math.cos(la) * Math.sin(d) * Math.cos(b));
    const lo2 = lo + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(la), Math.cos(d) - Math.sin(la) * Math.sin(la2));
    return { lon: ((lo2 / D + 540) % 360) - 180, lat: clamp(la2 / D, -85, 85) };
  };

  /* ---------------- herramientas ---------------- */
  A.adv.useTool = function (id) {
    const S = C().S; if (!run || S.phase !== "asking" || S.paused) return;
    const t = run.tools[id], def = TOOLS[id]; if (!t) return;
    if ((run.boss || []).includes("silence")) { A.sfx.deny(); noteH(A.T("El Silencio anula tus herramientas.", "Silence cancels your tools.")); return; }
    if (t.left <= 0) { A.sfx.deny(); return; }
    if (def.kind === "probe") {
      S.tool = S.tool === id ? null : id; A.sfx.flip(!!S.tool); C().map.setPick(true);
      note(S.tool ? (id === "sonar" ? A.T("Toca el mapa para lanzar una sonda…", "Tap the map to send a probe…") : A.T("Toca el mapa para orientar la brújula…", "Tap the map to aim the compass…")) : "");
      renderBars(); return;
    }
    t.left--; run.qTools++; run.rTools++; A.sfx.buy();
    const o = C().S.qs[S.qi];
    if (id === "hourglass") { S.limit += 6; noteH(A.T("+6 segundos", "+6 seconds")); }
    else if (id === "astrolabe") { A.chal.upright(); A.sfx.flip(true); noteH(A.T("Mapa enderezado", "Map upright")); }
    else if (id === "interruptor") { A.chal.suspend(); run.windOff = true; A.sfx.restore(); noteH(A.T("Retos apagados en esta pregunta", "Challenges off for this question")); A.dealer.react("counter"); }
    else if (id === "swapcard") { if (!swapQuestion()) { t.left++; run.qTools--; run.rTools--; A.sfx.deny(); return; } }
    else if (id === "journal") { const txt = o.clue ? A.tf("Empieza por «{l}» y está en {c}.", "Starts with “{l}” and lies in {c}.", { l: A.tx(o.answer).trim()[0], c: continentName(o) }) : (A.tx(o.fact) || (A.factOf && A.factOf(o)) || A.T("Sin notas para este lugar.", "No notes for this place.")); noteH(txt, "journal"); }
    else if (id === "passport") revealCountry(o);
    persist(); renderBars();
  };
  /* Carta de cambio: otro lugar de la ronda en vez del actual */
  function swapQuestion() {
    const S = C().S, list = poolFor(roundNo()), used = new Set(run.used), cand = list.filter(q => !used.has(q.cid[0]));
    if (!cand.length) { noteH(A.T("No quedan lugares para cambiar.", "No places left to swap.")); return false; }
    const q = { ...A.rng(`${run.seed}:swap:${roundNo()}:${S.qi}:${run.qTotal}`).pick(cand) };
    if (run.curQ) run.curQ[S.qi] = q.cid[0]; run.used.push(q.cid[0]); S.qs[S.qi] = q;
    C().map.clearMarks(); C().refreshPrompt(); hints.length = 0; $("factText").textContent = ""; A.adv.onQuestion(); A.sfx.card(); return true;
  }
  const continentName = o => A.tx(CONT[continentOf(o)] || L("el mar", "the sea"));
  const note = (txt, icon) => { const el = $("factText"); el.textContent = txt || ""; if (txt && icon) el.insertAdjacentHTML("afterbegin", A.icon(icon, "sm")); };
  A.adv.probe = function (lon, lat) {
    const S = C().S, id = S.tool, t = run.tools[id]; if (!t || t.left <= 0) { S.tool = null; renderBars(); return; }
    const o = S.qs[S.qi]; t.left--; run.qTools++; run.rTools++; S.tool = null;
    const km = o.t === "c" ? A.geo.distToFeature(lon, lat, C().world.byName[o.key]) : A.geo.haversine(lat, lon, o.lat, o.lon);
    const list = (run.probes = run.probes || []), P = { lon, lat };
    if (id === "sonar") {
      const fz = (A.rng(run.seed + ":sn:" + roundNo() + ":" + S.qi + ":" + list.length)() - 0.5) * (has("sonarErr") ? 0.04 : 0.12), shown = km * (1 + fz);
      P.km = Math.max(0, shown); P.label = km === 0 && o.t === "c" ? A.T("¡Dentro del país!", "Inside the country!") : "≈ " + A.fmt(Math.round(shown / (shown > 500 ? 50 : 10)) * (shown > 500 ? 50 : 10)) + " km";
      if (km === 0 && o.t === "c") P.km = 0;
      A.sfx.sonar(clamp(1 - km / 8000, 0, 1));
    } else { const brg = bearing(lat, lon, latlon(o)), step = has("compass16") ? 22.5 : 45, snap = Math.round(brg / step) * step; P.bearing = snap; P.label = dirName(snap); A.sfx.sonar(0.8); }
    list.push(P); C().map.setProbes(list); persist(); note(hints.join("  ·  ")); renderBars();
  };
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
    bar.innerHTML = `<div class="ab-top"><span class="ab-act" data-tf="abact">${A.tx(info.n)}</span><span class="ab-coins" id="abCoins" data-tf="abcoins">${CN()}<b>${run.coins}</b></span><span class="ab-hearts" data-tf="abhearts">${hearts()}</span></div>
      <div class="ab-perks">${run.perks.map(id => `<span class="ab-perk" title="${A.tx(A.RELICS[id].n)} — ${A.tx(A.RELICS[id].d)}">${ic(id)}</span>`).join("")}</div>
      ${(run.chal || []).length ? `<div class="ab-chal">${run.chal.map(c => A.chal.chip(c, true)).join("")}</div>` : ""}
      ${run.wind ? `<div class="ab-wind"><svg viewBox="-12 -12 24 24" style="transform:rotate(${run.wind.brg}deg)"><path d="M0 -9 L6 4 L0 1 L-6 4 Z"/></svg><span>${dirName(run.wind.brg)} · ${run.wind.km} km</span></div>` : ""}`;
    const ids = Object.keys(run.tools);
    tb.classList.toggle("hidden", !ids.length || C().S.phase !== "asking");
    tb.innerHTML = ids.map((id, i) => { const t = run.tools[id], on = C().S.tool === id, off = t.left <= 0 || silenced; return `<button class="tool pc-hand${on ? " on" : ""}${off ? " off" : ""}" data-tool="${id}" style="--r:${((i - (ids.length - 1) / 2) * 6).toFixed(1)}deg" title="${A.tx(TOOLS[id].n)} — ${A.tx(TOOLS[id].d)}"><span class="ix tl"><b>A</b>${ic("s_palm")}</span><span class="tl-ico felt">${ic(TOOLS[id].ico)}</span><b>${A.tx(TOOLS[id].n)}</b><span class="tl-pips">${Array.from({ length: toolMax(id) }, (_, k) => `<i class="${k < t.left ? "on" : ""}"></i>`).join("")}</span><kbd>${i + 1}</kbd></button>`; }).join("");
    tb.querySelectorAll(".tool").forEach(b => (b.onclick = () => A.adv.useTool(b.dataset.tool)));
    if (A.pointer) A.pointer.set({ tool: C().S.tool });
  }
  A.adv.refresh = renderBars;
  A.adv.hideBars = () => { const a = $("advBar"), b = $("toolBar"); if (a) a.classList.add("hidden"); if (b) b.classList.add("hidden"); };
  A.adv.hudTitle = () => { const Lv = C().S.camp.levels[0]; return `${A.tx(Lv.name)} · ${A.tx(Lv.topicName)} · ${A.T("Objetivo", "Target")} ${A.fmt(Lv.advance)}`; };
  A.adv.toolKey = n => { const ids = run ? Object.keys(run.tools) : []; if (ids[n]) A.adv.useTool(ids[n]); };
  A.adv.cancelTool = () => { const S = C().S; if (S.tool) { S.tool = null; note(hints.join("  ·  ")); renderBars(); } };

  /* ---------------- fin de ronda ---------------- */
  A.adv.roundEnd = function () {
    const S = C().S, Lv = S.camp.levels[0], pass = S.levelScore >= Lv.advance, boss = isBoss();
    S.phase = "levelEnd"; A.adv.hideBars(); clearTimers(); clearTimeout(reactT); A.chal.end(); C().map.setStyle(mapStyleFor());
    if (pass) {
      run.score += S.levelScore; run.cleared++; S.runTotal = run.score;
      const x = { coins: 3 + (boss ? 4 : 0) }, lines = [[A.T("Ronda superada", "Round cleared"), "+" + x.coins]];
      const cap = has("interest") ? 6 : 3, interest = Math.min(cap, Math.floor(run.coins / 5));
      if (interest) { x.coins += interest; lines.push([A.T("Interés (1 por cada 5)", "Interest (1 per 5)"), "+" + interest]); }
      perkList().forEach(p => { if (p.clear) { const y = { coins: 0 }, tx = p.clear(y, run); if (y.coins) { x.coins += y.coins; lines.push([A.tx(p.n), tx || "+" + y.coins]); } } });
      const got = gain(x.coins); if (got !== x.coins) lines.push([A.T("Doblones ×2", "Doubloons ×2"), "+" + (got - x.coins)]);
      run.coins += got; run.stats.coinsEarned += got;
      A.ach.emit("adv", { kind: "clear", tools: run.rTools }); if (boss) { A.ach.emit("adv", { kind: "boss" }); A.profile.get().adv.boss++; }
      A.sfx.stamp(); setTimeout(A.sfx.clear, 300);
      const actDone = boss, winAct = actDone ? run.act + 1 : 0;
      if (actDone) { const flawless = run.livesLostAct === 0; A.ach.emit("adv", { kind: "act", act: winAct, flawless, asc: run.asc }); run.livesLostAct = 0; A.profile.get().adv.bestAct = Math.max(A.profile.get().adv.bestAct || 0, winAct); }
      A.profile.get().adv.bestRound = Math.max(A.profile.get().adv.bestRound, roundNo() + 1);
      run.phase = "verdict"; run.vBoss = boss; persist(); A.profile.save();
      C().verdict({
        kind: "ok", level: roundNo() + 1, tag: `${A.tx(actInfo(run.act).n)} · ${boss ? A.T("Jefe", "Boss") : A.T("Ronda", "Round") + " " + (run.round + 1)}`, title: boss ? A.T("¡Jefe derrotado!", "Boss defeated!") : A.T("Ronda superada", "Round cleared"),
        text: `${A.fmt(S.levelScore)} / ${A.fmt(Lv.advance)}`, lines,
        stats: [[A.T("Puntos de la ronda", "Round points"), S.levelScore], [A.T("Total de la expedición", "Expedition total"), run.score], [A.T("Doblones", "Doubloons"), run.coins]],
        stamp: A.T("SUPERADA", "CLEARED"), stampSub: String(roundNo() + 1).padStart(2, "0"), art: boss ? "chest" : "win",
        buttons: [{ id: "nlBtn", cls: "btn-ink", label: boss ? A.T("Abrir el cofre del jefe", "Open the boss chest") : A.T("Al campamento", "To camp"), arrow: true, primary: true, onclick: () => afterVerdict(boss) }, { id: "vdMenu", cls: "btn-line", label: A.T("Menú", "Menu"), onclick: () => C().runMenu(), keep: true }],
      });
      setTimeout(() => A.dealer.react("roundWin"), 700);                    // el crupier protesta (antes estas frases nunca se decian)
    } else {
      const shielded = has("shieldAct") && run.shieldAct !== run.act;
      if (shielded) run.shieldAct = run.act; else { run.lives--; run.livesLostAct++; }
      run.attempt++; run.phase = "retry"; persist();
      A.sfx.stamp(); setTimeout(A.sfx.lose, 300);
      if (run.lives <= 0) return endRun(false);
      C().verdict({
        kind: "", level: roundNo() + 1, tag: `${A.tx(actInfo(run.act).n)} · ${boss ? A.T("Jefe", "Boss") : A.T("Ronda", "Round") + " " + (run.round + 1)}`, title: A.T("No llegaste al objetivo", "Target missed"),
        text: (shielded ? A.T("¡El Escudo te salva: no pierdes provisión! ", "The Shield saves you: no provision lost! ") : "") + A.tf("Te quedaste en {s} de {a}. Te quedan {n} provisiones.", "You scored {s} of {a}. You have {n} provisions left.", { s: A.fmt(S.levelScore), a: A.fmt(Lv.advance), n: run.lives }),
        stats: [[A.T("Puntos de la ronda", "Round points"), S.levelScore], [A.T("Objetivo", "Target"), Lv.advance]], stamp: A.T("FALLIDA", "FAILED"), stampSub: String(run.lives), art: "lose",
        buttons: [{ id: "rtBtn", cls: "btn-ink", label: A.T("Reintentar con lugares nuevos", "Retry with new places"), arrow: true, primary: true, onclick: () => openShop(false) }, { id: "abBtn", cls: "btn-line", label: A.T("Abandonar", "Abandon"), onclick: () => endRun(false) }],
      });
      setTimeout(() => A.dealer.react("roundFail"), 700);
    }
  };
  function afterVerdict(boss) { if (boss && run.act + 1 === 3 && !run.won) return winScreen(); nextStep(boss); }
  function nextStep(boss) {
    if (boss) { run.act++; run.round = 0; run.attempt = 0; perkList().forEach(p => p.actStart && p.actStart(run)); openShop(true); }
    else { run.round++; run.attempt = 0; openShop(false); }
  }
  function winScreen() {
    run.won = true; run.act++; run.round = 0; run.attempt = 0; run.phase = "win"; persist(); A.sfx.victory();
    A.profile.get().adv.wins++; A.profile.save();
    C().verdict({
      kind: "win", level: 12, tag: A.T("Tres actos completados", "Three acts completed"), title: A.T("¡Terra Incognita conquistada!", "Terra Incognita conquered!"),
      text: A.T("Has completado los tres actos. Puedes cobrar tu gloria ahora o seguir hacia la Leyenda: rondas infinitas cada vez más duras, con el mismo marcador.", "You've completed all three acts. Cash out your glory now, or push on into Legend: endless, ever-harder rounds on the same scoreboard."),
      stats: [[A.T("Total de la expedición", "Expedition total"), run.score], [A.T("Doblones", "Doubloons"), run.coins]], stamp: A.T("VICTORIA", "VICTORY"), stampSub: A.icon("u_star", "st"), art: "win",
      buttons: [{ id: "legBtn", cls: "btn-ink", label: A.T("Seguir a la Leyenda", "Push into Legend"), arrow: true, primary: true, onclick: () => openShop(true) }, { id: "endBtn", cls: "btn-line", label: A.T("Cobrar y terminar", "Cash out"), onclick: () => endRun(true) }],
    });
  }

  /* ---------------- campamento: tres cartas (se pueden cambiar pagando) ---------------- */
  function offers(chest) {
    const rr = A.rng(`${run.seed}:shop:${roundNo()}:${run.shopN}:${chest ? 1 : 0}`), R = A.RELICS, out = [];
    const relics = Object.keys(R).filter(id => !owned(id) && (chest ? true : R[id].r < 3));
    const up = new Set(); chalFor(roundNo()).list.forEach(c => (A.CHAL[c.id].counters || []).forEach(id => up.add(id)));
    const wt = id => { const r = R[id].r; return (chest ? [30, 35, 25, 10][r] : [60, 30 + run.act * 4, 10 + run.act * 5][r]) * (up.has(id) ? 2.6 : 1); };   // los perks que anulan los retos que vienen salen mas
    const bag = relics.slice();
    const draw = () => { const tot = bag.reduce((n, id) => n + wt(id), 0); let x = rr() * tot; for (let i = 0; i < bag.length; i++) { x -= wt(bag[i]); if (x <= 0) return bag.splice(i, 1)[0]; } return bag.pop(); };
    const slots = chest ? 3 : shopCtx().slots;
    for (let i = 0; i < slots; i++) {
      const roll = rr();
      if (!chest && roll < 0.16) { const tk = Object.keys(TOOLS).filter(id => !out.some(o => o.id === id)); if (tk.length) { out.push({ k: "tool", id: rr.pick(tk) }); continue; } }
      if (!chest && roll > 0.93 && run.lives < run.maxLives && !out.some(o => o.k === "life")) { out.push({ k: "life" }); continue; }
      if (bag.length) out.push({ k: "perk", id: draw() });
    }
    return out;
  }
  function openShop(chest) {
    const S = C().S; S.phase = "shop"; A.adv.hideBars(); clearTimers(); A.chal.end(); A.dealer.hide(); run.phase = chest ? "chest" : "shop";
    const key = `${roundNo()}:${run.shopN}:${chest}`;
    if (!run.stock || run.stockKey !== key) { run.stock = offers(chest); run.stockKey = key; run.bought = []; if (run.shopKey !== `${roundNo()}:${chest}`) { run.shopKey = `${roundNo()}:${chest}`; run.rerolls = 0; run.freeUsed = 0; } }
    persist(); renderShop(chest);
  }
  /* banda "proxima ronda": los retos que vienen (con la Mirilla, tambien la siguiente) */
  const nextHtml = () => {
    const r = roundNo(), rows = [r]; if (has("spy")) rows.push(r + 1);
    const html = rows.map((rr, k) => {
      const cf = chalFor(rr), t = cf.boss ? A.T("Jefe", "Boss") : A.T("Ronda", "Round") + " " + ((rr % 4) + 1), done = (run.bribed && run.bribed[rr]) || [];
      const chips = cf.list.map(c => k === 0 ? `<button class="ch-buy" data-r="${rr}" data-id="${c.id}" data-tt="${A.T("Sobornar al crupier: quita este reto de la próxima ronda", "Bribe the dealer: removes this challenge from the next round")}">${A.chal.chip(c, true)}<span class="cb-p">${CN()}${bribePrice(c, cf.boss)}</span></button>` : A.chal.chip(c, true)).join("")
        + done.map(id => `<span class="ch-chip sm done" data-tt="${A.T("Sobornado", "Bribed")}"><b>${A.tx(A.CHAL[id].n)}</b></span>`).join("");
      return `<div class="tb-next-row${k ? " far" : ""}"><span class="tb-next-h">${k ? A.T("Después", "Then") : A.T("Próxima ronda", "Next round")} · ${t}${cf.boss && cf.combo ? " · " + A.tx(cf.combo.n) : ""}</span>${chips || `<span class="tb-next-none">${A.T("Sin trucos", "No tricks")}</span>`}${k === 0 && cf.list.length ? `<button class="chipbtn ch-reroll" id="chalReroll" data-tt="${A.T("Barajar: el crupier elige otros retos para la próxima ronda", "Reshuffle: the dealer picks other challenges for the next round")}">${ic("dice", "sm")}<span>${A.T("Barajar retos", "Reshuffle")}</span><em>${CN()}${chalRerollCost()}</em></button>` : ""}</div>`;
    }).join("");
    return `<div class="tb-next">${html}</div>`;
  };
  const bribePrice = (c, boss) => { const d = A.CHAL[c.id]; return Math.max(2, Math.round((2 + (c.lv || 1) + (d.kind === "map" ? 1 : 0)) * (boss ? 2 : 1) * ascFx(run.asc).price)); };
  const chalRerollCost = () => 4 + 2 * ((run.salt && run.salt[roundNo()]) || 0);
  function bribe(id) {
    const r = roundNo(), cf = chalFor(r), c = cf.list.find(x => x.id === id); if (!c) return; const cost = bribePrice(c, cf.boss);
    if (run.coins < cost) { A.sfx.deny(); flash(A.T("No te alcanzan los doblones.", "Not enough doubloons.")); return; }
    run.coins -= cost; run.bribed = run.bribed || {}; (run.bribed[r] = run.bribed[r] || []).push(id); A.sfx.buy(); persist();
    A.dealer.enable(true); A.dealer.say(A.dealer.line("bribe"), { mood: "angry", hold: 1800 }); renderShop(run.phase === "chest");
  }
  function rerollChal() {
    const r = roundNo(), cost = chalRerollCost(); if (run.coins < cost) { A.sfx.deny(); flash(A.T("No te alcanzan los doblones.", "Not enough doubloons.")); return; }
    run.coins -= cost; run.salt = run.salt || {}; run.salt[r] = (run.salt[r] || 0) + 1; if (run.bribed) run.bribed[r] = []; A.sfx.reroll(); persist();
    A.dealer.enable(true); A.dealer.say(A.dealer.line("reroll"), { mood: "laugh", hold: 1800 }); renderShop(run.phase === "chest");
  }
  const routeHtml = () => { let h = ""; const cur = roundNo(); for (let i = Math.max(0, cur - 3); i < Math.max(0, cur - 3) + 12; i++) h += `<i class="${i < cur ? "done" : i === cur ? "cur" : ""}${i % 4 === 3 ? " boss" : ""}" ${A.roundTip(i)}>${i % 4 === 3 ? ic("skull") : ""}</i>`; return h; };
  const rerollCost = () => { const sx = shopCtx(); return run.freeUsed < sx.freeReroll ? 0 : 3 + run.rerolls; };
  function cardHtml(s, i, chest) {
    const bought = run.bought.includes(i);
    if (s.k === "perk") {
      const p = A.RELICS[s.id], c = chest ? 0 : price(p.cost), ctr = chalFor(roundNo()).list.find(ch => (A.CHAL[ch.id].counters || []).includes(p.id));
      return `<div class="offer pc r${p.r}${bought ? " sold" : ""}${ctr ? " counter" : ""}" data-i="${i}" data-suit="${suitRed(p.suit) ? "red" : "blk"}">${ctr ? `<span class="of-ctr" ${A.ttAttr(A.tx(A.CHAL[ctr.id].n), A.tx(A.CHAL[ctr.id].d))}>${ic(A.CHAL[ctr.id].ico)}<em>${A.T("Ayuda contra", "Helps against")} ${A.tx(A.CHAL[ctr.id].n)}</em></span>` : ""}${ixs(p.cost, p.suit)}<span class="of-r">${A.tx(R_NAMES[p.r])}</span><div class="of-ico felt">${ic(p.ico)}</div><b class="of-n">${A.tx(p.n)}</b><p>${A.tx(p.d)}</p><button class="buy" ${bought ? "disabled" : ""}>${bought ? A.T("Comprado", "Owned") : chest ? A.T("Elegir gratis", "Take for free") : CN() + c}</button></div>`;
    }
    if (s.k === "tool") {
      const t = TOOLS[s.id], c = price(t.cost), have = run.tools[s.id];
      return `<div class="offer pc otool r${t.r}${bought ? " sold" : ""}" data-i="${i}" data-suit="blk">${ixs("A", "s_palm")}<span class="of-r">${A.T("Herramienta", "Tool")}</span><div class="of-ico felt">${ic(t.ico)}</div><b class="of-n">${A.tx(t.n)}${have ? ` <em>+1 ${A.T("carga", "charge")}</em>` : ""}</b><p>${A.tx(t.d)}</p><button class="buy" ${bought ? "disabled" : ""}>${bought ? A.T("Comprado", "Owned") : CN() + c}</button></div>`;
    }
    return `<div class="offer pc life${bought ? " sold" : ""}" data-i="${i}" data-suit="red">${ixs("♥", "heart")}<span class="of-r">${A.T("Provisión", "Provision")}</span><div class="of-ico felt">${ic("heart")}</div><b class="of-n">+1 ${A.T("provisión", "provision")}</b><p>${A.tf("Recupera una provisión (máx. {n}).", "Restore a provision (max {n}).", { n: run.maxLives })}</p><button class="buy" ${bought || run.lives >= run.maxLives ? "disabled" : ""}>${CN()}${price(6)}</button></div>`;
  }
  function renderShop(chest) {
    const slots = 5, info = actInfo(run.act), rc = rerollCost();
    const cards = run.stock.map((s, i) => cardHtml(s, i, chest)).join("") || `<p class="tb-empty">${A.T("No quedan cartas: ¡sigue adelante!", "No cards left: move on!")}</p>`;
    const relicSlots = Array.from({ length: slots }, (_, k) => { const id = run.perks[k]; return id ? `<button class="inv-perk" data-sell="${id}" title="${A.tx(A.RELICS[id].n)} — ${A.tx(A.RELICS[id].d)}">${ic(id)}<b class="ivn">${A.RELICS[id].cost}</b>${chest ? "" : `<em>${A.T("vender", "sell")} ${sellValue(id)}</em>`}</button>` : `<span class="inv-empty"></span>`; }).join("");
    C().dialog(`<div class="table${chest ? " chest" : ""}">
      <header class="tb-head"><div class="tb-title"><span class="tag">${A.tx(info.n)} · ${A.tx(info.t)}</span><h2>${chest ? A.T("Cofre del jefe", "Boss chest") : A.T("Campamento", "Camp")}</h2></div>
        <div class="route">${routeHtml()}</div><div class="tb-right"><button class="chipbtn tb-menu" id="shopMenu" type="button">${A.icon("u_pause", "sm")}<span>${A.T("Menú", "Menu")}</span></button><div class="tb-coins" id="shopCoins">${CN()}<b>${run.coins}</b></div></div></header>
      ${nextHtml()}
      ${chest ? `<p class="tb-note">${A.T("Elige UNA reliquia gratis. Aquí pueden salir legendarias.", "Pick ONE relic for free. Legendaries can show up here.")}</p>` : `<p class="tb-note">${A.T("Tres cartas sobre la mesa. ¿Compras una o pides otras?", "Three cards on the table. Buy one, or ask for new ones?")}</p>`}
      <section class="offers">${cards}</section>
      <div class="tb-actions">${chest ? "" : `<button class="chipbtn" id="rerollBtn">${ic("dice", "sm")}<span>${A.T("Cambiar cartas", "New cards")}</span><em>${rc ? CN() + rc : A.T("gratis", "free")}</em></button>`}
        </div>
      <footer class="tb-tray"><div class="tray-col"><h4>${A.T("Reliquias", "Relics")} ${run.perks.length}/${slots}</h4><div class="tray-row">${relicSlots}</div></div>
        <div class="tray-col"><h4>${A.T("Herramientas", "Tools")}</h4><div class="tray-row">${Object.keys(run.tools).map(id => `<span class="inv-tool" ${A.kitTip("tool", id)}>${ic(TOOLS[id].ico)}<b>${toolMax(id)}</b></span>`).join("") || `<i class="empty">${A.T("Ninguna", "None")}</i>`}</div></div>
        <div class="tray-col"><h4>${A.T("Provisiones", "Provisions")}</h4><div class="tray-row hearts">${hearts()}</div></div>
        <button class="btn-ink go-next" id="goRound" data-primary><span>${chest ? A.T("Continuar sin elegir", "Continue without picking") : A.T("Siguiente ronda", "Next round")}</span><span class="ar">${A.icon("u_next", "sm")}</span></button></footer></div>`, "tablewrap");
    document.querySelectorAll(".offer").forEach(el => { const btn = el.querySelector(".buy"); if (btn) btn.onclick = () => buy(el, chest); });
    document.querySelectorAll(".inv-perk").forEach(b => (b.onclick = () => { if (chest) return; sell(b.dataset.sell); }));
    if ($("rerollBtn")) $("rerollBtn").onclick = () => { const c = rerollCost(); if (run.coins < c) { A.sfx.deny(); shake($("rerollBtn")); return; } run.coins -= c; if (c === 0) run.freeUsed++; else run.rerolls++; run.shopN++; run.stock = null; A.sfx.reroll(); openShop(false); };
    $("shopMenu").onclick = () => C().runMenu();
    document.querySelectorAll(".ch-buy").forEach(b => (b.onclick = () => bribe(b.dataset.id)));
    if ($("chalReroll")) $("chalReroll").onclick = rerollChal;
    $("goRound").onclick = () => { run.stock = null; persist(); chest ? openShop(false) : startRound(); };
    A.ach.emit("adv", { kind: "hold", coins: run.coins, perks: run.perks.length });
  }
  const shake = el => { el.classList.remove("no"); void el.offsetWidth; el.classList.add("no"); };
  function buy(el, chest) {
    const i = +el.dataset.i, s = run.stock[i]; if (!s || run.bought.includes(i)) return;
    if (s.k === "life") { const c = price(6); if (run.coins < c || run.lives >= run.maxLives) { A.sfx.deny(); shake(el); return; } run.coins -= c; run.lives++; run.bought.push(i); A.sfx.buy(); persist(); return renderShop(chest); }
    if (s.k === "perk") {
      const p = A.RELICS[s.id], c = chest ? 0 : price(p.cost);
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
    if (chest) { run.stock = null; run.bought = []; persist(); return openShop(false); }
    renderShop(chest);
  }
  function sell(id) { const k = run.perks.indexOf(id); if (k < 0) return; run.perks.splice(k, 1); run.coins += sellValue(id); A.sfx.sell(); persist(); renderShop(false); }
  function flash(t) { const n = document.querySelector(".tb-note"); if (!n) return; const m = document.createElement("p"); m.className = "shop-flash"; m.textContent = t; n.after(m); setTimeout(() => m.remove(), 2200); }

  /* ---------------- fin de la expedicion ---------------- */
  function endRun(win) {
    const P = A.profile.get(), bonus = run.cleared * 1000 + (run.won ? 2500 : 0), final = run.score + bonus, wasRanked = run.ranked, board = run.board;
    P.adv.bestScore = Math.max(P.adv.bestScore, final); P.adv.coins += run.stats.coinsEarned;
    if (win && run.won) P.adv.asc = Math.max(P.adv.asc, Math.min(5, run.asc + 1));
    A.profile.save();
    const rec = A.profile.record("adv-all", final);
    A.rank.submit("adv-all", { score: final, extra: { deck: run.deck, asc: run.asc, r: run.cleared } });
    if (wasRanked && board) { P.daily[board] = { score: final, ts: Date.now() }; A.profile.save(); A.rank.submit(board, { score: final, extra: { deck: run.deck, r: run.cleared } }); A.ach.emit("daily", {}); }
    const r = run; run = null; persist(); C().S.run = null; A.chal.end(); A.dealer.enable(true); setTimeout(() => A.dealer.react(win ? "runWin" : "runLose"), 900);
    A.sfx.stamp(); setTimeout(win ? A.sfx.victory : A.sfx.lose, 300);
    C().verdict({
      kind: win ? "win" : "", level: r.cleared, tag: A.T("Expedición", "Expedition"), title: win ? A.T("Expedición cobrada", "Expedition cashed out") : A.T("Fin de la expedición", "Expedition over"),
      text: (r.won ? A.tf("Superaste {r} rondas y conquistaste los tres actos. Puntos: {p} + bonus {b}.", "You cleared {r} rounds and conquered all three acts. Points: {p} + bonus {b}.", { r: r.cleared, p: A.fmt(r.score), b: A.fmt(bonus) })
        : A.tf("Superaste {r} rondas y llegaste al {act}. Puntos: {p} + bonus {b}.", "You cleared {r} rounds and reached {act}. Points: {p} + bonus {b}.", { r: r.cleared, act: A.tx(actInfo(r.act).n), p: A.fmt(r.score), b: A.fmt(bonus) })) + (rec ? A.T(" ¡Nuevo récord personal!", " New personal best!") : ""),
      stats: [[A.T("Puntuación final", "Final score"), final], [A.T("Rondas superadas", "Rounds cleared"), r.cleared], [A.T("Doblones ganados", "Doubloons earned"), r.stats.coinsEarned]],
      stamp: win ? A.T("GLORIA", "GLORY") : A.T("FIN", "END"), stampSub: win ? A.icon("u_star", "st") : A.icon("u_close", "st"), art: win ? "win" : "lose",
      buttons: [{ id: "nrBtn", cls: "btn-ink", label: A.T("Otra expedición", "Another expedition"), arrow: true, primary: true, onclick: () => C().showHub("adventure") }, { id: "hubBtn", cls: "btn-line", label: A.T("Menú", "Menu"), onclick: () => C().showHub() }],
    });
    C().map.setStyle(mapStyleFor()); A.adv.hideBars();
  }
  A.adv.endRun = endRun; A.adv.startRound = startRound; A.adv.openShop = openShop;
})(window.AIQ);
