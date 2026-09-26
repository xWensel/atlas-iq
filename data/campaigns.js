/*
 * Atlas IQ - campañas. Une los dos modos bajo la misma estructura:
 *   CLASICO   -> preguntas, orden, tiempos y puntuacion exactos del juego original.
 *   EXTENDIDO -> contenido propio (12 niveles del mundo + historia y pistas).
 */
window.AIQ = window.AIQ || {};
(function (A) {
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* tipo de ronda a partir del nombre del nivel original */
  const KIND_RX = [[/nickname|former names|clue|bonus round/i, "clue"], [/capital/i, "capital"], [/famous|unesco|heritage/i, "landmark"], [/cit(y|ies)/i, "city"]];
  const kindOf = n => { for (const [r, k] of KIND_RX) if (r.test(n)) return k; return "place"; };

  /* "Buenos Aires, Argentina" -> nombre + pais (para maquetarlos distinto) */
  const splitName = s => {
    const i = s.lastIndexOf(",");
    return i > 0 ? { name: s.slice(0, i).trim(), sub: s.slice(i + 1).trim() } : { name: s.trim(), sub: "" };
  };

  /* ------------------------------------------------------------------ CLASICO */
  const CLASSIC_META = {
    game1: { t: { en: "World", es: "Mundo", fr: "Monde", pt: "Mundo", de: "Welt", it: "Mondo" }, d: { en: "The original world tour: cities, landmarks and capitals.", es: "La vuelta al mundo original: ciudades, lugares famosos y capitales.", fr: "Le tour du monde original : villes, lieux célèbres et capitales.", pt: "A volta ao mundo original: cidades, lugares famosos e capitais.", de: "Die originale Weltreise: Städte, Sehenswürdigkeiten und Hauptstädte.", it: "Il giro del mondo originale: città, luoghi famosi e capitali." } },
    worldcapitals: { t: { en: "World Capitals", es: "Capitales del mundo", fr: "Capitales du monde", pt: "Capitais do mundo", de: "Welthauptstädte", it: "Capitali del mondo" }, d: { en: "Capitals by region, with a US & Canada bonus.", es: "Capitales por regiones, con bonus de EE. UU. y Canadá.", fr: "Les capitales par région, avec un bonus États-Unis et Canada.", pt: "Capitais por regiões, com bônus de EUA e Canadá.", de: "Hauptstädte nach Regionen, mit USA-und-Kanada-Bonus.", it: "Capitali per regione, con bonus USA e Canada." } },
    usa: { t: { en: "USA", es: "Estados Unidos", fr: "États-Unis", pt: "Estados Unidos", de: "USA", it: "Stati Uniti" }, d: { en: "Capitals, cities, famous places and city nicknames.", es: "Capitales, ciudades, lugares famosos y apodos de ciudades.", fr: "Capitales, villes, lieux célèbres et surnoms de villes.", pt: "Capitais, cidades, lugares famosos e apelidos de cidades.", de: "Hauptstädte, Städte, berühmte Orte und Spitznamen.", it: "Capitali, città, luoghi famosi e soprannomi delle città." } },
    asia: { t: { en: "Asia", es: "Asia", fr: "Asie", pt: "Ásia", de: "Asien", it: "Asia" }, d: { en: "From the Middle East to Japan, up to UNESCO sites.", es: "De Oriente Medio a Japón, hasta sitios UNESCO.", fr: "Du Moyen-Orient au Japon, jusqu'aux sites de l'UNESCO.", pt: "Do Médio Oriente ao Japão, até sítios da UNESCO.", de: "Vom Nahen Osten bis Japan, bis zu UNESCO-Stätten.", it: "Dal Medio Oriente al Giappone, fino ai siti UNESCO." } },
    centralsouthamerica: { t: { en: "Latin America", es: "Latinoamérica", fr: "Amérique latine", pt: "América Latina", de: "Lateinamerika", it: "America Latina" }, d: { en: "Central & South America and the Caribbean.", es: "Centro y Sudamérica y el Caribe.", fr: "Amérique centrale et du Sud, et les Caraïbes.", pt: "América Central e do Sul e o Caribe.", de: "Mittel- und Südamerika und die Karibik.", it: "America centrale e meridionale e Caraibi." } },
    oceania: { t: { en: "Oceania", es: "Oceanía", fr: "Océanie", pt: "Oceania", de: "Ozeanien", it: "Oceania" }, d: { en: "Australia, New Zealand and the Malay Archipelago.", es: "Australia, Nueva Zelanda y el archipiélago malayo.", fr: "Australie, Nouvelle-Zélande et archipel malais.", pt: "Austrália, Nova Zelândia e o Arquipélago Malaio.", de: "Australien, Neuseeland und der Malaiische Archipel.", it: "Australia, Nuova Zelanda e Arcipelago malese." } },
  };


  /* textos del juego original (solo ingles) -> {en, es, fr, pt, de, it}: data/classic-tr.js, luego la base de lugares y, si no, igual en todos */
  const L6 = ["en", "es", "fr", "pt", "de", "it"], nk = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  let PBY = null;
  const placeBy = en => {
    if (!PBY) { PBY = new Map(); (A.PLACES || []).forEach(r => { const n = r[6]; if (n && n.en && !PBY.has(nk(n.en))) PBY.set(nk(n.en), n); }); }
    return PBY.get(nk(en));
  };
  const same = s => { const o = {}; L6.forEach(l => { o[l] = s; }); return o; };
  const join = (a, b, sep) => { const o = {}; L6.forEach(l => { o[l] = (a[l] || a.en) + sep + (b[l] || b.en); }); return o; };
  const DIFF_RX = /^(.*?)\s*(\((?:Easy|Medium|Hard|Very hard|Very Hard|Expert|Hardest|Final)\))$/;
  function tr6(s, sentence) {
    s = String(s || "").trim(); if (!s) return same("");
    const T = A.CLASSIC_TR || {}, t = T[s];
    if (t) return { en: t[0], es: t[1], fr: t[2], pt: t[3], de: t[4], it: t[5] };
    if (sentence) return same(s);                                                   // frase sin traduccion: se deja tal cual
    const m = s.match(DIFF_RX); if (m && T[m[1]] && T[m[2]]) return join(tr6(m[1]), tr6(m[2]), " ");
    const i = s.lastIndexOf(", "); if (i > 0) return join(tr6(s.slice(0, i)), tr6(s.slice(i + 2)), ", ");
    if (/\S\/\S/.test(s)) return s.split("/").map(x => tr6(x)).reduce((a, b) => join(a, b, "/"));
    const p = placeBy(s); if (p) { const o = {}; L6.forEach(l => { o[l] = p[l] || s; }); o.en = s; return o; }
    return same(s);
  }
  A.classicTr = tr6;

  const classic = (window.AIQ.CLASSIC || []).map(g => {
    const meta = CLASSIC_META[g.id];
    return {
      id: "c-" + g.id, mode: "classic", title: meta.t, blurb: meta.d, home: g.home,
      levels: g.levels.map((L, li) => {
        const kind = L.bonus ? "clue" : kindOf(L.name);
        const mk = d => {
            const clue = L.bonus && d.f;
            const sp = clue ? { name: d.n, sub: "" } : splitName(d.n);
            const full = !clue && (A.CLASSIC_TR || {})[d.n] ? tr6(d.n) : null;                 // traduccion del nombre completo (p. ej. "Olympia, Washington"): se parte en cada idioma
            const part = k => { const o = {}; L6.forEach(l => { const v = full[l], i = v.lastIndexOf(", "); o[l] = i > 0 ? (k ? v.slice(i + 2) : v.slice(0, i)) : (k ? "" : v); }); return o; };
            return {
              t: "p", lat: d.lat, lon: d.lon, cid: [A.ckey(clue ? d.f : d.n)],
              name: full ? part(0) : tr6(sp.name), sub: full ? part(1) : tr6(sp.sub),
              clue: !!clue, answer: clue ? tr6(d.f) : null,
              fact: clue ? same("") : tr6(d.f, d.f.length > 40),
            };
          };
        return {
          tier: L.bonus ? 2 : Math.min(2, Math.floor((li / g.levels.length) * 3)), all: () => L.dests.map(mk),
          name: tr6(L.name), kind, bonus: L.bonus, plainName: true,
          seconds: L.tpq, advance: L.advance, maxPerQ: L.kmBase + L.speed,
          /* Puntuacion identica al original:
             distancia = floor(KMBase - km * KMDist), velocidad = floor((1 - tiempo/(TPQ - corte)) * SpeedBonus) */
          score(q, km, timeLeft) {
            const dist = Math.max(0, Math.floor(L.kmBase - km * L.kmDist));
            const time = Math.max(0, Math.floor((1 - (L.tpq - timeLeft) / (L.tpq - L.cutoff)) * L.speed));
            return { dist, time, distMax: L.kmBase, timeMax: L.speed };
          },
          questions: () => L.dests.map(mk),
        };
      }),
    };
  });

  /* ------------------------------------------------------------------ EXTENDIDO */
  const atlasQ = o => ({
    t: o.t, lat: o.lat, lon: o.lon, key: o.key, name: o.n, sub: o.c, clue: false, answer: null, fact: o.f, cid: [o.t === "c" ? "c:" + o.key : A.ckey(o.n.en)],
  });
  const atlasLevels = (A.LEVELS || []).map((L, i) => ({
    name: L.name, kind: L.kind, diff: L.diff, seconds: L.seconds, advance: L.advance, maxPerQ: 1400,
    score(q, km, timeLeft) {
      const scale = L.scaleKm * (q.t === "c" ? 0.7 : 1);
      const dist = Math.round(1000 * Math.exp(-km / scale));
      const time = Math.round(400 * Math.max(0, timeLeft / L.seconds) * (0.3 + 0.7 * dist / 1000));
      return { dist, time, distMax: 1000, timeMax: 400 };
    },
    tier: Math.min(4, Math.floor((i / A.LEVELS.length) * 5)),
    all: () => L.pool.map(atlasQ),
    questions: () => shuffle(L.pool).slice(0, 5).map(atlasQ),
  }));

  const histQ = L => a => {
    const clue = L.kind === "clue";
    return {
      t: "p", lat: a[4], lon: a[5], clue, cid: clue ? [A.ckey(a[2])] : [A.ckey(a[0]), A.ckey(a[2])],
      name: { en: a[0], es: a[1] }, sub: { en: "", es: "" },
      answer: { en: a[2], es: a[3] }, fact: { en: a[6], es: a[7] },
    };
  };
  const historyLevels = (A.HISTORY || []).map((L, i) => ({
    name: L.name, kind: L.kind, seconds: L.seconds, advance: 2600 + 150 * i, maxPerQ: 1400,
    score(q, km, timeLeft) {
      const dist = Math.round(1000 * Math.exp(-km / L.scaleKm));
      const time = Math.round(400 * Math.max(0, timeLeft / L.seconds) * (0.3 + 0.7 * dist / 1000));
      return { dist, time, distMax: 1000, timeMax: 400 };
    },
    tier: L.kind === "clue" ? 2 : 3,
    all: () => L.pool.map(histQ(L)),
    questions: () => shuffle(L.pool).slice(0, 5).map(histQ(L)),
  }));

  A.CAMPAIGNS = [
    ...classic,
    {
      id: "x-atlas", mode: "extended", title: { en: "Atlas World Tour", es: "Vuelta al mundo Atlas" },
      blurb: { en: "12 new levels: cities, capitals, landmarks, wonders, countries and straits.", es: "12 niveles nuevos: ciudades, capitales, monumentos, maravillas, países y estrechos." },
      home: { lat: 0, lon: 0, zoom: 1 }, levels: atlasLevels,
    },
    {
      id: "x-history", mode: "extended", title: { en: "History & Clues", es: "Historia y pistas" },
      blurb: { en: "Famous battles, events that shaped the world and city nicknames.", es: "Batallas famosas, eventos que cambiaron el mundo y apodos de ciudades." },
      home: { lat: 30, lon: 10, zoom: 1 }, levels: historyLevels,
    },
  ];
})(window.AIQ);
