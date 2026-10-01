#!/usr/bin/env python3
"""Cousins Studios - la C de "Cousins" dibujada a medida (fuera de la fuente) con un trazo caligrafico de pluma puntiaguda.

Cada C es una espina (curva Catmull-Rom por puntos puestos a mano) recorrida por una pluma: el trazo engorda al bajar en la direccion
de la inclinacion del script (17 grados, como Yellowtail) y adelgaza al subir o ir de lado; los extremos se afilan o acaban en bola.
  python tools/brand/cousins_c.py   -> tools/brand/cousins-c.html: hoja con las opciones de C sobre el resto de la palabra
"""
import math, sys
from pathlib import Path
import pathops
sys.path.insert(0, str(Path(__file__).parent))
import cousins_script as cs

SL = math.radians(17)
DOWN = (-math.sin(SL), math.cos(SL))            # direccion de un trazo que baja siguiendo la inclinacion (y hacia abajo)


def catmull(pts, step=3.0):
    """puntos de la espina muestreados cada ~step unidades (Catmull-Rom centripeta)"""
    P = [pts[0]] + list(pts) + [pts[-1]]
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        d = lambda a, b: max(1e-6, math.dist(a, b) ** .5)
        t0, t1 = 0, d(p0, p1); t2 = t1 + d(p1, p2); t3 = t2 + d(p2, p3)
        n = max(2, int(math.dist(p1, p2) / step))
        for k in range(n):
            t = t1 + (t2 - t1) * k / n
            def lerp(a, b, ta, tb):
                if tb - ta < 1e-9: return a
                return tuple(((tb - t) * a[j] + (t - ta) * b[j]) / (tb - ta) for j in (0, 1))
            A1, A2, A3 = lerp(p0, p1, t0, t1), lerp(p1, p2, t1, t2), lerp(p2, p3, t2, t3)
            B1, B2 = lerp(A1, A2, t0, t2), lerp(A2, A3, t1, t3)
            out.append(lerp(B1, B2, t1, t2))
    out.append(pts[-1])
    return out


def smooth_poly(pts):
    """poligono cerrado suavizado: cada vertice es control de una cuadratica entre los puntos medios"""
    p = pathops.Path(); pen = p.getPen()
    mids = [((pts[i][0] + pts[(i + 1) % len(pts)][0]) / 2, (pts[i][1] + pts[(i + 1) % len(pts)][1]) / 2) for i in range(len(pts))]
    pen.moveTo(mids[-1])
    for i in range(len(pts)): pen.qCurveTo(pts[i], mids[i])
    pen.closePath(); return p


def circle(c, r):
    k = .5523 * r; x, y = c; p = pathops.Path(); pen = p.getPen()
    pen.moveTo((x + r, y)); pen.curveTo((x + r, y + k), (x + k, y + r), (x, y + r)); pen.curveTo((x - k, y + r), (x - r, y + k), (x - r, y))
    pen.curveTo((x - r, y - k), (x - k, y - r), (x, y - r)); pen.curveTo((x + k, y - r), (x + r, y - k), (x + r, y)); pen.closePath(); return p


def pen_stroke(pts, wmin=23, wmax=56, start=("taper", 60), end=("taper", 60), extra=(), power=1.2, step=3.0):
    """trazo de pluma por la espina. start/end: ("taper", largo) | ("ball", radio) | ("flat", 0). extra: [(t, +ancho)] a lo largo (0..1)"""
    S = catmull(pts, step)
    L = [0]
    for a, b in zip(S, S[1:]): L.append(L[-1] + math.dist(a, b))
    tot = L[-1]
    def extra_at(t):
        if not extra: return 0
        e = sorted(extra)
        if t <= e[0][0]: return e[0][1]
        for (ta, wa), (tb, wb) in zip(e, e[1:]):
            if t <= tb: u = (t - ta) / (tb - ta); u = u * u * (3 - 2 * u); return wa + (wb - wa) * u
        return e[-1][1]
    W, N = [], []
    for i, p in enumerate(S):
        a, b = S[max(0, i - 2)], S[min(len(S) - 1, i + 2)]
        tx, ty = b[0] - a[0], b[1] - a[1]; n = math.hypot(tx, ty) or 1; tx, ty = tx / n, ty / n
        press = max(0.0, tx * DOWN[0] + ty * DOWN[1]) ** power
        w = wmin + (wmax - wmin) * press + extra_at(L[i] / tot)
        for (kind, ln), dist in ((start, L[i]), (end, tot - L[i])):
            if kind == "taper" and dist < ln: u = dist / ln; w *= .08 + .92 * (1 - (1 - u) ** 2)
        W.append(w); N.append((-ty, tx))
    # el ancho no salta: media movil corta
    W = [sum(W[max(0, i - 3):i + 4]) / len(W[max(0, i - 3):i + 4]) for i in range(len(W))]
    out = pathops.Path()
    CH = 30                                           # tramos cortos: ninguno se cruza consigo mismo
    for c0 in range(0, len(S) - 1, CH):
        idx = range(c0, min(len(S), c0 + CH + 1))
        left = [(S[i][0] + N[i][0] * W[i] / 2, S[i][1] + N[i][1] * W[i] / 2) for i in idx]
        right = [(S[i][0] - N[i][0] * W[i] / 2, S[i][1] - N[i][1] * W[i] / 2) for i in idx]
        out = pathops.op(out, cs.poly(left + right[::-1]), cs.U)
    for kind, i in ((start[0], 0), (end[0], -1)):
        r = start[1] if i == 0 else end[1]
        if kind == "ball": out = pathops.op(out, circle(S[i], r), cs.U)
        elif kind == "round": out = pathops.op(out, circle(S[i], W[i] / 2), cs.U)
    out.simplify()
    return out


def diamond(c, w, h, ang=SL):
    """rombo de la baraja, inclinado como el script"""
    pts = [(0, -h), (w, 0), (0, h), (-w, 0)]
    ca, sa = math.cos(ang), math.sin(ang)
    return cs.poly([(c[0] + x * ca - y * sa, c[1] + x * sa + y * ca) for x, y in pts])


# ------------------------------------------------------------------ opciones de C (coordenadas del logo; linea base y=291, altura x ~108)
def c_rubrica():
    """1 - Rubrica: cabeza enroscada hacia dentro (bola), gran ovalo inclinado y salida fina que va a buscar la o"""
    spine = [(322, 64), (350, 26), (352, -18), (320, -48), (258, -56), (188, -30), (128, 38), (98, 136), (102, 222),
             (140, 282), (208, 306), (288, 296), (346, 258), (388, 212)]
    return pen_stroke(spine, start=("ball", 29), end=("taper", 60)), None


def c_subraya():
    """2 - Subraya: la C no acaba, su panza sigue y se convierte en la cola que subraya toda la palabra"""
    spine = [(382, 14), (392, -26), (350, -56), (272, -60), (196, -32), (134, 36), (104, 132), (110, 220), (150, 286),
             (222, 322), (330, 342), (520, 350), (760, 346), (1000, 333), (1220, 312), (1410, 282)]
    return pen_stroke(spine, start=("ball", 29), end=("taper", 300),
                      extra=[(0, 0), (.42, 0), (.55, 10), (.75, 8), (1, 0)]), "replaces_tail"


def c_naipe():
    """3 - Naipe: la C lleva su propio rombo de la baraja suelto en la boca, como un punto; panza amplia y salida hacia la o"""
    spine = [(330, -44), (276, -56), (200, -30), (136, 40), (106, 138), (112, 226), (154, 288), (232, 310),
             (316, 290), (378, 238)]
    p = pen_stroke(spine, start=("round", 0), end=("taper", 60))
    return pathops.op(p, diamond((384, 40), 34, 50), cs.U), None


def c_lazo():
    """4 - Lazo: entra con un perfil fino desde abajo, hace un lazo arriba a la izquierda y cae en una panza enorme"""
    spine = [(50, 262), (110, 160), (200, 40), (280, -40), (340, -64), (380, -42), (374, 0), (332, 22), (262, 32),
             (194, 54), (142, 104), (112, 182), (118, 252), (164, 300), (240, 318), (320, 300), (372, 258), (396, 218)]
    return pen_stroke(spine, wmin=16, start=("taper", 150), end=("taper", 60)), None


OPTIONS = [("Rúbrica", "Cabeza enroscada hacia dentro que acaba en bola, como una firma a pluma. La más clásica y elegante.", c_rubrica),
           ("Subraya", "La panza de la C no termina: sigue y ella misma es la cola que subraya todo. Una sola firma de un trazo.", c_subraya),
           ("Naipe", "La C lleva un rombo de la baraja en la boca, como el punto de una i: el casino dentro de la letra. Muy reconocible.", c_naipe),
           ("Lazo", "Entra con un perfil finísimo desde abajo, hace un lazo arriba y cae en una panza enorme. La más de rotulista.", c_lazo)]


def rest_of_word():
    """o..s de la fuente, en su sitio, y la cola original"""
    from fontTools.ttLib import TTFont
    f = TTFont(cs.FONT); gs = f.getGlyphSet(); cmap = f.getBestCmap(); hm = f["hmtx"]
    names = [cmap[ord(c)] for c in cs.WORD]; pens = []; x = 0
    for n in names: pens.append(x); x += hm[n][0]
    l, t, r, b = cs.union([cs.glyph_path(gs, n, (1, 0, 0, -1, ox, 0)) for n, ox in zip(names, pens)]).bounds
    s = min(cs.BOX[0] / (r - l), (cs.BOX[2] - cs.BOX[1]) / (b - t)); tx = cs.CX - (l + r) / 2 * s; base = (cs.BOX[1] + cs.BOX[2]) / 2 - (t + b) / 2 * s
    full = cs.union([cs.glyph_path(gs, n, (s, 0, 0, -s, tx + ox * s, base)) for n, ox in zip(names, pens)])
    rest = cs.union([cs.glyph_path(gs, n, (s, 0, 0, -s, tx + ox * s, base)) for n, ox in zip(names[1:], pens[1:])])
    L, T, R, B = full.bounds
    tail = cs.crescent(L + 30, B + 50, R + 10, B - 10, 22, 70)
    oldC = cs.glyph_path(gs, names[0], (s, 0, 0, -s, tx, base))
    return rest, tail, oldC


def main():
    rest, tail, oldC = rest_of_word()
    cards = [("Actual (Yellowtail)", "La C de la fuente, de referencia.", pathops.op(pathops.op(rest, tail, cs.U), oldC, cs.U))]
    for name, desc, fn in OPTIONS:
        c, mode = fn()
        word = pathops.op(rest, c, cs.U)
        if mode != "replaces_tail": word = pathops.op(word, tail, cs.U)
        word.simplify(); cards.append((name, desc, word))
    import re
    src = cs.LOGO.read_text(encoding="utf8")
    studios = "".join('<path d="%s" fill-rule="evenodd" fill="url(#gS)"/>' % d for c, d in re.findall(r'\["(small|rule)", "([^"]*)"', src) if c == "small")
    rules = "".join('<path d="%s" fill="#e0dcd5"/>' % d for c, d in re.findall(r'\["(rule)", "([^"]*)"', src))
    body = ""
    for i, (name, desc, word) in enumerate(cards):
        num = "–" if i == 0 else str(i)
        svg = '<svg viewBox="-60 -110 1660 760"><g filter="url(#mB)"><path d="%s" fill="url(#gB)"/></g><g filter="url(#mS)">%s%s</g></svg>' % (cs.svg_d(word), studios, rules)
        body += '<article class="card"><div class="stage">%s</div><div class="meta"><div class="num">%s</div><div class="txt"><b>%s</b><p>%s</p></div><div class="mini">%s</div></div></article>' % (svg, num, name, desc, svg)
    tpl = (Path(__file__).parent / "cousins-alternativas.html").read_text(encoding="utf8")
    head = tpl[:tpl.index("<header>")]
    head = head.replace("<title>Cousins: alternativas</title>", "<title>Cousins: la C</title>")
    html = head + ('<header><h1>Cousins Studios: la C a medida</h1><p>Cuatro C dibujadas fuera de la fuente, con trazo de pluma (engorda al bajar, '
                   'adelgaza al subir) y la misma inclinación que el resto de «Cousins». Mismo metal y mismo «studios» que el logo actual; '
                   'la miniatura es la prueba a tamaño pequeño.</p></header><main id="grid">' + body + "</main></body></html>")
    (Path(__file__).parent / "cousins-c.html").write_text(html, encoding="utf8")
    print("tools/brand/cousins-c.html")


if __name__ == "__main__":
    main()
