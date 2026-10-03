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
    sonar: { ico: "sonar", uses: 2, cost: 5, r: 1, n: L("Sonar", "Sonar"), d: L6("Toca un punto del mapa: te dice a cuántos km está el objetivo (±6 %) y dibuja el anillo.|Tap a point: tells you how far the target is (±6%) and draws the ring.|Touche un point : il indique la distance à la cible (±6 %) et trace l'anneau.|Toque num ponto: diz a que distância está o alvo (±6%) e desenha o anel.|Tippe auf einen Punkt: zeigt die Entfernung zum Ziel (±6 %) und zeichnet den Ring.|Tocca un punto: indica la distanza dal bersaglio (±6%) e disegna l'anello.||点击一个点：显示目标的距离（±6%）并画出圆环。|지점을 탭하세요: 목표까지의 거리(±6%)를 알려주고 원을 그립니다.|地点をタップすると目標までの距離（±6%）が分かり、輪が描かれる。|Коснись точки: покажет расстояние до цели (±6%) и нарисует кольцо.|Stuknij punkt: pokaże odległość do celu (±6%) i narysuje okrąg."), kind: "probe" },
    compass: { ico: "compass", uses: 3, cost: 4, r: 0, n: L("Brújula", "Compass"), d: L("Toca un punto: una flecha señala el rumbo (8 direcciones) hacia el objetivo.", "Tap a point: an arrow shows the heading (8 directions) to the target."), kind: "probe" },
    passport: { ico: "passport", uses: 1, cost: 7, r: 1, n: L("Pase VIP", "VIP pass"), d: L6("Tres fichas caen en el mapa: solo una marca el lugar.|Three chips drop onto the map: only one marks the place.|Trois jetons tombent sur la carte : un seul marque le lieu.|Três fichas caem no mapa: só uma marca o lugar.|Drei Chips fallen auf die Karte: Nur einer markiert den Ort.|Tre fiche cadono sulla mappa: solo una segna il luogo.||三枚筹码落在地图上：只有一枚标出了地点。|칩 세 개가 지도에 떨어집니다: 하나만 장소를 가리킵니다.|3枚のチップが地図に落ちる。場所を示すのは1枚だけ。|Три фишки падают на карту: только одна отмечает место.|Trzy żetony spadają na mapę: tylko jeden oznacza miejsce."), kind: "instant" },   // como revealCountry: en banderas, paises y pistas solo el continente
    journal: { ico: "journal", uses: 1, cost: 4, r: 0, n: L("Nota del crupier", "Dealer's note"), d: L6("Lee la nota de campo (en banderas, la región; en pistas, inicial y continente).|Read the field note (flags: the region; clues: initial and continent).|Lis la note de terrain (drapeaux : la région ; indices : initiale et continent).|Leia a nota de campo (bandeiras: a região; pistas: inicial e continente).|Lies die Feldnotiz (Flaggen: Region; Hinweise: Anfangsbuchstabe und Kontinent).|Leggi la nota di campo (bandiere: la regione; indizi: iniziale e continente).||阅读野外笔记（国旗给地区，线索给首字和大洲）。|야외 일지를 읽어 보세요(국기는 지역, 단서는 첫 글자와 대륙).|フィールドノートを読もう（国旗は地域、ヒントは頭文字と大陸）。|Прочитай полевую заметку (флаги — регион, подсказки — первая буква и континент).|Przeczytaj notatkę terenową (flagi: region; wskazówki: pierwsza litera i kontynent)."), kind: "instant" },
    hourglass: { ico: "hourglass", uses: 2, cost: 4, r: 0, n: L("Reloj de arena", "Hourglass"), d: L("+6 segundos en la pregunta actual.", "+6 seconds on the current question."), kind: "instant" },
    interruptor: { ico: "interruptor", uses: 1, cost: 8, r: 2, n: L("Interruptor", "Master switch"), d: L6("Apaga todos los retos durante esta pregunta, salvo el tiempo que ya quitó la Tormenta. Con Silencio no se puede usar.|Switches every challenge off for this question, except the time the Storm already took. It can't be used under Silence.|Désactive tous les défis pour cette question, sauf le temps déjà pris par la Tempête. Inutilisable sous Silence.|Desliga todos os desafios nesta pergunta, exceto o tempo que a Tempestade já tirou. Não pode ser usado com Silêncio.|Schaltet alle Herausforderungen für diese Frage aus, außer der Zeit, die das Gewitter schon genommen hat. Bei Stille nicht nutzbar.|Spegne tutte le sfide per questa domanda, tranne il tempo già tolto dalla Tempesta. Non si può usare con il Silenzio.||关闭本题的所有挑战，但“风暴”已扣掉的时间不会返还。“沉默”时无法使用。|이 문제의 모든 도전을 끕니다. 단, 폭풍이 이미 줄인 시간은 돌아오지 않습니다. 침묵 중에는 사용할 수 없습니다.|この問題のチャレンジをすべてオフにする。ただし嵐で減った時間は戻らない。静寂の間は使えない。|Отключает все испытания для этого вопроса, кроме времени, уже отнятого «Бурей». При «Тишине» не работает.|Wyłącza wszystkie wyzwania w tym pytaniu, poza czasem zabranym już przez Burzę. Nie działa podczas Ciszy."), kind: "instant" },
    swapcard: { ico: "swapcard", uses: 1, cost: 9, r: 1, n: L("Descarte", "Discard"),   // tanda 9: antes Carta de cambio (es lo que mas rinde por doblon)
      d: L("Cambia esta pregunta por otro lugar de la ronda.", "Swaps this question for another place from the round."), kind: "instant" },
  };
  const BOSSES = {};                                                 // los jefes ahora son combinaciones de retos (js/challenges.js)
  /* barajas (usuario, 2026-10-02): se ganan superando Ascensiones. unlock = logro que la abre: Historiador ganando una expedicion, Navegante ganando
     en Ascension 1 o mas y Aventurero ciego en Ascension 2 o mas (antes Acto I, un jefe y ganar). Las que ya tenias abiertas se quedan (A.adv.deckLocked).
     asc = la Ascension que hay que superar (la carta cerrada lo dice) */
  const DECKS = {
    explorer: { ico: "deck_explorer", n: L("Explorador", "Explorer"), d: L("Un Sonar y 4 doblones. La baraja para aprender.", "A Sonar and 4 doubloons. The deck for learning."), tools: ["sonar"], perks: [], coins: 4, lives: 3, unlock: null },
    /* con los nombres de ahora de sus cartas (antes Cuaderno, Diccionario, Brujula de 16 rumbos y Linterna de minero, que ya no existen) */
    historian: { ico: "deck_historian", n: L("Historiador", "Historian"), d: L6("Libro de la casa y Soplo del crupier: siempre sabes por dónde empezar.|House ledger and Dealer's tip-off: you always know where to start.|Registre de la maison et Tuyau du croupier : tu sais toujours par où commencer.|Livro da casa e Dica do crupiê: você sempre sabe por onde começar.|Hausregister und Tipp vom Croupier: Du weißt immer, wo du anfängst.|Registro della casa e Soffiata del croupier: sai sempre da dove partire.|Libro de la casa y Soplo del crupier: siempre sabés por dónde empezar.|赌场账簿与荷官的暗示：你总知道从哪儿下手。|하우스 장부와 딜러의 귀띔: 어디서 시작할지 늘 압니다.|ハウスの帳簿とディーラーの耳打ち：どこから始めるか、いつもわかる。|Книга заведения и подсказка крупье: ты всегда знаешь, с чего начать.|Księga kasyna i cynk od krupiera: zawsze wiesz, od czego zacząć."), tools: [], perks: ["almanac", "sextant"], coins: 3, lives: 3, unlock: "adv_win", asc: 0 },
    navigator: { ico: "deck_navigator", n: L("Navegante", "Navigator"), d: L6("Dos brújulas y el Catalejo. Nunca te pierdes.|Two compasses and the Spyglass. You never get lost.|Deux boussoles et la Longue-vue. Tu ne te perds jamais.|Duas bússolas e a Luneta. Você nunca se perde.|Zwei Kompasse und das Fernrohr. Du verirrst dich nie.|Due bussole e il Cannocchiale. Non ti perdi mai.||两个指南针加望远镜。你永远不会迷路。|나침반 두 개와 망원경. 절대 길을 잃지 않습니다.|2つのコンパスと望遠鏡。決して迷わない。|Два компаса и подзорная труба. Ты никогда не заблудишься.|Dwa kompasy i luneta. Nigdy się nie zgubisz."), tools: ["compass", "compass"], perks: ["glass"], coins: 3, lives: 3, unlock: "adv_asc", asc: 1 },
    blind: { ico: "deck_blind", n: L("Aventurero ciego", "Blind adventurer"), d: L6("Sin herramientas, con el Foco del vigilante y 4 provisiones.|No tools, with the Pit boss's spotlight and 4 provisions.|Sans outils, avec le Projecteur du chef de table et 4 provisions.|Sem ferramentas, com o Holofote do supervisor e 4 provisões.|Ohne Werkzeuge, mit dem Scheinwerfer des Pitbosses und 4 Proviant.|Senza strumenti, con il Faro del capotavolo e 4 provviste.||没有工具，携带场务经理的聚光灯与 4 份补给。|도구 없이 플로어 매니저의 스포트라이트와 식량 4개.|道具なし、ピットボスのスポットライトと4つのプロビジョン。|Без инструментов, с прожектором пит-босса и 4 запасами.|Bez narzędzi, z reflektorem szefa sali i 4 zapasami."), tools: [], perks: ["miner"], coins: 6, lives: 4, unlock: "adv_asc2", asc: 2 },
  };
  const TOPIC_ICON = { capital: "t_capital", landmark: "t_landmark", city: "t_city", country: "t_country", history: "t_battle", nature: "t_nature", clue: "t_curio", mixed: "slot", flag: "t_country" };
  const BOSS_IC = "boss_hat";                                        // v0.35: el jefe del acto es la chistera del crupier (los mismos pixeles de su retrato: tools/crupier/chistera.py)
  A.ADV = { TOOLS, PERKS: A.RELICS, BOSSES, DECKS, ROUNDS, TOPIC_NAMES, TOPIC_ICON, BOSS_IC, roundDefOf, chalFor: r => chalFor(r) };

  /* ------------------------------------------------------------------ partida (run) */
  let run = null, slot = RUNKEY;                                     // slot: ranura de la partida activa (expedicion normal o intento del Reto diario)
  const keyOf = daily => (daily ? DAILYKEY : RUNKEY);
  const loadSlot = daily => { try { return JSON.parse(localStorage.getItem(keyOf(daily)) || "null"); } catch (e) { return null; } };
  /* el logro de la legendaria del cofre se queda en deuda (run.legAch) hasta la tienda: su aviso no tapa la secuencia. Se paga ahi, al reanudar
     o, si la partida se cierra a mitad y no se continua, al abandonarla o al empezar otra encima. Pagar dos veces no hace nada */
  const payLeg = r => { if (r && r.legAch) { r.legAch = 0; A.ach.emit("adv", { kind: "legend", chest: true }); } };
  A.adv = { get run() { return run; }, hasSave(daily) { try { return !!localStorage.getItem(keyOf(daily)); } catch (e) { return false; } } };
  /* ---------------- la ruta de la expedicion: 12 rondas en 3 actos (el jefe cierra cada acto) y el modo infinito al final ----------------
     v0.35 (usuario): antes el Campamento ensenaba una ventana de 12 casillas que se corria y llegaba a rondas 13-18 que no existen.
     size "bar": la barra del Campamento (lo jugado, ficha de oro con su marca; la proxima, encendida y con la chincheta encima).
     size "plan": la de las pantallas de Aventura y Reto diario (un panel por acto con su nombre).
     route: la ruta barajada del Reto diario (route[hueco] = ronda original). cur: la proxima ronda que se juega (-1: aun no ha empezado) */
  const INF_N = L6("Infinito|Infinite|Infini|Infinito|Endlos|Infinito||无尽|무한|エンドレス|Бесконечный|Nieskończony");
  const INF_D = L6("Tras el último jefe: preguntas sin parar, cada vez con menos tiempo, hasta que se acaben tus provisiones.|After the last boss: nonstop questions, with less time each, until your provisions run out.|Après le dernier boss : des questions sans fin, avec de moins en moins de temps, jusqu'à épuiser tes provisions.|Depois do último chefe: perguntas sem parar, com cada vez menos tempo, até acabarem suas provisões.|Nach dem letzten Boss: Fragen ohne Ende, mit immer weniger Zeit, bis dein Proviant aufgebraucht ist.|Dopo l'ultimo boss: domande senza sosta, con sempre meno tempo, finché non finiscono le provviste.||击败最后一个首领后：问题接连不断，时间越来越少，直到补给耗尽。|마지막 보스 이후: 식량이 떨어질 때까지 점점 짧아지는 시간 속에 문제가 끝없이 이어집니다.|最後のボスの後：プロビジョンが尽きるまで、時間がどんどん短くなる問題が続く。|После последнего босса: вопросы без остановки, со всё меньшим временем, пока не кончатся запасы.|Po ostatnim bossie: pytania bez końca, z coraz krótszym czasem, aż skończą się zapasy.");
  A.adv.road = ({ size = "bar", route = null, cur = -1 } = {}) => {
    const def = i => (route ? { ...ROUNDS[route[i]], boss: i % 4 === 3 } : ROUNDS[i]);
    const node = i => { const d = def(i), st = i < cur ? " done" : i === cur ? " next" : "";
      return `<span class="rd-n${d.boss ? " boss" : ""}${st}" ${A.roundTip(i, route)}><span class="rd-ic">${ic(d.boss ? BOSS_IC : TOPIC_ICON[d.topic])}</span>${size === "plan" ? `<em>${i + 1}</em>` : ""}</span>`; };
    const acts = [0, 1, 2].map(a => { const st = cur >= 4 * (a + 1) ? " done" : cur >= 4 * a ? " now" : "";
      const head = size === "plan" ? `<header class="rd-h"><b>${A.tx(ACTS[a].n)}</b><i>${A.tx(ACTS[a].t)}</i></header>` : `<i class="rd-k">${ROMAN[a]}</i>`;
      return `<div class="rd-act${st}">${head}<div class="rd-row">${[0, 1, 2, 3].map(k => node(4 * a + k)).join("")}</div></div>`; }).join("");
    const inf = `<div class="rd-act rd-inf">${size === "plan" ? "" : `<i class="rd-k"></i>`}<div class="rd-row"><span class="rd-n inf" ${A.ttAttr(A.T("Modo infinito", "Infinite mode"), A.tx(INF_D))}><span class="rd-ic"><b>∞</b></span>${size === "plan" ? `<em>${A.tx(INF_N)}</em>` : ""}</span></div></div>`;
    return `<div class="rd ${size}">${acts}${inf}</div>`;
  };
  /* baraja cerrada: aun no tienes su logro y no la tenias abierta con la regla de antes (perfil: adv.deckKeep, ver js/profile.js) */
  A.adv.deckLocked = id => { const d = DECKS[id], P = A.profile.get(); return !!(d && d.unlock && !P.ach[d.unlock] && !(P.adv.deckKeep || {})[id]); };
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
  const maxPerks = () => 5 + perkList().reduce((n, p) => n + (p.slot || 0), 0);   // tanda 13 (S7): huecos de la mochila
  const has = flag => perkList().some(p => p[flag]);
  const sumFlag = flag => perkList().reduce((n, p) => n + (p[flag] || 0), 0);
  const owned = id => run.perks.includes(id);
  /* objetivo: escalera lineal, +250 por ronda de 2.000 (ronda 1) a 4.500 (ronda 11); el jefe final (ronda 12) es 4.777 exactos. Redondeado a 50 (salvo ese 4.777 sin ascension ni perks de ronda).
     v0.20 (usuario, 2026-09-30): que pese mas SABER que clavar; antes +350 por ronda, 5.777 y +10 % por Ascension hacian imposibles las rondas 11-12 aunque supieras las cinco */
  /* tanda 4 (S21): el objetivo de la ronda se congela al empezarla (run.tgt). El margen y el consuelo se miden contra el objetivo SIN rebajas
     (la Mesa de minimos no se paga a si misma). El panel del Campamento usa target(), en directo */
  const tgtKey = () => roundNo() + ":" + (run.attempt || 0);
  const roundTarget = () => { run.tgt = run.tgt || {}; const k = tgtKey(); if (run.tgt[k] == null) run.tgt[k] = target(); return run.tgt[k]; };
  const baseTarget = () => { const r = roundNo(), base = r >= 11 ? 4777 : 2000 + 250 * r, m = ascFx(run.asc).target; return r >= 11 && m === 1 ? base : Math.round((base * m) / 50) * 50; };
  const target = () => { const t = { seconds: 0, target: 1 }; perkList().forEach(p => p.round && p.round(t, run)); t.target = Math.max(0.85, t.target); const r = roundNo(), base = r >= 11 ? 4777 : 2000 + 250 * r, m = ascFx(run.asc).target * t.target; return r >= 11 && m === 1 ? base : Math.round((base * m) / 50) * 50; };   // tanda 12: las rebajas del objetivo (Midas y Mesa de minimos) no pasan del −15 %
  const shopCtx = () => { const x = { price: 0, freeReroll: 0, slots: 3 }; perkList().forEach(p => p.shop && p.shop(x, run)); return x; };
  const inflation = () => 1 + 0.25 * run.act;                            // todo cuesta mas en cada acto: el dinero pesa mas segun avanzas
  const price = c => Math.max(1, Math.round(c * ascFx(run.asc).price * inflation()) + shopCtx().price);
  const lifePrice = () => price(6 + 2 * (run.lifeBuys || 0));            // cada provision comprada en la partida cuesta 2 mas
  /* tanda 3 (S8): vender devuelve la mitad de lo que pagaste (run.paid); lo del cofre o de partidas viejas, la mitad de su precio de ahora.
     Vendida en la misma visita en que la compraste: todo lo pagado (salvo el Ojo en el cielo, que ya ha mirado) */
  const sellValue = id => (id === "hoard" ? run.hucha || 0 : 0) + sellBase(id);   // tanda 9: la Hucha vale ademas lo que lleva dentro
  const sellBase = id => { const p = A.RELICS[id], paid = run.paid && run.paid[id]; if (paid > 0 && run.paidAt && run.paidAt[id] === run.shopKey && id !== "spyhole") return paid; return Math.ceil((paid > 0 ? paid : price(p.cost)) / 2); };
  /* amuletos (tanda 3): las contras de antes. Cargas en run.amu; 2 al comprarlo (las barajas que lo traen de serie, 6). Ver amuSpend */
  const AMU_LV = 2, AMU_DECK = 6, isAmu = id => !!(A.RELICS[id] && A.RELICS[id].amulet);
  const AMU_TAG = L6("Amuleto|Amulet|Amulette|Amuleto|Amulett|Amuleto||护身符|부적|お守り|Амулет|Amulet"), AMU_RE = L6("+2 cargas|+2 charges|+2 charges|+2 cargas|+2 Ladungen|+2 cariche||+2次充能|충전 +2회|+2回分|+2 заряда|+2 ładunki");
  const VTG_TAG = L6("Ventaja|Edge|Atout|Vantagem|Vorteil|Vantaggio||优势|어드밴티지|アドバンテージ|Преимущество|Atut"), VTG_SWAP = L6("cambiar por esta|swap for this one|échanger contre celle-ci|trocar por esta|dagegen tauschen|scambiala con questa||换成这张|이걸로 교체|これと交換|заменить на эту|zamień na tę");
  const OTRA = L6("¡Otra!|Again!|Encore !|De novo!|Noch mal!|Ancora!||再来！|한 번 더!|もう一回！|Ещё!|Jeszcze!"), BEST5 = L6("5 mejores|best 5|5 meilleures|5 melhores|beste 5|5 migliori||取前5|상위 5개|上位5つ|5 лучших|5 najlepszych");
  const NULLED = L6("Anulado|Voided|Annulé|Anulado|Annulliert|Annullato||已作废|무효|無効|Отменён|Anulowany"), SAVED_BY = L6("te ha salvado|saved you|t'a sauvé|te salvou|hat dich gerettet|ti ha salvato||救了你|덕분에 살았어요|に救われた|спас тебя|cię uratował");
  const AMU_BROKE = L6("se parte|breaks|se brise|se quebra|zerbricht|si spezza||碎了|부서졌어요|砕けた|раскололся|pęka");
  const pips = (n, cls) => `<span class="${cls}">${Array.from({ length: Math.max(0, n) }, () => "<i></i>").join("")}</span>`;
  const gain = n => Math.round(n * (sumFlag("coinX") || 1));
  const chestSkip = () => Math.round(2.5 * inflation());                // dejar el cofre del jefe sin abrir: 3 doblones al empezar el acto II, 4 al empezar el III (el Toque de Midas los duplica, como todo lo que ganas)
  /* retos de la ronda r tras aplicar perks (Llave maestra, Talisman, inmunidades); pl: otra mano de perks (la tienda valora cada reliquia sin contarla a ella) */
  /* tanda 6b: el plan de la ronda r (barajada si la barajaste), con el historial del plan base de la expedicion */
  const planOf = r => A.chal.plan(run.seed + ((run.salt && run.salt[r]) ? ":" + run.salt[r] : ""), r, run.asc, defAt(r).topic, run.cjk, { base: run.seed, topics: x => defAt(x).topic, first: !!run.first });
  const chalFor = (r, pl = perkList()) => {
    const plan = planOf(r), boss = r % 4 === 3;
    let list = A.adv._force ? A.adv._force.map(id => { const [i, l] = String(id).split("@"); return A.chal.canon({ id: i, lv: +l || 2 }); }) : plan.list.slice();
    const bribed = (run.bribed && run.bribed[r]) || [], paid = list.filter(c => bribed.includes(c.id)).map(c => c.id); if (bribed.length) list = list.filter(c => !bribed.includes(c.id));   // sobornados en el Campamento (paid: los que estaban en esta tirada; barajar no borra los sobornos)
    const sum = f => pl.reduce((n, p) => n + (p[f] || 0), 0), nulled = [];
    for (let k = sum("skipHardest"); k > 0 && list.length; k--) { const RK = { map: 5, wall: 4, ptr: 3, rule: 2 }, w = c => (c.lv || 1) * 10 + (RK[A.CHAL[c.id].kind] || 1); const top = list.reduce((a, c) => (w(c) > w(a) ? c : a)); nulled.push(top.id); list = list.filter(c => c !== top); }   // Comodin: fuera el reto mas fuerte
    if (boss) { let soft = sum("softenBoss"); list = list.map((c, i) => (i < soft ? { ...c, lv: 1 } : c)); }
    list = list.filter(c => !pl.some(p => (p.immune || []).includes(c.id)));
    const bet = !run.inf && run.bets && run.bets[r];                   // tanda 11: los de la apuesta, sellados (si fallas, la revancha va sin ellos)
    if (bet && bet.retos && !(r === roundNo() && run.attempt > 0 && bet.id !== "offer")) list = list.concat(bet.retos.filter(b => !list.some(c => c.id === b.id)).map(c => ({ ...c, sealed: true, sealBy: bet.id === "offer" ? "offer" : "bet" })));
    if (pl.some(p => p.pact) && !boss && !run.inf && r <= LAST && list.length < 4) { const add = pickSealed(r, 1, "pacto", list)[0]; if (add) list.push({ ...add, lv: clamp(list.length ? Math.max(...list.map(c => c.lv || 1)) : 1, 1, 3), sealed: true, sealBy: "pact" }); }   // tanda 13: el reto del Pacto
    if (run.chSeen0 && !run.board && run.asc < 3 && !A.adv._force) list = list.map(c => (run.chSeen0.includes(c.id) || c.sealed ? c : { ...c, lv: 1, isNew: true }));   // S12: lo que nunca has visto se estrena a nivel 1
    return { list, combo: plan.combo, boss, paid, nulled };
  };

  /* ---------------- tienda relevante: lo que sirve cada reliquia en ESTA expedicion ----------------
     Los retos salen de la semilla (A.chal.plan), asi que el Campamento sabe que trucos quedan por venir (con barajados y sobornos ya aplicados).
     Una contra solo se ofrece si alguno de sus retos aparece en las rondas que quedan; las piezas de una herramienta, solo si la llevas;
     las de economia, solo si queda Campamento donde gastar lo que dan; y la de empezar acto, solo si queda algun acto por empezar. */
  const LAST = 11;                                                   // ultima ronda numerada: despues solo queda el modo infinito (sin retos ni Campamento)
  let CTR = null;                                                    // reliquia -> retos que frena (sale de A.CHAL[reto].counters)
  const ctrOf = id => { if (!CTR) { CTR = {}; for (const c in A.CHAL) (A.CHAL[c].counters || []).forEach(p => (CTR[p] = CTR[p] || []).push(c)); } return CTR[id] || null; };
  const pureCounter = p => !!ctrOf(p.id) && !(p.open || p.round || p.clear || p.post || p.shop || p.buy || p.actStart);   // solo frena retos (Batería externa y la Chuleta de bolsillo sirven tambien sin su reto)
  /* rondas (de `from` a la ultima) con algun reto que esta reliquia frena: [{ r, id }]. Sin herramientas, el Silencio no te quita nada (Tapones VIP) */
  const helpRounds = (id, from = roundNo()) => {
    let cs = ctrOf(id); const out = []; if (!cs || run.inf) return out;
    if (!Object.keys(run.tools).length) cs = cs.filter(c => c !== "silence");
    const pl = perkList().filter(p => p.id !== id);
    for (let r = from; r <= LAST; r++) { const hit = chalFor(r, pl).list.find(c => cs.includes(c.id)); if (hit) out.push({ r, id: hit.id }); }
    return out;
  };
  /* pistas gratis: solo si aportan en alguna de las rondas que quedan. El Soplo (continente) solo donde el pais no esta escrito: banderas, paises,
     pistas, el Jackpot (saca tambien de los carretes de paises y de pistas: 1 de cada 5) o una ronda con Sin pais. La Chuleta de bolsillo y el Oraculo iluminan el pais en las rondas de lugares (el Jackpot incluido, que es casi
     todo lugares); en banderas, paises y pistas solo dan el continente (ver revealCountry). El Libro de la casa sirve en cualquier ronda */
  const NOPAIS = ["flag", "country", "clue"];
  const hintHelps = (hint, from) => {
    if (hint === "note") return true;
    if (hint === "half") { for (let r = from; r <= LAST; r++) { const t = defAt(r).topic; if (t !== "flag" && t !== "country") return true; } return false; }   // el Soplo calla en banderas y paises
    for (let r = from; r <= LAST; r++) {
      const t = defAt(r).topic;
      if (hint === "continent" ? NOPAIS.includes(t) || t === "mixed" || chalFor(r).list.some(c => c.id === "nocountry") : !NOPAIS.includes(t)) return true;
    }
    return false;
  };
  const useful = (id, from = roundNo()) => {
    const p = A.RELICS[id]; if (!p || run.inf || from > LAST) return false;
    const left = LAST + 1 - from;                                    // rondas que quedan, contando la proxima
    if (pureCounter(p)) return helpRounds(id, from).length > 0;
    if (p.hint) return hintHelps(p.hint, from);
    if (p.calm) { for (let r = from; r <= LAST; r++) if (chalFor(r).list.some(c => p.calm.includes((A.CHAL[c.id] || {}).fam))) return true; return false; }   // Sangre fria: queda alguna ronda con retos de puntero o pantalla
    if (p.toolBonus) return Object.keys(run.tools).length > 0;        // el Catalejo tambien afina el Sonar y la Brujula, pero sirve con cualquier herramienta
    if (p.bank) return left >= 3;
    if (p.sonarErr) return !!run.tools.sonar;                        // Sonar trucado sin Sonar, o la ruleta de 16 rumbos sin Brujula, no hacen nada
    if (p.compass16) return !!run.tools.compass;
    if (p.toolBonus) return Object.keys(run.tools).length > 0;
    if (p.actStart) return run.act < 2;                              // se cobra al empezar un acto: en el III ya no empieza ninguno
    if (p.spy) return left >= 2;
    if (p.pact) return left >= 2;
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
    slot = keyOf(!!board); payLeg(loadSlot(!!board));
    /* cjk (sin runas ni sin vocales) se fija al empezar: cambiar de idioma a media expedicion no mueve los trucos ni los sobornos (ver A.chal.plan) */
    run = {
      v: 2, seed: seed || "run-" + Math.random().toString(36).slice(2, 10), cjk: A.chal.noLatin(), deck, asc, ranked, board, dailyTry, route: route ? route.slice(0, 12) : null, gift: bonus ? gift : null,
      act: 0, round: 0, attempt: 0, coins: d.coins, lives: d.lives + ascFx(asc).lives, maxLives: d.lives + ascFx(asc).lives,
      first: !board && !A.profile.get().adv.runs, chSeen0: !board && asc < 3 && A.dealer && A.dealer.trickSeen ? A.dealer.trickSeen() : null,
      perks: d.perks.concat(bonus ? [gift] : []), tools: {}, score: 0, cleared: 0, used: [], rerolls: 0, freeUsed: 0, shopN: 0, phase: "round", qi: 0, qn: 5, qTools: 0, rTools: 0, luckUsed: false, guardUsed: false,
      livesLostAct: 0, shieldAct: -1, leftSum: 0, roundScore: 0, rGood: 0, qTotal: 0, stats: { bulls: 0, best: 0, coinsEarned: 0 }, t0: Date.now(),
    };
    run.amu = {}; run.perks.forEach(id => { if (isAmu(id)) run.amu[id] = d.perks.includes(id) ? AMU_DECK : AMU_LV; });
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
    const TO = { spectacles: "dictionary", lens: "divingmask", umbrella: "divingmask", shockabsorber: "plates", gamer: "steadyhand", spareeye: "steadyhand", taskmgr: "protector", powerbank: "miner", sonarplus: "glass", compass16: "glass", coupon: "spyhole", banker: "hoard" }, seenP = new Set();
    r.perks = r.perks.map(id => (!A.RELICS[id] && TO[id] && !r.perks.includes(TO[id]) && !seenP.has(TO[id]) ? (seenP.add(TO[id]), TO[id]) : id));
    r.amu = r.amu || {}; r.perks.forEach(id => { if (A.RELICS[id] && A.RELICS[id].amulet && r.amu[id] == null) r.amu[id] = AMU_LV; });
    const gone = r.perks.filter(id => !A.RELICS[id]); if (gone.length) { r.perks = r.perks.filter(id => A.RELICS[id]); r.coins += gone.length * 4; }
    const dead = Object.keys(r.tools).filter(id => !TOOLS[id]); dead.forEach(id => { delete r.tools[id]; r.coins += 3; });
    if ((r.stock || []).some(s => (s.k === "perk" && !A.RELICS[s.id]) || (s.k === "tool" && !TOOLS[s.id]))) { r.stock = null; r.stockKey = null; }
    if (r.cjk == null) r.cjk = A.chal.noLatin();                    // v0.4.1: partidas de antes sin run.cjk: se fija una vez con el idioma de ahora
    /* v0.23: retos que ya no existen ("Continentes cambiados"): fuera de la partida guardada, y el soborno que se pago por quitarlo se devuelve
       (en esa ronda sale otro reto en su lugar) */
    if (r.chal) r.chal = r.chal.filter(c => A.CHAL[c.id]).map(c => A.chal.canon(c));   // tanda 6: los gemelos de antes pasan al reto que los absorbe
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
    S.camp = { id: "adv", mode: "adventure", title: { es: "Aventura", en: "Adventure" }, home: { lat: 20, lon: 10, zoom: 1 }, levels: [{ advance: run.inf ? 1 : roundTarget(), boss: !run.inf && isBoss() }] };
    A.adv.roundEnd();
  }
  /* descarta la partida guardada de una ranura (por defecto, la de la partida activa si la hay; si no, la expedicion normal).
     Un intento del Reto diario no se tira: se cierra con los puntos que llevaba y cuenta para la puntuacion global del dia. */
  A.adv.abandon = (daily = !!(run && run.board)) => {
    const act = !!run && !!run.board === daily, r = act ? run : loadSlot(daily), key = act ? slot : keyOf(daily); payLeg(r);
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
  /* As en la manga (tanda 5): el 6.o lugar, de la franja DIFICIL del tema, con su propia sub-semilla (":manga"): las 5 de siempre no cambian */
  function drawExtra(pos, attempt, usedIds) {
    const slot = slotOf(pos), B = bandsOf(slot), rr = A.rng(`${run.seed}:q:${pos}:${attempt}:manga`), ctx = ctxOf(pos, usedIds, B.topic), taken = [];
    takeFrom(B.bands[2].list, 1, rr, taken, ctx, B.tail);
    for (const b of B.bands) if (!taken.length) takeFrom(b.list, 1, rr, taken, ctx, null);
    return taken.slice(0, 1);
  }
  function pickQuestions(n, keep) {
    const all = allQ();
    if (keep && run.qv === QV && run.curQ && run.curQ.length === n && run.curQ.every(id => all[id])) { run.used = run.used.concat(run.curQ.filter(id => !run.used.includes(id))); return run.curQ.map(id => withSub({ ...all[id] })); }
    const pos = roundNo();
    let used = run.used;
    if (run.board) { used = dailyUsed(pos); for (let a = 0; a < run.attempt; a++) used = used.concat(drawRound(pos, a, used, Math.min(n, 5)).map(q => q.cid[0])); }
    const out = drawRound(pos, run.attempt, used, Math.min(n, 5));
    if (n > 5) out.push(...drawExtra(pos, run.attempt, used.concat(out.map(q => q.cid[0]))));   // la 6.a, la ultima
    run.qv = QV; run.curQ = out.map(q => q.cid[0]); run.used = run.used.concat(run.curQ);
    return out.map(q => withSub({ ...q }));
  }
  function roundLevel(keep) {
    const r = roundNo(), boss = isBoss(), def = rdef(), cf = chalFor(r), halve = 1;
    const ctx = { seconds: clamp(Math.round(26 - 1.0 * r + ascFx(run.asc).secs), 10, 28), target: 1 };
    perkList().forEach(p => p.round && p.round(ctx, run)); ctx.target = Math.max(0.85, ctx.target);
    if (run.sup && run.sup.cafe) ctx.seconds += 4;                                       // suministro: Cafe doble
    ctx.seconds = Math.max(6, ctx.seconds);
    run.chal = cf.list; run.chalName = cf.combo ? cf.combo.n : null; run.chalHalve = halve;
    const rules = cf.list.map(c => (c.id === "storm" ? "clock" : c.id)).filter(id => ["wind", "clock", "silence"].includes(id)), st = cf.list.find(c => c.id === "storm");
    if (st) ctx.seconds = Math.max(6, Math.round(ctx.seconds * [0.75, 0.65, 0.55][clamp((st.lv || 1) - 1, 0, 2)]));   // Contrarreloj (tanda 6): 0,75 / 0,65 / 0,55 del tiempo
    run.boss = rules; run.wind = null;
    if (rules.includes("wind")) { const wr = A.rng(`${run.seed}:wind:${r}:${run.attempt}`); run.wind = { brg: Math.round(wr() * 360), km: Math.round((160 + 40 * run.act) * halve) }; }
    run.qn = has("sleeve") && !run.inf ? 6 : 5;
    const qs = pickQuestions(run.qn, keep), info = actInfo(run.act), tn = TOPIC_NAMES[def.topic][Math.min(def.tier, TOPIC_NAMES[def.topic].length - 1)];
    run.topic = def.topic; run.tier = def.tier;
    if (!(keep && run.split && run.split.key === tgtKey())) {           // Dividir (tanda 12b): la alternativa de la pregunta dificil
      run.split = null;
      if (has("split") && !run.inf) {
        const pos = roundNo(), B = bandsOf(slotOf(pos)), hard = new Set(B.bands[2].list.map(q => q.cid[0])), hi = qs.findIndex((q, i) => i < 5 && hard.has(q.cid[0]));
        if (hi >= 0) { const t = []; takeFrom(B.bands[2].list, 1, A.rng(`${run.seed}:alt:${pos}:${run.attempt || 0}`), t, ctxOf(pos, run.used, B.topic), B.tail); if (t[0]) run.split = { key: tgtKey(), qi: hi, alt: t[0].cid[0], used: false }; }
      }
    }
    return {
      name: `${A.tx(info.n)} · ${boss ? A.T("Jefe", "Boss") : A.tf("Ronda {n}/3", "Round {n}/3", { n: run.round + 1 })}`, topicName: tn, topic: def.topic, kind: "adventure", boss: !!boss,
      seconds: ctx.seconds, advance: roundTarget(), maxPerQ: 1400, bonus: false, plainName: true, questions: () => qs,
      score: (q, km, left) => A.adv.score(q, km, left, true).sc,
    };
  }
  function startRound(keep) {
    run.phase = "round";
    if (!keep) { run.qPts = []; run.qi = 0; run.luckUsed = false; run.guardUsed = false; run.rTools = 0; run.rBulls = 0; run.leftSum = 0; run.roundScore = 0; run.rGood = 0; run.streak = 0; run.calmOn = false; refillTools(); }
    const Lv = roundLevel(keep), S = C().S;
    S.run = run; S.camp = { id: "adv", mode: "adventure", title: { es: "Aventura", en: "Adventure" }, home: { lat: 20, lon: 10, zoom: 1 }, levels: [Lv] };
    S.runTotal = run.score; S.runMax = 0; C().map.setHome(S.camp.home); C().map.setStyle(mapStyleFor());
    amuSpend();
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
    const chips = list.map(c => { const d = A.CHAL[c.id]; return `<div class="adv-debuff k-${d.kind}"><span>${ic(d.ico)}</span><div><b>${A.tx(d.n)}${c.isNew ? ` <span class="ch-new">${A.tx(A.chal.NEW_TAG)}</span>` : ""} <i class="ch-lv">${"●".repeat(c.lv || 1)}</i></b><i>${A.tx(d.d)}</i>${c.id === "wind" && run.wind ? `<em>${A.T("Viento hacia", "Wind toward")} ${dirName(run.wind.brg)} · ${A.fmtDist(run.wind.km)}</em>` : ""}</div></div>`; }).join("");
    const kind = Lv.boss ? "boss" : run.round === 0 ? "small" : "big", inner = Lv.boss ? BOSS_IC : run.round === 0 ? "s_pin" : "s_compass";
    return `<div class="intro-in adv${Lv.boss ? " is-boss" : ""}"><div class="intro-left"><div class="intro-num blind">${A.blind(kind, inner)}</div><div class="intro-body">
      <span class="tag">${A.tx(info.n)} · ${actSub(info)}</span><h2>${A.tx(Lv.topicName)}</h2>
      ${Lv.boss && run.chalName ? `<p class="boss-combo">${A.tx(run.chalName)}</p>` : ""}
      <p class="intro-sub">${Lv.boss ? A.T("Jefe del acto", "Act boss") : A.T("Ronda", "Round") + " " + (run.round + 1)} · ${A.tx(info.f)}${run._virgin ? ` <b class="intro-new">${NEW}</b>` : ""}</p>
      <p class="adv-goal">${A.T("Objetivo", "Target")} ${!run.inf && baseTarget() > Lv.advance ? `<s class="of-was">${A.fmt(baseTarget())}</s> ` : ""}<b>${A.fmt(Lv.advance)}</b> · ${run.qn} ${A.T("lugares", "places")}${run.qn > 5 ? " · " + A.tx(BEST5) : ""} · ${Lv.seconds} s</p>
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
      act: run.act, round: run.round, attempt: run.attempt, lives: run.lives, chal: list.slice(0, Lv.boss ? 3 : 2).map(c => c.id), form: list.slice(0, Lv.boss ? 3 : 2).map(c => A.chal.formOf(c)), isNew: list.slice(0, Lv.boss ? 3 : 2).map(c => !!c.isNew), counters,
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
      o, km, left, limit, kind: o.kind || (o.clue ? "clue" : "place"), topic: o.topic || "mixed", cont: continentOf(o), coins: 0, lines: [], xmult: 1, mult: 1, streakStep: 0.2,
      scale: clamp(1500 * Math.pow(0.97, r), 300, 1500) * (KIND_FACTOR[o.kind] || 1),   // v0.20: el margen se estrecha un 3 % por ronda (antes 6 %)
    };
    perkList().forEach(p => p.q && p.q(c, run));
    if (km != null) perkList().forEach(p => p.km && p.km(c, run));
    let dist = km == null ? 0 : Math.round(1000 * Math.exp(-c.km / c.scale));
    const time = km == null ? 0 : Math.round(400 * Math.max(0, left / limit) * (0.3 + 0.7 * dist / 1000));
    c.dist = dist; c.time = time; c.chips = dist + time;
    const ratio = dist / 1000, manga = has("sleeve") && !run.inf && run.qi === 5; let streak = km != null && ratio >= 0.6 ? S.streak + 1 : 0, guarded = false;
    if (manga) streak = S.streak;                                     // As en la manga: la 6.a ni alarga ni corta la racha
    const gN = sumFlag("guard");                                       // Guardarrachas: los 2 primeros fallos de la ronda no cortan la racha (tampoco el tiempo agotado)
    if (ratio < 0.6 && S.streak > 0 && gN && !run.inf && (+run.guardUsed || 0) < gN) { streak = S.streak; guarded = true; if (!noSide) { run.guardUsed = (+run.guardUsed || 0) + 1; setTimeout(() => A.adv.flash("streakguard", 2, "✓"), 450); } c.lines.push(["streakguard", A.tx(A.RELICS.streakguard.n), "✓"]); }
    if (!noSide && !run.inf && streak === 2 && S.streak === 1 && has("calm") && run.qi < (run.qn || 5) - 1 && (run.chal || []).some(c2 => (perkList().find(p => p.calm) || {}).calm.includes((A.CHAL[c2.id] || {}).fam))) setTimeout(() => { A.adv.flash("coolhead", 1, "❄"); if (A.sfx.ice) A.sfx.ice(); }, 500);   // Sangre fria: la siguiente, en frio
    c.streak = streak; c.mult = guarded || manga ? 1 : 1 + (streak >= 2 ? Math.min(1.5, c.streakStep * (streak - 1)) : 0);   // la respuesta salvada puntua x1
    c.qi = run.qi;
    if (km != null) perkList().forEach(p => { if (!p.post) return; const tx = p.post(c, run); if (tx) { c.lines.push([p.ico, A.tx(p.n), tx]); if (!noSide) A.adv.flash(p.id, 0, tx); } });
    c.total = km == null ? 0 : Math.round(c.chips * c.mult * c.xmult);
    if (!noSide && !run.inf) { run.qPts = run.qPts || []; run.qPts[c.qi] = c.total; }
    if (manga) {                                                       // suma solo lo que mejora a tu peor respuesta de las 5: la ronda vale tus 5 mejores
      const prev = (run.qPts || []).slice(0, 5), worst = prev.length ? Math.min(...prev) : 0, raw = c.total; c.total = Math.max(0, raw - worst);
      c.lines.push(["sleeve", A.tx(A.RELICS.sleeve.n), raw > worst ? "−" + A.fmt(worst) : "="]);
      if (!noSide) setTimeout(() => { if (raw > worst) { A.adv.flash("sleeve", 2, "+" + A.fmt(raw - worst)); A.sfx.jackpot(2); } else A.adv.flash("sleeve", 0, "="); }, 450);
    }
    if (!noSide && km != null && ratio >= 0.6 && run.ballSaved && run.ballSaved[qKey()]) { run.ballSaved[qKey()] = 0; setTimeout(() => { A.adv.flash("reball", 2, "✓"); A.sfx.jackpot(2); }, 450); }   // la segunda bola acerto
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
    const dcs = C().map && C().map.decoys; if (g && dcs && dcs.length && res.dist < 750) info.decoy = dcs.some(d => A.geo.haversine(g.lat, g.lon, d.lat, d.lon) < 90);   // v0.52: las chinchetas caen en cualquier sitio, tambien junto al bueno: solo si fallaste
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
  /* nota de campo sin chivatazos (Libro de la casa y Nota del crupier). En las banderas la nota del pais nombra su capital, gentilicios... y en las
     pistas, la respuesta: alli solo dice la region del pais (las 31 familias de la Enciclopedia, js/codex.js) o, si no tiene, su continente.
     Si el nombre de la familia dice el pais o la respuesta en algun idioma ("Italia y Malta", "United States, Canada & Greenland", "Iran y Asia
     Central"...), la region es el continente ("Region: Europa": la carta promete la region y la cumple). Con la Adivinanza, la nota sale tapada
     igual que la placa (antes la resolvia al instante) */
  const REGION = "Región: {r}|Region: {r}|Région : {r}|Região: {r}|Region: {r}|Regione: {r}||地区：{r}|지역: {r}|地域：{r}|Регион: {r}|Region: {r}";
  const foldTx = s => String(s || "").normalize("NFD").replace(/\p{M}/gu, "").normalize("NFC").toLowerCase();   // NFC: sin recomponer, el hangul se quedaba en jamo
  const CJK_RE = /[\u1100-\u11ff\u3040-\u30ff\u3130-\u318f\u3400-\u9fff\uac00-\ud7af]/;
  const saysWord = (txt, w) => (CJK_RE.test(w) ? w.length >= 2 && txt.includes(w) : w.length >= 4 && new RegExp("(^|[^\\p{L}\\p{N}])" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "($|[^\\p{L}\\p{N}])", "u").test(txt));
  const famSays = (fam, N) => { const R = A.L6(fam); return Object.keys(N).some(l => R[l] && N[l].some(n => foldTx(n).split(/[\s,.()'’-]+/).some(w => saysWord(foldTx(R[l]), w)))); };
  const regionNote = o => {
    const ne = o.t === "c" ? o.key : (o.cEn || []).map(neOf).find(Boolean), fam = ne && A.codex && A.codex.regionNames ? A.codex.regionNames(ne) : "", N = {};
    Object.entries((o.clue ? o.answer : o.name) || {}).concat((o.cEn || []).map(n => ["en", n])).forEach(([l, n]) => { if (n) (N[l] = N[l] || []).push(n); });   // la respuesta y el pais, en cada idioma
    return A.pick6(REGION).replace("{r}", fam && !famSays(fam, N) ? A.pick6(fam) : continentName(o));
  };
  /* Soplo del crupier (tanda 10): en que mitad del pais esta el lugar, segun el eje largo del poligono donde esta (con Sin pais, sin nombrarlo);
     en las pistas, la region. En banderas y paises no dice nada (la tienda ya no lo ofrece si solo quedan esas rondas) */
  const HALF = { N: L6("Mitad norte de {c}|Northern half of {c}|Moitié nord : {c}|Metade norte de {c}|Nördliche Hälfte von {c}|Metà nord di {c}||{c}的北半部|{c}의 북쪽 절반|{c}の北半分|Северная половина: {c}|Północna połowa: {c}"), S: L6("Mitad sur de {c}|Southern half of {c}|Moitié sud : {c}|Metade sul de {c}|Südliche Hälfte von {c}|Metà sud di {c}||{c}的南半部|{c}의 남쪽 절반|{c}の南半分|Южная половина: {c}|Południowa połowa: {c}"), E: L6("Mitad este de {c}|Eastern half of {c}|Moitié est : {c}|Metade leste de {c}|Östliche Hälfte von {c}|Metà est di {c}||{c}的东半部|{c}의 동쪽 절반|{c}の東半分|Восточная половина: {c}|Wschodnia połowa: {c}"), W: L6("Mitad oeste de {c}|Western half of {c}|Moitié ouest : {c}|Metade oeste de {c}|Westliche Hälfte von {c}|Metà ovest di {c}||{c}的西半部|{c}의 서쪽 절반|{c}の西半分|Западная половина: {c}|Zachodnia połowa: {c}") }, HALF0 = { N: L6("Mitad norte del país|Northern half of the country|Moitié nord du pays|Metade norte do país|Nördliche Landeshälfte|Metà nord del paese||该国北半部|나라의 북쪽 절반|国の北半分|Северная половина страны|Północna połowa kraju"), S: L6("Mitad sur del país|Southern half of the country|Moitié sud du pays|Metade sul do país|Südliche Landeshälfte|Metà sud del paese||该国南半部|나라의 남쪽 절반|国の南半分|Южная половина страны|Południowa połowa kraju"), E: L6("Mitad este del país|Eastern half of the country|Moitié est du pays|Metade leste do país|Östliche Landeshälfte|Metà est del paese||该国东半部|나라의 동쪽 절반|国の東半分|Восточная половина страны|Wschodnia połowa kraju"), W: L6("Mitad oeste del país|Western half of the country|Moitié ouest du pays|Metade oeste do país|Westliche Landeshälfte|Metà ovest del paese||该国西半部|나라의 서쪽 절반|国の西半分|Западная половина страны|Zachodnia połowa kraju") };
  const halfNote = o => {
    if (A.adv.isFlagRound() || o.t === "c") return null;
    if (o.clue) return regionNote(o);
    const ne = (o.cEn || []).map(neOf).find(Boolean), f = ne && C().world.byName[ne]; if (!f || o.lat == null) return null;
    const ar = p => (p.bbox[2] - p.bbox[0]) * (p.bbox[3] - p.bbox[1]), poly = f.polys.find(p => A.geo.inFeature(o.lon, o.lat, { polys: [p] })) || f.polys.reduce((a, b) => (ar(b) > ar(a) ? b : a));
    const b = poly.bbox, cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2, w = (b[2] - b[0]) * Math.cos((cy * Math.PI) / 180), h = b[3] - b[1];
    const k = w >= h ? (o.lon >= cx ? "E" : "W") : o.lat >= cy ? "N" : "S";
    return (run.chal || []).some(c => c.id === "nocountry") || !o.sub ? A.tx(HALF0[k]) : A.tx(HALF[k]).replace("{c}", A.tx(o.sub).split(" · ")[0]);
  };
  /* Pase VIP (tanda 10): tres fichas doradas caen en el mapa en orden barajado (sub-semilla :trile): una marca el lugar y dos son senuelos fuera
     del umbral de racha x1,5 (del lugar y entre si). Lugares: del mismo pais (si no hay dos, del mismo continente); paises y banderas: el centro
     de otros paises del mismo continente cuyo borde queda lejos. A ciegas, una ficha al azar hace racha ~1 de cada 3 veces */
  const TRILE_NOTE = L6("Una de las tres fichas marca el lugar.|One of the three chips marks the place.|Un des trois jetons marque le lieu.|Uma das três fichas marca o lugar.|Einer der drei Chips markiert den Ort.|Una delle tre fiche segna il luogo.||三枚筹码中有一枚标出了地点。|세 칩 중 하나가 장소를 가리킵니다.|3枚のうち1枚が場所を示している。|Одна из трёх фишек отмечает место.|Jeden z trzech żetonów oznacza miejsce.");
  function trile(o) {
    const S = C().S, map = C().map, Wd = C().world, rr = A.rng(`${run.seed}:trile:${roundNo()}:${S.qi}`);
    const far = 1.5 * 0.5108 * clamp(1500 * Math.pow(0.97, roundNo()), 300, 1500) * (KIND_FACTOR[o.kind] || 1), dist = (a, b) => A.geo.haversine(a[1], a[0], b[1], b[0]);
    const inner = f => { const ar = p => (p.bbox[2] - p.bbox[0]) * (p.bbox[3] - p.bbox[1]), big = f.polys.reduce((a, b) => (ar(b) > ar(a) ? b : a)), b = big.bbox; let p = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]; for (let k = 0; k < 60 && !A.geo.inFeature(p[0], p[1], { polys: [big] }); k++) p = [b[0] + (b[2] - b[0]) * rr(), b[1] + (b[3] - b[1]) * rr()]; return p; };
    let tgt, pool;
    if (o.t === "c") {
      const f = Wd.byName[o.key]; if (!f) return; tgt = inner(f); const cont = A.continent(tgt[1], tgt[0]);
      pool = Wd.features.filter(g => g !== f && g.polys.length).map(inner).filter(p => A.continent(p[1], p[0]) === cont && A.geo.distToFeature(p[0], p[1], f) > far);
    } else {
      tgt = [o.lon, o.lat]; const cs = new Set(o.cEn || []), cont = continentOf(o), bank = infPool().filter(q => q.lat != null && q.cid[0] !== o.cid[0]);
      const same = bank.filter(q => (q.cEn || []).some(n => cs.has(n))).map(q => [q.lon, q.lat]).filter(p => dist(p, tgt) > far);
      pool = same.length >= 2 ? same : bank.filter(q => continentOf(q) === cont).map(q => [q.lon, q.lat]).filter(p => dist(p, tgt) > far);
    }
    const picks = []; for (const p of rr.shuffle(pool)) { if (picks.every(q => dist(q, p) > far)) picks.push(p); if (picks.length === 2) break; }
    for (const p of pool) { if (picks.length >= 2) break; if (!picks.includes(p)) picks.push(p); }
    const t0 = performance.now() + 120, list = rr.shuffle([tgt, ...picks]).map((p, k) => ({ lon: p[0], lat: p[1], t0: t0 + k * 260, chip: true }));
    map.setDecoys((map.decoys || []).filter(d => !d.chip).concat(list));
    list.forEach((d, k) => timers.push(setTimeout(() => A.sfx.chip(0.3 + k * 0.25), d.t0 - performance.now() + 480)));   // cada ficha tintinea al caer
    timers.push(setTimeout(() => A.sfx.counter(1), t0 - performance.now() + (list.length - 1) * 260 + 760));   // y la mesa dice tachan
    noteH(A.tx(TRILE_NOTE), "passport");
  }
  const fieldNote = o => (A.adv.isFlagRound() || o.clue ? regionNote(o) : A.chal.noteMask(o, A.tx(o.fact) || (A.factOf && A.factOf(o)) || ""));
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
    { const b = !run.inf && run.qi === 0 && (run.bets || {})[roundNo()]; if (b && b.id === "red" && b.win && b.att === (run.attempt || 0)) { S.streak = Math.max(S.streak || 0, 1); run.streak = Math.max(run.streak || 0, 1); } }   // tanda 11: Rojo o negro acertado: empiezas en racha
    const calmF = (perkList().find(p => p.calm) || {}).calm, calm = calmF && !run.inf && (run.streak || 0) >= 2 && (run.chal || []).some(c => calmF.includes((A.CHAL[c.id] || {}).fam)) ? calmF : null;   // Sangre fria (tanda 9)
    if (!!calm !== !!run.calmOn) { if (calm) A.adv.flash("coolhead", 0, "❄"); else A.adv.flash("coolhead", 0, "✕", () => A.sfx.chip(0.3)); }   // entra en frio / se le quiebra el halo
    const calmWas = !!run.calmOn; run.calmOn = !!calm; if (calmWas !== run.calmOn) renderBars();   // las fichas que apaga, heladas
    const fx = A.chal.fx(perkList()); A.chal.question(o, run.qi, { calm });
    showSplit();
    if (kept) { C().map.avoid = hudRects(); C().map.setProbes(kept); renderBars(); }
    A.pointer.set({ tool: null, fx, calm: !!calm, noCountry: o.t === "c", windFn: run.wind ? windGhost : null, distFn: (lon, lat) => { const oo = C().S.qs[C().S.qi]; if (!oo) return null; return oo.t === "c" ? A.geo.distToFeature(lon, lat, C().world.byName[oo.key]) : A.geo.haversine(lat, lon, oo.lat, oo.lon); } });
    const api = {
      fact: o2 => { const txt = fieldNote(o2); if (txt) noteH(txt, "almanac"); },
      half: o2 => { const txt = halfNote(o2); if (txt) noteH(txt, "sextant"); },   // Soplo del crupier (tanda 10)
      note: noteH, continent: o2 => continentName(o2), country: revealCountry, addTime: s => { S.limit += s; },
      laterHalf: fn => api.later(S.limit / 2, fn),
      /* cuando queden `sec` segundos del reloj de la pregunta: se recalcula en cada espera (la pausa y el Reloj de arena mueven el momento; antes una pausa lo perdia) */
      later: (sec, fn) => { const tick = () => { if (S.phase !== "asking") return; const left = S.limit - (performance.now() - S.t0 - S.pausedAcc) / 1000; if (!S.paused && left <= sec) return fn(); timers.push(setTimeout(tick, S.paused ? 250 : Math.max(50, (left - sec) * 1000))); }; tick(); },
    };
    /* las pistas gratis se lucen la primera vez que dan algo en cada ronda (tambien las que esperan a mitad de tiempo) */
    const rk = run.act + ":" + run.round + ":" + run.attempt;
    perkList().forEach(p => {
      if (!p.open) return;
      const mark = () => { run.hintFl = run.hintFl || {}; if (run.hintFl[p.id] !== rk) { run.hintFl[p.id] = rk; A.adv.flash(p.id, 0); } };
      p.open({ ...api, fact: x => { mark(); api.fact(x); }, note: (t, i) => { mark(); return api.note(t, i); }, country: x => { mark(); return api.country(x); } }, o, run);
    });
    if (S.qi === 5 && has("sleeve") && !run.inf) A.adv.flash("sleeve", 0, "6");   // la 6.a sale de la manga
    if (S.qi === 0 && !run.inf && run.rfK !== rk) { run.rfK = rk; timers.push(setTimeout(() => { if (C().S.phase === "asking") roundFlashes(); }, 650)); }
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
    else if (id === "journal") { const txt = o.clue ? A.tf("Empieza por «{l}» y está en {c}.", "Starts with “{l}” and lies in {c}.", { l: A.tx(o.answer).trim()[0], c: continentName(o) }) : fieldNote(o) || A.T("Sin notas para este lugar.", "No notes for this place."); noteH(txt, "journal"); }
    else if (id === "passport") trile(o);                                // tanda 10: el Pase VIP es un trile
    persist(); renderBars();
  };
  /* Dividir (tanda 12b): en la pregunta dificil, bajo la placa, "o bien: <otro lugar>" (con los mismos retos de placa; en banderas, su bandera
     pequena). Un clic o la tecla Tab la cambian, una sola vez y antes de responder; la otra carta se va con el crupier */
  const SPLIT_OR = L6("o bien:|or:|ou bien :|ou então:|oder:|oppure:||或者：|또는:|または：|или:|albo:");
  const splitQ = () => { const sp = run && run.split, all = sp && allQ(); return sp && all[sp.alt] ? withSub({ ...all[sp.alt] }) : null; };
  A.adv.splitAlt = () => { const S = C().S, sp = run && run.split; return sp && !sp.used && !run.inf && sp.key === tgtKey() && S.qi === sp.qi ? splitQ() : null; };   // tambien para la mesa de Continentes barajados
  function showSplit() {
    const old = $("splitAlt"); if (old) old.remove();
    const q = A.adv.splitAlt(), sub = $("askSub"); if (!q || !sub) return;
    const b = document.createElement("button"); b.id = "splitAlt"; b.type = "button"; b.className = "split-alt";
    b.innerHTML = `<span class="sa-k">${ic("oracle", "sm")}${A.tx(SPLIT_OR)}</span><span class="sa-n"></span><kbd class="sa-key">Tab</kbd>`;
    const n = b.querySelector(".sa-n");
    if (A.adv.isFlagRound() && q.t === "c" && A.FLAGS && q.name && A.FLAGS[q.name.en]) { const fx = A.chal.flagFx && A.chal.flagFx(); n.innerHTML = `<img class="sa-flag" alt="" src="assets/flags/${A.mediaKey(q.name.en)}.svg"${fx ? ` style="filter:${fx}"` : ""}>`; A.chal.flagAlt && A.chal.flagAlt(n.querySelector("img"), q); }
    else if (A.chal.decoAlt) A.chal.decoAlt(n, q); else n.textContent = A.tx(q.name);
    b.onclick = e => { e.stopPropagation(); splitSwap(); };
    sub.after(b);
  }
  function splitSwap() {
    const S = C().S, q = A.adv.splitAlt(); if (!q || S.phase !== "asking") return false;
    run.split.used = true; S.qs[S.qi] = q; if (run.curQ) run.curQ[S.qi] = q.cid[0]; run.used.push(q.cid[0]);
    C().map.clearMarks(); C().refreshPrompt(); hints.length = 0; $("factText").textContent = ""; A.adv.onQuestion(); A.sfx.card(); setTimeout(() => A.sfx.card(), 140);
    A.adv.flash("oracle", run.splitSeen ? 0 : 2, "⇄"); if (!run.splitSeen) { run.splitSeen = 1; setTimeout(() => A.sfx.jackpot(2), 300); }   // la primera vez de la expedicion, con jackpot
    persist(); return true;
  }
  addEventListener("keydown", e => { if (e.key === "Tab" && $("splitAlt") && C().S.phase === "asking") { e.preventDefault(); splitSwap(); } });
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
  function hearts() { let h = ""; for (let i = 0; i < run.maxLives; i++) h += `<i class="hp ${i < run.lives ? "on" : ""}">${ic(i < run.lives ? "heart" : "heart_empty")}</i>`; return h; }
  /* botin en vivo en el marcador: en cuanto superas el objetivo, cuanto cobrarias ya y a cuantos puntos esta el siguiente doblon */
  function renderLoot() {
    const led = $("ledger"); if (!led) return;
    let el = $("scLoot"); if (!el) { el = document.createElement("div"); el.id = "scLoot"; el.className = "lg-loot hidden"; el.dataset.tf = "loot"; led.insertBefore(el, $("streakChip")); }
    const S = C().S, Lv = S.camp && S.camp.levels && S.camp.levels[0];
    const on = !!(run && !run.inf && Lv && S.camp.mode === "adventure" && ["asking", "reveal"].includes(S.phase) && S.levelScore >= Lv.advance);
    el.classList.toggle("hidden", !on); if (!on) return;
    const tb = Math.max(Lv.advance, baseTarget()), lt = loot(S.levelScore, tb, isBoss()), got = gain(lt.base + (has("marginHalf") ? Math.floor(lt.margin / 2) : lt.margin));
    el.innerHTML = `<span>${A.tx(ETX.loot)}</span><b>${CN()}+${got}</b><i>${lt.next ? et("next", { c: gain(lt.base + lt.margin + 1), s: A.fmt(lt.next) }) : A.tx(ETX.max)}</i>`;
  }
  if (A.tips) A.tips.loot = () => A.tx(ETX.lootTip) + "\n" + A.tx(ETX.lootTipD);
  /* ---------------- lucirse (tanda 2): cuando una reliquia TUYA actua, su icono salta en la barra, suena y, si es un premio, tiembla.
     Antes de comprar no cambia nada (ni cartas, ni panel de proxima ronda, ni fichas de reto). lv 0 = aviso (brinco y ficha, sin temblor:
     tambien mientras respondes), 1 = premio flojo (brillo y moneda), 2 = premio medio (brillo, dos fichas y temblor 1, nunca mientras respondes).
     Cola: un aviso tras otro, al ritmo del sonido. La primera vez que actua cada reliquia en la expedicion, el crupier la nombra (frase soft,
     una por ronda como mucho, pasa por su presupuesto) */
  const flashQ = [], flashOn = {};
  let flashBusy = false, flashK = 0;
  A.adv.flash = (id, lv = 0, label = "", snd) => { if (!run || !A.RELICS[id] || !owned(id)) return; flashQ.push({ id, lv, label, snd }); if (!flashBusy) flashNext(); };
  function flashPaint(el, f) {
    el.classList.remove("fl0", "fl1", "fl2"); A.restyle(el); el.classList.add("fl" + f.lv);
    if (f.label) { const old = el.querySelector(".ab-lbl"); if (old) old.remove(); el.insertAdjacentHTML("beforeend", `<i class="ab-lbl">${f.label}</i>`); }
  }
  function flashNext() {
    const f = flashQ.shift(); if (!f || !run) { flashBusy = false; return; } flashBusy = true;
    const el = document.querySelector(`#advBar .ab-perk[data-id="${f.id}"]`), k = flashK++ % 4, asking = C().S.phase === "asking";
    flashOn[f.id] = { f, t: performance.now() }; if (el) flashPaint(el, f);
    if (f.snd) f.snd(); else if (f.lv === 0) A.sfx.chip(0.15 + Math.random() * 0.7); else { A.sfx.coin(k); if (f.lv === 2) setTimeout(() => A.sfx.chip(0.4 + Math.random() * 0.5), 120); }
    if (f.lv === 2 && !asking && C().jpShake) C().jpShake(1);                           // nada tiembla mientras respondes
    run.relicSeen = run.relicSeen || {}; const rk = run.act + ":" + run.round;
    if (!run.relicSeen[f.id] && run.relicSaidR !== rk && !run.inf && A.dealer.react("relic", { p: A.tx(A.RELICS[f.id].n) })) { run.relicSeen[f.id] = 1; run.relicSaidR = rk; }   // solo cuenta si de verdad habla (si estaba ocupado, lo intenta la siguiente)
    setTimeout(flashNext, f.lv ? 420 : 300);
  }
  /* tanda 3: al empezar la ronda, cada amuleto cuya familia sale gasta una carga si sale a nivel 2 o mas (a nivel 1 actua gratis). Se paga una vez
     por ronda, no por intento: la revancha no vuelve a cobrar. run.amuNow: lo que hizo en esta ronda (lo luce el aviso de contra con "-1") */
  function amuSpend() {
    const r = roundNo(); run.amu = run.amu || {}; run.amuPaid = run.amuPaid || {}; const paid = (run.amuPaid[r] = run.amuPaid[r] || []); run.amuNow = {};
    perkList().filter(p => p.amulet).forEach(p => {
      const hit = (run.chal || []).filter(c => A.CHAL[c.id] && A.CHAL[c.id].fam === p.amulet); if (!hit.length) return;
      if (hit.some(c => (c.lv || 1) >= 2) && !paid.includes(p.id) && (run.amu[p.id] || 0) > 0) { run.amu[p.id]--; paid.push(p.id); run.amuNow[p.id] = "-1"; }
    });
  }
  A.adv.amuLabel = id => (run && run.amuNow && run.amuNow[id] === "-1" ? "−1" : "");
  /* al superar la ronda: el amuleto que gasto en ella su ultima carga se parte y deja libre el hueco */
  function amuBreak() {
    const paid = (run.amuPaid || {})[roundNo()] || [], out = perkList().filter(p => p.amulet && !((run.amu || {})[p.id] > 0) && paid.includes(p.id));
    out.forEach(p => { run.perks.splice(run.perks.indexOf(p.id), 1); delete run.amu[p.id]; if (run.paid) delete run.paid[p.id]; });
    return out;
  }
  /* premio en el veredicto (la barra esta oculta): suena una moneda por linea de reliquia al aparecer y tiembla una vez (1); lv 2 = premio medio */
  function relicPay(ids, lv = 1) {
    ids = ids.filter(Boolean); if (!ids.length) return;
    ids.forEach((id, i) => setTimeout(() => { A.sfx.coin(i % 4); if (lv === 2) setTimeout(() => A.sfx.chip(0.4 + Math.random() * 0.5), 120); }, 520 + i * 120));
    setTimeout(() => { if (C().jpShake) C().jpShake(1); }, 560);
    run.relicSeen = run.relicSeen || {}; const id = ids.find(x => !run.relicSeen[x]); if (id) run.relicSeen[id] = 1;   // el veredicto ya habla de ella: el crupier no la presenta luego
  }
  /* renderBars rehace la barra: lo que acaba de lucirse (en los ultimos 700 ms) se vuelve a pintar en el icono nuevo */
  function flashKeep(bar) { const now = performance.now(); for (const id in flashOn) { const x = flashOn[id]; if (now - x.t > 700) { delete flashOn[id]; continue; } const el = bar.querySelector(`.ab-perk[data-id="${id}"]`); if (el) flashPaint(el, x.f); } }
  /* Segunda bola (tanda 5): dos veces por ronda, si tu clic no hace racha (menos de 600) no cuenta. Queda una marca fria (una sonda sin anillo
     ni distancia: dice "aqui no", nunca "aqui si"), el reloj se para 0,4 s y vale el siguiente clic. No salta con el tiempo agotado ni con las sondas */
  A.adv.reBall = (lon, lat) => {
    if (!run || run.inf || !has("reball")) return false;
    const S = C().S, o = S.qs[S.qi]; if (!o) return false;
    const key = roundNo() + ":" + (run.attempt || 0); run.ballN = run.ballN || {}; if ((run.ballN[key] || 0) >= sumFlag("reball")) return false;
    const f = o.t === "c" ? C().world.byName[o.key] : null, km = f ? A.geo.distToFeature(lon, lat, f) : A.geo.haversine(lat, lon, o.lat, o.lon);
    const scale = clamp(1500 * Math.pow(0.97, roundNo()), 300, 1500) * (KIND_FACTOR[o.kind] || 1); if (1000 * Math.exp(-km / scale) >= 600) return false;
    run.ballN[key] = (run.ballN[key] || 0) + 1; (run.ballSaved = run.ballSaved || {})[qKey()] = 1;
    run.probes = run.probes || []; run.probes.push({ lon, lat, ct: C().map.pickCt, cold: true, label: A.tx(OTRA) }); run.probesK = qKey() + ":" + o.cid[0];
    C().map.avoid = hudRects(); C().map.setProbes(run.probes); renderBars();
    S.t0 += 400;                                                         // el reloj se para 0,4 s
    A.sfx.chip(0.2); setTimeout(() => A.sfx.chip(0.65), 140);           // clac-clac de la bola que rebota
    A.adv.flash("reball", 0, A.tx(OTRA));
    return true;
  };
  /* lo que hacen tus reliquias al empezar la ronda (en la 1.a pregunta, tras la intro): quitar o suavizar retos, segundos de mas, cargas de mas, la provision de Por cuenta de la casa */
  function roundFlashes() {
    const r = roundNo(), plan = planOf(r).list, bribed = (run.bribed && run.bribed[r]) || [];
    const left = plan.filter(c => !bribed.includes(c.id)), pl = perkList();
    pl.forEach(p => {
      if (p.skipHardest && left.length) A.adv.flash(p.id, 0);
      if (p.softenBoss && r % 4 === 3 && left.length) A.adv.flash(p.id, 0);
      if ((p.immune || []).some(id => left.some(c => c.id === id))) A.adv.flash(p.id, 0);
      if (p.toolBonus && Object.keys(run.tools).length) A.adv.flash(p.id, 0, "+" + p.toolBonus);
      if (p.round) { const x = { seconds: 0 }; p.round(x, run); if (x.seconds) A.adv.flash(p.id, 0, "+" + x.seconds + " s"); }
    });
    if (run.healAct === run.act && run.round === 0 && !run.attempt) { run.healAct = -1; A.adv.flash("medkit", 1, "+1"); }
  }
  function renderBars() {
    ensureBars(); const bar = $("advBar"), tb = $("toolBar"); renderLoot();
    if (!run || !C().S.camp || C().S.camp.mode !== "adventure" || ["title", "levelEnd", "shop"].includes(C().S.phase)) { bar.classList.add("hidden"); tb.classList.add("hidden"); return; }
    const info = actInfo(run.act), silenced = (run.boss || []).includes("silence");
    bar.classList.remove("hidden");
    bar.innerHTML = `<div class="ab-top"><span class="ab-act" data-tf="abact">${A.tx(info.n)}</span><span class="ab-coins" id="abCoins" data-tf="abcoins">${CN()}<b>${run.coins}</b></span><span class="ab-hearts" data-tf="abhearts">${hearts()}</span></div>
      <div class="ab-perks">${run.perks.map(id => `<span class="ab-perk" data-id="${id}" title="${A.tx(A.RELICS[id].n)} — ${A.tx(A.RELICS[id].d)}">${ic(id)}${isAmu(id) ? pips((run.amu || {})[id] || 0, "ab-pips") : ""}${id === "hoard" && run.hucha ? `<b class="hc-n">${run.hucha}</b>` : ""}</span>`).join("")}</div>
      ${(run.chal || []).length ? `<div class="ab-chal">${run.chal.map(c => A.chal.chip(run.calmOn && ((perkList().find(p => p.calm) || {}).calm || []).includes((A.CHAL[c.id] || {}).fam) ? { ...c, calm: true } : c, true)).join("")}</div>` : ""}
      ${run.wind ? `<div class="ab-wind"><svg viewBox="-12 -12 24 24" style="transform:rotate(${run.wind.brg}deg)"><path d="M0 -9 L6 4 L0 1 L-6 4 Z"/></svg><span>${dirName(run.wind.brg)} · ${A.fmtDist(run.wind.km)}</span></div>` : ""}`;
    flashKeep(bar);
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
      const tb = Math.max(Lv.advance, baseTarget()), lt = loot(S.levelScore, tb, boss), mh = has("marginHalf"), mg = mh ? Math.floor(lt.margin / 2) : lt.margin, x = { coins: lt.base + mg }, lines = [[A.T("Ronda superada", "Round cleared"), "+" + lt.base]];
      if (lt.margin) lines.push([et("margin", { p: pctOf(S.levelScore - tb, tb) }) + (mh ? " · ½" : ""), "+" + mg, mh ? "minbet" : null, mh ? "half" : null]);   // la Mesa de minimos paga la mitad del margen
      if (mh && S.levelScore < tb) lines.push([A.tx(A.RELICS.minbet.n) + " · " + A.tx(SAVED_BY), "", "minbet"]);
      if (has("midas") && !mh && S.levelScore < tb) { lines.push([A.tx(A.RELICS.philosopher.n) + " · " + A.tx(SAVED_BY), "", "philosopher"]); setTimeout(() => { A.sfx.jackpot(2); if (A.core.jpShake) A.core.jpShake(2); }, 1100); }   // tanda 12: Midas te ha salvado   // ha decidido la ronda   // cuanto mas por encima del objetivo, mas doblones
      const cap = sumFlag("interest") || 2, interest = Math.min(cap, Math.floor(run.coins / 10));
      if (interest) { x.coins += interest; lines.push([A.T("Interés (1 por cada 10)", "Interest (1 per 10)"), "+" + interest, interest > 2 ? (perkList().find(p => p.interest) || {}).id : null]); }   // por encima de 2, es el Banquero
      perkList().forEach(p => { if (p.clear) { const y = { coins: 0 }, tx = p.clear(y, run); if (y.coins) { x.coins += y.coins; lines.push([A.tx(p.n), tx || "+" + y.coins, p.id]); } } });
      if (has("bank")) { const b = gain(sumFlag("bank")); run.hucha = (run.hucha || 0) + b; lines.push([A.tx(A.RELICS.hoard.n) + " · " + A.tx(H_IN).replace("{n}", run.hucha), "+" + b, "hoard"]); }   // tanda 9: la Hucha guarda, no paga
      if (boss && run.act === 1 && has("bossHeal") && run.lives < run.maxLives) { run.lives++; lines.push([A.tx(A.RELICS.heartperk.n), A.tx(H_HEART), "heartperk"]); setTimeout(() => A.sfx.jackpot(1), 1100); }   // Corazon: el jefe del acto II te devuelve una provision
      const bet = (run.bets || {})[roundNo()], first = !run.attempt;   // tanda 11: las apuestas se cobran aqui
      if (bet && bet.id === "red" && bet.win && bet.att === (run.attempt || 0) && !bet.paid) { const extra = Math.ceil(x.coins * 0.5); x.coins += extra; bet.paid = 1; lines.push([A.tx(BETS.red.n) + " · +50 %", "+" + extra, null, "bet"]); }
      const got = gain(x.coins); if (got !== x.coins) lines.push([A.T("Doblones ×2", "Doubloons ×2"), "+" + (got - x.coins), (perkList().find(p => p.coinX) || {}).id]);
      run.coins += got; run.stats.coinsEarned += got;
      if (bet && bet.id === "double" && !bet.done) { bet.done = 1; if (first) { const win = Math.min(bet.stake, 40); run.coins += bet.stake + win; run.stats.coinsEarned += win; lines.push([A.tx(BETS.double.n) + " ×2", "+" + (bet.stake + win), null, "bet"]); setTimeout(() => { A.sfx.jackpot(3); if (A.core.jpShake) A.core.jpShake(3); A.dealer.say(A.dealer.line("betWin"), { mood: "angry", hold: 2400 }); }, 1100); } }   // doblas lo apostado (+40 como mucho)
      if (bet && bet.id === "final" && !bet.done) { bet.done = 1; if (first) { run.maxLives += 2; run.lives += 2; lines.push([A.tx(BETS.final.n), A.tx(BT.lives2), null, "bet"]); setTimeout(() => { A.sfx.jackpot(3); if (A.core.jpShake) A.core.jpShake(3); }, 1100); } }   // +2 provisiones para el modo infinito
      A.ach.emit("adv", { kind: "clear", tools: run.rTools, bulls: run.rBulls || 0 }); if (boss) { A.ach.emit("adv", { kind: "boss", lives: run.lives }); A.profile.get().adv.boss++; }
      A.sfx.stamp(); setTimeout(A.sfx.clear, 300);
      const broke = amuBreak(); broke.forEach(p => lines.push([A.tx(p.n) + " · " + A.tx(AMU_BROKE), "", p.id, "broke"]));
      if (broke.length) setTimeout(() => A.sfx.glass(), 900);
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
      relicPay(lines.filter(l => l[2] && !l[3]).map(l => l[2]));
      const wb = { big: lt.margin >= 3, c: got, p: pctOf(S.levelScore - Lv.advance, Lv.advance), rn: roundNo() + 1, close: S.levelScore - Lv.advance < Lv.advance * 0.05 ? S.levelScore - Lv.advance : null };   // close: por los pelos   // aplastar la meta (+50 %) tiene sus propias frases
      setTimeout(() => A.dealer.react("roundWin", wb), 700);                // el crupier protesta (antes estas frases nunca se decian)
    } else {
      const insured = !!(run.sup && run.sup.seguro), shielded = insured || (has("shieldAct") && run.shieldAct !== run.act);
      if (shielded && !insured) run.shieldAct = run.act; else if (!shielded) { run.lives--; run.livesLostAct++; }
      const lb = (run.bets || {})[roundNo()], betLost = [];   // tanda 11: la apuesta del jefe se pierde al fallarlo (Doble o nada: lo apostado)
      if (lb && (lb.id === "double" || lb.id === "final") && !lb.done) { lb.done = 1; betLost.push([A.tx(BETS[lb.id].n), lb.id === "double" ? "−" + lb.stake : "—", null, "bet lost"]); setTimeout(() => A.dealer.say(A.dealer.line("betLose"), { mood: "laugh", hold: 2400 }), 1200); }
      if (insured) run.segN = (run.segN || 0) + 1;                       // el Seguro de ronda se ha gastado: el siguiente cuesta 2 mas (superar la ronda no lo encarece)
      run.attempt++; run.phase = "retry";
      /* consuelo: lo que puntuaste en la ronda fallida se cobra (1 por cada tercio del objetivo) para comprar ayuda antes de la revancha */
      const q = S.levelScore / Math.max(1, Math.max(Lv.advance, baseTarget())), conso = run.lives > 0 ? gain(consoOf(q)) : 0;
      if (conso) { run.coins += conso; run.stats.coinsEarned += conso; }
      persist();
      A.sfx.stamp(); setTimeout(A.sfx.lose, 300);
      if (run.lives <= 0) return endRun(false);
      C().verdict({
        kind: "", level: roundNo() + 1, tag: `${A.tx(actInfo(run.act).n)} · ${boss ? A.T("Jefe", "Boss") : A.T("Ronda", "Round") + " " + (run.round + 1)}`, title: A.T("No llegaste al objetivo", "Target missed"),
        text: (insured ? A.pick6(SAVED_SUP) : shielded ? ic("shield", "sm") + " " + A.pick6(SAVED_PERK) : "") + (run.lives === 1 ? A.tf("Te quedaste en {s} de {a}. Te queda {n} provisión.", "You scored {s} of {a}. You have {n} provision left.", { s: A.fmt(S.levelScore), a: A.fmt(Lv.advance), n: run.lives }) : A.tf("Te quedaste en {s} de {a}. Te quedan {n} provisiones.", "You scored {s} of {a}. You have {n} provisions left.", { s: A.fmt(S.levelScore), a: A.fmt(Lv.advance), n: run.lives })),   // cada seguro con su frase: se sabe cual te ha salvado
        lines: (conso ? [[et("conso", { p: pctOf(S.levelScore, Lv.advance) }), "+" + conso]] : []).concat(betLost),
        stats: [[A.T("Puntos de la ronda", "Round points"), S.levelScore], [A.T("Objetivo", "Target"), Lv.advance], [A.T("Doblones", "Doubloons"), run.coins]], stamp: A.T("FALLIDA", "FAILED"), stampSub: String(run.lives), art: "lose",
        buttons: [{ id: "rtBtn", cls: "btn-ink", label: A.T("Reintentar con lugares nuevos", "Retry with new places"), arrow: true, primary: true, onclick: () => openShop(false) }, { id: "abBtn", cls: "btn-line", label: A.T("Abandonar", "Abandon"), onclick: () => endRun(false) }],
      });
      if (shielded && !insured) relicPay(["shield"], 2);
      const lives = run.lives; setTimeout(() => A.dealer.react("roundFail", { lives, conso }), 700);
      A.dealer.hover($("abBtn"), "hoverAbandon");                            // si el cursor va hacia Abandonar, el crupier lo ve
      { const ab = $("abBtn"); if (ab && !abSwapped) ab.addEventListener("pointerenter", () => { if (abSwapped || !ab.isConnected) return; abSwapped = true; const sp = ab.querySelector("span"); if (sp) sp.textContent = A.pick6("Abandonar (y dejarle ganar)|Abandon (and let him win)|Abandonner (et le laisser gagner)|Abandonar (e deixar ele ganhar)|Aufgeben (und ihn gewinnen lassen)|Abbandona (e lascialo vincere)||放弃（让他赢）|포기 (그가 이기게 두기)|やめる（彼を勝たせる）|Сдаться (и дать ему выиграть)|Poddaj się (i daj mu wygrać)"); if (A.sfx.buzz) A.sfx.buzz(1); }); }   // el boton dice la verdad (una vez por sesion)
    }
    run.sup = {}; persist();                                                // los suministros solo valen para una ronda
  };
  const H_HEART = L6("+1 provisión|+1 provision|+1 provision|+1 provisão|+1 Proviant|+1 provvista||+1 补给|식량 +1|+1 プロビジョン|+1 запас|+1 zapas"), H_IN = L6("dentro: {n}|inside: {n}|dedans : {n}|dentro: {n}|drin: {n}|dentro: {n}||里面：{n}|안에: {n}|中身：{n}|внутри: {n}|w środku: {n}"), H_FREE = L6("gratis|free|gratuit|grátis|gratis|gratis||免费|무료|無料|бесплатно|za darmo");
  const SAVED_PERK = "¡La red te salva (una vez por acto): no pierdes provisión! |The safety net catches you (once per act): no provision lost! |Le filet te rattrape (une fois par acte) : aucune provision perdue ! |A rede te segura (uma vez por ato): nenhuma provisão perdida! |Das Sicherheitsnetz fängt dich auf (einmal pro Akt): kein Proviant verloren! |La rete ti salva (una volta per atto): nessuna provvista persa! ||安全网接住了你（每幕一次）：没有损失补给！|안전망이 받아 줬어요 (막마다 한 번): 식량을 잃지 않았어요! |ネットが受け止めた（各幕に1回）：プロビジョンは失わない！|Сетка тебя поймала (раз за акт): запас не потерян! |Siatka cię łapie (raz na akt): nie tracisz zapasu! ";   // tanda 9: la Red de seguridad (antes, el Seguro)
  const SAVED_SUP = "¡El Seguro de ronda te cubre: no pierdes provisión! |Round insurance covers you: no provision lost! |L'Assurance de manche te couvre : aucune provision perdue ! |O Seguro de rodada te cobre: nenhuma provisão perdida! |Die Rundenversicherung springt ein: kein Proviant verloren! |L'Assicurazione del round ti copre: nessuna provvista persa! ||回合保险为你兜底：没有损失补给！ |라운드 보험이 지켜 줬습니다: 식량 손실 없음! |ラウンド保険でカバー：プロビジョンは失われなかった！ |Страховка раунда покрыла провал: ни один запас не потерян! |Ubezpieczenie rundy cię kryje: żaden zapas nie przepada! ";
  /* el primer clic en "Abrir el cofre" no lo abre: el cofre (la medalla) tiembla y el crupier confiesa que lo esta sujetando; el segundo ya lo abre */
  function stuckChest() {
    const m = document.querySelector(".v-medal"), b = $("nlBtn"), S = C().S, reduced = (S && S.reduce) || matchMedia("(prefers-reduced-motion: reduce)").matches;
    A.sfx.deny();
    if (!reduced) [m, b].forEach(e => e && e.animate([{ transform: "none" }, { transform: "translateX(-6px) rotate(-4deg)" }, { transform: "translateX(5px) rotate(3deg)" }, { transform: "translateX(-3px) rotate(-2deg)" }, { transform: "none" }], { duration: 420, easing: "ease-out" }));
    if (A.dealer.chestStuck) A.dealer.chestStuck();
  }
  function afterVerdict(boss) { if (boss && run.act + 1 === 3 && !run.won) return winScreen(); nextStep(boss); }
  function nextStep(boss) {
    if (boss) { run.act++; run.round = 0; run.attempt = 0; const l0 = run.lives; perkList().forEach(p => p.actStart && p.actStart(run)); if (run.lives > l0) run.healAct = run.act; openShop(true); }   // healAct: Por cuenta de la casa se luce en la 1.a pregunta del acto
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
    const legDone = !!(run.legAct && run.legAct[run.act]);                // tanda 12 (S11): una legendaria por acto, venga de donde venga
    const bag = Object.keys(R).filter(id => (!owned(id) || R[id].amulet) && (chest ? !(R[id].r === 3 && legDone) : R[id].r < 3) && useful(id));   // un amuleto que ya llevas sale como recarga (+2 cargas)
    const cur = chalFor(roundNo()).list, up = new Set(); cur.forEach(c => (A.CHAL[c.id].counters || []).forEach(id => up.add(id)));
    const reach = {}; bag.forEach(id => { if (ctrOf(id)) reach[id] = helpRounds(id).length; });
    const wt = id => { const r = R[id].r; return (chest ? [0, 50, 40, 10][r] : [60, 30 + run.act * 4, 10 + run.act * 5][r]) * (up.has(id) ? 2.6 : 1) * (reach[id] ? 0.7 + 0.3 * Math.min(4, reach[id]) : 1) * (R[id].amulet && run.act === 0 ? 0.5 : 1) * (R[id].ventaja && !perkList().some(p => p.ventaja) ? 2 : 1); };   // sin Ventaja, pesan el doble   // acto I: los amuletos pesan la mitad (que no llenen la mochila)
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
      if (!chest && roll < 0.16) {                                     // tanda 9 (S9): primero la franja (55 / 35 / 10) y luego una herramienta de esa franja
        const tk = Object.keys(TOOLS).filter(id => canTool(id) && !out.some(o => o.id === id)), tiers = [0, 1, 2].filter(t => tk.some(id => TOOLS[id].r === t)), TW = [55, 35, 10];
        if (tiers.length) { let x = rr() * tiers.reduce((n, t) => n + TW[t], 0), tier = tiers[tiers.length - 1]; for (const t of tiers) { x -= TW[t]; if (x <= 0) { tier = t; break; } } out.push({ k: "tool", id: rr.pick(tk.filter(id => TOOLS[id].r === tier)) }); continue; }
      }
      if (!chest && roll > 0.93 && run.lives < run.maxLives && !out.some(o => o.k === "life")) { out.push({ k: "life" }); continue; }
      if (!bag.length) break;
      out.push({ k: "perk", id: draw() });
    }
    if (!chest && run.act >= 1 && !legDone && !run.inf) {                 // tanda 12 (S11): la vitrina (no cambia con Cambiar cartas: sale de la semilla del acto)
      const legs = Object.keys(R).filter(id => R[id].r === 3 && !owned(id) && useful(id)).sort();
      if (legs.length) out.push({ k: "perk", id: A.rng(`${run.seed}:vit:${run.act}`).pick(legs), vit: true });
    }
    return out;
  }
  function openShop(chest) {
    const S = C().S; S.phase = "shop"; A.adv.hideBars(); clearTimers(); A.chal.end(); A.dealer.release(); run.phase = chest ? "chest" : "shop";
    const key = `${roundNo()}:${run.attempt || 0}:${run.shopN}:${chest}`, visit = `${roundNo()}:${run.attempt || 0}:${chest}`, newVisit = run.shopKey !== visit;
    if (newVisit) run.visitBuys = 0;
    if (!run.stock || run.stockKey !== key) { run.stock = offers(chest); run.stockKey = key; run.bought = []; if (run.shopKey !== visit) { run.shopKey = visit; run.rerolls = 0; run.freeUsed = 0; } }
    persist(); renderShop(chest);
    if (!chest && run.legAch) { const r0 = run; setTimeout(() => { if (run === r0) payLeg(r0); }, 900); }   // el logro de la legendaria del cofre: ya en la tienda, un poco despues de pintarla
    if (newVisit && A.dealer.campArrive) {                                            // el crupier se sienta a la mesa (js/dealer.js)
      const cf = chalFor(roundNo()), costs = (run.stock || []).map(s => (s.k === "life" ? lifePrice() : cardCost(s)));
      A.dealer.campArrive({ chest, coins: run.coins, n: cf.list.length, r: roundNo() + 1, boss: !!cf.boss && !chest, bossName: cf.combo ? A.tx(cf.combo.n) : "", retry: run.attempt > 0,
        newAct: run.round === 0 && run.act > 0 && !run.attempt, cheapest: costs.length ? Math.min(...costs) : 0 });
    }
  }
  /* "proxima ronda" del Campamento: el tema de la ronda (o el jefe) y cada truco en dos lineas: nombre y soborno arriba, lo que hace debajo.
     v0.35 (usuario): antes cada truco ocupaba tres lineas (el soborno debajo) y no decia de que tema era la ronda. En el jefe, su nombre en grande
     y en la linea pequena, entre "Jefe del acto" y el objetivo, el tema. Con el Ojo en el cielo, debajo, la ronda siguiente en una linea.
     v0.35: ya no dice que reliquia frena cada truco (ni las cartas contra que truco sirven): el jugador tiene que leer y atar cabos. */
  const nextHtml = () => {
    const r = roundNo(), rows = [r]; if (has("spy")) for (let k = 1; k <= 2 && r + k <= LAST; k++) rows.push(r + k);   // tanda 9: el Ojo en el cielo ve dos rondas mas   // tras la ronda 12 no hay mas trucos (antes el Ojo en el cielo ensenaba una "Ronda 1" que no existe)
    const dot = "<i>·</i>";
    const html = rows.map((rr, k) => {
      const cf = chalFor(rr), n = cf.list.length, done = cf.paid, main = k === 0, d = defAt(rr), TN = TOPIC_NAMES[d.topic], topic = A.tx(TN[Math.min(d.tier, TN.length - 1)]);
      const named = cf.boss && cf.combo, name = named ? A.tx(cf.combo.n) : topic;
      const kick = [main ? A.T("Próxima ronda", "Next round") : A.T("Después", "Then"), cf.boss ? A.T("Jefe del acto", "Act boss") : A.T("Ronda", "Round") + " " + ((rr % 4) + 1)].concat(named ? [topic] : []).join(dot);
      const badge = `<span class="nr-badge">${ic(cf.boss ? BOSS_IC : TOPIC_ICON[d.topic])}</span>`;
      const count = `<span class="nr-n">${n ? n + " " + (n === 1 ? A.T("reto", "challenge") : A.T("retos", "challenges")) : A.T("Sin retos", "No challenges")}</span>`;
      if (!main) return `<div class="nr far${cf.boss ? " boss" : ""}"><div class="nr-head">${badge}<div class="nr-ttl"><span class="nr-k">${kick}</span><b class="nr-name">${name}</b></div><div class="nr-chips">${cf.list.map(c => A.chal.chip(c, true)).join("")}</div>${count}</div></div>`;
      const shuffle = n ? `<button class="chipbtn nr-shuffle" id="chalReroll" type="button" data-tt="${A.T("Barajar: el crupier elige otros retos para la próxima ronda", "Reshuffle: the dealer picks other challenges for the next round")}">${ic("dice", "sm")}<span>${A.T("Barajar", "Reshuffle")}</span>${freeShuf() ? `<em class="nr-free">${ic("spyhole", "sm")}${A.tx(H_FREE)}</em>` : `<em>${CN()}${chalRerollCost()}</em>`}</button>` : "";
      const lis = cf.list.map(c => { const dd = A.CHAL[c.id];
        return `<li class="nr-row k-${dd.kind}"><span class="nr-ic">${ic(dd.ico)}</span><b class="nr-rn">${A.tx(dd.n)}${c.isNew ? ` <span class="ch-new">${A.tx(A.chal.NEW_TAG)}</span>` : ""} <i class="ch-lv">${"●".repeat(c.lv || 1)}</i></b>${c.sealed ? `<em class="nr-have nr-seal">${A.tx(c.sealBy === "pact" ? BT.pact : c.sealBy === "offer" ? BT.sold : BT.seal)}</em>` : ""}<button class="nr-buy${c.sealed ? " hidden" : ""}" type="button" data-r="${rr}" data-id="${c.id}" data-tt="${A.T("Sobornar al crupier: quita este reto de la próxima ronda. Cada soborno encarece los siguientes.", "Bribe the dealer: removes this challenge from the next round. Each bribe makes the next ones pricier.")}">${A.T("Sobornar", "Bribe")}<span class="nr-p">${CN()}${bribePrice(c, cf.boss)}</span></button><p>${A.tx(dd.d)}</p></li>`; }).join("")
        + done.map(id => `<li class="nr-row done"><span class="nr-ic">${ic(A.CHAL[id].ico)}</span><b class="nr-rn">${A.tx(A.CHAL[id].n)}</b><em class="nr-have">${A.T("Sobornado", "Bribed")}</em></li>`).join("")
        + (cf.nulled || []).map(id => `<li class="nr-row done"><span class="nr-ic">${ic(A.CHAL[id].ico)}</span><b class="nr-rn">${A.tx(A.CHAL[id].n)}</b><em class="nr-have">${A.tx(NULLED)}</em></li>`).join("");   // los que quita tu Comodin
      return `<div class="nr${cf.boss ? " boss" : ""}"><div class="nr-head">${badge}<div class="nr-ttl"><span class="nr-k">${kick}${dot}${A.T("Objetivo", "Target")} ${baseTarget() > target() && rr === roundNo() ? `<s class="of-was">${A.fmt(baseTarget())}</s> ` : ""}<b>${A.fmt(target())}</b></span><b class="nr-name">${name}</b></div>${count}${shuffle}</div>${lis ? `<ul class="nr-list n${Math.min(6, n + done.length)}">${lis}</ul>` : `<p class="nr-clean">${A.T("Ronda limpia: solo tú y el mapa.", "A clean round: just you and the map.")}</p>`}</div>`;
    }).join("");
    return `<div class="tb-next">${html}</div>`;
  };
  /* v0.3.1: sobornar es caro y el crupier sube la tarifa. Base: 3 + 2 por nivel del truco (+1 si es de mapa), el doble en el jefe, y sube con el acto
     y la ascension como todo lo demas. Cada soborno pagado en la expedicion encarece los siguientes un 50 % del precio base (barajar no lo reinicia).
     Con dev/bot.js (bribe, sin cartas), quien solo sobornaba quitaba el 58-67 % de los trucos (todos los del acto I); ahora el 17-21 %:
     los trucos son el juego, y la contra comprada a tiempo sale mucho mas a cuenta */
  const bribePrice = (c, boss) => { const d = A.CHAL[c.id]; return Math.max(2, Math.round((3 + 2 * (c.lv || 1) + (d.kind === "map" ? 1 : 0)) * (boss ? 2 : 1) * (1 + 0.5 * (run.bribeN || 0)) * ascFx(run.asc).price * inflation())); };
  const freeShuf = () => has("freeShuffle") && !chalFor(roundNo()).boss && run.freeShuf !== run.shopKey;   // tanda 9: una vez por visita con el Ojo en el cielo, salvo jefes
  const chalRerollCost = () => (freeShuf() ? 0 : price(4 + 2 * ((run.salt && run.salt[roundNo()]) || 0)) * (chalFor(roundNo()).boss ? 2 : 1));   // tanda 9 (S9): como el soborno, el doble en el jefe
  function bribe(id) {
    const r = roundNo(), cf = chalFor(r), c = cf.list.find(x => x.id === id); if (!c) return; const cost = bribePrice(c, cf.boss);
    if (run.coins < cost) { A.sfx.deny(); flash(A.T("No te alcanzan los doblones.", "Not enough doubloons.")); return; }
    run.coins -= cost; run.bribeN = (run.bribeN || 0) + 1; run.bribed = run.bribed || {}; (run.bribed[r] = run.bribed[r] || []).push(id); A.sfx.buy(); persist(); A.ach.emit("adv", { kind: "bribe" });
    A.dealer.enable(true); A.dealer.say(A.dealer.line("bribe"), { mood: "angry", hold: 1800 }); renderShop(run.phase === "chest");
  }
  function rerollChal() {
    const r = roundNo(), cost = chalRerollCost(); if (run.coins < cost) { A.sfx.deny(); flash(A.T("No te alcanzan los doblones.", "Not enough doubloons.")); return; }
    if (freeShuf()) { run.freeShuf = run.shopKey; A.adv.flash("spyhole", 0, A.tx(H_FREE)); }
    run.coins -= cost; run.salt = run.salt || {}; run.salt[r] = (run.salt[r] || 0) + 1; A.sfx.reroll(); persist();   // los sobornos pagados se quedan: si el truco vuelve a salir, sigue fuera
    A.dealer.enable(true); A.dealer.say(A.dealer.line("reroll"), { mood: "laugh", hold: 1800 }); renderShop(run.phase === "chest");
  }
  const routeHtml = () => A.adv.road({ size: "bar", route: run.route, cur: roundNo() });   // siempre las 12 rondas y el infinito (antes, una ventana de 12 que se corria)
  const rerollCost = () => { const sx = shopCtx(); return run.freeUsed < sx.freeReroll ? 0 : price(3 + run.rerolls); };
  /* precio de una carta de la tienda: la de la revancha (s.fix) va a mitad de precio */
  const cardCost = s => { const full = s.vit ? price(18) : price(s.k === "perk" ? A.RELICS[s.id].cost : TOOLS[s.id].cost); return s.fix ? Math.max(1, Math.ceil(full / 2)) : full; };   // la vitrina: 23 en el acto II y 27 en el III (A0)
  const costHtml = s => (s.vit ? CN() + cardCost(s) : s.fix ? `${CN()}<s class="of-was">${price(s.k === "perk" ? A.RELICS[s.id].cost : TOOLS[s.id].cost)}</s>${cardCost(s)}` : CN() + cardCost(s));
  /* ---------------- PAN DE ORO (v0.51): la carta legendaria ----------------
     El marco de oro con bisel de pixel, la placa de laton, el terciopelo y el halo van en css/campamento.css. Aqui, el brillo de oro que la barre
     a saltos de pixel (como la clase Holo del prototipo aprobado): un lienzo pequeno por carta, 1 pixel de arte = 3 px del lienzo de 1280x720
     redondeado al pixel real de la pantalla (escala entera), pintado a ~20 fps SOLO mientras pasa el brillo (0,9 s de cada 3,6) y la carta sigue
     en pantalla (IntersectionObserver: la mesa del Campamento sigue en el documento durante la ronda, con #layer oculto); el resto del tiempo
     duerme. El tamano llega por ResizeObserver en pixeles reales: nada se mide por fotograma. Con "reducir movimiento", un brillo quieto (salvo
     en la secuencia del cofre) */
  const GLINT = `<span class="lg-halo"></span><span class="lg-clip"><canvas></canvas></span>`;
  const RMQ = matchMedia("(prefers-reduced-motion: reduce)");           // una sola consulta: leer .matches no cuesta nada
  const Gold = (() => {
    const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], WH = [255, 255, 255], G0 = [255, 246, 200], G1 = [255, 217, 90], PER = 3.6, DUR = 0.9;
    const live = new Set(); let raf = 0, tm = 0, last = 0;
    const still = () => { const S = C().S; return !!(S && S.reduce) || RMQ.matches; };
    const wake = () => { clearTimeout(tm); tm = 0; if (!raf) raf = requestAnimationFrame(frame); };
    const ro = window.ResizeObserver ? new ResizeObserver(es => { es.forEach(e => e.target._gold && e.target._gold.note(e)); wake(); }) : null;
    /* se ve o no (display:none de un padre o fuera de la pantalla): lo dice el navegador al cambiar, sin medir nada */
    const io = window.IntersectionObserver ? new IntersectionObserver(es => { es.forEach(e => { if (e.target._gold) e.target._gold.vis = e.isIntersecting; }); wake(); }) : null;
    class Glint {
      constructor(cv) { this.cv = cv; this.clip = cv.parentNode; this.el = this.clip.parentNode; this.ctx = this.im = null; this.t0 = Math.random() * PER; this.W = this.H = this.P = 0; this.pend = null; this.c = null; this.at0 = null; this.dur = DUR; this.live = false; this.vis = !io; this.clip._gold = this; }
      /* el aviso del ResizeObserver solo se apunta: el lienzo cambia de tamano en el fotograma siguiente (no en el de pintar la mesa, el mas cargado) */
      note(e) {
        const b = e.contentBoxSize && e.contentBoxSize[0], d = e.devicePixelContentBoxSize && e.devicePixelContentBoxSize[0];
        const cw = b ? b.inlineSize : e.contentRect.width, ch = b ? b.blockSize : e.contentRect.height;
        if (cw && ch) this.pend = [cw, ch, d ? d.inlineSize : 0, d ? d.blockSize : 0];
      }
      /* lienzo a escala entera de pixel real: P pixeles reales por pixel de arte (3 en 1280x720; 5 a 1,5x) */
      size() {
        const [cw, ch, dw, dh] = this.pend; this.pend = null;
        const r = dw ? dw / cw : (this.el.currentCSSZoom || 1) * (devicePixelRatio || 1), P = Math.max(2, Math.round(3 * r + 0.01));   // +0,01: a 1,5x (4,5) siempre 5, igual en la carta y en la mochila
        const W = Math.ceil((dw || cw * r) / P), H = Math.ceil((dh || ch * r) / P);
        if (W === this.W && H === this.H && P === this.P) return;
        this.W = W; this.H = H; this.P = P; this.cv.width = W; this.cv.height = H; this.cv.style.width = (W * P) / r + "px"; this.cv.style.height = (H * P) / r + "px";
        this.im = null; this.c = null;                                   // cambiar el tamano deja el lienzo en blanco; el contexto y su imagen, al primer brillo
      }
      /* el brillo ahora: la diagonal x + y = c (o null si no pasa). sweep() lo lanza ya, durante dur segundos */
      at(t) {
        let ts, dur = DUR;
        if (this.at0 != null) { ts = t - this.at0; dur = this.dur; if (ts > dur) { this.at0 = null; return null; } } else ts = (t + this.t0) % PER;
        return ts >= 0 && ts < dur ? Math.round(-14 + ((this.W + this.H + 28) * ts) / dur) : null;
      }
      wait(t) { return PER - ((t + this.t0) % PER); }
      sweep(dur) { this.at0 = performance.now() / 1000; this.dur = dur; wake(); }
      /* franja blanca de 3 pixeles, filos crema y un tramado de oro a los lados (Bayer 4x4): solo se recorre la franja */
      paint(c) {
        if (c === this.c || !this.W) return; this.c = c;
        if (!this.im) { this.ctx = this.ctx || this.cv.getContext("2d"); this.im = this.ctx.createImageData(this.W, this.H); }
        const W = this.W, H = this.H, d = this.im.data; d.fill(0);
        if (c != null) for (let y = 0; y < H; y++) for (let x = Math.max(0, c - 6 - y), x1 = Math.min(W - 1, c + 6 - y); x <= x1; x++) {
          const dd = x + y - c, ad = dd < 0 ? -dd : dd, col = ad <= 1 ? WH : ad === 2 || ad === 4 ? G0 : BAY[(y & 3) * 4 + (x & 3)] < 6 ? G1 : null;
          if (!col) continue; const i = (y * W + x) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = ad <= 1 ? 170 : ad === 2 ? 130 : ad === 4 ? 110 : 85;
        }
        this.ctx.putImageData(this.im, 0, 0);
      }
    }
    function frame(now) {
      raf = 0; const t = now / 1000, rm = still(), due = now - last >= 30; let act = false, soon = Infinity;
      for (const g of live) {
        if (!g.el.isConnected) { live.delete(g); if (ro) ro.unobserve(g.clip); if (io) io.unobserve(g.clip); continue; }
        if (!g.vis) continue;                                              // no se ve: ni pinta ni cuenta para despertar el bucle (con todas ocultas, duerme)
        if (g.pend) g.size();
        if (!g.W) continue;
        if (rm && !g.live) { g.paint(Math.round((g.W + g.H) * 0.32)); continue; }       // quieto: un reflejo fijo
        const c = g.at(t);
        if (c != null || g.c != null || g.at0 != null) act = true; else soon = Math.min(soon, g.wait(t));
        if (due) g.paint(c);
      }
      if (due) last = now;
      if (act) tm = setTimeout(wake, 40); else if (soon < Infinity) tm = setTimeout(wake, Math.max(16, soon * 1000 - 24));   // ~20 fps: un rAF por pintada, no 60
    }
    return {
      /* tras pintar la mesa: un brillo por lienzo nuevo (el tamano llega con el primer aviso del ResizeObserver, ya maquetado) */
      mount: root => { if (!ro) return; root.querySelectorAll(".lg-clip > canvas").forEach(cv => { if (cv.parentNode._gold) return; const g = new Glint(cv); live.add(g); ro.observe(g.clip, { box: "device-pixel-content-box" }); if (io) io.observe(g.clip); }); },
      of: el => { const c = el && el.querySelector(".lg-clip"); return (c && c._gold) || null; },
    };
  })();
  function cardHtml(s, i, chest) {
    const bought = run.bought.includes(i);
    if (s.k === "perk") {
      const p = A.RELICS[s.id];                                           // la carta solo cuenta lo que hace: contra que truco sirve lo descubre el jugador leyendo
      return `<div class="offer pc r${p.r}${s.vit ? " vit" : ""}${bought ? " sold" : ""}" data-ix="${i}" data-suit="${suitRed(p.suit) ? "red" : "blk"}">${p.r === 3 && !bought ? GLINT : ""}${ixs(p.cost, p.suit)}<span class="of-r">${s.vit ? A.tx(VIT_TAG) + " · " : ""}${p.amulet ? A.tx(AMU_TAG) + (owned(s.id) ? " · " + A.tx(AMU_RE) : "") : p.ventaja ? A.tx(VTG_TAG) + (perkList().some(q => q.ventaja && q.id !== s.id) ? " · " + A.tx(VTG_SWAP) : "") : A.tx(R_NAMES[p.r])}${run.perks.length >= maxPerks() && !bought && !(p.amulet && owned(s.id)) && !(p.ventaja && perkList().some(q => q.ventaja && q.id !== s.id)) ? " · " + A.tx(SWAP_FOR) : ""}</span><div class="of-ico felt">${ic(p.ico)}</div><b class="of-n">${A.tx(p.n)}</b><p>${A.tx(p.d)}</p><button class="buy${chest ? " sq-fit" : ""}" ${bought ? "disabled" : ""}>${bought ? A.T("Comprado", "Owned") : chest ? A.T("Elegir gratis", "Take for free") : costHtml(s)}</button></div>`;   // sq-fit: "Elegir gratis" en una linea en todos los idiomas
    }
    if (s.k === "tool") {
      const t = TOOLS[s.id], have = run.tools[s.id];
      return `<div class="offer pc otool r${t.r}${bought ? " sold" : ""}" data-ix="${i}" data-suit="blk">${ixs("A", "s_palm")}<span class="of-r">${A.T("Herramienta", "Tool")}</span><div class="of-ico felt">${ic(t.ico)}</div><b class="of-n">${A.tx(t.n)}${have ? ` <em>+1 ${A.T("carga", "charge")}</em>` : ""}</b><p>${A.tx(t.d)}</p><button class="buy" ${bought ? "disabled" : ""}>${bought ? A.T("Comprado", "Owned") : costHtml(s)}</button></div>`;
    }
    return `<div class="offer pc life${bought ? " sold" : ""}" data-ix="${i}" data-suit="red">${ixs("♥", "heart")}<span class="of-r">${A.T("Provisión", "Provision")}</span><div class="of-ico felt">${ic("heart")}</div><b class="of-n">+1 ${A.T("provisión", "provision")}</b><p>${A.tf("Recupera una provisión (máx. {n}).", "Restore a provision (max {n}).", { n: run.maxLives })}</p><button class="buy" ${bought || run.lives >= run.maxLives ? "disabled" : ""}>${CN()}${lifePrice()}</button></div>`;
  }
  /* v0.35 (usuario): Campamento premium. La mochila son cartas pequenas con el color de su rareza: un clic levanta la reliquia y ensena
     "Vender" encima; el segundo clic, en ese boton, la vende (antes un solo clic la vendia sin preguntar). Tambien en el cofre del jefe.
     El boton de "estoy listo" lleva la ficha de la ronda que viene (la misma de su presentacion) y su tema. */
  let relicSel = null, swapIx = null;                                   // reliquia levantada en la mochila; carta que se va a cambiar por una de ella (tanda 9)
  const SWAP_FOR = L6("cambiar por…|swap for…|échanger contre…|trocar por…|tauschen gegen…|scambia con…||换成…|교체하기…|入れ替える…|обменять на…|zamień na…"), SWAP_PICK = L6("Elige qué reliquia dejas.|Pick which relic to leave.|Choisis la relique que tu laisses.|Escolha qual relíquia deixar.|Wähl, welches Relikt du abgibst.|Scegli quale reliquia lasciare.||选一件要留下的遗物。|내려놓을 유물을 고르세요.|手放す遺物を選んで。|Выбери, какую реликвию оставить.|Wybierz, który relikt zostawić.");
  /* vende la reliquia de la mochila y compra la carta elegida (si con lo que te dan te alcanza) */
  function swapFor(ix, id, chest) {
    const s = run.stock[ix]; swapIx = null; if (!s) return renderShop(chest); const c = chest ? 0 : cardCost(s);
    if (run.coins + sellValue(id) < c) { A.sfx.deny(); return renderShop(chest); }
    sell(id, chest); const el = document.querySelector(`#dlg .offer[data-ix="${ix}"]`); if (el) buy(el, chest);
  }
  const SELL = "Vender|Sell|Vendre|Vender|Verkaufen|Vendi||出售|판매|売る|Продать|Sprzedaj";
  const TAKE = "Te llevas|You take|Tu prends|Você leva|Du bekommst|Prendi||你获得|획득|もらう|Получишь|Dostajesz";
  /* la reliquia en la mochila: carta pequena con el color de su rareza (la legendaria, con su marco de oro y su brillo).
     face: el dibujo como fondo y sin boton de vender (la que aparece al final de la secuencia: ninguna imagen nueva, que haria reajustar la pantalla) */
  const relicHtml = (id, face) => { const p = A.RELICS[id];
    return `<div class="tr-card tr-relic r${p.r}${p.ventaja ? " vtg" : ""}${relicSel === id ? " sel" : ""}" data-relic="${id}"><button class="tr-face inv-perk" type="button" ${A.kitTip("perk", id)}>${p.r === 3 ? GLINT : ""}${face || ic(id)}${p.amulet ? pips((run.amu || {})[id] || 0, "tr-pips") : ""}${id === "hoard" && run.hucha ? `<b class="hc-n">${run.hucha}</b>` : ""}</button>${face ? "" : id === "pact" && run.perks.length > 5 ? `<button class="tr-sell off" type="button" disabled>${A.tx(PACT_FIRST)}</button>` : `<button class="tr-sell" type="button">${A.pick6(SELL)}<span>${CN()}${sellValue(id)}</span></button>`}</div>`; };
  function renderShop(chest) {
    legOn = 0; swapIx = null;                                            // mesa nueva: si la legendaria se estaba luciendo en la anterior, esa secuencia ya no sigue
    const slots = maxPerks(), info = actInfo(run.act), rc = rerollCost(), r = roundNo(), cf = chalFor(r);
    const cards = run.stock.map((s, i) => cardHtml(s, i, chest)).join("") || `<p class="tb-empty">${A.T("No quedan cartas: ¡sigue adelante!", "No cards left: move on!")}</p>`;
    if (relicSel && !run.perks.includes(relicSel)) relicSel = null;
    /* la mochila no avisa de que una reliquia ya no sirve: saber cuando venderla tambien es cosa del jugador */
    const relics = Array.from({ length: slots }, (_, k) => (run.perks[k] ? relicHtml(run.perks[k]) : `<span class="tr-slot${k >= 5 ? " pact" : ""}"></span>`)).join("");   // el hueco del Pacto, con su lacre
    const tools = Object.keys(run.tools).map(id => `<span class="tr-card tr-tool" ${A.kitTip("tool", id)}><span class="tr-face">${ic(TOOLS[id].ico)}<span class="tr-pips">${Array.from({ length: toolMax(id) }, () => "<i></i>").join("")}</span></span></span>`).join("") || `<i class="tr-none">${A.T("Ninguna", "None")}</i>`;
    /* fuera la frase de siempre ("Tres cartas sobre la mesa..."): solo los avisos que cambian algo (revancha, cofre, mochila llena) */
    const retryNote = !chest && run.stock.some((s, i) => s.fix && !run.bought.includes(i));
    const note = chest ? (run.perks.length >= slots ? A.T("Mochila llena: vende una reliquia.", "Pack full: sell a relic.") : A.T("Elige UNA reliquia gratis. Aquí pueden salir legendarias.", "Pick ONE relic for free. Legendaries can show up here.")) : retryNote ? A.tx(ETX.retry) : "";
    /* antes del jefe, el crupier te reescribe el boton (funciona igual) */
    const doom = !chest && !!cf.boss, DOOM = A.pick6("Ir al matadero|To the slaughter|À l'abattoir|Pro matadouro|Zur Schlachtbank|Al macello||去送死|도살장으로|処刑台へ|На убой|Na rzeź");
    const nd = defAt(r), TN = TOPIC_NAMES[nd.topic], topic = A.tx(TN[Math.min(nd.tier, TN.length - 1)]);
    /* letra de las cartas segun lo llena que va la mesa (retos de la proxima ronda, Ojo en el cielo, avisos): se decide aqui, sin medir nada
       (con container queries cada maquetacion del Campamento costaba el doble y la primera apertura perdia un fotograma) */
    const full = (cf.list.length + cf.paid.length >= 3 ? 1 : 0) + (has("spy") ? Math.min(2, LAST - r) : 0) + (note ? 1 : 0) - (chest ? 1 : 0);   // el cofre no lleva suministros: le sobra sitio
    const dense = Math.max(0, Math.min(2, full + (full > 0 && /^(ru|pl)$/.test(A.lang) ? 1 : 0)));   // ruso y polaco, los textos mas largos de las cartas
    const chip = chest ? ic("chest") : A.blind(cf.boss ? "boss" : run.round === 0 ? "small" : "big", cf.boss ? BOSS_IC : run.round === 0 ? "s_pin" : "s_compass");
    const goB = chest ? A.T("Continuar sin elegir", "Continue without picking") : doom ? DOOM : A.T("Siguiente ronda", "Next round");
    const goI = chest ? `${A.pick6(TAKE)} ${CN()}+${gain(chestSkip())}` : cf.boss ? A.T("Jefe del acto", "Act boss") + (cf.combo ? " · " + A.tx(cf.combo.n) : "") : A.T("Ronda", "Round") + " " + (run.round + 1) + " · " + topic;
    C().dialog(`<div class="table mesa d${dense}${chest ? " chest" : ""}${run.stock.length > 3 ? " many" : ""}">
      <header class="tb-head"><div class="tb-title"><span class="tag">${A.tx(info.n)} · ${actSub(info)}</span><h2>${chest ? A.T("Cofre del jefe", "Boss chest") : A.T("Campamento", "Camp")}</h2></div>
        ${routeHtml()}<div class="tb-right"><button class="chipbtn tb-menu" id="shopMenu" type="button">${A.icon("u_pause", "sm")}<span>${A.T("Menú", "Menu")}</span></button><div class="tb-coins" id="shopCoins">${CN()}<b>${run.coins}</b></div></div></header>
      ${nextHtml()}
      ${chest ? "" : supHtml()}
      <section class="tb-shop">${note ? `<p class="tb-note">${note}</p>` : ""}<section class="offers">${cards}</section>
        ${chest ? "" : `<div class="tb-actions"><button class="chipbtn" id="rerollBtn" type="button">${ic("dice", "sm")}<span>${A.T("Cambiar cartas", "New cards")}</span><em>${rc ? CN() + rc : A.T("gratis", "free")}</em></button></div>`}</section>
      <footer class="tb-tray">
        <div class="tray-col tr-relics"><h4>${A.T("Reliquias", "Relics")} <b>${run.perks.length}/${slots}</b></h4><div class="tray-row">${relics}</div></div>
        <div class="tray-col tr-tools"><h4>${A.T("Herramientas", "Tools")}</h4><div class="tray-row">${tools}</div></div>
        <div class="tray-col tr-prov"><h4>${A.T("Provisiones", "Provisions")} <b>${run.lives}/${run.maxLives}</b></h4><div class="tray-row hearts">${hearts()}</div></div>
        <button class="go2${doom ? " doom" : ""}${chest ? " skip" : ""}" id="goRound" type="button" data-primary><span class="go2-chip">${chip}</span><span class="go2-t"><b>${goB}</b><i>${goI}</i></span><span class="go2-ar">${A.icon("u_next", "sm")}</span></button></footer></div>`, "tablewrap");
    Gold.mount($("dlg"));                                                // el brillo de oro de las legendarias (mesa y mochila)
    document.querySelectorAll(".offer").forEach((el, i) => { const btn = el.querySelector(".buy"); if (btn) btn.onclick = () => buy(el, chest); if (!chest) el.addEventListener("pointerenter", e => { if (e.pointerType === "mouse" && A.dealer.campHover) A.dealer.campHover(i); }); });
    /* la mochila: un clic levanta la reliquia y ensena su boton de vender; otro clic en ella (o fuera) la baja. Tambien en el cofre del jefe:
       con la mochila llena, vendes una y eliges la del cofre gratis */
    const lift = id => { relicSel = id; document.querySelectorAll("#dlg .tr-relic").forEach(x => x.classList.toggle("sel", x.dataset.relic === relicSel)); };
    document.querySelectorAll("#dlg .tr-relic").forEach(c => { const id = c.dataset.relic;
      c.querySelector(".tr-face").onclick = e => { e.stopPropagation(); if (swapIx != null) return swapFor(swapIx, id, chest); lift(relicSel === id ? null : id); A.sfx.card(); };
      c.querySelector(".tr-sell").onclick = e => { e.stopPropagation(); relicSel = null; sell(id, chest); }; });
    const tb = document.querySelector("#dlg .table.mesa"); if (tb) tb.addEventListener("click", e => { if (relicSel) lift(null); if (swapIx != null && !e.target.closest(".offer")) { swapIx = null; document.querySelectorAll("#dlg .swap-pick, #dlg .swap-src").forEach(x => x.classList.remove("swap-pick", "swap-src")); } });
    if ($("rerollBtn")) $("rerollBtn").onclick = () => {
      const c = rerollCost(); if (run.coins < c) { A.sfx.deny(); shake($("rerollBtn")); return; } run.coins -= c; if (c === 0) run.freeUsed++; else run.rerolls++; run.shopN++; run.stock = null; A.sfx.reroll();
      if (c > 0 && !run.shellDone && (run.paidRerolls = (run.paidRerolls || 0) + 1) >= 2) { run.shellDone = true; persist(); if (A.dealer.campShell) A.dealer.campShell(); return shellCards(() => openShop(false)); }   // el trile: una vez por expedicion
      openShop(false);
    };
    $("shopMenu").onclick = () => C().runMenu();
    document.querySelectorAll("#dlg .nr-buy").forEach(b => (b.onclick = () => bribe(b.dataset.id)));
    if ($("chalReroll")) $("chalReroll").onclick = rerollChal;
    if (!chest) { wireSup(); wireBet(); }
    $("goRound").onclick = () => {
      if (legOn) return;                                                 // la legendaria del cofre aun se esta luciendo (Intro pulsa este boton)
      if (!chest && !run.visitBuys && !run.skipSaid && run.coins >= 8 && Math.random() < 0.5 && A.dealer.campSkip) { run.skipSaid = true; A.dealer.campSkip(run.coins); }   // te vas sin comprar nada (una vez por expedicion)
      run.stock = null; relicSel = null;
      if (chest) { const k = gain(chestSkip()); run.coins += k; run.stats.coinsEarned += k; A.sfx.sell(); }   // dejar el cofre sin abrir tambien se cobra (con la mochila llena, el cofre no es papel mojado)
      persist(); chest ? openShop(false) : startRound();
    };
    A.ach.emit("adv", { kind: "hold", coins: run.coins, perks: run.perks.length });
    if (A.tour) A.tour.maybe("camp");
  }
  /* Suministros de la proxima ronda (se gastan cada ronda: el dinero siempre tiene en que invertirse) */
  /* ---------------- tanda 11: APUESTAS de la Barra (una por visita; aparecen tras vencer a tu primer jefe; en el Reto diario, para todos) ----------------
     Antes de R4 y R8, Doble o nada: te juegas TODOS tus doblones, el jefe trae un reto mas; vencerlo a la primera los dobla (+40 como mucho) y si no,
     los pierdes. Antes de R12, La apuesta final: el jefe trae 2 retos mas; vencerlo a la primera da +2 provisiones para el modo infinito y perder no
     cuesta nada. En las demas visitas, Rojo o negro: tirar cuesta poco y, si aciertas, la proxima ronda paga un 50 % mas y empiezas en racha.
     Los retos de las apuestas van SELLADOS (ni el Comodin ni el soborno los quitan): de los que ya has visto, de una familia que no esta, a nivel 3 */
  const VIT_TAG = L6("Vitrina|Showcase|Vitrine|Vitrine|Vitrine|Vetrina||橱窗|진열장|ショーケース|Витрина|Gablota");
  const PACT_FIRST = L6("Vende antes otra|Sell another first|Vends-en une autre d'abord|Venda outra antes|Verkauf zuerst ein anderes|Vendi prima un'altra||先卖掉另一件|다른 걸 먼저 파세요|先に別のを売って|Сначала продай другую|Najpierw sprzedaj inny");
  const BETS = { offer: { n: L6("Oferta de la casa|House offer|Offre de la maison|Oferta da casa|Angebot des Hauses|Offerta della casa||赌场的报价|하우스의 제안|ハウスの申し出|Предложение заведения|Oferta kasyna"), d: L6("Elige cuántos retos de más aceptas en la próxima ronda (de 1 a 3): cobras al momento y entran sellados, a nivel 3.|Choose how many extra challenges you accept next round (1 to 3): you get paid at once and they come in sealed, at level 3.|Choisis combien de défis en plus tu acceptes à la prochaine manche (de 1 à 3) : tu es payé tout de suite et ils arrivent scellés, au niveau 3.|Escolha quantos desafios a mais aceita na próxima rodada (de 1 a 3): recebe na hora e eles entram selados, no nível 3.|Wähl, wie viele zusätzliche Herausforderungen du nächste Runde annimmst (1 bis 3): Du kassierst sofort, und sie kommen versiegelt auf Stufe 3.|Scegli quante sfide in più accetti nel prossimo round (da 1 a 3): incassi subito ed entrano sigillate, al livello 3.||选择下一轮多接受几个挑战（1 到 3 个）：立刻拿钱，挑战以 3 级封印加入。|다음 라운드에 받을 추가 도전 수를 고르세요 (1~3): 즉시 돈을 받고, 도전은 3단계로 봉인되어 들어옵니다.|次のラウンドで追加のチャレンジをいくつ受けるか選ぶ（1〜3）：すぐに支払われ、レベル3で封印されて入る。|Выбери, сколько лишних испытаний примешь в следующем раунде (от 1 до 3): плата сразу, а они входят запечатанными, на уровне 3.|Wybierz, ile dodatkowych wyzwań przyjmiesz w następnej rundzie (od 1 do 3): płacę od razu, a wchodzą zapieczętowane, na poziomie 3."), s: L6("Te pago por cada reto de más que aceptes en la próxima ronda.|I'll pay you for each extra challenge you accept next round.|Je te paie pour chaque défi en plus que tu acceptes à la prochaine manche.|Eu te pago por cada desafio a mais que aceitar na próxima rodada.|Ich zahle dir für jede zusätzliche Herausforderung, die du nächste Runde annimmst.|Ti pago per ogni sfida in più che accetti nel prossimo round.||下一轮每多接受一个挑战，我就付你钱。|다음 라운드에 도전을 하나 더 받을 때마다 돈을 주지.|次のラウンドで追加のチャレンジを受けるごとに払おう。|Плачу за каждое лишнее испытание, которое примешь в следующем раунде.|Płacę za każde dodatkowe wyzwanie, które przyjmiesz w następnej rundzie."), ico: "bet_offer" }, double: { n: L6("Doble o nada|Double or nothing|Quitte ou double|Dobro ou nada|Doppelt oder nichts|Lascia o raddoppia||加倍或归零|더블 오어 낫싱|ダブル・オア・ナッシング|Удвоить или потерять|Podwójnie albo nic"), d: L6("Te juegas todos tus doblones. El jefe trae un reto más: si lo vences a la primera, los doblas (+40 como mucho); si no, los pierdes.|You stake all your doubloons. The boss brings one more challenge: beat it on the first try and you double them (+40 at most); otherwise you lose them.|Tu mises tous tes doublons. Le boss apporte un défi de plus : bats-le du premier coup et tu les doubles (+40 maximum) ; sinon, tu les perds.|Você aposta todos os seus dobrões. O chefe traz mais um desafio: vença de primeira e você os dobra (+40 no máximo); senão, perde tudo.|Du setzt alle deine Dublonen. Der Boss bringt eine Herausforderung mehr: Besiegst du ihn im ersten Versuch, verdoppelst du sie (höchstens +40), sonst verlierst du sie.|Punti tutti i tuoi dobloni. Il boss porta una sfida in più: battilo al primo colpo e li raddoppi (+40 al massimo); altrimenti li perdi.||押上你所有的金币。首领多带一个挑战：一次击败它，金币翻倍（最多 +40）；否则全输光。|도블론을 전부 겁니다. 보스가 도전을 하나 더 가져옵니다: 한 번에 이기면 두 배 (최대 +40), 아니면 모두 잃습니다.|ダブロンを全部賭ける。ボスはチャレンジを1つ追加してくる。一発で倒せば倍（最大+40）、だめなら全部失う。|Ставишь все дублоны. Босс приносит ещё одно испытание: победишь с первого раза — удвоишь (максимум +40), иначе всё потеряешь.|Stawiasz wszystkie dublony. Boss przynosi jedno wyzwanie więcej: pokonaj go za pierwszym razem, a je podwoisz (maks. +40); inaczej je tracisz."), s: L6("Todos tus doblones contra el jefe: a la primera, ×2 (+40 máx.); si no, nada.|All your doubloons on the boss: first try, ×2 (+40 max); otherwise, nothing.|Tous tes doublons sur le boss : du premier coup, ×2 (+40 max) ; sinon, rien.|Todos os seus dobrões no chefe: de primeira, ×2 (+40 máx.); senão, nada.|Alle Dublonen auf den Boss: im ersten Versuch ×2 (max. +40), sonst nichts.|Tutti i dobloni sul boss: al primo colpo ×2 (+40 max); altrimenti, niente.||全部金币押在首领身上：一次过关 ×2（最多 +40），否则全没。|도블론 전부를 보스에: 한 번에 이기면 ×2 (최대 +40), 아니면 전부 잃음.|全ダブロンをボスに：一発なら×2（最大+40）、だめなら全部失う。|Все дублоны на босса: с первого раза ×2 (макс. +40), иначе ничего.|Wszystkie dublony na bossa: za pierwszym razem ×2 (maks. +40), inaczej nic."), ico: "bet_double" }, final: { n: L6("La apuesta final|The final bet|La mise finale|A aposta final|Der letzte Einsatz|La puntata finale||最后的赌注|마지막 베팅|最後の賭け|Последняя ставка|Ostatni zakład"), d: L6("El jefe final trae 2 retos más. Si lo vences a la primera, +2 provisiones para el modo infinito. Perder no cuesta nada.|The final boss brings 2 more challenges. Beat it on the first try for +2 provisions in infinite mode. Losing costs nothing.|Le boss final apporte 2 défis de plus. Bats-le du premier coup : +2 provisions pour le mode infini. Perdre ne coûte rien.|O chefe final traz mais 2 desafios. Vença de primeira e ganhe +2 provisões para o modo infinito. Perder não custa nada.|Der Endboss bringt 2 Herausforderungen mehr. Besiegst du ihn im ersten Versuch: +2 Proviant für den Endlosmodus. Verlieren kostet nichts.|Il boss finale porta 2 sfide in più. Battilo al primo colpo: +2 provviste per la modalità infinita. Perdere non costa nulla.||最终首领多带 2 个挑战。一次击败它，无限模式补给 +2。输了也不亏。|최종 보스가 도전을 2개 더 가져옵니다. 한 번에 이기면 무한 모드 식량 +2. 져도 잃는 건 없습니다.|最終ボスはチャレンジを2つ追加してくる。一発で倒せばエンドレスモード用にプロビジョン+2。負けても失うものはない。|Финальный босс приносит ещё 2 испытания. Победишь с первого раза — +2 запаса для бесконечного режима. Проигрыш ничего не стоит.|Ostatni boss przynosi 2 wyzwania więcej. Pokonaj go za pierwszym razem: +2 zapasy na tryb nieskończony. Przegrana nic nie kosztuje."), s: L6("El jefe final trae 2 retos más. A la primera: +2 provisiones.|The final boss brings 2 more challenges. First try: +2 provisions.|Le boss final apporte 2 défis de plus. Du premier coup : +2 provisions.|O chefe final traz mais 2 desafios. De primeira: +2 provisões.|Der Endboss bringt 2 Herausforderungen mehr. Im ersten Versuch: +2 Proviant.|Il boss finale porta 2 sfide in più. Al primo colpo: +2 provviste.||最终首领多带 2 个挑战。一次过关：补给 +2。|최종 보스가 도전 2개 추가. 한 번에 이기면 식량 +2.|最終ボスにチャレンジ2つ追加。一発ならプロビジョン+2。|Финальный босс приносит ещё 2 испытания. С первого раза: +2 запаса.|Ostatni boss przynosi 2 wyzwania więcej. Za pierwszym razem: +2 zapasy."), ico: "bet_final" }, red: { n: L6("Rojo o negro|Red or black|Rouge ou noir|Vermelho ou preto|Rot oder Schwarz|Rosso o nero||红或黑|빨강 또는 검정|赤か黒|Красное или чёрное|Czerwone czy czarne"), d: L6("Elige color y gira. Si aciertas, la próxima ronda paga un 50 % más y empiezas en racha.|Pick a color and spin. If you're right, the next round pays 50% more and you start on a streak.|Choisis une couleur et lance. Si tu as raison, la prochaine manche paie 50 % de plus et tu commences en série.|Escolha uma cor e gire. Se acertar, a próxima rodada paga 50% a mais e você começa em sequência.|Wähl eine Farbe und dreh. Liegst du richtig, zahlt die nächste Runde 50 % mehr und du startest mit Serie.|Scegli un colore e gira. Se indovini, il prossimo round paga il 50% in più e parti in serie.||选一种颜色然后转动。猜中的话，下一轮奖励多 50%，并且开局就有连击。|색을 고르고 돌리세요. 맞히면 다음 라운드 보상이 50% 늘고 연속 기록을 안고 시작합니다.|色を選んで回す。当たれば次のラウンドの報酬が50%増え、連続記録つきで始まる。|Выбери цвет и крути. Угадаешь — следующий раунд платит на 50% больше, и ты начинаешь с серией.|Wybierz kolor i zakręć. Jeśli trafisz, następna runda płaci 50% więcej i zaczynasz z serią."), s: L6("Si aciertas: la ronda paga un 50 % más y empiezas en racha.|If you're right: the round pays 50% more and you start on a streak.|Si tu as raison : la manche paie 50 % de plus et tu commences en série.|Se acertar: a rodada paga 50% a mais e você começa em sequência.|Liegst du richtig: Die Runde zahlt 50 % mehr und du startest mit Serie.|Se indovini: il round paga il 50% in più e parti in serie.||猜中：这一轮奖励多 50%，开局就有连击。|맞히면: 라운드 보상 50% 증가, 연속 기록을 안고 시작.|当たれば：ラウンド報酬50%増し、連続記録つきで開始。|Угадаешь: раунд платит на 50% больше, и ты начинаешь с серией.|Trafisz: runda płaci 50% więcej i zaczynasz z serią."), ico: "bet_red" } };
  const BT = { red: L6("Rojo|Red|Rouge|Vermelho|Rot|Rosso||红|빨강|赤|Красное|Czerwone"), black: L6("Negro|Black|Noir|Preto|Schwarz|Nero||黑|검정|黒|Чёрное|Czarne"), go: L6("Apostar|Bet|Miser|Apostar|Setzen|Punta||下注|베팅|賭ける|Ставлю|Stawiam"), on: L6("Apostado|Bet placed|Misé|Apostado|Gesetzt|Puntato||已下注|베팅함|賭けた|Ставка сделана|Postawione"), won: L6("¡Aciertas!|You win!|Gagné !|Acertou!|Gewonnen!|Hai vinto!||猜中了！|맞혔다!|当たり！|Угадал!|Trafione!"), lost: L6("Fallas|You lose|Perdu|Errou|Verloren|Hai perso||没猜中|빗나감|はずれ|Мимо|Pudło"), sold: L6("Vendido|Sold|Vendu|Vendido|Verkauft|Venduto||成交|판매 완료|成立|Продано|Sprzedane"), pact: L6("Pacto|Pact|Pacte|Pacto|Pakt|Patto||契约|계약|契約|Договор|Pakt"), seal: L6("Apuesta|Bet|Pari|Aposta|Wette|Scommessa||赌注|베팅|賭け|Ставка|Zakład"), lives2: L6("+2 provisiones|+2 provisions|+2 provisions|+2 provisões|+2 Proviant|+2 provviste||+2 补给|식량 +2|+2 プロビジョン|+2 запаса|+2 zapasy") };
  A.adv.BET_SEAL = BT.seal;
  const offerRound = act => act * 4 + A.rng(`${run.seed}:oferta:${act}`).pick([0, 1, 2]);   // tanda 13: la Oferta de la casa, en un Campamento sorteado del acto II y otro del III
  const betKind = r => (r > LAST ? null : r % 4 === 3 ? (r === LAST ? "final" : "double") : Math.floor(r / 4) >= 1 && r === offerRound(Math.floor(r / 4)) ? "offer" : "red");
  const offerPay = c => { const d = A.CHAL[c.id]; return Math.max(1, Math.round(0.6 * (3 + 2 * (c.lv || 3) + (d.kind === "map" ? 1 : 0)) * ascFx(run.asc).price * inflation())); };   // el 60 % del soborno base, sin la escalada
  const betsOpen = () => !!run.board || (A.profile.get().adv.boss || 0) > 0;
  const redCost = () => price(2);
  /* n retos sellados para la ronda r: de familias que no estan, sin chocar con la ronda (texto en banderas, la placa, Memoria de pez...) */
  function pickSealed(r, n, tag, baseList) {
    const D = A.CHAL, base = baseList || chalFor(r).list, fs = new Set(base.map(c => D[c.id].fam)), flag = defAt(r).topic === "flag", topic = defAt(r).topic, txt = base.some(c => D[c.id].kind === "text");
    const bad = id => (flag ? D[id].kind === "text" : D[id].kind === "flag") || (txt && D[id].kind === "text") || (run.cjk && id === "runes") || ((topic === "country" || topic === "clue") && (id === "nocountry" || id === "fakepass")) || (topic === "clue" && id === "ticker") || (run.cjk && id === "ticker") || (topic === "clue" && id === "riddle") || (id === "memory" && base.some(c => c.id === "hang" || c.id === "battery")) || ((id === "hang" || id === "battery") && base.some(c => c.id === "memory"));
    let pool = Object.keys(D).filter(id => !D[id].sub && D[id].kind !== "rule" && id !== "dark" && !fs.has(D[id].fam) && !bad(id));
    if (!run.board && run.chSeen0) { const seen = pool.filter(id => run.chSeen0.includes(id)); if (seen.length >= n) pool = seen; }   // de los que ya has visto
    const rr = A.rng(`${run.seed}:${tag}:${r}`), got = [];
    for (const id of rr.shuffle(pool)) { if (fs.has(D[id].fam)) continue; got.push({ id, lv: 3 }); fs.add(D[id].fam); if (got.length === n) break; }
    return got;
  }
  /* la carta de la apuesta en la Barra (tapete rojo) */
  function betHtml() {
    const r = roundNo(), k = betKind(r); if (run.inf || !k || !betsOpen()) return "";
    const b = (run.bets || {})[r], B = BETS[k], cf = chalFor(r), head = `<span class="sp-ic">${ic(B.ico)}</span><span class="sp-t" data-tt="${A.tx(B.d).replace(/"/g, "&quot;")}"><b>${A.tx(B.n)}</b><i>${A.tx(B.s)}</i></span>`;   // en la carta, el texto corto; el entero, en el globo
    if (k === "offer") {
      if (b && b.id === "offer") return `<div class="sup bet on bt-offer" data-bet="offer" role="button" tabindex="0">${head}<em class="sp-on">${A.tx(BT.sold)} · ${b.retos.length} · +${CN()}${b.pay}</em></div>`;
      const room = 4 - cf.list.length; if (room < 1 || run.attempt > 0) return "";
      const opts = [1, 2, 3].filter(n => n <= room).map(n => { const rs = pickSealed(r, n, "oferta"); return rs.length === n ? `<button class="bt-c bt-n" type="button" data-n="${n}">${n}<span>+${CN()}${rs.reduce((m, c) => m + offerPay(c), 0)}</span></button>` : ""; }).join("");
      return opts ? `<div class="sup bet bt-offer" data-bet="offer">${head}<span class="bt-pick">${opts}</span></div>` : "";
    }
    if (k === "red") {
      const att = run.attempt || 0;
      if (b && b.id === "red" && b.att === att) return `<div class="sup bet bt-red done ${b.win ? "win" : "lose"}" data-bet="red">${head}<em class="bt-res"><b>${A.tx(b.out === "red" ? BT.red : BT.black)}</b>${A.tx(b.win ? BT.won : BT.lost)}</em></div>`;
      return `<div class="sup bet bt-red" data-bet="red">${head}<span class="bt-pick"><button class="bt-c bt-cr" type="button" data-pick="red">${A.tx(BT.red)}</button><button class="bt-c bt-cb" type="button" data-pick="black">${A.tx(BT.black)}</button><em class="sp-p">${CN()}${redCost()}</em></span></div>`;
    }
    if (b && b.id === k) return `<div class="sup bet on bt-${k}" data-bet="${k}" role="button" tabindex="0">${head}<em class="sp-on">${A.tx(BT.on)}${k === "double" ? " · " + CN() + b.stake : ""}</em></div>`;
    const cap = cf.list.length + (k === "final" ? 2 : 1) <= 5;
    if (run.attempt > 0 || run.lives <= 1 || !cap || (k === "double" && run.coins < 1)) return "";
    return `<div class="sup bet bt-${k}" data-bet="${k}" role="button" tabindex="0">${head}<em class="sp-p bt-go">${A.tx(BT.go)}${k === "double" ? " · " + CN() + run.coins : ""}</em></div>`;
  }
  function wireBet() {
    const el = document.querySelector("#dlg .sup.bet"); if (!el) return; const r = roundNo(), k = el.dataset.bet;
    if (k === "offer") {
      el.querySelectorAll("[data-n]").forEach(btn => (btn.onclick = e => {
        e.stopPropagation(); const retos = pickSealed(r, +btn.dataset.n, "oferta"), pay = retos.reduce((m, c) => m + offerPay(c), 0);
        run.bets = run.bets || {}; run.bets[r] = { id: "offer", retos, pay }; run.coins += pay; persist(); renderShop(false);
        A.sfx.jackpot(1); if (A.core.jpShake) A.core.jpShake(1); A.dealer.enable(true); A.dealer.say(A.dealer.line("betDeal"), { mood: "laugh", hold: 2400 });   // lluvia de monedas
      }));
      el.onclick = () => { const b = (run.bets || {})[r]; if (!b || b.id !== "offer") return; if (run.coins < b.pay) { A.sfx.deny(); shake(el); return; } run.coins -= b.pay; delete run.bets[r]; A.sfx.sell(); persist(); renderShop(false); };   // en la misma visita, te echas atras devolviendo lo cobrado
      return;
    }
    if (k === "red") {
      el.querySelectorAll("[data-pick]").forEach(btn => (btn.onclick = e => {
        e.stopPropagation(); const c = redCost(); if (run.coins < c) { A.sfx.deny(); shake(el); return; }
        const att = run.attempt || 0, out = A.rng(`${run.seed}:rojo:${r}:${att}`)() < 0.5 ? "red" : "black", pick = btn.dataset.pick;
        run.coins -= c; run.bets = run.bets || {}; run.bets[r] = { id: "red", pick, out, win: pick === out, att }; persist();   // guardada antes de girar: recargar no la cambia
        spinRed(el, () => { renderShop(false); const b = run.bets[r]; if (b.win) { A.sfx.jackpot(1); if (A.core.jpShake) A.core.jpShake(1); } else A.sfx.lose(); A.dealer.enable(true); A.dealer.say(A.dealer.line(b.win ? "betWin" : "betLose"), { mood: b.win ? "angry" : "laugh", hold: 2200 }); });
      }));
      return;
    }
    el.onclick = () => {
      run.bets = run.bets || {}; const b = run.bets[r];
      if (b && b.id === k) { if (k === "double") run.coins += b.stake; delete run.bets[r]; A.sfx.sell(); persist(); return renderShop(false); }   // en la misma visita, te echas atras
      const retos = pickSealed(r, k === "final" ? 2 : 1, k === "final" ? "final" : "doble"); if (!retos.length) { A.sfx.deny(); shake(el); return; }
      run.bets[r] = { id: k, retos, stake: k === "double" ? run.coins : 0 }; if (k === "double") run.coins = 0;
      A.sfx.chip(0.2); setTimeout(() => A.sfx.chip(0.6), 120); setTimeout(() => A.sfx.stamp(), 260); persist(); renderShop(false);
      A.dealer.enable(true); A.dealer.say(A.dealer.line("betDeal"), { mood: "sly", hold: 2400 });   // cierra el trato
    };
  }
  /* la ruleta gira 2 s en la carta, con el tic-tic de la bola cada vez mas lento */
  function spinRed(el, done) {
    el.classList.add("spinning"); const reduced = C().S.reduce || matchMedia("(prefers-reduced-motion: reduce)").matches; let t = 0, k = 0;
    if (reduced) return setTimeout(done, 400);
    const tick = () => { if (t > 1900) return done(); A.sfx.tick(); const gap = 60 + k * k * 4; k++; t += gap; setTimeout(tick, gap); }; tick();
  }
  const SUPS = [
    { id: "cafe", cost: 4, ico: "sup_cafe", n: A.L("Café doble", "Double espresso"), d: A.L("+4 s por pregunta en la próxima ronda", "+4 s per question next round") },
    { id: "seguro", cost: 8, ico: "sup_seguro", n: A.L("Seguro de ronda", "Round insurance"), d: A.L("Si fallas la próxima ronda, no pierdes provisión", "If you fail next round, you keep your provision") },
  ];
  const supCost = s => price(s.cost + (s.id === "seguro" ? 2 * (run.segN || 0) : 0));   // cada Seguro de ronda gastado (el que te salva al fallar; ver roundEnd) encarece el siguiente: no se puede fallar gratis para siempre
  let supFresh = null;                                                 // el suministro recien comprado: solo a ese le cae el sello
  function supHtml() {
    const sup = run.sup || {}, items = SUPS.map(s => `<button class="sup sp-${s.id}${sup[s.id] ? " on" : ""}${supFresh === s.id ? " fresh" : ""}" data-sup="${s.id}" type="button"><span class="sp-ic">${ic(s.ico)}</span><span class="sp-t"><b>${A.tx(s.n)}</b><i>${A.tx(s.d)}</i></span>${sup[s.id] ? `<em class="sp-on">${A.T("Activo", "On")}</em>` : `<em class="sp-p">${CN()}${supCost(s)}</em>`}</button>`).join("");
    supFresh = null;
    return `<div class="tb-sup">${items}${betHtml()}</div>`;
  }
  function wireSup() {
    document.querySelectorAll("[data-sup]").forEach(b => (b.onclick = () => {
      const s = SUPS.find(x => x.id === b.dataset.sup), c = supCost(s); run.sup = run.sup || {};
      if (run.sup[s.id]) { run.coins += typeof run.sup[s.id] === "number" ? run.sup[s.id] : c; run.sup[s.id] = false; A.sfx.sell(); }   // devuelve lo que pagaste (vender el Vale entre medias ya no regala 1)
      else { if (run.coins < c) { A.sfx.deny(); shake(b); return; } run.coins -= c; run.sup[s.id] = c; supFresh = s.id; run.visitBuys = (run.visitBuys || 0) + 1; A.sfx.buy(); if (SUPS.every(x => run.sup[x.id])) A.ach.emit("adv", { kind: "supplies" }); }
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
    if (legOn) return;
    const i = +el.dataset.ix, s = run.stock[i]; if (!s || run.bought.includes(i)) return;   // data-ix (no data-i: cambiar de idioma reescribe todo [data-i] con A.t)
    if (s.k === "life") { const c = lifePrice(); if (run.lives >= run.maxLives) { A.sfx.deny(); shake(el); return; } if (run.coins < c) return noFunds(el); run.coins -= c; run.lives++; run.lifeBuys = (run.lifeBuys || 0) + 1; run.bought.push(i); A.sfx.buy(); persist(); return renderShop(chest); }
    if (s.k === "perk") {
      const p = A.RELICS[s.id], c = chest ? 0 : cardCost(s);
      const recharge = !!p.amulet && owned(s.id), swapV = p.ventaja ? perkList().find(q => q.ventaja && q.id !== s.id) : null;
      if (!recharge && !swapV && run.perks.length >= maxPerks()) {                // tanda 9 (S10): mochila llena: eliges cual dejas y se cambia en un gesto
        if (run.coins + Math.max(...run.perks.map(sellValue)) < c) return noFunds(el);
        swapIx = i; document.querySelectorAll("#dlg .tr-relic").forEach(x => x.classList.add("swap-pick")); document.querySelectorAll("#dlg .offer").forEach(x => x.classList.toggle("swap-src", x === el)); A.sfx.card(); flash(A.tx(SWAP_PICK)); return;
      }
      if (run.coins + (swapV ? sellValue(swapV.id) : 0) < c) return noFunds(el);
      if (swapV) { run.coins += sellValue(swapV.id); run.perks.splice(run.perks.indexOf(swapV.id), 1); if (run.paid) delete run.paid[swapV.id]; A.sfx.sell(); }   // la Ventaja vieja se vende
      if (!chest && A.dealer.campBought) A.dealer.campBought(s.id, A.tx(p.n), run.seed);
      run.coins -= c; run.amu = run.amu || {}; if (recharge) run.amu[s.id] += AMU_LV; else { run.perks.push(s.id); if (p.amulet) run.amu[s.id] = AMU_LV; }
      run.paid = run.paid || {}; run.paidAt = run.paidAt || {}; run.paid[s.id] = (recharge ? run.paid[s.id] || 0 : 0) + c; run.paidAt[s.id] = run.shopKey;
      if (p.buy) p.buy(run); if (p.r === 3 && chest) run.legAch = 1;
      if (p.r === 3) (run.legAct = run.legAct || {})[run.act] = s.id;
      if (p.pact) setTimeout(() => { A.sfx.stamp(); if (A.core.jpShake) A.core.jpShake(2); A.dealer.enable(true); A.dealer.say(A.dealer.line("betDeal"), { mood: "sly", hold: 2400 }); }, 200);   // trato hecho: un hueco lacrado mas   // tanda 12: la legendaria de este acto   // Botin legendario: solo la del cofre del jefe. Se concede en la tienda (openShop): su aviso no tapa la secuencia
    } else {
      const c = cardCost(s);
      if (!run.tools[s.id] && Object.keys(run.tools).length >= 4) { A.sfx.deny(); shake(el); flash(A.T("Solo 4 herramientas distintas.", "Only 4 different tools.")); return; }
      if (run.coins < c) return noFunds(el);
      run.coins -= c; addTool(s.id);
    }
    if (s.fix) run.fixUsed = `${roundNo()}:${run.attempt}`;              // ya cobraste la rebaja de esta revancha
    const leg = (chest || s.vit) && s.k === "perk" && A.RELICS[s.id].r === 3;   // la de la vitrina tambien tiene su secuencia       // la legendaria del cofre: su propia secuencia (y sus sonidos)
    run.bought.push(i); run.visitBuys = (run.visitBuys || 0) + 1; if (!leg) A.sfx.buy(); persist();
    if (chest) { run.stock = null; run.bought = []; if (leg) run.phase = "shop"; persist(); return leg ? legendary(el) : openShop(false); }   // guardada ya en la tienda: si se cierra a mitad, la reliquia es tuya y no vuelve el cofre
    if (leg) return legendary(el);
    renderShop(chest);
  }
  /* PAN DE ORO: al elegir la legendaria en el cofre del jefe (~2 s, la secuencia del prototipo aprobado). Las otras cartas caen de la mesa y la sala
     se oscurece en ambar; la legendaria sube al centro con un bote (pasa por x1,12 y se posa a x1: el pixel queda entero) mientras suena su subida
     y la barre el brillo; jackpot(3) con sus tres golpes (A.audio.jpGap): en cada uno el marco se enciende, saltan 3, 5 y 9 doblones por delante y
     la pantalla tiembla 1, 2 y 3 (Vibracion y "reducir movimiento" mandan, como en jpShake); al final habla el crupier (js/dealer.js, campLegend) y,
     en cuanto empieza su frase, la sala se enciende y la carta vuela a su hueco de la mochila, que destella en oro. Despues, la tienda: cuando el
     crupier acaba su frase y su segundo de mas (nunca se le corta). Antes de empezar la reliquia ya esta comprada y guardada (y el logro, en deuda:
     su aviso sale en la tienda). Sin clics mientras dura (mesa inerte; Esc tampoco abre el menu: A.adv.busy). Se mide todo una vez al empezar;
     despues solo transform y opacity */
  let legOn = 0, legN = 0;                                             // legOn: la secuencia en curso (0: ninguna); legN: contador, nunca se repite
  const legWait = ms => new Promise(r => setTimeout(r, ms));
  const legPaint = () => new Promise(r => { requestAnimationFrame(() => setTimeout(r, 0)); setTimeout(r, 60); });   // tras pintar el fotograma de ahora (o 60 ms, con la ventana oculta)
  function legCoins(fx, x, y, n) {                                       // doblones que saltan de la carta (en px del lienzo: la mesa lleva su zoom)
    for (let i = 0; i < n; i++) {
      const c = document.createElement("i"); c.className = "lg-coin"; c.style.left = x + "px"; c.style.top = y + "px"; fx.appendChild(c);
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, v = 150 + Math.random() * 170, dx = Math.cos(ang) * v, up = Math.sin(ang) * v, fall = 260 + Math.random() * 160;
      c.animate([{ transform: "translate(0, 0) scale(.6)", opacity: 1 }, { transform: `translate(${(dx * 0.55).toFixed(1)}px, ${up.toFixed(1)}px) scale(1)`, opacity: 1, offset: 0.38, easing: "cubic-bezier(.2, .6, .5, 1)" },
        { transform: `translate(${dx.toFixed(1)}px, ${(up + fall).toFixed(1)}px) scale(.9)`, opacity: 0 }], { duration: 900 + Math.random() * 300, easing: "cubic-bezier(.3, 0, .8, .6)" }).onfinish = () => c.remove();
    }
  }
  async function legendary(el) {
    const tok = (legOn = ++legN), r0 = run, tb = el.closest(".table");
    const alive = () => legOn === tok && run === r0 && tb.isConnected;
    const end = () => {                                                  // si saliste a la portada entretanto, nada
      if (legOn !== tok) return; if (!(run === r0 && tb && tb.isConnected)) { legOn = 0; return; }
      if (A.dealer.release) A.dealer.release();                          // ya dijo su frase y su segundo de mas: se va, y la tienda llega un poco despues (no en el mismo fotograma)
      setTimeout(() => { if (legOn !== tok) return; legOn = 0; if (run === r0 && tb.isConnected) openShop(false); }, 140);
    };
    try {                                                                // si algo falla a mitad, la tienda llega igual (la mesa no se queda inerte)
      const id = r0.perks[r0.perks.length - 1], S = C().S, rm = !!(S && S.reduce) || RMQ.matches;
      if (!tb || !A.RELICS[id]) return end();
      const offers = tb.querySelector(".offers"), others = [...offers.querySelectorAll(".offer")].filter(o => o !== el), g = Gold.of(el);
      const slot = tb.querySelectorAll(".tr-relics .tray-row > *")[r0.perks.length - 1], icoSrc = (el.querySelector(".of-ico img") || {}).src || "";
      tb.classList.add("lg-seq"); el.classList.add("lg-hero"); tb.inert = true;
      /* medir (una sola vez, ya con la mesa quieta): en pixeles de pantalla; las animaciones van en px del lienzo (/k, la mesa lleva zoom) */
      const k = el.currentCSSZoom || A.uiK(), lr = el.getBoundingClientRect(), or = offers.getBoundingClientRect(), dr = tb.parentNode.getBoundingClientRect(), sr = slot ? slot.getBoundingClientRect() : null;
      const from = getComputedStyle(el).transform, m = from && from !== "none" ? new DOMMatrixReadOnly(from) : null, tx = m ? m.m41 : 0, ty = m ? m.m42 : 0, w0 = el.offsetWidth || 1, sw = slot ? slot.offsetWidth : 56;
      const lx = lr.left + lr.width / 2, ly = lr.top + lr.height / 2, cx = rm ? lx : or.left + or.width / 2, cy = rm ? ly : Math.max(dr.top + lr.height * 0.56 + 8, Math.min(dr.top + dr.height * 0.46, or.top + or.height / 2));
      const to = (x, y, sc) => `translate(${((x - lx) / k + tx).toFixed(2)}px, ${((y - ly) / k + ty).toFixed(2)}px) scale(${sc})`, up = to(cx, cy, 1);
      const dim = document.createElement("i"), fx = document.createElement("i"); dim.className = "lg-dim"; fx.className = "lg-fx";
      dim.style.setProperty("--lx", (((cx - dr.left) / dr.width) * 100).toFixed(1) + "%"); dim.style.setProperty("--ly", (((cy - dr.top) / dr.height) * 100).toFixed(1) + "%");
      tb.append(dim, fx);
      const fxX = (cx - dr.left) / k, fxY = (cy - dr.top) / k;
      /* 0,0 s: las otras caen de la mesa y la sala se oscurece; 0,1 s: la legendaria sube al centro (bote: x1,12 a medio camino y se posa a x1),
         suena su subida (A.sfx.lift) y el brillo la barre */
      A.sfx.card();
      others.forEach((o, i) => o.animate(rm ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 1 }, { opacity: 0, transform: `translateY(70px) rotate(${i ? 9 : -9}deg)` }], { duration: 380, easing: "cubic-bezier(.5, 0, .75, 0)", fill: "forwards" }));
      dim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, fill: "forwards" });
      if (!rm) el.animate([{ transform: from && from !== "none" ? from : "none", easing: "cubic-bezier(.25, 1.25, .5, 1)" }, { transform: to(cx, cy, 1.12), offset: 0.62, easing: "cubic-bezier(.45, 0, .4, 1)" }, { transform: up }], { duration: 440, delay: 100, fill: "both" });
      if (g) { g.live = true; setTimeout(() => g.sweep(0.5), 100); }
      setTimeout(() => { if (alive()) A.sfx.lift(); }, 100);
      await legWait(520); if (!alive()) return end();
      /* 0,5 s: jackpot(3). En cada golpe: el marco se enciende, saltan 3, 5 y 9 doblones y la pantalla tiembla 1, 2 y 3. El golpe 1 se pinta ANTES
         de sintetizar el jackpot (el jackpot crea los nodos de cada golpe poco antes de que suene, pero el primero va al momento): el temblor, los
         doblones y la carta ya van por el compositor y el sonido llega un fotograma despues (el oido lo acepta; al reves, no). Los golpes 2 y 3, al compas del sonido */
      const gap = A.audio.jpGap * 1000;
      const hit = n => {
        if (C().jpShake) C().jpShake(n + 1);
        el.classList.add("hit"); setTimeout(() => el.classList.remove("hit"), 150);
        if (g) g.sweep(0.38);
        if (!rm) legCoins(fx, fxX, fxY, [3, 5, 9][n]);
        if (n === 2 && !rm) el.animate([{ transform: "scale(1)" }, { transform: "scale(1.09)" }, { transform: "scale(1)" }], { duration: 300, easing: "steps(6, end)", composite: "add" });
      };
      hit(0);
      await legPaint(); if (!alive()) return end();
      const t1 = performance.now(); A.sfx.jackpot(3); A.haptic.jackpot(3);
      for (let n = 1; n < 3; n++) { await legWait(Math.max(0, t1 + n * gap - performance.now())); if (!alive()) return end(); hit(n); }
      await legWait(560); if (!alive()) return end();
      /* 2,0 s: habla el crupier. Si estaba a media frase, la suya espera turno (nunca se le corta) y la carta, en el centro con la sala a oscuras,
         espera con ella: la sala se enciende y la carta vuela a la mochila cuando EMPIEZA su frase (como mucho 7 s) */
      let said, done; const start = new Promise(r => (said = r)), talk = new Promise(r => (done = r));
      if (!(A.dealer.campLegend && A.dealer.campLegend(Math.max(1, rm ? 1 : lr.width * 1.12), () => { said(); done(); }, said))) { said(); done(); }
      await Promise.race([start, legWait(7000)]); if (!alive()) return end();
      dim.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, fill: "forwards" });
      if (rm) await el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" }).finished.catch(() => {});
      if (!rm) {
        await legWait(120); if (!alive()) return end();
        const fly = sr ? to(sr.left + sr.width / 2, sr.top + sr.height / 2, (sw / w0).toFixed(4)) : up;
        await el.animate([{ transform: up }, { transform: fly, opacity: 1, offset: 0.92 }, { transform: fly, opacity: 0 }], { duration: 460, easing: "cubic-bezier(.55, 0, .3, 1)", fill: "forwards" }).finished.catch(() => {});
        if (!alive()) return end();
      }
      /* llega: la reliquia aparece en su hueco con su marco de oro y el hueco destella (el icono va de fondo: una imagen nueva haria reajustar la pantalla).
         Suena el aterrizaje (A.sfx.land: golpe y campana en una nota de la pentatonica al azar, nunca la de la vez anterior) */
      if (slot && slot.isConnected) {
        const face = icoSrc ? `<i class="ic lg-ico" style="background-image:url('${icoSrc}')"></i>` : "";
        slot.insertAdjacentHTML("afterend", relicHtml(id, face)); const mini = slot.nextElementSibling; slot.remove();
        if (mini) { mini.classList.add("lg-in"); Gold.mount(mini); }
        const cnt = tb.querySelector(".tr-relics h4 b"); if (cnt) cnt.textContent = `${r0.perks.length}/${maxPerks()}`;
      }
      A.sfx.land(); A.haptic([30]);
      await Promise.all([Promise.race([talk, legWait(9000)]), legWait(800)]);   // red de seguridad: nunca se queda la mesa bloqueada
      end();
    } catch (e) { console.error(e); end(); }
  }
  A.adv.busy = () => legOn !== 0;                                        // la legendaria del cofre se esta luciendo (js/game.js: Esc no abre el menu)
  function sell(id, chest) { const k = run.perks.indexOf(id); if (k < 0 || (id === "pact" && run.perks.length > 5)) return; const v = sellValue(id); if (id === "hoard" && run.hucha) { const t = run.hucha >= 20 ? 3 : run.hucha >= 10 ? 2 : 1; A.sfx.jackpot(t); if (A.core.jpShake) A.core.jpShake(t); run.hucha = 0; }   // se rompe: llueven monedas
    run.perks.splice(k, 1); run.coins += v; if (run.amu) delete run.amu[id]; if (run.paid) delete run.paid[id]; if (A.RELICS[id].sell) A.RELICS[id].sell(run); A.sfx.sell(); persist(); renderShop(!!chest); }   // sell: lo que la reliquia dio al comprarla se va con ella (Corazon de explorador)
  function flash(t) { const n = document.querySelector("#dlg .tb-shop"); if (!n) return; n.querySelectorAll(".shop-flash").forEach(x => x.remove()); const m = document.createElement("p"); m.className = "shop-flash"; m.textContent = t; n.appendChild(m); setTimeout(() => m.remove(), 2200); }   // flotando sobre las cartas: no empuja nada

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
