"""
Genera fonts/geolite-cyrillic-caps.woff2: el cirilico de Tiny5 (OFL, fonts/LICENSE-tiny5.txt) con las
minusculas apuntando a los glifos de las mayusculas, igual que hace Silkscreen con el latin. Asi el ruso
sale en mayusculas pixel de la misma altura que Silkscreen en cualquier texto con var(--mono).
Uso: python tools/build_cyrillic_caps.py <tiny5-cyrillic-400-normal.woff2>
(el woff2 de origen esta en @fontsource/tiny5)
"""
import os, sys
from fontTools.ttLib import TTFont

src = sys.argv[1]
out = os.path.join(os.path.dirname(__file__), "..", "fonts", "geolite-cyrillic-caps.woff2")

f = TTFont(src)
pairs = [(lo, lo - 0x20) for lo in range(0x430, 0x450)] + [(lo, lo - 0x50) for lo in range(0x450, 0x460)]
for table in f["cmap"].tables:
    if not table.isUnicode():
        continue
    for lo, up in pairs:
        if up in table.cmap:
            table.cmap[lo] = table.cmap[up]

family = "Geolite Cyrillic Caps"
for rec in f["name"].names:
    if rec.nameID in (1, 16):
        rec.string = family
    elif rec.nameID == 4:
        rec.string = family + " Regular"
    elif rec.nameID == 6:
        rec.string = "GeoliteCyrillicCaps-Regular"
    elif rec.nameID == 3:
        rec.string = "GeoliteCyrillicCaps-Regular;based on Tiny5"

f.flavor = "woff2"
f.save(out)
print("guardado", out)
