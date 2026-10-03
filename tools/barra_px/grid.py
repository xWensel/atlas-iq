"""retoque a mano en texto: la rejilla nativa como texto (un caracter por pixel) + paleta en cabecera.
  python grid.py dump <img.webp> <out.txt> [k]       (k = factor de la imagen: 8 para 384 px)
  python grid.py render <in.txt> <out.webp> [zoom.png]
Cabecera:  a=#rrggbb  (un color por linea) ; '.' transparente ; '#' tinta (contorno indigo)
           mirror=N        -> cada fila: columnas >= N se rellenan con el espejo de las de la izquierda
           swap=ab cd      -> al reflejar, a<->b, c<->d (la luz viene de la izquierda: lo claro pasa a oscuro)
           nooutline       -> no se rehace el contorno (la rejilla ya lo trae)
El contorno exterior NO va en la rejilla: se rehace con reoutline (tools/pixel_cleanup.py), como en los logros."""
import sys, string
from pathlib import Path
import numpy as np
from PIL import Image
WT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(WT / "tools")); sys.path.insert(0, str(Path(__file__).resolve().parent))
from pixel_cleanup import reoutline, INK
from pxkit import shift
from zoom import zoom

CH = string.ascii_letters + "0123456789@$%&*+=?!<>"

def dump(a, path):
    m = a[..., 3] > 0; ink = m & (a[..., :3] == INK[:3]).all(-1)
    tr = ~m; touch = np.zeros_like(m)
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            if dx or dy: touch |= shift(tr, dx, dy)
    # el borde de la imagen cuenta como transparente
    touch[0, :] = touch[-1, :] = touch[:, 0] = touch[:, -1] = True
    outer = ink & touch
    body = m & ~outer
    cols, cnt = np.unique(a[body & ~ink][:, :3], axis=0, return_counts=True)
    order = np.argsort(-cnt); pal = {}
    for i, j in enumerate(order): pal[tuple(cols[j])] = CH[i]
    lines = [f"{v}=#{k[0]:02x}{k[1]:02x}{k[2]:02x}" for k, v in pal.items()]
    rows = []
    for y in range(a.shape[0]):
        r = ""
        for x in range(a.shape[1]):
            if not body[y, x]: r += "."
            elif ink[y, x]: r += "#"
            else: r += pal[tuple(a[y, x, :3])]
        rows.append(r)
    Path(path).write_text("\n".join(lines) + "\n\n" + "\n".join(rows) + "\n")

def parse(path):
    txt = Path(path).read_text().splitlines(); pal = {".": None, "#": tuple(INK[:3])}; rows = []; mirror = None; swap = {}; nool = False
    for l in txt:
        if not l.strip(): continue
        if l.startswith("mirror="): mirror = int(l[7:]); continue
        if l.startswith("swap="):
            for p in l[5:].split(): swap[p[0]] = p[1]; swap[p[1]] = p[0]
            continue
        if l.strip() == "nooutline": nool = True; continue
        if l.strip() == "keepdark": nool = "keep"; continue
        if len(l) > 2 and l[1] == "=" and l[2] == "#" and len(l.strip()) == 9:
            h = l[3:9]; pal[l[0]] = (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)); continue
        rows.append(l.rstrip("\n"))
    W = max(len(r) for r in rows)
    rows = [r.ljust(W, ".") for r in rows]
    if mirror is not None:
        out = []
        for r in rows:
            left = r[:mirror]; right = "".join(swap.get(c, c) for c in reversed(left))
            out.append((left + right)[:max(W, 2 * mirror)])
        rows = out
    return pal, rows, nool

def render(path):
    pal, rows, nool = parse(path); H = len(rows); W = len(rows[0])
    rgb = np.zeros((H, W, 3), np.uint8); m = np.zeros((H, W), bool)
    for y, r in enumerate(rows):
        for x, c in enumerate(r):
            if c == ".": continue
            if c not in pal: raise SystemExit(f"color '{c}' sin definir (fila {y}, col {x})")
            rgb[y, x] = pal[c]; m[y, x] = True
    if nool == "keep": return outline_pp(rgb, m)
    if nool:
        out = np.zeros((H, W, 4), np.uint8); out[m, :3] = rgb[m]; out[m, 3] = 255; return out
    # el contorno se rehace fuera de la silueta: se deja 1 px de margen para que quepa
    return reoutline(rgb, m)

def outline_pp(rgb, m):
    """contorno indigo de 1 px por fuera, 8-conexo y sin esquinas redundantes (igual que reoutline, pero sin
    convertir en contorno los pixeles oscuros del borde: aqui las sombras del borde estan puestas a mano)"""
    from pxkit import dilate
    N4 = ((1, 0), (-1, 0), (0, 1), (0, -1)); N8 = N4 + ((1, 1), (-1, -1), (1, -1), (-1, 1))
    ol = dilate(m, 1, cross=False) & ~m
    touch4 = np.zeros_like(ol)
    for dx, dy in N4: touch4 |= shift(m, dx, dy)
    nink = sum(shift(ol, dx, dy).astype(int) for dx, dy in N8)
    ol &= touch4 | (nink > 2)
    out = np.zeros(rgb.shape[:2] + (4,), np.uint8)
    out[m, :3] = rgb[m]; out[m, 3] = 255; out[ol] = INK
    return out

def save(a, path, k=8):
    Image.fromarray(a, "RGBA").resize((a.shape[1] * k, a.shape[0] * k), Image.NEAREST).save(path, "WEBP", lossless=True, method=6)

if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "dump":
        k = int(sys.argv[4]) if len(sys.argv) > 4 else 8
        a = np.array(Image.open(sys.argv[2]).convert("RGBA"))[::k, ::k].copy(); dump(a, sys.argv[3])
    elif cmd == "render":
        a = render(sys.argv[2]); save(a, sys.argv[3])
        if len(sys.argv) > 4: zoom(a, sys.argv[4])
