#!/usr/bin/env python3
"""Geolite - iconos redibujados pixel a pixel en codigo (solo desarrollo). Sustituyen a los que salieron mal del generador:
formas limpias, luz siempre arriba-izquierda, rampas de color con desplazamiento de tono compartidas con el logo y
contorno indigo de 1 px (el mismo de tools/pixel_cleanup.py). Rejilla nativa 64 px, ampliada x8 (512) por vecino mas cercano.

  python tools/hand_icons.py [ids...] [--preview hoja.png]     sin ids: todos los registrados
"""
import sys, math
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, str(Path(__file__).parent))
from pxkit import ROOT, hexc, shift, dilate, erode, edge, despeckle, land_mask
import make_brand

N = 64; K = 8
OUT = ROOT / "assets" / "icons"
INK = (29, 10, 61, 255)

def ramp(*h): return [hexc(x) for x in h]
R = {   # claro -> oscuro: brillo, luz, base, sombra, sombra profunda
    "gold": ramp("fff6c8", "ffd95a", "f5a623", "c46a1b", "7f3a1a"),
    "red": ramp("ffa08f", "ff5a55", "d8283f", "9c1a3f", "5e1238"),
    "blue": ramp("a8ecff", "4cb4ff", "2a78e4", "1f4bb0", "1d2a6e"),
    "green": ramp("dcf78e", "8be05a", "3fb54a", "26804a", "1b4d3e"),
    "teal": ramp("b0ffe8", "4ee3c1", "1fb3a3", "16787f", "164a5c"),
    "purple": ramp("ecc2ff", "b36cff", "8440e0", "5a2ab0", "351a70"),
    "cream": ramp("ffffff", "fff4dc", "eedcb8", "c9aa84", "8a6a58"),
    "grey": ramp("f4f4f8", "c8cbd8", "9095ab", "5f6480", "3a3b58"),
    "brown": ramp("f2b27a", "d07f45", "a45530", "73352a", "4a2126"),
    "orange": ramp("ffd08a", "ffa244", "f06d22", "b8431f", "772720"),
    "pink": ramp("ffc9e4", "ff7ab8", "e5408f", "a82472", "6a1757"),
    "ice": ramp("ffffff", "e8f7ff", "b7e2f7", "7fb1d9", "4f73a8"),
    "sand": ramp("fff8d8", "ffe39a", "f2c46a", "c98f4a", "8a5a3a"),
    "paper": ramp("ffffff", "ffffff", "fff5de", "e6d2b0", "a88c6e"),
    "dark": ramp("6a6f96", "4a4d72", "33345a", "24234a", "181636"),
}
WHITE = hexc("ffffff")

# ============================================================ mascaras
def blank(): return np.zeros((N, N), bool)
def circle(cx, cy, r):
    y, x = np.mgrid[0:N, 0:N]; return (x + .5 - cx) ** 2 + (y + .5 - cy) ** 2 <= r * r
def ellipse(cx, cy, rx, ry):
    y, x = np.mgrid[0:N, 0:N]; return ((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2 <= 1
def rect(x, y, w, h):
    m = blank(); m[max(0, y):y + h, max(0, x):x + w] = True; return m
def rrect(x, y, w, h, r):
    m = rect(x, y, w, h)
    if r:
        for cx, cy in ((x + r, y + r), (x + w - r, y + r), (x + r, y + h - r), (x + w - r, y + h - r)):
            q = rect(min(cx, x + w - r) - (r if cx == x + r else 0), min(cy, y + h - r) - (r if cy == y + r else 0), r, r)
            m &= ~q | circle(cx, cy, r)
    return m
def poly(pts):
    im = Image.new("L", (N, N)); ImageDraw.Draw(im).polygon([(x, y) for x, y in pts], fill=255); return np.array(im) > 0
def thick_line(pts, w):
    im = Image.new("L", (N, N)); d = ImageDraw.Draw(im); d.line(pts, fill=255, width=w, joint="curve")
    for x, y in pts: d.ellipse((x - w / 2 + .5, y - w / 2 + .5, x + w / 2 - .5, y + w / 2 - .5), fill=255)
    return np.array(im) > 0
def ring(cx, cy, r0, r1): return circle(cx, cy, r1) & ~circle(cx, cy, r0)

# ============================================================ sombreado
def bevel(m, rp, soft=True):
    """cara con bisel de pixel art: brillo arriba, luz a la izquierda, sombra de 2 px abajo-derecha, base plana"""
    c = np.zeros((N, N, 4), np.uint8); c[m] = rp[2]
    inner = erode(m, 1)
    if soft:
        dk = m & ~(shift(inner, -1, -1) & inner)          # franja inferior-derecha de 2 px
        c[dk & ~edge(m, 0, -1) & ~edge(m, -1, 0)] = rp[3]
    c[edge(m, 1, 0) | edge(m, 0, 1)] = rp[4] if soft else rp[3]
    c[edge(m, -1, 0)] = rp[1]; c[edge(m, 0, -1)] = rp[0]
    c[edge(m, 0, -1) & edge(m, 1, 0)] = rp[1]; c[edge(m, -1, 0) & edge(m, 0, 1)] = rp[3]
    return c

def sphere(m, cx, cy, r, rp, light=(-.55, -.62, .56), cuts=(.82, .58, .32, .12)):
    L = np.array(light) / np.linalg.norm(light); y, x = np.mgrid[0:N, 0:N]
    u = (x + .5 - cx) / r; v = (y + .5 - cy) / r; z = np.sqrt(np.clip(1 - u * u - v * v, 0, 1))
    lit = u * L[0] + v * L[1] + z * L[2]
    c = np.zeros((N, N, 4), np.uint8); c[m] = rp[4]
    for t, col in zip(cuts[::-1], rp[3::-1]): c[m & (lit > t)] = col
    return c

def flat(m, col):
    c = np.zeros((N, N, 4), np.uint8); c[m] = col; return c

# ============================================================ lienzo por capas
class Icon:
    def __init__(self): self.a = np.zeros((N, N, 4), np.uint8)
    def add(self, part, outline=True, ink=INK):
        """pega una pieza (RGBA 64x64) con su contorno de tinta por encima de lo que ya hay"""
        m = part[..., 3] > 0
        if outline: self.a[dilate(m, 1) & ~m] = ink
        self.a[m] = part[m]; return self
    def put(self, m, col): self.a[m] = col if len(col) == 4 else (*col, 255); return self
    def img(self):
        return Image.fromarray(self.a, "RGBA").resize((N * K, N * K), Image.NEAREST)

REG = {}
def icon(*ids):
    def deco(f):
        for i in ids: REG[i] = (f, i)
        return f
    return deco

# ============================================================ tierra: continentes y globos
_CONT = {}
def _continent(lat, lon):     # misma regla que js/codex.js (A.continent)
    if lat < -60: return "an"
    if lon < -30 and lat > 12: return "na"
    if lon < -30: return "sa"
    if -30 <= lon < 60 and lat > 34: return "eu"
    if -20 <= lon < 52 and -36 < lat <= 37 and not (lon > 34 and 12 < lat < 34 and lon < 60): return "as" if (lat > 12 and lon > 26 and lat < 33 and lon < 36.5) else "af"
    if lon > 110 and lat < -8: return "oc"
    if 112 < lon < 180 and -50 < lat < 0: return "oc"
    if lon > 165 or lon < -150: return "oc"
    if lat < -8 and lon > 100: return "oc"
    return "as" if lon >= 25 else "eu"

def continent_mask(k, w=4096):
    """tierra de Natural Earth clasificada pixel a pixel con la regla de js/codex.js (asi Europa llega a los Urales)"""
    if k in _CONT: return _CONT[k]
    land = land_mask(w); h = w // 2
    lon = (np.arange(w) + .5) / w * 360 - 180; lat = 90 - (np.arange(h) + .5) / h * 180
    LO, LA = np.meshgrid(lon, lat)
    out = np.full(LO.shape, "as", "<U2")
    out[LA >= 25] = np.where(LO[LA >= 25] >= 25, "as", "eu")
    out[(LA < 25) & (LO < 25)] = "eu"
    out[(LA < -8) & (LO > 100)] = "oc"; out[(LO > 165) | (LO < -150)] = "oc"; out[(LO > 112) & (LO < 180) & (LA < 0) & (LA > -50)] = "oc"; out[(LO > 110) & (LA < -8)] = "oc"
    af = (LO >= -20) & (LO < 52) & (LA <= 37) & (LA > -36) & ~((LO > 34) & (LA > 12) & (LA < 34) & (LO < 60))
    out[af] = "af"
    arabia = ((LA > 12.3) & (LA < 30) & (LO > 43 - (LA - 12.3) * 0.6)) | ((LA >= 29.4) & (LO > 32.4) & (LO < 60) & (LA < 40))   # mar Rojo y Sinai: frontera Africa/Asia real
    out[arabia & (LO < 60) & (LA < 37)] = "as"
    out[(LO >= -30) & (LO < 60) & (LA > 34)] = "eu"
    out[(LO < -30)] = "sa"; out[(LO < -30) & (LA > 12)] = "na"
    out[LA < -60] = "an"
    for c in ("af", "an", "as", "eu", "na", "oc", "sa"): _CONT[c] = land & (out == c)
    return _CONT[k]

def ortho_mask(landm, lon0, lat0, scale, cx=32, cy=32, ss=4, thr=.5):
    """proyeccion ortografica de una mascara equirectangular; scale = px por radian"""
    lh, lw = landm.shape; la0, lo0 = math.radians(lat0), math.radians(lon0)
    o = np.arange(ss) / ss + .5 / ss; y, x = np.mgrid[0:N, 0:N]
    X = (x[..., None, None] + o[None, None, None, :] - cx) / scale; Y = -(y[..., None, None] + o[None, None, :, None] - cy) / scale
    rho = np.sqrt(X * X + Y * Y); ok = rho < 1; c = np.arcsin(np.clip(rho, 0, 1))
    with np.errstate(invalid="ignore", divide="ignore"):
        lat = np.arcsin(np.cos(c) * math.sin(la0) + np.where(rho > 0, Y * np.sin(c) * math.cos(la0) / rho, 0))
        lon = lo0 + np.arctan2(X * np.sin(c), rho * math.cos(la0) * np.cos(c) - Y * math.sin(la0) * np.sin(c))
    lon = (np.degrees(lon) + 540) % 360 - 180; lat = np.degrees(lat)
    px = np.clip(((lon + 180) / 360 * lw).astype(int), 0, lw - 1); py = np.clip(((90 - lat) / 180 * lh).astype(int), 0, lh - 1)
    v = landm[py, px] & ok
    return v.mean(axis=(2, 3)) >= thr

def fit_mask(m, box=56):
    """centra la mascara en el lienzo"""
    ys, xs = np.where(m); h, w = ys.max() - ys.min() + 1, xs.max() - xs.min() + 1
    out = blank(); oy = (N - h) // 2 - ys.min(); ox = (N - w) // 2 - xs.min()
    out[ys.min() + oy:ys.max() + oy + 1, xs.min() + ox:xs.max() + ox + 1] = m[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    return out

def drop_small(m, keep=6):
    """quita islas de menos de `keep` px (relleno por inundacion 4-conexo)"""
    m = m.copy(); seen = np.zeros_like(m)
    for y0, x0 in zip(*np.where(m)):
        if seen[y0, x0]: continue
        st = [(y0, x0)]; comp = []; seen[y0, x0] = True
        while st:
            y, x = st.pop(); comp.append((y, x))
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                yy, xx = y + dy, x + dx
                if 0 <= yy < N and 0 <= xx < N and m[yy, xx] and not seen[yy, xx]: seen[yy, xx] = True; st.append((yy, xx))
        if len(comp) < keep:
            for y, x in comp: m[y, x] = False
    return m

CONT = {  # id -> (lon0, lat0, px/radian, rampa)
    "k_af": (18, 2, 44, "orange"), "k_eu": (15, 52, 70, "pink"), "k_as": (92, 38, 30, "gold"), "k_na": (-98, 48, 38, "blue"),
    "k_sa": (-60, -20, 46, "green"), "k_oc": (140, -24, 52, "sand"), "k_an": (0, -90, 50, "ice"),
}
@icon(*CONT)
def continent(id):
    lon0, lat0, sc, rp = CONT[id]; k = id[2:]
    if k == "an": return antarctica()
    for _ in range(3):                                                        # escala para que el continente ocupe ~58 px
        m = ortho_mask(continent_mask(k), lon0, lat0, sc, ss=6)
        ys, xs = np.where(m); sc *= 58 / max(np.ptp(ys) + 1, np.ptp(xs) + 1)
    m = fit_mask(drop_small(despeckle(m), 9))
    I = Icon(); I.add(bevel(m, R[rp])); return I

def antarctica():
    """world.js trae la Antartida degenerada en el polo: se dibuja a mano en vista polar (0 grados arriba, peninsula hacia arriba-izquierda)"""
    cx, cy = 33, 35
    rad = [21, 23, 24, 24.5, 25, 25.5, 26, 25.5, 25, 24, 21.5, 16.5, 12.5, 13, 18, 21, 20.5, 19.5, 18, 16.5, 14, 13, 15, 19]
    pts = [(cx + r * math.sin(math.radians(a * 15)), cy - r * math.cos(math.radians(a * 15))) for a, r in enumerate(rad)]
    m = poly(pts)
    cl = [(cx + r * math.sin(math.radians(a)), cy - r * math.cos(math.radians(a))) for a, r in ((292, 12), (297, 17), (303, 21), (311, 25), (320, 27))]
    wd = [7, 5, 3.6, 2.5, 1.5]                                                 # peninsula: se afila hacia la punta
    L, Rr = [], []
    for i, (x, y) in enumerate(cl):
        a, b = cl[max(0, i - 1)], cl[min(len(cl) - 1, i + 1)]; dx, dy = b[0] - a[0], b[1] - a[1]; n = math.hypot(dx, dy)
        L.append((x - dy / n * wd[i], y + dx / n * wd[i])); Rr.append((x + dy / n * wd[i], y - dx / n * wd[i]))
    m |= poly(L + Rr[::-1])
    m = fit_mask(despeckle(m))
    I = Icon(); I.add(bevel(m, R["ice"])); return I

def globe_part(D, cx, cy, lon0=-40, lat0=12, flip=False):
    """el globo del logo (make_brand) colocado en el lienzo"""
    from pxkit import sphere as sph
    g = _globe(D, lon0, lat0, flip)
    part = np.zeros((N, N, 4), np.uint8); x0, y0 = int(round(cx - D / 2)), int(round(cy - D / 2))
    part[y0:y0 + D, x0:x0 + D] = g; return part

def _globe(D, lon0, lat0, flip=False, light=(-0.55, -0.62, 0.56)):
    """mismo globo que el logo (make_brand.globe); flip = continentes cabeza abajo con la luz en su sitio"""
    from pxkit import sphere as sph, P
    inside, land, lit = sph(D, lon0=lon0, lat0=lat0, light=light)
    if flip: land = land[::-1]
    land = despeckle(land & inside, inside)
    a = np.zeros((D, D, 4), np.uint8)
    for ramp_, msk in (((.80, "o1"), (.56, "o2"), (.30, "o3"), (.10, "o4"), (-1, "o5")), inside & ~land), (((.80, "l1"), (.56, "l2"), (.30, "l3"), (.10, "l4"), (-1, "l5")), land):
        done = np.zeros_like(msk)
        for t, kk in ramp_:
            s = msk & (lit > t) & ~done; a[s] = P[kk]; done |= s
    ringm = inside & ~erode(inside, 1); hi = ringm & (lit > .45); a[hi & ~land] = P["o0"]; a[hi & land] = P["l0"]
    return a

def stand(I, cx=32, top=50):
    """pie de globo terraqueo: meridiano de laton, vastago y peana"""
    arc = ring(cx, 27, 24, 26.2) & ~rect(0, 0, cx - 6, N) & rect(0, 4, N, 46)
    I.add(bevel(arc, R["gold"], soft=False))
    I.add(bevel(rect(cx - 2, top, 5, 6), R["gold"]))
    I.add(bevel(ellipse(cx + .5, top + 8, 13, 3.5) | rect(cx - 12, top + 8, 26, 2), R["brown"]))

@icon("globe", "m_classic")
def globe_stand(id):
    I = Icon(); I.add(globe_part(41, 30, 27, *((-50, 10) if id == "globe" else (20, 10))))
    stand(I, 32, 50); return I

@icon("iq_7")
def globe_crown(id):
    I = Icon(); I.add(globe_part(44, 32, 38, -50, 10))
    cr = poly([(14, 22), (14, 8), (21, 15), (27, 4), (32, 13), (37, 4), (43, 15), (50, 8), (50, 22)])
    I.add(bevel(cr, R["gold"]))
    for x, y, c in ((32, 17, "red"), (22, 18, "teal"), (42, 18, "teal")): I.add(sphere(circle(x, y, 2.6), x - .5, y - .5, 2.6, R[c]))
    return I

def _whole_globe(lon0=-50, lat0=10, D=52):
    return globe_part(D, 32, 32, lon0, lat0)

def arc_arrow(cx, cy, r, a0, a1, w=4, rp="cream"):
    """flecha curva de a0 a a1 grados (0 = arriba, sentido horario) con punta triangular"""
    pts = [(cx + r * math.sin(math.radians(a)), cy - r * math.cos(math.radians(a))) for a in np.linspace(a0, a1 - 12, 12)]
    m = thick_line(pts, w)
    t = math.radians(a1); tx, ty = cx + r * math.sin(t), cy - r * math.cos(t)
    d = math.radians(a1 - 12); bx, by = cx + r * math.sin(d), cy - r * math.cos(d)
    nx, ny = math.sin(d), -math.cos(d)
    m |= poly([(bx + nx * (w + 2.5), by + ny * (w + 2.5)), (bx - nx * (w + 2.5), by - ny * (w + 2.5)), (tx, ty)])
    return bevel(m, R[rp], soft=False)

@icon("ch_flip")
def ch_flip(id):
    g = globe_part(46, 30, 34, -50, 10, flip=True)                            # el mundo patas arriba
    I = Icon(); I.add(g); I.add(arc_arrow(32, 32, 28, 20, 115, 4)); return I

@icon("ch_mirrorx")
def ch_mirrorx(id):
    g = _whole_globe(); g[:, 32:] = g[:, :32][:, ::-1]                       # mitad reflejada
    I = Icon(); I.add(g); I.put(rect(31, 4, 2, 56) & (g[..., 3] > 0), R["ice"][0]); I.put(rect(33, 4, 1, 56) & (g[..., 3] > 0), R["ice"][3]); return I

@icon("ch_negative")
def ch_negative(id):
    D = 52; g = np.zeros((N, N, 4), np.uint8); g[6:58, 6:58] = _globe(D, -50, 10, light=(.55, .62, .3))   # luz contraria: al invertir queda arriba-izquierda
    m = g[..., 3] > 0; g[m, :3] = 255 - g[m, :3]
    I = Icon(); I.add(g); return I

@icon("ch_mosaic")
def ch_mosaic(id):
    g = _whole_globe(); m = g[..., 3] > 0; out = g.copy()
    for y in range(0, N, 8):
        for x in range(0, N, 8):
            blk = g[y:y + 8, x:x + 8]; bm = blk[..., 3] > 0
            if not bm.any(): continue
            cols, cnt = np.unique(blk[bm].reshape(-1, 4), axis=0, return_counts=True); out[y:y + 8, x:x + 8][bm] = cols[cnt.argmax()]
    I = Icon(); I.add(out)
    grid = np.zeros((N, N), bool); grid[::8, :] = True; grid[:, ::8] = True
    I.a[grid & m] = INK; return I

@icon("ch_noborders")
def ch_noborders(id):
    I = Icon(); I.add(globe_part(50, 27, 27, -50, 10))
    def quad(x0, y0, l, w_):                      # rectangulo girado 45 grados (goma de borrar)
        ux, uy = .7071, -.7071; nx, ny = .7071, .7071
        return poly([(x0, y0), (x0 + ux * l, y0 + uy * l), (x0 + ux * l + nx * w_, y0 + uy * l + ny * w_), (x0 + nx * w_, y0 + ny * w_)])
    I.add(bevel(quad(36, 50, 22, 11), R["pink"])); I.add(bevel(quad(36, 50, 7, 11), R["blue"]))
    return I


# ============================================================ fichas, monedas y cartas
def chip_top(cx, cy, r, rp, spots=8, center=None, th=3):
    """ficha de casino vista casi cenital: canto de `th` px abajo, aro con incrustaciones blancas, filete y centro"""
    parts = []
    side = circle(cx, cy + th, r) | (rect(int(cx - r), int(cy), int(2 * r), th) & ellipse(cx, cy + th / 2, r, r + th))
    sc = np.zeros((N, N, 4), np.uint8); sc[side] = R[rp][4]
    y, x = np.mgrid[0:N, 0:N]; ang = (np.degrees(np.arctan2(x + .5 - cx, -(y + .5 - cy))) + 360) % 360
    ins = lambda w: np.minimum(ang % (360 / spots), 360 / spots - ang % (360 / spots)) < w
    sc[side & ins(9) & ~circle(cx, cy, r - 1)] = R["cream"][3]
    parts.append(sc)
    top = circle(cx, cy, r); t = bevel(top, R[rp])
    band = top & ~circle(cx, cy, r - 7) & ins(10) & erode(top, 1)
    t[band] = R["cream"][1]; t[band & edge(band, 0, 1)] = R["cream"][2]; t[band & edge(band, 0, -1)] = R["cream"][0]
    fil = ring(cx, cy, r - 9, r - 7.2); t[fil] = R[rp][3]
    dash = ring(cx, cy, r - 10.4, r - 9) & ins(6); t[dash] = R["cream"][1]
    ctr = circle(cx, cy, r - 10.4); t[ctr] = R[rp][1] if center is None else R[rp][2]
    t[ctr & edge(ctr, 0, 1)] = R[rp][2]
    parts.append(t)
    return parts

CHIP_COL = {"blank_big": "orange", "blank_boss": "red", "blank_gold": "gold", "blank_small": "blue", "blank_teal": "teal",
            "chip_b": "blue", "chip_g": "green", "chip_k": "dark", "chip_p": "purple", "chip_r": "red"}
@icon(*CHIP_COL)
def chip_icon(id):
    I = Icon()
    for p_ in chip_top(32, 30, 29.5, CHIP_COL[id]): I.add(p_, outline=False)
    I.add(np.zeros((N, N, 4), np.uint8)); I.a[dilate(I.a[..., 3] > 0, 1) & ~(I.a[..., 3] > 0)] = INK
    if id.startswith("chip_"): I.add(globe_part(31, 32, 30, -50, 10))
    return I

def chip_side(cx, y, rx, rp, th=5):
    """ficha de canto (para las pilas): elipse superior + canto con rayas blancas"""
    ry = rx * .36; parts = []
    body = ellipse(cx, y + th, rx, ry) | (rect(int(cx - rx), int(y), int(2 * rx), th) & ellipse(cx, y + th / 2, rx, 99))
    sc = np.zeros((N, N, 4), np.uint8); sc[body] = R[rp][3]
    xx = np.arange(N)[None, :].repeat(N, 0); u = (xx + .5 - cx) / rx
    stripes = body & (np.abs(((np.arcsin(np.clip(u, -1, 1)) / math.pi * 8) % 2) - 1) < .32) & ~ellipse(cx, y, rx, ry)
    sc[stripes] = R["cream"][2]; sc[body & (xx < cx - rx * .55) & ~stripes & ~ellipse(cx, y, rx, ry)] = R[rp][2]
    parts.append(sc)
    top = ellipse(cx, y, rx, ry); t = np.zeros((N, N, 4), np.uint8); t[top] = R[rp][2]
    t[top & edge(top, 0, -1)] = R[rp][0]; t[ellipse(cx, y, rx * .62, ry * .62)] = R[rp][1]
    t[ellipse(cx, y, rx * .62, ry * .62) & ~ellipse(cx, y, rx * .5, ry * .5)] = R[rp][3]
    parts.append(t); return parts

def stack(I, cx, base, rx, cols, th=5):
    for i, c in enumerate(cols):
        for j, p_ in enumerate(chip_side(cx, base - i * th, rx, c, th)): I.add(p_, outline=(j == 0))

@icon("chips")
def chips_icon(id):
    I = Icon(); stack(I, 32, 52, 22, ["purple", "teal", "gold", "red", "teal", "gold", "red"], 5); return I

@icon("allin")
def allin_icon(id):
    I = Icon(); stack(I, 38, 44, 18, ["teal", "red", "gold", "purple", "teal", "red"], 5)
    stack(I, 20, 54, 16, ["red", "gold", "teal"], 5)
    for p_ in chip_top(46, 52, 11, "gold", spots=6, th=2): I.add(p_)
    return I

@icon("coin")
def coin_icon(id):
    I = Icon(); cx, cy, r = 32, 30, 28
    I.add(flat(circle(cx, cy + 3, r), R["gold"][4]))
    face = circle(cx, cy, r); t = bevel(face, R["gold"])
    t[ring(cx, cy, r - 5, r - 3.4)] = R["gold"][3]; t[ring(cx, cy, r - 5.8, r - 5)] = R["gold"][1]
    y, x = np.mgrid[0:N, 0:N]; ins = circle(cx, cy, r - 6)
    for k in (-.55, 0, .55):                          # meridianos y paralelos grabados: el doblon del explorador
        t[ins & (np.abs((x + .5 - cx) - k * np.sqrt(np.clip((r - 6) ** 2 - (y + .5 - cy) ** 2, 0, None))) < .7)] = R["gold"][3]
        t[ins & (np.abs(y + .5 - cy - k * (r - 10)) < .6)] = R["gold"][3]
    t[ins & (np.abs(x + .5 - cx - 1) < .6) & (y > cy)] = R["gold"][1]
    I.add(t); return I

# ---- palos
def pip(kind, cx, cy, s):
    """palos de la baraja de tamano s (alto aprox.)"""
    if kind == "diamond": return poly([(cx, cy - s / 2), (cx + s * .36, cy), (cx, cy + s / 2), (cx - s * .36, cy)])
    if kind == "heart":
        r = s * .27; return circle(cx - r * .95, cy - s * .18, r) | circle(cx + r * .95, cy - s * .18, r) | poly([(cx - s * .5, cy - s * .12), (cx + s * .5, cy - s * .12), (cx, cy + s * .48)])
    if kind == "spade":
        r = s * .25; m = circle(cx - r * .95, cy + s * .06, r) | circle(cx + r * .95, cy + s * .06, r) | poly([(cx - s * .48, cy + s * .02), (cx + s * .48, cy + s * .02), (cx, cy - s * .5)])
        return m | poly([(cx - s * .06, cy + s * .1), (cx + s * .06, cy + s * .1), (cx + s * .2, cy + s * .5), (cx - s * .2, cy + s * .5)])
    if kind == "club":
        r = s * .21; m = circle(cx, cy - s * .24, r) | circle(cx - r * 1.2, cy + s * .06, r) | circle(cx + r * 1.2, cy + s * .06, r)
        return m | poly([(cx - s * .05, cy - s * .1), (cx + s * .05, cy - s * .1), (cx + s * .2, cy + s * .5), (cx - s * .2, cy + s * .5)])

def card_part(x, y, w, h, back=None):
    m = rrect(x, y, w, h, 3); c = bevel(m, R["paper"])
    if back:
        inner = rrect(x + 3, y + 3, w - 6, h - 6, 2); c[inner] = R[back][2]
        yy, xx = np.mgrid[0:N, 0:N]; lat = inner & (((xx + yy) % 6 == 0) | ((xx - yy) % 6 == 0)); c[lat] = R[back][3]
        c[inner & edge(inner, 0, -1)] = R[back][1]; c[inner & edge(inner, -1, 0)] = R[back][1]
    return c, m

def shear_x(part, k, cy):
    """inclina una pieza (cizalla horizontal limpia: 1 px cada 1/k filas)"""
    out = np.zeros_like(part)
    for y in range(N): out[y] = np.roll(part[y], int(round((cy - y) * k)), 0)
    return out

def red_or_black(kind): return R["red"] if kind in ("heart", "diamond") else R["dark"]

def pip_part(kind, cx, cy, s):
    m = pip(kind, cx, cy, s); rp = red_or_black(kind); c = flat(m, rp[2])
    c[edge(m, 1, 0) | edge(m, 0, 1)] = rp[3]; c[edge(m, 0, -1) | edge(m, -1, 0)] = rp[1]; return c

@icon("ace")
def ace_icon(id):
    I = Icon(); c, m = card_part(13, 5, 38, 54); I.add(c)
    I.add(pip_part("spade", 32, 31, 24), outline=False)
    return I

def fan(I, n, kinds, spread, w=30, h=44, px=32, py=66, back=None):
    """abanico: cartas giradas alrededor de un pivote bajo (px, py); cada carta es un poligono girado con su palo"""
    for i in range(n):
        t = math.radians((i - (n - 1) / 2) * spread); ct, st = math.cos(t), math.sin(t)
        rot = lambda x, y: (px + (x - px) * ct - (y - py) * st, py + (x - px) * st + (y - py) * ct)
        x0, y0 = px - w / 2, py - h - 10
        corners = [rot(x0, y0), rot(x0 + w, y0), rot(x0 + w, y0 + h), rot(x0, y0 + h)]
        m = poly(corners); c = bevel(m, R["paper"])
        top = i == n - 1
        pcx, pcy = rot(px, y0 + h * .42) if top else rot(x0 + 7, y0 + 9); pp = pip_part(kinds[i % len(kinds)], pcx, pcy, 15 if top else 8)
        c[pp[..., 3] > 0] = pp[pp[..., 3] > 0]
        I.add(c)

@icon("cards")
def cards_icon(id):
    I = Icon(); fan(I, 3, ["club", "spade", "diamond"], 24); return I

@icon("royalflush")
def royal_icon(id):
    I = Icon(); fan(I, 5, ["heart"], 15, w=26, h=40, py=68); return I

@icon("cardback")
def cardback_icon(id):
    I = Icon(); c, m = card_part(13, 5, 38, 54, back="blue"); I.add(c)
    I.add(sphere(circle(32, 32, 9), 31, 31, 9, R["gold"])); I.add(pip_part("spade", 32, 32, 9), outline=False); return I

@icon("swapcard")
def swap_icon(id):
    I = Icon()
    c, m = card_part(4, 10, 30, 42, back="red"); I.add(c)
    c, m = card_part(28, 14, 30, 42); I.add(c); I.add(pip_part("diamond", 43, 35, 16), outline=False)
    arr = thick_line([(14, 60), (26, 60)], 3) | poly([(26, 55), (26, 64), (32, 60)])
    arr2 = thick_line([(38, 5), (50, 5)], 3) | poly([(38, 0), (38, 9), (32, 5)])
    I.add(bevel(arr, R["gold"], soft=False)); I.add(bevel(arr2, R["gold"], soft=False)); return I


# ============================================================ interfaz (se ven a 16-22 px: siluetas gruesas, poco detalle)
def star(cx, cy, ro, ri, n=5, rot=0):
    return poly([(cx + (ro if i % 2 == 0 else ri) * math.sin(math.radians(rot + i * 180 / n)), cy - (ro if i % 2 == 0 else ri) * math.cos(math.radians(rot + i * 180 / n))) for i in range(2 * n)])

def faceted_star(cx, cy, ro, ri, rp, n=5):
    """estrella con facetas: cada punta con su mitad izquierda clara y la derecha oscura (luz arriba-izquierda)"""
    m = star(cx, cy, ro, ri, n); c = bevel(m, R[rp], soft=False); L = (-.6, -.8)
    for i in range(2 * n):                      # 10 facetas: cada una mira hacia su arista exterior
        a0 = math.radians(i * 180 / n); a1 = math.radians((i + 1) * 180 / n)
        r0, r1 = (ro, ri) if i % 2 == 0 else (ri, ro)
        p0 = (cx + r0 * math.sin(a0), cy - r0 * math.cos(a0)); p1 = (cx + r1 * math.sin(a1), cy - r1 * math.cos(a1))
        ex, ey = p1[0] - p0[0], p1[1] - p0[1]; nx, ny = ey, -ex; ln = math.hypot(nx, ny); d = (nx * L[0] + ny * L[1]) / ln
        col = R[rp][1] if d > .35 else R[rp][3] if d < -.35 else R[rp][2]
        c[poly([(cx, cy), p0, p1]) & erode(m, 1)] = col
    c[erode(m, 1) & edge(m, 0, -1)] = R[rp][0]
    return c

def arrow(right=True):
    m = rect(6, 23, 30, 18) | poly([(30, 7), (58, 32), (30, 57)])
    m = opening(m, 1)
    return m if right else m[:, ::-1]

from pxkit import opening
@icon("u_next", "u_back")
def u_arrow(id):
    I = Icon(); I.add(bevel(arrow(id == "u_next"), R["paper"])); return I

@icon("u_close")
def u_close(id):
    m = thick_line([(12, 12), (52, 52)], 13) | thick_line([(52, 12), (12, 52)], 13)
    I = Icon(); I.add(bevel(m, R["red"])); return I

def magnifier(sym):
    I = Icon()
    I.add(bevel(thick_line([(40, 40), (56, 56)], 9), R["brown"]))
    I.add(bevel(circle(26, 26, 22), R["red"]))
    glass = circle(26, 26, 16); g = sphere(glass, 24, 24, 17, R["teal"]); I.add(g, outline=False)
    I.a[ring(26, 26, 16, 17.2)] = INK
    bar = rect(15, 23, 22, 7) | (rect(22, 16, 7, 21) if sym == "+" else blank())
    I.add(bevel(bar, R["paper"], soft=False)); return I

@icon("u_plus", "u_minus")
def u_mag(id): return magnifier("+" if id == "u_plus" else "-")

@icon("u_pause")
def u_pause(id):
    I = Icon(); I.add(bevel(rrect(12, 8, 15, 48, 2), R["gold"])); I.add(bevel(rrect(37, 8, 15, 48, 2), R["gold"])); return I

@icon("u_fs")
def u_fs(id):
    I = Icon()
    for sx in (0, 1):
        for sy in (0, 1):
            m = rect(6, 6, 20, 8) | rect(6, 6, 8, 20)
            if sx: m = m[:, ::-1]
            if sy: m = m[::-1]
            I.add(bevel(m, R["gold"]))
    return I

@icon("u_set")
def u_set(id):
    teeth = blank()
    for i in range(8):
        a = math.radians(i * 45); ca, sa = math.cos(a), math.sin(a)
        pts = [(-5, -30), (5, -30), (6.5, -18), (-6.5, -18)]
        teeth |= poly([(32 + x * ca - y * sa, 32 + x * sa + y * ca) for x, y in pts])
    m = (teeth | circle(32, 32, 22)) & ~circle(32, 32, 8.5)
    I = Icon(); I.add(bevel(m, R["grey"])); I.put(ring(32, 32, 12, 14.5), R["grey"][3]); return I

@icon("u_quit")
def u_quit(id):   # salir del juego (arriba a la izquierda de la portada, espejo del engranaje): boton de encendido, mismo gris
    y, x = np.mgrid[0:N, 0:N]
    a = np.arctan2(x + .5 - 32, -(y + .5 - 35))                 # angulo desde arriba: el aro se abre por donde entra la barra
    arc = opening(ring(32, 35, 16, 25.5) & (np.abs(a) > math.radians(38)), 1)
    I = Icon(); I.add(bevel(arc, R["grey"])); I.add(bevel(rrect(27, 3, 11, 32, 3), R["grey"])); return I

@icon("u_star")
def u_star(id):
    I = Icon(); I.add(faceted_star(32, 34, 30, 13, "gold")); return I

@icon("u_enter")
def u_enter(id):
    I = Icon()
    I.add(flat(rrect(4, 10, 56, 48, 5), R["paper"][4]))
    I.add(bevel(rrect(4, 6, 56, 46, 5), R["paper"]), outline=False)
    ar = thick_line([(44, 16), (44, 32), (22, 32)], 6) | poly([(24, 22), (24, 42), (12, 32)])
    I.put(ar, R["dark"][2]); return I

@icon("u_home")
def u_home(id):
    I = Icon()
    I.add(bevel(rect(14, 30, 36, 28), R["paper"]))
    I.add(bevel(rect(40, 8, 8, 18), R["brown"]))
    I.add(bevel(poly([(3, 34), (32, 6), (61, 34), (54, 38), (32, 17), (10, 38)]), R["red"]))
    I.add(bevel(rrect(26, 40, 12, 18, 2), R["brown"]))
    return I


# ============================================================ tanda 4a: gemas, astros, medallas, corazones y retos rotos
def facets(I, polys, rp, order):
    """pinta facetas (poligonos) con tonos de la rampa segun `order` (indice de la rampa por faceta) y contorno exterior"""
    whole = blank()
    for pts in polys: whole |= poly(pts)
    c = np.zeros((N, N, 4), np.uint8)
    for pts, k in zip(polys, order): c[poly(pts)] = R[rp][k]
    c[whole & edge(whole, 0, -1)] = R[rp][0]
    I.add(c); return whole

@icon("g_0")
def g0(id):
    I = Icon(); m = ellipse(32, 34, 24, 20); I.add(sphere(m, 32, 34, 24, R["grey"]))
    I.put(ellipse(24, 26, 5, 3), R["grey"][0]); return I

@icon("g_1")
def g1(id):   # talla esmeralda (octogono con mesa)
    o = [(20, 8), (44, 8), (56, 20), (56, 44), (44, 56), (20, 56), (8, 44), (8, 20)]
    t = [(24, 18), (40, 18), (46, 24), (46, 40), (40, 46), (24, 46), (18, 40), (18, 24)]
    pol = [[o[i], o[(i + 1) % 8], t[(i + 1) % 8], t[i]] for i in range(8)] + [t]
    I = Icon(); facets(I, pol, "green", [0, 2, 3, 3, 4, 3, 1, 1, 1]); I.put(poly([(24, 20), (30, 20), (22, 28), (20, 26)]), R["green"][0]); return I

@icon("g_2")
def g2(id):   # talla brillante de perfil
    pol = [[(16, 12), (24, 12), (20, 24), (6, 24)], [(24, 12), (40, 12), (44, 24), (20, 24)], [(40, 12), (48, 12), (58, 24), (44, 24)],
           [(6, 24), (20, 24), (32, 58)], [(20, 24), (32, 24), (32, 58)], [(32, 24), (44, 24), (32, 58)], [(44, 24), (58, 24), (32, 58)]]
    I = Icon(); facets(I, pol, "purple", [1, 0, 2, 1, 2, 3, 4]); I.put(poly([(26, 14), (32, 14), (28, 20), (24, 20)]), WHITE); return I

@icon("g_3")
def g3(id):
    I = Icon(); I.add(faceted_star(32, 34, 30, 13, "gold")); I.add(sphere(circle(32, 35, 6), 31, 34, 6, R["red"])); return I

@icon("a_sun")
def a_sun(id):
    I = Icon(); rays = blank()
    for i in range(12):
        a = math.radians(i * 30); w = 5 if i % 2 == 0 else 3.5; r = 30 if i % 2 == 0 else 26
        rays |= poly([(32 + 19 * math.sin(a - .28), 32 - 19 * math.cos(a - .28)), (32 + r * math.sin(a), 32 - r * math.cos(a)), (32 + 19 * math.sin(a + .28), 32 - 19 * math.cos(a + .28))])
    I.add(bevel(rays, R["orange"], soft=False)); I.add(sphere(circle(32, 32, 18), 32, 32, 18, R["gold"])); return I

@icon("a_comet")
def a_comet(id):
    I = Icon(); tail = blank()
    for i, (rp_, w) in enumerate((("purple", 18), ("blue", 12), ("ice", 6))):
        tail = thick_line([(8, 58), (40, 26)], w); I.add(bevel(tail & ~circle(8, 58, 10 - i * 2) | (tail & circle(40, 26, 20)), R[rp_], soft=False), outline=(i == 0))
    I.add(sphere(circle(44, 21, 13), 44, 21, 13, R["ice"])); return I

@icon("flash")
def flash_icon(id):
    m = poly([(38, 2), (12, 36), (29, 36), (22, 62), (52, 24), (35, 24), (44, 2)])
    I = Icon(); I.add(bevel(m, R["gold"])); return I

@icon("earplugs")
def earplugs(id):
    I = Icon()
    I.add(bevel(thick_line([(18, 50), (22, 60), (42, 60), (46, 50)], 3), R["blue"], soft=False))
    for cx in (18, 46):
        cap = rrect(cx - 9, 8, 18, 44, 8)
        c = bevel(cap, R["orange"])
        for y in range(16, 48, 7): c[rect(cx - 8, y, 16, 1) & erode(cap, 1)] = R["orange"][3]
        I.add(c)
    return I

@icon("ch_spread")
def ch_spread(id):
    I = Icon()
    burst = blank()
    for i in range(8):
        a = math.radians(i * 45 + 22); burst |= thick_line([(32 + 5 * math.sin(a), 32 - 5 * math.cos(a)), (32 + 11 * math.sin(a), 32 - 11 * math.cos(a))], 2)
    I.add(flat(burst, R["gold"][1]), outline=False)
    for k, (x, y), rp_ in (("na", (-3, -3), "blue"), ("eu", (34, -2), "pink"), ("sa", (2, 34), "green"), ("af", (34, 33), "orange")):
        lon0, lat0, sc, _ = CONT["k_" + k]
        m = ortho_mask(continent_mask(k), lon0, lat0, sc * .5, cx=14, cy=14, ss=4)
        m = drop_small(despeckle(m), 6)
        big = np.zeros((N, N), bool); ys, xs = np.where(m); big[np.clip(ys + y, 0, N - 1), np.clip(xs + x, 0, N - 1)] = True
        I.add(bevel(big, R[rp_]))
    return I

@icon("ch_babel")
def ch_babel(id):
    I = Icon()
    for i in range(5):
        w = 52 - i * 9; y = 56 - i * 10
        I.add(bevel(rect(32 - w // 2, y - 8, w, 9), R["sand"]))
        for d in range(-w // 2 + 4, w // 2 - 3, 6): I.put(rect(32 + d, y - 5, 2, 3), R["sand"][4])
    I.add(bevel(poly([(27, 8), (37, 8), (35, 2), (29, 2)]), R["sand"]))
    return I

def heart_mask(cx=32, cy=34, s=54):
    r = s * .26; return circle(cx - r * .92, cy - s * .16, r) | circle(cx + r * .92, cy - s * .16, r) | poly([(cx - s * .5, cy - s * .08), (cx + s * .5, cy - s * .08), (cx, cy + s * .46)])

@icon("heart", "heartperk")
def heart_icon(id):
    I = Icon(); m = heart_mask(); c = bevel(m, R["red"])
    c[ellipse(22, 22, 5, 3.5) & m] = R["red"][0]; c[circle(19, 26, 1.6)] = R["red"][1]
    I.add(c)
    if id == "heartperk":
        I.add(bevel(rect(44, 36, 16, 6) | rect(49, 31, 6, 16), R["gold"]))
    return I

MEDAL = {"medal_gold": "gold", "medal_silver": "grey", "medal_bronze": "brown"}
@icon(*MEDAL)
def medal(id):
    I = Icon()
    I.add(bevel(poly([(12, 2), (26, 2), (38, 30), (26, 34)]), R["blue"]))
    I.add(bevel(poly([(52, 2), (38, 2), (26, 30), (38, 34)]), R["red"]))
    rp_ = MEDAL[id]; I.add(sphere(circle(32, 42, 19), 31, 41, 19, R[rp_]))
    I.add(faceted_star(32, 43, 11, 4.5, rp_)); return I

@icon("m_rank")
def m_rank(id):   # clasificacion de la portada: podio de oro, plata y bronce con la estrella del primero encima
    I = Icon()
    I.add(bevel(rect(2, 36, 21, 25), R["grey"]))
    I.add(bevel(rect(41, 43, 21, 18), R["brown"]))
    I.add(bevel(rect(20, 26, 24, 35), R["gold"]))
    DIG = {1: (".#.", "##.", ".#.", ".#.", "###"), 2: ("##.", "..#", ".#.", "#..", "###"), 3: ("##.", "..#", ".#.", "..#", "##.")}   # cifras de 3x5 a x2
    for n, x, y, w, rp_ in ((2, 2, 36, 21, "grey"), (3, 41, 43, 21, "brown"), (1, 20, 26, 24, "gold")):
        I.put(rect(x + 1, y + 1, w - 2, 3), R[rp_][1]); I.put(rect(x + 1, y + 4, w - 2, 1), R[rp_][3])   # tapa de cada escalon
        dx, dy = x + w // 2 - 3, y + 7 + (4 if n == 1 else 0)
        for r_, row in enumerate(DIG[n]):
            for c_, ch in enumerate(row):
                if ch == "#": I.put(rect(dx + 2 * c_, dy + 2 * r_, 2, 2), R[rp_][4])
    I.add(faceted_star(32, 13, 12, 5, "gold"))
    return I

def cursor(x, y, s=1.0):
    pts = [(0, 0), (0, 36), (9, 28), (15, 41), (22, 38), (16, 25), (27, 25)]
    return poly([(x + px * s, y + py * s) for px, py in pts])

@icon("ch_blindspot")
def ch_blindspot(id):
    I = Icon(); I.add(bevel(cursor(22, 16, 1.15), R["paper"]))
    I.add(sphere(circle(21, 19, 14), 18, 16, 14, R["dark"])); I.a[ring(21, 19, 14, 15.2)] = INK
    return I

@icon("gamer")
def gamer(id):
    I = Icon(); I.add(bevel(thick_line([(32, 10), (32, 4), (44, 2)], 3), R["grey"], soft=False))
    body = opening(ellipse(32, 36, 19, 25), 1); I.add(bevel(body, R["dark"]))
    I.put(rect(31, 12, 2, 18) & body, INK); I.put(rect(14, 30, 36, 1) & body, INK)
    I.put(rect(30, 16, 4, 9), R["red"][1]); I.put(rect(17, 44, 30, 3) & erode(body, 2), R["teal"][1]); return I

@icon("deck_blind")
def dark_glasses(id):
    I = Icon(); I.add(bevel(thick_line([(4, 26), (10, 22), (54, 22), (60, 26)], 4), R["gold"], soft=False))
    for cx in (18, 46):
        I.add(bevel(circle(cx, 32, 13), R["gold"]))
        I.add(sphere(circle(cx, 32, 10), cx - 2, 30, 10, R["dark"]), outline=False)
        I.put(rect(cx - 6, 26, 3, 2), R["dark"][0])
    I.add(bevel(thick_line([(29, 30), (35, 30)], 4), R["gold"], soft=False)); return I

@icon("blindperk")
def blindfold(id):
    I = Icon()
    band = poly([(2, 24), (62, 20), (62, 38), (2, 42)])
    I.add(bevel(thick_line([(50, 38), (58, 56)], 7), R["red"])); I.add(bevel(thick_line([(46, 38), (44, 58)], 6), R["red"]))
    I.add(bevel(band, R["red"]))
    I.put(rect(2, 34, 60, 2) & band, R["red"][3])
    I.add(bevel(ellipse(48, 30, 8, 9), R["red"]))
    return I


# ============================================================ tanda 4b: retos (lenguaje comun: fichas de letra, mini-mapa, puntero)
FONT = {  # 5x7
    "A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"], "B": ["11110", "10001", "11110", "10001", "10001", "10001", "11110"],
    "R": ["11110", "10001", "10001", "11110", "10100", "10010", "10001"], "K": ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
    "E": ["11111", "10000", "11110", "10000", "10000", "10000", "11111"], "L": ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
    "O": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"], "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
    "M": ["10001", "11011", "10101", "10101", "10001", "10001", "10001"], "N": ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
    "G": ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
    "Y": ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
}
def glyph_mask(ch, x, y, k=2, flipx=False, flipy=False):
    g = [r[::-1] if flipx else r for r in FONT[ch]]; g = g[::-1] if flipy else g
    m = blank()
    for j, row in enumerate(g):
        for i, b in enumerate(row):
            if b == "1": m[y + j * k:y + j * k + k, x + i * k:x + i * k + k] = True
    return m

def tile(I, x, y, ch=None, w=20, h=24, k=2, rp="paper", ink=None, **kw):
    I.add(flat(rrect(x, y + 3, w, h, 3), R[rp][4]))
    I.add(bevel(rrect(x, y, w, h, 3), R[rp]), outline=False)
    if ch:
        gm = glyph_mask(ch, x + (w - 5 * k) // 2, y + (h - 7 * k) // 2, k, **kw); I.put(gm, ink or R["dark"][2])

def shake_lines(I, x, y, h, side):
    for i, dy in enumerate((0, h // 2 - 2, h - 4)):
        I.put(rect(x + side * (i % 2) * 2, y + dy, 3, 2), R["paper"][1])

@icon("ch_shaky")
def ch_shaky(id):
    I = Icon(); tile(I, 14, 10, "A", 36, 42, 4); shake_lines(I, 6, 14, 34, -1); shake_lines(I, 55, 14, 34, 1); return I

@icon("ch_missing")
def ch_missing(id):
    I = Icon(); tile(I, 2, 20, "M", 18, 22); tile(I, 44, 20, "L", 18, 22)
    ghost = rrect(23, 20, 18, 22, 3); I.put(ghost & ~erode(ghost, 1) & ((np.indices((N, N)).sum(0) % 3) == 0), R["paper"][2])
    return I

def curved(I, x0, x1, y, up, rp="gold"):
    pts = [(x0 + (x1 - x0) * t, y + (-1 if up else 1) * 9 * math.sin(math.pi * t)) for t in np.linspace(0, .82, 8)]
    m = thick_line(pts, 3); d = 1 if x1 > x0 else -1
    m |= poly([(x1 - d * 7, y - 5), (x1 - d * 7, y + 5), (x1, y)] if True else [])
    I.add(bevel(m, R[rp], soft=False))

@icon("ch_swap")
def ch_swap(id):
    I = Icon(); tile(I, 4, 20, "A", 22, 26); tile(I, 38, 20, "B", 22, 26)
    curved(I, 14, 52, 12, True); curved(I, 50, 12, 56, False); return I

@icon("ch_mirror")
def ch_mirror(id):
    I = Icon(); tile(I, 12, 8, "R", 40, 46, 5, flipx=True); return I

@icon("ch_upside")
def ch_upside(id):
    I = Icon(); tile(I, 12, 10, "A", 40, 44, 5, flipy=True); return I

@icon("ch_runes")
def ch_runes(id):
    I = Icon(); I.add(flat(rrect(10, 10, 44, 50, 6), R["grey"][4])); I.add(bevel(rrect(10, 6, 44, 50, 6), R["grey"]), outline=False)
    rune = thick_line([(26, 16), (26, 46)], 4) | thick_line([(26, 16), (38, 24), (26, 32), (40, 46)], 4)
    I.put(rune, R["purple"][1]); I.put(rune & edge(rune, 0, 1), R["purple"][3]); return I

@icon("ch_novowels")
def ch_novowels(id):
    I = Icon(); tile(I, 12, 8, "A", 40, 46, 5)
    I.add(bevel(thick_line([(10, 10), (54, 54)], 7) | thick_line([(54, 10), (10, 54)], 7), R["red"])); return I

@icon("ch_anagram")
def ch_anagram(id):
    I = Icon()
    for (x, y, ch) in ((4, 30, "O"), (22, 8, "M"), (40, 30, "R")): tile(I, x, y, ch, 20, 24)
    return I

@icon("ch_dance")
def ch_dance(id):
    I = Icon()
    for (x, y, ch) in ((2, 22, "B"), (22, 8, "O"), (42, 26, "L")):
        tile(I, x, y, ch, 20, 24); I.put(rect(x + 6, y + 30, 8, 2), R["dark"][1])
    return I

@icon("ch_scroll")
def ch_scroll(id):
    I = Icon(); I.add(bevel(rrect(2, 14, 60, 36, 5), R["red"]))
    inner = rrect(7, 19, 50, 26, 3); I.put(inner, R["dark"][3])
    for x in range(8, 58, 6):
        for y in (16, 47): I.put(rect(x, y, 2, 2), R["gold"][0])
    I.put(glyph_mask("G", 10, 25, 2), R["gold"][1])
    for i, ch in enumerate("EO"): I.put(glyph_mask(ch, 22 + i * 12, 25, 2), R["gold"][1])
    I.add(bevel(poly([(48, 24), (56, 32), (48, 40)]), R["gold"], soft=False)); return I

@icon("ch_riddle")
def ch_riddle(id):
    I = Icon()
    I.add(bevel(rect(12, 8, 40, 48), R["sand"]))
    for y in (6, 52): I.add(bevel(rrect(6, y, 52, 8, 4), R["brown"]))
    I.put(glyph_mask("?", 22, 17, 4), R["red"][2]); return I

@icon("ch_memory")
def ch_memory(id):
    I = Icon()
    body = ellipse(28, 34, 19, 14); tail = poly([(44, 34), (60, 20), (56, 34), (60, 48)])
    I.add(bevel(tail, R["orange"])); I.add(bevel(body, R["orange"]))
    I.put(poly([(22, 22), (30, 14), (34, 22)]), R["orange"][1])
    I.put(circle(18, 30, 3.2), WHITE); I.put(circle(17, 31, 1.6), INK)
    for x, y, r in ((6, 14, 3), (12, 6, 2)): I.add(bevel(circle(x, y, r), R["ice"], soft=False))
    return I

# ---- mini-mapa
def minimap(I, x=4, y=6, w=56, h=52, land=True):
    I.add(bevel(rrect(x, y, w, h, 5), R["blue"]))
    if land:
        m = blank()
        m |= ellipse(x + w * .34, y + h * .42, w * .2, h * .24) | ellipse(x + w * .42, y + h * .62, w * .12, h * .2)
        m |= ellipse(x + w * .7, y + h * .34, w * .16, h * .14) | ellipse(x + w * .72, y + h * .66, w * .11, h * .15)
        m &= erode(rrect(x, y, w, h, 5), 3)
        I.add(bevel(m, R["green"]), outline=False)
        return m
    return blank()

def cloud(cx, cy, s):
    return circle(cx - s * .45, cy + s * .08, s * .32) | circle(cx, cy - s * .12, s * .42) | circle(cx + s * .45, cy + s * .1, s * .3) | rect(int(cx - s * .6), int(cy + s * .05), int(s * 1.2), int(s * .34))

@icon("ch_clouds")
def ch_clouds(id):
    I = Icon(); minimap(I)
    for cx, cy, s in ((22, 24, 26), (44, 44, 24)): I.add(bevel(cloud(cx, cy, s), R["grey"]))
    return I

@icon("ch_rain")
def ch_rain(id):
    I = Icon()
    for x in range(10, 56, 9):
        for y in (40, 52):
            I.add(bevel(thick_line([(x + (y - 40) // 3, y), (x - 3 + (y - 40) // 3, y + 7)], 3), R["blue"], soft=False))
    I.add(bevel(cloud(32, 20, 44), R["grey"])); return I

@icon("ch_lightning")
def ch_lightning(id):
    I = Icon(); I.add(bevel(poly([(34, 22), (20, 44), (30, 44), (24, 62), (44, 36), (34, 36), (40, 22)]), R["gold"]))
    I.add(bevel(cloud(32, 18, 46), R["dark"])); return I

@icon("ch_dark")
def ch_dark(id):
    I = Icon(); I.add(bevel(rrect(4, 6, 56, 52, 5), R["dark"]))
    lit = circle(34, 34, 14); c = np.zeros((N, N, 4), np.uint8); c[lit] = R["blue"][2]
    land = ellipse(30, 32, 10, 8) & lit; c[land] = R["green"][2]; c[land & edge(land, 0, -1)] = R["green"][0]
    I.add(c, outline=False); I.a[ring(34, 34, 14, 15.2)] = R["gold"][1]
    I.add(bevel(cursor(38, 36, .55), R["paper"])); return I

@icon("ch_flicker")
def ch_flicker(id):
    I = Icon()
    for i, y in enumerate((44, 49, 54)): I.add(bevel(rrect(24 + (i == 2) * 2, y, 16 - (i == 2) * 4, 5, 2), R["grey"]))
    I.add(sphere(circle(32, 25, 17) | poly([(22, 34), (42, 34), (38, 44), (26, 44)]), 28, 20, 18, R["gold"], cuts=(.7, .35, 0, -.4)))
    I.put(thick_line([(28, 40), (28, 30), (32, 34), (36, 30), (36, 40)], 1), R["orange"][3])
    for a in (-70, -30, 30, 70):
        t = math.radians(a); I.add(bevel(thick_line([(32 + 22 * math.sin(t), 25 - 22 * math.cos(t)), (32 + 29 * math.sin(t), 25 - 29 * math.cos(t))], 3), R["gold"], soft=False))
    return I

@icon("ch_wrongborders")
def ch_wrongborders(id):
    I = Icon(); m = minimap(I)
    yy, xx = np.indices((N, N)); dash = (np.abs(xx - 30 - (yy - 30) * .5) < 1.5) & ((yy // 4) % 2 == 0) & erode(rrect(4, 6, 56, 52, 5), 3)
    I.put(dash, R["red"][1]); I.put(dilate(dash, 1) & ~dash & erode(rrect(4, 6, 56, 52, 5), 3) & ((yy // 4) % 2 == 0), R["red"][3]); return I

@icon("ch_pangea")
def ch_pangea(id):
    I = Icon(); m = blank()
    for k, (x, y), sc_ in (("na", (-12, -14), .6), ("sa", (-2, 14), .6), ("af", (14, 6), .62), ("eu", (12, -12), .55)):
        lon0, lat0, sc, _ = CONT["k_" + k]
        mm = ortho_mask(continent_mask(k), lon0, lat0, sc * sc_, cx=32 + x, cy=32 + y, ss=3)
        m |= mm
    m = dilate(m, 1, False); m = opening(m, 1); m = drop_small(m, 20)
    I.add(bevel(m, R["green"])); return I

@icon("ch_shuffle")
def ch_shuffle(id):
    I = Icon()
    for k, (cx, cy), rp_, f in (("sa", (17, 36), "green", .62), ("af", (46, 34), "orange", .55)):
        lon0, lat0, sc, _ = CONT["k_" + k]
        I.add(bevel(drop_small(despeckle(ortho_mask(continent_mask(k), lon0, lat0, sc * f, cx=cx, cy=cy, ss=4)), 8), R[rp_]))
    curved(I, 14, 50, 11, True, "paper"); curved(I, 50, 14, 52, False, "paper"); return I

@icon("ch_tilt")
def ch_tilt(id):
    I = Icon(); lon0, lat0, sc, _ = CONT["k_af"]
    m = ortho_mask(continent_mask("af"), lon0, lat0, sc * .8, cx=30, cy=34, ss=4)
    m = np.array(Image.fromarray(m.astype(np.uint8) * 255).rotate(-35, Image.NEAREST, center=(30, 34))) > 0
    I.add(bevel(despeckle(m), R["orange"])); I.add(arc_arrow(32, 32, 28, 300, 380, 4)); return I

@icon("ch_spin")
def ch_spin(id):
    I = Icon(); I.add(bevel(circle(32, 32, 30), R["gold"]))
    y, x = np.mgrid[0:N, 0:N]; ang = (np.degrees(np.arctan2(x + .5 - 32, -(y + .5 - 32))) + 360) % 360
    pk = ring(32, 32, 17, 26.5); c = np.zeros((N, N, 4), np.uint8)
    c[pk & ((ang // 20) % 2 == 0)] = R["red"][2]; c[pk & ((ang // 20) % 2 == 1)] = R["dark"][3]; c[pk & (ang < 20)] = R["green"][2]
    I.add(c, outline=False); I.a[ring(32, 32, 26.5, 27.5)] = INK
    for a in range(0, 360, 20):
        t = math.radians(a); I.put(thick_line([(32 + 17 * math.sin(t), 32 - 17 * math.cos(t)), (32 + 26 * math.sin(t), 32 - 26 * math.cos(t))], 1), INK)
    I.add(globe_part(31, 32, 32, -50, 10)); return I

@icon("ch_myopia")
def ch_myopia(id):
    I = Icon(); I.add(bevel(thick_line([(4, 26), (10, 22), (54, 22), (60, 26)], 4), R["red"], soft=False))
    for cx in (18, 46):
        I.add(bevel(circle(cx, 32, 14), R["red"]))
        I.add(sphere(circle(cx, 32, 10), cx - 2, 30, 10, R["teal"]), outline=False)
        for r in (4, 7): I.put(ring(cx, 32, r, r + 1), R["teal"][0])
    I.add(bevel(thick_line([(29, 30), (35, 30)], 4), R["red"], soft=False)); return I

@icon("ch_blur")
def ch_blur(id):
    I = Icon(); I.add(bevel(ellipse(32, 32, 30, 20), R["paper"]))
    I.add(sphere(circle(32, 32, 14), 29, 29, 14, R["teal"]), outline=False)
    I.put(circle(32, 32, 6), INK); I.put(ring(32, 32, 14, 16.5) & ((np.indices((N, N)).sum(0) % 2) == 0), R["teal"][1]); I.put(circle(28, 27, 2.4), WHITE)
    return I

@icon("ch_quake")
def ch_quake(id):
    I = Icon(); m = minimap(I, 4, 10, 56, 44)
    crack = thick_line([(22, 10), (28, 22), (22, 30), (32, 40), (28, 54)], 3); I.put(crack & rrect(4, 10, 56, 44, 5), INK)
    for x, s in ((2, -1), (60, 1)):
        for y in (18, 30, 42): I.put(rect(x - (s < 0) * 0, y, 2, 6), R["paper"][1])
    return I

@icon("ch_drift")
def ch_drift(id):
    I = Icon()
    for y, w in ((18, 14), (30, 20), (42, 12)): I.add(bevel(rrect(2, y, w, 4, 2), R["paper"], soft=False))
    minimap(I, 18, 10, 44, 44); return I

def pin(cx, cy, r, rp):
    m = circle(cx, cy, r) | poly([(cx - r * .8, cy + r * .5), (cx + r * .8, cy + r * .5), (cx, cy + r * 2.2)])
    c = bevel(m, R[rp]); c[circle(cx, cy - 1, r * .38)] = R["paper"][1]; return c

@icon("ch_decoys")
def ch_decoys(id):
    I = Icon(); I.add(pin(14, 16, 9, "purple")); I.add(pin(50, 18, 9, "purple")); I.add(pin(32, 26, 12, "red")); return I

# ---- puntero
@icon("ch_tremble")
def ch_tremble(id):
    I = Icon(); I.add(bevel(cursor(20, 8, 1.2), R["paper"]))
    for (x, y) in ((8, 14), (6, 26), (8, 38), (52, 30), (54, 42), (50, 54)): I.put(rect(x, y, 4, 2), R["paper"][1])
    return I

@icon("ch_blink")
def ch_blink(id):
    I = Icon(); c = bevel(cursor(18, 8, 1.2), R["paper"]); rows = (np.arange(N) // 3) % 2 == 1; c[rows] = 0
    I.add(c); I.add(faceted_star(50, 14, 10, 3, "gold", n=4)); return I

@icon("ch_ghost")
def ch_ghost(id):
    I = Icon(); body = circle(32, 26, 20) | rect(12, 26, 40, 22)
    for i in range(5): body &= ~circle(16 + i * 8, 50, 4) if i % 2 else body
    for i in (0, 2, 4): body &= ~circle(12 + i * 10 + 5, 50, 3.6)
    I.add(bevel(body, R["ice"]))
    for x in (24, 40): I.put(ellipse(x, 26, 3.4, 5), INK)
    return I

@icon("ch_cblur")
def ch_cblur(id):
    I = Icon(); halo = dilate(cursor(20, 10, 1.15), 3, False); I.add(flat(halo, R["purple"][1]), outline=False)
    c = flat(dilate(cursor(20, 10, 1.15), 1, False) & ~cursor(20, 10, 1.15), R["purple"][0]); I.add(c, outline=False)
    I.add(bevel(cursor(20, 10, 1.15), R["paper"]), outline=False); return I

@icon("ch_lag")
def ch_lag(id):
    I = Icon()
    for i, (x, y) in enumerate(((2, 2), (12, 11))): I.add(flat(cursor(x, y, 1.0), R["purple"][1 + i]), outline=False)
    I.add(bevel(cursor(24, 20, 1.0), R["paper"])); return I

@icon("ch_cmirror")
def ch_cmirror(id):
    I = Icon(); a = bevel(cursor(2, 6, .9), R["paper"]); I.add(a); b = bevel(cursor(2, 6, .9), R["paper"])[:, ::-1].copy(); I.add(b)
    I.add(bevel(thick_line([(22, 56), (42, 56)], 3) | poly([(18, 56), (24, 50), (24, 62)]) | poly([(46, 56), (40, 50), (40, 62)]), R["gold"], soft=False)); return I

@icon("ch_dizzy")
def ch_dizzy(id):
    I = Icon(); orb = ring(32, 32, 26, 28) & ((np.indices((N, N))[1] // 3) % 2 == 0); I.put(orb, R["purple"][1])
    I.add(bevel(cursor(24, 16, 1.0), R["paper"]))
    for (x, y) in ((8, 20), (54, 42), (46, 8)): I.add(faceted_star(x, y, 7, 2.5, "gold", n=4))
    return I


# ============================================================ tanda 4c: reliquias y logros confusos
def flame(cx, by, h, w):
    return poly([(cx, by - h), (cx + w * .35, by - h * .55), (cx + w * .5, by - h * .2), (cx + w * .42, by), (cx - w * .42, by), (cx - w * .5, by - h * .25), (cx - w * .2, by - h * .5)]) | ellipse(cx, by - h * .22, w * .48, h * .24)

def shield_mask(cx=32, top=4, w=48, h=56):
    return poly([(cx - w / 2, top), (cx + w / 2, top), (cx + w / 2, top + h * .45), (cx, top + h), (cx - w / 2, top + h * .45)])

@icon("streakguard")
def streakguard(id):
    I = Icon(); sh = opening(shield_mask(), 2); I.add(bevel(sh, R["blue"]))
    I.put(erode(sh, 4) & ~erode(sh, 5), R["blue"][1])
    f = flame(32, 48, 32, 22); I.add(bevel(f, R["orange"])); I.add(bevel(flame(32, 47, 16, 11), R["gold"]), outline=False); return I

@icon("a_volcano")
def a_volcano(id):
    I = Icon()
    for (x, y, r) in ((24, 10, 5), (34, 6, 6), (42, 13, 4)): I.add(bevel(circle(x, y, r), R["grey"]))
    I.add(bevel(poly([(2, 60), (22, 26), (42, 26), (62, 60)]), R["brown"]))
    lava = poly([(24, 26), (40, 26), (38, 34), (42, 44), (36, 40), (32, 50), (28, 38), (22, 42)])
    I.add(bevel(lava, R["orange"]), outline=False); I.put(rect(24, 24, 16, 4), R["red"][1]); return I

@icon("a_inf")
def a_inf(id):
    m = blank()
    for t in np.linspace(0, 2 * math.pi, 200):
        x = 32 + 26 * math.cos(t) / (1 + math.sin(t) ** 2); y = 32 + 26 * math.sin(t) * math.cos(t) / (1 + math.sin(t) ** 2)
        m |= circle(x, y, 5)
    I = Icon(); I.add(bevel(m, R["gold"])); return I

@icon("a_hundred")
def a_hundred(id):
    I = Icon(); tag = poly([(14, 6), (50, 6), (58, 18), (58, 58), (6, 58), (6, 18)]); I.add(bevel(tag, R["gold"]))
    I.put(circle(32, 15, 4), INK); I.put(circle(32, 15, 2.4), R["dark"][2])
    one = rect(14, 28, 4, 22) | rect(11, 30, 4, 3); I.put(one, R["red"][2])
    for x in (22, 40): I.put(ring(x + 5, 39, 4, 7.5) & rect(0, 28, N, 22), R["red"][2])
    return I

@icon("t_strait")
def t_strait(id):
    I = Icon(); I.add(bevel(rrect(4, 4, 56, 56, 6), R["blue"]))
    left = poly([(4, 4), (30, 4), (26, 22), (30, 34), (24, 60), (4, 60)]) & rrect(4, 4, 56, 56, 6)
    right = poly([(38, 4), (60, 4), (60, 60), (32, 60), (36, 40), (32, 28), (38, 18)]) & rrect(4, 4, 56, 56, 6)
    I.add(bevel(left, R["green"])); I.add(bevel(right, R["sand"]))
    return I

@icon("iq_0")
def iq_0(id):
    I = Icon(); I.add(pin(32, 24, 20, "grey")); I.put(glyph_mask("?", 27, 14, 2), INK); return I

@icon("iq_5")
def iq_5(id):
    I = Icon()
    orbit_b = (ellipse(32, 36, 30, 9) & ~ellipse(32, 36, 26, 6)) & rect(0, 0, N, 36)
    I.add(bevel(orbit_b, R["gold"], soft=False))
    I.add(globe_part(40, 32, 32, -50, 10))
    orbit_f = (ellipse(32, 36, 30, 9) & ~ellipse(32, 36, 26, 6)) & rect(0, 36, N, 30)
    I.add(bevel(orbit_f, R["gold"], soft=False)); return I

@icon("passport")
def passport(id):
    I = Icon(); I.add(flat(rrect(12, 6, 42, 54, 3), R["paper"][3])); I.add(bevel(rrect(10, 4, 42, 54, 3), R["blue"]))
    I.put(rect(14, 4, 2, 54), R["blue"][3])
    g = globe_part(22, 32, 26, -50, 10); I.add(g)
    I.put(rect(22, 44, 20, 2), R["gold"][1]); I.put(rect(25, 49, 14, 2), R["gold"][2]); return I

@icon("coupon")
def coupon(id):
    I = Icon(); t = rrect(2, 14, 60, 36, 4) & ~circle(2, 32, 6) & ~circle(62, 32, 6)
    I.add(bevel(t, R["red"]))
    yy, xx = np.indices((N, N)); I.put((xx == 20) & ((yy // 3) % 2 == 0) & erode(t, 2), R["paper"][1])
    I.put(rect(28, 30, 8, 4), R["paper"][1])
    I.put(rect(40, 22, 4, 20) | rect(37, 25, 3, 3), R["paper"][1])
    I.add(sphere(circle(11, 32, 5), 10, 31, 5, R["gold"]))
    return I

@icon("philosopher")
def philosopher(id):
    I = Icon()
    pol = [[(32, 4), (46, 16), (32, 22)], [(32, 4), (18, 16), (32, 22)], [(18, 16), (32, 22), (24, 44)], [(46, 16), (32, 22), (40, 44)],
           [(32, 22), (24, 44), (32, 58)], [(32, 22), (40, 44), (32, 58)], [(18, 16), (24, 44), (10, 34)], [(46, 16), (40, 44), (54, 34)],
           [(10, 34), (24, 44), (32, 58)], [(54, 34), (40, 44), (32, 58)]]
    facets(I, pol, "red", [2, 0, 1, 3, 2, 3, 1, 4, 3, 4])
    for (x, y, r) in ((54, 8, 5), (10, 12, 3.5), (56, 54, 3)): I.add(faceted_star(x, y, r * 1.6, r * .5, "gold", n=4), outline=False)
    return I

@icon("spyhole")
def spyhole(id):
    I = Icon(); I.add(bevel(rrect(12, 4, 40, 58, 4), R["brown"]))
    for y in (10, 36): I.put(rrect(17, y, 30, 20, 2) & ~erode(rrect(17, y, 30, 20, 2), 1), R["brown"][3])
    I.add(bevel(circle(32, 22, 10), R["gold"])); I.add(sphere(circle(32, 22, 6), 30, 20, 6, R["teal"]), outline=False)
    I.put(circle(32, 22, 2), INK); I.add(sphere(circle(44, 46, 3), 43, 45, 3, R["gold"])); return I

@icon("sonarplus")
def sonarplus(id):
    I = Icon()
    for r, rp_ in ((28, "teal"), (20, "teal"), (12, "teal")):
        I.put(ring(30, 34, r - 2.2, r) & rect(0, 0, 44, N), R[rp_][1 if r == 28 else 2 if r == 20 else 0])
    I.add(sphere(circle(30, 34, 6), 29, 33, 6, R["teal"]))
    I.add(bevel(rect(44, 6, 18, 6) | rect(50, 0, 6, 18), R["gold"])); return I

@icon("plates")
def plates(id):
    I = Icon(); I.add(globe_part(52, 32, 32, 20, 5))
    crack = thick_line([(12, 22), (24, 28), (30, 20), (40, 30), (54, 26)], 2) | thick_line([(30, 20), (28, 40), (36, 56)], 2)
    I.put(crack & circle(32, 32, 25), R["orange"][1]); I.put(dilate(crack, 1) & ~crack & circle(32, 32, 25), R["orange"][4])
    return I

@icon("wind")
def wind_icon(id):
    I = Icon()
    for y, l, curl in ((16, 38, 1), (32, 50, 1), (50, 30, -1)):
        pts = [(4, y), (4 + l, y)] + [(4 + l + 7 * math.sin(t), y - curl * (7 - 7 * math.cos(t))) for t in np.linspace(0, math.pi * 1.3, 8)]
        I.add(bevel(thick_line(pts, 5), R["ice"], soft=False))
    return I

# ============================================================ salida
def build(ids):
    done = []
    for i in ids:
        f, id = REG[i]; im = f(id).img(); im.save(OUT / f"{id}.webp", "WEBP", lossless=True, method=6); done.append(id)
    return done

def preview(ids, path):
    c = 160; cols = 8; rows = (len(ids) + cols - 1) // cols
    sh = Image.new("RGBA", (cols * c, rows * c), (40, 32, 60, 255))
    for i, id in enumerate(ids):
        im = Image.open(OUT / f"{id}.webp").convert("RGBA").resize((128, 128), Image.NEAREST); sh.alpha_composite(im, ((i % cols) * c + 16, (i // cols) * c + 8))
        sm = im.resize((32, 32), Image.LANCZOS); sh.alpha_composite(sm, ((i % cols) * c + 126, (i // cols) * c + 124))
    sh.save(path)

if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--") and not a.endswith(".png")]
    ids = args or list(REG)
    done = build(ids); print(len(done), "iconos dibujados")
    if "--preview" in sys.argv: preview(done, sys.argv[sys.argv.index("--preview") + 1])
