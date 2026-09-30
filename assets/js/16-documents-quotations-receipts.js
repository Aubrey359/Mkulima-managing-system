/* ================= DOCUMENTS / QUOTATIONS / RECEIPTS ================= */
function docsView() {
  var types = ['Quotation', 'Invoice', 'Delivery Note', 'Requisition', 'Local Purchase Order', 'Receipt'];
  var h =
    '<div class="card"><h3>' +
    (t('docs') || 'Documents') +
    '</h3><div class="frow">' +
    '<div><label>Type</label><select id="d_type">' +
    types
      .map(function (x) {
        return '<option>' + x + '</option>';
      })
      .join('') +
    '</select></div>' +
    '<div><label>' +
    t('date') +
    '</label><input type="date" id="d_date" value="' +
    today() +
    '"></div>' +
    '<div><label>' +
    t('customer') +
    ' / ' +
    t('supplier') +
    '</label><select id="d_for"><option value="">—</option>' +
    DB.cust
      .map(function (c) {
        return '<option value="c_' + c.id + '">' + esc(c.name) + '</option>';
      })
      .join('') +
    DB.sup
      .map(function (s) {
        return '<option value="s_' + s.id + '">' + esc(s.name) + '</option>';
      })
      .join('') +
    '</select></div>' +
    '<div><label>' +
    t('sales') +
    ' # (link)</label><select id="d_order"><option value="">—</option>' +
    DB.orders
      .slice()
      .reverse()
      .map(function (o) {
        return (
          '<option value="' +
          o.id +
          '">' +
          o.no +
          ' ' +
          esc(custName(o.custId)) +
          ' ' +
          fmt(o.total) +
          '</option>'
        );
      })
      .join('') +
    '</select></div></div>' +
    '<div class="frow"><div><label>' +
    t('tel') +
    '</label><input id="d_tel" value="' +
    COMPANY.tel +
    '"></div><div><label>Delivery No.</label><input id="d_delno" placeholder="DN-001"></div><div><label>Address</label><input id="d_addr" value="' +
    esc(COMPANY.addr || '') +
    '"></div>' +
    '<div><label>' +
    t('valid') +
    ' (' +
    (LANG === 'sw' ? 'siku' : 'days') +
    ')</label><input type="number" id="d_valid" value="14"></div></div>' +
    '<div class="frow"><div><label style="display:flex;align-items:center;gap:6px;font-weight:600;color:var(--ink)"><input type="checkbox" id="d_vat" style="width:auto"> ' +
    t('vat') +
    '</label></div></div>' +
    '<label>Items — one per line: Item, Qty, Price</label><textarea id="d_items" rows="4" placeholder="Tomato Seedlings, 500, 10"></textarea>' +
    '<div class="frow mt"><div><label>' +
    t('notes') +
    '</label><input id="d_notes"></div></div>' +
    '<button class="btn" onclick="saveDoc()"><svg class="ic"><use href="#i-save"/></svg> ' +
    t('save') +
    ' & <svg class="ic"><use href="#i-printer"/></svg></button></div>' +
    '<div class="card"><h3>Archive</h3>' +
    tbl(
      [t('date'), 'Type', 'For', t('total'), '', ''],
      DB.docs
        .slice()
        .reverse()
        .map(function (d) {
          return [
            d.date,
            d.type,
            esc(d.forName),
            fmt(d.total),
            '<button class="btn sm" onclick="printSavedDoc(\'' +
              d.id +
              '\')"><svg class="ic"><use href="#i-printer"/></svg></button>',
            '<button class="btn red sm" onclick="DB.docs=DB.docs.filter(function(x){return x.id!==\'' +
              d.id +
              '\'});saveDB();docsView()">x</button>'
          ];
        })
    ) +
    '</div>';
  document.getElementById('salesBody').innerHTML = h;
}
function saveDoc() {
  var type = document.getElementById('d_type').value,
    fid = document.getElementById('d_for').value,
    forName = '—';
  if (fid.indexOf('c_') === 0) forName = custName(fid.slice(2));
  else if (fid.indexOf('s_') === 0) {
    var s = DB.sup.find(function (x) {
      return x.id === fid.slice(2);
    });
    forName = s ? s.name : '—';
  }
  var items = [],
    tot = 0;
  document
    .getElementById('d_items')
    .value.split('\n')
    .forEach(function (l) {
      var p = l.split(',');
      if (p.length < 2) return;
      var q = num(p[1]),
        pr = num(p[2]),
        a = q * pr;
      items.push({ name: p[0].trim(), qty: q, price: pr, amt: a });
      tot += a;
    });
  var oid = document.getElementById('d_order').value;
  var linked = DB.orders.find(function (o) {
    return o.id === oid;
  });
  if (linked) {
    items = linked.items.map(function (x) {
      return { name: x.name, qty: x.qty, price: x.price, amt: x.qty * x.price };
    });
    tot = linked.total;
    if (forName === '—') forName = custName(linked.custId);
  }
  var vd = new Date(document.getElementById('d_date').value);
  vd.setDate(vd.getDate() + num(document.getElementById('d_valid').value || 14));
  var d = {
    id: uid(),
    no: nextNo(type === 'Local Purchase Order' ? 'LPO' : type.slice(0, 3).toUpperCase()),
    date: document.getElementById('d_date').value,
    type: type,
    forName: forName,
    items: items,
    total: tot,
    notes: document.getElementById('d_notes').value,
    tel: document.getElementById('d_tel').value,
    delno: document.getElementById('d_delno').value,
    addr: document.getElementById('d_addr').value,
    validUntil: vd.toISOString().slice(0, 10),
    vat: document.getElementById('d_vat').checked
  };
  DB.docs.push(d);
  saveDB();
  printSavedDoc(d.id);
  docsView();
}
function printSavedDoc(id) {
  docPrint(
    DB.docs.find(function (x) {
      return x.id === id;
    })
  );
}
function printDoc(orderId, type) {
  var o = DB.orders.find(function (x) {
    return x.id === orderId;
  });
  if (type === 'Receipt') {
    printHTML(receiptHTML(o), 'rc');
    return;
  }
  docPrint({
    date: o.date,
    no: o.no,
    type: type,
    forName: custName(o.custId),
    items: o.items.map(function (x) {
      return { name: x.name, qty: x.qty, price: x.price, amt: x.qty * x.price };
    }),
    sub: num(o.sub) || num(o.total),
    disc: num(o.disc),
    vatAmt: num(o.vat),
    total: num(o.total),
    paid: num(o.paid),
    balance: num(o.balance),
    method: o.pay,
    mpesa: o.mpesa,
    comm: o.comm,
    empName2: empName(o.empId),
    notes: o.notes || '',
    tel: COMPANY.tel,
    delno: '',
    addr: COMPANY.addr
  });
}
function payColor(p) {
  p = String(p || '').toLowerCase();
  return p.indexOf('pesa') >= 0
    ? '#16a34a'
    : p.indexOf('bank') >= 0
      ? '#2563eb'
      : p.indexOf('credit') >= 0 || p.indexOf('deni') >= 0
        ? '#d97706'
        : '#0f766e';
}
function receiptHTML(o) {
  var c =
    DB.cust.find(function (x) {
      return x.id === o.custId;
    }) || {};
  var M = function (n) {
    return Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  var pay = String(o.pay || '—'),
    payL = pay.charAt(0).toUpperCase() + pay.slice(1),
    bal = num(o.balance),
    sw = LANG === 'sw';
  var rows = o.items
    .map(function (x, i) {
      return (
        '<tr style="background:' +
        (i % 2 ? '#f1f8f3' : '#ffffff') +
        '"><td>' +
        (i + 1) +
        '</td><td>' +
        esc(x.name) +
        '</td><td style="text-align:center">' +
        x.qty +
        '</td><td style="text-align:right">' +
        M(x.price) +
        '</td><td style="text-align:right"><b>' +
        M(x.qty * x.price) +
        '</b></td></tr>'
      );
    })
    .join('');
  return (
    '<div class="rcWrap">' +
    '<div style="background:#14532d;color:#fff;padding:14px 18px"><table style="width:100%"><tr><td style="color:#fff"><table style="width:auto"><tr><td style="padding:0 10px 0 0"><span style="background:#fff;border-radius:50%;padding:5px;display:inline-flex;box-shadow:0 1px 4px rgba(0,0,0,.35)"><img src="' +
    LOGO_ICON +
    '" style="width:44px;height:44px;display:block"></span></td><td style="color:#fff"><div style="font-size:21px;font-weight:800;letter-spacing:.4px">' +
    esc(COMPANY.name) +
    '</div><div style="font-size:12px;font-style:italic;color:#bbf7d0">"' +
    esc(COMPANY.motto || '') +
    '"</div><div style="font-size:11px;margin-top:3px;color:#dcfce7">' +
    (COMPANY.addr ? esc(COMPANY.addr) + ' &nbsp;·&nbsp; ' : '') +
    t('tel') +
    ': ' +
    esc(COMPANY.tel) +
    '</div><div style="font-size:11px;color:#dcfce7">' +
    esc(COMPANY.email) +
    '</div></td></tr></table></td>' +
    '<td style="text-align:right;color:#fff;vertical-align:top"><div style="font-size:11px;letter-spacing:2px;color:#bbf7d0">' +
    (sw ? 'RISITI' : 'RECEIPT') +
    '</div><div style="font-size:23px;font-weight:800">' +
    esc(o.no) +
    '</div><div style="font-size:12px">' +
    o.date +
    '</div></td></tr></table></div>' +
    '<div style="background:#f1f8f3;padding:10px 18px;border-bottom:2px solid #14532d"><table style="width:100%"><tr><td style="vertical-align:top"><div style="font-size:10.5px;color:#557">' +
    t('customer').toUpperCase() +
    '</div><div style="font-size:16px;font-weight:800">' +
    esc(custName(o.custId)) +
    '</div><div style="font-size:12px">' +
    esc(c.phone || '') +
    (c.loc ? ' · <svg class="ic"><use href="#i-pin"/></svg>' + esc(c.loc) : '') +
    '</div></td>' +
    '<td style="text-align:right;vertical-align:top"><div style="font-size:10.5px;color:#557">' +
    t('tended').toUpperCase() +
    '</div><div style="font-size:15px;font-weight:800">' +
    (o.empId ? esc(empName(o.empId)) : '—') +
    '</div><div style="font-size:12px">' +
    esc(o.comm || '') +
    '</div></td></tr></table></div>' +
    '<div style="padding:10px 18px 0"><table class="rcItems"><tr><th style="width:34px">#</th><th>' +
    (sw ? 'Bidhaa' : 'Item') +
    '</th><th style="text-align:center;width:70px">' +
    t('qty') +
    '</th><th style="text-align:right;width:110px">' +
    (sw ? 'Bei' : 'Unit price') +
    ' (KES)</th><th style="text-align:right;width:120px">' +
    (sw ? 'Kiasi' : 'Amount') +
    ' (KES)</th></tr>' +
    rows +
    '</table></div>' +
    '<div style="flex:1"></div>' +
    '<div style="padding:10px 18px"><table style="width:100%"><tr>' +
    '<td style="vertical-align:top;width:52%;padding-right:14px"><div style="border:2px solid ' +
    payColor(pay) +
    ';border-radius:10px;padding:10px 12px"><div style="font-size:10.5px;color:#557">' +
    (sw ? 'NJIA YA MALIPO' : 'PAYMENT METHOD') +
    '</div><div style="display:inline-block;background:' +
    payColor(pay) +
    ';color:#fff;font-weight:800;font-size:15px;padding:4px 14px;border-radius:20px;margin:4px 0">' +
    esc(payL) +
    '</div>' +
    (o.mpesa
      ? '<div style="font-size:12px">M-Pesa ' +
        (sw ? 'Msimbo' : 'code') +
        ': <b>' +
        esc(o.mpesa) +
        '</b></div>'
      : '') +
    '<div style="font-size:12px;margin-top:4px">' +
    t('paid') +
    ': <b>KES ' +
    M(o.paid) +
    '</b></div>' +
    '<div style="margin-top:6px;font-weight:800;font-size:13px;color:' +
    (bal > 0 ? '#b91c1c' : '#15803d') +
    '">' +
    (bal > 0
      ? (sw ? 'DENI ILIYOBAKI: ' : 'BALANCE DUE: ') + 'KES ' + M(bal)
      : sw
        ? '<svg class="ic"><use href="#i-check"/></svg> IMELIPWA YOTE'
        : '<svg class="ic"><use href="#i-check"/></svg> PAID IN FULL') +
    '</div></div></td>' +
    '<td style="vertical-align:top"><table style="width:100%;font-size:13px"><tr><td>' +
    t('subtotal') +
    '</td><td style="text-align:right">' +
    M(o.sub || o.total) +
    '</td></tr>' +
    (num(o.disc)
      ? '<tr><td>' + t('discount') + '</td><td style="text-align:right">-' + M(o.disc) + '</td></tr>'
      : '') +
    (num(o.vat)
      ? '<tr><td>' + t('vat') + '</td><td style="text-align:right">' + M(o.vat) + '</td></tr>'
      : '') +
    '<tr style="background:#14532d;color:#fff"><td style="padding:8px;font-size:15px;font-weight:800;color:#fff">' +
    t('total').toUpperCase() +
    '</td><td style="text-align:right;padding:8px;font-size:16px;font-weight:800;color:#fff">KES ' +
    M(o.total) +
    '</td></tr>' +
    '<tr><td>' +
    t('paid') +
    '</td><td style="text-align:right">' +
    M(o.paid) +
    '</td></tr><tr style="background:' +
    (bal > 0 ? '#fee2e2' : '#dcfce7') +
    '"><td style="padding:5px;font-weight:700">' +
    t('balance') +
    '</td><td style="text-align:right;padding:5px;font-weight:800">' +
    M(bal) +
    '</td></tr></table></td></tr></table>' +
    (o.deliver && !o.deliver.done
      ? '<div style="margin-top:6px;background:#dbeafe;border-radius:8px;padding:6px 10px;font-size:12px"><svg class="ic"><use href="#i-truck"/></svg> ' +
        (sw ? 'Itasafirishwa' : 'To be delivered') +
        ': <b>' +
        esc(o.deliver.date || '') +
        '</b>' +
        (o.deliver.addr ? ' — ' + esc(o.deliver.addr) : '') +
        '</div>'
      : '') +
    (o.notes
      ? '<div style="font-size:11.5px;margin-top:6px">' + t('notes') + ': ' + esc(o.notes) + '</div>'
      : '') +
    '</div>' +
    '<div style="padding:0 18px 12px"><table style="width:100%"><tr><td style="width:46%;padding-top:22px;border-top:1px solid #333;font-size:11px">' +
    t('tended') +
    ': ' +
    (o.empId ? esc(empName(o.empId)) : '&nbsp;') +
    '</td><td style="width:8%"></td><td style="padding-top:22px;border-top:1px solid #333;font-size:11px">' +
    (sw ? 'Sahihi ya mteja' : 'Customer signature') +
    '</td></tr></table></div>' +
    '<div style="background:#14532d;color:#fff;text-align:center;padding:9px;font-size:12.5px"><b>' +
    (sw ? 'Karibu tena!' : 'Thank you — Karibu tena!') +
    '</b> · <i>' +
    esc(COMPANY.motto || '') +
    '</i><br><span style="font-size:10.5px;color:#bbf7d0">' +
    (sw ? 'Hifadhi risiti hii kama ushahidi wa malipo' : 'Keep this receipt as proof of payment') +
    '</span></div></div>'
  );
}
function docPrint(d) {
  var isLPO = d.type === 'Local Purchase Order';
  var sub =
    num(d.sub) ||
    d.items.reduce(function (a, i) {
      return a + num(i.amt);
    }, 0);
  var disc = num(d.disc),
    vatAmt = d.vatAmt !== undefined ? num(d.vatAmt) : d.vat ? Math.round(sub * 0.16 * 100) / 100 : 0;
  var grand = sub - disc + vatAmt;
  var body =
    '<h2 style="text-transform:uppercase;text-align:center">' +
    esc(d.type) +
    (d.no ? ' — ' + esc(d.no) : '') +
    '</h2>' +
    '<p><b>' +
    t('date') +
    ':</b> ' +
    d.date +
    (d.type === 'Quotation' && d.validUntil ? ' &nbsp; <b>' + t('valid') + ':</b> ' + d.validUntil : '') +
    ' &nbsp; <b>' +
    (isLPO ? 'M/S:' : 'To:') +
    '</b> ' +
    esc(d.forName) +
    (d.delno ? ' &nbsp; <b>Delivery No:</b> ' + esc(d.delno) : '') +
    (d.tel ? ' &nbsp; <b>' + t('tel') + ':</b> ' + esc(d.tel) : '') +
    (d.addr ? ' &nbsp; <b>Address:</b> ' + esc(d.addr) : '') +
    '</p>' +
    (isLPO ? '<p style="margin:6px 0">Please supply us with the following:</p>' : '') +
    tbl(
      [
        isLPO ? 'Quantity' : t('qty'),
        'Item / Description',
        isLPO ? '' : 'Unit ' + t('price'),
        isLPO ? '' : t('amount')
      ],
      d.items.map(function (i) {
        return isLPO ? [i.qty, esc(i.name), '', ''] : [i.qty, esc(i.name), fmt(i.price), fmt(i.amt)];
      })
    );
  if (!isLPO) {
    body += '<h3 class="right" style="margin-top:8px">' + t('subtotal') + ': ' + fmt(sub) + '</h3>';
    if (disc) body += '<h3 class="right">' + t('discount') + ': -' + fmt(disc) + '</h3>';
    if (vatAmt) body += '<h3 class="right">' + t('vat') + ': ' + fmt(vatAmt) + '</h3>';
    body += '<h3 class="right"><b>' + t('total') + ': ' + fmt(grand) + '</b></h3>';
    if (d.type === 'Receipt' || d.type === 'Invoice') {
      body +=
        '<p class="right">' +
        t('paid') +
        ' (' +
        esc(d.method || '') +
        '): ' +
        fmt(d.paid) +
        (d.mpesa ? ' · ' + esc(d.mpesa) : '') +
        ' &nbsp;·&nbsp; ' +
        t('balance') +
        ': ' +
        fmt(d.balance) +
        '</p>';
    }
    if (d.type === 'Quotation') {
      body +=
        '<div style="margin-top:12px;font-size:12px;border:1px solid #999;padding:10px;border-radius:8px"><b>' +
        t('terms') +
        '</b><br>1. 50% deposit to confirm this order.<br>2. Prices ' +
        t('valid').toLowerCase() +
        ' until ' +
        esc(d.validUntil || '—') +
        '.<br>3. Balance payable on pick-up / delivery.<br>4. ' +
        esc(COMPANY.name) +
        ' — ' +
        COMPANY.tel +
        '</div>';
    }
    if (d.notes) body += '<p>' + t('notes') + ': ' + esc(d.notes) + '</p>';
    if (d.comm || d.empName2)
      body +=
        '<p style="font-size:11px;color:#555">' +
        t('tended') +
        ': ' +
        esc(d.empName2 || '—') +
        ' · ' +
        t('communicated') +
        ': ' +
        esc(d.comm || '—') +
        '</p>';
  }
  body +=
    '<div style="margin-top:45px;display:flex;justify-content:space-between"><div>Stamp:<br><br>____________________</div><div>' +
    t('prepared') +
    ' ' +
    esc((session ? session.u : '') || '') +
    '<br><br>____________________</div></div>';
  printHTML(body);
}
