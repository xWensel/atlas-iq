"""Geolite - escenas (4): ilustraciones de tipo de la Enciclopedia (type_*, 128x128). Ver tools/hand_scenes.py."""
import math
import numpy as np
from hand_scenes import Scene, scene, grad, stars, disc_glow, ridge, layer, cloud, sea, grass_tufts, prop, BAYER
from scenes_a import light_pool
from scenes_b import X, Y, sail
from scenes_c import dome_building, windows, tilted_card, pyramid
import hand_icons as hi
from hand_icons import R, INK, WHITE, hexc
from pxkit import shift, dilate, erode, edge

def framed(bg):
    sc = Scene(128, 128); grad(sc, bg, 0, 128); return sc

def frame(sc):
    m = hi.rect(0, 0, 128, 128); ring = m & ~erode(m, 3)
    sc.a[ring] = R["dark"][3]; sc.a[m & ~erode(m, 1)] = INK; sc.a[erode(m, 3) & ~erode(m, 4)] = INK
    for x, y in ((0, 0), (124, 0), (0, 124), (124, 124)): sc.put(hi.rect(x, y, 4, 4), R["gold"][1])
    return sc

@scene("type_battle")
def type_battle(id):
    sc = framed(["9c1a3f", "c8323f", "e0605a"])
    for i, c in enumerate(("ffd95a", "c8323f", "ffd95a", "c8323f")): sc.put(hi.rect(8 + i * 28, 8, 14, 112), hexc(c) if i % 2 == 0 else hexc("a8233a"))
    for flip in (1, -1):                                                       # espadas cruzadas: hoja con punta, guarda, empunadura y pomo
        ax, ay, bx, by = 64 - 44 * flip, 16, 64 + 26 * flip, 88                  # punta -> guarda
        dx, dy = bx - ax, by - ay; L = math.hypot(dx, dy); ux, uy = dx / L, dy / L; nx, ny = -uy, ux
        blade = hi.poly([(ax, ay), (ax + ux * 10 + nx * 5, ay + uy * 10 + ny * 5), (bx + nx * 5, by + ny * 5), (bx - nx * 5, by - ny * 5), (ax + ux * 10 - nx * 5, ay + uy * 10 - ny * 5)])
        c = hi.bevel(blade, R["grey"]); c[hi.thick_line([(ax + ux * 8, ay + uy * 8), (bx, by)], 1) & blade] = R["grey"][0]; sc.add(c)
        sc.add(hi.bevel(hi.thick_line([(bx + nx * 14, by + ny * 14), (bx - nx * 14, by - ny * 14)], 6), R["gold"]))
        sc.add(hi.bevel(hi.thick_line([(bx + ux * 4, by + uy * 4), (bx + ux * 18, by + uy * 18)], 6), R["brown"]))
        sc.add(hi.sphere(hi.circle(bx + ux * 22, by + uy * 22, 5), bx + ux * 22 - 1, by + uy * 22 - 1, 5, R["gold"]))
    return frame(sc)

@scene("type_capital")
def type_capital(id):
    sc = framed(["f06d5a", "ffa070", "ffd08a"]); disc_glow(sc, 64, 60, 26, ["ffe39a", "ffc070"])
    dome_building(sc, 64, 112, 90, 34)
    sc.add(hi.bevel(hi.poly([(26, 78), (64, 62), (102, 78)]), R["paper"])); sc.add(hi.bevel(hi.rect(46, 46, 36, 16), R["paper"]))
    sc.add(hi.sphere(hi.circle(64, 46, 18) & (Y(sc) < 47), 64, 46, 18, R["gold"], cuts=(.75, .5, .25, 0)))
    sc.add(hi.bevel(hi.rect(63, 18, 3, 12), R["grey"], soft=False)); sc.add(hi.bevel(hi.poly([(66, 18), (78, 21), (66, 24)]), R["red"], soft=False))
    sc.add(hi.bevel(hi.rect(0, 112, 128, 16), R["sand"]), outline=False)
    return frame(sc)

@scene("type_city")
def type_city(id):
    sc = framed(["2a1450", "7a2a86", "f0605a"]); stars(sc, 3, 50, 20)
    rng = np.random.default_rng(5); x = 2
    while x < 128:
        w = int(rng.integers(12, 22)); h = int(rng.integers(40, 100)); b = hi.rect(x, 128 - h, w, h)
        sc.a[b] = hexc("241a4a"); sc.a[b & ~shift(b, 0, 1)] = hexc("3a2a6a")
        windows(sc, b, ("ffd95a", "4ee3c1", "ff7ab8")[rng.integers(0, 3)], "1a1238", seed=int(x) + 3, lit=.6); x += w + 2
    return frame(sc)

@scene("type_country")
def type_country(id):
    sc = framed(["4cb4ff", "8ad0ff", "d8f0ff"]); cloud(sc, 94, 30, 40, 10, seed=2)
    g = layer(sc, ridge(sc, 2, 104, 4, 1.2), "46b84a", "8be05a"); grass_tufts(sc, g, 1, "8be05a")
    sc.add(hi.bevel(hi.rect(34, 20, 5, 90), R["grey"], soft=False)); sc.add(hi.sphere(hi.circle(36, 18, 4), 35, 17, 4, R["gold"]))
    fm = np.zeros((sc.S, sc.S), bool)
    for i in range(62):
        off = int(round(math.sin(i / 8) * 4)); fm[24 + off:62 + off, 39 + i] = True
    c = hi.bevel(fm, R["red"]); c[fm & (Y(sc) > 24 + 18 + np.round(np.sin((X(sc) - 39) / 8) * 4))] = R["red"][3]; sc.add(c)
    sc.add(hi.bevel(hi.ellipse(36, 110, 10, 3), R["grey"]))
    return frame(sc)

@scene("type_curiosity")
def type_curiosity(id):
    sc = framed(["e0605a", "f08a6a", "ffa080"])
    for i, y in enumerate((88, 94, 100)): sc.add(hi.bevel(hi.rrect(46 + (i == 2) * 3, y, 28 - (i == 2) * 6, 6, 2), R["grey"]))
    sc.add(hi.bevel(hi.poly([(42, 66), (78, 66), (72, 88), (48, 88)]), R["gold"]))
    sc.add(hi.sphere(hi.circle(60, 50, 30), 60, 50, 30, R["gold"], cuts=(.8, .55, .3, .05)))
    sc.put(hi.thick_line([(52, 84), (52, 64), (60, 72), (68, 64), (68, 84)], 2), R["orange"][3])
    sc.add(hi.bevel(hi.thick_line([(96, 96), (116, 116)], 8), R["brown"])); sc.add(hi.bevel(hi.circle(86, 84, 18), R["gold"]))
    sc.add(hi.sphere(hi.circle(86, 84, 14), 82, 80, 15, R["teal"]), outline=False); sc.put(hi.ellipse(80, 78, 4, 2.5), R["teal"][0])
    for x, y, r in ((20, 24, 7), (104, 22, 5), (18, 96, 4)): sc.add(hi.faceted_star(x, y, r * 1.6, r * .5, "gold", n=4), outline=False)
    return frame(sc)

@scene("type_event")
def type_event(id):
    sc = framed(["e0605a", "f08a6a", "ffa080"])
    page = hi.rrect(14, 22, 100, 92, 6); sc.add(hi.bevel(page, R["paper"]))
    head = hi.rrect(14, 22, 100, 24, 6) | hi.rect(14, 34, 100, 12); sc.add(hi.bevel(head & page, R["red"]), outline=False)
    for x in (36, 90): sc.add(hi.bevel(hi.rrect(x - 3, 12, 7, 20, 3), R["grey"]))
    for yy in range(58, 110, 12):
        for xx in range(24, 108, 14): sc.put(hi.rect(xx, yy, 6, 1), R["paper"][3])
    sc.add(hi.faceted_star(64, 80, 26, 11, "gold"))
    return frame(sc)

@scene("type_landmark")
def type_landmark(id):
    sc = framed(["4cb4ff", "8ad0ff", "d8f0ff"])
    sc.add(hi.bevel(hi.rect(8, 104, 112, 8), R["sand"])); sc.add(hi.bevel(hi.rect(14, 96, 100, 8), R["sand"]))
    for x in range(20, 112, 16):
        col = hi.rect(x, 44, 9, 52); c = hi.bevel(col, R["paper"]); c[hi.rect(x + 3, 46, 1, 48)] = R["paper"][3]; c[hi.rect(x + 6, 46, 1, 48)] = R["paper"][3]; sc.add(c)
    sc.add(hi.bevel(hi.rect(12, 36, 104, 8), R["paper"])); sc.add(hi.bevel(hi.poly([(8, 36), (64, 12), (120, 36)]), R["paper"]))
    sc.put(hi.poly([(28, 32), (64, 18), (100, 32)]), R["paper"][3])
    sc.add(hi.bevel(hi.rect(0, 112, 128, 16), R["green"]), outline=False)
    return frame(sc)

@scene("type_nature")
def type_nature(id):
    sc = framed(["4cb4ff", "8ad0ff", "d8f0ff"]); disc_glow(sc, 30, 28, 9, ["fff6c8", "ffe39a", "c0e8ff"])
    mt = hi.poly([(0, 84), (40, 34), (70, 70), (92, 44), (128, 84), (128, 128), (0, 128)])
    c = np.zeros_like(sc.a); c[mt] = hexc("7a6aa6"); sc.add(c, outline=False)
    for cx, top, w in ((40, 34, 12), (92, 44, 10)): sc.put(hi.poly([(cx - w, top + w * 1.1), (cx, top), (cx + w, top + w * 1.1), (cx + 3, top + w * .8), (cx - 3, top + w)]) & mt, hexc("f4f4f8"))
    g = layer(sc, ridge(sc, 3, 92, 3, 1.5), "2f9a45", "46b84a")
    for x in range(-2, 132, 11):
        for k, yy in enumerate((0, 8)):
            tr = hi.poly([(x - 7 + k * 2, 110 - yy), (x, 90 - yy - (x % 3) * 2), (x + 7 - k * 2, 110 - yy)]); sc.add(hi.bevel(tr, R["green"]))
    return frame(sc)

@scene("type_person")
def type_person(id):
    sc = framed(["e0605a", "f08a6a", "ffa080"])
    sc.add(hi.bevel(hi.rrect(40, 100, 48, 12, 3), R["gold"])); sc.add(hi.bevel(hi.rect(52, 90, 24, 12), R["gold"]))
    torso = hi.poly([(30, 92), (40, 70), (88, 70), (98, 92)]); sc.add(hi.bevel(torso, R["paper"]))
    sc.put(hi.thick_line([(44, 78), (60, 90)], 1) | hi.thick_line([(84, 76), (70, 90)], 1), R["paper"][3])
    sc.add(hi.bevel(hi.rect(56, 60, 16, 12), R["paper"]))
    head = hi.ellipse(64, 44, 18, 22); c = hi.bevel(head, R["paper"])
    c[hi.poly([(62, 42), (58, 52), (64, 52)])] = R["paper"][3]; c[hi.rect(54, 38, 6, 2)] = R["paper"][4]; c[hi.rect(68, 38, 6, 2)] = R["paper"][4]
    c[hi.rect(58, 56, 10, 1)] = R["paper"][4]; sc.add(c)
    for side in (-1, 1):                                                       # corona de laurel
        for i in range(6):
            t = math.radians(200 + i * 22) if side < 0 else math.radians(-20 - i * 22)
            x, y = 64 + 20 * math.cos(t), 42 + 22 * math.sin(t); tx, ty = -math.sin(t), math.cos(t)
            leaf = hi.poly([(x - tx * 6, y - ty * 6), (x - ty * 3, y + tx * 3), (x + tx * 6, y + ty * 6), (x + ty * 3, y - tx * 3)])
            sc.add(hi.bevel(leaf, R["green"]))
    return frame(sc)

@scene("type_place")
def type_place(id):
    sc = framed(["e0605a", "f08a6a", "ffa080"])
    mp = hi.poly([(8, 70), (44, 60), (84, 72), (120, 60), (120, 112), (84, 124), (44, 112), (8, 122)]); c = hi.bevel(mp, R["sand"])
    c[mp & (X(sc) > 44) & (X(sc) < 84)] = R["sand"][3]
    c[hi.poly([(10, 90), (30, 80), (40, 100), (20, 116)]) & mp] = R["green"][2]; c[hi.poly([(88, 76), (116, 70), (118, 100), (96, 110)]) & mp] = R["blue"][1]
    c[hi.thick_line([(20, 100), (50, 90), (64, 96)], 2) & mp] = R["red"][2]; sc.add(c)
    pin = hi.circle(64, 42, 22) | hi.poly([(46, 54), (82, 54), (64, 96)]); pc = hi.bevel(pin, R["red"]); pc[hi.circle(64, 41, 8)] = R["paper"][1]; sc.add(pc)
    return frame(sc)

@scene("type_strait")
def type_strait(id):
    sc = framed(["2a78e4", "2a78e4"])
    sea(sc, 0, ["4cb4ff", "2a78e4", "1f4bb0"], 4)
    left = hi.poly([(0, 0), (50, 0), (44, 30), (54, 60), (42, 90), (52, 128), (0, 128)])
    right = hi.poly([(76, 0), (128, 0), (128, 128), (80, 128), (72, 96), (82, 64), (70, 34)])
    for m, rp in ((left, "green"), (right, "sand")):
        c = hi.bevel(m, R[rp]); c[m & ~erode(m, 3) & (sc.a[..., 3] > 0)] = R["sand"][0] if rp == "green" else R["sand"][1]; sc.add(c)
    for x, y in ((14, 20), (26, 70), (100, 30), (108, 96)): sc.add(hi.bevel(hi.circle(x, y, 6), R["green"]))
    sail(sc, 58, 56, 8, 12, 1); sc.add(hi.bevel(hi.poly([(54, 70), (72, 70), (68, 76), (58, 76)]), R["brown"]))
    return frame(sc)

@scene("type_water")
def type_water(id):
    sc = framed(["fff4dc", "ffe39a", "ffd08a"]); disc_glow(sc, 96, 34, 12, ["ff5a55", "ff8a7a"])
    wave = np.zeros((sc.S, sc.S), bool)
    for x in range(128):
        t = x / 128; top = 110 - 70 * math.sin(math.pi * min(1, t * 1.25)) ** 1.5 if t < .8 else 110 - 30 * (1 - (t - .8) / .2)
        wave[int(top):128, x] = True
    curl = hi.circle(78, 52, 16) & ~hi.circle(84, 58, 10); wave |= curl
    c = hi.bevel(wave, R["blue"]); c[wave & (Y(sc) > 90)] = R["blue"][3]
    for k in range(4): c[wave & (np.abs(Y(sc) - (58 + k * 14) - 6 * np.sin(X(sc) / 9 + k)) < 1.2)] = R["blue"][0]
    sc.add(c)
    foam = hi.circle(80, 40, 6) | hi.circle(90, 44, 5) | hi.circle(70, 38, 5) | hi.circle(96, 50, 4)
    sc.add(hi.bevel(foam, R["ice"]))
    for x, y in ((104, 58), (110, 66), (100, 68)): sc.add(hi.bevel(hi.circle(x, y, 2.5), R["ice"], soft=False))
    return frame(sc)
