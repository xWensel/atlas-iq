"""
Silkscreen solo trae Latin-1: aqui se construyen las letras polacas (Ą Ć Ę Ł Ń Ś Ź Ż y minusculas) con piezas
de la propia fuente (su tilde, un punto y una colita de pixeles) y se guardan en fonts/silkscreen-pl-<peso>.woff2,
que skins.css declara como "Silkscreen" solo para esos caracteres (unicode-range).
Uso: python tools/build_silkscreen_pl.py
"""
import os
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools import subset

FONTS = os.path.join(os.path.dirname(__file__), "..", "fonts")
PX = 125
LETTERS = {  # nombre: (base, marca)
    "Aogonek": ("A", "ogonek"), "Cacute": ("C", "acute"), "Eogonek": ("E", "ogonek"), "Lslash": ("L", "slash"),
    "Nacute": ("N", "acute"), "Sacute": ("S", "acute"), "Zacute": ("Z", "acute"), "Zdotaccent": ("Z", "dot"),
}
CODES = {"Aogonek": 0x104, "Cacute": 0x106, "Eogonek": 0x118, "Lslash": 0x141, "Nacute": 0x143, "Sacute": 0x15A, "Zacute": 0x179, "Zdotaccent": 0x17B}


def bbox_xs(glyph_set, name):
    rec = DecomposingRecordingPen(glyph_set); glyph_set[name].draw(rec)
    xs = [pt[0] for _, pts in rec.value for pt in pts]
    return min(xs), max(xs), rec


def rect(pen, x0, y0, x1, y1):
    pen.moveTo((x0, y0)); pen.lineTo((x0, y1)); pen.lineTo((x1, y1)); pen.lineTo((x1, y0)); pen.closePath()


def build(weight):
    src = os.path.join(FONTS, f"silkscreen-latin-{weight}-normal.woff2")
    f = TTFont(src)
    gs, glyf, hmtx, cmap = f.getGlyphSet(), f["glyf"], f["hmtx"], f.getBestCmap()
    # grosor del trazo vertical de la L (1 px en regular, 2 px en negrita)
    rec = DecomposingRecordingPen(gs); gs[cmap[ord("L")]].draw(rec)
    xs = sorted({round(pt[0]) for _, pts in rec.value for pt in pts})
    sw = xs[1] - xs[0]
    ax0, ax1, _ = bbox_xs(gs, "acutecomb")

    new = {}
    for upper, (base_ch, mark) in LETTERS.items():
        for case in (upper, upper[0].lower() + upper[1:]):
            base = cmap[ord(base_ch if case == upper else base_ch.lower())]
            x0, x1, rec = bbox_xs(gs, base)
            pen = TTGlyphPen(None); rec.replay(pen)
            if mark == "acute":
                off = round(((x0 + x1) / 2 - (ax0 + ax1) / 2) / PX) * PX
                r2 = DecomposingRecordingPen(gs); gs["acutecomb"].draw(r2)
                for op, pts in r2.value:
                    getattr(pen, op)(*[(x + off, y) for x, y in pts])
            elif mark == "dot":
                cx = round(((x0 + x1) / 2 - sw / 2) / PX) * PX
                rect(pen, cx, 6 * PX, cx + sw, 7 * PX)
            elif mark == "ogonek":
                rect(pen, x1 - sw, -PX, x1, 0)
                rect(pen, x1, -2 * PX, x1 + PX, -PX)
            elif mark == "slash":
                rect(pen, x0 - PX, 2 * PX, x0, 3 * PX)
                rect(pen, x0 + sw, 3 * PX, x0 + sw + PX, 4 * PX)
            g = pen.glyph(); g.recalcBounds(glyf)
            new[case] = (g, hmtx[base][0])

    order = f.getGlyphOrder() + list(new)
    f.setGlyphOrder(order)
    for name, (g, adv) in new.items():
        glyf[name] = g
        hmtx[name] = (adv, getattr(g, "xMin", 0))
    for t in f["cmap"].tables:
        if t.isUnicode():
            for up, cp in CODES.items():
                t.cmap[cp] = up
                t.cmap[cp + 1] = up[0].lower() + up[1:]
    for rec_ in f["name"].names:
        if rec_.nameID == 3:
            rec_.string = f"Silkscreen-pl-{weight};built by tools/build_silkscreen_pl.py"
    f.flavor = None
    tmp = os.path.join(FONTS, f"_tmp_{weight}.ttf"); f.save(tmp)
    out = os.path.join(FONTS, f"silkscreen-pl-{weight}-normal.woff2")
    opts = subset.Options(); opts.flavor = "woff2"; opts.layout_features = ["*"]
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=[cp for up in CODES.values() for cp in (up, up + 1)])
    ft = TTFont(tmp); sub.subset(ft); ft.flavor = "woff2"; ft.save(out)
    os.remove(tmp)
    print("guardado", out)


if __name__ == "__main__":
    build(400); build(700)
