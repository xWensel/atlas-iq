# Geolite - reglas del proyecto

## Versiones (obligatorio en cada entrega)
- Cada entrega que se sube a `main` sube la version MENOR en 1 y deja el ultimo numero en 1: 0.2.1 -> 0.3.1 -> 0.4.1 -> ...
- La version actual es la de `VERSION`. Al subir una entrega, cambia la version en TODOS estos sitios a la vez:
  `VERSION`, `js/support.js` (`A.VERSION`, la que se ve en el juego), `package.json` y `package-lock.json` (`version`),
  y la cache de `sw.js` (`geolite-vX.Y.Z`).
- Anade la entrada de la entrega arriba del todo en `README.md` con ese mismo numero (`**vX.Y.Z** - ...`).

## Arte ligado al crupier
- La tarjeta del modo Aventura (`assets/gen/card_adv.webp`) lleva DENTRO al crupier de sus frases (`assets/icons/dealer_neutral.webp`).
  Si el crupier cambia (retrato nuevo, retoque, otro traje o tamano), en la misma entrega hay que regenerar la tarjeta con
  `python tools/card_adv.py` y revisarla para que se adapte: posicion `DEALER_AT`, que la mesa le tape el busto, que la pajarita
  siga a la vista y que el explorador no le tape la cara. Las piezas de la escena estan en `tools/art/card_adv/`.
