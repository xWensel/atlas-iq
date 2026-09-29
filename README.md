# Geolite

> Antes llamado **Atlas IQ**. Desde la v0.15 el juego es **Geolite** (estudio Vault Raiders). Por compatibilidad de partidas guardadas, las claves internas del navegador siguen siendo `atlasiq.*` y el espacio de nombres del codigo `window.AIQ`.

> **Versiones:** cada entrega sube la version menor y termina en 1 (0.2.1 -> 0.3.1 -> 0.4.1...), en `VERSION`, `js/support.js`, `package.json`, `package-lock.json`, `sw.js` y esta lista. Detalle en `CLAUDE.md`.

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
- **Traducciones:** el modo Clasico (536 preguntas, 53 niveles, 122 datos curiosos) estaba solo en ingles incluso en espanol: ahora esta en los 6 idiomas (`data/classic-tr.js`), con las erratas del original corregidas ("Colisseum", "New Dehli", "Kinshasha"...) y datos anticuados actualizados. El modo Extendido y 23 textos de interfaz ya tienen frances, portugues, aleman e italiano (`js/i18n5.js`). Nombres corregidos en la base de lugares (Tokio en aleman, Piramides de Guiza...).
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
- Modo Extendido con **FICHAS x MULT**: las rachas multiplican la puntuacion, con animacion y sacudida de pantalla. El modo Clasico conserva la puntuacion exacta del original.
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
- **Clásico** – 11 campañas (Mundo, Capitales del mundo, EE. UU., Europa, Asia, Latinoamérica, Oceanía, Banderas, Pistas, Eventos históricos y Personajes históricos), 10 niveles cada una, con la puntuación del juego original. Datos en `data/classic.js` (uso interno).
- **Aventura** – el modo principal: roguelike de 12 rondas en 3 actos con jefe, trucos del crupier, reliquias, herramientas y Campamento con doblones; ascensiones 0-5 y modo infinito al ganar.
- **Reto diario** – una mano al azar por día (misma semilla para todos), 3 intentos y puntuación global = suma; clasificación Hoy / Ayer / Aventura.
- **Enciclopedia** – 4.966 tarjetas que se desbloquean acertando cerca (300 / 150 / 75 km), con textos, fotos y banderas empaquetados (nunca Wikipedia en vivo).

## Puntuación
- Solo precisión y rapidez: las reliquias no multiplican los puntos.
- Clásico (idéntica al original): `distancia = floor(KMBase − km·KMDist)` · `velocidad = floor((1 − t/(TPQ − corte)) · SpeedBonus)`.
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
Modo Clásico: contenido del juego original, solo para uso interno.
