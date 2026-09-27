#!/usr/bin/env python3
"""Geolite - escenas y retratos del crupier dibujados pixel a pixel en codigo (solo desarrollo). Sustituyen el arte generado
de assets/gen/ y los retratos dealer_*: cielos con tramado ordenado, capas de paisaje con perspectiva atmosferica
(lo lejano mas claro y menos saturado), luz siempre arriba-izquierda y los mismos props, rampas y contorno que el logo
y los iconos (tools/hand_icons.py).

Rejillas nativas: escenas 256x144 (x4 -> 1024x576), cartas del menu 256x320 (x4), hub_hero 256x112 (x4),
shop_bg 256x141 (x5), tipos 128x128 (x4), retratos 128x128 (x4).

Este modulo es el kit; las escenas viven en tools/scenes_*.py y se generan con
  python tools/make_scenes.py [ids...] [--preview hoja.png]
"""
import sys, math
from contextlib import contextmanager
from pathlib import Path
import numpy as np
from PIL import Image
sys.path.insert(0, str(Path(__file__).parent))
import hand_icons as hi
from hand_icons import R, INK, WHITE, hexc
from pxkit import shift, dilate, erode, edge, opening

ROOT = hi.ROOT; GEN = ROOT / "assets" / "gen"; ICONS = ROOT / "assets" / "icons"
BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16 + 1 / 32

@contextmanager
def size(n):
    old = hi.N; hi.N = n
    try: yield
    finally: hi.N = old

_PROPS = {}
def half(a):
    """reduce x2 conservando el pixel art: en cada bloque 2x2 manda el color mas repetido; la tinta gana si ocupa 2+ pixeles"""
    h, w = a.shape[0] // 2, a.shape[1] // 2; out = np.zeros((h, w, 4), np.uint8); ink = np.array(INK, np.uint8)
    for y in range(h):
        for x in range(w):
            b = a[2 * y:2 * y + 2, 2 * x:2 * x + 2].reshape(4, 4); op = b[b[:, 3] > 0]
            if len(op) < 2: continue
            isink = (op == ink).all(1)
            if isink.sum() >= 2: out[y, x] = ink; continue
            cols, cnt = np.unique(op[~isink], axis=0, return_counts=True); out[y, x] = cols[cnt.argmax()]
    return out

def coin_small(r=11):
    """doblon a escala de escena: disco dorado con canto, filete y brillo (RGBA de 2r+4)"""
    n = 2 * r + 4
    with size(n):
        I = hi.Icon(); c = r + 2
        I.add(hi.flat(hi.circle(c, c + 2, r), R["gold"][4]))
        face = hi.circle(c, c, r); t = hi.bevel(face, R["gold"])
        t[hi.ring(c, c, r - 4, r - 2.8)] = R["gold"][3]; t[hi.rect(c - 1, c - 4, 2, 8)] = R["gold"][3]; t[hi.rect(c - 1, c - 4, 1, 8)] = R["gold"][0]
        I.add(t); return I.a.copy()

def prop(id, scale=1):
    """icono de hand_icons dibujado a 64 px (RGBA 64x64); scale=.5 -> 32 px (el doblon tiene su version propia)"""
    if id == "coin" and scale == .5: return coin_small()
    if (id, scale) not in _PROPS:
        with size(64):
            f, i = hi.REG[id]; a = f(i).a.copy()
        _PROPS[(id, scale)] = half(a) if scale == .5 else a
    return _PROPS[(id, scale)]

class Scene:
    def __init__(self, w, h, k=4):
        self.w, self.h, self.k = w, h, k; self.S = max(w, h)
        hi.N = self.S; self.I = hi.Icon()
    @property
    def a(self): return self.I.a
    def add(self, part, outline=True): self.I.add(part, outline); return self
    def put(self, m, col): self.I.put(m, col); return self
    def paste(self, src, x, y, outline=False):
        """pega un RGBA (p.ej. un prop de 64) en (x, y); outline: contorno de tinta alrededor"""
        h, w = src.shape[:2]; part = np.zeros_like(self.a)
        x0, y0, x1, y1 = max(0, x), max(0, y), min(self.S, x + w), min(self.S, y + h)
        if x0 < x1 and y0 < y1: part[y0:y1, x0:x1] = src[y0 - y:y1 - y, x0 - x:x1 - x]
        self.I.add(part, outline); return self
    def img(self):
        a = self.a[:self.h, :self.w].copy(); a[..., 3] = 255
        return Image.fromarray(a, "RGBA").convert("RGB").resize((self.w * self.k, self.h * self.k), Image.NEAREST)

# ============================================================ fondos
def grad(sc, stops, y0=0, y1=None, x0=0, x1=None, mask=None):
    """degradado vertical por bandas con tramado ordenado 4x4 entre colores vecinos. stops: lista de colores (hex)"""
    y1 = sc.h if y1 is None else y1; x1 = sc.w if x1 is None else x1
    cols = [hexc(c) if isinstance(c, str) else c for c in stops]; n = len(cols) - 1
    for y in range(y0, y1):
        t = (y - y0) / max(1, (y1 - y0 - 1)) * n; i = min(int(t), n - 1); f = t - i
        # la mezcla solo ocurre en una franja estrecha entre bandas (bandas limpias + tramado corto)
        f = np.clip((f - .5) * 3 + .5, 0, 1)
        row = np.array([cols[i + 1] if f > BAYER[y % 4, x % 4] else cols[i] for x in range(x0, x1)], np.uint8)
        if mask is None: sc.a[y, x0:x1] = row
        else:
            mm = mask[y, x0:x1]; sc.a[y, x0:x1][mm] = row[mm]

def stars(sc, seed, y1, n=60, cols=("fff6c8", "b7e2f7", "ecc2ff")):
    rng = np.random.default_rng(seed)
    for _ in range(n):
        x, y = rng.integers(0, sc.w), rng.integers(0, y1); c = hexc(cols[rng.integers(0, len(cols))])
        sc.a[y, x] = c
        if rng.random() < .12 and 1 < x < sc.w - 2 and 1 < y < y1 - 2:
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)): sc.a[y + dy, x + dx] = hexc("8a7fd0")

def disc_glow(sc, cx, cy, r, cols):
    """sol o luna con halos concentricos tramados (cols: centro -> exterior)"""
    y, x = np.mgrid[0:sc.S, 0:sc.S]; d = np.hypot(x + .5 - cx, y + .5 - cy)
    for i in range(len(cols) - 1, 0, -1):
        rr = r * (1 + i * .55); m = d < rr
        dith = (d > rr - 2) & (BAYER[y % 4, x % 4] < .5)
        sc.a[m & ~dith] = hexc(cols[i])
    sc.a[d < r] = hexc(cols[0])

def ridge(sc, seed, base, amp, freq=1.0, octaves=3):
    """silueta 1D (altura por columna) con suma de senos de fase aleatoria"""
    rng = np.random.default_rng(seed); xs = np.arange(sc.S); hgt = np.zeros(sc.S)
    for o in range(octaves):
        f = freq * (2 ** o) * 2 * math.pi / sc.w; ph = rng.random() * 6.28
        hgt += np.sin(xs * f + ph) * amp / (1.8 ** o)
    return (base - hgt).astype(int)

def layer(sc, top, col, hi_col=None, lo_col=None, y_end=None):
    """rellena bajo la silueta `top` (por columna); hi_col = borde superior de 1 px"""
    y = np.arange(sc.S)[:, None]; m = (y >= top[None, :]) & (y < (y_end or sc.h))
    sc.a[m] = hexc(col)
    if hi_col: sc.a[m & ~shift(m, 0, 1)] = hexc(hi_col)
    return m

def cloud_mask(sc, cx, cy, w, h, seed=0):
    rng = np.random.default_rng(seed); m = hi.ellipse(cx, cy + h * .2, w * .5, h * .3)
    for i in range(5):
        px = cx + (i - 2) * w * .2 + rng.normal(0, w * .03); r = h * (.35 + rng.random() * .3) * (1 - abs(i - 2) * .18)
        m |= hi.circle(px, cy - r * .3 + h * .15, r)
    return m & (np.arange(sc.S)[:, None] < cy + h * .5)

def cloud(sc, cx, cy, w, h, cols=("ffffff", "e8e4f7", "b9b2dc"), seed=0):
    m = cloud_mask(sc, cx, cy, w, h, seed); sc.a[m] = hexc(cols[1])
    sc.a[m & (np.arange(sc.S)[:, None] > cy + h * .12)] = hexc(cols[2])
    sc.a[m & ~shift(m, 0, 2)] = hexc(cols[0]); return m

def sea(sc, y0, cols, seed=1):
    """mar: bandas tramadas + reflejos horizontales cortos"""
    grad(sc, cols, y0, sc.h); rng = np.random.default_rng(seed)
    for _ in range(sc.w // 3):
        x, y = rng.integers(0, sc.w - 8), rng.integers(y0 + 2, sc.h); L = rng.integers(2, 6 + (y - y0) // 8)
        sc.a[y, x:x + L] = hexc(cols[0])

def grass_tufts(sc, m, seed, col):
    rng = np.random.default_rng(seed); ys, xs = np.where(m & ~shift(m, 0, 1))
    for x, y in zip(xs, ys):
        if rng.random() < .18 and y > 1: sc.a[y - 1, x] = hexc(col)

REG = {}
def scene(*ids):
    def deco(f):
        for i in ids: REG[i] = (f, i)
        return f
    return deco

# ============================================================ salida
def build(ids):
    for i in ids:
        f, id = REG[i]; sc = f(id)
        out = (ICONS if id.startswith("dealer_") else GEN) / f"{id}.webp"
        im = sc.img() if isinstance(sc, Scene) else sc
        if id.startswith("dealer_"): im.save(out, "WEBP", lossless=True, method=6)
        else: im.save(out, "WEBP", lossless=True, method=6)
    return ids

def preview(ids, path):
    cells = []
    for id in ids:
        d = ICONS if id.startswith("dealer_") else GEN
        im = Image.open(d / f"{id}.webp").convert("RGBA"); im.thumbnail((512, 512), Image.NEAREST); cells.append(im)
    W = 1040; x = y = 0; rowh = 0; pos = []
    for im in cells:
        if x + im.width > W: x = 0; y += rowh + 8; rowh = 0
        pos.append((x, y)); x += im.width + 8; rowh = max(rowh, im.height)
    sh = Image.new("RGBA", (W, y + rowh), (30, 24, 44, 255))
    for im, p in zip(cells, pos): sh.alpha_composite(im, p)
    sh.save(path)

