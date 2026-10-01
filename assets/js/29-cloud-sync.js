/* ================= CLOUD SYNC (Supabase) =================
 Every record is one row in the online "records" table (coll = list name, id = record id).
 The browser keeps a full local copy so the app works offline; changes are uploaded and
 other devices' changes downloaded every few seconds when online.
 SYNC.shadow remembers the last version of each record known to be on the server, so
 comparing it with DB tells us exactly what changed locally. */
var SB_URL = 'https://ydorittbbchiywpgjvel.supabase.co',
  SB_KEY = 'sb_publishable_kxLESJMSPyUZ33y1caeKwQ_znRXLmh4';
var ROLE_EMAIL = {
  loise: 'loise@mkulima.example.com',
  sales: 'sales@mkulima.example.com',
  sowing: 'sowing@mkulima.example.com'
};
var SYNC_COLLS = [
  'orders',
  'docs',
  'bookings',
  'inv',
  'sowing',
  'cust',
  'exp',
  'income',
  'emp',
  'att',
  'loans',
  'sup',
  'purch',
  'follow',
  'pricehist',
  'audit',
  'prop',
  'cat',
  'loanpay',
  'payroll'
];
var SYNC_SHADOW_KEY = 'mk_sync_shadow',
  SYNC_LAST_KEY = 'mk_sync_last',
  SYNC_ROLE_KEY = 'mk_sync_role',
  SYNC_EVERY = 20000;
var SB = null,
  SYNC = {
    shadow: {},
    busy: false,
    again: false,
    timer: null,
    soon: null,
    state: 'idle',
    err: '',
    at: null,
    started: false
  };

function sbInit() {
  if (SB) return SB;
  try {
    if (window.supabase && supabase.createClient)
      SB = supabase.createClient(SB_URL, SB_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, storageKey: 'mk_sb_auth' }
      });
  } catch (e) {
    SB = null;
  }
  return SB;
}
function syncLoadShadow() {
  try {
    SYNC.shadow = JSON.parse(localStorage.getItem(SYNC_SHADOW_KEY)) || {};
  } catch (e) {
    SYNC.shadow = {};
  }
}
function syncSaveShadow() {
  try {
    localStorage.setItem(SYNC_SHADOW_KEY, JSON.stringify(SYNC.shadow));
  } catch (e) {}
}
// What a role may upload (the server enforces the same rule)
function syncWritable(coll, r) {
  r = r || role();
  return r === 'loise' || r === 'sales' || (r === 'sowing' && (coll === 'sowing' || coll === 'audit'));
}
// Counters (receipt numbers etc.) must never go backwards when two devices disagree
function syncIsCounter(id) {
  return id === 'mpesa' || /^meta\.[A-Z]{2,5}$/.test(id);
}
function syncFlatten() {
  var m = {};
  SYNC_COLLS.forEach(function (c) {
    (DB[c] || []).forEach(function (r) {
      if (r && r.id != null) m[c + '|' + r.id] = JSON.stringify(r);
    });
  });
  Object.keys(DB.meta || {}).forEach(function (k) {
    if (k !== 'passwords' && DB.meta[k] !== undefined) m['_meta|meta.' + k] = JSON.stringify(DB.meta[k]);
  });
  m['_meta|autofill'] = JSON.stringify(DB.autofill || {});
  m['_meta|mpesa'] = JSON.stringify(DB.mpesa);
  return m;
}
function syncSplit(k) {
  var i = k.indexOf('|');
  return [k.slice(0, i), k.slice(i + 1)];
}
// Keys changed on this device but not yet uploaded
function syncPendingKeys(r) {
  var cur = syncFlatten(),
    out = [],
    k;
  for (k in cur) if (cur[k] !== SYNC.shadow[k] && syncWritable(syncSplit(k)[0], r)) out.push(k);
  for (k in SYNC.shadow) if (!(k in cur) && syncWritable(syncSplit(k)[0], r)) out.push(k);
  return out;
}
function syncSaveLocal() {
  localStorage.setItem(DB_KEY, JSON.stringify(DB));
  localStorage.setItem(DB_KEY + '_bak', JSON.stringify(DB));
}

function syncPush() {
  var cur = syncFlatten(),
    rows = [],
    keys = syncPendingKeys();
  keys.forEach(function (k) {
    var p = syncSplit(k);
    rows.push(
      k in cur
        ? { coll: p[0], id: p[1], data: JSON.parse(cur[k]), deleted: false }
        : { coll: p[0], id: p[1], data: null, deleted: true }
    );
  });
  if (!rows.length) return Promise.resolve(0);
  var chunks = [];
  for (var i = 0; i < rows.length; i += 500) chunks.push(rows.slice(i, i + 500));
  return chunks
    .reduce(function (p, ch) {
      return p.then(function () {
        return SB.from('records')
          .upsert(ch, { onConflict: 'coll,id' })
          .then(function (res) {
            if (res.error) throw res.error;
            ch.forEach(function (r) {
              var k = r.coll + '|' + r.id;
              if (r.deleted) delete SYNC.shadow[k];
              else SYNC.shadow[k] = cur[k];
            });
            syncSaveShadow();
          });
      });
    }, Promise.resolve())
    .then(function () {
      return rows.length;
    });
}

function syncFetchSince(since) {
  var all = [],
    size = 1000;
  function page(from) {
    var q = SB.from('records')
      .select('coll,id,data,deleted,updated_at')
      .order('updated_at', { ascending: true })
      .order('coll')
      .order('id')
      .range(from, from + size - 1);
    // Re-read the last minute too, in case a slow save on another device committed late
    if (since) q = q.gt('updated_at', new Date(Date.parse(since) - 60000).toISOString());
    return q.then(function (res) {
      if (res.error) throw res.error;
      all = all.concat(res.data || []);
      return (res.data || []).length === size ? page(from + size) : all;
    });
  }
  return page(0);
}

function syncPull() {
  var since = localStorage.getItem(SYNC_LAST_KEY),
    first = !since;
  return syncFetchSince(since).then(function (rows) {
    if (!rows.length) return 0;
    var cur = syncFlatten(),
      changed = 0,
      last = since,
      byColl = {};
    if (first) {
      // A new device seeds its own catalogue: drop those copies where the shared catalogue already has the item
      var have = {};
      rows.forEach(function (r) {
        if (r.coll === 'cat' && !r.deleted && r.data)
          have[(r.data.group + '|' + r.data.name).toLowerCase()] = 1;
      });
      var before = (DB.cat || []).length;
      DB.cat = (DB.cat || []).filter(function (c) {
        return (
          SYNC.shadow['cat|' + c.id] !== undefined ||
          !have[(c.group + '|' + c.name).toLowerCase()] ||
          rows.some(function (r) {
            return r.coll === 'cat' && r.id === String(c.id);
          })
        );
      });
      if (DB.cat.length !== before) {
        changed++;
        cur = syncFlatten();
      }
    }
    rows.forEach(function (r) {
      if (!last || r.updated_at > last) last = r.updated_at;
      var k = r.coll + '|' + r.id,
        srv = r.deleted ? undefined : JSON.stringify(r.data),
        mine = cur[k],
        localEdit = mine !== SYNC.shadow[k];
      if (srv === mine) {
        if (SYNC.shadow[k] !== srv) {
          if (srv === undefined) delete SYNC.shadow[k];
          else SYNC.shadow[k] = srv;
        }
        return;
      }
      if (syncIsCounter(r.id) && srv !== undefined && mine !== undefined) {
        var a = JSON.parse(mine),
          b = JSON.parse(srv);
        SYNC.shadow[k] = srv;
        if (b > a) {
          syncSet(r.coll, r.id, b, byColl);
          changed++;
        }
        return;
      }
      // Unsaved local edit wins (it is uploaded next), except settings on a device's very first sync
      if (localEdit && !(first && r.coll === '_meta')) return;
      if (srv === undefined) delete SYNC.shadow[k];
      else SYNC.shadow[k] = srv;
      syncSet(r.coll, r.id, srv === undefined ? undefined : r.data, byColl);
      changed++;
    });
    Object.keys(byColl).forEach(function (c) {
      var ch = byColl[c],
        seen = {};
      var arr = (DB[c] || [])
        .filter(function (x) {
          var id = String(x.id);
          seen[id] = 1;
          return !(id in ch) || ch[id] !== undefined;
        })
        .map(function (x) {
          var id = String(x.id);
          return id in ch ? ch[id] : x;
        });
      Object.keys(ch).forEach(function (id) {
        if (!seen[id] && ch[id] !== undefined) arr.push(ch[id]);
      });
      DB[c] = arr;
    });
    syncSaveShadow();
    if (last) localStorage.setItem(SYNC_LAST_KEY, last);
    if (changed) syncSaveLocal();
    return changed;
  });
}
function syncSet(coll, id, val, byColl) {
  if (coll === '_meta') {
    if (id.indexOf('meta.') === 0) {
      if (val === undefined) delete DB.meta[id.slice(5)];
      else DB.meta[id.slice(5)] = val;
    } else if (id === 'autofill') DB.autofill = val || {};
    else if (id === 'mpesa' && val !== undefined) DB.mpesa = val;
    return;
  }
  if (SYNC_COLLS.indexOf(coll) < 0) return;
  (byColl[coll] = byColl[coll] || {})[id] = val;
}

function syncNow() {
  if (!sbInit() || !session || !SYNC.started) return Promise.resolve();
  if (SYNC.busy) {
    SYNC.again = true;
    return Promise.resolve();
  }
  SYNC.busy = true;
  SYNC.again = false;
  syncShow('busy');
  // A device's first sync downloads before uploading, so the shared data wins over its fresh defaults
  var first = !localStorage.getItem(SYNC_LAST_KEY);
  return (
    first
      ? syncPull().then(function (c) {
          return syncPush().then(function () {
            return c;
          });
        })
      : syncPush().then(syncPull)
  )
    .then(function (changed) {
      SYNC.at = new Date();
      SYNC.err = '';
      syncShow('ok');
      numRefill();
      if (changed) syncRefreshView();
    })
    .catch(function (e) {
      SYNC.err = (e && e.message) || String(e);
      syncShow(navigator.onLine === false || netErr(e) ? 'offline' : 'err');
    })
    .then(function () {
      SYNC.busy = false;
      if (SYNC.again) syncSoon();
    });
}
function syncSoon() {
  clearTimeout(SYNC.soon);
  SYNC.soon = setTimeout(syncNow, 1500);
}
function syncStart() {
  if (SYNC.started) return;
  SYNC.started = true;
  syncNow();
  SYNC.timer = setInterval(syncNow, SYNC_EVERY);
}
function syncStop() {
  SYNC.started = false;
  clearInterval(SYNC.timer);
  clearTimeout(SYNC.soon);
}
// Redraw the page with downloaded changes, unless someone is typing or a form is open
function syncRefreshView() {
  try {
    updateBell();
  } catch (e) {}
  var a = document.activeElement,
    typing = a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName),
    modal = document.getElementById('modalWrap').style.display === 'flex';
  if (typing || modal) {
    SYNC.needView = true;
    return;
  }
  SYNC.needView = false;
  try {
    go(CUR);
  } catch (e) {}
}
function syncShow(st) {
  SYNC.state = st;
  var el = document.getElementById('syncStat');
  if (!el) return;
  var n = st === 'ok' || st === 'busy' ? 0 : syncPendingKeys().length,
    tm = SYNC.at ? SYNC.at.toTimeString().slice(0, 5) : '';
  var txt =
    st === 'busy'
      ? 'Syncing…'
      : st === 'ok'
        ? 'Synced ' + tm
        : st === 'offline' || !SB
          ? 'Offline' + (n ? ' — ' + n + ' change' + (n > 1 ? 's' : '') + ' waiting' : '')
          : 'Sync problem' + (n ? ' — ' + n + ' waiting' : '');
  el.textContent = txt;
  el.title = st === 'err' ? SYNC.err + ' — click to retry' : 'Click to sync now';
  el.style.color =
    st === 'ok'
      ? 'var(--green2)'
      : st === 'busy'
        ? 'var(--muted)'
        : st === 'offline'
          ? 'var(--amber)'
          : 'var(--red)';
}
window.addEventListener('online', function () {
  syncNow();
});
window.addEventListener('focus', function () {
  syncNow();
});
document.addEventListener('focusout', function () {
  if (SYNC.needView)
    setTimeout(function () {
      if (SYNC.needView) syncRefreshView();
    }, 300);
});
/* Document numbers (RCP-0012, PRP-0003, ...)
 Each device keeps one number per prefix reserved in advance from the shared server counter,
 so two devices can never issue the same number. With nothing reserved (offline), the device
 uses its own count plus a device code instead, e.g. RCP-0012-K7, which is still unique. */
var NUM_POOL_KEY = 'mk_num_pool',
  NUM_PREFIXES = ['RCP', 'PRP', 'QUO', 'INV', 'DEL', 'REQ', 'LPO', 'REC'],
  NUM_BUSY = {};
function numPool() {
  try {
    return JSON.parse(localStorage.getItem(NUM_POOL_KEY)) || {};
  } catch (e) {
    return {};
  }
}
function numSavePool(p) {
  try {
    localStorage.setItem(NUM_POOL_KEY, JSON.stringify(p));
  } catch (e) {}
}
function deviceCode() {
  var c = localStorage.getItem('mk_device');
  if (!c) {
    c =
      'ABCDEFGHJKMNPQRSTUVWXYZ'.charAt(Math.floor(Math.random() * 23)) +
      '23456789'.charAt(Math.floor(Math.random() * 8));
    localStorage.setItem('mk_device', c);
  }
  return c;
}
function numTake(prefix) {
  var pool = numPool(),
    n = pool[prefix],
    no;
  delete pool[prefix];
  numSavePool(pool);
  if (n) {
    DB.meta[prefix] = Math.max(DB.meta[prefix] || 0, n);
    no = prefix + '-' + String(n).padStart(4, '0');
  } else {
    DB.meta[prefix] = (DB.meta[prefix] || 0) + 1;
    no = prefix + '-' + String(DB.meta[prefix]).padStart(4, '0') + '-' + deviceCode();
  }
  saveDB();
  numRefill([prefix]);
  return no;
}
// Reserve a number for every prefix that has none (only Loise and Sales issue documents)
function numRefill(prefixes) {
  if (!SB || !session || !SYNC.started || (role() !== 'loise' && role() !== 'sales')) return;
  (prefixes || NUM_PREFIXES).forEach(function (prefix) {
    if (numPool()[prefix] || NUM_BUSY[prefix]) return;
    NUM_BUSY[prefix] = true;
    SB.rpc('next_counter', { p_name: prefix, p_min: (DB.meta[prefix] || 0) + 1 })
      .then(function (res) {
        if (res.error || !res.data) return;
        // Overtaken by a number issued offline meanwhile: reserve a fresh one above it
        if (res.data <= (DB.meta[prefix] || 0))
          return setTimeout(function () {
            numRefill([prefix]);
          }, 0);
        var pool = numPool();
        if (!pool[prefix]) {
          pool[prefix] = res.data;
          numSavePool(pool);
        }
      })
      .catch(function () {})
      .then(function () {
        NUM_BUSY[prefix] = false;
      });
  });
}
// Clear this device's copy (used when a different role signs in on the same device)
function syncWipeLocal() {
  [DB_KEY, DB_KEY + '_bak', SYNC_SHADOW_KEY, SYNC_LAST_KEY].forEach(function (k) {
    localStorage.removeItem(k);
  });
  Object.keys(localStorage)
    .filter(function (k) {
      return k.indexOf(DB_KEY + '_cloud_') === 0;
    })
    .forEach(function (k) {
      localStorage.removeItem(k);
    });
  SYNC.shadow = {};
  DB = null;
  loadDB();
}
syncLoadShadow();
