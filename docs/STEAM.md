# Geolite en Steam - roadmap y pendientes

Objetivo de referencia: **Steam Next Fest de febrero de 2027** (22 feb - 1 mar 2027,
inscripcion cierra el 10 de enero de 2027). La edicion de octubre 2026 ya no es
viable: el registro cerro el 31 de agosto y los entregables (build + pagina) se
piden antes del 28 de septiembre.

## Bloqueantes legales

- [ ] **Modo Clasico.** `data/classic.js` y `data/classic-tr.js` contienen ahora
      mismo una copia literal de la base de datos del Traveler IQ Challenge
      original: mismos nombres de nivel ("World Cities (Easy)", "Famous places
      (Easy)"...), mismos umbrales de puntuacion (`kmBase`, `kmDist`, `speed`,
      `cutoff`) y el texto exacto de los "fun facts" ("Buenos Aires means Fair
      Winds", etc). Esto **no se arregla anadiendo mas preguntas o cambiando
      algunas**: la mecanica de "haz clic lo mas cerca posible" no es
      protegible, pero la lista curada de lugares + los textos de los datos
      curiosos + la estructura de niveles copiada si lo son. Hay que:
      - Generar una lista de lugares propia por nivel (puede reusar el motor
        de datos de Wikipedia que ya alimenta Aventura/Enciclopedia).
      - Redactar datos curiosos propios (o generarlos desde Wikipedia con
        atribucion, igual que la Enciclopedia).
      - Definir umbrales/curva de dificultad propios (no hace falta que
        coincidan con los originales).
      - Quitar el comentario interno "juego original" y cualquier referencia
        a "Traveler IQ Challenge" en codigo/README.
- [ ] Nombre "Geolite": comprobar marcas registradas (USPTO/EUIPO) antes de
      reservarlo en Steamworks.
- [ ] Atribucion de Wikipedia (CC BY-SA 4.0) y fotos de Commons: ya se muestra
      por tarjeta; falta pantalla de creditos dedicada.
- [ ] Modo sin conexion: empaquetar textos y fotos de la Enciclopedia (con su
      licencia) en vez de pedirlos a Wikipedia en tiempo real. Necesario para
      Steam (no se puede depender de que el jugador tenga internet) y ademas
      resuelve parte del empaquetado offline en Electron.
- [ ] **Arte generado con IA.** El pipeline (`tools/gen-art.mjs`,
      `tools/gen_art.py`, Pollinations) sigue en pie. Decision tomada: se
      declara en el cuestionario de "AI-generated content" de Steamworks y se
      anade una linea breve en la ficha de tienda; no se rehace el arte.

## Tecnico (empaquetado)

- [ ] **Electron (o NW.js)** envolviendo el HTML/JS/CSS actual (vanilla JS sin
      build, encaja sin cambios de arquitectura). Se puede empezar ya: es una
      capa aparte, no bloquea ni retrasa el resto del desarrollo del juego, y
      los cambios normales de codigo se siguen viendo igual (recargar la
      ventana de Electron), sin paso de compilacion nuevo.
- [ ] `steamworks.js` (bindings de Node) para:
      - Logros: mapear `A.ACH` (IDs estables) a logros de Steamworks;
        `A.steam.unlock(id)` ya se llama al desbloquear.
      - Leaderboards: Steam Leaderboards o backend propio con validacion en
        servidor (reproducir la partida con la semilla, evita tramposos).
      - Cloud save: perfil `atlasiq.profile.v1` y partida `atlasiq.run.v1` ya
        existen en localStorage, falta mapearlos a Steam Cloud.
- [ ] Overlay de Steam en Electron: requiere flags de GPU concretos, probar
      pronto para no descubrir problemas tarde.
- [ ] Mando y Steam Deck: cursor con stick, atajos de boton, texto legible en
      pantalla pequena.
- [ ] Localizacion: interfaz nueva en es/en; completar fr/pt/de/it (no
      bloqueante para el demo/Next Fest, se puede dejar para despues).
- [ ] Accesibilidad: daltonismo, escala de texto, remapeo de teclas.
- [ ] Decidir si `api/submit.js` / `api/top.js` (Vercel KV) siguen vivos para
      un ranking online propio o si el leaderboard pasa 100% a Steam.
- [ ] Crash reporting y analitica opcional.

## Tienda

- [ ] Alta en Steamworks y cuota Steam Direct (100 USD), datos bancarios y
      fiscales. Hacerlo cuanto antes: la aprobacion de Valve tarda y todo lo
      demas depende de tener la app creada.
- [ ] Capsulas (varios tamanos), trailer, 5+ capturas, descripcion,
      cuestionario de edad/contenido y cuestionario de IA (ver bloqueante de
      arte).
- [ ] Pagina "Proximamente" publicada con semanas de antelacion.
- [ ] Build de demo jugable lista y subida antes del 10 de enero de 2027 para
      inscribirse a Steam Next Fest (22 feb - 1 mar 2027).

## Roadmap sugerido (hoy: 27 sept 2026 -> Next Fest feb 2027)

1. **Semanas 1-3 (paralelo):**
   - Legal: reescribir datos del modo Clasico (lugares + facts + curva propia).
   - Tecnico: montar el wrapper de Electron + primer build local. Empezar
     integracion de `steamworks.js` (logros primero, es lo mas mecanico).
   - Tienda: dar de alta la cuenta en Steamworks (paga el fee, reserva el
     nombre) para no perder tiempo de aprobacion despues.
2. **Semanas 3-6:**
   - Empaquetar Enciclopedia offline (textos+fotos con licencia).
   - Cloud save y leaderboards con `steamworks.js`.
   - Comprobar overlay de Steam y soporte de mando/Deck.
   - Trademark check del nombre "Geolite".
3. **Semanas 6-9:**
   - Pantalla de creditos (Wikipedia/Commons).
   - Assets de tienda: capsulas, capturas, trailer corto.
   - Publicar pagina "Proximamente".
   - Preparar y probar el build de demo (subconjunto del juego, sin
     depender de red).
4. **Semanas 9-12 (antes del 10 ene 2027):**
   - Pulido final del build de demo, pruebas de mando/Deck, QA de
     achievements/leaderboards.
   - Inscripcion oficial a Steam Next Fest febrero 2027.
5. **Post-Next Fest:** localizacion fr/pt/de/it, accesibilidad, iterar sobre
   feedback del festival antes del lanzamiento completo.

Los items de accesibilidad y localizacion completa no son bloqueantes para el
demo/Next Fest: se pueden dejar para la fase posterior sin riesgo.
