/* ================= CRM ================= */
function rCRM() {
  var h =
    '<div class="card">' +
    hint('crm') +
    '<div class="toolbar"><button class="btn" onclick="custForm()">+ ' +
    t('customer') +
    '</button>' +
    '<label class="btn gray sm" style="cursor:pointer;margin:0">' +
    t('import') +
    '<input type="file" accept=".xlsx,.xls,.csv,.docx" style="display:none" onchange="importContacts(this)"></label>' +
    '<button class="btn blue sm" onclick="exportRows(\'Customers\',DB.cust.map(function(c){return{Name:c.name,Phone:c.phone,Email:c.email,Location:c.loc,Propagation:c.prop,Crop:c.crop,Qty:c.qty,Price:c.price,LastBought:c.lastBought,LastDate:c.lastDate,Method:c.lastMethod}}))">' +
    t('export') +
    '</button>' +
    '<button class="btn sm" onclick="printCust()"><svg class="ic"><use href="#i-printer"/></svg> ' +
    t('print') +
    '</button>' +
    '<button class="btn gray sm" onclick="showDupModal()"><svg class="ic"><use href="#i-copy"/></svg> Duplicate Detector</button>' +
    '<input id="c_q" placeholder="' +
    t('search') +
    ' name / phone / location" oninput="rCRMList()" style="min-width:220px"></div><div id="crm_tbl"></div></div>' +
    '<div class="card"><h3>Follow-ups</h3><div id="f_tbl"></div></div>';
  document.getElementById('content').innerHTML = h;
  if (GS.crm) {
    document.getElementById('c_q').value = GS.crm;
    GS.crm = '';
  }
  rCRMList();
  rFollow();
}
function rCRMList() {
  var q = (document.getElementById('c_q').value || '').toLowerCase();
  var rows = DB.cust
    .filter(function (c) {
      if (c.custType === 'Propagates own seeds') return false;
      return (
        !q ||
        c.name.toLowerCase().indexOf(q) >= 0 ||
        (c.phone || '').indexOf(q) >= 0 ||
        (c.loc || '').toLowerCase().indexOf(q) >= 0
      );
    })
    .map(function (c) {
      var lp = DB.pricehist.filter(function (p) {
        return p.custId === c.id;
      });
      return [
        '<b>' +
          esc(c.name) +
          '</b><br><small>' +
          esc(c.phone || '') +
          ' · ' +
          esc(c.email || '') +
          '<br><svg class="ic"><use href="#i-pin"/></svg>' +
          esc(c.loc || '—') +
          (c.custType ? ' · ' + esc(c.custType) : '') +
          '</small>',
        esc(c.prop || '—'),
        esc(c.crop || '—'),
        c.qty || '—',
        c.price ? fmt(c.price) : '—',
        lp.length ? fmt(lp[lp.length - 1].price) + '<br><small>' + lp[lp.length - 1].date + '</small>' : '—',
        '<small>' +
          esc(c.lastBought || '—') +
          '<br>' +
          (c.lastDate || '') +
          ' · <b>' +
          esc(c.lastMethod || '') +
          '</b></small>',
        '<button class="btn sm" onclick="printStatement(\'' +
          c.id +
          '\')"><svg class="ic"><use href="#i-file"/></svg> ' +
          t('statement') +
          '</button> <button class="btn gray sm" onclick="addFollow(\'' +
          c.id +
          '\')">' +
          t('follow') +
          '</button> <button class="btn gray sm" onclick="custForm(\'' +
          c.id +
          '\')">' +
          t('edit') +
          '</button> <button class="btn red sm" onclick="if(confirm(\'' +
          t('delete') +
          "?')){DB.cust=DB.cust.filter(function(x){return x.id!=='" +
          c.id +
          '\'});saveDB();rCRMList()}">x</button>'
      ];
    });
  document.getElementById('crm_tbl').innerHTML = tbl(
    [
      t('contact'),
      'Propagation',
      t('crop'),
      t('qty'),
      t('price'),
      t('pricehist'),
      t('lastbought') + ' (what · when · how)',
      '/'
    ],
    rows
  );
}
function showDupModal() {
  var groups = {};
  DB.cust.forEach(function (c) {
    var key = (c.phone || '').replace(/\D/g, '').slice(-9) || 'n:' + c.name.toLowerCase().trim();
    (groups[key] = groups[key] || []).push(c);
  });
  var dupes = Object.keys(groups)
    .map(function (k) {
      return groups[k];
    })
    .filter(function (g) {
      return g.length > 1;
    });
  if (!dupes.length) {
    alert('No likely duplicate customers found (matched by phone number / exact name).');
    return;
  }
  var h =
    '<h3><svg class="ic"><use href="#i-copy"/></svg> Duplicate Detector</h3><p style="font-size:12px;color:var(--muted)">Grouped by matching phone number or identical name. Review and delete the extra record(s).</p>';
  dupes.forEach(function (g) {
    h +=
      '<div class="card" style="margin:8px 0">' +
      g
        .map(function (c) {
          return (
            '<div class="rowflex" style="justify-content:space-between"><span><b>' +
            esc(c.name) +
            '</b> · ' +
            esc(c.phone || '—') +
            ' · ' +
            esc(c.loc || '—') +
            '</span><button class="btn red sm" onclick="if(confirm(\'Delete this duplicate record?\')){DB.cust=DB.cust.filter(function(x){return x.id!==\'' +
            c.id +
            '\'});saveDB();closeModal();showDupModal();rCRMList()}">Delete</button></div>'
          );
        })
        .join('<hr style="margin:6px 0">') +
      '</div>';
  });
  h += '<div class="mt"><button class="btn gray" onclick="closeModal()">' + t('close') + '</button></div>';
  openModal(h);
}
function printStatement(cid) {
  var c = DB.cust.find(function (x) {
    return x.id === cid;
  });
  if (!c) return;
  var os = DB.orders
    .filter(function (o) {
      return o.custId === cid;
    })
    .slice()
    .reverse();
  var owed = os.reduce(function (a, o) {
    return a + num(o.balance);
  }, 0);
  var pays = [];
  os.forEach(function (o) {
    (o.payments || []).forEach(function (p) {
      pays.push({ date: p.date, no: o.no, amount: p.amount, method: p.method });
    });
  });
  var h =
    '<h2>' +
    t('statement') +
    ' — ' +
    esc(c.name) +
    '</h2><p style="font-size:12px">' +
    esc(c.phone || '') +
    (c.loc ? ' · ' + esc(c.loc) : '') +
    (c.email ? ' · ' + esc(c.email) : '') +
    ' &nbsp;·&nbsp; ' +
    t('date') +
    ': ' +
    today() +
    '</p>' +
    '<h3 style="margin:10px 0 4px">' +
    t('sales') +
    '</h3>' +
    tbl(
      [t('date'), 'No', 'Items', t('total'), t('paid'), t('balance')],
      os.map(function (o) {
        return [
          o.date,
          o.no,
          o.items
            .map(function (x) {
              return esc(x.name) + ' x' + x.qty;
            })
            .join(', '),
          fmt(o.total),
          fmt(o.paid),
          num(o.balance) > 0
            ? '<b>' + fmt(o.balance) + '</b>'
            : '<svg class="ic"><use href="#i-check"/></svg>'
        ];
      })
    );
  if (pays.length)
    h +=
      '<h3 style="margin:10px 0 4px">' +
      t('receive') +
      '</h3>' +
      tbl(
        [t('date'), 'No', t('method'), t('amount')],
        pays.map(function (p) {
          return [p.date, p.no, p.method, fmt(p.amount)];
        })
      );
  h +=
    '<h3 class="right" style="margin-top:10px">' +
    t('owed') +
    ': ' +
    fmt(owed) +
    '</h3><p style="font-size:11px;color:#555">' +
    (LANG === 'sw' ? 'Tafadhali lipa kupitia ' : 'Please pay via ') +
    ' ' +
    COMPANY.tel +
    ' (M-Pesa). ' +
    esc(COMPANY.name) +
    '.</p>';
  printHTML(h);
}
function custForm(id, preType) {
  var c = id
    ? DB.cust.find(function (x) {
        return x.id === id;
      })
    : {
        name: '',
        phone: '',
        email: '',
        loc: '',
        prop: '',
        crop: '',
        qty: '',
        price: '',
        notes: '',
        custType: preType || ''
      };
  var types = ['', 'Propagates own seeds', 'Buys ready seedlings', 'Other'];
  openModal(
    '<h3>' +
      (id ? t('edit') : t('add')) +
      ' ' +
      t('customer') +
      '</h3><div class="frow">' +
      '<div><label>' +
      t('name') +
      '</label><input id="cf_name" value="' +
      esc(c.name) +
      '"></div><div><label>' +
      t('tel') +
      '</label><input id="cf_phone" value="' +
      esc(c.phone || '') +
      '"></div>' +
      '<div><label>' +
      t('email') +
      '</label><input id="cf_email" value="' +
      esc(c.email || '') +
      '"></div><div><label><svg class="ic"><use href="#i-pin"/></svg> Location</label><input id="cf_loc" list="cf_loc_dl" value="' +
      esc(c.loc || '') +
      '">' +
      afDatalist('loc', 'cf_loc_dl') +
      '</div></div>' +
      '<div class="frow"><div><label>Propagation</label><input id="cf_prop" value="' +
      esc(c.prop || '') +
      '"></div><div><label>' +
      t('crop') +
      '</label><input id="cf_crop" value="' +
      esc(c.crop || '') +
      '"></div>' +
      '<div><label>' +
      t('qty') +
      '</label><input id="cf_qty" value="' +
      esc(c.qty || '') +
      '"></div><div><label>' +
      t('price') +
      '</label><input type="number" id="cf_price" value="' +
      (c.price || '') +
      '"></div></div>' +
      '<div class="frow"><div><label>Customer Type</label><select id="cf_ctype">' +
      types
        .map(function (x) {
          return '<option' + (c.custType === x ? ' selected' : '') + '>' + x + '</option>';
        })
        .join('') +
      '</select></div></div>' +
      '<label>' +
      t('notes') +
      '</label><input id="cf_notes" value="' +
      esc(c.notes || '') +
      '">' +
      '<div class="mt"><button class="btn" onclick="saveCust(\'' +
      (id || '') +
      '\')"><svg class="ic"><use href="#i-save"/></svg> ' +
      t('save') +
      '</button> <button class="btn gray" onclick="closeModal()">' +
      t('close') +
      '</button></div>'
  );
}
function saveCust(id) {
  var n = document.getElementById('cf_name').value.trim();
  if (!n) {
    alert(t('name') + '?');
    return;
  }
  var d = {
    name: n,
    phone: cf_phone.value,
    email: cf_email.value,
    loc: cf_loc.value,
    prop: cf_prop.value,
    crop: cf_crop.value,
    qty: cf_qty.value,
    price: num(cf_price.value),
    notes: cf_notes.value,
    custType: cf_ctype.value
  };
  afTrack('loc', d.loc);
  if (id) {
    var c = DB.cust.find(function (x) {
      return x.id === id;
    });
    for (var k in d) c[k] = d[k];
    logAudit('Edited customer ' + n);
  } else {
    d.id = uid();
    d.lastBought = '';
    d.lastDate = '';
    d.lastMethod = '';
    DB.cust.push(d);
    logAudit('Added customer ' + n);
  }
  saveDB();
  closeModal();
  refreshCust();
}
function refreshCust() {
  if (document.getElementById('crm_tbl')) rCRMList();
  else if (CUR === 'prop') rProp();
}
function addFollow(cid) {
  openModal(
    '<h3>' +
      t('follow') +
      ' — ' +
      esc(custName(cid)) +
      '</h3><div class="frow"><div><label>' +
      t('date') +
      '</label><input type="date" id="f_date" value="' +
      today() +
      '"></div><div><label>Type</label><select id="f_type"><option>' +
      t('call') +
      '</option><option>' +
      t('visit') +
      '</option><option>' +
      t('whatsapp') +
      '</option><option>' +
      t('email') +
      '</option></select></div></div><label>' +
      t('notes') +
      '</label><input id="f_note"><div class="mt"><button class="btn" onclick="saveFollow(\'' +
      cid +
      '\')"><svg class="ic"><use href="#i-save"/></svg></button></div>'
  );
}
function saveFollow(cid) {
  DB.follow.push({
    id: uid(),
    custId: cid,
    date: f_date.value,
    type: f_type.value,
    note: f_note.value,
    done: 'Pending'
  });
  saveDB();
  closeModal();
  rFollow();
}
function rFollow() {
  document.getElementById('f_tbl').innerHTML = tbl(
    [t('date'), t('customer'), 'Type', t('notes'), t('status'), ''],
    DB.follow
      .slice()
      .reverse()
      .map(function (f) {
        return [
          f.date,
          esc(custName(f.custId)),
          f.type,
          esc(f.note),
          f.done === 'Pending'
            ? '<span class="badge a">' + t('pending') + '</span>'
            : '<span class="badge g"><svg class="ic"><use href="#i-check"/></svg></span>',
          '<button class="btn sm" onclick="var x=DB.follow.find(function(y){return y.id===\'' +
            f.id +
            '\'});x.done=x.done===\'Pending\'?\'Done\':\'Pending\';saveDB();rFollow()"><svg class="ic"><use href="#i-check"/></svg></button> <button class="btn red sm" onclick="DB.follow=DB.follow.filter(function(y){return y.id!==\'' +
            f.id +
            '\'});saveDB();rFollow()">x</button>'
        ];
      })
  );
}
function printCust() {
  printHTML(
    '<h2>' +
      t('customer') +
      ' Directory — ' +
      today() +
      '</h2>' +
      tbl(
        [t('name'), t('tel'), 'Location', t('lastbought'), t('date'), t('method')],
        DB.cust.map(function (c) {
          return [
            esc(c.name),
            esc(c.phone || ''),
            esc(c.loc || ''),
            esc(c.lastBought || '—'),
            c.lastDate || '—',
            esc(c.lastMethod || '—')
          ];
        })
      )
  );
}

function importContacts(inp) {
  var f = inp.files[0];
  if (!f) return;
  var reader = new FileReader();
  var name = f.name.toLowerCase();
  reader.onload = function (e) {
    if (name.endsWith('.docx')) {
      mammoth
        .extractRawText({ arrayBuffer: e.target.result })
        .then(function (r) {
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
              notes: 'Word'
            });
            n++;
          });
          saveDB();
          alert('Imported ' + n);
          rCRMList();
        })
        .catch(function () {
          alert('Word?');
        });
    } else {
      var wb = XLSX.read(e.target.result, { type: name.endsWith('.csv') ? 'string' : 'array' });
      var rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      var n = 0;
      rows.forEach(function (r) {
        var g = function (k) {
          var key = Object.keys(r).find(function (y) {
            return y.toLowerCase().indexOf(k) >= 0;
          });
          return key ? String(r[key]) : '';
        };
        if (g('name')) {
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
            notes: 'Excel'
          });
          n++;
        }
      });
      saveDB();
      alert('Imported ' + n);
      rCRMList();
    }
  };
  if (name.endsWith('.csv')) reader.readAsText(f);
  else reader.readAsArrayBuffer(f);
  inp.value = '';
}
