/*
 * Atlas IQ - RETOS de la Aventura (v0.11). El crupier "toca la mesa": cada ronda trae retos que cambian
 *   - el NOMBRE del lugar (letras que tiemblan, faltan, se cambian, runas, anagramas, otro idioma, adivinanza...),
 *   - el MAPA (borroso, apagon, fronteras falsas, Pangea, continentes movidos, del reves, terremoto, deriva, lluvia, rayos...),
 *   - el PUNTERO (tiembla, parpadea, desaparece, se emborrona, va con retraso, se mueve al reves, marea...) y
 *   - las REGLAS (viento, tormenta, silencio).
 * No tocan la puntuacion: solo hacen mas dificil encontrar el sitio. Los perks los mitigan (ver `fx` en js/relics.js).
 *
 *   A.chal.plan(seed, roundNo, asc)   -> { list:[{id,lv}], boss, combo }   (determinista: la tienda anuncia la ronda siguiente)
 *   A.chal.begin(list, fx, ctx)       A.chal.question(o, qi)   A.chal.reveal()   A.chal.suspend()   A.chal.end()
 *   A.chal.ptrMods()                  -> parametros del puntero para js/pointer.js
 */
window.AIQ = window.AIQ || {};
(function (A) {
  const $ = id => document.getElementById(id);
  const L6 = s => { const [es, en, fr, pt, de, it] = s.split("|"); return { es, en, fr, pt, de, it: it || en }; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ------------------------------------------------------------------ catalogo */
  const D = {};
  const def = (id, kind, ico, n, d, counters) => { D[id] = { id, kind, ico, n: L6(n), d: L6(d), counters: counters || [] }; };
  /* --- nombre del lugar --- */
  def("shaky", "text", "ch_shaky", "Letras temblorosas|Shaky letters|Lettres tremblantes|Letras trêmulas|Zitternde Buchstaben|Lettere tremanti", "El nombre tiembla y cuesta leerlo.|The name trembles and is hard to read.|Le nom tremble et se lit mal.|O nome treme e é difícil de ler.|Der Name zittert und ist schwer lesbar.|Il nome trema ed è difficile da leggere.", ["steadyhand", "spectacles"]);
  def("missing", "text", "ch_missing", "Tinta borrada|Faded ink|Encre effacée|Tinta apagada|Verblasste Tinte|Inchiostro sbiadito", "Faltan letras del nombre.|Some letters of the name are missing.|Il manque des lettres du nom.|Faltam letras do nome.|Im Namen fehlen Buchstaben.|Mancano lettere del nome.", ["dictionary", "spectacles"]);
  def("swap", "text", "ch_swap", "Letras cambiadas|Swapped letters|Lettres échangées|Letras trocadas|Vertauschte Buchstaben|Lettere scambiate", "Algunas letras están intercambiadas.|Some letters are swapped around.|Certaines lettres sont échangées.|Algumas letras estão trocadas.|Manche Buchstaben sind vertauscht.|Alcune lettere sono scambiate.", ["corrector", "spectacles"]);
  def("mirror", "text", "ch_mirror", "Espejo|Mirror|Miroir|Espelho|Spiegel|Specchio", "El nombre está escrito del revés.|The name is written in mirror image.|Le nom est écrit en miroir.|O nome aparece espelhado.|Der Name ist gespiegelt.|Il nome è scritto a specchio.", ["handmirror"]);
  def("memory", "text", "ch_memory", "Memoria de pez|Goldfish memory|Mémoire de poisson|Memória de peixe|Fischgedächtnis|Memoria di pesce", "El nombre se desvanece: recuérdalo.|The name fades away: remember it.|Le nom s'efface : retiens-le.|O nome desaparece: memorize-o.|Der Name verblasst: merk ihn dir.|Il nome svanisce: ricordalo.", ["sticky", "spectacles"]);
  def("upside", "text", "ch_upside", "Boca abajo|Upside down|La tête en bas|De cabeça para baixo|Kopfüber|Sottosopra", "El nombre está del revés.|The name is upside down.|Le nom est à l'envers.|O nome está de cabeça para baixo.|Der Name steht auf dem Kopf.|Il nome è capovolto.", ["handmirror"]);
  def("runes", "text", "ch_runes", "Runas|Runes|Runes|Runas|Runen|Rune", "Letras sustituidas por símbolos parecidos.|Letters swapped for look-alike symbols.|Lettres remplacées par des symboles qui leur ressemblent.|Letras trocadas por símbolos parecidos.|Buchstaben durch ähnliche Symbole ersetzt.|Lettere sostituite da simboli simili.", ["decoder", "spectacles"]);
  def("scroll", "text", "ch_scroll", "Marquesina|Ticker sign|Enseigne défilante|Letreiro|Laufschrift|Insegna scorrevole", "El nombre pasa como un letrero luminoso.|The name scrolls by like a neon sign.|Le nom défile comme une enseigne lumineuse.|O nome passa como um letreiro luminoso.|Der Name läuft wie eine Leuchtschrift vorbei.|Il nome scorre come un'insegna luminosa.", ["handbrake"]);
  def("novowels", "text", "ch_novowels", "Sin vocales|No vowels|Sans voyelles|Sem vogais|Ohne Vokale|Senza vocali", "Las vocales han desaparecido.|The vowels are gone.|Les voyelles ont disparu.|As vogais sumiram.|Die Vokale sind verschwunden.|Le vocali sono sparite.", ["decoder", "dictionary"]);
  def("anagram", "text", "ch_anagram", "Anagrama|Anagram|Anagramme|Anagrama|Anagramm|Anagramma", "Las letras del interior están mezcladas.|The inner letters are shuffled.|Les lettres intérieures sont mélangées.|As letras internas estão embaralhadas.|Die inneren Buchstaben sind gemischt.|Le lettere interne sono mescolate.", ["corrector", "decoder"]);
  def("dance", "text", "ch_dance", "Baile de letras|Dancing letters|Lettres qui dansent|Letras dançantes|Tanzende Buchstaben|Lettere che ballano", "Las letras saltan arriba y abajo.|The letters bounce up and down.|Les lettres sautent de haut en bas.|As letras pulam para cima e para baixo.|Die Buchstaben hüpfen auf und ab.|Le lettere saltellano su e giù.", ["steadyhand", "handbrake"]);
  def("riddle", "text", "ch_riddle", "Adivinanza|Riddle|Devinette|Adivinha|Rätsel|Indovinello", "En vez del nombre, una pista con el nombre tapado.|A clue with the name blanked out replaces the name.|Un indice au nom masqué remplace le nom.|Uma pista com o nome tapado substitui o nome.|Statt des Namens ein Hinweis mit verdecktem Namen.|Al posto del nome, un indizio con il nome coperto.", ["detective"]);
  def("babel", "text", "ch_babel", "Torre de Babel|Tower of Babel|Tour de Babel|Torre de Babel|Turmbau zu Babel|Torre di Babele", "El nombre aparece en otro idioma.|The name appears in another language.|Le nom apparaît dans une autre langue.|O nome aparece em outro idioma.|Der Name erscheint in einer anderen Sprache.|Il nome appare in un'altra lingua.", ["translator"]);
  /* --- mapa --- */
  def("blur", "map", "ch_blur", "Mapa borroso|Blurry map|Carte floue|Mapa desfocado|Verschwommene Karte|Mappa sfocata", "El mapa está desenfocado.|The map is out of focus.|La carte est floue.|O mapa está fora de foco.|Die Karte ist unscharf.|La mappa è sfocata.", ["lens", "divingmask"]);
  def("dark", "map", "ch_dark", "Apagón|Blackout|Panne de courant|Apagão|Stromausfall|Blackout", "El casino se queda a oscuras: solo ves cerca del puntero.|The casino goes dark: you only see near your pointer.|Le casino s'éteint : tu ne vois qu'autour du pointeur.|O cassino fica às escuras: só se vê perto do ponteiro.|Das Casino wird dunkel: du siehst nur um den Zeiger.|Il casinò si spegne: vedi solo vicino al puntatore.", ["miner", "neon"]);
  def("flicker", "map", "ch_flicker", "Luces parpadeantes|Flickering lights|Lumières clignotantes|Luzes piscando|Flackerndes Licht|Luci intermittenti", "Las luces se apagan a ratos y el mapa desaparece.|The lights cut out and the map vanishes for a moment.|Les lumières s'éteignent et la carte disparaît un instant.|As luzes apagam e o mapa some por um instante.|Das Licht fällt aus und die Karte verschwindet kurz.|Le luci si spengono e la mappa sparisce per un attimo.", ["generator"]);
  def("wrongborders", "map", "ch_wrongborders", "Fronteras falsas|False borders|Fausses frontières|Fronteiras falsas|Falsche Grenzen|Confini falsi", "Las fronteras dibujadas mienten.|The drawn borders are lying.|Les frontières dessinées mentent.|As fronteiras desenhadas mentem.|Die gezeichneten Grenzen lügen.|I confini disegnati mentono.", ["customs"]);
  def("noborders", "map", "ch_noborders", "Mapa mudo|Blank map|Carte muette|Mapa mudo|Stumme Karte|Mappa muta", "Sin fronteras en el mapa.|No borders on the map.|Pas de frontières sur la carte.|Sem fronteiras no mapa.|Keine Grenzen auf der Karte.|Nessun confine sulla mappa.", ["theodolite"]);
  def("pangea", "map", "ch_pangea", "Pangea|Pangaea|Pangée|Pangeia|Pangaea|Pangea", "Los continentes se han acercado.|The continents have drifted closer.|Les continents se sont rapprochés.|Os continentes se aproximaram.|Die Kontinente sind zusammengerückt.|I continenti si sono avvicinati.", ["plates"]);
  def("shuffle", "map", "ch_shuffle", "Continentes cambiados|Continents swapped|Continents échangés|Continentes trocados|Kontinente vertauscht|Continenti scambiati", "Los continentes han cambiado de sitio.|The continents have changed places.|Les continents ont changé de place.|Os continentes mudaram de lugar.|Die Kontinente haben die Plätze getauscht.|I continenti hanno cambiato posto.", ["plates"]);
  def("spread", "map", "ch_spread", "Big bang|Big bang|Big bang|Big bang|Urknall|Big bang", "Los continentes se han separado.|The continents have drifted apart.|Les continents se sont éloignés.|Os continentes se afastaram.|Die Kontinente sind auseinandergedriftet.|I continenti si sono allontanati.", ["plates"]);
  def("tilt", "map", "ch_tilt", "Continentes torcidos|Crooked continents|Continents de travers|Continentes tortos|Schiefe Kontinente|Continenti storti", "Cada continente está girado.|Every continent is turned.|Chaque continent est tourné.|Cada continente está girado.|Jeder Kontinent ist gedreht.|Ogni continente è ruotato.", ["plates"]);
  def("flip", "map", "ch_flip", "Mundo del revés|Upside-down world|Monde à l'envers|Mundo de cabeça para baixo|Welt auf dem Kopf|Mondo capovolto", "El Sur está arriba.|South is up.|Le Sud est en haut.|O Sul está em cima.|Der Süden ist oben.|Il Sud è in alto.", ["astrolabe"]);
  def("mirrorx", "map", "ch_mirrorx", "Espejo del mapa|Mirror map|Carte miroir|Mapa espelhado|Spiegelkarte|Mappa a specchio", "Este y Oeste están intercambiados.|East and West are swapped.|L'Est et l'Ouest sont échangés.|Leste e Oeste estão trocados.|Ost und West sind vertauscht.|Est e Ovest sono scambiati.", ["astrolabe", "handmirror"]);
  def("spin", "map", "ch_spin", "Ruleta|Roulette|Roulette|Roleta|Roulette|Roulette", "El mapa gira despacio.|The map slowly spins.|La carte tourne lentement.|O mapa gira devagar.|Die Karte dreht sich langsam.|La mappa gira lentamente.", ["astrolabe", "shockabsorber"]);
  def("clouds", "map", "ch_clouds", "Humo de sala|Smoky room|Salle enfumée|Sala esfumaçada|Verrauchter Saal|Sala fumosa", "El humo tapa partes del mapa.|Smoke covers parts of the map.|La fumée cache des parties de la carte.|A fumaça cobre partes do mapa.|Rauch verdeckt Teile der Karte.|Il fumo copre parti della mappa.", ["fan", "umbrella"]);
  def("rain", "map", "ch_rain", "Lluvia|Rain|Pluie|Chuva|Regen|Pioggia", "La lluvia tapa y emborrona el mapa.|Rain streaks cover the map.|La pluie brouille la carte.|A chuva embaça o mapa.|Regen trübt die Karte.|La pioggia offusca la mappa.", ["umbrella"]);
  def("myopia", "map", "ch_myopia", "Miopía|Nearsighted|Myopie|Miopia|Kurzsichtig|Miopia", "Todo se ve nítido menos donde apuntas.|Everything is sharp except where you aim.|Tout est net sauf là où tu vises.|Tudo fica nítido menos onde você mira.|Alles ist scharf, außer wo du zielst.|Tutto è nitido tranne dove miri.", ["graduated"]);
  def("blindspot", "map", "ch_blindspot", "Punto ciego|Blind spot|Angle mort|Ponto cego|Blinder Fleck|Punto cieco", "Un círculo negro tapa donde apuntas.|A black circle hides where you aim.|Un cercle noir cache ta visée.|Um círculo preto esconde onde você mira.|Ein schwarzer Kreis verdeckt dein Ziel.|Un cerchio nero copre dove mira.", ["graduated"]);
  def("mosaic", "map", "ch_mosaic", "Píxeles gordos|Chunky pixels|Gros pixels|Pixels gordos|Grobe Pixel|Pixel giganti", "El mapa se ve a muy baja resolución.|The map is shown in very low resolution.|La carte est en très basse résolution.|O mapa aparece em baixíssima resolução.|Die Karte hat eine sehr niedrige Auflösung.|La mappa è a bassissima risoluzione.", ["hdglasses"]);
  def("negative", "map", "ch_negative", "Negativo|Negative|Négatif|Negativo|Negativ|Negativo", "Los colores están invertidos.|The colors are inverted.|Les couleurs sont inversées.|As cores estão invertidas.|Die Farben sind invertiert.|I colori sono invertiti.", ["polarized"]);
  def("quake", "map", "ch_quake", "Terremoto|Earthquake|Tremblement de terre|Terremoto|Erdbeben|Terremoto", "El mapa tiembla sin parar.|The map shakes nonstop.|La carte tremble sans cesse.|O mapa treme sem parar.|Die Karte bebt ununterbrochen.|La mappa trema senza sosta.", ["shockabsorber"]);
  def("drift", "map", "ch_drift", "Deriva|Drift|Dérive|Deriva|Abdrift|Deriva", "El mapa se desliza solo.|The map slides on its own.|La carte glisse toute seule.|O mapa desliza sozinho.|Die Karte gleitet von allein.|La mappa scivola da sola.", ["shockabsorber"]);
  def("decoys", "map", "ch_decoys", "Chinchetas trampa|Decoy pins|Épingles leurres|Pinos falsos|Lockvogel-Pins|Pin esca", "Falsas chinchetas confunden el mapa.|Fake pins clutter the map.|De fausses épingles brouillent la carte.|Pinos falsos confundem o mapa.|Falsche Pins verwirren die Karte.|Pin falsi confondono la mappa.", ["trapdetector"]);
  def("lightning", "map", "ch_lightning", "Rayos|Lightning|Éclairs|Raios|Blitze|Fulmini", "Destellos que ciegan un instante.|Flashes that blind for an instant.|Des éclairs qui aveuglent un instant.|Clarões que cegam por um instante.|Blitze, die kurz blenden.|Lampi che accecano per un istante.", ["lightningrod"]);
  /* --- puntero --- */
  def("tremble", "ptr", "ch_tremble", "Pulso tembloroso|Shaky hand|Main tremblante|Mão trêmula|Zittrige Hand|Mano tremante", "Tu puntero tiembla, y el clic también.|Your pointer shakes, and so does your click.|Ton pointeur tremble, et ton clic aussi.|Seu ponteiro treme, e o clique também.|Dein Zeiger zittert, und dein Klick auch.|Il puntatore trema, e anche il clic.", ["steadyhand", "leadweight"]);
  def("blink", "ptr", "ch_blink", "Cursor parpadeante|Blinking cursor|Curseur clignotant|Cursor piscante|Blinkender Zeiger|Cursore lampeggiante", "El puntero parpadea y se apaga a ratos.|The pointer blinks on and off.|Le pointeur clignote.|O ponteiro pisca e apaga.|Der Zeiger blinkt.|Il puntatore lampeggia.", ["beacon", "gamer"]);
  def("ghost", "ptr", "ch_ghost", "Cursor fantasma|Ghost cursor|Curseur fantôme|Cursor fantasma|Geisterzeiger|Cursore fantasma", "El puntero desaparece unos segundos.|The pointer vanishes for a few seconds.|Le pointeur disparaît quelques secondes.|O ponteiro some por alguns segundos.|Der Zeiger verschwindet für einige Sekunden.|Il puntatore sparisce per qualche secondo.", ["beacon"]);
  def("cblur", "ptr", "ch_cblur", "Cursor borroso|Blurry cursor|Curseur flou|Cursor borrado|Verschwommener Zeiger|Cursore sfocato", "El puntero se ve desenfocado.|The pointer looks out of focus.|Le pointeur est flou.|O ponteiro fica desfocado.|Der Zeiger ist unscharf.|Il puntatore è sfocato.", ["divingmask", "beacon"]);
  def("lag", "ptr", "ch_lag", "Cursor con retraso|Laggy cursor|Curseur en retard|Cursor com atraso|Verzögerter Zeiger|Cursore in ritardo", "El puntero va con retraso.|The pointer lags behind.|Le pointeur est en retard.|O ponteiro anda atrasado.|Der Zeiger hinkt hinterher.|Il puntatore è in ritardo.", ["gamer", "leadweight"]);
  def("cmirror", "ptr", "ch_cmirror", "Controles invertidos|Reversed controls|Commandes inversées|Controles invertidos|Umgekehrte Steuerung|Comandi invertiti", "El puntero se mueve al revés.|The pointer moves the opposite way.|Le pointeur bouge à l'envers.|O ponteiro se move ao contrário.|Der Zeiger bewegt sich verkehrt herum.|Il puntatore si muove al contrario.", ["handmirror"]);
  def("dizzy", "ptr", "ch_dizzy", "Mareo|Dizzy|Vertige|Tontura|Schwindel|Capogiro", "El puntero da vueltas a tu alrededor.|The pointer circles around you.|Le pointeur tourne autour de toi.|O ponteiro gira ao seu redor.|Der Zeiger kreist um dich.|Il puntatore ti gira intorno.", ["leadweight"]);
  /* --- reglas --- */
  def("wind", "rule", "wind", "Vendaval|Gale|Rafale|Vendaval|Sturm|Bufera", "El viento desvía tu pin.|The wind pushes your pin.|Le vent dévie ton épingle.|O vento desvia seu pino.|Der Wind lenkt deinen Pin ab.|Il vento sposta il tuo pin.", ["weathervane"]);
  def("storm", "rule", "storm", "Tormenta|Storm|Tempête|Tempestade|Gewitter|Tempesta", "Solo tienes el 55 % del tiempo.|You only get 55% of the time.|Tu n'as que 55 % du temps.|Você só tem 55% do tempo.|Du hast nur 55 % der Zeit.|Hai solo il 55% del tempo.", ["earplugs"]);
  def("silence", "rule", "silence", "Silencio|Silence|Silence|Silêncio|Stille|Silenzio", "Tus herramientas no funcionan.|Your tools don't work.|Tes outils ne marchent pas.|Suas ferramentas não funcionam.|Deine Werkzeuge funktionieren nicht.|I tuoi strumenti non funzionano.", ["earplugs"]);
  A.CHAL = D;

  const KIND = k => Object.keys(D).filter(id => D[id].kind === k);
  const TEXT = KIND("text"), MAPC = KIND("map"), PTR = KIND("ptr"), RULE = KIND("rule");
  /* en una misma ronda no se juntan retos "de la misma familia" */
  const FAMILY = { wrongborders: "b", noborders: "b", pangea: "p", shuffle: "p", spread: "p", tilt: "p", flip: "o", mirrorx: "o", spin: "o", blur: "v", dark: "v", myopia: "v", blindspot: "v", clouds: "v", rain: "v", mosaic: "v", flicker: "l", lightning: "l", quake: "m", drift: "m", decoys: "d", negative: "n" };
  const famOf = id => FAMILY[id] || (D[id].kind === "text" ? "t" : D[id].kind === "ptr" ? "c" : id);
  const MILD_TEXT = ["shaky", "missing", "swap", "upside", "babel", "dance"], MILD_MAP = ["blur", "dark", "noborders", "clouds", "mirrorx", "negative", "rain"];
  const BOSS = [
    [["El Apagón|The Blackout|La panne|O Apagão|Der Stromausfall|Il Blackout", ["dark", "flicker"]], ["Ronda ciega|Blind round|Manche aveugle|Rodada cega|Blinde Runde|Round cieco", ["blur", "missing"]], ["Un solo continente|One continent|Un seul continent|Um só continente|Ein Kontinent|Un solo continente", ["pangea", "swap"]], ["Mareo de casino|Casino dizziness|Vertige de casino|Tontura de cassino|Casino-Schwindel|Capogiro da casinò", ["dizzy", "shaky"]]],
    [["Falsa alarma|False alarm|Fausse alerte|Falso alarme|Fehlalarm|Falso allarme", ["shuffle", "wrongborders"]], ["Mala visión|Bad eyesight|Mauvaise vue|Vista turva|Schlechte Sicht|Vista offuscata", ["flip", "anagram"]], ["Noche cerrada|Dead of night|Nuit noire|Noite fechada|Tiefste Nacht|Notte fonda", ["dark", "shaky", "wind"]], ["Terremoto en la sala|Quake in the hall|Séisme dans la salle|Terremoto no salão|Beben im Saal|Terremoto in sala", ["quake", "decoys"]]],
    [["El gran espejo|The great mirror|Le grand miroir|O grande espelho|Der große Spiegel|Il grande specchio", ["flip", "cmirror", "blur"]], ["Baraja revuelta|Shuffled deck|Jeu mélangé|Baralho embaralhado|Gemischtes Deck|Mazzo mescolato", ["shuffle", "dark", "missing"]], ["Todo o nada|All or nothing|Quitte ou double|Tudo ou nada|Alles oder nichts|Tutto o niente", ["wrongborders", "flicker", "storm"]], ["Tormenta perfecta|Perfect storm|Tempête parfaite|Tempestade perfeita|Perfekter Sturm|Tempesta perfetta", ["lightning", "rain", "tremble"]], ["Torre de Babel|Tower of Babel|Tour de Babel|Torre de Babel|Turmbau zu Babel|Torre di Babele", ["babel", "runes", "mosaic"]]],
  ].map(a => a.map(c => ({ n: L6(c[0]), ids: c[1] })));
  const ACT1 = [["text", "map"], ["ptr", "map"], ["text", "ptr"]], ACT2 = [["text", "map", "ptr"], ["map", "ptr", "rule"], ["text", "map", "map"]];

  /* ------------------------------------------------------------------ plan (determinista por semilla y ronda) */
  const pickFrom = (seed, tag, list, r, avoid) => { const ok = list.filter(id => !avoid.includes(famOf(id))), l = ok.length ? ok : list; return A.rng(`${seed}:${tag}:${Math.floor(r / 4)}:${r % 4}`).pick(l); };
  A.chal = {
    DEFS: D, TEXT, MAPC, PTR, RULE,
    plan(seed, r, asc = 0) {
      const act = Math.floor(r / 4), pos = r % 4, boss = pos === 3, a = Math.min(act, 2);
      const lv = clamp(a + 1 + (asc >= 3 ? 1 : 0), 1, 3);
      let list = [], combo = null;
      if (boss) {
        combo = A.rng(`${seed}:boss:${act}`).pick(BOSS[a]);
        list = combo.ids.map((id, i) => ({ id, lv: clamp(lv + (i === 0 ? 1 : 0), 1, 3) }));
        if (act >= 3) { const rr = A.rng(`${seed}:legend:${r}`), all = rr.shuffle([...TEXT, ...MAPC, ...PTR, ...RULE]); combo = { n: L6("La apuesta final|The final bet|La mise finale|A aposta final|Der letzte Einsatz|La puntata finale"), ids: [] }; list = []; const fam = new Set(); for (const id of all) { const f = famOf(id); if (fam.has(f)) continue; fam.add(f); list.push({ id, lv: 3 }); combo.ids.push(id); if (list.length === 4) break; } }
        return { list, boss, combo };
      }
      const used = [];
      const add = (cat, mild) => { const pool = cat === "text" ? (mild ? MILD_TEXT : TEXT) : cat === "ptr" ? PTR : cat === "rule" ? RULE : (mild ? MILD_MAP : MAPC); const id = pickFrom(seed, cat + list.length, pool, r, used); list.push({ id, lv: mild ? 1 : lv }); used.push(famOf(id)); };
      if (act === 0) { if (pos === 1) add("text", true); else if (pos === 2) add("map", true); }
      else if (act === 1) ACT1[pos % 3].forEach(c => add(c, false));
      else ACT2[pos % 3].forEach(c => add(c, false));
      if (asc >= 2 && act >= 1) add("rule", false);
      return { list, boss, combo };
    },
    info: id => D[id],
    chip(c, small) { const d = D[c.id]; return `<span class="ch-chip k-${d.kind}${small ? " sm" : ""}" data-tt="${(A.tx(d.n) + " — " + A.tx(d.d)).replace(/"/g, "&quot;")}">${A.icon(d.ico, "sm")}<b>${A.tx(d.n)}</b><i class="ch-lv">${"●".repeat(c.lv || 1)}</i></span>`; },
  };

  /* ------------------------------------------------------------------ mitigaciones (suma de los `fx` de las reliquias) */
  A.chal.fx = perks => {
    const fx = { shakeMul: 1, textMul: 1, blurMul: 1, plateMul: 1, blackoutMul: 1, cloudMul: 1, focusMul: 1, lagMul: 1, quakeMul: 1, mosaicMul: 1, rainMul: 1, darkR: 1, darkDim: 0, lensR: 0, trueR: 0, peekR: 0, missingRate: 0, unswapMs: 0, decodeMs: 0, riddleMs: 0, unmirror: false, keepName: false, halo: false, flickerWarn: false, windPreview: false, coords: false, guides: false, mag: false, country: false, thermo: false, beacon: false, noBabel: false, noMarquee: false, noNegative: false, noFlash: false, trapGhost: false, cloudClear: 0 };
    for (const p of perks) {
      const f = p.fx; if (!f) continue;
      for (const k in f) {
        if (/Mul$/.test(k)) fx[k] *= f[k];
        else if (k === "missingRate") fx[k] += f[k];
        else if (k === "unswapMs" || k === "decodeMs" || k === "riddleMs") fx[k] = fx[k] ? Math.min(fx[k], f[k]) : f[k];
        else if (typeof f[k] === "number") fx[k] = Math.max(fx[k], f[k]);
        else fx[k] = fx[k] || f[k];
      }
    }
    return fx;
  };

  /* ------------------------------------------------------------------ estado y capas */
  const S = A.chal.state = { list: [], fx: A.chal.fx([]), halve: 1, on: false, suspended: false, timers: [], ov: null, map: null, px: { x: innerWidth / 2, y: innerHeight / 2 } };
  const say = (k, ...a) => { try { A.sfx[k] && A.sfx[k](...a); } catch (e) { /* audio no listo */ } };
  const later = (fn, ms) => { const t = setTimeout(fn, ms); S.timers.push(t); return t; };
  const clearTimers = () => { S.timers.forEach(clearTimeout); S.timers = []; };
  const phaseOk = () => { const g = A.core && A.core.S; return g && g.phase === "asking" && !g.paused; };
  const lvi = c => clamp((c.lv || 1) - 1, 0, 2);
  const par = c => { const i = lvi(c), h = S.halve, fx = S.fx; switch (c.id) {
    case "shaky": return { amp: [2.2, 3.6, 5.4][i] * fx.shakeMul * fx.textMul * h };
    case "dance": return { amp: [0.16, 0.26, 0.38][i] * fx.shakeMul * fx.textMul * h };
    case "missing": return { frac: [0.34, 0.5, 0.65][i] * fx.textMul * h };
    case "swap": return { pairs: Math.max(1, Math.round([1, 2, 3][i] * fx.textMul * h)) };
    case "runes": return { frac: [0.4, 0.6, 0.85][i] * fx.textMul * h };
    case "memory": return { ms: [2600, 1800, 1200][i] / Math.max(0.3, fx.textMul * h) };
    case "blur": return { px: [4.5, 7, 10][i] * fx.blurMul * h };
    case "dark": return { r: [230, 170, 120][i] * fx.darkR / Math.max(0.5, h), a: [0.93, 0.96, 0.98][i] * (1 - fx.darkDim) };
    case "flicker": return { iv: [[5.5, 8.5], [3.8, 6], [2.5, 4.2]][i], len: [250, 450, 700][i] * fx.blackoutMul * h };
    case "lightning": return { iv: [[4.5, 7], [3.2, 5.2], [2.2, 4]][i] };
    case "wrongborders": return { amp: [0.014, 0.024, 0.038][i] * h };
    case "pangea": return { k: [0.4, 0.6, 0.8][i] * fx.plateMul * h };
    case "shuffle": return { k: [0.6, 0.85, 1][i] * fx.plateMul * h };
    case "spread": return { k: [0.5, 0.8, 1][i] * fx.plateMul * h };
    case "tilt": return { k: [0.4, 0.65, 0.9][i] * fx.plateMul * h };
    case "clouds": return { cover: [0.18, 0.28, 0.4][i] * fx.cloudMul * h };
    case "rain": return { dens: [0.45, 0.75, 1][i] * fx.rainMul * fx.cloudMul * h };
    case "myopia": return { r: [120, 150, 190][i] * fx.focusMul * h };
    case "blindspot": return { r: [60, 85, 115][i] * fx.focusMul * h };
    case "mosaic": return { res: clamp([0.11, 0.08, 0.06][i] + (1 - fx.mosaicMul) * 0.16, 0.05, 0.4) };
    case "quake": return { px: [3, 6, 10][i] * fx.quakeMul * h };
    case "drift": return { px: [22, 36, 54][i] * fx.quakeMul * h };
    case "spin": return { amp: [0.28, 0.45, 0.7][i] * fx.quakeMul * h };
    case "decoys": return { n: [4, 7, 11][i] };
    case "tremble": return { px: [7, 13, 21][i] * fx.shakeMul * fx.lagMul * h };
    case "blink": return { period: [0.55, 0.42, 0.3][i], duty: 0.45 };
    case "ghost": return { every: [5.5, 4.2, 3.2][i], off: [0.9, 1.4, 2.0][i] };
    case "cblur": return { px: [3, 5, 8][i] * fx.blurMul * h };
    case "lag": return { tau: [140, 240, 380][i] * fx.lagMul * h };
    case "cmirror": return { both: c.lv >= 3 };
    case "dizzy": return { r: [14, 22, 32][i] * fx.lagMul * fx.shakeMul * h };
    default: return {};
  } };
  const has = id => S.list.some(c => c.id === id);
  const get = id => S.list.find(c => c.id === id);
  const kindOn = k => S.list.filter(c => D[c.id].kind === k);

  /* capas del mapa (DOM/CSS con mascaras que siguen al puntero) */
  function ensureOverlay(map) {
    if (S.ov && S.ov.isConnected) return S.ov;
    const ov = document.createElement("div"); ov.id = "chOv";
    ov.innerHTML = `<div class="ch-blur"></div><div class="ch-myopia"></div><div class="ch-dark"></div><div class="ch-halo"></div><div class="ch-spot"></div><canvas class="ch-clouds" width="256" height="144"></canvas><div class="ch-flash"></div><div class="ch-flick"></div>`;
    (map && map.fx ? map.fx : $("map")).after(ov); S.ov = ov; return ov;
  }
  const layer = c => (S.ov ? S.ov.querySelector(".ch-" + c) : null);

  /* ------------------------------------------------------------------ humo y lluvia (canvas de pocos pixeles, escalado sin suavizar) */
  const Smoke = { raf: 0, puffs: [], drops: [], t: 0, mode: "" };
  function fxStart(mode, amount) {
    const cv = layer("clouds"); if (!cv) return; const c = cv.getContext("2d"); Smoke.t = 0; Smoke.mode = mode; cancelAnimationFrame(Smoke.raf);
    if (mode === "smoke") { const n = Math.round(6 + amount * 34); Smoke.puffs = Array.from({ length: n }, () => ({ x: Math.random() * 256, y: 10 + Math.random() * 124, r: 14 + Math.random() * 26, vx: (0.6 + Math.random() * 1.2) * (Math.random() < 0.5 ? 1 : -1), ph: Math.random() * 6 })); }
    else Smoke.drops = Array.from({ length: Math.round(60 + amount * 190) }, () => ({ x: Math.random() * 280, y: Math.random() * 144, v: 2.4 + Math.random() * 3.2, l: 4 + Math.random() * 7 }));
    cv.classList.add("on");
    const loop = now => {
      Smoke.raf = requestAnimationFrame(loop); if (now - Smoke.t < 50) return; Smoke.t = now; c.clearRect(0, 0, 256, 144);
      const px = S.px, hole = S.fx.cloudClear ? { x: (px.x / innerWidth) * 256, y: (px.y / innerHeight) * 144, r: S.fx.cloudClear / innerWidth * 256 } : null;
      if (Smoke.mode === "smoke") {
        for (const p of Smoke.puffs) { p.x += p.vx * 0.55; if (p.x < -40) p.x = 296; if (p.x > 296) p.x = -40;
          for (let k = 0; k < 5; k++) { const a = p.ph + k * 1.26 + now / 4000 * (k % 2 ? 1 : -1), rx = p.x + Math.cos(a) * p.r * 0.5, ry = p.y + Math.sin(a) * p.r * 0.3, rr = p.r * (0.5 + 0.12 * k); c.fillStyle = k % 2 ? "rgba(214,196,235,.55)" : "rgba(160,132,190,.6)"; c.beginPath(); c.arc(Math.round(rx), Math.round(ry), rr, 0, 6.3); c.fill(); } }
      } else {
        c.strokeStyle = "rgba(190,225,255,.75)"; c.lineWidth = 1;
        for (const d of Smoke.drops) { d.y += d.v; d.x -= d.v * 0.35; if (d.y > 150) { d.y = -8; d.x = Math.random() * 290; } c.beginPath(); c.moveTo(Math.round(d.x), Math.round(d.y)); c.lineTo(Math.round(d.x + d.l * 0.35), Math.round(d.y - d.l)); c.stroke(); }
      }
      if (hole) { c.save(); c.globalCompositeOperation = "destination-out"; const g = c.createRadialGradient(hole.x, hole.y, 2, hole.x, hole.y, hole.r); g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.fillRect(0, 0, 256, 144); c.restore(); }
    };
    Smoke.raf = requestAnimationFrame(loop);
  }
  function fxStop() { cancelAnimationFrame(Smoke.raf); const cv = layer("clouds"); if (cv) { cv.classList.remove("on"); cv.getContext("2d").clearRect(0, 0, 256, 144); } }

  A.chal.pointer = (x, y) => { S.px.x = x; S.px.y = y; const app = $("app"); if (!app) return; app.style.setProperty("--px", x + "px"); app.style.setProperty("--py", y + "px"); };

  /* ------------------------------------------------------------------ texto del nombre */
  const isLetter = ch => /\p{L}/u.test(ch);
  const LOOK = { a: "α", b: "β", c: "ς", d: "δ", e: "ε", g: "ɠ", h: "н", i: "ι", k: "κ", l: "ł", m: "м", n: "η", o: "ø", p: "ρ", r: "г", s: "ѕ", t: "τ", u: "υ", v: "ν", w: "ω", x: "χ", y: "ү", z: "ζ" };
  const VOWELS = /[aeiouáéíóúàèìòùâêîôûäëïöüãõAEIOUÁÉÍÓÚ]/;
  function riddleText(o) {
    let t = ""; try { t = (A.tx(o.fact) || (A.factOf && A.factOf(o)) || "").trim(); } catch (e) { t = ""; }
    if (!t || t.length < 12) return null;
    const words = new Set(); [...Object.values(o.name || {})].forEach(n => String(n).split(/[\s,()'’-]+/).forEach(w => { if (w.length >= 3) words.add(w); }));
    for (const w of [...words].sort((a, b) => b.length - a.length)) t = t.replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "▮".repeat(Math.min(6, w.length)));
    return t.length > 130 ? t.slice(0, 127) + "…" : t;
  }
  function decorate(o) {
    const el = $("askName"); if (!el || !o) return; clearText();
    const fx = S.fx, tx = S.list.filter(c => D[c.id].kind === "text");
    let text = A.tx(o.name);
    if (S.suspended || !tx.length) { el.textContent = text; return; }
    const rnd = A.rng(`${S.seed}:t:${S.q}:${text}`);
    let riddle = false;
    if (has("riddle")) { const r = riddleText(o); if (r) { text = r; riddle = true; } }
    if (has("babel") && !fx.noBabel && !riddle) { const cur = A.lang, alts = ["es", "en", "fr", "pt", "de", "it"].filter(l => l !== cur && o.name && o.name[l] && o.name[l] !== A.tx(o.name)); if (alts.length) text = o.name[alts[Math.floor(rnd() * alts.length)]]; }
    let chars = [...text]; const orig = chars.slice(), isL = i => isLetter(chars[i] || " ");
    const letters = chars.map((c, i) => (isLetter(c) ? i : -1)).filter(i => i >= 0), fixed = new Set(), hidden = new Set(), dots = new Set(), runes = new Set();
    if (!riddle) {
      const an = get("anagram");
      if (an && letters.length >= 4) {
        let i = 0; while (i < chars.length) { if (!isL(i)) { i++; continue; } let j = i; while (j < chars.length && isL(j)) j++; if (j - i >= 4) { const mid = chars.slice(i + 1, j - 1); rnd.shuffle ? rnd.shuffle(mid) : mid.sort(() => rnd() - 0.5); for (let k = 0; k < mid.length; k++) { chars[i + 1 + k] = mid[k]; fixed.add(i + 1 + k); } } i = j; }
      }
      const sw = get("swap");
      if (sw && letters.length >= 3) { const p = par(sw); let done = 0, tries = 0; while (done < p.pairs && tries++ < 20) { const k = letters[Math.floor(rnd() * (letters.length - 1))]; if (isL(k + 1) && chars[k] !== chars[k + 1] && !fixed.has(k)) { [chars[k], chars[k + 1]] = [chars[k + 1], chars[k]]; fixed.add(k); fixed.add(k + 1); done++; } } }
      const rn = get("runes");
      if (rn) { const p = par(rn), pool = letters.filter(i => LOOK[chars[i].toLowerCase()]); (rnd.shuffle ? rnd.shuffle(pool) : pool).slice(0, Math.max(2, Math.round(letters.length * p.frac))).forEach(i => { const g = LOOK[chars[i].toLowerCase()]; chars[i] = chars[i] === chars[i].toUpperCase() && chars[i] !== chars[i].toLowerCase() ? g.toUpperCase() : g; runes.add(i); }); }
      if (get("novowels")) letters.forEach(i => { if (VOWELS.test(orig[i]) && i > 0) dots.add(i); });
      const ms = get("missing");
      if (ms && letters.length >= 3) { const p = par(ms), n = clamp(Math.round(letters.length * p.frac), 2, Math.max(2, Math.floor(letters.length * 0.7))), pool = rnd.shuffle ? rnd.shuffle(letters.slice()) : letters.slice(); for (const k of pool) { if (hidden.size >= n) break; hidden.add(k); } }
    }
    const sh = get("shaky"), amp = sh ? par(sh).amp : 0, dn = get("dance"), damp = dn ? par(dn).amp : 0;
    el.innerHTML = chars.map((ch, i) => {
      if (ch === " ") return " ";
      const c = ["lt"]; let glyph = ch;
      if (hidden.has(i)) c.push("gap"); else if (dots.has(i)) { c.push("dot"); glyph = "·"; } else if (get("missing") && rnd() < 0.5) c.push("faint");
      if (runes.has(i)) c.push("rune");
      const dur = (0.07 + rnd() * 0.09).toFixed(3), del = (-rnd() * 0.3).toFixed(3), ax = ((rnd() - 0.5) * 2 * amp).toFixed(2), ay = ((rnd() - 0.5) * 2 * amp).toFixed(2), ar = ((rnd() - 0.5) * amp * 1.6).toFixed(2);
      const st = (amp ? `--dur:${dur}s;--del:${del}s;--ax:${ax}px;--ay:${ay}px;--ar:${ar}deg;` : "") + (damp ? `--dy:${(damp * (0.6 + rnd() * 0.8)).toFixed(2)}em;--di:${i};` : "");
      return `<b class="${c.join(" ")}" data-i="${i}" data-g="${ch}" style="${st}"${amp ? ' data-sh="1"' : ""}${damp ? ' data-dn="1"' : ""}>${glyph}</b>`;
    }).join("");
    if (amp) el.classList.add("ch-shaky");
    if (damp) el.classList.add("ch-dance");
    if (has("mirror") && !fx.unmirror) el.classList.add("ch-mirror");
    if (has("upside") && !fx.unmirror) el.classList.add("ch-upside");
    if (riddle) el.classList.add("ch-riddle");
    if (has("scroll") && !fx.noMarquee) { el.innerHTML = `<span class="ch-marq">${el.innerHTML}</span>`; el.classList.add("ch-scroll"); }
    const restore = (b, g) => { b.classList.remove("gap", "dot", "faint", "rune"); b.classList.add("fix"); b.textContent = g; };
    const hid = [...hidden, ...dots];
    if (hid.length && fx.missingRate > 0) hid.forEach((k, j) => later(() => { const b = el.querySelector(`.lt[data-i="${k}"]`); if (b) { restore(b, b.dataset.g); say("chip", 1 + j * 0.2); } }, 900 + (j * 1000) / fx.missingRate));
    if ((fixed.size || runes.size) && (fx.unswapMs || fx.decodeMs)) later(() => { el.querySelectorAll(".lt").forEach(b => { const i = +b.dataset.i; if (b.textContent !== orig[i] && !b.classList.contains("gap")) restore(b, orig[i]); }); say("chip", 2); }, Math.min(fx.unswapMs || 1e9, fx.decodeMs || 1e9));
    if (riddle && fx.riddleMs) later(() => { el.classList.remove("ch-riddle"); el.textContent = A.tx(o.name); el.classList.add("fixed"); say("chip", 2); }, fx.riddleMs);
    const mem = get("memory");
    if (mem) later(() => { el.classList.add(fx.keepName ? "ch-dim" : "ch-fade"); }, par(mem).ms);
  }
  function clearText() { const el = $("askName"); if (el) el.classList.remove("ch-shaky", "ch-mirror", "ch-upside", "ch-fade", "ch-dim", "ch-dance", "ch-riddle", "ch-scroll", "fixed"); }

  /* ------------------------------------------------------------------ mapa: deformaciones */
  function mapSpec(map, o) {
    const spec = { shift: [0, 1, 2, 3, 4, 5, 6].map(() => [0, 0]), rot: [0, 0, 0, 0, 0, 0, 0], wob: 0, lineA: 1, orient: null, ct: 6 }; let any = false;
    const rr = A.rng(`${S.seed}:m:${S.round}`);
    const lay = ["pangea", "shuffle", "spread"].map(id => get(id)).find(Boolean);
    if (lay) { spec.shift = map.layout(lay.id, par(lay).k, rr); any = true; }
    const tl = get("tilt"); if (tl) { const k = par(tl).k; for (let c = 0; c < 6; c++) spec.rot[c] = (rr() < 0.5 ? -1 : 1) * (0.3 + rr() * 0.45) * k; any = true; }
    const wb = get("wrongborders"); if (wb) { spec.wob = par(wb).amp; any = true; }
    if (has("noborders")) { spec.lineA = 0; any = true; }
    const fl = get("flip"); if (fl) { spec.orient = { rot: Math.PI, mx: fl.lv >= 3 ? 1 : 0 }; any = true; }
    if (has("mirrorx")) { spec.orient = { rot: 0, mx: 1 }; any = true; }
    const sp = get("spin"); if (sp) { spec.spin = { amp: par(sp).amp, speed: 0.55 }; any = true; }
    const mo = get("mosaic"); if (mo) { spec.mosaic = par(mo).res; any = true; }
    const qk = get("quake"); if (qk) { spec.quake = par(qk).px; any = true; }
    const dr = get("drift"); if (dr) { const px = par(dr).px; spec.pan = { vx: px, vy: px * 0.6 }; any = true; }
    if (o) { const f = o.t === "c" ? map.world.byName[o.key] : null; spec.ct = f ? f.ct : map._ctOf(o.lon, o.lat); }
    return any ? spec : null;
  }
  function decoyList(map, o, n) {
    if (!o) return []; const rr = A.rng(`${S.seed}:d:${S.round}:${S.q}`);
    const c = o.t === "c" ? (() => { const f = map.world.byName[o.key], big = f.polys.reduce((a, b) => ((b.bbox[2] - b.bbox[0]) * (b.bbox[3] - b.bbox[1]) > (a.bbox[2] - a.bbox[0]) * (a.bbox[3] - a.bbox[1]) ? b : a)); return [(big.bbox[1] + big.bbox[3]) / 2, (big.bbox[0] + big.bbox[2]) / 2]; })() : [o.lat, o.lon];
    const out = []; for (let i = 0; i < n; i++) { const brg = rr() * 6.283, km = 250 + rr() * 1800, R = 6371, la = c[0] * Math.PI / 180, lo = c[1] * Math.PI / 180, d = km / R; const la2 = Math.asin(Math.sin(la) * Math.cos(d) + Math.cos(la) * Math.sin(d) * Math.cos(brg)), lo2 = lo + Math.atan2(Math.sin(brg) * Math.sin(d) * Math.cos(la), Math.cos(d) - Math.sin(la) * Math.sin(la2)); out.push({ lat: la2 * 180 / Math.PI, lon: ((lo2 * 180 / Math.PI + 540) % 360) - 180, a: S.fx.trapGhost ? 0.28 : 0.95 }); }
    return out;
  }

  /* ------------------------------------------------------------------ apagon, rayos */
  function flickerLoop() {
    const fl = get("flicker"); if (!fl || S.suspended || !S.on) return; const p = par(fl), el = layer("flick"); if (!el) return;
    const wait = (p.iv[0] + Math.random() * (p.iv[1] - p.iv[0])) * 1000;
    later(function fire() {
      if (!phaseOk()) return later(fire, 800);
      const dim = S.fx.blackoutMul < 0.9, on = dim ? 0.6 : 0.98, seq = [[on, 70], [0, 90], [on, 60], [0, 110], [on, p.len]];
      const go = i => { if (i >= seq.length || !S.on) { el.style.opacity = 0; say("restore"); return flickerLoop(); } el.style.opacity = seq[i][0]; if (seq[i][0]) say("buzz", i); later(() => go(i + 1), seq[i][1]); };
      if (S.fx.flickerWarn) { const h = layer("halo"); if (h) { h.classList.add("warn"); later(() => h.classList.remove("warn"), 420); } say("warn"); later(() => go(0), 420); } else go(0);
    }, wait);
  }
  function lightningLoop() {
    const lg = get("lightning"); if (!lg || S.suspended || !S.on || S.fx.noFlash) return; const p = par(lg), el = layer("flash"); if (!el) return;
    const wait = (p.iv[0] + Math.random() * (p.iv[1] - p.iv[0])) * 1000;
    later(function fire() {
      if (!phaseOk()) return later(fire, 800);
      const seq = [[1, 60], [0.15, 70], [0.9, 90], [0, 0]], go = i => { if (i >= seq.length || !S.on) { el.style.opacity = 0; return lightningLoop(); } el.style.opacity = seq[i][0]; if (i === 0) say("thunder"); later(() => go(i + 1), seq[i][1]); };
      go(0);
    }, wait);
  }

  /* ------------------------------------------------------------------ puntero: parametros para js/pointer.js */
  A.chal.ptrMods = () => {
    if (S.suspended || !S.on) return null;
    const m = {}; for (const c of kindOn("ptr")) { const p = par(c); if (c.id === "cmirror" && S.fx.unmirror) continue; m[c.id] = p; }
    return Object.keys(m).length ? m : null;
  };

  /* ------------------------------------------------------------------ API */
  Object.assign(A.chal, {
    begin(list, fx, ctx = {}) {
      this.end(); S.list = list.slice(); S.fx = fx || A.chal.fx([]); S.halve = ctx.halve || 1; S.seed = ctx.seed || "s"; S.round = ctx.round || 0; S.on = true; S.suspended = false; S.q = 0;
      S.map = A.core && A.core.map; if (S.map) ensureOverlay(S.map);
    },
    active: () => S.list.slice(),
    has,
    lensRadius: () => (S.suspended ? 0 : has("wrongborders") ? S.fx.trueR : has("noborders") ? S.fx.peekR : 0),
    question(o, qi = 0) {
      const map = S.map = (A.core && A.core.map) || S.map; if (!map || !S.on) return; S.q = qi; S.suspended = false; clearTimers(); ensureOverlay(map);
      decorate(o);
      const spec = map.setDistort ? mapSpec(map, o) : null, app = $("app");
      if (spec) { map.setDistort(spec, 900); say("chal"); } else if (map.clearDistort) map.clearDistort(300);
      if (S.list.some(c => D[c.id].kind === "map")) { app.classList.remove("ch-glitch"); void app.offsetWidth; app.classList.add("ch-glitch"); later(() => app.classList.remove("ch-glitch"), 600); }
      app.classList.toggle("ch-negative", has("negative") && !S.fx.noNegative);
      ensureOverlay(map).classList.add("on");
      const bl = get("blur"), dk = get("dark"), cl = get("clouds"), rn = get("rain"), my = get("myopia"), bs = get("blindspot"), dc = get("decoys");
      const L = layer("blur"), M = layer("myopia"), K = layer("dark"), H = layer("halo"), Sp = layer("spot");
      if (bl) { const p = par(bl); L.style.setProperty("--bl", p.px.toFixed(1) + "px"); L.style.setProperty("--lr", (S.fx.lensR ? S.fx.lensR : -60) + "px"); L.classList.add("on"); } else L.classList.remove("on");
      if (my) { const p = par(my); M.style.setProperty("--mr", p.r + "px"); M.classList.add("on"); } else M.classList.remove("on");
      if (bs) { const p = par(bs); Sp.style.setProperty("--sr", p.r + "px"); Sp.classList.add("on"); } else Sp.classList.remove("on");
      if (dk) { const p = par(dk); app.style.setProperty("--dr", p.r + "px"); app.style.setProperty("--da", p.a.toFixed(3)); K.classList.add("on"); H.classList.add("on"); H.classList.toggle("warm", !!S.fx.halo); say("dark"); } else { K.classList.remove("on"); H.classList.remove("on"); }
      if (cl) fxStart("smoke", par(cl).cover); else if (rn) fxStart("rain", par(rn).dens); else fxStop();
      if (map.setDecoys) map.setDecoys(dc ? decoyList(map, o, par(dc).n) : []);
      layer("flick").style.opacity = 0; layer("flash").style.opacity = 0; flickerLoop(); lightningLoop();
      if (A.pointer && A.pointer.mods) A.pointer.mods();
    },
    reveal(ms = 750) {
      const map = S.map; clearTimers(); fxStop();
      if (map && map.clearDistort) { map.clearDistort(ms); if (map.setDecoys) map.setDecoys([]); }
      $("app").classList.remove("ch-negative");
      if (S.ov) { S.ov.classList.remove("on"); for (const c of ["blur", "myopia", "dark", "halo", "spot"]) layer(c).classList.remove("on"); layer("flick").style.opacity = 0; layer("flash").style.opacity = 0; }
      const el = $("askName"); if (el) { el.classList.remove("ch-fade", "ch-dim", "ch-riddle"); el.querySelectorAll(".gap,.dot,.rune,.faint").forEach(b => { b.classList.remove("gap", "dot", "rune", "faint"); b.textContent = b.dataset.g || b.textContent; }); }
    },
    suspend() { S.suspended = true; this.reveal(500); const o = A.core && A.core.S.qs[A.core.S.qi]; if (o) decorate(o); if (A.pointer && A.pointer.mods) A.pointer.mods(); },
    upright() { const map = S.map; if (map && map.setOrient) map.setOrient(false, 900); },
    end() {
      clearTimers(); fxStop(); S.on = false; S.list = []; const map = S.map || (A.core && A.core.map);
      if (map && map.clearDistort) { map.clearDistort(300); map.setLens && map.setLens(null); map.setDecoys && map.setDecoys([]); }
      const app = $("app"); if (app) app.classList.remove("ch-negative");
      if (S.ov) { S.ov.classList.remove("on"); for (const c of ["blur", "myopia", "dark", "halo", "spot"]) layer(c).classList.remove("on"); layer("flick").style.opacity = 0; layer("flash").style.opacity = 0; }
      clearText(); if (A.pointer && A.pointer.mods) A.pointer.mods();
    },
    decorate, par, get, fxNow: () => S.fx, suspended: () => S.suspended,
  });
})(window.AIQ);
