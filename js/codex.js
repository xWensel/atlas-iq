/*
 * Geolite - Enciclopedia geografica (v0.5).
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
  const TYPES = ["city", "capital", "country", "landmark", "nature", "water", "strait", "battle", "event", "history", "person", "curiosity", "place"];
  const TYPE_KEY = { person: "type.person", curiosity: "type.curiosity", history: "type.history" };
  const typeLabel = t => A.t(TYPE_KEY[t] || "kind." + t);
  const CONT = { af: "cont.af", na: "cont.na", sa: "cont.sa", as: "cont.as", eu: "cont.eu", oc: "cont.oc", an: "cont.an", sea: "cont.sea" };

  /* iconos propios por tipo (js/icons.js) */
  const TYPE_IC = { city: "t_city", capital: "t_capital", country: "t_country", landmark: "t_landmark", nature: "t_nature", water: "t_water", strait: "t_strait", battle: "t_battle", event: "t_event", history: "chronicler", person: "t_person", curiosity: "t_curio", place: "t_place" };
  /* cada tarjeta lleva indice de carta de poker: rango por rareza (5, 8, K, A) y palo geografico por tipo */
  const TYPE_SUIT = { city: "s_pin", capital: "s_compass", country: "s_compass", landmark: "s_peak", nature: "s_peak", water: "s_palm", strait: "s_palm", battle: "s_peak", event: "s_pin", history: "s_peak", person: "s_compass", curiosity: "s_palm", place: "s_pin" };
  const RANK = ["5", "8", "K", "A"], SUIT_RED = { s_pin: 1, s_compass: 1 };
  const ixs = () => "";                                              // las tarjetas ya no llevan indices de baraja
  const iconSvg = t => A.icon(TYPE_IC[t] || "t_place", "cx-ic");

  /* continente de un punto (etiqueta de la ficha, pista del Pasaporte en la Aventura y continentes de los retos del mapa, js/map.js).
     Antes Egipto salia en Asia, el Magreb, Siria, Irak e Iran en Europa y Tahiti, Samoa, Tonga, Costa Rica o Panama en Sudamerica */
  const AEG = [[40.0, 26.2], [39.2, 26.65], [38.6, 26.2], [38.3, 26.3], [37.75, 27.05], [37.0, 27.36], [36.7, 27.9], [36.55, 29.1]];   // islas griegas frente a Anatolia
  const aeg = lat => { for (let i = 1; i < AEG.length; i++) if (lat >= AEG[i][0]) { const [a, x] = AEG[i - 1], [b, y] = AEG[i]; return y + (x - y) * (lat - b) / (a - b); } return 99; };
  const isAf = (lat, lon) => {
    if (lat < -45 || lat > 37.6 || lon < -26 || lon > 64) return false;
    if (lat < 0) return true;                                                           // con Madagascar, Mauricio, Seychelles, Reunion y Santa Elena
    if (lon > 51.5) return false;                                                       // Socotra, Oman y el golfo Persico
    if (lat >= 12.5 && lon > (lat > 29.9 ? 32.6 - (lat - 29.9) * 0.2 : 32.6 + (30 - lat) * 0.615)) return false;   // Sinai, Levante y Arabia: al otro lado del canal de Suez y del mar Rojo
    if (lat <= 30) return true;
    return lon < -2 ? lat < 35.95 : lon < -0.6 ? lat < 36.4 : lon < 11.3 ? lat < 37.5 : lat < 34;   // costa mediterranea: Gibraltar, Argelia y Tunez / Lampedusa, Malta y Creta
  };
  const isEu = (lat, lon) => {
    if (lat > 58) return lon < 60 + (lat - 58) * 0.6;                                  // Urales del norte y Nueva Zembla
    if (lat > 51.3) return lon < 59.5;                                                  // Urales
    if (lat > 47) return lon < 51.6;                                                    // rio Ural hasta el Caspio
    if (lon >= 48.5) return false;                                                      // Caspio y Asia central
    if (lon >= 37.5) return lat > Math.min(43.4, 43.4 - (lon - 40) * 0.22);             // Caucaso: Sochi y el Elbrus en Europa; Georgia, Armenia y Azerbaiyan en Asia
    if (lon >= 29.02) return lat > 42.3 || (lat > 34.5 && lat < 35.8 && lon < 34.7);    // mar Negro (Crimea y Ucrania en Europa, Anatolia en Asia) y Chipre
    if (lon < 26.2) return true;
    if (lat > 40) return lat > (lon < 26.73 ? 40 + (lon - 26.18) * 0.78 : 40.75);       // Dardanelos y mar de Marmara: Tracia y el Estambul europeo en Europa
    return lon < aeg(lat);
  };
  const continent = (lat, lon) => {
    if (lat == null) return "sea";
    if (lat < -60 || (lat < -45 && lon > -30 && lon < 110)) return "an";              // y las islas subantarticas del Indico
    if (lat < 12 && (lon > 165 || lon < (lat < 0 ? -125 : -140))) return "oc";         // Polinesia, Micronesia y Melanesia del Pacifico (Hawai sigue con Norteamerica)
    if (lat > 62 && lon < -168.97) return "as";                                       // Chukotka, al otro lado del antimeridiano
    if (lon < -30 || (lat > 66.6 && lon < -12)) return lat > 12 || (lat > 7 && lon < -77.3) ? "na" : "sa";   // America (y Groenlandia); Centroamerica hasta Panama, con Norteamerica
    if (isAf(lat, lon)) return "af";
    if (lat < 0 ? lon >= 140.9 || (lat < -10.5 && lon > 112) : lon >= 130 && lat < 23) return "oc";   // Australia, Nueva Guinea oriental, Palaos, Guam, Micronesia (Indonesia y Timor, en Asia)
    return isEu(lat, lon) ? "eu" : "as";
  };

  /* continentes del MAPA (los retos que mueven continentes): la division de siempre, con la que estan afinadas las colocaciones sin solapes (dev/layouttest.js).
     La de arriba es la geografica (etiquetas y pista del Pasaporte); con ella el reto "hold" pisaba continentes */
  const continentMap = (lat, lon) => {
    if (lat == null) return "sea";
    if (lat < -60) return "an";
    if (lon < -30 && lat > 12) return "na"; if (lon < -30) return "sa";
    if (lon >= -30 && lon < 60 && lat > 34) return "eu"; if (lon >= -20 && lon < 52 && lat <= 37 && lat > -36 && !(lon > 34 && lat > 12 && lat < 34 && lon < 60)) return lat > 12 && lon > 26 && lat < 33 && lon < 36.5 ? "as" : "af";
    if (lon > 110 && lat < -8) return "oc"; if (lon > 112 && lon < 180 && lat < 0 && lat > -50) return "oc"; if (lon > 165 || lon < -150) return "oc";
    if (lon >= 130 && lat > -50 && lat < 23) return "oc";                 // Micronesia, Palau, Guam, Marianas y Marshall (Filipinas, Taiwan y Japon quedan fuera)
    if (lat < -8 && lon > 100) return "oc"; return lon >= 25 ? "as" : "eu";
  };

  /* ================================================================== datos */
  const E = {}, order = [], chain = {};
  let world = null, map = null, store = { unlocked: {}, seen: {} };
  const listeners = [];

  function load() { try { store = Object.assign({ unlocked: {}, seen: {} }, JSON.parse(localStorage.getItem(STORE) || "{}")); } catch (e) { /* vacio */ } }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(store)); } catch (e) { /* sin almacenamiento */ } }

  const WIKI_OVERRIDE = {
    "hermitage": "Hermitage Museum", "agram": "Zagreb", "davao": "Davao City", "tucuman": "San Miguel de Tucumán", "hanyang": "Seoul", "san-juan-puerto-rico": "San Juan, Puerto Rico", "red-fort": "Red Fort", "pentagon": "The Pentagon", "tea-party": "Boston Tea Party", "trinity-site": "Trinity (nuclear test)", "vegas-strip": "Las Vegas Strip",
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
      if (!cur.triggers && e.triggers) cur.triggers = e.triggers;     // Napoleon del Clasico + la tarjeta curada: sigue enlazando Paris, Waterloo...
      return cur;
    };
    /* 0) banco de lugares empaquetado (data/places.js): capitales, ciudades, monumentos, naturaleza, historia y paises */
    if (A.PLACES && A.PLACES.length) {
      const neBy = {}; A.PLACES.forEach(r => { if (r[1] === "country") neBy[r[6].en] = r[0].slice(2); });
      A.PLACES.forEach(([id, kind, tier, lat, lon, qc, names]) => {
        /* v0.20: el pais que se ve debajo (data/paises-lugares.js) */
        const qc1 = (A.PLACE_COUNTRIES && A.PLACE_COUNTRIES[id] && A.PLACE_COUNTRIES[id][0]) || qc, cnEn = qc1 && A.PCOUNTRY && A.PCOUNTRY[qc1] && A.PCOUNTRY[qc1].en, ne = (cnEn && (neBy[cnEn] || (world.byName[cnEn] ? cnEn : null))) || null;
        const type = kind === "history" ? (/^(battle|siege|fall of|.*\bwar\b|bombing|attack|normandy|gallipoli|dunkirk|tet )/i.test(names.en) ? "battle" : "event")   // igual que el tipo de la pregunta (js/adventure.js)
          : kind === "nature" ? (/\b(sea|ocean|gulf|bay)\b/i.test(names.en) ? "water" : /\b(strait|channel|canal|cape|drake|bosporus|bosphorus)\b/i.test(names.en) ? "strait" : "nature") : kind;
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
    // 3) modo Clasico: los destinos de sus 11 campanas
    (A.CLASSIC || []).forEach(g => g.levels.forEach((L, li) => {
      const r = rarityFor(li, g.levels.length);
      L.dests.forEach(d => {
        const clue = L.bonus && d.f, title = clue ? d.f : d.n, id = d.ck || A.ckey(title), base = title.replace(/\(.*?\)/g, "").split(",")[0].trim();   // d.ck: clave fija de Eventos y Personajes (reina Victoria != Victoria de Seychelles)
        let type = /capital/i.test(L.name) ? "capital" : /famous|unesco|heritage|places/i.test(L.name) ? "landmark" : /cit(y|ies)/i.test(L.name) ? "city" : "place";
        if (["city", "capital", "landmark", "nature"].includes(L.kind)) type = L.kind;
        if (L.kind === "character") type = "person";
        else if (L.kind === "event") type = /^(battle|siege|fall of)\b/i.test(title) ? "battle" : "event";
        else if (eventLike.test(base) || /^battle of|bomb dropped/i.test(title)) type = "event";
        add({ id, type, name: d.n6 ? { en: base, ...d.n6 } : { en: base, es: "" }, wiki: wikiFor(id, title), full: clue ? "" : title.replace(/\(.*?\)/g, "").trim(), lat: d.lat, lon: d.lon, country: countryFrom(title, g.id), fact: clue ? { en: "", es: "" } : { en: d.f, es: "", ...(d.f6 || {}) }, rarity: r, src: "classic" });
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
    // 6) cada lugar del banco tiene 3 entradas: el lugar (<= 300 km), su historia (<= 150 km) y su dato clave (<= 75 km)
    (A.PLACES || []).forEach(([id]) => {
      const p = E[id]; if (!p) return;
      add({ id: id + "~h", type: "history", name: p.name, wiki: p.wiki, lat: p.lat, lon: p.lon, country: p.country, fact: { en: "", es: "" }, rarity: 2, src: "tier", tier: 2, parent: id, nogeo: p.nogeo });
      add({ id: id + "~k", type: "curiosity", name: p.name, wiki: p.wiki, lat: p.lat, lon: p.lon, country: p.country, fact: { en: "", es: "" }, rarity: 3, src: "tier", tier: 3, parent: id, nogeo: p.nogeo });
    });
    // 7) solo existen las tarjetas que alguna pregunta puede desbloquear (A.codexUnlock): los restos del antiguo modo Extendido
    //    ("New York" junto a "New York City", el pueblo de cada batalla...) no salen en ninguna pregunta y dejaban imposible el logro Completista
    const asked = new Set();
    (A.PLACES || []).forEach(([id, kind, , lat]) => { if (kind === "country" ? world.byName[id.slice(2)] : lat != null) asked.add(id); });   // las mismas que acepta placeQ (js/adventure.js)
    (A.CLASSIC || []).forEach(g => g.levels.forEach(L => L.dests.forEach(d => asked.add(d.ck || A.ckey(L.bonus && d.f ? d.f : d.n)))));
    const reach = new Set();
    asked.forEach(id => {
      const e = E[id]; if (!e) return;
      [id, id + "~h", id + "~k", e.country ? "c:" + e.country : null].forEach(x => { if (x && E[x]) reach.add(x); });
      (chain[id] || []).concat(e.country ? chain["c:" + e.country] || [] : []).forEach(x => { if (E[x]) reach.add(x); });
    });
    for (let i = order.length - 1; i >= 0; i--) if (!reach.has(order[i])) { delete E[order[i]]; order.splice(i, 1); }
    // los personajes sin nada relacionado no existen; el resto se numera
    order.forEach((id, i) => { E[id].no = i + 1; });
  }

  /* ================================================================== desbloqueo */
  const isUnlocked = id => !!store.unlocked[id];
  function unlockOne(id, tier, out) {
    if (!E[id] || store.unlocked[id]) return false;
    store.unlocked[id] = { t: Date.now(), tier }; out.push(id); return true;
  }
  /* Desbloqueo por PRECISION (km al objetivo; 0 = dentro del pais). Cada lugar tiene 3 entradas:
       <= 300 km  el lugar (generica, y su pais)      <= 150 km  su historia + sucesos relacionados      <= 75 km  su dato clave + personajes y curiosidades
     Las zonas enormes (mares, naturaleza, estrechos) tienen umbrales x2.  Devuelve { added: [ids], level: 0..3 }. */
  const LIM = [300, 150, 75];
  const SCALE = { water: 2, nature: 2, strait: 2 };
  A.codexUnlock = (q, km) => {
    const out = { added: [], level: 0 };
    if (km == null || !q.cid) return out;
    const first = q.cid.map(c => E[c]).find(Boolean), sc = (first && SCALE[first.type]) || 1;   // las pistas llevan antes su propio id ("clue:<id>") y luego el del lugar
    const level = km <= LIM[2] * sc ? 3 : km <= LIM[1] * sc ? 2 : km <= LIM[0] * sc ? 1 : 0;
    out.level = level; if (!level) return out;
    const lateral = x => (E[x].type === "event" || E[x].type === "battle") ? 2 : 3;
    for (const cid of q.cid) {
      const e = E[cid]; if (!e) continue;
      unlockOne(cid, level, out.added);
      if (level >= 2 && E[cid + "~h"]) unlockOne(cid + "~h", level, out.added);
      if (level >= 3 && E[cid + "~k"]) unlockOne(cid + "~k", level, out.added);
      if (e.country && E["c:" + e.country]) unlockOne("c:" + e.country, level, out.added);
      for (const x of (chain[cid] || []).concat(e.country ? chain["c:" + e.country] || [] : [])) if (level >= lateral(x)) unlockOne(x, level, out.added);
    }
    if (out.added.length) { save(); listeners.forEach(f => f(out.added)); prefetch(out.added); emitStats(); }
    return out;
  };
  const byType = () => { const cnt = {}; order.forEach(id => { const e = E[id], c = cnt[e.type] || (cnt[e.type] = [0, 0]); c[1]++; if (isUnlocked(id)) c[0]++; }); return cnt; };
  const emitStats = () => { if (A.ach) { const st = stats(); A.ach.emit("codex", { u: st.u, t: st.t, by: byType() }); } };
  A.codexLimits = e => { const id = (e && e.cids && e.cids.find(c => E[c])) || (e && (e.parent || e.id)), sc = (E[id] && SCALE[E[id].type]) || 1; return LIM.map(x => x * sc); };   // cids: las pistas llevan antes "clue:<id>"
  A.continent = continent; A.continentMap = continentMap;

  /* ================================================================== contenido empaquetado (data/wiki + assets/wiki): nunca se consulta Wikipedia al jugar */
  const contentMem = {};
  const memOf = id => contentMem[A.wlang() + ":" + ((E[id] && E[id].parent) || id)];
  async function loadContent(e, lang) {
    if (e.parent) e = E[e.parent];
    const key = lang + ":" + e.id;
    if (contentMem[key]) return contentMem[key];
    const pk = await A.wiki.get(e.id, lang);
    return (contentMem[key] = pk || { none: true, t: Date.now(), lang });
  }
  function prefetch(ids) { [...new Set(ids.map(id => E[id].parent || id))].slice(0, 4).forEach(id => loadContent(E[id], A.wlang()).then(() => notify("content", id)).catch(() => {})); }
  const notifiers = []; const notify = (k, id) => notifiers.forEach(f => f(k, id));

  /* ================================================================== interfaz */
  const ui = { built: false, filter: "all", sort: "recent", only: false, q: "", shown: 0, list: [], cur: null, tilt: null };
  const nameOf = (e, rec) => e.parent ? nameOf(E[e.parent], rec) + " · " + A.t(e.tier === 2 ? "codex.tierh" : "codex.tierk") : e.name[A.lang] || e.name[A.wlang()] || (rec && rec.title && rec.lang === A.wlang() ? rec.title : "") || e.name.en || e.name.es;
  const esc = s => A.esc(s);                                           // textos de Wikipedia/Commons dentro de innerHTML
  const photo = u => (/\.svg$/i.test(u) ? "" : "cx-photo");           // fotos de Wikipedia/Commons: se reducen suavizadas (css/codex.css); el arte pixel y las banderas SVG siguen nitidos
  const fold = s => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();   // busqueda sin tildes ni mayusculas
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
    $("cxSearch").oninput = e => { ui.q = fold(e.target.value.trim()); renderGrid(true); };
    $("cxOnly").onclick = () => { ui.only = !ui.only; $("cxOnly").setAttribute("aria-checked", ui.only); renderGrid(true); A.sfx.flip(ui.only); };
    root.addEventListener("keydown", e => {
      if (e.key === "Escape") { e.stopPropagation(); $("cxLight").classList.contains("hidden") ? (ui.cur ? closeDetail() : close()) : $("cxLight").classList.add("hidden"); }
      else if (!/^[cfmn]$/i.test(e.key)) e.stopPropagation();          // Intro, espacio, P, 1-4, +/- y 0 no tocan la partida de detras (abierta desde el aviso)
    });
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
      if (q) { if (!un) return false; const rec = memOf(id); return fold(nameOf(e, rec) + " " + e.name.en + " " + (e.name.es || "") + " " + (rec && rec.title || "")).includes(q); }
      return true;
    });
    const nm = id => nameOf(E[id], memOf(id)).toLowerCase();
    if (ui.sort === "az") list.sort((a, b) => (isUnlocked(b) - isUnlocked(a)) || nm(a).localeCompare(nm(b), A.lang));
    else if (ui.sort === "rarity") list.sort((a, b) => (isUnlocked(b) - isUnlocked(a)) || (E[b].rarity - E[a].rarity) || (E[a].no - E[b].no));
    else list.sort((a, b) => ((store.unlocked[b] ? store.unlocked[b].t : 0) - (store.unlocked[a] ? store.unlocked[a].t : 0)) || (E[a].no - E[b].no));
    return list;
  }
  function renderGrid(reset) {
    ui.list = sortedList(); if (reset) { $("cxGrid").querySelectorAll(".cx-card, .cx-empty").forEach(n => { io.unobserve(n); n.remove(); }); ui.shown = 0; $("cxGrid").scrollTop = 0; }
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
    const rec = memOf(id);
    b.innerHTML = `<span class="cx-art">${un ? `<img class="cx-ph" alt="" data-gen="type_${e.type}">` : `${A.icon("lock", "q")}`}${iconSvg(e.type)}</span>
      ${ixs(e)}<span class="cx-nm">${un ? esc(nameOf(e, rec)) : "· · ·"}</span>
      <span class="cx-mt"><em>${typeLabel(e.type)}</em><i>${rarDots(e.rarity)}</i></span><span class="cx-no">${fmtNo(e.no)}</span>${un && !store.seen[id] ? `<span class="cx-new">${A.t("codex.new")}</span>` : ""}`;
    b.setAttribute("data-tt", un ? nameOf(e, rec) + "\n" + typeLabel(e.type)
      : A.tip6("Sin descubrir|Undiscovered|Non découvert|Não descoberto|Unentdeckt|Non scoperto||未发现|미발견|未発見|Не открыто|Nieodkryte") + "\n" + typeLabel(e.type) + " · " + A.tip6("se descubre al situarlo bien en una partida|found by placing it well in a game|à découvrir en le plaçant bien en partie|descoberto ao posicioná-lo bem numa partida|wird entdeckt, wenn du ihn gut platzierst|si scopre piazzandolo bene in partita||在游戏中准确标出即可发现|게임에서 정확히 맞히면 발견됩니다|ゲームでうまく当てると発見できる|открывается, если точно отметить в игре|odkrywasz, trafiając celnie w grze"));
    b.onclick = () => openDetail(id);
    b.addEventListener("pointermove", ev => tiltMove(b, ev, 7)); b.addEventListener("pointerleave", () => tiltReset(b));
    if (un) io.observe(b);
    return b;
  }
  async function paintThumb(id) {
    const b = $("cxGrid") && $("cxGrid").querySelector(`.cx-card[data-id="${CSS.escape(id)}"]`); if (!b || !isUnlocked(id)) return;
    try {
      const rec = await loadContent(E[id], A.wlang()); if (rec.none) return;
      b.querySelector(".cx-nm").textContent = nameOf(E[id], rec);
      if (rec.img && !b.querySelector(".cx-art img:not(.cx-ph):not(.cx-ic)")) { const im = new Image(); im.decoding = "async"; im.alt = ""; im.className = photo(rec.img.thumb); im.src = rec.img.thumb; A.revealImg(im, () => { const art = b.querySelector(".cx-art"); art.classList.toggle("flag", !!rec.img.flag); art.prepend(im); b.classList.add("has-img"); }); }
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
    if (e.parent) { ids.add(e.parent); ids.add(e.parent + (e.tier === 2 ? "~k" : "~h")); }
    else if (E[e.id + "~h"]) { ids.add(e.id + "~h"); ids.add(e.id + "~k"); }
    (e.triggers || []).forEach(t => { if (E[t]) ids.add(t); });
    (chain[e.id] || []).forEach(x => ids.add(x));
    if (e.country && E["c:" + e.country]) ids.add("c:" + e.country);
    if (e.type === "country") (chain[e.id] || []).forEach(x => ids.add(x));
    ids.delete(e.id); return [...ids].slice(0, 14);
  }
  function openDetail(id) {
    if (E[id] && !isUnlocked(id)) {                                                  // pulsas tarjetas bloqueadas: a la 3.a, la cerradura es suya
      ui.lockN = (ui.lockN || 0) + 1;
      if (ui.lockN >= 3) setTimeout(() => { const k = document.querySelector("#cxBig .cx-art .ic"); const S = A.core && A.core.S;
        if (k && !((S && S.reduce) || matchMedia("(prefers-reduced-motion: reduce)").matches)) k.animate([{ transform: "none" }, { transform: "rotate(-12deg)" }, { transform: "rotate(10deg)" }, { transform: "rotate(-6deg)" }, { transform: "none" }], { duration: 420 });
        if (A.dealer && A.dealer.codexLock) A.dealer.codexLock(ui.lockN); }, 150);
    }
    ui.cur = id; const e = E[id]; store.seen[id] = 1; save(); A.sfx.card();
    $("cxDetail").classList.remove("hidden"); $("cxGrid").classList.add("hidden"); $("cxFilters").classList.add("hidden"); document.querySelector("#codex .cx-tools").classList.add("hidden");
    renderDetail(id); $("cxDetail").scrollTop = 0;
    const b = $("cxGrid").querySelector(`.cx-card[data-id="${CSS.escape(id)}"]`); if (b) { b.classList.remove("fresh"); const n = b.querySelector(".cx-new"); if (n) n.remove(); }
  }
  function closeDetail() {
    ui.cur = null; $("cxDetail").classList.add("hidden"); $("cxGrid").classList.remove("hidden"); $("cxFilters").classList.remove("hidden"); document.querySelector("#codex .cx-tools").classList.remove("hidden"); A.sfx.ui();
  }
  async function renderDetail(id) {
    const e = E[id], un = isUnlocked(id), d = $("cxDetail"), rec = un ? memOf(id) : null;
    const rel = relatedOf(e).map(x => { const o = E[x], u = isUnlocked(x); return `<button class="cx-rel ${u ? "" : "lk"}" data-id="${esc(x)}" type="button">${iconSvg(o.type)}<span>${u ? esc(nameOf(o, memOf(x))) : "???"}</span></button>`; }).join("");
    const factLine = un ? A.tx(e.fact) : "";
    d.innerHTML = `
      <div class="cx-d-wrap">
        <div class="cx-d-card"><div class="cx-bigcard r${e.rarity} ${un ? "open" : "locked"}" id="cxBig">
          <div class="cx-art${rec && rec.img && rec.img.flag ? " flag" : ""}">${un ? `<img class="cx-ph" alt="" data-gen="type_${e.type}">` : `${A.icon("lock", "q")}`}${iconSvg(e.type)}${rec && rec.img ? `<img id="cxHero" class="${photo(rec.img.card)}" alt="" src="${esc(rec.img.card)}" decoding="async">` : ""}</div>
          ${ixs(e)}<div class="cx-cap"><span class="cx-nm">${un ? esc(nameOf(e, rec)) : A.t("codex.locked")}</span><span class="cx-mt"><em>${typeLabel(e.type)}</em><i>${rarDots(e.rarity)}</i></span></div><span class="cx-no">${fmtNo(e.no)}</span><span class="cx-foil"></span>
        </div>
        ${rec && rec.img && rec.credit ? `<p class="cx-credit">${A.t("codex.photo")}: ${rec.credit.artist ? esc(rec.credit.artist) + " · " : ""}<a href="${esc(rec.credit.page)}" target="_blank" rel="noopener">${esc(rec.credit.license || "Wikimedia Commons")}</a></p>` : ""}
        ${rec && rec.img ? `<button class="cx-hd" id="cxHd" type="button">${A.icon("a_lens", "sm")}${A.t("codex.hd")}</button>` : ""}</div>
        <div class="cx-d-body">
          <div class="cx-d-tags"><span class="tag">${typeLabel(e.type)}</span><span class="tag r">${A.t("rar." + RARITY[e.rarity])} ${rarDots(e.rarity)}</span>${e.lat != null ? `<span class="tag c">${A.icon("k_" + continent(e.lat, e.lon), "sm")}${contOf(e)}</span>` : ""}</div>
          <h2>${un ? esc(nameOf(e, rec)) : "???"}</h2>
          ${un && rec && rec.desc ? `<p class="cx-desc">${esc(rec.desc)}</p>` : ""}
          ${un ? "" : `<p class="cx-hint">${e.parent ? (A.core && A.core.S.units === "mi" ? A.t("codex.hint.tier").replace(/\{km\}\s*(?:km|公里|км)/, A.fmtDist(A.codexLimits(e)[e.tier - 1])) : A.t("codex.hint.tier", { km: A.codexLimits(e)[e.tier - 1] })) : e.src === "curated" ? A.t("codex.hint.chain") : A.t("codex.hint.place")}</p>`}
          ${un && factLine ? `<blockquote class="cx-fact">${esc(factLine)}</blockquote>` : ""}
          ${un ? `<div class="cx-sec" id="cxText"><p class="cx-load">${A.T("Cargando…", "Loading…")}</p></div>` : ""}
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
  async function fillText(id) {
    const e = E[id], box = () => document.getElementById("cxText"); let rec;
    try { rec = await loadContent(e, A.wlang()); } catch (x) { rec = null; }
    if (ui.cur !== id || !box()) return;
    if (!rec || rec.none) { box().innerHTML = `<p class="cx-load">${A.t("codex.nodesc")}</p>`; return; }
    const par = t => String(t || "").split(/\n{2,}|\n/).filter(x => x.trim()).map(x => `<p>${x.replace(/</g, "&lt;")}</p>`).join("");
    const heroWanted = rec.img && !$("cxHero");
    const T = tiers(rec), body = e.parent ? (e.tier === 2 ? T.hist : T.key) : T.intro, head = e.parent ? A.t(e.tier === 2 ? "codex.tierh" : "codex.tierk") : A.t("codex.about");
    const ttr = e.parent && rec.tierTr && rec.tierTr[e.tier === 2 ? "h" : "k"];   // este tier se tradujo a mano: se acredita y enlaza el original
    box().innerHTML = `<h3>${head}</h3>${par(body || rec.extract)}
      <p class="cx-src">${A.t(rec.tr || ttr ? "codex.license.tr" : "codex.license")} ·<a href="${esc((ttr && ttr.url) || rec.url || "#")}" target="_blank" rel="noopener">${A.t("codex.wiki")} ↗</a></p>`;
    if (heroWanted) renderDetail(id);
  }
  /* 3 textos a partir del articulo del lugar: generico (descripcion + inicio), historia y dato clave (el resto del texto de cabecera) */
  const tierMem = new WeakMap();
  const dangling = t => /[:：]\s*$/.test(t);                          // "...dijo:" o "son los siguientes:" sin la cita ni la lista que venian detras
  const undangle = t => { const ls = String(t || "").split("\n"); while (ls.length > 1 && dangling(ls[ls.length - 1])) ls.pop(); return ls.length === 1 && dangling(ls[0]) ? "" : ls.join("\n"); };
  function tiers(rec) {
    let T = tierMem.get(rec); if (!T) { T = tiers0(rec); T = { intro: undangle(T.intro) || T.intro, hist: undangle(T.hist), key: undangle(T.key) }; tierMem.set(rec, T); }
    return T;
  }
  function tiers0(rec) {
    const sents = A.sentences(A.cleanText(rec.extract)), hist = A.cleanText(rec.history).split(/\n+/).filter(x => x.trim());
    while (sents.length > 1 && dangling(sents[sents.length - 1])) sents.pop();
    const J = /^(zh|ja)$/.test(rec.lang) ? "" : " ";                  // chino y japones: las frases van pegadas, sin espacio
    let n = 0, len = 0; while (n < sents.length && (n < 2 || len < 200) && n < 3) len += sents[n++].length;
    const intro = sents.slice(0, n).join(J), rest = sents.slice(n);
    if (rec.key) return { intro: intro || A.cleanText(rec.extract), hist: hist.join("\n"), key: A.cleanText(rec.key) };   // tiers propios (r[5]): sin recortes
    let histP = hist, key = rest.join(J);
    if (key.length < 90 && hist.length > 1) { const h = Math.ceil(hist.length / 2); histP = hist.slice(0, h); key = (key ? key + "\n" : "") + hist.slice(h).join("\n"); }   // extractos muy cortos: la historia se reparte
    if (!histP.length && rest.length > 2) { const h = Math.ceil(rest.length / 2); histP = [rest.slice(0, h).join(J)]; key = rest.slice(h).join(J); }
    return { intro: intro || A.cleanText(rec.extract), hist: histP.join("\n"), key };
  }
  function lightbox(id) {
    const rec = memOf(id), L = $("cxLight"); if (!rec || !rec.img) return;
    L.innerHTML = `<img class="${photo(rec.img.hd)}" alt="" src="${esc(rec.img.hd)}"><button type="button" class="cx-lx" aria-label="${A.t("codex.close")}">${A.icon("u_close")}</button><p>${rec.credit ? esc((rec.credit.artist ? rec.credit.artist + " · " : "") + (rec.credit.license || "")) : ""}</p>`;
    const im = L.querySelector("img"); im.onerror = () => { im.onerror = null; im.src = rec.img.card; };   // build de Steam "ligero"/demo sin fotos HD: se ve la tarjeta
    L.classList.remove("hidden"); L.onclick = () => L.classList.add("hidden"); A.sfx.card();
  }

  /* ---------------- abrir / cerrar / aviso de tarjeta nueva ---------------- */
  /* el crupier de la portada no habla encima de la Enciclopedia: se retira al abrirla y vuelve a asomar al cerrarla (como con el podio, js/podio.js) */
  let dealerWas = false;
  function open(id) {
    if (!isOpen() && A.dealer && A.dealer.homeTease) { dealerWas = !!A.dealer.onHome; if (dealerWas) A.dealer.homeTease(false); }
    buildUI(); const root = $("codex"); root.classList.remove("hidden"); document.body.classList.add("cx-on"); labels(); ui.cur = null; if (A.coverMap) A.coverMap("codex", true, isOpen);
    $("cxDetail").classList.add("hidden"); $("cxGrid").classList.remove("hidden"); $("cxFilters").classList.remove("hidden"); document.querySelector("#codex .cx-tools").classList.remove("hidden");
    renderGrid(true); root.tabIndex = -1;
    requestAnimationFrame(() => setTimeout(() => { if (isOpen()) root.focus({ preventScroll: true }); }, 0));   // el foco, ya pintada: dado al instante obligaba a maquetar la Enciclopedia entera a medio abrir
    if (id && E[id]) openDetail(id); else A.sfx.card();                 // openDetail ya suena: no montar dos sonidos
    ui.lockN = 0;
    if (!id && A.dealer && A.dealer.codexOpen) setTimeout(() => { if (isOpen() && !ui.cur) A.dealer.codexOpen({ stats, tease }); }, 900);   // el crupier: tu ritmo, o te ensena una bloqueada
  }
  /* el crupier te ensena una tarjeta bloqueada 3 s (su foto) y la vuelve a cerrar: no desbloquea nada */
  function tease() {
    const g = $("cxGrid"); if (!g) return false; const gr = g.getBoundingClientRect();
    const b = [...g.querySelectorAll(".cx-card.locked")].find(c => { const r = c.getBoundingClientRect(); return r.top >= gr.top && r.bottom <= gr.bottom; });
    const art = b && b.querySelector(".cx-art"); if (!art) return false;
    const img = new Image(); img.className = "cx-tease"; img.alt = ""; img.onerror = () => img.remove(); img.src = A.media(`assets/wiki/card/${A.mediaKey(b.dataset.id)}.webp`);
    const S = A.core && A.core.S, reduced = (S && S.reduce) || matchMedia("(prefers-reduced-motion: reduce)").matches;
    const flip = then => { if (reduced) return then(); b.animate([{ transform: "rotateY(0)" }, { transform: "rotateY(90deg)" }], { duration: 160, easing: "ease-in" }).onfinish = () => { then(); b.animate([{ transform: "rotateY(-90deg)" }, { transform: "rotateY(0)" }], { duration: 180, easing: "ease-out" }); }; };
    flip(() => { art.appendChild(img); b.classList.add("teased"); A.sfx.card(); });
    setTimeout(() => { if (b.isConnected) flip(() => { img.remove(); b.classList.remove("teased"); }); }, 3400);
    return true;
  }
  function close() { const r = $("codex"); if (r) r.classList.add("hidden"); document.body.classList.remove("cx-on"); if (A.coverMap) A.coverMap("codex", false); ui.cur = null; A.sfx.ui(); if (A.codexOnClose) A.codexOnClose();
    const S = A.core && A.core.S;
    if (dealerWas && A.dealer && A.dealer.homeTease && document.querySelector(".hh") && S && S.phase === "title" && !S.settingsOpen) A.dealer.homeTease(true);
    dealerWas = false;
  }
  const isOpen = () => !!$("codex") && !$("codex").classList.contains("hidden");

  /* aviso de tarjeta nueva: un carrete con todo lo conseguido, tarjeta a tarjeta, como el rodillo de una tragaperras.
     Todas van superpuestas en la misma celda, asi el aviso mide lo que la mas alta y no da saltos al cambiar. La primera
     se queda un poco, las del medio pasan mas deprisa cuantas mas son y la ultima aguanta hasta ~7 s; con el raton encima se para */
  let toastT = 0, reelT = 0;
  function toastItem(id) {
    const e = E[id], it = document.createElement("span"); it.className = "cx-ri";
    it.innerHTML = `<span class="cx-tcard r${e.rarity}"><span class="cx-art">${iconSvg(e.type)}</span></span><span class="cx-tt"><em>${A.t("codex.new")} · ${typeLabel(e.type)}</em><b>${esc(nameOf(e, memOf(id)))}</b></span>`;
    loadContent(e, A.wlang()).then(rec => {
      if (rec.none) return;
      it.querySelector("b").textContent = nameOf(e, rec);
      if (rec.img) { const im = new Image(); im.alt = ""; im.className = photo(rec.img.thumb); im.src = rec.img.thumb; A.revealImg(im, () => { const art = it.querySelector(".cx-art"); art.classList.toggle("flag", !!rec.img.flag); art.prepend(im); }); }
    }).catch(() => {});
    return it;
  }
  function toast(ids) {
    if (!ids.length) return;
    let el = $("cxToast"); if (!el) { el = document.createElement("button"); el.id = "cxToast"; el.type = "button"; el.className = "cx-toast hidden"; (document.getElementById("leftCol") || $("app")).appendChild(el); }
    clearTimeout(toastT); clearTimeout(reelT);
    const n = ids.length, FIRST = 1300, END = 7000, step = Math.max(240, Math.min(900, 3800 / Math.max(1, n - 1)));
    const hold = k => n === 1 ? END : k === 0 ? FIRST : k < n - 1 ? step : Math.max(1600, END - FIRST - (n - 2) * step);
    const calm = document.documentElement.classList.contains("reduce-motion") || matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.innerHTML = `<span class="cx-reel"></span>${n > 1 ? `<span class="cx-rbar">${"<u></u>".repeat(n)}</span>` : ""}`;
    const items = ids.map(toastItem), pips = el.querySelectorAll(".cx-rbar u");
    items.forEach(it => el.firstElementChild.appendChild(it));
    let i = 0;
    const show = (k, from) => {
      items.forEach((it, j) => { if (j !== k && j !== from) { it.classList.remove("on"); it.getAnimations().forEach(an => an.cancel()); } });   // por si alguna salida no llego a terminar (pestana en segundo plano)
      items[k].classList.add("on"); pips.forEach((u, j) => u.classList.toggle("on", j <= k));
      if (from == null) return;
      const p = items[from], d = Math.min(380, step - 60);
      if (calm) { p.classList.remove("on"); return; }
      const out = p.animate([{ transform: "none", opacity: 1 }, { transform: "translateY(-100%)", opacity: 0 }], { duration: d, easing: "cubic-bezier(.5, 0, .75, 0)", fill: "forwards" });
      out.onfinish = () => { p.classList.remove("on"); out.cancel(); };
      items[k].animate([{ transform: "translateY(100%)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: d + 60, easing: "cubic-bezier(.2, .9, .3, 1.15)" });   // entra con un pelin de rebote: el "clac" del rodillo
    };
    const leave = () => { el.classList.remove("in"); el.classList.add("out"); toastT = setTimeout(() => el.classList.add("hidden"), 340); };
    const next = () => { if (i < n - 1) { const from = i++; show(i, from); reelT = setTimeout(next, hold(i)); } else leave(); };
    el.onpointerenter = () => clearTimeout(reelT);
    el.onpointerleave = () => { clearTimeout(reelT); reelT = setTimeout(next, 700); };
    el.onclick = () => { clearTimeout(reelT); if (A.core && A.core.S && A.core.S.phase === "asking") { leave(); return; } el.classList.add("hidden"); open(ids[i]); };   // con el reloj corriendo solo se aparta
    el.classList.remove("hidden", "in", "out"); A.restyle(el); el.classList.add("in");
    show(0); reelT = setTimeout(next, hold(0));
  }
  listeners.push(added => { setTimeout(() => toast(added), 1700); });   // sin sonido propio: lo celebran los jackpots del ticket (A.sfx.jackpot)

  A.codex = {
    init(w, m) { world = w; map = m; load(); build(); },
    open, close, isOpen, stats, entry: id => E[id], has: id => !!E[id],
    unlocked: () => order.filter(isUnlocked), total: () => order.length,
    isUnlocked: id => !!store.unlocked[id],
    _load: (id, lang) => loadContent(E[id], lang || A.wlang()),
    ids: () => order.slice(),
    reset() { store = { unlocked: {}, seen: {} }; save(); ui.cur = null; if (isOpen()) { labels(); renderGrid(true); } },
    byType,
    refresh() { if (isOpen()) { labels(); if (ui.cur) renderDetail(ui.cur); else renderGrid(true); } },
  };
})(window.AIQ);
