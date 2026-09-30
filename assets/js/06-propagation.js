/* ================= PROPAGATION (customers who bring their own seeds) ================= */
function propClients() {
  var ids = {};
  DB.prop.forEach(function (j) {
    ids[j.custId] = 1;
  });
  return DB.cust.filter(function (c) {
    return c.custType === 'Propagates own seeds' || ids[c.id];
  });
}
function propCalc() {
  document.getElementById('pj_total').value =
    num(document.getElementById('pj_qty').value) * num(document.getElementById('pj_rate').value);
}
function propBadge(s) {
  return '<span class="badge ' + (s === 'Collected' ? 'g' : s === 'Ready' ? 'b' : 'a') + '">' + s + '</span>';
}
function rProp() {
  var active = DB.prop.filter(function (j) {
    return j.status !== 'Collected';
  });
  var bal = DB.prop.reduce(function (a, j) {
    return a + (num(j.total) - num(j.paid));
  }, 0);
  var h =
    hint('prop') +
    '<div class="grid c4"><div class="stat"><span>Propagation clients</span><b>' +
    propClients().length +
    '</b></div><div class="stat"><span>Jobs in progress</span><b>' +
    active.length +
    '</b></div><div class="stat"><span>Seedlings in progress</span><b>' +
    active
      .reduce(function (a, j) {
        return a + num(j.qty);
      }, 0)
      .toLocaleString() +
    '</b></div><div class="stat"><span>Fees balance due</span><b>' +
    fmt(bal) +
    '</b></div></div>' +
    '<div class="card"><h3><svg class="ic"><use href="#i-plus"/></svg> New Propagation Job</h3>' +
    '<div class="frow"><div><label>Client (type to search, or a new name)</label><input id="pj_client" list="pj_client_dl" autocomplete="off" placeholder="Client name…"><datalist id="pj_client_dl">' +
    propClients()
      .map(function (c) {
        return '<option value="' + esc(c.name) + '">';
      })
      .join('') +
    '</datalist></div>' +
    '<div><label>Phone (new client)</label><input id="pj_phone"></div><div><label><svg class="ic"><use href="#i-pin"/></svg> Location (new client)</label><input id="pj_loc" list="pj_loc_dl">' +
    afDatalist('loc', 'pj_loc_dl') +
    '</div></div>' +
    '<div class="frow"><div><label>Crop / Variety</label><input id="pj_var" list="pj_var_dl" placeholder="e.g. Tomato — Anna F1">' +
    afDatalist('propvar', 'pj_var_dl') +
    '</div><div><label>Seed source</label><input id="pj_src" list="pj_src_dl" placeholder="Client\'s own / company">' +
    afDatalist('seedcompany', 'pj_src_dl') +
    '</div><div><label>Seed expiry</label><input type="date" id="pj_exp"></div></div>' +
    '<div class="frow"><div><label>Seedlings quantity</label><input type="number" id="pj_qty" value="0" oninput="propCalc()"></div><div><label>Fee per seedling (KES)</label><input type="number" step="0.5" id="pj_rate" value="1" oninput="propCalc()"></div><div><label>Total fee</label><input id="pj_total" readonly value="0"></div><div><label>Paid now</label><input type="number" id="pj_paid" value="0"></div></div>' +
    '<div class="frow"><div><label>Date received</label><input type="date" id="pj_date" value="' +
    today() +
    '"></div><div><label>Expected ready</label><input type="date" id="pj_ready"></div><div><label>Pay method</label><select id="pj_method"><option>' +
    t('cash') +
    '</option><option>M-Pesa</option><option>' +
    t('bank') +
    '</option></select></div></div>' +
    '<label>' +
    t('notes') +
    '</label><input id="pj_notes"><div class="mt"><button class="btn" onclick="propSave()"><svg class="ic"><use href="#i-save"/></svg> Save Job</button></div></div>' +
    '<div class="card"><h3><svg class="ic"><use href="#i-clipboard"/></svg> Propagation Jobs</h3><div class="toolbar"><input id="pj_q" placeholder="Search client / variety / seed company" oninput="rPropList()" style="min-width:240px"><select id="pj_st" onchange="rPropList()"><option value="">All statuses</option><option>Sown</option><option>Ready</option><option>Collected</option></select><button class="btn sm" onclick="printProp()"><svg class="ic"><use href="#i-printer"/></svg> ' +
    t('print') +
    '</button></div><div id="pj_tbl"></div></div>' +
    '<div class="card"><h3><svg class="ic"><use href="#i-users"/></svg> Propagation Clients</h3><div class="toolbar"><button class="btn sm" onclick="custForm(\'\',\'Propagates own seeds\')">+ New Client</button></div><div id="pj_clients"></div></div>';
  document.getElementById('content').innerHTML = h;
  rPropList();
  rPropClients();
}
function propSave() {
  var g = function (id) {
    return document.getElementById(id).value;
  };
  var name = g('pj_client').trim(),
    variety = g('pj_var').trim(),
    qty = num(g('pj_qty')),
    rate = num(g('pj_rate'));
  if (!name) {
    alert('Client name?');
    return;
  }
  if (!variety) {
    alert('Crop / variety?');
    return;
  }
  if (!qty) {
    alert('Seedlings quantity?');
    return;
  }
  var c = DB.cust.find(function (x) {
    return x.name.toLowerCase() === name.toLowerCase();
  });
  if (!c) {
    c = {
      id: uid(),
      name: name,
      phone: g('pj_phone'),
      email: '',
      loc: g('pj_loc'),
      prop: '',
      crop: variety,
      qty: '',
      price: '',
      notes: '',
      lastBought: '',
      lastDate: '',
      lastMethod: '',
      custType: 'Propagates own seeds'
    };
    DB.cust.push(c);
    afTrack('loc', c.loc);
    logAudit('Added propagation client ' + name);
  }
  var total = qty * rate,
    paid = Math.min(num(g('pj_paid')), total);
  var j = {
    id: uid(),
    no: nextNo('PRP'),
    custId: c.id,
    variety: variety,
    src: g('pj_src').trim(),
    seedExpiry: g('pj_exp'),
    qty: qty,
    rate: rate,
    total: total,
    paid: paid,
    date: g('pj_date'),
    ready: g('pj_ready'),
    status: 'Sown',
    notes: g('pj_notes')
  };
  DB.prop.push(j);
  afTrack('propvar', variety);
  afTrack('seedcompany', j.src);
  if (paid > 0)
    DB.income.push({
      id: uid(),
      date: j.date,
      src: 'Propagation ' + j.no + ' — ' + c.name,
      amount: paid,
      method: g('pj_method')
    });
  logAudit('Propagation job ' + j.no + ' — ' + c.name + ' — ' + variety + ' x' + qty);
  saveDB();
  rProp();
}
function rPropList() {
  var q = (document.getElementById('pj_q').value || '').toLowerCase(),
    st = document.getElementById('pj_st').value;
  var rows = DB.prop
    .slice()
    .reverse()
    .filter(function (j) {
      var n = custName(j.custId).toLowerCase();
      return (
        (!st || j.status === st) &&
        (!q ||
          n.indexOf(q) >= 0 ||
          j.variety.toLowerCase().indexOf(q) >= 0 ||
          (j.src || '').toLowerCase().indexOf(q) >= 0 ||
          j.no.toLowerCase().indexOf(q) >= 0)
      );
    })
    .map(function (j) {
      var c =
        DB.cust.find(function (x) {
          return x.id === j.custId;
        }) || {};
      var bal = num(j.total) - num(j.paid);
      return [
        '<b>' + j.no + '</b><br><small>' + j.date + '</small>',
        '<b>' + esc(c.name || '—') + '</b><br><small>' + esc(c.phone || '') + '</small>',
        esc(j.variety) +
          '<br><small>' +
          esc(j.src || 'Own seeds') +
          (j.seedExpiry ? ' · exp ' + j.seedExpiry : '') +
          '</small>',
        num(j.qty).toLocaleString() + ' @ ' + fmtP(j.rate),
        fmt(j.total) + '<br><small>Paid ' + fmt(j.paid) + '</small>',
        bal > 0 ? '<span class="badge r">' + fmt(bal) + '</span>' : '<span class="badge g">Paid</span>',
        (j.ready || '—') + '<br>' + propBadge(j.status),
        (j.status === 'Sown'
          ? '<button class="btn sm" onclick="propStatus(\'' +
            j.id +
            '\',\'Ready\')"><svg class="ic"><use href="#i-check"/></svg> Ready</button> '
          : '') +
          (j.status === 'Ready'
            ? '<button class="btn sm" onclick="propStatus(\'' +
              j.id +
              '\',\'Collected\')"><svg class="ic"><use href="#i-box"/></svg> Collected</button> '
            : '') +
          (j.status !== 'Collected'
            ? '<button class="btn amber sm" onclick="reschedModal(\'prop\',\'' +
              j.id +
              '\')"><svg class="ic"><use href="#i-calendar"/></svg></button> '
            : '') +
          (bal > 0
            ? '<button class="btn amber sm" onclick="propPayForm(\'' +
              j.id +
              '\')"><svg class="ic"><use href="#i-cash"/></svg> Pay</button> '
            : '') +
          '<button class="btn gray sm" onclick="propSlip(\'' +
          j.id +
          '\')"><svg class="ic"><use href="#i-printer"/></svg></button> <button class="btn red sm" onclick="propDel(\'' +
          j.id +
          '\')">x</button>'
      ];
    });
  document.getElementById('pj_tbl').innerHTML = tbl(
    ['Job', 'Client', 'Crop / Seed source', 'Seedlings @ fee', 'Fee', 'Balance', 'Ready / Status', ''],
    rows
  );
}
function rPropClients() {
  var rows = propClients().map(function (c) {
    var js = DB.prop.filter(function (j) {
      return j.custId === c.id;
    });
    var fees = js.reduce(function (a, j) {
        return a + num(j.total);
      }, 0),
      paid = js.reduce(function (a, j) {
        return a + num(j.paid);
      }, 0);
    return [
      '<b>' + esc(c.name) + '</b><br><small>' + esc(c.phone || '') + '</small>',
      esc(c.loc || '—'),
      js.length,
      js
        .reduce(function (a, j) {
          return a + num(j.qty);
        }, 0)
        .toLocaleString(),
      fmt(fees),
      fees - paid > 0 ? '<span class="badge r">' + fmt(fees - paid) + '</span>' : '—',
      '<button class="btn sm" onclick="propNewFor(\'' +
        c.id +
        '\')">+ Job</button> <button class="btn gray sm" onclick="custForm(\'' +
        c.id +
        '\')">' +
        t('edit') +
        '</button>'
    ];
  });
  document.getElementById('pj_clients').innerHTML = tbl(
    ['Client', 'Location', 'Jobs', 'Seedlings', 'Total fees', 'Balance', ''],
    rows
  );
}
function propNewFor(id) {
  var c = DB.cust.find(function (x) {
    return x.id === id;
  });
  if (!c) return;
  var el = document.getElementById('pj_client');
  el.value = c.name;
  document.getElementById('pj_phone').value = c.phone || '';
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  document.getElementById('pj_var').focus();
}
function propStatus(id, st) {
  var j = DB.prop.find(function (x) {
    return x.id === id;
  });
  j.status = st;
  logAudit('Propagation ' + j.no + ' → ' + st);
  saveDB();
  rProp();
}
function propPayForm(id) {
  var j = DB.prop.find(function (x) {
    return x.id === id;
  });
  var bal = num(j.total) - num(j.paid);
  openModal(
    '<h3><svg class="ic"><use href="#i-cash"/></svg> ' +
      j.no +
      ' — ' +
      esc(custName(j.custId)) +
      '</h3><p style="margin:6px 0;font-size:13px">Balance due: <b>' +
      fmt(bal) +
      '</b></p><div class="frow"><div><label>Amount (KES)</label><input type="number" id="pp_amt" value="' +
      bal +
      '"></div><div><label>Method</label><select id="pp_m"><option>' +
      t('cash') +
      '</option><option>M-Pesa</option><option>' +
      t('bank') +
      '</option></select></div><div><label>' +
      t('date') +
      '</label><input type="date" id="pp_d" value="' +
      today() +
      '"></div></div>' +
      '<div class="mt"><button class="btn" onclick="propPaySave(\'' +
      id +
      '\')"><svg class="ic"><use href="#i-save"/></svg> ' +
      t('save') +
      '</button> <button class="btn gray" onclick="closeModal()">' +
      t('close') +
      '</button></div>'
  );
}
function propPaySave(id) {
  var j = DB.prop.find(function (x) {
    return x.id === id;
  });
  var amt = Math.min(num(document.getElementById('pp_amt').value), num(j.total) - num(j.paid));
  if (!(amt > 0)) {
    alert('Amount?');
    return;
  }
  j.paid = num(j.paid) + amt;
  DB.income.push({
    id: uid(),
    date: document.getElementById('pp_d').value,
    src: 'Propagation ' + j.no + ' — ' + custName(j.custId),
    amount: amt,
    method: document.getElementById('pp_m').value
  });
  logAudit('Propagation payment ' + j.no + ' — ' + fmt(amt));
  saveDB();
  closeModal();
  rProp();
}
function propDel(id) {
  var j = DB.prop.find(function (x) {
    return x.id === id;
  });
  uiConfirm(
    'Delete propagation job <b>' + esc(j.no) + '</b> for ' + esc(custName(j.custId)) + '?',
    "propDoDel('" + id + "')"
  );
}
function propDoDel(id) {
  var j = DB.prop.find(function (x) {
    return x.id === id;
  });
  DB.prop = DB.prop.filter(function (x) {
    return x.id !== id;
  });
  logAudit('Deleted propagation job ' + (j ? j.no : id));
  saveDB();
  rProp();
}
function propSlip(id) {
  var j = DB.prop.find(function (x) {
    return x.id === id;
  });
  var c =
    DB.cust.find(function (x) {
      return x.id === j.custId;
    }) || {};
  printHTML(
    '<h2>Propagation Job — ' +
      j.no +
      '</h2>' +
      tbl(
        ['Field', 'Details'],
        [
          ['Client', esc(c.name || '—')],
          ['Phone', esc(c.phone || '—')],
          ['Location', esc(c.loc || '—')],
          ['Crop / Variety', esc(j.variety)],
          ['Seed source', esc(j.src || "Client's own seeds")],
          ['Seed expiry', j.seedExpiry || '—'],
          ['Seedlings', num(j.qty).toLocaleString()],
          ['Fee per seedling', fmtP(j.rate)],
          ['Total fee', fmt(j.total)],
          ['Paid', fmt(j.paid)],
          ['Balance', fmt(num(j.total) - num(j.paid))],
          ['Date received', j.date],
          ['Expected ready', j.ready || '—'],
          ['Status', j.status],
          ['Notes', esc(j.notes || '—')]
        ]
      )
  );
}
function printProp() {
  var rows = DB.prop
    .slice()
    .reverse()
    .map(function (j) {
      return [
        j.no,
        j.date,
        esc(custName(j.custId)),
        esc(j.variety),
        esc(j.src || 'Own seeds'),
        num(j.qty).toLocaleString(),
        fmt(j.total),
        fmt(num(j.total) - num(j.paid)),
        j.ready || '—',
        j.status
      ];
    });
  printHTML(
    '<h2>Propagation Jobs — ' +
      today() +
      '</h2>' +
      tbl(
        [
          'No',
          'Received',
          'Client',
          'Variety',
          'Seed source',
          'Seedlings',
          'Fee',
          'Balance',
          'Ready',
          'Status'
        ],
        rows
      )
  );
}
