/* ================= MANURE ================= */
function isManure(n) {
  return /manure/i.test(n || '');
}
function manureLines(from, to) {
  var L = [];
  DB.orders.forEach(function (o) {
    if (o.date < from || o.date > to) return;
    var ratio = num(o.total) > 0 ? Math.min(1, num(o.paid) / num(o.total)) : 1;
    (o.items || []).forEach(function (x) {
      if (isManure(x.name)) {
        var amt = num(x.qty) * num(x.price);
        L.push({
          date: o.date,
          no: o.no,
          cust: custName(o.custId),
          qty: num(x.qty),
          price: num(x.price),
          amt: amt,
          coll: amt * ratio,
          pay: o.pay || '—'
        });
      }
    });
  });
  return L.sort(function (a, b) {
    return a.date < b.date ? 1 : -1;
  });
}
var MAN = { mode: 'day', day: '', month: '' };
function manRange() {
  return MAN.mode === 'day' ? [MAN.day, MAN.day] : [MAN.month + '-01', MAN.month + '-31'];
}
function rMan() {
  MAN.day = MAN.day || today();
  MAN.month = MAN.month || today().slice(0, 7);
  var c = DB.cat.find(function (x) {
    return isManure(x.name);
  });
  var h =
    hint('man') +
    '<div class="card"><div class="toolbar">' +
    '<button class="btn ' +
    (MAN.mode === 'day' ? '' : 'gray') +
    ' sm" onclick="manMode(\'day\')"><svg class="ic"><use href="#i-calendar"/></svg> Day</button><button class="btn ' +
    (MAN.mode === 'month' ? '' : 'gray') +
    ' sm" onclick="manMode(\'month\')"><svg class="ic"><use href="#i-calendar"/></svg> Month</button>' +
    '<button class="btn gray sm" onclick="manShift(-1)">‹</button>' +
    (MAN.mode === 'day'
      ? '<input type="date" id="man_d" value="' +
        MAN.day +
        '" onchange="MAN.day=this.value||today();manRender()">'
      : '<input type="month" id="man_m" value="' +
        MAN.month +
        '" onchange="MAN.month=this.value||today().slice(0,7);manRender()">') +
    '<button class="btn gray sm" onclick="manShift(1)">›</button><button class="btn amber sm" onclick="manToday()">Today</button>' +
    '<button class="btn sm" onclick="manPrint()"><svg class="ic"><use href="#i-printer"/></svg> ' +
    t('print') +
    '</button><button class="btn blue sm" onclick="manSell()">+ Sell manure' +
    (c ? ' (KES ' + c.price + '/sack)' : '') +
    '</button></div><div id="man_out"></div></div>';
  document.getElementById('content').innerHTML = h;
  manRender();
}
function manMode(m) {
  MAN.mode = m;
  rMan();
}
function manToday() {
  MAN.day = today();
  MAN.month = today().slice(0, 7);
  rMan();
}
function manShift(n) {
  if (MAN.mode === 'day') {
    var d = new Date(MAN.day + 'T00:00:00');
    d.setDate(d.getDate() + n);
    MAN.day = d.toISOString().slice(0, 10);
  } else {
    var p = MAN.month.split('-'),
      d2 = new Date(Number(p[0]), Number(p[1]) - 1 + n, 1);
    MAN.month = d2.getFullYear() + '-' + String(d2.getMonth() + 1).padStart(2, '0');
  }
  rMan();
}
function manSell() {
  go('sales');
  setTimeout(function () {
    var c = DB.cat.find(function (x) {
        return isManure(x.name);
      }),
      s = document.querySelector('.oi_item');
    if (c && s) {
      s.value = 'c:' + c.id;
      itemAuto(s);
    }
  }, 60);
}
function manStats() {
  var r = manRange(),
    L = manureLines(r[0], r[1]),
    S = { L: L, sacks: 0, amt: 0, coll: 0, pay: {}, cust: {}, day: {} };
  L.forEach(function (x) {
    S.sacks += x.qty;
    S.amt += x.amt;
    S.coll += x.coll;
    var p = String(x.pay);
    (S.pay[p] = S.pay[p] || { q: 0, a: 0 }).q += x.qty;
    S.pay[p].a += x.amt;
    (S.cust[x.cust] = S.cust[x.cust] || { q: 0, a: 0 }).q += x.qty;
    S.cust[x.cust].a += x.amt;
    (S.day[x.date] = S.day[x.date] || { q: 0, a: 0 }).q += x.qty;
    S.day[x.date].a += x.amt;
  });
  return S;
}
function manRender() {
  var S = manStats(),
    label = MAN.mode === 'day' ? MAN.day : MAN.month;
  var el = document.getElementById('man_out');
  if (!S.L.length) {
    el.innerHTML =
      '<div class="empty" style="padding:26px 10px">No manure sales for ' +
      label +
      '.<br><small>Sell it from the Sales tab — the line "Goat Manure (per sack)" is in the catalogue.</small></div>';
    return;
  }
  var maxQ = Math.max.apply(
    null,
    Object.keys(S.day).map(function (k) {
      return S.day[k].q;
    })
  );
  var h =
    '<div class="grid c4"><div class="stat"><span>Sacks sold</span><b>' +
    S.sacks.toLocaleString() +
    '</b></div><div class="stat"><span>Sales value</span><b>' +
    fmt(S.amt) +
    '</b></div><div class="stat"><span>Money collected</span><b>' +
    fmt(S.coll) +
    '</b></div><div class="stat"><span>Owed (credit)</span><b>' +
    fmt(S.amt - S.coll) +
    '</b></div></div>' +
    '<p style="font-size:12.5px;color:var(--muted);margin:6px 2px">' +
    label +
    ' · ' +
    S.L.length +
    ' sale line' +
    (S.L.length === 1 ? '' : 's') +
    ' · average ' +
    fmt(S.amt / S.sacks) +
    ' per sack</p>' +
    '<div class="grid c2"><div class="card"><h3><svg class="ic"><use href="#i-card"/></svg> By payment method</h3>' +
    tbl(
      ['Method', 'Sacks', 'Value'],
      Object.keys(S.pay)
        .sort(function (a, b) {
          return S.pay[b].a - S.pay[a].a;
        })
        .map(function (k) {
          return [esc(k), S.pay[k].q, fmt(S.pay[k].a)];
        })
    ) +
    '</div>' +
    '<div class="card"><h3><svg class="ic"><use href="#i-users"/></svg> By customer</h3>' +
    tbl(
      ['Customer', 'Sacks', 'Value'],
      Object.keys(S.cust)
        .sort(function (a, b) {
          return S.cust[b].q - S.cust[a].q;
        })
        .map(function (k) {
          return [esc(k), S.cust[k].q, fmt(S.cust[k].a)];
        })
    ) +
    '</div></div>' +
    (MAN.mode === 'month'
      ? '<div class="card"><h3><svg class="ic"><use href="#i-calendar"/></svg> Day by day</h3>' +
        tbl(
          ['Date', 'Sacks', 'Value', ''],
          Object.keys(S.day)
            .sort()
            .map(function (k) {
              return [
                k,
                S.day[k].q,
                fmt(S.day[k].a),
                '<div style="background:var(--green3);height:12px;border-radius:6px;width:' +
                  Math.max(4, Math.round((S.day[k].q / maxQ) * 100)) +
                  '%"></div>'
              ];
            })
        ) +
        '</div>'
      : '') +
    '<div class="card"><h3><svg class="ic"><use href="#i-receipt"/></svg> Sales</h3>' +
    tbl(
      ['Receipt', 'Date', 'Customer', 'Sacks', 'Price', 'Value', 'Method'],
      S.L.map(function (x) {
        return [esc(x.no), x.date, esc(x.cust), x.qty, fmt(x.price), fmt(x.amt), esc(x.pay)];
      })
    ) +
    '</div>';
  el.innerHTML = h;
}
function manPrint() {
  var S = manStats(),
    label = MAN.mode === 'day' ? MAN.day : MAN.month;
  printHTML(
    '<h2><svg class="ic"><use href="#i-sack"/></svg> Goat Manure Sales — ' +
      label +
      '</h2><table style="margin:8px 0"><tr><td style="background:#e8f5e9;padding:8px"><b>Sacks sold</b><br><span style="font-size:18px">' +
      S.sacks.toLocaleString() +
      '</span></td><td style="background:#e8f5e9;padding:8px"><b>Sales value</b><br><span style="font-size:18px">' +
      fmt(S.amt) +
      '</span></td><td style="background:#e8f5e9;padding:8px"><b>Collected</b><br><span style="font-size:18px">' +
      fmt(S.coll) +
      '</span></td><td style="background:#fde68a;padding:8px"><b>Owed</b><br><span style="font-size:18px">' +
      fmt(S.amt - S.coll) +
      '</span></td></tr></table>' +
      '<h3>By payment method</h3>' +
      tbl(
        ['Method', 'Sacks', 'Value'],
        Object.keys(S.pay).map(function (k) {
          return [esc(k), S.pay[k].q, fmt(S.pay[k].a)];
        })
      ) +
      '<h3 style="margin-top:10px">By customer</h3>' +
      tbl(
        ['Customer', 'Sacks', 'Value'],
        Object.keys(S.cust)
          .sort(function (a, b) {
            return S.cust[b].q - S.cust[a].q;
          })
          .map(function (k) {
            return [esc(k), S.cust[k].q, fmt(S.cust[k].a)];
          })
      ) +
      (MAN.mode === 'month'
        ? '<h3 style="margin-top:10px">Day by day</h3>' +
          tbl(
            ['Date', 'Sacks', 'Value'],
            Object.keys(S.day)
              .sort()
              .map(function (k) {
                return [k, S.day[k].q, fmt(S.day[k].a)];
              })
          )
        : '') +
      '<h3 style="margin-top:10px">All sales</h3>' +
      tbl(
        ['Receipt', 'Date', 'Customer', 'Sacks', 'Price', 'Value', 'Method'],
        S.L.map(function (x) {
          return [esc(x.no), x.date, esc(x.cust), x.qty, fmt(x.price), fmt(x.amt), esc(x.pay)];
        })
      )
  );
}

function reschedModal(kind, id) {
  var obj,
    label,
    dateField = 'ready',
    extra = '';
  if (kind === 'book') {
    obj = DB.bookings.find(function (x) {
      return x.id === id;
    });
    label = 'Booking — ' + esc(obj.cname) + ' — ' + esc(obj.variety);
    extra =
      '<div><label>Handover</label><select id="rs_type"><option' +
      (obj.type !== 'Delivery' ? ' selected' : '') +
      '>Pick-up</option><option' +
      (obj.type === 'Delivery' ? ' selected' : '') +
      '>Delivery</option></select></div><div><label>Address (if delivery)</label><input id="rs_addr" list="rs_addr_dl" value="' +
      esc(obj.addr || '') +
      '">' +
      afDatalist('loc', 'rs_addr_dl') +
      '</div>';
  } else if (kind === 'order') {
    obj = DB.orders.find(function (x) {
      return x.id === id;
    });
    label = 'Delivery — ' + esc(custName(obj.custId)) + ' — ' + obj.no;
    dateField = 'date';
    extra =
      '<div><label>Address</label><input id="rs_addr" list="rs_addr_dl" value="' +
      esc((obj.deliver || {}).addr || '') +
      '">' +
      afDatalist('loc', 'rs_addr_dl') +
      '</div>';
  } else {
    obj = (DB.prop || []).find(function (x) {
      return x.id === id;
    });
    label = 'Propagation — ' + esc(custName(obj.custId)) + ' — ' + esc(obj.variety);
  }
  var cur = kind === 'order' ? (obj.deliver || {}).date || today() : obj.ready || today();
  openModal(
    '<h3><svg class="ic"><use href="#i-calendar"/></svg> Reschedule</h3><p style="font-size:12.5px;color:var(--muted);margin-bottom:8px">' +
      label +
      '</p><div class="frow"><div><label>New ' +
      (kind === 'book' ? 'pick-up/delivery' : kind === 'order' ? 'delivery' : 'ready') +
      ' date</label><input type="date" id="rs_date" value="' +
      cur +
      '"></div>' +
      extra +
      '</div>' +
      '<div class="mt"><button class="btn" onclick="reschedSave(\'' +
      kind +
      "','" +
      id +
      '\')"><svg class="ic"><use href="#i-save"/></svg> Save new date</button> <button class="btn gray" onclick="closeModal()">' +
      t('close') +
      '</button></div>'
  );
}
function reschedSave(kind, id) {
  var nd = document.getElementById('rs_date').value;
  if (!nd) {
    alert(t('date') + '?');
    return;
  }
  if (kind === 'book') {
    var b = DB.bookings.find(function (x) {
      return x.id === id;
    });
    var oldD = b.ready;
    b.ready = nd;
    b.type = document.getElementById('rs_type').value;
    b.addr = document.getElementById('rs_addr').value;
    if (b.addr) afTrack('loc', b.addr);
    logAudit('Rescheduled booking ' + b.cname + ' — ' + b.variety + ' from ' + oldD + ' to ' + nd);
    saveDB();
    closeModal();
    rBookList();
    updateBell();
  } else if (kind === 'order') {
    var o = DB.orders.find(function (x) {
      return x.id === id;
    });
    var oldD = (o.deliver || {}).date;
    o.deliver = o.deliver || {};
    o.deliver.date = nd;
    o.deliver.addr = document.getElementById('rs_addr').value;
    if (o.deliver.addr) afTrack('loc', o.deliver.addr);
    logAudit('Rescheduled delivery ' + o.no + ' from ' + (oldD || '—') + ' to ' + nd);
    saveDB();
    closeModal();
    applyOrderFilters();
    updateBell();
  } else {
    var j = DB.prop.find(function (x) {
      return x.id === id;
    });
    var oldD = j.ready;
    j.ready = nd;
    logAudit('Rescheduled propagation ' + j.no + ' from ' + (oldD || '—') + ' to ' + nd);
    saveDB();
    closeModal();
    rProp();
    updateBell();
  }
}
