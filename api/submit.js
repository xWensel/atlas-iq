/* POST /api/submit  { board, id, name, score }  ->  guarda la MEJOR puntuacion de cada jugador en la tabla.
   Reto diario: { board:"daily-AAAAMMDD", id, name, tries:[s1, s2, s3] }  ->  cada intento se guarda una sola vez (el primero que llega manda)
   y la tabla ordena por la PUNTUACION GLOBAL del dia (suma de los intentos). Devuelve { ok, rank, total, score, tries }.
   OJO: por ahora la puntuacion es de confianza (limites de plausibilidad + limite de frecuencia). Para clasificar en serio hay que reproducir la partida
   en servidor a partir de la semilla y los clics (ver README, "Antitrampas"). */
const kv = require("./_kv");
const TTL = 3456000;                                                  // 40 dias
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  if (!kv.configured) return res.status(503).json({ ok: false, reason: "no-backend" });
  let b; try { b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {}; } catch (e) { return res.status(400).json({ ok: false, reason: "json" }); }
  const board = String(b.board || ""), id = String(b.id || "").replace(/[^a-z0-9]/gi, "").slice(0, 24), daily = /^daily-/.test(board);
  const name = [...String(b.name || "").normalize("NFC").replace(/[^\p{L}\p{N} _.'\-]/gu, "").replace(/\s+/g, " ").trim()].slice(0, 20).join("").trim() || "Anonymous";   // el mismo filtro que A.profile.clean (hasta 20)
  const tries = daily ? (Array.isArray(b.tries) ? b.tries : [b.score]).slice(0, 3).map(v => Math.floor(+v)) : [];
  const score = daily ? 0 : Math.floor(+b.score);
  if (!kv.BOARD.test(board) || !id) return res.status(400).json({ ok: false, reason: "invalid" });
  if (daily ? !tries.length || tries.some(v => !Number.isFinite(v) || v < 0 || v > 2e6) : !Number.isFinite(score) || score < 0 || score > 5e6) return res.status(400).json({ ok: false, reason: "invalid" });
  if (daily) {                                                         // el reto diario va por fecha local: se acepta el dia de hoy (UTC) +-1
    const d = new Date(), ymd = x => x.getUTCFullYear() * 10000 + (x.getUTCMonth() + 1) * 100 + x.getUTCDate(), v = +board.slice(6);
    if (![ymd(d), ymd(new Date(d - 864e5)), ymd(new Date(+d + 864e5))].includes(v)) return res.status(400).json({ ok: false, reason: "day" });
  }
  const ip = String((req.headers["x-forwarded-for"] || "").split(",")[0] || "x").slice(0, 45), win = Math.floor(Date.now() / 60000);
  try {
    const [n] = await kv.pipeline([["INCR", "rl:" + ip + ":" + win]]);
    if (n > 20) return res.status(429).json({ ok: false, reason: "rate" });
    const lb = "lb:" + board, names = "names:" + board;
    let total = score, mine = null;
    if (daily) {
      const tk = "tr:" + board + ":" + id;
      const got = await kv.pipeline([["EXPIRE", "rl:" + ip + ":" + win, 120], ...tries.map((v, i) => ["HSETNX", tk, String(i + 1), v]), ["EXPIRE", tk, TTL], ["HMGET", tk, "1", "2", "3"]]);
      mine = got[got.length - 1].filter(v => v != null).map(Number); total = mine.reduce((a, v) => a + v, 0);
      await kv.pipeline([["ZADD", lb, total, id], ["HSET", names, id, name], ["HSET", "tries:" + board, id, mine.join(",")], ["EXPIRE", lb, TTL], ["EXPIRE", names, TTL], ["EXPIRE", "tries:" + board, TTL]]);
    } else {
      await kv.pipeline([["EXPIRE", "rl:" + ip + ":" + win, 120], ["ZADD", lb, "GT", score, id], ["HSET", names, id, name], ["EXPIRE", lb, TTL], ["EXPIRE", names, TTL]]);
    }
    const [rank, count] = await kv.pipeline([["ZREVRANK", lb, id], ["ZCARD", lb]]);
    res.status(200).json({ ok: true, rank: rank == null ? null : rank + 1, total: count, ...(mine ? { score: total, tries: mine } : {}) });
  } catch (e) { res.status(502).json({ ok: false, reason: "kv" }); }
};
