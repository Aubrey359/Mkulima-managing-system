/* ================= SETTINGS ================= */
var THEMES = [
  ['green', '', 'Green', 'linear-gradient(135deg,#22c55e,#14532d)'],
  ['forest', '', 'Forest', 'linear-gradient(135deg,#4d7c0f,#1a2e05)'],
  ['mint', '', 'Mint', 'linear-gradient(135deg,#2dd4bf,#115e59)'],
  ['ocean', '', 'Ocean', 'linear-gradient(135deg,#06b6d4,#164e63)'],
  ['blue', '', 'Blue', 'linear-gradient(135deg,#3b82f6,#1e3a8a)'],
  ['indigo', '', 'Indigo', 'linear-gradient(135deg,#818cf8,#312e81)'],
  ['grape', '', 'Grape', 'linear-gradient(135deg,#a855f7,#4c1d95)'],
  ['rose', '', 'Rose', 'linear-gradient(135deg,#fb7185,#881337)'],
  ['sunset', '', 'Sunset', 'linear-gradient(135deg,#fb923c,#7c2d12)'],
  ['clay', '', 'Clay', 'linear-gradient(135deg,#f97316,#7c2d12)'],
  ['earth', '', 'Earth', 'linear-gradient(135deg,#a16207,#422006)'],
  ['sand', '', 'Sand', 'linear-gradient(135deg,#d6bd8c,#6b5426)'],
  ['slate', '', 'Slate', 'linear-gradient(135deg,#94a3b8,#1e293b)'],
  ['dark', '', 'Dark', 'linear-gradient(135deg,#334155,#0f172a)'],
  ['midnight', '', 'Midnight', 'linear-gradient(135deg,#475569,#020617)'],
  ['charcoal', '', 'Charcoal', 'linear-gradient(135deg,#a3a3a3,#171717)']
];
var FONTS = {
  default: ['System', "'Segoe UI',system-ui,-apple-system,Roboto,Arial,sans-serif"],
  inter: ['Neutral', "'Helvetica Neue',Helvetica,Arial,sans-serif"],
  humanist: ['Humanist', "Candara,Optima,'Gill Sans','Gill Sans MT',Calibri,sans-serif"],
  rounded: ['Rounded', "'Trebuchet MS','Segoe UI',Verdana,sans-serif"],
  condensed: ['Condensed', "'Arial Narrow','Helvetica Neue Condensed',Tahoma,sans-serif"],
  grotesk: ['Grotesk', 'Verdana,Tahoma,Geneva,sans-serif'],
  serif: ['Serif', "Georgia,'Times New Roman',Times,serif"],
  garamond: ['Old style', "Garamond,'Palatino Linotype',Palatino,'Book Antiqua',serif"],
  slab: ['Slab', "'Rockwell','Courier New',Georgia,serif"],
  mono: ['Monospace', "'Courier New',Consolas,'Liberation Mono',monospace"]
};
function setFont(f) {
  var x = FONTS[f] || FONTS.default;
  document.documentElement.style.setProperty('--font', x[1]);
  localStorage.setItem('mk_font', f);
  document.querySelectorAll('.fontSwatch').forEach(function (s) {
    s.classList.toggle('on', s.getAttribute('data-f') === f);
  });
}
function applyFont(f) {
  setFont(f);
}
function fontPicker() {
  var cur = localStorage.getItem('mk_font') || 'default';
  return Object.keys(FONTS)
    .map(function (k) {
      return (
        '<div class="swatch fontSwatch' +
        (k === cur ? ' on' : '') +
        '" data-f="' +
        k +
        '" onclick="setFont(\'' +
        k +
        '\')" style="font-family:' +
        FONTS[k][1] +
        '">Aa ' +
        FONTS[k][0] +
        '</div>'
      );
    })
    .join('');
}
function setNavPos(p) {
  document.body.setAttribute('data-navpos', p === 'left' ? '' : p);
  localStorage.setItem('mk_navpos', p);
}
function applyNavPos(p) {
  setNavPos(p);
  var sel = document.getElementById('navpos_sel');
  if (sel) sel.value = p;
}
function toggleSidebarHide() {
  if (window.innerWidth <= 900) {
    document.body.classList.toggle('mobileNavOpen');
    return;
  }
  var hidden = document.body.classList.toggle('navHidden');
  localStorage.setItem('mk_navhidden', hidden ? '1' : '0');
}
function applySidebarHidden() {
  if (window.innerWidth > 900 && localStorage.getItem('mk_navhidden') === '1')
    document.body.classList.add('navHidden');
}
function setTheme(th) {
  document.body.setAttribute('data-theme', th === 'green' ? '' : th);
  localStorage.setItem('mk_theme', th);
  document.querySelectorAll('.swatch').forEach(function (s) {
    s.classList.toggle('on', s.getAttribute('data-th') === th);
  });
}
function themePicker() {
  return THEMES.map(function (x) {
    return (
      '<div class="swatch" data-th="' +
      x[0] +
      '" onclick="setTheme(\'' +
      x[0] +
      '\')"><div class="swDot" style="background:' +
      x[3] +
      '"></div>' +
      x[1] +
      ' ' +
      x[2] +
      '</div>'
    );
  }).join('');
}
function rSet() {
  var cur = localStorage.getItem('mk_theme') || 'green';
  var h =
    hint('set') +
    '<div class="grid c2">' +
    (isLoise()
      ? '<div class="card"><h3><svg class="ic"><use href="#i-key"/></svg> ' +
        t('password') +
        '</h3><div class="frow"><div><label>Role</label><select id="cp_r"><option value="loise">Loise</option><option value="sales">Sales</option></select></div><div><label>' +
        t('password') +
        '</label><input id="cp_p" type="password" autocomplete="new-password"></div><div><label>Repeat password</label><input id="cp_p2" type="password" autocomplete="new-password"></div></div>' +
        '<button class="btn" onclick="changePwFromSettings()"><svg class="ic"><use href="#i-save"/></svg></button></div>'
      : '') +
    '<div class="card"><h3><svg class="ic"><use href="#i-palette"/></svg> ' +
    t('theme') +
    ' / Appearance</h3><div>' +
    themePicker() +
    '</div><p style="font-size:12px;color:var(--muted)">' +
    (LANG === 'sw'
      ? 'Chagua mandhari ya mfumo.'
      : 'Pick the look of the system — applies everywhere instantly.') +
    '</p>' +
    '<h4 style="margin-top:12px;font-size:13px"><svg class="ic"><use href="#i-type"/></svg> Font</h4><div>' +
    fontPicker() +
    '</div>' +
    '<h4 style="margin-top:12px;font-size:13px"><svg class="ic"><use href="#i-compass"/></svg> Menu Position</h4><select id="navpos_sel" onchange="setNavPos(this.value)"><option value="left">Left (default)</option><option value="top">Top</option><option value="right">Right</option></select> ' +
    '<button class="btn gray sm" onclick="toggleSidebarHide()"><svg class="ic"><use href="#i-eye-off"/></svg> Hide/Show Menu</button></div>' +
    '<div class="card"><h3><svg class="ic"><use href="#i-save"/></svg> Backup / Restore</h3><p style="font-size:13px;color:var(--muted);margin-bottom:10px">Auto-saves every change + rolling cloud copy (10 daily snapshots kept on this device). Download monthly too.</p>' +
    '<div class="rowflex"><button class="btn blue" onclick="backup()"><svg class="ic"><use href="#i-download"/></svg> Backup (Excel + JSON)</button>' +
    '<label class="btn gray" style="cursor:pointer"><svg class="ic"><use href="#i-upload"/></svg> Restore<input type="file" accept=".json,.xlsx,.xls,.csv" style="display:none" onchange="restore(this)"></label></div>' +
    '<div class="mt"><label>Idle ' +
    (LANG === 'sw' ? 'muda' : 'timeout') +
    ' (min)</label><input type="number" id="idle_min" value="' +
    IDLE_MIN +
    '" style="width:100px"><button class="btn sm" onclick="IDLE_MIN=num(idle_min.value)||20;resetIdle();alert(\'Saved\')"><svg class="ic"><use href="#i-save"/></svg></button></div></div>' +
    '<div class="card"><h3>Tools</h3><div class="rowflex"><button class="btn gray" onclick="loadDemo()">Demo Data</button>' +
    '<button class="btn" onclick="startTut()"><svg class="ic"><use href="#i-play"/></svg> Tutorial</button>' +
    '<button class="btn gray" onclick="showDupModal()"><svg class="ic"><use href="#i-copy"/></svg> Duplicate Detector</button>' +
    '<button class="btn red" onclick="if(confirm(\'ERASE ALL DATA?\')){localStorage.removeItem(DB_KEY);localStorage.removeItem(DB_KEY+\'_bak\');location.reload()}"><svg class="ic"><use href="#i-trash"/></svg> Reset</button></div></div>' +
    '<div class="card"><h3>' +
    t('import') +
    '</h3><div class="rowflex"><select id="imp_target"><option value="cust">' +
    t('customer') +
    '</option><option value="inv">' +
    t('inv') +
    '</option><option value="emp">' +
    t('employee') +
    '</option></select>' +
    '<label class="btn blue" style="cursor:pointer">File…<input type="file" accept=".xlsx,.xls,.csv,.docx" style="display:none" onchange="importGeneric(this)"></label></div></div>' +
    '<div class="card"><h3><svg class="ic"><use href="#i-target"/></svg> Sales Target</h3><div class="rowflex"><label>Monthly target (KES)</label><input type="number" id="tgt_amt" value="' +
    num((DB.meta.targets || {}).monthly) +
    '" style="width:160px">' +
    '<button class="btn sm" onclick="DB.meta.targets=DB.meta.targets||{};DB.meta.targets.monthly=num(tgt_amt.value);saveDB();alert(\'Target set\')"><svg class="ic"><use href="#i-save"/></svg> Save Target</button></div>' +
    '<p style="font-size:12px;color:var(--muted);margin-top:6px">Shows a progress bar on the Dashboard for the current month.</p></div>' +
    (isLoise()
      ? '<div class="card"><h3><svg class="ic"><use href="#i-bell"/></svg> Reminders</h3><div class="rowflex"><label>Remind me this many days ahead</label><input type="number" min="0" max="30" id="rem_days" value="' +
        remDays() +
        '" style="width:90px"><button class="btn sm" onclick="DB.meta.remDays=Math.max(0,Math.min(30,num(rem_days.value)));saveDB();updateBell();msgBox(\'Saved\',\'Reminders now show pick-ups, deliveries and nearly-ready seedlings up to \'+remDays()+\' days ahead.\')"><svg class="ic"><use href="#i-save"/></svg> Save</button></div><p style="font-size:12px;color:var(--muted);margin-top:6px">Covers pick-ups, deliveries to dispatch, seedlings and propagation jobs close to ready.</p></div>'
      : '') +
    '<div class="card"><h3><svg class="ic"><use href="#i-bell"/></svg> Sound</h3>' +
    '<label class="swRow"><input type="checkbox" id="snd_on"' +
    (SND.on ? ' checked' : '') +
    ' onchange="sndSet(\'on\',this.checked)"> Play a click when I tap something</label>' +
    '<label class="swRow"><input type="checkbox" id="snd_hov"' +
    (SND.hover ? ' checked' : '') +
    ' onchange="sndSet(\'hover\',this.checked)"> Also play a soft tick on hover (desktop)</label>' +
    '<div class="rowflex mt"><label style="margin:0">Volume</label><input type="range" min="0" max="100" value="' +
    SND.vol +
    '" style="flex:1;max-width:200px" oninput="sndSet(\'vol\',Number(this.value))" onchange="sndClick()"></div>' +
    '<p style="font-size:12px;color:var(--muted);margin-top:6px">Sounds are generated by the app, so there are no files to download and they work offline.</p></div>' +
    '<div class="card"><h3><svg class="ic"><use href="#i-install"/></svg> Install App</h3><p style="font-size:13px;color:var(--muted);margin-bottom:8px">Install this system on your phone or computer like a normal app, with an icon on your home screen.</p>' +
    '<button class="btn" id="pwaInstallBtn" onclick="pwaInstall()"><svg class="ic"><use href="#i-download"/></svg> Install App</button><p style="font-size:11px;color:var(--muted);margin-top:6px" id="pwaNote">If the button does not do anything, use your browser menu → "Add to Home Screen" / "Install App" instead — full installability depends on how this file is hosted.</p></div>' +
    (isLoise()
      ? '<div class="card" style="grid-column:1/-1"><h3><svg class="ic"><use href="#i-shield"/></svg> Audit Trail</h3><div class="toolbar"><input id="au_q" placeholder="Search user / action" oninput="rAuditList()"><button class="btn sm" onclick="printAudit()"><svg class="ic"><use href="#i-printer"/></svg> ' +
        t('print') +
        '</button></div><div id="au_tbl" style="max-height:320px;overflow:auto"></div></div>'
      : '') +
    '</div>';
  document.getElementById('content').innerHTML = h;
  setTheme(cur);
  var ns = document.getElementById('navpos_sel');
  if (ns) ns.value = document.body.getAttribute('data-navpos') || 'left';
  if (isLoise()) {
    rAuditList();
  }
}
var deferredPWAPrompt = null;
window.addEventListener('beforeinstallprompt', function (e) {
  e.preventDefault();
  deferredPWAPrompt = e;
  var b = document.getElementById('pwaInstallBtn');
  if (b) b.disabled = false;
});
function pwaInstall() {
  if (deferredPWAPrompt) {
    deferredPWAPrompt.prompt();
    deferredPWAPrompt.userChoice.then(function () {
      deferredPWAPrompt = null;
    });
  } else {
    alert(
      'Your browser hasn\'t offered an install prompt yet. Use the browser menu instead: Chrome/Edge → "Install app" or "Add to Home screen"; Safari (iPhone) → Share icon → "Add to Home Screen".'
    );
  }
}
function rAuditList() {
  var q = (document.getElementById('au_q') ? document.getElementById('au_q').value : '').toLowerCase();
  var rows = DB.audit
    .slice()
    .reverse()
    .filter(function (a) {
      return (
        !q || (a.user || '').toLowerCase().indexOf(q) >= 0 || (a.action || '').toLowerCase().indexOf(q) >= 0
      );
    })
    .slice(0, 300)
    .map(function (a) {
      return [new Date(a.date).toLocaleString(), esc(a.user), esc(a.role || ''), esc(a.action)];
    });
  var el = document.getElementById('au_tbl');
  if (el) el.innerHTML = tbl(['When', 'User', 'Role', 'Action'], rows);
}
function printAudit() {
  var rows = DB.audit
    .slice()
    .reverse()
    .map(function (a) {
      return [new Date(a.date).toLocaleString(), esc(a.user), esc(a.role || ''), esc(a.action)];
    });
  printHTML('<h2>Audit Trail — ' + today() + '</h2>' + tbl(['When', 'User', 'Role', 'Action'], rows));
}
function backup() {
  localStorage.setItem('mk_lastbackup', String(Date.now()));
  logAudit('Backup downloaded');
  var wb = XLSX.utils.book_new();
  var sheets = {
    Customers: DB.cust,
    Inventory: DB.inv,
    Orders: DB.orders,
    Bookings: DB.bookings,
    Documents: DB.docs,
    Sowing: DB.sowing,
    Income: DB.income,
    Expenses: DB.exp,
    Employees: DB.emp,
    Attendance: DB.att,
    Loans: DB.loans,
    LoanRepayments: DB.loanpay,
    Payroll: DB.payroll,
    Suppliers: DB.sup,
    FollowUps: DB.follow,
    PriceHistory: DB.pricehist,
    AuditTrail: DB.audit
  };
  for (var k in sheets) {
    if (sheets[k].length)
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheets[k]), k.slice(0, 28));
  }
  XLSX.writeFile(wb, 'Mkulima_Backup_' + today() + '.xlsx');
  var a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(DB)], { type: 'application/json' }));
  a.download = 'Mkulima_Full_' + today() + '.json';
  a.click();
  if (CUR === 'dash') rDash();
}
function restore(inp) {
  var f = inp.files[0];
  if (!f) return;
  var r = new FileReader();
  r.onload = function (e) {
    var name = f.name.toLowerCase();
    if (name.endsWith('.json')) {
      try {
        var d = JSON.parse(e.target.result);
        if (!d.meta) throw 0;
        if (!confirm('Restoring replaces the shared data on EVERY device with this backup. Continue?')) {
          inp.value = '';
          return;
        }
        DB = d;
        saveDB();
        alert('Restored');
        location.reload();
      } catch (err) {
        alert(
          'This file is not a Mkulima backup. Choose the Mkulima_Full_<date>.json file that Backup downloaded.'
        );
      }
      return;
    }
    try {
      var wb = name.endsWith('.csv')
        ? XLSX.read(e.target.result, { type: 'string' })
        : XLSX.read(e.target.result, { type: 'array' });
      var n = 0;
      wb.SheetNames.forEach(function (sn) {
        var rows = XLSX.utils.sheet_to_json(wb.Sheets[sn]);
        if (/customer|contact/i.test(sn)) {
          rows.forEach(function (x) {
            if (x.Name) {
              DB.cust.push({
                id: uid(),
                name: String(x.Name),
                phone: String(x.Phone || ''),
                email: String(x.Email || ''),
                loc: String(x.Location || ''),
                prop: String(x.Propagation || ''),
                crop: String(x.Crop || ''),
                qty: x.Qty || '',
                price: num(x.Price),
                lastBought: String(x.LastBought || ''),
                lastDate: String(x.LastDate || ''),
                lastMethod: String(x.Method || ''),
                notes: ''
              });
              n++;
            }
          });
        } else if (/invent|stock/i.test(sn)) {
          rows.forEach(function (x) {
            if (x.Name) {
              DB.inv.push({
                id: uid(),
                name: String(x.Name),
                cat: String(x.Category || 'Other'),
                qty: num(x.Qty),
                unit: String(x.Unit || 'pcs'),
                price: num(x.Price)
              });
              n++;
            }
          });
        } else if (/emplo|worker/i.test(sn)) {
          rows.forEach(function (x) {
            if (x.Name) {
              DB.emp.push({
                id: uid(),
                name: String(x.Name),
                phone: String(x.Phone || ''),
                rank: String(x.Rank || 'Worker'),
                joined: today(),
                salary: num(x.Salary),
                status: 'Active'
              });
              n++;
            }
          });
        }
      });
      saveDB();
      alert('Imported ' + n);
      location.reload();
    } catch (err) {
      alert(
        'Could not read this file. For a full restore choose the Mkulima_Full_<date>.json backup; Excel/CSV files can only add customers, stock and similar lists.'
      );
    }
  };
  if (f.name.endsWith('.json') || f.name.endsWith('.csv')) r.readAsText(f);
  else r.readAsArrayBuffer(f);
}
function importGeneric(inp) {
  var target = document.getElementById('imp_target').value;
  var f = inp.files[0];
  if (!f) return;
  var name = f.name.toLowerCase();
  var reader = new FileReader();
  reader.onload = function (e) {
    if (target === 'cust' && name.endsWith('.docx')) {
      mammoth.extractRawText({ arrayBuffer: e.target.result }).then(function (r) {
        var n = 0;
        r.value.split('\n').forEach(function (l) {
          var p = l.split(/[,\t]/);
          if (p.length < 2 || !p[0].trim()) return;
          DB.cust.push({
            id: uid(),
            name: p[0].trim(),
            phone: (p[1] || '').trim(),
            email: '',
            loc: (p[2] || '').trim(),
            prop: '',
            crop: '',
            qty: '',
            price: 0,
            lastBought: '',
            lastDate: '',
            lastMethod: '',
            notes: ''
          });
          n++;
        });
        saveDB();
        alert('Imported ' + n);
        rSet();
      });
      return;
    }
    var wb = name.endsWith('.csv')
      ? XLSX.read(e.target.result, { type: 'string' })
      : XLSX.read(e.target.result, { type: 'array' });
    var rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    var n = 0;
    rows.forEach(function (x) {
      var g = function (k) {
        var key = Object.keys(x).find(function (y) {
          return y.toLowerCase().indexOf(k) >= 0;
        });
        return key ? String(x[key]) : '';
      };
      if (target === 'cust' && g('name')) {
        DB.cust.push({
          id: uid(),
          name: g('name'),
          phone: g('phone'),
          email: g('email'),
          loc: g('loc'),
          prop: g('prop'),
          crop: g('crop'),
          qty: g('qty'),
          price: num(g('price')),
          lastBought: '',
          lastDate: '',
          lastMethod: '',
          notes: ''
        });
        n++;
      }
      if (target === 'inv' && g('name')) {
        DB.inv.push({
          id: uid(),
          name: g('name'),
          cat: g('categor') || 'Other',
          qty: num(g('qty')),
          unit: g('unit') || 'pcs',
          price: num(g('price'))
        });
        n++;
      }
      if (target === 'emp' && g('name')) {
        DB.emp.push({
          id: uid(),
          name: g('name'),
          phone: g('phone'),
          rank: g('rank') || 'Worker',
          joined: today(),
          salary: num(g('salar')),
          status: 'Active'
        });
        n++;
      }
    });
    saveDB();
    alert('Imported ' + n);
    rSet();
  };
  if (name.endsWith('.csv')) reader.readAsText(f);
  else reader.readAsArrayBuffer(f);
  inp.value = '';
}
function loadDemo() {
  openModal(
    '<h3><svg class="ic"><use href="#i-play"/></svg> Load demo data?</h3><p style="margin:10px 0;font-size:13px;line-height:1.5">This ADDS a full set of sample records — staff (Sales, Marketing, Sowing, Others), regular customers, propagation clients, ~45 sales over the last 3 months (mixed payment methods, custom prices, credit), sowing records with seed companies and expiry dates, bookings, propagation jobs, attendance, expenses, suppliers and a monthly sales target — so you can explore every tab. Your own records stay untouched. Use Reset in Settings to wipe everything later.</p><div class="rowflex mt"><button class="btn" onclick="closeModal();doLoadDemo()"><svg class="ic"><use href="#i-check"/></svg> Add demo data</button><button class="btn gray" onclick="closeModal()">Cancel</button></div>'
  );
}
function doLoadDemo() {
  var seed = 11,
    cnt = 0;
  function rnd() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }
  function pick(a) {
    return a[Math.floor(rnd() * a.length)];
  }
  function id() {
    return uid() + (cnt++).toString(36);
  }
  function dAgo(n) {
    var d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }
  function dAhead(n) {
    return dAgo(-n);
  }
  function addDays(s, n) {
    var d = new Date(s + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }
  /* stock */
  var invRows = [
    ['Tomato Seedlings — Zara F1', 'Seedlings', 1200, 'pcs', 4],
    ['Cabbage Seedlings — Gloria F1', 'Seedlings', 900, 'pcs', 2.5],
    ['Sukuma Wiki — Ahadi F1', 'Seedlings', 1500, 'pcs', 2],
    ['Capsicum — Calypso', 'Seedlings', 420, 'pcs', 4],
    ['Hass Avocado Seedlings', 'Seedlings', 60, 'pcs', 150],
    ['Pawpaw — Sharp F1', 'Seedlings', 85, 'pcs', 100],
    ['Zara F1 Seeds', 'Seeds', 6, 'kg', 4500],
    ['Gloria F1 Seeds', 'Seeds', 3, 'kg', 3800],
    ['Seedling Trays (200-cell)', 'Trays', 300, 'trays', 80],
    ['Cocopeat 5kg Bag', 'Cocopeat', 40, 'bags', 350],
    ['Foliar Feed', 'Other', 18, 'litres', 900],
    ['Fungicide (Ridomil)', 'Other', 9, 'packs', 650]
  ];
  var INV = invRows.map(function (r) {
    var o = { id: id(), name: r[0], cat: r[1], qty: r[2], unit: r[3], price: r[4] };
    DB.inv.push(o);
    return o;
  });
  /* staff */
  var empRows = [
    ['John Kiprop', '0722 111 222', 'Sales', '2025-03-01', 28000],
    ['Faith Njeri', '0711 333 444', 'Sales', '2025-08-10', 24000],
    ['Brian Otieno', '0700 555 666', 'Marketing', '2025-05-20', 26000],
    ['Mary Atieno', '0733 222 333', 'Sowing', '2025-06-15', 18000],
    ['Samuel Kamau', '0745 777 888', 'Sowing', '2025-09-01', 17000],
    ['Ann Wambui', '0790 999 000', 'Others', '2025-11-12', 15000]
  ];
  var E = empRows.map(function (r) {
    var e = { id: id(), name: r[0], phone: r[1], rank: r[2], joined: r[3], salary: r[4], status: 'Active' };
    DB.emp.push(e);
    return e;
  });
  var sellers = [E[0], E[1], E[2]];
  /* customers */
  var regRows = [
    ['Grace Wanjiku', '0712 345 678', 'Thika'],
    ['Peter Mwangi', '0733 999 111', 'Ruiru'],
    ['Lucy Achieng', '0722 404 505', 'Kisumu'],
    ['Joseph Kariuki', '0715 606 707', 'Juja'],
    ['Esther Muthoni', '0728 808 909', 'Kiambu'],
    ['David Ochieng', '0741 101 202', 'Nakuru'],
    ['Sarah Chebet', '0757 303 404', 'Eldoret'],
    ['Moses Kimani', '0768 505 606', 'Limuru'],
    ['Agnes Wairimu', '0719 707 808', 'Naivasha'],
    ['Hassan Mohamed', '0721 909 010', 'Machakos'],
    ['Rose Nyambura', '0734 121 212', 'Kitengela'],
    ['Kevin Omondi', '0746 232 323', 'Embu'],
    ['Peter Mwangi K.', '0733 999 111', 'Ruiru']
  ];
  var proRows = [
    ['Wanjiku Agro Farm', '0710 800 900', 'Thika'],
    ['Mwangi Family Farm', '0720 810 910', 'Ruiru'],
    ['Green Valley Growers', '0730 820 920', 'Nyeri'],
    ['Kamau Horticulture', '0740 830 930', 'Naivasha']
  ];
  function mkCust(r, type) {
    var c = {
      id: id(),
      name: r[0],
      phone: r[1],
      email: '',
      loc: r[2],
      prop: '',
      crop: '',
      qty: '',
      price: '',
      notes: '',
      lastBought: '',
      lastDate: '',
      lastMethod: '',
      custType: type
    };
    DB.cust.push(c);
    afTrack('loc', r[2]);
    return c;
  }
  var REG = regRows.map(function (r) {
      return mkCust(r, 'Buys ready seedlings');
    }),
    PRO = proRows.map(function (r) {
      return mkCust(r, 'Propagates own seeds');
    });
  /* sales — 45 orders over ~100 days, catalogue items with occasional custom prices */
  var cat = DB.cat.length ? DB.cat : [];
  var n = 45;
  if (cat.length)
    for (var i = n; i >= 1; i--) {
      var date = dAgo(Math.floor((i * 100) / n)),
        cu = pick(REG.slice(0, 12)),
        seller = pick(sellers),
        items = [],
        k = 1 + Math.floor(rnd() * 3);
      for (var j = 0; j < k; j++) {
        var c = pick(cat),
          delta = c.price >= 100 ? 10 : 0.5,
          price = rnd() < 0.3 ? Math.max(1, c.price + (rnd() < 0.5 ? -delta : delta)) : c.price;
        var qty = c.price < 20 ? (2 + Math.floor(rnd() * 38)) * 50 : 2 + Math.floor(rnd() * 14);
        items.push({ itemId: null, catId: c.id, name: catLabel(c), price: price, qty: qty });
        DB.pricehist.push({ id: id(), date: date, custId: cu.id, item: catLabel(c), price: price });
      }
      var sub = items.reduce(function (a, x) {
          return a + x.price * x.qty;
        }, 0),
        disc = rnd() < 0.2 ? Math.round(sub * 0.05) : 0,
        total = sub - disc,
        r = rnd(),
        pay,
        paid,
        code = null;
      if (r < 0.35) {
        pay = t('cash');
        paid = total;
      } else if (r < 0.7) {
        pay = 'M-Pesa';
        paid = total;
        code = mkMpesaCode();
      } else if (r < 0.8) {
        pay = t('bank');
        paid = total;
      } else {
        pay = t('credit');
        paid = rnd() < 0.5 ? 0 : Math.round(total * (0.4 + rnd() * 0.3));
      }
      var o = {
        id: id(),
        no: nextNo('RCP'),
        date: date,
        custId: cu.id,
        empId: seller.id,
        comm: pick([t('call'), t('whatsapp'), t('visit')]),
        items: items,
        sub: sub,
        disc: disc,
        vat: 0,
        total: total,
        paid: paid,
        balance: total - paid,
        pay: pay,
        mpesa: code,
        notes: ''
      };
      DB.orders.push(o);
      if (paid > 0)
        DB.income.push({
          id: id(),
          date: date,
          src: t('sales') + ' — ' + cu.name,
          amount: paid,
          method: pay === t('credit') ? t('cash') : pay,
          mpesa: code
        });
      cu.lastBought = items
        .map(function (x) {
          return x.name + ' x' + x.qty;
        })
        .join(', ');
      cu.lastDate = date;
      cu.lastMethod = pay;
    }
  var dl = DB.orders[DB.orders.length - 1];
  if (dl)
    dl.deliver = {
      date: dAhead(1),
      addr:
        (
          DB.cust.find(function (x) {
            return x.id === dl.custId;
          }) || {}
        ).loc || '',
      done: false
    };
  var man = DB.cat.find(function (x) {
    return /manure/i.test(x.name);
  });
  if (man)
    for (var mi = 0; mi < 16; mi++) {
      var md = dAgo(Math.floor((mi * 70) / 16) + (mi % 3)),
        mcu = pick(REG),
        msel = pick(sellers),
        mq = 2 + Math.floor(rnd() * 18),
        mtot = mq * man.price,
        mr = rnd(),
        mpay = mr < 0.5 ? t('cash') : mr < 0.9 ? 'M-Pesa' : t('credit'),
        mpaid = mpay === t('credit') ? 0 : mtot,
        mcode = mpay === 'M-Pesa' ? mkMpesaCode() : null;
      DB.orders.push({
        id: id(),
        no: nextNo('RCP'),
        date: md,
        custId: mcu.id,
        empId: msel.id,
        comm: t('visit'),
        items: [{ itemId: null, catId: man.id, name: catLabel(man), price: man.price, qty: mq }],
        sub: mtot,
        disc: 0,
        vat: 0,
        total: mtot,
        paid: mpaid,
        balance: mtot - mpaid,
        pay: mpay,
        mpesa: mcode,
        notes: ''
      });
      if (mpaid > 0)
        DB.income.push({
          id: id(),
          date: md,
          src: t('sales') + ' — ' + mcu.name + ' (manure)',
          amount: mpaid,
          method: mpay,
          mpesa: mcode
        });
    }
  /* sowing with seed company + expiry */
  var comps = [
    'Simlaw Seeds',
    'Kenya Seed Company',
    'East African Seed',
    'Syngenta',
    'Royal Sluis',
    'Seed Co'
  ];
  var sv = [
    ['Tomato — Zara F1', 30, 1],
    ['Tomato — Nova F1', 20, 3],
    ['Cabbage — Gloria F1', 25, 5],
    ['Sukuma Wiki — Ahadi F1', 35, 8],
    ['Capsicum — Calypso', 12, 10],
    ['Pawpaw — Sharp F1', 6, 13],
    ['Cabbage — Victoria F1', 18, 16],
    ['Spinach — Fordhook', 15, 19],
    ['Broccoli — Titanic', 10, 22],
    ['Cucumber — Ashley', 8, 26],
    ['Watermelon — Sukari', 8, 30],
    ['Courgette — Zucchini', 6, 35]
  ];
  sv.forEach(function (r, ix) {
    var d = dAgo(r[2]),
      comp = comps[ix % comps.length];
    var exp = ix === 3 ? dAhead(9) : ix === 7 ? dAgo(20) : dAhead(200 + ix * 25);
    DB.sowing.push({
      id: id(),
      date: d,
      variety: r[0],
      qty: r[1],
      unit: 'trays',
      ready: addDays(d, ix === 5 ? 60 : 28),
      notes: '',
      status: 'Growing',
      seedCompany: comp,
      expiry: exp
    });
    afTrack('seedcompany', comp);
  });
  /* bookings */
  [
    ['Grace Wanjiku', 'Tomato — Zara F1', 2000, 4, 0],
    ['Joseph Kariuki', 'Cabbage — Gloria F1', 1500, 2.5, 2],
    ['Esther Muthoni', 'Capsicum — Nyuki Red', 300, 15, 9],
    ['Kevin Omondi', 'Hass Avocado', 40, 150, 14],
    ['David Ochieng', 'Sukuma Wiki — Ahadi F1', 2500, 2, 20]
  ].forEach(function (r, ix) {
    var cu = REG.find(function (x) {
        return x.name === r[0];
      }),
      dep = Math.round(r[2] * r[3] * 0.3);
    DB.bookings.push({
      id: id(),
      date: dAgo(ix + 1),
      custId: cu.id,
      cname: cu.name,
      variety: r[1],
      qty: r[2],
      price: r[3],
      deposit: dep,
      ready: dAhead(r[4]),
      comm: t('call'),
      empId: sellers[ix % 3].id,
      notes: '',
      status: 'Pending',
      type: ix % 2 ? 'Delivery' : 'Pick-up',
      addr: ix % 2 ? cu.loc : ''
    });
    DB.income.push({
      id: id(),
      date: dAgo(ix + 1),
      src: t('book') + ' deposit — ' + cu.name,
      amount: dep,
      method: t('cash')
    });
  });
  /* propagation jobs */
  var pj = [
    ['Wanjiku Agro Farm', 'Tomato — Anna F1', 'Simlaw Seeds', 5000, 1.5, 0, -30, 'Collected', 1],
    ['Wanjiku Agro Farm', 'Tomato — Rio Grande', "Client's own", 3000, 1, 0.5, -8, 'Sown', 0.5],
    ['Mwangi Family Farm', 'Cabbage — Copenhagen', 'Kenya Seed Company', 4000, 1, 0, -20, 'Ready', 1],
    ['Green Valley Growers', 'Onion — Red Creole', 'East African Seed', 10000, 0.5, 0, -14, 'Sown', 0.6],
    ['Kamau Horticulture', 'Capsicum — California Wonder', "Client's own", 1500, 2, 0, -6, 'Sown', 0],
    ['Mwangi Family Farm', 'Watermelon — Sugar Baby', 'Syngenta', 2000, 2, 0, -40, 'Collected', 1],
    ['Green Valley Growers', 'Kale — Thousand Headed', "Client's own", 6000, 1, 0, -3, 'Sown', 0.3],
    ['Kamau Horticulture', 'Tomato — Zara F1', 'Simlaw Seeds', 8000, 1.5, 0, -25, 'Ready', 0.5]
  ];
  pj.forEach(function (r) {
    var cu = PRO.find(function (x) {
        return x.name === r[0];
      }),
      total = r[3] * r[4],
      paid = Math.round(total * r[8]),
      d = dAhead(r[6]),
      j = {
        id: id(),
        no: nextNo('PRP'),
        custId: cu.id,
        variety: r[1],
        src: r[2],
        seedExpiry: dAhead(180),
        qty: r[3],
        rate: r[4],
        total: total,
        paid: paid,
        date: d,
        ready: addDays(d, r[7] === 'Sown' ? 28 : 21),
        status: r[7],
        notes: ''
      };
    DB.prop.push(j);
    afTrack('propvar', r[1]);
    if (paid > 0)
      DB.income.push({
        id: id(),
        date: d,
        src: 'Propagation ' + j.no + ' — ' + cu.name,
        amount: paid,
        method: pick([t('cash'), 'M-Pesa'])
      });
  });
  /* suppliers, purchases, expenses */
  var S = [
    ['Simlaw Seeds Ltd', '020 386 2000', 'Seeds', 'Nairobi'],
    ['Kenya Seed Company', '020 355 4000', 'Seeds', 'Kitale'],
    ['Crop Nutrition Labs', '020 444 1000', 'Fertilizer', 'Nairobi'],
    ['Agro-Supplies Nairobi', '0700 100 200', 'Trays, cocopeat', 'Nairobi']
  ].map(function (r) {
    var s = { id: id(), name: r[0], phone: r[1], items: r[2], loc: r[3] };
    DB.sup.push(s);
    return s;
  });
  [
    [7, S[3], 8, 300, 80],
    [7, S[3], 9, 10, 350],
    [6, S[0], 20, 1, 4500]
  ].forEach(function (r) {
    var it = INV[r[2] === 8 ? 8 : r[2] === 9 ? 9 : 6],
      q = r[3],
      cost = r[4],
      dt = dAgo(r[0] * 4);
    DB.purch.push({
      id: id(),
      date: dt,
      supId: r[1].id,
      itemId: it.id,
      qty: q,
      cost: cost,
      total: q * cost,
      paid: q * cost
    });
    DB.exp.push({
      id: id(),
      date: dt,
      cat: 'Supplies',
      desc: 'Purchase: ' + it.name + ' ×' + q,
      amount: q * cost
    });
  });
  for (var m = 0; m < 4; m++) {
    var base = m * 30;
    [
      ['Labour', 'Weekly casual labour', 9000],
      ['Transport', 'Delivery to customers', 3500],
      ['Fuel', 'Pickup fuel', 4200],
      ['Other', 'Water and electricity', 5600],
      ['Supplies', 'Polythene, labels, stakes', 6800]
    ].forEach(function (r, ix) {
      DB.exp.push({
        id: id(),
        date: dAgo(base + ix * 5 + 2),
        cat: r[0],
        desc: r[1],
        amount: r[2] + Math.floor(rnd() * 1500)
      });
    });
  }
  /* attendance — last 12 days */
  for (var dd = 0; dd < 12; dd++) {
    var day = dAgo(dd);
    if (new Date(day + 'T00:00:00').getDay() === 0) continue;
    E.forEach(function (e) {
      var r = rnd();
      if (r < 0.08) DB.att.push({ id: id(), empId: e.id, date: day, status: 'Absent', in: '—', out: '—' });
      else if (r < 0.14)
        DB.att.push({ id: id(), empId: e.id, date: day, status: 'Leave', in: '—', out: '—' });
      else
        DB.att.push({
          id: id(),
          empId: e.id,
          date: day,
          status: 'Present',
          in: pick(['06:50', '07:00', '07:05', '07:20']),
          out: pick(['16:45', '17:00', '17:30', '18:00'])
        });
    });
  }
  DB.meta.targets = DB.meta.targets || {};
  DB.meta.targets.monthly = 150000;
  logAudit('Demo data loaded');
  saveDB();
  openModal(
    '<h3><svg class="ic"><use href="#i-check"/></svg> Demo data added</h3><p style="margin:10px 0;font-size:13px">Explore the Dashboard, Sales (Order Book), Catalogue, Sowing Book (tap a day on the calendar), Propagation, Customers (try the Duplicate Detector — there is one on purpose), Attendance and Settings.</p><div class="rowflex mt"><button class="btn" onclick="closeModal();go(\'dash\')">Go to Dashboard</button></div>'
  );
}
