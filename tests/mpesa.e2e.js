// End-to-end test of the M-Pesa screens against a stand-in for Supabase (sign-in, the mpesa-stk
// function and the mpesa_payments table): request -> customer pays -> real receipt on the sale;
// cancelled request; paid-without-receipt; typed code; settling credit; Settings card.
const { chromium } = require('playwright');
const assert = require('assert');
const path = require('path');
const PAGE = 'file://' + path.resolve(__dirname, '../index.html');

(async () => {
  const b = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
  );
  const ctx = await b.newContext();
  await ctx.route(/^https?:/, (r) => r.abort());
  await ctx.addInitScript(() => {
    window.Chart = function () {
      return { destroy() {} };
    };
    localStorage.setItem('mk_tut_done_v3', '1');
    // ---- stand-in Supabase ----
    // window.__mp.next: what the next payment request does: 'paid' | 'cancelled' | 'paidNoReceipt'
    const F = (window.__mp = { next: 'paid', calls: [], rpc: [], rows: {}, n: 0 });
    const ok = (v) => Promise.resolve(v);
    const session = { user: { app_metadata: { role: 'loise' }, user_metadata: {} } };
    const recordsQ = {
      select() {
        return recordsQ;
      },
      order() {
        return recordsQ;
      },
      range() {
        return recordsQ;
      },
      gt() {
        return recordsQ;
      },
      then(f, r) {
        return ok({ data: [], error: null }).then(f, r);
      }
    };
    const payQ = (id) => ({
      single: () => {
        const row = F.rows[id];
        row.polls++;
        // the customer "pays" after two checks
        if (row.polls >= 2 && row.status === 'pending') {
          if (row.plan === 'cancelled') row.status = 'cancelled';
          else {
            row.status = 'paid';
            row.mpesa_receipt =
              row.plan === 'paidNoReceipt' ? null : 'SJK4TEST' + String(row.n).padStart(2, '0');
          }
        }
        return ok({
          data: {
            status: row.status,
            mpesa_receipt: row.mpesa_receipt,
            result_desc: row.status === 'cancelled' ? 'Request cancelled by user' : 'ok',
            amount: row.amount
          },
          error: null
        });
      }
    });
    window.supabase = {
      createClient: () => ({
        auth: {
          getSession: () => ok({ data: { session } }),
          signOut: () => ok({}),
          refreshSession: () => ok({})
        },
        from: (t) =>
          t === 'mpesa_payments'
            ? { select: () => ({ eq: (c, id) => payQ(id) }) }
            : { select: () => recordsQ, upsert: () => ok({ error: null }) },
        rpc: (name, args) => {
          F.rpc.push([name, args]);
          if (name === 'mpesa_status')
            return ok({ data: { configured: false, env: 'sandbox', type: 'paybill' }, error: null });
          if (name === 'set_mpesa_config') return ok({ data: null, error: null });
          return ok({ data: 1, error: null });
        },
        functions: {
          invoke: (fn, { body }) => {
            F.calls.push(body);
            if (body.action === 'stk') {
              const id = 'pay-' + ++F.n;
              F.rows[id] = { status: 'pending', polls: 0, plan: F.next, amount: body.amount, n: F.n };
              return ok({ data: { id, message: 'Success. Request accepted for processing' }, error: null });
            }
            return ok({ data: { status: 'pending' }, error: null });
          }
        }
      })
    };
  });
  const p = await ctx.newPage();
  const errs = [],
    dialogs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('dialog', (d) => {
    dialogs.push(d.message());
    d.type() === 'prompt' ? d.accept(p.__promptAnswer || '') : d.accept();
  });
  await p.goto(PAGE);
  await p.waitForTimeout(600);
  await p.evaluate(() => {
    DB.inv.push({ id: 'i1', name: 'Zara F1 Seedlings', cat: 'Seedlings', qty: 1000, unit: 'pcs', price: 4 });
    DB.cust.push({ id: 'c1', name: 'Wanjiku', phone: '0712345678' });
    saveDB();
  });
  const vis = (sel) =>
    p.evaluate((s) => {
      const e = document.querySelector(s);
      return !!e && getComputedStyle(e).display !== 'none';
    }, sel);
  async function newSale(qty) {
    await p.evaluate((qty) => {
      go('sales');
      document.querySelectorAll('.main .tab')[0].click();
      const s = document.querySelector('#o_items .oi_item');
      s.value = 'i1';
      s.dispatchEvent(new Event('change', { bubbles: true }));
      const q = document.querySelector('#o_items .oi_qty');
      q.value = String(qty);
      q.dispatchEvent(new Event('input', { bubbles: true }));
      document.getElementById('o_cust').value = 'c1';
      document.getElementById('o_phone').value = '0712345678';
      const pay = document.getElementById('o_pay');
      pay.value = 'M-Pesa';
      pay.dispatchEvent(new Event('change'));
    }, qty);
  }
  const waitFor = (fn, ms = 15000) => p.waitForFunction(fn, null, { timeout: ms });

  // 1. Request -> customer pays -> receipt and amount fill in -> saved on the sale and income
  await newSale(100);
  assert(await vis('#o_mwrap'), 'M-Pesa row shows for M-Pesa');
  await p.evaluate(() => oMpesaRequest());
  assert.equal(await p.inputValue('#mp_phone'), '0712345678', 'phone prefilled');
  assert.equal(await p.inputValue('#mp_amt'), '400', 'amount prefilled with total');
  await p.click('#mp_send');
  await waitFor(() => document.getElementById('o_mref').value !== '');
  const r1 = await p.evaluate(() => ({ ref: o_mref.value, paid: o_paid.value, ok: o_mok.textContent }));
  console.log('paid:', JSON.stringify(r1));
  assert.equal(r1.ref, 'SJK4TEST01');
  assert.equal(r1.paid, '400');
  assert.equal(await p.evaluate(() => __mp.calls[0].phone), '254712345678', 'phone sent in 2547 format');
  await p.evaluate(() => saveOrder());
  await p.waitForTimeout(400);
  const sale = await p.evaluate(() => {
    const o = DB.orders[DB.orders.length - 1];
    const inc = DB.income[DB.income.length - 1];
    return { mpesa: o.mpesa, bal: o.balance, incM: inc.mpesa, method: inc.method };
  });
  console.log('sale:', JSON.stringify(sale));
  assert.deepEqual(sale, { mpesa: 'SJK4TEST01', bal: 0, incM: 'SJK4TEST01', method: 'M-Pesa' });
  assert(!dialogs.some((d) => /M-PESA CONFIRMED/.test(d)), 'no fake confirmation message');

  // 2. Customer cancels -> clear message, nothing filled in
  await newSale(50);
  await p.evaluate(() => {
    __mp.next = 'cancelled';
    oMpesaRequest();
  });
  await p.click('#mp_send');
  await waitFor(() => /cancelled/i.test((document.getElementById('mp_msg') || {}).textContent || ''));
  console.log('cancelled:', await p.textContent('#mp_msg'));
  assert.equal(await p.inputValue('#o_mref'), '');
  await p.evaluate(() => mpesaClose());

  // 3. Paid but no receipt yet -> staff types the code from the SMS
  await p.evaluate(() => {
    __mp.next = 'paidNoReceipt';
    oMpesaRequest();
  });
  await p.click('#mp_send');
  await waitFor(() => !!document.getElementById('mp_code'));
  await p.fill('#mp_code', 'bad');
  await p.evaluate(() => mpesaManualDone(200, 'x'));
  assert(dialogs.pop().includes('does not look like'), 'bad code rejected');
  await p.fill('#mp_code', 'sjk4manual');
  await p.evaluate(() => mpesaManualDone(200, 'x'));
  assert.equal(await p.inputValue('#o_mref'), 'SJK4MANUAL');

  // 4. Typed code without a request; invalid code blocks saving
  await newSale(10);
  await p.fill('#o_mref', 'NOPE');
  await p.evaluate(() => {
    o_paid.value = o_total.value;
    oBal();
  });
  const before = await p.evaluate(() => DB.orders.length);
  await p.evaluate(() => saveOrder());
  assert.equal(await p.evaluate(() => DB.orders.length), before, 'invalid code blocks the sale');
  await p.fill('#o_mref', 'qwe1rty234');
  await p.evaluate(() => saveOrder());
  await p.waitForTimeout(300);
  assert.equal(await p.evaluate(() => DB.orders[DB.orders.length - 1].mpesa), 'QWE1RTY234');

  // 5. Settle a credit sale by M-Pesa: payment recorded automatically with the receipt
  await newSale(25);
  await p.evaluate(() => {
    const pay = document.getElementById('o_pay');
    pay.value = document.querySelector('#o_pay option').value;
    pay.dispatchEvent(new Event('change'));
    o_paid.value = 0;
    oBal();
    saveOrder();
  });
  await p.waitForTimeout(300);
  const credit = await p.evaluate(() => DB.orders[DB.orders.length - 1]);
  assert.equal(credit.balance, 100);
  await p.evaluate((id) => {
    __mp.next = 'paid';
    payModal(id);
    document.getElementById('pay_m').value = 'M-Pesa';
    document.getElementById('pay_m').dispatchEvent(new Event('change'));
    payMpesaRequest(id);
  }, credit.id);
  await p.click('#mp_send');
  await waitFor(() => DB.income.some((i) => /^SJK4TEST/.test(i.mpesa || '') && i.amount === 100));
  const settled = await p.evaluate((id) => {
    const o = DB.orders.find((x) => x.id === id);
    return { bal: o.balance, ref: o.payments[o.payments.length - 1].mpesa };
  }, credit.id);
  console.log('credit settled:', JSON.stringify(settled));
  assert.equal(settled.bal, 0);
  assert(/^SJK4TEST/.test(settled.ref));

  // 6. Settings: status shown; saving sends the values; keys cleared from the screen afterwards
  await p.evaluate(() => go('set'));
  await waitFor(() => /Not set up/.test((document.getElementById('mps_status') || {}).textContent || ''));
  await p.fill('#mps_key', 'abc');
  await p.fill('#mps_secret', 'def');
  await p.evaluate(() => mpsSave());
  await p.waitForTimeout(300);
  const saved = await p.evaluate(() => __mp.rpc.filter((r) => r[0] === 'set_mpesa_config').pop()[1]);
  assert.equal(saved.p_consumer_key, 'abc');
  assert.equal(saved.p_env, 'sandbox');
  assert.equal(await p.inputValue('#mps_key'), '', 'key cleared from the screen');

  console.log('page errors:', errs);
  assert.equal(errs.length, 0);
  console.log('ALL OK');
  await b.close();
})().catch((e) => {
  console.error('FAIL', e.stack);
  process.exit(1);
});
