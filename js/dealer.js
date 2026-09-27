/*
 * Geolite - EL CRUPIER (v0.10). El "jefe" de la mesa: un croupier de pixel art que habla con sonidos arcade (una silaba por letra),
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
    nocountry: ["¿El país? Se me ha caído por la ventana.|The country? It fell out of the window.|Le pays ? Il est tombé par la fenêtre.|O país? Caiu pela janela.|Das Land? Ist aus dem Fenster gefallen.|Il paese? È caduto dalla finestra."],
    memory: ["Mira bien… porque esto se borra.|Look closely… it fades away.|Regarde bien… ça s'efface.|Olhe bem… isso some.|Schau genau hin… es verblasst.|Guarda bene… svanisce."],
    blur: ["¿Ves borroso? Es el humo de mi puro.|Blurry? That's the smoke from my cigar.|Flou ? C'est la fumée de mon cigare.|Turvo? É a fumaça do meu charuto.|Verschwommen? Das ist der Rauch meiner Zigarre.|Sfocato? È il fumo del mio sigaro."],
    dark: ["Ups, un cortocircuito. Qué casualidad…|Oops, a short circuit. What a coincidence…|Oups, un court-circuit. Quelle coïncidence…|Ops, um curto-circuito. Que coincidência…|Huch, ein Kurzschluss. Welch Zufall…|Ops, un cortocircuito. Che coincidenza…"],
    flicker: ["Las luces de este casino son… temperamentales.|The lights in this casino are… temperamental.|Les lumières de ce casino sont… capricieuses.|As luzes deste cassino são… temperamentais.|Die Lichter in diesem Casino sind… launisch.|Le luci di questo casinò sono… capricciose."],
    wrongborders: ["Estas fronteras las he dibujado yo. Confía en mí.|I drew these borders myself. Trust me.|J'ai dessiné ces frontières moi-même. Fais-moi confiance.|Eu mesmo desenhei essas fronteiras. Confie em mim.|Diese Grenzen habe ich selbst gezeichnet. Vertrau mir.|Questi confini li ho disegnati io. Fidati."],
    noborders: ["Fronteras fuera. ¿Quién las necesita?|Borders? Who needs them.|Les frontières ? Qui en a besoin.|Fronteiras? Quem precisa delas.|Grenzen? Wer braucht die schon.|I confini? Chi ne ha bisogno."],
    pangea: ["Bienvenido a Pangea: los continentes vuelven a estar juntos.|Welcome to Pangaea: the continents are back together.|Bienvenue en Pangée : les continents sont de nouveau réunis.|Bem-vindo à Pangeia: os continentes estão juntos de novo.|Willkommen in Pangäa: die Kontinente sind wieder vereint.|Benvenuto in Pangea: i continenti sono di nuovo uniti."],
    shuffle: ["He cambiado los continentes de sitio. Sorpresa.|I moved the continents around. Surprise.|J'ai déplacé les continents. Surprise.|Troquei os continentes de lugar. Surpresa.|Ich habe die Kontinente verschoben. Überraschung.|Ho spostato i continenti. Sorpresa."],
    flip: ["Hoy el Sur manda. ¡Bienvenido al revés!|Today the South is on top. Welcome upside down!|Aujourd'hui le Sud est en haut. Bienvenue à l'envers !|Hoje o Sul manda. Bem-vindo de cabeça para baixo!|Heute ist der Süden oben. Willkommen auf dem Kopf!|Oggi comanda il Sud. Benvenuto a testa in giù!"],
    clouds: ["Un poco de humo de sala. No tosas… mira.|A bit of smoke in the room. Don't cough… look.|Un peu de fumée dans la salle. Ne tousse pas… regarde.|Um pouco de fumaça na sala. Não tussa… olhe.|Etwas Rauch im Saal. Nicht husten… schau.|Un po' di fumo in sala. Non tossire… guarda."],
    upside: ["Hoy el mundo está cabeza abajo. ¡Y tú también!|Today the world is upside down. And so are you!|Aujourd'hui le monde est à l'envers. Et toi aussi !|Hoje o mundo está de cabeça para baixo. E você também!|Heute steht die Welt Kopf. Und du auch!|Oggi il mondo è capovolto. E anche tu!"],
    runes: ["Escribo en runas antiguas. ¿No las entiendes? Qué pena.|I write in ancient runes. Can't read them? Shame.|J'écris en runes anciennes. Tu ne comprends pas ? Dommage.|Escrevo em runas antigas. Não entende? Que pena.|Ich schreibe in alten Runen. Kannst du sie nicht lesen? Schade.|Scrivo in rune antiche. Non le capisci? Peccato."],
    scroll: ["¡Un letrero de neón! Tú lee rápido.|A neon sign! Read fast.|Une enseigne néon ! Lis vite.|Um letreiro de neon! Leia rápido.|Eine Neonschrift! Lies schnell.|Un'insegna al neon! Leggi in fretta."],
    novowels: ["Las vocales están en huelga. Ni una.|The vowels are on strike. Not one.|Les voyelles font grève. Pas une.|As vogais estão em greve. Nenhuma.|Die Vokale streiken. Kein einziger.|Le vocali sono in sciopero. Nemmeno una."],
    anagram: ["Agité las letras como un cóctel. ¡Ja!|I shook the letters like a cocktail. Ha!|J'ai secoué les lettres comme un cocktail. Ha !|Chacoalhei as letras como um coquetel. Ha!|Ich habe die Buchstaben wie einen Cocktail geschüttelt. Ha!|Ho shakerato le lettere come un cocktail. Ah!"],
    dance: ["¡Que baile el abecedario!|Let the alphabet dance!|Que l'alphabet danse !|Que o alfabeto dance!|Lasst das Alphabet tanzen!|Che l'alfabeto balli!"],
    riddle: ["Hoy no hay nombre. Solo una adivinanza.|No name today. Just a riddle.|Pas de nom aujourd'hui. Juste une devinette.|Hoje não há nome. Só uma adivinha.|Heute kein Name. Nur ein Rätsel.|Oggi niente nome. Solo un indovinello."],
    babel: ["Hoy hablamos todos los idiomas. Buena suerte.|Today we speak every language. Good luck.|Aujourd'hui on parle toutes les langues. Bonne chance.|Hoje falamos todos os idiomas. Boa sorte.|Heute sprechen wir alle Sprachen. Viel Glück.|Oggi parliamo tutte le lingue. Buona fortuna."],
    spread: ["Los continentes necesitaban espacio. Big bang.|The continents needed space. Big bang.|Les continents avaient besoin d'espace. Big bang.|Os continentes precisavam de espaço. Big bang.|Die Kontinente brauchten Platz. Urknall.|I continenti volevano spazio. Big bang."],
    tilt: ["Endereza los continentes tú, si puedes.|Straighten the continents yourself, if you can.|Redresse les continents toi-même, si tu peux.|Endireite os continentes você mesmo, se puder.|Richte die Kontinente selbst auf, wenn du kannst.|Raddrizza i continenti da solo, se ci riesci."],
    spin: ["¡Ruleta! El mapa gira… y tú con él.|Roulette! The map spins… and so do you.|Roulette ! La carte tourne… et toi aussi.|Roleta! O mapa gira… e você junto.|Roulette! Die Karte dreht sich… und du mit.|Roulette! La mappa gira… e tu con lei."],
    mirrorx: ["Este es Oeste, Oeste es Este. Simple.|East is West, West is East. Simple.|L'Est est l'Ouest, l'Ouest est l'Est. Simple.|Leste é Oeste, Oeste é Leste. Simples.|Ost ist West, West ist Ost. Einfach.|Est è Ovest, Ovest è Est. Semplice."],
    myopia: ["Ay, no ves bien justo donde miras. Qué mala suerte.|Oh, you can't see well right where you look. Bad luck.|Oh, tu ne vois pas bien là où tu regardes. Pas de chance.|Ah, você não vê bem onde olha. Azar.|Oh, du siehst genau dort schlecht, wo du hinschaust. Pech.|Oh, non vedi bene proprio dove guardi. Sfortuna."],
    blindspot: ["Tengo un punto ciego… justo donde apuntas.|I have a blind spot… right where you aim.|J'ai un angle mort… juste là où tu vises.|Tenho um ponto cego… bem onde você mira.|Ich habe einen blinden Fleck… genau dort, wo du zielst.|Ho un punto cieco… proprio dove mira."],
    mosaic: ["Ahorro en resolución. Píxeles gordos para todos.|Saving on resolution. Chunky pixels for everyone.|J'économise sur la résolution. Gros pixels pour tous.|Economizo na resolução. Pixels gordos para todos.|Ich spare an Auflösung. Grobe Pixel für alle.|Risparmio sulla risoluzione. Pixel giganti per tutti."],
    negative: ["Todo al revés… hasta los colores.|Everything backwards… even the colors.|Tout à l'envers… même les couleurs.|Tudo ao contrário… até as cores.|Alles verkehrt… sogar die Farben.|Tutto al contrario… anche i colori."],
    quake: ["¿Has notado el temblor? Yo no he sido.|Did you feel the tremor? Wasn't me.|Tu as senti la secousse ? Ce n'était pas moi.|Sentiu o tremor? Não fui eu.|Hast du das Beben gespürt? Ich war's nicht.|Hai sentito il tremore? Non sono stato io."],
    drift: ["El mapa se va solo. Sigue el ritmo.|The map slips away. Keep up.|La carte s'en va toute seule. Suis le rythme.|O mapa vai embora sozinho. Acompanhe.|Die Karte gleitet davon. Halt mit.|La mappa se ne va da sola. Tieni il passo."],
    decoys: ["Puse unas chinchetas de más. Por si acaso.|I put a few extra pins. Just in case.|J'ai mis quelques épingles en trop. Au cas où.|Coloquei uns pinos a mais. Por via das dúvidas.|Ich habe ein paar Pins zu viel gesetzt. Für alle Fälle.|Ho messo qualche pin in più. Non si sa mai."],
    lightning: ["¡Rayos! Qué efecto tan… iluminador.|Lightning! What an… illuminating effect.|Des éclairs ! Un effet… éclairant.|Raios! Que efeito… iluminador.|Blitze! Ein wahrlich… erleuchtender Effekt.|Fulmini! Che effetto… illuminante."],
    rain: ["Llueve en el casino. Ups.|It's raining in the casino. Oops.|Il pleut dans le casino. Oups.|Chove no cassino. Ops.|Es regnet im Casino. Huch.|Piove nel casinò. Ops."],
    tremble: ["¿Te tiembla el pulso? A mí me encanta.|Does your hand shake? I love it.|Ta main tremble ? J'adore.|Sua mão treme? Eu adoro.|Zittert deine Hand? Ich liebe es.|Ti trema la mano? Adoro."],
    blink: ["Ahora me ves… ahora no.|Now you see me… now you don't.|Maintenant tu me vois… maintenant non.|Agora você me vê… agora não.|Jetzt siehst du mich… jetzt nicht.|Ora mi vedi… ora no."],
    ghost: ["Tu puntero se ha ido de paseo. Ja.|Your pointer went for a walk. Ha.|Ton pointeur est parti se promener. Ha.|Seu ponteiro saiu para passear. Ha.|Dein Zeiger ist spazieren gegangen. Ha.|Il tuo puntatore è andato a spasso. Ah."],
    cblur: ["Le he quitado el foco a tu puntero.|I took the focus off your pointer.|J'ai retiré la mise au point de ton pointeur.|Tirei o foco do seu ponteiro.|Ich habe deinen Zeiger unscharf gestellt.|Ho tolto la messa a fuoco al tuo puntatore."],
    lag: ["Ups, ¿va lento el internet del casino?|Oops, is the casino Wi-Fi slow?|Oups, le Wi-Fi du casino est lent ?|Ops, o Wi-Fi do cassino está lento?|Huch, ist das Casino-WLAN langsam?|Ops, il Wi-Fi del casinò è lento?"],
    cmirror: ["Derecha es izquierda. Izquierda es derecha. ¡Ja!|Right is left. Left is right. Ha!|La droite est la gauche. La gauche est la droite. Ha !|Direita é esquerda. Esquerda é direita. Ha!|Rechts ist links. Links ist rechts. Ha!|Destra è sinistra. Sinistra è destra. Ah!"],
    dizzy: ["Un cóctel de más y todo da vueltas.|One cocktail too many and everything spins.|Un cocktail de trop et tout tourne.|Um coquetel a mais e tudo gira.|Ein Cocktail zu viel und alles dreht sich.|Un cocktail di troppo e tutto gira."],
    bribe: ["¿Sobornarme? Qué poco elegante… Acepto.|Bribe me? How tacky… I accept.|Me soudoyer ? Quelle vulgarité… J'accepte.|Me subornar? Que deselegante… Aceito.|Mich bestechen? Wie stillos… Ich nehme an.|Corrompermi? Che volgarità… Accetto."],
    reroll: ["Barajo de nuevo. La suerte es mía.|Shuffling again. Luck is mine.|Je mélange à nouveau. La chance est à moi.|Embaralho de novo. A sorte é minha.|Ich mische neu. Das Glück gehört mir.|Rimescolo. La fortuna è mia."],
    wind: ["¡Vendaval! Apunta con la cabeza.|Gale! Aim with your head.|Rafale ! Vise avec la tête.|Vendaval! Mire com a cabeça.|Sturm! Ziel mit dem Kopf.|Bufera! Mira con la testa."],
    storm: ["El reloj corre más rápido esta noche.|The clock runs faster tonight.|L'horloge tourne plus vite ce soir.|O relógio corre mais rápido esta noite.|Die Uhr läuft heute schneller.|L'orologio corre più veloce stasera."],
    silence: ["Shhh. Tus juguetes se quedan en silencio.|Shhh. Your toys stay silent.|Chut. Tes jouets restent muets.|Shhh. Seus brinquedos ficam em silêncio.|Pssst. Deine Spielzeuge bleiben stumm.|Shhh. I tuoi giocattoli restano muti."],

    /* ---------------------------------------------------------------- pantalla principal: apariciones al azar mientras eliges modo (nunca durante una partida) */
    homeTaunt: [
      "¿A que no sabes ni dónde queda esto? Adelante, sorpréndeme.|Bet you don't even know where this is. Go on, surprise me.|Je parie que tu ne sais même pas où c'est. Vas-y, surprends-moi.|Aposto que nem sabe onde fica isso. Vamos, me surpreenda.|Wetten, du weißt nicht mal, wo das liegt? Los, überrasch mich.|Scommetto che non sai nemmeno dove si trova. Forza, sorprendimi.",
      "Ese país de ahí… ni idea, ¿eh? Tranquilo, a nadie le importa.|That country over there… no clue, huh? Relax, nobody's judging.|Ce pays-là… aucune idée, hein ? Tranquille, personne ne juge.|Aquele país ali… nem ideia, né? Relaxa, ninguém está julgando.|Dieses Land dort drüben… keine Ahnung, oder? Entspann dich, keiner urteilt.|Quel paese laggiù… nessuna idea, eh? Tranquillo, nessuno giudica.",
      "Vamos, atrévete a sentarte. O sigue mirando el mapa desde ahí, cobarde.|Come on, dare to sit down. Or keep staring at the map from over there, coward.|Allez, ose t'asseoir. Ou continue à fixer la carte de loin, peureux.|Vamos, tenha coragem de sentar. Ou fique só olhando o mapa daí, covarde.|Los, trau dich zu setzen. Oder starr weiter von dort auf die Karte, Feigling.|Dai, osa sederti. O continua a fissare la mappa da lì, coniglio.",
      "¿Miedo a fallar? Aquí todos fallan. Yo me río igual.|Scared of missing? Everyone misses here. I laugh either way.|Peur de te tromper ? Tout le monde se trompe ici. Je ris quand même.|Medo de errar? Todo mundo erra aqui. Eu rio de qualquer jeito.|Angst vor Fehlern? Hier scheitert jeder. Ich lache trotzdem.|Paura di sbagliare? Qui sbagliano tutti. Io rido comunque.",
      "Seguro que confundes un continente con otro. Es un clásico.|I bet you mix up continents. It's a classic.|Je parie que tu confonds les continents. Un classique.|Aposto que você confunde continentes. É clássico.|Wetten, du verwechselst Kontinente. Ein Klassiker.|Scommetto che confondi i continenti. Un classico.",
      "¿Sabes jugarte unos doblones o solo mirar el escaparate?|Do you know how to bet a few doubloons, or just window-shop?|Tu sais miser quelques doublons, ou juste lécher la vitrine ?|Sabe apostar uns dobrões ou só olhar a vitrine?|Kannst du ein paar Dublonen setzen, oder nur Schaufenster gucken?|Sai puntare qualche dobbline o guardi solo la vetrina?",
      "La mesa lleva rato esperándote. No le hagas el feo.|The table's been waiting a while. Don't leave it hanging.|La table t'attend depuis un moment. Ne la laisse pas en plan.|A mesa está esperando faz tempo. Não deixe ela na mão.|Der Tisch wartet schon eine Weile. Lass ihn nicht hängen.|Il tavolo aspetta da un po'. Non lasciarlo in sospeso.",
    ],
    homeTempt: [
      "Psst… una partida rápida. Nadie tiene por qué enterarse.|Psst… one quick round. No one has to know.|Psst… une partie rapide. Personne n'a besoin de savoir.|Psst… uma partida rápida. Ninguém precisa saber.|Psst… eine schnelle Runde. Keiner muss es wissen.|Psst… una partita veloce. Nessuno deve saperlo.",
      "Los doblones no se ganan solos, explorador.|Doubloons don't win themselves, explorer.|Les doublons ne se gagnent pas tout seuls, explorateur.|Os dobrões não se ganham sozinhos, explorador.|Dublonen gewinnen sich nicht von selbst, Entdecker.|I dobloni non si vincono da soli, esploratore.",
      "El mapa está calentito. Ven a tocarlo.|The map's still warm. Come touch it.|La carte est encore chaude. Viens la toucher.|O mapa ainda está quentinho. Venha tocar.|Die Karte ist noch warm. Komm, berühr sie.|La mappa è ancora calda. Vieni a toccarla.",
      "Una manita más y lo dejamos… como todos dicen.|Just one more hand and we stop… like everyone says.|Encore une main et on arrête… comme tout le monde dit.|Só mais uma mão e paramos… como todo mundo diz.|Nur noch eine Runde, dann hören wir auf… wie alle sagen.|Ancora una mano e la finiamo… come dicono tutti.",
      "Tengo una silla libre en mi mesa. Con tu nombre.|I've got an empty seat at my table. With your name on it.|J'ai une place libre à ma table. À ton nom.|Tenho uma cadeira livre na minha mesa. Com seu nome.|Ich habe einen freien Platz an meinem Tisch. Mit deinem Namen drauf.|Ho un posto libero al mio tavolo. Con il tuo nome.",
      "¿Y si esta vez me ganas de verdad? Casi me lo creo.|What if you actually beat me this time? I almost believe it.|Et si cette fois tu me battais vraiment ? J'y crois presque.|E se desta vez você realmente me vencer? Quase acredito.|Was, wenn du mich diesmal wirklich schlägst? Fast glaube ich das.|E se stavolta mi battessi davvero? Quasi ci credo.",
      "El casino nunca cierra. Tú tampoco deberías.|The casino never closes. Neither should you.|Le casino ne ferme jamais. Toi non plus, tu ne devrais pas.|O cassino nunca fecha. Você também não deveria.|Das Casino schließt nie. Du solltest das auch nicht.|Il casinò non chiude mai. Nemmeno tu dovresti.",
    ],
    homeTrivia: [
      "¿Sabías que Rusia cruza 11 husos horarios? Ni yo doy tantas vueltas en una noche.|Did you know Russia spans 11 time zones? Even I don't spin that much in one night.|Tu savais que la Russie traverse 11 fuseaux horaires ? Même moi je ne tourne pas autant en une nuit.|Sabia que a Rússia atravessa 11 fusos horários? Nem eu giro tanto assim numa noite.|Wusstest du, dass Russland 11 Zeitzonen umfasst? Nicht mal ich drehe mich so oft an einem Abend.|Sapevi che la Russia attraversa 11 fusi orari? Nemmeno io giro così tanto in una notte.",
      "El Nilo mide más de 6.500 km. Y tú sin saber ni tu propia capital.|The Nile is over 6,500 km long. And you don't even know your own capital.|Le Nil fait plus de 6 500 km. Et toi, tu ne connais même pas ta propre capitale.|O Nilo tem mais de 6.500 km. E você nem sabe a própria capital.|Der Nil ist über 6.500 km lang. Und du kennst nicht mal deine eigene Hauptstadt.|Il Nilo è lungo oltre 6.500 km. E tu non conosci nemmeno la tua capitale.",
      "El Vaticano es el país más pequeño del mundo. Como tu paciencia para estudiar geografía.|The Vatican is the smallest country in the world. Like your patience for studying geography.|Le Vatican est le plus petit pays du monde. Comme ta patience pour étudier la géographie.|O Vaticano é o menor país do mundo. Igual à sua paciência para estudar geografia.|Der Vatikan ist das kleinste Land der Welt. Wie deine Geduld beim Geografie-Lernen.|Il Vaticano è il paese più piccolo del mondo. Come la tua pazienza nello studiare geografia.",
      "Canadá tiene más lagos que el resto del planeta junto. A ver si aciertas uno.|Canada has more lakes than the rest of the planet combined. Let's see if you can name one.|Le Canada a plus de lacs que le reste de la planète réunie. Voyons si tu en trouves un.|O Canadá tem mais lagos que o resto do planeta junto. Vamos ver se você acerta um.|Kanada hat mehr Seen als der Rest der Welt zusammen. Mal sehen, ob du einen triffst.|Il Canada ha più laghi del resto del pianeta messo insieme. Vediamo se ne indovini uno.",
      "El Sáhara es casi tan grande como Estados Unidos. Y tú perdido en tu propio barrio.|The Sahara is almost as big as the United States. And you get lost in your own neighborhood.|Le Sahara est presque aussi grand que les États-Unis. Et toi, tu te perds dans ton propre quartier.|O Saara é quase do tamanho dos Estados Unidos. E você se perde no próprio bairro.|Die Sahara ist fast so groß wie die USA. Und du verläufst dich in deiner eigenen Nachbarschaft.|Il Sahara è quasi grande quanto gli Stati Uniti. E tu ti perdi nel tuo stesso quartiere.",
      "Australia es una isla, un país y un continente a la vez. Presume de eso en la próxima mano.|Australia is an island, a country and a continent all at once. Brag about that on the next hand.|L'Australie est une île, un pays et un continent à la fois. Vante-toi de ça à la prochaine main.|A Austrália é uma ilha, um país e um continente ao mesmo tempo. Se gabe disso na próxima mão.|Australien ist Insel, Land und Kontinent zugleich. Prahl damit bei der nächsten Runde.|L'Australia è un'isola, un paese e un continente insieme. Vantatene alla prossima mano.",
      "Groenlandia parece enorme en el mapa… y en realidad cabe varias veces en África. Sorpresa.|Greenland looks huge on the map… and it actually fits inside Africa several times over. Surprise.|Le Groenland paraît énorme sur la carte… et il tient plusieurs fois dans l'Afrique. Surprise.|A Groenlândia parece enorme no mapa… e na verdade cabe várias vezes dentro da África. Surpresa.|Grönland sieht auf der Karte riesig aus… und passt tatsächlich mehrfach in Afrika. Überraschung.|La Groenlandia sembra enorme sulla mappa… e in realtà ci sta più volte dentro l'Africa. Sorpresa.",
    ],
  };
  for (const k in LINES) LINES[k] = LINES[k].map(L6);

  const D = A.dealer = { on: false, onHome: false, host: null, timers: [], busy: false };
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
    if (!D.on && !D.onHome) return; ensure(); clear();
    const mood = o.mood || "sly", text = typeof line === "string" ? line : A.tx(line), src = FACE[mood] || "dealer_neutral";
    face.src = `assets/icons/${src}.webp`; el.className = "dealer in " + mood + (D.host ? " big" : "") + (el.closest("#vdDealer") ? " inline" : ""); txt.textContent = ""; bubble.classList.add("on");
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
  /* lo coloca dentro de un hueco de la pantalla (veredicto) sin bloquear sus reacciones */
  D.anchor = host => { if (!host) return; ensure(); host.appendChild(el); el.classList.add("inline"); };
  /* secuencia de frases: [{line, mood}] */
  D.sequence = (items, done) => { let k = 0; const next = () => { if (k >= items.length) return done && done(); const it = items[k++]; D.say(it.line, { mood: it.mood, hold: 0, done: () => later(next, it.gap || 700) }); }; next(); };
  D.line = (key, i) => { const a = LINES[key]; return a ? (i == null ? rand(a) : a[i % a.length]) : null; };
  D.lines = LINES;

  /* ---------------------------------------------------------------- pantalla principal: apariciones sueltas del crupier mientras el jugador elige modo */
  const HOME_CORNERS = ["home-tl", "home-tr"];
  let homeT = 0, homeLast = "";
  function homeTick() {
    if (!D.onHome) return;
    if (!document.querySelector(".hh") || D.busy) { homeT = setTimeout(homeTick, 2500); return; }         // solo en la pantalla de inicio, y no interrumpe si ya esta hablando
    const P = A.profile ? A.profile.get() : null, hasSave = A.adv && A.adv.hasSave && A.adv.hasSave(), seen = P && P.ach ? Object.keys(P.ach).length : 0;
    const pool = []; const push = (k, n) => { for (let i = 0; i < n; i++) pool.push(k); };
    if (hasSave) { push("homeTempt", 5); push("homeTaunt", 3); push("homeTrivia", 3); }                    // partida a medias: mas tentacion para que la retome
    else if (!seen) { push("homeTaunt", 5); push("homeTrivia", 4); push("homeTempt", 2); }                 // nunca ha jugado: mas burla y datos, poca tentacion
    else { push("homeTaunt", 4); push("homeTrivia", 4); push("homeTempt", 3); }
    let cat = rand(pool); if (cat === homeLast && pool.some(p => p !== cat)) cat = rand(pool.filter(p => p !== cat));
    const line = D.line(cat); homeLast = cat;
    ensure(); el.classList.remove(...HOME_CORNERS);
    D.say(line, { mood: rand(["sly", "laugh"]), hold: 4200 + (typeof line === "string" ? line.length : 60) * 24 });
    el.classList.add("home", rand(HOME_CORNERS));
    homeT = setTimeout(homeTick, 15000 + Math.random() * 14000);
  }
  /* activa/desactiva las apariciones de inicio (independiente de D.on, que es solo para dentro de una partida) */
  D.homeTease = on => {
    D.onHome = !!on; clearTimeout(homeT);
    if (!on) { if (el) el.classList.remove(...HOME_CORNERS, "home"); D.hide(); return; }
    ensure(); el.classList.remove("hidden"); homeT = setTimeout(homeTick, 7000 + Math.random() * 6000);
  };

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
