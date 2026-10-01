/* ================= M-PESA (Lipa na M-Pesa, Daraja STK Push) =================
 The app asks the server (Supabase Edge Function "mpesa-stk") to send a payment prompt to the
 customer's phone. The customer enters their M-Pesa PIN; Safaricom confirms to the server and the
 payment row (table mpesa_payments) turns "paid" with the real M-Pesa receipt code.
 Without internet, or when a customer pays to the till by themselves, staff type the M-Pesa code
 from the customer's confirmation SMS instead. */
var MPESA = { poll: null, id: null, started: 0, onPaid: null, lastQuery: 0 };
var MPESA_WAIT_MS = 120000;

// 0712 345 678 / +254712345678 / 712345678 -> 254712345678 (same rule as the server)
function mpesaPhone(raw) {
  var d = String(raw || '').replace(/\D/g, '');
  if (d.charAt(0) === '0') d = '254' + d.slice(1);
  else if (d.length === 9) d = '254' + d;
  return /^254(7|1)\d{8}$/.test(d) ? d : null;
}
// The M-Pesa code typed by staff (e.g. SJK4ABC123): letters and digits, 8-12 long
function mpesaCodeOk(code) {
  return /^[A-Z0-9]{8,12}$/.test(
    String(code || '')
      .trim()
      .toUpperCase()
  );
}
function mpesaErr(e) {
  var m = (e && (e.message || e.error)) || String(e || '');
  if (netErr(e) && !/M-Pesa/.test(m))
    return 'No internet connection — M-Pesa requests need internet. You can type the code from the customer’s SMS instead.';
  return m;
}
// Supabase returns function errors inside a Response; read the JSON message out of it
function mpesaInvoke(body) {
  return SB.functions.invoke('mpesa-stk', { body: body }).then(function (res) {
    if (!res.error) return res.data;
    var ctx = res.error.context;
    if (ctx && typeof ctx.json === 'function')
      return ctx.json().then(
        function (j) {
          throw new Error((j && j.error) || res.error.message);
        },
        function () {
          throw res.error;
        }
      );
    throw res.error;
  });
}

/* Ask the customer to pay. opts: { phone, amount, ref, onPaid(receipt, amount, paymentId) } */
function mpesaRequest(opts) {
  if (!sbInit() || !navigator.onLine) {
    alert(
      'No internet connection — M-Pesa requests need internet. Type the M-Pesa code from the customer’s SMS instead.'
    );
    return;
  }
  MPESA.onPaid = opts.onPaid;
  openModal(
    '<h3><svg class="ic"><use href="#i-phone"/></svg> Request M-Pesa payment</h3>' +
      '<p style="font-size:13px;color:var(--muted);margin:4px 0 12px">The customer gets an M-Pesa prompt on their phone and enters their PIN.</p>' +
      '<div class="frow"><div><label>Customer’s M-Pesa number</label><input id="mp_phone" inputmode="tel" placeholder="07XX XXX XXX" value="' +
      esc(opts.phone || '') +
      '"></div><div><label>Amount (KES)</label><input id="mp_amt" type="number" min="1" value="' +
      Math.round(num(opts.amount)) +
      '"></div></div>' +
      '<div id="mp_msg" style="font-size:13px;min-height:20px;margin:6px 0"></div>' +
      '<div class="rowflex mt"><button class="btn" id="mp_send" onclick="mpesaSend(\'' +
      esc(String(opts.ref || 'Mkulima')).replace(/'/g, '') +
      '\')"><svg class="ic"><use href="#i-phone"/></svg> Send request</button>' +
      '<button class="btn gray" onclick="mpesaClose()">Close</button></div>'
  );
}
function mpesaMsgBox(html, colour) {
  var el = document.getElementById('mp_msg');
  if (el) {
    el.innerHTML = html;
    el.style.color = colour || 'var(--ink)';
  }
}
function mpesaSend(ref) {
  var phone = mpesaPhone(document.getElementById('mp_phone').value),
    amount = Math.round(num(document.getElementById('mp_amt').value));
  if (!phone) return mpesaMsgBox('Enter a Safaricom number, e.g. 0712 345 678', 'var(--red)');
  if (amount < 1) return mpesaMsgBox('Enter an amount of at least KES 1', 'var(--red)');
  document.getElementById('mp_send').disabled = true;
  mpesaMsgBox('Sending request…', 'var(--muted)');
  mpesaInvoke({ action: 'stk', phone: phone, amount: amount, ref: ref }).then(
    function (r) {
      MPESA.id = r.id;
      MPESA.started = Date.now();
      MPESA.lastQuery = 0;
      logAudit('M-Pesa request KES ' + amount + ' to ' + phone);
      mpesaMsgBox(
        '⏳ Waiting for the customer to enter their M-Pesa PIN on ' + esc('0' + phone.slice(3)) + '…',
        'var(--amber)'
      );
      clearInterval(MPESA.poll);
      MPESA.poll = setInterval(mpesaCheck, 3000);
    },
    function (e) {
      document.getElementById('mp_send').disabled = false;
      mpesaMsgBox(esc(mpesaErr(e)), 'var(--red)');
    }
  );
}
function mpesaStop() {
  clearInterval(MPESA.poll);
  MPESA.poll = null;
}
function mpesaClose() {
  mpesaStop();
  closeModal();
}
function mpesaCheck() {
  if (!MPESA.id) return mpesaStop();
  var waited = Date.now() - MPESA.started;
  // Normally Safaricom's confirmation arrives within seconds; after 30s also ask Safaricom directly
  var ask =
    waited > 30000 && Date.now() - MPESA.lastQuery > 10000
      ? ((MPESA.lastQuery = Date.now()), mpesaInvoke({ action: 'query', id: MPESA.id }).catch(function () {}))
      : Promise.resolve();
  ask
    .then(function () {
      return SB.from('mpesa_payments')
        .select('status,mpesa_receipt,result_desc,amount')
        .eq('id', MPESA.id)
        .single();
    })
    .then(function (res) {
      var p = res && res.data;
      if (!p) return;
      if (p.status === 'paid') {
        mpesaStop();
        var id = MPESA.id;
        MPESA.id = null;
        if (p.mpesa_receipt) return mpesaDone(p.mpesa_receipt, p.amount, id);
        // Paid, but Safaricom has not sent the receipt code yet: ask staff to read it off the SMS
        mpesaMsgBox(
          '✓ Paid KES ' +
            Number(p.amount).toLocaleString() +
            '. Type the M-Pesa code from the customer’s SMS: <input id="mp_code" class="upcase" style="width:150px;display:inline-block" placeholder="e.g. SJK4ABC123"> <button class="btn sm" onclick="mpesaManualDone(' +
            p.amount +
            ",'" +
            id +
            '\')">OK</button>',
          'var(--green2)'
        );
      } else if (p.status === 'failed' || p.status === 'cancelled') {
        mpesaStop();
        MPESA.id = null;
        document.getElementById('mp_send').disabled = false;
        mpesaMsgBox(
          (p.status === 'cancelled'
            ? '✕ The customer cancelled the request.'
            : '✕ Payment failed: ' + esc(p.result_desc || '')) + ' You can send it again.',
          'var(--red)'
        );
      } else if (waited > MPESA_WAIT_MS) {
        mpesaStop();
        MPESA.id = null;
        document.getElementById('mp_send').disabled = false;
        mpesaMsgBox(
          'No answer from the customer’s phone after 2 minutes. Send again, or if they paid, type the code from their SMS.',
          'var(--red)'
        );
      }
    });
}
function mpesaManualDone(amount, id) {
  var c = (document.getElementById('mp_code').value || '').trim().toUpperCase();
  if (!mpesaCodeOk(c)) return alert('That does not look like an M-Pesa code (e.g. SJK4ABC123)');
  mpesaDone(c, amount, id);
}
function mpesaDone(receipt, amount, id) {
  sndOk();
  logAudit('M-Pesa paid KES ' + amount + ' — ' + receipt);
  closeModal();
  if (MPESA.onPaid) MPESA.onPaid(receipt, Number(amount), id);
  MPESA.onPaid = null;
}

/* ---------- Sale form ---------- */
function oPayToggle() {
  var w = document.getElementById('o_mwrap');
  if (w) w.style.display = document.getElementById('o_pay').value === 'M-Pesa' ? '' : 'none';
}
function oMpesaRequest() {
  var total = num(document.getElementById('o_total').value),
    paid = num(document.getElementById('o_paid').value);
  if (total <= 0) return alert('Add the items first');
  mpesaRequest({
    phone: document.getElementById('o_phone').value,
    amount: paid > 0 ? paid : total,
    ref: 'Seedlings',
    onPaid: function (receipt, amount, id) {
      document.getElementById('o_mref').value = receipt;
      document.getElementById('o_mref').dataset.payId = id || '';
      document.getElementById('o_paid').value = amount;
      oBal();
      document.getElementById('o_mok').innerHTML =
        '✓ M-Pesa received: KES ' + amount.toLocaleString() + ' — ' + esc(receipt);
    }
  });
}

/* ---------- Settings (Loise) ---------- */
function mpesaSettingsCard() {
  return (
    '<div class="card"><h3><svg class="ic"><use href="#i-phone"/></svg> M-Pesa (Lipa na M-Pesa)</h3>' +
    '<div id="mps_status" style="font-size:13px;margin-bottom:10px;color:var(--muted)">Checking…</div>' +
    '<div class="frow"><div><label>Mode</label><select id="mps_env"><option value="sandbox">Test (Daraja sandbox)</option><option value="production">Live payments</option></select></div>' +
    '<div><label>Account type</label><select id="mps_type" onchange="mpsTypeToggle()"><option value="paybill">Paybill</option><option value="till">Till (Buy Goods)</option></select></div>' +
    '<div><label id="mps_sc_l">Paybill number</label><input id="mps_sc" inputmode="numeric" placeholder="Test mode: leave blank"></div>' +
    '<div id="mps_till_w" style="display:none"><label>Till number</label><input id="mps_till" inputmode="numeric"></div></div>' +
    '<div class="frow"><div><label>Consumer key</label><input id="mps_key" type="password" autocomplete="off" placeholder="unchanged"></div>' +
    '<div><label>Consumer secret</label><input id="mps_secret" type="password" autocomplete="off" placeholder="unchanged"></div>' +
    '<div><label>Passkey</label><input id="mps_pass" type="password" autocomplete="off" placeholder="Test mode: leave blank"></div></div>' +
    '<p style="font-size:12px;color:var(--muted)">Keys come from Safaricom’s Daraja portal (developer.safaricom.co.ke). They are stored on the server only — phones never see them. Leave a key blank to keep the saved one.</p>' +
    '<div class="rowflex mt"><button class="btn" onclick="mpsSave()"><svg class="ic"><use href="#i-save"/></svg> Save M-Pesa settings</button>' +
    '<button class="btn gray" onclick="mpesaRequest({amount:1,ref:\'Test\'})">Send KES 1 test request</button></div></div>'
  );
}
function mpsTypeToggle() {
  var till = document.getElementById('mps_type').value === 'till';
  document.getElementById('mps_till_w').style.display = till ? '' : 'none';
  document.getElementById('mps_sc_l').textContent = till ? 'Store / head-office number' : 'Paybill number';
}
function mpsLoad() {
  var el = document.getElementById('mps_status');
  if (!el) return;
  if (!sbInit() || !navigator.onLine) {
    el.textContent = 'Connect to the internet to see or change M-Pesa settings.';
    return;
  }
  SB.rpc('mpesa_status').then(function (res) {
    var s = res && res.data;
    if (!s || res.error) {
      el.textContent = 'Could not load M-Pesa settings.';
      return;
    }
    if (s.env) document.getElementById('mps_env').value = s.env;
    if (s.type) document.getElementById('mps_type').value = s.type;
    document.getElementById('mps_sc').value = s.shortcode || '';
    document.getElementById('mps_till').value = s.till || '';
    mpsTypeToggle();
    el.innerHTML = s.configured
      ? '<b style="color:var(--green2)">✓ Set up</b> — ' +
        (s.env === 'production' ? 'live payments' : 'test mode') +
        ', ' +
        (s.type === 'till' ? 'Till ' + esc(s.till || '') : 'Paybill ' + esc(s.shortcode || 'sandbox'))
      : '<b style="color:var(--amber)">Not set up yet.</b> Enter the Daraja keys below. Until then, staff type the M-Pesa code from the customer’s SMS.';
  });
}
function mpsSave() {
  if (!sbInit()) return alert(NO_NET);
  var v = function (id) {
    return (document.getElementById(id).value || '').trim();
  };
  SB.rpc('set_mpesa_config', {
    p_env: v('mps_env'),
    p_type: v('mps_type'),
    p_shortcode: v('mps_sc'),
    p_till: v('mps_till'),
    p_consumer_key: v('mps_key'),
    p_consumer_secret: v('mps_secret'),
    p_passkey: v('mps_pass')
  }).then(function (res) {
    if (res.error) return alert('Could not save: ' + mpesaErr(res.error));
    ['mps_key', 'mps_secret', 'mps_pass'].forEach(function (id) {
      document.getElementById(id).value = '';
    });
    logAudit('Changed M-Pesa settings');
    saveDB();
    alert('M-Pesa settings saved.');
    mpsLoad();
  });
}

// For forms without a request button (e.g. other income): ask for the code from the customer's SMS.
// Returns the code, null when left blank, or false when cancelled / not a valid code.
function mpesaAskCode(amount) {
  var c = prompt(
    'M-Pesa code from the confirmation SMS' +
      (amount ? ' (KES ' + Number(amount).toLocaleString() + ')' : '') +
      ' — leave blank if you don’t have it:',
    ''
  );
  if (c === null) return false;
  c = c.trim().toUpperCase();
  if (!c) return null;
  if (!mpesaCodeOk(c)) {
    alert('That M-Pesa code does not look right (e.g. SJK4ABC123)');
    return false;
  }
  return c;
}
