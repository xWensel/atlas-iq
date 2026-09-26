/*
 * Atlas IQ - TUTORIAL GUIADO (v0.14). El crupier te enseña la mesa la primera vez: un foco ilumina cada parte de la pantalla y una tarjeta
 * explica para que sirve. Se puede saltar en cualquier momento, se recuerda en el perfil (P.tour) y se reactiva en Ajustes > General.
 *   A.tour.maybe("q" | "camp")   lo llaman la Aventura (primera pregunta) y el Campamento (primera visita)
 */
window.AIQ = window.AIQ || {};
(function (A) {
  const $ = id => document.getElementById(id), C = () => A.core;
  const t6 = s => A.tip6(s);

  /* cada paso: sel = elemento que se ilumina (si no existe o esta oculto, se salta), txt = es|en|fr|pt|de|it */
  const TOURS = {
    q: [
      { sel: "#plate", txt: "Este es el lugar que buscas. Debajo del nombre ves su país (o su continente).|This is the place you're looking for. Under the name you see its country (or continent).|Voici le lieu à trouver. Sous le nom, tu vois son pays (ou son continent).|Este é o lugar que você procura. Abaixo do nome está o país (ou o continente).|Das ist der gesuchte Ort. Unter dem Namen siehst du sein Land (oder den Kontinent).|Questo è il luogo che cerchi. Sotto il nome vedi il suo paese (o continente)." },
      { sel: "#map", box: "center", txt: "Haz clic en el mapa donde crees que está. Con la rueda o los botones + y − haces zoom. Cuanto más cerca, más puntos.|Click on the map where you think it is. Use the wheel or the + and − buttons to zoom. The closer you are, the more points.|Clique sur la carte où tu penses qu'il se trouve. Molette ou boutons + et − pour zoomer. Plus tu es proche, plus tu gagnes de points.|Clique no mapa onde acha que ele está. Use a roda ou os botões + e − para dar zoom. Quanto mais perto, mais pontos.|Klicke auf die Karte, wo du ihn vermutest. Mit dem Rad oder + und − zoomst du. Je näher, desto mehr Punkte.|Clicca sulla mappa dove pensi che sia. Con la rotella o i pulsanti + e − fai zoom. Più sei vicino, più punti ottieni." },
      { sel: ".clock", txt: "El reloj corre: responder rápido también suma puntos.|The clock is ticking: answering fast also earns points.|Le chrono tourne : répondre vite rapporte aussi des points.|O relógio corre: responder rápido também dá pontos.|Die Uhr läuft: schnelle Antworten bringen auch Punkte.|L'orologio corre: rispondere in fretta dà punti." },
      { sel: "#advBar .ab-top", txt: "Doblones para comprar en el Campamento y provisiones ♥: si fallas una ronda pierdes una, y sin provisiones acaba la expedición.|Doubloons to spend at the Camp and provisions ♥: fail a round and you lose one; with none left, the expedition ends.|Des doublons pour acheter au Camp et des provisions ♥ : rater une manche en coûte une ; sans provisions, l'expédition s'arrête.|Dobrões para gastar no Acampamento e provisões ♥: falhar uma rodada custa uma; sem provisões, a expedição termina.|Dublonen zum Einkaufen im Lager und Proviant ♥: Eine verpatzte Runde kostet einen; ohne Proviant endet die Expedition.|Dobloni da spendere al Campo e provviste ♥: fallire un round ne costa una; senza provviste la spedizione finisce." },
            { sel: "#toolBar .tool", all: true, txt: "Tus herramientas: púlsalas (o su número) para usarlas. Dan pistas, como a cuántos km o hacia dónde está el lugar, y se recargan cada ronda.|Your tools: press them (or their number) to use them. They give clues, like how many km away or which way the place is, and refill every round.|Tes outils : appuie dessus (ou sur leur numéro). Ils donnent des indices, comme la distance en km ou la direction du lieu, et se rechargent à chaque manche.|Suas ferramentas: toque nelas (ou no número) para usá-las. Dão pistas, como a quantos km ou em que direção fica o lugar, e recarregam a cada rodada.|Deine Werkzeuge: Drücke sie (oder ihre Zahl). Sie geben Hinweise, etwa Entfernung in km oder Richtung des Ortes, und laden sich jede Runde auf.|I tuoi strumenti: premili (o premi il numero). Danno indizi, come la distanza in km o la direzione del luogo, e si ricaricano a ogni round." },
      { sel: "#ledger", txt: "Cada ronda pide una puntuación mínima. Llega a la marca para superarla.|Every round asks for a minimum score. Reach the mark to clear it.|Chaque manche exige un score minimum. Atteins la marque pour la réussir.|Cada rodada exige uma pontuação mínima. Chegue à marca para superá-la.|Jede Runde verlangt eine Mindestpunktzahl. Erreiche die Marke, um sie zu schaffen.|Ogni round richiede un punteggio minimo. Raggiungi il segno per superarlo." },
    ],
    camp: [
      { sel: ".table .offers", txt: "Entre rondas, el Campamento: elige cartas con tus doblones. Las reliquias te ayudan para siempre; las herramientas se recargan cada ronda.|Between rounds, the Camp: spend doubloons on cards. Relics help you for good; tools refill every round.|Entre les manches, le Camp : dépense tes doublons en cartes. Les reliques t'aident pour de bon ; les outils se rechargent à chaque manche.|Entre rodadas, o Acampamento: gaste dobrões em cartas. Relíquias ajudam para sempre; ferramentas recarregam a cada rodada.|Zwischen den Runden das Lager: gib Dublonen für Karten aus. Relikte helfen dauerhaft; Werkzeuge laden sich jede Runde auf.|Tra un round e l'altro, il Campo: spendi dobloni in carte. Le reliquie aiutano per sempre; gli strumenti si ricaricano a ogni round." },
      { sel: ".tb-next", txt: "Aquí ves los trucos del crupier en la próxima ronda. Puedes sobornarlo para quitar uno o barajar para cambiarlos.|Here you see the dealer's tricks for the next round. Bribe him to remove one, or reshuffle to change them.|Ici, les tours du croupier pour la prochaine manche. Soudoie-le pour en retirer un, ou mélange pour les changer.|Aqui estão os truques do crupiê na próxima rodada. Suborne-o para remover um ou embaralhe para trocá-los.|Hier siehst du die Tricks des Croupiers für die nächste Runde. Bestich ihn, um einen zu streichen, oder mische neu.|Qui vedi i trucchi del croupier nel prossimo round. Corrompilo per toglierne uno o rimescola per cambiarli." },
      { sel: ".tb-tray", txt: "Abajo, tus reliquias (5 huecos: puedes venderlas), herramientas y el botón para empezar la ronda cuando estés listo.|Below: your relics (5 slots, you can sell them), your tools, and the button to start the round when you're ready.|En bas : tes reliques (5 emplacements, tu peux les vendre), tes outils et le bouton pour lancer la manche.|Embaixo: suas relíquias (5 espaços, dá para vendê-las), ferramentas e o botão para começar a rodada.|Unten: deine Relikte (5 Plätze, verkaufbar), Werkzeuge und der Knopf zum Rundenstart.|In basso: le tue reliquie (5 posti, puoi venderle), gli strumenti e il pulsante per iniziare il round." },
    ],
  };

  let cur = null, froze = false;
  const P = () => A.profile.get();
  const dev = /skipboot/.test(location.search) && !/[?&]tour/.test(location.search);        // las pruebas automaticas no lo activan
  const enabled = () => !dev && (!C() || C().S.tour !== false);

  function freeze(on) {
    const S = C().S, map = C().map;
    if (on && S.phase === "asking" && !S.paused) { S.paused = true; S.pauseAt = performance.now(); map.setPick(false); froze = true; }
    else if (!on && froze) { froze = false; if (S.paused && S.phase === "asking") { S.pausedAcc += performance.now() - S.pauseAt; S.paused = false; map.setPick(true); } }
  }
  const visible = el => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 4 && r.height > 4 && !el.closest(".hidden") && getComputedStyle(el).visibility !== "hidden"; };

  function ensure() {
    let el = $("tour"); if (el) return el;
    el = document.createElement("div"); el.id = "tour"; el.className = "tour hidden";
    el.innerHTML = `<i class="tour-hole"></i><div class="tour-card"><img class="tour-face" alt="" src="assets/icons/dealer_neutral.webp"><div class="tour-body"><p class="tour-txt"></p><div class="tour-nav"><button type="button" class="tour-skip"></button><span class="tour-dots"></span><button type="button" class="tour-next btn-ink"></button></div></div></div>`;
    $("app").appendChild(el); return el;
  }

  function place(step) {
    const el = $("tour"), hole = el.querySelector(".tour-hole"), card = el.querySelector(".tour-card");
    const vw = innerWidth, vh = innerHeight;
    let r;
    if (step.box === "center") { const w = Math.min(vw * 0.5, 520), h = Math.min(vh * 0.32, 240); r = { left: (vw - w) / 2, top: vh * 0.46, width: w, height: h }; }
    else {
      const els = [...document.querySelectorAll(step.sel)].filter(visible), p = 8;                    // varios elementos (cartas de herramienta): se ilumina el conjunto
      const bs = els.map(e => e.getBoundingClientRect()), l = Math.min(...bs.map(b => b.left)), t = Math.min(...bs.map(b => b.top)), rr = Math.max(...bs.map(b => b.right)), bb = Math.max(...bs.map(b => b.bottom));
      r = { left: l - p, top: t - p, width: rr - l + 2 * p, height: bb - t + 2 * p };
    }
    hole.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
    const cw = card.offsetWidth, ch = card.offsetHeight, gap = 14;
    let top = r.top + r.height + gap; if (top + ch > vh - 10) top = r.top - ch - gap; if (top < 10) top = Math.max(10, vh - ch - 12);
    let left = r.left + r.width / 2 - cw / 2; left = Math.max(10, Math.min(vw - cw - 10, left));
    if (vw <= 700) { left = 10; top = Math.min(top, vh - ch - 10); }
    card.style.cssText = `left:${left}px;top:${top}px`;
  }

  function show() {
    const tour = cur; if (!tour) return;
    while (tour.i < tour.steps.length) { const s = tour.steps[tour.i]; if (s.box === "center" || [...document.querySelectorAll(s.sel)].some(visible)) break; tour.i++; }
    if (tour.i >= tour.steps.length) return finish(true);
    const step = tour.steps[tour.i], el = ensure();
    el.classList.remove("hidden"); requestAnimationFrame(() => el.classList.add("on"));
    el.querySelector(".tour-txt").textContent = t6(step.txt);
    el.querySelector(".tour-skip").textContent = t6("Saltar tutorial|Skip tutorial|Passer le tutoriel|Pular tutorial|Tutorial überspringen|Salta tutorial");
    const last = tour.i >= tour.steps.length - 1, nx = el.querySelector(".tour-next");
    nx.innerHTML = `<span>${last ? t6("¡Entendido!|Got it!|Compris !|Entendi!|Verstanden!|Capito!") : t6("Siguiente|Next|Suivant|Próximo|Weiter|Avanti")}</span>`;
    el.querySelector(".tour-dots").innerHTML = tour.steps.map((_, k) => `<i class="${k === tour.i ? "on" : ""}"></i>`).join("");
    place(step); A.sfx.card && A.sfx.card();
    nx.onclick = () => { tour.i++; show(); }; el.querySelector(".tour-skip").onclick = () => finish(false, true);
  }
  function finish(done, skipAll) {
    const tour = cur; cur = null; const el = $("tour"); if (el) { el.classList.remove("on"); setTimeout(() => el.classList.add("hidden"), 220); }
    removeEventListener("resize", onResize); removeEventListener("keydown", onKey, true); freeze(false);
    if (tour) { P().tour = P().tour || {}; P().tour[tour.id] = 1; if (skipAll) { P().tour.q = P().tour.camp = 1; } A.profile.save(); }
  }
  const onResize = () => { if (cur) show(); };
  const onKey = e => { if (!cur) return; if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); finish(false, true); } else if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") { e.preventDefault(); e.stopPropagation(); cur.i++; show(); } };

  A.tour = {
    maybe(id) {
      if (cur || !enabled() || !TOURS[id]) return; const pt = P().tour || {}; if (pt[id]) return;
      cur = { id, steps: TOURS[id], i: 0 };
      addEventListener("resize", onResize); addEventListener("keydown", onKey, true);
      setTimeout(() => { if (!cur) return; freeze(true); show(); }, 600);          // deja que la pantalla termine de aparecer
    },
    reset() { P().tour = {}; A.profile.save(); },
    active: () => !!cur,
  };
})(window.AIQ);
