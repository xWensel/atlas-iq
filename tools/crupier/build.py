#!/usr/bin/env python3
"""Geolite - Don Crupier: construye el sprite (solo desarrollo).

  python tools/crupier/build.py            -> js/crupier-data.js (atlas + piezas + expresiones + gestos) y tools/crupier/out/dealer_*.webp
  python tools/crupier/build.py --apply    -> ademas sustituye assets/icons/dealer_*.webp (imagenes fijas, 512 = 128 x4)
  python tools/crupier/build.py --sheet D  -> ademas, hojas de revision en D

Todo sale del maestro (master.py) por capas (rig.py): cara (face.py), manos (hands.py), expresiones y gestos (anim.py).
Despues de cambiar al crupier hay que regenerar la tarjeta de Aventura: python tools/card_adv.py (ver CLAUDE.md).
"""
import sys, io, json, base64
from pathlib import Path
import numpy as np
from PIL import Image
sys.path.insert(0, str(Path(__file__).parent))
from px import RGB, blank, patch, rows_of, sheet, big, ROOT
from rig import layers, compose
from face import eyes, eye, holeless, split_stache, mouth, MOUTHS, EYES, GLINT, PUPIL, UP
from hands import free_hand
import anim

LOOKS = (-1, 0, 1)

# ---------------------------------------------------------------- efectos (dibujados a mano; posicion en el lienzo de 128, se mueven con la cabeza)
FX = {
    "fx_sweat": ((96, 56), """
        |..s...
        |.sBs..
        |.sBs..
        |sBnBs.
        |sBnBs.
        |sBBBs.
        |.sss..
    """),
    "fx_tear": ((58, 67), """
        |.s.
        |sns
        |sBs
        |.s.
    """),
    "fx_z1": ((100, 42), """
        |ssssss
        |sZZZZs
        |sssZss
        |.sZss.
        |sZZZZs
        |ssssss
    """),
    "fx_z2": ((106, 28), """
        |sssssss
        |sZZZZZs
        |ssssZss
        |..sZs..
        |ssZssss
        |sZZZZZs
        |sssssss
    """),
    "fx_z3": ((113, 13), """
        |ssssssss
        |sZZZZZZs
        |sssssZss
        |...sZs..
        |..sZs...
        |.sZsssss
        |sZZZZZZs
        |ssssssss
    """),
    # el doblon del juego (moneda de oro), girando en el aire
    "fx_coin1": ((96, 78), """
        |.ssss.
        |syyhys
        |syObys
        |syObys
        |sbyyOs
        |.ssss.
    """),
    "fx_coin2": ((98, 58), """
        |.ss.
        |sybs
        |syOs
        |syOs
        |sbOs
        |.ss.
    """),
    "fx_coin3": ((96, 38), """
        |.ssss.
        |syyhys
        |syObys
        |syObys
        |sbyyOs
        |.ssss.
    """),
    # carta suelta (repartir / ensenar): palo rojo en el centro, SIN indices
    "fx_card1": ((56, 70), """
        |ssssssssss
        |sWWWWWWWws
        |sWWWWWWWws
        |sWWWWWWWws
        |sWWWRWWWws
        |sWWRRRWWws
        |sWReRRcWws
        |sWWRRcWWws
        |sWWWcWWWws
        |sWWWWWWWws
        |sWWWWWWWws
        |swwwwwwwws
        |ssssssssss
    """),
    "fx_card2": ((64, 84), """
        |ssssssssssssss
        |sWWWWWWWWWWWws
        |sWWWWWWWWWWWws
        |sWWWWWWWWWWWws
        |sWWWWWWWWWWWws
        |sWWWWWRWWWWWws
        |sWWWWRRRWWWWws
        |sWWWeRRRRWWWws
        |sWWeRRRRRcWWws
        |sWWWRRRRcWWWws
        |sWWWWRRcWWWWws
        |sWWWWWcWWWWWws
        |sWWWWWWWWWWWws
        |sWWWWWWWWWWWws
        |sWWWWWWWWWWWws
        |swwwwwwwwwwwws
        |ssssssssssssss
    """),
    # dorso de la carta (azul del juego con la rosa de los vientos en oro, como el icono cardback)
    "fx_cardback": ((56, 70), """
        |ssssssssss
        |sPPPPPPPPs
        |sPLLLLLLPs
        |sPLdddLLPs
        |sPLdydLLPs
        |sPLyyydLPs
        |sPLdydLLPs
        |sPLdddLLPs
        |sPLLLLLLPs
        |sPLLLLLLPs
        |sPLLLLLLPs
        |sPPPPPPPPs
        |ssssssssss
    """),
    # reloj de bolsillo de oro (solo mientras dura el gesto; no se queda en el retrato)
    "fx_watch": ((84, 76), """
        |.....ss.....
        |....sbbs....
        |...ssssss...
        |..sbyyyyOs..
        |.sbWWWWWWOs.
        |sbWWWKWWWWOs
        |sbWWWKWWWWOs
        |sbWWWKKKWWOs
        |sbWWWWWWWWOs
        |.sbWWWWWWOs.
        |..sbOOOOOs..
        |...ssssss...
    """),
    # soplido (viento): dos rafagas
    "fx_wind1": ((84, 80), """
        |......ZZZZ....
        |.ZZZZZ....Z...
        |...........Z..
        |..ZZZZZZZZZ...
    """),
    "fx_wind2": ((90, 76), """
        |.......ZZZZ...
        |..ZZZZZ....Z..
        |ZZ..........Z.
        |....ZZZZZZZZ..
        |..............
        |..ZZZZZZ......
    """),
    "fx_chips1": ((93, 82), """
        |.sss.
        |sReRs
        |sRRRs
        |.sss.
    """),
    "fx_chips2": ((90, 64), """
        |.sss.....
        |sReRs....
        |sRRRs.sss
        |.sss.sReR
        |.....sRRR
        |......sss
    """),
    "fx_chips3": ((86, 44), """
        |.sss.......
        |sReRs......
        |sRRRs......
        |.sss....sss
        |.......sReR
        |.......sRRR
        |........sss
    """),
}

def crop(a):
    ys, xs = np.where(a[..., 3] > 0)
    if not len(ys): return None
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    return a[y0:y1, x0:x1], int(x0), int(y0)

def diff(after, before):
    out = np.zeros_like(after); m = (after != before).any(-1); out[m] = after[m]
    return out

def fx_layer(pos, art):
    a = blank(); patch(a, pos[0], pos[1], rows_of(art), keep="."); return a

class Parts:
    def __init__(self): self.items = {}
    def add(self, name, layer):
        c = crop(layer)
        if c: self.items[name] = c
        return name
    def pack(self, W=256):
        order = sorted(self.items, key=lambda n: -self.items[n][0].shape[0])
        x = y = rowh = 0; rects = {}
        for n in order:
            a = self.items[n][0]; h, w = a.shape[:2]
            if x + w > W: x = 0; y += rowh + 1; rowh = 0
            rects[n] = (x, y); x += w + 1; rowh = max(rowh, h)
        H = y + rowh; atlas = np.zeros((H, W, 4), np.uint8); meta = {}
        for n, (px_, py) in rects.items():
            a, ox, oy = self.items[n]; h, w = a.shape[:2]
            atlas[py:py + h, px_:px_ + w] = a; meta[n] = [px_, py, w, h, ox, oy]
        return atlas, meta

def build_parts(L):
    parts = Parts()
    head = L["head"].copy(); holeless(head)
    base, st = split_stache(head)
    parts.add("body", L["body"]); parts.add("head", base); parts.add("stache", st)
    parts.add("hat", L["hat"]); parts.add("cards", L["cards"]); parts.add("fist", L["fist"])
    for kind in EYES:
        looks = (LOOKS if (kind in GLINT or kind in PUPIL) else (0,)) + ((2,) if kind in UP else ())
        for lk in looks:
            for side in ("L", "R"):
                a = base.copy(); eye(a, side, kind, lk)
                parts.add(f"e{side}_{kind}_{lk}", diff(a, base))
    for kind, art in MOUTHS.items():
        if not art: continue
        a = base.copy(); mouth(a, kind); parts.add("m_" + kind, diff(a, base))
    for name, (pos, art) in FX.items(): parts.add(name, fx_layer(pos, art))
    return parts, base, st

def resolve(pose, parts, cache):
    """sustituye FREE(...) por el nombre de su pieza (y la pinta la primera vez)"""
    p = dict(pose)
    g = p.get("g")
    if isinstance(g, tuple) and g and g[0] == "free":
        _, kind, wrist, elbow = g
        name = f"g_{kind}_{wrist[0]}_{wrist[1]}" + (f"_{elbow[0]}_{elbow[1]}" if elbow else "")
        if name not in cache: cache[name] = parts.add(name, free_hand(kind, wrist, elbow))
        p["g"] = name
    return p

def data(parts):
    cache = {}; E = {}; G = {}
    for k, e in anim.EXPR.items():
        o = {kk: v for kk, v in e.items() if v is not None}
        o["base"] = resolve(e["base"], parts, cache)
        if "idle" in e: o["idle"] = [[resolve(p, parts, cache), ms] for p, ms in e["idle"]]
        if "still" in e: o["still"] = resolve(e["still"], parts, cache)
        E[k] = o
    for k, g in anim.GEST.items():
        o = dict(g); o["frames"] = [[resolve(p, parts, cache), ms] for p, ms in g["frames"]]; G[k] = o
    return E, G

# ---------------------------------------------------------------- composicion en Python (misma logica que js/crupier.js) para imagenes fijas y hojas
BASEP = dict(e="open", r=None, l=0, m="smirk", s=0, b=[0, 0], h=[0, 0], t=[0, 0], c=[0, 0], f=[0, 0], g=None, x=None, k=0, w=None, d=0)
TILT = {1: .07, 2: .14, -1: -.07, -2: -.14}
EYEBOX = (53, 58, 90, 67)                       # x0, y0, x1, y1 de los huecos de los ojos (con la cabeza en su sitio)

def shear_rows(a, k, pivot=90):
    """inclina desplazando filas enteras (sin rotar ni suavizar): arriba se va hacia el lado de k"""
    out = np.zeros_like(a)
    for y in range(128):
        dx = int(round((pivot - y) * TILT[k]))
        if dx >= 0: out[y, dx:] = a[y, :128 - dx]
        else: out[y, :128 + dx] = a[y, -dx:]
    return out

def darken(out, hx, hy):
    """a oscuras: silueta con filo de luz a la izquierda, rojos apagados y solo los ojos encendidos"""
    x0, y0, x1, y1 = EYEBOX; res = out.copy()
    S = RGB["s"]; K = RGB["K"]; DIM = np.array((70, 10, 40, 255), np.uint8); RIM = RGB["d"]
    reds = [RGB[c][:3] for c in "Rcex"]
    for y in range(128):
        for x in range(128):
            px_ = out[y, x]
            if px_[3] == 0 or (px_ == S).all(): continue
            if x0 + hx <= x <= x1 + hx and y0 + hy <= y <= y1 + hy and (px_ == RGB["W"]).all(): continue
            if any((px_[:3] == r).all() for r in reds): res[y, x] = DIM
            elif x > 0 and (out[y, x - 1] == S).all(): res[y, x] = RIM
            else: res[y, x] = K
    return res

def pose_img(p, meta, atlas):
    q = dict(BASEP); q.update({k: v for k, v in p.items() if v is not None or k in ("r", "g", "x")})
    def put(out, name, dx, dy):
        if name not in meta: return
        sx, sy, w, h, ox, oy = meta[name]; a = atlas[sy:sy + h, sx:sx + w]
        for yy in range(h):
            for xx in range(w):
                if a[yy, xx, 3] and 0 <= oy + dy + yy < 128 and 0 <= ox + dx + xx < 128: out[oy + dy + yy, ox + dx + xx] = a[yy, xx]
    out = blank(); hx, hy = q["h"]
    put(out, "body", *q["b"])
    hg = blank(); put(hg, "head", hx, hy)
    el = q["e"]; er = q["r"] or q["e"]; lk = q["l"] or 0
    put(hg, f"eL_{el}_{lk}" if f"eL_{el}_{lk}" in meta else f"eL_{el}_0", hx, hy)
    put(hg, f"eR_{er}_{lk}" if f"eR_{er}_{lk}" in meta else f"eR_{er}_0", hx, hy)
    if q["m"]: put(hg, "m_" + q["m"], hx, hy)
    put(hg, "stache", hx, hy + q["s"]); put(hg, "hat", hx + q["t"][0], hy + q["t"][1])
    if q["k"]: hg = shear_rows(hg, q["k"])
    m = hg[..., 3] > 0; out[m] = hg[m]
    put(out, "cards", *q["c"]); put(out, "fist", *q["f"])
    if q["g"]: put(out, q["g"], 0, 0)
    for n, dx, dy in (q["x"] or []): put(out, n, hx + dx, hy + dy)
    for y0, y1, dx in (q["w"] or []):
        band = out[y0:y1].copy(); out[y0:y1] = 0
        if dx >= 0: out[y0:y1, dx:] = band[:, :128 - dx]
        else: out[y0:y1, :128 + dx] = band[:, -dx:]
    if q["d"]: out = darken(out, hx, hy)
    out[119:] = 0; row = out[118, :, 3] > 0; out[119, row] = RGB["s"]
    return out

STILLS = {"dealer_neutral": "sly", "dealer_laugh": "laugh", "dealer_angry": "angry", "dealer_shock": "shock"}
MINIS = {"dealer_mini": "sly", "dealer_mini_laugh": "laugh"}      # la cabeza a 32 px para iconos diminutos (expediente, logro falso)

def mode_reduce(a, f):
    """reduce f:1 por moda de color (el pixel que mas se repite en cada bloque; transparente si el bloque es casi vacio)"""
    h, w = a.shape[0] // f, a.shape[1] // f; out = np.zeros((h, w, 4), np.uint8)
    for y in range(h):
        for x in range(w):
            blk = a[y * f:(y + 1) * f, x * f:(x + 1) * f].reshape(-1, 4); op = blk[blk[:, 3] > 0]
            if len(op) < f * f / 2: continue
            cols, cnt = np.unique(op, axis=0, return_counts=True); out[y, x] = cols[cnt.argmax()]
    return out

def main():
    L = layers(); parts, base, st = build_parts(L)
    E, G = data(parts)
    atlas, meta = parts.pack()
    buf = io.BytesIO(); Image.fromarray(atlas, "RGBA").save(buf, "WEBP", lossless=True, quality=100, method=6)
    uri = "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()
    js = ("/* Geolite - DON CRUPIER: datos del sprite. GENERADO por tools/crupier/build.py: no editar a mano. */\n"
          "window.AIQ = window.AIQ || {};\nwindow.AIQ.CRUPIER_DATA = " + json.dumps({"atlas": uri, "parts": meta, "expr": E, "gest": G,
          "fidget": list(anim.FIDGET_EVERY),
          "alias": {"expr": anim.EXPR_ALIAS, "gest": anim.GEST_ALIAS}}, separators=(",", ":"), ensure_ascii=False) + ";\n")
    (ROOT / "js" / "crupier-data.js").write_text(js, encoding="utf-8")
    print("atlas", atlas.shape, "piezas", len(meta), "datos", len(js) // 1024, "KB")
    out = ROOT / "assets" / "icons" if "--apply" in sys.argv else Path(__file__).parent / "out"; out.mkdir(exist_ok=True)
    for fname, ex in STILLS.items():                                   # --apply: sustituye los retratos fijos del juego
        e = E[ex]; p = dict(e["base"]); p.update(e.get("still") or {})
        img = pose_img(p, meta, atlas)
        Image.fromarray(img, "RGBA").resize((512, 512), Image.NEAREST).save(out / f"{fname}.webp", "WEBP", lossless=True, quality=100, method=6)
    for fname, ex in MINIS.items():                                   # cabeza entera (de la copa al bigote) 72x72 -> 36x36 nativos, guardada a x2 (72 px)
        e = E[ex]; img = pose_img(dict(e["base"]), meta, atlas)[8:80, 30:102]
        Image.fromarray(mode_reduce(img, 2), "RGBA").resize((72, 72), Image.NEAREST).save(out / f"{fname}.webp", "WEBP", lossless=True, quality=100, method=6)
    if "--sheet" in sys.argv:
        d = Path(sys.argv[sys.argv.index("--sheet") + 1]); d.mkdir(parents=True, exist_ok=True)
        ek = list(E)
        fr = [pose_img(dict(E[k]["base"]), meta, atlas) for k in ek]
        sheet(fr, d / "expr.png", k=3, cols=6, labels=ek)
        Image.fromarray(atlas).resize((atlas.shape[1] * 3, atlas.shape[0] * 3), Image.NEAREST).save(d / "atlas.png")
        for gk, g in G.items():
            sheet([pose_img(dict(E["sly"]["base"], **f[0]), meta, atlas) for f in g["frames"]], d / f"g_{gk}.png", k=2, cols=8,
                  labels=[f"{gk} {i} {f[1]}ms" for i, f in enumerate(g["frames"])])

if __name__ == "__main__":
    main()
