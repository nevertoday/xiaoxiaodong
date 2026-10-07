// Render each artwork HTML to <name>.png at its final frame (offline, same renderer as the tests).
// Usage: PLAYWRIGHT_MODULE=... node render_final.cjs a.html [b.html ...]
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch({executablePath: process.env.BROWSER_EXECUTABLE || undefined});
  const p = await b.newPage({viewport: {width: 900, height: 850}});
  for (const f of process.argv.slice(2)) {
    try {
      await p.goto('file://' + require('path').resolve(f) + '?paused');
      await p.waitForFunction(() => window.xxdDraw?.ready || window.xxdDraw?.error, null, {timeout: 120000});
      const d = await p.evaluate(() => xxdDraw.timeline ? Math.ceil(Math.max(...xxdDraw.timeline.map(t => t.start + t.duration + t.gap))) : xxdDraw.duration);
      await p.evaluate(t => xxdDraw.seek(t), d + 1);
      const png = await p.evaluate(() => xxdDraw.png());
      fs.writeFileSync(f.replace(/\.html$/, '.png'), Buffer.from(png.split(',')[1], 'base64')); console.log('ok', f);
    } catch (e) { console.log('ERR', f, e.message.split('\n')[0]); }
  }
  await b.close();
})();
