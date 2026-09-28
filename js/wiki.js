/*
 * Geolite - contenido de la Enciclopedia EMPAQUETADO. Textos en 11 idiomas de Wikipedia (es-419 usa el espanol), fotos y creditos de Commons:
 * todo va dentro del juego (tools/build-places.mjs, add-langs.mjs, add-codex.mjs y bundle-media.py); al jugar nunca se consulta Wikipedia.
 * Fotos: assets/wiki/card/<clave>.webp (960 px) y assets/wiki/hd/<clave>.webp (hasta 1920 px). Banderas: assets/flags/<pais>.svg
 * Formato data/wiki/<idioma>.json: { id: [titulo, descripcion, texto, historia] }   data/wiki/img.json: { id: [origen, ancho, alto, [autor, licencia, pagina]] }
 */
window.AIQ = window.AIQ || {};
(function (A) {
  const cache = {}, pending = {}, shortC = {};
  let IMG = null, imgP = null;
  const load = lang => cache[lang] ? Promise.resolve(cache[lang]) : (pending[lang] = pending[lang] || fetch(`data/wiki/${lang}.json`).then(r => (r.ok ? r.json() : {})).catch(() => ({})).then(j => (cache[lang] = j)));
  const loadImg = () => IMG ? Promise.resolve(IMG) : (imgP = imgP || fetch("data/wiki/img.json").then(r => (r.ok ? r.json() : {})).catch(() => ({})).then(j => (IMG = j)));
  /* fotos y banderas empaquetadas por tools/bundle-media.py: el nombre de archivo es la clave con los caracteres raros cambiados por "_" */
  A.mediaKey = id => String(id).replace(/[^A-Za-z0-9._-]/g, "_");
  const card = id => A.media(`assets/wiki/card/${A.mediaKey(id)}.webp`), hdOf = id => A.media(`assets/wiki/hd/${A.mediaKey(id)}.webp`);
  A.wiki = {
    load, loadImg,
    /* devuelve el registro listo para la interfaz, o null si no esta empaquetado */
    async get(id, lang) {
      const [W, I] = await Promise.all([load(lang), loadImg()]); let r = W[id], l = lang;
      if (!r && lang !== "en") { const E = await load("en"); r = E[id]; l = "en"; }
      if (!r) return null;
      /* r[4] = idioma de origen: texto traducido a mano (tools/wiki-tr/) porque esa Wikipedia no tiene articulo; el enlace va al original */
      /* r[5] = dato clave propio (tools/codex-tiers.mjs) y r[6] = {h, k}: idioma de origen de la historia / el dato clave si se tradujeron a mano */
      const src = r[4] || null, srcTitle = src ? ((await load(src))[id] || [r[0]])[0] : r[0];
      const wurl = (lg, t) => `https://${lg}.wikipedia.org/wiki/${encodeURIComponent(String(t).replace(/ /g, "_"))}`;
      const im = I[id], rec = { t: Date.now(), lang: l, tr: src, title: r[0], desc: r[1] || "", extract: r[2] || "", history: r[3] || "", key: r[5] || "", more: "", url: wurl(src || l, srcTitle), pack: true };
      if (r[6]) { rec.tierTr = {}; for (const [k, lg] of Object.entries(r[6])) if (lg) rec.tierTr[k] = { lang: lg, url: wurl(lg, ((await load(lg))[id] || [r[0]])[0]) }; }
      if (im) { rec.img = { thumb: card(id), card: card(id), hd: hdOf(id), w: im[1], h: im[2] }; if (im[3]) rec.credit = { artist: im[3][0], license: im[3][1], page: im[3][2] }; }
      return rec;
    },
    factOf: (id, lang) => { const S = shortC[lang]; return (S && S[id]) || ""; },
  };
  /* limpia el extracto de Wikipedia para las notas: fuera transliteraciones, pronunciaciones y parentesis en otros alfabetos,
     y nunca termina a media frase (los extractos vienen cortados a ~240 caracteres) */
  const cutLast = (t, min = 30) => { const re = /[.!?…](?=\s)|[。！？]/g; let m, p = -1; while ((m = re.exec(t))) { const w = t.slice(Math.max(0, m.index - 3), m.index); if (!/(^|\s)\S{1,2}$/.test(w)) p = m.index; } return p > min ? t.slice(0, p + 1) : t; };
  const badParen = t => /[^\u0000-\u024F\u1E00-\u1EFF\u2000-\u206F\u20A0-\u20CF°–—’‘“”«»·…]/.test(t) || /roman|pron|AFI|IPA|API|escuchar|listen|écouter|ouvir|anhören|ascolta|lit\.|literal|wörtlich|amtlich|[;:[]/i.test(t) || t.length > 70;
  /* quita los parentesis (incluso anidados) con pronunciaciones, otros alfabetos o listas de idiomas; deja los utiles y el ultimo sin cerrar */
  const stripParens = s => {
    let out = "", depth = 0, start = -1;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === "(") { if (!depth) start = i; depth++; }
      else if (c === ")" && depth) { depth--; if (!depth) { const t = s.slice(start + 1, i); if (badParen(t) || /\/[^\/]{2,}\//.test(t)) out = out.replace(/\s+$/, ""); else out += s.slice(start, i + 1); } }
      else if (!depth) out += c;
    }
    return depth ? out + s.slice(start) : out;
  };
  /* texto largo (Enciclopedia): quita pronunciaciones y parentesis raros, sin recortar nada */
  A.cleanText = raw => {
    let s = String(raw || "").replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/[ \t]+/g, " ");
    s = stripParens(s).replace(/\s*\[[^\]]{1,90}\]/g, "").replace(/\s*\/[^\/\n]*[ɐ-˿̀-ͯ]+[^\/\n]*\//g, "").replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").replace(/\.\.(?!\.)/g, ".");
    s = s.replace(/[,，、;；:：]\s*([)）])/g, "$1").replace(/\s*[(（]\s*[)）]/g, "");   // "（英语：Bondi Beach，）" tras quitar la pronunciacion
    return s.replace(/\s+([,.;:])/g, "$1").replace(/,\s*\./g, ".").replace(/[ \t]{2,}/g, " ").replace(/ *\n */g, "\n").trim();
  };
  /* frases completas (no parte en abreviaturas ni iniciales) */
  const ABBR = new Set("a.c d.c a.m p.m st sta sto dr dra sr sra mr mrs ms mt vs etc no núm n.º fig cf ca c s ss pp p vol ed jr gen col cap prof pág av dept est ex approx inc ltd co corp u.s u.k e.g i.e mme mlle dott ing avv sig fr".split(" "));
  A.sentences = raw => {
    const t = String(raw || "").replace(/\s+/g, " ").trim(), out = []; let start = 0, m;
    if (/[぀-ヿ㐀-鿿]/.test(t)) return t.split(/(?<=[。！？])/).map(x => x.trim()).filter(Boolean);   // chino y japones: sin espacios entre frases
    const re = /[.!?…]["»”)]?(?=\s+["«“¿¡(]?[\p{Lu}\p{Lo}0-9])/gu;
    while ((m = re.exec(t))) {
      const w = (t.slice(start, m.index).match(/([\p{L}.]+)$/u) || [])[1] || "", tok = w.toLowerCase().replace(/\.$/, "");
      if (tok.length <= 1 || ABBR.has(tok)) continue;
      out.push(t.slice(start, m.index + m[0].length).trim()); start = m.index + m[0].length;
    }
    const rest = t.slice(start).trim(); if (rest) out.push(rest); return out;
  };
  A.cleanFact = raw => {
    let s = String(raw || "").replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\s+/g, " ").trim(); if (!s) return "";
    const truncated = !/[.!?…»”)。！？」]$/.test(s) || /(^|\s)\S{1,2}\.$/.test(s);
    s = stripParens(s).replace(/\s*\[[^\]]{1,90}\]/g, "").replace(/\s*\/[^\/]*[ɐ-˿̀-ͯ]+[^\/]*\//g, "").replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").replace(/\.\.(?!\.)/g, ".");
    let d = 0, first = -1; for (let i = 0; i < s.length; i++) { if (s[i] === "(") { if (!d) first = i; d++; } else if (s[i] === ")" && d) d--; }
    if (d > 0 && first > -1) s = s.slice(0, first);                                                   // parentesis sin cerrar (texto cortado)
    s = s.replace(/\s+([,.;:])/g, "$1").replace(/,\s*\./g, ".").replace(/\s{2,}/g, " ").replace(/[,;:\s]+$/, "").trim();
    if (truncated || d > 0) { const c = cutLast(s + " ", 12).trim(), tail = s.length - c.length; const cjk = /[぀-ヿ㐀-鿿]/.test(s); s = c !== s && tail < 60 ? c : cjk ? s.replace(/[，、,][^，、,]*$/, "") + "。" : s.replace(/\s+\S*$/, "").replace(/[,;:\s]+$/, "") + "."; }   // nunca puntos suspensivos: si aun aporta se deja, cerrada con punto
    if (s.length > 440) { const c = cutLast(s.slice(0, 440) + " ").trim(); s = c.length < s.length && /[.!?…]$/.test(c) ? c : s.slice(0, 438).replace(/\s+\S*$/, "").replace(/[,;:\s]+$/, "") + "."; }
    if (s && !/[.!?…»”)。！？」]$/.test(s)) s += /[぀-ヿ㐀-鿿]/.test(s) ? "。" : ".";
    return s;
  };
  /* dato curioso corto (descripcion + 1.a frase) para las notas de campo; se usa en la Aventura */
  A.factOf = o => { const id = o.cid && o.cid[0]; return id ? A.cleanFact(A.wiki.factOf(id, A.wlang())) : ""; };
  const loadShort = lang => (shortC[lang] ? Promise.resolve(shortC[lang]) : fetch(`data/wiki/${lang}-s.json`).then(r => (r.ok ? r.json() : {})).catch(() => ({})).then(j => (shortC[lang] = j)));
  A.wiki.loadShort = loadShort; loadShort((A.wlang && A.wlang()) || "es");
})(window.AIQ);
