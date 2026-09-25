/* POST /api/submit  { board, id, name, score }  ->  guarda la MEJOR puntuacion de cada jugador en la tabla.
   OJO: por ahora la puntuacion es de confianza (limites de plausibilidad + limite de frecuencia). Para clasificar en serio hay que reproducir la partida
   en servidor a partir de la semilla y los clics (ver README, "Antitrampas"). */
const kv = require("./_kv");
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  if (!kv.configured) return res.status(503).json({ ok: false, reason: "no-backend" });
  const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const board = String(b.board || ""), id = String(b.id || "").replace(/[^a-z0-9]/gi, "").slice(0, 24), score = Math.floor(+b.score);
  const name = String(b.name || "").replace(/[^\p{L}\p{N} _.\-]/gu, "").trim().slice(0, 16) || "Anonymous";
  if (!kv.BOARD.test(board) || !id || !Number.isFinite(score) || score < 0 || score > 5e6) return res.status(400).json({ ok: false, reason: "invalid" });
  if (/^daily-/.test(board)) {                                       // el reto diario solo acepta el dia de hoy (UTC) +-1
    const d = new Date(), ymd = x => x.getUTCFullYear() * 10000 + (x.getUTCMonth() + 1) * 100 + x.getUTCDate(), v = +board.slice(6);
    if (![ymd(d), ymd(new Date(d - 864e5)), ymd(new Date(+d + 864e5))].includes(v)) return res.status(400).json({ ok: false, reason: "day" });
  }
  const ip = String((req.headers["x-forwarded-for"] || "").split(",")[0] || "x").slice(0, 45), win = Math.floor(Date.now() / 60000);
  try {
    const [n] = await kv.pipeline([["INCR", "rl:" + ip + ":" + win]]);
    if (n > 20) return res.status(429).json({ ok: false, reason: "rate" });
    await kv.pipeline([["EXPIRE", "rl:" + ip + ":" + win, 120], ["ZADD", "lb:" + board, "GT", score, id], ["HSET", "names:" + board, id, name], ["EXPIRE", "lb:" + board, 3456000], ["EXPIRE", "names:" + board, 3456000]]);
    const [rank, total] = await kv.pipeline([["ZREVRANK", "lb:" + board, id], ["ZCARD", "lb:" + board]]);
    res.status(200).json({ ok: true, rank: rank == null ? null : rank + 1, total });
  } catch (e) { res.status(502).json({ ok: false, reason: "kv" }); }
};
