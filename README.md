# Geolite

> Antes llamado **Atlas IQ**. Desde la v0.15 el juego es **Geolite** (estudio Cousins Studios; antes Vault Raiders). Por compatibilidad de partidas guardadas, las claves internas del navegador siguen siendo `atlasiq.*` y el espacio de nombres del codigo `window.AIQ`.

> **Versiones:** cada entrega sube la version menor y termina en 1 (0.2.1 -> 0.3.1 -> 0.4.1...), en `VERSION`, `js/support.js`, `package.json`, `package-lock.json`, `sw.js` y esta lista. Detalle en `CLAUDE.md`.

**v0.48.1** - Pangea con tres niveles que se notan: la fuerza pasa de 0,9/0,95/1 a 0,6/0,8/1 (nivel 1 junta poco, el 3 del todo). Para que ninguna fuerza rompa el mapa, el continente que no cabe primero se queda mas atras en su camino, luego resbala y, si ni asi, se encoge un poco; nunca salta al otro lado (con fuerza 0,5 u 0,8 Oceania acababa junto a las Americas). Pangea exige ademas una celda de margen en las ocho direcciones: con una sola se colaba una astilla de Asia en Europa por Turquia y el Caucaso. Barrido de fuerzas 0,15-1 con las zonas del HUD: nadie cambia de lado; layoutTest 0 px y mapTest de Pangea 0 px (mapTest ya prueba los niveles nuevos).

**v0.47.1** - Pangea ya no baraja: en el nivel 2 Oceania cruzaba el mapa y acababa siempre encima de Asia (un "Continentes barajados" disfrazado, en todas las partidas). Ahora, si un continente no cabe por su lado cerca del supercontinente, se queda mas atras en su camino desde casa en vez de saltar al otro extremo. Medido con 20 semillas y las zonas reales del HUD: Pangea y Big bang dejan cada continente en su lado en los tres niveles; layoutTest sin solapes y mapTest igual que en la v0.46.1.

**v0.46.1** - Enciclopedia: el visor de fotos HD (la lupa de la carta) ya no corta las fotos altas por abajo: toda foto se encoge hasta caber entera en la pantalla, centrada, con marco turquesa y sitio para la X y el credito, sin scroll (antes el limite de alto en % no se aplicaba porque la fila de la rejilla crecia con la foto); el fondo del visor cubre tambien los lados en pantallas anchas. Y el mapa de la Enciclopedia ya deja pulsar los paises pequenos pegados a otros: antes ganaba el primer pais de la lista a menos de 25 km del clic, y Palestina salia siempre como Israel o Jordania (0 de 6.034 puntos); ahora manda el pais donde cae el clic y, si cae en el mar, el mas cercano a unos 8 px segun el zoom.

**v0.45.1** - Ruleta sin "marco": al girar el mapa ya no se ve el rectangulo del mapa dando vueltas con esquinas negras. El giro se hace ahora en la propia geometria (tierra, fronteras, reticula, tropicos y aguas someras) en vez de girar la imagen final, asi que el fondo (degradado del oceano y remolino del casino) se queda quieto llenando toda la pantalla y solo gira el mapa. Lo mismo al dar la media vuelta de Mundo del reves. Ademas la Ruleta gira a 60 fps (antes a ~20, a saltos) y las chinchetas giran con el mapa en cada fotograma (antes se quedaban atras). Clics, chinchetas y lupa usan el mismo angulo que se ve (mapTest: ida y vuelta 0 px).

**v0.44.1** - Al entrar en el juego la portada ya no da un salto: el mapa de fondo se recolocaba de golpe 1,5 s despues de aparecer (la deriva lenta empezaba desplazada en vertical); ahora arranca justo donde se para y acelera poco a poco. Ademas, al pulsar la pantalla de entrada esta se funde directamente con la portada, sin el fogonazo negro de antes.

**v0.43.1** - La C de "Cousins" pasa a ser una letra dibujada a medida (fuera de la fuente): trazo de pluma con cabeza enroscada en bola y una panza que no termina, sigue por debajo y es ella misma la cola que subraya la palabra. En la intro la cola sale trazandose desde la panza de la C (`tools/brand/cousins_c.py`, opciones en `cousins-c.html`).

**v0.42.1** - El estudio firma como **Cousins Studios** en los creditos y en el ejecutable de Steam (CompanyName), en lugar de Vault Raiders.

**v0.41.1** - Logo del estudio nuevo: "Cousins" pasa a letra script retro dorada con una cola que la subraya; en la intro las letras suben una a una y la cola se traza mientras la palabra se enciende (generador en `tools/brand/cousins_script.py`, base Yellowtail, Apache 2.0, citada en los creditos).

**v0.40.1** - Arreglo: el fondo ya no se queda en blanco y parpadeando al salir del juego y volver.
- Al volver de otra aplicación (o de suspender) Windows puede reiniciar la GPU y el mapa perdía su contexto WebGL; si el navegador no lo devolvía, el mapa quedaba sin dibujar para siempre (la portada sin fondo, parpadeando). Ahora, si no vuelve solo en 1,5 s, el mapa recrea su lienzo y se redibuja (js/map.js `_revive`); la Enciclopedia y el puntero se reenganchan al lienzo nuevo.
- El bucle de dibujo ya no muere por una excepción suelta en un fotograma, y una restauración fallida del contexto se reintenta en vez de dejar el mapa a medias.
- Electron ya no bloquea WebGL tras varios reinicios de GPU seguidos (`disableDomainBlockingFor3DAPIs` en main.js).

**v0.39.1** - Enciclopedia: la etiqueta «Nueva» ya no se corta y se quita con solo pasar el ratón.
- En la última columna la etiqueta asomaba fuera de la carta y el borde de la página la cortaba al hacer scroll; ahora va dentro de la carta (css/codex.css).
- Pasar el ratón por una carta «Nueva» ya cuenta como verla: la etiqueta desaparece sin tener que abrirla y queda guardado (js/codex.js).

**v0.37.1** - Enciclopedia nueva: un atlas sobre el mapa del juego, con medallas por precisión.
- Se recorre como un atlas: índice con Resumen, los 7 continentes (con Mares y océanos) y Por afinar; dentro, 31 familias de países vecinos (Península Ibérica, Balcanes, Levante y Mesopotamia, Cono Sur, Caribe, Melanesia...) y cada país con sus lugares por secciones (capital y ciudades, monumentos, naturaleza, batallas y sucesos, personajes, curiosidades), lo más conocido primero.
- Cada lugar es UNA carta con tres medallas: bronce a menos de 300 km (su ficha), plata a menos de 150 km (su historia) y oro a menos de 75 km (su dato clave); mares y naturaleza, el doble. Antes salía tres veces. El marco toma el color de la mejor medalla y lo que falta dice qué distancia pide. Por dentro siguen siendo las mismas 4.966 entradas: logros, Steam y partidas guardadas no cambian.
- Qué te falta: lo no descubierto sale boca abajo con el icono de su tipo; los países sin descubrir, con su silueta y "???"; Por afinar reúne por continentes lo que conoces pero no has clavado ("A un paso del oro", "Te faltan la plata y el oro", "Países por dominar"). Personajes y sucesos dicen qué lugar los desbloquea.
- El mapa es el MISMO del juego: la Enciclopedia se posa sobre la mesa de la portada y deja verlo y tocarlo (arrastrar, rueda, + / − / casa). Cada país se tiñe según lo que llevas (en penumbra, turquesa u oro; js/map.js setPaint), se resalta al pasar el ratón con su nombre y su %, y un clic lo abre. El mapa vuela al continente, al país o al lugar (con la chincheta del juego) y al cerrar vuelve como estaba. Abierta en plena partida no toca su mapa.
- El crupier enseña 3 s algo bloqueado aunque no haya cartas a la vista: una ficha de país o, en el Resumen, un país del mapa con su bandera.
- Fluidez: banderas ya rasterizadas (`tools/flags-raster.cjs`, assets/flags/r), miniaturas de 320 px para las cartas (`tools/wiki-thumbs.py`, publicadas en GitHub Pages junto a las demás fotos), cartas por tandas y sin capas de GPU en reposo. Con CPU x4, bajar por cientos de cartas: 27 fotogramas perdidos (peor 67 ms) frente a 138 (1.167 ms).
- Banderas de Curazao, Aruba y Groenlandia (Commons, dominio público); créditos y auditoría de licencias al día. Textos nuevos en los 12 idiomas; revisión independiente con 42 fallos confirmados y corregidos (Esc tras pulsar un botón, volver al mismo sitio en páginas largas, palabras partidas en ruso y coreano...).

**v0.36.1** - El crupier del Campamento ya no tapa nada.
- Se sienta un poco más arriba, en el hueco libre a la izquierda de las cartas y por encima de la mochila: ya no pisa el botón «Vender» de la reliquia levantada, y su globo termina antes de la carta (que gira y crece al pasar el ratón). Comprobado a 1280 × 720, 1366 × 768, 1920 × 1080 y 2560 × 1440, sin tocar la barra de suministros.

**v0.35.1** - Aventura: Campamento premium y ruta de la expedición nueva.
- Ruta del Campamento, arriba: siempre las 12 rondas en sus tres actos y el modo infinito al final. Antes era una ventana de 12 casillas que se corría hacia la izquierda y llegaba a enseñar rondas 13 a 18, que no existen. Lo jugado son fichas de oro con su marca, el camino se pinta de oro según avanzas y la próxima ronda va encendida, con la chincheta roja del mapa encima. Al pasar el ratón, el tema de cada ronda. Ahora también se ve en pantallas de 720 y 768 px de alto (antes se escondía).
- El jefe del acto es la chistera del crupier (los mismos píxeles de su retrato, `tools/crupier/chistera.py`): en la ruta, en la próxima ronda, en la ficha roja de su presentación y en el botón de «Ir al matadero». Adiós a la calavera con gorro de bufón.
- Pantallas de Aventura y Reto diario: la ruta de la expedición en tres paneles, uno por acto con su nombre, y el infinito al final. Fuera el subtítulo largo.
- Próxima ronda: el tema en grande con su icono y, en la línea pequeña, la ronda y el objetivo. En el jefe, su nombre en grande y el tema entre «Jefe del acto» y el objetivo. Cada reto en dos líneas: el nombre y «Sobornar» a la misma altura, con el botón más estrecho, y debajo lo que hace; con cuatro retos, en 2 × 2. El panel ocupa bastante menos (en 1080p, de 231 a 179 px con un reto). Con el Ojo en el cielo, la ronda siguiente en una sola línea.
- Cartas mucho más grandes y legibles: en 720p pasan de 267 × 152 a unos 220 × 316 px y su texto de 10 a 15 px (en 1080p, de 15 a 22). Con la mesa llena (jefe con muchos retos, Ojo en el cielo, avisos) la letra baja un escalón en vez de encoger toda la pantalla. Fuera la frase «Tres cartas sobre la mesa…»; se quedan los avisos que cambian algo (revancha, cofre, mochila llena). «Cambiar cartas» pasa a la derecha de las cartas.
- Suministros en placas de casino con costura dorada; al comprar uno, la placa se vuelve de oro y le cae el sello «Activo».
- Mochila: las reliquias son cartas pequeñas con el color de su rareza, casi el doble de grandes. Al pasar el ratón, su nombre y lo que hace; un clic la levanta y aparece «Vender» con su precio, y el segundo clic la vende (antes se vendía con un solo clic, sin preguntar). También en el cofre del jefe. Las herramientas, en el mismo formato y con sus cargas; las provisiones, con su contador.
- El botón de «estoy listo» es grande y dorado, con la ficha de la ronda que viene (la misma de su presentación) y su tema; antes del jefe se vuelve rojo.
- Sin desplazamiento ni solapes ni textos cortados a 1280 × 720, 1366 × 768, 1920 × 1080 y 2560 × 1440 (español, inglés, alemán, francés, ruso, polaco, japonés, chino y coreano; prueba de humo en los 12 idiomas). Fluidez medida ×1 y con la CPU ×4: igual que antes al comprar, cambiar cartas, pasar el ratón y volver al Campamento; la primera apertura del Campamento de cada sesión pierde un fotograma más (unos 33 ms).

**v0.34.1** - El aviso de cancion nueva pasa a la esquina inferior derecha para no molestar en la partida.

**v0.33.1** - Cofre del jefe: vender con la mochila llena.
- En el cofre del jefe ya puedes vender reliquias de la mochila (al mismo precio que en el Campamento). Con la mochila llena, vendes una y eliges la del cofre gratis; antes solo te dejaba pasar.
- Si abres el cofre con la mochila llena, la nota lo avisa: «Mochila llena: vende una reliquia.»

**v0.32.1** - Don Crupier, pulido y animado.
- El crupier de siempre, pulido píxel a píxel: chistera lisa (fuera los restos del broche), máscara sin manchas, cartas sin índices, guante con volumen y brillo en los ojos. Todas sus caras y gestos salen de ese único retrato partido en capas, así que la chistera, la máscara, la pajarita y las cartas son los mismos píxeles siempre.
- 18 caras (pícaro, presumido, guiño, sospecha, carcajada, pena, sorpresa, aburrido, nervioso, reverencia, yo no he sido, enfado, rabieta, desafiante, desconcertado, dormido y dos a oscuras) y 48 gestos (reverencia quitándose la chistera, bote de chistera, barajar, repartir, abanicarse, chitón, dedo que dice no, reloj de bolsillo, sellazo, doblón, pase de mago…). Respira, parpadea, mueve la boca al ritmo de las letras y, en reposo, hace algún gesto suelto.
- Cada una de las 764 frases tiene su cara y, cuando pega, su gesto (revisadas una a una). En los apagones solo se le ven los ojos; en la rabieta grita; en la súplica se lleva la chistera al pecho.
- Siempre nítido: se pinta a un múltiplo exacto de los píxeles reales de la pantalla (también con el escalado de Windows al 125 % o 150 %). En partida sale a x3 si cabe (si no, x2); nada de giros ni escalados que emborronen el píxel.
- En todas partes: partida, portada, intro de ronda, veredicto, Campamento, salir, tu nombre, escenas bajo el foco, tutorial (su cabeza animada), el logro de broma y el expediente de Ajustes. La tarjeta de Aventura lleva el retrato nuevo.
- Motor en js/crupier.js (datos en js/crupier-data.js, generados con tools/crupier/build.py). Sin fotogramas perdidos, igual que antes (medido x1 y con la CPU x4).

**v0.31.1** - Continentes barajados: mezclar continentes, ahora bien hecho.
- Nuevo reto del mapa «Continentes barajados», en el hueco del antiguo «Continentes cambiados» (retirado en la v0.23.1 porque jugaba como Pangea, pero peor, y se rompía): el crupier baraja los continentes y los reparte como cartas. Cada uno se encoge en su sitio y aparece en la silla de otro, sin cruzarse por el mapa. Nivel 1: una pareja cambia de sitio; nivel 2: cuatro continentes; nivel 3: los seis sobre la mesa, en dos filas de tres.
- Sin solapes: cada continente se mide con su tierra real (máscaras, con el mundo dando la vuelta), nada queda debajo del HUD (tampoco con el mapa del revés o en espejo) y todas las preguntas de la ronda quedan a la vista. Los clics leen el continente que ves: ida y vuelta 0 px en todas las pruebas.
- Mientras se reparten las cartas (1,8 s) el mapa no lee clics y ese tiempo se devuelve al reloj.
- Sale en las mismas rondas que sacaba el antiguo (misma semilla: partidas, Reto diario y Campamento no cambian en nada más) y en el jefe «Baraja revuelta». Frase nueva del crupier, icono propio y los 12 idiomas.
- Chincheta y Sonar junto al borde izquierdo o derecho: la curva de la pantalla CRT enseña allí un poco más de mundo (las dos copias a la vez) y, con los continentes movidos, la chincheta podía salir en el borde contrario. Ahora sale justo donde tocas. Un toque en mar abierto ya no se lee pasado el polo.
- Partidas guardadas: los sobornos pagados (entre la v0.23 y la v0.30) a un reto que ya no sale en esa ronda se devuelven en doblones.

**v0.30.1** - Aventura: tarjeta nueva, cara a cara con el crupier.
- Nueva ilustración del modo Aventura en la portada: el crupier de sus frases preside la mesa del mapamundi y, subido al tapete y de espaldas, el explorador le planta cara con su brújula entre las fichas en juego.
- Todo sobre la misma retícula de píxel que el crupier (mismo tamaño de píxel y contorno de 1 px): tapete repintado con el mapamundi real, filete dorado y el foco sobre el explorador; fichas dibujadas píxel a píxel; telón en penumbra.
- La escena se genera con `tools/card_adv.py` (piezas en `tools/art/card_adv/`); si el crupier cambia, la tarjeta se regenera con él (regla en `CLAUDE.md`).

**v0.29.1** - Mezcla: la 12.ª campaña del Clásico.
- Nueva campaña «Mezcla»: de todo un poco. Cada uno de sus 10 niveles junta el mismo nivel de las otras 11 campañas (misma dificultad y misma meta) y sortea 10 preguntas, una de cada campaña distinta y en orden al azar: ciudades, capitales, banderas, pistas, sucesos, personajes... Cada pregunta conserva su tipo (bandera, retrato, pista), su reloj (15 o 18 s) y la puntuación de su campaña. En los 12 idiomas.
- Con 12 cartas la pantalla del Clásico queda en dos columnas iguales de 6, sin huecos.
- Fuera la sombra oscura pegada a la parte de abajo de la pantalla del Clásico (detrás del botón de empezar): cortaba la pantalla.

**v0.28.1** - Lo primero, el estudio.
- La pantalla de carga ya no es la verde con el logo de Geolite: ahora es negro puro, sin nada, y al abrir el juego lo primero que aparece es la intro de Cousins Studios (también sobre negro, así que sale sin costuras). La pantalla verde de «pulsa para entrar» sigue después del estudio.
- En Steam/escritorio, la ventana también nace en negro (antes, verde oscuro).

**v0.27.1** - Cousins Studios.
- El estudio pasa a llamarse «Cousins Studios»: «studios» gana su s final, dibujada igual que la primera y con el mismo espaciado óptico, en perla.
- Todo recentrado: «studios» comparte eje exacto con «Cousins», y los dos filetes se acortan por igual (mismo hueco hasta la palabra y mismos extremos que «Cousins»).

**v0.26.1** - Clics y chinchetas donde se ve la tierra, también en los bordes.
- La pantalla curvada del casino no se tenía en cuenta al hacer clic: cerca de los bordes, el clic y la chincheta caían de 33 a 65 px lejos de la tierra que se veía (Anchorage salía en mitad de Alaska y Wellington en el mar). Ahora los clics, las chinchetas, las sondas, las etiquetas y la lupa de fronteras siguen la misma curva que la imagen.
- Los rótulos de latitud y longitud del borde caen sobre sus líneas curvadas.

**v0.25.1** - Cousins Studio en oro y perla.
- «Cousins» pasa a oro champán (horizonte ámbar, filo de luz cálido, sombra ámbar oscura); sale de la oscuridad en penumbra ámbar y se funde casi a blanco en el primer golpe antes de asentarse en oro.
- «studio» y sus filetes, en perla neutra: sin rastro de lavanda (tampoco en su halo ni en su fase apagada). El resplandor de fondo pasa a ámbar; el fondo sigue siendo negro puro.
- Misma fluidez: 0 fotogramas perdidos a CPU x1 y x4.

**v0.24.1** - Intro del estudio nueva: Cousins Studio sobre negro.
- Fondo negro puro en la intro (y en la transición hacia la pantalla de entrada).
- Logo nuevo «Cousins Studio», dibujado a mano como trazos (sin fuentes), de la familia del de Vault Raiders: «Cousins» grande y «studio» debajo, letras gruesas y redondeadas con la t y la d de corte inclinado, en metal perla lavanda con filo de luz arriba y sombra violeta abajo.
- Coreografía al ritmo del sonido: «Cousins» sale de la oscuridad y se enciende con el primer golpe grave (0,62 s); «studio» con el segundo (1,26 s), mientras se abren dos filetes finos a sus lados; una luz cálida cruza el metal (1,85 s) y la cámara avanza despacio con un empujón en cada golpe. Sin destellos ni partículas.
- Fluida: cada letra es su propia capa y solo se animan transform y opacidad (más un filtro de color por palabra). 0 fotogramas perdidos a CPU x1 y x4. Se ve bien en 1280x720, en móvil y con «reducir movimiento».

**v0.23.1** - Continentes movidos sin trampas: fuera «Continentes cambiados», ningún clic perdido y el Sonar, arreglado.
- Adiós a «Continentes cambiados»: jugaba como Pangea, pero peor. Cada semilla sigue sacando los mismos retos salvo en las rondas donde salía (2.508 de 43.200 planes; en el Reto diario, 236 de 4.572). Si lo tenías sobornado en una partida guardada, se te devuelve el soborno. Sus jefes cambian: Falsa alarma (Big bang + Fronteras falsas), Baraja revuelta (Continentes torcidos + Apagón + Tinta borrada) y Bandera al revés del mundo (con Mundo del revés).
- Con los continentes movidos ya no se pierde ningún clic (con Pangea se ignoraba hasta el 47 % del mapa): en tierra cuenta el continente que ves y en el mar, el de la pregunta si su costa está a menos de 260 km o si no el más cercano en pantalla. Tu chincheta cae justo donde tocas.
- Sin continentes fantasma: las copias de Rusia, Fiyi y las islas del antimeridiano se mueven con su continente (antes aparecía una Rusia entera encima de Europa), y los territorios lejanos van con el continente donde están (Guayana y Antillas francesas, Reunión, Mayotte, el Caribe neerlandés y la Papúa indonesia, con el resto de Nueva Guinea).
- Juego limpio: al mover un continente, lo que se veía en su sitio sigue viéndose, sin quedar bajo el marcador o los botones ni fuera de la pantalla (antes Oceanía podía acabar entera bajo la placa, y Samoa o Tonga salirse por un borde). Continentes torcidos gira cada continente en su sitio (antes Europa acababa en la otra punta) y en Pangea cada uno se arrima por su lado (en el nivel 3 el mapa quedaba barajado).
- Sonar: el anillo sale entero y redondo donde tocas, también con Pangea, Big bang y Continentes torcidos, y pasa por el objetivo tal como lo ves aunque sondees desde otro continente (salía hecho trizas y costaba hasta 350 ms por fotograma); la etiqueta va junto a su sonda sin taparse con las demás ni con el objetivo; «¡Dentro del país!» (y «¡Aquí mismo!» junto a un lugar) por fin se ve; los resultados quedan también encima de la carta, legibles aunque haya apagón o mapa borroso; un doble clic al sondear ya no responde la pregunta; nunca más de media vuelta al mundo, redondeo en millas de verdad y las sondas vuelven al reanudar la misma pregunta. En el mapa sin WebGL también se dibujan.
- Brújula: la flecha apunta al objetivo tal como lo ves en el mapa, a la parte del país más cercana (medía el rumbo sobre el globo hacia el centro de su caja: en casi la mitad de las sondas lejanas se desviaba más de 45°).
- La pista «Toca el mapa…» sale encima de la carta de la herramienta (la carta saltaba 63 px bajo el ratón), la franja de abajo de la carta ya no deja pasar el clic al mapa al pasar el ratón, mantener pulsada la tecla ya no la enciende y apaga, el aviso de logro ya no se come los clics del mapa y las latitudes del borde ya no se desordenan con el mapa deformado.
- Más fluido con los continentes movidos: mover el ratón sobre el mapa ya no da tirones (leer el punto bajo el puntero cuesta 10 veces menos) y los anillos del Sonar no frenan el juego con ningún reto.
- `dev/maptest.js`: comprueba solapes (con todas las copias), clics perdidos, ida y vuelta de cada clic, lo que tapa el HUD y los anillos del Sonar.

**v0.22.1** - El crupier, pulido: más pícaro, menos muletillas.
- La muletilla «Bueno, … un poco» baja de 30 frases a 14 (se queda como guiño); «Lo veo todo», «No se lo digas a nadie» y la silla ya no se repiten entre situaciones.
- Los datos curiosos de la portada ya no rematan siempre con «Y tú sin saber…» (fuera el del Chad; entra el lago Chad); las pullas bordes («cobarde», «tu cara ahora mismo») pasan a pícaras y «suerte de principiante» ya no se le dice a un veterano. 35 frases reescritas en los 12 idiomas.
- La placa de Clasificación de la portada, sin etiqueta y con el título más grande (es de varios modos, no solo de la Aventura).

**v0.21.1** - Aventura: todo el banco sale en las 12 rondas y pesa más saber que clavar.
- Todas las preguntas del banco (1.525 lugares, 196 banderas y 188 pistas) tienen salida en las 12 rondas; antes la Aventura solo preguntaba 806 lugares y la Enciclopedia no se podía completar jugando.
- Nivel 1-10 dentro de cada categoría (panel de 3 jueces, `data/dificultad.js` y `data/niveles.js`); cada ronda da 3 fáciles, 1 media y 1 difícil. Ciudades, monumentos y banderas tienen dos rondas (niveles 1-5 y 6-10); la ronda 5 pasa a Grandes ciudades y la 11 a Maravillas del mundo; las capitales 9-10 son invitadas en la 5.
- Azar vivo: todo puede repetirse, pero lo que menos te ha salido pesa más; el Reto diario sigue igual para todos. Máximo 2 del mismo continente y ningún país repetido por ronda.
- Ronda 10 nueva: 188 apodos y pistas inequívocas en 11 idiomas (`data/pistas.js`); nunca descripciones genéricas. Las pistas desbloquean la tarjeta de su lugar.
- Puntuación: el margen se estrecha un 3 % por ronda (antes 6 %), el objetivo sube 250 por ronda (antes 350), el jefe final pide 4.777 y cada Ascensión suma un 5 % (antes 10 %).
- Todo lugar lleva país debajo salvo mares y océanos; si lo comparten dos, los dos (`data/paises-lugares.js`).
- Carretes editables en `data/carretes.js` (`npx electron tools/build-carretes.cjs`) y documento de balance en `docs/carrete-aventura.html`.

**v0.20.1** - El crupier te conoce: su relación contigo crece partida a partida, sin hablar más.
- Tú contra la banca: marcador histórico, su apuesta de en qué ronda caerás, tu némesis y su tarjeta de socio que sella al subir de categoría (habitual, rival, socio); si ganas en Ascensión 5, se jubila.
- El ticket te lee: chincheta trampa, racha rota, «te vi pararte encima», el país en el que caíste, meta alcanzada y victorias por los pelos.
- Fuera de la mesa: el funeral de la expedición que tiras, el botón de abandonar que cambia al rozarlo, lo que tardaste en cruzar la puerta, te lee la carta que miras, ventana y pantalla completa, borrar datos, abrir el juego dos veces, saltarte su tutorial.
- Carga medida de nuevo con jugadores simulados (nuevo y veterano): ~1 de cada 4 respuestas comentadas y casi ninguna frase repetida literal; «otro país» y «ya tienes la meta» esperan su turno, la reliquia contra su truco no se repite, una sola frase de fórmula por intro y el Campamento una visita sí y otra no.
- Logros secretos comentados y escena bajo el foco con el último de los 100; el podio de la Clasificación, tu vuelta del Clásico, el idioma de tu ordenador, la Torre de Babel anunciada en otro idioma, el engranaje de Ajustes y el cambio de monitor.

**v0.19.1** - El crupier, en todas partes: rompe la cuarta pared en todo el juego, habla menos y cuando cuenta.
- Nunca se le corta a media frase: si su pantalla cambia se lleva la frase o la termina en su esquina; calla en la Enciclopedia; no habla invisible en ventanas bajas; asoma también en pantallas de más de 2000 px.
- Presupuesto de voz (medido con un jugador simulado): calma tras una racha de frases, ~1 de cada 4 respuestas comentadas, un comentario por ronda mientras piensas y la portada más espaciada. Más frases en las reacciones y los trucos no se repiten literal.
- Recargar a mitad de pregunta ya no devuelve el reloj entero (también en el Reto diario).
- La salida recordada (su trastada, la X o un cuelgue), temporada dos de trastadas y la saga de la puerta; le tocas la cara; apaga las luces de su carta si miras el Clásico; Babel en directo al cambiar de idioma; versión nueva; el logro falso con sello «De broma».
- Historial de cada truco y el jefe por su nombre; el fantasma de tu última caída y el sello «Nuevo»; tu mano de verdad en el ticket; tu lugar némesis; su libreta en el Perfil; aniversarios, racha de días y «anoche te fuiste a las…»; Ctrl+C y clic derecho; batería baja y siesta del ordenador.
- El Campamento con crupier: llegada con tus datos, dudas, sello «Sin fondos», el trile al cambiar cartas, el cofre atascado, «Ir al matadero», tu reliquia de siempre y te vas sin comprar. Segunda ventana en Electron.
- Enciclopedia (tu ritmo, la cerradura, te enseña una bloqueada), su expediente en Ajustes > Datos, te olvida de verdad al borrar tus datos (con déjà vu), la pausa, se queda traspuesto y corrige el lema.

**v0.18.1** - Clasificación Hoy/Ayer: toda puntuación de la Aventura que llega al servidor cuenta también para el día en curso (fecha de España), la envíe la versión que sea del juego. Antes solo entraban las partidas de jugadores con la v0.15.1 o posterior, y quien jugaba con una versión anterior (caché, Steam) no aparecía en Hoy. Cada día tiene su tabla: la de hoy pasa sola a Ayer a medianoche.

**v0.17.1** - Fluidez: el juego ya no da tirones al cambiar de pantalla y el mapa de fondo sigue moviéndose suave en todo momento. Medido fotograma a fotograma en todas las pantallas, con la CPU normal y frenada ×4 (como un portátil modesto): abrir el **Perfil** pasaba de ~100 fotogramas perdidos (el mapa se quedaba a tirones más de un segundo) a 0; la primera Aventura se congelaba ~0,3 s (1 s en un equipo lento) y ya no; una expedición entera perdía 95 fotogramas y ahora 1-5. Qué se ha arreglado:
- El ajuste de textos sin huérfanos (`A.squeeze`) mide todo de una vez y prueba cada paso en todos los textos a la vez (antes, cientos de recálculos de la página: uno por texto y por intento). Mismo resultado, comprobado en 3 idiomas y 3 resoluciones.
- El ajuste de pantalla (`A.fitK`) se hace en el mismo fotograma en que la pantalla aparece (sin salto), no se repite si nada ha cambiado (antes, una vez por cada imagen que cargaba: 200 en el Perfil) y recuerda la escala de cada pantalla para no buscarla otra vez (el Clásico daba 2-4 vueltas en cada apertura).
- El Perfil pinta primero lo de arriba y el resto de logros llega por tandas por debajo de la vista, ya ajustados.
- Los efectos de los retos compilan su shader en segundo plano al arrancar (antes, ~300 ms congelado al empezar la primera Aventura), leen su tamaño sin forzar la maqueta en cada fotograma y la colocación de continentes (Pangea, Continentes cambiados, Torcidos...) se calcula una vez por ronda, durante su presentación, en vez de en cada pregunta (hasta 76 ms).
- El sonido se prepara durante la pantalla de carga (antes, ~50 ms parado con el primer sonido: al pasar el ratón por el menú). Las fuentes pequeñas se cargan al arrancar y Ajustes se maqueta oculto, así su primera apertura ya no da tirón.
- El mapa no relee sus fuentes del CSS ni cambia la letra de su lienzo en cada fotograma (cada vez obligaba a recalcular los estilos de la página) y deja de dibujarse mientras Ajustes o la Enciclopedia lo tapan por completo. Las miniaturas del Clásico solo pintan los países que se ven y salen a su tamaño real (antes se estiraban).
- Reiniciar animaciones (racha, avisos de logro y de la Enciclopedia, ticket, rayos, crupier, nombre, salida) ya no maqueta la página entera; las imágenes que llegan juntas comparten un solo reflujo; el foco de Ajustes y de la Enciclopedia se da ya pintados.

**v0.16.1** - Portada: las luces de marquesina de la carta de la Aventura ya no salen cortadas. Ahora son bombillas enteras y redondas repartidas por igual por todo el borde (también en las esquinas), con casquillo de tinta, filamento blanco y halo; las apagadas se siguen viendo como cristal ámbar y las dos tandas se turnan como antes. La carta abre un poco su margen para que la ilustración no tape ninguna; en móvil son más pequeñas y la mitad.

**v0.15.1** - Clasificación: "Hoy" y "Ayer" son ahora puntuaciones del día, vengan de la Aventura o de un intento del Reto diario (la mejor partida de cada jugador ese día). Nueva tabla `day-AAAAMMDD` en la API (`api/submit.js`, `api/_kv.js`); la pantalla del Reto diario conserva sus tablas con la suma de los 3 intentos. Las partidas de hoy y de ayer jugadas antes de esta versión también cuentan: al abrir el juego, tu mejor Aventura (si la hiciste hoy o ayer) y los intentos del Reto diario de esos días suben a Hoy / Ayer (una vez por puntuación). El servidor acepta "Ayer" hasta dos días atrás en UTC, para quien juega de noche en América.

**v0.14.1** - Portada nueva, simétrica y con Clasificación. Las tres cartas se abren en abanico en espejo (-4° / 0° / +4°) y debajo van tres placas de casino alineadas con ellas y del color de su marco: Enciclopedia (turquesa), **Clasificación** (oro, bajo la Aventura) y Perfil (violeta). Placas estilo Balatro: color plano, luz arriba, contorno de tinta, labio grueso y costura de ficha; al pasar el ratón se levantan hacia fuera en espejo (cada una con su nota del menú: Enciclopedia, Clasificación y Perfil suben de tono) y al pulsar se hunden. La versión va aparte, pequeña, abajo a la derecha.
  Clasificación: la placa dorada lleva tu puesto mundial en la Aventura en una cinta de neón y despliega un podio que se abre siempre en Aventura, con pestañas Hoy y Ayer del Reto diario: oro, plata y bronce con la corona del primero, del 4.º al 8.º en lista y abajo tu puesto o lo que te falta para el podio. Los escalones suben con una ficha cada uno (el tuyo, con moneda y luces de marquesina). La tabla se comparte con el Reto diario y se guarda 30 s (la etiqueta de la portada, 5 min; enviar una puntuación la renueva). Icono de podio dibujado a mano (`tools/hand_icons.py`).
  Ajustes en los 12 idiomas: los nombres de carta nunca pasan de 2 líneas ("Tagesherausforderung"), etiquetas más cortas ("Kurz und knapp"; partida guardada "▶ Guardada" / "▶ Saved"...), Perfil suena al pulsarlo y tiene su ficha de ayuda, el banner de partida guardada va en una fila del ancho de las placas, y en móvil las cartas son más grandes, los nombres no se parten a trozos, el engranaje va arriba a la derecha y la cinta "Modo principal" ya no tapa el nombre.

**v0.13.1** - El crupier, que se note que es lo más importante del juego: habla con la letra de lectura del juego (Jersey 15, la de títulos y nombres) a 27 px, donde cada píxel de la fuente cae en un píxel de pantalla, en vez de Silkscreen en mayúsculas a 15-16 px, que se veía borrosa (chino, japonés, coreano y ruso a 24 px). Retrato más grande: 320 px en partida (antes 250), 256 en la portada (antes 190), hasta 240 en el veredicto y algo más en la intro de ronda y la escena del nombre. El globo aparece ya con su tamaño final y el texto se escribe dentro (las palabras no saltan de línea a media frase); ya no sale girado en la intro ni lo encoge el ajuste anti-huérfanos. En la portada asoma en la franja libre de un lado, con el globo encima: mide el hueco que deja la portada y, si no cabe, ese rato no asoma (antes pisaba las cartas en 1280x720).

**v0.12.1** - Salir del juego: botón de encendido arriba a la izquierda de la portada (espejo del engranaje) o Esc en la portada. La sala se apaga, el crupier se asoma bajo el foco con su tarjeta de fieltro y marquesina: "¿Seguro que quieres salir?", con el tiempo que llevas en la mesa y tu expedición guardada. No te deja irte fácil: al primer "Salir" hace una trastada (apagón en el que solo brilla "Me quedo", rabieta a gritos con temblor y marquesina roja, trile con los botones, sello de DENEGADO, súplica con luz fría y "Salir y dejarle solo", lluvia de fichas o un falso apagado de tele) sin repetir hasta agotarlas; al segundo se despide y apaga la pantalla como un televisor viejo. En Steam cierra el juego; en el navegador, si la pestaña no se deja cerrar, el casino queda CERRADO con su neón y un "Volver a la mesa".
  El crupier ve tu cursor rondando el botón, te pregunta con tus datos (partida guardada, la hora, si acabas de llegar o llevas mucho, tu nombre, "¿OTRA VEZ?") y la próxima vez que abras el juego te recuerda que te fuiste por ahí. 88 frases nuevas en los 12 idiomas. Temblores y vibración respetan Ajustes > Vibración y "reducir movimiento".

**v0.11.1** - Aventura: objetivos de ronda en escalera lineal, +350 por ronda, de 2.000 (ronda 1) a 5.500 (ronda 11), y el jefe final (ronda 12) en 5.777; antes subían a saltos irregulares hasta 6.450 y los jefes llevaban recargo. Los objetivos son 2.000, 2.350, 2.700, 3.050, 3.400, 3.750, 4.100, 4.450, 4.800, 5.150, 5.500 y 5.777. Con ascensión o perks de ronda se redondean a 50.
  Clásico: todos los niveles se juegan con 10 preguntas (los que tienen más lugares sortean 10 en cada intento y cada intento trae otros); Asia pasa de 8-10 a 12 lugares por nivel al reservarle sus lugares (Mundo y Pistas ya no se llevan los asiáticos); naturaleza y mares puntúan con más tolerancia (kf 1,5 / 1,6 en mares / 1,4 en estrechos, incluso en Pistas); el tiempo por pregunta sube a 15 s (18 s en Pistas, Eventos y Personajes) para jugar sin prisa. Fuera cualquier referencia a otro juego en el código y los textos: la puntuación y el contenido son de Geolite.

**v0.10.1** - Menú principal con sonido al pasar el ratón: los 6 botones (Clásico, Aventura, Reto diario, Enciclopedia, Perfil y Ajustes) suenan como rozar una ficha de casino, muy flojito y corto (clac de ficha, nota de kalimba, brillo de campana y una pizca de 8 bits). Cada botón tiene su nota (barrer las cartas suena a arpegio) y cada vez varían la nota, el timbre y el volumen, así que nunca suena igual. Solo con ratón: en móvil el toque ya suena al pulsar.

**v0.9.1** - Clásico: al elegir campaña o nivel ya no se rehace la pantalla (adiós a las tarjetas que desaparecían y al redimensionado).

**v0.8.1** - Las recomendaciones de la revisión: partidas más justas, datos al día y textos coherentes.
- **Clásico:** reintentar un nivel fallido ya no baja tu IQ ni tu medalla: cuentan los puntos de la pasada buena. La casilla Enciclopedia del ticket usa los umbrales reales de cada lugar (el doble en mares, naturaleza y estrechos) y, como la pista de cada tarjeta, respeta el ajuste de millas.
- **Aventura:** el jefe del acto II ya no es siempre de banderas: la semilla elige entre los cuatro de banderas y tres del acto, entre ellos "Rompe la cuarta pared", que antes nunca salía fuera del Reto diario. Una expedición guardada antes de ese jefe puede encontrarse otro. `docs/rondas-aventura.md` refleja las rondas actuales.
- **Reto diario:** el regalo ya nunca es papel mojado: si la reliquia no sirve con la baraja del día (Sonar trucado sin Sonar, Ruleta de 16 rumbos sin Brújula) o frena un reto que no sale en alguno de los 3 intentos, el crupier regala otra. Los días en que ya servía no cambian.
- **Enciclopedia:** las fotos reales (tarjetas, ficha, visor HD, aviso de tarjeta nueva) y los retratos de Personajes se reducen suavizadas, sin dientes de sierra; las ilustraciones, los iconos y las banderas siguen en pixel nítido.
- **Capitales al día:** Gitega (Burundi), Ciudad de la Paz (Guinea Ecuatorial) y Saint John's (Antigua y Barbuda) entran con ficha, textos en 12 idiomas y foto; Bujumbura y Malabo pasan a ser ciudades. La Enciclopedia vuelve a 4.966 tarjetas.
- **Clásico regenerado** con las herramientas corregidas: Banderas llega a los 196 países, Capitales del mundo incluye todas las capitales (ninguna depende ya del modo infinito), 150 pistas en japonés y chino que salían en inglés, el Sepik pasa a Oceanía y el estrecho de Bering a EE. UU. Mark Twain nació en Florida (Misuri), Covadonga fue en 722, el monte Fitz Roy en Argentina, Zanzíbar ciudad distinta de la isla y fuera el duplicado de Torres del Paine.
- **Textos:** la interfaz habla siempre de "retos" (el "truco" queda para las frases del crupier) y de "sucesos" en español; fuera unas 170 traducciones viejas sin uso, entre ellas todas las que decían qué reliquia frena qué reto o hablaban de multiplicadores.
- Créditos y licencias y exportación de logros de Steam regenerados.

**v0.7.1** - Preparación para Steam: empaquetado de escritorio (demo y juego completo), auditoría de licencias de las fotos (créditos y licencias en Ajustes → Datos), foto de Lexington sustituida por una de dominio público y créditos completados en 6 fotos y la bandera de Georgia.

**v0.6.1** - Revisión completa del juego: bugs, incoherencias y erratas fuera, en los 12 idiomas.
- **Partida:** en las preguntas de país, pinchar en las antípodas a la latitud justa daba casi 0 km (un tramo de frontera "daba la vuelta al mundo"); ahora la distancia es la real sobre la esfera y cuenta también los huecos (desde Lesoto, Sudáfrica está en su borde). El clic derecho o la rueda ya no responden la pregunta; un doble clic en "Siguiente" no gasta la pregunta siguiente; la pregunta se pausa sola al abrir Ajustes, cambiar de pestaña o minimizar; los sonidos del ticket no pisan la pregunta siguiente; los decimales usan la coma de cada idioma ("3,4 km"); "+1 doblón" en singular; en la Aventura el botón dice "Terminar ronda". La etiqueta de distancia del mapa ya no queda tapada por el pin.
- **Aventura:** guardar y salir en el último ticket ya no permite repetir la ronda gratis, ni volver en la primera pregunta cambia los lugares; la Chuleta de bolsillo ilumina de verdad a los 5 s aunque pauses; el botín en vivo ya no pide un punto de más y los % de margen y consuelo son exactos; con el Toque de Midas el cofre cerrado también paga el doble; el crupier ya no pone trucos que no hacen nada. Al vender el Corazón de explorador se va su provisión máxima; en la revancha solo hay una carta a mitad de precio; barajar ya no hace perder los sobornos pagados; la Chuleta de crupier ya no descifra runas (no lo decía). Textos al día: Mano de crupier (también el baile), Visera (qué trucos exactos), Gafas de sol (también la bandera borrosa), Vale de la casa y Interruptor (qué no hacen), barajas con los nombres actuales de sus cartas, "¡El seguro te salva!", "Te queda 1 provisión", "Superaste 1 ronda". Con "reducir movimiento" los trucos que se mueven (marquesina, letras) siguen funcionando.
- **Reto diario:** ya no desbloquea ascensiones de la Aventura (sigue sumando victorias, jefes y logros) ni tiene casilla de nombre: te lo pide el crupier al acabar tu primera partida y después solo se cambia en Ajustes; si lo juegas sin red, tus intentos suben a la clasificación mundial la próxima vez que la abras.
- **Crupier:** nunca se corta a sí mismo a media frase (la nueva espera su turno más su segundo de más); al saltar la intro o cambiar de pantalla ya no sigue hablando "fantasma"; no habla del sábado en domingo ni de botones que no están; 35 frases nuevas en los 12 idiomas: variantes para ganar o perder ronda, tiempo agotado, rachas, dianas y fallos (ya no repite "Esta vez ganas tú…" en cada ronda) y anuncio propio para los 9 trucos que no lo tenían (cuarta pared y banderas). Español latinoamericano sin modismos de España.
- **Logros:** "Rincones perdidos" era imposible (no queda ninguna tarjeta sin categoría): ahora pide 20 monumentos. "Completista" también lo era: el monte Erebus y el macizo Vinson quedaban por debajo del borde del mapa y salen del juego. "Al milímetro" ya no salta al hacer clic dentro de un país; "Impecable II" exige el Acto II; los textos de clics, Reto diario y "mares u océanos" dicen lo que se cuenta; continuar una partida no suma para "50 partidas"; los logros ganados con Steam cerrado se sincronizan al volver. Exportación de Steam al día.
- **Enciclopedia:** los continentes ya no mandan Egipto a Asia, el Magreb a Europa ni Tahití o Panamá a Sudamérica; las tarjetas se llaman como en la pregunta y en tu idioma; la búsqueda ignora tildes; las banderas se ven enteras; fuera restos de Wikipedia (bibliografías, "== Referencias ==", plantillas, "..") y 2.400 notas de campo rehechas (las rusas y polacas salían cortadas); Cleopatra, Pericles, Gaudí, Pedro el Grande y otras tarjetas vuelven a desbloquearse desde sus lugares (36 enlaces apuntaban a lugares retirados). Los retratos de Personajes salen de las fotos empaquetadas (antes se pedían en vivo a Wikimedia).
- **Datos:** la bandera de Georgia era la del estado de EE. UU.; Leif Erikson, San Martín, Benito Juárez, el Sepik, Live Aid y el sitio de Sarajevo tenían el país, el punto o el año mal; el océano Ártico ya se puede acertar; Crimea aparece en el mapa como parte de Ucrania; nombres de lugares completados o corregidos en varios idiomas; erratas del Clásico en español, inglés y otros idiomas; subtítulos de Irlanda, Aruba, Curazao e Islas Cook traducidos. Los arreglos quedan en `tools/` para que una regeneración no los deshaga.
- **Pantallas sin scroll ni solapes:** la de campañas del Clásico pedía scroll hasta 1366x768 y su pie tapaba la última carta: ahora cabe en todas las resoluciones y 12 idiomas (y a 1024x768 se ve más grande: al encoger ya no se estrecha a la mitad). Cada campaña tiene su miniatura de región (antes todas eran el mundo con un punto en el golfo de Guinea). Ajustes cabe a 1024x768 en los 12 idiomas (idiomas en 3 columnas con la bandera al lado). En alemán, "Tagesherausforderung" y "Schnickschnack" se parten con guion dentro de su carta; la línea de la expedición guardada ya se lee.
- **Textos:** "tarjetas", "reliquias", "Reto diario" y "provisión" en todas partes (también en inglés: "provision", "relics", "charge"); decenas de erratas y concordancias; es-419 con voz latinoamericana en menús, tutorial y crupier; el idioma del navegador es-US va a español latinoamericano.
- **Ajustes > Datos:** el botón "Reiniciar TODO desde cero (desarrollo)" pasa a ser "Borrar todos mis datos y empezar de cero", para cualquier jugador y con su doble confirmación (12 idiomas).
- **Clasificación y servidor:** la API ya no devuelve el id de los demás jugadores (con él se les podía cambiar el nombre); límites de tiempo en todas las llamadas; la tabla de Aventura ya no caduca; si el servidor no responde al abrir, se vuelve a probar al minuto.
- **Web, audio y escritorio:** la app instalada abre sin conexión y ya no guarda la clasificación vieja; la música se pausa con la pestaña oculta y la intro del estudio ya no suena de golpe encima al entrar; el silbido del zoom no se queda sonando; tooltips por encima del crupier; etiquetas accesibles en tu idioma. Electron: modo Ventana respetado al entrar, enlaces externos en el navegador del sistema, una sola instancia, servidor local cerrado a lo que no es el juego (nunca `.env.local`).

**v0.5.1** - Veredicto en movil vertical: se ve entero, en una sola columna.
- **El fallo:** `css/premium.css` fijaba el veredicto en dos columnas sin media query y, al cargarse despues de `style.css`, anulaba la columna unica de movil. En vertical (360-430 px) la ficha, la tarjeta IQ y el crupier se quedaban a la izquierda y el titulo, el texto, las cifras y los botones ("Reintentar nivel", "Otra expedicion"...) se salian por la derecha, en el Clasico, la Aventura y el Reto diario.
- **Ahora** las dos columnas son solo para escritorio y movil horizontal, que no cambian. En vertical, arriba y compactos, la ficha y la tarjeta IQ en una fila y el crupier en la suya (cara a la izquierda y globo a la derecha); debajo, titulo y cifras a tamano de movil y botones que se reparten las filas (el principal a todo el ancho). En 360x740 y 390x844 cabe todo sin encoger ni desplazarse (probado en es, de y ru), tambien con las frases mas largas del crupier; en pantallas de 700 px de alto o menos se aprieta un poco mas y en tablet vertical la columna se centra (600 px como mucho).

**v0.4.1** - Cambiar de idioma a media expedicion ya no cambia los trucos del crupier ni hace perder los sobornos.
- **El fallo:** en chino, japones y coreano las rondas normales no sacan Runas ni Sin vocales, pero esa criba miraba el idioma de cada momento, y los trucos de una ronda se recalculan cada vez que se pinta el Campamento o empieza la ronda. Si cambiabas entre un idioma latino y zh/ja/ko a media expedicion (Ajustes se abre en partida), la proxima ronda podia traer otro truco de texto y el soborno ya pagado no quitaba nada: los doblones se perdian (y, desde la v0.3.1, ese soborno encarecia igual los siguientes).
- **Ahora** cuenta el idioma con el que empieza la expedicion (`run.cjk`), tambien en el Reto diario. Las partidas guardadas de antes lo fijan con el idioma actual al continuarlas.

**v0.3.1** - Sobornos caros: el crupier sube la tarifa.
- **Mas caros de base:** 3 + 2 por nivel del truco (+1 si es de mapa), el doble en el jefe, y siguen subiendo con el acto y la ascension. Un truco del acto I pasa de 3-4 doblones a 5-6, uno del acto II de 5-6 a 9-10, uno del acto III de 8-9 a 14-15 y cada poder del jefe final de 15-18 a 27-30.
- **Cada soborno encarece los siguientes** un 50 % de su precio base (el segundo x1,5, el tercero x2, el cuarto x2,5...), en toda la expedicion. Barajar no lo reinicia. El boton de sobornar lo explica al pasar el raton (12 idiomas).
- **Por que:** medido con `dev/bot.js` (nuevo modo `bribe`: soborna del truco mas barato al mas caro y no compra cartas) en expediciones reales, quien solo sobornaba quitaba el 58-67 % de los trucos, fuera experto o medio: todos los del acto I y el 75-92 % del II. Ahora quita el 17-21 % (4-5 sobornos por expedicion, que le cuestan 5, 9, 18, 22 y 41 doblones). Sobornar vuelve a ser una decision (¿este truco o el del jefe?) y la contra comprada a tiempo sale mucho mas a cuenta: los trucos del crupier son el juego.

**v0.2.1** - Tu nombre: el crupier te lo pregunta al acabar tu primera partida, y desde entonces lo sabe.
- **La pregunta, bajo el foco** (`js/nombre.js`, `css/nombre.css`): al acabar tu primera partida sin nombre (Clasico, Aventura o Reto diario, da igual cual), en cuanto se asienta el veredicto la sala se apaga con un parpadeo de luces, se enciende un foco con motas de polvo y el crupier se asoma, mas grande, a preguntarte "¿Como quieres que te llame?" con su voz de siempre. Te tiende su **tarjeta de socio** (fieltro, marco dorado, bombillas de marquesina que corren y tu numero de socio): una placa de papel para escribir tu nombre, con 20 bombillas que se encienden una por letra (rojas al llegar al tope de **20 caracteres**) y un clic que sube por la pentatonica. Al confirmar cae el sello "¡APUNTADO!" con la firma sol-do-re y fichas de pixel, y el crupier te da la bienvenida por tu nombre; "▶ CONTINUAR" parpadea como en una recreativa y vuelve la luz. La musica se amortigua mientras dura. En movil, la tarjeta queda en la mitad de arriba (el teclado no la tapa).
- **No siempre dice lo mismo:** 6 formas de preguntarlo, 6 bienvenidas y, si le das un nombre que ya habias usado, "ah, bueno… ya te conozco" (3). Si prefieres no darlo ("Ahora no" o Esc), la tarjeta cae, se queda solo bajo el foco con su pulla y vuelve a preguntar al acabar otra partida (como mucho 3 veces). Todo en los 12 idiomas.
- **Es tu nombre en la clasificacion:** hasta 20 caracteres (antes 16; `api/submit.js` tambien), letras de cualquier alfabeto, cifras, espacio y `_ . - '`. Al cambiarlo, `A.rank.rename` lo cambia en tus filas locales y lo reenvia a las tablas que se ven (Aventura, hoy y ayer): el servidor conserva la mejor puntuacion y los intentos ya guardados, solo cambia el nombre. Los envios van en fila para que un "Anonimo" lento no pise al nombre nuevo.
- **Se cambia en Ajustes > General** ("Tu nombre", con tu numero de socio; Intro guarda, Esc deshace) o en el Reto diario. Cabe sin desplazarse desde 1280x720 en los 12 idiomas.
- **El crupier te llama por tu nombre, con cuentagotas** (`js/dealer.js`, "tu nombre"): al volver te saluda "ah, {nombre}, ya te conozco"; si te lo cambias, lo comenta la proxima vez que asoma ("¿Asi que ahora te llamas…?"); y muy de vez en cuando lo suelta para llamarte la atencion: un comentario en el menu o mientras piensas, un "Nombre… ¡ja, ja!" delante de una reaccion, el "explorador" de algunas frases cambiado por tu nombre o la invitacion a jugar otra. Como mucho 3 veces por sesion y con 3 minutos de juego entre una y otra. 41 frases nuevas en los 12 idiomas.

**v0.36.0** - Marcador y ticket en una sola pieza: el ticket de cada respuesta sale del marcador y sus puntos suben a el.
- **Una sola pieza (escritorio):** al hacer clic, el marcador de puntos se ensancha y de su borde inferior se despliega el ticket (mismo ancho, mismo borde, una sola sombra). Antes el ticket era una ventana aparte con un margen fijo y, cuando el marcador crecia (el botin de la Aventura), se montaba encima. Mientras hay ticket el marcador deja de balancearse para que el texto pixel quede nitido. Todo en `js/marcador.js` y `css/marcador.css`.
- **El cobro:** mientras rueda el TOTAL del ticket, fichas de pixel suben del total a las cifras del marcador, asoma "+1.243" y las cifras, la barra y el total de la partida suben a su compas (antes el marcador saltaba antes de que el ticket contara nada).
- **Meta:** si ese cobro alcanza el objetivo, la barra se pone verde justo al tocar la marca, cae el sello "¡META!" (12 idiomas), suena la firma del juego (sol-do-re) y el movil vibra. En la Aventura la linea de botin se despliega en ese momento y cada escalon de margen suena una moneda mas aguda con un pulso de vibracion mas largo. Todo llega antes de los jackpots de la Enciclopedia, sin pisarse; si pasas de pregunta antes, no suena encima de la siguiente.
- **Siguiente:** el ticket se arranca (borde de arriba dentado, sonido de papel) y cae girando mientras el marcador vuelve a su tamano.
- **Nunca hay que desplazarse:** entre 901 y 1100 px de ancho la nota de campo se aparta a la izquierda mientras hay ticket; si aun asi falta alto, el ticket se compacta y, en ultimo caso, se encoge solo el (la cabecera no se toca: sus cifras son un odometro). En movil y tablet el ticket sigue siendo la hoja inferior, con el mismo cobro.

**v0.35.1** - Contra para todos los trucos, el Apagon siempre sale y el crupier comenta el botin.
- **Todos los trucos tienen contra**, ampliando reliquias que ya existian (sin cartas nuevas). Antes 16 de 55 no tenian ninguna:
  - Foco del vigilante: + Luces parpadeantes (aviso y corte a medias) y Bandera a oscuras.
  - Paraguas de coctel: + Rayos.
  - Sello de la casa: + Chinchetas trampa, Negativo y Colores invertidos.
  - Lupa del tasador: + Pixeles gordos, Luces de neon y Sin colores.
  - Gafas de sol de crupier: + Miopia y Punto ciego (a la mitad).
  - Mano de crupier: + Marquesina (se queda quieta).
  - Chuleta de crupier: + Anagrama y Letras cambiadas (a su sitio a los 2 s) y Torre de Babel.
  - Libro de la casa: + Adivinanza (se desvela a los 3 s).
  - Espejo del ilusionista: + Mundo del reves.
  Las descripciones lo cuentan todo en los 12 idiomas: leerlas es la unica pista. `js/challenges.js` gana tres compuertas: el Sur arriba, la bandera invertida y `colorMul`/`darkR` en las banderas de neon, sin color y a oscuras.
- **Precios:** Mano de crupier, Gafas de sol y Espejo del ilusionista pasan de 4 a 5, y la Chuleta de crupier de 5 a 6, porque ahora frenan 5 o 6 trucos.
- **El Apagon sale si o si** una vez por expedicion, en una ronda con hueco de mapa elegida por la semilla (si la barajas, el crupier elige otra cosa). Asi el Foco del vigilante siempre tiene su momento.
- **El crupier comenta el botin:** frases nuevas cuando aplastas la meta (+50 % o mas, con los doblones y el %) y cuando fallas pero cobras el consuelo.
- Fuera las reliquias apagadas de la mochila: saber cuando vender tambien es cosa del jugador.

**v0.35.0** - Economia del Campamento: la tienda solo ofrece lo que te va a servir y los doblones salen de como juegas.
- **Tienda relevante:** los retos salen de la semilla, asi que el Campamento sabe que trucos quedan por venir. Una contra solo se ofrece si su truco aparece en alguna de las rondas que quedan (con barajados, sobornos y tus reliquias ya aplicados); Sonar trucado, Ruleta de 16 rumbos, Catalejo y Refuerzo solo si llevas su herramienta; Cajero, Banquero, Ficha de propina, Vale y Toque de Midas solo si quedan al menos 3 rondas; Por cuenta de la casa solo si queda algun acto por empezar; con 4 herramientas distintas solo salen cargas de las tuyas. Antes, en 4.000 partidas simuladas, el Foco del vigilante no servia en el 44 % (nunca habia apagon) y un experto veia unas 13 cartas inutiles por expedicion.
- **Sin pistas mascadas:** la carta solo cuenta lo que hace; ya no lleva la etiqueta "Ayuda contra X", la proxima ronda del Campamento ya no dice que reliquia frena cada truco y las fichas de los retos en partida ya no muestran (ni hacen brillar) el perk que las frena. El jugador tiene que leer y atar cabos; solo quedan la "contra" sonora al empezar la ronda y la queja del crupier. En el reparto, una contra pesa mas cuantas mas rondas frena (sin decirlo).
- **Botin de ronda por margen:** superar la ronda sigue pagando 2 (jefe 4) y cada escalon de margen suma 1: +10 %, +25 %, +50 % y el doble del objetivo. En cuanto superas el objetivo, el marcador muestra en vivo lo que cobrarias y el siguiente escalon ("BOTIN +4 · +5 A 5.775"). Calibrado con `dev/bot.js` sobre partidas reales: pasar justo cobra lo mismo que antes y un buen jugador gana un 55-75 % mas por expedicion, todo del margen.
- **Fallar tambien paga:** 1 doblon por cada tercio del objetivo alcanzado (max. 2, nunca mas que superarla) y, en el Campamento de la revancha, una carta que frena los trucos de esa ronda va a mitad de precio (el Interruptor si ninguna reliquia puede); la mesa solo dice "la casa te deja una carta a mitad de precio". La tienda de la revancha usa otra semilla: antes repetia casi las mismas cartas.
- **Mochila:** una reliquia que ya no tiene nada que frenar (o que cobrar) se ve apagada y avisa de que conviene venderla.
- **Precios:** el soborno sube por acto como el resto de la tienda (comprar la contra a tiempo sale mas a cuenta si el truco se repite); cada Seguro de ronda gastado encarece el siguiente en 2 (antes se podia asegurar cada ronda y fallar gratis sin fin); dejar el cofre del jefe cerrado paga 3 o 4 doblones; fuera el codigo muerto de la Apuesta.
- Tutorial del Campamento actualizado (leer bien cada carta, reliquias apagadas). Textos nuevos en los 12 idiomas.

**v0.34.0** - Reto diario nuevo: todo al azar cada día, 3 intentos y puntuación global.
- **Una semilla por día** (`daily-AAAAMMDD`, cambia a la medianoche de cada jugador) con su código corto a la vista (p. ej. `D26-85C`, sin letras que se confundan). Todo sale de ella y es igual para todo el mundo: la **mano del día** (baraja de las 4, aunque aún no la hayas desbloqueado; ascensión 0-3; una reliquia común o poco común de regalo) y la **ruta del día** (las rondas de cada acto se barajan; el Jackpot sigue cerrando la expedición). `js/rank.js` (`A.rank.daily`).
- **3 intentos:** cada uno tiene su propia sub-semilla (`…#1`, `#2`, `#3`), así que reparte lugares, retos y cartas nuevos (los mismos para todos en el mismo intento) y un intento no chiva las respuestas del siguiente. El intento se gasta al empezarlo; si sales, se guarda en su propia ranura (`atlasiq.daily.v1`, ya no borra tu Aventura guardada) y se continúa desde el Reto diario; "Terminar el intento aquí" lo cierra con los puntos que llevas.
- **Puntuación global** = suma de los 3 intentos. El veredicto de cada intento la muestra (y tu puesto mundial si hay servidor) y ofrece jugar el siguiente sin volver al menú.
- **Pantalla nueva:** mano del día con su ruta, los 3 intentos, la puntuación global y la cuenta atrás hasta el siguiente reto; clasificación Hoy / Ayer / Aventura con el desglose de intentos, tu fila aunque estés fuera del top 8, y tus días jugados, días seguidos y mejor día. Cabe entera sin desplazarse en 1024x768, 1280x720, 1366x768 y 1920x1080 en los 12 idiomas, en todos sus estados.
- **El crupier sabe en qué intento vas:** frases nuevas para el segundo y el último intento del día (con la puntuación que ya llevas), en los 12 idiomas. La etiqueta de la ronda y del Campamento dice "Reto diario 2/3".
- **API** (`api/submit.js`, `api/top.js`): ver "Clasificación global" más abajo.

**v0.33.0** - Retos (debuffs) y perks (buffs) de la Aventura, nivel premium.
- **Motor de efectos nuevo** (`js/chfx.js`): un lienzo WebGL a pantalla completa y otro 2D nitido sobre el mapa, mas capas con `backdrop-filter` donde hay que emborronar lo de debajo de verdad. Solo trabaja mientras hay un reto activo; sin WebGL2 vuelven las capas CSS de siempre.
- **Rehechos:** *Humo de sala* (humo de puro volumetrico iluminado por las lamparas, calibrado para tapar ~20/30/42 % del mapa segun nivel; antes eran bolas lilas), *Apagon* (linterna viva con borde que respira, grano y motas de polvo en el haz; con el Foco del vigilante es un foco de escenario con aro dorado), *Punto ciego* (vacio opaco con borde organico y aura centelleante), *Lluvia* (estelas en 4 profundidades, salpicaduras, gotas en el cristal que hacen de lente y regueros; ahora si "emborrona" el mapa como dice su descripcion), *Rayos* (rayo ramificado de verdad con doble destello y trueno desfasado), *Luces parpadeantes* (corte de luz con zumbido, caida de corriente y piloto rojo de emergencia), *Miopia* (desenfoque en dos capas que cae de forma optica), *Mapa borroso* (con la Lupa del tasador: bisel dorado con cristal y reflejo), *Negativo* (negativo de verdad: antes el giro de tono devolvia los colores; ahora con bordes de pelicula perforada), *Pixeles gordos* (las fronteras ya no manchan de tinta los pixeles: se ve una imagen pixelada limpia).
- **Texto:** *Tinta borrada* son borrones de goma sobre cada letra (antes bloques rayados) y las letras que devuelve la Chuleta vuelven con tinta dorada; *Runas* usan parecidos que existen en la tipografia del juego (antes caian a otra fuente y delataban cuales eran) y funcionan tambien con nombres en ruso; *Sin vocales* funciona en ruso; *Memoria de pez* se evapora letra a letra; *Marquesina* es un letrero LED de casino; *Adivinanza* es una tarjeta que se encoge hasta caber en la placa (antes se salia por debajo del crupier); *Sin pais* es un tachon de rotulador.
- **Puntero:** *Cursor borroso* es desenfoque optico con aberracion cromatica (antes una mancha), *Cursor parpadeante* es un tubo de neon moribundo, *Cursor fantasma* se disuelve en una voluta, *Cursor con retraso* deja estela y *Mareo* lleva estrellitas. Banderas: el *neon* va cambiando de color con brillo y la *penumbra* respira.
- **4 retos nuevos de CUARTA PARED** (el crupier sale del juego y se mete en tu pantalla): *Cristal roto* (te da un punetazo a la pantalla: grietas, esquirlas y nucleo lechoso), *Pantalla sucia* (huellas de dedos grasientas con su arrastre que emborronan zonas del mapa), *No responde* (ventanas de error falsas de "Geolite.exe" que tienes que cerrar o arrastrar) y *Bateria baja* (toda la pantalla se va apagando mientras piensas, con el indicador del sistema y su aviso). Nuevos jefes: *Rompe la cuarta pared* (Acto II) y *Pantallazo* (Acto III). Iconos pixel a pixel en `tools/hand_icons_wall.py`.
- **3 perks nuevos:** *Protector de pantalla* (Cristal roto y Pantalla sucia tapan un 60 % menos), *Bateria externa* (inmune a Bateria baja y +2 s por pregunta) y *Administrador de tareas* (las ventanas de error se cierran solas en 1,5 s).
- **Los perks se notan:** la ficha de cada reto contrarrestado brilla en verde con el icono del perk que lo frena, y al empezar la ronda suena la "contra".
- **Hacen lo que dicen:** *Anagrama* no hacia nada (el barajado se descartaba y el nombre salia intacto); *Mano de crupier* prometia 75 % menos temblor y en las letras solo daba 65 %; *Visera de crupier* decia reducir el espejo (no puede) y el *Espejo del ilusionista* no decia que tambien endereza el mapa en espejo. Todo corregido en los 12 idiomas.
- Sonidos nuevos: lluvia continua, caida de corriente, cristal roto, dedo en el cristal, aviso de error, bateria baja, carga y contra de perk.
- **El crupier ya no tapa la placa:** en partida mide el hueco libre entre la placa/barra del acto y el dock, la nota y las cartas de herramientas; encoge el retrato hasta que quepa y sube o estrecha el bocadillo. Antes, en ventanas bajas (movil en horizontal, portatiles pequenos) el retrato de 250 px tapaba el nombre del lugar y el bocadillo pisaba las herramientas.

**v0.29.0** - Ajustes rediseñado como una ventana modal de verdad: se centra en pantalla con un fondo oscurecido y desenfocado detras (antes era un panel pegado a una esquina, con reglas de posicion distintas en el menu y en partida). Cabecera con icono, pestañas, interruptores y deslizadores con un acabado mas pulido. Se comporta igual en el menu principal y dentro de una partida, y sigue cabiendo entero sin scroll en cualquier tamano de pantalla, incluido movil.

**v0.28.0** - Marca y pixel art pulidos.
- **Logo y escudo redibujados pixel a pixel** (`tools/make_brand.py`, sin IA ni reescalados): letras de marquesina con cara dorada biselada, bombillas a ritmo constante sobre el eje de cada trazo, canto en relieve y contorno de tinta; la O es la Tierra con los continentes reales (Natural Earth, proyeccion ortografica) sombreada por bandas limpias; carta y ficha dibujadas a mano. El escudo tiene versiones propias a 48, 32 y 16 px (antes los tamanos pequenos eran reducciones borrosas). Favicon, iconos de app/escritorio y og.png regenerados con `tools/make_icons.py`.
- **Acabado de los 248 iconos y las 38 escenas** (`tools/pixel_cleanup.py`): paleta sin medio-tonos casi repetidos, fuera las motas del reescalado, contorno indigo de 1 px uniforme y sin escalones dobles (adios al halo doble) y sin anillo de antialias en los bordes.
- **Escenas y retratos del crupier retocados sobre su reticula** (`tools/retouch.py`): se conserva el dibujo original y se pule pixel a pixel en su rejilla nativa (256 px las escenas, 128 los tipos y retratos): fuera los pixeles de mezcla del reescalado (bordes duros), superficies sin moteado, paleta con menos tonos casi iguales, contornos en un solo tono de tinta, un punto mas de color y contraste, y sin el margen blanco que algunas traian alrededor del marco.
- **Iconos redibujados pixel a pixel** (`tools/hand_icons.py`, 64 px nativos, misma luz, rampas y contorno que el logo): los 7 continentes con la costa real (la Antartida en vista polar dibujada a mano), los globos de los retos, fichas, doblon, pilas y cartas, los iconos de interfaz (flechas, cerrar, lupas, pausa, pantalla completa, ajustes, estrella, tecla Intro, casa), gemas de rareza, medallas, corazones, 34 retos con un lenguaje comun (fichas de letra, mini-mapa, puntero) y reliquias que no se entendian (Mirilla, Sonar afinado, Cupon, Piedra filosofal, Placas tectonicas, Guardarrachas...). Unos 110 iconos en total.
- El logo del menu en pantallas grandes se muestra a x2 exacto (antes x2,35 deformaba los pixeles).

**v0.27.0** - El crupier "freaky de la geografia" se hace mucho mas grande y presente. Mas de 130 frases nuevas repartidas en burlas, tentaciones, datos reales de geografia con su gracia, comentarios de "ya has vuelto" y guinos a la cuarta pared -- ninguna se repite hasta agotar toda la categoria, ni siquiera entre sesiones (se recuerda en el propio navegador). Ahora sabe la hora: buenos dias, tardes, noches o "menuda hora para jugar" de madrugada, y tambien si es fin de semana. Y ya no vive solo en el menu: dentro de la partida, mientras miras el mapa pensando tu respuesta, tambien suelta comentarios sueltos -- nunca interrumpe retos ni reacciones, solo rellena los silencios.

**v0.26.0** - BSO de 21 canciones, ya congeladas en audio real (autoria: Alvaro Cano).
- **7 canciones nuevas:** funk brasileno ("Gran apostador / High Roller"), house ("Bote acumulado / Progressive Jackpot"), tecno ("Ventaja de la casa / House Edge"), merengue ("Mano caliente / Hot Hand"), cha-cha-cha ("Ganador y colocado / Each Way"), ranchera de banda ("Empate no vale / Draw No Bet") y corrido tumbado estilo Grupo Frontera / Fuerza Regida ("Apuesta maxima / Max Bet"). Mismo estilo casino y nombres de apuestas en 6 idiomas que las 14 anteriores.
- **De generativo a archivos fijos:** las 21 canciones ya no se sintetizan en vivo en el navegador; se hicieron bounce a `assets/music/01.mp3`...`21.mp3` (el motor que las compone sigue vivo como herramienta interna en `tools/render/`, no viaja con el juego). El jukebox (anterior/siguiente, titulo, rotacion automatica) funciona igual que antes. El unico efecto que se pierde: el timbre/tempo ya no varia por skin (solo hay un skin, Casino, asi que no se nota).
- **Efectos de sonido:** sin cambios, se siguen generando en vivo (crupier, fichas, reveal, etc).

**v0.25.0** - El crupier ahora tambien aparece en el inicio: de vez en cuando (cada 15-30 s) asoma arriba a la izquierda o a la derecha con un comentario suelto -- burlas ("a que no sabes ni donde queda esto"), tentaciones ("una partida rapida, nadie tiene por que enterarse") o un dato real de geografia con su gracia ("el Vaticano es el pais mas pequeno del mundo... como tu paciencia"). Elige el tono segun el contexto: mas tentador si tienes una partida guardada, mas burlon si nunca has jugado. Nunca bloquea ni tapa nada (no recibe clics) y se apaga solo en movil, donde la pantalla ya va justa. Solo vive en el menu principal: no interfiere con el crupier de las partidas.

**v0.24.2** - Nunca mas hay que desplazarse en los menus: el ajuste automatico de escala ahora sabe encoger la interfaz por debajo del tamano normal (antes solo podia agrandarla), asi que en cualquier resolucion la pantalla de inicio, el campamento y el veredicto de ronda caben enteros sin barra de scroll. Tambien se rebaja el efecto elevado de la carta de Aventura y de su cinta roja para que nunca puedan asomar por encima del subtitulo, sin anadir peso extra que pudiera volver a provocar el recorte.

**v0.24.1** - Corregidos solapes reales: en partida, el ticket de resultado ya no se pisa con el zoom (se oculta mientras se ve el ticket) ni con el aviso de nueva entrada de enciclopedia (ahora aparece a la izquierda, junto a los logros, no a la derecha). En el inicio, la cinta roja "MODO PRINCIPAL" de la carta de Aventura reserva sitio de sobra por encima para no pisar nunca el subtitulo, con partida guardada o sin ella. Version de app y de cache sincronizadas (arrastraban un desfase de la v0.24.0).

**v0.24.0** - Ronda de banderas y ajustes de reliquias.
- **Banderas del mundo:** nueva ronda en el Acto III (sustituye a la ultima de Ciudades dificiles) que muestra la bandera del pais en vez de su nombre; se carga en vivo desde Wikimedia Commons (igual que las fotos de la Enciclopedia, `tools/build-flags.mjs` genera `data/flags.js` con el archivo y el credito de cada pais). Cinco retos nuevos solo para esta ronda: colores invertidos, luces de neon (cambia el tono), bandera borrosa, a oscuras y sin colores.
- **Reliquias:** Pulso firme y Gafas de lectura ya no casi anulan el temblor de letras al combinarse (suelo del 35 % conjunto). Talisman ya no elimina el primer reto del jefe: ahora lo suaviza a nivel 1, para no repetir el mismo efecto que la Llave maestra. Nuevo perk **Visor de repuesto** contra el Cursor fantasma. El Campamento ya reconoce que Pulso firme tambien ayuda contra el Mareo.

**v0.23.2** - Corregido el recorte por abajo en pantallas grandes (inicio, campamento, aventura, veredicto): el ajuste automatico de escala comparaba mal el espacio disponible y no reducia el tamano cuando hacia falta; ahora encoge el propio panel hasta que quepa entero, sin cortar nada (probado a 1280x720, 1600x900, 1920x1080 y 2560x1440).

**v0.23.1** - El HUD de la partida (placa de pregunta, marcador, zoom, herramientas, ticket) vuelve a su tamano compacto para dejar libre el mapa y que nada se pise; el escalado ampliado queda solo en menus, campamento y veredicto (la letra mas grande se mantiene).

**v0.23.0** - Interfaz mas grande y legible: la UI se escala con la pantalla (menus, campamento, tickets y marcador de partida hasta x1,85 en pantallas grandes; movil sin cambios) y las letras pequenas suben unos 3 px (la placa de la pregunta no cambia), con menos espaciado entre letras. Las pantallas de menu se centran en vertical. Perks con descripciones mas claras y practicas (Gafas de lectura, Placas tectonicas, Monedero, Banquero, Paraguas, Sextante...). Nuevo boton de desarrollo en Ajustes > Datos: reinicia TODO desde cero (logros, personajes desbloqueados, enciclopedia, ajustes).

**v0.22.1** - Pangea rehecha: ajuste conjunto por descenso de coordenadas con solape cero entre continentes (Sudamerica gira 40 grados y se encaja en Africa, Norteamerica se cierra contra Europa sin cubrir Islandia ni el Reino Unido, Asia se curva contra Europa y Arabia, Oceania al sur); el reto arranca al 90/95/100 % y no deja solapes apreciables.

**v0.22.0** - Pixel art nitido, legibilidad, viento y HUD.
- **Arte:** los 248 iconos y las 38 escenas se han reconvertido desde sus originales a pixel art nitido (`tools/pixelize_all.py`: rejilla nativa 64 px para iconos, 128 para el crupier y tipos, 256 de ancho para escenas; paleta limitada sin degradados ni dither; alfa de 1 bit sin halos; ampliacion por vecino mas cercano) y se muestran sin suavizado en los tamanos grandes.
- **Letra:** tamanos minimos mas grandes (etiquetas Silkscreen desde 12 px, textos Jersey desde 15 px), sin suavizado de fuente; la placa de la pregunta no se ha tocado.
- **Vendaval:** el viento ahora EMPUJA el puntero (se ve moverse, con rachas) y una flecha animada pegada a el marca la direccion; el clic cae exactamente donde esta el puntero. La Veleta pasa a "el viento te empuja la mitad".
- **HUD:** la placa de la pregunta, el marcador de la partida y los logros van en la columna de arriba a la izquierda (el mapa queda libre); el zoom pasa a la derecha y la marca de la esquina se oculta durante la partida.

## Creditos
- **Banda sonora:** creada por el autor del juego con AKAI; los audios se exportaron y se integraron en el motor de audio del juego.
- **Arte:** ilustraciones generadas con IA a partir de un libro de estilo y post-procesadas a pixel art (ver `tools/`).

**v0.21.0** - Pangea de verdad y economia con peso.
- **Pangea:** el reto ya no es un barajado: los continentes se deslizan lentamente (2,6 s, sin rebote) hasta encajar como en el supercontinente: Africa, Europa y la Antartida quietas, Sudamerica gira y se pega a la costa africana, Norteamerica se cierra contra Europa, Asia se une a Europa y Arabia y Oceania a la Antartida. Colocacion calculada con las mascaras reales de tierra (maximizar contacto sin solapes grandes). Hay un pequeno solape residual entre Norteamerica/Groenlandia e Islandia.
- **Atlas de bolsillo:** ahora ilumina el pais a 5 s del final (no a mitad de tiempo), cuesta 9 y es raro.
- **Economia:** menos ingresos (solo las dianas dan doblon; ronda superada +2, jefe +2; interes 1 por cada 10, tope 2), precios que suben un 25 % por acto, cada provision comprada cuesta 2 mas, Tesorero +2 y Banquero mas contenido. Nuevos gastos en cada Campamento: **Suministros** de una ronda (Cafe doble +4 s por pregunta, Refuerzo +1 uso en las herramientas, Seguro de ronda que evita perder provision) y **Apuesta a la ronda** (3/6/10 doblones: si superas el objetivo +30 % cobras x2,5). Con el bot, un jugador habil compra ahora ~1 pieza por ronda en vez de llenarlo todo.

**v0.20.1** - El escudo ya no es un cuadrado: es la Tierra del logo (la O de GEOLITE) con la carta y la ficha encima, en pixel art de 48 px nativos (`tools/make_emblem.py`), con fondo transparente en favicon, iconos de app y de escritorio (solo iOS y el icono adaptable llevan fondo porque el sistema lo exige). Todas las marcas nacen de el.

**v0.20.0** - Logo en PNG en todas partes y titulos de cancion completos.
- **Marca en PNG** (`tools/make_icons.py`, pixel a pixel con vecino mas cercano): `assets/logo.png` (logo con letras), `assets/icons/logo_mark.png` (escudo), `favicon.ico` (16/32/48) + `assets/favicon-*.png` (pestana del navegador), `apple-touch-icon.png`, iconos PWA (192/512/maskable), `assets/desktop/icon.ico` (16-256, Windows) e `icon-256/512/1024.png` (escritorio, Steam, Electron) y `assets/og.png` (1200x630) con las etiquetas Open Graph / Twitter para compartir el enlace (Vercel, WhatsApp, Discord...). Los originales pixelizados viven en `tools/brand/`.
- **Musica:** los titulos largos ("Retirar ganancias", "Hándicap asiático"...) ya se leen enteros en Ajustes > Sonido.

**v0.19.1** - Botiquin y Corazon de explorador ya no se pisan: el Botiquin (5 doblones, comun) recupera 1 provision al empezar cada acto (sin subir el maximo); el Corazon (8, raro) sube para siempre en 1 el maximo de provisiones y la repone al comprarlo.

**v0.19.0** - 5 canciones nuevas y cartas sin indices.
- **Musica (14 canciones):** mismo motor y estilo casino, ahora tambien **lo-fi** ("Retirar ganancias / Cash Out"), **reggae** one-drop ("Banca al dia / Bankroll"), **reggaeton** con dembow y bajo ("Apuesta en vivo / Live Bet"), **flamenco** con rasgueos, palmas y cajon en cadencia andaluza ("Pleno al quince / Straight Up") y **deep house** ("Handicap asiatico"). Titulos en los 6 idiomas; rotan solas con las demas y aparecen en el selector de canciones.
- **Cartas sin numeracion:** fuera los indices (A, K, Q, J, numeros y palos en las esquinas) de las cartas de la tienda, herramientas, vidas y Enciclopedia; se mantiene el formato carta.

**v0.18.0** - Jefes y ascensiones claros.
- **Campamento:** la ronda siguiente es ahora una tarjeta (roja y con el nombre del jefe cuando toca jefe) con cada truco explicado: icono, nombre, nivel, que hace, si ya tienes una reliquia que lo frena (o cual te ayudaria) y boton de sobornar con su precio.
- **Ascensiones (ahora la lista dice lo que hacen de verdad):** 1 objetivos +10 %, -1 s, tienda +10 %; 2 +20 %, -2 s y, desde el acto 2, un reto de regla (viento, tormenta o silencio) en cada ronda; 3 +30 %, -3 s, retos un nivel mas fuertes y una provision menos; 4 +40 %, -4 s y los jefes traen un poder extra (antes anunciado pero sin implementar); 5 +50 %, -5 s.
- La seleccion de baraja tampoco lleva indices A K Q J.

**v0.17.0** - Menu principal limpio y notas mas caracteristicas.
- **Portada:** solo el engranaje arriba a la derecha; el idioma y el modo de pantalla (Ventana / Pantalla completa, y "Sin bordes" si el cliente de escritorio lo ofrece con `window.geoliteHost`) viven en Ajustes > General. La Enciclopedia pasa a ser un estante con libro y barra de progreso, mas discreto que los modos.
- **Notas de campo menos repetitivas:** en vez de la primera frase generica ("X es la capital de Y..."), cada nota elige la frase mas caracteristica del articulo (fechas, superlativos, records, fundacion, patrimonio...) con una puntuacion por idioma (`tools/build-short.py`).
- **Revision de perks, retos y herramientas:** comprobados uno a uno (parametros con y sin perk, hooks de pistas/monedas/vidas y las 7 herramientas). Corregido: el Espejo de mano no anulaba el reto Espejo del mapa; las Gafas de buceo eran casi imperceptibles (-55 %) y ahora quitan un 80 % del desenfoque del mapa y del puntero; el Ratón gaming anulaba tambien el temblor por error.

**v0.16.3** - Mapa mudo (reto Fronteras fuera): ahora solo desaparecen las fronteras interiores y los colores por pais; las costas siempre se ven. Logo: el globo queda solo con oceano (sin manchas).

**v0.16.2** - Fuera el reflejo blanco del globo del logo y los indices de baraja (K, A, Q) de las cartas de modo del menu.

**v0.16.1** - Logo y escudo en pixel art de verdad: `tools/pixelize.py` baja la ilustracion generada a una rejilla nativa (200 px el logo, 64 y 32 px el escudo), limita la paleta (sin degradados ni dither) y amplia por vecino mas cercano; los logos se muestran a escalas enteras (1x, 2x, 3x) con `image-rendering: pixelated`. Iconos de la app regenerados igual.

**v0.16** - Enciclopedia por niveles de precision. Cada lugar del juego tiene ahora 3 entradas: a **menos de 300 km** se abre la generica (el lugar y su pais), a **menos de 150 km** su **Historia** (y sucesos relacionados) y a **menos de 75 km** su **Dato clave** (y personajes y curiosidades relacionados). Las zonas enormes (mares, naturaleza, estrechos) tienen los umbrales x2. Los textos salen de los articulos de Wikipedia ya empaquetados (descripcion + inicio, seccion de historia, resto del texto de cabecera), en los 6 idiomas; la Enciclopedia pasa de 1.793 a 4.307 entradas. El ticket de resultado muestra los tres niveles.

**v0.15** - Nuevo nombre y arte unificado.
- **Geolite:** nombre, textos en los 6 idiomas, manifiesto, titulo, herramientas y documentos actualizados. Logo nuevo en pixel art casino (letras doradas con bombillas de marquesina y la O convertida en globo) y escudo del juego (globo con anillo de bombillas y chincheta) para la marca del HUD, el menu y los iconos de la app (favicon, PWA, iOS).
- **Revision completa del arte:** fuera el favicon y la rosa de los vientos vectoriales, el respaldo vectorial de iconos y escenas (~70 KB de dibujos antiguos), las tipografias del aspecto antiguo (Fraunces, Bricolage, DM Mono) y los iconos y escena de piezas ya retiradas (reliquias podadas, modo Extendido). Todo lo que se ve es ahora pixel art casino generado con el mismo libro de estilo (`tools/gen_art.py`).

**v0.14.4** - Revision de lo pendiente: menu principal, Campamento y veredicto ya caben en movil horizontal; se quita el aviso obsoleto de Ajustes ("preguntas del modo Extendido...") y restos del modo Extendido en el codigo.

**v0.14.3** - Movil en horizontal: HUD compacto (placa mas pequena arriba, marcas y zoom a los lados, herramientas reducidas, nota solo cuando hay texto y ticket de resultado a la derecha) para que el mapa se vea entero.

**v0.14.2** - Pistas completas, sin puntos suspensivos.
- **Notas de campo enteras:** las notas (Cuaderno, Almanaque, Adivinanza) se cortaban a 240 caracteres a mitad de frase y el pie las recortaba con "…". Se han regenerado (`data/wiki/*-s.json`) con descripcion + primera frase COMPLETA (sin partir en abreviaturas), se limpian pronunciaciones y parentesis anidados, y el pie ya no recorta: si es muy largo, se desplaza.
- **Huecos de la respuesta:** en las preguntas de descripcion/apodo, bajo la pista aparece una casilla por cada letra, con las palabras separadas y el recuento, p. ej. `▁▁▁ ▁▁▁▁▁▁▁ (3, 7)`. En el reto Adivinanza, el nombre tapado dentro del texto tiene exactamente tantas casillas como letras (antes tope de 6) y el texto ya no se recorta a 130 caracteres ni parte las palabras a mitad.

**v0.14.1** - El pais, parte de la pregunta desde el principio. Todas las rondas (capitales, batallas, ciudades...) muestran el lugar y, debajo, su pais en grande (o su continente si no tiene). Las dificultades lo van quitando: el nuevo reto **Sin pais** (jefe "Sin pasaporte") lo oculta, y los retos de texto (letras temblorosas, borradas, cambiadas, espejo, runas, anagrama, marquesina, Babel...) afectan tambien al pais, no solo al nombre.

**v0.14** - Tutorial guiado y movil.
- **Tutorial del crupier** (`js/tour.js`, `css/tour.css`): la primera vez, un foco ilumina la placa, el mapa, el reloj, doblones y provisiones, herramientas y objetivo (con el tiempo detenido); y en el primer Campamento explica cartas, retos de la proxima ronda y reliquias. Se puede saltar (boton o Esc), se recuerda en el perfil y se reactiva en Ajustes > General.
- **Movil / tablet:** el ticket de resultado es ahora una hoja inferior compacta (el resto del HUD se aparta y se ve donde cayo tu pin); cabecera del Campamento sin solapes; se quita el aviso obsoleto de "textos en ingles" del modo Clasico.

**v0.13.1** - Menu simplificado: tres modos. Se retira el modo **Extendido** y el **Competitivo** se convierte en **Reto diario** (una Aventura con semilla comun para todos, con su clasificacion local; global si el servidor tiene la API activada). Home: Clasico, Aventura y Reto diario.

**v0.13** - Reliquias claras y el pais siempre a la vista.
- **Pais como mecanica general:** en la placa de cada pregunta ves siempre el pais del lugar; si no tiene (desiertos, mares, cordilleras) ves su continente. El **Pasaporte** ilumina ese pais en el mapa; el **Atlas de bolsillo** lo ilumina solo a mitad de tiempo en cada pregunta y el **Oraculo** (legendario) desde el primer segundo.
- **Poda de reliquias: de 72 a 33.** Fuera todo lo que sobraba, se solapaba o no se entendia (GPS, reticulo, mira telescopica, termometro, comodin, casa de empenos, jackpot, prismaticos, sextante de hemisferio, inicial, y 25 mas). Quedan solo las que se entienden de un vistazo: ayudas contra retos (texto, mapa, puntero), pistas (continente, pais, nota de campo, sonar afinado), tiempo, doblones, y supervivencia. Cada reto sin ayuda directa se resuelve con el Interruptor, el Talisman, la Llave maestra o sobornando al crupier.
- **Herramientas:** el Astrolabio se retira (muy especifico); el Pasaporte ahora dice claramente "ilumina el pais en el mapa". Las partidas guardadas con piezas retiradas se convierten en doblones.

**v0.12.1** - Correccion urgente. (1) **Parpadeo:** el vigilante de rendimiento comparaba cada fotograma con el mas rapido visto y, con la variacion normal de un navegador cualquiera, creia ir lento: bajaba la resolucion una y otra vez (cada cambio vacia el lienzo = parpadeo) y frenaba el redibujado en reposo (tirones). Ahora mide la mediana de 3 s, baja como mucho hasta 0,7 y nunca por picos sueltos; ademas se quito el centelleo del filtro CRT. (2) **Pais que faltaba:** la v0.12.0 borro por error la tabla de paises de los lugares (`A.PCOUNTRY`), asi que la placa de la pregunta y el codex no decian el pais. Restaurada, y `dev/smoke.js` ahora falla si vuelve a faltar.

**v0.12** - Revision completa: fallos, traducciones, maquetacion y limpieza.
- **Traducciones:** el modo Clasico (536 preguntas, 53 niveles, 122 datos curiosos) estaba solo en ingles incluso en espanol: ahora esta en los 6 idiomas (`data/classic-tr.js`), con las erratas corregidas ("Colisseum", "New Dehli", "Kinshasha"...) y datos anticuados actualizados. El modo Extendido y 23 textos de interfaz ya tienen frances, portugues, aleman e italiano (`js/i18n5.js`). Nombres corregidos en la base de lugares (Tokio en aleman, Piramides de Guiza...).
- **Fallos corregidos:** el bloque "Puntos x Racha" del ticket salia sin estilo ("Fichas819 × Mult · Racha 21.2"); con `?skipboot` la pantalla de carga no se quitaba; las frases del crupier al ganar/perder ronda nunca se decian; el crupier tapaba el boton del veredicto; el aviso de tarjeta nueva tapaba el texto; la sacudida de racha no tenia estilo.
- **Maquetacion:** comprobada en 390x844, 1024x768, 1280x720, 1366x768 y 1920x1080: el veredicto y la portada caben sin desplazarse, el ticket ya no tapa el marcador, las cartas de herramienta quedan siempre sobre el pie, el Campamento se adapta a pantallas medianas y moviles, y las notas de campo se limitan a 3 lineas.
- **Notas de campo limpias:** fuera transliteraciones, pronunciaciones y parentesis en otros alfabetos de los extractos de Wikipedia, y nunca acaban a media frase.
- **Mas fluido:** el desenfoque y la aberracion de color al mover la camara eran tan fuertes que parecia lag (ahora son sutiles); ya no se descargan ~180 KB de fuentes del aspecto antiguo al arrancar.
- **Puntuacion:** los doblones sobrantes ya no suman puntos al final de la expedicion (la puntuacion es solo precision, como se pidio para las reliquias).
- **Limpieza:** las 4 hojas `premium*.css` son una sola; fuera 93 reglas CSS de pantallas que ya no existen, el codigo de la mano de poker, los estilos de mapa "plano" y "riso" y textos duplicados. La insignia descargable pasa al estilo casino y se traduce ("Rolear" pasa a "Cambiar cartas").
- Herramientas de desarrollo: `dev/smoke.js` (recorre todos los modos en un idioma y lista errores y textos sin traducir) y `dev/overlap.js` (solapes entre paneles).

**v0.11.5** - Mapa y fronteras: los continentes ya no se pisan nunca.
- **Continentes que no se pisan:** Pangea, Continentes cambiados, Big bang y Continentes torcidos colocan cada continente con mascaras de tierra reales (no cajas): uno a uno, lo mas cerca posible de su destino y en el hueco libre mas cercano. Si no caben, se encogen (Pangea encoge mas: sus fronteras se aprietan para encajar). Comprobado con `dev/layouttest.js` (dibuja los poligonos reales): 0 solapes en 40 disposiciones, en menos de 100 ms, y el clic se traduce a coordenadas reales con error 0.
- **Fronteras que no se rompen:** en *Fronteras falsas* solo bailan las fronteras interiores (las costas se quedan pegadas a la tierra).
- **Mapa mudo:** sin fronteras y con todos los paises del mismo color (ya no se adivinan por el color); solo queda la silueta de la tierra. La lupa (Sello de aduana / Teodolito) enseña colores y fronteras verdaderos dentro de su circulo.

**v0.11.4** - Rendimiento: el juego iba pesado en equipos justos y ahora se adapta.
- **Mapa:** la silueta y los desenfoques solo se recalculan si la vista cambia (antes, 5 pasadas por fotograma); el remolino del océano se pinta aparte a baja resolución y ~24 fps; el postproceso hace 1 lectura de textura en reposo (antes 12+); el fondo animado se repinta a ~25 fps en reposo; la lupa y las variables CSS del puntero ya no fuerzan repintar el mapa en cada fotograma; la capa 2D no se redibuja sin motivo.
- **Resolución automática:** el lienzo GL se dibuja a una fracción de la resolución nativa según la pantalla (4K/retina) y el equipo, y un vigilante baja resolución y efectos solo si los fotogramas van lentos de forma sostenida. Modo *Ahorro* = sin brillo CRT, 1x y menos fps en reposo.
- Pantalla de carga instantánea, un único buffer de ruido en el audio y menos filtros CSS.

**v0.11.3** - Melodías con sentido: la melodía ya no son notas al azar, sino frases de 4 compases (motivo, respuesta, repetición y cadencia con silencio); los tiempos fuertes caen en notas del acorde y los ritmos se apoyan en el pulso. El lounge original ya no mete notas falsas. La rotación automática sigue siendo al azar; las flechas van siempre en orden.

**v0.11.2** - Las canciones van en orden (1, 2, 3... y vuelta a la 1), tanto con las flechas como en la rotación automática. El juego siempre arranca con la primera, la original. "Pleno al 17" pasa a llamarse *Huérfanos* (una apuesta de ruleta).

**v0.11.1** - Navegador de canciones y Ajustes renovados:
- **Navegador de canciones** (`js/jukebox.js`): al cambiar de canción aparece un aviso discreto con flechas (anterior / siguiente, o las teclas ← →). Las 9 canciones tienen nombres de apuestas traducidos a los 6 idiomas (*Ambos marcan*, *Todo al rojo*, *All-in*, *Doble o nada*, *Combinada*...). Con la música desactivada no aparece nunca. El mismo control vive en Ajustes > Sonido.
- **Ajustes en 4 pestañas** (General, Sonido, Imagen, Datos), con la descripción de cada opción: idioma, pantalla completa, intro; volúmenes y aviso de canción; gráficos, reducir movimiento, puntero de casino y ayudas emergentes (ambos se pueden apagar); restablecer Enciclopedia y **restablecer ajustes**. La pestaña se recuerda.

**v0.11** - Mas trucos del crupier, puntero y tooltips de casino, y una banda sonora de 9 canciones:
- **45 retos** (antes 12): texto (letras que bailan, runas, anagrama, sin vocales, marquesina, adivinanza, Torre de Babel...), mapa (mosaico, negativo, rayos, lluvia, miopia, punto ciego, terremoto, deriva, ruleta, espejo horizontal, mundo del reves, pangea, continentes barajados, chinchetas trampa...) y **retos del puntero** (temblor, parpadeo, fantasma, desenfoque, retraso, invertido, mareo). Los desplazamientos de continentes ya no se amontonan: las fronteras siguen siempre visibles. La *tinta borrada* ahora se nota de verdad.
- **72 perks** (antes 57): nuevos contra retos de texto, mapa y puntero, mas el **Termometro** (el puntero pasa de azul a rojo al acercarte).
- **Campamento:** puedes **sobornar** un reto de la proxima ronda o **barajar** los retos pagando doblones.
- **Puntero de casino en toda la aplicacion** (`js/uikit.js`): flecha, mano, texto, agarrar, prohibido, espera, lupa... en pixel art. Solo en dispositivos con raton.
- **Tooltips propios** (`js/uikit.js`, `js/tips.js`) en lugar del `title` de Windows: HUD, herramientas y reliquias, rutas, ascensiones, logros, perfil y enciclopedia.
- **Musica:** 9 canciones de casino (lounge, ragtime, bossa, samba, blues, vals, funk, big band, mambo) que rotan cada ~90 s con un cambio de disco, y boton *Siguiente cancion* en Ajustes.

**v0.10** – El crupier cambia las reglas: retos, perks y puntero:
- **Los perks ya no tocan la puntuacion.** Fuera todos los multiplicadores y bonus de fichas: la puntuacion es tu precision. Los perks (57) ayudan a vencer retos, mejoran el puntero, dan pistas, tiempo, doblones o supervivencia (`js/relics.js`).
- **Retos por ronda y jefes** (`js/challenges.js`): letras temblorosas, tinta borrada, letras cambiadas, espejo, memoria de pez; y en el mapa: borroso, apagon (con linterna), luces parpadeantes, fronteras falsas, mapa mudo, Pangea, continentes cambiados, mundo del reves, humo, vendaval, tormenta, silencio. Suben por actos; cada jefe trae una combinacion. El Campamento anuncia la proxima ronda y marca los perks que ayudan.
- **Mapa vivo** (`js/map.js`): cada continente se puede desplazar y girar en la GPU, el mapa se puede dar la vuelta (Sur arriba), las fronteras mienten con un vaiven, y todo se revierte con animacion al revelar. Los clics se traducen a coordenadas reales aunque el mapa este deformado.
- **Puntero** (`js/pointer.js`): reticulo de pixel art que reacciona a mar/tierra y herramientas; con perks: haz de linterna, lupa de fronteras, coordenadas y pais, guias, mira telescopica y pin fantasma del viento.
- **El Crupier** (`js/dealer.js`): jefe de mesa con voz arcade (una silaba por letra), anuncia los retos, se rie cuando fallas y protesta cuando lo esquivas.
- Herramientas nuevas: Astrolabio, Interruptor, Carta de cambio. Objetivos de ronda como % del maximo posible. ~45 iconos nuevos.

**v0.9.4** – Rondas sin repetidos, nombres y paises corregidos, nueva entrada:
- **Reparto de lugares:** cada lugar aparece en una sola ronda (80 por ronda); maximo de lugares del mismo pais por ronda (la ronda de maravillas dificiles ya no es casi toda de EE. UU.); el Jackpot mezcla a partes iguales lo que sobra. Lista completa en `docs/rondas-aventura.md`.
- **+50 sucesos historicos** (batallas espanolas, guerras clasicas...) para llegar a 80 en las dos rondas de Historia.
- **Paises actuales** (nada de imperios o reinos historicos), mares y lugares compartidos sin pais, y nombres internacionales corregidos (`tools/name-fix.json`, `tools/country-fix.json`, `tools/drop-places.json`, `tools/country-labels.json`).
- **Entrada:** pantalla de idioma con el logo de Geolite y animacion de estudio nueva: el logo entra con calma, dos golpes graves, un brillo dorado recorre solo las letras y se va.

**v0.9.2** – Cada ronda de la Aventura usa un carrete de 80 lugares (ventana mas dificil en cada acto; el jackpot muestrea todos los temas).

**v0.9.1** – Guardar y salir, un solo aspecto:
- **Menu de partida:** boton de pausa / `P` / `Esc` en cualquier fase (pregunta, ticket, Campamento) con *Continuar*, *Guardar y salir al menu* y *Empezar una partida nueva* (pide confirmacion). La partida se guarda sola y se reanuda exactamente en la misma pregunta, con las mismas preguntas y los puntos de la ronda.
- **Portada y pantalla de Aventura:** banner de "expedicion guardada" con *Continuar* / *Nueva partida*; descartar o sobrescribir una partida guardada pide confirmacion.
- **Ajustes:** boton *Restablecer Enciclopedia* (doble pulsacion).
- **Solo Casino:** se retira el selector de aspecto y el aspecto Expedicion.
- **Mano de poker desactivada** (las parejas de reliquias no se entendian): fuera el aviso de la tienda, el cobro por ronda y la reliquia Escalera real.

**v0.9** – Roguelike por temas, arte generado coherente y Enciclopedia empaquetada:
- **Rondas por tema con carretes gigantes:** cada ronda tiene un tema (capitales, monumentos, ciudades, paises, batallas, naturaleza...) y un carrete de 80 lugares. La ronda 1 son las capitales mas conocidas y la dificultad sube por actos (`js/adventure.js`, `poolFor`). Todo se muestra como "Ciudad, Pais".
- **Banco de 1.167 lugares** con coordenadas verificadas y dificultad por fama (`data/places.js`), generado con `tools/build-places.mjs` desde Wikipedia/Wikidata.
- **Enciclopedia completa y sin conexion:** textos en 6 idiomas, historia, foto y credito de cada tarjeta empaquetados en `data/wiki/` (`js/wiki.js`).
- **Arte 100 % coherente:** ~200 iconos, logo, jefes, actos y banners generados con el mismo estilo pixel-art casino x geografia (`tools/gen_art.py` + `tools/keyout.py`; la clave de API vive solo en `.env.local`).
- **Tienda "Campamento"** sobre el mapa mundial: 3 ofertas con tirada (roll), 78 reliquias con efectos que interactuan con la partida.
- Pantallas nuevas a pantalla completa (menu, ajustes de Aventura, Clasico, Competitivo, Perfil).

**v0.8** – Casino x Geografia (la mezcla fiel):
- **Fichas-globo:** el doblon es una ficha de casino con un globo grabado; fichas de colores, pilas y "ciegas" (blinds) para cada ronda y jefe que caen y giran al empezar.
- **Palos geograficos:** chincheta, rosa de los vientos, cumbre y palmera en lugar de corazones/picas/rombos/treboles. Las reliquias son cartas de poker (el numero de la carta es su precio) y las herramientas forman la mano en abanico, como en Balatro.
- **Fieltro impreso como mapa** (meridianos y paralelos), luces de marquesina, dados, ruleta-globo, tragaperras con monumentos y comodin cartografo.
- **Enciclopedia:** cada tarjeta lleva indice de carta (5, 8, K, A por rareza) y palo geografico segun su tipo.
- Ilustraciones regeneradas con Pollinations fusionando casino y geografia (`tools/gen-art.mjs`).

**v0.7** – Arte propio en todas partes, ilustraciones generadas y 6 idiomas:
- **Ilustraciones vectoriales** (`js/art.js`): escenas de jefes, actos, campamento, cofre, victoria y derrota, mas gemas de rareza, continentes, medallas, iconos de rango IQ e insignias de logros.
- **Ilustraciones generadas** con Pollinations (`tools/gen-art.mjs`, solo desarrollo): 26 imagenes en `assets/gen/` (jefes, actos, campamento, hub y una ilustracion de respaldo por tipo de tarjeta). Se muestran encima de la version vectorial si existen. La clave va en `.env.local` (ignorado por git/Vercel), nunca en el juego. `node tools/gen-art.mjs` genera lo que falte.
- **Traducciones** del contenido nuevo a fr/pt/de/it (`js/i18n2.js`, ~330 textos). Los datos de preguntas del modo Extendido (datos curiosos) siguen en es/en.
- Correccion: reliquias, herramientas, jefes y barajas se traducian una sola vez al cargar; ahora siguen el idioma activo.

**v0.6** – Modos, Aventura (roguelike), Competitivo y logros:
- **Un solo aspecto principal: Casino** (estilo Balatro). Expedición queda como alternativa; Plano y Riso se eliminaron.
- **Pantalla principal por modos:** Aventura · Clásico · Competitivo · Extendido, más Enciclopedia y Perfil.
- **Aventura (roguelike):** partidas aleatorias con semilla. Rondas con puntuación objetivo creciente, 3 actos + Leyenda infinita, un jefe por acto (Vendaval, Tormenta, Rigor, Silencio, Niebla), tienda de doblones entre rondas, 5 herramientas activas (Sonar, Brújula, Pasaporte, Cuaderno, Reloj de arena), 22 reliquias, 4 barajas y 6 niveles de Ascensión. La reliquia *Cartógrafo* suma según tus tarjetas de la Enciclopedia.
- **Enciclopedia por precisión:** ≤100 km desbloquea el lugar y su país, ≤50 km sucesos y curiosidades, ≤40 km personajes y el resto (×2 en mares/naturaleza).
- **Competitivo:** Reto diario con semilla común, Clásico clasificado y clasificaciones. Global si activas la API (ver abajo); si no, local.
- **Perfil y logros:** estadísticas persistentes, medallas por campaña y 40 logros (con ocultos) listos para mapear a Steamworks.
- **Iconografía propia:** ~110 iconos dibujados a mano en estilo "pin esmaltado" (`js/icons.js`, hoja de contacto en `dev/icons.html`): reliquias, herramientas, jefes, barajas, modos, tipos de tarjeta, logros, doblón, provisiones e interfaz. Sin emojis ni iconos genéricos. Tipografía del Casino: Jersey 15 (pixel legible).
- Efectos y sonidos nuevos: pin que cae con ondas y chispas, monedas que vuelan, sonar, jefe, compra, logro.

### Clasificación global (opcional)
`api/top.js` y `api/submit.js` guardan las tablas en Upstash Redis (activado el 2026-09-28: base `geolite-clasification`, plan Free, región `iad1` junto a las funciones). En Vercel: *Storage → Marketplace → Upstash Redis* (crea `KV_REST_API_URL` y `KV_REST_API_TOKEN`) y vuelve a desplegar. Sin eso, el juego usa la clasificación local (y la pantalla del Reto diario dice "Solo este equipo"). Solo hay tres clasificaciones: **Hoy** y **Ayer** (el reto de cada día) y **Aventura** (las expediciones del modo Aventura de siempre; los intentos del reto no cuentan ahí). El servidor rechaza cualquier otra tabla.
- **Reto diario** (`daily-AAAAMMDD`, fecha local del jugador; el servidor acepta hoy ±1 día en UTC): el cliente manda `{ board, id, name, tries:[s1, s2, s3] }`. Cada intento se guarda una sola vez (`HSETNX tr:<tablero>:<id>`), así que reenviar no puede subir un intento ya guardado; la tabla `lb:<tablero>` ordena por la suma (puntuación global del día) y `tries:<tablero>` guarda el desglose para los puntitos de la tabla.
- `GET /api/top?board=…&n=8&me=<id>` devuelve también `count` (jugadores) y `me` (tu puesto aunque no estés entre los primeros).
- **Aventura** (`adv-all`): la mejor expedición de cada jugador (`ZADD GT`).
**Antitrampas:** hoy la puntuación es de confianza (límites de plausibilidad y de frecuencia). Antes de Steam hay que reproducir cada partida en servidor a partir de la semilla y los clics.

Herramienta de desarrollo: `dev/bot.js` (jugador automático para equilibrar la Aventura: `bot2(errorKm)`).

**v0.5** – **Enciclopedia geografica** (tecla `C` en el menu):
- ~970 tarjetas coleccionables: ciudades, capitales, paises, monumentos, naturaleza, mares, estrechos, batallas, sucesos, **personajes** y **curiosidades**. Empiezan bloqueadas.
- Se desbloquean acertando. Un acierto abre la tarjeta del lugar y su pais; con un acierto muy bueno (>=75 %) tambien se abren personajes, sucesos y curiosidades relacionados (p. ej. Paris -> Napoleon, Revolucion francesa, baguette).
- Foto en alta definicion, descripcion e historia de Wikipedia/Wikimedia Commons en tu idioma (con atribucion CC), guardadas en IndexedDB para verlas sin conexion. Rarezas con brillo holografico, filtros, busqueda, mini-mapa y tarjetas relacionadas.

**v0.4** – 4 skins que cambian TODO (mapa por shader, paleta, formas, tipografia y sonido):
- **Expedicion** (papel y tinta) · **Casino** (mesa de cartas, remolino animado, monitor CRT, tipografia pixel, estilo "Balatro") · **Plano** (cianotipo con letra de delineante) · **Riso** (poster serigrafiado con desregistro de tinta y bordes recortados a mano).
- Modo Extendido con **FICHAS x MULT**: las rachas multiplican la puntuacion, con animacion y sacudida de pantalla. El modo Clasico tiene su propia puntuacion.
- Cada skin tiene su propia banda (tempo, swing, transposicion y timbre del piano).

**v0.3** – mapa en la GPU, entrada de estudio y mas idiomas:
- Mapa **WebGL2 vectorial puro**: paises triangulados una vez, fronteras instanciadas de ancho constante, resplandor de costas por desenfoque en GPU, reticula con LOD en el shader. Siempre nitido a cualquier zoom, 144 fps medidos.
- Zoom **sensorial**: camara con fisica (zoom suavizado hacia el cursor, inercia), desenfoque radial y aberracion cromatica segun la velocidad, viñeta que respira, silbido de aire sincronizado.
- Entrada: idioma + pantalla completa, y la intro de **Vault Raiders** (caja fuerte, clunk y dos notas). Coloca tu logo original en `assets/vault-raiders.png` para usarlo en lugar del dibujo vectorial.
- Musica nueva: jazz lo-fi con swing (piano electrico FM, contrabajo, escobillas, crujido de vinilo).
- 6 idiomas (ES, EN, FR, PT, DE, IT), reducir movimiento, compartir resultado, instalable como app (PWA, funciona sin conexion).

**v0.2** – rendimiento y rediseño de interfaz:
- Mapa reescrito para 144 fps: el mundo se dibuja una vez en texturas (antes ~700 ms por frame), capa vectorial nítida al parar la cámara con mucho zoom y resolución dinámica si los frames se alargan.
- Interfaz nueva: esquinas cortadas, odómetros mecánicos, botón de salida con brújula que sigue al cursor, miniaturas de cada región, páginas de veredicto a pantalla completa, tooltips propios.
- Ajustes con faders (general / música / efectos), palancas de silencio, idioma y modo de gráficos (Auto / Alto / Ahorro).

Juego de geografía: haz clic lo más cerca posible del lugar que te piden, cuanto más rápido mejor.
Sin build ni dependencias para jugar: abre `index.html` (o `JUGAR.bat`); en la web lo sirve Vercel y en escritorio Electron (`main.js`). 12 idiomas: es, en, fr, pt (Brasil), de, it, es-419, zh, ko, ja, ru y pl.

## Modos
- **Clásico** – 11 campañas (Mundo, Capitales del mundo, EE. UU., Europa, Asia, Latinoamérica, Oceanía, Banderas, Pistas, Eventos históricos y Personajes históricos), 10 niveles cada una, con su propia puntuación. Datos en `data/classic.js` (uso interno).
- **Aventura** – el modo principal: roguelike de 12 rondas en 3 actos con jefe, trucos del crupier, reliquias, herramientas y Campamento con doblones; ascensiones 0-5 y modo infinito al ganar.
- **Reto diario** – una mano al azar por día (misma semilla para todos), 3 intentos y puntuación global = suma; clasificación Hoy / Ayer / Aventura.
- **Enciclopedia** – 4.966 tarjetas que se desbloquean acertando cerca (300 / 150 / 75 km), con textos, fotos y banderas empaquetados (nunca Wikipedia en vivo).

## Puntuación
- Solo precisión y rapidez: las reliquias no multiplican los puntos.
- Clásico: `distancia = floor(kmBase − km·kmDist / kf)` · `velocidad = floor((1 − t/(tpq − corte)) · speed)`. `kf` = 1,5 en naturaleza, 1,6 en mares y 1,4 en estrechos (zonas enormes: el mismo error cuenta menos). Cada partida de un nivel son 10 preguntas.
- En las preguntas de país, estar dentro del país es 0 km; si no, cuenta la distancia real sobre la esfera hasta su frontera más cercana.

## Estructura
- `index.html` + `css/` – interfaz (casino en pixel art nítido; `uikit.css` escala cada pantalla para que nunca haya que desplazarse en escritorio)
- `js/game.js` – núcleo: rondas, marcador, ajustes, escalado · `js/map.js` / `js/map2d.js` – mapa WebGL y de respaldo · `js/geo.js` – geografía y distancias
- `js/adventure.js`, `js/relics.js`, `js/challenges.js`, `js/chfx.js` – Aventura, reliquias y trucos · `js/dealer.js` – el crupier y su guion
- `js/hub.js`, `js/profile.js`, `js/rank.js`, `api/` – menús, logros, clasificación (Upstash) · `js/codex.js`, `js/wiki.js` – Enciclopedia
- `js/audio.js`, `js/jukebox.js` – efectos sintetizados y la BSO del autor (`assets/music/`) · `js/i18n*.js` – textos en 12 idiomas
- `data/` – mundo, lugares, preguntas, Enciclopedia (`data/wiki/`) · `tools/` – generadores (lugares nuevos: `tools/add-places.mjs`) · `dev/` – pruebas en consola (`smoke`, `bot2`, `ovCheck`, `layoutTest`)
- `fonts/` – Silkscreen, Jersey 15, Pixelify Sans y Fusion Pixel (SIL OFL) más subconjuntos propios para CJK, cirílico y polaco

## Créditos de datos
Fronteras: Natural Earth (dominio público) vía `world-atlas` (ISC). `topojson-client` (ISC).
Modo Clásico: contenido propio de Geolite (lugares, datos y puntuación).
