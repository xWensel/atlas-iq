# Atlas IQ

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
- **Entrada:** pantalla de idioma con el logo de Atlas IQ y animacion de estudio nueva: el logo entra con calma, dos golpes graves, un brillo dorado recorre solo las letras y se va.

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
`api/top.js` y `api/submit.js` guardan las tablas en Upstash Redis. En Vercel: *Storage → Marketplace → Upstash Redis* (crea `KV_REST_API_URL` y `KV_REST_API_TOKEN`) y vuelve a desplegar. Sin eso, el juego usa la clasificación local.
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
Sin dependencias ni servidor: abre `index.html` (o `JUGAR.bat`). ES/EN.

## Modos
- **Clásico** – 6 partidas con las preguntas, el orden, los tiempos y la puntuación **exactos** del juego original
  (Mundo, Capitales del mundo, EE. UU., Asia, Latinoamérica, Oceanía; 536 destinos, rondas bonus de pistas incluidas).
  Textos en inglés, como el original. Datos en `data/classic.js` (uso interno).
- **Extendido** – contenido propio: *Vuelta al mundo Atlas* (12 niveles) e *Historia y pistas* (batallas, eventos, apodos de ciudades).

## Puntuación
- Clásico (idéntica al original): `distancia = floor(KMBase − km·KMDist)` · `velocidad = floor((1 − t/(TPQ − corte)) · SpeedBonus)`.
- Extendido: `1000·e^(−km/escala)` + hasta 400 por velocidad; racha de aciertos con bonus (+5 % por peldaño).

## Estructura
- `index.html`, `css/style.css` – interfaz (cuaderno de expedición: papel, tinta, sellos)
- `js/game.js` – niveles, campañas, pantallas, ajustes · `js/map.js` – mapa: texturas, capa nítida, resalte y efectos en capas separadas
- `js/audio.js` – identidad sonora sintetizada (motivo de tres notas, música generativa, sonidos por resultado)
- `js/geo.js`, `js/support.js` – geografía, textos, IQ e insignia
- `data/campaigns.js` – une los modos · `data/locations.js`, `data/history.js` – **aquí se añaden preguntas propias**
- `fonts/` – Fraunces, Bricolage Grotesque y DM Mono (SIL OFL)

## Créditos de datos
Fronteras: Natural Earth (dominio público) vía `world-atlas` (ISC). `topojson-client` (ISC).
Modo Clásico: contenido del juego original, solo para uso interno.
