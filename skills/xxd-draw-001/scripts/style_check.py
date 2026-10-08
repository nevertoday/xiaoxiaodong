#!/usr/bin/env python3
"""Measure a final frame (and optionally its plan) against the twelve originals.

The thresholds come from all twelve originals' final frames (600×600, same renderer):
colourfulness 8.9–24.8, mud ≤ 0.07, mean value 0.68–0.88, earth (brown/ochre) ≤ 0.015. Hue families range 1–6:
Sail is a quiet one-family seascape, so hue variety is advice, not a gate.
The earlier grey v3 examples scored colourfulness 5.7–6.4 and still fail.
Passing proves the colour/density register matches; it does not judge content.
"""
import argparse, colorsys, json, math, sys
from pathlib import Path
from PIL import Image

LIMITS = {'colorful': 8.0, 'huebins': 3, 'mud': 0.08, 'value': 0.65, 'earth': 0.05}
COLONY = {'leaves', 'marks', 'strands', 'glazes', 'flowers', 'pads', 'touches'}


def open_space(path, n=15):
    """留白: share of the picture that is calm (no edges, little variation) AND light — sky, water, paper.
    Twelve originals average 0.36 (0.27-0.68; the koi, oranges and willow close-ups are full fields near 0)."""
    from PIL import ImageFilter
    im = Image.open(path).convert('L').resize((300, 300)); edges = im.filter(ImageFilter.FIND_EDGES)
    L = list(im.get_flattened_data() if hasattr(im, 'get_flattened_data') else im.getdata())
    E = list(edges.get_flattened_data() if hasattr(edges, 'get_flattened_data') else edges.getdata())
    c = 300 // n; cells = []
    for gy in range(n):
        for gx in range(n):
            idx = [(gy * c + y) * 300 + gx * c + x for y in range(0, c, 2) for x in range(0, c, 2)]
            vals = [L[i] for i in idx]; mean = sum(vals) / len(vals)
            sd = math.sqrt(sum((v - mean) ** 2 for v in vals) / len(vals)); em = sum(E[i] > 40 for i in idx) / len(idx)
            cells.append((mean, sd < 9 and em < .04))
    # Open space is the calm field that reaches the edge of the picture (sky, water, wall, paper):
    # a big flat subject sitting inside the picture is calm too, but it is not 留白.
    # Light enough to read as ground rather than mass (a dusk or rainy-night sky still counts).
    ok = [calm and mean >= 150 for mean, calm in cells]
    seen, stack = set(), [i for i in range(n * n) if ok[i] and (i < n or i >= n * (n - 1) or i % n in (0, n - 1))]
    while stack:
        i = stack.pop()
        if i in seen: continue
        seen.add(i); y, x = divmod(i, n)
        for j in ((i - n) if y else None, (i + n) if y < n - 1 else None, (i - 1) if x else None, (i + 1) if x < n - 1 else None):
            if j is not None and ok[j] and j not in seen: stack.append(j)
    return round(len(seen) / (n * n), 3)


def image_metrics(path):
    im = Image.open(path).convert('RGB').resize((120, 120))
    px = list(im.get_flattened_data() if hasattr(im, 'get_flattened_data') else im.getdata())
    n = len(px); value = mud = vivid = earth = 0; rg = []; yb = []; hist = [0] * 12
    for r, g, b in px:
        r, g, b = r / 255, g / 255, b / 255
        h, s, v = colorsys.rgb_to_hsv(r, g, b)
        value += v; mud += s < .12 and v < .75
        earth += .04 <= h <= .17 and .2 <= s <= .65 and v < .72   # brown / ochre / tan: absent from every original
        rg.append(r - g); yb.append(.5 * (r + g) - b)
        if s > .2:
            hist[int(h * 12) % 12] += 1; vivid += 1
    def stats(xs):
        mean = sum(xs) / len(xs)
        return math.sqrt(sum((x - mean) ** 2 for x in xs) / len(xs)), mean
    (srg, mrg), (syb, myb) = stats(rg), stats(yb)
    return {'colorful': round(100 * (math.hypot(srg, syb) + .3 * math.hypot(mrg, myb)), 2),
            'huebins': sum(1 for c in hist if c > max(1, .03 * vivid)),
            'mud': round(mud / n, 3), 'value': round(value / n, 3), 'earth': round(earth / n, 3), 'open': open_space(path)}


def _span(o):
    pts = o.get('points') or [[0, 0]]
    return max(max(p[0] for p in pts) - min(p[0] for p in pts), max(p[1] for p in pts) - min(p[1] for p in pts))


def plan_metrics(plan):
    ops = plan.get('strokes', [])
    colony = [o for o in ops if o.get('type') in COLONY]
    return {'version': plan.get('version'), 'colony_ops': len(colony),
            'colony_marks': sum(len(o.get('at', [])) or o.get('count', 0) for o in colony),
            # only LARGE shapes count: small features (eyes, lips, windows) are not the flat-vector problem
            'shape_share': round(sum(o.get('type') == 'shape' and _span(o) > .1 for o in ops) / max(1, len(ops)), 2),
            'glazes': sum(o.get('count', 0) for o in ops if o.get('type') == 'glazes')}


def check(image, plan=None):
    m = image_metrics(image); out = {'image': m, 'checks': {}}
    c = out['checks']
    c['colorful'] = m['colorful'] >= LIMITS['colorful']
    out['advice'] = [] if m['huebins'] >= LIMITS['huebins'] else ['huebins']
    if m['open'] < .15: out['advice'].append('open')
    c['mud'] = m['mud'] <= LIMITS['mud']
    c['value'] = m['value'] >= LIMITS['value']
    c['earth'] = m['earth'] <= LIMITS['earth']
    if plan is not None:
        p = plan_metrics(plan); out['plan'] = p
        c['plan_version'] = p['version'] == 4
        c['colonies'] = p['colony_ops'] >= 3 and p['colony_marks'] >= 100
        c['not_all_shapes'] = p['shape_share'] <= .55
        if p['glazes'] > 24: out['advice'].append('glazes')
        if sum(o.get('count', 0) for o in plan.get('strokes', []) if o.get('type') == 'touches') > 8: out['advice'].append('touches')
    out['pass'] = all(c.values())
    return out


HINTS = {
    'colorful': '颜色太灰：brief 的 colours 换成这个题材本来更鲜明的颜色（compose 会提亮），不要选灰褐。',
    'huebins': '色相太单一：至少三个色相家族——底色洗、植物/结构、强调色、暖高光各占一份。',
    'mud': '有脏灰暗块：大面积深色改成 foliage 深色小块或半透明洗，不用灰色不透明剪影。',
    'value': '整体太暗：原作纸色和高明度洗色占大头，深色只在框景和接触暗部。',
    'earth': '土色太多（褐、赭、土黄）：原作一个都没有。木头、头发、大衣也挑干净的颜色（焦糖、赭红、杏色），暗部用深绿、深靛。',
    'plan_version': 'plan 要由 compose.py 生成。',
    'colonies': '主角那一组太单薄：原作的主角周围总有成片的小笔触。只在主角那一组里加它的环境：草（plant grass）、水纹（water ripples）、叶与花（plant shrub/stems）、布纹（cloth pattern），或 free 里的 marks；留白的地方不加。',
    'touches': '亮点太多：原作一幅只有 3–5 个，而且只在水面倒影或湿亮表面上；到处撒会像脏点。',
    'glazes': '透明长釉线太多：原作一幅最多十来道（柳岸 7 道），几十道叠在一起会变成一摞直条；减到 24 以内，换成 marks/strands/arcs。',
    'open': '留白太少：原作平均三成多画面是什么都没有的平静空地（天、水、纸面）。主角可以小（原作的帆只有画面六分之一高），把东西收拢到画面一侧或下半，空出一片天或水；别往空处补小笔触。满幅特写（水面、花丛）和照片题可以不改。',
    'not_all_shapes': 'shape 太多：主体用几块干净平涂，其余交给群落、线和光。',
}

if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('image'); p.add_argument('--plan')
    a = p.parse_args()
    result = check(a.image, json.loads(Path(a.plan).read_text()) if a.plan else None)
    print(json.dumps(result, ensure_ascii=False, indent=1))
    for k, ok in result['checks'].items():
        if not ok: print('FIX', k, '—', HINTS[k])
    for k in result.get('advice', []): print('ADVICE', k, '—', HINTS[k] + ('（安静单色调的题材可以不改，如原作 Sail）' if k == 'huebins' else ''))
    print('STYLE PASS' if result['pass'] else 'STYLE FAIL')
    sys.exit(0 if result['pass'] else 1)
