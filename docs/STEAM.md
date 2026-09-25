# Atlas IQ en Steam - lista de pendientes

## Bloqueantes
- [ ] **Derechos del modo Clásico.** Reproduce preguntas y puntuación de Traveler IQ Challenge. Para vender: permiso escrito de sus autores, o quitar/rehacer el Clásico con contenido propio. Aventura, Extendido y Enciclopedia son propios.
- [ ] Nombre "Atlas IQ": comprobar marcas registradas. No usar "Balatro" en la tienda ni copiar sus recursos.
- [ ] Atribución de Wikipedia (CC BY-SA 4.0) y de las fotos de Commons dentro del juego (ya se muestra por tarjeta; añadir pantalla de créditos).
- [ ] Modo sin conexión: empaquetar textos y fotos de la Enciclopedia (con su licencia) en vez de pedirlos a Wikipedia en tiempo real.

## Técnico
- [ ] Ejecutable: Electron (o NW.js) + `steamworks.js` (logros, estadísticas, leaderboards, nube). Overlay de Steam en Electron: flags de GPU.
- [ ] Mapear `A.ACH` (ids estables) a logros de Steamworks; `A.steam.unlock(id)` ya se llama al desbloquear.
- [ ] Leaderboards: Steam Leaderboards o backend propio; validación en servidor reproduciendo la partida con la semilla.
- [ ] Guardado en la nube (perfil `atlasiq.profile.v1`, partida `atlasiq.run.v1`).
- [ ] Mando y Steam Deck: cursor con stick, atajos, textos grandes.
- [ ] Localización: la interfaz nueva está en es/en; completar fr/pt/de/it.
- [ ] Accesibilidad: daltonismo, escala de texto, remapeo de teclas.
- [ ] Crash reporting y analítica opcional.

## Tienda
- [ ] Cuota Steam Direct (100 USD), banco e impuestos.
- [ ] Cápsulas (varios tamaños), tráiler, 5+ capturas, descripción, cuestionario de edad.
- [ ] Página "Próximamente" con semanas de antelación; demo y Next Fest.
