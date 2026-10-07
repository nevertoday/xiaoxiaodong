#!/usr/bin/env python3
"""Turn a user photo into drawing aids: the photo fitted into the square painting with a
coordinate grid, the photo's own colours for the brief (air, ground, life, accent, light;
compose.py lifts them into the painting's clean register), and rough layout facts.

It does NOT recognise objects. Look at grid.png yourself, then read positions
(0-1, x right, y down) straight off the grid labels when writing the plan.

  python3 analyze_image.py photo.jpg --out WORKDIR [--crop-x 0.5] [--crop-y 0.5]

Writes WORKDIR/grid.png, WORKDIR/colours.json, WORKDIR/layout.json.
"""
import argparse, colorsys, json, math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


def square_crop(im, cx, cy):
    w, h = im.size; s = min(w, h)
    x0 = round(max(0, min(w - s, cx * w - s / 2))); y0 = round(max(0, min(h - s, cy * h - s / 2)))
    return im.crop((x0, y0, x0 + s, y0 + s)), (x0 / w, y0 / h, (x0 + s) / w, (y0 + s) / h)


def font(size):
    for f in ['/System/Library/Fonts/PingFang.ttc', '/Library/Fonts/Arial Unicode.ttf', '/System/Library/Fonts/Helvetica.ttc']:
        try: return ImageFont.truetype(f, size)
        except OSError: pass
    return ImageFont.load_default()


def grid_image(sq, path):
    w0, h0 = sq.size; W, H = (800, round(800 * h0 / w0)) if w0 >= h0 else (round(800 * w0 / h0), 800)
    im = sq.convert('RGB').resize((W, H)); d = ImageDraw.Draw(im, 'RGBA'); f = font(15)
    for i in range(11):
        strong = i % 5 == 0; x = round(i * W / 10); y = round(i * H / 10)
        d.line([(x, 0), (x, H)], fill=(255, 255, 255, 200 if strong else 120), width=2 if strong else 1)
        d.line([(0, y), (W, y)], fill=(255, 255, 255, 200 if strong else 120), width=2 if strong else 1)
    for i in range(10):
        for j in range(10):
            d.text((round(i * W / 10) + 3, round(j * H / 10) + 2), f'{i/10:.1f},{j/10:.1f}', font=f, fill=(0, 0, 0, 255), stroke_width=2, stroke_fill=(255, 255, 255, 255))
    im.save(path)


def fit_square(im):
    """Default: the skill paints a square. Fit the WHOLE photo into it (nothing important is
    cropped) and fill the side margins with the photo's own colours, softly extended, the way
    the brief should extend the wall/sky/ground into that space. Grid coordinates are square."""
    from PIL import ImageFilter
    w, h = im.size; S = max(w, h)
    # margins = the backdrop continued: the colour of the photo's top band (wall/sky) fading into its
    # bottom band (floor/ground), never a stretched copy of the subjects
    def mean(box):
        reg = im.crop(box).resize((24, 24)); px = list(reg.get_flattened_data() if hasattr(reg, 'get_flattened_data') else reg.getdata())
        return tuple(sum(c[i] for c in px) // len(px) for i in range(3))
    top, bot = (mean((0, 0, w, max(1, h // 5))), mean((0, h - max(1, h // 10), w, h))) if h >= w else (mean((0, 0, max(1, w // 10), h)), mean((w - max(1, w // 10), 0, w, h)))
    bg = Image.new('RGB', (S, S))
    for i in range(S):
        k = max(0, min(1, (i / S - .7) / .25))
        col = tuple(round(top[j] * (1 - k) + bot[j] * k) for j in range(3))
        if h >= w: bg.paste(col, (0, i, S, i + 1))
        else: bg.paste(col, (i, 0, i + 1, S))
    bg = bg.filter(ImageFilter.GaussianBlur(S / 60))
    canvas = Image.new('RGB', (S, S)); canvas.paste(bg, (0, 0)); canvas.paste(im, ((S - w) // 2, (S - h) // 2))
    return canvas, ((S - w) / 2 / S, (S - h) / 2 / S, (S + w) / 2 / S, (S + h) / 2 / S), {'width': 600, 'height': 600}


def fit_frame(im):
    """Keep the photo's own shape between 2:3 and 3:2 (a portrait couple stays a portrait);
    only crop what lies beyond that. Returns the framed image, its box, and the canvas size."""
    w, h = im.size; r = h / w
    if r > 1.5: s = w * 1.5; box = (0, round((h - s) / 2), w, round((h + s) / 2))
    elif r < 1 / 1.5: s = h * 1.5; box = (round((w - s) / 2), 0, round((w + s) / 2), h)
    else: box = (0, 0, w, h)
    fr = im.crop(box); fw, fh = fr.size
    canvas = {'width': 600, 'height': round(600 * fh / fw / 10) * 10} if fh >= fw else {'width': round(600 * fw / fh / 10) * 10, 'height': 600}
    if abs(fh / fw - 1) < .08: canvas = {'width': 600, 'height': 600}
    return fr, (box[0] / w, box[1] / h, box[2] / w, box[3] / h), canvas


def hls(rgb): return colorsys.rgb_to_hls(*[c / 255 for c in rgb])
def hexc(h, l, s): return '#' + ''.join(f'{round(c * 255):02x}' for c in colorsys.hls_to_rgb(h % 1, max(0, min(1, l)), max(0, min(1, s))))


def clusters(px, k=10):
    """Median-cut via PIL quantize; returns [(share, rgb)] sorted by share."""
    q = Image.new('RGB', (len(px), 1)); q.putdata(px)
    pal = q.quantize(colors=k, method=Image.Quantize.MEDIANCUT)
    counts = sorted(pal.getcolors(), reverse=True); flat = pal.getpalette()
    return [(n / len(px), tuple(flat[i * 3:i * 3 + 3])) for n, i in counts]


def hue_dist(a, b): return min(abs(a - b), 1 - abs(a - b))


def photo_colours(sq):
    """The photo's own colours for the brief's `colours` (air, ground, life, accent, light).
    compose.py lifts them into the painting's register; nothing is swapped for a preset."""
    w, h = sq.size
    def region(box):
        im = sq.crop(box).convert('RGB').resize((48, 48)); px = list(im.get_flattened_data() if hasattr(im, 'get_flattened_data') else im.getdata())
        return clusters(px, 8)
    def dominant(cs, pick=None):
        cs = [c for c in cs if pick is None or pick(*hls(c[1]))] or cs
        share, rgb = max(cs, key=lambda c: c[0]); return '#%02x%02x%02x' % rgb
    top = [c for c in region((0, 0, w, h * 2 // 5)) if c[0] > .12]
    air = '#%02x%02x%02x' % max(top, key=lambda c: hls(c[1])[1] + c[0] * .3)[1] if top else dominant(region((0, 0, w, h * 2 // 5)))  # sky or wall: the large light area up top
    ground = dominant(region((0, h * 3 // 5, w, h)))
    small = sq.convert('RGB').resize((96, 96)); px = list(small.get_flattened_data() if hasattr(small, 'get_flattened_data') else small.getdata())
    cs = clusters(px, 16)
    life = dominant(cs, lambda hh, l, s: .17 < hh < .5 and s > .12 and .06 < l < .7)  # greens / blue-greens if any, else the main mid tone
    if life == dominant(cs): life = dominant(cs, lambda hh, l, s: .2 < l < .6)
    # accent: the most strongly coloured hue, even if small (a yellow coat, a red bloom)
    bins = [0] * 24
    for rgb in px:
        hh, l, s = hls(rgb)
        if s > .45 and .22 < l < .82: bins[int(hh * 24) % 24] += s * s
    i = max(range(24), key=lambda k: bins[k])
    acc = colorsys.hls_to_rgb((i + .5) / 24, .55, .75) if bins[i] > 3 else hls_to_rgb_tuple(hls(cs[0][1]))
    accent = '#%02x%02x%02x' % tuple(round(v * 255) for v in acc)
    return {'air': air, 'ground': ground, 'life': life, 'accent': accent, 'light': '#fff3d9'}


def hls_to_rgb_tuple(h): return colorsys.hls_to_rgb(h[0], .55, max(.5, h[2]))


def layout(sq):
    g = sq.convert('L').resize((60, 60)); a = list(g.get_flattened_data() if hasattr(g, 'get_flattened_data') else g.getdata())
    rows = [sum(a[r * 60:(r + 1) * 60]) / 60 for r in range(60)]
    jumps = [(abs(rows[r + 3] - rows[r]), r) for r in range(5, 54)]
    horizon = (max(jumps)[1] + 1.5) / 60
    best = max(((sum(a[(r + i) * 60 + c + j] for i in range(6) for j in range(6)), r, c) for r in range(0, 54, 3) for c in range(0, 54, 3)))
    bands = [round(sum(rows[i * 6:(i + 1) * 6]) / 6 / 255, 2) for i in range(10)]
    return {'horizon_guess': round(horizon, 2), 'brightest_area_center': [round((best[2] + 3) / 60, 2), round((best[1] + 3) / 60, 2)],
            'row_brightness_top_to_bottom': bands,
            'note': 'Guesses from brightness only. Confirm on grid.png; the horizon guess can land on any strong edge.'}


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('image'); p.add_argument('--out', required=True)
    p.add_argument('--keep-aspect', action='store_true', help='keep the photo shape (2:3..3:2) — ONLY when the user asks for portrait/landscape/original ratio')
    p.add_argument('--crop', action='store_true', help='square crop instead of fitting the whole photo (may cut subjects)')
    p.add_argument('--crop-x', type=float, default=.5, help='with --crop: crop centre 0-1 for wide photos')
    p.add_argument('--crop-y', type=float, default=.5, help='crop centre 0-1 for tall photos')
    a = p.parse_args()
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    im = Image.open(a.image)
    if a.keep_aspect: sq, box, canvas = fit_frame(im.convert('RGB'))   # only when the user asks for portrait/landscape/original ratio
    elif a.crop: sq, box = square_crop(im.convert('RGB'), a.crop_x, a.crop_y); canvas = {'width': 600, 'height': 600}
    else: sq, box, canvas = fit_square(im.convert('RGB'))
    grid_image(sq, out / 'grid.png')
    colours = photo_colours(im.convert('RGB'))  # from the photo itself, not the padded square
    (out / 'colours.json').write_text(json.dumps(colours, ensure_ascii=False, indent=1))
    lay = layout(sq); lay['source_size'] = list(im.size); lay['photo_box_in_canvas' if not (a.keep_aspect or a.crop) else 'crop_box_in_source'] = [round(v, 3) for v in box]; lay['canvas'] = canvas
    (out / 'layout.json').write_text(json.dumps(lay, ensure_ascii=False, indent=1))
    print(json.dumps({'grid': str(out / 'grid.png'), 'colours': colours, 'layout': lay,
                      'next': 'Look at grid.png. Copy "colours" into the brief (change one only if the request asks); every thing you see gets a name and a form; positions come from the grid labels.'}, ensure_ascii=False, indent=1))
