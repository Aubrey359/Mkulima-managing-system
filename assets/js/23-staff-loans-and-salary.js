/* ================= STAFF LOANS & SALARY ================= */
function empLoans(eid) {
  return DB.loans.filter(function (l) {
    return l.empId === eid;
  });
}
function loanRepaid(lid) {
  var s = 0;
  DB.loanpay.forEach(function (r) {
    if (r.loanId === lid) s += num(r.amount);
  });
  return s;
}
function loanOutstanding(l) {
  return Math.max(0, num(l.principal) - loanRepaid(l.id));
}
function openLoans(eid) {
  return empLoans(eid)
    .filter(function (l) {
      return l.status !== 'Written off' && loanOutstanding(l) > 0;
    })
    .sort(function (a, b) {
      return a.date < b.date ? -1 : 1;
    });
}
function loanBal(eid) {
  return openLoans(eid).reduce(function (a, l) {
    return a + loanOutstanding(l);
  }, 0);
}
function plannedDeduction(eid) {
  var b = loanBal(eid);
  if (!b) return 0;
  var per = openLoans(eid).reduce(function (a, l) {
    return a + num(l.perMonth);
  }, 0);
  return Math.min(b, per || b);
}
function paidThisMonth(eid, m) {
  return DB.payroll.some(function (p) {
    return p.empId === eid && p.month === m;
  });
}

function rLoanCard() {
  var tot = DB.emp.reduce(function (a, e) {
    return a + loanBal(e.id);
  }, 0);
  var m = today().slice(0, 7);
  var owing = DB.emp.filter(function (e) {
    return loanBal(e.id) > 0;
  });
  return (
    '<div class="card"><h3><svg class="ic"><use href="#i-money"/></svg> Staff loans &amp; salary</h3>' +
    '<div class="grid c3"><div class="stat"><span>Total still owed by staff</span><b>' +
    fmt(tot) +
    '</b></div>' +
    '<div class="stat"><span>Staff with a loan</span><b>' +
    owing.length +
    '</b></div>' +
    '<div class="stat"><span>Salaries paid this month</span><b>' +
    DB.payroll.filter(function (p) {
      return p.month === m;
    }).length +
    ' of ' +
    DB.emp.filter(function (e) {
      return e.status === 'Active';
    }).length +
    '</b></div></div>' +
    '<div class="toolbar mt"><button class="btn" onclick="loanForm()">+ Give a loan or advance</button>' +
    '<button class="btn gray sm" onclick="printLoans()"><svg class="ic"><use href="#i-printer"/></svg> Print loan summary</button></div>' +
    '<div id="loan_tbl"></div></div>'
  );
}

function rLoans() {
  var m = today().slice(0, 7);
  var rows = DB.emp
    .filter(function (e) {
      return e.status === 'Active' || loanBal(e.id) > 0;
    })
    .map(function (e) {
      var bal = loanBal(e.id),
        ded = plannedDeduction(e.id),
        paid = paidThisMonth(e.id, m);
      var net = num(e.salary) - ded;
      return [
        '<b>' + esc(e.name) + '</b><br><small>' + esc(e.rank || '') + '</small>',
        fmt(e.salary),
        bal > 0 ? '<span class="low">' + fmt(bal) + '</span>' : '<span class="badge g">Clear</span>',
        bal > 0 ? fmt(ded) + '<br><small>per month</small>' : '—',
        bal > 0 ? '<b>' + fmt(net) + '</b>' : '<b>' + fmt(e.salary) + '</b>',
        paid ? '<span class="badge g">Paid ' + m + '</span>' : '<span class="badge a">Not yet</span>',
        '<button class="btn sm" onclick="payrollForm(\'' +
          e.id +
          '\')"><svg class="ic"><use href="#i-cash"/></svg> Pay salary</button> ' +
          (bal > 0
            ? '<button class="btn amber sm" onclick="repayForm(\'' + e.id + '\')">Cash repayment</button> '
            : '') +
          '<button class="btn gray sm" onclick="loanStatement(\'' +
          e.id +
          '\')"><svg class="ic"><use href="#i-file"/></svg></button>'
      ];
    });
  var ln = DB.loans
    .slice()
    .reverse()
    .map(function (l) {
      var out = loanOutstanding(l);
      return [
        l.date,
        esc(empName(l.empId)),
        esc(l.kind || 'Loan'),
        fmt(l.principal),
        fmt(num(l.principal) - out),
        out > 0 ? '<span class="low">' + fmt(out) + '</span>' : '<span class="badge g">Cleared</span>',
        l.perMonth ? fmt(l.perMonth) : '—',
        esc(l.note || ''),
        '<button class="btn gray sm" onclick="loanEdit(\'' +
          l.id +
          '\')"><svg class="ic"><use href="#i-pencil"/></svg></button> ' +
          '<button class="btn red sm" onclick="loanDel(\'' +
          l.id +
          '\')"><svg class="ic"><use href="#i-x"/></svg></button>'
      ];
    });
  var rp = DB.loanpay
    .slice()
    .reverse()
    .slice(0, 40)
    .map(function (r) {
      return [
        r.date,
        esc(empName(r.empId)),
        esc(r.method),
        fmt(r.amount),
        esc(r.note || ''),
        '<button class="btn red sm" onclick="repayDel(\'' +
          r.id +
          '\')"><svg class="ic"><use href="#i-x"/></svg></button>'
      ];
    });
  document.getElementById('loan_tbl').innerHTML =
    '<h3 class="mt">This month’s pay</h3>' +
    tbl(['Employee', 'Salary', 'Loan balance', 'Deduction', 'Net to pay', 'Status', ''], rows) +
    '<h3 class="mt">Loans given</h3>' +
    tbl(['Date', 'Employee', 'Type', 'Amount', 'Repaid', 'Still owed', 'Monthly', 'Note', ''], ln) +
    '<h3 class="mt">Repayments</h3>' +
    tbl(['Date', 'Employee', 'How', 'Amount', 'Note', ''], rp);
}

function loanForm(id) {
  var l = id
    ? DB.loans.find(function (x) {
        return x.id === id;
      })
    : null;
  var opts = DB.emp
    .filter(function (e) {
      return e.status === 'Active' || (l && l.empId === e.id);
    })
    .map(function (e) {
      return (
        '<option value="' +
        e.id +
        '"' +
        (l && l.empId === e.id ? ' selected' : '') +
        '>' +
        esc(e.name) +
        '</option>'
      );
    })
    .join('');
  openModal(
    '<h3>' +
      (l ? 'Edit loan' : 'Give a loan or advance') +
      '</h3>' +
      '<div class="frow"><div><label>Employee</label><select id="lf_emp">' +
      opts +
      '</select></div>' +
      '<div><label>Type</label><select id="lf_kind"><option' +
      (l && l.kind === 'Advance' ? ' selected' : '') +
      '>Loan</option><option' +
      (l && l.kind === 'Advance' ? ' selected' : '') +
      '>Advance</option></select></div>' +
      '<div><label>Amount given (KES)</label><input type="number" id="lf_amt" value="' +
      (l ? l.principal : '') +
      '"></div></div>' +
      '<div class="frow"><div><label>Date given</label><input type="date" id="lf_date" value="' +
      (l ? l.date : today()) +
      '"></div>' +
      '<div><label>Deduct per month (KES)</label><input type="number" id="lf_per" value="' +
      (l ? l.perMonth : '') +
      '" placeholder="e.g. 2000"></div></div>' +
      '<label>Note</label><input id="lf_note" value="' +
      (l ? esc(l.note || '') : '') +
      '">' +
      (l
        ? ''
        : '<label class="swRow mt"><input type="checkbox" id="lf_cash" checked> Record the cash leaving the till today</label>') +
      '<p style="font-size:12px;color:var(--muted);margin-top:6px">The monthly amount is deducted automatically when you pay this person’s salary. You can change it on the day.</p>' +
      '<div class="mt"><button class="btn" onclick="loanSave(\'' +
      (id || '') +
      '\')"><svg class="ic"><use href="#i-save"/></svg> Save</button> <button class="btn gray" onclick="closeModal()">' +
      t('close') +
      '</button></div>'
  );
}

function loanSave(id) {
  var amt = num(document.getElementById('lf_amt').value);
  if (!amt) {
    alert('How much was given?');
    return;
  }
  var eid = document.getElementById('lf_emp').value,
    per = num(document.getElementById('lf_per').value);
  var kind = document.getElementById('lf_kind').value,
    dt = document.getElementById('lf_date').value,
    note = document.getElementById('lf_note').value;
  if (per > amt) {
    alert('The monthly deduction cannot be more than the loan itself.');
    return;
  }
  if (id) {
    var l = DB.loans.find(function (x) {
      return x.id === id;
    });
    if (amt < loanRepaid(id)) {
      alert('This loan already has ' + fmt(loanRepaid(id)) + ' repaid. The amount cannot be less than that.');
      return;
    }
    l.empId = eid;
    l.principal = amt;
    l.perMonth = per;
    l.kind = kind;
    l.date = dt;
    l.note = note;
    logAudit('Edited loan for ' + empName(eid) + ' — ' + fmt(amt));
  } else {
    DB.loans.push({
      id: uid(),
      empId: eid,
      principal: amt,
      perMonth: per,
      kind: kind,
      date: dt,
      note: note,
      status: 'Open'
    });
    var cb = document.getElementById('lf_cash');
    if (cb && cb.checked)
      DB.exp.push({
        id: uid(),
        date: dt,
        cat: 'Staff loan',
        desc: kind + ' to ' + empName(eid),
        amount: amt
      });
    logAudit('Gave ' + kind.toLowerCase() + ' to ' + empName(eid) + ' — ' + fmt(amt));
  }
  saveDB();
  closeModal();
  rEmp();
}

function loanDel(id) {
  var l = DB.loans.find(function (x) {
    return x.id === id;
  });
  if (!l) return;
  var r = loanRepaid(id);
  uiConfirm(
    'Delete this ' +
      (l.kind || 'loan').toLowerCase() +
      ' of <b>' +
      fmt(l.principal) +
      '</b> for ' +
      esc(empName(l.empId)) +
      '?' +
      (r > 0
        ? '<br><br><b>' +
          fmt(r) +
          '</b> has already been repaid against it. Those repayment records will be deleted too.'
        : ''),
    "loanDoDel('" + id + "')"
  );
}
function loanDoDel(id) {
  var l = DB.loans.find(function (x) {
    return x.id === id;
  });
  DB.loanpay = DB.loanpay.filter(function (r) {
    return r.loanId !== id;
  });
  DB.loans = DB.loans.filter(function (x) {
    return x.id !== id;
  });
  logAudit('Deleted loan for ' + (l ? empName(l.empId) : id));
  saveDB();
  rEmp();
}

/* apply an amount across a person's open loans, oldest first */
function applyRepayment(eid, amount, date, method, note, payrollId) {
  var left = num(amount),
    made = [];
  openLoans(eid).forEach(function (l) {
    if (left <= 0) return;
    var take = Math.min(left, loanOutstanding(l));
    if (take <= 0) return;
    var rec = {
      id: uid(),
      loanId: l.id,
      empId: eid,
      amount: take,
      date: date,
      method: method,
      note: note || '',
      payrollId: payrollId || null
    };
    DB.loanpay.push(rec);
    made.push(rec);
    left -= take;
  });
  return num(amount) - left;
}

function repayForm(eid) {
  var bal = loanBal(eid);
  openModal(
    '<h3>Cash repayment — ' +
      esc(empName(eid)) +
      '</h3>' +
      '<p style="font-size:13px;color:var(--muted);margin-bottom:10px">Use this only when the money is handed back outside the salary. Still owed: <b>' +
      fmt(bal) +
      '</b></p>' +
      '<div class="frow"><div><label>Amount</label><input type="number" id="rp_amt" value="' +
      bal +
      '"></div>' +
      '<div><label>How</label><select id="rp_m"><option>Cash</option><option>M-Pesa</option><option>Bank</option></select></div>' +
      '<div><label>Date</label><input type="date" id="rp_d" value="' +
      today() +
      '"></div></div>' +
      '<label>Note</label><input id="rp_note">' +
      '<div class="mt"><button class="btn" onclick="repaySave(\'' +
      eid +
      '\')"><svg class="ic"><use href="#i-save"/></svg> Save</button> <button class="btn gray" onclick="closeModal()">' +
      t('close') +
      '</button></div>'
  );
}
function repaySave(eid) {
  var amt = num(document.getElementById('rp_amt').value),
    bal = loanBal(eid);
  if (!amt) {
    alert('Amount?');
    return;
  }
  if (amt > bal) {
    alert('That is more than the ' + fmt(bal) + ' still owed.');
    return;
  }
  applyRepayment(
    eid,
    amt,
    document.getElementById('rp_d').value,
    document.getElementById('rp_m').value,
    document.getElementById('rp_note').value,
    null
  );
  logAudit('Loan repayment from ' + empName(eid) + ' — ' + fmt(amt));
  saveDB();
  closeModal();
  rEmp();
}
function repayDel(id) {
  var r = DB.loanpay.find(function (x) {
    return x.id === id;
  });
  if (!r) return;
  uiConfirm(
    'Remove this repayment of <b>' +
      fmt(r.amount) +
      '</b> by ' +
      esc(empName(r.empId)) +
      '? The amount goes back onto what they owe.',
    "repayDoDel('" + id + "')"
  );
}
function repayDoDel(id) {
  var r = DB.loanpay.find(function (x) {
    return x.id === id;
  });
  DB.loanpay = DB.loanpay.filter(function (x) {
    return x.id !== id;
  });
  logAudit('Removed repayment ' + (r ? fmt(r.amount) + ' by ' + empName(r.empId) : id));
  saveDB();
  rEmp();
}

/* ---- pay salary, with the loan deduction built in ---- */
function payrollForm(eid) {
  var e = DB.emp.find(function (x) {
    return x.id === eid;
  });
  if (!e) return;
  var bal = loanBal(eid),
    ded = plannedDeduction(eid),
    m = today().slice(0, 7);
  openModal(
    '<h3><svg class="ic"><use href="#i-cash"/></svg> Pay salary — ' +
      esc(e.name) +
      '</h3>' +
      (paidThisMonth(eid, m)
        ? '<div class="bkWarn" style="margin-bottom:10px">A salary for ' +
          m +
          ' is already recorded for this person.</div>'
        : '') +
      '<div class="frow"><div><label>Month</label><input type="month" id="py_m" value="' +
      m +
      '"></div>' +
      '<div><label>Pay date</label><input type="date" id="py_d" value="' +
      today() +
      '"></div>' +
      '<div><label>How</label><select id="py_method"><option>Cash</option><option>M-Pesa</option><option>Bank</option></select></div></div>' +
      '<div class="frow"><div><label>Salary (gross)</label><input type="number" id="py_gross" value="' +
      num(e.salary) +
      '" oninput="payrollCalc()"></div>' +
      '<div><label>Loan deduction</label><input type="number" id="py_ded" value="' +
      ded +
      '" oninput="payrollCalc()"></div>' +
      '<div><label>Other deduction</label><input type="number" id="py_other" value="0" oninput="payrollCalc()"></div>' +
      '<div><label>Net paid out</label><input id="py_net" readonly></div></div>' +
      '<p id="py_note2" style="font-size:12.5px;color:var(--muted)"></p>' +
      '<label>Note</label><input id="py_note">' +
      '<div class="mt"><button class="btn" onclick="payrollSave(\'' +
      eid +
      '\')"><svg class="ic"><use href="#i-save"/></svg> Record payment</button> <button class="btn gray" onclick="closeModal()">' +
      t('close') +
      '</button></div>'
  );
  window.__pyBal = bal;
  payrollCalc();
}
function payrollCalc() {
  var g = num(document.getElementById('py_gross').value),
    d = num(document.getElementById('py_ded').value),
    o = num(document.getElementById('py_other').value);
  var bal = num(window.__pyBal);
  if (d > bal) {
    d = bal;
    document.getElementById('py_ded').value = bal;
  }
  if (d + o > g) {
    document.getElementById('py_note2').innerHTML =
      '<span style="color:var(--red)">Deductions are more than the salary. Lower them.</span>';
  } else
    document.getElementById('py_note2').textContent = bal
      ? 'Loan balance now ' + fmt(bal) + ' — after this deduction it becomes ' + fmt(bal - d) + '.'
      : 'This person has no loan.';
  document.getElementById('py_net').value = fmt(Math.max(0, g - d - o));
}
function payrollSave(eid) {
  var g = num(document.getElementById('py_gross').value),
    d = num(document.getElementById('py_ded').value),
    o = num(document.getElementById('py_other').value),
    dt = document.getElementById('py_d').value,
    m = document.getElementById('py_m').value,
    method = document.getElementById('py_method').value,
    note = document.getElementById('py_note').value;
  if (!g) {
    alert('Salary amount?');
    return;
  }
  if (d + o > g) {
    alert('Deductions are more than the salary.');
    return;
  }
  var net = g - d - o,
    pid = uid();
  var applied =
    d > 0 ? applyRepayment(eid, d, dt, 'Salary deduction', 'Deducted from ' + m + ' salary', pid) : 0;
  DB.payroll.push({
    id: pid,
    empId: eid,
    month: m,
    date: dt,
    gross: g,
    loanDed: applied,
    otherDed: o,
    net: net,
    method: method,
    note: note
  });
  DB.exp.push({
    id: uid(),
    date: dt,
    cat: 'Salaries',
    desc:
      'Salary ' + m + ' — ' + empName(eid) + (applied ? ' (after ' + fmt(applied) + ' loan deduction)' : ''),
    amount: net
  });
  logAudit(
    'Paid salary ' +
      m +
      ' to ' +
      empName(eid) +
      ' — net ' +
      fmt(net) +
      (applied ? ', loan deduction ' + fmt(applied) : '')
  );
  saveDB();
  closeModal();
  rEmp();
  payslip(pid);
}
function payslip(pid) {
  var p = DB.payroll.find(function (x) {
    return x.id === pid;
  });
  if (!p) return;
  var e =
    DB.emp.find(function (x) {
      return x.id === p.empId;
    }) || {};
  printHTML(
    '<h2>Payslip — ' +
      p.month +
      '</h2>' +
      tbl(
        ['Field', 'Details'],
        [
          ['Employee', esc(e.name || '')],
          ['Rank', esc(e.rank || '—')],
          ['Month', p.month],
          ['Paid on', p.date],
          ['Paid by', esc(p.method)]
        ]
      ) +
      '<h3 class="mt">Payment</h3>' +
      tbl(
        ['Item', 'KES'],
        [
          ['Salary', fmt(p.gross)],
          ['Less loan deduction', '-' + fmt(p.loanDed)],
          ['Less other deduction', '-' + fmt(p.otherDed)],
          ['<b>Net paid</b>', '<b>' + fmt(p.net) + '</b>']
        ]
      ) +
      '<p class="mt" style="font-size:12.5px">Loan balance after this payment: <b>' +
      fmt(loanBal(p.empId)) +
      '</b></p>' +
      '<div style="margin-top:40px;display:flex;justify-content:space-between"><div>Received by:<br><br>____________________</div><div>Paid by: ' +
      esc(session ? session.u : '') +
      '<br><br>____________________</div></div>'
  );
}
function loanStatement(eid) {
  var e =
    DB.emp.find(function (x) {
      return x.id === eid;
    }) || {};
  var rows = [];
  empLoans(eid).forEach(function (l) {
    rows.push([l.date, (l.kind || 'Loan') + ' given', fmt(l.principal), '', esc(l.note || '')]);
    DB.loanpay
      .filter(function (r) {
        return r.loanId === l.id;
      })
      .sort(function (a, b) {
        return a.date < b.date ? -1 : 1;
      })
      .forEach(function (r) {
        rows.push([r.date, 'Repaid — ' + esc(r.method), '', fmt(r.amount), esc(r.note || '')]);
      });
  });
  printHTML(
    '<h2>Staff loan statement</h2><p><b>' +
      esc(e.name || '') +
      '</b> — ' +
      esc(e.rank || '') +
      '</p>' +
      tbl(['Date', 'Item', 'Loaned', 'Repaid', 'Note'], rows) +
      '<h3 class="right mt">Still owed: ' +
      fmt(loanBal(eid)) +
      '</h3>'
  );
}
function printLoans() {
  var rows = DB.emp
    .filter(function (e) {
      return e.status === 'Active' || loanBal(e.id) > 0;
    })
    .map(function (e) {
      return [
        esc(e.name),
        esc(e.rank || ''),
        fmt(e.salary),
        fmt(loanBal(e.id)),
        fmt(plannedDeduction(e.id)),
        fmt(num(e.salary) - plannedDeduction(e.id))
      ];
    });
  printHTML(
    '<h2>Staff loans &amp; salary — ' +
      today() +
      '</h2>' +
      tbl(['Employee', 'Rank', 'Salary', 'Still owed', 'Monthly deduction', 'Net if paid today'], rows) +
      '<h3 class="right mt">Total owed by staff: ' +
      fmt(
        DB.emp.reduce(function (a, e) {
          return a + loanBal(e.id);
        }, 0)
      ) +
      '</h3>'
  );
}
