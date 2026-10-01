#!/usr/bin/env python3
"""Cousins Studios - "Cousins" en script retro (base Yellowtail, Apache 2.0, Astigmatic) con cola que subraya la palabra.

Saca los contornos de la fuente, une la palabra en una sola forma (las uniones del script se solapan), la coloca como en la
maqueta elegida (tools/brand/cousins-alternativas.html, opcion 1) y la trocea en una pieza por letra con cortes inclinados
siguiendo la inclinacion del script, mas la cola. Los filos de luz y de sombra se calculan sobre la forma ENTERA (letra menos ella misma
desplazada) y luego se reparten por pieza: al juntarse las capas no queda ninguna costura en las uniones.

Escribe las entradas "big" y "tail" de A.CS_LETTERS y el viewBox (VB) en js/logo.js; "studios" y los filetes no se tocan.
  python tools/brand/cousins_script.py            escribe js/logo.js
  python tools/brand/cousins_script.py --debug    solo tools/brand/cousins-cortes.html, con los cortes dibujados
"""
import re, sys, math
from pathlib import Path
import pathops
from fontTools.ttLib import TTFont
from fontTools.pens.transformPen import TransformPen

ROOT = Path(__file__).resolve().parents[2]
FONT = Path(__file__).parent / "fonts" / "Yellowtail-Regular.ttf"
LOGO = ROOT / "js" / "logo.js"
WORD = "Cousins"
CX = 765                       # centro horizontal de "studios"
BOX = (1420, -30, 300)         # ancho maximo y franja vertical de la tinta (como la maqueta)
EDGE = 5.0                     # grosor de los filos de luz / sombra
SLANT = math.tan(math.radians(17))   # inclinacion de los cortes entre letras (la del script)
CUT_DX = {}                    # retoque a mano de cada corte (unidades del logo) respecto al origen de la letra que empieza
OVER = 4                       # solape entre piezas vecinas: ~1 px a tamano de pantalla, sin rendija de antialias

U, D, I = pathops.PathOp.UNION, pathops.PathOp.DIFFERENCE, pathops.PathOp.INTERSECTION


def glyph_path(gs, name, m):
    p = pathops.Path(); gs[name].draw(TransformPen(p.getPen(), m)); return p


def union(paths):
    out = pathops.Path()
    for p in paths: out = pathops.op(out, p, U)
    return out


def shifted(p, dx, dy):
    q = pathops.Path(); p.draw(TransformPen(q.getPen(), (1, 0, 0, 1, dx, dy))); return q


def poly(pts):
    p = pathops.Path(); pen = p.getPen(); pen.moveTo(pts[0])
    for q in pts[1:]: pen.lineTo(q)
    pen.closePath(); return p


def crescent(x0, y0, x1, y1, sag_top, sag_bot):
    """la cola: media luna afilada en las puntas (dos cuadraticas entre los mismos extremos)"""
    mx, my = (x0 + x1) / 2, (y0 + y1) / 2
    p = pathops.Path(); pen = p.getPen()
    pen.moveTo((x0, y0)); pen.qCurveTo((mx, my + sag_top), (x1, y1)); pen.qCurveTo((mx + 60, my + sag_bot), (x0, y0)); pen.closePath()
    return p


def svg_d(p):
    f = lambda v: "0" if abs(v) < .05 else ("%.1f" % v).rstrip("0").rstrip(".")
    seg = []
    for verb, pts in p:
        if verb == pathops.PathVerb.MOVE: seg.append("M%s %s" % tuple(map(f, pts[0])))
        elif verb == pathops.PathVerb.LINE: seg.append("L%s %s" % tuple(map(f, pts[0])))
        elif verb == pathops.PathVerb.QUAD: seg.append("Q%s %s %s %s" % tuple(map(f, pts[0] + pts[1])))
        elif verb == pathops.PathVerb.CUBIC: seg.append("C%s %s %s %s %s %s" % tuple(map(f, pts[0] + pts[1] + pts[2])))
        elif verb == pathops.PathVerb.CLOSE: seg.append("Z")
    return "".join(seg)


def build():
    font = TTFont(FONT); gs = font.getGlyphSet(); cmap = font.getBestCmap(); hmtx = font["hmtx"]
    names = [cmap[ord(ch)] for ch in WORD]
    pens, x = [], 0                                   # la fuente no trae kerning: solo avances
    for n in names: pens.append(x); x += hmtx[n][0]
    l, t, r, b = union([glyph_path(gs, n, (1, 0, 0, -1, ox, 0)) for n, ox in zip(names, pens)]).bounds
    s = min(BOX[0] / (r - l), (BOX[2] - BOX[1]) / (b - t))
    tx, base = CX - (l + r) / 2 * s, (BOX[1] + BOX[2]) / 2 - (t + b) / 2 * s
    word = union([glyph_path(gs, n, (s, 0, 0, -s, tx + ox * s, base)) for n, ox in zip(names, pens)]); word.simplify()
    origins = [tx + ox * s for ox in pens]
    L, T, R, B = word.bounds
    # la cola, como en la maqueta: de debajo de la C hasta pasada la ultima s, subiendo hacia la derecha
    tail = crescent(L + 30, B + 50, R + 10, B - 10, 22, 70); tail.simplify()
    whole = pathops.op(word, tail, U); whole.simplify()
    # filos sobre la forma entera: la forma menos ella misma bajada (luz, bordes que miran arriba) / subida (sombra)
    hi = pathops.op(whole, shifted(whole, 0, EDGE), D)
    lo = pathops.op(whole, shifted(whole, 0, -EDGE), D)
    # bandas inclinadas: el corte k pasa por el origen de la letra k en la linea base
    top, bot = T - 200, B + 200
    cut = lambda k, y: origins[k] + CUT_DX.get(k, 0) + (base - y) * SLANT
    xl = lambda k, y: L - 400 if k == 0 else cut(k, y) - OVER
    xr = lambda k, y: R + 400 if k == len(WORD) - 1 else cut(k + 1, y) + OVER
    out = []
    for k in range(len(WORD)):
        band = poly([(xl(k, bot), bot), (xl(k, top), top), (xr(k, top), top), (xr(k, bot), bot)])
        face = pathops.op(word, band, I); face.simplify()
        out.append(("big", face, pathops.op(hi, band, I), pathops.op(lo, band, I)))
    tail_only = pathops.op(tail, word, D); tail_only.simplify()
    grow = union([shifted(tail_only, dx, dy) for dx, dy in ((OVER, 0), (-OVER, 0), (0, OVER), (0, -OVER))] + [tail_only])
    out.append(("tail", tail_only, pathops.op(hi, grow, I), pathops.op(lo, grow, I)))
    cuts = [((cut(k, bot), bot), (cut(k, top), top)) for k in range(1, len(WORD))]
    return out, cuts, s


def main():
    out, cuts, s = build()
    if "--debug" in sys.argv:
        cols = ["#d9a441", "#b7d941", "#41d9a4", "#41a4d9", "#a441d9", "#d941a4", "#d96a41", "#ffffff"]
        body = "".join('<path d="%s" fill="%s" fill-opacity=".85"/>' % (svg_d(f), cols[i % len(cols)]) for i, (_, f, _, _) in enumerate(out))
        body += "".join('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="red" stroke-width="2"/>' % (a + b) for a, b in cuts)
        (Path(__file__).parent / "cousins-cortes.html").write_text(
            '<!doctype html><meta charset="utf-8"><body style="margin:0;background:#111"><svg viewBox="-60 -80 1660 480" style="width:100%%">%s</svg>' % body, encoding="utf8")
        print("cortes en tools/brand/cousins-cortes.html"); return
    rows = []
    for cls, face, h, lw in out:
        x0, y0, x1, y1 = face.bounds
        x0, y0 = math.floor(x0 - 4), math.floor(y0 - 4); w, hh = math.ceil(x1 + 4 - x0), math.ceil(y1 + 4 - y0)
        rows.append('    ["%s", "%s", %d, %d, %d, %d, "%s", "%s"],' % (cls, svg_d(face), x0, y0, w, hh, svg_d(h), svg_d(lw)))
    # js/logo.js: fuera las filas "big"/"tail" anteriores, dentro las nuevas, y el viewBox ajustado a todas las piezas
    src = LOGO.read_text(encoding="utf8")
    src = re.sub(r'^    \["(big|tail)", .*\n', "", src, flags=re.M)
    src = src.replace("  A.CS_LETTERS = [\n", "  A.CS_LETTERS = [\n" + "\n".join(rows) + "\n", 1)
    box = [list(map(float, m.groups())) for m in re.finditer(r'^    \["\w+", "[^"]*", ([-\d.]+), ([-\d.]+), ([-\d.]+), ([-\d.]+)', src, flags=re.M)]
    vb = [math.floor(min(a for a, _, _, _ in box)) - 4, math.floor(min(b for _, b, _, _ in box)) - 4]
    vb += [math.ceil(max(a + c for a, _, c, _ in box)) + 4 - vb[0], math.ceil(max(b + d for _, b, _, d in box)) + 4 - vb[1]]
    src = re.sub(r"const VB = \[[^\]]*\];", "const VB = [%d, %d, %d, %d];" % tuple(vb), src, count=1)
    LOGO.write_text(src, encoding="utf8")
    print("piezas:", len(rows), "VB:", vb, "escala:", round(s, 4))


if __name__ == "__main__":
    main()
