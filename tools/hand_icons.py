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
