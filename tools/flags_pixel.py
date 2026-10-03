"""
Geolite - banderas pixel art de cada pais para la Enciclopedia: assets/flags/p/<pais>.webp (64x64 celdas x4 = 256 px, sin perdida).

Misma silueta que el icono general t_country (la bandera ondeante con mastil): se usa su copia en tools/art/flag_tpl como plantilla.
  - contorno indigo y mastil: se copian tal cual de la plantilla (todas las banderas son hermanas de la de Espana).
  - la tela: cada celda lleva el color de la bandera real del pais (assets/flags/r/*.webp) en su (u,v) y el sombreado del pliegue
    de la plantilla (claro / medio / oscuro).
  - los colores de la bandera se reducen a una paleta corta y cada celda toma el color dominante de su huella; los colores poco
    frecuentes pesan mas (para que sobrevivan estrellas, escudos y cruces pequenas).
Retoques a mano por pais: tabla FIX al final (funciones que reciben la rejilla de celdas y la tocan).
    python tools/flags_pixel.py            (todas)      python tools/flags_pixel.py Spain Brazil     (solo esas)
Despues: python tools/flags_pixel.py --sheet para la hoja de contacto en el scratchpad.
"""
import sys, os, json
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
TPL = ROOT / "tools" / "art" / "flag_tpl" / "t_country_tpl.webp"
SRC = ROOT / "assets" / "flags" / "r"
OUT = ROOT / "assets" / "flags" / "p"
G = 64

OUTLINE = {(16, 0, 73), (7, 0, 72), (0, 0, 77), (63, 3, 68)}
POLE = {(78, 60, 105), (134, 136, 156)}
# sombreado de la plantilla: color de Espana -> factor de luz
SHADE = {
    (251, 38, 50): 1.0, (248, 38, 50): 1.0, (249, 36, 49): 1.0, (248, 33, 49): 1.0, (247, 36, 51): 1.0,
    (226, 25, 44): .9, (220, 12, 32): .9, (217, 15, 36): .9,
    (211, 12, 35): .8, (211, 12, 33): .8, (205, 8, 35): .8,
    (110, 22, 82): .55, (205, 58, 65): .94,
    (251, 213, 69): 1.0, (252, 219, 69): 1.0, (246, 215, 73): 1.0, (234, 181, 46): .9, (223, 169, 42): .8, (197, 144, 94): .85,
}
INDIGO = (16, 0, 73)
TINT = np.array([42, 22, 84], float)      # las sombras tiran a indigo, como el contorno


# Silueta propia de la tela (la plantilla de t_country solo aporta el mastil): el borde de arriba baja por escalones limpios hacia la derecha
# (el pliegue), la altura es constante y el borde de abajo es el de arriba desplazado 39 filas. Asi las franjas de cualquier bandera siguen
# la onda exacta y no hay ruido de un pixel en los cantos.
X0, X1, HGT = 10, 57, 39
TOP = {**{10: 11, 11: 11, 12: 10, 13: 10, 14: 10}, **{x: 9 for x in range(15, 29)}, **{x: 10 for x in range(29, 33)},
       33: 11, 34: 11, 35: 12, 36: 13, 37: 13, 38: 14, 39: 14, 40: 15, 41: 15, **{x: 16 for x in range(42, 58)}}


def light(x, y):
    """luz de la tela: plana a la izquierda, el pliegue, la cara en sombra y el canto que vuelve a recoger luz"""
    xf = 34 + (y - 10) * .07                       # el pliegue baja un poco hacia la derecha
    f = 1.0
    if x < X0 + 1: f = .91
    elif x < X0 + 2: f = .96
    if xf - 1 <= x < xf: f = .92                   # el pliegue
    elif x >= xf: f = .8                           # cara en sombra
    if x == X1 - 2: f = .88
    if x >= X1 - 1: f = .95                        # el canto vuelve a recoger luz
    if y == TOP[x] and x < xf - 1: f *= 1.04       # filo de arriba iluminado
    if y == TOP[x] + HGT: f *= .93                 # y el de abajo, en sombra
    return f


def template():
    a = np.array(Image.open(TPL).convert("RGBA"))
    g = a[2::4, 2::4]
    cells = {}
    for y in range(G):
        for x in range(0, X0):                       # mastil, bola y contorno: tal cual de t_country
            r, gg, b, al = (int(v) for v in g[y, x])
            if al >= 128: cells[(x, y)] = ("o" if (r, gg, b) in OUTLINE else "p", (r, gg, b), False)
    for x in range(X0, X1 + 1):
        for y in range(TOP[x], TOP[x] + HGT + 1):
            cells[(x, y)] = ("c", light(x, y), False)
    return cells


def palette_of(im, k=8):
    """paleta corta de la bandera: mediancut + fusion de colores casi iguales"""
    q = im.quantize(colors=k, method=Image.MEDIANCUT, dither=Image.Dither.NONE)
    pal = np.array(q.getpalette()[:k * 3], int).reshape(-1, 3)
    idx = np.array(q)
    cnt = np.bincount(idx.ravel(), minlength=len(pal))
    order = np.argsort(-cnt); keep = []
    for i in order:
        if cnt[i] == 0: continue
        if any(np.abs(pal[i] - pal[j]).sum() < 80 for j in keep): continue
        keep.append(i)
    P = pal[keep]
    arr = np.array(im, int)
    for _ in range(3):                      # poda: un color con menos del 0,8 % de la superficie es un borde suavizado, no un color de la bandera
        lab = ((arr[:, :, None, :] - P[None, None, :, :]) ** 2).sum(-1).argmin(-1)
        sh_ = np.bincount(lab.ravel(), minlength=len(P)) / lab.size
        ok = sh_ >= .008
        if ok.all() or ok.sum() < 2: break
        P = P[ok]
    lab = ((arr[:, :, None, :] - P[None, None, :, :]) ** 2).sum(-1).argmin(-1)
    return P, lab


def shade(c, f):
    c = np.array(c, float)
    if f >= 1: return tuple(int(v) for v in np.clip(c + (f - 1) * (255 - c) * 2.0, 0, 255))
    out = c * f + (1 - f) * TINT * .55
    return tuple(int(v) for v in np.clip(out, 0, 255))


def vote(cells, lab, wgt, W, H):
    subs = [(.17, .17), (.5, .17), (.83, .17), (.17, .5), (.5, .5), (.83, .5), (.17, .83), (.5, .83), (.83, .83)]
    idx = {}
    for (x, y), (k, v, _) in cells.items():
        if k != "c": continue
        votes = {}
        for sx, sy in subs:
            u = (x + sx - X0) / (X1 - X0 + 1); vv = (y + sy - TOP[x]) / (HGT + 1)
            px = min(W - 1, max(0, int(u * W))); py = min(H - 1, max(0, int(vv * H)))
            li = lab[py, px]; votes[li] = votes.get(li, 0) + (1.4 if (sx, sy) == (.5, .5) else 1.0) * wgt[li]
        idx[(x, y)] = max(votes, key=votes.get)
    return idx


def grain(idx):
    n = 0
    for (x, y), li in idx.items():
        same = sum(1 for dx in (-1, 0, 1) for dy in (-1, 0, 1) if (dx or dy) and idx.get((x + dx, y + dy)) == li)
        if same <= 1: n += 1
    return n / len(idx)


def render(name, cells, fixes=None):
    src = Image.open(SRC / (name + ".webp")).convert("RGBA")
    bg = Image.new("RGBA", src.size, (20, 40, 70, 255)); bg.alpha_composite(src)   # Nepal & co: lo transparente, sobre indigo
    rgb = bg.convert("RGB")
    if name in EMBLEM:
        u0, v0, u1, v1 = EMBLEM[name][5]; w_, h_ = rgb.size
        box = (int(u0 * w_), int(v0 * h_), int(u1 * w_), int(v1 * h_))
        rgb.paste(rgb.getpixel((max(0, box[0] - 3), (box[1] + box[3]) // 2)), box)
    P, lab = palette_of(rgb)
    H, W = lab.shape
    share = np.bincount(lab.ravel(), minlength=len(P)) / lab.size
    wgt = 1 / np.maximum(share, 1e-4) ** .25
    r = SMOOTH.get(name, .8)
    if r:
        # se suaviza la fuente antes de votar: el detalle de menos de una celda (plumas, caligrafia, trazos finos) pasa a mancha limpia
        lab = ((np.array(rgb.filter(ImageFilter.GaussianBlur(r)), int)[:, :, None, :] - P[None, None, :, :]) ** 2).sum(-1).argmin(-1)
    idx = vote(cells, lab, wgt, W, H)
    col = {k: tuple(int(v) for v in P[li]) for k, li in idx.items()}
    if name in EMBLEM: emblem(col, *EMBLEM[name][:4])
    out = {k: v[1] for k, v in cells.items() if v[0] != "c"}
    for (x, y), c in col.items():
        out[(x, y)] = shade(c, cells[(x, y)][1])
    # contorno de la tela: 1 px continuo, indigo que se tine de la tela de al lado (no negro duro)
    ring = {}
    for (x, y) in list(out):
        if cells[(x, y)][0] != "c": continue
        for dx, dy in ((0, -1), (0, 1), (1, 0), (-1, 0)):
            q = (x + dx, y + dy)
            if q[0] >= X0 and q not in cells and q not in ring: ring[q] = out[(x, y)]
    for q, c in ring.items():
        out[q] = tuple(int(v) for v in np.clip(np.array(INDIGO) * .6 + np.array(c) * .16, 0, 255))
    if fixes: fixes(out, cells, P)
    img = Image.new("RGBA", (G, G), (0, 0, 0, 0))
    for (x, y), c in out.items():
        img.putpixel((x, y), (*c, 255))
    return img.resize((G * 4, G * 4), Image.NEAREST)


# escudos y caligrafia: radio de suavizado (en pixeles de la fuente de 168 px de alto); el resto usa .8
SMOOTH = {"Afghanistan": 3.0, "Albania": 2.4, "Portugal": 2.2, "Kyrgyzstan": 2.0, "Turkmenistan": 1.8, "Eritrea": 2.2, "Saudi_Arabia": 2.4,
          "Mexico": 2.0, "Spain": 2.0, "Sri_Lanka": 2.0, "San_Marino": 2.2, "Montenegro": 2.2, "Belize": 2.2, "Moldova": 2.2, "Andorra": 2.2,
          "Bhutan": 2.0, "Brunei": 1.8, "Ecuador": 2.2, "Haiti": 2.2, "Guatemala": 2.2, "El_Salvador": 2.2, "Nicaragua": 2.2, "Honduras": 1.0,
          "Dominica": 1.8, "Grenada": 1.8, "Liechtenstein": 1.8, "Malta": 1.8, "Papua_New_Guinea": 1.8, "Kosovo": 1.4, "Vatican_City": 2.2,
          "Egypt": 2.0, "Iraq": 2.2, "Iran": 2.6, "Kazakhstan": 2.0, "Cambodia": 2.2, "Fiji": 2.0, "Eswatini": 2.0, "Paraguay": 2.2,
          "Bolivia": 2.0, "Equatorial_Guinea": 2.0, "Ethiopia": 1.8, "Dominican_Republic": 2.2, "Uzbekistan": 1.4, "Tajikistan": 1.8,
          "Azerbaijan": 1.6, "Lebanon": 1.6, "Oman": 2.0, "Uruguay": 1.8, "Argentina": 1.8, "Croatia": 2.0, "Serbia": 2.0, "Slovakia": 2.0,
          "Slovenia": 1.8, "Bulgaria": 1.8, "Angola": 1.8, "Zimbabwe": 1.6, "Kenya": 1.6, "Uganda": 1.6, "Cyprus": 1.4, "Taiwan": 1.6,
          "Georgia": .6, "Libya": .6, "Tunisia": .6, "Colombia": .6, "Poland": .6, "Samoa": .6}
def emblem(col, cx, cy, art, legend):
    """escudo dibujado a mano (ASCII) sobre la tela: se coloca por columnas, asi que sigue la onda. '.' deja la bandera; ' ' la limpia al color de fondo."""
    h, w = len(art), max(len(r) for r in art)
    for j, row in enumerate(art):
        for i, ch in enumerate(row):
            if ch in ". ": continue
            x = X0 + cx + i; y = TOP[x] + cy + j
            if (x, y) in col: col[(x, y)] = legend[ch]


def sun(r_in, r_out, n, fill, ring=None):
    """sol de n rayos como ASCII (radio de los rayos r_out, disco r_in)"""
    import math
    N = 2 * r_out + 1; g = [["."] * N for _ in range(N)]
    for j in range(N):
        for i in range(N):
            d = math.hypot(i - r_out, j - r_out)
            if d <= r_in: g[j][i] = "s"
            elif d <= r_out + .4:
                a = (math.atan2(j - r_out, i - r_out) % (2 * math.pi)) / (2 * math.pi) * n
                if abs(a - round(a)) < .28 and d > r_in + 1.1: g[j][i] = "s"
    return ["".join(r) for r in g]


_SPAIN = [
    "..c.ccc.c..",
    "..ccccccc..",
    ".ddddddddd.",
    ".drrrdwwwd.",
    ".drcrdwpwd.",
    ".drrrdwwwd.",
    ".ddddddddd.",
    ".dyyrdrrrd.",
    ".dyrydrcrd.",
    ".dyyrdrrrd.",
    "..ddddddd..",
    "...ddddd...",
]
_KY = sun(6, 9, 20, "s")
for _j, _r in enumerate(_KY):   # tunduk: disco rojo con cruz amarilla
    _KY[_j] = "".join(("s" if (_i == 9 or _j == 9) else "r") if ((_i - 9) ** 2 + (_j - 9) ** 2) ** .5 <= 3.4 else c for _i, c in enumerate(_r))
_AF = [
    "..#....#..#....#.#...#....#...",
    ".##.#..##.#.#..###.#.##.#.##.#",
    "##########.##########.########",
    ".##..###..####..##..####..###.",
    "",
    "...#...#.#....#..#.#...#.#....",
    ".#.#.#.#.#.##.#.##.#.#.#.#.##.",
    "##############.###############.",
]
_SA = [
    "#.##..#.##..#.#..#.##..#.",
    "#.##.##.#####.#..#.##.##.",
    "########.#########.######",
    ".#..##....#.##.....#..#..",
    "", "", "", "",
    "..............#####.....",
    "##################>#####",
    "..............#####.....",
]
EMBLEM = {   # nombre: (x, y de la esquina en la tela, dibujo, leyenda, (0, 0, 0), rect de la FUENTE que se limpia: u0, v0, u1, v1)
    "Spain": (13, 14, _SPAIN, {"c": (232, 168, 24), "d": (126, 22, 22), "r": (196, 24, 32), "w": (244, 236, 218), "p": (122, 52, 128), "y": (244, 196, 36)}, None, (.2, .28, .58, .72)),
    "Kyrgyzstan": (15, 11, _KY, {"s": (255, 222, 20), "r": (226, 24, 28)}, None, (.2, .1, .8, .9)),
    "Afghanistan": (9, 14, _AF, {"#": (14, 14, 18)}, None, (.1, .15, .9, .85)),
    "Saudi_Arabia": (11, 10, _SA, {"#": (244, 244, 236), ">": (244, 244, 236)}, None, (.1, .1, .9, .85)),
}
FIX = {}   # nombre -> funcion(out, cells, P)  (retoques a mano)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    cells = template(); OUT.mkdir(parents=True, exist_ok=True)
    names = args or sorted(p.stem for p in SRC.glob("*.webp"))
    for n in names:
        im = render(n, cells, FIX.get(n))
        im.save(OUT / (n + ".webp"), lossless=True, quality=100, method=6)
    print(len(names), "banderas pixel en", OUT)
    if "--sheet" in sys.argv:
        names = sorted(p.stem for p in OUT.glob("*.webp"))
        cw = 128; cols = 14; rows = (len(names) + cols - 1) // cols
        sheet = Image.new("RGBA", (cols * cw, rows * cw), (14, 32, 24, 255))
        for i, n in enumerate(names):
            t = Image.open(OUT / (n + ".webp")).resize((cw, cw), Image.NEAREST)
            sheet.alpha_composite(t, ((i % cols) * cw, (i // cols) * cw))
        sp = os.environ.get("SHEET", str(ROOT / "flags_sheet.png")); sheet.save(sp); print("hoja", sp)


if __name__ == "__main__":
    main()
