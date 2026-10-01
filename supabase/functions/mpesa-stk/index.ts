// Lipa na M-Pesa: send an STK Push (payment prompt) to a customer's phone, or check on one.
// Called by the app (Loise or Sales only). The M-Pesa keys are read from public.mpesa_config
// with the service role; they never reach the phones.
//
// POST { action: "stk", phone, amount, ref }   -> { id, checkoutRequestId, message }
// POST { action: "query", id }                 -> { status, result_desc }   (fallback if Safaricom's callback is late)
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// Public test values Safaricom publishes for the Daraja sandbox
const SANDBOX_SHORTCODE = '174379';
const SANDBOX_PASSKEY = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
const MAX_AMOUNT = 250000;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// 0712345678 / 712345678 / +254712345678 / 254712345678 -> 254712345678 (Safaricom 07xx and 01xx)
export function normalisePhone(raw: string): string | null {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.startsWith('0')) d = '254' + d.slice(1);
  else if (d.length === 9) d = '254' + d;
  return /^254(7|1)\d{8}$/.test(d) ? d : null;
}

// YYYYMMDDHHmmss in Kenya time (UTC+3), as Daraja expects
function timestamp(): string {
  const t = new Date(Date.now() + 3 * 3600 * 1000).toISOString();
  return t.slice(0, 19).replace(/[-:T]/g, '');
}

async function loadConfig() {
  const { data } = await admin.from('mpesa_config').select('*').eq('id', 1).maybeSingle();
  if (!data) return null;
  const sandbox = data.env !== 'production';
  const cfg = {
    base: sandbox ? 'https://sandbox.safaricom.co.ke' : 'https://api.safaricom.co.ke',
    type: data.type as 'paybill' | 'till',
    shortcode: data.shortcode || (sandbox ? SANDBOX_SHORTCODE : null),
    till: data.till,
    key: data.consumer_key,
    secret: data.consumer_secret,
    passkey: data.passkey || (sandbox ? SANDBOX_PASSKEY : null),
    callbackToken: data.callback_token as string
  };
  if (!cfg.shortcode || !cfg.key || !cfg.secret || !cfg.passkey || (cfg.type === 'till' && !cfg.till))
    return null;
  return cfg;
}

async function accessToken(cfg: { base: string; key: string; secret: string }) {
  const r = await fetch(cfg.base + '/oauth/v1/generate?grant_type=client_credentials', {
    headers: { Authorization: 'Basic ' + btoa(cfg.key + ':' + cfg.secret) }
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok || !body.access_token)
    throw new Error('M-Pesa rejected the consumer key/secret (check Settings → M-Pesa)');
  return body.access_token as string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'Use POST' });

  // Who is calling? Only Loise and Sales may take payments.
  const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const { data: userData } = await admin.auth.getUser(jwt);
  const role = userData?.user?.app_metadata?.role;
  if (role !== 'loise' && role !== 'sales')
    return json(403, { error: 'Only Loise and Sales can take M-Pesa payments' });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Bad request' });
  }

  const cfg = await loadConfig();
  if (!cfg)
    return json(400, {
      error: 'M-Pesa is not set up yet. Loise: open Settings → M-Pesa and enter the Daraja keys.'
    });

  try {
    const ts = timestamp();
    const password = btoa(cfg.shortcode + cfg.passkey + ts);

    if (body.action === 'query') {
      const { data: pay } = await admin
        .from('mpesa_payments')
        .select('*')
        .eq('id', String(body.id || ''))
        .maybeSingle();
      if (!pay) return json(404, { error: 'Payment not found' });
      if (pay.status !== 'pending')
        return json(200, {
          status: pay.status,
          result_desc: pay.result_desc,
          mpesa_receipt: pay.mpesa_receipt
        });
      const token = await accessToken(cfg);
      const r = await fetch(cfg.base + '/mpesa/stkpushquery/v1/query', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          BusinessShortCode: cfg.shortcode,
          Password: password,
          Timestamp: ts,
          CheckoutRequestID: pay.checkout_request_id
        })
      });
      const q = await r.json().catch(() => ({}));
      // Still being processed on the customer's phone
      if (q.errorCode || q.ResultCode === undefined) return json(200, { status: 'pending' });
      const code = Number(q.ResultCode);
      // Paid: the query does not return the receipt number; the callback normally fills it in
      const status = code === 0 ? 'paid' : code === 1032 ? 'cancelled' : 'failed';
      await admin
        .from('mpesa_payments')
        .update({
          status,
          result_code: code,
          result_desc: q.ResultDesc || null,
          paid_at: code === 0 ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', pay.id)
        .eq('status', 'pending');
      return json(200, { status, result_desc: q.ResultDesc || null, mpesa_receipt: null });
    }

    // action: stk
    const phone = normalisePhone(String(body.phone || ''));
    if (!phone) return json(400, { error: 'Enter a Safaricom number, e.g. 0712 345 678' });
    const amount = Math.round(Number(body.amount));
    if (!Number.isFinite(amount) || amount < 1)
      return json(400, { error: 'Enter an amount of at least KES 1' });
    if (amount > MAX_AMOUNT)
      return json(400, {
        error: 'M-Pesa allows at most KES ' + MAX_AMOUNT.toLocaleString() + ' per payment'
      });
    const ref =
      String(body.ref || 'Mkulima')
        .replace(/[^A-Za-z0-9 -]/g, '')
        .slice(0, 12) || 'Mkulima';

    const token = await accessToken(cfg);
    const callback = SUPABASE_URL + '/functions/v1/mpesa-callback?token=' + cfg.callbackToken;
    const r = await fetch(cfg.base + '/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        BusinessShortCode: cfg.shortcode,
        Password: password,
        Timestamp: ts,
        TransactionType: cfg.type === 'till' ? 'CustomerBuyGoodsOnline' : 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phone,
        PartyB: cfg.type === 'till' ? cfg.till : cfg.shortcode,
        PhoneNumber: phone,
        CallBackURL: callback,
        AccountReference: ref,
        TransactionDesc: 'Seedlings'
      })
    });
    const s = await r.json().catch(() => ({}));
    if (!r.ok || String(s.ResponseCode) !== '0') {
      return json(502, {
        error: 'M-Pesa did not accept the request: ' + (s.errorMessage || s.ResponseDescription || r.status)
      });
    }
    const { data: row, error } = await admin
      .from('mpesa_payments')
      .insert({
        checkout_request_id: s.CheckoutRequestID,
        merchant_request_id: s.MerchantRequestID,
        phone,
        amount,
        account_ref: ref,
        created_by: userData.user!.id
      })
      .select('id')
      .single();
    if (error) throw error;
    return json(200, {
      id: row.id,
      checkoutRequestId: s.CheckoutRequestID,
      message: s.CustomerMessage || 'Request sent'
    });
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : String(e) });
  }
});
