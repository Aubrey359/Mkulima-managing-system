/* ================= REPORTS ================= */
function rRep() {
  var h =
    hint('rep') +
    '<div class="card"><div class="rowflex">' +
    '<button class="btn" onclick="genRep(\'sales\')">' +
    t('sales') +
    '</button><button class="btn" onclick="genRep(\'profit\')">P&L</button>' +
    '<button class="btn" onclick="genRep(\'z\')"><svg class="ic"><use href="#i-receipt"/></svg> ' +
    t('zreport') +
    '</button>' +
    '<button class="btn" onclick="genRep(\'inv\')">' +
    t('inv') +
    '</button><button class="btn" onclick="genRep(\'exp\')">' +
    t('expenses') +
    '</button>' +
    '<button class="btn" onclick="genRep(\'att\')">' +
    t('att') +
    '</button><button class="btn" onclick="genRep(\'sow\')">' +
    t('sow') +
    '</button>' +
    '<button class="btn" onclick="genRep(\'cust\')">' +
    t('customer') +
    '</button><button class="btn" onclick="genRep(\'book\')">' +
    t('book') +
    '</button>' +
    '<button class="btn purple" onclick="genRep(\'price\')">' +
    t('pricehist') +
    '</button></div>' +
    '<div class="frow mt" style="max-width:420px"><div><label>Month</label><div class="rowflex"><button class="btn gray sm" onclick="shiftMonth(\'r_m\',-1)">‹</button><input type="month" id="r_m" value="' +
    today().slice(0, 7) +
    '"><button class="btn gray sm" onclick="shiftMonth(\'r_m\',1)">›</button></div></div><div><label>' +
    t('date') +
    ' (' +
    t('zreport') +
    ')</label><input type="date" id="r_d" value="' +
    today() +
    '"></div></div></div>';
  document.getElementById('content').innerHTML = h;
}
function genRep(type) {
  var m = document.getElementById('r_m').value,
    title = '',
    body = '';
  if (type === 'sales') {
    title = t('sales') + ' — ' + m;
    var rows = DB.orders
      .filter(function (o) {
        return monthOf(o.date) === m;
      })
      .map(function (o) {
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
    var tot = DB.orders
      .filter(function (o) {
        return monthOf(o.date) === m;
      })
      .reduce(function (a, o) {
        return a + num(o.total);
      }, 0);
    body =
      tbl(
        ['No', t('date'), t('customer'), t('tended'), t('communicated'), 'Items', t('total'), t('method')],
        rows
      ) +
      '<h3 class="right">' +
      t('total') +
      ': ' +
      fmt(tot) +
      '</h3>';
  } else if (type === 'profit') {
    title = 'P&L — ' + m;
    var inc = DB.income
      .filter(function (i) {
        return monthOf(i.date) === m;
      })
      .reduce(function (a, i) {
        return a + num(i.amount);
      }, 0);
    var exp = DB.exp
      .filter(function (e) {
        return monthOf(e.date) === m;
      })
      .reduce(function (a, e) {
        return a + num(e.amount);
      }, 0);
    body = tbl(
      ['', 'Amount'],
      [
        ['Income', fmt(inc)],
        [t('expenses'), fmt(exp)],
        ['<b>Net</b>', '<b>' + fmt(inc - exp) + '</b>']
      ]
    );
  } else if (type === 'z') {
    var d = document.getElementById('r_d').value;
    title = t('zreport') + ' — ' + d;
    var os = DB.orders.filter(function (o) {
      return o.date === d;
    });
    var byM = {};
    os.forEach(function (o) {
      byM[o.pay] = (byM[o.pay] || 0) + num(o.paid);
    });
    var gross = os.reduce(function (a, o) {
      return a + num(o.total);
    }, 0);
    var received = os.reduce(function (a, o) {
      return a + num(o.paid);
    }, 0);
    var creditIssued = os.reduce(function (a, o) {
      return a + num(o.balance);
    }, 0);
    var expD = DB.exp
      .filter(function (e) {
        return e.date === d;
      })
      .reduce(function (a, e) {
        return a + num(e.amount);
      }, 0);
    var incD = DB.income
      .filter(function (i) {
        return i.date === d;
      })
      .reduce(function (a, i) {
        return a + num(i.amount);
      }, 0);
    var mrows = Object.keys(byM).map(function (k) {
      return [k, fmt(byM[k])];
    });
    body =
      tbl(
        ['', 'Amount'],
        [
          [t('sales') + ' (' + os.length + ')', fmt(gross)],
          ['— ' + t('cash'), fmt(byM[t('cash')] || 0)],
          ['— M-Pesa', fmt(byM['M-Pesa'] || 0)],
          ['— ' + t('bank'), fmt(byM[t('bank')] || 0)],
          ['— ' + t('credit') + ' ' + t('receive') + 'd', fmt(byM[t('credit')] || 0)],
          ['<b>' + t('receive') + 'd ' + t('total') + '</b>', '<b>' + fmt(received) + '</b>'],
          [t('credit') + ' (' + (LANG === 'sw' ? 'deni mpya' : 'issued') + ')', fmt(creditIssued)],
          [t('expenses'), fmt(expD)],
          ['<b>Net (received - expenses)</b>', '<b>' + fmt(received - expD) + '</b>']
        ]
      ) +
      '<p style="font-size:11px;margin-top:6px">' +
      t('acc') +
      ' entries: ' +
      fmt(incD) +
      ' · ' +
      t('expenses') +
      ' entries: ' +
      fmt(expD) +
      '</p>';
  } else if (type === 'inv') {
    title = t('inv') + ' — ' + today();
    var val = DB.inv.reduce(function (a, i) {
      return a + num(i.qty) * num(i.price);
    }, 0);
    body =
      tbl(
        ['Item', 'Cat', 'Qty', 'Unit', t('price'), 'Value'],
        DB.inv.map(function (i) {
          return [esc(i.name), i.cat, i.qty, i.unit, fmt(i.price), fmt(i.qty * i.price)];
        })
      ) +
      '<h3 class="right">' +
      fmt(val) +
      '</h3>';
  } else if (type === 'exp') {
    title = t('expenses') + ' — ' + m;
    var rows = DB.exp
      .filter(function (e) {
        return monthOf(e.date) === m;
      })
      .map(function (e) {
        return [e.date, e.cat, esc(e.desc), fmt(e.amount)];
      });
    var tot = DB.exp
      .filter(function (e) {
        return monthOf(e.date) === m;
      })
      .reduce(function (a, e) {
        return a + num(e.amount);
      }, 0);
    body =
      tbl([t('date'), 'Category', t('notes'), t('amount')], rows) + '<h3 class="right">' + fmt(tot) + '</h3>';
  } else if (type === 'att') {
    title = t('att') + ' — ' + m;
    body = tbl(
      [t('date'), t('employee'), t('status'), 'In', 'Out'],
      DB.att
        .filter(function (a) {
          return monthOf(a.date) === m;
        })
        .map(function (a) {
          return [a.date, empName(a.empId), t(a.status.toLowerCase()), a.in, a.out];
        })
    );
  } else if (type === 'sow') {
    title = t('sow') + ' — ' + m;
    body = tbl(
      ['Planted', t('variety'), t('qty'), 'Expected', t('status')],
      DB.sowing
        .filter(function (s) {
          return monthOf(s.date) === m;
        })
        .map(function (s) {
          return [s.date, esc(s.variety), s.qty + ' ' + s.unit, s.ready || '—', s.status];
        })
    );
  } else if (type === 'cust') {
    title = t('customer') + ' — ' + today();
    body = tbl(
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
    );
  } else if (type === 'book') {
    title = t('book') + ' — ' + m;
    body = tbl(
      [t('date'), t('customer'), t('variety'), t('qty'), 'Deposit', t('balance'), t('status')],
      DB.bookings
        .filter(function (b) {
          return monthOf(b.date) === m;
        })
        .map(function (b) {
          return [
            b.date,
            esc(b.cname),
            esc(b.variety),
            b.qty,
            fmt(b.deposit),
            fmt(b.qty * b.price - b.deposit),
            b.status
          ];
        })
    );
  } else if (type === 'price') {
    title = t('pricehist') + ' — ' + m;
    body = tbl(
      [t('date'), t('customer'), 'Item', t('price')],
      DB.pricehist
        .filter(function (p) {
          return monthOf(p.date) === m;
        })
        .slice()
        .reverse()
        .map(function (p) {
          return [p.date, esc(custName(p.custId)), esc(p.item), fmt(p.price)];
        })
    );
  }
  printHTML('<h2>' + title + '</h2>' + body);
}
