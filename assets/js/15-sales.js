/* ================= SALES ================= */
function rSales() {
  var i = TAB.sales || 0;
  var tabs = [t('add') + ' ' + t('sales'), t('orderbook') || 'Order Book', t('docs') || 'Documents'];
  var h =
    '<div class="tabs">' +
    tabs
      .map(function (x, n) {
        return (
          '<div class="tab' +
          (n === i ? ' active' : '') +
          '" onclick="TAB.sales=' +
          n +
          ';rSales()">' +
          x +
          '</div>'
        );
      })
      .join('') +
    '</div><div id="salesBody"></div>';
  document.getElementById('content').innerHTML = h;
  if (i === 0) orderForm();
  else if (i === 1) orderBook();
  else docsView();
}
function orderForm() {
  var h =
    '<div class="card"><h3>' +
    t('add') +
    ' — ' +
    t('sales') +
    '</h3><div class="frow">' +
    '<div><label>' +
    t('date') +
    '</label><input type="date" id="o_date" value="' +
    today() +
    '"></div>' +
    '<div><label>' +
    t('customer') +
    ' (type to search or add new)</label><div class="rowflex"><input id="o_custq" list="o_cust_dl" placeholder="Type customer name…" oninput="custTypeAhead()" style="flex:1">' +
    '<datalist id="o_cust_dl">' +
    DB.cust
      .map(function (c) {
        return '<option value="' + esc(c.name) + '">';
      })
      .join('') +
    '</datalist>' +
    '<input type="hidden" id="o_cust"><button class="btn sm" onclick="quickCust()">+ ' +
    t('newcust') +
    '</button></div></div>' +
    '<div><label>New customer type (if not found above)</label><select id="o_newctype"><option value="">—</option><option>Propagates own seeds</option><option>Buys ready seedlings</option><option>Other</option></select></div>' +
    '<div><label>' +
    t('tended') +
    ' (' +
    t('employee') +
    ')</label><select id="o_emp"><option value="">—</option><option value="loise">Loise (Owner)</option>' +
    DB.emp
      .filter(function (e) {
        return e.status === 'Active';
      })
      .map(function (e) {
        return '<option value="' + e.id + '">' + esc(e.name) + '</option>';
      })
      .join('') +
    '</select></div>' +
    '<div><label>' +
    t('communicated') +
    '</label><select id="o_comm"><option>' +
    t('call') +
    '</option><option>' +
    t('whatsapp') +
    '</option><option>' +
    t('sms') +
    '</option><option>' +
    t('visit') +
    '</option></select></div></div>' +
    '<div class="frow"><div><label>' +
    t('method') +
    '</label><select id="o_pay"><option>' +
    t('cash') +
    '</option><option>M-Pesa</option><option>' +
    t('bank') +
    '</option><option>' +
    t('credit') +
    '</option></select></div>' +
    '<div><label>' +
    t('contact') +
    '</label><input id="o_phone" placeholder="' +
    t('autofill') +
    '"></div>' +
    '<div><label>Propagation</label><input id="o_prop" placeholder="' +
    t('autofill') +
    '"></div></div>' +
    '<div class="frow"><div><label>Handover</label><select id="o_hand" onchange="oHandToggle()"><option value="now">Taken now (pick-up)</option><option value="later">Deliver later</option></select></div><div id="o_dwrap" style="display:none"><label>Delivery date</label><input type="date" id="o_ddate" value="' +
    today() +
    '"></div><div id="o_awrap" style="display:none"><label>Delivery address</label><input id="o_daddr" list="o_daddr_dl" placeholder="Where to?">' +
    afDatalist('loc', 'o_daddr_dl') +
    '</div></div>' +
    '<div class="tw"><table><tr><th style="width:32%">Item</th><th>' +
    t('price') +
    '</th><th>Stock</th><th>' +
    t('qty') +
    '</th><th>' +
    t('amount') +
    '</th><th></th></tr><tbody id="o_items"></tbody></table></div>' +
    '<div class="mt"><button class="btn gray sm" onclick="addItemRow()">+ Item</button></div>' +
    '<div class="frow mt"><div><label>' +
    t('subtotal') +
    '</label><input id="o_sub" readonly value="0"></div><div><label>' +
    t('discount') +
    ' (KES)</label><input type="number" id="o_disc" value="0" oninput="oCalc()"></div><div><label>&nbsp;</label><label style="display:flex;align-items:center;gap:6px;font-weight:600;color:var(--ink)"><input type="checkbox" id="o_vat" style="width:auto" onchange="oCalc()"> ' +
    t('vat') +
    '</label></div><div><label>' +
    t('total') +
    '</label><input id="o_total" readonly value="0"></div><div><label>' +
    t('paid') +
    '</label><input type="number" id="o_paid" value="0" oninput="oBal()"></div><div><label>' +
    t('balance') +
    '</label><input id="o_bal" readonly value="0"></div></div>' +
    '<div id="priceHint" class="mt" style="font-size:12px;color:var(--purple)"></div>' +
    '<label>' +
    t('notes') +
    '</label><input id="o_notes"><div class="mt rowflex"><button class="btn" onclick="saveOrder()"><svg class="ic"><use href="#i-save"/></svg> ' +
    t('save') +
    ' & <svg class="ic"><use href="#i-printer"/></svg> ' +
    t('print') +
    '</button><label style="display:flex;align-items:center;gap:6px;margin:0;font-weight:600;color:var(--muted)"><input type="checkbox" id="o_autoprint" checked style="width:auto"> ' +
    t('print') +
    ' receipt after save</label></div></div>';
  document.getElementById('salesBody').innerHTML = h;
  addItemRow();
}
function quickCust() {
  openModal(
    '<h3>+ ' +
      t('newcust') +
      '</h3><div class="frow"><div><label>' +
      t('name') +
      '</label><input id="qc_name"></div><div><label>' +
      t('tel') +
      '</label><input id="qc_phone"></div><div><label>Propagation</label><input id="qc_prop"></div></div>' +
      '<div class="frow"><div><label><svg class="ic"><use href="#i-pin"/></svg> Location</label><input id="qc_loc" list="qc_loc_dl">' +
      afDatalist('loc', 'qc_loc_dl') +
      '</div><div><label>Customer Type</label><select id="qc_ctype"><option value="">—</option><option>Propagates own seeds</option><option>Buys ready seedlings</option><option>Other</option></select></div></div>' +
      '<div class="mt"><button class="btn" onclick="saveQuickCust()"><svg class="ic"><use href="#i-save"/></svg> ' +
      t('save') +
      '</button> <button class="btn gray" onclick="closeModal()">' +
      t('close') +
      '</button></div>'
  );
}
function saveQuickCust() {
  var n = document.getElementById('qc_name').value.trim();
  if (!n) {
    alert(t('name') + '?');
    return;
  }
  var loc = document.getElementById('qc_loc').value;
  afTrack('loc', loc);
  var nc = {
    id: uid(),
    name: n,
    phone: document.getElementById('qc_phone').value,
    email: '',
    loc: loc,
    prop: document.getElementById('qc_prop').value,
    crop: '',
    qty: '',
    price: '',
    notes: '',
    custType: document.getElementById('qc_ctype').value
  };
  DB.cust.push(nc);
  logAudit('Added customer ' + n + ' (quick add)');
  saveDB();
  closeModal();
  setCustField(nc.id, nc.name);
  custAuto();
}
function custAuto() {
  var c = DB.cust.find(function (x) {
    return x.id === document.getElementById('o_cust').value;
  });
  if (c) {
    document.getElementById('o_phone').value = c.phone || '';
    document.getElementById('o_prop').value = c.prop || '';
    priceHint();
  }
}
function setCustField(id, name) {
  var q = document.getElementById('o_custq'),
    h = document.getElementById('o_cust');
  if (q) q.value = name;
  if (h) h.value = id;
}
function custTypeAhead() {
  var v = (document.getElementById('o_custq').value || '').trim().toLowerCase();
  var m = DB.cust.find(function (c) {
    return c.name.toLowerCase() === v;
  });
  document.getElementById('o_cust').value = m ? m.id : '';
  if (m) custAuto();
}
function priceHint(sel) {
  var cid = document.getElementById('o_cust').value;
  sel = sel || document.querySelector('.oi_item');
  if (!sel || !sel.value) return;
  var nm = null,
    unit = 'seedling',
    v = sel.value;
  if (v.indexOf('c:') === 0) {
    var c = DB.cat.find(function (x) {
      return x.id === v.slice(2);
    });
    if (c) nm = c.name;
  } else {
    var it = DB.inv.find(function (x) {
      return x.id === v;
    });
    if (it) {
      nm = it.name;
      unit = it.unit;
    }
  }
  if (!nm) return;
  var lp = cid ? lastPrice(cid, nm) : null;
  document.getElementById('priceHint').textContent = lp ? t('pricehist') + ': ' + fmt(lp) + ' / ' + unit : '';
}
function addItemRow() {
  var tb = document.getElementById('o_items');
  var tr = document.createElement('tr');
  tr.innerHTML =
    '<td><select class="oi_item" onchange="itemAuto(this)"><option value="">— item —</option>' +
    catOptions() +
    '<optgroup label="Inventory (stock)">' +
    DB.inv
      .map(function (i) {
        return '<option value="' + i.id + '">' + esc(i.name) + '</option>';
      })
      .join('') +
    '</optgroup></select></td>' +
    '<td><input type="number" class="oi_price" oninput="oCalc()"></td><td class="oi_stock" style="color:var(--muted)">—</td>' +
    '<td><input type="number" class="oi_qty" value="1" oninput="oCalc()"></td><td class="oi_amt">0</td><td><button class="btn red sm" onclick="this.parentNode.parentNode.remove();oCalc()">x</button></td>';
  tb.appendChild(tr);
}
function itemAuto(sel) {
  var tr = sel.parentNode.parentNode,
    v = sel.value;
  if (v.indexOf('c:') === 0) {
    var c = DB.cat.find(function (x) {
      return x.id === v.slice(2);
    });
    if (c) {
      tr.querySelector('.oi_price').value = c.price;
      tr.querySelector('.oi_stock').textContent = 'catalogue';
    }
  } else {
    var it = DB.inv.find(function (x) {
      return x.id === v;
    });
    if (it) {
      tr.querySelector('.oi_price').value = it.price;
      tr.querySelector('.oi_stock').textContent = it.qty + ' ' + it.unit;
    }
  }
  oCalc();
  priceHint(sel);
}
function oCalc() {
  var sub = 0;
  document.querySelectorAll('#o_items tr').forEach(function (tr) {
    var a = num(tr.querySelector('.oi_price').value) * num(tr.querySelector('.oi_qty').value);
    tr.querySelector('.oi_amt').textContent = a.toLocaleString();
    sub += a;
  });
  document.getElementById('o_sub').value = sub;
  var disc = num(document.getElementById('o_disc').value);
  var vat = document.getElementById('o_vat').checked ? Math.round((sub - disc) * 0.16 * 100) / 100 : 0;
  var tot = sub - disc + vat;
  document.getElementById('o_total').value = tot;
  oBal();
}
function oBal() {
  document.getElementById('o_bal').value =
    num(document.getElementById('o_total').value) - num(document.getElementById('o_paid').value);
}
function saveOrder() {
  var custId = document.getElementById('o_cust').value,
    items = [],
    ok = true;
  document.querySelectorAll('#o_items tr').forEach(function (tr) {
    var id = tr.querySelector('.oi_item').value;
    if (!id) return;
    var q = num(tr.querySelector('.oi_qty').value);
    if (id.indexOf('c:') === 0) {
      var ci = DB.cat.find(function (x) {
        return x.id === id.slice(2);
      });
      if (!ci) return;
      items.push({
        itemId: null,
        catId: ci.id,
        name: catLabel(ci),
        price: num(tr.querySelector('.oi_price').value),
        qty: q
      });
      return;
    }
    var it = DB.inv.find(function (x) {
      return x.id === id;
    });
    if (q > num(it.qty)) {
      alert('Not enough stock: ' + it.name + ' (have ' + it.qty + ')');
      ok = false;
      return;
    }
    items.push({ itemId: id, name: it.name, price: num(tr.querySelector('.oi_price').value), qty: q });
  });
  if (!items.length) {
    alert('Add at least one item');
    return;
  }
  if (!ok) return;
  if (!custId) {
    var cn = (document.getElementById('o_custq').value || '').trim() || 'Walk-in Customer';
    var nc = {
      id: uid(),
      name: cn,
      phone: document.getElementById('o_phone').value,
      email: '',
      loc: '',
      prop: document.getElementById('o_prop').value,
      crop: '',
      qty: '',
      price: '',
      notes: '',
      custType: document.getElementById('o_newctype').value
    };
    DB.cust.push(nc);
    custId = nc.id;
    logAudit('Added customer ' + cn + ' (via sale)');
  }
  var sub = num(document.getElementById('o_sub').value),
    disc = num(document.getElementById('o_disc').value);
  var vat = document.getElementById('o_vat').checked ? Math.round((sub - disc) * 0.16 * 100) / 100 : 0;
  var total = sub - disc + vat,
    paid = num(document.getElementById('o_paid').value);
  var pay = document.getElementById('o_pay').value;
  if (paid < total) pay = t('credit');
  var mcode = null;
  if (paid > 0) {
    if (pay === 'M-Pesa') {
      mcode = mkMpesaCode();
      alert(mpesaMsg(paid, custName(custId), mcode));
    }
    DB.income.push({
      id: uid(),
      date: document.getElementById('o_date').value,
      src: t('sales') + ' — ' + custName(custId),
      amount: paid,
      method: pay,
      mpesa: mcode
    });
  }
  var o = {
    id: uid(),
    no: nextNo('RCP'),
    date: document.getElementById('o_date').value,
    custId: custId,
    empId: document.getElementById('o_emp').value,
    comm: document.getElementById('o_comm').value,
    items: items,
    sub: sub,
    disc: disc,
    vat: vat,
    total: total,
    paid: paid,
    balance: total - paid,
    pay: pay,
    mpesa: mcode,
    notes: document.getElementById('o_notes').value
  };
  items.forEach(function (x) {
    if (x.itemId) {
      var iv = DB.inv.find(function (i) {
        return i.id === x.itemId;
      });
      if (iv) iv.qty -= x.qty;
    }
    logPrice(custId, x.name, x.price);
  });
  var c = DB.cust.find(function (x) {
    return x.id === custId;
  });
  c.lastBought = items
    .map(function (x) {
      return x.name + ' x' + x.qty;
    })
    .join(', ');
  c.lastDate = o.date;
  c.lastMethod = pay;
  if (document.getElementById('o_hand') && document.getElementById('o_hand').value === 'later') {
    o.deliver = {
      date: document.getElementById('o_ddate').value || today(),
      addr: document.getElementById('o_daddr').value,
      done: false
    };
    afTrack('loc', o.deliver.addr);
  }
  DB.orders.push(o);
  logAudit('Sale ' + o.no + ' — ' + custName(custId) + ' — ' + fmt(total));
  saveDB();
  alert('<svg class="ic"><use href="#i-check"/></svg> ' + t('saved') + ' — ' + o.no);
  var autop = document.getElementById('o_autoprint').checked;
  TAB.sales = 1;
  rSales();
  if (autop)
    setTimeout(function () {
      printDoc(o.id, 'Receipt');
    }, 200);
}
function orderBook() {
  var h =
    '<div class="card">' +
    hint('sales') +
    '<div class="toolbar"><button class="btn gray sm" onclick="shiftMonth(\'ob_m\',-1,applyOrderFilters)">‹</button><input type="month" id="ob_m" value="' +
    today().slice(0, 7) +
    '" onchange="applyOrderFilters()"><button class="btn gray sm" onclick="shiftMonth(\'ob_m\',1,applyOrderFilters)">›</button>' +
    '<select id="ob_emp" onchange="applyOrderFilters()"><option value="">' +
    t('all') +
    ' — ' +
    t('employee') +
    '</option>' +
    DB.emp
      .map(function (e) {
        return '<option value="' + e.id + '">' + esc(e.name) + '</option>';
      })
      .join('') +
    '</select>' +
    '<input id="ob_q" placeholder="' +
    t('search') +
    ' — ' +
    t('customer') +
    ', No, phone" oninput="applyOrderFilters()" style="min-width:220px">' +
    '<label style="display:flex;align-items:center;gap:5px;margin:0;font-weight:600;color:var(--muted)"><input type="checkbox" id="ob_fu" style="width:auto" onchange="applyOrderFilters()"> <svg class="ic"><use href="#i-flag"/></svg> ' +
    t('needfu') +
    '</label>' +
    "<button class=\"btn blue sm\" onclick=\"exportRows('OrderBook',filteredOrders().map(function(o){return{No:o.no,Date:o.date,Customer:custName(o.custId),Phone:(DB.cust.find(function(c){return c.id===o.custId})||{}).phone||'',TendedBy:empName(o.empId),Communication:o.comm,Items:o.items.map(function(x){return x.name+' x'+x.qty}).join('; '),Subtotal:o.sub,Discount:o.disc,VAT:o.vat,Total:o.total,Paid:o.paid,Balance:o.balance,Method:o.pay}}))\">" +
    t('export') +
    '</button>' +
    '<button class="btn sm" onclick="printOrderBook()"><svg class="ic"><use href="#i-printer"/></svg> ' +
    t('print') +
    '</button></div><div id="ob_tbl"></div></div>';
  document.getElementById('salesBody').innerHTML = h;
  if (GS.obq) {
    document.getElementById('ob_q').value = GS.obq;
    GS.obq = '';
  }
  applyOrderFilters();
}
function filteredOrders() {
  var m = document.getElementById('ob_m').value,
    q = (document.getElementById('ob_q').value || '').toLowerCase(),
    e = document.getElementById('ob_emp').value,
    fu = document.getElementById('ob_fu').checked;
  return DB.orders.filter(function (o) {
    if (monthOf(o.date) !== m) return false;
    if (e && o.empId !== e) return false;
    if (fu && !o.follow) return false;
    if (q) {
      var c = DB.cust.find(function (x) {
        return x.id === o.custId;
      });
      if (!(
        (o.no || '').toLowerCase().indexOf(q) >= 0 ||
        (c && c.name.toLowerCase().indexOf(q) >= 0) ||
        (c && (c.phone || '').indexOf(q) >= 0)
      ))
        return false;
    }
    return true;
  });
}
function applyOrderFilters() {
  var list = filteredOrders();
  var rows = list
    .slice()
    .reverse()
    .map(function (o) {
      var c = DB.cust.find(function (x) {
        return x.id === o.custId;
      });
      return [
        o.no + '<br><small>' + o.date + '</small>',
        '<b>' + esc(custName(o.custId)) + '</b><br><small>' + esc((c && c.phone) || '') + '</small>',
        esc(empName(o.empId)),
        esc(o.comm),
        o.items
          .map(function (x) {
            return esc(x.name) + ' ×' + x.qty;
          })
          .join(', ') + delivTag(o),
        fmt(o.total),
        payBadge(o),
        '<button class="btn sm" onclick="printDoc(\'' +
          o.id +
          '\',\'Receipt\')"><svg class="ic"><use href="#i-printer"/></svg> ' +
          t('receipt') +
          '</button> ' +
          (num(o.balance) > 0
            ? '<button class="btn amber sm" onclick="payModal(\'' +
              o.id +
              '\')"><svg class="ic"><use href="#i-cash"/></svg></button> '
            : '') +
          '<button class="btn gray sm" onclick="printDoc(\'' +
          o.id +
          "','Invoice')\">Invoice</button> <button class=\"btn " +
          (o.follow ? 'amber' : 'gray') +
          ' sm" title="' +
          t('follow') +
          '" onclick="flagFollow(\'' +
          o.id +
          '\')"><svg class="ic"><use href="#i-flag"/></svg></button> <button class="btn red sm" onclick="delOrder(\'' +
          o.id +
          '\')">x</button>'
      ];
    });
  var tot = list.reduce(function (a, o) {
    return a + num(o.total);
  }, 0);
  document.getElementById('ob_tbl').innerHTML =
    tbl(
      [
        'No / ' + t('date'),
        t('customer') + ' / ' + t('contact'),
        t('tended'),
        t('communicated'),
        'Items',
        t('total'),
        t('status'),
        ''
      ],
      rows
    ) +
    '<p class="mt"><b>' +
    t('total') +
    ': ' +
    fmt(tot) +
    '</b> (' +
    list.length +
    ' orders)</p>';
}
function flagFollow(id) {
  var o = DB.orders.find(function (x) {
    return x.id === id;
  });
  if (o.follow) {
    if (!confirm('Remove follow-up flag?')) return;
    delete o.follow;
  } else {
    var n = prompt(t('follow') + ' — ' + t('notes') + ':', '');
    if (n === null) return;
    o.follow = { date: today(), by: session.u, note: n };
  }
  saveDB();
  applyOrderFilters();
}
function payModal(id) {
  var o = DB.orders.find(function (x) {
    return x.id === id;
  });
  if (!o) return;
  openModal(
    '<h3><svg class="ic"><use href="#i-cash"/></svg> ' +
      t('receive') +
      ' — ' +
      o.no +
      '</h3><p style="font-size:13px;margin-bottom:12px">' +
      esc(custName(o.custId)) +
      ' &nbsp;·&nbsp; ' +
      t('balance') +
      ': <b class="low">' +
      fmt(o.balance) +
      '</b>' +
      (o.follow
        ? '<br><small><svg class="ic"><use href="#i-flag"/></svg> ' +
          t('follow') +
          ': ' +
          esc(o.follow.note) +
          '</small>'
        : '') +
      '</p><div class="frow">' +
      '<div><label>' +
      t('amount') +
      '</label><input type="number" id="pay_amt" value="' +
      o.balance +
      '"></div>' +
      '<div><label>' +
      t('method') +
      '</label><select id="pay_m"><option>' +
      t('cash') +
      '</option><option>M-Pesa</option><option>' +
      t('bank') +
      '</option></select></div>' +
      '<div><label>' +
      t('date') +
      '</label><input type="date" id="pay_d" value="' +
      today() +
      '"></div></div>' +
      '<div class="mt"><button class="btn" onclick="savePay(\'' +
      id +
      '\')"><svg class="ic"><use href="#i-save"/></svg> ' +
      t('save') +
      '</button> <button class="btn gray" onclick="closeModal()">' +
      t('close') +
      '</button></div>'
  );
}
function savePay(id) {
  var o = DB.orders.find(function (x) {
    return x.id === id;
  });
  var amt = num(document.getElementById('pay_amt').value);
  if (amt <= 0) {
    alert(t('amount') + '?');
    return;
  }
  if (amt > num(o.balance) && !confirm('Amount exceeds balance (' + fmt(o.balance) + '). Continue?')) return;
  var m = document.getElementById('pay_m').value,
    d = document.getElementById('pay_d').value;
  o.paid = num(o.paid) + amt;
  o.balance = num(o.balance) - amt;
  o.payments = o.payments || [];
  o.payments.push({ date: d, amount: amt, method: m });
  var mc = null;
  if (m === 'M-Pesa') {
    mc = mkMpesaCode();
    alert(mpesaMsg(amt, custName(o.custId), mc));
  }
  DB.income.push({
    id: uid(),
    date: d,
    src: t('receive') + ' ' + o.no + ' — ' + custName(o.custId),
    amount: amt,
    method: m,
    mpesa: mc
  });
  logAudit('Payment received ' + o.no + ' — ' + fmt(amt) + ' (' + m + ')');
  saveDB();
  closeModal();
  if (CUR === 'dash') rDash();
  else if (CUR === 'sales' && TAB.sales === 1) orderBook();
}
function printOrderBook() {
  var list = filteredOrders();
  var rows = list.map(function (o) {
    return [
      o.no,
      o.date,
      custName(o.custId),
      empName(o.empId),
      o.comm,
      o.items
        .map(function (x) {
          return x.name + ' x' + x.qty;
        })
        .join(', '),
      fmt(o.total),
      o.pay
    ];
  });
  var tot = list.reduce(function (a, o) {
    return a + num(o.total);
  }, 0);
  printHTML(
    '<h2>' +
      t('sales') +
      ' — ' +
      document.getElementById('ob_m').value +
      '</h2>' +
      tbl(
        ['No', t('date'), t('customer'), t('tended'), t('communicated'), 'Items', t('total'), t('method')],
        rows
      ) +
      '<h3 class="right">' +
      t('total') +
      ': ' +
      fmt(tot) +
      '</h3>'
  );
}
function delOrder(id) {
  if (!confirm(t('delete') + '?')) return;
  var o = DB.orders.find(function (x) {
    return x.id === id;
  });
  DB.orders = DB.orders.filter(function (o) {
    return o.id !== id;
  });
  logAudit('Deleted order ' + (o ? o.no : id));
  saveDB();
  applyOrderFilters();
}
