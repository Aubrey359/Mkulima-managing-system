/* ================= NAV ================= */
function buildNav() {
  var h = '';
  ROLES[session.role].nav.forEach(function (id) {
    h +=
      '<div class="navItem" id="nav_' +
      id +
      '" title="' +
      TIPS[id] +
      '" onclick="go(\'' +
      id +
      '\')">' +
      NAV[id][0] +
      ' <span data-i18n="' +
      id +
      '">' +
      NAV[id][1] +
      '</span></div>';
  });
  document.getElementById('navList').innerHTML = h;
}
function go(id) {
  CUR = id;
  TAB[id] = TAB[id] || 0;
  document.body.classList.remove('mobileNavOpen');
  document.querySelectorAll('.navItem').forEach(function (e) {
    e.classList.remove('active');
  });
  var nv = document.getElementById('nav_' + id);
  if (nv) nv.classList.add('active');
  document.getElementById('pageTitle').textContent = t(id);
  ({
    dash: rDash,
    sales: rSales,
    book: rBook,
    inv: rInv,
    sow: rSow,
    crm: rCRM,
    cat: rCat,
    prop: rProp,
    man: rMan,
    acc: rAcc,
    emp: rEmp,
    att: rAtt,
    purch: rPurch,
    rep: rRep,
    set: rSet
  })[id]();
}
