"""Geolite - escenas (3): temas de ronda, cartas del menu, cofre, victoria, derrota y tienda. Ver tools/hand_scenes.py."""
import math
import numpy as np
from hand_scenes import Scene, scene, grad, stars, disc_glow, ridge, layer, cloud, cloud_mask, sea, grass_tufts, prop, BAYER
from scenes_a import light_pool, road
from scenes_b import slot_machine, X, Y
import hand_icons as hi
from hand_icons import R, INK, WHITE, hexc
from pxkit import shift, dilate, erode, edge, land_mask

def rays(sc, cx, cy, cols, n=16):
    yy, xx = np.mgrid[0:sc.S, 0:sc.S]; ang = (np.degrees(np.arctan2(yy + .5 - cy, xx + .5 - cx)) + 360) % 360
    sc.a[:sc.h, :sc.w] = hexc(cols[0]); sc.a[((ang // (360 / n)) % 2 == 0) & (yy < sc.h)] = hexc(cols[1])
    d = np.hypot(xx - cx, yy - cy); sc.a[(d < 40) & (BAYER[yy % 4, xx % 4] < .5) & (yy < sc.h)] = hexc(cols[2])

def tilted_card(sc, x, y, a, pip, w=18, h=26):
    t = math.radians(a); ct, st = math.cos(t), math.sin(t)
    pts = [(x + dx * ct - dy * st, y + dx * st + dy * ct) for dx, dy in ((-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2))]
    c = hi.bevel(hi.poly(pts), R["paper"]); c[hi.pip(pip, x, y, min(w, h) * .55)] = (R["red"] if pip in ("heart", "diamond") else R["dark"])[2]; sc.add(c)

def windows(sc, m, col, off, step=(5, 6), size=(2, 3), seed=0, lit=.7):
    rng = np.random.default_rng(seed); ys, xs = np.where(m);
    if not len(xs): return
    for y in range(ys.min() + 4, ys.max() - 3, step[1]):
        for x in range(xs.min() + 3, xs.max() - 2, step[0]):
            r = hi.rect(x, y, *size)
            if (r & ~m).any(): continue
            sc.put(r, hexc(col) if rng.random() < lit else hexc(off))

def dome_building(sc, cx, base, w, h, rp="paper"):
    body = hi.rect(cx - w // 2, base - h, w, h); sc.add(hi.bevel(body, R[rp]))
    for x in range(cx - w // 2 + 4, cx + w // 2 - 3, 7): sc.add(hi.bevel(hi.rect(x, base - h + 8, 3, h - 10), R[rp]), outline=False)
    sc.add(hi.bevel(hi.rect(cx - w // 2 - 3, base - h - 4, w + 6, 5), R[rp]))
    return body

@scene("topic_capital")
def topic_capital(id):
    sc = Scene(256, 144)
    grad(sc, ["f06d5a", "f58a5a", "ffb070", "ffd88a"], 0, 144); disc_glow(sc, 128, 78, 34, ["ffe39a", "ffc070", "ffa060"])
    for x, w, h in ((40, 44, 30), (216, 44, 30), (78, 26, 40), (178, 26, 40)): dome_building(sc, x, 128, w, h)
    for x in (40, 216): sc.add(hi.sphere(hi.circle(x, 94, 9) & (Y(sc) < 95), x - 2, 92, 9, R["gold"]))
    body = dome_building(sc, 128, 128, 70, 38)
    sc.add(hi.bevel(hi.poly([(96, 90), (128, 76), (160, 90)]), R["paper"]))
    sc.add(hi.bevel(hi.rect(108, 62, 40, 14), R["paper"]))
    sc.add(hi.sphere(hi.circle(128, 62, 20) & (Y(sc) < 63), 128, 62, 20, R["gold"], cuts=(.75, .5, .25, 0)))
    sc.add(hi.bevel(hi.rect(127, 32, 3, 12), R["grey"], soft=False)); sc.add(hi.bevel(hi.poly([(130, 32), (142, 35), (130, 38)]), R["red"], soft=False))
    sc.add(hi.bevel(hi.rect(0, 128, 256, 16), R["sand"]), outline=False)
    for i in range(4): sc.put(hi.rect(96 + i * 4, 124 + i * 0, 64 - i * 8, 1), R["sand"][3])
    for x, y, a, p in ((24, 30, -15, "heart"), (58, 20, 10, "spade"), (200, 22, -10, "club"), (232, 36, 18, "diamond")): tilted_card(sc, x, y, a, p)
    return sc

@scene("topic_city")
def topic_city(id):
    sc = Scene(256, 144)
    grad(sc, ["120a2e", "2a1450", "5a2a86", "8a3a8a"], 0, 144); stars(sc, 21, 60, 50)
    rng = np.random.default_rng(4)
    for layer_i, (cols, hmin, hmax, win) in enumerate(((("3a2a6a", "4a3a7a"), 40, 80, "6a5aa0"), (("1f1640", "2a1f52"), 50, 110, None))):
        x = -4
        while x < sc.w:
            w = int(rng.integers(14, 30)); h = int(rng.integers(hmin, hmax)); b = hi.rect(x, 144 - h, w, h)
            sc.a[b] = hexc(cols[0]); sc.a[b & ~shift(b, 0, 1)] = hexc(cols[1])
            if layer_i == 1:
                pal = [("ff5a55", "ffd95a", "4ee3c1", "b36cff")[rng.integers(0, 4)]]
                windows(sc, b, pal[0], "2a1f52", seed=int(x) + 17, lit=.55)
                if rng.random() < .35: sc.add(hi.bevel(hi.rect(x + w // 2 - 1, 144 - h - 10, 2, 10), R["grey"], soft=False))
            else: windows(sc, b, win, cols[0], step=(6, 8), size=(2, 2), seed=int(x) + 10)
            x += w + int(rng.integers(0, 4))
    for (x, y, c) in ((30, 22, "chip_r"), (120, 12, "chip_g"), (210, 28, "chip_p")): sc.paste(prop(c, .5), x, y, True)
    return sc

@scene("topic_clue")
def topic_clue(id):
    sc = Scene(256, 144)
    grad(sc, ["2a1a4a", "3a2458", "4a2e66"], 0, 60)
    desk = hi.rect(0, 60, 256, 84); grad(sc, ["a45530", "8a4428", "73352a"], 60, 144)
    for y in range(66, 144, 9): sc.put(hi.rect(0, y, 256, 1) & (X(sc) % 37 > 4), hexc("7a3a28"))
    light_pool(sc, 190, 96, 110, 44, ["c8804a", "b06a3a", "a45530"], desk)
    mp = hi.poly([(60, 84), (170, 76), (182, 132), (70, 138)]); c = hi.bevel(mp, R["sand"])
    for a, b in (((80, 90), (160, 124)), ((100, 80), (120, 136)), ((66, 110), (176, 100))): c[hi.thick_line([a, b], 1) & mp] = R["sand"][3]
    c[hi.thick_line([(90, 118), (110, 104), (130, 110), (150, 96)], 2) & mp] = R["red"][2]
    for x, y in ((150, 96), (90, 118)): c[hi.circle(x, y, 3)] = R["red"][1]
    sc.add(c)
    note = hi.poly([(20, 110), (58, 106), (62, 136), (24, 140)]); c = hi.bevel(note, R["paper"])
    for i in range(4): c[hi.thick_line([(28, 116 + i * 6), (54, 113 + i * 6)], 1) & note] = R["paper"][4]
    sc.add(c)
    hat = hi.ellipse(56, 64, 36, 9) | hi.poly([(34, 64), (40, 38), (72, 36), (78, 64)])
    c = hi.bevel(hat, R["red"]); c[hi.rect(34, 54, 46, 6) & hat] = R["dark"][2]; sc.add(c)
    lens = hi.circle(128, 100, 18); sc.add(hi.bevel(hi.thick_line([(142, 114), (164, 134)], 7), R["brown"]))
    sc.add(hi.bevel(lens, R["gold"])); c = hi.sphere(hi.circle(128, 100, 14), 124, 96, 15, R["teal"]); sc.add(c, outline=False)
    sc.put(hi.ellipse(122, 94, 4, 2.5), R["teal"][0])
    sc.add(hi.bevel(hi.poly([(206, 96), (226, 96), (222, 88), (210, 88)]), R["dark"])); sc.add(hi.bevel(hi.thick_line([(216, 88), (206, 50), (190, 44)], 3), R["dark"], soft=False))
    shade = hi.poly([(176, 50), (200, 34), (214, 54)]); sc.add(hi.bevel(shade, R["gold"]))
    disc_glow(sc, 194, 54, 3, ["fff6c8", "ffe39a"])
    return sc

def world_on_felt(sc, x0, y0, W, H, col="7fd08a", hl="c8f0a0", sh="4fae6a"):
    L = land_mask(2048); m = np.zeros((sc.S, sc.S), bool)
    for y in range(H):
        lat = 80 - y / H * 140
        row = L[int((90 - lat) / 180 * L.shape[0])]
        for x in range(W):
            if row[int(((-170 + x / W * 340) + 180) / 360 * L.shape[1]) % L.shape[1]]: m[y0 + y, x0 + x] = True
    sc.a[m] = hexc(col); sc.a[m & ~shift(m, 0, 1)] = hexc(hl); sc.a[m & ~shift(m, 0, -1)] = hexc(sh); return m

@scene("topic_country")
def topic_country(id):
    sc = Scene(256, 144)
    sc.a[:144, :256] = hexc("73352a"); frame = hi.rect(0, 0, 256, 144); sc.add(hi.bevel(frame, R["brown"]), outline=False)
    felt = hi.rect(8, 8, 240, 128); grad(sc, ["2fae6a", "23945a", "1b7a4c"], 8, 136, 8, 248); sc.a[felt & ~erode(felt, 1)] = INK
    m = world_on_felt(sc, 16, 14, 224, 116)
    sc.add(hi.bevel(hi.thick_line([(186, 92), (214, 122)], 9), R["brown"]))
    sc.add(hi.bevel(hi.circle(168, 74, 26), R["gold"])); sc.add(hi.sphere(hi.circle(168, 74, 21), 162, 68, 22, R["teal"]), outline=False)
    sc.put(hi.ellipse(160, 64, 6, 3), R["teal"][0]); return sc

def hourglass(sc, cx, top, h=90, w=44):
    for y in (top, top + h - 8): sc.add(hi.bevel(hi.rrect(cx - w // 2 - 6, y, w + 12, 8, 2), R["brown"]))
    for x in (cx - w // 2 - 3, cx + w // 2): sc.add(hi.bevel(hi.rect(x, top + 8, 4, h - 16), R["brown"]))
    glass = hi.poly([(cx - w // 2 + 3, top + 8), (cx + w // 2 - 3, top + 8), (cx + 3, top + h // 2), (cx + w // 2 - 3, top + h - 8), (cx - w // 2 + 3, top + h - 8), (cx - 3, top + h // 2)])
    c = np.zeros_like(sc.a); c[glass] = hexc("b7e2f7"); c[glass & ~shift(glass, 1, 0)] = hexc("ffffff")
    c[glass & (Y(sc) > top + h // 2 - 22) & (Y(sc) < top + h // 2)] = R["sand"][2]
    c[glass & (Y(sc) > top + h - 26)] = R["sand"][2]; c[glass & (Y(sc) > top + h - 26) & (X(sc) > cx + 4)] = R["sand"][3]
    c[hi.rect(cx - 1, top + h // 2, 2, h // 2 - 26)] = R["sand"][1]; sc.add(c)

@scene("topic_history")
def topic_history(id):
    sc = Scene(256, 144)
    grad(sc, ["3a1a5a", "7a2a7a", "c04a6a", "f08a5a"], 0, 96)
    far = ridge(sc, 6, 92, 5, 1.6); layer(sc, far, "5a2a5a")
    for x in (40, 70, 196, 226):
        sc.add(hi.bevel(hi.rect(x, 50, 2, 50), R["brown"], soft=False))
        ban = hi.poly([(x + 2, 52), (x + 18, 52), (x + 18, 76), (x + 10, 70), (x + 2, 76)]); c = hi.bevel(ban, R["red"])
        c[hi.circle(x + 10, 62, 3)] = R["gold"][1]; sc.add(c)
    g = layer(sc, ridge(sc, 9, 100, 3, 1.0), "b89a4a", "d8c070"); sc.a[g & (Y(sc) > 116)] = hexc("a08440")
    grass_tufts(sc, g, 3, "d8c070")
    for x, flip in ((20, 1), (212, -1)):                                       # canones
        body = hi.thick_line([(x, 126), (x + 26 * flip, 116)], 7); sc.add(hi.bevel(body, R["dark"]))
        sc.add(hi.bevel(hi.circle(x + 8 * flip, 130, 7), R["brown"])); sc.put(hi.circle(x + 8 * flip, 130, 2), R["brown"][4])
    for x, y in ((56, 132), (66, 136), (190, 134)): sc.add(hi.sphere(hi.circle(x, y, 3), x - 1, y - 1, 3, R["dark"]))
    hourglass(sc, 128, 26)
    for x, y, a, p in ((100, 20, -20, "spade"), (160, 30, 15, "heart"), (84, 50, 30, "diamond")): tilted_card(sc, x, y, a, p, 12, 17)
    return sc

def pyramid(sc, cx, base, h):
    m = hi.poly([(cx - h, base), (cx, base - h), (cx + h, base)]); c = hi.bevel(m, R["sand"])
    c[m & (X(sc) > cx)] = R["sand"][3]
    for y in range(base - h + 4, base, 4): c[m & (Y(sc) == y)] = np.where((X(sc) > cx)[m & (Y(sc) == y)][:, None], np.array(R["sand"][4]), np.array(R["sand"][3]))
    sc.add(c)

def eiffel(sc, cx, base, h):
    m = np.zeros((sc.S, sc.S), bool)
    for y in range(base - h, base):
        t = (y - (base - h)) / h; w = 1 + 22 * t ** 2.4
        m[y, int(cx - w):int(cx + w) + 1] = True
    m &= ~(hi.ellipse(cx, base, 12, 12 * .9))
    for y in (base - int(h * .35), base - int(h * .62)): m |= hi.rect(int(cx - 2 - 22 * ((y - base + h) / h) ** 2.4), y, int(4 + 44 * ((y - base + h) / h) ** 2.4), 3)
    c = hi.bevel(m, R["brown"]); sc.add(c)

def liberty(sc, cx, base):
    sc.add(hi.bevel(hi.rect(cx - 12, base - 22, 24, 22), R["grey"]))
    body = hi.poly([(cx - 8, base - 22), (cx - 5, base - 60), (cx + 5, base - 60), (cx + 8, base - 22)]); sc.add(hi.bevel(body, R["teal"]))
    sc.add(hi.bevel(hi.circle(cx, base - 64, 5), R["teal"]))
    for i in range(5): sc.put(hi.thick_line([(cx, base - 66), (cx - 8 + i * 4, base - 74)], 1), R["teal"][1])
    sc.add(hi.bevel(hi.thick_line([(cx + 4, base - 58), (cx + 10, base - 80)], 3), R["teal"]))
    sc.add(hi.bevel(hi.poly([(cx + 6, base - 84), (cx + 14, base - 84), (cx + 10, base - 94)]), R["gold"]))

def arch(sc, cx, base, w, h):
    m = hi.rect(cx - w // 2, base - h, w, h) & ~(hi.rect(cx - w // 5, base - h // 2, 2 * w // 5, h // 2) | hi.circle(cx, base - h // 2, w // 5))
    c = hi.bevel(m, R["paper"]); c[hi.rect(cx - w // 2, base - h + 6, w, 2)] = R["paper"][3]; sc.add(c)

@scene("topic_landmark")
def topic_landmark(id):
    sc = Scene(256, 144)
    sc.a[:144, :256] = hexc("7a1a2e"); board = hi.rrect(0, 0, 256, 144, 6); sc.add(hi.bevel(board, R["red"]), outline=False)
    inner = hi.rect(12, 12, 232, 120); grad(sc, ["2a78e4", "4cb4ff", "a8ecff"], 12, 132, 12, 244); sc.a[inner & ~erode(inner, 1)] = INK
    for x in range(8, 250, 10):
        for y in (5, 137): sc.put(hi.circle(x + 2, y + 1, 2), hexc("fff6c8"))
    for y in range(15, 132, 10):
        for x in (5, 249): sc.put(hi.circle(x + 1, y + 2, 2), hexc("fff6c8"))
    gm = hi.rect(13, 118, 230, 13); sc.put(gm, hexc("46b84a")); sc.put(gm & ~shift(gm, 0, 1), hexc("8be05a"))
    pyramid(sc, 58, 118, 38); eiffel(sc, 116, 118, 90); arch(sc, 166, 118, 36, 44); liberty(sc, 214, 118)
    cloud(sc, 70, 34, 40, 10, seed=2); cloud(sc, 190, 28, 34, 9, seed=5)
    return sc

@scene("topic_mixed")
def topic_mixed(id):
    sc = Scene(256, 144); rays(sc, 128, 80, ["f06d22", "ffa244", "ffd08a"], 20)
    slot_machine(sc, 90, 44, 76, 90)
    for (x, y) in ((20, 20), (200, 16), (26, 96), (206, 92)): sc.add(hi.globe_part(28, x + 14, y + 14, -50 + x, 10))
    for (x, y, c) in ((60, 10, "chip_r"), (170, 110, "chip_b"), (58, 112, "chip_g")): sc.paste(prop(c, .5), x, y, True)
    return sc

@scene("topic_nature")
def topic_nature(id):
    sc = Scene(256, 144)
    grad(sc, ["4cb4ff", "8ad0ff", "d8f0ff"], 0, 90); disc_glow(sc, 40, 26, 9, ["fff6c8", "ffe39a", "c0e8ff"])
    cloud(sc, 110, 24, 50, 12, seed=1); cloud(sc, 220, 34, 40, 10, seed=3)
    mt = np.zeros((sc.S, sc.S), bool)
    for cx, h, w in ((70, 70, 50), (130, 56, 46), (200, 44, 40)): mt |= hi.poly([(cx - w, 96), (cx, 96 - h), (cx + w, 96)])
    c = np.zeros_like(sc.a); c[mt] = hexc("7a6aa6"); c[mt & (X(sc) % 256 > 0) & ~shift(mt, 1, 0)] = hexc("9a8ac6"); sc.add(c, outline=False)
    for cx, h, w in ((70, 70, 50), (130, 56, 46)):
        snow = hi.poly([(cx - w * .3, 96 - h * .7), (cx, 96 - h), (cx + w * .3, 96 - h * .7), (cx + 4, 96 - h * .62), (cx - 6, 96 - h * .66)]); sc.put(snow & mt, hexc("f4f4f8"))
    vol = hi.poly([(196, 96), (214, 60), (226, 60), (244, 96)]); sc.add(hi.bevel(vol, R["brown"]), outline=False)
    sc.put(hi.poly([(214, 60), (226, 60), (224, 70), (218, 74), (216, 66)]), R["orange"][1]); cloud(sc, 222, 50, 18, 8, ("d8d4ea", "b0aac8", "8a86b0"), 4)
    lake = layer(sc, np.full(sc.S, 96), "4cb4ff", "a8ecff", 112)
    for x in range(20, 240, 13): sc.a[100 + (x // 13) % 8, x:x + 5] = hexc("a8ecff")
    fall = hi.rect(96, 60, 10, 38); c = np.zeros_like(sc.a); c[fall] = hexc("a8ecff"); c[fall & ((X(sc) + Y(sc) // 3) % 4 == 0)] = hexc("ffffff"); sc.add(c, outline=False)
    g = layer(sc, ridge(sc, 4, 114, 3, 1.4), "46b84a", "8be05a"); grass_tufts(sc, g, 5, "8be05a")
    for x in range(-4, 260, 22):
        tr = hi.poly([(x, 118), (x + 8, 98), (x + 16, 118)]) | hi.poly([(x + 2, 108), (x + 8, 92), (x + 14, 108)])
        if 60 < x < 190: continue
        sc.add(hi.bevel(tr, R["green"]))
    for x, y, a, p in ((80, 128, -12, "spade"), (104, 130, 6, "heart"), (160, 128, -6, "diamond"), (184, 130, 12, "club")): tilted_card(sc, x, y, a, p, 20, 28)
    return sc

# ---- cartas del menu (256x320)
def explorer(sc, x, y, s=1.0):
    """explorador de 2,5 cabezas (sombrero, camisa roja, mochila y brujula); s = escala de las formas, el contorno sigue de 1 px"""
    q = lambda a, b, w, h: hi.rect(int(x + a * s), int(y + b * s), max(1, int(w * s)), max(1, int(h * s)))
    qr = lambda a, b, w, h, r: hi.rrect(int(x + a * s), int(y + b * s), int(w * s), int(h * s), int(r * s))
    sc.add(hi.bevel(qr(14, 26, 14, 22, 3), R["brown"]))
    sc.add(hi.bevel(q(4, 46, 7, 18) | q(13, 46, 7, 18), R["blue"]))
    sc.add(hi.bevel(q(2, 62, 9, 5) | q(13, 62, 9, 5), R["brown"]))
    body = qr(2, 24, 20, 24, 3); c = hi.bevel(body, R["red"]); c[q(2, 42, 20, 3)] = R["brown"][2]; c[q(10, 43, 4, 2)] = R["gold"][1]
    c[q(11, 26, 2, 14) & body] = R["red"][3]; sc.add(c)
    sc.add(hi.bevel(q(-4, 26, 6, 16), R["red"])); sc.add(hi.bevel(q(22, 26, 6, 12), R["red"]))
    sc.add(hi.bevel(q(-4, 41, 6, 5), R["sand"])); sc.add(hi.bevel(q(22, 37, 6, 5), R["sand"]))
    head = qr(3, 6, 18, 18, 5); c = hi.bevel(head, R["sand"])
    for ex in (8, 15): c[q(ex, 13, 2, 3)] = INK; c[q(ex, 13, 1, 1)] = WHITE
    c[q(9, 20, 6, 1)] = R["brown"][3]; c[q(4, 17, 3, 2)] = R["red"][0]; c[q(17, 17, 3, 2)] = R["red"][0]; sc.add(c)
    hat = hi.ellipse(x + 12 * s, y + 8 * s, 16 * s, 4 * s) | qr(4, -4, 16, 12, 4); c = hi.bevel(hat, R["brown"]); c[q(4, 3, 16, 3) & hat] = R["red"][3]; sc.add(c)
    sc.add(hi.bevel(hi.circle(x + 29 * s, y + 38 * s, 6 * s), R["gold"])); sc.add(hi.sphere(hi.circle(x + 29 * s, y + 38 * s, 4 * s), x + 28 * s, y + 37 * s, 4 * s, R["teal"]), outline=False)
    sc.put(hi.thick_line([(x + 29 * s, y + 38 * s), (x + 31 * s, y + 34 * s)], max(1, int(s))), R["red"][2])

@scene("card_adv")
def card_adv(id):
    sc = Scene(256, 320)
    grad(sc, ["4ee3c1", "8af0d0", "ffe39a", "ffb070"], 0, 150); sc.a[150:320, :256] = hexc("5a9a7a"); disc_glow(sc, 170, 140, 36, ["fff6c8", "ffd95a", "ffb347"])
    for cx, cy, w, h, s in ((60, 40, 70, 16, 1), (200, 70, 50, 12, 2)): cloud(sc, cx, cy, w, h, seed=s)
    far = ridge(sc, 5, 150, 8, 1.2); layer(sc, far, "5a9a7a", "7aba8a")
    road(sc, 146, 170, 30, 3, 150)
    hill = hi.circle(70, 330, 120); c = np.zeros_like(sc.a); c[hill] = R["green"][2]; c[hill & ~shift(hill, 0, 2)] = R["green"][1]; c[hill & (Y(sc) > 280)] = R["green"][3]
    sc.add(c, outline=False); grass_tufts(sc, hill, 3, "8be05a")
    explorer(sc, 34, 150, 2.0)
    sc.paste(prop("chip_r", .5), 186, 270, True); sc.paste(prop("chip_b", .5), 214, 284, True)
    return sc

@scene("card_classic")
def card_classic(id):
    sc = Scene(256, 320)
    grad(sc, ["2a1450", "3a2458", "4a2e66"], 0, 220)
    light_pool(sc, 196, 120, 90, 90, ["6a4a7a", "5a3a70", "4a2e66"])
    desk = hi.rect(0, 220, 256, 100); grad(sc, ["a45530", "8a4428", "73352a"], 220, 320); sc.add(hi.bevel(hi.rect(0, 216, 256, 8), R["brown"]), outline=False)
    g = hi.globe_part(120, 96, 120, -50, 10); sc.add(g)
    arc = hi.ring(96, 120, 64, 68) & ~hi.rect(0, 0, 96 - 30, 320) & hi.rect(0, 50, 256, 146); sc.add(hi.bevel(arc, R["gold"], soft=False))
    sc.add(hi.bevel(hi.rect(92, 188, 9, 20), R["gold"])); sc.add(hi.bevel(hi.ellipse(96, 212, 34, 8), R["brown"]))
    sc.add(hi.bevel(hi.poly([(196, 216), (218, 216), (214, 206), (200, 206)]), R["dark"])); sc.add(hi.bevel(hi.rect(205, 150, 4, 58), R["dark"], soft=False))
    sc.add(hi.bevel(hi.rrect(186, 110, 42, 42, 8), R["gold"])); disc_glow(sc, 207, 131, 12, ["fff6c8", "ffe39a"])
    book = hi.poly([(40, 262), (128, 250), (216, 262), (216, 300), (128, 290), (40, 300)]); c = hi.bevel(book, R["paper"])
    c[hi.rect(126, 250, 4, 42) & book] = R["paper"][4]
    for i in range(5): c[hi.thick_line([(54, 268 + i * 6), (116, 260 + i * 6)], 1) & book] = R["paper"][3]
    c[hi.thick_line([(142, 262), (200, 270)], 2) & book] = R["red"][2]; c[hi.circle(170, 280, 5) & book] = R["green"][2]; sc.add(c)
    sc.paste(prop("coin", .5), 20, 232, True)
    return sc

def trophy(sc, cx, top, s=1.0):
    cup = hi.poly([(cx - 30 * s, top), (cx + 30 * s, top), (cx + 22 * s, top + 34 * s), (cx + 8 * s, top + 44 * s), (cx - 8 * s, top + 44 * s), (cx - 22 * s, top + 34 * s)])
    for sx in (-1, 1): sc.add(hi.bevel(hi.ring(cx + sx * 30 * s, top + 16 * s, 8 * s, 13 * s) & (X(sc) * sx > (cx + sx * 26 * s) * sx), R["gold"]))
    c = hi.bevel(cup, R["gold"]); c[cup & (X(sc) > cx + 10 * s)] = R["gold"][3]; c[hi.rect(int(cx - 20 * s), int(top + 6 * s), int(4 * s), int(24 * s)) & cup] = R["gold"][0]; sc.add(c)
    sc.add(hi.bevel(hi.rect(int(cx - 5 * s), int(top + 44 * s), int(10 * s), int(14 * s)), R["gold"]))
    sc.add(hi.bevel(hi.rrect(int(cx - 24 * s), int(top + 58 * s), int(48 * s), int(12 * s), 2), R["brown"]))
    sc.add(hi.faceted_star(cx, top + 20 * s, 12 * s, 5 * s, "red"), outline=False)

@scene("card_compete")
def card_compete(id):
    sc = Scene(256, 320)
    grad(sc, ["120a2e", "2a1450", "4a2a86"], 0, 320)
    yy, xx = np.mgrid[0:sc.S, 0:sc.S]
    for x0, x1 in ((20, 110), (236, 146)):
        beam = hi.poly([(x0 - 8, 0), (x0 + 8, 0), (x1 + 50, 250), (x1 - 50, 250)]); sc.a[beam & (BAYER[yy % 4, xx % 4] < .4)] = hexc("4ee3c1")
    for i in range(30):
        rng = np.random.default_rng(i); x, y = rng.integers(10, 246), rng.integers(10, 200); col = ("ff5a55", "ffd95a", "4ee3c1", "b36cff")[i % 4]
        sc.put(hi.rect(x, y, 3, 2) if i % 2 else hi.rect(x, y, 2, 3), hexc(col))
    pod = hi.rect(40, 236, 176, 84); sc.add(hi.bevel(pod, R["red"])); sc.add(hi.bevel(hi.rect(30, 228, 196, 12), R["red"]))
    for x in (60, 196): sc.paste(prop("chip_r", .5), x - 16, 262, True)
    trophy(sc, 128, 112, 1.45)
    stands = np.zeros((sc.S, sc.S), bool)
    for i in range(14): stands |= hi.circle(8 + i * 19, 312, 11)
    sc.a[stands & (yy < 320)] = hexc("1a0f36")
    return sc

def chest_draw(sc, cx, base, w=120, h=56, open_=True):
    body = hi.rrect(cx - w // 2, base - h, w, h, 4); c = hi.bevel(body, R["red"])
    for x in (cx - w // 2 + 10, cx + w // 2 - 16): c[hi.rect(x, base - h, 6, h)] = R["gold"][2]
    c[hi.rect(cx - w // 2, base - h + 8, w, 5)] = R["gold"][2]; sc.add(c)
    sc.add(hi.bevel(hi.rrect(cx - 9, base - h + 6, 18, 18, 3), R["gold"])); sc.put(hi.rect(cx - 2, base - h + 12, 4, 7), INK)
    if open_:
        lid = hi.poly([(cx - w // 2, base - h - 4), (cx + w // 2, base - h - 4), (cx + w // 2 - 6, base - h - 44), (cx - w // 2 + 6, base - h - 44)])
        c = hi.bevel(lid, R["red"]); c[hi.poly([(cx - w // 2 + 8, base - h - 8), (cx + w // 2 - 8, base - h - 8), (cx + w // 2 - 12, base - h - 38), (cx - w // 2 + 12, base - h - 38)])] = R["red"][4]
        sc.add(c, outline=True)

@scene("chest")
def chest(id):
    sc = Scene(256, 144); rays(sc, 128, 80, ["f06d22", "ffa244", "ffd08a"], 18)
    chest_draw(sc, 128, 136, 128, 50)
    pile = hi.ellipse(128, 86, 58, 12); sc.add(hi.bevel(pile, R["gold"]), outline=False)
    rng = np.random.default_rng(2)
    for _ in range(26):
        x, y = 128 + rng.normal(0, 26), 84 + rng.normal(0, 4); r = rng.integers(3, 5)
        sc.add(hi.sphere(hi.circle(x, y, r), x - 1, y - 1, r, R["gold"]), outline=True)
    for x, y, a, p in ((96, 70, -20, "heart"), (160, 68, 18, "spade")): tilted_card(sc, x, y, a, p, 18, 26)
    sc.paste(prop("chip_r", .5), 104, 62, True); sc.paste(prop("chip_b", .5), 128, 58, True); sc.paste(prop("g_2", .5), 146, 70, True)
    for x, y in ((30, 30), (220, 40), (40, 110), (214, 112)): sc.paste(prop("coin", .5), x - 16, y - 16, True)
    return sc

@scene("win")
def win(id):
    sc = Scene(256, 144); rays(sc, 128, 72, ["e0483f", "f06d5a", "ffa080"], 20)
    sc.add(hi.globe_part(76, 128, 72, -50, 10))
    for side in (-1, 1):                                                        # laurel: hojas orientadas por la tangente
        for i in range(8):
            t = math.radians(100 + i * 21) if side < 0 else math.radians(80 - i * 21)
            x, y = 128 + 47 * math.cos(t), 72 + 47 * math.sin(t); tx, ty = -math.sin(t) * side, math.cos(t) * side
            nx, ny = -ty, tx; L, W = 8, 3.6
            leaf = hi.poly([(x - tx * L, y - ty * L), (x + nx * W, y + ny * W), (x + tx * L, y + ty * L), (x - nx * W, y - ny * W)])
            sc.add(hi.bevel(leaf, R["gold"]))
    sc.add(hi.bevel(hi.rrect(112, 118, 32, 8, 3), R["red"]))
    for x, y, a, p in ((136, 60, -10, "heart"), (150, 62, 4, "diamond"), (164, 66, 18, "spade")): tilted_card(sc, x, y, a, p, 18, 26)
    for (x, y, c) in ((24, 20, "chip_b"), (212, 18, "chip_g"), (30, 104, "chip_p"), (214, 102, "chip_r")): sc.paste(prop(c, .5), x, y, True)
    return sc

@scene("lose")
def lose(id):
    sc = Scene(256, 144)
    grad(sc, ["1a3a3a", "123030", "0e2424"], 0, 144)
    light_pool(sc, 206, 50, 120, 90, ["2a5a4a", "224a40", "1a3a3a"])
    mp = hi.poly([(70, 20), (190, 30), (200, 104), (150, 96), (140, 110), (80, 100)]); c = hi.bevel(mp, R["sand"])
    c[hi.thick_line([(90, 40), (120, 70), (170, 50)], 2) & mp] = R["red"][3]; sc.add(c)
    sc.add(hi.bevel(hi.circle(68, 72, 34), R["gold"])); sc.add(hi.bevel(hi.circle(68, 72, 27), R["paper"]), outline=False)
    needle = hi.poly([(68, 50), (73, 72), (68, 94), (63, 72)]); sc.put(needle & (Y(sc) < 72), R["red"][2]); sc.put(needle & (Y(sc) >= 72), R["dark"][2])
    crack = hi.thick_line([(48, 56), (62, 70), (56, 84), (70, 98)], 1); sc.put(crack & hi.circle(68, 72, 27), INK)
    for x, y, a, p in ((150, 116, -14, "spade"), (172, 118, 8, "club")): tilted_card(sc, x, y, a, p, 22, 30)
    sc.add(hi.bevel(hi.rrect(208, 50, 26, 40, 5), R["dark"])); sc.add(hi.bevel(hi.rrect(212, 58, 18, 26, 4), R["gold"]), outline=False)
    disc_glow(sc, 221, 71, 4, ["ffe39a", "c89a4a"]); sc.add(hi.bevel(hi.ring(221, 46, 5, 8) & (Y(sc) < 48), R["dark"]))
    sc.add(hi.bevel(hi.rrect(204, 90, 34, 6, 2), R["dark"]))
    sc.paste(prop("g_0", .5), 110, 110, True)
    return sc

@scene("shop_bg")
def shop_bg(id):
    sc = Scene(256, 141, k=5)
    grad(sc, ["3a0e1e", "5a1a2a", "7a2434"], 0, 80)
    for x in range(0, 256, 16): sc.put(hi.rect(x, 0, 1, 80), hexc("4a1424"))
    sc.add(hi.bevel(hi.rect(0, 76, 256, 6), R["gold"]), outline=False)
    grad(sc, ["5e1238", "4a0e2e", "3a0a24"], 82, 141)
    yy, xx = np.mgrid[0:sc.S, 0:sc.S]; carpet = (yy >= 82) & (((xx + yy) % 12 == 0) | ((xx - yy) % 12 == 0)); sc.a[carpet & (yy < 141)] = hexc("7a1a44")
    for x in (40, 128, 216):
        sc.add(hi.bevel(hi.rrect(x - 12, 18, 24, 16, 3), R["gold"])); disc_glow(sc, x, 34, 5, ["fff6c8", "ffd95a", "9a4a3a"])
        light_pool(sc, x, 52, 30, 20, ["9a3a44", "8a2e3c"], (yy < 76))
    for i, (x, y, w) in enumerate(((20, 96, 70), (128 - 45, 88, 90), (166, 96, 70))):
        top = hi.ellipse(x + w / 2, y, w / 2, 9); sc.add(hi.bevel(hi.rect(int(x + w / 2 - 3), y, 6, 30), R["brown"]))
        sc.add(hi.bevel(hi.ellipse(x + w / 2, y + 2, w / 2 + 2, 10), R["brown"])); sc.add(hi.bevel(top, R["green"]), outline=False)
        sc.put(hi.ellipse(x + w / 2, y, w / 2 - 6, 6) & ~hi.ellipse(x + w / 2, y, w / 2 - 7, 5), R["green"][1])
    sc.paste(prop("chips", .5), 112, 68, True); sc.paste(prop("cards", .5), 40, 76, True); sc.paste(prop("chip_r", .5), 190, 82, True)
    return sc
