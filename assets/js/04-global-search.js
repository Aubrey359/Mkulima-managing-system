/* ================= GLOBAL SEARCH ================= */
function gSearch(q) {
  var box = document.getElementById('gsRes');
  q = (q || '').trim().toLowerCase();
  if (!q) {
    box.style.display = 'none';
    return;
  }
  var res = [];
  DB.cust
    .filter(function (c) {
      return c.name.toLowerCase().indexOf(q) >= 0 || (c.phone || '').indexOf(q) >= 0;
    })
    .slice(0, 5)
    .forEach(function (c) {
      res.push({
        k: 'cust',
        id: c.id,
        label: '<svg class="ic"><use href="#i-users"/></svg> ' + c.name,
        sub: c.phone || ''
      });
    });
  DB.orders
    .slice()
    .reverse()
    .filter(function (o) {
      var c = DB.cust.find(function (x) {
        return x.id === o.custId;
      });
      return (o.no || '').toLowerCase().indexOf(q) >= 0 || (c && c.name.toLowerCase().indexOf(q) >= 0);
    })
    .slice(0, 5)
    .forEach(function (o) {
      res.push({
        k: 'order',
        id: o.id,
        label: '<svg class="ic"><use href="#i-receipt"/></svg> ' + o.no + ' — ' + custName(o.custId),
        sub: fmt(o.total) + ' · ' + o.date
      });
    });
  DB.bookings
    .slice()
    .reverse()
    .filter(function (b) {
      return (b.cname || '').toLowerCase().indexOf(q) >= 0 || (b.variety || '').toLowerCase().indexOf(q) >= 0;
    })
    .slice(0, 4)
    .forEach(function (b) {
      res.push({
        k: 'book',
        id: b.id,
        label: '<svg class="ic"><use href="#i-calendar"/></svg> ' + b.cname + ' — ' + b.variety,
        sub: b.status
      });
    });
  if (!res.length) {
    box.innerHTML = '<div class="gsNone">' + t('nothing') + '</div>';
    box.style.display = 'block';
    return;
  }
  box.innerHTML = res
    .map(function (r) {
      return (
        '<div class="gsItem" onmousedown="gsGo(\'' +
        r.k +
        "','" +
        r.id +
        '\')"><div>' +
        r.label +
        '</div><small>' +
        esc(r.sub) +
        '</small></div>'
      );
    })
    .join('');
  box.style.display = 'block';
}
function gsGo(kind, id) {
  document.getElementById('gsRes').style.display = 'none';
  document.getElementById('gq').value = '';
  if (kind === 'cust') {
    var c = DB.cust.find(function (x) {
      return x.id === id;
    });
    if (!c) return;
    go('crm');
    GS.crm = c.name;
    setTimeout(function () {
      var i = document.getElementById('c_q');
      if (i) {
        i.value = GS.crm;
        GS.crm = '';
        rCRMList();
      }
    }, 80);
  }
  if (kind === 'order') {
    var o = DB.orders.find(function (x) {
      return x.id === id;
    });
    if (!o) return;
    TAB.sales = 1;
    go('sales');
    GS.obq = o.no;
    setTimeout(function () {
      var i = document.getElementById('ob_q');
      if (i) {
        i.value = GS.obq;
        GS.obq = '';
        applyOrderFilters();
      }
    }, 80);
  }
  if (kind === 'book') {
    var b = DB.bookings.find(function (x) {
      return x.id === id;
    });
    if (!b) return;
    go('book');
    GS.bq = b.cname;
    setTimeout(function () {
      var i = document.getElementById('bk_q');
      if (i) {
        i.value = GS.bq;
        GS.bq = '';
        rBookList();
      }
    }, 80);
  }
}
