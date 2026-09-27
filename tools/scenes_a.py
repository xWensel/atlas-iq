"""Geolite - escenas (1): actos, campamento y mesa del menu. Ver tools/hand_scenes.py."""
import math
import numpy as np
from hand_scenes import Scene, scene, grad, stars, disc_glow, ridge, layer, cloud, sea, grass_tufts, prop, BAYER
import hand_icons as hi
from hand_icons import R, INK, WHITE, hexc
from pxkit import shift, dilate, erode, edge, land_mask

def light_pool(sc, cx, cy, rx, ry, cols, mask=None):
    """charco de luz calida tramado sobre lo que ya hay (cols: interior -> exterior); solo recolorea"""
    y, x = np.mgrid[0:sc.S, 0:sc.S]; d = np.hypot((x + .5 - cx) / rx, (y + .5 - cy) / ry)
    for i in range(len(cols) - 1, -1, -1):
        rr = (i + 1) / len(cols); m = (d < rr) & ~((d > rr - .12) & (BAYER[y % 4, x % 4] < .5))
        if mask is not None: m &= mask
        sc.a[m & (sc.a[..., 3] > 0)] = hexc(cols[i])

def road(sc, y0, cx0, bend, w_far, w_near):
    """carretera en perspectiva desde el horizonte (y0) hasta abajo: asfalto, arcenes y linea discontinua"""
    for y in range(y0, sc.h):
        t = (y - y0) / (sc.h - y0); cx = cx0 + bend * math.sin(t * 2.4) * (1 - t) + bend * .3 * t
        w = w_far + (w_near - w_far) * t ** 1.35
        x0, x1 = int(round(cx - w / 2)), int(round(cx + w / 2))
        sc.a[y, max(0, x0):min(sc.w, x1 + 1)] = hexc("3a3b58")
        sc.a[y, max(0, x0):max(0, x0) + 1 + int(t * 2)] = hexc("fff4dc")
        sc.a[y, max(0, x1 - int(t * 2)):min(sc.w, x1 + 1)] = hexc("c9aa84")
        if int((t ** .7) * 22) % 2 == 0 and w > 6:
            lw = max(1, int(t * 3)); sc.a[y, int(cx) - lw // 2:int(cx) - lw // 2 + lw] = hexc("ffd95a")

def flag(sc, x, y, h, col="paper", pip="spade"):
    pole = hi.rect(x, y, 2, h); sc.add(hi.bevel(pole, R["grey"], soft=False))
    fm = np.zeros((sc.S, sc.S), bool)
    for i in range(22):
        off = int(round(math.sin(i / 3.2) * 1.6))
        fm[y + 1 + off:y + 15 + off, x + 2 + i] = True
    c = hi.bevel(fm, R[col]); pm = hi.pip(pip, x + 13, y + 8, 9); c[pm] = R["dark"][2]
    sc.add(c)

@scene("act_0")
def act_0(id):
    sc = Scene(256, 144)
    grad(sc, ["2b1c5a", "5a2a86", "a8327a", "f0605a", "ffa244", "ffd95a"], 0, 92)
    disc_glow(sc, 128, 80, 17, ["fff6c8", "ffd95a", "ffb347"])
    for cx, cy, w, h, s in ((40, 22, 46, 12, 1), (206, 30, 38, 10, 2), (150, 14, 28, 8, 3)):
        cloud(sc, cx, cy, w, h, ("ffc9a8", "f08a7a", "b85a7a"), s)
    far = ridge(sc, 3, 84, 7, 1.3); layer(sc, far, "8a4a8a", "b0609a")
    mid = ridge(sc, 5, 96, 9, 1.0); layer(sc, mid, "3f7a5a", "5fa06a")
    near = ridge(sc, 8, 110, 12, .8); m = layer(sc, near, "3fb54a", "8be05a")
    sc.a[m & (np.arange(sc.S)[:, None] > near[None, :] + 6)] = hexc("2f9a45")
    grass_tufts(sc, m, 2, "8be05a")
    road(sc, 88, 128, 26, 2, 92)
    flag(sc, 196, 70, 30)
    sc.paste(prop("chips", .5), 22, 108, True); sc.paste(prop("chip_r", .5), 44, 118, True); sc.paste(prop("coin", .5), 214, 110, True)
    return sc

@scene("camp")
def camp(id):
    sc = Scene(256, 144)
    grad(sc, ["0d0b26", "1b1a4a", "2a2a6e", "3b3a86"], 0, 96)
    stars(sc, 4, 80, 90); disc_glow(sc, 214, 24, 9, ["fff6c8", "3b3a86", "2a2a6e"])
    sc.a[hi.circle(218, 21, 8) & (np.arange(sc.S)[None, :] < sc.w)] = hexc("2a2a6e")
    disc_glow(sc, 214, 24, 0.1, ["fff6c8"])
    moon = hi.circle(214, 24, 9) & ~hi.circle(219, 20, 8); sc.put(moon, hexc("fff6c8"))
    trees = ridge(sc, 11, 88, 6, 3.0, 4); layer(sc, trees, "15163a")
    for x0 in (8, 30, 232, 250):                             # abetos en silueta
        for i in range(4): sc.put(hi.poly([(x0 - 10 + i * 2, 90 - i * 10), (x0, 70 - i * 10), (x0 + 10 - i * 2, 90 - i * 10)]), hexc("15163a"))
    g = layer(sc, np.full(sc.S, 98), "1f4a3e", "2f6a4a")
    light_pool(sc, 196, 124, 70, 28, ["8a7a3a", "5a6a3a", "3a5a3e"], g)
    # guirnalda de bombillas
    for i in range(15):
        x = 20 + i * 15; y = 30 + int(10 * math.sin(i / 14 * math.pi))
        if i: sc.put(hi.thick_line([(x - 15, 30 + int(10 * math.sin((i - 1) / 14 * math.pi))), (x, y)], 1), hexc("0a0a1a"))
        disc_glow(sc, x, y + 3, 1.6, ["fff6c8", "ffd95a", "7a6a4a"])
    # tienda de rayas
    tent = hi.poly([(12, 124), (58, 44), (104, 124)]); c = np.zeros_like(sc.a)
    xs = np.arange(sc.S)[None, :].repeat(sc.S, 0); stripes = ((xs - 58) // 9) % 2 == 0
    c[tent] = R["red"][2]; c[tent & stripes] = R["paper"][2]
    c[tent & (xs > 58)] = np.where((tent & stripes)[..., None], np.array(R["paper"][3]), np.array(R["red"][3]))[tent & (xs > 58)]
    door = hi.poly([(58, 70), (44, 124), (72, 124)]); c[door] = hexc("1a0b26")
    sc.add(c); sc.put(hi.poly([(58, 70), (50, 124), (58, 124)]) & door, R["red"][1])
    # mesa con el mapa
    sc.add(hi.bevel(hi.rect(96, 104, 64, 6), R["brown"])); sc.add(hi.bevel(hi.rect(100, 110, 4, 22), R["brown"])); sc.add(hi.bevel(hi.rect(152, 110, 4, 22), R["brown"]))
    top = hi.poly([(98, 104), (158, 104), (152, 96), (104, 96)]); sc.add(hi.bevel(top, R["green"]))
    sc.put(hi.poly([(108, 102), (148, 102), (144, 97), (112, 97)]), R["sand"][1])
    for x, y in ((118, 99), (130, 100), (140, 98)): sc.put(hi.ellipse(x, y, 3, 1), R["green"][2])
    sc.paste(prop("cards", .5), 120, 76, True)
    # hoguera
    for i, (dx, rp) in enumerate(((-8, "brown"), (8, "brown"))): sc.add(hi.bevel(hi.thick_line([(196 + dx, 132), (196 - dx, 124)], 4), R[rp]))
    fl = hi.poly([(186, 126), (190, 108), (194, 116), (197, 98), (201, 112), (205, 106), (207, 126)]); sc.add(hi.bevel(fl, R["orange"]))
    sc.put(hi.poly([(191, 126), (195, 112), (198, 118), (201, 110), (203, 126)]), R["gold"][1]); sc.put(hi.poly([(195, 126), (198, 118), (201, 126)]), R["gold"][0])
    sc.paste(prop("chips", .5), 64, 104, True)
    return sc

@scene("hub_hero")
def hub_hero(id):
    sc = Scene(256, 112)
    rail = hi.rrect(0, 0, 256, 112, 18) & (np.arange(sc.S)[:, None] < 112)
    sc.a[:112, :256] = hexc("3a1a2e"); sc.add(hi.bevel(rail, R["red"]), outline=False)
    felt = hi.rrect(10, 9, 236, 94, 12); grad(sc, ["2fae6a", "23945a", "1b7a4c"], 9, 103, mask=felt)
    sc.a[felt & ~erode(felt, 1)] = INK; sc.a[erode(felt, 3) & ~erode(felt, 4)] = hexc("5fd08a")
    # mapamundi en el tapete (tierra real, equirectangular)
    L = land_mask(2048); H, W = 70, 150; y0, x0 = 18, 20
    for y in range(H):
        lat = 80 - y / H * 140
        for x in range(W):
            lon = -170 + x / W * 340
            if L[int((90 - lat) / 180 * L.shape[0]), int((lon + 180) / 360 * L.shape[1]) % L.shape[1]]:
                sc.a[y0 + y, x0 + x] = hexc("7fd08a")
    lm = np.zeros((sc.S, sc.S), bool); lm[y0:y0 + H, x0:x0 + W] = (sc.a[y0:y0 + H, x0:x0 + W] == hexc("7fd08a")).all(-1)
    sc.a[lm & ~shift(lm, 0, 1)] = hexc("c8f0a0"); sc.a[lm & ~shift(lm, 0, -1)] = hexc("4fae6a")
    sc.paste(prop("chips", .5), 184, 24, True); sc.paste(prop("allin", .5), 206, 20, True); sc.paste(prop("cards", .5), 196, 58, True)
    sc.paste(prop("chip_r", .5), 168, 64, True); sc.paste(prop("coin", .5), 222, 64, True)
    return sc
