#!/usr/bin/env python3
"""brief.json -> plan.json. The model designs; this script paints in the originals' manner.

There are no preset palettes and no catalogue of ready-made subjects. The brief states
  * colours  : the request's own colours (air, ground, life, accent, light), any hues;
               they are lifted into the originals' clean high-key register, never replaced;
  * things   : every thing the request names, described by FORM (its build and parts)
               and MATERIAL, not picked from a list of nouns.
The script supplies the painting method: wet bands, organic shapes, volume by same-hue
light/shadow, colonies of small marks, staged reveal, light only where a source exists.

  python3 compose.py brief.json --out plan.json
  python3 compose.py --forms        # what each form needs (structure, not subjects)

Coordinates 0-1, x right, y down. `at` is where a thing stands (its base), `size` its height.
"""
import argparse, colorsys, json, math, random, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from validate_scene import check_v4


# ------------------------------------------------------------------ colour
def hexrgb(h): return [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
def rgbhex(r): return '#' + ''.join(f'{round(max(0, min(1, c)) * 255):02x}' for c in r)
def hls(h): return colorsys.rgb_to_hls(*hexrgb(h))
def from_hls(h, l, s): return rgbhex(colorsys.hls_to_rgb(h % 1, max(0, min(1, l)), max(0, min(1, s))))
def shade(h, k):
    hh, l, s = hls(h); return from_hls(hh, l + k, s)
def toneish(h, dl):
    hh, l, s = hls(h); return from_hls(hh, l + dl, s + .05)
def mix(a, b, t): return rgbhex([x * (1 - t) + y * t for x, y in zip(hexrgb(a), hexrgb(b))])
def clamp(v, lo, hi): return max(lo, min(hi, v))
def lift(h, l_lo, l_hi, s_lo, s_hi):
    """Keep the hue the model chose; bring lightness and saturation into the register a role has in the originals."""
    hh, l, s = hls(h); return from_hls(hh, clamp(l, l_lo, l_hi), clamp(s, s_lo, s_hi))


# ------------------------------------------------------------------ pigments
# Measured from the 186 colours of the twelve originals: no earth tones, no greys,
# and every dark (L < .35) is cool (deep green 104-170 deg, deep blue/indigo/violet 196-253).
# Brown under a transparent blue wash is what turns a picture grey and dirty, so every
# colour that reaches a stroke goes through pigment() first.
def hue_deg(h): return hls(h)[0] * 360


def cool_hue_of(palette_or_colours):
    """The scene's own cool hue (for tinted greys and inky darks), else indigo."""
    for h in palette_or_colours:
        if isinstance(h, str) and h.startswith('#') and 100 <= hue_deg(h) <= 260 and hls(h)[2] > .08: return hls(h)[0]
    return 225 / 360


def pigment(h, cool=225 / 360, grey=240 / 360):
    if not (isinstance(h, str) and len(h) == 7 and h.startswith('#')): return h
    hh, l, s = hls(h); deg = hh * 360
    if l > .94: return h                                   # paper and near-white highlights stay
    if s < .12:                                            # grey -> light greys take the sky's tint; dark greys (trunks,
        hh, s = (grey, max(s, .22)) if l >= .5 else (cool, max(s, .24))   # stones in shade) the scene's own deep green or blue
    elif 10 <= deg <= 60 and s < .55 and l < .76:          # earth: tan/beige -> apricot/butter, brown -> terracotta/caramel
        if l >= .5: s, l = max(s, .55), max(l, .72)
        else: s, l = max(s, .5), max(l, .52)
    if .3 <= l <= .8 and s < .3:                           # a muted middle tone paints as grey: give it colour
        s = .3
    if l < .35:                                            # darks are cool and never inky-black
        deg = hh * 360
        if (deg < 55 or deg >= 320) and s >= .45:          # a rich warm dark (a mouth, a red lacquer) keeps its hue
            return from_hls(hh, .38, min(s, .75))
        if 55 <= deg < 100: hh = 125 / 360                 # olive shadow -> deep green, as in the originals
        elif not (100 <= deg <= 310): hh = cool
        s, l = clamp(s, .2, .55), max(l, .2)
    return from_hls(hh, l, s)


def hmix(a, b, t):
    """Blend through hue, not through RGB: two complementary colours meet in a clean colour, never in grey."""
    (h1, l1, s1), (h2, l2, s2) = hls(a), hls(b)
    if s1 < .05: h1 = h2
    if s2 < .05: h2 = h1
    dh = ((h2 - h1 + .5) % 1) - .5
    return from_hls((h1 + dh * t) % 1, l1 + (l2 - l1) * t, s1 + (s2 - s1) * t)


COLOUR_FIELDS = ('color', 'deep', 'pale', 'shade')


def clean_plan(plan):
    """Run every colour of a plan (palette and strokes) through pigment(). Works on old plans too."""
    pal = plan.get('palette', {})
    flat = [c for v in pal.values() for c in (v if isinstance(v, list) else [v])]
    # darks and dark greys: the scene's own deep plant colour (the originals' trunks are deep green), kept clean
    deep = (pal.get('foliage') or [None, None, None])[min(2, len(pal.get('foliage') or []) - 1)] if pal.get('foliage') else None
    cool = hls(deep)[0] if isinstance(deep, str) and deep.startswith('#') and hls(deep)[2] > .1 else cool_hue_of([*pal.get('washes', []), *flat])
    if 55 / 360 <= cool < 100 / 360: cool = 125 / 360
    elif not (100 / 360 <= cool <= 310 / 360): cool = 225 / 360
    grey = cool_hue_of([*pal.get('washes', []), '#8f8fc4'])                        # tinted greys: the sky, else lavender
    paint = lambda c: pigment(c, cool, grey)
    for key, value in list(pal.items()):
        pal[key] = [paint(c) for c in value] if isinstance(value, list) else paint(value)

    def walk(node):
        if isinstance(node, dict):
            for k, v in node.items():
                if k in COLOUR_FIELDS and isinstance(v, str): node[k] = paint(v)
                elif k == 'colors' and isinstance(v, list): node[k] = [paint(x) if isinstance(x, str) else x for x in v]
                elif k == 'accents' and isinstance(v, list): node[k] = [paint(x) if isinstance(x, str) else x for x in v]
                else: walk(v)
        elif isinstance(node, list):
            for v in node: walk(v)
    walk(plan.get('strokes', []))
    # The originals are high-key: the big colour fields (bands, base wash, the wash roles)
    # sit at L >= .74 even at dusk. Darks belong to subjects, not to the ground they stand on.
    def airy(h):
        if not (isinstance(h, str) and h.startswith('#')): return h
        hh, l, s = hls(h)
        if s < .25 and l < .74: return from_hls(hh, .74, max(s, .3))      # a dull field becomes a clear high-key wash
        if s < .4 and l < .64: return from_hls(hh, .64, s + .1)          # a dusky one clears but keeps some depth
        return h                                                         # a deep, clear sea or forest stays as it is
    pal['washes'] = [airy(c) for c in pal.get('washes', [])]
    for op in plan.get('strokes', []):
        if op.get('type') in ('band', 'wash'): op['color'] = airy(op.get('color'))
    # A pale veil (glow, mist, window light) should lighten what is under it, not tint it:
    # warm light over a cool wash is the other way a picture turns grey.
    for op in plan.get('strokes', []):
        if op.get('type') == 'blob' and isinstance(op.get('color'), str) and op['color'].startswith('#'):
            hh, l, s = hls(op['color'])
            if l >= .82: op['color'] = from_hls(hh, max(l, .93), min(s, .6))
    return plan


def companion(h):
    """The sky's second colour: cool skies lean toward violet, warm ones toward rose, a little deeper."""
    hh, l, s = hls(h); deg = hh * 360
    shift = 32 if 150 <= deg <= 260 else -28 if deg < 150 else 18
    return from_hls(((deg + shift) % 360) / 360, max(.66, l - .06), min(.42, s + .04))


def palette_from(colours):
    """Build the engine's colour roles from the brief's own colours. No named palettes exist."""
    need = [k for k in ('air', 'ground', 'life', 'accent') if not str(colours.get(k, '')).startswith('#')]
    if need: raise ValueError(f'colours needs {need} as #RRGGBB, chosen from the request\'s world and mood (any hue)')
    air = lift(colours['air'], .72, .9, .16, .4); ground = lift(colours['ground'], .55, .92, .16, .46)
    life = lift(colours['life'], .3, .62, .18, .6); acc = lift(colours['accent'], .45, .66, .45, .92)
    light = lift(colours.get('light', '#fff3d9'), .86, .97, .2, 1)
    ha, la, sa = hls(acc)
    paper = colours.get('paper') or mix('#f6f1e8', air, .08)
    return {'ground': paper,
            'washes': [air, companion(air), hmix(air, ground, .5), ground],
            'foliage': [life, toneish(life, .1), toneish(life, -.14), lift(mix(life, light, .45), .7, .85, .25, .55)],
            'accents': [from_hls(ha, la + .12, sa), acc, from_hls(ha, la - .12, sa), from_hls(ha, .88, sa * .7)],
            'highlights': [light, mix(light, '#ffffff', .6)]}


# ------------------------------------------------------------------ geometry helpers
def ell(cx, cy, rx, ry, n=18, a0=0.0):
    return [[round(cx + rx * math.cos(a0 + 2 * math.pi * i / n), 4), round(cy + ry * math.sin(a0 + 2 * math.pi * i / n), 4)] for i in range(n)]
def r4(v): return round(v, 4)


def petal(cx, cy, rx, ry, rot, n=14):
    """Leaf/petal outline pointed at +rx (the originals' petalPts)."""
    pts = []
    for i in range(n):
        a = 2 * math.pi * i / n; cc = math.cos(a)
        px = rx * cc; py = ry * math.sin(a) * math.sqrt(max(0, 1 - .9 * cc)) / 1.1
        pts.append([r4(cx + px * math.cos(rot) - py * math.sin(rot)), r4(cy + px * math.sin(rot) + py * math.cos(rot))])
    return pts


def outline(P, spec, n=6):
    """Smooth closed outline through (u, v) control points (Catmull-Rom): no ruler edges."""
    pts = []; k = len(spec)
    for i in range(k):
        p0, p1, p2, p3 = spec[i - 1], spec[i], spec[(i + 1) % k], spec[(i + 2) % k]
        for j in range(n):
            s = j / n; s2 = s * s; s3 = s2 * s
            u = .5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * s + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * s2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * s3)
            v = .5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * s + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * s2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * s3)
            pts.append(P(u, v))
    return pts


def frame_of(x, y, s, f):
    """P(u, v): u forward in the facing direction, v up, in units of `size`."""
    return lambda u, v: [r4(x + u * s * f), r4(y - v * s)]


def limb(P, a, b, w0, w1, n=3):
    """A tapered limb from a to b (u, v) with widths w0 -> w1: a soft shape, never a stick."""
    (ax, ay), (bx, by) = a, b; L = math.hypot(bx - ax, by - ay) or 1; nx, ny = -(by - ay) / L, (bx - ax) / L
    s1 = [(ax + nx * w0, ay + ny * w0), ((ax + bx) / 2 + nx * (w0 + w1) * .53, (ay + by) / 2 + ny * (w0 + w1) * .53), (bx + nx * w1, by + ny * w1)]
    s2 = [(bx - nx * w1, by - ny * w1), ((ax + bx) / 2 - nx * (w0 + w1) * .53, (ay + by) / 2 - ny * (w0 + w1) * .53), (ax - nx * w0, ay - ny * w0)]
    return outline(P, s1 + s2, n)


# ------------------------------------------------------------------ context
class Ctx:
    def __init__(self, brief, palette):
        self.brief = brief; self.palette = palette; self.ops = []; self.n = 0
        self.rng = random.Random(brief.get('seed', 1))
        lt = brief.get('light') or {}
        src = lt.get('from') or [lt.get('x', .7), lt.get('y', .25)]
        self.light = (src[0], src[1]); self.sources = []; self.cur_light = None
    def add(self, op, pace=None, label=None):
        self.n += 1; op = dict(op); op['id'] = op.get('id') or f"{op['type']}-{self.n:03d}"
        if pace is not None: op['pace'] = pace
        if label: op['label'] = label
        if op['type'] == 'line' and isinstance(op.get('weight'), (int, float)): op['weight'] = round(max(.3, min(8, op['weight'])), 2)
        if op['type'] in ('shape', 'body') and 'light' not in op and self.cur_light: op['light'] = self.cur_light
        self.ops.append(op); return op
    def col(self, v, default):
        """A thing's colour: its own hex, or a role reference, lifted only into the paint's range."""
        v = v or default
        return v if not (isinstance(v, str) and v.startswith('#')) else lift(v, .08, .95, 0, .95)
    def hexof(self, v):
        if isinstance(v, str) and v.startswith('#'): return v
        if v == 'ground': return self.palette['ground']
        role, _, idx = str(v).partition('.'); lst = self.palette.get(role) or ['#888888']
        return lst[min(int(idx or 0), len(lst) - 1)]
    def lit_path(self):
        x, y = self.light; return {'path': [[x - .02, y], [x + .02, y]], 'reach': .35, 'colors': ['highlights.0', 'highlights.1']}


def need(p, *keys):
    miss = [k for k in keys if k not in p]
    if miss: raise KeyError(', '.join(miss))


def xy(p):
    need(p, 'at'); return p['at'][0], p['at'][1]


# ------------------------------------------------------------------ space
def space_base(c, sp):
    view = sp.get('view', 'eye'); hz = sp.get('horizon', .55); label = sp.get('label', '铺开底色…')
    if sp.get('layers'):
        bands = [{'y0': L['from'], 'y1': L['to'], 'color': c.col(L.get('colour'), 'washes.0')} for L in sp['layers']]
    elif view == 'interior':
        bands = [{'y0': -.02, 'y1': hz + .04, 'color': 'washes.1'}, {'y0': hz - .02, 'y1': 1.02, 'color': 'washes.3', 'wobble': .012}]
    elif view == 'top':
        bands = [{'y0': -.02, 'y1': .55, 'color': 'washes.3'}, {'y0': .45, 'y1': 1.02, 'color': 'washes.2'}]
    elif view == 'underwater':
        bands = [{'y0': -.02, 'y1': .5, 'color': 'washes.0'}, {'y0': .4, 'y1': 1.02, 'color': 'washes.1'}]
    else:
        bands = [{'y0': -.02, 'y1': hz * .62, 'color': 'washes.1'}, {'y0': hz * .45, 'y1': hz + .04, 'color': 'washes.0'},
                 {'y0': hz - .02, 'y1': hz + (1 - hz) * .55, 'color': 'washes.2'}, {'y0': hz + (1 - hz) * .45, 'y1': 1.02, 'color': 'washes.3'}]
    L = lambda b: hls(c.hexof(b['color']))[1]
    if L(bands[-1]) > L(bands[0]) + .08:  # light ground under a darker sky (snow, sand): light first, translucent paint cannot cover dark
        base = max(bands, key=L)['color']; order = sorted(bands, key=lambda b: -L(b))
    else:  # the largest band is the colour of the whole picture
        base = max(bands, key=lambda b: b['y1'] - b['y0'])['color']; order = bands
    c.add({'type': 'wash', 'color': base}, label=label)
    for b in order: c.add({'type': 'band', **b})
    if view in ('interior', 'top'):  # a table, floor or cloth is never one flat colour in the originals: soft surface marks in its own tones
        g = c.hexof('washes.3'); y0 = (hz if view == 'interior' else 0)
        c.add({'type': 'marks', 'area': {'box': [0, r4(y0), 1, 1], 'bias': .8}, 'count': 120, 'size': [.002, .0045], 'aspect': [3, 5], 'rotation': 0, 'spin': .08, 'depth': view == 'interior',
               'colors': [toneish(g, .06), toneish(g, -.06), toneish(g, .12), 'washes.2'], 'opacity': [90, 160], 'batch': 10}, pace=.6)
    if 'sunlight' in c.brief.get('air', []) and view == 'interior':  # cool shade away from the window, so the sun has something to be brighter than
        lx, _ = c.light; room = c.hexof('washes.1')
        shadow = shade(mix(room, '#8f8fc4', .45), -.08)
        c.add({'type': 'blob', 'x': round(1 - lx, 3), 'y': .62, 'rx': .62, 'ry': .5, 'color': shadow, 'opacity': 120, 'bleed': .75, 'texture': .2}, pace=.8)
        c.add({'type': 'blob', 'x': .5, 'y': 1.0, 'rx': .8, 'ry': .22, 'color': shadow, 'opacity': 120, 'bleed': .75, 'texture': .2}, pace=.6)
    lt = c.brief.get('light') or {}
    if lt.get('glow'):
        x, y = c.light; r = min(.2, lt.get('spread', .16))
        c.add({'type': 'blob', 'x': x, 'y': y, 'rx': r, 'ry': r * .7, 'color': 'highlights.1', 'opacity': 120, 'bleed': .7, 'texture': .5})
    n = sp.get('clouds')
    if n and view == 'eye' and hz >= .15:  # soft cumulus the Sail way, in the sky's own colour; never dashes
        sky = c.hexof(bands[0]['color']); sh, sl, ss = hls(sky); under = from_hls((sh + .1) % 1, max(.62, sl - .1), min(.3, ss + .05)); body = mix(c.hexof('highlights.1'), c.hexof('accents.3'), .55); crown = c.hexof('highlights.1')
        n = n if isinstance(n, int) and not isinstance(n, bool) else 2
        top = max(.12, hz * .62)
        for cx, cy in [(.2, .16), (.66, .12), (.86, .26), (.4, .3)][:max(1, min(4, n))]:
            cy = min(cy, top - .06); rx, ry = c.rng.uniform(.17, .25), c.rng.uniform(.06, .09)
            c.add({'type': 'blob', 'x': cx, 'y': r4(cy + ry * .35), 'rx': rx, 'ry': r4(ry * .75), 'color': under, 'opacity': 165, 'bleed': .55, 'texture': .5}, pace=.7)
            c.add({'type': 'blob', 'x': cx, 'y': cy, 'rx': r4(rx * .95), 'ry': ry, 'color': body, 'opacity': 205, 'bleed': .5, 'texture': .5}, pace=.8)
            for k in (-1, 1):  # puffs either side make a cluster, not a single pill
                c.add({'type': 'blob', 'x': r4(cx + k * rx * c.rng.uniform(.55, .8)), 'y': r4(cy + ry * c.rng.uniform(-.1, .4)), 'rx': r4(rx * c.rng.uniform(.4, .55)), 'ry': r4(ry * c.rng.uniform(.6, .85)),
                       'color': under if k > 0 else body, 'opacity': 170, 'bleed': .55, 'texture': .5}, pace=.4)
            c.add({'type': 'blob', 'x': r4(cx - rx * .2), 'y': r4(cy - ry * .45), 'rx': r4(rx * .55), 'ry': r4(ry * .55), 'color': crown, 'opacity': 170, 'bleed': .5, 'texture': .5}, pace=.6)
        for _ in range(2):
            c.add({'type': 'blob', 'x': r4(c.rng.uniform(.15, .85)), 'y': r4(top * c.rng.uniform(.75, .95)), 'rx': r4(c.rng.uniform(.1, .18)), 'ry': .015, 'color': under, 'opacity': 100, 'bleed': .6}, pace=.4)


# ------------------------------------------------------------------ material: how a surface is painted
def material_marks(c, poly, colour, material, size, flow=None, markings=None, along=None):
    """Surface texture follows what the thing is made of, in the thing's own hue."""
    base = c.hexof(colour) if not str(colour).startswith('#') else colour
    tones = [toneish(base, .08), toneish(base, -.06), base, toneish(base, .14)]
    m = material or 'plain'
    spec = {'fur': dict(count=int(18 + 90 * size), size=[.002, .0035], aspect=[2.4, 3.4], petal=True, rotation=along if along is not None else 0, spin=.3, opacity=[100, 170]),
            'feather': dict(count=int(18 + 90 * size), size=[.003, .005], aspect=[1.8, 2.4], petal=True),
            'scale': dict(count=int(18 + 80 * size), size=[.002, .0035], aspect=[1.2, 1.5]),
            'cloth': dict(count=int(10 + 50 * size), size=[.002, .0035], aspect=[3, 5], rotation=1.5, spin=.12, petal=True),
            'stone': dict(count=int(30 + 120 * size), size=[.003, .005], aspect=[1.6, 2.4], rotation=0),
            'wood': dict(count=int(14 + 60 * size), size=[.002, .0035], aspect=[4, 7], rotation=1.57, spin=.06),
            'leaf': dict(count=int(40 + 200 * size), size=[.005, .009], aspect=[2.2, 3], petal=True),
            'ceramic': dict(count=6, size=[.002, .004]), 'glass': dict(count=5, size=[.002, .004]), 'metal': dict(count=5, size=[.002, .004]),
            'wicker': dict(count=int(30 + 120 * size), size=[.002, .0035], aspect=[3, 4], rotation=0, spin=.5)}.get(m)
    if spec:
        op = {'type': 'marks', 'area': {'polygon': poly}, 'colors': tones if m not in ('ceramic', 'glass', 'metal') else ['highlights.1', '#ffffff'], 'opacity': [120, 200], 'batch': 6}; op.update(spec)
        if flow: op['flow'] = flow
        c.add(op, pace=1.0)
    if markings and markings.get('colour'):
        mc = c.col(markings['colour'], 'foliage.2'); pat = markings.get('pattern', 'stripes')
        shape = {'stripes': dict(aspect=[3, 4.5], size=[.0028, .0045], rotation=1.4, spin=.25), 'spots': dict(aspect=[1, 1.3], size=[.0015, .003]),
                 'patch': dict(aspect=[1.2, 1.6], size=[.01, .02])}.get(pat, dict(aspect=[1, 1.5], size=[.003, .006]))
        c.add({'type': 'marks', 'area': {'polygon': poly}, 'count': {'patch': 4}.get(pat, int(20 + 60 * size)), 'colors': [mc, toneish(mc, .06)], 'opacity': [170, 235], 'batch': 4, 'petal': pat == 'stripes', **shape}, pace=1.0)


# ------------------------------------------------------------------ forms
def f_figure(c, p):
    """A person (or any upright being): proportions follow the pose; clothes, hair, headwear, held thing."""
    x, y = xy(p); s = p.get('size', .35); f = -1 if p.get('facing') == 'left' else 1; P = frame_of(x, y, s, f)
    cl = p.get('clothes', {}); upper = c.col(cl.get('upper') or p.get('colour'), 'accents.1'); lower = c.col(cl.get('lower'), upper if cl.get('length') == 'long' else 'washes.3')
    skin = c.col(p.get('skin'), '#f0c8a6'); hr = p.get('hair', {}); hair = c.col(hr.get('colour'), '#3a2c28'); style = hr.get('style', 'short')
    pose = p.get('pose', 'stand'); holds = p.get('holds') or {}; head = p.get('headwear') or {}
    if s < .12:  # far away: a few strokes, like the two people in the originals' sailboat
        c.add({'type': 'shape', 'points': outline(P, [(-.12, .02), (-.1, .45), (0, .78), (.1, .45), (.12, .02)], 4), 'color': upper, 'opacity': 240, 'flat': True}, pace=.8)
        c.add({'type': 'shape', 'points': ell(*P(0, .88), s * .09, s * .1, 10), 'color': skin, 'opacity': 245, 'flat': True}, pace=.5)
        if holds.get('shape') == 'canopy':
            c.add({'type': 'shape', 'points': outline(P, [(-.32, 1.02), (0, 1.22), (.32, 1.02), (0, 1.06)], 4), 'color': c.col(holds.get('colour'), 'highlights.1'), 'opacity': 230, 'flat': True}, pace=.5)
        return
    big = s >= .45; hip = .4 if pose == 'sit' else (.5 if big else .42); ch = c.hexof(upper); dk = shade(ch, -.08)
    if p.get('seat'):  # what they sit on, under them
        wood = c.col(p['seat'], '#5a3428')
        c.add({'type': 'line', 'points': [P(-.2, .02), P(-.2, .62)], 'color': wood, 'weight': 3.5}, pace=.5)
        c.add({'type': 'shape', 'points': outline(P, [(-.24, hip - .02), (.2, hip - .02), (.2, hip - .07), (-.24, hip - .07)], 3), 'color': wood, 'opacity': 240, 'flat': True}, pace=.5)
        c.add({'type': 'line', 'points': [P(.17, .02), P(.17, hip - .05)], 'color': wood, 'weight': 3}, pace=.4)
    if cl.get('over'):  # shawl, cape or cloak falling behind the body
        c.add({'type': 'shape', 'points': outline(P, [(-.12, .78), (-.3, .5), (-.42, .15), (-.46, 0), (-.05, 0), (-.08, .4), (-.02, .74)], 5), 'color': c.col(cl['over'], 'accents.3'), 'opacity': 236}, pace=1.1)
    if cl.get('length') == 'long':
        skirt = outline(P, [(-.14, hip + .05), (.16, hip + .06), (.3, hip - .04), (.3, .12), (.36, 0), (-.2, 0), (-.16, .2)], 5)
        c.add({'type': 'shape', 'points': skirt, 'color': lower, 'opacity': 245}, pace=1.4)
        if cl.get('pattern'): material_marks(c, skirt, lower, None, s, markings={'colour': cl['pattern'], 'pattern': 'spots'})
    else:
        legs = {'walk': [((-.03, hip), (-.15, .02)), ((.03, hip), (.13, .02))], 'sit': [((0, hip), (.22, hip - .02)), ((.22, hip - .02), (.24, .02))]}.get(pose, [((-.035, hip), (-.045, .02)), ((.035, hip), (.045, .02))])
        for a, b in legs:
            c.add({'type': 'shape', 'points': limb(P, a, b, .05, .035), 'color': lower, 'opacity': 245, 'flat': True}, pace=1.0)
            if not (pose == 'sit' and a[1] > .2 and b[1] > .2):
                c.add({'type': 'shape', 'points': petal(*P(b[0] + .03, b[1] - .005), s * .05, s * .022, 0 if f > 0 else math.pi, 10), 'color': c.col(p.get('shoes'), '#4a3e3c'), 'opacity': 245, 'flat': True}, pace=.4)
    hem = hip - .04 if cl.get('length') != 'long' else hip
    torso = outline(P, [(-.02, .82), (-.13, .77), (-.15, .6), (-.17, hem), (0, hem - .02), (.17, hem), (.15, .6), (.13, .77), (.04, .82)], 4)
    c.add({'type': 'shape', 'points': torso, 'color': upper, 'opacity': 245}, pace=1.4)
    material_marks(c, torso, upper, 'cloth', s, markings={'colour': cl['pattern'], 'pattern': 'spots'} if cl.get('pattern') else None)
    hand = (.14, .62) if holds.get('shape') == 'canopy' else ((.13, hip + .04) if pose == 'sit' else (.11, .46))
    for k, sh in enumerate(((-.1, .76), (.1, .76))):
        el = (sh[0] + .03, .6)
        c.add({'type': 'shape', 'points': limb(P, sh, el, .042, .036), 'color': upper if k else dk, 'opacity': 245, 'flat': True}, pace=.7)
        c.add({'type': 'shape', 'points': limb(P, el, hand, .036, .03), 'color': upper if k else dk, 'opacity': 245, 'flat': True}, pace=.7)
    c.add({'type': 'shape', 'points': ell(*P(hand[0] + .02, hand[1]), s * .032, s * .026, 12), 'color': skin, 'opacity': 245, 'flat': True}, pace=.4)
    c.add({'type': 'shape', 'points': outline(P, [(-.025, .79), (.035, .79), (.03, .85), (-.02, .85)], 3), 'color': shade(skin, -.06), 'opacity': 245, 'flat': True}, pace=.4)
    if style == 'long': c.add({'type': 'shape', 'points': outline(P, [(-.09, .93), (-.12, .78), (-.1, .66), (-.02, .72), (0, .86)], 4), 'color': hair, 'opacity': 245, 'flat': True}, pace=.7)
    if style == 'bun': c.add({'type': 'shape', 'points': ell(*P(-.06, .95), s * .05, s * .045, 14), 'color': hair, 'opacity': 248, 'flat': True}, pace=.6)
    # a calm profile turned toward the facing side; no painted eyes or mouth (they read as masks here)
    headpts = outline(P, [(-.055, .885), (-.04, .955), (.01, .99), (.06, .975), (.078, .935), (.083, .91), (.098, .893), (.084, .884), (.087, .868), (.08, .858), (.07, .842), (.035, .826), (-.01, .832), (-.04, .85)], 3)
    c.add({'type': 'shape', 'points': headpts, 'color': skin, 'opacity': 248, 'flat': True}, pace=1.1)
    c.add({'type': 'shape', 'points': outline(P, [(-.05, .87), (-.035, .835), (0, .832), (.01, .87), (-.01, .93), (-.04, .93)], 3), 'color': toneish(skin, -.07), 'opacity': 140, 'flat': True}, pace=.3)
    c.add({'type': 'shape', 'points': outline(P, [(-.062, .875), (-.058, .955), (-.02, 1.0), (.04, 1.003), (.075, .975), (.062, .955), (.03, .96), (.0, .94), (-.02, .9), (-.035, .87)], 4), 'color': hair, 'opacity': 248, 'flat': True}, pace=.9)
    if head.get('shape') == 'crown':
        cx, cy = P(0, 1.0); cc = c.col(head.get('colour'), '#d9b25a')
        c.add({'type': 'marks', 'area': {'x': cx, 'y': r4(cy - s * .01), 'rx': s * .07, 'ry': s * .035}, 'count': 50, 'size': [.002, .004], 'aspect': [1.5, 2.5], 'petal': True,
               'flow': {'fan': [cx, r4(cy + s * .03)]}, 'colors': [cc, toneish(cc, .1), toneish(cc, -.1), '#fff6e2'], 'opacity': [190, 250], 'batch': 8}, pace=.8)
    elif head.get('shape') == 'hat':
        hc = c.col(head.get('colour'), 'accents.2')
        c.add({'type': 'shape', 'points': outline(P, [(-.12, .97), (-.05, 1.06), (.08, 1.07), (.15, .99), (.02, .975)], 4), 'color': hc, 'opacity': 245, 'flat': True}, pace=.6)
    if holds.get('shape') == 'canopy':  # umbrella / parasol
        uc = c.col(holds.get('colour'), 'highlights.1'); top = P(.14, 1.22)
        c.add({'type': 'line', 'points': [P(*hand), top], 'color': 'foliage.2', 'weight': 1.2}, pace=.6)
        dome = [P(.14 + .31 * math.cos(a), 1.08 + .18 * math.sin(a)) for a in [i * math.pi / 16 for i in range(17)]] + [P(.14 + .31 * math.cos(math.pi - i * math.pi / 8), 1.07 - .025 * (i % 2)) for i in range(9)]
        c.add({'type': 'shape', 'points': dome, 'color': uc, 'opacity': 215}, pace=1.1)
    elif holds.get('shape') == 'bunch':  # flowers in hand
        bx, by = P(hand[0] + .03, hand[1] + .04); bc = c.col(holds.get('colour'), 'accents.0')
        c.add({'type': 'flowers', 'kind': 'blossom', 'at': [[r4(bx + dx * s), r4(by + dy * s), s * .035] for dx, dy in ((0, 0), (.04, -.03), (-.03, -.02), (.02, .03))], 'accents': [bc]}, pace=.7)
    elif holds.get('shape') == 'rod':  # fishing rod, staff, brush
        c.add({'type': 'line', 'points': [P(*hand), P(hand[0] + .4, hand[1] + .35), P(hand[0] + .75, hand[1] + .45)], 'color': c.col(holds.get('colour'), 'foliage.2'), 'weight': 1, 'curvature': .5}, pace=.5)


def f_animal(c, p):
    """Any four-legged animal, built from its own proportions: body length, leg length, neck, head,
    ears, snout and tail. A cat, horse, fox, deer or rabbit differ only in what the brief says."""
    x, y = xy(p); s = p.get('size', .25); f = -1 if p.get('facing') == 'left' else 1; P = frame_of(x, y, s, f)
    b = p.get('build', {}); B = .55 + .55 * b.get('body', .5); Lg = .16 + .4 * b.get('legs', .4); N = .04 + .35 * b.get('neck', .2); Hd = .14 + .12 * b.get('head', .5)
    fur = c.col(p.get('colour'), 'accents.1'); fh = c.hexof(fur); dk = shade(fh, -.12); lt = shade(fh, .1); mat = p.get('material', 'fur')
    ears = p.get('ears', 'pointed'); tail = p.get('tail', 'thin'); snout = p.get('snout', 'short'); pose = p.get('pose', 'stand'); mk = p.get('markings') or {}
    if pose == 'face': return f_face(c, p)
    if s < .06:
        c.add({'type': 'shape', 'points': outline(P, [(-.3, .05), (-.25, .4), (.25, .45), (.3, .05)], 4), 'color': fur, 'opacity': 240, 'flat': True}, pace=.7)
        c.add({'type': 'shape', 'points': ell(*P(.3, .6), s * .14, s * .12, 10), 'color': lt, 'opacity': 245, 'flat': True}, pace=.5)
        return
    T = .2 + .12 * (1 - b.get('legs', .4))
    down = pose in ('graze', 'drink')   # head lowered to the ground or the water
    if pose in ('stand', 'walk', 'graze', 'drink'):
        ty = Lg + T / 2; body_c = P(0, ty)
        tail_root = (-B * .48, ty + T * .2)
        swing = .06 if pose == 'walk' else 0
        for k, (u, sw) in enumerate([(B * .3, swing), (-B * .32, -swing), (B * .36, -swing), (-B * .26, swing)]):  # far legs first, darker
            c.add({'type': 'shape', 'points': limb(P, (u, ty), (u + sw, .02), .05 - .012 * b.get('legs', .4), .028), 'color': dk if k < 2 else fur, 'opacity': 245, 'flat': True}, pace=.5)
        c.add({'type': 'body', 'x': body_c[0], 'y': body_c[1], 'length': B * s, 'width': T * s, 'angle': 0 if f > 0 else math.pi, 'color': fur, 'profile': [.75, .95, 1, 1, .98, .95, .88, .75]}, pace=1.3)
        neck_a = (B * .38, ty + T * .25); head_c = (B * .42 + N * .55, ty + T * .3 + N + Hd * .25)
        if down: neck_a = (B * .4, ty + T * .1); head_c = (B * .5 + N * .35 + Hd * .45, Hd * .45 + (.04 if pose == 'graze' else 0))
        body_poly = outline(P, [(-B * .48, ty), (-B * .3, ty + T * .48), (B * .3, ty + T * .48), (B * .5, ty), (B * .3, ty - T * .48), (-B * .3, ty - T * .48)], 3)
    elif pose == 'sit':
        tail_root = (-.22, .05)
        body_poly = outline(P, [(-.26, .01), (-.28, .2), (-.22, .4), (-.12, .54), (0, .6), (.13, .56), (.21, .42), (.25, .2), (.25, .01), (0, -.01)], 4)
        for u in (.08, .18):
            c.add({'type': 'shape', 'points': limb(P, (u, .45), (u + .01, .02), .04, .03), 'color': lt, 'opacity': 245, 'flat': True}, pace=.5)
        c.add({'type': 'shape', 'points': body_poly, 'color': fur, 'opacity': 242}, pace=1.3)
        neck_a = (.08, .55); head_c = (.15 + N * .2, .62 + N * .5 + Hd * .4)
    else:  # lie
        tail_root = (-.42, .12)
        body_poly = ell(*P(-.02, .18), s * .44, s * .18)
        c.add({'type': 'shape', 'points': body_poly, 'color': fur, 'opacity': 242}, pace=1.3)
        c.add({'type': 'shape', 'points': ell(*P(.42, .05), s * .14, s * .05), 'color': lt, 'opacity': 245, 'flat': True}, pace=.6)
        neck_a = (.3, .25); head_c = (.38, .35 + N * .3)
    # tail first-from-behind feel: drawn after the body for a sitting/lying animal is fine (it wraps forward)
    tw = {'thin': .03, 'brush': .09, 'short': .05, 'long': .035, 'none': 0}.get(tail, .03)
    if tail == 'brush':
        rx, ry = P(*tail_root)
        c.add({'type': 'body', 'x': r4(rx - f * s * .18), 'y': r4(ry + s * .02), 'length': s * .5, 'width': s * .18, 'angle': round((math.pi if f > 0 else 0) + (.35 if f > 0 else -.35), 3), 'color': fur, 'profile': [.35, .7, .95, 1, .95, .8, .55, .3]}, pace=.9)
        if mk.get('tip', True): c.add({'type': 'shape', 'points': ell(r4(rx - f * s * .42), r4(ry + s * .1), s * .06, s * .045, 10), 'color': '#f8f2ea', 'opacity': 240, 'flat': True}, pace=.4)
    elif tail == 'short':
        c.add({'type': 'shape', 'points': ell(*P(tail_root[0] - .03, tail_root[1] + .04), s * .05, s * .04, 10), 'color': lt, 'opacity': 245, 'flat': True}, pace=.4)
    elif tail == 'long':  # hanging tail with hair (horse)
        c.add({'type': 'strands', 'area': {'x': P(*tail_root)[0], 'y': P(*tail_root)[1], 'rx': s * .015, 'ry': .004}, 'count': 10, 'length': [s * .3, s * .45], 'angle': 1.75 if f > 0 else 1.4, 'spread': .2,
               'colors': [dk, shade(fh, -.2)], 'weight': [.9, 1.5], 'rim': 0}, pace=.5)
    elif tail == 'thin':
        a = tail_root
        c.add({'type': 'line', 'points': [P(*a), P(a[0] - .14, a[1] + .06), P(a[0] - .24, a[1] + .02), P(a[0] - .26, a[1] - .06)], 'color': dk, 'weight': 2 + 10 * s * tw / .03 * .4, 'curvature': .6}, pace=.6)
    if N > .1 or down:
        c.add({'type': 'shape', 'points': limb(P, neck_a, (head_c[0] - Hd * .2, head_c[1] + (Hd * .1 if down else -Hd * .2)), .07 + .05 * b.get('neck', .2), .05), 'color': fur, 'opacity': 245}, pace=.8)
    hx, hy = P(*head_c)
    # ears behind the head
    for k, du in enumerate((-.04, .03)):
        ex, ey = P(head_c[0] + du, head_c[1] + Hd * .35)
        if ears == 'pointed': c.add({'type': 'shape', 'points': petal(ex, r4(ey - s * Hd * .25), s * Hd * .45, s * Hd * .22, -math.pi / 2 - f * (.2 - .4 * k), 10), 'color': fur if k else dk, 'opacity': 245, 'flat': True}, pace=.5)
        elif ears == 'long': c.add({'type': 'shape', 'points': petal(ex, r4(ey - s * Hd * .6), s * Hd * .9, s * Hd * .22, -math.pi / 2 - f * (.15 - .3 * k), 12), 'color': fur if k else dk, 'opacity': 245, 'flat': True}, pace=.5)
        elif ears == 'round': c.add({'type': 'shape', 'points': ell(ex, r4(ey - s * Hd * .1), s * Hd * .22, s * Hd * .2, 10), 'color': fur if k else dk, 'opacity': 245, 'flat': True}, pace=.5)
    c.add({'type': 'shape', 'points': ell(hx, hy, s * Hd * .55, s * Hd * .45, 16), 'color': lt, 'opacity': 245}, pace=1.1)
    sl = {'flat': .2, 'short': .45, 'long': .85}.get(snout, .45)
    if sl > .25:
        tilt = 1.05 if down else .25 * sl   # a lowered head points its muzzle at the ground
        c.add({'type': 'shape', 'points': petal(r4(hx + f * s * Hd * (.3 + sl * .35) * (.6 if down else 1)), r4(hy + s * Hd * ((.3 + .45 * sl) if down else (.1 + .15 * sl))), s * Hd * sl * .55, s * Hd * .3, (0 if f > 0 else math.pi) + f * tilt, 12), 'color': lt, 'opacity': 245}, pace=.6)
    nx = hx + f * s * Hd * ((.2 + sl * .4) if down else (.3 + sl * .7)); ny = hy + s * Hd * ((.3 + .75 * sl) if down else (.08 + .25 * sl))
    c.add({'type': 'shape', 'points': ell(r4(nx), r4(ny), s * .012, s * .01, 8), 'color': '#3e3a3a', 'opacity': 245, 'flat': True}, pace=.3)
    c.add({'type': 'shape', 'points': ell(r4(hx + f * s * Hd * .15), r4(hy - s * Hd * .1), s * .012, s * .01, 8), 'color': '#3e3a3a', 'opacity': 245, 'flat': True}, pace=.3)
    if ears == 'drop':
        c.add({'type': 'shape', 'points': petal(r4(hx - f * s * Hd * .3), r4(hy + s * Hd * .15), s * Hd * .5, s * Hd * .2, math.pi / 2 + f * .3, 10), 'color': dk, 'opacity': 245, 'flat': True}, pace=.5)
    if mk.get('pattern') == 'belly' or mk.get('blaze'):
        c.add({'type': 'shape', 'points': ell(*P(head_c[0] - .02, head_c[1] - Hd * .7), s * .06, s * .08, 12), 'color': c.col(mk.get('colour'), '#f8f2ea'), 'opacity': 230, 'flat': True}, pace=.4)
    material_marks(c, body_poly, fur, mat, s, along=0 if pose in ('stand', 'walk', 'graze', 'drink', 'lie') else -1.3,  # fur lies along the body
                   markings=mk if mk.get('pattern') in ('stripes', 'spots', 'patch') else None)


def f_face(c, p):
    """Close-up portrait of an animal: soft underlayer, volumed head, hundreds of fur dabs fanning
    from the face, eyes with a glint. at = face centre, size = face height."""
    x, y = xy(p); s = p.get('size', .6); fur = c.hexof(c.col(p.get('colour'), 'accents.1')); lt = shade(fur, .12); dk = shade(fur, -.14)
    P = lambda u, v: [r4(x + u * s), r4(y - v * s)]; la = p.get('look_at'); gx, gy = (0, 0)
    if la: dx, dy = la[0] - x, la[1] - y; L = math.hypot(dx, dy) or 1; gx, gy = dx / L, dy / L
    c.add({'type': 'blob', 'x': x, 'y': r4(y + s * .6), 'rx': s * .8, 'ry': s * .5, 'color': fur, 'opacity': 215, 'bleed': .45}, pace=1.1)
    c.add({'type': 'shape', 'points': outline(P, [(-.7, -1.2), (-.62, -.55), (-.35, -.2), (0, -.15), (.35, -.2), (.62, -.55), (.7, -1.2)], 4), 'color': fur, 'opacity': 235}, pace=1.1)
    ears = p.get('ears', 'pointed')
    for side in (-1, 1):
        if ears == 'drop': c.add({'type': 'shape', 'points': outline(P, [(side * .3, .3), (side * .5, .15), (side * .55, -.25), (side * .42, -.32), (side * .3, 0)], 4), 'color': dk, 'opacity': 240}, pace=.9)
        elif ears == 'round': c.add({'type': 'shape', 'points': ell(*P(side * .3, .42), s * .12, s * .11, 12), 'color': fur, 'opacity': 245}, pace=.9)
        else:
            c.add({'type': 'shape', 'points': outline(P, [(side * .16, .34), (side * .38, .62 if ears == 'pointed' else .9), (side * .42, .22)], 4), 'color': fur, 'opacity': 245}, pace=.9)
            c.add({'type': 'shape', 'points': outline(P, [(side * .22, .34), (side * .36, .52 if ears == 'pointed' else .78), (side * .37, .28)], 4), 'color': '#f2c4b4', 'opacity': 220, 'flat': True}, pace=.5)
    head = outline(P, [(-.4, .12), (-.33, .36), (0, .44), (.33, .36), (.4, .12), (.32, -.18), (0, -.3), (-.32, -.18)], 5)
    c.add({'type': 'shape', 'points': head, 'color': fur, 'opacity': 242}, pace=1.3)
    tones = [lt, fur, shade(fur, .06), shade(fur, -.06), shade(fur, .18)]
    c.add({'type': 'marks', 'area': {'polygon': head}, 'count': 380, 'size': [.0025, .0045], 'aspect': [2.6, 3.6], 'petal': True, 'flow': {'fan': [x, r4(y + s * .02)]}, 'colors': tones, 'opacity': [110, 190], 'batch': 10}, pace=1.3, label='梳出毛发…')
    c.add({'type': 'marks', 'area': {'x': x, 'y': r4(y + s * .6), 'rx': s * .75, 'ry': s * .4}, 'count': 260, 'size': [.003, .005], 'aspect': [2.8, 4], 'petal': True, 'flow': {'fan': [x, r4(y + s * .15)]}, 'colors': tones + [dk], 'opacity': [110, 190], 'batch': 10}, pace=1.0)
    c.add({'type': 'shape', 'points': ell(*P(0, -.12), s * .2, s * .14, 16), 'color': shade(lt, .08), 'opacity': 230}, pace=.7)
    for side in (-1, 1):
        ex, ey = P(side * .16, .1)
        c.add({'type': 'shape', 'points': petal(ex, ey, s * .085, s * .055, 0 if side > 0 else math.pi, 14), 'color': c.col(p.get('eyes'), '#c9963a'), 'opacity': 250, 'flat': True}, pace=.8, label='点出眼睛…' if side < 0 else None)
        c.add({'type': 'shape', 'points': ell(r4(ex + gx * s * .025), r4(ey + gy * s * .02), s * .03, s * .045, 12), 'color': '#2e2a28', 'opacity': 250, 'flat': True}, pace=.5)
        c.add({'type': 'shape', 'points': ell(r4(ex + gx * s * .025 - s * .012), r4(ey + gy * s * .02 - s * .018), s * .011, s * .011, 8), 'color': '#fffaf0', 'opacity': 250, 'flat': True}, pace=.4)
    nx, ny = P(0, -.06)
    c.add({'type': 'shape', 'points': [[r4(nx - s * .035), r4(ny - s * .015)], [r4(nx + s * .035), r4(ny - s * .015)], [r4(nx), r4(ny + s * .03)]], 'color': c.col(p.get('nose'), '#d98a86'), 'opacity': 245, 'flat': True, 'sharp': True}, pace=.4)
    for side in (-1, 1):
        c.add({'type': 'line', 'points': [P(0, -.11), P(side * .035, -.15), P(side * .075, -.13)], 'color': shade(fur, -.3), 'weight': 1, 'curvature': .6}, pace=.3)
        if p.get('whiskers', True):
            for k in range(3):
                c.add({'type': 'line', 'points': [P(side * .1, -.1 - .025 * k), P(side * .3, -.07 - .05 * k), P(side * .5, -.05 - .08 * k)], 'color': '#fff7ea', 'weight': .6, 'brush': 'flick', 'curvature': .5}, pace=.2)


def f_bird(c, p):
    """A bird from its build: neck and leg length (wader vs songbird), beak, tail, colours of body/wing/breast.
    pose perch/stand/fly/swim; count > 1 with pose fly paints a distant flock."""
    x, y = xy(p); s = p.get('size', .06); f = -1 if p.get('facing') == 'left' else 1; P = frame_of(x, y, s, f)
    b = p.get('build', {}); neck = b.get('neck', .2); legs = b.get('legs', .2); beak = b.get('beak', .3)
    body = c.col(p.get('colour'), 'washes.3'); wing = c.col(p.get('wing'), shade(c.hexof(body), -.1)); breast = c.col(p.get('breast'), body)
    pose = p.get('pose', 'perch')
    if p.get('count', 1) > 1:  # distant flock: soft V strokes
        rng = random.Random(round(x * 991 + y * 77))
        for k in range(p['count']):
            bx, by = x + rng.uniform(-.12, .12), y + rng.uniform(-.06, .06); w = s * rng.uniform(.6, 1.1)
            c.add({'type': 'line', 'points': [[r4(bx - w), r4(by - w * .3)], [r4(bx), r4(by)], [r4(bx + w), r4(by - w * .35)]], 'color': body, 'weight': 1.1, 'curvature': .6}, pace=.4)
        return
    if pose == 'fly':
        c.add({'type': 'body', 'x': x, 'y': y, 'length': s * .6, 'width': s * .14, 'angle': 0 if f > 0 else math.pi, 'color': body, 'profile': [.25, .55, .9, 1, .9, .6, .3, .2]}, pace=.8)
        for k in (-1, 1):
            c.add({'type': 'shape', 'points': outline(P, [(-.05, 0), (-.25, .1 * -k + .05), (-.4, .45 * -k), (-.1, .22 * -k), (.05, .02)], 4), 'color': wing, 'opacity': 240, 'flat': True}, pace=.5)
            if p.get('wingtips'): c.add({'type': 'shape', 'points': outline(P, [(-.3, .3 * -k), (-.4, .45 * -k), (-.32, .38 * -k)], 3), 'color': c.col(p['wingtips'], '#2c2c30'), 'opacity': 240, 'flat': True}, pace=.3)
        if neck > .4: c.add({'type': 'line', 'points': [P(.3, 0), P(.55, .02)], 'color': body, 'weight': 2}, pace=.3)
        if legs > .4: c.add({'type': 'line', 'points': [P(-.3, 0), P(-.65, -.03)], 'color': '#3a3a3a', 'weight': .8}, pace=.3)
        return
    if pose == 'swim':  # duck, swan, goose on water
        c.add({'type': 'shape', 'points': outline(P, [(-.4, .05), (-.3, .3), (.2, .3), (.38, .1), (.1, 0), (-.3, -.02)], 4), 'color': body, 'opacity': 245}, pace=.9)
        c.add({'type': 'shape', 'points': outline(P, [(-.25, .18), (-.05, .32), (.15, .22), (-.1, .12)], 3), 'color': wing, 'opacity': 230, 'flat': True}, pace=.5)
        hn = .3 + neck * .5
        c.add({'type': 'shape', 'points': limb(P, (.22, .22), (.3, hn), .05, .035), 'color': body, 'opacity': 245}, pace=.5)
        c.add({'type': 'shape', 'points': ell(*P(.32, hn + .05), s * .09, s * .08, 12), 'color': c.col(p.get('head_colour'), body), 'opacity': 245, 'flat': True}, pace=.5)
        c.add({'type': 'shape', 'points': petal(*P(.42 + beak * .05, hn + .03), s * (.05 + beak * .1), s * .03, 0 if f > 0 else math.pi, 10), 'color': c.col(p.get('beak_colour'), '#e8a040'), 'opacity': 245, 'flat': True}, pace=.3)
        return
    if legs > .45:  # a wader standing (crane, heron, egret)
        for u in (-.02, .04):
            c.add({'type': 'line', 'points': [P(u, .45), P(u + .01, .2), P(u, 0)], 'color': '#3a3a3a', 'weight': 1}, pace=.3)
        c.add({'type': 'shape', 'points': outline(P, [(-.22, .62), (-.1, .45), (.1, .46), (.16, .56), (.06, .66), (-.12, .68)], 4), 'color': body, 'opacity': 245}, pace=1.0)
        if p.get('tail_colour'): c.add({'type': 'shape', 'points': outline(P, [(-.3, .6), (-.2, .52), (-.1, .58), (-.18, .66)], 3), 'color': c.col(p['tail_colour'], '#2c2c30'), 'opacity': 240, 'flat': True}, pace=.4)
        c.add({'type': 'line', 'points': [P(.12, .6), P(.14, .78), P(.1, .9), P(.16, .96)], 'color': body, 'weight': 2.2, 'curvature': .6}, pace=.6)
        c.add({'type': 'shape', 'points': ell(*P(.17, .96), s * .03, s * .025, 10), 'color': body, 'opacity': 245, 'flat': True}, pace=.3)
        if p.get('crown'): c.add({'type': 'shape', 'points': ell(*P(.17, .985), s * .015, s * .01, 8), 'color': c.col(p['crown'], '#d43a3a'), 'opacity': 250, 'flat': True}, pace=.2)
        c.add({'type': 'line', 'points': [P(.19, .96), P(.19 + .1 + beak * .1, .95)], 'color': c.col(p.get('beak_colour'), '#c9a24a'), 'weight': 1}, pace=.2)
        return
    # perching songbird: round body, breast, wing, tail, small head and beak
    c.add({'type': 'shape', 'points': ell(*P(0, .35), s * .32, s * .2), 'color': body, 'opacity': 240}, pace=.9)
    c.add({'type': 'shape', 'points': ell(*P(.08, .3), s * .2, s * .13), 'color': breast, 'opacity': 230, 'flat': True}, pace=.5)
    c.add({'type': 'shape', 'points': ell(*P(.28, .55), s * .14, s * .14), 'color': c.col(p.get('head_colour'), body), 'opacity': 245}, pace=.7)
    c.add({'type': 'shape', 'points': petal(*P(.42 + beak * .05, .55), s * (.06 + beak * .12), s * .035, 0 if f > 0 else math.pi, 10), 'color': c.col(p.get('beak_colour'), 'accents.2'), 'opacity': 245, 'flat': True}, pace=.4)
    c.add({'type': 'shape', 'points': outline(P, [(-.25, .4), (-.6, .55), (-.55, .35)], 3), 'color': wing, 'opacity': 240}, pace=.5)
    c.add({'type': 'shape', 'points': outline(P, [(-.15, .42), (.12, .45), (-.05, .25)], 3), 'color': wing, 'opacity': 230}, pace=.5)
    c.add({'type': 'shape', 'points': ell(*P(.3, .58), s * .02, s * .02, 8), 'color': '#2a2626', 'opacity': 245, 'flat': True}, pace=.2)


def f_fish(c, p):
    """A fish or koi seen from above or the side: tapered body, saddle marking, fins, eye."""
    x, y = xy(p); L = p.get('size', .2); ang = p.get('angle', 0 if p.get('facing') != 'left' else math.pi); col = c.col(p.get('colour'), 'accents.1')
    mk = p.get('markings') or {}
    for k, side in enumerate((-1, 1)):  # fins
        fx, fy = x + math.cos(ang) * L * .1 - math.sin(ang) * side * L * .12, y + math.sin(ang) * L * .1 + math.cos(ang) * side * L * .12
        c.add({'type': 'shape', 'points': petal(r4(fx), r4(fy), L * .12, L * .05, ang + math.pi + side * .9, 10), 'color': toneish(c.hexof(col), .1), 'opacity': 200, 'flat': True}, pace=.3)
    c.add({'type': 'body', 'x': x, 'y': y, 'length': L, 'width': L * .3, 'angle': round(ang, 3), 'color': col, 'saddle': c.col(mk.get('colour'), None) if mk.get('colour') else None, 'eye': True} if mk.get('colour') else
          {'type': 'body', 'x': x, 'y': y, 'length': L, 'width': L * .3, 'angle': round(ang, 3), 'color': col, 'eye': True}, pace=1.1)
    tx, ty = x - math.cos(ang) * L * .55, y - math.sin(ang) * L * .55
    c.add({'type': 'shape', 'points': petal(r4(tx), r4(ty), L * .2, L * .12, ang + math.pi, 12), 'color': toneish(c.hexof(col), -.05), 'opacity': 220}, pace=.4)


def f_insect(c, p):
    """A small winged insect seen from above: wings broad (butterfly: fore and hind wing each side) or narrow pairs
    (dragonfly: four long wings straight out from the thorax, a long slender tail), body colour, wing colour.
    angle (radians, the way the head points) or facing; a dragonfly lies on a slant by default, a butterfly upright."""
    x, y = xy(p); s = p.get('size', .05); bc = c.col(p.get('colour'), '#3b5a6e'); bh = c.hexof(bc)
    narrow = p.get('wings', 'narrow') == 'narrow'; f = -1 if p.get('facing') == 'left' else 1
    ang = p.get('angle', (-.55 if f > 0 else -math.pi + .55) if narrow else -math.pi / 2)
    ca, sa = math.cos(ang), math.sin(ang)
    P = lambda u, v: [r4(x + (u * ca - v * sa) * s), r4(y + (u * sa + v * ca) * s)]   # u along the body (head +), v across
    if narrow:
        wc = c.col(p.get('wing'), mix(bh, '#ffffff', .78)); wh = c.hexof(wc)
        for side in (-1, 1):
            for k, (sweep, L, W) in enumerate([(.16, .62, .1), (-.12, .58, .12)]):   # forewing leans forward, hindwing back and wider
                root = (.12 - .1 * k, 0); tip = (root[0] + sweep, side * L); mid = ((root[0] + tip[0]) / 2, (root[1] + tip[1]) / 2)
                rot = math.atan2((tip[1] - root[1]) * ca + (tip[0] - root[0]) * sa, (tip[0] - root[0]) * ca - (tip[1] - root[1]) * sa)
                cx_, cy_ = P(*mid)
                c.add({'type': 'shape', 'points': petal(cx_, cy_, L * s * .52, W * s, rot, 14), 'color': wc, 'opacity': 170, 'flat': True}, pace=.25)
                c.add({'type': 'line', 'points': [P(root[0] + .02, root[1]), P(tip[0] + .01, tip[1] * .97)], 'color': toneish(wh, -.18), 'weight': .6}, pace=.1)
                c.add({'type': 'shape', 'points': ell(*P(tip[0] - .02 * side * 0, tip[1] * .86), s * .022, s * .022, 8), 'color': toneish(bh, -.1), 'opacity': 230, 'flat': True}, pace=.1)
        # tail: long, tapering, segmented
        tail = [(.0, .045), (-.3, .036), (-.62, .026), (-.86, .016), (-.9, 0), (-.86, -.016), (-.62, -.026), (-.3, -.036), (.0, -.045)]
        c.add({'type': 'shape', 'points': outline(P, tail, 3), 'color': bc, 'opacity': 245}, pace=.4)
        for k in range(6):
            u = -.12 - k * .12; c.add({'type': 'line', 'points': [P(u, .03 - k * .003), P(u, -.03 + k * .003)], 'color': toneish(bh, -.16), 'weight': .7}, pace=.1)
        c.add({'type': 'shape', 'points': outline(P, [(.22, .07), (.04, .08), (-.04, .045), (-.04, -.045), (.04, -.08), (.22, -.07)], 3), 'color': toneish(bh, -.08), 'opacity': 245}, pace=.3)
        for side in (-1, 1): c.add({'type': 'shape', 'points': ell(*P(.29, side * .045), s * .05, s * .05, 10), 'color': toneish(bh, -.2), 'opacity': 245, 'flat': True}, pace=.15)
        return
    wc = c.col(p.get('wing'), 'accents.1'); wh = c.hexof(wc)
    for side in (-1, 1):
        fore = [(.04, .02), (.36, .5), (.18, .72), (-.06, .5), (-.04, .08)]; hind = [(-.04, .03), (-.12, .44), (-.42, .4), (-.5, .16), (-.18, .02)]
        c.add({'type': 'shape', 'points': outline(P, [(u, side * v) for u, v in hind], 4), 'color': toneish(wh, .06), 'opacity': 235}, pace=.35)
        c.add({'type': 'shape', 'points': outline(P, [(u, side * v) for u, v in fore], 4), 'color': wc, 'opacity': 240}, pace=.35)
        c.add({'type': 'marks', 'area': {'polygon': outline(P, [(.3, side * .5), (.17, side * .7), (.05, side * .62), (.2, side * .45)], 2)}, 'count': 8, 'size': [.002, .004], 'colors': [toneish(wh, -.25), '#fffaf0'], 'batch': 4}, pace=.1)
        c.add({'type': 'shape', 'points': ell(*P(.12, side * .42), s * .045, s * .045, 10), 'color': '#fffaf0', 'opacity': 220, 'flat': True}, pace=.1)
    c.add({'type': 'shape', 'points': outline(P, [(.24, .03), (-.36, .025), (-.4, 0), (-.36, -.025), (.24, -.03), (.28, 0)], 3), 'color': toneish(bh, -.1), 'opacity': 245}, pace=.25)
    for side in (-1, 1): c.add({'type': 'line', 'points': [P(.26, side * .01), P(.4, side * .1), P(.44, side * .11)], 'color': toneish(bh, -.1), 'weight': .6, 'curvature': .4}, pace=.1)


def f_plant(c, p):
    """Plants by growth habit: tree (crown round/cone/weeping/spray), shrub, stems (a few stems with flower heads),
    grass, cane (jointed stalks: bamboo), reed (thin curving stalks with plumes: reeds, rushes, pampas), floating (round leaves on water), vine (hanging clusters).
    bloom {colour, shape cup/star/disc/cluster/bud/spray, count}; fruit {colour, count}; leaf colour via colours.life."""
    habit = p.get('habit', 'tree'); bloom = p.get('bloom') or {}; fruit = p.get('fruit') or {}
    bc = c.col(bloom.get('colour'), 'accents.1') if bloom else None
    if habit == 'tree': return tree(c, p, bc, fruit)
    x, y = xy(p); s = p.get('size', .4); w = p.get('width', s * .6); rng = random.Random(round(x * 733 + y * 91))
    leaf = c.col(p.get('colour'), 'foliage.1')
    if habit == 'shrub':
        rx, ry = w / 2, s * .45
        c.add({'type': 'blob', 'x': x, 'y': r4(y - ry), 'rx': rx * 1.05, 'ry': ry * 1.1, 'color': bc or leaf, 'opacity': 160, 'bleed': .6}, pace=1.0)
        c.add({'type': 'leaves', 'x': x, 'y': r4(y - ry * .7), 'rx': rx * 1.1, 'ry': ry, 'count': int(30 + 300 * rx * ry), 'size': .012}, pace=1.1)
        if bc:
            c.add({'type': 'marks', 'area': {'x': x, 'y': r4(y - ry * 1.1), 'rx': rx * .9, 'ry': ry * .8}, 'count': int(40 + 500 * rx * ry), 'size': [.005, .01], 'colors': [bc, toneish(c.hexof(bc), .1), toneish(c.hexof(bc), -.1), 'accents.3'], 'batch': 6}, pace=1.1)
            c.add({'type': 'flowers', 'kind': {'star': 'daisy', 'disc': 'daisy', 'cup': 'peony'}.get(bloom.get('shape'), 'blossom'), 'area': {'x': x, 'y': r4(y - ry * 1.1), 'rx': rx * .8, 'ry': ry * .6}, 'count': bloom.get('count', 6), 'accents': [bc]}, pace=1.1)
        return
    if habit == 'grass':
        c.add({'type': 'strands', 'area': {'box': [r4(x - w / 2), r4(y - .01), r4(x + w / 2), r4(y + .01)]}, 'count': p.get('count', 50), 'length': [s * .5, s], 'angle': -1.57, 'spread': p.get('lean', .25),
               'colors': [leaf, 'foliage.0', 'foliage.3'], 'weight': [.6, 1.1], 'group': 2}, pace=.8)
        if bc: c.add({'type': 'marks', 'area': {'box': [r4(x - w / 2), r4(y - s), r4(x + w / 2), r4(y - s * .6)]}, 'count': bloom.get('count', 20), 'size': [.003, .006], 'aspect': [2, 4], 'rotation': -1.57, 'colors': [bc, toneish(c.hexof(bc), .1)], 'batch': 6}, pace=.6)
        return
    if habit == 'reed':   # reeds, rushes, pampas: thin curving stalks, ribbon leaves, a soft drooping plume on top
        n = p.get('count', 14); plume = c.col(bloom.get('colour'), mix(c.hexof(leaf), '#f6ead8', .7)); ph = c.hexof(plume); wind = p.get('lean', .12)
        c.add({'type': 'strands', 'area': {'box': [r4(x - w / 2), r4(y - .01), r4(x + w / 2), r4(y + .01)]}, 'count': n * 4, 'length': [s * .15, s * .4], 'angle': -1.57 + wind, 'spread': .3,
               'colors': [leaf, 'foliage.0', 'foliage.3'], 'weight': [.6, 1.1], 'group': 2}, pace=.7)
        for k in range(n):
            bx = x + (rng.random() - .5) * w; h = s * rng.uniform(.6, 1.05); bend = wind * rng.uniform(.6, 1.4) * h
            tip = (bx + bend, y - h); midp = (bx + bend * .35, y - h * .55)
            col = rng.choice([leaf, 'foliage.0', 'foliage.2'])
            c.add({'type': 'line', 'points': [[r4(bx), r4(y)], [r4(midp[0]), r4(midp[1])], [r4(tip[0]), r4(tip[1])]], 'color': col, 'weight': rng.uniform(.9, 1.5), 'curvature': .5}, pace=.15)
            for j in range(rng.randint(1, 3)):   # ribbon leaves peel off the stalk and arch over
                t0 = rng.uniform(.2, .65); lx, ly = bx + bend * t0 * t0, y - h * t0; d = rng.choice((-1, 1)); L = s * rng.uniform(.14, .26)
                c.add({'type': 'shape', 'points': petal(r4(lx + d * L * .45), r4(ly - L * .2), L * .5, s * .011, -math.pi / 2 + d * rng.uniform(.7, 1.1), 10), 'color': col, 'opacity': 230, 'flat': True}, pace=.1)
            if rng.random() < .8:   # the plume nods with the wind
                L = s * rng.uniform(.1, .16); dx = math.copysign(L * .45, wind if wind else 1)
                path = [[r4(tip[0]), r4(tip[1])], [r4(tip[0] + dx * .6), r4(tip[1] - L * .25)], [r4(tip[0] + dx), r4(tip[1] + L * .15)]]
                c.add({'type': 'blob', 'x': r4(tip[0] + dx * .55), 'y': r4(tip[1] - L * .05), 'rx': L * .4, 'ry': L * .22, 'color': plume, 'opacity': 150, 'bleed': .5}, pace=.1)
                c.add({'type': 'marks', 'area': {'path': path, 'width': L * .3}, 'count': 14, 'size': [.002, .004], 'aspect': [2.5, 4], 'petal': True, 'colors': [plume, toneish(ph, .08), toneish(ph, -.1)], 'batch': 7}, pace=.15)
        return
    if habit == 'cane':
        for k in range(p.get('count', 6)):
            bx = x + (k / max(1, p.get('count', 6) - 1) - .5) * w + rng.uniform(-.02, .02); lean = rng.uniform(-.05, .05); h = s * rng.uniform(.75, 1.05)
            col = rng.choice([leaf, 'foliage.0', 'foliage.2'])
            for j in range(6):
                a = (bx + lean * j / 6, y - h * j / 6); b = (bx + lean * (j + 1) / 6, y - h * (j + 1) / 6 + .006)
                c.add({'type': 'line', 'points': [[r4(a[0]), r4(a[1])], [r4(b[0]), r4(b[1])]], 'color': col, 'weight': 2.4 - 1.2 * j / 6}, pace=.15)
            c.add({'type': 'marks', 'area': {'x': r4(bx + lean * .7), 'y': r4(y - h * .75), 'rx': .07, 'ry': h * .25}, 'count': 30, 'size': [.004, .007], 'aspect': [4, 6], 'petal': True,
                   'flow': {'fan': [r4(bx + lean * .6), r4(y - h * .6)]}, 'colors': ['foliage.0', 'foliage.1', 'foliage.3', 'foliage.2'], 'batch': 6}, pace=.6)
        return
    if habit == 'floating':
        pink = bc or c.col(None, 'accents.0')
        leaves = sorted([(x + rng.uniform(-.5, .5) * w, y + rng.uniform(-.12, .12) * w, rng.uniform(.06, .11) * w * 2) for _ in range(p.get('leaves', 9))], key=lambda q: q[1])
        for lx, ly, r in leaves:
            c.add({'type': 'shape', 'points': ell(r4(lx), r4(ly), r * .55, r * .2, 16), 'color': rng.choice([leaf, 'foliage.0', 'foliage.2']), 'opacity': 240}, pace=.5)
            c.add({'type': 'line', 'points': [[r4(lx), r4(ly)], [r4(lx + r * .3), r4(ly - r * .05)]], 'color': 'foliage.3', 'weight': .7}, pace=.2)
        n = bloom.get('count', 3); buds = bloom.get('buds', 2)
        for k in range(n + buds):
            hx = x + rng.uniform(-.4, .4) * w; hy = y - rng.uniform(.15, .35) * w
            c.add({'type': 'line', 'points': [[r4(hx + rng.uniform(-.01, .01)), r4(y + .02)], [r4(hx), r4(hy)]], 'color': 'foliage.2', 'weight': 1.2, 'curvature': .5}, pace=.3)
            if k >= n: c.add({'type': 'shape', 'points': petal(r4(hx), r4(hy - w * .03), w * .045, w * .022, -math.pi / 2, 12), 'color': pink, 'opacity': 245, 'flat': True}, pace=.4)
            else:
                for j, a in enumerate([-2.3, -1.9, -1.25, -.85, -1.57]):
                    c.add({'type': 'shape', 'points': petal(r4(hx + math.cos(a) * w * .03), r4(hy + math.sin(a) * w * .03), w * .05, w * .022, a, 12), 'color': toneish(c.hexof(pink), .1) if j < 4 else pink, 'opacity': 240, 'flat': True}, pace=.3)
                c.add({'type': 'shape', 'points': ell(r4(hx), r4(hy - w * .01), w * .015, w * .01, 10), 'color': '#e8c050', 'opacity': 245, 'flat': True}, pace=.2)
        return
    if habit == 'vine':  # hanging clusters from a branch line at the top (wisteria-like)
        c.add({'type': 'line', 'points': [[r4(x - w / 2), r4(y)], [r4(x), r4(y + .02)], [r4(x + w / 2), r4(y - .01)]], 'color': 'foliage.2', 'weight': 2.2, 'curvature': .5}, pace=.6)
        c.add({'type': 'leaves', 'x': x, 'y': r4(y + .03), 'rx': w / 2, 'ry': .05, 'count': 40, 'size': .011}, pace=.8)
        for k in range(bloom.get('count', 8)):
            hx = x + (k / max(1, bloom.get('count', 8) - 1) - .5) * w * .9 + rng.uniform(-.02, .02); hl = s * rng.uniform(.4, 1)
            c.add({'type': 'marks', 'area': {'path': [[r4(hx), r4(y + .03)], [r4(hx + rng.uniform(-.01, .01)), r4(y + .03 + hl)]], 'width': .03}, 'count': 22, 'size': [.003, .006], 'colors': [bc or 'accents.1', 'accents.0', 'accents.3', 'accents.2'], 'batch': 6}, pace=.5)
        return
    # stems: a few stems with flower heads (cut flowers, a clump in a field, flowers in a vase)
    n = p.get('count', 3); heads = [(x + (-.5 + i / max(1, n - 1)) * w if n > 1 else x, y - s * (.8 + .2 * math.sin(i * 2.1))) for i in range(n)]
    for hx, hy in heads:
        c.add({'type': 'line', 'points': [[x, y], [r4((x + hx) / 2), r4((y + hy) / 2 + .01)], [r4(hx), r4(hy + s * .05)]], 'color': leaf, 'weight': 1.5, 'curvature': .6}, pace=.5)
    if bloom.get('shape') != 'spray': c.add({'type': 'leaves', 'x': x, 'y': r4(y - s * .4), 'rx': w * .5 + .02, 'ry': s * .15, 'count': 12, 'size': .012, 'rotation': 1.2}, pace=.6)
    shape = bloom.get('shape', 'cluster'); bc = bc or 'accents.1'; bh = c.hexof(bc); r = s * .08
    for hx, hy in heads:
        if shape == 'cup':  # tulip-like cup
            c.add({'type': 'shape', 'points': [[r4(hx - r), r4(hy - r * .3)], [r4(hx - r * .9), r4(hy + r)], [r4(hx + r * .9), r4(hy + r)], [r4(hx + r), r4(hy - r * .3)], [r4(hx + r * .35), r4(hy + r * .1)], [r4(hx), r4(hy - r * .9)], [r4(hx - r * .35), r4(hy + r * .1)]], 'color': bc, 'opacity': 245}, pace=.9)
            c.add({'type': 'shape', 'points': [[r4(hx - r * .3), r4(hy)], [r4(hx), r4(hy - r * .8)], [r4(hx + r * .3), r4(hy)], [r4(hx), r4(hy + r)]], 'color': toneish(bh, -.12), 'opacity': 200}, pace=.5)
        elif shape == 'spray':  # arching sprays of small blooms (orchid)
            for k in range(4):
                ox, oy = hx + k * s * .045 * (1 if hx >= x else -1), hy + k * s * .02
                c.add({'type': 'shape', 'points': petal(r4(ox), r4(oy), s * .03, s * .022, k * 1.3, 12), 'color': bc, 'opacity': 245, 'flat': True}, pace=.4)
                c.add({'type': 'shape', 'points': ell(r4(ox), r4(oy), s * .007, s * .007, 8), 'color': '#e8b04a', 'opacity': 240, 'flat': True}, pace=.2)
        elif shape == 'bud':
            c.add({'type': 'shape', 'points': petal(r4(hx), r4(hy), r * .9, r * .45, -math.pi / 2, 12), 'color': bc, 'opacity': 245, 'flat': True}, pace=.5)
        else:
            c.add({'type': 'flowers', 'kind': {'star': 'daisy', 'disc': 'daisy', 'cluster': 'blossom', 'rose': 'peony'}.get(shape, 'blossom'), 'at': [[r4(hx), r4(hy), r4(s * .06)]], 'accents': [bc]}, pace=.8)


def tree(c, p, bloom, fruit):
    x, y = xy(p); s = p.get('size', .45); lean = p.get('lean', 0) * s * .3; crown = p.get('crown', 'round')
    trunk = c.col(p.get('trunk'), 'foliage.2'); leaf = c.col(p.get('colour'), 'foliage.1')
    top = (x + lean, y - s * .62)
    c.add({'type': 'line', 'points': [[x, y], [x + lean * .3, y - s * .3], [top[0], top[1]]], 'color': trunk, 'weight': 1.5 + 6 * s}, pace=1.1)
    for k, (a, l) in enumerate([(-2.3, .28), (-.9, .3), (-1.9, .22)]):
        by = y - s * (.42 + .07 * k); bx = x + lean * ((y - by) / (s * .62))
        c.add({'type': 'line', 'points': [[r4(bx), r4(by)], [r4(bx + math.cos(a) * s * l * .5), r4(by + math.sin(a) * s * l * .5 - .005)], [r4(bx + math.cos(a) * s * l), r4(by + math.sin(a) * s * l)]], 'color': trunk, 'weight': .8 + 3 * s}, pace=.7)
    cx, cy = top[0] + lean * .3, y - s * .72; rx, ry = s * .42, s * .3
    if crown == 'cone':  # conifer: stacked layers
        for i in range(4):
            w = rx * (1 - i * .2); yy = cy + ry * .9 - i * ry * .55
            c.add({'type': 'shape', 'points': [[r4(cx - w), r4(yy)], [r4(cx), r4(yy - ry * .8)], [r4(cx + w), r4(yy)]], 'color': ['foliage.2', leaf, 'foliage.0', 'foliage.0'][i], 'opacity': 235}, pace=1.0)
        c.add({'type': 'marks', 'area': {'x': cx, 'y': cy, 'rx': rx * .8, 'ry': ry * 1.1}, 'count': 50, 'size': [.002, .004], 'aspect': [2, 3], 'rotation': .4, 'colors': ['foliage.3', 'foliage.0'], 'light': c.lit_path()}, pace=1.0)
        return
    c.add({'type': 'blob', 'x': r4(cx), 'y': r4(cy), 'rx': rx, 'ry': ry, 'color': bloom or leaf, 'opacity': 190, 'rotation': lean * 2}, pace=1.0)
    if crown == 'weeping':
        c.add({'type': 'leaves', 'x': r4(cx), 'y': r4(cy - ry * .3), 'rx': rx, 'ry': ry * .7, 'count': 70, 'size': .011}, pace=1.0)
        c.add({'type': 'strands', 'area': {'path': [[r4(cx - rx), r4(cy)], [r4(cx), r4(cy - ry * .8)], [r4(cx + rx), r4(cy)]], 'width': .02}, 'count': int(40 + 100 * s), 'length': [s * .25, s * .6],
               'colors': [leaf, 'foliage.0', 'foliage.3'], 'light': c.lit_path()}, pace=1.2)
        return
    cols = [bloom, toneish(c.hexof(bloom), .1), 'accents.3', 'foliage.3'] if bloom else ['foliage.2', leaf, 'foliage.0', 'foliage.3']
    spread = 1.25 if crown == 'spray' else 1.05
    c.add({'type': 'marks', 'area': {'x': r4(cx), 'y': r4(cy), 'rx': rx * spread, 'ry': ry * spread}, 'count': int(70 + 130 * s), 'size': [.005, .009], 'aspect': [2.2, 3], 'petal': True,
           'flow': {'fan': [r4(top[0]), r4(top[1] + ry * .3)]}, 'colors': cols, 'batch': 6}, pace=1.2)
    c.add({'type': 'marks', 'area': {'x': r4(cx + rx * .2), 'y': r4(cy - ry * .2), 'rx': rx * .8, 'ry': ry * .7}, 'count': int(30 + 60 * s), 'size': [.004, .007], 'aspect': [1.4, 2],
           'colors': ['foliage.0', 'foliage.3'] if not bloom else ['accents.3', 'highlights.1'], 'light': c.lit_path()}, pace=1.0)
    if bloom: c.add({'type': 'flowers', 'kind': 'blossom', 'area': {'x': r4(cx), 'y': r4(cy), 'rx': rx * .8, 'ry': ry * .7}, 'count': 7, 'accents': [bloom]}, pace=1.0)
    if fruit.get('colour'):
        rng = random.Random(round(x * 397)); fc = c.col(fruit['colour'], 'accents.1')
        for _ in range(fruit.get('count', 6)):
            a = rng.uniform(0, 6.28); d = math.sqrt(rng.random()) * .8; fx, fy = cx + math.cos(a) * rx * d, cy + math.sin(a) * ry * d
            fr = s * rng.uniform(.03, .05)
            c.add({'type': 'shape', 'points': ell(r4(fx), r4(fy), fr, fr * .95, 14), 'color': fc, 'opacity': 245, 'glint': True}, pace=.4)


def f_building(c, p):
    """A building from its parts: walls {width, height, colour}, roof {shape gable/eaves/flat/dome, colour, tiers},
    open (columns, no walls), windows (count), door, lit, spans (a wall across the scene with a gate)."""
    x, y = xy(p); wl = p.get('walls', {}); rf = p.get('roof', {}); w = wl.get('width', .25); h = wl.get('height', w * .65)
    wall = c.col(wl.get('colour'), '#efe2cc'); roof = c.col(rf.get('colour'), 'accents.2'); shape = rf.get('shape', 'gable'); tiers = rf.get('tiers', 1)
    if p.get('spans'):  # a city wall or rampart across the scene, with a gate
        wy = y - h * .6; wc = c.col(p.get('wall_colour'), '#9a948a')
        c.add({'type': 'shape', 'points': [[-.02, r4(y)], [-.02, r4(wy)], [1.02, r4(wy)], [1.02, r4(y)]], 'color': wc, 'opacity': 240}, pace=1.1)
        material_marks(c, [[0, wy], [1, wy], [1, y], [0, y]], wc, 'stone', .5)
        c.add({'type': 'shape', 'points': outline(lambda u, v: [r4(x + u), r4(y - v)], [(-w * .12, 0), (-w * .12, h * .3), (0, h * .42), (w * .12, h * .3), (w * .12, 0)], 4), 'color': '#3c3a3e', 'opacity': 240, 'flat': True}, pace=.5)
        y = wy; h = h * .6
    cy = y
    for k in range(tiers):
        tw = w * (1 - .12 * k); th = h / tiers
        if p.get('open'):
            for u in (-.36, -.12, .12, .36):
                c.add({'type': 'line', 'points': [[r4(x + u * tw), r4(cy)], [r4(x + u * tw), r4(cy - th)]], 'color': c.col(p.get('columns'), '#b8473a'), 'weight': 2.2}, pace=.3)
        else:
            pts = [[r4(x - tw / 2), r4(cy)], [r4(x - tw / 2 + tw * .01), r4(cy - th)], [r4(x), r4(cy - th - tw * .006)], [r4(x + tw / 2 - tw * .01), r4(cy - th)], [r4(x + tw / 2), r4(cy)], [r4(x), r4(cy + tw * .008)]]
            c.add({'type': 'shape', 'points': pts, 'color': wall, 'opacity': 242}, pace=1.0)
            if p.get('columns'):
                for u in (-.4, -.14, .14, .4): c.add({'type': 'line', 'points': [[r4(x + u * tw), r4(cy)], [r4(x + u * tw), r4(cy - th)]], 'color': c.col(p['columns'], '#b8473a'), 'weight': 1.6}, pace=.2)
            nwin = p.get('windows', 2 if tw > .08 else 1)
            for i in range(nwin):
                wx = x + ((i + .5) / nwin - .5) * tw * .75; wy0, wy1 = cy - th * .75, cy - th * .42; ww = min(tw * .085, tw * .5 / max(1, nwin))
                if p.get('lit'): c.add({'type': 'blob', 'x': r4(wx), 'y': r4((wy0 + wy1) / 2), 'rx': ww * 1.8, 'ry': ww * 1.8, 'color': '#fde7c0', 'opacity': 120, 'bleed': .55}, pace=.4)
                c.add({'type': 'shape', 'points': ell(r4(wx), r4((wy0 + wy1) / 2), ww, (wy1 - wy0) / 2, 10), 'color': 'highlights.0' if p.get('lit') else toneish(c.hexof(wall), -.25), 'opacity': 245, 'flat': True}, pace=.4)
            if k == 0 and p.get('door', True) and tw > .08:
                c.add({'type': 'shape', 'points': outline(lambda u, v: [r4(x + u), r4(cy - v)], [(-tw * .05, 0), (-tw * .05, th * .38), (tw * .01, th * .5), (tw * .07, th * .38), (tw * .07, 0)], 3), 'color': c.col(p.get('door_colour'), 'foliage.2'), 'opacity': 240, 'flat': True}, pace=.4)
        cy -= th
        if shape == 'eaves' or tiers > 1:  # sweeping roof with tips curling upward
            ew = tw * 1.25; eh = (h * .5) / tiers
            pts = [[r4(x - ew * .62), r4(cy - eh * .05)], [r4(x - ew * .5), r4(cy + eh * .12)], [r4(x - ew * .3), r4(cy + eh * .05)], [r4(x - ew * .14), r4(cy - eh * .5)], [r4(x), r4(cy - eh * .8)],
                   [r4(x + ew * .14), r4(cy - eh * .5)], [r4(x + ew * .3), r4(cy + eh * .05)], [r4(x + ew * .5), r4(cy + eh * .12)], [r4(x + ew * .62), r4(cy - eh * .05)]]
            c.add({'type': 'shape', 'points': pts, 'color': roof, 'opacity': 245, 'sharp': True}, pace=.9)
            cy -= eh * .55
        elif shape == 'flat':
            c.add({'type': 'shape', 'points': [[r4(x - tw * .55), r4(cy)], [r4(x + tw * .55), r4(cy)], [r4(x + tw * .55), r4(cy - .015)], [r4(x - tw * .55), r4(cy - .015)]], 'color': roof, 'opacity': 245, 'flat': True}, pace=.6)
        elif shape == 'dome':
            c.add({'type': 'shape', 'points': [[r4(x + tw * .45 * math.cos(a)), r4(cy - tw * .4 * math.sin(a))] for a in [i * math.pi / 14 for i in range(15)]], 'color': roof, 'opacity': 245}, pace=.9)
        else:  # gable
            ridge = cy - tw * .42
            pts = [[r4(x - tw * .6), r4(cy + .004)], [r4(x - tw * .3), r4(cy - tw * .19 + tw * .02)], [r4(x - tw * .02), r4(ridge)], [r4(x + tw * .02), r4(ridge)], [r4(x + tw * .3), r4(cy - tw * .19 + tw * .02)], [r4(x + tw * .6), r4(cy + .004)], [r4(x), r4(cy - .004)]]
            c.add({'type': 'shape', 'points': pts, 'color': roof, 'opacity': 242}, pace=1.0)
            c.add({'type': 'marks', 'area': {'polygon': pts}, 'count': 30, 'size': [.002, .004], 'aspect': [2.2, 3.2], 'rotation': 0, 'spin': .2, 'petal': True, 'colors': [toneish(c.hexof(roof), .1), toneish(c.hexof(roof), -.1)], 'batch': 5}, pace=.8)


def f_vessel(c, p):
    """A container described by its profile: widths from base to rim (each 0-1 of size), plus handle/spout/lid.
    Cup, vase, jar, bowl, teapot, basket, bottle: the profile says which; height (0-1 of size) makes it low and wide
    (a bowl is about 0.5). Open vessels show their mouth; contents colour fills it; stripes are bands round the body."""
    x, y = xy(p); s = p.get('size', .15); f = -1 if p.get('facing') == 'left' else 1; prof = p.get('profile', [.5, .6, .55, .4]); col = c.col(p.get('colour'), '#f4efe6')
    mat = p.get('material', 'ceramic'); n = len(prof); H = p.get('height', 1.0); ch = c.hexof(col)
    if n < 2: raise ValueError('vessel profile needs at least 2 widths (base -> rim)')
    lx = c.light[0]; c.add({'type': 'blob', 'x': r4(x + (-.3 if lx > x else .3) * s), 'y': r4(y + .006), 'rx': s * .45, 'ry': s * .06, 'color': 'washes.3', 'opacity': 110, 'bleed': .35}, pace=.6)
    right = [(prof[i] * .5, H * i / (n - 1)) for i in range(n)]; left = [(-u, v) for u, v in reversed(right)]
    P = frame_of(x, y, s, f)
    body = outline(P, right + left, 4)
    if p.get('handle'): c.add({'type': 'line', 'points': [P(prof[-1] * .45, H * .78), P(prof[-1] * .45 + .22, H * .65), P(prof[-1] * .45 + .2, H * .32), P(prof[0] * .45 + .05, H * .25)], 'color': toneish(ch, -.15), 'weight': 2 + 10 * s, 'curvature': .6}, pace=.6)
    if p.get('spout'): c.add({'type': 'shape', 'points': [P(-.3, H * .45), P(-.55, H * .78), P(-.58, H * .75), P(-.36, H * .32)], 'color': col, 'opacity': 245}, pace=.6)
    c.add({'type': 'shape', 'points': body, 'color': col, 'opacity': 170 if mat == 'glass' else 245, 'glint': mat in ('ceramic', 'metal')}, pace=1.1)
    if mat != 'glass':   # the side away from the light, same hue a step deeper: gives it volume
        dark = 1 if (lx < x) == (f > 0) else -1
        half = [(u, v) for u, v in right] if dark > 0 else [(u, v) for u, v in left]
        shade = [(dark * abs(u) * .25, v) for u, v in reversed(half)] + half
        c.add({'type': 'shape', 'points': outline(P, shade, 3), 'color': toneish(ch, -.1), 'opacity': 150, 'flat': True}, pace=.4)
    if p.get('stripes'):
        sc = c.col(p['stripes'], 'accents.2')
        for v in (.84, .72, .14):   # bands follow the front of the round body
            vv = v * H; w = (prof[0] + (prof[-1] - prof[0]) * v) * .5 * .97
            c.add({'type': 'line', 'points': [P(w * math.cos(a), vv - w * .26 * math.sin(a)) for a in [math.pi * i / 8 for i in range(9)]], 'color': sc, 'weight': 1.4 + 3 * s if v != .72 else .9 + 1.5 * s}, pace=.25)
    material_marks(c, body, col, mat, s)
    rim = prof[-1] * .5
    if not p.get('lid') and prof[-1] >= .5:   # an open mouth: the far rim and the inside
        mouth = ell(*P(0, H), s * rim, s * rim * .26, 18)
        c.add({'type': 'shape', 'points': mouth, 'color': toneish(ch, -.14), 'opacity': 240, 'flat': True}, pace=.5)
        if p.get('contents'):
            cc = c.col(p['contents'], '#a86f4c')
            c.add({'type': 'shape', 'points': ell(*P(0, H + .01), s * rim * .9, s * rim * .22, 18), 'color': cc, 'opacity': 240, 'flat': True}, pace=.5)
        c.add({'type': 'line', 'points': [P(rim * math.cos(a), H - rim * .26 * math.sin(a)) for a in [math.pi * i / 10 for i in range(11)]], 'color': toneish(ch, .08), 'weight': 1 + 3 * s}, pace=.3)
    elif p.get('contents'): c.add({'type': 'shape', 'points': ell(*P(0, H * .97), s * prof[-1] * .45, s * .05, 14), 'color': c.col(p['contents'], '#a86f4c'), 'opacity': 235, 'flat': True}, pace=.5)
    if p.get('lid'):
        c.add({'type': 'shape', 'points': ell(*P(0, H * 1.02), s * prof[-1] * .42, s * .05), 'color': toneish(ch, -.18), 'opacity': 220}, pace=.5)
        c.add({'type': 'shape', 'points': ell(*P(0, H * 1.1), s * .05, s * .045), 'color': col, 'opacity': 245, 'flat': True}, pace=.3)


def f_craft(c, p):
    """A boat or ship: hull length and colour, sail colour (or none), cabin colour."""
    x, y = xy(p); L = p.get('size', .2); f = -1 if p.get('facing') == 'left' else 1; P = frame_of(x, y, L, f); hull = c.col(p.get('colour'), 'accents.2'); sail = p.get('sail', '#fbf3e2')
    if sail:
        sc = c.col(sail, '#fbf3e2')
        luff = [P(.02, .12 + .7 * i / 6) for i in range(7)]; leech = [P(.02 + .42 * (1 - i / 8) * (1 + .12 * math.sin(math.pi * i / 8)), .82 - .7 * (1 - i / 8)) for i in range(9)]
        c.add({'type': 'shape', 'points': luff + leech[::-1][1:], 'color': sc, 'opacity': 245}, pace=1.0)
        c.add({'type': 'shape', 'points': [P(-.01, .7), P(-.26, .14), P(-.12, .2), P(-.02, .14)], 'color': toneish(c.hexof(sc), -.06), 'opacity': 235, 'flat': True}, pace=.7)
        c.add({'type': 'line', 'points': [P(0, .1), P(0, .85)], 'color': 'foliage.1', 'weight': .7}, pace=.4)
    if p.get('cabin'): c.add({'type': 'shape', 'points': outline(P, [(-.25, .08), (-.22, .28), (.1, .3), (.12, .08)], 3), 'color': c.col(p['cabin'], '#c98a5a'), 'opacity': 245}, pace=.6)
    # hull: a crescent riding on the water, deeper colour along the waterline
    c.add({'type': 'shape', 'points': outline(P, [(-.5, .12), (-.3, .1), (.3, .1), (.56, .16), (.38, -.01), (0, -.035), (-.4, -.005)], 4), 'color': hull, 'opacity': 245}, pace=.9)
    c.add({'type': 'shape', 'points': outline(P, [(-.42, .03), (0, .005), (.4, .03), (.36, -.005), (0, -.03), (-.38, -.003)], 3), 'color': toneish(c.hexof(hull), -.12), 'opacity': 200, 'flat': True}, pace=.4)
    c.add({'type': 'marks', 'area': {'x': x, 'y': r4(y + L * .1), 'rx': L * .45, 'ry': L * .03}, 'count': 10, 'size': [.002, .004], 'aspect': [4, 6], 'rotation': 0, 'colors': [hull, 'washes.3'], 'batch': 5}, pace=.4)


def f_round(c, p):
    """A round thing: a disc (sun, moon, fruit, lantern, ball, balloon). light_source true makes it a light that
    reflects in water; outline crescent/oval/pear changes the silhouette; flame true draws a candle-like flame."""
    x, y = xy(p); s = p.get('size', .1); r = s / 2; col = c.col(p.get('colour'), 'accents.1'); shp = p.get('outline', 'disc')
    if p.get('flame'):
        c.sources.append((x, y - s, 'flame'))
        c.add({'type': 'blob', 'x': x, 'y': r4(y - s * .95), 'rx': s * .55, 'ry': s * .55, 'color': '#fff1d6', 'opacity': 140, 'bleed': .55}, pace=.5)
        c.add({'type': 'shape', 'points': [[r4(x - s * .1), r4(y)], [r4(x - s * .1), r4(y - s * .8)], [r4(x + s * .1), r4(y - s * .82)], [r4(x + s * .1), r4(y)]], 'color': col, 'opacity': 245, 'flat': True}, pace=.5)
        c.add({'type': 'shape', 'points': petal(r4(x), r4(y - s * .95), s * .1, s * .05, -math.pi / 2, 12), 'color': '#fde8a0', 'opacity': 250, 'flat': True}, pace=.4)
        return
    if p.get('light_source'):
        c.sources.append((x, y, 'source'))
        c.add({'type': 'blob', 'x': x, 'y': y, 'rx': r * 1.7, 'ry': r * 1.5, 'color': 'highlights.1', 'opacity': 115, 'bleed': .6}, pace=.6)
    if shp == 'crescent':
        c.add({'type': 'blob', 'x': x, 'y': y, 'rx': r, 'ry': r, 'color': col, 'opacity': 245, 'medium': 'wash'}, pace=1.0)
        c.add({'type': 'blob', 'x': r4(x + r * .45), 'y': r4(y - r * .2), 'rx': r * .85, 'ry': r * .85, 'color': c.hexof('washes.1'), 'opacity': 250, 'medium': 'wash'}, pace=.6)
        return
    ry = r * (1.2 if shp == 'oval' else 1.15 if shp == 'pear' else 1)
    if p.get('light_source'):
        c.add({'type': 'blob', 'x': x, 'y': y, 'rx': r, 'ry': ry, 'color': col, 'opacity': 245, 'medium': 'wash'}, pace=1.1)
    else:
        c.add({'type': 'shape', 'points': ell(x, y, r, ry, 18) if shp != 'pear' else outline(lambda u, v: [r4(x + u * s), r4(y - v * s)], [(-.25, -.45), (-.32, -.15), (-.18, .2), (0, .45), (.18, .2), (.32, -.15), (.25, -.45), (0, -.55)], 4), 'color': col, 'opacity': 245, 'glint': True}, pace=1.0)
    if p.get('string'): c.add({'type': 'line', 'points': [[x, r4(y + ry)], [r4(x + .01), r4(y + ry + s * 1.2)]], 'color': 'foliage.2', 'weight': .7, 'curvature': .5}, pace=.3)


def f_land(c, p):
    """Landforms by shape: rolling (hills), peaks (sharp, optional snow), cliff, dune, rock, path (a road to a vanishing point).
    at = [x, ridge_y] for rolling/peaks/dune (spans the width), size = height."""
    shape = p.get('shape', 'rolling'); col = c.col(p.get('colour'), 'washes.2')
    if shape == 'path':
        vx, vy = p.get('vanish', p.get('at', [.5, .45])); w = p.get('width', .5)
        pts = [[r4(vx - .01), vy], [r4(vx + .01), vy], [r4(.5 + w / 2 + (vx - .5)), 1.02], [r4(.5 - w / 2 + (vx - .5)), 1.02]]
        c.add({'type': 'shape', 'points': pts, 'color': c.col(p.get('colour'), 'highlights.1'), 'opacity': 200}, pace=.9)
        c.add({'type': 'marks', 'area': {'polygon': pts}, 'count': 50, 'size': [.002, .005], 'aspect': [2, 3], 'rotation': 0, 'depth': True, 'colors': ['washes.1', 'washes.0', 'highlights.0'], 'batch': 6}, pace=.7)
        return
    x, y = xy(p); h = p.get('size', .12); layers = p.get('layers', 2 if shape == 'rolling' else 1)
    if shape in ('rolling', 'dune'):
        for i in range(layers):
            yy = y + i * h * .45; amp = h * (1 - i * .25); ph = c.rng.uniform(0, 6); fr = .9 if shape == 'rolling' else .5
            pts = [[-.02, yy + amp]] + [[r4(xx / 10), r4(yy + amp * (1 - .8 * (.5 + .5 * math.sin(xx * fr + ph + i))))] for xx in range(0, 11)] + [[1.02, yy + amp], [1.02, yy + amp * 1.6], [-.02, yy + amp * 1.6]]
            c.add({'type': 'shape', 'points': pts, 'color': [col, 'foliage.3', 'foliage.0'][min(i, 2)] if shape == 'rolling' else toneish(c.hexof(col), -.05 * i), 'opacity': 200 + 20 * i}, pace=.9)
            c.add({'type': 'marks', 'area': {'box': [0, yy, 1, yy + amp * 1.3]}, 'count': 40, 'size': [.002, .004], 'aspect': [1.2, 2], 'colors': ['foliage.0', 'foliage.1', 'foliage.3'] if shape == 'rolling' else [toneish(c.hexof(col), .08), toneish(c.hexof(col), -.08)]}, pace=.7)
        return
    if shape == 'peaks':
        rng = random.Random(round(x * 311 + h * 977)); peaks = p.get('count', 3)
        for i in range(layers):
            yy = y + i * h * .3; pts = [[-.02, r4(yy + h)]]
            for k in range(peaks):
                px = (k + .5) / peaks + rng.uniform(-.08, .08); ph = h * rng.uniform(.6, 1) * (1 - i * .25)
                pts += [[r4(px - .12), r4(yy + h * .55)], [r4(px), r4(yy + h - ph)], [r4(px + .12), r4(yy + h * .55)]]
            pts += [[1.02, r4(yy + h)], [1.02, r4(yy + h * 1.4)], [-.02, r4(yy + h * 1.4)]]
            c.add({'type': 'shape', 'points': pts, 'color': toneish(c.hexof(col), -.06 * i), 'opacity': 225}, pace=.9)
            if p.get('snow') and i == 0:
                for k in range(peaks):
                    px = pts[2 + k * 3][0]; pyy = pts[2 + k * 3][1]
                    c.add({'type': 'shape', 'points': [[r4(px - .04), r4(pyy + h * .14)], [px, pyy], [r4(px + .04), r4(pyy + h * .14)], [r4(px), r4(pyy + h * .1)]], 'color': '#f6f6fa', 'opacity': 245}, pace=.4)
        return
    if shape == 'cliff':
        w = p.get('width', .3); side = -1 if x < .5 else 1
        pts = outline(lambda u, v: [r4(x + u), r4(v)], [(-w / 2, y), (w / 2, y - .02), (w / 2 + .03 * side, (y + 1) / 2), (w / 2, 1.02), (-w / 2, 1.02)], 4)
        c.add({'type': 'shape', 'points': pts, 'color': col, 'opacity': 235}, pace=1.0)
        material_marks(c, pts, col, 'stone', w)
        return
    # rock: stacked soft blocks
    w = p.get('width', h * 1.6)
    pts = outline(lambda u, v: [r4(x + u * w), r4(y - v * h)], [(-.5, 0), (-.42, .55), (-.1, .95), (.25, .85), (.5, .35), (.48, 0)], 4)
    c.add({'type': 'shape', 'points': pts, 'color': col, 'opacity': 240}, pace=.9)
    material_marks(c, pts, col, 'stone', w)


def f_water(c, p):
    """Water by surface: still or ripples (a lake, sea, pond between y0 and y1), stream (a river ribbon along a path),
    fall (a waterfall: x, y0 top, y1 foot, width). Reflections appear only under a light source."""
    surface = p.get('surface', 'ripples'); col = c.col(p.get('colour'), 'washes.3')
    if surface == 'fall':
        need(p, 'x'); x, y0, y1, w = p['x'], p.get('y0', .1), p.get('y1', .75), p.get('width', .12); rock = c.col(p.get('rock'), 'foliage.2')
        for side in (-1, 1):
            c.add({'type': 'shape', 'points': outline(lambda u, v: [r4(x + u), r4(v)], [(side * w * .5, y0 - .02), (side * w * 2.2, y0 + .05), (side * w * 2.6, y1), (side * w * .55, y1 + .02), (side * w * .45, (y0 + y1) / 2)], 4), 'color': rock, 'opacity': 235}, pace=1.0)
        c.add({'type': 'shape', 'points': [[r4(x - w * .5), r4(y0)], [r4(x + w * .5), r4(y0)], [r4(x + w * .6), r4(y1)], [r4(x - w * .6), r4(y1)]], 'color': col, 'opacity': 200, 'flat': True}, pace=.7)
        c.add({'type': 'strands', 'area': {'box': [x - w * .5, y0, x + w * .5, y0 + .02]}, 'count': 40, 'length': [(y1 - y0) * .6, (y1 - y0)], 'angle': 1.57, 'spread': .02, 'sway': .003, 'colors': ['#ffffff', 'highlights.1', 'washes.0'], 'weight': [.8, 1.6], 'rim': 0, 'group': 4}, pace=1.1)
        c.add({'type': 'blob', 'x': x, 'y': r4(y1), 'rx': w * 1.6, 'ry': .05, 'color': '#ffffff', 'opacity': 170, 'bleed': .8}, pace=.5)
        return
    if surface == 'stream':
        need(p, 'path'); path = p['path']; w = p.get('width', .08)
        c.add({'type': 'marks', 'area': {'path': path, 'width': w}, 'count': 90, 'size': [.002, .004], 'aspect': [3, 5], 'rotation': 0, 'colors': [col, 'washes.2', 'highlights.1'], 'batch': 6, 'depth': True}, pace=.9)
        return
    y0, y1 = p.get('y0', .55), p.get('y1', 1.0); x0, x1 = p.get('x0', 0), p.get('x1', 1)
    c.add({'type': 'shape', 'points': [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], 'color': col, 'opacity': 150, 'medium': 'fill', 'bleed': .2, 'texture': .3}, pace=.8)
    src = next((q for q in c.sources if q[1] < y0), None)
    if surface == 'ripples':
        c.add({'type': 'marks', 'area': {'box': [x0, y0, x1, y1]}, 'count': p.get('ripples', 190), 'size': [.002, .0055], 'aspect': [4, 8], 'rotation': 0, 'spin': .04, 'depth': True,
               'colors': ['washes.1', 'highlights.1', 'washes.3', 'accents.3', 'washes.0', 'highlights.0'], 'opacity': [120, 215], 'batch': 8, **({'light': {'path': [[src[0], y0], [src[0], y1]], 'reach': .08, 'colors': ['highlights.0', 'highlights.1']}} if src else {})}, pace=.8)
    if src:
        c.add({'type': 'marks', 'area': {'path': [[src[0], y0 + .01], [src[0], y1 - .02]], 'width': .06}, 'count': 26, 'size': [.002, .004], 'aspect': [4, 7], 'rotation': 0, 'spin': .03,
               'colors': ['highlights.0', 'highlights.1'], 'opacity': [170, 235], 'batch': 6}, pace=.6, label='落下倒影…')


def f_structure(c, p):
    """Rigid constructions drawn as members: members [{points, width, colour}], panes [{points, colour}] for flat
    surfaces (a table top, a window glass), arches [{x0, x1, y, rise, colour, reflect}] (bridges, gates). Hand-drawn,
    never ruled. A window also gives opening [x0, y0, x1, y1] so indoor rain or snow falls only outside it."""
    col = c.col(p.get('colour'), 'foliage.2')
    for pn in p.get('panes', []):
        c.add({'type': 'shape', 'points': pn['points'], 'color': c.col(pn.get('colour'), col), 'opacity': pn.get('opacity', 240), **({'flat': True} if pn.get('flat', True) else {})}, pace=.8)
        if pn.get('material'): material_marks(c, pn['points'], c.col(pn.get('colour'), col), pn['material'], .3)
    for a in p.get('arches', []):
        x0, x1, y, rise = a['x0'], a['x1'], a['y'], a.get('rise', (a['x1'] - a['x0']) * .4); cx, rx = (x0 + x1) / 2, (x1 - x0) / 2
        c.add({'type': 'shape', 'points': [[r4(cx + rx * math.cos(t)), r4(y - rise * math.sin(t))] for t in [j * math.pi / 14 for j in range(15)]], 'color': c.col(a.get('colour'), 'foliage.2'), 'opacity': 225}, pace=.9)
        if a.get('reflect'): c.add({'type': 'shape', 'points': [[r4(cx + rx * math.cos(t)), r4(y + rise * .7 * math.sin(t))] for t in [j * math.pi / 14 for j in range(15)]], 'color': c.col(a.get('colour'), 'foliage.2'), 'opacity': 110}, pace=.5)
    for m in p.get('members', []):
        c.add({'type': 'line', 'points': m['points'], 'color': c.col(m.get('colour'), col), 'weight': m.get('width', 2), 'curvature': m.get('curve', .4)}, pace=m.get('pace', .5))


def f_cloth(c, p):
    """A soft sheet (curtain, tablecloth, sail, flag, scarf): its outline points, colour, folds direction, pattern colour."""
    need(p, 'points'); col = c.col(p.get('colour'), 'accents.3'); pts = p['points']
    c.add({'type': 'shape', 'points': pts, 'color': col, 'opacity': p.get('opacity', 230)}, pace=1.0)
    xs = [q[0] for q in pts]; ys = [q[1] for q in pts]
    ang = {'down': 1.57, 'across': 0}.get(p.get('folds', 'down'), 1.57)
    c.add({'type': 'strands', 'area': {'box': [min(xs), min(ys), max(xs), min(ys) + .02] if ang > 1 else [min(xs), min(ys), min(xs) + .02, max(ys)]}, 'count': 12, 'length': [(max(ys) - min(ys)) * .7, max(ys) - min(ys)] if ang > 1 else [(max(xs) - min(xs)) * .7, max(xs) - min(xs)],
           'angle': ang, 'sway': .01, 'weight': [1, 1.8], 'rim': 0, 'brush': 'marker', 'colors': [toneish(c.hexof(col), -.06), toneish(c.hexof(col), .05)], 'group': 3}, pace=.5)
    if p.get('pattern'): material_marks(c, pts, col, None, .3, markings={'colour': p['pattern'], 'pattern': 'spots'})


def f_free(c, p):
    """Raw motifs for anything the forms cannot express (see references/painting-grammar.md)."""
    need(p, 'ops')
    for op in p['ops']: c.add(op)


FORMS = {'figure': f_figure, 'animal': f_animal, 'bird': f_bird, 'fish': f_fish, 'insect': f_insect, 'plant': f_plant, 'building': f_building,
         'vessel': f_vessel, 'craft': f_craft, 'round': f_round, 'land': f_land, 'water': f_water, 'structure': f_structure, 'cloth': f_cloth, 'free': f_free}
FORM_HELP = {k: (v.__doc__ or '').strip() for k, v in FORMS.items()}
COMMON = 'name (the request\'s own word), at [x, y] (where it stands), size, facing left/right or look_at [x, y], role "extra", layer, label'
FIELDS = {
 'figure': 'pose stand|walk|sit; clothes {upper, lower, length short|long, over (shawl colour), pattern}; hair {colour, style short|long|bun}; skin; shoes; headwear {shape crown|hat, colour}; holds {shape canopy|bunch|rod, colour}; seat (colour of what they sit on)',
 'animal': 'colour; build {body, legs, neck, head} each 0-1; ears pointed|round|long|drop|none; snout flat|short|long; tail thin|brush|short|long|none; pose stand|walk|graze|drink|sit|lie|face (graze/drink: head lowered to the ground or water); markings {colour, pattern stripes|spots|patch|belly, blaze}; material fur|scale|skin; eyes (face pose)',
 'bird': 'colour; wing; breast; head_colour; beak_colour; build {neck, legs, beak} each 0-1; pose perch|stand|fly|swim; count (>1 with fly = distant flock); crown; tail_colour; wingtips',
 'fish': 'colour; markings {colour}; angle (radians) or facing',
 'insect': 'colour; wing; wings narrow|broad',
 'plant': 'habit tree|shrub|stems|grass|cane|reed|floating|vine; colour (leaves); size; width; count; crown round|cone|weeping|spray (tree); lean; trunk; bloom {colour, shape cup|star|disc|cluster|bud|spray|rose, count, buds}; fruit {colour, count}',
 'building': 'walls {width, height, colour}; roof {shape gable|eaves|flat|dome, colour, tiers}; open (true = columns only); columns (colour); windows (count); door; door_colour; lit; spans (wall across the scene); wall_colour',
 'vessel': 'profile [widths base -> rim, 0-1]; height (0-1 of size, bowl ~0.5); colour; material ceramic|glass|metal|wicker|wood; handle; spout; lid; stripes; contents (colour)',
 'craft': 'size (length); colour (hull); sail (colour or false); cabin (colour)',
 'round': 'colour; size (diameter); outline disc|crescent|oval|pear; light_source; flame; string',
 'land': 'shape rolling|peaks|dune|cliff|rock|path; at [x, ridge y]; size (height); layers; count; snow; colour; width; vanish [x, y] (path)',
 'water': 'surface ripples|still|stream|fall; y0, y1, x0, x1; colour; path + width (stream); x, y0, y1, width, rock (fall)',
 'structure': 'members [{points, width, colour}]; panes [{points, colour, material}]; arches [{x0, x1, y, rise, colour, reflect}]; opening [x0, y0, x1, y1] (a window)',
 'cloth': 'points (outline); colour; folds down|across; pattern',
 'free': 'ops [raw strokes, see references/painting-grammar.md]',
}
GROUNDED = {'figure': .35, 'animal': 1.0, 'building': 1.0}

# ------------------------------------------------------------------ 章法: hierarchy, harmony, depth
# The originals have one subject in full colour and contrast; everything else is its setting,
# painted in the picture's two or three colour families and fading toward the air with distance.
SUBJECT_FORMS = {'figure', 'animal', 'bird', 'fish', 'insect', 'vessel', 'craft', 'round'}


def families(palette):
    pick = lambda role, i=0: (palette.get(role) or ['#888888'])[i]
    return [hls(h)[0] for h in (pick('washes'), pick('foliage'), pick('accents', 1), pick('washes', 3))]


def harmonise(h, fams, pull):
    """Turn a colour part of the way toward the nearest colour family of the picture."""
    hh, l, s = hls(h)
    if s < .08: return h
    near = min(fams, key=lambda f: abs(((hh - f + .5) % 1) - .5))
    d = ((near - hh + .5) % 1) - .5
    if abs(d) * 360 < 25: return h
    return from_hls((hh + d * pull) % 1, l, s)


def settle(c, ops, t, sp):
    """Place one thing in the picture's order: subjects keep their colour, settings join the families,
    and anything standing far back fades toward the air (lighter, cooler, softer)."""
    subject = t.get('form') in SUBJECT_FORMS and t.get('role') != 'extra' and not t.get('light_source')
    view = sp.get('view', 'eye'); hz = sp.get('horizon', .5)
    y = (t.get('at') or [0, 1])[1]
    far = 0.0
    if view == 'eye' and 'at' in t: far = clamp((hz + .1 - y) / .25, 0, 1) if y < hz + .1 else 0.0
    if t.get('role') == 'extra': far = max(far, .45)
    if subject and far == 0: return
    fams = families(c.palette); air = c.palette['washes'][0]
    def tone(v):
        if not isinstance(v, str): return v
        h = c.hexof(v) if not v.startswith('#') else v
        if not (isinstance(h, str) and h.startswith('#')) or hls(h)[1] > .94: return v
        if not subject: h = harmonise(h, fams, .3)
        if far: h = mix(h, air, .4 * far)
        return h
    for o in ops:
        if o.get('type') in ('touches',): continue
        for k in ('color', 'deep', 'pale'):
            if k in o: o[k] = tone(o[k])
        if isinstance(o.get('colors'), list): o['colors'] = [tone(v) for v in o['colors']]
        if far and isinstance(o.get('opacity'), (int, float)): o['opacity'] = round(o['opacity'] * (1 - .25 * far))

AIR = {
    'rain': ({'type': 'strands', 'area': {'box': [-.05, -.05, 1, .85]}, 'count': 90, 'length': [.035, .08], 'angle': 1.82, 'spread': .03, 'sway': .002, 'weight': [.35, .6], 'rim': 0, 'colors': ['highlights.1', '#e6edf6', 'washes.2'], 'group': 4}, .7, '落下细雨…'),
    'snow': ({'type': 'marks', 'area': {'box': [0, 0, 1, 1]}, 'count': 160, 'size': [.0015, .003], 'colors': ['#ffffff', 'highlights.1'], 'opacity': [200, 250], 'batch': 10}, .7, '飘起小雪…'),
    'petals': ({'type': 'marks', 'area': {'box': [0, .1, 1, .95]}, 'count': 60, 'size': [.002, .004], 'aspect': [1.4, 2], 'spin': 3, 'colors': ['accents.0', 'accents.3', 'highlights.1'], 'batch': 6}, .7, '飘落花瓣…'),
    'stars': ({'type': 'marks', 'area': {'box': [0, 0, 1, .4]}, 'count': 40, 'size': [.001, .0022], 'colors': ['highlights.1', 'highlights.0'], 'opacity': [210, 250], 'batch': 8}, .6, '亮起星星…'),
    'fireflies': ({'type': 'marks', 'area': {'box': [0, .4, 1, .95]}, 'count': 36, 'size': [.002, .004], 'colors': ['highlights.0', '#f8f0a0'], 'opacity': [220, 250], 'batch': 6}, .7, '飞起萤火…'),
    'mist': ({'type': 'blob', 'x': .5, 'y': .55, 'rx': .7, 'ry': .08, 'color': 'highlights.1', 'opacity': 120, 'bleed': .8}, .8, '升起薄雾…'),
}


def integrate(c, t, sp, start):
    """Settle a grounded thing into its world: a contact shadow under it, tufts over its foot line, a thin veil of air."""
    if sp.get('view', 'eye') not in ('eye',) or 'at' not in t: return
    x, y = t['at']; size = t.get('size', .3)
    w = (t.get('walls', {}).get('width', size) if t['form'] == 'building' else size * GROUNDED[t['form']])
    hz = sp.get('horizon', .55)
    if y < hz: return
    lx = c.light[0]
    c.add({'type': 'blob', 'x': r4(x + (-.25 if lx > x else .25) * w), 'y': r4(y + .006), 'rx': max(.02, w * .6), 'ry': max(.006, size * .045), 'color': 'foliage.2', 'opacity': 120, 'bleed': .3}, pace=.4)
    sh = c.ops.pop(); sh['label'] = c.ops[start].pop('label', None)
    if not sh['label']: sh.pop('label')
    c.ops.insert(start, sh)
    c.add({'type': 'marks', 'area': {'x': x, 'y': r4(y - .004), 'rx': max(.02, w * .65), 'ry': max(.006, size * .05)}, 'count': max(8, int(10 + 40 * w)), 'size': [.0018, .0035], 'aspect': [2, 3.2], 'rotation': -1.57, 'spin': .45, 'petal': True,
           'colors': ['foliage.0', 'foliage.3', 'foliage.1', 'washes.2'], 'batch': 6}, pace=.5)


ENVIRONMENT = [
    (('下雪', '雪夜', '雪地', '大雪', '小雪', '飘雪', '风雪', '雪中', '落雪', '暮雪', '江雪', 'snow'), lambda b: 'snow' in b.get('air', []), '要求里有雪：air 里加 "snow"，colours.ground 用接近白的颜色（房子、动物要站在雪地上）'),
    (('雨', 'rain'), lambda b: 'rain' in b.get('air', []), '要求里有雨：air 里加 "rain"'),
    (('夜', '明月', '月亮', '月光', '月色', '望月', 'night', 'moon'), lambda b: 'stars' in b.get('air', []) or any(t.get('light_source') for t in b.get('things', [])), '要求里是夜晚：air 加 "stars"，或画一个 light_source 的 round（月亮/灯）；colours 用夜的颜色'),
    (('阳光', '午后', '日光', '照进', 'sunlight', 'sunny'), lambda b: 'sunlight' in b.get('air', []) or any(t.get('light_source') for t in b.get('things', [])), '要求里有阳光：室内 air 加 "sunlight"（窗形光斑），室外画一个 light_source 的 round（太阳）或靠暖色 colours'),
    (('雾', 'mist', 'fog'), lambda b: 'mist' in b.get('air', []), '要求里有雾：air 里加 "mist"'),
    (('落花', '花瓣', 'petal'), lambda b: 'petals' in b.get('air', []), '要求里有花瓣飘落：air 里加 "petals"'),
    (('萤火', 'firefl'), lambda b: 'fireflies' in b.get('air', []), '要求里有萤火虫：air 里加 "fireflies"'),
]
GENERIC_NAMES = {'远景', '近景', '中景', '树影', '流水', '水面', '小舟', '诗意细节', '细节', '背景', '前景', '点缀', '氛围', '群落', '远山', '花簇', '草地', '装饰'}


def environment_gaps(brief):
    text = ' '.join([brief.get('title', ''), brief.get('request', '')] + list(brief.get('checklist', []))).lower()  # the request, not the things' names (a 雪山 is not snowfall)
    return [msg for words, ok, msg in ENVIRONMENT if any(w in text for w in words) and not ok(brief)]


def bed(c, brief, sp, at):
    """疏密: the originals set their subject in one soft, layered mass (Garden's green bed under the
    flowers, Oranges' leaf cloud, Willow's curtain) and leave the rest open. Lay three to five
    translucent, overlapping washes in the picture's own colours behind the subject group,
    widest at its foot and fading out, so the open space has something to breathe against."""
    if brief.get('bed') is False or sp.get('view', 'eye') not in ('eye', 'top'): return
    group = [t for t in brief.get('things', []) if 'at' in t and t.get('role') != 'extra'
             and t.get('form') in ('figure', 'animal', 'plant', 'building', 'vessel', 'craft')]   # things that stand on something
    if not group: return
    xs = [t['at'][0] for t in group]; ys = [t['at'][1] for t in group]
    cx = sum(xs) / len(xs); foot = max(ys); span = max(.22, max(xs) - min(xs) + .2)
    tall = max(t.get('size', .2) for t in group)
    wet = any(t.get('form') == 'water' and t.get('surface', 'ripples') in ('ripples', 'still') and t.get('y0', .55) <= foot for t in brief.get('things', []))
    cols = ['washes.1', 'accents.3', 'highlights.1', 'washes.0', 'washes.2', 'accents.3'] if wet else ['foliage.3', 'washes.2', 'accents.3', 'foliage.0', 'foliage.3', 'washes.1']
    ops = []
    for i in range(6):
        dx = c.rng.uniform(-.55, .55) * span; dy = c.rng.uniform(-.12, .06) * tall - i * tall * .05
        rx = c.rng.uniform(.17, .27) * (1.15 - i * .1); ry = rx * c.rng.uniform(.36, .58)
        ops.append({'type': 'blob', 'x': r4(min(.95, max(.05, cx + dx))), 'y': r4(min(.97, foot + dy)), 'rx': r4(rx), 'ry': r4(ry),
                    'color': cols[i], 'opacity': [190, 165, 150, 140, 160, 130][i], 'bleed': .6, 'texture': .45, 'id': f'bed-{i}'})
    ops[0]['label'] = '晕开一片底色…'
    c.ops[at:at] = ops


def composition_gaps(brief):
    """章法 the originals keep (koi on a diagonal, the sail at .6, oranges massed to one side):
    the subject off the centre line, one large mass that fills most of the picture and runs off its
    edges; wide open space only when the subject is emptiness itself. Returns (refusals, advice).
    Photos keep the photo's own composition."""
    things = [t for t in brief.get('things', []) if 'at' in t and t.get('form') != 'free']
    photo = brief.get('source') == 'photo' or any(k in str(brief.get('request', '')) for k in ('照片', 'photo', 'Photo'))
    view = brief.get('space', {}).get('view', 'eye')
    refuse, advice = [], []
    lead = [t for t in things if t.get('form') in SUBJECT_FORMS and t.get('role') != 'extra' and not t.get('light_source') and int(t.get('count', 1) or 1) == 1]
    main = max(lead, key=lambda t: t.get('size', 0), default=None)
    core = [t for t in things if t.get('role') != 'extra']
    # the thing the picture is about: the largest named thing that is not ground, water or a frame
    hero = max([t for t in core if t.get('form') not in ('land', 'water', 'structure', 'cloth')], key=lambda t: t.get('size', 0), default=None)
    centred = [t for t in core if abs(t['at'][0] - .5) < .08 and t.get('form') not in ('land', 'water', 'cloth')]   # a cloth or ground spanning the width is not a column
    if not photo and len(core) >= 3 and len(centred) >= .6 * len(core) and (hero is None or abs(hero['at'][0] - .5) < .08):
        refuse.append('CENTRED STACK: ' + '、'.join(t['name'] for t in centred) + ' all stand on the centre line (x≈0.5), stacked like a column. '
                      'Put the subject near a third (x≈0.33 or 0.67) and let the main mass sweep across the picture (a diagonal, a band, a frame from one side), overlapping front and back.')
    if view == 'interior' and any(t.get('form') == 'building' for t in brief.get('things', [])):
        advice.append('INTERIOR BUILDING: building paints a whole house with posts; indoors, paint walls, windows and shelves with structure and cloth.')
    bars = [m for t in brief.get('things', []) if t.get('form') == 'structure' for m in t.get('members', [])
            if len(m.get('points', [])) >= 2 and max(abs(m['points'][0][1] - m['points'][-1][1]), abs(m['points'][0][0] - m['points'][-1][0])) > .45]
    hair = [t.get('name') for t in brief.get('things', []) if t.get('form') == 'structure'
            for m in t.get('members', []) if float(m.get('width', 2) or 2) <= 1.2 and len(m.get('points', [])) >= 2
            and sum(math.hypot(b[0] - a[0], b[1] - a[1]) for a, b in zip(m['points'], m['points'][1:])) > .2]
    if hair:
        advice.append('HAIRLINE: ' + '、'.join(dict.fromkeys(hair)) + ' outlined with long thin lines; the originals never outline man-made things. '
                      'Paint a window, frame, wall or table as panes (colour fields); keep lines for things that are thin by nature (stems, twigs, string, hair).')
    if len(bars) >= 4:
        advice.append(f'CAGE: {len(bars)} long straight members cross the picture and cut it into a grid; keep two or three, shorten the rest, let leaves, cloth or light break them.')
    return refuse, advice


def imagery_gaps(brief):
    names = ' '.join(str(t.get('name', '')) for t in brief.get('things', [])) + ' ' + ' '.join(AIR[a][2] for a in brief.get('air', []) if a in AIR) + (' 阳光 日光' if 'sunlight' in brief.get('air', []) else '')
    missing = [w for w in brief.get('imagery', []) if w and w not in names]
    generic = [t.get('name') for t in brief.get('things', []) if t.get('name') in GENERIC_NAMES]
    return missing, generic


def squeeze(op, ax, k):
    """Keep shapes round on a non-square canvas: pull horizontal offsets toward the thing's anchor by k = H/W."""
    X = lambda x: r4(ax + (x - ax) * k); o = json.loads(json.dumps(op))
    if isinstance(o.get('x'), (int, float)): o['x'] = X(o['x'])
    if isinstance(o.get('rx'), (int, float)): o['rx'] = r4(o['rx'] * k)
    if 'points' in o: o['points'] = [[X(x), y] for x, y in o['points']]
    if 'at' in o: o['at'] = [[X(q[0])] + q[1:] for q in o['at']]
    a = o.get('area')
    if isinstance(a, dict):
        if 'x' in a: a['x'] = X(a['x'])
        if 'rx' in a: a['rx'] = r4(a['rx'] * k)
        if 'box' in a: a['box'] = [X(a['box'][0]), a['box'][1], X(a['box'][2]), a['box'][3]]
        for key in ('polygon', 'path'):
            if key in a: a[key] = [[X(x), y] for x, y in a[key]]
    for key in ('fan', 'swirl'):
        if isinstance(o.get('flow'), dict) and key in o['flow']: o['flow'][key] = [X(o['flow'][key][0]), o['flow'][key][1]]
    if isinstance(o.get('light'), dict) and 'path' in o['light']: o['light']['path'] = [[X(x), y] for x, y in o['light']['path']]
    return o


def depth(t):
    if 'at' in t: return t['at'][1]
    if 'y0' in t: return t['y0']
    if 'vanish' in t: return t['vanish'][1]
    return .5


def compose(brief):
    palette = palette_from(brief.get('colours') or {})
    c = Ctx(brief, palette)
    cv = brief.get('canvas') or {'width': 600, 'height': 600}; aspect = round(cv['height'] / cv['width'], 4)
    sp = brief.get('space', {})
    space_base(c, sp)
    bg_end = len(c.ops)
    things = brief.get('things', [])
    if not things: raise ValueError('things is empty: draw what the request names')
    for t in sorted(things, key=lambda t: (t.get('layer', 0), depth(t))):
        form = t.get('form')
        if form not in FORMS: raise ValueError(f'thing 「{t.get("name")}」: form must be one of {list(FORMS)}; describe the thing with the form that fits its build')
        if not t.get('name'): raise ValueError(f'every thing needs a name taken from the request (form {form})')
        if 'look_at' in t and 'at' in t: t = {**t, 'facing': 'left' if t['look_at'][0] < t['at'][0] else 'right'}
        if t.get('role') == 'extra' and 'size' in t: t = {**t, 'size': t['size'] * .55}
        start = len(c.ops)
        ax, ay = (t['at'] if 'at' in t else (c.light[0], .5)); sz = t.get('size', 0)
        dx, dy = c.light[0] - ax, c.light[1] - (ay - sz * .5); L = math.hypot(dx, dy) or 1; c.cur_light = [round(dx / L, 3), round(dy / L, 3)]
        try:
            FORMS[form](c, t)
        except KeyError as e:
            raise KeyError(f'{e.args[0]} (thing 「{t.get("name")}」, form {form})')
        if aspect != 1 and 'at' in t and form != 'free': c.ops[start:] = [squeeze(o, t['at'][0], aspect) for o in c.ops[start:]]
        if len(c.ops) > start and not c.ops[start].get('label'): c.ops[start]['label'] = t.get('label') or f'画出{t["name"]}…'
        c.cur_light = None
        if t.get('integrate', True) and form in GROUNDED and len(c.ops) > start: integrate(c, t, sp, start)
        if form != 'free': settle(c, c.ops[start:], t, sp)
    bed(c, brief, sp, bg_end)
    for a in brief.get('air', []):
        if a == 'sunlight':
            if sp.get('view') != 'interior': continue  # outdoors, sunlight is the palette and the lit edges
            lx, ly = c.light; tx, ty = brief.get('sunlight_to', [min(.95, lx + .35) if lx < .5 else max(.05, lx - .35), .78]); ux = math.cos(math.atan2(ty - ly, tx - lx))
            for dx in (-.07, .07):
                cx, cy = tx + dx, ty
                c.add({'type': 'shape', 'points': [[r4(cx - .06 + ux * .02), r4(cy - .035)], [r4(cx + .055 + ux * .03), r4(cy - .035)], [r4(cx + .06), r4(cy + .035)], [r4(cx - .055), r4(cy + .035)]], 'color': '#fff3d6', 'opacity': 150, 'hand': .8}, pace=.7, label='照进阳光…' if dx < 0 else None)
            c.add({'type': 'blob', 'x': tx, 'y': ty, 'rx': .2, 'ry': .07, 'color': '#fdeccc', 'opacity': 130, 'bleed': .7}, pace=.5)
            continue
        if a not in AIR: raise ValueError(f'air: {a!r} is not an effect; effects are {list(AIR) + ["sunlight"]}')
        op, pace, label = AIR[a]; op = json.loads(json.dumps(op))
        if sp.get('view') == 'interior' and a in ('rain', 'snow', 'stars', 'mist'):  # weather stays outside the window
            win = next((t.get('opening') for t in things if t.get('opening')), None)
            if not win: continue
            x0, y0, x1, y1 = win
            if 'area' in op: op['area'] = {'box': [x0 + .01, y0 + .01, x1 - .01, y1 - .03]}
            if op['type'] == 'strands': op['length'] = [.02, .05]; op['count'] = 40
            if op['type'] == 'blob': op.update(x=(x0 + x1) / 2, y=(y0 + y1) / 2, rx=(x1 - x0) * .45, ry=(y1 - y0) * .2)
        c.add(op, pace=pace, label=label)
    water = next((t for t in things if t.get('form') == 'water' and t.get('surface', 'ripples') in ('ripples', 'still')), None)
    src = next((q for q in c.sources if water and q[1] < water.get('y0', .55)), None)
    if src:  # 3-5 glints on the reflection path, as in the originals; nowhere else
        c.add({'type': 'touches', 'area': {'path': [[src[0], water.get('y0', .55) + .02], [src[0], min(.95, water.get('y1', 1) - .03)]], 'width': .05}, 'count': 4, 'angle': 0, 'spread': .08}, label='点上几点光…')
    for o in c.ops:  # tiny details (eyes, nostrils, ear insides) barely change the picture: give them little time
        pts = o.get('points')
        if pts and o['type'] in ('shape', 'line'):
            span = max(max(q[0] for q in pts) - min(q[0] for q in pts), max(q[1] for q in pts) - min(q[1] for q in pts))
            if span < .03: o['pace'] = min(o.get('pace', 1), .25)
    anim = {'duration_ms': brief.get('duration_ms', max(9000, min(14000, 6000 + 180 * len(c.ops)))), 'hold_ms': 1500, 'loop': False, 'phrases': [sp.get('label', '铺开底色…'), '完成']}
    plan = {'version': 4, 'title': brief['title'], 'seed': brief.get('seed', 1), 'palette': palette, 'animation': anim, 'strokes': c.ops}
    clean_plan(plan)
    if brief.get('canvas'): plan['canvas'] = {'width': int(cv['width']), 'height': int(cv['height'])}
    return plan


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('brief', nargs='?'); ap.add_argument('--out'); ap.add_argument('--forms', action='store_true')
    ap.add_argument('--allow-missing-imagery', action='store_true', help='maintenance only')
    a = ap.parse_args()
    if a.forms:
        print('every thing:', COMMON, '\n')
        for k, v in FORM_HELP.items(): print(f'{k}: ' + ' '.join(v.split()).split('.')[0] + '.\n  fields: ' + FIELDS[k] + '\n')
        print('air effects:', ', '.join(list(AIR) + ['sunlight']))
        sys.exit(0)
    if not a.brief or not a.out: ap.error('brief and --out are required')
    brief = json.loads(Path(a.brief).read_text())
    try:
        plan = compose(brief)
    except KeyError as e:
        ap.exit(2, f'BRIEF ERROR: missing {e}. Run --forms to see what each form needs.\n')
    except (ValueError, TypeError) as e:
        ap.exit(2, f'BRIEF ERROR: {e}\n')
    errs = check_v4(plan)
    if errs: ap.exit(2, 'PLAN ERROR (report this; the brief was accepted but expanded badly):\n' + '\n'.join(errs) + '\n')
    for msg in environment_gaps(brief): print('MISSING ENVIRONMENT:', msg)
    if not brief.get('imagery'): print('MISSING IMAGERY: list every concrete thing the request names in "imagery".')
    missing, generic = imagery_gaps(brief)
    for w in missing: print(f'MISSING IMAGERY: 「{w}」 is in the request but no thing is named for it.')
    if generic: print('GENERIC NAMES:', '、'.join(generic), '— name things after the request\'s own words.')
    if (missing or not brief.get('imagery')) and not a.allow_missing_imagery:
        ap.exit(3, 'REFUSED: every image in the request must be painted. Fix the brief, then compile again.\n')
    refuse, advice = composition_gaps(brief)
    for msg in refuse + advice: print(msg)
    if refuse and not a.allow_missing_imagery:
        ap.exit(3, 'REFUSED: the composition has no lead (see above). Rearrange the things, then compile again.\n')
    hz = brief.get('space', {}).get('horizon', .55)
    for t in brief.get('things', []):
        for o in (t.get('ops', []) if t.get('form') == 'free' else []):
            ar = o.get('area') or {}; y = ar.get('y', (ar.get('box') or [0, 1, 0, 1])[1] if 'box' in ar else 1)
            if o.get('type') in ('marks', 'touches') and isinstance(y, (int, float)) and y < hz * .7 and not (ar.get('polygon') or ar.get('path')):
                print(f"SKY MARKS: 「{t.get('name')}」 scatters {o['type']} over the sky; skies are washes and soft blobs, not dots.")
    Path(a.out).write_text(json.dumps(plan, ensure_ascii=False, indent=1))
    print(f"OK {a.out}: {len(plan['strokes'])} motifs, {plan['animation']['duration_ms']} ms")
    if brief.get('checklist'):
        print('Look at final.png and answer each item yes/no; fix the brief for every no:')
        for i, item in enumerate(brief['checklist'], 1): print(f'  [{i}] {item}')
