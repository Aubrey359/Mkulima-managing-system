/* ================= ACCOUNTING ================= */
function rAcc() {
  var m = today().slice(0, 7);
  var h0 = hint('acc');
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
  var h =
    '<div class="grid c3"><div class="stat"><span>Income (' +
    m +
    ')</span><b>' +
    fmt(inc) +
    '</b></div><div class="stat"><span>' +
    t('expenses') +
    '</span><b>' +
    fmt(exp) +
    '</b></div><div class="stat"><span>Net</span><b>' +
    fmt(inc - exp) +
    '</b></div></div>' +
    '<div class="grid c2 mt"><div class="card"><h3>Income</h3><div class="frow"><div><label>' +
    t('date') +
    '</label><input type="date" id="in_date" value="' +
    today() +
    '"></div><div><label>Source</label><input id="in_src"></div><div><label>' +
    t('amount') +
    '</label><input type="number" id="in_amt"></div><div><label>' +
    t('method') +
    '</label><select id="in_m"><option>' +
    t('cash') +
    '</option><option>M-Pesa</option><option>' +
    t('bank') +
    '</option></select></div></div>' +
    '<button class="btn" onclick="var mc=null;if(in_m.value===\'M-Pesa\'){mc=mpesaAskCode(num(in_amt.value));if(mc===false)return}DB.income.push({id:uid(),date:in_date.value,src:in_src.value,amount:num(in_amt.value),method:in_m.value,mpesa:mc});saveDB();rAcc()"><svg class="ic"><use href="#i-save"/></svg></button>' +
    '<div class="mt" style="max-height:240px;overflow:auto">' +
    tbl(
      [t('date'), 'Source', t('method'), t('amount')],
      DB.income
        .slice()
        .reverse()
        .map(function (i) {
          return [
            i.date,
            esc(i.src),
            i.method + (i.mpesa ? '<br><small>' + esc(i.mpesa) + '</small>' : ''),
            fmt(i.amount)
          ];
        })
    ) +
    '</div></div>' +
    '<div class="card"><h3>' +
    t('expenses') +
    '</h3><div class="frow"><div><label>' +
    t('date') +
    '</label><input type="date" id="ex_date" value="' +
    today() +
    '"></div><div><label>Category</label><select id="ex_cat"><option>Supplies</option><option>Labour</option><option>Transport</option><option>Fuel</option><option>Other</option></select></div><div><label>' +
    t('notes') +
    '</label><input id="ex_desc"></div><div><label>' +
    t('amount') +
    '</label><input type="number" id="ex_amt"></div></div>' +
    '<button class="btn" onclick="DB.exp.push({id:uid(),date:ex_date.value,cat:ex_cat.value,desc:ex_desc.value,amount:num(ex_amt.value)});saveDB();rAcc()"><svg class="ic"><use href="#i-save"/></svg></button>' +
    '<div class="mt" style="max-height:240px;overflow:auto">' +
    tbl(
      [t('date'), 'Category', t('notes'), t('amount'), ''],
      DB.exp
        .slice()
        .reverse()
        .map(function (x) {
          return [
            x.date,
            x.cat,
            esc(x.desc),
            fmt(x.amount),
            '<button class="btn red sm" onclick="DB.exp=DB.exp.filter(function(y){return y.id!==\'' +
              x.id +
              '\'});saveDB();rAcc()">x</button>'
          ];
        })
    ) +
    '</div></div></div>' +
    '<div class="card"><h3>' +
    t('sales') +
    ' ' +
    t('by') +
    ' ' +
    t('employee') +
    ' — ' +
    m +
    '</h3><div class="toolbar"><button class="btn gray sm" onclick="shiftMonth(\'ms_m\',-1,monthSales)">‹</button><input type="month" id="ms_m" value="' +
    m +
    '" onchange="monthSales()"><button class="btn gray sm" onclick="shiftMonth(\'ms_m\',1,monthSales)">›</button><button class="btn sm" onclick="printMS()"><svg class="ic"><use href="#i-printer"/></svg> ' +
    t('print') +
    '</button></div><div id="ms_tbl"></div></div>';
  document.getElementById('content').innerHTML = h0 + h;
  monthSales();
}
function monthSales() {
  var m = document.getElementById('ms_m').value;
  var per = {};
  DB.orders
    .filter(function (o) {
      return monthOf(o.date) === m;
    })
    .forEach(function (o) {
      var n = empName(o.empId);
      per[n] = (per[n] || 0) + num(o.total);
    });
  var rows = Object.keys(per)
    .sort(function (a, b) {
      return per[b] - per[a];
    })
    .map(function (k) {
      return [k, fmt(per[k])];
    });
  var tot = Object.keys(per).reduce(function (a, k) {
    return a + per[k];
  }, 0);
  document.getElementById('ms_tbl').innerHTML =
    tbl([t('employee'), t('total')], rows) +
    (rows.length
      ? '<p class="mt"><svg class="ic"><use href="#i-trophy"/></svg> <b>' +
        t('top') +
        ':</b> ' +
        esc(
          Object.keys(per).sort(function (a, b) {
            return per[b] - per[a];
          })[0]
        ) +
        ' &nbsp;·&nbsp; <svg class="ic"><use href="#i-alert"/></svg> <b>' +
        t('least') +
        ':</b> ' +
        esc(
          Object.keys(per)
            .sort(function (a, b) {
              return per[b] - per[a];
            })
            .slice(-1)[0]
        ) +
        ' &nbsp;·&nbsp; <b>' +
        t('grand') +
        ': ' +
        fmt(tot) +
        '</b></p>'
      : '<div class="empty">—</div>');
}
function printMS() {
  var m = document.getElementById('ms_m').value;
  var per = {};
  DB.orders
    .filter(function (o) {
      return monthOf(o.date) === m;
    })
    .forEach(function (o) {
      var n = empName(o.empId);
      per[n] = (per[n] || 0) + num(o.total);
    });
  var rows = Object.keys(per).map(function (k) {
    return [k, fmt(per[k])];
  });
  var tot = Object.keys(per).reduce(function (a, k) {
    return a + per[k];
  }, 0);
  printHTML(
    '<h2>' +
      t('sales') +
      ' ' +
      t('by') +
      ' ' +
      t('employee') +
      ' — ' +
      m +
      '</h2>' +
      tbl([t('employee'), t('total')], rows) +
      '<h3 class="right">' +
      t('grand') +
      ': ' +
      fmt(tot) +
      '</h3>'
  );
}
