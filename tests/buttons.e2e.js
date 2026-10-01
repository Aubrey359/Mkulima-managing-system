// Click every button on every page/tab (and inside the dialogs they open) with sample data, for each role;
// fails if any click causes a JavaScript error. Usage: node tests/buttons.e2e.js [role]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const PAGE = 'file://' + path.resolve(__dirname, '../index.html');
const LIBS = {
  'xlsx.full.min.js': path.resolve(__dirname, '../node_modules/xlsx/dist/xlsx.full.min.js'),
  'mammoth.browser.min.js': path.resolve(__dirname, '../node_modules/mammoth/mammoth.browser.min.js'),
  'chart.umd.min.js': path.resolve(__dirname, '../node_modules/chart.js/dist/chart.umd.js')
};
const SKIP =
  /doLogout|logout\(|restore|resetAll|wipe|location\.reload|skipTut|startTut|tutStep|printArea|\.click\(\)/i;
async function run(ROLE) {
  const b = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
  );
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route(/^https?:/, (r) => {
    const u = r.request().url();
    for (const k in LIBS)
      if (u.endsWith(k))
        return r.fulfill({
          status: 200,
          contentType: 'application/javascript',
          body: fs.readFileSync(LIBS[k])
        });
    return r.abort();
  });
  await ctx.addInitScript((ROLE) => {
    localStorage.setItem('mk_tut_done_v3', '1');
    localStorage.setItem('mk_session_v3', JSON.stringify({ role: ROLE, u: ROLE }));
    window.print = () => {};
    window.open = () => ({ document: { write() {}, close() {} }, focus() {}, print() {}, close() {} });
  }, ROLE);
  const p = await ctx.newPage();
  let where = '';
  const errs = [];
  p.on('pageerror', (e) => errs.push(where + ' :: ' + e.message));
  p.on('dialog', (d) =>
    d.type() === 'prompt' ? d.accept('5') : d.type() === 'confirm' ? d.accept() : d.dismiss()
  );
  await p.goto(PAGE);
  await p.waitForTimeout(800);
  console.log('libs loaded:', await p.evaluate(() => [typeof XLSX, typeof Chart, typeof mammoth].join(',')));
  await p.evaluate(() => {
    const d = today();
    DB.cust.push(
      { id: 'c1', name: 'Wanjiku Kamau', phone: '0712345678', loc: 'Nakuru' },
      { id: 'c2', name: 'Otieno Farm', phone: '0722000111', loc: 'Molo' }
    );
    DB.emp.push({
      id: 'e1',
      name: 'Otieno',
      rank: 'Sales',
      salary: 15000,
      status: 'Active',
      joined: '2026-01-01',
      phone: '0700'
    });
    DB.inv.push(
      { id: 'i1', name: 'Zara F1 Seedlings', cat: 'Seedlings', qty: 500, unit: 'pcs', price: 4 },
      { id: 'i2', name: 'Zara F1 Seeds', cat: 'Seeds', qty: 20, unit: 'pkt', price: 900 }
    );
    DB.orders.push({
      id: 'o1',
      no: 'RCP-0001',
      date: d,
      custId: 'c1',
      items: [{ name: 'Zara F1', qty: 100, price: 4 }],
      total: 400,
      paid: 200,
      pay: 'credit',
      balance: 200,
      by: 'e1',
      deliver: { date: d, addr: 'Nakuru', done: false }
    });
    DB.bookings.push({
      id: 'b1',
      cname: 'Wanjiku Kamau',
      custId: 'c1',
      variety: 'Zara F1',
      qty: 100,
      ready: d,
      status: 'Pending',
      paid: 100,
      type: 'Pickup'
    });
    DB.sowing.push({ id: 's1', variety: 'Zara F1', date: d, qty: 1000, ready: d, status: 'Sown' });
    DB.prop.push({
      id: 'p1',
      no: 'PRP-0001',
      custId: 'c1',
      variety: 'Tomato',
      qty: 500,
      date: d,
      ready: d,
      status: 'Received',
      price: 2,
      paid: 0
    });
    DB.exp.push({ id: 'x1', date: d, cat: 'Fuel', desc: 'Pickup', amount: 1500 });
    DB.income.push({ id: 'n1', date: d, src: 'Consulting', amount: 3000, method: 'Cash' });
    DB.att.push({ id: 'a1', empId: 'e1', date: d, status: 'Present', in: '08:00', out: '17:00' });
    DB.loans.push({
      id: 'l1',
      empId: 'e1',
      principal: 5000,
      perMonth: 1000,
      kind: 'Loan',
      date: d,
      note: '',
      status: 'Open'
    });
    DB.sup.push({ id: 'sp1', name: 'Seed Co', phone: '0733' });
    DB.purch.push({
      id: 'pu1',
      supId: 'sp1',
      date: d,
      items: [{ name: 'Zara F1 Seeds', qty: 5, price: 900 }],
      total: 4500,
      status: 'Ordered'
    });
    DB.follow.push({ id: 'f1', custId: 'c1', date: d, type: 'Call', note: 'Check order', done: 'Pending' });
    saveDB();
  });
  const pages = await p.evaluate(() => ROLES[role()].nav);
  let clicks = 0;
  for (const pg of pages) {
    await p.evaluate((k) => go(k), pg);
    const nTabs = Math.max(1, await p.$$eval('.main .tab', (t) => t.length));
    for (let ti = 0; ti < nTabs; ti++) {
      const open = async () => {
        await p.evaluate(() => closeModal());
        await p.evaluate((k) => go(k), pg);
        if (nTabs > 1) await p.evaluate((i) => document.querySelectorAll('.main .tab')[i].click(), ti);
        await p.waitForTimeout(30);
      };
      await open();
      const nBtn = await p.$$eval('.main button, .main .btn', (bs) => bs.length);
      for (let bi = 0; bi < nBtn; bi++) {
        await open();
        const info = await p.evaluate((i) => {
          const el = document.querySelectorAll('.main button, .main .btn')[i];
          if (!el || !el.offsetParent) return null;
          return { text: (el.textContent || '').trim().slice(0, 40), on: el.getAttribute('onclick') || '' };
        }, bi);
        if (!info || SKIP.test(info.on) || /log ?out|restore/i.test(info.text)) continue;
        where = pg + '[tab ' + ti + '] "' + info.text + '"';
        await p
          .evaluate((i) => document.querySelectorAll('.main button, .main .btn')[i].click(), bi)
          .catch((e) => errs.push(where + ' :: click ' + e.message));
        clicks++;
        await p.waitForTimeout(40);
        // buttons inside a dialog it opened
        if (await p.evaluate(() => document.getElementById('modalWrap').style.display === 'flex')) {
          const nm = await p.$$eval('#modalBox button, #modalBox .btn', (bs) => bs.length);
          for (let mi = 0; mi < nm; mi++) {
            if (!(await p.evaluate(() => document.getElementById('modalWrap').style.display === 'flex')))
              break;
            const mInfo = await p.evaluate((i) => {
              const el = document.querySelectorAll('#modalBox button, #modalBox .btn')[i];
              return el
                ? { text: (el.textContent || '').trim().slice(0, 40), on: el.getAttribute('onclick') || '' }
                : null;
            }, mi);
            if (!mInfo || SKIP.test(mInfo.on) || /cancel|close|ghairi/i.test(mInfo.text)) continue;
            where = pg + '[tab ' + ti + '] "' + info.text + '" > dialog "' + mInfo.text + '"';
            await p
              .evaluate((i) => document.querySelectorAll('#modalBox button, #modalBox .btn')[i].click(), mi)
              .catch(() => {});
            clicks++;
            await p.waitForTimeout(40);
          }
        }
      }
    }
  }
  console.log(ROLE + ': clicked', clicks, 'buttons,', errs.length, 'errors');
  if (errs.length) console.log([...new Set(errs)].join('\n'));
  await b.close();
  return errs.length;
}
(async () => {
  let bad = 0;
  for (const r of process.argv[2] ? [process.argv[2]] : ['loise', 'sales', 'sowing']) bad += await run(r);
  console.log(bad ? 'FAIL' : 'ALL OK');
  process.exit(bad ? 1 : 0);
})();
