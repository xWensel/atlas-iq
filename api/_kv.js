/* Cliente minimo de Upstash Redis (REST). Variables de entorno: UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
   (o las KV_REST_API_URL / KV_REST_API_TOKEN que crea la integracion de Vercel). Sin ellas la API responde 503 y el juego usa la clasificacion local. */
const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
exports.configured = !!(URL_ && TOKEN);
exports.pipeline = async cmds => {
  const r = await fetch(URL_ + "/pipeline", { method: "POST", headers: { Authorization: "Bearer " + TOKEN, "content-type": "application/json" }, body: JSON.stringify(cmds) });
  if (!r.ok) throw new Error("kv " + r.status);
  return (await r.json()).map(x => x.result);
};
exports.BOARD = /^(daily-\d{8}|weekly-\d{6}|adv-all|classic-c-[a-z0-9]{2,24})$/;
