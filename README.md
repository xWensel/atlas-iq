# Atlas IQ

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
