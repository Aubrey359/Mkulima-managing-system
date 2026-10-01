// Safaricom calls this after the customer accepts or declines the M-Pesa prompt.
// It is public (Safaricom cannot send a login), so it only accepts requests carrying the secret
// token stored in public.mpesa_config, and it only updates a payment that is still pending and
// whose amount matches.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false }
});
const ok = () =>
  new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
    headers: { 'Content-Type': 'application/json' }
  });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const token = new URL(req.url).searchParams.get('token') || '';
  const { data: cfg } = await admin.from('mpesa_config').select('callback_token').eq('id', 1).maybeSingle();
  if (!cfg || !token || token !== cfg.callback_token) return new Response('Forbidden', { status: 403 });

  let cb: any;
  try {
    cb = (await req.json())?.Body?.stkCallback;
  } catch {
    return new Response('Bad request', { status: 400 });
  }
  if (!cb || !cb.CheckoutRequestID) return new Response('Bad request', { status: 400 });

  const { data: pay } = await admin
    .from('mpesa_payments')
    .select('*')
    .eq('checkout_request_id', cb.CheckoutRequestID)
    .maybeSingle();
  if (!pay) return ok(); // unknown request: acknowledge, change nothing

  const code = Number(cb.ResultCode);
  const items: Record<string, unknown> = {};
  for (const it of cb.CallbackMetadata?.Item || []) items[it.Name] = it.Value;

  // Already marked paid by the app's status check (which has no receipt number): add the receipt
  if (
    pay.status === 'paid' &&
    !pay.mpesa_receipt &&
    code === 0 &&
    Math.round(Number(items.Amount)) === Number(pay.amount)
  ) {
    await admin
      .from('mpesa_payments')
      .update({
        mpesa_receipt: String(items.MpesaReceiptNumber || '') || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', pay.id);
    return ok();
  }
  if (pay.status !== 'pending') return ok(); // already settled: change nothing

  let update: Record<string, unknown>;
  if (code === 0) {
    if (Math.round(Number(items.Amount)) !== Number(pay.amount)) {
      update = {
        status: 'failed',
        result_code: code,
        result_desc: 'Amount paid (' + items.Amount + ') does not match the request'
      };
    } else {
      update = {
        status: 'paid',
        result_code: 0,
        result_desc: cb.ResultDesc || 'Paid',
        mpesa_receipt: String(items.MpesaReceiptNumber || '') || null,
        paid_at: new Date().toISOString()
      };
    }
  } else {
    update = {
      status: code === 1032 ? 'cancelled' : 'failed',
      result_code: code,
      result_desc: cb.ResultDesc || null
    };
  }
  update.updated_at = new Date().toISOString();
  await admin.from('mpesa_payments').update(update).eq('id', pay.id).eq('status', 'pending');
  return ok();
});
