/* Cliente minimo de Upstash Redis (REST). Variables de entorno: UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
   (o las KV_REST_API_URL / KV_REST_API_TOKEN que crea la integracion de Vercel). Sin ellas la API responde 503 y el juego usa la clasificacion local. */
const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
exports.configured = !!(URL_ && TOKEN);
exports.pipeline = async cmds => {
  const r = await fetch(URL_ + "/pipeline", { method: "POST", headers: { Authorization: "Bearer " + TOKEN, "content-type": "application/json" }, body: JSON.stringify(cmds), signal: AbortSignal.timeout(4000) });   // Redis colgado: 502 en vez de dejar la funcion esperando
  if (!r.ok) throw new Error("kv " + r.status);
  return (await r.json()).map(x => x.result);
};
/* las clasificaciones del juego: la Aventura de siempre, las puntuaciones de cada dia (day-, Hoy / Ayer: cualquier partida) y el Reto diario (daily-, suma de sus 3 intentos) */
exports.BOARD = /^(daily-\d{8}|day-\d{8}|adv-all)$/;
