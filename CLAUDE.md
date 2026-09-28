# Geolite - reglas del proyecto

## Versiones (obligatorio en cada entrega)
- Cada entrega que se sube a `main` sube la version MENOR en 1 y deja el ultimo numero en 1: 0.2.1 -> 0.3.1 -> 0.4.1 -> ...
- La version actual es la de `VERSION`. Al subir una entrega, cambia la version en TODOS estos sitios a la vez:
  `VERSION`, `js/support.js` (`A.VERSION`, la que se ve en el juego), `package.json` y `package-lock.json` (`version`),
  y la cache de `sw.js` (`geolite-vX.Y.Z`).
- Anade la entrada de la entrega arriba del todo en `README.md` con ese mismo numero (`**vX.Y.Z** - ...`).
