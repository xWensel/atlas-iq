import json, re, os
os.chdir(r"C:\Code\DoYouKnow\atlas-iq")
LANGS = ["es", "en", "fr", "pt", "de", "it"]
src = open('data/places.js', encoding='utf8').read()
head, body = src.split('window.AIQ.PLACES = ', 1)
arr = json.loads(body[:body.index(']];') + 2])
ids = [p[0] for p in arr]

ABBR = set("""a.c d.c a.m p.m st sta sto dr dra sr sra mr mrs ms mt vs etc no núm n.º fig cf ca c s ss pp p vol ed eds jr gen col cap lt sgt prof pág págs ud uds av avda dept est ex approx inc ltd co corp u.s u.k e.g i.e mme mlle dott ing avv sig sigg fr fra""".split())

def sentences(t):
    t = re.sub(r'\s+', ' ', t).strip(); out = []; start = 0
    for m in re.finditer(r'[.!?…]["»”)]?(?=\s+["«“¿¡(]?[A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÄËÏÖÜÑÇÅØÆŒÐÞ0-9])', t):
        w = re.search(r"([\wÀ-ÿ\.]+)$", t[start:m.start()])
        tok = (w.group(1) if w else "").lower().strip('.')
        if len(tok) <= 1 or tok in ABBR or re.fullmatch(r'(\w\.)+\w?', (w.group(1) if w else "").lower()): continue
        out.append(t[start:m.end()].strip()); start = m.end()
    rest = t[start:].strip()
    if rest: out.append(rest)
    return out

# palabras que anuncian algo caracteristico (superlativos, records, fama, fundacion, patrimonio...)
GOOD = {
 'es': r'más|mayor|mayores|menor|primer[oa]?|único|única|antigu|famos|conocid|célebre|símbolo|emblem|patrimonio|unesco|record|récord|declarad|construi|fundad|erigid|inaugur|destac|sede de|se celebra|alberga|cuna|epicentro|considerad|apodad|llamad',
 'en': r'most|largest|biggest|smallest|highest|tallest|longest|deepest|oldest|first|only|famous|known|renowned|iconic|symbol|unesco|world heritage|record|built|founded|constructed|erected|opened|home to|hosts|birthplace|nicknamed|called|considered|named after',
 'fr': r'plus|premier|première|seul|unique|ancien|célèbre|connu|symbole|emblème|patrimoine|unesco|record|construit|fondé|édifié|inauguré|abrite|berceau|surnomm|considér|nommé',
 'pt': r'mais|maior|maiores|menor|primeir[oa]|único|única|antig|famos|conhecid|célebre|símbolo|emblem|patrimônio|património|unesco|recorde|construíd|fundad|erguid|inaugurad|abriga|berço|apelidad|considerad',
 'de': r'größte|größter|größten|höchste|höchster|älteste|ältester|erste|erster|einzige|berühmt|bekannt|symbol|wahrzeichen|unesco|welterbe|rekord|erbaut|gegründet|errichtet|eröffnet|beherbergt|geburtsort|genannt|gilt als',
 'it': r'più|maggior|primo|prima|unico|unica|antic|famos|conosciut|celebre|simbolo|emblema|patrimonio|unesco|record|costruit|fondat|eretto|inaugurat|ospita|culla|soprannomin|considerat',
}
GENERIC = {
 'es': r'^[^.]{0,70}?\b(es|fue|son) (una? |la |el |los |las )?(capital|ciudad|localidad|municipio|comuna|población|país|región|estado|provincia|isla|monte|montaña|río|lago|mar|océano|estrecho|batalla|monumento|edificio|templo|castillo)\b',
 'en': r'^[^.]{0,70}?\b(is|was|are) (an? |the )?(capital|city|town|municipality|commune|country|region|state|province|island|mountain|river|lake|sea|ocean|strait|battle|monument|building|temple|castle)\b',
 'fr': r'^[^.]{0,70}?\b(est|était|sont) (une? |la |le |les |l\')?(capitale|ville|commune|localité|pays|région|état|province|île|mont|montagne|fleuve|lac|mer|océan|détroit|bataille|monument|bâtiment|temple|château)\b',
 'pt': r'^[^.]{0,70}?\b(é|foi|são) (uma? |a |o |os |as )?(capital|cidade|município|localidade|país|região|estado|província|ilha|monte|montanha|rio|lago|mar|oceano|estreito|batalha|monumento|edifício|templo|castelo)\b',
 'de': r'^[^.]{0,70}?\b(ist|war|sind) (eine?n? |die |der |das )?(hauptstadt|stadt|gemeinde|ort|land|region|staat|provinz|insel|berg|fluss|see|meer|ozean|meerenge|schlacht|denkmal|gebäude|tempel|burg)\b',
 'it': r'^[^.]{0,70}?\b(è|era|sono) (una? |la |il |lo |i |le |l\')?(capitale|città|comune|località|paese|regione|stato|provincia|isola|monte|montagna|fiume|lago|mare|oceano|stretto|battaglia|monumento|edificio|tempio|castello)\b',
}

def score(s, i, lang):
    sc = 0.0
    years = re.findall(r'\b(?:1[0-9]{3}|20[0-2][0-9]|[1-9][0-9]{2})\b', s)
    sc += min(4, 1.6 * len(years))
    sc += min(2.5, 0.9 * len(re.findall(r'\d', s)) / 4) if not years else 0
    sc += min(4.5, 1.5 * len(re.findall(GOOD[lang], s, re.I)))
    if re.search(GENERIC[lang], s, re.I): sc -= 3.5
    L = len(s)
    if L < 45: sc -= 2.5
    if len(re.findall(r'[ɐ-˿Ͱ-῿⺀-￿]', s)) >= 2: sc -= 4
    if s.count(';') >= 3: sc -= 2
    if s.count('(') >= 3: sc -= 1.5
    if L > 300: sc -= 1.5
    if 1 <= i <= 3: sc += 0.8
    if i == 0: sc -= 1.0
    # nombres propios (mayusculas a mitad de frase): dan concrecion
    caps = len(re.findall(r'(?<=[a-zà-ÿ,] )[A-ZÀ-Ý][\wà-ÿ]{2,}', s)); sc += min(2, 0.5 * caps)
    return sc

def clip(s, lim=300):
    if len(s) <= lim: return s
    cut = s[:lim]; k = max(cut.rfind(', '), cut.rfind('; '), cut.rfind(' — '), cut.rfind(': '))
    if k < 100: k = cut.rfind(' ')
    return cut[:k].rstrip(' ,;:—') + '.'

for l in LANGS:
    W = json.load(open(f'data/wiki/{l}.json', encoding='utf8'))
    E = json.load(open('data/wiki/en.json', encoding='utf8')) if l != 'en' else W
    out = {}; picked_first = 0
    for i in ids:
        r = W.get(i) or E.get(i)
        if not r: continue
        lg = l if W.get(i) else 'en'
        x = re.sub('[\u200b-\u200f\u2060\ufeff]', '', r[2] or '')
        ss = sentences(x)
        d = r[1] or ''
        if ss:
            best = max(range(len(ss)), key=lambda k: score(ss[k], k, lg))
            if best == 0: picked_first += 1
            first = clip(ss[best])
        else: first = ''
        t = ((d[0].upper() + d[1:] + '. ') if d else '') + first
        if t.strip(): out[i] = t.strip()
    json.dump(out, open(f'data/wiki/{l}-s.json', 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
    print(l, len(out), 'primera frase elegida', picked_first)
