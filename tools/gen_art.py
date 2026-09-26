#!/usr/bin/env python3
"""
Atlas IQ - estudio grafico unico (solo desarrollo). Genera TODO el arte con el mismo modelo y el mismo libro de estilo,
para que iconos, banners, cartas y logos parezcan hechos por el mismo estudio: pixel art "casino x geografia" estilo Balatro.

  python tools/gen_art.py                 genera lo que falte (iconos, escenas, logos) y lo post-procesa
  python tools/gen_art.py id1 id2 ...     regenera solo esos ids (borra antes su archivo si quieres otra semilla: usa --seed N)
  python tools/gen_art.py --list          lista los ids
  python tools/gen_art.py --post          solo post-procesa (recorte de fondo, WebP)

La clave va en .env.local (POLLINATIONS_KEY). Nunca se incluye en el juego.
Salida: assets/icons/<id>.webp (transparentes, 256 px) · assets/gen/<id>.webp (escenas) · assets/raw/ (originales, ignorado por git)
"""
import os, sys, json, time, hashlib, urllib.request, urllib.parse, concurrent.futures as cf
from pathlib import Path
from PIL import Image
sys.path.insert(0, str(Path(__file__).parent))
from keyout import keyout

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "assets" / "raw"; ICONS = ROOT / "assets" / "icons"; GEN = ROOT / "assets" / "gen"
for d in (RAW, ICONS, GEN): d.mkdir(parents=True, exist_ok=True)
env = ROOT / ".env.local"
KEY = os.environ.get("POLLINATIONS_KEY") or (dict(l.split("=", 1) for l in env.read_text().splitlines() if "=" in l).get("POLLINATIONS_KEY") if env.exists() else None)

MODEL = "zimage"
PAL = "saturated palette of coral red, gold, teal green and violet"
ICON_SUF = f"chunky pixels, thick dark purple outline, glossy highlights, {PAL}, Balatro card game item art, centered, isolated on plain flat bright magenta background, no text"
SCENE_SUF = f"chunky pixels, thick dark purple outlines, glossy highlights, {PAL}, Balatro casino roguelike game art, no text, no letters"

I = {}   # id -> subject
def icons(d):
    I.update(d)

# ---------------------------------------------------------------- ICONOS
icons({
 # moneda, vida, comunes
 "coin": "a golden casino poker chip with a small globe engraved in the center", "heart": "a chunky glossy red heart with a golden compass rose in the middle",
 "skull": "a cream skull with red eyes and a small jester hat", "lock": "a golden padlock", "globe": "a small world globe on a golden stand",
 "chips": "a stack of colorful poker chips with globes engraved", "chest": "an open treasure chest full of gold poker chips and gems",
 # herramientas
 "sonar": "a brass radar dish sonar on a tripod emitting green waves", "compass": "an ornate brass pocket compass with a red needle",
 "passport": "a teal travel passport with a golden emblem and a red stamp", "journal": "a worn leather field journal with a pencil and strap",
 "hourglass": "a wooden hourglass with golden sand",
 # reliquias existentes
 "steady": "a golden crosshair target reticle over a red bullseye", "boots": "a pair of brown explorer boots with small white wings", "purse": "a red leather coin pouch with a gold star",
 "gale": "a small sailboat sail catching swirling blue wind", "anchor": "a heavy steel ship anchor", "eagle": "a fierce golden hawk eye with feathers",
 "mapper": "an unfolded parchment map with a red X and dotted route", "marco": "a red and gold silk road pagoda", "columbus": "a wooden caravel ship with a red cross on the sail",
 "battuta": "a giant baobab tree at sunset", "cook": "a tiny tropical island with a palm tree and waves", "tour": "a grey stone castle tower with a red flag",
 "flash": "a crackling golden lightning bolt", "hoard": "a small wooden treasure chest overflowing with gold coins", "finisher": "a colorful firework burst",
 "scholar": "an inkwell with a white feather quill", "banker": "a steel bank vault safe with a golden dial", "glass": "a brass pirate spyglass telescope",
 "luck": "a bright green four leaf clover", "blindperk": "a black pirate eye patch on a black strap, small golden star", "heartperk": "a red heart with a golden compass rose",
 "crown": "a golden crown with red blue and green gems", "omen": "a purple crystal ball on a golden stand with a star inside",
 # jefes
 "wind": "swirling white wind gusts with flying paper scraps", "storm": "a dark storm cloud with a golden lightning bolt and rain", "strict": "golden balance scales with a ruler",
 "silence": "a golden bell crossed out by a red slash", "fog": "a thick white fog cloud with a small lighthouse",
 # barajas
 "deck_explorer": "a golden compass rose star", "deck_historian": "a broken ancient greek column with a scroll", "deck_navigator": "a wooden ship steering wheel", "deck_blind": "dark round sunglasses with a strap",
 # modos
 "m_adv": "a brown explorer fedora hat with a red band and a feather", "m_classic": "a vintage desk globe on a brass stand", "m_compete": "a golden trophy cup with a red star",
 "m_ext": "a fan of three playing cards with map pictures", "m_prof": "an explorer id card with a portrait", "m_codex": "a thick blue encyclopedia book with a globe emblem and a red ribbon",
 # palos y casino
 "s_pin": "a glossy red map pin", "s_compass": "a red four-point compass rose star", "s_peak": "a dark purple mountain peak with a white snowcap", "s_palm": "a dark purple palm tree on a tiny island",
 "dice": "a white six-sided die with red pips and a tiny compass on one face", "joker": "a purple jester hat with golden bells and a small globe", "cards": "a fan of three white playing cards with red pins",
 "slot": "a red slot machine whose reels show a pin, a star and a globe", "roulette": "a roulette wheel that is a world globe in the center", "cardback": "the back of a playing card, blue with a golden compass rose pattern",
 "ace": "an ace playing card with a mountain suit symbol", "felt": "a round green felt disc with map grid lines",
 "chip_r": "a red poker chip with a globe engraved", "chip_b": "a blue poker chip with a globe engraved", "chip_g": "a green poker chip with a globe engraved", "chip_k": "a black poker chip with a globe engraved", "chip_p": "a purple poker chip with a globe engraved",
 "blank_small": "a blue poker chip seen from above with an empty flat dark disc in the center", "blank_big": "an orange poker chip seen from above with an empty flat dark disc in the center", "blank_boss": "a red poker chip seen from above with an empty flat dark disc in the center",
 "blank_gold": "a golden poker chip seen from above with an empty flat dark disc in the center", "blank_teal": "a teal poker chip seen from above with an empty flat dark disc in the center",
 # rareza, medallas, rangos
 "g_0": "a grey pebble gem", "g_1": "a teal green cut gem", "g_2": "a purple diamond gem", "g_3": "a golden star gem with a red center",
 "medal_bronze": "a bronze medal with a blue ribbon", "medal_silver": "a silver medal with a blue ribbon", "medal_gold": "a gold medal with a blue ribbon",
 "iq_0": "a white map pin with a big black question mark", "iq_1": "a brown suitcase with a golden clasp", "iq_2": "a brown hiking backpack", "iq_3": "a brown explorer hat with a red band",
 "iq_4": "a wooden ship steering wheel", "iq_5": "a globe with an airplane orbit ring", "iq_6": "a folded map with a golden compass divider", "iq_7": "a globe wearing a golden crown",
 # continentes
 "k_af": "a cartoon silhouette of the continent Africa in orange", "k_eu": "a cartoon map shape of the continent of Europe in pink with the Scandinavian peninsula, Italy boot and Iberia", "k_as": "a cartoon silhouette of the continent Asia in yellow",
 "k_na": "a cartoon silhouette of the continent North America in blue", "k_sa": "a cartoon silhouette of the continent South America in green", "k_oc": "a cartoon silhouette of Australia and islands in cream",
 "k_an": "a cartoon silhouette of the continent Antarctica in white ice", "k_sea": "a blue ocean wave with foam",
 # tipos de tarjeta
 "t_city": "a city skyline with lit windows", "t_capital": "a government building with a golden dome and a red star", "t_country": "a tall flag pole with a red waving flag", "t_landmark": "an ancient temple with columns",
 "t_nature": "snowy mountain peaks with a sun", "t_water": "blue ocean waves", "t_strait": "a narrow blue sea channel between two green coasts", "t_battle": "two crossed swords",
 "t_event": "a tear-off calendar page with a golden star", "t_person": "a marble bust with a golden laurel wreath", "t_curio": "a glowing lightbulb with sparkles", "t_place": "a big red map pin on a folded map",
 # logros (glifos)
 "a_target": "an archery target with an arrow in the bullseye", "a_flame": "a bright orange flame", "a_comet": "a golden comet with a trail", "a_volcano": "an erupting volcano", "a_stopwatch": "a white stopwatch",
 "a_book": "an open book with a red ribbon", "a_medal": "a golden medal with a star", "a_cap": "a black graduation cap with a golden tassel", "a_moon": "a golden crescent moon with stars", "a_pack": "a brown adventurer backpack",
 "a_shield": "a blue shield with a golden star", "a_sun": "a golden sun rising over the horizon", "a_moai": "a grey moai stone statue", "a_inf": "a golden infinity symbol", "a_peak": "a snowy mountain with a red flag on top",
 "a_hundred": "a golden tag with the number 100", "a_pin": "a glossy red map pin", "a_lens": "a magnifying glass with a star in the lens", "a_house": "a small house with a red roof", "a_spark": "a white four-point sparkle star",
 # interfaz
 "u_set": "a chunky grey cog gear wheel with teeth and a round hole in the middle", "u_plus": "a magnifying glass with a plus sign", "u_minus": "a magnifying glass with a single horizontal minus bar inside the lens", "u_home": "a target crosshair compass", "u_pause": "two chunky golden pause bars",
 "u_fs": "four golden corner brackets", "u_skin": "a painter palette with colorful paint blobs", "u_lang": "two speech bubbles", "u_back": "a chunky cream arrow pointing left", "u_next": "a chunky cream arrow pointing right",
 "u_close": "a chunky red X mark", "u_enter": "a chunky cream keyboard enter key arrow that goes down and then points left", "u_star": "a chunky golden star",
})
# ---- reliquias nuevas (catalogo ampliado)
icons({
 "diplomat": "a diplomat top hat with a golden ribbon and a tiny flag", "guide": "a tour guide flag on a stick with a red pennant", "mayor": "a golden mayor chain medallion", "president": "a red presidential sash with a golden star",
 "chronicler": "an old scroll with a red wax seal and a quill", "naturalist": "a green leaf and a small butterfly in a jar", "magnet": "a red horseshoe magnet with golden tips", "laser": "a red laser pointer emitting a beam",
 "ruler": "a golden ruler with red tick marks", "streakguard": "a golden safety net", "momentum": "a golden meteor rocket flying up", "hotstreak": "a burning red hot flame with a coin",
 "combo": "three golden stacked multiplier rings", "earlybird": "a small blue bird with an alarm clock", "patience": "a wooden sundial", "pawn": "three golden pawnbroker balls", "coupon": "a red discount coupon ticket with a scissor cut",
 "dealer": "a green casino dealer visor", "piggy": "a golden piggy bank with a coin slot", "tip": "a small silver tip tray with coins", "jackpot": "a slot machine lever with a golden jackpot burst",
 "roulette_r": "a small roulette wheel with a white ball", "doubledown": "two stacked golden dice with arrows", "lucky7": "a big red lucky number seven", "highroller": "a stack of black poker chips and a cigar",
 "allin": "a huge pile of poker chips pushed forward", "sextant": "a brass sextant navigation instrument", "atlasbook": "a small thick atlas book with a compass on the cover", "compassrose": "a beautiful compass rose with N S E W points",
 "initial": "a golden letter A block toy cube", "binoculars": "brass binoculars", "curator": "a museum display case with a golden card inside", "shield": "a steel round shield with a golden compass",
 "medkit": "a red first aid kit with a white cross", "recycler": "a green recycling arrows loop with a coin", "earplugs": "two orange earplugs", "talisman": "a golden amulet with a red gem",
 "philosopher": "a glowing red philosopher stone with golden sparkles", "oracle": "a purple oracle eye in a golden triangle", "midas": "a golden hand touching a golden coin", "worldmap": "a glowing living world map scroll",
 "copycat": "a purple jester joker card with a mirror", "royalflush": "a fan of five gold and red playing cards royal flush", "hourglassperk": "a golden hourglass with sparkling sand",
 "mint": "a golden coin press machine", "bookmark": "a red bookmark ribbon on a thick book", "lighthouse": "a red and white striped lighthouse", "kite": "a red and gold kite with a tail", "sail": "a white sail on a wooden mast",
 "parrot": "a colorful red and green parrot", "telescope": "a long brass telescope on a tripod", "lantern": "a glowing brass lantern", "hat": "a brown pirate captain hat with a golden skull", "map2": "a rolled treasure map tied with a red string",
 "bottle": "a glass message bottle with a rolled map inside", "net": "a green fishing net with a golden fish", "torch": "a burning wooden torch", "totem": "a colorful carved wooden totem pole", "pyramid": "a golden pyramid with a glowing eye",
})

# ---------------------------------------------------------------- v0.10: perks contra retos, iconos de retos y el crupier
icons({
 "dictionary": "an open old dictionary book with a golden bookmark ribbon", "corrector": "a red proofreading pencil with a golden eraser and a tiny checkmark",
 "handmirror": "an ornate golden hand mirror with violet glass", "sticky": "a yellow sticky note with a red pushpin and a curled corner",
 "spectacles": "round golden reading glasses with violet lenses", "miner": "a miner helmet with a bright yellow headlamp beam",
 "neon": "a glowing pink and cyan neon tube shaped like a small globe", "lens": "a cartographer brass magnifying glass with a wooden handle",
 "divingmask": "a diving mask with teal glass and a red strap", "customs": "a customs rubber stamp with a red ink pad and a golden handle",
 "theodolite": "a brass theodolite surveying instrument on a small tripod", "plates": "two cracked continent shaped puzzle pieces joined by a golden magnet",
 "astrolabe": "an ornate golden astrolabe with a rotating ring and a small compass star", "generator": "a small red battery generator with a lightning bolt and a golden coil",
 "weathervane": "a golden weathervane rooster on a compass cross", "fan": "a chunky desk fan with teal blades and a golden cage",
 "interruptor": "a big red casino lever switch on a golden plate", "swapcard": "two playing cards swapping places with curved arrows",
 "coords": "a golden map pin with a tiny latitude longitude grid", "crosshair": "a red laser sight crosshair inside a golden ring",
 "magnifier": "a big round glass magnifying lens with golden frame and sparkle over a small map", "almanac": "an old almanac notebook with a golden star and a red ribbon",
 "sonarplus": "a radar dish with concentric teal waves and a golden antenna", "compass16": "a golden compass with sixteen points and a red needle",
 "spyhole": "a golden door peephole with a violet eye looking through", "markeddeck": "a fanned deck of playing cards with one card bent and marked by a red dot",
 "masterkey": "a golden master key with a globe shaped bow and a red gem",
 "ch_shaky": "a trembling cartoon letter A vibrating with motion lines", "ch_missing": "a short word made of letter tiles with two empty dark holes",
 "ch_swap": "two letter tiles swapping places with curved arrows", "ch_mirror": "a letter R next to its mirror reflection on a glass panel",
 "ch_memory": "a fading ghostly thought bubble with a question mark", "ch_blur": "a blurry out of focus eye surrounded by foggy circles",
 "ch_dark": "a dark night cloud with a crescent moon and one small candle", "ch_flicker": "a broken flickering casino light bulb with sparks",
 "ch_wrongborders": "a folded map with a crooked red wavy border line and a warning triangle", "ch_noborders": "a globe with erased dotted border lines and an eraser",
 "ch_pangea": "one giant supercontinent glued together from puzzle pieces", "ch_shuffle": "continent puzzle pieces swapping places with circular arrows",
 "ch_flip": "an upside down globe with a curved turning arrow", "ch_clouds": "puffy grey smoke clouds covering a small map",
 "dealer_neutral": "a mysterious casino croupier bust portrait, tall dark purple top hat with a small globe pin, golden half masquerade mask, neat black mustache, red bow tie, white gloves fanning playing cards, sly confident smile, facing front",
 "dealer_laugh": "a mysterious casino croupier bust portrait, tall dark purple top hat with a small globe pin, golden half masquerade mask, neat black mustache, red bow tie, white gloves, laughing loudly with mouth wide open and tears of joy, facing front",
 "dealer_angry": "a mysterious casino croupier bust portrait, tall dark purple top hat with a small globe pin, golden half masquerade mask, neat black mustache, red bow tie, white gloves, angry frowning with gritted teeth and slammed fists, facing front",
 "dealer_shock": "a mysterious casino croupier bust portrait, tall dark purple top hat with a small globe pin, golden half masquerade mask, neat black mustache, red bow tie, white gloves, shocked wide open eyes and small open mouth with a sweat drop, facing front",
})

# ---------------------------------------------------------------- v0.11: mas retos (texto, mapa, puntero) y sus perks
icons({
 "ch_upside": "an upside down letter Q flipped with a curved rotation arrow", "ch_runes": "a stone tablet with strange glowing runes and symbols",
 "ch_scroll": "a casino marquee ticker sign with sliding letter tiles and arrows", "ch_novowels": "letter tiles B R K with dots where vowels should be",
 "ch_anagram": "scrambled letter tiles tumbling out of a shaker cup", "ch_dance": "cartoon letters dancing with musical notes and motion lines",
 "ch_riddle": "a sphinx face with a question mark scroll riddle", "ch_babel": "a colorful tower of babel made of speech bubbles in different colors",
 "ch_spread": "continent puzzle pieces exploding apart with small stars", "ch_spin": "a spinning roulette globe with motion arrows",
 "ch_mirrorx": "a globe split down the middle mirrored left and right", "ch_tilt": "tilted crooked continent puzzle pieces leaning at angles",
 "ch_myopia": "a comically thick round eyeglasses lens blurring a small map", "ch_mosaic": "a globe made of big chunky pixel squares",
 "ch_negative": "an inverted color negative globe with swapped colors", "ch_quake": "a cracked ground with a shaking small map and seismic waves",
 "ch_drift": "a small map sliding away on a conveyor belt with arrows", "ch_decoys": "several identical red map pins with one real golden pin among them",
 "ch_lightning": "a bright yellow lightning bolt striking a dark cloud", "ch_rain": "a rain cloud with pixel rain streaks over a map",
 "ch_blindspot": "a black circular hole in the middle of a map with a crosshair", "ch_tremble": "a shaking crosshair cursor with vibration lines",
 "ch_blink": "a crosshair cursor blinking on and off with small sparkles", "ch_ghost": "a faint transparent ghost crosshair cursor fading away",
 "ch_cblur": "a blurry smeared crosshair cursor", "ch_lag": "a crosshair cursor with a stretched trailing snail slime trail",
 "ch_cmirror": "a crosshair cursor with an arrow pointing the opposite way", "ch_dizzy": "a crosshair cursor spinning with dizzy stars and swirls",
 "thermo": "a glowing thermometer with a gradient from blue to red", "translator": "a phrasebook with two speech bubbles and a globe",
 "detective": "a detective magnifying glass with a fedora hat", "decoder": "a golden decoder ring with symbols", "handbrake": "a red handbrake lever on a golden plate",
 "hdglasses": "high definition sunglasses with a sparkle and HD shape", "polarized": "polarized sunglasses with rainbow shine",
 "shockabsorber": "a heavy coil spring shock absorber in gold", "trapdetector": "a metal detector with a red warning light",
 "lightningrod": "a golden lightning rod on a rooftop", "umbrella": "a colorful open umbrella with raindrops", "graduated": "thick round graduated eyeglasses with a sparkle",
 "gamer": "a gaming mouse with glowing teal lights", "beacon": "a golden lighthouse beacon with light rays", "leadweight": "a heavy lead weight ball with a chain",
})

# ---------------------------------------------------------------- ESCENAS (wide 16:9 salvo indicacion)
S = {}
def scene(id, desc, w=1024, h=576): S[id] = (desc, w, h)
scene("hub_hero", "a casino table seen from above: green felt printed as a world map with latitude lines, stacks of globe poker chips, a fan of playing cards with compass suits, dice and a brass compass, warm neon glow", 1024, 448)
scene("boss_wind", "a howling gale blowing map-faced playing cards and poker chips off a card table on a ship deck over rough sea, huge white wind swirls")
scene("boss_storm", "lightning striking a giant slot machine floating on a stormy dark sea, jackpot bulbs, heavy rain")
scene("boss_strict", "a stern cartographer pit boss behind a felt table printed with latitude lines, giant golden scales weighing a globe against poker chips, huge ruler, spotlight")
scene("boss_silence", "a roulette wheel that is a spinning world globe frozen in eerie silence at night, giant muted golden bell with a red cross, purple moonlight")
scene("boss_fog", "a lighthouse made of neon marquee bulbs guiding ships over a sea of green felt printed with a map, thick fog")
scene("act_0", "sunrise over hills of green felt printed with a world map, a road paved with poker chips, a flag with a compass rose suit, dice and a brass compass")
scene("act_1", "a caravel with map-faced playing card sails crossing a sea of green felt toward the torn edge of the world map, a roulette globe moon, twilight")
scene("act_2", "ancient moai statues wearing jester hats among glowing slot machines in a moonlit jungle, poker chips scattered around")
scene("act_3", "a glowing world globe crowned with gold between four constellations shaped like a compass, a map pin, a mountain and a palm tree, marquee bulbs, aurora, starry night")
scene("camp", "an explorer's high-roller camp at night: a striped tent, a green felt table printed with a world map, map-faced cards, globe poker chips, campfire and lantern, marquee bulbs")
scene("chest", "a jackpot: an overflowing treasure chest spilling globe poker chips, dice, playing cards, a compass and gold coins, slot machine lights and golden rays")
scene("win", "a golden laurel wreath around a glowing globe, a royal flush of playing cards fanned out, confetti and chips raining, jackpot sunburst")
scene("lose", "a cracked brass compass, a torn treasure map and scattered losing playing cards on green felt, a single die showing one pip, dim lamp")
scene("shop_bg", "a moody casino lounge with green felt tables, lamps and shelves of maps and globes, dim warm light, empty of people", 1280, 720)
# tema de cada ronda (bandas anchas)
scene("topic_capital", "a grand capital city skyline with golden domes, government buildings and flags at sunset, playing card suits in the sky")
scene("topic_landmark", "famous world landmarks in a row: a pyramid, a tower, a temple and a statue, on a green felt landscape with marquee lights")
scene("topic_city", "a dense glowing metropolis at night with skyscrapers and neon casino signs, poker chips as moons")
scene("topic_country", "a giant world map made of colorful country pieces like a jigsaw on a green felt table with a magnifying glass")
scene("topic_history", "ancient battlefield with banners, cannons and old scrolls, a giant hourglass, dramatic sky, playing cards falling")
scene("topic_nature", "majestic mountains, a waterfall, a volcano and a lake under a golden sky, green felt meadow, playing cards suits")
scene("topic_clue", "a detective desk with a magnifying glass, a torn city map, mysterious clue cards and a lamp, purple night")
scene("topic_mixed", "a chaotic jackpot of world landmarks, cards, chips, dice and globes exploding around a slot machine, golden rays")
# tarjetas de modo (retrato)
scene("card_adv", "an explorer adventurer with a fedora standing on a hill of green felt, a road of poker chips leading to a sunrise, compass in hand", 640, 800)
scene("card_classic", "a classic vintage globe and open atlas on a wooden desk with a brass compass and an old lamp, nostalgic warm light", 640, 800)
scene("card_compete", "a golden trophy on a podium surrounded by poker chips, spotlights and a cheering crowd silhouettes, confetti", 640, 800)
scene("card_ext", "a fan of playing cards each showing a different world place, a magnifying glass and a globe, casino neon", 640, 800)
# tipos (respaldo Enciclopedia, cuadradas)
for t, d in [("city", "a dense old city skyline at dusk with lit windows"), ("capital", "a grand capital building with a golden dome and flags"), ("country", "a tall flagpole with a big red waving flag over a landscape"),
             ("landmark", "a majestic ancient temple with columns"), ("nature", "snowy mountain peaks with a sun and a forest"), ("water", "a deep blue ocean with big waves and a small island"),
             ("strait", "a narrow sea strait between two green coasts seen from above"), ("battle", "crossed swords and shields on a battlefield with banners"),
             ("event", "an old calendar page with a golden star and a wax seal"), ("person", "a marble bust of a historical figure with a laurel wreath on a pedestal"),
             ("curiosity", "a glowing lightbulb with sparkles and a magnifying glass"), ("place", "a big red map pin on a folded map")]:
    scene("type_" + t, d + ", vivid colors, filling the entire square frame edge to edge with no border, no card, no table", 640, 640)
# logo
LOGO = ("logo", "game title logo that reads ATLAS IQ in big chunky golden pixel lettering, the letter A shaped like a globe on legs, marquee light bulbs around the letters, a playing card and a red poker chip decoration, thick dark purple outline, glossy", 1024, 640)

def seed_for(id, extra=0):
    return int(hashlib.md5(id.encode()).hexdigest()[:6], 16) % 100000 + extra

def fetch(prompt, w, h, seed, tries=4):
    url = f"https://gen.pollinations.ai/image/{urllib.parse.quote(prompt)}?model={MODEL}&width={w}&height={h}&seed={seed}&nologo=true&private=true"
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"Authorization": "Bearer " + KEY, "User-Agent": "atlas-iq-art/1.0"})
            with urllib.request.urlopen(req, timeout=120) as r:
                data = r.read()
                if data[:3] in (b"\xff\xd8\xff", b"\x89PN") or data[:4] == b"RIFF":
                    return data
        except Exception as e:
            print("  reintento:", str(e)[:70])
        time.sleep(3 * (i + 1))
    return None

def job(kind, id, seed_extra):
    raw = RAW / f"{id}.jpg"
    if kind == "icon": prompt, w, h = f"pixel art sprite icon of {I[id]}, {ICON_SUF}", 512, 512
    elif kind == "scene": desc, w, h = S[id]; prompt = f"pixel art game illustration of {desc}, {SCENE_SUF}"
    else: desc, w, h = LOGO[1], LOGO[2], LOGO[3]; prompt = f"pixel art {desc}, {ICON_SUF}"
    data = fetch(prompt, w, h, seed_for(id, seed_extra))
    if not data: return id, False
    raw.write_bytes(data); return id, True

def post(kind, id):
    raw = RAW / f"{id}.jpg"
    if not raw.exists(): return
    if kind == "icon": keyout(raw, ICONS / f"{id}.webp", 512 if id.startswith("dealer_") else 256)
    elif kind == "logo": keyout(raw, GEN / "logo.webp", 640, square=False)
    else:
        im = Image.open(raw).convert("RGB"); w, h = im.size
        if w > 1280: im = im.resize((1280, round(h * 1280 / w)), Image.LANCZOS)
        im.save(GEN / f"{id}.webp", "WEBP", quality=84, method=6)

def manifest():
    have = sorted(p.stem for p in ICONS.glob("*.webp")); scenes = sorted(p.stem for p in GEN.glob("*.webp"))
    (ROOT / "assets" / "manifest.json").write_text(json.dumps({"icons": have, "gen": scenes}))

if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    seed_extra = int(sys.argv[sys.argv.index("--seed") + 1]) if "--seed" in sys.argv else 0
    if seed_extra: args = [a for a in args if a != str(seed_extra)]
    allids = [("icon", i) for i in I] + [("scene", s) for s in S] + [("logo", "logo")]
    if "--list" in sys.argv: print("\n".join(f"{k}:{i}" for k, i in allids)); sys.exit()
    if "--post" not in sys.argv:
        if not KEY: sys.exit("Falta POLLINATIONS_KEY en .env.local")
        todo = [(k, i) for k, i in allids if (i in args) or (not args and not (RAW / f"{i}.jpg").exists())]
        print(len(todo), "por generar")
        with cf.ThreadPoolExecutor(3) as ex:
            futs = {ex.submit(job, k, i, seed_extra): (k, i) for k, i in todo}
            for f in cf.as_completed(futs):
                k, i = futs[f]; ok = f.result()[1]; print("ok" if ok else "FALLO", i, flush=True)
                if ok: post(k, i)
    else:
        for k, i in allids: post(k, i)
    manifest(); print("manifiesto actualizado")
