#!/usr/bin/env python3
"""Geolite - Don Crupier: el esqueleto de capas (solo desarrollo).
Separa el maestro (master.py) en cuatro capas que se mueven por separado sin que cambie ni un pixel de su ropa:
  body  (traje, pajarita, camisa, cuello)       -> detras
  head  (mascara, piel, bigote, oreja, pelo)    -> encima del cuerpo
  hat   (chistera lisa)                         -> encima de la cabeza
  hand  (guante con el abanico de cartas)       -> delante de todo
Y pinta lo que cada capa tapa (pelo bajo el ala, cuello bajo la barbilla, mejilla y traje bajo la mano) para que
al moverse nunca asome un agujero. El recorte del busto (fila 119) se aplica al componer (compose).
"""
import sys
from pathlib import Path
import numpy as np
sys.path.insert(0, str(Path(__file__).parent))
from px import RGB, blank, patch, over
from master import build, ch

LIGHT = set("WwvRceGtorOy")          # colores de cartas y guante (para la inundacion de la mano)
BOTTOM = 118                         # ultima fila del busto; la 119 es el contorno de abajo

def flood(m, seeds, ok):
    seen = np.zeros(m.shape[:2], bool); st = list(seeds)
    for x, y in st: seen[y, x] = True
    while st:
        x, y = st.pop()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            xx, yy = x + dx, y + dy
            if 0 <= xx < 128 and 0 <= yy < 128 and not seen[yy, xx] and ok(xx, yy): seen[yy, xx] = True; st.append((xx, yy))
    return seen

def grow(m, sel, chars, n=1):
    for _ in range(n):
        add = np.zeros_like(sel)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
            add |= np.roll(np.roll(sel, dy, 0), dx, 1)
        cand = add & ~sel
        for y, x in zip(*np.where(cand)):
            if ch(m, x, y) in chars: sel[y, x] = True
    return sel

def split(m):
    # mano: todo lo claro conectado a las cartas y al guante (sin salirse a la cara ni a la camisa) + su contorno
    seeds = [(x, y) for y in range(74, 118) for x in range(16, 51) if ch(m, x, y) in LIGHT]
    hand = flood(m, seeds, lambda x, y: x <= 56 and y >= 72 and ch(m, x, y) in LIGHT)
    hand = grow(m, hand, "KDs", 1)
    hand = grow(m, hand, "s", 1)
    ys, xs = np.where(hand)
    # contorno de arriba de las cartas (filas 69-73) que la inundacion no alcanza del todo
    for y in range(69, 74):
        for x in range(26, 48):
            if ch(m, x, y) in "sKD" and not hand[y, x] and any(hand[y + 1, x + d] for d in (-1, 0, 1)): hand[y, x] = True
    for y in range(88, 128):                                         # todo lo que queda a la izquierda del hombro (espejo del derecho) es de la mano
        xs = np.where(m[y, 64:, 3] > 0)[0]
        if len(xs): hand[y, :142 - (64 + xs.max())] |= m[y, :142 - (64 + xs.max()), 3] > 0
    hat = np.zeros_like(hand); hat[:53] = True; hat &= m[..., 3] > 0
    head = np.zeros_like(hand)
    for y in range(53, 90):
        for x in range(40, 106):
            if m[y, x, 3] == 0 or hand[y, x]: continue
            c = ch(m, x, y)
            if y >= 85 and c in "dDPLa" and (x <= 58 or x >= 83): continue
            if y >= 86 and c in "Ks" and (x <= 55 or x >= 88): continue
            head[y, x] = True
    body = (m[..., 3] > 0) & ~hand & ~hat & ~head
    L = {}
    for name, sel in (("body", body), ("head", head), ("hat", hat), ("hand", hand)):
        a = blank(); a[sel] = m[sel]; L[name] = a
    return L

def fill_hidden(L):
    """lo que tapa cada capa, pintado a mano para que al moverse no asomen agujeros"""
    head, body, hand = L["head"], L["body"], L["hand"]
    # pelo bajo el ala (se ve cuando la chistera salta o se levanta): casquete oscuro con un brillo
    patch(head, 46, 44, """
        |......sssssssssssssssssssssssssssssssssssssssss.......
        |....ssDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDss.....
        |...sDDddPPPPPddddddddddddddddddddddddddddddddDDDDs....
        |..sDDdPPLLLLPPPdddddddddddddddddddddddddddddddDDDDs...
        |..sDddPPPPPPPddddddddddddddddddddddddddddddddddDDDs...
        |.sDDdddddddddddddddddddddddddddddddddddddddddddDDDDs..
        |.sDDDdddddddddddddddddddddddddddddddddddddddddDDDDDs..
        |.sDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDs..
        |sKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKs.
    """, keep=" ")
    # cuello bajo la barbilla (la cabeza respira y se inclina sin dejar hueco)
    for y in range(84, 92):
        for x in range(60, 84):
            if body[y, x, 3] == 0: body[y, x] = RGB["q" if y < 90 else "r"]
    # mejilla izquierda y borde de la mascara bajo las cartas (se ven cuando la mano se mueve)
    for y in range(66, 90):
        for x in range(46, 60):
            if head[y, x, 3] == 0 and hand[y, x, 3] > 0:
                inside = x >= 48 + max(0, (y - 82) // 2)
                if y <= 72: head[y, x] = RGB["y" if x > 48 else "K"]
                elif y == 73: head[y, x] = RGB["K"]
                elif inside: head[y, x] = RGB["r" if x > 49 else "q"]
                elif x == 47 + max(0, (y - 82) // 2): head[y, x] = RGB["K"]
    # traje bajo el guante: solapa y hombro izquierdos (espejo del derecho)
    for y in range(88, 128):
        xs = np.where(body[y, 64:, 3] > 0)[0]
        if not len(xs): continue
        xl = 142 - (64 + xs.max())                                   # borde izquierdo = espejo del hombro derecho (eje x=71, la pajarita)
        body[y, :max(0, xl)] = 0
        for x in range(max(0, xl), 60):
            if body[y, x, 3] == 0:
                body[y, x] = RGB["s" if x == xl else "K" if x == xl + 1 else "P" if 52 <= x <= 56 else "d"]
    return L

def fill_holes(a, src):
    """huecos transparentes DENTRO de la silueta de una capa -> el pixel del maestro (asi, al moverse, no asoma lo de detras)"""
    solid = a[..., 3] > 0; out = np.zeros_like(solid); st = []
    for y in range(128):
        for x in (0, 127): st.append((x, y))
    for x in range(128):
        for y in (0, 127): st.append((x, y))
    st = [(x, y) for x, y in st if not solid[y, x]]
    for x, y in st: out[y, x] = True
    while st:
        x, y = st.pop()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            xx, yy = x + dx, y + dy
            if 0 <= xx < 128 and 0 <= yy < 128 and not out[yy, xx] and not solid[yy, xx]: out[yy, xx] = True; st.append((xx, yy))
    holes = ~solid & ~out
    a[holes] = src[holes]
    a[holes & (a[..., 3] == 0)] = RGB["K"]
    return a

def extend_wrist(hand):
    """el guante sigue hacia abajo (muneca) para que al subir la mano no se vea cortado"""
    row = hand[115].copy()
    for y in range(116, 128): hand[y] = row
    return hand

def split_cards(hand):
    """mano -> (cartas de detras, carta de delante + guante) para abrir y cerrar el abanico"""
    back = np.zeros_like(hand); front = hand.copy()
    for y in range(128):
        for x in range(128):
            if hand[y, x, 3] == 0: continue
            if (y < 90 and x <= 35) or (90 <= y <= 99 and x <= 30):
                back[y, x] = hand[y, x]; front[y, x] = 0
    return back, front

# lado izquierdo de la cara (el que tapan las cartas), dibujado en espejo del derecho con la luz del lado izquierdo: la mascara llega a la
# fila 77 como por la derecha, linea de tinta en la 78, mejilla y mandibula. Desde (44, 70); ' ' deja lo que haya, '.' es transparente
LEFT_FACE = """
    |               
    |..sKbyyyyytttb 
    |...sKbyyyyyyyb 
    |....sKbyyyyyyy 
    |....sKbyyyyyyy 
    |....sKbyyyyyyy 
    |....sKbyyyyyyy 
    |....sKbyyyyyyy 
    |....sKKKKKKKKKK
    |....sKrrrrrrrr 
    |....sKrrrrrrrr 
    |....sKrrrrrrrr 
    |....sKrrrrrrrr 
    |....sKrrrrrrrr 
    |......ssKrrrrr 
    |.......ssKKKrr 
    |.........sKKrr 
    |.........sKKrr 
    |...........KKKK
    |.............. 
"""

def clean_left_face(L, m):
    """la cara bajo las cartas, limpia: donde el maestro muestra el contorno de la carta (no la cara), ese pixel pasa a la capa de la mano"""
    head, hand = L["head"], L["hand"]
    design = head.copy(); patch(design, 44, 70, LEFT_FACE, keep=" ")
    for y in range(70, 90):
        for x in range(44, 59):
            if (design[y, x] == head[y, x]).all(): continue
            if hand[y, x, 3] > 0: head[y, x] = design[y, x]; continue              # tapado por las cartas: se pinta sin mas
            if x <= 56 and m[y, x, 3] > 0 and ch(m, x, y) in "KDs":                   # visible: es el canto de la carta, no la cara
                hand[y, x] = m[y, x]; head[y, x] = design[y, x]
    return L

def layers():
    L = split(build())
    m = build()
    stray = np.zeros((128, 128), bool); stray[:88, :50] = L["body"][:88, :50, 3] > 0     # contorno de las cartas que cayo en el cuerpo
    L["hand"][stray] = L["body"][stray]; L["body"][stray] = 0
    L["hand"] = fill_holes(L["hand"], m)
    L = fill_hidden(L)
    L = clean_left_face(L, m)
    L["hand"] = extend_wrist(L["hand"])
    L["cards"], L["fist"] = split_cards(L["hand"])
    L["head"][:, :43] = 0                                             # la cara nunca pasa de x=44: fuera restos del contorno de las cartas
    return L

def compose(parts, cut=True):
    """parts: [(capa RGBA, dx, dy), ...] en orden de atras a delante; recorta el busto en la fila 118 y cierra con contorno"""
    out = blank()
    for a, dx, dy in parts: over(out, a, dx, dy)
    if cut:
        out[BOTTOM + 1:] = 0
        row = out[BOTTOM, :, 3] > 0
        out[BOTTOM + 1, row] = RGB["s"]
    return out

if __name__ == "__main__":
    from px import sheet
    L = layers()
    d = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".")
    full = compose([(L["body"], 0, 0), (L["head"], 0, 0), (L["hat"], 0, 0), (L["hand"], 0, 0)])
    m = build(); diff = int((full != m).any(-1).sum())
    print("diferencias con el maestro:", diff)
    sheet([L["body"], L["head"], L["hat"], L["hand"], full,
           compose([(L["body"], 0, 0), (L["head"], 0, 1), (L["hat"], 0, -9), (L["hand"], 3, 5)])], d / "rig.png", k=3, cols=6,
          labels=["body", "head", "hat", "hand", "compuesto", "prueba: chistera -9, mano +3+5"])
