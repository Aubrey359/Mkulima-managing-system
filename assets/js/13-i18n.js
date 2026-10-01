/* ================= I18N ================= */
var SW = {
  docs: 'Nyaraka',
  orderbook: 'Kitabu cha Oda',
  receipt: 'Risiti',
  saved: 'Imehifadhiwa',
  needpay: 'wateja wanaodaiwa',
  autofill: 'Hujaza yenyewe',
  man: 'Mbolea',
  cat: 'Orodha ya Miche',
  prop: 'Uzalishaji wa Miche',
  dashboard: 'Dashibodi',
  sales: 'Mauzo',
  book: 'Bookings',
  inv: 'Stoka',
  sow: 'Kitabu cha Kupanda',
  crm: 'Wateja',
  acc: 'Uhasibu',
  emp: 'Wafanyakazi',
  att: 'Mahudhurio',
  purch: 'Ununuzi',
  rep: 'Ripoti',
  set: 'Mipangilio',
  logout: 'Ondoka',
  skip: 'Ruka Mafunzo',
  back: 'Rudi',
  next: 'Endelea',
  save: 'Hifadhi',
  print: 'Chapisha',
  export: 'Hamisha nje (Excel)',
  import: 'Leta (Excel/Word)',
  search: 'Tafuta',
  total: 'Jumla',
  date: 'Tarehe',
  name: 'Jina',
  qty: 'Kiasi',
  price: 'Bei',
  amount: 'Kiasi cha fedha',
  status: 'Hali',
  actions: 'Vitendo',
  customer: 'Mteja',
  employee: 'Mfanyakazi',
  close: 'Funga',
  delete: 'Futa',
  edit: 'Badilisha',
  all: 'Wote',
  email: 'Barua pepe',
  tel: 'Simu',
  printed: 'Imechapishwa',
  by: 'Na',
  nothing: 'Hakuna taarifa bado',
  enterpass: 'Weka nenosiri',
  wrongpass: 'Nenosiri si sahihi. Jaribu tena.',
  present: 'Yupo',
  absent: 'Hayupo',
  leave: 'Likizo',
  pending: 'Inasubiri',
  ready: 'Iko tayari',
  picked: 'Imechukuliwa',
  paid: 'Imelipwa',
  unpaid: 'Hajalipa',
  credit: 'Deni',
  cash: 'Pesa taslimu',
  mpesa: 'M-Pesa',
  bank: 'Benki',
  call: 'Simu',
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  visit: 'Mahojiano',
  notes: 'Maelezo',
  variety: 'Aina',
  crop: 'Mimea',
  contact: 'Mawasiliano',
  supplier: 'Msambazaji',
  add: 'Ongeza',
  grand: 'Jumla Kuu',
  balance: 'Salio',
  owed: 'Deni',
  method: 'Njia',
  confirmed: 'Imethibitishwa',
  tended: 'Aliyehudumia',
  communicated: 'Alivyowasiliana',
  lastbought: 'Alinunua Mwisho',
  password: 'Nenosiri',
  expenses: 'Matumizi',
  chart: 'Chati',
  calendar: 'Kalenda',
  pricehist: 'Historia ya Bei',
  recent: 'Hivi Karibuni',
  newcust: 'Mteja Mpya',
  discount: 'Punguzo',
  vat: 'VAT (16%)',
  subtotal: 'Jumla Ndogo',
  receive: 'Pokea Malipo',
  statement: 'Taarifa ya Mteja',
  follow: 'Fuatilia',
  needfu: 'Inahitaji Ufuatiliaji',
  settle: 'Imelipwa Kabisa',
  zreport: 'Muhtasari wa Siku (Z)',
  theme: 'Mandhari',
  top: 'Bora Zaidi',
  least: 'Chini Zaidi',
  valid: 'Inaisha',
  terms: 'Masharti',
  prepared: 'Imeandaliwa na'
};
function t(k) {
  if (LANG === 'sw' && SW[k]) return SW[k];
  if (EN[k]) return EN[k];
  if (NAV[k]) return NAV[k][1];
  return k;
}
function applyLang() {
  document.querySelectorAll('[data-i18n]').forEach(function (e) {
    e.textContent = t(e.getAttribute('data-i18n'));
  });
  document.querySelectorAll('#langBtn span').forEach(function (s) {
    s.classList.toggle('on', s.getAttribute('data-l') === LANG);
  });
  go(CUR);
}
function toggleLang() {
  LANG = LANG === 'sw' ? 'en' : 'sw';
  localStorage.setItem('mk_lang', LANG);
  applyLang();
  tutPill();
}
function tbl(heads, rows) {
  if (!rows.length) return '<div class="empty">' + t('nothing') + '</div>';
  var h =
    '<div class="tw"><table><tr>' +
    heads
      .map(function (x) {
        return '<th>' + x + '</th>';
      })
      .join('') +
    '</tr>';
  rows.forEach(function (r) {
    h +=
      '<tr>' +
      r
        .map(function (c) {
          return '<td>' + c + '</td>';
        })
        .join('') +
      '</tr>';
  });
  return h + '</table></div>';
}
