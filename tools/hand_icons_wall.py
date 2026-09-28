#!/usr/bin/env python3
"""Geolite - iconos de los retos de CUARTA PARED y sus perks (v0.33), con el mismo libro de estilo que tools/hand_icons.py
(rejilla de 64 px, luz arriba-izquierda, rampas compartidas y contorno indigo de 1 px).

  python tools/hand_icons_wall.py [--preview hoja.png]
"""
import sys, math
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import hand_icons as H
from hand_icons import Icon, R, INK, bevel, flat, sphere, rect, rrect, circle, ellipse, ring, poly, thick_line, blank, erode, edge

WALL = {}
def wall(*ids):
    def deco(f):
        for i in ids: WALL[i] = (f, i); H.REG[i] = (f, i)
        return f
    return deco

def monitor(I, glass="blue"):
    """monitor de escritorio: marco oscuro, pantalla con reflejo y peana"""
    I.add(bevel(rect(18, 53, 28, 6), R["grey"]))
    I.add(bevel(rect(27, 46, 10, 8), R["grey"]))
    I.add(bevel(rrect(3, 7, 58, 42, 4), R["dark"]))
    scr = rrect(7, 11, 50, 34, 2); I.put(scr, R[glass][2])
    for y in range(11, 45):
        if y < 18: I.put(scr & rect(0, y, 64, 1), R[glass][1])
        elif y > 38: I.put(scr & rect(0, y, 64, 1), R[glass][3])
    I.put(scr & poly([(10, 11), (22, 11), (12, 30), (7, 30)]), R[glass][0])       # reflejo del cristal
    return scr

@wall("ch_crack")
def ch_crack(id):
    I = Icon(); scr = monitor(I)
    cx, cy = 38, 25
    rays = [[(cx, cy), (46, 17), (52, 12)], [(cx, cy), (50, 26), (57, 29)], [(cx, cy), (44, 36), (47, 45)], [(cx, cy), (33, 35), (30, 45)],
            [(cx, cy), (27, 27), (16, 30), (8, 34)], [(cx, cy), (31, 18), (24, 11)], [(cx, cy), (38, 15), (37, 11)]]
    web = [[(45, 18), (48, 25), (45, 32)], [(45, 32), (37, 34)], [(37, 34), (31, 28)], [(31, 28), (32, 20)], [(32, 20), (38, 17)]]
    cr = blank()
    for r_ in rays + web: cr |= thick_line(r_, 1)
    cr &= scr
    I.put(H.dilate(cr, 1) & scr & ~cr, R["blue"][4])
    I.put(cr, R["ice"][0])
    I.put(circle(cx, cy, 3) & scr, R["ice"][0]); I.put(circle(cx, cy, 1.5), R["ice"][1])
    return I

@wall("ch_smudge")
def ch_smudge(id):
    I = Icon(); scr = monitor(I)
    fp = blank()
    for k, r_ in enumerate((3.2, 6.2, 9.2, 12.2)):
        rg = (ellipse(34, 29, r_ * .82 + 1, r_ + 1) & ~ellipse(34, 29, r_ * .82, r_))
        if k % 2: rg &= ~rect(30, 14, 3, 30)                                    # cortes de la huella
        else: rg &= ~rect(36, 14, 2, 30)
        fp |= rg
    fp &= scr
    I.put(fp, R["pink"][0]); I.put(fp & rect(0, 30, 64, 20), R["cream"][2])
    I.put(scr & poly([(14, 38), (22, 34), (26, 36), (18, 41)]), R["blue"][1])      # arrastre del dedo
    return I

@wall("ch_hang")
def ch_hang(id):
    I = Icon()
    I.add(bevel(rrect(3, 8, 58, 48, 2), R["grey"]))
    I.put(rect(6, 11, 52, 9), R["purple"][2]); I.put(rect(6, 11, 52, 3), R["purple"][1])
    I.add(bevel(rect(48, 12, 8, 7), R["grey"], soft=False))
    I.put(thick_line([(50, 14), (54, 17)], 1) | thick_line([(54, 14), (50, 17)], 1), INK)
    I.add(sphere(circle(19, 36, 9), 17, 34, 9, R["red"]))
    I.put(rect(18, 30, 2, 7) | rect(18, 39, 2, 2), R["cream"][0])
    for y, w in ((31, 24), (36, 20), (41, 14)): I.put(rect(33, y, w, 2), R["grey"][3])
    I.add(bevel(rect(34, 46, 20, 6), R["grey"], soft=False))
    return I

@wall("ch_battery")
def ch_battery(id):
    I = Icon()
    I.add(bevel(rect(54, 25, 7, 14), R["grey"]))
    I.add(bevel(rrect(3, 16, 52, 32, 5), R["grey"]))
    I.put(rrect(8, 21, 42, 22, 2), R["dark"][3])
    I.add(bevel(rrect(10, 23, 9, 18, 1), R["red"]), outline=False)
    I.put(rect(30, 26, 4, 10) | rect(30, 38, 4, 3), R["red"][1])               # signo de aviso
    return I

@wall("protector")
def protector(id):
    I = Icon()
    I.add(bevel(rrect(12, 4, 40, 56, 7), R["dark"]))
    scr = rrect(15, 9, 34, 46, 3); I.put(scr, R["blue"][3])
    glass = rrect(9, 7, 38, 52, 6); I.add(flat(glass, R["ice"][1]), outline=True)
    I.put(erode(glass, 2), R["ice"][2])
    for x0 in (14, 24): I.put(thick_line([(x0, 50), (x0 + 22, 14)], 3) & erode(glass, 2), R["ice"][0])
    I.add(sphere(circle(47, 47, 11), 45, 45, 11, R["green"]))
    I.put(thick_line([(42, 47), (46, 51), (53, 42)], 3), R["cream"][0])
    return I

@wall("powerbank")
def powerbank(id):
    I = Icon()
    I.add(bevel(thick_line([(40, 50), (50, 56), (58, 48), (58, 36)], 3), R["grey"], soft=False))
    I.add(bevel(rect(55, 30, 6, 8), R["gold"]))
    I.add(bevel(rrect(6, 8, 38, 50, 7), R["dark"]))
    for i, on in enumerate((False, True, True, True)): I.put(rect(33, 16 + i * 9, 5, 5), R["green"][1] if on else R["dark"][1])
    bolt = poly([(21, 12), (10, 34), (19, 34), (15, 54), (30, 28), (21, 28), (26, 12)])
    I.add(bevel(bolt, R["gold"])); return I

@wall("taskmgr")
def taskmgr(id):
    I = Icon()
    I.add(bevel(rrect(3, 8, 58, 48, 2), R["grey"]))
    I.put(rect(6, 11, 52, 9), R["teal"][3]); I.put(rect(6, 11, 52, 3), R["teal"][2])
    I.add(bevel(rect(48, 12, 8, 7), R["red"], soft=False))
    I.put(thick_line([(50, 14), (54, 17)], 1) | thick_line([(54, 14), (50, 17)], 1), R["cream"][0])
    pane = rect(8, 23, 48, 29); I.put(pane, R["dark"][4])
    for x in range(8, 56, 8): I.put(rect(x, 23, 1, 29) & pane, R["dark"][3])
    for y in range(29, 52, 7): I.put(rect(8, y, 48, 1) & pane, R["dark"][3])
    I.put(thick_line([(9, 46), (16, 40), (22, 43), (29, 30), (36, 36), (43, 27), (48, 33), (55, 28)], 2) & pane, R["green"][1])
    return I

if __name__ == "__main__":
    done = H.build(list(WALL)); print(len(done), "iconos dibujados:", ", ".join(done))
    if "--preview" in sys.argv: H.preview(done, sys.argv[sys.argv.index("--preview") + 1])
