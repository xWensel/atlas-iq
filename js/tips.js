/* Atlas IQ · tips: textos de los tooltips del HUD (se calculan al pasar el puntero: siempre en el idioma y con los numeros actuales).
 *  Formato de idioma: "es|en|fr|pt|de|it". Uso: <el data-tf="clave"> -> A.tips.clave(el) devuelve "Titulo\nDescripcion". */
(() => {
  "use strict";
  const A = window.AIQ = window.AIQ || {};
  const LANGS = ["es", "en", "fr", "pt", "de", "it"];
  const pick = s => { const a = s.split("|"), i = LANGS.indexOf(A.lang); return a[i < 0 ? 1 : i] || a[1] || a[0]; };
  A.tip6 = pick;
  const tip = (t, d) => () => pick(t) + "\n" + pick(d);
  const run = () => (A.adv && A.adv.run) || null;

  /* atributo data-tt de una ronda del mapa de ruta */
  A.roundTip = i => {
    const R = A.ADV && A.ADV.ROUNDS && A.ADV.ROUNDS[i]; if (!R) return "";
    const TN = A.ADV.TOPIC_NAMES, topic = A.tx(TN[R.topic][Math.min(R.tier, TN[R.topic].length - 1)]);
    const boss = pick("Jefe del acto: varios retos a la vez.|Act boss: several challenges at once.|Boss de l'acte : plusieurs défis à la fois.|Chefe do ato: vários desafios ao mesmo tempo.|Akt-Boss: mehrere Herausforderungen gleichzeitig.|Boss dell'atto: più sfide insieme.");
    return A.ttAttr(pick("Ronda|Round|Manche|Rodada|Runde|Round") + " " + (i + 1) + (R.boss ? " · " + pick("Jefe|Boss|Boss|Chefe|Boss|Boss") : ""), (R.boss ? boss + "\n" : "") + topic);
  };
  /* atributo data-tt de una herramienta o reliquia (kind: "tool" | "perk") */
  A.kitTip = (kind, id) => {
    const o = kind === "tool" ? A.ADV.TOOLS[id] : A.RELICS[id]; return o ? A.ttAttr(A.tx(o.n), A.tx(o.d)) : "";
  };
  Object.assign(A.tips, {
    songprev: tip("Canción anterior|Previous song|Morceau précédent|Música anterior|Vorheriger Song|Brano precedente",
      "Atajo: flecha izquierda.|Shortcut: left arrow.|Raccourci : flèche gauche.|Atalho: seta esquerda.|Kürzel: Pfeil links.|Scorciatoia: freccia sinistra."),
    songnext: tip("Canción siguiente|Next song|Morceau suivant|Próxima música|Nächster Song|Brano successivo",
      "Atajo: flecha derecha.|Shortcut: right arrow.|Raccourci : flèche droite.|Atalho: seta direita.|Kürzel: Pfeil rechts.|Scorciatoia: freccia destra."),
    level: tip("Puntos de la ronda|Round score|Points de la manche|Pontos da rodada|Rundenpunkte|Punti del round",
      "Tu precisión acumulada en esta ronda: cuanto más cerca del lugar, más puntos.|Your precision so far this round: the closer to the place, the more points.|Ta précision cumulée sur cette manche : plus tu es près du lieu, plus tu gagnes.|Sua precisão acumulada nesta rodada: quanto mais perto do lugar, mais pontos.|Deine bisherige Genauigkeit in dieser Runde: je näher am Ort, desto mehr Punkte.|La tua precisione finora in questo round: più sei vicino al luogo, più punti."),
    need: tip("Objetivo de la ronda|Round target|Objectif de la manche|Meta da rodada|Rundenziel|Obiettivo del round",
      "Puntos que necesitas para superar la ronda. Si no llegas, pierdes una provisión.|Points you need to clear the round. Fall short and you lose a provision.|Points nécessaires pour réussir la manche. Sinon, tu perds une provision.|Pontos necessários para vencer a rodada. Se não chegar, perde uma provisão.|Punkte, die du zum Bestehen brauchst. Sonst verlierst du Proviant.|Punti necessari per superare il round. Altrimenti perdi una provvista."),
    total: tip("Total|Total|Total|Total|Gesamt|Totale",
      "Puntos acumulados en toda la partida.|Points collected across the whole game.|Points cumulés sur toute la partie.|Pontos acumulados em toda a partida.|Alle Punkte der gesamten Partie.|Punti accumulati in tutta la partita."),
    streak: tip("Racha|Streak|Série|Sequência|Serie|Serie",
      "Aciertos seguidos. Una racha larga multiplica los puntos de cada pregunta; un fallo la corta.|Correct answers in a row. A long streak multiplies each question's points; a miss breaks it.|Bonnes réponses d'affilée. Une longue série multiplie les points ; une erreur la brise.|Acertos seguidos. Uma sequência longa multiplica os pontos; um erro a quebra.|Treffer in Folge. Eine lange Serie multipliziert die Punkte; ein Fehler bricht sie.|Risposte giuste di fila. Una serie lunga moltiplica i punti; un errore la spezza."),
    clock: tip("Tiempo|Time|Temps|Tempo|Zeit|Tempo",
      "Segundos que te quedan para colocar el pin.|Seconds left to place your pin.|Secondes restantes pour poser ton épingle.|Segundos restantes para colocar o pino.|Sekunden, um deinen Pin zu setzen.|Secondi rimasti per piazzare il pin."),
    pips: tip("Preguntas de la ronda|Round questions|Questions de la manche|Perguntas da rodada|Fragen der Runde|Domande del round",
      "Una marca por pregunta.|One mark per question.|Une marque par question.|Uma marca por pergunta.|Eine Markierung pro Frage.|Un segno per domanda."),
    kind: tip("Tipo de lugar|Kind of place|Type de lieu|Tipo de lugar|Art des Ortes|Tipo di luogo",
      "Lo que buscas: país, capital, ciudad, monumento…|What you're looking for: country, capital, city, landmark…|Ce que tu cherches : pays, capitale, ville, monument…|O que você procura: país, capital, cidade, monumento…|Was du suchst: Land, Hauptstadt, Stadt, Wahrzeichen…|Cosa cerchi: paese, capitale, città, monumento…"),
    abact: () => { const r = run(); return pick("Acto|Act|Acte|Ato|Akt|Atto") + (r ? " " + (r.act + 1) + "/3" : "") + "\n" + pick("Tres actos de cuatro rondas; la última de cada acto es un jefe.|Three acts of four rounds; the last one of each act is a boss.|Trois actes de quatre manches ; la dernière de chaque acte est un boss.|Três atos de quatro rodadas; a última de cada ato é um chefe.|Drei Akte mit je vier Runden; die letzte jedes Aktes ist ein Boss.|Tre atti di quattro round; l'ultimo di ogni atto è un boss."); },
    abcoins: () => { const r = run(); return pick("Doblones|Doubloons|Doublons|Dobrões|Dublonen|Dobloni") + (r ? ": " + r.coins : "") + "\n" + pick("Moneda del casino: compra reliquias, herramientas, provisiones y sobornos en el Campamento.|Casino currency: buy relics, tools, provisions and bribes at the Camp.|Monnaie du casino : reliques, outils, provisions et pots-de-vin au Camp.|Moeda do cassino: relíquias, ferramentas, provisões e subornos no Acampamento.|Casino-Währung: Relikte, Werkzeuge, Proviant und Bestechungen im Lager.|Valuta del casinò: reliquie, strumenti, provviste e tangenti all'Accampamento."); },
    abhearts: () => { const r = run(); return pick("Provisiones|Provisions|Provisions|Provisões|Proviant|Provviste") + (r ? ": " + r.lives + "/" + r.maxLives : "") + "\n" + pick("Si no superas una ronda pierdes una. Sin provisiones, la expedición termina.|Fail a round and you lose one. With none left, the expedition ends.|Rate une manche et tu en perds une. Sans provisions, l'expédition se termine.|Falhe uma rodada e perde uma. Sem provisões, a expedição termina.|Verlierst du eine Runde, geht eine verloren. Ohne Proviant endet die Expedition.|Se fallisci un round ne perdi una. Senza provviste la spedizione finisce."); },
  });
})();
