/*
 * Atlas IQ - modo Competitivo (v0.6): semillas del reto diario, tablas de clasificacion y envio de puntuaciones.
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
    dailySeed: () => "daily-" + ymd(), weeklySeed: () => "weekly-" + week(),
    boards: { daily: () => "daily-" + ymd(), weekly: () => "weekly-" + week(), adv: "adv-all" },
    remote: null,                                                   // null = sin comprobar, true/false = servidor disponible
  };

  /* comprobacion unica de la API global (si no existe, todo sigue en local) */
  R.check = () => R._chk || (R._chk = (async () => {
    if (!/^https?:$/.test(location.protocol) || /localhost|127\.0\.0\.1/.test(location.hostname)) { R.remote = false; return false; }
    try { const c = new AbortController(); setTimeout(() => c.abort(), 2500); const r = await fetch("/api/top?board=ping", { signal: c.signal }); const j = await r.json(); R.remote = !!(j && j.ok); } catch (e) { R.remote = false; }
    return R.remote;
  })());

  /* ---------- tablas ---------- */
  R.localTop = (board, n = 20) => ((A.profile.get().boards[board] || []).slice().sort((a, b) => b.score - a.score).slice(0, n));
  R.top = async (board, n = 20) => {
    if (await R.check()) { try { const r = await fetch(`/api/top?board=${encodeURIComponent(board)}&n=${n}`); const j = await r.json(); if (j.ok) return { global: true, rows: j.rows }; } catch (e) { /* cae a local */ } }
    return { global: false, rows: R.localTop(board, n) };
  };
  /* entrada: {score, extra:{...}}. Devuelve {rank?, record}. */
  R.submit = async (board, entry) => {
    const P = A.profile.get(), rec = A.profile.record(board, entry.score);
    const row = { id: P.id, name: P.name || A.T("Anónimo", "Anonymous"), score: entry.score, ts: Date.now(), extra: entry.extra || {} };
    const list = (P.boards[board] = P.boards[board] || []);
    const mine = list.find(r => r.id === P.id); if (mine) { if (row.score > mine.score) Object.assign(mine, row); } else list.push(row);
    P.boards[board] = list.sort((a, b) => b.score - a.score).slice(0, 50); A.profile.save();
    let global = null;
    if (await R.check()) { try { const r = await fetch("/api/submit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ board, ...row }) }); const j = await r.json(); if (j.ok) global = j; } catch (e) { /* solo local */ } }
    return { record: rec, global };
  };
  R.myRank = board => { const P = A.profile.get(), rows = R.localTop(board, 50), i = rows.findIndex(r => r.id === P.id); return i < 0 ? null : i + 1; };
})(window.AIQ);
