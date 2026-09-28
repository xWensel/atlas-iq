"""
Genera fonts/geolite-cjk-punct.woff2: la puntuacion china/japonesa/coreana que Fusion Pixel no trae en sus
subconjuntos (fonts/fusion-pixel-12px-*.woff2). Sin ella, "……" y "——" salian con los glifos latinos de
Silkscreen/Jersey: puntos pegados a la linea base que parecian dos guiones bajos.
  U+2026 …  tres puntos de 1 px centrados en altura, a ancho completo (como en chino)
  U+2014 —  raya de 1 px a ancho completo y a media altura: "——" queda como una sola linea
Mismas metricas que Fusion Pixel 12 px (1 px = 100 unidades, em 1200, asc 1300, desc -300), asi no cambia la altura de linea.
css/skins.css la pone la primera en --serif, --sans y --mono solo con el idioma en zh, ja o ko.
Uso: python tools/build_cjk_punct.py
"""
import os
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

PX, EM, ASC, DESC = 100, 1200, 1300, -300
out = os.path.join(os.path.dirname(__file__), "..", "fonts", "geolite-cjk-punct.woff2")


def glyph(rects):
    pen = TTGlyphPen(None)
    for x, y, w, h in rects:                                    # rectangulos en pixeles
        x0, y0, x1, y1 = x * PX, y * PX, (x + w) * PX, (y + h) * PX
        pen.moveTo((x0, y0)); pen.lineTo((x0, y1)); pen.lineTo((x1, y1)); pen.lineTo((x1, y0)); pen.closePath()
    return pen.glyph()


glyphs = {
    ".notdef": glyph([]),
    "ellipsis": glyph([(1, 4, 1, 1), (5, 4, 1, 1), (9, 4, 1, 1)]),   # misma altura que el trazo de 一 (y 400-500)
    "emdash": glyph([(0, 4, 12, 1)]),
}
fb = FontBuilder(EM, isTTF=True)
fb.setupGlyphOrder(list(glyphs))
fb.setupCharacterMap({0x2026: "ellipsis", 0x2014: "emdash"})
fb.setupGlyf(glyphs)
fb.setupHorizontalMetrics({g: (0 if g == ".notdef" else EM, 0) for g in glyphs})
fb.setupHorizontalHeader(ascent=ASC, descent=DESC)
fb.setupNameTable({"familyName": "Geolite CJK Punct", "styleName": "Regular"})
fb.setupOS2(sTypoAscender=ASC, sTypoDescender=DESC, usWinAscent=ASC, usWinDescent=-DESC)
fb.setupPost()
fb.font.flavor = "woff2"
fb.save(out)
print("escrito", os.path.normpath(out), os.path.getsize(out), "bytes")
