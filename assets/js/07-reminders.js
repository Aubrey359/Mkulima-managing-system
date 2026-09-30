/* ================= REMINDERS ================= */
function remDays() {
  var n = Number((DB.meta || {}).remDays);
  return n >= 0 && n <= 30 ? n : 3;
}
function daysTo(ds) {
  return Math.round((new Date(ds + 'T00:00:00') - new Date(today() + 'T00:00:00')) / 86400000);
}
function dueTxt(n) {
  return n < 0
    ? -n + ' day' + (n === -1 ? '' : 's') + ' overdue'
    : n === 0
      ? 'due today'
      : n === 1
        ? 'due tomorrow'
        : 'due in ' + n + ' days';
}
function getReminders() {
  var R = [];
  if (!session) return R;
  var rd = remDays(),
    r = role();
  function add(kind, icon, text, date, goto, extra) {
    if (!date) return;
    var n = daysTo(date);
    if (n > rd) return;
    var x = {
      kind: kind,
      icon: icon,
      text: text,
      date: date,
      n: n,
      go: goto,
      lvl: n < 0 ? 'r' : n === 0 ? 'a' : 'b'
    };
    if (extra) for (var k in extra) x[k] = extra[k];
    R.push(x);
  }
  if (r !== 'sowing') {
    DB.bookings.forEach(function (b) {
      if (b.status === 'Picked') return;
      var del = b.type === 'Delivery';
      add(
        del ? 'Delivery' : 'Pick-up',
        del ? '<svg class="ic"><use href="#i-truck"/></svg>' : '<svg class="ic"><use href="#i-box"/></svg>',
        (del ? 'Dispatch to ' : 'Pick-up by ') +
          b.cname +
          ' — ' +
          b.variety +
          ' ×' +
          b.qty +
          (del && b.addr ? ' (' + b.addr + ')' : ''),
        b.ready,
        'book'
      );
    });
    DB.orders.forEach(function (o) {
      if (!o.deliver || o.deliver.done) return;
      add(
        'Delivery',
        '<svg class="ic"><use href="#i-truck"/></svg>',
        'Dispatch to ' +
          custName(o.custId) +
          ' — ' +
          o.items
            .map(function (x) {
              return x.name + ' ×' + x.qty;
            })
            .join(', ') +
          (o.deliver.addr ? ' (' + o.deliver.addr + ')' : ''),
        o.deliver.date,
        'sales'
      );
    });
    (DB.prop || []).forEach(function (j) {
      if (j.status === 'Collected') return;
      if (j.status === 'Ready')
        R.push({
          kind: 'Propagation',
          icon: '<svg class="ic"><use href="#i-leaf"/></svg>',
          text: 'Ready — waiting for ' + custName(j.custId) + ' to collect ' + j.variety,
          date: j.ready || today(),
          n: Math.min(0, j.ready ? daysTo(j.ready) : 0),
          go: 'prop',
          lvl: 'a',
          label: 'waiting for collection'
        });
      else
        add(
          'Propagation',
          '<svg class="ic"><use href="#i-leaf"/></svg>',
          (j.ready && daysTo(j.ready) < 0 ? 'Ready date passed — check: ' : 'Nearly ready: ') +
            custName(j.custId) +
            ' — ' +
            j.variety +
            ' (' +
            num(j.qty).toLocaleString() +
            ')',
          j.ready,
          'prop'
        );
    });
  }
  DB.sowing.forEach(function (s) {
    if (s.status !== 'Growing') return;
    add(
      'Seedlings',
      '<svg class="ic"><use href="#i-sprout"/></svg>',
      (s.ready && daysTo(s.ready) < 0 ? 'Ready date passed — check and move to stock: ' : 'Nearly ready: ') +
        s.variety +
        ' (' +
        s.qty +
        ' ' +
        s.unit +
        ')',
      s.ready,
      'sow'
    );
  });
  R.sort(function (a, b) {
    return a.n - b.n;
  });
  return R;
}
function remRowHTML(x) {
  return (
    '<div class="remRow ' +
    x.lvl +
    '" onclick="closeModal();go(\'' +
    x.go +
    '\')"><div style="font-size:21px">' +
    x.icon +
    '</div><div style="flex:1"><b>' +
    esc(x.kind) +
    '</b> — ' +
    esc(x.text) +
    '<br><small>' +
    (x.label || dueTxt(x.n)) +
    ' · ' +
    x.date +
    '</small></div></div>'
  );
}
function remCardHTML() {
  var R = getReminders(),
    rd = remDays();
  if (!R.length)
    return (
      '<div class="card" style="padding:12px 16px;font-size:13px;color:var(--muted)"><svg class="ic"><use href="#i-bell"/></svg> All clear — nothing to pick up, dispatch or finish in the next ' +
      rd +
      ' days.</div>'
    );
  return (
    '<div class="card"><div class="rowflex" style="justify-content:space-between"><h3><svg class="ic"><use href="#i-bell"/></svg> Reminders <span class="badge ' +
    (R.some(function (x) {
      return x.n <= 0;
    })
      ? 'r'
      : 'a') +
    '">' +
    R.length +
    '</span></h3><button class="btn gray sm" onclick="showReminders()">View all</button></div>' +
    R.slice(0, 5).map(remRowHTML).join('') +
    (R.length > 5 ? '<p style="font-size:12px;color:var(--muted)">+ ' + (R.length - 5) + ' more…</p>' : '') +
    '</div>'
  );
}
function notifOn() {
  return (
    'Notification' in window &&
    Notification.permission === 'granted' &&
    localStorage.getItem('mk_notif') === '1'
  );
}
function showReminders() {
  var R = getReminders();
  var h =
    '<h3><svg class="ic"><use href="#i-bell"/></svg> Reminders <small style="font-weight:400;color:var(--muted)">(next ' +
    remDays() +
    ' days)</small></h3>' +
    (R.length
      ? R.map(remRowHTML).join('')
      : '<div class="empty">Nothing due right now <svg class="ic"><use href="#i-star"/></svg></div>') +
    '<div class="mt rowflex"><button class="btn ' +
    (notifOn() ? 'gray' : 'amber') +
    ' sm" onclick="remNotifyToggle()">' +
    (notifOn()
      ? '<svg class="ic"><use href="#i-bell-off"/></svg> Turn off alerts'
      : '<svg class="ic"><use href="#i-bell"/></svg> Turn on phone/desktop alerts') +
    '</button><button class="btn gray sm" onclick="closeModal()">' +
    t('close') +
    '</button></div>' +
    '<p style="font-size:11.5px;color:var(--muted);margin-top:8px">Alerts pop up while the app is open in your browser. ' +
    (isLoise() ? 'Change how many days ahead in Settings.' : '') +
    '</p>';
  openModal(h);
}
function msgBox(title, html) {
  openModal(
    '<h3>' +
      title +
      '</h3><div style="margin:10px 0;font-size:13.5px;line-height:1.5">' +
      html +
      '</div><div class="mt"><button class="btn gray" onclick="closeModal()">OK</button></div>'
  );
}
function remNotifyToggle() {
  if (notifOn()) {
    localStorage.setItem('mk_notif', '0');
    msgBox(
      '<svg class="ic"><use href="#i-bell-off"/></svg> Alerts off',
      'Phone/desktop alerts are turned off. The bell still shows your reminders.'
    );
    return;
  }
  if (!('Notification' in window)) {
    msgBox(
      'Not supported',
      'This browser cannot show alerts. The bell and dashboard still show your reminders.'
    );
    return;
  }
  Notification.requestPermission().then(function (p) {
    if (p === 'granted') {
      localStorage.setItem('mk_notif', '1');
      localStorage.setItem('mk_rem_last', '0');
      remNotify();
      msgBox(
        '<svg class="ic"><use href="#i-check"/></svg> Alerts on',
        'You will get an alert when something is due, overdue or nearly ready — while the app is open.'
      );
    } else
      msgBox('Alerts blocked', 'Allow notifications for this site in your browser settings, then try again.');
  });
}
function remNotify() {
  try {
    if (!notifOn() || !session) return;
    var R = getReminders();
    if (!R.length) return;
    var last = Number(localStorage.getItem('mk_rem_last') || 0);
    if (Date.now() - last < 4 * 3600000) return;
    localStorage.setItem('mk_rem_last', String(Date.now()));
    var urgent = R.filter(function (x) {
      return x.n <= 0;
    }).length;
    new Notification('<svg class="ic"><use href="#i-sprout"/></svg> Mkulima reminders', {
      body:
        R.length +
        ' item(s) need attention' +
        (urgent ? ' — ' + urgent + ' due now/overdue' : '') +
        '. ' +
        R.slice(0, 2)
          .map(function (x) {
            return x.text;
          })
          .join(' | ')
    });
  } catch (e) {}
}
function updateBell() {
  var b = document.getElementById('bellBtn');
  if (!b || !session) return;
  var R = getReminders(),
    c = document.getElementById('bellCnt');
  c.textContent = R.length > 99 ? '99+' : R.length;
  b.classList.toggle('on', R.length > 0);
  b.classList.toggle(
    'hot',
    R.some(function (x) {
      return x.n <= 0;
    })
  );
}
var remTimer = null;
function remStart() {
  updateBell();
  remNotify();
  if (!remTimer)
    remTimer = setInterval(function () {
      updateBell();
      remNotify();
    }, 600000);
  if (!sessionStorage.getItem('mk_rem_shown')) {
    sessionStorage.setItem('mk_rem_shown', '1');
    if (
      getReminders().some(function (x) {
        return x.n <= 0;
      })
    )
      setTimeout(showReminders, 700);
  }
}
