#!/usr/bin/env python3
"""Geolite - marca en pixel art dibujada pixel a pixel en codigo (sin IA ni reescalados): logo GEOLITE y escudo.

  GEOLITE: letras de marquesina de casino (cara dorada con bisel, bombillas a ritmo constante sobre el eje del trazo,
           canto en relieve y contorno de tinta) y la O es la Tierra con los continentes reales (Natural Earth,
           proyeccion ortografica) sombreada por bandas limpias. Detras, una placa violeta que la separa de cualquier fondo.
  Escudo:  la misma Tierra con la carta y la ficha de casino.

Salida (nativa, transparente): tools/brand/logo_native.png (200 px de ancho) y tools/brand/emblem48.png (48 px).
tools/make_icons.py los amplia por vecino mas cercano a todos los tamanos (logo.png, favicon, iconos de app, og.png).
  python tools/make_brand.py [--preview]
"""
import sys, math
from pathlib import Path
import numpy as np
from PIL import Image
sys.path.insert(0, str(Path(__file__).parent))
from pxkit import P, ROOT, canvas, blit, alpha, dilate, erode, opening, edge, shift, outline, sphere, despeckle, to_image

# ============================================================ globo
def globe(D, rim=True):
    inside, land, lit = sphere(D, lon0=-50, lat0=10)
    land = despeckle(land & inside, inside)
    a = canvas(D, D)
    ocean_ramp = [(0.80, "o1"), (0.56, "o2"), (0.30, "o3"), (0.10, "o4"), (-1, "o5")]
    land_ramp = [(0.80, "l1"), (0.56, "l2"), (0.30, "l3"), (0.10, "l4"), (-1, "l5")]
    for ramp, m in ((ocean_ramp, inside & ~land), (land_ramp, land)):
        done = np.zeros_like(m)
        for t, k in ramp:
            s = m & (lit > t) & ~done; a[s] = P[k]; done |= s
    if rim:                                                                    # luz de atmosfera: media luna fina en el borde iluminado
        ring = inside & ~erode(inside, 1)
        hi = ring & (lit > 0.45)
        a[hi & ~land] = P["o0"]; a[hi & land] = P["l0"]
    return a

# ============================================================ letras de marquesina
S = 9          # grosor del trazo
H = 31         # alto de la cara
def rects_mask(w, rects, r=2):
    m = np.zeros((H, w), bool)
    for x, y, rw, rh in rects: m[y:y + rh, x:x + rw] = True
    return opening(m, r) if r else m

GLYPHS = {   # ancho, rectangulos, radio de las esquinas, ejes (polilineas) por donde van las bombillas
    "G": (25, [(0, 0, 25, S), (0, 0, S, H), (0, H - S, 25, S), (25 - S, 14, S, H - 14), (13, 14, 12, 7), (25 - S, 0, S, 11)], 3,
          [[(21, 8), (21, 4), (4, 4), (4, 26), (21, 26), (21, 17), (16, 17)]]),
    "E": (21, [(0, 0, S, H), (0, 0, 21, S), (0, 11, 18, S), (0, H - S, 21, S)], 2,
          [[(17, 4), (4, 4), (4, 26), (17, 26)], [(4, 15), (14, 15)]]),
    "L": (20, [(0, 0, S, H), (0, H - S, 20, S)], 2, [[(4, 4), (4, 26), (16, 26)]]),
    "I": (S, [(0, 0, S, H)], 2, [[(4, 4), (4, 26)]]),
    "T": (25, [(0, 0, 25, S), (8, 0, S, H)], 2, [[(4, 4), (20, 4)], [(12, 11), (12, 26)]]),
}

def bulbs_on(paths, step=6.4):
    """puntos a paso constante a lo largo de cada polilinea (incluidos los extremos), sin repetir los cercanos"""
    pts = []
    for poly in paths:
        segs = list(zip(poly, poly[1:])); total = sum(math.dist(a, b) for a, b in segs)
        n = max(1, round(total / step)); st = total / n
        for i in range(n + 1):
            d = i * st
            for a, b in segs:
                L = math.dist(a, b)
                if d <= L + 1e-6:
                    t = d / L if L else 0; p = (round(a[0] + (b[0] - a[0]) * t), round(a[1] + (b[1] - a[1]) * t)); break
                d -= L
            if all(abs(p[0] - q[0]) + abs(p[1] - q[1]) > 3 for q in pts): pts.append(p)
    return pts

def glyph(ch):
    w, rects, r, paths = GLYPHS[ch]
    m = rects_mask(w, rects, r)
    a = canvas(w, H)
    # cara: dos bandas (la de arriba mas clara) + bisel de 1 px (luz arriba/izquierda, sombra abajo/derecha)
    a[m] = P["g3"]; up = m.copy(); up[H // 2:, :] = False; a[up] = P["g2"]
    top = edge(m, 0, -1); left = edge(m, -1, 0); bot = edge(m, 0, 1); right = edge(m, 1, 0)
    a[right & m] = P["g4"]; a[bot] = P["g4"]
    a[left] = P["g1"]; a[top] = P["g0"]
    a[top & right] = P["g2"]; a[left & bot] = P["g3"]
    # bombillas: cruz de 3x3 (centro blanco, brazos crema) en un casquillo oscuro
    for x, y in bulbs_on(paths):
        for dx, dy in ((-1, -1), (1, -1), (-1, 1), (1, 1)): a[y + dy, x + dx] = P["g1"]
        for dx, dy in ((0, -1), (-1, 0), (1, 0), (0, 1)): a[y + dy, x + dx] = P["bulb2"]
        a[y, x] = P["bulb"]; a[y + 1, x + 1] = P["g2"]
    return a, m

# ============================================================ carta y ficha
def card(w=12, h=16, tilt=4):
    """carta con cizalla limpia (1 px cada h/tilt filas), rombo rojo y cantos en crema oscura"""
    a = canvas(w + tilt + 2, h + 2); m = np.zeros(a.shape[:2], bool)
    for y in range(h):
        off = (h - 1 - y) * tilt // h
        for x in range(w):
            if (x in (0, w - 1)) and (y in (0, h - 1)): continue
            m[y + 1, x + off + 1] = True
    a[m] = P["c0"]; a[edge(m, 0, 1) | edge(m, 1, 0)] = P["c1"]
    cx, cy = (w - 1) // 2, h // 2 - 1
    rows = (0, 1, 1, 2, 2, 2, 1, 1, 0) if h >= 14 else (0, 1, 2, 1, 0)              # rombo dibujado fila a fila
    for dy, half in zip(range(-(len(rows) // 2), len(rows) // 2 + 1), rows):
        y = cy + dy; off = (h - 1 - y) * tilt // h
        for dx in range(-half, half + 1): a[y + 1, cx + dx + off + 1] = P["r0"] if dx < 0 or (dx == 0 and dy < 0) else P["r1"]
    for (px_, py_) in (((2, 2), (w - 3, h - 3)) if h >= 14 else ()):
        off = (h - 1 - py_) * tilt // h; a[py_ + 1, px_ + off + 1] = P["r1"]
    return outline(a, P["ink"])

def chip(d=13):
    """ficha vista desde arriba: aro rojo con 6 muescas blancas, filete interior y centro dorado; luz arriba-izquierda"""
    a = canvas(d + 2, d + 2); c = d / 2
    for y in range(d):
        for x in range(d):
            u, v = x + .5 - c, y + .5 - c; r = math.hypot(u, v)
            if r > c - 0.15: continue
            ang = (math.degrees(math.atan2(v, u)) + 360) % 360
            lit = (-u - v) / (c * 1.5)
            small = d < 11; step, tol = (90, 16) if small else (60, 13)
            if r > c - (2.2 if small else 2.6):
                notch = min(min((ang - k) % 360, (k - ang) % 360) for k in range(0, 360, step)) < tol
                col = ("w0" if lit > -0.2 else "w1") if notch else ("r0" if lit > 0.45 else "r1" if lit > -0.35 else "r2")
            elif r > c - 3.6 and not small: col = "r2" if lit < 0.3 else "r1"
            else: col = "g1" if lit > 0.25 else "g2" if lit > -0.35 else "g3"
            a[y + 1, x + 1] = P[col]
    return outline(a, P["ink"])

# ============================================================ composiciones
def logo():
    word = "GEOLITE"; gap = 3; D = 39; ext = 3
    parts = []
    for ch in word:
        if ch == "O": parts.append(("O", None, None, D))
        else: g, m = glyph(ch); parts.append((ch, g, m, g.shape[1]))
    ogap = 5; inner_w = sum(p[3] for p in parts) + gap * (len(parts) - 3) + ogap * 2
    pad = 5; W = 200; Hh = D + 2 * pad + ext + 12
    a = canvas(W, Hh)
    x = (W - inner_w) // 2; top = pad + 12 + (D - H) // 2
    letters = canvas(W, Hh); faces = np.zeros((Hh, W), bool); gpos = None
    for i, (ch, g, m, w) in enumerate(parts):
        if ch == "O": gpos = (x, pad + 12)
        else:
            blit(letters, g, x, top); faces[top:top + H, x:x + w] |= m
        x += w + (ogap if "O" in (ch, word[min(i + 1, len(word) - 1)]) else gap)
    # canto en relieve (3 px hacia abajo) y contorno de tinta
    body = letters.copy()
    for d in range(ext, 0, -1):
        s = shift(faces, 0, d) & ~faces
        body[s] = P["ex3"] if d == ext else P["ex2"] if d == ext - 1 else P["ex1"]
    # la parte del canto que queda justo debajo de la cara recibe un filo claro (lectura de volumen)
    body[shift(faces, 0, 1) & ~faces & (body[..., 3] > 0)] = P["ex1"]
    outline(body, P["ink"])
    G = globe(D); gl = canvas(D + 2, D + 2); blit(gl, G, 1, 1); outline(gl, P["ink"])
    blit(body, gl, gpos[0] - 1, gpos[1] - 1)
    # carta y ficha apoyadas en la parte alta derecha del globo
    cd = card(); ch_ = chip()
    cx0 = gpos[0] + D - 13; cy0 = gpos[1] - 11
    blit(body, cd, cx0, cy0); blit(body, ch_, cx0 + 9, cy0 + 8)
    # placa violeta: silueta dilatada (redondeada) con canto oscuro y brillo arriba
    sil = alpha(body); plate = dilate(sil, 3, False)
    a[plate] = P["plum"]; a[edge(plate, 0, 1) | shift(edge(plate, 0, 1), 0, -1) & plate & ~sil] = P["plum2"]
    a[edge(plate, 0, -1)] = P["plumhi"]
    ring = dilate(plate, 1) & ~plate; a[ring] = P["ink"]
    blit(a, body, 0, 0)
    # recorte al contenido
    ys, xs = np.where(alpha(a)); a = a[ys.min():ys.max() + 1]
    out = canvas(W, a.shape[0]); out[:, :] = a[:, :W]; return out

EMBLEM = {  # tamano nativo -> (diametro del globo, posicion del globo, carta (w, h, cizalla, x, y), ficha (d, x, y))
    48: (37, (1, 9), (12, 16, 4, 27, 0), (13, 31, 18)),
    32: (25, (1, 6), (8, 11, 3, 18, 0), (9, 21, 12)),
    16: (14, (0, 1), None, None),
}
def emblem(n=48):
    D, (gx, gy), cd, ch_ = EMBLEM[n]
    a = canvas(n, n); G = globe(D, rim=n > 16); gl = canvas(D + 2, D + 2); blit(gl, G, 1, 1); outline(gl, P["ink"])
    blit(a, gl, gx, gy)
    if cd: blit(a, card(*cd[:3]), cd[3], cd[4])
    if ch_: blit(a, chip(ch_[0]), ch_[1], ch_[2])
    return a

if __name__ == "__main__":
    out = ROOT / "tools" / "brand"; out.mkdir(exist_ok=True)
    L = logo(); to_image(L).save(out / "logo_native.png")
    E = emblem(); to_image(E).save(out / "emblem48.png")
    for n in (32, 16): to_image(emblem(n)).save(out / f"emblem{n}.png")
    print("logo", L.shape[1], "x", L.shape[0], "| escudo 48x48")
    if "--preview" in sys.argv:
        pv = Image.new("RGBA", (L.shape[1] * 4 + 40, L.shape[0] * 4 + 48 * 6 + 60), (24, 18, 36, 255))
        pv.alpha_composite(to_image(L).resize((L.shape[1] * 4, L.shape[0] * 4), Image.NEAREST), (20, 20))
        pv.alpha_composite(to_image(E).resize((288, 288), Image.NEAREST), (20, L.shape[0] * 4 + 40))
        pv.alpha_composite(to_image(L), (340, L.shape[0] * 4 + 40)); pv.alpha_composite(to_image(E), (340, L.shape[0] * 4 + 140))
        for i, n in enumerate((32, 16)):
            e = to_image(emblem(n)); pv.alpha_composite(e.resize((n * 6, n * 6), Image.NEAREST), (420 + i * 210, L.shape[0] * 4 + 110)); pv.alpha_composite(e, (420 + i * 210, L.shape[0] * 4 + 320))
        pv.save(sys.argv[-1] if sys.argv[-1].endswith(".png") else out / "_preview.png")
