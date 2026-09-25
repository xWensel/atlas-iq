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
    game1: { en: "World", es: "Mundo", d: { en: "The original world tour: cities, landmarks and capitals.", es: "La vuelta al mundo original: ciudades, lugares famosos y capitales." } },
    worldcapitals: { en: "World Capitals", es: "Capitales del mundo", d: { en: "Capitals by region, with a US & Canada bonus.", es: "Capitales por regiones, con bonus de EE. UU. y Canadá." } },
    usa: { en: "USA", es: "Estados Unidos", d: { en: "Capitals, cities, famous places and city nicknames.", es: "Capitales, ciudades, lugares famosos y apodos de ciudades." } },
    asia: { en: "Asia", es: "Asia", d: { en: "From the Middle East to Japan, up to UNESCO sites.", es: "De Oriente Medio a Japón, hasta sitios UNESCO." } },
    centralsouthamerica: { en: "Latin America", es: "Latinoamérica", d: { en: "Central & South America and the Caribbean.", es: "Centro y Sudamérica y el Caribe." } },
    oceania: { en: "Oceania", es: "Oceanía", d: { en: "Australia, New Zealand and the Malay Archipelago.", es: "Australia, Nueva Zelanda y el archipiélago malayo." } },
  };

  const classic = (window.AIQ.CLASSIC || []).map(g => {
    const meta = CLASSIC_META[g.id];
    return {
      id: "c-" + g.id, mode: "classic", title: { en: meta.en, es: meta.es }, blurb: meta.d, home: g.home,
      levels: g.levels.map((L, li) => {
        const kind = L.bonus ? "clue" : kindOf(L.name);
        const mk = d => {
            const clue = L.bonus && d.f;
            const sp = clue ? { name: d.n, sub: "" } : splitName(d.n);
            return {
              t: "p", lat: d.lat, lon: d.lon, cid: [A.ckey(clue ? d.f : d.n)],
              name: { en: sp.name, es: sp.name }, sub: { en: sp.sub, es: sp.sub },
              clue: !!clue, answer: clue ? { en: d.f, es: d.f } : null,
              fact: { en: clue ? "" : d.f, es: clue ? "" : d.f },
            };
          };
        return {
          tier: L.bonus ? 2 : Math.min(2, Math.floor((li / g.levels.length) * 3)), all: () => L.dests.map(mk),
          name: { en: L.name, es: L.name }, kind, bonus: L.bonus, plainName: true,
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
