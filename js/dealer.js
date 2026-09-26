/*
 * Atlas IQ - EL CRUPIER (v0.10). El "jefe" de la mesa: un croupier de pixel art que habla con sonidos arcade (una silaba por letra),
 * anuncia los retos, se rie cuando fallas, se sorprende con una diana y protesta cuando lo esquivas con una reliquia.
 *   A.dealer.say(linea, {mood, hold})   A.dealer.react(tipo, datos)   A.dealer.intro(host, lineas)   A.dealer.enable(on)
 */
window.AIQ = window.AIQ || {};
(function (A) {
  const $ = id => document.getElementById(id);
  const L6 = s => { const [es, en, fr, pt, de, it] = s.split("|"); return { es, en, fr, pt, de, it: it || en }; };
  const FACE = { sly: "dealer_neutral", boss: "dealer_neutral", laugh: "dealer_laugh", angry: "dealer_angry", shock: "dealer_shock" };

  /* frases: es | en | fr | pt | de | it */
  const LINES = {
    hello: ["¡Bienvenido a mi mesa, explorador! Aquí manda el mapa… y yo cambio las reglas.|Welcome to my table, explorer! The map rules here… and I change the rules.|Bienvenue à ma table, explorateur ! Ici la carte est reine… et je change les règles.|Bem-vindo à minha mesa, explorador! Aqui o mapa manda… e eu mudo as regras.|Willkommen an meinem Tisch, Entdecker! Hier regiert die Karte… und ich ändere die Regeln.|Benvenuto al mio tavolo, esploratore! Qui comanda la mappa… e io cambio le regole."],
    calm: ["Calentamos: esta ronda, sin trucos. Disfrútala.|Warm-up: no tricks this round. Enjoy it.|On s'échauffe : pas de tours cette manche. Profites-en.|Aquecimento: sem truques nesta rodada. Aproveite.|Aufwärmen: keine Tricks in dieser Runde. Viel Spaß.|Riscaldamento: niente trucchi in questo round. Goditelo."],
    deal: ["Nueva mano… y he tocado la mesa. Mira lo que te reparto.|New hand… and I touched the table. Look what I deal you.|Nouvelle donne… et j'ai touché à la table. Regarde.|Nova mão… e eu mexi na mesa. Veja o que distribuí.|Neue Runde… und ich habe am Tisch gedreht. Sieh, was ich austeile.|Nuova mano… e ho toccato il tavolo. Guarda cosa ti do."],
    boss: ["¡Mi apuesta grande! Todo o nada, explorador.|My big bet! All or nothing, explorer.|Ma grosse mise ! Tout ou rien, explorateur.|Minha grande aposta! Tudo ou nada, explorador.|Mein großer Einsatz! Alles oder nichts, Entdecker.|La mia puntata grossa! Tutto o niente, esploratore."],
    good: ["Mmm… suerte de principiante.|Hmm… beginner's luck.|Mmm… la chance du débutant.|Hmm… sorte de principiante.|Hmm… Anfängerglück.|Mmm… fortuna del principiante.", "¡No está mal, no está mal!|Not bad, not bad!|Pas mal, pas mal !|Nada mal, nada mal!|Nicht schlecht, nicht schlecht!|Non male, non male!"],
    bull: ["¡¿Cómo lo has hecho?! ¡Eso no estaba en el guion!|How did you do that?! That wasn't in the script!|Comment as-tu fait ?! Ce n'était pas prévu !|Como você fez isso?! Isso não estava no roteiro!|Wie hast du das gemacht?! Das stand nicht im Drehbuch!|Come hai fatto?! Non era nel copione!", "¡Ay, mi corazón de crupier!|Oh, my dealer's heart!|Oh, mon cœur de croupier !|Ai, meu coração de crupiê!|Oh, mein Croupier-Herz!|Oh, il mio cuore da croupier!"],
    miss: ["¡Ja, ja, ja! ¡Ni de lejos!|Ha ha ha! Not even close!|Ha ha ha ! Même pas près !|Ha ha ha! Nem perto!|Ha ha ha! Nicht mal annähernd!|Ah ah ah! Neanche vicino!", "Buen intento… para otro mapa. ¡Ja!|Nice try… for another map. Ha!|Bel essai… pour une autre carte. Ha !|Boa tentativa… para outro mapa. Ha!|Netter Versuch… für eine andere Karte. Ha!|Bel tentativo… per un'altra mappa. Ah!"],
    timeout: ["El tiempo vuela… y tú no.|Time flies… and you don't.|Le temps vole… pas toi.|O tempo voa… e você não.|Die Zeit fliegt… du nicht.|Il tempo vola… tu no."],
    streak: ["¿Racha? No te acostumbres.|A streak? Don't get used to it.|Une série ? Ne t'y habitue pas.|Sequência? Não se acostume.|Eine Serie? Gewöhn dich nicht daran.|Una serie? Non abituarti."],
    counter: ["¿Un perk contra mi truco? Qué falta de deportividad…|A perk against my trick? How unsporting…|Un atout contre mon tour ? Quel manque de fair-play…|Um perk contra meu truque? Que falta de esportividade…|Ein Perk gegen meinen Trick? Wie unsportlich…|Un perk contro il mio trucco? Che poca sportività…"],
    roundWin: ["Esta vez ganas tú… esta vez.|You win this one… this time.|Cette fois tu gagnes… cette fois.|Desta vez você ganha… desta vez.|Diesmal gewinnst du… diesmal.|Stavolta vinci tu… stavolta."],
    roundFail: ["La banca siempre gana. Otra vez.|The house always wins. Again.|La banque gagne toujours. Encore.|A banca sempre ganha. De novo.|Die Bank gewinnt immer. Nochmal.|Il banco vince sempre. Di nuovo."],
    runWin: ["¡Imposible! Me has vaciado la mesa…|Impossible! You've cleaned out my table…|Impossible ! Tu as vidé ma table…|Impossível! Você limpou minha mesa…|Unmöglich! Du hast meinen Tisch leergeräumt…|Impossibile! Mi hai svuotato il tavolo…"],
    runLose: ["Fin de la partida. Vuelve cuando quieras… ¡Ja!|Game over. Come back any time… Ha!|Fin de partie. Reviens quand tu veux… Ha !|Fim de jogo. Volte quando quiser… Ha!|Spiel vorbei. Komm wieder, wann du willst… Ha!|Fine della partita. Torna quando vuoi… Ah!"],
    shaky: ["¿Te tiemblan las letras? A mí me tiembla la risa.|Letters trembling? I'm the one shaking with laughter.|Les lettres tremblent ? C'est moi qui tremble de rire.|As letras tremem? Eu é que tremo de rir.|Zittern die Buchstaben? Ich zittere vor Lachen.|Le lettere tremano? Io tremo dalle risate."],
    missing: ["Me he comido unas letras. Perdón. Ja.|I ate a few letters. Oops. Ha.|J'ai mangé quelques lettres. Oups. Ha.|Comi algumas letras. Ops. Ha.|Ich habe ein paar Buchstaben gegessen. Huch. Ha.|Ho mangiato qualche lettera. Ops. Ah."],
    swap: ["Las he barajado un poquito. Es mi trabajo.|I shuffled them a bit. It's my job.|Je les ai un peu mélangées. C'est mon métier.|Embaralhei um pouquinho. É meu trabalho.|Ich habe sie ein wenig gemischt. Das ist mein Job.|Le ho mescolate un po'. È il mio lavoro."],
    mirror: ["Hoy leemos al revés. ¡Qué divertido!|Today we read backwards. How fun!|Aujourd'hui on lit à l'envers. Amusant !|Hoje lemos ao contrário. Divertido!|Heute lesen wir rückwärts. Lustig!|Oggi leggiamo al contrario. Che divertente!"],
    memory: ["Mira bien… porque esto se borra.|Look closely… it fades away.|Regarde bien… ça s'efface.|Olhe bem… isso some.|Schau genau hin… es verblasst.|Guarda bene… svanisce."],
    blur: ["¿Ves borroso? Es el humo de mi puro.|Blurry? That's the smoke from my cigar.|Flou ? C'est la fumée de mon cigare.|Turvo? É a fumaça do meu charuto.|Verschwommen? Das ist der Rauch meiner Zigarre.|Sfocato? È il fumo del mio sigaro."],
    dark: ["Ups, un cortocircuito. Qué casualidad…|Oops, a short circuit. What a coincidence…|Oups, un court-circuit. Quelle coïncidence…|Ops, um curto-circuito. Que coincidência…|Huch, ein Kurzschluss. Welch Zufall…|Ops, un cortocircuito. Che coincidenza…"],
    flicker: ["Las luces de este casino son… temperamentales.|The lights in this casino are… temperamental.|Les lumières de ce casino sont… capricieuses.|As luzes deste cassino são… temperamentais.|Die Lichter in diesem Casino sind… launisch.|Le luci di questo casinò sono… capricciose."],
    wrongborders: ["Estas fronteras las he dibujado yo. Confía en mí.|I drew these borders myself. Trust me.|J'ai dessiné ces frontières moi-même. Fais-moi confiance.|Eu mesmo desenhei essas fronteiras. Confie em mim.|Diese Grenzen habe ich selbst gezeichnet. Vertrau mir.|Questi confini li ho disegnati io. Fidati."],
    noborders: ["Fronteras fuera. ¿Quién las necesita?|Borders? Who needs them.|Les frontières ? Qui en a besoin.|Fronteiras? Quem precisa delas.|Grenzen? Wer braucht die schon.|I confini? Chi ne ha bisogno."],
    pangea: ["He apretado los continentes. Ahorro de espacio.|I squeezed the continents together. Saves space.|J'ai serré les continents. Gain de place.|Apertei os continentes. Economiza espaço.|Ich habe die Kontinente zusammengeschoben. Spart Platz.|Ho stretto i continenti. Risparmio di spazio."],
    shuffle: ["He cambiado los continentes de sitio. Sorpresa.|I moved the continents around. Surprise.|J'ai déplacé les continents. Surprise.|Troquei os continentes de lugar. Surpresa.|Ich habe die Kontinente verschoben. Überraschung.|Ho spostato i continenti. Sorpresa."],
    flip: ["Hoy el Sur manda. ¡Bienvenido al revés!|Today the South is on top. Welcome upside down!|Aujourd'hui le Sud est en haut. Bienvenue à l'envers !|Hoje o Sul manda. Bem-vindo de cabeça para baixo!|Heute ist der Süden oben. Willkommen auf dem Kopf!|Oggi comanda il Sud. Benvenuto a testa in giù!"],
    clouds: ["Un poco de humo de sala. No tosas… mira.|A bit of smoke in the room. Don't cough… look.|Un peu de fumée dans la salle. Ne tousse pas… regarde.|Um pouco de fumaça na sala. Não tussa… olhe.|Etwas Rauch im Saal. Nicht husten… schau.|Un po' di fumo in sala. Non tossire… guarda."],
    wind: ["¡Vendaval! Apunta con la cabeza.|Gale! Aim with your head.|Rafale ! Vise avec la tête.|Vendaval! Mire com a cabeça.|Sturm! Ziel mit dem Kopf.|Bufera! Mira con la testa."],
    storm: ["El reloj corre más rápido esta noche.|The clock runs faster tonight.|L'horloge tourne plus vite ce soir.|O relógio corre mais rápido esta noite.|Die Uhr läuft heute schneller.|L'orologio corre più veloce stasera."],
    silence: ["Shhh. Tus juguetes se quedan en silencio.|Shhh. Your toys stay silent.|Chut. Tes jouets restent muets.|Shhh. Seus brinquedos ficam em silêncio.|Pssst. Deine Spielzeuge bleiben stumm.|Shhh. I tuoi giocattoli restano muti."],
  };
  for (const k in LINES) LINES[k] = LINES[k].map(L6);

  const D = A.dealer = { on: false, host: null, timers: [], busy: false };
  let el, face, bubble, txt;
  const rand = a => a[Math.floor(Math.random() * a.length)];

  function ensure() {
    if (el && el.isConnected) return;
    el = document.createElement("div"); el.id = "dealer"; el.className = "dealer";
    el.innerHTML = `<div class="dl-bubble"><p></p></div><img class="dl-face" alt="" src="assets/icons/dealer_neutral.webp">`;
    $("app").appendChild(el); face = el.querySelector(".dl-face"); bubble = el.querySelector(".dl-bubble"); txt = bubble.querySelector("p");
  }
  const clear = () => { D.timers.forEach(clearTimeout); D.timers = []; };
  const later = (fn, ms) => { const t = setTimeout(fn, ms); D.timers.push(t); return t; };

  /* dice una frase con voz arcade y maquina de escribir */
  D.say = (line, o = {}) => {
    if (!D.on) return; ensure(); clear();
    const mood = o.mood || "sly", text = typeof line === "string" ? line : A.tx(line), src = FACE[mood] || "dealer_neutral";
    face.src = `assets/icons/${src}.webp`; el.className = "dealer in " + mood + (D.host ? " big" : ""); txt.textContent = ""; bubble.classList.add("on");
    if (mood === "laugh") A.sfx.laugh && A.sfx.laugh();
    let i = 0; const chars = [...text], step = mood === "laugh" ? 44 : 34;
    const tick = () => {
      if (i >= chars.length) { el.classList.add("done"); if (o.hold !== 0) later(() => D.hide(), o.hold || 1800 + text.length * 22); if (o.done) o.done(); return; }
      txt.textContent += chars[i]; if (/\S/.test(chars[i]) && i % 2 === 0 && mood !== "laugh") A.sfx.voice && A.sfx.voice(mood, i); i++; later(tick, step + (/[.,!?…]/.test(chars[i - 1]) ? 140 : 0));
    };
    tick(); D.busy = true;
  };
  D.hide = () => { if (!el) return; el.classList.remove("in", "done", "laugh", "angry", "shock", "sly", "boss"); bubble.classList.remove("on"); D.busy = false; };
  D.enable = on => { D.on = !!on; if (!on) { clear(); D.dock(null); if (el) el.classList.add("hidden"); } else { ensure(); el.classList.remove("hidden"); } };
  /* pasa el retrato a un contenedor grande (pantalla de intro) o lo devuelve a la esquina */
  D.dock = host => { ensure(); D.host = host || null; if (host) host.appendChild(el); else $("app").appendChild(el); el.classList.toggle("big", !!host); };
  /* secuencia de frases: [{line, mood}] */
  D.sequence = (items, done) => { let k = 0; const next = () => { if (k >= items.length) return done && done(); const it = items[k++]; D.say(it.line, { mood: it.mood, hold: 0, done: () => later(next, it.gap || 700) }); }; next(); };
  D.line = (key, i) => { const a = LINES[key]; return a ? (i == null ? rand(a) : a[i % a.length]) : null; };
  D.lines = LINES;

  /* reacciones a lo que pasa en la mesa */
  D.react = (kind, o = {}) => {
    if (!D.on || D.host) return; const ph = A.core && A.core.S && A.core.S.phase; if (ph === "shop" || ph === "title" || ph === "intro") return;
    const p = { bull: 0.9, miss: 0.85, timeout: 1, good: 0.35, streak: 0.5, counter: 1, roundWin: 0.8, roundFail: 1, runWin: 1, runLose: 1 }[kind];
    if (p == null || Math.random() > p) return;
    const mood = { bull: "shock", miss: "laugh", timeout: "laugh", good: "sly", streak: "angry", counter: "angry", roundWin: "angry", roundFail: "laugh", runWin: "shock", runLose: "laugh" }[kind];
    const line = D.line(kind === "roundWin" ? "roundWin" : kind);
    if (line) D.say(line, { mood });
  };
})(window.AIQ);
