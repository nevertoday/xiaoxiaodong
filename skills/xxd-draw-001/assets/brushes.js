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
  brush.add('rim', { weight: 0.45, vibration: 0.2, definition: 0.7, quality: 0.8, opacity: 190, spacing: 0.1, pressure: { curve: [0.15, 0.2], min_max: [1.2, 1] } });
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

