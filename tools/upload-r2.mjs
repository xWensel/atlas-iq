/*
 * Geolite - sube a Cloudflare R2 lo que la web (Vercel) no puede alojar: fotos de la Enciclopedia y musica (solo desarrollo).
 *   node tools/upload-r2.mjs            sube lo nuevo o cambiado (recuerda lo subido en tools/cache-r2.json)
 *   node tools/upload-r2.mjs --cors     ademas fija el CORS del bucket (la musica pasa por WebAudio y lo necesita)
 * Credenciales en .env.local (nunca en el codigo): R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET.
 * Luego la URL publica del bucket va en MEDIA_BASE (js/support.js).
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/).filter(l => l.includes("=")).map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const { R2_ACCOUNT_ID: ACC, R2_ACCESS_KEY_ID: KEY, R2_SECRET_ACCESS_KEY: SECRET, R2_BUCKET: BUCKET } = env;
if (!ACC || !KEY || !SECRET || !BUCKET) { console.error("Faltan R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET en .env.local"); process.exit(1); }
const HOST = `${ACC}.r2.cloudflarestorage.com`;
const DIRS = ["assets/wiki/card", "assets/wiki/hd", "assets/music"];
const TYPES = { ".webp": "image/webp", ".mp3": "audio/mpeg", ".svg": "image/svg+xml" };
const MAN = path.join(ROOT, "tools", "cache-r2.json");
const done = fs.existsSync(MAN) ? JSON.parse(fs.readFileSync(MAN, "utf8")) : {};

const hmac = (k, s) => crypto.createHmac("sha256", k).update(s).digest();
const sha = b => crypto.createHash("sha256").update(b).digest("hex");
const enc = p => p.split("/").map(encodeURIComponent).join("/");
async function s3(method, key, body = Buffer.alloc(0), headers = {}, query = "") {
  const now = new Date(), amz = now.toISOString().replace(/[-:]|\.\d{3}/g, ""), day = amz.slice(0, 8);
  const uri = "/" + BUCKET + (key ? "/" + enc(key) : ""), h = { host: HOST, "x-amz-content-sha256": sha(body), "x-amz-date": amz, ...headers };
  const names = Object.keys(h).map(k => k.toLowerCase()).sort(), low = Object.fromEntries(Object.entries(h).map(([k, v]) => [k.toLowerCase(), String(v).trim()]));
  const canon = [method, uri, query, names.map(n => n + ":" + low[n]).join("\n") + "\n", names.join(";"), low["x-amz-content-sha256"]].join("\n");
  const scope = `${day}/auto/s3/aws4_request`, sts = ["AWS4-HMAC-SHA256", amz, scope, sha(canon)].join("\n");
  const kS = hmac(hmac(hmac(hmac("AWS4" + SECRET, day), "auto"), "s3"), "aws4_request");
  const auth = `AWS4-HMAC-SHA256 Credential=${KEY}/${scope}, SignedHeaders=${names.join(";")}, Signature=${hmac(kS, sts).toString("hex")}`;
  const r = await fetch(`https://${HOST}${uri}${query ? "?" + query : ""}`, { method, headers: { ...h, authorization: auth }, body: method === "GET" || method === "HEAD" ? undefined : body });
  if (!r.ok) throw new Error(`${method} ${key || query}: ${r.status} ${(await r.text()).slice(0, 300)}`);
  return r;
}

if (process.argv.includes("--cors")) {
  const xml = `<CORSConfiguration><CORSRule><AllowedOrigin>*</AllowedOrigin><AllowedMethod>GET</AllowedMethod><AllowedMethod>HEAD</AllowedMethod><AllowedHeader>*</AllowedHeader><MaxAgeSeconds>86400</MaxAgeSeconds></CORSRule></CORSConfiguration>`;
  const b = Buffer.from(xml); await s3("PUT", "", b, { "content-type": "application/xml", "content-md5": crypto.createHash("md5").update(b).digest("base64") }, "cors=");
  console.log("CORS del bucket configurado");
}

const files = DIRS.flatMap(d => { const abs = path.join(ROOT, d); return fs.existsSync(abs) ? fs.readdirSync(abs).map(f => d + "/" + f) : []; });
const todo = files.filter(f => { const st = fs.statSync(path.join(ROOT, f)); return !done[f] || done[f] !== st.size + ":" + Math.round(st.mtimeMs); });
console.log(`archivos: ${files.length}, por subir: ${todo.length}`);
let n = 0, bytes = 0, fails = 0;
const save = () => fs.writeFileSync(MAN, JSON.stringify(done));
async function worker() {
  while (todo.length) {
    const f = todo.shift(), abs = path.join(ROOT, f), st = fs.statSync(abs), body = fs.readFileSync(abs);
    for (let i = 0; i < 4; i++) {
      try { await s3("PUT", f, body, { "content-type": TYPES[path.extname(f)] || "application/octet-stream", "cache-control": "public, max-age=2592000" }); done[f] = st.size + ":" + Math.round(st.mtimeMs); bytes += st.size; break; }
      catch (e) { if (i === 3) { fails++; console.error("\n" + e.message); } else await new Promise(r => setTimeout(r, 1500 * (i + 1))); }
    }
    if (++n % 50 === 0) { save(); process.stdout.write(`\r${n} subidos · ${(bytes / 1e6).toFixed(0)} MB`); }
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
save(); console.log(`\nlisto: ${n - fails} subidos (${(bytes / 1e6).toFixed(0)} MB), ${fails} fallos`);
