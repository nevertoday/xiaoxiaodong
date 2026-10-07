#!/usr/bin/env node
// Capture evidence for an artwork: final (and in full mode first/middle/mobile/iframe/replay/offline) plus PACING. Verifies runtime, NOT aesthetics.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {createHash} = require('node:crypto');
const assert = require('node:assert/strict');

async function main() {
  const raw = process.argv.slice(2), quick = raw.includes('--quick'), force = raw.includes('--force');
  const args = raw.filter(a => !['--quick', '--force'].includes(a));
  if (args.length === 2) args.splice(1, 0, '-');  // artwork.html evidence-dir
  if (args.length !== 3) throw Error('Usage: capture_review.cjs artwork.html evidence-directory [--quick] [--force]');
  const noStructure = true;
  const started = Date.now(), mode = quick ? 'quick' : 'full';
  const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  const [art, structure, output] = args.map((p, i) => i === 1 && noStructure ? null : path.resolve(p));
  if (!fs.existsSync(art) || (!noStructure && !fs.existsSync(structure))) throw Error('Build the HTML files first');
  fs.mkdirSync(output, {recursive: true});
  const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const executable = process.env.BROWSER_EXECUTABLE || chromium.executablePath();
  const browserStat = fs.statSync(executable);
  const fingerprint = createHash('sha256').update(JSON.stringify({html: hash(art), structure: noStructure ? null : hash(structure),
    script: hash(__filename), executable, browserSize: browserStat.size, browserMtime: browserStat.mtimeMs,
    playwright: require.resolve(process.env.PLAYWRIGHT_MODULE || 'playwright'), os: os.release(), platform: process.platform, mode})).digest('hex');
  const reportPath = path.join(output, quick ? 'capture-quick.json' : 'capture-verification.json');
  const expectedEvidence = (quick ? ['final.png', 'structure.png'] : ['zero.png', 'middle.png', 'final.png', 'mobile.png', 'structure.png']).filter(n => !(noStructure && n === 'structure.png'));
  if (!force && fs.existsSync(reportPath)) {
    try {
      const previous = JSON.parse(fs.readFileSync(reportPath));
      if (previous.pass === true && previous.fingerprint === fingerprint &&
          expectedEvidence.every(name => fs.existsSync(path.join(output, name)) && previous.evidence?.[name] === hash(path.join(output, name)))) {
        console.log('CACHE HIT ' + mode + '; screenshots unchanged, not a new visual verdict: ' + output); return;
      }
    } catch (_) { /* Missing/corrupt evidence is rebuilt, never accepted. */ }
  }
  const isolated = fs.mkdtempSync(path.join(os.tmpdir(), 'xxd-review-'));
  fs.copyFileSync(art, path.join(isolated, 'art.html'));
  if (!noStructure) fs.copyFileSync(structure, path.join(isolated, 'structure.html'));
  const browser = await chromium.launch({headless: true,
    executablePath: process.env.BROWSER_EXECUTABLE,
    args: process.platform === 'darwin' ? [] : ['--enable-unsafe-swiftshader', '--use-angle=swiftshader']});
  const errors = [], network = [];
  const report = {mode, fingerprint, scope: quick ? 'Quick rendering ONLY; full playback tests not run' : 'Full runtime evidence; visual judgement separate', errors, network};
  try {
    const context = await browser.newContext({offline: true, viewport: {width: 900, height: 850}, deviceScaleFactor: 1});
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => {if (/^https?:/.test(r.url())) network.push(r.url());});
    const ready = async frame => {
      await frame.waitForFunction(() => window.xxdDraw?.ready || window.xxdDraw?.error, null, {timeout: 120000});
      assert.equal(await frame.evaluate(() => !!window.xxdDraw.error), false, 'renderer error');
    };
    const end = frame => frame.evaluate(() => Math.ceil(Math.max(...xxdDraw.timeline.map(t => t.start + t.duration + t.gap))));
    const save = async (name, t) => {
      await page.evaluate(t => xxdDraw.seek(t), t);
      const png = await page.evaluate(() => xxdDraw.png());
      fs.writeFileSync(path.join(output, name + '.png'), Buffer.from(png.split(',')[1], 'base64'));
    };
    await page.goto(pathToFileURL(path.join(isolated, 'art.html')).href + '?t=0', {waitUntil: 'domcontentloaded'});
    await ready(page);
    const duration = await end(page);
    // Pacing: visible change in 24 equal slices. The originals never leave more
    // than 3 slices (Dawn: 3, all in one run) with <0.2% of pixels changing.
    report.pacing = await page.evaluate(duration => {
      const art = document.querySelector('canvas'), c = document.createElement('canvas'); c.width = c.height = 150;
      const x = c.getContext('2d'), snap = () => { x.drawImage(art, 0, 0, 150, 150); return x.getImageData(0, 0, 150, 150).data; };
      const slices = []; xxdDraw.seek(0); let prev = snap();
      for (let i = 1; i <= 24; i++) {
        xxdDraw.seek(duration * i / 24); const cur = snap(); let n = 0;
        for (let k = 0; k < cur.length; k += 4) if (Math.abs(cur[k] - prev[k]) + Math.abs(cur[k + 1] - prev[k + 1]) + Math.abs(cur[k + 2] - prev[k + 2]) > 18) n++;
        slices.push(+(n / 22500).toFixed(4)); prev = cur;
      }
      let run = 0, longest = 0; for (const v of slices) { run = v < .002 ? run + 1 : 0; longest = Math.max(longest, run); }
      const dead = slices.filter(v => v < .002).length;
      const labels = [...new Set(xxdDraw.timeline.map(s => s.label).filter(Boolean))];
      return {slices, dead, longest_dead_run: longest, weak: slices.filter(v => v < .01).length, strip: slices.map(v => v < .002 ? '·' : v < .01 ? '▂' : v < .04 ? '▅' : '█').join(''),
        strokes: xxdDraw.timeline.length, labels, pass: dead <= 3 && longest <= 3};
    }, duration);
    console.log(`PACING ${report.pacing.pass ? 'OK' : 'FIX'} ${report.pacing.strip} dead=${report.pacing.dead}/24 run=${report.pacing.longest_dead_run} strokes=${report.pacing.strokes}`);
    if (!quick) {await save('zero', 0); await save('middle', duration / 2);}
    await save('final', duration);
    report.canvas_count = await page.locator('canvas').count();
    assert.equal(report.canvas_count, 1);
    if (!quick) {
    report.replay = await page.evaluate(duration => {
      const art = document.querySelector('canvas');
      const snapshot = () => {
        const c = document.createElement('canvas'); c.width = art.width; c.height = art.height;
        const x = c.getContext('2d'); x.drawImage(art, 0, 0);
        return x.getImageData(0, 0, c.width, c.height).data;
      };
      const first = snapshot(); xxdDraw.restart(); xxdDraw.seek(duration); const second = snapshot();
      let maximum = 0, changed = 0;
      for (let i = 0; i < first.length; i++) {
        const d = Math.abs(first[i] - second[i]); maximum = Math.max(maximum, d); if (d > 2) changed++;
      }
      return {max_channel_difference: maximum, channels_over_2: changed, pass: maximum <= 3}; // Apple GPU rounding seen up to 3
    }, duration);
    assert(report.replay.pass, 'Replay changed beyond GPU rounding tolerance');
    await page.setViewportSize({width: 375, height: 812});
    report.mobile = await page.evaluate(() => ({width: innerWidth, scroll_width: document.documentElement.scrollWidth,
      canvas_width: document.querySelector('canvas').getBoundingClientRect().width}));
    assert(report.mobile.scroll_width <= report.mobile.width, 'Mobile overflow');
    await page.screenshot({path: path.join(output, 'mobile.png')});
    await page.setViewportSize({width: 900, height: 850});
    }
    if (!noStructure) {
    await page.goto(pathToFileURL(path.join(isolated, 'structure.html')).href + '?t=0');
    await ready(page); await save('structure', await end(page));
    }
    if (!quick) {
    fs.writeFileSync(path.join(isolated, 'frame.html'), '<iframe style="width:650px;height:740px" src="art.html?t=0"></iframe>');
    await page.goto(pathToFileURL(path.join(isolated, 'frame.html')).href);
    const frame = page.frames().find(f => f !== page.mainFrame());
    await ready(frame); await frame.evaluate(t => xxdDraw.seek(t), duration);
    report.iframe = await frame.evaluate(() => ({canvas_count: document.querySelectorAll('canvas').length, progress: xxdDraw.progress}));
    assert.equal(report.iframe.canvas_count, 1); assert.equal(report.iframe.progress, 1);
    }
    assert.deepEqual(errors, []); assert.deepEqual(network, []);
    report.isolated_offline = true;
    report.sha256 = Object.fromEntries([['html', art], ...(noStructure ? [] : [['structure_html', structure]]), ['final', path.join(output, 'final.png')]]
      .map(([key, file]) => [key, createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
    report.pass = true;
    report.evidence = Object.fromEntries(expectedEvidence.map(name => [name, hash(path.join(output, name))]));
    console.log('PASS ' + mode + '; visual review still required: ' + output);
  } catch (e) {report.pass = false; report.failure = e.message; throw e;}
  finally {
    report.elapsed_ms = Date.now() - started;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    await browser.close(); fs.rmSync(isolated, {recursive: true, force: true});
  }
}
main().catch(e => {console.error(e.message); process.exitCode = 1;});
