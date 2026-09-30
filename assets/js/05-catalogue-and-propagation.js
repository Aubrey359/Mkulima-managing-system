/* ================= CATALOGUE & PROPAGATION ================= */
function fmtP(n) {
  n = Number(n) || 0;
  return 'KES ' + (n % 1 ? n.toFixed(2) : n.toLocaleString('en-KE'));
}
function catLabel(c) {
  return c.name.toLowerCase() === c.group.toLowerCase() ? c.name : c.group + ' — ' + c.name;
}
function uiConfirm(msg, yesJs) {
  openModal(
    '<h3>' +
      (LANG === 'sw' ? 'Una uhakika?' : 'Are you sure?') +
      '</h3><p style="margin:10px 0">' +
      msg +
      '</p><div class="rowflex mt"><button class="btn red" onclick="closeModal();' +
      yesJs +
      '">' +
      (LANG === 'sw' ? 'Ndio' : 'Yes') +
      '</button><button class="btn gray" onclick="closeModal()">' +
      (LANG === 'sw' ? 'Hapana' : 'Cancel') +
      '</button></div>'
  );
}
function catGroups(q) {
  var groups = {},
    order = [];
  DB.cat.forEach(function (c) {
    if (q && (c.group + ' ' + c.name).toLowerCase().indexOf(q) < 0) return;
    if (!groups[c.group]) {
      groups[c.group] = [];
      order.push(c.group);
    }
    groups[c.group].push(c);
  });
  return { groups: groups, order: order };
}
function catOptions() {
  var g = catGroups('');
  return g.order
    .map(function (n) {
      return (
        '<optgroup label="' +
        esc(n) +
        '">' +
        g.groups[n]
          .map(function (c) {
            return '<option value="c:' + c.id + '">' + esc(c.name) + ' — KES ' + c.price + '</option>';
          })
          .join('') +
        '</optgroup>'
      );
    })
    .join('');
}
function rCat() {
  var h =
    hint('cat') +
    '<div class="card"><div class="toolbar">' +
    '<input id="cat_q" placeholder="Search crop or variety" oninput="rCatList()" style="min-width:220px">' +
    (isLoise() ? '<button class="btn sm" onclick="catForm()">+ Add Seedling</button>' : '') +
    '<button class="btn amber sm" onclick="printPriceList()"><svg class="ic"><use href="#i-printer"/></svg> Print Price List</button></div>' +
    '<p style="font-size:12px;color:var(--muted);margin-bottom:6px">Standard price per seedling in KES. When selling you can still type a different (custom) price on any sale line.</p><div id="cat_list"></div></div>';
  document.getElementById('content').innerHTML = h;
  rCatList();
}
function rCatList() {
  var q = (document.getElementById('cat_q').value || '').toLowerCase();
  var g = catGroups(q);
  if (!g.order.length) {
    document.getElementById('cat_list').innerHTML = '<div class="empty">' + t('nothing') + '</div>';
    return;
  }
  document.getElementById('cat_list').innerHTML = g.order
    .map(function (name) {
      var rows = g.groups[name].map(function (c) {
        return [
          esc(c.name),
          '<b>' + fmtP(c.price) + (isManure(c.name) ? ' / sack' : '') + '</b>',
          isLoise()
            ? '<button class="btn gray sm" onclick="catForm(\'' +
              c.id +
              '\')">' +
              t('edit') +
              '</button> <button class="btn red sm" onclick="catDel(\'' +
              c.id +
              '\')">x</button>'
            : ''
        ];
      });
      return (
        '<div class="card" style="margin:10px 0"><h3><svg class="ic"><use href="#i-sprout"/></svg> ' +
        esc(name) +
        ' <span class="badge gr">' +
        g.groups[name].length +
        '</span></h3>' +
        tbl(['Variety', 'Price / seedling', ''], rows) +
        '</div>'
      );
    })
    .join('');
}
function catForm(id) {
  var c = id
    ? DB.cat.find(function (x) {
        return x.id === id;
      })
    : { group: '', name: '', price: '' };
  var groups = [];
  DB.cat.forEach(function (x) {
    if (groups.indexOf(x.group) < 0) groups.push(x.group);
  });
  openModal(
    '<h3>' +
      (id ? t('edit') : t('add')) +
      ' Seedling</h3><div class="frow"><div><label>Crop / Group</label><input id="cg_group" list="cg_dl" value="' +
      esc(c.group) +
      '"><datalist id="cg_dl">' +
      groups
        .map(function (g) {
          return '<option value="' + esc(g) + '">';
        })
        .join('') +
      '</datalist></div>' +
      '<div><label>Variety</label><input id="cg_name" value="' +
      esc(c.name) +
      '"></div><div><label>Price (KES)</label><input type="number" step="0.5" id="cg_price" value="' +
      c.price +
      '"></div></div>' +
      '<div class="mt"><button class="btn" onclick="catSave(\'' +
      (id || '') +
      '\')"><svg class="ic"><use href="#i-save"/></svg> ' +
      t('save') +
      '</button> <button class="btn gray" onclick="closeModal()">' +
      t('close') +
      '</button></div>'
  );
}
function catSave(id) {
  var g = document.getElementById('cg_group').value.trim(),
    n = document.getElementById('cg_name').value.trim(),
    p = Number(document.getElementById('cg_price').value);
  if (!g || !n || !(p >= 0)) {
    alert('Crop, variety and price are all needed');
    return;
  }
  if (id) {
    var c = DB.cat.find(function (x) {
      return x.id === id;
    });
    c.group = g;
    c.name = n;
    c.price = p;
    logAudit('Edited catalogue: ' + catLabel(c) + ' → KES ' + p);
  } else {
    DB.cat.push({ id: uid(), group: g, name: n, price: p });
    logAudit('Added to catalogue: ' + g + ' — ' + n + ' KES ' + p);
  }
  saveDB();
  closeModal();
  rCat();
}
function catDel(id) {
  var c = DB.cat.find(function (x) {
    return x.id === id;
  });
  uiConfirm('Remove <b>' + esc(catLabel(c)) + '</b> from the catalogue?', "catDoDel('" + id + "')");
}
function catDoDel(id) {
  var c = DB.cat.find(function (x) {
    return x.id === id;
  });
  DB.cat = DB.cat.filter(function (x) {
    return x.id !== id;
  });
  logAudit('Removed from catalogue: ' + (c ? catLabel(c) : id));
  saveDB();
  rCat();
}
function printPriceList() {
  var g = catGroups('');
  var rows = [];
  g.order.forEach(function (name) {
    g.groups[name].forEach(function (c, i) {
      rows.push([i === 0 ? '<b>' + esc(name) + '</b>' : '', esc(c.name), fmtP(c.price)]);
    });
  });
  printHTML(
    '<h2>Seedling Price List — ' +
      today() +
      '</h2>' +
      tbl(['Crop', 'Variety', 'Price per seedling'], rows) +
      '<p style="font-size:11px;margin-top:8px;color:#555">All prices in Kenya Shillings (KES).</p>'
  );
}
