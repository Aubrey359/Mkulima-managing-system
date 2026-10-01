// Fill in and save every main form through the real UI, then check what was recorded.
const { chromium } = require('playwright');
const fs = require('fs');
const assert = require('assert');
const path = require('path');
const PAGE = 'file://' + path.resolve(__dirname, '../index.html');
const LIBS = {
  'xlsx.full.min.js': path.resolve(__dirname, '../node_modules/xlsx/dist/xlsx.full.min.js'),
  'mammoth.browser.min.js': path.resolve(__dirname, '../node_modules/mammoth/mammoth.browser.min.js'),
  'chart.umd.min.js': path.resolve(__dirname, '../node_modules/chart.js/dist/chart.umd.js')
};
(async () => {
  const b = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
  );
  const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 900 } });
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
  await ctx.addInitScript(() => {
    localStorage.setItem('mk_tut_done_v3', '1');
    localStorage.setItem('mk_session_v3', JSON.stringify({ role: 'loise', u: 'Loise' }));
    window.print = () => {
      window.__printed = (document.getElementById('printArea') || {}).innerText || '';
    };
  });
  const p = await ctx.newPage();
  const errs = [],
    dialogs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('dialog', (d) => {
    dialogs.push(d.message().slice(0, 90));
    d.type() === 'prompt' ? d.accept('5') : d.accept();
  });
  await p.goto(PAGE);
  await p.waitForTimeout(800);
  await p.evaluate(() => {
    DB.inv.push({ id: 'i1', name: 'Zara F1 Seedlings', cat: 'Seedlings', qty: 500, unit: 'pcs', price: 4 });
    DB.emp.push({
      id: 'e1',
      name: 'Otieno',
      rank: 'Sales',
      salary: 15000,
      status: 'Active',
      joined: '2026-01-01'
    });
    DB.cust.push({ id: 'c1', name: 'Wanjiku Kamau', phone: '0712345678', loc: 'Nakuru' });
    DB.sup.push({ id: 'sp1', name: 'Seed Co', phone: '0733' });
    saveDB();
  });
  const counts = () =>
    p.evaluate(() => {
      const o = {};
      for (const k in DB) if (Array.isArray(DB[k])) o[k] = DB[k].length;
      return o;
    });
  const diff = (a, c) =>
    Object.keys(c)
      .filter((k) => c[k] !== a[k])
      .map((k) => k + (c[k] > a[k] ? '+' : '') + (c[k] - a[k]))
      .join(' ');
  // Fill every visible empty field inside `scope`, then click the button whose onclick matches `save`
  async function fillSave(name, scope, save, extra) {
    const before = await counts();
    dialogs.length = 0;
    await p.evaluate(
      ({ scope, extra }) => {
        const root = document.querySelector(scope);
        root.querySelectorAll('input,select,textarea').forEach((el) => {
          if (
            !el.offsetParent ||
            el.disabled ||
            el.type === 'file' ||
            el.type === 'checkbox' ||
            el.type === 'radio'
          )
            return;
          if (el.tagName === 'SELECT') {
            if (!el.value) {
              const o = [...el.options].find((o) => o.value);
              if (o) el.value = o.value;
            }
          } else if (!el.value && !/disc|vat|comm/i.test(el.id)) {
            el.value =
              el.type === 'number'
                ? '5'
                : el.type === 'date'
                  ? today()
                  : el.type === 'time'
                    ? '08:00'
                    : el.type === 'month'
                      ? today().slice(0, 7)
                      : /phone|tel/i.test(el.id)
                        ? '0711222333'
                        : 'Test ' + (el.id || 'x');
          }
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        });
        if (extra) new Function(extra)();
      },
      { scope, extra }
    );
    const clicked = await p.evaluate(
      ({ scope, save }) => {
        const btn = [...document.querySelectorAll(scope + ' button')].find((x) =>
          new RegExp(save).test(x.getAttribute('onclick') || '')
        );
        if (!btn) return false;
        btn.click();
        return true;
      },
      { scope, save }
    );
    await p.waitForTimeout(150);
    const d = diff(before, await counts());
    console.log(
      (clicked ? '' : 'NO SAVE BUTTON ') + name.padEnd(22),
      '→',
      d || '(nothing saved)',
      dialogs.length ? ' [' + dialogs.join(' | ') + ']' : ''
    );
    await p.evaluate(() => closeModal());
    return d;
  }
  const go = (k, tab) =>
    p.evaluate(
      ({ k, tab }) => {
        go(k);
        if (tab != null) document.querySelectorAll('.main .tab')[tab].click();
      },
      { k, tab }
    );

  // ---- Sales: new sale with a stock item, fully paid
  await go('sales', 0);
  await p.evaluate(() => {
    const s = document.querySelector('#o_items .oi_item');
    s.value = 'i1';
    s.dispatchEvent(new Event('change', { bubbles: true }));
    const q = document.querySelector('#o_items .oi_qty');
    q.value = '100';
    q.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await p.evaluate(() => {
    const t = document.getElementById('o_sub');
    document.getElementById('o_paid').value = t.value;
    document.getElementById('o_custq').value = 'Mary Wambui';
  });
  const sale = await fillSave('Sale', '.main', 'saveOrder');
  await p.waitForTimeout(400);
  const o = await p.evaluate(() => DB.orders[DB.orders.length - 1]);
  console.log(
    '   sale:',
    o && o.no,
    'total',
    o && o.total,
    'paid',
    o && o.paid,
    'balance',
    o && o.balance,
    '| stock now',
    await p.evaluate(() => DB.inv.find((i) => i.id === 'i1').qty),
    '| receipt printed:',
    /RCP-/.test(await p.evaluate(() => window.__printed || document.getElementById('printArea').innerText))
  );
  assert(o && o.total === 400 && o.balance === 0, 'sale total 400 fully paid');
  assert.equal(await p.evaluate(() => DB.inv.find((i) => i.id === 'i1').qty), 400, 'stock reduced by 100');

  // ---- Credit sale, then settle it
  await go('sales', 0);
  await p.evaluate(() => {
    const s = document.querySelector('#o_items .oi_item');
    s.value = 'i1';
    s.dispatchEvent(new Event('change', { bubbles: true }));
    const q = document.querySelector('#o_items .oi_qty');
    q.value = '50';
    q.dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('o_paid').value = '50';
    document.getElementById('o_cust').value = 'c1';
  });
  await fillSave('Credit sale', '.main', 'saveOrder');
  const credit = await p.evaluate(() => DB.orders[DB.orders.length - 1]);
  console.log('   credit sale balance:', credit.balance);
  await p.evaluate((id) => payModal(id), credit.id);
  await fillSave(
    'Settle credit',
    '#modalBox',
    'savePay',
    "document.querySelectorAll('#modalBox input[type=number]').forEach(function(i){i.value='" +
      credit.balance +
      "'})"
  );
  console.log(
    '   balance after payment:',
    await p.evaluate((id) => DB.orders.find((x) => x.id === id).balance, credit.id)
  );

  // ---- Other forms
  await go('book');
  await fillSave('Booking', '.main', 'saveBook');
  await go('inv');
  await fillSave('Inventory item', '.main', 'DB\\.inv\\.push');
  await go('sow');
  await p.evaluate(() => {
    const s = document.getElementById('s_var');
    if (s) s.value = 'i1';
  });
  await fillSave('Sowing record', '.main', 'saveSow');
  await go('crm');
  await p.evaluate(() => {
    const b = [...document.querySelectorAll('.main button')].find((x) =>
      /custForm|addCust|newCust/.test(x.getAttribute('onclick') || '')
    );
    b && b.click();
  });
  await fillSave('Customer', '#modalBox', 'saveCust');
  await p.evaluate(() => addFollow('c1'));
  await fillSave('Follow-up', '#modalBox', 'saveFollow');
  await go('acc');
  await fillSave('Income', '.main', 'DB\\.income\\.push');
  await go('acc');
  await fillSave('Expense', '.main', 'DB\\.exp\\.push');
  await go('emp');
  await p.evaluate(() => {
    const b = [...document.querySelectorAll('.main button')].find((x) =>
      /empForm/.test(x.getAttribute('onclick') || '')
    );
    b && b.click();
  });
  await fillSave('Employee', '#modalBox', 'saveEmp');
  await p.evaluate(() => loanForm());
  await fillSave('Staff loan', '#modalBox', 'loanSave');
  await p.evaluate(() => payrollForm('e1'));
  await fillSave('Payroll', '#modalBox', 'payrollSave');
  await go('att');
  await p.evaluate(() => markAtt('e1', 'Present'));
  await fillSave('Attendance (present)', '#modalBox', 'attSave');
  await go('att');
  await p.evaluate(() => markAtt('e1', 'Leave'));
  console.log(
    'Attendance (leave)'.padEnd(22),
    '→',
    await p.evaluate(() => DB.att.map((a) => a.status).join(','))
  );
  await go('purch');
  await fillSave('Purchase order', '.main', 'savePurch');
  await go('sales', 2);
  await fillSave('Quotation/document', '.main', 'saveDoc');
  await go('prop');
  await fillSave(
    'Propagation job',
    '.main',
    'propSave|saveProp|propJob',
    "var q=document.getElementById('pj_qty');if(q){q.value='200';q.dispatchEvent(new Event('input',{bubbles:true}))}"
  );
  await p.evaluate(() => catForm());
  await fillSave('Catalogue item', '#modalBox', 'catSave');

  // ---- Excel export and backup download
  const dl1 = p.waitForEvent('download', { timeout: 5000 }).catch(() => null);
  await p.evaluate(() => {
    go('att');
    const b = [...document.querySelectorAll('.main button')].find((x) =>
      /exportRows/.test(x.getAttribute('onclick') || '')
    );
    b && b.click();
  });
  const x = await dl1;
  console.log('Excel export'.padEnd(22), '→', x ? x.suggestedFilename() : 'NO DOWNLOAD');
  const dls = [];
  p.on('download', (d) => dls.push(d));
  await p.evaluate(() => backup());
  await p.waitForTimeout(1500);
  console.log('Backup files'.padEnd(22), '→', dls.map((d) => d.suggestedFilename()).join(', '));
  const bk = dls.find((d) => d.suggestedFilename().endsWith('.json'));
  const bkPath = bk && (await bk.path());
  const bkData = bkPath && JSON.parse(fs.readFileSync(bkPath, 'utf8'));
  console.log(
    'Backup'.padEnd(22),
    '→',
    bk
      ? bk.suggestedFilename() +
          ' (' +
          bkData.orders.length +
          ' orders, ' +
          bkData.cust.length +
          ' customers)'
      : 'NO DOWNLOAD'
  );

  for (const r of ['sales', 'profit', 'z', 'inv', 'exp', 'att', 'sow', 'cust', 'book', 'price']) {
    await p.evaluate((r) => {
      go('rep');
      window.__printed = '';
      genRep(r);
    }, r);
    await p.waitForTimeout(250);
  }
  console.log('Reports (10 types)'.padEnd(22), '→ generated without errors');
  // ---- Restore that backup into a fresh browser
  const ctx2 = await b.newContext();
  await ctx2.route(/^https?:/, (r) => r.abort());
  await ctx2.addInitScript(() => {
    window.Chart = function () {
      return { destroy() {} };
    };
    localStorage.setItem('mk_tut_done_v3', '1');
    localStorage.setItem('mk_session_v3', JSON.stringify({ role: 'loise', u: 'Loise' }));
  });
  const p2 = await ctx2.newPage();
  p2.on('dialog', (d) => d.accept());
  p2.on('pageerror', (e) => errs.push('restore: ' + e.message));
  await p2.goto(PAGE);
  await p2.waitForTimeout(500);
  await p2.evaluate(() => go('set'));
  const fileInput = await p2.$('input[type=file][onchange*="restore"]');
  const named = path.join(require('os').tmpdir(), bk.suggestedFilename());
  fs.copyFileSync(bkPath, named);
  await fileInput.setInputFiles(named);
  await p2
    .waitForFunction(() => typeof DB !== 'undefined' && DB && DB.orders.length > 0, null, { timeout: 8000 })
    .catch(() => {});
  const restored = await p2.evaluate(() => ({ orders: DB.orders.length, cust: DB.cust.length }));
  console.log('Restore'.padEnd(22), '→', JSON.stringify(restored));
  assert.equal(restored.orders, bkData.orders.length, 'restore brings back the orders');

  console.log('page errors:', errs);
  assert.equal(errs.length, 0);
  console.log('ALL OK');
  await b.close();
})().catch((e) => {
  console.error('FAIL', e.message);
  process.exit(1);
});
