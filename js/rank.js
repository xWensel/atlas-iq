/*
 * Geolite - reto diario (v0.34): semillas del reto diario, tablas de clasificacion y envio de puntuaciones.
 * Si el servidor tiene la API activada (/api/*, ver README), la clasificacion es GLOBAL; si no, es local en este equipo.
 */
window.AIQ = window.AIQ || {};
(function (A) {
  /* ---------- aleatoriedad reproducible (misma semilla = mismas preguntas, ofertas y jefes) ---------- */
  const hash = str => { let h = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } return (h ^ (h >>> 16)) >>> 0; };
  const mulberry = seed => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  A.rng = seedStr => { const r = mulberry(hash(String(seedStr))); r.int = n => Math.floor(r() * n); r.pick = a => a[Math.floor(r() * a.length)]; r.shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }; return r; };

  const ymd = (d = new Date()) => d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
  const week = (d = new Date()) => { const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())), day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return t.getUTCFullYear() * 100 + Math.ceil(((t - y0) / 864e5 + 1) / 7); };

  const R = A.rank = {
    hash, ymd, week,
    dailySeed: () => R.daily.board(),
    boards: { daily: () => R.daily.board(), adv: "adv-all" },   // solo hay tres tablas: el reto de hoy y el de ayer (fecha LOCAL, ver R.daily) y la Aventura de siempre
    remote: null,                                                   // null = sin comprobar, true/false = servidor disponible
  };

  /* peticion JSON con tiempo maximo: sin red o con el servidor colgado nada se queda esperando (ni la fila de envios) */
  const fetchJ = (url, opt = {}, ms = 8000) => { const c = new AbortController(), t = setTimeout(() => c.abort(), ms); return fetch(url, { ...opt, signal: c.signal }).then(r => r.json()).finally(() => clearTimeout(t)); };
  /* comprobacion de la API global (si no existe, todo sigue en local). Si falla (sin red, servidor dormido) se vuelve a probar al minuto:
     antes un primer fallo dejaba toda la sesion en local y las puntuaciones de esa sesion no llegaban nunca a la clasificacion */
  R.check = () => R._chk || (R._chk = (async () => {
    if (!/^https?:$/.test(location.protocol) || /localhost|127\.0\.0\.1/.test(location.hostname)) { R.remote = false; return false; }
    try { const j = await fetchJ("/api/top?board=ping", {}, 2500); R.remote = !!(j && j.ok); } catch (e) { R.remote = false; }
    if (!R.remote) setTimeout(() => { R._chk = null; }, 60000);
    return R.remote;
  })());

  /* ---------- tablas ---------- */
  /* nombre con el que rankeas (sin nombre, "Anonimo" en tu idioma) */
  R.name = () => A.profile.get().name || A.T("Anónimo", "Anonymous");
  /* los envios al servidor van en fila: si cambias el nombre justo al acabar la partida, el "Anonimo" que iba de camino no pisa al nombre nuevo
     (se abandona a los 20 s, mas de lo que puede tardar el servidor: 4 llamadas a Redis de 4 s como mucho; uno abandonado no llega detras del siguiente) */
  let line = Promise.resolve();
  const post = body => (line = line.catch(() => null).then(async () => {
    try { const j = await fetchJ("/api/submit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }, 20000); return j && j.ok ? j : null; } catch (e) { return null; }
  }));
  R.localTop = (board, n = 20) => ((A.profile.get().boards[board] || []).slice().sort((a, b) => b.score - a.score).slice(0, n));
  /* {global, rows:[{id?,name,score,tries?}], me?:{rank,score}, count?}: con el servidor, tu puesto aunque no estes entre los n primeros
     (el servidor solo devuelve el id de tu propia fila: los de los demas no se ensenan) */
  R.top = async (board, n = 20, again) => {
    if (await R.check()) { try { const j = await fetchJ(`/api/top?board=${encodeURIComponent(board)}&n=${n}&me=${encodeURIComponent(A.profile.get().id)}`); if (j.ok) {
      /* tus intentos del dia no llegaron (jugaste sin red, servidor dormido, limite de envios): se reenvian una vez y se vuelve a pedir la tabla */
      const st = !again && /^daily-\d{8}$/.test(board) && R.daily.get(board);
      if (st && st.done && (!j.me || j.me.score < st.total)) { await R.daily.submit(board); return R.top(board, n, true); }
      return { global: true, rows: j.rows, me: j.me || null, count: j.count || j.rows.length };
    } } catch (e) { /* cae a local */ } }
    return { global: false, rows: R.localTop(board, n) };
  };
  /* entrada: {score, extra:{...}}. Devuelve {rank?, record}. */
  R.submit = async (board, entry) => {
    const P = A.profile.get(), rec = A.profile.record(board, entry.score);
    const row = { id: P.id, name: R.name(), score: entry.score, ts: Date.now(), extra: entry.extra || {} };
    const list = (P.boards[board] = P.boards[board] || []);
    const mine = list.find(r => r.id === P.id); if (mine) { if (row.score > mine.score) Object.assign(mine, row); } else list.push(row);
    P.boards[board] = list.sort((a, b) => b.score - a.score).slice(0, 50); A.profile.save();
    const global = (await R.check()) ? await post({ board, ...row }) : null;
    return { record: rec, global };
  };
  /* v0.37: cambias de nombre -> se cambia en tus filas locales y se reenvia a las tablas que se ven (Aventura, hoy y ayer). El servidor se queda con
     la mejor puntuacion (ZADD GT) y con los intentos ya guardados (HSETNX): del reenvio solo cambia el nombre. */
  R.rename = async () => {
    const P = A.profile.get(), name = R.name();
    for (const b in P.boards) (P.boards[b] || []).forEach(r => { if (r.id === P.id) r.name = name; });
    A.profile.save();
    if (!(await R.check())) return;
    const adv = (P.boards["adv-all"] || []).find(r => r.id === P.id), jobs = [];
    if (adv) jobs.push(post({ board: "adv-all", id: P.id, name, score: adv.score }));
    for (const b of [R.daily.board(), R.daily.yesterday()]) { const st = R.daily.get(b); if (st.done) jobs.push(post({ board: b, id: P.id, name, tries: st.tries.filter(t => !t.live).map(t => t.s || 0) })); }
    await Promise.all(jobs);
  };
  R.myRank = board => { const P = A.profile.get(), rows = R.localTop(board, 50), i = rows.findIndex(r => r.id === P.id); return i < 0 ? null : i + 1; };

  /* ---------- RETO DIARIO: una semilla por dia de calendario (cambia a tu medianoche), la misma para todo el mundo ----------
     La semilla del dia reparte la MANO DEL DIA (baraja, ascension, reliquia de regalo y orden de las rondas de cada acto) y cada uno de
     los 3 intentos tiene su propia sub-semilla: lugares, retos y cartas nuevos en cada intento (los mismos para todos en el mismo intento),
     asi que un intento no chiva las respuestas del siguiente. El intento se gasta al empezarlo; la PUNTUACION GLOBAL del dia es la suma
     de los tres. En el perfil: P.daily[tablero] = { v:2, tries:[{ s, r, won, ts, live? }] } (una entrada por dia: los logros cuentan dias). */
  const TRIES = 3, DECK_IDS = ["explorer", "historian", "navigator", "blind"], ASC_BAG = [0, 0, 1, 1, 1, 2, 2, 3];
  const dayNum = (d = new Date()) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const DY = R.daily = {
    TRIES,
    board: (d = new Date()) => "daily-" + dayNum(d),
    yesterday: () => { const d = new Date(); d.setDate(d.getDate() - 1); return DY.board(d); },
    date: board => new Date(+board.slice(6, 10), +board.slice(10, 12) - 1, +board.slice(12, 14)),
    /* codigo corto de la semilla para ensenarlo (y compararlo entre amigos): "K7Q-2XD", sin letras que se confunden (0/O, 1/I/L) */
    code: board => { const AB = "ABCDEFGHJKMNPQRSTUVWXYZ23456789", rr = A.rng(board + ":code"); let s = ""; for (let i = 0; i < 6; i++) s += AB[rr.int(AB.length)]; return s.slice(0, 3) + "-" + s.slice(3); },
    trySeed: (board, k) => board + "#" + k,
    msToNext: () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1) - n; },
    hand(board) {
      const rr = A.rng(board + ":hand"), REL = A.RELICS || {}, deck = rr.pick(DECK_IDS), asc = rr.pick(ASC_BAG);
      const own = ((A.ADV && A.ADV.DECKS[deck]) || { perks: [] }).perks;
      const gifts = Object.keys(REL).filter(id => REL[id].r <= 1 && !own.includes(id)).sort(), gift = gifts.length ? rr.pick(gifts) : null;
      const route = []; [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10]].forEach(act => route.push(...rr.shuffle(act))); route.push(11);   // el Jackpot sigue cerrando la expedicion
      return { deck, asc, gift, route };
    },
    /* estado del dia en el perfil (sin crear la entrada: solo los dias jugados cuentan para los logros) */
    get(board) {
      const P = A.profile.get(); let d = P.daily[board];
      if (d && d.v !== 2) d = P.daily[board] = { v: 2, tries: [{ s: d.score || 0, ts: d.ts || 0 }] };   // formato antiguo: un solo intento
      d = d || { v: 2, tries: [] };
      const done = d.tries.filter(t => !t.live);
      return { tries: d.tries, done: done.length, live: d.tries.findIndex(t => t.live) + 1, left: TRIES - d.tries.length, total: done.reduce((n, t) => n + (t.s || 0), 0) };
    },
    /* historial propio: dias jugados, dias seguidos hasta hoy (o hasta ayer si hoy aun no has cerrado ningun intento) y mejor puntuacion global de un dia */
    stats() {
      const P = A.profile.get(), played = b => DY.get(b).done > 0, keys = Object.keys(P.daily).filter(k => /^daily-\d{8}$/.test(k) && played(k));
      const d = new Date(); if (!played(DY.board(d))) d.setDate(d.getDate() - 1);
      let streak = 0; while (played(DY.board(d))) { streak++; d.setDate(d.getDate() - 1); }
      return { days: keys.length, streak, best: keys.reduce((m, k) => Math.max(m, DY.get(k).total), 0) };
    },
    /* gasta un intento: devuelve su numero (1..3) o 0 si ya no quedan */
    start(board) {
      const P = A.profile.get(); DY.get(board); const d = (P.daily[board] = P.daily[board] || { v: 2, tries: [] });
      if (d.tries.length >= TRIES) return 0;
      d.tries.push({ s: 0, live: true, ts: Date.now() }); A.profile.save(); return d.tries.length;
    },
    /* cierra el intento k con su puntuacion y lo manda a la clasificacion */
    finish(board, k, s, info = {}) {
      const P = A.profile.get(); DY.get(board); const d = (P.daily[board] = P.daily[board] || { v: 2, tries: [] });
      while (d.tries.length < k) d.tries.push({ s: 0, ts: Date.now() });
      d.tries[k - 1] = { s: Math.max(0, Math.round(s || 0)), r: info.r || 0, won: !!info.won, ts: Date.now() }; A.profile.save();
      return DY.submit(board);
    },
    /* la puntuacion global (suma de los intentos cerrados) va a la tabla local y, si hay servidor, a la global */
    async submit(board) {
      const P = A.profile.get(), st = DY.get(board), tries = st.tries.filter(t => !t.live).map(t => t.s || 0);
      const row = { id: P.id, name: R.name(), score: st.total, tries, ts: Date.now() };
      P.boards[board] = (P.boards[board] || []).filter(r => r.id !== P.id).concat(row).sort((a, b) => b.score - a.score).slice(0, 50);
      A.profile.record(board, st.total); A.profile.save();
      const global = (await R.check()) ? await post({ board, id: row.id, name: row.name, tries }) : null;
      return { total: st.total, global };
    },
  };
})(window.AIQ);
