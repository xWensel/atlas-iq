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
TINT = np.array([42, 22, 84], float)      # las sombras tiran a indigo, como el contorno


def template():
    a = np.array(Image.open(TPL).convert("RGBA"))
    g = a[2::4, 2::4]
    cells = {}
    for y in range(G):
        for x in range(G):
            r, gg, b, al = (int(v) for v in g[y, x])
            if al < 128:
                continue
            c = (r, gg, b)
            if c in OUTLINE: cells[(x, y)] = ("o", c, False)
            elif c in POLE: cells[(x, y)] = ("p", c, False)
            else: cells[(x, y)] = ("c", SHADE.get(c, 1.0), gg > 140)
    # la franja de Espana deja una fila de sombra en cada borde amarillo/rojo; en las demas banderas esa fila no es borde de nada:
    # se le da la luz de la celda 2 filas hacia dentro de su franja
    fix = {}
    for (x, y), t in cells.items():
        if t[0] != "c": continue
        for d in (-1, 1):
            n = cells.get((x, y + d))
            if n and n[0] == "c" and n[2] != t[2]:
                i = cells.get((x, y - 2 * d))
                if i and i[0] == "c" and i[2] == t[2]: fix[(x, y)] = (t[0], i[1], t[2])
    cells.update(fix)
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
        if any(np.abs(pal[i] - pal[j]).sum() < 60 for j in keep): continue
        keep.append(i)
    P = pal[keep]
    # re-asignar cada pixel a la paleta fusionada
    arr = np.array(im, int)
    d = ((arr[:, :, None, :] - P[None, None, :, :]) ** 2).sum(-1)
    lab = d.argmin(-1)
    return P, lab


def shade(c, f):
    c = np.array(c, float)
    if f >= 1: return tuple(int(v) for v in np.clip(c + (f - 1) * (255 - c) * 2.0, 0, 255))
    out = c * f + (1 - f) * TINT * .55
    return tuple(int(v) for v in np.clip(out, 0, 255))


def render(name, cells, fixes=None):
    src = Image.open(SRC / (name + ".webp")).convert("RGBA")
    bg = Image.new("RGBA", src.size, (20, 40, 70, 255)); bg.alpha_composite(src)   # Nepal & co: lo transparente, sobre indigo
    rgb = bg.convert("RGB")
    if name in BLUR: rgb = rgb.filter(ImageFilter.GaussianBlur(BLUR[name]))   # caligrafia/bordes finos que a esta escala solo dan ruido
    P, lab = palette_of(rgb)
    H, W = lab.shape
    share = np.bincount(lab.ravel(), minlength=len(P)) / lab.size
    wgt = 1 / np.maximum(share, 1e-4) ** .38

    cloth = [(x, y) for (x, y), t in cells.items() if t[0] == "c"]
    cols = sorted({x for x, _ in cloth}); xl, xr = cols[0], cols[-1]
    top, bot, y1, y2 = {}, {}, {}, {}
    yel = {(x, y) for (x, y), t in cells.items() if t[0] == "c" and t[2]}
    for x in cols:
        ys = [y for (cx, y) in cloth if cx == x]; top[x], bot[x] = min(ys), max(ys)
        yy = [y for (cx, y) in yel if cx == x]
        # la plantilla (Espana) son tres franjas: el borde de la franja amarilla marca la onda de cada columna
        y1[x], y2[x] = (min(yy), max(yy) + 1) if yy else (top[x] + (bot[x] - top[x] + 1) / 3, top[x] + 2 * (bot[x] - top[x] + 1) / 3)

    out = {}   # (x,y) -> rgb o None
    subs = [(.17, .17), (.5, .17), (.83, .17), (.17, .5), (.5, .5), (.83, .5), (.17, .83), (.5, .83), (.83, .83)]
    def vmap(x, yy):
        return float(np.interp(yy, [top[x], y1[x], y2[x], bot[x] + 1], [0, 1 / 3, 2 / 3, 1]))
    for (x, y), (k, v, _) in cells.items():
        if k in ("o", "p"):
            out[(x, y)] = v; continue
        votes = {}
        for sx, sy in subs:
            u = (x + sx - xl) / (xr - xl + 1); vv = vmap(x, y + sy)
            px = min(W - 1, max(0, int(u * W))); py = min(H - 1, max(0, int(vv * H)))
            li = lab[py, px]; votes[li] = votes.get(li, 0) + (1.4 if (sx, sy) == (.5, .5) else 1.0) * wgt[li]
        li = max(votes, key=votes.get)
        out[(x, y)] = shade(P[li], v)
    if fixes: fixes(out, cells, P)
    img = Image.new("RGBA", (G, G), (0, 0, 0, 0))
    for (x, y), c in out.items():
        img.putpixel((x, y), (*c, 255))
    return img.resize((G * 4, G * 4), Image.NEAREST)


BLUR = {"Iran": 2.4}
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
