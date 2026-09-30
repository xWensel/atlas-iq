#!/usr/bin/env python3
"""Geolite - Don Crupier: expresiones y gestos (solo desarrollo). Lo lee build.py y acaba en js/crupier-data.js.
Salen de la revision de las 537 frases y escenas del crupier (catalogo de 17 caras y 43 gestos, 2026-09-30).

Pose (las mismas claves que js/crupier.js):
  e ojos (open half closed happy wide angry sad squint sleepy big calm rage glow)   r ojo derecho distinto (guinos)
  l mirada -1/0/1 (2 = arriba)   m boca (smirk talk1 talk2 talk3 laugh grin grit oh frown yawn flat whistle smile crooked shout snore, "" = nada)
  s bigote dy   b cuerpo, h cabeza, t chistera (sobre la cabeza), c cartas, f guante de las cartas: [dx, dy]
  k inclinacion de cabeza y chistera (-2..2, filas desplazadas, sin rotar ni emborronar)   w glitch: [[y0, y1, dx], ...]
  d 1 = a oscuras (silueta con los ojos encendidos)
  g mano libre: FREE(postura, muneca, codo) -> build la pinta y la guarda como pieza     x efectos: [[pieza, dx, dy], ...]
Expresion: base, idle (bucle [[pose, ms], ...]), talk (bocas al hablar), rest (boca al callar), blink, breath (ms o False),
           enter (gesto al ponerla), fidget (gestos sueltos en reposo), still (retoque para la imagen fija), talkMs (ritmo de boca)
Gesto: frames [[pose, ms], ...], lockMouth (la boca del gesto manda aunque hable), hold (el ultimo fotograma se queda hasta release())
"""

def FREE(kind, wrist, elbow=None):
    return ("free", kind, tuple(wrist), tuple(elbow) if elbow else None)

def P(**k):
    for a in ("b", "h", "t", "c", "f"):
        if a in k: k[a] = list(k[a])
    return k

def F(kind, at):                          # mano libre en una posicion con nombre
    return FREE(kind, *at)

# ---------------------------------------------------------------- posiciones de la mano libre (muneca, codo), probadas a ojo
IN = ((100, 124), (116, 134))             # entrando por abajo a la derecha
CHEST = ((92, 102), (114, 116))
CHEST_HI = ((94, 94), (116, 110))
PALM_UP = ((98, 100), (118, 114))
FACE_R = ((97, 88), (118, 106))
FACE_R2 = ((94, 88), (116, 106))
FACE_R3 = ((100, 88), (120, 106))
LIPS = ((80, 94), (108, 110))
STACHE_TIP = ((91, 94), (114, 110))
BOWTIE = ((84, 112), (108, 124))
BRIM = ((100, 53), (120, 80))
BRIM_UP = ((100, 47), (120, 76))
BRIM_HIGH = ((104, 45), (122, 74))        # chistera en alto: arriba del todo del lienzo (fila 0), nunca cortada
MASK = ((82, 82), (108, 104))
POCKET = ((92, 112), (114, 124))
WATCH = ((93, 100), (116, 114))
CARDS = ((66, 102), (100, 118))
SWEEP = [((96, 96), (116, 112)), ((80, 98), (110, 114)), ((64, 100), (100, 116)), ((50, 102), (92, 118))]
KNOCK = ((84, 106), (110, 120))
KNOCK_HIT = ((84, 104), (110, 118))

# ---------------------------------------------------------------- expresiones
EXPR = {
    # la base: el retrato que le encanta al usuario, con su media sonrisa
    "sly": dict(base=P(e="open", m="smirk"), talk=["talk1", "talk2", "talk1", "smirk"],
                idle=[[P(), 5200], [P(l=-1), 1100], [P(), 3600], [P(l=1), 900]], fidget=["shuffle", "fan_self", "hat_tip", "twirl_moustache"]),
    "laugh": dict(base=P(e="happy", m="laugh", s=-1), talk=["laugh", "talk3", "laugh", "talk2"], rest="laugh", blink=False, breath=False,
                  idle=[[P(h=(0, -1), c=(0, -1), f=(0, -1)), 110], [P(), 110], [P(h=(0, -1), c=(0, -1), f=(0, -1)), 110], [P(), 110],
                        [P(h=(0, -1), c=(0, -1), f=(0, -1)), 110], [P(), 400]], enter="hat_pop"),
    "angry": dict(base=P(e="angry", m="grit"), talk=["grit", "talk3", "grit", "talk2"], rest="grit",
                  idle=[[P(), 1400], [P(h=(-1, 0)), 60], [P(h=(1, 0)), 60], [P(h=(-1, 0)), 60], [P(), 60]], fidget=["crumple"]),
    "shock": dict(base=P(e="wide", m="oh"), talk=["oh", "talk2", "oh", "talk3"], rest="oh", blink=False, enter="hat_pop",
                  idle=[[P(), 800], [P(h=(1, 0)), 60], [P(), 740], [P(e="half"), 60], [P(e="wide"), 90], [P(e="half"), 60]]),
    "wink": dict(base=P(e="open", r="happy", m="smirk"), talk=["talk1", "talk2", "smirk"],
                 idle=[[P(r="happy"), 900], [P(r=None), 3600], [P(r="half"), 60]], enter="wink"),
    "suspicious": dict(base=P(e="squint", m="flat"), talk=["talk1", "flat", "talk1"], rest="flat",
                       idle=[[P(l=-1), 1500], [P(l=0), 700], [P(l=1), 1500], [P(l=0), 700]]),
    "smug": dict(base=P(e="half", m="grin", l=1), talk=["talk1", "grin", "talk2", "grin"], rest="grin", fidget=["fan_self", "twirl_moustache", "preen"]),
    "sad": dict(base=P(e="sad", m="frown"), talk=["talk1", "frown", "talk1"], rest="frown", breath=2000,
                idle=[[P(), 2600], [P(x=[["fx_tear", 0, 0]]), 900], [P(x=[["fx_tear", 0, 3]]), 500]]),
    "nervous": dict(base=P(e="sad", m="grin", x=[["fx_sweat", 0, 0]]), talk=["grin", "talk1", "grin", "talk2"], rest="grin", talkMs=55,
                    idle=[[P(l=-1), 380], [P(l=1), 380], [P(l=-1, c=(1, 0)), 120], [P(l=-1, c=(-1, 0)), 120], [P(l=0), 900]]),
    "innocent": dict(base=P(e="open", l=2, m="whistle", c=(0, 2), f=(0, 2), h=(-1, 0)), talk=["whistle", "talk1"], rest="whistle",
                     idle=[[P(l=2), 1500], [P(l=2, s=-1), 120], [P(l=2), 1500]]),
    "bored": dict(base=P(e="sleepy", m="flat", c=(0, 3), f=(0, 3), h=(0, 1)), talk=["talk1", "flat"], rest="flat", breath=2200, talkMs=120,
                  fidget=["yawn", "slow_blink"]),
    "sleep": dict(base=P(e="closed", m="snore", h=(0, 2), c=(0, 3), f=(0, 3), t=(0, 1)), talk=["snore", "talk1"], rest="snore", blink=False, breath=1600,
                  talkMs=140, still=P(x=[["fx_z1", 0, 0], ["fx_z2", 0, 0]]),
                  idle=[[P(x=[["fx_z1", 0, 0]]), 800], [P(x=[["fx_z1", 0, 0], ["fx_z2", 0, 0]], s=-1), 800],
                        [P(x=[["fx_z1", 0, 0], ["fx_z2", 0, 0], ["fx_z3", 0, 0]]), 900], [P(h=(0, 5), c=(0, 4), f=(0, 4)), 500], [P(), 300]]),
    "furious": dict(base=P(e="rage", m="shout", s=-2), talk=["shout", "talk3", "shout", "laugh"], rest="shout", breath=False, talkMs=60,
                    idle=[[P(h=(-2, 0), c=(1, 0), f=(1, 0)), 70], [P(h=(2, 0), c=(-1, 0), f=(-1, 0)), 70], [P(b=(0, 1), h=(0, 1)), 150], [P(), 150]],
                    enter="tantrum"),
    "puzzled": dict(base=P(e="big", r="half", m="crooked", l=2), talk=["talk1", "crooked"], rest="crooked",
                    idle=[[P(l=2), 1500], [P(l=-1), 1500]], fidget=["scratch_head"]),
    "dare": dict(base=P(e="angry", m="smirk", t=(0, 3), h=(0, 1), b=(0, -1), c=(1, -2), f=(1, -2)), talk=["talk1", "smirk"], rest="smirk",
                 breath=2400, enter="hat_low", idle=[[P(), 3000], [P(e="half"), 80]]),
    "bow": dict(base=P(e="calm", m="smile", h=(0, 3), b=(0, 1), c=(0, 2), f=(0, 2)), talk=["talk1", "smile"], rest="smile", blink=False,
                breath=False, enter="hat_off_bow"),
    "dark": dict(base=P(d=1, e="glow", m="", l=2), talk=["grin", ""], rest="", idle=[[P(l=2), 1800], [P(l=-1), 1400], [P(l=2), 1800], [P(e="closed"), 100]], blink=False),
    "dark_vexed": dict(base=P(d=1, e="glowv", m=""), talk=["grin", ""], rest="", idle=[[P(), 2400], [P(l=-1), 900], [P(e="closed"), 100]], blink=False),
}
EXPR_ALIAS = {"boss": "dare", "deadpan": "bored", "doze": "sleep", "neutral": "sly", "dark_innocent": "dark"}

# ---------------------------------------------------------------- gestos
def hand_in(kind, at, ms=83):
    return [[P(g=F(kind, IN)), ms], [P(g=F(kind, at)), ms]]

def hand_out(kind, at, ms=83):
    return [[P(g=F(kind, IN)), ms]]

GEST = {
    # ---- la chistera (siempre la misma, lisa)
    "hat_tip": dict(frames=hand_in("grip", BRIM) + [[P(g=F("grip", BRIM), t=(0, 2), h=(0, 1), e="half"), 170],
                                                    [P(g=F("grip", BRIM), t=(0, -1)), 83], [P(g=F("grip", BRIM)), 83]] + hand_out("grip", BRIM)),
    "hat_off_bow": dict(frames=hand_in("grip", BRIM) + [
        [P(g=F("grip", BRIM_UP), t=(0, -6)), 110], [P(g=F("grip", BRIM_HIGH), t=(4, -8)), 110],
        [P(g=F("grip", BRIM_HIGH), t=(4, -11), e="calm", m="smile", h=(0, 3), b=(0, 1), c=(0, 2), f=(0, 2)), 250],   # la cabeza baja; la chistera queda quieta en la mano
        [P(g=F("grip", BRIM_HIGH), t=(4, -12), e="calm", m="smile", h=(0, 4), b=(0, 2), c=(0, 3), f=(0, 3)), 700],
        [P(g=F("grip", BRIM_HIGH), t=(4, -10), e="calm", m="smile", h=(0, 2), b=(0, 1)), 110],
        [P(g=F("grip", BRIM_UP), t=(0, -6), h=(0, 1)), 110], [P(g=F("grip", BRIM), t=(0, -1)), 83], [P(g=F("grip", BRIM)), 83]] + hand_out("grip", BRIM),
        lockMouth=True),
    "hat_pop": dict(frames=[[P(t=(0, 1)), 83], [P(t=(0, -5), b=(0, -1), h=(0, -1), c=(0, -1), f=(0, -1)), 83], [P(t=(0, -7), b=(0, -1), h=(0, -1)), 83],
                            [P(t=(0, -3)), 83], [P(t=(0, 1)), 83], [P(), 83]]),
    "hat_low": dict(frames=hand_in("grip", BRIM) + [[P(g=F("grip", ((100, 54), (120, 81))), t=(0, 1)), 83], [P(g=F("grip", ((100, 56), (120, 82))), t=(0, 3)), 170]] +
                    [[P(g=F("grip", IN), t=(0, 3)), 83]]),
    "hat_chest": dict(frames=hand_in("grip", BRIM) + [
        [P(g=F("grip", BRIM_UP), t=(0, -5)), 110], [P(g=F("grip", ((118, 46), (126, 80))), t=(20, -8)), 90], [P(g=F("grip", ((118, 84), (126, 110))), t=(18, 30)), 90],
        [P(g=F("grip", ((104, 118), (120, 132))), t=(4, 70)), 90],
        [P(g=F("grip", ((104, 118), (120, 132))), t=(4, 70), h=(0, 2), e="sad", m="frown"), 1500],
        [P(g=F("grip", ((118, 84), (126, 110))), t=(18, 30), h=(0, 1)), 90], [P(g=F("grip", ((118, 46), (126, 80))), t=(20, -8)), 90], [P(g=F("grip", BRIM_UP), t=(0, -5)), 110],
        [P(g=F("grip", BRIM), t=(0, -1)), 83], [P(g=F("grip", BRIM)), 83]] + hand_out("grip", BRIM), lockMouth=True),
    # ---- las cartas (siempre las mismas tres, sin indices)
    "shuffle": dict(frames=[[P(c=(3, 1)), 83], [P(c=(6, 2)), 83], [P(c=(6, -2)), 83], [P(c=(6, 2), f=(0, 1)), 83], [P(c=(6, 2)), 83],
                            [P(c=(6, -2)), 83], [P(c=(6, 2), f=(0, 1)), 83], [P(c=(3, 1)), 83], [P(), 83]]),
    "deal_card": dict(frames=[[P(x=[["fx_card1", 0, -3]]), 83], [P(f=(-1, 0), x=[["fx_card1", 0, -3]]), 83], [P(x=[["fx_card1", 6, 6]]), 83],
                              [P(x=[["fx_card2", 0, 8]]), 83], [P(x=[["fx_card2", 6, 26]], c=(3, 1)), 83], [P(c=(1, 0)), 83], [P(), 83]]),
    "card_reveal": dict(frames=hand_in("pinch", CHEST) + [[P(g=F("pinch", ((78, 92), (108, 112))), x=[["fx_cardback", 12, 2]]), 170],
                                                          [P(g=F("pinch", ((78, 92), (108, 112))), x=[["fx_card1", 12, 2]]), 580],
                                                          [P(g=F("pinch", CHEST)), 83]] + hand_out("pinch", CHEST)),
    "fan_self": dict(frames=[[P(c=(1, -4), f=(1, -4)), 166]] + [[P(c=(2, -6), f=(2, -6), s=-1), 160], [P(c=(1, -4), f=(1, -4)), 160], [P(c=(0, -3), f=(0, -3)), 160]] * 2
                     + [[P(c=(0, -1), f=(0, -1)), 166], [P(), 83]]),
    "fan_open": dict(frames=[[P(c=(4, 3), f=(0, 2)), 83], [P(c=(-1, -3), f=(0, -3)), 83], [P(c=(0, -2), f=(0, -2)), 83], [P(c=(0, -2), f=(0, -2)), 500], [P(), 166]]),
    "crumple": dict(frames=[[P(c=(4, 1)), 83], [P(c=(6, 2)), 83]] + [[P(c=(7, 2), f=(1, 0)), 60], [P(c=(5, 2), f=(-1, 0)), 60]] * 2 + [[P(c=(3, 1)), 83], [P(), 166]]),
    "cards_hide": dict(frames=[[P(l=1), 83], [P(l=1, c=(-2, 12), f=(-2, 12)), 83], [P(l=1, c=(-4, 34), f=(-4, 34)), 83], [P(l=1, c=(-4, 60), f=(-4, 60), b=(0, -1)), 500],
                               [P(c=(-4, 34), f=(-4, 34)), 83], [P(c=(-2, 12), f=(-2, 12)), 83], [P(), 83]]),
    "point": dict(frames=[[P(c=(5, 2)), 83], [P(c=(9, -3), f=(4, -4)), 166], [P(c=(10, -3), f=(5, -4)), 83], [P(c=(9, -3), f=(4, -4)), 560], [P(c=(4, -1), f=(2, -2)), 166], [P(), 83]]),
    "tremble": dict(frames=[[P(h=(-1, 0), b=(1, 0), c=(1, 0), f=(1, 0), m="grit"), 60], [P(h=(1, 0), b=(-1, 0), c=(-1, 0), f=(-1, 0), m="grit"), 60]] * 6),
    "tantrum": dict(frames=[[P(b=(0, 2), h=(0, 2), c=(6, 3), f=(0, 2)), 83], [P(b=(0, 2), h=(0, 2), t=(0, -4), c=(6, 3)), 83], [P(b=(2, 0), h=(2, 0), c=(5, 2), f=(2, 0)), 83], [P(t=(0, 0)), 83],
                            [P(b=(0, 2), h=(0, 2), c=(4, 3), f=(0, 2)), 83], [P(b=(0, 2), h=(0, 2), t=(0, -4)), 83], [P(b=(-2, 0), h=(-2, 0), f=(-2, 0)), 83], [P(), 83],
                            [P(b=(0, 2), h=(0, 2), c=(4, 3), f=(0, 2)), 83], [P(b=(0, 2), h=(0, 2), t=(0, -4)), 83], [P(b=(2, 0), h=(2, 0), f=(2, 0)), 83], [P(), 83],
                            [P(b=(0, 1)), 125], [P(), 125]]),
    "droop": dict(frames=[[P(b=(0, 1), h=(0, 2), t=(0, 1)), 125], [P(b=(0, 2), h=(0, 3), t=(0, 1), e="sad"), 125], [P(b=(0, 2), h=(0, 3), t=(0, 1), c=(3, 5), f=(0, 4), e="sad", m="frown"), 250]],
                  hold=True),
    # ---- la mano libre (su izquierda)
    "shrug": dict(frames=[[P(b=(0, 1), h=(0, 1)), 83], [P(g=F("palm", PALM_UP), b=(0, -2), h=(0, -1), c=(-1, -2), f=(-1, -2), e="half"), 167],
                          [P(g=F("palm", PALM_UP), b=(0, -2), h=(0, -1), c=(-1, -2), f=(-1, -2), e="half"), 350], [P(g=F("palm", IN)), 150]]),
    "finger_wag": dict(frames=hand_in("point", FACE_R) + [[P(g=F("point", FACE_R2)), 110], [P(g=F("point", FACE_R)), 110], [P(g=F("point", FACE_R3)), 110], [P(g=F("point", FACE_R)), 110]] * 2
                       + hand_out("point", FACE_R) + [[P(), 83]]),
    "finger_up": dict(frames=hand_in("point", FACE_R) + [[P(g=F("point", ((97, 84), (118, 104)))), 83], [P(g=F("point", ((97, 86), (118, 105)))), 900]], hold=True),
    "shh": dict(frames=hand_in("point", LIPS) + [[P(g=F("point", LIPS), m="", l=-1), 1000], [P(g=F("point", CHEST)), 83]] + hand_out("point", CHEST), lockMouth=True),
    "beckon": dict(frames=hand_in("palm", PALM_UP) + [[P(g=F("point", PALM_UP), h=(0, 1)), 120], [P(g=F("palm", PALM_UP)), 120]] * 2 + hand_out("palm", PALM_UP)),
    "pinch": dict(frames=hand_in("pinch", CHEST_HI) + [[P(g=F("pinch", CHEST_HI), e="squint"), 650]] + hand_out("pinch", CHEST_HI)),
    "slow_clap": dict(frames=[[P(c=(5, 2), g=F("palm", IN)), 83]] + [[P(c=(8, 1), f=(6, 0), g=F("palm", ((74, 104), (104, 118)))), 167],
                                                                        [P(c=(8, 4), f=(6, 3), g=F("palm", ((74, 106), (104, 119)))), 83]] * 3
                      + [[P(c=(3, 1), g=F("palm", IN)), 83], [P(), 83]]),
    "facepalm": dict(frames=hand_in("palm", MASK) + [[P(g=F("palm", MASK), h=(0, 2), e="closed", m="flat"), 600],
                                                     [P(g=F("palm", ((86, 88), (110, 106))), h=(0, 1), m="flat"), 83], [P(g=F("palm", ((90, 96), (112, 112)))), 83]] + hand_out("palm", MASK),
                     lockMouth=True),
    "scratch_head": dict(frames=hand_in("grip", BRIM) + [[P(g=F("grip", BRIM_UP), t=(0, -2), l=2), 100], [P(g=F("grip", ((101, 48), (120, 76))), t=(0, -2), l=2), 100]] * 4
                         + [[P(g=F("grip", BRIM)), 83]] + hand_out("grip", BRIM)),
    "twirl_moustache": dict(frames=hand_in("pinch", STACHE_TIP) + [[P(g=F("pinch", STACHE_TIP), s=-1, e="half"), 170], [P(g=F("pinch", ((91, 92), (114, 109))), s=-1, e="half", m="grin"), 250],
                                                                   [P(g=F("pinch", STACHE_TIP), e="half", m="grin"), 166]] + hand_out("pinch", STACHE_TIP)),
    "preen": dict(frames=hand_in("pinch", BOWTIE) + [[P(g=F("pinch", ((85, 112), (108, 124)))), 83], [P(g=F("pinch", BOWTIE), h=(0, -1)), 166],
                                                     [P(g=F("grip", BRIM), h=(0, -1)), 83], [P(g=F("grip", BRIM), h=(0, -1), t=(0, 1)), 83], [P(g=F("grip", BRIM), h=(0, -1)), 83]] + hand_out("grip", BRIM)),
    "pocket_watch": dict(frames=hand_in("pinch", POCKET) + [[P(g=F("pinch", WATCH), x=[["fx_watch", 0, 0]]), 166], [P(g=F("pinch", WATCH), x=[["fx_watch", 0, 0]], l=-1, e="half"), 500],
                                                            [P(g=F("pinch", ((93, 101), (116, 115))), x=[["fx_watch", 0, 1]]), 83], [P(g=F("pinch", POCKET)), 166]] + hand_out("pinch", POCKET)),
    "coin_toss": dict(frames=hand_in("palm", PALM_UP) + [[P(g=F("palm", ((98, 102), (118, 116)))), 83], [P(g=F("palm", PALM_UP), x=[["fx_coin1", 0, 0]]), 83],
                                                        [P(g=F("palm", PALM_UP), x=[["fx_coin2", 0, 0]], l=2), 83], [P(g=F("palm", PALM_UP), x=[["fx_coin3", 0, 0]], l=2), 83],
                                                        [P(g=F("palm", PALM_UP), x=[["fx_coin3", 0, -24]], l=2), 83]] + hand_out("palm", PALM_UP)),
    "stamp": dict(frames=[[P(g=F("fist", ((94, 86), (116, 104))), e="angry", m="grit"), 83], [P(g=F("fist", ((94, 84), (116, 102))), e="angry", m="grit"), 83],
                          [P(g=F("fist", ((94, 106), (116, 118))), e="angry", m="grit", b=(0, 1), h=(0, 1)), 83], [P(g=F("fist", ((95, 106), (116, 118))), e="angry", m="grit"), 83],
                          [P(g=F("fist", ((93, 106), (116, 118))), e="angry", m="grit"), 83], [P(g=F("fist", IN)), 166]], lockMouth=True),
    "jot": dict(frames=hand_in("pinch", CARDS) + [[P(g=F("pinch", CARDS), l=-1, e="half", x=[["fx_card1", -14, 0]]), 110],
                                                  [P(g=F("pinch", ((66, 103), (100, 118))), l=-1, e="half", x=[["fx_card1", -14, 0]]), 110]] * 3
                + [[P(g=F("pinch", CARDS)), 83]] + hand_out("pinch", CARDS)),
    "glass_knock": dict(frames=[[P(h=(0, 2), t=(0, 1), c=(0, -2), f=(0, -2)), 166], [P(h=(0, 2), t=(0, 1), g=F("fist", KNOCK)), 83], [P(h=(0, 2), t=(0, 1), g=F("fist", KNOCK_HIT), b=(0, 1)), 83],
                                [P(h=(0, 2), t=(0, 1), g=F("fist", KNOCK)), 166], [P(h=(0, 2), t=(0, 1), g=F("fist", KNOCK_HIT), b=(0, 1)), 83], [P(h=(0, 2), t=(0, 1), g=F("fist", KNOCK)), 166],
                                [P(g=F("fist", IN)), 166]]),
    "snap": dict(frames=hand_in("pinch", FACE_R) + [[P(g=F("pinch", ((97, 87), (118, 105)))), 83], [P(g=F("point", ((97, 89), (118, 106)))), 250], [P(g=F("point", FACE_R)), 83]] + hand_out("point", FACE_R)),
    "magic_pass": dict(frames=[[P(g=F("palm", IN)), 83]] + [[P(g=F("palm", s_)), 83] for s_ in SWEEP] + [[P(g=F("palm", SWEEP[3]), c=(8, 60), f=(8, 60)), 83],
                                                                                                     [P(g=F("palm", IN), c=(6, 2)), 83], [P(c=(4, 1)), 83], [P(), 83]]),
    # ---- el cuerpo
    "tremble_body": dict(frames=[[P(h=(-1, 0), b=(-1, 0), c=(-1, 0), f=(-1, 0), m="grit"), 60], [P(h=(1, 0), b=(1, 0), c=(1, 0), f=(1, 0), m="grit"), 60]] * 6, lockMouth=True),
    "lean_in": dict(frames=[[P(b=(0, -1)), 83], [P(b=(0, -1), h=(0, 2), t=(0, 1), c=(0, -2), f=(0, -2), l=0), 166]], hold=True),
    "turn_away": dict(frames=[[P(h=(0, -2), k=-1, e="half", l=1, m="whistle"), 166], [P(h=(0, -2), k=-1, e="half", l=1, m="whistle"), 630],
                              [P(h=(0, -2), k=-1, e="half", l=-1, m="whistle"), 200], [P(h=(0, -1)), 166]], lockMouth=True),
    "head_tilt": dict(frames=[[P(k=1, t=(1, 0)), 83], [P(k=1, t=(2, 1)), 500], [P(k=1), 83], [P(), 83]]),
    "hand_heart": dict(frames=hand_in("palm", ((90, 110), (112, 122))) + [[P(g=F("palm", ((90, 108), (112, 121))), e="calm", h=(0, 1)), 900]] + hand_out("palm", ((90, 110), (112, 122)))),
    "cards_tap": dict(frames=[[P(c=(4, 1)), 83]] + [[P(c=(4, 3), f=(0, 1)), 70], [P(c=(4, 1)), 110]] * 3 + [[P(), 83]]),
    "pocket_coin": dict(frames=hand_in("pinch", CHEST) + [[P(g=F("pinch", CHEST), x=[["fx_coin1", -8, 6]], e="half"), 250], [P(g=F("pinch", POCKET), e="half"), 166]] + hand_out("pinch", POCKET)),
    "sway": dict(frames=[[P(b=(dx, 0), h=(dx, 0), c=(dx2, 0), f=(dx2, 0), t=(0, 0)), 110] for dx, dx2 in ((-2, -1), (-1, -2), (0, -1), (1, 0), (2, 1), (1, 2), (0, 1), (-1, 0))] * 2),
    "nod": dict(frames=[[P(h=(0, 2)), 160], [P(), 160], [P(h=(0, 1)), 160], [P(), 160]]),
    "blow": dict(frames=[[P(s=-1, m="whistle"), 166], [P(m="whistle", s=-1), 83], [P(m="whistle", x=[["fx_wind1", 0, 0]]), 110], [P(m="whistle", x=[["fx_wind2", 0, 0]]), 110],
                         [P(m="whistle", x=[["fx_wind2", 4, 2]]), 110], [P(), 166]], lockMouth=True),
    "yawn": dict(frames=[[P(e="happy", m="yawn", s=-1, h=(0, -1)), 250], [P(e="happy", m="yawn", s=-1, h=(0, -1), g=F("palm", ((82, 98), (108, 114)))), 333],
                         [P(e="half", g=F("palm", IN)), 250]], lockMouth=True),
    "freeze": dict(frames=[[P(), 700], [P(w=[[40, 52, 3], [88, 96, -2]]), 83], [P(w=[[40, 52, -2], [88, 96, 2]]), 83], [P(), 83], [P(r="happy"), 450]], freeze=True),
    "slow_blink": dict(frames=[[P(e="half"), 150], [P(e="closed"), 500], [P(e="half"), 150]]),
    "wink": dict(frames=[[P(r="half"), 60], [P(r="happy"), 700], [P(r="half"), 60]]),
}
GEST_ALIAS = {"hat_hop": "hat_pop", "hat_jump": "hat_pop", "flinch": "hat_pop", "bow": "hat_off_bow", "mourn": "hat_chest", "fan": "fan_self",
              "wag": "finger_wag", "twirl": "twirl_moustache", "bowtie": "preen", "toss": "coin_toss", "slam": "crumple"}

FIDGET_EVERY = (7000, 14000)          # ms entre gestos sueltos en reposo (con el globo cerrado)
