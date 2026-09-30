/* ================= DELIVERY helpers ================= */
function bTypeToggle() {
  document.getElementById('b_addr_wrap').style.display =
    document.getElementById('b_type').value === 'Delivery' ? '' : 'none';
}
function oHandToggle() {
  var l = document.getElementById('o_hand').value === 'later';
  document.getElementById('o_dwrap').style.display = l ? '' : 'none';
  document.getElementById('o_awrap').style.display = l ? '' : 'none';
}
function delivTag(o) {
  if (!o.deliver) return '';
  return (
    '<br>' +
    (o.deliver.done
      ? '<span class="badge g"><svg class="ic"><use href="#i-truck"/></svg> Delivered ' +
        (o.deliver.doneOn || '') +
        '</span>'
      : '<span class="badge b"><svg class="ic"><use href="#i-truck"/></svg> Deliver ' +
        esc(o.deliver.date || '') +
        (o.deliver.addr ? ' · ' + esc(o.deliver.addr) : '') +
        '</span> <button class="btn sm" onclick="delivDone(\'' +
        o.id +
        '\')"><svg class="ic"><use href="#i-check"/></svg> Delivered</button> <button class="btn amber sm" onclick="reschedModal(\'order\',\'' +
        o.id +
        '\')"><svg class="ic"><use href="#i-calendar"/></svg></button>')
  );
}
function delivDone(id) {
  var o = DB.orders.find(function (x) {
    return x.id === id;
  });
  if (!o || !o.deliver) return;
  o.deliver.done = true;
  o.deliver.doneOn = today();
  logAudit('Delivered ' + o.no + ' — ' + custName(o.custId));
  saveDB();
  applyOrderFilters();
}
