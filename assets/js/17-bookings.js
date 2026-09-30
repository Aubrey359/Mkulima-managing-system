/* ================= BOOKINGS ================= */
function rBook() {
  var h =
    hint('book') +
    '<div class="card"><h3>' +
    t('add') +
    ' — ' +
    t('book') +
    '</h3><div class="frow">' +
    '<div><label>' +
    t('date') +
    '</label><input type="date" id="b_date" value="' +
    today() +
    '"></div>' +
    '<div><label>' +
    t('customer') +
    '</label><select id="b_cust"><option value="">— Walk-in —</option>' +
    DB.cust
      .map(function (c) {
        return '<option value="' + c.id + '">' + esc(c.name) + '</option>';
      })
      .join('') +
    '</select></div>' +
    '<div><label>' +
    t('variety') +
    ' / Item</label><input id="b_var" placeholder="e.g. Tomato Seedlings"></div>' +
    '<div><label>' +
    t('qty') +
    '</label><input type="number" id="b_qty" value="0"></div>' +
    '<div><label>' +
    t('price') +
    '</label><input type="number" id="b_price" value="0"></div>' +
    '<div><label>Deposit</label><input type="number" id="b_dep" value="0"></div></div>' +
    '<div class="frow"><div><label>Pick-up / delivery date</label><input type="date" id="b_ready"></div><div><label>Handover</label><select id="b_type" onchange="bTypeToggle()"><option>Pick-up</option><option>Delivery</option></select></div><div id="b_addr_wrap" style="display:none"><label>Delivery address</label><input id="b_addr" list="b_addr_dl" placeholder="Where to?">' +
    afDatalist('loc', 'b_addr_dl') +
    '</div><div><label>' +
    t('communicated') +
    '</label><select id="b_comm"><option>' +
    t('call') +
    '</option><option>' +
    t('whatsapp') +
    '</option><option>' +
    t('sms') +
    '</option><option>' +
    t('visit') +
    '</option></select></div><div><label>' +
    t('tended') +
    '</label><select id="b_emp"><option value="">—</option><option value="loise">Loise (Owner)</option>' +
    DB.emp
      .filter(function (e) {
        return e.status === 'Active';
      })
      .map(function (e) {
        return '<option value="' + e.id + '">' + esc(e.name) + '</option>';
      })
      .join('') +
    '</select></div></div>' +
    '<label>' +
    t('notes') +
    '</label><input id="b_notes"><div class="mt"><button class="btn" onclick="saveBook()"><svg class="ic"><use href="#i-save"/></svg> ' +
    t('save') +
    '</button></div></div>' +
    '<div class="card"><div class="toolbar"><input id="bk_q" placeholder="' +
    t('search') +
    ' — ' +
    t('customer') +
    ', variety" oninput="rBookList()" style="min-width:220px">' +
    '<select id="bk_st" onchange="rBookList()"><option value="">' +
    t('all') +
    '</option><option>' +
    t('pending') +
    '</option><option>' +
    t('ready') +
    '</option><option>' +
    t('picked') +
    '</option></select>' +
    '<button class="btn sm" onclick="printBook()"><svg class="ic"><use href="#i-printer"/></svg> ' +
    t('print') +
    '</button><button class="btn blue sm" onclick="exportRows(\'Bookings\',DB.bookings.map(function(b){return{Date:b.date,Customer:b.cname,Variety:b.variety,Qty:b.qty,Price:b.price,Deposit:b.deposit,Balance:b.price*b.qty-b.deposit,Status:b.status,PickUp:b.ready}}))">' +
    t('export') +
    '</button></div><div id="book_tbl"></div></div>';
  document.getElementById('content').innerHTML = h;
  if (GS.bq) {
    document.getElementById('bk_q').value = GS.bq;
    GS.bq = '';
  }
  rBookList();
}
function saveBook() {
  var v = document.getElementById('b_var').value.trim();
  if (!v) {
    alert(t('variety') + '?');
    return;
  }
  var cid = document.getElementById('b_cust').value,
    cname = cid ? custName(cid) : prompt(t('customer') + ':', 'Walk-in');
  if (!cname) return;
  var dep = num(document.getElementById('b_dep').value);
  var b = {
    id: uid(),
    date: document.getElementById('b_date').value,
    custId: cid,
    cname: cname,
    variety: v,
    qty: num(document.getElementById('b_qty').value),
    price: num(document.getElementById('b_price').value),
    deposit: dep,
    ready: document.getElementById('b_ready').value,
    type: document.getElementById('b_type').value,
    addr: document.getElementById('b_addr').value,
    comm: document.getElementById('b_comm').value,
    empId: document.getElementById('b_emp').value,
    notes: document.getElementById('b_notes').value,
    status: 'Pending'
  };
  if (b.addr) afTrack('loc', b.addr);
  DB.bookings.push(b);
  logPrice(cid || '', v, b.price);
  if (dep > 0) {
    DB.income.push({
      id: uid(),
      date: b.date,
      src: t('book') + ' deposit — ' + cname,
      amount: dep,
      method: t('cash')
    });
    alert(mpesaMsg(dep, cname + ' ' + t('book')));
  }
  saveDB();
  rBookList();
}
function rBookList() {
  var q = (document.getElementById('bk_q').value || '').toLowerCase(),
    st = document.getElementById('bk_st').value;
  var rows = DB.bookings
    .slice()
    .reverse()
    .filter(function (b) {
      if (q && b.cname.toLowerCase().indexOf(q) < 0 && b.variety.toLowerCase().indexOf(q) < 0) return false;
      if (st === t('pending') && b.status !== 'Pending') return false;
      if (st === t('ready') && b.status !== 'Ready') return false;
      if (st === t('picked') && b.status !== 'Picked') return false;
      return true;
    })
    .map(function (b) {
      var bal = b.qty * b.price - b.deposit;
      return [
        b.date,
        '<b>' + esc(b.cname) + '</b>',
        esc(b.variety),
        b.qty,
        fmt(b.price),
        fmt(b.deposit),
        bal > 0
          ? '<span class="low">' + fmt(bal) + '</span>'
          : '<svg class="ic"><use href="#i-check"/></svg>',
        (b.ready || '—') +
          (b.type === 'Delivery'
            ? '<br><span class="badge b"><svg class="ic"><use href="#i-truck"/></svg> ' +
              esc(b.addr || 'Delivery') +
              '</span>'
            : ''),
        esc(empName(b.empId)),
        esc(b.comm),
        bookBadge(b),
        '<button class="btn sm" onclick="bookSet(\'' +
          b.id +
          "','Ready')\">" +
          t('ready') +
          '</button> <button class="btn gray sm" onclick="bookSet(\'' +
          b.id +
          "','Picked')\">" +
          (b.type === 'Delivery' ? '<svg class="ic"><use href="#i-truck"/></svg> Delivered' : t('picked')) +
          '</button> ' +
          (b.status !== 'Picked'
            ? '<button class="btn amber sm" onclick="reschedModal(\'book\',\'' +
              b.id +
              '\')"><svg class="ic"><use href="#i-calendar"/></svg> Reschedule</button> '
            : '') +
          '<button class="btn red sm" onclick="DB.bookings=DB.bookings.filter(function(x){return x.id!==\'' +
          b.id +
          '\'});saveDB();rBookList()">x</button>'
      ];
    });
  document.getElementById('book_tbl').innerHTML = tbl(
    [
      t('date'),
      t('customer'),
      t('variety'),
      t('qty'),
      t('price'),
      'Deposit',
      t('balance'),
      'Pick-up',
      t('tended'),
      t('communicated'),
      t('status'),
      ''
    ],
    rows
  );
}
function bookSet(id, st) {
  var b = DB.bookings.find(function (x) {
    return x.id === id;
  });
  b.status = st;
  if (st === 'Picked') {
    var it = DB.inv.find(function (x) {
      return x.name.toLowerCase() === b.variety.toLowerCase();
    });
    if (it) {
      if (num(it.qty) < b.qty) {
        alert('Not enough stock of ' + it.name + ' (have ' + it.qty + ')');
        b.status = 'Ready';
      } else it.qty -= b.qty;
    }
  }
  saveDB();
  rBookList();
}
function printBook() {
  var rows = DB.bookings.map(function (b) {
    return [
      b.date,
      b.cname,
      b.variety,
      b.qty,
      fmt(b.price),
      fmt(b.deposit),
      fmt(b.qty * b.price - b.deposit),
      b.ready || '—',
      b.status
    ];
  });
  printHTML(
    '<h2>' +
      t('book') +
      '</h2>' +
      tbl(
        [
          t('date'),
          t('customer'),
          t('variety'),
          t('qty'),
          t('price'),
          'Deposit',
          t('balance'),
          'Pick-up',
          t('status')
        ],
        rows
      )
  );
}
