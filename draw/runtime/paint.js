// Extracted and adapted from user-supplied Impressionism · Dawn.html.
const rr = (a, b) => random(a, b);

const pickOne = (arr) => arr[Math.floor(random(arr.length))];

const clamp01 = (v) => Math.max(0, Math.min(1, v));

function hexRgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); }

function mixHex(a, b, t) { const A = hexRgb(a), B = hexRgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); }

function hexHsl(hex) {
  const [r, g, b] = hexRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) { const d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min); if (max === r) h = (g - b) / d + (g < b ? 6 : 0); else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h /= 6; }
  return [h, s, l];
}

function hslHex(h, s, l) {
  const f = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
  let r, g, b;
  if (s === 0) { r = g = b = l; } else { const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; r = f(p, q, h + 1 / 3); g = f(p, q, h); b = f(p, q, h - 1 / 3); }
  return '#' + [r, g, b].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
}

function vivid(hex, amt) { if (!amt) return hex; const [h, s, l] = hexHsl(hex); return hslHex(h, s + (1 - s) * amt, l - (l - 0.45) * amt * 0.5); }

function jitterEllipse(cx, cy, rx, ry, n, jitter, rot = 0) {
  const pts = [], a0 = rr(0, TWO_PI), cr = Math.cos(rot), sr = Math.sin(rot);
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * TWO_PI, k = 1 + rr(-jitter, jitter);
    const x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k;
    pts.push([cx + x * cr - y * sr, cy + x * sr + y * cr]);
  }
  return pts;
}

function rosette(cx, cy, r, lobes, inner, rot = 0, jit = 0.05) {
  const n = Math.max(24, lobes * 6), pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TWO_PI, k = inner + (1 - inner) * (0.5 + 0.5 * Math.cos(lobes * a));
    const rad = r * k * (1 + rr(-jit, jit));
    pts.push([cx + Math.cos(a + rot) * rad, cy + Math.sin(a + rot) * rad]);
  }
  return pts;
}

function bandPolygon(y0, y1, wobble, n = 9) {
  const top = [], bottom = [];
  for (let i = 0; i <= n; i++) { const x = -10 + (W + 20) * (i / n); top.push([x, y0 + rr(-wobble, wobble)]); bottom.push([x, y1 + rr(-wobble, wobble)]); }
  return top.concat(bottom.reverse());
}

const bboxOf = (pts, pad) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
  return [Math.max(0, Math.floor(x0 - pad)), Math.max(0, Math.floor(y0 - pad)), Math.min(W, Math.ceil(x1 + pad)), Math.min(H, Math.ceil(y1 + pad))];
};

function fillStyle(color, opacity, bleed, texture, border) { brush.noStroke(); brush.noHatch(); brush.noWash(); brush.fill(color, opacity); brush.fillBleed(bleed, 'out'); brush.fillTexture(texture, border); }

function washStyle(color, opacity) { brush.noStroke(); brush.noHatch(); brush.noFill(); brush.wash(color, opacity); }

function strokeStyle(name, color, weight) { brush.noFill(); brush.noWash(); brush.noHatch(); brush.set(name, color, weight); }

const D = (fn, bb, axis, dir, dur, gap = 60) => ({ fn, bb, axis, dir, dur, gap });

const rdir = () => (random() < 0.5 ? 1 : -1);

const raxis = () => (random() < 0.5 ? 'x' : 'y');

function flushWash() {
  brush.noStroke(); brush.noHatch(); brush.noWash();
  brush.fill('#000000', 0); brush.fillBleed(0); brush.fillTexture(0, 0);
  brush.polygon([[-8, -8], [-6, -8], [-6, -6]]);
}

function ensureBrushes(scale) {
  if (brushScale !== null) {
    if (Math.abs(brushScale - scale) > 1e-6) {
      console.warn(`engine: brushes already scaled to ${brushScale}; ignoring request for ${scale}. ` +
                   'scaleBrushes multiplies in place, so all canvases on a page must share one size.');
    }
    return;
  }
  brush.add('flick', { weight: 0.7, vibration: 0.12, definition: 0.9, quality: 0.8, opacity: 200, spacing: 0.1, pressure: { curve: [0.25, 0.25], min_max: [1.1, 0.85] } });
  brush.add('rim', { weight: 0.45, vibration: 0.35, definition: 0.7, quality: 0.8, opacity: 190, spacing: 0.1, pressure: { curve: [0.15, 0.2], min_max: [1.2, 1] } });
  brush.scaleBrushes(scale);
  brushScale = scale;
}


function softBlobDraw(x, y, rx, ry, color, opacity, bleed, texture, rot = 0, jit = 0.12) {
    const w = S.water - 0.5;
    fillStyle(color, Math.round(opacity - w * 60), clamp01(bleed + w * 0.4), clamp01(texture + w * 0.2), 0.3);
    brush.polygon(jitterEllipse(x, y, rx, ry, 14, jit, rot));
  }

function bloomFill(color, opacity, bleed) { fillStyle(color, opacity, clamp01(bleed + S.water * 0.3), 0.5, 0.4); }

function bloomShape(x, y, r, lobes, inner, color, bleed = 0.3, solid = 0.72) {
    const rot = rr(0, TWO_PI);
    washStyle(color, 255); brush.polygon(rosette(x, y, r * solid, lobes, inner, rot, 0.08));
    bloomFill(color, 250, bleed); brush.polygon(rosette(x, y, r, lobes, inner, rot, 0.05));
  }

function centerDot(x, y, r, color, opacity = 250) { washStyle(color, opacity); brush.polygon(jitterEllipse(x, y, r, r * rr(0.85, 1), 12, 0.14)); }

function flowerCols(C) {
    const a = C.accents, h = C.highlights, v = S.vivid;
    const light = vivid(a[0], v), mid = vivid(a[1] || a[0], v), deep = vivid(a[2] || a[1] || a[0], v);
    return { light, mid, deep, base: a[3] || mixHex(light, '#ffffff', 0.45), center: vivid(h[0] || '#e6b94f', v), pale: h[1] || mixHex(light, '#ffffff', 0.7), shade: mixHex(deep, '#3b3550', 0.45) };
  }

function foliageCols(C) { const f = C.foliage; return { light: f[3] || mixHex(f[0], '#ffffff', 0.35), mid: f[0], deep: f[1] || f[0], shade: f[2] || mixHex(f[0], '#1f2f2a', 0.5) }; }

function drawPeony(x, y, s, F) {
    const det = S.detail;
    bloomShape(x, y, s * 1.08, 8, 0.74, mixHex(F.light, F.mid, S.vivid * 0.5), 0.32, 0.74);
    bloomShape(x, y, s * 0.62, 6, 0.68, F.mid, 0.24, 0.68);
    if (det > 0.35) bloomShape(x, y, s * 0.32, 5, 0.66, F.deep, 0.2, 0.62);
    centerDot(x, y, 0.1 * s, F.center, 235);
  }

function drawDaisy(x, y, s, F) {
    const lobes = 7 + Math.round(4 * S.detail);
    bloomShape(x, y, s * 1.05, lobes, 0.4, F.pale, 0.28, 0.8);
    bloomFill(F.light, 170, 0.3); brush.polygon(rosette(x, y, s * 0.52, lobes, 0.55, rr(0, TWO_PI)));
    centerDot(x, y, 0.24 * s, F.center, 245);
    centerDot(x + 0.06 * s, y + 0.07 * s, 0.1 * s, mixHex(F.center, F.shade, 0.45), 190);
  }

function drawBlossom(x, y, s, F) {
    bloomShape(x, y, s * 0.9, 5, 0.5, random() < 0.5 ? F.light : F.mid, 0.26, 0.74);
    centerDot(x, y, 0.14 * s, F.center, 240);
  }

function drawLily(x, y, s, F) {
    const pts = [], n = 36, lobes = 6;
    for (let i = 0; i <= n; i++) {
      const a = Math.PI + (i / n) * Math.PI, k = 0.62 + 0.38 * (0.5 + 0.5 * Math.cos(lobes * a));
      pts.push([x + Math.cos(a) * 10 * s * k * (1 + rr(-0.05, 0.05)), y + 2 * s + Math.sin(a) * 9 * s * k]);
    }
    pts.push([x + 4 * s, y + 4.5 * s], [x, y + 5.5 * s], [x - 4 * s, y + 4.5 * s]);
    washStyle(F.light, 255); brush.polygon(pts.map(([px, py]) => [x + (px - x) * 0.76, y + 2 * s + (py - y - 2 * s) * 0.76]));
    bloomFill(F.light, 250, 0.3); brush.polygon(pts);
    bloomFill(F.deep, 235, 0.28); brush.polygon(jitterEllipse(x, y + 2 * s, 5.5 * s, 3.2 * s, 10, 0.12));
    centerDot(x, y + 1 * s, 2.2 * s, F.center, 242);
  }

function drawFlower(type, x, y, s, F) {
    if (type === 'peony') drawPeony(x, y, s, F); else if (type === 'daisy') drawDaisy(x, y, s, F); else if (type === 'lily') drawLily(x, y, s, F); else drawBlossom(x, y, s, F);
  }

function drawPad(x, y, r, G) {
    fillStyle(G.mid, 240, clamp01(0.2 + S.water * 0.25), 0.5, 0.35);
    brush.polygon(jitterEllipse(x, y, r, r * 0.42, 12, 0.08));
    strokeStyle('flick', G.light, 1.1 * S.brushSize);
    brush.spline([[x - r * 0.6, y - r * 0.2], [x - r * 0.1, y - r * 0.4], [x + r * 0.5, y - r * 0.3]], 0.5);
    strokeStyle('rim', G.shade, 1.4 * S.brushSize);
    brush.spline([[x - r * 0.7, y + r * 0.2], [x, y + r * 0.45], [x + r * 0.7, y + r * 0.2]], 0.5);
  }

function drawStrand(x0, y0, len, sway, color, weight, name = 'flick') {
    brush.field('hand');
    const watery = S.water > 0.6 && random() < (S.water - 0.6) * 1.5;
    strokeStyle(watery ? 'marker' : name, color, weight * S.brushSize * (watery ? 2 : 1));
    brush.spline([[x0, y0], [x0 + sway * 0.5 + rr(-2, 2), y0 + len * 0.5], [x0 + sway, y0 + len]], 0.6);
    brush.noField();
  }

function glazeDraw(x0, y0, x1, y1, color, weight, field = 'hand') { brush.field(field); strokeStyle('marker', color, weight * S.brushSize); brush.line(x0, y0, x1, y1); brush.noField(); }

function flickDraw(x, y, len, a, color, weight) { strokeStyle('flick', color, weight * S.brushSize); brush.line(x - Math.cos(a) * len / 2, y - Math.sin(a) * len / 2, x + Math.cos(a) * len / 2, y + Math.sin(a) * len / 2); }

function dWash(color, opacity) {
    const pts = [[-10, -10], [W + 10, -10], [W + 10, H + 10], [-10, H + 10]];
    return D(() => { washStyle(color, opacity); brush.polygon(pts); }, [0, 0, W, H], 'x', rdir(), 700, 120);
  }

function dBand(y0, y1, color, opacity, wobble) {
    const pts = bandPolygon(y0, y1, wobble), water = S.water;
    const bleed = 0.25 + water * 0.5, texture = 0.3 + water * 0.5;
    return D(() => { fillStyle(color, opacity, bleed, texture, 0.3); brush.polygon(pts); }, bboxOf(pts, m * 0.25), 'x', rdir(), 600, 100);
  }

function dBlob(x, y, rx, ry, color, opacity, bleed, texture, rot = 0, jit = 0.12, dur = 420) {
    const big = Math.max(rx, ry), pad = big * 0.9 + 14;
    const bb = [Math.max(0, x - big - pad), Math.max(0, y - big - pad), Math.min(W, x + big + pad), Math.min(H, y + big + pad)];
    return D(() => softBlobDraw(x, y, rx, ry, color, opacity, bleed, texture, rot, jit), bb.map(Math.round), raxis(), rdir(), dur, 80);
  }

function dGlaze(x0, y0, x1, y1, color, weight, field) {
    const bb = bboxOf([[x0, y0], [x1, y1]], 14 + weight * 4 * S.brushSize);
    const axis = Math.abs(x1 - x0) >= Math.abs(y1 - y0) ? 'x' : 'y';
    const dir = axis === 'x' ? Math.sign(x1 - x0) || 1 : Math.sign(y1 - y0) || 1;
    const len = Math.hypot(x1 - x0, y1 - y0);
    return D(() => glazeDraw(x0, y0, x1, y1, color, weight, field), bb, axis, dir, 160 + len * 1.4, 50);
  }

function dStrand(x0, y0, len, sway, color, weight, name) {
    const bb = bboxOf([[x0, y0], [x0 + sway, y0 + len]], 14 + weight * 5 * S.brushSize);
    return D(() => drawStrand(x0, y0, len, sway, color, weight, name), bb, 'y', Math.sign(len) || 1, 120 + Math.abs(len) * 1.2, 30);
  }

function dLeaves(cx, cy, rx, ry, n, cols, size, rot = 0) {
    n = Math.max(2, Math.round(n * (0.3 + 0.7 * S.detail)));
    size *= S.brushSize * (1.4 - 0.4 * S.detail);
    const items = [];
    let batch = [];
    for (let i = 0; i < n; i++) {
      const a = rr(0, TWO_PI), d = Math.sqrt(random());
      const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d, r = size * rr(0.6, 1.4);
      batch.push({ x, y, r, color: pickOne(cols), rot: rot + rr(-0.7, 0.7), op: Math.round(rr(170, 235) - S.water * 40) });
      if (batch.length === 5 || i === n - 1) {
        const b = batch; batch = [];
        const bb = bboxOf(b.map((lf) => [lf.x, lf.y]), size * 2.5 + 8);
        items.push(D(() => { for (const lf of b) { washStyle(lf.color, lf.op); brush.polygon(jitterEllipse(lf.x, lf.y, lf.r * 1.7, lf.r * 0.7, 8, 0.12, lf.rot)); } }, bb, raxis(), rdir(), 200, 40));
      }
    }
    return items;
  }

function dFlower(type, x, y, s, F) {
    const r = (type === 'lily' ? 11 * s : s * 1.3) * 1.6 + 10;
    const bb = [Math.max(0, x - r), Math.max(0, y - r), Math.min(W, x + r), Math.min(H, y + r)].map(Math.round);
    const dur = type === 'blossom' ? 260 : type === 'lily' ? 380 : 420;
    return D(() => drawFlower(type, x, y, s, F), bb, raxis(), rdir(), dur, 90);
  }

function dPad(x, y, r, G) {
    const bb = [Math.max(0, x - r * 1.8 - 8), Math.max(0, y - r * 1.2 - 8), Math.min(W, x + r * 1.8 + 8), Math.min(H, y + r * 1.3 + 8)].map(Math.round);
    return D(() => drawPad(x, y, r, G), bb, 'x', rdir(), 240, 50);
  }

function dFlick(x, y, len, a, color, weight) {
    const bb = bboxOf([[x - Math.cos(a) * len / 2, y - Math.sin(a) * len / 2], [x + Math.cos(a) * len / 2, y + Math.sin(a) * len / 2]], 10 + weight * 5);
    const axis = Math.abs(Math.cos(a)) >= Math.abs(Math.sin(a)) ? 'x' : 'y';
    return D(() => flickDraw(x, y, len, a, color, weight), bb, axis, rdir(), 90, 25);
  }

function dTouches(points, C, count, angleFn, sizeMul = 1) {
    const items = [];
    count = Math.round(count * (0.4 + 0.6 * S.detail));
    for (let i = 0; i < count; i++) {
      const p = points.length ? pickOne(points) : [rr(0, W), rr(0, H), 10];
      const x = p[0] + rr(-p[2], p[2]), y = p[1] + rr(-p[2] * 0.6, p[2] * 0.6);
      const color = random() < 0.85 ? pickOne(C.highlights) : pickOne(C.accents);
      items.push(dFlick(x, y, rr(6, 16) * S.scale * sizeMul * (m / 600) * 3, angleFn(), color, rr(0.6, 1.1) * S.scale));
    }
    return items;
  }


/* SceneSpec v4: the originals' painting grammar as reusable motif operations.
 * Each authored op expands (seeded by its id) into the same D(...) strokes the
 * eight cxDraw originals build by hand: wash → bands → light → framing masses
 * → colonies of small clean marks → strands/lines → subject → flowers → touches.
 * Coordinates are normalized; sizes are fractions of the short canvas edge m.
 */
const ROLES = ['washes', 'foliage', 'accents', 'highlights'];
function roleColor(ref) {
  if (typeof ref !== 'string') return ref;
  if (ref[0] === '#') return ref;
  if (ref === 'ground') return SCENE.palette.ground;
  const [role, index] = ref.split('.');
  const list = SCENE.palette[role];
  if (!list) throw new Error('Unknown colour role ' + ref);
  return index === undefined ? pickOne(list) : list[Math.min(list.length - 1, +index)];
}
const colorList = (refs, fallback) => (refs && refs.length ? refs : fallback);
const pickColor = (refs) => roleColor(pickOne(refs));
const span = (v, d) => { v = v ?? d; return Array.isArray(v) ? rr(v[0], v[1]) : v; };
const angleOf = (op, d) => op.angle ?? d;

/* Sample a point inside an authored area. Areas: ellipse {x,y,rx,ry},
 * box {box:[x0,y0,x1,y1], bias}, polygon {polygon:[[x,y]...]}, path {path, width}. */
function areaPoint(area) {
  if (area.box) {
    const [x0, y0, x1, y1] = area.box;
    return [rr(x0, x1) * W, (y0 + (y1 - y0) * Math.pow(random(), area.bias ?? 1)) * H];
  }
  if (area.polygon) {
    const pts = area.polygon, xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    for (let i = 0; i < 80; i++) {
      const x = rr(Math.min(...xs), Math.max(...xs)), y = rr(Math.min(...ys), Math.max(...ys));
      if (insidePolygon(x, y, pts)) return [x * W, y * H];
    }
    return [xs[0] * W, ys[0] * H];
  }
  if (area.path) {
    const [x, y, a] = alongPath(area.path, random()), off = randomGaussian(0, (area.width ?? 0.02) / 2);
    return [(x - Math.sin(a) * off) * W, (y + Math.cos(a) * off) * H];
  }
  const a = rr(0, TWO_PI), d = Math.sqrt(random());
  return [(area.x + Math.cos(a) * area.rx * d) * W, (area.y + Math.sin(a) * area.ry * d) * H];
}
function insidePolygon(x, y, pts) {
  let hit = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}
function alongPath(pts, t) {
  const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  let d = t * lens.reduce((s, v) => s + v, 0);
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) {
      const f = lens[i] ? Math.min(1, d / lens[i]) : 0, a = pts[i], b = pts[i + 1];
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, Math.atan2(b[1] - a[1], b[0] - a[0])];
    }
    d -= lens[i];
  }
}
function pathDistance(x, y, pts) {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = [pts[i - 1][0] * W, pts[i - 1][1] * H], [bx, by] = [pts[i][0] * W, pts[i][1] * H];
    const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(x - ax - t * dx, y - ay - t * dy));
  }
  return best;
}
/* Willow's central opening: marks near a light path take the backlit colours. */
function litColor(x, y, base, light) {
  if (!light) return base;
  const reach = (light.reach ?? 0.15) * m, d = pathDistance(x, y, light.path);
  return d < reach && random() < (light.chance ?? 0.7) * (1 - d / reach) + 0.15 ? pickColor(light.colors ?? ['highlights']) : base;
}
const depthScale = (op, y) => (op.depth ? 0.5 + y / H : 1);

function drawStrandAt(x0, y0, len, ang, sway, color, weight, name) {
  brush.field('hand');
  const watery = S.water > 0.6 && random() < (S.water - 0.6) * 1.5;
  strokeStyle(watery ? 'marker' : name, color, weight * S.brushSize * (watery ? 2 : 1));
  const dx = Math.cos(ang), dy = Math.sin(ang), px = -dy, py = dx;
  brush.spline([[x0, y0], [x0 + dx * len * 0.5 + px * (sway * 0.5 + rr(-2, 2)), y0 + dy * len * 0.5 + py * (sway * 0.5 + rr(-2, 2))],
    [x0 + dx * len + px * sway, y0 + dy * len + py * sway]], 0.6);
  brush.noField();
}
function batchMarks(marks, size, dur, gap) {
  const out = [];
  for (let i = 0; i < marks.length; i += size) {
    const b = marks.slice(i, i + size);
    out.push(D(() => { for (const d of b) { washStyle(d.color, d.op); brush.polygon(d.pts); } }, bboxOf(b.flatMap((d) => d.pts), 10), raxis(), rdir(), dur, gap));
  }
  return out;
}


/* Hand-made geometry. Long straight edges are what made v4 subjects look like
 * flat vector art; the originals never have a ruler edge. */
function handEdge(pts, amt) {
  const out = [], step = Math.max(5, m * 0.012), wob = amt * m * 0.009;
  for (let i = 0; i < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length], L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.round(L / step));
    const nx = -(by - ay) / (L || 1), ny = (bx - ax) / (L || 1);
    for (let k = 0; k < n; k++) {
      const f = k / n, w = k === 0 ? 0 : wob * (noise(ax * 0.03 + f * 2.3, ay * 0.03) - 0.5) * 2;
      out.push([ax + (bx - ax) * f + nx * w, ay + (by - ay) * f + ny * w]);
    }
  }
  // one Chaikin pass softens every corner a little, like a loaded brush turning
  const sm = [];
  for (let i = 0; i < out.length; i++) {
    const [ax, ay] = out[i], [bx, by] = out[(i + 1) % out.length];
    sm.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25], [ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]);
  }
  return sm;
}
function insetPoly(pts, k) {
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return pts.map(([x, y]) => [x + (cx - x) * k, y + (cy - y) * k]);
}
function innerDabs(edge, color, amt) {
  const xs = edge.map((p) => p[0]), ys = edge.map((p) => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const size = Math.sqrt((x1 - x0) * (y1 - y0)), n = Math.round(Math.min(14, Math.max(2, size / (m * 0.025))) * amt);
  for (let i = 0; i < n; i++) {
    let x, y, tries = 0;
    do { x = rr(x0, x1); y = rr(y0, y1); } while (!insidePolygon(x, y, edge) && ++tries < 30);
    if (tries >= 30) continue;
    const r = size * rr(0.08, 0.18), tone = i % 3 === 0 ? lightOf(color) : deepOf(color);
    washStyle(tone, Math.round(rr(55, 105) * amt)); brush.polygon(jitterEllipse(x, y, r * rr(1, 1.8), r, 9, 0.18, rr(-0.5, 0.5)).map(([px, py]) => [Math.max(x0, Math.min(x1, px)), Math.max(y0, Math.min(y1, py))]));
  }
}

function brushFill(edge, color, amt) {
  const xs = edge.map((p) => p[0]), ys = edge.map((p) => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const w = x1 - x0, h = y1 - y0, short = Math.min(w, h), ang = (w > h ? 0 : Math.PI / 2) + rr(-0.35, 0.35);
  const n = Math.round(Math.min(70, Math.max(10, (w * h) / (short * short * 0.06 + 1) * 0.5)) * amt);
  // warm light and cool shade from the palette itself, the impressionist way (not white/grey)
  // neighbouring tones of the same hue, like the originals' petal colonies (no grey, no cool wash)
  const tones = [lightOf(color), toneOf(color, 0.06, 0.03, 0.01), color, toneOf(color, -0.07, 0.08, -0.008), deepOf(color)];
  for (let i = 0; i < n; i++) {
    let x, y, tries = 0;
    do { x = rr(x0, x1); y = rr(y0, y1); } while (!insidePolygon(x, y, edge) && ++tries < 30);
    if (tries >= 30) continue;
    const r = short * rr(0.07, 0.16);
    washStyle(pickOne(tones), Math.round(rr(110, 190) * amt));
    brush.polygon(jitterEllipse(x, y, r * rr(1.6, 2.8), r, 9, 0.2, ang + rr(-0.25, 0.25)));
  }
}

/* A big shape written with only a few corners (a weak model's basket, a ribbon of
 * colour, a roof) is the hard-geometry look the originals never have. Bow its long
 * edges outward a little and round every corner; small shapes are left alone.
 * Opt out with sharp: true when a corner really must stay crisp. */
function simplify(pts, eps) {  // Ramer-Douglas-Peucker on a closed outline
  const rdp = (a) => {
    if (a.length < 3) return a;
    const [x0, y0] = a[0], [x1, y1] = a[a.length - 1], L = Math.hypot(x1 - x0, y1 - y0) || 1;
    let best = 0, at = 0;
    for (let i = 1; i < a.length - 1; i++) { const d = Math.abs((y1 - y0) * a[i][0] - (x1 - x0) * a[i][1] + x1 * y0 - y1 * x0) / L; if (d > best) { best = d; at = i; } }
    return best <= eps ? [a[0], a[a.length - 1]] : rdp(a.slice(0, at + 1)).slice(0, -1).concat(rdp(a.slice(at)));
  };
  let far = 0; for (let i = 1; i < pts.length; i++) if (Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]) > Math.hypot(pts[far][0] - pts[0][0], pts[far][1] - pts[0][1])) far = i;
  return rdp(pts.slice(0, far + 1)).slice(0, -1).concat(rdp(pts.slice(far).concat([pts[0]])).slice(0, -1));
}
function softenPoly(raw) {
  const xs = raw.map((p) => p[0]), ys = raw.map((p) => p[1]), w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
  if (Math.max(w, h) < m * 0.12) return raw;
  const pts = raw.length > 8 ? simplify(raw, m * 0.008) : raw;  // densely sampled straight edges count as straight
  if (pts.length > 12) return raw;
  const cx = xs.reduce((s, v) => s + v, 0) / pts.length, cy = ys.reduce((s, v) => s + v, 0) / pts.length, out = [];
  for (let i = 0; i < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length], L = Math.hypot(bx - ax, by - ay);
    let nx = -(by - ay) / (L || 1), ny = (bx - ax) / (L || 1);
    const mx = (ax + bx) / 2, my = (ay + by) / 2;
    if ((mx - cx) * nx + (my - cy) * ny < 0) { nx = -nx; ny = -ny; }  // bow outward, like a loaded brush
    const bow = Math.min(L * 0.03, m * 0.012);
    out.push([ax, ay], [ax + (bx - ax) * 0.33 + nx * bow * 0.8, ay + (by - ay) * 0.33 + ny * bow * 0.8], [mx + nx * bow, my + ny * bow], [ax + (bx - ax) * 0.67 + nx * bow * 0.8, ay + (by - ay) * 0.67 + ny * bow * 0.8]);
  }
  let r = out;
  for (let pass = 0; pass < 1; pass++) {
    const sm = [];
    for (let i = 0; i < r.length; i++) { const [ax, ay] = r[i], [bx, by] = r[(i + 1) % r.length]; sm.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25], [ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]); }
    r = sm;
  }
  return r;
}
function handLine([[ax, ay], [bx, by]]) {
  const L = Math.hypot(bx - ax, by - ay), bend = (noise(ax * 0.05, by * 0.05) - 0.5) * L * 0.04;
  return [[ax, ay], [(ax + bx) / 2 - (by - ay) / (L || 1) * bend, (ay + by) / 2 + (bx - ax) / (L || 1) * bend], [bx, by]];
}

/* Organic primitives from the Painting Loaders source (Koi / Oranges / Sail). */
function petalPts(cx, cy, rx, ry, rot, n = 14, jit = 0.05) {
  const pts = [], cr = Math.cos(rot), sr = Math.sin(rot);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TWO_PI, c = Math.cos(a), k = 1 + rr(-jit, jit);
    const px = rx * c * k, py = ry * Math.sin(a) * Math.sqrt(1 - 0.9 * c) / 1.1 * k;
    pts.push([cx + px * cr - py * sr, cy + px * sr + py * cr]);
  }
  return pts;
}
function ringPts(cx, cy, r, a0, a1, n = 10) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return pts;
}
function taperedBody(x, y, len, wid, angle, jit = 0.06, HW = [0.3, 0.72, 1, 0.9, 0.62, 0.3, 0.55, 0.85]) {
  const ca = Math.cos(angle), sa = Math.sin(angle);
  const P = (t, v) => { const u = len / 2 - t * len; return [x + u * ca - v * sa, y + u * sa + v * ca]; };
  const T = [0, 0.1, 0.3, 0.5, 0.7, 0.82, 0.92, 1], top = [], bottom = [];
  for (let i = 0; i < T.length; i++) { const h = HW[i] * (wid / 2) * (1 + rr(-jit, jit)); top.push(P(T[i], -h)); bottom.push(P(T[i], h)); }
  return top.concat([P(0.88, 0)], bottom.reverse());
}
/* Volume the way the originals paint an orange or a koi: solid core, a rim with
 * little bleed (a skin, not a halo), a shadow mass offset away from the light, a
 * light patch offset toward it, sometimes a glint. Shading follows the form. */

/* Colour shading the originals' way (Oranges: O.deep / O.light; Koi: K.deep / K.pale):
 * shadow is the SAME hue, darker and a little richer; light is the same hue, lighter and
 * a touch warmer. Never mix toward grey or a cool wash: that is what made subjects dull. */
function toneOf(hex, dl, ds = 0, dh = 0) {
  const [h, s, l] = hexHsl(hex);
  return hslHex((h + dh + 1) % 1, Math.max(0, Math.min(1, s + ds)), Math.max(0.04, Math.min(0.97, l + dl)));
}
const deepOf = (c) => toneOf(c, -0.16, 0.12, -0.012);
const lightOf = (c) => toneOf(c, 0.12, 0.04, 0.012);
function scalePoly(pts, k, dx, dy) {
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return pts.map(([x, y]) => [cx + (x - cx) * k + dx, cy + (y - cy) * k + dy]);
}
function elongation(pts) {  // ratio of principal axes, so a diagonal ribbon counts as long
  const n = pts.length, cx = pts.reduce((s, p) => s + p[0], 0) / n, cy = pts.reduce((s, p) => s + p[1], 0) / n;
  let xx = 0, yy = 0, xy = 0;
  for (const [x, y] of pts) { xx += (x - cx) ** 2; yy += (y - cy) ** 2; xy += (x - cx) * (y - cy); }
  const tr = xx + yy, det = xx * yy - xy * xy, d = Math.sqrt(Math.max(0, tr * tr / 4 - det));
  return Math.sqrt((tr / 2 + d) / Math.max(1e-9, tr / 2 - d));
}
function paintForm(edge, color, alpha, o) {
  const xs = edge.map((p) => p[0]), ys = edge.map((p) => p[1]), size = Math.sqrt((Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys)));
  const [lx, ly] = o.light ?? [-0.55, -0.75], L = Math.hypot(lx, ly) || 1, ux = lx / L, uy = ly / L;
  washStyle(color, alpha); brush.polygon(scalePoly(edge, 0.95, 0, 0));
  fillStyle(color, Math.round(alpha * 0.9), 0.1 + S.water * 0.08, 0.4, 0.3); brush.polygon(edge);
  if (size < m * 0.035 || o.flat || elongation(edge) > 2.6) return;  // shading copies only suit round forms (an orange, a koi), not ribbons
  const deep = o.deep ? roleColor(o.deep) : deepOf(color);
  const pale = o.pale ? roleColor(o.pale) : lightOf(color);
  washStyle(deep, 125); brush.polygon(scalePoly(edge, 0.72, -ux * size * 0.16, -uy * size * 0.16));
  washStyle(pale, 140); brush.polygon(scalePoly(edge, 0.42, ux * size * 0.2, uy * size * 0.2));
  if (o.glint) centerDot(edge.reduce((s, p) => s + p[0], 0) / edge.length + ux * size * 0.3, edge.reduce((s, p) => s + p[1], 0) / edge.length + uy * size * 0.3, size * 0.05, SCENE.palette.highlights[1] || SCENE.palette.highlights[0], 160);
}

const MOTIFS = {
  wash: (op) => [dWash(roleColor(op.color ?? 'washes.0'), op.opacity ?? Math.round(S.coverage * 200))],
  band: (op) => [dBand(op.y0 * H, op.y1 * H, roleColor(op.color), op.opacity ?? Math.round(215 - S.water * 40), (op.wobble ?? 0.027) * m)],
  blob: (op) => {
    const x = op.x * W, y = op.y * H, rx = op.rx * W, ry = op.ry * H, color = roleColor(op.color);
    // a big hard-edged wash disc is a sticker, not paint: only small ones (sun, moon, lamp, fruit) stay crisp
    if (op.medium === 'wash' && Math.max(rx, ry) > m * 0.15) return [dBlob(x, y, rx, ry, color, Math.round((op.opacity ?? 240) * 0.85), 0.4, 0.5, op.rotation ?? 0, 0.14, op.duration ?? 420)];
    if (op.medium !== 'wash') return [dBlob(x, y, rx, ry, color, op.opacity ?? 200, op.bleed ?? 0.35 + S.water * 0.3, op.texture ?? 0.5, op.rotation ?? 0, op.jitter ?? 0.12, op.duration ?? 420)];
    // A clean, readable disc (sun, moon, lamp, fruit) rather than a soft wet glow.
    const r = Math.max(rx, ry) * 1.2;
    return [D(() => { washStyle(color, op.opacity ?? 240); brush.polygon(jitterEllipse(x, y, rx, ry, 16, op.jitter ?? 0.05, op.rotation ?? 0)); }, bboxOf([[x - r, y - r], [x + r, y + r]], 10), raxis(), rdir(), op.duration ?? 320, 60)];
  },
  leaves: (op) => {
    const cols = colorList(op.colors, ['foliage.2', 'foliage.1', 'foliage.0', 'foliage.3']).map(roleColor);
    return dLeaves(op.x * W, op.y * H, op.rx * W, op.ry * H, op.count, cols, (op.size ?? 0.012) * m * S.scale, op.rotation ?? 0);
  },
  marks: (op) => {
    const cols = colorList(op.colors, ['foliage']), n = Math.round(op.count * (0.3 + 0.7 * S.detail)), marks = [];
    for (let i = 0; i < n; i++) {
      const [x, y] = areaPoint(op.area), r = span(op.size, 0.006) * m * S.scale * S.brushSize * (1.4 - 0.4 * S.detail) * depthScale(op, y);
      const k = span(op.aspect, 1), color = litColor(x, y, pickColor(cols), op.light);
      const fl = op.flow, rot = fl?.fan ? Math.atan2(y - fl.fan[1] * H, x - fl.fan[0] * W) : fl?.swirl ? Math.atan2(y - fl.swirl[1] * H, x - fl.swirl[0] * W) + HALF_PI : (op.rotation ?? 0);
      const a = rot + rr(-1, 1) * (op.spin ?? (fl ? 0.5 : 0.15));
      marks.push({ color, op: Math.round(span(op.opacity, [170, 235]) - S.water * 30),
        pts: op.petal ? petalPts(x, y, r * k, r, a, 10, 0.1) : jitterEllipse(x, y, r * k, r, op.vertices ?? 8, 0.15 + S.soft * 0.2 * (op.loose ?? 0.5), a) });
    }
    return batchMarks(marks, op.batch ?? 8, op.duration ?? 220, 40);
  },
  strands: (op) => {
    const cols = colorList(op.colors, ['foliage.1', 'foliage.2']), out = [], n = Math.round(op.count * (0.35 + 0.65 * S.detail));
    for (let i = 0; i < n; i++) {
      const [x0, y0] = areaPoint(op.area), ds = depthScale(op, y0);
      const len = span(op.length, [0.1, 0.3]) * H * ds, ang = angleOf(op, Math.PI / 2) + rr(-1, 1) * (op.spread ?? 0.08);
      const sway = rr(-1, 1) * (op.sway ?? 0.01) * m, color = litColor(x0, y0, pickColor(cols), op.light);
      const weight = span(op.weight, [0.7, 1.3]) * S.scale * (1.5 - 0.5 * S.detail) * ds, name = random() < (op.rim ?? 0.2) ? 'rim' : op.brush ?? 'flick';
      const end = [x0 + Math.cos(ang) * len, y0 + Math.sin(ang) * len];
      const axis = Math.abs(Math.cos(ang)) > Math.abs(Math.sin(ang)) ? 'x' : 'y', dir = Math.sign(axis === 'x' ? Math.cos(ang) : Math.sin(ang)) || 1;
      out.push(D(() => drawStrandAt(x0, y0, len, ang, sway, color, weight, name), bboxOf([[x0, y0], end], 14 + Math.abs(sway) + weight * 5 * S.brushSize), axis, dir, 120 + len * 1.2, 30));
    }
    return out;
  },
  glazes: (op) => {
    const cols = colorList(op.colors, ['highlights.0', 'highlights.1']), out = [];
    for (let i = 0; i < op.count; i++) {
      const [x, y] = areaPoint(op.area), len = span(op.length, [0.08, 0.2]) * m, a = angleOf(op, Math.PI / 2) + rr(-0.05, 0.05);
      // a glaze is a loaded brush dragged once: a gentle bow and a lighter tail, never a ruled bar
      const x1 = x + Math.cos(a) * len, y1 = y + Math.sin(a) * len, bow = len * rr(-0.07, 0.07), color = pickColor(cols), w = span(op.weight, [2, 4]);
      const mid = [(x + x1) / 2 - Math.sin(a) * bow, (y + y1) / 2 + Math.cos(a) * bow];
      const axis = Math.abs(Math.cos(a)) >= Math.abs(Math.sin(a)) ? 'x' : 'y', dir = Math.sign(axis === 'x' ? Math.cos(a) : Math.sin(a)) || 1;
      out.push(D(() => { brush.field(op.field ?? 'hand'); strokeStyle('marker', color, w * S.brushSize); brush.spline([[x, y], mid, [x1, y1]], 0.5);
        strokeStyle('marker', mixHex(color, SCENE.palette.ground, 0.4), w * S.brushSize * 0.55); brush.spline([mid, [x1 + Math.cos(a) * len * 0.12, y1 + Math.sin(a) * len * 0.12]], 0.5); brush.noField(); },
        bboxOf([[x, y], mid, [x1, y1]], 14 + w * 4 * S.brushSize), axis, dir, 160 + len * 1.4, 50));
    }
    return out;
  },
  line: (op) => {
    const pts = op.points.map(([x, y]) => [x * W, y * H]), w = span(op.weight, 2.6) * S.brushSize, color = roleColor(op.color ?? 'foliage.2');
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), axis = Math.max(...xs) - Math.min(...xs) > Math.max(...ys) - Math.min(...ys) ? 'x' : 'y';
    const dir = Math.sign(axis === 'x' ? pts.at(-1)[0] - pts[0][0] : pts.at(-1)[1] - pts[0][1]) || 1;
    return [D(() => { if (op.field) brush.field(op.field); strokeStyle(op.brush ?? 'rim', color, w); pts.length === 2 && op.ruler ? brush.line(...pts[0], ...pts[1]) : brush.spline(pts.length === 2 ? handLine(pts) : pts, op.curvature ?? 0.4); brush.noField(); },
      bboxOf(pts, 12 * S.brushSize + w * 4), axis, dir, op.duration ?? 260, 40)];
  },
  shape: (op) => {
    const raw = op.points.map(([x, y]) => [x * W, y * H]), color = roleColor(op.color), alpha = op.opacity ?? 235;
    const pts = op.sharp ? raw : softenPoly(raw);
    if (op.medium === 'fill') return [D(() => { fillStyle(color, alpha, op.bleed ?? 0.3, op.texture ?? 0.4, 0.3); brush.polygon(pts); }, bboxOf(pts, m * 0.06), raxis(), rdir(), op.duration ?? 320, 60)];
    const hand = op.hand ?? 0.6;
    if (!hand) return [D(() => { washStyle(color, alpha); brush.polygon(pts); }, bboxOf(pts, 10), raxis(), rdir(), op.duration ?? 320, 60)];
    // Painted like the originals' oranges and koi: core + skin + shadow away from the light
    // + light patch toward it. Large areas also get a few directional strokes.
    const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
    const area = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys)), big = area > (m * 0.09) ** 2;
    return [D(() => {
      const edge = handEdge(pts, hand);
      paintForm(edge, color, alpha, { light: op.light, deep: op.deep, pale: op.pale, glint: op.glint, flat: op.flat });
      if (big) brushFill(edge, color, hand * 0.5);
    }, bboxOf(pts, m * 0.03 + 10), raxis(), rdir(), (op.duration ?? 320) * (big ? 1.4 : 1), 60)];
  },
  body: (op) => {
    // a tapered organic body along a spine (the koi): animals, figures, boats, leaves
    const x = op.x * W, y = op.y * H, len = op.length * m, wid = (op.width ?? op.length * 0.3) * m, ang = op.angle ?? 0, color = roleColor(op.color);
    const ca = Math.cos(ang), sa = Math.sin(ang), off = (u, v) => [x + u * ca - v * sa, y + u * sa + v * ca];
    return [D(() => {
      const hw = op.profile;
      const edge = taperedBody(x, y, len, wid, ang, 0.05, hw);
      paintForm(edge, color, op.opacity ?? 245, { light: op.light, deep: op.deep, pale: op.pale, glint: op.glint });
      if (op.saddle) { const [bx, by] = off(len * 0.06, -wid * 0.18); washStyle(roleColor(op.saddle), 190); brush.polygon(jitterEllipse(bx, by, len * 0.28, wid * 0.22, 10, 0.15, ang)); }
      if (op.eye) { const [ex, ey] = off(len * 0.4, -wid * 0.12); centerDot(ex, ey, Math.max(1.5, len * 0.018), roleColor(op.eye === true ? '#3e3a3a' : op.eye), 235); }
    }, bboxOf([off(len * 0.6, 0), off(-len * 0.6, 0), off(0, wid), off(0, -wid)], m * 0.03 + 10), Math.abs(ca) > Math.abs(sa) ? 'x' : 'y', Math.sign(Math.abs(ca) > Math.abs(sa) ? -ca : -sa) || 1, op.duration ?? 420, 80)];
  },
  arcs: (op) => {
    // flowing marker arcs around a centre (koi swirl, ripples, wind, steam)
    const cx = op.x * W, cy = op.y * H, cols = colorList(op.colors, ['washes.1', 'washes.2', 'highlights.0']), arcs = [];
    for (let i = 0; i < op.count; i++) {
      const r = span(op.radius, [0.05, 0.3]) * m, a0 = rr(0, TWO_PI), sp = span(op.span, [0.6, 1.6]) * (op.dir ?? 1);
      arcs.push({ pts: ringPts(cx, cy, r, a0, a0 + sp, 9).map(([px, py], k) => [cx + (px - cx) * (1 + k * (op.open ?? 0.012)), cy + (py - cy) * (1 + k * (op.open ?? 0.012)) * (op.squash ?? 1)]), color: pickColor(cols), w: span(op.weight, [1.4, 4]) * S.brushSize });
    }
    arcs.sort((a, b) => Math.hypot(a.pts[0][0] - cx, a.pts[0][1] - cy) - Math.hypot(b.pts[0][0] - cx, b.pts[0][1] - cy));
    const out = [];
    for (let i = 0; i < arcs.length; i += 4) {
      const b = arcs.slice(i, i + 4);
      out.push(D(() => { for (const A of b) { brush.field('waves'); strokeStyle('marker', A.color, A.w); brush.spline(A.pts, 0.5); brush.noField(); } }, bboxOf(b.flatMap((A) => A.pts), 24), raxis(), rdir(), 260, 40));
    }
    return out;
  },
  flowers: (op) => {
    const F = flowerCols(op.accents ? { ...SCENE.palette, accents: op.accents.map(roleColor) } : SCENE.palette), out = [];
    const spots = op.at ?? Array.from({ length: op.count }, () => { const [x, y] = areaPoint(op.area); return [x / W, y / H]; });
    spots.sort((a, b) => a[1] - b[1]);
    for (const [x, y, s] of spots) {
      const size = (s ?? span(op.size, [0.02, 0.035])) * m * S.scale * S.flower * depthScale(op, y * H);
      out.push(dFlower(op.kind ?? 'blossom', x * W, y * H, op.kind === 'lily' ? size / 11 : size, F));
    }
    return out;
  },
  pads: (op) => {
    const G = foliageCols(SCENE.palette), pads = [];
    for (let i = 0; i < op.count; i++) { const [x, y] = areaPoint(op.area); pads.push([x, y, span(op.size, [0.03, 0.05]) * m * S.scale * depthScale(op, y)]); }
    return pads.sort((a, b) => a[1] - b[1]).map(([x, y, r]) => dPad(x, y, r, G));
  },
  touches: (op) => {
    const pts = Array.from({ length: 12 }, () => { const [x, y] = areaPoint(op.area); return [x, y, 4]; });
    return dTouches(pts, SCENE.palette, op.count, () => angleOf(op, 0) + rr(-1, 1) * (op.spread ?? 0.1), op.size ?? 1);
  },
};

/* group: paint k consecutive strokes as one reveal, so faint repeats (rain,
 * curtain folds, ripples) do not occupy the timeline one by one. */
function groupStrokes(list, k) {
  if (!(k > 1)) return list;
  const out = [];
  for (let i = 0; i < list.length; i += k) {
    const g = list.slice(i, i + k), bb = [Math.min(...g.map((d) => d.bb[0])), Math.min(...g.map((d) => d.bb[1])), Math.max(...g.map((d) => d.bb[2])), Math.max(...g.map((d) => d.bb[3]))];
    out.push(D(() => g.forEach((d) => d.fn()), bb, g[0].axis, g[0].dir, Math.max(...g.map((d) => d.dur), g.reduce((s, d) => s + d.dur, 0) * 0.4), g[0].gap));
  }
  return out;
}
/* Labels are sticky: a label names this motif and every following one until
 * the next label, so the caption always describes what is being painted. */
/* Any numeric field may be written as [min,max] (the validator allows it).
 * Fields that vary per mark keep their range; every other range is resolved
 * once per motif, so no generator ever multiplies an array (NaN bbox crash). */
const PER_MARK = { marks: ['size', 'aspect', 'opacity'], strands: ['length', 'weight'], glazes: ['length', 'weight'], flowers: ['size'], pads: ['size'], line: ['weight'] };
function scalarize(op) {
  const keep = PER_MARK[op.type] || [], out = { ...op };
  for (const [k, v] of Object.entries(op)) if (!keep.includes(k) && k !== 'light' && Array.isArray(v) && v.length === 2 && v.every((n) => typeof n === 'number')) out[k] = rr(v[0], v[1]);
  return out;
}
function expandMotifs(ops) {
  const out = [];
  let label;
  for (const op of ops) {
    if (!MOTIFS[op.type]) throw new Error('Unsupported v4 motif: ' + op.type);
    randomSeed(seedFor(op.id)); noiseSeed(seedFor(op.id));
    label = op.label ?? label;
    const pace = op.pace ?? 1;
    groupStrokes(MOTIFS[op.type](scalarize(op)), op.group).forEach((d, k) => out.push({ ...d, dur: d.dur * pace, gap: d.gap * pace,
      id: op.id + (k ? '-' + k : ''), object: op.object ?? op.id, stage: op.type, label, seed: seedFor(op.id + ':' + k), begun: false }));
  }
  return out;
}

/* One isolated document per painting: p5.brush has global renderer state.
 * The plan is a list of motifs (motifs.js) that expand into strokes; each stroke is
 * painted whole into `buf` over the finished `paint`, then revealed along its box. */
let W, H, m, brushScale = null;
// The dials every original was tuned with.
const S = {water:0.55, coverage:0.84, density:0.5, scale:1.1, soft:0.7, glaze:0.3, touch:0.2, detail:0.45, brushSize:1.49, vivid:0.45, flower:1.8, ...SCENE.brush_settings};
function seedFor(value) {
  let h = SCENE.seed >>> 0;
  for (const ch of value) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h;
}

let paint,buf,canvasEl,strokes=[],idx=0,lastT=-1,started=0,offset=0,cycle=-1;
let paused=false,initialized=false,paintCalls=0;
const totalMs=SCENE.animation.duration_ms,holdMs=SCENE.animation.hold_ms;
const api=window.xxdDraw={ready:false,error:null,renderCount:0};
const phrases=SCENE.animation.phrases??['铺开底色…','完成'];
const statusEl=document.getElementById('status');
function updateStatus(s) {
  // A sticky motif label names the current work; without labels, phrases advance with progress. The last phrase marks completion.
  const label=s?(s.label??phrases[Math.min(phrases.length-2,Math.floor(Math.max(0,lastT)/totalMs*(phrases.length-1)))]):phrases.at(-1);
  if(statusEl.textContent!==label)statusEl.textContent=label;
}
function resetPainting() {
  paint.background(SCENE.palette.ground);
  idx=0; lastT=-1; for(const s of strokes)s.begun=false;
}
function beginStroke(s) {
  buf.clear(); buf.push(); buf.translate(-W/2,-H/2); buf.image(paint,0,0,W,H);
  randomSeed(s.seed); noiseSeed(s.seed); brush.noField(); s.fn(); flushWash(); buf.pop();
  s.begun=true; paintCalls++; api.renderCount=paintCalls;
}
function displayAt(t) {
  t=Math.max(0,Math.min(totalMs,t));
  if(t<lastT)resetPainting();
  while(idx<strokes.length && strokes[idx].start<=t) {
    const s=strokes[idx]; if(!s.begun)beginStroke(s);
    s.progress=Math.min(1,(t-s.start)/s.dur);
    if(s.progress<1)break;
    paint.push();paint.translate(-W/2,-H/2);paint.image(buf,0,0,W,H);paint.pop();idx++;
  }
  push();translate(-W/2,-H/2);image(paint,0,0,W,H);
  const s=strokes[idx];
  if(s?.begun && s.progress>0) {
    const [x0,y0,x1,y1]=s.bb;
    if(s.axis==='x') {const w=Math.round((x1-x0)*s.progress),x=s.dir>0?x0:x1-w;if(w>0&&y1>y0)image(buf,x,y0,w,y1-y0,x,y0,w,y1-y0);}
    else {const h=Math.round((y1-y0)*s.progress),y=s.dir>0?y0:y1-h;if(h>0&&x1>x0)image(buf,x0,y,x1-x0,h,x0,y,x1-x0,h);}
  }
  pop();lastT=t;
  api.time=t;api.progress=t/totalMs;api.activeStroke=s?.id??null;api.stage=s?.stage??'finished';api.completed=idx;
  updateStatus(s);
}
function setup() {
  try {
    W=SCENE.canvas.width;H=SCENE.canvas.height;m=Math.min(W,H);pixelDensity(1);
    const cnv=createCanvas(W,H,WEBGL);cnv.parent('sheet');canvasEl=cnv.elt;canvasEl.id='artwork';canvasEl.setAttribute('aria-label',SCENE.title);
    ensureBrushes(3*m/600);
    paint=createGraphics(W,H,WEBGL);buf=createGraphics(W,H,WEBGL);paint.pixelDensity(1);buf.pixelDensity(1);
    // Keep the GPU surfaces alive but never in the page layout.
    for(const g of [paint,buf]){g.canvas.setAttribute('aria-hidden','true');g.canvas.remove();}
    paint.imageMode(CORNER);buf.imageMode(CORNER);imageMode(CORNER);brush.load(buf);
    // Field creation consumes brush randomness; initialise before any stroke so play and replay match.
    for(const field of new Set([...SCENE.strokes.map(s=>s.field).filter(Boolean),'hand'])){
      randomSeed(seedFor('field:'+field));noiseSeed(seedFor('field:'+field));
      brush.field(field);
    }
    brush.noField();
    buf.push();buf.translate(-W/2,-H/2);fillStyle('#7a86bd',200,0.3,0.5,0.3);brush.circle(W/2,H/2,12);flushWash();buf.pop();buf.clear();
    strokes=expandMotifs(SCENE.strokes);
    let cursor=0;
    const raw=strokes.reduce((sum,s)=>sum+s.dur+s.gap,0),k=totalMs/raw;
    for(const s of strokes){s.start=cursor;s.dur*=k;s.gap*=k;cursor+=s.dur+s.gap;}
    api.timeline=strokes.map(({id,object,stage,label,bb,axis,dir,seed,start,dur,gap})=>({id,object,stage,label,bbox:bb,axis,direction:dir,seed,start,duration:dur,gap}));
    api.seek=ms=>{api.pause();displayAt(ms);return api.progress;};
    api.pause=()=>{offset=Math.max(0,lastT);paused=true;noLoop();};
    api.play=()=>{offset=Math.max(0,lastT);started=millis();cycle=0;paused=false;loop();};
    api.restart=()=>{resetPainting();displayAt(0);offset=0;started=millis();cycle=0;paused=false;loop();};
    api.png=()=>canvasEl.toDataURL('image/png');
    resetPainting();displayAt(0);started=millis();cycle=0;initialized=true;api.ready=true;
    const q=new URLSearchParams(location.search),at=q.get('t');
    if(at!==null)api.seek(Number(at));
    else if(matchMedia('(prefers-reduced-motion: reduce)').matches)api.seek(totalMs);
    document.getElementById('error').hidden=true;
  } catch(e){api.error=e.message;document.getElementById('error').textContent='绘画无法启动：'+e.message;noLoop();throw e;}
}
function draw() {
  if(!initialized||paused)return;
  const elapsed=millis()-started+offset;
  // A slow frame must still finish a non-looping painting.
  if(!SCENE.animation.loop){
    const t=Math.min(totalMs,elapsed);
    if(t!==lastT)displayAt(t);
    if(elapsed>=totalMs)api.pause();
    return;
  }
  const period=totalMs+holdMs,current=Math.floor(elapsed/period);
  if(current!==cycle){resetPainting();cycle=current;}
  const t=Math.min(totalMs,elapsed%period);
  if(t!==lastT)displayAt(t);
}
let resumeOnVisible=false;
document.addEventListener('visibilitychange',()=>{if(!api.ready)return;if(document.hidden){resumeOnVisible=!paused;api.pause();}else if(resumeOnVisible){api.play();resumeOnVisible=false;}});
