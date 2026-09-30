/* ================= DASHBOARD ================= */
function salesTargetHTML(mIncome, m) {
  var tgt = num((DB.meta.targets || {}).monthly);
  if (!tgt)
    return '<div class="card" style="font-size:12.5px;color:var(--muted)"><svg class="ic"><use href="#i-target"/></svg> No monthly sales target set yet — set one in Settings.</div>';
  var pct = Math.min(100, Math.round((mIncome / tgt) * 100));
  return (
    '<div class="card"><h3><svg class="ic"><use href="#i-target"/></svg> Sales Target — ' +
    m +
    '</h3><div style="background:var(--bg1);border-radius:20px;overflow:hidden;height:22px;border:1px solid var(--line)"><div style="height:100%;width:' +
    pct +
    '%;background:linear-gradient(90deg,var(--green3),var(--green));display:flex;align-items:center;justify-content:flex-end;padding-right:8px;color:#fff;font-size:11px;font-weight:700;min-width:32px">' +
    pct +
    '%</div></div>' +
    '<p style="font-size:12.5px;color:var(--muted);margin-top:6px">' +
    fmt(mIncome) +
    ' of ' +
    fmt(tgt) +
    ' target' +
    (pct >= 100 ? ' — <svg class="ic"><use href="#i-star"/></svg> Target reached!' : '') +
    '</p></div>'
  );
}
function rDash() {
  var m = today().slice(0, 7);
  var mIncome =
    DB.orders
      .filter(function (o) {
        return monthOf(o.date) === m && o.pay !== 'Credit';
      })
      .reduce(function (a, o) {
        return a + num(o.total);
      }, 0) +
    DB.income
      .filter(function (i) {
        return monthOf(i.date) === m;
      })
      .reduce(function (a, i) {
        return a + num(i.amount);
      }, 0);
  var mExp = DB.exp
    .filter(function (e) {
      return monthOf(e.date) === m;
    })
    .reduce(function (a, e) {
      return a + num(e.amount);
    }, 0);
  var credit = DB.orders.filter(function (o) {
    return num(o.balance) > 0;
  });
  var creditTot = credit.reduce(function (a, o) {
    return a + num(o.balance);
  }, 0);
  var pendB = DB.bookings.filter(function (b) {
    return b.status !== 'Picked';
  });
  var lb = Number(localStorage.getItem('mk_lastbackup') || 0);
  var bkWarn =
    !lb || Date.now() - lb > 30 * 86400000
      ? '<div class="bkWarn"><svg class="ic"><use href="#i-alert"/></svg> ' +
        (LANG === 'sw'
          ? 'Hakuna backup ya siku 30. PAKUA backup sasa!'
          : 'No backup downloaded in 30+ days. Download one now!') +
        ' <button class="btn sm" onclick="backup()"><svg class="ic"><use href="#i-download"/></svg> ' +
        (LANG === 'sw' ? 'Pakuwa' : 'Backup') +
        '</button></div>'
      : '';
  var h =
    bkWarn +
    remCardHTML() +
    '<div class="grid c4">' +
    '<div class="stat"><span>' +
    t('acc') +
    ' — ' +
    t('total') +
    ' (' +
    m +
    ')</span><b>' +
    fmt(mIncome) +
    '</b></div>' +
    '<div class="stat"><span>' +
    t('expenses') +
    ' (' +
    m +
    ')</span><b>' +
    fmt(mExp) +
    '</b></div>' +
    '<div class="stat"><span>' +
    t('credit') +
    ' (' +
    t('customer') +
    ')</span><b>' +
    fmt(creditTot) +
    '</b></div>' +
    '<div class="stat"><span>' +
    t('book') +
    ' (' +
    t('pending') +
    ')</span><b>' +
    pendB.length +
    '</b></div></div>' +
    salesTargetHTML(mIncome, m) +
    hint('dash') +
    '<div class="grid c2"><div class="card"><h3><svg class="ic"><use href="#i-trend-down"/></svg> ' +
    t('chart') +
    ' — Income vs Expenses</h3><canvas id="ch1" height="120"></canvas></div>' +
    '<div class="card"><h3><svg class="ic"><use href="#i-trophy"/></svg> Top Selling Items (' +
    m +
    ')</h3><canvas id="ch2" height="120"></canvas></div></div>' +
    '<div class="card"><h3><svg class="ic"><use href="#i-users"/></svg> ' +
    t('sales') +
    ' ' +
    t('by') +
    ' ' +
    t('employee') +
    ' — ' +
    m +
    '</h3><canvas id="ch3" height="110"></canvas><div id="empNote" class="mt" style="font-size:12.5px"></div></div>' +
    '<div class="grid c2"><div class="card"><h3>' +
    t('sales') +
    ' — ' +
    t('recent') +
    '</h3>' +
    tbl(
      [t('date'), t('customer'), t('tended'), t('total'), t('status')],
      DB.orders
        .slice(-6)
        .reverse()
        .map(function (o) {
          return [o.date, esc(custName(o.custId)), esc(empName(o.empId)), fmt(o.total), payBadge(o)];
        })
    ) +
    '</div>' +
    '<div class="card"><h3><svg class="ic"><use href="#i-card"/></svg> ' +
    t('credit') +
    ' — ' +
    t('needpay') +
    '</h3>' +
    creditListHTML(credit.slice(0, 8)) +
    '</div></div>' +
    '<div class="card"><h3>' +
    t('book') +
    ' — ' +
    t('pending') +
    '</h3><div class="toolbar"><input id="db_q" placeholder="' +
    t('search') +
    ' ' +
    t('customer') +
    '..." oninput="dashBook()"></div><div id="db_tbl"></div></div>';
  document.getElementById('content').innerHTML = h;
  dashBook();
  drawCharts();
}
function creditListHTML(list) {
  if (!list.length)
    return (
      '<div class="empty"><svg class="ic"><use href="#i-check"/></svg> ' +
      (LANG === 'sw' ? 'Hakuna deni' : 'No credit owed') +
      '</div>'
    );
  return tbl(
    [t('customer'), t('balance'), ''],
    list.map(function (o) {
      return [
        '<b>' + esc(custName(o.custId)) + '</b><br><small>' + o.no + ' · ' + o.date + '</small>',
        '<span class="low">' + fmt(o.balance) + '</span>',
        '<button class="btn sm" onclick="payModal(\'' +
          o.id +
          '\')"><svg class="ic"><use href="#i-cash"/></svg> ' +
          t('receive') +
          '</button>'
      ];
    })
  );
}
function dashBook() {
  var q = (document.getElementById('db_q').value || '').toLowerCase();
  var list = DB.bookings
    .filter(function (b) {
      return b.status !== 'Picked';
    })
    .filter(function (b) {
      return !q || b.cname.toLowerCase().indexOf(q) >= 0 || b.variety.toLowerCase().indexOf(q) >= 0;
    })
    .slice(0, 10);
  document.getElementById('db_tbl').innerHTML = tbl(
    [t('date'), t('customer'), t('variety'), t('qty'), t('status'), ''],
    list.map(function (b) {
      return [
        b.date,
        esc(b.cname),
        esc(b.variety),
        b.qty,
        bookBadge(b),
        '<button class="btn sm" onclick="go(\'book\')">→</button>'
      ];
    })
  );
}
function drawCharts() {
  CHARTS.forEach(function (c) {
    c.destroy();
  });
  CHARTS = [];
  var months = [],
    inc = [],
    exp = [];
  for (var i = 5; i >= 0; i--) {
    var d = new Date();
    d.setMonth(d.getMonth() - i);
    var mk = d.toISOString().slice(0, 7);
    months.push(mk);
    inc.push(
      DB.orders
        .filter(function (o) {
          return monthOf(o.date) === mk && o.pay !== 'Credit';
        })
        .reduce(function (a, o) {
          return a + num(o.total);
        }, 0) +
        DB.income
          .filter(function (x) {
            return monthOf(x.date) === mk;
          })
          .reduce(function (a, x) {
            return a + num(x.amount);
          }, 0)
    );
    exp.push(
      DB.exp
        .filter(function (e) {
          return monthOf(e.date) === mk;
        })
        .reduce(function (a, e) {
          return a + num(e.amount);
        }, 0)
    );
  }
  var c1 = document.getElementById('ch1');
  if (c1)
    CHARTS.push(
      new Chart(c1, {
        type: 'bar',
        data: {
          labels: months,
          datasets: [
            { label: 'Income', data: inc, backgroundColor: '#22c55e' },
            { label: 'Expenses', data: exp, backgroundColor: '#f87171' }
          ]
        },
        options: { plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }
      })
    );
  var m = today().slice(0, 7),
    tops = {};
  DB.orders
    .filter(function (o) {
      return monthOf(o.date) === m;
    })
    .forEach(function (o) {
      o.items.forEach(function (x) {
        tops[x.name] = (tops[x.name] || 0) + num(x.qty);
      });
    });
  var names = Object.keys(tops)
    .sort(function (a, b) {
      return tops[b] - tops[a];
    })
    .slice(0, 6);
  var c2 = document.getElementById('ch2');
  if (c2)
    CHARTS.push(
      new Chart(c2, {
        type: 'doughnut',
        data: {
          labels: names,
          datasets: [
            {
              data: names.map(function (n) {
                return tops[n];
              }),
              backgroundColor: ['#22c55e', '#2563eb', '#d97706', '#7c3aed', '#dc2626', '#0d9488']
            }
          ]
        },
        options: { plugins: { legend: { position: 'right' } } }
      })
    );
  var per = {};
  DB.orders
    .filter(function (o) {
      return monthOf(o.date) === m;
    })
    .forEach(function (o) {
      var n = empName(o.empId);
      per[n] = (per[n] || 0) + num(o.total);
    });
  var en = Object.keys(per);
  var c3 = document.getElementById('ch3');
  if (c3) {
    if (!en.length) {
      document.getElementById('empNote').innerHTML = '<div class="empty">—</div>';
    } else {
      CHARTS.push(
        new Chart(c3, {
          type: 'bar',
          data: {
            labels: en,
            datasets: [
              {
                label: t('sales') + ' (' + m + ')',
                data: en.map(function (n) {
                  return per[n];
                }),
                backgroundColor: '#22c55e'
              }
            ]
          },
          options: {
            indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true } }
          }
        })
      );
      var sorted = en.slice().sort(function (a, b) {
        return per[b] - per[a];
      });
      var tot = en.reduce(function (a, n) {
        return a + per[n];
      }, 0);
      document.getElementById('empNote').innerHTML =
        '<svg class="ic"><use href="#i-trophy"/></svg> <b>' +
        t('top') +
        ':</b> ' +
        esc(sorted[0]) +
        ' (' +
        fmt(per[sorted[0]]) +
        ') &nbsp;·&nbsp; <svg class="ic"><use href="#i-alert"/></svg> <b>' +
        t('least') +
        ':</b> ' +
        esc(sorted[sorted.length - 1]) +
        ' (' +
        fmt(per[sorted.length - 1]) +
        ') &nbsp;·&nbsp; <b>' +
        t('grand') +
        ':</b> ' +
        fmt(tot);
    }
  }
}
function payBadge(o) {
  if (num(o.balance) > 0)
    return (
      '<span class="badge r">' +
      t('credit') +
      ' ' +
      fmt(o.balance) +
      '</span>' +
      (o.follow
        ? '<br><span class="badge a"><svg class="ic"><use href="#i-flag"/></svg> ' + t('needfu') + '</span>'
        : '')
    );
  if (o.pay === 'Credit')
    return '<span class="badge g">' + t('settle') + ' <svg class="ic"><use href="#i-check"/></svg></span>';
  return '<span class="badge g">' + t('paid') + ' · ' + esc(o.pay) + '</span>';
}
function bookBadge(b) {
  return b.status === 'Pending'
    ? '<span class="badge a">' + t('pending') + '</span>'
    : b.status === 'Ready'
      ? '<span class="badge b">' + t('ready') + '</span>'
      : '<span class="badge g">' + t('picked') + '</span>';
}
