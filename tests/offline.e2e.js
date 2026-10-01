// End-to-end test: after one visit online, the app opens with no internet (service worker),
// and a new version of the app is picked up on the next online visit.
const { chromium } = require('playwright');
const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PUB = path.join(ROOT, 'public');
execSync('npm run build --silent', { cwd: ROOT });
const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json'
};
const server = http.createServer((req, res) => {
  const p = path.join(
    PUB,
    decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/\/$/, '/index.html')
  );
  if (!p.startsWith(PUB) || !fs.existsSync(p)) return res.writeHead(404).end('not found');
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
  res.end(fs.readFileSync(p));
});

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const BASE = 'http://127.0.0.1:' + server.address().port + '/';
  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
  );
  const ctx = await browser.newContext();
  await ctx.route(/^https:/, (r) => r.abort()); // no CDNs or Supabase in this test
  await ctx.addInitScript(() => {
    window.Chart = function () {
      return { destroy() {} };
    };
    localStorage.setItem('mk_tut_done_v3', '1');
    localStorage.setItem('mk_session_v3', JSON.stringify({ role: 'loise', u: 'Loise' }));
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const appShown = () =>
    page.evaluate(() => getComputedStyle(document.getElementById('app')).display !== 'none');

  // 1. first visit online: the service worker installs and saves the app
  await page.goto(BASE);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  assert(await page.evaluate(() => !!navigator.serviceWorker.controller), 'service worker controls the page');
  const saved = await page.evaluate(async () =>
    (await (await caches.open('mk-app-v1')).keys()).map((r) => new URL(r.url).pathname)
  );
  console.log('saved for offline:', saved.length, 'files');
  assert(
    saved.includes('/index.html') &&
      saved.includes('/assets/css/styles.css') &&
      saved.includes('/assets/js/30-init.js')
  );

  // 2. no internet: the app still opens, styled, with images
  await ctx.setOffline(true);
  await page.reload();
  await page.waitForTimeout(500);
  assert(await appShown(), 'app opens offline');
  const look = await page.evaluate(() => ({
    sidebar: getComputedStyle(document.querySelector('.sidebar')).backgroundImage.slice(0, 15),
    images: [...document.images].every((i) => i.complete && i.naturalWidth > 0),
    status: document.getElementById('syncStat').textContent
  }));
  console.log('offline:', JSON.stringify(look));
  assert(look.sidebar.startsWith('linear-gradient') && look.images, 'styles and images work offline');

  // 3. a new version is published: the next online visit shows it
  await ctx.setOffline(false);
  const idx = path.join(PUB, 'index.html');
  fs.writeFileSync(idx, fs.readFileSync(idx, 'utf8').replace('</body>', '<div id="version2"></div></body>'));
  const hasV2 = () => page.evaluate(() => !!document.getElementById('version2'));
  await page.reload();
  assert(await hasV2(), 'update shown when online');
  await ctx.setOffline(true);
  await page.reload();
  assert((await hasV2()) && (await appShown()), 'updated copy used offline');

  console.log('page errors:', errors);
  assert.equal(errors.length, 0);
  console.log('ALL OK');
  await browser.close();
  server.close();
  fs.rmSync(PUB, { recursive: true, force: true });
})().catch((e) => {
  console.error('FAIL', e.stack);
  process.exit(1);
});
