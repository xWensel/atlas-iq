/*
 * Atlas IQ - contenido de la Enciclopedia EMPAQUETADO (v0.9). Los textos (en 6 idiomas), las fotos y sus creditos se descargaron una vez
 * de Wikipedia/Wikimedia Commons con tools/build-places.mjs y viven en data/wiki/. Asi la Enciclopedia esta completa y funciona sin conexion.
 * Formato data/wiki/<idioma>.json: { id: [titulo, descripcion, texto, historia] }   data/wiki/img.json: { id: [origen, ancho, alto, [autor, licencia, pagina]] }
 */
window.AIQ = window.AIQ || {};
(function (A) {
  const cache = {}, pending = {}, shortC = {};
  let IMG = null, imgP = null;
  const load = lang => cache[lang] ? Promise.resolve(cache[lang]) : (pending[lang] = pending[lang] || fetch(`data/wiki/${lang}.json`).then(r => (r.ok ? r.json() : {})).catch(() => ({})).then(j => (cache[lang] = j)));
  const loadImg = () => IMG ? Promise.resolve(IMG) : (imgP = imgP || fetch("data/wiki/img.json").then(r => (r.ok ? r.json() : {})).catch(() => ({})).then(j => (IMG = j)));
  const fileOf = src => { const parts = String(src).split("?")[0].split("/"); let f = parts.pop(); if (parts.includes("thumb")) f = parts.pop(); else f = f.replace(/^\d+px-/, ""); return decodeURIComponent(f); };   // las miniaturas de Wikipedia llevan el archivo original en el segmento anterior
  const fp = (src, w) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileOf(src))}?width=${w}`;
  A.wiki = {
    load, loadImg,
    /* devuelve el registro listo para la interfaz, o null si no esta empaquetado */
    async get(id, lang) {
      const [W, I] = await Promise.all([load(lang), loadImg()]); let r = W[id], l = lang;
      if (!r && lang !== "en") { const E = await load("en"); r = E[id]; l = "en"; }
      if (!r) return null;
      const im = I[id], rec = { t: Date.now(), lang: l, title: r[0], desc: r[1] || "", extract: r[2] || "", history: r[3] || "", more: "", url: null, pack: true };
      if (im) { rec.img = { thumb: fp(im[0], 500), card: fp(im[0], 960), hd: fp(im[0], im[1] >= 1920 ? 1920 : 1280), w: im[1], h: im[2] }; if (im[3]) rec.credit = { artist: im[3][0], license: im[3][1], page: im[3][2] }; }
      return rec;
    },
    factOf: (id, lang) => { const S = shortC[lang]; return (S && S[id]) || ""; },
  };
  /* limpia el extracto de Wikipedia para las notas: fuera transliteraciones, pronunciaciones y parentesis en otros alfabetos,
     y nunca termina a media frase (los extractos vienen cortados a ~240 caracteres) */
  const cutLast = (t, min = 30) => { const re = /[.!?…](?=\s)/g; let m, p = -1; while ((m = re.exec(t))) { const w = t.slice(Math.max(0, m.index - 3), m.index); if (!/(^|\s)\S{1,2}$/.test(w)) p = m.index; } return p > min ? t.slice(0, p + 1) : t; };
  const badParen = t => /[^\u0000-\u024F\u1E00-\u1EFF\u2000-\u206F\u20A0-\u20CF°–—’‘“”«»·…]/.test(t) || /roman|pron|AFI|IPA|API|escuchar|listen|écouter|ouvir|anhören|ascolta|lit\.|literal|wörtlich|amtlich|[;:[]/i.test(t) || t.length > 70;
  A.cleanFact = raw => {
    let s = String(raw || "").replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\s+/g, " ").trim(); if (!s) return "";
    const truncated = !/[.!?…»”)]$/.test(s) || /(^|\s)\S{1,2}\.$/.test(s);
    for (let k = 0; k < 6; k++) { const n = s.replace(/\s*\(([^()]*)\)/g, (m, t) => (badParen(t) ? "" : m)); if (n === s) break; s = n; }
    let d = 0, first = -1; for (let i = 0; i < s.length; i++) { if (s[i] === "(") { if (!d) first = i; d++; } else if (s[i] === ")" && d) d--; }
    if (d > 0 && first > -1) s = s.slice(0, first);                                                   // parentesis sin cerrar (texto cortado)
    s = s.replace(/\s+([,.;:])/g, "$1").replace(/,\s*\./g, ".").replace(/\s{2,}/g, " ").replace(/[,;:\s]+$/, "").trim();
    if (truncated || d > 0) { const c = cutLast(s + " ", 12).trim(), tail = s.length - c.length; s = c !== s && tail < 60 ? c : s.replace(/\s+\S*$/, "") + "…"; }   // si la frase cortada aun aporta, se deja con puntos suspensivos
    if (s.length > 230) { const c = cutLast(s.slice(0, 230) + " ").trim(); s = c.length < s.length && /[.!?…]$/.test(c) ? c : s.slice(0, 228).replace(/\s+\S*$/, "") + "…"; }
    if (s && !/[.!?…»”)]$/.test(s)) s += ".";
    return s;
  };
  /* dato curioso corto (descripcion + 1.a frase) para las notas de campo; se usa en la Aventura */
  A.factOf = o => { const id = o.cid && o.cid[0]; return id ? A.cleanFact(A.wiki.factOf(id, A.lang)) : ""; };
  const loadShort = lang => (shortC[lang] ? Promise.resolve(shortC[lang]) : fetch(`data/wiki/${lang}-s.json`).then(r => (r.ok ? r.json() : {})).catch(() => ({})).then(j => (shortC[lang] = j)));
  A.wiki.loadShort = loadShort; loadShort(A.lang || "es");
})(window.AIQ);
