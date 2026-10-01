/* ================= CORE ================= */
var DB_KEY = 'mkulimaDB_v3',
  SES_KEY = 'mk_session_v3';
var CAT_SEED = [
  ['Tomatoes', 'Zara F1', 4],
  ['Tomatoes', 'Nova F1', 5],
  ['Tomatoes', 'Ansal F1', 6],
  ['Tomatoes', 'Terminator F1', 4],
  ['Cabbages', 'Gloria F1', 2.5],
  ['Cabbages', 'Pructor F1', 2],
  ['Cabbages', 'Kilimo F1', 2],
  ['Cabbages', 'Queen F1', 2],
  ['Cabbages', 'Victoria F1', 2],
  ['Cabbages', 'Faida', 2],
  ['Cabbages', 'Powerslam', 2],
  ['Cabbages', 'Red Cabbage', 4],
  ['Spinach', 'Fordhook', 2],
  ['Spinach', 'Giant', 2],
  ['Sukuma Wiki (Kales)', 'Ahadi F1', 2],
  ['Sukuma Wiki (Kales)', 'Spinner', 2],
  ['Sukuma Wiki (Kales)', 'Tausi', 2],
  ['Sukuma Wiki (Kales)', 'Top Bunch', 2],
  ['Sukuma Wiki (Kales)', 'Thousand Headed', 2],
  ['Sukuma Wiki (Kales)', 'Curly Kales — Malkia F1', 3],
  ['Capsicum', 'Calypso', 4],
  ['Capsicum', 'Superbell', 4],
  ['Capsicum', 'Superwonder', 4],
  ['Capsicum', 'Victory Red', 15],
  ['Capsicum', 'Victory Yellow', 15],
  ['Capsicum', 'Nyuki Yellow', 15],
  ['Capsicum', 'Nyuki Red', 15],
  ['Peppers', 'Birdseye', 5],
  ['Peppers', 'Red Thunder', 5],
  ['Cauliflower', 'Bella', 3],
  ['Broccoli', 'Titanic', 3],
  ['Broccoli', 'Harriet', 3],
  ['Watermelon', 'Sukari', 6],
  ['Terere', 'Amaranthus', 2],
  ['Managu', 'Giant Nightshade', 2],
  ['Lettuce', 'Lettuce', 3],
  ['Beetroot', 'Beetroot', 4],
  ['Cucumber', 'Ashley', 6],
  ['Courgette', 'Zucchini', 6],
  ['Oranges', 'Pixie', 200],
  ['Oranges', 'Tangerine', 200],
  ['Oranges', 'Washington', 200],
  ['Avocado', 'Hass Avocado', 150],
  ['Strawberry', 'Strawberry', 50],
  ['Mangoes', 'Tommy', 150],
  ['Mangoes', 'Apple Mango', 150],
  ['Apples', 'Green Apple', 500],
  ['Apples', 'Red Apple', 500],
  ['Dragon Fruit', 'Dragon Fruit', 450],
  ['Passion Fruit', 'Purple Passion', 50],
  ['Passion Fruit', 'Yellow Passion', 50],
  ['Passion Fruit', 'Sweet Granadilla', 50],
  ['Tree Tomatoes', 'Tree Tomato', 50],
  ['Pawpaw', 'Sharp F1', 100],
  ['Pawpaw', 'Red Royale', 150],
  ['Pawpaw', 'Vega F1', 200],
  ['Pawpaw', 'Glory F1', 100],
  ['Manure (Fertilizer)', 'Goat Manure (per sack)', 500],
  ['Trays (Empty)', 'Seedling Tray — 128-cell', 60],
  ['Trays (Empty)', 'Seedling Tray — 200-cell', 50]
];
// English wording for t('key'); keys missing here would show as the raw key
var EN = {
  absent: 'Absent',
  add: 'Add',
  all: 'All',
  amount: 'Amount',
  autofill: 'Fills in automatically',
  back: 'Back',
  balance: 'Balance',
  bank: 'Bank',
  by: 'By',
  calendar: 'Calendar',
  call: 'Call',
  cash: 'Cash',
  chart: 'Chart',
  close: 'Close',
  communicated: 'Contacted via',
  contact: 'Contact',
  credit: 'Credit',
  crop: 'Crop',
  customer: 'Customer',
  date: 'Date',
  delete: 'Delete',
  discount: 'Discount',
  docs: 'Documents',
  edit: 'Edit',
  email: 'Email',
  employee: 'Employee',
  expenses: 'Expenses',
  export: 'Export (Excel)',
  follow: 'Follow up',
  grand: 'Grand total',
  import: 'Import (Excel/Word)',
  lastbought: 'Last bought',
  least: 'Least sold',
  leave: 'Leave',
  logout: 'Log out',
  method: 'Method',
  name: 'Name',
  needfu: 'Needs follow-up',
  needpay: 'customers who owe',
  newcust: 'New customer',
  next: 'Next',
  notes: 'Notes',
  nothing: 'Nothing recorded yet',
  orderbook: 'Order Book',
  owed: 'Owed',
  paid: 'Paid',
  password: 'Password',
  pending: 'Pending',
  picked: 'Picked up',
  prepared: 'Prepared by',
  present: 'Present',
  price: 'Price',
  pricehist: 'Price history',
  print: 'Print',
  printed: 'Printed',
  qty: 'Qty',
  ready: 'Ready',
  receipt: 'Receipt',
  receive: 'Receive payment',
  recent: 'Recent',
  save: 'Save',
  saved: 'Saved',
  search: 'Search',
  settle: 'Paid in full',
  skip: 'Skip tutorial',
  sms: 'SMS',
  statement: 'Statement',
  status: 'Status',
  subtotal: 'Subtotal',
  supplier: 'Supplier',
  tel: 'Phone',
  tended: 'Served by',
  terms: 'Terms',
  theme: 'Theme',
  top: 'Best sellers',
  total: 'Total',
  unpaid: 'Unpaid',
  valid: 'Valid until',
  variety: 'Variety',
  vat: 'VAT (16%)',
  visit: 'Visit',
  whatsapp: 'WhatsApp',
  wrongpass: 'Wrong password — please try again',
  zreport: 'Daily summary (Z report)'
};
var RANKS = ['Sales', 'Marketing', 'Sowing', 'Others'];
var LOGO_ICON = 'assets/logo-160.png';
// Load the logo now so it is ready when a receipt is printed
new Image().src = LOGO_ICON;
var COMPANY = {
  name: 'MKULIMA SEEDLINGS LIMITED',
  email: 'mkulimaseedlings@gmail.com',
  tel: '0711844850 / 0746424437',
  addr: 'P.O Box 880-20100, Nakuru',
  motto: 'Do It Right From The Start'
};
var ROLES = {
  loise: {
    label: 'Loise',
    desc: 'Full access to everything',
    nav: [
      'dash',
      'sales',
      'book',
      'inv',
      'cat',
      'sow',
      'prop',
      'man',
      'crm',
      'acc',
      'emp',
      'att',
      'purch',
      'rep',
      'set'
    ]
  },
  sales: {
    label: 'Sales — Managers',
    desc: 'Sales, customers, attendance, stock & reports (no employee management)',
    nav: ['dash', 'sales', 'book', 'inv', 'cat', 'sow', 'prop', 'man', 'crm', 'att', 'rep']
  },
  sowing: { label: 'Sowing Team', desc: 'Sowing records & sowing report only', nav: ['sow'] }
};
var NAV = {
  dash: ['<svg class="ic"><use href="#i-chart"/></svg>', 'Dashboard'],
  sales: ['<svg class="ic"><use href="#i-receipt"/></svg>', 'Sales'],
  book: ['<svg class="ic"><use href="#i-calendar"/></svg>', 'Bookings'],
  inv: ['<svg class="ic"><use href="#i-box"/></svg>', 'Inventory'],
  sow: ['<svg class="ic"><use href="#i-sprout"/></svg>', 'Sowing Book'],
  crm: ['<svg class="ic"><use href="#i-users"/></svg>', 'Customers'],
  cat: ['<svg class="ic"><use href="#i-book"/></svg>', 'Catalogue'],
  prop: ['<svg class="ic"><use href="#i-leaf"/></svg>', 'Propagation'],
  man: ['<svg class="ic"><use href="#i-sack"/></svg>', 'Manure'],
  acc: ['<svg class="ic"><use href="#i-money"/></svg>', 'Accounting'],
  emp: ['<svg class="ic"><use href="#i-helmet"/></svg>', 'Employees'],
  att: ['<svg class="ic"><use href="#i-clock"/></svg>', 'Attendance'],
  purch: ['<svg class="ic"><use href="#i-cart"/></svg>', 'Purchasing'],
  rep: ['<svg class="ic"><use href="#i-trend-up"/></svg>', 'Reports'],
  set: ['<svg class="ic"><use href="#i-gear"/></svg>', 'Settings']
};
var TIPS = {
  dash: 'Business overview: money in/out, team performance, credit owed, pending bookings',
  sales: 'Record direct sales, print receipts, settle credit, browse the order book',
  book: 'Reservations — customers who pay/order now and pick up later',
  inv: 'Stock levels — add items and adjust quantities in/out',
  sow: 'Planting records with a readiness calendar',
  crm: 'Customer directory, price history, follow-ups and statements',
  cat: 'Every seedling variety and its standard price (custom prices allowed at sale)',
  prop: 'Customers who bring their own seeds for propagation: jobs, fees and collection',
  man: 'Goat manure sales analytics, by day or month',
  acc: 'Income, expenses and monthly sales per employee',
  emp: 'Staff records, salaries, loans & advances (Loise only)',
  att: 'Daily attendance: present, absent or on leave',
  purch: 'Suppliers and purchases — restocks add to inventory',
  rep: 'One-click printable reports including the daily Z-summary',
  set: 'Passwords, appearance themes, backups and data tools'
};
var DB = null,
  session = null,
  CUR = 'dash',
  TAB = {},
  LANG = localStorage.getItem('mk_lang') || 'en';
var CHARTS = [],
  IDLE_MIN = 20,
  idleTimer = null;
var GS = { crm: '', obq: '', bq: '' };

function loadDB() {
  try {
    DB = JSON.parse(localStorage.getItem(DB_KEY));
  } catch (e) {}
  if (!DB || !DB.meta) {
    DB = {
      meta: { company: COMPANY },
      orders: [],
      docs: [],
      bookings: [],
      inv: [],
      sowing: [],
      cust: [],
      exp: [],
      income: [],
      emp: [],
      att: [],
      loans: [],
      loanpay: [],
      payroll: [],
      sup: [],
      purch: [],
      follow: [],
      pricehist: [],
      audit: [],
      prop: [],
      cat: [],
      autofill: {},
      mpesa: 1001
    };
  }
  [
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
  ].forEach(function (k) {
    if (!DB[k]) DB[k] = [];
  });
  if (!DB.meta.loansV2) {
    var old = DB.loans || [];
    DB.loans = [];
    DB.loanpay = DB.loanpay || [];
    old.forEach(function (l) {
      if (l.principal !== undefined) {
        DB.loans.push(l);
        return;
      }
      if (l.dir === 'out')
        DB.loans.push({
          id: l.id || uid(),
          empId: l.empId,
          principal: num(l.amount),
          perMonth: 0,
          kind: 'Loan',
          date: l.date,
          note: l.note || '',
          status: 'Open'
        });
      else
        DB.loanpay.push({
          id: l.id || uid(),
          loanId: null,
          empId: l.empId,
          amount: num(l.amount),
          date: l.date,
          method: 'Cash',
          note: l.note || '',
          payrollId: null
        });
    });
    DB.loanpay
      .filter(function (r) {
        return !r.loanId;
      })
      .forEach(function (r) {
        var t = DB.loans
          .filter(function (l) {
            return l.empId === r.empId;
          })
          .sort(function (a, b) {
            return a.date < b.date ? -1 : 1;
          })[0];
        if (t) r.loanId = t.id;
      });
    DB.loanpay = DB.loanpay.filter(function (r) {
      return r.loanId;
    });
    DB.meta.loansV2 = true;
  }
  if (!DB.meta.catSeeded) {
    if (!DB.cat.length)
      DB.cat = CAT_SEED.map(function (r) {
        return { id: uid() + Math.random().toString(36).slice(2, 5), group: r[0], name: r[1], price: r[2] };
      });
    DB.meta.catSeeded = true;
  }
  if (!DB.meta.manureSeeded) {
    if (
      !DB.cat.some(function (c) {
        return /manure/i.test(c.name);
      })
    )
      DB.cat.push({
        id: uid() + 'mn',
        group: 'Manure (Fertilizer)',
        name: 'Goat Manure (per sack)',
        price: 500
      });
    DB.meta.manureSeeded = true;
  }
  if (!DB.meta.traysSeeded) {
    if (
      !DB.cat.some(function (c) {
        return /^trays/i.test(c.group);
      })
    ) {
      DB.cat.push({ id: uid() + 't1', group: 'Trays (Empty)', name: 'Seedling Tray — 128-cell', price: 60 });
      DB.cat.push({ id: uid() + 't2', group: 'Trays (Empty)', name: 'Seedling Tray — 200-cell', price: 50 });
    }
    DB.meta.traysSeeded = true;
  }
  if (!DB.autofill) DB.autofill = {};
  if (!DB.meta.targets) DB.meta.targets = {};
  // Passwords are checked by the server now; drop copies kept by older versions
  delete DB.meta.passwords;
  delete DB.meta.pwMigrated;
  // Every record needs an id so it can be synced
  [
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
  ].forEach(function (k) {
    DB[k].forEach(function (r) {
      if (r && typeof r === 'object' && r.id == null) r.id = uid();
    });
  });
  if (!DB.mpesa) DB.mpesa = 1001;
}
function logAudit(action) {
  if (!DB.audit) DB.audit = [];
  DB.audit.push({
    id: uid(),
    date: new Date().toISOString(),
    user: session ? session.u : '—',
    role: session ? session.role : '',
    action: action
  });
  if (DB.audit.length > 800) DB.audit = DB.audit.slice(-600);
}
function afTrack(field, val) {
  val = (val || '').trim();
  if (!val) return;
  if (!DB.autofill) DB.autofill = {};
  if (!DB.autofill[field]) DB.autofill[field] = {};
  DB.autofill[field][val] = (DB.autofill[field][val] || 0) + 1;
}
function afList(field) {
  var m = (DB.autofill || {})[field] || {};
  return Object.keys(m).sort(function (a, b) {
    return m[b] - m[a];
  });
}
function afDatalist(field, id) {
  return (
    '<datalist id="' +
    id +
    '">' +
    afList(field)
      .map(function (v) {
        return '<option value="' + esc(v) + '">';
      })
      .join('') +
    '</datalist>'
  );
}
function saveDB() {
  localStorage.setItem(DB_KEY, JSON.stringify(DB));
  localStorage.setItem(DB_KEY + '_bak', JSON.stringify(DB));
  cloudBackup();
  try {
    updateBell();
  } catch (e) {}
  if (typeof SYNC !== 'undefined' && SYNC.started) syncSoon();
}
function cloudBackup() {
  try {
    var data = JSON.stringify(DB);
    localStorage.setItem(DB_KEY + '_cloud_' + today(), data);
    var keys = Object.keys(localStorage)
      .filter(function (k) {
        return k.indexOf(DB_KEY + '_cloud_') === 0;
      })
      .sort();
    while (keys.length > 10) {
      localStorage.removeItem(keys.shift());
    }
  } catch (e) {}
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}
function fmt(n) {
  return (
    'KES ' + Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}
function num(n) {
  return Number(n) || 0;
}
function today() {
  return new Date().toISOString().slice(0, 10);
}
function monthOf(d) {
  return String(d || '').slice(0, 7);
}
// Next document number, e.g. RCP-0012 (see numTake in 29-cloud-sync.js)
function nextNo(prefix) {
  return numTake(prefix);
}
function role() {
  return session ? session.role : null;
}
function isLoise() {
  return role() === 'loise';
}
function empName(id) {
  if (id === 'loise') return 'Loise (Owner)';
  var e = DB.emp.find(function (x) {
    return x.id === id;
  });
  return e ? e.name : '—';
}
function custName(id) {
  var c = DB.cust.find(function (x) {
    return x.id === id;
  });
  return c ? c.name : '—';
}
function openModal(html) {
  document.getElementById('modalBox').innerHTML = html;
  document.getElementById('modalWrap').style.display = 'flex';
}
function closeModal() {
  document.getElementById('modalWrap').style.display = 'none';
}
function coHeader() {
  return (
    '<div style="background:#14532d;color:#fff;text-align:center;padding:12px 14px;border-radius:8px;margin-bottom:12px"><span style="background:#fff;border-radius:50%;padding:5px;display:inline-flex;vertical-align:middle;margin-right:8px;box-shadow:0 1px 4px rgba(0,0,0,.35)"><img src="' +
    LOGO_ICON +
    '" style="width:40px;height:40px;display:block"></span><h1 style="font-size:18px;color:#fff;display:inline-block;vertical-align:middle;letter-spacing:.3px">' +
    esc(COMPANY.name) +
    '</h1><div style="font-size:11px;color:#bbf7d0;font-style:italic;margin:2px 0 4px">"' +
    esc(COMPANY.motto || '') +
    '"</div><div style="font-size:12px;color:#dcfce7">' +
    (COMPANY.addr ? esc(COMPANY.addr) + ' &nbsp;·&nbsp; ' : '') +
    t('tel') +
    ': ' +
    esc(COMPANY.tel) +
    ' &nbsp;·&nbsp; ' +
    esc(COMPANY.email) +
    '</div></div>'
  );
}
function pwMark() {
  return '<div id="pwMark"><img src="' + LOGO_ICON + '" alt=""></div>';
}
function printHTML(html, cls) {
  var p = document.getElementById('printArea');
  p.className = cls || '';
  p.innerHTML =
    pwMark() +
    (cls === 'rc' ? '' : coHeader()) +
    html +
    '<p style="margin-top:10px;font-size:10px;color:#666">' +
    t('printed') +
    ': ' +
    new Date().toLocaleString() +
    ' · ' +
    t('by') +
    ': ' +
    (session ? session.u : '') +
    '</p>';
  window.print();
}
function exportRows(name, rows) {
  if (!rows || !rows.length) {
    alert(t('nothing'));
    return;
  }
  var ws = XLSX.utils.json_to_sheet(rows);
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 28));
  XLSX.writeFile(wb, name + '.xlsx');
}
function mkMpesaCode() {
  var code = 'MK' + String(DB.mpesa++).padStart(6, '0');
  saveDB();
  return code;
}
function mpesaMsg(amount, who, code) {
  code = code || mkMpesaCode();
  return (
    '<svg class="ic"><use href="#i-phone"/></svg> M-PESA CONFIRMED\n' +
    code +
    ' Confirmed. KES ' +
    Number(amount).toLocaleString() +
    ' sent to ' +
    COMPANY.name +
    ' (' +
    COMPANY.tel +
    ')' +
    (who ? ' for ' + who : '') +
    '.'
  );
}
function logPrice(custId, item, price) {
  DB.pricehist.push({ id: uid(), date: today(), custId: custId, item: item, price: price });
  if (DB.pricehist.length > 2000) DB.pricehist = DB.pricehist.slice(-1500);
}
function lastPrice(custId, itemName) {
  var h = DB.pricehist.filter(function (p) {
    return p.custId === custId && p.item.toLowerCase().indexOf(itemName.toLowerCase()) >= 0;
  });
  return h.length ? h[h.length - 1].price : null;
}
