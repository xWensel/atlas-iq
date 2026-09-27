"""Geolite - retratos del crupier (dealer_neutral/laugh/angry/shock, 128x128 transparentes). Ver tools/hand_scenes.py.
Mismo personaje en las cuatro: chistera violeta con cinta roja, antifaz dorado, bigote de manillar, pajarita roja y
esmoquin; solo cambian cejas, ojos, boca y los detalles de la emocion."""
import math
import numpy as np
from PIL import Image
from hand_scenes import Scene, scene, prop
from scenes_b import X, Y
import hand_icons as hi
from hand_icons import R, INK, WHITE, hexc
from pxkit import shift, erode, edge

SKIN = hi.ramp("ffe8c8", "ffd0a0", "f0b080", "c87a5a", "8a4a44")

class Portrait(Scene):
    def img(self):
        a = self.a[:self.h, :self.w]
        return Image.fromarray(a, "RGBA").resize((self.w * self.k, self.h * self.k), Image.NEAREST)

def dealer(mood):
    sc = Portrait(128, 128)
    # ---- cuerpo: esmoquin, camisa, solapas y pajarita
    body = hi.ellipse(64, 132, 50, 34) & (Y(sc) < 128); sc.add(hi.bevel(body, R["dark"]))
    shirt = hi.poly([(50, 100), (78, 100), (64, 128)]); sc.add(hi.bevel(shirt, R["paper"]), outline=False)
    for s_ in (-1, 1): sc.put(hi.poly([(64 + s_ * 14, 100), (64 + s_ * 4, 120), (64 + s_ * 20, 104)]), R["dark"][1])
    sc.put(hi.rect(63, 110, 2, 2) | hi.rect(63, 118, 2, 2), R["dark"][3])
    neck = hi.rect(56, 88, 16, 12); sc.add(hi.bevel(neck, SKIN))
    # ---- cara
    face = hi.ellipse(64, 66, 23, 27); c = hi.bevel(face, SKIN)
    c[face & (X(sc) > 78)] = SKIN[3]; c[hi.ellipse(64, 66, 23, 27) & (Y(sc) > 86)] = SKIN[3]
    if mood == "angry": c[face & (Y(sc) > 70) & ~(X(sc) > 78)] = hexc("f09080")
    for ex in (41, 87): sc.add(hi.bevel(hi.ellipse(ex, 68, 4, 6), SKIN))              # orejas
    sc.add(c)
    if mood in ("laugh", "neutral"):
        for cx in (48, 80): sc.put(hi.ellipse(cx, 76, 4, 2.2), hexc("ff9a8a"))
    # ---- antifaz dorado con los ojos
    mask = hi.ellipse(52, 58, 13, 8) | hi.ellipse(76, 58, 13, 8) | hi.rect(58, 54, 12, 6)
    mk = hi.bevel(mask, R["gold"], soft=False); holes = hi.ellipse(52, 58, 6, 4) | hi.ellipse(76, 58, 6, 4)
    mk[holes] = [0, 0, 0, 0]; sc.add(mk)
    for cx in (52, 76):
        if mood == "laugh":                                                      # ojos cerrados de risa: arcos
            sc.put(hi.thick_line([(cx - 5, 60), (cx, 55), (cx + 5, 60)], 2), INK)
        elif mood == "shock":
            sc.put(hi.ellipse(cx, 58, 6, 4.5), WHITE); sc.put(hi.circle(cx, 58, 1.6), INK)
        else:
            sc.put(hi.ellipse(cx, 58, 5, 3.4), WHITE); sc.put(hi.ellipse(cx + (1 if mood == "neutral" else 0), 58, 2.4, 3), INK); sc.put(hi.rect(cx, 56, 1, 1), WHITE)
    # ---- cejas segun la emocion
    brows = {"neutral": [((45, 47), (57, 47)), ((71, 47), (83, 46))], "laugh": [((45, 46), (57, 45)), ((71, 45), (83, 46))],
             "angry": [((45, 44), (59, 49)), ((69, 49), (83, 44))], "shock": [((45, 45), (57, 42)), ((71, 42), (83, 45))]}[mood]
    for a, b in brows: sc.put(hi.thick_line([a, b], 3), R["brown"][3])
    # ---- nariz, bigote y boca
    sc.put(hi.poly([(64, 62), (68, 72), (62, 72)]), SKIN[3]); sc.put(hi.rect(61, 72, 6, 1), SKIN[4])
    if mood == "laugh":
        mouth = hi.ellipse(64, 84, 11, 7) & (Y(sc) > 80); sc.put(mouth, hexc("5e1238")); sc.put(mouth & (Y(sc) > 87), R["red"][1]); sc.put(hi.rect(56, 80, 16, 2) & mouth, WHITE)
    elif mood == "shock":
        sc.put(hi.ellipse(64, 86, 5, 6), hexc("5e1238")); sc.put(hi.ellipse(64, 89, 3, 2), R["red"][1])
    elif mood == "angry":
        mouth = hi.rect(55, 82, 18, 5); sc.put(mouth, WHITE); sc.put(mouth & ~erode(mouth, 1), INK); sc.put(hi.rect(58, 82, 1, 5) | hi.rect(64, 82, 1, 5) | hi.rect(70, 82, 1, 5), SKIN[3])
    else:
        sc.put(hi.thick_line([(56, 84), (64, 86), (72, 82)], 2), hexc("8a3a3a"))
    stache = hi.ellipse(57, 77, 8, 3.5) | hi.ellipse(71, 77, 8, 3.5) | hi.circle(48, 75, 2.6) | hi.circle(80, 75, 2.6)
    sc.add(hi.bevel(stache, R["brown"], soft=False))
    # ---- chistera
    brim = hi.ellipse(64, 38, 32, 5); crown = hi.rect(43, 3, 42, 35)
    sc.add(hi.bevel(crown, R["purple"])); sc.put(hi.rect(43, 27, 42, 7), R["red"][2]); sc.put(hi.rect(43, 27, 42, 1), R["red"][1])
    sc.put(hi.rect(47, 5, 3, 19), R["purple"][1])
    sc.add(hi.bevel(brim & ~crown | (brim & (Y(sc) > 36)), R["purple"]))
    sc.add(hi.sphere(hi.circle(79, 30, 3.2), 78, 29, 3.2, R["teal"]))
    # ---- pajarita
    bow = hi.poly([(50, 92), (62, 97), (50, 103)]) | hi.poly([(78, 92), (66, 97), (78, 103)]); sc.add(hi.bevel(bow, R["red"])); sc.add(hi.bevel(hi.rect(61, 94, 6, 6), R["red"]))
    # ---- detalles de la emocion
    if mood == "neutral":                                                        # mano enguantada con cartas
        sc.paste(prop("cards", .5), 4, 82, True)
        sc.add(hi.bevel(hi.rrect(14, 104, 16, 14, 5), R["paper"]))
    elif mood == "angry":
        x, y = 100, 24; v = np.zeros((sc.S, sc.S), bool)                             # vena de enfado: cuatro esquinas curvas
        for sx in (-1, 1):
            for sy in (-1, 1): v |= hi.thick_line([(x + sx * 7, y + sy * 2), (x + sx * 2, y + sy * 2), (x + sx * 2, y + sy * 7)], 2)
        sc.add(hi.bevel(v, R["red"], soft=False))
        for x, y in ((16, 20), (22, 30)): sc.add(hi.bevel(hi.circle(x, y, 5) | hi.circle(x + 5, y - 2, 4), R["grey"]))
    elif mood == "shock":
        drop = hi.circle(94, 56, 4) | hi.poly([(90, 55), (98, 55), (94, 46)]); sc.add(hi.bevel(drop, R["ice"]))
        for x, y in ((104, 30), (110, 40)): sc.add(hi.bevel(hi.rect(x, y, 3, 8), R["gold"], soft=False))
    elif mood == "laugh":
        for x, y in ((16, 40), (104, 36)): sc.add(hi.faceted_star(x, y, 8, 3, "gold", n=4), outline=False)
    return sc

@scene("dealer_neutral", "dealer_laugh", "dealer_angry", "dealer_shock")
def dealer_scene(id): return dealer(id.split("_")[1])
