/* GET /api/top?board=daily-20260925&n=20  ->  { ok, rows:[{id,name,score}] }.  board=ping sirve para saber si la API global esta activa. */
const kv = require("./_kv");
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!kv.configured) return res.status(503).json({ ok: false, reason: "no-backend" });
  const board = String((req.query && req.query.board) || "");
  if (board === "ping") return res.status(200).json({ ok: true });
  if (!kv.BOARD.test(board)) return res.status(400).json({ ok: false, reason: "board" });
  const n = Math.max(1, Math.min(50, parseInt(req.query.n, 10) || 20));
  try {
    const [z] = await kv.pipeline([["ZRANGE", "lb:" + board, 0, n - 1, "REV", "WITHSCORES"]]);
    const ids = [], scores = []; for (let i = 0; i < z.length; i += 2) { ids.push(z[i]); scores.push(+z[i + 1]); }
    const names = ids.length ? (await kv.pipeline([["HMGET", "names:" + board, ...ids]]))[0] : [];
    res.status(200).json({ ok: true, rows: ids.map((id, i) => ({ id, name: names[i] || "—", score: scores[i] })) });
  } catch (e) { res.status(502).json({ ok: false, reason: "kv" }); }
};
