# Geolite - reglas del proyecto

## Versiones (obligatorio en cada entrega)
- Cada entrega que se sube a `main` sube la version MENOR en 1 y deja el ultimo numero en 1: 0.2.1 -> 0.3.1 -> 0.4.1 -> ...
- La version actual es la de `VERSION`. Al subir una entrega, cambia la version en TODOS estos sitios a la vez:
  `VERSION`, `js/support.js` (`A.VERSION`, la que se ve en el juego), `package.json` y `package-lock.json` (`version`),
  y la cache de `sw.js` (`geolite-vX.Y.Z`).
- Anade la entrada de la entrega arriba del todo en `README.md` con ese mismo numero (`**vX.Y.Z** - ...`).

## Arte ligado al crupier
- El crupier (Don Crupier) es un sprite animado por capas: fuente en `tools/crupier/` (retrato maestro pulido a mano, capas, caras,
  manos, expresiones y gestos en `anim.py`). `python tools/crupier/build.py` genera `js/crupier-data.js` (lo que usa el juego con
  `js/crupier.js`) y los retratos fijos; con `--apply` sustituye `assets/icons/dealer_*.webp`. NUNCA regenerar al crupier con
  gen_art/pixelize_all/retouch (lo volverian a sacar del jpg con el broche en la chistera). Consistencia: chistera lisa, mismas cartas.
- La tarjeta del modo Aventura (`assets/gen/card_adv.webp`) lleva DENTRO al crupier de sus frases (`assets/icons/dealer_neutral.webp`).
  Si el crupier cambia (retrato nuevo, retoque, otro traje o tamano), en la misma entrega hay que regenerar la tarjeta con
  `python tools/card_adv.py` y revisarla para que se adapte: posicion `DEALER_AT`, que la mesa le tape el busto, que la pajarita
  siga a la vista y que el explorador no le tape la cara. Las piezas de la escena estan en `tools/art/card_adv/`.
- El icono del jefe del acto (`assets/icons/boss_hat.webp`: ruta de la expedicion, proxima ronda, ficha roja del jefe) es la chistera del crupier,
  sacada de su capa `hat`. Si el crupier cambia, en la misma entrega: `python tools/crupier/chistera.py`.

## Notas del parche (lo que lee el jugador dentro del juego)
- Los parches tienen numeracion PROPIA, distinta de la del juego (v0.2.1, v0.2.2...), y se leen desde el icono del cuaderno de la esquina inferior izquierda de la portada.
  Los datos estan en `js/parche-data.js` (`A.PATCHES`, el mas nuevo primero; la cabecera del archivo explica el formato) y sus capturas en `assets/parche/`. La interfaz es `js/parche.js` + `css/parche.css`.
- Cuando una entrega (o varias seguidas) reuna cambios que el jugador note, anade un parche nuevo (o amplia el ultimo si aun no se ha publicado): textos en es y en (los otros 10 idiomas caen al ingles),
  cifras medidas contra el README y cada entrada con la version del juego en la que llego. El punto rojo de "nuevo" sale solo.
