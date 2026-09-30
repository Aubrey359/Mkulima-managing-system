/* ================= INVENTORY ================= */
function rInv() {
  var cats = ['Seedlings', 'Seeds', 'Trays', 'Cocopeat', 'Other'];
  var h =
    hint('inv') +
    '<div class="card"><h3>' +
    t('add') +
    ' — Stock</h3><div class="frow">' +
    '<div><label>Item</label><input id="i_name"></div><div><label>Category</label><select id="i_cat">' +
    cats
      .map(function (c) {
        return '<option>' + c + '</option>';
      })
      .join('') +
    '</select></div>' +
    '<div><label>' +
    t('qty') +
    '</label><input type="number" id="i_qty" value="0"></div><div><label>Unit</label><select id="i_unit"><option>pcs</option><option>trays</option><option>kg</option><option>bags</option><option>litres</option></select></div>' +
    '<div><label>' +
    t('price') +
    '</label><input type="number" id="i_price" value="0"></div></div>' +
    '<button class="btn" onclick="var n=i_name.value.trim();if(!n){alert(\'Name?\');return}DB.inv.push({id:uid(),name:n,cat:i_cat.value,qty:num(i_qty.value),unit:i_unit.value,price:num(i_price.value)});saveDB();rInv()"><svg class="ic"><use href="#i-save"/></svg> ' +
    t('save') +
    '</button></div>' +
    '<div class="card"><div class="toolbar"><select id="i_fcat" onchange="rInvList()"><option value="">' +
    t('all') +
    '</option>' +
    cats
      .map(function (c) {
        return '<option>' + c + '</option>';
      })
      .join('') +
    '</select><input id="i_fq" placeholder="' +
    t('search') +
    '" oninput="rInvList()">' +
    '<button class="btn blue sm" onclick="exportRows(\'Inventory\',DB.inv.map(function(i){return{Name:i.name,Category:i.cat,Qty:i.qty,Unit:i.unit,Price:i.price,Value:i.qty*i.price}}))">' +
    t('export') +
    '</button>' +
    '<button class="btn sm" onclick="printInv()"><svg class="ic"><use href="#i-printer"/></svg> ' +
    t('print') +
    '</button>' +
    '<button class="btn amber sm" onclick="printPriceList()"><svg class="ic"><use href="#i-tag"/></svg> Price List</button></div><div id="inv_tbl"></div></div>';
  document.getElementById('content').innerHTML = h;
  rInvList();
}
function rInvList() {
  var q = (document.getElementById('i_fq').value || '').toLowerCase(),
    c = document.getElementById('i_fcat').value;
  var rows = DB.inv
    .filter(function (i) {
      return (!c || i.cat === c) && i.name.toLowerCase().indexOf(q) >= 0;
    })
    .map(function (i) {
      return [
        esc(i.name),
        i.cat,
        i.qty + ' ' + i.unit,
        fmt(i.price),
        fmt(i.qty * i.price),
        '<button class="btn sm" onclick="invAdj(\'' +
          i.id +
          '\',1)">+ In</button> <button class="btn amber sm" onclick="invAdj(\'' +
          i.id +
          '\',-1)">− Out</button> <button class="btn red sm" onclick="DB.inv=DB.inv.filter(function(x){return x.id!==\'' +
          i.id +
          '\'});saveDB();rInvList()">x</button>'
      ];
    });
  document.getElementById('inv_tbl').innerHTML = tbl(
    ['Item', 'Category', 'Qty', t('price'), 'Value', '/'],
    rows
  );
}
function invAdj(id, dir) {
  var it = DB.inv.find(function (x) {
    return x.id === id;
  });
  var q = num(prompt((dir > 0 ? 'Stock IN — qty for ' : 'Stock OUT — qty for ') + it.name + ':', '0'));
  if (!q) return;
  it.qty += dir * q;
  logAudit('Stock ' + (dir > 0 ? 'IN' : 'OUT') + ' ' + it.name + ' x' + q);
  saveDB();
  rInvList();
}
function printInv() {
  var val = DB.inv.reduce(function (a, i) {
    return a + num(i.qty) * num(i.price);
  }, 0);
  printHTML(
    '<h2>' +
      t('inv') +
      ' — ' +
      today() +
      '</h2>' +
      tbl(
        ['Item', 'Category', 'Qty', 'Unit', t('price'), 'Value'],
        DB.inv.map(function (i) {
          return [esc(i.name), i.cat, i.qty, i.unit, fmt(i.price), fmt(i.qty * i.price)];
        })
      ) +
      '<h3 class="right">' +
      t('total') +
      ' ' +
      t('inv') +
      ': ' +
      fmt(val) +
      '</h3>'
  );
}
