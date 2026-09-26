/*
 * Atlas IQ - Enciclopedia geografica (v0.5).
 *
 *  - Cada lugar del juego (ciudades, capitales, monumentos, maravillas, mares, estrechos, batallas, sucesos, apodos...) es una tarjeta.
 *    Empiezan BLOQUEADAS y se desbloquean al acertarlas. Un acierto puede desbloquear ademas el pais, personajes, sucesos y curiosidades.
 *  - El contenido (foto en alta definicion, descripcion, historia) llega de Wikipedia/Wikimedia Commons en tu idioma, con atribucion,
 *    y se guarda en IndexedDB para verlo sin conexion.
 */
window.AIQ = window.AIQ || {};
(function (A) {
  const $ = id => document.getElementById(id);
  const STORE = "atlasiq.codex.v1";
  const RARITY = ["common", "uncommon", "rare", "legendary"];
  const TYPES = ["city", "capital", "country", "landmark", "nature", "water", "strait", "battle", "event", "person", "curiosity", "place"];
  const TYPE_KEY = { person: "type.person", curiosity: "type.curiosity" };
  const typeLabel = t => A.t(TYPE_KEY[t] || "kind." + t);
  const CONT = { af: "cont.af", na: "cont.na", sa: "cont.sa", as: "cont.as", eu: "cont.eu", oc: "cont.oc", an: "cont.an", sea: "cont.sea" };

  /* iconos propios por tipo (js/icons.js) */
  const TYPE_IC = { city: "t_city", capital: "t_capital", country: "t_country", landmark: "t_landmark", nature: "t_nature", water: "t_water", strait: "t_strait", battle: "t_battle", event: "t_event", person: "t_person", curiosity: "t_curio", place: "t_place" };
  /* cada tarjeta lleva indice de carta de poker: rango por rareza (5, 8, K, A) y palo geografico por tipo */
  const TYPE_SUIT = { city: "s_pin", capital: "s_compass", country: "s_compass", landmark: "s_peak", nature: "s_peak", water: "s_palm", strait: "s_palm", battle: "s_peak", event: "s_pin", person: "s_compass", curiosity: "s_palm", place: "s_pin" };
  const RANK = ["5", "8", "K", "A"], SUIT_RED = { s_pin: 1, s_compass: 1 };
  const ixs = e => { const su = TYPE_SUIT[e.type] || "s_pin", red = SUIT_RED[su] ? " red" : ""; return `<span class="ix tl${red}"><b>${RANK[e.rarity]}</b>${A.icon(su)}</span><span class="ix br${red}"><b>${RANK[e.rarity]}</b>${A.icon(su)}</span>`; };
  const iconSvg = t => A.icon(TYPE_IC[t] || "t_place", "cx-ic");

  const continent = (lat, lon) => {
    if (lat == null) return "sea";
    if (lat < -60) return "an";
    if (lon < -30 && lat > 12) return "na"; if (lon < -30) return "sa";
    if (lon >= -30 && lon < 60 && lat > 34) return "eu"; if (lon >= -20 && lon < 52 && lat <= 37 && lat > -36 && !(lon > 34 && lat > 12 && lat < 34 && lon < 60)) return lat > 12 && lon > 26 && lat < 33 && lon < 36.5 ? "as" : "af";
    if (lon > 110 && lat < -8) return "oc"; if (lon > 112 && lon < 180 && lat < 0 && lat > -50) return "oc"; if (lon > 165 || lon < -150) return "oc";
    if (lat < -8 && lon > 100) return "oc"; return lon >= 25 ? "as" : "eu";
  };
  const hav = (a, b, c, d) => A.geo.haversine(a, b, c, d);

  /* ================================================================== datos */
  const E = {}, order = [], chain = {};
  let world = null, map = null, store = { unlocked: {}, seen: {} };
  const listeners = [];

  function load() { try { store = Object.assign({ unlocked: {}, seen: {} }, JSON.parse(localStorage.getItem(STORE) || "{}")); } catch (e) { /* vacio */ } }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(store)); } catch (e) { /* sin almacenamiento */ } }

  const WIKI_OVERRIDE = {
    "hermitage": "Hermitage Museum", "agram": "Zagreb", "davao": "Davao City", "tucuman": "San Miguel de Tucum00e1n", "hanyang": "Seoul", "san-juan-puerto-rico": "San Juan, Puerto Rico", "red-fort": "Red Fort", "pentagon": "The Pentagon", "tea-party": "Boston Tea Party", "trinity-site": "Trinity (nuclear test)", "vegas-strip": "Las Vegas Strip",
    "edison": "Edison, New Jersey", "bam": "Bam, Iran", "natal": "Natal, Rio Grande do Norte", "sparks": "Sparks, Nevada", "reno": "Reno, Nevada", "flint": "Flint, Michigan", "eugene": "Eugene, Oregon",
    "salem": "Salem, Massachusetts", "savannah": "Savannah, Georgia", "elgin": "Elgin, Illinois", "emerald": "Emerald, Queensland", "dubbo": "Dubbo", "troy": "Troy", "ur": "Ur", "area-51": "Area 51",
    "mount-rainier": "Mount Rainier", "k2": "K2", "washington": "Washington, D.C.", "old-city-of-acre": "Acre, Israel", "old-city-of-jerusalem": "Old City of Jerusalem",
    "battle-of-waterloo": "Battle of Waterloo", "kitty-hawk": "Kitty Hawk, North Carolina", "montana": "Little Bighorn Battlefield National Monument", "battle": "Battle, East Sussex",
    "hawaii": "Hawaii (island)", "sinking-of-the-titanic": "Sinking of the Titanic", "columbus-s-first-landfall": "Voyages of Christopher Columbus",
    "christ-the-redeemer": "Christ the Redeemer (statue)", "big-ben": "Big Ben", "saint-basil-s-cathedral": "Saint Basil's Cathedral", "chichen-itza": "Chichen Itza", "sagrada-familia": "Sagrada Família",
    "pyramids-of-giza": "Giza pyramid complex", "great-wall-of-china": "Great Wall of China", "mount-fuji": "Mount Fuji", "ulaanbaatar": "Ulaanbaatar", "reykjavik": "Reykjavík",
  };
  const COUNTRY_WIKI = {
    "United States of America": "United States", "Dem. Rep. Congo": "Democratic Republic of the Congo", "Congo": "Republic of the Congo", "eSwatini": "Eswatini", "Bosnia and Herz.": "Bosnia and Herzegovina", "Czechia": "Czech Republic",
    "Macedonia": "North Macedonia", "N. Cyprus": "Northern Cyprus", "Dominican Rep.": "Dominican Republic", "Central African Rep.": "Central African Republic", "Eq. Guinea": "Equatorial Guinea", "St. Vin. and Gren.": "Saint Vincent and the Grenadines",
    "Côte d'Ivoire": "Ivory Coast", "Palestine": "State of Palestine", "W. Sahara": "Western Sahara", "S. Sudan": "South Sudan", "Solomon Is.": "Solomon Islands", "Marshall Is.": "Marshall Islands", "Georgia": "Georgia (country)",
    "Timor-Leste": "East Timor", "São Tomé and Principe": "São Tomé and Príncipe", "Cabo Verde": "Cape Verde", "Vatican": "Vatican City", "Myanmar": "Myanmar", "Macedonia ": "North Macedonia", "St. Kitts and Nevis": "Saint Kitts and Nevis",
  };
  const COUNTRY_DISP = { "United States of America": "United States", "Dem. Rep. Congo": "DR Congo", "Congo": "Republic of the Congo", "Bosnia and Herz.": "Bosnia and Herzegovina", "Czechia": "Czechia", "Macedonia": "North Macedonia" };
  const rarityFor = (i, n) => Math.min(3, Math.floor((i / Math.max(1, n)) * 4));
  const eventLike = /^(battle|bomb dropped|dead sea scrolls|tea party|independence)$/i;

  function countryFrom(title, gameId) {
    if (gameId === "usa") return "United States of America";
    const parts = String(title).replace(/\(.*?\)/g, "").split(","), tail = parts.length > 1 ? parts[parts.length - 1].trim().split("/")[0].trim() : "";
    if (!tail) return null; const n = A.CODEX_COUNTRY[tail] || tail; return world.byName[n] ? n : null;
  }
  function centroid(name) {
    const f = world.byName[name]; if (!f) return [null, null];
    const big = f.polys.reduce((a, b) => ((b.bbox[2] - b.bbox[0]) * (b.bbox[3] - b.bbox[1]) > (a.bbox[2] - a.bbox[0]) * (a.bbox[3] - a.bbox[1]) ? b : a));
    return [(big.bbox[1] + big.bbox[3]) / 2, (big.bbox[0] + big.bbox[2]) / 2];
  }

  function build() {
    const add = e => {
      const cur = E[e.id];
      if (!cur) { E[e.id] = e; order.push(e.id); return e; }
      if (cur.type === "place" && e.type !== "place") cur.type = e.type;
      if (e.rarity < cur.rarity) cur.rarity = e.rarity;
      for (const k of Object.keys(e.name || {})) if (!cur.name[k] && e.name[k]) cur.name[k] = e.name[k];
      if (!cur.fact.en && e.fact && e.fact.en) cur.fact = e.fact;
      if (cur.lat == null && e.lat != null) { cur.lat = e.lat; cur.lon = e.lon; }
      if (!cur.country && e.country) cur.country = e.country;
      return cur;
    };
    /* 0) banco de lugares empaquetado (data/places.js): capitales, ciudades, monumentos, naturaleza, historia y paises */
    if (A.PLACES && A.PLACES.length) {
      const neBy = {}; A.PLACES.forEach(r => { if (r[1] === "country") neBy[r[6].en] = r[0].slice(2); });
      A.PLACES.forEach(([id, kind, tier, lat, lon, qc, names]) => {
        const cnEn = qc && A.PCOUNTRY && A.PCOUNTRY[qc] && A.PCOUNTRY[qc].en, ne = (cnEn && (neBy[cnEn] || (world.byName[cnEn] ? cnEn : null))) || null;
        const type = kind === "history" ? (/^(battle|siege|fall of|.*\bwar\b|bombing|attack)/i.test(names.en) ? "battle" : "event")
          : kind === "nature" ? (/\b(sea|ocean|gulf|bay)\b/i.test(names.en) ? "water" : /\b(strait|channel|canal|cape|drake|bosporus)\b/i.test(names.en) ? "strait" : "nature") : kind;
        const rar = Math.min(3, tier + (kind === "history" || kind === "nature" ? 1 : 0));
        add({ id, type, name: { ...names }, wiki: names.en, lat: kind === "country" ? null : lat, lon: kind === "country" ? null : lon, country: ne, fact: { en: "", es: "" }, rarity: rar, src: "places", nogeo: kind === "country" });
      });
    }
    const wikiFor = (id, title) => WIKI_OVERRIDE[id] || String(title).replace(/\(.*?\)/g, "").replace(/\s+-\s+\d{3,4}\b/, "").split(",")[0].trim();

    // 1) modo Extendido (mundo)
    (A.LEVELS || []).forEach((L, i) => L.pool.forEach(o => {
      const r = rarityFor(i, A.LEVELS.length);
      if (o.t === "c") return;                                        // los paises se crean mas abajo
      const id = A.ckey(o.n.en), cn = countryFrom("x, " + (o.c.en || ""), "");
      add({ id, type: L.kind === "strait" ? "strait" : L.kind, name: { en: o.n.en, es: o.n.es }, wiki: wikiFor(id, o.n.en), full: o.c.en ? o.n.en + ", " + o.c.en : "", lat: o.lat, lon: o.lon, country: cn, fact: o.f, rarity: r, src: "atlas" });
    }));
    // 2) modo Extendido (historia y pistas)
    (A.HISTORY || []).forEach((L, i) => L.pool.forEach(a => {
      const r = Math.min(3, i + 1);
      if (L.kind === "clue") {
        const id = A.ckey(a[2]), nm = a[2].split(",")[0], nmEs = a[3].split(",")[0];
        add({ id, type: "city", name: { en: nm, es: nmEs }, wiki: wikiFor(id, nm), full: a[2], lat: a[4], lon: a[5], country: countryFrom(a[2], ""), fact: { en: `${a[0]} — ${a[6]}`, es: `${a[1]} — ${a[7]}` }, rarity: r, src: "atlas" });
      } else {
        const id = A.ckey(a[0]);
        add({ id, type: L.kind, name: { en: a[0].replace(/\s*\(.*?\)\s*/g, "").trim(), es: a[1].replace(/\s*\(.*?\)\s*/g, "").trim() }, wiki: wikiFor(id, a[0]), lat: a[4], lon: a[5], country: countryFrom(a[2], ""), fact: { en: a[6], es: a[7] }, rarity: r, src: "atlas" });
        const pid = A.ckey(a[2]);
        if (pid !== id) add({ id: pid, type: /ocean|sea$/i.test(a[2]) ? "water" : "place", name: { en: a[2].split(",")[0], es: a[3].split(",")[0] }, wiki: wikiFor(pid, a[2]), lat: a[4], lon: a[5], country: countryFrom(a[2], ""), fact: { en: "", es: "" }, rarity: r, src: "atlas" });
      }
    }));
    // 3) modo Clasico: 536 destinos de las 6 partidas originales
    (A.CLASSIC || []).forEach(g => g.levels.forEach((L, li) => {
      const r = rarityFor(li, g.levels.length);
      L.dests.forEach(d => {
        const clue = L.bonus && d.f, title = clue ? d.f : d.n, id = A.ckey(title), base = title.replace(/\(.*?\)/g, "").split(",")[0].trim();
        let type = /capital/i.test(L.name) ? "capital" : /famous|unesco|heritage|places/i.test(L.name) ? "landmark" : /cit(y|ies)/i.test(L.name) ? "city" : "place";
        if (eventLike.test(base) || /^battle of|bomb dropped/i.test(title)) type = "event";
        add({ id, type, name: { en: base, es: "" }, wiki: wikiFor(id, title), full: clue ? "" : title.replace(/\(.*?\)/g, "").trim(), lat: d.lat, lon: d.lon, country: countryFrom(title, g.id), fact: { en: clue ? "" : d.f, es: "" }, rarity: r, src: "classic" });
      });
    }));

    // 4) paises: los de las preguntas + los que aparecen como pais de algun lugar o como disparador
    const wanted = new Set();
    (A.LEVELS || []).forEach(L => L.pool.forEach(o => { if (o.t === "c") wanted.add(o.key); }));
    for (const id of order) if (E[id].country) wanted.add(E[id].country);
    (A.CODEX_CURATED || []).forEach(c => c[6].forEach(t => { if (t.startsWith("c:")) wanted.add(t.slice(2)); }));
    const esCountry = {}; (A.LEVELS || []).forEach(L => L.pool.forEach(o => { if (o.t === "c") esCountry[o.key] = o; }));
    wanted.forEach(name => {
      if (!world.byName[name]) return;
      const [lat, lon] = centroid(name), o = esCountry[name], idx = o ? (A.LEVELS.findIndex(L => L.pool.includes(o))) : 4;
      add({ id: "c:" + name, type: "country", name: { en: COUNTRY_DISP[name] || name, es: o ? o.n.es : "" }, wiki: COUNTRY_WIKI[name] || name, lat, lon, country: null, fact: o ? o.f : { en: "", es: "" }, rarity: o ? rarityFor(idx, A.LEVELS.length) : 1, src: "country", nogeo: true });
    });

    // 5) tarjetas curadas (personajes, sucesos, curiosidades) y su cadena de desbloqueo
    (A.CODEX_CURATED || []).forEach(c => {
      const [id, type, wiki, es, lat, lon, trig] = c;
      add({ id, type, name: { en: wiki, es }, wiki, lat, lon, country: null, fact: { en: "", es: "" }, rarity: type === "person" ? 2 : type === "event" ? 1 : 1, src: "curated", triggers: trig, nogeo: true });
      trig.forEach(t => (chain[t] = chain[t] || []).push(id));
    });
    // los personajes sin nada relacionado no existen; el resto se numera
    order.forEach((id, i) => { E[id].no = i + 1; });
  }

  /* ================================================================== desbloqueo */
  const isUnlocked = id => !!store.unlocked[id];
  function unlockOne(id, tier, out) {
    if (!E[id] || store.unlocked[id]) return false;
    store.unlocked[id] = { t: Date.now(), tier }; out.push(id); return true;
  }
  /* Desbloqueo por PRECISION (km al objetivo; 0 = dentro del pais):
       <= 100 km  el lugar (y su pais)      <= 50 km  sucesos y curiosidades relacionados      <= 40 km  personajes y todo lo demas
     Las zonas enormes (mares, naturaleza, estrechos) tienen umbrales x2.  Devuelve { added: [ids], level: 0..3 }. */
  const LIM = [100, 50, 40];
  const SCALE = { water: 2, nature: 2, strait: 2 };
  A.codexUnlock = (q, km) => {
    const out = { added: [], level: 0 };
    if (km == null || !q.cid) return out;
    const first = E[q.cid[0]], sc = (first && SCALE[first.type]) || 1;
    const level = km <= LIM[2] * sc ? 3 : km <= LIM[1] * sc ? 2 : km <= LIM[0] * sc ? 1 : 0;
    out.level = level; if (!level) return out;
    const lateral = x => (E[x].type === "event" || E[x].type === "curiosity" || E[x].type === "battle") ? 2 : 3;
    for (const cid of q.cid) {
      const e = E[cid]; if (!e) continue;
      unlockOne(cid, level, out.added);
      if (e.country && E["c:" + e.country]) unlockOne("c:" + e.country, level, out.added);
      for (const x of (chain[cid] || []).concat(e.country ? chain["c:" + e.country] || [] : [])) if (level >= lateral(x)) unlockOne(x, level, out.added);
    }
    if (out.added.length) { save(); listeners.forEach(f => f(out.added)); prefetch(out.added); emitStats(); }
    return out;
  };
  const byType = () => { const cnt = {}; order.forEach(id => { const e = E[id], c = cnt[e.type] || (cnt[e.type] = [0, 0]); c[1]++; if (isUnlocked(id)) c[0]++; }); return cnt; };
  const emitStats = () => { if (A.ach) { const st = stats(); A.ach.emit("codex", { u: st.u, t: st.t, by: byType() }); } };
  A.continent = continent;

  /* ================================================================== Wikipedia (con cache en IndexedDB) */
  const db = new Promise(res => { try { const r = indexedDB.open("atlasiq-codex", 1); r.onupgradeneeded = () => r.result.createObjectStore("wiki"); r.onsuccess = () => res(r.result); r.onerror = () => res(null); } catch (e) { res(null); } });
  const idb = {
    get: k => db.then(d => (d ? new Promise(res => { try { const q = d.transaction("wiki").objectStore("wiki").get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(null); } catch (e) { res(null); } }) : null)),
    set: (k, v) => db.then(d => d && new Promise(res => { try { const t = d.transaction("wiki", "readwrite"); t.objectStore("wiki").put(v, k); t.oncomplete = res; t.onerror = res; } catch (e) { res(); } })),
  };
  const enc = encodeURIComponent;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const getJSON = async url => {                                     // reintenta con espera si Wikipedia pide calma (429/503)
    for (let i = 0; ; i++) {
      const r = await fetch(url);
      if (r.ok) return r.json();
      if ((r.status === 429 || r.status === 503) && i < 4) { await wait((+r.headers.get("retry-after") || 0) * 1000 || 700 * (i + 1)); continue; }
      throw new Error(r.status);
    }
  };
  const api = lang => `https://${lang}.wikipedia.org/w/api.php`;
  const summary = (lang, title) => getJSON(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${enc(title.replace(/ /g, "_"))}?redirect=true`);
  const queue = { n: 0, q: [] };
  const run = fn => new Promise((res, rej) => { const go = () => { queue.n++; fn().then(res, rej).finally(() => { queue.n--; const nx = queue.q.shift(); if (nx) nx(); }); }; queue.n < 2 ? go() : queue.q.push(go); });
  const NOHIST = /etimolog|etymolog|toponym|nombre|name|nom$|referenc|see also|v[eé]ase|notes|externa|external|bibliog|further|gallery|galer/i;
  const HIST = /^(history|historia|histoire|história|geschichte|storia|early life|biography|biografía|biographie|biografia|biographie|leben)/i;
  const strip = h => String(h || "").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();

  function okGeo(e, s) {
    if (e.nogeo || e.lat == null || !s.coordinates) return true;
    const lim = ["nature", "water", "strait", "country"].includes(e.type) ? 1800 : 300;
    return hav(e.lat, e.lon, s.coordinates.lat, s.coordinates.lon) < lim;
  }
  async function findTitle(e) {
    const c = await idb.get("t:" + e.id); if (c) return c;
    const norm = x => String(x).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
    if (["city", "capital", "place"].includes(e.type) && e.lat != null && !e.nogeo && !WIKI_OVERRIDE[e.id]) {   // ciudades: el articulo de ese nombre mas cercano a las coordenadas (evita homonimos)
      try {
        const g = await run(() => getJSON(`${api("en")}?action=query&list=geosearch&gscoord=${e.lat}|${e.lon}&gsradius=10000&gslimit=500&format=json&origin=*`)), nm = norm(e.name.en);
        const hit = (g.query.geosearch || []).find(x => { const t = norm(x.title); return t === nm || (t.startsWith(nm + ", ") && !/\(/.test(t)); });
        if (hit) { idb.set("t:" + e.id, hit.title); return hit.title; }
      } catch (x) { /* siguiente */ }
    }
    const cands = [...new Set([WIKI_OVERRIDE[e.id] ? "" : e.full, e.wiki, e.name.en].filter(Boolean))];
    for (const t of cands) {
      try { const s = await run(() => summary("en", t)); if (s.type === "disambiguation") continue; if (okGeo(e, s)) { idb.set("t:" + e.id, s.title); return s.title; } } catch (x) { /* siguiente candidato */ }
    }
    if (e.lat != null && !e.nogeo) {                                   // respaldo: articulo mas cercano cuyo titulo se parezca
      try {
        const g = await run(() => getJSON(`${api("en")}?action=query&list=geosearch&gscoord=${e.lat}|${e.lon}&gsradius=10000&gslimit=40&format=json&origin=*`));
        const first = e.name.en.split(/[ ,]/)[0].toLowerCase(), hit = (g.query.geosearch || []).find(x => x.title.toLowerCase().includes(first));
        if (hit) { idb.set("t:" + e.id, hit.title); return hit.title; }
      } catch (x) { /* sin respaldo */ }
    }
    return null;
  }
  function pickImg(s) {
    const o = s.originalimage, t = s.thumbnail; if (!o && !t) return null;
    const mk = w => (o && o.width <= w) || !t ? (o || t).source : t.source.replace(/\/\d+px-/, "/" + w + "px-");
    return { thumb: mk(500), card: mk(960), hd: mk(o && o.width >= 1920 ? 1920 : 1280), w: (o || t).width, h: (o || t).height };
  }
  const BAD_IMG = /flag|bandera|drapeau|coat[_ ]of[_ ]arms|escudo|emblem|seal[_ ]|logo|locator|location|map[_ .]|mapa|blank|symbol|icon[_.]|\.svg|signature|stamp|banner|diagram|montage|(^|[_ ])(chart|graph|table|timeline|scan|page|text|tablet|coin|tree|genealogy)|inscription|distribution|extent|territor|evolution|comparison|constitution/i;
  const fromFile = (fn, w) => `https://commons.wikimedia.org/wiki/Special:FilePath/${enc(fn)}?width=${w}`;
  async function betterImage(lang, title, e) {                       // si la foto principal es una bandera/escudo/mapa, busca la primera foto real del articulo
    if (e && e.type === "country") {                             // un pais se ilustra mejor con su turismo que con su bandera
      for (const t of ["Tourism in " + e.wiki, "Tourism in the " + e.wiki]) {
        try { const ts = await run(() => summary("en", t)), src = (ts.originalimage || {}).source || ""; if (/\.jpe?g/i.test(src.split("?")[0]) && !BAD_IMG.test(src.split("?")[0].split("/").pop())) { const im = pickImg(ts); im.file = decodeURIComponent(src.split("?")[0].split("/").pop().replace(/^\d+px-/, "")); return im; } } catch (x) { /* siguiente */ }
      }
    }
    try {
      const j = await run(() => getJSON(`https://${lang}.wikipedia.org/api/rest_v1/page/media-list/${enc(title.replace(/ /g, "_"))}`));
      const it = (j.items || []).filter(x => x.type === "image" && x.title && !BAD_IMG.test(x.title) && /\.(jpe?g|png|webp)$/i.test(x.title)).slice(0, 12)[0];
      if (!it) return null; const fn = it.title.replace(/^[^:]+:/, "").replace(/ /g, "_");
      return { thumb: fromFile(fn, 500), card: fromFile(fn, 960), hd: fromFile(fn, 1920), file: fn };
    } catch (x) { return null; }
  }
  async function imageCredit(src) {
    try {
      let fn = /[\/]/.test(src) ? decodeURIComponent(src.split("?")[0].split("/").pop().replace(/^\d+px-/, "")) : src.replace(/_/g, " "); if (/\.svg\.png$/i.test(fn)) fn = fn.replace(/\.png$/i, "");
      const j = await run(() => getJSON(`https://commons.wikimedia.org/w/api.php?action=query&titles=File:${enc(fn)}&prop=imageinfo&iiprop=extmetadata&iiextmetadatafilter=Artist|LicenseShortName&format=json&origin=*`));
      const md = ((Object.values(j.query.pages)[0].imageinfo || [])[0] || {}).extmetadata || {};
      return { artist: strip(md.Artist && md.Artist.value).slice(0, 90), license: strip(md.LicenseShortName && md.LicenseShortName.value), page: `https://commons.wikimedia.org/wiki/File:${enc(fn)}` };
    } catch (x) { return null; }
  }
  async function sections(lang, title) {
    try {
      const j = await run(() => getJSON(`${api(lang)}?action=query&prop=extracts&explaintext=1&exsectionformat=wiki&redirects=1&titles=${enc(title)}&format=json&origin=*`));
      const text = (Object.values(j.query.pages)[0].extract || "").replace(/\r/g, "");
      const parts = text.split(/\n(?=={2,}\s*[^=\n]+?\s*={2,}\s*\n)/), intro = parts.shift() || "";
      const all = parts.map(p => { const m = p.match(/^(={2,})\s*([^=\n]+?)\s*={2,}\s*\n([\s\S]*)$/); return m ? { l: m[1].length, h: m[2], t: m[3].trim() } : null; }).filter(Boolean);
      const trim = (s, n) => { s = s.replace(/\n{3,}/g, "\n\n").trim(); if (s.length <= n) return s; const cut = s.slice(0, n), i = Math.max(cut.lastIndexOf("\n"), cut.lastIndexOf(". ")); return (i > n * 0.5 ? cut.slice(0, i + 1) : cut).trim() + (i > n * 0.5 ? "" : "…"); };
      const grab = k => { let txt = all[k].t; for (let m = k + 1; m < all.length && all[m].l > all[k].l; m++) txt += "\n\n" + all[m].t; return txt.trim(); };
      let k = all.findIndex(x => x.l === 2 && HIST.test(x.h) && grab(all.indexOf(x)).length > 120);
      if (k < 0) k = all.findIndex(x => x.l === 2 && !NOHIST.test(x.h) && grab(all.indexOf(x)).length > 200);
      const h = k >= 0 ? { h: all[k].h, t: grab(k) } : null;
      return { history: h ? trim(h.t, 1500) : "", historyTitle: h ? h.h : "", full: trim(intro.split("\n").slice(1).join("\n") || intro, 2000) };
    } catch (x) { return { history: "", historyTitle: "", full: "" }; }
  }
  const contentMem = {};
  async function loadContent(e, lang, force) {
    const key = lang + ":" + e.id;
    if (!force && contentMem[key]) return contentMem[key];
    if (!force) { const pk = await A.wiki.get(e.id, lang); if (pk) return (contentMem[key] = pk); }
    const c = !force && (await idb.get(key)); if (c && Date.now() - c.t < 30 * 864e5) return (contentMem[key] = c);
    const enTitle = await findTitle(e); if (!enTitle) return (contentMem[key] = { none: true, t: Date.now(), lang });
    let title = enTitle, wl = "en";
    if (lang !== "en") {
      try { const ll = await run(() => getJSON(`${api("en")}?action=query&prop=langlinks&titles=${enc(enTitle)}&lllang=${lang}&redirects=1&format=json&origin=*`)); const t = (Object.values(ll.query.pages)[0].langlinks || [])[0]; if (t) { title = t["*"]; wl = lang; } } catch (x) { /* ingles */ }
    }
    let s; try { s = await run(() => summary(wl, title)); } catch (x) { if (wl !== "en") { wl = "en"; title = enTitle; s = await run(() => summary("en", enTitle)); } else throw x; }
    let img = pickImg(s), cred = null;
    const srcName = (s.originalimage || s.thumbnail || {}).source || "";
    if (!img || BAD_IMG.test(decodeURIComponent(srcName.split("?")[0].split("/").pop())) || ["country", "event"].includes(e.type) && /\.svg/i.test(srcName)) { const bi = await betterImage(wl, s.title, e); if (bi) { img = bi; cred = await imageCredit(bi.file); } }
    else cred = await imageCredit(srcName);
    const sec = await sections(wl, s.title);
    const rec = { t: Date.now(), lang: wl, title: s.title, desc: s.description || "", extract: s.extract || "", history: sec.history, historyTitle: sec.historyTitle, more: sec.full, url: s.content_urls && s.content_urls.desktop && s.content_urls.desktop.page, img, credit: cred };
    idb.set(key, rec); return (contentMem[key] = rec);
  }
  function prefetch(ids) { ids.slice(0, 4).forEach(id => loadContent(E[id], A.lang).then(() => notify("content", id)).catch(() => {})); }
  const notifiers = []; const notify = (k, id) => notifiers.forEach(f => f(k, id));

  /* ================================================================== interfaz */
  const ui = { built: false, filter: "all", sort: "recent", only: false, q: "", shown: 0, list: [], cur: null, tilt: null };
  const nameOf = (e, rec) => (A.lang === "es" && e.name.es) || (rec && rec.title && rec.lang === A.lang ? rec.title : "") || (A.lang === "en" ? e.name.en : e.name.es || e.name.en);
  const rarDots = r => A.icon("g_" + r, "gem").repeat(r + 1);
  const contOf = e => A.t(CONT[continent(e.lat, e.lon)]);
  const fmtNo = n => "Nº " + String(n).padStart(3, "0");

  function buildUI() {
    if (ui.built) return; ui.built = true;
    const root = document.createElement("div"); root.id = "codex"; root.className = "hidden"; root.setAttribute("role", "dialog");
    root.innerHTML = `
      <div class="cx-shell">
        <header class="cx-head">
          <button class="cx-x" id="cxBack" type="button">${A.icon("u_back", "sm")}<b data-cx="back"></b></button>
          <div class="cx-title"><h2 data-cx="title"></h2><p id="cxProg"></p><div class="cx-bar"><i id="cxBar"></i></div></div>
          <label class="cx-search"><input id="cxSearch" type="search" autocomplete="off"></label>
        </header>
        <nav class="cx-filters" id="cxFilters"></nav>
        <div class="cx-tools">
          <button class="cx-chip" id="cxOnly" type="button" role="switch" aria-checked="false"><i></i><span data-cx="only"></span></button>
          <div class="cx-sort" id="cxSort"></div>
        </div>
        <main class="cx-grid" id="cxGrid"></main>
        <section class="cx-detail hidden" id="cxDetail"></section>
        <div class="cx-light hidden" id="cxLight"></div>
      </div>`;
    $("app").appendChild(root);
    $("cxBack").onclick = () => (ui.cur ? closeDetail() : close());
    $("cxSearch").oninput = e => { ui.q = e.target.value.trim().toLowerCase(); renderGrid(true); };
    $("cxOnly").onclick = () => { ui.only = !ui.only; $("cxOnly").setAttribute("aria-checked", ui.only); renderGrid(true); A.sfx.flip(ui.only); };
    root.addEventListener("keydown", e => { if (e.key === "Escape") { e.stopPropagation(); $("cxLight").classList.contains("hidden") ? (ui.cur ? closeDetail() : close()) : $("cxLight").classList.add("hidden"); } });
    const sent = document.createElement("div"); sent.id = "cxSent"; sent.className = "cx-sent"; $("cxGrid").appendChild(sent);
    new IntersectionObserver(en => { if (en.some(x => x.isIntersecting)) more(); }, { root: $("cxGrid"), rootMargin: "600px" }).observe(sent);
    notifiers.push((k, id) => { if (k === "content" && !$("codex").classList.contains("hidden")) { paintThumb(id); if (ui.cur === id) renderDetail(id); } });
  }
  function labels() {
    document.querySelectorAll("#codex [data-cx]").forEach(el => { const k = { back: "codex.back", title: "codex.title", only: "codex.only" }[el.dataset.cx]; el.textContent = A.t(k); });
    $("cxSearch").placeholder = A.t("codex.search");
    const st = stats(); $("cxProg").textContent = A.t("codex.progress", { a: A.fmt(st.u), b: A.fmt(st.t) }); $("cxBar").style.width = (100 * st.u / Math.max(1, st.t)) + "%";
    // filtros por tipo con contadores
    const cnt = {}; order.forEach(id => { const e = E[id], c = cnt[e.type] || (cnt[e.type] = [0, 0]); c[1]++; if (isUnlocked(id)) c[0]++; });
    const f = $("cxFilters"); f.innerHTML = "";
    [["all", A.t("codex.all"), st.u, st.t], ...TYPES.filter(t => cnt[t]).map(t => [t, typeLabel(t), cnt[t][0], cnt[t][1]])].forEach(([k, n, u, t]) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "cx-chip f" + (ui.filter === k ? " on" : ""); b.dataset.f = k;
      b.innerHTML = `${k === "all" ? "" : iconSvg(k)}<span>${n}</span><em>${u}/${t}</em>`; b.onclick = () => { ui.filter = k; A.sfx.ui(); labels(); renderGrid(true); }; f.appendChild(b);
    });
    const so = $("cxSort"); so.innerHTML = "";
    [["recent", "codex.sort.recent"], ["az", "codex.sort.az"], ["rarity", "codex.sort.rarity"]].forEach(([k, key]) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "cx-chip" + (ui.sort === k ? " on" : ""); b.textContent = A.t(key); b.onclick = () => { ui.sort = k; A.sfx.ui(); labels(); renderGrid(true); }; so.appendChild(b);
    });
  }
  function stats() { let u = 0; order.forEach(id => { if (isUnlocked(id)) u++; }); return { u, t: order.length }; }
  A.codexStats = stats;

  function sortedList() {
    const q = ui.q, list = order.filter(id => {
      const e = E[id]; if (ui.filter !== "all" && e.type !== ui.filter) return false;
      const un = isUnlocked(id); if (ui.only && !un) return false;
      if (q) { if (!un) return false; const rec = contentMem[A.lang + ":" + id]; return (nameOf(e, rec) + " " + e.name.en + " " + (e.name.es || "")).toLowerCase().includes(q); }
      return true;
    });
    const nm = id => nameOf(E[id], contentMem[A.lang + ":" + id]).toLowerCase();
    if (ui.sort === "az") list.sort((a, b) => (isUnlocked(b) - isUnlocked(a)) || nm(a).localeCompare(nm(b), A.lang));
    else if (ui.sort === "rarity") list.sort((a, b) => (isUnlocked(b) - isUnlocked(a)) || (E[b].rarity - E[a].rarity) || (E[a].no - E[b].no));
    else list.sort((a, b) => ((store.unlocked[b] ? store.unlocked[b].t : 0) - (store.unlocked[a] ? store.unlocked[a].t : 0)) || (E[a].no - E[b].no));
    return list;
  }
  function renderGrid(reset) {
    ui.list = sortedList(); if (reset) { $("cxGrid").querySelectorAll(".cx-card, .cx-empty").forEach(n => n.remove()); ui.shown = 0; $("cxGrid").scrollTop = 0; }
    if (!ui.list.length) { const d = document.createElement("div"); d.className = "cx-empty"; d.textContent = A.t("codex.empty"); $("cxGrid").insertBefore(d, $("cxSent")); return; }
    more();
  }
  function more() {
    const g = $("cxGrid"), sent = $("cxSent"); if (ui.shown >= ui.list.length) return;
    const frag = document.createDocumentFragment();
    for (const id of ui.list.slice(ui.shown, ui.shown + 48)) frag.appendChild(cardEl(id));
    ui.shown = Math.min(ui.list.length, ui.shown + 48); g.insertBefore(frag, sent); A.genFill($("codex"));
  }
  const io = new IntersectionObserver(en => en.forEach(x => { if (x.isIntersecting) { io.unobserve(x.target); paintThumb(x.target.dataset.id); } }), { rootMargin: "300px" });
  function cardEl(id) {
    const e = E[id], un = isUnlocked(id), b = document.createElement("button"); b.type = "button"; b.dataset.id = id;
    b.className = `cx-card r${e.rarity} ${un ? "open" : "locked"}${un && !store.seen[id] ? " fresh" : ""}`;
    const rec = contentMem[A.lang + ":" + id];
    b.innerHTML = `<span class="cx-art">${un ? `<img class="cx-ph" alt="" data-gen="type_${e.type}">` : `${A.icon("lock", "q")}`}${iconSvg(e.type)}</span>
      ${ixs(e)}<span class="cx-nm">${un ? nameOf(e, rec) : "· · ·"}</span>
      <span class="cx-mt"><em>${typeLabel(e.type)}</em><i>${rarDots(e.rarity)}</i></span><span class="cx-no">${fmtNo(e.no)}</span>${un && !store.seen[id] ? `<span class="cx-new">${A.t("codex.new")}</span>` : ""}`;
    b.setAttribute("data-tt", un ? nameOf(e, rec) + "\n" + typeLabel(e.type)
      : A.tip6("Sin descubrir|Undiscovered|Non découvert|Não descoberto|Unentdeckt|Non scoperto") + "\n" + typeLabel(e.type) + " · " + A.tip6("se descubre al situarlo bien en una partida|found by placing it well in a game|à découvrir en le plaçant bien en partie|descoberto ao posicioná-lo bem numa partida|wird entdeckt, wenn du ihn gut platzierst|si scopre piazzandolo bene in partita"));
    b.onclick = () => openDetail(id);
    b.addEventListener("pointermove", ev => tiltMove(b, ev, 7)); b.addEventListener("pointerleave", () => tiltReset(b));
    if (un) io.observe(b);
    return b;
  }
  async function paintThumb(id) {
    const b = $("cxGrid") && $("cxGrid").querySelector(`.cx-card[data-id="${CSS.escape(id)}"]`); if (!b || !isUnlocked(id)) return;
    try {
      const rec = await loadContent(E[id], A.lang); if (rec.none) return;
      b.querySelector(".cx-nm").textContent = nameOf(E[id], rec);
      if (rec.img && !b.querySelector(".cx-art img:not(.cx-ph):not(.cx-ic)")) { const im = new Image(); im.decoding = "async"; im.alt = ""; im.onload = () => { b.querySelector(".cx-art").prepend(im); b.classList.add("has-img"); }; im.src = rec.img.thumb; }
    } catch (x) { /* sin conexion: se queda el icono */ }
  }
  function tiltMove(el, ev, deg) {
    const r = el.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width - 0.5, y = (ev.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", (-y * deg).toFixed(2) + "deg"); el.style.setProperty("--ry", (x * deg).toFixed(2) + "deg"); el.style.setProperty("--gx", (x * 100 + 50).toFixed(0) + "%"); el.style.setProperty("--gy", (y * 100 + 50).toFixed(0) + "%");
  }
  const tiltReset = el => { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); };

  /* ---------------- detalle ---------------- */
  function relatedOf(e) {
    const ids = new Set();
    if (e.src === "curated") (e.triggers || []).forEach(t => { if (E[t]) ids.add(t); });
    (chain[e.id] || []).forEach(x => ids.add(x));
    if (e.country && E["c:" + e.country]) ids.add("c:" + e.country);
    if (e.type === "country") (chain[e.id] || []).forEach(x => ids.add(x));
    ids.delete(e.id); return [...ids].slice(0, 14);
  }
  function openDetail(id) {
    ui.cur = id; const e = E[id]; store.seen[id] = 1; save(); A.sfx.card();
    $("cxDetail").classList.remove("hidden"); $("cxGrid").classList.add("hidden"); $("cxFilters").classList.add("hidden"); document.querySelector("#codex .cx-tools").classList.add("hidden");
    renderDetail(id); $("cxDetail").scrollTop = 0;
    const b = $("cxGrid").querySelector(`.cx-card[data-id="${CSS.escape(id)}"]`); if (b) { b.classList.remove("fresh"); const n = b.querySelector(".cx-new"); if (n) n.remove(); }
  }
  function closeDetail() {
    ui.cur = null; $("cxDetail").classList.add("hidden"); $("cxGrid").classList.remove("hidden"); $("cxFilters").classList.remove("hidden"); document.querySelector("#codex .cx-tools").classList.remove("hidden"); A.sfx.ui();
  }
  async function renderDetail(id) {
    const e = E[id], un = isUnlocked(id), d = $("cxDetail"), rec = un ? contentMem[A.lang + ":" + id] : null;
    const rel = relatedOf(e).map(x => { const o = E[x], u = isUnlocked(x); return `<button class="cx-rel ${u ? "" : "lk"}" data-id="${x}" type="button">${iconSvg(o.type)}<span>${u ? nameOf(o, contentMem[A.lang + ":" + x]) : "???"}</span></button>`; }).join("");
    const factLine = un ? A.tx(e.fact) : "";
    d.innerHTML = `
      <div class="cx-d-wrap">
        <div class="cx-d-card"><div class="cx-bigcard r${e.rarity} ${un ? "open" : "locked"}" id="cxBig">
          <div class="cx-art">${un ? `<img class="cx-ph" alt="" data-gen="type_${e.type}">` : `${A.icon("lock", "q")}`}${iconSvg(e.type)}${rec && rec.img ? `<img id="cxHero" alt="" src="${rec.img.card}" decoding="async">` : ""}</div>
          ${ixs(e)}<div class="cx-cap"><span class="cx-nm">${un ? nameOf(e, rec) : A.t("codex.locked")}</span><span class="cx-mt"><em>${typeLabel(e.type)}</em><i>${rarDots(e.rarity)}</i></span></div><span class="cx-no">${fmtNo(e.no)}</span><span class="cx-foil"></span>
        </div>
        ${rec && rec.img && rec.credit ? `<p class="cx-credit">${A.t("codex.photo")}: ${rec.credit.artist ? rec.credit.artist + " · " : ""}<a href="${rec.credit.page}" target="_blank" rel="noopener">${rec.credit.license || "Wikimedia Commons"}</a></p>` : ""}
        ${rec && rec.img ? `<button class="cx-hd" id="cxHd" type="button">${A.icon("a_lens", "sm")}${A.t("codex.hd")}</button>` : ""}</div>
        <div class="cx-d-body">
          <div class="cx-d-tags"><span class="tag">${typeLabel(e.type)}</span><span class="tag r">${A.t("rar." + RARITY[e.rarity])} ${rarDots(e.rarity)}</span>${e.lat != null ? `<span class="tag c">${A.icon("k_" + continent(e.lat, e.lon), "sm")}${contOf(e)}</span>` : ""}</div>
          <h2>${un ? nameOf(e, rec) : "???"}</h2>
          ${un && rec && rec.desc ? `<p class="cx-desc">${rec.desc}</p>` : ""}
          ${un ? "" : `<p class="cx-hint">${e.src === "curated" ? A.t("codex.hint.chain") : A.t("codex.hint.place")}</p>`}
          ${un && factLine ? `<blockquote class="cx-fact">${factLine}</blockquote>` : ""}
          ${un ? `<div class="cx-sec" id="cxText"><p class="cx-load">${A.t("codex.loading")}</p></div>` : ""}
          ${rel ? `<div class="cx-sec"><h3>${A.t("codex.related")}</h3><div class="cx-rels">${rel}</div></div>` : ""}
          ${un && e.lat != null ? `<div class="cx-sec"><h3>${A.t("codex.location")}</h3><canvas id="cxMini" class="cx-mini"></canvas><p class="cx-coord">${Math.abs(e.lat).toFixed(2)}°${e.lat >= 0 ? "N" : "S"}  ${Math.abs(e.lon).toFixed(2)}°${e.lon >= 0 ? "E" : "W"}</p></div>` : ""}
        </div>
      </div>`;
    $("cxBig").addEventListener("pointermove", ev => tiltMove($("cxBig"), ev, 12)); $("cxBig").addEventListener("pointerleave", () => tiltReset($("cxBig")));
    A.genFill(d); d.querySelectorAll(".cx-rel").forEach(b => (b.onclick = () => openDetail(b.dataset.id)));
    if ($("cxHd")) $("cxHd").onclick = () => lightbox(id); if ($("cxHero")) $("cxHero").onclick = () => lightbox(id);
    if (un && e.lat != null && map && $("cxMini")) requestAnimationFrame(() => { try { map.drawThumb($("cxMini"), { lat: e.lat, lon: e.lon, zoom: e.type === "country" ? 3 : e.type === "water" ? 3.5 : 9 }); } catch (x) { /* sin miniatura */ } });
    if (un) fillText(id);
  }
  async function fillText(id, force) {
    const e = E[id], box = () => document.getElementById("cxText"); let rec;
    try { rec = await loadContent(e, A.lang, force); } catch (x) { rec = null; }
    if (ui.cur !== id || !box()) return;
    if (!rec) { box().innerHTML = `<p class="cx-load err">${A.t("codex.offline")} <button class="cx-retry" type="button">${A.t("codex.retry")}</button></p>`; box().querySelector(".cx-retry").onclick = () => { box().innerHTML = `<p class="cx-load">${A.t("codex.loading")}</p>`; fillText(id, true); }; return; }
    if (rec.none) { box().innerHTML = `<p class="cx-load">${A.t("codex.nodesc")}</p>`; return; }
    const par = t => String(t || "").split(/\n{2,}|\n/).filter(x => x.trim()).map(x => `<p>${x.replace(/</g, "&lt;")}</p>`).join("");
    const heroWanted = rec.img && !$("cxHero");
    box().innerHTML = `<h3>${A.t("codex.about")}</h3>${par(rec.extract)}${rec.history ? `<h3>${A.t("codex.history")}</h3>${par(rec.history)}` : rec.more ? `<h3>${A.t("codex.history")}</h3>${par(rec.more)}` : ""}
      <p class="cx-src">${A.t("codex.license")} · <a href="${rec.url || "#"}" target="_blank" rel="noopener">${A.t("codex.wiki")} ↗</a></p>`;
    if (heroWanted) renderDetail(id);
  }
  function lightbox(id) {
    const rec = contentMem[A.lang + ":" + id], L = $("cxLight"); if (!rec || !rec.img) return;
    L.innerHTML = `<img alt="" src="${rec.img.hd}"><button type="button" class="cx-lx" aria-label="${A.t("codex.close")}">${A.icon("u_close")}</button><p>${rec.credit ? (rec.credit.artist ? rec.credit.artist + " · " : "") + (rec.credit.license || "") : ""}</p>`;
    L.classList.remove("hidden"); L.onclick = () => L.classList.add("hidden"); A.sfx.card();
  }

  /* ---------------- abrir / cerrar / aviso de tarjeta nueva ---------------- */
  function open(id) {
    buildUI(); const root = $("codex"); root.classList.remove("hidden"); document.body.classList.add("cx-on"); labels(); ui.cur = null;
    $("cxDetail").classList.add("hidden"); $("cxGrid").classList.remove("hidden"); $("cxFilters").classList.remove("hidden"); document.querySelector("#codex .cx-tools").classList.remove("hidden");
    renderGrid(true); root.tabIndex = -1; root.focus({ preventScroll: true }); A.sfx.card();
    if (id && E[id]) openDetail(id);
  }
  function close() { const r = $("codex"); if (r) r.classList.add("hidden"); document.body.classList.remove("cx-on"); ui.cur = null; A.sfx.ui(); if (A.codexOnClose) A.codexOnClose(); }
  const isOpen = () => !!$("codex") && !$("codex").classList.contains("hidden");

  let toastT = 0;
  function toast(ids) {
    if (!ids.length) return;
    let el = $("cxToast"); if (!el) { el = document.createElement("button"); el.id = "cxToast"; el.type = "button"; el.className = "cx-toast hidden"; $("app").appendChild(el); }
    const e = E[ids[0]], more = ids.length - 1;
    el.innerHTML = `<span class="cx-tcard r${e.rarity}"><span class="cx-art">${iconSvg(e.type)}</span></span><span class="cx-tt"><em>${A.t("codex.new")} · ${typeLabel(e.type)}</em><b>${nameOf(e, contentMem[A.lang + ":" + ids[0]])}</b>${more > 0 ? `<i>${A.t("codex.newmore", { n: more })}</i>` : ""}</span>`;
    el.onclick = () => { el.classList.add("hidden"); open(ids[0]); };
    el.classList.remove("hidden", "in"); void el.offsetWidth; el.classList.add("in"); clearTimeout(toastT); toastT = setTimeout(() => el.classList.add("hidden"), 7000);
    loadContent(e, A.lang).then(rec => { if (rec && rec.img && el.isConnected) { const im = new Image(); im.onload = () => { const a = el.querySelector(".cx-art"); if (a) a.prepend(im); }; im.src = rec.img.thumb; im.alt = ""; } }).catch(() => {});
  }
  listeners.push(added => { setTimeout(() => { A.sfx.unlock(); toast(added); }, 1700); });

  A.codex = {
    init(w, m) { world = w; map = m; load(); build(); },
    open, close, isOpen, stats, entry: id => E[id], has: id => !!E[id],
    unlocked: () => order.filter(isUnlocked), total: () => order.length,
    isUnlocked: id => !!store.unlocked[id],
    _load: (id, lang) => loadContent(E[id], lang || A.lang),
    ids: () => order.slice(),
    reset() { store = { unlocked: {}, seen: {} }; save(); ui.cur = null; if (isOpen()) { labels(); renderGrid(true); } },
    byType,
    refresh() { if (isOpen()) { labels(); if (ui.cur) renderDetail(ui.cur); else renderGrid(true); } },
  };
})(window.AIQ);
