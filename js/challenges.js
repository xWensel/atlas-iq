/*
 * Geolite - RETOS de la Aventura (v0.11). El crupier "toca la mesa": cada ronda trae retos que cambian
 *   - el NOMBRE del lugar (letras que tiemblan, faltan, se cambian, runas, anagramas, otro idioma, adivinanza...),
 *   - el MAPA (borroso, apagon, fronteras falsas, Pangea, Big bang, continentes torcidos, del reves, terremoto, deriva, lluvia, rayos...),
 *   - el PUNTERO (tiembla, parpadea, desaparece, se emborrona, va con retraso, se mueve al reves, marea...) y
 *   - las REGLAS (viento, tormenta, silencio).
 * No tocan la puntuacion: solo hacen mas dificil encontrar el sitio. Los perks los mitigan (ver `fx` en js/relics.js).
 *
 *   A.chal.plan(seed, roundNo, asc, topic, cjk) -> { list:[{id,lv}], boss, combo }   (determinista: la tienda anuncia la ronda siguiente)
 *   A.chal.begin(list, fx, ctx)       A.chal.question(o, qi)   A.chal.reveal()   A.chal.suspend()   A.chal.end()
 *   A.chal.ptrMods()                  -> parametros del puntero para js/pointer.js
 */
window.AIQ = window.AIQ || {};
(function (A) {
  const $ = id => document.getElementById(id);
  const L6 = A.L6;
  /* Torre de Babel: el nombre sale en uno de los 6 idiomas originales; los nuevos (zh, ko, ja, ru) no entran salvo que el jugador
     juegue en ellos, y el idioma del jugador (y su base: es-419 -> es) nunca se elige */
  const BABEL_BASE = ["es", "en", "fr", "pt", "de", "it"];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ------------------------------------------------------------------ catalogo */
  const D = {};
  const def = (id, kind, ico, n, d, counters) => { D[id] = { id, kind, ico, n: L6(n), d: L6(d), counters: counters || [] }; };
  /* --- nombre del lugar --- */
  def("shaky", "text", "ch_shaky", "Letras temblorosas|Shaky letters|Lettres tremblantes|Letras trêmulas|Zitternde Buchstaben|Lettere tremanti||颤抖的字母|떨리는 글자|震える文字|Дрожащие буквы|Drżące litery", "El nombre tiembla y cuesta leerlo.|The name trembles and is hard to read.|Le nom tremble et se lit mal.|O nome treme e é difícil de ler.|Der Name zittert und ist schwer lesbar.|Il nome trema ed è difficile da leggere.||名字在颤抖，很难看清。|이름이 떨려서 읽기 어렵습니다.|名前が震えて読みにくい。|Название дрожит, его трудно прочесть.|Nazwa drży i trudno ją przeczytać.", ["steadyhand", "spectacles"]);
  def("missing", "text", "ch_missing", "Tinta borrada|Faded ink|Encre effacée|Tinta apagada|Verblasste Tinte|Inchiostro sbiadito||褪色的墨水|바랜 잉크|かすれたインク|Выцветшие чернила|Wyblakły atrament", "Faltan letras del nombre.|Some letters of the name are missing.|Il manque des lettres du nom.|Faltam letras do nome.|Im Namen fehlen Buchstaben.|Mancano lettere del nome.||名字缺了几个字母。|이름의 일부 글자가 빠져 있습니다.|名前の文字がいくつか欠けている。|В названии не хватает букв.|W nazwie brakuje liter.", ["dictionary", "spectacles"]);
  def("swap", "text", "ch_swap", "Letras cambiadas|Swapped letters|Lettres échangées|Letras trocadas|Vertauschte Buchstaben|Lettere scambiate||错位的字母|뒤바뀐 글자|入れ替わった文字|Переставленные буквы|Zamienione litery", "Algunas letras están intercambiadas.|Some letters are swapped around.|Certaines lettres sont échangées.|Algumas letras estão trocadas.|Manche Buchstaben sind vertauscht.|Alcune lettere sono scambiate.||有些字母互换了位置。|일부 글자의 위치가 바뀌어 있습니다.|いくつかの文字が入れ替わっている。|Некоторые буквы поменялись местами.|Niektóre litery zamieniły się miejscami.", ["spectacles", "dictionary"]);
  def("mirror", "text", "ch_mirror", "Espejo|Mirror|Miroir|Espelho|Spiegel|Specchio||镜子|거울|鏡|Зеркало|Lustro", "El nombre está escrito en espejo.|The name is written in mirror image.|Le nom est écrit en miroir.|O nome aparece espelhado.|Der Name ist gespiegelt.|Il nome è scritto a specchio.||名字是镜像书写的。|이름이 거울에 비친 것처럼 쓰여 있습니다.|名前が鏡文字で書かれている。|Название написано зеркально.|Nazwa jest napisana w lustrzanym odbiciu.", ["handmirror"]);
  def("memory", "text", "ch_memory", "Memoria de pez|Goldfish memory|Mémoire de poisson|Memória de peixe|Fischgedächtnis|Memoria di pesce||金鱼记忆|금붕어 기억력|金魚の記憶力|Память как у рыбки|Pamięć złotej rybki", "El nombre se desvanece: recuérdalo.|The name fades away: remember it.|Le nom s'efface : retiens-le.|O nome desaparece: memorize-o.|Der Name verblasst: merk ihn dir.|Il nome svanisce: ricordalo.||名字会渐渐消失：记住它。|이름이 사라집니다: 기억해두세요.|名前が消えていく：覚えておこう。|Название исчезает: запомни его.|Nazwa znika: zapamiętaj ją.", ["spectacles"]);
  def("upside", "text", "ch_upside", "Boca abajo|Upside down|La tête en bas|De cabeça para baixo|Kopfüber|Sottosopra||倒过来|거꾸로|逆さま|Вверх ногами|Do góry nogami", "El nombre está del revés.|The name is upside down.|Le nom est à l'envers.|O nome está de cabeça para baixo.|Der Name steht auf dem Kopf.|Il nome è capovolto.||名字是倒过来的。|이름이 뒤집혀 있습니다.|名前が逆さまになっている。|Название перевёрнуто.|Nazwa jest odwrócona do góry nogami.", ["handmirror"]);
  def("runes", "text", "ch_runes", "Runas|Runes|Runes|Runas|Runen|Rune||符文|룬 문자|ルーン文字|Руны|Runy", "Letras sustituidas por símbolos parecidos.|Letters swapped for look-alike symbols.|Lettres remplacées par des symboles qui leur ressemblent.|Letras trocadas por símbolos parecidos.|Buchstaben durch ähnliche Symbole ersetzt.|Lettere sostituite da simboli simili.||字母被换成了形似的符号。|글자가 비슷하게 생긴 기호로 바뀌었습니다.|文字が似た形の記号に置き換えられている。|Буквы заменены похожими символами.|Litery zastąpiono podobnymi symbolami.", ["spectacles"]);
  def("scroll", "text", "ch_scroll", "Marquesina|Ticker sign|Enseigne défilante|Letreiro|Laufschrift|Insegna scorrevole||滚动字幕|전광판|電光掲示板|Бегущая строка|Świetlna reklama", "El nombre pasa como un letrero luminoso.|The name scrolls by like a neon sign.|Le nom défile comme une enseigne lumineuse.|O nome passa como um letreiro luminoso.|Der Name läuft wie eine Leuchtschrift vorbei.|Il nome scorre come un'insegna luminosa.||名字像霓虹灯招牌一样滚动而过。|이름이 네온사인처럼 흘러갑니다.|名前がネオンサインのように流れていく。|Название проплывает, как неоновая вывеска.|Nazwa przesuwa się jak neon.", ["steadyhand"]);
  def("novowels", "text", "ch_novowels", "Sin vocales|No vowels|Sans voyelles|Sem vogais|Ohne Vokale|Senza vocali||没有元音|모음 없음|母音なし|Без гласных|Bez samogłosek", "Las vocales han desaparecido.|The vowels are gone.|Les voyelles ont disparu.|As vogais sumiram.|Die Vokale sind verschwunden.|Le vocali sono sparite.||元音全都消失了。|모음이 사라졌습니다.|母音が消えてしまった。|Гласные исчезли.|Samogłoski zniknęły.", ["dictionary"]);
  def("anagram", "text", "ch_anagram", "Anagrama|Anagram|Anagramme|Anagrama|Anagramm|Anagramma||字谜|애너그램|アナグラム|Анаграмма|Anagram", "Las letras del interior están mezcladas.|The inner letters are shuffled.|Les lettres intérieures sont mélangées.|As letras internas estão embaralhadas.|Die inneren Buchstaben sind gemischt.|Le lettere interne sono mescolate.||中间的字母被打乱了。|가운데 글자들이 섞여 있습니다.|中の文字がシャッフルされている。|Внутренние буквы перемешаны.|Środkowe litery są pomieszane.", ["dictionary"]);
  def("dance", "text", "ch_dance", "Baile de letras|Dancing letters|Lettres qui dansent|Letras dançantes|Tanzende Buchstaben|Lettere che ballano||跳舞的字母|춤추는 글자|踊る文字|Танцующие буквы|Tańczące litery", "Las letras saltan arriba y abajo.|The letters bounce up and down.|Les lettres sautent de haut en bas.|As letras pulam para cima e para baixo.|Die Buchstaben hüpfen auf und ab.|Le lettere saltellano su e giù.||字母上下跳动。|글자들이 위아래로 튑니다.|文字が上下に跳ねる。|Буквы прыгают вверх и вниз.|Litery podskakują w górę i w dół.", ["steadyhand", "spectacles"]);
  def("riddle", "text", "ch_riddle", "Adivinanza|Riddle|Devinette|Adivinha|Rätsel|Indovinello||谜语|수수께끼|なぞなぞ|Загадка|Zagadka", "En vez del nombre, una pista con el nombre tapado.|A clue with the name blanked out replaces the name.|Un indice au nom masqué remplace le nom.|Uma pista com o nome tapado substitui o nome.|Statt des Namens ein Hinweis mit verdecktem Namen.|Al posto del nome, un indizio con il nome coperto.||名字被替换成一条遮住名字的线索。|이름 대신 이름이 가려진 단서가 나옵니다.|名前の代わりに、名前を伏せたヒントが表示される。|Вместо названия — подсказка, где название скрыто.|Zamiast nazwy pojawia się wskazówka z zakrytą nazwą.", ["almanac"]);
  def("babel", "text", "ch_babel", "Torre de Babel|Tower of Babel|Tour de Babel|Torre de Babel|Turmbau zu Babel|Torre di Babele||巴别塔|바벨탑|バベルの塔|Вавилонская башня|Wieża Babel", "El nombre aparece en otro idioma.|The name appears in another language.|Le nom apparaît dans une autre langue.|O nome aparece em outro idioma.|Der Name erscheint in einer anderen Sprache.|Il nome appare in un'altra lingua.||名字以另一种语言显示。|이름이 다른 언어로 나타납니다.|名前が別の言語で表示される。|Название появляется на другом языке.|Nazwa pojawia się w innym języku.", ["dictionary"]);
  def("nocountry", "text", "t_country", "Sin país|No country|Sans pays|Sem país|Ohne Land|Senza paese||没有国家|국가 없음|国なし|Без страны|Bez kraju", "El país del lugar desaparece: solo te queda el nombre.|The place's country disappears: only the name is left.|Le pays du lieu disparaît : il ne reste que le nom.|O país do lugar desaparece: só resta o nome.|Das Land des Ortes verschwindet: nur der Name bleibt.|Il paese del luogo sparisce: resta solo il nome.||地点所属的国家消失了：只剩下名字。|장소의 국가가 사라지고 이름만 남습니다.|場所の国が消え、名前だけが残る。|Страна места исчезает: остаётся только название.|Kraj miejsca znika: zostaje tylko nazwa.", ["atlasbook"]);
  /* --- mapa --- */
  def("blur", "map", "ch_blur", "Mapa borroso|Blurry map|Carte floue|Mapa desfocado|Verschwommene Karte|Mappa sfocata||模糊的地图|흐릿한 지도|ぼやけた地図|Размытая карта|Rozmyta mapa", "El mapa está desenfocado.|The map is out of focus.|La carte est floue.|O mapa está fora de foco.|Die Karte ist unscharf.|La mappa è sfocata.||地图失焦了。|지도의 초점이 맞지 않습니다.|地図のピントが合っていない。|Карта не в фокусе.|Mapa jest nieostra.", ["lens", "divingmask"]);
  def("dark", "map", "ch_dark", "Apagón|Blackout|Panne de courant|Apagão|Stromausfall|Blackout||停电|정전|停電|Отключение света|Awaria prądu", "El casino se queda a oscuras: solo ves cerca del puntero.|The casino goes dark: you only see near your pointer.|Le casino s'éteint : tu ne vois qu'autour du pointeur.|O cassino fica às escuras: só se vê perto do ponteiro.|Das Casino wird dunkel: du siehst nur um den Zeiger.|Il casinò si spegne: vedi solo vicino al puntatore.||赌场一片漆黑：你只能看到指针附近。|카지노가 어두워집니다: 포인터 주변만 보입니다.|カジノが暗くなる：ポインターの周りしか見えない。|В казино гаснет свет: видно только возле курсора.|W kasynie gaśnie światło: widzisz tylko wokół kursora.", ["miner"]);
  def("flicker", "map", "ch_flicker", "Luces parpadeantes|Flickering lights|Lumières clignotantes|Luzes piscando|Flackerndes Licht|Luci intermittenti||闪烁的灯光|깜빡이는 조명|点滅する照明|Мигающий свет|Migające światła", "Las luces se apagan a ratos y el mapa desaparece.|The lights cut out and the map vanishes for a moment.|Les lumières s'éteignent et la carte disparaît un instant.|As luzes apagam e o mapa some por um instante.|Das Licht fällt aus und die Karte verschwindet kurz.|Le luci si spengono e la mappa sparisce per un attimo.||灯光熄灭，地图会短暂消失。|불이 꺼지고 지도가 잠시 사라집니다.|明かりが消え、地図が一瞬見えなくなる。|Свет гаснет, и карта на миг исчезает.|Światła gasną, a mapa na chwilę znika.", ["miner"]);
  def("wrongborders", "map", "ch_wrongborders", "Fronteras falsas|False borders|Fausses frontières|Fronteiras falsas|Falsche Grenzen|Confini falsi||虚假边界|가짜 국경|偽の国境|Ложные границы|Fałszywe granice", "Las fronteras dibujadas mienten.|The drawn borders are lying.|Les frontières dessinées mentent.|As fronteiras desenhadas mentem.|Die gezeichneten Grenzen lügen.|I confini disegnati mentono.||画出的边界是假的。|그려진 국경이 거짓말을 합니다.|描かれた国境はウソだ。|Нарисованные границы лгут.|Narysowane granice kłamią.", ["customs"]);
  def("noborders", "map", "ch_noborders", "Mapa mudo|Blank map|Carte muette|Mapa mudo|Stumme Karte|Mappa muta||空白地图|빈 지도|白地図|Немая карта|Niema mapa", "Sin fronteras en el mapa.|No borders on the map.|Pas de frontières sur la carte.|Sem fronteiras no mapa.|Keine Grenzen auf der Karte.|Nessun confine sulla mappa.||地图上没有边界。|지도에 국경이 없습니다.|地図に国境がない。|На карте нет границ.|Na mapie nie ma granic.", ["customs"]);
  def("pangea", "map", "ch_pangea", "Pangea|Pangaea|Pangée|Pangeia|Pangaea|Pangea||盘古大陆|판게아|パンゲア|Пангея|Pangea", "Los continentes se han unido en un solo supercontinente, como hace 250 millones de años.|The continents have merged into one supercontinent, like 250 million years ago.|Les continents se sont réunis en un seul supercontinent, comme il y a 250 millions d'années.|Os continentes se uniram num único supercontinente, como há 250 milhões de anos.|Die Kontinente sind zu einem Superkontinent verschmolzen, wie vor 250 Millionen Jahren.|I continenti si sono uniti in un unico supercontinente, come 250 milioni di anni fa.||各大洲合并成了一个超大陆，就像 2.5 亿年前那样。|2억 5천만 년 전처럼 대륙들이 하나의 초대륙으로 합쳐졌습니다.|2億5千万年前のように、大陸が一つの超大陸に合体した。|Континенты слились в один суперконтинент, как 250 миллионов лет назад.|Kontynenty połączyły się w jeden superkontynent, jak 250 milionów lat temu.", ["plates"]);
  def("deal", "map", "ch_deal", "Continentes barajados|Shuffled continents|Continents mélangés|Continentes embaralhados|Gemischte Kontinente|Continenti mescolati||洗乱的大洲|섞인 대륙|シャッフルされた大陸|Перетасованные континенты|Potasowane kontynenty", "El crupier ha barajado los continentes y los ha repartido sobre la mesa.|The dealer has shuffled the continents and dealt them across the table.|Le croupier a mélangé les continents et les a distribués sur la table.|O crupiê embaralhou os continentes e os distribuiu pela mesa.|Der Croupier hat die Kontinente gemischt und auf dem Tisch ausgeteilt.|Il croupier ha mescolato i continenti e li ha distribuiti sul tavolo.||荷官把各大洲洗乱，再发到了牌桌上。|딜러가 대륙들을 섞어서 테이블 위에 나눠 놓았습니다.|ディーラーが大陸をシャッフルして、テーブルに配った。|Крупье перетасовал континенты и разложил их по столу.|Krupier potasował kontynenty i rozłożył je na stole.", ["plates"]);
  def("spread", "map", "ch_spread", "Big bang|Big bang|Big bang|Big bang|Urknall|Big bang||大爆炸|빅뱅|ビッグバン|Большой взрыв|Wielki wybuch", "Los continentes se han separado.|The continents have drifted apart.|Les continents se sont éloignés.|Os continentes se afastaram.|Die Kontinente sind auseinandergedriftet.|I continenti si sono allontanati.||各大洲漂离开了。|대륙들이 서로 멀어졌습니다.|大陸が離れ離れになった。|Континенты разошлись.|Kontynenty się rozjechały.", ["plates"]);
  def("tilt", "map", "ch_tilt", "Continentes torcidos|Crooked continents|Continents de travers|Continentes tortos|Schiefe Kontinente|Continenti storti||歪斜的大洲|비뚤어진 대륙|傾いた大陸|Кривые континенты|Krzywe kontynenty", "Cada continente está girado.|Every continent is turned.|Chaque continent est tourné.|Cada continente está girado.|Jeder Kontinent ist gedreht.|Ogni continente è ruotato.||每个大洲都被旋转了。|모든 대륙이 회전되어 있습니다.|すべての大陸が回転している。|Каждый континент повёрнут.|Każdy kontynent jest obrócony.", ["plates"]);
  def("flip", "map", "ch_flip", "Mundo del revés|Upside-down world|Monde à l'envers|Mundo de cabeça para baixo|Welt auf dem Kopf|Mondo capovolto||颠倒的世界|뒤집힌 세계|逆さまの世界|Мир вверх ногами|Świat do góry nogami", "El Sur está arriba.|South is up.|Le Sud est en haut.|O Sul está em cima.|Der Süden ist oben.|Il Sud è in alto.||南方在上。|남쪽이 위에 있습니다.|南が上にある。|Юг — наверху.|Południe jest na górze.", ["handmirror"]);
  def("mirrorx", "map", "ch_mirrorx", "Espejo del mapa|Mirror map|Carte miroir|Mapa espelhado|Spiegelkarte|Mappa a specchio||镜像地图|거울 지도|鏡の地図|Зеркальная карта|Lustrzana mapa", "Este y Oeste están intercambiados.|East and West are swapped.|L'Est et l'Ouest sont échangés.|Leste e Oeste estão trocados.|Ost und West sind vertauscht.|Est e Ovest sono scambiati.||东西颠倒了。|동쪽과 서쪽이 바뀌었습니다.|東と西が入れ替わっている。|Восток и запад поменялись местами.|Wschód i zachód zamieniły się miejscami.", ["handmirror"]);
  def("spin", "map", "ch_spin", "Ruleta|Roulette|Roulette|Roleta|Roulette|Roulette||轮盘|룰렛|ルーレット|Рулетка|Ruletka", "El mapa gira despacio.|The map slowly spins.|La carte tourne lentement.|O mapa gira devagar.|Die Karte dreht sich langsam.|La mappa gira lentamente.||地图在缓慢旋转。|지도가 천천히 회전합니다.|地図がゆっくり回転する。|Карта медленно вращается.|Mapa powoli się kręci.", ["shockabsorber"]);
  def("clouds", "map", "ch_clouds", "Humo de sala|Smoky room|Salle enfumée|Sala esfumaçada|Verrauchter Saal|Sala fumosa||烟雾弥漫的房间|연기 자욱한 방|煙だらけの部屋|Прокуренный зал|Zadymiona sala", "El humo tapa partes del mapa.|Smoke covers parts of the map.|La fumée cache des parties de la carte.|A fumaça cobre partes do mapa.|Rauch verdeckt Teile der Karte.|Il fumo copre parti della mappa.||烟雾遮住了部分地图。|연기가 지도의 일부를 가립니다.|煙が地図の一部を覆っている。|Дым закрывает части карты.|Dym zasłania fragmenty mapy.", ["umbrella"]);
  def("rain", "map", "ch_rain", "Lluvia|Rain|Pluie|Chuva|Regen|Pioggia||雨|비|雨|Дождь|Deszcz", "La lluvia tapa y emborrona el mapa.|Rain streaks cover the map.|La pluie brouille la carte.|A chuva embaça o mapa.|Regen trübt die Karte.|La pioggia offusca la mappa.||雨痕遮盖了地图。|빗줄기가 지도를 가립니다.|雨筋が地図を覆う。|Струи дождя закрывают карту.|Strugi deszczu zasłaniają mapę.", ["umbrella"]);
  def("myopia", "map", "ch_myopia", "Miopía|Nearsighted|Myopie|Miopia|Kurzsichtig|Miopia||近视|근시|近視|Близорукость|Krótkowzroczność", "Todo se ve nítido menos donde apuntas.|Everything is sharp except where you aim.|Tout est net sauf là où tu vises.|Tudo fica nítido menos onde você mira.|Alles ist scharf, außer wo du zielst.|Tutto è nitido tranne dove miri.||除了你瞄准的地方，其他都很清晰。|조준하는 곳만 빼고 모든 것이 선명합니다.|狙っている場所以外はすべてくっきり見える。|Всё чётко, кроме того места, куда ты целишься.|Wszystko jest ostre oprócz miejsca, w które celujesz.", ["divingmask"]);
  def("blindspot", "map", "ch_blindspot", "Punto ciego|Blind spot|Angle mort|Ponto cego|Blinder Fleck|Punto cieco||盲点|사각지대|死角|Слепое пятно|Martwe pole", "Un círculo negro tapa donde apuntas.|A black circle hides where you aim.|Un cercle noir cache ta visée.|Um círculo preto esconde onde você mira.|Ein schwarzer Kreis verdeckt dein Ziel.|Un cerchio nero copre dove miri.||一个黑圈遮住了你瞄准的地方。|검은 원이 조준하는 곳을 가립니다.|黒い円が狙っている場所を隠す。|Чёрный круг закрывает место прицела.|Czarne koło zasłania miejsce, w które celujesz.", ["divingmask"]);
  def("mosaic", "map", "ch_mosaic", "Píxeles gordos|Chunky pixels|Gros pixels|Pixels gordos|Grobe Pixel|Pixel giganti||粗大像素|큼직한 픽셀|粗いピクセル|Крупные пиксели|Grube piksele", "El mapa se ve a muy baja resolución.|The map is shown in very low resolution.|La carte est en très basse résolution.|O mapa aparece em baixíssima resolução.|Die Karte hat eine sehr niedrige Auflösung.|La mappa è a bassissima risoluzione.||地图以极低的分辨率显示。|지도가 매우 낮은 해상도로 표시됩니다.|地図がとても低い解像度で表示される。|Карта показана в очень низком разрешении.|Mapa jest w bardzo niskiej rozdzielczości.", ["lens"]);
  def("negative", "map", "ch_negative", "Negativo|Negative|Négatif|Negativo|Negativ|Negativo||负片|네거티브|ネガ|Негатив|Negatyw", "Los colores están invertidos.|The colors are inverted.|Les couleurs sont inversées.|As cores estão invertidas.|Die Farben sind invertiert.|I colori sono invertiti.||颜色被反转了。|색이 반전되어 있습니다.|色が反転している。|Цвета инвертированы.|Kolory są odwrócone.", ["customs"]);
  def("quake", "map", "ch_quake", "Terremoto|Earthquake|Tremblement de terre|Terremoto|Erdbeben|Terremoto||地震|지진|地震|Землетрясение|Trzęsienie ziemi", "El mapa tiembla sin parar.|The map shakes nonstop.|La carte tremble sans cesse.|O mapa treme sem parar.|Die Karte bebt ununterbrochen.|La mappa trema senza sosta.||地图不停地晃动。|지도가 쉬지 않고 흔들립니다.|地図が絶え間なく揺れる。|Карта трясётся без остановки.|Mapa trzęsie się bez przerwy.", ["shockabsorber"]);
  def("drift", "map", "ch_drift", "Deriva|Drift|Dérive|Deriva|Abdrift|Deriva||漂移|표류|漂流|Дрейф|Dryf", "El mapa se desliza solo.|The map slides on its own.|La carte glisse toute seule.|O mapa desliza sozinho.|Die Karte gleitet von allein.|La mappa scivola da sola.||地图会自己滑动。|지도가 저절로 미끄러집니다.|地図がひとりでに滑っていく。|Карта сама сползает.|Mapa sama się przesuwa.", ["shockabsorber"]);
  def("decoys", "map", "ch_decoys", "Chinchetas trampa|Decoy pins|Épingles leurres|Pinos falsos|Lockvogel-Pins|Pin esca|Chinches trampa|诱饵图钉|가짜 핀|おとりピン|Ложные булавки|Fałszywe pinezki", "Falsas chinchetas confunden el mapa.|Fake pins clutter the map.|De fausses épingles brouillent la carte.|Pinos falsos confundem o mapa.|Falsche Pins verwirren die Karte.|Pin falsi confondono la mappa.|Chinches falsas confunden el mapa.|假图钉让地图杂乱不堪。|가짜 핀들이 지도를 어지럽힙니다.|偽のピンが地図を埋め尽くす。|Фальшивые булавки загромождают карту.|Fałszywe pinezki zaśmiecają mapę.", ["customs"]);
  def("lightning", "map", "ch_lightning", "Rayos|Lightning|Éclairs|Raios|Blitze|Fulmini||闪电|번개|稲妻|Молния|Błyskawica", "Destellos que ciegan un instante.|Flashes that blind for an instant.|Des éclairs qui aveuglent un instant.|Clarões que cegam por um instante.|Blitze, die kurz blenden.|Lampi che accecano per un istante.||让人瞬间目眩的闪光。|순간적으로 눈을 멀게 하는 섬광.|一瞬目がくらむ閃光。|Вспышки, ослепляющие на мгновение.|Błyski, które na chwilę oślepiają.", ["umbrella"]);
  /* --- puntero --- */
  def("tremble", "ptr", "ch_tremble", "Pulso tembloroso|Shaky hand|Main tremblante|Mão trêmula|Zittrige Hand|Mano tremante||手抖|떨리는 손|震える手|Дрожащая рука|Drżąca ręka", "Tu puntero tiembla, y el clic también.|Your pointer shakes, and so does your click.|Ton pointeur tremble, et ton clic aussi.|Seu ponteiro treme, e o clique também.|Dein Zeiger zittert, und dein Klick auch.|Il puntatore trema, e anche il clic.||你的指针在抖，点击也跟着抖。|포인터가 떨리고, 클릭도 흔들립니다.|ポインターが震え、クリックもぶれる。|Курсор дрожит, а вместе с ним и клик.|Kursor drży, a razem z nim twoje kliknięcie.", ["steadyhand"]);
  def("blink", "ptr", "ch_blink", "Cursor parpadeante|Blinking cursor|Curseur clignotant|Cursor piscante|Blinkender Zeiger|Cursore lampeggiante||闪烁的光标|깜빡이는 커서|点滅するカーソル|Мигающий курсор|Migający kursor", "El puntero parpadea y se apaga a ratos.|The pointer blinks on and off.|Le pointeur clignote.|O ponteiro pisca e apaga.|Der Zeiger blinkt.|Il puntatore lampeggia.||指针时隐时现。|포인터가 깜빡입니다.|ポインターが点いたり消えたりする。|Курсор то появляется, то пропадает.|Kursor miga.", ["gamer"]);
  def("ghost", "ptr", "ch_ghost", "Cursor fantasma|Ghost cursor|Curseur fantôme|Cursor fantasma|Geisterzeiger|Cursore fantasma||幽灵光标|유령 커서|幽霊カーソル|Курсор-призрак|Kursor widmo", "El puntero desaparece unos segundos.|The pointer vanishes for a few seconds.|Le pointeur disparaît quelques secondes.|O ponteiro some por alguns segundos.|Der Zeiger verschwindet für einige Sekunden.|Il puntatore sparisce per qualche secondo.||指针会消失几秒钟。|포인터가 몇 초 동안 사라집니다.|ポインターが数秒間消える。|Курсор исчезает на несколько секунд.|Kursor znika na kilka sekund.", ["spareeye"]);
  def("cblur", "ptr", "ch_cblur", "Cursor borroso|Blurry cursor|Curseur flou|Cursor borrado|Verschwommener Zeiger|Cursore sfocato||模糊的光标|흐릿한 커서|ぼやけたカーソル|Размытый курсор|Rozmyty kursor", "El puntero se ve desenfocado.|The pointer looks out of focus.|Le pointeur est flou.|O ponteiro fica desfocado.|Der Zeiger ist unscharf.|Il puntatore è sfocato.||指针看起来失焦了。|포인터가 초점이 맞지 않아 보입니다.|ポインターのピントがずれている。|Курсор выглядит размытым.|Kursor jest nieostry.", ["divingmask"]);
  def("lag", "ptr", "ch_lag", "Cursor con retraso|Laggy cursor|Curseur en retard|Cursor com atraso|Verzögerter Zeiger|Cursore in ritardo||延迟的光标|느린 커서|遅れるカーソル|Запаздывающий курсор|Spóźniony kursor", "El puntero va con retraso.|The pointer lags behind.|Le pointeur est en retard.|O ponteiro anda atrasado.|Der Zeiger hinkt hinterher.|Il puntatore è in ritardo.||指针跟不上你的动作。|포인터가 뒤처집니다.|ポインターが遅れてついてくる。|Курсор отстаёт.|Kursor nie nadąża.", ["gamer"]);
  def("cmirror", "ptr", "ch_cmirror", "Controles invertidos|Reversed controls|Commandes inversées|Controles invertidos|Umgekehrte Steuerung|Comandi invertiti||反向操作|반전된 조작|逆操作|Обратное управление|Odwrócone sterowanie", "El puntero se mueve al revés.|The pointer moves the opposite way.|Le pointeur bouge à l'envers.|O ponteiro se move ao contrário.|Der Zeiger bewegt sich verkehrt herum.|Il puntatore si muove al contrario.||指针朝相反方向移动。|포인터가 반대 방향으로 움직입니다.|ポインターが逆方向に動く。|Курсор движется в обратную сторону.|Kursor porusza się w przeciwną stronę.", ["handmirror"]);
  def("dizzy", "ptr", "ch_dizzy", "Mareo|Dizzy|Vertige|Tontura|Schwindel|Capogiro||眩晕|어지러움|めまい|Головокружение|Zawrót głowy", "El puntero da vueltas a tu alrededor.|The pointer circles around you.|Le pointeur tourne autour de toi.|O ponteiro gira ao seu redor.|Der Zeiger kreist um dich.|Il puntatore ti gira intorno.||指针绕着你打转。|포인터가 빙글빙글 돕니다.|ポインターがぐるぐる回る。|Курсор кружит вокруг тебя.|Kursor krąży wokół ciebie.", ["steadyhand"]);
  /* --- reglas --- */
  def("wind", "rule", "wind", "Vendaval|Gale|Rafale|Vendaval|Sturm|Bufera||狂风|질풍|疾風|Шквал|Wichura", "El viento desvía tu pin.|The wind pushes your pin.|Le vent dévie ton épingle.|O vento desvia seu pino.|Der Wind lenkt deinen Pin ab.|Il vento sposta il tuo pin.||风会推动你的图钉。|바람이 핀을 밀어냅니다.|風がピンを押し流す。|Ветер сдувает твою булавку.|Wiatr spycha twoją pinezkę.", ["weathervane"]);
  def("storm", "rule", "storm", "Tormenta|Storm|Tempête|Tempestade|Gewitter|Tempesta||风暴|폭풍|嵐|Буря|Burza", "Solo tienes el 55 % del tiempo.|You only get 55% of the time.|Tu n'as que 55 % du temps.|Você só tem 55% do tempo.|Du hast nur 55 % der Zeit.|Hai solo il 55% del tempo.||你只有 55% 的时间。|시간의 55%만 주어집니다.|時間は55%しか与えられない。|У тебя есть только 55% времени.|Masz tylko 55% czasu.", ["earplugs"]);
  def("silence", "rule", "silence", "Silencio|Silence|Silence|Silêncio|Stille|Silenzio||沉默|침묵|静寂|Тишина|Cisza", "Tus herramientas no funcionan.|Your tools don't work.|Tes outils ne marchent pas.|Suas ferramentas não funcionam.|Deine Werkzeuge funktionieren nicht.|I tuoi strumenti non funzionano.||你的工具无法使用。|도구를 사용할 수 없습니다.|道具が使えない。|Твои инструменты не работают.|Twoje narzędzia nie działają.", ["earplugs"]);
  /* --- cuarta pared: el crupier sale del juego y se mete en TU pantalla (v0.33) --- */
  def("crack", "wall", "ch_crack", "Cristal roto|Cracked screen|Écran fissuré|Tela rachada|Gesprungener Bildschirm|Schermo incrinato||屏幕碎裂|깨진 화면|割れた画面|Треснувший экран|Pęknięty ekran", "El crupier golpea tu pantalla: las grietas tapan parte del mapa.|The dealer punches your screen: the cracks cover part of the map.|Le croupier frappe ton écran : les fissures cachent une partie de la carte.|O crupiê soca a sua tela: as rachaduras cobrem parte do mapa.|Der Croupier schlägt auf deinen Bildschirm: Die Risse verdecken einen Teil der Karte.|Il croupier colpisce il tuo schermo: le crepe coprono parte della mappa.||荷官一拳砸在你的屏幕上：裂痕遮住了部分地图。|딜러가 화면을 내리칩니다: 금이 간 부분이 지도를 가립니다.|ディーラーが画面を殴りつける：ひびが地図の一部を隠す。|Крупье бьёт по твоему экрану: трещины закрывают часть карты.|Krupier uderza w twój ekran: pęknięcia zasłaniają część mapy.", ["protector"]);
  def("smudge", "wall", "ch_smudge", "Pantalla sucia|Greasy screen|Écran gras|Tela engordurada|Fettiger Bildschirm|Schermo unto||油腻的屏幕|기름 묻은 화면|脂っぽい画面|Жирный экран|Tłusty ekran", "Huellas de dedos grasientos emborronan zonas del mapa.|Greasy fingerprints smear parts of the map.|Des traces de doigts gras brouillent des zones de la carte.|Marcas de dedos engordurados borram partes do mapa.|Fettige Fingerabdrücke verschmieren Teile der Karte.|Impronte di dita unte offuscano zone della mappa.||油腻的指纹把地图的部分区域弄模糊了。|기름진 지문이 지도 일부를 번지게 합니다.|脂ぎった指紋が地図のあちこちをにじませる。|Жирные отпечатки пальцев размазывают части карты.|Tłuste odciski palców rozmazują fragmenty mapy.", ["protector", "divingmask"]);
  def("hang", "wall", "ch_hang", "No responde|Not responding|Ne répond pas|Não está respondendo|Reagiert nicht|Non risponde||无响应|응답 없음|応答なし|Не отвечает|Nie odpowiada", "Ventanas de error falsas tapan el mapa: ciérralas para seguir.|Fake error windows cover the map: close them to carry on.|De fausses fenêtres d'erreur cachent la carte : ferme-les pour continuer.|Janelas de erro falsas cobrem o mapa: feche-as para continuar.|Falsche Fehlerfenster verdecken die Karte: Schließ sie, um weiterzumachen.|Finte finestre di errore coprono la mappa: chiudile per continuare.||虚假的错误窗口挡住了地图：关掉它们才能继续。|가짜 오류 창이 지도를 가립니다: 닫아야 계속할 수 있습니다.|偽のエラーウィンドウが地図を隠す：閉じて先へ進もう。|Фальшивые окна ошибок закрывают карту: закрой их, чтобы продолжить.|Fałszywe okna błędów zasłaniają mapę: zamknij je, by grać dalej.", ["taskmgr"]);
  def("battery", "wall", "ch_battery", "Batería baja|Low battery|Batterie faible|Bateria fraca|Akku schwach|Batteria scarica||电量不足|배터리 부족|バッテリー残量低下|Низкий заряд|Słaba bateria", "Tu pantalla se va apagando mientras piensas.|Your screen keeps dimming while you think.|Ton écran s'assombrit pendant que tu réfléchis.|Sua tela vai escurecendo enquanto você pensa.|Dein Bildschirm wird dunkler, während du nachdenkst.|Il tuo schermo si scurisce mentre pensi.||你思考的时候，屏幕越来越暗。|생각하는 동안 화면이 점점 어두워집니다.|考えている間に画面がどんどん暗くなる。|Пока ты думаешь, экран становится всё темнее.|Ekran ciemnieje, gdy się zastanawiasz.", ["powerbank"]);
  /* --- banderas (solo en la ronda de banderas) --- */
  def("flaginvert", "flag", "ch_negative", "Colores invertidos|Inverted colors|Couleurs inversées|Cores invertidas|Invertierte Farben|Colori invertiti||反色|색 반전|色反転|Инвертированные цвета|Odwrócone kolory", "La bandera se ve en negativo.|The flag looks like a photo negative.|Le drapeau apparaît en négatif.|A bandeira aparece em negativo.|Die Flagge erscheint als Negativ.|La bandiera appare in negativo.||国旗看起来像照片底片。|국기가 사진 필름처럼 보입니다.|国旗が写真のネガのように見える。|Флаг выглядит как фотонегатив.|Flaga wygląda jak negatyw zdjęcia.", ["customs"]);
  def("flaghue", "flag", "ch_mosaic", "Luces de neón|Neon lights|Néons|Luzes neon|Neonlicht|Luci al neon||霓虹灯|네온 조명|ネオンライト|Неоновые огни|Neony", "Las luces del casino cambian los colores de la bandera.|The casino lights shift the flag's colors.|Les néons du casino changent les couleurs du drapeau.|As luzes do cassino mudam as cores da bandeira.|Die Casino-Lichter verändern die Farben der Flagge.|Le luci del casinò cambiano i colori della bandiera.||赌场的灯光改变了国旗的颜色。|카지노 조명이 국기의 색을 바꿉니다.|カジノの照明が国旗の色を変えてしまう。|Огни казино искажают цвета флага.|Światła kasyna zmieniają kolory flagi.", ["lens"]);
  def("flagblur", "flag", "ch_blur", "Bandera borrosa|Blurry flag|Drapeau flou|Bandeira desfocada|Unscharfe Flagge|Bandiera sfocata||模糊的国旗|흐릿한 국기|ぼやけた国旗|Размытый флаг|Rozmyta flaga", "La bandera está desenfocada.|The flag is out of focus.|Le drapeau est flou.|A bandeira está desfocada.|Die Flagge ist unscharf.|La bandiera è sfocata.||国旗失焦了。|국기의 초점이 맞지 않습니다.|国旗のピントが合っていない。|Флаг не в фокусе.|Flaga jest nieostra.", ["divingmask"]);
  def("flagdark", "flag", "ch_dark", "Bandera a oscuras|Flag in the dark|Drapeau dans le noir|Bandeira no escuro|Flagge im Dunkeln|Bandiera al buio||黑暗中的国旗|어둠 속의 국기|暗闇の国旗|Флаг в темноте|Flaga w ciemności", "La bandera casi no se distingue en la penumbra.|The flag is barely visible in the dim light.|Le drapeau se distingue à peine dans la pénombre.|A bandeira quase não se distingue na penumbra.|Die Flagge ist im Dämmerlicht kaum zu erkennen.|La bandiera si distingue a malapena nella penombra.||昏暗中几乎看不清国旗。|어두운 조명 속에서 국기가 거의 보이지 않습니다.|薄明かりの中で国旗がほとんど見えない。|В тусклом свете флаг едва виден.|W półmroku flagę ledwo widać.", ["miner"]);
  def("flaggray", "flag", "ch_missing", "Sin colores|No colors|Sans couleurs|Sem cores|Ohne Farben|Senza colori||没有颜色|색 없음|色なし|Без цвета|Bez kolorów", "La bandera se ve en blanco y negro.|The flag shows in black and white.|Le drapeau apparaît en noir et blanc.|A bandeira aparece em preto e branco.|Die Flagge ist schwarz-weiß.|La bandiera appare in bianco e nero.||国旗以黑白显示。|국기가 흑백으로 표시됩니다.|国旗が白黒で表示される。|Флаг показан в чёрно-белом цвете.|Flaga jest czarno-biała.", ["lens"]);
  A.CHAL = D;

  const KIND = k => Object.keys(D).filter(id => D[id].kind === k);
  const TEXT = KIND("text"), MAPC = KIND("map"), PTR = KIND("ptr"), RULE = KIND("rule"), FLAG = KIND("flag"), WALL = KIND("wall");
  /* v0.29: "Continentes barajados" ocupa en el sorteo el sitio exacto del antiguo "Continentes cambiados" (tras Pangea): cada semilla vuelve a sacar
     los retos de siempre y donde salia aquel sale este (entre la v0.23 y la v0.28 esas rondas sorteaban otro) */
  const MAPD = [...MAPC, ...WALL];
  /* en una misma ronda no se juntan retos "de la misma familia" */
  const FAMILY = { wrongborders: "b", noborders: "b", pangea: "p", deal: "p", spread: "p", tilt: "p", flip: "o", mirrorx: "o", spin: "o", blur: "v", dark: "v", myopia: "v", blindspot: "v", clouds: "v", rain: "v", mosaic: "v", flicker: "l", lightning: "l", quake: "m", drift: "m", decoys: "d", negative: "n", crack: "w", smudge: "w", hang: "w", battery: "w" };
  const famOf = id => FAMILY[id] || (D[id].kind === "text" ? "t" : D[id].kind === "ptr" ? "c" : id);
  const NOLATIN = () => /^(zh|ja|ko)/.test(A.lang || "");                     // runas y sin vocales no tienen sentido con nombres en chino, japones o coreano
  const MILD_TEXT = ["shaky", "missing", "swap", "upside", "babel", "dance"], MILD_MAP = ["blur", "dark", "noborders", "clouds", "mirrorx", "negative", "rain"];
  const BOSS = [
    [["El Apagón|The Blackout|La panne|O Apagão|Der Stromausfall|Il Blackout||大停电|대정전|大停電|Великое затмение|Wielka ciemność", ["dark", "flicker"]], ["Ronda ciega|Blind round|Manche aveugle|Rodada cega|Blinde Runde|Round cieco||盲眼回合|블라인드 라운드|ブラインドラウンド|Слепой раунд|Runda na ślepo", ["blur", "missing"]], ["Un solo continente|One continent|Un seul continent|Um só continente|Ein Kontinent|Un solo continente||一块大陆|하나의 대륙|ひとつの大陸|Один континент|Jeden kontynent", ["pangea", "swap"]], ["Mareo de casino|Casino dizziness|Vertige de casino|Tontura de cassino|Casino-Schwindel|Capogiro da casinò||赌场眩晕|카지노 현기증|カジノのめまい|Казино-головокружение|Kasynowy zawrót głowy", ["dizzy", "shaky"]]],
    [["Falsa alarma|False alarm|Fausse alerte|Falso alarme|Fehlalarm|Falso allarme||虚惊一场|거짓 경보|誤報|Ложная тревога|Fałszywy alarm", ["spread", "wrongborders"]], ["Sin pasaporte|No passport|Sans passeport|Sem passaporte|Ohne Pass|Senza passaporto||没有护照|여권 없음|パスポートなし|Без паспорта|Bez paszportu", ["nocountry", "blur"]], ["Mala visión|Bad eyesight|Mauvaise vue|Vista turva|Schlechte Sicht|Vista offuscata||视力不佳|나쁜 시력|視力低下|Плохое зрение|Słaby wzrok", ["flip", "anagram"]], ["Noche cerrada|Dead of night|Nuit noire|Noite fechada|Tiefste Nacht|Notte fonda||深夜|한밤중|真夜中|Глухая ночь|Głucha noc", ["dark", "shaky", "wind"]], ["Terremoto en la sala|Quake in the hall|Séisme dans la salle|Terremoto no salão|Beben im Saal|Terremoto in sala||大厅地震|홀의 지진|ホールの地震|Землетрясение в зале|Trzęsienie na sali", ["quake", "decoys"]], ["Rompe la cuarta pared|Breaking the fourth wall|Briser le quatrième mur|Quebrando a quarta parede|Die vierte Wand durchbrechen|Rompere la quarta parete||打破第四面墙|제4의 벽 깨기|第四の壁を破れ|Ломая четвёртую стену|Przełamując czwartą ścianę", ["crack", "hang"]]],
    [["El gran espejo|The great mirror|Le grand miroir|O grande espelho|Der große Spiegel|Il grande specchio||巨镜|거대한 거울|大いなる鏡|Великое зеркало|Wielkie lustro", ["flip", "cmirror", "blur"]], ["Baraja revuelta|Shuffled deck|Jeu mélangé|Baralho embaralhado|Gemischtes Deck|Mazzo mescolato||洗乱的牌组|섞인 덱|シャッフルされたデッキ|Перетасованная колода|Potasowana talia", ["deal", "dark", "missing"]], ["Todo o nada|All or nothing|Quitte ou double|Tudo ou nada|Alles oder nichts|Tutto o niente||孤注一掷|모 아니면 도|オール・オア・ナッシング|Всё или ничего|Wszystko albo nic", ["wrongborders", "flicker", "storm"]], ["Tormenta perfecta|Perfect storm|Tempête parfaite|Tempestade perfeita|Perfekter Sturm|Tempesta perfetta||完美风暴|퍼펙트 스톰|パーフェクト・ストーム|Идеальный шторм|Sztorm doskonały", ["lightning", "rain", "tremble"]], ["Torre de Babel|Tower of Babel|Tour de Babel|Torre de Babel|Turmbau zu Babel|Torre di Babele||巴别塔|바벨탑|バベルの塔|Вавилонская башня|Wieża Babel", ["babel", "runes", "mosaic"]], ["Pantallazo|System crash|Plantage total|Pane geral|Systemabsturz|Crash di sistema||系统崩溃|시스템 다운|システムクラッシュ|Системный сбой|Awaria systemu", ["battery", "hang", "flicker"]]],
  ].map(a => a.map(c => ({ n: L6(c[0]), ids: c[1] })));
  /* jefe de la ronda de banderas: la bandera trae su propio filtro y el mapa se lía por su cuenta */
  const FLAG_BOSS = [["Bandera en la niebla|Flag in the fog|Drapeau dans le brouillard|Bandeira na neblina|Flagge im Nebel|Bandiera nella nebbia||雾中的国旗|안개 속의 국기|霧の中の国旗|Флаг в тумане|Flaga we mgle", ["flagdark", "clouds"]], ["Bandera al revés del mundo|Upside-down world flag|Drapeau à l'envers du monde|Bandeira do mundo ao contrário|Flagge der verkehrten Welt|Bandiera del mondo capovolto||颠倒世界的国旗|뒤집힌 세계의 국기|逆さま世界の国旗|Флаг перевёрнутого мира|Flaga świata do góry nogami", ["flaginvert", "flip"]], ["Neón de fronteras falsas|Neon false borders|Néons aux fausses frontières|Neon de fronteiras falsas|Neon an falschen Grenzen|Neon a confini falsi||霓虹假边界|네온 가짜 국경|ネオンの偽国境|Неоновые ложные границы|Neonowe fałszywe granice", ["flaghue", "wrongborders"]], ["Bandera pixelada|Pixelated flag|Drapeau pixelisé|Bandeira pixelada|Verpixelte Flagge|Bandiera pixelata||像素化的国旗|픽셀화된 국기|ピクセル化した国旗|Пиксельный флаг|Spikselowana flaga", ["flagblur", "mosaic"]]].map(c => ({ n: L6(c[0]), ids: c[1] }));
  const ACT1 = [["text", "map"], ["ptr", "map"], ["text", "ptr"]], ACT2 = [["text", "map", "ptr"], ["map", "ptr", "rule"], ["text", "map", "map"]];

  /* ------------------------------------------------------------------ plan (determinista por semilla y ronda) */
  const pickFrom = (seed, tag, list, r, avoid) => { const ok = list.filter(id => !avoid.includes(famOf(id))), l = ok.length ? ok : list; return A.rng(`${seed}:${tag}:${Math.floor(r / 4)}:${r % 4}`).pick(l); };
  A.chal = {
    DEFS: D, TEXT, MAPC, PTR, RULE, FLAG, WALL, noLatin: NOLATIN,
    /* cjk: sin runas ni sin vocales. v0.4.1: la expedicion lo fija al empezar (run.cjk); con el idioma de cada momento, cambiarlo a media
       expedicion cambiaba el truco de texto de la ronda y el soborno ya pagado dejaba de coincidir con nada */
    plan(seed, r, asc = 0, topic, cjk = NOLATIN()) {
      const flagRound = topic === "flag";
      const act = Math.floor(r / 4), pos = r % 4, boss = pos === 3, a = Math.min(act, 2);
      const lv = clamp(a + 1 + (asc >= 3 ? 1 : 0), 1, 3);
      let list = [], combo = null;
      /* trucos que en esta ronda no harian nada (texto en la de banderas, Sin pais o Adivinanza sin pais ni nota debajo, runas y sin vocales en zh/ja/ko):
         si el sorteo cae en uno, se sortea otro. Lo que ya salia bien no cambia (partidas guardadas y sobornos intactos) */
      const useless = id => (flagRound && !!D[id] && D[id].kind === "text") || ((topic === "country" || topic === "clue") && id === "nocountry") || (topic === "clue" && id === "riddle");
      const noop = id => useless(id) || (cjk && (id === "runes" || id === "novowels"));
      if (boss) {
        /* v0.7.1: el jefe de una ronda de banderas (la 8 de la Aventura) ya no es siempre de banderas: la semilla sortea entre los de banderas y los
           del acto que sirven en esa ronda (sin trucos de texto: la bandera manda), cada combinacion con la misma probabilidad. Los jefes que no
           cambian de ronda salen igual que antes (misma semilla y misma lista), y si sale uno de banderas es el mismo de siempre */
        const normal = BOSS[a].filter(c => !c.ids.some(useless)), rb = A.rng(`${seed}:boss:${act}`);
        if (flagRound) combo = normal.length && A.rng(`${seed}:bossmix:${act}`)() < normal.length / (FLAG_BOSS.length + normal.length) ? rb.pick(normal) : rb.pick(FLAG_BOSS);
        else combo = rb.pick(normal.length ? normal : BOSS[a]);
        list = combo.ids.map((id, i) => ({ id, lv: clamp(lv + (i === 0 ? 1 : 0), 1, 3) }));
        if (act >= 3) { const rr = A.rng(`${seed}:legend:${r}`), all = rr.shuffle([...TEXT, ...MAPD, ...PTR, ...RULE]); combo = { n: L6("La apuesta final|The final bet|La mise finale|A aposta final|Der letzte Einsatz|La puntata finale||最后的赌注|마지막 베팅|最後の賭け|Последняя ставка|Ostatni zakład"), ids: [] }; list = []; const fam = new Set(); for (const id of all) { const f = famOf(id); if (fam.has(f)) continue; fam.add(f); list.push({ id, lv: 3 }); combo.ids.push(id); if (list.length === 4) break; } }
        if (asc >= 4 && act < 3) {                                                  // Ascension 4: el jefe trae un poder extra de otra familia
          const fam = new Set(list.map(x => famOf(x.id))), pool = [...TEXT, ...MAPD, ...PTR].filter(id => !fam.has(famOf(id)));
          if (pool.length) { const rb = A.rng(`${seed}:boss2:${act}`); let id = rb.pick(pool); if (noop(id)) { const ok = pool.filter(x => !noop(x)); if (ok.length) id = rb.pick(ok); } list.push({ id, lv }); }
        }
        return { list, boss, combo };
      }
      const used = [];
      /* v0.35: el Apagon sale si o si en algun momento de la expedicion (asi el Foco del vigilante siempre tiene su momento): en una ronda
         con hueco de mapa elegida por la semilla. Si esa ronda se baraja en el Campamento, el crupier elige otra cosa (el jugador pago por ello) */
      let dark = r === A.rng(`${seed}:dark`).pick([2, 4, 5, 8, 9, 10]);
      const add = (cat, mild) => { const pool = cat === "text" ? (flagRound ? FLAG : (mild ? MILD_TEXT : TEXT).filter(id => !(cjk && (id === "runes" || id === "novowels")))) : cat === "ptr" ? PTR : cat === "rule" ? RULE : (mild ? MILD_MAP : MAPD); let id = pickFrom(seed, cat + list.length, pool, r, used); if (noop(id)) { const ok = pool.filter(x => !noop(x)); if (ok.length) id = pickFrom(seed, cat + list.length + "b", ok, r, used); } if (cat === "map" && dark && !used.includes(famOf("dark"))) { id = "dark"; dark = false; } list.push({ id, lv: mild ? 1 : lv }); used.push(famOf(id)); };
      if (act === 0) { if (pos === 1) add("text", true); else if (pos === 2) add("map", true); }
      else if (act === 1) ACT1[pos % 3].forEach(c => add(c, false));
      else ACT2[pos % 3].forEach(c => add(c, false));
      if (asc >= 2 && act >= 1) add("rule", false);
      return { list, boss, combo };
    },
    info: id => D[id],
    /* v0.35: la ficha ya no dice que perk frena el reto (ni brilla por ello): el jugador tiene que leer y atar cabos */
    chip(c, small) { const d = D[c.id]; if (!d) return ""; return `<span class="ch-chip k-${d.kind}${small ? " sm" : ""}" data-ch="${c.id}" data-tt="${(A.tx(d.n) + " — " + A.tx(d.d)).replace(/"/g, "&quot;")}">${A.icon(d.ico, "sm")}<b>${A.tx(d.n)}</b><i class="ch-lv">${"●".repeat(c.lv || 1)}</i></span>`; },
  };

  /* ------------------------------------------------------------------ mitigaciones (suma de los `fx` de las reliquias) */
  A.chal.fx = perks => {
    const fx = { shakeMul: 1, textMul: 1, colorMul: 1, blurMul: 1, plateMul: 1, blackoutMul: 1, cloudMul: 1, focusMul: 1, lagMul: 1, quakeMul: 1, mosaicMul: 1, rainMul: 1, ghostMul: 1, darkR: 1, darkDim: 0, lensR: 0, trueR: 0, peekR: 0, missingRate: 0, unswapMs: 0, decodeMs: 0, riddleMs: 0, unmirror: false, keepName: false, halo: false, flickerWarn: false, windPreview: false, windMul: 1, coords: false, guides: false, mag: false, country: false, thermo: false, beacon: false, noBabel: false, noMarquee: false, noNegative: false, noFlash: false, trapGhost: false, cloudClear: 0, glassMul: 1, hangAuto: 0, ids: perks.map(p => p.id) };
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
    case "shaky": return { amp: [2.2, 3.6, 5.4][i] * Math.max(0.1, fx.shakeMul * fx.textMul) * h };            // Mano de crupier: 75 % menos de verdad (antes el suelo 0,35 lo dejaba en 65 %)
    case "dance": return { amp: [0.16, 0.26, 0.38][i] * Math.max(0.1, fx.shakeMul * fx.textMul) * h };
    case "missing": return { frac: [0.34, 0.5, 0.65][i] * fx.textMul * h };
    case "swap": return { pairs: [1, 2, 3][i] * fx.textMul * h };                                       // con decimales: la Visera deja media pareja de media (antes redondeaba 0,5 a 1 y en nivel 1 no hacia nada)
    case "runes": return { frac: [0.4, 0.6, 0.85][i] * fx.textMul * h };
    case "memory": return { ms: [2600, 1800, 1200][i] / Math.max(0.3, fx.textMul * h) };
    case "blur": return { px: [4.5, 7, 10][i] * fx.blurMul * h };
    case "dark": return { r: [230, 170, 120][i] * fx.darkR / Math.max(0.5, h), a: [0.975, 0.988, 0.997][i] * (1 - fx.darkDim) };
    case "flicker": return { iv: [[5.5, 8.5], [3.8, 6], [2.5, 4.2]][i], len: [250, 450, 700][i] * fx.blackoutMul * h };
    case "lightning": return { iv: [[4.5, 7], [3.2, 5.2], [2.2, 4]][i] };
    case "wrongborders": return { amp: [0.014, 0.024, 0.038][i] * h };
    case "pangea": return { k: [0.9, 0.95, 1][i] * fx.plateMul * h };
    case "deal": return { k: [0.6, 0.85, 1][i] * fx.plateMul * h };                      // < 0,7: una pareja; < 0,95: cuatro; si no, los seis en la mesa (el Nivel de crupier deja una pareja)
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
    case "tremble": return { px: [7, 13, 21][i] * fx.shakeMul * h };
    case "blink": return { period: [0.55, 0.42, 0.3][i], duty: 0.45 };
    case "ghost": return { every: [5.5, 4.2, 3.2][i], off: [0.9, 1.4, 2.0][i] * fx.ghostMul };
    case "cblur": return { px: [3, 5, 8][i] * fx.blurMul * h };
    case "lag": return { tau: [140, 240, 380][i] * fx.lagMul * h };
    case "cmirror": return { both: c.lv >= 3 };
    case "dizzy": return { r: [14, 22, 32][i] * fx.shakeMul * h };
    case "flaghue": return { deg: [70, 130, 200][i] * fx.colorMul };                    // Lupa del tasador: el neon apenas cambia los colores
    case "flagblur": return { px: [3, 6, 10][i] * fx.blurMul * h };
    case "flagdark": return { b: 1 - (1 - [0.55, 0.35, 0.18][i]) * (fx.darkR > 1 ? 0.35 : 1) };   // el Foco del vigilante alumbra la bandera
    case "flaggray": return { amt: [0.6, 0.85, 1][i] * fx.colorMul };                   // Lupa del tasador: casi todo el color vuelve
    case "crack": return { n: Math.max(1, Math.round([1, 2, 3][i] * h)) };
    case "smudge": return { n: Math.max(1, Math.round([2, 3, 5][i] * h)), px: [3, 4.5, 6][i] * fx.blurMul * h };
    case "hang": return { n: Math.max(1, Math.round([1, 2, 3][i] * h)) };
    case "battery": return { dim: Math.min(0.85, [0.55, 0.68, 0.8][i] * h) };
    default: return {};
  } };
  const has = id => S.list.some(c => c.id === id);
  const get = id => S.list.find(c => c.id === id);
  const kindOn = k => S.list.filter(c => D[c.id].kind === k);

  /* capas del mapa (DOM/CSS con mascaras que siguen al puntero) */
  function ensureOverlay(map) {
    if (S.ov && S.ov.isConnected) return S.ov;
    const ov = document.createElement("div"); ov.id = "chOv";
    ov.innerHTML = `<div class="ch-blur"></div><div class="ch-myopia2"></div><div class="ch-myopia"></div><div class="ch-dark"></div><div class="ch-halo"></div><div class="ch-spot"></div><canvas class="ch-clouds" width="256" height="144"></canvas><div class="ch-flash"></div><div class="ch-flick"></div>`;
    (map && map.fx ? map.fx : $("map")).after(ov); S.ov = ov; if (A.chfx) A.chfx.attach(ov); return ov;
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

  A.chal.pointer = (x, y) => {                                        // solo si cambia, y solo dentro de #chOv (no fuerza recalcular estilos de toda la app)
    const ov = $("chOv"); if (S.px.x === x && S.px.y === y && (!ov || ov._pxSet)) return;
    S.px.x = x; S.px.y = y; if (!ov) return; ov._pxSet = true; ov.style.setProperty("--px", x + "px"); ov.style.setProperty("--py", y + "px");
  };

  /* ------------------------------------------------------------------ texto del nombre */
  const isLetter = ch => /\p{L}/u.test(ch);
  /* runas: parecidos que SI existen en las fuentes del juego (Latin-1 de Jersey 15 y cirilico de Pixelify Sans): antes eran letras
     griegas que caian a otra tipografia y delataban cuales estaban cambiadas. Con nombres en ruso, el truco va al reves (cirilico -> latin) */
  const LOOK = { a: "д", b: "б", c: "¢", d: "ð", e: "є", h: "ћ", i: "ї", k: "ќ", m: "м", n: "п", o: "ø", p: "þ", r: "г", s: "§", t: "т", u: "µ", w: "ш", x: "×", y: "ў" };
  const LOOK_UP = { A: "Д", B: "ß", C: "©", D: "Ð", E: "€", H: "Ћ", I: "Ї", K: "Ќ", L: "£", M: "М", N: "И", O: "Ø", P: "Þ", R: "Я", S: "§", T: "†", U: "Ц", W: "Ш", X: "Ж", Y: "¥" };
  const LOOK_RU = { а: "a", б: "6", в: "ß", г: "r", д: "ð", е: "є", ж: "×", з: "3", и: "u", к: "ќ", м: "m", н: "h", о: "ø", п: "n", р: "þ", с: "¢", т: "†", у: "ў", х: "x", ц: "µ", ч: "4", ш: "w", ь: "b", я: "R" };
  const lookOf = ch => LOOK_UP[ch] || LOOK[ch] || (LOOK_RU[ch.toLowerCase()] && (ch !== ch.toLowerCase() ? LOOK_RU[ch.toLowerCase()].toUpperCase() : LOOK_RU[ch]));
  const VOWELS = /[aeiouáéíóúàèìòùâêîôûäëïöüãõåæœAEIOUÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÄËÏÖÜÃÕÅаеёиоуыэюяАЕЁИОУЫЭЮЯ]/;
  function riddleText(o) {
    let t = ""; try { t = (A.tx(o.fact) || (A.factOf && A.factOf(o)) || "").trim(); } catch (e) { t = ""; }
    if (!t || t.length < 12) return null;
    const words = new Set(); [...Object.values(o.name || {})].forEach(n => String(n).split(/[\s,()'’-]+/).forEach(w => { if (w.length >= 3) words.add(w); }));
    for (const w of [...words].sort((a, b) => b.length - a.length)) t = t.replace(new RegExp("(?<![\\p{L}\\p{N}])" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![\\p{L}\\p{N}])", "giu"), m => "▮".repeat([...m].length));   // un hueco por letra, sin recortar el texto
    return t;
  }
  /* el nombre y el pais de debajo sufren los mismos retos de texto (el pais tambien tiembla, se borra, se cambia...) */
  function decorate(o) {
    const el = $("askName"), sub = $("askSub"); if (!el || !o) return; clearText();
    if (o.t === "c" && A.adv && A.adv.isFlagRound && A.adv.isFlagRound()) { if (sub) sub.textContent = ""; if (A.adv.renderFlag) A.adv.renderFlag(o); flagClass(el); return; }   // ronda de banderas: la bandera manda, nunca el texto
    const tx = S.list.filter(c => D[c.id].kind === "text"), nameTxt = A.tx(o.name), subTxt = A.tx(o.sub);
    if (S.suspended || !tx.length) { el.textContent = nameTxt; if (sub) A.renderBlanks(sub, subTxt); return; }
    let alt = null;                                                   // Torre de Babel: los dos textos salen en el mismo otro idioma
    if (has("babel") && !S.fx.noBabel) { const alts = [...new Set([...BABEL_BASE, A.lang])].filter(l => l !== A.lang && l !== A.wlang() && o.name && o.name[l] && o.name[l] !== nameTxt); if (alts.length) alt = alts[Math.floor(A.rng(`${S.seed}:t:${S.q}:${nameTxt}`)() * alts.length)]; }
    deco(el, o, o.name, alt, false);
    if (sub) {
      if (has("nocountry") && subTxt && !o.clue) { sub.innerHTML = '<span class="ch-redact">▮▮▮▮▮▮</span>'; sub.classList.add("ch-nocountry"); }
      else if (subTxt) deco(sub, o, o.sub, alt, true); else sub.textContent = "";
    }
  }
  function deco(el, o, obj, alt, isSub) {
    const fx = S.fx;
    let text = A.tx(obj);
    const rnd = A.rng(`${S.seed}:t${isSub ? "s" : ""}:${S.q}:${text}`);
    let riddle = false;
    if (!isSub && !o.clue && has("riddle")) { const r = riddleText(o); if (r) { text = r; riddle = true; } }
    if (alt && !riddle && obj[alt]) text = obj[alt];
    let chars = [...text]; const orig = chars.slice(), isL = i => isLetter(chars[i] || " ");
    const letters = chars.map((c, i) => (isLetter(c) ? i : -1)).filter(i => i >= 0), fixed = new Set(), hidden = new Set(), dots = new Set(), runes = new Set();
    if (!riddle) {
      const an = get("anagram");
      if (an && letters.length >= 4) {
        let i = 0; while (i < chars.length) { if (!isL(i)) { i++; continue; } let j = i; while (j < chars.length && isL(j)) j++; if (j - i >= 4) { const was = chars.slice(i + 1, j - 1); let mid = rnd.shuffle(was); if (mid.join("") === was.join("") && new Set(mid).size > 1) mid.push(mid.shift()); for (let k = 0; k < mid.length; k++) { chars[i + 1 + k] = mid[k]; fixed.add(i + 1 + k); } } i = j; }
      }
      const sw = get("swap");
      if (sw && letters.length >= 3) { const pk = par(sw).pairs, want = Math.floor(pk) + (pk % 1 && rnd() < pk % 1 ? 1 : 0); let done = 0, tries = 0; while (done < want && tries++ < 20) { const k = letters[Math.floor(rnd() * (letters.length - 1))]; if (isL(k + 1) && chars[k] !== chars[k + 1] && !fixed.has(k)) { [chars[k], chars[k + 1]] = [chars[k + 1], chars[k]]; fixed.add(k); fixed.add(k + 1); done++; } } }
      const rn = get("runes");
      if (rn) { const p = par(rn), pool = letters.filter(i => lookOf(chars[i])); rnd.shuffle(pool).slice(0, Math.max(2, Math.round(letters.length * p.frac))).forEach(i => { chars[i] = lookOf(chars[i]); runes.add(i); }); }
      if (get("novowels")) letters.forEach(i => { if (VOWELS.test(orig[i]) && i > 0) dots.add(i); });
      const ms = get("missing");
      if (ms && letters.length >= 3) { const p = par(ms), n = clamp(Math.round(letters.length * p.frac), 2, Math.max(2, Math.floor(letters.length * 0.7))), pool = rnd.shuffle ? rnd.shuffle(letters.slice()) : letters.slice(); for (const k of pool) { if (hidden.size >= n) break; hidden.add(k); } }
    }
    const sh = get("shaky"), amp = sh ? par(sh).amp : 0, dn = get("dance"), damp = dn ? par(dn).amp : 0, memOn = !!get("memory");
    const parts = chars.map((ch, i) => {
      if (ch === " ") return chars[i - 1] === "▮" && chars[i + 1] === "▮" ? '<i class="wg"></i>' : " ";
      const c = ["lt"]; let glyph = ch; if (ch === "▮") c.push("blk");
      if (hidden.has(i)) c.push("gap", "sv" + Math.floor(rnd() * 3)); else if (dots.has(i)) { c.push("dot"); glyph = "·"; } else if (get("missing") && rnd() < 0.5) c.push("faint");
      if (runes.has(i)) c.push("rune");
      const dur = (0.07 + rnd() * 0.09).toFixed(3), del = (-rnd() * 0.3).toFixed(3), ax = ((rnd() - 0.5) * 2 * amp).toFixed(2), ay = ((rnd() - 0.5) * 2 * amp).toFixed(2), ar = ((rnd() - 0.5) * amp * 1.6).toFixed(2);
      const st = (amp ? `--dur:${dur}s;--del:${del}s;--ax:${ax}px;--ay:${ay}px;--ar:${ar}deg;` : "") + (damp ? `--dy:${(damp * (0.6 + rnd() * 0.8)).toFixed(2)}em;--di:${i};` : "") + (memOn ? `--fd:${(rnd() * 0.6).toFixed(2)}s;` : "");
      return `<b class="${c.join(" ")}" data-i="${i}" data-g="${ch}" style="${st}"${amp ? ' data-sh="1"' : ""}${damp ? ' data-dn="1"' : ""}>${glyph}</b>`;
    });
    let html = "", word = "";                                        // cada palabra en un bloque que no se parte (si no, las letras sueltas saltan de linea)
    parts.forEach(pt => { if (pt === " " || pt.startsWith("<i")) { html += (word ? `<span class="wd">${word}</span>` : "") + pt; word = ""; } else word += pt; });
    el.innerHTML = html + (word ? `<span class="wd">${word}</span>` : "");
    if (amp) el.classList.add("ch-shaky");
    if (damp) el.classList.add("ch-dance");
    if (has("mirror") && !fx.unmirror) el.classList.add("ch-mirror");
    if (has("upside") && !fx.unmirror) el.classList.add("ch-upside");
    if (riddle) { el.classList.add("ch-riddle"); if (text.length > 190) el.classList.add("ch-long"); fitRiddle(el); }
    if (has("scroll") && !fx.noMarquee) { el.innerHTML = `<span class="ch-marq">${el.innerHTML}</span>`; el.classList.add("ch-scroll"); }
    const restore = (b, g) => { b.classList.remove("gap", "dot", "faint", "rune"); b.classList.add("fix"); b.textContent = g; };
    const hid = [...hidden, ...dots];
    if (hid.length && fx.missingRate > 0) hid.forEach((k, j) => later(() => { const b = el.querySelector(`.lt[data-i="${k}"]`); if (b) { restore(b, b.dataset.g); say("chip", 1 + j * 0.2); } }, 900 + (j * 1000) / fx.missingRate));
    const unfix = new Set([...(fx.unswapMs ? fixed : []), ...(fx.decodeMs ? runes : [])]);   // la Chuleta devuelve las cambiadas o mezcladas, no las runas (eso no lo dice su carta)
    if (unfix.size) later(() => { el.querySelectorAll(".lt").forEach(b => { const i = +b.dataset.i; if (unfix.has(i) && b.textContent !== orig[i] && !b.classList.contains("gap")) restore(b, orig[i]); }); say("chip", 2); }, Math.min(fx.unswapMs || 1e9, fx.decodeMs || 1e9));
    if (riddle && fx.riddleMs) later(() => { el.classList.remove("ch-riddle"); el.textContent = A.tx(obj); el.classList.add("fixed"); say("chip", 2); }, fx.riddleMs);
    const mem = get("memory");
    if (mem) later(() => { el.classList.add(fx.keepName ? "ch-dim" : "ch-fade"); }, par(mem).ms);
  }
  /* adivinanza: la pista se encoge hasta caber en la placa (antes una nota larga se salia por debajo del crupier) */
  const fitRiddle = el => requestAnimationFrame(() => { if (!el.classList.contains("ch-riddle")) return; let f = parseFloat(getComputedStyle(el).fontSize) || 16, n = 0; const max = Math.max(96, innerHeight * 0.22); while (el.scrollHeight > max && f > 11 && n++ < 18) { f -= 1; el.style.fontSize = f + "px"; } });
  function clearText() { for (const id of ["askName", "askSub"]) { const el = $(id); if (el) el.style.fontSize = ""; if (el) el.classList.remove("ch-shaky", "ch-mirror", "ch-upside", "ch-fade", "ch-dim", "ch-dance", "ch-riddle", "ch-long", "ch-scroll", "ch-nocountry", "fixed"); } }

  /* ------------------------------------------------------------------ mapa: deformaciones */
  /* la colocacion de continentes (19-76 ms de calculo) sale igual en todas las preguntas de la ronda (misma semilla, mismo reto): se calcula una vez
     y se reutiliza. Antes se repetia al empezar cada pregunta, justo cuando los continentes echan a andar */
  const LAYM = new Map();
  /* lo que tapa el HUD durante la pregunta (px de pantalla: el HUD no escala con la ventana; medido de 1280x720 a 2000x1125, con holgura): marcador,
     barra de la Aventura, puntos, zoom, botones, placa del nivel y herramientas. Fijo (sin leer el DOM): la colocacion se calcula en la intro, con el
     marcador todavia oculto */
  const hudPx = (W, H) => [[0, 0, 450, 245], [0, 0, 395, 400], [W - 245, 0, W, 155], [W - 72, H * 0.46 - 115, W, H * 0.46 + 115], [0, H - 72, 165, H], [W / 2 - 355, H - 92, W / 2 + 355, H], [W / 2 - 180, H - 215, W / 2 + 180, H - 92]];
  /* ori: el giro del mapa (Mundo del reves, Espejo del mapa): el HUD tapa la parte del mapa que queda debajo DESPUES de girarlo */
  const hudZones = (map, ori) => {
    const v = map._clamp({ ...map.home() }), W = map.W, H = map.H, X = px => v.cx + (px - W / 2) / v.s, Y = py => v.cy - (py - H / 2) / v.s;
    const fy = !!(ori && ori.rot), fx = fy !== !!(ori && ori.mx);   // del reves: gira media vuelta (x e y); espejo: solo x; del reves con espejo: solo y
    const rects = hudPx(W, H).map(([a, b, c, d]) => [fx ? W - c : a, fy ? H - d : b, fx ? W - a : c, fy ? H - b : d]);
    return { view: [X(0), Y(H), X(W), Y(0)], rects: rects.map(([a, b, c, d]) => [X(a), Y(d), X(c), Y(b)]), key: [W, H].map(Math.round).join("x") + (fx ? "x" : "") + (fy ? "y" : "") };
  };
  A.chal.hudZones = hudZones;                                          // para dev/maptest.js
  /* las preguntas de la ronda, con el continente con el que se mueve cada una: la mesa de Continentes barajados las deja todas a la vista. Si la Carta de
     cambio trae otra, la mesa se reparte de nuevo para ella (cada pregunta empieza con el reparto, asi que no se nota) */
  let RPTS = { key: null, pts: null };
  const roundPts = map => {
    const list = ((A.core && A.core.S && A.core.S.qs) || []).filter(Boolean), key = S.seed + "|" + S.round + "|" + list.map(q => (q.cid ? q.cid[0] : q.key)).join(","); if (RPTS.key === key) return RPTS.pts;
    const pts = [];
    for (const q of list) {
      if (q.t === "c") { const f = map.world.byName[q.key]; if (!f) continue; const big = f.polys.reduce((a, b) => ((b.bbox[2] - b.bbox[0]) * (b.bbox[3] - b.bbox[1]) > (a.bbox[2] - a.bbox[0]) * (a.bbox[3] - a.bbox[1]) ? b : a)); pts.push([(big.bbox[0] + big.bbox[2]) / 2, (big.bbox[1] + big.bbox[3]) / 2, big.ct]); }
      else if (q.lat != null) pts.push([q.lon, q.lat, map._ctOf(q.lon, q.lat)]);
    }
    RPTS = { key, pts }; pts.key = key; return pts;
  };
  const layoutMemo = (map, key, fn) => { let L = LAYM.get(key); if (!L) { L = fn(); LAYM.set(key, L); if (LAYM.size > 8) LAYM.delete(LAYM.keys().next().value); } return { ...L, shift: L.shift.map(p => p.slice()), scale: L.scale.slice() }; };
  function mapSpec(map, o) {
    const spec = { shift: [0, 1, 2, 3, 4, 5, 6].map(() => [0, 0]), rot: [0, 0, 0, 0, 0, 0, 0], wob: 0, lineA: 1, orient: null, ct: 6 }; let any = false;
    const rr = A.rng(`${S.seed}:m:${S.round}`), fl0 = get("flip");
    const ori = has("mirrorx") && !S.fx.unmirror ? { rot: 0, mx: 1 } : fl0 && !S.fx.unmirror ? { rot: Math.PI, mx: fl0.lv >= 3 ? 1 : 0 } : null;   // el mismo giro que se pone mas abajo
    const lay = ["pangea", "spread", "deal"].map(id => get(id)).find(Boolean);
    const tl = get("tilt"); if (tl) { const k = par(tl).k; for (let c = 0; c < 6; c++) spec.rot[c] = (rr() < 0.5 ? -1 : 1) * (0.3 + rr() * 0.45) * k; any = true; }
    if (lay || tl) {                                                                                // motor de encaje con mascaras reales: los continentes nunca se pisan, tambien en Pangea
      const kind = lay ? (lay.id === "deal" ? "mix" : lay.id) : "hold", k = lay ? par(lay).k : 1;
      const Z = hudZones(map, ori); if (kind === "mix") { Z.pts = roundPts(map); spec.rot = [0, 0, 0, 0, 0, 0, 0]; }
      const L = layoutMemo(map, [S.seed, S.round, kind, k, spec.rot.join(), Z.key, Z.pts ? Z.pts.key : ""].join("|"), () => map.layout(kind, k, rr, spec.rot, Z)); spec.shift = L.shift; spec.scale = L.scale; any = true;
      if (!L.ok) spec.rot = [0, 0, 0, 0, 0, 0, 0];                    // no hubo sitio: se quedan en su sitio y sin girar (girados a tamano completo se pisarian)
      if (lay && lay.id === "pangea") { spec.smooth = true; spec.ms = 2600; }
      if (kind === "mix") { spec.smooth = true; spec.ms = 1800; spec.deal = true; }   // como cartas: se encogen en su sitio y aparecen en el nuevo (sin cruzarse ni pasarse de largo)
    }
    const wb = get("wrongborders"); if (wb) { spec.wob = par(wb).amp; any = true; }
    if (has("noborders")) { spec.lineA = 0; any = true; }
    const fl = get("flip"); if (fl && !S.fx.unmirror) { spec.orient = { rot: Math.PI, mx: fl.lv >= 3 ? 1 : 0 }; any = true; }   // el Espejo del ilusionista tambien endereza el Sur arriba
    if (has("mirrorx") && !S.fx.unmirror) { spec.orient = { rot: 0, mx: 1 }; any = true; }
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
      const dim = S.fx.blackoutMul < 0.9;
      if (A.chfx && A.chfx.ok()) { const run = () => A.chfx.cut(p.len, dim, () => { if (S.on && !S.suspended) flickerLoop(); }); if (S.fx.flickerWarn) { say("warn"); later(run, 420); } else run(); return; }
      const on = dim ? 0.6 : 0.98, seq = [[on, 70], [0, 90], [on, 60], [0, 110], [on, p.len]];
      const go = i => { if (i >= seq.length || !S.on) { el.style.opacity = 0; say("restore"); return flickerLoop(); } el.style.opacity = seq[i][0]; if (seq[i][0]) say("buzz", i); later(() => go(i + 1), seq[i][1]); };
      if (S.fx.flickerWarn) { const h = layer("halo"); if (h) { h.classList.add("warn"); later(() => h.classList.remove("warn"), 420); } say("warn"); later(() => go(0), 420); } else go(0);
    }, wait);
  }
  function lightningLoop() {
    const lg = get("lightning"); if (!lg || S.suspended || !S.on || S.fx.noFlash) return; const p = par(lg), el = layer("flash"); if (!el) return;
    const wait = (p.iv[0] + Math.random() * (p.iv[1] - p.iv[0])) * 1000;
    later(function fire() {
      if (!phaseOk()) return later(fire, 800);
      if (A.chfx && A.chfx.ok()) { A.chfx.strike(); return later(lightningLoop, 240); }
      const seq = [[1, 60], [0.15, 70], [0.9, 90], [0, 0]], go = i => { if (i >= seq.length || !S.on) { el.style.opacity = 0; return lightningLoop(); } el.style.opacity = seq[i][0]; if (i === 0) say("thunder"); later(() => go(i + 1), seq[i][1]); };
      go(0);
    }, wait);
  }

  /* ------------------------------------------------------------------ perks que contrarrestan retos activos: al empezar la ronda suena la "contra"
     (v0.35: sin marcar que ficha ni con que perk; antes la ficha brillaba con el icono del perk y eso se lo daba mascado al jugador) */
  const counterOf = id => { const ids = (S.on && S.fx && S.fx.ids) || []; return (D[id].counters || []).find(p => ids.includes(p)); };
  function counterFx(qi) {
    const hit = S.list.filter(c => counterOf(c.id)); if (!hit.length || qi !== 0) return;
    later(() => hit.forEach((c, i) => later(() => say("counter", i), i * 140)), 650);
  }

  /* ------------------------------------------------------------------ puntero: parametros para js/pointer.js */
  A.chal.ptrMods = () => {
    if (S.suspended || !S.on) return null;
    const m = {}; for (const c of kindOn("ptr")) { const p = par(c); if (c.id === "cmirror" && S.fx.unmirror) continue; m[c.id] = p; }
    if (get("dark") && !S.fx.halo) m.tinyDark = true;                   // sin linterna, el puntero se ve mas pequeño en el apagon
    return Object.keys(m).length ? m : null;
  };

  /* ------------------------------------------------------------------ bandera: filtro CSS para js/adventure.js (renderFlag) */
  A.chal.flagFx = () => {
    if (S.suspended || !S.on) return null;
    const c = kindOn("flag")[0]; if (!c) return null;
    const p = par(c);
    switch (c.id) {
      case "flaginvert": return S.fx.noNegative ? null : "invert(1)";                // el Sello de la casa le devuelve sus colores
      case "flaghue": return `hue-rotate(${p.deg}deg)`;
      case "flagblur": return `blur(${p.px}px)`;
      case "flagdark": return `brightness(${p.b})`;
      case "flaggray": return `grayscale(${p.amt})`;
      default: return null;
    }
  };

  function flagClass(el) {
    const img = el && el.querySelector(".ask-flag"), c = !S.suspended && S.on && kindOn("flag")[0]; if (!img || !c) return;
    const p = par(c); img.classList.add("fx-" + c.id);
    if (c.id === "flaghue") { img.style.setProperty("--fh0", (p.deg * 0.6) + "deg"); img.style.setProperty("--fh1", (p.deg * 1.4) + "deg"); }
    if (c.id === "flagdark") img.style.setProperty("--fb", p.b);
  }

  /* ------------------------------------------------------------------ API */
  Object.assign(A.chal, {
    begin(list, fx, ctx = {}) {
      this.end(); S.list = list.slice(); S.fx = fx || A.chal.fx([]); S.halve = ctx.halve || 1; S.seed = ctx.seed || "s"; S.round = ctx.round || 0; S.on = true; S.suspended = false; S.q = 0;
      S.map = A.core && A.core.map; if (S.map) ensureOverlay(S.map);
      /* retos que mueven continentes: su colocacion se deja calculada mientras se presenta la ronda (con el mapa ya quieto), no al empezar la pregunta */
      if (S.map && S.map.layout && S.list.some(c => ["pangea", "spread", "tilt", "deal"].includes(c.id))) {
        const idle = fn => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 0));
        /* Continentes barajados: primero los objetivos de la ronda y la preparacion de la mesa, cada cosa en su hueco libre (juntas pasaban de 60 ms) */
        const steps = (has("deal") ? [() => roundPts(S.map), () => S.map.warmMix && S.map.warmMix()] : []).concat(() => mapSpec(S.map, null));
        const next = () => { const f = steps.shift(); if (f) idle(() => { if (S.on && S.map) try { f(); } catch (e) { /* ya se calculara en la pregunta */ } next(); }); };
        clearTimeout(S.preT); S.preT = setTimeout(next, 1300);       // fuera de S.timers: si saltas la intro, la pregunta no lo cancela (se calculaba todo de golpe al empezarla)
      }
    },
    active: () => S.list.slice(),
    has,
    lensRadius: () => (S.suspended ? 0 : has("wrongborders") ? S.fx.trueR : has("noborders") ? S.fx.peekR : 0),
    question(o, qi = 0) {
      const map = S.map = (A.core && A.core.map) || S.map; if (!map || !S.on) return; S.q = qi; S.suspended = false; clearTimers(); ensureOverlay(map);
      decorate(o);
      const spec = map.setDistort ? mapSpec(map, o) : null, app = $("app");
      if (spec) { map.setDistort(spec, spec.ms || 900); say("chal"); } else if (map.clearDistort) map.clearDistort(300);
      if (spec && spec.deal && A.core && A.core.S) A.core.S.limit += spec.ms / 1000;   // mientras se reparten las cartas no se puede responder: ese tiempo se devuelve
      if (S.list.some(c => D[c.id].kind === "map")) { app.classList.remove("ch-glitch"); A.restyle(app); app.classList.add("ch-glitch"); later(() => app.classList.remove("ch-glitch"), 600); }
      app.classList.toggle("ch-negative", has("negative") && !S.fx.noNegative);
      ensureOverlay(map).classList.add("on");
      const bl = get("blur"), dk = get("dark"), cl = get("clouds"), rn = get("rain"), my = get("myopia"), bs = get("blindspot"), dc = get("decoys");
      const L = layer("blur"), M = layer("myopia"), M2 = layer("myopia2"), K = layer("dark"), H = layer("halo"), Sp = layer("spot"), CX = A.chfx, PX = !!(CX && CX.ok());
      if (bl) { const p = par(bl); L.style.setProperty("--bl", p.px.toFixed(1) + "px"); L.style.setProperty("--lr", (S.fx.lensR ? S.fx.lensR : -60) + "px"); L.classList.add("on"); } else L.classList.remove("on");
      if (my) { const p = par(my); for (const m of [M, M2]) { m.style.setProperty("--mr", p.r + "px"); m.classList.add("on"); } } else { M.classList.remove("on"); M2.classList.remove("on"); }
      if (bs && !PX) { const p = par(bs); Sp.style.setProperty("--sr", p.r + "px"); Sp.classList.add("on"); } else Sp.classList.remove("on");
      if (dk && !PX) { const p = par(dk); app.style.setProperty("--dr", p.r + "px"); app.style.setProperty("--da", p.a.toFixed(3)); K.classList.add("on"); H.classList.add("on"); H.classList.toggle("warm", !!S.fx.halo); } else { K.classList.remove("on"); H.classList.remove("on"); }
      if (dk) say("dark");
      if (cl && !PX) fxStart("smoke", par(cl).cover); else if (rn && !CX) fxStart("rain", par(rn).dens); else fxStop();
      if (CX) { CX.clear(); CX.set(S.list, par, S.fx); }
      if (map.setDecoys) map.setDecoys(dc ? decoyList(map, o, par(dc).n) : []);
      layer("flick").style.opacity = 0; layer("flash").style.opacity = 0; flickerLoop(); lightningLoop();
      if (A.pointer && A.pointer.mods) A.pointer.mods();
      counterFx(qi);
    },
    reveal(ms = 750) {
      const map = S.map; clearTimers(); fxStop(); if (A.chfx) A.chfx.clear();
      if (map && map.clearDistort) { map.clearDistort(ms); if (map.setDecoys) map.setDecoys([]); }
      $("app").classList.remove("ch-negative");
      if (S.ov) { S.ov.classList.remove("on"); for (const c of ["blur", "myopia", "myopia2", "dark", "halo", "spot"]) layer(c).classList.remove("on"); layer("flick").style.opacity = 0; layer("flash").style.opacity = 0; }
      for (const id of ["askName", "askSub"]) { const el = $(id); if (el) { el.classList.remove("ch-fade", "ch-dim", "ch-riddle", "ch-nocountry"); el.querySelectorAll(".gap,.dot,.rune,.faint").forEach(b => { b.classList.remove("gap", "dot", "rune", "faint"); b.textContent = b.dataset.g || b.textContent; }); } }
      const o = A.core && A.core.S.qs[A.core.S.qi], sb = $("askSub"); if (o && sb && o.sub && !o.clue && sb.textContent.includes("▮")) A.renderBlanks(sb, A.tx(o.sub));       // al responder, el pais vuelve
    },
    suspend() { S.suspended = true; this.reveal(500); const o = A.core && A.core.S.qs[A.core.S.qi]; if (o) decorate(o); if (A.pointer && A.pointer.mods) A.pointer.mods(); },
    upright() { const map = S.map; if (map && map.setOrient) map.setOrient(false, 900); },
    end() {
      clearTimers(); clearTimeout(S.preT); fxStop(); if (A.chfx) A.chfx.clear(); S.on = false; S.list = []; const map = S.map || (A.core && A.core.map);
      if (map && map.clearDistort) { map.clearDistort(300); map.setLens && map.setLens(null); map.setDecoys && map.setDecoys([]); }
      const app = $("app"); if (app) app.classList.remove("ch-negative");
      if (S.ov) { S.ov.classList.remove("on"); for (const c of ["blur", "myopia", "myopia2", "dark", "halo", "spot"]) layer(c).classList.remove("on"); layer("flick").style.opacity = 0; layer("flash").style.opacity = 0; }
      clearText(); if (A.pointer && A.pointer.mods) A.pointer.mods();
    },
    decorate, par, get, fxNow: () => S.fx, suspended: () => S.suspended,
  });
})(window.AIQ);
