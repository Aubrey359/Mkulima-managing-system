/* ================= ATTENDANCE ================= */
function rAtt() {
  var h =
    hint('att') +
    '<div class="card"><h3>' +
    t('att') +
    ' — <span id="a_dlabel">' +
    today() +
    '</span></h3><div class="toolbar"><input type="date" id="a_date" value="' +
    today() +
    '" onchange="rAttToday()">' +
    '<button class="btn blue sm" onclick="exportRows(\'Attendance\',DB.att.map(function(a){return{Date:a.date,Employee:empName(a.empId),Status:a.status,In:a.in,Out:a.out}}))">' +
    t('export') +
    '</button></div>' +
    '<div id="a_today"></div></div>' +
    '<div class="card"><h3>' +
    t('att') +
    ' — History</h3><div class="toolbar"><select id="a_emp" onchange="rAttHist()"><option value="">' +
    t('all') +
    '</option>' +
    DB.emp
      .map(function (e) {
        return '<option value="' + e.id + '">' + esc(e.name) + '</option>';
      })
      .join('') +
    '</select>' +
    '<button class="btn gray sm" onclick="shiftMonth(\'a_m\',-1,rAttHist)">‹</button><input type="month" id="a_m" value="' +
    today().slice(0, 7) +
    '" onchange="rAttHist()"><button class="btn gray sm" onclick="shiftMonth(\'a_m\',1,rAttHist)">›</button>' +
    '<button class="btn sm" onclick="printAtt()"><svg class="ic"><use href="#i-printer"/></svg> ' +
    t('print') +
    '</button></div><div id="a_hist"></div></div>';
  document.getElementById('content').innerHTML = h;
  rAttToday();
  rAttHist();
}
function rAttToday() {
  var d = document.getElementById('a_date').value;
  document.getElementById('a_dlabel').textContent = d;
  var rows = DB.emp
    .filter(function (e) {
      return e.status === 'Active';
    })
    .map(function (e) {
      var rec = DB.att.find(function (a) {
        return a.empId === e.id && a.date === d;
      });
      var b = rec
        ? '<span class="badge ' +
          (rec.status === 'Present' ? 'g' : rec.status === 'Absent' ? 'r' : 'a') +
          '">' +
          t(rec.status.toLowerCase()) +
          '</span> ' +
          rec.in +
          '–' +
          rec.out
        : '<span class="badge gr">—</span>';
      return [
        '<b>' + esc(e.name) + '</b>',
        '<span class="badge b">' + e.rank + '</span>',
        b,
        '<button class="btn sm" onclick="markAtt(\'' +
          e.id +
          '\',\'Present\')"><svg class="ic"><use href="#i-check"/></svg> ' +
          t('present') +
          '</button> <button class="btn amber sm" onclick="markAtt(\'' +
          e.id +
          "','Leave')\">" +
          t('leave') +
          '</button> <button class="btn red sm" onclick="markAtt(\'' +
          e.id +
          '\',\'Absent\')"><svg class="ic"><use href="#i-x"/></svg> ' +
          t('absent') +
          '</button>' +
          (rec
            ? ' <button class="btn gray sm" onclick="attForm(\'' +
              e.id +
              "','','" +
              rec.id +
              '\')"><svg class="ic"><use href="#i-pencil"/></svg> Edit</button>'
            : '')
      ];
    });
  document.getElementById('a_today').innerHTML = tbl([t('employee'), 'Rank', t('status'), 'Mark'], rows);
}
function markAtt(eid, st) {
  if (st === 'Present') {
    attForm(eid, 'Present');
    return;
  }
  var d = document.getElementById('a_date').value;
  DB.att = DB.att.filter(function (a) {
    return !(a.empId === eid && a.date === d);
  });
  DB.att.push({ id: uid(), empId: eid, date: d, status: st, in: '—', out: '—' });
  logAudit('Attendance ' + empName(eid) + ' ' + d + ' — ' + st);
  saveDB();
  rAttToday();
  rAttHist();
}
function attForm(eid, st, recId) {
  var rec = recId
    ? DB.att.find(function (a) {
        return a.id === recId;
      })
    : null;
  var d = rec ? rec.date : document.getElementById('a_date').value;
  var cur =
    rec ||
    DB.att.find(function (a) {
      return a.empId === eid && a.date === d;
    });
  var status = st || (cur ? cur.status : 'Present');
  var tin = cur && /^\d\d:\d\d$/.test(cur.in) ? cur.in : '07:00',
    tout = cur && /^\d\d:\d\d$/.test(cur.out) ? cur.out : '17:00';
  openModal(
    '<h3><svg class="ic"><use href="#i-clock"/></svg> ' +
      esc(empName(eid)) +
      '</h3><div class="frow"><div><label>' +
      t('date') +
      '</label><input type="date" id="at_date" value="' +
      d +
      '"></div><div><label>' +
      t('status') +
      '</label><select id="at_status" onchange="attToggle()">' +
      ['Present', 'Leave', 'Absent']
        .map(function (s) {
          return '<option' + (s === status ? ' selected' : '') + '>' + s + '</option>';
        })
        .join('') +
      '</select></div></div>' +
      '<div class="frow" id="at_times"><div><label>Time in</label><input type="time" id="at_in" value="' +
      tin +
      '"></div><div><label>Time out</label><input type="time" id="at_out" value="' +
      tout +
      '"></div></div>' +
      '<div class="mt"><button class="btn" onclick="attSave(\'' +
      eid +
      "','" +
      (cur ? cur.id : '') +
      '\')"><svg class="ic"><use href="#i-save"/></svg> ' +
      t('save') +
      '</button> <button class="btn gray" onclick="closeModal()">' +
      t('close') +
      '</button></div>'
  );
  attToggle();
}
function attToggle() {
  var p = document.getElementById('at_status').value === 'Present';
  document.getElementById('at_times').style.display = p ? '' : 'none';
}
function attSave(eid, oldId) {
  var d = document.getElementById('at_date').value;
  if (!d) {
    alert(t('date') + '?');
    return;
  }
  var st = document.getElementById('at_status').value,
    pr = st === 'Present';
  var tin = pr ? document.getElementById('at_in').value || '—' : '—',
    tout = pr ? document.getElementById('at_out').value || '—' : '—';
  DB.att = DB.att.filter(function (a) {
    return a.id !== oldId && !(a.empId === eid && a.date === d);
  });
  DB.att.push({ id: uid(), empId: eid, date: d, status: st, in: tin, out: tout });
  logAudit(
    'Attendance ' +
      (oldId ? 'edited' : 'marked') +
      ': ' +
      empName(eid) +
      ' ' +
      d +
      ' — ' +
      st +
      (pr ? ' ' + tin + '–' + tout : '')
  );
  saveDB();
  closeModal();
  rAttToday();
  rAttHist();
}
function rAttHist() {
  var eid = document.getElementById('a_emp').value,
    m = document.getElementById('a_m').value;
  var rows = DB.att
    .filter(function (a) {
      return (!eid || a.empId === eid) && monthOf(a.date) === m;
    })
    .sort(function (a, b) {
      return a.date < b.date ? 1 : -1;
    })
    .map(function (a) {
      return [
        a.date,
        '<b>' + esc(empName(a.empId)) + '</b>',
        '<span class="badge ' +
          (a.status === 'Present' ? 'g' : a.status === 'Absent' ? 'r' : 'a') +
          '">' +
          t(a.status.toLowerCase()) +
          '</span>',
        a.in,
        a.out,
        '<button class="btn gray sm" onclick="attForm(\'' +
          a.empId +
          "','','" +
          a.id +
          '\')"><svg class="ic"><use href="#i-pencil"/></svg></button> <button class="btn red sm" onclick="DB.att=DB.att.filter(function(x){return x.id!==\'' +
          a.id +
          '\'});saveDB();rAttHist();rAttToday()">x</button>'
      ];
    });
  var p = DB.att.filter(function (a) {
    return (!eid || a.empId === eid) && monthOf(a.date) === m && a.status === 'Present';
  }).length;
  var ab = DB.att.filter(function (a) {
    return (!eid || a.empId === eid) && monthOf(a.date) === m && a.status === 'Absent';
  }).length;
  var lv = DB.att.filter(function (a) {
    return (!eid || a.empId === eid) && monthOf(a.date) === m && a.status === 'Leave';
  }).length;
  document.getElementById('a_hist').innerHTML =
    tbl([t('date'), t('employee'), t('status'), 'In', 'Out', ''], rows) +
    '<p class="mt"><span class="badge g">' +
    p +
    ' ' +
    t('present') +
    '</span> <span class="badge r">' +
    ab +
    ' ' +
    t('absent') +
    '</span> <span class="badge a">' +
    lv +
    ' ' +
    t('leave') +
    '</span></p>';
}
function printAtt() {
  var eid = document.getElementById('a_emp').value,
    m = document.getElementById('a_m').value;
  var rows = DB.att
    .filter(function (a) {
      return (!eid || a.empId === eid) && monthOf(a.date) === m;
    })
    .sort(function (a, b) {
      return a.date < b.date ? 1 : -1;
    })
    .map(function (a) {
      var cls = a.status === 'Present' ? 'pr-g' : a.status === 'Absent' ? 'pr-r' : 'pr-a';
      return [
        a.date,
        empName(a.empId),
        '<span class="' +
          cls +
          '" style="padding:2px 8px;border-radius:10px;font-weight:700">' +
          t(a.status.toLowerCase()) +
          '</span>',
        a.in,
        a.out
      ];
    });
  printHTML(
    '<h2>' + t('att') + ' — ' + m + '</h2>' + tbl([t('date'), t('employee'), t('status'), 'In', 'Out'], rows)
  );
}
