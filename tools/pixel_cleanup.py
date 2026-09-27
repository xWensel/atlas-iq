#!/usr/bin/env python3
"""Geolite - acabado a mano del pixel art reconvertido (solo desarrollo). Trabaja sobre la rejilla NATIVA de cada imagen
(detecta el bloque del vecino mas cercano) y corrige lo que delata un reescalado automatico:

  1. paleta: funde tonos casi iguales (los "medio-tonos" de la reduccion) en su color mas usado -> rampas limpias
  2. motas: pixeles de bajo contraste que no se repiten en su entorno 3x3 pasan al color dominante (el detalle con
     contraste alto -ojos, brillos- se respeta)
  3. contorno (solo iconos con alfa): quita el halo doble oscuro, deja UN pixel de tinta uniforme alrededor de toda la
     silueta y elimina las esquinas redundantes (contorno "pixel perfect", sin escalones dobles)
  4. motas de la silueta: pixeles sueltos y muescas de 1 px en el borde

  python tools/pixel_cleanup.py --stage [ids...]   escribe en assets_stage/ + hojas antes/despues en assets_stage/sheets
  python tools/pixel_cleanup.py --apply            copia assets_stage/ sobre assets/
"""
import sys, shutil
from pathlib import Path
import numpy as np
from PIL import Image
sys.path.insert(0, str(Path(__file__).parent))
from pxkit import P, ROOT, shift, dilate, erode

ICONS = ROOT / "assets" / "icons"; GEN = ROOT / "assets" / "gen"
STAGE = ROOT / "assets_stage"; SI = STAGE / "icons"; SG = STAGE / "gen"
INK = np.array((29, 10, 61, 255), np.uint8)                  # indigo del contorno original de los iconos (unificado)
SKIP = {"logo_mark", "logo_mark_s"}                          # la marca la dibuja tools/make_brand.py
try:
    from hand_icons import REG as _HAND; SKIP |= set(_HAND)  # y los iconos redibujados a mano (tools/hand_icons.py) ya estan limpios
except Exception: pass
try:
    import make_scenes as _MS; SKIP |= set(_MS.K.REG)     # escenas y retratos del crupier: tools/make_scenes.py
except Exception: pass
N4 = ((1, 0), (-1, 0), (0, 1), (0, -1)); N8 = N4 + ((1, 1), (-1, -1), (1, -1), (-1, 1))

def block(a):
    for k in (16, 8, 5, 4, 2):
        if a.shape[0] % k or a.shape[1] % k: continue
        b = a[::k, ::k]
        if (np.repeat(np.repeat(b, k, 0), k, 1) == a).all(): return k
    return 1

def luma(c): return c[..., 0] * .299 + c[..., 1] * .587 + c[..., 2] * .114

def dist(a, b):
    """distancia perceptual aproximada (redmean)"""
    a = a.astype(float); b = b.astype(float); r = (a[..., 0] + b[..., 0]) / 2
    d = a[..., :3] - b[..., :3]
    return np.sqrt((2 + r / 256) * d[..., 0] ** 2 + 4 * d[..., 1] ** 2 + (2 + (255 - r) / 256) * d[..., 2] ** 2)

def merge_palette(rgb, m, thr=26):
    """funde colores cercanos en el mas frecuente (voraz, de mas a menos usado)"""
    px = rgb[m]; cols, inv, cnt = np.unique(px, axis=0, return_inverse=True, return_counts=True)
    order = np.argsort(-cnt); target = np.arange(len(cols)); keep = []
    for i in order:
        best = None
        for j in keep:
            d = dist(cols[i][None], cols[j][None])[0]
            if d < thr * (0.6 if cnt[i] > cnt[j] * 0.5 else 1) and (best is None or d < best[0]): best = (d, j)
        if best: target[i] = best[1]
        else: keep.append(i)
    px2 = cols[target[inv.ravel()]]; out = rgb.copy(); out[m] = px2; return out, len(keep)

def despeckle_colors(rgb, m, thr=70, passes=2):
    h, w = m.shape
    for _ in range(passes):
        out = rgb.copy(); changed = 0
        for y in range(h):
            for x in range(w):
                if not m[y, x]: continue
                c = rgb[y, x]; same = 0; votes = {}
                for dx, dy in N8:
                    xx, yy = x + dx, y + dy
                    if 0 <= xx < w and 0 <= yy < h and m[yy, xx]:
                        n = tuple(rgb[yy, xx])
                        if n == tuple(c): same += 1
                        votes[n] = votes.get(n, 0) + 1
                if same or not votes: continue
                n, v = max(votes.items(), key=lambda t: t[1])
                if v >= 4 and dist(np.array(n)[None], c[None])[0] < thr: out[y, x] = n; changed += 1
        rgb = out
        if not changed: break
    return rgb

def clean_silhouette(m):
    """quita pixeles sueltos y rellena muescas de 1 px en la silueta"""
    for _ in range(2):
        nb = sum(shift(m, dx, dy).astype(int) for dx, dy in N4)
        m = (m & (nb >= 2)) | (~m & (nb >= 3))
    return m

def reoutline(rgb, m):
    """contorno de tinta de 1 px, uniforme y sin esquinas dobles"""
    L = luma(rgb.astype(float))
    ring = m & ~erode(m, 1)
    dark = ring & (L < 95)
    # halo doble: si el anillo exterior es oscuro y el siguiente tambien, el exterior sobra
    ring2 = erode(m, 1) & ~erode(m, 2)
    inner_dark = ring2 & (L < 80)
    drop = dark & dilate(inner_dark, 1)
    m = m & ~drop
    ring = m & ~erode(m, 1)
    dark = ring & (luma(rgb.astype(float)) < 95)
    body = m & ~dark                                        # lo que queda dentro del contorno
    body = clean_silhouette(body) & m
    ol = (dilate(body, 1, cross=False) & ~body) | (m & ~body)   # contorno 8-conexo + rasgos oscuros finos (una chimenea, un mango)
    # pixel perfect: fuera las esquinas que solo tocan el cuerpo en diagonal y no sostienen nada
    touch4 = np.zeros_like(ol)
    for dx, dy in N4: touch4 |= shift(body, dx, dy)
    nink = sum(shift(ol, dx, dy).astype(int) for dx, dy in N8)
    ol &= touch4 | (nink > 2)
    # anillo de antialias: pixeles del borde interior mas oscuros que su vecino de dentro y de un color escaso -> ese vecino
    rgb = rgb.copy(); edge_ = body & dilate(ol, 1); core = body & ~edge_
    cols, cnt = np.unique(rgb[body], axis=0, return_counts=True); freq = {tuple(c): n for c, n in zip(cols, cnt)}
    L = luma(rgb.astype(float)); rare = max(3, body.sum() * 0.02)
    for y, x in zip(*np.where(edge_)):
        if freq[tuple(rgb[y, x])] >= rare: continue
        best = None
        for dx, dy in N4:
            yy, xx = y + dy, x + dx
            if 0 <= yy < body.shape[0] and 0 <= xx < body.shape[1] and core[yy, xx] and L[yy, xx] > L[y, x] + 12:
                if best is None or freq[tuple(rgb[yy, xx])] > freq[tuple(rgb[best])]: best = (yy, xx)
        if best: rgb[y, x] = rgb[best]
    out = np.zeros(rgb.shape[:2] + (4,), np.uint8)
    out[body, :3] = rgb[body]; out[body, 3] = 255; out[ol] = INK
    return out

def process(path, dst, icon):
    im = Image.open(path).convert("RGBA"); a = np.array(im); k = block(a)
    n = a[::k, ::k].copy(); m = n[..., 3] > 0 if icon else np.ones(n.shape[:2], bool)
    rgb = n[..., :3]
    rgb, ncol = merge_palette(rgb, m, 22 if icon else 16)
    rgb = despeckle_colors(rgb, m, 70 if icon else 48)
    if icon: out = reoutline(rgb, m)
    else: out = np.dstack([rgb, np.full(m.shape, 255, np.uint8)])
    img = Image.fromarray(out, "RGBA").resize((out.shape[1] * k, out.shape[0] * k), Image.NEAREST)
    if im.mode == "RGB" or not icon: img = img.convert("RGB")
    img.save(dst, "WEBP", lossless=True, method=6)
    return k, ncol

def sheets(ids_icons, ids_gen):
    out = STAGE / "sheets"; out.mkdir(parents=True, exist_ok=True)
    for kind, folder, sf, ids, cell, per, cols in (("icons", ICONS, SI, ids_icons, 128, 24, 4), ("gen", GEN, SG, ids_gen, 400, 6, 1)):
        for n in range(0, len(ids), per):
            chunk = ids[n:n + per]; rows = (len(chunk) + cols - 1) // cols
            sheet = Image.new("RGB", (cols * (cell * 2 + 12), rows * (cell + 10)), (28, 20, 42))
            for i, id in enumerate(chunk):
                x = (i % cols) * (cell * 2 + 12); y = (i // cols) * (cell + 10)
                for j, base in enumerate((folder, sf)):
                    im = Image.open(base / f"{id}.webp").convert("RGBA"); im.thumbnail((cell, cell), Image.NEAREST)
                    sheet.paste(im, (x + j * cell + 2, y), im)
            sheet.save(out / f"{kind}_{n // per:02d}.png")

if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if "--apply" in sys.argv:
        for sf, dst in ((SI, ICONS), (SG, GEN)):
            for f in sf.glob("*.webp"): shutil.copy2(f, dst / f.name)
        print("aplicado"); sys.exit()
    SI.mkdir(parents=True, exist_ok=True); SG.mkdir(parents=True, exist_ok=True); done_i, done_g = [], []
    for folder, sf, icon, done in ((ICONS, SI, True, done_i), (GEN, SG, False, done_g)):
        for f in sorted(folder.glob("*.webp")):
            if f.stem in SKIP or (args and f.stem not in args): continue
            k, nc = process(f, sf / f.name, icon); done.append(f.stem)
    sheets(done_i, done_g); print(len(done_i), "iconos,", len(done_g), "escenas -> assets_stage/")
