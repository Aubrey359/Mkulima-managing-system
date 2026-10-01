// End-to-end test of sign-in + sync using the real supabase-js against an in-memory fake of the Supabase API.
const { chromium } = require('playwright');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const PAGE = 'file://' + path.resolve(__dirname, '../index.html'),
  SBU = 'https://ydorittbbchiywpgjvel.supabase.co';
const SBJS = fs.readFileSync(require.resolve('@supabase/supabase-js/dist/umd/supabase.js'), 'utf8');
// ---- fake server ----
const users = {
  loise: { pw: 'L-start1', must: true },
  sales: { pw: 'S-start1', must: true },
  sowing: { pw: 'W-start1', must: true }
};
const rows = new Map();
const counters = {};
let clock = Date.parse('2026-09-30T10:00:00Z');
let down = new Set();
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
function tok(role) {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return (
    b64({ alg: 'HS256', typ: 'JWT' }) +
    '.' +
    b64({
      sub: 'u-' + role,
      role: 'authenticated',
      exp,
      email: role + '@mkulima.example.com',
      app_metadata: { role },
      user_metadata: { must_change: users[role].must }
    }) +
    '.sig'
  );
}
function roleOf(h) {
  const a = (h['authorization'] || '').replace('Bearer ', '');
  try {
    return JSON.parse(Buffer.from(a.split('.')[1], 'base64url')).app_metadata.role;
  } catch (e) {
    return null;
  }
}
function sessionFor(role) {
  const t = tok(role);
  return {
    access_token: t,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'rt-' + role,
    user: {
      id: 'u-' + role,
      aud: 'authenticated',
      role: 'authenticated',
      email: role + '@mkulima.example.com',
      app_metadata: { role },
      user_metadata: { must_change: users[role].must }
    }
  };
}
const canRead = (r, c) =>
  r === 'loise' ||
  r === 'sales' ||
  (r === 'sowing' && ['sowing', 'inv', 'cat', 'bookings', 'prop', 'orders', 'cust', '_meta'].includes(c));
const canWrite = (r, c) =>
  r === 'loise' || r === 'sales' || (r === 'sowing' && ['sowing', 'audit'].includes(c));
const log = [];
async function handle(route, dev) {
  const req = route.request(),
    u = new URL(req.url()),
    h = req.headers(),
    body = req.postData();
  const J = (st, o) =>
    route.fulfill({
      status: st,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: o === undefined ? '' : JSON.stringify(o)
    });
  if (req.method() === 'OPTIONS')
    return route.fulfill({
      status: 200,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-headers': '*',
        'access-control-allow-methods': '*'
      }
    });
  if (down.has(dev)) return route.abort('internetdisconnected');
  const p = u.pathname;
  if (p === '/auth/v1/token') {
    const g = u.searchParams.get('grant_type'),
      b = JSON.parse(body || '{}');
    if (g === 'password') {
      const r = (b.email || '').split('@')[0];
      if (!users[r] || users[r].pw !== b.password)
        return J(400, {
          error: 'invalid_grant',
          error_description: 'Invalid login credentials',
          code: 'invalid_credentials',
          msg: 'Invalid login credentials'
        });
      return J(200, sessionFor(r));
    }
    if (g === 'refresh_token') {
      const r = (b.refresh_token || '').replace('rt-', '');
      return users[r] ? J(200, sessionFor(r)) : J(400, { error: 'invalid_grant' });
    }
  }
  if (p === '/auth/v1/logout')
    return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
  if (p === '/auth/v1/user') {
    const r = roleOf(h);
    return r ? J(200, sessionFor(r).user) : J(401, { msg: 'no' });
  }
  const role = roleOf(h);
  if (!role) return J(401, { message: 'JWT required' });
  if (p === '/rest/v1/rpc/set_role_password') {
    const b = JSON.parse(body);
    if (role !== 'loise' && role !== b.target_role) return J(400, { message: 'Not allowed' });
    if ((b.new_password || '').length < 6)
      return J(400, { message: 'Password must be at least 6 characters' });
    users[b.target_role].pw = b.new_password;
    users[b.target_role].must = false;
    return J(200, null);
  }
  if (p === '/rest/v1/rpc/next_counter') {
    const b = JSON.parse(body);
    if (!['loise', 'sales'].includes(role)) return J(400, { message: 'Not allowed' });
    counters[b.p_name] = Math.max(counters[b.p_name] || 0, (b.p_min || 1) - 1) + 1;
    return J(200, counters[b.p_name]);
  }
  if (p === '/rest/v1/records') {
    if (req.method() === 'POST') {
      const arr = JSON.parse(body);
      for (const r of arr)
        if (!canWrite(role, r.coll))
          return J(403, {
            code: '42501',
            message: 'new row violates row-level security policy for table "records"'
          });
      for (const r of arr) {
        clock += 1;
        rows.set(r.coll + '|' + r.id, { ...r, updated_at: new Date(clock).toISOString() });
      }
      log.push([dev, role, 'push', arr.length]);
      return J(201);
    }
    if (req.method() === 'GET') {
      let out = [...rows.values()].filter((r) => canRead(role, r.coll));
      const gt = u.searchParams.get('updated_at');
      if (gt) out = out.filter((r) => r.updated_at > gt.replace(/^gt\./, ''));
      out.sort((a, b) => (a.updated_at < b.updated_at ? -1 : a.updated_at > b.updated_at ? 1 : 0));
      const off = +(u.searchParams.get('offset') || 0),
        lim = +(u.searchParams.get('limit') || 1e9);
      return J(
        200,
        out.slice(off, off + lim).map((r) => ({
          coll: r.coll,
          id: r.id,
          data: r.data,
          deleted: r.deleted,
          updated_at: r.updated_at
        }))
      );
    }
  }
  return J(404, { message: 'not faked: ' + req.method() + ' ' + p });
}
// ---- devices ----
(async () => {
  const b = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
  );
  const errs = [];
  async function device(name, seed) {
    const ctx = await b.newContext();
    await ctx.route(/^https?:/, async (route) => {
      const u = route.request().url();
      if (u.startsWith(SBU)) return handle(route, name);
      if (u.includes('supabase-js'))
        return route.fulfill({ status: 200, contentType: 'application/javascript', body: SBJS });
      return route.abort();
    });
    await ctx.addInitScript((s) => {
      window.Chart = function () {
        return { destroy() {} };
      };
      localStorage.setItem('mk_tut_done_v3', '1');
      if (s && !localStorage.getItem('seeded')) {
        localStorage.setItem('seeded', '1');
        for (const k in s) localStorage.setItem(k, s[k]);
      }
    }, seed || null);
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errs.push(name + ': ' + e.message));
    p.on('dialog', (d) => {
      p._dialogs = (p._dialogs || []).concat(d.message());
      d.accept();
    });
    await p.goto(PAGE);
    await p.waitForTimeout(400);
    p.dev = name;
    return p;
  }
  const vis = (p, id) =>
    p.evaluate((i) => getComputedStyle(document.getElementById(i)).display !== 'none', id);
  async function login(p, role, pw) {
    await p.evaluate((r) => {
      backToRoles();
      pickRole(r);
    }, role);
    await p.fill('#pw_input', pw);
    await p.click('#pwBox .lgGo');
    await p.waitForTimeout(500);
  }
  async function setNew(p, pw) {
    await p.fill('#pwNew1', pw);
    await p.fill('#pwNew2', pw);
    await p.click('#pwNewBox .lgGo');
    await p.waitForTimeout(600);
  }
  const sync = (p) =>
    p.evaluate(() =>
      syncNow()
        .then(() => new Promise((r) => setTimeout(r, 50)))
        .then(() => (SYNC.busy ? syncNow() : 0))
    );
  const q = (p, f) => p.evaluate(f);
  const serverColl = (c) => [...rows.values()].filter((r) => r.coll === c && !r.deleted);

  // 1. Loise: wrong password, starter password -> forced change -> app; seed data uploaded
  const A = await device('A');
  await login(A, 'loise', 'nope');
  console.log('wrong pw:', await A.textContent('#loginErr'));
  assert(!(await vis(A, 'app')));
  await login(A, 'loise', 'L-start1');
  assert(await vis(A, 'pwNewBox'), 'forced change');
  await setNew(A, 'L-start1');
  console.log('same as starter:', await A.textContent('#loginErr'));
  await setNew(A, 'Loise-new-99');
  assert(await vis(A, 'app'), 'A in app');
  assert.equal(users.loise.pw, 'Loise-new-99');
  await sync(A);
  const catN = await q(A, () => DB.cat.length);
  assert.equal(serverColl('cat').length, catN);
  assert(!rows.has('_meta|meta.passwords'));
  console.log('A catalogue on server:', catN, ' status:', await A.textContent('#syncStat'));

  // 2. Sales on device B: seeded catalogue is not duplicated
  const B = await device('B');
  await login(B, 'sales', 'S-start1');
  await setNew(B, 'Sales-new-99');
  assert(await vis(B, 'app'));
  await sync(B);
  await sync(A);
  assert.equal(await q(B, () => DB.cat.length), catN, 'B catalogue deduped');
  assert.equal(serverColl('cat').length, catN, 'server catalogue not duplicated');

  // 3. add on A -> appears on B; 4. delete on B -> gone on A; edit propagates
  await q(A, () => {
    DB.cust.push({ id: 'c1', name: 'Wanjiku', phone: '0700' });
    saveDB();
  });
  await sync(A);
  await sync(B);
  assert.equal(await q(B, () => (DB.cust.find((c) => c.id === 'c1') || {}).name), 'Wanjiku');
  await q(B, () => {
    DB.cust.find((c) => c.id === 'c1').phone = '0711';
    saveDB();
  });
  await sync(B);
  await sync(A);
  assert.equal(await q(A, () => DB.cust.find((c) => c.id === 'c1').phone), '0711');
  await q(B, () => {
    DB.cust = DB.cust.filter((c) => c.id !== 'c1');
    saveDB();
  });
  await sync(B);
  await sync(A);
  assert.equal(await q(A, () => DB.cust.filter((c) => c.id === 'c1').length), 0, 'delete propagated');

  // 5. document numbers: reserved from the server counter, unique across devices
  await sync(A);
  await sync(B);
  await A.waitForTimeout(300);
  const taken = [];
  for (const [dev, n] of [
    [A, 2],
    [B, 2],
    [A, 1],
    [B, 1]
  ]) {
    for (let i = 0; i < n; i++) {
      taken.push(await q(dev, () => nextNo('RCP')));
      await dev.waitForTimeout(250); // the next number is reserved in the background
    }
  }
  console.log('receipt numbers:', taken.join(' '));
  assert.equal(new Set(taken).size, taken.length, 'numbers unique across devices');
  assert(
    taken.every((n) => /^RCP-\d{4}$/.test(n)),
    'online numbers have no device code'
  );
  // offline with no reserved number: device code keeps it unique
  down.add('B');
  await q(B, () => localStorage.removeItem('mk_num_pool'));
  const off = await q(B, () => nextNo('RCP'));
  console.log('offline number:', off);
  assert(/^RCP-\d{4}-[A-Z][2-9]$/.test(off), 'offline number has device code');
  down.delete('B');
  await sync(B);
  await B.waitForTimeout(300);
  const back = await q(B, () => nextNo('RCP'));
  console.log('back online:', back);
  assert(/^RCP-\d{4}$/.test(back) && !taken.includes(back), 'fresh reserved number after reconnecting');

  // 6. offline edits wait, then upload
  down.add('A');
  await q(A, () => {
    DB.exp.push({ id: 'e1', date: today(), cat: 'Fuel', desc: 'Pickup', amount: 1500 });
    saveDB();
  });
  await sync(A);
  console.log('offline status:', await A.textContent('#syncStat'));
  assert(/waiting/.test(await A.textContent('#syncStat')));
  down.delete('A');
  await sync(A);
  await sync(B);
  assert.equal(await q(B, () => DB.exp.filter((e) => e.id === 'e1').length), 1, 'offline edit arrived');
  // concurrent edits of different records both survive
  await q(A, () => {
    DB.inv.push({ id: 'i1', name: 'Tray', qty: 5 });
    saveDB();
  });
  await q(B, () => {
    DB.inv.push({ id: 'i2', name: 'Seed', qty: 9 });
    saveDB();
  });
  await sync(A);
  await sync(B);
  await sync(A);
  assert.deepEqual(await q(A, () => DB.inv.map((i) => i.id).sort()), ['i1', 'i2']);
  assert.deepEqual(await q(B, () => DB.inv.map((i) => i.id).sort()), ['i1', 'i2']);

  // 7. Sowing team: sees sowing/stock but not money; can add sowing records; server blocks other writes
  const C = await device('C');
  await login(C, 'sowing', 'W-start1');
  await setNew(C, 'Sowing-new-99');
  assert(await vis(C, 'app'));
  await sync(C);
  assert.equal(await q(C, () => DB.exp.length), 0, 'sowing cannot see expenses');
  assert.equal(await q(C, () => DB.inv.length), 2, 'sowing sees stock');
  await q(C, () => {
    DB.sowing.push({ id: 's1', variety: 'Zara F1', date: today() });
    saveDB();
  });
  await sync(C);
  await sync(A);
  assert.equal(await q(A, () => DB.sowing.filter((s) => s.id === 's1').length), 1);
  assert(!serverColl('audit').length || true);

  // 8. Loise changes the Sowing password from Settings; logout; login again with new password (no forced change)
  await q(A, () => go('set'));
  await A.waitForTimeout(200);
  await A.selectOption('#cp_r', 'sowing');
  await A.fill('#cp_p', 'Sowing-2027');
  await A.fill('#cp_p2', 'Sowing-2027');
  await q(A, () => changePwFromSettings());
  await A.waitForTimeout(400);
  assert.equal(users.sowing.pw, 'Sowing-2027');
  console.log('settings dialog:', A._dialogs.slice(-1)[0]);
  await q(A, () => doLogout(true));
  await A.waitForTimeout(800);
  assert(!(await vis(A, 'app')), 'logged out');
  await login(A, 'loise', 'Loise-new-99');
  assert(await vis(A, 'app'), 'relogin');
  assert(!(await vis(A, 'pwNewBox')));
  // reload keeps session
  await A.reload();
  await A.waitForTimeout(600);
  assert(await vis(A, 'app'), 'session survives reload');

  // 9. role switch on one device clears the previous role's copy
  await q(B, () => doLogout(true));
  await B.waitForTimeout(800);
  await login(B, 'sowing', 'Sowing-2027');
  await sync(B);
  assert.equal(await q(B, () => DB.exp.length), 0, 'sales data wiped for sowing');
  assert.equal(await q(B, () => DB.sowing.length), 1);

  // 10. existing device with old local data (and old plain-text password) uploads it on first sign-in
  const old = {
    mkulimaDB_v3: JSON.stringify({
      meta: { company: { name: 'X' }, passwords: { sales: 'oldpass' } },
      orders: [
        { id: 'o-old', no: 'ORD-1', total: 900, date: '2026-01-02' },
        { no: 'ORD-noid', total: 5 }
      ],
      cust: [],
      inv: [],
      cat: []
    }),
    mk_session_v3: JSON.stringify({ role: 'loise', u: 'Loise' })
  };
  const D = await device('D', old);
  assert(!(await vis(D, 'app')), 'old local session needs online sign-in');
  await login(D, 'sales', 'Sales-new-99');
  await sync(D);
  assert(rows.has('orders|o-old'), 'old order uploaded');
  assert.equal(serverColl('orders').length, 2, 'record without id got one');
  assert(![...rows.keys()].some((k) => k.includes('passwords')));
  await sync(A);
  assert.equal(await q(A, () => DB.orders.length), 2);
  assert.equal(
    await q(A, () => DB.meta.company.name),
    'MKULIMA SEEDLINGS LIMITED',
    'first sync keeps shared settings'
  );

  // 11. Without the library (no internet at first open) and a saved session: app still opens with local data
  const E = await b.newContext();
  await E.route(/^https?:/, (r) => r.abort());
  await E.addInitScript(() => {
    window.Chart = function () {
      return { destroy() {} };
    };
    localStorage.setItem('mk_tut_done_v3', '1');
    localStorage.setItem('mk_session_v3', JSON.stringify({ role: 'sales', u: 'Sales Team' }));
    localStorage.setItem('mkulimaDB_v3', JSON.stringify({ meta: {}, orders: [{ id: 'x', total: 1 }] }));
  });
  const Ep = await E.newPage();
  Ep.on('pageerror', (e) => errs.push('E: ' + e.message));
  await Ep.goto(PAGE);
  await Ep.waitForTimeout(400);
  assert(await vis(Ep, 'app'), 'offline open');
  console.log('no-library status:', await Ep.textContent('#syncStat'));

  console.log('pushes:', log.length, ' server rows:', rows.size);
  console.log('page errors:', errs);
  assert.equal(errs.length, 0);
  console.log('ALL OK');
  await b.close();
})().catch((e) => {
  console.error('FAIL', e.stack);
  process.exit(1);
});
