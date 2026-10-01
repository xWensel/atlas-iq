#!/usr/bin/env python3
"""
Geolite - miniaturas de las fotos de la Enciclopedia: assets/wiki/th/<id>.webp (320 px de ancho, ~12 KB) a partir de assets/wiki/card.

Las cartas pequenas de la Enciclopedia (v0.35) miden ~130-180 px: cargar la foto de 960 px en cada una (cientos por pagina en EE. UU. o en
"Por afinar") daba tirones al desplazarse. El juego pide la miniatura y, si falta (la web solo publica card/ y hd/), cae a la de 960 px.
Solo crea las que faltan o son mas viejas que su tarjeta. Lo llama tools/bundle-media.py al terminar; tambien se puede lanzar suelto:

  python tools/wiki-thumbs.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
CARD, TH = ROOT / "assets/wiki/card", ROOT / "assets/wiki/th"
W = 320

def main():
    TH.mkdir(parents=True, exist_ok=True)
    made = skip = 0
    for src in sorted(CARD.glob("*.webp")):
        out = TH / src.name
        if out.exists() and out.stat().st_mtime >= src.stat().st_mtime: skip += 1; continue
        with Image.open(src) as im:
            im = im.convert("RGBA") if im.mode in ("P", "LA") else im.convert("RGB") if im.mode not in ("RGB", "RGBA") else im
            if im.width > W: im = im.resize((W, max(1, round(im.height * W / im.width))), Image.LANCZOS)
            im.save(out, "WEBP", quality=80, method=6)
        made += 1
    total = sum(f.stat().st_size for f in TH.iterdir())
    print(f"miniaturas: {made} nuevas, {skip} al dia, {total / 1e6:.1f} MB en {TH}")

if __name__ == "__main__":
    main()
