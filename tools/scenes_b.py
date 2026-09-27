"""Geolite - escenas (2): actos II y III, leyenda y jefes. Ver tools/hand_scenes.py."""
import math
import numpy as np
from hand_scenes import Scene, scene, grad, stars, disc_glow, ridge, layer, cloud, cloud_mask, sea, grass_tufts, prop, BAYER
from scenes_a import light_pool
import hand_icons as hi
from hand_icons import R, INK, WHITE, hexc
from pxkit import shift, dilate, erode, edge

Y = lambda sc: np.broadcast_to(np.arange(sc.S)[:, None], (sc.S, sc.S))
X = lambda sc: np.broadcast_to(np.arange(sc.S)[None, :], (sc.S, sc.S))

def sail(sc, x, y, w, h, bulge=3, emblem=None):
    m = np.zeros((sc.S, sc.S), bool)
    for j in range(h):
        b = int(round(bulge * math.sin(math.pi * j / (h - 1))))
        m[y + j, x + b:x + w + b] = True
    c = hi.bevel(m, R["paper"]); c[m & (X(sc) > x + w * .62 + bulge)] = R["paper"][3]
    if emblem: c[hi.pip(emblem, x + w // 2 + bulge, y + h // 2, min(w, h) * .45)] = R["red"][2] if emblem in ("heart", "diamond") else R["dark"][2]
    sc.add(c)

def galleon(sc, x, y):
    """galeon de perfil: casco con franja dorada, dos palos con velas cuadradas y gallardetes"""
    for mx, top in ((x + 30, y - 58), (x + 62, y - 50)):
        sc.add(hi.bevel(hi.rect(mx, top, 3, 62), R["brown"], soft=False))
        pen = hi.poly([(mx + 3, top), (mx + 16, top + 3), (mx + 3, top + 6)]); sc.add(hi.bevel(pen, R["red"], soft=False))
    sail(sc, x + 16, y - 50, 30, 20, 3, "spade"); sail(sc, x + 18, y - 28, 26, 18, 3)
    sail(sc, x + 48, y - 42, 28, 18, 3, "diamond"); sail(sc, x + 50, y - 22, 24, 14, 3)
    hull = hi.poly([(x, y - 6), (x + 96, y - 10), (x + 88, y + 12), (x + 12, y + 12)]) | hi.rect(x + 70, y - 18, 24, 10)
    c = hi.bevel(hull, R["brown"]); c[hull & (np.abs(Y(sc) - (y - 2)) < 1.5)] = R["gold"][1]
    for wx in range(x + 18, x + 84, 12): c[hi.rect(wx, y + 3, 4, 3)] = R["dark"][3]
    sc.add(c)
    sc.add(hi.bevel(hi.thick_line([(x + 96, y - 10), (x + 116, y - 20)], 2), R["brown"], soft=False))

@scene("act_1")
def act_1(id):
    sc = Scene(256, 144)
    grad(sc, ["1b1a4a", "3b2a7a", "7a3a8a", "e0607a", "ffb070"], 0, 88); stars(sc, 7, 40, 40)
    disc_glow(sc, 196, 80, 14, ["fff0c0", "ffc080", "f08a7a"])
    for cx, cy, w, h, s in ((60, 30, 50, 12, 4), (170, 40, 40, 9, 6)): cloud(sc, cx, cy, w, h, ("ffc0b0", "c0608a", "7a3a7a"), s)
    isl = ridge(sc, 12, 86, 4, 2.2); isl[:150] = 999; isl[230:] = 999; layer(sc, isl, "5a3a7a", y_end=90)
    sea(sc, 88, ["ffc080", "c0608a", "5a3a8a", "2a2a6e", "1b1a4a"], 3)
    ref = (np.abs(X(sc) - 196) < 10 - (Y(sc) - 88) * .05) & (Y(sc) > 88) & ((Y(sc) % 3) == 0) & (Y(sc) < sc.h); sc.a[ref] = hexc("fff0c0")
    galleon(sc, 46, 112)
    for x in range(30, 170, 7): sc.a[124 + (x // 7) % 3, x:x + 4] = hexc("fff4dc")
    return sc

def moai(sc, x, y, s=1.0, rp="grey"):
    """moai de frente: cabeza alargada con frente, nariz y barbilla; sombra a la derecha"""
    w, h = int(22 * s), int(46 * s)
    head = hi.rrect(x, y, w, h, int(4 * s)) | hi.rect(x - int(2 * s), y + int(8 * s), w + int(4 * s), int(8 * s))
    body = hi.rect(x - int(6 * s), y + h - int(4 * s), w + int(12 * s), int(22 * s))
    sc.add(hi.bevel(body, R[rp])); c = hi.bevel(head, R[rp])
    c[hi.rect(x + int(3 * s), y + int(12 * s), w - int(6 * s), int(4 * s))] = R[rp][4]            # cejas / cuencas
    c[hi.poly([(x + w // 2 - 1, y + int(14 * s)), (x + w // 2 + 3 * s, y + int(30 * s)), (x + w // 2 - 3 * s, y + int(30 * s))])] = R[rp][1]
    c[hi.rect(x + w // 2 - int(2 * s), y + int(28 * s), int(6 * s), int(3 * s))] = R[rp][3]
    c[hi.rect(x + int(5 * s), y + int(36 * s), w - int(10 * s), max(1, int(2 * s)))] = R[rp][4]
    c[head & (X(sc) > x + w * .66)] = np.where(c[head & (X(sc) > x + w * .66)][:, :1] == R[rp][4][0], np.array(R[rp][4]), np.array(R[rp][3]))
    sc.add(c)

def foliage(sc, seed, y0, cols, n=18, r=(8, 16)):
    rng = np.random.default_rng(seed)
    for _ in range(n):
        cx, cy, rr = rng.integers(-10, sc.w + 10), y0 + rng.integers(-6, 10), rng.integers(*r)
        m = hi.circle(cx, cy, rr) | hi.circle(cx + rr * .7, cy + 3, rr * .7) | hi.circle(cx - rr * .7, cy + 4, rr * .6)
        sc.a[m] = hexc(cols[1]); sc.a[m & ~shift(m, 0, 2)] = hexc(cols[0])

@scene("act_2")
def act_2(id):
    sc = Scene(256, 144)
    grad(sc, ["0a1a2a", "143a4a", "1f5a5a"], 0, 100); grad(sc, ["1a4a44", "12322e"], 100, 144); stars(sc, 9, 50, 50)
    disc_glow(sc, 200, 26, 11, ["fff6c8", "8ac0b0", "2a6a6a"])
    foliage(sc, 3, 70, ("2a6a5a", "1a4a44"), 22, (10, 18))
    moai(sc, 60, 58, 1.0, "grey"); moai(sc, 170, 58, 1.0, "grey"); moai(sc, 112, 44, 1.3, "brown")
    foliage(sc, 5, 128, ("46b84a", "26804a"), 20, (8, 14)); foliage(sc, 8, 142, ("2f9a45", "1b4d3e"), 18, (8, 12))
    rng = np.random.default_rng(3)
    for _ in range(18):
        x, y = rng.integers(4, 250), rng.integers(40, 120); sc.a[y, x] = hexc("fff6a0")
        if rng.random() < .5: sc.a[y, x + 1] = hexc("c8e070")
    sc.paste(prop("chip_g", .5), 20, 110, True); sc.paste(prop("chip_r", .5), 206, 112, True)
    return sc

@scene("act_3")
def act_3(id):
    sc = Scene(256, 144)
    grad(sc, ["120a2e", "2a1450", "4a2a86"], 0, 144); stars(sc, 13, 144, 110)
    for i, (col, off) in enumerate((("2fd08a", 0), ("4ee3c1", 6), ("b36cff", 14))):       # aurora: cintas onduladas tramadas
        for x in range(sc.w):
            yc = 30 + off + 10 * math.sin(x / 26 + i) + 5 * math.sin(x / 9 + i * 2)
            for dy in range(18 - i * 4):
                if (dy < 6 or BAYER[(int(yc) + dy) % 4, x % 4] < .5 - dy / 40): sc.a[int(yc) + dy, x] = hexc(col)
    g = hi.globe_part(80, 128, 84, -50, 10); sc.add(g)
    cr = hi.poly([(98, 48), (98, 28), (110, 40), (120, 20), (128, 34), (136, 20), (146, 40), (158, 28), (158, 48)])
    sc.add(hi.bevel(cr, R["gold"]))
    for x, y, c in ((128, 40, "red"), (110, 43, "teal"), (146, 43, "teal")): sc.add(hi.sphere(hi.circle(x, y, 3.4), x - .5, y - .5, 3.4, R[c]))
    sc.paste(prop("chip_p", .5), 36, 84, True)
    sc.paste(prop("cards", .5), 196, 90, True); sc.paste(prop("a_spark", .5), 40, 24, False); sc.paste(prop("a_spark", .5), 196, 18, False)
    return sc

@scene("boss_fog")
def boss_fog(id):
    sc = Scene(256, 144)
    grad(sc, ["3a3a6a", "5a5a8a", "8a86b0", "b0aac8"], 0, 96)
    sea(sc, 96, ["b0aac8", "7a7aa6", "4a4a7a", "2a2a5a"], 5)
    cliff = ridge(sc, 2, 92, 10, 1.4); cliff[:150] = 999; layer(sc, cliff, "3a3a5a", "5a5a7a")
    lx, ly = 196, 30                                                            # faro de rayas
    tower = hi.poly([(lx - 9, ly + 60), (lx - 6, ly), (lx + 6, ly), (lx + 9, ly + 60)])
    c = hi.bevel(tower, R["paper"]); c[tower & ((Y(sc) - ly) // 10 % 2 == 1)] = R["red"][2]; sc.add(c)
    sc.add(hi.bevel(hi.rect(lx - 9, ly - 4, 18, 5), R["dark"])); sc.add(hi.bevel(hi.rect(lx - 6, ly - 13, 12, 9), R["gold"]))
    sc.add(hi.bevel(hi.poly([(lx - 8, ly - 13), (lx, ly - 21), (lx + 8, ly - 13)]), R["red"]))
    beam = hi.poly([(lx - 6, ly - 10), (20, ly - 26), (20, ly + 14), (lx - 6, ly - 6)])
    yy, xx = np.mgrid[0:sc.S, 0:sc.S]; sc.a[beam & (BAYER[yy % 4, xx % 4] < .45)] = hexc("fff4c2")
    for (cx, cy, w, h, s) in ((50, 90, 120, 18, 1), (140, 104, 140, 16, 2), (40, 118, 110, 16, 3), (200, 124, 120, 16, 4)):
        m = cloud_mask(sc, cx, cy, w, h, s); sc.a[m & (BAYER[yy % 4, xx % 4] < .7)] = hexc("d8d4ea")
    return sc

def slot_machine(sc, x, y, w=76, h=92):
    body = hi.rrect(x, y, w, h, 6); sc.add(hi.bevel(body, R["red"]))
    top = hi.rrect(x + 6, y - 12, w - 12, 16, 6); sc.add(hi.bevel(top, R["gold"]))
    for i in range(5): sc.put(hi.circle(x + 14 + i * (w - 28) / 4, y - 4, 2), hexc("fff6c8"))
    win = hi.rrect(x + 8, y + 12, w - 16, 34, 3); sc.add(hi.bevel(win, R["dark"]))
    for i, sym in enumerate(("diamond", "spade", "heart")):
        rx = x + 11 + i * (w - 22) // 3; reel = hi.rect(rx, y + 15, (w - 22) // 3 - 3, 28); sc.add(hi.bevel(reel, R["paper"]), outline=False)
        cx = rx + ((w - 22) // 3 - 3) / 2; pm = hi.pip(sym, cx, y + 29, 14); sc.put(pm, R["red"][2] if sym != "spade" else R["dark"][2])
    sc.add(hi.bevel(hi.rrect(x + 12, y + 56, w - 24, 10, 3), R["gold"]))
    sc.add(hi.bevel(hi.rect(x + 10, y + 74, w - 20, 8), R["dark"]))
    sc.add(hi.bevel(hi.rect(x + w, y + 30, 6, 30), R["grey"])); sc.add(hi.bevel(hi.thick_line([(x + w + 3, y + 30), (x + w + 10, y + 6)], 3), R["grey"], soft=False))
    sc.add(hi.sphere(hi.circle(x + w + 11, y + 4, 6), x + w + 9, y + 2, 6, R["red"]))

@scene("boss_storm")
def boss_storm(id):
    sc = Scene(256, 144)
    grad(sc, ["0e0e22", "1c1c3a", "2a2a4e", "3a3a5e"], 0, 110)
    for cx, cy, w, h, s in ((40, 20, 90, 22, 1), (150, 14, 110, 26, 2), (236, 30, 70, 18, 3), (100, 40, 80, 16, 4)):
        cloud(sc, cx, cy, w, h, ("6a6a8e", "4a4a6e", "33335a"), s)
    bolt = hi.poly([(70, 34), (52, 70), (64, 70), (48, 108), (84, 60), (70, 60), (82, 34)]); sc.add(hi.bevel(bolt, R["gold"]))
    sea(sc, 110, ["5a5a8a", "3a3a6a", "22224a"], 7)
    yy, xx = np.mgrid[0:sc.S, 0:sc.S]
    rain = (((xx + yy // 2) % 11) == 0) & (((yy // 3) % 3) != 0) & (yy < sc.h); sc.a[rain & (sc.a[..., :3].sum(-1) < 400)] = hexc("6a7ab0")
    slot_machine(sc, 136, 46)
    return sc

@scene("boss_silence")
def boss_silence(id):
    sc = Scene(256, 144)
    grad(sc, ["1a0e2e", "2e1a4a", "3e2458"], 0, 144)
    yy, xx = np.mgrid[0:sc.S, 0:sc.S]
    spot = hi.poly([(118, 0), (138, 0), (200, 144), (56, 144)]); sc.a[spot & (BAYER[yy % 4, xx % 4] < .35) & (yy < sc.h)] = hexc("4e3470")
    wheel = hi.ellipse(128, 110, 110, 34); sc.add(hi.bevel(wheel, R["brown"]))
    rim = hi.ellipse(128, 106, 98, 28); sc.add(hi.bevel(rim, R["gold"]), outline=False)
    pk = hi.ellipse(128, 106, 90, 25) & ~hi.ellipse(128, 106, 60, 16)
    ang = (np.degrees(np.arctan2((yy - 106) * 3.5, xx - 128)) + 360) % 360
    c = np.zeros_like(sc.a); c[pk & ((ang // 12) % 2 == 0)] = R["red"][2]; c[pk & ((ang // 12) % 2 == 1)] = R["dark"][3]; c[pk & (ang < 12)] = R["green"][2]
    sc.add(c, outline=False); sc.add(hi.bevel(hi.ellipse(128, 106, 60, 16), R["green"]), outline=False)
    bell = hi.poly([(108, 96), (112, 70), (118, 58), (128, 54), (138, 58), (144, 70), (148, 96)]) | hi.ellipse(128, 96, 24, 5)
    sc.add(hi.bevel(bell, R["gold"])); sc.add(hi.bevel(hi.rect(125, 44, 6, 10), R["gold"])); sc.add(hi.sphere(hi.circle(128, 101, 5), 127, 100, 5, R["gold"]))
    x_ = hi.thick_line([(108, 58), (148, 98)], 6) | hi.thick_line([(148, 58), (108, 98)], 6); sc.add(hi.bevel(x_, R["red"]))
    return sc

def scales(sc, cx, top):
    sc.add(hi.bevel(hi.rect(cx - 2, top, 5, 60), R["gold"])); sc.add(hi.bevel(hi.ellipse(cx, top + 62, 22, 5), R["gold"]))
    beam = hi.rect(cx - 36, top + 6, 72, 4); sc.add(hi.bevel(beam, R["gold"]))
    for sx in (cx - 34, cx + 34):
        for dx in (-10, 10): sc.put(hi.thick_line([(sx, top + 10), (sx + dx, top + 34)], 1), R["gold"][3])
        pan = hi.ellipse(sx, top + 35, 13, 4) & (Y(sc) > top + 33); sc.add(hi.bevel(pan, R["gold"]))
    sc.add(hi.sphere(hi.circle(cx, top + 2, 5), cx - 1, top + 1, 5, R["gold"]))

@scene("boss_strict")
def boss_strict(id):
    sc = Scene(256, 144)
    grad(sc, ["5e1238", "9c1a3f", "c8323f"], 0, 104)
    yy, xx = np.mgrid[0:sc.S, 0:sc.S]
    spot = hi.poly([(210, 0), (236, 0), (170, 104), (60, 104)]); sc.a[spot & (BAYER[yy % 4, xx % 4] < .4)] = hexc("e0605a")
    table = hi.poly([(0, 104), (256, 104), (256, 144), (0, 144)]); sc.add(hi.bevel(table, R["green"]), outline=False)
    sc.add(hi.bevel(hi.rect(0, 100, 256, 6), R["brown"]))
    scales(sc, 128, 26)
    ruler = hi.poly([(26, 100), (40, 100), (74, 20), (60, 18)]); sc.add(hi.bevel(ruler, R["gold"]))
    for i in range(10): sc.put(hi.thick_line([(40 + i * 3.4 - 2, 96 - i * 8), (44 + i * 3.4 - 2, 96 - i * 8)], 1), R["gold"][4])
    sc.paste(prop("globe", .5), 184, 70, True); sc.paste(prop("chips", .5), 210, 108, True)
    return sc

@scene("boss_wind")
def boss_wind(id):
    sc = Scene(256, 144)
    grad(sc, ["2a78e4", "4cb4ff", "a8ecff"], 0, 70)
    for cx, cy, w, h, s in ((50, 22, 70, 18, 1), (200, 30, 90, 22, 2), (130, 12, 50, 12, 3)): cloud(sc, cx, cy, w, h, seed=s)
    sea(sc, 70, ["a8ecff", "4cb4ff", "2a78e4", "1f4bb0"], 2)
    table = hi.poly([(0, 94), (256, 94), (256, 144), (0, 144)]); sc.add(hi.bevel(table, R["red"]), outline=False)
    felt = hi.poly([(10, 100), (246, 100), (256, 144), (0, 144)]); sc.add(hi.bevel(felt, R["green"]), outline=False)
    for i, (x, y, a) in enumerate(((70, 40, -25), (120, 58, 15), (176, 34, -40))):
        t = math.radians(a); ct, st = math.cos(t), math.sin(t); w, h = 18, 26
        pts = [(x + dx * ct - dy * st, y + dx * st + dy * ct) for dx, dy in ((-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2))]
        c = hi.bevel(hi.poly(pts), R["paper"]); c[hi.pip(("spade", "heart", "diamond")[i], x, y, 10)] = (R["dark"] if i == 0 else R["red"])[2]; sc.add(c)
    for y, x0, l in ((30, 10, 50), (52, 180, 60), (80, 30, 70)):
        pts = [(x0, y), (x0 + l, y)] + [(x0 + l + 5 * math.sin(t), y - (5 - 5 * math.cos(t))) for t in np.linspace(0, math.pi * 1.3, 6)]
        sc.put(hi.thick_line(pts, 2), hexc("ffffff"))
    sc.paste(prop("chips", .5), 24, 104, True); sc.paste(prop("chip_b", .5), 200, 110, True)
    return sc
