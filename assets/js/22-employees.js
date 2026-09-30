/* ================= EMPLOYEES ================= */
function rEmp() {
  var ranks = RANKS;
  var h =
    hint('emp') +
    '<div class="card"><div class="toolbar"><select id="er_rank" onchange="rEmpList()"><option value="">' +
    t('all') +
    ' Ranks</option>' +
    ranks
      .map(function (r) {
        return '<option>' + r + '</option>';
      })
      .join('') +
    '</select>' +
    '<button class="btn" onclick="empForm()">+ ' +
    t('employee') +
    '</button>' +
    '<button class="btn blue sm" onclick="exportRows(\'Employees\',DB.emp.map(function(e){return{Name:e.name,Phone:e.phone,Rank:e.rank,Joined:e.joined,Status:e.status,Salary:e.salary}}))">' +
    t('export') +
    '</button></div><div id="emp_tbl"></div></div>' +
    rLoanCard();
  document.getElementById('content').innerHTML = h;
  rEmpList();
  rLoans();
}
function rEmpList() {
  var r = document.getElementById('er_rank').value;
  var rows = DB.emp
    .filter(function (e) {
      return !r || e.rank === r;
    })
    .map(function (e) {
      return [
        '<b>' + esc(e.name) + '</b><br><small>' + esc(e.phone || '') + '</small>',
        '<span class="badge b">' + e.rank + '</span>',
        e.joined || '—',
        fmt(e.salary),
        e.status,
        '<button class="btn gray sm" onclick="empForm(\'' +
          e.id +
          '\')">' +
          t('edit') +
          '</button> <button class="btn red sm" onclick="if(confirm(\'' +
          t('delete') +
          "?')){DB.emp=DB.emp.filter(function(x){return x.id!=='" +
          e.id +
          '\'});saveDB();rEmpList()}">x</button>'
      ];
    });
  document.getElementById('emp_tbl').innerHTML = tbl(
    [t('employee'), 'Rank', 'Joined', 'Salary', t('status'), '/'],
    rows
  );
}
function empForm(id) {
  var e = id
    ? DB.emp.find(function (x) {
        return x.id === id;
      })
    : { name: '', phone: '', rank: 'Worker', joined: today(), salary: 0, status: 'Active' };
  openModal(
    '<h3>' +
      (id ? t('edit') : t('add')) +
      ' ' +
      t('employee') +
      '</h3><div class="frow">' +
      '<div><label>' +
      t('name') +
      '</label><input id="ef_name" value="' +
      esc(e.name) +
      '"></div><div><label>' +
      t('tel') +
      '</label><input id="ef_phone" value="' +
      esc(e.phone || '') +
      '"></div>' +
      '<div><label>Rank</label><select id="ef_rank">' +
      RANKS.concat(e.rank && RANKS.indexOf(e.rank) < 0 ? [e.rank] : [])
        .map(function (r) {
          return '<option' + (r === e.rank ? ' selected' : '') + '>' + r + '</option>';
        })
        .join('') +
      '</select></div>' +
      '<div><label>Joined</label><input type="date" id="ef_joined" value="' +
      (e.joined || today()) +
      '"></div>' +
      '<div><label>Salary</label><input type="number" id="ef_salary" value="' +
      (e.salary || 0) +
      '"></div>' +
      '<div><label>' +
      t('status') +
      '</label><select id="ef_status"><option' +
      (e.status === 'Active' ? ' selected' : '') +
      '>Active</option><option' +
      (e.status !== 'Active' ? ' selected' : '') +
      '>Inactive</option></select></div></div>' +
      '<div class="mt"><button class="btn" onclick="saveEmp(\'' +
      (id || '') +
      '\')"><svg class="ic"><use href="#i-save"/></svg> ' +
      t('save') +
      '</button> <button class="btn gray" onclick="closeModal()">' +
      t('close') +
      '</button></div>'
  );
}
function saveEmp(id) {
  var n = ef_name.value.trim();
  if (!n) {
    alert(t('name') + '?');
    return;
  }
  var d = {
    name: n,
    phone: ef_phone.value,
    rank: ef_rank.value,
    joined: ef_joined.value,
    salary: num(ef_salary.value),
    status: ef_status.value
  };
  if (id) {
    var e = DB.emp.find(function (x) {
      return x.id === id;
    });
    for (var k in d) e[k] = d[k];
  } else {
    d.id = uid();
    DB.emp.push(d);
  }
  logAudit((id ? 'Edited' : 'Added') + ' employee ' + n);
  saveDB();
  closeModal();
  rEmpList();
}
