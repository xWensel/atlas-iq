/*
 * Geolite - ilustraciones (v0.15): las escenas grandes (jefes, actos, campamento, cofre, finales, temas) son pixel art casino
 * generado (tools/gen_art.py) en assets/gen/. Ya no hay versiones vectoriales de respaldo: mientras carga, se ve el marco oscuro.
 */
window.AIQ = window.AIQ || {};
(function (A) {
  A.GEN = new Set();
  A.genReady = fetch("assets/manifest.json").then(r => (r.ok ? r.json() : { gen: [] })).then(m => { A.GEN = new Set(m.gen || []); }).catch(() => {});
  A.genFill = (root = document) => A.genReady.then(() => root.querySelectorAll("img[data-gen]:not([src])").forEach(im => {
    if (!A.GEN.has(im.dataset.gen)) return;
    im.onload = () => { im.classList.add("on"); if (im.parentElement) im.parentElement.classList.add("has-gen"); };
    im.src = "assets/gen/" + im.dataset.gen + ".webp";
  }));
  A.pic = (id, cls = "") => { setTimeout(() => A.genFill(), 0); return `<span class="pic ${cls}"><img class="pic-img" alt="" data-gen="${id}" decoding="async"><i class="pic-frame"></i><i class="marq"></i></span>`; };
  A.art = () => "";
})(window.AIQ);
