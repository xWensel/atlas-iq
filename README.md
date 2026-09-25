# Atlas IQ

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
- `js/game.js` – niveles, campañas, pantallas · `js/map.js` – mapa vectorial (zoom, cursor de precisión, chinchetas)
- `js/audio.js` – identidad sonora sintetizada (motivo de tres notas, música generativa, sonidos por resultado)
- `js/geo.js`, `js/support.js` – geografía, textos, IQ e insignia
- `data/campaigns.js` – une los modos · `data/locations.js`, `data/history.js` – **aquí se añaden preguntas propias**
- `fonts/` – Fraunces, Bricolage Grotesque y DM Mono (SIL OFL)

## Créditos de datos
Fronteras: Natural Earth (dominio público) vía `world-atlas` (ISC). `topojson-client` (ISC).
Modo Clásico: contenido del juego original, solo para uso interno.
