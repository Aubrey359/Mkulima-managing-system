// Every "Export (PDF)" button downloads a real PDF file with the company header and the list's rows.
const { chromium } = require('playwright');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const PAGE = 'file://' + path.resolve(__dirname, '../index.html');

(async () => {
  const b = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
  );
  const ctx = await b.newContext({ acceptDownloads: true });
  await ctx.route(/^https?:/, (r) => r.abort());
  await ctx.addInitScript(() => {
    window.Chart = function () {
      return { destroy() {} };
    };
    localStorage.setItem('mk_tut_done_v3', '1');
    const ok = (v) => Promise.resolve(v);
    const q = {
      select: () => q,
      order: () => q,
      range: () => q,
      gt: () => q,
      then: (f, r) => ok({ data: [], error: null }).then(f, r)
    };
    const session = { user: { app_metadata: { role: 'loise' }, user_metadata: {} } };
    window.supabase = {
      createClient: () => ({
        auth: {
          getSession: () => ok({ data: { session } }),
          signOut: () => ok({}),
          refreshSession: () => ok({})
        },
        from: () => ({ select: () => q, upsert: () => ok({ error: null }) }),
        rpc: () => ok({ data: 1, error: null }),
        functions: { invoke: () => ok({ data: {} }) }
      })
    };
  });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('dialog', (d) => {
    errs.push('dialog: ' + d.message());
    d.accept();
  });
  await p.goto(PAGE);
  await p.waitForTimeout(600);
  assert.equal(await p.evaluate(() => typeof window.jspdf.jsPDF), 'function', 'PDF library loaded');
  await p.evaluate(() => {
    doLoadDemo();
    closeModal();
  });
  await p.waitForTimeout(300);

  const screens = [['inv'], ['sales', 1], ['book'], ['sow'], ['crm'], ['emp'], ['att']];
  for (const [page, tab] of screens) {
    await p.evaluate(
      ([pg, tb]) => {
        if (tb !== undefined) TAB[pg] = tb;
        go(pg);
      },
      [page, tab]
    );
    await p.waitForTimeout(200);
    const btn = await p.$('.main button.blue:has-text("Export (PDF)")');
    assert(btn, page + ': Export (PDF) button');
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), btn.click()]);
    const file = await dl.path();
    const head = fs.readFileSync(file).subarray(0, 5).toString();
    const size = fs.statSync(file).size;
    console.log(page.padEnd(6), dl.suggestedFilename(), size, 'bytes');
    assert(/^Mkulima_.+_\d{4}-\d\d-\d\d\.pdf$/.test(dl.suggestedFilename()), 'file name');
    assert.equal(head, '%PDF-', page + ': is a PDF');
    assert(size > 5000, page + ': has content');
  }
  // Text the built-in PDF fonts cannot show is replaced, not garbled
  assert.equal(await p.evaluate(() => pdfText('Kales – Malkia ✓ “F1” …')), 'Kales - Malkia Yes "F1" ...');

  console.log('page errors:', errs);
  assert.equal(errs.length, 0);
  console.log('ALL OK');
  await b.close();
})().catch((e) => {
  console.error('FAIL', e.stack);
  process.exit(1);
});
