/* ================= PURCHASING ================= */
function rPurch() {
  var h =
    hint('purch') +
    '<div class="grid c2"><div class="card"><h3>' +
    t('supplier') +
    '</h3><div class="frow"><div><label>' +
    t('name') +
    '</label><input id="p_name"></div><div><label>' +
    t('tel') +
    '</label><input id="p_phone"></div><div><label>Supplies</label><input id="p_items" placeholder="Seeds, Trays…"></div><div><label>Location</label><input id="p_loc"></div></div>' +
    '<button class="btn" onclick="if(!p_name.value){alert(t(\'name\')+\'?\');return}DB.sup.push({id:uid(),name:p_name.value,phone:p_phone.value,items:p_items.value,loc:p_loc.value});saveDB();rPurch()"><svg class="ic"><use href="#i-save"/></svg></button>' +
    '<div class="mt">' +
    tbl(
      [t('supplier'), t('tel'), 'Supplies', 'Location', ''],
      DB.sup.map(function (s) {
        return [
          '<b>' + esc(s.name) + '</b>',
          esc(s.phone || ''),
          esc(s.items || ''),
          esc(s.loc || ''),
          '<button class="btn red sm" onclick="DB.sup=DB.sup.filter(function(x){return x.id!==\'' +
            s.id +
            '\'});saveDB();rPurch()">x</button>'
        ];
      })
    ) +
    '</div></div>' +
    '<div class="card"><h3>' +
    t('purch') +
    '</h3><div class="frow"><div><label>' +
    t('date') +
    '</label><input type="date" id="pu_date" value="' +
    today() +
    '"></div><div><label>' +
    t('supplier') +
    '</label><select id="pu_sup"><option value="">—</option>' +
    DB.sup
      .map(function (s) {
        return '<option value="' + s.id + '">' + esc(s.name) + '</option>';
      })
      .join('') +
    '</select></div><div><label>Item</label><select id="pu_item"><option value="+">+ New…</option>' +
    DB.inv
      .map(function (i) {
        return '<option value="' + i.id + '">' + esc(i.name) + '</option>';
      })
      .join('') +
    '</select></div><div><label>New Item</label><input id="pu_new"></div></div>' +
    '<div class="frow"><div><label>' +
    t('qty') +
    '</label><input type="number" id="pu_qty" value="0"></div><div><label>Unit Cost</label><input type="number" id="pu_cost" value="0"></div><div><label>' +
    t('paid') +
    '?</label><select id="pu_paid"><option value="1">' +
    t('paid') +
    '</option><option value="0">' +
    t('credit') +
    '</option></select></div></div>' +
    '<button class="btn" onclick="savePurch()"><svg class="ic"><use href="#i-save"/></svg></button><div class="mt" id="pu_tbl"></div></div></div>';
  document.getElementById('content').innerHTML = h;
  rPurchList();
}
function savePurch() {
  var itemId = pu_item.value,
    q = num(pu_qty.value),
    cost = num(pu_cost.value);
  if (itemId === '+') {
    var n = pu_new.value.trim();
    if (!n) {
      alert('Item?');
      return;
    }
    var it = { id: uid(), name: n, cat: 'Other', qty: 0, unit: 'pcs', price: cost };
    DB.inv.push(it);
    itemId = it.id;
  }
  var it = DB.inv.find(function (x) {
    return x.id === itemId;
  });
  it.qty += q;
  var paid = pu_paid.value === '1';
  DB.purch.push({
    id: uid(),
    date: pu_date.value,
    supId: pu_sup.value,
    itemId: itemId,
    qty: q,
    cost: cost,
    total: q * cost,
    paid: paid
  });
  if (paid)
    DB.exp.push({
      id: uid(),
      date: pu_date.value,
      cat: 'Supplies',
      desc: 'Purchase: ' + it.name + ' ×' + q,
      amount: q * cost
    });
  logAudit('Purchase ' + it.name + ' x' + q + ' — ' + fmt(q * cost));
  saveDB();
  rPurch();
}
function rPurchList() {
  document.getElementById('pu_tbl').innerHTML = tbl(
    [t('date'), t('supplier'), 'Item', t('qty'), t('total'), t('status')],
    DB.purch
      .slice()
      .reverse()
      .map(function (p) {
        var s = DB.sup.find(function (x) {
          return x.id === p.supId;
        });
        var i = DB.inv.find(function (x) {
          return x.id === p.itemId;
        });
        return [
          p.date,
          s ? esc(s.name) : '—',
          i ? esc(i.name) : '—',
          p.qty,
          fmt(p.total),
          p.paid
            ? '<span class="badge g">' + t('paid') + '</span>'
            : '<span class="badge r">' + t('unpaid') + '</span>'
        ];
      })
  );
}
