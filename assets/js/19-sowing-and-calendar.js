/* ================= SOWING + CALENDAR ================= */
function rSow() {
  var h =
    hint('sow') +
    (role() === 'sowing' ? remCardHTML() : '') +
    '<div class="card"><h3>' +
    t('add') +
    ' — ' +
    t('sow') +
    '</h3><div class="frow">' +
    '<div><label>' +
    t('date') +
    ' planted</label><input type="date" id="s_date" value="' +
    today() +
    '"></div>' +
    '<div><label>' +
    t('variety') +
    '</label><select id="s_var"><option value="">— stock —</option>' +
    DB.inv
      .filter(function (i) {
        return i.cat === 'Seeds' || i.cat === 'Seedlings';
      })
      .map(function (i) {
        return '<option value="' + i.id + '">' + esc(i.name) + '</option>';
      })
      .join('') +
    '</select></div>' +
    '<div><label>' +
    t('variety') +
    ' (custom)</label><input id="s_var2"></div>' +
    '<div><label>' +
    t('qty') +
    '</label><input type="number" id="s_qty" value="0"></div>' +
    '<div><label>Unit</label><select id="s_unit"><option>trays</option><option>seeds</option><option>grams</option></select></div>' +
    '<div><label>Expected Ready</label><input type="date" id="s_ready"></div></div>' +
    '<div class="frow"><div><label><svg class="ic"><use href="#i-building"/></svg> Seed Company</label><input id="s_company" list="s_company_dl" placeholder="e.g. Simlaw, Kenya Seed…">' +
    afDatalist('seedcompany', 's_company_dl') +
    '</div>' +
    '<div><label><svg class="ic"><use href="#i-hourglass"/></svg> Seed Expiry Date</label><input type="date" id="s_expiry"></div></div>' +
    '<label>' +
    t('notes') +
    '</label><input id="s_notes"><div class="mt"><button class="btn" onclick="saveSow()"><svg class="ic"><use href="#i-save"/></svg> ' +
    t('save') +
    '</button></div></div>' +
    '<div class="card"><h3><svg class="ic"><use href="#i-calendar"/></svg> ' +
    t('calendar') +
    ' — Seedling Readiness</h3><div class="toolbar"><button class="btn gray sm" onclick="shiftMonth(\'cal_m\',-1,renderCal)">‹ Prev</button><input type="month" id="cal_m" value="' +
    today().slice(0, 7) +
    '" onchange="renderCal()"><button class="btn gray sm" onclick="shiftMonth(\'cal_m\',1,renderCal)">Next ›</button><button class="btn amber sm" onclick="document.getElementById(\'cal_m\').value=today().slice(0,7);renderCal()">Today</button></div><div id="cal"></div></div>' +
    '<div class="card"><div class="toolbar"><button class="btn gray sm" onclick="shiftMonth(\'s_m\',-1,rSowList)">‹</button><input type="month" id="s_m" value="' +
    today().slice(0, 7) +
    '" onchange="rSowList()"><button class="btn gray sm" onclick="shiftMonth(\'s_m\',1,rSowList)">›</button>' +
    '<button class="btn blue sm" onclick="exportRows(\'Sowing\',DB.sowing.map(function(s){return{Date:s.date,Variety:s.variety,Qty:s.qty,Unit:s.unit,Ready:s.ready,Notes:s.notes,Status:s.status}}))">' +
    t('export') +
    '</button>' +
    '<button class="btn sm" onclick="printSow()"><svg class="ic"><use href="#i-printer"/></svg> ' +
    t('print') +
    '</button></div><div id="sow_tbl"></div></div>';
  document.getElementById('content').innerHTML = h;
  rSowList();
  renderCal();
}
function saveSow() {
  var vid = document.getElementById('s_var').value,
    v = DB.inv.find(function (x) {
      return x.id === vid;
    });
  var variety = v ? v.name : document.getElementById('s_var2').value;
  if (!variety) {
    alert(t('variety') + '?');
    return;
  }
  var company = document.getElementById('s_company').value.trim(),
    expiry = document.getElementById('s_expiry').value;
  afTrack('seedcompany', company);
  DB.sowing.push({
    id: uid(),
    date: document.getElementById('s_date').value,
    variety: variety,
    qty: num(document.getElementById('s_qty').value),
    unit: document.getElementById('s_unit').value,
    ready: document.getElementById('s_ready').value,
    notes: document.getElementById('s_notes').value,
    status: 'Growing',
    seedCompany: company,
    expiry: expiry
  });
  logAudit(
    'Sowed ' +
      variety +
      ' (' +
      num(document.getElementById('s_qty').value) +
      ' ' +
      document.getElementById('s_unit').value +
      ')'
  );
  document.getElementById('s_company').value = '';
  document.getElementById('s_expiry').value = '';
  saveDB();
  rSowList();
  renderCal();
}
function shiftMonth(inputId, delta, cb) {
  var el = document.getElementById(inputId);
  var v = el.value || today().slice(0, 7);
  var parts = v.split('-');
  var d = new Date(Number(parts[0]), Number(parts[1]) - 1 + delta, 1);
  el.value = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  if (cb) cb();
}
function calEvents(ds) {
  var ev = [];
  DB.sowing
    .filter(function (s) {
      return s.ready === ds;
    })
    .forEach(function (s) {
      ev.push({
        c: 'ready',
        ic: '<svg class="ic"><use href="#i-sprout"/></svg>',
        t: s.variety + ' ' + t('ready')
      });
    });
  DB.sowing
    .filter(function (s) {
      return s.date === ds;
    })
    .forEach(function (s) {
      ev.push({
        c: 'sown',
        ic: '<svg class="ic"><use href="#i-leaf"/></svg>',
        t:
          'Sown: ' +
          s.variety +
          ' ' +
          s.qty +
          ' ' +
          s.unit +
          (s.seedCompany ? ' (' + s.seedCompany + ')' : '')
      });
    });
  DB.sowing
    .filter(function (s) {
      return s.expiry === ds;
    })
    .forEach(function (s) {
      ev.push({
        c: 'pick',
        ic: '<svg class="ic"><use href="#i-hourglass"/></svg>',
        t: 'Seed expires: ' + s.variety
      });
    });
  DB.bookings
    .filter(function (b) {
      return b.ready === ds && b.status !== 'Picked';
    })
    .forEach(function (b) {
      ev.push({
        c: 'pick',
        ic: '<svg class="ic"><use href="#i-box"/></svg>',
        t: 'Pick-up: ' + b.cname + ' — ' + b.variety
      });
    });
  (DB.prop || [])
    .filter(function (j) {
      return j.date === ds;
    })
    .forEach(function (j) {
      ev.push({
        c: 'sown',
        ic: '<svg class="ic"><use href="#i-leaf"/></svg>',
        t: 'Propagation received: ' + custName(j.custId) + ' — ' + j.variety
      });
    });
  (DB.prop || [])
    .filter(function (j) {
      return j.ready === ds && j.status !== 'Collected';
    })
    .forEach(function (j) {
      ev.push({
        c: 'ready',
        ic: '<svg class="ic"><use href="#i-leaf"/></svg>',
        t: 'Propagation ready: ' + custName(j.custId) + ' — ' + j.variety
      });
    });
  return ev;
}
function renderCal() {
  var m = document.getElementById('cal_m').value;
  var dt = new Date(m + '-01T00:00:00');
  var y = dt.getFullYear(),
    mo = dt.getMonth();
  var first = new Date(y, mo, 1).getDay();
  var days = new Date(y, mo + 1, 0).getDate();
  var dows =
    LANG === 'sw'
      ? ['Jpi', 'Jtt', 'Jnn', 'Jtn', 'Alh', 'Iju', 'Jmo']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var total = 0;
  for (var q = 1; q <= days; q++) total += calEvents(m + '-' + String(q).padStart(2, '0')).length;
  var title = dt.toLocaleDateString(LANG === 'sw' ? 'sw-KE' : 'en-KE', { month: 'long', year: 'numeric' });
  var h =
    '<div class="calHead"><div class="calMonth">' +
    esc(title) +
    '</div><div class="calCount">' +
    (total
      ? total + (LANG === 'sw' ? ' matukio mwezi huu' : ' events this month')
      : LANG === 'sw'
        ? 'Hakuna matukio'
        : 'Nothing scheduled') +
    '</div></div>';
  h +=
    '<div class="cal">' +
    dows
      .map(function (x) {
        return '<div class="dow">' + x + '</div>';
      })
      .join('');
  for (var i = 0; i < first; i++) h += '<div class="day pad"></div>';
  for (var dd = 1; dd <= days; dd++) {
    var ds = m + '-' + String(dd).padStart(2, '0');
    var ev = calEvents(ds);
    var dow = new Date(y, mo, dd).getDay(),
      wk = dow === 0 || dow === 6;
    var shown = ev
      .slice(0, 2)
      .map(function (e) {
        return (
          '<div class="ev ' +
          e.c +
          '" title="' +
          esc(e.t) +
          '">' +
          (e.ic || '') +
          '<span>' +
          esc(e.t) +
          '</span></div>'
        );
      })
      .join('');
    if (ev.length > 2)
      shown += '<div class="more">+' + (ev.length - 2) + (LANG === 'sw' ? ' zaidi' : ' more') + '</div>';
    h +=
      '<div class="day' +
      (ds === today() ? ' today' : '') +
      (wk ? ' wknd' : '') +
      (ev.length ? ' has' : '') +
      '" onclick="dayInfo(\'' +
      ds +
      '\')"><span class="dnum">' +
      dd +
      '</span>' +
      shown +
      '</div>';
  }
  h +=
    '</div><div class="calKey"><span><i style="background:#dcfce7"></i>' +
    (LANG === 'sw' ? 'Kupandwa' : 'Sown') +
    '</span><span><i style="background:#dbeafe"></i>' +
    (LANG === 'sw' ? 'Tayari' : 'Ready') +
    '</span><span><i style="background:#fef3c7"></i>' +
    (LANG === 'sw' ? 'Kuchukuliwa' : 'Collection') +
    '</span></div>';
  document.getElementById('cal').innerHTML = h;
}
function dayInfo(ds) {
  var ev = calEvents(ds);
  var d = new Date(ds + 'T00:00:00');
  var h =
    '<h3><svg class="ic"><use href="#i-calendar"/></svg> ' +
    d.toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) +
    '</h3>';
  h += ev.length
    ? ev
        .map(function (e) {
          return (
            '<div class="ev ' +
            e.c +
            '" style="margin:5px 0;padding:7px 9px;font-size:13px;white-space:normal">' +
            (e.ic || '') +
            ' ' +
            esc(e.t) +
            '</div>'
          );
        })
        .join('')
    : '<div class="empty">Nothing scheduled on this day.</div>';
  if (role() !== 'sowing') {
    var os = DB.orders.filter(function (o) {
      return o.date === ds;
    });
    var tot = os.reduce(function (a, o) {
      return a + num(o.total);
    }, 0);
    h +=
      '<p class="mt" style="font-size:13px"><svg class="ic"><use href="#i-receipt"/></svg> Sales this day: <b>' +
      os.length +
      '</b> orders · <b>' +
      fmt(tot) +
      '</b></p>';
  }
  h +=
    '<div class="mt rowflex"><button class="btn sm" onclick="closeModal();var s=document.getElementById(\'s_date\');if(s){s.value=\'' +
    ds +
    '\';s.scrollIntoView({behavior:\'smooth\',block:\'center\'});s.focus()}"><svg class="ic"><use href="#i-sprout"/></svg> Record a sowing on this day</button><button class="btn gray" onclick="closeModal()">' +
    t('close') +
    '</button></div>';
  openModal(h);
}
function expiryBadge(exp) {
  if (!exp) return '—';
  var d = (new Date(exp) - new Date(today())) / 86400000;
  if (d < 0)
    return '<span class="badge r"><svg class="ic"><use href="#i-alert"/></svg> Expired ' + exp + '</span>';
  if (d <= 14)
    return '<span class="badge a"><svg class="ic"><use href="#i-hourglass"/></svg> ' + exp + ' (soon)</span>';
  return exp;
}
function rSowList() {
  var m = document.getElementById('s_m').value;
  var rows = DB.sowing
    .filter(function (s) {
      return monthOf(s.date) === m;
    })
    .map(function (s) {
      return [
        s.date,
        esc(s.variety),
        s.qty + ' ' + s.unit,
        s.ready || '—',
        esc(s.seedCompany || '—'),
        expiryBadge(s.expiry),
        s.status,
        (role() !== 'sowing'
          ? '<button class="btn sm" onclick="sowReady(\'' + s.id + '\')">Ready → Stock</button> '
          : '') +
          '<button class="btn red sm" onclick="DB.sowing=DB.sowing.filter(function(x){return x.id!==\'' +
          s.id +
          '\'});saveDB();rSowList();renderCal()">x</button>'
      ];
    });
  document.getElementById('sow_tbl').innerHTML = tbl(
    [t('date') + ' planted', t('variety'), t('qty'), 'Expected', 'Seed Co.', 'Expiry', t('status'), '/'],
    rows
  );
}
function sowReady(id) {
  var s = DB.sowing.find(function (x) {
    return x.id === id;
  });
  if (!s) return;
  var std =
    (
      DB.cat.find(function (c) {
        return s.variety.toLowerCase().indexOf(c.name.toLowerCase()) >= 0;
      }) || {}
    ).price || 10;
  openModal(
    '<h3><svg class="ic"><use href="#i-sprout"/></svg> ' +
      esc(s.variety) +
      ' → Stock</h3><p style="font-size:12.5px;color:var(--muted);margin:4px 0 10px">Sown ' +
      s.date +
      ' · ' +
      s.qty +
      ' ' +
      s.unit +
      '</p><div class="frow"><div><label>Seedlings produced (pcs)</label><input type="number" id="sr_qty" placeholder="0"></div><div><label>Price per seedling (KES)</label><input type="number" step="0.5" id="sr_price" value="' +
      std +
      '"></div></div><div class="mt"><button class="btn" onclick="sowReadySave(\'' +
      id +
      '\')"><svg class="ic"><use href="#i-save"/></svg> ' +
      t('save') +
      '</button> <button class="btn gray" onclick="closeModal()">' +
      t('close') +
      '</button></div>'
  );
}
function sowReadySave(id) {
  var s = DB.sowing.find(function (x) {
    return x.id === id;
  });
  var qty = num(document.getElementById('sr_qty').value);
  if (!qty) {
    alert('Seedlings produced?');
    return;
  }
  DB.inv.push({
    id: uid(),
    name: s.variety + ' Seedlings',
    cat: 'Seedlings',
    qty: qty,
    unit: 'pcs',
    price: num(document.getElementById('sr_price').value)
  });
  s.status = 'Ready (' + qty + ' pcs)';
  logAudit('Sowing ready to stock: ' + s.variety + ' x' + qty);
  saveDB();
  closeModal();
  rSowList();
  renderCal();
}
function printSow() {
  var m = document.getElementById('s_m').value;
  var rows = DB.sowing
    .filter(function (s) {
      return monthOf(s.date) === m;
    })
    .map(function (s) {
      return [
        s.date,
        esc(s.variety),
        s.qty + ' ' + s.unit,
        s.ready || '—',
        esc(s.seedCompany || '—'),
        s.expiry || '—',
        s.status,
        esc(s.notes || '')
      ];
    });
  printHTML(
    '<h2>' +
      t('sow') +
      ' — ' +
      m +
      '</h2>' +
      tbl(
        ['Planted', t('variety'), t('qty'), 'Expected', 'Seed Co.', 'Expiry', t('status'), t('notes')],
        rows
      )
  );
}
