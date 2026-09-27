#!/usr/bin/env python3
"""Geolite - retoque de las ilustraciones originales sobre su reticula de pixel (solo desarrollo).
No redibuja: parte del arte original (assets/gen/*.webp y los retratos dealer_*) tal como estaba antes de cualquier
limpieza (`--from <commit>`, por defecto el commit anterior a la v0.24.1) y lo pule como lo haria un pixel artist:

  1. reticula: detecta el bloque del vecino mas cercano y trabaja pixel a pixel sobre la rejilla nativa
  2. antialias fuera: un pixel que es mezcla de dos colores vecinos (esta en el segmento entre ambos) toma el mas
     cercano -> bordes duros y limpios, sin la "pelusa" del reescalado
  3. motas fuera: pixeles sueltos de bajo contraste pasan al color dominante de su entorno
  4. paleta: funde tonos casi iguales en su color mas usado (rampas limpias, menos colores)
  5. retoques puntuales por imagen (FIX): lo que el automatico no puede arreglar

  python tools/retouch.py --stage [ids...]    -> assets_stage/retouch/ + hojas antes/despues
  python tools/retouch.py --apply [ids...]    -> escribe en assets/
"""
import sys, io, subprocess
from pathlib import Path
import numpy as np
from PIL import Image
sys.path.insert(0, str(Path(__file__).parent))
from pixel_cleanup import block, dist, merge_palette, despeckle_colors, reoutline

ROOT = Path(__file__).resolve().parent.parent
SRC_COMMIT = "370151d"
STAGE = ROOT / "assets_stage" / "retouch"
N8 = ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1))

def original(rel, commit=SRC_COMMIT):
    data = subprocess.run(["git", "show", f"{commit}:{rel}"], cwd=ROOT, capture_output=True, check=True).stdout
    return Image.open(io.BytesIO(data))

def de_aa(rgb, m, passes=2, min_gap=55, tol=.22):
    """pixel en el segmento entre dos vecinos distintos (A, B) -> el mas cercano de los dos"""
    h, w = m.shape; rgb = rgb.astype(int)
    for _ in range(passes):
        out = rgb.copy(); changed = 0
        for y in range(1, h - 1):
            for x in range(1, w - 1):
                if not m[y, x]: continue
                p = rgb[y, x]; cols = {}
                for dx, dy in N8:
                    if m[y + dy, x + dx]: c = tuple(rgb[y + dy, x + dx]); cols[c] = cols.get(c, 0) + 1
                if tuple(p) in cols and cols[tuple(p)] >= 3: continue          # ya forma parte de una mancha solida
                cand = [np.array(c) for c, n in cols.items() if n >= 2]
                best = None
                for i in range(len(cand)):
                    for j in range(i + 1, len(cand)):
                        A, B = cand[i], cand[j]; AB = B - A; L2 = (AB * AB).sum()
                        if L2 < min_gap * min_gap: continue
                        t = ((p - A) * AB).sum() / L2
                        if not (.12 < t < .88): continue
                        off = np.sqrt(((A + t * AB - p) ** 2).sum()) / np.sqrt(L2)
                        if off < tol and (best is None or off < best[0]): best = (off, A if t < .5 else B)
                if best is not None: out[y, x] = best[1]; changed += 1
        rgb = out
        if not changed: break
    return rgb.astype(np.uint8)

def flatten(rgb, m, thr=42, passes=3):
    """aplana el moteado: un pixel toma el color mayoritario de su 3x3 si esa mayoria (5+) es de bajo contraste con el"""
    h, w = m.shape
    for _ in range(passes):
        out = rgb.copy(); ch = 0
        for y in range(1, h - 1):
            for x in range(1, w - 1):
                if not m[y, x]: continue
                blk = rgb[y - 1:y + 2, x - 1:x + 2].reshape(9, 3)[m[y - 1:y + 2, x - 1:x + 2].ravel()]
                cols, cnt = np.unique(blk, axis=0, return_counts=True); j = cnt.argmax()
                if cnt[j] >= 5 and (cols[j] != rgb[y, x]).any() and dist(cols[j][None], rgb[y, x][None])[0] < thr: out[y, x] = cols[j]; ch += 1
        rgb = out
        if not ch: break
    return rgb

def unify_ink(rgb, m, lum=48):
    """los pixeles casi negros (contornos y sombras de linea) pasan a un unico tono de tinta: el mas usado entre ellos"""
    L = rgb[..., 0] * .299 + rgb[..., 1] * .587 + rgb[..., 2] * .114; dark = m & (L < lum)
    hi_nb = np.zeros_like(dark)                                              # solo lineas: pixel oscuro junto a algo mucho mas claro
    for dx, dy in N8: hi_nb |= np.roll(np.roll(L, dy, 0), dx, 1) > L + 70
    dark &= hi_nb
    if dark.sum() < 20: return rgb
    cols, cnt = np.unique(rgb[dark], axis=0, return_counts=True); ink = cols[cnt.argmax()]
    rgb = rgb.copy(); rgb[dark] = ink; return rgb

def punch(rgb, m, sat=1.08, con=1.05):
    """un punto mas de color y contraste (sin tocar la tinta)"""
    f = rgb.astype(float); g = f.mean(-1, keepdims=True); f = g + (f - g) * sat; f = 128 + (f - 128) * con
    out = rgb.copy(); out[m] = np.clip(f, 0, 255).astype(np.uint8)[m]; return out

def retouch(im, sprite=False, pal_thr=16, aa=True):
    a = np.array(im.convert("RGBA")); k = block(a); n = a[::k, ::k].copy()
    m = n[..., 3] > 0 if sprite else np.ones(n.shape[:2], bool); rgb = n[..., :3]
    if aa: rgb = de_aa(rgb, m)
    rgb = despeckle_colors(rgb, m, 60)
    rgb = flatten(rgb, m)
    rgb, _ = merge_palette(rgb, m, pal_thr)
    if aa: rgb = de_aa(rgb, m, 1)
    rgb = unify_ink(rgb, m); rgb = punch(rgb, m)
    out = reoutline(rgb, m) if sprite else np.dstack([rgb, np.full(m.shape, 255, np.uint8)])
    return out, k

def fill_white_margin(out):
    """margen blanco exterior (inundado desde el borde) -> el color del marco que lo toca"""
    rgb = out[..., :3].astype(int); h, w = rgb.shape[:2]
    L = rgb @ np.array([.299, .587, .114]); white = (L > 222) & (rgb.max(-1) - rgb.min(-1) < 30) & (out[..., 3] > 0)
    seen = np.zeros((h, w), bool); st = [(y, x) for y in range(h) for x in (0, w - 1)] + [(y, x) for x in range(w) for y in (0, h - 1)]
    st = [(y, x) for y, x in st if white[y, x]]
    for y, x in st: seen[y, x] = True
    while st:
        y, x = st.pop()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            yy, xx = y + dy, x + dx
            if 0 <= yy < h and 0 <= xx < w and white[yy, xx] and not seen[yy, xx]: seen[yy, xx] = True; st.append((yy, xx))
    if seen.sum() < h * w * .004: return out
    ring = np.zeros_like(seen)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)): ring |= np.roll(np.roll(seen, dy, 0), dx, 1)
    ring &= ~seen & (out[..., 3] > 0)
    cols, cnt = np.unique(out[ring][:, :3], axis=0, return_counts=True)
    out = out.copy(); out[seen, :3] = cols[cnt.argmax()]; return out

FIX = {}
def fix(*ids):
    def deco(f):
        for i in ids: FIX[i] = f
        return f
    return deco

def run(ids, apply=False):
    gen = sorted(p.stem for p in (ROOT / "assets" / "gen").glob("*.webp"))
    dealers = ["dealer_neutral", "dealer_laugh", "dealer_angry", "dealer_shock"]
    todo = [(i, f"assets/gen/{i}.webp", False) for i in gen] + [(i, f"assets/icons/{i}.webp", True) for i in dealers]
    if ids: todo = [t for t in todo if t[0] in ids]
    STAGE.mkdir(parents=True, exist_ok=True); done = []
    for id, rel, sprite in todo:
        src = original(rel); out, k = retouch(src, sprite)
        if not sprite: out = fill_white_margin(out)
        if id in FIX: out = FIX[id](out)
        img = Image.fromarray(out, "RGBA").resize((out.shape[1] * k, out.shape[0] * k), Image.NEAREST)
        if not sprite: img = img.convert("RGB")
        dst = (ROOT / rel) if apply else STAGE / f"{id}.webp"
        img.save(dst, "WEBP", lossless=True, method=6); done.append((id, rel))
    return done

def sheets(done, path):
    rows = []
    for id, rel in done:
        a = original(rel).convert("RGBA"); b = Image.open(STAGE / f"{id}.webp").convert("RGBA")
        s = 480 / a.width; a = a.resize((480, int(a.height * s)), Image.NEAREST); b = b.resize((480, int(b.height * s)), Image.NEAREST)
        rows.append((a, b))
    H = sum(a.height + 8 for a, _ in rows); sh = Image.new("RGBA", (980, H), (30, 24, 44, 255)); y = 0
    for a, b in rows: sh.alpha_composite(a, (0, y)); sh.alpha_composite(b, (500, y)); y += a.height + 8
    sh.save(path)

if __name__ == "__main__":
    ids = [a for a in sys.argv[1:] if not a.startswith("--") and not a.endswith(".png")]
    done = run(ids, "--apply" in sys.argv); print(len(done), "retocadas")
    if "--sheet" in sys.argv: sheets(done, sys.argv[sys.argv.index("--sheet") + 1])
