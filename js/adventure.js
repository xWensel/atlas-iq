/*
 * Geolite - AVENTURA (v0.9): el modo roguelike.
 * Eres un aventurero que descifra lugares. Cada RONDA es un tema concreto con un banco enorme de lugares (100+ por tema) y una
 * puntuacion objetivo que sube; entre rondas hay campamento (3 cartas y rolear), y cada acto acaba con un jefe.
 * Todo sale de una semilla: partidas aleatorias, y el Reto diario comparte semilla para clasificar. Necesita A.core (game.js) y A.RELICS.
 */
window.AIQ = window.AIQ || {};
(function (A) {
  const T = A.T, L = A.L, $ = id => document.getElementById(id), C = () => A.core;
  const RUNKEY = "atlasiq.run.v2", DAILYKEY = "atlasiq.daily.v1";   // el intento del Reto diario va en su propia ranura: no pisa la expedicion guardada
  const ic = (id, cls) => A.icon(id, cls), CN = () => A.icon("coin", "cn");
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const L6 = A.L6;
  const suitRed = s => s === "s_pin" || s === "s_compass" || s === "heart";
  const ixs = () => "";                                              // las cartas ya no llevan indices (A K Q J, numeros ni palos)
  const R_NAMES = [L6("Común|Common|Commune|Comum|Gewöhnlich|Comune||普通|일반|コモン|Обычная|Zwykła"), L6("Poco común|Uncommon|Peu commune|Incomum|Ungewöhnlich|Non comune||少见|언커먼|アンコモン|Необычная|Niezwykła"), L6("Rara|Rare|Rare|Rara|Selten|Rara||稀有|레어|レア|Редкая|Rzadka"), L6("Legendaria|Legendary|Légendaire|Lendária|Legendär|Leggendaria||传说|레전더리|レジェンダリー|Легендарная|Legendarna")];

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
    capital: [L6("Capitales del mundo|World capitals|Capitales du monde|Capitais do mundo|Hauptstädte der Welt|Capitali del mondo||世界首都|세계의 수도|世界の首都|Столицы мира|Stolice świata"), L6("Capitales del mundo (difíciles)|World capitals (hard)|Capitales du monde (difficiles)|Capitais do mundo (difíceis)|Hauptstädte der Welt (schwer)|Capitali del mondo (difficili)||世界首都（困难）|세계의 수도 (어려움)|世界の首都（むずかしい）|Столицы мира (сложные)|Stolice świata (trudne)")],
    landmark: [L6("Monumentos y lugares famosos|Landmarks and famous places|Monuments et lieux célèbres|Monumentos e lugares famosos|Wahrzeichen und berühmte Orte|Monumenti e luoghi famosi||地标与著名地点|랜드마크와 유명한 장소|名所と有名な場所|Достопримечательности и известные места|Zabytki i słynne miejsca"), L6("Maravillas del mundo (difíciles)|World wonders (hard)|Merveilles du monde (difficiles)|Maravilhas do mundo (difíceis)|Weltwunder (schwer)|Meraviglie del mondo (difficili)||世界奇观（困难）|세계의 경이 (어려움)|世界の驚異（むずかしい）|Чудеса света (сложные)|Cuda świata (trudne)"), L6("Tesoros escondidos|Hidden treasures|Trésors cachés|Tesouros escondidos|Verborgene Schätze|Tesori nascosti||隐藏的宝藏|숨겨진 보물|隠れた名所|Скрытые сокровища|Ukryte skarby")],
    city: [L6("Grandes ciudades|Big cities|Grandes villes|Grandes cidades|Große Städte|Grandi città||大城市|대도시|大都市|Большие города|Wielkie miasta"), L6("Ciudades importantes|Important cities|Villes importantes|Cidades importantes|Wichtige Städte|Città importanti||重要城市|주요 도시|主要都市|Важные города|Ważne miasta"), L6("Ciudades difíciles|Hard cities|Villes difficiles|Cidades difíceis|Schwere Städte|Città difficili||高难城市|어려운 도시|難しい都市|Сложные города|Trudne miasta")],
    country: [L6("Países (haz clic dentro)|Countries (click inside)|Pays (clique dedans)|Países (clique dentro)|Länder (klicke hinein)|Paesi (clicca dentro)||国家（点击国境内）|국가 (안쪽을 클릭)|国（国内をクリック）|Страны (кликни внутри)|Kraje (kliknij w środku)"), L6("Países difíciles|Hard countries|Pays difficiles|Países difíceis|Schwere Länder|Paesi difficili||高难国家|어려운 국가|難しい国|Сложные страны|Trudne kraje")],
    history: [L6("Batallas y sucesos famosos|Famous battles and events|Batailles et événements célèbres|Batalhas e eventos famosos|Berühmte Schlachten und Ereignisse|Battaglie ed eventi famosi||著名战役与事件|유명한 전투와 사건|有名な戦いと出来事|Знаменитые битвы и события|Słynne bitwy i wydarzenia"), L6("Historia (difícil)|History (hard)|Histoire (difficile)|História (difícil)|Geschichte (schwer)|Storia (difficile)||历史（困难）|역사 (어려움)|歴史（むずかしい）|История (сложно)|Historia (trudna)")],
    nature: [L6("Maravillas de la naturaleza|Natural wonders|Merveilles de la nature|Maravilhas da natureza|Naturwunder|Meraviglie della natura||自然奇观|자연의 경이|自然の驚異|Природные чудеса|Cuda natury"), L6("Mares y montañas|Seas and mountains|Mers et montagnes|Mares e montanhas|Meere und Berge|Mari e montagne||海洋与山脉|바다와 산|海と山|Моря и горы|Morza i góry")],
    clue: [L6("Apodos y pistas|Nicknames and clues|Surnoms et indices|Apelidos e pistas|Spitznamen und Hinweise|Soprannomi e indizi||别称与线索|별명과 단서|ニックネームとヒント|Прозвища и подсказки|Przydomki i wskazówki")],
    mixed: [L6("¡Jackpot! De todo un poco|Jackpot! A bit of everything|Jackpot ! Un peu de tout|Jackpot! Um pouco de tudo|Jackpot! Von allem etwas|Jackpot! Un po' di tutto||大奖！样样都有|잭팟! 이것저것 다 있어요|ジャックポット！なんでもあり|Джекпот! Всего понемногу|Jackpot! Wszystkiego po trochu")],
    flag: [L6("Banderas del mundo|World flags|Drapeaux du monde|Bandeiras do mundo|Flaggen der Welt|Bandiere del mondo||世界国旗|세계의 국기|世界の国旗|Флаги мира|Flagi świata"), L6("El coleccionista de banderas|The flag collector|Le collectionneur de drapeaux|O colecionador de bandeiras|Der Flaggensammler|Il collezionista di bandiere||国旗收藏家|국기 수집가|国旗コレクター|Коллекционер флагов|Kolekcjoner flag")],
  };
  const KIND_FACTOR = { capital: 1, city: 1, landmark: 0.9, nature: 1.5, battle: 0.9, event: 0.9, country: 0.7, clue: 1, water: 1.6, strait: 1.4 };
  /* 12 rondas: 3 actos de 4 (la 4.a es el jefe). Empieza facil y va cambiando de tema y subiendo el nivel.
     v0.20 (usuario): ciudades y monumentos tienen dos rondas (son la mayor parte del banco); capitales e historia, una; banderas siguen dobles. */
  const ROUNDS = [
    { topic: "capital", tier: 0 }, { topic: "landmark", tier: 0 }, { topic: "flag", tier: 0 }, { topic: "country", tier: 0, boss: true },
    { topic: "city", tier: 0 }, { topic: "history", tier: 0 }, { topic: "nature", tier: 0 }, { topic: "flag", tier: 1, boss: true },
    { topic: "city", tier: 1 }, { topic: "clue", tier: 1 }, { topic: "landmark", tier: 1 }, { topic: "mixed", tier: 1, boss: true },
  ];
  const roundDefOf = r => (r < ROUNDS.length ? ROUNDS[r] : (() => { const b = ROUNDS[4 + ((r - 4) % 8)]; return { ...b, tier: Math.min(2, b.tier + 1), boss: (r % 4) === 3 }; })());

  /* ------------------------------------------------------------------ banco de preguntas por tema y nivel */
  let POOLS = null;
  const kindOfHistory = t => (/^(battle|siege|fall of|.*\bwar\b|bombing|attack|normandy|gallipoli|dunkirk|tet )/i.test(t) ? "battle" : "event");
  const kindOfNature = t => (/\b(sea|ocean|gulf|bay)\b/i.test(t) ? "water" : /\b(strait|channel|canal|cape|drake|bosporus|bosphorus)\b/i.test(t) ? "strait" : "nature");
  /* v0.20 (usuario): todo lugar lleva pais debajo salvo mares y oceanos; si lo comparten dos, los dos ("Nepal · China"); si mas, el principal (data/paises-lugares.js) */
  const joinCountries = qids => { const ns = qids.map(q => A.PCOUNTRY && A.PCOUNTRY[q]).filter(Boolean); if (!ns.length) return null; const o = {}; Object.keys(ns[0]).forEach(l => (o[l] = ns.map(n => n[l] || n.en).join(" · "))); return o; };
  function placeQ(row) {
    const [id, kind, tier, lat, lon, qc0, names, fame] = row, extra = A.PLACE_COUNTRIES && A.PLACE_COUNTRIES[id], qc = extra && extra.length ? extra[0] : qc0;
    const cn = (extra && extra.length > 1 && joinCountries(extra)) || (qc && A.PCOUNTRY && A.PCOUNTRY[qc]), en = names.en;
    const cEn = (extra && extra.length ? extra : qc0 ? [qc0] : []).map(q => A.PCOUNTRY && A.PCOUNTRY[q] && A.PCOUNTRY[q].en).filter(Boolean);   // paises en ingles: la regla "un pais por ronda" y el Pase VIP
    if (kind === "country") { const key = id.slice(2); if (!C().world.byName[key]) return null; return { t: "c", key, name: names, sub: { es: "", en: "" }, clue: false, answer: null, fact: {}, cid: [id], kind: "country", topic: "country", tier, fame: fame || 0, cEn: [en], cks: [countryKey(en)] }; }
    if (lat == null) return null;
    const k = kind === "history" ? kindOfHistory(en) : kind === "nature" ? kindOfNature(en) : kind;
    return { t: "p", lat, lon, name: names, sub: cn || { es: "", en: "" }, clue: false, answer: null, fact: {}, cid: [id], kind: k, topic: kind, tier, fame: fame || 0, cEn, cks: cEn.map(countryKey) };
  }
  const countryKey = e => { const k = String(e || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, ""); return k === "republicofireland" ? "ireland" : k; };   // el mismo pais como pregunta de pais, bandera, pista o lugar
  function pools() {
    if (POOLS) return POOLS; POOLS = {};
    const add = (topic, tier, q) => { const key = topic + "|" + tier; (POOLS[key] = POOLS[key] || []).push(q); };
    const seen = new Set();
    (A.PLACES || []).forEach(row => { const q = placeQ(row); if (q && !seen.has(q.cid[0])) { seen.add(q.cid[0]); add(q.topic, q.tier, q); } });
    /* v0.20: banco propio de pistas (data/pistas.js): apodos y pistas inequivocas en 11 idiomas, cada una atada a un lugar del banco.
       cid: ["clue:<id>", <id>]: la primera identifica la pregunta (carretes, repetidos); la segunda desbloquea la tarjeta del lugar en la Enciclopedia al acertarla.
       La pista va en el nombre, la respuesta en answer y el pais solo por dentro (cks: regla de un pais por ronda), para que debajo salgan las casillas de letras */
    const byId = {}; (A.PLACES || []).forEach(row => (byId[row[0]] = row));
    (A.CLUES || []).forEach(([id, diff, txt]) => {
      const row = byId[id], q = row && placeQ(row); if (!q || seen.has("clue:" + id)) return;
      seen.add("clue:" + id);
      add("clue", 1, { ...q, name: txt, answer: q.name, sub: { es: "", en: "" }, clue: true, cid: ["clue:" + id, id], topic: "clue", tier: 1, fame: diff });
    });
    // apodos antiguos del Clasico (descripciones de Wikidata): solo si no existe el banco nuevo de pistas; y respaldo con las preguntas antiguas si aun no existe el banco de lugares
    for (const camp of A.CAMPAIGNS) {
      if (!camp.levels[0] || !camp.levels[0].all) continue;
      for (const Lv of camp.levels) for (const q of Lv.all()) {
        const id = q.cid && q.cid[0]; if (!id) continue;
        const kind = q.clue ? "clue" : Lv.kind, topic = { capital: "capital", city: "city", landmark: "landmark", country: "country", place: "landmark", nature: "nature", water: "nature", strait: "nature", battle: "history", event: "history", clue: "clue" }[kind];
        if (!topic) continue;
        if (topic !== "clue" && (A.PLACES || []).length > 200) continue;               // con el banco nuevo, solo aportan las pistas
        if (topic === "clue" && (A.CLUES || []).length) continue;                       // ...y con el banco de pistas, ni eso
        const key = topic === "clue" ? "clue:" + id : id;                              // una pista es otra pregunta aunque su respuesta ya este en el banco (Las Vegas...): antes se descartaban 78 de 80 y la ronda 10 salia con 2 lugares
        if (seen.has(key)) continue;
        seen.add(key); add(topic, clamp(Lv.tier || 0, 0, 2), { ...q, kind, topic, tier: clamp(Lv.tier || 0, 0, 2) });
      }
    }
    return POOLS;
  }
  /* v0.20 (usuario, 2026-09-30): TODAS las preguntas del banco tienen salida en las 12 rondas (la Enciclopedia y sus logros se completan jugando la Aventura).
     - Cada pregunta tiene una dificultad 0-100 (A.QDIFF, data/dificultad.js: panel de 3 jueces) y un NIVEL 1-10 DENTRO DE SU CATEGORIA (A.QLEVEL, data/niveles.js:
       deciles; usuario: "todas las categorias con dificultades de 1 a 10"). Las banderas van aparte ("flag:c:<Pais>").
     - Cada tema se reparte entre SUS rondas (data/carretes.js, sin tamano fijo): con dos rondas, la primera lleva los niveles 1-5 y la segunda los 6-10.
       Sin techo por ronda (el usuario lo quito el 2026-09-30).
     - En cada ronda: 3 del 60 % mas facil de su carrete, 1 del 20 % medio y 1 del 20 % mas dificil, asi todas salen con la misma frecuencia.
     - Azar vivo (usuario, 2026-09-30): nada de mazos; todas las preguntas estan siempre en su pool y pueden repetirse, pero las que menos te han salido
       pesan algo mas en el sorteo (perfil: adv.seen). El Reto diario sortea solo con su semilla (igual para todos).
     - En una ronda, si se puede: como mucho 2 del mismo continente, nunca 2 del mismo pais ni un nombre ya preguntado en la expedicion. */
  const ROUND_THEME = ["capital", "landmark", "flag", "country", "city", "history", "nature", "flag", "city", "clue", "landmark", "mixed"];
  const qidOf = (q, topic) => (topic === "flag" ? "flag:" + q.cid[0] : q.cid[0]);
  const diffOf = (q, topic) => { const d = A.QDIFF && A.QDIFF[qidOf(q, topic)]; return d == null ? 50 : d; };
  const levelOf = d => clamp(Math.ceil(d / 10), 1, 10);
  const lvOf = (q, topic) => (A.QLEVEL && A.QLEVEL[qidOf(q, topic)]) || levelOf(diffOf(q, topic));   // nivel 1-10 dentro de su categoria
  const byLevel = topic => (a, b) => (lvOf(a, topic || a.topic) - lvOf(b, topic || b.topic)) || (diffOf(a, topic || a.topic) - diffOf(b, topic || b.topic));
  const nk = t => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const nameKeys = q => [nk(q.name && q.name.en), nk(q.name && q.name.es)].concat(q.clue && q.answer ? [nk(q.answer.en), nk(q.answer.es)] : []).filter(Boolean);
  const cksOf = q => q.cks || [];
  let ALLQ = null;                                                   // cid -> pregunta (un pais es la misma pregunta como nombre y como bandera: la ronda decide como se ve)
  const allQ = () => { if (ALLQ) return ALLQ; ALLQ = {}; Object.values(pools()).forEach(l => l.forEach(q => { ALLQ[q.cid[0]] = ALLQ[q.cid[0]] || q; })); return ALLQ; };
  let ASSIGN = null;
  function assign() {                                                // carrete de cada ronda (0-11), de mas facil a mas dificil
    if (ASSIGN) return ASSIGN;
    const fixed = A.CARRETES && A.CARRETES.length === 12, out = new Set(A.CARRETES_FUERA || []), all = allQ(), auto = autoAssign();
    const lists = (fixed ? A.CARRETES : auto).map(ids => ids.filter(id => !out.has(id)));
    if (fixed) {                                                     // una pregunta nueva del banco que aun no esta en data/carretes.js entra donde la pondria el reparto automatico
      const has = [new Set(), new Set()]; lists.forEach((l, i) => l.forEach(id => has[ROUND_THEME[i] === "flag" ? 0 : 1].add(id)));
      auto.forEach((l, i) => l.forEach(id => { const h = has[ROUND_THEME[i] === "flag" ? 0 : 1]; if (!h.has(id) && !out.has(id)) { lists[i].push(id); h.add(id); } }));
    }
    return (ASSIGN = lists.map((ids, i) => ids.map(id => all[id]).filter(Boolean).sort(byLevel(ROUND_THEME[i] === "mixed" ? null : ROUND_THEME[i]))));
  }
  function autoAssign() {                                            // ids por ronda (la 12 no tiene carrete propio: saca de todo el banco)
    const P = pools(), out = ROUND_THEME.map(() => []);
    const byTopic = t => [].concat(...[0, 1, 2].map(x => P[(t === "flag" ? "country" : t) + "|" + x] || []));
    for (const t of ["capital", "landmark", "flag", "country", "city", "history", "nature", "clue"]) {
      const rs = ROUND_THEME.map((x, i) => (x === t ? i : -1)).filter(i => i >= 0), list = byTopic(t).sort(byLevel(t));
      list.forEach(q => out[t === "capital" && lvOf(q, t) >= 9 ? 4 : rs[Math.min(rs.length - 1, Math.floor((lvOf(q, t) - 1) * rs.length / 10))]].push(q.cid[0]));   // dos rondas: niveles 1-5 y 6-10; las capitales 9-10, invitadas en Grandes ciudades (R5) para suavizar la R1
    }
    return out;
  }
  const poolFor = r => assign()[r < 12 ? r : 4 + ((r - 4) % 8)];   // la Leyenda (12+) repite las rondas 5-12
  let BANDS = {};
  function bandsOf(slot) {                                           // franjas de una ronda: [facil 60 %, media 20 %, dificil 20 %]; la 12 saca de todo el banco (sin banderas)
    if (BANDS[slot]) return BANDS[slot];
    let list = poolFor(slot), topic = ROUND_THEME[slot < 12 ? slot : 4 + ((slot - 4) % 8)], tail = null;
    if (topic === "mixed") {
      const seen = new Set(); tail = new Set(assign()[11].map(q => q.cid[0])); list = [];
      assign().forEach((l, i) => { if (ROUND_THEME[i] !== "flag") l.forEach(q => { if (!seen.has(q.cid[0])) { seen.add(q.cid[0]); list.push(q); } }); });
      list.sort(byLevel(null));                                        // cada pregunta con el nivel de su categoria: la 12 tiene faciles y dificiles de todas
    }
    const own = topic === "mixed" ? list : list.filter(q => q.topic === (topic === "flag" ? "country" : topic)), guests = topic === "mixed" ? [] : list.filter(q => !own.includes(q));   // invitadas: p. ej. capitales 9-10 en la R5
    const n = own.length, a = Math.ceil(n * 0.6), b = Math.ceil(n * 0.8);
    return (BANDS[slot] = { topic, tail, bands: [{ k: "e", n: 3, list: own.slice(0, a) }, { k: "m", n: 1, list: own.slice(a, b) }, { k: "h", n: 1, list: own.slice(b).concat(guests) }] });
  }
  /* saca n preguntas de una franja por sorteo con peso: todas siguen en el pool y pueden repetirse, pero las que menos te han salido pesan mas
     (peso 1 / (1 + veces - minimo de la franja): nunca vista = 1, una vez mas que la que menos = 1/2...). En el Reto diario todas pesan igual y manda la semilla.
     Reglas que se relajan si no hay otra: 2) continente y pais; 1) nada ya preguntado en la expedicion; 0) lo que sea. first: preguntas con prioridad (x4). */
  const seenStore = () => { if (run._scratch) return run._scratch; const P = A.profile.get(); if (P.adv.decks) delete P.adv.decks; return (P.adv.seen = P.adv.seen || {}); };
  const seenKey = (q, topic) => qidOf(q, topic || q.topic);
  function takeFrom(band, n, rr, taken, ctx, first) {
    const got = [], seen = run.board ? null : seenStore(), cnt = q => (seen && seen[seenKey(q, ctx.topic)]) || 0;
    const min = band.reduce((m, q) => Math.min(m, cnt(q)), Infinity), w = q => (first && first.has(q.cid[0]) ? 4 : 1) / (1 + cnt(q) - (min === Infinity ? 0 : min));
    const fits = (q, lvl) => {
      if (taken.includes(q)) return false;
      if (lvl >= 1 && (ctx.used.has(q.cid[0]) || nameKeys(q).some(k => ctx.names.has(k)))) return false;
      if (lvl >= 2) { const c = continentOf(q), cs = cksOf(q); if (taken.filter(x => continentOf(x) === c).length >= 2 || (cs.length && taken.some(x => cksOf(x).some(k => cs.includes(k))))) return false; }
      return true;
    };
    for (const lvl of [2, 1, 0]) while (got.length < n) {
      const cand = band.filter(q => fits(q, lvl)); if (!cand.length) break;
      let r = rr() * cand.reduce((t, q) => t + w(q), 0), q = cand[cand.length - 1];
      for (const c of cand) { r -= w(c); if (r <= 0) { q = c; break; } }
      got.push(q); taken.push(q); nameKeys(q).forEach(k => ctx.names.add(k));
    }
    return got;
  }
  /* cuenta cada pregunta jugada (Aventura normal): con eso las que menos han salido pesan mas en el sorteo */
  const countSeen = (q, topic) => { if (!q || !run || run.board) return; const S = seenStore(), k = seenKey(q, topic); S[k] = (S[k] || 0) + 1; if (!run._scratch) A.profile.save(); };
  const CONT = { af: L("África", "Africa"), na: L("Norteamérica", "North America"), sa: L("Sudamérica", "South America"), as: L("Asia", "Asia"), eu: L("Europa", "Europe"), oc: L("Oceanía", "Oceania"), an: L("Antártida", "Antarctica") };   // sin "an" el Pasaporte diria "el mar" en cualquier lugar de la Antartida
  const centre = o => { const f = C().world.byName[o.key], big = f.polys.reduce((a, b) => ((b.bbox[2] - b.bbox[0]) * (b.bbox[3] - b.bbox[1]) > (a.bbox[2] - a.bbox[0]) * (a.bbox[3] - a.bbox[1]) ? b : a)); return [(big.bbox[1] + big.bbox[3]) / 2, (big.bbox[0] + big.bbox[2]) / 2]; };
  const latlon = o => (o.t === "c" ? centre(o) : [o.lat, o.lon]);
  const continentOf = o => { const [la, lo] = latlon(o); return A.continent(la, lo); };

  /* ------------------------------------------------------------------ herramientas (activas, cargas por ronda) */
  const TOOLS = {
    sonar: { ico: "sonar", uses: 2, cost: 5, r: 1, n: L("Sonar", "Sonar"), d: L("Toca un punto del mapa: te dice a cuántos km está el objetivo (±6 %) y dibuja el anillo. Con tres sondas, triangulas.", "Tap a point: tells you how far the target is (±6%) and draws the ring. Three probes triangulate."), kind: "probe" },
    compass: { ico: "compass", uses: 3, cost: 4, r: 0, n: L("Brújula", "Compass"), d: L("Toca un punto: una flecha señala el rumbo (8 direcciones) hacia el objetivo.", "Tap a point: an arrow shows the heading (8 directions) to the target."), kind: "probe" },
    passport: { ico: "passport", uses: 1, cost: 5, r: 1, n: L("Pase VIP", "VIP pass"), d: L("Ilumina en el mapa el país del lugar (en un país, te dice el continente).", "Lights up the place's country on the map (for a country, tells you the continent)."), kind: "instant" },
    journal: { ico: "journal", uses: 1, cost: 4, r: 0, n: L("Nota del crupier", "Dealer's note"), d: L("Lee la nota de campo del lugar antes de responder.", "Read the place's field note before answering."), kind: "instant" },
    hourglass: { ico: "hourglass", uses: 2, cost: 4, r: 0, n: L("Reloj de arena", "Hourglass"), d: L("+6 segundos en la pregunta actual.", "+6 seconds on the current question."), kind: "instant" },
    interruptor: { ico: "interruptor", uses: 1, cost: 8, r: 2, n: L("Interruptor", "Master switch"), d: L6("Apaga todos los retos durante esta pregunta, salvo el tiempo que ya quitó la Tormenta. Con Silencio no se puede usar.|Switches every challenge off for this question, except the time the Storm already took. It can't be used under Silence.|Désactive tous les défis pour cette question, sauf le temps déjà pris par la Tempête. Inutilisable sous Silence.|Desliga todos os desafios nesta pergunta, exceto o tempo que a Tempestade já tirou. Não pode ser usado com Silêncio.|Schaltet alle Herausforderungen für diese Frage aus, außer der Zeit, die das Gewitter schon genommen hat. Bei Stille nicht nutzbar.|Spegne tutte le sfide per questa domanda, tranne il tempo già tolto dalla Tempesta. Non si può usare con il Silenzio.||关闭本题的所有挑战，但“风暴”已扣掉的时间不会返还。“沉默”时无法使用。|이 문제의 모든 도전을 끕니다. 단, 폭풍이 이미 줄인 시간은 돌아오지 않습니다. 침묵 중에는 사용할 수 없습니다.|この問題のチャレンジをすべてオフにする。ただし嵐で減った時間は戻らない。静寂の間は使えない。|Отключает все испытания для этого вопроса, кроме времени, уже отнятого «Бурей». При «Тишине» не работает.|Wyłącza wszystkie wyzwania w tym pytaniu, poza czasem zabranym już przez Burzę. Nie działa podczas Ciszy."), kind: "instant" },
    swapcard: { ico: "swapcard", uses: 1, cost: 6, r: 1, n: L("Carta de cambio", "Swap card"), d: L("Cambia esta pregunta por otro lugar de la ronda.", "Swaps this question for another place from the round."), kind: "instant" },
  };
  const BOSSES = {};                                                 // los jefes ahora son combinaciones de retos (js/challenges.js)
  const DECKS = {
    explorer: { ico: "deck_explorer", n: L("Explorador", "Explorer"), d: L("Un Sonar y 4 doblones. La baraja para aprender.", "A Sonar and 4 doubloons. The deck for learning."), tools: ["sonar"], perks: [], coins: 4, lives: 3, unlock: null },
    /* con los nombres de ahora de sus cartas (antes Cuaderno, Diccionario, Brujula de 16 rumbos y Linterna de minero, que ya no existen) */
    historian: { ico: "deck_historian", n: L("Historiador", "Historian"), d: L6("Nota del crupier + Chuleta de crupier. Las letras borradas no te frenan.|Dealer's note + Dealer's cheat sheet. Faded letters won't stop you.|Note du croupier + Antisèche du croupier. Les lettres effacées ne t'arrêtent pas.|Nota do crupiê + Cola do crupiê. Letras apagadas não te param.|Notiz des Croupiers + Spickzettel des Croupiers. Verblasste Buchstaben halten dich nicht auf.|Nota del croupier + Bigliettino del croupier. Le lettere sbiadite non ti fermano.|Nota del crupier + Acordeón del crupier. Las letras borradas no te frenan.|荷官的便条 + 荷官的小抄。褪色的字母也难不倒你。|딜러의 메모 + 딜러의 커닝 페이퍼. 바랜 글자도 당신을 막지 못합니다.|ディーラーのメモ+ディーラーのカンニングペーパー。かすれた文字にも動じない。|Записка крупье + Шпаргалка крупье. Выцветшие буквы тебя не остановят.|Liścik od krupiera + Ściąga krupiera. Wyblakłe litery cię nie zatrzymają."), tools: ["journal"], perks: ["dictionary"], coins: 3, lives: 3, unlock: "adv_act1" },
    navigator: { ico: "deck_navigator", n: L("Navegante", "Navigator"), d: L6("Dos brújulas y la Ruleta de 16 rumbos. Nunca te pierdes.|Two compasses and the 16-point roulette. You never get lost.|Deux boussoles et la Roulette à 16 directions. Tu ne te perds jamais.|Duas bússolas e a Roleta de 16 rumos. Você nunca se perde.|Zwei Kompasse und das 16-Feld-Roulette. Du verirrst dich nie.|Due bussole e la Roulette a 16 direzioni. Non ti perdi mai.||两个指南针加十六方位轮盘。你永远不会迷路。|나침반 두 개와 16방위 룰렛. 절대 길을 잃지 않습니다.|2つのコンパスと16方位ルーレット。決して迷わない。|Два компаса и 16-румбовая рулетка. Ты никогда не заблудишься.|Dwa kompasy i Ruletka na 16 pól. Nigdy się nie zgubisz."), tools: ["compass", "compass"], perks: ["compass16"], coins: 3, lives: 3, unlock: "adv_boss" },
    blind: { ico: "deck_blind", n: L("Aventurero ciego", "Blind adventurer"), d: L6("Sin herramientas, con el Foco del vigilante y 4 provisiones.|No tools, with the Pit boss's spotlight and 4 provisions.|Sans outils, avec le Projecteur du chef de table et 4 provisions.|Sem ferramentas, com o Holofote do supervisor e 4 provisões.|Ohne Werkzeuge, mit dem Scheinwerfer des Pitbosses und 4 Proviant.|Senza strumenti, con il Faro del capotavolo e 4 provviste.||没有工具，携带场务经理的聚光灯与 4 份补给。|도구 없이 플로어 매니저의 스포트라이트와 식량 4개.|道具なし、ピットボスのスポットライトと4つのプロビジョン。|Без инструментов, с прожектором пит-босса и 4 запасами.|Bez narzędzi, z reflektorem szefa sali i 4 zapasami."), tools: [], perks: ["miner"], coins: 6, lives: 4, unlock: "adv_win" },
  };
  A.ADV = { TOOLS, PERKS: A.RELICS, BOSSES, DECKS, ROUNDS, TOPIC_NAMES, roundDefOf, chalFor: r => chalFor(r) };

  /* ------------------------------------------------------------------ partida (run) */
  let run = null, slot = RUNKEY;                                     // slot: ranura de la partida activa (expedicion normal o intento del Reto diario)
  const keyOf = daily => (daily ? DAILYKEY : RUNKEY);
  const loadSlot = daily => { try { return JSON.parse(localStorage.getItem(keyOf(daily)) || "null"); } catch (e) { return null; } };
  A.adv = { get run() { return run; }, hasSave(daily) { try { return !!localStorage.getItem(keyOf(daily)); } catch (e) { return false; } } };
  A.adv.poolStats = () => Object.fromEntries(Object.entries(pools()).map(([k, v]) => [k, v.length]));
  A.adv.roundPlaces = r => poolFor(r);
  A.adv.countSeen = countSeen;
  A.adv._autoAssign = () => autoAssign();                            // solo para tools/: regenerar data/carretes.js desde el reparto automatico (ids)
  A.adv._pools = () => pools();                                      // solo para tools/: el banco entero por tema (documento de carretes)
  A.adv._pickTest = (slot, fresh, realSeen) => { if (fresh) run.used = []; if (!realSeen) run._scratch = run._scratch || {}; run.act = Math.floor(slot / 4); run.round = slot % 4; run.attempt = (run.attempt || 0) + 1; run.curQ = null; const qs = pickQuestions(5); const t = ROUND_THEME[slot]; qs.forEach(q => A.adv.countSeen(q, t === "flag" ? "flag" : q.topic)); return qs.map(q => q.cid[0]); };   // solo para pruebas (dev/): sorteo de una ronda y la cuenta de vistas (aparte, salvo realSeen)
  A.adv.roundPool = r => poolFor(r).length;
  const persist = () => { try { if (run) localStorage.setItem(slot, JSON.stringify(run)); else localStorage.removeItem(slot); } catch (e) { /* sin almacenamiento */ } };

  const ascFx = a => ({ target: 1 + 0.05 * a, secs: -a, lives: a >= 3 ? -1 : 0, price: 1 + 0.1 * a, boss2: a >= 4 });
  const roundNo = () => run.act * 4 + run.round;
  /* Reto diario: la ruta del dia baraja las rondas de cada acto (run.route[hueco] = ronda original); el jefe sigue siendo el 4.o hueco de cada acto */
  const slotOf = r => (run && run.route && r < 12 ? run.route[r] : r);
  const defAt = r => (run && run.route && r < 12 ? { ...roundDefOf(run.route[r]), boss: r % 4 === 3 } : roundDefOf(r));
  A.adv.roundDef = defAt;
  const rdef = () => defAt(roundNo());
  const isBoss = () => run.round === 3;
  const perkList = () => run.perks.map(id => A.RELICS[id]).filter(Boolean);
  const has = flag => perkList().some(p => p[flag]);
  const sumFlag = flag => perkList().reduce((n, p) => n + (p[flag] || 0), 0);
  const owned = id => run.perks.includes(id);
  /* objetivo: escalera lineal, +250 por ronda de 2.000 (ronda 1) a 4.500 (ronda 11); el jefe final (ronda 12) es 4.777 exactos. Redondeado a 50 (salvo ese 4.777 sin ascension ni perks de ronda).
     v0.20 (usuario, 2026-09-30): que pese mas SABER que clavar; antes +350 por ronda, 5.777 y +10 % por Ascension hacian imposibles las rondas 11-12 aunque supieras las cinco */
  const target = () => { const t = { seconds: 0, target: 1 }; perkList().forEach(p => p.round && p.round(t, run)); const r = roundNo(), base = r >= 11 ? 4777 : 2000 + 250 * r, m = ascFx(run.asc).target * t.target; return r >= 11 && m === 1 ? base : Math.round((base * m) / 50) * 50; };
  const shopCtx = () => { const x = { price: 0, freeReroll: 0, slots: 3 }; perkList().forEach(p => p.shop && p.shop(x, run)); return x; };
  const inflation = () => 1 + 0.25 * run.act;                            // todo cuesta mas en cada acto: el dinero pesa mas segun avanzas
  const price = c => Math.max(1, Math.round(c * ascFx(run.asc).price * inflation()) + shopCtx().price);
  const lifePrice = () => price(6 + 2 * (run.lifeBuys || 0));            // cada provision comprada en la partida cuesta 2 mas
  const sellValue = id => Math.floor(A.RELICS[id].cost * 0.5);
  const gain = n => Math.round(n * (sumFlag("coinX") || 1));
  const chestSkip = () => Math.round(2.5 * inflation());                // dejar el cofre del jefe sin abrir: 3 doblones al empezar el acto II, 4 al empezar el III (el Toque de Midas los duplica, como todo lo que ganas)
  /* retos de la ronda r tras aplicar perks (Llave maestra, Talisman, inmunidades); pl: otra mano de perks (la tienda valora cada reliquia sin contarla a ella) */
  const chalFor = (r, pl = perkList()) => {
    const plan = A.chal.plan(run.seed + ((run.salt && run.salt[r]) ? ":" + run.salt[r] : ""), r, run.asc, defAt(r).topic, run.cjk), boss = r % 4 === 3;
    let list = A.adv._force ? A.adv._force.map(id => ({ id, lv: 2 })) : plan.list.slice();
    const bribed = (run.bribed && run.bribed[r]) || [], paid = list.filter(c => bribed.includes(c.id)).map(c => c.id); if (bribed.length) list = list.filter(c => !bribed.includes(c.id));   // sobornados en el Campamento (paid: los que estaban en esta tirada; barajar no borra los sobornos)
    const sum = f => pl.reduce((n, p) => n + (p[f] || 0), 0), skip = sum("skipFirst"); if (skip) list = list.slice(skip);
    if (boss) { let soft = sum("softenBoss"); list = list.map((c, i) => (i < soft ? { ...c, lv: 1 } : c)); }
    list = list.filter(c => !pl.some(p => (p.immune || []).includes(c.id)));
    return { list, combo: plan.combo, boss, paid };
  };

  /* ---------------- tienda relevante: lo que sirve cada reliquia en ESTA expedicion ----------------
     Los retos salen de la semilla (A.chal.plan), asi que el Campamento sabe que trucos quedan por venir (con barajados y sobornos ya aplicados).
     Una contra solo se ofrece si alguno de sus retos aparece en las rondas que quedan; las piezas de una herramienta, solo si la llevas;
     las de economia, solo si queda Campamento donde gastar lo que dan; y la de empezar acto, solo si queda algun acto por empezar. */
  const LAST = 11;                                                   // ultima ronda numerada: despues solo queda el modo infinito (sin retos ni Campamento)
  let CTR = null;                                                    // reliquia -> retos que frena (sale de A.CHAL[reto].counters)
  const ctrOf = id => { if (!CTR) { CTR = {}; for (const c in A.CHAL) (A.CHAL[c].counters || []).forEach(p => (CTR[p] = CTR[p] || []).push(c)); } return CTR[id] || null; };
  const pureCounter = p => !!ctrOf(p.id) && !(p.open || p.round || p.clear || p.post || p.shop || p.buy || p.actStart);   // solo frena retos (Batería externa y la Chuleta de bolsillo sirven tambien sin su reto)
  /* rondas (de `from` a la ultima) con algun reto que esta reliquia frena: [{ r, id }] */
  const helpRounds = (id, from = roundNo()) => {
    const cs = ctrOf(id), out = []; if (!cs || run.inf) return out;
    const pl = perkList().filter(p => p.id !== id);
    for (let r = from; r <= LAST; r++) { const hit = chalFor(r, pl).list.find(c => cs.includes(c.id)); if (hit) out.push({ r, id: hit.id }); }
    return out;
  };
  const useful = (id, from = roundNo()) => {
    const p = A.RELICS[id]; if (!p || run.inf || from > LAST) return false;
    const left = LAST + 1 - from;                                    // rondas que quedan, contando la proxima
    if (pureCounter(p)) return helpRounds(id, from).length > 0;
    if (p.sonarErr) return !!run.tools.sonar;                        // Sonar trucado sin Sonar, o la ruleta de 16 rumbos sin Brujula, no hacen nada
    if (p.compass16) return !!run.tools.compass;
    if (p.toolBonus) return Object.keys(run.tools).length > 0;
    if (p.actStart) return run.act < 2;                              // se cobra al empezar un acto: en el III ya no empieza ninguno
    if (p.spy) return left >= 2;
    if (p.interest || p.coinX || p.clear || p.post || p.shop) return left >= 3;
    return true;
  };

  /* ---------------- botin de ronda: superar el objetivo paga 2 (jefe 4) y cada escalon de margen suma 1; fallar paga 1 por cada tercio del objetivo ----------------
     Calibrado con dev/bot.js sobre partidas reales: pasar justo cobra lo mismo que antes y todo lo que se gana de mas sale del margen (+55-75 % por expedicion). */
  const CLEAR = [2, 4], STEPS = [1.1, 1.25, 1.5, 2];                // escalones: +10 %, +25 %, +50 % y el doble del objetivo
  const marginOf = q => STEPS.filter(s => q >= s).length;
  const consoOf = q => clamp(Math.floor(q * 3), 0, 2);              // un tercio -> 1, dos tercios -> 2: nunca mas que superarla
  const loot = (s, t, boss) => { const q = s / Math.max(1, t), m = marginOf(q); return { q, base: CLEAR[boss ? 1 : 0], margin: m, next: m < STEPS.length ? Math.ceil(t * STEPS[m] - 1e-7) : 0 }; };   // -1e-7: 2100 x 1,1 da 2310,0000000000005 y el marcador pedia 2.311
  const pctOf = (s, t) => Math.floor((s * 100) / Math.max(1, t));   // % entero exacto (floor((q - 1) * 100) daba 13 % con 5.700 de 5.000)
  A.adv.loot = loot;
  /* textos nuevos de la economia (es|en|fr|pt|de|it|es-419|zh|ko|ja|ru|pl) */
  const ETX = {
    margin: L6("Margen +{p} %|Margin +{p}%|Marge +{p} %|Margem +{p}%|Vorsprung +{p} %|Margine +{p}%||超额 +{p}%|초과 달성 +{p}%|上乗せ +{p}%|Запас +{p}%|Nadwyżka +{p}%"),
    conso: L6("Consuelo ({p} % del objetivo)|Consolation ({p}% of target)|Consolation ({p} % de l'objectif)|Consolação ({p}% da meta)|Trostpreis ({p} % des Ziels)|Consolazione ({p}% dell'obiettivo)||安慰奖（达成目标的 {p}%）|위로금 (목표의 {p}%)|残念賞（目標の{p}%）|Утешительный приз ({p}% цели)|Nagroda pocieszenia ({p}% celu)"),
    retry: L6("Revancha: la casa te deja una carta a mitad de precio.|Rematch: the house lets you have one card at half price.|Revanche : la maison te laisse une carte à moitié prix.|Revanche: a casa te deixa uma carta pela metade do preço.|Revanche: Das Haus überlässt dir eine Karte zum halben Preis.|Rivincita: la casa ti lascia una carta a metà prezzo.||复仇之战：庄家让你半价买一张牌。|설욕전: 하우스가 카드 한 장을 반값에 줘요.|リベンジ：ハウスがカードを1枚半額にしてくれる。|Реванш: заведение уступает тебе одну карту за полцены.|Rewanż: kasyno oddaje ci jedną kartę za pół ceny."),   // no dice cual ni por que: el jugador lee la carta rebajada y ata cabos
    loot: L6("Botín|Loot|Butin|Prêmio|Beute|Bottino||战利品|보상|報酬|Добыча|Łup"),
    next: L6("+{c} a {s}|+{c} at {s}|+{c} à {s}|+{c} com {s}|+{c} ab {s}|+{c} a {s}||{s} 分 +{c}|{s}점에 +{c}|{s}で+{c}|+{c} при {s}|+{c} przy {s}"),
    max: L6("máx.|max|max|máx.|max.|max||最高|최대|最大|макс.|maks."),
    lootTip: L6("Botín de la ronda|Round loot|Butin de la manche|Prêmio da rodada|Rundenbeute|Bottino del round||本回合战利品|라운드 보상|ラウンド報酬|Добыча раунда|Łup rundy"),
    lootTipD: L6("Doblones que cobras al superar la ronda: 2 (jefe 4) y +1 por cada escalón de margen: +10 %, +25 %, +50 % y el doble del objetivo. Si fallas, cobras 1 por cada tercio del objetivo que alcances.|Doubloons you collect for clearing the round: 2 (boss 4), plus 1 for every margin step: +10%, +25%, +50% and double the target. If you fail, you get 1 for every third of the target you reach.|Doublons encaissés en réussissant la manche : 2 (boss 4), et +1 par palier de marge : +10 %, +25 %, +50 % et le double de l'objectif. Si tu échoues, tu touches 1 par tiers de l'objectif atteint.|Dobrões que você recebe ao vencer a rodada: 2 (chefe 4) e +1 por degrau de margem: +10%, +25%, +50% e o dobro da meta. Se falhar, recebe 1 por cada terço da meta alcançado.|Dublonen fürs Bestehen der Runde: 2 (Boss 4) und +1 pro Vorsprungsstufe: +10 %, +25 %, +50 % und das Doppelte des Ziels. Scheiterst du, gibt es 1 pro erreichtem Drittel des Ziels.|Dobloni che incassi superando il round: 2 (boss 4) e +1 per ogni gradino di margine: +10%, +25%, +50% e il doppio dell'obiettivo. Se fallisci, ne prendi 1 per ogni terzo dell'obiettivo raggiunto.||通过本回合可得金币：2（首领 4），每达到一档超额再 +1：+10%、+25%、+50% 和目标的两倍。失败时，每达成目标的三分之一得 1。|라운드를 클리어하면 받는 도블론: 2 (보스 4), 초과 달성 단계마다 +1: +10%, +25%, +50%, 목표의 두 배. 실패하면 달성한 목표의 3분의 1마다 1.|ラウンドクリアで得るダブロン：2（ボス4）、上乗せの段階ごとに+1：+10%、+25%、+50%、目標の2倍。失敗しても、目標の3分の1ごとに1。|Дублоны за прохождение раунда: 2 (босс 4) и +1 за каждую ступень запаса: +10%, +25%, +50% и двойная цель. При провале — 1 за каждую достигнутую треть цели.|Dublony za zaliczenie rundy: 2 (boss 4) i +1 za każdy próg nadwyżki: +10%, +25%, +50% i podwójny cel. Gdy oblejesz, dostajesz 1 za każdą osiągniętą trzecią część celu."),
  };
  const et = (k, p) => A.tx(ETX[k]).replace(/\{(\w+)\}/g, (m, x) => (p && p[x] != null ? p[x] : m));

  A.adv.begin = function ({ deck = "explorer", asc = 0, seed, ranked = false, board = null, dailyTry = 0, route = null, gift = null } = {}) {
    const d = DECKS[deck] || DECKS.explorer, bonus = gift && A.RELICS[gift] && !d.perks.includes(gift) ? A.RELICS[gift] : null;
    slot = keyOf(!!board);
    /* cjk (sin runas ni sin vocales) se fija al empezar: cambiar de idioma a media expedicion no mueve los trucos ni los sobornos (ver A.chal.plan) */
    run = {
      v: 2, seed: seed || "run-" + Math.random().toString(36).slice(2, 10), cjk: A.chal.noLatin(), deck, asc, ranked, board, dailyTry, route: route ? route.slice(0, 12) : null, gift: bonus ? gift : null,
      act: 0, round: 0, attempt: 0, coins: d.coins, lives: d.lives + ascFx(asc).lives, maxLives: d.lives + ascFx(asc).lives,
      perks: d.perks.concat(bonus ? [gift] : []), tools: {}, score: 0, cleared: 0, used: [], rerolls: 0, freeUsed: 0, shopN: 0, phase: "round", qi: 0, qn: 5, qTools: 0, rTools: 0, luckUsed: false, guardUsed: false,
      livesLostAct: 0, shieldAct: -1, leftSum: 0, roundScore: 0, rGood: 0, qTotal: 0, stats: { bulls: 0, best: 0, coinsEarned: 0 }, t0: Date.now(),
    };
    d.tools.forEach(t => addTool(t)); if (bonus && bonus.buy) bonus.buy(run);
    persist(); A.ach.emit("adv", { kind: "start" }); A.profile.get().adv.runs++; A.profile.save();
    startRound();
  };
  /* Reto diario: gasta uno de los 3 intentos de hoy y empieza con la mano del dia (baraja, ascension, regalo y ruta) y la semilla de ESE intento */
  A.adv.beginDaily = board => {
    const DY = A.rank.daily, k = DY.start(board); if (!k) return false;
    const h = DY.hand(board);
    A.adv.begin({ deck: h.deck, asc: h.asc, seed: DY.trySeed(board, k), ranked: true, board, dailyTry: k, route: h.route, gift: h.gift });
    return true;
  };
  /* puntos de una expedicion al cerrarla: lo sumado en las rondas + 1.000 por ronda superada + 2.500 si conquisto los tres actos */
  const finalOf = r => r.score + r.cleared * 1000 + (r.won ? 2500 : 0);
  A.adv.finalOf = finalOf;
  /* v0.13: partidas guardadas con reliquias o herramientas que ya no existen: se quitan y se devuelve su valor en doblones */
  function migrate(r) {
    const gone = r.perks.filter(id => !A.RELICS[id]); if (gone.length) { r.perks = r.perks.filter(id => A.RELICS[id]); r.coins += gone.length * 4; }
    const dead = Object.keys(r.tools).filter(id => !TOOLS[id]); dead.forEach(id => { delete r.tools[id]; r.coins += 3; });
    if ((r.stock || []).some(s => (s.k === "perk" && !A.RELICS[s.id]) || (s.k === "tool" && !TOOLS[s.id]))) { r.stock = null; r.stockKey = null; }
    if (r.cjk == null) r.cjk = A.chal.noLatin();                    // v0.4.1: partidas de antes sin run.cjk: se fija una vez con el idioma de ahora
    /* v0.23: retos que ya no existen ("Continentes cambiados"): fuera de la partida guardada, y el soborno que se pago por quitarlo se devuelve
       (en esa ronda sale otro reto en su lugar) */
    if (r.chal) r.chal = r.chal.filter(c => A.CHAL[c.id]);
    /* v0.29: y los sobornos de un reto que ya no sale en esa ronda (entre la v0.23 y la v0.28 alli se sorteaba otro; ahora salen Continentes barajados) */
    const now = r.act * 4 + r.round;
    for (const k in r.bribed || {}) {
      let inPlan = null; if (!r.inf && !A.adv._force && r === run && +k >= now) try { inPlan = chalFor(+k).paid; } catch (e) { inPlan = null; }
      const gone = r.bribed[k].filter(id => !A.CHAL[id] || (inPlan && !inPlan.includes(id))); if (!gone.length) continue;
      r.bribed[k] = r.bribed[k].filter(id => !gone.includes(id)); r.bribeN = Math.max(0, (r.bribeN || 0) - gone.length);
      r.coins += gone.length * Math.max(2, Math.round(10 * (+k % 4 === 3 ? 2 : 1) * (1 + 0.5 * r.bribeN) * ascFx(r.asc).price * (1 + 0.25 * Math.floor(+k / 4))));   // lo mas que podia costar sobornarlo en esa ronda (truco de mapa de nivel 3): nunca se devuelve de menos
    }
  }
  A.adv.resume = function (daily = false) {
    slot = keyOf(daily); run = loadSlot(daily);
    if (!run) return false;
    migrate(run); resumedIntro = true;
    if (run.phase === "shop" || run.phase === "chest") openShop(run.phase === "chest");
    else if (run.phase === "verdict") afterVerdict(!!run.vBoss);                            // la ronda ya estaba superada y cobrada: seguimos al campamento
    else if (run.phase === "win") showWinChoice();                                          // ya habias ganado: vuelve a preguntar cobrar o modo infinito
    else if (run.phase === "retry") openShop(false);                                        // ronda fallida: vuelves al campamento para reintentar
    else if (run.phase === "round" && (run.inf ? run.infOver : run.curQ && run.qi >= run.qn)) endSaved();   // guardaste en el ticket de la ultima pregunta: la ronda se cierra (antes se repetia entera sin perder provision)
    else if (run.phase === "round" && run.inf) startInfinite(true);                         // sigue en el modo infinito donde lo dejaste
    else if (run.phase === "round" && run.qi < run.qn && run.curQ) { run.used = run.used.filter(id => !run.curQ.includes(id)); startRound(true); }   // pickQuestions(n, true) repone las mismas (run.curQ)   // sigue en la misma pregunta con las mismas preguntas (tambien en la primera: antes salir y volver daba 5 lugares nuevos y las herramientas recargadas)
    else startRound();
    return true;
  };
  /* la ronda ya estaba jugada entera al guardar (menu desde el ticket de la ultima pregunta, o sin provisiones en el modo infinito): se cierra sin volver a jugarla */
  function endSaved() {
    const S = C().S; S.run = run; S.levelScore = run.roundScore || 0; S.runTotal = run.score;
    S.camp = { id: "adv", mode: "adventure", title: { es: "Aventura", en: "Adventure" }, home: { lat: 20, lon: 10, zoom: 1 }, levels: [{ advance: run.inf ? 1 : target(), boss: !run.inf && isBoss() }] };
    A.adv.roundEnd();
  }
  /* descarta la partida guardada de una ranura (por defecto, la de la partida activa si la hay; si no, la expedicion normal).
     Un intento del Reto diario no se tira: se cierra con los puntos que llevaba y cuenta para la puntuacion global del dia. */
  A.adv.abandon = (daily = !!(run && run.board)) => {
    const act = !!run && !!run.board === daily, r = act ? run : loadSlot(daily), key = act ? slot : keyOf(daily);
    if (daily && r && r.board && r.dailyTry) A.rank.daily.finish(r.board, r.dailyTry, finalOf(r), { r: r.cleared, won: !!r.won });
    if (act) run = null;
    try { localStorage.removeItem(key); } catch (e) { /* sin almacenamiento */ }
  };
  A.adv.save = () => persist();
  A.adv.leave = () => { if (run) { snapSpent(); persist(); A.dealer.noteLeave(); } clearTimers(); A.chal.end(); A.dealer.enable(false); run = null; A.adv.hideBars(); };
  A.adv.summary = (daily = false) => { const r = (run && !!run.board === daily && run) || loadSlot(daily); return r ? { act: r.act + 1, round: r.round + 1, coins: r.coins, score: r.score, lives: r.lives, board: r.board || null, dailyTry: r.dailyTry || 0, inf: !!r.inf } : null; };
  A.adv.active = () => !!run;
  A.adv.isDaily = () => !!(run && run.board);

  function toolMax(id) { const t = run.tools[id]; if (!t) return 0; const plus = perkList().reduce((n, p) => n + (p.toolBonus || 0), 0) + (run.sup && run.sup.kit ? 1 : 0); return t.max + plus; }
  function addTool(id) { const t = run.tools[id]; if (t) t.max++; else run.tools[id] = { max: TOOLS[id].uses, left: TOOLS[id].uses }; }
  function refillTools() { for (const id in run.tools) run.tools[id].left = toolMax(id); }

  /* ---------------- ronda ---------------- */
  /* el pais siempre a la vista: si el lugar no tiene pais (mares, desiertos, cordilleras...), se muestra su continente */
  const withSub = q => { if (q.t === "p" && !q.clue && !(q.sub && (q.sub.en || q.sub.es))) { const c = CONT[continentOf(q)]; if (c) q.sub = { es: c.es, en: c.en }; } return q; };
  /* v0.20: 3 faciles, 1 media y 1 dificil de las franjas de la ronda (ver bandsOf/takeFrom), en orden barajado; al reanudar, las mismas de antes */
  const QV = 2;                                                      // version del sorteo: una partida guardada con el de antes (v0.19) no reutiliza sus preguntas al reanudar
  const ctxOf = (pos, usedIds, topic) => { const all = allQ(), ctx = { used: new Set(usedIds), names: new Set(), topic: topic === "mixed" ? null : topic }; usedIds.forEach(id => all[id] && nameKeys(all[id]).forEach(k => ctx.names.add(k))); return ctx; };
  function drawRound(pos, attempt, usedIds, n = 5) {                 // n preguntas de la ronda de la posicion pos (0-11, y la Leyenda): 3 faciles, 1 media y 1 dificil, en orden barajado
    const slot = slotOf(pos), B = bandsOf(slot), rr = A.rng(`${run.seed}:q:${pos}:${attempt}`), ctx = ctxOf(pos, usedIds, B.topic), taken = [];
    for (const b of [B.bands[2], B.bands[1], B.bands[0]]) takeFrom(b.list, Math.round(b.n * n / 5), rr, taken, ctx, b.k === "h" ? B.tail : null);   // primero la dificil y la media: las faciles tienen mas donde elegir
    for (const b of B.bands) if (taken.length < n) takeFrom(b.list, n - taken.length, rr, taken, ctx, null);   // franja corta: se completa con las otras
    return rr.shuffle(taken).slice(0, n);
  }
  /* Reto diario: "ya preguntado" sale solo de la semilla (los primeros intentos de las rondas anteriores y los intentos previos de esta), nunca de lo que haya hecho
     cada jugador (reintentos, Carta de cambio): asi todos ven las mismas preguntas en el mismo intento */
  let DU = { seed: null, memo: {} };
  function dailyUsed(pos) {
    if (DU.seed !== run.seed) DU = { seed: run.seed, memo: {} };
    if (DU.memo[pos]) return DU.memo[pos];
    const prev = pos > 0 ? dailyUsed(pos - 1) : [];
    return (DU.memo[pos] = pos > 0 ? prev.concat(drawRound(pos - 1, 0, prev).map(q => q.cid[0])) : []);
  }
  function pickQuestions(n, keep) {
    const all = allQ();
    if (keep && run.qv === QV && run.curQ && run.curQ.length === n && run.curQ.every(id => all[id])) { run.used = run.used.concat(run.curQ.filter(id => !run.used.includes(id))); return run.curQ.map(id => withSub({ ...all[id] })); }
    const pos = roundNo();
    let used = run.used;
    if (run.board) { used = dailyUsed(pos); for (let a = 0; a < run.attempt; a++) used = used.concat(drawRound(pos, a, used, n).map(q => q.cid[0])); }
    const out = drawRound(pos, run.attempt, used, n);
    run.qv = QV; run.curQ = out.map(q => q.cid[0]); run.used = run.used.concat(run.curQ);
    return out.map(q => withSub({ ...q }));
  }
  function roundLevel(keep) {
    const r = roundNo(), boss = isBoss(), def = rdef(), cf = chalFor(r), halve = 1;
    const ctx = { seconds: clamp(Math.round(26 - 1.0 * r + ascFx(run.asc).secs), 10, 28), target: 1 };
    perkList().forEach(p => p.round && p.round(ctx, run));
    if (run.sup && run.sup.cafe) ctx.seconds += 4;                                       // suministro: Cafe doble
    ctx.seconds = Math.max(6, ctx.seconds);
    run.chal = cf.list; run.chalName = cf.combo ? cf.combo.n : null; run.chalHalve = halve;
    const rules = cf.list.map(c => (c.id === "storm" ? "clock" : c.id)).filter(id => ["wind", "clock", "silence"].includes(id));
    if (rules.includes("clock")) ctx.seconds = Math.max(6, Math.round(ctx.seconds * (1 - 0.45 * halve)));
    run.boss = rules; run.wind = null;
    if (rules.includes("wind")) { const wr = A.rng(`${run.seed}:wind:${r}:${run.attempt}`); run.wind = { brg: Math.round(wr() * 360), km: Math.round((160 + 40 * run.act) * halve) }; }
    const qs = pickQuestions(run.qn, keep), info = actInfo(run.act), tn = TOPIC_NAMES[def.topic][Math.min(def.tier, TOPIC_NAMES[def.topic].length - 1)];
    run.topic = def.topic; run.tier = def.tier;
    return {
      name: `${A.tx(info.n)} · ${boss ? A.T("Jefe", "Boss") : A.tf("Ronda {n}/3", "Round {n}/3", { n: run.round + 1 })}`, topicName: tn, topic: def.topic, kind: "adventure", boss: !!boss,
      seconds: ctx.seconds, advance: target(), maxPerQ: 1400, bonus: false, plainName: true, questions: () => qs,
      score: (q, km, left) => A.adv.score(q, km, left, true).sc,
    };
  }
  function startRound(keep) {
    run.phase = "round";
    if (!keep) { run.qi = 0; run.luckUsed = false; run.guardUsed = false; run.rTools = 0; run.rBulls = 0; run.leftSum = 0; run.roundScore = 0; run.rGood = 0; run.streak = 0; refillTools(); }
    const Lv = roundLevel(keep), S = C().S;
    S.run = run; S.camp = { id: "adv", mode: "adventure", title: { es: "Aventura", en: "Adventure" }, home: { lat: 20, lon: 10, zoom: 1 }, levels: [Lv] };
    S.runTotal = run.score; S.runMax = 0; C().map.setHome(S.camp.home); C().map.setStyle(mapStyleFor());
    A.dealer.enable(true); A.chal.begin(run.chal, A.chal.fx(perkList()), { seed: run.seed, round: roundNo(), halve: run.chalHalve });
    persist(); A.ach.emit("adv", { kind: "round", act: run.act }); C().startLevel(0);
    if (keep) { S.qi = run.qi; S.levelScore = run.roundScore; S.streak = run.streak || 0; S.hits = run.rGood; C().updateHud && C().updateHud(); }
    if (Lv.boss) setTimeout(() => A.sfx.boss(), 200);
  }
  /* ---------------- modo infinito: tras la ronda 12, ya no hay mas rondas numeradas ni campamento ---------------- */
  function infPool() {                                                 // todo el banco de lugares, de todos los temas, sin repetir
    const P = pools(), seen = new Set(), out = [];
    Object.keys(P).forEach(k => P[k].forEach(q => { if (!seen.has(q.cid[0])) { seen.add(q.cid[0]); out.push(q); } }));
    return out;
  }
  function infBatch() {
    const rr = A.rng(`${run.seed}:inf:${run.infN = (run.infN || 0) + 1}`);
    return rr.shuffle(infPool()).map(q => withSub({ ...q }));
  }
  function infiniteLevel() {
    const qs = [].concat(infBatch(), infBatch());                     // dos barajadas del banco entero: de sobra para una sesion normal (se rellena sola si hace falta)
    return {
      name: A.T("Modo infinito", "Infinite mode"), topicName: A.T("Preguntas sin parar", "Nonstop questions"), topic: "mixed", kind: "adventure", boss: false,
      seconds: run.infSeconds, advance: 1, maxPerQ: 1400, bonus: false, plainName: true, questions: () => qs,
      score: (q, km, left) => A.adv.score(q, km, left, true).sc,
    };
  }
  function startInfinite(keep) {
    run.inf = true; run.phase = "round"; run.topic = "mixed"; run.tier = 2; run.chal = []; run.chalName = null; run.chalHalve = 1; run.boss = []; run.wind = null;
    if (!keep) { run.infOver = false; run.infSeconds = 12; run.qi = 0; run.luckUsed = false; run.guardUsed = false; run.rTools = 0; run.rBulls = 0; run.leftSum = 0; run.roundScore = 0; run.rGood = 0; run.streak = 0; refillTools(); }
    const Lv = infiniteLevel(), S = C().S;
    S.run = run; S.camp = { id: "adv", mode: "adventure", title: { es: "Aventura", en: "Adventure" }, home: { lat: 20, lon: 10, zoom: 1 }, levels: [Lv] };
    S.runTotal = run.score; S.runMax = 0; C().map.setHome(S.camp.home); C().map.setStyle(mapStyleFor());
    A.dealer.enable(true); A.chal.begin([], A.chal.fx(perkList()), { seed: run.seed, round: roundNo(), halve: 1 });
    persist(); A.ach.emit("adv", { kind: "round", act: run.act }); C().startLevel(0);
    if (keep) { S.qi = run.qi; S.levelScore = run.roundScore; S.streak = run.streak || 0; S.hits = run.rGood; C().updateHud && C().updateHud(); }
  }
  A.adv.startInfinite = startInfinite;
  A.adv.isInfinite = () => !!(run && run.inf);
  A.adv.infDone = () => !!(run && run.inf && run.infOver);
  function mapStyleFor() { return A.MAPSTYLES[A.skin] || A.MAPSTYLES.casino; }
  const DIRS16 = [["N", "N"], ["NNE", "NNE"], ["NE", "NE"], ["ENE", "ENE"], ["E", "E"], ["ESE", "ESE"], ["SE", "SE"], ["SSE", "SSE"], ["S", "S"], ["SSW", "SSO"], ["SW", "SO"], ["WSW", "OSO"], ["W", "O"], ["WNW", "ONO"], ["NW", "NO"], ["NNW", "NNO"]];
  const dirName = brg => { const idx = Math.round((((brg % 360) + 360) % 360) / 22.5) % 16, d = has("compass16") ? DIRS16[idx] : DIRS16[Math.round(idx / 2) % 8 * 2]; return A.lang === "es" ? d[1] : d[0]; };
  /* en el Reto diario, la etiqueta del acto dice en que intento vas (en lugar del subtitulo del acto) */
  const dailyLbl = k => A.pick6("Reto diario {k}/3|Daily {k}/3|Défi du jour {k}/3|Desafio diário {k}/3|Tagesherausforderung {k}/3|Sfida giornaliera {k}/3||每日挑战 {k}/3|일일 도전 {k}/3|デイリーチャレンジ {k}/3|Испытание дня {k}/3|Wyzwanie dnia {k}/3").replace("{k}", k);
  const actSub = info => (run && run.board && run.dailyTry ? dailyLbl(run.dailyTry) : A.tx(info.t));
  A.adv.introHtml = Lv => {
    if (run.inf) {
      return `<div class="intro-in adv"><div class="intro-left"><div class="intro-num blind">${A.blind("small", "s_compass")}</div><div class="intro-body">
        <span class="tag">${A.tx(actInfo(run.act).n)} · ${A.T("Modo infinito", "Infinite mode")}</span><h2>${A.tx(Lv.topicName)}</h2>
        <p class="intro-sub">${A.T("De todo tipo: mapas, países, monumentos, historia… Cada pregunta, menos tiempo.", "Every kind of question: maps, countries, landmarks, history… Less time on every question.")}</p>
        <p class="adv-goal">${A.fmt1(Lv.seconds)} s</p></div></div>
        <div class="intro-art">${A.pic("topic_mixed")}<div class="intro-dealer" id="introDealer"></div></div></div>`;
    }
    const info = actInfo(run.act), def = rdef(), list = run.chal || [];
    /* territorio nuevo: una ronda mas alla de tu mejor ronda de siempre (desde la 2.a expedicion, una vez por expedicion): sello "Nuevo" y el crupier lo dice */
    const Pv = A.profile.get(); run._virgin = !run.attempt && (Pv.adv.runs || 0) >= 2 && roundNo() + 1 > (Pv.adv.bestRound || 0) && !run.virginShown; if (run._virgin) run.virginShown = true;
    const NEW = A.pick6("Nuevo|New|Nouveau|Novo|Neu|Nuovo||新领域|새 영역|未踏|Впервые|Nowe");
    const chips = list.map(c => { const d = A.CHAL[c.id]; return `<div class="adv-debuff k-${d.kind}"><span>${ic(d.ico)}</span><div><b>${A.tx(d.n)} <i class="ch-lv">${"●".repeat(c.lv || 1)}</i></b><i>${A.tx(d.d)}</i>${c.id === "wind" && run.wind ? `<em>${A.T("Viento hacia", "Wind toward")} ${dirName(run.wind.brg)} · ${A.fmtDist(run.wind.km)}</em>` : ""}</div></div>`; }).join("");
    const kind = Lv.boss ? "boss" : run.round === 0 ? "small" : "big", inner = Lv.boss ? "skull" : run.round === 0 ? "s_pin" : "s_compass";
    return `<div class="intro-in adv${Lv.boss ? " is-boss" : ""}"><div class="intro-left"><div class="intro-num blind">${A.blind(kind, inner)}</div><div class="intro-body">
      <span class="tag">${A.tx(info.n)} · ${actSub(info)}</span><h2>${A.tx(Lv.topicName)}</h2>
      ${Lv.boss && run.chalName ? `<p class="boss-combo">${A.tx(run.chalName)}</p>` : ""}
      <p class="intro-sub">${Lv.boss ? A.T("Jefe del acto", "Act boss") : A.T("Ronda", "Round") + " " + (run.round + 1)} · ${A.tx(info.f)}${run._virgin ? ` <b class="intro-new">${NEW}</b>` : ""}</p>
      <p class="adv-goal">${A.T("Objetivo", "Target")} <b>${A.fmt(Lv.advance)}</b> · ${run.qn} ${A.T("lugares", "places")} · ${Lv.seconds} s</p>
      ${list.length ? `<h4 class="adv-chal-h">${A.T("El crupier toca la mesa", "The dealer touches the table")}</h4>` : ""}${chips}</div></div>
      <div class="intro-art">${A.pic("topic_" + (def.topic === "mixed" ? "mixed" : def.topic))}<div class="intro-dealer" id="introDealer"></div></div></div>`;
  };
  /* el crupier habla en la intro: lo que toca segun el momento de la expedicion (primera, revancha, reanudada, reintento, nuevo acto, jefe...)
     + una frase por reto (y protesta si ya llevas el perk que lo anula). El guion vive en js/dealer.js (D.introSeq). */
  let resumedIntro = false;                                           // la proxima intro es la primera tras reanudar una partida guardada
  A.adv.introReady = (Lv, talked) => {                                // talked: avisa cuando el crupier ha acabado de hablar (con su segundo de mas)
    const host = $("introDealer"); if (!host || !run) return 0; const D = A.dealer, list = run.chal || [];
    D.enable(true); D.dock(host);
    const counters = list.some(c => (A.CHAL[c.id].counters || []).some(id => owned(id)));
    const seq = D.introSeq({
      boss: !!Lv.boss, last: roundNo() === 11, inf: !!run.inf, fresh: run.act === 0 && run.round === 0 && !run.qTotal && !run.attempt, resumed: resumedIntro, ranked: !!run.ranked,
      dailyTry: run.dailyTry || 0, dailyTotal: run.board && run.dailyTry ? A.rank.daily.get(run.board).total : 0,
      act: run.act, round: run.round, attempt: run.attempt, lives: run.lives, chal: list.slice(0, Lv.boss ? 3 : 2).map(c => c.id), counters,
      rn: roundNo() + 1, bossName: Lv.boss && run.chalName ? A.tx(run.chalName) : "", virgin: !!run._virgin,
    });
    resumedIntro = false;
    D.sequence(seq, talked); return seq.reduce((n, it) => n + A.tx(it.line).length * 40 + 900 + D.LINGER, 0);   // cada frase, con su segundo de mas
  };
  A.adv.introEnd = () => { A.dealer.dock(null); A.dealer.release(); };   // si saltas la intro a media frase, la termina en la esquina y se va (sin decir el resto)

  /* ---------------- puntuacion de una pregunta ---------------- */
  A.adv.score = function (o, km, left, noSide) {
    const Lv = C().S.camp.levels[0], limit = C().S.limit || Lv.seconds, halve = 1, boss = run.boss || [], S = C().S;
    const r = roundNo(), c = {
      o, km, left, limit, kind: o.kind || (o.clue ? "clue" : "place"), topic: o.topic || "mixed", cont: continentOf(o), coins: 0, lines: [], xmult: 1, mult: 1, streakStep: 0.2, luck: false,
      scale: clamp(1500 * Math.pow(0.97, r), 300, 1500) * (KIND_FACTOR[o.kind] || 1),   // v0.20: el margen se estrecha un 3 % por ronda (antes 6 %)
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
    c.coinsBase = km == null ? 0 : dist >= 960 ? 1 : 0;                         // solo las dianas dan doblon
    c.coins += c.coinsBase; c.coins = gain(c.coins);
    c.sc = { dist, time, distMax: 1000, timeMax: 400 };
    return c;
  };
  let reactT = 0, abSwapped = false;                                                     // reaccion pendiente del crupier a la ultima respuesta
  A.adv.afterQuestion = function (res) {
    clearTimers();
    { const S0 = C().S, q0 = S0.qs && S0.qs[S0.qi]; A.adv.countSeen(q0, run.topic === "flag" ? "flag" : q0 && q0.topic); }   // v0.20: veces que ha salido cada pregunta
    run.coins += res.coins; run.stats.coinsEarned += res.coins; if (res.dist >= 960) { run.stats.bulls++; run.rBulls = (run.rBulls || 0) + 1; } run.stats.best = Math.max(run.stats.best, res.total);
    if (res.dist >= 750) run.rGood++; run.leftSum += Math.max(0, res.left || 0); run.roundScore += res.total; run.qTotal++;
    const prevStreak = run.streak || 0, prevScore = run.roundScore - res.total, goalLv = C().S.camp && C().S.camp.levels && C().S.camp.levels[0];
    run.streak = res.streak || 0; run.qi++; run.qTools = 0;
    if (run.inf && !run.infOver) {
      const S = C().S, Lv = S.camp.levels[0];
      Lv.seconds = Math.max(3, Math.round((Lv.seconds - 0.2) * 10) / 10); run.infSeconds = Lv.seconds;
      if (S.qs.length - S.qi < 60) S.qs.push(...infBatch());                        // se acerca el final del carrete: se rellena antes de que se note
      const failed = res.km == null || res.dist < 400;
      if (failed) {
        const insured = !!(run.sup && run.sup.seguro), shielded = insured || (has("shieldAct") && run.shieldAct !== run.act);
        if (shielded && !insured) run.shieldAct = run.act; else { run.lives--; run.livesLostAct++; }
        if (run.lives <= 0) run.infOver = true;                                     // se acaban las provisiones: la siguiente pantalla cobra la expedicion
      }
    }
    persist(); A.ach.emit("adv", { kind: "hold", coins: run.coins, perks: run.perks.length, inf: run.inf ? run.qi : 0 });   // inf: preguntas aguantadas en el modo infinito
    const kind = res.km == null ? "timeout" : res.dist >= 960 ? "bull" : res.dist < 400 ? "miss" : res.streak >= 3 ? "streak" : res.dist >= 750 ? "good" : null;
    const qAt = C().S.qi, still = () => { const S2 = C().S; return !!run && S2.qi === qAt && S2.phase === "reveal"; };   // pasaste a la siguiente: ya no la comenta
    /* lo que el crupier sabe de esta respuesta: el lugar, tu mano de verdad y si es "ese sitio otra vez" (js/dealer.js) */
    const oq = C().S.qs[qAt], info = { valid: still, km: res.km, dist: res.dist, hand: res.hand || null, chal: (run.chal || []).map(c => c.id), rk: run.act + ":" + run.round + ":" + (run.attempt || 0),
      place: oq ? A.tx(oq.clue ? oq.answer : oq.name) : "", key: oq ? (oq.cid ? oq.cid[0] : oq.key || (oq.name && (oq.name.en || oq.name.es))) : "",
      dwell: A.dealer.trackEnd ? A.dealer.trackEnd() : 0, streakEnd: prevStreak >= 5 && !run.streak ? prevStreak : 0,
      goal: !run.inf && !!goalLv && prevScore < goalLv.advance && run.roundScore >= goalLv.advance && run.qi < run.qn };
    /* en que pais cayo tu pin y cual se buscaba; y si picaste en una chincheta trampa (solo para lo que dice el crupier) */
    const g = res.guess, P0 = A.pointer;
    if (g && res.km != null && P0 && P0.countryAt) { info.pinC = P0.countryAt(g.lon, g.lat); info.tgtC = oq && oq.t === "c" ? A.tx(oq.clue ? oq.answer : oq.name) : oq ? P0.countryAt(oq.lon, oq.lat) : ""; }
    const dcs = C().map && C().map.decoys; if (g && dcs && dcs.length) info.decoy = dcs.some(d => A.geo.haversine(g.lat, g.lon, d.lat, d.lon) < 90);
    if (A.dealer.noteAnswer) A.dealer.noteAnswer(info);
    clearTimeout(reactT); reactT = setTimeout(() => { if (still()) A.dealer.react(kind || "quiet", info); }, 1300);
  };

  /* ---------------- pistas gratis de reliquias ---------------- */
  let timers = [];
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
  let NE_BY_EN = null;                                               // nombre ingles (Wikipedia/Wikidata) -> nombre del mapa (Natural Earth)
  const neOf = nameEn => {
    const W = C().world.byName; if (!nameEn) return null; if (W[nameEn]) return nameEn;
    if (!NE_BY_EN) { NE_BY_EN = {}; (A.PLACES || []).forEach(r => { if (r[1] === "country") NE_BY_EN[r[6].en] = r[0].slice(2); }); }
    const ne = NE_BY_EN[nameEn] || (A.CODEX_COUNTRY || {})[nameEn]; return ne && W[ne] ? ne : null;
  };
  function revealCountry(o) {
    if (o.t === "c") { noteH(A.T("Continente: ", "Continent: ") + continentName(o), "passport"); return; }
    const ne = o.clue ? null : (o.cEn && o.cEn.length ? o.cEn : [o.sub && o.sub.en]).map(neOf).find(Boolean);   // lugares con dos paises: el primero que exista en el mapa; en las pistas, solo el continente (como antes)
    if (ne && C().world.byName[ne]) { C().map.setMarks({ highlight: ne }); noteH(A.tx(o.sub), "passport"); }
    else noteH(A.T("Continente: ", "Continent: ") + continentName(o), "passport");
  }
  const hints = [];
  const noteH = (txt, icon) => { hints.push(txt); const el = $("factText"); el.textContent = hints.join("  ·  "); if (icon) el.insertAdjacentHTML("afterbegin", A.icon(icon, "sm")); };
  /* el reloj de la pregunta no vuelve a empezar si recargas o sales a mitad: al reanudar sigue con lo que ya habias gastado
     (antes recargar la pagina daba el tiempo entero otra vez, tambien en el Reto diario) */
  const qKey = () => run && `${run.act}:${run.round}:${run.attempt || 0}:${run.qi}:${run.inf ? 1 : 0}`;
  function snapSpent() {
    const S = C() && C().S; if (!run || !S || S.run !== run || S.phase !== "asking") return;
    run.qSpent = { k: qKey(), ms: Math.max(0, (S.paused ? S.pauseAt : performance.now()) - S.t0 - S.pausedAcc) }; persist();
  }
  document.addEventListener("visibilitychange", () => { if (document.hidden) snapSpent(); });
  addEventListener("pagehide", snapSpent);
  A.adv.onQuestion = function () {
    { const o0 = C().S.qs[C().S.qi]; if (A.dealer.trackQ) A.dealer.trackQ(o0 && o0.t !== "c" ? o0.lat : null, o0 && o0.t !== "c" ? o0.lon : null); }   // te vio encima (js/dealer.js)
    if (run && run.qSpent) { if (run.qSpent.k === qKey()) C().S.t0 -= run.qSpent.ms; run.qSpent = null; }
    const S = C().S, o = S.qs[S.qi], kept = o && run.probes && run.probes.length && run.probesK === qKey() + ":" + o.cid[0] ? run.probes : null;   // al reanudar la misma pregunta, las sondas siguen ahi (las cargas ya estaban gastadas)
    clearTimers(); hints.length = 0; run.qTools = 0; run.probes = kept || []; run.tool = null; run.windOff = false; S.tool = null; renderBars();
    if (!o) return;
    const fx = A.chal.fx(perkList()); A.chal.question(o, run.qi);
    if (kept) { C().map.avoid = hudRects(); C().map.setProbes(kept); renderBars(); }
    A.pointer.set({ tool: null, fx, noCountry: o.t === "c", windFn: run.wind ? windGhost : null, distFn: (lon, lat) => { const oo = C().S.qs[C().S.qi]; if (!oo) return null; return oo.t === "c" ? A.geo.distToFeature(lon, lat, C().world.byName[oo.key]) : A.geo.haversine(lat, lon, oo.lat, oo.lon); } });
    const api = {
      fact: o2 => { const txt = A.tx(o2.fact) || (A.factOf && A.factOf(o2)) || ""; if (txt) noteH(txt, "journal"); },
      note: noteH, continent: o2 => continentName(o2), country: revealCountry, addTime: s => { S.limit += s; },
      laterHalf: fn => api.later(S.limit / 2, fn),
      /* cuando queden `sec` segundos del reloj de la pregunta: se recalcula en cada espera (la pausa y el Reloj de arena mueven el momento; antes una pausa lo perdia) */
      later: (sec, fn) => { const tick = () => { if (S.phase !== "asking") return; const left = S.limit - (performance.now() - S.t0 - S.pausedAcc) / 1000; if (!S.paused && left <= sec) return fn(); timers.push(setTimeout(tick, S.paused ? 250 : Math.max(50, (left - sec) * 1000))); }; tick(); },
    };
    perkList().forEach(p => p.open && p.open(api, o, run));
    if (run.qTotal === 0 && A.tour) A.tour.maybe("q");
  };
  /* el viento EMPUJA el puntero: se ve moverse (racha lenta incluida) y el clic cae exactamente donde esta el puntero. Devuelve el desplazamiento en pantalla. */
  const gust = () => 1 + 0.22 * Math.sin(performance.now() / 1000 * 1.9) + 0.08 * Math.sin(performance.now() / 1000 * 5.3);
  const windGhost = (px, py) => { const m = C().map; if (!run || !run.wind || run.windOff) return null; const [lon, lat] = m.screenToLonLat(px, py), a = A.adv.adjust(lon, lat, gust()), p = m.lonLatToScreen(a.lon, a.lat, m.lastCt); return [p[0] - px, p[1] - py]; };
  A.adv.decorate = o => A.chal.decorate(o);
  /* ronda de banderas: la placa muestra la bandera (SVG empaquetado en assets/flags por tools/bundle-media.py; credito en data/flags.js) en vez del nombre */
  A.adv.isFlagRound = () => !!(run && run.topic === "flag");
  A.adv.renderFlag = o => {
    const el = $("askName"); if (!el) return; const sub = $("askSub"); if (sub) sub.textContent = "";
    const rec = A.FLAGS && o.name && A.FLAGS[o.name.en];
    if (!rec) { el.textContent = A.tx(o.name); return; }                          // sin datos empaquetados todavia: se ve el nombre, nunca un hueco vacio
    const src = `assets/flags/${A.mediaKey(o.name.en)}.svg`;
    el.innerHTML = `<img class="ask-flag" src="${src}" alt="" draggable="false">`;
    const img = el.querySelector(".ask-flag"), fx = A.chal.flagFx && A.chal.flagFx();
    if (img && fx) img.style.filter = fx;
  };
  /* el viento desvia el clic */
  A.adv.adjust = function (lon, lat, mul = 1) {
    if (!run || !run.wind || run.windOff) return { lon, lat };
    const wm = (A.chal && A.chal.fxNow && A.chal.fxNow().windMul) || 1;                   // Veleta: el viento empuja la mitad
    const D = Math.PI / 180, d = run.wind.km * wm * mul / 6371, la = lat * D, lo = lon * D, b = run.wind.brg * D;
    const la2 = Math.asin(Math.sin(la) * Math.cos(d) + Math.cos(la) * Math.sin(d) * Math.cos(b));
    const lo2 = lo + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(la), Math.cos(d) - Math.sin(la) * Math.sin(la2));
    return { lon: ((lo2 / D + 540) % 360) - 180, lat: clamp(la2 / D, -85, 85) };
  };

  /* ---------------- herramientas ---------------- */
  A.adv.useTool = function (id) {
    const S = C().S; if (!run || S.phase !== "asking" || S.paused) return;
    const t = run.tools[id], def = TOOLS[id]; if (!t) return;
    if ((run.boss || []).includes("silence")) { A.sfx.deny(); const w = A.T("El Silencio anula tus herramientas.", "Silence cancels your tools."); if (hints[hints.length - 1] !== w) noteH(w); return; }   // el aviso, una vez (antes se repetia en cada pulsacion)
    if (t.left <= 0) { A.sfx.deny(); return; }
    if (def.kind === "probe") {                                      // la pista ("Toca el mapa...") sale encima de la carta: en la nota, esta crecia y la carta saltaba 63 px bajo el raton
      S.tool = S.tool === id ? null : id; A.sfx.flip(!!S.tool); C().map.setPick(true);
      renderBars(); return;
    }
    t.left--; run.qTools++; run.rTools++; A.sfx.buy();
    const o = C().S.qs[S.qi];
    if (id === "hourglass") { S.limit += 6; noteH(A.T("+6 segundos", "+6 seconds")); }
    else if (id === "interruptor") { A.chal.suspend(); run.windOff = true; A.sfx.restore(); noteH(A.T("Retos apagados en esta pregunta", "Challenges off for this question")); A.dealer.react("counter"); }
    else if (id === "swapcard") { if (!swapQuestion()) { t.left++; run.qTools--; run.rTools--; A.sfx.deny(); return; } }
    else if (id === "journal") { const txt = o.clue ? A.tf("Empieza por «{l}» y está en {c}.", "Starts with “{l}” and lies in {c}.", { l: A.tx(o.answer).trim()[0], c: continentName(o) }) : (A.tx(o.fact) || (A.factOf && A.factOf(o)) || A.T("Sin notas para este lugar.", "No notes for this place.")); noteH(txt, "journal"); }
    else if (id === "passport") revealCountry(o);
    persist(); renderBars();
  };
  /* Carta de cambio: otro lugar de la ronda en vez del actual */
  function swapQuestion() {
    const S = C().S, cur = S.qs[S.qi], rr = A.rng(`${run.seed}:swap:${roundNo()}:${S.qi}:${run.qTotal}`); let pick = null;
    if (!cur) return false;
    if (run.inf) { const used = new Set(run.used), cand = infPool().filter(q => !used.has(q.cid[0])); pick = cand.length ? rr.pick(cand) : null; }   // modo infinito: del banco entero
    else {                                                           // v0.20: otra de la misma franja (facil por facil, dificil por dificil), con las reglas de la ronda y del mazo
      const pos = roundNo(), slot = slotOf(pos), B = bandsOf(slot), bi = Math.max(0, B.bands.findIndex(b => b.list.some(q => q.cid[0] === cur.cid[0]))), b = B.bands[bi];
      const others = S.qs.filter((q, i) => q && i !== S.qi);
      pick = takeFrom(b.list, 1, rr, others.slice(), ctxOf(pos, run.used, B.topic), null)[0] || null;
    }
    if (!pick) { noteH(A.T("No quedan lugares para cambiar.", "No places left to swap.")); return false; }
    const q = withSub({ ...pick });
    if (run.curQ && !run.inf) run.curQ[S.qi] = q.cid[0]; run.used.push(q.cid[0]); S.qs[S.qi] = q;
    C().map.clearMarks(); C().refreshPrompt(); hints.length = 0; $("factText").textContent = ""; A.adv.onQuestion(); A.sfx.card(); return true;
  }
  const continentName = o => A.tx(CONT[continentOf(o)] || L("el mar", "the sea"));
  /* distancia aproximada del Sonar, redondeada en la unidad que ves (antes se redondeaba en km y en millas salian cosas como "≈ 621 mi") */
  const approx = km => { const mi = C().S.units === "mi", v = mi ? km / 1.609344 : km, st = v > 500 ? 50 : 10, r = Math.max(st, Math.round(v / st) * st); return "≈ " + A.fmtDist(mi ? r * 1.609344 : r); };
  /* donde se ve el objetivo en el mapa (coordenadas del mapa tal como se dibuja, cada trozo de pais con su continente): el punto del objetivo mas
     cercano a a. La Brujula apunta ahi y, con los continentes movidos, el anillo del Sonar pasa por ahi aunque sondees desde otro continente */
  const seenTarget = (o, f, a, map) => {
    if (!f) return map.sceneOf(o.lon, o.lat);
    let best = null, bd = Infinity;
    for (const p of f.polys) for (const ring of p.rings) for (const [lo, la] of ring) { const q = map.sceneOf(lo, la, p.ct), d = (q[0] - a[0]) ** 2 + (q[1] - a[1]) ** 2; if (d < bd) { bd = d; best = q; } }
    return best;
  };
  /* lo que tapa el HUD en el lienzo del mapa (px): las etiquetas de las sondas lo esquivan. Se lee al sondear, no en cada fotograma */
  const hudRects = () => { const cv = C().map.cv.getBoundingClientRect(); return ["plate", "advBar", "ledger", "rail", "dock", "note", "toolBar"].map(id => $(id)).filter(e => e && e.getClientRects().length).map(e => { const b = e.getBoundingClientRect(), up = e.id === "toolBar" ? 56 : 4; return [b.left - cv.left - 4, b.top - cv.top - up, b.right - cv.left + 4, b.bottom - cv.top + 4]; }); };
  A.adv.probe = function (lon, lat) {
    const S = C().S, id = S.tool, t = run.tools[id], map = C().map; if (!t || t.left <= 0) { S.tool = null; renderBars(); return; }
    const o = S.qs[S.qi]; t.left--; run.qTools++; run.rTools++; S.tool = null; S.probeAt = performance.now();   // un doble clic ya no responde la pregunta (ver onPick)
    const f = o.t === "c" ? C().world.byName[o.key] : null, km = f ? A.geo.distToFeature(lon, lat, f) : A.geo.haversine(lat, lon, o.lat, o.lon);
    const list = (run.probes = run.probes || []), P = { lon, lat, ct: map.pickCt };   // ct: marco del mapa deformado donde tocaste (la sonda se dibuja entera alli)
    run.probesK = qKey() + ":" + o.cid[0];
    if (f ? km === 0 : km < 5) { P.inside = true; P.label = f ? A.T("¡Dentro del país!", "Inside the country!") : A.T("¡Aquí mismo!", "Right here!"); A.sfx.sonar(1); }   // encima del objetivo: ni anillo ni flecha
    else if (id === "sonar") {
      const fz = (A.rng(run.seed + ":sn:" + roundNo() + ":" + S.qi + ":" + list.length)() - 0.5) * (has("sonarErr") ? 0.04 : 0.12);
      P.km = Math.min(20015, km * (1 + fz)); P.label = approx(P.km);   // nunca mas de media vuelta al mundo
      if (P.ct != null) { const a = map.sceneOf(lon, lat, P.ct), b = seenTarget(o, f, a, map); P.dr = Math.hypot(b[0] - a[0], b[1] - a[1]) * (1 + fz); }   // continentes movidos: el anillo se mide en el mapa que ves (los km siguen siendo los de verdad)
      A.sfx.sonar(clamp(1 - km / 8000, 0, 1));
    } else {
      /* Brujula: rumbo en el mapa que ves, hacia el punto del objetivo mas cercano tal como se dibuja. Antes era el rumbo de salida de la ruta por
         el globo, hacia el centro de la caja del pais: en un mapa plano la flecha se desviaba mas de 45 grados en casi la mitad de las sondas
         lejanas, y con los continentes movidos apuntaba a donde no estaba el objetivo */
      const a = map.sceneOf(lon, lat, P.ct), b = seenTarget(o, f, a, map);
      const brg = (Math.atan2(b[0] - a[0], b[1] - a[1]) * 180 / Math.PI + 360) % 360, step = has("compass16") ? 22.5 : 45, snap = (Math.round(brg / step) * step) % 360;
      P.bearing = snap; P.label = dirName(snap); A.sfx.sonar(0.8);
    }
    list.push(P); map.avoid = hudRects(); map.setProbes(list); persist(); renderBars();   // el resultado tambien encima de las cartas (renderBars): con el apagon o el mapa borroso la etiqueta del mapa no se lee
    if (list.length >= 3) A.ach.emit("adv", { kind: "probe", n: list.length });
  };

  /* ---------------- barras de estado (durante la partida) ---------------- */
  function ensureBars() {
    let el = $("advBar"); if (el) return;
    el = document.createElement("div"); el.id = "advBar"; el.className = "adv-bar hidden"; ($("leftCol") || $("app")).appendChild(el);
    const tb = document.createElement("div"); tb.id = "toolBar"; tb.className = "tool-bar hidden"; $("app").appendChild(tb);
  }
  function hearts() { let h = ""; for (let i = 0; i < run.maxLives; i++) h += `<i class="hp ${i < run.lives ? "on" : ""}">${ic("heart")}</i>`; return h; }
  /* botin en vivo en el marcador: en cuanto superas el objetivo, cuanto cobrarias ya y a cuantos puntos esta el siguiente doblon */
  function renderLoot() {
    const led = $("ledger"); if (!led) return;
    let el = $("scLoot"); if (!el) { el = document.createElement("div"); el.id = "scLoot"; el.className = "lg-loot hidden"; el.dataset.tf = "loot"; led.insertBefore(el, $("streakChip")); }
    const S = C().S, Lv = S.camp && S.camp.levels && S.camp.levels[0];
    const on = !!(run && !run.inf && Lv && S.camp.mode === "adventure" && ["asking", "reveal"].includes(S.phase) && S.levelScore >= Lv.advance);
    el.classList.toggle("hidden", !on); if (!on) return;
    const lt = loot(S.levelScore, Lv.advance, isBoss()), got = gain(lt.base + lt.margin);
    el.innerHTML = `<span>${A.tx(ETX.loot)}</span><b>${CN()}+${got}</b><i>${lt.next ? et("next", { c: gain(lt.base + lt.margin + 1), s: A.fmt(lt.next) }) : A.tx(ETX.max)}</i>`;
  }
  if (A.tips) A.tips.loot = () => A.tx(ETX.lootTip) + "\n" + A.tx(ETX.lootTipD);
  function renderBars() {
    ensureBars(); const bar = $("advBar"), tb = $("toolBar"); renderLoot();
    if (!run || !C().S.camp || C().S.camp.mode !== "adventure" || ["title", "levelEnd", "shop"].includes(C().S.phase)) { bar.classList.add("hidden"); tb.classList.add("hidden"); return; }
    const info = actInfo(run.act), silenced = (run.boss || []).includes("silence");
    bar.classList.remove("hidden");
    bar.innerHTML = `<div class="ab-top"><span class="ab-act" data-tf="abact">${A.tx(info.n)}</span><span class="ab-coins" id="abCoins" data-tf="abcoins">${CN()}<b>${run.coins}</b></span><span class="ab-hearts" data-tf="abhearts">${hearts()}</span></div>
      <div class="ab-perks">${run.perks.map(id => `<span class="ab-perk" title="${A.tx(A.RELICS[id].n)} — ${A.tx(A.RELICS[id].d)}">${ic(id)}</span>`).join("")}</div>
      ${(run.chal || []).length ? `<div class="ab-chal">${run.chal.map(c => A.chal.chip(c, true)).join("")}</div>` : ""}
      ${run.wind ? `<div class="ab-wind"><svg viewBox="-12 -12 24 24" style="transform:rotate(${run.wind.brg}deg)"><path d="M0 -9 L6 4 L0 1 L-6 4 Z"/></svg><span>${dirName(run.wind.brg)} · ${A.fmtDist(run.wind.km)}</span></div>` : ""}`;
    const ids = Object.keys(run.tools);
    tb.classList.toggle("hidden", !ids.length || C().S.phase !== "asking");
    const aim = id => (id === "sonar" ? A.T("Toca el mapa para lanzar una sonda…", "Tap the map to send a probe…") : A.T("Toca el mapa para orientar la brújula…", "Tap the map to aim the compass…"));
    const res = !C().S.tool && (run.probes || []).length ? `<i class="tl-res">${run.probes.map(p => p.label).join("  ·  ")}</i>` : "";   // lo que han dicho las sondas de esta pregunta
    tb.innerHTML = res + ids.map((id, i) => { const t = run.tools[id], on = C().S.tool === id, off = t.left <= 0 || silenced; return `<button class="tool pc-hand${on ? " on" : ""}${off ? " off" : ""}" data-tool="${id}" style="--r:${((i - (ids.length - 1) / 2) * 6).toFixed(1)}deg" title="${A.tx(TOOLS[id].n)} — ${A.tx(TOOLS[id].d)}">${on && TOOLS[id].kind === "probe" ? `<i class="tl-aim">${aim(id)}</i>` : ""}<span class="tl-ico felt">${ic(TOOLS[id].ico)}</span><b>${A.tx(TOOLS[id].n)}</b><span class="tl-pips">${Array.from({ length: toolMax(id) }, (_, k) => `<i class="${k < t.left ? "on" : ""}"></i>`).join("")}</span><kbd>${i + 1}</kbd></button>`; }).join("");
    tb.querySelectorAll(".tool").forEach(b => (b.onclick = () => A.adv.useTool(b.dataset.tool)));
    if (A.pointer) A.pointer.set({ tool: C().S.tool });
  }
  A.adv.refresh = renderBars;
  A.adv.hideBars = () => { const a = $("advBar"), b = $("toolBar"), l = $("scLoot"); if (a) a.classList.add("hidden"); if (b) b.classList.add("hidden"); if (l) l.classList.add("hidden"); };
  A.adv.hudTitle = () => { const Lv = C().S.camp.levels[0]; return run && run.inf ? `${A.tx(Lv.name)} · ${A.tx(Lv.topicName)} · ${A.fmt1(Lv.seconds)} s` : `${A.tx(Lv.name)} · ${A.tx(Lv.topicName)} · ${A.T("Objetivo", "Target")} ${A.fmt(Lv.advance)}`; };
  A.adv.toolKey = n => { const ids = run ? Object.keys(run.tools) : []; if (ids[n]) A.adv.useTool(ids[n]); };
  A.adv.cancelTool = () => { const S = C().S; if (S.tool) { S.tool = null; renderBars(); } };

  /* ---------------- fin de ronda ---------------- */
  A.adv.roundEnd = function () {
    if (run.inf) { run.score += C().S.levelScore; run.sup = {}; persist(); A.adv.hideBars(); return endRun(true); }   // modo infinito: sin provisiones, se cobra directamente
    const S = C().S, Lv = S.camp.levels[0], pass = S.levelScore >= Lv.advance, boss = isBoss();
    if (A.dealer.noteTricks) A.dealer.noteTricks((run.chal || []).map(c => c.id), pass);   // el historial de cada truco (lo cuenta el crupier en la intro)
    if (A.dealer.noteRound) A.dealer.noteRound(pass);                                     // el marcador historico: tu contra la banca
    S.phase = "levelEnd"; A.adv.hideBars(); clearTimers(); clearTimeout(reactT); A.chal.end(); C().map.setStyle(mapStyleFor());
    if (pass) {
      run.score += S.levelScore; run.cleared++; S.runTotal = run.score;
      const lt = loot(S.levelScore, Lv.advance, boss), x = { coins: lt.base + lt.margin }, lines = [[A.T("Ronda superada", "Round cleared"), "+" + lt.base]];
      if (lt.margin) lines.push([et("margin", { p: pctOf(S.levelScore - Lv.advance, Lv.advance) }), "+" + lt.margin]);   // cuanto mas por encima del objetivo, mas doblones
      const cap = sumFlag("interest") || 2, interest = Math.min(cap, Math.floor(run.coins / 10));
      if (interest) { x.coins += interest; lines.push([A.T("Interés (1 por cada 10)", "Interest (1 per 10)"), "+" + interest]); }
      perkList().forEach(p => { if (p.clear) { const y = { coins: 0 }, tx = p.clear(y, run); if (y.coins) { x.coins += y.coins; lines.push([A.tx(p.n), tx || "+" + y.coins]); } } });
      const got = gain(x.coins); if (got !== x.coins) lines.push([A.T("Doblones ×2", "Doubloons ×2"), "+" + (got - x.coins)]);
      run.coins += got; run.stats.coinsEarned += got;
      A.ach.emit("adv", { kind: "clear", tools: run.rTools, bulls: run.rBulls || 0 }); if (boss) { A.ach.emit("adv", { kind: "boss", lives: run.lives }); A.profile.get().adv.boss++; }
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
        buttons: [{ id: "nlBtn", cls: "btn-ink", label: boss ? A.T("Abrir el cofre del jefe", "Open the boss chest") : A.T("Al campamento", "To camp"), arrow: true, primary: true, onclick: () => { if (boss && run.act < 2 && !run.chestStuckDone && Math.random() < 0.6) { run.chestStuckDone = true; persist(); return stuckChest(); } afterVerdict(boss); } }, { id: "vdMenu", cls: "btn-line", label: A.T("Menú", "Menu"), onclick: () => C().runMenu(), keep: true }],
      });
      const wb = { big: lt.margin >= 3, c: got, p: pctOf(S.levelScore - Lv.advance, Lv.advance), rn: roundNo() + 1, close: S.levelScore - Lv.advance < Lv.advance * 0.05 ? S.levelScore - Lv.advance : null };   // close: por los pelos   // aplastar la meta (+50 %) tiene sus propias frases
      setTimeout(() => A.dealer.react("roundWin", wb), 700);                // el crupier protesta (antes estas frases nunca se decian)
    } else {
      const insured = !!(run.sup && run.sup.seguro), shielded = insured || (has("shieldAct") && run.shieldAct !== run.act);
      if (shielded && !insured) run.shieldAct = run.act; else if (!shielded) { run.lives--; run.livesLostAct++; }
      run.attempt++; run.phase = "retry";
      /* consuelo: lo que puntuaste en la ronda fallida se cobra (1 por cada tercio del objetivo) para comprar ayuda antes de la revancha */
      const q = S.levelScore / Math.max(1, Lv.advance), conso = run.lives > 0 ? gain(consoOf(q)) : 0;
      if (conso) { run.coins += conso; run.stats.coinsEarned += conso; }
      persist();
      A.sfx.stamp(); setTimeout(A.sfx.lose, 300);
      if (run.lives <= 0) return endRun(false);
      C().verdict({
        kind: "", level: roundNo() + 1, tag: `${A.tx(actInfo(run.act).n)} · ${boss ? A.T("Jefe", "Boss") : A.T("Ronda", "Round") + " " + (run.round + 1)}`, title: A.T("No llegaste al objetivo", "Target missed"),
        text: (shielded ? A.pick6("¡El seguro te salva: no pierdes provisión! |Insurance saves you: no provision lost! |L'assurance te sauve : aucune provision perdue ! |O seguro te salva: nenhuma provisão perdida! |Die Versicherung rettet dich: kein Proviant verloren! |L'assicurazione ti salva: nessuna provvista persa! ||保险救了你：没有损失补给！ |보험이 당신을 구했습니다: 식량 손실 없음! |保険が守ってくれた：プロビジョンは失われなかった！ |Страховка спасла тебя: ни один запас не потерян! |Ubezpieczenie cię ratuje: żaden zapas nie przepada! ") : "") + (run.lives === 1 ? A.tf("Te quedaste en {s} de {a}. Te queda {n} provisión.", "You scored {s} of {a}. You have {n} provision left.", { s: A.fmt(S.levelScore), a: A.fmt(Lv.advance), n: run.lives }) : A.tf("Te quedaste en {s} de {a}. Te quedan {n} provisiones.", "You scored {s} of {a}. You have {n} provisions left.", { s: A.fmt(S.levelScore), a: A.fmt(Lv.advance), n: run.lives })),   // el Seguro (reliquia) o el Seguro de ronda: el "Escudo" ya no existe
        lines: conso ? [[et("conso", { p: pctOf(S.levelScore, Lv.advance) }), "+" + conso]] : [],
        stats: [[A.T("Puntos de la ronda", "Round points"), S.levelScore], [A.T("Objetivo", "Target"), Lv.advance], [A.T("Doblones", "Doubloons"), run.coins]], stamp: A.T("FALLIDA", "FAILED"), stampSub: String(run.lives), art: "lose",
        buttons: [{ id: "rtBtn", cls: "btn-ink", label: A.T("Reintentar con lugares nuevos", "Retry with new places"), arrow: true, primary: true, onclick: () => openShop(false) }, { id: "abBtn", cls: "btn-line", label: A.T("Abandonar", "Abandon"), onclick: () => endRun(false) }],
      });
      const lives = run.lives; setTimeout(() => A.dealer.react("roundFail", { lives, conso }), 700);
      A.dealer.hover($("abBtn"), "hoverAbandon");                            // si el cursor va hacia Abandonar, el crupier lo ve
      { const ab = $("abBtn"); if (ab && !abSwapped) ab.addEventListener("pointerenter", () => { if (abSwapped || !ab.isConnected) return; abSwapped = true; const sp = ab.querySelector("span"); if (sp) sp.textContent = A.pick6("Abandonar (y dejarle ganar)|Abandon (and let him win)|Abandonner (et le laisser gagner)|Abandonar (e deixar ele ganhar)|Aufgeben (und ihn gewinnen lassen)|Abbandona (e lascialo vincere)||放弃（让他赢）|포기 (그가 이기게 두기)|やめる（彼を勝たせる）|Сдаться (и дать ему выиграть)|Poddaj się (i daj mu wygrać)"); if (A.sfx.buzz) A.sfx.buzz(1); }); }   // el boton dice la verdad (una vez por sesion)
    }
    if (run.sup && run.sup.seguro) run.segN = (run.segN || 0) + 1;         // Seguro gastado: el siguiente cuesta 2 mas
    run.sup = {}; persist();                                                // los suministros solo valen para una ronda
  };
  /* el primer clic en "Abrir el cofre" no lo abre: el cofre (la medalla) tiembla y el crupier confiesa que lo esta sujetando; el segundo ya lo abre */
  function stuckChest() {
    const m = document.querySelector(".v-medal"), b = $("nlBtn"), S = C().S, reduced = (S && S.reduce) || matchMedia("(prefers-reduced-motion: reduce)").matches;
    A.sfx.deny();
    if (!reduced) [m, b].forEach(e => e && e.animate([{ transform: "none" }, { transform: "translateX(-6px) rotate(-4deg)" }, { transform: "translateX(5px) rotate(3deg)" }, { transform: "translateX(-3px) rotate(-2deg)" }, { transform: "none" }], { duration: 420, easing: "ease-out" }));
    if (A.dealer.chestStuck) A.dealer.chestStuck();
  }
  function afterVerdict(boss) { if (boss && run.act + 1 === 3 && !run.won) return winScreen(); nextStep(boss); }
  function nextStep(boss) {
    if (boss) { run.act++; run.round = 0; run.attempt = 0; perkList().forEach(p => p.actStart && p.actStart(run)); openShop(true); }
    else { run.round++; run.attempt = 0; openShop(false); }
  }
  function winScreen() {
    run.won = true; run.act++; run.round = 0; run.attempt = 0; run.phase = "win"; persist(); A.sfx.victory();
    const PA = A.profile.get().adv; PA.wins++; PA.deckWins = PA.deckWins || {}; PA.deckWins[run.deck] = (PA.deckWins[run.deck] || 0) + 1; A.profile.save();
    A.ach.emit("adv", { kind: "win", deck: run.deck });
    showWinChoice();
  }
  /* ronda 12 es la ultima: desde aqui solo se puede cobrar o pasar al modo infinito (nunca mas rondas numeradas) */
  function showWinChoice() {
    C().verdict({
      kind: "win", level: 12, tag: A.T("Tres actos completados", "Three acts completed"), title: A.T("¡Terra Incognita conquistada!", "Terra Incognita conquered!"),
      text: A.pick6("Has completado los tres actos. Puedes cobrar tu gloria ahora o entrar en el modo infinito: preguntas sin parar de todo tipo, cada vez con menos tiempo, hasta que se te acaben las provisiones.|You've completed all three acts. Cash out your glory now, or enter infinite mode: nonstop questions of every kind, with less time on each one, until you run out of provisions.|Tu as terminé les trois actes. Encaisse ta gloire maintenant, ou entre dans le mode infini : des questions de tout genre sans arrêt, avec moins de temps à chaque question, jusqu'à épuiser tes provisions.|Você completou os três atos. Recolha sua glória agora ou entre no modo infinito: perguntas de todo tipo sem parar, com menos tempo a cada pergunta, até acabarem suas provisões.|Du hast alle drei Akte geschafft. Kassiere jetzt deinen Ruhm oder starte den Endlosmodus: Fragen aller Art ohne Pause, mit jeder Frage weniger Zeit, bis dein Proviant aufgebraucht ist.|Hai completato i tre atti. Incassa la gloria ora oppure entra nella modalità infinita: domande di ogni tipo senza sosta, con meno tempo a ogni domanda, finché non finiscono le provviste.|Completaste los tres actos. Puedes cobrar tu gloria ahora o entrar al modo infinito: preguntas sin parar de todo tipo, cada vez con menos tiempo, hasta que se te acaben las provisiones.|你已完成全部三幕。现在兑现荣耀，或进入无尽模式：各类问题接连不断，每题时间越来越少，直到补给耗尽。|세 막을 모두 완료했습니다. 지금 영광을 현금화하거나 무한 모드에 들어가세요: 식량이 떨어질 때까지 모든 종류의 문제가 끝없이, 문제마다 더 짧은 시간으로 이어집니다.|3つの幕をすべて完了した。今すぐ栄光を現金化するか、エンドレスモードへ：プロビジョンが尽きるまで、あらゆる問題がノンストップで、1問ごとに時間が短くなる。|Ты прошёл все три акта. Забери свою славу сейчас или войди в бесконечный режим: вопросы всех видов без остановки, с каждым вопросом времени меньше, пока не кончатся запасы.|Ukończyłeś wszystkie trzy akty. Zgarnij chwałę teraz albo wejdź w tryb nieskończony: pytania wszelkiego rodzaju bez przerwy, z coraz krótszym czasem, aż skończą ci się zapasy."),
      stats: [[A.T("Total de la expedición", "Expedition total"), run.score], [A.T("Doblones", "Doubloons"), run.coins]], stamp: A.T("VICTORIA", "VICTORY"), stampSub: A.icon("u_star", "st"), art: "win",
      buttons: [{ id: "infBtn", cls: "btn-ink", label: A.T("Modo infinito", "Infinite mode"), arrow: true, primary: true, onclick: () => startInfinite() }, { id: "endBtn", cls: "btn-line", label: A.T("Cobrar y terminar", "Cash out"), onclick: () => endRun(true) }],
    });
  }

  /* ---------------- campamento: tres cartas (se pueden cambiar pagando) ---------------- */
  /* v0.35: solo salen cartas que sirven en ESTA expedicion (ver useful); las contras pesan mas cuantas mas rondas frenan y si frenan la proxima;
     y tras fallar, una carta frena los trucos de la ronda que repites (o el Interruptor, si ninguna reliquia puede) */
  function offers(chest) {
    const rr = A.rng(`${run.seed}:shop:${roundNo()}:${run.attempt || 0}:${run.shopN}:${chest ? 1 : 0}`), R = A.RELICS, out = [];
    const bag = Object.keys(R).filter(id => !owned(id) && (chest ? true : R[id].r < 3) && useful(id));
    const cur = chalFor(roundNo()).list, up = new Set(); cur.forEach(c => (A.CHAL[c.id].counters || []).forEach(id => up.add(id)));
    const reach = {}; bag.forEach(id => { if (ctrOf(id)) reach[id] = helpRounds(id).length; });
    const wt = id => { const r = R[id].r; return (chest ? [30, 35, 25, 10][r] : [60, 30 + run.act * 4, 10 + run.act * 5][r]) * (up.has(id) ? 2.6 : 1) * (reach[id] ? 0.7 + 0.3 * Math.min(4, reach[id]) : 1); };
    const draw = (pool = bag) => { const tot = pool.reduce((n, id) => n + wt(id), 0); let x = rr() * tot, pick = pool[pool.length - 1]; for (const id of pool) { x -= wt(id); if (x <= 0) { pick = id; break; } } bag.splice(bag.indexOf(pick), 1); return pick; };
    const canTool = id => !!run.tools[id] || Object.keys(run.tools).length < 4;   // con 4 herramientas distintas solo sirven cargas de las tuyas
    const slots = chest ? 3 : shopCtx().slots;
    if (!chest && run.attempt > 0 && cur.length && run.fixUsed !== `${roundNo()}:${run.attempt}`) {   // la carta de la revancha va a mitad de precio (fix: ver cardCost); una sola por revancha aunque cambies cartas
      const fix = bag.filter(id => up.has(id));
      if (fix.length) out.push({ k: "perk", id: draw(fix), fix: true });
      else if (canTool("interruptor")) out.push({ k: "tool", id: "interruptor", fix: true });
    }
    while (out.length < slots) {
      const roll = rr();
      if (!chest && roll < 0.16) { const tk = Object.keys(TOOLS).filter(id => canTool(id) && !out.some(o => o.id === id)); if (tk.length) { out.push({ k: "tool", id: rr.pick(tk) }); continue; } }
      if (!chest && roll > 0.93 && run.lives < run.maxLives && !out.some(o => o.k === "life")) { out.push({ k: "life" }); continue; }
      if (!bag.length) break;
      out.push({ k: "perk", id: draw() });
    }
    return out;
  }
  function openShop(chest) {
    const S = C().S; S.phase = "shop"; A.adv.hideBars(); clearTimers(); A.chal.end(); A.dealer.release(); run.phase = chest ? "chest" : "shop";
    const key = `${roundNo()}:${run.attempt || 0}:${run.shopN}:${chest}`, visit = `${roundNo()}:${run.attempt || 0}:${chest}`, newVisit = run.shopKey !== visit;
    if (newVisit) run.visitBuys = 0;
    if (!run.stock || run.stockKey !== key) { run.stock = offers(chest); run.stockKey = key; run.bought = []; if (run.shopKey !== visit) { run.shopKey = visit; run.rerolls = 0; run.freeUsed = 0; } }
    persist(); renderShop(chest);
    if (newVisit && A.dealer.campArrive) {                                            // el crupier se sienta a la mesa (js/dealer.js)
      const cf = chalFor(roundNo()), costs = (run.stock || []).map(s => (s.k === "life" ? lifePrice() : cardCost(s)));
      A.dealer.campArrive({ chest, coins: run.coins, n: cf.list.length, r: roundNo() + 1, boss: !!cf.boss && !chest, bossName: cf.combo ? A.tx(cf.combo.n) : "", retry: run.attempt > 0,
        newAct: run.round === 0 && run.act > 0 && !run.attempt, cheapest: costs.length ? Math.min(...costs) : 0 });
    }
  }
  /* "proxima ronda" del Campamento: una tarjeta por ronda con cada truco explicado (que hace y cuanto pesa).
     El jefe del acto es una tarjeta grande con su nombre y numero de poderes; con el Ojo en el cielo tambien se ve la ronda siguiente.
     v0.35: ya no dice que reliquia frena cada truco (ni las cartas contra que truco sirven): el jugador tiene que leer y atar cabos. */
  const nextHtml = () => {
    const r = roundNo(), rows = [r]; if (has("spy") && r < LAST) rows.push(r + 1);   // tras la ronda 12 no hay mas trucos (antes el Ojo en el cielo ensenaba una "Ronda 1" que no existe)
    const html = rows.map((rr, k) => {
      const cf = chalFor(rr), n = cf.list.length, done = cf.paid, main = k === 0;   // sobornados que estaban en esta tirada (un soborno de un truco retirado o que ya no sale no se pinta)
      const title = cf.boss ? A.T("JEFE DEL ACTO", "ACT BOSS") : A.T("Ronda", "Round") + " " + ((rr % 4) + 1);
      const head = `<div class="nx-head">${ic(cf.boss ? "skull" : "dice")}<span class="nx-t">${main ? A.T("Próxima ronda", "Next round") + " · " : A.T("Después", "Then") + " · "}${title}</span>${cf.boss && cf.combo ? `<b class="nx-name">${A.tx(cf.combo.n)}</b>` : ""}<span class="nx-n">${n ? n + " " + (n === 1 ? A.T("reto", "challenge") : A.T("retos", "challenges")) : A.T("Sin retos", "No challenges")}</span>${main && n ? `<button class="chipbtn ch-reroll" id="chalReroll" data-tt="${A.T("Barajar: el crupier elige otros retos para la próxima ronda", "Reshuffle: the dealer picks other challenges for the next round")}">${ic("dice", "sm")}<span>${A.T("Barajar", "Reshuffle")}</span><em>${CN()}${chalRerollCost()}</em></button>` : ""}</div>`;
      if (!main) return `<div class="nx-card far${cf.boss ? " boss" : ""}">${head}<div class="nx-chips">${cf.list.map(c => A.chal.chip(c, true)).join("")}</div></div>`;
      const lis = cf.list.map(c => { const d = A.CHAL[c.id];
        return `<li class="nx-row k-${d.kind}"><span class="nx-ic">${ic(d.ico)}</span><div class="nx-body"><b>${A.tx(d.n)} <i class="ch-lv">${"●".repeat(c.lv || 1)}</i></b><p>${A.tx(d.d)}</p><div class="nx-foot">
          <button class="ch-buy" data-r="${rr}" data-id="${c.id}" data-tt="${A.T("Sobornar al crupier: quita este reto de la próxima ronda. Cada soborno encarece los siguientes.", "Bribe the dealer: removes this challenge from the next round. Each bribe makes the next ones pricier.")}">${A.T("Sobornar", "Bribe")} <span class="cb-p">${CN()}${bribePrice(c, cf.boss)}</span></button></div></div></li>`; }).join("")
        + done.map(id => `<li class="nx-row done"><span class="nx-ic">${ic(A.CHAL[id].ico)}</span><div class="nx-body"><b>${A.tx(A.CHAL[id].n)}</b><em class="nx-have">${A.T("Sobornado", "Bribed")}</em></div></li>`).join("");
      return `<div class="nx-card${cf.boss ? " boss" : ""}">${head}${lis ? `<ul class="nx-list">${lis}</ul>` : `<p class="nx-clean">${A.T("Ronda limpia: solo tú y el mapa.", "A clean round: just you and the map.")}</p>`}</div>`;
    }).join("");
    return `<div class="tb-next">${html}</div>`;
  };
  /* v0.3.1: sobornar es caro y el crupier sube la tarifa. Base: 3 + 2 por nivel del truco (+1 si es de mapa), el doble en el jefe, y sube con el acto
     y la ascension como todo lo demas. Cada soborno pagado en la expedicion encarece los siguientes un 50 % del precio base (barajar no lo reinicia).
     Con dev/bot.js (bribe, sin cartas), quien solo sobornaba quitaba el 58-67 % de los trucos (todos los del acto I); ahora el 17-21 %:
     los trucos son el juego, y la contra comprada a tiempo sale mucho mas a cuenta */
  const bribePrice = (c, boss) => { const d = A.CHAL[c.id]; return Math.max(2, Math.round((3 + 2 * (c.lv || 1) + (d.kind === "map" ? 1 : 0)) * (boss ? 2 : 1) * (1 + 0.5 * (run.bribeN || 0)) * ascFx(run.asc).price * inflation())); };
  const chalRerollCost = () => 4 + 2 * ((run.salt && run.salt[roundNo()]) || 0);
  function bribe(id) {
    const r = roundNo(), cf = chalFor(r), c = cf.list.find(x => x.id === id); if (!c) return; const cost = bribePrice(c, cf.boss);
    if (run.coins < cost) { A.sfx.deny(); flash(A.T("No te alcanzan los doblones.", "Not enough doubloons.")); return; }
    run.coins -= cost; run.bribeN = (run.bribeN || 0) + 1; run.bribed = run.bribed || {}; (run.bribed[r] = run.bribed[r] || []).push(id); A.sfx.buy(); persist(); A.ach.emit("adv", { kind: "bribe" });
    A.dealer.enable(true); A.dealer.say(A.dealer.line("bribe"), { mood: "angry", hold: 1800 }); renderShop(run.phase === "chest");
  }
  function rerollChal() {
    const r = roundNo(), cost = chalRerollCost(); if (run.coins < cost) { A.sfx.deny(); flash(A.T("No te alcanzan los doblones.", "Not enough doubloons.")); return; }
    run.coins -= cost; run.salt = run.salt || {}; run.salt[r] = (run.salt[r] || 0) + 1; A.sfx.reroll(); persist();   // los sobornos pagados se quedan: si el truco vuelve a salir, sigue fuera
    A.dealer.enable(true); A.dealer.say(A.dealer.line("reroll"), { mood: "laugh", hold: 1800 }); renderShop(run.phase === "chest");
  }
  const routeHtml = () => { let h = ""; const cur = roundNo(); for (let i = Math.max(0, cur - 3); i < Math.max(0, cur - 3) + 12; i++) h += `<i class="${i < cur ? "done" : i === cur ? "cur" : ""}${i % 4 === 3 ? " boss" : ""}" ${A.roundTip(i, run.route)}>${i % 4 === 3 ? ic("skull") : ""}</i>`; return h; };
  const rerollCost = () => { const sx = shopCtx(); return run.freeUsed < sx.freeReroll ? 0 : 3 + run.rerolls; };
  /* precio de una carta de la tienda: la de la revancha (s.fix) va a mitad de precio */
  const cardCost = s => { const full = price(s.k === "perk" ? A.RELICS[s.id].cost : TOOLS[s.id].cost); return s.fix ? Math.max(1, Math.ceil(full / 2)) : full; };
  const costHtml = s => (s.fix ? `${CN()}<s class="of-was">${price(s.k === "perk" ? A.RELICS[s.id].cost : TOOLS[s.id].cost)}</s>${cardCost(s)}` : CN() + cardCost(s));
  function cardHtml(s, i, chest) {
    const bought = run.bought.includes(i);
    if (s.k === "perk") {
      const p = A.RELICS[s.id];                                           // la carta solo cuenta lo que hace: contra que truco sirve lo descubre el jugador leyendo
      return `<div class="offer pc r${p.r}${bought ? " sold" : ""}" data-i="${i}" data-suit="${suitRed(p.suit) ? "red" : "blk"}">${ixs(p.cost, p.suit)}<span class="of-r">${A.tx(R_NAMES[p.r])}</span><div class="of-ico felt">${ic(p.ico)}</div><b class="of-n">${A.tx(p.n)}</b><p>${A.tx(p.d)}</p><button class="buy" ${bought ? "disabled" : ""}>${bought ? A.T("Comprado", "Owned") : chest ? A.T("Elegir gratis", "Take for free") : costHtml(s)}</button></div>`;
    }
    if (s.k === "tool") {
      const t = TOOLS[s.id], have = run.tools[s.id];
      return `<div class="offer pc otool r${t.r}${bought ? " sold" : ""}" data-i="${i}" data-suit="blk">${ixs("A", "s_palm")}<span class="of-r">${A.T("Herramienta", "Tool")}</span><div class="of-ico felt">${ic(t.ico)}</div><b class="of-n">${A.tx(t.n)}${have ? ` <em>+1 ${A.T("carga", "charge")}</em>` : ""}</b><p>${A.tx(t.d)}</p><button class="buy" ${bought ? "disabled" : ""}>${bought ? A.T("Comprado", "Owned") : costHtml(s)}</button></div>`;
    }
    return `<div class="offer pc life${bought ? " sold" : ""}" data-i="${i}" data-suit="red">${ixs("♥", "heart")}<span class="of-r">${A.T("Provisión", "Provision")}</span><div class="of-ico felt">${ic("heart")}</div><b class="of-n">+1 ${A.T("provisión", "provision")}</b><p>${A.tf("Recupera una provisión (máx. {n}).", "Restore a provision (max {n}).", { n: run.maxLives })}</p><button class="buy" ${bought || run.lives >= run.maxLives ? "disabled" : ""}>${CN()}${lifePrice()}</button></div>`;
  }
  function renderShop(chest) {
    const slots = 5, info = actInfo(run.act), rc = rerollCost();
    const cards = run.stock.map((s, i) => cardHtml(s, i, chest)).join("") || `<p class="tb-empty">${A.T("No quedan cartas: ¡sigue adelante!", "No cards left: move on!")}</p>`;
    /* la mochila no avisa de que una reliquia ya no sirve: saber cuando venderla tambien es cosa del jugador */
    const relicSlots = Array.from({ length: slots }, (_, k) => { const id = run.perks[k]; return id ? `<button class="inv-perk" data-sell="${id}" title="${A.tx(A.RELICS[id].n)} — ${A.tx(A.RELICS[id].d)}">${ic(id)}<b class="ivn">${A.RELICS[id].cost}</b>${chest ? "" : `<em>${A.T("vender", "sell")} ${sellValue(id)}</em>`}</button>` : `<span class="inv-empty"></span>`; }).join("");
    const retryNote = !chest && run.stock.some((s, i) => s.fix && !run.bought.includes(i));
    /* antes del jefe, el crupier te reescribe el boton (funciona igual) */
    const doom = !chest && !!chalFor(roundNo()).boss, DOOM = A.pick6("Ir al matadero|To the slaughter|À l'abattoir|Pro matadouro|Zur Schlachtbank|Al macello||去送死|도살장으로|処刑台へ|На убой|Na rzeź");   // revancha: queda la carta a mitad de precio que frena los trucos de la ronda que repites
    C().dialog(`<div class="table${chest ? " chest" : ""}">
      <header class="tb-head"><div class="tb-title"><span class="tag">${A.tx(info.n)} · ${actSub(info)}</span><h2>${chest ? A.T("Cofre del jefe", "Boss chest") : A.T("Campamento", "Camp")}</h2></div>
        <div class="route">${routeHtml()}</div><div class="tb-right"><button class="chipbtn tb-menu" id="shopMenu" type="button">${A.icon("u_pause", "sm")}<span>${A.T("Menú", "Menu")}</span></button><div class="tb-coins" id="shopCoins">${CN()}<b>${run.coins}</b></div></div></header>
      ${nextHtml()}
      ${chest ? `<p class="tb-note">${A.T("Elige UNA reliquia gratis. Aquí pueden salir legendarias.", "Pick ONE relic for free. Legendaries can show up here.")}</p>` : `<p class="tb-note">${retryNote ? A.tx(ETX.retry) : A.T("Tres cartas sobre la mesa. ¿Compras una o pides otras?", "Three cards on the table. Buy one, or ask for new ones?")}</p>${supHtml()}`}
      <section class="offers">${cards}</section>
      <div class="tb-actions">${chest ? "" : `<button class="chipbtn" id="rerollBtn">${ic("dice", "sm")}<span>${A.T("Cambiar cartas", "New cards")}</span><em>${rc ? CN() + rc : A.T("gratis", "free")}</em></button>`}
        </div>
      <footer class="tb-tray"><div class="tray-col"><h4>${A.T("Reliquias", "Relics")} ${run.perks.length}/${slots}</h4><div class="tray-row">${relicSlots}</div></div>
        <div class="tray-col"><h4>${A.T("Herramientas", "Tools")}</h4><div class="tray-row">${Object.keys(run.tools).map(id => `<span class="inv-tool" ${A.kitTip("tool", id)}>${ic(TOOLS[id].ico)}<b>${toolMax(id)}</b></span>`).join("") || `<i class="empty">${A.T("Ninguna", "None")}</i>`}</div></div>
        <div class="tray-col"><h4>${A.T("Provisiones", "Provisions")}</h4><div class="tray-row hearts">${hearts()}</div></div>
        <button class="btn-ink go-next${doom ? " doom" : ""}" id="goRound" data-primary><span>${chest ? A.T("Continuar sin elegir", "Continue without picking") : doom ? DOOM : A.T("Siguiente ronda", "Next round")}</span>${chest ? `<em class="gn-coins">${CN()}+${gain(chestSkip())}</em>` : ""}<span class="ar">${A.icon("u_next", "sm")}</span></button></footer></div>`, "tablewrap");
    document.querySelectorAll(".offer").forEach((el, i) => { const btn = el.querySelector(".buy"); if (btn) btn.onclick = () => buy(el, chest); if (!chest) el.addEventListener("pointerenter", e => { if (e.pointerType === "mouse" && A.dealer.campHover) A.dealer.campHover(i); }); });
    document.querySelectorAll(".inv-perk").forEach(b => (b.onclick = () => { if (chest) return; sell(b.dataset.sell); }));
    if ($("rerollBtn")) $("rerollBtn").onclick = () => {
      const c = rerollCost(); if (run.coins < c) { A.sfx.deny(); shake($("rerollBtn")); return; } run.coins -= c; if (c === 0) run.freeUsed++; else run.rerolls++; run.shopN++; run.stock = null; A.sfx.reroll();
      if (c > 0 && !run.shellDone && (run.paidRerolls = (run.paidRerolls || 0) + 1) >= 2) { run.shellDone = true; persist(); if (A.dealer.campShell) A.dealer.campShell(); return shellCards(() => openShop(false)); }   // el trile: una vez por expedicion
      openShop(false);
    };
    $("shopMenu").onclick = () => C().runMenu();
    document.querySelectorAll(".ch-buy").forEach(b => (b.onclick = () => bribe(b.dataset.id)));
    if ($("chalReroll")) $("chalReroll").onclick = rerollChal;
    if (!chest) wireSup();
    $("goRound").onclick = () => {
      if (!chest && !run.visitBuys && !run.skipSaid && run.coins >= 8 && Math.random() < 0.5 && A.dealer.campSkip) { run.skipSaid = true; A.dealer.campSkip(run.coins); }   // te vas sin comprar nada (una vez por expedicion)
      run.stock = null;
      if (chest) { const k = gain(chestSkip()); run.coins += k; run.stats.coinsEarned += k; A.sfx.sell(); }   // dejar el cofre sin abrir tambien se cobra (con la mochila llena, el cofre no es papel mojado)
      persist(); chest ? openShop(false) : startRound();
    };
    A.ach.emit("adv", { kind: "hold", coins: run.coins, perks: run.perks.length });
    if (A.tour) A.tour.maybe("camp");
  }
  /* Suministros de la proxima ronda (se gastan cada ronda: el dinero siempre tiene en que invertirse) */
  const SUPS = [
    { id: "cafe", cost: 4, ico: "hourglass", n: A.L("Café doble", "Double espresso"), d: A.L("+4 s por pregunta en la próxima ronda", "+4 s per question next round") },
    { id: "kit", cost: 6, ico: "glass", n: A.L("Refuerzo", "Resupply"), d: A.L("+1 carga en todas tus herramientas la próxima ronda", "+1 charge on all your tools next round") },
    { id: "seguro", cost: 8, ico: "shield", n: A.L("Seguro de ronda", "Round insurance"), d: A.L("Si fallas la próxima ronda, no pierdes provisión", "If you fail next round, you keep your provision") },
  ];
  const supCost = s => price(s.cost + (s.id === "seguro" ? 2 * (run.segN || 0) : 0));   // cada Seguro de ronda gastado encarece el siguiente (como las provisiones): no se puede fallar gratis para siempre
  function supHtml() {
    const sup = run.sup || {}, items = SUPS.filter(s => s.id !== "kit" || Object.keys(run.tools).length).map(s =>`<button class="sup${sup[s.id] ? " on" : ""}" data-sup="${s.id}" type="button"><span class="sp-ic">${ic(s.ico)}</span><span class="sp-t"><b>${A.tx(s.n)}</b><i>${A.tx(s.d)}</i></span><em>${sup[s.id] ? A.T("Activo", "On") : CN() + supCost(s)}</em></button>`).join("");
    return `<div class="tb-sup">${items}</div>`;
  }
  function wireSup() {
    document.querySelectorAll("[data-sup]").forEach(b => (b.onclick = () => {
      const s = SUPS.find(x => x.id === b.dataset.sup), c = supCost(s); run.sup = run.sup || {};
      if (run.sup[s.id]) { run.coins += typeof run.sup[s.id] === "number" ? run.sup[s.id] : c; run.sup[s.id] = false; A.sfx.sell(); }   // devuelve lo que pagaste (vender el Vale entre medias ya no regala 1)
      else { if (run.coins < c) { A.sfx.deny(); shake(b); return; } run.coins -= c; run.sup[s.id] = c; run.visitBuys = (run.visitBuys || 0) + 1; A.sfx.buy(); if (SUPS.every(x => run.sup[x.id])) A.ach.emit("adv", { kind: "supplies" }); }
      persist(); renderShop(false);
    }));
  }
  const shake = el => { el.classList.remove("no"); A.restyle(el); el.classList.add("no"); };   // A.restyle: sin forzar la maquetacion (offsetWidth daba tirones)
  /* sin fondos: le cae un sello a la carta (como el DENEGADO de la salida) y el crupier lo comenta una vez por visita */
  const NOFUNDS = "Sin fondos|No funds|Sans le sou|Sem fundos|Keine Deckung|Senza fondi||余额不足|잔고 부족|残高不足|Нет средств|Brak środków";
  function noFunds(el) {
    A.sfx.stamp(); if (A.haptic) A.haptic([20, 30, 40]);
    let st = el.querySelector(".of-stamp"); if (!st) { st = document.createElement("b"); st.className = "of-stamp"; st.textContent = A.pick6(NOFUNDS); el.appendChild(st); }
    st.classList.remove("on"); A.restyle(st); st.classList.add("on");
    if (A.dealer.campNoFunds) A.dealer.campNoFunds(run.coins);
  }
  /* el trile: las cartas se dan la vuelta y se barajan como cubiletes antes de las nuevas (solo animacion: las cartas y precios son los que tocan) */
  function shellCards(done) {
    const tb = document.querySelector("#dlg .table"), cards = [...document.querySelectorAll("#dlg .offers .offer")], S = C().S;
    const reduced = (S && S.reduce) || matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fin = () => { if (tb) tb.classList.remove("shelling"); if (C().S.phase === "shop" && run && run.phase === "shop") done(); };
    if (!tb || cards.length < 2 || reduced) return fin();
    tb.classList.add("shelling");
    const xs = cards.map(c => c.getBoundingClientRect().left);
    cards.forEach(c => c.animate([{ transform: "rotateY(0)" }, { transform: "rotateY(90deg)" }], { duration: 170, easing: "ease-in" }).onfinish = () => { c.classList.add("faced"); c.animate([{ transform: "rotateY(-90deg)" }, { transform: "rotateY(0)" }], { duration: 170, easing: "ease-out" }); });
    let pass = 0;
    const one = () => {
      if (!tb.isConnected) return fin();
      const a = pass % cards.length, b = (a + 1) % cards.length, dx = xs[b] - xs[a], up = pass % 2 ? 1 : -1;
      cards[a].animate([{ transform: "none" }, { transform: `translate(${dx / 2}px, ${-28 * up}px) scale(1.04)` }, { transform: `translate(${dx}px, 0)` }, { transform: "none" }], { duration: 420, easing: "ease-in-out" });
      cards[b].animate([{ transform: "none" }, { transform: `translate(${-dx / 2}px, ${28 * up}px)` }, { transform: `translate(${-dx}px, 0)` }, { transform: "none" }], { duration: 420, easing: "ease-in-out" });
      A.sfx.card(); if (pass % 2) A.sfx.chip(pass);
      if (++pass < 3) setTimeout(one, 440); else setTimeout(fin, 460);
    };
    setTimeout(one, 380);
  }
  function buy(el, chest) {
    const i = +el.dataset.i, s = run.stock[i]; if (!s || run.bought.includes(i)) return;
    if (s.k === "life") { const c = lifePrice(); if (run.lives >= run.maxLives) { A.sfx.deny(); shake(el); return; } if (run.coins < c) return noFunds(el); run.coins -= c; run.lives++; run.lifeBuys = (run.lifeBuys || 0) + 1; run.bought.push(i); A.sfx.buy(); persist(); return renderShop(chest); }
    if (s.k === "perk") {
      const p = A.RELICS[s.id], c = chest ? 0 : cardCost(s);
      if (run.perks.length >= 5) { A.sfx.deny(); shake(el); flash(A.T("Mochila llena: vende una reliquia.", "Pack full: sell a relic.")); return; }
      if (run.coins < c) return noFunds(el);
      if (!chest && A.dealer.campBought) A.dealer.campBought(s.id, A.tx(p.n), run.seed);
      run.coins -= c; run.perks.push(s.id); if (p.buy) p.buy(run); if (p.r === 3) A.ach.emit("adv", { kind: "legend" });
    } else {
      const c = cardCost(s);
      if (!run.tools[s.id] && Object.keys(run.tools).length >= 4) { A.sfx.deny(); shake(el); flash(A.T("Solo 4 herramientas distintas.", "Only 4 different tools.")); return; }
      if (run.coins < c) return noFunds(el);
      run.coins -= c; addTool(s.id);
    }
    if (s.fix) run.fixUsed = `${roundNo()}:${run.attempt}`;              // ya cobraste la rebaja de esta revancha
    run.bought.push(i); run.visitBuys = (run.visitBuys || 0) + 1; A.sfx.buy(); persist();
    if (chest) { run.stock = null; run.bought = []; persist(); return openShop(false); }
    renderShop(chest);
  }
  function sell(id) { const k = run.perks.indexOf(id); if (k < 0) return; run.perks.splice(k, 1); run.coins += sellValue(id); if (A.RELICS[id].sell) A.RELICS[id].sell(run); A.sfx.sell(); persist(); renderShop(false); }   // sell: lo que la reliquia dio al comprarla se va con ella (Corazon de explorador)
  function flash(t) { const n = document.querySelector(".tb-note"); if (!n) return; const m = document.createElement("p"); m.className = "shop-flash"; m.textContent = t; n.after(m); setTimeout(() => m.remove(), 2200); }

  /* ---------------- fin de la expedicion ---------------- */
  function endRun(win) {
    const P = A.profile.get(), bonus = run.cleared * 1000 + (run.won ? 2500 : 0), final = finalOf(run), wasRanked = run.ranked, board = run.board, daily = !!(wasRanked && board);
    /* el Reto diario tiene sus propias tablas (Hoy y Ayer): no cuenta para el record ni para la tabla "Aventura" (solo expediciones del modo Aventura) */
    if (!daily) P.adv.bestScore = Math.max(P.adv.bestScore, final);
    P.adv.coins += run.stats.coinsEarned;
    if (win && run.won && !daily) P.adv.asc = Math.max(P.adv.asc, Math.min(5, run.asc + 1));   // el Reto diario no desbloquea ascensiones de la Aventura
    A.profile.save();
    const hadBest = (P.records["adv-all"] || 0) > 0, rec = !daily && A.profile.record("adv-all", final);   // la primera expedicion siempre es "record": el crupier solo lo celebra si habia uno que batir
    if (!daily) A.rank.submit("adv-all", { score: final, extra: { deck: run.deck, asc: run.asc, r: run.cleared } });
    A.rank.day.submit(final);                                                                  // "Hoy" y "Ayer" del podio: la mejor partida del dia, sea de la Aventura o del Reto diario
    A.ach.emit("adv", { kind: "end", score: final, won: !!run.won });
    /* Reto diario: el intento se cierra y suma a la puntuacion global del dia (las partidas del formato antiguo, sin numero de intento, cuentan como el primero) */
    let day = null, sent = null;
    if (wasRanked && board) {
      const DY = A.rank.daily, k = run.dailyTry || (DY.get(board).tries.length ? 0 : 1);
      if (k) { sent = DY.finish(board, k, final, { r: run.cleared, won: !!run.won }); day = { k, ...DY.get(board) }; }
      A.ach.emit("daily", {});
    }
    const r = run; run = null; persist(); C().S.run = null; A.chal.end(); A.dealer.enable(true);
    const fell = { r: r.cleared + 1, won: !!r.won, record: rec && hadBest, daily, retire: !!(win && r.won && !daily && r.asc === 5) };   // retire: ganas en Ascension 5 (el crupier se jubila)           // {r}: la ronda en la que caiste
    A.dealer.noteRun(fell);
    /* v0.37: si aun no sabe tu nombre, te lo pregunta bajo un foco (js/nombre.js) y despues solo te invita a jugar otra */
    const asks = A.nombre && A.nombre.maybeAsk({ won: !!win, after: () => A.dealer.tempt({ ...fell, won: !!win }) });
    if (!asks) setTimeout(() => A.dealer.react(win ? "runWin" : "runLose", fell), 900);
    A.sfx.stamp(); setTimeout(win ? A.sfx.victory : A.sfx.lose, 300);
    const summary = (r.won ? A.tf("Superaste {r} rondas y conquistaste los tres actos. Puntos: {p} + bonus {b}.", "You cleared {r} rounds and conquered all three acts. Points: {p} + bonus {b}.", { r: r.cleared, p: A.fmt(r.score), b: A.fmt(bonus) })
      : r.cleared === 1 ? A.tf("Superaste {r} ronda y llegaste al {act}. Puntos: {p} + bonus {b}.", "You cleared {r} round and reached {act}. Points: {p} + bonus {b}.", { r: r.cleared, act: A.tx(actInfo(r.act).n), p: A.fmt(r.score), b: A.fmt(bonus) })
      : A.tf("Superaste {r} rondas y llegaste al {act}. Puntos: {p} + bonus {b}.", "You cleared {r} rounds and reached {act}. Points: {p} + bonus {b}.", { r: r.cleared, act: A.tx(actInfo(r.act).n), p: A.fmt(r.score), b: A.fmt(bonus) })) + (rec ? A.T(" ¡Nuevo récord personal!", " New personal best!") : "");
    if (day) {
      const sp = /^(zh|ja)$/.test(A.lang) ? "" : " ", again = day.left > 0 && board === A.rank.daily.board();   // el siguiente intento solo si sigue siendo el mismo dia
      const toBoard = () => C().showHub("daily"), next = () => { A.sfx.depart(); C().S.ranked = null; C().prepareRun(); if (!A.adv.beginDaily(board)) toBoard(); };
      C().verdict({
        kind: win ? "win" : "", level: r.cleared, tag: dailyLbl(day.k),
        title: (win ? A.pick6("Intento {k} cobrado|Attempt {k} cashed out|Essai {k} encaissé|Tentativa {k} recolhida|Versuch {k} ausgezahlt|Tentativo {k} incassato||第 {k} 次尝试已兑现|{k}번째 도전 현금화 완료|挑戦{k}回目をキャッシュアウト|Попытка {k} обналичена|Podejście {k} spieniężone")
          : A.pick6("Fin del intento {k}|Attempt {k} over|Fin de l'essai {k}|Fim da tentativa {k}|Versuch {k} beendet|Fine del tentativo {k}||第 {k} 次尝试结束|{k}번째 도전 종료|挑戦{k}回目終了|Попытка {k} окончена|Koniec podejścia {k}")).replace("{k}", day.k),
        text: summary + sp + A.pick6("Puntuación global de hoy: {t} ({n} de 3 intentos).|Today's global score: {t} ({n} of 3 attempts).|Score global du jour : {t} ({n} essais sur 3).|Pontuação global de hoje: {t} ({n} de 3 tentativas).|Gesamtpunktzahl heute: {t} ({n} von 3 Versuchen).|Punteggio globale di oggi: {t} ({n} tentativi su 3).||今日总分：{t}（已用 {n}/3 次尝试）。|오늘의 총점: {t} (3번 중 {n}번 도전).|今日の総合スコア：{t}（3回中{n}回）。|Общий счёт за сегодня: {t} ({n} из 3 попыток).|Dzisiejszy wynik łączny: {t} ({n} z 3 podejść).").replace("{t}", A.fmt(day.total)).replace("{n}", day.done) + `<span id="vdRank"></span>`,
        stats: [[A.pick6("Puntos del intento|Attempt score|Score de l'essai|Pontos da tentativa|Punkte des Versuchs|Punti del tentativo||本次尝试得分|이번 도전 점수|今回の挑戦スコア|Очки попытки|Wynik podejścia"), final], [A.pick6("Puntuación global|Global score|Score global|Pontuação global|Gesamtpunktzahl|Punteggio globale||总分|총점|総合スコア|Общий счёт|Wynik łączny"), day.total], [A.T("Rondas superadas", "Rounds cleared"), r.cleared]],
        stamp: win ? A.T("GLORIA", "GLORY") : A.T("FIN", "END"), stampSub: win ? A.icon("u_star", "st") : A.icon("u_close", "st"), art: win ? "win" : "lose",
        buttons: again ? [{ id: "nrBtn", cls: "btn-ink", label: A.pick6("Jugar el intento {k}|Play attempt {k}|Jouer l'essai {k}|Jogar a tentativa {k}|Versuch {k} spielen|Gioca il tentativo {k}||开始第 {k} 次尝试|{k}번째 도전 시작|挑戦{k}回目へ|Сыграть попытку {k}|Zagraj podejście {k}").replace("{k}", day.k + 1), arrow: true, primary: true, onclick: next },
          { id: "lbBtn", cls: "btn-line", label: A.T("Clasificación", "Leaderboard"), onclick: toBoard }, { id: "hubBtn", cls: "btn-line", label: A.T("Menú", "Menu"), onclick: () => C().showHub() }]
          : [{ id: "nrBtn", cls: "btn-ink", label: A.pick6("Ver la clasificación|See the leaderboard|Voir le classement|Ver o placar|Rangliste ansehen|Vedi la classifica|Ver la tabla de posiciones|查看排行榜|리더보드 보기|ランキングを見る|Смотреть таблицу|Zobacz ranking"), arrow: true, primary: true, onclick: toBoard }, { id: "hubBtn", cls: "btn-line", label: A.T("Menú", "Menu"), onclick: () => C().showHub() }],
      });
      /* con la clasificacion global activa, el puesto llega en cuanto responde el servidor */
      if (sent) sent.then(res => { const el = $("vdRank"), g = res && res.global; if (el && g && g.rank) el.textContent = sp + A.pick6("Puesto {r} de {n} en el mundo.|Rank {r} of {n} worldwide.|Rang {r} sur {n} dans le monde.|Posição {r} de {n} no mundo.|Platz {r} von {n} weltweit.|Posizione {r} su {n} nel mondo.||全球第 {r} 名（共 {n} 人）。|전 세계 {n}명 중 {r}위.|世界{n}人中{r}位。|Место {r} из {n} в мире.|Miejsce {r} na {n} na świecie.").replace("{r}", A.fmt(g.rank)).replace("{n}", A.fmt(g.total)); }).catch(() => {});
    } else {
      C().verdict({
        kind: win ? "win" : "", level: r.cleared, tag: A.T("Expedición", "Expedition"), title: win ? A.T("Expedición cobrada", "Expedition cashed out") : A.T("Fin de la expedición", "Expedition over"),
        text: summary,
        stats: [[A.T("Puntuación final", "Final score"), final], [A.T("Rondas superadas", "Rounds cleared"), r.cleared], [A.T("Doblones ganados", "Doubloons earned"), r.stats.coinsEarned]],
        stamp: win ? A.T("GLORIA", "GLORY") : A.T("FIN", "END"), stampSub: win ? A.icon("u_star", "st") : A.icon("u_close", "st"), art: win ? "win" : "lose",
        buttons: [{ id: "nrBtn", cls: "btn-ink", label: A.T("Otra expedición", "Another expedition"), arrow: true, primary: true, onclick: () => C().showHub("adventure") }, { id: "hubBtn", cls: "btn-line", label: A.T("Menú", "Menu"), onclick: () => C().showHub() }],
      });
    }
    A.dealer.hover($("hubBtn"), "hoverQuit");                              // si el cursor va hacia Menu en vez de a otra expedicion, el crupier lo ve
    C().map.setStyle(mapStyleFor()); A.adv.hideBars();
  }
  A.adv.endRun = endRun; A.adv.startRound = startRound; A.adv.openShop = openShop;
})(window.AIQ);
